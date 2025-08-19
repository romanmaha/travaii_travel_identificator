const languageMap: { [key: string]: string } = {
  en: "English",
  es: "Spanish",
  de: "German",
  fr: "French",
  pt: "Portuguese",
  it: "Italian",
  uk: "Ukrainian", // Можна додати будь-які мови
};

// Замість 'export const analyzeImageWithGeminiPrompt = `...`'
// експортуємо функцію:
export const getAnalyzeImagePrompt = (languageCode: string): string => {
  // Визначаємо повну назву мови, або використовуємо запасний варіант
  const langName = languageMap[languageCode.split("-")[0]] || languageCode;

  return `You are ArchAI, an expert architectural and travel landmark assistant. Your task is to analyze the image of the landmark provided and return a comprehensive, structured JSON object.

      The JSON object must have the following structure. If some data is not available, return an empty string "" or an empty array [].

      - "title": (string) The official name of the landmark.
      - "confidence": (number) An estimated confidence score from 0 to 100 on how certain you are about the identification.
      - "location": (string) The city and country.
      - "established": (string) The year or period it was built.
      - "style": (string) The primary architectural style.
      // ... (решта вашого опису структури JSON) ...
      - "interestingFacts": (array of strings) A list of 2-3 bullet-point style interesting facts.

      IMPORTANT INSTRUCTION: All text values in the response (like "title", "location", "style", "about", "quote.text", "interestingFacts", etc.) MUST be in the following language: **${langName}**.
      
      Return ONLY the raw JSON object, without any surrounding text or markdown formatting.`;
};
