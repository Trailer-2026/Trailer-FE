import { Pressable, Text } from "react-native";

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
      className={`w-full rounded-2xl py-4 items-center ${
        disabled ? "bg-gray-300" : "bg-gray-800"
      }`}
    >
      <Text
        className={`text-base font-semibold ${
          disabled ? "text-gray-500" : "text-white"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
