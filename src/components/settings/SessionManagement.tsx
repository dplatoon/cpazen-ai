import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Monitor, Smartphone, Tablet, Globe, Clock, Trash2, ShieldAlert } from 'lucide-react';
import { useUserSessions, useRevokeSession, useRevokeAllOtherSessions, UserSession } from '@/hooks/useSessionManagement';
import { formatDistanceToNow } from 'date-fns';

function DeviceIcon({ device }: { device: string }) {
  switch (device) {
    case 'Mobile':
      return <Smartphone className="h-5 w-5" />;
    case 'Tablet':
      return <Tablet className="h-5 w-5" />;
    default:
      return <Monitor className="h-5 w-5" />;
  }
}

function SessionCard({ session, onRevoke, isRevoking }: { 
  session: UserSession & { browser?: string; os?: string; device?: string }; 
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const lastActive = formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true });
  const createdAt = formatDistanceToNow(new Date(session.created_at), { addSuffix: true });
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-muted rounded-lg">
          <DeviceIcon device={session.device || 'Desktop'} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {session.browser || 'Unknown'} on {session.os || 'Unknown'}
            </span>
            {session.is_current && (
              <Badge variant="default" className="text-xs">Current</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {session.ip_address && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {session.ip_address}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Active {lastActive}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Session started {createdAt}
          </p>
        </div>
      </div>
      
      {!session.is_current && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isRevoking}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Session</AlertDialogTitle>
              <AlertDialogDescription>
                This will sign out the device. The user will need to log in again to access their account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onRevoke}>Revoke</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export function SessionManagement() {
  const { data: sessions, isLoading, error } = useUserSessions();
  const revokeSession = useRevokeSession();
  const revokeAllOther = useRevokeAllOtherSessions();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  
  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession.mutateAsync(sessionId);
    } finally {
      setRevokingId(null);
    }
  };
  
  const otherSessions = sessions?.filter(s => !s.is_current) || [];
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Session Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load sessions. Please try again.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage your active sessions across all devices
            </CardDescription>
          </div>
          {otherSessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={revokeAllOther.isPending}>
                  Sign out all other devices
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out all other devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign out all devices except this one. You'll need to log in again on those devices.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => revokeAllOther.mutate()}>
                    Sign out all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onRevoke={() => handleRevoke(session.id)}
              isRevoking={revokingId === session.id}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No active sessions found. Your current session will appear here after refresh.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
