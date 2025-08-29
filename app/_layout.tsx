import { API_KEYS } from "@/constants";
import { PremiumProvider } from "@/context/PremiumContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import i18n from "@/services/localization/i18n";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { useCallback, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { Platform, View } from "react-native";
import mobileAds from "react-native-google-mobile-ads";
import Purchases from "react-native-purchases";
import "react-native-reanimated";
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  useEffect(() => {
    // Вмикаємо логування для дебагу
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

    // Налаштовуємо SDK
    if (Platform.OS === "ios") {
      Purchases.configure({ apiKey: API_KEYS.apple });
    } else if (Platform.OS === "android") {
      Purchases.configure({ apiKey: API_KEYS.google });
    }
  }, []);
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Спочатку запитуємо дозвіл на відстеження (покаже pop-up на iOS)
        await requestTrackingPermissionsAsync();

        // Потім ініціалізуємо рекламний SDK
        const adapterStatuses = await mobileAds().initialize();
        console.log("Mobile Ads Initialized:", adapterStatuses);
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initializeApp();
  }, []);

  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Ця функція буде викликана, коли RootLayout буде готовий до відображення
  const onLayoutRootView = useCallback(async () => {
    if (loaded) {
      // Ховаємо сплеш-скрін, тільки коли шрифти завантажені
      await SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Якщо шрифти ще не завантажені, нічого не показуємо (сплеш-скрін активний)
  if (!loaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <I18nextProvider i18n={i18n}>
        <PremiumProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  headerBackButtonDisplayMode: "minimal",
                }}
              />
              <Stack.Screen name="preview" options={{ headerShown: false }} />

              <Stack.Screen
                name="chat"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PremiumProvider>
      </I18nextProvider>
    </View>
  );
}
