"use client"

import { Activities } from "@/src/components/activities"
import { toast } from "@/src/hooks/use-toast"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getWalletData } from "@/src/app/onboarding/_actions"
import { useActivitiesOnchain } from "@/src/hooks/use-activities-onchain"

export default function ActivitiesPage() {
  const [userAddress, setUserAddress] = useState<string | undefined>(undefined)
  const startBlock = {
    mip: 1651476,
    collection: 1570147,
  }
  const router = useRouter()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const walletData = await getWalletData()
        if (!alive) return
        if (walletData?.publicKey) {
          console.log('[ActivitiesPage] Wallet loaded:', walletData.publicKey)
          setUserAddress(walletData.publicKey)
        } else {
          console.log('[ActivitiesPage] No wallet data found, displaying all activities')
        }
      } catch (error) {
        console.error('[ActivitiesPage] Error loading user wallet:', error)
        console.log('[ActivitiesPage] Continuing without user address filter')
      }
    })()
    return () => { alive = false }
  }, [])

  const { activities, loading, error, onLoadMore } = useActivitiesOnchain({ userAddress, pageSize: 25, startBlock })

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: "Transaction hash copied to clipboard" })
  }

  const handleCreateNew = () => {
    router.push('/create-asset')
  }

  const handleRefresh = () => {
    // Reload the page to retry
    window.location.reload()
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Activities
        activities={activities}
        loading={loading}
        error={error}
        onCopyToClipboard={handleCopyToClipboard}
        onCreateNew={handleCreateNew}
        onRefresh={handleRefresh}
        onLoadMore={onLoadMore}
        usingMockData={false}
      />
    </div>
  )
}


