"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { FormatSelector } from "@/components/format-selector"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HorizontalControlsProps {
  format: string
  padding: number[]
  cornerRadius: number[]
  shadow: number[]
  onFormatChange: (format: string) => void
  onPaddingChange: (padding: number[]) => void
  onCornerRadiusChange: (radius: number[]) => void
  onShadowChange: (shadow: number[]) => void
}

export function HorizontalControls({
  format,
  padding,
  cornerRadius,
  shadow,
  onFormatChange,
  onPaddingChange,
  onCornerRadiusChange,
  onShadowChange,
}: HorizontalControlsProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const getViewport = () => {
    return scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement | null
  }

  const checkScrollability = () => {
    const viewport = getViewport()
    if (viewport) {
      const { scrollLeft, scrollWidth, clientWidth } = viewport
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollability()
    const viewport = getViewport()
    if (viewport) {
      viewport.addEventListener("scroll", checkScrollability)
      window.addEventListener("resize", checkScrollability)
      return () => {
        viewport.removeEventListener("scroll", checkScrollability)
        window.removeEventListener("resize", checkScrollability)
      }
    }
  }, [])

  const scroll = (direction: "left" | "right") => {
    const viewport = getViewport()
    if (viewport) {
      const scrollAmount = 300
      viewport.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "SELECT") {
        return
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        scroll("left")
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        scroll("right")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="relative w-full" ref={scrollAreaRef}>
      {(canScrollLeft || canScrollRight) && (
        <div className="flex items-center justify-end gap-1 mb-2 px-4">
          {canScrollLeft && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur shadow-sm hover:bg-background"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {canScrollRight && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur shadow-sm hover:bg-background"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <ScrollArea className="w-full" orientation="horizontal">
        <div className="flex items-center gap-6 pb-2 px-4 min-w-max snap-x snap-mandatory scroll-smooth">
          <div className="flex flex-col gap-2 min-w-[140px] snap-start shrink-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Format</Label>
            <FormatSelector selected={format} onSelect={onFormatChange} />
          </div>

          <div className="flex flex-col gap-2 min-w-[180px] snap-start shrink-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Padding</Label>
            <div className="flex items-center gap-3">
              <Slider min={0} max={160} step={8} value={padding} onValueChange={onPaddingChange} className="flex-1" />
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">{padding[0]}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px] snap-start shrink-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Radius</Label>
            <div className="flex items-center gap-3">
              <Slider
                min={0}
                max={48}
                step={4}
                value={cornerRadius}
                onValueChange={onCornerRadiusChange}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">{cornerRadius[0]}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px] snap-start shrink-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shadow</Label>
            <div className="flex items-center gap-3">
              <Slider min={0} max={100} step={5} value={shadow} onValueChange={onShadowChange} className="flex-1" />
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">{shadow[0]}</span>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

