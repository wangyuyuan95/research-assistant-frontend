'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TimePeriodStats {
  total: number;
  last_1d: number;
  last_3d: number;
  last_7d: number;
  last_15d: number;
  last_30d: number;
  last_90d: number;
}

interface StatisticsData {
  users: TimePeriodStats;
  projects: TimePeriodStats;
  questions: TimePeriodStats;
  generated_at: string;
}

interface StatisticsOverviewProps {
  statistics?: StatisticsData;
}

export function StatisticsOverview({ statistics }: StatisticsOverviewProps) {

  if (!statistics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            暂无数据
          </div>
        </CardContent>
      </Card>
    );
  }

  const timePeriods = [
    { key: 'last_1d', label: '最近1天', days: 1 },
    { key: 'last_3d', label: '最近3天', days: 3 },
    { key: 'last_7d', label: '最近7天', days: 7 },
    { key: 'last_15d', label: '最近15天', days: 15 },
    { key: 'last_30d', label: '最近30天', days: 30 },
    { key: 'last_90d', label: '最近90天', days: 90 },
  ];

  // Calculate non-overlapping periods for better visualization
  const getNonOverlappingData = (stats: TimePeriodStats) => {
    return [
      { period: '1天', value: stats.last_1d, color: 'bg-blue-500' },
      { period: '2-3天', value: stats.last_3d - stats.last_1d, color: 'bg-green-500' },
      { period: '4-7天', value: stats.last_7d - stats.last_3d, color: 'bg-yellow-500' },
      { period: '8-15天', value: stats.last_15d - stats.last_7d, color: 'bg-orange-500' },
      { period: '16-30天', value: stats.last_30d - stats.last_15d, color: 'bg-red-500' },
      { period: '31-90天', value: stats.last_90d - stats.last_30d, color: 'bg-purple-500' },
    ];
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const renderTimePeriodCard = (title: string, data: TimePeriodStats, icon: React.ReactNode) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">{data.total.toLocaleString()}</div>
        
        <div className="space-y-3">
          {timePeriods.map((period, index) => {
            const current = data[period.key as keyof TimePeriodStats] as number;
            const previous = index > 0 ? data[timePeriods[index - 1].key as keyof TimePeriodStats] as number : 0;
            const growthRate = calculateGrowthRate(current, previous);
            
            return (
              <div key={period.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{period.label}</span>
                  {index > 0 && getTrendIcon(current, previous)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{current.toLocaleString()}</span>
                  {index > 0 && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getTrendColor(current, previous)}`}
                    >
                      {growthRate > 0 ? '+' : ''}{growthRate}%
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderBarChart = (title: string, stats: TimePeriodStats, color: string) => {
    const data = getNonOverlappingData(stats);
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="py-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`h-5 w-5 rounded-full ${color}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-6 pb-4">
          <div className="text-4xl font-bold">{stats.total.toLocaleString()}</div>
          <div className="space-y-4 flex-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-muted-foreground">{item.period}</div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${item.color}`}
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm font-semibold text-right">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {renderBarChart(
        '用户统计',
        statistics.users,
        'bg-blue-500'
      )}
      
      {renderBarChart(
        '项目统计',
        statistics.projects,
        'bg-green-500'
      )}
      
      {renderBarChart(
        '问题统计',
        statistics.questions,
        'bg-purple-500'
      )}
    </div>
  );
}
