export type LangCode = "en" | "es" | "pt" | "de" | "fr" | "it" | "uk";

export const LANGS: Array<{ code: LangCode; native: string; english: string }> =
  [
    { code: "en", native: "English", english: "English" },
    { code: "es", native: "Español", english: "Spanish" },
    { code: "pt", native: "Português", english: "Portuguese" },
    { code: "de", native: "Deutsch", english: "German" },
    { code: "fr", native: "Français", english: "French" },
    { code: "it", native: "Italiano", english: "Italian" },
    { code: "uk", native: "Українська", english: "Ukrainian" },
  ];

export const LANGUAGE_STORAGE_KEY = "app_language";
