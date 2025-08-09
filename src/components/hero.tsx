"use client"

import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { ArrowRight, Paintbrush, Music, Rocket, Briefcase } from 'lucide-react'
import { KineticBackground } from "@/src/components/kinetic-background"
import { cn } from "@/lib/utils"

export function Hero() {
  return (
    <section
      aria-label="IP tokenization hero"
      className={cn(
        "relative mx-auto max-w-6xl overflow-hidden",
        "rounded-3xl border border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl"
      )}
      style={{ minHeight: "420px" }}
    >
      {/* Vivid kinetic animated background */}
      <KineticBackground density={20} speed={0.8} hue={265} glow={40} alpha={0.7} />

      {/* Accent glows */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

      {/* Content */}
      <div className="relative px-5 py-10 sm:px-8 sm:py-14 md:px-12 md:py-16">
        {/* Kicker */}
        <div className="mb-4">
          <Badge variant="secondary" className="bg-background/70 border border-border/60 backdrop-blur">
            Gasless mints • Own your IP
          </Badge>
        </div>

        {/* Headline */}
        <h1
          className={cn(
            "text-balance text-3xl font-extrabold leading-tight tracking-tight",
            "sm:text-5xl md:text-6xl"
          )}
        >
          <span className="animated-text-gradient">
            More value to your content
          </span>
          <br />
          <span className="opacity-90">fast, free, onchain</span>
        </h1>

        {/* Subheadline (tight and punchy) */}
        <p className="mt-3 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
          Protect your creative work into verifiable, programmable assets
        </p>

        {/* CTAs */}
        <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className={cn(
              "px-5",
              "transition-transform duration-200 hover:scale-[1.02]",
              "shadow-sm"
            )}
          >
            <Link href="/create" aria-label="Start tokenizing for free">
              Start
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {/* Secondary button for sign up 
          <Button
            asChild
            size="lg"
            variant="outline"
            className="px-5 border-border/70 bg-background/70 backdrop-blur"
          >
            <Link href="/create" aria-label="Sign up to tokenize your content">
              Sign up
            </Link>
          </Button>*/}
        </div>

        {/* Audience chips with motion 
        <div className="mt-6 grid w-full grid-cols-2 gap-2 sm:max-w-lg sm:grid-cols-4">
          <AudienceChip icon={<Paintbrush className="h-3.5 w-3.5" />} label="Creators" delay={0} />
          <AudienceChip icon={<Music className="h-3.5 w-3.5" />} label="Artists" delay={100} />
          <AudienceChip icon={<Rocket className="h-3.5 w-3.5" />} label="Startups" delay={200} />
          <AudienceChip icon={<Briefcase className="h-3.5 w-3.5" />} label="Business" delay={300} />
        </div>*/}

        {/* Helper styles */}
        <style jsx>{`
          /* Animated gradient text */
          .animated-text-gradient {
            background: linear-gradient(90deg, #8b5cf6, #ec4899, #22d3ee, #8b5cf6);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: gradientShift 8s ease-in-out infinite;
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          /* Chip entrance */
          .chip-enter {
            transform: translateY(8px);
            opacity: 0;
            animation: chipUp 600ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
          @keyframes chipUp {
            to { transform: translateY(0px); opacity: 1; }
          }
        `}</style>
      </div>
    </section>
  )
}

function AudienceChip({
  icon,
  label,
  delay = 0,
}: {
  icon: React.ReactNode
  label: string
  delay?: number
}) {
  return (
    <div
      className="chip-enter flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-2 text-xs shadow-sm backdrop-blur"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-primary">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  )
}
