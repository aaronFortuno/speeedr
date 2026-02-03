// i18n.js
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationCA from './locales/ca.json';
import translationES from './locales/es.json';
import translationEN from './locales/en.json';

i18next
    .use(LanguageDetector)
    .init({
        debug: true,
        fallbackLng: 'ca',
        resources: {
            ca: {
                translation: translationCA
            },
            es: {
                translation: translationES
            },
            en: {
                translation: translationEN
            }
        }
    });

export default i18next;
