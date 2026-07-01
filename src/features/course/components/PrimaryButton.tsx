import { Pressable } from "react-native";
import { Text } from "@/src/components/Text";

import { moderateScale, verticalScale } from "@/src/utils/responsive";

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="w-full rounded-2xl items-center justify-center"
      style={{
        height: verticalScale(61),
        backgroundColor: disabled ? "#D1D5DB" : "#5E84F4",
      }}
    >
      <Text
        className="font-semibold"
        style={{
          fontSize: moderateScale(16),
          color: disabled ? "#9CA3AF" : "#FFFFFF",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
