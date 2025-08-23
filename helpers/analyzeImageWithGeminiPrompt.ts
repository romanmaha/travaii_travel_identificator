// @/helpers/analyzeImageWithGeminiPrompt.ts

const languageMap: { [key: string]: string } = {
  en: "English",
  es: "Spanish",
  de: "German",
  fr: "French",
  pt: "Portuguese",
  it: "Italian",
  uk: "Ukrainian",
};
type LocationCoords = {
  latitude: string;
  longitude: string;
};

export const getAnalyzeImagePrompt = (
  languageCode: string,
  location?: LocationCoords
): string => {
  const langName = languageMap[languageCode.split("-")[0]] || languageCode;

  const locationHint = location
    ? `\nUse the following GPS coordinates as a strong hint for identification: Latitude ${location.latitude}, Longitude ${location.longitude}.`
    : "";
  return `You are ArchAI, an expert architectural and travel landmark assistant. Your task is to analyze the image of the landmark provided and return a comprehensive, structured JSON object. ${locationHint}

      The JSON object must have the following structure. If some data is not available, return an empty string "" or an empty array [].

      - "title": (string) The official name of the landmark.
      - "confidence": (number) An estimated confidence score from 0 to 100 on how certain you are about the identification.
      - "location": (string) The city and country.
      - "established": (string) The year or period it was built.
      - "style": (string) The primary architectural style.
      
      // ✅ ОСЬ ВИПРАВЛЕННЯ: Додано відсутні поля
      - "architect": (string) The name of the primary architect.
      - "height": (string) The height of the structure, if notable.
      - "material": (string) The primary building materials.
      - "status": (string) The current status (e.g., "Museum", "UNESCO World Heritage Site").
      - "about": (string) An engaging paragraph about the landmark.
      - "quote": (object) An interesting quote.
        - "text": (string) The quote itself.
        - "source": (string) The author or source.
      
      - "interestingFacts": (array of strings) A list of 2-3 bullet-point style interesting facts.

      IMPORTANT INSTRUCTION: All text values in the response (like "title", "location", "style", "about", "quote.text", "interestingFacts", etc.) MUST be in the following language: **${langName}**.
      
      Return ONLY the raw JSON object, without any surrounding text or markdown formatting.`;
};
