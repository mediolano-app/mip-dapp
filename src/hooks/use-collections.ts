import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { collectionsService, type CollectionFilters, type PaginatedCollections } from '@/src/services/collections.service'
import type { Collection } from '@/src/types/asset'
import { collections as mockCollections } from '@/src/lib/mock-data'

export type { CollectionFilters } from '@/src/services/collections.service'

export interface UseCollectionsOptions {
    filters?: CollectionFilters
    page?: number
    limit?: number
    userAddress?: string
}

export interface UseCollectionsReturn {
    collections: Collection[]
    filteredCollections: Collection[]
    featuredCollections: Collection[]
    userCollections: Collection[]
    isLoading: boolean
    error: string | null
    page: number
    limit: number
    total: number
    hasMore: boolean
    totalAssets: number
    totalViews: number
    totalLikes: number
    refetch: () => Promise<void>
    loadMore: () => Promise<void>
    setFilters: (filters: CollectionFilters) => void
    setPage: (page: number) => void
}

/**
 * Hook for managing collections with filtering, pagination, and real-time updates
 */
export function useCollections(options: UseCollectionsOptions = {}): UseCollectionsReturn {
    const {
        filters = {},
        page: initialPage = 1,
        limit = 20,
        userAddress
    } = options

    const [collections, setCollections] = useState<Collection[]>([])
    const [userCollections, setUserCollections] = useState<Collection[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentFilters, setCurrentFilters] = useState<CollectionFilters>(filters)
    const [page, setPage] = useState(initialPage)
    const [total, setTotal] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    
    const fetchingRef = useRef(false)
    const lastFetchParamsRef = useRef<string>('')
    const errorCountRef = useRef(0)
    const MAX_RETRIES = 2

    const filteredCollections = useMemo(() => {
        let filtered = [...collections]

        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase()
            filtered = filtered.filter(collection => 
                collection.name.toLowerCase().includes(searchTerm) ||
                collection.description.toLowerCase().includes(searchTerm) ||
                collection.creator.name.toLowerCase().includes(searchTerm)
            )
        }

        if (currentFilters.category && currentFilters.category !== 'all') {
            filtered = filtered.filter(collection => 
                collection.category.toLowerCase() === currentFilters.category?.toLowerCase()
            )
        }

        if (currentFilters.featured !== undefined) {
            filtered = filtered.filter(collection => 
                collection.isFeatured === currentFilters.featured
            )
        }

        if (currentFilters.isPublic !== undefined) {
            filtered = filtered.filter(collection => 
                collection.isPublic === currentFilters.isPublic
            )
        }

        // Apply sorting
        if (currentFilters.sortBy) {
            filtered.sort((a, b) => {
                switch (currentFilters.sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name)
                    case 'assets':
                        return b.assets - a.assets
                    case 'views':
                        return (b.views || 0) - (a.views || 0)
                    case 'likes':
                        return (b.likes || 0) - (a.likes || 0)
                    case 'recent':
                    default:
                        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                }
            })
        }

        return filtered
    }, [collections, currentFilters])

    // Memoized featured collections
    const featuredCollections = useMemo(() => {
        return filteredCollections.filter(collection => collection.isFeatured)
    }, [filteredCollections])

    // Memoized statistics
    const totalAssets = useMemo(() => {
        return filteredCollections.reduce((sum, collection) => sum + collection.assets, 0)
    }, [filteredCollections])

    const totalViews = useMemo(() => {
        return filteredCollections.reduce((sum, collection) => sum + (collection.views || 0), 0)
    }, [filteredCollections])

    const totalLikes = useMemo(() => {
        return filteredCollections.reduce((sum, collection) => sum + (collection.likes || 0), 0)
    }, [filteredCollections])

    const fetchCollections = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        // Create unique key for this fetch request (only based on pagination, not filters)
        const fetchKey = `${pageNum}`
        
        // Prevent duplicate concurrent calls
        if (fetchingRef.current) {
            console.log('Fetch already in progress, skipping...')
            return
        }

        // Check if this is the same request as last time
        if (fetchKey === lastFetchParamsRef.current && !append) {
            console.log('Same fetch params as last time, skipping...')
            return
        }

        if (errorCountRef.current >= MAX_RETRIES) {
            console.log(`Max retries (${MAX_RETRIES}) reached, stopping fetch attempts`)
            setError('Unable to load collections. The service may be temporarily unavailable.')
            return
        }

        fetchingRef.current = true
        lastFetchParamsRef.current = fetchKey
        
        if (!append) {
            setIsLoading(true)
        }
        setError(null)

        try {
            console.log('Fetching collections...', userAddress ? `(wallet: ${userAddress})` : '(no wallet)')
            const result = await collectionsService.getCollections({}, pageNum, limit)
            
            if (append) {
                setCollections(prev => [...prev, ...result.collections])
            } else {
                setCollections(result.collections)
            }
            setTotal(result.total)
            setHasMore(result.hasMore)
            errorCountRef.current = 0
            

        } catch (err) {
            console.error('Error fetching collections:', err)
            errorCountRef.current += 1
            
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collections'
            setError(errorCountRef.current === 1 ? errorMessage : `${errorMessage} (Retry ${errorCountRef.current}/${MAX_RETRIES})`)
            
            if (!append) {
                setCollections([])
                setTotal(0)
                setHasMore(false)
            }
        } finally {
            setIsLoading(false)
            fetchingRef.current = false
        }
    }, [limit, userAddress])

    const loadMore = useCallback(async () => {
        if (hasMore && !fetchingRef.current) {
            const nextPage = page + 1
            setPage(nextPage)
            await fetchCollections(nextPage, true)
        }
    }, [hasMore, page, fetchCollections])

    const setFilters = useCallback((newFilters: CollectionFilters) => {
        console.log('Setting new filters (client-side only):', newFilters)
        setCurrentFilters(newFilters)
    }, [])

    const fetchUserCollections = useCallback(async () => {
        if (!userAddress) {
            setUserCollections([])
            return
        }

        try {
            console.log('Fetching user collections for:', userAddress)
            const userCollectionsResult = await collectionsService.getUserCollections(userAddress)
            setUserCollections(userCollectionsResult)
        } catch (err) {
            console.error('Error fetching user collections:', err)
            setUserCollections([])
        }
    }, [userAddress])

    const setPageAndFetch = useCallback((newPage: number) => {
        setPage(newPage)
        fetchCollections(newPage, false)
    }, [fetchCollections])

    const refetch = useCallback(async () => {
        console.log('Manual refetch requested')
        setPage(1)
        errorCountRef.current = 0
        lastFetchParamsRef.current = ''
        
        const fetchPromises = [fetchCollections(1, false)]
        if (userAddress) {
            fetchPromises.push(fetchUserCollections())
        }
        
        setCollections([])
        setUserCollections([])
        
        try {
            await Promise.all(fetchPromises)
        } catch (error) {
            console.error('Error during parallel refetch:', error)
        }
    }, [fetchCollections, fetchUserCollections, userAddress])

    useEffect(() => {
        console.log('useEffect triggered - fetching collections...')
        fetchCollections(1, false)
    },  [fetchCollections])  

    useEffect(() => {
        fetchUserCollections()
    }, [fetchUserCollections])

    return {
        collections,
        filteredCollections,
        featuredCollections,
        userCollections,
        isLoading,
        error,
        page,
        limit,
        total,
        hasMore,
        totalAssets,
        totalViews,
        totalLikes,
        refetch,
        loadMore,
        setFilters,
        setPage: setPageAndFetch
    }
}

/**
 * Hook for managing a single collection
 */
export function useCollection(collectionIdentifier: string) {
    const [collection, setCollection] = useState<Collection | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchCollection = useCallback(async () => {
        if (!collectionIdentifier) return

        setIsLoading(true)
        setError(null)

        try {
            let result: Collection | null = null
            
            // First, try to get by ID if the identifier is numeric
            if (/^\d+$/.test(collectionIdentifier)) {
                console.log(`Fetching collection by ID: ${collectionIdentifier}`)
                result = await collectionsService.getCollection(collectionIdentifier)
            }
            
            // If not found by ID or identifier is not numeric, search by slug
            if (!result) {
                console.log(`Searching for collection by slug: ${collectionIdentifier}`)
                const allCollectionsResult = await collectionsService.getCollections({}, 1, 100)
                result = allCollectionsResult.collections.find(c => c.slug === collectionIdentifier) || null
                
                if (!result) {
                    // Also try with numeric ID from the identifier
                    const idFromSlug = collectionIdentifier.replace(/^collection-/, '')
                    if (/^\d+$/.test(idFromSlug)) {
                        console.log(`Trying to fetch collection by extracted ID: ${idFromSlug}`)
                        result = await collectionsService.getCollection(idFromSlug)
                    }
                }
            }
            
            if (result) {
                setCollection(result)
                setError(null)
            } else {
                throw new Error(`Collection not found: ${collectionIdentifier}`)
            }
        } catch (err) {
            console.error('Error fetching collection:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch collection')
            
            // Fallback to mock data on error
            const mockCollection = mockCollections.find(c => 
                c.id === collectionIdentifier || 
                c.slug === collectionIdentifier ||
                c.id === collectionIdentifier.replace(/^collection-/, '')
            )
            
            if (mockCollection) {
                setCollection(mockCollection)
                setError(null)
            } else {
                setCollection(null)
            }
        } finally {
            setIsLoading(false)
        }
    }, [collectionIdentifier])

    useEffect(() => {
        fetchCollection()
    }, [fetchCollection])

    return {
        collection,
        isLoading,
        error,
        refetch: fetchCollection
    }
}

/**
 * Hook for managing collection stats
 */
export function useCollectionStats() {
    const { collections, totalAssets, totalViews, totalLikes, isLoading, error } = useCollections()

    const stats = useMemo(() => {
        return {
            totalCollections: collections.length,
            totalAssets,
            totalViews,
            totalLikes,
            featuredCollections: collections.filter(c => c.isFeatured).length,
            publicCollections: collections.filter(c => c.isPublic).length,
            privateCollections: collections.filter(c => !c.isPublic).length,
            categoriesCount: new Set(collections.map(c => c.category)).size,
            averageAssetsPerCollection: collections.length > 0 ? Math.round(totalAssets / collections.length) : 0
        }
    }, [collections, totalAssets, totalViews, totalLikes])

    return {
        stats,
        isLoading,
        error
    }
} 