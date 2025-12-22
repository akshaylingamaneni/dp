"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { Check, ChevronDown, Copy, Download, Eye, EyeOff, Shuffle, Upload } from "lucide-react"
import JSZip from "jszip"
import { HorizontalControls } from "@/components/horizontal-controls"
import { HorizontalBackgroundSelector } from "@/components/horizontal-background-selector"
import { ImageCarousel } from "@/components/image-carousel"
import { ScreenshotShellProvider, type ShadowSettings, type CornerTexts, type TextSettings, type ImageItem } from "@/components/screenshot-shell-context"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  const [images, setImages] = useState<ImageItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map())
  const [padding, setPadding] = useState([64])
  const [cornerRadius, setCornerRadius] = useState([12])
  const [shadow, setShadow] = useState([40])
  const [shadowSettings, setShadowSettings] = useState<ShadowSettings>({
    shadowColor: "rgba(0, 0, 0, 0.4)",
    shadowOffsetX: 0,
    shadowOffsetY: 10,
    fillStyle: "rgba(0, 0, 0, 0.5)",
  })
  const [cornerTexts, setCornerTexts] = useState<CornerTexts>({
    topLeft: "",
    topRight: "",
    bottomLeft: "",
    bottomRight: "",
  })
  const [textSettings, setTextSettings] = useState<TextSettings>({
    fontSize: 24,
    textColor: "#000000",
    fontFamily: "Geist",
    textOpacity: 1,
    textGradient: "none",
  })
  const [canvasSize, setCanvasSize] = useState([50])
  const [selectedBackground, setSelectedBackground] = useState("top-gradient-radial")
  const [selectedFormat, setSelectedFormat] = useState("auto")
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [showBackgroundOnly, setShowBackgroundOnly] = useState(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const newImages: ImageItem[] = []
      let loaded = 0

      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (readerEvent) => {
          const src = readerEvent.target?.result as string
          newImages.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            src,
            name: file.name,
          })
          loaded++

          if (loaded === files.length) {
            setImages((prev) => [...prev, ...newImages])
            if (images.length === 0) {
              setActiveIndex(0)
              setImage(newImages[0].src)
            }
            setShowBackgroundOnly(false)
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      const newImages: ImageItem[] = []
      let loaded = 0

      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (readerEvent) => {
            const src = readerEvent.target?.result as string
            newImages.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              src,
              name: file.name,
            })
            loaded++

            if (loaded === Array.from(files).filter((f) => f.type.startsWith("image/")).length) {
              setImages((prev) => [...prev, ...newImages])
              if (images.length === 0) {
                setActiveIndex(0)
                setImage(newImages[0].src)
              }
              setShowBackgroundOnly(false)
            }
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }, [images.length])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const handleExport = () => {
    if (canvasRef) {
      const format = getFormatById(selectedFormat)
      const activeImage = images[activeIndex]
      const baseName = activeImage?.name.replace(/\.[^/.]+$/, "") || "screenshot"
      const filename =
        format && format.id !== "auto"
          ? `${baseName}-${format.name.toLowerCase().replace(/\s+/g, "-")}.png`
          : `${baseName}.png`

      const exportCanvas = getExportCanvas(canvasRef)
      const link = document.createElement("a")
      link.download = filename
      link.href = exportCanvas.toDataURL("image/png", 1.0)
      link.click()
    }
  }

  const handleExportAll = async () => {
    if (images.length === 0) return

    const format = getFormatById(selectedFormat)

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      let canvas: HTMLCanvasElement

      if (i === activeIndex && canvasRef) {
        canvas = canvasRef
      } else {
        handleSetActiveIndex(i)
        await new Promise((resolve) => setTimeout(resolve, 300))
        canvas = canvasRef!
      }

      if (canvas) {
        const baseName = img.name.replace(/\.[^/.]+$/, "")
        const filename =
          format && format.id !== "auto"
            ? `${baseName}-${format.name.toLowerCase().replace(/\s+/g, "-")}.png`
            : `${baseName}.png`

        const exportCanvas = getExportCanvas(canvas)
        const link = document.createElement("a")
        link.download = filename
        link.href = exportCanvas.toDataURL("image/png", 1.0)
        link.click()

        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }
  }

  const handleExportZip = async () => {
    if (images.length === 0) return

    const zip = new JSZip()
    const format = getFormatById(selectedFormat)
    const originalIndex = activeIndex

    for (let i = 0; i < images.length; i++) {
      const img = images[i]

      if (i !== activeIndex) {
        handleSetActiveIndex(i)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      if (canvasRef) {
        const baseName = img.name.replace(/\.[^/.]+$/, "")
        const filename =
          format && format.id !== "auto"
            ? `${baseName}-${format.name.toLowerCase().replace(/\s+/g, "-")}.png`
            : `${baseName}.png`

        const exportCanvas = getExportCanvas(canvasRef)
        const dataUrl = exportCanvas.toDataURL("image/png", 1.0)
        const base64Data = dataUrl.split(",")[1]

        zip.file(filename, base64Data, { base64: true })
      }
    }

    handleSetActiveIndex(originalIndex)

    const blob = await zip.generateAsync({ type: "blob" })
    const link = document.createElement("a")
    link.download = "screenshots.zip"
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
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

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement, imageId?: string) => {
    if (imageId) {
      canvasRefs.current.set(imageId, canvas)
    } else {
      setCanvasRef(canvas)
    }
  }, [])

  const handleSetActiveIndex = useCallback((index: number) => {
    setActiveIndex(index)
    if (images[index]) {
      setImage(images[index].src)
    }
  }, [images])

  const handleReorderImages = useCallback((fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      const [removed] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, removed)

      if (activeIndex === fromIndex) {
        setActiveIndex(toIndex)
      } else if (activeIndex > fromIndex && activeIndex <= toIndex) {
        setActiveIndex(activeIndex - 1)
      } else if (activeIndex < fromIndex && activeIndex >= toIndex) {
        setActiveIndex(activeIndex + 1)
      }

      return newImages
    })
  }, [activeIndex])

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index)

      if (newImages.length === 0) {
        setImage(null)
        setActiveIndex(0)
      } else if (activeIndex >= newImages.length) {
        setActiveIndex(newImages.length - 1)
        setImage(newImages[newImages.length - 1].src)
      } else if (activeIndex === index) {
        setImage(newImages[activeIndex]?.src || newImages[0]?.src || null)
      }

      return newImages
    })
  }, [activeIndex])

  const handleTogglePreview = () => {
    setShowBackgroundOnly((current) => !current)
  }

  const handleRandomize = () => {
    const randomPattern = getRandomPattern()
    setSelectedBackground(randomPattern.id)
  }

  const showCanvas = Boolean(image || showBackgroundOnly)
  const hasMultipleImages = images.length > 1

  return (
    <ScreenshotShellProvider
      value={{
        image,
        images,
        activeIndex,
        padding: padding[0],
        cornerRadius: cornerRadius[0],
        shadow: shadow[0],
        shadowSettings,
        cornerTexts,
        textSettings,
        background: selectedBackground,
        format: selectedFormat,
        canvasSize: canvasSize[0],
        showBackgroundOnly,
        showCanvas,
        handleImageUpload,
        handleCanvasReady,
        setActiveIndex: handleSetActiveIndex,
        reorderImages: handleReorderImages,
        removeImage: handleRemoveImage,
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
              {hasMultipleImages ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48" align="end">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExport}
                        className="justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Current Image
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportAll}
                        className="justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        All Images
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportZip}
                        className="justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download as ZIP
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button onClick={handleExport} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          )}
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          {images.length > 0 && (
            <ImageCarousel
              images={images}
              activeIndex={activeIndex}
              onSelect={handleSetActiveIndex}
              onReorder={handleReorderImages}
              onRemove={handleRemoveImage}
            />
          )}
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
                            Add Images
                          </span>
                        </Button>
                      </label>
                      <input
                        id="image-reupload"
                        type="file"
                        accept="image/*"
                        multiple
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
                cornerTexts={cornerTexts}
                textSettings={textSettings}
                canvasSize={canvasSize}
                onFormatChange={setSelectedFormat}
                onPaddingChange={setPadding}
                onCornerRadiusChange={setCornerRadius}
                onShadowChange={setShadow}
                onShadowSettingsChange={setShadowSettings}
                onCornerTextsChange={setCornerTexts}
                onTextSettingsChange={setTextSettings}
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
