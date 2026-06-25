import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepDots } from "@/src/features/course/components/StepDots";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { useCourseStore } from "@/src/features/course/store";

export default function OriginDestinationScreen() {
  const origin = useCourseStore((s) => s.origin);
  const destination = useCourseStore((s) => s.destination);
  const roundTrip = useCourseStore((s) => s.roundTrip);
  const departAt = useCourseStore((s) => s.departAt);
  const returnAt = useCourseStore((s) => s.returnAt);
  const swap = useCourseStore((s) => s.swapOriginDestination);
  const setRoundTrip = useCourseStore((s) => s.setRoundTrip);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StepHeader progress={1 / 3} />

      <View className="flex-1 px-5">
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-2xl font-extrabold text-gray-900">승차권</Text>

          <Pressable
            onPress={() => setRoundTrip(!roundTrip)}
            className="flex-row items-center gap-2"
          >
            <View
              className={`w-5 h-5 rounded-md border items-center justify-center ${
                roundTrip ? "bg-gray-800 border-gray-800" : "border-gray-400"
              }`}
            >
              {roundTrip ? (
                <Feather name="check" size={14} color="#FFFFFF" />
              ) : null}
            </View>
            <Text className="text-sm text-gray-700">왕복</Text>
          </Pressable>
        </View>

        <View className="mt-6 bg-gray-100 rounded-2xl p-4">
          <LocationRow label="출발지" value={origin} />

          <View className="items-center my-1">
            <Pressable
              onPress={swap}
              className="w-9 h-9 rounded-full bg-gray-700 items-center justify-center"
            >
              <Feather name="repeat" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <LocationRow label="도착지" value={destination} />
        </View>

        <View className="mt-6">
          <DateRow label="가는날" value={departAt} />
          {roundTrip ? (
            <View className="mt-3">
              <DateRow label="오는날" value={returnAt} />
            </View>
          ) : null}
        </View>
      </View>

      <View className="px-5 pb-4">
        <StepDots total={3} index={0} />
        <PrimaryButton
          label="다음"
          onPress={() => router.push("/course/passengers")}
        />
      </View>
    </SafeAreaView>
  );
}

function LocationRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-sm text-gray-500 w-16">{label}</Text>
      <Pressable className="flex-1 flex-row items-center justify-end gap-2">
        <Text className="text-lg font-semibold text-gray-900">{value}</Text>
        <Feather name="chevron-down" size={18} color="#6B7280" />
      </Pressable>
    </View>
  );
}

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <Pressable className="flex-row items-center justify-between py-3 border-b border-gray-200">
      <Text className="text-sm text-gray-500">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-base text-gray-900">{value}</Text>
        <Feather name="chevron-right" size={18} color="#9CA3AF" />
      </View>
    </Pressable>
  );
}
