import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import BackIcon from "@/src/components/icons/BackIcon";
import { useCourseStore } from "@/src/features/course/store";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

// Metro 는 대소문자를 구분한다 — 실제 파일명(robot.png)과 정확히 일치시킬 것.
const ROBOT = require("../../../assets/images/style/robot.png");

/** 시작하기 알약 높이 = 우측 원형 화살표 지름(끝단을 딱 맞추기 위해 한 값으로 묶는다). */
const BUTTON_H = verticalScale(64);

export default function CourseIntroScreen() {
  const reset = useCourseStore((s) => s.reset);

  const onStart = () => {
    // 새 일정 생성 진입마다 이전 선택값 초기화.
    reset();
    router.push("/course/origin-destination");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* 뒤로가기 */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: scale(20),
          ...headerBarStyle(),
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ width: scale(28), height: scale(28), justifyContent: "center" }}
        >
          <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
        </Pressable>
      </View>

      <View className="flex-1 items-center" style={{ paddingHorizontal: scale(20) }}>
        {/* 안내 문구 */}
        <Text
          className="text-center font-bold text-gray-900"
          style={{
            marginTop: verticalScale(80),
            fontSize: moderateScale(24),
            lineHeight: moderateScale(34),
          }}
        >
          <Text style={{ color: ACCENT }}>AI 플래너</Text>에{"\n"}
          오신 것을 환영합니다.
        </Text>

        <Text
          className="text-center text-gray-400 font-medium"
          style={{
            fontSize: moderateScale(13),
            lineHeight: moderateScale(21),
            marginTop: verticalScale(20),
          }}
        >
          기차여행을 계획하고 계신가요?{"\n"}
          AI가 당신만의 기차여행 코스를 만들어드립니다.
        </Text>

        {/* 마스코트 — 남는 공간 가운데. 원본 비율(504x392)을 유지한다. */}
        <View className="flex-1 items-center justify-center">
          <Image
            source={ROBOT}
            contentFit="contain"
            style={{ width: scale(180), height: scale(180) * (392 / 504) }}
          />
        </View>

        {/* 시작하기 — 알약 버튼 + 우측 원형 화살표 */}
        <Pressable
          onPress={onStart}
          className="active:opacity-80"
          style={{
            width: scale(220),
            height: BUTTON_H,
            marginBottom: verticalScale(80),
          }}
          accessibilityRole="button"
          accessibilityLabel="시작하기"
        >
          <LinearGradient
            colors={["#9DB0F8", "#7C99F5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="justify-center"
            style={{ flex: 1, borderRadius: 999 }}
          >
            {/* 문구는 알약 전체 폭 기준 가운데. 원형 화살표는 그 위에 겹쳐 놓아
                문구 위치에 영향을 주지 않는다. */}
            <Text
              className="text-white font-bold text-center"
              style={{ fontSize: moderateScale(17) }}
            >
              시작하기
            </Text>
            {/* 알약 높이와 지름을 같게 두고 오른쪽 끝에 붙인다 → 둥근 끝단이 정확히 겹친다. */}
            <View
              className="absolute items-center justify-center rounded-full"
              style={{
                right: 0,
                width: BUTTON_H,
                height: BUTTON_H,
                backgroundColor: "#6E8CF4",
              }}
            >
              <Feather
                name="chevron-right"
                size={moderateScale(22)}
                color="#FFFFFF"
              />
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
