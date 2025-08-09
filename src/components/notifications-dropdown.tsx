"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { Separator } from "@/src/components/ui/separator"
import { Bell, ArrowRight, CheckCircle, AlertCircle, Info, TrendingUp } from "lucide-react"

interface Notification {
  id: string
  type: "success" | "warning" | "info" | "activity"
  title: string
  message: string
  time: string
  date: string
  read: boolean
}

const today = new Date().toISOString().slice(0, 10)

const mockNotifications: Notification[] = [
   {
    id: "1",
    type: "info",
    title: "Mint your first asset",
    message: "Fast, secure and free minting.",
    time: "Now",
    date: today,
    read: false,
  },
  {
    id: "2",
    type: "activity",
    title: "Live Event",
    message: "Starknet Rio Meetup + IP Lounge",
    time: "Now",
    date: today,
    read: false,
  },
  {
    id: "3",
    type: "success",
    title: "Smart Account",
    message: "Your account has been successfully created onchainw.",
    time: "No",
    date: today,
    read: true,
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case "warning":
      return <AlertCircle className="w-4 h-4 text-orange-500" />
    case "activity":
      return <TrendingUp className="w-4 h-4 text-blue-500" />
    default:
      return <Info className="w-4 h-4 text-blue-500" />
  }
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="w-10 h-10 p-0 relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-80">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      notification.read ? "bg-transparent hover:bg-muted/50" : "bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
                          {!notification.read && <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-3">
          <Button asChild variant="ghost" className="w-full justify-between">
            <Link href="/notifications">
              View all notifications
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
