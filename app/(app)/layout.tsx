"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { Check, ChevronDown, Copy, Download, Eye, EyeOff, FileSliders, Shuffle, Type, Upload } from "lucide-react"
import JSZip from "jszip"
import posthog from "posthog-js"
import { HorizontalControls } from "@/components/horizontal-controls"
import { HorizontalBackgroundSelector } from "@/components/horizontal-background-selector"
import { ImageCarousel } from "@/components/image-carousel"
import { ScreenshotShellProvider, type ShadowSettings, type CornerTexts, type TextSettings, type ImageItem } from "@/components/screenshot-shell-context"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getFormatById } from "@/lib/formats"
import { getRandomPattern } from "@/lib/patterns"
import { DEFAULT_TEXT_THEME_ID } from "@/lib/text-themes"
import { preloadTextHighlighter } from "@/lib/text-highlighter"

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

const DEFAULT_TEXT_SNIPPET = `const greeting = "Hello, world!"

function sayHello(name: string) {
  return \`Hello, \${name}!\`
}

console.log(sayHello(greeting))
`

if (typeof window !== "undefined") {
  preloadTextHighlighter()
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
  const [selectedBaseColor, setSelectedBaseColor] = useState("auto")
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [showBackgroundOnly, setShowBackgroundOnly] = useState(false)
  const [applyToAll, setApplyToAll] = useState(true)


  const activeItem = images[activeIndex] ?? null
  const effectiveBackground = activeItem?.background ?? selectedBackground
  const effectivePadding = activeItem?.padding ?? padding[0]
  const effectiveCornerRadius = activeItem?.cornerRadius ?? cornerRadius[0]
  const effectiveShadow = activeItem?.shadow ?? shadow[0]
  const effectiveShadowSettings = activeItem?.shadowSettings ?? { ...shadowSettings }
  const effectiveCornerTexts = activeItem?.cornerTexts ?? { ...cornerTexts }
  const effectiveTextSettings = activeItem?.textSettings ?? { ...textSettings }
  const effectiveFormat = activeItem?.format ?? selectedFormat
  const effectiveCanvasSize = activeItem?.canvasSize ?? canvasSize[0]
  const effectiveBaseColor = activeItem?.baseColor ?? selectedBaseColor

  const handleBackgroundChange = useCallback((background: string) => {
    posthog.capture("background_changed", {
      background_id: background,
      apply_to_all: applyToAll,
      total_images: images.length,
    })
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, background })))
      setSelectedBackground(background)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], background }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll, images.length])

  const handlePaddingChange = useCallback((value: number[]) => {
    const paddingValue = value[0]
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, padding: paddingValue })))
      setPadding(value)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], padding: paddingValue }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll])

  const handleCornerRadiusChange = useCallback((value: number[]) => {
    const radiusValue = value[0]
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, cornerRadius: radiusValue })))
      setCornerRadius(value)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], cornerRadius: radiusValue }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll])

  const handleShadowChange = useCallback((value: number[]) => {
    const shadowValue = value[0]
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, shadow: shadowValue })))
      setShadow(value)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], shadow: shadowValue }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll])

  const handleShadowSettingsChange = useCallback((settings: ShadowSettings) => {
    const settingsCopy = { ...settings }
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, shadowSettings: settingsCopy })))
      setShadowSettings(settingsCopy)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], shadowSettings: settingsCopy }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll])

  const handleCornerTextsChange = useCallback((texts: CornerTexts) => {
    const textsCopy = { ...texts }
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, cornerTexts: textsCopy })))
      setCornerTexts(textsCopy)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], cornerTexts: textsCopy }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll])

  const handleTextSettingsChange = useCallback((settings: TextSettings) => {
    const settingsCopy = { ...settings }
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, textSettings: settingsCopy })))
      setTextSettings(settingsCopy)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], textSettings: settingsCopy }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll])

  const handleFormatChange = useCallback((format: string) => {
    const formatDetails = getFormatById(format)
    posthog.capture("format_changed", {
      format_id: format,
      format_name: formatDetails?.name,
      format_category: formatDetails?.category,
      apply_to_all: applyToAll,
    })
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, format })))
      setSelectedFormat(format)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], format }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll])

  const handleCanvasSizeChange = useCallback((value: number[]) => {
    const sizeValue = value[0]
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, canvasSize: sizeValue })))
      setCanvasSize(value)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], canvasSize: sizeValue }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll])

  const handleBaseColorChange = useCallback((baseColor: string) => {
    if (applyToAll) {
      setImages((prev) => prev.map((img) => ({ ...img, baseColor })))
      setSelectedBaseColor(baseColor)
    } else {
      setImages((prev) => {
        const newImages = [...prev]
        if (newImages[activeIndex]) {
          newImages[activeIndex] = { ...newImages[activeIndex], baseColor }
        }
        return newImages
      })
    }
  }, [activeIndex, applyToAll])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const newImages: ImageItem[] = []
      let loaded = 0
      const fileTypes = Array.from(files).map((f) => f.type)

      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (readerEvent) => {
          const src = readerEvent.target?.result as string
          newImages.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            src,
            name: file.name,
            type: "image",
          })
          loaded++

          if (loaded === files.length) {
            posthog.capture("image_uploaded", {
              image_count: files.length,
              file_types: fileTypes,
              total_images_after: images.length + newImages.length,
            })
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
              type: "image",
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
      posthog.capture("image_exported", {
        format_id: selectedFormat,
        format_name: format?.name,
        background_id: effectiveBackground,
        has_corner_text: Object.values(effectiveCornerTexts).some(Boolean),
        padding: effectivePadding,
        corner_radius: effectiveCornerRadius,
        shadow: effectiveShadow,
      })
      const link = document.createElement("a")
      link.download = filename
      link.href = exportCanvas.toDataURL("image/png", 1.0)
      link.click()
    }
  }

  const handleCreateTextItem = useCallback(() => {
    const newItem: ImageItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      src: "",
      name: "Untitled",
      type: "text",
      text: DEFAULT_TEXT_SNIPPET,
      language: "typescript",
      themeId: DEFAULT_TEXT_THEME_ID,
    }
    posthog.capture("text_item_created", {
      total_items_after: images.length + 1,
    })
    setImages((prev) => [...prev, newItem])
    setActiveIndex(images.length)
    setImage(null)
    setShowBackgroundOnly(false)
  }, [images.length])

  const handleTextUpdate = useCallback((updates: Partial<ImageItem>) => {
    setImages((prev) => {
      const next = [...prev]
      const current = next[activeIndex]
      if (!current || (current.type && current.type !== "text")) return prev
      next[activeIndex] = { ...current, ...updates, type: "text" }
      return next
    })
    if (typeof updates.src === "string") {
      setImage(updates.src || null)
    }
  }, [activeIndex])

  const handleExportAll = async () => {
    if (images.length === 0) return

    posthog.capture("batch_export_started", {
      image_count: images.length,
      format_id: selectedFormat,
    })

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
    posthog.capture("zip_export_completed", {
      image_count: images.length,
      format_id: selectedFormat,
    })
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
        posthog.capture("image_copied_to_clipboard", {
          format_id: selectedFormat,
          background_id: effectiveBackground,
        })
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy:", err)
        posthog.captureException(err)
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
    const nextItem = images[index]
    setImage(nextItem?.src || null)
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
    posthog.capture("image_removed", {
      removed_index: index,
      total_images_before: images.length,
    })
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
  }, [activeIndex, images.length])

  const handleTogglePreview = () => {
    setShowBackgroundOnly((current) => !current)
  }

  const handleRandomize = () => {
    posthog.capture("randomize_clicked")
    const randomPattern = getRandomPattern()
    handleBackgroundChange(randomPattern.id)
  }

  const showCanvas = images.length > 0 || showBackgroundOnly
  const hasMultipleImages = images.length > 1

  return (
    <ScreenshotShellProvider
      value={{
        image,
        images,
        activeIndex,
        activeItem,
        padding: effectivePadding,
        cornerRadius: effectiveCornerRadius,
        shadow: effectiveShadow,
        shadowSettings: effectiveShadowSettings,
        cornerTexts: effectiveCornerTexts,
        textSettings: effectiveTextSettings,
        background: effectiveBackground,
        format: effectiveFormat,
        canvasSize: effectiveCanvasSize,
        baseColor: effectiveBaseColor,
        showBackgroundOnly,
        showCanvas,
        handleImageUpload,
        handleCreateTextItem,
        handleTextUpdate,
        handleCanvasReady,
        setActiveIndex: handleSetActiveIndex,
        reorderImages: handleReorderImages,
        removeImage: handleRemoveImage,
      }}
    >
      <div className="min-h-screen bg-background flex flex-col">
        {showCanvas && (
          <header className="border-b border-border bg-background/80 backdrop-blur-sm px-4 py-2.5 sm:px-6 flex items-center justify-between" role="banner">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10" aria-hidden="true">
                <FileSliders className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:inline">Screenshot Composer</span>
            </div>
            <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyToClipboard}
                className="h-8 px-2 sm:px-3 text-muted-foreground hover:text-foreground"
                aria-label={copied ? "Image copied to clipboard" : "Copy image to clipboard"}
              >
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                <span className="ml-1.5 hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </Button>
              {hasMultipleImages ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" className="h-8 px-2 sm:px-3">
                      <Download className="h-4 w-4" />
                      <span className="ml-1.5 hidden sm:inline">Export</span>
                      <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-1" align="end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExport}
                      className="w-full justify-start h-8 px-2 text-sm"
                    >
                      <Download className="h-3.5 w-3.5 mr-2 opacity-60" />
                      Current
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportAll}
                      className="w-full justify-start h-8 px-2 text-sm"
                    >
                      <Download className="h-3.5 w-3.5 mr-2 opacity-60" />
                      All Images
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportZip}
                      className="w-full justify-start h-8 px-2 text-sm"
                    >
                      <Download className="h-3.5 w-3.5 mr-2 opacity-60" />
                      ZIP Archive
                    </Button>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button onClick={handleExport} size="sm" className="h-8 px-2 sm:px-3" aria-label="Export current image">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span className="ml-1.5 hidden sm:inline">Export</span>
                </Button>
              )}
            </nav>
          </header>
        )}

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
            className="relative flex-1 flex items-center justify-center min-h-0 overflow-hidden"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {children}
          </main>

          <aside className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" aria-label="Editor controls">
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2" role="toolbar" aria-label="Quick actions">
                  <Button variant="outline" size="sm" onClick={handleRandomize} className="bg-transparent" aria-label="Randomize background">
                    <Shuffle className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                    Random
                  </Button>
                  <Button
                    variant={showBackgroundOnly ? "default" : "outline"}
                    size="sm"
                    onClick={handleTogglePreview}
                    className={showBackgroundOnly ? "" : "bg-transparent"}
                    aria-label={showBackgroundOnly ? "Show image" : "Preview background only"}
                    aria-pressed={showBackgroundOnly}
                  >
                    {showBackgroundOnly ? (
                      <EyeOff className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                    )}
                    {showBackgroundOnly ? "Image" : "BG"}
                  </Button>
                  {images.length > 0 && (
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={handleCreateTextItem}
                      >
                        <Type className="h-3.5 w-3.5 mr-2" />
                        Add Text Card
                      </Button>
                    </>
                  )}
                  {hasMultipleImages && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="apply-to-all"
                        checked={applyToAll}
                        onCheckedChange={setApplyToAll}
                      />
                      <Label htmlFor="apply-to-all" className="text-sm cursor-pointer">
                        Apply to All
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <HorizontalControls
                format={effectiveFormat}
                padding={[effectivePadding]}
                cornerRadius={[effectiveCornerRadius]}
                shadow={[effectiveShadow]}
                shadowSettings={effectiveShadowSettings}
                cornerTexts={effectiveCornerTexts}
                textSettings={effectiveTextSettings}
                canvasSize={[effectiveCanvasSize]}
                baseColor={effectiveBaseColor}
                onFormatChange={handleFormatChange}
                onPaddingChange={handlePaddingChange}
                onCornerRadiusChange={handleCornerRadiusChange}
                onShadowChange={handleShadowChange}
                onShadowSettingsChange={handleShadowSettingsChange}
                onCornerTextsChange={handleCornerTextsChange}
                onTextSettingsChange={handleTextSettingsChange}
                onCanvasSizeChange={handleCanvasSizeChange}
                onBaseColorChange={handleBaseColorChange}
              />

              <div className="px-4">
                <HorizontalBackgroundSelector selected={effectiveBackground} onSelect={handleBackgroundChange} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ScreenshotShellProvider>
  )
}
