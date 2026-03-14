import { useEffect, useMemo, useState } from 'react'
import { useEvents, useProvider } from '@starknet-react/core'
import { CONTRACTS } from '@/src/services/constant'
import { num } from 'starknet'

type StartBlock = { mip: number }

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

  console.log('[useActivities] Initializing with startBlock:', startBlock, 'userAddress:', userAddress)

  // NFT events
  const nftTransfer = useEvents({
    address: CONTRACTS.MEDIOLANO as `0x${string}`,
    eventName: 'Transfer',
    fromBlock: startBlock.mip,
    toBlock: 'latest',
    pageSize: 100,
    refetchInterval: false,
  } as any)
  const nftApproval = useEvents({
    address: CONTRACTS.MEDIOLANO as `0x${string}`,
    eventName: 'Approval',
    fromBlock: startBlock.mip,
    toBlock: 'latest',
    pageSize: 100,
    refetchInterval: false,
  } as any)

  const flatten = (d: any) => (d?.data?.pages ?? []).flatMap((p: any) => p?.events ?? [])
  const rawNftTransfer = flatten(nftTransfer)
  const rawNftApproval = flatten(nftApproval)

  const toHex = (v: any) => { try { return num.toHex(v) } catch { return String(v) } }
  const extractTokenId = (data: any[]) => (data?.length > 2 ? toHex(data[2]) : (data?.length > 0 ? toHex(data[0]) : undefined))
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
    } catch { }
  }, [])

  // Optional: provider tx log throttled (kept minimal)
  const [loggedTx, setLoggedTx] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const toLog = sampleTxHashes.filter((h) => !loggedTx[h]).slice(0, 3)
    if (toLog.length === 0) return
    let alive = true
      ; (async () => {
        for (const h of toLog) {
          try {
            const tx = await (provider as any).getTransactionByHash?.(h)
            if (!alive) break
            if (tx) { }
          } catch { }
        }
        if (!alive) return
        setLoggedTx((prev) => ({ ...prev, ...Object.fromEntries(toLog.map((h) => [h, true])) }))
      })()
    return () => { alive = false }
  }, [sampleTxHashes, provider])

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
      ; (async () => {
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
          } catch { }
        } catch (e) {
          console.warn('voyager batch fetch error', e)
        } finally {
          if (alive) setIsBatchLoading(false)
        }
      })()
    return () => { alive = false }
  }, [sampleTxHashes])

  // Build activities
  const activities = useMemo(() => {
    console.log('[useActivities] Raw events counts:', {
      nftTransfer: rawNftTransfer.length,
      nftApproval: rawNftApproval.length,
    })

    // Debug hook states
    console.log('[useActivities] Hook states:', {
      nftTransfer_pending: nftTransfer.isPending, nftTransfer_error: (nftTransfer.error as any)?.message,
      nftApproval_pending: nftApproval.isPending, nftApproval_error: (nftApproval.error as any)?.message,
    })

    const items: any[] = []

    for (const e of rawNftTransfer) {
      const { fromAddress, toAddress } = extractNftTransferAddrs(e)
      const ts = voyagerTimestamps[String(e.transaction_hash)] || ''
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

    // NFT Approvals (owner -> approved for tokenId)
    for (const e of rawNftApproval) {
      const keys = e?.keys || []
      // Approval: [owner, approved, tokenId_low, tokenId_high] -> standard is [owner, approved, tokenId]
      // StarkNet ERC721 Approval event: owner, approved, token_id
      // keys: [Approval_selector, owner, approved, token_id_low, token_id_high]
      // Or sometimes it's index 1 and 2
      const owner = keys.length > 1 ? toHex(keys[1]) : undefined
      const approved = keys.length > 2 ? toHex(keys[2]) : undefined

      const ts = voyagerTimestamps[String(e.transaction_hash)] || ''
      items.push({
        id: `${e.transaction_hash}_${e.block_number}`,
        network: 'Starknet',
        hash: e.transaction_hash,
        timestamp: ts,
        status: 'completed' as const,
        type: 'approval',
        title: 'Approval Granted',
        description: `Approved ${approved} for token ${extractTokenId(e.data || [])}`,
        assetId: extractTokenId(e.data || []),
        fromAddress: owner,
        toAddress: approved,
        metadata: { blockNumber: Number(e.block_number ?? 0), contractAddress: CONTRACTS.MEDIOLANO },
      })
    }

    // Filter by current user address transactions
    // Note: If userAddress is provided, filter to user-specific activities
    // If not provided, return all activities
    const normalizedAddress = userAddress?.toLowerCase()
    const filtered = items // Return all items regardless of user

    console.log('[useActivities] Total items before user filter:', items.length, 'Filtered:', filtered.length, 'User:', normalizedAddress)

    return filtered.sort((a, b) => {
      const ta = Date.parse(a.timestamp || '') || 0
      const tb = Date.parse(b.timestamp || '') || 0
      if (tb !== ta) return tb - ta
      return (b.metadata?.blockNumber ?? 0) - (a.metadata?.blockNumber ?? 0)
    })
  }, [
    rawNftTransfer,
    rawNftApproval,
    userAddress,
    voyagerTimestamps,
    voyagerSenders,
  ])

  const loading =
    nftTransfer.isPending || nftTransfer.isFetching ||
    nftApproval.isPending || nftApproval.isFetching ||
    isBatchLoading

  const error =
    (nftTransfer.error as any)?.message ||
    (nftApproval.error as any)?.message ||
    null

  const onLoadMore = async () => {
    if (nftTransfer.hasNextPage) await nftTransfer.fetchNextPage()
    if (nftApproval.hasNextPage) await nftApproval.fetchNextPage()
  }

  return { activities, loading, error, onLoadMore }
}


