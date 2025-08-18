import {
  RpcProvider,
  Contract,
  validateAndParseAddress,
  uint256,
  num,
} from "starknet";
import { ERC721_ABI } from "../abi/ERC721_ABI";
import type {
  TokenBalanceERC721,
  NFTAsset,
  TokenBalance,
  WalletAssets,
  IPortfolioReturnTypeObj,
} from "../types/asset";
import { ERC20_ABI } from "../abi/ERC20_ABI";
import { CONTRACTS, provider } from "./constant";

export class StarkNetService {
  private provider: RpcProvider;
  // Configuration
  MAX_CONCURRENT = 5;
  MAX_RETRIES = 3;
  RETRY_DELAY_MS = 500;

  constructor() {
    this.provider = provider;
  }

  /**
   * Get owner of an ERC-721 token
   */
  public async getNftOwner(
    contractAddress: string,
    tokenId: string | number | bigint
  ): Promise<string | null> {
    const normalizedAddress = this.validateAddress(contractAddress);
    if (!normalizedAddress) return null;
    const u256Id = uint256.bnToUint256(BigInt(tokenId));
    const contract = new Contract(ERC721_ABI, normalizedAddress, this.provider);
    try {
      const res = await contract.call("owner_of", [u256Id]);
      const owner = Array.isArray(res) ? res[0] : res;
      return num.toHex(owner) ?? null;
    } catch (error) {
      console.error(`Error getting owner for token ${tokenId} on contract ${contractAddress}:`, error);
      return null;
    }
  }

  /**
   * Get token URI
   */
  public async getTokenURI(
    contractAddress: string,
    tokenId: string | number | bigint
  ): Promise<string | null> {
    const normalizedAddress = this.validateAddress(contractAddress);
    if (!normalizedAddress) return null;
    const u256Id = uint256.bnToUint256(BigInt(tokenId));
    const contract = new Contract(ERC721_ABI, normalizedAddress, this.provider);
    try {
      const res = await contract.call("token_uri", [u256Id]);
      const uri = Array.isArray(res)
        ? res.map((x: any) => String(x)).join("")
        : res?.toString?.();
      return uri as string ?? null;
    } catch (error) {
      console.error(`Error getting token URI for token ${tokenId} on contract ${contractAddress}:`, error);
      return null;
    }
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
   * P-Limit light weight lib
   * Simple lib to bypass RPC rate limit abit and then run retry if we ever hit limit.
   */
  public delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  public async runWithConcurrency<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number
  ): Promise<T[]> {
    const results: T[] = [];
    let i = 0;

    async function worker() {
      while (i < tasks.length) {
        const currentIndex = i++;
        try {
          const result = await tasks[currentIndex]();
          results[currentIndex] = result;
        } catch (err) {
          console.error(`Task ${currentIndex} failed:`, err);
          results[currentIndex] = null as T;
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, worker));
    return results;
  }
  public async withRetry<T>(
    fn: () => Promise<T>,
    retries = this.MAX_RETRIES
  ): Promise<T | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        console.warn(`Retry ${attempt + 1} failed`, err);
        if (attempt < retries) await this.delay(this.RETRY_DELAY_MS);
      }
    }
    return null;
  }

  /**
   * Get Nft token balance for an address.
   */
  public async getTokenBalanceForNft(
    nftContract: string,
    walletAddress: string
  ): Promise<TokenBalanceERC721 | null> {
    try {
      const contract = new Contract(ERC721_ABI, nftContract, this.provider);

      // Get balance
      const balanceResult = await contract.call("balanceOf", [walletAddress]);

      const totalBalance = parseInt(balanceResult.toString());
      const newBalance = BigInt(totalBalance.toString());

      return {
        contractAddress: nftContract,
        nftBalance: totalBalance,
        newNftBalance: newBalance,
        type: "ERC721",
      };
    } catch (error) {
      console.error(`Error getting token balance for ${nftContract}:`, error);
      return null;
    }
  }

  /** New Implementation
   * Get NFT assets for an address
   */

  public async getMyNFTAssets(
    walletAddress: string
  ): Promise<IPortfolioReturnTypeObj[]> {
    const nftContract = CONTRACTS.MEDIOLANO;
    try {
      const contract = new Contract(ERC721_ABI, nftContract, this.provider);
      const data = await this.getTokenBalanceForNft(nftContract, walletAddress);
      const nftBalance = data?.nftBalance ?? 0;

      if (nftBalance === 0) return [];

      const tasks: (() => Promise<IPortfolioReturnTypeObj | null>)[] =
        Array.from(
          { length: Math.min(nftBalance, 50) },
          (_, i) => async () =>
            this.withRetry(async () => {
              const tokenIndex = uint256.bnToUint256(BigInt(i));

              const tokenIdBigInt = await contract.token_of_owner_by_index(
                walletAddress,
                tokenIndex
              );
              const tokenId = tokenIdBigInt.toString();
              let tokenURI: string | undefined;
              let metadata: any = undefined;

              try {
                const uriResult = await contract.tokenURI(BigInt(tokenId));
                tokenURI = Array.isArray(uriResult)
                  ? this.feltArrayToString(uriResult)
                  : uriResult.toString();

                if (
                  tokenURI?.startsWith("http") ||
                  tokenURI?.startsWith("ipfs://")
                ) {
                  metadata = await this.fetchMetadata(tokenURI);
                } else if (tokenURI?.startsWith("data:application/json")) {
                  const jsonData = tokenURI.split(",")[1];
                  metadata = JSON.parse(atob(jsonData));
                }
              } catch (e) {
                console.warn(`Failed to get metadata for token ${tokenId}`, e);
              }

              return {
                contractAddress: contract.address,
                tokenId,
                tokenURI,
                metadata,

                type: "ERC721",
              } as IPortfolioReturnTypeObj;
            })
        );

      const results = await this.runWithConcurrency(tasks, this.MAX_CONCURRENT);
      return results.filter((r): r is IPortfolioReturnTypeObj => r !== null);
    } catch (err) {
      console.error("Error in getMyNFTAssets:", err);
      return [];
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
      //   Get common token balances
      const tokenPromises = Object.entries(CONTRACTS).map(([symbol, address]) =>
        this.getTokenBalance(address, normalizedAddress)
      );

      //   Get NFT assets from Mediolano contract
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
        tokens: tokens,
        nfts: nfts,
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
    //   @ts-ignore 
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
  private feltArrayToString(feltArray: any[]): string {
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
  private async fetchMetadata(uri: string): Promise<any> {
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

// Export singleton instance
export const starknetService = new StarkNetService();
