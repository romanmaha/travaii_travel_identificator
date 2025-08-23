import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
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
  const { t } = useTranslation();

  // --- Placeholder Handlers ---
  const handleSnapTips = () => console.log("Navigate to Snap Tips");
  const handleLanguage = () => console.log("Navigate to Language Settings");
  const handleRateUs = () => console.log("Open App Store for rating");
  const handleSuggestFeature = () => console.log("Open email client");
  const handleClearCache = () => {
    Alert.alert(t("clear_cache_alert_title"), t("clear_cache_alert_message"), [
      { text: t("button_cancel"), style: "cancel" },
      {
        text: t("button_clear"),
        style: "destructive",
        onPress: () => console.log("Cache cleared"),
      },
    ]);
  };
  const handlePrivacyPolicy = () => console.log("Navigate to Privacy Policy");
  const handleTermsOfUse = () => console.log("Navigate to Terms of Use");
  const handleGetPremium = () => console.log("Navigate to Premium Screen");

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
          <SettingsRow
            icon={require("../../assets/icons/star.png")}
            title={t("rate_us")}
            onPress={handleRateUs}
          />
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

        <TouchableOpacity
          style={styles.premiumButton}
          onPress={handleGetPremium}>
          <Text style={styles.premiumButtonText}>{t("get_premium")}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0 (100)</Text>
      </ScrollView>
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
