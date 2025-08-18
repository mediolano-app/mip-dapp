import { useCallback, useEffect, useMemo, useState } from "react";
import { assetsService, parseAssetSlug } from "@/src/services/assets.service";
import type { AssetIP } from "@/src/types/asset";

const parseSlug = parseAssetSlug;

export function useAsset(params: { contractAddress: string; tokenId: string | number | bigint }) {
  const { contractAddress, tokenId } = params;
  const [asset, setAsset] = useState<AssetIP | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    Boolean(contractAddress) && String(tokenId ?? "") !== ""
  );
  const [error, setError] = useState<string | null>(null);

  const fetchAsset = useCallback(async () => {
    if (!contractAddress || tokenId === undefined || tokenId === null || String(tokenId) === "") {
      setAsset(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await assetsService.getAsset(contractAddress, String(tokenId));
      setAsset(result);
    } catch (e: any) {
      setError(e?.message || "Failed to load asset");
      setAsset(null);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, tokenId]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  return useMemo(
    () => ({ asset, isLoading, error, refetch: fetchAsset }),
    [asset, isLoading, error, fetchAsset]
  );
}

export function useAssetBySlug(slug: string | undefined) {
  const parsed = useMemo(() => {
    if (!slug) return null;
    let s = slug;
    try {
      s = decodeURIComponent(slug);
    } catch {}
    return parseSlug(s);
  }, [slug]);
  const contractAddress = parsed?.contractAddress || "";
  const tokenId = parsed?.tokenId || "";
  return useAsset({ contractAddress, tokenId });
}


