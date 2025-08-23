import { Contract } from "starknet";
import { ERC721_ABI } from "../abi/ERC721_ABI";
import { starknetService } from "./starknet.service";
import { ipfsService } from "./ipfs.service";
import type { AssetIP, NFTAsset } from "../types/asset";

const IPFS_RETRY_LIMIT = 2;

export type PublicTimelineAsset = {
    asset: NFTAsset;
    metadata?: AssetIP | null;
};

// Helper function to convert u256 to a string representation of the number
function u256ToString(u256: any): string {
    if (!u256) return "0";
    // Try low/high first
    if (typeof u256.low !== "undefined" && typeof u256.high !== "undefined") {
        const low = BigInt(u256.low);
        const high = BigInt(u256.high);
        return ((high << BigInt(128)) + low).toString();
    }
    // Try array/object with 0/1 keys
    if (typeof u256[0] !== "undefined" && typeof u256[1] !== "undefined") {
        const low = BigInt(u256[0]);
        const high = BigInt(u256[1]);
        return ((high << BigInt(128)) + low).toString();
    }
    // Try direct string/number
    if (typeof u256 === "string" || typeof u256 === "number" || typeof u256 === "bigint") {
        return u256.toString();
    }
    console.error("Unknown u256 format", u256);
    return "0";
}

// Helper function to decode ByteArray to a string
function decodeByteArray(byteArray: { data: string[]; pending_word: string; pending_word_len: number }): string {
    const data = byteArray.data.map(felt => {
        const hex = felt.substring(2);
        return Buffer.from(hex, 'hex').toString('utf8');
    });
    const pending = byteArray.pending_word;
    const pendingLen = byteArray.pending_word_len;
    const pendingHex = pending.substring(2);
    const pendingStr = Buffer.from(pendingHex, 'hex').toString('utf8').slice(0, pendingLen);
    return data.join('') + pendingStr;
}

async function fetchIpfsWithRetry(hashOrUri: string, retries = IPFS_RETRY_LIMIT): Promise<AssetIP | null> {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            let hash = hashOrUri;
            if (hash.startsWith('ipfs://')) hash = hash.replace('ipfs://', '');
            const meta = await ipfsService.getFromIPFS(hash);
            if (meta && typeof meta === 'object' && 'timestamp' in meta && 'type' in meta) return meta;
            return null;
        } catch (err) {
            lastError = err;
            await new Promise(res => setTimeout(res, 500));
        }
    }
    console.error("IPFS fetch failed for", hashOrUri, lastError);
    return null;
}

export async function getPublicTimelineAssets(page = 0, pageSize = 12, assetType?: string): Promise<PublicTimelineAsset[]> {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MIP;
    if (!contractAddress) {
        console.warn("NEXT_PUBLIC_CONTRACT_ADDRESS_MIP is not set.");
        return [];
    }

    const contract = new Contract(ERC721_ABI, contractAddress, starknetService['provider']);

    // Get total supply, correctly parsing u256
    let totalSupply = 0;
    try {
        const result = await contract.call("total_supply", []) as any;
        console.log("total_supply raw result", result);
        totalSupply = Number(result);
    } catch (e) {
        console.error("Failed to fetch total_supply from contract", e);
        return [];
    }
    // console.log("totalSupply", totalSupply);

    // 2. Get token IDs for this page
    const start = page * pageSize;
    const end = Math.min(start + pageSize, totalSupply);
    const tokenIds: string[] = [];
    for (let i = start; i < end; i++) {
        try {
            // Call token_by_index and parse the u256 result
            const result = await contract.call("token_by_index", [i]) as any;
            const tokenId = result.toString();
            tokenIds.push(tokenId);
        } catch (e) {
            console.warn(`Failed to fetch token_by_index(${i})`, e);
        }
    }

    // 3. Fetch NFTAsset for each tokenId
    const nfts: NFTAsset[] = await Promise.all(
        tokenIds.map(async (tokenId) => {
            const [ownerResult, tokenUriResult] = await Promise.all([
                contract.call("owner_of", [tokenId]) as any,
                contract.call("token_uri", [tokenId]) as any
            ]);
            const owner = ownerResult.toString();
            const tokenURI = tokenUriResult.toString();

            return {
                contractAddress,
                tokenId: tokenId.toString(),
                owner,
                tokenURI,
                type: "ERC721",
            } as NFTAsset;
        })
    );
    // console.log("NFTs", nfts);

    // 4. Fetch IPFS metadata for each asset (tokenURI)
    const assetsWithMeta: PublicTimelineAsset[] = await Promise.all(
        nfts.map(async (asset) => {
            let meta: AssetIP | null = null;
            if (asset.tokenURI && asset.tokenURI.startsWith('ipfs://')) {
                meta = await fetchIpfsWithRetry(asset.tokenURI);
            }
            return {
                asset,
                metadata: meta,
            };
        })
    );
    // console.log("assetsWithMeta", assetsWithMeta);

    // 5. Sort and Filter
    let sorted = assetsWithMeta.sort((a, b) => {
        const ta = a.metadata?.timestamp ? Date.parse(a.metadata.timestamp) : 0;
        const tb = b.metadata?.timestamp ? Date.parse(b.metadata.timestamp) : 0;
        if (tb !== ta) return tb - ta;
        return Number(b.asset.tokenId) - Number(a.asset.tokenId);
    });

    if (assetType) {
        if (assetType === "other") {
            sorted = sorted.filter(a => {
                const metaType = a.metadata?.type?.toLowerCase().trim();
                return !metaType || !["art", "music", "docs"].includes(metaType);
            });
        } else {
            sorted = sorted.filter(a => {
                const metaType = a.metadata?.type?.toLowerCase().trim();
                return metaType === assetType.toLowerCase().trim();
            });
        }
    }

    return sorted;
}