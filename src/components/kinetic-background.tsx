"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/src/lib/utils"

type KineticBackgroundProps = {
  density?: number     // scales node count
  hue?: number         // base hue
  speed?: number       // animation speed factor
  glow?: number        // glow blur
  alpha?: number       // line alpha
  className?: string
}

/**
 * KineticBackground (Network)
 * - Draws a connected node network with animated light lanes moving along edges.
 * - Optimized: pauses offscreen, respects prefers-reduced-motion, scales with deviceMemory and area.
 */
export function KineticBackground({
  density = 18,
  hue = 265,
  speed = 0.8,
  glow = 14,
  alpha = 0.7,
  className,
}: KineticBackgroundProps) {
  const parentRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const activeRef = useRef<boolean>(true)

  useEffect(() => {
    const parent = parentRef.current
    const canvas = canvasRef.current
    if (!parent || !canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    const DPR = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      const rect = parent.getBoundingClientRect()
      width = Math.max(320, Math.floor(rect.width))
      height = Math.max(240, Math.floor(rect.height))
      canvas.width = Math.floor(width * DPR)
      canvas.height = Math.floor(height * DPR)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const deviceMem = (navigator as any).deviceMemory ?? 8
    const isSmall = typeof window !== "undefined" ? window.innerWidth < 640 : true
    const perfScale =
      Math.min(1, (deviceMem >= 8 ? 1 : deviceMem >= 4 ? 0.8 : 0.55) * (isSmall ? 0.8 : 1))

    // Nodes and edges
    type Node = { x: number; y: number; vx: number; vy: number }
    type Edge = {
      a: number
      b: number
      len: number
      phasePx: number
      speedPx: number
      dashPx: number
      color: string
    }

    let nodes: Node[] = []
    let edges: Edge[] = []

    // Compute counts by area and density
    function targetCounts() {
      const area = width * height
      const baseNodes = Math.sqrt(area) / 10 // grows sublinearly with area
      const nodesCount = Math.max(24, Math.min(110, Math.floor(baseNodes * (density / 18) * perfScale)))
      const k = 2 // nearest neighbors per node
      const edgesCount = Math.floor((nodesCount * k) / 1.2) // rough cap
      return { nodesCount, edgesCount }
    }

    function initGraph() {
      const { nodesCount } = targetCounts()
      nodes = Array.from({ length: nodesCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.06 * speed,
        vy: (Math.random() - 0.5) * 0.06 * speed,
      }))

      // Build edges by connecting to 2 nearest neighbors
      // O(n^2) once at init, ok for n<=110
      const edgeSet = new Set<string>()
      edges = []
      for (let i = 0; i < nodes.length; i++) {
        // find two nearest neighbors
        const dists: { j: number; d2: number }[] = []
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d2 = dx * dx + dy * dy
          dists.push({ j, d2 })
        }
        dists.sort((a, b) => a.d2 - b.d2)
        const neighbors = dists.slice(0, 2).map((d) => d.j)
        neighbors.forEach((j) => {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`
          if (edgeSet.has(key)) return
          edgeSet.add(key)
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const len = Math.sqrt(dx * dx + dy * dy)
          const dashPx = Math.max(16, Math.min(42, len * 0.22))
          const speedPx = (0.35 + Math.random() * 0.45) * speed * (isSmall ? 0.8 : 1)
          const phasePx = Math.random() * len
          const color = `hsl(${(hue + (Math.random() * 40 - 20) + 360) % 360} 90% 60%)`
          edges.push({ a: i, b: j, len, phasePx, speedPx, dashPx, color })
        })
      }
    }

    function staticPaint() {
      ctx.clearRect(0, 0, width, height)
      // Background soft gradient
      const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      const bg = ctx.createLinearGradient(0, 0, width, height)
      if (isDark) {
        bg.addColorStop(0, "hsla(240, 20%, 10%, 1)")
        bg.addColorStop(1, "hsla(260, 26%, 10%, 1)")
      } else {
        bg.addColorStop(0, "hsla(250, 80%, 98%, 1)")
        bg.addColorStop(1, "hsla(260, 70%, 96%, 1)")
      }
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      // Base network (static)
      ctx.save()
      ctx.globalAlpha = Math.min(0.5, alpha)
      ctx.lineWidth = 1
      ctx.strokeStyle = `hsla(${hue}, 80%, ${isDark ? 65 : 55}%, 0.22)`
      edges.forEach((e) => {
        const a = nodes[e.a]
        const b = nodes[e.b]
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      })
      ctx.restore()

      // Vignette for readability
      const vignette = ctx.createLinearGradient(0, 0, 0, height)
      vignette.addColorStop(0, isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.06)")
      vignette.addColorStop(1, isDark ? "rgba(0,0,0,0.34)" : "rgba(255,255,255,0.28)")
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)
    }

    initGraph()
    staticPaint()

    // Pointer tracking (for subtle highlight)
    let mouseX = width / 2
    let mouseY = height / 2
    let hasPointer = false
    function onMove(e: PointerEvent) {
      const rect = parent.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
      hasPointer = true
    }
    parent.addEventListener("pointermove", onMove, { passive: true })

    // IntersectionObserver: pause when offscreen
    const io = new IntersectionObserver(
      (entries) => {
        activeRef.current = entries[0]?.isIntersecting ?? true
        if (activeRef.current && rafRef.current == null && !prefersReduced) {
          last = performance.now()
          rafRef.current = requestAnimationFrame(step)
        }
      },
      { root: null, threshold: 0.05 },
    )
    io.observe(parent)

    // Visibility pause
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        activeRef.current = false
      } else {
        activeRef.current = true
        if (rafRef.current == null && !prefersReduced) {
          last = performance.now()
          rafRef.current = requestAnimationFrame(step)
        }
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    // Resize recalculation (debounced)
    let resizeRaf = 0
    const onResize = () => {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(() => {
        resize()
        initGraph()
        staticPaint()
      })
    }
    window.addEventListener("resize", onResize, { passive: true })

    if (prefersReduced) {
      // Static only, no animation
      return () => {
        parent.removeEventListener("pointermove", onMove)
        window.removeEventListener("resize", onResize)
        io.disconnect()
        document.removeEventListener("visibilitychange", onVisibility)
      }
    }

    let last = performance.now()
    function step(now: number) {
      if (!activeRef.current) {
        // draw static frame while paused
        staticPaint()
        rafRef.current = null
        return
      }

      const dt = Math.min(50, now - last)
      last = now

      // Gentle node drift
      nodes.forEach((n) => {
        n.x += n.vx * dt
        n.y += n.vy * dt
        // Soft bounce
        if (n.x < 0) {
          n.x = 0
          n.vx = Math.abs(n.vx)
        }
        if (n.x > width) {
          n.x = width
          n.vx = -Math.abs(n.vx)
        }
        if (n.y < 0) {
          n.y = 0
          n.vy = Math.abs(n.vy)
        }
        if (n.y > height) {
          n.y = height
          n.vy = -Math.abs(n.vy)
        }
        // Tiny noise
        n.vx += (Math.random() - 0.5) * 0.0005 * dt
        n.vy += (Math.random() - 0.5) * 0.0005 * dt
      })

      // Update lane phases
      edges.forEach((e) => {
        e.phasePx += e.speedPx * dt
        if (e.phasePx > e.len + 1000) e.phasePx = 0
      })

      // Paint
      ctx.clearRect(0, 0, width, height)

      const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches

      // Background
      const bg = ctx.createLinearGradient(0, 0, width, height)
      if (isDark) {
        bg.addColorStop(0, "hsla(240, 20%, 10%, 1)")
        bg.addColorStop(1, "hsla(260, 26%, 10%, 1)")
      } else {
        bg.addColorStop(0, "hsla(250, 80%, 98%, 1)")
        bg.addColorStop(1, "hsla(260, 70%, 96%, 1)")
      }
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      // Base network lines
      ctx.save()
      ctx.globalAlpha = Math.min(0.5, alpha)
      ctx.lineWidth = 1
      ctx.strokeStyle = `hsla(${hue}, 80%, ${isDark ? 70 : 55}%, 0.20)`
      edges.forEach((e) => {
        const a = nodes[e.a]
        const b = nodes[e.b]
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      })
      ctx.restore()

      // Light lanes (moving dash with glow)
      ctx.save()
      ctx.globalCompositeOperation = "lighter"
      edges.forEach((e) => {
        const a = nodes[e.a]
        const b = nodes[e.b]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1

        // subtle proximity highlight to pointer
        let proximityBoost = 0
        if (hasPointer) {
          // distance from point to segment
          const t = Math.max(0, Math.min(1, ((mouseX - a.x) * dx + (mouseY - a.y) * dy) / (len * len)))
          const projx = a.x + t * dx
          const projy = a.y + t * dy
          const d = Math.hypot(mouseX - projx, mouseY - projy)
          proximityBoost = Math.max(0, 1 - d / 180) // fades beyond 180px
        }

        ctx.lineWidth = Math.max(1.4, Math.min(2.6, len * 0.004))
        ctx.strokeStyle = e.color
        ctx.globalAlpha = 0.45 * alpha + 0.35 * proximityBoost

        // One bright dash traveling along the line
        const dashLen = e.dashPx
        ctx.setLineDash([dashLen, 1e6])
        ctx.lineDashOffset = -(e.phasePx % (len + 1000))
        ctx.shadowColor = e.color
        ctx.shadowBlur = glow
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()

        // subtle trailing afterglow layer
        ctx.shadowBlur = glow * 0.5
        ctx.globalAlpha *= 0.6
        ctx.lineWidth *= 0.9
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()

        // reset dash
        ctx.setLineDash([])
      })
      ctx.restore()

      // Vignette for readability
      const vignette = ctx.createLinearGradient(0, 0, 0, height)
      vignette.addColorStop(0, isDark ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.06)")
      vignette.addColorStop(1, isDark ? "rgba(0,0,0,0.30)" : "rgba(255,255,255,0.22)")
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      parent.removeEventListener("pointermove", onMove)
      window.removeEventListener("resize", onResize)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [alpha, density, glow, hue, speed])

  return (
    <div ref={parentRef} className={cn("absolute inset-0", className)}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none select-none" />
      {/* Contrast mask */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-background/5 to-background/40 dark:from-background/30 dark:via-background/20 dark:to-background/60" />
    </div>
  )
}

KineticBackground.displayName = "KineticBackground"
