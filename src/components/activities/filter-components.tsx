import { Filter as FilterIcon, X, BarChart3, Zap, Search } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent } from "@/src/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"

export const typeLabels = {
  mint: "Minted",
  transfer_out: "Sent",
  transfer_in: "Received",
  burn: "Burned",
  collection_create: "Collection Created",
  update: "Updated",
  upgrade: "Upgraded",
  sale: "Sales",
} as const

interface FilterButtonProps {
  hasActiveFilters: boolean
  onClick: () => void
  activeFilterCount: number
}

export function FilterButton({ hasActiveFilters, onClick, activeFilterCount }: FilterButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`h-12 px-6 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background transition-all duration-200 shadow-sm ${
        hasActiveFilters ? "border-primary/50 text-primary bg-primary/5" : ""
      }`}
    >
      <FilterIcon className="w-4 h-4 mr-2" />
      <span className="font-medium">Filters</span>
      {hasActiveFilters && (
        <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground border-0 shadow-sm">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  )
}

interface FilterPanelProps {
  filterType: string
  setFilterType: (type: string) => void
  filterStatus: string
  setFilterStatus: (status: string) => void
  hasActiveFilters: boolean
  clearFilters: () => void
  filteredCount: number
  totalCount: number
  onClose: () => void
}

export function FilterPanel({
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  hasActiveFilters,
  clearFilters,
  filteredCount,
  totalCount,
  onClose,
}: FilterPanelProps) {
  return (
    <Card className="bg-background/80 backdrop-blur-sm border-border/50 shadow-xl animate-fade-in-up overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-accent/2" />
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <FilterIcon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Filter Options</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-muted/50 rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Activity Type</span>
            </label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-11 bg-background/50 border-border/50 hover:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-lg">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-xl">
                <SelectItem value="all" className="rounded-lg">All Types</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="rounded-lg">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>Status</span>
            </label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-11 bg-background/50 border-border/50 hover:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-lg">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-xl">
                <SelectItem value="all" className="rounded-lg">All Status</SelectItem>
                <SelectItem value="completed" className="rounded-lg">Completed</SelectItem>
                <SelectItem value="pending" className="rounded-lg">Pending</SelectItem>
                <SelectItem value="failed" className="rounded-lg">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/30">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground font-medium">
                {filteredCount} of {totalCount} activities
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ActiveFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterType: string
  setFilterType: (type: string) => void
  filterStatus: string
  setFilterStatus: (status: string) => void
}

export function ActiveFilters({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
}: ActiveFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-4 animate-fade-in-up">
      {searchQuery && (
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors rounded-lg px-3 py-1"
        >
          <Search className="w-3 h-3 mr-1" />
          Search: "{searchQuery}"
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
          >
            <X className="w-3 h-3" />
          </Button>
        </Badge>
      )}
      {filterType !== "all" && (
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors rounded-lg px-3 py-1"
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          Type: {typeLabels[filterType as keyof typeof typeLabels]}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterType("all")}
            className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
          >
            <X className="w-3 h-3" />
          </Button>
        </Badge>
      )}
      {filterStatus !== "all" && (
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors rounded-lg px-3 py-1"
        >
          <Zap className="w-3 h-3 mr-1" />
          Status: {filterStatus}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
          >
            <X className="w-3 h-3" />
          </Button>
        </Badge>
      )}
    </div>
  )
}