import { ThemeProvider } from '@/components/home/theme-provider';
import { siteConfig } from '@/lib/site';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import { I18nProvider } from '@/components/i18n-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: 'black',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description:
    'Research Assistant is a fully open source AI assistant that helps you accomplish research tasks with ease. Through natural conversation, Research Assistant becomes your digital companion for data analysis, information gathering, and research challenges.',
  keywords: [
    'AI',
    'artificial intelligence',
    'research assistant',
    'data analysis',
    'information gathering',
    'AI assistant',
    'open source',
    'research',
    'academic research',
  ],
  authors: [{ name: 'Research Assistant Team', url: 'https://research-assistant.ai' }],
  creator:
    'Research Assistant Development Team',
  publisher:
    'Research Assistant Development Team',
  category: 'Technology',
  applicationName: 'Research Assistant',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'Research Assistant - Open Source AI Research Tool',
    description:
      'Research Assistant is a fully open source AI assistant that helps you accomplish research tasks with ease through natural conversation.',
    url: siteConfig.url,
    siteName: 'Research Assistant',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'Research Assistant - Open Source AI Research Tool',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Research Assistant - Open Source AI Research Tool',
    description:
      'Research Assistant is a fully open source AI assistant that helps you accomplish research tasks with ease through natural conversation.',
    creator: '@research_ai',
    site: '@research_ai',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'Research Assistant - Open Source AI Research Tool',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: '48x48', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: '64x64', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  // manifest: "/manifest.json",
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon links - explicit declarations to ensure favicon.svg is always used */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-PCHSN4M2');`}
        </Script>
        {/* End Google Tag Manager */}
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PCHSN4M2"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              {children}
              <Toaster />
            </Providers>
            <Analytics />
            <GoogleAnalytics gaId="G-6ETJFB3PT3" />
            <SpeedInsights />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
