import { useEffect, useState } from 'react'
import { CONTRACTS } from '@/src/services/constant'

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

export function useActivitiesOnchain({ userAddress, pageSize = 25, startBlock }: UseActivitiesOptions): UseActivitiesResult {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch activities from backend API (indexed data from smart contract)
  useEffect(() => {
    let alive = true
    const fetchActivities = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('[useActivitiesOnchain] Fetching activities from backend...')
        
        // Get the API URL from environment - use production by default
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mediolano.app'
        
        // Build the endpoint - use transfers endpoint from the backend
        let endpoint = `${apiUrl}/transfers?limit=${pageSize}&offset=0&sortOrder=desc`
        
        if (userAddress) {
          console.log('[useActivitiesOnchain] Fetching for user:', userAddress)
          endpoint = `${apiUrl}/transfers/from/${userAddress}?limit=${pageSize}&offset=0&sortOrder=desc`
        }
        
        console.log('[useActivitiesOnchain] Calling:', endpoint)
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (!alive) return
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }
        
        const result = await response.json()
        console.log('[useActivitiesOnchain] Response:', result)
        
        if (result.data && Array.isArray(result.data)) {
          // Transform backend transfer data to activities
          const transformedActivities = result.data.map((transfer: any) => ({
            id: transfer.id || `${transfer.tokenId}_${transfer.block}`,
            type: getActivityType(transfer.from, transfer.to),
            title: getActivityTitle(transfer.from, transfer.to),
            description: getActivityDescription(transfer.from, transfer.to, transfer.tokenId),
            hash: transfer.id || '',
            timestamp: new Date().toISOString(),
            network: 'Starknet',
            status: 'completed' as const,
            fromAddress: transfer.from,
            toAddress: transfer.to,
            tokenId: transfer.tokenId,
            metadata: {
              blockNumber: transfer.block || 0,
              contractAddress: CONTRACTS.MEDIOLANO,
              indexerSource: transfer.indexerSource,
            },
          }))
          
          if (alive) {
            setActivities(transformedActivities)
            console.log('[useActivitiesOnchain] Loaded:', transformedActivities.length, 'activities')
          }
        } else {
          console.log('[useActivitiesOnchain] No data in response')
          if (alive) setActivities([])
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[useActivitiesOnchain] Error:', errorMsg)
        if (alive) {
          setActivities([])
          setError(null) // Don't show error, just empty state
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    
    fetchActivities()
    return () => { alive = false }
  }, [userAddress, pageSize])

  const onLoadMore = async () => {
    console.log('[useActivitiesOnchain] Load more')
  }

  return { activities, loading, error, onLoadMore }
}

function getActivityType(from?: string, to?: string): string {
  if (!from || !to) return 'transfer'
  const zeroAddress = '0x0'
  if (from.toLowerCase() === zeroAddress) return 'mint'
  if (to.toLowerCase() === zeroAddress) return 'burn'
  return 'transfer'
}

function getActivityTitle(from?: string, to?: string): string {
  const type = getActivityType(from, to)
  switch (type) {
    case 'mint':
      return 'Minted IP Asset'
    case 'burn':
      return 'Burned IP Asset'
    case 'transfer':
      return 'Transferred IP Asset'
    default:
      return 'Activity'
  }
}

function getActivityDescription(from?: string, to?: string, tokenId?: string): string {
  const type = getActivityType(from, to)
  const formatAddr = (addr?: string) => addr?.slice(0, 10) + '...' || 'unknown'
  const tokenDisplay = tokenId ? ` #${tokenId}` : ''
  
  switch (type) {
    case 'mint':
      return `Minted${tokenDisplay} to ${formatAddr(to)}`
    case 'burn':
      return `Burned${tokenDisplay} from ${formatAddr(from)}`
    case 'transfer':
      return `Transferred${tokenDisplay} from ${formatAddr(from)} to ${formatAddr(to)}`
    default:
      return 'Activity'
  }
}
