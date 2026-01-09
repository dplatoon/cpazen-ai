import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  AlertTriangle, 
  XCircle, 
  LogIn, 
  Clock, 
  Webhook,
  RefreshCw,
  CalendarIcon,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  Lock,
  Unlock,
  Ban
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Navigate } from 'react-router-dom';

interface SecurityEvent {
  id: string;
  type: 'rate_limit' | 'login_failure' | 'postback_auth_failure' | 'fraud_alert' | '2fa_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_email?: string;
  created_at: string;
}

const SecurityEventsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  // Fetch login rate limits (failed logins)
  const { data: loginRateLimits, isLoading: loginLoading, refetch: refetchLogin } = useQuery({
    queryKey: ['login-rate-limits', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_rate_limits')
        .select('*')
        .gte('first_attempt_at', dateRange.from.toISOString())
        .lte('last_attempt_at', dateRange.to.toISOString())
        .order('last_attempt_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: userRole === 'admin',
  });

  // Fetch click rate limits
  const { data: clickRateLimits, isLoading: clickLoading, refetch: refetchClick } = useQuery({
    queryKey: ['click-rate-limits', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('click_rate_limits')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('updated_at', dateRange.to.toISOString())
        .order('updated_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: userRole === 'admin',
  });

  // Fetch postback rate limits
  const { data: postbackRateLimits, isLoading: postbackLoading, refetch: refetchPostback } = useQuery({
    queryKey: ['postback-rate-limits', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('postback_rate_limits')
        .select('*')
        .gte('first_request_at', dateRange.from.toISOString())
        .lte('last_request_at', dateRange.to.toISOString())
        .order('last_request_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: userRole === 'admin',
  });

  // Fetch fraud alerts
  const { data: fraudAlerts, isLoading: fraudLoading, refetch: refetchFraud } = useQuery({
    queryKey: ['security-fraud-alerts', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select('*, campaigns(name)')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: userRole === 'admin',
  });

  // Fetch audit logs for login failures
  const { data: auditLogs, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['security-audit-logs', dateRange],
    queryFn: async () => {
      const startDate = dateRange.from.toISOString();
      const endDate = dateRange.to.toISOString();
      
      const { data, error } = await supabase.rpc('get_audit_logs_admin', {
        p_action_filter: null,
        p_user_filter: null,
        p_limit: 200,
        p_offset: 0,
        p_start_date: startDate,
        p_end_date: endDate
      });
      
      if (error) throw error;
      return (data || []).filter((log: { action: string }) => 
        log.action.includes('failed') || 
        log.action.includes('locked') ||
        log.action.includes('2fa') ||
        log.action.includes('unauthorized')
      );
    },
    enabled: userRole === 'admin',
  });

  const handleRefresh = () => {
    refetchLogin();
    refetchClick();
    refetchPostback();
    refetchFraud();
    refetchAudit();
  };

  // Consolidate all events into a unified format
  const consolidatedEvents: SecurityEvent[] = [];

  // Login rate limit hits
  loginRateLimits?.forEach(limit => {
    consolidatedEvents.push({
      id: limit.id,
      type: 'login_failure',
      severity: limit.locked_until ? 'high' : 'medium',
      message: limit.locked_until 
        ? `Account locked after ${limit.attempt_count} failed attempts`
        : `${limit.attempt_count} failed login attempts`,
      details: { 
        attempt_count: limit.attempt_count,
        locked_until: limit.locked_until,
        first_attempt: limit.first_attempt_at
      },
      ip_address: limit.ip_address,
      created_at: limit.last_attempt_at,
    });
  });

  // Click rate limit hits (high volume = suspicious)
  clickRateLimits?.filter(limit => limit.click_count >= 5).forEach(limit => {
    consolidatedEvents.push({
      id: limit.id,
      type: 'rate_limit',
      severity: limit.click_count >= 10 ? 'high' : 'medium',
      message: `High click volume: ${limit.click_count} clicks from single IP`,
      details: { click_count: limit.click_count },
      ip_address: limit.ip_address,
      created_at: limit.updated_at,
    });
  });

  // Postback rate limit hits (potential fraud/replay attacks)
  postbackRateLimits?.filter(limit => limit.request_count >= 2).forEach(limit => {
    consolidatedEvents.push({
      id: limit.id,
      type: 'postback_auth_failure',
      severity: limit.request_count >= 3 ? 'critical' : 'high',
      message: `Duplicate postback attempts: ${limit.request_count} requests for same click`,
      details: { 
        request_count: limit.request_count,
        click_id: limit.click_id,
        first_request: limit.first_request_at
      },
      created_at: limit.last_request_at,
    });
  });

  // Fraud alerts
  fraudAlerts?.forEach(alert => {
    const sev = alert.severity === 'critical' ? 'critical' : 
                alert.severity === 'high' ? 'high' : 
                alert.severity === 'medium' ? 'medium' : 'low';
    consolidatedEvents.push({
      id: alert.id,
      type: 'fraud_alert',
      severity: sev as SecurityEvent['severity'],
      message: alert.description,
      details: { 
        alert_type: alert.alert_type,
        campaign: (alert.campaigns as { name: string } | null)?.name,
        metadata: alert.metadata,
        status: alert.status
      },
      created_at: alert.created_at,
    });
  });

  // Audit log security events
  auditLogs?.forEach(log => {
    const logDetails = typeof log.details === 'object' && log.details !== null && !Array.isArray(log.details)
      ? log.details as Record<string, unknown>
      : {};
    consolidatedEvents.push({
      id: log.id,
      type: log.action.includes('2fa') ? '2fa_failure' : 'login_failure',
      severity: 'medium',
      message: `${log.action}: ${log.entity_type}`,
      details: logDetails,
      ip_address: log.ip_address || undefined,
      user_email: log.user_email,
      created_at: log.created_at,
    });
  });

  // Apply filters
  const filteredEvents = consolidatedEvents
    .filter(event => {
      if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
      if (eventTypeFilter !== 'all' && event.type !== eventTypeFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Summary stats
  const stats = {
    total: filteredEvents.length,
    critical: filteredEvents.filter(e => e.severity === 'critical').length,
    high: filteredEvents.filter(e => e.severity === 'high').length,
    medium: filteredEvents.filter(e => e.severity === 'medium').length,
    low: filteredEvents.filter(e => e.severity === 'low').length,
    byType: {
      rate_limit: filteredEvents.filter(e => e.type === 'rate_limit').length,
      login_failure: filteredEvents.filter(e => e.type === 'login_failure').length,
      postback_auth_failure: filteredEvents.filter(e => e.type === 'postback_auth_failure').length,
      fraud_alert: filteredEvents.filter(e => e.type === 'fraud_alert').length,
      '2fa_failure': filteredEvents.filter(e => e.type === '2fa_failure').length,
    }
  };

  const getSeverityBadge = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="bg-red-600">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'rate_limit':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'login_failure':
        return <Lock className="h-4 w-4 text-red-600" />;
      case 'postback_auth_failure':
        return <Webhook className="h-4 w-4 text-orange-600" />;
      case 'fraud_alert':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case '2fa_failure':
        return <Shield className="h-4 w-4 text-purple-600" />;
    }
  };

  const getEventTypeName = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'rate_limit': return 'Rate Limit';
      case 'login_failure': return 'Login Failure';
      case 'postback_auth_failure': return 'Postback Auth';
      case 'fraud_alert': return 'Fraud Alert';
      case '2fa_failure': return '2FA Issue';
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const isLoading = loginLoading || clickLoading || postbackLoading || fraudLoading || auditLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-destructive" />
            Security Events Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor suspicious activity, rate limit hits, and authentication failures
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[240px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Severity Filter */}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Event Type Filter */}
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rate_limit">Rate Limits</SelectItem>
                <SelectItem value="login_failure">Login Failures</SelectItem>
                <SelectItem value="postback_auth_failure">Postback Auth</SelectItem>
                <SelectItem value="fraud_alert">Fraud Alerts</SelectItem>
                <SelectItem value="2fa_failure">2FA Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">High</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.high}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Medium</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.medium}</p>
              </div>
              <Shield className="h-8 w-8 text-yellow-600/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low</p>
                <p className="text-2xl font-bold">{stats.low}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(stats.byType).map(([type, count]) => (
          <Card key={type} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setEventTypeFilter(type)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {getEventIcon(type as SecurityEvent['type'])}
                <div>
                  <p className="text-xs text-muted-foreground">{getEventTypeName(type as SecurityEvent['type'])}</p>
                  <p className="text-lg font-semibold">{count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Security Events Timeline
          </CardTitle>
          <CardDescription>
            Showing {filteredEvents.length} events in the selected time range
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No security events found</p>
              <p className="text-sm">Adjust your filters or date range to see more events</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Time</TableHead>
                    <TableHead className="w-[100px]">Severity</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[140px]">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} className="group hover:bg-muted/50">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.type)}
                          <span className="text-xs">{getEventTypeName(event.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{event.message}</p>
                          {event.user_email && (
                            <p className="text-xs text-muted-foreground">User: {event.user_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {event.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityEventsPage;
