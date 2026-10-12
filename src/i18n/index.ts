import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from '../types';
import en from './locales/en/common.json';
import es from './locales/es/common.json';
import fr from './locales/fr/common.json';
import it from './locales/it/common.json';
import ro from './locales/ro/common.json';

export const COMMON_NAMESPACE = 'common';

export type NamespaceResources = Record<Language, Record<string, unknown>>;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { [COMMON_NAMESPACE]: en },
      es: { [COMMON_NAMESPACE]: es },
      fr: { [COMMON_NAMESPACE]: fr },
      it: { [COMMON_NAMESPACE]: it },
      ro: { [COMMON_NAMESPACE]: ro },
    },
    supportedLngs: LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: [COMMON_NAMESPACE],
    defaultNS: COMMON_NAMESPACE,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      convertDetectedLanguage: (lng) => lng.split('-')[0],
    },
  });

/** Registers a feature's translation namespace for all supported languages. */
export const registerNamespace = (namespace: string, resources: NamespaceResources) => {
  LANGUAGES.forEach((language) =>
    i18n.addResourceBundle(language, namespace, resources[language], true, true),
  );
};

export const toLanguage = (value: string | undefined): Language =>
  LANGUAGES.find((language) => language === value) ?? DEFAULT_LANGUAGE;

export { i18n };
