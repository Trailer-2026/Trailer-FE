import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { Text } from "@/src/components/Text";
import { useUploadReelsVideo } from "@/src/features/video/queries";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#4FD1C5";

/** 업로드하기 알약 높이 = 우측 원형 화살표 지름(끝단을 딱 맞춘다). */
const BUTTON_H = verticalScale(56);

/**
 * 직접 만든 영상 업로드 — 안내 후 갤러리(영상만)에서 1개 골라 바로 올린다.
 *
 * 렌더 파이프라인(create → gallery → edit → progress)과 달리 서버가 응답 시점에
 * 완성된 릴스를 주므로 진행률 화면이 없다. 올리고 나면 내 영상 목록으로 보낸다.
 */
export default function ReelsUploadScreen() {
  const upload = useUploadReelsVideo();

  const onPickAndUpload = async () => {
    // 갤러리 읽기 권한. 안드로이드 13+ 는 시스템 피커라 권한 요청이 즉시 통과한다.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "영상을 올리려면 갤러리 접근을 허용해 주세요.");
      return;
    }

    // 영상만 — 사진은 목록에 뜨지 않는다.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    upload.mutate(
      {
        video: {
          uri: asset.uri,
          name: asset.fileName ?? "reels.mp4",
          type: asset.mimeType ?? "video/mp4",
        },
      },
      {
        onSuccess: () => {
          Alert.alert("업로드 완료", "내 영상 목록에서 확인할 수 있어요.");
          router.replace("/profile/reels");
        },
        // 400(영상 아님·손상·100MB 초과) / 502(저장소 실패) 는 서버 문구를 그대로 보여준다.
        onError: (err) => Alert.alert("업로드 실패", describeApiError(err)),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 닫기 */}
      <View
        className="flex-row items-center"
        style={{ paddingHorizontal: scale(20), ...headerBarStyle() }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          disabled={upload.isPending}
          style={{
            width: scale(28),
            height: scale(28),
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Feather name="x" size={moderateScale(24)} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="flex-1 items-center" style={{ paddingHorizontal: scale(20) }}>
        <Text
          className="text-center text-white"
          style={{
            marginTop: verticalScale(70),
            fontSize: moderateScale(24),
            lineHeight: moderateScale(34),
            fontWeight: 650 as never,
          }}
        >
          {/* '영상 업로드'만 강조색, 나머지는 바깥 굵기를 물려받는다. */}
          <Text className="font-bold" style={{ color: ACCENT }}>
            영상 업로드
          </Text>
          에{"\n"}
          오신 것을 환영합니다.
        </Text>

        <Text
          className="text-center font-medium"
          style={{
            color: "#9CA3AF",
            fontSize: moderateScale(13),
            lineHeight: moderateScale(21),
            marginTop: verticalScale(20),
          }}
        >
          직접 만든 영상도 릴스로 올릴 수 있어요.{"\n"}
          원하는 영상을 업로드해보세요.
        </Text>

        {/* 일러스트 — 남는 공간 가운데. PlayIcon 이 라운드 프레임까지 그린다. */}
        <View className="flex-1 items-center justify-center">
          <PlayIcon
            width={scale(110)}
            height={scale(110)}
            color={ACCENT}
          />
        </View>

        {/* 업로드하기 — 알약 버튼 + 우측 원형 화살표 */}
        <Pressable
          onPress={onPickAndUpload}
          disabled={upload.isPending}
          className="active:opacity-80"
          style={{
            width: scale(220),
            height: BUTTON_H,
            marginBottom: verticalScale(70),
            opacity: upload.isPending ? 0.6 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel="업로드하기"
        >
          <LinearGradient
            colors={["#8FE3DA", "#4FD1C5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="justify-center"
            style={{ flex: 1, borderRadius: 999 }}
          >
            <Text
              className="text-center font-bold text-white"
              style={{ fontSize: moderateScale(17) }}
            >
              {upload.isPending ? "업로드 중..." : "업로드하기"}
            </Text>
            {/* 알약 높이와 지름을 같게 두고 오른쪽 끝에 붙인다 → 둥근 끝단이 정확히 겹친다. */}
            <View
              className="absolute items-center justify-center rounded-full"
              style={{
                right: 0,
                width: BUTTON_H,
                height: BUTTON_H,
                backgroundColor: "#3FBFB4",
              }}
            >
              {upload.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Feather
                  name="chevron-right"
                  size={moderateScale(22)}
                  color="#FFFFFF"
                />
              )}
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
