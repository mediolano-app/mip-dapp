import { useEffect, useMemo, useState } from 'react'
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

export function useActivitiesV2({ userAddress, pageSize = 25, startBlock }: UseActivitiesOptions): UseActivitiesResult {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch activities from backend API
  useEffect(() => {
    let alive = true
    const fetchActivities = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('[useActivitiesV2] Fetching activities from backend API...')
        
        // Determine which endpoint to call based on userAddress
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        let endpoint = `${apiBaseUrl}/transfers?limit=${pageSize}&offset=0&sortOrder=desc`
        
        if (userAddress) {
          console.log('[useActivitiesV2] Fetching transfers for address:', userAddress)
          // Get transfers from/to this address
          endpoint = `${apiBaseUrl}/transfers/from/${userAddress}?limit=${pageSize}&offset=0&sortOrder=desc`
        }
        
        console.log('[useActivitiesV2] Calling endpoint:', endpoint)
        
        // Add timeout and better error handling
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        }).catch(err => {
          console.error('[useActivitiesV2] Fetch error details:', {
            message: err.message,
            type: err.type,
            name: err.name,
          })
          throw err
        })
        
        clearTimeout(timeoutId)
        
        if (!alive) return
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.error('[useActivitiesV2] API error response:', response.status, errorText)
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('[useActivitiesV2] API Response:', result)
        
        if (result.data && Array.isArray(result.data)) {
          // Transform backend transfers to activities
          const transformedActivities = result.data.map((transfer: any) => ({
            id: `${transfer.id}`,
            type: getActivityType(transfer.from, transfer.to),
            title: getActivityTitle(transfer.from, transfer.to),
            description: getActivityDescription(transfer.from, transfer.to),
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
            console.log('[useActivitiesV2] Activities loaded:', transformedActivities.length)
          }
        } else {
          console.warn('[useActivitiesV2] Unexpected response format:', result)
          setActivities([])
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[useActivitiesV2] Error fetching activities:', errorMsg)
        if (alive) {
          // Check if it's a network error
          if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch')) {
            setError('Unable to connect to backend API. Make sure backend is running at http://localhost:3000')
          } else {
            setError(errorMsg)
          }
          setActivities([])
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    
    fetchActivities()
    return () => { alive = false }
  }, [userAddress, pageSize])

  const onLoadMore = async () => {
    console.log('[useActivitiesV2] Load more requested')
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

function getActivityDescription(from?: string, to?: string): string {
  const type = getActivityType(from, to)
  switch (type) {
    case 'mint':
      return `Minted to ${to?.slice(0, 10)}...`
    case 'burn':
      return `Burned from ${from?.slice(0, 10)}...`
    case 'transfer':
      return `Transferred from ${from?.slice(0, 10)}... to ${to?.slice(0, 10)}...`
    default:
      return 'Blockchain activity'
  }
}

