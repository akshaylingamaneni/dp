import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { WebApplicationSchema, FAQSchema } from "./structured-data"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
if (!siteUrl) {
  throw new Error("NEXT_PUBLIC_SITE_URL is not set")
}
const siteName = "Screenshot Composer"
const siteDescription = "Create beautiful screenshots with gradient backgrounds, customizable padding, shadows, and corner styling. 100% free and open source."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Beautiful Screenshot Backgrounds`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "screenshot",
    "screenshot editor",
    "beautiful screenshots",
    "gradient backgrounds",
    "screenshot styling",
    "image editor",
    "open source",
    "free tool",
    "screenshot beautifier",
    "social media images",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} - Beautiful Screenshot Backgrounds`,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${siteName} - Create beautiful screenshots with gradient backgrounds`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - Beautiful Screenshot Backgrounds`,
    description: siteDescription,
    images: [`${siteUrl}/og-image.png`],
    creator: "@screenshotcomposer",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <WebApplicationSchema />
        <FAQSchema />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
