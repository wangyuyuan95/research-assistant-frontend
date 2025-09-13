'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/AuthProvider';
import { sendKnowledgeBaseDisplayData } from '@/lib/kb-integration';

interface KnowledgeBaseIframeProps {
  // Add props if needed
}

export default function KnowledgeBasePage({}: KnowledgeBaseIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasError, setHasError] = useState(false);
  const { resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();

  // Get the knowledge base URL from environment
  const kbUrl = process.env.NEXT_PUBLIC_KB_URL;

  // Check if user has kb_api_key, if not, sign out
  useEffect(() => {
    if (!user?.email) return;

    const kbApiKey = localStorage.getItem('kb_api_key');
    if (!kbApiKey) {
      console.log('🚪 No kb_api_key found, signing out user to re-authenticate');
      signOut();
    }
  }, [user?.email, signOut]);

  // Send authentication data to iframe
  const sendAuthData = useCallback(() => {
    if (!iframeRef.current || !kbUrl || !user?.email) return;

    try {
      // Collect only authentication related data from localStorage
      const authData = {
        kb_integration_details: localStorage.getItem('kb_integration_details'),
      };

      // Filter out null values
      const filteredAuthData = Object.fromEntries(
        Object.entries(authData).filter(([_, value]) => value !== null)
      );

      console.log('🔗 Sending authentication data to iframe:', filteredAuthData);

      // Send authentication data to iframe via postMessage
      iframeRef.current.contentWindow?.postMessage(
        {
          type: 'KNOWLEDGE_BASE_AUTH_DATA',
          data: filteredAuthData,
        },
        '*'
      );

      console.log('✅ Authentication data sent successfully');
    } catch (error) {
      console.error('Failed to send authentication data to iframe:', error);
    }
  }, [kbUrl, user?.email]);

  // Send display data to iframe
  const sendDisplayData = useCallback(() => {
    if (!iframeRef.current || !kbUrl) return;
    sendKnowledgeBaseDisplayData();
  }, [kbUrl]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setHasError(false);
  }, []);

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setHasError(true);
  }, []);

  // Listen for iframe messages
  useEffect(() => {
    if (!kbUrl) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'IFRAME_READY') {
        console.log('📨 Received IFRAME_READY message:', event.data);
        sendAuthData();
        sendDisplayData();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [kbUrl, sendAuthData, sendDisplayData]);



  // Check if URL is configured
  if (!kbUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('knowledgeBase.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('knowledgeBase.configError')}</p>
        </div>
      </div>
    );
  }

  // Construct the iframe URL
  const iframeUrl = `${kbUrl}/login`;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-shrink-0 p-4 border-b">
        <h1 className="text-2xl font-bold">{t('knowledgeBase.pageTitle')}</h1>
      </div>
      
      <div className="flex-1 min-h-0 relative">        
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background bg-(image:--BG)">
            <div className="text-center">
              <p className="text-sm text-destructive">{t('knowledgeBase.iframeError')}</p>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={t('knowledgeBase.pageTitle')}
        />
      </div>
    </div>
  );
}

 