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
import { he, hebrew } from "./locales/he";
import { pa, punjabi } from "./locales/pa";
import { hy, armenian } from "./locales/hy";
import { ar, arabic } from "./locales/ar";
import { zh_tw, traditionalChinese } from "./locales/zh-tw";
import { hu, hungarian } from "./locales/hu";
import { id, indonesian } from "./locales/id";
import { te, telugu } from "./locales/te";
import { tm, tamil } from "./locales/tm";
import { gu, gujarati } from "./locales/gu";
import { it, italian } from "./locales/it";
import { ko, korean } from "./locales/ko";
import { od, odia } from "./locales/od";
import { bn, bengali } from "./locales/bn";
import { ka, kannada } from "./locales/ka";
import { pl, polish } from "./locales/pl";
import { no, norwegian } from "./locales/no";
import { sv, swedish } from "./locales/sv-se";
import { ur, urdu } from "./locales/ur";
import { jp, japanese} from "./locales/jp"
import {ne, nepali} from "./locales/ne"

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
  armenian,
  arabic,
  traditionalChinese,
  hebrew,
  hungarian,
  indonesian,
  telugu,
  tamil,
  gujarati,
  italian,
  korean,
  odia,
  bengali,
  kannada,
  polish,
  norwegian,
  swedish,
  urdu,
  japanese,
  nepali
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
      "pt-BR": pt,
      fa,
      hi,
      mr,
      uk,
      ru,
      tr,
      fr,
      pa,
      hy,
      ar,
      "zh-TW": zh_tw,
      he,
      hu,
      id,
      te,
      tm,
      gu,
      it,
      ko,
      od,
      bn,
      ka,
      pl,
      no,
      sv,
      ur,
      jp,
      ne
    },
  });

export default i18n;
