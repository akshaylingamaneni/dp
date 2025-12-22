"use client"

import type React from "react"
import { createContext, useContext } from "react"

export type ShadowSettings = {
  shadowColor: string
  shadowOffsetX: number
  shadowOffsetY: number
  fillStyle: string
}

export type CornerTexts = {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
}

export type TextSettings = {
  fontSize: number
  textColor: string
  fontFamily: string
}

export type ScreenshotShellContextValue = {
  image: string | null
  padding: number
  cornerRadius: number
  shadow: number
  shadowSettings: ShadowSettings
  cornerTexts: CornerTexts
  textSettings: TextSettings
  background: string
  format: string
  canvasSize: number
  showBackgroundOnly: boolean
  showCanvas: boolean
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleCanvasReady: (canvas: HTMLCanvasElement) => void
}

const ScreenshotShellContext = createContext<ScreenshotShellContextValue | null>(null)

export function ScreenshotShellProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: ScreenshotShellContextValue
}) {
  return <ScreenshotShellContext.Provider value={value}>{children}</ScreenshotShellContext.Provider>
}

export function useScreenshotShell() {
  const context = useContext(ScreenshotShellContext)
  if (!context) {
    throw new Error("useScreenshotShell must be used within ScreenshotShellProvider")
  }
  return context
}
