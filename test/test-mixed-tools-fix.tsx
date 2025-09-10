import React, { useState, useEffect } from 'react';
import { ToolCallSidePanel } from '@/components/thread/tool-call-side-panel';
import { StreamingFileContent } from '@/hooks/useAgentStream';

interface MockToolCall {
  assistantCall: {
    name: string;
    content: string;
    timestamp: string;
  };
  toolResult: {
    content: string;
    isSuccess: boolean;
    timestamp: string;
  };
}

export function MixedToolsFixTest() {
  const [streamingFileContent, setStreamingFileContent] = useState<StreamingFileContent | null>(null);
  const [toolCalls, setToolCalls] = useState<MockToolCall[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // 模拟混合工具类型的场景
  const mixedToolSteps = [
    // 第一个文件创建
    { 
      type: 'streaming_file', 
      fileName: 'file_A.md', 
      content: '# File A\n\nThis is file A content', 
      toolName: 'create_file',
      complete: false 
    },
    { 
      type: 'streaming_file', 
      fileName: 'file_A.md', 
      content: '# File A\n\nThis is file A content.\n\nMore content for file A.', 
      toolName: 'create_file',
      complete: true 
    },
    // 添加搜索工具调用
    {
      type: 'tool_call',
      toolCall: {
        assistantCall: {
          name: 'web-search',
          content: '<invoke name="web_search"><parameter name="query">AI research</parameter></invoke>',
          timestamp: new Date().toISOString(),
        },
        toolResult: {
          content: '{"results": [{"title": "AI Research Results", "url": "https://example.com"}]}',
          isSuccess: true,
          timestamp: new Date().toISOString(),
        },
      }
    },
    // 第二个文件创建（这个应该能正常触发）
    { 
      type: 'streaming_file', 
      fileName: 'file_B.md', 
      content: '# File B\n\nThis is file B', 
      toolName: 'create_file',
      complete: false 
    },
    { 
      type: 'streaming_file', 
      fileName: 'file_B.md', 
      content: '# File B\n\nThis is file B content.\n\nFile B has more content now.', 
      toolName: 'create_file',
      complete: false 
    },
    { 
      type: 'streaming_file', 
      fileName: 'file_B.md', 
      content: '# File B\n\nThis is file B content.\n\nFile B has more content now.\n\nFile B is complete!', 
      toolName: 'create_file',
      complete: true 
    },
  ];

  // 模拟流式播放
  useEffect(() => {
    if (!isPlaying || currentStep >= mixedToolSteps.length) return;

    const timer = setTimeout(() => {
      const step = mixedToolSteps[currentStep];
      
      if (step.type === 'streaming_file') {
        setStreamingFileContent({
          toolName: step.toolName as 'create_file',
          fileName: step.fileName,
          content: step.content,
          isComplete: step.complete
        });
        
        // 检测到新文件时打开面板
        if (currentStep === 0 || (currentStep === 3 && step.fileName === 'file_B.md')) {
          setIsSidePanelOpen(true);
        }
      } else if (step.type === 'tool_call') {
        // 添加非文件工具调用
        setToolCalls(prev => [...prev, step.toolCall]);
      }
      
      setCurrentStep(prev => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const startTest = () => {
    setCurrentStep(0);
    setStreamingFileContent(null);
    setToolCalls([]);
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
    setToolCalls([]);
    setIsSidePanelOpen(false);
  };

  const getCurrentStepInfo = () => {
    if (currentStep === 0) return "第1步：开始创建文件A";
    if (currentStep === 1) return "第2步：文件A创建完成";
    if (currentStep === 2) return "第3步：添加搜索工具调用";
    if (currentStep === 3) return "第4步：开始创建文件B（关键测试点）";
    if (currentStep === 4) return "第5步：文件B内容增长";
    if (currentStep === 5) return "第6步：文件B创建完成";
    return `第${currentStep + 1}步`;
  };

  return (
    <div className="flex h-screen">
      {/* 左侧控制面板 */}
      <div className="w-1/3 p-4 bg-gray-50 border-r overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">混合工具类型修复测试</h2>
        
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
          <p><strong>当前步骤:</strong> {currentStep}/{mixedToolSteps.length}</p>
          <p><strong>步骤描述:</strong> {getCurrentStepInfo()}</p>
          <p><strong>面板状态:</strong> {isSidePanelOpen ? '已打开' : '已关闭'}</p>
          <p><strong>当前文件:</strong> {streamingFileContent?.fileName || '无'}</p>
          <p><strong>工具调用数:</strong> {toolCalls.length}</p>
        </div>

        <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
          <h3 className="font-semibold text-red-800 mb-2">问题说明:</h3>
          <p className="text-sm text-red-700 mb-2">
            修复前：文件A → 搜索工具 → 文件B时，文件B不会触发面板显示和流式效果
          </p>
          <p className="text-sm text-red-700">
            修复后：应该能正确识别文件B，创建虚拟工具调用并显示流式效果
          </p>
        </div>

        <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">修复要点:</h3>
          <ul className="text-sm text-green-700 list-disc list-inside">
            <li>✅ 只检查匹配当前文件的真实工具调用</li>
            <li>✅ 忽略非文件工具（如搜索）</li>
            <li>✅ 按文件名精确匹配虚拟调用</li>
            <li>✅ 添加类型安全检查</li>
          </ul>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">预期效果:</h3>
          <ol className="text-sm text-blue-700 list-decimal list-inside">
            <li>第1-2步：文件A正常流式显示</li>
            <li>第3步：添加搜索工具（不影响后续文件）</li>
            <li><strong>第4步：文件B应该立即触发面板显示</strong></li>
            <li>第5-6步：文件B内容正常流式增长</li>
          </ol>
        </div>

        {/* 工具调用列表 */}
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <h4 className="font-semibold mb-2">当前工具调用:</h4>
          {toolCalls.length === 0 ? (
            <p className="text-sm text-gray-600">暂无工具调用</p>
          ) : (
            <ul className="text-sm space-y-1">
              {toolCalls.map((call, index) => (
                <li key={index} className="p-2 bg-white rounded border">
                  <strong>{call.assistantCall.name}</strong>
                  <br />
                  <span className="text-gray-600 text-xs">
                    {call.assistantCall.content.substring(0, 50)}...
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 调试信息 */}
        <div className="p-3 bg-gray-100 rounded text-xs">
          <h4 className="font-bold mb-2">调试信息:</h4>
          <pre className="whitespace-pre-wrap">{JSON.stringify({
            streamingFileContent,
            toolCallsCount: toolCalls.length,
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
          <p className="text-gray-600 mb-4">
            这里模拟主要的聊天内容区域。关键测试点是第4步，当文件B开始创建时，右侧面板应该立即显示。
          </p>
          
          <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">关键观察点:</h4>
            <ul className="text-sm text-yellow-700 list-disc list-inside">
              <li>第3步添加搜索工具后，工具调用数变为1</li>
              <li>第4步文件B出现时，面板应该立即打开并显示文件B内容</li>
              <li>检查浏览器控制台的日志输出</li>
            </ul>
          </div>
        </div>

        {/* 工具面板 */}
        <ToolCallSidePanel
          isOpen={isSidePanelOpen}
          onClose={() => setIsSidePanelOpen(false)}
          toolCalls={toolCalls}
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