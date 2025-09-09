import { X, BarChart3, Target, Zap, Settings, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import cpazenLogo from "@/assets/cpazen-logo.png";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, current: true },
  { name: "Campaigns", href: "/campaigns", icon: Target, current: false },
  { name: "Offers", href: "/offers", icon: Zap, current: false },
  { name: "Integration", href: "/integration", icon: Settings, current: false },
  { name: "Profile", href: "/profile", icon: Users, current: false },
];

export const Sidebar = ({ open, onOpenChange }: SidebarProps) => {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <img src={cpazenLogo} alt="Cpazen" className="h-8 w-8" />
              <span className="text-xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                Cpazen
              </span>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    item.current
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-brand"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-brand flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-primary-foreground">
                  JD
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  John Doe
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  john@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};