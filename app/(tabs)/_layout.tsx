import { Tabs } from "expo-router";
import React from "react";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTranslation } from "react-i18next";
export default function TabLayout() {
  const activeColor = "#47C2BD"; // Бірюзовий
  const inactiveColor = "#8E8E8E"; // Сірий
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,

        tabBarStyle: {
          backgroundColor: "#FFFFFF", // Чистий білий фон
          borderTopWidth: 0, // Прибираємо верхню лінію для чистоти
          height: 90, // Можна налаштувати висоту за потреби
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}>
      <Tabs.Screen
        name="index" // Цей файл відповідає за екран "Home"
        options={{
          title: t("home"),
          tabBarIcon: ({ color }) => (
            // Іконка будинку
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan" // Файл scan.tsx
        options={{
          title: t("scan"),
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color }) => (
            // Іконка сканера. 'camera.viewfinder' - хороший варіант з SF Symbols
            <IconSymbol size={28} name="camera.viewfinder" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color }) => (
            // Іконка профілю
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-result"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
