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

type Props = {
  visible: boolean;
  title: string;
  selectedIdx: number | null;
  excludeIdx?: number | null; // 반대편에서 이미 선택된 역 숨김 처리용
  onClose: () => void;
  onSelect: (station: SelectedStation) => void;
};

export function StationPickerModal({
  visible,
  selectedIdx,
  excludeIdx,
  onClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();

  // 검색어(query) 는 300ms 디바운스, 초성(initial) 은 chip 탭 즉시 반영.
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [initial, setInitial] = useState<string | null>(null);

  // 모달 열릴 때 필터 초기화 — 출발지/도착지 픽커가 서로 상태를 이어받지 않도록.
  useEffect(() => {
    if (visible) {
      setQuery("");
      setDebouncedQuery("");
      setInitial(null);
    }
  }, [visible]);

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

  const list = data?.filter((s) => s.station_idx !== excludeIdx) ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          onPress={() => {}}
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
                selectedIdx={selectedIdx}
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type ListProps = {
  list: StationResponse[];
  selectedIdx: number | null;
  isLoading: boolean;
  isError: boolean;
  isFiltering: boolean;
  isRefetching: boolean;
  onRetry: () => void;
  onSelect: (s: StationResponse) => void;
};

function StationList({
  list,
  selectedIdx,
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
          style={{ fontSize: moderateScale(14), marginBottom: verticalScale(12) }}
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
    <View style={{ flex: 1 }} onLayout={(e) => setTrackH(e.nativeEvent.layout.height)}>
      <FlatList
        data={list}
        keyExtractor={(s) => String(s.station_idx)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        onContentSizeChange={(_w, h) => setContentH(h)}
        renderItem={({ item }) => {
          const isSel = item.station_idx === selectedIdx;
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
                <Feather name="check" size={moderateScale(18)} color="#0F766E" />
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
