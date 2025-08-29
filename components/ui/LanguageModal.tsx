// src/components/ui/LanguageModal.tsx
import { LANGS } from "@/services/localization/languages";
import React from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  currentLang: string;
  title?: string;
};

export default function LanguageModal({
  visible,
  onClose,
  onSelect,
  currentLang,
  title = "Choose language",
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Image
                source={require("@/assets/icons/close.png")}
                style={styles.close}
              />
            </TouchableOpacity>
          </View>

          <FlatList
            data={LANGS}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const active = item.code === currentLang;
              return (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => onSelect(item.code)}>
                  <Text
                    style={[styles.langText, active && styles.langTextActive]}>
                    {item.native}
                  </Text>
                  {active && (
                    <Image
                      source={require("../../assets/icons/check.png")}
                      style={styles.check}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "400", color: "#1A1A1A" },
  close: { width: 24, height: 24, tintColor: "#8E8E93" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  langText: { fontSize: 16, color: "#1A1A1A" },
  langTextActive: { fontWeight: "700", color: "#47C2BD" },
  check: { width: 18, height: 18 },
  separator: { height: 1, backgroundColor: "#F4F7F6" },
  cancelBtn: {
    marginTop: 12,
    backgroundColor: "#47C2BD",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    opacity: 0.9,
  },
  cancelText: { fontSize: 16, color: "#ffffff", fontWeight: "400" },
});
