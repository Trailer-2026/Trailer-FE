import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PencilIcon from "@/src/components/icons/PencilIcon";
import SparkleIcon from "@/src/components/icons/SparkleIcon";
import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";

/**
 * '새 여행 일정 만들기' 하단 시트 — AI 추천 / 직접 만들기 두 갈래.
 * 일정 탭의 빈 상태 버튼에서 띄운다.
 */
export default function NewTravelSheet({
  visible,
  onClose,
  onRecommend,
  onManual,
}: {
  visible: boolean;
  onClose: () => void;
  onRecommend: () => void;
  onManual: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 딤 영역을 누르면 닫힘. 시트 자체는 Pressable 로 눌림 전파를 막는다. */}
      <Pressable
        onPress={onClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <Pressable
          className="bg-white"
          style={{
            borderTopLeftRadius: scale(20),
            borderTopRightRadius: scale(20),
            paddingHorizontal: scale(20),
            paddingTop: verticalScale(24),
            // 하단 내비게이션 바(제스처 바 포함)에 마지막 항목이 가리지 않도록 인셋 가산.
            paddingBottom: verticalScale(24) + insets.bottom,
          }}
        >
          <Text
            className="font-bold text-gray-900 text-center"
            style={{ fontSize: moderateScale(17) }}
          >
            일정 만들기
          </Text>

          <ChoiceRow
            icon={
              <SparkleIcon
                width={moderateScale(24)}
                height={moderateScale(24)}
              />
            }
            onPress={onRecommend}
            style={{ marginTop: verticalScale(24) }}
          >
            <Text style={{ color: ACCENT }}>추천 </Text>
            <Text className="text-gray-800">AI 일정 추천받기</Text>
          </ChoiceRow>

          <ChoiceRow
            icon={
              <PencilIcon width={moderateScale(20)} height={moderateScale(20)} />
            }
            onPress={onManual}
            style={{ marginTop: verticalScale(12) }}
          >
            <Text className="text-gray-800">직접 일정 만들기</Text>
          </ChoiceRow>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** 아이콘은 왼쪽 고정, 문구는 카드 가운데 정렬. 두 항목 모두 같은 파란 카드. */
function ChoiceRow({
  icon,
  onPress,
  style,
  children,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  style?: object;
  children: React.ReactNode;
}) {
  // 누르는 동안에만 테두리를 보여준다.
  // ⚠️ style 을 함수(({pressed}) => …)로 주면 NativeWind 의 className 병합과 충돌해
  //    스타일이 통째로 날아간다(카드가 사라짐). 반드시 상태 + 객체 style 로 처리할 것.
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className="items-center justify-center"
      style={{
        height: verticalScale(56),
        borderRadius: scale(10),
        // borderWidth 는 항상 1 — 눌릴 때 0→1 로 바뀌면 내용이 밀려 덜컹거린다.
        borderWidth: 1,
        borderColor: pressed ? "#C7D7FF" : "transparent",
        backgroundColor: "#F2F6FF",
        ...style,
      }}
    >
      <View style={{ position: "absolute", left: scale(18) }}>{icon}</View>
      <Text style={{ fontSize: moderateScale(15) }}>{children}</Text>
    </Pressable>
  );
}
