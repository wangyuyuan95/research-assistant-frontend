import { Project } from '@/lib/api';
import { StreamingFileContent } from '@/hooks/useAgentStream'; // 导入流式文件内容类型

export interface ToolViewProps {
  assistantContent?: string;
  toolContent?: string;
  assistantTimestamp?: string;
  toolTimestamp?: string;
  isSuccess?: boolean;
  isStreaming?: boolean;
  project?: Project;
  name?: string;
  messages?: any[];
  agentStatus?: string;
  currentIndex?: number;
  totalCalls?: number;
  onFileClick?: (filePath: string) => void;
  onSubmitMessage?: (message: string, options?: { model_name?: string; enable_thinking?: boolean }) => void;
  selectedModel?: string;
  getActualModelId?: (modelId: string) => string;
  streamingFileContent?: StreamingFileContent | null; // 添加流式文件内容
  enableStreamingFileDisplay?: boolean; // 添加流式文件展示控制参数
  // 新增：todo拦截控制参数
  enableTodoIntercept?: boolean;
  isTodoInterceptActive?: boolean;
  setIsTodoInterceptActive?: (active: boolean) => void;
}

export interface BrowserToolViewProps extends ToolViewProps {
  name?: string;
}
