import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { describeApiError } from "@/src/api/errors";
import BackIcon from "@/src/components/icons/BackIcon";
import EditPencilIcon from "@/src/components/icons/EditPencilIcon";
import PlaceMarkerIcon from "@/src/components/icons/PlaceMarkerIcon";
import TrashIcon from "@/src/components/icons/TrashIcon";
import { Text } from "@/src/components/Text";
import { useMyReels } from "@/src/features/user/queries";
import type { MyReelsItem } from "@/src/features/user/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

const ACCENT = "#5E84F4";
/** Figma 시안 색 — 헤더 띠 / 본문 텍스트 / 보조 텍스트 / 썸네일 자리 */
const HEADER_BG = "#EAEEF7";
const TEXT_MAIN = "#353535";
const TEXT_SUB = "#656565";
const THUMB_BG = "#F5F5F7";

/** 시안 기준 썸네일 122x81(가로형) */
const THUMB_W = 122;
const THUMB_H = 81;

/** ⋯ 메뉴 카드 크기(시안 165 폭). 화면 밖으로 나가지 않게 오른쪽 여백을 둔다. */
const MENU_W = 165;

/**
 * 내 영상 — Figma '내영상 / 업로드된 영상' 탭 시안대로 가로형 썸네일 리스트.
 *
 * 한 줄 = 썸네일(122x81) + 제목 + 보조정보 + 지역, 오른쪽 ⋯ 로 수정/삭제 메뉴.
 * 시안의 '임시저장' 탭은 추후 업데이트 예정이라 지금은 만들지 않는다(탭 바 자체를 생략).
 * 시안의 조회수·영상 길이·업로드 시각은 서버 응답(MyReelsItem)에 없는 값이라
 * 서버가 주는 좋아요·댓글 수로 대체한다 — 필드가 생기면 그 자리에 넣으면 된다.
 */
export default function MyReelsListScreen() {
  const { width } = useWindowDimensions();

  const {
    data: reels = [],
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyReels();

  // ⋯ 로 연 항목과 그 버튼의 화면 좌표(메뉴를 버튼 옆에 띄우기 위함).
  const [menu, setMenu] = useState<{ item: MyReelsItem; y: number } | null>(
    null,
  );

  const openPlayer = (item: MyReelsItem) =>
    router.push(`/profile/reels-player?reels_idx=${item.reels_idx}`);

  const openStudio = (item: MyReelsItem) => {
    setMenu(null);
    // title 도 함께 넘겨 편집 화면이 현재 제목을 그대로 보여주고 고칠 수 있게 한다.
    router.push(
      `/reels/studio?reels_idx=${item.reels_idx}&url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.title ?? "")}`,
    );
  };

  // 삭제 확인 창에 걸린 항목 (null 이면 닫힘)
  const [confirmDelete, setConfirmDelete] = useState<MyReelsItem | null>(null);

  const askDelete = (item: MyReelsItem) => {
    setMenu(null);
    setConfirmDelete(item);
  };

  // TODO: 삭제 API 나오면 여기서 호출 + 목록 캐시 무효화. 지금은 창만 닫는다.
  const confirmDeleteReels = () => setConfirmDelete(null);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar style="dark" />

      {/* 헤더 — 시안의 연한 파란 띠 + 아래 구분선 */}
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: HEADER_BG,
          paddingHorizontal: scale(22),
          paddingTop: verticalScale(18),
          paddingBottom: verticalScale(18),
          gap: scale(14),
          borderBottomWidth: 1,
          borderBottomColor: "#DDE3EF",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <BackIcon
            color={TEXT_MAIN}
            width={moderateScale(18)}
            height={moderateScale(18)}
          />
        </Pressable>
        <Text
          className="font-bold"
          style={{ fontSize: moderateScale(16), color: TEXT_MAIN }}
        >
          내 영상
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : isError ? (
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingHorizontal: scale(24), gap: verticalScale(10) }}
        >
          <Text style={{ fontSize: moderateScale(14), color: TEXT_MAIN }}>
            내 영상을 불러오지 못했어요.
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
      ) : reels.length === 0 ? (
        <View
          className="flex-1 items-center justify-center"
          style={{ gap: verticalScale(12) }}
        >
          <Text className="text-gray-500" style={{ fontSize: moderateScale(14) }}>
            아직 만든 영상이 없어요.
          </Text>
          <Pressable
            onPress={() => router.push("/reels/create")}
            className="rounded-full active:opacity-80"
            style={{
              backgroundColor: ACCENT,
              paddingHorizontal: scale(20),
              paddingVertical: verticalScale(10),
            }}
          >
            <Text
              className="font-semibold text-white"
              style={{ fontSize: moderateScale(13) }}
            >
              여행영상 만들기
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => String(item.reels_idx)}
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingBottom: verticalScale(24),
            gap: verticalScale(14),
          }}
          ListHeaderComponent={
            <Text
              className="font-bold"
              style={{
                fontSize: moderateScale(14),
                color: TEXT_MAIN,
                marginTop: verticalScale(30),
                marginBottom: verticalScale(14),
                paddingHorizontal: scale(3),
              }}
            >
              영상 {reels.length}
            </Text>
          }
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: verticalScale(16) }}>
                <ActivityIndicator color="#9CA3AF" />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ReelsRow
              item={item}
              onPress={() => openPlayer(item)}
              onMenu={(y) => setMenu({ item, y })}
            />
          )}
        />
      )}

      <ItemMenu
        state={menu}
        screenWidth={width}
        onClose={() => setMenu(null)}
        onEdit={openStudio}
        onDelete={askDelete}
      />

      <DeleteConfirmDialog
        item={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteReels}
      />
    </SafeAreaView>
  );
}

/** 목록 한 줄 — 가로 썸네일 + 제목/보조정보/지역 + 우측 ⋯. */
function ReelsRow({
  item,
  onPress,
  onMenu,
}: {
  item: MyReelsItem;
  onPress: () => void;
  onMenu: (y: number) => void;
}) {
  // ⋯ 버튼의 화면상 위치를 재서 메뉴를 그 옆에 띄운다.
  const dotsRef = useRef<View>(null);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start active:opacity-80"
      style={{ gap: scale(10) }}
    >
      {/* 썸네일 — 세로 영상이라 잘리지 않게 contain, 남는 자리는 시안의 회색 배경 */}
      <View
        style={{
          width: scale(THUMB_W),
          height: verticalScale(THUMB_H),
          borderRadius: scale(4),
          backgroundColor: THUMB_BG,
          overflow: "hidden",
        }}
      >
        {item.thumbnail_url ? (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
            transition={150}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Text
              className="text-gray-400"
              style={{ fontSize: moderateScale(14) }}
            >
              ▶
            </Text>
          </View>
        )}
      </View>

      {/* 본문 */}
      <View className="flex-1" style={{ paddingTop: verticalScale(4) }}>
        <Text
          className="font-semibold"
          numberOfLines={1}
          style={{ fontSize: moderateScale(14), color: TEXT_MAIN }}
        >
          {item.title ?? "제목 없는 영상"}
        </Text>
        <Text
          className="font-medium"
          numberOfLines={1}
          style={{
            fontSize: moderateScale(12),
            color: TEXT_SUB,
            marginTop: verticalScale(4),
          }}
        >
          좋아요 {item.like_count}회 ∙ 댓글 {item.comment_count}개
        </Text>
        {item.region ? (
          <View
            className="flex-row items-center"
            style={{ gap: scale(4), marginTop: verticalScale(7) }}
          >
            <PlaceMarkerIcon
              width={moderateScale(8)}
              height={moderateScale(10)}
              color={TEXT_SUB}
              dotFill="#FFFFFF"
            />
            <Text
              className="font-medium"
              numberOfLines={1}
              style={{ fontSize: moderateScale(12), color: TEXT_SUB }}
            >
              {item.region}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ⋯ (세로 3점) — 줄 탭(재생)과 겹치지 않게 눌리는 영역을 분리한다. */}
      <Pressable
        ref={dotsRef}
        onPress={() =>
          dotsRef.current?.measureInWindow((_x, y) => onMenu(y))
        }
        hitSlop={12}
        className="items-center justify-center"
        style={{ paddingTop: verticalScale(4), gap: verticalScale(3) }}
        accessibilityRole="button"
        accessibilityLabel={`${item.title ?? "영상"} 더보기`}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: moderateScale(3),
              height: moderateScale(3),
              borderRadius: moderateScale(2),
              backgroundColor: TEXT_MAIN,
            }}
          />
        ))}
      </Pressable>
    </Pressable>
  );
}

/** ⋯ 메뉴 — 시안의 흰 카드(수정 / 삭제). 누른 ⋯ 옆에 뜬다. */
function ItemMenu({
  state,
  screenWidth,
  onClose,
  onEdit,
  onDelete,
}: {
  state: { item: MyReelsItem; y: number } | null;
  screenWidth: number;
  onClose: () => void;
  onEdit: (item: MyReelsItem) => void;
  onDelete: (item: MyReelsItem) => void;
}) {
  if (!state) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1" onPress={onClose}>
        <View
          style={{
            position: "absolute",
            // ⋯ 바로 아래에 붙이되 화면 오른쪽 여백(20)은 유지한다.
            top: state.y + verticalScale(18),
            left: screenWidth - scale(MENU_W) - scale(20),
            width: scale(MENU_W),
            backgroundColor: "#FFFFFF",
            borderRadius: scale(4),
            paddingVertical: verticalScale(6),
            elevation: 6,
            shadowColor: "#000",
          }}
        >
          <MenuRow
            icon={
              <EditPencilIcon
                width={moderateScale(18)}
                height={moderateScale(18)}
              />
            }
            label="수정하기"
            onPress={() => onEdit(state.item)}
          />
          <MenuRow
            icon={
              <TrashIcon
                width={moderateScale(18)}
                height={moderateScale(20)}
                color={TEXT_MAIN}
              />
            }
            label="삭제하기"
            onPress={() => onDelete(state.item)}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

/**
 * 삭제 확인 창 — Figma '내영상' 삭제 확인 시안(254x178 흰 카드 + 25% 딤).
 * 실제 삭제 API 는 아직 없어 '삭제'를 눌러도 창만 닫힌다.
 */
function DeleteConfirmDialog({
  item,
  onCancel,
  onConfirm,
}: {
  item: MyReelsItem | null;
  onCancel: () => void;
  onConfirm: (item: MyReelsItem) => void;
}) {
  if (!item) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
        onPress={onCancel}
      >
        {/* 카드 안을 눌러도 닫히지 않게 이벤트를 막는다. */}
        <Pressable
          onPress={() => {}}
          style={{
            width: scale(254),
            backgroundColor: "#FFFFFF",
            borderRadius: scale(4),
            paddingHorizontal: scale(21),
            paddingTop: verticalScale(23),
            paddingBottom: verticalScale(16),
            elevation: 8,
            shadowColor: "#000",
          }}
        >
          <Text
            className="font-bold"
            style={{ fontSize: moderateScale(18), color: "#1C1C1C" }}
          >
            영상을 삭제하시겠습니까?
          </Text>
          <Text
            className="font-medium"
            style={{
              fontSize: moderateScale(13),
              lineHeight: moderateScale(20),
              color: TEXT_MAIN,
              marginTop: verticalScale(16),
            }}
          >
            영상을 삭제하면 영구적으로{"\n"}삭제되며 실행취소할 수 없습니다.
          </Text>

          <View
            className="flex-row justify-end"
            style={{ gap: scale(32), marginTop: verticalScale(24) }}
          >
            <Pressable
              onPress={onCancel}
              hitSlop={10}
              className="active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel="취소"
            >
              <Text
                className="font-bold"
                style={{ fontSize: moderateScale(14), color: TEXT_MAIN }}
              >
                취소
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(item)}
              hitSlop={10}
              className="active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel="삭제"
            >
              <Text
                className="font-bold"
                style={{ fontSize: moderateScale(14), color: TEXT_MAIN }}
              >
                삭제
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center active:opacity-60"
      style={{
        paddingHorizontal: scale(18),
        paddingVertical: verticalScale(9),
        gap: scale(10),
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        className="items-center justify-center"
        style={{ width: moderateScale(24), height: moderateScale(24) }}
      >
        {icon}
      </View>
      <Text
        className="font-medium"
        style={{ fontSize: moderateScale(14), color: TEXT_MAIN }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
