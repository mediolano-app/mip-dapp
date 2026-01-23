"use client"

import { useState } from "react"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/src/components/ui/collapsible"
import {
  ChevronDown,
  MapPin,
  Globe,
  Calendar,
  Briefcase,
  Shield,
  Users,
  TrendingUp,
  Award,
  ExternalLink,
  Mail,
  Star,
  Activity,
  Zap,
  Target,
  Flag,
  MoreHorizontal,
} from "lucide-react"
import { VerifiedSocialBadges } from "@/src/components/verified-social-badges"
import { ReportAssetDialog } from "@/src/components/report-asset-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import Image from "next/image"

interface CreatorDashboardProps {
  creator: any
  assetCount: number
}

export function CreatorDashboard({ creator, assetCount }: CreatorDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Mock verified social accounts - in real app this would come from creator data
  const verifiedAccounts = {
    x: creator.verified,
    google: creator.verified,
    instagram: Math.random() > 0.5,
    linkedin: Math.random() > 0.5,
  }

  const stats = [
    {
      icon: Briefcase,
      label: "Assets",
      value: creator.totalAssets || assetCount,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      icon: Shield,
      label: "Protected",
      value: creator.protectedAssets || assetCount,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      icon: Award,
      label: "Collections",
      value: creator.totalCollections || 0,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    {
      icon: TrendingUp,
      label: "Engagement",
      value: `${Math.floor(Math.random() * 100)}%`,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
  ]

  const safeToLocaleString = (value: any): string => {
    const num = Number(value)
    return !isNaN(num) ? num.toLocaleString() : "0"
  }

  return (
    <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardContent className="p-6">
          {/* Creator Header */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="relative">
              <Image
                src={creator.avatar || "/placeholder.svg?height=80&width=80"}
                alt={creator.name || "Creator"}
                width={80}
                height={80}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-border/50 shadow-lg"
              />
              {creator.verified && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center ring-4 ring-background shadow-lg">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{creator.name || "Unknown Creator"}</h1>
                {creator.verified && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-3">@{creator.username || "unknown"}</p>

              {/* Verified Social Badges */}
              <div className="mb-4">
                <VerifiedSocialBadges verifiedAccounts={verifiedAccounts} size="sm" />
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{assetCount} assets</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {creator.joinedDate || "Unknown"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  {isExpanded ? "Less" : "More"}
                </Button>
              </CollapsibleTrigger>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Creator
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ReportAssetDialog
                    contentType="user"
                    contentId={creator.id || creator.username}
                    contentTitle={creator.displayName || creator.username}
                    contentCreator={creator.username}
                  >
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report Profile
                    </DropdownMenuItem>
                  </ReportAssetDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <p className="text-foreground leading-relaxed">{creator.bio || "No bio available"}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border`}>
                <CardContent className="p-4 text-center">
                  <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <div
                    className={`text-lg font-bold ${stat.color.replace("text-", "text-").replace("-600", "-900")} dark:${stat.color.replace("-600", "-100")}`}
                  >
                    {typeof stat.value === "string" ? stat.value : safeToLocaleString(stat.value)}
                  </div>
                  <div
                    className={`text-xs ${stat.color.replace("-600", "-700")} dark:${stat.color.replace("-600", "-300")}`}
                  >
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Expandable Details */}
          <CollapsibleContent>
            <div className="pt-6 border-t border-border/30 space-y-6">
              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center">
                    <Users className="w-5 h-5 mr-2 text-primary" />
                    More Information
                  </h3>

                  <div className="space-y-3">
                    {creator.location && (
                      <div className="flex items-center space-x-3 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{creator.location}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">Member since {creator.joinedDate || "Unknown"}</span>
                    </div>

                    {creator.website && (
                      <div className="flex items-center space-x-3 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={creator.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          Website
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-primary" />
                    Professional Details
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Specialties</span>
                      <div className="flex flex-wrap gap-1">
                        {(creator.specialties || ["Digital Art", "IP Protection"]).map((specialty: string) => (
                          <Badge key={specialty} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Achievements</span>
                      <div className="flex flex-wrap gap-1">
                        {(creator.achievements || ["Verified Creator"]).map((achievement: string) => (
                          <Badge key={achievement} variant="outline" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Metrics */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary" />
                  Activity Overview
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{assetCount}</div>
                    <div className="text-xs text-muted-foreground">Total Assets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{Math.floor(Math.random() * 50) + 10}</div>
                    <div className="text-xs text-muted-foreground">This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{Math.floor(Math.random() * 100)}%</div>
                    <div className="text-xs text-muted-foreground">Protection Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{Math.floor(Math.random() * 30) + 5}</div>
                    <div className="text-xs text-muted-foreground">Avg. Monthly</div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-primary" />
                  Social Accounts
                </h3>

                <div className="space-y-3">
                  <VerifiedSocialBadges verifiedAccounts={verifiedAccounts} size="md" showLabels={true} />

                  <p className="text-xs text-muted-foreground">
                    Social accounts help establish creator authenticity and build trust in the IP community.
                  </p>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Creator
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Target className="w-4 h-4 mr-2" />
                  Collaborate
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Portfolio
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  )
}
