import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import fa from "./locales/fa.json";

export const SUPPORTED_LANGS = ["en", "fa"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const RTL_LANGS: Lang[] = ["fa"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fa: { translation: fa },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "xim.lang",
      caches: ["localStorage"],
    },
  });

const applyDir = (lng: string) => {
  const isRtl = RTL_LANGS.includes(lng as Lang);
  if (typeof document !== "undefined") {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  }
};

applyDir(i18n.language || "en");
i18n.on("languageChanged", applyDir);

export default i18n;
