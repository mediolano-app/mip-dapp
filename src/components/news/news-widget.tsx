"use client"

import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Newspaper, Calendar, ArrowRight, ArrowUpRight, Star, User } from "lucide-react"
import { newsArticles } from "@/src/lib/news-data"

export function NewsWidget() {
  // Get latest 4 news articles for the widget
  const latestNews = newsArticles.slice(0, 4)
  const featuredArticle = latestNews[0]
  const otherArticles = latestNews.slice(1)

  return (
    <div className="border-t border-border/50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Newspaper className="w-3 h-3 text-white" />
            </div>
            <h4 className="font-bold">Creators Newsroom</h4>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden md:flex bg-transparent text-xs">
            <Link href="/news">
              View All
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Featured Article - With Image */}
          <div className="lg:col-span-3">
            <Link href={`/news/${featuredArticle.slug}`} className="group block">
              <Card className="h-full overflow-hidden border-0 bg-gradient-to-br from-primary/8 via-purple-500/8 to-pink-500/8 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.01]">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Feature Image - 1:1 Aspect Ratio */}
                    <div className="w-16 h-16 md:w-32 md:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-purple-500/20">
                      <img
                        src={featuredArticle.image || "/placeholder.svg?height=100&width=100"}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs gap-1">
                          <Star className="w-2 h-2" />
                          Lastest
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {featuredArticle.category}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {featuredArticle.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{featuredArticle.excerpt}</p>

                      <div className="flex items-center justify-between">
                       

                        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Other Articles - Clean List */}
          <div className="lg:col-span-2 space-y-2">
            {otherArticles.map((article, index) => (
              <Link key={article.id} href={`/news/${article.slug}`} className="group block">
                <Card className="border-0 bg-gradient-to-r from-muted/20 to-muted/10 hover:from-primary/5 hover:to-purple-500/5 transition-all duration-300 group-hover:shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {article.isEvent ? (
                          <Calendar className="w-4 h-4 text-primary" />
                        ) : (
                          <Newspaper className="w-4 h-4 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h5 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                            {article.title}
                          </h5>
                          <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
                        </div>

           
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* View All Button for Mobile */}
            <div className="md:hidden pt-2">
              <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                <Link href="/news">
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
