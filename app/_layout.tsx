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
import { StatusBar } from "expo-status-bar";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import mobileAds from "react-native-google-mobile-ads";
import "react-native-reanimated";

export default function RootLayout() {
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
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <PremiumProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
  );
}
