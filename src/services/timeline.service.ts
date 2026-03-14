import type { AssetIP } from "@/src/types/asset";
import { IPFSService } from "./ipfs.service";
import { getApiBaseUrl } from "@/src/lib/config";
import { isAssetReported } from "@/src/lib/reported-content";

export interface BackendAsset {
  id: string;
  collectionId: string;
  owner: string;
  tokenUri: string | null;
  mintedAtBlock: number;
  indexerSource: string;
  collection: {
    id: string;
    creator: string;
    metadataUri: string | null;
    createdAtBlock: number;
    indexerSource: string;
  } | null;
}

export interface TimelineFilters {
  indexerSource?: "MEDIALANO-DAPP" | "MEDIALANO-MIPP";
  collectionId?: string;
  search?: string;
  assetTypes?: string[];
  licenses?: string[];
  verifiedOnly?: boolean;
  sortBy?: "mintedAtBlock" | "id";
  sortOrder?: "asc" | "desc";
  tags?: string[];
  dateRange?: string;
}

export interface TimelineResponse {
  assets: AssetIP[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface IPFSMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  creator?: string;
  author?: string;
  license?: string;
  licenseType?: string;
  license_details?: string;
  commercial_use?: boolean;
  commercialUse?: boolean;
  modifications?: boolean;
  attribution?: boolean;
  type?: string;
  tags?: string | string[];
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
  ip_version?: string;
  ipVersion?: string;
  protection_status?: string;
  protection_scope?: string;
  protection_duration?: string;
  properties?: {
    creator?: string;
    collection?: string;
    license_details?: string;
    registration_date?: string;
    protection_duration?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

class TimelineService {
  private baseUrl: string;
  private ipfsService: IPFSService;
  private metadataCache = new Map<string, IPFSMetadata>();
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = getApiBaseUrl();
    this.ipfsService = new IPFSService();
  }

  /**
   * Fetch assets from backend API for the public timeline
   */
  async getTimelineAssets(
    requestedLimit = 20,
    requestedOffset = 0,
    filters: TimelineFilters = {},
    signal?: AbortSignal
  ): Promise<TimelineResponse> {
    try {
      const params = new URLSearchParams({
        limit: requestedLimit.toString(),
        offset: requestedOffset.toString(),
        sortBy: filters.sortBy || "mintedAtBlock",
        sortOrder: filters.sortOrder || "desc",
      });

      if (filters.indexerSource) {
        params.append("indexerSource", filters.indexerSource);
      }
      if (filters.collectionId) {
        params.append("collectionId", filters.collectionId);
      }

      const response = await fetch(`${this.baseUrl}/api/assets?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const backendData = await response.json();
      const backendAssets = backendData.data as BackendAsset[];
      const total = parseInt(backendData.pagination?.total?.toString() || backendAssets.length.toString());

      // Robust pagination fallback: if backend returns too many items, slice locally.
      // This happens if the backend ignores limit/offset parameters.
      let sliceToProcess = backendAssets;
      if (backendAssets.length > requestedLimit) {
        if (backendAssets.length >= total && requestedOffset > 0) {
          // Backend likely ignored both limit and offset
          sliceToProcess = backendAssets.slice(requestedOffset, requestedOffset + requestedLimit);
        } else {
          // Backend likely ignored limit but maybe respected offset
          sliceToProcess = backendAssets.slice(0, requestedLimit);
        }
      }

      // Transform ONLY the sliced batch to save performance (avoids excessive IPFS fetches)
      const assets = await Promise.all(
        sliceToProcess.map((asset) => this.transformBackendAsset(asset))
      );

      // Apply client-side filters
      const filteredAssets = this.applyClientFilters(assets, filters);

      const hasMore = (requestedOffset + sliceToProcess.length) < total;

      return {
        assets: filteredAssets,
        pagination: {
          total,
          limit: requestedLimit,
          offset: requestedOffset,
          hasMore,
        },
      };
    } catch (error) {
      console.error("Timeline service error:", error);

      // Return empty result if backend is unavailable due to CORS/500 errors
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        return {
          assets: [],
          pagination: {
            total: 0,
            limit: requestedLimit,
            offset: requestedOffset,
            hasMore: false,
          },
        };
      }

      throw new Error("Failed to fetch timeline assets");
    }
  }

  /**
   * Transform backend asset to AssetIP format with IPFS metadata
   */
  private async transformBackendAsset(backendAsset: BackendAsset): Promise<AssetIP> {
    // Fetch IPFS metadata if available
    let metadata: IPFSMetadata = {};
    if (backendAsset.tokenUri) {
      try {
        metadata = await this.fetchMetadataWithCache(backendAsset.tokenUri);
      } catch (error) {
        console.warn(`Failed to fetch metadata for ${backendAsset.id}:`, error);
      }
    }

    // Parse token ID from backend ID (the ID is just the token number)
    const tokenId = backendAsset.id;
    const contractAddress = this.getContractAddressFromSource(backendAsset.indexerSource);

    // Extract values from attributes array
    const attributesMap = this.parseAttributes(metadata.attributes || []);

    // Create a comprehensive AssetIP object
    const asset: AssetIP = {
      id: backendAsset.id,
      slug: `${contractAddress}:${tokenId}`,
      title: metadata.name || `Token #${tokenId}`,
      author: metadata.properties?.creator || metadata.author || metadata.creator || this.truncateAddress(backendAsset.owner),
      description: metadata.description || "IP Asset from Mediolano Protocol",
      type: this.normalizeAssetType(attributesMap.Type || metadata.type || "art"),
      template: "standard",
      collection: metadata.properties?.collection || backendAsset.collection?.id || "Unknown",
      collectionSlug: backendAsset.collection?.id?.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      tags: this.normalizeTags(attributesMap.Tags || metadata.tags),
      mediaUrl: this.getDisplayUrl(metadata.image || backendAsset.tokenUri || undefined),
      externalUrl: metadata.external_url || "",
      licenseType: this.normalizeLicenseType(attributesMap.License || metadata.license || metadata.licenseType),
      licenseDetails: metadata.properties?.license_details || metadata.license_details || "",
      ipVersion: attributesMap["IP Version"] || metadata.ip_version || metadata.ipVersion || "1.0",
      commercialUse: this.parseBoolean(attributesMap["Commercial Use"] ?? metadata.commercial_use ?? metadata.commercialUse),
      modifications: this.parseBoolean(attributesMap.Modifications ?? metadata.modifications),
      attribution: this.parseBoolean(attributesMap.Attribution ?? metadata.attribution, true),
      registrationDate: metadata.properties?.registration_date || this.formatDateFromBlock(backendAsset.mintedAtBlock) || this.formatDate(metadata.created_at || metadata.createdAt || metadata.timestamp),
      protectionStatus: attributesMap["Protection Status"] || metadata.protection_status || "Protected",
      protectionScope: attributesMap["Protection Scope"] || metadata.protection_scope || "Global",
      protectionDuration: metadata.properties?.protection_duration || metadata.protection_duration || "70 years",
      creator: {
        id: backendAsset.collection?.creator || backendAsset.owner,
        username: this.addressToUsername(backendAsset.collection?.creator || backendAsset.owner || ""),
        name: metadata.properties?.creator || metadata.creator || metadata.author || this.truncateAddress(backendAsset.collection?.creator || backendAsset.owner),
        avatar: "/placeholder.svg",
        verified: false, // TODO: Add verification logic
        wallet: backendAsset.collection?.creator || backendAsset.owner,
        bio: undefined,
        followers: undefined,
        following: undefined,
        assets: undefined,
      },
      timestamp: this.getRelativeTimeWithFallback(backendAsset.mintedAtBlock, metadata.properties?.registration_date),
      attributes: metadata.attributes?.map(attr => ({
        trait_type: attr.trait_type,
        value: String(attr.value)
      })) || [],
      blockchain: "Starknet",
      contractAddress,
      tokenId,
      metadataUri: backendAsset.tokenUri || undefined,
      fileSize: undefined,
      fileDimensions: undefined,
      fileFormat: this.getFileFormat(metadata.image),
    };

    return asset;
  }

  /**
   * Fetch IPFS metadata with caching
   */
  private async fetchMetadataWithCache(uri: string): Promise<IPFSMetadata> {
    const cacheKey = uri;
    const cached = this.metadataCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Handle different URI formats
      // Handle different URI formats and clean up double protocols
      let fetchUrl = uri;

      if (uri.includes("https://ipfs.io/ipfs/")) {
        // Keep getting the last part of the has if it is repeated
        const parts = uri.split("https://ipfs.io/ipfs/");
        const hash = parts[parts.length - 1];
        fetchUrl = `https://ipfs.io/ipfs/${hash}`;
      } else if (uri.startsWith("ipfs://")) {
        fetchUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      } else if (uri.startsWith("data:application/json")) {
        const jsonData = uri.split(",")[1];
        const metadata = JSON.parse(atob(jsonData));
        this.metadataCache.set(cacheKey, metadata);
        return metadata;
      }

      const response = await fetch(fetchUrl, {
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const metadata = await response.json();

      // Cache the metadata
      this.metadataCache.set(cacheKey, metadata);

      // Clean up old cache entries occasionally
      if (this.metadataCache.size > 500) {
        this.cleanupCache();
      }

      return metadata;
    } catch (error) {
      console.warn("IPFS metadata fetch failed:", error);
      return {};
    }
  }

  /**
   * Apply client-side filters 
   */
  applyClientFiltersPublic(assets: AssetIP[], filters: TimelineFilters): AssetIP[] {
    return this.applyClientFilters(assets, filters);
  }

  /**
   * Apply client-side filters 
   */
  private applyClientFilters(assets: AssetIP[], filters: TimelineFilters): AssetIP[] {
    let filtered = [...assets];

    // Filter out reported content first
    filtered = filtered.filter(asset => !isAssetReported(asset.slug));

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((asset) =>
        asset.title.toLowerCase().includes(searchTerm) ||
        asset.description.toLowerCase().includes(searchTerm) ||
        asset.author.toLowerCase().includes(searchTerm) ||
        asset.tags.toLowerCase().includes(searchTerm) ||
        asset.type.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by asset types
    if (filters.assetTypes && filters.assetTypes.length > 0) {
      filtered = filtered.filter((asset) =>
        filters.assetTypes!.some((type) =>
          asset.type.toLowerCase().includes(type.toLowerCase())
        )
      );
    }

    // Filter by license types
    if (filters.licenses && filters.licenses.length > 0) {
      filtered = filtered.filter((asset) =>
        filters.licenses!.some((license) => {
          const assetLicense = asset.licenseType.toLowerCase();
          const filterLicense = license.toLowerCase();

          // Handle specific license mappings
          if (filterLicense === "all-rights-reserved") {
            return assetLicense.includes("all-rights") || assetLicense.includes("all rights");
          }
          if (filterLicense.startsWith("cc-")) {
            return assetLicense.includes("creative") || assetLicense.includes("cc");
          }
          if (filterLicense === "mit" || filterLicense === "apache" || filterLicense === "gpl") {
            return assetLicense.includes(filterLicense) || assetLicense.includes("open-source");
          }

          return assetLicense.includes(filterLicense);
        })
      );
    }

    // Filter by verified creators
    if (filters.verifiedOnly) {
      filtered = filtered.filter((asset) => asset.creator.verified);
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((asset) => {
        const assetTags = asset.tags.toLowerCase();
        return filters.tags!.some((tag) =>
          assetTags.includes(tag.toLowerCase())
        );
      });
    }

    // Filter by date range
    if (filters.dateRange && filters.dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.dateRange) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((asset) => {
        try {
          const assetDate = new Date(asset.registrationDate);
          return assetDate >= cutoffDate;
        } catch {
          return true;
        }
      });
    }

    return filtered;
  }

  /**
   * Get contract address from indexer source
   */
  private getContractAddressFromSource(source: string): string {
    // These should match your contract addresses
    switch (source) {
      case "MEDIALANO-DAPP":
        return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MIP || "0x02611360a62f6693231a38f8941b8f90d6d408a06a598a1f24532bb2fc09d314";
      case "MEDIALANO-MIPP":
        return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MIPP || "0x02611360a62f6693231a38f8941b8f90d6d408a06a598a1f24532bb2fc09d314";
      default:
        return "0x02611360a62f6693231a38f8941b8f90d6d408a06a598a1f24532bb2fc09d314";
    }
  }

  /**
   * Parse attributes array into a key-value map
   */
  private parseAttributes(attributes: Array<{ trait_type: string; value: string | number }>): Record<string, string> {
    const attributesMap: Record<string, string> = {};

    if (!attributes || !Array.isArray(attributes)) {
      return attributesMap;
    }

    attributes.forEach((attr) => {
      if (attr.trait_type && attr.value !== undefined) {
        attributesMap[attr.trait_type] = String(attr.value);
      }
    });

    return attributesMap;
  }

  /**
   * Utility functions
   */
  private normalizeAssetType(type: string): string {
    const normalized = type.toLowerCase().trim();
    const typeMap: Record<string, string> = {
      "image": "Image",
      "video": "Video",
      "audio": "Music",
      "music": "Music",
      "document": "Document",
      "text": "Document",
      "art": "Art",
      "digital art": "Art",
      "nft": "Art",
    };
    return typeMap[normalized] || "Art";
  }

  private normalizeLicenseType(license?: string): string {
    if (!license) return "custom";
    const normalized = license.toLowerCase();
    if (normalized.includes("cc") || normalized.includes("creative")) return "creative-commons";
    if (normalized.includes("mit") || normalized.includes("open")) return "open-source";
    if (normalized.includes("all rights reserved") || normalized.includes("all rights")) return "all-rights";
    return "custom";
  }

  private normalizeTags(tags?: string | string[]): string {
    if (!tags) return "";
    if (Array.isArray(tags)) return tags.join(", ");
    return String(tags);
  }

  private parseBoolean(value: any, defaultValue = false): boolean {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    return Boolean(value);
  }

  private getDisplayUrl(url?: string): string {
    if (!url) return "/placeholder.svg";

    // Fix duplicate IPFS gateway URLs
    // Fix duplicate IPFS gateway URLs
    if (url.includes("https://ipfs.io/ipfs/")) {
      const parts = url.split("https://ipfs.io/ipfs/");
      const hash = parts[parts.length - 1];
      return `https://ipfs.io/ipfs/${hash}`;
    }
    if (url.startsWith("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    return url;
  }

  private formatDate(dateStr?: string): string {
    if (!dateStr) return new Date().toISOString().split("T")[0];
    try {
      return new Date(dateStr).toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }

  private formatDateFromBlock(blockNumber: number): string {
    // More accurate Starknet mainnet parameters
    const STARKNET_GENESIS_TIMESTAMP = 1669746000; // Nov 29, 2022 - Starknet mainnet launch
    const AVERAGE_BLOCK_TIME = 3.5; // More accurate: ~3.5 seconds per block

    const estimatedTimestamp = STARKNET_GENESIS_TIMESTAMP + (blockNumber * AVERAGE_BLOCK_TIME);
    const date = new Date(estimatedTimestamp * 1000);

    return date.toISOString().split("T")[0];
  }

  private getRelativeTime(blockNumber: number): string {
    // Updated Starknet mainnet parameters for accurate time calculation
    const STARKNET_GENESIS_TIMESTAMP = 1669746000; // Nov 29, 2022 - Starknet mainnet launch
    const AVERAGE_BLOCK_TIME = 3.5; // More accurate: ~3.5 seconds per block

    const estimatedTimestamp = STARKNET_GENESIS_TIMESTAMP + (blockNumber * AVERAGE_BLOCK_TIME);
    const now = Date.now() / 1000;
    const secondsAgo = now - estimatedTimestamp;

    // Add bounds checking for unrealistic values
    if (secondsAgo < 0) {
      return "Recently";
    }

    if (secondsAgo > 63072000) { // More than 2 years
      return "Long ago";
    }

    const minutesAgo = Math.floor(secondsAgo / 60);
    const hoursAgo = Math.floor(minutesAgo / 60);
    const daysAgo = Math.floor(hoursAgo / 24);
    const monthsAgo = Math.floor(daysAgo / 30);
    const yearsAgo = Math.floor(daysAgo / 365);

    if (yearsAgo > 0) return `${yearsAgo} year${yearsAgo > 1 ? "s" : ""} ago`;
    if (monthsAgo > 0) return `${monthsAgo} month${monthsAgo > 1 ? "s" : ""} ago`;
    if (daysAgo > 0) return `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`;
    if (hoursAgo > 0) return `${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`;
    if (minutesAgo > 0) return `${minutesAgo} minute${minutesAgo > 1 ? "s" : ""} ago`;
    return "Just now";
  }

  private getRelativeTimeWithFallback(blockNumber: number, registrationDate?: string): string {
    // Try block-based calculation first
    const blockTime = this.getRelativeTime(blockNumber);

    if (blockTime === "Long ago" && registrationDate) {
      try {
        const regDate = new Date(registrationDate);
        const now = new Date();
        const diffMs = now.getTime() - regDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
        if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        return "Recently";
      } catch {
        // If parsing fails, return the block-based result
        return blockTime;
      }
    }

    return blockTime;
  }

  public truncateAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private addressToUsername(address: string): string {
    return this.truncateAddress(address).replace(/[^a-zA-Z0-9]/g, "");
  }

  private getFileFormat(imageUrl?: string): string | undefined {
    if (!imageUrl) return undefined;
    const extension = imageUrl.split(".").pop()?.toLowerCase();
    return extension ? extension.toUpperCase() : undefined;
  }

  private cleanupCache(): void {
    const entries = Array.from(this.metadataCache.entries());
    const toRemove = entries.slice(0, Math.floor(entries.length / 2));
    toRemove.forEach(([key]) => this.metadataCache.delete(key));
  }

  /**
   * Get recent activity/transfers for timeline updates
   */
  async getRecentActivity(limit = 10): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/transfers?limit=${limit}&sortBy=block&sortOrder=desc`
      );

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
      return [];
    }
  }

  /**
   * Get timeline statistics
   */
  async getTimelineStats(): Promise<any> {
    try {
      // Temporarily disable stats call
      return {
        totalAssets: 0,
        totalCreators: 0,
        totalCollections: 0
      };
    } catch (error) {
      console.error("Failed to fetch timeline stats:", error);
      return null;
    }
  }
}

// Export singleton instance
export const timelineService = new TimelineService();
export default timelineService;
