'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Search, Database, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKnowledgeBaseSelection } from '@/hooks/react-query/knowledge-base/use-knowledge-base-selection';
import { useTranslation } from 'react-i18next';

interface KnowledgeBaseSelectorProps {
  className?: string;
  disabled?: boolean;
}

export const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({
  className,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    knowledgeBases,
    isLoading,
    error,
    isKBSelected,
    toggleKB,
    selectAllKBs,
    deselectAllKBs,
    getSelectedCount,
    getAllCount,
    isAllSelected,
    isNoneSelected,
  } = useKnowledgeBaseSelection();

  // Check if knowledge base feature is enabled
  const kbUrl = process.env.NEXT_PUBLIC_KB_URL;
  const isKBEnabled = Boolean(kbUrl);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Don't render if KB is not enabled
  if (!isKBEnabled) {
    return null;
  }

  // Filter knowledge bases based on search query
  const filteredKBs = knowledgeBases.filter((kb) =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = getSelectedCount();
  const totalCount = getAllCount();

  const getDisplayText = () => {
    if (isLoading) return t('knowledgeBase.loading', '加载中...');
    if (error) return t('knowledgeBase.error', '错误');
    if (selectedCount === 0) return t('knowledgeBase.selectKB', '知识库');
    if (selectedCount === 1) {
      const selectedKB = knowledgeBases.find(kb => isKBSelected(kb.id));
      return selectedKB?.name || t('knowledgeBase.selected', '已选择');
    }
    return t('knowledgeBase.selectedCount', `已选择 ${selectedCount} 个`, { count: selectedCount });
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectAllKBs();
  };

  const handleDeselectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deselectAllKBs();
  };

  const handleToggleKB = (kbId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleKB(kbId);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-2 text-xs font-normal justify-between min-w-[80px] max-w-[200px]',
                  selectedCount > 0 ? 'text-primary' : 'text-muted-foreground',
                  className
                )}
                disabled={disabled || isLoading}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Database className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{getDisplayText()}</span>
                </div>
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-[300px] max-h-[400px] overflow-hidden"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {/* Search input */}
              <div className="p-2 pb-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('knowledgeBase.searchPlaceholder', '搜索知识库...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full pl-7 pr-2 py-1 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Action buttons */}
              {totalCount > 0 && (
                <>
                  <div className="px-2 py-1">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleSelectAll}
                        disabled={isAllSelected()}
                      >
                        {t('knowledgeBase.selectAll', '全选')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleDeselectAll}
                        disabled={isNoneSelected()}
                      >
                        {t('knowledgeBase.deselectAll', '全不选')}
                      </Button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Knowledge base list */}
              <div className="max-h-[250px] overflow-y-auto">
                {isLoading && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    {t('knowledgeBase.loading', '加载中...')}
                  </div>
                )}

                {error && (
                  <div className="p-4 text-center text-xs text-red-500">
                    {t('knowledgeBase.loadError', '加载失败')}
                  </div>
                )}

                {!isLoading && !error && filteredKBs.length === 0 && totalCount === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    {t('knowledgeBase.noKnowledgeBases', '暂无知识库')}
                  </div>
                )}

                {!isLoading && !error && filteredKBs.length === 0 && totalCount > 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    {t('knowledgeBase.noSearchResults', '无搜索结果')}
                  </div>
                )}

                {filteredKBs.map((kb) => {
                  const isSelected = isKBSelected(kb.id);
                  return (
                    <DropdownMenuItem
                      key={kb.id}
                      className="px-2 py-1.5 cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                      onClick={(e) => handleToggleKB(kb.id, e)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <CheckSquare className="h-3 w-3 text-primary" />
                          ) : (
                            <Square className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              'text-xs font-medium truncate',
                              isSelected ? 'text-primary' : 'text-foreground'
                            )}>
                              {kb.name}
                            </span>
                                                          <div className="flex gap-1 text-xs text-muted-foreground ml-2">
                                <span>{kb.document_count} {t('knowledgeBase.documents')}</span>
                              </div>
                          </div>
                          {kb.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              {kb.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {selectedCount > 0 
              ? t('knowledgeBase.selectedTooltip', `已选择 ${selectedCount} 个知识库`, { count: selectedCount })
              : t('knowledgeBase.selectTooltip', '选择知识库进行提问')
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 