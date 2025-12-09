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
]

export const newsArticles: NewsArticle[] = [
  {
    id: "1",
    slug: "world-creators-own-work",
    title: "A world where creators own their work, instantly and everywhere",
    excerpt:
      "MIP is designed to empower creators to register, license, and monetize their content without requiring prior knowledge of blockchain or technical systems.",
    content: `
      <div class="prose prose-lg max-w-none">
        <p>Creators, developers, and businesses produce content at unprecedented speed, yet the mechanisms for protecting intellectual property remain slow, expensive, and  constrained. As artificial intelligence, generative media, and agentic platforms reshape the creative landscape and blur the lines between original and derivative work, all digital content becomes increasingly modular and remixable, making ownership grow more complex and expensive. While creative works are more vulnerable, the need for a secure and scalable sound solution has become urgent.</p>
        <br>
        <p>MIP is powered by Mediolano, an open-source framework built on Starknet for intellectual property tokenization. Mediolano is designed to empower creators to register, license, and monetize their content without requiring prior knowledge of blockchain or technical systems. It enables from artists to AI agents to tokenize creative work on-chain, establishing immutable proof of ownership with zero transaction fees. </p>
        <br>
        <p>MIP use of Starknet—a Layer 2 scaling solution for Ethereum—ensures high-speed, low-cost transactions. Starknet employs zero-knowledge proofs to maintain security and scalability, making it an ideal foundation for IP and RWA tokenization. MIP zero-fee model further lowers the barrier to entry, particularly for creators in emerging markets and underrepresented communities.</p>
        <br>
        <p>In a time when ideas are currency and originality is under siege, the implications extend beyond copyright. MIP's model—combining cryptographic verification with zero fees offers more than protection — it empowers creators with a compelling blueprint for new possibilities on the Integrity Web.</p>
        </div>
    `,
    image: "/miplaunch.jpg",
    author: authors[0],
    publishedAt: "2025-09-12",
    category: "Creators",
    tags: ["Starknet", "Mobile", "App", "Blockchain", "IP"],
    featured: true,
    isEvent: false,
    eventDate: "2025-09-12",
    eventLocation: "Worldwide",
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
        <br>
        <p>Programmable IP and the Integrity Web represent a transformative vision for the future of intellectual property and intelligence. By tokenizing IP assets and leveraging the power of blockchain technology, we can create a more transparent, secure, and innovative digital ecosystem.</p> 
        <br>
        <p>As we move forward, it is essential to address the challenges and embrace the opportunities presented by these technologies to unlock their full potential and drive the next wave of digital innovation.</p>
      </div>
    `,
    image: "/article-programmable-ip-tokenization.webp",
    author: authors[0],
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
