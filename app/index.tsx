import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

const StartPage = () => {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem(
          "hasCompletedOnboarding"
        );

        if (hasCompletedOnboarding === "true") {
          // Якщо онбординг пройдено, переходимо до табів
          router.replace("/(tabs)");
        } else {
          // Інакше, показуємо онбординг
          router.replace("/onboarding");
        }
      } catch (error) {
        // У разі помилки, за замовчуванням показуємо онбординг
        console.error("Failed to check onboarding status", error);
        router.replace("/onboarding");
      }
    };

    checkOnboarding();
  }, []);

  // Поки йде перевірка, можна показувати індикатор завантаження
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default StartPage;
