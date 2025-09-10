import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Project } from '@/lib/api';
import { useThreadQuery } from '@/hooks/react-query/threads/use-threads';
import { useMessagesQuery } from '@/hooks/react-query/threads/use-messages';
import { useProjectQuery } from '@/hooks/react-query/threads/use-project';
import { useAgentRunsQuery } from '@/hooks/react-query/threads/use-agent-run';
import { ApiMessageType, UnifiedMessage, AgentStatus } from '../_types';

interface UseThreadDataReturn {
  messages: UnifiedMessage[];
  setMessages: React.Dispatch<React.SetStateAction<UnifiedMessage[]>>;
  project: Project | null;
  sandboxId: string | null;
  projectName: string;
  agentRunId: string | null;
  setAgentRunId: React.Dispatch<React.SetStateAction<string | null>>;
  agentStatus: AgentStatus;
  setAgentStatus: React.Dispatch<React.SetStateAction<AgentStatus>>;
  isLoading: boolean;
  error: string | null;
  initialLoadCompleted: boolean;
  threadQuery: ReturnType<typeof useThreadQuery>;
  messagesQuery: ReturnType<typeof useMessagesQuery>;
  projectQuery: ReturnType<typeof useProjectQuery>;
  agentRunsQuery: ReturnType<typeof useAgentRunsQuery>;
  // 新增：消息覆盖控制函数
  preventMessageOverride: () => void;
  allowMessageOverride: () => void;
  // 新增：todo拦截控制参数
  enableTodoIntercept: boolean;
  setEnableTodoIntercept: (enabled: boolean) => void;
  isTodoInterceptActive: boolean;
  setIsTodoInterceptActive: (active: boolean) => void;
}

export function useThreadData(threadId: string, projectId: string): UseThreadDataReturn {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [agentRunId, setAgentRunId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initialLoadCompleted = useRef<boolean>(false);
  const messagesLoadedRef = useRef(false);
  const agentRunsCheckedRef = useRef(false);
  const hasInitiallyScrolled = useRef<boolean>(false);
  // 添加标志来阻止消息覆盖（用于todo.md拦截场景）
  const preventMessageOverrideRef = useRef(false);

  // 新增：todo拦截控制状态
  const [enableTodoIntercept, setEnableTodoIntercept] = useState<boolean>(() => {
    // 从 localStorage 读取用户设置，默认为 true
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('enableTodoIntercept');
      return stored !== null ? stored === 'true' : true;
    }
    return true;
  });
  const [isTodoInterceptActive, setIsTodoInterceptActive] = useState<boolean>(false); // 当前是否处于todo拦截状态

  // 创建带 localStorage 存储的 setter
  const setEnableTodoInterceptWithStorage = useCallback((enabled: boolean) => {
    setEnableTodoIntercept(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableTodoIntercept', enabled.toString());
    }
  }, []);

  const threadQuery = useThreadQuery(threadId);
  const messagesQuery = useMessagesQuery(threadId);
  const projectQuery = useProjectQuery(projectId);
  const agentRunsQuery = useAgentRunsQuery(threadId);

  // 暴露防止消息覆盖的控制函数
  const preventMessageOverride = useCallback(() => {
    preventMessageOverrideRef.current = true;
    console.log('[useThreadData] Message override prevention enabled');
  }, []);

  const allowMessageOverride = useCallback(() => {
    preventMessageOverrideRef.current = false;
    console.log('[useThreadData] Message override prevention disabled');
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initializeData() {
      if (!initialLoadCompleted.current) setIsLoading(true);
      setError(null);
      try {
        if (!threadId) throw new Error('Thread ID is required');

        if (threadQuery.isError) {
          throw new Error('Failed to load thread data: ' + threadQuery.error);
        }
        if (!isMounted) return;

        if (projectQuery.data) {
          setProject(projectQuery.data);
          if (typeof projectQuery.data.sandbox === 'string') {
            setSandboxId(projectQuery.data.sandbox);
          } else if (projectQuery.data.sandbox?.id) {
            setSandboxId(projectQuery.data.sandbox.id);
          }

          setProjectName(projectQuery.data.name || '');
        }

        if (messagesQuery.data && !messagesLoadedRef.current) {
          const unifiedMessages = (messagesQuery.data || [])
            .filter((msg) => msg.type !== 'status')
            .map((msg: ApiMessageType) => ({
              message_id: msg.message_id || null,
              thread_id: msg.thread_id || threadId,
              type: (msg.type || 'system') as UnifiedMessage['type'],
              is_llm_message: Boolean(msg.is_llm_message),
              content: msg.content || '',
              metadata: msg.metadata || '{}',
              created_at: msg.created_at || new Date().toISOString(),
              updated_at: msg.updated_at || new Date().toISOString(),
            }));

          setMessages(unifiedMessages);
          console.log('[PAGE] Loaded Messages (excluding status, keeping browser_state):', unifiedMessages.length);
          messagesLoadedRef.current = true;

          if (!hasInitiallyScrolled.current) {
            hasInitiallyScrolled.current = true;
          }
        }

        if (agentRunsQuery.data && !agentRunsCheckedRef.current && isMounted) {
          console.log('[PAGE] Checking for active agent runs...');
          agentRunsCheckedRef.current = true;

          const activeRun = agentRunsQuery.data.find((run) => run.status === 'running');
          if (activeRun && isMounted) {
            console.log('[PAGE] Found active run on load:', activeRun.id);
            setAgentRunId(activeRun.id);
          } else {
            console.log('[PAGE] No active agent runs found');
            if (isMounted) setAgentStatus('idle');
          }
        }

        if (threadQuery.data && messagesQuery.data && agentRunsQuery.data) {
          initialLoadCompleted.current = true;
          setIsLoading(false);
        }

      } catch (err) {
        console.error('Error loading thread data:', err);
        if (isMounted) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to load thread';
          setError(errorMessage);
          toast.error(errorMessage);
          setIsLoading(false);
        }
      }
    }

    if (threadId) {
      initializeData();
    }

    return () => {
      isMounted = false;
    };
  }, [
    threadId,
    threadQuery.data,
    threadQuery.isError,
    threadQuery.error,
    projectQuery.data,
    messagesQuery.data,
    agentRunsQuery.data
  ]);

  useEffect(() => {
    if (messagesQuery.data && messagesQuery.status === 'success') {
      if (!isLoading && agentStatus !== 'running' && agentStatus !== 'connecting' && !preventMessageOverrideRef.current) {
        const unifiedMessages = (messagesQuery.data || [])
          .filter((msg) => msg.type !== 'status')
          .map((msg: ApiMessageType) => ({
            message_id: msg.message_id || null,
            thread_id: msg.thread_id || threadId,
            type: (msg.type || 'system') as UnifiedMessage['type'],
            is_llm_message: Boolean(msg.is_llm_message),
            content: msg.content || '',
            metadata: msg.metadata || '{}',
            created_at: msg.created_at || new Date().toISOString(),
            updated_at: msg.updated_at || new Date().toISOString(),
          }));

        setMessages(unifiedMessages);
        console.log('[useThreadData] Updated messages from React Query cache');
      } else if (preventMessageOverrideRef.current) {
        console.log('[useThreadData] Skipping message override due to prevention flag');
      }
    }
  }, [messagesQuery.data, messagesQuery.status, isLoading, agentStatus, threadId]);

  return {
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
    initialLoadCompleted: initialLoadCompleted.current,
    threadQuery,
    messagesQuery,
    projectQuery,
    agentRunsQuery,
    preventMessageOverride,
    allowMessageOverride,
    enableTodoIntercept,
    setEnableTodoIntercept: setEnableTodoInterceptWithStorage,
    isTodoInterceptActive,
    setIsTodoInterceptActive,
  };
} 
