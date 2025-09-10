import React, { useState, useEffect } from 'react';
import { FileOperationToolView } from '@/components/thread/tool-views/file-operation/FileOperationToolView';
import { StreamingFileContent } from '@/hooks/useAgentStream';

export function AutoScrollTest() {
  const [streamingFileContent, setStreamingFileContent] = useState<StreamingFileContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 模拟一个很长的文件内容，逐步增长
  const generateLongContent = (step: number) => {
    const lines = [];
    for (let i = 1; i <= step * 5; i++) {
      lines.push(`# 第 ${i} 行标题`);
      lines.push('');
      lines.push(`这是第 ${i} 行的内容，包含一些详细的描述信息。这里有更多的文字来模拟真实的文档内容。`);
      lines.push('');
      lines.push('- 列表项 1');
      lines.push('- 列表项 2');
      lines.push('- 列表项 3');
      lines.push('');
      lines.push('```javascript');
      lines.push(`console.log('这是第 ${i} 行的代码示例');`);
      lines.push(`function example${i}() {`);
      lines.push(`  return "示例函数 ${i}";`);
      lines.push('}');
      lines.push('```');
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    return lines.join('\n');
  };

  // 模拟流式播放，逐步增加内容
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 30) {
          setIsPlaying(false);
          return prev;
        }
        
        const newStep = prev + 1;
        setStreamingFileContent({
          toolName: 'create_file',
          fileName: 'long-document.md',
          content: generateLongContent(newStep),
          isComplete: newStep >= 30
        });
        
        return newStep;
      });
    }, 800); // 每800ms增加内容

    return () => clearInterval(timer);
  }, [isPlaying]);

  const startTest = () => {
    setCurrentStep(0);
    setStreamingFileContent(null);
    setIsPlaying(true);
  };

  const stopTest = () => {
    setIsPlaying(false);
  };

  const resetTest = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setStreamingFileContent(null);
  };

  // 模拟 todo.md 的测试
  const startTodoTest = () => {
    setCurrentStep(0);
    setIsPlaying(true);
    
    let todoStep = 0;
    const todoInterval = setInterval(() => {
      todoStep++;
      const todoItems = [];
      for (let i = 1; i <= todoStep * 2; i++) {
        todoItems.push(`- [ ] 待办事项 ${i}`);
        if (i % 3 === 0) {
          todoItems.push(`  - [ ] 子任务 ${i}.1`);
          todoItems.push(`  - [ ] 子任务 ${i}.2`);
        }
      }
      
      const content = `# Todo 列表\n\n${todoItems.join('\n')}\n\n## 完成的任务\n\n- [x] 已完成的任务 1\n- [x] 已完成的任务 2`;
      
      setStreamingFileContent({
        toolName: 'create_file',
        fileName: 'todo.md',
        content,
        isComplete: todoStep >= 15
      });
      
      if (todoStep >= 15) {
        clearInterval(todoInterval);
        setIsPlaying(false);
      }
    }, 1000);
  };

  return (
    <div className="flex h-screen">
      {/* 左侧控制面板 */}
      <div className="w-1/3 p-4 bg-gray-50 border-r overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">自动滚动功能测试</h2>
        
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <button 
              onClick={startTest}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isPlaying}
            >
              测试长文档
            </button>
            <button 
              onClick={startTodoTest}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={isPlaying}
            >
              测试 Todo.md
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={stopTest}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={!isPlaying}
            >
              停止测试
            </button>
            <button 
              onClick={resetTest}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              重置测试
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 bg-white rounded border">
          <h3 className="font-semibold mb-2">测试状态:</h3>
          <p><strong>播放状态:</strong> {isPlaying ? '播放中' : '已停止'}</p>
          <p><strong>当前步骤:</strong> {currentStep}/30</p>
          <p><strong>文件名:</strong> {streamingFileContent?.fileName || '无'}</p>
          <p><strong>内容长度:</strong> {streamingFileContent?.content?.length || 0} 字符</p>
          <p><strong>是否完成:</strong> {streamingFileContent?.isComplete ? '是' : '否'}</p>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">自动滚动功能说明:</h3>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>✅ 内容增长时自动滚动到底部</li>
            <li>✅ 检测用户手动滚动行为</li>
            <li>✅ 用户滚动时暂停自动滚动</li>
            <li>✅ 用户回到底部时恢复自动滚动</li>
            <li>✅ 5秒无操作后重新启用自动滚动</li>
          </ul>
        </div>

        <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">测试方法:</h3>
          <ol className="text-sm text-green-700 list-decimal list-inside space-y-1">
            <li>点击"测试长文档"开始测试</li>
            <li>观察内容自动滚动到底部</li>
            <li>手动向上滚动查看之前的内容</li>
            <li>观察自动滚动是否停止</li>
            <li>滚动回到底部或等待5秒</li>
            <li>观察自动滚动是否恢复</li>
          </ol>
        </div>

        <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Todo.md 特殊测试:</h3>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>测试可编辑的 TodoSourceEditor</li>
            <li>验证预览模式的 TodoPreviewEditor</li>
            <li>检查两种模式的自动滚动效果</li>
          </ul>
        </div>

        {/* 性能监控 */}
        <div className="p-3 bg-gray-100 rounded text-xs">
          <h4 className="font-bold mb-2">性能监控:</h4>
          <p>内容更新频率: 每800ms</p>
          <p>滚动检测: passive 事件监听</p>
          <p>DOM更新延迟: 50ms</p>
        </div>
      </div>

      {/* 右侧文件工具视图 */}
      <div className="flex-1 bg-white">
        {streamingFileContent ? (
          <FileOperationToolView
            name="create-file"
            assistantContent=""
            toolContent=""
            isSuccess={true}
            isStreaming={!streamingFileContent.isComplete}
            streamingFileContent={streamingFileContent}
            enableStreamingFileDisplay={true}
            assistantTimestamp={new Date().toISOString()}
            toolTimestamp={new Date().toISOString()}
            project={null}
            messages={[]}
            agentStatus="running"
            onSubmitMessage={() => {}}
            selectedModel={null}
            getActualModelId={() => null}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2 text-gray-600">自动滚动测试</h3>
              <p className="text-gray-500">点击左侧按钮开始测试</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 