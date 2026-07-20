import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { captureFromCamera, promptMediaSource } from "@/src/features/reels/capture";
import { useReelsCreateStore } from "@/src/features/reels/create-store";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/**
 * 영상 만들기 1단계 — 안내 후 촬영 또는 갤러리에서 사진/영상 선택.
 *
 * 촬영은 현재 GPS·시각을 바로 담고(capture.ts),
 * 갤러리는 위치·시각을 확실히 읽는 커스텀 그리드(/reels/gallery)로 보낸다.
 */
export default function ReelsCreateScreen() {
  const setAssets = useReelsCreateStore((s) => s.setAssets);

  const onPickMedia = async () => {
    const source = await promptMediaSource();
    if (source === "camera") {
      const media = await captureFromCamera();
      if (media && media.length > 0) {
        setAssets(media);
        router.push("/reels/edit");
      }
    } else if (source === "gallery") {
      router.push("/reels/gallery?mode=new");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 뒤로가기 */}
      <View
        style={{ paddingHorizontal: scale(20), paddingTop: verticalScale(16) }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: scale(28),
            height: scale(28),
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon
            color="#FFFFFF"
            width={moderateScale(12)}
            height={moderateScale(17)}
          />
        </Pressable>
      </View>

      {/* 안내 문구 */}
      <View className="flex-1 items-center justify-center px-5">
        <Text
          className="text-center font-bold text-white"
          style={{ fontSize: moderateScale(20) }}
        >
          영상만들기
        </Text>
        <Text
          className="text-center text-white"
          style={{ fontSize: moderateScale(13), marginTop: verticalScale(10) }}
        >
          기차여행의 설레는 순간을 기록해요
        </Text>
      </View>

      {/* 다음 → 갤러리 열기 */}
      <View
        className="flex-row justify-end"
        style={{
          paddingHorizontal: scale(20),
          paddingBottom: verticalScale(20),
        }}
      >
        <Pressable
          onPress={onPickMedia}
          hitSlop={12}
          className="flex-row items-center active:opacity-60"
          style={{ gap: scale(4) }}
          accessibilityRole="button"
          accessibilityLabel="사진 선택하기"
        >
          <Text
            className="font-bold text-teal-400"
            style={{ fontSize: moderateScale(15) }}
          >
            다음 {">"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
