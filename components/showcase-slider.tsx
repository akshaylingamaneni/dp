"use client"

import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShowcaseCard } from "./showcase-card"
import { NavigationDots } from "./navigation-dots"
import { showcaseItems } from "@/data/showcase"
import { useSliderNavigation } from "@/hooks/use-slider-navigation"
import { useSliderDrag } from "@/hooks/use-slider-drag"
import { useSliderWheel } from "@/hooks/use-slider-wheel"
import { useColorExtraction, useCurrentColors } from "@/hooks/use-color-extraction"

interface ShowcaseSliderProps {
  showUploadOverlay?: boolean
  onImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCreateText?: () => void
}

export function ShowcaseSlider({ showUploadOverlay, onImageUpload, onCreateText }: ShowcaseSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null)

  const [slideWidth, setSlideWidth] = useState(0)

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth
      const cardW = width > 768 ? 440 : width > 640 ? 380 : 320
      const gapW = width > 768 ? 96 : width > 640 ? 64 : 48
      setSlideWidth(cardW + gapW)
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const { currentIndex, goToNext, goToPrev, goToSlide } = useSliderNavigation({
    totalSlides: showcaseItems.length,
    enableKeyboard: true,
  })

  const { isDragging, dragX, handleDragStart, handleDragMove, handleDragEnd } = useSliderDrag({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
  })

  useSliderWheel({
    sliderRef,
    onScrollLeft: goToNext,
    onScrollRight: goToPrev,
  })

  const colors = useColorExtraction(showcaseItems)
  const currentColors = useCurrentColors(colors, showcaseItems[currentIndex]?.id)

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, ${currentColors[0]}66 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, ${currentColors[1]}66 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, ${currentColors[2]}44 0%, transparent 70%),
              linear-gradient(180deg, #0a0a0a 0%, #111111 100%)
            `,
          }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 backdrop-blur-3xl" />

      <div
        ref={sliderRef}
        className="relative flex h-full w-full cursor-grab items-center active:cursor-grabbing"
        style={{ perspective: "1200px" }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <motion.div
          className="flex items-center gap-[48px] px-[calc(50vw-160px)] sm:gap-[64px] sm:px-[calc(50vw-190px)] md:gap-[96px] md:px-[calc(50vw-220px)]"
          style={{
            transformStyle: "preserve-3d",
          }}
          animate={{
            x: -currentIndex * slideWidth + dragX,
          }}
          transition={isDragging ? { duration: 0 } : { duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          {showcaseItems.map((item, index) => (
            <ShowcaseCard
              key={item.id}
              item={item}
              isActive={index === currentIndex}
              dragOffset={dragX}
              index={index}
              currentIndex={currentIndex}
              showUploadOverlay={showUploadOverlay}
              onImageUpload={onImageUpload}
              onCreateText={onCreateText}
              priority={index < 2}
            />
          ))}
        </motion.div>
      </div>

      <NavigationDots total={showcaseItems.length} current={currentIndex} onSelect={goToSlide} colors={currentColors} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 left-6 hidden items-center gap-3 text-white/30 md:flex"
      >
        <kbd className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs">←</kbd>
        <kbd className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs">→</kbd>
        <span className="text-xs">navigate</span>
      </motion.div>
    </div>
  )
}
