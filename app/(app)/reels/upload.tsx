import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { Text } from "@/src/components/Text";
import { MAX_UPLOAD_BYTES, videoFileSize } from "@/src/features/video/api";
import { useUploadReelsVideo } from "@/src/features/video/queries";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#4FD1C5";

/** 업로드하기 알약 높이 = 우측 원형 화살표 지름(끝단을 딱 맞춘다). */
const BUTTON_H = verticalScale(56);

/** 서버 title 상한. */
const TITLE_MAX = 100;

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

      {/* 닫기 */}
      <View
        className="flex-row items-center"
        style={{ paddingHorizontal: scale(20), ...headerBarStyle() }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          disabled={busy}
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

        {/* 업로드하기 — 알약 버튼 + 우측 원형 화살표 */}
        <Pressable
          onPress={onPickVideo}
          disabled={busy}
          className="active:opacity-80"
          style={{
            width: scale(220),
            height: BUTTON_H,
            marginBottom: verticalScale(70),
            opacity: busy ? 0.6 : 1,
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
            {/* 우측 원형 화살표가 알약 위에 겹쳐 있으므로, 그 폭만큼 빼고 가운데를 잡는다
                (전체 폭 기준으로 잡으면 글씨가 화살표 쪽으로 밀려 보인다). */}
            <Text
              className="text-center font-bold text-white"
              style={{ fontSize: moderateScale(17), paddingRight: BUTTON_H }}
            >
              {busy ? `업로드 중 ${percent}%` : "업로드하기"}
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
          </LinearGradient>
        </Pressable>
      </View>

      <TitleInputCard
        video={picked}
        title={title}
        onChangeTitle={setTitle}
        onCancel={() => setPicked(null)}
        onSubmit={startUpload}
      />

      <UploadDoneCard visible={done} onConfirm={goMyReels} />
    </SafeAreaView>
  );
}

/** 업로드 직전 제목 입력. 비워 두면 제목 없는 릴스로 올라간다. */
function TitleInputCard({
  video,
  title,
  onChangeTitle,
  onCancel,
  onSubmit,
}: {
  video: PickedVideo | null;
  title: string;
  onChangeTitle: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      visible={video != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.65)",
          paddingHorizontal: scale(28),
        }}
      >
        <View
          className="w-full"
          style={{
            backgroundColor: "#1C1C1C",
            borderRadius: scale(20),
            borderWidth: 1,
            borderColor: "#333333",
            paddingVertical: verticalScale(24),
            paddingHorizontal: scale(20),
            elevation: 12,
            shadowColor: "#000000",
          }}
        >
          <Text
            className="text-white"
            style={{ fontSize: moderateScale(17), fontWeight: 650 as never }}
          >
            제목을 정해주세요
          </Text>
          <Text
            className="font-medium"
            style={{
              color: "#9CA3AF",
              fontSize: moderateScale(12),
              marginTop: verticalScale(6),
            }}
          >
            비워 두면 제목 없이 올라가요
            {video?.size != null ? ` · ${formatMb(video.size)}` : ""}
          </Text>

          <TextInput
            value={title}
            onChangeText={onChangeTitle}
            placeholder="예) 강릉 바다 드라이브"
            placeholderTextColor="#6B7280"
            maxLength={TITLE_MAX}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            className="text-white"
            style={{
              marginTop: verticalScale(16),
              height: verticalScale(46),
              borderRadius: scale(12),
              backgroundColor: "#262626",
              paddingHorizontal: scale(14),
              fontSize: moderateScale(14),
            }}
          />
          <Text
            className="text-right"
            style={{
              color: "#6B7280",
              fontSize: moderateScale(11),
              marginTop: verticalScale(6),
            }}
          >
            {title.length}/{TITLE_MAX}
          </Text>

          <View
            className="flex-row"
            style={{ marginTop: verticalScale(16), gap: scale(10) }}
          >
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center justify-center active:opacity-80"
              style={{
                height: verticalScale(46),
                borderRadius: 999,
                backgroundColor: "#333333",
              }}
              accessibilityRole="button"
              accessibilityLabel="취소"
            >
              <Text
                className="font-bold text-white"
                style={{ fontSize: moderateScale(15) }}
              >
                취소
              </Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              className="flex-1 items-center justify-center active:opacity-80"
              style={{
                height: verticalScale(46),
                borderRadius: 999,
                backgroundColor: ACCENT,
              }}
              accessibilityRole="button"
              accessibilityLabel="업로드"
            >
              <Text
                className="font-bold"
                style={{ color: "#06322E", fontSize: moderateScale(15) }}
              >
                업로드
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
