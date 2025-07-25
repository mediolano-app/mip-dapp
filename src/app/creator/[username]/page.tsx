"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/src/components/header"
import { Navigation } from "@/src/components/navigation"
import { Card, CardContent } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/src/components/ui/collapsible"
import { CreatorDashboard } from "@/src/components/creator-dashboard"
import {
  ArrowLeft,
  Search,
  ExternalLink,
  Share,
  MoreHorizontal,
  ChevronDown,
  CheckCircle,
  XCircle,
  Globe,
  Eye,
  Copy,
  Send,
  Calendar,
  Hash,
  Network,
  Award,
  Shield,
  Briefcase,
} from "lucide-react"
import { creators, timelineAssets } from "@/src/lib/mock-data"
import { toast } from "@/src/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

const getLicenseColor = (licenseType: string) => {
  switch (licenseType) {
    case "all-rights":
      return "bg-red-500 text-white"
    case "creative-commons":
      return "bg-green-500 text-white"
    case "open-source":
      return "bg-blue-500 text-white"
    case "custom":
      return "bg-purple-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

export default function CreatorPage() {
  const params = useParams()
  const router = useRouter()
  const [creator, setCreator] = useState<any>(null)
  const [creatorAssets, setCreatorAssets] = useState<any[]>([])
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const username = params.username as string

    // Find creator by username
    const foundCreator = creators.find((c) => c.username === username)

    if (foundCreator) {
      setCreator(foundCreator)

      // Get creator's assets from timeline
      const assets = timelineAssets.filter(
        (asset) => asset.creator?.username === username || asset.creator?.id === foundCreator.id,
      )
      setCreatorAssets(assets)
    }

    setLoading(false)
  }, [params.username])

  const handleShare = (asset?: any) => {
    const url = asset ? `${window.location.origin}/asset/${asset.slug}` : window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: asset ? "Asset link copied to clipboard" : "Creator profile link copied to clipboard",
    })
  }

  const toggleExpanded = (assetId: string) => {
    setExpandedAssets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(assetId)) {
        newSet.delete(assetId)
      } else {
        newSet.add(assetId)
      }
      return newSet
    })
  }

  const filteredAssets = creatorAssets.filter((asset) => {
    const matchesSearch = (asset.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterBy === "all" || (asset.type || "").toLowerCase() === filterBy.toLowerCase()
    return matchesSearch && matchesFilter
  })

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.title || "").localeCompare(b.title || "")
      case "type":
        return (a.type || "").localeCompare(b.type || "")
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        <main className="pb-20">
          <div className="px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-muted rounded w-1/4"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        <main className="pb-20">
          <div className="px-4 py-8">
            <div className="max-w-4xl mx-auto text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">Creator Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The creator you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push("/")}>Back to Home</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <main className="pb-20">
        <div className="px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:bg-muted/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {/* Creator Dashboard */}
            <div className="mb-8">
              <CreatorDashboard creator={creator} assetCount={creatorAssets.length} />
            </div>

            {/* Assets Section */}
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Creator Assets</h2>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  {sortedAssets.length} assets
                </Badge>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/50"
                  />
                </div>

                <div className="flex space-x-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32 bg-background/50">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-32 bg-background/50">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assets Grid */}
              {sortedAssets.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">No assets found</h3>
                  <p className="text-muted-foreground mb-6">
                    This creator hasn't published any assets yet or they don't match your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedAssets.map((asset, index) => (
                    <Card
                      key={asset.id}
                      className="overflow-hidden border-border/50 bg-card hover:shadow-lg transition-all duration-300 group"
                    >
                      <Collapsible open={expandedAssets.has(asset.id)} onOpenChange={() => toggleExpanded(asset.id)}>
                        {/* Asset Media - Top */}
                        <Link href={`/asset/${asset.slug}`}>
                          <div className="relative">
                            <Image
                              src={asset.mediaUrl || "/placeholder.svg"}
                              alt={asset.title}
                              width={600}
                              height={300}
                              className="w-full h-48 object-cover cursor-pointer"
                            />
                            <div className="absolute top-3 right-3">
                              <Badge className={`${getLicenseColor(asset.licenseType)} text-xs`}>
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
                            <p className="text-sm text-muted-foreground line-clamp-2">{asset.description}</p>
                          </div>

                          {/* Type & Timestamp */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {asset.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{asset.timestamp}</span>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(asset)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="w-4 h-4 mr-2" />
                                  License Asset
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View on Explorer
                                </DropdownMenuItem>
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

                              {asset.externalUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <a href={asset.externalUrl} target="_blank" rel="noopener noreferrer">
                                    <Globe className="w-4 h-4 mr-1" />
                                    External
                                  </a>
                                </Button>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Link href={`/asset/${asset.slug}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </Link>

                              <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <ChevronDown
                                    className={`w-4 h-4 transition-transform ${expandedAssets.has(asset.id) ? "rotate-180" : ""}`}
                                  />
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>

                          {/* Expandable Details */}
                          <CollapsibleContent className="mt-4">
                            <div className="pt-4 border-t border-border/30">
                              {/* Dashboard Grid */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                {/* Protection Status */}
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Shield className="w-4 h-4 text-green-500" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      Protection
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{asset.protectionStatus}</p>
                                    <p className="text-xs text-muted-foreground">v{asset.ipVersion}</p>
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
                                    <p className="text-sm font-medium text-foreground">{asset.blockchain}</p>
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
                                    <p className="text-sm font-medium text-foreground">{asset.registrationDate}</p>
                                    <p className="text-xs text-muted-foreground">{asset.protectionDuration}</p>
                                  </div>
                                </div>

                                {/* File Info */}
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <ExternalLink className="w-4 h-4 text-cyan-500" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      File Info
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {asset.fileFormat || "Unknown"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{asset.fileSize || "N/A"}</p>
                                  </div>
                                </div>
                              </div>

                              {/* License Permissions */}
                              <div className="bg-muted/30 rounded-lg p-3 mb-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Award className="w-4 h-4 text-orange-500" />
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    License Permissions
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
                                    <p className="text-xs font-medium text-foreground">Commercial</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex justify-center mb-1">
                                      {asset.modifications ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                      )}
                                    </div>
                                    <p className="text-xs font-medium text-foreground">Modify</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex justify-center mb-1">
                                      {asset.attribution ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                      )}
                                    </div>
                                    <p className="text-xs font-medium text-foreground">Attribution</p>
                                  </div>
                                </div>
                              </div>

                              {/* Tags */}
                              <div className="bg-muted/30 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Hash className="w-4 h-4 text-cyan-500" />
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Tags
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {asset.tags.split(", ").map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </CardContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
