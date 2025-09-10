import React, { useState, useEffect } from 'react';
import { ToolCallSidePanel } from '@/components/thread/tool-call-side-panel';
import { StreamingFileContent } from '@/hooks/useAgentStream';

export function FirstFileFixTest() {
  const [streamingFileContent, setStreamingFileContent] = useState<StreamingFileContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // 模拟第一个文件的流式数据
  const firstFileSteps = [
    { step: 1, fileName: '', content: '', complete: false },
    { step: 2, fileName: 'test.md', content: '', complete: false },
    { step: 3, fileName: 'test.md', content: '# Hello', complete: false },
    { step: 4, fileName: 'test.md', content: '# Hello\n\nThis is', complete: false },
    { step: 5, fileName: 'test.md', content: '# Hello\n\nThis is a test file', complete: false },
    { step: 6, fileName: 'test.md', content: '# Hello\n\nThis is a test file content.', complete: true },
  ];

  // 模拟流式播放
  useEffect(() => {
    if (!isPlaying || currentStep >= firstFileSteps.length) return;

    const timer = setTimeout(() => {
      const step = firstFileSteps[currentStep];
      
      if (step.fileName) {
        setStreamingFileContent({
          toolName: 'create_file',
          fileName: step.fileName,
          content: step.content,
          isComplete: step.complete
        });
        
        // 第一次检测到文件名时打开面板
        if (currentStep === 1) {
          setIsSidePanelOpen(true);
        }
      }
      
      setCurrentStep(prev => prev + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const startTest = () => {
    setCurrentStep(0);
    setStreamingFileContent(null);
    setIsSidePanelOpen(false);
    setIsPlaying(true);
  };

  const stopTest = () => {
    setIsPlaying(false);
  };

  const resetTest = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setStreamingFileContent(null);
    setIsSidePanelOpen(false);
  };

  return (
    <div className="flex h-screen">
      {/* 左侧控制面板 */}
      <div className="w-1/3 p-4 bg-gray-50 border-r">
        <h2 className="text-lg font-bold mb-4">第一个文件触发测试</h2>
        
        <div className="mb-4 flex gap-2">
          <button 
            onClick={startTest}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isPlaying}
          >
            开始测试
          </button>
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

        <div className="mb-4 p-3 bg-white rounded border">
          <h3 className="font-semibold mb-2">测试状态:</h3>
          <p><strong>播放状态:</strong> {isPlaying ? '播放中' : '已停止'}</p>
          <p><strong>当前步骤:</strong> {currentStep}/{firstFileSteps.length}</p>
          <p><strong>面板状态:</strong> {isSidePanelOpen ? '已打开' : '已关闭'}</p>
          <p><strong>文件名:</strong> {streamingFileContent?.fileName || '无'}</p>
          <p><strong>内容长度:</strong> {streamingFileContent?.content?.length || 0}</p>
          <p><strong>是否完成:</strong> {streamingFileContent?.isComplete ? '是' : '否'}</p>
        </div>

        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">修复要点:</h3>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            <li>✅ 创建虚拟工具调用解决面板显示问题</li>
            <li>✅ 检测到流式文件内容时立即打开面板</li>
            <li>✅ 虚拟调用随流式内容实时更新</li>
            <li>✅ 真实调用到达时自动替换虚拟调用</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">预期效果:</h3>
          <ol className="text-sm text-blue-700 list-decimal list-inside">
            <li>点击"开始测试"</li>
            <li>第2步：检测到文件名时，右侧面板立即打开</li>
            <li>第3-6步：文件内容逐步流式增长</li>
            <li>整个过程右侧面板应该显示文件工具和内容</li>
          </ol>
        </div>

        {/* 调试信息 */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <h4 className="font-bold">调试信息:</h4>
          <pre>{JSON.stringify({
            streamingFileContent,
            currentStep,
            isPlaying,
            isSidePanelOpen
          }, null, 2)}</pre>
        </div>
      </div>

      {/* 右侧工具面板 */}
      <div className="flex-1 relative">
        <div className="p-4 bg-white h-full">
          <h3 className="text-lg font-semibold mb-4">主内容区域</h3>
          <p className="text-gray-600">
            这里模拟主要的聊天内容区域。右侧工具面板应该在检测到第一个文件时立即显示。
          </p>
        </div>

        {/* 工具面板 */}
        <ToolCallSidePanel
          isOpen={isSidePanelOpen}
          onClose={() => setIsSidePanelOpen(false)}
          toolCalls={[]} // 故意传空数组来测试虚拟工具调用
          currentIndex={0}
          onNavigate={() => {}}
          messages={[]}
          agentStatus="running"
          project={null}
          streamingFileContent={streamingFileContent}
          enableStreamingFileDisplay={true}
        />
      </div>
    </div>
  );
} 