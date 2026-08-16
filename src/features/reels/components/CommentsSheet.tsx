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
import { useConfirmDialog } from "@/src/components/ConfirmDialog";
import HeartIcon from "@/src/components/icons/HeartIcon";
import { Text } from "@/src/components/Text";
import {
  useBlockUser,
  useMyProfile,
  useReportUser,
} from "@/src/features/user/queries";

import ReportBlockSheet, { MyCommentSheet } from "./ReportBlockSheet";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

import {
  useCreateReelsComment,
  useDeleteReelsComment,
  useReelsComments,
  useToggleCommentLike,
  useUpdateReelsComment,
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
  const update = useUpdateReelsComment(reelsIdx);
  const remove = useDeleteReelsComment(reelsIdx);
  const like = useToggleCommentLike(reelsIdx);
  const block = useBlockUser();
  const report = useReportUser();
  // 내 댓글이면 신고·차단 대신 수정·삭제 메뉴를 띄운다(자기 자신 차단은 서버도 400).
  // 아직 프로필을 못 받았으면 내 댓글인지 알 수 없다 — 그 사이엔 어느 메뉴도 띄우지
  // 않는다. 조회에 실패한 경우(isLoading=false)는 막지 않는다. 계속 막으면 신고
  // 자체가 불가능해지는데, 그건 자기 댓글 차단 400 보다 나쁘다.
  const { data: me, isLoading: meLoading } = useMyProfile();

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  /** 수정 중인 내 댓글. null 이면 새 댓글 작성 모드. */
  const [editing, setEditing] = useState<ReelsComment | null>(null);
  const inputRef = useRef<TextInput>(null);

  // 시트를 닫았다 다시 열면 이전 입력이 남지 않게 초기화.
  useEffect(() => {
    if (reelsIdx == null) {
      setDraft("");
      setReplyTo(null);
      setEditing(null);
    }
  }, [reelsIdx]);

  // 최상위 + 답글을 한 배열로 펼친다(답글은 depth 1 로 들여쓰기).
  // replies 가 없는 응답(단건 조회 등)도 있어 ?? [] 로 방어한다.
  const rows = (comments ?? []).flatMap((c) => [
    { comment: c, depth: 0 },
    ...(c.replies ?? []).map((r) => ({ comment: r, depth: 1 })),
  ]);

  const startReply = (comment: ReelsComment, depth: number) => {
    // 수정 중이었다면 먼저 끝낸다. editing 이 남아 있으면 submit 이 replyTo 를
    // 보기도 전에 update 로 새어, 답글 내용이 원댓글 본문을 덮어쓴다.
    // draft 도 같이 비운다 — 안 그러면 답글 입력창에 원댓글 본문이 남는다.
    if (editing) {
      setEditing(null);
      setDraft("");
    }
    setReplyTo({
      // depth 1 이면 부모(최상위)에 단다 — 답글의 답글은 서버가 400.
      parentIdx: depth === 0 ? comment.comment_idx : comment.parent_idx!,
      nickname: comment.nickname ?? "알 수 없음",
    });
    inputRef.current?.focus();
  };

  // 댓글 길게 누르기 → 내 댓글이면 수정·삭제, 남의 댓글이면 신고·차단 시트.
  const [moreFor, setMoreFor] = useState<ReelsComment | null>(null);
  const isMine = moreFor != null && me?.user_idx === moreFor.user_idx;
  /** 메뉴를 띄워도 되는 시점인지 — 프로필이 오기 전엔 isMine 판정을 믿을 수 없다. */
  const menuReady = moreFor != null && !meLoading;
  // 확인/결과는 OS 기본 Alert 대신 앱 UI 다이얼로그로 띄운다.
  const { dialog, ask, notify } = useConfirmDialog();

  const confirmBlock = (comment: ReelsComment, reason: "report" | "block") => {
    setMoreFor(null);
    const nickname = comment.nickname ?? "이 사용자";
    ask({
      title:
        reason === "report"
          ? `${nickname}님의 댓글을 신고할까요?`
          : `${nickname}님을 차단할까요?`,
      message:
        reason === "report"
          ? "관리자에게 신고가 접수되고, 이 사용자의 릴스와 댓글이 나에게만 보이지 않아요."
          : "차단하면 이 사용자의 릴스와 댓글이 나에게만 보이지 않아요.",
      confirmLabel: reason === "report" ? "신고하기" : "차단하기",
      danger: true,
      onConfirm: () =>
        (reason === "report" ? report : block).mutate(comment.user_idx, {
          onSuccess: () =>
            notify({
              title: reason === "report" ? "신고했어요" : "차단했어요",
              message: "이 사용자의 릴스와 댓글이 더 이상 보이지 않아요.",
            }),
          onError: (err) =>
            notify({
              title: reason === "report" ? "신고 실패" : "차단 실패",
              message: describeApiError(err),
            }),
        }),
    });
  };

  const toggleLike = (comment: ReelsComment) => {
    like.mutate(
      { commentIdx: comment.comment_idx, liked: comment.liked },
      {
        onError: (err) => Alert.alert("좋아요 실패", describeApiError(err)),
      },
    );
  };

  /** 내 댓글 수정 시작 — 입력창을 그대로 재사용한다(내용 채우고 포커스). */
  const startEdit = (comment: ReelsComment) => {
    setMoreFor(null);
    setReplyTo(null);
    setEditing(comment);
    setDraft(comment.content);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };

  const confirmDelete = (comment: ReelsComment) => {
    setMoreFor(null);
    ask({
      title: "댓글을 삭제할까요?",
      message: "이 댓글에 달린 답글도 함께 삭제되고 되돌릴 수 없어요.",
      confirmLabel: "삭제하기",
      danger: true,
      onConfirm: () =>
        remove.mutate(comment.comment_idx, {
          // 수정 중이던 댓글이 사라졌으면 편집 모드도 닫는다. 안 닫으면 없는
          // 댓글을 가리킨 채 "수정 중"으로 남아 새 댓글을 쓸 수 없다.
          // 다른 댓글을 지운 경우엔 진행 중인 수정을 건드리지 않는다.
          onSuccess: () => {
            if (editing?.comment_idx === comment.comment_idx) cancelEdit();
            setReplyTo((current) =>
              current?.parentIdx === comment.comment_idx ? null : current,
            );
          },
          onError: (err) =>
            notify({ title: "삭제 실패", message: describeApiError(err) }),
        }),
    });
  };

  const submit = () => {
    const content = draft.trim();
    if (!content) return;

    if (editing) {
      if (update.isPending) return;
      // 내용이 그대로면 요청을 보내지 않고 편집만 끝낸다.
      if (content === editing.content) {
        cancelEdit();
        Keyboard.dismiss();
        return;
      }
      update.mutate(
        { commentIdx: editing.comment_idx, content },
        {
          onSuccess: () => {
            cancelEdit();
            Keyboard.dismiss();
          },
          onError: (err) => Alert.alert("댓글 수정 실패", describeApiError(err)),
        },
      );
      return;
    }

    if (create.isPending) return;
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
    <>
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
                  onLongPress={setMoreFor}
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
            {editing ? (
              <View
                className="flex-row items-center justify-between"
                style={{ paddingHorizontal: scale(4) }}
              >
                <Text
                  className="text-gray-400"
                  style={{ fontSize: moderateScale(11) }}
                >
                  댓글 수정 중
                </Text>
                <Pressable
                  onPress={cancelEdit}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="수정 취소"
                >
                  <Text
                    className="text-gray-500"
                    style={{ fontSize: moderateScale(11) }}
                  >
                    취소
                  </Text>
                </Pressable>
              </View>
            ) : replyTo ? (
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
                placeholder={
                  editing
                    ? "댓글을 수정하세요"
                    : replyTo
                      ? "답글을 입력하세요"
                      : "댓글을 입력하세요"
                }
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
                disabled={
                  !draft.trim() || create.isPending || update.isPending
                }
                className="rounded-full active:opacity-70"
                style={{
                  backgroundColor: draft.trim() ? "#5E84F4" : "#3A3A3A",
                  paddingHorizontal: scale(16),
                  paddingVertical: verticalScale(10),
                }}
                accessibilityRole="button"
                accessibilityLabel={editing ? "댓글 수정" : "댓글 등록"}
              >
                {create.isPending || update.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    className="font-semibold text-white"
                    style={{ fontSize: moderateScale(13) }}
                  >
                    {editing ? "수정" : "등록"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>

    {/* 내 댓글이면 수정·삭제, 남의 댓글이면 신고·차단 */}
    <MyCommentSheet
      visible={menuReady && isMine}
      name={moreFor?.nickname ?? "내 댓글"}
      onClose={() => setMoreFor(null)}
      onEdit={() => moreFor && startEdit(moreFor)}
      onDelete={() => moreFor && confirmDelete(moreFor)}
    />

    <ReportBlockSheet
      visible={menuReady && !isMine}
      name={moreFor?.nickname ?? "이 사용자"}
      reportLabel="이 댓글 신고하기"
      onClose={() => setMoreFor(null)}
      onReport={() => moreFor && confirmBlock(moreFor, "report")}
      onBlock={() => moreFor && confirmBlock(moreFor, "block")}
    />

    {dialog}
    </>
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
}: {
  comment: ReelsComment;
  depth: number;
  onReply: (comment: ReelsComment, depth: number) => void;
  onToggleLike: (comment: ReelsComment) => void;
  /** 길게 누르면 메뉴 — 내 댓글이면 수정·삭제, 남의 댓글이면 신고·차단. */
  onLongPress: (comment: ReelsComment) => void;
}) {
  const avatar = moderateScale(depth > 0 ? 26 : 32);

  return (
    <Pressable
      className="flex-row active:opacity-70"
      onLongPress={() => onLongPress(comment)}
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
