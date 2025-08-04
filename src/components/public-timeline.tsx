'use client'; 
import React, { useEffect, useRef, useState, useCallback } from 'react';

// Types for asset metadata
interface IPAssetMetadata {
  id: string;
  author: string;
  title: string;
  description: string;
  license: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'other';
  timestamp: string;
  assetType: 'art' | 'music' | 'docs' | 'other';
}

// Placeholder for asset card
const IPAssetCard: React.FC<{ asset: IPAssetMetadata }> = ({ asset }) => {
  return (
    <div className="ip-asset-card">
      <div className="media">
        {/* Media rendering logic will go here */}
        <span>{asset.mediaType.toUpperCase()}</span>
      </div>
      <div className="meta">
        <h3>{asset.title}</h3>
        <p>By: {asset.author}</p>
        <p>{asset.description}</p>
        <p>License: {asset.license}</p>
        <p>{new Date(asset.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
};

// Skeleton loader for cards
const IPAssetCardSkeleton: React.FC = () => (
  <div className="ip-asset-card skeleton">
    <div className="media skeleton-box" />
    <div className="meta">
      <div className="skeleton-box" style={{ width: '60%', height: 20, marginBottom: 8 }} />
      <div className="skeleton-box" style={{ width: '40%', height: 16, marginBottom: 8 }} />
      <div className="skeleton-box" style={{ width: '80%', height: 14, marginBottom: 8 }} />
      <div className="skeleton-box" style={{ width: '30%', height: 12, marginBottom: 8 }} />
    </div>
  </div>
);

// Empty state
const EmptyState: React.FC = () => (
  <div className="empty-state">
    <p>No IP assets found. Try a different filter or check back later.</p>
  </div>
);

// Error state
const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="error-state">
    <p>Error: {message}</p>
  </div>
);

// Asset type filter
const AssetTypeFilter: React.FC<{
  value: string;
  onChange: (type: string) => void;
}> = ({ value, onChange }) => (
  <div className="asset-type-filter">
    <label>Filter by type: </label>
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="all">All</option>
      <option value="art">Art</option>
      <option value="music">Music</option>
      <option value="docs">Docs</option>
      <option value="other">Other</option>
    </select>
  </div>
);

// Main PublicTimeline component
export const PublicTimeline: React.FC = () => {
  const [assets, setAssets] = useState<IPAssetMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch assets (placeholder, to be replaced with real fetch logic)
  const fetchAssets = useCallback(async (pageNum: number, filterType: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with real fetch from Mediolano Protocol + IPFS
      // Simulate network delay and data
      await new Promise(res => setTimeout(res, 1000));
      const fakeAssets: IPAssetMetadata[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${pageNum}-${i}`,
        author: `0xAuthor${i}`,
        title: `Sample Asset ${pageNum * 10 + i + 1}`,
        description: 'This is a sample description.',
        license: 'CC-BY-4.0',
        mediaUrl: '',
        mediaType: ['image', 'video', 'audio', 'other'][i % 4] as any,
        timestamp: new Date(Date.now() - (pageNum * 10 + i) * 60000).toISOString(),
        assetType: ['art', 'music', 'docs', 'other'][i % 4] as any,
      })).filter(a => filterType === 'all' || a.assetType === filterType);
      setAssets(prev => [...prev, ...fakeAssets]);
      setHasMore(fakeAssets.length > 0);
    } catch (err) {
      setError('Failed to load assets.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset on filter change
  useEffect(() => {
    setAssets([]);
    setPage(0);
    setHasMore(true);
  }, [filter]);

  // Fetch on page/filter change
  useEffect(() => {
    if (hasMore && !loading) {
      fetchAssets(page, filter);
    }
  }, [page, filter, fetchAssets, hasMore, loading]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1);
      }
    });
    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }
    return () => observer.current?.disconnect();
  }, [loading, hasMore]);

  return (
    <div className="public-timeline">
      <AssetTypeFilter value={filter} onChange={setFilter} />
      <div className="timeline-list">
        {assets.length === 0 && loading && (
          <>
            {Array.from({ length: 5 }).map((_, i) => <IPAssetCardSkeleton key={i} />)}
          </>
        )}
        {assets.length === 0 && !loading && !error && <EmptyState />}
        {error && <ErrorState message={error} />}
        {assets.map(asset => (
          <IPAssetCard asset={asset} key={asset.id} />
        ))}
      </div>
      <div ref={loadMoreRef} style={{ height: 1 }} />
      {loading && assets.length > 0 && (
        <div className="timeline-loading">
          {Array.from({ length: 2 }).map((_, i) => <IPAssetCardSkeleton key={i} />)}
        </div>
      )}
      {!hasMore && assets.length > 0 && (
        <div className="timeline-end">No more assets to load.</div>
      )}
    </div>
  );
};

export default PublicTimeline;
3