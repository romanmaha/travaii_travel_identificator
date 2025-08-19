import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/Colors";

// --- Дані та допоміжний компонент TipItem залишаються без змін ---
const goodShotData = {
  image: require("../../assets/images/perfect-shot.png"),
  titleKey: "perfect_shot",
  descriptionKey: "building_is_clear",
};
const badShotsData = [
  {
    id: "1",
    image: require("../../assets/images/tip-far.png"),
    titleKey: "too_far",
    descriptionKey: "landmark_too_far",
  },
  {
    id: "2",
    image: require("../../assets/images/tip-dark.png"),
    titleKey: "too_dark",
    descriptionKey: "poor_lighting_conditions",
  },
  {
    id: "3",
    image: require("../../assets/images/tip-angled.png"),
    titleKey: "too_angled",
    descriptionKey: "excessive_perspective_distortion",
  },
  {
    id: "4",
    image: require("../../assets/images/tip-blocked.png"),
    titleKey: "partially_blocked",
    descriptionKey: "obstacles_blocking_the_view",
  },
];

type TipItemProps = {
  image: ImageSourcePropType;
  titleKey: string;
  descriptionKey: string;
  isGood: boolean;
  size?: "large" | "small";
};
const TipItem: React.FC<TipItemProps> = ({
  image,
  titleKey,
  descriptionKey,
  isGood,
  size = "small",
}) => {
  const containerSize = size === "large" ? 200 : 150;
  const iconSize = size === "large" ? 32 : 24;
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.tipItemContainer,
        size === "small" && styles.smallTipItem,
      ]}>
      <View
        style={{
          width: containerSize,
          height: containerSize,
          alignItems: "center",
        }}>
        <Image
          source={image}
          style={[
            styles.tipImage,
            { width: containerSize, height: containerSize },
          ]}
        />
        <View
          style={[
            styles.iconOverlay,
            isGood ? styles.iconGood : styles.iconBad,
          ]}>
          <Ionicons
            name={isGood ? "checkmark-sharp" : "close-sharp"}
            size={iconSize}
            color="white"
          />
        </View>
      </View>
      <Text style={styles.tipTitle}>{t(titleKey)}</Text>
      <Text style={styles.tipDescription}>{t(descriptionKey)}</Text>
    </View>
  );
};

// --- ✅ 2. Основний компонент тепер приймає пропси `visible` та `onClose` ---
interface SnapTipsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SnapTipsModal: React.FC<SnapTipsModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose} // Для кнопки "Назад" на Android
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("snap_tips")}</Text>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ alignItems: "center", paddingBottom: 120 }}>
          <TipItem
            image={goodShotData.image}
            titleKey={goodShotData.titleKey}
            descriptionKey={goodShotData.descriptionKey}
            isGood={true}
            size="large"
          />
          <View style={styles.badShotsGrid}>
            {badShotsData.map((item) => (
              <TipItem key={item.id} {...item} isGood={false} size="small" />
            ))}
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          {/* ✅ 3. Кнопка тепер викликає функцію onClose, передану ззовні */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{t("got_it")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ... стилі залишаються без змін
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F7F6" },
  header: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#1A1A1A" },
  scrollView: { flex: 1 },
  tipItemContainer: { alignItems: "center", marginBottom: 24, width: "100%" },
  smallTipItem: { width: "50%", paddingHorizontal: 8 },
  tipImage: { borderRadius: 999 },
  iconOverlay: {
    position: "absolute",
    top: 5,
    right: 5,
    borderRadius: 999,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGood: { backgroundColor: Colors.light.tint },
  iconBad: { backgroundColor: "#EF4444" },
  tipTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 16,
    textAlign: "center",
  },
  tipDescription: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
    textAlign: "center",
  },
  badShotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 12,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#F4F7F6",
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});

export default SnapTipsModal;
