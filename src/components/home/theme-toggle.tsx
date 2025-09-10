'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { sendKnowledgeBaseDisplayData } from '@/lib/kb-integration';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    // Send display data to knowledge base iframe
    try {
      sendKnowledgeBaseDisplayData();
    } catch (error) {
      console.error('Failed to send display data to knowledge base:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleThemeToggle}
      className="cursor-pointer rounded-full h-8 w-8"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
