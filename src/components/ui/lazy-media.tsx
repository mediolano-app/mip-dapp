"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { cn } from "@/src/lib/utils"

interface LazyMediaProps {
    src: string
    alt: string
    width?: number
    height?: number
    className?: string
    priority?: boolean
}

export function LazyMedia({
    src,
    alt,
    width,
    height,
    className,
    priority = false
}: LazyMediaProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // If priority is true, load immediately without observer
        if (priority) {
            setIsVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true)
                        observer.disconnect()
                    }
                })
            },
            {
                rootMargin: "50px", // Start loading when 50px away from viewport
                threshold: 0.1
            }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [priority])

    // Reset state if src changes
    useEffect(() => {
        setIsLoaded(false)
        setError(false)
        if (!priority) {
            // Re-observe if src changes and we want to lazy load again (though usually we just want to show the new image if already visible)
            // For simplicity, if it was already visible, we keep it visible to load the new src
        }
    }, [src, priority])

    // Fallback for when src is missing or empty
    if (!src) {
        return (
            <div
                className={cn("bg-muted animate-pulse", className)}
                style={{ width, height }}
            />
        )
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-hidden bg-muted", className)}
        >
            {!isVisible ? (
                // Skeleton / Placeholder state
                <div className="absolute inset-0 bg-muted" />
            ) : (
                // Image Loading
                <>
                    <Image
                        src={src}
                        alt={alt}
                        width={width || 600}
                        height={height || 400}
                        className={cn(
                            "w-full h-full object-cover transition-opacity duration-500",
                            isLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setError(true)}
                        unoptimized={true} // Force bypass Next.js optimization as requested/configured already, but explicit here for safety
                    />

                    {/* Loading Skeleton Overlay (component-based) */}
                    {!isLoaded && !error && (
                        <div className="absolute inset-0 bg-muted animate-pulse" />
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm p-4 text-center">
                            Failed to load image
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
