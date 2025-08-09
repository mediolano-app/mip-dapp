"use client"

import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { Wallet, UserCheck, UserX, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/src/components/theme-toggle"
import { NotificationsDropdown } from "@/src/components/notifications-dropdown"
import Link from "next/link"
import { useState } from "react"
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { LogoMip } from "./logo-mip"
import { SiGoogle } from "react-icons/si"


export function Header() {
  const [isConnected, setIsConnected] = useState(true)

  const toggleConnection = () => {
    setIsConnected(!isConnected)
  }

  return (
    <header className="sticky top-0 z-50 bg-background/30 backdrop-blur-xl border-b border-border/20 supports-[backdrop-filter]:bg-background/30">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">

          {/* Logo */}
          
              <LogoMip />
           

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2">
            

            {/* Notifications 
            <NotificationsDropdown />*/}

            <SignedOut>
              <SignInButton>
                <button className="text-sm px-2 py-1 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1 text-white p-1">
                  <SiGoogle className="w-3 h-3" />
                  Log in
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="text-sm px-2 py-1 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors flex items-center gap-1 text-white p-1">
                  <SiGoogle className="w-3 h-3" />
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>

            <ThemeToggle />

            {/* Connection Status - Desktop 
            <div className="hidden sm:flex items-center space-x-2 bg-muted/50 rounded-full px-3 py-1.5 border border-border/50">
              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <Wallet className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">0x...</span>
              
            </div>*/}

            {/* Connection Status - Mobile 
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleConnection}
              className="sm:hidden w-10 h-10 p-0 relative transition-all duration-200"
            >
              {isConnected ? (
                <>
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-background"></div>
                </>
              ) : (
                <UserX className="w-5 h-5 text-orange-500" />
              )}
            </Button>*/}
          </div>
        </div>
      </div>
    </header>
  )
}
