"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Highlighter } from "shiki"
import hljs from "highlight.js"
import { TextCard } from "@/components/text-card"
import { TEXT_LANGUAGES, resolveTextLanguageId } from "@/lib/text-languages"
import { getTextHighlighter } from "@/lib/text-highlighter"
import { DEFAULT_TEXT_THEME_ID, TEXT_THEMES } from "@/lib/text-themes"
import { nodeToPng } from "@/lib/text-image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import styles from "./text-editor.module.css"

const FALLBACK_LANGUAGE = "plaintext"

const escapeHtml = (code: string) =>
  code.replace(/[\u00A0-\u9999<>\&]/g, (value) => `&#${value.charCodeAt(0)};`)

function indentText(text: string) {
  return text
    .split("\n")
    .map((str) => `  ${str}`)
    .join("\n")
}

function dedentText(text: string) {
  return text
    .split("\n")
    .map((str) => str.replace(/^\s\s/, ""))
    .join("\n")
}

function getCurrentlySelectedLine(textarea: HTMLTextAreaElement) {
  const original = textarea.value
  const selectionStart = textarea.selectionStart
  const beforeStart = original.slice(0, selectionStart)

  return original.slice(beforeStart.lastIndexOf("\n") != -1 ? beforeStart.lastIndexOf("\n") + 1 : 0).split("\n")[0]
}

function handleTab(textarea: HTMLTextAreaElement, shiftKey: boolean) {
  const original = textarea.value

  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  const beforeStart = original.slice(0, start)

  const currentLine = getCurrentlySelectedLine(textarea)

  if (start === end) {
    if (shiftKey) {
      const newStart = beforeStart.lastIndexOf("\n") + 1
      textarea.setSelectionRange(newStart, end)
      document.execCommand("insertText", false, dedentText(original.slice(newStart, end)))
    } else {
      document.execCommand("insertText", false, "  ")
    }
  } else {
    const newStart = beforeStart.lastIndexOf("\n") + 1 || 0
    textarea.setSelectionRange(newStart, end)

    if (shiftKey) {
      const newText = dedentText(original.slice(newStart, end))
      document.execCommand("insertText", false, newText)

      if (currentLine.startsWith("  ")) {
        textarea.setSelectionRange(start - 2, start - 2 + newText.length)
      } else {
        textarea.setSelectionRange(start, start + newText.length)
      }
    } else {
      const newText = indentText(original.slice(newStart, end))
      document.execCommand("insertText", false, newText)
      textarea.setSelectionRange(start + 2, start + 2 + newText.length)
    }
  }
}

function handleEnter(textarea: HTMLTextAreaElement) {
  const currentLine = getCurrentlySelectedLine(textarea)

  const currentIndentationMatch = currentLine.match(/^(\s+)/)
  let wantedIndentation = currentIndentationMatch ? currentIndentationMatch[0] : ""

  if (currentLine.match(/([\{\[:>])$/)) {
    wantedIndentation += "  "
  }

  document.execCommand("insertText", false, `\n${wantedIndentation}`)
}

function handleBracketClose(textarea: HTMLTextAreaElement) {
  const currentLine = getCurrentlySelectedLine(textarea)
  const { selectionStart, selectionEnd } = textarea

  if (selectionStart === selectionEnd && currentLine.match(/^\s{2,}$/)) {
    textarea.setSelectionRange(selectionStart - 2, selectionEnd)
  }

  document.execCommand("insertText", false, "}")
}

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  onLanguageChange: (value: string) => void
  themeId?: string
  onThemeChange: (value: string) => void
  onPreviewReady: (dataUrl: string) => void
  title?: string
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
}: TextEditorProps) {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)
  const [usesBundled, setUsesBundled] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [highlightedHtml, setHighlightedHtml] = useState("")
  const [highlightedSource, setHighlightedSource] = useState("")
  const cardRef = useRef<HTMLDivElement>(null)
  const bundledLangRef = useRef<Set<string>>(new Set())

  const theme = useMemo(() => TEXT_THEMES.find((item) => item.id === themeId) ?? TEXT_THEMES[0], [themeId])
  const fallbackHtml = useMemo(() => buildPlainHtml(value, theme.text), [value, theme.text])
  const resolvedLanguage = useMemo(
    () => (language === "auto" ? detectLanguage(value) : language),
    [language, value],
  )
  const languageKey = TEXT_LANGUAGES[resolvedLanguage] ? resolvedLanguage : FALLBACK_LANGUAGE
  const displayHtml = highlightedSource === value ? highlightedHtml : fallbackHtml

  const handleKeyDown = useCallback<React.KeyboardEventHandler<HTMLTextAreaElement>>((event) => {
    const textarea = textareaRef.current
    if (!textarea) return
    switch (event.key) {
      case "Tab":
        event.preventDefault()
        handleTab(textarea, event.shiftKey)
        break
      case "}":
        event.preventDefault()
        handleBracketClose(textarea)
        break
      case "Enter":
        event.preventDefault()
        handleEnter(textarea)
        break
      case "Escape":
        event.preventDefault()
        textarea.blur()
        break
    }
  }, [])

  useEffect(() => {
    let mounted = true

    getTextHighlighter()
      .then((state) => {
        if (!mounted) return
        setHighlighter(state.highlighter)
        setUsesBundled(state.usesBundled)
        bundledLangRef.current = state.bundledLangs
      })
      .catch((error) => {
        console.error("Failed to initialize highlighter", error)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const selectedLanguage = TEXT_LANGUAGES[languageKey]

    if (!highlighter || languageKey === FALLBACK_LANGUAGE) {
      setHighlightedHtml(fallbackHtml)
      setHighlightedSource(value)
      return
    }

    const langId = resolveTextLanguageId(languageKey, selectedLanguage.name)
    if (usesBundled && !bundledLangRef.current.has(langId)) {
      setHighlightedHtml(fallbackHtml)
      setHighlightedSource(value)
      return
    }

    const loadLanguage = async () => {
      if (!usesBundled && selectedLanguage?.src) {
        const highlighterAny = highlighter as any
        const loaded = highlighterAny.getLoadedLanguages?.() ?? []
        if (!loaded.includes(langId)) {
          await highlighterAny.loadLanguage?.(selectedLanguage.src())
        }
      }

      const html = highlighter.codeToHtml(value || " ", {
        lang: langId,
        theme: theme.id,
      })
      setHighlightedHtml(html)
      setHighlightedSource(value)
    }

    loadLanguage().catch(() => {
      setHighlightedHtml(fallbackHtml)
      setHighlightedSource(value)
    })
  }, [value, languageKey, highlighter, theme.id, usesBundled, fallbackHtml])

  useEffect(() => {
    if (!cardRef.current) return

    let active = true
    const timeout = setTimeout(async () => {
      if (!cardRef.current || !displayHtml) return
      try {
        if (document.fonts?.ready) {
          await document.fonts.ready
        }
        const dataUrl = await nodeToPng(cardRef.current)
        if (active) {
          onPreviewReady(dataUrl)
        }
      } catch (error) {
        console.error("Failed to render text card", error)
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [displayHtml, theme.id, onPreviewReady])

  const resolvedLanguageLabel = TEXT_LANGUAGES[resolvedLanguage]?.name ?? "Plaintext"

  return (
    <div className="rounded-xl border border-border bg-background/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 pb-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              {Object.entries(TEXT_LANGUAGES).map(([key, lang]) => (
                <SelectItem key={key} value={key}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={themeId} onValueChange={onThemeChange}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              {TEXT_THEMES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground">Editing text card</span>
      </div>

      <div
        className={cn("rounded-lg border border-border/60", theme.isDark ? "text-slate-100" : "text-slate-900")}
        style={{ background: theme.background }}
      >
        <div className="border-b border-border/60 px-3 py-2 text-xs opacity-70" style={{ background: theme.header }}>
          {title ?? "snippet"} · {resolvedLanguageLabel}
        </div>
        <div
          className={cn(styles.editor, "font-mono")}
          style={{ color: theme.text, "--editor-padding": "16px" } as React.CSSProperties}
          data-value={value || " "}
        >
          <textarea
            className={styles.textarea}
            style={{ caretColor: theme.text }}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            aria-label="Text editor"
            ref={textareaRef}
          />
          <div
            className={cn(styles.formatted, languageKey === FALLBACK_LANGUAGE && styles.plainText)}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        </div>
      </div>

      <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none" aria-hidden="true">
        <TextCard
          ref={cardRef}
          highlightedHtml={displayHtml}
          theme={theme}
          title={title}
          languageLabel={resolvedLanguageLabel}
        />
      </div>
    </div>
  )
}

function detectLanguage(code: string) {
  const languageKeys = Object.keys(TEXT_LANGUAGES)
  const result = hljs.highlightAuto(code, languageKeys)
  return result.language && TEXT_LANGUAGES[result.language] ? result.language : FALLBACK_LANGUAGE
}

function buildPlainHtml(code: string, textColor?: string) {
  const colorStyle = textColor ? `color: ${textColor};` : ""
  return `<pre class=\"shiki\" style=\"background-color: transparent; ${colorStyle}\"><code>${escapeHtml(code || " ")}</code></pre>`
}
