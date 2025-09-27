"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import {
  TimelineFilterPopover,
  type FilterState,
} from "@/src/components/timeline-filter-popover";
import {
  Share,
  MoreHorizontal,
  Shield,
  ExternalLink,
  Sparkles,
  X,
  ChevronDown,
  CheckCircle,
  XCircle,
  Globe,
  Eye,
  Copy,
  Send,
  Loader2,
  UserPlus,
  Calendar,
  Hash,
  Network,
  Award,
  Flag,
} from "lucide-react";
import { useTimeline } from "@/src/hooks/use-timeline";
import { toast } from "@/src/hooks/use-toast";
import { shortenAddress } from "@/src/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { ReportContentDialog } from "@/src/components/report-content-dialog"

const getLicenseColor = (licenseType: string) => {
  switch (licenseType) {
    case "all-rights":
      return "bg-purple-500 text-white";
    case "creative-commons":
      return "bg-green-500 text-white";
    case "open-source":
      return "bg-green-500 text-white";
    case "custom":
      return "bg-purple-500 text-white";
    default:
      return "bg-blue-500 text-white";
  }
};

const defaultFilters: FilterState = {
  search: "",
  assetTypes: [],
  licenses: [],
  verifiedOnly: false,
  dateRange: "all",
  sortBy: "recent",
  tags: [],
  priceRange: [0, 100],
};

const ASSETS_PER_PAGE = 20;

export function Timeline() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());


  const {
    assets,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalAssets,
    updateFilters,
    clearFilters: clearTimelineFilters,
    activeFilters,
  } = useTimeline({
    initialLimit: ASSETS_PER_PAGE,
    autoLoad: true,
  });

  // Filter optimization
  const prevBackendFiltersRef = useRef<{ sortBy?: string }>({});
  const updateFiltersRef = useRef(updateFilters);
  updateFiltersRef.current = updateFilters;

  useEffect(() => {
    const currentBackendFilters = {
      sortBy: (filters.sortBy === "recent"
        ? "mintedAtBlock"
        : filters.sortBy === "popular"
        ? "mintedAtBlock"
        : filters.sortBy === "trending"
        ? "mintedAtBlock"
        : filters.sortBy === "alphabetical"
        ? "id"
        : "mintedAtBlock") as "mintedAtBlock" | "id",
    };

    // Check if backend filters changed (only sort now, search is frontend)
    const sortChanged =
      prevBackendFiltersRef.current.sortBy !== currentBackendFilters.sortBy;

    // Always update the filters in the timeline service
    const timelineFilters = {
      search: filters.search || undefined, // Now handled on frontend
      sortBy: currentBackendFilters.sortBy,
      sortOrder: "desc" as const,
      assetTypes:
        filters.assetTypes.length > 0 ? filters.assetTypes : undefined,
      licenses: filters.licenses.length > 0 ? filters.licenses : undefined,
      verifiedOnly: filters.verifiedOnly || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
      dateRange: filters.dateRange !== "all" ? filters.dateRange : undefined,
    };

    if (sortChanged) {
      prevBackendFiltersRef.current = currentBackendFilters;
      updateFiltersRef.current(timelineFilters);
    } else {
      updateFiltersRef.current(timelineFilters);
    }
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.assetTypes.length > 0) count += filters.assetTypes.length;
    if (filters.licenses.length > 0) count += filters.licenses.length;
    if (filters.verifiedOnly) count++;
    if (filters.dateRange !== "all") count++;
    if (filters.sortBy !== "recent") count++;
    if (filters.tags.length > 0) count += filters.tags.length;
    return count;
  }, [filters]);

  // Infinite scroll trigger element
  const scrollTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollTriggerRef.current;
    if (!element) return;

    element.setAttribute("data-timeline-scroll-trigger", "true");
  }, []);

  const clearFilters = () => {
    setFilters(defaultFilters);
    clearTimelineFilters();
  };

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case "search":
        setFilters((prev) => ({ ...prev, search: "" }));
        break;
      case "assetType":
        setFilters((prev) => ({
          ...prev,
          assetTypes: prev.assetTypes.filter((t) => t !== value),
        }));
        break;
      case "license":
        setFilters((prev) => ({
          ...prev,
          licenses: prev.licenses.filter((l) => l !== value),
        }));
        break;
      case "verified":
        setFilters((prev) => ({ ...prev, verifiedOnly: false }));
        break;
      case "tag":
        setFilters((prev) => ({
          ...prev,
          tags: prev.tags.filter((t) => t !== value),
        }));
        break;
    }
  };

  const toggleExpanded = (assetId: string) => {
    setExpandedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const handleShare = async (asset: any) => {
    try {
      const url = `${window.location.origin}/asset/${asset.slug}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "You can share it anywhere.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: `Please copy this link manually: ${window.location.origin}/asset/${asset.slug}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      
      
      {/* Filter Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TimelineFilterPopover
            filters={filters}
            onFiltersChange={setFilters}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
          />
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Search: {filters.search}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeFilter("search")}
                  />
                </Badge>
              )}
              {filters.assetTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeFilter("assetType", type)}
                  />
                </Badge>
              ))}
              {filters.licenses.map((license) => (
                <Badge key={license} variant="secondary" className="text-xs">
                  {license}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeFilter("license", license)}
                  />
                </Badge>
              ))}
              {filters.verifiedOnly && (
                <Badge variant="secondary" className="text-xs">
                  Verified Only
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeFilter("verified")}
                  />
                </Badge>
              )}
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeFilter("tag", tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to load timeline
          </h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Initial loading skeletons */}
      {isLoading && assets.length === 0 && (
        <div className="max-w-2xl mx-auto space-y-6">
          {[...Array(5)].map((_, i) => (
            <Card
              key={`initial-skeleton-${i}`}
              className="overflow-hidden border-border/50 bg-card"
            >
              <div className="animate-pulse">
                <div className="h-64 bg-muted"></div>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                    <div className="h-6 bg-muted rounded w-14"></div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!error && !isLoading && assets.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No assets found
          </h3>
          <p className="text-muted-foreground mb-6">
            {activeFilterCount > 0
              ? "Try adjusting your filters to discover more IP assets"
              : "Be the first to tokenize your IP assets on the Mediolano Protocol"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {activeFilterCount > 0 ? (
              <Button onClick={clearFilters} variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/create">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Your First IP Asset
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Timeline Feed */}
      {!error && assets.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-6">
          {assets.map((asset, index: number) => (
            <Card
              key={asset.id}
              className="overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 group"
            >
              <Collapsible
                open={expandedAssets.has(asset.id)}
                onOpenChange={() => toggleExpanded(asset.id)}
              >
                {/* Asset Media - Top */}
                <Link href={`/asset/${asset.slug}`}>
                  <div className="relative">
                    <Image
                      src={asset.mediaUrl || "/placeholder.svg"}
                      alt={asset.title}
                      width={600}
                      height={400}
                      className="w-full h-64 object-cover cursor-pointer"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={`${getLicenseColor(
                          asset.licenseType
                        )} text-xs`}
                      >
                        {asset.licenseType.replace("-", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </Link>

                {/* Main Content */}
                <CardContent className="p-4">
                  {/* Title & Description */}
                  <div className="space-y-3 mb-4">
                    <Link href={`/asset/${asset.slug}`}>
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer">
                        {asset.title}
                      </h2>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {asset.description}
                    </p>
                  </div>

                  {/* Type & Author */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Link href={`/creator/${asset.creator.username}`}>
                        <Image
                          src={asset.creator.avatar || "/placeholder.svg"}
                          alt={asset.creator.name}
                          width={32}
                          height={32}
                          className="min-w-8 min-h-8 w-8 h-8 rounded-full object-cover ring-2 ring-border/50"
                        />
                      </Link>
                      <div>
                        <div className="flex items-center space-x-2">
                          {
                            typeof asset.creator.name === "string" && asset.creator.name.startsWith("0x") && asset.creator.name.length > 16
                              ? shortenAddress(asset.creator.name, 6)
                              : asset.creator.name
                          }
                          {/* <Link
                            href={`/creator/${asset.creator.username}`}
                            className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                          >
                            {asset.creator.name}
                          </Link> */}
                          {asset.creator.verified && (
                            <Shield className="ml-1 w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {asset.timestamp}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {asset.type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">

                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleShare(asset)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                       
                        <DropdownMenuSeparator />

                        <ReportContentDialog
                          contentType="asset"
                          contentId={asset.id}
                          contentTitle={asset.title}
                          contentOwner={asset.author}
                          contentImage={asset.mediaUrl}
                        >
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            Report Asset
                          </DropdownMenuItem>
                        </ReportContentDialog>

                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(asset)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Share className="w-4 h-4 mr-1" />
                        Share
                      </Button>

                      {/*asset.externalUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <a
                            href={asset.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Globe className="w-4 h-4 mr-1" />
                            External link
                          </a>
                        </Button>
                      )*/}


                    </div>

                    <div className="flex items-center space-x-2">
                      <Link href={`/asset/${asset.slug}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>

                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              expandedAssets.has(asset.id) ? "rotate-180" : ""
                            }`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  {/* Dashboard-Style Expandable Details */}
                  <CollapsibleContent className="mt-4">
                    <div className="pt-4 border-t border-border/30">
                      {/* Dashboard Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Creator Card */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <UserPlus className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Creator
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Image
                              src={asset.creator.avatar || "/placeholder.svg"}
                              alt={asset.creator.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {asset.creator.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {asset.creator.username}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Protection Status */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Proof of Ownership
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {asset.protectionStatus} v{asset.ipVersion}
                            </p>

                          </div>
                        </div>

                        {/* Network Info */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Network className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Network
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {asset.blockchain}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              #{asset.tokenId || asset.id}
                            </p>
                          </div>
                        </div>

                        {/* Registration */}
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Registered
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {asset.registrationDate}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {asset.protectionDuration}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* License Permissions - Compact */}
                      <div className="bg-muted/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Award className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Licensing {asset.licenseType}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="flex justify-center mb-1">
                              {asset.commercialUse ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-foreground">
                              Commercial
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="flex justify-center mb-1">
                              {asset.modifications ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-foreground">
                              Modify
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="flex justify-center mb-1">
                              {asset.attribution ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-foreground">
                              Attribution
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tags - Compact */}
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Hash className="w-4 h-4 text-cyan-500" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Tags
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {asset.tags && asset.tags.trim() ? (
                            asset.tags.split(", ").map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs px-2 py-0.5"
                              >
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No tags</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Collapsible>
            </Card>
          ))}

          {/* Loading skeletons for more assets */}
          {isLoadingMore && (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card
                  key={`skeleton-${i}`}
                  className="overflow-hidden border-border/50 bg-card"
                >
                  <div className="animate-pulse">
                    <div className="h-64 bg-muted"></div>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-20"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={scrollTriggerRef} className="h-1" />

          {/* End of results */}
          {!hasMore && assets.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                (for now) you've reached the end of this timline • {totalAssets} assets loaded
              </p>
              <Link href="/create">
                <Button variant="outline" size="sm" className="mt-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}


    </div>
  );
}
