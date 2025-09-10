'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Filter, ChevronLeft, ChevronRight, User, Mail, Calendar, Shield, Check } from 'lucide-react';
import { useUsersApi } from '@/hooks/use-statistics-api';

export function UsersList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchEmail, setSearchEmail] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const {
    users,
    totalCount,
    totalPages,
    isLoading,
    error,
    fetchUsers
  } = useUsersApi();

  useEffect(() => {
    fetchUsers({
      page,
      page_size: pageSize,
      start_time: formatDateTimeForAPI(startTime),
      end_time: formatDateTimeForAPI(endTime)
    });
  }, [page, pageSize, fetchUsers]);

  const handleSearch = () => {
    setPage(1);
    const startTimeFormatted = formatDateTimeForAPI(startTime);
    const endTimeFormatted = formatDateTimeForAPI(endTime);
    
    console.log('Users handleSearch - Raw inputs:', { startTime, endTime });
    console.log('Users handleSearch - Formatted:', { startTimeFormatted, endTimeFormatted });
    
    fetchUsers({
      page: 1,
      page_size: pageSize,
      start_time: startTimeFormatted,
      end_time: endTimeFormatted
    });
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

  const getStatusBadge = (user: any) => {
    if (user.is_super_admin) {
      return <Badge variant="destructive">{t('statistics.superAdmin')}</Badge>;
    }
    if (user.is_anonymous) {
      return <Badge variant="secondary">{t('statistics.anonymous')}</Badge>;
    }
    if (user.email_confirmed_at) {
      return <Badge variant="default">{t('statistics.verified')}</Badge>;
    }
    return <Badge variant="outline">{t('statistics.unverified')}</Badge>;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            {t('statistics.errorLoadingUsers')}
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
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('statistics.usersList')} ({totalCount.toLocaleString()})
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
                      <TableHead>{t('statistics.email')}</TableHead>
                      <TableHead>{t('statistics.createdAt')}</TableHead>
                      <TableHead>{t('statistics.lastSignIn')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-center font-medium">
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : t('never')}
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
