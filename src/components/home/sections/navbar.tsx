'use client';

import { ThemeToggle } from '@/components/home/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useScroll } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/AuthProvider';
import { useTranslation } from 'react-i18next';

const INITIAL_WIDTH = '70rem';
const MAX_WIDTH = '800px';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const drawerVariants = {
  hidden: { opacity: 0, y: 100 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 200,
    },
  },
  exit: {
    opacity: 0,
    y: 100,
    transition: { duration: 0.1 },
  },
};

// Component to handle app name with hydration safety
function AppName() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and before hydration, show a default fallback
  if (!mounted) {
    return <span className="text-xl font-bold">Research Assistant</span>;
  }

  // After hydration, show the translated text
  return <span className="text-xl font-bold">{t('navbar.appName')}</span>;
}

// Component to handle dashboard text with hydration safety
function DashboardText() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and before hydration, show a default fallback
  if (!mounted) {
    return <>Dashboard</>;
  }

  // After hydration, show the translated text
  return <>{t('navbar.dashboard')}</>;
}

// Component to handle mobile app name with hydration safety
function MobileAppName() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and before hydration, show a default fallback
  if (!mounted) {
    return <span className="text-xl font-bold">Research Assistant</span>;
  }

  // After hydration, show the translated text
  return <span className="text-xl font-bold">{t('navbar.appName')}</span>;
}

export function Navbar() {
  const { scrollY } = useScroll();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setHasScrolled(latest > 10);
    });
    return unsubscribe;
  }, [scrollY]);

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const handleOverlayClick = () => setIsDrawerOpen(false);

  const logoSrc = !mounted
    ? '/research-assistant-icon.svg'
    : resolvedTheme === 'dark'
    ? '/research-assistant-icon.svg'
    : '/research-assistant-icon.svg';

  return (
    <header
      className={cn(
        'sticky z-50 mx-4 flex justify-center transition-all duration-300 md:mx-0',
        hasScrolled ? 'top-6' : 'top-4 mx-0',
      )}
    >
      <motion.div
        initial={{ width: INITIAL_WIDTH }}
        animate={{ width: hasScrolled ? MAX_WIDTH : INITIAL_WIDTH }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div
          className={cn(
            'mx-auto max-w-7xl rounded-2xl transition-all duration-300  xl:px-0',
            // hasScrolled
            //   ? 'px-2 border border-border backdrop-blur-lg bg-background/75'
            //   : 
              'shadow-none px-7',
          )}
        >
          <div className="flex h-[56px] items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/hk-logo.png" 
                alt="CityU Logo" 
                className="h-16 w-auto"
              />
              <AppName />
            </Link>

            <div className="flex flex-row items-center gap-1 md:gap-3 shrink-0">
              <div className="flex items-center space-x-3">
                {user && (
                  <Link
                    className="bg-secondary h-8 hidden md:flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-fit px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12]"
                    href="/dashboard"
                  >
                    <DashboardText />
                  </Link>
                )}
              </div>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Drawer - Simplified since no navigation links */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={overlayVariants}
              transition={{ duration: 0.2 }}
              onClick={handleOverlayClick}
            />

            <motion.div
              className="fixed inset-x-0 w-[95%] mx-auto bottom-3 bg-background border border-border p-4 rounded-xl shadow-lg"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={drawerVariants}
            >
              {/* Mobile menu content */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-3">
                    <img 
                      src="/hk-logo.png" 
                      alt="CityU Logo" 
                      className="h-16 w-auto"
                    />
                    <MobileAppName />
                  </Link>
                  <button
                    onClick={toggleDrawer}
                    className="border border-border rounded-md p-1 cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  {/* {user && (
                    <Link
                      href="/dashboard"
                      className="bg-secondary h-8 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-full px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12] hover:bg-secondary/80 transition-all ease-out active:scale-95"
                    >
                      <DashboardText />
                    </Link>
                  )} */}
                  <div className="flex justify-between">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
