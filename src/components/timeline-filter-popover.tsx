"use client"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Separator } from "@/src/components/ui/separator"
import { Switch } from "@/src/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import {
  Filter,
  Search,
  RotateCcw,
  Palette,
  Music,
  Video,
  FileText,
  Lightbulb,
  MessageSquare,
  BookOpen,
  Building,
  Code,
  Gem,
  Shield,
  Calendar,
  Tag,
  User,
  TrendingUp,
} from "lucide-react"

export interface FilterState {
  search: string
  assetTypes: string[]
  licenses: string[]
  verifiedOnly: boolean
  dateRange: string
  sortBy: string
  tags: string[]
  priceRange: number[]
}

interface TimelineFilterPopoverProps {
  filters?: FilterState
  onFiltersChange?: (filters: FilterState) => void
  activeFilterCount?: number
  onClearFilters?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const assetTypeOptions = [
  { id: "art", label: "Art", icon: Palette, color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300" },
  {
    id: "audio",
    label: "Audio",
    icon: Music,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  { id: "video", label: "Video", icon: Video, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  {
    id: "publications",
    label: "Publications",
    icon: BookOpen,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    id: "software",
    label: "Software",
    icon: Code,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
  {
    id: "patents",
    label: "Patents",
    icon: Lightbulb,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  {
    id: "posts",
    label: "Posts",
    icon: MessageSquare,
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },
  {
    id: "nft",
    label: "NFT",
    icon: Gem,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  },
  {
    id: "rwa",
    label: "RWA",
    icon: Building,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
]

const licenseOptions = [
  { id: "all-rights-reserved", label: "All Rights Reserved" },
  { id: "cc-by", label: "CC BY 4.0" },
  { id: "cc-by-sa", label: "CC BY-SA 4.0" },
  { id: "cc-by-nc", label: "CC BY-NC 4.0" },
  { id: "cc-by-nc-sa", label: "CC BY-NC-SA 4.0" },
  { id: "mit", label: "MIT License" },
  { id: "apache", label: "Apache 2.0" },
  { id: "gpl", label: "GPL 3.0" },
]

const popularTags = [
  "digital-art",
  "cyberpunk",
  "music",
  "poetry",
  "quantum",
  "literature",
  "ambient",
  "meditation",
  "software",
  "audit",
  "smart-contracts",
  "security",
  "patent",
  "solar",
  "renewable-energy",
  "innovation",
  "blockchain",
  "ai",
]

export function TimelineFilterPopover({
  filters = {
    search: "",
    assetTypes: [],
    licenses: [],
    verifiedOnly: false,
    dateRange: "all",
    sortBy: "recent",
    tags: [],
    priceRange: [0, 100],
  },
  onFiltersChange = () => { },
  activeFilterCount = 0,
  onClearFilters = () => { },
  open,
  onOpenChange,
}: TimelineFilterPopoverProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use internal state if not controlled externally
  const popoverOpen = open !== undefined ? open : isOpen
  const handleOpenChange = onOpenChange || setIsOpen

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateLocalFilter = (key: keyof FilterState, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleAssetType = (typeId: string) => {
    const newTypes = localFilters.assetTypes.includes(typeId)
      ? localFilters.assetTypes.filter((t) => t !== typeId)
      : [...localFilters.assetTypes, typeId]
    updateLocalFilter("assetTypes", newTypes)
  }

  const toggleLicense = (licenseId: string) => {
    const newLicenses = localFilters.licenses.includes(licenseId)
      ? localFilters.licenses.filter((l) => l !== licenseId)
      : [...localFilters.licenses, licenseId]
    updateLocalFilter("licenses", newLicenses)
  }

  const toggleTag = (tag: string) => {
    const newTags = localFilters.tags.includes(tag)
      ? localFilters.tags.filter((t) => t !== tag)
      : [...localFilters.tags, tag]
    updateLocalFilter("tags", newTags)
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    handleOpenChange(false)
  }

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      search: "",
      assetTypes: [],
      licenses: [],
      verifiedOnly: false,
      dateRange: "all",
      sortBy: "recent",
      tags: [],
      priceRange: [0, 100],
    }
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
    onClearFilters()
  }

  return (
    <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative" suppressHydrationWarning>
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {mounted && activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Filter Assets</h4>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Discover IP assets that match your interests
          </p>
        </div>

        <div className="max-h-[500px] overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={localFilters.search}
                  onChange={(e) => updateLocalFilter("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Separator />

            {/* Asset Types */}
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                Asset Types
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {assetTypeOptions.map((type) => {
                  const Icon = type.icon
                  const isSelected = localFilters.assetTypes.includes(type.id)
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleAssetType(type.id)}
                      className={`p-2 rounded-lg border-2 transition-all text-left ${isSelected ? "border-primary bg-primary/10" : "border-border hover:border-border/80 bg-card"
                        }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${type.color}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-medium">{type.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Licenses */}
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Licenses
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {licenseOptions.map((license) => {
                  const isSelected = localFilters.licenses.includes(license.id)
                  return (
                    <button
                      key={license.id}
                      onClick={() => toggleLicense(license.id)}
                      className={`w-full p-2 rounded-md border text-left transition-all ${isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-border/80 text-foreground"
                        }`}
                    >
                      <span className="text-sm">{license.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Creator Verification */}
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Creator Status
              </Label>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Verified Creators Only</span>
                  <p className="text-xs text-muted-foreground">Show only verified creator assets</p>
                </div>
                <Switch
                  checked={localFilters.verifiedOnly}
                  onCheckedChange={(checked) => updateLocalFilter("verifiedOnly", checked)}
                />
              </div>
            </div>

            <Separator />

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </Label>
              <Select value={localFilters.dateRange} onValueChange={(value) => updateLocalFilter("dateRange", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Sort By */}
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Sort By
              </Label>
              <Select value={localFilters.sortBy} onValueChange={(value) => updateLocalFilter("sortBy", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Popular Tags */}
            <div>
              <Label className="text-sm font-medium mb-3 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Popular Tags
              </Label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {popularTags.map((tag) => {
                  const isSelected = localFilters.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                    >
                      #{tag}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
              {Object.values(localFilters).some((v) =>
                Array.isArray(v)
                  ? v.length > 0
                  : typeof v === "boolean"
                    ? v
                    : v !== "" && v !== "all" && v !== "recent",
              ) && (
                  <Badge className="ml-2 bg-primary-foreground hover:bg-white text-primary">
                    {[
                      localFilters.search && 1,
                      localFilters.assetTypes.length,
                      localFilters.licenses.length,
                      localFilters.verifiedOnly && 1,
                      localFilters.dateRange !== "all" && 1,
                      localFilters.sortBy !== "recent" && 1,
                      localFilters.tags.length,
                    ]
                      .filter(Boolean)
                      .reduce((a, b) => (a as number) + (b as number), 0)}
                  </Badge>
                )}
            </Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
