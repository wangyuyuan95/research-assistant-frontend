import { useState, useCallback, useEffect } from 'react';
import { backendApi } from '@/lib/api-client';

// Types based on the Python API
export interface TimePeriodStats {
  total: number;
  last_1d: number;
  last_3d: number;
  last_7d: number;
  last_15d: number;
  last_30d: number;
  last_90d: number;
}

export interface UseStatisticsResponse {
  users: TimePeriodStats;
  projects: TimePeriodStats;
  questions: TimePeriodStats;
  generated_at: string;
}

export interface UserInfo {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone?: string;
  is_super_admin: boolean;
  is_anonymous: boolean;
}

export interface UserListRequest {
  page: number;
  page_size: number;
  start_time?: string;
  end_time?: string;
}

export interface UserListResponse {
  users: UserInfo[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProjectInfo {
  project_id: string;
  name: string;
  description?: string;
  account_id: string;
  user_email: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  sandbox?: any;
}

export interface ProjectListRequest {
  page: number;
  page_size: number;
  user_emails?: string[];
  exclude_user_emails?: string[];
  start_time?: string;
  end_time?: string;
}

export interface ProjectListResponse {
  projects: ProjectInfo[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserQuestionItem {
  account_id: string;
  user_email?: string;
  thread_id: string;
  message_id: string;
  created_at: string;
  question_text?: string;
}

export interface UserQuestionsRequest {
  page: number;
  page_size: number;
  user_emails?: string[];
  exclude_user_emails?: string[];
  start_time?: string;
  end_time?: string;
}

export interface UserQuestionsResponse {
  items: UserQuestionItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Statistics API hook
export function useStatisticsApi() {
  const [statistics, setStatistics] = useState<UseStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await backendApi.get<UseStatisticsResponse>(
        '/use-statistics/statistics'
      );

      if (response.success && response.data) {
        setStatistics(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    return fetchStatistics();
  }, [fetchStatistics]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    isLoading,
    error,
    fetchStatistics,
    refetch
  };
}

// Users API hook
export function useUsersApi() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (request: UserListRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await backendApi.post<UserListResponse>(
        '/use-statistics/users',
        request
      );

      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalCount(response.data.total_count);
        setTotalPages(response.data.total_pages);
      } else {
        setError(response.error?.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    users,
    totalCount,
    totalPages,
    isLoading,
    error,
    fetchUsers
  };
}

// Projects API hook
export function useProjectsApi() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (request: ProjectListRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await backendApi.post<ProjectListResponse>(
        '/use-statistics/projects',
        request
      );

      if (response.success && response.data) {
        setProjects(response.data.projects);
        setTotalCount(response.data.total_count);
        setTotalPages(response.data.total_pages);
      } else {
        setError(response.error?.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    projects,
    totalCount,
    totalPages,
    isLoading,
    error,
    fetchProjects
  };
}

// Questions API hook
export function useQuestionsApi() {
  const [questions, setQuestions] = useState<UserQuestionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (request: UserQuestionsRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await backendApi.post<UserQuestionsResponse>(
        '/use-statistics/user-questions',
        request
      );

      if (response.success && response.data) {
        setQuestions(response.data.items);
        setTotalCount(response.data.total_count);
        setTotalPages(response.data.total_pages);
      } else {
        setError(response.error?.message || 'Failed to fetch questions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    questions,
    totalCount,
    totalPages,
    isLoading,
    error,
    fetchQuestions
  };
}
