import { useState, useEffect, useCallback } from "react";
import { starknetService } from "@/src/services/starknet.service";
import type { IPortfolioReturnTypeObj } from "../types/asset";

interface UseCreatorPortfolioReturn {
  assets: IPortfolioReturnTypeObj[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalAssets: number;
}

/**
 * Hook to fetch creator portfolio assets from Starknet blockchain
 * This hook fetches all NFT assets owned by a specific wallet address
 */
export function useCreatorPortfolio(
  walletAddress: string | null
): UseCreatorPortfolioReturn {
  const [assets, setAssets] = useState<IPortfolioReturnTypeObj[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!walletAddress) {
      setAssets([]);
      setError(null);
      return;
    }

    // Validate address format
    const validAddress = starknetService.validateAddress(walletAddress);
    if (!validAddress) {
      setError("Invalid wallet address format");
      setAssets([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching creator portfolio for wallet:", validAddress);
      const portfolioAssets = await starknetService.getMyNFTAssets(validAddress);

      console.log("Fetched creator portfolio assets:", portfolioAssets);
      setAssets(portfolioAssets);
      setError(null);
    } catch (err) {
      console.error("Error fetching creator portfolio:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch creator portfolio"
      );
      setAssets([]);
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
    isLoading,
    error,
    refetch: fetchAssets,
    totalAssets: assets.length,
  };
}

/**
 * Hook to fetch a specific creator's portfolio by username/wallet
 * This can be used when you have a username that maps to a wallet address
 */
export function useCreatorPortfolioByUsername(
  username: string | null,
  usernameToWalletMap?: Record<string, string>
): UseCreatorPortfolioReturn {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const portfolioHook = useCreatorPortfolio(walletAddress);

  useEffect(() => {
    if (username && usernameToWalletMap) {
      const wallet = usernameToWalletMap[username];
      setWalletAddress(wallet || null);
    } else {
      setWalletAddress(null);
    }
  }, [username, usernameToWalletMap]);

  return portfolioHook;
}
