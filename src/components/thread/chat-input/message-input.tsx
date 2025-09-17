import React, { forwardRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Square, Loader2, ArrowUp, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { UploadedFile } from './chat-input';
import { FileUploadHandler } from './file-upload-handler';
import { VoiceRecorder } from './voice-recorder';
import { ModelSelector } from './model-selector';
import { KnowledgeBaseSelector } from './knowledge-base-selector';
import { SubscriptionStatus } from './_use-model-selection';
import { isLocalMode } from '@/lib/config';
import { TooltipContent } from '@/components/ui/tooltip';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { useTranslation } from 'react-i18next';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTranscription: (text: string) => void;
  placeholder: string;
  loading: boolean;
  disabled: boolean;
  isAgentRunning: boolean;
  onStopAgent?: () => void;
  isDraggingOver: boolean;
  uploadedFiles: UploadedFile[];

  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
  sandboxId?: string;
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  hideAttachments?: boolean;
  messages?: any[]; // Add messages prop

  selectedModel: string;
  onModelChange: (model: string) => void;
  modelOptions: any[];
  subscriptionStatus: SubscriptionStatus;
  canAccessModel: (modelId: string) => boolean;
  refreshCustomModels?: () => void;
  // 新增：todo拦截控制参数
  enableTodoIntercept?: boolean;
  setEnableTodoIntercept?: (enabled: boolean) => void;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onTranscription,
      placeholder,
      loading,
      disabled,
      isAgentRunning,
      onStopAgent,
      isDraggingOver,
      uploadedFiles,

      fileInputRef,
      isUploading,
      sandboxId,
      setPendingFiles,
      setUploadedFiles,
      setIsUploading,
      hideAttachments = false,
      messages = [],

      selectedModel,
      onModelChange,
      modelOptions,
      subscriptionStatus,
      canAccessModel,
      refreshCustomModels,
      enableTodoIntercept = true,
      setEnableTodoIntercept,
    },
    ref,
  ) => {
    const { t } = useTranslation();

    // 创建设置下拉菜单组件
    const TodoInterceptSettings = () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t('computer.autoExecuteResearch')}
              </span>
              <Switch
                checked={!enableTodoIntercept}
                onCheckedChange={(checked) => {
                  setEnableTodoIntercept?.(!checked);
                }}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('computer.autoExecuteResearchDesc')}
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    useEffect(() => {
      const textarea = ref as React.RefObject<HTMLTextAreaElement>;
      if (!textarea.current) return;

      const adjustHeight = () => {
        textarea.current!.style.height = 'auto';
        const newHeight = Math.min(
          Math.max(textarea.current!.scrollHeight, 24),
          200,
        );
        textarea.current!.style.height = `${newHeight}px`;
      };

      adjustHeight();

      // Call it twice to ensure proper height calculation
      adjustHeight();

      window.addEventListener('resize', adjustHeight);
      return () => window.removeEventListener('resize', adjustHeight);
    }, [value, ref]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (
          (value.trim() || uploadedFiles.length > 0) &&
          !loading &&
          (!disabled || isAgentRunning)
        ) {
          onSubmit(e as unknown as React.FormEvent);
        }
      }
    };

    return (
      <div className="flex flex-col w-full h-auto gap-4 justify-between">
        <div className="flex gap-2 items-center">
          <Textarea
            ref={ref}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'w-full bg-transparent dark:bg-transparent border-none shadow-none focus-visible:ring-0 px-2 py-1 text-base min-h-[60px] max-h-[220px] overflow-y-auto resize-none',
              isDraggingOver ? 'opacity-40' : '',
            )}
            disabled={loading || (disabled && !isAgentRunning)}
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KnowledgeBaseSelector
              disabled={loading || (disabled && !isAgentRunning)}
            />
            {!hideAttachments && (
              <FileUploadHandler
                ref={fileInputRef}
                loading={loading}
                disabled={disabled}
                isAgentRunning={isAgentRunning}
                isUploading={isUploading}
                sandboxId={sandboxId}
                setPendingFiles={setPendingFiles}
                setUploadedFiles={setUploadedFiles}
                setIsUploading={setIsUploading}
                messages={messages}
              />
            )}
            <VoiceRecorder
              onTranscription={onTranscription}
              disabled={loading || (disabled && !isAgentRunning)}
            />
          </div>
          {subscriptionStatus === 'no_subscription' && !isLocalMode() &&
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <p className='text-sm text-amber-500 hidden sm:block'>{t('subscription.upgradeForFullPerformance')}</p>
                  <div className='sm:hidden absolute bottom-0 left-0 right-0 flex justify-center'>
                    <p className='text-xs text-amber-500 px-2 py-1'>
                      {t('subscription.upgradeForBetterPerformance')}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('subscription.freeTierLimited')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
          <div className='flex items-center gap-3'>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              modelOptions={modelOptions}
              subscriptionStatus={subscriptionStatus}
              canAccessModel={canAccessModel}
              refreshCustomModels={refreshCustomModels}
            />
            <TodoInterceptSettings />
            <Button
              type="submit"
              onClick={isAgentRunning && onStopAgent ? onStopAgent : onSubmit}
              size="sm"
              className={cn(
                'h-[34px] w-[34px] p-0 bg-[none] flex-shrink-0 self-end',
                isAgentRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
                (!value.trim() && uploadedFiles.length === 0 && !isAgentRunning) ||
                  loading ||
                  (disabled && !isAgentRunning)
                  ? 'bg-primary/50'
                  : '',
              )}
              disabled={
                (!value.trim() && uploadedFiles.length === 0 && !isAgentRunning) ||
                loading ||
                (disabled && !isAgentRunning)
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAgentRunning ? (
                <Square className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

MessageInput.displayName = 'MessageInput';