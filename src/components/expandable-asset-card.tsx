"use client"

import { useState } from "react"
import { Card, CardContent } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/src/components/ui/collapsible"
import {
  ChevronDown,
  Shield,
  ExternalLink,
  Send,
  Eye,
  Copy,
  Calendar,
  Globe,
  CheckCircle,
  XCircle,
  Edit,
  MoreHorizontal,
  Share,
  UserPlus,
  Flag,
} from "lucide-react"
import type { AssetIP } from "@/src/types/asset"
import Image from "next/image"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { ReportAssetDialog } from "@/src/components/report-asset-dialog"
import { LazyMedia } from "@/src/components/ui/lazy-media"

interface ExpandableAssetCardProps {
  asset: AssetIP
  variant?: "grid" | "list"
  isOwner?: boolean
}

const getLicenseColor = (licenseType: string) => {
  switch (licenseType) {
    case "all-rights":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "creative-commons":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "open-source":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "custom":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

const getProtectionIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "protected":
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case "patent protected":
      return <Shield className="w-4 h-4 text-blue-500" />
    case "pending":
      return <Calendar className="w-4 h-4 text-yellow-500" />
    case "expired":
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <Shield className="w-4 h-4 text-gray-500" />
  }
}



export function ExpandableAssetCard({ asset, variant = "grid", isOwner = false }: ExpandableAssetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleShare = () => {
    const url = `${window.location.origin}/asset/${asset.slug}`
    navigator.clipboard.writeText(url)
  }

  const handleTransfer = () => {
    // Navigate to transfer page
    window.location.href = `/transfer?asset=${asset.slug}`
  }

  if (variant === "list") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group bg-card/50 backdrop-blur-sm">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="p-4">
            <div className="flex items-center space-x-4">
              <Link href={`/asset/${asset.slug}`} className="relative flex-shrink-0">
                <LazyMedia
                  src={asset.mediaUrl || "/placeholder.svg"}
                  alt={asset.title}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-xl shadow-sm group-hover:shadow-md transition-shadow"
                />
                <Badge className="absolute -top-2 -right-2 text-xs capitalize bg-primary/90 text-primary-foreground">
                  {asset.type}
                </Badge>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/asset/${asset.slug}`}>
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors cursor-pointer text-lg">
                        {asset.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-2">{asset.description}</p>

                    <div className="flex items-center space-x-4 mb-4">
                      <Badge className={`${getLicenseColor(asset.licenseType)} border-0 text-xs`}>
                        {asset.licenseType.replace("-", " ").toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">v{asset.ipVersion}</span>
                      <span className="text-xs text-muted-foreground"></span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {getProtectionIcon(asset.protectionStatus)}
                        <span className="text-xs text-muted-foreground">{asset.protectionStatus}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">•</div>
                      <div className="text-xs text-muted-foreground">{asset.blockchain}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        {isExpanded ? "Less" : "More"}
                      </Button>
                    </CollapsibleTrigger>


                    <Link href={`/asset/${asset.slug}`}>
                      <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:scale-105 transition-transform">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && (
                          <>
                            <DropdownMenuItem onClick={handleTransfer}>
                              <Send className="w-4 h-4 mr-2" />
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem onClick={handleShare}>
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Explorer
                        </DropdownMenuItem>
                        {!isOwner && (
                          <>
                            <DropdownMenuSeparator />
                            <ReportAssetDialog
                              contentType="asset"
                              contentId={asset.id}
                              contentTitle={asset.title}
                              contentCreator={asset.author}
                            >
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Flag className="w-4 h-4 mr-2" />
                                Report Content
                              </DropdownMenuItem>
                            </ReportAssetDialog>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/30">


                {/* Creator Info
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground text-sm">Creator</h4>
                  <div className="flex items-center space-x-3">
                    <Image
                      src={asset.creator.avatar || "/placeholder.svg"}
                      alt={asset.creator.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-border/50"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/creator/${asset.creator.username}`}
                          className="font-medium text-foreground hover:text-primary transition-colors text-sm"
                        >
                          {asset.creator.name}
                        </Link>
                        {asset.creator.verified && <Shield className="w-3 h-3 text-blue-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">@{asset.creator.username}</p>
                    </div>
                    <Link href={`/creator/${asset.creator.username}`}>
                      <Button variant="outline" size="sm">
                        <UserPlus className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div> */}

                {/* Technical Details */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground text-sm">Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Network</span>
                      <span className="font-medium text-foreground">{asset.blockchain}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Token ID</span>
                      <span className="font-mono text-xs text-foreground">{asset.tokenId || asset.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Registered</span>
                      <span className="font-medium text-foreground">{asset.registrationDate}</span>
                    </div>
                    {asset.fileFormat && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Format</span>
                        <span className="font-medium text-foreground">{asset.fileFormat}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* License Permissions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground text-sm">License Permissions</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <div className="flex justify-center mb-1">
                        {asset.commercialUse ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Commercial</p>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <div className="flex justify-center mb-1">
                        {asset.modifications ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Modify</p>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <div className="flex justify-center mb-1">
                        {asset.attribution ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Attribution</p>
                    </div>
                  </div>
                </div>


                {asset.externalUrl && (
                  <div className="space-y-3">

                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={asset.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View external link
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </Card>
    )
  }

  // Grid variant
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 group border-border/50 bg-card/50 backdrop-blur-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="relative">
          <Link href={`/asset/${asset.slug}`}>
            <LazyMedia
              src={asset.mediaUrl || "/placeholder.svg"}
              alt={asset.title}
              width={400}
              height={300}
              className="w-full h-64"
            />
          </Link>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-8 h-8 p-0 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={handleTransfer}>
                      <Send className="w-4 h-4 mr-2" />
                      Transfer
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </DropdownMenuItem>
                {!isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <ReportAssetDialog
                      contentType="asset"
                      contentId={asset.id}
                      contentTitle={asset.title}
                      contentCreator={asset.author}
                    >
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Report Content
                      </DropdownMenuItem>
                    </ReportAssetDialog>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="absolute bottom-3 left-3">
            <Badge className="bg-background/90 text-foreground border-border/50 backdrop-blur-sm capitalize">
              {asset.type}
            </Badge>
          </div>

          <div className="absolute bottom-3 right-3">
            <Badge className={`${getLicenseColor(asset.licenseType)} border-0 backdrop-blur-sm text-xs`}>
              {asset.licenseType.replace("-", " ").toUpperCase()}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Link href={`/asset/${asset.slug}`}>
                <h3 className="font-semibold text-foreground mb-2 truncate group-hover:text-primary transition-colors cursor-pointer text-lg">
                  {asset.title}
                </h3>
              </Link>

              <p className="text-sm text-muted-foreground line-clamp-2">{asset.description}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getProtectionIcon(asset.protectionStatus)}
                <span className="text-xs text-muted-foreground">{asset.protectionStatus}</span>
              </div>
              <span className="text-xs text-muted-foreground">v{asset.ipVersion}</span>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{asset.registrationDate}</span>
              <span></span>
            </div>

            <div className="flex space-x-2">


              <Link href={`/asset/${asset.slug}`} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Asset
                </Button>
              </Link>



              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent className="mt-4">
            <div className="space-y-4 pt-4 border-t border-border/30">


              {/* Creator Info 
              <div>
                <h4 className="font-medium text-foreground mb-3 text-sm">Creator</h4>
                <div className="flex items-center space-x-3">
                  <Image
                    src={asset.creator.avatar || "/placeholder.svg"}
                    alt={asset.creator.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-border/50"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/creator/${asset.creator.username}`}
                        className="font-medium text-foreground hover:text-primary transition-colors text-sm"
                      >
                        {asset.creator.name}
                      </Link>
                      {asset.creator.verified && <Shield className="w-3 h-3 text-blue-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">@{asset.creator.username}</p>
                  </div>
                </div>
              </div>
              */}

              {/* Technical Info */}
              <div>
                <h4 className="font-medium text-foreground mb-3 text-sm">Technical Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium text-foreground">{asset.blockchain}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Token ID</span>
                    <span className="font-mono text-xs text-foreground">{asset.tokenId || asset.id}</span>
                  </div>
                  {asset.fileFormat && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Format</span>
                      <span className="font-medium text-foreground">{asset.fileFormat}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* License Permissions */}
              <div>
                <h4 className="font-medium text-foreground mb-3 text-sm">License Permissions</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-muted/20 rounded-lg">
                    <div className="flex justify-center mb-1">
                      {asset.commercialUse ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Commercial</p>
                  </div>
                  <div className="text-center p-2 bg-muted/20 rounded-lg">
                    <div className="flex justify-center mb-1">
                      {asset.modifications ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Modify</p>
                  </div>
                  <div className="text-center p-2 bg-muted/20 rounded-lg">
                    <div className="flex justify-center mb-1">
                      {asset.attribution ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Attribution</p>
                  </div>
                </div>
              </div>

              {/* Actions 
              <div className="flex space-x-2">
                {isOwner && (
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleTransfer}>
                    <Send className="w-4 h-4 mr-1" />
                    Transfer
                  </Button>
                )}
                
                <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>*/}


            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  )
}
