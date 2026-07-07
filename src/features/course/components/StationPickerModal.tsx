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
  title,
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
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: verticalScale(12) }}
          >
            <Text
              className="font-bold text-gray-900"
              style={{ fontSize: moderateScale(16) }}
            >
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={moderateScale(22)} color="#111827" />
            </Pressable>
          </View>

          {/* 검색 입력 */}
          <View
            className="flex-row items-center bg-gray-100 rounded-xl"
            style={{
              paddingHorizontal: scale(12),
              height: verticalScale(44),
              marginBottom: verticalScale(10),
            }}
          >
            <Feather name="search" size={moderateScale(16)} color="#6B7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="역명 검색"
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              className="flex-1 text-gray-900"
              style={{
                fontSize: moderateScale(14),
                marginLeft: scale(8),
                padding: 0,
              }}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")} hitSlop={10}>
                <Feather
                  name="x-circle"
                  size={moderateScale(16)}
                  color="#9CA3AF"
                />
              </Pressable>
            ) : null}
          </View>

          {/* 초성 chip 행 */}
          <View
            className="flex-row flex-wrap"
            style={{ marginBottom: verticalScale(10), gap: scale(6) }}
          >
            {INITIALS.map((c) => {
              const isSel = initial === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setInitial(isSel ? null : c)}
                  className={isSel ? "bg-gray-800" : "bg-gray-100"}
                  style={{
                    minWidth: scale(32),
                    height: verticalScale(30),
                    borderRadius: scale(15),
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: scale(8),
                  }}
                >
                  <Text
                    className={
                      isSel ? "text-white font-semibold" : "text-gray-700"
                    }
                    style={{ fontSize: moderateScale(13) }}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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
    <FlatList
      data={list}
      keyExtractor={(s) => String(s.station_idx)}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const isSel = item.station_idx === selectedIdx;
        return (
          <Pressable
            onPress={() => onSelect(item)}
            className="flex-row items-center justify-between border-b border-gray-100"
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
  );
}
