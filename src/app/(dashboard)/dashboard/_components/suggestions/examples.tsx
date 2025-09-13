'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Bot,
  Briefcase,
  Settings,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Users,
  Shield,
  Zap,
  Target,
  Brain,
  Globe,
  Heart,
  PenTool,
  Code,
  Camera,
  Calendar,
  DollarSign,
  Rocket,
  FlaskConical,
  Microscope,
  Dna,
  Pill,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import Image from 'next/image'
import lightRefreshSVG from '#/light/refresh-ico.svg';
import darkRefreshSVG from '#/dark/refresh-ico.svg';

type PromptExample = {
  titleKey: string;
  queryKey: string;
  icon: React.ReactNode;
};

const allPrompts: PromptExample[] = [
  {
    titleKey: 'examples.mofsDrugRelease.title',
    queryKey: 'examples.mofsDrugRelease.query',
    icon: <FlaskConical className="text-green-700 dark:text-green-400" size={16} />,
  },
  {
    titleKey: 'examples.plgaBBBModification.title',
    queryKey: 'examples.plgaBBBModification.query',
    icon: <Brain className="text-blue-700 dark:text-blue-400" size={16} />,
  },
  {
    titleKey: 'examples.hydrogelImmunotherapy.title',
    queryKey: 'examples.hydrogelImmunotherapy.query',
    icon: <Shield className="text-rose-700 dark:text-rose-400" size={16} />,
  },
  {
    titleKey: 'examples.crisprOffTargetControl.title',
    queryKey: 'examples.crisprOffTargetControl.query',
    icon: <Dna className="text-purple-700 dark:text-purple-400" size={16} />,
  },
  {
    titleKey: 'examples.adcLinkerPayload.title',
    queryKey: 'examples.adcLinkerPayload.query',
    icon: <Target className="text-orange-700 dark:text-orange-400" size={16} />,
  },
  {
    titleKey: 'examples.aiPeptideAssembly.title',
    queryKey: 'examples.aiPeptideAssembly.query',
    icon: <Bot className="text-indigo-700 dark:text-indigo-400" size={16} />,
  },
  {
    titleKey: 'examples.implantAntibacterialTech.title',
    queryKey: 'examples.implantAntibacterialTech.query',
    icon: <Settings className="text-emerald-700 dark:text-emerald-400" size={16} />,
  },
  {
    titleKey: 'examples.organChipToxicity.title',
    queryKey: 'examples.organChipToxicity.query',
    icon: <Microscope className="text-cyan-700 dark:text-cyan-400" size={16} />,
  },
  {
    titleKey: 'examples.mrnaVaccineDelivery.title',
    queryKey: 'examples.mrnaVaccineDelivery.query',
    icon: <Pill className="text-teal-700 dark:text-teal-400" size={16} />,
  },
  {
    titleKey: 'examples.cryoemGpcrdynamics.title',
    queryKey: 'examples.cryoemGpcrdynamics.query',
    icon: <Sparkles className="text-fuchsia-700 dark:text-fuchsia-400" size={16} />,
  },
];

// Function to get random prompts
const getRandomPrompts = (count: number = 3): PromptExample[] => {
  const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const Examples = ({
  onSelectPrompt,
}: {
  onSelectPrompt?: (query: string) => void;
}) => {
  const { t } = useTranslation();
  const { theme, resolvedTheme } = useTheme();
  const [displayedPrompts, setDisplayedPrompts] = useState<PromptExample[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize with random prompts on mount
  useEffect(() => {
    setDisplayedPrompts(getRandomPrompts(10));
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setDisplayedPrompts(getRandomPrompts(3));
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center my-4">
        <span className="text-xs text-muted font-bold">{t('examples.quickStarts')}</span>
        <div
          onClick={handleRefresh}
          className="h-6 text-xs text-muted hover:text-foreground"
        >
          <motion.div
            animate={isRefreshing ? {rotate: 360} : null}
            transition={{ duration: 0.5, ease: 'easeInOut'}}
          >
            {resolvedTheme !== 'dark' && <Image src={lightRefreshSVG} alt="" style={{ width: 17, height: 15 }} />}
            {resolvedTheme === 'dark' && <Image src={darkRefreshSVG} alt="" style={{ width: 17, height: 15 }} />}
          </motion.div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayedPrompts.map((prompt, index) => (
          <Card
            key={index}
            className="group cursor-pointer h-full transition-all bg-sidebar hover:bg-neutral-100 dark:hover:bg-neutral-800/60 shadow-lg"
            onClick={() => onSelectPrompt && onSelectPrompt(t(prompt.queryKey))}
          >
            <CardHeader className="px-4 flex flex-row items-center gap-3">
                <div className="flex items-center gap-2">
                    {prompt.icon}
                </div>
                <CardTitle className="font-normal group-hover:text-foreground transition-all text-muted-foreground text-sm line-clamp-3">
                    {t(prompt.titleKey)}
                </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};