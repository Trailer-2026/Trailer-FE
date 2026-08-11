import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import {
  LEGAL_DOCUMENTS,
  type LegalDocumentKind,
} from "@/src/features/legal/documents";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

// marketing 은 약관 목록(LEGAL_MENU)에는 없고 알림 설정의 '동의항목 보기'로만 들어온다.
function isKind(v: string | undefined): v is LegalDocumentKind {
  return (
    v === "service" || v === "location" || v === "privacy" || v === "marketing"
  );
}

/**
 * 약관 상세 — kind 파라미터로 문서 선택 후 섹션 목록 렌더.
 * ScrollView + Text 만으로 가볍게 표시(웹뷰 X).
 */
export default function TermsDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { kind } = useLocalSearchParams<{ kind?: string }>();

  const doc = isKind(kind) ? LEGAL_DOCUMENTS[kind] : null;

  return (
    <View className="flex-1 bg-white">
      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{
          ...headerBarStyle(insets.top),
          paddingHorizontal: scale(16),
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ padding: scale(4) }}
        >
          <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
        </Pressable>
        <Text
          className="text-gray-900"
style={{
            fontSize: moderateScale(17),
            marginLeft: scale(8),
            fontWeight: 650 as never,
          }}
          numberOfLines={1}
        >
          {doc?.title ?? "약관"}
        </Text>
      </View>

      {doc ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(12),
            paddingBottom: verticalScale(40),
          }}
        >
          <Text
            className="text-gray-400"
            style={{
              fontSize: moderateScale(12),
              marginBottom: verticalScale(20),
            }}
          >
            {doc.effectiveDate}
          </Text>

          {doc.sections.map((section, idx) => (
            <View
              key={idx}
              style={{ marginBottom: verticalScale(22) }}
            >
              <Text
                className="font-bold text-gray-900"
                style={{
                  fontSize: moderateScale(14),
                  marginBottom: verticalScale(8),
                }}
              >
                {section.heading}
              </Text>
              <Text
                className="text-gray-700"
                style={{
                  fontSize: moderateScale(13),
                  lineHeight: moderateScale(21),
                }}
              >
                {section.body}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: scale(24) }}
        >
          <Text
            className="text-gray-400"
            style={{ fontSize: moderateScale(14) }}
          >
            문서를 찾을 수 없어요
          </Text>
        </View>
      )}
    </View>
  );
}
