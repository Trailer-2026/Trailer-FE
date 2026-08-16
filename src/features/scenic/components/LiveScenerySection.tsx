import { useMemo } from "react";
import { View } from "react-native";

import { Text } from "@/src/components/Text";
import type { TravelDetail } from "@/src/features/travel/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { collectTrainSegments } from "../segments";
import { useIsRiding } from "../store";

/**
 * 여행 상세 상단의 "기차 탑승" 안내 한 줄.
 *
 * **탑승 중일 때는 아무것도 그리지 않는다.** 구간·기준 시각·알림 끄기는 전부
 * 타임라인의 승차 ↔ 하차 사이(ScenicTimelineRow)에 있어서, 여기에 또 그리면
 * 같은 정보가 화면에 두 번 나온다. 창밖을 보는 사람에게는 "지금 이 구간의
 * 어디쯤"이 곧 위치라 일정표 안쪽이 읽기 좋은 자리다.
 *
 * 탑승 전에는 그 자리가 아직 비어 있으므로, 여기서 무엇이 일어날지만 알려준다.
 * 열차 구간이 아예 없으면 렌더하지 않는다.
 */
export default function LiveScenerySection({
  detail,
}: {
  detail: TravelDetail;
}) {
  const riding = useIsRiding(detail.travel_idx);
  const segments = useMemo(() => collectTrainSegments(detail), [detail]);

  if (riding) return null;
  if (segments.length === 0) return null;

  return (
    <View
      style={{
        paddingHorizontal: scale(20),
        marginTop: verticalScale(16),
      }}
    >
      <Text
        className="font-bold text-gray-900"
        style={{ fontSize: moderateScale(16), marginBottom: verticalScale(10) }}
      >
        기차 탑승
      </Text>
      <Text
        className="text-gray-400"
        style={{ fontSize: moderateScale(12), lineHeight: moderateScale(18) }}
      >
        열차 출발 시각이 되면 창밖으로 보이는 관광지를 일정 사이에 보여드려요.
      </Text>
    </View>
  );
}
