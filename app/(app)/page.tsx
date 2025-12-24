"use client"

import { motion } from "framer-motion"
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

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pointer-events-none absolute left-4 top-4 z-20 sm:left-6 sm:top-6 lg:bottom-0 lg:left-10 lg:top-0 lg:flex lg:max-w-sm lg:flex-col lg:justify-center xl:left-14 xl:max-w-md"
        >
          <div className="lg:hidden">
            <p className="text-sm font-medium text-white/90">
              Screenshot <span className="text-white/50">Composer</span>
            </p>
            <div className="mt-1.5 flex gap-1.5">
              <span className="text-[10px] text-white/40">Open Source</span>
              <span className="text-white/20">·</span>
              <span className="text-[10px] text-white/40">Free</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-white xl:text-5xl 2xl:text-6xl">
              Screenshot
              <br />
              <span className="text-white/50">Composer</span>
            </h1>
            <div className="mt-5 flex flex-wrap gap-2 xl:mt-6">
              <span className="rounded-full border border-white/15 bg-neutral-950/45 px-3 py-1 text-xs text-white/60">
                Open Source
              </span>
              <span className="rounded-full border border-white/15 bg-neutral-950/45 px-3 py-1 text-xs text-white/60">
                100% Free
              </span>
              <span className="rounded-full border border-white/15 bg-neutral-950/45 px-3 py-1 text-xs text-white/60">
                Clean UI
              </span>
            </div>
          </div>
        </motion.div>
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
