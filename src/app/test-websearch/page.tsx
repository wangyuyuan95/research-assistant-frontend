'use client';

import React, { useState } from 'react';
import { WebSearchToolView } from '@/components/thread/tool-views/web-search-tool/WebSearchToolView';
import { mockWebSearchWithKnowledgeBase, mockWebSearchOnly } from '@/lib/mock-data/websearch-mock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Globe, TestTube } from 'lucide-react';

export default function TestWebSearchPage() {
  const [currentMock, setCurrentMock] = useState<'mixed' | 'webonly'>('mixed');

  const mockData = currentMock === 'mixed' ? mockWebSearchWithKnowledgeBase : mockWebSearchOnly;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              WebSearch 知识库集成测试页面
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              测试WebSearchToolView组件对混合搜索结果（网络搜索 + 知识库）的展示效果
            </p>
          </CardHeader>
        </Card>

        {/* 控制面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">测试数据选择</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={currentMock === 'mixed' ? 'default' : 'outline'}
                onClick={() => setCurrentMock('mixed')}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                <Globe className="h-4 w-4" />
                混合数据
                <Badge variant="secondary" className="ml-1">
                  网络 + 知识库
                </Badge>
              </Button>
              
              <Button
                variant={currentMock === 'webonly' ? 'default' : 'outline'}
                onClick={() => setCurrentMock('webonly')}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                纯网络搜索
                <Badge variant="secondary" className="ml-1">
                  兼容性测试
                </Badge>
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>当前测试:</strong> {
                  currentMock === 'mixed' 
                    ? '混合搜索结果 - 包含3个网络搜索结果和3个知识库结果，测试筛选、样式区分、特有字段展示等功能' 
                    : '纯网络搜索结果 - 测试对老数据格式的兼容性，确保不破坏现有功能'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* WebSearchToolView 组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">组件展示效果</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-lg overflow-hidden">
              <WebSearchToolView
                name="web-search"
                assistantContent={mockData.content.content}
                toolContent={mockData.content.content}
                assistantTimestamp={new Date().toISOString()}
                toolTimestamp={new Date().toISOString()}
                isSuccess={true}
                isStreaming={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* 数据结构预览 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">当前数据结构预览</CardTitle>
          </CardHeader>
          <CardContent>
            <details className="cursor-pointer">
              <summary className="font-medium text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                点击查看原始数据结构
              </summary>
              <pre className="mt-3 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-xs max-h-96">
                {JSON.stringify(mockData, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 