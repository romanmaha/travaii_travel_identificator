import { Colors } from "@/constants/Colors";
import { usePremium } from "@/context/PremiumContext"; // ✅ 1. Імпортуємо хук
import { usePaywall } from "@/hooks/usePaywall";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

// Тип для даних, що приходять від Gemini
type LandmarkData = {
  title: string;
  location: string;
  confidence: number;
  established: string;
  style: string;
  about: string;
  architect?: string;
  height?: string;
  material?: string;
  status?: string;
  quote?: {
    text: string;
    source: string;
  };
  interestingFacts?: string[];
  heroImage?: string;
};

// --- Допоміжні компоненти ---
const InfoRow = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const ActionButton = ({
  icon,
  label,
  onPress,
  isActive = false,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  isActive?: boolean;
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Image
      source={icon}
      style={[styles.actionIcon, isActive && styles.actionIconActive]}
    />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

// --- Основний компонент екрану ---
export default function AiResultScreen() {
  const { t, i18n } = useTranslation();
  const { isPremium } = usePremium(); // ✅ 2. Отримуємо статус преміум
  const { presentPaywall } = usePaywall();
  const handleGetPremium = () => {
    // ✅ Передаємо іншу логіку навігації
    presentPaywall({
      onSuccess: (customerInfo) => {
        console.log(
          "Settings: Покупка успішна!",
          customerInfo.entitlements.active
        );
        // Наприклад, показуємо сповіщення

        // Навігацію не робимо, залишаємось тут
      },
      onDismiss: () => {
        console.log("Settings: Paywall закрито, залишаємось на екрані.");
        // Нічого не робимо
      },
    });
  };
  const { data: dataString, confidence } = useLocalSearchParams<{
    data: string;
    confidence?: string;
  }>();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  useEffect(() => {
    // Функція для завантаження голосів
    const getVoices = async () => {
      const voices = await Speech.getAvailableVoicesAsync();
      setAvailableVoices(voices);
    };

    getVoices();
    return () => {
      // Зупиняємо будь-яке відтворення, яке могло залишитись
      Speech.stop();
    };
  }, []);

  const handleListen = async () => {
    // ✅ 1. Отримуємо поточну мову з i18next

    const currentLanguage = i18n.language;

    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    // ✅ 2. Формуємо текст для озвучення з перекладених частин
    const textToSpeak = `
      ${t("speech_about_title", { title: displayData.title })}
      ${displayData.about}
      ${t("speech_interesting_facts")}
      ${displayData.interestingFacts?.join(". ")}
    `;

    // ❌ Ми більше не шукаємо голоси "Alex" чи "Samantha" вручну.
    // Це ненадійно і працює тільки для англійської.

    // ✅ 3. Запускаємо озвучку, передаючи код поточної мови.
    // Система сама вибере найкращий доступний голос для цієї мови.
    Speech.speak(textToSpeak, {
      language: currentLanguage, // Наприклад, "uk", "es", "de"
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onError: (error) => {
        console.error(
          `expo-speech error for lang "${currentLanguage}":`,
          error
        );
        setIsSpeaking(false);
      },
      onStopped: () => setIsSpeaking(false),
    });
  };

  const landmarkData: LandmarkData | null = useMemo(() => {
    if (!dataString) return null;
    try {
      return JSON.parse(dataString);
    } catch (e) {
      console.error("Failed to parse landmark data:", e);
      return null;
    }
  }, [dataString]);

  if (!landmarkData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>{t("error_could_not_load_landmark_data")}</Text>
      </SafeAreaView>
    );
  }

  const displayData = landmarkData;
  const router = useRouter();
  const handleShare = async () => {
    try {
      const message = `Check out this amazing landmark I found with ArchAI: ${displayData.title} in ${displayData.location}!\n\nAbout: ${displayData.about}`;

      await Share.share({
        message,
        title: `Discover ${displayData.title}`, // Опціонально для деяких платформ
      });
    } catch (error: any) {
      console.log(error);
    }
  };

  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        const historyString = await AsyncStorage.getItem("scanningHistory");
        if (historyString) {
          const history = JSON.parse(historyString);
          // Перевіряємо, чи існує елемент з таким самим title в історії
          const found = history.some(
            (item: any) => item.title === displayData.title
          );
          setIsSaved(found);
        } else {
          setIsSaved(false);
        }
      } catch (error) {
        console.error("Failed to check history:", error);
        setIsSaved(false); // На випадок помилки
      }
    };

    checkIfSaved();
  }, [displayData]);
  const handleToggleSave = async () => {
    // --- Логіка видалення ---
    if (isSaved) {
      Alert.alert(
        t("alert_remove_title"), // ✅
        t("alert_remove_message"), // ✅
        [
          { text: t("button_cancel"), style: "cancel" }, // ✅
          {
            text: t("button_remove"), // ✅
            style: "destructive",
            onPress: async () => {
              try {
                // ✅ ДОДАЙТЕ ЦЮ ЛОГІКУ
                const historyString = await AsyncStorage.getItem(
                  "scanningHistory"
                );
                const history = historyString ? JSON.parse(historyString) : [];

                const itemToDelete = history.find(
                  (item: LandmarkData) => item.title === displayData.title
                );

                const updatedHistory = history.filter(
                  (item: LandmarkData) => item.title !== displayData.title
                );

                await AsyncStorage.setItem(
                  "scanningHistory",
                  JSON.stringify(updatedHistory)
                );

                if (itemToDelete?.heroImage) {
                  await FileSystem.deleteAsync(itemToDelete.heroImage, {
                    idempotent: true,
                  });
                }
                // КІНЕЦЬ ЛОГІКИ, ЯКУ ТРЕБА ДОДАТИ

                setIsSaved(false);
                Alert.alert(
                  t("alert_removed_success_title"),
                  t("alert_removed_success_message")
                );
              } catch (error) {
                console.error("Failed to remove from history:", error);
                Alert.alert(
                  t("alert_error_title"), // ✅
                  t("alert_remove_error_message") // ✅
                );
              }
            },
          },
        ]
      );
      return;
    }

    // --- Логіка збереження (залишається такою ж) ---
    if (!displayData.heroImage) return;

    try {
      const filename = `saved_${new Date().getTime()}.jpg`;
      const newImageUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.copyAsync({
        from: displayData.heroImage,
        to: newImageUri,
      });

      const itemToSave = {
        ...displayData,
        id: new Date().toISOString(),
        heroImage: newImageUri,
      };

      const existingHistoryString = await AsyncStorage.getItem(
        "scanningHistory"
      );
      const existingHistory = existingHistoryString
        ? JSON.parse(existingHistoryString)
        : [];
      const updatedHistory = [itemToSave, ...existingHistory];

      await AsyncStorage.setItem(
        "scanningHistory",
        JSON.stringify(updatedHistory)
      );

      setIsSaved(true);
      Alert.alert(
        t("alert_saved_success_title"),
        t("alert_saved_success_message")
      );
    } catch (error) {
      console.error("Failed to save identification:", error);
      Alert.alert(t("alert_error_title"), t("alert_save_error_message"));
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: displayData.heroImage }}
          style={styles.heroImage}
        />

        <View style={styles.contentContainer}>
          <View style={styles.headerSection}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{displayData.title}</Text>
              <View style={styles.locationRow}>
                <Image
                  source={require("../../assets/icons/location-pin.png")}
                  style={styles.locationPinIcon}
                />
                <Text style={styles.category}>{displayData.location}</Text>
              </View>
            </View>
            {confidence && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchText}>
                  {confidence}% {t("match")}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <ActionButton
              onPress={() => {
                if (!isPremium) {
                  handleGetPremium();
                  return;
                }
                handleListen();
              }}
              icon={
                isSpeaking
                  ? require("../../assets/icons/close.png")
                  : require("../../assets/icons/listen.png")
              }
              label={isSpeaking ? t("stop") : t("listen")}
            />
            <ActionButton
              icon={require("../../assets/icons/share.png")}
              label={t("share")}
              onPress={handleShare}
            />
            <ActionButton
              icon={require("../../assets/icons/save.png")}
              label={isSaved ? t("saved") : t("save")}
              onPress={handleToggleSave}
              isActive={isSaved}
            />
            <ActionButton
              icon={require("../../assets/icons/ask.png")}
              label={t("ask_ai_guide")}
              onPress={() => {
                if (!isPremium) {
                  handleGetPremium();
                  return;
                }
                router.push({
                  pathname: "/chat",
                  params: { data: JSON.stringify(displayData), confidence },
                });
              }}
            />
          </View>

          <View style={styles.infoBox}>
            <InfoRow label={t("architect")} value={displayData.architect} />
            <InfoRow label={t("year_built")} value={displayData.established} />
            <InfoRow label={t("style")} value={displayData.style} />
            <InfoRow label={t("height")} value={displayData.height} />
            <InfoRow label={t("material")} value={displayData.material} />
            <InfoRow label={t("status")} value={displayData.status} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("about")}</Text>
            <Text style={styles.aboutText}>{displayData.about}</Text>
            {!isPremium && (
              <View
                style={{
                  marginTop: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <BannerAd
                  unitId={TestIds.BANNER} // Замініть на ваш реальний ID рекламного блоку
                  size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
                  requestOptions={{
                    networkExtras: {
                      collapsible: "bottom",
                    },
                  }}
                />
              </View>
            )}
          </View>

          {displayData.quote && (
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteText}>“{displayData.quote.text}”</Text>
              <Text style={styles.quoteSource}>
                — {displayData.quote.source}
              </Text>
            </View>
          )}

          {displayData.interestingFacts &&
            displayData.interestingFacts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t("intersting_facts")}</Text>
                {displayData.interestingFacts.map((fact, index) => (
                  <View key={index} style={styles.factItem}>
                    <Text style={styles.factDot}>•</Text>
                    <Text style={styles.factText}>{fact}</Text>
                  </View>
                ))}
              </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7F6",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  safeArea: { flex: 1, backgroundColor: "#F4F7F6" },
  contentContainer: { padding: 20 },
  heroImage: { width: "100%", height: 250, resizeMode: "cover" },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // ✅ Змінено на flex-start, щоб вміст вирівнювався по верху
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1, // ✅ Дозволяє контейнеру зайняти весь доступний простір
    marginRight: 10, // ✅ Додає відступ, щоб не наповзати на бейдж
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#1A1A1A" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationPinIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: "#47C2BD",
  },
  category: { fontSize: 16, color: "#8E8E8E" },
  matchBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchText: { color: "white", fontWeight: "bold", fontSize: 14 },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionButton: { alignItems: "center" },
  actionIconActive: {
    tintColor: "#2E8581", // Можна використовувати темніший відтінок
  },
  actionLabel: { marginTop: 6, fontSize: 12, color: "#47C2BD" },
  // ✅ Новий стиль для активного тексту
  actionLabelActive: {
    color: "#2E8581",
    fontWeight: "bold",
  },
  actionIcon: { width: 24, height: 24, tintColor: "#47C2BD" },

  infoBox: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // ✅ Вирівнюємо по центру по вертикалі
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F7F6",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666666",
    marginRight: 10,
    marginLeft: 10, // ✅ Додаємо відступ
  },
  infoValue: {
    flex: 1, // ✅ Дозволяє тексту зайняти вільний простір і переноситись
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "right", // ✅ Вирівнюємо текст по правому краю
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1A1A1A",
  },
  aboutText: { fontSize: 16, lineHeight: 24, color: "#333" },
  quoteContainer: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
    paddingLeft: 16,
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#333",
    lineHeight: 24,
  },
  quoteSource: {
    fontSize: 14,
    color: "#8E8E8E",
    marginTop: 8,
    textAlign: "right",
  },
  factItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 8,
  },
  factDot: {
    fontSize: 16,
    color: "#333",
    marginRight: 8,
  },
  factText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    flex: 1,
  },
});
