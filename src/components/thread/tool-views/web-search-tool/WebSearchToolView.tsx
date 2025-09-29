import React, { useState } from 'react';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Image as ImageIcon,
  Globe,
  FileText,
  Clock,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Database,
  Filter,
  Star,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ToolViewProps } from '../types';
import { cleanUrl, formatTimestamp, getToolTitle, getLocalizedToolTitle } from '../utils';
import { cn, truncateString } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadingState } from '../shared/LoadingState';
import { extractWebSearchData, WebSearchResult } from './_utils';

export function WebSearchToolView({
  name = 'web-search',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});
  const [resultFilter, setResultFilter] = useState<'all' | 'web_search' | 'knowledge_base'>('all');

  const {
    query,
    searchResults,
    answer,
    images,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  } = extractWebSearchData(
    assistantContent,
    toolContent,
    isSuccess,
    toolTimestamp,
    assistantTimestamp
  );

  const toolTitle = getToolTitle(name);

  // 筛选结果
  const filteredResults = searchResults.filter(result => {
    if (resultFilter === 'all') return true;
    if (resultFilter === 'web_search') return result.source !== 'knowledge_base';
    if (resultFilter === 'knowledge_base') return result.source === 'knowledge_base';
    return true;
  });

  // 统计不同来源的结果数量
  const webSearchCount = searchResults.filter(r => r.source !== 'knowledge_base').length;
  const knowledgeBaseCount = searchResults.filter(r => r.source === 'knowledge_base').length;

  const toggleExpand = (idx: number) => {
    setExpandedResults(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
      return null;
    }
  };

  // 计算搜索词数量
  const getQueryWordCount = (query: string): number => {
    if (!query) return 0;
    // 按空格分词，过滤掉空字符串
    const words = query.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const getResultType = (result: any) => {
    const { url, title, source } = result;

    // 知识库结果
    if (source === 'knowledge_base') {
      return { icon: Database, label: '知识库' };
    }

    // Web搜索结果
    if (url && url.includes('news') || url && url.includes('article') || title.includes('News')) {
      return { icon: FileText, label: t('toolViews.webSearch.article') };
    } else if (url && url.includes('wiki')) {
      return { icon: BookOpen, label: t('toolViews.webSearch.wiki') };
    } else if (url && url.includes('blog')) {
      return { icon: CalendarDays, label: t('toolViews.webSearch.blog') };
    } else {
      return { icon: Globe, label: t('toolViews.webSearch.website') };
    }
  };

  return (
    <Card className="flex border-0 gap-0 shadow-none p-0 rounded-none flex-col h-full overflow-hidden bg-[#FFFFFF] dark:bg-[#202426]">
      <CardHeader className="h-6 bg-[#FFFFFF] dark:bg-[#202426] backdrop-blur-sm px-6 mb-0 gap-0">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center h-5 w-5 p-0 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10">
              <Search className="w-3 h-3 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#0F0F0F] dark:text-[#FFFFFF]">
                {getLocalizedToolTitle(name, t)}
              </CardTitle>
            </div>
          </div>

          {!isStreaming && (
            <Badge
              variant="secondary"
              className={
                actualIsSuccess
                  ? "bg-[#25D175] text-[#FFFFFF]" 
                  : "bg-rose-700 text-[#FFFFFF]"
              }
            >
              {actualIsSuccess ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {actualIsSuccess ? t('toolViews.webSearch.searchCompleted') : t('toolViews.webSearch.searchFailed')}
            </Badge>
          )}
        </div>
      </CardHeader>
      {/* 搜索词展示 */}
      {query && (
        <div className="mx-6 mt-4 mb-2 p-4 bg-[#F2F5FF] dark:bg-[#16191A] rounded-2xl border-1 border-solid border-[#EDEDED] dark:border-[#2A2F31]">
          <div className="text-sm font-bold text-[#] dark:text-[#FFFFFF] mb-3 flex items-center justify-between">
            <span>{t('toolViews.webSearch.searchQuery')} ({getQueryWordCount(query)})</span>
          </div>
          <div className="text-sm text-[#666B71] dark:opacity-30 dark:text-[#FFFFFF] break-words">
            {query}
          </div>
        </div>
      )}
      <CardContent className="relative p-0 pt-4 pb-10 m-6 mt-2 h-full flex-1 overflow-hidden bg-[#F2F5FF] dark:bg-[#16191A] border-1 border-solid border-[#EDEDED] dark:border-[#2A2F31] rounded-2xl">
        {isStreaming && searchResults.length === 0 && !answer ? (
          <LoadingState
            icon={Search}
            iconColor="text-blue-500 dark:text-blue-400"
            bgColor="bg-gradient-to-b from-blue-100 to-blue-50 shadow-inner dark:from-blue-800/40 dark:to-blue-900/60 dark:shadow-blue-950/20"
            title={t('toolViews.webSearch.searchingTheWeb')}
            filePath={query}
            showProgress={true}
          />
        ) : searchResults.length > 0 || answer ? (
          <ScrollArea className="h-full w-full">
            <div className='pb-6 px-6'>              
              {images.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2 opacity-70" />
                    {t('toolViews.webSearch.images')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-1">
                    {images.slice(0, 6).map((image, idx) => (
                      <a
                        key={idx}
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-sm hover:shadow-md"
                      >
                        <img
                          src={image}
                          alt={`Search result ${idx + 1}`}
                          className="object-cover w-full h-32 group-hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                            target.classList.add("p-4");
                          }}
                        />
                        <div className="absolute top-0 right-0 p-1">
                          <Badge variant="secondary" className="bg-black/60 hover:bg-black/70 text-white border-none shadow-md">
                            <ExternalLink className="h-3 w-3" />
                          </Badge>
                        </div>
                      </a>
                    ))}
                  </div>
                  {images.length > 6 && (
                    <Button variant="outline" size="sm" className="mt-2 text-xs">
                      {t('toolViews.webSearch.viewMoreImages', { count: images.length - 6 })}
                    </Button>
                  )}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="mb-4">                  
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-3 flex items-center justify-between">
                    <span>{t('toolViews.webSearch.searchResults')} ({filteredResults.length})</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      <Clock className="h-3 w-3 mr-1.5 opacity-70" />
                      {new Date().toLocaleDateString()}
                    </Badge>
                  </div>
                  
                  {/* 筛选器 */}
                  {(webSearchCount > 0 && knowledgeBaseCount > 0) && (
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <div className="flex gap-1">
                        <Button
                          variant={resultFilter === 'all' ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setResultFilter('all')}
                        >
                          {t('toolViews.webSearch.all')} ({searchResults.length})
                        </Button>
                        <Button
                          variant={resultFilter === 'web_search' ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setResultFilter('web_search')}
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          {t('toolViews.webSearch.webSearch')} ({webSearchCount})
                        </Button>
                        <Button
                          variant={resultFilter === 'knowledge_base' ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setResultFilter('knowledge_base')}
                        >
                          <Database className="h-3 w-3 mr-1" />
                            {t('toolViews.webSearch.knowledgeBase')} ({knowledgeBaseCount})
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className='-mt-4'>
                {filteredResults.map((result, idx) => {
                  const { icon: ResultTypeIcon, label: resultTypeLabel } = getResultType(result);
                  const isExpanded = expandedResults[idx] || false;
                  const favicon = result.url ? getFavicon(result.url) : null;
                  const isKnowledgeBase = result.source === 'knowledge_base';

                  return (
                    <div
                      key={idx}
                      // className={`bg-white dark:bg-zinc-900 border rounded-lg shadow-sm hover:shadow transition-shadow ${
                      //   isKnowledgeBase 
                      //     ? 'border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20'
                      //     : 'border-zinc-200 dark:border-zinc-800'
                      // }`}
                    >
                      <div className="px-4 py-6 relative border-b-1 border-solid border-[#F3F3F3] dark:border-zinc-700">
                        {/* 知识库相似度评分 - 右上角 */}
                        {/* {isKnowledgeBase && result.score && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-1 text-xs font-medium shadow-sm">
                              <Star className="h-3 w-3 mr-1 inline" />
                              {(result.score * 100).toFixed(0)}%
                            </div>
                          </div>
                        )} */}
                        
                        <div className="flex items-start gap-3 mb-2">
                          {favicon && (
                            <img
                              src={favicon}
                              alt=""
                              className="w-5 h-5 mt-1 rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-2 py-0 h-5 font-normal ${
                                  isKnowledgeBase 
                                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                    : 'bg-[#F2F5FF] dark:bg-zinc-800'
                                }`}
                              >
                                <ResultTypeIcon className="h-3 w-3 mr-1 opacity-70" />
                                {resultTypeLabel}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-1 overflow-hidden">
                              {/* 知识库数据集名称前缀 */}
                              {isKnowledgeBase && result.dataset_name && (
                                <div className="flex-shrink-0 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400">
                                  <span className="bg-blue-50 dark:bg-blue-950/50 w-4 h-4 rounded-sm flex items-center justify-center mr-1">
                                    <Database className="w-3 h-3" />
                                  </span>
                                  <span className="mr-2 border-r border-zinc-200 dark:border-zinc-700 pr-2">
                                    {truncateString(result.dataset_name, 20)}
                                  </span>
                                </div>
                              )}
                              
                              {/* 标题 */}
                              {result.url ? (
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-md font-medium text-blue-600 dark:text-blue-400 hover:underline truncate flex-1 min-w-0"
                                >
                                  {truncateString(cleanUrl(result.title), isKnowledgeBase ? 40 : 50)}
                                </a>
                              ) : (
                                <div className="text-md font-medium text-zinc-900 dark:text-zinc-100 truncate flex-1 min-w-0">
                                  {truncateString(result.title, isKnowledgeBase ? 40 : 50)}
                                </div>
                              )}
                            </div>
                            
                            {/* Web搜索结果的URL */}
                            {!isKnowledgeBase && result.url && (
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 flex items-center overflow-hidden">
                                <Globe className="h-3 w-3 mr-1.5 flex-shrink-0 opacity-70" />
                                <span className="break-all truncate">{truncateString(cleanUrl(result.url), 70)}</span>
                              </div>
                            )}
                          </div>
                          {/* <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full"
                                  onClick={() => toggleExpand(idx)}
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{isExpanded ? 'Show less' : 'Show more'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider> */}
                        </div>

                        {/* 内容显示 */}
                        {(result.content || result.snippet) && (
                          <div className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-2 break-words overflow-hidden">
                            【{t('toolViews.webSearch.relatedContent')}】：{truncateString(result.content || result.snippet, 200)}
                          </div>
                        )}

                        {/* 重要关键词 */}
                        {isKnowledgeBase && result.important_keywords && result.important_keywords.length > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('toolViews.webSearch.keywords')}:</span>
                            <div className="flex flex-wrap gap-1 overflow-hidden">
                              {result.important_keywords.map((keyword, kidx) => (
                                <Badge 
                                  key={kidx} 
                                  variant="secondary" 
                                  className="text-xs px-1.5 py-0 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 break-words max-w-full"
                                >
                                  {truncateString(keyword, 20)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="bg-[#F2F5FF] px-4 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 p-3 flex justify-between items-center">
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {t('toolViews.webSearch.source')}: {cleanUrl(result.url)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-white dark:bg-zinc-900"
                            asChild
                          >
                            <a href={result.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                              {t('toolViews.webSearch.visitSite')}
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
              <Search className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
              {t('toolViews.webSearch.noResultsFound')}
            </h3>
            <div className="bg-[#F2F5FF] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 w-full max-w-md text-center mb-4 shadow-sm">
              <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
                {query || 'Unknown query'}
              </code>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t('toolViews.webSearch.tryRefiningSearch')}
            </p>
          </div>
        )}
        <div className="absolute bottom-0 w-full px-4 py-2 h-10 bg-gradient-to-r from-[#F2F5FF]/90 to-[#F2F5FF]/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
          <div className="h-full flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {!isStreaming && searchResults.length > 0 && (
              <Badge variant="outline" className="h-6 py-0.5">
                {filteredResults.length} {t('toolViews.webSearch.results')}
              </Badge>
            )}
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {actualToolTimestamp && !isStreaming
              ? formatTimestamp(actualToolTimestamp)
              : actualAssistantTimestamp
                ? formatTimestamp(actualAssistantTimestamp)
                : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 