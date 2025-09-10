'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Filter, ChevronLeft, ChevronRight, MessageSquare, Mail, Calendar, User, Check } from 'lucide-react';
import { useQuestionsApi } from '@/hooks/use-statistics-api';

export function QuestionsList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [userEmails, setUserEmails] = useState<string[]>([]);
  const [excludeUserEmails, setExcludeUserEmails] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [includeEmailInput, setIncludeEmailInput] = useState('');
  const [excludeEmailInput, setExcludeEmailInput] = useState('');

  const {
    questions,
    totalCount,
    totalPages,
    isLoading,
    error,
    fetchQuestions
  } = useQuestionsApi();

  useEffect(() => {
    fetchQuestions({
      page,
      page_size: pageSize,
      user_emails: userEmails.length > 0 ? userEmails : undefined,
      exclude_user_emails: excludeUserEmails.length > 0 ? excludeUserEmails : undefined,
      start_time: formatDateTimeForAPI(startTime),
      end_time: formatDateTimeForAPI(endTime)
    });
  }, [page, pageSize, userEmails, excludeUserEmails, fetchQuestions]);

  const handleSearch = () => {
    setPage(1);
    const startTimeFormatted = formatDateTimeForAPI(startTime);
    const endTimeFormatted = formatDateTimeForAPI(endTime);
    
    console.log('Questions handleSearch - Raw inputs:', { startTime, endTime });
    console.log('Questions handleSearch - Formatted:', { startTimeFormatted, endTimeFormatted });
    
    fetchQuestions({
      page: 1,
      page_size: pageSize,
      user_emails: userEmails.length > 0 ? userEmails : undefined,
      exclude_user_emails: excludeUserEmails.length > 0 ? excludeUserEmails : undefined,
      start_time: startTimeFormatted,
      end_time: endTimeFormatted
    });
  };

  const parseEmails = (emailString: string): string[] => {
    // 支持中文逗号、英文逗号、空格分隔
    return emailString
      .split(/[,，\s]+/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
  };

  const addEmails = (emailString: string, type: 'include' | 'exclude') => {
    const emails = parseEmails(emailString);
    if (emails.length === 0) return;

    if (type === 'include') {
      const newEmails = emails.filter(email => !userEmails.includes(email));
      if (newEmails.length > 0) {
        setUserEmails([...userEmails, ...newEmails]);
      }
      setIncludeEmailInput('');
    } else {
      const newEmails = emails.filter(email => !excludeUserEmails.includes(email));
      if (newEmails.length > 0) {
        setExcludeUserEmails([...excludeUserEmails, ...newEmails]);
      }
      setExcludeEmailInput('');
    }
  };

  const removeEmail = (email: string, type: 'include' | 'exclude') => {
    if (type === 'include') {
      setUserEmails(userEmails.filter(e => e !== email));
    } else {
      setExcludeUserEmails(excludeUserEmails.filter(e => e !== email));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDateTimeForAPI = (dateTimeString: string) => {
    if (!dateTimeString) return undefined;
    // 支持多种时间格式输入
    let date: Date;
    
    // 如果输入格式是 YYYY-MM-DD，自动添加时间部分
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeString)) {
      date = new Date(dateTimeString + ' 00:00:00');
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateTimeString)) {
      date = new Date(dateTimeString + ':00');
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTimeString)) {
      date = new Date(dateTimeString);
    } else {
      // 尝试直接解析
      date = new Date(dateTimeString);
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateTimeString);
      return undefined;
    }
    
    return date.toISOString();
  };


  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            {t('statistics.errorLoadingQuestions')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('statistics.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('statistics.includeUserEmails')}</label>
                <div className="flex gap-2">
                  <Input
                    value={includeEmailInput}
                    onChange={(e) => setIncludeEmailInput(e.target.value)}
                    placeholder="输入邮箱，支持多个邮箱用逗号或空格分隔"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addEmails(includeEmailInput, 'include');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => addEmails(includeEmailInput, 'include')}
                    disabled={!includeEmailInput.trim()}
                  >
                    {t('statistics.add')}
                  </Button>
                </div>
                {userEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {userEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          onClick={() => removeEmail(email, 'include')}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('statistics.excludeUserEmails')}</label>
                <div className="flex gap-2">
                  <Input
                    value={excludeEmailInput}
                    onChange={(e) => setExcludeEmailInput(e.target.value)}
                    placeholder="输入邮箱，支持多个邮箱用逗号或空格分隔"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addEmails(excludeEmailInput, 'exclude');
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => addEmails(excludeEmailInput, 'exclude')}
                    disabled={!excludeEmailInput.trim()}
                  >
                    {t('statistics.add')}
                  </Button>
                </div>
                {excludeUserEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {excludeUserEmails.map((email) => (
                      <Badge key={email} variant="destructive" className="gap-1">
                        {email}
                        <button
                          onClick={() => removeEmail(email, 'exclude')}
                          className="ml-1 hover:text-destructive-foreground"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('statistics.startTime')}</label>
                <Input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="YYYY-MM-DD hh:mm:ss"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('statistics.endTime')}</label>
                <Input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="YYYY-MM-DD hh:mm:ss"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('statistics.pageSize')}</label>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-end">
                 <Button onClick={handleSearch} size="sm" className="w-32 gap-2">
                  <Check className="h-4 w-4" />
                  确认筛选
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('statistics.questionsList')} ({totalCount.toLocaleString()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t('statistics.loading')}</span>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">序号</TableHead>
                      <TableHead>{t('statistics.question')}</TableHead>
                      <TableHead>{t('statistics.user')}</TableHead>
                      <TableHead>{t('statistics.createdAt')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question, index) => (
                      <TableRow key={`${question.thread_id}-${question.message_id}`}>
                        <TableCell className="text-center font-medium">
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-sm truncate cursor-help">
                                  {question.question_text || t('statistics.noContent')}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-md">
                                <p className="text-sm whitespace-pre-wrap">
                                  {question.question_text || t('statistics.noContent')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {question.user_email || t('anonymous')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(question.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {t('statistics.showing')} {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} {t('statistics.of')} {totalCount.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('statistics.previous')}
                  </Button>
                  <span className="text-sm">
                    {t('statistics.page')} {page} {t('statistics.of')} {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    {t('statistics.next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
