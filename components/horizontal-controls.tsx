"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Settings2, Type } from "lucide-react"
import { FormatSelector } from "@/components/format-selector"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ShadowSettings, CornerTexts, TextSettings } from "@/components/screenshot-shell-context"
import { FONTS } from "@/lib/fonts"
import { cn } from "@/lib/utils"

const TEXT_GRADIENTS = [
  { id: "none", name: "None" },
  { id: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", name: "Purple Dream" },
  { id: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)", name: "Ocean Blue" },
  { id: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", name: "Pink Sunset" },
  { id: "linear-gradient(90deg, #fa709a 0%, #fee140 100%)", name: "Warm Flame" },
  { id: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", name: "Deep Ocean" },
  { id: "linear-gradient(90deg, #a8edea 0%, #fed6e3 100%)", name: "Pastel Dream" },
  { id: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", name: "Peach" },
  { id: "linear-gradient(90deg, #ff9a9e 0%, #fecfef 100%)", name: "Soft Pink" },
  { id: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)", name: "Cotton Candy" },
  { id: "linear-gradient(90deg, #fdcbf1 0%, #e6dee9 100%)", name: "Lavender" },
]

interface HorizontalControlsProps {
  format: string
  padding: number[]
  cornerRadius: number[]
  shadow: number[]
  shadowSettings: ShadowSettings
  cornerTexts: CornerTexts
  textSettings: TextSettings
  canvasSize: number[]
  baseColor: string
  onFormatChange: (format: string) => void
  onPaddingChange: (padding: number[]) => void
  onCornerRadiusChange: (radius: number[]) => void
  onShadowChange: (shadow: number[]) => void
  onShadowSettingsChange: (settings: ShadowSettings) => void
  onCornerTextsChange: (texts: CornerTexts) => void
  onTextSettingsChange: (settings: TextSettings) => void
  onCanvasSizeChange: (size: number[]) => void
  onBaseColorChange: (color: string) => void
}

export function HorizontalControls({
  format,
  padding,
  cornerRadius,
  shadow,
  shadowSettings,
  cornerTexts,
  textSettings,
  canvasSize,
  baseColor,
  onFormatChange,
  onPaddingChange,
  onCornerRadiusChange,
  onShadowChange,
  onShadowSettingsChange,
  onCornerTextsChange,
  onTextSettingsChange,
  onCanvasSizeChange,
  onBaseColorChange,
}: HorizontalControlsProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeSlider, setActiveSlider] = useState<string | null>(null)

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

          <div className="flex flex-col gap-2 min-w-[160px] snap-start shrink-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base Color</Label>
            <Select value={baseColor} onValueChange={onBaseColorChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="#ffffff">White</SelectItem>
                <SelectItem value="#000000">Black</SelectItem>
                <SelectItem value="#f3f4f6">Light Gray</SelectItem>
                <SelectItem value="#1f2937">Dark Gray</SelectItem>
                <SelectItem value="#ef4444">Red</SelectItem>
                <SelectItem value="#3b82f6">Blue</SelectItem>
                <SelectItem value="#10b981">Green</SelectItem>
                <SelectItem value="#f59e0b">Orange</SelectItem>
                <SelectItem value="#8b5cf6">Purple</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px] snap-start shrink-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Padding</Label>
            <div className="flex items-center gap-2">
              <Slider
                min={0}
                max={160}
                step={8}
                value={padding}
                onValueChange={onPaddingChange}
                onPointerDown={() => setActiveSlider("padding")}
                onPointerUp={() => setActiveSlider(null)}
                className="flex-1"
              />
              <span
                className={cn(
                  "text-xs tabular-nums w-8 text-right shrink-0 transition-colors duration-200",
                  activeSlider === "padding" ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {padding[0]}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px] snap-start shrink-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Radius</Label>
            <div className="flex items-center gap-2">
              <Slider
                min={0}
                max={48}
                step={4}
                value={cornerRadius}
                onValueChange={onCornerRadiusChange}
                onPointerDown={() => setActiveSlider("radius")}
                onPointerUp={() => setActiveSlider(null)}
                className="flex-1"
              />
              <span
                className={cn(
                  "text-xs tabular-nums w-8 text-right shrink-0 transition-colors duration-200",
                  activeSlider === "radius" ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {cornerRadius[0]}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px] snap-start shrink-0">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shadow</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Shadow Settings</h4>

                    <div className="space-y-2">
                      <Label className="text-xs">Shadow Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={shadowSettings.shadowColor.startsWith('#') ? shadowSettings.shadowColor : '#000000'}
                          onChange={(e) => onShadowSettingsChange({ ...shadowSettings, shadowColor: e.target.value })}
                          className="h-8 w-12 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={shadowSettings.shadowColor}
                          onChange={(e) => onShadowSettingsChange({ ...shadowSettings, shadowColor: e.target.value })}
                          className="flex-1 px-2 py-1 text-xs border rounded"
                          placeholder="rgba(0, 0, 0, 0.4)"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Offset X</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          min={-50}
                          max={50}
                          step={1}
                          value={[shadowSettings.shadowOffsetX]}
                          onValueChange={(value) => onShadowSettingsChange({ ...shadowSettings, shadowOffsetX: value[0] })}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                          {shadowSettings.shadowOffsetX}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Offset Y</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          min={-50}
                          max={50}
                          step={1}
                          value={[shadowSettings.shadowOffsetY]}
                          onValueChange={(value) => onShadowSettingsChange({ ...shadowSettings, shadowOffsetY: value[0] })}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                          {shadowSettings.shadowOffsetY}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Fill Style</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={shadowSettings.fillStyle.startsWith('#') ? shadowSettings.fillStyle : '#000000'}
                          onChange={(e) => onShadowSettingsChange({ ...shadowSettings, fillStyle: e.target.value })}
                          className="h-8 w-12 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={shadowSettings.fillStyle}
                          onChange={(e) => onShadowSettingsChange({ ...shadowSettings, fillStyle: e.target.value })}
                          className="flex-1 px-2 py-1 text-xs border rounded"
                          placeholder="rgba(0, 0, 0, 0.5)"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                min={0}
                max={100}
                step={5}
                value={shadow}
                onValueChange={onShadowChange}
                onPointerDown={() => setActiveSlider("shadow")}
                onPointerUp={() => setActiveSlider(null)}
                className="flex-1"
              />
              <span
                className={cn(
                  "text-xs tabular-nums w-8 text-right shrink-0 transition-colors duration-200",
                  activeSlider === "shadow" ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {shadow[0]}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px] snap-start shrink-0">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Corner Text</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Type className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Corner Text Settings</h4>

                    <div className="space-y-2">
                      <Label className="text-xs">Top Left</Label>
                      <input
                        type="text"
                        value={cornerTexts.topLeft}
                        onChange={(e) => onCornerTextsChange({ ...cornerTexts, topLeft: e.target.value })}
                        className="w-full px-2 py-1 text-xs border rounded"
                        placeholder="Enter text..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Top Right</Label>
                      <input
                        type="text"
                        value={cornerTexts.topRight}
                        onChange={(e) => onCornerTextsChange({ ...cornerTexts, topRight: e.target.value })}
                        className="w-full px-2 py-1 text-xs border rounded"
                        placeholder="Enter text..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Bottom Left</Label>
                      <input
                        type="text"
                        value={cornerTexts.bottomLeft}
                        onChange={(e) => onCornerTextsChange({ ...cornerTexts, bottomLeft: e.target.value })}
                        className="w-full px-2 py-1 text-xs border rounded"
                        placeholder="Enter text..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Bottom Right</Label>
                      <input
                        type="text"
                        value={cornerTexts.bottomRight}
                        onChange={(e) => onCornerTextsChange({ ...cornerTexts, bottomRight: e.target.value })}
                        className="w-full px-2 py-1 text-xs border rounded"
                        placeholder="Enter text..."
                      />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h5 className="font-medium text-xs">Text Styling</h5>

                      <div className="space-y-2">
                        <Label className="text-xs">Font Size</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            min={8}
                            max={48}
                            step={2}
                            value={[textSettings.fontSize]}
                            onValueChange={(value) => onTextSettingsChange({ ...textSettings, fontSize: value[0] })}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {textSettings.fontSize}px
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Text Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={textSettings.textColor}
                            onChange={(e) => onTextSettingsChange({ ...textSettings, textColor: e.target.value })}
                            className="h-8 w-12 rounded border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={textSettings.textColor}
                            onChange={(e) => onTextSettingsChange({ ...textSettings, textColor: e.target.value })}
                            className="flex-1 px-2 py-1 text-xs border rounded"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Font Family</Label>
                        <Select
                          value={textSettings.fontFamily}
                          onValueChange={(value) => onTextSettingsChange({ ...textSettings, fontFamily: value })}
                        >
                          <SelectTrigger size="sm" className="w-full h-8 text-xs">
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            {FONTS.map((font) => (
                              <SelectItem key={font.id} value={font.name} className="text-xs">
                                <span style={font.style}>{font.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Text Gradient</Label>
                        <Select
                          value={textSettings.textGradient}
                          onValueChange={(value) => onTextSettingsChange({ ...textSettings, textGradient: value })}
                        >
                          <SelectTrigger size="sm" className="w-full h-8 text-xs">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEXT_GRADIENTS.map((gradient) => (
                              <SelectItem key={gradient.id} value={gradient.id} className="text-xs">
                                <span className="flex items-center gap-2">
                                  {gradient.id !== "none" && (
                                    <span
                                      className="w-4 h-4 rounded border border-border"
                                      style={{ background: gradient.id }}
                                    />
                                  )}
                                  {gradient.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Text Opacity</Label>
                        <div className="flex items-center gap-3">
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[textSettings.textOpacity]}
                            onValueChange={(value) => onTextSettingsChange({ ...textSettings, textOpacity: value[0] })}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {textSettings.textOpacity.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {Object.values(cornerTexts).filter(Boolean).length > 0 ? (
                <span className="truncate">{Object.values(cornerTexts).filter(Boolean).length} corner(s) set</span>
              ) : (
                <span>No text set</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px] snap-start shrink-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</Label>
            <div className="flex items-center gap-2">
              <Slider
                min={10}
                max={100}
                step={5}
                value={canvasSize}
                onValueChange={onCanvasSizeChange}
                onPointerDown={() => setActiveSlider("size")}
                onPointerUp={() => setActiveSlider(null)}
                className="flex-1"
              />
              <span
                className={cn(
                  "text-xs tabular-nums w-8 text-right shrink-0 transition-colors duration-200",
                  activeSlider === "size" ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {canvasSize[0]}%
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

