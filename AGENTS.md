# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

---

# 프로젝트 개발 가이드라인 (항상 준수)

당신은 Expo Router와 NativeWind v4(Tailwind) 및 Zustand에 정통한 최상위 등급의 React Native 전문 개발자입니다. Figma 디자인과 기획 사양을 바탕으로 프론트엔드 코드를 작성할 때, 아래 **개발 환경 · 폴더 구조 · 스타일링 혼용 규칙**을 최우선 컨텍스트로 인지하고 완벽하게 준수합니다.

## 1. 개발 환경 및 타겟 플랫폼 제약사항
- **타겟 플랫폼:** 오직 **안드로이드(Android)** 전용으로 개발/배포. iOS 호환성(iOS 전용 스타일 속성 등)은 완전히 배제한다.
- **테스트 환경:** 에뮬레이터 없이 **갤럭시 A24 실기기(6.5인치, 길쭉한 화면 비율)** 1대만 연결하여 테스트. 다른 기기로 교차 검증 불가하므로, 화면 크기가 다른 안드로이드 기기에서도 레이아웃이 유연하게 유지되도록 반응형으로 작성해야 한다.

## 2. 프로젝트 아키텍처 및 디렉토리 구조
Expo Router 기반 파일 시스템 라우팅 + 기능별(Feature-based) 도메인 구조. 코드/파일 경로는 반드시 아래 구조를 기반으로 지정한다.
- `app/(app)/_layout.tsx` — 루트 스택 네비게이션
- `app/(app)/(tabs)/` — 하단 탭 그룹 (`index.tsx`가 홈 화면/진입점)
- `app/(app)/course/` — 승차권 예매 프로세스 스택 플로우
- `src/features/course/` — 예매 기능 관련 전역 상태(Zustand `store.ts`) 및 전역 컴포넌트 관리 영역
- `src/utils/responsive.ts` — 반응형 함수(`scale`, `verticalScale`, `moderateScale`)

## 3. 스타일링 핵심 규칙 (반응형 함수 + className 혼용)
갤럭시 A24 1대로만 테스트하지만 전 세계 안드로이드 기기에서 레이아웃이 유연하게 유지되어야 한다. 이를 위해 **NativeWind v4(`className`)와 반응형 함수가 적용된 인라인 `style`을 반드시 혼용**한다.

- **디자인 기준 사이즈:** 가로 **360px**, 세로 **800px**
- **반응형 유틸 import:** `import { scale, verticalScale, moderateScale } from '@/src/utils/responsive';`
- **역할 분담:**
  1. `className` (정적 레이아웃 및 테마): Flex 정렬(`flex-row`, `items-center`, `justify-between`), 배경색(`bg-gray-100`), 단순 텍스트 컬러 등 기기 크기와 무관한 속성.
  2. 인라인 `style` (동적 크기·반응형): 가로 너비/좌우 마진·패딩 → `scale(값)`, 순수 세로 높이/상하 마진·패딩 → `verticalScale(값)`, 폰트 크기 및 아이콘 크기·내부 완충 패딩 → `moderateScale(값)`.

### 올바른 스타일 적용 예시
```tsx
<View
  className="flex-row items-center justify-between bg-gray-200"
  style={{ width: scale(350), height: verticalScale(60), paddingHorizontal: scale(16) }}
>
  <Text className="font-bold text-gray-800" style={{ fontSize: moderateScale(16) }}>
    텍스트
  </Text>
</View>
```

## 4. 안드로이드 전용 보강
- 카드 등 입체감이 필요한 곳은 NativeWind `shadow-*`가 안드로이드에서 흐릿하므로 인라인 `style={{ elevation: n, shadowColor: '#000' }}`를 결합한다.
