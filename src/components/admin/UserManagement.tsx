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
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Activity, Shield, UserX, UserCheck, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

type AppRole = 'admin' | 'affiliate' | 'manager';

export function UserManagement() {
  const { data: users, isLoading } = useAllUsers();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { data: activity, isLoading: activityLoading } = useUserActivity(selectedUserId);

  const handleRoleChange = (userId: string, role: AppRole) => {
    updateRole.mutate({ userId, role });
  };

  const handleStatusChange = (userId: string, status: string) => {
    updateStatus.mutate({ userId, status });
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (!users) return;
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.user_id)));
    }
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const handleBulkRoleChange = async (role: AppRole) => {
    if (selectedUsers.size === 0) return;
    setBulkProcessing(true);
    
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        await updateRole.mutateAsync({ userId, role });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkProcessing(false);
    clearSelection();
    
    if (errorCount === 0) {
      toast.success(`Updated role to ${role} for ${successCount} users`);
    } else {
      toast.warning(`Updated ${successCount} users, ${errorCount} failed`);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedUsers.size === 0) return;
    setBulkProcessing(true);
    
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        await updateStatus.mutateAsync({ userId, status });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkProcessing(false);
    clearSelection();
    
    if (errorCount === 0) {
      toast.success(`Updated status to ${status} for ${successCount} users`);
    } else {
      toast.warning(`Updated ${successCount} users, ${errorCount} failed`);
    }
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
        <CardContent className="space-y-4">
          {/* Bulk Actions Bar */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
              <span className="text-sm font-medium">
                {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex-1" />
              
              <Select onValueChange={(value) => handleBulkRoleChange(value as AppRole)} disabled={bulkProcessing}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Set Role" />
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

              <Select onValueChange={handleBulkStatusChange} disabled={bulkProcessing}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Set Status" />
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

              <Button variant="ghost" size="sm" onClick={clearSelection} disabled={bulkProcessing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!users || users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
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
                  <TableRow key={user.user_id} className={selectedUsers.has(user.user_id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.user_id)}
                        onCheckedChange={() => toggleUserSelection(user.user_id)}
                      />
                    </TableCell>
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
