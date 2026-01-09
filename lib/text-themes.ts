import { bundledThemesInfo } from "shiki"
import tailwindDark from "@/data/shiki/tailwind-dark.json"
import tailwindLight from "@/data/shiki/tailwind-light.json"
import vercelDark from "@/data/shiki/vercel-dark.json"
import supabaseDark from "@/data/shiki/supabase-dark.json"

type ThemeType = "dark" | "light"

export type TextTheme = {
  id: string
  name: string
  shiki: any
  background: string
  header: string
  text: string
  isDark: boolean
}

export type TextThemeOption = {
  id: string
  name: string
  type: ThemeType
  shiki: any
}

const CUSTOM_THEMES: TextThemeOption[] = [
  {
    id: "tailwind-dark",
    name: "Tailwind Dark",
    type: "dark",
    shiki: tailwindDark,
  },
  {
    id: "tailwind-light",
    name: "Tailwind Light",
    type: "light",
    shiki: tailwindLight,
  },
  {
    id: "vercel-dark",
    name: "Vercel",
    type: "dark",
    shiki: vercelDark,
  },
  {
    id: "supabase-dark",
    name: "Supabase",
    type: "dark",
    shiki: supabaseDark,
  },
]

const CUSTOM_THEME_IDS = new Set(CUSTOM_THEMES.map((theme) => theme.id))
const BUNDLED_THEMES: TextThemeOption[] = bundledThemesInfo
  .filter((theme) => !CUSTOM_THEME_IDS.has(theme.id))
  .map((theme) => ({
    id: theme.id,
    name: theme.displayName ?? theme.id,
    type: theme.type as ThemeType,
    shiki: theme.import,
  }))

export const TEXT_THEMES: TextThemeOption[] = [
  ...CUSTOM_THEMES,
  ...BUNDLED_THEMES,
]

export const DEFAULT_TEXT_THEME_ID = "vercel-dark"

const FALLBACK_DARK = {
  background: "#0f172a",
  header: "#1e293b",
  text: "#f8fafc",
  isDark: true,
}

const FALLBACK_LIGHT = {
  background: "#f8fafc",
  header: "#e2e8f0",
  text: "#0f172a",
  isDark: false,
}

const themeOptions = new Map(TEXT_THEMES.map((theme) => [theme.id, theme]))
const resolvedThemes = new Map<string, Promise<TextTheme>>()

export function getTextThemeOption(themeId: string) {
  return themeOptions.get(themeId) ?? themeOptions.get(DEFAULT_TEXT_THEME_ID)!
}

export function getTextThemeInput(themeId: string) {
  return getTextThemeOption(themeId).shiki
}

export function getFallbackTextTheme(themeId: string): TextTheme {
  const option = getTextThemeOption(themeId)
  const fallback = option.type === "light" ? FALLBACK_LIGHT : FALLBACK_DARK

  return {
    id: option.id,
    name: option.name,
    shiki: option.shiki,
    background: fallback.background,
    header: fallback.header,
    text: fallback.text,
    isDark: fallback.isDark,
  }
}

export async function resolveTextTheme(themeId: string): Promise<TextTheme> {
  const option = getTextThemeOption(themeId)
  const cached = resolvedThemes.get(option.id)
  if (cached) return cached

  const resolver = (async () => {
    const theme = await loadTheme(option.shiki)
    const fallback = option.type === "light" ? FALLBACK_LIGHT : FALLBACK_DARK
    const background = resolveHexColor(
      theme?.colors?.["editor.background"] ?? theme?.bg,
      fallback.background,
    )
    const text = resolveHexColor(
      theme?.colors?.["editor.foreground"] ?? theme?.colors?.foreground ?? theme?.fg,
      fallback.text,
    )
    const header = mixHex(background, option.type === "dark" ? "#ffffff" : "#000000", 0.08) ?? fallback.header

    return {
      id: option.id,
      name: option.name,
      shiki: option.shiki,
      background,
      header,
      text,
      isDark: option.type === "dark",
    }
  })()

  resolvedThemes.set(option.id, resolver)
  return resolver
}

async function loadTheme(themeInput: any) {
  if (typeof themeInput === "function") {
    const module = await themeInput()
    return module?.default ?? module
  }

  if (typeof themeInput === "string") {
    return null
  }

  return themeInput
}

function resolveHexColor(color: string | undefined, fallback: string) {
  return normalizeHex(color) ?? fallback
}

function normalizeHex(color?: string) {
  if (!color) return null
  const value = color.trim().toLowerCase()
  if (!value.startsWith("#")) return null
  const hex = value.slice(1)
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
  }
  if (hex.length === 6) return `#${hex}`
  if (hex.length === 8) return `#${hex.slice(0, 6)}`
  return null
}

function mixHex(base: string, overlay: string, amount: number) {
  const baseRgb = hexToRgb(base)
  const overlayRgb = hexToRgb(overlay)
  if (!baseRgb || !overlayRgb) return null
  const [br, bg, bb] = baseRgb
  const [or, og, ob] = overlayRgb
  const mix = (channel: number, target: number) =>
    Math.round(channel + (target - channel) * amount)
  return rgbToHex(mix(br, or), mix(bg, og), mix(bb, ob))
}

function hexToRgb(value: string) {
  const hex = normalizeHex(value)
  if (!hex) return null
  const parsed = parseInt(hex.slice(1), 16)
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255] as const
}

function rgbToHex(red: number, green: number, blue: number) {
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0")
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}
