import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { Text } from "@/src/components/Text";
import { MAX_UPLOAD_BYTES, videoFileSize } from "@/src/features/video/api";
import TitleInputCard from "@/src/features/video/components/TitleInputCard";
import { useUploadReelsVideo } from "@/src/features/video/queries";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#4FD1C5";
/** 알약 배경(반투명) — ACCENT 를 영상 만들기 화면의 PILL_BG 와 같은 방식(63% 알파)으로. */
const PILL_BG = "rgba(79, 209, 197, 0.63)";
const KNOB_BG = "#3FBFB4";
/** 영상 만들기 첫 화면(create.tsx)과 같은 크기·위치로 맞춘다. */
const PILL_W = scale(220);
const BUTTON_H = verticalScale(64);

type PickedVideo = {
  uri: string;
  name: string;
  type: string;
  /** 읽을 수 없으면 null — 그때는 크기를 표시하지 않는다. */
  size: number | null;
};

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * 직접 만든 영상 업로드 — 안내 → 갤러리(영상만) 선택 → 제목 입력 → 업로드.
 *
 * 렌더 파이프라인(create → gallery → edit → progress)과 달리 서버가 응답 시점에
 * 완성된 릴스를 주므로 진행률 폴링 화면이 없다. 대신 업로드 자체가 수 분 걸릴 수 있어
 * onUploadProgress 로 퍼센트를 버튼에 그린다.
 */
export default function ReelsUploadScreen() {
  const upload = useUploadReelsVideo();
  // 고른 영상 — 제목 입력 카드를 띄우는 동안만 보관한다.
  const [picked, setPicked] = useState<PickedVideo | null>(null);
  const [title, setTitle] = useState("");
  // 업로드 중인 영상 + 진행률(0~100).
  const [uploading, setUploading] = useState<PickedVideo | null>(null);
  const [percent, setPercent] = useState(0);
  const [done, setDone] = useState(false);

  const onPickVideo = async () => {
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

    // 100MB 초과는 제목을 묻기 전에 걸러 낸다(전송해 봐야 실패한다).
    const size = asset.fileSize ?? videoFileSize(asset.uri);
    if (size != null && size > MAX_UPLOAD_BYTES) {
      Alert.alert(
        "영상이 너무 커요",
        `${formatMb(size)} 영상이에요. 100MB 이하만 올릴 수 있어요.`,
      );
      return;
    }

    setTitle("");
    setPicked({
      uri: asset.uri,
      name: asset.fileName ?? "reels.mp4",
      type: asset.mimeType ?? "video/mp4",
      size,
    });
  };

  const startUpload = () => {
    if (!picked) return;
    const target = picked;
    const trimmed = title.trim();

    setPicked(null);
    setUploading(target);
    setPercent(0);

    upload.mutate(
      {
        video: target,
        // 비우면 제목 없는 릴스가 된다(서버가 null 로 저장).
        title: trimmed || undefined,
        onProgress: setPercent,
      },
      {
        onSuccess: () => {
          setUploading(null);
          setDone(true);
        },
        // 400(영상 아님·손상·100MB 초과) / 502(저장소 실패) 는 서버 문구를 그대로 보여준다.
        onError: (err) => {
          setUploading(null);
          Alert.alert("업로드 실패", describeApiError(err));
        },
      },
    );
  };

  const goMyReels = () => {
    setDone(false);
    router.replace("/profile/reels");
  };

  const busy = upload.isPending;

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 닫기 — 영상 만들기 첫 화면과 같은 크기·위치. */}
      <View
        className="flex-row items-center"
        style={{ paddingHorizontal: scale(21), ...headerBarStyle() }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Feather name="x" size={moderateScale(20)} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="flex-1 items-center" style={{ paddingHorizontal: scale(20) }}>
        {/* 안내 문구 — 영상 만들기 첫 화면(create.tsx)과 같은 폰트 크기·굵기·줄간격·여백. */}
        <View style={{ paddingHorizontal: scale(28), marginTop: verticalScale(80) }}>
          <Text
            className="text-center text-white"
            style={{
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
            className="text-center font-medium text-white"
            style={{
              fontSize: moderateScale(13),
              lineHeight: moderateScale(21),
              marginTop: verticalScale(20),
            }}
          >
            직접 만든 영상도 릴스로 올릴 수 있어요.{"\n"}
            원하는 영상을 업로드해보세요.
          </Text>
        </View>

        {/* 일러스트 — 남는 공간 가운데. PlayIcon 이 라운드 프레임까지 그린다. */}
        <View className="flex-1 items-center justify-center">
          <PlayIcon width={scale(110)} height={scale(110)} color={ACCENT} />
        </View>

        {/* 업로드 중 상태 — 크기와 퍼센트를 함께 보여줘 멈춘 게 아님을 알린다 */}
        {busy ? (
          <Text
            className="text-center font-medium"
            style={{
              color: "#9CA3AF",
              fontSize: moderateScale(12),
              marginBottom: verticalScale(12),
            }}
          >
            {uploading?.size != null
              ? `${formatMb(uploading.size)} 업로드 중 · ${percent}%`
              : `업로드 중 · ${percent}%`}
            {percent >= 100 ? "\n서버가 대표 이미지를 만드는 중이에요" : ""}
          </Text>
        ) : null}

        {/* 업로드하기 — 영상 만들기 첫 화면과 같은 크기(220x64)·위치(하단에서 80),
            반투명 알약 + 진한 원형 버튼(그라데이션 대신 단색). */}
        <View
          className="items-center"
          style={{ paddingBottom: verticalScale(80) }}
        >
        <Pressable
          onPress={onPickVideo}
          disabled={busy}
          className="active:opacity-80"
          style={{
            width: PILL_W,
            height: BUTTON_H,
            opacity: busy ? 0.6 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel="업로드하기"
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
              className="text-center font-bold text-white"
              style={{ fontSize: moderateScale(17) }}
            >
              {busy ? `업로드 중 ${percent}%` : "업로드하기"}
            </Text>
          </View>
          {/* 알약 높이와 지름을 같게 두고 오른쪽 끝에 붙인다 → 둥근 끝단이 정확히 겹친다. */}
          <View
            className="absolute items-center justify-center rounded-full"
            style={{
              right: 0,
              width: BUTTON_H,
              height: BUTTON_H,
              backgroundColor: KNOB_BG,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Feather
                name="chevron-right"
                size={moderateScale(22)}
                color="#FFFFFF"
              />
            )}
          </View>
        </Pressable>
        </View>
      </View>

      <TitleInputCard
        visible={picked != null}
        title={title}
        onChangeTitle={setTitle}
        onCancel={() => setPicked(null)}
        onSubmit={startUpload}
        heading="제목을 정해주세요"
        hint={picked?.size != null ? formatMb(picked.size) : undefined}
        submitLabel="업로드"
      />

      <UploadDoneCard visible={done} onConfirm={goMyReels} />
    </SafeAreaView>
  );
}

/** 업로드 완료 안내 — 렌더 완료 배너(RenderTracker)와 같은 다크 카드 톤. */
function UploadDoneCard({
  visible,
  onConfirm,
}: {
  visible: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onConfirm}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.65)",
          paddingHorizontal: scale(36),
        }}
      >
        <View
          className="w-full items-center"
          style={{
            backgroundColor: "#1C1C1C",
            borderRadius: scale(20),
            borderWidth: 1,
            borderColor: ACCENT,
            paddingVertical: verticalScale(28),
            paddingHorizontal: scale(20),
            elevation: 12,
            shadowColor: "#000000",
          }}
        >
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: moderateScale(58),
              height: moderateScale(58),
              backgroundColor: "rgba(79,209,197,0.15)",
            }}
          >
            <Feather name="check" size={moderateScale(30)} color={ACCENT} />
          </View>

          <Text
            className="text-white"
            style={{
              marginTop: verticalScale(16),
              fontSize: moderateScale(18),
              fontWeight: 650 as never,
            }}
          >
            업로드 완료
          </Text>
          <Text
            className="text-center font-medium"
            style={{
              color: "#9CA3AF",
              marginTop: verticalScale(8),
              fontSize: moderateScale(13),
              lineHeight: moderateScale(20),
            }}
          >
            업로드된 영상을 확인해보세요!
          </Text>

          <Pressable
            onPress={onConfirm}
            className="w-full items-center justify-center active:opacity-80"
            style={{
              marginTop: verticalScale(22),
              height: verticalScale(46),
              borderRadius: 999,
              backgroundColor: ACCENT,
            }}
            accessibilityRole="button"
            accessibilityLabel="내 영상 보기"
          >
            <Text
              className="font-bold"
              style={{ color: "#06322E", fontSize: moderateScale(15) }}
            >
              내 영상 보기
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
