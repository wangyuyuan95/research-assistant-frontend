import { useState, useEffect } from 'react';
import { useKnowledgeBases, KnowledgeBase } from './use-knowledge-base';

const STORAGE_KEY_SELECTED_KB = 'selected-knowledge-bases';

export const useKnowledgeBaseSelection = () => {
  const [selectedKBIds, setSelectedKBIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: knowledgeBases = [], isLoading, error } = useKnowledgeBases();

  // Load selected knowledge bases from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SELECTED_KB);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedKBIds(parsed);
        }
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load selected knowledge bases from localStorage:', error);
      setIsInitialized(true);
    }
  }, []);

  // Clean up invalid knowledge base IDs when knowledge bases data changes
  useEffect(() => {
    if (isInitialized && !isLoading && knowledgeBases.length > 0) {
      const validKBIds = knowledgeBases.map(kb => kb.id);
      setSelectedKBIds(prev => {
        const validSelectedIds = prev.filter(id => validKBIds.includes(id));
        // Only update if there were invalid IDs
        return validSelectedIds.length !== prev.length ? validSelectedIds : prev;
      });
    }
  }, [knowledgeBases, isLoading, isInitialized]);

  // Save to localStorage when selection changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) return; // Don't save during initial load
    
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_KB, JSON.stringify(selectedKBIds));
    } catch (error) {
      console.error('Failed to save selected knowledge bases to localStorage:', error);
    }
  }, [selectedKBIds, isInitialized]);

  const isKBSelected = (kbId: string): boolean => {
    return selectedKBIds.includes(kbId);
  };

  const toggleKB = (kbId: string): void => {
    setSelectedKBIds(prev => {
      if (prev.includes(kbId)) {
        return prev.filter(id => id !== kbId);
      } else {
        return [...prev, kbId];
      }
    });
  };

  const selectAllKBs = (): void => {
    setSelectedKBIds(knowledgeBases.map(kb => kb.id));
  };

  const deselectAllKBs = (): void => {
    setSelectedKBIds([]);
  };

  const getSelectedKBs = (): KnowledgeBase[] => {
    return knowledgeBases.filter(kb => selectedKBIds.includes(kb.id));
  };

  const getSelectedCount = (): number => {
    // Return count of actually valid selected knowledge bases
    return knowledgeBases.filter(kb => selectedKBIds.includes(kb.id)).length;
  };

  const getAllCount = (): number => {
    return knowledgeBases.length;
  };

  const isAllSelected = (): boolean => {
    return knowledgeBases.length > 0 && 
           knowledgeBases.filter(kb => selectedKBIds.includes(kb.id)).length === knowledgeBases.length;
  };

  const isNoneSelected = (): boolean => {
    return knowledgeBases.filter(kb => selectedKBIds.includes(kb.id)).length === 0;
  };

  return {
    knowledgeBases,
    selectedKBIds,
    isLoading,
    error,
    isKBSelected,
    toggleKB,
    selectAllKBs,
    deselectAllKBs,
    getSelectedKBs,
    getSelectedCount,
    getAllCount,
    isAllSelected,
    isNoneSelected,
  };
}; 