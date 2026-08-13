import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import {
  dimColor,
  THEME_SPECS,
  type SnowSpec,
} from "@/src/features/video/theme-preview";
import type { VideoTheme } from "@/src/features/video/types";

/** density(0~1) → 화면에 뿌릴 개수. 렌더러의 setSnow density 를 개수로 환산. */
const PARTICLES_PER_DENSITY = 160;

/** 배경을 이 배율만큼 더 어둡게 — 하늘색을 그대로 깔면 흰 UI 글씨가 안 읽힌다. */
const BACKGROUND_DIM = 0.45;

/**
 * 테마 배경 — 렌더러 지도의 하늘(fog)을 그라데이션으로.
 * 위 = high-color(상공), 아래 = color(지평선). dusk 테마는 spec.dim 으로 더 어둡다.
 */
export function ThemeBackground({ theme }: { theme: VideoTheme }) {
  const spec = THEME_SPECS[theme];
  const dim = BACKGROUND_DIM * spec.dim;

  return (
    <LinearGradient
      colors={[
        dimColor(spec.fog.highColor, dim),
        dimColor(spec.fog.color, dim),
        "#000000",
      ]}
      locations={[0, 0.55, 1]}
      className="absolute inset-0"
      pointerEvents="none"
    />
  );
}

/**
 * 테마 파티클 — 렌더러가 setSnow 로 뿌리는 눈(겨울)·벚꽃잎(봄)을 화면에 그대로 흉내 낸다.
 * 개수·크기·낙하 속도·흩날림은 map_themes.js 의 snow 옵션에서 그대로 환산한다
 * (density → 개수, flake-size → 크기, intensity → 낙하 시간, direction[0] → 좌우 흔들림).
 * 여름·가을은 snow 가 없어 아무것도 그리지 않는다.
 */
export function ThemeParticles({ theme }: { theme: VideoTheme }) {
  const snow = THEME_SPECS[theme].snow;
  const { width, height } = useWindowDimensions();

  if (!snow) return null;
  const count = Math.round(snow.density * PARTICLES_PER_DENSITY);

  return (
    <View className="absolute inset-0" pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        // theme 이 바뀌면 파티클을 새로 뿌린다(키에 theme 포함).
        <Particle
          key={`${theme}-${i}`}
          snow={snow}
          width={width}
          height={height}
        />
      ))}
    </View>
  );
}

/** 위 → 아래로 한 번 떨어지고 반복. 좌우 흔들림·회전은 개체마다 다르게. */
function Particle({
  snow,
  width,
  height,
}: {
  snow: SnowSpec;
  width: number;
  height: number;
}) {
  // 개체마다 고정된 무작위 값 — 매 렌더 흔들리지 않게 한 번만 뽑는다.
  const seed = useMemo(() => {
    const base = 5 * snow.flakeSize; // flake-size 1.0 ≈ 5px 꽃잎
    // 방위각이 클수록 옆으로 흩날린다(0 이면 거의 수직 낙하).
    const drift = 4 + snow.direction[0];
    return {
      x: Math.random() * width,
      size: base * (0.6 + Math.random() * 0.8),
      // intensity 가 클수록 빨리 떨어진다(0.15 기준 8초).
      duration: ((8000 * 0.15) / snow.intensity) * (0.7 + Math.random() * 0.6),
      delay: Math.random() * 7000,
      drift: drift * (0.4 + Math.random()),
      sway: 1 + Math.random(),
      // 꽃잎만 회전한다 — 눈송이는 구형이라 돌려도 티가 안 난다.
      spin: snow.flakeSize >= 1 ? 1 + Math.random() : 0,
      opacity: snow.opacity * (0.6 + Math.random() * 0.4),
    };
  }, [snow, width]);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      seed.delay,
      withRepeat(
        withTiming(1, { duration: seed.duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [progress, seed.delay, seed.duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -40 + progress.value * (height + 80) },
      {
        translateX:
          Math.sin(progress.value * Math.PI * 2 * seed.sway) * seed.drift,
      },
      { rotate: `${progress.value * 360 * seed.spin}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: seed.x,
          top: 0,
          width: seed.size,
          // 꽃잎은 살짝 납작한 타원, 눈송이는 원.
          height: seed.spin ? seed.size * 0.7 : seed.size,
          borderRadius: seed.size,
          backgroundColor: snow.color,
          opacity: seed.opacity,
        },
        style,
      ]}
    />
  );
}
