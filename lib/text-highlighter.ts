import type { Highlighter } from "shiki"
import getWasm from "shiki/wasm"
import { TEXT_LANGUAGES, resolveTextLanguageId } from "@/lib/text-languages"
import { TEXT_THEMES } from "@/lib/text-themes"

type TextHighlighterState = {
  highlighter: Highlighter
  usesBundled: boolean
  bundledLangs: Set<string>
}

let cached: Promise<TextHighlighterState> | null = null

export function preloadTextHighlighter() {
  void getTextHighlighter()
}

export async function getTextHighlighter(): Promise<TextHighlighterState> {
  if (cached) return cached

  cached = (async () => {
    const shiki = (await import("shiki")) as any

    if ("createHighlighter" in shiki) {
      const bundledIds = shiki.bundledLanguages ? Object.keys(shiki.bundledLanguages) : []
      const bundledLangIds = Array.from(
        new Set(Object.entries(TEXT_LANGUAGES).map(([key, lang]) => resolveTextLanguageId(key, lang.name))),
      )
      const filteredLangIds = bundledIds.length
        ? bundledLangIds.filter((lang) => bundledIds.includes(lang))
        : bundledLangIds

      const instance = await shiki.createHighlighter({
        themes: TEXT_THEMES.map((item) => item.shiki),
        langs: filteredLangIds,
      })

      return {
        highlighter: instance as Highlighter,
        usesBundled: true,
        bundledLangs: new Set(filteredLangIds),
      }
    }

    if ("getHighlighterCore" in shiki) {
      const preloadLangModules = [
        TEXT_LANGUAGES.javascript.src,
        TEXT_LANGUAGES.typescript.src,
        TEXT_LANGUAGES.tsx.src,
        TEXT_LANGUAGES.python.src,
      ]

      const instance = await shiki.getHighlighterCore({
        themes: TEXT_THEMES.map((item) => item.shiki),
        langs: preloadLangModules.map((src) => src()),
        loadWasm: getWasm,
      })

      return {
        highlighter: instance as Highlighter,
        usesBundled: false,
        bundledLangs: new Set(),
      }
    }

    throw new Error("Unsupported Shiki runtime")
  })()

  return cached
}
