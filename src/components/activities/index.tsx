"use client"

import { useState, useMemo } from "react"
import { Activity, Sparkles, X, TrendingUp, Clock, CheckCircle, Calendar } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { ActivityList } from "@/src/components/activities/activity-list"
import { Pagination } from "@/src/components/pagination"
import { SearchInput } from "./search-input"
import { FilterButton, FilterPanel, ActiveFilters } from "./filter-components"
import { ActivityItem } from "@/src/types/activity"

interface ActivityStats {
  total: number
  completed: number
  pending: number
  thisMonth: number
}

interface ActivitiesProps {
  activities: ActivityItem[]
  loading?: boolean
  error?: string | null
  onCreateNew?: () => void
  onCopyToClipboard?: (text: string) => void
  onRefresh?: () => void
  onLoadMore?: () => void
  walletAddress?: string
  usingMockData?: boolean
  className?: string
}

export function Activities({ 
  activities: initialActivities, 
  loading = false,
  error = null,
  onCreateNew, 
  onCopyToClipboard = () => {}, 
  onRefresh,
  onLoadMore,
  walletAddress,
  usingMockData = false,
  className = "" 
}: ActivitiesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const filteredActivities = useMemo(() => {
    return initialActivities.filter((activity) => {
      const matchesSearch =
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType =
        filterType === "all" ||
        activity.type === filterType ||
        (filterType === 'mint' && activity.type === 'mint_batch') ||
        (filterType === 'burn' && activity.type === 'burn_batch') ||
        (filterType === 'transfer_out' && activity.type === 'transfer_batch')
      const matchesStatus = filterStatus === "all" || activity.status === filterStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [initialActivities, searchQuery, filterType, filterStatus])

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredActivities.slice(startIndex, endIndex)
  }, [filteredActivities, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)

  const getActivityStats = (): ActivityStats => {
    const total = initialActivities.length
    const completed = initialActivities.filter((a) => a.status === "completed").length
    const pending = initialActivities.filter((a) => a.status === "pending").length
    const thisMonth = initialActivities.filter((a) => {
      const d = new Date(a.timestamp)
      const now = new Date()
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length

    return { total, completed, pending, thisMonth }
  }

  const stats = getActivityStats()

  const clearFilters = () => {
    setSearchQuery("")
    setFilterType("all")
    setFilterStatus("all")
    setCurrentPage(1)
  }

  const hasActiveFilters = Boolean(searchQuery) || filterType !== "all" || filterStatus !== "all"

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const activeFilterCount = [
    Boolean(searchQuery) && "search",
    filterType !== "all" && "type",
    filterStatus !== "all" && "status",
  ].filter(Boolean).length

  return (
    <div className={`min-h-screen ${className}`}>
      <main className="pb-20">
        <div className="px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6 sm:mb-8 animate-fade-in-up">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-6 sm:p-8 mb-6 border border-primary/10">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-2xl" />

                <div className="relative flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                        <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-2">
                          Activity
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                          Track your onchain activities with real-time updates
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-200"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Insights</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <StatsCard
                  title="Total Activities"
                  value={stats.total}
                  icon={TrendingUp}
                  color="blue"
                  delay={0}
                />
                <StatsCard
                  title="Completed"
                  value={stats.completed}
                  icon={CheckCircle}
                  color="green"
                  delay={100}
                />
                <StatsCard
                  title="Pending"
                  value={stats.pending}
                  icon={Clock}
                  color="orange"
                  delay={200}
                />
                <StatsCard
                  title="This Month"
                  value={stats.thisMonth}
                  icon={Calendar}
                  color="purple"
                  delay={300}
                />
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
                <FilterButton
                  hasActiveFilters={hasActiveFilters}
                  onClick={() => setShowFilters(!showFilters)}
                  activeFilterCount={activeFilterCount}
                />
              </div>

              {showFilters && (
                <FilterPanel
                  filterType={filterType}
                  setFilterType={setFilterType}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  hasActiveFilters={hasActiveFilters}
                  clearFilters={clearFilters}
                  filteredCount={filteredActivities.length}
                  totalCount={initialActivities.length}
                  onClose={() => setShowFilters(false)}
                />
              )}

              {hasActiveFilters && !showFilters && (
                <ActiveFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                />
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full mb-4">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Loading Activities</h3>
                  <p className="text-muted-foreground">Fetching your recent activities...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardContent className="p-6">
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-full mb-4">
                        <X className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Unable to Load Activities</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">{error}</p>
                      
                      {error.includes('backend API') && (
                        <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-4 text-left mb-4 border border-orange-200 dark:border-orange-900">
                          <p className="text-sm font-semibold text-foreground mb-2">📋 To fix this:</p>
                          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>Open a terminal in the <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">backend/</code> folder</li>
                            <li>Run: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">pnpm run api:dev</code></li>
                            <li>Backend will start at <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">http://localhost:3000</code></li>
                            <li>Refresh this page to load activities</li>
                          </ol>
                        </div>
                      )}
                      
                      {onRefresh && (
                        <Button onClick={onRefresh} variant="outline">
                          Try Again
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Activities List */}
            {!loading && !error && (
              <div className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
                <ActivityList
                  activities={paginatedActivities}
                  copyToClipboard={onCopyToClipboard}
                  emptyStateTitle="No activities found"
                  emptyStateDescription="Your onchain activities will appear here. Try adjusting your filters or create your first IP asset."
                  emptyStateAction={
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {onCreateNew && (
                        <Button
                          onClick={onCreateNew}
                          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-200"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Create Your First IP
                        </Button>
                      )}
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="hover:scale-105 transition-transform bg-transparent"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  }
                />
              </div>
            )}

            {/* Pagination */}
            {filteredActivities.length > 0 && (
              <div className="mt-8 animate-fade-in-up" style={{ animationDelay: "600ms" }}>
                <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-sm">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredActivities.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              </div>
            )}

            {/* Load More Button */}
            {onLoadMore && !loading && (
              <div className="mt-8 animate-fade-in-up text-center" style={{ animationDelay: "700ms" }}>
                <Button
                  onClick={onLoadMore}
                  variant="outline"
                  className="hover:scale-105 transition-transform"
                >
                  Load More Activities
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: number
  icon: any
  color: string
  delay: number
}

function StatsCard({ title, value, icon: Icon, color, delay }: StatsCardProps) {
  return (
    <Card
      className={`group relative overflow-hidden bg-gradient-to-br from-${color}-50/80 via-${color}-50/50 to-background dark:from-${color}-950/50 dark:via-${color}-950/30 dark:to-background border-${color}-200/50 dark:border-${color}-800/30 transition-all duration-300 animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <CardContent className="relative p-4 sm:p-5 text-center">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-${color}-500/25`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className={`text-xl sm:text-2xl font-bold text-${color}-900 dark:text-${color}-100 mb-1`}>
          {value}
        </div>
        <div className={`text-xs sm:text-sm text-${color}-700 dark:text-${color}-300 font-medium`}>
          {title}
        </div>
      </CardContent>
    </Card>
  )
}