"use client"

import type { CSSProperties } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { getFormatById } from "@/lib/formats"
import { getPatternById } from "@/lib/patterns"
import type { ShadowSettings, CornerTexts, TextSettings } from "@/components/screenshot-shell-context"

const DEFAULT_CANVAS_SIZE = { width: 1200, height: 800 }
const MAX_DPR = 2

type CanvasSize = { width: number; height: number }

type ImageLayout = {
  canvasWidth: number
  canvasHeight: number
  drawWidth: number
  drawHeight: number
  x: number
  y: number
}

interface ScreenshotCanvasProps {
  image: string | null
  padding: number
  cornerRadius: number
  background: string
  format: string
  shadow: number
  shadowSettings: ShadowSettings
  cornerTexts: CornerTexts
  textSettings: TextSettings
  canvasSize: number
  baseColor: string
  showBackgroundOnly: boolean
  isTextMode?: boolean
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
}

export function ScreenshotCanvas({
  image,
  padding,
  cornerRadius,
  background,
  format,
  shadow,
  shadowSettings,
  cornerTexts,
  textSettings,
  canvasSize,
  baseColor,
  showBackgroundOnly,
  isTextMode,
  onCanvasReady,
}: ScreenshotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawIdRef = useRef(0)
  const [imageDimensions, setImageDimensions] = useState<CanvasSize | null>(null)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawId = ++drawIdRef.current
    const backgroundPattern = getPatternById(background)
    const selectedFormat = getFormatById(format)
    const pixelRatio = getPixelRatio()

    const renderBackground = (size: CanvasSize) => {
      setupCanvas(canvas, ctx, size.width, size.height, pixelRatio)
      setImageDimensions(size)
      drawBackground(ctx, size.width, size.height, backgroundPattern, baseColor)
    }

    if (showBackgroundOnly || !image) {
      const size = resolveCanvasSize(selectedFormat)
      renderBackground(size)
      drawCornerTexts(ctx, size.width, size.height, cornerTexts, textSettings, padding)
      onCanvasReady?.(canvas)
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      if (drawId !== drawIdRef.current) return

      const layout = computeImageLayout(img, selectedFormat, padding)
      renderBackground({ width: layout.canvasWidth, height: layout.canvasHeight })

      const shadowBlur = Math.max(0, shadow)
      if (shadowBlur > 0) {
        ctx.save()
        ctx.shadowColor = shadowSettings.shadowColor
        ctx.shadowBlur = shadowBlur
        ctx.shadowOffsetX = shadowSettings.shadowOffsetX
        ctx.shadowOffsetY = shadowSettings.shadowOffsetY
        ctx.fillStyle = shadowSettings.fillStyle
        roundRect(ctx, layout.x, layout.y, layout.drawWidth, layout.drawHeight, cornerRadius)
        ctx.fill()
        ctx.restore()
      }

      ctx.save()
      roundRect(ctx, layout.x, layout.y, layout.drawWidth, layout.drawHeight, cornerRadius)
      ctx.clip()
      ctx.drawImage(img, layout.x, layout.y, layout.drawWidth, layout.drawHeight)
      ctx.restore()

      drawCornerTexts(ctx, layout.canvasWidth, layout.canvasHeight, cornerTexts, textSettings, padding)

      onCanvasReady?.(canvas)
    }

    img.onerror = () => {
      if (drawId !== drawIdRef.current) return
      renderBackground(resolveCanvasSize(selectedFormat))
      onCanvasReady?.(canvas)
    }

    img.src = image
  }, [image, padding, cornerRadius, background, format, shadow, shadowSettings, cornerTexts, textSettings, showBackgroundOnly, baseColor, onCanvasReady])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const canvasStyle = imageDimensions
    ? {
      maxWidth: isTextMode ? `min(${canvasSize}vw, 100%)` : `${canvasSize}vw`,
      maxHeight: isTextMode ? `min(${canvasSize}vh, 100%)` : `${canvasSize}vh`,
      aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`,
    }
    : {}

  return (
    <div className="flex items-center justify-center w-full h-full relative" style={{ height: "100%" }}>
      <canvas
        ref={canvasRef}
        className="rounded-lg border-1 shadow-2xl"
        style={{
          ...canvasStyle,
          width: "auto",
          height: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        }}
      />
    </div>
  )
}

function getPixelRatio(): number {
  const ratio = globalThis.devicePixelRatio ?? 1
  return Math.min(MAX_DPR, Math.max(1, ratio))
}

function setupCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixelRatio: number,
) {
  const scaledWidth = Math.max(1, Math.round(width * pixelRatio))
  const scaledHeight = Math.max(1, Math.round(height * pixelRatio))
  canvas.width = scaledWidth
  canvas.height = scaledHeight
  canvas.dataset.logicalWidth = String(width)
  canvas.dataset.logicalHeight = String(height)
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
}

function resolveCanvasSize(selectedFormat: ReturnType<typeof getFormatById>): CanvasSize {
  if (selectedFormat && selectedFormat.id !== "auto" && selectedFormat.width > 0 && selectedFormat.height > 0) {
    return { width: selectedFormat.width, height: selectedFormat.height }
  }

  return { ...DEFAULT_CANVAS_SIZE }
}

function computeImageLayout(
  img: HTMLImageElement,
  selectedFormat: ReturnType<typeof getFormatById>,
  padding: number,
): ImageLayout {
  const safePadding = Math.max(0, padding)
  const imgWidth = Math.max(1, img.width)
  const imgHeight = Math.max(1, img.height)

  if (selectedFormat && selectedFormat.id !== "auto" && selectedFormat.width > 0 && selectedFormat.height > 0) {
    const canvasWidth = selectedFormat.width
    const canvasHeight = selectedFormat.height

    const availableWidth = Math.max(1, canvasWidth - safePadding * 2)
    const availableHeight = Math.max(1, canvasHeight - safePadding * 2)

    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight)
    const drawWidth = imgWidth * scale
    const drawHeight = imgHeight * scale

    return {
      canvasWidth,
      canvasHeight,
      drawWidth,
      drawHeight,
      x: (canvasWidth - drawWidth) / 2,
      y: (canvasHeight - drawHeight) / 2,
    }
  }

  const canvasWidth = imgWidth + safePadding * 2
  const canvasHeight = imgHeight + safePadding * 2

  return {
    canvasWidth,
    canvasHeight,
    drawWidth: imgWidth,
    drawHeight: imgHeight,
    x: safePadding,
    y: safePadding,
  }
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundPattern: ReturnType<typeof getPatternById>,
  customBaseColor?: string,
) {
  if (!backgroundPattern) {
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, width, height)
    return
  }
  const style = backgroundPattern.style
  const baseColor = customBaseColor === "auto" ? inferBaseColor(style) : customBaseColor || inferBaseColor(style)
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, width, height)

  const gradientSource = resolveGradientSource(style)

  if (gradientSource.includes("gradient")) {
    const bgSizeStr = style.backgroundSize as string | undefined
    const bgSizes = bgSizeStr ? parseBgSizes(bgSizeStr) : []
    const gradients = parseAllGradients(gradientSource, width, height, bgSizes)
    let sizeIndex = 0
    gradients.forEach((gradientInfo) => {
      ctx.save()
      let currentSize = { width: 0, height: 0 }
      if (bgSizes.length == 1) {
        currentSize = bgSizes[0] || { width: 0, height: 0 }
      } else {
        currentSize = bgSizes[sizeIndex] || { width: 0, height: 0 }
      }
      sizeIndex++
      if (gradientInfo.type === "radial") {
        const isEllipse = gradientInfo.rx !== undefined && gradientInfo.ry !== undefined

        if (currentSize.width > 0 && currentSize.height > 0) {
          const patternCanvas = document.createElement("canvas")
          patternCanvas.width = currentSize.width
          patternCanvas.height = currentSize.height
          const patternCtx = patternCanvas.getContext("2d")

          if (patternCtx) {
            if (isEllipse) {
              const rx = gradientInfo.rx!
              const ry = gradientInfo.ry!
              const maxRadius = Math.max(rx, ry)
              const scaleX = rx / maxRadius
              const scaleY = ry / maxRadius

              patternCtx.save()
              patternCtx.translate(gradientInfo.cx, gradientInfo.cy)
              patternCtx.scale(scaleX, scaleY)
              patternCtx.translate(-gradientInfo.cx, -gradientInfo.cy)

              const gradient = patternCtx.createRadialGradient(
                gradientInfo.cx,
                gradientInfo.cy,
                0,
                gradientInfo.cx,
                gradientInfo.cy,
                maxRadius,
              )
              applyGradientStops(gradient, gradientInfo.stops)
              patternCtx.fillStyle = gradient
              const fillWidth = currentSize.width / scaleX
              const fillHeight = currentSize.height / scaleY
              patternCtx.fillRect(-fillWidth, -fillHeight, fillWidth * 3, fillHeight * 3)
              patternCtx.restore()
            } else {
              const gradient = patternCtx.createRadialGradient(
                gradientInfo.cx,
                gradientInfo.cy,
                0,
                gradientInfo.cx,
                gradientInfo.cy,
                gradientInfo.radius,
              )
              applyGradientStops(gradient, gradientInfo.stops)
              patternCtx.fillStyle = gradient
              patternCtx.fillRect(0, 0, currentSize.width, currentSize.height)
            }

            const canvasPattern = ctx.createPattern(patternCanvas, "repeat")
            if (canvasPattern) {
              ctx.fillStyle = canvasPattern
              ctx.fillRect(0, 0, width, height)
            }
          }
        } else {
          if (isEllipse) {
            const rx = gradientInfo.rx!
            const ry = gradientInfo.ry!
            const maxRadius = Math.max(rx, ry)
            const scaleX = rx / maxRadius
            const scaleY = ry / maxRadius

            ctx.save()
            ctx.translate(gradientInfo.cx, gradientInfo.cy)
            ctx.scale(scaleX, scaleY)
            ctx.translate(-gradientInfo.cx, -gradientInfo.cy)

            const gradient = ctx.createRadialGradient(
              gradientInfo.cx,
              gradientInfo.cy,
              0,
              gradientInfo.cx,
              gradientInfo.cy,
              maxRadius,
            )
            applyGradientStops(gradient, gradientInfo.stops)
            ctx.fillStyle = gradient
            const fillWidth = width / scaleX
            const fillHeight = height / scaleY
            ctx.fillRect(-fillWidth, -fillHeight, fillWidth * 3, fillHeight * 3)
            ctx.restore()
          } else {
            const gradient = ctx.createRadialGradient(
              gradientInfo.cx,
              gradientInfo.cy,
              0,
              gradientInfo.cx,
              gradientInfo.cy,
              gradientInfo.radius,
            )
            applyGradientStops(gradient, gradientInfo.stops)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, width, height)
          }
        }
      } else if (gradientInfo.type === "linear") {
        if (currentSize.width > 0 && currentSize.height > 0) {
          const patternCanvas = document.createElement("canvas")
          patternCanvas.width = currentSize.width
          patternCanvas.height = currentSize.height
          const patternCtx = patternCanvas.getContext("2d")

          if (patternCtx) {
            const dx = gradientInfo.x2 - gradientInfo.x1
            const dy = gradientInfo.y2 - gradientInfo.y1
            const fullCanvasAngleRad = Math.atan2(dy, dx)
            const patternDiagonal = Math.sqrt(currentSize.width * currentSize.width + currentSize.height * currentSize.height)
            const centerX = currentSize.width / 2
            const centerY = currentSize.height / 2

            const px1 = centerX - (Math.cos(fullCanvasAngleRad) * patternDiagonal) / 2
            const py1 = centerY - (Math.sin(fullCanvasAngleRad) * patternDiagonal) / 2
            const px2 = centerX + (Math.cos(fullCanvasAngleRad) * patternDiagonal) / 2
            const py2 = centerY + (Math.sin(fullCanvasAngleRad) * patternDiagonal) / 2

            const gradient = patternCtx.createLinearGradient(px1, py1, px2, py2)
            applyGradientStops(gradient, gradientInfo.stops)
            patternCtx.fillStyle = gradient
            patternCtx.fillRect(0, 0, currentSize.width, currentSize.height)
            const canvasPattern = ctx.createPattern(patternCanvas, "repeat")
            if (canvasPattern) {
              ctx.fillStyle = canvasPattern
              ctx.fillRect(0, 0, width, height)
            }
          }
        } else {
          const dx = gradientInfo.x2 - gradientInfo.x1
          const dy = gradientInfo.y2 - gradientInfo.y1
          const fullCanvasAngleRad = Math.atan2(dy, dx)
          const diagonal = Math.sqrt(width * width + height * height)
          const centerX = width / 2
          const centerY = height / 2

          const px1 = centerX - (Math.cos(fullCanvasAngleRad) * diagonal) / 2
          const py1 = centerY - (Math.sin(fullCanvasAngleRad) * diagonal) / 2
          const px2 = centerX + (Math.cos(fullCanvasAngleRad) * diagonal) / 2
          const py2 = centerY + (Math.sin(fullCanvasAngleRad) * diagonal) / 2
          const gradient = ctx.createLinearGradient(px1, py1, px2, py2)
          applyGradientStops(gradient, gradientInfo.stops)
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, width, height)
        }
      } else if (gradientInfo.type === "repeating-linear") {
        const patternWidth = Math.max(1, Math.ceil(gradientInfo.sizeX))
        const patternHeight = Math.max(1, Math.ceil(gradientInfo.sizeY))
        const patternCanvas = document.createElement("canvas")
        patternCanvas.width = patternWidth
        patternCanvas.height = patternHeight
        const patternCtx = patternCanvas.getContext("2d")

        if (patternCtx) {
          const gradient = patternCtx.createLinearGradient(
            gradientInfo.x1,
            gradientInfo.y1,
            gradientInfo.x2,
            gradientInfo.y2,
          )
          applyGradientStops(gradient, gradientInfo.stops)
          patternCtx.fillStyle = gradient
          patternCtx.fillRect(0, 0, patternWidth, patternHeight)

          const canvasPattern = ctx.createPattern(patternCanvas, "repeat")
          if (canvasPattern) {
            ctx.fillStyle = canvasPattern
            ctx.fillRect(0, 0, width, height)
          }
        }
      } else if (gradientInfo.type === "repeating-radial") {
        const patternCanvas = document.createElement("canvas")
        patternCanvas.width = gradientInfo.sizeX
        patternCanvas.height = gradientInfo.sizeY
        const patternCtx = patternCanvas.getContext("2d")

        if (patternCtx) {
          const gradient = patternCtx.createRadialGradient(
            gradientInfo.cx,
            gradientInfo.cy,
            0,
            gradientInfo.cx,
            gradientInfo.cy,
            gradientInfo.radius,
          )
          applyGradientStops(gradient, gradientInfo.stops)
          patternCtx.fillStyle = gradient
          patternCtx.fillRect(0, 0, gradientInfo.sizeX, gradientInfo.sizeY)

          const canvasPattern = ctx.createPattern(patternCanvas, "repeat")
          if (canvasPattern) {
            ctx.fillStyle = canvasPattern
            ctx.fillRect(0, 0, width, height)
          }
        }
      } else if (gradientInfo.type === "grid") {
        ctx.strokeStyle = gradientInfo.color
        ctx.lineWidth = 1
        const sizeX = gradientInfo.sizeX
        const sizeY = gradientInfo.sizeY

        if (gradientInfo.direction === "vertical") {
          for (let x = 0; x <= width; x += sizeX) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, height)
            ctx.stroke()
          }
        } else if (gradientInfo.direction === "horizontal") {
          for (let y = 0; y <= height; y += sizeY) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(width, y)
            ctx.stroke()
          }
        } else if (gradientInfo.direction === "diagonal-45") {
          ctx.lineWidth = 1
          const step = sizeX
          for (let i = -height; i <= width + height; i += step) {
            ctx.beginPath()
            ctx.moveTo(i, 0)
            ctx.lineTo(i + height, height)
            ctx.stroke()
          }
        } else if (gradientInfo.direction === "diagonal-135") {
          ctx.lineWidth = 1
          const step = sizeX
          for (let i = -height; i <= width + height; i += step) {
            ctx.beginPath()
            ctx.moveTo(i, height)
            ctx.lineTo(i + height, 0)
            ctx.stroke()
          }
        }
      }

      ctx.restore()
    })
  }

  const maskImage = resolveMaskSource(style)
  if (maskImage && maskImage.includes("gradient")) {
    const maskGradients = parseAllGradients(maskImage, width, height, [])
    const maskComposite = (style.maskComposite as string) || (style.WebkitMaskComposite as string) || "intersect"

    if (maskGradients.length > 0) {
      const maskCanvas = document.createElement("canvas")
      maskCanvas.width = width
      maskCanvas.height = height
      const maskCtx = maskCanvas.getContext("2d")

      if (maskCtx) {
        maskCtx.clearRect(0, 0, width, height)

        maskGradients.forEach((gradientInfo, index) => {
          if (index > 0 && (maskComposite === "intersect" || maskComposite === "source-in")) {
            maskCtx.globalCompositeOperation = "destination-in"
          } else if (index > 0) {
            maskCtx.globalCompositeOperation = "source-over"
          }

          if (gradientInfo.type === "radial") {
            const isEllipse = gradientInfo.rx !== undefined && gradientInfo.ry !== undefined

            if (isEllipse) {
              const rx = gradientInfo.rx!
              const ry = gradientInfo.ry!
              const maxRadius = Math.max(rx, ry)
              const scaleX = rx / maxRadius
              const scaleY = ry / maxRadius

              maskCtx.save()
              maskCtx.translate(gradientInfo.cx, gradientInfo.cy)
              maskCtx.scale(scaleX, scaleY)
              maskCtx.translate(-gradientInfo.cx, -gradientInfo.cy)

              const gradient = maskCtx.createRadialGradient(
                gradientInfo.cx,
                gradientInfo.cy,
                0,
                gradientInfo.cx,
                gradientInfo.cy,
                maxRadius,
              )
              applyMaskStops(gradient, gradientInfo.stops)
              maskCtx.fillStyle = gradient
              const fillWidth = width / scaleX
              const fillHeight = height / scaleY
              maskCtx.fillRect(-fillWidth, -fillHeight, fillWidth * 3, fillHeight * 3)
              maskCtx.restore()
            } else {
              const gradient = maskCtx.createRadialGradient(
                gradientInfo.cx,
                gradientInfo.cy,
                0,
                gradientInfo.cx,
                gradientInfo.cy,
                gradientInfo.radius,
              )
              applyMaskStops(gradient, gradientInfo.stops)
              maskCtx.fillStyle = gradient
              maskCtx.fillRect(0, 0, width, height)
            }
          } else if (gradientInfo.type === "repeating-linear") {
            const patternCanvas = document.createElement("canvas")
            patternCanvas.width = Math.max(1, Math.ceil(gradientInfo.sizeX))
            patternCanvas.height = Math.max(1, Math.ceil(gradientInfo.sizeY))
            const patternCtx = patternCanvas.getContext("2d")

            if (patternCtx) {
              const gradient = patternCtx.createLinearGradient(
                gradientInfo.x1,
                gradientInfo.y1,
                gradientInfo.x2,
                gradientInfo.y2,
              )
              applyMaskStops(gradient, gradientInfo.stops)
              patternCtx.fillStyle = gradient
              patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height)

              const canvasPattern = maskCtx.createPattern(patternCanvas, "repeat")
              if (canvasPattern) {
                maskCtx.fillStyle = canvasPattern
                maskCtx.fillRect(0, 0, width, height)
              }
            }
          }

          maskCtx.globalCompositeOperation = "source-over"
        })

        ctx.save()
        ctx.globalCompositeOperation = "destination-in"
        ctx.drawImage(maskCanvas, 0, 0)
        ctx.restore()
      }
    }
  }
}

function inferBaseColor(style: CSSProperties): string {
  if (typeof style.backgroundColor === "string" && style.backgroundColor.trim() !== "") {
    return style.backgroundColor
  }

  if (typeof style.background !== "string") {
    return "#ffffff"
  }

  const background = style.background.trim()
  if (background.startsWith("#") || background.startsWith("rgb")) {
    const token = background.split(/\s+/)[0]
    return token.startsWith("#") || token.startsWith("rgb") ? token : "#ffffff"
  }

  const lowered = background.toLowerCase()
  if (lowered.includes("#000") || lowered.includes("black")) {
    return "#000000"
  }

  if (lowered.includes("gradient")) {
    const darkStops = ["#000", "0,0,0", "#020617", "#0a0a0a", "#0f172a", "#1c1917"]
    if (darkStops.some((stop) => lowered.includes(stop))) {
      return "#000000"
    }
  }

  return "#ffffff"
}

function resolveGradientSource(style: CSSProperties): string {
  // debugger;
  const bgImage =
    typeof style.backgroundImage === "string" && style.backgroundImage !== "none" ? style.backgroundImage : ""
  const background = typeof style.background === "string" ? style.background : ""
  return bgImage || background
}

function resolveMaskSource(style: CSSProperties): string {
  if (typeof style.maskImage === "string" && style.maskImage !== "none") {
    return style.maskImage
  }
  if (typeof style.WebkitMaskImage === "string" && style.WebkitMaskImage !== "none") {
    return style.WebkitMaskImage
  }
  if (typeof style.mask === "string" && style.mask !== "none") {
    return style.mask
  }
  if (typeof style.WebkitMask === "string" && style.WebkitMask !== "none") {
    return style.WebkitMask
  }
  return ""
}

function applyGradientStops(gradient: CanvasGradient, stops: GradientStop[]) {
  stops.forEach((stop) => {
    try {
      gradient.addColorStop(stop.offset, stop.color)
    } catch (e) {
      // Skip invalid color stops
    }
  })
}

function getMaskAlpha(color: string): number {
  if (color === "transparent") {
    return 0
  }

  if (color.startsWith("#")) {
    const hex = color.slice(1)
    if (hex === "000" || hex === "000000") {
      return 1
    }
    if (hex.length === 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16)
      const g = Number.parseInt(hex.slice(2, 4), 16)
      const b = Number.parseInt(hex.slice(4, 6), 16)
      const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255
      return 1 - luminance
    }
    if (hex.length === 8) {
      return Number.parseInt(hex.slice(6), 16) / 255
    }
  }

  if (color.startsWith("rgba")) {
    const rgbaMatch = color.match(/rgba?\(([^)]+)\)/)
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(",").map((p) => p.trim())
      if (parts.length >= 4) {
        return Number.parseFloat(parts[3])
      }
      if (parts.length >= 3) {
        const r = Number.parseFloat(parts[0]) / 255
        const g = Number.parseFloat(parts[1]) / 255
        const b = Number.parseFloat(parts[2]) / 255
        const luminance = r * 0.299 + g * 0.587 + b * 0.114
        return 1 - luminance
      }
    }
  }

  return 1
}

function applyMaskStops(gradient: CanvasGradient, stops: GradientStop[]) {
  stops.forEach((stop) => {
    try {
      const alpha = getMaskAlpha(stop.color)
      gradient.addColorStop(stop.offset, `rgba(255,255,255,${alpha})`)
    } catch (e) {
      // Skip invalid color stops
    }
  })
}

function normalizeBackgroundString(str: string): string {
  return str
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",")
    .trim()
}

function parseBgSizes(bgSize: string): Array<{ width: number; height: number }> {
  const sizes: Array<{ width: number; height: number }> = []
  const normalized = normalizeBackgroundString(bgSize)
  const parts = normalized.split(",").map((s) => s.trim())

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed === "100% 100%" || trimmed === "cover" || trimmed === "contain") {
      sizes.push({ width: 0, height: 0 })
    } else if (trimmed.includes("%")) {
      const percentMatch = trimmed.match(/([\d.]+)%\s+([\d.]+)%/)
      if (percentMatch) {
        sizes.push({ width: 0, height: 0 })
      } else {
        sizes.push({ width: 0, height: 0 })
      }
    } else {
      const match = trimmed.match(/(\d+)px\s+(\d+)px/)
      if (match) {
        sizes.push({ width: Number.parseInt(match[1]), height: Number.parseInt(match[2]) })
      } else {
        const singleMatch = trimmed.match(/(\d+)px/)
        if (singleMatch) {
          const val = Number.parseInt(singleMatch[1])
          sizes.push({ width: val, height: val })
        } else {
          sizes.push({ width: 0, height: 0 })
        }
      }
    }
  }

  return sizes
}

interface GradientStop {
  offset: number
  color: string
}

interface RadialGradientInfo {
  type: "radial"
  cx: number
  cy: number
  radius: number
  rx?: number
  ry?: number
  stops: GradientStop[]
}

interface LinearGradientInfo {
  type: "linear"
  x1: number
  y1: number
  x2: number
  y2: number
  stops: GradientStop[]
}

interface RepeatingLinearGradientInfo {
  type: "repeating-linear"
  x1: number
  y1: number
  x2: number
  y2: number
  stops: GradientStop[]
  sizeX: number
  sizeY: number
}

interface RepeatingRadialGradientInfo {
  type: "repeating-radial"
  cx: number
  cy: number
  radius: number
  stops: GradientStop[]
  sizeX: number
  sizeY: number
}

interface GridInfo {
  type: "grid"
  color: string
  sizeX: number
  sizeY: number
  direction: "vertical" | "horizontal" | "diagonal-45" | "diagonal-135"
}

type GradientInfo =
  | RadialGradientInfo
  | LinearGradientInfo
  | RepeatingLinearGradientInfo
  | RepeatingRadialGradientInfo
  | GridInfo

function parseAllGradients(
  bgImage: string,
  width: number,
  height: number,
  bgSizes: Array<{ width: number; height: number }>,
): GradientInfo[] {
  const results: GradientInfo[] = []
  const normalized = normalizeBackgroundString(bgImage)

  const REP_RAD = "repeating-radial-gradient("
  const REP_LIN = "repeating-linear-gradient("
  const RAD = "radial-gradient("
  const LIN = "linear-gradient("

  const gradientMatches: string[] = []
  let i = 0
  while (i < normalized.length) {
    const remaining = normalized.slice(i)

    let gradientStart = -1
    let gradientType = ""
    if (remaining.startsWith(REP_RAD)) {
      gradientStart = i
      gradientType = "repeating-radial"
      i += REP_RAD.length
    } else if (remaining.startsWith(REP_LIN)) {
      gradientStart = i
      gradientType = "repeating-linear"
      i += REP_LIN.length
    } else if (remaining.startsWith(RAD)) {
      gradientStart = i
      gradientType = "radial"
      i += RAD.length
    } else if (remaining.startsWith(LIN)) {
      gradientStart = i
      gradientType = "linear"
      i += LIN.length
    } else {
      i++
      continue
    }

    let depth = 1
    let gradientEnd = i
    while (i < normalized.length && depth > 0) {
      if (normalized[i] === "(") depth++
      if (normalized[i] === ")") depth--
      if (depth === 0) {
        gradientEnd = i + 1
        break
      }
      i++
    }

    if (depth === 0) {
      const gradientStr = normalized.slice(gradientStart, gradientEnd)
      gradientMatches.push(gradientStr)
    }
    i++
  }

  let sizeIndex = 0

  for (const gradientStr of gradientMatches) {
    const currentSize = bgSizes[sizeIndex] || { width: 0, height: 0 }
    sizeIndex++
    // debugger;
    if (gradientStr.startsWith(REP_RAD)) {
      const content = gradientStr.slice(REP_RAD.length, -1).trim()

      let cx = 0
      let cy = 0
      let radiusPercent = 100

      const circlePxMatch = content.match(/circle\s+([\d.]+)px/)
      const circleAtMatch = content.match(/circle\s+([\d.]+)px\s+at\s+([\d.]+)%\s+([\d.]+)%/)
      const circleAtPxMatch = content.match(/circle\s+([\d.]+)px\s+at\s+([\d.]+)px\s+([\d.]+)px/)
      const atPxMatch = content.match(/at\s+([\d.]+)px\s+([\d.]+)px/)
      const atMatch = content.match(/at\s+([\d.]+)%\s+([\d.]+)%/)

      if (circleAtPxMatch) {
        const pxSize = Number.parseFloat(circleAtPxMatch[1])
        cx = Number.parseFloat(circleAtPxMatch[2])
        cy = Number.parseFloat(circleAtPxMatch[3])
        radiusPercent = (pxSize / Math.max(currentSize.width || 40, currentSize.height || 40)) * 100
      } else if (circleAtMatch) {
        const pxSize = Number.parseFloat(circleAtMatch[1])
        cx = (Number.parseFloat(circleAtMatch[2]) / 100) * (currentSize.width || 40)
        cy = (Number.parseFloat(circleAtMatch[3]) / 100) * (currentSize.height || 40)
        radiusPercent = (pxSize / Math.max(currentSize.width || 40, currentSize.height || 40)) * 100
      } else if (circlePxMatch) {
        const pxSize = Number.parseFloat(circlePxMatch[1])
        radiusPercent = (pxSize / Math.max(currentSize.width || 40, currentSize.height || 40)) * 100
      } else if (atPxMatch) {
        cx = Number.parseFloat(atPxMatch[1])
        cy = Number.parseFloat(atPxMatch[2])
      } else if (atMatch) {
        cx = (Number.parseFloat(atMatch[1]) / 100) * (currentSize.width || 40)
        cy = (Number.parseFloat(atMatch[2]) / 100) * (currentSize.height || 40)
      }

      const colorStops: GradientStop[] = []
      const colorRegex = /(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|transparent)\s*(([\d.]+)(%|px)?)?/g
      let colorMatch
      const colors: { color: string; value?: number; unit?: string }[] = []
      const maxSize = Math.max(currentSize.width || 40, currentSize.height || 40)

      while ((colorMatch = colorRegex.exec(content)) !== null) {
        let color = colorMatch[1].trim()
        if (color.startsWith("rgba") || color.startsWith("rgb")) {
          color = color.replace(/\s+/g, "")
        }
        const value = colorMatch[3] ? Number.parseFloat(colorMatch[3]) : undefined
        const unit = colorMatch[4] || undefined
        colors.push({
          color,
          value,
          unit,
        })
      }

      colors.forEach((c, i) => {
        let offset: number
        if (c.value !== undefined) {
          if (c.unit === "px") {
            offset = c.value / maxSize
          } else {
            offset = c.value / 100
          }
        } else {
          offset = i / Math.max(colors.length - 1, 1)
        }
        colorStops.push({ offset: Math.min(1, Math.max(0, offset)), color: c.color })
      })

      if (colorStops.length > 0) {
        results.push({
          type: "repeating-radial",
          cx,
          cy,
          radius: (radiusPercent / 100) * Math.max(currentSize.width || 40, currentSize.height || 40),
          stops: colorStops,
          sizeX: currentSize.width || 40,
          sizeY: currentSize.height || 40,
        })
      }
    } else if (gradientStr.startsWith(REP_LIN)) {
      const content = gradientStr.slice(REP_LIN.length, -1).trim()

      let angle = 0
      const angleMatch = content.match(/(-?[\d.]+)deg/)
      if (angleMatch) {
        angle = Number.parseFloat(angleMatch[1])
      } else if (content.includes("to right")) {
        angle = 90
      } else if (content.includes("to left")) {
        angle = 270
      } else if (content.includes("to bottom")) {
        angle = 180
      } else if (content.includes("to top")) {
        angle = 0
      }

      const colorRegex = /(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|transparent|black|white)\s*(([\d.]+)(px|%)?)?/g
      let colorMatch
      const colors: { color: string; value?: number; unit?: string }[] = []

      while ((colorMatch = colorRegex.exec(content)) !== null) {
        let color = colorMatch[1].trim()
        if (color.startsWith("rgba") || color.startsWith("rgb")) {
          color = color.replace(/\s+/g, "")
        }
        if (color === "black") color = "#000000"
        if (color === "white") color = "#ffffff"
        const value = colorMatch[3] ? Number.parseFloat(colorMatch[3]) : undefined
        const unit = colorMatch[4] || undefined
        colors.push({ color, value, unit })
      }

      let repeatSize = 0
      colors.forEach((c) => {
        if (c.value !== undefined && c.unit === "px" && c.value > repeatSize) {
          repeatSize = c.value
        }
      })
      if (repeatSize === 0) repeatSize = 8

      const isHorizontal = angle === 90 || angle === 270
      const isVertical = angle === 0 || angle === 180
      let sizeX: number, sizeY: number, x1: number, y1: number, x2: number, y2: number
      let gradientLength: number

      const hasBgSize = currentSize.width > 0 && currentSize.height > 0

      if (hasBgSize) {
        sizeX = currentSize.width
        sizeY = currentSize.height
        const angleRad = (angle - 90) * (Math.PI / 180)
        const centerX = sizeX / 2
        const centerY = sizeY / 2
        const diagonal = Math.sqrt(sizeX * sizeX + sizeY * sizeY)
        x1 = centerX - (Math.cos(angleRad) * diagonal) / 2
        y1 = centerY - (Math.sin(angleRad) * diagonal) / 2
        x2 = centerX + (Math.cos(angleRad) * diagonal) / 2
        y2 = centerY + (Math.sin(angleRad) * diagonal) / 2
        gradientLength = diagonal
      } else if (isHorizontal) {
        sizeX = repeatSize
        sizeY = 1
        x1 = 0
        y1 = 0
        x2 = repeatSize
        y2 = 0
        gradientLength = repeatSize
      } else if (isVertical) {
        sizeX = 1
        sizeY = repeatSize
        x1 = 0
        y1 = 0
        x2 = 0
        y2 = repeatSize
        gradientLength = repeatSize
      } else {
        const angleRad = (angle - 90) * (Math.PI / 180)
        const cosVal = Math.abs(Math.cos(angleRad))
        const sinVal = Math.abs(Math.sin(angleRad))

        let tileWidth: number, tileHeight: number
        if (cosVal < 0.001) {
          tileWidth = repeatSize
          tileHeight = repeatSize / sinVal
        } else if (sinVal < 0.001) {
          tileWidth = repeatSize / cosVal
          tileHeight = repeatSize
        } else {
          tileWidth = repeatSize / cosVal
          tileHeight = repeatSize / sinVal
        }

        tileWidth = Math.max(1, Math.ceil(tileWidth))
        tileHeight = Math.max(1, Math.ceil(tileHeight))

        sizeX = tileWidth
        sizeY = tileHeight
        const centerX = tileWidth / 2
        const centerY = tileHeight / 2
        const diagonal = Math.sqrt(tileWidth * tileWidth + tileHeight * tileHeight)
        x1 = centerX - (Math.cos(angleRad) * diagonal) / 2
        y1 = centerY - (Math.sin(angleRad) * diagonal) / 2
        x2 = centerX + (Math.cos(angleRad) * diagonal) / 2
        y2 = centerY + (Math.sin(angleRad) * diagonal) / 2
        gradientLength = diagonal
      }

      const colorStops: GradientStop[] = []
      const numRepeats = Math.ceil(gradientLength / repeatSize)

      for (let rep = 0; rep < numRepeats; rep++) {
        colors.forEach((c, i) => {
          let baseOffset: number
          if (c.value !== undefined) {
            if (c.unit === "px") {
              baseOffset = c.value / repeatSize
            } else {
              baseOffset = c.value / 100
            }
          } else {
            baseOffset = i / Math.max(colors.length - 1, 1)
          }
          const offset = (rep + baseOffset) / numRepeats
          if (offset >= 0 && offset <= 1) {
            colorStops.push({ offset, color: c.color })
          }
        })
      }

      if (colorStops.length > 0) {
        results.push({
          type: "repeating-linear",
          x1,
          y1,
          x2,
          y2,
          stops: colorStops,
          sizeX,
          sizeY,
        })
      }
    } else if (gradientStr.startsWith(RAD)) {
      const content = gradientStr.slice(RAD.length, -1).trim()

      const patternWidth = currentSize.width > 0 ? currentSize.width : width
      const patternHeight = currentSize.height > 0 ? currentSize.height : height

      let cx = patternWidth / 2
      let cy = patternHeight / 2
      let radiusPercent = 100
      let rxPercent: number | undefined
      let ryPercent: number | undefined

      const ellipseMatch = content.match(/ellipse\s+([\d.]+)%\s+([\d.]+)%/)
      const ellipseAtMatch = content.match(/ellipse\s+([\d.]+)%\s+([\d.]+)%\s+at\s+([\d.]+)%\s+([\d.]+)%/)

      if (ellipseAtMatch) {
        rxPercent = Number.parseFloat(ellipseAtMatch[1])
        ryPercent = Number.parseFloat(ellipseAtMatch[2])
        cx = (Number.parseFloat(ellipseAtMatch[3]) / 100) * patternWidth
        cy = (Number.parseFloat(ellipseAtMatch[4]) / 100) * patternHeight
        radiusPercent = Math.max(rxPercent, ryPercent)
      } else if (ellipseMatch) {
        rxPercent = Number.parseFloat(ellipseMatch[1])
        ryPercent = Number.parseFloat(ellipseMatch[2])
        radiusPercent = Math.max(rxPercent, ryPercent)

        const atMatch = content.match(/at\s+([\d.]+)%\s+([\d.]+)%/)
        if (atMatch) {
          cx = (Number.parseFloat(atMatch[1]) / 100) * patternWidth
          cy = (Number.parseFloat(atMatch[2]) / 100) * patternHeight
        }
      } else {
        const circlePxMatch = content.match(/circle\s+([\d.]+)px/)
        const circleAtMatch = content.match(/circle\s+([\d.]+)px\s+at\s+([\d.]+)%\s+([\d.]+)%/)
        const circleAtPxMatch = content.match(/circle\s+([\d.]+)px\s+at\s+([\d.]+)px\s+([\d.]+)px/)
        const circleAtPxOnlyMatch = content.match(/circle\s+at\s+([\d.]+)px\s+([\d.]+)px/)
        const circleAtPercentMatch = content.match(/circle\s+at\s+([\d.]+)%\s+([\d.]+)%/)

        if (circleAtPxMatch) {
          const pxSize = Number.parseFloat(circleAtPxMatch[1])
          cx = Number.parseFloat(circleAtPxMatch[2])
          cy = Number.parseFloat(circleAtPxMatch[3])
          radiusPercent = (pxSize / Math.max(width, height)) * 100
        } else if (circleAtMatch) {
          const pxSize = Number.parseFloat(circleAtMatch[1])
          cx = (Number.parseFloat(circleAtMatch[2]) / 100) * width
          cy = (Number.parseFloat(circleAtMatch[3]) / 100) * height
          radiusPercent = (pxSize / Math.max(width, height)) * 100
        } else if (circleAtPxOnlyMatch) {
          cx = Number.parseFloat(circleAtPxOnlyMatch[1])
          cy = Number.parseFloat(circleAtPxOnlyMatch[2])
          radiusPercent = 100
        } else if (circleAtPercentMatch) {
          cx = (Number.parseFloat(circleAtPercentMatch[1]) / 100) * patternWidth
          cy = (Number.parseFloat(circleAtPercentMatch[2]) / 100) * patternHeight
          radiusPercent = 100
        } else if (circlePxMatch) {
          const pxSize = Number.parseFloat(circlePxMatch[1])
          radiusPercent = (pxSize / Math.max(patternWidth, patternHeight)) * 100
        } else {
          const atMatch = content.match(/at\s+([\d.]+)%\s+([\d.]+)%/)
          if (atMatch) {
            cx = (Number.parseFloat(atMatch[1]) / 100) * patternWidth
            cy = (Number.parseFloat(atMatch[2]) / 100) * patternHeight
          }

          const atPxMatch = content.match(/at\s+([\d.]+)px\s+([\d.]+)px/)
          if (atPxMatch) {
            cx = Number.parseFloat(atPxMatch[1])
            cy = Number.parseFloat(atPxMatch[2])
          }

          const sizeMatch = content.match(/([\d.]+)%\s+([\d.]+)%/)
          if (sizeMatch) {
            radiusPercent = Math.max(Number.parseFloat(sizeMatch[1]), Number.parseFloat(sizeMatch[2]))
          }
        }
      }

      const maxRadius = (radiusPercent / 100) * Math.max(patternWidth, patternHeight)
      const colorStops: GradientStop[] = []
      const colorRegex = /(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|transparent)\s*(([\d.]+)(%|px)?)?/g
      let colorMatch
      const colors: { color: string; value?: number; unit?: string }[] = []

      while ((colorMatch = colorRegex.exec(content)) !== null) {
        let color = colorMatch[1].trim()
        if (color.startsWith("rgba") || color.startsWith("rgb")) {
          color = color.replace(/\s+/g, "")
        }
        const value = colorMatch[3] ? Number.parseFloat(colorMatch[3]) : undefined
        const unit = colorMatch[4] || undefined
        colors.push({
          color,
          value,
          unit,
        })
      }

      colors.forEach((c, i) => {
        let offset: number
        if (c.value !== undefined) {
          if (c.unit === "px") {
            offset = c.value / maxRadius
          } else {
            offset = c.value / 100
          }
        } else {
          offset = i / Math.max(colors.length - 1, 1)
        }
        colorStops.push({ offset: Math.min(1, Math.max(0, offset)), color: c.color })
      })

      if (colorStops.length > 0) {
        const gradientInfo: RadialGradientInfo = {
          type: "radial",
          cx,
          cy,
          radius: (radiusPercent / 100) * Math.max(patternWidth, patternHeight),
          stops: colorStops,
        }
        if (rxPercent !== undefined && ryPercent !== undefined) {
          gradientInfo.rx = (rxPercent / 100) * patternWidth
          gradientInfo.ry = (ryPercent / 100) * patternHeight
        }
        results.push(gradientInfo)
      }
    } else if (gradientStr.startsWith(LIN)) {
      const content = gradientStr.slice(LIN.length, -1)

      if (content.includes("1px")) {
        const colorMatch = content.match(/(#[a-fA-F0-9]+|rgba?\([^)]+\))\s+1px/)
        if (colorMatch) {
          let direction: "vertical" | "horizontal" | "diagonal-45" | "diagonal-135" = "vertical"
          if (content.includes("to bottom")) {
            direction = "horizontal"
          } else if (content.includes("45deg")) {
            direction = "diagonal-45"
          } else if (content.includes("-45deg") || content.includes("135deg")) {
            direction = "diagonal-135"
          }

          let color = colorMatch[1].trim()
          if (color.startsWith("rgba") || color.startsWith("rgb")) {
            color = color.replace(/\s+/g, "")
          }

          results.push({
            type: "grid",
            color,
            sizeX: currentSize.width || 40,
            sizeY: currentSize.height || 40,
            direction,
          })
          continue
        }
      }

      // Regular linear gradient
      let angle = 180
      const angleMatch = content.match(/(-?[\d.]+)deg/)
      if (angleMatch) {
        angle = Number.parseFloat(angleMatch[1])
      } else if (content.includes("to right")) {
        angle = 90
      } else if (content.includes("to left")) {
        angle = 270
      } else if (content.includes("to bottom")) {
        angle = 180
      } else if (content.includes("to top")) {
        angle = 0
      }

      const angleRad = (angle - 90) * (Math.PI / 180)
      const diagonal = Math.sqrt(width * width + height * height)
      const centerX = width / 2
      const centerY = height / 2

      const x1 = centerX - (Math.cos(angleRad) * diagonal) / 2
      const y1 = centerY - (Math.sin(angleRad) * diagonal) / 2
      const x2 = centerX + (Math.cos(angleRad) * diagonal) / 2
      const y2 = centerY + (Math.sin(angleRad) * diagonal) / 2

      const colorStops: GradientStop[] = []
      const colorRegex = /(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|transparent)\s*([\d.]+)?%?/g
      let colorMatch
      const colors: { color: string; percent?: number }[] = []

      while ((colorMatch = colorRegex.exec(content)) !== null) {
        let color = colorMatch[1].trim()
        if (color.startsWith("rgba") || color.startsWith("rgb")) {
          color = color.replace(/\s+/g, "")
        }
        colors.push({
          color,
          percent: colorMatch[2] ? Number.parseFloat(colorMatch[2]) : undefined,
        })
      }

      colors.forEach((c, i) => {
        const offset = c.percent !== undefined ? c.percent / 100 : i / Math.max(colors.length - 1, 1)
        colorStops.push({ offset: Math.min(1, Math.max(0, offset)), color: c.color })
      })

      if (colorStops.length > 0) {
        results.push({
          type: "linear",
          x1,
          y1,
          x2,
          y2,
          stops: colorStops,
        })
      }
    }
  }

  return results
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

type ParsedGradient = {
  x1: number
  y1: number
  x2: number
  y2: number
  stops: Array<{ color: string; position?: number }>
}

function parseLinearGradient(gradientStr: string, width: number, height: number): ParsedGradient | null {
  const linearMatch = gradientStr.match(/linear-gradient\s*\(\s*([^)]+)\)/)
  if (!linearMatch) return null

  const content = linearMatch[1]
  let angle = 180

  const angleMatch = content.match(/(-?\d+(?:\.\d+)?)deg/)
  if (angleMatch) {
    angle = parseFloat(angleMatch[1])
  } else if (content.includes("to right")) {
    angle = 90
  } else if (content.includes("to left")) {
    angle = 270
  } else if (content.includes("to bottom")) {
    angle = 180
  } else if (content.includes("to top")) {
    angle = 0
  }

  const angleRad = ((angle - 90) * Math.PI) / 180
  const diagonal = Math.sqrt(width * width + height * height)
  const centerX = width / 2
  const centerY = height / 2

  const x1 = centerX - (Math.cos(angleRad) * diagonal) / 2
  const y1 = centerY - (Math.sin(angleRad) * diagonal) / 2
  const x2 = centerX + (Math.cos(angleRad) * diagonal) / 2
  const y2 = centerY + (Math.sin(angleRad) * diagonal) / 2

  const colorStopRegex = /(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\))\s*(\d+(?:\.\d+)?)?%?/g
  const stops: Array<{ color: string; position?: number }> = []
  let match

  while ((match = colorStopRegex.exec(content)) !== null) {
    stops.push({
      color: match[1],
      position: match[2] ? parseFloat(match[2]) : undefined,
    })
  }

  if (stops.length === 0) return null

  return { x1, y1, x2, y2, stops }
}

function drawCornerTexts(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  cornerTexts: CornerTexts,
  textSettings: TextSettings,
  canvasPadding: number,
) {
  const textPadding = Math.max(16, canvasPadding * 0.25)

  ctx.save()
  ctx.font = `${textSettings.fontSize}px ${textSettings.fontFamily}`
  ctx.globalAlpha = textSettings.textOpacity

  const drawTextWithStyle = (text: string, x: number, y: number) => {
    if (textSettings.textGradient && textSettings.textGradient.trim() !== "" && textSettings.textGradient !== "none") {
      const gradientInfo = parseLinearGradient(textSettings.textGradient, canvasWidth, canvasHeight)

      if (gradientInfo) {
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = canvasWidth
        tempCanvas.height = canvasHeight
        const tempCtx = tempCanvas.getContext("2d")

        if (tempCtx) {
          const gradient = tempCtx.createLinearGradient(
            gradientInfo.x1,
            gradientInfo.y1,
            gradientInfo.x2,
            gradientInfo.y2
          )

          gradientInfo.stops.forEach((stop, i) => {
            const offset = stop.position !== undefined
              ? stop.position / 100
              : i / Math.max(gradientInfo.stops.length - 1, 1)
            gradient.addColorStop(Math.min(1, Math.max(0, offset)), stop.color)
          })

          tempCtx.fillStyle = gradient
          tempCtx.fillRect(0, 0, canvasWidth, canvasHeight)

          tempCtx.globalCompositeOperation = "destination-in"
          tempCtx.font = ctx.font
          tempCtx.textAlign = ctx.textAlign as CanvasTextAlign
          tempCtx.textBaseline = ctx.textBaseline as CanvasTextBaseline
          tempCtx.fillStyle = "black"
          tempCtx.fillText(text, x, y)

          ctx.drawImage(tempCanvas, 0, 0)
        }
      } else {
        ctx.fillStyle = textSettings.textColor
        ctx.fillText(text, x, y)
      }
    } else {
      ctx.fillStyle = textSettings.textColor
      ctx.fillText(text, x, y)
    }
  }

  if (cornerTexts.topLeft) {
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    drawTextWithStyle(cornerTexts.topLeft, textPadding, textPadding)
  }

  if (cornerTexts.topRight) {
    ctx.textAlign = "right"
    ctx.textBaseline = "top"
    drawTextWithStyle(cornerTexts.topRight, canvasWidth - textPadding, textPadding)
  }

  if (cornerTexts.bottomLeft) {
    ctx.textAlign = "left"
    ctx.textBaseline = "bottom"
    drawTextWithStyle(cornerTexts.bottomLeft, textPadding, canvasHeight - textPadding)
  }

  if (cornerTexts.bottomRight) {
    ctx.textAlign = "right"
    ctx.textBaseline = "bottom"
    drawTextWithStyle(cornerTexts.bottomRight, canvasWidth - textPadding, canvasHeight - textPadding)
  }

  ctx.restore()
}