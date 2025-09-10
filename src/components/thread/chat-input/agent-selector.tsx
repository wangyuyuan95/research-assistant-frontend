'use client';

import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Plus, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAgents } from '@/hooks/react-query/agents/use-agents';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface AgentSelectorProps {
  selectedAgentId?: string;
  onAgentSelect: (agentId: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function AgentSelector({
  selectedAgentId,
  onAgentSelect,
  disabled = false,
  className,
}: AgentSelectorProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  
  const { data: agentsResponse, isLoading } = useAgents({
    limit: 100,
    sort_by: 'name',
    sort_order: 'asc'
  });
  
  const agents = agentsResponse?.agents || [];
  
  const selectedAgent = agents?.find(a => a.agent_id === selectedAgentId);
  const defaultAgent = agents?.find(a => a.is_default);
  
  useEffect(() => {
    if (!selectedAgentId && defaultAgent && !isLoading) {
      onAgentSelect(defaultAgent.agent_id);
    }
  }, [selectedAgentId, defaultAgent, isLoading, onAgentSelect]);

  const handleCreateNew = () => {
    setOpen(false);
    router.push('/agents');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between text-xs h-8',
            !selectedAgent && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            <Bot className="h-3 w-3" />
            {selectedAgent?.name || t('agents.researchAssistant')}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={t('agents.selectAnAgent')} className="h-9" />
          <CommandList>
            <CommandEmpty>{t('common.no_agents_found')}</CommandEmpty>
            <CommandGroup>
              {agents?.map((agent) => (
                <CommandItem
                  key={agent.agent_id}
                  value={agent.agent_id}
                  onSelect={() => {
                    onAgentSelect(agent.agent_id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedAgentId === agent.agent_id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{agent.name}</span>
                      {agent.is_default && (
                        <Badge variant="secondary" className="text-xs h-4 px-1">
                          {t('agents.default')}
                        </Badge>
                      )}
                    </div>
                    {agent.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.description}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateNew}
                className="text-muted-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('agents.createNewAgent')}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 