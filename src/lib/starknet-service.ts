import { getDeployedCollections } from "@/src/lib/collections-service";
import {
  RpcProvider,
  Contract,
  CallData,
  num,
  validateAndParseAddress,
  uint256,
} from "starknet";

// StarkNet RPC Provider
const provider = new RpcProvider({
  nodeUrl:
    process.env.NEXT_PUBLIC_STARKNET_RPC_URL ||
    "https://starknet-mainnet.public.blastapi.io/rpc/v0_7",
});

// Contract addresses for common tokens and NFTs
export const CONTRACTS = {
  ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  USDC: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
  USDT: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  MEDIOLANO:
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MIP ||
    "0x04b67deb64d285d3de684246084e74ad25d459989b7336786886ec63a28e0cd4",
};

// ERC20 ABI for balance queries
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "felt" }],
    outputs: [{ name: "balance", type: "Uint256" }],
    stateMutability: "view",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "decimals", type: "felt" }],
    stateMutability: "view",
  },
  {
    name: "symbol",
    type: "function",
    inputs: [],
    outputs: [{ name: "symbol", type: "felt" }],
    stateMutability: "view",
  },
  {
    name: "name",
    type: "function",
    inputs: [],
    outputs: [{ name: "name", type: "felt" }],
    stateMutability: "view",
  },
];

// ERC721 ABI for NFT queries
const ERC721_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "owner", type: "felt" }],
    outputs: [{ name: "balance", type: "Uint256" }],
    stateMutability: "view",
  },
  {
    name: "tokenOfOwnerByIndex",
    type: "function",
    inputs: [
      { name: "owner", type: "felt" },
      { name: "index", type: "Uint256" },
    ],
    outputs: [{ name: "tokenId", type: "Uint256" }],
    stateMutability: "view",
  },
  {
    name: "tokenURI",
    type: "function",
    inputs: [{ name: "tokenId", type: "Uint256" }],
    outputs: [{ name: "tokenURI", type: "felt*" }],
    stateMutability: "view",
  },
];

export interface TokenBalance {
  contractAddress: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  balanceFormatted: string;
  type: "ERC20";
}

export interface NFTAsset {
  contractAddress: string;
  tokenId: string;
  tokenURI?: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
  type: "ERC721";
}

export interface WalletAssets {
  tokens: TokenBalance[];
  nfts: NFTAsset[];
  totalValueUSD?: number;
}

export class StarkNetService {
  private provider: RpcProvider;

  constructor() {
    this.provider = provider;
  }

  /**
   * Validate and normalize StarkNet address
   */
  public validateAddress(address: string): string | null {
    try {
      return validateAndParseAddress(address);
    } catch (error) {
      console.error("Address validation error:", error);
      return null;
    }
  }

  /**
   * Get token balance for an address
   */
  public async getTokenBalance(
    tokenContract: string,
    walletAddress: string
  ): Promise<TokenBalance | null> {
    try {
      const contract = new Contract(ERC20_ABI, tokenContract, this.provider);

      // Get balance, decimals, symbol, and name in parallel
      const [balanceResult, decimalsResult, symbolResult, nameResult] =
        await Promise.all([
          contract.call("balanceOf", [walletAddress]),
          contract.call("decimals", []).catch(() => 18), // Default to 18
          contract.call("symbol", []).catch(() => "UNKNOWN"),
          contract.call("name", []).catch(() => "Unknown Token"),
        ]);

      // Properly handle the contract call results
      const balanceData = balanceResult as any;
      const balance = balanceData[0]
        ? Number(balanceData[0])
        : balanceData.low
        ? balanceData.low + (balanceData.high << 128)
        : 0;
      const decimals = Number(decimalsResult) || 18;
      const symbol = symbolResult?.toString() || "UNKNOWN";
      const name = nameResult?.toString() || "Unknown Token";

      // Convert balance to human readable format
      const balanceFormatted = (
        Number(balance) / Math.pow(10, decimals)
      ).toFixed(decimals > 6 ? 6 : decimals);

      return {
        contractAddress: tokenContract,
        symbol: this.hexToString(symbol) || "UNKNOWN",
        name: this.hexToString(name) || "Unknown Token",
        balance: balance.toString(),
        decimals,
        balanceFormatted,
        type: "ERC20",
      };
    } catch (error) {
      console.error(`Error getting token balance for ${tokenContract}:`, error);
      return null;
    }
  }

  /**
   * Get NFT assets for an address
   */
  public async getNFTAssets(
    nftContract: string,
    walletAddress: string
  ): Promise<NFTAsset[]> {
    try {
      const contract = new Contract(ERC721_ABI, nftContract, this.provider);

      // Get NFT balance
      const balanceResult = await contract.call("balanceOf", [walletAddress]);
      const balanceData = balanceResult as any;
      const balance = balanceData[0]
        ? Number(balanceData[0])
        : balanceData.low
        ? balanceData.low + (balanceData.high << 128)
        : 0;

      if (balance === 0) {
        return [];
      }

      // Get all token IDs owned by the address
      const tokenIds: NFTAsset[] = [];
      for (let i = 0; i < Math.min(balance, 50); i++) {
        // Limit to 50 NFTs to avoid RPC limits
        try {
          const tokenResult = await contract.call("tokenOfOwnerByIndex", [
            walletAddress,
            { low: i, high: 0 },
          ]);
          const tokenData = tokenResult as any;
          const tokenId = tokenData[0]
            ? Number(tokenData[0])
            : tokenData.low
            ? tokenData.low + (tokenData.high << 128)
            : 0;

          // Try to get token URI
          let tokenURI: string | undefined;
          let metadata: any = undefined;

          try {
            const uriResult = await contract.call("tokenURI", [
              { low: tokenId, high: 0 },
            ]);
            const uriData = uriResult as any;
            tokenURI = this.feltArrayToString(
              Array.isArray(uriData) ? uriData : [uriData]
            );

            // If it's a valid URL, try to fetch metadata
            if (
              tokenURI &&
              (tokenURI.startsWith("http") || tokenURI.startsWith("ipfs://"))
            ) {
              metadata = await this.fetchMetadata(tokenURI);
            } else if (
              tokenURI &&
              tokenURI.startsWith("data:application/json")
            ) {
              // Handle base64 encoded metadata
              try {
                const jsonData = tokenURI.split(",")[1];
                metadata = JSON.parse(atob(jsonData));
              } catch (e) {
                console.warn("Failed to parse base64 metadata:", e);
              }
            }
          } catch (e) {
            console.warn(`Failed to get tokenURI for token ${tokenId}:`, e);
          }

          tokenIds.push({
            contractAddress: nftContract,
            tokenId: tokenId.toString(),
            tokenURI,
            metadata,
            type: "ERC721",
          });
        } catch (error) {
          console.warn(`Error getting token at index ${i}:`, error);
          break;
        }
      }

      return tokenIds;
    } catch (error) {
      console.error(`Error getting NFT assets for ${nftContract}:`, error);
      return [];
    }
  }

  /**
   * Get all wallet assets (tokens + NFTs)
   */
  public async getWalletAssets(walletAddress: string): Promise<WalletAssets> {
    const normalizedAddress = this.validateAddress(walletAddress);
    if (!normalizedAddress) {
      throw new Error("Invalid wallet address");
    }

    try {
      // Get common token balances
      const tokenPromises = Object.entries(CONTRACTS).map(([symbol, address]) =>
        this.getTokenBalance(address, normalizedAddress)
      );

      // Get NFT assets from Mediolano contract
      const nftPromises = [
        this.getNFTAssets(CONTRACTS.MEDIOLANO, normalizedAddress),
      ];

      const [tokenResults, nftResults] = await Promise.all([
        Promise.all(tokenPromises),
        Promise.all(nftPromises),
      ]);

      // Filter out null token results and zero balances
      const tokens = tokenResults.filter(
        (token): token is TokenBalance =>
          token !== null && Number(token.balance) > 0
      );

      // Flatten NFT results
      const nfts = nftResults.flat();

      return {
        tokens,
        nfts,
        totalValueUSD: 0, // TODO: Implement USD value calculation
      };
    } catch (error) {
      console.error("Error getting wallet assets:", error);
      throw error;
    }
  }

  /**
   * Estimate transaction fee
   */
  public async estimateTransactionFee(
    contractAddress: string,
    functionName: string,
    calldata: string[],
    senderAddress: string
  ): Promise<{
    gasEstimate: string;
    feeEstimate: string;
    feeEstimateETH: string;
  }> {
    try {
      // Create the transaction call structure
      const call = {
        contractAddress: contractAddress,
        entrypoint: functionName,
        calldata: calldata,
      };

      // Get the fee estimate from StarkNet (use a simplified approach for now)
      // Since fee estimation can be complex, we'll use a fallback for now
      console.log("Estimating fee for transaction...", call);

      // Return reasonable estimates based on StarkNet transaction costs
      return {
        gasEstimate: "100000",
        feeEstimate: "2000000000000000", // 0.002 ETH in wei
        feeEstimateETH: "0.002",
      };
    } catch (error) {
      console.error("Error estimating transaction fee:", error);
      // Return fallback estimates
      return {
        gasEstimate: "50000",
        feeEstimate: "1000000000000000", // 0.001 ETH in wei
        feeEstimateETH: "0.001",
      };
    }
  }

  /**
   * Get transaction status
   */
  public async getTransactionStatus(txHash: string): Promise<{
    status:
      | "PENDING"
      | "ACCEPTED_ON_L1"
      | "ACCEPTED_ON_L2"
      | "REJECTED"
      | "NOT_RECEIVED";
    block_number?: number;
  }> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);

      // @ts-ignore - StarkNet receipt types are complex and dynamic
      const status =
        receipt.finality_status || receipt.execution_status || "PENDING";
      // @ts-ignore - Block number might not always be present
      const blockNumber = receipt.block_number;

      return {
        status: status as any,
        block_number: blockNumber,
      };
    } catch (error) {
      console.error("Error getting transaction status:", error);
      return { status: "NOT_RECEIVED" };
    }
  }

  /**
   * Helper: Convert hex string to readable string
   */
  private hexToString(hex: string): string | null {
    try {
      const hexString = hex.startsWith("0x") ? hex.slice(2) : hex;
      let result = "";
      for (let i = 0; i < hexString.length; i += 2) {
        const byte = parseInt(hexString.substr(i, 2), 16);
        if (byte === 0) break;
        result += String.fromCharCode(byte);
      }
      return result || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Helper: Convert felt array to string
   */
  public feltArrayToString(feltArray: any[]): string {
    try {
      return feltArray
        .map((felt) => this.hexToString(felt.toString()))
        .filter(Boolean)
        .join("");
    } catch (error) {
      return "";
    }
  }

  /**
   * Helper: Fetch metadata from URI (with IPFS support)
   */
  public async fetchMetadata(uri: string): Promise<any> {
    try {
      let fetchUrl = uri;

      // Handle IPFS URLs
      if (uri.startsWith("ipfs://")) {
        fetchUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      }

      const response = await fetch(fetchUrl, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch metadata:", error);
      return null;
    }
  }
}

export async function getDeployedCollectionMetadata(
  collectionAddress: string
): Promise<any> {
  try {
    const contract = new Contract(ERC721_ABI, collectionAddress, provider);
    // const tokenURIResult = await contract.call("tokenURI", [
    //   { low: 0, high: 0 },
    // ]);

    const tokenId = uint256.bnToUint256(BigInt(0)); // Use 0 for the first token
    console.log("Calling tokenURI with tokenId:", tokenId);

    const tokenURIResult = await contract.call("tokenURI", [tokenId]);

    const uri = starknetService.feltArrayToString(
      Array.isArray(tokenURIResult) ? tokenURIResult : [tokenURIResult]
    );

    console.log("Fetched tokenURI:", uri);

    const metadata = await starknetService.fetchMetadata(uri);
    console.log("Fetched metadata:", metadata);

    return {
      id: collectionAddress,
      slug: metadata?.slug || "",
      name: metadata?.name || "Untitled Collection",
      description: metadata?.description || "",
      category: metadata?.category || "Uncategorized",
      coverImage: metadata?.image || "",
      bannerImage: metadata?.bannerImage || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assets: 0,
      views: 0,
      likes: 0,
      isFeatured: false,
    };
  } catch (error) {
    console.error("Error fetching collection metadata:", error);
    return null;
  }
}

// Export singleton instance
export const starknetService = new StarkNetService();
