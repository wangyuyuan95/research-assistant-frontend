'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { BillingError } from '@/lib/api';
import { toast } from 'sonner';
import { ChatInput } from '@/components/thread/chat-input/chat-input';
import { useSidebar } from '@/components/ui/sidebar';
import { useAgentStream } from '@/hooks/useAgentStream';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { isLocalMode } from '@/lib/config';
import { ThreadContent } from '@/components/thread/content/ThreadContent';
import { ThreadSkeleton } from '@/components/thread/content/ThreadSkeleton';
import { useAddUserMessageMutation } from '@/hooks/react-query/threads/use-messages';
import { useStartAgentMutation, useStopAgentMutation } from '@/hooks/react-query/threads/use-agent-run';
import { useSubscription } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { SubscriptionStatus, useModelSelection } from '@/components/thread/chat-input/_use-model-selection';

import { UnifiedMessage, ApiMessageType, ToolCallInput, Project } from '../_types';
import { useThreadData, useToolCalls, useBilling, useKeyboardShortcuts } from '../_hooks';
import { ThreadError, UpgradeDialog, ThreadLayout } from '../_components';
import { useVncPreloader } from '@/hooks/useVncPreloader';
import { useAgent } from '@/hooks/react-query/agents/use-agents';
import { useTranslation } from 'react-i18next';

export default function ThreadPage({
  params,
}: {
  params: Promise<{
    projectId: string;
    threadId: string;
  }>;
}) {
  const { t } = useTranslation();
  const unwrappedParams = React.use(params);
  const { projectId, threadId } = unwrappedParams;
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();

  // State
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileToView, setFileToView] = useState<string | null>(null);
  const [filePathList, setFilePathList] = useState<string[] | undefined>(undefined);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [initialPanelOpenAttempted, setInitialPanelOpenAttempted] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const hasInitiallyScrolled = useRef<boolean>(false);
  const initialLayoutAppliedRef = useRef(false);

  // 添加拖拽宽度状态管理
  const [sidePanelWidth, setSidePanelWidth] = useState(45); // 默认45vw
  const [isDragging, setIsDragging] = useState(false);

  // 处理拖拽宽度变化
  const handleWidthChange = useCallback((newWidth: number) => {
    setSidePanelWidth(Math.max(25, Math.min(55, newWidth)));
  }, []);

  // 处理拖拽开始
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Sidebar
  const { state: leftSidebarState, setOpen: setLeftSidebarOpen } = useSidebar();

  // Custom hooks
  const {
    messages,
    setMessages,
    project,
    sandboxId,
    projectName,
    agentRunId,
    setAgentRunId,
    agentStatus,
    setAgentStatus,
    isLoading,
    error,
    initialLoadCompleted,
    threadQuery,
    messagesQuery,
    projectQuery,
    agentRunsQuery,
    preventMessageOverride,
    allowMessageOverride,
    enableTodoIntercept,
    setEnableTodoIntercept,
    isTodoInterceptActive,
    setIsTodoInterceptActive,
  } = useThreadData(threadId, projectId);

  const {
    toolCalls,
    setToolCalls,
    currentToolIndex,
    setCurrentToolIndex,
    isSidePanelOpen,
    setIsSidePanelOpen,
    autoOpenedPanel,
    setAutoOpenedPanel,
    externalNavIndex,
    setExternalNavIndex,
    handleToolClick,
    handleStreamingToolCall,
    toggleSidePanel,
    handleSidePanelNavigate,
    userClosedPanelRef,
  } = useToolCalls(messages, setLeftSidebarOpen, agentStatus);

  const {
    showBillingAlert,
    setShowBillingAlert,
    billingData,
    setBillingData,
    checkBillingLimits,
    billingStatusQuery,
  } = useBilling(project?.account_id, agentStatus, initialLoadCompleted);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isSidePanelOpen,
    setIsSidePanelOpen,
    leftSidebarState,
    setLeftSidebarOpen,
    userClosedPanelRef,
  });

  const addUserMessageMutation = useAddUserMessageMutation();
  const startAgentMutation = useStartAgentMutation();
  const stopAgentMutation = useStopAgentMutation();
  const { data: agent } = useAgent(threadQuery.data?.agent_id);

  const { data: subscriptionData } = useSubscription();
  const subscriptionStatus: SubscriptionStatus = subscriptionData?.status === 'active'
    ? 'active'
    : 'no_subscription';

  // Model selection for todo confirmations
  const { selectedModel, getActualModelId } = useModelSelection();

  // Memoize project for VNC preloader to prevent re-preloading on every render
  const memoizedProject = useMemo(() => project, [project?.id, project?.sandbox?.vnc_preview, project?.sandbox?.pass]);

  useVncPreloader(memoizedProject);


  const handleProjectRenamed = useCallback((newName: string) => {
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Create a ref to store stopStreaming function
  const stopStreamingRef = useRef<((options?: { 
    showDefaultMessage?: boolean;
    skipMessageRefetch?: boolean;
  }) => Promise<void>) | null>(null);
  
  // 使用新的todo拦截控制参数，不再需要todoInterceptRef

  const handleNewMessageFromStream = useCallback((message: UnifiedMessage) => {
    console.log(
      `[STREAM HANDLER] Received message: ID=${message.message_id}, Type=${message.type}`,
    );

    if (!message.message_id) {
      console.warn(
        `[STREAM HANDLER] Received message is missing ID: Type=${message.type}, Content=${message.content?.substring(0, 50)}...`,
      );
    }

    setMessages((prev) => {
      const messageExists = prev.some(
        (m) => m.message_id === message.message_id,
      );
      if (messageExists) {
        return prev.map((m) =>
          m.message_id === message.message_id ? message : m,
        );
      } else {
        return [...prev, message];
      }
    });

    if (message.type === 'tool') {
      setAutoOpenedPanel(false);
    }

    // Check for todo.md file creation completion
    if (message.type === 'status' && enableTodoIntercept) {
      try {
        const contentStr = typeof message.content === 'string' 
          ? message.content 
          : JSON.stringify(message.content);
        
        const parsedContent = JSON.parse(contentStr);
        
        // Check if this is a tool completion status for create-file
        if (parsedContent.status_type === 'tool_completed' && 
            parsedContent.xml_tag_name === 'create-file' &&
            parsedContent.message && 
            parsedContent.message.includes('successfully')) {
          
          console.log(`[STREAM HANDLER] Detected create-file tool completed successfully, stopping stream`);
          // 阻止消息覆盖，保持流式消息显示
          preventMessageOverride();
          
          // 设置todo.md拦截标志
          setIsTodoInterceptActive(true);
          
          // Auto-stop the stream when file creation is completed
          setTimeout(() => {
            if (stopStreamingRef.current) {
              stopStreamingRef.current({ 
                showDefaultMessage: false,
                skipMessageRefetch: true // 跳过消息重新拉取，避免页面闪动
              });
              // Show custom message for auto-stop
              // toast.info(t('activity.confirmResearchPlan'));
            }
          }, 1000); // Small delay to ensure message is processed
        }
      } catch (error) {
        // Content might not be JSON, continue processing
      }
    }

    // Also check tool execution results for todo.md creation
    if (message.type === 'tool' && enableTodoIntercept) {
      try {
        const contentStr = typeof message.content === 'string' 
          ? message.content 
          : JSON.stringify(message.content);
        
        // Check if this is a tool execution result for todo.md creation
        const hasTodoMd = contentStr.includes('todo.md');
        const hasCreatedSuccessfully = contentStr.includes('created successfully');
        
        // Also check for variations in file naming and success messages
        // const hasTodoFile = contentStr.toLowerCase().includes('todo') && (contentStr.includes('.md') || contentStr.includes('markdown'));
        // const hasSuccess = contentStr.includes('successfully') || contentStr.includes('created') || contentStr.includes('success');
        
        if ((hasTodoMd && hasCreatedSuccessfully)
          //  || (hasTodoFile && hasSuccess)
          ) {
          console.log(`[STREAM HANDLER] Detected todo.md creation success in tool result, stopping stream`);
          // 阻止消息覆盖，保持流式消息显示
          preventMessageOverride();
          
          // 设置todo.md拦截标志
          setIsTodoInterceptActive(true);
          
          // Auto-stop the stream when todo.md creation is confirmed
          setTimeout(() => {
            if (stopStreamingRef.current) {
              stopStreamingRef.current({ 
                showDefaultMessage: false,
                skipMessageRefetch: true // 跳过消息重新拉取，避免页面闪动
              });
              // Show custom message for auto-stop
              // toast.info(t('activity.confirmResearchPlan'));
            }
          }, 1000); // Small delay to ensure message is processed
        }
      } catch (error) {
        console.error('Error checking tool execution result:', error);
      }
    }
  }, [setMessages, setAutoOpenedPanel, t, enableTodoIntercept, setIsTodoInterceptActive]);

  const handleStreamStatusChange = useCallback((hookStatus: string) => {
    console.log(`[PAGE] Hook status changed: ${hookStatus}`);
    switch (hookStatus) {
      case 'idle':
      case 'completed':
      case 'stopped':
      case 'agent_not_running':
      case 'error':
      case 'failed':
        setAgentStatus('idle');
        setAgentRunId(null);
        // 在todo.md拦截场景下，不要关闭侧边栏，保持流式消息显示
        // 只有在非todo.md场景下才关闭侧边栏
        if (!isTodoInterceptActive) {
          setAutoOpenedPanel(false);
        }

        if (
          [
            'completed',
            'stopped',
            'agent_not_running',
            'error',
            'failed',
          ].includes(hookStatus)
        ) {
          scrollToBottom('smooth');
        }
        break;
      case 'connecting':
        setAgentStatus('connecting');
        break;
      case 'streaming':
        setAgentStatus('running');
        break;
    }
  }, [setAgentStatus, setAgentRunId, setAutoOpenedPanel, isTodoInterceptActive]);

  const handleStreamError = useCallback((errorMessage: string) => {
    console.error(`[PAGE] Stream hook error: ${errorMessage}`);
    if (
      !errorMessage.toLowerCase().includes('not found') &&
      !errorMessage.toLowerCase().includes('agent run is not running')
    ) {
      toast.error(`Stream Error: ${errorMessage}`);
    }
  }, []);

  const handleStreamClose = useCallback(() => {
    console.log(`[PAGE] Stream hook closed with final status: ${agentStatus}`);
  }, [agentStatus]);

  // 添加流式文件内容状态
  const [streamingFileContent, setStreamingFileContent] = useState<any>(null);

  // 添加流式文件内容处理回调
  const handleStreamingFileContent = useCallback((fileContent: any) => {
    console.log('[PAGE] Received streaming file content:', fileContent);
    setStreamingFileContent(fileContent);
    
    // 当检测到文件工具开始时（有fileName且有内容），立即打开工具面板
    if (fileContent && fileContent.fileName && fileContent.content && !userClosedPanelRef.current) {
      console.log('[PAGE] Opening side panel for streaming file:', fileContent.fileName);
      setIsSidePanelOpen(true);
      setAutoOpenedPanel(true);
    }
  }, [setIsSidePanelOpen, setAutoOpenedPanel]);

  // Agent stream hook
  const {
    status: streamHookStatus,
    textContent: streamingTextContent,
    toolCall: streamingToolCall,
    error: streamError,
    agentRunId: currentHookRunId,
    streamingFileContent: hookStreamingFileContent, // 获取流式文件内容
    startStreaming,
    stopStreaming,
  } = useAgentStream(
    {
      onMessage: handleNewMessageFromStream,
      onStatusChange: handleStreamStatusChange,
      onError: handleStreamError,
      onClose: handleStreamClose,
      onStreamingFileContent: handleStreamingFileContent, // 添加流式文件内容回调
    },
    threadId,
    setMessages,
  );

  // 同步hook中的流式文件内容到本地状态
  useEffect(() => {
    setStreamingFileContent(hookStreamingFileContent);
  }, [hookStreamingFileContent]);

  // Store stopStreaming function in ref for use in handleNewMessageFromStream
  React.useEffect(() => {
    stopStreamingRef.current = (options?: { 
      showDefaultMessage?: boolean;
      skipMessageRefetch?: boolean;
    }) => {
      return stopStreaming(options);
    };
  }, [stopStreaming]);

  const handleSubmitMessage = useCallback(
    async (
      message: string,
      options?: { model_name?: string; enable_thinking?: boolean },
    ) => {
      if (!message.trim()) return;
      setIsSending(true);

      // 检测是否是todo.md确认操作，如果是则恢复消息更新
      if (message.includes('按照todo.md继续执行') || 
          message.includes('modified_todo_content') ||
          message.includes('MANDATORY WORKFLOW SYSTEM OVERRIDE')) {
        console.log('[PAGE] Detected todo.md confirmation, allowing message override');
        allowMessageOverride();
        // 重置todo.md拦截标志
        setIsTodoInterceptActive(false);
      }

      const optimisticUserMessage: UnifiedMessage = {
        message_id: `temp-${Date.now()}`,
        thread_id: threadId,
        type: 'user',
        is_llm_message: false,
        content: message,
        metadata: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUserMessage]);
      setNewMessage('');
      scrollToBottom('smooth');

      try {
        const messagePromise = addUserMessageMutation.mutateAsync({
          threadId,
          message
        });

        const agentPromise = startAgentMutation.mutateAsync({
          threadId,
          options
        });

        const results = await Promise.allSettled([messagePromise, agentPromise]);

        if (results[0].status === 'rejected') {
          const reason = results[0].reason;
          console.error("Failed to send message:", reason);
          throw new Error(`Failed to send message: ${reason?.message || reason}`);
        }

        if (results[1].status === 'rejected') {
          const error = results[1].reason;
          console.error("Failed to start agent:", error);

          if (error instanceof BillingError) {
            console.log("Caught BillingError:", error.detail);
            setBillingData({
              currentUsage: error.detail.currentUsage as number | undefined,
              limit: error.detail.limit as number | undefined,
              message: error.detail.message || 'Monthly usage limit reached. Please upgrade.',
              accountId: project?.account_id || null
            });
            setShowBillingAlert(true);

            setMessages(prev => prev.filter(m => m.message_id !== optimisticUserMessage.message_id));
            return;
          }

          throw new Error(`Failed to start agent: ${error?.message || error}`);
        }

        const agentResult = results[1].value;
        setAgentRunId(agentResult.agent_run_id);

        messagesQuery.refetch();
        agentRunsQuery.refetch();

      } catch (err) {
        console.error('Error sending message or starting agent:', err);
        if (!(err instanceof BillingError)) {
          toast.error(err instanceof Error ? err.message : 'Operation failed');
        }
        setMessages((prev) =>
          prev.filter((m) => m.message_id !== optimisticUserMessage.message_id),
        );
      } finally {
        setIsSending(false);
      }
    },
    [threadId, project?.account_id, addUserMessageMutation, startAgentMutation, messagesQuery, agentRunsQuery, setMessages, setBillingData, setShowBillingAlert, setAgentRunId, allowMessageOverride, setIsTodoInterceptActive],
  );

  const handleStopAgent = useCallback(async () => {
    console.log(`[PAGE] Requesting agent stop via hook.`);
    setAgentStatus('idle');

    await stopStreaming({ showDefaultMessage: false });
    // Show manual stop message
    toast.success(t('activity.agentStopped'));

    if (agentRunId) {
      try {
        await stopAgentMutation.mutateAsync(agentRunId);
        agentRunsQuery.refetch();
      } catch (error) {
        console.error('Error stopping agent:', error);
      }
    }
  }, [stopStreaming, agentRunId, stopAgentMutation, agentRunsQuery, setAgentStatus, t]);

  const handleOpenFileViewer = useCallback((filePath?: string, filePathList?: string[]) => {
    if (filePath) {
      setFileToView(filePath);
    } else {
      setFileToView(null);
    }
    setFilePathList(filePathList);
    setFileViewerOpen(true);
  }, []);

  const toolViewAssistant = useCallback(
    (assistantContent?: string, toolContent?: string) => {
      if (!assistantContent) return null;

      return (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">
            Assistant Message
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="text-xs prose prose-xs dark:prose-invert chat-markdown max-w-none">{assistantContent}</div>
          </div>
        </div>
      );
    },
    [],
  );

  const toolViewResult = useCallback(
    (toolContent?: string, isSuccess?: boolean) => {
      if (!toolContent) return null;

      return (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium text-muted-foreground">
              Tool Result
            </div>
            <div
              className={`px-2 py-0.5 rounded-full text-xs ${isSuccess
                ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
            >
              {isSuccess ? 'Success' : 'Failed'}
            </div>
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="text-xs prose prose-xs dark:prose-invert chat-markdown max-w-none">{toolContent}</div>
          </div>
        </div>
      );
    },
    [],
  );

  // Effects
  useEffect(() => {
    if (!initialLayoutAppliedRef.current) {
      setLeftSidebarOpen(false);
      initialLayoutAppliedRef.current = true;
    }
  }, [setLeftSidebarOpen]);

  useEffect(() => {
    if (initialLoadCompleted && !initialPanelOpenAttempted) {
      setInitialPanelOpenAttempted(true);

      if (toolCalls.length > 0) {
        setIsSidePanelOpen(true);
        setCurrentToolIndex(toolCalls.length - 1);
      } else {
        if (messages.length > 0) {
          setIsSidePanelOpen(true);
        }
      }
    }
  }, [initialPanelOpenAttempted, messages, toolCalls, initialLoadCompleted, setIsSidePanelOpen, setCurrentToolIndex]);

  useEffect(() => {
    if (agentRunId && agentRunId !== currentHookRunId) {
      console.log(
        `[PAGE] Target agentRunId set to ${agentRunId}, initiating stream...`,
      );
      startStreaming(agentRunId);
    }
  }, [agentRunId, startStreaming, currentHookRunId]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const isNewUserMessage = lastMsg?.type === 'user';
    if ((isNewUserMessage || agentStatus === 'running') && !userHasScrolled) {
      scrollToBottom('smooth');
    }
  }, [messages, agentStatus, userHasScrolled]);

  useEffect(() => {
    if (!latestMessageRef.current || messages.length === 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollButton(!entry?.isIntersecting),
      { root: messagesContainerRef.current, threshold: 0.1 },
    );
    observer.observe(latestMessageRef.current);
    return () => observer.disconnect();
  }, [messages, streamingTextContent, streamingToolCall]);

  useEffect(() => {
    console.log(`[PAGE] 🔄 Page AgentStatus: ${agentStatus}, Hook Status: ${streamHookStatus}, Target RunID: ${agentRunId || 'none'}, Hook RunID: ${currentHookRunId || 'none'}`);

    if ((streamHookStatus === 'completed' || streamHookStatus === 'stopped' ||
      streamHookStatus === 'agent_not_running' || streamHookStatus === 'error') &&
      (agentStatus === 'running' || agentStatus === 'connecting')) {
      console.log('[PAGE] Detected hook completed but UI still shows running, updating status');
      setAgentStatus('idle');
      setAgentRunId(null);
      setAutoOpenedPanel(false);
    }
  }, [agentStatus, streamHookStatus, agentRunId, currentHookRunId, setAgentStatus, setAgentRunId, setAutoOpenedPanel]);

  // SEO title update
  useEffect(() => {
    if (projectName) {
      document.title = `${projectName} | Research Assistant`;

      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `${projectName} - Interactive agent conversation powered by Research Assistant`,
        );
      }

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', `${projectName} | Research Assistant`);
      }

      const ogDescription = document.querySelector(
        'meta[property="og:description"]',
      );
      if (ogDescription) {
        ogDescription.setAttribute(
          'content',
          `Interactive AI conversation for ${projectName}`,
        );
      }
    }
  }, [projectName]);

  useEffect(() => {
    const debugParam = searchParams.get('debug');
    setDebugMode(debugParam === 'true');
  }, [searchParams]);

  useEffect(() => {
    if (initialLoadCompleted && subscriptionData) {
      const hasSeenUpgradeDialog = localStorage.getItem('research_assistant_upgrade_dialog_displayed');
      const isFreeTier = subscriptionStatus === 'no_subscription';
      if (!hasSeenUpgradeDialog && isFreeTier && !isLocalMode()) {
        setShowUpgradeDialog(true);
      }
    }
  }, [subscriptionData, subscriptionStatus, initialLoadCompleted]);

  const handleDismissUpgradeDialog = () => {
    setShowUpgradeDialog(false);
    localStorage.setItem('research_assistant_upgrade_dialog_displayed', 'true');
  };

  useEffect(() => {
    if (streamingToolCall) {
      handleStreamingToolCall(streamingToolCall);
    }
  }, [streamingToolCall, handleStreamingToolCall]);

  if (!initialLoadCompleted || isLoading) {
    return <ThreadSkeleton isSidePanelOpen={isSidePanelOpen} sidePanelWidth={sidePanelWidth} />;
  }

  if (error) {
    return (
      <ThreadLayout
        threadId={threadId}
        projectName={projectName}
        projectId={project?.id || ''}
        project={project}
        sandboxId={sandboxId}
        isSidePanelOpen={isSidePanelOpen}
        onToggleSidePanel={toggleSidePanel}
        onViewFiles={handleOpenFileViewer}
        fileViewerOpen={fileViewerOpen}
        setFileViewerOpen={setFileViewerOpen}
        fileToView={fileToView}
        filePathList={filePathList}
        toolCalls={toolCalls}
        messages={messages as ApiMessageType[]}
        externalNavIndex={externalNavIndex}
        agentStatus={agentStatus}
        currentToolIndex={currentToolIndex}
        onSidePanelNavigate={handleSidePanelNavigate}
        onSidePanelClose={() => {
          setIsSidePanelOpen(false);
          userClosedPanelRef.current = true;
          setAutoOpenedPanel(true);
        }}
        renderAssistantMessage={toolViewAssistant}
        renderToolResult={toolViewResult}
        isLoading={!initialLoadCompleted || isLoading}
        showBillingAlert={showBillingAlert}
        billingData={billingData}
        onDismissBilling={() => setShowBillingAlert(false)}
        debugMode={debugMode}
        isMobile={isMobile}
        initialLoadCompleted={initialLoadCompleted}
        agentName={agent && agent.name}
        onSubmitMessage={handleSubmitMessage}
        selectedModel={selectedModel}
        getActualModelId={getActualModelId}
        enableTodoIntercept={enableTodoIntercept}
        isTodoInterceptActive={isTodoInterceptActive}
        setIsTodoInterceptActive={setIsTodoInterceptActive}
      >
        <ThreadError error={error} />
      </ThreadLayout>
    );
  }

  return (
    <>
      <ThreadLayout
        threadId={threadId}
        projectName={projectName}
        projectId={project?.id || ''}
        project={project}
        sandboxId={sandboxId}
        isSidePanelOpen={isSidePanelOpen}
        onToggleSidePanel={toggleSidePanel}
        onProjectRenamed={handleProjectRenamed}
        onViewFiles={handleOpenFileViewer}
        fileViewerOpen={fileViewerOpen}
        setFileViewerOpen={setFileViewerOpen}
        fileToView={fileToView}
        filePathList={filePathList}
        toolCalls={toolCalls}
        messages={messages as ApiMessageType[]}
        externalNavIndex={externalNavIndex}
        agentStatus={agentStatus}
        currentToolIndex={currentToolIndex}
        onSidePanelNavigate={handleSidePanelNavigate}
        onSidePanelClose={() => {
          setIsSidePanelOpen(false);
          userClosedPanelRef.current = true;
          setAutoOpenedPanel(true);
        }}
        renderAssistantMessage={toolViewAssistant}
        renderToolResult={toolViewResult}
        isLoading={!initialLoadCompleted || isLoading}
        showBillingAlert={showBillingAlert}
        billingData={billingData}
        onDismissBilling={() => setShowBillingAlert(false)}
        debugMode={debugMode}
        isMobile={isMobile}
        initialLoadCompleted={initialLoadCompleted}
        agentName={agent && agent.name}
        onSubmitMessage={handleSubmitMessage}
        selectedModel={selectedModel}
        getActualModelId={getActualModelId}
        streamingFileContent={streamingFileContent} // 传递流式文件内容
        sidePanelWidth={sidePanelWidth}
        isDragging={isDragging}
        onWidthChange={handleWidthChange}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        enableTodoIntercept={enableTodoIntercept}
        isTodoInterceptActive={isTodoInterceptActive}
        setIsTodoInterceptActive={setIsTodoInterceptActive}
      >
        <ThreadContent
          messages={messages}
          streamingTextContent={streamingTextContent}
          streamingToolCall={streamingToolCall}
          agentStatus={agentStatus}
          handleToolClick={handleToolClick}
          handleOpenFileViewer={handleOpenFileViewer}
          readOnly={false}
          streamHookStatus={streamHookStatus}
          sandboxId={sandboxId}
          project={project}
          debugMode={debugMode}
          agentName={agent && agent.name}
          agentAvatar={agent && agent.avatar}
        />

        <div
          className={cn(
            "fixed bottom-0 z-10 px-8 pt-8 transition-all duration-200 ease-in-out",
            leftSidebarState === 'expanded' ? 'left-[78px] lg:left-[358px]' : 'left-[78px]',
            isMobile ? 'left-0 right-0' : ''
          )}
          style={isSidePanelOpen && !isMobile ? { right: `${sidePanelWidth}vw` } : undefined}>
          <div className={cn(
            "mx-auto",
            isMobile ? "w-full" : "max-w-3xl"
          )}>
            <ChatInput
              value={newMessage}
              onChange={setNewMessage}
              onSubmit={handleSubmitMessage}
              placeholder={t('chat.typeMessage', { 
                agentName: agent ? agent.name : t('agents.researchAssistant') 
              })}
              loading={isSending}
              disabled={isSending || agentStatus === 'running' || agentStatus === 'connecting'}
              isAgentRunning={agentStatus === 'running' || agentStatus === 'connecting'}
              onStopAgent={handleStopAgent}
              autoFocus={!isLoading}
              onFileBrowse={handleOpenFileViewer}
              sandboxId={sandboxId || undefined}
              messages={messages}
              agentName={agent && agent.name}
              enableTodoIntercept={enableTodoIntercept}
              setEnableTodoIntercept={setEnableTodoIntercept}
            />
          </div>
        </div>
      </ThreadLayout>

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        onDismiss={handleDismissUpgradeDialog}
      />
    </>
  );
} 