import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import BackIcon from "@/src/components/icons/BackIcon";
import { useCourseStore } from "@/src/features/course/store";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

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
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(16),
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

      {/* 안내 문구 */}
      <View className="flex-1 items-center justify-center px-5">
        <Text
          className="text-center font-bold text-gray-900"
          style={{ fontSize: moderateScale(26), lineHeight: moderateScale(36) }}
        >
          <Text style={{ color: "#5E84F4" }}>AI 플래너</Text>에{"\n"}
          오신것을 환영해요
        </Text>

        <Text
          className="text-center text-gray-500 font-semibold"
          style={{
            fontSize: moderateScale(14),
            lineHeight: moderateScale(22),
            marginTop: verticalScale(18),
          }}
        >
          몇가지 질문에만 답해주시면{"\n"}
          맞춤형 코스를 만들어 드려요
        </Text>

        {/* 여행 생성하기 버튼 */}
        <Pressable
          onPress={onStart}
          className="items-center justify-center"
          style={{
            marginTop: verticalScale(40),
            width: scale(260),
            height: verticalScale(56),
            backgroundColor: "#D9D9D9",
            borderRadius: scale(10),
          }}
        >
          <Text
            className="font-semibold"
            style={{ fontSize: moderateScale(16), color: "#5F5F5F" }}
          >
            여행 생성하기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
