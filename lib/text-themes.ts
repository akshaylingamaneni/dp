import tailwindDark from "@/data/shiki/tailwind-dark.json"
import tailwindLight from "@/data/shiki/tailwind-light.json"

export type TextTheme = {
  id: string
  name: string
  shiki: any
  background: string
  header: string
  text: string
  isDark: boolean
}

export const TEXT_THEMES: TextTheme[] = [
  {
    id: "tailwind-dark",
    name: "Tailwind Dark",
    shiki: tailwindDark,
    background: "#0f172a",
    header: "#1e293b",
    text: "#f8fafc",
    isDark: true,
  },
  {
    id: "tailwind-light",
    name: "Tailwind Light",
    shiki: tailwindLight,
    background: "#f8fafc",
    header: "#e2e8f0",
    text: "#0f172a",
    isDark: false,
  },
]

export const DEFAULT_TEXT_THEME_ID = TEXT_THEMES[0].id
