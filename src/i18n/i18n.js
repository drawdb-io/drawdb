import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { en, english } from "./locales/en";
import { zh, chinese } from "./locales/zh";
import { es, spanish } from "./locales/es";
import { da, danish } from "./locales/da";
import { de, german } from "./locales/de";
import { vi, vietnamese } from "./locales/vi";
import { pt, portuguese } from "./locales/pt-br";
import { fa, persian } from "./locales/fa"

export const languages = [
  english,
  chinese,
  danish,
  spanish,
  german,
  vietnamese,
  portuguese,
  persian
].sort((a, b) => a.name.localeCompare(b.name));

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en,
      zh,
      es,
      da,
      de,
      vi,
      pt,
      fa
    },
  });

export default i18n;
