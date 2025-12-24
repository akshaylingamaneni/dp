"use client"

import { ScreenshotCanvas } from "@/components/screenshot-canvas"
import { useScreenshotShell } from "@/components/screenshot-shell-context"
import { ShowcaseSlider } from "@/components/showcase-slider"

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
    baseColor,
    showBackgroundOnly,
    showCanvas,
    handleImageUpload,
    handleCanvasReady,
  } = useScreenshotShell()

  if (!showCanvas) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <ShowcaseSlider showUploadOverlay onImageUpload={handleImageUpload} />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
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
        baseColor={baseColor}
        showBackgroundOnly={showBackgroundOnly}
        onCanvasReady={handleCanvasReady}
      />
    </div>
  )
}
