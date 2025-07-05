"use client";

import { useEffect, useState } from "react";
import { Header } from "@/src/components/header";
import { FloatingNavigation } from "@/src/components/floating-navigation";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  MoreVertical,
  Eye,
  Heart,
  Share,
  Download,
  Plus,
  Grid3X3,
  List,
  Search,
  CheckCircle,
  Star,
  FolderOpen,
  ExternalLink,
  Edit,
  Settings,
} from "lucide-react";
import { collections, timelineAssets } from "@/src/lib/mock-data";
import type { AssetIP } from "@/src/types/asset";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

import { getDeployedCollectionMetadata } from "@/src/lib/starknet-service";

// interface CollectionPageProps {
//   params: {
//     slug: string;
//   };
// }

// export default function CollectionPage({ params }: CollectionPageProps) {
export default function CollectionPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  // const collection = collections.find((c) => c.slug === params.slug)

  // if (!collection) {
  //   notFound()
  // }

  // const [collection, setCollection] = useState(
  //   () => collections.find((c) => c.slug === params.slug) || null
  // );

  // const [collection, setCollection] = useState(
  //   () => collections.find((c) => c.slug === slug) || null
  // );

  const [collection, setCollection] = useState<any | null>(null);
  const { slug } = useParams() as { slug: string };

  // useEffect(() => {
  //   if (!collection && slug) {
  //     // getDeployedCollectionMetadata(params.slug)
  //     getDeployedCollectionMetadata(slug)
  //       .then((data) => {
  //         if (data) {
  //           setCollection(data);
  //         } else {
  //           notFound();
  //         }
  //       })
  //       .catch(() => notFound());
  //   }
  //   // }, [params.slug, collection]);
  // }, [slug, collection]);

  useEffect(() => {
    async function loadCollection() {
      // console.log("Fetching metadata for slug:", slug);
      const data = await getDeployedCollectionMetadata(slug);
      // console.log("Received metadata:", data);

      if (!data) return notFound();
      setCollection(data);
    }

    if (slug) {
      loadCollection();
    }
  }, [slug]);

  // Filter assets that belong to this collection
  const collectionSlug = collection?.slug;

  const collectionAssets = timelineAssets.filter(
    (asset) => asset.collectionSlug === collectionSlug
  );

  const filteredAssets = collectionAssets.filter(
    (asset) =>
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.title.localeCompare(b.title);
      case "type":
        return a.type.localeCompare(b.type);
      case "author":
        return a.author.localeCompare(b.author);
      default:
        return 0;
    }
  });

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "digital art":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "audio":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "publications":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "software":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "patents":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ai art":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  console.log("Rendering collection:", collection);
  if (!collection)
    return <div className="p-6 text-red-500">Loading collection...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <main className="pb-6">
        {/* Collection Header */}
        <div className="relative">
          {collection.bannerImage && (
            <div className="h-64 sm:h-80 relative overflow-hidden">
              <Image
                src={collection.bannerImage || "/placeholder.svg"}
                alt={collection.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          )}

          <div className="px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <div
                className={`${
                  collection.bannerImage ? "-mt-32 relative z-10" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative">
                    <Image
                      src={collection.coverImage || "/placeholder.svg"}
                      alt={collection.name}
                      width={200}
                      height={200}
                      className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl object-cover border-4 border-background shadow-2xl"
                    />
                    {collection.isFeatured && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-yellow-500 text-yellow-900 border-0">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h1
                          className={`text-3xl sm:text-4xl font-bold ${
                            collection.bannerImage
                              ? "text-white"
                              : "text-foreground"
                          }`}
                        >
                          {collection.name}
                        </h1>
                        <Badge
                          className={`${getCategoryColor(
                            collection.category
                          )} border-0`}
                        >
                          {collection.category}
                        </Badge>
                      </div>
                      <p
                        className={`text-lg ${
                          collection.bannerImage
                            ? "text-gray-200"
                            : "text-muted-foreground"
                        } max-w-2xl`}
                      >
                        {collection.description}
                      </p>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10 border-2 border-background">
                        <AvatarImage
                          src={collection.creator.avatar || "/placeholder.svg"}
                          alt={collection.creator.name}
                        />
                        <AvatarFallback>
                          {collection.creator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/creator/${collection.creator.username}`}
                          >
                            <span
                              className={`font-medium hover:underline ${
                                collection.bannerImage
                                  ? "text-white"
                                  : "text-foreground"
                              }`}
                            >
                              {collection.creator.name}
                            </span>
                          </Link>
                          {collection.creator.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div
                          className={`text-sm ${
                            collection.bannerImage
                              ? "text-gray-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          Created {collection.createdAt}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            collection.bannerImage
                              ? "text-white"
                              : "text-foreground"
                          }`}
                        >
                          {collection.assets}
                        </div>
                        <div
                          className={`text-sm ${
                            collection.bannerImage
                              ? "text-gray-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          Assets
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            collection.bannerImage
                              ? "text-white"
                              : "text-foreground"
                          }`}
                        >
                          {collection.blockchain}
                        </div>
                        <div
                          className={`text-sm ${
                            collection.bannerImage
                              ? "text-gray-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          Network
                        </div>
                      </div>
                      {collection.floorPrice && (
                        <div className="text-center">
                          <div
                            className={`text-2xl font-bold ${
                              collection.bannerImage
                                ? "text-white"
                                : "text-foreground"
                            }`}
                          >
                            {collection.floorPrice}
                          </div>
                          <div
                            className={`text-sm ${
                              collection.bannerImage
                                ? "text-gray-300"
                                : "text-muted-foreground"
                            }`}
                          >
                            Floor Price
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button className="hover:scale-105 transition-transform">
                        <Heart className="w-4 h-4 mr-2" />
                        Follow Collection
                      </Button>
                      <Button
                        variant="outline"
                        className="hover:scale-105 transition-transform"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        className="hover:scale-105 transition-transform"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="hover:scale-105 transition-transform"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Collection
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Blockchain
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Collection Assets */}
        <div className="px-4 py-8 border-t border-border/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Collection Assets
                </h2>
                <p className="text-muted-foreground">
                  {collectionAssets.length} items in this collection
                </p>
              </div>

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
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets in this collection..."
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
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assets Grid */}
            <AssetGrid assets={sortedAssets} viewMode={viewMode} />
          </div>
        </div>
      </main>
    </div>
  );
}

function AssetGrid({
  assets,
  viewMode,
}: {
  assets: AssetIP[];
  viewMode: "grid" | "list";
}) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FolderOpen className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          No assets found
        </h3>
        <p className="text-muted-foreground mb-6">
          This collection doesn't have any assets yet
        </p>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Assets
        </Button>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {assets.map((asset, index) => (
          <ExpandableAssetCard key={asset.id} asset={asset} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {assets.map((asset, index) => (
        <ExpandableAssetCard key={asset.id} asset={asset} index={index} />
      ))}
    </div>
  );
}

function ExpandableAssetCard({
  asset,
  index,
}: {
  asset: AssetIP;
  index: number;
}) {
  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-all duration-500 group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative">
        <Link href={`/asset/${asset.slug}`}>
          <Image
            src={asset.mediaUrl || "/placeholder.svg"}
            alt={asset.title}
            width={300}
            height={200}
            className="w-full h-40 object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute bottom-3 left-3">
          <Badge className="bg-background/90 text-foreground border-border/50 backdrop-blur-sm capitalize">
            {asset.type}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <Link href={`/asset/${asset.slug}`}>
          <h3 className="font-semibold text-foreground mb-2 truncate group-hover:text-primary transition-colors cursor-pointer">
            {asset.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {asset.description}
        </p>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="text-xs">v{asset.ipVersion}</div>
        </div>

        <Link href={`/asset/${asset.slug}`}>
          <Button
            variant="outline"
            className="w-full hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Asset
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
