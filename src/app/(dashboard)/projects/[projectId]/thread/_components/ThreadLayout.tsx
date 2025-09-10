import React, { useCallback, useEffect, useRef } from 'react';
import { SiteHeader } from '@/components/thread/thread-site-header';
import { FileViewerModal } from '@/components/thread/file-viewer-modal';
import { ToolCallSidePanel } from '@/components/thread/tool-call-side-panel';
import { BillingErrorAlert } from '@/components/billing/usage-limit-alert';
import { Project } from '@/lib/api';
import { ApiMessageType, BillingData } from '../_types';
import { ToolCallInput } from '@/components/thread/tool-call-side-panel';
import { StreamingFileContent } from '@/hooks/useAgentStream'; // 导入流式文件内容类型

interface ThreadLayoutProps {
  children: React.ReactNode;
  threadId: string;
  projectName: string;
  projectId: string;
  project: Project | null;
  sandboxId: string | null;
  isSidePanelOpen: boolean;
  onToggleSidePanel: () => void;
  onProjectRenamed?: (newName: string) => void;
  onViewFiles: (filePath?: string, filePathList?: string[]) => void;
  fileViewerOpen: boolean;
  setFileViewerOpen: (open: boolean) => void;
  fileToView: string | null;
  filePathList?: string[];
  toolCalls: ToolCallInput[];
  messages: ApiMessageType[];
  externalNavIndex?: number;
  agentStatus: 'idle' | 'running' | 'connecting' | 'error';
  currentToolIndex: number;
  onSidePanelNavigate: (index: number) => void;
  onSidePanelClose: () => void;
  renderAssistantMessage: (assistantContent?: string, toolContent?: string) => React.ReactNode;
  renderToolResult: (toolContent?: string, isSuccess?: boolean) => React.ReactNode;
  isLoading: boolean;
  showBillingAlert: boolean;
  billingData: BillingData;
  onDismissBilling: () => void;
  debugMode: boolean;
  isMobile: boolean;
  initialLoadCompleted: boolean;
  agentName?: string;
  onSubmitMessage?: (message: string, options?: { model_name?: string; enable_thinking?: boolean }) => void;
  selectedModel?: string;
  getActualModelId?: (modelId: string) => string;
  streamingFileContent?: StreamingFileContent | null; // 添加流式文件内容属性
  sidePanelWidth?: number; // 添加侧边栏宽度属性
  isDragging?: boolean; // 添加拖拽状态属性
  onWidthChange?: (width: number) => void; // 添加宽度变化回调
  onDragStart?: () => void; // 添加拖拽开始回调
  onDragEnd?: () => void; // 添加拖拽结束回调
  // 新增：todo拦截控制参数
  enableTodoIntercept?: boolean;
  isTodoInterceptActive?: boolean;
  setIsTodoInterceptActive?: (active: boolean) => void;
}

export function ThreadLayout({
  children,
  threadId,
  projectName,
  projectId,
  project,
  sandboxId,
  isSidePanelOpen,
  onToggleSidePanel,
  onProjectRenamed,
  onViewFiles,
  fileViewerOpen,
  setFileViewerOpen,
  fileToView,
  filePathList,
  toolCalls,
  messages,
  externalNavIndex,
  agentStatus,
  currentToolIndex,
  onSidePanelNavigate,
  onSidePanelClose,
  renderAssistantMessage,
  renderToolResult,
  isLoading,
  showBillingAlert,
  billingData,
  onDismissBilling,
  debugMode,
  isMobile,
  initialLoadCompleted,
  agentName,
  onSubmitMessage,
  selectedModel,
  getActualModelId,
  streamingFileContent,
  sidePanelWidth = 45,
  isDragging = false,
  onWidthChange,
  onDragStart,
  onDragEnd,
  enableTodoIntercept = true,
  isTodoInterceptActive = false,
  setIsTodoInterceptActive
}: ThreadLayoutProps) {
  const dragRef = useRef<HTMLDivElement>(null);

  // 拖拽处理逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onDragStart || !onWidthChange) return;
    
    onDragStart();
    e.preventDefault();
    
    const startX = e.clientX;
    const startWidth = sidePanelWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const newWidth = startWidth + (deltaX / window.innerWidth) * 100;
      onWidthChange(newWidth);
    };
    
    const handleMouseUp = () => {
      if (onDragEnd) onDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidePanelWidth, onDragStart, onDragEnd, onWidthChange]);

  return (
    <div className="flex h-screen">
      {debugMode && (
        <div className="fixed top-16 right-4 bg-amber-500 text-black text-xs px-2 py-1 rounded-md shadow-md z-50">
          Debug Mode
        </div>
      )}

      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ease-in-out`}
        style={(!initialLoadCompleted || isSidePanelOpen) && !isMobile ? { marginRight: `${sidePanelWidth}vw` } : undefined}
      >
        <SiteHeader
          threadId={threadId}
          projectName={projectName}
          projectId={projectId}
          onViewFiles={onViewFiles}
          onToggleSidePanel={onToggleSidePanel}
          onProjectRenamed={onProjectRenamed}
          isMobileView={isMobile}
          debugMode={debugMode}
        />

        {children}
      </div>

              {/* 拖拽分隔线 */}
        {isSidePanelOpen && initialLoadCompleted && !isMobile && (
          <div
            ref={dragRef}
            className="fixed top-0 bottom-0 w-1.5 hover:bg-blue-400/60 cursor-col-resize z-20 transition-colors duration-200"
            style={{ right: `${sidePanelWidth}vw` }}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-10 bg-blue-500 rounded-full opacity-60 hover:opacity-100 transition-opacity duration-200" />
          </div>
        )}

      <ToolCallSidePanel
        isOpen={isSidePanelOpen && initialLoadCompleted}
        onClose={onSidePanelClose}
        toolCalls={toolCalls}
        messages={messages}
        externalNavigateToIndex={externalNavIndex}
        agentStatus={agentStatus}
        currentIndex={currentToolIndex}
        onNavigate={onSidePanelNavigate}
        project={project || undefined}
        renderAssistantMessage={renderAssistantMessage}
        renderToolResult={renderToolResult}
        isLoading={!initialLoadCompleted || isLoading}
        onFileClick={onViewFiles}
        agentName={agentName}
        onSubmitMessage={onSubmitMessage}
        selectedModel={selectedModel}
        getActualModelId={getActualModelId}
        streamingFileContent={streamingFileContent}
        sidePanelWidth={sidePanelWidth}
        enableTodoIntercept={enableTodoIntercept}
        isTodoInterceptActive={isTodoInterceptActive}
        setIsTodoInterceptActive={setIsTodoInterceptActive}
      />

      {sandboxId && (
        <FileViewerModal
          open={fileViewerOpen}
          onOpenChange={setFileViewerOpen}
          sandboxId={sandboxId}
          initialFilePath={fileToView}
          project={project || undefined}
          filePathList={filePathList}
        />
      )}

      <BillingErrorAlert
        message={billingData.message}
        currentUsage={billingData.currentUsage}
        limit={billingData.limit}
        accountId={billingData.accountId}
        onDismiss={onDismissBilling}
        isOpen={showBillingAlert}
      />
    </div>
  );
} 