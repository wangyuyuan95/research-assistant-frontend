import React, { useState } from 'react';
import {
  FileDiff,
  CheckCircle,
  AlertTriangle,
  CircleDashed,
  Loader2,
  File,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineDiff,
  DiffStats,
  extractFromNewFormat,
  extractFromLegacyFormat,
  generateLineDiff,
  generateCharDiff,
  calculateDiffStats
} from './_utils';
import { extractFilePath, extractStrReplaceContent, extractToolData, formatTimestamp, getToolTitle, getLocalizedToolTitle } from '../utils';
import { ToolViewProps } from '../types';
import { LoadingState } from '../shared/LoadingState';

const UnifiedDiffView: React.FC<{ lineDiff: LineDiff[] }> = ({ lineDiff }) => (
  <div className="bg-white dark:bg-zinc-950 font-mono text-sm overflow-x-auto -mt-2">
    <table className="w-full border-collapse">
      <tbody>
        {lineDiff.map((line, i) => (
          <tr
            key={i}
            className={cn(
              "hover:bg-[#F2F5FF] dark:hover:bg-zinc-900",
              line.type === 'removed' && "bg-red-50 dark:bg-red-950/30",
              line.type === 'added' && "bg-emerald-50 dark:bg-emerald-950/30",
            )}
          >
            <td className="w-10 text-right select-none py-0.5 pr-1 pl-4 text-xs text-zinc-500 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800">
              {line.lineNumber}
            </td>
            <td className="pl-2 py-0.5 w-6 select-none">
              {line.type === 'removed' && <Minus className="h-3.5 w-3.5 text-red-500" />}
              {line.type === 'added' && <Plus className="h-3.5 w-3.5 text-emerald-500" />}
            </td>
            <td className="w-full px-3 py-0.5">
              <div className="overflow-x-auto max-w-full text-xs">
                {line.type === 'removed' && <span className="text-red-700 dark:text-red-400">{line.oldLine}</span>}
                {line.type === 'added' && <span className="text-emerald-700 dark:text-emerald-400">{line.newLine}</span>}
                {line.type === 'unchanged' && <span className="text-zinc-700 dark:text-zinc-300">{line.oldLine}</span>}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SplitDiffView: React.FC<{ lineDiff: LineDiff[] }> = ({ lineDiff }) => (
  <div className="bg-white dark:bg-zinc-950 font-mono text-sm overflow-x-auto -my-2">
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs">
          <th className="p-2 text-left text-zinc-500 dark:text-zinc-400 w-1/2">Removed</th>
          <th className="p-2 text-left text-zinc-500 dark:text-zinc-400 w-1/2">Added</th>
        </tr>
      </thead>
      <tbody>
        {lineDiff.map((line, i) => (
          <tr key={i}>
            <td
              className={cn(
                "p-2 align-top",
                line.type === 'removed' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' : '',
                line.oldLine === null ? 'bg-zinc-100 dark:bg-zinc-900' : ''
              )}
            >
              {line.oldLine !== null ? (
                <div className="flex">
                  <div className="w-8 text-right pr-2 select-none text-xs text-zinc-500 dark:text-zinc-400">
                    {line.lineNumber}
                  </div>
                  {line.type === 'removed' &&
                    <Minus className="h-3.5 w-3.5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  }
                  <div className="overflow-x-auto">
                    <span className="break-all">{line.oldLine}</span>
                  </div>
                </div>
              ) : null}
            </td>
            <td
              className={cn(
                "p-2 align-top",
                line.type === 'added' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : '',
                line.newLine === null ? 'bg-zinc-100 dark:bg-zinc-900' : ''
              )}
            >
              {line.newLine !== null ? (
                <div className="flex">
                  <div className="w-8 text-right pr-2 select-none text-xs text-zinc-500 dark:text-zinc-400">
                    {line.lineNumber}
                  </div>
                  {line.type === 'added' &&
                    <Plus className="h-3.5 w-3.5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                  }
                  <div className="overflow-x-auto">
                    <span className="break-all">{line.newLine}</span>
                  </div>
                </div>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ErrorState: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
      <div className="text-center w-full max-w-xs">
        <AlertTriangle className="h-16 w-16 mx-auto mb-6 text-amber-500" />
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          {t('toolViews.stringReplace.invalidStringReplacement')}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t('toolViews.stringReplace.couldNotExtractStrings')}
        </p>
      </div>
    </div>
  );
};

export function StrReplaceToolView({
  name = 'str-replace',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps): JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  let filePath: string | null = null;
  let oldStr: string | null = null;
  let newStr: string | null = null;
  let actualIsSuccess = isSuccess;
  let actualToolTimestamp = toolTimestamp;
  let actualAssistantTimestamp = assistantTimestamp;

  const assistantNewFormat = extractFromNewFormat(assistantContent);
  const toolNewFormat = extractFromNewFormat(toolContent);

  if (assistantNewFormat.filePath || assistantNewFormat.oldStr || assistantNewFormat.newStr) {
    filePath = assistantNewFormat.filePath;
    oldStr = assistantNewFormat.oldStr;
    newStr = assistantNewFormat.newStr;
    if (assistantNewFormat.success !== undefined) {
      actualIsSuccess = assistantNewFormat.success;
    }
    if (assistantNewFormat.timestamp) {
      actualAssistantTimestamp = assistantNewFormat.timestamp;
    }
  } else if (toolNewFormat.filePath || toolNewFormat.oldStr || toolNewFormat.newStr) {
    filePath = toolNewFormat.filePath;
    oldStr = toolNewFormat.oldStr;
    newStr = toolNewFormat.newStr;
    if (toolNewFormat.success !== undefined) {
      actualIsSuccess = toolNewFormat.success;
    }
    if (toolNewFormat.timestamp) {
      actualToolTimestamp = toolNewFormat.timestamp;
    }
  } else {
    // Fall back to legacy format extraction
    const assistantLegacy = extractFromLegacyFormat(assistantContent, extractToolData, extractFilePath, extractStrReplaceContent);
    const toolLegacy = extractFromLegacyFormat(toolContent, extractToolData, extractFilePath, extractStrReplaceContent);

    // Use assistant content first, then tool content as fallback
    filePath = assistantLegacy.filePath || toolLegacy.filePath;
    oldStr = assistantLegacy.oldStr || toolLegacy.oldStr;
    newStr = assistantLegacy.newStr || toolLegacy.newStr;
  }

  // Additional legacy extraction for edge cases
  if (!filePath) {
    filePath = extractFilePath(assistantContent) || extractFilePath(toolContent);
  }

  if (!oldStr || !newStr) {
    const assistantStrReplace = extractStrReplaceContent(assistantContent);
    const toolStrReplace = extractStrReplaceContent(toolContent);
    oldStr = oldStr || assistantStrReplace.oldStr || toolStrReplace.oldStr;
    newStr = newStr || assistantStrReplace.newStr || toolStrReplace.newStr;
  }

  const toolTitle = getToolTitle(name);

  // Generate diff data (only if we have both strings)
  const lineDiff = oldStr && newStr ? generateLineDiff(oldStr, newStr) : [];
  const charDiff = oldStr && newStr ? generateCharDiff(oldStr, newStr) : [];

  // Calculate stats on changes
  const stats: DiffStats = calculateDiffStats(lineDiff);
  const totalChanges = stats.additions + stats.deletions;
  const modifications = lineDiff.filter(line => line.type === 'unchanged').length > 0 ? 1 : 0;

  // Check if we should show error state (only when not streaming and we have content but can't extract strings)
  const shouldShowError = !isStreaming && (!oldStr || !newStr) && (assistantContent || toolContent);

  return (
    <Card className="flex border-0 gap-0 shadow-none p-0 rounded-none flex-col h-full overflow-hidden bg-[#FFFFFF] dark:bg-[#202426]">
      <CardHeader className="h-6 bg-[#FFFFFF] dark:bg-[#202426] backdrop-blur-sm px-6 mb-0 gap-0">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center h-5 w-5 p-0 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20">
              <FileDiff className="w-3 h-3 text-purple-500 dark:text-purple-400" />
            </div>
            <CardTitle className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              {getLocalizedToolTitle(name, t)}
            </CardTitle>
          </div>

          {!isStreaming && (
            <Badge
              variant="secondary"
              className={
                actualIsSuccess
                  ? "bg-gradient-to-b from-emerald-200 to-emerald-100 text-emerald-700 dark:from-emerald-800/50 dark:to-emerald-900/60 dark:text-emerald-300"
                  : "bg-gradient-to-b from-rose-200 to-rose-100 text-rose-700 dark:from-rose-800/50 dark:to-rose-900/60 dark:text-rose-300"
              }
            >
              {actualIsSuccess ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              )}
              {actualIsSuccess ? t('toolViews.stringReplace.replacementCompleted') : t('toolViews.stringReplace.replacementFailed')}
            </Badge>
          )}

          {isStreaming && (
            <Badge className="bg-gradient-to-b from-blue-200 to-blue-100 text-blue-700 dark:from-blue-800/50 dark:to-blue-900/60 dark:text-blue-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              {t('toolViews.stringReplace.processingReplacement')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative p-0 pb-10 m-6 mt-2 h-full flex-1 overflow-hidden bg-[#F2F5FF] dark:bg-[#16191A] border-1 border-solid border-[#EDEDED] dark:border-[#2A2F31] rounded-2xl">
        {isStreaming ? (
          <LoadingState
            icon={FileDiff}
            iconColor="text-purple-500 dark:text-purple-400"
            bgColor="bg-gradient-to-b from-purple-100 to-purple-50 shadow-inner dark:from-purple-800/40 dark:to-purple-900/60 dark:shadow-purple-950/20"
            title={t('toolViews.stringReplace.processingStringReplacement')}
            filePath={filePath || t('fileOperation.processingFile')}
            progressText={t('toolViews.stringReplace.analyzeTextPatterns')}
            subtitle={t('toolViews.stringReplace.pleasewaitWhileReplacement')}
          />
        ) : shouldShowError ? (
          <ErrorState />
        ) : (
          <ScrollArea className="h-full w-full">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'unified' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('unified')}
                    className={cn("h-8 text-xs !text-[#FFFFFF]", viewMode === 'unified' ? '!text-[#FFFFFF]' : '!text-[#0a0a0a] dark:!text-[#FFFFFF]')}
                  >
                    {t('toolViews.stringReplace.unified')}
                  </Button>
                  <Button
                    variant={viewMode === 'split' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('split')}
                    className={cn("h-8 text-xs !text-[#FFFFFF] dark:!text-[#FFFFFF]", viewMode === 'split' ? '!text-[#FFFFFF]' : '!text-[#0a0a0a] dark:!text-[#FFFFFF]')}
                  >
                    {t('toolViews.stringReplace.split')}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="h-8 text-xs"
                >
                  {expanded ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      {t('toolViews.stringReplace.hideDifferences')}
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      {t('toolViews.stringReplace.showDifferences')}
                    </>
                  )}
                </Button>
              </div>

              {filePath && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden mb-4">
                  <div className="bg-[#F2F5FF] dark:bg-zinc-800 px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {filePath}
                    </div>
                  </div>
                  
                  {totalChanges > 0 && (
                    <div className="px-4 py-2 bg-[#F2F5FF] dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <Plus className="h-3 w-3" />
                          <span>{stats.additions} {stats.additions === 1 ? t('toolViews.stringReplace.line') : t('toolViews.stringReplace.lines')} {t('toolViews.stringReplace.additions')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                          <Minus className="h-3 w-3" />
                          <span>{stats.deletions} {stats.deletions === 1 ? t('toolViews.stringReplace.line') : t('toolViews.stringReplace.lines')} {t('toolViews.stringReplace.deletions')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                          <TrendingUp className="h-3 w-3" />
                          <span>{modifications} {t('toolViews.stringReplace.changes')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {expanded && (
                    <div className="p-0">
                      {viewMode === 'unified' ? (
                        <div className="font-mono text-xs">
                          {lineDiff.length > 0 ? (
                            lineDiff.map((line, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-start border-l-2 pl-3 py-1 px-4",
                                  line.type === 'added' && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-800 dark:text-emerald-300",
                                  line.type === 'removed' && "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-300",
                                  line.type === 'unchanged' && "bg-[#F2F5FF] dark:bg-zinc-900/50 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                                )}
                              >
                                <div className="w-8 text-right mr-3 text-zinc-500 dark:text-zinc-500 select-none">
                                  {line.lineNumber}
                                </div>
                                <div className="flex-1">
                                  <span className={cn(
                                    "inline-block w-4 mr-2 text-center",
                                    line.type === 'added' && "text-emerald-600",
                                    line.type === 'removed' && "text-red-600"
                                  )}>
                                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                                  </span>
                                  <span className="whitespace-pre-wrap break-words">
                                    {(line.newLine || line.oldLine) || ' '}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
                              {t('toolViews.stringReplace.noChanges')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2">
                          <div className="border-r border-zinc-200 dark:border-zinc-800">
                            <div className="bg-red-50 dark:bg-red-950/30 px-4 py-2 text-xs font-medium text-red-800 dark:text-red-300 border-b border-zinc-200 dark:border-zinc-800">
                              {t('toolViews.stringReplace.removedLine')}
                            </div>
                            <div className="p-4 font-mono text-xs whitespace-pre-wrap text-zinc-800 dark:text-zinc-300">
                              {oldStr || ''}
                            </div>
                          </div>
                          
                          <div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 border-b border-zinc-200 dark:border-zinc-800">
                              {t('toolViews.stringReplace.addedLine')}
                            </div>
                            <div className="p-4 font-mono text-xs whitespace-pre-wrap text-zinc-800 dark:text-zinc-300">
                              {newStr || ''}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
        <div className="absolute bottom-0 w-full px-4 py-2 h-10 bg-gradient-to-r from-zinc-50/90 to-zinc-100/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div className="h-full flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {!isStreaming && (
              <div className="flex items-center gap-2">
                {actualIsSuccess ? (
                  <CheckCircle className="h-3 w-3 text-emerald-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span>
                  {actualIsSuccess
                    ? t('toolViews.stringReplace.stringReplacementSuccessful')
                    : t('toolViews.stringReplace.stringReplacementFailed')}
                </span>
              </div>
            )}

            {isStreaming && (
              <div className="flex items-center gap-1">
                <CircleDashed className="h-3.5 w-3.5 text-blue-500 animate-spin mr-1" />
                <span>{t('toolViews.stringReplace.processingReplacementEllipsis')}</span>
              </div>
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