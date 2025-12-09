import type { IPortfolioReturnTypeObj, AssetIP } from "../types/asset";

/**
 * Transform blockchain NFT data into AssetIP format for the UI
 */
export function transformBlockchainAssetToUI(
  blockchainAsset: IPortfolioReturnTypeObj,
  creatorInfo: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    verified: boolean;
    wallet: string;
    bio?: string;
    followers?: number;
    following?: number;
    assets?: number;
  }
): AssetIP {
  const metadata = blockchainAsset.metadata || {};
  
  // Extract asset type from metadata or default to "art"
  const assetType = metadata.attributes?.find(attr => 
    attr.trait_type === "type" || 
    attr.trait_type === "category" ||
    attr.trait_type === "asset_type"
  )?.value?.toString() || "art";

  // Extract license type from metadata or default to "all-rights"
  const licenseType = metadata.attributes?.find(attr => 
    attr.trait_type === "license" || 
    attr.trait_type === "license_type"
  )?.value?.toString() || "all-rights";

  // Extract tags from metadata or default to empty
  const tags = metadata.attributes
    ?.filter(attr => 
      attr.trait_type === "tag" || 
      attr.trait_type === "tags" ||
      attr.trait_type === "keyword"
    )
    .map(attr => attr.value?.toString())
    .filter(Boolean)
    .join(", ") || "digital art, blockchain";

  const title = metadata.name || `Asset #${blockchainAsset.tokenId}`;
  const slug = `${blockchainAsset.contractAddress}-${blockchainAsset.tokenId}`;

  // Extract protection status from metadata
  const protectionStatus = metadata.attributes?.find(attr => 
    attr.trait_type === "protection_status" || 
    attr.trait_type === "status"
  )?.value?.toString() || "Protected";

  // Extract IP version from metadata
  const ipVersion = metadata.attributes?.find(attr => 
    attr.trait_type === "ip_version" || 
    attr.trait_type === "version"
  )?.value?.toString() || "1.0";

  // Extract commercial use permissions
  const commercialUse = metadata.attributes?.find(attr => 
    attr.trait_type === "commercial_use" || 
    attr.trait_type === "commercial"
  )?.value?.toString() === "true";

  // Extract modification permissions
  const modifications = metadata.attributes?.find(attr => 
    attr.trait_type === "modifications" || 
    attr.trait_type === "modify"
  )?.value?.toString() === "true";

  // Extract attribution requirements
  const attribution = metadata.attributes?.find(attr => 
    attr.trait_type === "attribution" || 
    attr.trait_type === "require_attribution"
  )?.value?.toString() === "true";

  // Generate registration date (use current date as fallback)
  const registrationDate = metadata.attributes?.find(attr => 
    attr.trait_type === "created_at" || 
    attr.trait_type === "registration_date"
  )?.value?.toString() || new Date().toISOString().split('T')[0];

  // Extract file information
  const fileFormat = metadata.attributes?.find(attr => 
    attr.trait_type === "file_format" || 
    attr.trait_type === "format"
  )?.value?.toString() || "image/png";

  const fileSize = metadata.attributes?.find(attr => 
    attr.trait_type === "file_size" || 
    attr.trait_type === "size"
  )?.value?.toString() || "Unknown";

  const fileDimensions = metadata.attributes?.find(attr => 
    attr.trait_type === "dimensions" || 
    attr.trait_type === "resolution"
  )?.value?.toString() || "Unknown";

  return {
    id: blockchainAsset.tokenId,
    slug,
    title,
    author: creatorInfo.name,
    description: metadata.description || `Digital asset created by ${creatorInfo.name}`,
    type: assetType,
    template: "default",
    collection: "Creator Portfolio",
    tags,
    mediaUrl: metadata.image || "/placeholder.svg",
    externalUrl: metadata.external_url || "",
    licenseType,
    licenseDetails: `License type: ${licenseType}`,
    ipVersion,
    commercialUse,
    modifications,
    attribution,
    registrationDate,
    protectionStatus,
    protectionScope: "Full protection under MIP Protocol",
    protectionDuration: "Lifetime",
    creator: creatorInfo,
    timestamp: registrationDate,
    attributes: metadata.attributes || [],
    blockchain: "Starknet",
    contractAddress: blockchainAsset.contractAddress,
    tokenId: blockchainAsset.tokenId,
    metadataUri: blockchainAsset.tokenURI,
    fileSize,
    fileDimensions,
    fileFormat,
  };
}

/**
 * Group assets by type for better organization
 */
export function groupAssetsByType(assets: AssetIP[]): Record<string, AssetIP[]> {
  return assets.reduce((groups, asset) => {
    const type = asset.type.toLowerCase();
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(asset);
    return groups;
  }, {} as Record<string, AssetIP[]>);
}

/**
 * Sort assets by various criteria
 */
export function sortAssets(assets: AssetIP[], sortBy: string): AssetIP[] {
  const sorted = [...assets];
  
  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "type":
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
    case "recent":
      return sorted.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
    case "oldest":
      return sorted.sort((a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime());
    default:
      return sorted;
  }
}

/**
 * Filter assets based on search query and type
 */
export function filterAssets(
  assets: AssetIP[], 
  searchQuery: string, 
  filterBy: string
): AssetIP[] {
  return assets.filter((asset) => {
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === "all" || asset.type.toLowerCase() === filterBy.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });
}

/**
 * Get unique asset types for filter dropdown
 */
export function getUniqueAssetTypes(assets: AssetIP[]): string[] {
  const types = assets.map(asset => asset.type);
  return Array.from(new Set(types)).sort();
}
