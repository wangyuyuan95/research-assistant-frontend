import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutoScroll } from '@/hooks/useAutoScroll';

export function ScrollFixTest() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const autoScroll = useAutoScroll({
    content,
    isStreaming,
    enabled: true,
  });

  const startStreaming = () => {
    setIsStreaming(true);
    setContent('');
    
    let lineCount = 0;
    const interval = setInterval(() => {
      lineCount++;
      setContent(prev => prev + `这是第 ${lineCount} 行内容，用于测试自动滚动功能。\n\n`);
      
      if (lineCount >= 50) {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 500);
  };

  const reset = () => {
    setContent('');
    setIsStreaming(false);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/3 p-4 bg-gray-50 border-r">
        <h2 className="text-lg font-bold mb-4">自动滚动修复测试</h2>
        
        <div className="space-y-2 mb-4">
          <button 
            onClick={startStreaming}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isStreaming}
          >
            开始流式输出
          </button>
          <button 
            onClick={reset}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            重置
          </button>
        </div>

        <div className="p-3 bg-white rounded border text-sm">
          <p><strong>状态:</strong> {isStreaming ? '流式中' : '已停止'}</p>
          <p><strong>内容长度:</strong> {content.length} 字符</p>
          <p><strong>行数:</strong> {content.split('\n').length}</p>
          <p><strong>用户滚动:</strong> {autoScroll.isUserScrolling ? '是' : '否'}</p>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">测试说明:</h3>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>点击"开始流式输出"</li>
            <li>观察内容是否自动滚动到底部</li>
            <li>手动向上滚动查看之前内容</li>
            <li>观察自动滚动是否停止</li>
            <li>滚动回底部，观察是否恢复自动滚动</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">修复内容:</h3>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>✅ 修复 Radix UI ScrollArea 兼容性</li>
            <li>✅ 正确找到滚动容器 [data-radix-scroll-area-viewport]</li>
            <li>✅ 添加调试日志便于排查问题</li>
            <li>✅ 优化滚动事件监听器绑定</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="h-full border rounded-lg overflow-hidden">
          <ScrollArea className="h-full" ref={autoScroll.scrollRef}>
            <div className="p-4">
              {content || (
                <div className="text-center text-gray-500 py-8">
                  点击"开始流式输出"开始测试
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
} 