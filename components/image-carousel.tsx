"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ImageItem } from "@/components/screenshot-shell-context"

interface ImageCarouselProps {
  images: ImageItem[]
  activeIndex: number
  onSelect: (index: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onRemove: (index: number) => void
}

export function ImageCarousel({ images, activeIndex, onSelect, onReorder, onRemove }: ImageCarouselProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onReorder(draggedIndex, toIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleRemove = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove(index)
  }

  if (images.length === 0) {
    return null
  }

  return (
    <div className="w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center gap-2 px-4 py-5 overflow-x-auto">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
          Images ({images.length})
        </span>
        <div className="flex items-center gap-4 flex-1">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(index)}
              className={cn(
                "relative group shrink-0 cursor-pointer transition-all",
                "w-32 h-32 rounded-lg border overflow-hidden",
                activeIndex === index
                  ? "shadow-md border-border ring-1 ring-primary/70"
                  : "border-border hover:border-muted-foreground",
                draggedIndex === index && "opacity-50",
                dragOverIndex === index && draggedIndex !== index && "scale-110 border-primary"
              )}
            >
              <img
                src={image.src}
                alt={image.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                onClick={handleRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {activeIndex === index && (
                <div className="absolute inset-0  pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
