"use client"

import { ImageIcon, Upload } from "lucide-react"
import { ScreenshotCanvas } from "@/components/screenshot-canvas"
import { useScreenshotShell } from "@/components/screenshot-shell-context"
import { Button } from "@/components/ui/button"

export default function Home() {
  const {
    image,
    padding,
    cornerRadius,
    shadow,
    shadowSettings,
    cornerTexts,
    textSettings,
    background,
    format,
    canvasSize,
    showBackgroundOnly,
    showCanvas,
    handleImageUpload,
    handleCanvasReady,
  } = useScreenshotShell()

  if (!showCanvas) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Drop your screenshot</h2>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </div>
        <label htmlFor="image-upload">
          <Button variant="secondary" asChild>
            <span className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Choose Image
            </span>
          </Button>
        </label>
        <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ScreenshotCanvas
        image={image}
        padding={padding}
        cornerRadius={cornerRadius}
        background={background}
        format={format}
        shadow={shadow}
        shadowSettings={shadowSettings}
        cornerTexts={cornerTexts}
        textSettings={textSettings}
        canvasSize={canvasSize}
        showBackgroundOnly={showBackgroundOnly}
        onCanvasReady={handleCanvasReady}
      />
    </div>
  )
}
