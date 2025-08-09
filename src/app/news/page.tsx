"use client"

import { useState, useMemo } from "react"
import { NewsHeader } from "@/src/components/news/news-header"
import { FeaturedArticle } from "@/src/components/news/featured-article"
import { ArticlesGrid } from "@/src/components/news/articles-grid"
import { newsArticles, getAllCategories } from "@/src/lib/news-data"

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const categories = getAllCategories()
  const featuredArticle = newsArticles.find((article) => article.featured)
  const regularArticles = newsArticles.filter((article) => !article.featured)

  const filteredArticles = useMemo(() => {
    return regularArticles.filter((article) => {
      const matchesSearch =
        searchQuery === "" ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(article.category)

      return matchesSearch && matchesCategory
    })
  }, [regularArticles, searchQuery, selectedCategories])

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <NewsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategories={selectedCategories}
          onCategoryToggle={toggleCategory}
          categories={categories}
          onClearFilters={clearFilters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {featuredArticle && <FeaturedArticle article={featuredArticle} />}

        <ArticlesGrid articles={filteredArticles} />
      </div>
    </div>
  )
}
