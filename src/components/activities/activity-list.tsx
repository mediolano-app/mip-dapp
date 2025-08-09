import { ReactNode } from "react"
import { ActivityItem } from "./activity-item"
import type { ActivityItem as ActivityItemType } from "@/src/types/activity"

interface ActivityListProps {
  activities: ActivityItemType[]
  emptyStateTitle: string
  emptyStateDescription: string
  emptyStateAction?: ReactNode
  copyToClipboard: (text: string) => void
}

export function ActivityList({
  activities,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction,
  copyToClipboard,
}: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/50">
        <h3 className="text-lg font-semibold text-foreground">{emptyStateTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{emptyStateDescription}</p>
        {emptyStateAction}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityItem
          key={activity.id}
          {...activity}
          onCopy={copyToClipboard}
        />
      ))}
    </div>
  )
}