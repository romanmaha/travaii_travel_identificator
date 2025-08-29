import { GOOGLE_GEMINI_API_KEY } from "@/constants";
import { Colors } from "@/constants/Colors";
import FormattedMessage from "@/helpers/formattedMessage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Типи
type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
};

type LandmarkData = {
  title: string;
  style: string;
  heroImage?: string;
  location?: string;
};

const LANDMARK_SUGGESTION_KEYS = [
  "landmark_suggestion_1",
  "landmark_suggestion_2",
  "landmark_suggestion_3",
  "landmark_suggestion_4",
  "landmark_suggestion_5",
];

const STYLE_SUGGESTION_KEYS = [
  "style_suggestion_1",
  "style_suggestion_2",
  "style_suggestion_3",
  "style_suggestion_4",
  "style_suggestion_5",
];

// --- Основний компонент екрану ---
export default function ChatScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const {
    data: dataString,
    confidence,
    chatContext,
  } = useLocalSearchParams<{
    data: string;
    confidence?: string;
    chatContext?: "landmark" | "style";
  }>();
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  // Стан
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Парсимо дані про пам'ятку
  const landmarkData: LandmarkData | null = useMemo(() => {
    if (!dataString) return null;
    try {
      return JSON.parse(dataString);
    } catch (e) {
      return null;
    }
  }, [dataString]);

  // Встановлюємо початкове повідомлення від AI
  useEffect(() => {
    if (landmarkData) {
      setMessages([
        {
          id: "initial",
          // ✅ Використовуємо t() з передачею змінної
          text: t("chat_initial_greeting", { title: landmarkData.title }),
          sender: "ai",
        },
      ]);
    }
  }, [landmarkData, t]);
  useEffect(() => {
    if (chatContext === "style") {
      // ✅ Генеруємо перекладені підказки на основі ключів
      setSuggestedQuestions(STYLE_SUGGESTION_KEYS.map((key) => t(key)));
    } else {
      setSuggestedQuestions(LANDMARK_SUGGESTION_KEYS.map((key) => t(key)));
    }
  }, [chatContext, t]);
  const handleSendMessage = async (
    text: string,
    isSuggestion: boolean = false
  ) => {
    const messageText = text.trim();
    if (!messageText || isLoading || !landmarkData) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      text: messageText,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // ✅ Якщо це готове питання, видаляємо його зі списку
    if (isSuggestion) {
      setSuggestedQuestions((prev) => prev.filter((q) => q !== text));
    }

    setIsLoading(true);

    try {
      const currentLanguage = i18n.language;
      const history = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      // ✅ 3. Спрощений промпт для уникнення зайвих привітань
      const prompt = `You are AI Guide, a helpful travel assistant. We are discussing the landmark "${
        landmarkData.title
      }"${
        landmarkData.location
          ? `, which is located in ${landmarkData.location}`
          : ""
      }.
      Answer the following question concisely and in a friendly tone, directly addressing the user's query.
      IMPORTANT: Your entire response MUST be in the following language: **${currentLanguage}**.`;

      const requestBody = {
        contents: [
          ...history,
          {
            role: "user",
            parts: [{ text: `${prompt}\n\nQuestion: ${messageText}` }],
          },
        ],
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );
      const responseData = await response.json();

      if (responseData.candidates && responseData.candidates.length > 0) {
        const aiResponseText = responseData.candidates[0].content.parts[0].text;
        const aiMessage: Message = {
          id: Math.random().toString(),
          text: aiResponseText,
          sender: "ai",
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(responseData.error?.message || "No response from AI.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: Math.random().toString(),
        // ✅ Використовуємо t() для повідомлення про помилку
        text: t("chat_error_message"),
        sender: "ai",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!landmarkData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text> {t("error_loading_data")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* --- Хедер --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Image
            source={require("../assets/icons/arrow-left.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("chat_with_ai_guide")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* --- Інформаційна картка --- */}
      <View style={styles.infoCard}>
        <Image
          source={{ uri: landmarkData.heroImage }}
          style={styles.infoImage}
        />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>{landmarkData.title}</Text>
          <Text style={styles.infoSubtitle}>{landmarkData.style}</Text>
        </View>
        {confidence && chatContext !== "style" && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>
              {confidence}% {t("match")}
            </Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}>
        {/* --- Історія чату --- */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.chatContainer}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.sender === "user" ? styles.userBubble : styles.aiBubble,
              ]}>
              {/* ✅ 2. Використовуємо новий компонент замість простого Text */}
              <FormattedMessage
                text={item.text}
                style={
                  item.sender === "user"
                    ? styles.userMessageText
                    : styles.aiMessageText
                }
              />
            </View>
          )}
        />

        {/* --- Готові запитання --- */}
        {suggestedQuestions.length > 0 && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContainer}>
              {suggestedQuestions.map((q, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionChip,
                    isLoading && styles.suggestionChipDisabled,
                  ]}
                  onPress={() => handleSendMessage(q, true)}
                  disabled={isLoading} // ✅ Блокуємо кнопку під час завантаження
                >
                  <Text style={styles.suggestionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {/* --- Поле вводу --- */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t("chat_placeholder")}
            placeholderTextColor="#8E8E8E"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => handleSendMessage(inputText)}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Image
                source={require("../assets/icons/send.png")}
                style={styles.sendIcon}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- СТИЛІ ---
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backIcon: { width: 24, height: 24, tintColor: Colors.light.tint },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1A1A1A" },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
  },
  infoImage: { width: 50, height: 50, borderRadius: 8 },
  infoTextContainer: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1A1A" },
  infoSubtitle: { fontSize: 14, color: "#8E8E8E", marginTop: 2 },
  matchBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  matchText: { color: "white", fontWeight: "bold", fontSize: 12 },
  chatContainer: { flex: 1 },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  userBubble: { backgroundColor: Colors.light.tint, alignSelf: "flex-end" },
  aiBubble: { backgroundColor: "white", alignSelf: "flex-start" },
  userMessageText: { color: "white", fontSize: 16 },
  aiMessageText: { color: "#1A1A1A", fontSize: 16 },
  suggestionsContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  suggestionChip: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  suggestionText: { color: "#4B5563", fontWeight: "500" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "white",
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#F4F7F6",
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  suggestionChipDisabled: { opacity: 0.5 },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendIcon: { width: 24, height: 24, tintColor: "white" },
});
