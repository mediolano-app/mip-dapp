"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { cn } from "@/src/lib/utils"
import { Paintbrush, Music, Rocket, Briefcase } from "lucide-react"

type Chip = { icon?: React.ReactNode; label: string }

type PrismHeroProps = {
  kicker?: string
  title?: string
  highlight?: string
  subtitle?: string
  primaryCta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  chips?: Chip[]
  hue?: number // 0..360 hue for beams
  className?: string
  align?: "left" | "center"
  size?: "sm" | "md" | "lg"
}

/**
 * PrismHero
 * - Vivid, premium look with prism beams and aurora glows using CSS only.
 * - No canvas/WebGL; animations are GPU-friendly transforms and gradients.
 * - Animations play only when visible, and honor prefers-reduced-motion.
 */
export function PrismHero({
  kicker = "Gasless mints • Own your IP",
  title = "Tokenize your content",
  highlight = "fast, free, forever.",
  subtitle = "Turn creations into verifiable, programmable assets with one click.",
  primaryCta = { label: "Start", href: "/create" },
  secondaryCta = { label: "Sign up", href: "/create" },
  chips = [
    { icon: <Paintbrush className="h-3.5 w-3.5" />, label: "Creators" },
    { icon: <Music className="h-3.5 w-3.5" />, label: "Artists" },
    { icon: <Rocket className="h-3.5 w-3.5" />, label: "Collectors" },
    { icon: <Briefcase className="h-3.5 w-3.5" />, label: "Business" },
  ],
  hue = 268,
  className,
  align = "left",
  size = "md",
}: PrismHeroProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return

    let started = false
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting)
        if (visible && !started) {
          started = true
          el.classList.add("play")
        } else if (!visible) {
          el.classList.remove("play")
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)

    return () => {
      io.disconnect()
    }
  }, [])

  const sizeClasses =
    size === "sm"
      ? "px-5 py-8 sm:px-7 sm:py-10"
      : size === "lg"
        ? "px-6 py-14 sm:px-10 sm:py-16 md:px-12 md:py-20"
        : "px-5 py-10 sm:px-8 sm:py-14 md:px-10 md:py-16"

  const alignClasses = align === "center" ? "text-center items-center" : "text-left items-start"

  return (
    <section
      ref={ref}
      aria-label="Prism hero"
      className={cn(
        "prism-hero relative mx-auto max-w-6xl overflow-hidden",
        "rounded-3xl border border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl",
        className,
      )}
      style={
        {
          minHeight: size === "lg" ? "440px" : size === "sm" ? "320px" : "380px",
          ["--prism-hue" as any]: hue,
        } as React.CSSProperties
      }
    >
      {/* Background layers */}
      <BackgroundLayers />

      {/* Content */}
      <div className={cn("relative", sizeClasses)}>
        {kicker && (
          <div className={cn("mb-4", align === "center" ? "flex justify-center" : "block")}>
            <Badge variant="secondary" className="bg-background/70 border border-border/60 backdrop-blur">
              {kicker}
            </Badge>
          </div>
        )}

        <div className={cn("flex flex-col", alignClasses)}>
          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            <span className="animated-text-gradient">{title}</span>
            {highlight && (
              <>
                <br />
                <span className="opacity-90">{highlight}</span>
              </>
            )}
          </h1>

          {subtitle && (
            <p
              className={cn(
                "mt-3 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base",
                align === "center" ? "mx-auto" : "",
              )}
            >
              {subtitle}
            </p>
          )}

          {(primaryCta || secondaryCta) && (
            <div className={cn("mt-6 flex gap-3", align === "center" ? "justify-center" : "")}>
              {primaryCta && (
                <Button
                  asChild
                  size="lg"
                  className="px-5 bg-blue-600 text-white transition-transform duration-200 hover:scale-[1.02] shadow-sm"
                >
                  <Link href={primaryCta.href} aria-label={primaryCta.label}>
                    {primaryCta.label}
                  </Link>
                </Button>
              )}
              
              {/*}
              {secondaryCta && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-5 border-border/70 bg-background/70 backdrop-blur"
                >
                  <Link href={secondaryCta.href} aria-label={secondaryCta.label}>
                    {secondaryCta.label}
                  </Link>
                </Button>
              )}
                */}

            </div>
          )}

          {chips && chips.length > 0 && (
            <div
              className={cn(
                "mt-6 grid w-full grid-cols-2 gap-2 sm:max-w-lg sm:grid-cols-4",
                align === "center" ? "mx-auto" : "",
              )}
            >
              {chips.map((chip, i) => (
                <div
                  key={`${chip.label}-${i}`}
                  className="chip-enter flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-2 text-xs shadow-sm backdrop-blur"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {chip.icon && <span className="text-primary">{chip.icon}</span>}
                  <span className="font-medium">{chip.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        /* Animated gradient text */
        .animated-text-gradient {
          background: linear-gradient(90deg, #8b5cf6, #ec4899, #22d3ee, #8b5cf6);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientShift 12s ease-in-out infinite alternate;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
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

        @media (prefers-reduced-motion: reduce) {
          .animated-text-gradient { animation: none; }
          .chip-enter { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  )
}

function BackgroundLayers() {
  return (
    <div
      className={cn(
        "absolute inset-0 -z-10 overflow-hidden",
        "bg-[radial-gradient(1200px_600px_at_80%_-20%,hsl(var(--prism-hue,_268)_85%_60%_/0.18),transparent_60%),",
        "radial-gradient(900px_500px_at_10%_120%,hsl(var(--prism-hue,_268)_85%_60%_/0.16),transparent_60%),",
        "linear-gradient(180deg,hsl(250_30%_98%)_0%,hsl(250_30%_98%/0.7)_20%,transparent_45%)]",
        "dark:bg-[radial-gradient(1200px_600px_at_80%_-20%,hsl(var(--prism-hue,_268)_85%_60%_/0.22),transparent_60%),",
        "radial-gradient(900px_500px_at_10%_120%,hsl(var(--prism-hue,_268)_85%_60%_/0.2),transparent_60%),",
        "linear-gradient(180deg,hsl(240_15%_12%)_0%,hsl(240_15%_12%/0.8)_25%,transparent_55%)]",
      )}
    >
      {/* Subtle prism beams (conic gradients) */}
      <div className="absolute -left-1/3 -top-1/3 h-[160%] w-[160%]">
        <div className="beam mask-fade absolute inset-0 rotate-12" />
        <div className="beam beam--alt mask-fade absolute inset-0 -rotate-6" />
      </div>

      {/* Floating blobs for depth */}
      <div className="blob blob--1" />
      <div className="blob blob--2" />
      <div className="blob blob--3" />

      {/* Grain overlay for richness */}
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.05]" />
      {/* Readability vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/50" />

      <style jsx>{`
        .mask-fade {
          -webkit-mask-image: radial-gradient(60% 60% at 50% 40%, #000, transparent);
          mask-image: radial-gradient(60% 60% at 50% 40%, #000, transparent);
        }
        .beam {
          background:
            conic-gradient(
              from 220deg at 50% 50%,
              hsla(var(--prism-hue,268), 90%, 70%, 0.0) 0deg,
              hsla(var(--prism-hue,268), 90%, 70%, 0.18) 40deg,
              hsla(var(--prism-hue,268), 90%, 70%, 0.0) 80deg,
              hsla(calc(var(--prism-hue,268) + 40), 95%, 65%, 0.18) 120deg,
              hsla(calc(var(--prism-hue,268) + 40), 95%, 65%, 0.0) 160deg,
              hsla(calc(var(--prism-hue,268) + 80), 90%, 60%, 0.15) 200deg,
              transparent 360deg
            );
          filter: blur(16px) saturate(120%);
          transform-origin: 50% 50%;
          will-change: transform;
          height: 100%;
          width: 100%;
          animation: beamSpin 60s linear infinite paused;
        }
        .beam--alt {
          opacity: 0.85;
          animation-duration: 80s;
          animation-direction: reverse;
        }
        :global(.prism-hero.play) .beam,
        :global(.prism-hero.play) .beam--alt {
          animation-play-state: running;
        }

        @keyframes beamSpin {
          from { transform: rotate(0deg) scale(1.02); }
          to   { transform: rotate(360deg) scale(1.02); }
        }

        .blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(40px) saturate(120%);
          opacity: 0.6;
          transform: translateZ(0);
          will-change: transform;
          animation: drift 28s ease-in-out infinite alternate paused;
        }
        .blob--1 {
          left: -8%;
          top: 10%;
          width: 420px; height: 420px;
          background: radial-gradient(circle at 30% 30%, hsla(var(--prism-hue,268),90%,65%,0.22), transparent 60%);
          animation-duration: 34s;
        }
        .blob--2 {
          right: -10%;
          top: 20%;
          width: 520px; height: 520px;
          background: radial-gradient(circle at 70% 40%, hsla(calc(var(--prism-hue,268)+40),90%,65%,0.22), transparent 60%);
          animation-duration: 30s;
        }
        .blob--3 {
          right: 20%;
          bottom: -10%;
          width: 460px; height: 460px;
          background: radial-gradient(circle at 40% 60%, hsla(calc(var(--prism-hue,268)+80),90%,60%,0.18), transparent 60%);
          animation-duration: 36s;
        }
        :global(.prism-hero.play) .blob {
          animation-play-state: running;
        }

        @keyframes drift {
          0%   { transform: translate3d(0px, 0px, 0) scale(1); }
          100% { transform: translate3d(20px, -16px, 0) scale(1.04); }
        }

        .grain {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/ filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E");
          background-size: 140px 140px;
          mix-blend-mode: overlay;
        }

        @media (prefers-reduced-motion: reduce) {
          .beam, .beam--alt, .blob { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
