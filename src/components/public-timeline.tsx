'use client'; 
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchLatestAssets, PublicTimelineAsset } from '../services/public-timeline.service';

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
  const [mediaError, setMediaError] = React.useState(false);
  let mediaContent = null;
  if (asset.mediaUrl && !mediaError) {
    if (asset.mediaType === 'image') {
      mediaContent = (
        <img
          src={asset.mediaUrl}
          alt={asset.title}
          onError={() => setMediaError(true)}
          style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8 }}
        />
      );
    } else if (asset.mediaType === 'video') {
      mediaContent = (
        <video
          src={asset.mediaUrl}
          controls
          onError={() => setMediaError(true)}
          style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8 }}
        />
      );
    } else if (asset.mediaType === 'audio') {
      mediaContent = (
        <audio
          src={asset.mediaUrl}
          controls
          onError={() => setMediaError(true)}
          style={{ width: '100%' }}
        />
      );
    }
  }
  return (
    <div className="ip-asset-card">
      <div className="media">
        {mediaContent || (
          <div className="media-fallback">
            <span>{mediaError ? 'Media failed to load' : asset.mediaType.toUpperCase()}</span>
          </div>
        )}
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


  // Fetch assets from Mediolano Protocol + IPFS
  const fetchAssets = useCallback(async (pageNum: number, filterType: string) => {
    setLoading(true);
    setError(null);
    try {
      const realAssets = await fetchLatestAssets({ page: pageNum, pageSize: 10, filterType });
      const mappedAssets: IPAssetMetadata[] = realAssets.map((a: PublicTimelineAsset) => ({
        id: a.tokenId,
        author: a.metadata?.author || 'Unknown',
        title: a.metadata?.title || 'Untitled',
        description: a.metadata?.description || '',
        license: a.metadata?.license || '',
        mediaUrl: a.metadata?.mediaUrl || '',
        mediaType: a.metadata?.mediaType || 'other',
        timestamp: a.metadata?.timestamp || '',
        assetType: a.metadata?.assetType || 'other',
      }));
      setAssets(prev => [...prev, ...mappedAssets]);
      setHasMore(realAssets.length > 0);
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