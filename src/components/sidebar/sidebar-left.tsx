'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, Database } from 'lucide-react';
import Image from 'next/image';
import { LanguageToggle } from '@/components/language-toggle';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';

import { NavAgents } from '@/components/sidebar/nav-agents';
import { NavUserWithTeams } from '@/components/sidebar/nav-user-with-teams';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import lightSliderTitleSVG from '#/light/sliderTitle.svg';
import darkSliderTitleSVG from '#/dark/sliderTitle.svg';
import sliderLogoSVG from '#/sliderLogo.svg';
import userKnowledgeSVG from '#/user-knowledge-ico.svg';

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { theme, resolvedTheme } = useTheme();
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: 'Loading...',
    email: 'loading@example.com',
    avatar: '',
  });
  const { t } = useTranslation();

  // Check if knowledge base feature is enabled
  const kbUrl = process.env.NEXT_PUBLIC_KB_URL;
  const isKBEnabled = Boolean(kbUrl);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setUser({
          name:
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            'User',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || '',
        });
      }
    };

    fetchUserData();
  }, []);

  // Handle keyboard shortcuts (CMD+B) for consistency
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        // We'll handle this in the parent page component
        // to ensure proper coordination between panels
        setOpen(!state.startsWith('expanded'));

        // Broadcast a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent('sidebar-left-toggled', {
            detail: { expanded: !state.startsWith('expanded') },
          }),
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, setOpen]);

  return (
    <Sidebar
      collapsible="icon"
      className={cn("bg-[#FFFFFF] dark:bg-[#202426] pt-[28px] pb-[43px] border-r-0 backdrop-blur-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']", state !== 'collapsed' ? "px-[32px]" : "px-[8px]")}
      {...props}
    >
      <SidebarHeader className={cn("mb-12", state === 'collapsed' ? "items-center" : "")}>
        <div className={cn("flex h-[40px] items-center relative")}>
          <Link href="/dashboard" className="flex items-center">
            {(state === 'collapsed') && (
              <Image src={sliderLogoSVG} alt="" style={{ width: 38, height: 38 }} />
            )}
            {(state !== 'collapsed' && resolvedTheme !== 'dark') && (
              <Image src={lightSliderTitleSVG} alt="" style={{ width: 178, height: 38 }} />
            )}
            {(state !== 'collapsed' && resolvedTheme === 'dark') && (
              <Image src={darkSliderTitleSVG} alt="" style={{ width: 178, height: 38 }} />
            )}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setOpenMobile(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Open menu</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative mb-10r">
        <div className="relative">
          <NavAgents />
        </div>
      </SidebarContent>
      <SidebarFooter className={cn("w-full h-[159px] px-2 m-0 bg-[#FFFFFF] shadow-[0px_4px_20px_0px_#ECF1FF] rounded-xl gap-0")}>
        {isKBEnabled && (
          <SidebarMenu className={cn('gap-0 h-[68px] justify-center', state === 'collapsed' ? "items-center" : "")}>
            {/* <Separator/> */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild >
                <Link href="/knowledge-base">
                  <Image src={userKnowledgeSVG} alt="" style={{ width: 14, height: 14 }} />
                  <span className='text-[##0F0F0F] text-[16px]'>{t('sidebar.personalKnowledgeBase')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* <Separator/> */}
          </SidebarMenu>
        )}
        <div className='w-full px-2'>
          <div className='h-[1px] bg-[#F3F3F3]'></div>
        </div>
        <NavUserWithTeams user={user} state={state} />
      </SidebarFooter>
      <SidebarRail />
      <SidebarTrigger />
    </Sidebar>
  );
}
