export type ActivityType = 
  | 'mint' 
  | 'mint_batch'
  | 'transfer_out' 
  | 'transfer_in' 
  | 'transfer_batch'
  | 'burn'
  | 'burn_batch'
  | 'collection_create'
  | 'update'
  | 'upgrade'
  | 'sale'

export type ActivityStatus = 'completed' | 'pending' | 'failed'

export interface ActivityItem {
  id: string
  title: string
  description: string
  type: ActivityType
  status: ActivityStatus
  timestamp: string
  hash?: string
  network: string
  value?: string
  fromAddress?: string
  toAddress?: string
  assetId?: string
  assetIds?: string[]
  collectionId?: string
  metadata?: {
    blockNumber?: number
    contractAddress?: string
  }
}

export const activityGradients = {
  mint: "from-green-500 to-emerald-500",
  mint_batch: "from-green-500 to-emerald-500",
  transfer_out: "from-blue-500 to-cyan-500",
  transfer_in: "from-purple-500 to-violet-500",
  transfer_batch: "from-blue-500 to-cyan-500",
  burn: "from-red-500 to-pink-500",
  burn_batch: "from-red-500 to-pink-500",
  collection_create: "from-indigo-500 to-purple-500",
  update: "from-yellow-500 to-orange-500",
  upgrade: "from-teal-500 to-cyan-500",
  sale: "from-orange-500 to-red-500",
} as const

export const activityColors = {
  mint: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  mint_batch: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  transfer_out: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  transfer_in: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  transfer_batch: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  burn: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  burn_batch: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  collection_create: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  update: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
  upgrade: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
  sale: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
} as const

export const statusColors = {
  completed: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  pending: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  failed: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
} as const

export const typeLabels = {
  mint: "Minted",
  mint_batch: "Minted Batch",
  transfer_out: "Sent",
  transfer_in: "Received",
  transfer_batch: "Transferred Batch",
  burn: "Burned",
  burn_batch: "Burned Batch",
  collection_create: "Collection Created",
  update: "Updated",
  upgrade: "Upgraded",
  sale: "Sales",
} as const