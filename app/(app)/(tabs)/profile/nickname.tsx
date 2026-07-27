import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { useMyProfile, useUpdateNickname } from "@/src/features/user/queries";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const MAX_LEN = 20;

export default function NicknameEditScreen() {
  const router = useRouter();
  const { data: profile } = useMyProfile();
  const updateNickname = useUpdateNickname();

  const [value, setValue] = useState(profile?.nickname ?? "");

  const trimmed = value.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= MAX_LEN;
  const isUnchanged = trimmed === (profile?.nickname ?? "");
  const canSave = isValid && !isUnchanged && !updateNickname.isPending;

  async function handleSave() {
    if (!canSave) return;
    try {
      await updateNickname.mutateAsync(trimmed);
      router.back();
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      Alert.alert(
        "닉네임 변경 실패",
        status === 422
          ? "닉네임은 1~20자로 입력해 주세요."
          : "잠시 후 다시 시도해 주세요.",
      );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center justify-between"
        style={{ height: verticalScale(52), paddingHorizontal: scale(12) }}
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <BackIcon width={moderateScale(12)} height={moderateScale(17)} />
          </Pressable>
          <Text
            className="font-bold text-gray-900"
            style={{ fontSize: moderateScale(17), marginLeft: scale(8) }}
          >
            닉네임 편집
          </Text>
        </View>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={8}>
          {updateNickname.isPending ? (
            <ActivityIndicator color="#5E84F4" />
          ) : (
            <Text
              className="font-bold"
              style={{
                fontSize: moderateScale(16),
                color: canSave ? "#5E84F4" : "#C4C9D4",
              }}
            >
              완료
            </Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior="height"
        style={{ flex: 1, paddingHorizontal: scale(20) }}
      >
        <View style={{ marginTop: verticalScale(28) }}>
          <View
            className="flex-row items-center border-b"
            style={{
              borderColor: isValid || trimmed.length === 0 ? "#E5E7EB" : "#EF4444",
              paddingBottom: verticalScale(8),
            }}
          >
            <TextInput
              value={value}
              onChangeText={(t) => setValue(t.slice(0, MAX_LEN))}
              placeholder="닉네임을 입력해 주세요"
              placeholderTextColor="#B7C0DA"
              maxLength={MAX_LEN}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              style={{
                flex: 1,
                fontSize: moderateScale(18),
                color: "#111827",
                fontFamily: "Pretendard-Medium",
                padding: 0,
              }}
            />
            {value.length > 0 ? (
              <Pressable onPress={() => setValue("")} hitSlop={8}>
                <Feather name="x-circle" size={moderateScale(18)} color="#C4C9D4" />
              </Pressable>
            ) : null}
          </View>

          <View
            className="flex-row items-center justify-between"
            style={{ marginTop: verticalScale(8) }}
          >
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(12) }}
            >
              1~20자로 입력할 수 있어요
            </Text>
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(12) }}
            >
              {trimmed.length}/{MAX_LEN}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
