"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/src/components/ui/collapsible"
import {
  Shield,
  ChevronDown,
  ArrowUpRight,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Zap,
  Heart,
  Users,
  Globe,
  TrendingUp,
  Sparkles,
  ExternalLink,
  FileCheck,
  Star,
} from "lucide-react"
import { NewsWidget } from "@/src/components/news/news-widget"
import { LogoMip } from "./logo-mip"
import { SiGithub, SiX } from "react-icons/si"

const footerSections = [
  {
    id: "platform",
    title: "Start",
    icon: Shield,
    links: [
      { name: "Create", href: "/create", badge: "Free" },
      { name: "Portfolio", href: "/portfolio" },
      { name: "Transfer", href: "/transfer" },
      { name: "Activities", href: "/activities" },
      { name: "Notifications", href: "/notifications" },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    icon: Globe,
    links: [
      { name: "Explore", href: "/", badge: "Start" },
      { name: "Updates", href: "/news", badge: "News" },
      { name: "Mediolano", href: "https://mediolano.xyz", external: true },
      { name: "Mediolano Dapp", href: "https://ip.mediolano.app", external: true },
      { name: "Contact Us", href: "mailto:mediolanoapp@gmail.com" },
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: FileCheck,
    links: [
      { name: "Community Guidelines", href: "https://mediolano.xyz/community-guidelines/" },
      { name: "Governance Charter", href: "https://mediolano.xyz/governance-charter/" },
       { name: "Compliance Guidelines", href: "https://mediolano.xyz/compliance-guidelines/" },
       { name: "Terms of Use", href: "https://mediolano.xyz/terms-of-use/" },
      { name: "Privacy Policy", href: "https://mediolano.xyz/privacy-policy/" },

    ],
  },
]

const socialLinks = [
  { name: "X", href: "https://x.com/mediolanoapp", icon: Twitter, color: "bg-sky-500" },
  { name: "GitHub", href: "https://github.com/mediolano-app", icon: Github, color: "bg-gray-800" },
  { name: "LinkedIn", href: "https://linkedin.com/company/mediolano-app", icon: Linkedin, color: "bg-blue-600" },
  { name: "Telegram", href: "https://t.me/mediolanoapp", icon: Mail, color: "bg-blue-400" },
]

const quickStats = [
  { label: "Fees", value: "Zero", icon: Shield, change: "100%" },
  { label: "Validity", value: "Starknet", icon: Users, change: "100%" },
  { label: "Countries", value: "181", icon: Globe, change: "100%" },
]

export function Footer() {
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => (prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]))
  }

  return (
    <footer className="bg-background border-t border-border/20 mt-20">
     

      {/* Main Content - Mobile Collapsible, Desktop Grid */}
      <div className="border-t border-border/20 px-4 py-8 md:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Brand Section - Always Visible */}
          <div className="mb-8">
            <Card className="border-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <LogoMip />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">MIP</h4>
                      <p className="text-sm text-muted-foreground">Transform your content into protected intellectual property with frictionless tokenization. Free, fast and secure!</p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button size="sm" asChild className="flex-1 sm:flex-none">
                      <Link href="/create">
                        Get Started
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Navigation Sections - 3 Columns */}
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
            {footerSections.map((section) => (
              <div key={section.id}>
                {/* Mobile: Collapsible */}
                <div className="md:hidden">
                  <Collapsible open={openSections.includes(section.id)} onOpenChange={() => toggleSection(section.id)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto rounded-xl border border-border/20 hover:border-primary/20"
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="w-4 h-4 text-primary" />
                          <span className="font-medium">{section.title}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${openSections.includes(section.id) ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <Card className="border-0 bg-muted/30">
                        <CardContent className="p-4 space-y-2">
                          {section.links.map((link) => (
                            <Link
                              key={link.name}
                              href={link.href}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-background/50 transition-colors group"
                              {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{link.name}</span>
                                {link.badge && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                    {link.badge}
                                  </Badge>
                                )}
                              </div>
                              {link.external ? (
                                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              )}
                            </Link>
                          ))}
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Desktop: Always Visible */}
                <div className="hidden md:block">
                  <div className="flex items-center gap-2 mb-4">
                    <section.icon className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold">{section.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="group flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                          {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                        >
                          <div className="flex items-center gap-2">
                            <span>{link.name}</span>
                            {link.badge && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                {link.badge}
                              </Badge>
                            )}
                          </div>
                          {link.external ? (
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



            {/* News Widget */}
      <NewsWidget />




      {/* Social & Bottom Section */}
      <div className=" px-4 py-6">
        <div className="max-w-6xl mx-auto">
          

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span><Badge variant="outline" className="text-xs gap-1">MIP © Mediolano</Badge></span>
              <span><Link href="https://github.com/mediolano-app" target="_blank"><SiGithub className="w-4 h-4" /></Link></span>
              <span><Link href="https://x.com/mediolanoapp" target="_blank"><SiX className="w-4 h-4" /></Link></span>
              <span><Link href="https://mediolano.xyz" target="_blank"><Globe className="w-4 h-4" /></Link></span>
            </div>

            <div className="flex items-center gap-3">

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>Mainnet</span>
              </div>
                <Badge variant="outline" className="text-xs gap-1">
                Starknet
              </Badge>
                
             
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
