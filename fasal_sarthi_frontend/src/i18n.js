import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  // Backend plugin ko load karein (yeh public/locales folder se files load karega)
  .use(HttpBackend)
  
  // Browser language ko automatically detect karein
  .use(LanguageDetector)
  
  // i18n ko react-i18next ke saath pass karein
  .use(initReactI18next)
  
  // i18next ko initialize (shuru) karein
  .init({
    // Fallback language (agar user ki bhasha ki file nahi milti hai)
    fallbackLng: 'en',
    
    // Debugging ko development mein on rakhein (console mein logs dikhenge)
    debug: true, 

    // Bhasha detect karne ke options
    detection: {
      // Is order mein check karein: localStorage, phir browser settings
      order: ['localStorage', 'navigator'],
      // Chuni hui bhasha ko localStorage mein save karein
      caches: ['localStorage'],
    },

    // React ko HTML/JSX escape karne ki zaroorat nahi hai
    interpolation: {
      escapeValue: false, 
    },

    // Backend (HttpBackend) ko batayein ki files kahaan hain
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    }
  });

export default i18n;