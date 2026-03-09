import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from '../translations/en';
import { pt } from '../translations/pt';

type Language = 'en' | 'pt';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = { en, pt };

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('digiapp-language');
        if (saved === 'en' || saved === 'pt') return saved;

        // Default to Portuguese based on original app state
        return 'pt';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('digiapp-language', lang);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to English if key missing in current language
                if (language !== 'en') {
                    let fallbackValue: any = translations['en'];
                    let found = true;
                    for (const fallbackK of keys) {
                        if (fallbackValue && typeof fallbackValue === 'object' && fallbackK in fallbackValue) {
                            fallbackValue = fallbackValue[fallbackK];
                        } else {
                            found = false;
                            break;
                        }
                    }
                    if (found && typeof fallbackValue === 'string') return fallbackValue;
                }

                console.warn(`Translation key not found: ${key} in ${language}`);
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
