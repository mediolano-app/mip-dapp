export interface NewsAuthor {
  id: string
  name: string
  avatar: string
  bio: string
  twitter?: string
  linkedin?: string
  role: string
}

export interface NewsArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  image: string
  author: NewsAuthor
  publishedAt: string
  category: string
  tags: string[]
  featured: boolean
  isEvent?: boolean
  eventDate?: string
  eventLocation?: string
  readTime?: number
}

const authors: NewsAuthor[] = [
  {
    id: "1",
    name: "MIP",
    avatar: "/placeholder.svg?height=100&width=100",
    bio: "Tokenize and protect your creative work with MIP.",
    twitter: "https://x.com/mediolanoapp",
    linkedin: "https://linkedin.com/mediolano",
    role: "My Intellectual Property",
  },
  {
    id: "2",
    name: "MIP",
    avatar: "/placeholder.svg?height=100&width=100",
    bio: "Tokenize and protect your creative work with MIP.",
    twitter: "https://x.com/mediolanoapp",
    linkedin: "https://linkedin.com/mediolano",
    role: "My Intellectual Property",
  },
  {
    id: "3",
    name: "MIP",
    avatar: "/placeholder.svg?height=100&width=100",
    bio: "Tokenize and protect your creative work with MIP.",
    twitter: "https://x.com/mediolanoapp",
    linkedin: "https://linkedin.com/mediolano",
    role: "My Intellectual Property",
  },
]

export const newsArticles: NewsArticle[] = [
  {
    id: "1",
    slug: "starknet-rio-meetup",
    title: "Starknet Rio Meetup + IP Lounge",
    excerpt:
      "​A Starknet, em parceria com o OnlyDust e Mediolano está promovendo um meetup no Rio de Janeiro com vibes de blockchain, open-source e cultura!",
    content: `
      <div class="prose prose-lg max-w-none">
        <p>Estamos empolgados em anunciar o <strong>Starknet Rio Meetup 2025</strong>, um evento exclusivo que reunirá desenvolvedores, criadores e entusiastas de blockchain no coração do Rio de Janeiro.</p>
      </div>
    `,
    image: "/starknet-rio-meetup-ip-lounge.png",
    author: authors[0],
    publishedAt: "2025-08-06",
    category: "Events",
    tags: ["Starknet", "Rio", "Meetup", "Blockchain", "Mediolano"],
    featured: true,
    isEvent: true,
    eventDate: "2025-08-04",
    eventLocation: "Rio de Janeiro, Brazil",
    readTime: 5,
  },
  {
    id: "2",
    slug: "programmable-ip-tokenizing-intelligence-integrity-web",
    title: "Programmable IP: Tokenizing Intelligence on the Integrity Web",
    excerpt:
      "The rapid evolution of the digital landscape has given birth to new paradigms and technologies that are reshaping the way we interact with information and assets. Among these, the concepts of programmable intellectual property (IP) and the Integrity Web [..]",
    content: `
      <div class="prose prose-lg max-w-none">
        <p>The rapid evolution of the digital landscape has given birth to new paradigms and technologies that are reshaping the way we interact with information and assets. Among these, the concepts of programmable intellectual property (IP) and the Integrity Web stand out as transformative forces that promise to revolutionize the management, distribution, and utilization of intelligence. This publication explores how programmable IP will tokenize intelligence on the Integrity Web, ushering in a new era of transparency, security, and</p>
      <br>
        <p>Programmable IP refers to intellectual property that is embedded with smart contracts, allowing for automated and programmable actions based on predefined conditions. This concept harnesses the power of blockchain technology to tokenize IP assets, enabling them to be traded, licensed, and monetized with unprecedented precision and flexibility.</p>
<br>
        <p>The Integrity Web is an emerging digital ecosystem built on the principles of trust, transparency, and authenticity. It leverages blockchain technology to create a decentralized and immutable ledger of transactions, ensuring that information and assets remain secure and verifiable. In this context, programmable IP represents a groundbreaking innovation that enables the creation, management, and distribution of intellectual property in a highly efficient and secure manner.</p>
<br>
        <p>Tokenizing intelligence on the Integrity Web represents a paradigm shift in how we conceptualize and manage intellectual property. By transforming intelligence into programmable and tradable tokens, we can unlock new avenues for collaboration, innovation, and value creation.</p>

        <p>Programmable IP and the Integrity Web represent a transformative vision for the future of intellectual property and intelligence. By tokenizing IP assets and leveraging the power of blockchain technology, we can create a more transparent, secure, and innovative digital ecosystem.</p> 
<br>
        <p>As we move forward, it is essential to address the challenges and embrace the opportunities presented by these technologies to unlock their full potential and drive the next wave of digital innovation.</p>
      </div>
    `,
    image: "/article-programmable-ip-tokenization.webp",
    author: authors[1],
    publishedAt: "2025-08-04",
    category: "Articles",
    tags: ["IP Protection", "Guide", "Blockchain", "Copyright"],
    featured: false,
    readTime: 8,
  },
  
]

// Helper functions
export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return newsArticles.find((article) => article.slug === slug)
}

export function getFeaturedArticles(): NewsArticle[] {
  return newsArticles.filter((article) => article.featured)
}

export function getArticlesByCategory(category: string): NewsArticle[] {
  return newsArticles.filter((article) => article.category === category)
}

export function searchArticles(query: string): NewsArticle[] {
  const lowercaseQuery = query.toLowerCase()
  return newsArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowercaseQuery) ||
      article.excerpt.toLowerCase().includes(lowercaseQuery) ||
      article.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}

export function getRelatedArticles(currentArticle: NewsArticle, limit = 3): NewsArticle[] {
  return newsArticles
    .filter(
      (article) =>
        article.id !== currentArticle.id &&
        (article.category === currentArticle.category || article.tags.some((tag) => currentArticle.tags.includes(tag))),
    )
    .slice(0, limit)
}

export function getAllCategories(): string[] {
  return [...new Set(newsArticles.map((article) => article.category))]
}

export function getAllTags(): string[] {
  return [...new Set(newsArticles.flatMap((article) => article.tags))]
}

export function getTrendingTags(): string[] {
  const tagCounts = newsArticles.reduce(
    (acc, article) => {
      article.tags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag]) => tag)
}
