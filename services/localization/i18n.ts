import AsyncStorage from "@react-native-async-storage/async-storage"; // <--- ІМПОРТУЄМО
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { LANGUAGE_STORAGE_KEY, LangCode } from "./languages";
// Імпортуємо ваші переклади
import de from "./translations/de.json";
import en from "./translations/en.json";
import es from "./translations/es.json";
import fr from "./translations/fr.json";
import it from "./translations/it.json";
import pt from "./translations/pt.json";
import uk from "./translations/uk.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  de: { translation: de },
  fr: { translation: fr },
  it: { translation: it },
  uk: { translation: uk },
};

// Створюємо асинхронну функцію для ініціалізації
const initializeI18n = async () => {
  let initialLang = "en"; // Мова за замовчуванням

  try {
    // 1. Спробувати отримати мову зі сховища
    const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (storedLang && resources.hasOwnProperty(storedLang)) {
      // Якщо мова є і вона підтримується, використовуємо її
      initialLang = storedLang as LangCode;
    } else {
      // 2. Якщо в сховищі нічого немає, беремо мову пристрою
      const deviceLang = Localization.getLocales()[0]?.languageCode;
      if (deviceLang && resources.hasOwnProperty(deviceLang)) {
        initialLang = deviceLang as LangCode;
      }
    }
  } catch (e) {
    console.error("Failed to load language from storage", e);
    // У разі помилки, залишаємо англійську за замовчуванням
  }

  // 3. Ініціалізуємо i18n з визначеною мовою
  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
};

// Викликаємо нашу асинхронну функцію
initializeI18n();

export default i18n;
