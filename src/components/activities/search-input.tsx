import { Search, X } from "lucide-react"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = "Search activities, transactions, or descriptions..." }: SearchInputProps) {
  return (
    <div className="relative flex-1">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl blur-xl" />
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-11 pr-4 h-12 bg-background/80 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}