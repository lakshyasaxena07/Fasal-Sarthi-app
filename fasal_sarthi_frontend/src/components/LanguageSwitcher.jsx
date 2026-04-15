import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuLanguages } from 'react-icons/lu'; // Bhasha ke liye icon

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false); // Dropdown ke liye state

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false); // Button click par dropdown band karein
  };

  const currentLanguage = i18n.language === 'hi' ? t('hindi_language') : t('english_language');

  return (
    <div className="relative inline-block text-left ml-4">
      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <LuLanguages className="mr-2 h-5 w-5 text-gray-600" aria-hidden="true" />
        {currentLanguage}
        {/* Chevron Icon */}
        <svg
          className="-mr-1 ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Menu (Conditionally rendered) */}
      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {/* English Button */}
            <button
              onClick={() => changeLanguage('en')}
              className={`w-full text-left block px-4 py-2 text-sm ${
                i18n.language === 'en' ? 'font-bold text-green-700 bg-green-50' : 'text-gray-700'
              } hover:bg-gray-100`}
              role="menuitem"
            >
              {t('english_language')}
            </button>
            {/* Hindi Button */}
            <button
              onClick={() => changeLanguage('hi')}
              className={`w-full text-left block px-4 py-2 text-sm ${
                i18n.language === 'hi' ? 'font-bold text-green-700 bg-green-50' : 'text-gray-700'
              } hover:bg-gray-100`}
              role="menuitem"
            >
              {t('hindi_language')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;