"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Eye,
  Heart,
  Star,
  TrendingUp,
  CheckCircle,
  Calendar,
  FolderOpen,
} from "lucide-react";
import type { Collection } from "@/src/types/asset";
import Image from "next/image";
import Link from "next/link";

interface CollectionCardProps {
  collection: Collection;
  variant?: "default" | "featured" | "compact";
}

export function CollectionCard({
  collection,
  variant = "default",
}: CollectionCardProps) {
  const getCategoryColor = (category: string) => {
    if (!category) return "defaultColor"; // Replace with your default color
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

  if (variant === "compact") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-center space-x-4 p-4">
          <Link
            href={`/collection/${collection.slug}`}
            className="relative flex-shrink-0"
          >
            <Image
              src={collection.coverImage || "/placeholder.svg"}
              alt={collection.name}
              width={60}
              height={60}
              className="w-15 h-15 rounded-lg object-cover cursor-pointer hover:scale-105 transition-transform"
            />
            {collection.isFeatured && (
              <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-current" />
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/collection/${collection.slug}`}>
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors cursor-pointer">
                {collection.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {collection.description}
            </p>
            <div className="flex items-center space-x-3 mt-2">
              <Badge
                className={`${getCategoryColor(
                  collection.category
                )} border-0 text-xs`}
              >
                {collection.category}
              </Badge>
              {/* <span className="text-xs text-muted-foreground">{collection.assets} assets</span> */}
              <span className="text-xs text-muted-foreground">
                {Array.isArray(collection.assets)
                  ? collection.assets.length
                  : collection.assets}{" "}
                assets
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">X</div>
              <div className="text-xs text-muted-foreground">assets</div>
            </div>
            <Link href={`/collection/${collection.slug}`}>
              <Button
                variant="outline"
                size="sm"
                className="hover:scale-105 transition-transform"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "featured") {
    return (
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <div className="relative">
          <Link href={`/collection/${collection.slug}`}>
            <Image
              src={collection.bannerImage || collection.coverImage}
              alt={collection.name}
              width={600}
              height={200}
              className="w-full h-32 object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
            />
          </Link>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground border-0">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage
                  src={collection.creator.avatar || "/placeholder.svg"}
                  alt={collection.creator.name}
                />
                <AvatarFallback>
                  {collection.creator.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-white font-medium text-sm truncate">
                    {collection.creator.name}
                  </span>
                  {collection.creator.verified && (
                    <CheckCircle className="w-3 h-3 text-blue-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <Link href={`/collection/${collection.slug}`}>
            <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors cursor-pointer">
              {collection.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {collection.description}
          </p>

          <div className="flex items-center justify-between mb-4">
            <Badge
              className={`${getCategoryColor(collection.category)} border-0`}
            >
              {collection.category}
            </Badge>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <FolderOpen className="w-3 h-3" />
                {/* <span>{collection.assets}</span> */}
                <span>
                  {Array.isArray(collection.assets)
                    ? collection.assets.length
                    : collection.assets}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>X</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>X</span>
              </div>
            </div>
          </div>

          {collection.floorPrice && (
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-muted-foreground">Floor Price</span>
              <span className="font-bold text-foreground">
                {collection.floorPrice}
              </span>
            </div>
          )}

          <Link href={`/collection/${collection.slug}`}>
            <Button className="w-full hover:scale-105 transition-transform">
              <Eye className="w-4 h-4 mr-2" />
              View Collection
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 group">
      <div className="relative">
        <Link href={`/collection/${collection.slug}`}>
          <Image
            src={collection.coverImage || "/placeholder.svg"}
            alt={collection.name}
            width={400}
            height={200}
            className="w-full h-40 object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {collection.isFeatured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-yellow-500 text-yellow-900 border-0">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6 border border-white">
              <AvatarImage
                src={collection.creator.avatar || "/placeholder.svg"}
                alt={collection.creator.name}
              />
              <AvatarFallback>
                {collection.creator.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-1">
              <span className="text-white text-xs font-medium">
                {collection.creator.name}
              </span>
              {collection.creator.verified && (
                <CheckCircle className="w-3 h-3 text-blue-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link href={`/collection/${collection.slug}`}>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer">
              {collection.name}
            </h3>
          </Link>
          <Badge
            className={`${getCategoryColor(
              collection.category
            )} border-0 text-xs`}
          >
            {collection.category}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {collection.description}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div>
            <div className="text-sm font-bold text-foreground">
              {/* {collection.assets} */}
              {Array.isArray(collection.assets)
                ? collection.assets.length
                : collection.assets}
            </div>
            <div className="text-xs text-muted-foreground">Assets</div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">x</div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">x</div>
            <div className="text-xs text-muted-foreground">Likes</div>
          </div>
        </div>

        {collection.floorPrice && (
          <div className="flex items-center justify-between text-sm mb-4 p-2 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground">Floor Price</span>
            <span className="font-bold text-foreground">
              {collection.floorPrice}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Created {collection.createdAt}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>{collection.blockchain}</span>
          </div>
        </div>

        <Link href={`/collection/${collection.slug}`}>
          <Button
            variant="outline"
            className="w-full hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Collection
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
