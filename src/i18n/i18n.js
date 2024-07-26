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
import { fa, persian } from "./locales/fa";
import { hi, hindi } from "./locales/hi";
import { uk, ukrainian } from "./locales/uk";
import { ru, russian } from "./locales/ru";
import { tr, turkish } from "./locales/tr";
import { mr, marathi } from "./locales/mr";
import { fr, french } from "./locales/fr";
import { pa, punjabi } from "./locales/pa";

export const languages = [
  english,
  chinese,
  danish,
  spanish,
  german,
  vietnamese,
  portuguese,
  persian,
  hindi,
  marathi,
  ukrainian,
  russian,
  turkish,
  french,
  punjabi,
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
      fa,
      hi,
      mr,
      uk,
      ru,
      tr,
      fr,
      pa,
    },
  });

export default i18n;
