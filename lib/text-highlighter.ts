import type { Highlighter } from "shiki"
import getWasm from "shiki/wasm"
import { CORE_TEXT_LANGUAGE_KEYS, TEXT_LANGUAGES, resolveTextLanguageId } from "@/lib/text-languages"
import { DEFAULT_TEXT_THEME_ID, getTextThemeInput, getTextThemeOption } from "@/lib/text-themes"

type TextHighlighterState = {
  highlighter: Highlighter
}

let cached: Promise<TextHighlighterState> | null = null

export function preloadTextHighlighter() {
  void getTextHighlighter()
}

export async function getTextHighlighter(): Promise<TextHighlighterState> {
  if (cached) return cached

  cached = (async () => {
    const defaultTheme = getTextThemeInput(DEFAULT_TEXT_THEME_ID)
    const shiki = (await import("shiki")) as any
    const coreLanguageIds = Array.from(
      new Set(
        CORE_TEXT_LANGUAGE_KEYS.map((key) => {
          const language = TEXT_LANGUAGES[key]
          if (!language) return null
          return resolveTextLanguageId(key, language.name)
        }).filter((value): value is string => Boolean(value)),
      ),
    )

    if ("createHighlighter" in shiki) {
      const bundledIds = shiki.bundledLanguages ? Object.keys(shiki.bundledLanguages) : []
      const filteredLangIds = bundledIds.length
        ? coreLanguageIds.filter((lang) => bundledIds.includes(lang))
        : coreLanguageIds

      const instance = await shiki.createHighlighter({
        themes: [defaultTheme],
        langs: filteredLangIds,
      })

      return {
        highlighter: instance as Highlighter,
      }
    }

    if ("getHighlighterCore" in shiki) {
      const preloadLangModules = CORE_TEXT_LANGUAGE_KEYS.map((key) => TEXT_LANGUAGES[key]?.src)
        .filter((value): value is () => Promise<any> => Boolean(value))

      // Include built-in languages (like "text") as strings
      // getHighlighterCore supports both string identifiers and module imports
      const builtInLangIds = CORE_TEXT_LANGUAGE_KEYS.filter(
        (key) => !TEXT_LANGUAGES[key]?.src,
      ).map((key) => resolveTextLanguageId(key, TEXT_LANGUAGES[key]?.name ?? key))

      const instance = await shiki.getHighlighterCore({
        themes: [defaultTheme],
        langs: [
          ...builtInLangIds,
          ...preloadLangModules.map((src) => src()),
        ],
        loadWasm: getWasm,
      })

      return {
        highlighter: instance as Highlighter,
      }
    }

    throw new Error("Unsupported Shiki runtime")
  })()

  return cached
}

export async function ensureTextTheme(themeId: string) {
  const { highlighter } = await getTextHighlighter()
  const themeOption = getTextThemeOption(themeId)
  const loadedThemes = highlighter.getLoadedThemes?.() ?? []
  if (!loadedThemes.includes(themeOption.id)) {
    await highlighter.loadTheme(themeOption.shiki)
  }
  return themeOption.id
}
