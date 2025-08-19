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
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  return (
    <TouchableOpacity
      onPress={() => {
        router.push({
          pathname: "/details/[id]",
          params: {
            id: item.id,
            styleData: JSON.stringify(item),
          },
        });
      }}>
      <View style={styles.styleCard}>
        <Image source={{ uri: item.preview }} style={styles.styleCardImage} />
        <Text style={styles.styleCardText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );
});

const HomeScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  // === СТАН (STATE) ===
  const [locationText, setLocationText] = useState("Loading location...");
  // Починаємо з порожнього масиву для історії
  const [scanningHistory, setScanningHistory] = useState<HistoryItem[]>([]);
  const [stylesData, setStylesData] = useState<StyleItem[] | null>(null);
  const [loadingStyles, setLoadingStyles] = useState(true);
  // ✅ 3. Використовуємо useFocusEffect для завантаження історії
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const response = await fetch(
          "https://archai.darkcraft.space/architectural_styles_full.json"
        );
        const json = await response.json();
        setStylesData(json);
      } catch (error) {
        console.error("Failed to fetch architectural styles:", error);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchStyles();
  }, []);

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
        setLocationText("Permission to access location was denied");
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
        setLocationText("Location not found");
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
              Loading styles...
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
