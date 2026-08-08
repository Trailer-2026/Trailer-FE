import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  TextInput,
  View,
} from "react-native";

import { describeApiError } from "@/src/api/errors";
import HeartIcon from "@/src/components/icons/HeartIcon";
import { Text } from "@/src/components/Text";
import { useBlockUser, useMyProfile } from "@/src/features/user/queries";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import {
  useCreateReelsComment,
  useReelsComments,
  useToggleCommentLike,
} from "../queries";
import type { ReelsComment } from "../types";

/** 입력창이 답글 모드일 때 대상 정보. null 이면 일반 댓글. */
type ReplyTarget = { parentIdx: number; nickname: string };

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
 * 릴스 댓글 시트 — 목록 조회 + 작성/답글.
 *
 * 답글은 서버가 최상위 댓글의 replies 에 담아 주므로 한 단계만 들여쓴다.
 * 답글의 "답글 달기"는 그 답글이 아니라 부모(최상위)를 대상으로 삼는다 —
 * 답글에 답글을 달면 서버가 400 을 준다(답글은 1단계까지).
 */
export default function CommentsSheet({
  reelsIdx,
  onClose,
}: {
  /** null 이면 닫힌 상태 — 이때는 요청도 나가지 않는다. */
  reelsIdx: number | null;
  onClose: () => void;
}) {
  const { data: comments, isLoading, isError, error, refetch, isFetching } =
    useReelsComments(reelsIdx);
  const create = useCreateReelsComment(reelsIdx);
  const like = useToggleCommentLike(reelsIdx);
  const block = useBlockUser();
  // 내 댓글에는 차단 메뉴를 띄우지 않는다(서버도 자기 자신 차단은 400).
  const { data: me } = useMyProfile();

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const inputRef = useRef<TextInput>(null);

  // 시트를 닫았다 다시 열면 이전 입력이 남지 않게 초기화.
  useEffect(() => {
    if (reelsIdx == null) {
      setDraft("");
      setReplyTo(null);
    }
  }, [reelsIdx]);

  // 최상위 + 답글을 한 배열로 펼친다(답글은 depth 1 로 들여쓰기).
  // replies 가 없는 응답(단건 조회 등)도 있어 ?? [] 로 방어한다.
  const rows = (comments ?? []).flatMap((c) => [
    { comment: c, depth: 0 },
    ...(c.replies ?? []).map((r) => ({ comment: r, depth: 1 })),
  ]);

  const startReply = (comment: ReelsComment, depth: number) => {
    setReplyTo({
      // depth 1 이면 부모(최상위)에 단다 — 답글의 답글은 서버가 400.
      parentIdx: depth === 0 ? comment.comment_idx : comment.parent_idx!,
      nickname: comment.nickname ?? "알 수 없음",
    });
    inputRef.current?.focus();
  };

  // 댓글 길게 누르기 → 차단 메뉴. Alert 의 destructive 버튼이 곧 확인 단계라 한 단계로 끝낸다.
  const confirmBlock = (comment: ReelsComment) => {
    if (me?.user_idx === comment.user_idx) return;
    const nickname = comment.nickname ?? "이 사용자";
    Alert.alert(
      `${nickname}님을 차단할까요?`,
      "차단하면 이 사용자의 릴스와 댓글이 나에게만 보이지 않아요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "차단하기",
          style: "destructive",
          onPress: () =>
            block.mutate(comment.user_idx, {
              onError: (err) =>
                Alert.alert("차단 실패", describeApiError(err)),
            }),
        },
      ],
    );
  };

  const toggleLike = (comment: ReelsComment) => {
    like.mutate(
      { commentIdx: comment.comment_idx, liked: comment.liked },
      {
        onError: (err) => Alert.alert("좋아요 실패", describeApiError(err)),
      },
    );
  };

  const submit = () => {
    const content = draft.trim();
    if (!content || create.isPending) return;
    create.mutate(
      { content, parentIdx: replyTo?.parentIdx ?? null },
      {
        onSuccess: () => {
          setDraft("");
          setReplyTo(null);
          Keyboard.dismiss();
        },
        onError: (err) => Alert.alert("댓글 등록 실패", describeApiError(err)),
      },
    );
  };

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
            <View
              className="flex-1 items-center justify-center"
              style={{ paddingHorizontal: scale(24), gap: verticalScale(10) }}
            >
              <Text
                className="text-gray-400"
                style={{ fontSize: moderateScale(13) }}
              >
                댓글을 불러오지 못했어요.
              </Text>
              {/* 원인을 감추면 디버깅이 불가능해 서버/네트워크 사유를 그대로 노출한다. */}
              <Text
                className="text-gray-600 text-center"
                selectable
                style={{ fontSize: moderateScale(11) }}
              >
                {describeApiError(error)} (reels_idx: {reelsIdx})
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="bg-neutral-700 rounded-full active:opacity-70"
                style={{
                  paddingHorizontal: scale(18),
                  paddingVertical: verticalScale(8),
                  marginTop: verticalScale(4),
                }}
              >
                <Text
                  className="text-white font-semibold"
                  style={{ fontSize: moderateScale(12) }}
                >
                  {isFetching ? "다시 시도 중…" : "다시 시도"}
                </Text>
              </Pressable>
            </View>
          ) : rows.length === 0 ? (
            <Empty text="첫 댓글을 남겨보세요." />
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(row) => String(row.comment.comment_idx)}
              // 키보드가 올라온 상태에서 "답글 달기"를 한 번에 누를 수 있게.
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: scale(20),
                paddingVertical: verticalScale(12),
                gap: verticalScale(16),
              }}
              renderItem={({ item }) => (
                <CommentRow
                  comment={item.comment}
                  depth={item.depth}
                  onReply={startReply}
                  onToggleLike={toggleLike}
                  onLongPress={confirmBlock}
                  blockable={me?.user_idx !== item.comment.user_idx}
                />
              )}
            />
          )}

          {/* 입력창 — 목록 로딩/실패와 무관하게 항상 하단 고정.
              안드로이드는 windowSoftInputMode=adjustResize 로 화면이 줄어들어
              시트가 키보드 위로 밀린다(KeyboardAvoidingView 불필요). */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#2E2E2E",
              paddingHorizontal: scale(16),
              paddingTop: verticalScale(10),
              paddingBottom: verticalScale(12),
              gap: verticalScale(8),
            }}
          >
            {replyTo ? (
              <View
                className="flex-row items-center justify-between"
                style={{ paddingHorizontal: scale(4) }}
              >
                <Text
                  className="text-gray-400"
                  style={{ fontSize: moderateScale(11) }}
                >
                  {replyTo.nickname}님에게 답글 남기는 중
                </Text>
                <Pressable
                  onPress={() => setReplyTo(null)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="답글 취소"
                >
                  <Text
                    className="text-gray-500"
                    style={{ fontSize: moderateScale(11) }}
                  >
                    취소
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View className="flex-row items-end" style={{ gap: scale(8) }}>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
                placeholder={replyTo ? "답글을 입력하세요" : "댓글을 입력하세요"}
                placeholderTextColor="#6B7280"
                multiline
                maxLength={500}
                className="flex-1 text-white"
                style={{
                  backgroundColor: "#2A2A2A",
                  borderRadius: scale(18),
                  paddingHorizontal: scale(14),
                  paddingTop: verticalScale(9),
                  paddingBottom: verticalScale(9),
                  fontSize: moderateScale(13),
                  maxHeight: verticalScale(100),
                }}
              />
              <Pressable
                onPress={submit}
                disabled={!draft.trim() || create.isPending}
                className="rounded-full active:opacity-70"
                style={{
                  backgroundColor: draft.trim() ? "#5E84F4" : "#3A3A3A",
                  paddingHorizontal: scale(16),
                  paddingVertical: verticalScale(10),
                }}
                accessibilityRole="button"
                accessibilityLabel="댓글 등록"
              >
                {create.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    className="font-semibold text-white"
                    style={{ fontSize: moderateScale(13) }}
                  >
                    등록
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
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
  onReply,
  onToggleLike,
  onLongPress,
  blockable,
}: {
  comment: ReelsComment;
  depth: number;
  onReply: (comment: ReelsComment, depth: number) => void;
  onToggleLike: (comment: ReelsComment) => void;
  onLongPress: (comment: ReelsComment) => void;
  /** 내 댓글이면 false — 길게 눌러도 메뉴가 뜨지 않는다. */
  blockable: boolean;
}) {
  const avatar = moderateScale(depth > 0 ? 26 : 32);

  return (
    <Pressable
      className="flex-row active:opacity-70"
      onLongPress={blockable ? () => onLongPress(comment) : undefined}
      delayLongPress={400}
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

        <View className="flex-row items-center" style={{ gap: scale(12) }}>
          <Pressable
            onPress={() => onToggleLike(comment)}
            hitSlop={8}
            className="flex-row items-center active:opacity-60"
            style={{ gap: scale(4) }}
            accessibilityRole="button"
            accessibilityLabel={comment.liked ? "좋아요 취소" : "좋아요"}
          >
            <HeartIcon
              width={moderateScale(13)}
              height={moderateScale(11)}
              color={comment.liked ? "#FF4D6D" : "#9CA3AF"}
              filled={comment.liked}
            />
            {comment.like_count > 0 ? (
              <Text
                className="text-gray-500"
                style={{ fontSize: moderateScale(11) }}
              >
                {comment.like_count}
              </Text>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => onReply(comment, depth)}
            hitSlop={8}
            className="active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="답글 달기"
          >
            <Text
              className="text-gray-400 font-semibold"
              style={{ fontSize: moderateScale(11) }}
            >
              답글 달기
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
