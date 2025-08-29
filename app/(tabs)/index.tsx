import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
// Імпортуємо дані для популярних стилів
import { Colors } from "@/constants/Colors"; // Імпортуємо ваші кольори
import { usePremium } from "@/context/PremiumContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useInterstitialAd,
} from "react-native-google-mobile-ads";

// Типізація для елементів з JSON (добра практика)
type StyleItem = {
  id: string;
  name: string;
  preview: string;
  confidence?: number;
  data?: {
    styleHeader: string;
    heroImage: string;
    keyFeatures: string[];
    description: string;
    examples: {
      name: string;
      location: string;
      year: string;
      image: string;
    }[];
  };
};

// Тип для елемента історії
type HistoryItem = {
  id: string;
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

const StyleCard = React.memo(({ item }: { item: StyleItem }) => {
  const router = useRouter();
  const { isLoaded, isClosed, load, show } = useInterstitialAd(
    TestIds.INTERSTITIAL,
    {
      requestNonPersonalizedAdsOnly: true,
    }
  );

  // ✅ 1. Створюємо стан для відкладеної навігації
  const [navigateTo, setNavigateTo] = useState<StyleItem | null>(null);

  // Завантажуємо рекламу при монтуванні або після її закриття
  useEffect(() => {
    load();
  }, [load, isClosed]);

  // ✅ 2. Створюємо ефект, який спрацює ПІСЛЯ закриття реклами
  useEffect(() => {
    // Якщо рекламу було закрито І ми маємо куди переходити
    if (isClosed && navigateTo) {
      router.push({
        pathname: "/details/[id]",
        params: {
          id: navigateTo.id,
          styleData: JSON.stringify(navigateTo),
        },
      });
      // Важливо: скидаємо стан, щоб уникнути повторної навігації
      setNavigateTo(null);
    }
  }, [isClosed, navigateTo, router]);

  const handlePress = () => {
    if (isLoaded) {
      // ✅ 3. НЕ переходимо одразу. Замість цього, зберігаємо дані
      //    для майбутнього переходу і показуємо рекламу.
      setNavigateTo(item);
      show();
    } else {
      // Якщо реклама не завантажена, переходимо одразу
      router.push({
        pathname: "/details/[id]",
        params: {
          id: item.id,
          styleData: JSON.stringify(item),
        },
      });
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.styleCard}>
        <Image source={{ uri: item.preview }} style={styles.styleCardImage} />
        <Text style={styles.styleCardText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );
});
const HomeScreen = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  // === СТАН (STATE) ===
  const [locationText, setLocationText] = useState(t("loading_location"));
  // Починаємо з порожнього масиву для історії
  const [scanningHistory, setScanningHistory] = useState<HistoryItem[]>([]);
  const [stylesData, setStylesData] = useState<StyleItem[] | null>(null);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const { isPremium } = usePremium();

  useEffect(() => {
    const fetchStyles = async () => {
      // ✅ 2. Визначаємо мову та базовий URL
      const langCode = i18n.language.split("-")[0]; // Отримуємо 'uk' з 'uk-UA'
      const baseUrl =
        "https://archai.darkcraft.space/architectural_styles_full";

      const primaryUrl = `${baseUrl}_${langCode}.json`; // напр., ..._uk.json
      const fallbackUrl = `${baseUrl}_en.json`; // Завжди маємо запасний варіант

      try {
        setLoadingStyles(true);
        let finalData;

        // ✅ 3. Спочатку намагаємось завантажити файл для поточної мови
        const response = await fetch(primaryUrl);

        if (response.ok) {
          // Якщо файл знайдено і все добре
          finalData = await response.json();
        } else {
          // Якщо файл не знайдено (помилка 404) або інша помилка,
          // пробуємо завантажити англійську версію
          console.warn(
            `Style file for '${langCode}' not found. Falling back to English.`
          );
          const fallbackResponse = await fetch(fallbackUrl);
          finalData = await fallbackResponse.json();
        }

        setStylesData(finalData);
      } catch (error) {
        console.error("Failed to fetch architectural styles:", error);
        // Можна спробувати завантажити англійську версію і тут, на випадок збою мережі
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchStyles();
  }, [i18n.language]);

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        try {
          const historyString = await AsyncStorage.getItem("scanningHistory");
          if (historyString) {
            const fullHistory = JSON.parse(historyString);
            // ✅ Якщо історія є, встановлюємо її
            setScanningHistory(fullHistory.slice(0, 2));
          } else {
            // ✅ Якщо історії немає (historyString === null),
            //    явно очищуємо стан. Це і є виправлення.
            setScanningHistory([]);
          }
        } catch (error) {
          console.error("Failed to load history:", error);
          // У випадку помилки теж очищуємо, щоб не показувати старі дані
          setScanningHistory([]);
        }
      };

      loadHistory();
    }, [])
  );

  // === ЕФЕКТИ (EFFECTS) ===
  // Ефект для отримання локації при завантаженні екрану
  useEffect(() => {
    (async () => {
      // Запитуємо дозвіл на використання геолокації
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText(t("permission_denied"));
        return;
      }

      // Отримуємо поточну позицію
      let location = await Location.getCurrentPositionAsync({});
      // Конвертуємо координати в адресу (реверсивне геокодування)
      let address = await Location.reverseGeocodeAsync(location.coords);

      if (address && address.length > 0) {
        const { city, country } = address[0];
        setLocationText(`${city}, ${country}`);
      } else {
        setLocationText(t("location_not_found"));
      }
    })();
  }, []);

  // Компонент для відображення картки популярного стилю
  const renderStyleCard = useCallback(
    ({ item }: { item: StyleItem }) => <StyleCard item={item} />,
    []
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* === Заголовок === */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("hello")}</Text>
          <View style={styles.locationContainer}>
            <Image
              source={require("../../assets/icons/location.png")}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText}>{locationText}</Text>
          </View>
        </View>

        {/* === Кнопка сканування === */}
        <View style={styles.scanSection}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => {
              // Тут ви можете додати логіку для переходу на екран сканування
              router.push("/scan");
            }}>
            <Image
              source={require("../../assets/icons/scan.png")}
              style={styles.scanIcon}
            />
          </TouchableOpacity>
          <Text style={styles.scanButtonText}>{t("scan_landmark")}</Text>
        </View>

        {/* === Популярні стилі === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("popular_styles")}</Text>
          {loadingStyles ? (
            <Text style={{ marginLeft: 20, color: "#888" }}>
              {t("loading_styles")}
            </Text>
          ) : (
            <FlatList
              data={stylesData || []}
              renderItem={renderStyleCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20 }}
            />
          )}
        </View>

        {/* === Історія сканування (УМОВНИЙ РЕНДЕРИНГ) === */}
        {/* Цей блок буде показано тільки якщо scanningHistory не порожній */}
        {scanningHistory.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("scanning_history")}</Text>
            <View style={styles.historyContainer}>
              {/* ✅ 4. Відображаємо реальну історію */}
              {scanningHistory.slice(0, 2).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    // Передаємо всі дані про збережений елемент на екран результатів
                    router.push({
                      pathname: "/ai-result",
                      params: { data: JSON.stringify(item) },
                    });
                  }}>
                  <View style={styles.historyCard}>
                    <Image
                      source={{ uri: item.heroImage }} // Використовуємо локальний URI
                      style={styles.historyImage}
                    />
                    <View style={styles.historyTextContainer}>
                      <Text style={styles.historyStyleText}>{item.title}</Text>
                      <Text style={styles.historyNameText} numberOfLines={1}>
                        {item.style}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <Image
            style={styles.noHistoryImage}
            source={require("../../assets/images/no_history.png")}
          />
        )}
      </ScrollView>
      {!isPremium && (
        <BannerAd
          unitId={TestIds.BANNER} // Замініть на ваш реальний ID рекламного блоку
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            networkExtras: {
              collapsible: "bottom",
            },
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

// --- СТИЛІ (залишились без змін) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7F6",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "400",
    color: `#1A1A1A`,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  locationIcon: {
    width: 16,
    height: 16,
    tintColor: "#666666",
    marginRight: 6, // Додано відступ
  },
  noHistoryImage: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginTop: 50,
  },
  locationText: {
    fontSize: 14,
    color: "#666666",
  },
  scanSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  scanButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  scanIcon: {
    width: 60,
    height: 60,
    tintColor: "white",
  },
  scanButtonText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "400",
    color: "#1A1A1A",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#1A1A1A",
    marginLeft: 20,
    marginBottom: 16,
  },
  styleCard: {
    width: 130,
    height: 130,
    borderRadius: 16,
    backgroundColor: "white",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  styleCardImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  styleCardText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: Colors.light.text,
  },
  historyContainer: {
    paddingHorizontal: 20,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  historyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  historyTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  historyStyleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  historyNameText: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 4,
  },
});
