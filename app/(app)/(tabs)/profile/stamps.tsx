import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { useMyStamps } from "@/src/features/stamp/queries";
import type { Stamp } from "@/src/features/stamp/types";
import { headerBarStyle } from "@/src/utils/header";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
/** 헤더 + 달성 현황 띠를 잇는 상단 영역 색 (Figma 시안) */
const TOP_BG = "#EAEEF7";
const TEXT_MAIN = "#353535";
/** 달성한 스탬프 칸 */
const CARD_BG = "#E4ECFF";
/** 미달성 스탬프 — 그림은 감추고 자물쇠만 보여준다 */
const LOCKED_BG = "#F1F4FB";
const COUNT_COLOR = "#6A6A6A";

const LOCK = require("../../../../assets/images/style/Lock.png");

type CouponDef = { id: number; title: string; desc: string; required: number };

const MOCK_COUPONS: CouponDef[] = [
  { id: 1, title: "여행지 맛집 음료 1잔 무료", desc: "트레일러 추천 맛집 예약 시 음료 1잔 증정", required: 3 },
  { id: 2, title: "제휴 숙소 첫 예약 10% 할인", desc: "파트너 숙소 첫 예약 시 10% 즉시 할인", required: 5 },
  { id: 3, title: "여행지 맛집 예약 15% 할인", desc: "트레일러 코스 내 제휴 맛집 예약 할인", required: 10 },
  { id: 4, title: "파트너 호텔 1박 20% 할인", desc: "제휴 호텔 예약 시 객실 요금 20% 할인", required: 15 },
  { id: 5, title: "숙소 + 맛집 콤보 특가", desc: "제휴 숙소·맛집 동시 예약 시 추가 5% 할인", required: 20 },
];

/**
 * Figma 시안(360 기준) 치수 — 좌우 여백 21, 칸 사이 8, 칸 101x101(정사각).
 * 칸 크기는 화면 폭에서 계산하므로 폭이 다른 기기에서도 3열 정사각이 유지된다.
 */
const PAD = scale(21);
const GAP = scale(8);
const COLS = 3;

/**
 * 마이페이지 > 스탬프.
 *
 * 서버가 미달성 칸까지 정렬해 내려주므로 응답 순서 그대로 그린다(앱이 정렬하지 않음).
 * achieved=false 인 칸만 흐리게 + 자물쇠를 덮는다.
 */
export default function StampsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, isLoading, error, refetch } = useMyStamps();
  const [showCoupons, setShowCoupons] = useState(false);

  // 3열 그리드 — 좌우 여백과 칸 사이 간격을 뺀 나머지를 균등 분할.
  const cardSize = (width - PAD * 2 - GAP * (COLS - 1)) / COLS;

  return (
    <View className="flex-1 bg-white">
      {/* 헤더 — 아래 달성 현황 띠와 같은 색으로 이어 붙인다. */}
      <View
        className="flex-row items-center"
        style={{
          ...headerBarStyle(insets.top),
          paddingHorizontal: scale(16),
          backgroundColor: TOP_BG,
        }}
      >
        <Pressable
          // back() 이 아니라 프로필 탭으로 고정한다. 스탬프 알림을 탭해 들어오면
          // 이전 화면이 알림 탭이라 back() 은 엉뚱한 곳으로 돌아간다.
          onPress={() => router.navigate("/profile")}
          hitSlop={12}
          style={{ padding: scale(4) }}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
        </Pressable>
        <Text
          className="font-bold"
          style={{
            fontSize: moderateScale(16),
            marginLeft: scale(8),
            color: TEXT_MAIN,
          }}
        >
          스탬프
        </Text>
      </View>

      {/* 달성 현황 띠 */}
      <View
        className="flex-row items-center justify-between"
        style={{
          backgroundColor: TOP_BG,
          paddingHorizontal: PAD,
          paddingTop: verticalScale(34),
          paddingBottom: verticalScale(20),
        }}
      >
        <View className="flex-row items-center" style={{ gap: scale(12) }}>
          <Text
            className="font-semibold"
            style={{ fontSize: moderateScale(14), color: TEXT_MAIN }}
          >
            스탬프 달성 현황
          </Text>
          {data ? (
            <Text
              className="font-medium"
              style={{ fontSize: moderateScale(22), color: COUNT_COLOR }}
            >
              {data.achieved_count}개
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => setShowCoupons(true)}
          className="flex-row items-center active:opacity-70"
          style={{
            backgroundColor: ACCENT,
            borderRadius: scale(10),
            paddingHorizontal: scale(10),
            paddingVertical: verticalScale(7),
            gap: scale(5),
          }}
        >
          <Feather name="tag" size={moderateScale(13)} color="white" />
          <Text
            className="font-semibold text-white"
            style={{ fontSize: moderateScale(12) }}
          >
            여행 쿠폰
          </Text>
        </Pressable>
      </View>

      <CouponModal
        visible={showCoupons}
        onClose={() => setShowCoupons(false)}
        achievedCount={data?.achieved_count ?? 0}
      />

      {isLoading ? (
        <Centered>
          <ActivityIndicator color={ACCENT} />
        </Centered>
      ) : error || !data ? (
        <Centered>
          <Text
            className="font-semibold text-gray-900"
            style={{ fontSize: moderateScale(15) }}
          >
            스탬프를 불러오지 못했어요
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-gray-800 rounded-full active:opacity-80"
            style={{
              marginTop: verticalScale(12),
              paddingHorizontal: scale(20),
              paddingVertical: verticalScale(10),
            }}
          >
            <Text
              className="text-white font-semibold"
              style={{ fontSize: moderateScale(14) }}
            >
              다시 시도
            </Text>
          </Pressable>
        </Centered>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: PAD,
            paddingTop: verticalScale(30),
            paddingBottom: verticalScale(32),
          }}
        >
          <View
            className="flex-row flex-wrap"
            style={{ gap: GAP, rowGap: verticalScale(18) }}
          >
            {data.stamps.map((stamp) => (
              <StampCell key={stamp.type} stamp={stamp} size={cardSize} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 스탬프 한 칸 (이미지 카드 + 아래 이름)                                 */
/* ------------------------------------------------------------------ */
function StampCell({ stamp, size }: { stamp: Stamp; size: number }) {
  const [failed, setFailed] = useState(false);
  const locked = !stamp.achieved;
  // 진행도가 있는 잠긴 스탬프만 "3/10" 을 자물쇠 아래 보여준다(1회성 스탬프는 생략).
  const showProgress = locked && stamp.goal > 1;

  return (
    <View style={{ width: size }}>
      {/* 칸은 시안대로 정사각 + r10, 테두리 없이 배경색으로만 달성 여부를 구분한다. */}
      <View
        className="items-center justify-center"
        style={{
          width: size,
          height: size,
          borderRadius: scale(10),
          overflow: "hidden",
          backgroundColor: locked ? LOCKED_BG : CARD_BG,
        }}
      >
        {locked ? (
          <>
            <Image
              source={LOCK}
              contentFit="contain"
              style={{ width: size * 0.39, height: size * 0.39 }}
            />
            {showProgress ? (
              <Text
                className="font-bold"
                style={{
                  fontSize: moderateScale(10),
                  // 밝은 배경으로 바뀌어 흰색은 안 보인다 → 자물쇠와 같은 회색 계열.
                  color: "#9BA3B4",
                  marginTop: verticalScale(4),
                }}
              >
                {stamp.progress}/{stamp.goal}
              </Text>
            ) : null}
          </>
        ) : failed ? (
          <Feather name="award" size={size * 0.4} color="#B7C4E4" />
        ) : (
          <Image
            source={{ uri: stamp.image_url }}
            contentFit="contain"
            onError={() => setFailed(true)}
            style={{ width: size * 0.8, height: size * 0.8 }}
          />
        )}
      </View>

      {/* 이름 — 2줄 자리를 고정해 아래 줄 카드들이 어긋나지 않게 한다.
          라벨은 칸 너비에 맞춰 커지므로 폰트도 moderateScale 로 함께 움직인다. */}
      <Text
        className="text-center font-medium"
        numberOfLines={2}
        style={{
          marginTop: scale(9),
          fontSize: moderateScale(11),
          lineHeight: moderateScale(14),
          height: moderateScale(28),
          color: locked ? "#9AA0AC" : TEXT_MAIN,
        }}
      >
        {stamp.title}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* 여행 쿠폰 모달 (목업)                                                   */
/* ------------------------------------------------------------------ */
function CouponModal({
  visible,
  onClose,
  achievedCount,
}: {
  visible: boolean;
  onClose: () => void;
  achievedCount: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View
          className="bg-white"
          style={{
            borderTopLeftRadius: scale(20),
            borderTopRightRadius: scale(20),
            paddingBottom: insets.bottom,
          }}
        >
          {/* 헤더 */}
          <View
            className="flex-row items-center justify-between"
            style={{
              paddingHorizontal: scale(20),
              paddingTop: verticalScale(20),
              paddingBottom: verticalScale(4),
            }}
          >
            <Text
              className="font-bold"
              style={{ fontSize: moderateScale(18), color: TEXT_MAIN }}
            >
              여행 쿠폰
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={moderateScale(22)} color="#6A6A6A" />
            </Pressable>
          </View>
          <Text
            className="font-medium"
            style={{
              fontSize: moderateScale(13),
              color: COUNT_COLOR,
              paddingHorizontal: scale(20),
              marginBottom: verticalScale(14),
            }}
          >
            스탬프를 모아 여행 혜택을 받아 보세요
          </Text>

          {/* 쿠폰 목록 */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: verticalScale(340) }}
            contentContainerStyle={{
              paddingHorizontal: scale(20),
              paddingBottom: verticalScale(24),
            }}
          >
            {MOCK_COUPONS.map((coupon, i) => (
              <View
                key={coupon.id}
                style={{ marginBottom: i < MOCK_COUPONS.length - 1 ? verticalScale(10) : 0 }}
              >
                <CouponCard coupon={coupon} achievedCount={achievedCount} />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CouponCard({
  coupon,
  achievedCount,
}: {
  coupon: CouponDef;
  achievedCount: number;
}) {
  const unlocked = achievedCount >= coupon.required;
  const remaining = coupon.required - achievedCount;

  return (
    <View
      className="flex-row items-center"
      style={{
        backgroundColor: unlocked ? "#EEF2FF" : "#F6F7FA",
        borderRadius: scale(12),
        padding: scale(14),
        borderLeftWidth: 3,
        borderLeftColor: unlocked ? ACCENT : "#D1D5DB",
        gap: scale(12),
      }}
    >
      {/* 아이콘 */}
      <View
        className="items-center justify-center"
        style={{
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: unlocked ? ACCENT : "#D1D5DB",
        }}
      >
        <Feather name="tag" size={moderateScale(18)} color="white" />
      </View>

      {/* 텍스트 */}
      <View className="flex-1">
        <Text
          className="font-semibold"
          style={{
            fontSize: moderateScale(13),
            color: unlocked ? TEXT_MAIN : "#9AA0AC",
          }}
        >
          {coupon.title}
        </Text>
        <Text
          style={{
            fontSize: moderateScale(11),
            color: unlocked ? COUNT_COLOR : "#B0B5BF",
            marginTop: verticalScale(2),
          }}
        >
          {coupon.desc}
        </Text>
        {!unlocked && (
          <Text
            className="font-medium"
            style={{
              fontSize: moderateScale(11),
              color: ACCENT,
              marginTop: verticalScale(4),
            }}
          >
            {remaining}개 더 모으면 받을 수 있어요
          </Text>
        )}
      </View>

      {/* 상태 */}
      {unlocked ? (
        <View
          style={{
            backgroundColor: ACCENT,
            borderRadius: scale(8),
            paddingHorizontal: scale(10),
            paddingVertical: verticalScale(6),
          }}
        >
          <Text
            className="font-semibold text-white"
            style={{ fontSize: moderateScale(11) }}
          >
            받기
          </Text>
        </View>
      ) : (
        <View className="items-center" style={{ gap: verticalScale(2) }}>
          <Feather name="lock" size={moderateScale(16)} color="#D1D5DB" />
          <Text
            style={{ fontSize: moderateScale(10), color: "#B0B5BF" }}
          >
            {coupon.required}개
          </Text>
        </View>
      )}
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ paddingHorizontal: scale(24) }}
    >
      {children}
    </View>
  );
}
