import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  View,
} from "react-native";

import { Text } from "@/src/components/Text";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import { useReelsComments } from "../queries";
import type { ReelsComment } from "../types";

/** "방금 · 3분 · 5시간 · 2일" — 목록이 좁아 상대 시각으로 줄인다. 일주일 넘으면 날짜. */
function formatWhen(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/**
 * 릴스 댓글 목록 시트(읽기 전용).
 *
 * 답글은 서버가 최상위 댓글의 replies 에 담아 주므로 한 단계만 들여쓴다.
 * 작성/좋아요는 아직 붙이지 않았다 — POST /api/reels/{idx}/comments 가 남은 작업.
 */
export default function CommentsSheet({
  reelsIdx,
  onClose,
}: {
  /** null 이면 닫힌 상태 — 이때는 요청도 나가지 않는다. */
  reelsIdx: number | null;
  onClose: () => void;
}) {
  const { data: comments, isLoading, isError } = useReelsComments(reelsIdx);

  // 최상위 + 답글을 한 배열로 펼친다(답글은 depth 1 로 들여쓰기).
  const rows = (comments ?? []).flatMap((c) => [
    { comment: c, depth: 0 },
    ...c.replies.map((r) => ({ comment: r, depth: 1 })),
  ]);

  return (
    <Modal
      visible={reelsIdx != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            height: "70%",
            backgroundColor: "#1C1C1C",
            borderTopLeftRadius: scale(16),
            borderTopRightRadius: scale(16),
          }}
        >
          {/* 헤더 */}
          <View
            className="flex-row items-center justify-between"
            style={{
              paddingHorizontal: scale(20),
              paddingVertical: verticalScale(14),
              borderBottomWidth: 1,
              borderBottomColor: "#2E2E2E",
            }}
          >
            <Text
              className="font-semibold text-white"
              style={{ fontSize: moderateScale(15) }}
            >
              댓글 {rows.length > 0 ? rows.length : ""}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="댓글 닫기"
            >
              <Text
                className="text-gray-400"
                style={{ fontSize: moderateScale(18) }}
              >
                ✕
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#9CA3AF" />
            </View>
          ) : isError ? (
            <Empty text="댓글을 불러오지 못했어요." />
          ) : rows.length === 0 ? (
            <Empty text="첫 댓글을 남겨보세요." />
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(row) => String(row.comment.comment_idx)}
              contentContainerStyle={{
                paddingHorizontal: scale(20),
                paddingVertical: verticalScale(12),
                gap: verticalScale(16),
              }}
              renderItem={({ item }) => (
                <CommentRow comment={item.comment} depth={item.depth} />
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-gray-500" style={{ fontSize: moderateScale(13) }}>
        {text}
      </Text>
    </View>
  );
}

function CommentRow({
  comment,
  depth,
}: {
  comment: ReelsComment;
  depth: number;
}) {
  const avatar = moderateScale(depth > 0 ? 26 : 32);

  return (
    <View
      className="flex-row"
      style={{ gap: scale(10), paddingLeft: scale(depth * 34) }}
    >
      {comment.profile_image ? (
        <Image
          source={{ uri: comment.profile_image }}
          style={{ width: avatar, height: avatar, borderRadius: avatar / 2 }}
          contentFit="cover"
        />
      ) : (
        <View
          className="bg-neutral-600"
          style={{ width: avatar, height: avatar, borderRadius: avatar / 2 }}
        />
      )}

      <View className="flex-1" style={{ gap: verticalScale(3) }}>
        <View className="flex-row items-center" style={{ gap: scale(6) }}>
          <Text
            className="font-semibold text-white"
            style={{ fontSize: moderateScale(13) }}
          >
            {comment.nickname ?? "알 수 없음"}
          </Text>
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(11) }}
          >
            {formatWhen(comment.created_at)}
          </Text>
        </View>

        <Text
          className="text-gray-200"
          style={{ fontSize: moderateScale(13), lineHeight: moderateScale(19) }}
        >
          {comment.content}
        </Text>

        {comment.like_count > 0 ? (
          <Text
            className="text-gray-500"
            style={{ fontSize: moderateScale(11) }}
          >
            좋아요 {comment.like_count}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
