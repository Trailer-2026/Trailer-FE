import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "trailer-app",
  slug: "trailer-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "trailerapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.trailer.app",
  },
  android: {
    package: "com.trailer.app",
    adaptiveIcon: {
      // 브랜드 블루 — 로고 시안(Figma '로고' 프레임)의 배경색과 같은 값.
      // 배경은 단색이라 이미지 대신 색만 준다(backgroundImage 없음).
      backgroundColor: "#5E84F4",
      // 흰 마크만 담긴 투명 PNG. 안드로이드가 원형/스퀘어클로 안쪽 66% 만 남기므로
      // 마크를 캔버스의 45% 크기로 가운데 두어 어떤 마스크에서도 안 잘리게 했다.
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    googleServicesFile: "./google-services.json",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-video",
    [
      "expo-splash-screen",
      {
        // 로고 마크(흰색)만 담긴 투명 PNG. 배경은 아래 backgroundColor 가 칠한다.
        // 예전에는 'TR' 워드마크를 썼지만 지금 로고는 가로로 길어서, 원형 마스크에
        // 들어가는 마크 한 글자만 쓴다(Figma '로고' 프레임에서 추출).
        image: "./assets/images/splash-entry.png",
        // Android 12+ 는 스플래시 아이콘을 원형으로 마스킹한다(288dp 캔버스의 안쪽 2/3=192dp 만 보임).
        // 이미지 안에서 마크가 이미 70% 로 들어가 있어 여기서는 캔버스 크기만 맞춘다.
        imageWidth: 190,
        resizeMode: "contain",
        // 앱 진입 버퍼링 화면 색.
        backgroundColor: "#5E84F4",
        dark: {
          backgroundColor: "#5E84F4",
        },
      },
    ],
    "expo-secure-store",
    [
      "expo-image-picker",
      {
        // 릴스 영상 만들기 — 갤러리에서 사진/영상 선택 + 직접 촬영
        photosPermission: "여행 영상을 만들 사진과 영상을 선택하려면 갤러리 접근이 필요해요.",
        cameraPermission: "여행 영상을 만들 사진·영상을 촬영하려면 카메라 접근이 필요해요.",
      },
    ],
    [
      "expo-media-library",
      {
        // 갤러리 사진의 원본 위치(EXIF GPS)를 읽으려면 접근 권한 + 위치 메타데이터 권한이 필요.
        // 안드로이드 시스템 피커는 위치를 지우고 넘기므로, 여기서 원본 asset 을 다시 조회한다.
        photosPermission: "촬영 위치를 함께 기록하려면 사진 접근 권한이 필요해요.",
        savePhotosPermission: "촬영한 사진을 갤러리에 저장하려면 권한이 필요해요.",
        isAccessMediaLocationEnabled: true, // → ACCESS_MEDIA_LOCATION 권한 추가
      },
    ],
    [
      "expo-location",
      {
        // 직접 촬영 시 현재 위치를 함께 기록
        locationWhenInUsePermission: "촬영하는 사진에 여행 위치를 기록하려면 위치 접근이 필요해요.",
      },
    ],
    [
      "@react-native-kakao/core",
      {
        nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? "",
        android: {
          authCodeHandlerActivity: true,
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          extraMavenRepos: ["https://devrepo.kakao.com/nexus/content/groups/public/"],
          // 추천 API 응답의 place/lodging image_url 이 http:// 스킴으로 오는 경우가 많아
          // 안드로이드 cleartext 차단을 풀어준다. 실패해도 RemoteImage 가 placeholder 로 대체.
          //
          // ⚠️ 이건 모든 도메인에 평문 HTTP 를 허용한다(감사 A7). 이미지 URL 은 이제
          // utils/url.ts 의 toHttps 로 https 로 올려 요청하므로, 실기기에서 관광지·
          // 숙소 이미지가 정상적으로 뜨는 것을 확인하면 이 옵션을 지워야 한다.
          // expo-build-properties 에는 networkSecurityConfig 옵션이 없어서
          // 도메인 allowlist 를 쓰려면 별도 config plugin 을 만들어야 한다.
          usesCleartextTraffic: true,
        },
      },
    ],
    "@react-native-firebase/app",
  ],
  experiments: {
    typedRoutes: true,
    // React Compiler 는 빌드 때만 켠다. 개발(expo start)에선 babel 변환 비용 때문에
    // 첫 번들이 느려져서 끈다. expo start → NODE_ENV=development(off),
    // expo export·EAS build → NODE_ENV=production(on).
    reactCompiler:
      process.env.NODE_ENV === "production" ||
      process.env.EAS_BUILD === "true",
  },
});
