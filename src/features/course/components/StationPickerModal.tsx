import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, FlatList, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import type { SelectedStation } from "@/src/features/course/store";
import { useStations } from "@/src/features/station/queries";
import type { StationResponse } from "@/src/features/station/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

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
  // 지금은 전체 목록. 검색어/초성 필터 UI 는 여기에 얹을 예정.
  const { data, isLoading, isError, refetch, isRefetching } = useStations();

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
            height: verticalScale(520),
          }}
        >
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: verticalScale(14) }}
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

          <StationList
            list={list}
            selectedIdx={selectedIdx}
            isLoading={isLoading}
            isError={isError}
            isRefetching={isRefetching}
            onRetry={refetch}
            onSelect={(s) => {
              onSelect({ station_idx: s.station_idx, station_name: s.station_name });
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
  isRefetching: boolean;
  onRetry: () => void;
  onSelect: (s: StationResponse) => void;
};

function StationList({
  list,
  selectedIdx,
  isLoading,
  isError,
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
          표시할 역이 없어요.
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
