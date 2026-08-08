import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ChevronDownIcon from "@/src/components/icons/ChevronDownIcon";
import { Text } from "@/src/components/Text";
import { useReelsCreateStore } from "@/src/features/reels/create-store";
import { toReelsMediaFromLibrary } from "@/src/features/reels/media";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
const PAGE_SIZE = 60;
const COLS = 3;
const GAP = 2;

type Filter = "all" | "photo" | "video";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "video", label: "비디오" },
  { key: "photo", label: "사진" },
  { key: "all", label: "모든 파일" },
];

function mediaTypesFor(filter: Filter): MediaLibrary.MediaTypeValue[] {
  if (filter === "photo") return ["photo"];
  if (filter === "video") return ["video"];
  return ["photo", "video"];
}

/**
 * 영상 생성에 쓸 수 있는 항목만 남긴다 — 위치(EXIF GPS) + 촬영시각이 둘 다 있어야
 * 서버가 이동 경로를 그린다(없으면 렌더 요청이 400). 캡처·다운로드 사진은 대개 위치가 없다.
 *
 * 조회한 원본 정보는 cache 에 담아 확정 단계에서 재사용한다.
 * ponytail: 페이지마다 60건을 병렬로 읽는다. 사진 수천 장에서 느려지면
 *           PAGE_SIZE 를 줄이거나 화면에 보이는 칸부터 lazy 로 검사할 것.
 */
async function filterUsable(
  assets: MediaLibrary.Asset[],
  cache: Map<string, MediaLibrary.AssetInfo>,
): Promise<MediaLibrary.Asset[]> {
  const infos = await Promise.all(
    assets.map((asset) =>
      MediaLibrary.getAssetInfoAsync(asset).catch(() => null),
    ),
  );
  return assets.filter((asset, i) => {
    const info = infos[i];
    // EXIF 촬영시각이 없으면 MediaStore DATE_TAKEN 이 -1 로 온다(0 이 아니다).
    if (!info?.location || !(info.creationTime > 0)) return false;
    cache.set(asset.id, info);
    return true;
  });
}

/**
 * 커스텀 갤러리 그리드 — expo-media-library 로 사진/영상을 직접 읽는다.
 *
 * 시스템 피커와 달리 원본 asset 을 조회하므로, 확정 시 각 항목의 위치·촬영시각을 확실히 얻는다.
 * mode=new  : 첫 선택 → 스토어 교체 후 편집 화면으로
 * mode=add  : 편집 화면에서 추가 → 스토어에 이어붙이고 뒤로
 */
export default function ReelsGalleryScreen() {
  const { mode } = useLocalSearchParams<{ mode?: "new" | "add" }>();
  const setStoreAssets = useReelsCreateStore((s) => s.setAssets);
  const addStoreAssets = useReelsCreateStore((s) => s.addAssets);

  const { width } = useWindowDimensions();
  const cell = (width - GAP * (COLS - 1)) / COLS;

  // 'checking' 동안엔 아무 것도 로드하지 않는다 — 권한 승인 전 getAssetsAsync 호출 방지.
  const [permStatus, setPermStatus] = useState<
    "checking" | "granted" | "denied" | "blocked"
  >("checking");
  const [filter, setFilter] = useState<Filter>("all");

  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);

  // 앨범 선택 (undefined = 최근/전체)
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [album, setAlbum] = useState<MediaLibrary.Album | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);

  // 선택 순서 유지 — id 배열
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  // 그리드에 남긴 항목의 원본 정보(위치·촬영시각). 필터링하며 이미 읽었으므로
  // 확정할 때 다시 조회하지 않는다.
  const infoCache = useRef(new Map<string, MediaLibrary.AssetInfo>()).current;

  const usable = permStatus === "granted";

  // 화면 진입 시 한 번만 권한 확인·요청. 승인된 뒤에만 usable 이 되어 로드가 시작된다.
  useEffect(() => {
    let alive = true;
    (async () => {
      const current = await MediaLibrary.getPermissionsAsync();
      const ok =
        current.granted || current.accessPrivileges === "limited";
      if (ok) {
        if (alive) setPermStatus("granted");
        return;
      }
      if (!current.canAskAgain) {
        if (alive) setPermStatus("blocked");
        return;
      }
      const req = await MediaLibrary.requestPermissionsAsync();
      if (!alive) return;
      if (req.granted || req.accessPrivileges === "limited") {
        setPermStatus("granted");
      } else {
        setPermStatus(req.canAskAgain ? "denied" : "blocked");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const requestPermission = async () => {
    const req = await MediaLibrary.requestPermissionsAsync();
    if (req.granted || req.accessPrivileges === "limited") {
      setPermStatus("granted");
    } else {
      setPermStatus(req.canAskAgain ? "denied" : "blocked");
    }
  };

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (!usable || loading) return;
      if (!reset && !hasNext) return;
      setLoading(true);
      try {
        // 걸러내고 나면 한 페이지가 통째로 비는 경우가 있다. 그대로 두면 그리드가
        // 비어 onEndReached 가 다시 불리지 않으므로, 쓸 수 있는 게 나올 때까지 이어 받는다.
        let after = reset ? undefined : cursor;
        let collected: MediaLibrary.Asset[] = [];
        let more = true;
        while (more && collected.length === 0) {
          const page = await MediaLibrary.getAssetsAsync({
            first: PAGE_SIZE,
            after,
            mediaType: mediaTypesFor(filter),
            sortBy: [MediaLibrary.SortBy.creationTime],
            album: album?.id,
          });
          collected = await filterUsable(page.assets, infoCache);
          after = page.endCursor;
          more = page.hasNextPage;
        }
        setAssets((prev) => (reset ? collected : [...prev, ...collected]));
        setCursor(after);
        setHasNext(more);
      } finally {
        setLoading(false);
      }
    },
    [usable, loading, hasNext, cursor, filter, album, infoCache],
  );

  // 권한/필터/앨범이 바뀌면 처음부터 다시 로드
  useEffect(() => {
    if (!usable) return;
    setAssets([]);
    setCursor(undefined);
    setHasNext(true);
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usable, filter, album]);

  useEffect(() => {
    if (usable) MediaLibrary.getAlbumsAsync().then(setAlbums).catch(() => {});
  }, [usable]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const onConfirm = async () => {
    if (selected.length === 0 || confirming) return;
    setConfirming(true);
    try {
      // 그리드에 남은 항목은 필터링하며 원본 정보를 이미 읽어뒀다(위치·시각 포함).
      const infos = await Promise.all(
        selected.map(
          async (id) => infoCache.get(id) ?? MediaLibrary.getAssetInfoAsync(id),
        ),
      );
      const media = infos.map(toReelsMediaFromLibrary);

      if (mode === "add") {
        addStoreAssets(media);
        router.back();
      } else {
        setStoreAssets(media);
        router.replace("/reels/edit");
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 헤더: 닫기 + 제목 + 필터 탭 */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: scale(16),
          paddingVertical: verticalScale(12),
          gap: scale(12),
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Text className="text-white" style={{ fontSize: moderateScale(20) }}>
            ✕
          </Text>
        </Pressable>
        <Text
          className="font-semibold text-white"
          style={{ fontSize: moderateScale(16) }}
        >
          사진 선택
        </Text>

        <View
          className="flex-1 flex-row items-center justify-end"
          style={{ gap: scale(14) }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable key={f.key} onPress={() => setFilter(f.key)} hitSlop={8}>
                <Text
                  className={active ? "font-bold text-white" : "text-gray-500"}
                  style={{ fontSize: moderateScale(13) }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 본문 */}
      {permStatus === "checking" ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9CA3AF" />
        </View>
      ) : !usable ? (
        <PermissionEmpty
          blocked={permStatus === "blocked"}
          onRequest={requestPermission}
        />
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          onEndReached={() => loadPage(false)}
          onEndReachedThreshold={0.6}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP, paddingBottom: verticalScale(80) }}
          ListFooterComponent={
            loading ? (
              <View style={{ paddingVertical: verticalScale(20) }}>
                <ActivityIndicator color="#9CA3AF" />
              </View>
            ) : null
          }
          // 위치 없는 사진만 있는 기기에선 그리드가 통째로 빈다 — 이유를 알려준다.
          ListEmptyComponent={
            loading ? null : (
              <View
                className="items-center"
                style={{
                  paddingTop: verticalScale(80),
                  paddingHorizontal: scale(32),
                }}
              >
                <Text
                  className="text-center text-gray-400"
                  style={{
                    fontSize: moderateScale(13),
                    lineHeight: moderateScale(20),
                  }}
                >
                  쓸 수 있는 사진이 없어요.{"\n"}촬영 위치와 시각이 기록된 사진만
                  보여줘요.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const order = selected.indexOf(item.id);
            return (
              <GridCell
                asset={item}
                size={cell}
                order={order}
                onPress={() => toggle(item.id)}
              />
            );
          }}
        />
      )}

      {/* 하단 앨범 바 */}
      {usable ? (
        <View
          className="flex-row items-center"
          style={{
            backgroundColor: "#1C1C1C",
            paddingHorizontal: scale(16),
            paddingVertical: verticalScale(14),
            gap: scale(8),
          }}
        >
          <Text className="text-white" style={{ fontSize: moderateScale(13) }}>
            보기
          </Text>
          <Pressable
            onPress={() => setAlbumOpen(true)}
            className="flex-row items-center"
            style={{ gap: scale(4) }}
            hitSlop={8}
          >
            <Text
              className="font-semibold text-white"
              style={{ fontSize: moderateScale(13) }}
            >
              {album?.title ?? "최근"}
            </Text>
            <ChevronDownIcon
              color="#FFFFFF"
              width={moderateScale(12)}
              height={moderateScale(12)}
            />
          </Pressable>
        </View>
      ) : null}

      {/* 확정 FAB */}
      {usable && selected.length > 0 ? (
        <Pressable
          onPress={onConfirm}
          disabled={confirming}
          className="absolute items-center justify-center"
          style={{
            right: scale(20),
            bottom: verticalScale(76),
            width: scale(56),
            height: scale(56),
            borderRadius: scale(28),
            backgroundColor: ACCENT,
            elevation: 6,
            shadowColor: "#000",
          }}
          accessibilityRole="button"
          accessibilityLabel={`${selected.length}개 선택 완료`}
        >
          {confirming ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-bold text-white"
              style={{ fontSize: moderateScale(22) }}
            >
              ✓
            </Text>
          )}
        </Pressable>
      ) : null}

      {/* 앨범 선택 모달 */}
      <AlbumModal
        visible={albumOpen}
        albums={albums}
        onClose={() => setAlbumOpen(false)}
        onSelect={(a) => {
          setAlbum(a);
          setAlbumOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

/** 그리드 한 칸. 선택되면 파란 테두리 + 순서 번호 배지. */
function GridCell({
  asset,
  size,
  order,
  onPress,
}: {
  asset: MediaLibrary.Asset;
  size: number;
  order: number; // -1 이면 미선택
  onPress: () => void;
}) {
  const selected = order >= 0;
  return (
    <Pressable onPress={onPress} style={{ width: size, height: size }}>
      <Image
        source={{ uri: asset.uri }}
        contentFit="cover"
        style={{ width: "100%", height: "100%", opacity: selected ? 0.7 : 1 }}
      />

      {/* 영상이면 길이 표시 */}
      {asset.mediaType === "video" ? (
        <View
          className="absolute rounded"
          style={{
            right: scale(4),
            bottom: scale(4),
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: scale(4),
            paddingVertical: verticalScale(1),
          }}
        >
          <Text className="text-white" style={{ fontSize: moderateScale(10) }}>
            {formatDuration(asset.duration)}
          </Text>
        </View>
      ) : null}

      {/* 선택 배지 */}
      <View
        className="absolute items-center justify-center"
        style={{
          top: scale(6),
          right: scale(6),
          width: scale(22),
          height: scale(22),
          borderRadius: scale(11),
          borderWidth: 1.5,
          borderColor: "#FFFFFF",
          backgroundColor: selected ? ACCENT : "rgba(0,0,0,0.25)",
        }}
      >
        {selected ? (
          <Text
            className="font-bold text-white"
            style={{ fontSize: moderateScale(11) }}
          >
            {order + 1}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function PermissionEmpty({
  blocked,
  onRequest,
}: {
  blocked: boolean; // 다시 묻기 불가 → 설정으로 유도
  onRequest: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text
        className="text-center text-gray-300"
        style={{ fontSize: moderateScale(14), lineHeight: moderateScale(22) }}
      >
        사진의 위치·촬영 정보를 함께 담으려면{"\n"}갤러리 접근 권한이 필요해요.
      </Text>
      <Pressable
        onPress={blocked ? () => Linking.openSettings() : onRequest}
        className="rounded-full"
        style={{
          marginTop: verticalScale(20),
          backgroundColor: ACCENT,
          paddingHorizontal: scale(20),
          paddingVertical: verticalScale(10),
        }}
      >
        <Text
          className="font-semibold text-white"
          style={{ fontSize: moderateScale(13) }}
        >
          {blocked ? "설정 열기" : "권한 허용하기"}
        </Text>
      </Pressable>
    </View>
  );
}

function AlbumModal({
  visible,
  albums,
  onClose,
  onSelect,
}: {
  visible: boolean;
  albums: MediaLibrary.Album[];
  onClose: () => void;
  onSelect: (album: MediaLibrary.Album | null) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#1C1C1C",
            borderTopLeftRadius: scale(16),
            borderTopRightRadius: scale(16),
            paddingVertical: verticalScale(8),
            maxHeight: verticalScale(360),
          }}
        >
          <FlatList
            data={[null, ...albums]}
            keyExtractor={(item) => item?.id ?? "recent"}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                className="flex-row items-center justify-between active:opacity-60"
                style={{
                  paddingHorizontal: scale(20),
                  paddingVertical: verticalScale(14),
                }}
              >
                <Text
                  className="text-white"
                  style={{ fontSize: moderateScale(14) }}
                >
                  {item?.title ?? "최근"}
                </Text>
                {item ? (
                  <Text
                    className="text-gray-500"
                    style={{ fontSize: moderateScale(12) }}
                  >
                    {item.assetCount}
                  </Text>
                ) : null}
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** MediaLibrary duration(초) → "0:07". */
function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
