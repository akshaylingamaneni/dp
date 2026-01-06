---
name: SEO Optimization Plan
overview: Comprehensive SEO enhancement for Screenshot Composer to improve search visibility, social sharing, and follow all modern SEO best practices including metadata, structured data, technical SEO, and performance optimizations.
todos:
  - id: metadata-opengraph
    content: Add comprehensive metadata with Open Graph and Twitter Cards
    status: completed
  - id: structured-data
    content: Implement JSON-LD structured data for WebApplication schema
    status: completed
  - id: robots-sitemap
    content: Create robots.txt and dynamic sitemap.ts
    status: completed
  - id: llms-txt
    content: Create llms.txt for LLM discoverability and context
    status: completed
  - id: og-image
    content: Design and add optimized OG image (1200x630px)
    status: completed
  - id: image-optimization
    content: Optimize images in showcase.ts and implement Next.js Image
    status: completed
  - id: semantic-html
    content: Add semantic HTML and accessibility improvements
    status: completed
  - id: content-seo
    content: Add SEO-friendly content sections (FAQ, features, how-to)
    status: completed
    dependencies:
      - semantic-html
  - id: nextconfig-optimization
    content: Update next.config.ts with image and performance settings
    status: completed
  - id: error-pages
    content: Create custom 404 and error pages
    status: completed
  - id: verification
    content: Test with Lighthouse, Rich Results, and submit to Search Console
    status: completed
    dependencies:
      - metadata-opengraph
      - structured-data
      - robots-sitemap
      - llms-txt
---

# SEO Optimization Plan

## Current State Analysis

The application has basic metadata but lacks comprehensive SEO implementation. This plan will transform it into a fully SEO-optimized web application following all modern best practices.

## 1. Enhanced Metadata & Open Graph

**Root Layout** [`app/layout.tsx`](app/layout.tsx)Enhance the existing metadata with:

- Complete Open Graph tags (title, description, type, url, images)
- Twitter Card tags for better social sharing
- Keywords and author metadata
- Viewport and theme-color meta tags
- Canonical URLs
- robots directives
- OpenGraph images (create preview image at 1200x630px)
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://yoursite.com'),
  title: {
    default: 'Screenshot Composer - Beautiful Screenshot Backgrounds',
    template: '%s | Screenshot Composer'
  },
  description: '...',
  keywords: ['screenshot', 'beautify', 'gradient backgrounds', 'open source'],
  openGraph: {...},
  twitter: {...},
  // etc.
}
```


## 2. Structured Data (JSON-LD)

**Create** `app/structured-data.tsx`Implement schema.org structured data for:

- WebApplication schema
- SoftwareApplication schema
- Organization schema (if applicable)
- BreadcrumbList for navigation

This helps search engines understand your tool's purpose and features.

## 3. Technical SEO Files

**Create** `public/robots.txt`

- Allow all crawlers
- Reference sitemap location
- Set crawl-delay if needed

**Create** `app/sitemap.ts`

- Dynamic sitemap generation
- Include main pages with priorities and change frequencies
- Set proper lastModified dates

**Create** `public/llms.txt`

- Provide structured context for LLMs about the application
- Include project description, features, tech stack, and usage
- Help LLMs like Claude, GPT, and others understand and recommend your tool
- Follow the llms.txt standard format (inspired by robots.txt)
- Include key information: purpose, features, URLs, and examples

Example structure:

```
# Screenshot Composer

> Beautiful screenshot backgrounds and styling tool

## Description
Screenshot Composer is a free, open-source web tool for creating beautiful screenshots...

## Features
- Gradient backgrounds and patterns
- Customizable padding, shadows, and corners
- Batch processing
- Export to multiple formats

## Technology
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## URL
https://yoursite.com
```

**Create** `app/manifest.json` (if not exists)

- PWA manifest for mobile installability
- Improves mobile SEO signals

## 4. Performance Optimizations

### Image Optimization

- Replace Unsplash URLs in [`data/showcase.ts`](data/showcase.ts) with optimized local images
- Use Next.js Image component for automatic optimization
- Add proper width, height, and alt attributes
- Implement lazy loading with priority for above-fold images
- Create and optimize OG image (1200x630px)

### Font Optimization

Current implementation in [`app/layout.tsx`](app/layout.tsx) already uses `next/font` which is excellent. Ensure:

- `font-display: swap` (default with next/font)
- Preload critical fonts
- Remove unused font weights

### Code Splitting

- Ensure dynamic imports for heavy components
- Lazy load carousel and controls that aren't immediately visible

## 5. Semantic HTML & Accessibility

**Page Structure** [`app/(app)/page.tsx`](app/\\\\\\(app)/page.tsx)Enhance with:

- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for interactive elements
- Semantic HTML5 elements (main, section, article, aside)
- Alt text for all images
- Focus management for keyboard navigation

These accessibility improvements also boost SEO rankings.

## 6. Content Optimization

### Landing Page Content

Add SEO-friendly content sections:

- Clear H1 with primary keywords
- Feature descriptions with natural keyword placement
- FAQ section (great for featured snippets)
- How-to section with step-by-step instructions
- Use cases and benefits

### Meta Descriptions

Craft compelling, keyword-rich descriptions (150-160 chars) that encourage clicks.

## 7. URL Structure & Navigation

Ensure clean URLs:

- Use descriptive paths if adding more pages (e.g., `/about`, `/features`)
- Implement breadcrumbs for multi-level navigation
- Add canonical URLs to prevent duplicate content issues

## 8. Social Media Integration

**Create** `public/og-image.png`

- Design an attractive 1200x630px OG image
- Include app name, tagline, and visual preview
- Optimize file size (<200KB)

**Add social meta tags:**

- og:image, og:image:width, og:image:height
- twitter:card, twitter:image
- og:type = "website"

## 9. Analytics & Tracking Setup

Already using `@vercel/analytics`. Additionally add:

- Google Search Console verification meta tag
- Bing Webmaster Tools verification
- Consider adding umami or plausible for privacy-focused analytics

## 10. Next.js Config Optimizations

**Update** [`next.config.ts`](next.config.ts)

```typescript
const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ]
  },
  compress: true,
  poweredByHeader: false,
  // Add trailing slash handling
  trailingSlash: false,
}
```

## 11. Mobile Optimization

Verify:

- Mobile-friendly design (already using Tailwind responsive classes ✓)
- Touch targets ≥48px
- No horizontal scroll
- Fast mobile load times (<3s)
- Mobile viewport meta tag

## 12. Security Headers

Add security headers via `next.config.ts` or Vercel config:

- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

These improve trustworthiness and potentially SEO.

## 13. Additional Best Practices

**Create** `app/not-found.tsx`

- Custom 404 page with helpful navigation
- Prevents negative SEO impact from broken links

**Error Handling** `app/error.tsx`

- Graceful error pages
- Maintain positive UX

**Loading States** `app/loading.tsx`

- Implement skeleton screens
- Improves perceived performance

## Implementation Priority

### Phase 1 (High Impact)

1. Enhanced metadata & Open Graph tags
2. Structured data (JSON-LD)
3. robots.txt, sitemap.xml & llms.txt
4. OG image creation

### Phase 2 (Medium Impact)

5. Image optimizations
6. Semantic HTML improvements
7. Content additions (FAQ, how-to)
8. Accessibility enhancements

### Phase 3 (Polish)

9. Security headers
10. Custom error pages
11. Performance fine-tuning
12. Schema validation

## Verification & Monitoring

After implementation:

- Test with Google Rich Results Test
- Validate structured data with Schema Markup Validator
- Check mobile-friendliness with Google Mobile-Friendly Test
- Audit with Lighthouse (aim for 90+ SEO score)
- Submit sitemap to Google Search Console
- Monitor Core Web Vitals in Search Console
- Track rankings and organic traffic

## Expected Outcomes

- 🎯 Lighthouse SEO score: 95-100
- 🚀 Improved search rankings for target keywords
- 📱 Better social media sharing previews
- 🔍 Rich results in search (structured data)
- 📈 Increased organic traffic
- ⚡ Faster page loads (better rankings)
- 🤖 Enhanced LLM discoverability and recommendations
- ♿ Improved accessibility (compliance + SEO)