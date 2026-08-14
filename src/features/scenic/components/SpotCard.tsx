import Feather from "@expo/vector-icons/Feather";
import { View } from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { formatDistance, sideLabel } from "../format";
import type { ScenicSpotItem } from "../types";

const ACCENT = "#5E84F4";
/** 창밖 방향(화살표 + 좌/우 라벨) 색. */
const SIDE_ACCENT = "#668DFF";

/**
 * 관광지 카드. side(좌/우)를 가장 크게 보여준다.
 *
 * 서버가 거리순으로 주므로 첫 번째가 가장 가까운 곳이다. 내비게이션의 '다음 안내'
 * 처럼 그 한 장만 크게 띄우고 테두리를 둘러 시선을 몰아준다(primary). 나머지는
 * 곧 지나갈 후보라 한 단계 작고 조용하게 그린다.
 */
export default function SpotCard({
  item,
  highlight,
  /** 가장 가까운 곳인지 — 목록의 첫 장에만 준다. */
  primary = false,
  /** 카드 배경 — 알림 탭은 분홍/밤 배경 위라 흰색이 필요하다. */
  backgroundColor = "#F4F4F6",
  /** 방향 뱃지 배경 — 카드 배경과 대비되어야 한다. */
  badgeColor = "#FFFFFF",
}: {
  item: ScenicSpotItem;
  highlight: boolean;
  primary?: boolean;
  backgroundColor?: string;
  badgeColor?: string;
}) {
  const left = item.side === "left";

  return (
    <View
      className="flex-row items-center"
      style={{
        backgroundColor,
        borderRadius: scale(primary ? 12 : 10),
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(primary ? 13 : 11),
        gap: scale(primary ? 12 : 11),
        // 주인공만 테두리 + 그림자로 한 겹 띄운다.
        // NativeWind shadow-* 는 안드로이드에서 흐릿해 elevation 을 직접 준다.
        ...(primary
          ? {
              borderWidth: 1.5,
              borderColor: SIDE_ACCENT,
              elevation: 2,
              shadowColor: "#000000",
            }
          : null),
      }}
    >
      {/* 창밖 방향 — 화살표 + 라벨을 한 덩어리로 크게 */}
      <View
        className="items-center justify-center"
        style={{
          width: scale(primary ? 60 : 54),
          paddingVertical: verticalScale(primary ? 6 : 5),
          borderRadius: scale(8),
          backgroundColor: primary ? SIDE_ACCENT : badgeColor,
        }}
      >
        <Feather
          name={left ? "arrow-left" : "arrow-right"}
          size={moderateScale(primary ? 20 : 17)}
          color={primary ? "#FFFFFF" : SIDE_ACCENT}
        />
        <Text
          className="font-bold"
          style={{
            fontSize: moderateScale(primary ? 11 : 10.5),
            color: primary ? "#FFFFFF" : SIDE_ACCENT,
            marginTop: verticalScale(2),
          }}
        >
          {sideLabel(item.side)}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <View className="flex-row items-center" style={{ gap: scale(6) }}>
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(primary ? 15.5 : 14) }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {highlight ? (
            <View
              style={{
                paddingHorizontal: scale(6),
                paddingVertical: verticalScale(2),
                borderRadius: scale(4),
                backgroundColor: "#EEF2FF",
              }}
            >
              <Text
                className="font-bold"
                style={{ fontSize: moderateScale(10), color: ACCENT }}
              >
                NEW
              </Text>
            </View>
          ) : null}
        </View>

        <View
          className="flex-row items-center"
          style={{ gap: scale(5), marginTop: verticalScale(3) }}
        >
          {/* 가장 가까운 곳은 거리를 색으로 띄워 '지금 이거'라는 걸 못 놓치게 한다. */}
          <Text
            className={primary ? "font-bold" : ""}
            style={{
              fontSize: moderateScale(primary ? 13 : 12),
              color: primary ? SIDE_ACCENT : "#6B7280",
            }}
          >
            {formatDistance(item.distance_m)}
          </Text>
          <Text
            className="text-gray-400"
            style={{ fontSize: moderateScale(primary ? 11.5 : 11) }}
            numberOfLines={1}
          >
            · {item.category}
          </Text>
        </View>
      </View>
    </View>
  );
}
