"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { Highlighter } from "shiki"
import { TEXT_LANGUAGES, resolveTextLanguageId } from "@/lib/text-languages"
import { ensureTextTheme, getTextHighlighter } from "@/lib/text-highlighter"
import { DEFAULT_TEXT_THEME_ID, TEXT_THEMES, getFallbackTextTheme, resolveTextTheme } from "@/lib/text-themes"
import { FONTS, getFontById } from "@/lib/fonts"
import { nodeToPng } from "@/lib/text-image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import styles from "./text-editor.module.css"

const escapeHtml = (code: string) =>
  code.replace(/[\u00A0-\u9999<>\&]/g, (value) => `&#${value.charCodeAt(0)};`)

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  onLanguageChange: (value: string) => void
  themeId?: string
  onThemeChange: (value: string) => void
  onPreviewReady: (dataUrl: string) => void
  title?: string
  onTitleChange?: (value: string) => void
  fontFamily?: string
  onFontChange?: (value: string) => void
}

export function TextEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  themeId = DEFAULT_TEXT_THEME_ID,
  onThemeChange,
  onPreviewReady,
  title,
  onTitleChange,
  fontFamily = "font-inter",
  onFontChange,
}: TextEditorProps) {
  const [localValue, setLocalValue] = useState(value)
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)
  const [highlightedHtml, setHighlightedHtml] = useState("")
  const [theme, setTheme] = useState(() => getFallbackTextTheme(themeId))
  const cardRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  // Sync local value when prop changes (for external updates like switching items)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleTextChange = (text: string) => {
    setLocalValue(text)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onChange(text)
    }, 0)
  }

  // Memoize resolved language to avoid unnecessary recalculations
  const resolvedLanguage = language === "auto" ? "plaintext" : language
  const languageConfig = TEXT_LANGUAGES[resolvedLanguage]
  const languageId = resolveTextLanguageId(resolvedLanguage, languageConfig?.name ?? "plaintext")

  // Initialize highlighter
  useEffect(() => {
    let mounted = true
    getTextHighlighter()
      .then((state) => {
        if (mounted) setHighlighter(state.highlighter)
      })
      .catch((err) => console.error("Failed to init highlighter", err))
    return () => {
      mounted = false
    }
  }, [])

  // Resolve theme colors
  useEffect(() => {
    let mounted = true
    resolveTextTheme(themeId)
      .then((resolved) => {
        if (mounted) setTheme(resolved)
      })
      .catch((err) => console.warn("Failed to resolve theme", err))
    return () => {
      mounted = false
    }
  }, [themeId])

  // Handle Syntax Highlighting
  useEffect(() => {
    if (!highlighter || !languageId) {
      setHighlightedHtml(`<pre class="shiki"><code>${escapeHtml(localValue || " ")}</code></pre>`)
      return
    }

    let mounted = true

    const highlight = async () => {
      try {
        await ensureTextTheme(themeId)
        const html = highlighter.codeToHtml(localValue || " ", {
          lang: languageId,
          theme: themeId, // shiki uses the ID we registered
        })
        if (mounted) setHighlightedHtml(html)
      } catch (error) {
        console.warn("Highlighting failed", error)
        if (mounted) {
          setHighlightedHtml(`<pre class="shiki"><code>${escapeHtml(localValue || " ")}</code></pre>`)
        }
      }
    }

    highlight()

    return () => {
      mounted = false
    }
  }, [localValue, languageId, highlighter, themeId])

  // Handle Preview Generation
  useEffect(() => {
    if (!cardRef.current) return

    // Debounce preview generation
    const timer = setTimeout(async () => {
      if (!cardRef.current) return
      try {
        await document.fonts?.ready
        const dataUrl = await nodeToPng(cardRef.current)
        onPreviewReady(dataUrl)
      } catch (e) {
        console.error("Preview generation failed", e)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [highlightedHtml, theme.id, onPreviewReady, title, fontFamily]) // Added dependencies to re-generate preview when title or font changes

  // Simple indent handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    if (e.key === "Tab") {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const val = target.value

      const newVal = val.substring(0, start) + "  " + val.substring(end)
      handleTextChange(newVal)

      // Need to defer cursor update to next tick effectively
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2
      })
    }
  }

  const resolvedLanguageLabel = TEXT_LANGUAGES[resolvedLanguage]?.name ?? "Plaintext"

  return (
    <div className="rounded-xl border border-border bg-background/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-1 sm:items-center">
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-8 w-full sm:w-[130px] text-xs">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]" position="popper">
              <SelectItem value="auto">Auto</SelectItem>
              {Object.entries(TEXT_LANGUAGES).map(([key, lang]) => (
                <SelectItem key={key} value={key}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={themeId} onValueChange={onThemeChange}>
            <SelectTrigger className="h-8 w-full sm:w-[140px] text-xs">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]" position="popper">
              {TEXT_THEMES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fontFamily} onValueChange={onFontChange}>
            <SelectTrigger className="h-8 w-full sm:w-[130px] text-xs">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]" position="popper">
              {FONTS.map((font) => (
                <SelectItem key={font.id} value={font.id} style={font.style}>
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:block">Editing text card</span>
      </div>

      <div
        ref={cardRef}
        className={cn(
          "border border-border/60 overflow-hidden",
          theme.isDark ? "text-slate-100" : "text-slate-900",
          getFontById(fontFamily).className,
        )}
        style={{ background: theme.background }}
      >
        <div
          className="relative flex items-center justify-between px-4 py-2 text-xs"
          style={{ background: theme.header, color: theme.text }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <input
              type="text"
              value={title ?? ""}
              onChange={(e) => onTitleChange?.(e.target.value)}
              className="bg-transparent text-center font-medium uppercase tracking-wide opacity-70 focus:outline-none focus:opacity-100 pointer-events-auto w-1/3 min-w-[100px]"
              style={{ color: "inherit" }}
              placeholder="Untitled"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium opacity-70 z-10">
            <span className="opacity-60">{resolvedLanguageLabel}</span>
          </div>
        </div>

        <div className={styles.editorContainer} style={{ "--editor-bg": theme.background, "--editor-text": theme.text } as React.CSSProperties}>
          {/* The Highlighting Layer */}
          <div
            className={styles.highlightLayer}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            aria-hidden="true"
          />

          {/* The Editing Layer */}
          <textarea
            ref={textareaRef}
            className={styles.textareaLayer}
            value={localValue}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            style={{ caretColor: theme.text }}
          />
        </div>
      </div>
    </div >
  )
}
