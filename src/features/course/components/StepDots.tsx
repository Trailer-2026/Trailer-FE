import { View } from "react-native";

type Props = {
  total: number;
  index: number;
};

export function StepDots({ total, index }: Props) {
  return (
    <View className="flex-row items-center justify-center gap-2 py-3">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-2 w-2 rounded-full ${
            i === index ? "bg-gray-800" : "bg-gray-300"
          }`}
        />
      ))}
    </View>
  );
}
