import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import ChevronDownIcon from "@/src/components/icons/ChevronDownIcon";
import SearchIcon from "@/src/components/icons/SearchIcon";
import type { SelectedStation } from "@/src/features/course/store";
import { useStations } from "@/src/features/station/queries";
import type {
  StationResponse,
  StationsQueryParams,
} from "@/src/features/station/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

// 한글 자음(초성) 필터 후보. 서버가 자음 한 글자만 허용하므로 여기 목록으로 제한한다.
const INITIALS = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

type SheetProps = {
  /** 체크 표시용. 역명은 사실상 유일해서 idx 대신 이름으로 맞춘다. */
  selectedName: string | null;
  excludeName?: string | null; // 반대편에서 이미 선택된 역 숨김 처리용
  onClose: () => void;
  onSelect: (station: SelectedStation) => void;
};

/**
 * 역 선택 하단 시트 — **Modal 없이** 화면 전체를 덮는 오버레이.
 *
 * 이미 RN Modal 안에 있는 폼(티켓 추가/편집)에서도 쓸 수 있어야 한다.
 * 안드로이드에서 Modal 을 중첩하면 안쪽 FlatList 가 터치를 못 받아 스크롤이 죽는다.
 * → 시트 자체는 오버레이로 두고, 화면 최상위에서 렌더할 책임은 호출부가 진다.
 * 열려 있는 동안만 마운트되는 것을 전제로 한다(마운트 시점이 곧 필터 초기화).
 */
export function StationPickerSheet({
  selectedName,
  excludeName,
  onClose,
  onSelect,
}: SheetProps) {
  const insets = useSafeAreaInsets();

  // 검색어(query) 는 300ms 디바운스, 초성(initial) 은 chip 탭 즉시 반영.
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [initial, setInitial] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    const t = setTimeout(() => setDebouncedQuery(trimmed), 300);
    return () => clearTimeout(t);
  }, [query]);

  const params: StationsQueryParams = {
    ...(debouncedQuery ? { query: debouncedQuery } : {}),
    ...(initial ? { initial } : {}),
  };
  const isFiltering = !!debouncedQuery || !!initial;
  const { data, isLoading, isError, refetch, isRefetching } = useStations(
    isFiltering ? params : undefined,
  );

  const list = data?.filter((s) => s.station_name !== excludeName) ?? [];

  return (
    <View
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
    >
      {/* 백드롭 — 탭하면 닫힘 */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
      />
      {/*
        시트 본체. 백드롭이 형제 뷰라 여기 터치는 애초에 백드롭까지 가지 않는다.
        (Pressable 로 감싸면 안쪽 FlatList 가 터치를 못 받을 수 있어 View 로 둔다.)
      */}
      <View
        className="bg-white"
        style={{
          borderTopLeftRadius: scale(24),
          borderTopRightRadius: scale(24),
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(16),
          paddingBottom: insets.bottom + verticalScale(20),
          height: verticalScale(560),
        }}
      >
        {/* 상단 닫기 핸들 (아래꺾쇠) */}
        <Pressable
          onPress={onClose}
          hitSlop={16}
          className="items-center"
          style={{
            marginBottom: verticalScale(14),
            paddingVertical: verticalScale(4),
          }}
        >
          <ChevronDownIcon
            width={moderateScale(20)}
            height={moderateScale(11)}
          />
        </Pressable>

        {/* 검색 입력 */}
        <View
          className="flex-row items-center"
          style={{
            height: verticalScale(44),
            marginBottom: verticalScale(10),
          }}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="역 명을 입력해주세요"
            placeholderTextColor="#C5C5C5"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            className="flex-1 text-gray-900"
            style={{ fontSize: moderateScale(15), padding: 0 }}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={10}
              style={{ marginRight: scale(10) }}
            >
              <Feather
                name="x-circle"
                size={moderateScale(16)}
                color="#C5C5C5"
              />
            </Pressable>
          ) : null}
          <SearchIcon
            width={moderateScale(20)}
            height={moderateScale(20)}
            style={{ marginRight: scale(15) }}
          />
        </View>

        {/* 목록 + 우측 초성 인덱스 */}
        <View className="flex-1 flex-row">
          <View className="flex-1">
            <StationList
              list={list}
              selectedName={selectedName}
              isLoading={isLoading}
              isError={isError}
              isFiltering={isFiltering}
              isRefetching={isRefetching}
              onRetry={refetch}
              onSelect={(s) => {
                onSelect({
                  station_idx: s.station_idx,
                  station_name: s.station_name,
                });
                onClose();
              }}
            />
          </View>

          {/* 우측 세로 초성 인덱스 */}
          <View
            style={{
              width: scale(44),
              marginLeft: scale(8),
              backgroundColor: "#F1F4FB",
              borderRadius: scale(8),
              paddingVertical: verticalScale(12),
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {INITIALS.map((c) => {
              const isSel = initial === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setInitial(isSel ? null : c)}
                  hitSlop={6}
                  style={{
                    width: "100%",
                    alignItems: "center",
                    paddingVertical: verticalScale(2),
                  }}
                >
                  <Text
                    className={isSel ? "font-bold" : "font-medium"}
                    style={{
                      fontSize: moderateScale(15),
                      color: isSel ? "#111827" : "#9CA3AF",
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

/** 일반 화면(모달 밖)에서 쓰는 래퍼. 열려 있는 동안만 시트를 마운트한다. */
export function StationPickerModal({
  visible,
  ...sheet
}: SheetProps & { visible: boolean }) {
  if (!visible) return null;
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={sheet.onClose}
    >
      <StationPickerSheet {...sheet} />
    </Modal>
  );
}

type ListProps = {
  list: StationResponse[];
  selectedName: string | null;
  isLoading: boolean;
  isError: boolean;
  isFiltering: boolean;
  isRefetching: boolean;
  onRetry: () => void;
  onSelect: (s: StationResponse) => void;
};

function StationList({
  list,
  selectedName,
  isLoading,
  isError,
  isFiltering,
  isRefetching,
  onRetry,
  onSelect,
}: ListProps) {
  // 커스텀 스크롤 바 계산용: 보이는 높이(track) / 전체 콘텐츠 높이 / 현재 스크롤 위치.
  const [trackH, setTrackH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const showBar = trackH > 0 && contentH > trackH;
  const thumbH = showBar
    ? Math.max(scale(24), (trackH / contentH) * trackH)
    : 0;
  const maxScroll = contentH - trackH;
  const thumbY =
    showBar && maxScroll > 0
      ? (Math.min(Math.max(scrollY, 0), maxScroll) / maxScroll) *
        (trackH - thumbH)
      : 0;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#111827" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text
          className="text-gray-600"
          style={{
            fontSize: moderateScale(14),
            marginBottom: verticalScale(12),
          }}
        >
          역 목록을 불러오지 못했어요.
        </Text>
        <Pressable
          onPress={onRetry}
          className="bg-gray-800 rounded-full"
          style={{
            paddingHorizontal: scale(20),
            paddingVertical: verticalScale(10),
          }}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: moderateScale(14) }}
          >
            {isRefetching ? "다시 시도 중…" : "다시 시도"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (list.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500" style={{ fontSize: moderateScale(14) }}>
          {isFiltering ? "검색 결과가 없어요." : "표시할 역이 없어요."}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => setTrackH(e.nativeEvent.layout.height)}
    >
      <FlatList
        data={list}
        keyExtractor={(s) => String(s.station_idx)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        onContentSizeChange={(_w, h) => setContentH(h)}
        renderItem={({ item }) => {
          const isSel = item.station_name === selectedName;
          return (
            <Pressable
              onPress={() => onSelect(item)}
              className="flex-row items-center justify-between"
              style={{ paddingVertical: verticalScale(14) }}
            >
              <Text
                className={isSel ? "font-bold text-gray-900" : "text-gray-800"}
                style={{ fontSize: moderateScale(16) }}
              >
                {item.station_name}
              </Text>
              {isSel ? (
                <Feather
                  name="check"
                  size={moderateScale(18)}
                  color="#0F766E"
                />
              ) : null}
            </Pressable>
          );
        }}
      />

      {/* 전체 역 대비 현재 위치를 나타내는 커스텀 스크롤 바 */}
      {showBar ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: scale(2),
            top: 0,
            bottom: 0,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: thumbY,
              width: scale(4),
              height: thumbH,
              borderRadius: 999,
              backgroundColor: "#5F5F5F",
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
