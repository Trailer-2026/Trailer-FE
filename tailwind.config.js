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
        pretendard: ["Pretendard"],
        sans: ["Pretendard"],
      },
      // 프로젝트 자체 정의: "Medium"이 기본 500 이라 얇아 보여서 600 으로 올림
      fontWeight: {
        medium: "600",
      },
    },
  },
  plugins: [],
};
