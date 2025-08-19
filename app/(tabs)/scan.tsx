import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react"; // ✅ useRef додано
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator, // ✅ ActivityIndicator додано
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SnapTipsModal from "../../components/ui/SnapTipsModal"; // Імпортуємо компонент для порад
import { usePremium } from "../../context/PremiumContext";
// ✅ 1. Імпортуємо хук
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
// Розміри нашої рамки-видошукача на екрані
const VIEWFINDER_WIDTH = screenWidth * 0.9;
const VIEWFINDER_HEIGHT = screenHeight * 0.55;
export default function ScanScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { isPremium, scansLeft, isLoading } = usePremium(); // ✅ 2. Отримуємо дані з контексту
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTipsModalVisible, setTipsModalVisible] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const pickImage = async () => {
    // ✅ 2. Перевіряємо ліміт сканувань
    if (!isPremium && scansLeft <= 0) {
      Alert.alert(
        "No Scans Left",
        "You have used all your free scans. Upgrade to Premium for unlimited scans."
      );
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Тільки зображення
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      // Переходимо на екран попереднього перегляду з URI вибраного зображення
      router.push({
        pathname: "/preview",
        params: { uri: result.assets[0].uri },
      });
    }
  };

  // ✅ Оновлена функція створення фото
  const takePictureAndCrop = async () => {
    if (cameraRef.current && !isProcessing) {
      // ✅ 3. Перевіряємо ліміт сканувань
      if (!isPremium && scansLeft <= 0) {
        Alert.alert(
          "No Scans Left",
          "You have used all your free scans. Upgrade to Premium for unlimited scans."
        );
        return;
      }

      setIsProcessing(true);
      try {
        // Робимо повнокадровий знімок
        const photo = await cameraRef.current.takePictureAsync();

        if (photo) {
          // ✅ 3. Логіка обрізання зображення
          // Розраховуємо коефіцієнти для перетворення екранних координат у координати зображення
          const widthRatio = photo.width / screenWidth;
          const heightRatio = photo.height / screenHeight;

          // Розраховуємо прямокутник для обрізання
          const cropData = {
            originX: ((screenWidth - VIEWFINDER_WIDTH) / 2) * widthRatio,
            originY: ((screenHeight - VIEWFINDER_HEIGHT) / 2) * heightRatio,
            width: VIEWFINDER_WIDTH * widthRatio,
            height: VIEWFINDER_HEIGHT * heightRatio,
          };

          // Використовуємо маніпулятор для обрізання
          const croppedImage = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ crop: cropData }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );

          // Переходимо на екран попереднього перегляду з обрізаним зображенням
          router.push({
            pathname: "/preview",
            params: { uri: croppedImage.uri },
          });
        }
      } catch (error) {
        console.error("Failed to take and crop picture:", error);
        Alert.alert("Error", "Could not process the image.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // ✅ 3. Оновлена логіка перевірки дозволів
  if (!permission) {
    // Дозволи ще завантажуються
    return <View style={styles.permissionContainer} />;
  }

  if (!permission.granted) {
    // Дозволи не надано
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          {t("we_need_your_permission")}
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>
            {t("grant_permission")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef} // ✅ Додаємо ref
        style={StyleSheet.absoluteFillObject}
        facing={"back"} // ✅ 4. Використовуємо 'facing' замість 'type'
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Image
              source={require("../../assets/icons/close.png")}
              style={styles.iconClose}
            />
          </TouchableOpacity>
        </View>

        {!isPremium && (
          <View style={styles.topContent}>
            <TouchableOpacity style={styles.unlockButton}>
              <Text style={styles.unlockButtonText}>
                ✨ {t("unlock_unlimeted_scans")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.centerContent}>
          <Text style={styles.focusText}>
            {t("place_the_landmark_in_focus")}
          </Text>
          <View
            style={[
              styles.viewfinder,
              { width: VIEWFINDER_WIDTH, height: VIEWFINDER_HEIGHT },
            ]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          {/* ✅ 4. Відображаємо актуальну кількість сканів */}
          {!isPremium && (
            <Text style={styles.scansLeftText}>
              {!isPremium && `${scansLeft} ${t("free_scans_left")}`}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
            <Image
              source={require("../../assets/icons/gallery.png")}
              style={styles.iconFooter}
            />
          </TouchableOpacity>
          {/* ✅ 5. Кнопка тепер робить фото */}
          <TouchableOpacity
            style={styles.shutterButton}
            onPress={takePictureAndCrop}
            disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator size="large" color="#000000" />
            ) : (
              <View style={styles.shutterInnerButton} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setTipsModalVisible(true)}>
            <Image
              source={require("../../assets/icons/flashlight.png")}
              style={styles.iconFooter}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <SnapTipsModal
        visible={isTipsModalVisible}
        onClose={() => setTipsModalVisible(false)}
      />
    </View>
  );
}

// --- СТИЛІ ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    alignItems: "flex-end",
  },
  topContent: {
    alignItems: "center",
    marginTop: -20,
  },
  unlockButton: {
    flexDirection: "row",
    backgroundColor: "rgba(35 , 202, 182, 0.70)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  unlockButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  focusText: {
    color: "white",
    fontSize: 16,
    marginBottom: 24,
  },
  viewfinder: {
    width: 350,
    height: 420,
    position: "relative",
  },
  corner: {
    width: 60,
    height: 60,
    borderColor: "white",
    position: "absolute",
  },
  topLeft: {
    borderTopWidth: 5,
    borderLeftWidth: 5,
    top: 0,
    left: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    borderTopWidth: 5,
    borderRightWidth: 5,
    top: 0,
    right: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    borderBottomWidth: 5,
    borderRightWidth: 5,
    bottom: 0,
    right: 0,
    borderBottomRightRadius: 20,
  },
  scansLeftText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginTop: 24,
    backgroundColor: "rgba(35 , 202, 182, 0.70)",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 20,
  },
  iconButton: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInnerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "white",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  permissionText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  permissionButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
  },
  iconClose: {
    width: 40,
    height: 40,
    tintColor: "white",
  },
  iconDiamond: {
    width: 16,
    height: 16,
  },
  iconFooter: {
    width: 30,
    height: 30,
    tintColor: "#47C2BD",
  },
});
