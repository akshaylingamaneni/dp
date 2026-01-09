"use client"

import type React from "react"
import { forwardRef } from "react"
import type { TextTheme } from "@/lib/text-themes"
import styles from "./text-card.module.css"

interface TextCardProps {
  highlightedHtml: string
  theme: TextTheme
  title?: string
  languageLabel?: string
}

export const TextCard = forwardRef<HTMLDivElement, TextCardProps>(function TextCard(
  { highlightedHtml, theme, title = "snippet", languageLabel },
  ref,
) {
  return (
    <div ref={ref} className={styles.card}>
      <div
        className="overflow-hidden"
        style={{ background: theme.background, color: theme.text }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-2 text-xs"
          style={{ background: theme.header, color: theme.text }}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium opacity-70">
            <span className="uppercase tracking-wide">{title}</span>
            {languageLabel ? <span className="opacity-60">{languageLabel}</span> : null}
          </div>
        </div>
        <div className="px-5 py-4 font-mono text-sm leading-6">
          <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        </div>
      </div>
    </div>
  )
})
