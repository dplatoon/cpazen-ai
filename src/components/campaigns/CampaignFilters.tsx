import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Filter, CalendarDays, X, TrendingUp, AlertTriangle, TrendingDown, Clock } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export interface FilterState {
  search: string;
  status: string;
  trafficSource: string;
  vertical: string;
  dateRange: DateRange | undefined;
  savedView: string | null;
}

interface CampaignFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  trafficSources?: string[];
  verticals?: string[];
}

const SAVED_VIEWS = [
  { id: 'scaling', label: 'Scaling', description: 'High ROAS, good volume', icon: TrendingUp, color: 'text-success' },
  { id: 'at_risk', label: 'At Risk', description: 'CPA above target', icon: AlertTriangle, color: 'text-warning' },
  { id: 'losing', label: 'Losing Money', description: 'Negative profit', icon: TrendingDown, color: 'text-destructive' },
  { id: 'new_tests', label: 'New Tests', description: 'Created ≤7 days ago', icon: Clock, color: 'text-primary' },
];

export function CampaignFilters({ 
  filters, 
  onFiltersChange, 
  trafficSources = [], 
  verticals = [] 
}: CampaignFiltersProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      trafficSource: 'all',
      vertical: 'all',
      dateRange: undefined,
      savedView: null,
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.status !== 'all' || 
    filters.trafficSource !== 'all' || 
    filters.vertical !== 'all' || 
    filters.dateRange || 
    filters.savedView;

  return (
    <div className="space-y-4">
      {/* Saved Views */}
      <div className="flex flex-wrap gap-2">
        {SAVED_VIEWS.map((view) => (
          <Button
            key={view.id}
            variant={filters.savedView === view.id ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-2",
              filters.savedView === view.id && "bg-primary"
            )}
            onClick={() => updateFilter('savedView', filters.savedView === view.id ? null : view.id)}
          >
            <view.icon className={cn("h-4 w-4", filters.savedView !== view.id && view.color)} />
            {view.label}
          </Button>
        ))}
      </div>

      {/* Main Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        <Select value={filters.status} onValueChange={(v) => updateFilter('status', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.trafficSource} onValueChange={(v) => updateFilter('trafficSource', v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Traffic Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {trafficSources.map((source) => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.vertical} onValueChange={(v) => updateFilter('vertical', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Vertical" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verticals</SelectItem>
            {verticals.map((vertical) => (
              <SelectItem key={vertical} value={vertical}>{vertical}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-[200px] justify-start">
              <CalendarDays className="h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "LLL dd")} -{" "}
                    {format(filters.dateRange.to, "LLL dd")}
                  </>
                ) : (
                  format(filters.dateRange.from, "LLL dd, yyyy")
                )
              ) : (
                "Date Range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={filters.dateRange}
              onSelect={(range) => {
                updateFilter('dateRange', range);
                if (range?.to) setDatePopoverOpen(false);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.savedView && (
            <Badge variant="secondary" className="gap-1">
              View: {SAVED_VIEWS.find(v => v.id === filters.savedView)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('savedView', null)} 
              />
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('status', 'all')} 
              />
            </Badge>
          )}
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              {format(filters.dateRange.from!, "LLL dd")} - {format(filters.dateRange.to || filters.dateRange.from!, "LLL dd")}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('dateRange', undefined)} 
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
