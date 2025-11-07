import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TestItem {
  id: string;
  category: string;
  test: string;
  status: 'pending' | 'passed' | 'failed';
  priority: 'critical' | 'high' | 'medium';
}

const initialTests: TestItem[] = [
  // Authentication Tests
  { id: '1', category: 'Authentication', test: 'User signup with email/password', status: 'pending', priority: 'critical' },
  { id: '2', category: 'Authentication', test: 'User login and session persistence', status: 'pending', priority: 'critical' },
  { id: '3', category: 'Authentication', test: 'Logout functionality', status: 'pending', priority: 'high' },
  { id: '4', category: 'Authentication', test: 'Profile update with different roles', status: 'pending', priority: 'high' },
  
  // Campaign Management
  { id: '5', category: 'Campaigns', test: 'Create new campaign', status: 'pending', priority: 'critical' },
  { id: '6', category: 'Campaigns', test: 'Edit campaign details', status: 'pending', priority: 'critical' },
  { id: '7', category: 'Campaigns', test: 'Pause/Resume campaign', status: 'pending', priority: 'critical' },
  { id: '8', category: 'Campaigns', test: 'Archive campaign', status: 'pending', priority: 'medium' },
  { id: '9', category: 'Campaigns', test: 'Generate tracking URL', status: 'pending', priority: 'critical' },
  
  // Tracking System
  { id: '10', category: 'Tracking', test: 'Click tracking with valid URL', status: 'pending', priority: 'critical' },
  { id: '11', category: 'Tracking', test: 'Click tracking with invalid campaign', status: 'pending', priority: 'critical' },
  { id: '12', category: 'Tracking', test: 'Bot detection (simulate bot user-agent)', status: 'pending', priority: 'high' },
  { id: '13', category: 'Tracking', test: 'Rate limiting (100+ clicks in 1 minute)', status: 'pending', priority: 'critical' },
  { id: '14', category: 'Tracking', test: 'Geo-targeting (wrong country redirect)', status: 'pending', priority: 'high' },
  
  // Conversion Tracking
  { id: '15', category: 'Conversions', test: 'Postback with valid click_id', status: 'pending', priority: 'critical' },
  { id: '16', category: 'Conversions', test: 'Postback with invalid click_id', status: 'pending', priority: 'critical' },
  { id: '17', category: 'Conversions', test: 'Postback with custom payout', status: 'pending', priority: 'high' },
  { id: '18', category: 'Conversions', test: 'Duplicate conversion prevention', status: 'pending', priority: 'critical' },
  { id: '19', category: 'Conversions', test: 'Security token validation', status: 'pending', priority: 'critical' },
  
  // Analytics
  { id: '20', category: 'Analytics', test: 'Dashboard loads with data', status: 'pending', priority: 'critical' },
  { id: '21', category: 'Analytics', test: 'Date range filtering', status: 'pending', priority: 'high' },
  { id: '22', category: 'Analytics', test: 'Campaign performance table sorting', status: 'pending', priority: 'medium' },
  { id: '23', category: 'Analytics', test: 'Revenue chart displays correctly', status: 'pending', priority: 'high' },
  { id: '24', category: 'Analytics', test: 'Geo distribution chart', status: 'pending', priority: 'medium' },
  
  // AI Features
  { id: '25', category: 'AI Features', test: 'Campaign optimizer generates recommendations', status: 'pending', priority: 'high' },
  { id: '26', category: 'AI Features', test: 'Support chatbot responds with streaming', status: 'pending', priority: 'high' },
  { id: '27', category: 'AI Features', test: 'Offer description generator creates content', status: 'pending', priority: 'medium' },
  { id: '28', category: 'AI Features', test: 'AI rate limit handling', status: 'pending', priority: 'high' },
  
  // Security
  { id: '29', category: 'Security', test: 'RLS prevents unauthorized data access', status: 'pending', priority: 'critical' },
  { id: '30', category: 'Security', test: 'SQL injection prevention', status: 'pending', priority: 'critical' },
  { id: '31', category: 'Security', test: 'XSS prevention in user inputs', status: 'pending', priority: 'critical' },
  
  // UI/UX
  { id: '32', category: 'UI/UX', test: 'Dark/Light mode toggle', status: 'pending', priority: 'medium' },
  { id: '33', category: 'UI/UX', test: 'Mobile responsive layout', status: 'pending', priority: 'high' },
  { id: '34', category: 'UI/UX', test: 'Toast notifications display', status: 'pending', priority: 'medium' },
  { id: '35', category: 'UI/UX', test: 'Loading states on async operations', status: 'pending', priority: 'high' },
];

export function TestingChecklist() {
  const [tests, setTests] = useState<TestItem[]>(initialTests);

  const updateTestStatus = (id: string, status: 'passed' | 'failed') => {
    setTests(tests.map(t => t.id === id ? { ...t, status } : t));
    toast.success(`Test ${id} marked as ${status}`);
  };

  const stats = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    pending: tests.filter(t => t.status === 'pending').length,
  };

  const criticalPending = tests.filter(t => t.priority === 'critical' && t.status !== 'passed');

  const categories = Object.entries(
    tests.reduce((acc, test) => {
      if (!acc[test.category]) acc[test.category] = [];
      acc[test.category].push(test);
      return acc;
    }, {} as Record<string, TestItem[]>)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Testing Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>

          {criticalPending.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">
                  {criticalPending.length} Critical Tests Pending
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                These must pass before soft launch
              </p>
            </div>
          )}

          <div className="space-y-6">
            {categories.map(([category, categoryTests]) => (
              <div key={category}>
                <h3 className="font-semibold mb-3">{category}</h3>
                <div className="space-y-2">
                  {categoryTests.map(test => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {test.status === 'passed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {test.status === 'failed' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                        {test.status === 'pending' && <Circle className="h-5 w-5 text-muted-foreground" />}
                        
                        <span className={test.status === 'passed' ? 'line-through text-muted-foreground' : ''}>
                          {test.test}
                        </span>
                        
                        {test.priority === 'critical' && (
                          <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTestStatus(test.id, 'passed')}
                          disabled={test.status === 'passed'}
                        >
                          Pass
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateTestStatus(test.id, 'failed')}
                          disabled={test.status === 'failed'}
                        >
                          Fail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
