import { useEffect, useMemo, useState } from 'react'
import { useEvents, useProvider } from '@starknet-react/core'
import { CONTRACTS } from '@/src/services/constant'
import { num } from 'starknet'

type StartBlock = { mip: number; collection: number }

export interface UseActivitiesOptions {
  userAddress?: string
  pageSize?: number
  startBlock: StartBlock
}

export interface UseActivitiesResult {
  activities: any[]
  loading: boolean
  error: string | null
  onLoadMore: () => Promise<void>
}

export function useActivities({ userAddress, pageSize = 25, startBlock }: UseActivitiesOptions): UseActivitiesResult {
  const { provider } = useProvider()
  const CACHE_TTL_MS = 15 * 60 * 1000

  // Factory events
  const factoryCollectionCreated = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'CollectionCreated',
    fromBlock: startBlock.collection,
    toBlock: 'latest',
    pageSize: 100,
  } as any)
  const factoryTokenMinted = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'TokenMinted',
    fromBlock: startBlock.collection,
    toBlock: 'latest',
    pageSize: 100,
  } as any)
  const factoryTokenMintedBatch = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'TokenMintedBatch',
    fromBlock: startBlock.collection,
    toBlock: 'latest',
    pageSize: 100,
  } as any)
  const factoryTokenBurned = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'TokenBurned',
    fromBlock: startBlock.collection,
    toBlock: 'latest',
    pageSize: 100,
  } as any)
  const factoryOwnershipTransferred = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'OwnershipTransferred',
    fromBlock: startBlock.collection,
    toBlock: 'latest',
    pageSize: 100,
  } as any)

  // NFT events
  const nftTransfer = useEvents({
    address: CONTRACTS.MEDIOLANO as `0x${string}`,
    eventName: 'Transfer',
    fromBlock: startBlock.mip,
    toBlock: 'latest',
    pageSize: 100,
  } as any)
  const nftApproval = useEvents({
    address: CONTRACTS.MEDIOLANO as `0x${string}`,
    eventName: 'Approval',
    fromBlock: startBlock.mip,
    toBlock: 'latest',
    pageSize: 100,
  } as any)

  const flatten = (d: any) => (d?.data?.pages ?? []).flatMap((p: any) => p?.events ?? [])
  const rawFactoryCollectionCreated = flatten(factoryCollectionCreated)
  const rawFactoryTokenMinted = flatten(factoryTokenMinted)
  const rawFactoryTokenMintedBatch = flatten(factoryTokenMintedBatch)
  const rawFactoryTokenBurned = flatten(factoryTokenBurned)
  const rawFactoryOwnershipTransferred = flatten(factoryOwnershipTransferred)
  const rawNftTransfer = flatten(nftTransfer)
  const rawNftApproval = flatten(nftApproval)

  const toHex = (v: any) => { try { return num.toHex(v) } catch { return String(v) } }
  const extractTokenId = (data: any[]) => (data?.length > 2 ? toHex(data[2]) : (data?.length > 0 ? toHex(data[0]) : undefined))
  const extractAddrs = (data: any[]) => ({
    fromAddress: data && data.length > 0 ? toHex(data[0]) : undefined,
    toAddress: data && data.length > 1 ? toHex(data[1]) : undefined,
  })
  const extractNftTransferAddrs = (e: any) => {
    const keys = e?.keys || []
    return {
      fromAddress: keys.length > 1 ? toHex(keys[1]) : undefined,
      toAddress: keys.length > 2 ? toHex(keys[2]) : undefined,
    }
  }

  // Order hashes by newest block first
  const sampleTxHashes = useMemo(() => {
    const all = [
      ...rawNftTransfer,
      ...rawNftApproval,
      ...rawFactoryCollectionCreated,
      ...rawFactoryTokenMinted,
      ...rawFactoryTokenMintedBatch,
      ...rawFactoryTokenBurned,
      ...rawFactoryOwnershipTransferred,
    ]
      .map((e: any) => ({ hash: String(e?.transaction_hash), block: Number(e?.block_number ?? 0) }))
      .filter((e) => !!e.hash)
      .sort((a, b) => b.block - a.block)
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const { hash } of all) {
      if (!seen.has(hash)) {
        seen.add(hash)
        ordered.push(hash)
      }
    }
    return ordered
  }, [
    rawNftTransfer,
    rawNftApproval,
    rawFactoryCollectionCreated,
    rawFactoryTokenMinted,
    rawFactoryTokenMintedBatch,
    rawFactoryTokenBurned,
    rawFactoryOwnershipTransferred,
  ])

  // Voyager data
  const [voyagerTimestamps, setVoyagerTimestamps] = useState<Record<string, string>>({})
  const [voyagerSenders, setVoyagerSenders] = useState<Record<string, string | undefined>>({})
  const [isBatchLoading, setIsBatchLoading] = useState(false)

  // Hydrate cache with TTL
  useEffect(() => {
    try {
      const cache = sessionStorage.getItem('voyagerTxCache')
      if (cache) {
        const now = Date.now()
        const parsed: Record<string, { timestampIso: string; sender?: string; cachedAt?: number }> = JSON.parse(cache)
        const freshEntries = Object.entries(parsed).filter(([, v]) => typeof v?.cachedAt === 'number' ? (now - (v.cachedAt as number) <= CACHE_TTL_MS) : false)
        setVoyagerTimestamps(Object.fromEntries(freshEntries.map(([h, v]) => [h, v.timestampIso])))
        setVoyagerSenders(Object.fromEntries(freshEntries.map(([h, v]) => [h, v.sender?.toLowerCase()])))
      }
    } catch {}
  }, [])

  // Optional: provider tx log throttled (kept minimal)
  const [loggedTx, setLoggedTx] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const toLog = sampleTxHashes.filter((h) => !loggedTx[h]).slice(0, 3)
    if (toLog.length === 0) return
    let alive = true
    ;(async () => {
      for (const h of toLog) {
        try {
          const tx = await (provider as any).getTransactionByHash?.(h)
          if (!alive) break
          if (tx) {}
        } catch {}
      }
      if (!alive) return
      setLoggedTx((prev) => ({ ...prev, ...Object.fromEntries(toLog.map((h) => [h, true])) }))
    })()
    return () => { alive = false }
  }, [sampleTxHashes, provider, loggedTx])

  // Batch fetch unknown/stale hashes via server proxy with TTL persistence
  useEffect(() => {
    const cache: Record<string, { timestampIso: string; sender?: string; cachedAt?: number }> = (() => {
      try { return JSON.parse(sessionStorage.getItem('voyagerTxCache') || '{}') } catch { return {} }
    })()
    const now = Date.now()
    const isFresh = (h: string) => {
      const v = cache[h]
      if (!v || typeof v.cachedAt !== 'number') return false
      return now - v.cachedAt <= CACHE_TTL_MS
    }
    const unknown = sampleTxHashes.filter((h) => !isFresh(h) && (!voyagerTimestamps[h] || voyagerSenders[h] === undefined))
    const toFetch = unknown.slice(0, 100)
    if (toFetch.length === 0) return
    let alive = true
    ;(async () => {
      try {
        setIsBatchLoading(true)
        const res = await fetch('/api/voyager/txn-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hashes: toFetch }),
        })
        if (!res.ok) throw new Error('voyager batch fetch failed')
        const json: Record<string, { timestampIso: string; sender?: string }> = await res.json()
        if (!alive) return
        setVoyagerTimestamps((prev) => {
          const next = { ...prev }
          for (const [h, info] of Object.entries(json)) next[h] = info.timestampIso
          return next
        })
        setVoyagerSenders((prev) => {
          const next = { ...prev }
          for (const [h, info] of Object.entries(json)) next[h] = info.sender?.toLowerCase()
          return next
        })
        try {
          const current: Record<string, { timestampIso: string; sender?: string; cachedAt?: number }> = JSON.parse(sessionStorage.getItem('voyagerTxCache') || '{}')
          const nowTs = Date.now()
          const withTimestamps: Record<string, { timestampIso: string; sender?: string; cachedAt: number }> = {}
          for (const [h, info] of Object.entries(json)) withTimestamps[h] = { ...info, cachedAt: nowTs }
          const merged = { ...current, ...withTimestamps }
          sessionStorage.setItem('voyagerTxCache', JSON.stringify(merged))
        } catch {}
      } catch (e) {
        console.warn('voyager batch fetch error', e)
      } finally {
        if (alive) setIsBatchLoading(false)
      }
    })()
    return () => { alive = false }
  }, [sampleTxHashes, voyagerTimestamps, voyagerSenders])

  // Build activities
  const activities = useMemo(() => {
    if (!userAddress) return []
    
    console.log('[useActivities] Raw events counts:', {
      nftTransfer: rawNftTransfer.length,
      nftApproval: rawNftApproval.length,
      factoryCollectionCreated: rawFactoryCollectionCreated.length,
      factoryTokenMinted: rawFactoryTokenMinted.length,
      factoryTokenMintedBatch: rawFactoryTokenMintedBatch.length,
      factoryTokenBurned: rawFactoryTokenBurned.length,
      factoryOwnershipTransferred: rawFactoryOwnershipTransferred.length,
    })
    
    const items: any[] = []

    for (const e of rawNftTransfer) {
      const { fromAddress, toAddress } = extractNftTransferAddrs(e)
      const ts = voyagerTimestamps[String(e.transaction_hash)] || new Date().toISOString()
      const base = {
        id: `${e.transaction_hash}_${e.block_number}`,
        network: 'Starknet',
        hash: e.transaction_hash,
        timestamp: ts,
        status: 'completed' as const,
        metadata: { blockNumber: Number(e.block_number ?? 0), contractAddress: CONTRACTS.MEDIOLANO },
      }
      const zero = '0x0'
      if ((fromAddress || '').toLowerCase() === zero) {
        items.push({ ...base, type: 'mint', title: 'Minted IP Asset', description: `Minted to ${toAddress}`, assetId: extractTokenId(e.data || []), fromAddress, toAddress })
        continue
      }
      if ((toAddress || '').toLowerCase() === zero) {
        items.push({ ...base, type: 'burn', title: 'Burned IP Asset', description: `Burned from ${fromAddress}`, assetId: extractTokenId(e.data || []), fromAddress, toAddress })
        continue
      }
      const isOutgoing = userAddress && fromAddress?.toLowerCase() === userAddress.toLowerCase()
      items.push({ ...base, type: isOutgoing ? 'transfer_out' : 'transfer_in', title: isOutgoing ? 'Transferred IP Asset' : 'Received IP Asset', description: isOutgoing ? `Transferred asset to ${toAddress}` : `Received asset from ${fromAddress}`, assetId: extractTokenId(e.data || []), fromAddress, toAddress })
    }

    const baseFor = (e: any) => ({
      id: `${e.transaction_hash}_${e.block_number}`,
      network: 'Starknet',
      hash: e.transaction_hash,
      timestamp: voyagerTimestamps[String(e.transaction_hash)] || new Date().toISOString(),
      status: 'completed',
      metadata: { blockNumber: Number(e.block_number ?? 0), contractAddress: CONTRACTS.COLLECTION_FACTORY },
    })

    for (const e of rawFactoryCollectionCreated) {
      const { fromAddress, toAddress } = extractAddrs(e.data || [])
      items.push({ ...baseFor(e), type: 'collection_create', title: 'Created New Collection', description: 'Successfully created a new IP collection', fromAddress, toAddress })
    }
    for (const e of rawFactoryTokenMinted) {
      const { fromAddress, toAddress } = extractAddrs(e.data || [])
      items.push({ ...baseFor(e), type: 'mint', title: 'Minted IP Asset', description: 'Successfully minted a new intellectual property asset', assetId: extractTokenId(e.data || []), fromAddress, toAddress })
    }
    for (const e of rawFactoryTokenMintedBatch) {
      const { fromAddress, toAddress } = extractAddrs(e.data || [])
      items.push({ ...baseFor(e), type: 'mint_batch', title: 'Minted Multiple IP Assets', description: 'Successfully minted multiple intellectual property assets', fromAddress, toAddress })
    }
    for (const e of rawFactoryTokenBurned) {
      const { fromAddress, toAddress } = extractAddrs(e.data || [])
      items.push({ ...baseFor(e), type: 'burn', title: 'Burned IP Asset', description: 'IP asset has been permanently destroyed', assetId: extractTokenId(e.data || []), fromAddress, toAddress })
    }
    for (const e of rawFactoryOwnershipTransferred) {
      const { fromAddress, toAddress } = extractAddrs(e.data || [])
      const isOutgoing = userAddress && fromAddress?.toLowerCase() === userAddress.toLowerCase()
      items.push({ ...baseFor(e), type: isOutgoing ? 'transfer_out' : 'transfer_in', title: isOutgoing ? 'Transferred Ownership' : 'Received Ownership', description: isOutgoing ? `Transferred ownership to ${toAddress}` : `Received ownership from ${fromAddress}`, fromAddress, toAddress })
    }

    // NFT Approvals (owner -> approved for tokenId)
    for (const e of rawNftApproval) {
      const { fromAddress, toAddress } = extractAddrs(e.data || [])
      const ts = voyagerTimestamps[String(e.transaction_hash)] || new Date().toISOString()
      items.push({
        id: `${e.transaction_hash}_${e.block_number}`,
        network: 'Starknet',
        hash: e.transaction_hash,
        timestamp: ts,
        status: 'completed' as const,
        type: 'approval',
        title: 'Approval Granted',
        description: `Approved ${toAddress} for token ${extractTokenId(e.data || [])}`,
        assetId: extractTokenId(e.data || []),
        fromAddress,
        toAddress,
        metadata: { blockNumber: Number(e.block_number ?? 0), contractAddress: CONTRACTS.MEDIOLANO },
      })
    }

    // Filter by current user address transactions
    const normalizedAddress = userAddress?.toLowerCase()
    const filtered = normalizedAddress
      ? items.filter((item) => {
          const from = item.fromAddress?.toLowerCase()
          const to = item.toAddress?.toLowerCase()
          const sender = voyagerSenders[String(item.hash)]
          return (
            (from && from === normalizedAddress) ||
            (to && to === normalizedAddress) ||
            (sender && sender === normalizedAddress)
          )
        })
      : items
    
    console.log('[useActivities] Total items fetched:', items.length, 'Filtered for user:', filtered.length, 'User:', normalizedAddress)
    
    return filtered.sort((a, b) => {
      const ta = Date.parse(a.timestamp || '') || 0
      const tb = Date.parse(b.timestamp || '') || 0
      if (tb !== ta) return tb - ta
      return (b.metadata?.blockNumber ?? 0) - (a.metadata?.blockNumber ?? 0)
    })
  }, [
    rawNftTransfer,
    rawNftApproval,
    rawFactoryCollectionCreated,
    rawFactoryTokenMinted,
    rawFactoryTokenMintedBatch,
    rawFactoryTokenBurned,
    rawFactoryOwnershipTransferred,
    userAddress,
    voyagerTimestamps,
    voyagerSenders,
  ])

  const loading =
    nftTransfer.isPending || nftTransfer.isFetching ||
    nftApproval.isPending || nftApproval.isFetching ||
    factoryCollectionCreated.isPending || factoryCollectionCreated.isFetching ||
    factoryTokenMinted.isPending || factoryTokenMinted.isFetching ||
    factoryTokenMintedBatch.isPending || factoryTokenMintedBatch.isFetching ||
    factoryTokenBurned.isPending || factoryTokenBurned.isFetching ||
    factoryOwnershipTransferred.isPending || factoryOwnershipTransferred.isFetching ||
    isBatchLoading

  const error =
    (nftTransfer.error as any)?.message ||
    (nftApproval.error as any)?.message ||
    (factoryCollectionCreated.error as any)?.message ||
    (factoryTokenMinted.error as any)?.message ||
    (factoryTokenMintedBatch.error as any)?.message ||
    (factoryTokenBurned.error as any)?.message ||
    (factoryOwnershipTransferred.error as any)?.message ||
    null

  const onLoadMore = async () => {
    if (nftTransfer.hasNextPage) await nftTransfer.fetchNextPage()
    if (nftApproval.hasNextPage) await nftApproval.fetchNextPage()
    if (factoryCollectionCreated.hasNextPage) await factoryCollectionCreated.fetchNextPage()
    if (factoryTokenMinted.hasNextPage) await factoryTokenMinted.fetchNextPage()
    if (factoryTokenMintedBatch.hasNextPage) await factoryTokenMintedBatch.fetchNextPage()
    if (factoryTokenBurned.hasNextPage) await factoryTokenBurned.fetchNextPage()
    if (factoryOwnershipTransferred.hasNextPage) await factoryOwnershipTransferred.fetchNextPage()
  }

  return { activities, loading, error, onLoadMore }
}


