"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { ImageIcon, Type, Upload } from "lucide-react"
import type { ShowcaseItem } from "@/types/showcase"
import { Button } from "@/components/ui/button"

interface ShowcaseCardProps {
  item: ShowcaseItem
  isActive: boolean
  dragOffset: number
  index: number
  currentIndex: number
  showUploadOverlay?: boolean
  onImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCreateText?: () => void
}

export function ShowcaseCard({ item, isActive, dragOffset, index, currentIndex, showUploadOverlay, onImageUpload, onCreateText }: ShowcaseCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const distance = index - currentIndex
  const parallaxOffset = dragOffset * (0.1 * (distance + 1))

  const clampedDistance = Math.max(-2, Math.min(2, distance))
  const rotateY = clampedDistance * -35
  const translateZ = Math.abs(clampedDistance) * -150
  const translateX = clampedDistance * 60

  return (
    <motion.div
      className="relative flex-shrink-0"
      animate={{
        scale: isActive ? 1 : 0.75,
        opacity: isActive ? 1 : 0.6,
        rotateY,
        z: translateZ,
        x: translateX + parallaxOffset,
      }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      style={{ transformStyle: "preserve-3d" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="group relative overflow-hidden rounded-2xl"
        animate={{
          y: isHovered && isActive ? -10 : 0,
          boxShadow: isHovered && isActive ? "0 40px 80px -20px rgba(0,0,0,0.8)" : "0 20px 40px -10px rgba(0,0,0,0.5)",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm" />

        <div className="relative h-[320px] w-[320px] overflow-hidden rounded-2xl p-2 sm:h-[380px] sm:w-[380px] md:h-[440px] md:w-[440px]">
          <motion.img
            src={item.image}
            alt={item.alt || item.title}
            className="h-full w-full rounded-xl object-cover"
            animate={{
              scale: isHovered && isActive ? 1.05 : 1,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            crossOrigin="anonymous"
            draggable={false}
            loading="lazy"
          />

          <motion.div
            className="absolute inset-x-2 bottom-2 rounded-b-xl bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            initial={{ opacity: 0, height: "30%" }}
            animate={{
              opacity: isActive ? 1 : 0,
              height: isHovered ? "50%" : "30%",
            }}
            transition={{ duration: 0.3 }}
          />

          <motion.div
            className="absolute inset-x-2 bottom-2 select-none p-4 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isActive ? 1 : 0,
              y: isActive ? 0 : 20,
            }}
            transition={{ duration: 0.4, delay: isActive ? 0.1 : 0 }}
          >
            <motion.h2
              className="font-serif text-xl font-bold text-white sm:text-2xl md:text-3xl"
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {item.title}
            </motion.h2>
            <motion.p
              className="mt-1 text-sm text-white/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 10,
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {item.description}
            </motion.p>
          </motion.div>

          {showUploadOverlay && isActive && (
            <motion.div
              className="absolute inset-2 flex items-center justify-center z-40"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-black/50 px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 backdrop-blur-xl">
                <div className="flex h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/10 mx-auto mb-2 sm:mb-3">
                  <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white/70" />
                </div>
                <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3 text-center">
                  <h2 className="text-xs sm:text-sm md:text-base font-medium text-white">Drop your screenshot</h2>
                  <p className="text-[10px] sm:text-xs text-white/50">or click to browse</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="image-upload-card">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/10 w-full text-xs sm:text-sm h-7 sm:h-8 md:h-9"
                      asChild
                    >
                      <span className="cursor-pointer">
                        <Upload className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Choose Image
                      </span>
                    </Button>
                  </label>
                  <input id="image-upload-card" type="file" accept="image/*" multiple onChange={onImageUpload} className="hidden" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/10 w-full text-xs sm:text-sm h-7 sm:h-8 md:h-9"
                    onClick={onCreateText}
                    disabled={!onCreateText}
                    type="button"
                  >
                    <Type className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Create Text
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-16 left-2 right-2 h-16 overflow-hidden rounded-2xl opacity-20 blur-sm"
        style={{
          background: `linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)`,
          transform: "scaleY(-1)",
        }}
        animate={{ opacity: isActive ? 0.15 : 0.05 }}
      />
    </motion.div>
  )
}
