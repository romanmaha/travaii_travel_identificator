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

  // ✅ 1. Змінено формулювання, щоб уникнути плутанини
  const locationHint = location
    ? `\nThe user's current GPS coordinates are Latitude ${location.latitude}, Longitude ${location.longitude}. Use this only as a potential hint if the landmark is obscure. Prioritize the visual information from the image above all else.`
    : "";

  return `You are ArchAI, an expert architectural and travel landmark assistant. Your task is to analyze the image provided and return a single, raw JSON object. ${locationHint}

      The JSON object must strictly follow this structure. If a value is unknown, use an empty string "" or an empty array [].
      - "objectType": (string) Classify the main subject. Must be one of these exact values: "Landmark", "Natural Wonder", or "Other".
      - "title": (string) The official, common name of the landmark.
      - "confidence": (number) Your confidence score (0-100) in the identification. Be realistic.
      - "location": (string) The city and country where the landmark is located (e.g., "Paris, France").
      - "established": (string) The year or century of completion (e.g., "1889", "12th century").
      - "style": (string) The primary architectural style (e.g., "Gothic", "Modernism").
      - "architect": (string) The full name of the primary architect(s), if known.
      - "height": (string) The total height, if it's a notable feature (e.g., "330 m").
      - "material": (string) The main construction materials (e.g., "Wrought iron", "Marble").
      - "status": (string) The current function or status (e.g., "Museum", "UNESCO World Heritage Site").
      - "about": (string) An engaging and informative paragraph (3-4 sentences) about the landmark's history and significance.
      - "quote": (object) An interesting quote related to the landmark.
        - "text": (string) The quote.
        - "source": (string) The person or source of the quote.
      - "interestingFacts": (array of strings) A list of 2-3 concise, interesting facts.

      VERY IMPORTANT:
      1. All string values ("title", "location", "about", etc.) MUST be translated into the following language: **${langName}**.
      2. Your entire response must be ONLY the raw JSON object. Do NOT include any extra text, explanations, or markdown formatting like \`\`\`json.
      `;
};
