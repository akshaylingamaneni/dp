"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Github, ExternalLink } from "lucide-react"
import posthog from "posthog-js"
import { ScreenshotCanvas } from "@/components/screenshot-canvas"
import { useScreenshotShell } from "@/components/screenshot-shell-context"
import { ShowcaseSlider } from "@/components/showcase-slider"
import { TextEditor } from "@/components/text-editor"
import { DEFAULT_TEXT_THEME_ID } from "@/lib/text-themes"

export default function Home() {
  const {
    image,
    activeItem,
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
    handleCreateTextItem,
    handleTextUpdate,
    handleCanvasReady,
  } = useScreenshotShell()

  const isTextItem = activeItem?.type === "text"

  if (!showCanvas) {
    return (
      <section className="absolute inset-0 overflow-hidden" aria-label="Screenshot Composer landing">
        <ShowcaseSlider
          showUploadOverlay
          onImageUpload={handleImageUpload}
          onCreateText={handleCreateTextItem}
          selectedBackground={background}
        />

        <motion.header
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pointer-events-none absolute left-4 top-4 z-20 sm:left-6 sm:top-6 lg:bottom-0 lg:left-10 lg:top-0 lg:flex lg:max-w-sm lg:flex-col lg:justify-center xl:left-14 xl:max-w-md"
        >
          {/* Text Scrim - ensures visibility on light backgrounds */}
          <div className="absolute -inset-24 -z-10 bg-[radial-gradient(closest-side,rgba(0,0,0,0.5)_0%,transparent_100%)] opacity-100 blur-xl lg:hidden" />

          <div className="lg:hidden relative">
            <h1 className="text-sm font-medium text-white/90">
              Screenshot <span className="text-white/50">Composer</span>
            </h1>
            <p className="mt-1.5 flex gap-1.5">
              <span className="text-[10px] text-white/40">Open Source</span>
              <span className="text-white/20" aria-hidden="true">·</span>
              <span className="text-[10px] text-white/40">Free</span>
            </p>
          </div>

          <div className="hidden lg:block relative">
            {/* Desktop Scrim - Flashlight style */}
            <div className="absolute -inset-x-24 -inset-y-64 -z-10 bg-[radial-gradient(closest-side,rgba(0,0,0,0.3)_25%,transparent_100%)] blur-4xl opacity-100" />

            <h1 className="text-4xl font-bold tracking-tight text-white xl:text-5xl 2xl:text-6xl">
              Screenshot
              <br />
              <span className="text-white/50">Composer</span>
            </h1>
            <ul className="mt-5 flex flex-wrap gap-2 xl:mt-6 list-none" aria-label="Features">
              <li className="rounded-full border border-white/15 bg-neutral-950/45 px-3 py-1 text-xs text-white/60">
                Open Source
              </li>
              <li className="rounded-full border border-white/15 bg-neutral-950/45 px-3 py-1 text-xs text-white/60">
                100% Free
              </li>
              <li className="pointer-events-auto">
                <Link
                  href="https://github.com/akshaylingamaneni/ScreenshotComposer"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => posthog.capture("github_link_clicked")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-neutral-950/45 px-3 py-1 text-xs text-white/60 transition-colors hover:border-white/25 hover:bg-neutral-950/65 hover:text-white/80"
                >
                  <Github className="h-3 w-3" />
                  GitHub
                  <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              </li>
            </ul>
          </div>
        </motion.header>
      </section>
    )
  }

  return (
    <section
      className="w-full h-full p-4 sm:p-6 lg:p-8"
      aria-label="Screenshot editor"
    >
      <div className="flex h-full w-full flex-col gap-6 lg:flex-row lg:items-start">
        {isTextItem && (
          <div className="w-full lg:w-[420px] xl:w-[480px] lg:shrink-0">
            <TextEditor
              value={activeItem?.text ?? ""}
              onChange={(value) => handleTextUpdate({ text: value })}
              language={activeItem?.language ?? "auto"}
              onLanguageChange={(value) => handleTextUpdate({ language: value })}
              themeId={activeItem?.themeId ?? DEFAULT_TEXT_THEME_ID}
              onThemeChange={(value) => handleTextUpdate({ themeId: value })}
              onPreviewReady={(dataUrl) => handleTextUpdate({ src: dataUrl })}
              title={activeItem?.name}
              onTitleChange={(value) => handleTextUpdate({ name: value })}
            />
          </div>
        )}
        <div className="flex flex-1 items-center justify-center min-w-0 h-full">
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
      </div>
    </section>
  )
}
