import { useState, useEffect } from 'react';
import { useAuditLogs, type AuditLog } from '@/hooks/useAuditLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Key, 
  UserCog, 
  LogIn, 
  AlertTriangle, 
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Critical actions that trigger real-time alerts
const CRITICAL_ACTIONS = [
  'user_role_changed',
  'user_status_changed',
  'offer_created',
  'offer_deleted',
  '2fa_disabled',
  'secret_key_rotated',
];

function exportToCSV(logs: AuditLog[]) {
  const headers = ['Timestamp', 'User Email', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'User Agent', 'Details'];
  const rows = logs.map(log => [
    format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
    log.user_email || '',
    log.action,
    log.entity_type,
    log.entity_id || '',
    log.ip_address || '',
    log.user_agent || '',
    JSON.stringify(log.details || {}),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ACTION_TYPES = [
  { value: 'login', label: 'Login Attempts', icon: LogIn },
  { value: 'logout', label: 'Logout', icon: LogIn },
  { value: 'secret_key_rotation', label: 'Secret Key Rotation', icon: Key },
  { value: 'role_change', label: 'Role Changes', icon: UserCog },
  { value: 'password_change', label: 'Password Changes', icon: Shield },
  { value: '2fa_enabled', label: '2FA Enabled', icon: Shield },
  { value: '2fa_disabled', label: '2FA Disabled', icon: AlertTriangle },
  { value: 'session_revoked', label: 'Session Revoked', icon: Shield },
];

function getActionIcon(action: string) {
  const actionType = ACTION_TYPES.find(a => a.value === action);
  if (actionType) {
    const Icon = actionType.icon;
    return <Icon className="h-4 w-4" />;
  }
  return <Shield className="h-4 w-4" />;
}

function getActionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action.includes('failed') || action.includes('disabled')) return 'destructive';
  if (action.includes('login') || action.includes('enabled')) return 'default';
  if (action.includes('change') || action.includes('rotation')) return 'secondary';
  return 'outline';
}

function AuditLogDetails({ log }: { log: AuditLog }) {
  const details = typeof log.details === 'object' && log.details !== null 
    ? log.details as Record<string, unknown>
    : {};

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Action</p>
              <p className="text-sm">{log.action}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entity Type</p>
              <p className="text-sm">{log.entity_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User</p>
              <p className="text-sm">{log.user_email || log.user_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
              <p className="text-sm">{format(new Date(log.created_at), 'PPpp')}</p>
            </div>
            {log.ip_address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                <p className="text-sm font-mono">{log.ip_address}</p>
              </div>
            )}
            {log.entity_id && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entity ID</p>
                <p className="text-sm font-mono">{log.entity_id}</p>
              </div>
            )}
          </div>
          {log.user_agent && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">User Agent</p>
              <p className="text-sm font-mono text-xs break-all">{log.user_agent}</p>
            </div>
          )}
          {Object.keys(details).length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Details</p>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <pre className="text-xs font-mono">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogViewer() {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const pageSize = 50;

  const { data: logs, isLoading, refetch, isRefetching } = useAuditLogs({
    limit: pageSize,
    offset: page * pageSize,
    actionFilter: actionFilter === 'all' ? null : actionFilter,
  });

  const filteredLogs = logs?.filter(log => 
    !searchEmail || log.user_email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  // Real-time alerts for critical admin actions
  useEffect(() => {
    const channel = supabase
      .channel('audit-logs-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          const newLog = payload.new as { action: string; user_email?: string; entity_type: string };
          if (CRITICAL_ACTIONS.includes(newLog.action)) {
            toast.warning(`Security Alert: ${newLog.action.replace(/_/g, ' ')}`, {
              description: `By ${newLog.user_email || 'Unknown'} on ${newLog.entity_type}`,
              duration: 10000,
            });
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleExportCSV = () => {
    if (filteredLogs && filteredLogs.length > 0) {
      exportToCSV(filteredLogs);
      toast.success('Audit logs exported successfully');
    } else {
      toast.error('No logs to export');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit Logs
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              disabled={!filteredLogs || filteredLogs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={actionFilter || 'all'}
              onValueChange={(value) => {
                setActionFilter(value === 'all' ? null : value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTION_TYPES.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-[250px]"
          />
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="w-[80px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs && filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.user_email || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getActionBadgeVariant(log.action)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getActionIcon(log.action)}
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{log.entity_type}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{log.ip_address || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <AuditLogDetails log={log} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page * pageSize) + 1} - {(page * pageSize) + (filteredLogs?.length || 0)} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!logs || logs.length < pageSize}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
