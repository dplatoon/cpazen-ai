import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthScoreBadgeProps {
  score: number;
  label: 'Stable' | 'Needs attention' | 'Low data';
  reason?: string;
  showScore?: boolean;
}

export function HealthScoreBadge({ score, label, reason, showScore = false }: HealthScoreBadgeProps) {
  const config = {
    'Stable': {
      variant: 'default' as const,
      className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
      icon: Activity,
    },
    'Needs attention': {
      variant: 'default' as const,
      className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
      icon: AlertTriangle,
    },
    'Low data': {
      variant: 'default' as const,
      className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
      icon: HelpCircle,
    },
  };

  const { className, icon: Icon } = config[label];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline"
          className={cn("gap-1 cursor-help", className)}
        >
          <Icon className="h-3 w-3" />
          {label}
          {showScore && <span className="ml-1 opacity-70">({score})</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">Health Score: {score}/100</p>
          {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
