import { Contract, uint256 } from 'starknet';
import { ERC721_ABI } from '../abi/ERC721_ABI';
import { CONTRACTS, provider } from './constant';
import { ipfsService } from './ipfs.service';

function decodeShortString(felt: string | number | bigint): string {
  let hex = BigInt(felt).toString(16);
  if (hex.length % 2) hex = '0' + hex;
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    if (code) str += String.fromCharCode(code);
  }
  return str;
}

export interface PublicTimelineAsset {
  tokenId: string;
  tokenURI: string;
  metadata: any;
  timestamp: string;
}

export async function fetchLatestAssets({
  page = 0,
  pageSize = 10,
  filterType = 'all',
}: {
  page: number;
  pageSize: number;
  filterType?: string;
}): Promise<PublicTimelineAsset[]> {
  const contract = new Contract(ERC721_ABI, CONTRACTS.MEDIOLANO, provider);
  let totalSupply: number;

  try {
    const totalSupplyResult = await contract.call('total_supply');
    // Extract the Uint256 value from the result object
    const totalSupplyUint256 = Array.isArray(totalSupplyResult)
      ? totalSupplyResult[0]
      : (typeof totalSupplyResult === 'object' && totalSupplyResult !== null && 'total_supply' in totalSupplyResult)
        ? (totalSupplyResult as any).total_supply
        : totalSupplyResult;
    totalSupply = Number(uint256.uint256ToBN(totalSupplyUint256));
  } catch (err) {
    console.error('Failed to fetch total_supply:', err);
    return [];
  }

  const start = Math.max(totalSupply - 1 - page * pageSize, 0);
  const end = Math.max(start - pageSize + 1, 0);
  const assets: PublicTimelineAsset[] = [];

  for (let i = start; i >= end; i--) {
    try {
      const tokenIdResult = await contract.call('token_by_index', [uint256.bnToUint256(BigInt(i))]);
      // Extract the Uint256 value from the result object
      const tokenIdUint256 = Array.isArray(tokenIdResult)
        ? tokenIdResult[0]
        : (typeof tokenIdResult === 'object' && tokenIdResult !== null && 'token_id' in tokenIdResult)
          ? (tokenIdResult as any).token_id
          : tokenIdResult;
      const tokenId = uint256.uint256ToBN(tokenIdUint256).toString();

      let tokenURI = '';
      try {
        const uriResult = await contract.call('tokenURI', [uint256.bnToUint256(BigInt(tokenId))]);

        if (Array.isArray(uriResult)) {
          tokenURI = uriResult.map((felt: any) => {
            if (typeof felt === 'string' && (felt.startsWith('http') || felt.startsWith('ipfs://'))) {
              return felt;
            }
            try {
              return decodeShortString(felt.toString());
            } catch {
              return '';
            }
          }).join('');
        } else {
          if (typeof uriResult === 'string' && (uriResult.startsWith('http') || uriResult.startsWith('ipfs://'))) {
            tokenURI = uriResult;
          } else {
            try {
              tokenURI = decodeShortString(uriResult.toString());
            } catch {
              tokenURI = '';
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to get tokenURI for token ${tokenId}:`, e);
      }

      let metadata: any = null;
      if (tokenURI) {
        try {
          let hash: string | null = null;
          let fetchDirectly = false;

          // Case 1: The URI is a standard IPFS URL (e.g., ipfs://<hash>)
          if (tokenURI.startsWith('ipfs://')) {
            hash = tokenURI.replace('ipfs://', '');
          } 
          // Case 2: The URI is an IPFS gateway URL (e.g., https://gateway.pinata.cloud/ipfs/<hash>)
          else if (tokenURI.includes('/ipfs/')) {
            const parts = tokenURI.split('/ipfs/');
            if (parts.length > 1) {
              hash = parts[1].split(/[/?#]/)[0];
            }
          }
          // Case 3: The URI is a direct HTTP/HTTPS URL (not an IPFS gateway)
          else if (tokenURI.startsWith('http://') || tokenURI.startsWith('https://')) {
            fetchDirectly = true;
          }
          // Case 4: The URI is a plain hash string (e.g., bafkreife5gq...)
          else if (tokenURI.length > 30) {
            hash = tokenURI;
          }

          // Enhanced IPFS fetching logic with gateway fallbacks and tolerant parsing
          const buildCandidateUrls = (uri: string): string[] => {
            const candidates: string[] = [];
            const gateways = [
              'https://cloudflare-ipfs.com/ipfs/',
              'https://ipfs.io/ipfs/',
              'https://gateway.pinata.cloud/ipfs/',
            ];

            const toIpfsPaths = (rest: string) => gateways.map(g => g + rest.replace(/^\//, ''));

            if (uri.startsWith('ipfs://')) {
              const rest = uri.replace('ipfs://', '');
              candidates.push(...toIpfsPaths(rest));
            } else if (uri.includes('/ipfs/')) {
              const parts = uri.split('/ipfs/');
              const rest = parts[1]?.split('#')[0] ?? '';
              candidates.push(...toIpfsPaths(rest), uri);
            } else if (uri.startsWith('Qm') || uri.startsWith('bafy') || uri.startsWith('bafk')) {
              candidates.push(...toIpfsPaths(uri));
            } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
              candidates.push(uri);
            } else {
              candidates.push(uri);
            }

            // De-duplicate while preserving order
            return Array.from(new Set(candidates));
          };

          const candidates = buildCandidateUrls(tokenURI);

          let successResponse: Response | null = null;
          let lastError: unknown = null;

          for (const tryUrl of candidates) {
            try {
              const res = await fetch(tryUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json, image/*, */*' },
                signal: AbortSignal.timeout(10000)
              });
              if (res.ok) {
                successResponse = res;
                break;
              } else {
                // Retry on non-OK responses (e.g., 404/415/422/5xx) by trying next gateway
                lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
                continue;
              }
            } catch (e) {
              // Network error or timeout, try next candidate
              lastError = e;
              continue;
            }
          }

          if (!successResponse) {
            console.warn(`Failed to fetch metadata for token ${tokenId}:`, lastError);
            metadata = null;
          } else {
            const contentType = successResponse.headers.get('content-type') || '';
            if (contentType.startsWith('image/')) {
              // TokenURI points directly to an image; no JSON metadata
              metadata = null;
            } else {
              const text = await successResponse.text();
              const trimmed = text.trim();
              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try {
                  metadata = JSON.parse(trimmed);
                } catch (e) {
                  console.warn(`Failed to parse JSON metadata for token ${tokenId}:`, e);
                  metadata = null;
                }
              } else {
                metadata = null;
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch metadata for token ${tokenId}:`, err);
        }
      }

      const matchesFilter = filterType === 'all' ||
        (metadata && metadata.assetType && metadata.assetType === filterType);

      if (matchesFilter) {
        assets.push({
          tokenId,
          tokenURI,
          metadata,
          timestamp: metadata?.timestamp || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch asset at index ${i}:`, err);
    }
  }

  return assets;
}