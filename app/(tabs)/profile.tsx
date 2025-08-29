import LanguageModal from "@/components/ui/LanguageModal";
import SnapTipsModal from "@/components/ui/SnapTipsModal";
import { usePremium } from "@/context/PremiumContext";
import { usePaywall } from "@/hooks/usePaywall";
import { LANGS, LANGUAGE_STORAGE_KEY } from "@/services/localization/languages";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Reusable Row Component ---
type SettingsRowProps = {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
};

const SettingsRow = ({
  icon,
  title,
  subtitle,
  onPress,
  isLast = false,
}: SettingsRowProps) => (
  <TouchableOpacity onPress={onPress} style={styles.row}>
    <Image source={icon} style={styles.rowIcon} />
    <View style={styles.rowTextContainer}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
    </View>
    <Image
      source={require("../../assets/icons/chevron-right.png")}
      style={styles.rowChevron}
    />
  </TouchableOpacity>
);

// --- Reusable Section Component ---
type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    <View style={styles.sectionContainer}>{children}</View>
  </View>
);

// --- Main Settings Screen Component ---
export default function profile() {
  const router = useRouter();
  const [isTipsModalVisible, setTipsModalVisible] = useState(false);
  const { presentPaywall } = usePaywall();
  const { t, i18n } = useTranslation();
  const { isPremium } = usePremium();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [isLangModalVisible, setLangModalVisible] = useState(false);
  useEffect(() => {
    const handler = (lng: string) => setCurrentLang(lng);
    i18n.on("languageChanged", handler);
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, []);

  const currentNativeName =
    LANGS.find((l) => l.code === currentLang)?.native ?? currentLang;
  const handleSelectLanguage = async (code: string) => {
    try {
      await i18n.changeLanguage(code);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      setLangModalVisible(false);
    } catch (e) {
      console.error("Failed to switch language:", e);
      Alert.alert("Error", "Failed to change language");
    }
  };

  // --- Placeholder Handlers ---
  const handleSnapTips = () => setTipsModalVisible(true);
  const handleLanguage = () => setLangModalVisible(true);
  const handleRateUs = () => console.log("Open App Store for rating");
  const handleSuggestFeature = () => {
    const email = "support@travaii.com";
    const subject = "Suggest a Feature for Travaii";
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred", err)
    );
  };

  const handleClearCache = () => {
    Alert.alert(t("clear_cache_alert_title"), t("clear_cache_alert_message"), [
      { text: t("button_cancel"), style: "cancel" },
      {
        text: t("button_clear"),
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            Alert.alert(t("success"), t("cache_cleared_successfully"));
            console.log("AsyncStorage cleared successfully.");
          } catch (e) {
            console.error("Failed to clear the async storage.", e);
            Alert.alert(t("error"), t("failed_to_clear_cache"));
          }
        },
      },
    ]);
  };
  const handlePrivacyPolicy = () =>
    Linking.openURL("https://archai.darkcraft.space/privacy-policy.html");
  const handleTermsOfUse = () =>
    Linking.openURL("https://archai.darkcraft.space/terms-of-use.html");
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
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{ title: t("settings_title"), headerShadowVisible: false }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        <SettingsSection title={t("preferences")}>
          <SettingsRow
            icon={require("../../assets/icons/tips.png")}
            title={t("snap_tips")}
            subtitle={t("snap_tips_subtitle")}
            onPress={handleSnapTips}
          />
          <SettingsRow
            icon={require("../../assets/icons/language.png")}
            title={t("language")}
            subtitle={t("language_subtitle")}
            onPress={handleLanguage}
          />
        </SettingsSection>

        <SettingsSection title={t("feedback")}>
          {/* <SettingsRow
            icon={require("../../assets/icons/star.png")}
            title={t("rate_us")}
            onPress={handleRateUs}
          /> */}
          <SettingsRow
            icon={require("../../assets/icons/mail.png")}
            title={t("suggest_feature")}
            onPress={handleSuggestFeature}
          />
        </SettingsSection>

        <SettingsSection title={t("storage")}>
          <SettingsRow
            icon={require("../../assets/icons/trash.png")}
            title={t("clear_cache")}
            onPress={handleClearCache}
          />
        </SettingsSection>

        <SettingsSection title={t("legal")}>
          <SettingsRow
            icon={require("../../assets/icons/lock.png")}
            title={t("privacy_policy")}
            onPress={handlePrivacyPolicy}
          />
          <SettingsRow
            icon={require("../../assets/icons/document.png")}
            title={t("terms_of_use")}
            onPress={handleTermsOfUse}
          />
        </SettingsSection>

        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumButton}
            onPress={handleGetPremium}>
            <Text style={styles.premiumButtonText}>{t("get_premium")}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.versionText}>Version 1.0.0 (100)</Text>
      </ScrollView>
      <SnapTipsModal
        visible={isTipsModalVisible}
        onClose={() => setTipsModalVisible(false)}
      />
      <LanguageModal
        visible={isLangModalVisible}
        onClose={() => setLangModalVisible(false)}
        onSelect={handleSelectLanguage}
        currentLang={currentLang}
        title={t("choose_language") ?? "Choose language"}
      />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7F6",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F4F7F6",
  },
  rowIcon: {
    width: 28,
    height: 28,
    marginRight: 16,
    tintColor: "#47C2BD", // Your app's primary color
  },
  rowTextContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  rowSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  rowChevron: {
    width: 16,
    height: 16,
    tintColor: "#C7C7CC",
  },
  premiumButton: {
    backgroundColor: "#47C2BD", // Your app's primary color
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  premiumButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  versionText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 12,
    color: "#8E8E93",
  },
});
