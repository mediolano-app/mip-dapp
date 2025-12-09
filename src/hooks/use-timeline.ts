import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { timelineService, type TimelineFilters } from "@/src/services/timeline.service";
import type { AssetIP } from "@/src/types/asset";

export interface UseTimelineOptions {
  initialLimit?: number;
  autoLoad?: boolean;
  filters?: TimelineFilters;
}

export interface UseTimelineReturn {
  assets: AssetIP[];
  stats: any;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalAssets: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  updateFilters: (newFilters: Partial<TimelineFilters>) => void;
  clearFilters: () => void;
  activeFilters: TimelineFilters;
  filterCount: number;
}

const DEFAULT_FILTERS: TimelineFilters = {
  sortBy: "mintedAtBlock",
  sortOrder: "desc",
};

const DEFAULT_LIMIT = 20;

export function useTimeline(options: UseTimelineOptions = {}): UseTimelineReturn {
  const {
    initialLimit = DEFAULT_LIMIT,
    autoLoad = true,
    filters: initialFilters = {},
  } = options;

  const [rawAssets, setRawAssets] = useState<AssetIP[]>([]); 
  const [assets, setAssets] = useState<AssetIP[]>([]); 
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);

  const [lastRequestTime, setLastRequestTime] = useState(0);
  const REQUEST_THROTTLE_MS = 2000; // Minimum 2 seconds between requests

  const [activeFilters, setActiveFilters] = useState<TimelineFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Refs for infinite scroll and request cancellation
  const loadingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 10; 
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized filter count for UI
  const filterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.search) count++;
    if (activeFilters.indexerSource) count++;
    if (activeFilters.collectionId) count++;
    if (activeFilters.assetTypes?.length) count += activeFilters.assetTypes.length;
    if (activeFilters.licenses?.length) count += activeFilters.licenses.length;
    if (activeFilters.verifiedOnly) count++;
    if (activeFilters.sortBy !== DEFAULT_FILTERS.sortBy) count++;
    if (activeFilters.sortOrder !== DEFAULT_FILTERS.sortOrder) count++;
    return count;
  }, [activeFilters]);

  /**
   * Load initial data or refresh
   */
  const loadAssets = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      
      // Throttle requests to prevent spam
      const now = Date.now();
      if (now - lastRequestTime < REQUEST_THROTTLE_MS) {
        return;
      }
      setLastRequestTime(now);
      
      // Cancel previous request if still in flight
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      loadingRef.current = true;
      const offset = reset ? 0 : rawAssets.length;
      
      if (reset) {
        setIsLoading(true);
        setCurrentPage(0);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await timelineService.getTimelineAssets(
          initialLimit,
          offset,
          activeFilters,
          abortControllerRef.current.signal
        );

        if (reset) {
          setRawAssets(response.assets);
        } else {
          setRawAssets((prev) => [...prev, ...response.assets]);
        }

        setHasMore(response.pagination.hasMore);
        setTotalAssets(response.pagination.total);
        setCurrentPage(Math.floor(offset / initialLimit) + 1);
        
        // Reset retry count on success
        retryCountRef.current = 0;
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        const errorMessage = err instanceof Error ? err.message : "Failed to load timeline assets";
        
        if (rawAssets.length === 0) {
          setError(errorMessage);
        } else {
          
        }
        
        // Retry logic for network errors
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(() => {
            loadingRef.current = false;
            loadAssets(reset);
          }, 1000 * retryCountRef.current);
          return;
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [rawAssets.length, activeFilters, initialLimit]
  );

  /**
   * Load more assets for infinite scroll
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;
    await loadAssets(false);
  }, [hasMore, loadAssets]);

  /**
   * Refresh timeline (reset and reload)
   */
  const refresh = useCallback(async () => {
    await loadAssets(true);
  }, [loadAssets]);

  /**
   * Update filters and refresh
   */
  const updateFilters = useCallback(
    (newFilters: Partial<TimelineFilters>) => {
      const updatedFilters = { ...activeFilters, ...newFilters };
      const backendFiltersChanged = (
        activeFilters.sortBy !== newFilters.sortBy ||
        activeFilters.sortOrder !== newFilters.sortOrder ||
        activeFilters.indexerSource !== newFilters.indexerSource ||
        activeFilters.collectionId !== newFilters.collectionId
      );
      
      setActiveFilters(updatedFilters);
      
      if (backendFiltersChanged) {
        setRawAssets([]);
        setAssets([]);
        setCurrentPage(0);
        setHasMore(true);
        setError(null);
      }
    },
    [activeFilters]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setActiveFilters(DEFAULT_FILTERS);
    setRawAssets([]);
    setAssets([]);
    setCurrentPage(0);
    setHasMore(true);
  }, []);

  /**
   * Load stats
   */
  const loadStats = useCallback(async () => {
    try {
      const statsData = await timelineService.getTimelineStats();
      setStats(statsData);
    } catch (err) {
      
    }
  }, []);

  // Auto-load initial data on mount
  useEffect(() => {
    if (autoLoad) {
      loadAssets(true);
    }
  }, [autoLoad]); 

  useEffect(() => {
    if (rawAssets.length > 0) {
      const filteredAssets = timelineService.applyClientFiltersPublic(rawAssets, activeFilters);
      setAssets(filteredAssets);
    } else {
      setAssets([]);
    }
  }, [rawAssets, activeFilters]);

  const filterChangeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    // Only trigger API reload if we need new data from backend
    const needsApiReload = (
      rawAssets.length === 0 && !isLoading && !isLoadingMore
    );

    if (needsApiReload) {
      if (filterChangeTimeoutRef.current) {
        clearTimeout(filterChangeTimeoutRef.current);
      }

      filterChangeTimeoutRef.current = setTimeout(() => {
        loadAssets(true);
      }, 100); 

      return () => {
        if (filterChangeTimeoutRef.current) {
          clearTimeout(filterChangeTimeoutRef.current);
        }
      };
    }
  }, [activeFilters, rawAssets.length, isLoading, isLoadingMore, loadAssets]);

  // Load stats on mount only once
  useEffect(() => {
    if (autoLoad) {
      loadStats();
    }
  }, [autoLoad, loadStats]); 

  // Intersection Observer for infinite scroll
  useEffect(() => {
    let observer: IntersectionObserver;

    const setupInfiniteScroll = () => {
      const options = {
        root: null,
        rootMargin: "200px", // Trigger 200px before reaching bottom
        threshold: 0,
      };

      observer = new IntersectionObserver((entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMore();
        }
      }, options);

      // Find scroll trigger element
      const scrollTrigger = document.querySelector("[data-timeline-scroll-trigger]");
      if (scrollTrigger) {
        observer.observe(scrollTrigger);
      }
    };

    // Setup observer after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(setupInfiniteScroll, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Refresh on Ctrl/Cmd + R
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        refresh();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [refresh]);

  return {
    assets,
    stats,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    currentPage,
    totalAssets,
    loadMore,
    refresh,
    updateFilters,
    clearFilters,
    activeFilters,
    filterCount,
  };
}

/**
 * Hook for managing timeline scroll position
 */
export function useTimelineScroll() {
  const [scrollY, setScrollY] = useState(0);
  const [isNearTop, setIsNearTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsNearTop(currentScrollY < 100);
    };

    const throttledHandleScroll = throttle(handleScroll, 100);
    window.addEventListener("scroll", throttledHandleScroll);
    
    return () => window.removeEventListener("scroll", throttledHandleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    scrollY,
    isNearTop,
    scrollToTop,
  };
}

/**
 * Simple throttle utility
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}
