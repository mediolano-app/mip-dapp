"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  TrendingUp,
  Search,
  Grid3X3,
  List,
  Download,
  Star,
  Users,
  Shield,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { AssetIP } from "@/src/types/asset";
import Link from "next/link";
import { ExpandableAssetCard } from "@/src/components/expandable-asset-card";
import { useGetPortfolioAssets } from "@/src/hooks/use-wallet-assets";
import { useUser } from "@clerk/nextjs";

export default function PortfolioView() {
  const { user } = useUser();
  const [selectedTab, setSelectedTab] = useState("owned");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const publicKey = user?.publicMetadata?.publicKey as any;
  
  console.log("User wallet:", publicKey)

  const {
    data: portfolioAsset,
    loading: asset_loading,
    error: asset_error,
    refetchAsset,
  } = useGetPortfolioAssets(publicKey || null);

  // Transform NFTs to asset format for display
  const portfolioAssets = portfolioAsset?.map((nft) => ({
    id: `${nft.contractAddress}_${nft.tokenId}`,
    slug: `${nft.contractAddress}-${nft.tokenId}`,
    title: nft.metadata?.name || `Token #${nft.tokenId}`,
    author: "You", // Since these are owned assets
    description: nft.metadata?.description || "Your NFT Asset",
    type: "NFT",
    template: "standard",
    collection:
      nft.contractAddress === process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MIP
        ? "Mediolano"
        : "External",
    collectionSlug: nft.contractAddress,
    tags:
      nft.metadata?.attributes?.map((attr) => attr.value).join(", ") || "nft",
    mediaUrl: nft.metadata?.image || "/placeholder.svg",
    externalUrl: `${process.env.NEXT_PUBLIC_EXPLORER_URL}/contract/${nft.contractAddress}/token/${nft.tokenId}`,
    licenseType: "all-rights",
    licenseDetails: "Full ownership rights",
    ipVersion: "1.0",
    commercialUse: true,
    modifications: true,
    attribution: false,
    registrationDate: new Date().toISOString().split("T")[0],
    protectionStatus: "Protected",
    protectionScope: "Global",
    protectionDuration: "Permanent",
    creator: {
      id: "current-user",
      username: "you",
      name: "You",
      avatar: "/placeholder.svg",
      verified: true,
      wallet: publicKey || "",
      bio: "Creator",
      followers: 0,
      following: 0,
      assets: portfolioAsset?.length,
    },
    timestamp: "Owned",
    attributes: nft.metadata?.attributes || [],
    blockchain: "Starknet",
    contractAddress: nft.contractAddress,
    tokenId: nft.tokenId,
    metadataUri: nft.tokenURI,
  }));

  // All assets from the wallet are "owned" since they're in the user's wallet
  const ownedAssets = portfolioAssets; // All NFTs in wallet are owned
  const createdAssets = portfolioAssets?.filter(
    (asset) =>
      asset.contractAddress === process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MIP
  ); // Only assets from Mediolano contract are "created" by user

  const currentAssets = selectedTab === "owned" ? ownedAssets : createdAssets;

  const filteredAssets = currentAssets?.filter((asset) => {
    const matchesSearch = asset.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterBy === "all" || asset.type.toLowerCase() === filterBy.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const sortedAssets = filteredAssets?.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.title.localeCompare(b.title);
      case "type":
        return a.type.localeCompare(b.type);
      case "creator":
        return a.author.localeCompare(b.author);
      default:
        // Recent (new to old): Sort by tokenId in descending order
        const aId = BigInt(a.tokenId);
        const bId = BigInt(b.tokenId);
        return aId > bId ? -1 : aId < bId ? 1 : 0;
    }
  });

  // Portfolio statistics
  const stats = {
    totalAssets: portfolioAssets?.length,
    totalCollections: 1,
    totalValue: 0,
    // totalCollections: tokens.length,
    // totalValue: walletAssets?.totalValueUSD || 0,
    uniqueCollections: new Set(
      portfolioAssets?.map((asset) => asset.collection)
    ).size,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <main className="pb-6">
        <div className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    My Portfolio
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your tokenized intellectual property
                  </p>
                  {user && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-muted-foreground">
                        {`${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`}

                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    {currentAssets?.length} Assets
                  </Badge>
                  {/* Export button 
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:scale-105 transition-transform"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  */}
                </div>
              </div>

              {/* Error State */}
              {asset_error && (
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Failed to load portfolio assets
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {asset_error}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refetchAsset}
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "100ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {asset_loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        stats.totalAssets
                      )}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      Total Assets
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "200ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <Star className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                      {asset_loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        createdAssets?.length
                      )}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Created
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "300ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {asset_loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        stats.totalCollections
                      )}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      Collections
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "400ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                      100%
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      Protected
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs and Controls */}
            <div
              className="space-y-4 mb-6 animate-fade-in-up"
              style={{ animationDelay: "500ms" }}
            >
              <Tabs
                value={selectedTab}
                onValueChange={setSelectedTab}
                className="w-full"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <TabsList className="grid w-full sm:w-auto grid-cols-2 bg-muted/50">
                    <TabsTrigger
                      value="owned"
                      className="data-[state=active]:bg-background"
                    >
                      Owned ({ownedAssets?.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="created"
                      className="data-[state=active]:bg-background"
                    >
                      Created ({createdAssets?.length})
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="w-9 h-9 p-0 hover:scale-105 transition-transform"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="w-9 h-9 p-0 hover:scale-105 transition-transform"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search your IP assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/50"
                    />
                  </div>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40 bg-background/50">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Created</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="author">Author</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-full sm:w-40 bg-background/50">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <TabsContent value="owned" className="mt-6">
                  <AssetGrid assets={sortedAssets as any} viewMode={viewMode} />
                </TabsContent>

                <TabsContent value="created" className="mt-6">
                  <AssetGrid
                    assets={sortedAssets as any}
                    viewMode={viewMode}
                    isOwner={true}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AssetGrid({
  assets,
  viewMode,
  isOwner = false,
}: {
  assets: AssetIP[];
  viewMode: "grid" | "list";
  isOwner?: boolean;
}) {
  if (assets?.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in-up">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <TrendingUp className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          No IP assets found
        </h3>
        <p className="text-muted-foreground mb-6">
          Start tokenizing your intellectual property or adjust your filters
        </p>
        <Link href="/create">
          <Button className="hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            Create New IP
          </Button>
        </Link>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {assets?.map((asset, index) => (
          <ExpandableAssetCard
            key={asset.id}
            asset={asset}
            variant="list"
            isOwner={isOwner}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets?.map((asset, index) => (
        <ExpandableAssetCard
          key={asset.id}
          asset={asset}
          variant="grid"
          isOwner={isOwner}
        />
      ))}
    </div>
  );
}
