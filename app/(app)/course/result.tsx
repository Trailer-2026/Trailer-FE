import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackIcon from "@/src/components/icons/BackIcon";
import { Text } from "@/src/components/Text";
import { PrimaryButton } from "@/src/features/course/components/PrimaryButton";
import { describeRecommendError } from "@/src/features/course/errors";
import {
  formatFare,
  formatIsoToHhmm,
  formatMinutes,
} from "@/src/features/course/format";
import {
  usePrefetchNextRecommendPage,
  useRecommendCourses,
} from "@/src/features/course/queries";
import { buildRecommendCriteria, useCourseStore } from "@/src/features/course/store";
import {
  RECOMMEND_MAX_PAGE,
  type DestinationPlan,
  type Itinerary,
  type PlaceInfo,
  type Segment,
} from "@/src/features/course/types";
import { moderateScale, scale, verticalScale } from "@/src/utils/responsive";

// http:// 이미지가 안드로이드 cleartext 로 막히거나 서버가 null 로 줄 때의 대체 이미지.
const PLACEHOLDER_IMAGE = require("../../../assets/images/Main.png");

export default function ResultScreen() {
  // 진입 시점의 store 스냅샷으로 base criteria 를 고정.
  const baseCriteria = useMemo(() => {
    try {
      return buildRecommendCriteria(useCourseStore.getState(), 0);
    } catch {
      return null;
    }
  }, []);

  const [page, setPage] = useState(0);
  const [destIdx, setDestIdx] = useState(0);
  const [itinIdx, setItinIdx] = useState(0);

  const criteria = useMemo(
    () => (baseCriteria ? { ...baseCriteria, page } : null),
    [baseCriteria, page],
  );

  const { data, error, isLoading, isError, refetch } = useRecommendCourses(criteria);
  const prefetchNext = usePrefetchNextRecommendPage();

  // 응답이 오면 다음 page 를 백그라운드에서 미리 가져와둔다.
  useEffect(() => {
    if (data && criteria) prefetchNext(criteria);
  }, [data, criteria, prefetchNext]);

  // page/destination 이 바뀌면 하위 인덱스 리셋.
  useEffect(() => {
    setDestIdx(0);
    setItinIdx(0);
  }, [page]);

  useEffect(() => {
    setItinIdx(0);
  }, [destIdx]);

  const destinations = data?.destinations ?? [];
  const activeDest: DestinationPlan | undefined = destinations[destIdx];
  const activeItin: Itinerary | undefined = activeDest?.itineraries[itinIdx];

  const canRetry = page < RECOMMEND_MAX_PAGE;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: scale(20),
          paddingTop: verticalScale(6),
          paddingBottom: verticalScale(6),
          gap: scale(10),
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <BackIcon
            color="#111827"
            width={moderateScale(14)}
            height={moderateScale(20)}
          />
        </Pressable>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(20) }}
        >
          추천 일정
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#111827" />
        </View>
      ) : isError || !data ? (
        <ErrorView
          message={describeRecommendError(error)}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: scale(20),
              paddingBottom: verticalScale(20),
            }}
          >
            {data.auto_selected ? (
              <Banner text="AI가 목적지를 골랐어요" />
            ) : null}
            {data.note ? <NoteRow text={data.note} /> : null}

            {destinations.length === 0 ? (
              <View
                style={{ marginTop: verticalScale(60), alignItems: "center" }}
              >
                <Text
                  className="text-gray-500"
                  style={{ fontSize: moderateScale(14) }}
                >
                  추천된 목적지가 없어요
                </Text>
              </View>
            ) : (
              <>
                {destinations.length > 1 ? (
                  <DestinationTabs
                    destinations={destinations}
                    activeIdx={destIdx}
                    onChange={setDestIdx}
                  />
                ) : null}

                {activeDest ? (
                  <View style={{ marginTop: verticalScale(12) }}>
                    <Text
                      className="font-bold text-gray-900"
                      style={{ fontSize: moderateScale(20) }}
                    >
                      {activeDest.destination_name}
                    </Text>
                    {activeDest.note ? (
                      <Text
                        className="text-gray-500"
                        style={{
                          fontSize: moderateScale(13),
                          marginTop: verticalScale(4),
                        }}
                      >
                        {activeDest.note}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {activeDest ? (
                  <ItineraryCarousel
                    itineraries={activeDest.itineraries}
                    activeIdx={itinIdx}
                    onChange={setItinIdx}
                  />
                ) : null}

                {activeItin ? <ItineraryDetail itinerary={activeItin} /> : null}
              </>
            )}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: scale(20),
              paddingBottom: verticalScale(8),
              gap: verticalScale(8),
            }}
          >
            <Pressable
              onPress={() => canRetry && setPage((p) => p + 1)}
              disabled={!canRetry}
              className="w-full rounded-2xl items-center justify-center border"
              style={{
                height: verticalScale(52),
                borderColor: canRetry ? "#5E84F4" : "#E5E7EB",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Text
                className="font-semibold"
                style={{
                  fontSize: moderateScale(15),
                  color: canRetry ? "#5E84F4" : "#9CA3AF",
                }}
              >
                {canRetry
                  ? "추천 다시 받기"
                  : "더 이상 새로운 추천이 없어요"}
              </Text>
            </Pressable>
            <PrimaryButton
              label="이 일정 선택하기"
              onPress={() => {
                // TODO(TRA-29 후속): 선택한 일정을 내 일정 스토어/서버에 저장.
                // 이번 범위는 UI 배치만.
              }}
              disabled={!activeItin}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text
        className="font-semibold text-gray-900"
        style={{ fontSize: moderateScale(16) }}
      >
        추천을 불러오지 못했어요
      </Text>
      <Text
        className="text-gray-500 text-center"
        style={{
          fontSize: moderateScale(13),
          marginTop: verticalScale(6),
        }}
        selectable
      >
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-6 bg-gray-800 rounded-full"
        style={{
          paddingHorizontal: scale(20),
          paddingVertical: verticalScale(10),
        }}
      >
        <Text
          className="text-white font-semibold"
          style={{ fontSize: moderateScale(14) }}
        >
          다시 시도
        </Text>
      </Pressable>
    </View>
  );
}

function Banner({ text }: { text: string }) {
  return (
    <View
      className="flex-row items-center bg-blue-50"
      style={{
        marginTop: verticalScale(12),
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(10),
        borderRadius: scale(12),
        gap: scale(8),
      }}
    >
      <Feather name="cpu" size={moderateScale(16)} color="#5E84F4" />
      <Text
        className="font-medium"
        style={{ fontSize: moderateScale(13), color: "#3057D5" }}
      >
        {text}
      </Text>
    </View>
  );
}

function NoteRow({ text }: { text: string }) {
  return (
    <Text
      className="text-gray-500"
      style={{ fontSize: moderateScale(13), marginTop: verticalScale(10) }}
    >
      {text}
    </Text>
  );
}

function DestinationTabs({
  destinations,
  activeIdx,
  onChange,
}: {
  destinations: DestinationPlan[];
  activeIdx: number;
  onChange: (i: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: verticalScale(12) }}
      contentContainerStyle={{ gap: scale(8) }}
    >
      {destinations.map((d, i) => {
        const isSel = i === activeIdx;
        return (
          <Pressable
            key={`${d.destination_station_idx}-${i}`}
            onPress={() => onChange(i)}
            className={isSel ? "bg-gray-800" : "bg-gray-100"}
            style={{
              paddingHorizontal: scale(14),
              height: verticalScale(34),
              borderRadius: scale(17),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              className={
                isSel ? "text-white font-semibold" : "text-gray-700 font-medium"
              }
              style={{ fontSize: moderateScale(13) }}
            >
              {d.destination_name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ItineraryCarousel({
  itineraries,
  activeIdx,
  onChange,
}: {
  itineraries: Itinerary[];
  activeIdx: number;
  onChange: (i: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: verticalScale(14) }}
      contentContainerStyle={{ gap: scale(12), paddingRight: scale(20) }}
    >
      {itineraries.map((it, i) => {
        const isSel = i === activeIdx;
        return (
          <Pressable
            key={`${it.label}-${i}`}
            onPress={() => onChange(i)}
            className="bg-white border rounded-2xl"
            style={{
              width: scale(220),
              padding: scale(14),
              borderColor: isSel ? "#5E84F4" : "#E5E7EB",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isSel ? 0.1 : 0.05,
              shadowRadius: 4,
              elevation: isSel ? 3 : 1,
            }}
          >
            <Text
              className="font-bold text-gray-900"
              style={{ fontSize: moderateScale(15) }}
            >
              {it.label}
            </Text>
            <Text
              className="text-gray-500"
              style={{
                fontSize: moderateScale(12),
                marginTop: verticalScale(4),
              }}
            >
              {it.route_type}
            </Text>
            <View
              className="flex-row items-center justify-between"
              style={{ marginTop: verticalScale(12) }}
            >
              <Text
                className="font-medium text-gray-700"
                style={{ fontSize: moderateScale(12) }}
              >
                {formatMinutes(it.total_travel_minutes)}
              </Text>
              <Text
                className="font-bold text-gray-900"
                style={{ fontSize: moderateScale(14) }}
              >
                {formatFare(it.total_fare)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ItineraryDetail({ itinerary }: { itinerary: Itinerary }) {
  // day_no 로 그룹핑. 서버가 오름차순으로 주지만 안전하게 정렬.
  const groups = useMemo(() => {
    const map = new Map<number, Segment[]>();
    for (const seg of itinerary.segments) {
      const arr = map.get(seg.day_no) ?? [];
      arr.push(seg);
      map.set(seg.day_no, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [itinerary]);

  return (
    <View style={{ marginTop: verticalScale(20) }}>
      {itinerary.note ? (
        <Text
          className="text-gray-500"
          style={{
            fontSize: moderateScale(13),
            marginBottom: verticalScale(8),
          }}
        >
          {itinerary.note}
        </Text>
      ) : null}
      {groups.map(([dayNo, segs]) => (
        <View key={dayNo} style={{ marginBottom: verticalScale(18) }}>
          <Text
            className="font-bold text-gray-900"
            style={{
              fontSize: moderateScale(16),
              marginBottom: verticalScale(10),
            }}
          >
            {dayNo}일차
          </Text>
          <View style={{ gap: verticalScale(10) }}>
            {segs.map((seg, i) => (
              <SegmentCard key={i} segment={seg} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function SegmentCard({ segment }: { segment: Segment }) {
  if (segment.kind === "train" && segment.train) {
    return <TrainCard train={segment.train} />;
  }
  if (segment.kind === "visit" && segment.place) {
    return <VisitCard place={segment.place} visitTime={segment.start_time} />;
  }
  if (segment.kind === "lodging" && segment.lodging) {
    return (
      <LodgingCard
        name={segment.lodging.name}
        lodgingType={segment.lodging.lodging_type}
        imageUrl={segment.lodging.image_url}
      />
    );
  }
  return null;
}

function TrainCard({
  train,
}: {
  train: NonNullable<Segment["train"]>;
}) {
  return (
    <View
      className="bg-white border border-gray-200 rounded-2xl"
      style={{
        padding: scale(14),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View className="flex-row items-center" style={{ gap: scale(6) }}>
        <Feather name="navigation-2" size={moderateScale(14)} color="#5E84F4" />
        <Text
          className="font-bold"
          style={{ fontSize: moderateScale(13), color: "#5E84F4" }}
        >
          {train.grade} {train.train_no}
        </Text>
      </View>
      <View
        className="flex-row items-center"
        style={{ marginTop: verticalScale(8), gap: scale(8) }}
      >
        <Text
          className="font-semibold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          {train.dep_station}
        </Text>
        <Feather name="arrow-right" size={moderateScale(16)} color="#9CA3AF" />
        <Text
          className="font-semibold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          {train.arr_station}
        </Text>
      </View>
      <View
        className="flex-row items-center justify-between"
        style={{ marginTop: verticalScale(8) }}
      >
        <Text
          className="text-gray-600"
          style={{ fontSize: moderateScale(13) }}
        >
          {formatIsoToHhmm(train.dep_time)} ~ {formatIsoToHhmm(train.arr_time)}
        </Text>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(14) }}
        >
          {formatFare(train.fare)}
        </Text>
      </View>
    </View>
  );
}

function VisitCard({
  place,
  visitTime,
}: {
  place: PlaceInfo;
  visitTime: string | null;
}) {
  return (
    <View
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <RemoteImage
        uri={place.image_url}
        style={{ width: "100%", height: verticalScale(140) }}
      />
      <View style={{ padding: scale(14) }}>
        <Text
          className="font-bold text-gray-900"
          style={{ fontSize: moderateScale(16) }}
        >
          {place.name}
        </Text>
        {visitTime ? (
          <Text
            className="text-gray-500"
            style={{
              fontSize: moderateScale(12),
              marginTop: verticalScale(2),
            }}
          >
            {formatIsoToHhmm(visitTime)} 방문
          </Text>
        ) : null}
        {place.reason ? (
          <Text
            className="text-gray-600"
            style={{
              fontSize: moderateScale(13),
              marginTop: verticalScale(6),
            }}
          >
            {place.reason}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function LodgingCard({
  name,
  lodgingType,
  imageUrl,
}: {
  name: string;
  lodgingType: string;
  imageUrl: string | null;
}) {
  return (
    <View
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <RemoteImage
        uri={imageUrl}
        style={{ width: "100%", height: verticalScale(120) }}
      />
      <View style={{ padding: scale(14) }}>
        <View className="flex-row items-center" style={{ gap: scale(6) }}>
          <Feather name="home" size={moderateScale(14)} color="#6B7280" />
          <Text
            className="font-medium text-gray-500"
            style={{ fontSize: moderateScale(12) }}
          >
            {lodgingType}
          </Text>
        </View>
        <Text
          className="font-bold text-gray-900"
          style={{
            fontSize: moderateScale(16),
            marginTop: verticalScale(4),
          }}
        >
          {name}
        </Text>
      </View>
    </View>
  );
}

/**
 * 원격 이미지. uri 가 null 이거나 로드 실패 시 placeholder 로 대체.
 * (안드로이드 cleartext 는 app.config 에서 허용해두지만, 실패해도 화면이 깨지지 않도록 방어)
 */
function RemoteImage({
  uri,
  style,
}: {
  uri: string | null;
  style: { width: number | `${number}%` | "auto"; height: number };
}) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <Image
        source={PLACEHOLDER_IMAGE}
        resizeMode="cover"
        style={{ ...style, opacity: 0.9 }}
      />
    );
  }
  return (
    <Image
      source={{ uri }}
      resizeMode="cover"
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
