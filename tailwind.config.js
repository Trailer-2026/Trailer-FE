/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ["Pretendard-Regular"],
        sans: ["Pretendard-Regular"],
      },
      // 실제 굵기는 정적 폰트 파일이 담당(fontWeight → 패밀리 치환은 src/components/Text.tsx).
      // 본문 tier(font-semibold)는 제목 Bold(700)보다 얇고 600보다 굵은 650 으로 매핑한다.
      // (font-normal 400 · font-medium 500 · font-semibold 650 · font-bold 700)
      fontWeight: {
        semibold: "650",
      },
    },
  },
  plugins: [],
};
