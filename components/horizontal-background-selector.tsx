"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { gridPatterns } from "@/lib/patterns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HorizontalBackgroundSelectorProps {
  selected: string
  onSelect: (background: string) => void
}

function getCleanStyle(style: React.CSSProperties): React.CSSProperties {
  const clean: React.CSSProperties = {}
  if (style.background) clean.background = style.background
  if (style.backgroundImage) clean.backgroundImage = style.backgroundImage
  if (style.backgroundColor) clean.backgroundColor = style.backgroundColor
  if (style.backgroundSize) clean.backgroundSize = style.backgroundSize
  if (style.WebkitMaskImage) clean.WebkitMaskImage = style.WebkitMaskImage
  if (style.maskImage) clean.maskImage = style.maskImage
  return clean
}

export function HorizontalBackgroundSelector({ selected, onSelect }: HorizontalBackgroundSelectorProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
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
      const scrollAmount = 120
      viewport.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const navigatePattern = (direction: "left" | "right") => {
    const currentIndex = gridPatterns.findIndex((p) => p.id === selected)
    if (currentIndex === -1) return

    let newIndex: number
    if (direction === "left") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : gridPatterns.length - 1
    } else {
      newIndex = currentIndex < gridPatterns.length - 1 ? currentIndex + 1 : 0
    }

    onSelect(gridPatterns[newIndex].id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      e.nativeEvent.stopImmediatePropagation()
      navigatePattern("left")
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      e.nativeEvent.stopImmediatePropagation()
      navigatePattern("right")
    }
  }

  // Effect to ensure selection is in view
  useEffect(() => {
    const viewport = getViewport()
    if (selectedRef.current && viewport) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      })
    }
  }, [selected])

  return (
    <div className="relative w-full" ref={scrollAreaRef} onKeyDown={handleKeyDown} tabIndex={0}>
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
        <div className="flex items-start gap-3 pb-2 px-4 min-w-max snap-x snap-mandatory scroll-smooth">
          {gridPatterns.map((pattern) => {
            const isSelected = pattern.id === selected
            return (
              <button
                key={pattern.id}
                ref={isSelected ? selectedRef : null}
                onClick={() => onSelect(pattern.id)}
                className={cn(
                  "flex flex-col items-center gap-2 shrink-0 transition-all snap-start",
                  "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg p-1"
                )}
                title={pattern.name}
              >
                <div
                  className={cn(
                    "w-24 h-24 rounded-lg border-2 transition-all",
                    isSelected
                      ? "border-foreground ring-2 ring-foreground ring-offset-1 shadow-lg scale-105"
                      : "border-border/50 hover:border-muted-foreground"
                  )}
                  style={getCleanStyle(pattern.style)}
                />
                <div className="text-center max-w-[96px]">
                  <p className="text-xs font-medium text-foreground truncate">{pattern.name}</p>
                  {pattern.badge && (
                    <span className="text-[10px] text-muted-foreground">{pattern.badge}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

