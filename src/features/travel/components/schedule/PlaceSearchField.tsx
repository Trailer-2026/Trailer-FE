import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";

import { Text } from "@/src/components/Text";
import { describePlaceSearchError } from "@/src/features/travel/errors";
import { usePlaceSearch } from "@/src/features/place/queries";
import type { PlaceSearchResult } from "@/src/features/place/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { ACCENT, FieldLabel } from "./parts";

const BORDER = "#E5E7EB";

/**
 * 장소 검색 입력 + 결과 리스트.
 * 항목 선택 시 onSelect 로 name/latitude/longitude 를 넘긴다(방문 일정 좌표 채움).
 * 선택된 장소가 있으면 요약을 보여주고 "변경"으로 다시 검색할 수 있다.
 */
export default function PlaceSearchField({
  selected,
  onSelect,
  label = "장소",
  required = true,
}: {
  selected: PlaceSearchResult | null;
  onSelect: (place: PlaceSearchResult | null) => void;
  label?: string;
  required?: boolean;
}) {
  return (
    <View style={{ marginBottom: verticalScale(16) }}>
      <FieldLabel label={label} required={required} />
      {selected ? (
        <SelectedPlace place={selected} onClear={() => onSelect(null)} />
      ) : (
        <SearchBox onSelect={onSelect} />
      )}
    </View>
  );
}

function SelectedPlace({
  place,
  onClear,
}: {
  place: PlaceSearchResult;
  onClear: () => void;
}) {
  return (
    <View
      className="flex-row items-center"
      style={{
        borderWidth: 1,
        borderColor: ACCENT,
        borderRadius: scale(10),
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(12),
        gap: scale(10),
      }}
    >
      <Feather name="map-pin" size={moderateScale(16)} color={ACCENT} />
      <View style={{ flex: 1 }}>
        <Text
          className="font-semibold text-gray-900"
          style={{ fontSize: moderateScale(14) }}
          numberOfLines={1}
        >
          {place.name}
        </Text>
        <Text
          className="text-gray-400"
          style={{ fontSize: moderateScale(12), marginTop: verticalScale(2) }}
          numberOfLines={1}
        >
          {place.address}
        </Text>
      </View>
      <Pressable onPress={onClear} hitSlop={8} className="active:opacity-60">
        <Text
          className="font-semibold"
          style={{ fontSize: moderateScale(13), color: ACCENT }}
        >
          변경
        </Text>
      </Pressable>
    </View>
  );
}

function SearchBox({
  onSelect,
}: {
  onSelect: (place: PlaceSearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const { data, isFetching, isError } = usePlaceSearch(query);
  const results = data ?? [];
  const showEmpty =
    query.trim().length >= 1 && !isFetching && !isError && results.length === 0;

  return (
    <View>
      <View
        className="flex-row items-center"
        style={{
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: scale(10),
          paddingHorizontal: scale(12),
          gap: scale(8),
        }}
      >
        <Feather name="search" size={moderateScale(16)} color="#9CA3AF" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="장소명을 검색하세요 (예: 해운대)"
          placeholderTextColor="#9CA3AF"
          style={{
            flex: 1,
            paddingVertical: verticalScale(12),
            fontSize: moderateScale(14),
            color: "#111827",
          }}
        />
        {isFetching ? <ActivityIndicator size="small" color={ACCENT} /> : null}
      </View>

      {isError ? (
        <Hint text={describePlaceSearchError()} />
      ) : showEmpty ? (
        <Hint text="검색 결과가 없어요" />
      ) : results.length > 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: scale(10),
            marginTop: verticalScale(8),
            overflow: "hidden",
          }}
        >
          {results.slice(0, 8).map((place, i) => (
            <Pressable
              key={`${place.name}-${place.latitude}-${i}`}
              onPress={() => onSelect(place)}
              className="active:bg-gray-100"
              style={{
                paddingHorizontal: scale(14),
                paddingVertical: verticalScale(11),
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: "#F1F1F3",
              }}
            >
              <View className="flex-row items-center" style={{ gap: scale(6) }}>
                <Text
                  className="font-semibold text-gray-900"
                  style={{ fontSize: moderateScale(14) }}
                  numberOfLines={1}
                >
                  {place.name}
                </Text>
                {place.category ? (
                  <Text
                    className="text-gray-400"
                    style={{ fontSize: moderateScale(11) }}
                    numberOfLines={1}
                  >
                    {place.category}
                  </Text>
                ) : null}
              </View>
              <Text
                className="text-gray-400"
                style={{ fontSize: moderateScale(12), marginTop: verticalScale(2) }}
                numberOfLines={1}
              >
                {place.address}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <Text
      className="text-gray-400"
      style={{ fontSize: moderateScale(12), marginTop: verticalScale(8) }}
    >
      {text}
    </Text>
  );
}
