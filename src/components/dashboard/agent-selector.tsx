'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, Star, Bot, Edit, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/hooks/react-query/agents/use-agents';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CreateAgentDialog } from '@/app/(dashboard)/agents/_components/create-agent-dialog';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import moreBlueIcoSVG from '#/more-blue-ico.svg';
interface AgentSelectorProps {
  onAgentSelect?: (agentId: string | undefined) => void;
  selectedAgentId?: string;
  className?: string;
  variant?: 'default' | 'heading';
}

export function AgentSelector({ 
  onAgentSelect, 
  selectedAgentId, 
  className,
  variant = 'default'
}: AgentSelectorProps) {
  const { t } = useTranslation();
  const { data: agentsResponse, isLoading, refetch: loadAgents } = useAgents({
    limit: 100,
    sort_by: 'name',
    sort_order: 'asc'
  });
  
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const agents = agentsResponse?.agents || [];
  const defaultAgent = agents.find(agent => agent.is_default);
  const currentAgent = selectedAgentId 
    ? agents.find(agent => agent.agent_id === selectedAgentId)
    : null;

  const displayName = currentAgent?.name || defaultAgent?.name || t('agents.researchAssistant');
  const agentAvatar = currentAgent?.avatar;
  const isUsingResearchAssistant = !currentAgent && !defaultAgent;

  const handleAgentSelect = (agentId: string | undefined) => {
    onAgentSelect?.(agentId);
    setIsOpen(false);
  };

  const handleCreateAgent = () => {
    setCreateDialogOpen(true);
    setIsOpen(false);
  };

  const handleManageAgents = () => {
    router.push('/agents');
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onAgentSelect?.(undefined);
    setIsOpen(false);
  };

  if (variant === 'heading') {
    return (
      <>
        <div className={cn("flex items-center", className)}>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-1 px-2 py-1 h-auto hover:bg-transparent hover:text-primary transition-colors group"
              >
                <span className="underline decoration-dashed underline-offset-6 decoration-muted-foreground/50 tracking-tight text-2xl font-semibold leading-tight text-[#003CFF]">
                  {displayName}
                  <span className="text-muted-foreground ml-1">
                    {agentAvatar && agentAvatar}
                  </span>
                </span>
                <div className="flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <Image src={moreBlueIcoSVG} alt="" style={{ width: 16, height: 14 }} />
                  <Edit className="h-4 w-4 text-muted-foreground ml-1" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-[320px]">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{t('agents.selectAnAgent')}</p>
                <p className="text-xs text-muted-foreground">{t('agents.selectMostHelpfulAgent')}</p>
              </div>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => handleClearSelection()}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="font-medium truncate">{t('agents.researchAssistant')}</span>
                    <Badge variant="outline" className="text-xs px-1 py-0 flex-shrink-0">
                      {t('agents.default')}
                    </Badge>
                  </div>
                  {isUsingResearchAssistant && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground pl-6 line-clamp-2">
                  {t('agents.personalAICopilot')}
                </span>
              </DropdownMenuItem>

              {/* {isLoading ? (
                <DropdownMenuItem disabled className="flex flex-col items-start gap-1 p-3">
                  <div className="flex items-center gap-2 w-full">
                    <Bot className="h-4 w-4 text-muted-foreground animate-pulse" />
                    <span className="text-sm text-muted-foreground">{t('agents.loadingAgents')}</span>
                  </div>
                </DropdownMenuItem>
              ) : agents.length > 0 ? (
                <>
                  {agents.map((agent) => (
                    <DropdownMenuItem
                      key={agent.agent_id}
                      onClick={() => handleAgentSelect(agent.agent_id)}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {agent.avatar}
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <span className="font-medium truncate">{agent.name}</span>
                          {agent.is_default && (
                            <Badge variant="secondary" className="text-xs px-1 py-0 flex-shrink-0">
                              <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                              {t('agents.system')}
                            </Badge>
                          )}
                        </div>
                        {currentAgent?.agent_id === agent.agent_id && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      {agent.description && (
                        <span className="text-xs text-muted-foreground pl-6 line-clamp-2">
                          {agent.description}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              ) : null} */}

              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleCreateAgent} className="cursor-pointer">
                {t('agents.moreAgentsComingSoon')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 px-3 py-2 h-auto min-w-[200px] justify-between"
            >
              <div className="flex items-center gap-2">
                {isUsingResearchAssistant ? (
                  <User className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">
                      {displayName}
                    </span>
                    {isUsingResearchAssistant && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Default
                      </Badge>
                    )}
                    {currentAgent?.is_default && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                        System
                      </Badge>
                    )}
                  </div>
                  {currentAgent?.description ? (
                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">
                      {currentAgent.description}
                    </span>
                  ) : isUsingResearchAssistant ? (
                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">
                      Your personal AI employee
                    </span>
                  ) : null}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="start" className="w-[280px]">
            <DropdownMenuItem
              onClick={() => handleClearSelection()}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1 flex-1">
                  <span className="font-medium">{t('agents.researchAssistant')}</span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {t('agents.default')}
                  </Badge>
                </div>
                {isUsingResearchAssistant && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-xs text-muted-foreground pl-6 line-clamp-2">
                {t('agents.personalAIEmployee')}
              </span>
            </DropdownMenuItem>

            {isLoading ? (
              <DropdownMenuItem disabled className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center gap-2 w-full">
                  <Bot className="h-4 w-4 text-muted-foreground animate-pulse" />
                  <span className="text-sm text-muted-foreground">{t('agents.loadingAgents')}</span>
                </div>
              </DropdownMenuItem>
            ) : agents.length > 0 ? (
              <>
                {agents.map((agent) => (
                  <DropdownMenuItem
                    key={agent.agent_id}
                    onClick={() => handleAgentSelect(agent.agent_id)}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-1 flex-1">
                        <span className="font-medium">{agent.name}</span>
                        {agent.is_default && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                            {t('agents.system')}
                          </Badge>
                        )}
                      </div>
                      {currentAgent?.agent_id === agent.agent_id && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    {agent.description && (
                      <span className="text-xs text-muted-foreground pl-6 line-clamp-2">
                        {agent.description}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleCreateAgent} className="cursor-pointer">
              <Plus className="h-4 w-4" />
              {t('agents.createNewAgent')}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleManageAgents} className="cursor-pointer">
              <Bot className="h-4 w-4" />
              {t('agents.manageAllAgents')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <CreateAgentDialog
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onAgentCreated={loadAgents}
      />
    </>
  );
}