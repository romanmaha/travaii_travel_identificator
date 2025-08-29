import { Colors } from "@/constants/Colors";
import { usePremium } from "@/context/PremiumContext";
import { usePaywall } from "@/hooks/usePaywall";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ КРОК 1: Створюємо масив з усіма іконками для "Key Features"
const featureIcons = [
  require("../../assets/icons/feature_icon_1.png"),
  require("../../assets/icons/feature_icon_2.png"),
  require("../../assets/icons/feature_icon_3.png"),
];

const StyleDetailScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { presentPaywall } = usePaywall();
  const { isPremium } = usePremium();
  const { styleData, confidence } = useLocalSearchParams<{
    styleData: string;
    confidence?: string;
  }>();

  // Логіка для нормалізації даних
  const getNormalizedStyleInfo = () => {
    if (!styleData) return null;

    const parsedData = JSON.parse(styleData);

    // Якщо структура вже правильна, повертаємо як є
    if (parsedData.data) {
      return parsedData;
    }

    // Якщо структура "пласка", створюємо вкладений об'єкт 'data' вручну
    if (parsedData.styleHeader) {
      return {
        ...parsedData,
        data: {
          styleHeader: parsedData.styleHeader,
          heroImage: parsedData.heroImage,
          keyFeatures: parsedData.keyFeatures,
          examples: parsedData.examples,
          description: parsedData.description,
        },
      };
    }

    return null; // На випадок невідомої структури
  };

  const styleInfo = getNormalizedStyleInfo();

  // Перевірка, чи дані існують і мають правильну структуру
  if (!styleInfo || !styleInfo.data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Style data is incomplete or not found!</Text>
      </SafeAreaView>
    );
  }

  // Тепер 'data' гарантовано існує
  const { data } = styleInfo;

  const handleAskArchAI = () => {
    if (!isPremium) {
      presentPaywall();
      return;
    }
    const chatContextData = {
      title: data.styleHeader,
      style: styleInfo.name,
      heroImage: data.heroImage,
    };

    router.push({
      pathname: "/chat",
      params: {
        data: JSON.stringify(chatContextData),
        // ✅ ДОДАЙТЕ ЦЕЙ РЯДОК, ЩОБ ВКАЗАТИ КОНТЕКСТ
        chatContext: "style",
      },
    });
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: data.styleHeader, // Встановлюємо заголовок екрана
          headerBackTitle: "Home", // Встановлюємо текст кнопки "Назад"
          headerTitleAlign: "center",
          headerTintColor: Colors.light.tint,
          headerTitleStyle: {
            fontWeight: "400",
            color: "#374151",
          },
        }}
      />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        {confidence && (
          <View style={styles.header}>
            <Text style={styles.title}>{data.styleHeader}</Text>

            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>
                {confidence}% {t("match")}
              </Text>
            </View>
          </View>
        )}

        <Image source={{ uri: data.heroImage }} style={styles.heroImage} />

        {/* === Ключові особливості (з динамічними PNG іконками) === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("key_features")}</Text>
          {data.keyFeatures.map((feature: string, index: number) => (
            <View key={index} style={styles.featureItem}>
              {/* ✅ КРОК 2: Використовуємо індекс для вибору іконки з масиву */}
              <Image
                // Використовуємо оператор % (залишок від ділення) на випадок,
                // якщо особливостей буде більше, ніж іконок, щоб уникнути помилки.
                source={featureIcons[index % featureIcons.length]}
                style={styles.icon}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* ... решта коду залишається без змін ... */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("examples")}</Text>
          <FlatList
            data={data.examples}
            keyExtractor={(item) => item.name}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20 }}
            renderItem={({ item }) => (
              <View style={styles.exampleCard}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.exampleImage}
                />
                <View style={styles.exampleInfo}>
                  <Text style={styles.exampleName}>{item.name}</Text>
                  <View style={styles.locationRow}>
                    <Image
                      source={require("../../assets/icons/location.png")}
                      style={styles.smallIcon}
                    />
                    <Text style={styles.exampleLocation}>{item.location}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Image
                      source={require("../../assets/icons/calendar.png")}
                      style={styles.smallIcon}
                    />
                    <Text style={styles.exampleLocation}>{item.year}</Text>
                  </View>
                </View>
              </View>
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.descriptionText}>{data.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleAskArchAI}>
          <Text style={styles.actionButtonText}>
            {t("ask_ai_guide_about_this_style")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ... стилі залишаються такими ж ...
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
  },
  heroImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    flex: 1,
  },
  matchBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "semibold",
    marginBottom: 12,
    color: "#000000",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#374151",
  },
  exampleCard: {
    width: 220,
    marginRight: 16,
    backgroundColor: "#F4F7F6",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  exampleImage: {
    width: "100%",
    height: 120,
  },
  exampleInfo: {
    padding: 12,
  },
  exampleName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  exampleLocation: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  actionButton: {
    backgroundColor: "#47C2BD",
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "medium",
  },
  icon: {
    width: 24,
    height: 24,
  },
  smallIcon: {
    width: 14,
    height: 14,
    tintColor: "#8E8E8E",
  },
});

export default StyleDetailScreen;
