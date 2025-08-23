"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { getPublicTimelineAssets, PublicTimelineAsset } from "../services/public-timeline.service";
import { IPAssetCard } from "./ip-asset-card";

const PAGE_SIZE = 12;

export const assetTypes = [
  { label: "All", value: undefined },
  { label: "Art", value: "art" },
  { label: "Music", value: "music" },
  { label: "Docs", value: "docs" },
  { label: "Other", value: "other" },
];

const PublicTimeline: React.FC = function PublicTimeline() {
  const [assets, setAssets] = useState<PublicTimelineAsset[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastAssetRef = useRef<HTMLDivElement | null>(null);

  const fetchAssets = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const nextPage = reset ? 0 : page;
      const newAssets = await getPublicTimelineAssets(nextPage, PAGE_SIZE, filter);
      setAssets(prev => reset ? newAssets : [...prev, ...newAssets]);
      setHasMore(newAssets.length === PAGE_SIZE);
      setPage(reset ? 1 : page + 1);
    } catch (e) {
      setError("Failed to load timeline. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchAssets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading || !hasMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        fetchAssets();
      }
    });
    if (lastAssetRef.current) {
      observer.current.observe(lastAssetRef.current);
    }
    return () => observer.current?.disconnect();
  }, [loading, hasMore, fetchAssets, assets]);

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="flex gap-2 mb-4">
        {assetTypes.map(t => (
          <button
            key={t.label}
            className={`px-3 py-1 rounded-full border ${filter === t.value ? "bg-black text-white" : "bg-white text-black"}`}
            onClick={() => setFilter(t.value)}
            disabled={loading && filter === t.value}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assets.length === 0 && !loading && !error && (
          <div className="col-span-full text-center text-gray-500 py-12">No assets found.</div>
        )}
        {assets.map((item, i) => (
          <div
            key={item.asset.tokenId}
            ref={i === assets.length - 1 ? lastAssetRef : undefined}
          >
            <IPAssetCard asset={item.asset} metadata={item.metadata ?? null} />
          </div>
        ))}
        {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 h-48 rounded-lg" />
        ))}
      </div>
      {error && <div className="text-red-500 text-center mt-4">{error}</div>}
    </div>
  );
}

export default PublicTimeline;
