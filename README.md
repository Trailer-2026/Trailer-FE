# Trailer Frontend

AI 기반 스마트 기차여행 플랫폼 - 모바일 앱 (React Native / Expo)

## 기술 스택
- Expo (SDK 54) / React Native / TypeScript
- Expo Router (파일 기반 라우팅)
- NativeWind v4 / TanStack Query / Zustand / Axios

## 시작하기
\`\`\`bash
git pull origin main   # 작업 전 항상!
npm install
cp .env.example .env    # LAN IP 채우기
npx expo start
\`\`\`

## 환경변수
| 키 | 설명 |
|---|---|
| EXPO_PUBLIC_API_URL | 백엔드 API 주소 (개발 시 PC LAN IP) |

## 커밋 컨벤션
백엔드 레포와 동일 규칙 사용 (✨ [Feat], 🐛 [Fix] ...)
