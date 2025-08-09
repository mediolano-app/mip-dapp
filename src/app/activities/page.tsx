"use client"

import { Activities } from "@/src/components/activities"
import { toast } from "@/src/hooks/use-toast"
import { useProvider } from "@starknet-react/core"
import { useEvents } from "@starknet-react/core"
import { CONTRACTS } from "@/src/services/constant"
import { useMemo, useEffect, useState } from "react"
import { num } from "starknet"
import { useRouter } from "next/navigation"
import { getWalletData } from "@/src/app/onboarding/_actions"

export default function ActivitiesPage() {
  const { provider } = useProvider()
  const [userAddress, setUserAddress] = useState<string | undefined>(undefined)
  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://voyager.online'
  const pageSize = 25
  const startBlock = 1570147
  const router = useRouter()

  // Load user wallet data on component mount 
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const walletData = await getWalletData()
        if (!alive) return
        if (walletData?.publicKey) setUserAddress(walletData.publicKey)
      } catch (error) {
        console.error('Error loading user wallet:', error)
      }
    })()
    return () => { alive = false }
  }, [])
  const factoryCollectionCreated = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'CollectionCreated',
    fromBlock: startBlock,
    toBlock: 'latest',
    pageSize,
  } as any)
  const factoryTokenMinted = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'TokenMinted',
    fromBlock: startBlock,
    toBlock: 'latest',
    pageSize,
  } as any)
  const factoryTokenMintedBatch = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'TokenMintedBatch',
    fromBlock: startBlock,
    toBlock: 'latest',
    pageSize,
  } as any)
  const factoryTokenBurned = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'TokenBurned',
    fromBlock: startBlock,
    toBlock: 'latest',
    pageSize,
  } as any)
  const factoryOwnershipTransferred = useEvents({
    address: CONTRACTS.COLLECTION_FACTORY as `0x${string}`,
    eventName: 'OwnershipTransferred',
    fromBlock: startBlock,
    toBlock: 'latest',
    pageSize,
  } as any)

  // NFT events
  const nft = useEvents({
    address: CONTRACTS.MEDIOLANO as `0x${string}`,
    eventName: 'Transfer',
    fromBlock: startBlock,
    toBlock: 'latest',
    pageSize,
  } as any)


  const flatten = (d: any) => (d?.data?.pages ?? []).flatMap((p: any) => p?.events ?? [])
  const rawFactoryCollectionCreated = flatten(factoryCollectionCreated)
  const rawFactoryTokenMinted = flatten(factoryTokenMinted)
  const rawFactoryTokenMintedBatch = flatten(factoryTokenMintedBatch)
  const rawFactoryTokenBurned = flatten(factoryTokenBurned)
  const rawFactoryOwnershipTransferred = flatten(factoryOwnershipTransferred)
  const rawNft = flatten(nft)

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

  const sampleTxHashes = useMemo(() => {
    const hashes = [
      ...rawNft,
      ...rawFactoryCollectionCreated,
      ...rawFactoryTokenMinted,
      ...rawFactoryTokenMintedBatch,
      ...rawFactoryTokenBurned,
      ...rawFactoryOwnershipTransferred,
    ].map((e: any) => String(e?.transaction_hash)).filter(Boolean)
    return Array.from(new Set(hashes)) as string[]
  }, [
    rawNft,
    rawFactoryCollectionCreated,
    rawFactoryTokenMinted,
    rawFactoryTokenMintedBatch,
    rawFactoryTokenBurned,
    rawFactoryOwnershipTransferred,
  ])

  const [loggedTx, setLoggedTx] = useState<Record<string, boolean>>({})
  const [voyagerTimestamps, setVoyagerTimestamps] = useState<Record<string, string>>({})
  const [voyagerSenders, setVoyagerSenders] = useState<Record<string, string | undefined>>({})
  useEffect(() => {
    const toLog = sampleTxHashes.filter((h) => !loggedTx[h]).slice(0, 5)
    if (toLog.length === 0) return
    let alive = true
    ;(async () => {
      for (const h of toLog) {
        try {
          const tx = await (provider as any).getTransactionByHash?.(h)
          if (!alive) break
        } catch (err) {
          console.warn('getTransactionByHash error', h, err)
        }
      }
      if (!alive) return
      setLoggedTx((prev) => ({ ...prev, ...Object.fromEntries(toLog.map((h) => [h, true])) }))
    })()
    return () => { alive = false }
  }, [sampleTxHashes, provider, loggedTx])

  
  useEffect(() => {
    const toFetch = sampleTxHashes.slice(0, 50)
    if (toFetch.length === 0) return
    let alive = true
    ;(async () => {
      const entries = await Promise.all(
        toFetch.slice(0, 20).map(async (h) => {
          try {
            const res = await fetch(`${explorerUrl}/api/txn/${h}`)
            if (!res.ok) throw new Error('voyager fetch failed')
            const json = await res.json()
            const ts = json?.header?.timestamp
            const iso = ts ? new Date(ts * 1000).toISOString() : new Date().toISOString()
            const senderCandidate =
              json?.header?.sender_address ??
              json?.sender_address ??
              json?.senderAddress ??
              json?.meta?.sender_address ??
              json?.data?.sender_address
            const sender = senderCandidate ? String(senderCandidate) : undefined
            return [h, { iso, sender }] as const
          } catch {
            return [h, { iso: new Date().toISOString(), sender: undefined }] as const
          }
        })
      )
      if (!alive) return
      setVoyagerTimestamps((prev) => {
        const next = { ...prev }
        for (const [h, info] of entries) next[h] = info.iso
        return next
      })
      setVoyagerSenders((prev) => {
        const next = { ...prev }
        for (const [h, info] of entries) next[h] = info.sender?.toLowerCase()
        return next
      })
    })()
    return () => { alive = false }
  }, [sampleTxHashes, explorerUrl])

  const activities = useMemo(() => {
    const items: any[] = []

    // NFT Transfers 
    for (const e of rawNft) {
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
        // Mint
        items.push({
          ...base,
          type: 'mint',
          title: 'Minted IP Asset',
          description: `Minted to ${toAddress}`,
          assetId: extractTokenId(e.data || []),
          fromAddress,
          toAddress,
        })
        continue
      }
      if ((toAddress || '').toLowerCase() === zero) {
        // Burn
        items.push({
          ...base,
          type: 'burn',
          title: 'Burned IP Asset',
          description: `Burned from ${fromAddress}`,
          assetId: extractTokenId(e.data || []),
          fromAddress,
          toAddress,
        })
        continue
      }
      const isOutgoing = userAddress && fromAddress?.toLowerCase() === userAddress.toLowerCase()
      items.push({
        ...base,
        type: isOutgoing ? 'transfer_out' : 'transfer_in',
        title: isOutgoing ? 'Transferred IP Asset' : 'Received IP Asset',
        description: isOutgoing ? `Transferred asset to ${toAddress}` : `Received asset from ${fromAddress}`,
        assetId: extractTokenId(e.data || []),
        fromAddress,
        toAddress,
      })
    }

  const baseFor = (e: any) => ({
      id: `${e.transaction_hash}_${e.block_number}`,
      network: 'Starknet',
      hash: e.transaction_hash,
      timestamp: voyagerTimestamps[String(e.transaction_hash)] || new Date().toISOString(),
      status: 'completed',
      metadata: { blockNumber: Number(e.block_number ?? 0), contractAddress: CONTRACTS.COLLECTION_FACTORY },
    })

    for (const e of rawFactoryCollectionCreated) items.push({ ...baseFor(e), type: 'collection_create', title: 'Created New Collection', description: 'Successfully created a new IP collection' })
    for (const e of rawFactoryTokenMinted) items.push({ ...baseFor(e), type: 'mint', title: 'Minted IP Asset', description: 'Successfully minted a new intellectual property asset', assetId: extractTokenId(e.data || []) })
    for (const e of rawFactoryTokenMintedBatch) items.push({ ...baseFor(e), type: 'mint_batch', title: 'Minted Multiple IP Assets', description: 'Successfully minted multiple intellectual property assets' })
    for (const e of rawFactoryTokenBurned) items.push({ ...baseFor(e), type: 'burn', title: 'Burned IP Asset', description: 'IP asset has been permanently destroyed', assetId: extractTokenId(e.data || []) })
    for (const e of rawFactoryOwnershipTransferred) {
      const { fromAddress, toAddress } = extractAddrs(e.data || [])
      const isOutgoing = userAddress && fromAddress?.toLowerCase() === userAddress.toLowerCase()
      items.push({
        ...baseFor(e),
        type: isOutgoing ? 'transfer_out' : 'transfer_in',
        title: isOutgoing ? 'Transferred Ownership' : 'Received Ownership',
        description: isOutgoing ? `Transferred ownership to ${toAddress}` : `Received ownership from ${fromAddress}`,
        fromAddress,
        toAddress,
      })
    }

    const normalizedAddress = userAddress?.toLowerCase()
    const filtered = normalizedAddress
      ? items.filter((item) => {
          const sender = voyagerSenders[String(item.hash)]
          return sender && sender === normalizedAddress
        })
      : items

    return filtered.sort((a, b) => (b.metadata?.blockNumber ?? 0) - (a.metadata?.blockNumber ?? 0))
  }, [
    rawNft,
    rawFactoryCollectionCreated,
    rawFactoryTokenMinted,
    rawFactoryTokenMintedBatch,
    rawFactoryTokenBurned,
    rawFactoryOwnershipTransferred,
    userAddress,
    voyagerTimestamps,
    voyagerSenders,
  ])
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Transaction hash copied to clipboard",
    })
  }

  const handleCreateNew = () => {
    router.push('/create-asset')
  }

  const loading =
    nft.isPending || nft.isFetching ||
    factoryCollectionCreated.isPending || factoryCollectionCreated.isFetching ||
    factoryTokenMinted.isPending || factoryTokenMinted.isFetching ||
    factoryTokenMintedBatch.isPending || factoryTokenMintedBatch.isFetching ||
    factoryTokenBurned.isPending || factoryTokenBurned.isFetching ||
    factoryOwnershipTransferred.isPending || factoryOwnershipTransferred.isFetching

  const error =
    (nft.error as any)?.message ||
    (factoryCollectionCreated.error as any)?.message ||
    (factoryTokenMinted.error as any)?.message ||
    (factoryTokenMintedBatch.error as any)?.message ||
    (factoryTokenBurned.error as any)?.message ||
    (factoryOwnershipTransferred.error as any)?.message ||
    null

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
   
      <Activities
        activities={activities}
        loading={loading}
        error={error}
        onCopyToClipboard={handleCopyToClipboard}
        onLoadMore={async () => {
          if (nft.hasNextPage) await nft.fetchNextPage()
          if (factoryCollectionCreated.hasNextPage) await factoryCollectionCreated.fetchNextPage()
          if (factoryTokenMinted.hasNextPage) await factoryTokenMinted.fetchNextPage()
          if (factoryTokenMintedBatch.hasNextPage) await factoryTokenMintedBatch.fetchNextPage()
          if (factoryTokenBurned.hasNextPage) await factoryTokenBurned.fetchNextPage()
          if (factoryOwnershipTransferred.hasNextPage) await factoryOwnershipTransferred.fetchNextPage()
        }}
        usingMockData={false}
      />
    </div>
  )
}