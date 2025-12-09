import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent } from "@/src/components/ui/card"
import { Separator } from "@/src/components/ui/separator"
import { ArticlesGrid } from "@/src/components/news/articles-grid"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Bookmark,
  Twitter,
  Linkedin,
  Facebook,
  LinkIcon,
  ExternalLink,
  Clock,
  User,
} from "lucide-react"
import { getArticleBySlug, getRelatedArticles } from "@/src/lib/news-data"

interface NewsArticlePageProps {
  params: {
    slug: string
  }
}

export default function NewsArticlePage({ params }: NewsArticlePageProps) {
  const article = getArticleBySlug(params.slug)

  if (!article) {
    notFound()
  }

  const relatedArticles = getRelatedArticles(article, 3)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="gap-2">
              <Link href="/news">
                <ArrowLeft className="w-4 h-4" />
                Back to News & Updates
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LinkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Article Header */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{article.category}</Badge>
            <Separator orientation="vertical" className="h-4" />
            <span>{formatDate(article.publishedAt)}</span>
            {article.readTime && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{article.readTime} min read</span>
                </div>
              </>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">{article.title}</h1>

          <p className="text-xl text-muted-foreground leading-relaxed">{article.excerpt}</p>

          {/* Event Info */}
          {article.isEvent && (
            <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-border/50">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-medium">{article.eventDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{article.eventLocation}</span>
                    </div>
                  </div>
                  <Button className="shrink-0">
                    Event Details
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="hover:bg-primary/20 cursor-pointer transition-colors">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative aspect-video mb-8 overflow-hidden rounded-xl">
          <Image src={article.image || "/placeholder.svg"} alt={article.title} fill={true} className="object-cover" priority />
        </div>

        {/* Article Actions 
        <div className="flex items-center justify-between mb-8 p-4 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Share:</span>
            <Button variant="ghost" size="sm">
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Facebook className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>*/}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-12" dangerouslySetInnerHTML={{ __html: article.content }} />

        {/* Author Section */}
        <Card className="mb-12 bg-gradient-to-r from-primary/5 to-purple-500/5 border-border/50">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-xl font-bold">{article.author.name}</h3>
                  <p className="text-primary font-medium">{article.author.role}</p>
                </div>
                <p className="text-muted-foreground leading-relaxed">{article.author.bio}</p>
                <div className="flex gap-3">
                  {article.author.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.author.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="w-4 h-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {article.author.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.author.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <ArticlesGrid articles={relatedArticles} title="Related Articles" showCount={false} />
        )}
      </article>
    </div>
  )
}
