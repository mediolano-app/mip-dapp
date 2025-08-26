import { Suspense } from "react"
import { Timeline } from "@/src/components/timeline"
import { Header } from "@/src/components/header"
import { FloatingNavigation } from "@/src/components/floating-navigation"
import { Card, CardContent } from "@/src/components/ui/card"
import { TrendingUp, Users, Shield, Zap } from "lucide-react"
import { FeaturedArticle } from "@/src/components/news/featured-article"
import { newsArticles, getAllCategories } from "@/src/lib/news-data"

import { Hero } from "@/src/components/hero"



export default function HomePage() {

  const featuredArticle = newsArticles.find((article) => article.featured)

  return (
    <div className="bg-gradient-to-br from-background via-muted/10 to-background">
     
     

      <main className="pb-6">

      {/* Featured Article Section 
      <div className="px-4 pt-6 pb-8">
        <div className="max-w-6xl mx-auto">
        {featuredArticle && <FeaturedArticle article={featuredArticle} />}
        </div>
      </div>*/}


      {/* New Hero Section */}
        <div className="px-4 pt-6">
          <div className="mx-auto max-w-6xl">
            <Hero />
          </div>
        </div>

        {/* Public Timeline Section for testing */}
        <div className="px-4 pt-6 pb-8">
          <Timeline />
        </div>



        {/* Main Timeline Section 
        <div className="px-4 pt-6 pb-8">
          <div className="max-w-2xl mx-auto">
            <Suspense fallback={<TimelineSkeleton />}>
              <Timeline />
            </Suspense>
          </div>
        </div>*/}

        {/* Stats Section - Moved to Bottom 
        <div className="px-4 py-8 border-t border-border/30 bg-muted/20 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Platform Statistics</h2>
              <p className="text-sm text-muted-foreground">Global IP protection powered by blockchain</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-300">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">2.4K</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">IP Assets</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform duration-300">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-purple-900 dark:text-purple-100">1.2K</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">Creators</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:scale-105 transition-transform duration-300">
                <CardContent className="p-4 text-center">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">181</div>
                  <div className="text-xs text-green-700 dark:text-green-300">Countries</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:scale-105 transition-transform duration-300">
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-orange-900 dark:text-orange-100">$0.01</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300">Avg Fee</div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-muted-foreground">
                Protecting intellectual property across 181 countries with immutable blockchain records
              </p>
            </div>
          </div>
        </div>
          */}


      </main>
     
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter Controls Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-20 bg-muted rounded-lg animate-pulse"></div>
          <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
        </div>
      </div>

      {/* Timeline Items Skeleton */}
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="animate-pulse">
            <div className="p-6 pb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-20"></div>
                </div>
              </div>
            </div>
            <div className="h-72 sm:h-96 bg-muted"></div>
            <div className="p-6">
              <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>

              {/* Attributes skeleton */}
              <div className="mb-6">
                <div className="h-4 bg-muted rounded w-20 mb-3"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                  <div className="h-6 bg-muted rounded w-14"></div>
                </div>
              </div>

              {/* Tags skeleton */}
              <div className="flex gap-2 mb-6">
                <div className="h-5 bg-muted rounded w-12"></div>
                <div className="h-5 bg-muted rounded w-16"></div>
                <div className="h-5 bg-muted rounded w-14"></div>
              </div>

              {/* Actions skeleton */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex space-x-3">
                  <div className="h-8 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
