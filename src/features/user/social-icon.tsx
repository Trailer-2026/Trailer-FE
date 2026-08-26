import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";

import type { MyProfile } from "./types";

const GOOGLE_ICON = require("../../../assets/images/style/google.png");

const PROVIDER_KO: Record<MyProfile["provider"], string> = {
  google: "구글",
  kakao: "카카오",
  demo: "데모",
};

/**
 * 연동 소셜 계정 아이콘. google 은 에셋(google.png), kakao 는 전용 에셋이 없어
 * 말풍선 아이콘(카카오 브라운)으로 근사한다.
 * demo 는 스토어 심사용 계정(소셜 미연동) — 일반 계정 아이콘으로 표시한다.
 */
export function ProviderIcon({
  provider,
  size,
}: {
  provider: MyProfile["provider"];
  size: number;
}) {
  if (provider === "google") {
    return (
      <Image
        source={GOOGLE_ICON}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel={PROVIDER_KO.google}
      />
    );
  }
  if (provider === "demo") {
    return (
      <MaterialCommunityIcons
        name="account-circle"
        size={size}
        color="#7292EE"
        accessibilityLabel={PROVIDER_KO.demo}
      />
    );
  }
  return (
    <MaterialCommunityIcons
      name="chat"
      size={size}
      color="#3C1E1E"
      accessibilityLabel={PROVIDER_KO.kakao}
    />
  );
}
