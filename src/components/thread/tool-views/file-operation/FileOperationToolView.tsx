import React, { useState, useCallback, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Code,
  Eye,
  File,
  HelpCircle,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  extractFilePath,
  extractFileContent,
  extractStreamingFileContent,
  formatTimestamp,
  getToolTitle,
  getLocalizedToolTitle,
  normalizeContentToString,
  extractToolData,
} from '../utils';
import {
  MarkdownRenderer,
  processUnicodeContent,
} from '@/components/file-renderers/markdown-renderer';
import { CsvRenderer } from '@/components/file-renderers/csv-renderer';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { CodeBlockCode } from '@/components/ui/code-block';
import { constructHtmlPreviewUrl } from '@/lib/utils/url';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  getLanguageFromFileName,
  getOperationType,
  getOperationConfigs,
  getFileIcon,
  processFilePath,
  getFileName,
  getFileExtension,
  isFileType,
  hasLanguageHighlighting,
  splitContentIntoLines,
  type FileOperation,
  type OperationConfig,
} from './_utils';
import { ToolViewProps } from '../types';
import { GenericToolView } from '../GenericToolView';
import { LoadingState } from '../shared/LoadingState';
import { TodoSourceEditor, TodoPreviewEditor } from './TodoMdEditor';
import { wrapAsHiddenMessage, isHiddenMessage } from '../../utils/hidden-message';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import Image from 'next/image';
import flowIcoSVG from '#/flow-ico.svg';

export function FileOperationToolView({
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
  name,
  project,
  onSubmitMessage,
  selectedModel,
  getActualModelId,
  messages = [],
  streamingFileContent, // 添加流式文件内容参数
  enableStreamingFileDisplay = true, // 添加流式展示控制参数，默认开启
  agentStatus = 'idle', // 添加代理状态参数
  enableTodoIntercept = true, // 添加todo拦截控制参数，默认启用
  isTodoInterceptActive = false, // 添加todo拦截状态参数
  setIsTodoInterceptActive, // 添加todo拦截状态设置函数
}: ToolViewProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';

  // Add state for todo.md editing
  const [editedTodoContent, setEditedTodoContent] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Add state for tooltip
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [noMoreReminders, setNoMoreReminders] = useState(() => {
    // Initialize from localStorage immediately to prevent flash
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('todo_no_more_reminder');
      return stored === 'true';
    }
    return false;
  });

  // Check if todo.md has been confirmed/executed before
  const checkTodoConfirmed = useCallback(() => {
    if (!messages || messages.length === 0) return false;
        
    // 1. 检查是否有隐藏的确认消息
    for (const message of messages) {
      if (message.type === 'user' && message.content) {
        const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
        
        // Check if this is a hidden message with todo confirmation content
        if (isHiddenMessage(content)) {
            return true;
        }
      }
    }
    
    // 2. 检查todo.md对应的message之后是否还有其他有意义的message
    // 只检查tool或assistant类型的消息，status类型不算
    const todoMessageIndex = messages.findIndex(message => {
      if (message.type === 'tool' && message.content) {
        const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
        return content.includes('todo.md') && (content.includes('created successfully') || content.includes('created'));
      }
      return false;
    });
    
    if (todoMessageIndex !== -1) {
      // 检查todo.md消息之后是否有tool或assistant类型的消息
      const hasSubsequentMeaningfulMessages = messages.slice(todoMessageIndex + 1).some(message => 
        message.type === 'tool' || message.type === 'assistant'
      );
      
      if (hasSubsequentMeaningfulMessages) {
        // todo.md消息之后还有tool或assistant消息，说明已经被处理过了
        console.log('[FileOperationToolView] Todo.md message found with subsequent tool/assistant messages, marking as confirmed');
        return true;
      }
    }
    
    return false;
  }, [messages]);

  const isTodoConfirmed = checkTodoConfirmed();

  const operation = getOperationType(name, assistantContent);
  const configs = getOperationConfigs();
  const config = configs[operation];
  const Icon = config.icon;

  let filePath: string | null = null;
  let fileContent: string | null = null;
  let isRealTimeStreaming = false; // 标识是否为真流式状态

  // 优先检查流式文件内容（如果启用了流式展示）
  if (enableStreamingFileDisplay && streamingFileContent && 
      (streamingFileContent.toolName === 'create_file' || streamingFileContent.toolName === 'full_file_rewrite')) {
    filePath = streamingFileContent.fileName;
    fileContent = streamingFileContent.content;
    isRealTimeStreaming = !streamingFileContent.isComplete;
    
    console.log('[FileOperationToolView] Using streaming file content:', {
      fileName: streamingFileContent.fileName,
      contentLength: streamingFileContent.content.length,
      isComplete: streamingFileContent.isComplete,
      enableStreaming: enableStreamingFileDisplay
    });
  } else {
    // 回退到原有的静态内容提取逻辑
    const assistantToolData = extractToolData(assistantContent);
    const toolToolData = extractToolData(toolContent);

    if (assistantToolData.toolResult) {
      filePath = assistantToolData.filePath;
      fileContent = assistantToolData.fileContent;
    } else if (toolToolData.toolResult) {
      filePath = toolToolData.filePath;
      fileContent = toolToolData.fileContent;
    }

    if (!filePath) {
      filePath = extractFilePath(assistantContent);
    }

    if (!fileContent && operation !== 'delete') {
      fileContent = isStreaming
        ? extractStreamingFileContent(
          assistantContent,
          operation === 'create' ? 'create-file' : 'full-file-rewrite',
        ) || ''
        : extractFileContent(
          assistantContent,
          operation === 'create' ? 'create-file' : 'full-file-rewrite',
        );
    }
  }

  const toolTitle = getToolTitle(name || `file-${operation}`);
  const processedFilePath = processFilePath(filePath);
  const fileName = getFileName(processedFilePath);
  const fileExtension = getFileExtension(fileName);
  
  const isMarkdown = isFileType.markdown(fileExtension);
  const isTodoMd = fileName.toLowerCase() === 'todo.md';
  // 判断是否为todo.md且未确认，同时如果是流式生成需要等待完成，并且整个流已经停止
  // 当enableTodoIntercept为false时，认为todo.md已经执行过，不可编辑
  const isTodoMdEditable = isTodoMd && 
                           enableTodoIntercept && // 只有在启用拦截时才可编辑
                           !isTodoConfirmed && 
                           !isRealTimeStreaming && 
                           agentStatus !== 'running';
  const isHtml = isFileType.html(fileExtension);

  // Auto-open tooltip when todo.md is editable and user hasn't disabled reminders
  useEffect(() => {
    if (isTodoMdEditable && !noMoreReminders && !isTodoConfirmed) {
      setIsTooltipOpen(true);
    }
  }, [isTodoMdEditable, noMoreReminders, isTodoConfirmed]);
  const isCsv = isFileType.csv(fileExtension);

  const language = getLanguageFromFileName(fileName);
  const hasHighlighting = hasLanguageHighlighting(language);
  const contentLines = splitContentIntoLines(fileContent);

  // 智能自动滚动 hooks - 为代码视图和预览视图分别创建
  const codeAutoScroll = useAutoScroll({
    content: fileContent,
    isStreaming: isRealTimeStreaming,
    enabled: enableStreamingFileDisplay && isRealTimeStreaming,
  });

  const previewAutoScroll = useAutoScroll({
    content: fileContent,
    isStreaming: isRealTimeStreaming,
    enabled: enableStreamingFileDisplay && isRealTimeStreaming,
  });

  // 调试信息
  console.log('[FileOperationToolView] Auto scroll debug:', {
    fileContent: fileContent?.substring(0, 100) + '...',
    isRealTimeStreaming,
    enableStreamingFileDisplay,
    enabled: enableStreamingFileDisplay && isRealTimeStreaming,
    contentLength: fileContent?.length || 0
  });

  // Handle content changes from both editors
  const handleTodoChange = useCallback((newContent: string) => {
    setEditedTodoContent(newContent);
    setHasUnsavedChanges(newContent !== processUnicodeContent(fileContent));
  }, [fileContent]);

  // Handle "no more reminders" action
  const handleNoMoreReminders = useCallback(() => {
    localStorage.setItem('todo_no_more_reminder', 'true');
    setNoMoreReminders(true);
    setIsTooltipOpen(false);
  }, []);

  // Handle cancel modification - restore original content
  const handleCancelModification = useCallback(() => {
    setEditedTodoContent(null);
    setHasUnsavedChanges(false);
  }, []);

  // Shared handler for saving todo content
  const handleTodoSave = useCallback(() => {
    if (!onSubmitMessage) {
      console.warn('onSubmitMessage not available');
      return;
    }
    
    // Use the same model selection logic as chat input
    let baseModelName = '';
    let thinkingEnabled = false;
    
    if (selectedModel && getActualModelId) {
      baseModelName = getActualModelId(selectedModel);
      thinkingEnabled = false;
      if (selectedModel.endsWith('-thinking')) {
        baseModelName = getActualModelId(selectedModel.replace(/-thinking$/, ''));
        thinkingEnabled = true;
      }
    }
    
    if (editedTodoContent && hasUnsavedChanges) {
      // User has made changes, send the updated todo content
      // const actualPrompt = `请按照<modified_todo_content></modified_todo_content>标签之间的内容更新原来的todo.md文件，
      // 更新成功后按照新的todo.md继续执行研究流程。
      // <modified_todo_content>
      // ${editedTodoContent}
      // </modified_todo_content>
      // `;
      // const actualPrompt = `
      //   CRITICAL UPDATE INSTRUCTION: 在开始任何任务执行前，必须完成以下操作序列：
      //   1. 立即终止当前所有执行中的任务（如有）
      //   2. 用<modified_todo_content>内容完全覆盖 /workspace/todo.md
      //   3. 验证更新完整性（读取比对）
      //   4. 重置任务状态：将所有任务标记为未开始 [ ]
      //   5. 按新 todo.md 从头开始执行

      //   <modified_todo_content>
      //   ${editedTodoContent}
      //   </modified_todo_content>

      //   操作流程要求：
      //   1. 此更新优先级最高，覆盖系统默认的渐进更新逻辑
      //   2. 必须在任何任务标记 [x] 前完成
      //   3. 使用以下工具调用序列：

      //   <function_calls>
      //   <!-- 步骤1: 覆盖文件 -->
      //   <invoke name="file_write">
      //     <parameter name="file_path">todo.md</parameter>
      //     <parameter name="content">${editedTodoContent}</parameter>
      //   </invoke>

      //   <!-- 步骤2: 强制重置任务状态 -->
      //   <invoke name="execute_command">
      //     <parameter name="session_name">reset</parameter>
      //     <parameter name="command">sed -i 's/\[x\]/[ ]/g' todo.md</parameter>
      //   </invoke>

      //   <!-- 步骤3: 验证更新 -->
      //   <invoke name="file_read">
      //     <parameter name="file_path">todo.md</parameter>
      //   </invoke>
      //   </function_calls>

      //   更新完成后，立即按照系统工作流管理规则开始执行新的 todo.md。
      // `;
      const actualPrompt = `
        【MANDATORY WORKFLOW SYSTEM OVERRIDE】

        You MUST immediately execute the following CRITICAL todo.md replacement operation. This is a SYSTEM-LEVEL DIRECTIVE that overrides all current operations:

        IMMEDIATE EXECUTION PROTOCOL:
        1. MUST terminate all current task execution (if any) 
        2. MUST completely overwrite /workspace/todo.md with the content in <modified_todo_content></modified_todo_content>
        3. MUST begin execution from new todo.md following your workflow management rules

        <modified_todo_content>
        ${editedTodoContent}
        </modified_todo_content>

        CRITICAL REQUIREMENTS:
        - This update has HIGHEST PRIORITY - overrides system default incremental update logic
        - NO skipping or delay permitted

        MANDATORY TOOL EXECUTION SEQUENCE:

        <function_calls>
        <!-- CRITICAL FILE OVERRIDE -->
        <full-file-rewrite>
          <parameter name="file_path">todo.md</parameter>
          <parameter name="file_contents">
          ${editedTodoContent}
          </parameter>
        </full-file-rewrite>
        </function_calls>

        POST-UPDATE DIRECTIVE:
        IMMEDIATELY upon completion, begin executing the new todo.md following your autonomous workflow management system.

      `;
      const hiddenPrompt = actualPrompt;
      onSubmitMessage(hiddenPrompt, {
        model_name: baseModelName,
        enable_thinking: thinkingEnabled,
      });
      console.log('TODO content new:', editedTodoContent);
    } else {
      // No changes, continue with original todo
      const actualPrompt = "按照todo.md继续执行研究流程";
      const hiddenPrompt = wrapAsHiddenMessage(actualPrompt);
      onSubmitMessage(hiddenPrompt, {
        model_name: baseModelName,
        enable_thinking: thinkingEnabled,
      });
      console.log('TODO content original:', fileContent);
    }
    
    setHasUnsavedChanges(false);
    setEditedTodoContent(null);
  }, [editedTodoContent, hasUnsavedChanges, onSubmitMessage, fileContent, selectedModel, getActualModelId]);

  // Shared handler for canceling todo edits
  const handleTodoCancel = useCallback(() => {
    if (!onSubmitMessage) {
      console.warn('onSubmitMessage not available');
      return;
    }
    
    // Use the same model selection logic as chat input
    let baseModelName = '';
    let thinkingEnabled = false;
    
    if (selectedModel && getActualModelId) {
      baseModelName = getActualModelId(selectedModel);
      thinkingEnabled = false;
      if (selectedModel.endsWith('-thinking')) {
        baseModelName = getActualModelId(selectedModel.replace(/-thinking$/, ''));
        thinkingEnabled = true;
      }
    }
    
    // Continue with original todo content
    const actualPrompt = "按照todo.md继续执行研究流程";
    const hiddenPrompt = wrapAsHiddenMessage(actualPrompt);
    onSubmitMessage(hiddenPrompt, {
      model_name: baseModelName,
      enable_thinking: thinkingEnabled,
    });
    console.log('TODO content original:', fileContent);
    
    setEditedTodoContent(null);
    setHasUnsavedChanges(false);
  }, [onSubmitMessage, fileContent, selectedModel, getActualModelId]);

  const htmlPreviewUrl =
    isHtml && project?.sandbox?.sandbox_url && processedFilePath
      ? constructHtmlPreviewUrl(project.sandbox.sandbox_url, processedFilePath)
      : undefined;

  const FileIcon = getFileIcon(fileName);

  if (!isStreaming && !processedFilePath && !fileContent) {
    return (
      <GenericToolView
        name={name || `file-${operation}`}
        assistantContent={assistantContent}
        toolContent={toolContent}
        assistantTimestamp={assistantTimestamp}
        toolTimestamp={toolTimestamp}
        isSuccess={isSuccess}
        isStreaming={isStreaming}
      />
    );
  }

  const renderFilePreview = () => {
    if (!fileContent) {
      return (
        <div className="flex items-center justify-center h-full p-12">
          <div className="text-center">
            <FileIcon className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('fileOperation.noContentToPreview')}</p>
          </div>
        </div>
      );
    }

    if (isHtml && htmlPreviewUrl) {
      return (
        <div className="flex flex-col h-[calc(100vh-16rem)]">
          <iframe
            src={htmlPreviewUrl}
            title={`HTML Preview of ${fileName}`}
            className="flex-grow border-0"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      );
    }

    if (isTodoMdEditable) {
      return (
        <TodoPreviewEditor
          content={editedTodoContent || processUnicodeContent(fileContent)}
          onChange={handleTodoChange}
          className="h-full"
          scrollRef={previewAutoScroll.scrollRef}
        />
      );
    }

    if (isMarkdown) {
      return (
        <div className="p-1 py-0 prose dark:prose-invert prose-zinc max-w-none">
          <MarkdownRenderer
            content={processUnicodeContent(fileContent)}
          />
        </div>
      );
    }

    if (isCsv) {
      return (
        <div className="h-full w-full p-4">
          <div className="h-[calc(100vh-17rem)] w-full bg-muted/20 border rounded-xl overflow-auto">
            <CsvRenderer content={processUnicodeContent(fileContent)} />
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className='w-full h-full bg-muted/20'>
          <pre className="text-sm font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap break-words">
            {processUnicodeContent(fileContent)}
          </pre>
        </div>
      </div>
    );
  };

  const renderDeleteOperation = () => (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
      <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", config.bgColor)}>
        <Icon className={cn("h-10 w-10", config.color)} />
      </div>
      <h3 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-zinc-100">
        {t('fileOperation.fileDeletedTitle')}
      </h3>
      <div className="bg-[#F2F5FF] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 w-full max-w-md text-center mb-4 shadow-sm">
        <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
          {processedFilePath || 'Unknown file path'}
        </code>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {t('fileOperation.permanentlyRemoved')}
      </p>
    </div>
  );

  const renderSourceCode = () => {
    if (!fileContent) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FileIcon className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('toolViews.common.noContentAvailable')}</p>
          </div>
        </div>
      );
    }

    // Special handling for todo.md files in source mode
    // 特殊处理 todo.md 文件的流式展示
    if (isTodoMdEditable) {
      return (
        <TodoSourceEditor
          content={editedTodoContent || processUnicodeContent(fileContent)}
          onChange={handleTodoChange}
          className="h-full"
          scrollRef={codeAutoScroll.scrollRef}
        />
      );
    }

    if (hasHighlighting) {
      return (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-zinc-200 dark:border-zinc-800 z-10 flex flex-col bg-[#F2F5FF] dark:bg-zinc-900">
            {contentLines.map((_, idx) => (
              <div
                key={idx}
                className="h-6 text-right pr-3 text-xs font-mono text-zinc-500 dark:text-zinc-500 select-none"
              >
                {idx + 1}
              </div>
            ))}
          </div>
          <div className="pl-12">
            <CodeBlockCode
              code={processUnicodeContent(fileContent)}
              language={language}
              className="text-xs"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-w-full flex flex-col">
        {contentLines.map((line, idx) => (
          <div
            key={idx}
            className={cn("table-row transition-colors", config.hoverColor)}
          >
            <div className="table-cell text-right pr-3 pl-6 py-0.5 text-xs font-mono text-zinc-500 dark:text-zinc-500 select-none w-12 border-r border-zinc-200 dark:border-zinc-800 bg-[#F2F5FF] dark:bg-zinc-900">
              {idx + 1}
            </div>
            <div className="table-cell pl-3 py-0.5 pr-4 text-xs font-mono whitespace-pre-wrap text-zinc-800 dark:text-zinc-300">
              {processUnicodeContent(line) || ' '}
            </div>
          </div>
        ))}
        <div className="table-row h-4"></div>
      </div>
    );
  };

  const getProgressMessage = (operation: FileOperation): string => {
    switch (operation) {
      case 'create':
        return t('fileOperation.creatingFile');
      case 'rewrite':
        return t('fileOperation.rewritingFile');
      case 'delete':
        return t('fileOperation.deletingFile');
      default:
        return t('toolViews.common.loading');
    }
  };

  return (
    <Card className="flex border-0 gap-0 shadow-none p-0 rounded-none flex-col h-full overflow-hidden bg-[#FFFFFF] dark:bg-[#202426]">
      <Tabs defaultValue={'preview'} className="w-full h-full gap-0">
        <CardHeader className="h-6 bg-[#FFFFFF] dark:bg-[#202426] backdrop-blur-sm px-6 mb-0 gap-0">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("relative flex items-center justify-center h-5 w-5 p-0 rounded-lg", config.gradientBg)}>
                <Icon className={cn("h-3 w-3", config.color)} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-[#0F0F0F] dark:text-[#FFFFFF]">
                  {getLocalizedToolTitle(name || `file-${operation}`, t)}
                </CardTitle>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {isHtml && htmlPreviewUrl && !isStreaming && (
                <Button variant="outline" size="sm" className="h-4 text-xs bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800" asChild>
                  <a href={htmlPreviewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    {t('fileOperation.openInBrowser')}
                  </a>
                </Button>
              )}
              <TabsList className="p-0 h-6 bg-[#F0F0F0] dark:bg-[#303338] rounded-lg border-1 border-solid border-[#EDEDED] dark:border-[#464A51] text-[12px]">
                <TabsTrigger value="code" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-primary">
                  <Code className="h-4 w-4" />
                  {t('fileOperation.source')}
                </TabsTrigger>
                <TabsTrigger value="preview" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-primary">
                  <Eye className="h-4 w-4" />
                  {t('fileOperation.preview')}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative p-0 pb-10 m-6 h-full flex-1 overflow-hidden bg-[#F2F5FF] dark:bg-[#16191A] border-1 border-solid border-[#EDEDED] dark:border-[#2A2F31] rounded-2xl">
          <TabsContent value="code" className="flex-1 h-full mt-0 p-0 pt-4 overflow-hidden">
            <ScrollArea className="h-screen w-full min-h-0" ref={codeAutoScroll.scrollRef}>
              {(isStreaming || isRealTimeStreaming) && !fileContent ? (
                <LoadingState
                  icon={Icon}
                  iconColor={config.color}
                  bgColor={config.bgColor}
                  title={getProgressMessage(operation)}
                  filePath={processedFilePath || t('fileOperation.processingFile')}
                  subtitle={t('toolViews.common.loading')}
                  showProgress={false}
                />
              ) : operation === 'delete' ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", config.bgColor)}>
                    <Icon className={cn("h-10 w-10", config.color)} />
                  </div>
                  <h3 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-zinc-100">
                    {t('fileOperation.deleteOperation')}
                  </h3>
                  <div className="bg-[#F2F5FF] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 w-full max-w-md text-center">
                    <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
                      {processedFilePath || 'Unknown file path'}
                    </code>
                  </div>
                </div>
              ) : (
                renderSourceCode()
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="w-full flex-1 h-full mt-0 p-0 overflow-hidden">
            <ScrollArea className="h-full w-full min-h-0" ref={previewAutoScroll.scrollRef}>
              {(isStreaming || isRealTimeStreaming) && !fileContent ? (
                <LoadingState
                  icon={Icon}
                  iconColor={config.color}
                  bgColor={config.bgColor}
                  title={getProgressMessage(operation)}
                  filePath={processedFilePath || t('fileOperation.processingFile')}
                  subtitle={t('toolViews.common.loading')}
                  showProgress={false}
                />
              ) : operation === 'delete' ? (
                renderDeleteOperation()
              ) : (
                renderFilePreview()
              )}
            </ScrollArea>
          </TabsContent>
          <div className="absolute bottom-0 w-full px-4 h-10 flex justify-between items-center gap-4 bg-[#F2F5FF] dark:bg-[#16191A] border-t-1 border-solid border-[#EDEDED] dark:border-[#2A2F31]">
            <div className="h-full flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Badge variant="outline" className="py-0.5 h-6">
                <FileIcon className="h-3 w-3" />
                {hasHighlighting ? language.toUpperCase() : fileExtension.toUpperCase() || 'TEXT'}
              </Badge>
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {toolTimestamp && !isStreaming
                ? formatTimestamp(toolTimestamp)
                : assistantTimestamp
                  ? formatTimestamp(assistantTimestamp)
                  : ''}
            </div>
          </div>
        </CardContent>

        {/* Todo.md editing action bar */}
        {isTodoMdEditable && (
          <div className="mx-6 mb-4 -mt-2 px-3 h-15 bg-[#F2F5FF] dark:bg-[#2E3336] rounded-2xl flex">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Popover open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-5 h-5 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                    >
                      <Image className="h-4 w-4" src={flowIcoSVG} alt="" />
                      {/* <HelpCircle className="w-4 h-4" /> */}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="top" 
                    align="start"
                    className="w-90 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/80 dark:to-indigo-950/80 border border-blue-200 dark:border-blue-700 shadow-xl rounded-lg backdrop-blur-sm relative before:content-[''] before:absolute before:top-full before:left-6 before:border-l-[6px] before:border-r-[6px] before:border-t-[6px] before:border-l-transparent before:border-r-transparent before:border-t-blue-200 dark:before:border-t-blue-700"
                    sideOffset={6}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          {t('fileOperation.todoTooltipTitle')}
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed mb-2">
                          {t('fileOperation.todoTooltipContent')}
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                          {t('fileOperation.todoTooltipContent2')}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsTooltipOpen(false)}
                        className="w-5 h-5 flex items-center justify-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded transition-colors flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleNoMoreReminders}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 bg-blue-100/50 dark:bg-blue-900/30 hover:bg-blue-200/50 dark:hover:bg-blue-900/50 rounded-md transition-all duration-200"
                      >
                        {t('fileOperation.noMoreReminders')}
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="text-base text-[#3363FF]">
                  <span className="font-bold">{t('fileOperation.todoResearchPlan')}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {hasUnsavedChanges && (
                <Button 
                  size="sm"
                    variant="outline"
                    onClick={handleCancelModification}
                    className="h-8 text-xs border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-[#F2F5FF] dark:hover:bg-zinc-800 rounded-full"
                >
                    {t('fileOperation.cancelModification')}
                </Button>
                )}
                <Button 
                  size="sm"
                  onClick={hasUnsavedChanges ? handleTodoSave : handleTodoCancel}
                  className="h-8 !text-[14px] bg-[#3363FF] hover:bg-[#3363FF]-700 dark:bg-blue-500 dark:hover:bg-blue-600 !text-white rounded-lg !font-bold"
                >
                  {hasUnsavedChanges ? t('fileOperation.modifyAndExecute') : t('fileOperation.confirmExecute')}
                </Button>
              </div>
            </div>
          </div>
        )}

      </Tabs>
    </Card>
  );
}