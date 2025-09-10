'use client';

import * as React from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sendKnowledgeBaseDisplayData } from '@/lib/kb-integration';

// Hydration-safe component for screen reader text
function SelectLanguageText() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="sr-only">Select Language</span>;
  }

  return <span className="sr-only">{t('language.selectLanguage')}</span>;
}

// Hydration-safe component for English option
function EnglishText() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return 'English';
  }

  return t('language.english');
}

// Hydration-safe component for Chinese option
function ChineseText() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return '中文';
  }

  return t('language.chinese');
}

// Hydration-safe component for Traditional Chinese option
function TraditionalText() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return '繁體中文';
  }

  return t('language.traditional');
}

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState(() => {
    // Initialize with a default value based on localStorage or fallback to "en"
    // Check if we're on the client side before accessing localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem("i18nextLng") || "en";
    }
    return "en";
  });

  // Apply language settings on component mount
  useEffect(() => {
    // Only run if we're on the client side
    if (typeof window === 'undefined') return;
    
    // If no language is set in localStorage, set English as default
    if (!localStorage.getItem("i18nextLng")) {
      localStorage.setItem("i18nextLng", "en");
      i18n.changeLanguage("en");
    } else {
      // Use the language from localStorage
      const savedLanguage = localStorage.getItem("i18nextLng") || "en";
      i18n.changeLanguage(savedLanguage);
    }
    
    // Update the active language state to match i18n
    setActiveLanguage(i18n.language || "en");
    
    // Apply Traditional Chinese styling if needed
    const isTrad = i18n.language === "zh-TW" || i18n.language === "zh-HK";
    if (isTrad) {
      document.documentElement.style.setProperty("font-variant-east-asian", "traditional", "important");
    } else {
      document.documentElement.style.removeProperty("font-variant-east-asian");
    }
  }, [i18n]);

  // Always sync with i18n language changes
  useEffect(() => {
    if (i18n.language && i18n.language !== activeLanguage) {
      setActiveLanguage(i18n.language);
    }
  }, [i18n.language, activeLanguage]);

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      localStorage.setItem("i18nextLng", language);
    }
    
    setActiveLanguage(language);
    
    // Apply Traditional Chinese font variant when zh-TW or zh-HK is selected
    if (language === "zh-TW" || language === "zh-HK") {
      document.documentElement.style.setProperty("font-variant-east-asian", "traditional", "important");
    } else {
      document.documentElement.style.removeProperty("font-variant-east-asian");
    }
    
    // Send display data to knowledge base iframe
    try {
      sendKnowledgeBaseDisplayData();
    } catch (error) {
      console.error('Failed to send display data to knowledge base:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer rounded-full h-8 w-8"
        >
          <Languages className="h-[1.2rem] w-[1.2rem] text-primary" />
          <SelectLanguageText />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => changeLanguage('en')}
          className={activeLanguage === 'en' ? 'bg-accent' : ''}
        >
          <EnglishText />
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('zh')}
          className={activeLanguage === 'zh' ? 'bg-accent' : ''}
        >
          <ChineseText />
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('zh-TW')}
          className={(activeLanguage === 'zh-TW' || activeLanguage === 'zh-HK') ? 'bg-accent' : ''}
        >
          <TraditionalText />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 