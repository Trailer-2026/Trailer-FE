import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import PlayIcon from "@/src/components/icons/PlayIcon";
import { Text } from "@/src/components/Text";
import RenderOptions from "@/src/features/reels/components/RenderOptions";
import {
  ThemeBackground,
  ThemeParticles,
} from "@/src/features/reels/components/ThemePreview";
import { DEFAULT_RENDER_OPTIONS } from "@/src/features/video/options";
import type { RenderOptions as RenderOptionsValue } from "@/src/features/video/types";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

/**
 * 다녀온 여행 → 여행 영상 만들기.
 *
 * 사진을 고르는 릴스 만들기와 달리 재료(일정·좌표·붙여둔 사진)가 이미 서버에 있어서
 * 제목·BGM·테마만 고르면 끝이다 — 버튼 한 번으로 렌더가 시작된다.
 *
 * 옵션 UI 는 릴스 편집 화면과 같은 RenderOptions 를 그대로 쓴다(칩 + BGM 미리듣기).
 * TODO: POST /api/videos/render/travel 배선 — travel_idx + title/bgm/theme 를 보내고
 *       응답의 reels_idx 로 기존 진행률 화면(/reels/progress)에 넘긴다.
 */
export default function TravelVideoScreen() {
  const { travelIdx, travelTitle } = useLocalSearchParams<{
    travelIdx?: string;
    travelTitle?: string;
  }>();
  const idx = Number(travelIdx);

  const [options, setOptions] = useState<RenderOptionsValue>({
    ...DEFAULT_RENDER_OPTIONS,
    title: "",
  });

  const onCreate = () => {
    // TODO: 렌더 API 연결 전까지는 고른 값만 확인한다.
    Alert.alert(
      "곧 연결돼요",
      `여행 #${Number.isFinite(idx) ? idx : "?"}\n제목: ${options.title?.trim() || "(여행 제목 사용)"}\n테마: ${options.theme}\n음악: ${options.bgm || "무음"}`,
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* 고른 테마의 하늘색 — 콘텐츠보다 먼저 그려 뒤에 깔린다(파티클은 맨 앞). */}
      <ThemeBackground theme={options.theme} />

      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{ paddingHorizontal: scale(20), gap: scale(12), ...headerBarStyle() }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon
            color="#FFFFFF"
            width={moderateScale(12)}
            height={moderateScale(17)}
          />
        </Pressable>
        <Text
          className="font-bold text-white"
          style={{ fontSize: moderateScale(16) }}
        >
          여행 영상 만들기
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(20),
          paddingBottom: verticalScale(24),
        }}
      >
        {/* 어떤 여행인지 + 무엇이 만들어지는지 */}
        <View
          style={{
            // 뒤에 깔린 테마 색이 비치도록 반투명 카드로 둔다.
            backgroundColor: "rgba(0,0,0,0.45)",
            borderRadius: scale(14),
            padding: scale(16),
          }}
        >
          <Text
            className="font-bold text-white"
            numberOfLines={1}
            style={{ fontSize: moderateScale(15) }}
          >
            {travelTitle || "다녀온 여행"}
          </Text>
          <Text
            className="text-gray-400"
            style={{
              fontSize: moderateScale(12),
              lineHeight: moderateScale(18),
              marginTop: verticalScale(6),
            }}
          >
            여행에 등록해 둔 사진과 여행 중 찍어서 올린 사진을 모아, 버튼 한
            번으로 영상을 만들어 드려요. 일정 순서대로 이동 경로를 그리고 사진은
            찍은 자리에서 보여줘요. 앞뒤에는 TRAILER 인트로·아웃트로가 붙어요.
          </Text>
        </View>

        {/* 제목 · 테마 · 음악 */}
        <View style={{ marginTop: verticalScale(22) }}>
          <Text
            className="font-semibold text-white"
            style={{ fontSize: moderateScale(13), marginBottom: verticalScale(12) }}
          >
            영상 설정
          </Text>
          <RenderOptions
            value={options}
            onChange={(patch) => setOptions((prev) => ({ ...prev, ...patch }))}
          />
          <Text
            className="text-gray-500"
            style={{
              fontSize: moderateScale(11),
              lineHeight: moderateScale(16),
              marginTop: verticalScale(10),
            }}
          >
            제목을 비우면 여행 제목이 그대로 영상 제목이 돼요.
          </Text>
        </View>
      </ScrollView>

      {/* 원클릭 생성 */}
      <View
        style={{
          paddingHorizontal: scale(20),
          paddingBottom: verticalScale(16),
        }}
      >
        <Pressable
          onPress={onCreate}
          className="flex-row items-center justify-center active:opacity-80"
          style={{
            height: verticalScale(52),
            borderRadius: scale(26),
            backgroundColor: ACCENT,
            gap: scale(8),
          }}
          accessibilityRole="button"
          accessibilityLabel="영상 만들기"
        >
          <PlayIcon
            color="#FFFFFF"
            width={moderateScale(18)}
            height={moderateScale(18)}
          />
          <Text
            className="font-bold text-white"
            style={{ fontSize: moderateScale(16) }}
          >
            영상 만들기
          </Text>
        </Pressable>
      </View>

      {/* 눈·꽃잎 등 테마 파티클 — 화면 맨 앞에 떠서 터치는 통과시킨다. */}
      <ThemeParticles theme={options.theme} />
    </SafeAreaView>
  );
}
