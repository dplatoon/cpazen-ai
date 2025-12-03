import { useState } from 'react';
import { useAllUsers, useUpdateUserRole, useUpdateUserStatus, useUserActivity, ManagedUser } from '@/hooks/useUserManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Activity, Shield, UserX, UserCheck, Eye } from 'lucide-react';

type AppRole = 'admin' | 'affiliate' | 'manager';

export function UserManagement() {
  const { data: users, isLoading } = useAllUsers();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data: activity, isLoading: activityLoading } = useUserActivity(selectedUserId);

  const handleRoleChange = (userId: string, role: AppRole) => {
    updateRole.mutate({ userId, role });
  };

  const handleStatusChange = (userId: string, status: string) => {
    updateStatus.mutate({ userId, status });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'secondary';
      case 'disabled': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            View and manage all users, roles, and account status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: ManagedUser) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.company_name || '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="affiliate">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Affiliate
                            </div>
                          </SelectItem>
                          <SelectItem value="manager">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Manager
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.status}
                        onValueChange={(value) => handleStatusChange(user.user_id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue>
                            <Badge variant={getStatusBadgeVariant(user.status)}>
                              {user.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-green-500" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="suspended">
                            <div className="flex items-center gap-2">
                              <UserX className="h-4 w-4 text-yellow-500" />
                              Suspended
                            </div>
                          </SelectItem>
                          <SelectItem value="disabled">
                            <div className="flex items-center gap-2">
                              <UserX className="h-4 w-4 text-red-500" />
                              Disabled
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUserId(user.user_id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Activity
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Activity Dialog */}
      <Dialog open={!!selectedUserId} onOpenChange={() => setSelectedUserId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User Activity Log
            </DialogTitle>
            <DialogDescription>
              Recent activity for this user account
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {activityLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !activity || activity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity found for this user
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        item.activity_type === 'conversion' ? 'default' :
                        item.activity_type === 'campaign' ? 'secondary' : 'outline'
                      }>
                        {item.activity_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
