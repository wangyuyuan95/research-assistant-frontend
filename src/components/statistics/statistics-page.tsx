'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Users, FolderOpen, MessageSquare, TrendingUp, Calendar, Filter } from 'lucide-react';
import { StatisticsOverview } from './statistics-overview';
import { UsersList } from './users-list';
import { ProjectsList } from './projects-list';
import { QuestionsList } from './questions-list';
import { useStatisticsApi } from '@/hooks/use-statistics-api';

export function StatisticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const {
    statistics,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useStatisticsApi();

  // Initialize lastRefresh only on client side to avoid hydration mismatch
  useEffect(() => {
    if (lastRefresh === null) {
      setLastRefresh(new Date());
    }
  }, [lastRefresh]);

  const handleRefresh = async () => {
    await refetchStats();
    setLastRefresh(new Date());
  };

  const formatLastRefresh = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with title/description and refresh controls */}
      <div className="flex items-center justify-between">
        {/* Title and description group */}
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">使用统计</h2>
          <p className="text-sm text-muted-foreground">查看用户、项目和问题的详细统计数据</p>
        </div>
        
        {/* Last updated and refresh button group */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>最后更新: {lastRefresh ? formatLastRefresh(lastRefresh) : '--:--:--'}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={statsLoading}
            className="gap-2"
          >
            {statsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            刷新
          </Button>
        </div>
      </div>

      {/* Error state */}
      {statsError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <span className="text-sm font-medium">加载统计数据时出错</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="ml-auto"
              >
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics overview cards */}
        {statistics && (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Total Users Card */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">总用户数</h3>
                    <div className="flex items-baseline gap-3">
                      <div className="text-3xl font-bold">{statistics.users.total.toLocaleString()}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-green-600">+{statistics.users.last_7d}</span>
                        <span className="text-muted-foreground">最近7天</span>
                      </div>
                    </div>
                  </div>
                  <Users className="h-16 w-16 text-muted-foreground/20 absolute right-6 top-1/2 -translate-y-1/2" />
                </div>
              </CardContent>
            </Card>

            {/* Total Projects Card */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">总项目数</h3>
                    <div className="flex items-baseline gap-3">
                      <div className="text-3xl font-bold">{statistics.projects.total.toLocaleString()}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-green-600">+{statistics.projects.last_7d}</span>
                        <span className="text-muted-foreground">最近7天</span>
                      </div>
                    </div>
                  </div>
                  <FolderOpen className="h-16 w-16 text-muted-foreground/20 absolute right-6 top-1/2 -translate-y-1/2" />
                </div>
              </CardContent>
            </Card>

            {/* Total Questions Card */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">总问题数</h3>
                    <div className="flex items-baseline gap-3">
                      <div className="text-3xl font-bold">{statistics.questions.total.toLocaleString()}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-green-600">+{statistics.questions.last_7d}</span>
                        <span className="text-muted-foreground">最近7天</span>
                      </div>
                    </div>
                  </div>
                  <MessageSquare className="h-16 w-16 text-muted-foreground/20 absolute right-6 top-1/2 -translate-y-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-12 ">
          <TabsTrigger value="overview" className="gap-2 text-lg font-bold">
            <TrendingUp className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 text-lg font-bold">
            <Users className="h-4 w-4" />
            用户
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2 text-lg font-bold">
            <FolderOpen className="h-4 w-4" />
            项目
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2 text-lg font-bold">
            <MessageSquare className="h-4 w-4" />
            问题
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <StatisticsOverview statistics={statistics} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersList />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <ProjectsList />
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <QuestionsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
