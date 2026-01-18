"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Home, Plus, Briefcase, Activity, Menu, X, Sparkles, TrendingUp, FolderOpen, Coins, Box } from "lucide-react"

const navItems = [
  { href: "/", icon: Home, label: "Start", description: "Discover IP" },
  { href: "/create", icon: Plus, label: "Create", description: "Tokenize your content" },
  { href: "/portfolio", icon: Briefcase, label: "Portfolio", description: "Manage your assets" },
  { href: "/activities", icon: Activity, label: "Activity", description: "Explore onchain activities" },
]

export function FloatingNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const pathname = usePathname()

  // Hide/show FAB on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleOverlayClick = () => {
    setIsOpen(false)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleOverlayClick}
        />
      )}

      {/* Navigation Menu */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 z-50 transform transition-all duration-300 ease-out"
          onClick={handleMenuClick}
        >
          <Card className="w-72 shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs text-foreground">My Intellectual Property</h3>
                  <p className="text-xs text-muted-foreground">Protect and tokenize onchain</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  MIP
                </Badge>
              </div>

              <div className="space-y-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start h-auto p-3 transition-all duration-200 ${
                          isActive ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                              isActive ? "bg-primary-foreground/20" : "bg-muted/50"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{item.label}</div>
                            <div
                              className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                            >
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </Link>
                  )
                })}
              </div>

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Box className="w-3 h-3 text-primary" />
                      <span className="text-sm font-bold text-foreground">MIP</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Protocol</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Coins className="w-3 h-3 text-green-500" />
                      <span className="text-sm font-bold text-foreground">Zero</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Fees</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Button */}
      <div
        className={`fixed bottom-6 right-4 z-50 transition-all duration-300 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
        }`}
      >
        <Button
          onClick={toggleMenu}
          size="lg"
          className={`w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen
              ? "bg-destructive hover:bg-destructive/90 rotate-45"
              : "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:scale-105"
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>
    </>
  )
}
