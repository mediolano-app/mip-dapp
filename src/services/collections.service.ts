import { RpcProvider, Contract, CallData, num, validateAndParseAddress } from "starknet"
import { starknetService } from "./starknet.service"
import type { Collection, AssetIP } from "@/src/types/asset"
import { ip_collection_abi } from "@/src/abi/ip_collection"

// MIP Protocol Contract ABI for collections
const MIP_COLLECTIONS_ABI = ip_collection_abi;
// MIP Protocol Contract Address (from environment or default)
const MIP_COLLECTIONS_CONTRACT = process.env.NEXT_PUBLIC_COLLECTION_FACTORY_ADDRESS;

export interface MIPCollection {
    id: string
    name: string
    description: string
    creator: string
    coverImage: string
    category: string
    isPublic: boolean
    isFeatured: boolean
    createdAt: number
    updatedAt: number
    assetCount: number
    contractAddress: string
}

export interface CollectionFilters {
    search?: string
    category?: string
    creator?: string
    sortBy?: "recent" | "name" | "assets" | "views" | "likes"
    featured?: boolean
    isPublic?: boolean
}

export interface PaginatedCollections {
    collections: Collection[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

export interface CollectionStats {
    total_minted: bigint | string | number
    total_burned: bigint | string | number
    total_transfers: bigint | string | number
    last_mint_time: bigint | string | number
    last_burn_time: bigint | string | number
    last_transfer_time: bigint | string | number
}

export interface ContractToken {
    collection_id: bigint | string | number
    token_id: bigint | string | number
    owner: string
    metadata_uri: string
}

export interface ContractCollection {
    name: string
    symbol: string
    base_uri: string
    owner: string
    ip_nft: string
    is_active: boolean
}

export interface CollectionMetadata {
    name: string
    description: string
    image: string
    banner_image?: string
    external_url?: string
    seller_fee_basis_points?: number
    fee_recipient?: string
    attributes?: Array<{ trait_type: string; value: string }>
    category?: string
    visibility?: string
    type?: string
    tags?: string[]
    created_at?: string
}

export class CollectionsService {
    private provider: RpcProvider
    private contract: Contract | null = null
    private contractAvailable: boolean = false

    constructor() {
        this.provider = starknetService["provider"]
        this.initializeContract()
    }

    private async initializeContract() {
        try {
            if (!MIP_COLLECTIONS_CONTRACT) {
                console.warn("MIP Collections contract address not configured")
                return
            }
            this.contract = new Contract(MIP_COLLECTIONS_ABI, MIP_COLLECTIONS_CONTRACT, this.provider)
            this.contractAvailable = true
        } catch (error) {
            console.error("Failed to initialize MIP Collections contract:", error)
            this.contractAvailable = false
        }
    }

    /**
     * Get all collections by discovering them through known collection IDs
     * Since there's no direct method to list all collections,
     * we use a fallback approach with manually tracked collections
     */
    public async getCollections(
        filters: CollectionFilters = {},
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedCollections> {
        try {
            if (!this.contractAvailable || !this.contract) {
                return {
                    collections: [],
                    total: 0,
                    page,
                    limit,
                    hasMore: false
                }
            }

            // this should be tracked through events or a dedicated registry
            const maxCollectionId = 50
            
            const collectionCheckPromises = Array.from({ length: maxCollectionId }, (_, i) => {
                const collectionId = i + 1
                return this.contract!.call("is_valid_collection", [collectionId])
                    .then(isValid => ({ id: collectionId, isValid }))
                    .catch(error => {
                        console.warn(`Error checking collection ${collectionId}:`, error)
                        return { id: collectionId, isValid: false }
                    })
            })

            const collectionResults = await Promise.all(collectionCheckPromises)
            const collectionIds = collectionResults
                .filter(result => result.isValid)
                .map(result => result.id)

            if (collectionIds.length === 0) {
                return {
                    collections: [],
                    total: 0,
                    page,
                    limit,
                    hasMore: false
                }
            }

            const collectionPromises = collectionIds.map(async (collectionId) => {
                try {
                    const collection = await this.getCollection(collectionId.toString())
                    if (collection && this.matchesFilters(collection, filters)) {
                        return collection
                    }
                    return null
                } catch (error) {
                    console.error(`Error fetching collection ${collectionId}:`, error)
                    return null
                }
            })

            const collectionFetchResults = await Promise.all(collectionPromises)
            const collections = collectionFetchResults.filter((collection): collection is Collection => collection !== null)

            const sortedCollections = this.sortCollections(collections, filters.sortBy)

            const startIndex = (page - 1) * limit
            const endIndex = startIndex + limit
            const paginatedCollections = sortedCollections.slice(startIndex, endIndex)

            return {
                collections: paginatedCollections,
                total: sortedCollections.length,
                page,
                limit,
                hasMore: endIndex < sortedCollections.length
            }
        } catch (error) {
            console.error("Error in getCollections:", error)
            return {
                collections: [],
                total: 0,
                page,
                limit,
                hasMore: false
            }
        }
    }

    /**
     * Get collections owned by a specific user
     */
    public async getUserCollections(userAddress: string): Promise<Collection[]> {
        try {
            if (!this.contractAvailable || !this.contract) {
                return []
            }

            const validAddress = starknetService.validateAddress(userAddress)
            if (!validAddress) {
                throw new Error("Invalid user address")
            }

            const collectionIds = await this.contract.call("list_user_collections", [validAddress])
            const collections: Collection[] = []

            if (Array.isArray(collectionIds) && collectionIds.length > 0) {
                for (const id of collectionIds) {
                    try {
                        const collection = await this.getCollection(id.toString())
                        if (collection) {
                            collections.push(collection)
                        }
                    } catch (error) {
                        console.error(`Error fetching user collection ${id}:`, error)
                    }
                }
            }

            return collections
        } catch (error) {
            console.error("Error fetching user collections:", error)
            return []
        }
    }

    /**
     * Get a specific collection by ID
     */
    public async getCollection(collectionId: string): Promise<Collection | null> {
        try {
            if (!this.contractAvailable || !this.contract) {
                return null
            }

            const id = Number(collectionId)
            
            const isValid = await this.contract.call("is_valid_collection", [id])
            if (!isValid) {
                console.log(`Collection ${id} is not valid`)
                return null
            }

            const collectionResult = await this.contract.call("get_collection", [id]) as ContractCollection
            return await this.parseCollectionData(collectionResult, id)
        } catch (error) {
            console.error(`Error fetching collection ${collectionId}:`, error)
            return null
        }
    }

    /**
     * Get assets in a specific collection
     * Note: Since there's no direct list_collection_tokens function,
     * we need to iterate through potential token IDs or track them through events
     */
    public async getCollectionAssets(collectionId: string): Promise<AssetIP[]> {
        try {
            if (!this.contractAvailable || !this.contract) {
                return []
            }

            const assets: AssetIP[] = []
            const id = Number(collectionId)

            // Get collection stats to determine the range of token IDs
            let totalMinted = 0
            try {
                const stats = await this.contract.call("get_collection_stats", [id]) as CollectionStats
                totalMinted = Number(stats.total_minted)
            } catch (statsError) {
                console.warn(`Could not fetch stats for collection ${id}, using fallback range:`, statsError)
                totalMinted = 100
            }

            const maxTokensToCheck = Math.max(totalMinted, 100)
            
            const tokenCheckPromises = Array.from({ length: maxTokensToCheck }, (_, index) => {
                const tokenIndex = index + 1
                const tokenIdentifier = `${id}:${tokenIndex}`
                
                return this.contract!.call("is_valid_token", [tokenIdentifier])
                    .then(async (isValidToken) => {
                        if (!isValidToken) return null
                        
                        try {
                            const token = await this.contract!.call("get_token", [tokenIdentifier]) as ContractToken
                            if (Number(token.collection_id) === id) {
                                return await this.parseTokenToAsset(token, tokenIdentifier)
                            }
                        } catch (error) {
                            console.warn(`Error fetching token ${tokenIdentifier}:`, error)
                        }
                        return null
                    })
                    .catch(error => {
                        console.warn(`Error checking token ${tokenIdentifier}:`, error)
                        return null
                    })
            })

            // Execute all token checks in parallel
            const tokenResults = await Promise.all(tokenCheckPromises)
            
            // Filter out null results and add valid assets
            for (const asset of tokenResults) {
                if (asset) {
                    assets.push(asset)
                }
            }

            return assets
        } catch (error) {
            console.error(`Error fetching collection assets ${collectionId}:`, error)
            return []
        }
    }

    /**
     * Parse a contract token to AssetIP format
     */
    private async parseTokenToAsset(token: ContractToken, tokenIdentifier: string): Promise<AssetIP | null> {
        try {
            // Start with basic asset structure
            let asset: AssetIP = {
                id: tokenIdentifier,
                slug: `asset-${tokenIdentifier}`,
                title: `Asset ${tokenIdentifier}`,
                author: token.owner || "Unknown",
                description: `IP Asset with token identifier ${tokenIdentifier}`,
                type: "digital art", // Default fallback, will be updated from IPFS metadata
                template: "default",
                collection: token.collection_id?.toString() || "unknown",
                collectionSlug: `collection-${token.collection_id}`,
                tags: "",
                mediaUrl: "/placeholder.svg",
                externalUrl: "",
                licenseType: "Standard",
                licenseDetails: "Default license",
                ipVersion: "1.0",
                commercialUse: true,
                modifications: true,
                attribution: true,
                registrationDate: new Date().toISOString(),
                protectionStatus: "Active",
                protectionScope: "Global",
                protectionDuration: "Perpetual",
                creator: {
                    id: this.formatAddressAsHex(token.owner) || "unknown",
                    username: `user-${this.formatAddressAsHex(token.owner)}`,
                    name: `User ${this.formatAddressAsHex(token.owner)}`,
                    avatar: "/placeholder.svg",
                    verified: false,
                    wallet: this.formatAddressAsHex(token.owner) || "0x0"
                },
                timestamp: new Date().toISOString(),
                blockchain: "Starknet",
                contractAddress: MIP_COLLECTIONS_CONTRACT,
                tokenId: token.token_id?.toString() || tokenIdentifier,
                metadataUri: token.metadata_uri
            }

            // Try to fetch metadata from IPFS using metadata_uri
            if (token.metadata_uri) {
                console.log(`Fetching IPFS metadata for token ${tokenIdentifier} from:`, token.metadata_uri)
                try {
                    const metadata = await this.fetchIPFSMetadata(token.metadata_uri)
                    if (metadata) {
                        console.log(`Successfully fetched metadata for token ${tokenIdentifier}:`, metadata)
                        
                        // Update asset with IPFS metadata
                        asset.title = metadata.name || asset.title
                        asset.description = metadata.description || asset.description
                        asset.mediaUrl = this.processImageData(metadata.image)
                        asset.externalUrl = metadata.external_url || asset.externalUrl
                        
                        // Handle asset type and tags from attributes
                        if (metadata.attributes && Array.isArray(metadata.attributes)) {
                            const typeAttr = metadata.attributes.find(attr => attr.trait_type.toLowerCase() === 'type' || attr.trait_type.toLowerCase() === 'category')
                            if (typeAttr) {
                                asset.type = typeAttr.value.toLowerCase()
                            }
                            
                            const tagAttrs = metadata.attributes.filter(attr => attr.trait_type.toLowerCase() === 'tag')
                            if (tagAttrs.length > 0) {
                                asset.tags = tagAttrs.map(attr => attr.value).join(", ")
                            }
                            
                            // Handle IP-specific data from attributes
                            const licenseTypeAttr = metadata.attributes.find(attr => attr.trait_type.toLowerCase() === 'license_type')
                            if (licenseTypeAttr) {
                                asset.licenseType = licenseTypeAttr.value
                            }
                            
                            const licenseDetailsAttr = metadata.attributes.find(attr => attr.trait_type.toLowerCase() === 'license_details')
                            if (licenseDetailsAttr) {
                                asset.licenseDetails = licenseDetailsAttr.value
                            }
                            
                            const ipVersionAttr = metadata.attributes.find(attr => attr.trait_type.toLowerCase() === 'ip_version')
                            if (ipVersionAttr) {
                                asset.ipVersion = ipVersionAttr.value
                            }
                            
                            const commercialUseAttr = metadata.attributes.find(attr => attr.trait_type.toLowerCase() === 'commercial_use')
                            if (commercialUseAttr) {
                                asset.commercialUse = commercialUseAttr.value.toLowerCase() === 'true'
                            }
                            
                            const modificationsAttr = metadata.attributes.find(attr => attr.trait_type.toLowerCase() === 'modifications')
                            if (modificationsAttr) {
                                asset.modifications = modificationsAttr.value.toLowerCase() === 'true'
                            }
                            
                            const attributionAttr = metadata.attributes.find(attr => attr.trait_type.toLowerCase() === 'attribution')
                            if (attributionAttr) {
                                asset.attribution = attributionAttr.value.toLowerCase() === 'true'
                            }
                        }
                        
                        // Update slug to be more descriptive
                        if (metadata.name) {
                            asset.slug = metadata.name.toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/^-+|-+$/g, '') || asset.slug
                        }
                    } else {
                        console.warn(`Failed to fetch IPFS metadata for token ${tokenIdentifier}, using contract data`)
                    }
                } catch (ipfsError) {
                    console.warn(`IPFS fetch failed for token ${tokenIdentifier}:`, ipfsError)
                    // Continue with contract data as fallback
                }
            }

            return asset
        } catch (error) {
            console.error("Error parsing token to asset:", error)
            return null
        }
    }

    /**
     * Get user tokens across all collections
     * Note: Since there's no direct list_user_tokens function,
     * we need to iterate through collections and use list_user_tokens_per_collection
     */
    public async getUserTokens(userAddress: string): Promise<AssetIP[]> {
        try {
            if (!this.contractAvailable || !this.contract) {
                return []
            }

            const validAddress = starknetService.validateAddress(userAddress)
            if (!validAddress) {
                throw new Error("Invalid user address")
            }

            const assets: AssetIP[] = []

            const userCollections = await this.getUserCollections(userAddress)
            
            for (const collection of userCollections) {
                try {
                    const collectionId = Number(collection.id)
                    const tokenIds = await this.contract.call("list_user_tokens_per_collection", [collectionId, validAddress])
                    
                    if (Array.isArray(tokenIds) && tokenIds.length > 0) {
                        for (const tokenId of tokenIds) {
                            try {
                                const tokenIdentifier = `${collectionId}:${tokenId}`
                                const token = await this.contract.call("get_token", [tokenIdentifier]) as ContractToken
                                const asset = await this.parseTokenToAsset(token, tokenIdentifier)
                                if (asset) {
                                    assets.push(asset)
                                }
                            } catch (error) {
                                console.error(`Error processing user token ${tokenId} in collection ${collectionId}:`, error)
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching tokens for collection ${collection.id}:`, error)
                }
            }

            return assets
        } catch (error) {
            console.error("Error fetching user tokens:", error)
            return []
        }
    }

    /**
     * Check if user owns a collection
     */
    public async isCollectionOwner(collectionId: string, userAddress: string): Promise<boolean> {
        try {
            if (!this.contractAvailable || !this.contract) {
                return false
            }

            const validAddress = starknetService.validateAddress(userAddress)
            if (!validAddress) {
                return false
            }

            const id = Number(collectionId)
            const isOwner = await this.contract.call("is_collection_owner", [id, validAddress])
            return Boolean(isOwner)
        } catch (error) {
            console.error("Error checking collection ownership:", error)
            return false
        }
    }

    /**
     * Get token balance for a user in a specific collection
     * Note: There's no direct balance_of function, so we count user tokens per collection
     */
    public async getUserTokenBalance(userAddress: string, collectionId?: string): Promise<number> {
        try {
            if (!this.contractAvailable || !this.contract) {
                return 0
            }

            const validAddress = starknetService.validateAddress(userAddress)
            if (!validAddress) {
                return 0
            }

            if (collectionId) {
                // Get balance for specific collection
                const id = Number(collectionId)
                const tokenIds = await this.contract.call("list_user_tokens_per_collection", [id, validAddress])
                return Array.isArray(tokenIds) ? tokenIds.length : 0
            } else {
                // Get total balance across all collections
                const userTokens = await this.getUserTokens(userAddress)
                return userTokens.length
            }
        } catch (error) {
            console.error("Error getting user token balance:", error)
            return 0
        }
    }

    /**
     * Fetch metadata from IPFS using the hash
     */
    private async fetchIPFSMetadata(ipfsHash: string): Promise<CollectionMetadata | null> {
        try {
            if (!ipfsHash) {
                console.warn("No IPFS hash provided")
                return null
            }

            // Clean the IPFS hash (remove ipfs:// prefix if present)
            const cleanHash = ipfsHash.replace(/^ipfs:\/\//, '')
            // Use NEXT_PUBLIC_PINATA_GATEWAY if set, else try others
            const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY
                ? process.env.NEXT_PUBLIC_PINATA_GATEWAY.replace(/\/+$/, '') // remove trailing slash
                : null

            const gateways = pinataGateway
                ? [
                    `${pinataGateway}/ipfs/${cleanHash}`,
                ]
                : [
                    `https://ipfs.io/ipfs/${cleanHash}`,
                    `https://gateway.pinata.cloud/ipfs/${cleanHash}`,
                    `https://cloudflare-ipfs.com/ipfs/${cleanHash}`,
                    `https://dweb.link/ipfs/${cleanHash}`
                ]

            // Create promises for all gateways in parallel
            const gatewayPromises = gateways.map(async (gateway) => {
                try {
                    console.log(`Attempting to fetch IPFS metadata from: ${gateway}`)
                    
                    // Create a timeout controller for better browser compatibility
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout per gateway
                    
                    const response = await fetch(gateway, {
                        headers: {
                            'Accept': 'application/json',
                        },
                        signal: controller.signal
                    })
                    
                    clearTimeout(timeoutId)

                    if (!response.ok) {
                        throw new Error(`Gateway returned ${response.status}`)
                    }

                    const metadata = await response.json()
                    return { gateway, metadata: metadata as CollectionMetadata, success: true }
                } catch (gatewayError) {
                    const errorType = gatewayError instanceof Error && gatewayError.name === 'AbortError' ? 'timeout' : 'error'
                    console.warn(`${errorType} fetching from gateway ${gateway}:`, gatewayError)
                    return { gateway, metadata: null, success: false, error: gatewayError }
                }
            })

            // Use Promise.allSettled to wait for all attempts, but return first successful result
            try {
                const results = await Promise.allSettled(gatewayPromises)
                
                for (const result of results) {
                    if (result.status === 'fulfilled' && result.value.success && result.value.metadata) {
                        console.log(`Successfully fetched IPFS metadata from: ${result.value.gateway}`)
                        return result.value.metadata
                    }
                }
            } catch (error) {
                console.error("Error in parallel IPFS fetching:", error)
            }

            console.error("All IPFS gateways failed for hash:", cleanHash)
            return null
        } catch (error) {
            console.error("Error fetching IPFS metadata:", error)
            return null
        }
    }

    /**
     * Format address as hex with 0x prefix
     */
    private formatAddressAsHex(address: any): string {
        if (!address) return "0x0"
        
        // Convert to string first
        let addressStr = address.toString()
        
        if (addressStr.startsWith('0x')) {
            return addressStr
        }
        
        if (/^\d+$/.test(addressStr)) {
            return `0x${BigInt(addressStr).toString(16)}`
        }
        
        if (/^[a-fA-F0-9]+$/.test(addressStr)) {
            return `0x${addressStr}`
        }
        
        return addressStr.startsWith('0x') ? addressStr : `0x${addressStr}`
    }

    /**
     * Convert base64 image to data URL or handle regular URLs
     */
    private processImageData(imageData: string): string {
        try {
            if (!imageData) {
                return "/placeholder.svg"
            }

            // If it's already a data URL, return as is
            if (imageData.startsWith('data:')) {
                return imageData
            }

            // If it's a regular URL (http/https), return as is
            if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
                return imageData
            }

            if (imageData.startsWith('ipfs://')) {
                const hash = imageData.replace('ipfs://', '')
                return `https://ipfs.io/ipfs/${hash}`
            }

            // If it looks like base64 data (no data: prefix), add the prefix
            if (imageData.match(/^[A-Za-z0-9+/=]+$/)) {
                // Try to detect image format (assume PNG if not specified)
                const mimeType = imageData.charAt(0) === '/' ? 'image/jpeg' : 'image/png'
                return `data:${mimeType};base64,${imageData}`
            }

            // Fallback to placeholder
            console.warn("Unknown image format, using placeholder:", imageData.substring(0, 100))
            return "/placeholder.svg"
        } catch (error) {
            console.error("Error processing image data:", error)
            return "/placeholder.svg"
        }
    }

    private async parseCollectionData(data: ContractCollection, index: number): Promise<Collection | null> {
        try {           
            // Start with basic collection structure using contract data
            // Based on the ABI, Collection struct has: name, symbol, base_uri, owner, is_active
            let collection: Collection = {
                id: index.toString(),
                slug: `collection-${index}`,
                name: data.name || `Collection ${index}`,
                description: data.symbol || "",
                coverImage: "/placeholder.svg",
                bannerImage: "",
                creator: {
                    id: this.formatAddressAsHex(data.owner) || "unknown",
                    username: `user-${this.formatAddressAsHex(data.owner)}`,
                    name: `User ${this.formatAddressAsHex(data.owner)}`,
                    avatar: "/placeholder.svg",
                    verified: false,
                    wallet: this.formatAddressAsHex(data.owner) || "0x0"
                },
                assets: 0, // Will be populated by getCollectionStats
                views: undefined, // No views tracking in current contract
                likes: undefined, // No likes tracking in current contract
                floorPrice: undefined,
                totalVolume: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                category: "digital art", // Default fallback, will be updated from IPFS metadata
                tags: "",
                isPublic: Boolean(data.is_active),
                isFeatured: false,
                blockchain: "Starknet",
                contractAddress: MIP_COLLECTIONS_CONTRACT
            }

            // Try to fetch metadata from IPFS using base_uri
            if (data.base_uri) {
                console.log(`Fetching IPFS metadata for collection ${index} from:`, data.base_uri)
                try {
                    const metadata = await this.fetchIPFSMetadata(data.base_uri)
                    if (metadata) {
                        collection.name = metadata.name || collection.name
                        collection.description = metadata.description || collection.description
                        
                        // Handle cover image
                        if (metadata.image) {
                            collection.coverImage = this.processImageData(metadata.image)
                        }
                        
                        // Handle banner image if available
                        if (metadata.banner_image) {
                            collection.bannerImage = this.processImageData(metadata.banner_image)
                        }
                        
                        // Handle category - use direct field
                        if (metadata.category) {
                            collection.category = metadata.category.toLowerCase()
                        }
                        
                        // Handle visibility/public status
                        if (metadata.visibility) {
                            collection.isPublic = metadata.visibility.toLowerCase() === 'public'
                        }
                        
                        // Handle tags array
                        if (metadata.tags && Array.isArray(metadata.tags)) {
                            collection.tags = metadata.tags.join(", ")
                        }
                        
                        // Handle created_at timestamp
                        if (metadata.created_at) {
                            try {
                                const parsedDate = new Date(metadata.created_at)
                                if (!isNaN(parsedDate.getTime())) {
                                    collection.createdAt = parsedDate.toISOString()
                                    collection.updatedAt = parsedDate.toISOString()
                                } else {
                                    console.warn(`Invalid date format in IPFS metadata: ${metadata.created_at}`)
                                }
                            } catch (dateError) {
                                console.warn(`Error parsing date from IPFS metadata: ${metadata.created_at}`, dateError)
                            }
                        }
                        
                        // Update slug to be more descriptive, but fallback to ID-based slug
                        if (metadata.name) {
                            const nameSlug = metadata.name.toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/^-+|-+$/g, '')
                            collection.slug = nameSlug || `collection-${index}`
                        }
                    } else {
                        console.warn(`Failed to fetch IPFS metadata for collection ${index}, using contract data`)
                    }
                } catch (ipfsError) {
                    console.warn(`IPFS fetch failed for collection ${index}:`, ipfsError)
                    // Continue with contract data as fallback
                }
            } else {
                console.warn(`No base_uri found for collection ${index}`)
                // Ensure we have a valid slug even without IPFS metadata
                collection.slug = `collection-${index}`
            }

            // Try to get collection stats if available
            try {
                const stats = await this.contract!.call("get_collection_stats", [index]) as CollectionStats
                if (stats) {
                    collection.assets = Number(stats.total_minted || 0)
                }
            } catch (statsError) {
                console.warn(`Could not fetch stats for collection ${index}:`, statsError)
            }

            return collection
        } catch (error) {
            console.error("Error parsing collection data:", error)
            return null
        }
    }

    /**
     * Check if collection matches filters
     */
    private matchesFilters(collection: Collection, filters: CollectionFilters): boolean {
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase()
            const matchesSearch = 
                collection.name.toLowerCase().includes(searchTerm) ||
                collection.description.toLowerCase().includes(searchTerm) ||
                collection.creator.name.toLowerCase().includes(searchTerm)
            if (!matchesSearch) return false
        }

        if (filters.category && filters.category !== "all") {
            if (collection.category.toLowerCase() !== filters.category.toLowerCase()) {
                return false
            }
        }

        if (filters.creator) {
            if (collection.creator.id !== filters.creator) {
                return false
            }
        }

        if (filters.featured !== undefined) {
            if (collection.isFeatured !== filters.featured) {
                return false
            }
        }

        if (filters.isPublic !== undefined) {
            if (collection.isPublic !== filters.isPublic) {
                return false
            }
        }

        return true
    }

    /**
     * Sort collections by specified criteria
     */
    private sortCollections(collections: Collection[], sortBy?: string): Collection[] {
        if (!sortBy) return collections

        return [...collections].sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name)
                case "assets":
                    return b.assets - a.assets
                case "views":
                    // TODO: Implement view count sorting when available
                    return 0
                case "likes":
                    // TODO: Implement like count sorting when available
                    return 0
                case "recent":
                default:
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            }
        })
    }



    /**
     * Check if the contract is available and initialized
     */
    public isContractAvailable(): boolean {
        return this.contractAvailable && this.contract !== null
    }

    /**
     * Get contract status for debugging
     */
    public getContractStatus(): { available: boolean; address?: string; error?: string } {
        return {
            available: this.contractAvailable,
            address: MIP_COLLECTIONS_CONTRACT,
            error: !this.contractAvailable ? "Contract not initialized or address not configured" : undefined
        }
    }

    /**
     * Get comprehensive collection statistics using available ABI functions
     * Note: Uses collection stats and user token enumeration since list_collection_tokens doesn't exist
     */
    public async getCollectionGroupingStats(collectionId: string): Promise<{
        collectionId: string
        totalTokens: number
        uniqueOwners: number
        tokensByOwner: Record<string, number>
        groupingValid: boolean
        lastValidation: string
    } | null> {
        try {
            if (!this.contractAvailable || !this.contract) {
                return null
            }

            const id = Number(collectionId)
            console.log("Getting comprehensive stats for collection:", id)

            // Get basic collection stats first
            const stats = await this.contract.call("get_collection_stats", [id]) as CollectionStats
            const totalMinted = Number(stats.total_minted)
            
            if (totalMinted === 0) {
                return {
                    collectionId: collectionId,
                    totalTokens: 0,
                    uniqueOwners: 0,
                    tokensByOwner: {},
                    groupingValid: true,
                    lastValidation: new Date().toISOString()
                }
            }

            const tokensByOwner: Record<string, number> = {}
            let actualTokenCount = 0
            let groupingValid = true
            
            const maxCheck = Math.min(totalMinted, 200)
            for (let tokenIndex = 1; tokenIndex <= maxCheck; tokenIndex++) {
                try {
                    const tokenIdentifier = `${id}:${tokenIndex}`
                    const isValidToken = await this.contract.call("is_valid_token", [tokenIdentifier])
                    
                    if (isValidToken) {
                        const token = await this.contract.call("get_token", [tokenIdentifier]) as ContractToken
                        
                        if (Number(token.collection_id) !== id) {
                            console.warn(`Grouping error: Token ${tokenIdentifier} reports collection ${token.collection_id} but found in collection ${id}`)
                            groupingValid = false
                        }
                        
                        const ownerAddress = this.formatAddressAsHex(token.owner)
                        tokensByOwner[ownerAddress] = (tokensByOwner[ownerAddress] || 0) + 1
                        actualTokenCount++
                    }
                } catch (error) {
                    console.warn(`Error checking token ${id}:${tokenIndex}:`, error)
                    groupingValid = false
                }
            }

            return {
                collectionId: collectionId,
                totalTokens: actualTokenCount,
                uniqueOwners: Object.keys(tokensByOwner).length,
                tokensByOwner,
                groupingValid,
                lastValidation: new Date().toISOString()
            }
        } catch (error) {
            console.error("Error getting collection grouping stats:", error)
            return null
        }
    }
}

export const collectionsService = new CollectionsService() 