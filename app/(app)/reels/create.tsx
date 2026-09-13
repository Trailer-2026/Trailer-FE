import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/** Figma '영상만들기_시작' 시안 색 — 반투명 민트 알약 + 진한 민트 원형 버튼. */
const PILL_BG = "rgba(176, 230, 219, 0.63)";
const KNOB_BG = "#89E0CE";
/** AI 추천 일정 첫 화면(course/intro.tsx)과 같은 크기·위치로 맞춘다. */
const PILL_W = scale(220);
const BUTTON_H = verticalScale(64);

const INTRO_ART = require("../../../assets/images/style/reels-intro-art.png");

/**
 * 영상 만들기 1단계 — 안내 후 갤러리에서 사진 선택.
 *
 * 위치·시각을 확실히 읽어야 해서 커스텀 그리드(/reels/gallery)로 보낸다.
 * 카메라 촬영 옵션은 제거했다(기획 결정 — capture.ts 는 다른 화면에서 계속 쓴다).
 */
export default function ReelsCreateScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 닫기 — 시안은 뒤로가기(<) 대신 X 다. */}
      <View
        className="flex-row items-center"
        style={{ paddingHorizontal: scale(21), ...headerBarStyle() }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Feather name="x" size={moderateScale(20)} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* 안내 문구 — AI 추천 첫 화면(course/intro.tsx)과 같은 폰트 크기·굵기·줄간격. */}
      <View style={{ paddingHorizontal: scale(28), marginTop: verticalScale(80) }}>
        <Text
          className="text-center text-white"
          style={{
            fontSize: moderateScale(24),
            lineHeight: moderateScale(34),
            fontWeight: 650 as never,
          }}
        >
          {/* '영상 만들기'만 강조색(민트), 나머지는 바깥 굵기를 물려받는다. */}
          <Text className="font-bold" style={{ color: KNOB_BG }}>
            영상 만들기
          </Text>
          에{"\n"}
          오신 것을 환영합니다.
        </Text>
        <Text
          className="text-center font-medium text-white"
          style={{
            fontSize: moderateScale(13),
            lineHeight: moderateScale(21),
            marginTop: verticalScale(20),
          }}
        >
          여행의 소중한 순간을 한 편의{"\n"}영상으로 기록해보세요.
        </Text>
      </View>

      {/* 일러스트 — 남는 세로 공간 가운데에 둬서 화면이 길어도 짧아도 자연스럽게 */}
      <View className="flex-1 items-center justify-center">
        <Image
          source={INTRO_ART}
          contentFit="contain"
          style={{ width: scale(112), height: scale(96) }}
        />
      </View>

      {/* 시작하기 — AI 추천 일정 첫 화면과 같은 크기(220x64)·위치(하단에서 80). */}
      <View
        className="items-center"
        style={{ paddingBottom: verticalScale(80) }}
      >
        <Pressable
          onPress={() => router.push("/reels/gallery?mode=new")}
          className="active:opacity-80"
          style={{ width: PILL_W, height: BUTTON_H }}
          accessibilityRole="button"
          accessibilityLabel="시작하기"
        >
          <View
            className="items-center justify-center"
            style={{
              width: PILL_W,
              height: BUTTON_H,
              borderRadius: 999,
              backgroundColor: PILL_BG,
            }}
          >
            {/* 알약 전체 폭(화면 기준 정중앙) 기준으로 가운데 맞춘다. */}
            <Text
              className="font-bold text-white text-center"
              style={{ fontSize: moderateScale(17) }}
            >
              시작하기
            </Text>
          </View>
          <View
            className="absolute items-center justify-center rounded-full"
            style={{
              right: 0,
              width: BUTTON_H,
              height: BUTTON_H,
              backgroundColor: KNOB_BG,
            }}
          >
            <Feather name="chevron-right" size={moderateScale(22)} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
