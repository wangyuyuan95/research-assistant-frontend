import { useQuery } from '@tanstack/react-query';

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  chunk_count: number;
  document_count: number;
  status: string;
  create_date: string;
  update_date: string;
}

export interface KnowledgeBaseResponse {
  code: number;
  data: KnowledgeBase[];
}

const fetchKnowledgeBases = async (): Promise<KnowledgeBase[]> => {
  const kbUrl = process.env.NEXT_PUBLIC_KB_URL;
  const apiKey = localStorage.getItem('kb_api_key');
  
  if (!kbUrl || !apiKey) {
    return [];
  }

  try {
    const response = await fetch(`${kbUrl}/api/v1/datasets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch knowledge bases');
    }

    const result: KnowledgeBaseResponse = await response.json();
    
    if (result.code === 0) {
      return result.data;
    } else {
      console.error('Knowledge base API error:', result);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch knowledge bases:', error);
    return [];
  }
};

export const useKnowledgeBases = () => {
  const kbUrl = process.env.NEXT_PUBLIC_KB_URL;
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('kb_api_key') : null;
  
  return useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: fetchKnowledgeBases,
    enabled: Boolean(kbUrl && apiKey),
    staleTime: 0, // Always treat data as stale
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
}; 