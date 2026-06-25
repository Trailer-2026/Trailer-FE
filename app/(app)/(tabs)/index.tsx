import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type QuickMenuKey = "ticket" | "train" | "tour" | "food";

const QUICK_MENU: { key: QuickMenuKey; label: string }[] = [
  { key: "ticket", label: "승차권" },
  { key: "train", label: "열차위치" },
  { key: "tour", label: "투어정보" },
  { key: "food", label: "맛집" },
];

const FEED_CARDS = [
  { id: "1", title: "부산 여행", status: "여행중", period: "6.6(토) ~ 6.8(월)" },
  { id: "2", title: "강릉 여행", status: "여행중", period: "6.7(일) ~ 6.9(화)" },
  { id: "3", title: "여수 여행", status: "예정", period: "6.10(수) ~ 6.12(금)" },
];

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Header />

        <View className="px-5 mt-3">
          <HeroBanner />
        </View>

        <View className="px-5 mt-6">
          <QuickMenu />
        </View>

        <View className="px-5 mt-8">
          <SectionHeader />
        </View>

        <View className="mt-4">
          <FeedCarousel />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View className="px-5 pt-2 pb-1 flex-row items-center justify-between">
      <Text className="text-2xl font-extrabold text-gray-900">트레일러</Text>
      <View className="flex-row items-center gap-4">
        <View className="items-center">
          <View className="absolute -top-7 right-0 bg-gray-800 rounded-full px-3 py-1">
            <Text className="text-[11px] text-white">AI 일정 만들기</Text>
          </View>
          <Feather name="calendar" size={22} color="#374151" />
        </View>
        <Feather name="search" size={22} color="#374151" />
        <Feather name="menu" size={22} color="#374151" />
      </View>
    </View>
  );
}

function HeroBanner() {
  return (
    <View className="bg-gray-400 rounded-2xl px-5 py-7">
      <Text className="text-white text-base font-semibold leading-6">
        귀찮은 일정 관리는 AI에게 맡기고,
      </Text>
      <Text className="text-white text-base font-semibold leading-6">
        여행의 순간을 즐겨요
      </Text>
    </View>
  );
}

function QuickMenu() {
  return (
    <View className="flex-row justify-between">
      {QUICK_MENU.map((item) => {
        const tile = (
          <View className="items-center w-[22%]">
            <View className="w-16 h-16 bg-gray-200 rounded-2xl items-center justify-center">
              <QuickMenuIcon menuKey={item.key} />
            </View>
            <Text className="mt-2 text-xs text-gray-700">{item.label}</Text>
          </View>
        );

        if (item.key === "ticket") {
          return (
            <Link
              key={item.key}
              href="/course/origin-destination"
              asChild
            >
              <Pressable>{tile}</Pressable>
            </Link>
          );
        }

        return (
          <Pressable key={item.key}>
            {tile}
          </Pressable>
        );
      })}
    </View>
  );
}

function QuickMenuIcon({ menuKey }: { menuKey: QuickMenuKey }) {
  const color = "#4B5563";
  switch (menuKey) {
    case "ticket":
      return <MaterialCommunityIcons name="ticket-confirmation-outline" size={28} color={color} />;
    case "train":
      return <MaterialCommunityIcons name="train" size={28} color={color} />;
    case "tour":
      return <MaterialCommunityIcons name="compass-outline" size={28} color={color} />;
    case "food":
      return <MaterialCommunityIcons name="silverware-fork-knife" size={28} color={color} />;
  }
}

function SectionHeader() {
  return (
    <View>
      <Text className="text-xs text-gray-400">실시간 여행 피드</Text>
      <Text className="mt-1 text-xl font-extrabold text-gray-900">
        지금 사람들이 떠나는 여행 보기
      </Text>
    </View>
  );
}

function FeedCarousel() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
    >
      {FEED_CARDS.map((card) => (
        <FeedCard key={card.id} {...card} />
      ))}
    </ScrollView>
  );
}

function FeedCard({
  title,
  status,
  period,
}: {
  title: string;
  status: string;
  period: string;
}) {
  return (
    <View className="w-44 h-60 bg-gray-300 rounded-2xl overflow-hidden">
      <View className="absolute top-3 left-3 w-9 h-9 rounded-full bg-gray-100" />
      <View className="absolute left-0 right-0 bottom-0 bg-black/40 px-3 py-3">
        <Text className="text-white text-base font-bold">{title}</Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-white text-[11px]">
            {status} | {period}
          </Text>
          <Feather name="calendar" size={14} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}
