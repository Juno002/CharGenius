
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import esTranslations from '@/locales/es.json';
import enTranslations from '@/locales/en.json';

type Translations = typeof esTranslations;

interface LanguageContextType {
  language: 'es' | 'en';
  setLanguage: (language: 'es' | 'en') => void;
  t: (key: string, values?: { [key: string]: string | number }) => string;
}

const translations = {
  es: esTranslations,
  en: enTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: any, key: string): string => {
  return key.split('.').reduce((acc, part) => acc && acc[part], obj) || key;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<'es' | 'en'>('es');

  useEffect(() => {
    const storedLang = localStorage.getItem('uiLanguage') as 'es' | 'en';
    if (storedLang && (storedLang === 'es' || storedLang === 'en')) {
      setLanguageState(storedLang);
    }
  }, []);

  const setLanguage = (lang: 'es' | 'en') => {
    localStorage.setItem('uiLanguage', lang);
    setLanguageState(lang);
  };
  
  const t = useMemo((): ((key: string, values?: { [key: string]: string | number }) => string) => (key: string, values?: { [key: string]: string | number }): string => {
    const translationSet = translations[language] as Translations;
    let translatedString = getNestedValue(translationSet, key);
    
    if (values) {
        Object.keys(values).forEach(valueKey => {
            translatedString = translatedString.replace(`{${valueKey}}`, String(values[valueKey]));
        });
    }

    return translatedString;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
