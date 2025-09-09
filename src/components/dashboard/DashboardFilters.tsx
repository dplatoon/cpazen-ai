import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, Download, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useCampaigns } from "@/hooks/useRealData";

export interface DashboardFiltersState {
  dateRange: {
    from: Date;
    to: Date;
  };
  campaigns: string[];
  status: string;
  searchTerm: string;
}

interface DashboardFiltersProps {
  filters: DashboardFiltersState;
  onFiltersChange: (filters: DashboardFiltersState) => void;
  onExportData?: () => void;
}

const datePresets = [
  {
    label: "Today",
    getValue: () => ({ from: new Date(), to: new Date() })
  },
  {
    label: "Yesterday", 
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    }
  },
  {
    label: "Last 7 days",
    getValue: () => ({ from: subDays(new Date(), 6), to: new Date() })
  },
  {
    label: "Last 30 days",
    getValue: () => ({ from: subDays(new Date(), 29), to: new Date() })
  },
  {
    label: "This month",
    getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
  },
  {
    label: "Last month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
  }
];

export function DashboardFilters({ filters, onFiltersChange, onExportData }: DashboardFiltersProps) {
  const { data: campaigns = [] } = useCampaigns();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const updateFilters = (updates: Partial<DashboardFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const applyDatePreset = (preset: typeof datePresets[0]) => {
    updateFilters({ dateRange: preset.getValue() });
    setIsDatePickerOpen(false);
  };

  const toggleCampaign = (campaignId: string) => {
    const newCampaigns = filters.campaigns.includes(campaignId)
      ? filters.campaigns.filter(id => id !== campaignId)
      : [...filters.campaigns, campaignId];
    updateFilters({ campaigns: newCampaigns });
  };

  const clearAllFilters = () => {
    updateFilters({
      dateRange: { from: subDays(new Date(), 29), to: new Date() },
      campaigns: [],
      status: "all",
      searchTerm: ""
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.campaigns.length > 0) count++;
    if (filters.status !== "all") count++;
    if (filters.searchTerm) count++;
    return count;
  };

  return (
    <Card className="p-4 bg-gradient-card border-card-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-foreground-muted" />
            <h3 className="font-medium text-foreground">Filters</h3>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {onExportData && (
              <Button variant="outline" size="sm" onClick={onExportData} className="border-card-border">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-card-border",
                    !filters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "MMM dd")} - {format(filters.dateRange.to, "MMM dd")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  <div className="border-r border-card-border p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Quick Select</h4>
                      {datePresets.map((preset) => (
                        <Button
                          key={preset.label}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-8"
                          onClick={() => applyDatePreset(preset)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        updateFilters({ dateRange: { from: range.from, to: range.to } });
                        setIsDatePickerOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Campaign Filter */}
          <div className="space-y-2">
            <Label>Campaigns</Label>
            <Select
              value={filters.campaigns.length === 1 ? filters.campaigns[0] : "multiple"}
              onValueChange={(value) => {
                if (value === "all") {
                  updateFilters({ campaigns: [] });
                } else if (value !== "multiple") {
                  updateFilters({ campaigns: [value] });
                }
              }}
            >
              <SelectTrigger className="bg-background-secondary border-card-border">
                <SelectValue placeholder="All campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilters({ status: value })}
            >
              <SelectTrigger className="bg-background-secondary border-card-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <Input
              placeholder="Search campaigns..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="bg-background-secondary border-card-border"
            />
          </div>
        </div>

        {/* Active Filters */}
        {(filters.campaigns.length > 0 || filters.status !== "all" || filters.searchTerm) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-card-border">
            {filters.campaigns.map((campaignId) => {
              const campaign = campaigns.find(c => c.id === campaignId);
              return campaign ? (
                <Badge key={campaignId} variant="secondary" className="pr-1">
                  {campaign.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                    onClick={() => toggleCampaign(campaignId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ) : null;
            })}
            
            {filters.status !== "all" && (
              <Badge variant="secondary" className="pr-1">
                Status: {filters.status}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                  onClick={() => updateFilters({ status: "all" })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {filters.searchTerm && (
              <Badge variant="secondary" className="pr-1">
                Search: {filters.searchTerm}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                  onClick={() => updateFilters({ searchTerm: "" })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}