import { Colors } from "@/constants/Colors";
import { usePremium } from "@/context/PremiumContext";
import { usePaywall } from "@/hooks/usePaywall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
const { width } = Dimensions.get("window");
// Дані для кожного кроку онбордингу
const onboardingData = [
  {
    id: "1",
    image: require("../assets/images/onboarding-1.png"),
    title1Key: "onboarding_slide_1_title1",
    title2Key: "onboarding_slide_1_title2",
    descriptionKey: "onboarding_slide_1_description",
  },
  {
    id: "2",
    image: require("../assets/images/onboarding-2.png"),
    title1Key: "onboarding_slide_2_title1",
    title2Key: "onboarding_slide_2_title2",
    descriptionKey: "onboarding_slide_2_description",
  },
  {
    id: "3",
    image: require("../assets/images/onboarding-3.png"),
    title1Key: "onboarding_slide_3_title1",
    title2Key: "onboarding_slide_3_title2",
    descriptionKey: "onboarding_slide_3_description",
  },
];
const OnboardingScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef<FlatList>(null);
  const { presentPaywall } = usePaywall();
  const { isPremium } = usePremium();

  // Функція для оновлення індексу активного слайда
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  // Конфігурація для відстеження видимості
  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleContinue = async () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      if (isPremium) {
        router.replace("/(tabs)");
        return;
      } // Якщо дані ще завантажуються, нічого не робимо
      try {
        await AsyncStorage.setItem("hasCompletedOnboarding", "true");
        await presentPaywall({
          onSuccess: () => {
            router.replace("/(tabs)");
          },
          onDismiss: () => {
            console.log(
              "Onboarding: Paywall закрито, перехід на головний екран."
            );
            router.replace("/(tabs)");
          },
        });
      } catch (error) {
        console.error("Failed to save onboarding status", error);
      }
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Список слайдів */}
      <FlatList
        ref={slidesRef}
        data={onboardingData}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled // Включає "прилипання" слайдів до країв екрану
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="contain"
            />

            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {t(item.title1Key)}
                {"\n"}
                <Text style={styles.titleAccent}>{t(item.title2Key)}</Text>
              </Text>
              <Text style={styles.description}>{t(item.descriptionKey)}</Text>
            </View>
          </View>
        )}
      />

      {/* Пагінація (крапки) */}
      <View style={styles.pagination}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index && styles.dotActive]}
          />
        ))}
      </View>

      {/* Кнопка "Продовжити" */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>{t("continue_button")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7F6",
    alignItems: "center",
  },
  slide: {
    width: width,
    alignItems: "center",
    paddingTop: "20%",
  },

  image: {
    width: "60%",
    height: "60%",
  },
  textContainer: {
    marginTop: 50,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
  },
  titleAccent: {
    color: Colors.light.tint, // Ваш основний колір
  },
  description: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  pagination: {
    flexDirection: "row",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.light.tint,
    width: 16,
  },
  button: {
    backgroundColor: Colors.light.tint,
    width: "85%",
    paddingVertical: 16,
    borderRadius: 9999, // Робить кнопку повністю заокругленою
    alignItems: "center",
    marginVertical: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default OnboardingScreen;
