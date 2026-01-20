import { useState, useEffect, useCallback } from "react";

export interface TransferHistoryEntry {
  address: string
  name?: string
  timestamp: number
  frequency: number
}

export interface UseTransferHistoryReturn {
  recentAddresses: TransferHistoryEntry[]
  addToHistory: (address: string, name?: string) => void
  clearHistory: () => void
  getAddressByName: (name: string) => string | null
}

const STORAGE_KEY = 'mip_transfer_history'
const MAX_HISTORY_ENTRIES = 10

/**
 * Hook to manage transfer address history and lookup
 * Stores recent transfer addresses with optional names for quick access
 */
export function useTransferHistory(): UseTransferHistoryReturn {
  const [recentAddresses, setRecentAddresses] = useState<TransferHistoryEntry[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as TransferHistoryEntry[]
        // Sort by frequency and recency
        const sorted = parsed.sort((a, b) => {
          if (a.frequency !== b.frequency) {
            return b.frequency - a.frequency // Higher frequency first
          }
          return b.timestamp - a.timestamp // More recent first
        })
        setRecentAddresses(sorted.slice(0, MAX_HISTORY_ENTRIES))
      }
    } catch (error) {
      console.error('Failed to load transfer history:', error)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentAddresses))
    } catch (error) {
      console.error('Failed to save transfer history:', error)
    }
  }, [recentAddresses])

  const addToHistory = useCallback((address: string, name?: string) => {
    if (!address) return

    setRecentAddresses(prev => {
      const existingIndex = prev.findIndex(entry => entry.address === address)
      
      if (existingIndex >= 0) {
        // Update existing entry
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          name: name || updated[existingIndex].name,
          timestamp: Date.now(),
          frequency: updated[existingIndex].frequency + 1
        }
        
        // Re-sort and limit
        return updated
          .sort((a, b) => {
            if (a.frequency !== b.frequency) {
              return b.frequency - a.frequency
            }
            return b.timestamp - a.timestamp
          })
          .slice(0, MAX_HISTORY_ENTRIES)
      } else {
        // Add new entry
        const newEntry: TransferHistoryEntry = {
          address,
          name,
          timestamp: Date.now(),
          frequency: 1
        }
        
        const updated = [newEntry, ...prev]
        return updated
          .sort((a, b) => {
            if (a.frequency !== b.frequency) {
              return b.frequency - a.frequency
            }
            return b.timestamp - a.timestamp
          })
          .slice(0, MAX_HISTORY_ENTRIES)
      }
    })
  }, [])

  const clearHistory = useCallback(() => {
    setRecentAddresses([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear transfer history:', error)
    }
  }, [])

  const getAddressByName = useCallback((name: string): string | null => {
    const entry = recentAddresses.find(entry => 
      entry.name?.toLowerCase() === name.toLowerCase()
    )
    return entry?.address || null
  }, [recentAddresses])

  return {
    recentAddresses,
    addToHistory,
    clearHistory,
    getAddressByName
  }
}
