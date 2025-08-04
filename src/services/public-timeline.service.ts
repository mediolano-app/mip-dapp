import { Contract, uint256 } from 'starknet';
import { ERC721_ABI } from '../abi/ERC721_ABI';
import { CONTRACTS, provider } from './constant';

export interface PublicTimelineAsset {
  tokenId: string;
  tokenURI: string;
  metadata: any;
  timestamp: string; // fallback to block timestamp or metadata timestamp
}

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.fleek.co/ipfs/',
];

async function fetchFromIpfsWithFallback(hashOrUrl: string, maxRetries = 3): Promise<any> {
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const gateway of IPFS_GATEWAYS) {
      let url = hashOrUrl;
      if (hashOrUrl.startsWith('ipfs://')) {
        url = gateway + hashOrUrl.replace('ipfs://', '');
      } else if (hashOrUrl.match(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{55,}|bafk[a-z2-7]{55,})$/)) {
        url = gateway + hashOrUrl;
      }
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        lastError = err;
      }
    }
    // Wait before retrying
    await new Promise(res => setTimeout(res, 500));
  }
  throw lastError || new Error('Failed to fetch from IPFS');
}

// Fetch the latest N assets from the Mediolano contract, paginated
export async function fetchLatestAssets({
  page = 0,
  pageSize = 10,
  filterType = 'all',
}: {
  page: number;
  pageSize: number;
  filterType?: string;
}): Promise<PublicTimelineAsset[]> {
  const contract = new Contract(ERC721_ABI as any, CONTRACTS.MEDIOLANO, provider);
  let totalSupply: number;
  try {
    const totalSupplyResult = await contract.call('total_supply');
    // total_supply returns a u256
    totalSupply = Number(uint256.uint256ToBN(totalSupplyResult));
  } catch (err) {
    console.error('Failed to fetch total_supply:', err);
    return [];
  }
  // Calculate indices for pagination (latest first)
  const start = Math.max(totalSupply - 1 - page * pageSize, 0);
  const end = Math.max(start - pageSize + 1, 0);
  const assets: PublicTimelineAsset[] = [];
  for (let i = start; i >= end; i--) {
    try {
      const tokenIdResult = await contract.call('token_by_index', [uint256.bnToUint256(BigInt(i))]);
      const tokenId = uint256.uint256ToBN(tokenIdResult).toString();
      // Get tokenURI
      let tokenURI = '';
      try {
        const uriResult = await contract.call('tokenURI', [uint256.bnToUint256(BigInt(tokenId))]);
        tokenURI = Array.isArray(uriResult)
          ? uriResult.map((felt: any) => String.fromCharCode(Number(felt))).join('')
          : uriResult.toString();
      } catch (e) {
        console.warn(`Failed to get tokenURI for token ${tokenId}:`, e);
      }
      // Fetch metadata from IPFS or HTTP with fallback/retry
      let metadata: any = null;
      if (tokenURI && (tokenURI.startsWith('http') || tokenURI.startsWith('ipfs://') || tokenURI.match(/^(Qm|bafy|bafk)/))) {
        try {
          if (tokenURI.startsWith('http')) {
            const response = await fetch(tokenURI, { signal: AbortSignal.timeout(7000) });
            if (response.ok) {
              metadata = await response.json();
            }
          } else {
            metadata = await fetchFromIpfsWithFallback(tokenURI);
          }
        } catch (err) {
          console.warn(`Failed to fetch metadata for token ${tokenId}:`, err);
        }
      }
      // Filter by asset type if needed
      if (
        filterType === 'all' ||
        (metadata && metadata.assetType && metadata.assetType === filterType)
      ) {
        assets.push({
          tokenId,
          tokenURI,
          metadata,
          timestamp: metadata?.timestamp || '',
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch asset at index ${i}:`, err);
    }
  }
  return assets;
}
