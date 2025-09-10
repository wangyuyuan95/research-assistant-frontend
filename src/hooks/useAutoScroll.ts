import { useRef, useEffect, useCallback, useState } from 'react';

interface UseAutoScrollOptions {
  content?: string | null;
  isStreaming?: boolean;
  enabled?: boolean;
}

interface UseAutoScrollResult {
  scrollRef: React.RefObject<HTMLDivElement>;
  isUserScrolling: boolean;
  scrollToBottom: () => void;
  resetUserScrolling: () => void;
}

export function useAutoScroll({
  content,
  isStreaming = false,
  enabled = true,
}: UseAutoScrollOptions): UseAutoScrollResult {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastContentLength, setLastContentLength] = useState(0);
  const lastScrollTop = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const userScrollTimeoutRef = useRef<NodeJS.Timeout>();

  // 检测用户是否手动滚动
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !enabled) return;

    // 尝试找到实际的滚动容器
    let scrollElement = scrollRef.current;
    
    // 如果是 Radix UI ScrollArea，找到 Viewport 元素
    const viewport = scrollElement.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      scrollElement = viewport as HTMLDivElement;
    }
    
    const currentScrollTop = scrollElement.scrollTop;
    const scrollHeight = scrollElement.scrollHeight;
    const clientHeight = scrollElement.clientHeight;
    
    // 检测是否接近底部（允许一些误差）
    const isNearBottom = scrollHeight - clientHeight - currentScrollTop < 50;
    
    // 如果用户向上滚动了一定距离，认为是手动滚动
    if (currentScrollTop < lastScrollTop.current - 10 && !isNearBottom) {
      setIsUserScrolling(true);
      
      // 清除之前的超时
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      
      // 5秒后重置用户滚动状态（如果用户停止滚动）
      userScrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 5000);
    } else if (isNearBottom) {
      // 如果用户滚动到底部附近，取消用户滚动状态
      setIsUserScrolling(false);
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    }
    
    lastScrollTop.current = currentScrollTop;
  }, [enabled]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    
    // 尝试找到实际的滚动容器
    let scrollElement = scrollRef.current;
    
    // 如果是 Radix UI ScrollArea，找到 Viewport 元素
    const viewport = scrollElement.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      scrollElement = viewport as HTMLDivElement;
    }
    
    // 确保元素存在且有滚动能力
    if (scrollElement && scrollElement.scrollHeight > scrollElement.clientHeight) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
      console.log('[useAutoScroll] Scrolled to bottom:', {
        scrollTop: scrollElement.scrollTop,
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight
      });
    }
  }, []);

  // 重置用户滚动状态
  const resetUserScrolling = useCallback(() => {
    setIsUserScrolling(false);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
  }, []);

  // 当内容变化时，检查是否需要自动滚动
  useEffect(() => {
    if (!enabled || !content || !isStreaming) return;

    const currentContentLength = content.length;
    
    console.log('[useAutoScroll] Content changed:', {
      currentLength: currentContentLength,
      lastLength: lastContentLength,
      isUserScrolling,
      enabled,
      isStreaming
    });
    
    // 只有在内容增加且用户没有手动滚动时才自动滚动
    if (currentContentLength > lastContentLength && !isUserScrolling) {
      console.log('[useAutoScroll] Triggering auto scroll');
      // 使用 setTimeout 确保 DOM 更新后再滚动
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
    
    setLastContentLength(currentContentLength);
  }, [content, isStreaming, isUserScrolling, enabled, lastContentLength, scrollToBottom]);

  // 绑定滚动事件监听器
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !enabled) return;

    // 找到实际的滚动容器
    let actualScrollElement = scrollElement;
    const viewport = scrollElement.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      actualScrollElement = viewport as HTMLDivElement;
    }

    actualScrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      actualScrollElement.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, [handleScroll, enabled]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    scrollRef,
    isUserScrolling,
    scrollToBottom,
    resetUserScrolling,
  };
} 