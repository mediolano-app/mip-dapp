"use client";

import { useState } from "react";
import { Header } from "@/src/components/header";
import { FloatingNavigation } from "@/src/components/floating-navigation";
import { CollectionCard } from "@/src/components/collection-card";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Search,
  Grid3X3,
  List,
  TrendingUp,
  FolderOpen,
  Eye,
  Heart,
  Plus,
} from "lucide-react";
import { collections } from "@/src/lib/mock-data";
import Link from "next/link";

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTab, setSelectedTab] = useState("all");

  const featuredCollections = collections.filter(
    (collection) => collection.isFeatured
  );
  const allCollections = collections;

  const currentCollections =
    selectedTab === "featured" ? featuredCollections : allCollections;

  const filteredCollections = currentCollections.filter((collection) => {
    const matchesSearch =
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterBy === "all" ||
      collection.category.toLowerCase() === filterBy.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const sortedCollections = [...filteredCollections].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "assets":
        return b.assets - a.assets;
      default:
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }
  });

  const totalAssets = collections.reduce(
    // (sum, collection) => sum + collection.assets,
    (sum, collection) =>
      sum +
      (Array.isArray(collection.assets)
        ? collection.assets.length
        : collection.assets),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <main className="pb-6">
        <div className="px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    IP Collections
                  </h1>
                  <p className="text-muted-foreground">
                    Discover curated collections of programmable intellectual
                    property
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    {collections.length} Collections
                  </Badge>
                  <Link href="/create-collection">
                    <Button className="hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Collection
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "100ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      X
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      Collections
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "200ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                      X
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      Total Assets
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "300ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      X
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      Total Views
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: "400ms" }}
                >
                  <CardContent className="p-4 text-center">
                    <Heart className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2 animate-pulse" />
                    <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                      X
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      Total Likes
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
                      value="all"
                      className="data-[state=active]:bg-background"
                    >
                      All Collections ({collections.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="featured"
                      className="data-[state=active]:bg-background"
                    >
                      Featured ({featuredCollections.length})
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
                      placeholder="Search collections..."
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
                      <SelectItem value="assets">Most Assets</SelectItem>
                      <SelectItem value="views">Most Viewed</SelectItem>
                      <SelectItem value="likes">Most Liked</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-full sm:w-40 bg-background/50">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="digital art">Digital Art</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="publications">Publications</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="patents">Patents</SelectItem>
                      <SelectItem value="ai art">AI Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <TabsContent value="all" className="mt-6">
                  <CollectionGrid
                    collections={sortedCollections}
                    viewMode={viewMode}
                  />
                </TabsContent>

                <TabsContent value="featured" className="mt-6">
                  <CollectionGrid
                    collections={sortedCollections}
                    viewMode={viewMode}
                    featured
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

function CollectionGrid({
  collections,
  viewMode,
  featured = false,
}: {
  collections: any[];
  viewMode: "grid" | "list";
  featured?: boolean;
}) {
  if (collections.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in-up">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <FolderOpen className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          No collections found
        </h3>
        <p className="text-muted-foreground mb-6">
          {featured
            ? "No featured collections available"
            : "Start creating collections or adjust your filters"}
        </p>
        <Link href="/create-collection">
          <Button className="hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            Create Collection
          </Button>
        </Link>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {collections.map((collection, index) => (
          <div
            key={collection.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CollectionCard collection={collection} variant="compact" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection, index) => (
        <div
          key={collection.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CollectionCard collection={collection} />
        </div>
      ))}
    </div>
  );
}
