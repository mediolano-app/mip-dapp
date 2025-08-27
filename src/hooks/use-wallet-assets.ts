import { useState, useEffect, useCallback } from "react";
import { starknetService } from "@/src/services/starknet.service";
import type {
  TokenBalance,
  NFTAsset,
  WalletAssets,
  IPortfolioReturnType,
  IPortfolioReturnTypeObj,
} from "../types/asset";
import { CONTRACTS } from "../services/constant";

interface UseWalletAssetsReturn {
  assets: WalletAssets | null;
  tokens: TokenBalance[];
  nfts: NFTAsset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch portfolio assets.
 * Todo: Manage all of this api call with tanstack query instead of useEffect.
 */
export function useGetPortfolioAssets(
  walletAddress: string | null
): IPortfolioReturnType & {
  refetchAsset: () => void;
  loading: boolean;
  error: any;
} {
  const [portfolioAssets, setPortfolioAssets] = useState<
    IPortfolioReturnTypeObj[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!walletAddress) {
      setPortfolioAssets(null);
      setError(null);
      return;
    }

    // Validate address format
    const validAddress = starknetService.validateAddress(walletAddress);
    if (!validAddress) {
      setError("Invalid wallet address format");
      setPortfolioAssets(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const portfolioAsset = await starknetService.getMyNFTAssets(validAddress);

      setPortfolioAssets(portfolioAsset);
      setError(null);
    } catch (err) {
      console.error("Error fetching wallet assets:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch wallet assets"
      );
      setPortfolioAssets(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    data: portfolioAssets,
    error: error,
    refetchAsset: fetchAssets,
    loading: isLoading,
    meta: {},
  };
}



/**
 * Hook to fetch and manage wallet assets from StarkNet
 */
export function useWalletAssets(
  walletAddress: string | null
): UseWalletAssetsReturn {
  const [assets, setAssets] = useState<WalletAssets | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!walletAddress) {
      setAssets(null);
      setError(null);
      return;
    }

    // Validate address format
    const validAddress = starknetService.validateAddress(walletAddress);
    if (!validAddress) {
      setError("Invalid wallet address format");
      setAssets(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const walletAssets = await starknetService.getWalletAssetsV2(validAddress);
      setAssets(walletAssets);
      setError(null);
    } catch (err) {
      console.error("Error fetching wallet assets:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch wallet assets"
      );
      setAssets(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Auto-fetch when wallet address changes
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    assets,
    tokens: assets?.tokens || [],
    nfts: assets?.nfts || [],
    isLoading,
    error,
    refetch: fetchAssets,
  };
}

/**
 * Hook for real-time fee estimation
 */
export function useTransactionFeeEstimate() {
  const [isEstimating, setIsEstimating] = useState(false);

  const estimateFee = useCallback(
    async (
      contractAddress: string,
      functionName: string,
      calldata: string[],
      senderAddress: string
    ) => {
      setIsEstimating(true);
      try {
        const estimate = await starknetService.estimateTransactionFee(
          contractAddress,
          functionName,
          calldata,
          senderAddress
        );
        return estimate;
      } catch (error) {
        console.error("Fee estimation error:", error);
        // Return fallback estimates
        return {
          gasEstimate: "50000",
          feeEstimate: "1000000000000000", // 0.001 ETH in wei
          feeEstimateETH: "0.001",
        };
      } finally {
        setIsEstimating(false);
      }
    },
    []
  );

  return {
    estimateFee,
    isEstimating,
  };
}
