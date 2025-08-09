import { ExternalLink } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"

interface TransactionDetailsProps {
  hash?: string
  network: string
  onCopy: (text: string) => void
}

export function TransactionDetails({ hash, network, onCopy }: TransactionDetailsProps) {
  if (!hash) return null

  return (
    <div className="flex items-center gap-2 mt-2">
      <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
        <img src="/Starknet-icon.svg" alt="Starknet" className="w-3 h-3 mr-1" />
        {network}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs font-mono hover:bg-background/80"
        onClick={() => onCopy(hash)}
      >
        {`${hash.slice(0, 6)}...${hash.slice(-4)}`}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="p-0 h-auto hover:bg-transparent"
        onClick={() => window.open(`${process.env.NEXT_PUBLIC_EXPLORER_URL || "https://starkscan.co"}/tx/${hash}`, "_blank")}
      >
        <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground transition-colors" />
      </Button>
    </div>
  )
}