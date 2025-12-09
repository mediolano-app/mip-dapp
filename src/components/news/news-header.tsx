"use client"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Badge } from "@/src/components/ui/badge"
import { Card } from "@/src/components/ui/card"
import { Search, Filter, X, ChevronDown, ChevronUp, Calendar } from "lucide-react"

interface NewsHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategories: string[]
  onCategoryToggle: (category: string) => void
  categories: string[]
  onClearFilters: () => void
  showFilters: boolean
  onToggleFilters: () => void
}

export function NewsHeader({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoryToggle,
  categories,
  onClearFilters,
  showFilters,
  onToggleFilters,
}: NewsHeaderProps) {
  return (
    <div className="text-center space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
          <Calendar className="w-4 h-4" />
          <span>Articles & Updates</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold">Creator Newsroom</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Stay informed about the latest developments in IP protection, platform updates, and creator success stories.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search articles, topics, or tags..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 h-12 bg-background/50 backdrop-blur-sm border-border/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={onToggleFilters}
            className="h-12 px-6 bg-background/50 backdrop-blur-sm border-border/50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <Card className="p-4 bg-background/50 backdrop-blur-sm border-border/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Categories</h3>
                {(selectedCategories.length > 0 || searchQuery) && (
                  <Button variant="ghost" size="sm" onClick={onClearFilters}>
                    Clear all
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => onCategoryToggle(category)}
                  >
                    {category}
                    {selectedCategories.includes(category) && <X className="w-3 h-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Active Filters */}
        {(selectedCategories.length > 0 || searchQuery) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => onSearchChange("")} />
              </Badge>
            )}
            {selectedCategories.map((category) => (
              <Badge key={category} variant="secondary" className="gap-1">
                {category}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onCategoryToggle(category)} />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
