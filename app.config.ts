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
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
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
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        // 앱 진입 버퍼링 화면 색.
        backgroundColor: "#7292EE",
        dark: {
          backgroundColor: "#7292EE",
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
