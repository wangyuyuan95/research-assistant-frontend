'use client';

import { Project } from '@/lib/api';
import { getToolIcon, getUserFriendlyToolName, getLocalizedToolName } from '@/components/thread/utils';
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiMessageType } from '@/components/thread/types';
import { CircleDashed, X, ChevronLeft, ChevronRight, Computer, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ToolView } from './tool-views/wrapper';
import { useTranslation } from 'react-i18next';
import { StreamingFileContent } from '@/hooks/useAgentStream'; // 导入流式文件内容类型

export interface ToolCallInput {
  assistantCall: {
    content?: string;
    name?: string;
    timestamp?: string;
  };
  toolResult?: {
    content?: string;
    isSuccess?: boolean;
    timestamp?: string;
  };
  messages?: ApiMessageType[];
}

interface ToolCallSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  toolCalls: ToolCallInput[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  externalNavigateToIndex?: number;
  messages?: ApiMessageType[];
  agentStatus: string;
  project?: Project;
  renderAssistantMessage?: (
    assistantContent?: string,
    toolContent?: string,
  ) => React.ReactNode;
  renderToolResult?: (
    toolContent?: string,
    isSuccess?: boolean,
  ) => React.ReactNode;
  isLoading?: boolean;
  agentName?: string;
  onFileClick?: (filePath: string) => void;
  onSubmitMessage?: (message: string, options?: { model_name?: string; enable_thinking?: boolean }) => void;
  selectedModel?: string;
  getActualModelId?: (modelId: string) => string;
  streamingFileContent?: StreamingFileContent | null; // 添加流式文件内容prop
  enableStreamingFileDisplay?: boolean; // 添加流式文件展示控制参数
  sidePanelWidth?: number; // 添加侧边栏宽度属性
  // 新增：todo拦截控制参数
  enableTodoIntercept?: boolean;
  isTodoInterceptActive?: boolean;
  setIsTodoInterceptActive?: (active: boolean) => void;
}

interface ToolCallSnapshot {
  id: string;
  toolCall: ToolCallInput;
  index: number;
  timestamp: number;
}

export function ToolCallSidePanel({
  isOpen,
  onClose,
  toolCalls,
  currentIndex,
  onNavigate,
  messages,
  agentStatus,
  project,
  isLoading = false,
  externalNavigateToIndex,
  agentName,
  onFileClick,
  onSubmitMessage,
  selectedModel,
  getActualModelId,
  streamingFileContent,
  enableStreamingFileDisplay = true,
  sidePanelWidth = 45,
  enableTodoIntercept = true,
  isTodoInterceptActive = false,
  setIsTodoInterceptActive,
}: ToolCallSidePanelProps) {
  const [dots, setDots] = React.useState('');
  const [internalIndex, setInternalIndex] = React.useState(0);
  const [navigationMode, setNavigationMode] = React.useState<'live' | 'manual'>('live');
  const [toolCallSnapshots, setToolCallSnapshots] = React.useState<ToolCallSnapshot[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation();


  React.useEffect(() => {
    let newSnapshots = toolCalls.map((toolCall, index) => ({
      id: `${index}-${toolCall.assistantCall.timestamp || Date.now()}`,
      toolCall,
      index,
      timestamp: Date.now(),
    }));

    // 处理流式文件内容的虚拟工具调用
    if (streamingFileContent) {
      const virtualId = `streaming-virtual-${streamingFileContent.fileName}`;
      
      // 检查是否有匹配当前流式文件的真实工具调用
      const hasMatchingRealCall = newSnapshots.some(s => {
        if (s.id.startsWith('streaming-virtual-')) return false;
        
        const toolCall = s.toolCall;
        const toolName = toolCall?.assistantCall?.name;
        
        // 只检查文件相关的工具调用
        if (toolName !== 'create-file' && toolName !== 'full-file-rewrite') return false;
        
        // 尝试从content中提取文件名进行匹配
        const content = toolCall.assistantCall?.content;
        if (typeof content === 'string') {
          try {
            const filePathMatch = content.match(/file_path[">]([^<"]+)/);
            const fileName = filePathMatch ? filePathMatch[1] : '';
            return fileName === streamingFileContent.fileName;
          } catch (e) {
            console.warn('[ToolCallSidePanel] Error parsing tool call content:', e);
            return false;
          }
        }
        return false;
      });
      
      if (!hasMatchingRealCall) {
        // 如果没有真实的工具调用，创建或更新虚拟工具调用
        const virtualToolCall: ToolCallInput = {
          assistantCall: {
            name: streamingFileContent.toolName === 'create_file' ? 'create-file' : 'full-file-rewrite',
            content: `<invoke name="${streamingFileContent.toolName}">
<parameter name="file_path">${streamingFileContent.fileName}</parameter>
<parameter name="file_contents">${streamingFileContent.content}</parameter>
</invoke>`,
            timestamp: new Date().toISOString(),
          },
          toolResult: {
            content: streamingFileContent.isComplete ? 'COMPLETED' : 'STREAMING',
            isSuccess: true,
            timestamp: new Date().toISOString(),
          },
        };

        // 检查是否已有虚拟调用
        const existingVirtualIndex = newSnapshots.findIndex(s => s.id === virtualId);
        if (existingVirtualIndex >= 0) {
          // 更新现有的虚拟调用
          newSnapshots[existingVirtualIndex] = {
            ...newSnapshots[existingVirtualIndex],
            toolCall: virtualToolCall,
          };
          console.log('[ToolCallSidePanel] Updated virtual tool call for streaming file:', streamingFileContent.fileName);
        } else {
          // 创建新的虚拟调用
          newSnapshots = [{
            id: virtualId,
            toolCall: virtualToolCall,
            index: 0,
            timestamp: Date.now(),
          }];
          console.log('[ToolCallSidePanel] Created virtual tool call for streaming file:', streamingFileContent.fileName);
        }
      } else {
        // 如果有匹配的真实工具调用，移除对应的虚拟调用
        const originalLength = newSnapshots.length;
        newSnapshots = newSnapshots.filter(s => s.id !== virtualId);
        if (newSnapshots.length < originalLength) {
          console.log('[ToolCallSidePanel] Removed virtual tool call for file:', streamingFileContent.fileName, 'using real tool call');
        }
      }
    }

    const hadSnapshots = toolCallSnapshots.length > 0;
    const hasNewSnapshots = newSnapshots.length > toolCallSnapshots.length;
    setToolCallSnapshots(newSnapshots);

    if (!isInitialized && newSnapshots.length > 0) {
      const completedCount = newSnapshots.filter(s =>
        s.toolCall.toolResult?.content &&
        s.toolCall.toolResult.content !== 'STREAMING'
      ).length;

      if (completedCount > 0) {
        let lastCompletedIndex = -1;
        for (let i = newSnapshots.length - 1; i >= 0; i--) {
          const snapshot = newSnapshots[i];
          if (snapshot.toolCall.toolResult?.content &&
            snapshot.toolCall.toolResult.content !== 'STREAMING') {
            lastCompletedIndex = i;
            break;
          }
        }
        setInternalIndex(Math.max(0, lastCompletedIndex));
      } else {
        setInternalIndex(Math.max(0, newSnapshots.length - 1));
      }
      setIsInitialized(true);
    } else if (hasNewSnapshots && navigationMode === 'live') {
      const latestSnapshot = newSnapshots[newSnapshots.length - 1];
      const isLatestStreaming = latestSnapshot?.toolCall.toolResult?.content === 'STREAMING';
      if (isLatestStreaming) {
        let lastCompletedIndex = -1;
        for (let i = newSnapshots.length - 1; i >= 0; i--) {
          const snapshot = newSnapshots[i];
          if (snapshot.toolCall.toolResult?.content &&
            snapshot.toolCall.toolResult.content !== 'STREAMING') {
            lastCompletedIndex = i;
            break;
          }
        }
        if (lastCompletedIndex >= 0) {
          setInternalIndex(lastCompletedIndex);
        } else {
          setInternalIndex(newSnapshots.length - 1);
        }
      } else {
        setInternalIndex(newSnapshots.length - 1);
      }
    } else if (hasNewSnapshots && navigationMode === 'manual') {
    }
  }, [toolCalls, navigationMode, toolCallSnapshots.length, isInitialized, streamingFileContent]);

  React.useEffect(() => {
    if (isOpen && !isInitialized && toolCallSnapshots.length > 0) {
      setInternalIndex(Math.min(currentIndex, toolCallSnapshots.length - 1));
    }
  }, [isOpen, currentIndex, isInitialized, toolCallSnapshots.length]);

  const safeInternalIndex = Math.min(internalIndex, Math.max(0, toolCallSnapshots.length - 1));
  const currentSnapshot = toolCallSnapshots[safeInternalIndex];
  const currentToolCall = currentSnapshot?.toolCall;
  const totalCalls = toolCallSnapshots.length;

  // Extract meaningful tool name, especially for MCP tools
  const extractToolName = (toolCall: any) => {
    const rawName = toolCall?.assistantCall?.name || 'Tool Call';

    // Handle MCP tools specially
    if (rawName === 'call-mcp-tool') {
      const assistantContent = toolCall?.assistantCall?.content;
      if (assistantContent && typeof assistantContent === 'string') {
        try {
          // Try to extract the actual MCP tool name from the content
          const toolNameMatch = assistantContent.match(/tool_name="([^"]+)"/);
          if (toolNameMatch && toolNameMatch[1]) {
            const mcpToolName = toolNameMatch[1];
            // Use the MCP tool name for better display
            return getLocalizedToolName(mcpToolName, t);
          }
        } catch (e) {
          // Fall back to generic name if parsing fails
          console.warn('[ToolCallSidePanel] Error parsing MCP tool name:', e);
        }
      }
      return t('toolViews.toolNames.externalTool');
    }

    // For all other tools, use the localized name
    return getLocalizedToolName(rawName, t);
  };

  const completedToolCalls = toolCallSnapshots.filter(snapshot =>
    snapshot.toolCall.toolResult?.content &&
    snapshot.toolCall.toolResult.content !== 'STREAMING'
  );
  const totalCompletedCalls = completedToolCalls.length;

  let displayToolCall = currentToolCall;
  let displayIndex = safeInternalIndex;
  let displayTotalCalls = totalCalls;

  const isCurrentToolStreaming = currentToolCall?.toolResult?.content === 'STREAMING';
  if (isCurrentToolStreaming && totalCompletedCalls > 0) {
    const lastCompletedSnapshot = completedToolCalls[completedToolCalls.length - 1];
    displayToolCall = lastCompletedSnapshot.toolCall;
    displayIndex = totalCompletedCalls - 1;
    displayTotalCalls = totalCompletedCalls;
  } else if (!isCurrentToolStreaming) {
    const completedIndex = completedToolCalls.findIndex(snapshot => snapshot.id === currentSnapshot?.id);
    if (completedIndex >= 0) {
      displayIndex = completedIndex;
      displayTotalCalls = totalCompletedCalls;
    }
  }

  const currentToolName = displayToolCall?.assistantCall?.name || 'Tool Call';
  // Get the properly localized tool name using extractToolName
  const localizedToolName = displayToolCall ? extractToolName(displayToolCall) : t('toolViews.common.toolName');
  const CurrentToolIcon = getToolIcon(
    currentToolCall?.assistantCall?.name || 'unknown',
  );
  const isStreaming = displayToolCall?.toolResult?.content === 'STREAMING';

  // Extract actual success value from tool content with fallbacks
  const getActualSuccess = (toolCall: any): boolean => {
    const content = toolCall?.toolResult?.content;
    if (!content) return toolCall?.toolResult?.isSuccess ?? true;

    const safeParse = (data: any) => {
      try { return typeof data === 'string' ? JSON.parse(data) : data; }
      catch { return null; }
    };

    const parsed = safeParse(content);
    if (!parsed) return toolCall?.toolResult?.isSuccess ?? true;

    if (parsed.content) {
      const inner = safeParse(parsed.content);
      if (inner?.tool_execution?.result?.success !== undefined) {
        return inner.tool_execution.result.success;
      }
    }
    const success = parsed.tool_execution?.result?.success ??
      parsed.result?.success ??
      parsed.success;

    return success !== undefined ? success : (toolCall?.toolResult?.isSuccess ?? true);
  };

  const isSuccess = isStreaming ? true : getActualSuccess(displayToolCall);

  const internalNavigate = React.useCallback((newIndex: number, source: string = 'internal') => {
    if (newIndex < 0 || newIndex >= totalCalls) return;

    const isNavigatingToLatest = newIndex === totalCalls - 1;

    console.log(`[INTERNAL_NAV] ${source}: ${internalIndex} -> ${newIndex}, mode will be: ${isNavigatingToLatest ? 'live' : 'manual'}`);

    setInternalIndex(newIndex);

    if (isNavigatingToLatest) {
      setNavigationMode('live');
    } else {
      setNavigationMode('manual');
    }

    if (source === 'user_explicit') {
      onNavigate(newIndex);
    }
  }, [internalIndex, totalCalls, onNavigate]);

  const isLiveMode = navigationMode === 'live';
  const showJumpToLive = navigationMode === 'manual' && agentStatus === 'running';
  const showJumpToLatest = navigationMode === 'manual' && agentStatus !== 'running';

  const navigateToPrevious = React.useCallback(() => {
    if (displayIndex > 0) {
      const targetCompletedIndex = displayIndex - 1;
      const targetSnapshot = completedToolCalls[targetCompletedIndex];
      if (targetSnapshot) {
        const actualIndex = toolCallSnapshots.findIndex(s => s.id === targetSnapshot.id);
        if (actualIndex >= 0) {
          setNavigationMode('manual');
          internalNavigate(actualIndex, 'user_explicit');
        }
      }
    }
  }, [displayIndex, completedToolCalls, toolCallSnapshots, internalNavigate]);

  const navigateToNext = React.useCallback(() => {
    if (displayIndex < displayTotalCalls - 1) {
      const targetCompletedIndex = displayIndex + 1;
      const targetSnapshot = completedToolCalls[targetCompletedIndex];
      if (targetSnapshot) {
        const actualIndex = toolCallSnapshots.findIndex(s => s.id === targetSnapshot.id);
        if (actualIndex >= 0) {
          const isLatestCompleted = targetCompletedIndex === completedToolCalls.length - 1;
          if (isLatestCompleted) {
            setNavigationMode('live');
          } else {
            setNavigationMode('manual');
          }
          internalNavigate(actualIndex, 'user_explicit');
        }
      }
    }
  }, [displayIndex, displayTotalCalls, completedToolCalls, toolCallSnapshots, internalNavigate]);

  const jumpToLive = React.useCallback(() => {
    setNavigationMode('live');
    internalNavigate(totalCalls - 1, 'user_explicit');
  }, [totalCalls, internalNavigate]);

  const jumpToLatest = React.useCallback(() => {
    setNavigationMode('manual');
    internalNavigate(totalCalls - 1, 'user_explicit');
  }, [totalCalls, internalNavigate]);

  const handleSliderChange = React.useCallback(([newValue]: [number]) => {
    const targetSnapshot = completedToolCalls[newValue];
    if (targetSnapshot) {
      const actualIndex = toolCallSnapshots.findIndex(s => s.id === targetSnapshot.id);
      if (actualIndex >= 0) {
        const isLatestCompleted = newValue === completedToolCalls.length - 1;
        if (isLatestCompleted) {
          setNavigationMode('live');
        } else {
          setNavigationMode('manual');
        }

        internalNavigate(actualIndex, 'user_explicit');
      }
    }
  }, [completedToolCalls, toolCallSnapshots, internalNavigate]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleSidebarToggle = (event: CustomEvent) => {
      if (event.detail.expanded) {
        onClose();
      }
    };

    window.addEventListener(
      'sidebar-left-toggled',
      handleSidebarToggle as EventListener,
    );
    return () =>
      window.removeEventListener(
        'sidebar-left-toggled',
        handleSidebarToggle as EventListener,
      );
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (externalNavigateToIndex !== undefined && externalNavigateToIndex >= 0 && externalNavigateToIndex < totalCalls) {
      internalNavigate(externalNavigateToIndex, 'external_click');
    }
  }, [externalNavigateToIndex, totalCalls, internalNavigate]);

  React.useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div
        className={cn(
          'fixed inset-y-0 top-[24px] right-0 border-1 border-solid border-[#EDEDED] dark:border-[#2A2F31] rounded-2xl flex flex-col z-30 h-[calc(100vh-48px)] transition-all duration-200 ease-in-out bg-[#FFFFFF] dark:bg-[#2A2F31]',
          isMobile ? 'w-full' : '',
          !isOpen && 'translate-x-full',
        )}
        style={!isMobile ? { width: `calc(${sidePanelWidth}vw - 24px)` } : undefined}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="pt-4 pl-4 pr-4">
              <div className="flex items-center justify-between">
                <div className="ml-2 flex items-center gap-2">
                  <h2 className="text-md font-medium text-zinc-900 dark:text-zinc-100">
                    {agentName ? t('computer.agentComputer', { agentName }) : t('computer.title')}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-40 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!displayToolCall && toolCallSnapshots.length === 0) {
      return (
        <div className="flex flex-col h-full">
          <div className="pt-4 pl-4 pr-4">
            <div className="flex items-center justify-between">
              <div className="ml-2 flex items-center gap-2">
                <h2 className="text-md font-medium text-zinc-900 dark:text-zinc-100">
                  {agentName ? t('computer.agentComputer', { agentName }) : t('computer.title')}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 p-8">
            <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
              <div className="relative">
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-zinc-400 dark:text-zinc-500 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {t('computer.noToolActivity')}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t('computer.toolActivityDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!displayToolCall && toolCallSnapshots.length > 0) {
      const firstStreamingTool = toolCallSnapshots.find(s => s.toolCall.toolResult?.content === 'STREAMING');
      if (firstStreamingTool && totalCompletedCalls === 0) {
        return (
          <div className="flex flex-col h-full">
            <div className="pt-4 pl-4 pr-4">
              <div className="flex items-center justify-between">
                <div className="ml-2 flex items-center gap-2">
                  <h2 className="text-md font-medium text-zinc-900 dark:text-zinc-100">
                    {agentName ? t('computer.agentComputer', { agentName }) : t('computer.title')}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 flex items-center gap-1.5">
                    <CircleDashed className="h-3 w-3 animate-spin" />
                    <span>{t('computer.running')}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 ml-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full">
          <div className="pt-4 pl-4 pr-4">
            <div className="flex items-center justify-between">
              <div className="ml-2 flex items-center gap-2">
                <h2 className="text-md font-medium text-zinc-900 dark:text-zinc-100">
                  {agentName ? t('computer.agentComputer', { agentName }) : t('computer.title')}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </div>
        </div>
      );
    }

    const toolView = (
      <ToolView
        name={displayToolCall.assistantCall.name}
        assistantContent={displayToolCall.assistantCall.content}
        toolContent={displayToolCall.toolResult?.content}
        assistantTimestamp={displayToolCall.assistantCall.timestamp}
        toolTimestamp={displayToolCall.toolResult?.timestamp}
        isSuccess={isSuccess}
        isStreaming={isStreaming}
        project={project}
        messages={messages}
        agentStatus={agentStatus}
        currentIndex={displayIndex}
        totalCalls={displayTotalCalls}
        onFileClick={onFileClick}
        onSubmitMessage={onSubmitMessage}
        selectedModel={selectedModel}
        getActualModelId={getActualModelId}
        streamingFileContent={streamingFileContent}
        enableStreamingFileDisplay={enableStreamingFileDisplay}
        enableTodoIntercept={enableTodoIntercept}
        isTodoInterceptActive={isTodoInterceptActive}
        setIsTodoInterceptActive={setIsTodoInterceptActive}
      />
    );

    return (
      <div className="flex flex-col h-full">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="ml-2 flex items-center gap-2">
              <h2 className="text-md font-medium text-zinc-900 dark:text-zinc-100">
                {agentName ? t('computer.agentComputer', { agentName }) : t('computer.title')}
              </h2>
            </div>

            {displayToolCall.toolResult?.content && !isStreaming && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 ml-1"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {isStreaming && (
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 flex items-center gap-1.5">
                  <CircleDashed className="h-3 w-3 animate-spin" />
                  <span>{t('computer.running')}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 ml-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {!displayToolCall.toolResult?.content && !isStreaming && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {toolView}
        </div>
      </div>
    );
  };

  return (
          <div
        className={cn(
          'fixed inset-y-0 top-[24px] right-[24px] border-1 border-solid border-[#EDEDED] dark:border-[#2A2F31] rounded-2xl flex flex-col z-30 h-[calc(100vh-48px)] transition-all duration-200 ease-in-out bg-[#FFFFFF] dark:bg-[#2A2F31]',
          isMobile ? 'w-full' : '',
          !isOpen && 'translate-x-full',
        )}
        style={!isMobile ? { width: `calc(${sidePanelWidth}vw - 24px)` } : undefined}
      >
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>

      {(displayTotalCalls > 1 || (isCurrentToolStreaming && totalCompletedCalls > 0)) && (
        <div
          className={cn(
            '',
            isMobile ? 'p-3' : 'p-4 space-y-2',
          )}
        >
          {!isMobile && (
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-5 w-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <CurrentToolIcon className="h-3 w-3 text-zinc-800 dark:text-zinc-300" />
                </div>
                <span
                  className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate"
                  title={currentToolName}
                >
                  {localizedToolName} {isStreaming && `(${t('toolViews.common.running')}${dots})`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isLiveMode && agentStatus === 'running' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">{t('activity.live')}</span>
                  </div>
                )}
                {!isLiveMode && agentStatus !== 'running' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800">
                    <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full"></div>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-400">{t('activity.live')}</span>
                  </div>
                )}
                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                  {t('toolViews.common.step')} {displayIndex + 1} {t('toolViews.common.of')} {displayTotalCalls}
                </span>
              </div>
            </div>
          )}

          {isMobile ? (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={navigateToPrevious}
                disabled={displayIndex <= 0}
                className="h-9 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span>{t('toolViews.common.previous')}</span>
              </Button>

              <div className="flex items-center gap-2">
                {isLiveMode && agentStatus === 'running' ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">{t('activity.live')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-neutral-800">
                    <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full"></div>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-400">{t('activity.live')}</span>
                  </div>
                )}

                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {displayIndex + 1} / {displayTotalCalls}
                  {isCurrentToolStreaming && totalCompletedCalls > 0 && (
                    <span className="text-blue-600 dark:text-blue-400"> • {t('toolViews.common.running')}</span>
                  )}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={navigateToNext}
                disabled={displayIndex >= displayTotalCalls - 1}
                className="h-9 px-3"
              >
                <span>{t('toolViews.common.next')}</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="relative flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigateToPrevious}
                  disabled={displayIndex <= 0}
                  className="h-6 w-6 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigateToNext}
                  disabled={displayIndex >= displayTotalCalls - 1}
                  className="h-6 w-6 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="relative w-full">
                {(showJumpToLive || showJumpToLatest) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10">
                    {showJumpToLive && (
                      <Button className='rounded-full bg-red-500 hover:bg-red-400 !text-white' onClick={jumpToLive}>
                        {t('activity.jumpToLive')}
                      </Button>
                    )}
                    {showJumpToLatest && (
                      <Button className='rounded-md bg-[#3363FF] hover:bg-[#3363FF]-700 dark:bg-blue-500 dark:hover:bg-blue-600 !text-white ' onClick={jumpToLatest}>
                        {t('activity.jumpToLatest')}
                      </Button>
                    )}
                  </div>
                )}
                
                <Slider
                  min={0}
                  max={displayTotalCalls - 1}
                  step={1}
                  value={[displayIndex]}
                  onValueChange={handleSliderChange}
                  className="w-full
                    [&>span:first-child]:h-[6px]
                    [&>span:first-child]:rounded-full
                    [&>span:first-child]:bg-[#F2F5FF]
                    dark:[&>span:first-child]:bg-[#2E3336]
                    [&>span:first-child>span]:bg-[#3363FF]
                    [&>span:first-child>span]:h-[6px]
                    [&>span:nth-child(2)>span]:bg-gradient-to-b
                    [&>span:nth-child(2)>span]:from-[#2387FF]
                    [&>span:nth-child(2)>span]:to-[#E856FF]
                    [&>span:nth-child(2)>span>span]:!border-[none]
                  "
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}