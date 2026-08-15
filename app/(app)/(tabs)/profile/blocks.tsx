import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { useBlockedUsers, useUnblockUser } from "@/src/features/user/queries";
import type { BlockedUser } from "@/src/features/user/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

/* 북마크 화면과 같은 수치 — 좌측 여백 21, X 버튼 19 */
const TEXT_DARK = "#353535";
const XBTN_BG = "#C5C5C5";

const AVATAR = scale(44);
const XBTN = scale(19);
const ROW_GAP = verticalScale(14);

/**
 * 차단 목록 — 내가 차단한 사용자(GET /api/blocks).
 *
 * 우측 X 는 차단 해제(DELETE /api/blocks/{user_idx}) — 성공하면 목록이 무효화돼
 * 그 줄이 사라지고, 그 사용자의 릴스·댓글이 다시 보인다.
 *
 * ⚠️ 서버 응답에 아직 프로필 사진 필드가 없다. 화면은 profile_image 를 옵셔널로
 *    읽고 없으면 기본 아바타를 그리므로, 서버가 필드를 붙이면 그대로 표시된다.
 */
export default function BlocksScreen() {
  const { data: users = [], isLoading, isError, error, refetch } = useBlockedUsers();
  const unblock = useUnblockUser();
  // 해제 요청 중인 사용자 — 그 줄만 흐리게 하고 중복 탭을 막는다.
  const [removing, setRemoving] = useState<number | null>(null);

  const confirmUnblock = (user: BlockedUser) => {
    if (removing != null) return;
    const name = user.nickname ?? "이 사용자";
    Alert.alert(
      `${name}님의 차단을 해제할까요?`,
      "해제하면 이 사용자의 릴스와 댓글이 다시 보여요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "차단 해제",
          onPress: () => {
            setRemoving(user.user_idx);
            unblock.mutate(user.user_idx, {
              onError: (err) =>
                Alert.alert("차단 해제 실패", describeApiError(err)),
              onSettled: () => setRemoving(null),
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="dark" />

      {/* 헤더 — 뒤로 + '차단 목록' */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: scale(21),
          paddingTop: verticalScale(14),
          paddingBottom: verticalScale(10),
          gap: scale(14),
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon
            color={TEXT_DARK}
            width={moderateScale(9)}
            height={moderateScale(15)}
          />
        </Pressable>
        <Text
          style={{
            color: TEXT_DARK,
            fontSize: moderateScale(16),
            fontWeight: "700",
          }}
        >
          차단 목록
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9CA3AF" />
        </View>
      ) : isError ? (
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: scale(24), gap: verticalScale(10) }}
        >
          <Text style={{ color: TEXT_DARK, fontSize: moderateScale(14) }}>
            차단 목록을 불러오지 못했어요.
          </Text>
          <Text
            className="text-center text-gray-400"
            selectable
            style={{ fontSize: moderateScale(11) }}
          >
            {describeApiError(error)}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="rounded-full bg-gray-200 active:opacity-70"
            style={{
              paddingHorizontal: scale(18),
              paddingVertical: verticalScale(8),
            }}
          >
            <Text
              className="font-semibold text-gray-800"
              style={{ fontSize: moderateScale(12) }}
            >
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : users.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500" style={{ fontSize: moderateScale(14) }}>
            차단한 사용자가 없어요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.user_idx)}
          contentContainerStyle={{
            paddingBottom: verticalScale(24),
            gap: ROW_GAP,
          }}
          ListHeaderComponent={
            <Text
              style={{
                paddingHorizontal: scale(21),
                marginTop: verticalScale(10),
                marginBottom: verticalScale(14),
                color: TEXT_DARK,
                fontSize: moderateScale(14),
                fontWeight: "700",
              }}
            >
              차단 목록 {users.length}
            </Text>
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BlockedRow
              item={item}
              removing={removing === item.user_idx}
              onRemove={() => confirmUnblock(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

/** 프로필 사진 + 닉네임, 우측 X(차단 해제). */
function BlockedRow({
  item,
  removing,
  onRemove,
}: {
  item: BlockedUser;
  removing: boolean;
  onRemove: () => void;
}) {
  const name = item.nickname ?? "알 수 없는 사용자";
  return (
    <View
      className="flex-row items-center"
      style={{
        paddingHorizontal: scale(21),
        gap: scale(12),
        opacity: removing ? 0.5 : 1,
      }}
    >
      <View
        className="items-center justify-center overflow-hidden rounded-full bg-gray-100"
        style={{ width: AVATAR, height: AVATAR }}
      >
        {item.profile_image ? (
          <Image
            source={{ uri: item.profile_image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Feather name="user" size={AVATAR * 0.5} color="#B7C0DA" />
        )}
      </View>

      <Text
        className="flex-1"
        numberOfLines={1}
        style={{
          color: TEXT_DARK,
          fontSize: moderateScale(14),
          fontWeight: "600",
        }}
      >
        {name}
      </Text>

      <Pressable
        onPress={onRemove}
        disabled={removing}
        hitSlop={10}
        className="items-center justify-center rounded-full active:opacity-70"
        style={{ width: XBTN, height: XBTN, backgroundColor: XBTN_BG }}
        accessibilityRole="button"
        accessibilityLabel={`${name} 차단 해제`}
      >
        {removing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Feather name="x" size={moderateScale(12)} color="#FFFFFF" />
        )}
      </Pressable>
    </View>
  );
}
