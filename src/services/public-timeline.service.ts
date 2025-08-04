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
    totalSupply = Number(uint256.uint256ToBN(totalSupplyResult));
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
      const tokenId = uint256.uint256ToBN(tokenIdResult).toString();

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

          if (hash) {
            metadata = await ipfsService.getFromIPFS(hash);
          } else if (fetchDirectly) {
            const response = await fetch(tokenURI, { headers: { 'Accept': 'application/json' } });
            if (response.ok) {
              metadata = await response.json();
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