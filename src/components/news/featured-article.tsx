"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent } from "@/src/components/ui/card"
import { Calendar, MapPin, ExternalLink, Clock, User } from "lucide-react"
import type { NewsArticle } from "@/src/lib/news-data"

interface FeaturedArticleProps {
  article: NewsArticle
}

export function FeaturedArticle({ article }: FeaturedArticleProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-border/50">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image Section */}
        <div className="relative aspect-video group">
          <Image
            src={article.image || "/placeholder.svg"}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {article.isEvent && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-blue-500 text-white">
                <Calendar className="w-3 h-3 mr-1" />
                Live Event
              </Badge>
            </div>
          )}
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0">
              {article.category}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-8 flex flex-col justify-center space-y-6">
          <div className="space-y-4">
           
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              <Link href={`/news/${article.slug}`}>
              {article.title}
              </Link>
              </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">{article.excerpt}</p>

            {article.isEvent && (
              <div className="space-y-2 p-4 bg-background/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">{article.eventDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{article.eventLocation}</span>
                </div>
              </div>
            )}

            {/* Author 
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{article.author.name}</p>
                <p className="text-xs text-muted-foreground">{article.author.role}</p>
              </div>
            </div>*/}




          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href={`/news/${article.slug}`}>
                Open Article
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            {article.isEvent && (
              <Button variant="outline" className="flex-1 bg-transparent">
                <Link href={`/news/${article.slug}`}>
                Event Details
                </Link>
                <Calendar className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
