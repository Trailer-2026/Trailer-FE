import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import BellIcon from "@/src/components/icons/BellIcon";
import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

const NOTIFICATIONS = [
  {
    id: "1",
    message: "'부산 관광지 코스 여행'이 일정에 추가되었어요",
    time: "14분전",
  },
  {
    id: "2",
    message: "'부산 관광지 코스 여행'이 일정에 추가되었어요",
    time: "14분전",
  },
];

export default function NotificationsTab() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
          paddingBottom: verticalScale(8),
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
          알림
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(24) }}
      >
        {/* 풍경알림 카드 */}
        <View
          className="overflow-hidden"
          style={{
            marginHorizontal: scale(20),
            marginTop: verticalScale(8),
            borderRadius: scale(16),
            // TODO: 풍경(벚꽃 기차) 일러스트 배경 이미지로 교체
            backgroundColor: "#F2DEE8",
          }}
        >
          <View style={{ padding: scale(16) }}>
            {/* 상단: 풍경알림 · 접기 */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: scale(6) }}>
                <BellIcon
                  color={ACCENT}
                  width={moderateScale(18)}
                  height={moderateScale(20)}
                />
                <Text
                  className="font-bold"
                  style={{ fontSize: moderateScale(15), color: ACCENT }}
                >
                  풍경알림
                </Text>
              </View>
              <Pressable onPress={() => setCollapsed((c) => !c)} hitSlop={8}>
                <Text
                  className="text-gray-500"
                  style={{ fontSize: moderateScale(13) }}
                >
                  {collapsed ? "펼치기" : "접기"}
                </Text>
              </Pressable>
            </View>

            {!collapsed ? (
              <>
                {/* 아바타 + 문구 */}
                <View
                  className="flex-row"
                  style={{ marginTop: verticalScale(14) }}
                >
                  <View
                    className="bg-white rounded-full"
                    style={{ width: scale(48), height: scale(48) }}
                  />
                  <View style={{ flex: 1, marginLeft: scale(12) }}>
                    <Text
                      className="text-gray-900"
                      style={{ fontSize: moderateScale(16) }}
                    >
                      김이박 님,
                    </Text>
                    <Text
                      className="text-gray-900"
                      style={{
                        fontSize: moderateScale(16),
                        marginTop: verticalScale(2),
                        lineHeight: moderateScale(23),
                      }}
                    >
                      지금 <Text className="font-bold">대전역</Text> 스팟을 지나고
                      있어요
                    </Text>
                    <Text
                      className="text-gray-400"
                      style={{
                        fontSize: moderateScale(12),
                        marginTop: verticalScale(4),
                      }}
                    >
                      오전 9:00 기준
                    </Text>
                  </View>
                </View>

                {/* 일러스트 영역만큼의 여백 (배경 이미지 들어갈 자리) */}
                <View style={{ height: verticalScale(140) }} />

                {/* 촬영하러 가기 버튼 */}
                <Pressable
                  className="items-center justify-center rounded-2xl"
                  style={{
                    height: verticalScale(56),
                    backgroundColor: ACCENT,
                  }}
                >
                  <Text
                    className="text-white font-bold"
                    style={{ fontSize: moderateScale(16) }}
                  >
                    지금 촬영하러 가기
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        {/* 알림 리스트 */}
        <View style={{ marginTop: verticalScale(20) }}>
          {NOTIFICATIONS.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center"
              style={{
                paddingHorizontal: scale(20),
                paddingVertical: verticalScale(14),
                gap: scale(12),
              }}
            >
              {/* 아바타 */}
              <View
                className="rounded-full"
                style={{
                  width: scale(44),
                  height: scale(44),
                  backgroundColor: "#EAF0FF",
                }}
              />

              {/* 문구 + 시간 */}
              <View style={{ flex: 1 }}>
                <Text
                  className="text-gray-900"
                  style={{
                    fontSize: moderateScale(14),
                    lineHeight: moderateScale(20),
                  }}
                >
                  {item.message}
                  <Text className="text-gray-400"> {item.time}</Text>
                </Text>
              </View>

              {/* 썸네일 */}
              <View
                style={{
                  width: scale(56),
                  height: scale(56),
                  borderRadius: scale(10),
                  backgroundColor: "#EDEFF3",
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
