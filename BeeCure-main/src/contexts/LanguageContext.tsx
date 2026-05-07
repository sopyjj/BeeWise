import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // 브라우저 기본 언어 감지
  const getInitialLanguage = (): Language => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang === 'ko' || savedLang === 'en') {
      return savedLang;
    }
    
    // 브라우저 언어 설정 확인
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ko')) {
      return 'ko';
    }
    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // 언어 변경 시 localStorage에 저장
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // 동적 import로 번역 파일 로드
  const [translations, setTranslations] = useState<any>(null);

  useEffect(() => {
    import('../i18n/translations').then((module) => {
      setTranslations(module.translations);
    });
  }, []);

  // 번역 함수
  const t = (key: string): string => {
    if (!translations || !translations[language]) {
      return key; // 번역이 로드되지 않으면 키 반환
    }

    // 중첩 키 지원 (예: "home.title")
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // 키를 찾을 수 없으면 원본 반환
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

