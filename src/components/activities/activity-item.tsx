import { Badge } from "@/src/components/ui/badge"
import { useIsMobile } from "@/src/components/ui/use-mobile"
import { shortenAddress } from "@/src/lib/utils"
import { TransactionDetails } from "./transaction-details"
import { ArrowUpRight, ArrowDownLeft, Plus, Send, CheckCircle, AlertCircle, Loader, Sparkles, Flame, Pencil, ExternalLink } from "lucide-react"
import Link from "next/link"
import {
  type ActivityItem as ActivityItemType,
  activityGradients,
  activityColors,
  statusColors,
  typeLabels,
} from "@/src/types/activity"



interface ActivityItemProps extends ActivityItemType {
  onCopy: (text: string) => void
}

export function ActivityItem({
  title,
  description,
  type,
  status,
  timestamp,
  hash,
  network,
  onCopy,
}: ActivityItemProps) {

  const isMobile = useIsMobile()
  const displayDescription = isMobile
    ? description.replace(/0x[a-fA-F0-9]+/g, (addr) => shortenAddress(addr, 6))
    : description

  const Icon =
    type === 'collection_create' ? Sparkles :
      type === 'burn' || type === 'burn_batch' ? Flame :
        type === 'update' ? Pencil :
          type === 'mint' || type === 'mint_batch' ? Plus :
            type === 'transfer_out' || type === 'transfer_batch' ? Send :
              type === 'transfer_in' ? ArrowDownLeft : ArrowUpRight

  const StatusIcon = status === 'completed' ? CheckCircle :
    status === 'pending' ? Loader : AlertCircle

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-background to-muted/20 border border-border/50 hover:border-border transition-colors">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${activityGradients[type]} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{displayDescription}</p>
            </div>
            <div className="flex items-end gap-2">
              <Badge className={`${activityColors[type]} capitalize`}>
                {typeLabels[type]}
              </Badge>
              {status !== 'completed' && (
                <Badge className={`${statusColors[status]} capitalize flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {status}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-2">
            <TransactionDetails
              hash={hash}
              network={network}
              onCopy={onCopy}
            />
            <time className="text-xs text-muted-foreground">
              {timestamp ? new Date(timestamp).toLocaleString(undefined, {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              }) : '—'}
            </time>
          </div>
        </div>
      </div>
    </div>
  )
}