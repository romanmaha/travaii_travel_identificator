import { ADMOB_INTERSTITIAL_ID, GOOGLE_GEMINI_API_KEY } from "@/constants";
import { Colors } from "@/constants/Colors";
import { usePremium } from "@/context/PremiumContext"; // ✅ 1. Імпортуємо хук
import { getAnalyzeImagePrompt } from "@/helpers/analyzeImageWithGeminiPrompt";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator"; // ✅ 1. Імпортуємо маніпулятор
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useInterstitialAd } from "react-native-google-mobile-ads";

const MAX_RETRIES = 3;

export default function PreviewScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { decrementScans } = usePremium(); // ✅ 2. Отримуємо функцію
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [landmarkResult, setLandmarkResult] = useState<any | null>(null);
  const { isLoaded, isClosed, load, show } = useInterstitialAd(
    ADMOB_INTERSTITIAL_ID
  );
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission not granted");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }
    console.log(location);
    getCurrentLocation();
  }, []);
  const navigateToResult = (data: any) => {
    decrementScans();
    router.replace({
      pathname: `/ai-result`,
      params: {
        data: JSON.stringify(data),
        confidence: data.confidence?.toString() || "N/A",
      },
    });
  };

  // ✅ Цей ефект спрацює, коли ми отримаємо результат аналізу
  useEffect(() => {
    if (landmarkResult) {
      // Якщо результат є, перевіряємо, чи завантажена реклама
      if (isLoaded) {
        show(); // Показуємо рекламу
      } else {
        // Якщо реклама не завантажилась, переходимо одразу
        navigateToResult(landmarkResult);
      }
    }
  }, [landmarkResult, isLoaded]);

  // ✅ Цей ефект спрацює, коли користувач закриє рекламу
  useEffect(() => {
    if (isClosed && landmarkResult) {
      // Якщо рекламу було закрито і в нас є результат для переходу
      navigateToResult(landmarkResult);
    }
  }, [isClosed, landmarkResult]);
  if (!uri) {
    router.back();
    return null;
  }

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const analyzeImageWithGemini = async () => {
    setIsAnalyzing(true);
    if (isLoaded && isAnalyzing) {
      show();
    }
    try {
      // ✅ 2. Стискаємо зображення перед відправкою
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // Змінюємо розмір до 800px по ширині
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const base64ImageData = await FileSystem.readAsStringAsync(
        manipulatedImage.uri,
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );
      const currentLanguage = i18n.language; // Наприклад, "es", "de", "fr"
      const locationParam = location
        ? {
            latitude: location.coords.latitude.toString(),
            longitude: location.coords.longitude.toString(),
          }
        : undefined;
      const dynamicPrompt = getAnalyzeImagePrompt(
        currentLanguage,
        locationParam
      );
      const requestBody = {
        contents: [
          {
            parts: [
              { text: dynamicPrompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64ImageData,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      };

      let responseData;
      for (let i = 0; i < MAX_RETRIES; i++) {
        // ✅ 3. Змінено модель на gemini-2.5-flash
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          responseData = await response.json();
          break;
        }

        if (response.status === 503 && i < MAX_RETRIES - 1) {
          const delay = Math.pow(2, i) * 1000;
          console.log(`Model is overloaded. Retrying in ${delay}ms...`);
          await sleep(delay);
        } else {
          responseData = await response.json();
        }
      }

      if (
        responseData &&
        responseData.candidates &&
        responseData.candidates.length > 0
      ) {
        const jsonString = responseData.candidates[0].content.parts[0].text;
        const landmarkData = JSON.parse(jsonString);
        const confidenceThreshold = 30; // Встановіть поріг впевненості (напр., 30%)

        if (
          landmarkData.objectType === "Other" ||
          landmarkData.confidence < confidenceThreshold
        ) {
          // Якщо AI вважає, що це "Інше" АБО впевненість занадто низька
          setIsAnalyzing(false); // Зупиняємо індикатор завантаження
          Alert.alert(
            t("identification_failed_title"),
            t("identification_failed_message")
          );
          return; // Зупиняємо виконання функції і не переходимо далі
        }
        console.log("Gemini full response object:", landmarkData);
        landmarkData.heroImage = uri;

        decrementScans(); // ✅ 3. Зменшуємо лічильник сканів
        setLandmarkResult(landmarkData);
        // router.replace({
        //   pathname: `/ai-result`,
        //   params: {
        //     data: JSON.stringify(landmarkData),
        //     confidence: landmarkData.confidence?.toString() || "N/A",
        //   },
        // });
      } else {
        console.error("Invalid response from Gemini:", responseData);
        const errorMessage =
          responseData?.error?.message ||
          "Could not get a valid response from the AI model. Please try again.";
        Alert.alert("Analysis Failed", errorMessage);
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      Alert.alert("Error", "An error occurred while analyzing the image.");
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image source={{ uri }} style={styles.previewImage} />

      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}> {t("analyzing")}</Text>
        </View>
      )}

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image
              source={require("../assets/icons/close.png")}
              style={styles.iconClose}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.footerButton}>
            <Text style={styles.footerButtonText}>{t("retake")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={analyzeImageWithGemini}
            style={[styles.footerButton, styles.usePhotoButton]}
            disabled={isAnalyzing}>
            <Text style={[styles.footerButtonText, styles.usePhotoButtonText]}>
              {t("use_photo")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  previewImage: {
    flex: 1,
    resizeMode: "contain",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    alignItems: "flex-end",
  },
  iconClose: {
    width: 40,
    height: 40,
    tintColor: "white",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  footerButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  footerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  usePhotoButton: {
    backgroundColor: Colors.light.tint,
  },
  usePhotoButtonText: {
    color: "white",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 16,
    fontSize: 18,
  },
});
