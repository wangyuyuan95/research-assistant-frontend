import React, { useState, useEffect } from 'react';
import { FileOperationToolView } from '@/components/thread/tool-views/file-operation/FileOperationToolView';
import { StreamingFileContent } from '@/hooks/useAgentStream';

// 测试SSE数据示例 - 基于multi-files-sse-example-data.txt构建
const sseTestData = [
  // 第一个文件 - create_file
  { sequence: 5, content: "<function_calls>\n" },
  { sequence: 6, content: "<invoke name=\"create_" },
  { sequence: 7, content: "file\">\n<parameter name" },
  { sequence: 8, content: "=\"file_path\">" },
  { sequence: 9, content: "测试段落一." },
  { sequence: 10, content: "md</parameter>" },
  { sequence: 11, content: "\n<parameter name=\"file" },
  { sequence: 12, content: "_contents" },
  { sequence: 13, content: "\"># 测试段" },
  { sequence: 14, content: "落一\n\n这是" },
  { sequence: 15, content: "测试段落一" },
  { sequence: 16, content: "的文本内容" },
  { sequence: 17, content: "。" },
  { sequence: 18, content: "</parameter>\n</invoke" },
  { sequence: 19, content: ">\n</function_" },
  { sequence: 20, content: "calls>\n\n##" },
];

// TODO.md测试数据
const todoTestData = [
  { sequence: 16, content: "<invoke name=\"create_" },
  { sequence: 17, content: "file\">\n<parameter name" },
  { sequence: 18, content: "=\"file_path\">" },
  { sequence: 19, content: "todo.m" },
  { sequence: 20, content: "d</parameter>\n" },
  { sequence: 21, content: "<parameter name=\"file_" },
  { sequence: 22, content: "contents\"># CRISPR" },
  { sequence: 23, content: "-Cas9在" },
  { sequence: 24, content: "DMD治疗" },
  { sequence: 25, content: "中脱靶风险" },
  // ... 更多内容
];

export function StreamingFileTest() {
  const [streamingFileContent, setStreamingFileContent] = useState<StreamingFileContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testData, setTestData] = useState(sseTestData);

  // 模拟流式数据播放
  useEffect(() => {
    if (!isPlaying || currentIndex >= testData.length) return;

    const timer = setTimeout(() => {
      // 构建当前的累积内容
      const currentContent = testData
        .slice(0, currentIndex + 1)
        .sort((a, b) => a.sequence - b.sequence)
        .reduce((acc, chunk) => acc + chunk.content, '');

      // 提取文件内容
      const createFileMatch = currentContent.match(/<invoke name="create_file">/);
      const rewriteFileMatch = currentContent.match(/<invoke name="full_file_rewrite">/);
      
      if (createFileMatch || rewriteFileMatch) {
        const toolName = createFileMatch ? 'create_file' : 'full_file_rewrite';
        
        // 提取文件路径
        const filePathMatch = currentContent.match(/<parameter name="file_path">([^<]*)/);
        const fileName = filePathMatch ? filePathMatch[1] : '';
        
        // 提取文件内容
        const fileContentsMatch = currentContent.match(/<parameter name="file_contents">([\s\S]*?)(<\/parameter>|$)/);
        let extractedContent = '';
        let isComplete = false;
        
        if (fileContentsMatch) {
          extractedContent = fileContentsMatch[1];
          isComplete = fileContentsMatch[2] === '</parameter>';
        }

        if (fileName) {
          setStreamingFileContent({
            toolName,
            fileName,
            content: extractedContent,
            isComplete
          });
        }
      }

      setCurrentIndex(prev => prev + 1);
    }, 200); // 200ms间隔模拟流式数据

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, testData]);

  const startTest = (dataType: 'normal' | 'todo') => {
    setTestData(dataType === 'todo' ? todoTestData : sseTestData);
    setCurrentIndex(0);
    setStreamingFileContent(null);
    setIsPlaying(true);
  };

  const stopTest = () => {
    setIsPlaying(false);
  };

  const resetTest = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setStreamingFileContent(null);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        <button 
          onClick={() => startTest('normal')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isPlaying}
        >
          测试普通文件流式展示
        </button>
        <button 
          onClick={() => startTest('todo')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={isPlaying}
        >
          测试TODO.md流式展示
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

      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p><strong>状态:</strong> {isPlaying ? '播放中' : '已停止'}</p>
        <p><strong>进度:</strong> {currentIndex}/{testData.length}</p>
        <p><strong>文件名:</strong> {streamingFileContent?.fileName || '无'}</p>
        <p><strong>内容长度:</strong> {streamingFileContent?.content?.length || 0}</p>
        <p><strong>是否完成:</strong> {streamingFileContent?.isComplete ? '是' : '否'}</p>
      </div>

      <div className="border rounded h-96">
        <FileOperationToolView
          name="create-file"
          assistantContent=""
          isStreaming={isPlaying && !streamingFileContent?.isComplete}
          streamingFileContent={streamingFileContent}
          enableStreamingFileDisplay={true}
        />
      </div>

      <div className="mt-4">
        <h3 className="font-bold mb-2">测试说明:</h3>
        <ul className="list-disc list-inside text-sm">
          <li>点击"测试普通文件流式展示"验证普通文件的流式展示效果</li>
          <li>点击"测试TODO.md流式展示"验证todo.md文件的特殊处理</li>
          <li>观察文件内容是否实时增量显示，而非等待完成后一次性显示</li>
          <li>确认XML标签被正确过滤，不在文件内容中显示</li>
          <li>验证第一个文件是否能正确触发显示（重点测试）</li>
          <li><strong>注意：已移除"流式传输中"小标签</strong></li>
        </ul>
      </div>
      
      <div className="mt-4 p-2 bg-blue-50 rounded">
        <h4 className="font-bold text-blue-800 mb-2">修复记录:</h4>
        <ul className="text-sm text-blue-700 list-disc list-inside">
          <li>✅ 修复了第一个文件无法触发的问题（文件内容提取逻辑优化）</li>
          <li>✅ 统一了工具面板的触发时机（流式文件内容检测时立即打开）</li>
          <li>✅ 移除了"流式传输中"小标签</li>
          <li>✅ 改进了文件内容提取函数，直接处理完整内容</li>
          <li>✅ 添加了更详细的调试日志</li>
        </ul>
      </div>

      {/* 调试信息 */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
        <h4 className="font-bold">调试信息:</h4>
        <pre>{JSON.stringify(streamingFileContent, null, 2)}</pre>
      </div>
    </div>
  );
} 