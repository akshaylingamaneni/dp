"use client"

import type React from "react"
import { useCallback, useState } from "react"
import { Check, Copy, Download, Eye, EyeOff, Shuffle, Upload } from "lucide-react"
import { HorizontalControls } from "@/components/horizontal-controls"
import { HorizontalBackgroundSelector } from "@/components/horizontal-background-selector"
import { ScreenshotShellProvider, type ShadowSettings } from "@/components/screenshot-shell-context"
import { Button } from "@/components/ui/button"
import { getFormatById } from "@/lib/formats"
import { getRandomPattern } from "@/lib/patterns"

function getExportCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const logicalWidth = Number.parseInt(canvas.dataset.logicalWidth ?? "", 10)
  const logicalHeight = Number.parseInt(canvas.dataset.logicalHeight ?? "", 10)

  if (!Number.isFinite(logicalWidth) || !Number.isFinite(logicalHeight)) {
    return canvas
  }

  if (canvas.width === logicalWidth && canvas.height === logicalHeight) {
    return canvas
  }

  const exportCanvas = document.createElement("canvas")
  exportCanvas.width = logicalWidth
  exportCanvas.height = logicalHeight

  const ctx = exportCanvas.getContext("2d")
  if (!ctx) {
    return canvas
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(canvas, 0, 0, logicalWidth, logicalHeight)
  return exportCanvas
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [image, setImage] = useState<string | null>(null)
  const [padding, setPadding] = useState([64])
  const [cornerRadius, setCornerRadius] = useState([12])
  const [shadow, setShadow] = useState([40])
  const [shadowSettings, setShadowSettings] = useState<ShadowSettings>({
    shadowColor: "rgba(0, 0, 0, 0.4)",
    shadowOffsetX: 0,
    shadowOffsetY: 10,
    fillStyle: "rgba(0, 0, 0, 0.5)",
  })
  const [canvasSize, setCanvasSize] = useState([50])
  const [selectedBackground, setSelectedBackground] = useState("top-gradient-radial")
  const [selectedFormat, setSelectedFormat] = useState("auto")
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [showBackgroundOnly, setShowBackgroundOnly] = useState(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (readerEvent) => {
        setImage(readerEvent.target?.result as string)
        setShowBackgroundOnly(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (readerEvent) => {
        setImage(readerEvent.target?.result as string)
        setShowBackgroundOnly(false)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const handleExport = () => {
    if (canvasRef) {
      const format = getFormatById(selectedFormat)
      const filename =
        format && format.id !== "auto"
          ? `screenshot-${format.name.toLowerCase().replace(/\s+/g, "-")}.png`
          : "screenshot.png"

      const exportCanvas = getExportCanvas(canvasRef)
      const link = document.createElement("a")
      link.download = filename
      link.href = exportCanvas.toDataURL("image/png", 1.0)
      link.click()
    }
  }

  const handleCopyToClipboard = async () => {
    if (canvasRef) {
      try {
        const exportCanvas = getExportCanvas(canvasRef)
        const blob = await new Promise<Blob>((resolve) => {
          exportCanvas.toBlob((result) => {
            if (result) resolve(result)
          }, "image/png")
        })
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }
  }

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setCanvasRef(canvas)
  }, [])

  const handleTogglePreview = () => {
    setShowBackgroundOnly((current) => !current)
  }

  const handleRandomize = () => {
    const randomPattern = getRandomPattern()
    setSelectedBackground(randomPattern.id)
  }

  const showCanvas = Boolean(image || showBackgroundOnly)

  return (
    <ScreenshotShellProvider
      value={{
        image,
        padding: padding[0],
        cornerRadius: cornerRadius[0],
        shadow: shadow[0],
        shadowSettings,
        background: selectedBackground,
        format: selectedFormat,
        canvasSize: canvasSize[0],
        showBackgroundOnly,
        showCanvas,
        handleImageUpload,
        handleCanvasReady,
      }}
    >
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-4 py-3 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-foreground" viewBox="0 0 76 65" fill="currentColor">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            <span className="text-sm font-medium text-foreground">Screenshot</span>
          </div>
          {showCanvas && (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyToClipboard}
                className="text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button onClick={handleExport} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          <main
            className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {children}
          </main>

          <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRandomize} className="bg-transparent">
                    <Shuffle className="h-3.5 w-3.5 mr-2" />
                    Random
                  </Button>
                  <Button
                    variant={showBackgroundOnly ? "default" : "outline"}
                    size="sm"
                    onClick={handleTogglePreview}
                    className={showBackgroundOnly ? "" : "bg-transparent"}
                  >
                    {showBackgroundOnly ? (
                      <EyeOff className="h-3.5 w-3.5 mr-2" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 mr-2" />
                    )}
                    {showBackgroundOnly ? "Image" : "BG"}
                  </Button>
                  {image && (
                    <>
                      <label htmlFor="image-reupload">
                        <Button variant="outline" size="sm" className="bg-transparent" asChild>
                          <span className="cursor-pointer">
                            <Upload className="h-3.5 w-3.5 mr-2" />
                            Change Image
                          </span>
                        </Button>
                      </label>
                      <input
                        id="image-reupload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
              </div>

              <HorizontalControls
                format={selectedFormat}
                padding={padding}
                cornerRadius={cornerRadius}
                shadow={shadow}
                shadowSettings={shadowSettings}
                canvasSize={canvasSize}
                onFormatChange={setSelectedFormat}
                onPaddingChange={setPadding}
                onCornerRadiusChange={setCornerRadius}
                onShadowChange={setShadow}
                onShadowSettingsChange={setShadowSettings}
                onCanvasSizeChange={setCanvasSize}
              />

              <div className="px-4">
                <HorizontalBackgroundSelector selected={selectedBackground} onSelect={setSelectedBackground} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScreenshotShellProvider>
  )
}
