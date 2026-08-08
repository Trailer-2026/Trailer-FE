import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useVideoPlayer,
  VideoView,
  type VideoThumbnail,
} from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { captureFromCamera } from "@/src/features/reels/capture";
import MediaSourceSheet, {
  type MediaSource,
} from "@/src/features/reels/components/MediaSourceSheet";
import VideoTimeline from "@/src/features/reels/components/VideoTimeline";
import { useReelsCreateStore } from "@/src/features/reels/create-store";
import { formatClock, toReelsMediaAsset } from "@/src/features/reels/media";
import type { ReelsMediaAsset } from "@/src/features/reels/types";
import {
  useCutVideoSection,
  useInsertImageClip,
} from "@/src/features/video/queries";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
const DANGER = "#E5484D";

/** 영상 길이를 확인하는 주기(ms). 재생 위치는 timeUpdate 이벤트로 받는다. */
const DURATION_TICK_MS = 300;
/** timeUpdate 이벤트 주기(초). seek 완료 확인 지연이 이 값 이하가 된다. */
const TIME_UPDATE_INTERVAL = 0.1;
/** seek 도착으로 인정할 오차(초). 인코딩상 요청 시각과 정확히 같지 않다. */
const SEEK_EPSILON = 0.12;
/** seek 완료 이벤트가 안 올 때 포기하고 다음 요청으로 넘어가는 시간(ms). */
const SEEK_TIMEOUT_MS = 1200;

/** 타임라인 필름스트립용 프레임 수 — 바 폭만 채우면 되므로 적게, 작게. */
const FILMSTRIP_COUNT = 24;
const FILMSTRIP_WIDTH = 96;
/** 스크럽 미리보기 프레임 — 촘촘할수록 좋지만 메모리가 든다(장당 약 180×320×4B). */
const PREVIEW_MAX_FRAMES = 60;
const PREVIEW_MIN_STEP = 0.2; // 초. 짧은 영상이라도 이보다 촘촘하게는 안 뽑는다
const PREVIEW_WIDTH = 180;
/** 한 번에 요청할 프레임 수 — 나눠 받아야 초반부터 미리보기가 동작한다. */
const PREVIEW_BATCH = 12;

/**
 * 완성된 릴스 영상 편집 화면.
 *
 * 서버 편집 API(/edit/cut, /edit/insert)는 편집본을 올리고 **이전 영상을 지운다** —
 * 되돌리기가 없어서 실행 전 확인을 받고, 화면에도 계속 경고를 띄운다.
 * 편집이 끝나면 응답의 새 video_url 로 플레이어 소스를 갈아끼운다(릴스 PK 는 그대로).
 */
export default function ReelsStudioScreen() {
  const { reels_idx, url } = useLocalSearchParams<{
    reels_idx?: string;
    url?: string;
  }>();
  const reelsIdx =
    reels_idx != null && Number.isFinite(Number(reels_idx))
      ? Number(reels_idx)
      : null;

  const [source, setSource] = useState<string | null>(url ?? null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  // 구간 선택 모드 — 켜면 타임라인에 좌우로 늘리는 선택 영역이 나온다.
  const [editing, setEditing] = useState(false);
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [sheetOpen, setSheetOpen] = useState(false);
  // 타임라인 필름스트립용(성긴 프레임) / 스크럽 미리보기용(촘촘한 프레임)을 나눠 캐시한다.
  const [filmstrip, setFilmstrip] = useState<VideoThumbnail[]>([]);
  const [previews, setPreviews] = useState<VideoThumbnail[]>([]);
  const previewStepRef = useRef(0);
  /** 미리보기 오버레이 표시 여부 — 스크럽 중 + 마지막 seek 가 화면에 반영될 때까지. */
  const [overlayVisible, setOverlayVisible] = useState(false);
  /** 오버레이가 보여줄 시각(=손가락 위치). position 과 분리해 폴링에 오염되지 않게 한다. */
  const [previewTime, setPreviewTime] = useState(0);

  const clearAssets = useReelsCreateStore((s) => s.clear);
  const cut = useCutVideoSection();
  const insert = useInsertImageClip();
  const busy = cut.isPending || insert.isPending;

  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
  });

  // ── 스크럽 seek 제어 (전부 ref — 고빈도라 state/useEffect 체인을 태우지 않는다) ──
  /** 손가락이 가리키는 최신 시각. 중간 값은 버리고 항상 이 값만 쫓아간다(latest-wins). */
  const requestedRef = useRef(0);
  /** 지금 네이티브로 보낸 seek 시각. null 이면 대기 중인 seek 없음. */
  const inFlightRef = useRef<number | null>(null);
  /** 마지막으로 화면에 반영된 것으로 확인된 시각. */
  const appliedRef = useRef(0);
  const scrubbingRef = useRef(false);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 최신 pumpSeek — settleSeek 이 펌프를 다시 부를 때 쓴다(선언 순환 회피). */
  const pumpRef = useRef<() => void>(() => {});

  /** seek 한 건이 끝난 것으로 처리하고, 그 사이 들어온 최신 요청을 이어서 보낸다. */
  const settleSeek = useCallback((time: number) => {
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = null;
    }
    inFlightRef.current = null;
    appliedRef.current = time;
    pumpRef.current();
  }, []);

  /**
   * seek 펌프 — 동시에 한 건만 네이티브로 보낸다.
   *
   * 요청이 밀려도 큐를 쌓지 않고 requestedRef(최신값)만 남기므로, 손을 뗐을 때
   * 항상 마지막 위치로 수렴한다. 1.0→1.5 를 빠르게 지나가면 중간 값들은 그냥 버려진다.
   */
  const pumpSeek = useCallback(() => {
    if (inFlightRef.current != null) return; // 응답 대기 중 — 끝나면 최신값으로 다시 부른다
    const target = requestedRef.current;
    if (Math.abs(target - appliedRef.current) < SEEK_EPSILON) {
      // 이미 그 프레임이 떠 있다 → 스크럽이 끝났으면 오버레이를 걷는다.
      if (!scrubbingRef.current) setOverlayVisible(false);
      return;
    }
    inFlightRef.current = target;
    player.currentTime = target;
    // timeUpdate 가 안 오는 경우(정지 상태·플랫폼 차이)를 대비한 안전장치.
    seekTimeoutRef.current = setTimeout(() => settleSeek(target), SEEK_TIMEOUT_MS);
  }, [player, settleSeek]);

  useEffect(() => {
    pumpRef.current = pumpSeek;
  }, [pumpSeek]);

  /**
   * 재생 위치 수신 + seek 완료 확인.
   *
   * 스크럽 중에는 position 을 건드리지 않는다 — 네이티브 시각은 밀린 값이라
   * 재생헤드와 미리보기 프레임을 과거로 되돌려 버린다.
   */
  useEffect(() => {
    player.timeUpdateEventInterval = TIME_UPDATE_INTERVAL;
    const sub = player.addListener("timeUpdate", ({ currentTime }) => {
      const inFlight = inFlightRef.current;
      if (inFlight != null) {
        if (Math.abs(currentTime - inFlight) <= SEEK_EPSILON) settleSeek(inFlight);
        return; // seek 처리 중의 중간 시각은 UI 에 반영하지 않는다
      }
      if (!scrubbingRef.current) setPosition(currentTime);
    });
    return () => sub.remove();
  }, [player, settleSeek]);

  // 길이만 폴링한다(로드·편집 후 갱신). 위치는 timeUpdate 로 받는다.
  useEffect(() => {
    const id = setInterval(() => setDuration(player.duration), DURATION_TICK_MS);
    return () => clearInterval(id);
  }, [player]);

  // 화면을 떠날 때 남은 타이머 정리.
  useEffect(
    () => () => {
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    },
    [],
  );

  /** 편집 성공 → 새 영상으로 교체하고 선택 모드·프레임 캐시를 초기화. */
  const applyEdited = (videoUrl: string) => {
    setSource(videoUrl);
    setEditing(false);
    setPosition(0);
    setPreviewTime(0);
    setOverlayVisible(false);
    // 이전 영상 프레임이 남아 있으면 새 영상 위에 엉뚱한 미리보기가 뜬다.
    setPreviews([]);
    setFilmstrip([]);
    requestedRef.current = 0;
    appliedRef.current = 0;
    inFlightRef.current = null;
  };

  /** 편집하기 — 재생 위치부터 기본 2초 구간을 잡아준다(양끝을 끌어 조절). */
  const startEditing = () => {
    if (duration <= 0) return;
    const start = Math.min(position, Math.max(0, duration - 0.5));
    setRange({ start, end: Math.min(start + 2, duration) });
    setEditing(true);
    player.pause();
  };

  /**
   * 타임라인 드래그 중 탐색.
   *
   * 화면에 보이는 건 미리 뽑아 둔 프레임 사진이라 손가락을 그대로 따라온다.
   * 실제 seek 는 펌프가 latest-wins 로 따라잡는다(중간 요청은 버림).
   */
  const seek = (seconds: number) => {
    setPosition(seconds);
    setPreviewTime(seconds);
    requestedRef.current = seconds;
    pumpSeek();
  };

  const onScrubStart = () => {
    player.pause(); // 스크럽 중엔 절대 재생하지 않는다
    scrubbingRef.current = true;
    setOverlayVisible(true);
  };

  const onScrubEnd = (seconds: number) => {
    scrubbingRef.current = false;
    seek(seconds);
    // 오버레이는 여기서 걷지 않는다 — 마지막 seek 가 화면에 반영된 뒤(pumpSeek)
    // 걷어야 몇 초 전 프레임이 잠깐 노출되지 않는다.
  };

  /**
   * 프레임 캐시 생성 — 영상이 바뀔 때마다(편집 후 포함) 다시 뽑는다.
   *
   * 1) 필름스트립: 24장, 작게. 타임라인 바를 채우는 용도.
   * 2) 스크럽 미리보기: 최대 60장(간격은 길이에 따라 0.2초 이상). 20초 영상이면 0.33초 간격,
   *    180px 폭 × 60장 ≈ 14MB 로 안드로이드 힙에도 부담이 크지 않다.
   *    12장씩 나눠 받아 초반부터 미리보기가 동작하고, 화면을 떠나면 중간에 멈춘다.
   */
  useEffect(() => {
    if (duration <= 0) return;
    let alive = true;

    (async () => {
      const stripStep = duration / FILMSTRIP_COUNT;
      const strip = await player
        .generateThumbnailsAsync(
          Array.from({ length: FILMSTRIP_COUNT }, (_, i) => i * stripStep),
          { maxWidth: FILMSTRIP_WIDTH },
        )
        .catch(() => [] as VideoThumbnail[]);
      if (!alive) return;
      setFilmstrip(strip);

      const step = Math.max(PREVIEW_MIN_STEP, duration / PREVIEW_MAX_FRAMES);
      previewStepRef.current = step;
      const times = Array.from(
        { length: Math.floor(duration / step) + 1 },
        (_, i) => i * step,
      );
      const collected: VideoThumbnail[] = [];
      for (let i = 0; i < times.length; i += PREVIEW_BATCH) {
        const batch = await player
          .generateThumbnailsAsync(times.slice(i, i + PREVIEW_BATCH), {
            maxWidth: PREVIEW_WIDTH,
          })
          .catch(() => [] as VideoThumbnail[]);
        if (!alive) return;
        collected.push(...batch);
        setPreviews([...collected]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [player, duration, source]);

  /** 손가락이 가리키는 시각에 가장 가까운 프레임. 등간격이라 인덱스 계산 한 번이면 끝. */
  const previewThumb =
    previews.length > 0 && previewStepRef.current > 0
      ? previews[
          Math.min(
            previews.length - 1,
            Math.max(0, Math.round(previewTime / previewStepRef.current)),
          )
        ]
      : null;

  const confirmCut = () => {
    if (reelsIdx == null || !editing) return;
    Alert.alert(
      "이 구간을 지울까요?",
      `${formatClock(range.start)} ~ ${formatClock(range.end)} 구간이 영상에서 사라져요.\n` +
        "편집하면 이전 영상은 서버에서 삭제돼 되돌릴 수 없어요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "지우기",
          style: "destructive",
          onPress: () =>
            cut.mutate(
              {
                reelsIdx,
                startSeconds: range.start,
                endSeconds: range.end,
              },
              {
                onSuccess: (res) => applyEdited(res.video_url),
                onError: (err) =>
                  Alert.alert("구간 삭제 실패", describeApiError(err)),
              },
            ),
        },
      ],
    );
  };

  const pickPhoto = async (mediaSource: MediaSource): Promise<ReelsMediaAsset | null> => {
    if (mediaSource === "camera") {
      const media = await captureFromCamera();
      return media?.[0] ?? null;
    }
    // 삽입용 사진은 GPS·촬영시각이 필요 없어 시스템 피커로 충분하다.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "사진을 넣으려면 갤러리 접근 권한이 필요해요.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled) return null;
    return toReelsMediaAsset(result.assets[0]);
  };

  const onInsert = async (mediaSource: MediaSource) => {
    setSheetOpen(false);
    if (reelsIdx == null) return;
    const photo = await pickPhoto(mediaSource);
    if (!photo) return;
    const at = position;
    Alert.alert(
      "여기에 사진을 넣을까요?",
      `${formatClock(at)} 지점에서 영상이 멈추고 사진이 나와요.\n` +
        "편집하면 이전 영상은 서버에서 삭제돼 되돌릴 수 없어요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "넣기",
          onPress: () =>
            insert.mutate(
              { reelsIdx, atSeconds: at, photo },
              {
                onSuccess: (res) => applyEdited(res.video_url),
                onError: (err) =>
                  Alert.alert("사진 삽입 실패", describeApiError(err)),
              },
            ),
        },
      ],
    );
  };

  const done = () => {
    clearAssets();
    router.dismissAll();
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 헤더 */}
      <View
        className="flex-row items-center justify-between"
        style={{ paddingHorizontal: scale(20), paddingTop: verticalScale(16) }}
      >
        <Pressable
          onPress={done}
          hitSlop={12}
          style={{ width: scale(28) }}
          accessibilityRole="button"
          accessibilityLabel="편집 마치기"
        >
          <BackIcon
            color="#FFFFFF"
            width={moderateScale(20)}
            height={moderateScale(20)}
          />
        </Pressable>
        <Text
          className="font-semibold text-white"
          style={{ fontSize: moderateScale(16) }}
        >
          영상 편집
        </Text>
        <Pressable
          onPress={done}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="완료"
        >
          <Text
            className="font-semibold"
            style={{ color: ACCENT, fontSize: moderateScale(15) }}
          >
            완료
          </Text>
        </Pressable>
      </View>

      {/* 미리보기 — 네이티브 컨트롤로 넘겨 보면서 지점을 고른다. */}
      <View className="flex-1 items-center justify-center">
        {source ? (
          <View
            style={{
              width: scale(236),
              height: verticalScale(400),
              borderRadius: scale(12),
              overflow: "hidden",
              backgroundColor: "#000000",
            }}
          >
            <VideoView
              player={player}
              style={{ width: "100%", height: "100%" }}
              contentFit="contain"
              // 타임라인이 탐색을 맡으므로 네이티브 컨트롤은 끈다(영상 위를 가린다).
              nativeControls={false}
            />

            {/* 끄는 동안 + 마지막 seek 가 반영될 때까지 프레임 사진을 덮어 보여준다. */}
            {overlayVisible && previewThumb ? (
              <Image
                source={previewThumb}
                style={{ position: "absolute", width: "100%", height: "100%" }}
                contentFit="contain"
              />
            ) : null}

            {/* 재생/일시정지 — 컨트롤을 끈 대신 최소한의 버튼만 */}
            <Pressable
              onPress={() => (player.playing ? player.pause() : player.play())}
              className="absolute items-center justify-center"
              style={{
                left: scale(8),
                bottom: scale(8),
                width: scale(36),
                height: scale(36),
                borderRadius: scale(18),
                backgroundColor: "rgba(0,0,0,0.55)",
              }}
              accessibilityRole="button"
              accessibilityLabel={player.playing ? "일시정지" : "재생"}
            >
              <Text
                className="text-white"
                style={{ fontSize: moderateScale(14) }}
              >
                {player.playing ? "❚❚" : "▶"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text className="text-gray-400" style={{ fontSize: moderateScale(13) }}>
            영상 주소를 받지 못했어요.
          </Text>
        )}
      </View>

      <ScrollView
        style={{ maxHeight: verticalScale(250) }}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingBottom: verticalScale(16),
          gap: verticalScale(12),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 되돌릴 수 없다는 경고 — 편집 전에 항상 보이게 상단 고정. */}
        <View
          style={{
            backgroundColor: "rgba(229,72,77,0.12)",
            borderRadius: scale(10),
            borderWidth: 1,
            borderColor: "rgba(229,72,77,0.4)",
            padding: scale(12),
          }}
        >
          <Text
            style={{
              color: "#FF9EA2",
              fontSize: moderateScale(12),
              lineHeight: moderateScale(18),
            }}
          >
            편집은 즉시 영상에 반영돼요. 이전 영상은 서버에서 지워지고{"\n"}
            <Text className="font-bold" style={{ color: "#FF9EA2" }}>
              되돌릴 수 없어요.
            </Text>
          </Text>
        </View>

        {/* 타임라인 — 끌어서 탐색, 편집 모드면 좌우 핸들로 구간 지정 */}
        <VideoTimeline
          duration={duration}
          position={position}
          editing={editing}
          range={range}
          thumbnails={filmstrip}
          onSeek={seek}
          onScrubStart={onScrubStart}
          onScrubEnd={onScrubEnd}
          onRangeChange={setRange}
        />

        {editing ? (
          <View className="flex-row" style={{ gap: scale(8) }}>
            <View className="flex-1">
              <ActionButton
                label="선택 구간 지우기"
                color={DANGER}
                disabled={busy}
                loading={cut.isPending}
                onPress={confirmCut}
              />
            </View>
            <Chip label="취소" active={false} onPress={() => setEditing(false)} />
          </View>
        ) : (
          <View className="flex-row" style={{ gap: scale(8) }}>
            <View className="flex-1">
              <ActionButton
                label="편집하기 (구간 선택)"
                color={DANGER}
                disabled={busy || duration <= 0}
                loading={false}
                onPress={startEditing}
              />
            </View>
            <View className="flex-1">
              <ActionButton
                label={`${formatClock(position)}에 사진 넣기`}
                color={ACCENT}
                disabled={busy || !source}
                loading={insert.isPending}
                onPress={() => setSheetOpen(true)}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <MediaSourceSheet
        visible={sheetOpen}
        onSelect={onInsert}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-70"
      style={{
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(7),
        borderRadius: scale(14),
        backgroundColor: active ? ACCENT : "#2A2A2A",
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        className={active ? "font-semibold text-white" : "text-gray-300"}
        style={{ fontSize: moderateScale(12) }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  color,
  disabled,
  loading,
  onPress,
}: {
  label: string;
  color: string;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="w-full items-center justify-center active:opacity-80"
      style={{
        height: verticalScale(44),
        borderRadius: scale(12),
        backgroundColor: color,
        opacity: disabled ? 0.4 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          className="font-semibold text-white"
          style={{ fontSize: moderateScale(14) }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
