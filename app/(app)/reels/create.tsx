import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ForwardIcon from "@/src/components/icons/ForwardIcon";
import { Text } from "@/src/components/Text";
import { captureFromCamera } from "@/src/features/reels/capture";
import MediaSourceSheet, {
  type MediaSource,
} from "@/src/features/reels/components/MediaSourceSheet";
import { useReelsCreateStore } from "@/src/features/reels/create-store";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/** Figma '영상만들기_시작' 시안 색 — 반투명 민트 알약 + 진한 민트 원형 버튼. */
const PILL_BG = "rgba(176, 230, 219, 0.63)";
const KNOB_BG = "#89E0CE";

const INTRO_ART = require("../../../assets/images/style/reels-intro-art.png");

/**
 * 영상 만들기 1단계 — 안내 후 촬영 또는 갤러리에서 사진/영상 선택.
 *
 * 촬영은 현재 GPS·시각을 바로 담고(capture.ts),
 * 갤러리는 위치·시각을 확실히 읽는 커스텀 그리드(/reels/gallery)로 보낸다.
 */
export default function ReelsCreateScreen() {
  const setAssets = useReelsCreateStore((s) => s.setAssets);
  const [sheetOpen, setSheetOpen] = useState(false);

  const onPickMedia = async (source: MediaSource) => {
    setSheetOpen(false);
    if (source === "camera") {
      const media = await captureFromCamera();
      if (media && media.length > 0) {
        setAssets(media);
        router.push("/reels/edit");
      }
    } else {
      router.push("/reels/gallery?mode=new");
    }
  };

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

      {/* 안내 문구 — 시안대로 가운데 정렬 2줄. 줄바꿈 위치도 시안을 따른다. */}
      <View style={{ paddingHorizontal: scale(28), marginTop: verticalScale(90) }}>
        <Text
          className="text-center font-semibold text-white"
          style={{ fontSize: moderateScale(22), lineHeight: moderateScale(26) }}
        >
          영상 만들기에{"\n"}오신 것을 환영합니다.
        </Text>
        <Text
          className="text-center font-medium text-white"
          style={{
            fontSize: moderateScale(12),
            lineHeight: moderateScale(17),
            marginTop: verticalScale(15),
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

      {/* 시작하기 — 알약 + 오른쪽 끝에 겹쳐 놓인 원형 화살표 버튼(시안 그대로) */}
      <View
        className="items-center"
        style={{ paddingBottom: verticalScale(60) }}
      >
        <Pressable
          onPress={() => setSheetOpen(true)}
          className="flex-row items-center active:opacity-80"
          style={{ width: scale(176), height: verticalScale(48) }}
          accessibilityRole="button"
          accessibilityLabel="시작하기"
        >
          <View
            className="items-center justify-center"
            style={{
              width: scale(175),
              height: verticalScale(48),
              borderRadius: verticalScale(30),
              backgroundColor: PILL_BG,
              // 오른쪽 원형 버튼과 겹치는 만큼 글자를 왼쪽으로 밀어 가운데처럼 보이게 한다.
              paddingRight: scale(40),
            }}
          >
            <Text
              className="font-bold text-white"
              style={{ fontSize: moderateScale(15) }}
            >
              시작하기
            </Text>
          </View>
          <View
            className="absolute items-center justify-center"
            style={{
              right: 0,
              width: scale(47),
              height: scale(47),
              borderRadius: scale(24),
              backgroundColor: KNOB_BG,
            }}
          >
            <ForwardIcon
              color="#FFFFFF"
              width={moderateScale(9)}
              height={moderateScale(14)}
            />
          </View>
        </Pressable>
      </View>

      <MediaSourceSheet
        visible={sheetOpen}
        onSelect={onPickMedia}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
