import type { VideoTheme } from "./types";

/**
 * 편집 화면 테마 미리보기 데이터 — 렌더러(Trailer-BE services/videoMaker/map_themes.js)의
 * THEMES 를 그대로 옮긴 것이다. 값이 바뀌면 여기도 같이 고쳐야 미리보기가 어긋나지 않는다.
 *
 * - fog        : 지도 하늘색. 미리보기 배경 그라데이션(위=high-color, 아래=color)에 쓴다.
 * - colorGrade : 렌더러가 32³ LUT 로 굽는 색보정. 여기서는 같은 수식을 4x5 색상 행렬로
 *                풀어 사진에 그대로 적용한다(아래 buildColorMatrix 주석 참고).
 * - snow       : setSnow 파티클(겨울 눈 / 봄 벚꽃잎). 여름·가을은 파티클이 없다.
 */
export type ColorGrade = {
  saturation: number;
  contrast: number;
  brightness: number;
  highlightWarmth: number;
  shadowCool: number;
  greenToPink?: number;
  greenToAmber?: number;
  pinkTint?: number;
  amberTint?: number;
};

export type SnowSpec = {
  /** 파티클 밀도(0~1) — 화면에 뿌릴 개수로 환산한다. */
  density: number;
  /** 낙하 속도 계수. */
  intensity: number;
  /** [방위각, 고도각] — 방위각이 클수록 옆으로 흩날린다. */
  direction: [number, number];
  opacity: number;
  color: string;
  /** 눈송이 크기 배율(1.0 = 꽃잎 크기). */
  flakeSize: number;
};

export type ThemeSpec = {
  fog: { color: string; highColor: string };
  colorGrade: ColorGrade | null;
  snow: SnowSpec | null;
  /** lightPreset dusk 는 화면 전체가 어두워진다 — 배경 밝기 배율로 흉내 낸다. */
  dim: number;
};

const DEFAULT_FOG = {
  color: "rgb(204, 226, 255)",
  highColor: "rgb(64, 114, 180)",
};

export const THEME_SPECS: Record<VideoTheme, ThemeSpec> = {
  default: { fog: DEFAULT_FOG, colorGrade: null, snow: null, dim: 1 },
  spring: {
    fog: { color: "rgb(255, 238, 245)", highColor: "rgb(155, 190, 235)" },
    colorGrade: {
      saturation: 0.9,
      contrast: 0.93,
      brightness: 0.04,
      highlightWarmth: 0.08,
      shadowCool: 0.02,
      greenToPink: 0.75,
      pinkTint: 0.07,
    },
    snow: {
      density: 0.15,
      intensity: 0.15,
      direction: [40, 65],
      opacity: 0.9,
      color: "#ffb7c5",
      flakeSize: 1.0,
    },
    dim: 1,
  },
  summer: {
    fog: { color: "rgb(235, 246, 255)", highColor: "rgb(46, 130, 232)" },
    colorGrade: {
      saturation: 1.5,
      contrast: 1.12,
      brightness: 0.02,
      highlightWarmth: 0.05,
      shadowCool: 0.06,
    },
    snow: null,
    dim: 1,
  },
  autumn: {
    fog: { color: "rgb(255, 150, 74)", highColor: "rgb(196, 106, 116)" },
    colorGrade: {
      saturation: 1.25,
      contrast: 1.03,
      brightness: 0.07,
      highlightWarmth: 0.2,
      shadowCool: 0.02,
      greenToAmber: 0.8,
      amberTint: 0.12,
    },
    snow: null,
    dim: 0.72, // lightPreset: dusk
  },
  winter: {
    // 겨울은 커스텀 fog 가 없어 기본 하늘 + dusk 조명이다.
    fog: DEFAULT_FOG,
    colorGrade: null,
    snow: {
      density: 0.15,
      intensity: 0.2,
      direction: [0, 50],
      opacity: 0.8,
      color: "#ffffff",
      flakeSize: 0.6,
    },
    dim: 0.6, // lightPreset: dusk
  },
};

/** "rgb(r, g, b)" / "#rgb" / "#rrggbb" → [r,g,b] (0~255). */
function parseColor(value: string): [number, number, number] {
  const rgb = value.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const [r, g, b] = rgb[1].split(",").map((v) => Number(v.trim()));
    return [r, g, b];
  }
  const hex = value.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** 색을 factor 배로 어둡게 — dusk 조명(화면이 어두워짐)을 배경에서 흉내 낸다. */
export function dimColor(value: string, factor: number): string {
  const [r, g, b] = parseColor(value);
  const f = (n: number) => Math.round(Math.min(255, Math.max(0, n * factor)));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

/** 4x5 색상 행렬(feColorMatrix 형식) 곱: apply(a, apply(b, color)) 와 같은 행렬. */
function multiply(a: number[], b: number[]): number[] {
  const out = new Array(20).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[row * 5 + col] =
        a[row * 5] * b[col] +
        a[row * 5 + 1] * b[5 + col] +
        a[row * 5 + 2] * b[10 + col] +
        a[row * 5 + 3] * b[15 + col];
    }
    // 상수항(5번째 열)
    out[row * 5 + 4] =
      a[row * 5] * b[4] +
      a[row * 5 + 1] * b[9] +
      a[row * 5 + 2] * b[14] +
      a[row * 5 + 3] * b[19] +
      a[row * 5 + 4];
  }
  return out;
}

const IDENTITY = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

// 렌더러 LUT 의 luma 가중치(map_themes.js 와 동일).
const LR = 0.2126;
const LG = 0.7152;
const LB = 0.0722;

/**
 * 초록 → 호박색(가을) / 초록 → 연분홍(봄) 단계만 뽑은 행렬.
 *
 * LUT 는 `greenness = max(0, g - max(r, b))` 로 초록 우세분만 밀어내는데, max 는
 * 선형이 아니라 하나의 색상 행렬로 못 옮긴다. 대신 SVG 필터가 각 단계 결과를
 * [0,1] 로 자른다는 성질을 이용한다 — 이 행렬로 "밀어낼 양"만 따로 뽑으면
 * 초록이 아닌 픽셀은 음수가 되어 0 으로 잘리고, 결과를 원본에 더하면 max() 와 같아진다.
 * (greenness 자체는 g - (r + b) / 2 로 근사한다.)
 *
 * 반환값이 null 이면 이 단계가 없는 테마다.
 * 알려진 차이: LUT 는 초록 성분을 살짝 깎기도 하지만(gg -= …), 필터로 빼려면
 * 알파까지 깎여서 생략했다 — 색조 방향은 같고 채도만 조금 더 남는다.
 */
export function buildGreenShiftMatrix(grade: ColorGrade | null): number[] | null {
  if (!grade) return null;
  const k = grade.greenToAmber ?? grade.greenToPink;
  if (!k) return null;
  // 밀어낼 채널 비율 — 가을은 R 만, 봄은 R + B(분홍).
  const toB = grade.greenToPink ? 0.55 : 0;
  return [
    -0.5 * k, k, -0.5 * k, 0, 0,
    0, 0, 0, 0, 0,
    -0.5 * k * toB, k * toB, -0.5 * k * toB, 0, 0,
    0, 0, 0, 0, 1, // 알파는 항상 1 (더하기 합성에서 색이 사라지지 않게)
  ];
}

/**
 * map_themes.js 의 buildColorGradeLUT 중 색에 대해 1차인 단계들
 * (전역 틴트 → 대비 → 채도 → 밝기/온기)을 4x5 행렬 하나로 합성한다.
 * 계수·순서 모두 LUT 와 같아 결과도 같다(scratchpad 검증 스크립트로 확인).
 * 비선형인 초록 시프트는 buildGreenShiftMatrix 가 앞단에서 처리한다.
 */
export function buildColorMatrix(grade: ColorGrade | null): number[] {
  if (!grade) return IDENTITY;
  let m = IDENTITY;

  // 2) 전역 틴트 — t * (0.4 + 0.6 * L), L = (r+g+b)/3 → 0.4t 상수 + 0.2t 씩 각 채널
  const tint = (t: number, gainR: number, gainG: number, gainB: number, flatB: number) => {
    const c = 0.2 * t;
    m = multiply(
      [
        1 + c * gainR, c * gainR, c * gainR, 0, 0.4 * t * gainR,
        c * gainG, 1 + c * gainG, c * gainG, 0, 0.4 * t * gainG,
        c * gainB, c * gainB, 1 + c * gainB, 0, 0.4 * t * gainB + flatB,
        0, 0, 0, 1, 0,
      ],
      m,
    );
  };
  // amberTint: r 전량, g 0.72배, b 는 -0.35t 상수 감소
  if (grade.amberTint) tint(grade.amberTint, 1, 0.72, 0, -0.35 * grade.amberTint);
  // pinkTint: r 전량, b 0.5배, g 는 -0.15t 상수 감소
  if (grade.pinkTint) {
    tint(grade.pinkTint, 1, 0, 0.5, 0);
    m = multiply(
      [1, 0, 0, 0, 0, 0, 1, 0, 0, -0.15 * grade.pinkTint, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      m,
    );
  }

  // 3) 대비 (0.5 기준)
  const k = grade.contrast;
  const b0 = 0.5 * (1 - k);
  m = multiply(
    [k, 0, 0, 0, b0, 0, k, 0, 0, b0, 0, 0, k, 0, b0, 0, 0, 0, 1, 0],
    m,
  );

  // 4) 채도 (luma 기준)
  const s = grade.saturation;
  m = multiply(
    [
      LR + (1 - LR) * s, LG * (1 - s), LB * (1 - s), 0, 0,
      LR * (1 - s), LG + (1 - LG) * s, LB * (1 - s), 0, 0,
      LR * (1 - s), LG * (1 - s), LB + (1 - LB) * s, 0, 0,
      0, 0, 0, 1, 0,
    ],
    m,
  );

  // 5) 밝기 + 하이라이트 온기(luma 비례) / 그림자 냉기((1-luma) 비례)
  const hw = grade.highlightWarmth;
  const sc = grade.shadowCool;
  m = multiply(
    [
      1 + hw * LR, hw * LG, hw * LB, 0, grade.brightness,
      hw * 0.55 * LR, 1 + hw * 0.55 * LG, hw * 0.55 * LB, 0, grade.brightness,
      -sc * LR, -sc * LG, 1 - sc * LB, 0, grade.brightness + sc,
      0, 0, 0, 1, 0,
    ],
    m,
  );
  return m;
}
