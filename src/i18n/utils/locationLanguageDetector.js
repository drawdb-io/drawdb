// Map of country codes to primary language codes
const countryToLanguageMap = {
  // Europe
  ES: "es", // Spain
  FR: "fr", // France
  DE: "de", // Germany
  IT: "it", // Italy
  PT: "pt-BR", // Portugal
  NL: "nl", // Netherlands
  PL: "pl", // Poland
  RO: "ro", // Romania
  CZ: "cz", // Czech Republic
  HU: "hu", // Hungary
  GR: "el", // Greece
  SE: "sv", // Sweden
  NO: "no", // Norway
  DK: "da", // Denmark
  TR: "tr", // Turkey
  UA: "uk", // Ukraine
  RU: "ru", // Russia
  AM: "hy", // Armenia

  // Middle East & North Africa
  SA: "ar", // Saudi Arabia
  AE: "ar", // UAE
  EG: "ar", // Egypt
  IQ: "ar", // Iraq
  JO: "ar", // Jordan
  LB: "ar", // Lebanon
  IL: "he", // Israel
  IR: "fa", // Iran

  // South Asia
  IN: "hi", // India (default to Hindi, but India has many languages)
  PK: "ur", // Pakistan
  BD: "bn", // Bangladesh
  NP: "ne", // Nepal
  LK: "tm", // Sri Lanka (Tamil)

  // Southeast Asia
  TH: "th", // Thailand
  VN: "vi", // Vietnam
  ID: "id", // Indonesia
  MY: "ms", // Malaysia

  // East Asia
  CN: "zh", // China
  TW: "zh-TW", // Taiwan
  JP: "jp", // Japan
  KR: "ko", // Korea
  MN: "mn", // Mongolia

  // Africa
  KE: "sw", // Kenya
  TZ: "sw", // Tanzania
  UG: "sw", // Uganda

  // Americas
  US: "en", // United States
  GB: "en", // United Kingdom
  CA: "en", // Canada (default to English)
  AU: "en", // Australia
  NZ: "en", // New Zealand
  BR: "pt-BR", // Brazil
  MX: "es", // Mexico
  AR: "es", // Argentina
  CL: "es", // Chile
  CO: "es", // Colombia
  PE: "es", // Peru
  VE: "es", // Venezuela
};

// Map of Indian states/regions to their primary languages
const indianRegionToLanguageMap = {
  // States where Hindi is primary
  UP: "hi", // Uttar Pradesh
  MP: "hi", // Madhya Pradesh
  RJ: "hi", // Rajasthan
  UK: "hi", // Uttarakhand
  HR: "hi", // Haryana
  DL: "hi", // Delhi
  JH: "hi", // Jharkhand

  // States with regional languages
  MH: "mr", // Maharashtra - Marathi
  GJ: "gu", // Gujarat - Gujarati
  TN: "tm", // Tamil Nadu - Tamil
  KA: "ka", // Karnataka - Kannada
  AP: "te", // Andhra Pradesh - Telugu
  TS: "te", // Telangana - Telugu
  KL: "ml", // Kerala - Malayalam
  OR: "od", // Odisha - Odia
  PB: "pa", // Punjab - Punjabi
  AS: "as", // Assam - Assamese
  WB: "bn", // West Bengal - Bengali
};

/**
 * Fetches the user's country code using IP-based geolocation
 * Falls back to browser language if geolocation fails
 */
export async function detectLanguageByLocation() {
  try {
    // Try multiple geolocation services with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    let countryCode = null;

    // Try ipapi.co first (free, no key required)
    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        countryCode = data.country_code;

        // Special handling for India - try to detect state/region
        if (countryCode === "IN" && data.region_code) {
          const regionalLang = indianRegionToLanguageMap[data.region_code];
          if (regionalLang) {
            return regionalLang;
          }
        }
      }
    } catch (error) {
      console.log("Primary geolocation service failed, trying fallback...");
    }

    // Fallback to ipinfo.io
    if (!countryCode) {
      try {
        const response = await fetch("https://ipinfo.io/json", {
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          countryCode = data.country;

          // Special handling for India
          if (countryCode === "IN" && data.region) {
            const regionalLang = indianRegionToLanguageMap[data.region];
            if (regionalLang) {
              return regionalLang;
            }
          }
        }
      } catch (error) {
        console.log("Fallback geolocation service failed");
      }
    }

    // Map country code to language
    if (countryCode) {
      const language = countryToLanguageMap[countryCode];
      if (language) {
        console.log(
          `Location detected: ${countryCode}, setting language to: ${language}`,
        );
        return language;
      }
    }

    // If geolocation failed or country not in map, use browser language
    return getBrowserLanguage();
  } catch (error) {
    console.error("Error detecting location:", error);
    return getBrowserLanguage();
  }
}

/**
 * Gets the browser's language preference
 */
function getBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  console.log(`Using browser language: ${browserLang}`);

  // Extract base language code (e.g., "en-US" -> "en")
  const langCode = browserLang.split("-")[0].toLowerCase();

  // Map common browser language codes to our language codes
  const browserLangMap = {
    en: "en",
    zh:
      browserLang.includes("TW") || browserLang.includes("HK") ? "zh-TW" : "zh",
    es: "es",
    fr: "fr",
    de: "de",
    it: "it",
    pt: "pt-BR",
    ru: "ru",
    ja: "jp",
    ko: "ko",
    ar: "ar",
    hi: "hi",
    bn: "bn",
    pa: "pa",
    te: "te",
    mr: "mr",
    ta: "tm",
    ur: "ur",
    gu: "gu",
    kn: "ka",
    ml: "ml",
    th: "th",
    vi: "vi",
    id: "id",
    tr: "tr",
    pl: "pl",
    uk: "uk",
    ro: "ro",
    nl: "nl",
    el: "el",
    he: "he",
    sv: "sv",
    no: "no",
    da: "da",
    cs: "cz",
    hu: "hu",
    fa: "fa",
  };

  return browserLangMap[langCode] || "en";
}

/**
 * Custom language detector plugin for i18next
 */
export const locationBasedLanguageDetector = {
  type: "languageDetector",
  async: true,
  detect: (callback) => {
    // Check if user has already set a language preference
    const savedLanguage = localStorage.getItem("i18nextLng");
    if (savedLanguage) {
      callback(savedLanguage);
      return;
    }

    // Detect language based on location
    detectLanguageByLocation().then((language) => {
      callback(language);
    });
  },
  init: () => {},
  cacheUserLanguage: (lng) => {
    localStorage.setItem("i18nextLng", lng);
  },
};
