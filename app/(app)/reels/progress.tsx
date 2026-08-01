import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { useReelsCreateStore } from "@/src/features/reels/create-store";
import { useActiveRenderStore } from "@/src/features/video/active-render-store";
import { describeRenderError } from "@/src/features/video/errors";
import { isRenderNotFound, useRenderStatus } from "@/src/features/video/queries";
import type { VideoRenderStatusResponse } from "@/src/features/video/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

/** 서버 phase 문자열 → 사용자용 라벨. 모르는 값이면 원문/기본 문구로 폴백. */
function phaseLabel(phase: string, percent: number): string {
  const map: Record<string, string> = {
    prepare: "렌더 준비 중",
    prepared: "렌더 준비 중",
    setup: "렌더 준비 중",
    render: "프레임 렌더링 중",
    rendering: "프레임 렌더링 중",
    encode: "후처리 중",
    encoding: "후처리 중",
    post: "후처리 중",
    postprocess: "후처리 중",
    upload: "업로드 중",
    done: "완료",
    complete: "완료",
  };
  const key = phase?.toLowerCase().trim();
  if (key && map[key]) return map[key];
  if (percent >= 100) return "마무리 중";
  return phase?.trim() ? phase : "렌더링 중";
}

/** 남은 시간(초) → "3분 20초" / "45초". */
function formatEta(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m > 0) return `${m}분 ${rest}초`;
  return `${rest}초`;
}

export default function ReelsProgressScreen() {
  const { reels_idx } = useLocalSearchParams<{ reels_idx?: string }>();
  const reelsIdx =
    reels_idx != null && Number.isFinite(Number(reels_idx))
      ? Number(reels_idx)
      : null;

  const clearAssets = useReelsCreateStore((s) => s.clear);
  const setOnProgressScreen = useActiveRenderStore((s) => s.setOnProgressScreen);
  const acknowledge = useActiveRenderStore((s) => s.acknowledge);
  const { data, error } = useRenderStatus(reelsIdx);

  // 이 화면을 보고 있는 동안엔 전역 배너를 띄우지 않는다(화면이 직접 결과 표시).
  useFocusEffect(
    useCallback(() => {
      setOnProgressScreen(true);
      return () => setOnProgressScreen(false);
    }, [setOnProgressScreen]),
  );

  // 여기서 완료/실패/미확인을 확인했으면 전역 추적 종료 → 배너 중복·헛폴링 방지.
  useEffect(() => {
    if (
      data &&
      (data.status === "done" ||
        data.status === "failed" ||
        data.status === "unknown")
    ) {
      acknowledge();
    }
  }, [data, acknowledge]);

  // 편집 화면으로 되돌아가 옵션을 바꿔 다시 시도(선택한 사진은 store 에 그대로 남아있다).
  const retry = () => router.back();

  // 완료 후 피드로 — 릴스 스택(create/gallery/edit/progress)을 모두 닫고 탭으로 복귀.
  const goToFeed = () => {
    clearAssets();
    router.dismissAll();
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center" style={{ padding: scale(24) }}>
        {renderBody()}
      </View>
    </SafeAreaView>
  );

  function renderBody() {
    // 폴링 중 404 → 릴스가 사라짐.
    if (error && isRenderNotFound(error)) {
      return (
        <ErrorState
          title="작업 정보를 찾을 수 없어요"
          message="다시 시도해 주세요."
          onRetry={retry}
        />
      );
    }
    // 그 외 조회 실패 — 실제 원인을 노출(타임아웃/네트워크/HTTP 상태·서버 메시지)
    if (error && !data) {
      return (
        <ErrorState
          title="진행 상황을 불러오지 못했어요"
          message={`${describeRenderError(error)}\n(reels_idx: ${reelsIdx ?? "없음"})`}
          onRetry={retry}
        />
      );
    }
    // 첫 응답 전
    if (!data) {
      return (
        <View className="items-center" style={{ gap: verticalScale(16) }}>
          <ActivityIndicator color={ACCENT} size="large" />
          <Text className="text-white" style={{ fontSize: moderateScale(14) }}>
            렌더 준비 중…
          </Text>
        </View>
      );
    }

    if (data.status === "failed") {
      return (
        <ErrorState
          title="영상 만들기에 실패했어요"
          message={data.error ?? "잠시 후 다시 시도해 주세요."}
          onRetry={retry}
        />
      );
    }

    // unknown = 서버 재시작으로 진행 정보가 사라진 미완료 릴스
    if (data.status === "unknown") {
      return (
        <ErrorState
          title="진행 정보를 찾을 수 없어요"
          message={data.error ?? "서버가 재시작돼 진행 정보가 사라졌어요. 다시 시도해 주세요."}
          onRetry={retry}
        />
      );
    }

    if (data.status === "done") {
      return <DoneState status={data} onFeed={goToFeed} />;
    }

    // running
    return <RunningState status={data} />;
  }
}

/** 진행 중 — 진행바 + 단계/ETA/프레임. */
function RunningState({ status }: { status: VideoRenderStatusResponse }) {
  const percent = Math.max(0, Math.min(100, Math.round(status.percent)));
  return (
    <View className="w-full items-center" style={{ gap: verticalScale(20) }}>
      <ActivityIndicator color={ACCENT} size="large" />

      <Text
        className="font-semibold text-white"
        style={{ fontSize: moderateScale(16) }}
      >
        {phaseLabel(status.phase, status.percent)}
      </Text>

      {/* 진행바 */}
      <View className="w-full" style={{ gap: verticalScale(8) }}>
        <View
          className="w-full overflow-hidden"
          style={{
            height: verticalScale(8),
            borderRadius: scale(4),
            backgroundColor: "#2A2A2A",
          }}
        >
          <View
            style={{
              width: `${percent}%`,
              height: "100%",
              borderRadius: scale(4),
              backgroundColor: ACCENT,
            }}
          />
        </View>
        <Text
          className="text-right text-gray-300"
          style={{ fontSize: moderateScale(12) }}
        >
          {percent}%
        </Text>
      </View>

      {status.eta_seconds != null && (
        <Text className="text-gray-400" style={{ fontSize: moderateScale(12) }}>
          예상 남은 시간 {formatEta(status.eta_seconds)}
        </Text>
      )}

      {status.total_frames != null && (
        <Text className="text-gray-500" style={{ fontSize: moderateScale(11) }}>
          {status.frame} / {status.total_frames} 프레임
        </Text>
      )}

      <Text
        className="text-center text-gray-500"
        style={{
          fontSize: moderateScale(11),
          marginTop: verticalScale(4),
          lineHeight: moderateScale(16),
        }}
      >
        영상은 서버에서 만들어져요.{"\n"}다른 화면을 봐도 되고, 완료되면 알려드릴게요.
      </Text>

      <Pressable
        onPress={() => router.dismissAll()}
        className="active:opacity-70"
        style={{ marginTop: verticalScale(8), paddingVertical: verticalScale(8) }}
        accessibilityRole="button"
        accessibilityLabel="계속 둘러보기"
      >
        <Text
          className="font-semibold"
          style={{ color: ACCENT, fontSize: moderateScale(14) }}
        >
          계속 둘러보기
        </Text>
      </Pressable>
    </View>
  );
}

/** 완료 — 인앱 영상 재생 + 피드로 이동. */
function DoneState({
  status,
  onFeed,
}: {
  status: VideoRenderStatusResponse;
  onFeed: () => void;
}) {
  const source = status.video_url ?? status.reels_url;
  // 완료 화면 진입 시 자동 재생(반복). 세로 영상이라 contain 으로 맞춘다.
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <View className="w-full items-center" style={{ gap: verticalScale(16) }}>
      <Text className="font-bold text-white" style={{ fontSize: moderateScale(20) }}>
        완성! 🎉
      </Text>

      {source ? (
        <VideoView
          player={player}
          style={{
            width: scale(224),
            height: verticalScale(392),
            borderRadius: scale(12),
            backgroundColor: "#000000",
          }}
          contentFit="contain"
          allowsFullscreen
          nativeControls
        />
      ) : (
        <Text className="text-gray-400" style={{ fontSize: moderateScale(13) }}>
          영상 주소를 받지 못했어요.
        </Text>
      )}

      <View className="w-full">
        <SecondaryButton label="피드로 이동" onPress={onFeed} />
      </View>
    </View>
  );
}

/** 오류/실패 공용 — 메시지 + 다시 시도(편집으로 복귀). */
function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="w-full items-center" style={{ gap: verticalScale(16) }}>
      <Text
        className="text-center font-semibold text-white"
        style={{ fontSize: moderateScale(17) }}
      >
        {title}
      </Text>
      <Text
        className="text-center text-gray-400"
        style={{ fontSize: moderateScale(13), lineHeight: moderateScale(19) }}
        selectable
      >
        {message}
      </Text>
      <View className="w-full" style={{ marginTop: verticalScale(8) }}>
        <PrimaryButton label="다시 시도" onPress={onRetry} />
      </View>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full items-center active:opacity-80"
      style={{
        height: verticalScale(48),
        borderRadius: scale(12),
        backgroundColor: ACCENT,
        justifyContent: "center",
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        className="font-semibold text-white"
        style={{ fontSize: moderateScale(15) }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full items-center active:opacity-70"
      style={{
        height: verticalScale(48),
        borderRadius: scale(12),
        borderWidth: 1,
        borderColor: "#3A3A3A",
        justifyContent: "center",
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text className="text-white" style={{ fontSize: moderateScale(15) }}>
        {label}
      </Text>
    </Pressable>
  );
}
