import { toPng as htmlToPng } from "html-to-image"

const imageFilter = (node: HTMLElement) => node.tagName !== "TEXTAREA" && !node.dataset?.ignoreInExport

const defaultOptions = {
  filter: imageFilter,
  pixelRatio: 4,
  skipAutoScale: true,
}

type PngOptions = Parameters<typeof htmlToPng>[1]

export async function nodeToPng(node: HTMLElement, options?: PngOptions) {
  await htmlToPng(node, { ...defaultOptions, ...options })
  return htmlToPng(node, { ...defaultOptions, ...options })
}
