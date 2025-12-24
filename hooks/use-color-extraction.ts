"use client"

import { useState, useEffect } from "react"
import { extractColors } from "@/lib/color-extractor"
import { DEFAULT_COLORS } from "@/lib/slider-constants"
import type { ShowcaseItem } from "@/types/showcase"

export function useColorExtraction(items: ShowcaseItem[]): Record<number, string[]> {
  const [colors, setColors] = useState<Record<number, string[]>>({})

  useEffect(() => {
    items.forEach((item) => {
      extractColors(item.image).then((extractedColors) => {
        setColors((prev) => ({ ...prev, [item.id]: extractedColors }))
      })
    })
  }, [items])

  return colors
}

export function useCurrentColors(colors: Record<number, string[]>, itemId: number | undefined): string[] {
  return colors[itemId ?? -1] || [...DEFAULT_COLORS]
}

