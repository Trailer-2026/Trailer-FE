import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { StationPickerModal } from "@/src/features/course/components/StationPickerModal";
import SelectChevronIcon from "@/src/components/icons/SelectChevronIcon";
import { StepDots } from "@/src/features/course/components/StepDots";
import { StepHeader } from "@/src/features/course/components/StepHeader";
import { useCourseStore, type SelectedStation } from "@/src/features/course/store";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

type StationTarget = "origin" | "destination" | "via";

export default function OriginDestinationScreen() {
  const origin = useCourseStore((s) => s.origin);
  const destination = useCourseStore((s) => s.destination);
  const viaStation = useCourseStore((s) => s.viaStation);
  const setOrigin = useCourseStore((s) => s.setOrigin);
  const setDestination = useCourseStore((s) => s.setDestination);
  const setViaStation = useCourseStore((s) => s.setViaStation);

  const [pickerFor, setPickerFor] = useState<StationTarget | null>(null);

  const canProceed = !!origin && !!destination;

  const selectedFor = (t: StationTarget): SelectedStation | null =>
    t === "origin" ? origin : t === "destination" ? destination : viaStation;

  // 같은 역 중복 선택 방지용 — 픽커별로 반대편(주요) 역 하나를 숨긴다.
  const excludeFor = (t: StationTarget): string | null =>
    t === "origin"
      ? destination?.station_name ?? null
      : origin?.station_name ?? null;

  const onSelectStation = (s: SelectedStation) => {
    if (pickerFor === "origin") setOrigin(s);
    else if (pickerFor === "destination") setDestination(s);
    else if (pickerFor === "via") setViaStation(s);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <StepHeader step={1} steps={4} />

      <View className="flex-1 px-5">
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20), marginTop: verticalScale(8) }}
        >
          출발지와 도착지
        </Text>
        <Text
          className="text-gray-400 font-semibold"
          style={{ fontSize: moderateScale(14), marginTop: verticalScale(6) }}
        >
          <Text style={{ color: "#EF4444" }}>(*)</Text>은 필수선택지입니다.
        </Text>

        <View style={{ marginTop: verticalScale(28), gap: verticalScale(20) }}>
          <StationSelect
            label="출발지"
            required
            value={origin?.station_name ?? null}
            placeholder="출발지 선택"
            onPress={() => setPickerFor("origin")}
          />
          <StationSelect
            label="도착지"
            required
            value={destination?.station_name ?? null}
            placeholder="도착지 선택"
            onPress={() => setPickerFor("destination")}
          />
          <StationSelect
            label="경유지"
            value={viaStation?.station_name ?? null}
            placeholder="경유지 선택"
            onPress={() => setPickerFor("via")}
          />
        </View>
      </View>

      <View className="px-5 pb-4">
        <StepDots total={4} index={0} />
        <PrimaryButton
          label="다음"
          onPress={() => router.push("/course/period")}
          disabled={!canProceed}
        />
      </View>

      <StationPickerModal
        visible={pickerFor !== null}
        selectedName={
          pickerFor ? selectedFor(pickerFor)?.station_name ?? null : null
        }
        excludeName={pickerFor ? excludeFor(pickerFor) : null}
        onClose={() => setPickerFor(null)}
        onSelect={onSelectStation}
      />
    </SafeAreaView>
  );
}

function StationSelect({
  label,
  required,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  required?: boolean;
  value: string | null;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View>
      <Text
        style={{
          fontSize: moderateScale(14),
          color: "#6A6A6A",
          marginBottom: verticalScale(8),
          fontWeight: 650 as never,
        }}
      >
        {required ? <Text style={{ color: "#EF4444" }}>*</Text> : null}
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between border border-gray-200 bg-white rounded-2xl"
        style={{
          height: verticalScale(58),
          paddingHorizontal: scale(18),
        }}
      >
        <Text
          className={value ? "font-semibold text-gray-900" : "font-normal text-gray-400"}
          style={{ fontSize: moderateScale(14) }}
        >
          {value ?? placeholder}
        </Text>
        <SelectChevronIcon
          width={moderateScale(12)}
          height={moderateScale(7)}
        />
      </Pressable>
    </View>
  );
}
