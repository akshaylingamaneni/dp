import {
  Inter,
  JetBrains_Mono,
  Roboto,
  Raleway,
  DM_Sans,
  Public_Sans,
  Outfit,
  Noto_Sans,
  Nunito_Sans,
  Figtree,
  Geist,
} from "next/font/google"

// Variable fonts (no weight needed usually, or subsets)
const fontInter = Inter({ subsets: ["latin"], display: "swap" })
const fontJetBrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap" })
const fontGeistSans = Geist({ subsets: ["latin"], display: "swap" })
const fontFigtree = Figtree({ subsets: ["latin"], display: "swap" })
const fontNunitoSans = Nunito_Sans({ subsets: ["latin"], display: "swap" })
const fontNotoSans = Noto_Sans({ subsets: ["latin"], display: "swap" })
const fontPublicSans = Public_Sans({ subsets: ["latin"], display: "swap" })
const fontOutfit = Outfit({ subsets: ["latin"], display: "swap" })
const fontDmSans = DM_Sans({ subsets: ["latin"], display: "swap" })
const fontRaleway = Raleway({ subsets: ["latin"], display: "swap" })

// Static fonts (need weights)
const fontRoboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
})

export type FontConfig = {
  id: string
  name: string
  className: string
  style: any
}

export const FONTS: FontConfig[] = [
  {
    id: "font-geist-sans",
    name: "Geist Sans",
    className: fontGeistSans.className,
    style: fontGeistSans.style,
  },
  {
    id: "font-inter",
    name: "Inter",
    className: fontInter.className,
    style: fontInter.style,
  },
  {
    id: "font-noto-sans",
    name: "Noto Sans",
    className: fontNotoSans.className,
    style: fontNotoSans.style,
  },
  {
    id: "font-nunito-sans",
    name: "Nunito Sans",
    className: fontNunitoSans.className,
    style: fontNunitoSans.style,
  },
  {
    id: "font-figtree",
    name: "Figtree",
    className: fontFigtree.className,
    style: fontFigtree.style,
  },
  {
    id: "font-roboto",
    name: "Roboto",
    className: fontRoboto.className,
    style: fontRoboto.style,
  },
  {
    id: "font-raleway",
    name: "Raleway",
    className: fontRaleway.className,
    style: fontRaleway.style,
  },
  {
    id: "font-dm-sans",
    name: "DM Sans",
    className: fontDmSans.className,
    style: fontDmSans.style,
  },
  {
    id: "font-public-sans",
    name: "Public Sans",
    className: fontPublicSans.className,
    style: fontPublicSans.style,
  },
  {
    id: "font-outfit",
    name: "Outfit",
    className: fontOutfit.className,
    style: fontOutfit.style,
  },
  {
    id: "font-jetbrains-mono",
    name: "JetBrains Mono",
    className: fontJetBrainsMono.className,
    style: fontJetBrainsMono.style,
  },
]

export const getFontById = (id: string) => FONTS.find((f) => f.id === id) || FONTS[0]
