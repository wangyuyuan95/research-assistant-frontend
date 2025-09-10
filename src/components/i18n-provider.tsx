'use client';

import { useEffect } from 'react';
import '@/lib/i18n';
import i18n from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply language settings on app initialization
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem("i18nextLng");
      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage);
        
        // Apply Traditional Chinese styling if needed
        if (savedLanguage === "zh-TW" || savedLanguage === "zh-HK") {
          document.documentElement.style.setProperty("font-variant-east-asian", "traditional", "important");
        } else {
          document.documentElement.style.removeProperty("font-variant-east-asian");
        }
      }
    }
  }, []);

  return <>{children}</>;
} 