import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import {
  RESULT_ITINERARY as R,
  type ItineraryStep,
} from "@/src/features/schedule/data";
import { useScheduleStore } from "@/src/features/schedule/store";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const RAIL_WIDTH = scale(58);
const LINE_COLOR = "#D9D9D9";
const BOARD_DOT = "#C4C4C4";
const ALIGHT_DOT = "#2FD3B4";
const TIME_COLOR = "#9AA0A6";

export default function ResultScreen() {
  function handleAdd() {
    useScheduleStore.getState().addTrip();
    router.replace("/calendar");
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
          paddingBottom: verticalScale(6),
          gap: scale(10),
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <BackIcon
            color="#111827"
            width={moderateScale(14)}
            height={moderateScale(20)}
          />
        </Pressable>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20) }}
        >
          일정
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingBottom: verticalScale(20),
        }}
      >
        {/* 총 소요시간 */}
        <View
          className="flex-row items-baseline"
          style={{ marginTop: verticalScale(10) }}
        >
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(28) }}
          >
            {R.totalHours}
          </Text>
          <Text
            className="text-gray-900"
            style={{ fontSize: moderateScale(16), marginLeft: scale(2) }}
          >
            시간{" "}
          </Text>
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(28) }}
          >
            {R.totalMinutes}
          </Text>
          <Text
            className="text-gray-900"
            style={{ fontSize: moderateScale(16), marginLeft: scale(2) }}
          >
            분
          </Text>
        </View>
        <Text
          className="text-gray-500"
          style={{ fontSize: moderateScale(13), marginTop: verticalScale(4) }}
        >
          {R.timeRange}
        </Text>

        {/* 구간 슬라이더 */}
        <View
          style={{
            height: verticalScale(64),
            marginTop: verticalScale(20),
            justifyContent: "center",
          }}
        >
          {/* 트랙 */}
          <View
            style={{
              height: verticalScale(6),
              borderRadius: 999,
              backgroundColor: "#E3E3E3",
            }}
          />
          {/* 채워진 구간 */}
          <View
            style={{
              position: "absolute",
              left: `${R.markers[0].left * 100}%`,
              right: `${(1 - R.markers[1].left) * 100}%`,
              height: verticalScale(6),
              borderRadius: 999,
              backgroundColor: "#9AA0A6",
            }}
          />
          {R.markers.map((m) => (
            <View
              key={m.station}
              style={{
                position: "absolute",
                left: `${m.left * 100}%`,
                alignItems: "center",
              }}
            >
              {/* 소요시간 말풍선 pill */}
              <View
                className="bg-white items-center justify-center"
                style={{
                  transform: [{ translateX: -scale(24) }],
                  paddingHorizontal: scale(10),
                  height: verticalScale(24),
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#E3E3E3",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Text
                  className="font-medium text-gray-700"
                  style={{ fontSize: moderateScale(12) }}
                >
                  {m.duration}
                </Text>
              </View>
              {/* 역 라벨 */}
              <Text
                className="text-gray-500"
                style={{
                  transform: [{ translateX: -scale(24) }],
                  fontSize: moderateScale(12),
                  marginTop: verticalScale(8),
                }}
              >
                {m.station}
              </Text>
            </View>
          ))}
        </View>

        {/* 기준 시각 구분선 */}
        <View
          style={{
            marginTop: verticalScale(16),
            marginHorizontal: -scale(20),
            paddingHorizontal: scale(20),
            paddingVertical: verticalScale(14),
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#F0F0F0",
          }}
        >
          <Text
            className="text-gray-400"
            style={{ fontSize: moderateScale(13) }}
          >
            {R.baseline}
          </Text>
        </View>

        {/* 타임라인 */}
        <View style={{ marginTop: verticalScale(18) }}>
          {R.steps.map((step, i) => {
            const isLast = i === R.steps.length - 1;

            if (step.kind === "place") {
              return (
                <View
                  key={i}
                  className="flex-row"
                  style={{ paddingBottom: verticalScale(22) }}
                >
                  <Rail dotColor={ALIGHT_DOT} isLast={isLast} showDot={false} />
                  <PlaceCard step={step} walkDuration={R.walkDuration} />
                </View>
              );
            }

            if (step.kind === "alight") {
              return (
                <View
                  key={i}
                  className="flex-row"
                  style={{ paddingBottom: verticalScale(22) }}
                >
                  <Rail dotColor={ALIGHT_DOT} isLast={isLast} />
                  <View style={{ flex: 1, paddingTop: verticalScale(2) }}>
                    <Text
                      className="font-bold text-gray-900"
                      style={{ fontSize: moderateScale(18) }}
                    >
                      {step.station}
                    </Text>
                  </View>
                </View>
              );
            }

            // board
            return (
              <View
                key={i}
                className="flex-row"
                style={{ paddingBottom: verticalScale(22) }}
              >
                <Rail dotColor={BOARD_DOT} time={step.time} isLast={isLast} />
                <View style={{ flex: 1, paddingTop: verticalScale(2) }}>
                  <Text
                    className="font-bold text-gray-900"
                    style={{ fontSize: moderateScale(18) }}
                  >
                    {step.station}
                  </Text>
                  {/* 사진/메모 카드 */}
                  <View
                    style={{
                      marginTop: verticalScale(12),
                      height: verticalScale(120),
                      borderRadius: scale(12),
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  {/* n개 역 이동 */}
                  <View
                    className="flex-row items-center"
                    style={{ marginTop: verticalScale(16), gap: scale(8) }}
                  >
                    <Text
                      className="text-gray-500"
                      style={{ fontSize: moderateScale(13) }}
                    >
                      {step.move}
                    </Text>
                    <Text
                      className="font-bold text-gray-800"
                      style={{ fontSize: moderateScale(14) }}
                    >
                      {R.moveDuration}
                    </Text>
                    <Feather
                      name="chevron-down"
                      size={moderateScale(16)}
                      color="#9AA0A6"
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: scale(20), paddingBottom: verticalScale(8) }}>
        <PrimaryButton label="일정표에 추가하기" onPress={handleAdd} />
      </View>
    </SafeAreaView>
  );
}

function Rail({
  dotColor,
  time,
  isLast,
  showDot = true,
}: {
  dotColor: string;
  time?: string;
  isLast?: boolean;
  showDot?: boolean;
}) {
  return (
    <View style={{ width: RAIL_WIDTH, alignItems: "center" }}>
      {/* 세로 연결선 */}
      {!isLast ? (
        <View
          style={{
            position: "absolute",
            top: verticalScale(8),
            bottom: -verticalScale(22),
            width: 1.5,
            backgroundColor: LINE_COLOR,
          }}
        />
      ) : null}
      {/* 점 */}
      {showDot ? (
        <View
          style={{
            width: scale(13),
            height: scale(13),
            borderRadius: 999,
            backgroundColor: dotColor,
            marginTop: verticalScale(4),
          }}
        />
      ) : null}
      {/* 시각 */}
      {time ? (
        <Text
          style={{
            fontSize: moderateScale(12),
            color: TIME_COLOR,
            marginTop: verticalScale(22),
          }}
        >
          {time}
        </Text>
      ) : null}
    </View>
  );
}

function PlaceCard({
  step,
  walkDuration,
}: {
  step: Extract<ItineraryStep, { kind: "place" }>;
  walkDuration: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      {/* 이름 + 화살표 */}
      <View className="flex-row items-center justify-between">
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          {step.name}
        </Text>
        <Feather name="chevron-right" size={moderateScale(20)} color="#9AA0A6" />
      </View>
      <Text
        className="text-gray-400"
        style={{ fontSize: moderateScale(13), marginTop: verticalScale(4) }}
      >
        {step.address}
      </Text>

      {/* 이미지 자리 */}
      <View
        className="overflow-hidden"
        style={{
          marginTop: verticalScale(12),
          height: verticalScale(110),
          borderRadius: scale(12),
          backgroundColor: "#D9D9D9",
        }}
      >
        <Image
          source={require("../../../assets/images/Main.png")}
          resizeMode="cover"
          style={{ width: "100%", height: "100%", opacity: 0.9 }}
        />
      </View>

      {/* 도보 */}
      <View
        className="flex-row items-center"
        style={{
          marginTop: verticalScale(14),
          paddingTop: verticalScale(14),
          borderTopWidth: 1,
          borderColor: "#F0F0F0",
          gap: scale(10),
        }}
      >
        <Text className="text-gray-400" style={{ fontSize: moderateScale(13) }}>
          {step.walk}
        </Text>
        <Text
          className="font-bold text-gray-800"
          style={{ fontSize: moderateScale(14) }}
        >
          {walkDuration}
        </Text>
      </View>
    </View>
  );
}
