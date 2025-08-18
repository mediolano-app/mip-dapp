// Aggregation-only service; low-level reads live in starknet.service
import type { AssetIP } from "@/src/types/asset";
import { starknetService } from "@/src/services/starknet.service";

function toDisplayUrl(uri: string | null | undefined): string {
  if (!uri) return "";
  const val = String(uri);
  if (val.startsWith("ipfs://")) {
    return val.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{55,}|bafk[a-z2-7]{55,})$/.test(val)) {
    return `https://ipfs.io/ipfs/${val}`;
  }
  return val;
}

async function fetchJsonMetadata(uri: string): Promise<any | null> {
  try {
    let fetchUrl = uri;
    if (uri.startsWith("ipfs://")) {
      fetchUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function parseAssetSlug(slug: string): { contractAddress: string; tokenId: string } | null {
  if (!slug) return null;
  const lastColon = slug.lastIndexOf(":");
  const lastDash = slug.lastIndexOf("-");
  const sepIndex = Math.max(lastColon, lastDash);
  if (sepIndex > 0) {
    const contractAddress = slug.slice(0, sepIndex);
    const tokenId = slug.slice(sepIndex + 1);
    return { contractAddress, tokenId };
  }
  return { contractAddress: slug, tokenId: "1" };
}

class AssetsService {

  private normalizeKeys(obj: any) {
    if (!obj || typeof obj !== "object") return obj;
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      out[String(k).toLowerCase()] = v;
    }
    return out;
  }

  public async getAsset(contractAddress: string, tokenId: string | number | bigint): Promise<AssetIP> {
    const validated = starknetService.validateAddress(contractAddress);
    const normalized = validated || contractAddress;
    const idStr = String(tokenId);

    const tokenURI = await starknetService.getTokenURI(normalized, idStr);
    const owner = await starknetService.getNftOwner(normalized, idStr);

    let metadata: any = null;
    if (tokenURI) {
      try {
        if (tokenURI.startsWith("data:application/json")) {
          const jsonData = tokenURI.split(",")[1];
          metadata = JSON.parse(atob(jsonData));
        } else if (tokenURI.startsWith("http") || tokenURI.startsWith("ipfs://")) {
          metadata = await fetchJsonMetadata(tokenURI);
        }
      } catch {}
    }

    const md = this.normalizeKeys(metadata) || {};
    const { attrMap, propMap } = this.extractMetadataMaps(md);

    const preferredImage = typeof md.image === "string" && md.image ? md.image : undefined;
    const imageForDisplay = toDisplayUrl(preferredImage ?? tokenURI ?? "");

    const formattedCreated = this.formatRegistrationDate(propMap["registration_date"] || md.created_at || md.createdAt || md.timestamp);
    const asset: AssetIP = {
      id: `${normalized}:${idStr}`,
      slug: `${normalized}:${idStr}`,
      title: md.name || `${md.symbol || "NFT"} #${idStr}`,
      author: md.author || (propMap["creator"] as string) || "Unknown",
      description: md.description || "",
      type: (attrMap.get("type")?.toLowerCase() || md.type || "art") as string,
      template: md.template || "default",
      collection: (propMap["collection"] as string) || md.collection || "",
      collectionSlug: md.collectionslug || undefined,
      tags: (attrMap.get("tags") as string) || (Array.isArray(md.tags) ? md.tags.join(", ") : md.tags || ""),
      mediaUrl: imageForDisplay,
      externalUrl: md.external_url || "",
      licenseType: (attrMap.get("license") as string) || md.license || md.licensetype || "custom",
      licenseDetails: (propMap["license_details"] as string) || md.license_details || md.licensedetails || "",
      ipVersion: (attrMap.get("ip version") as string) || md.ip_version || md.ipversion || "1.0",
      commercialUse: this.parseBoolean(md.commercial_use ?? md.commercialuse ?? attrMap.get("commercial use")),
      modifications: this.parseBoolean(md.modifications ?? attrMap.get("modifications")),
      attribution: this.parseBoolean(md.attribution ?? attrMap.get("attribution"), true),
      registrationDate: formattedCreated || "Unknown",
      protectionStatus: (attrMap.get("protection status") as string) || md.protection_status || "Protected",
      protectionScope: (attrMap.get("protection scope") as string) || md.protection_scope || "Global",
      protectionDuration: (propMap["protection_duration"] as string) || md.protection_duration || "50+ years",
      creator: {
        id: md.creator_id || "",
        username: md.creator_username || "",
        name: (propMap["creator"] as string) || md.creator_name || "Unknown",
        avatar: md.creator_avatar || "",
        verified: Boolean(md.creator_verified ?? false),
        wallet: owner || "",
        bio: md.creator_bio,
        followers: md.creator_followers,
        following: md.creator_following,
        assets: md.creator_assets,
      },
      timestamp: md.created_at || md.createdAt || md.timestamp || new Date().toISOString(),
      attributes: Array.isArray(md.attributes)
        ? md.attributes.map((a: any) => ({ trait_type: a.trait_type ?? a.traitType ?? "", value: a.value }))
        : undefined,
      blockchain: "Starknet",
      contractAddress: normalized,
      tokenId: idStr,
      metadataUri: tokenURI || undefined,
      fileSize: md.file_size || undefined,
      fileDimensions: md.file_dimensions || undefined,
      fileFormat: md.file_format || undefined,
    };

    return asset;
  }

  private extractMetadataMaps(md: any): { attrMap: Map<string, string>; propMap: Record<string, any> } {
    const rawAttributes: any[] = Array.isArray(md.attributes) ? md.attributes : [];
    const attrMap = new Map<string, string>();
    
    for (const attr of rawAttributes) {
      const key = (attr?.trait_type ?? attr?.traitType ?? "").toString().trim().toLowerCase();
      if (key) {
        attrMap.set(key, (attr?.value ?? "").toString());
      }
    }

    const rawProps = typeof md.properties === "object" && md.properties !== null ? md.properties : {};
    const propMap: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(rawProps)) {
      propMap[key.toLowerCase()] = value;
    }

    return { attrMap, propMap };
  }

  private formatRegistrationDate(dateValue: any): string | null {
    if (!dateValue || Number.isNaN(Date.parse(dateValue))) {
      return null;
    }
    
    const date = new Date(dateValue);
    return date.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
  }

  private parseBoolean(value: any, defaultValue: boolean = false): boolean {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return Boolean(value);
  }
}

export const assetsService = new AssetsService();


