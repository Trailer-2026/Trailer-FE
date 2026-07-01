import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { DatePickerModal } from "@/src/features/course/components/DatePickerModal";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StepDots } from "@/src/features/course/components/StepDots";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { addMonths, formatKoreanDate, startOfDay } from "@/src/features/course/date";
import { useCourseStore } from "@/src/features/course/store";

export default function OriginDestinationScreen() {
  const origin = useCourseStore((s) => s.origin);
  const destination = useCourseStore((s) => s.destination);
  const roundTrip = useCourseStore((s) => s.roundTrip);
  const departDate = useCourseStore((s) => s.departDate);
  const returnDate = useCourseStore((s) => s.returnDate);
  const swap = useCourseStore((s) => s.swapOriginDestination);
  const setRoundTrip = useCourseStore((s) => s.setRoundTrip);
  const setDepartDate = useCourseStore((s) => s.setDepartDate);
  const setReturnDate = useCourseStore((s) => s.setReturnDate);

  const [datePickerFor, setDatePickerFor] = useState<"depart" | "return" | null>(
    null,
  );

  const today = startOfDay(new Date());
  const maxDate = addMonths(today, 1); // 오늘 기준 한 달까지 선택 가능

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

        <View className="mt-6 bg-gray-100 rounded-2xl p-5">
          <Text className="text-sm font-medium text-gray-500 mb-2">출발지</Text>
          <LocationSelect value={origin} />

          <View className="items-center my-3">
            <Pressable
              onPress={swap}
              className="w-14 h-9 rounded-full bg-gray-700 items-center justify-center"
            >
              <Feather name="repeat" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text className="text-sm font-medium text-gray-500 mb-2">도착지</Text>
          <LocationSelect value={destination} />
        </View>

        <View className="mt-8">
          <DateRow
            label="가는날"
            value={formatKoreanDate(departDate)}
            onPress={() => setDatePickerFor("depart")}
          />
          {roundTrip ? (
            <View className="mt-6">
              <DateRow
                label="오는날"
                value={formatKoreanDate(returnDate)}
                onPress={() => setDatePickerFor("return")}
              />
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

      <DatePickerModal
        visible={datePickerFor !== null}
        title={datePickerFor === "return" ? "오는날" : "가는날"}
        selected={datePickerFor === "return" ? returnDate : departDate}
        minDate={datePickerFor === "return" ? departDate : today}
        maxDate={maxDate}
        onClose={() => setDatePickerFor(null)}
        onSelect={(d) => {
          if (datePickerFor === "return") {
            setReturnDate(d);
          } else {
            setDepartDate(d);
            // 가는날이 오는날보다 뒤면 오는날도 함께 맞춤
            if (returnDate < d) setReturnDate(d);
          }
        }}
      />
    </SafeAreaView>
  );
}

function LocationSelect({ value }: { value: string }) {
  return (
    <Pressable className="bg-white border border-gray-200 rounded-xl px-4 h-14 flex-row items-center justify-between">
      <Text className="text-lg font-semibold text-gray-900">{value}</Text>
      <Feather name="chevron-down" size={20} color="#4B5563" />
    </Pressable>
  );
}

function DateRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View>
      <Text className="text-sm font-bold text-gray-500">{label}</Text>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between mt-2"
      >
        <Text className="text-lg text-gray-900">{value}</Text>
        <Feather name="chevron-right" size={20} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}
