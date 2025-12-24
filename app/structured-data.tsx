const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://screenshot-composer.vercel.app"

export function WebApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Screenshot Composer",
    description: "Create beautiful screenshots with gradient backgrounds, customizable padding, shadows, and corner styling. 100% free and open source.",
    url: siteUrl,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Beautiful gradient backgrounds",
      "Customizable padding and margins",
      "Adjustable corner radius",
      "Shadow controls",
      "Batch image processing",
      "Multiple export formats",
      "Copy to clipboard",
      "ZIP download for batches",
    ],
    screenshot: `${siteUrl}/og-image.png`,
    softwareVersion: "1.0.0",
    author: {
      "@type": "Organization",
      name: "Screenshot Composer",
      url: siteUrl,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Screenshot Composer",
    description: "Free online tool to beautify screenshots with gradient backgrounds and styling options.",
    url: siteUrl,
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      ratingCount: "1",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is Screenshot Composer free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Screenshot Composer is 100% free and open source. There are no hidden fees, subscriptions, or watermarks.",
        },
      },
      {
        "@type": "Question",
        name: "What image formats can I export?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can export your screenshots as PNG files. For multiple images, you can download them individually or as a ZIP archive.",
        },
      },
      {
        "@type": "Question",
        name: "Can I process multiple screenshots at once?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Screenshot Composer supports batch processing. Upload multiple images, apply consistent styling, and export them all at once.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to create an account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No account required. Screenshot Composer works entirely in your browser with no sign-up needed.",
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

