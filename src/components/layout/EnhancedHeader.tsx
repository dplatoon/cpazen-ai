import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Moon, 
  Sun,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Mock notifications data
const notifications = [
  {
    id: 1,
    type: 'success',
    title: 'Campaign Performing Well',
    message: 'Dating SOI - US Premium exceeded daily revenue target by 23%',
    time: '2 mins ago',
    unread: true
  },
  {
    id: 2,
    type: 'warning', 
    title: 'Budget Alert',
    message: 'Crypto Trading campaign reached 85% of daily budget',
    time: '15 mins ago',
    unread: true
  },
  {
    id: 3,
    type: 'info',
    title: 'AI Optimization Complete',
    message: 'Smart bidding optimization improved ROI by 12%',
    time: '1 hour ago',
    unread: false
  },
  {
    id: 4,
    type: 'error',
    title: 'Campaign Paused',
    message: 'E-commerce COD campaign paused due to low performance',
    time: '2 hours ago',
    unread: false
  }
];

export const EnhancedHeader = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const unreadCount = notifications.filter(n => n.unread).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <TrendingUp className="h-4 w-4 text-brand-teal" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-success bg-success/5';
      case 'warning':
        return 'border-l-4 border-warning bg-warning/5';
      case 'error':
        return 'border-l-4 border-destructive bg-destructive/5';
      default:
        return 'border-l-4 border-brand-teal bg-brand-teal/5';
    }
  };

  return (
    <header className="h-16 border-b border-card-border bg-gradient-card backdrop-blur-sm bg-card/50 flex items-center px-6 sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="lg:hidden" />
        
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            placeholder="Search campaigns, offers, analytics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-80 bg-input/50 border-input-border focus:border-input-focus focus:bg-input"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center space-x-4">
        {/* Real-time Stats */}
        <div className="hidden lg:flex items-center space-x-4 px-4 py-2 rounded-lg bg-card-hover/30">
          <div className="text-center">
            <div className="text-sm font-semibold text-success">$24.8K</div>
            <div className="text-xs text-foreground-muted">Today</div>
          </div>
          <div className="w-px h-8 bg-card-border" />
          <div className="text-center">
            <div className="text-sm font-semibold text-brand-teal">1.2M</div>
            <div className="text-xs text-foreground-muted">Clicks</div>
          </div>
          <div className="w-px h-8 bg-card-border" />
          <div className="text-center">
            <div className="text-sm font-semibold text-brand-purple">2.3%</div>
            <div className="text-xs text-foreground-muted">CR</div>
          </div>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-card-border p-0">
            <div className="p-4 border-b border-card-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-card-hover/50 transition-colors ${getNotificationStyle(notification.type)} ${
                    notification.unread ? 'bg-opacity-100' : 'bg-opacity-30'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-brand-teal rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-foreground-subtle mt-2">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-card-border">
              <Button variant="ghost" size="sm" className="w-full text-center">
                View All Notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-gradient-brand flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-primary-foreground">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-foreground">
                  {user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-foreground-muted">
                  {user?.email || 'user@example.com'}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-card-border">
            <DropdownMenuItem className="text-foreground hover:bg-card-hover">
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-card-hover">
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-card-border" />
            <DropdownMenuItem className="text-foreground hover:bg-card-hover">
              <Moon className="h-4 w-4 mr-2" />
              Dark Mode
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-card-border" />
            <DropdownMenuItem className="text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};