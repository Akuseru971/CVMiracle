# WMF Japan — Mobile Experience

A mobile-first redesign of the WMF Japan online store, rebuilt with the visual
direction, navigation logic and premium brand experience of WMF Germany
(`wmf.com/de/en`) while keeping the Japanese content, product structure and
commercial logic of WMF Japan (`wmf.co.jp`, `shop.wmf.co.jp`).

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- Real WMF imagery downloaded into `public/images`
- No heavy slider/animation libraries — native scroll-snap carousels + CSS transitions + IntersectionObserver

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and view in a mobile viewport (designed for iPhone-size
screens, max content width 480px).

## Deployment (Vercel)

**Public production URL:** https://cvmiracle.vercel.app

This repo is linked to several Vercel projects. Only some URLs are publicly
accessible:

| Project | Production URL | Status |
| --- | --- | --- |
| `cvmiracle` | https://cvmiracle.vercel.app | Public, works |
| `cv-miracle-r9xa` | https://cv-miracle-r9xa.vercel.app | Public, works |
| `cv-miracle` | https://cv-miracle.vercel.app | **404 — no production deployment** |

URLs like `https://cv-miracle-5npvm3v56-akuserus-projects.vercel.app` belong to
the `cv-miracle` project, which has **Deployment Protection** enabled (Vercel
login required) and no working production alias. That is a Vercel project setting,
not an application bug.

To fix the `cv-miracle` project in the Vercel dashboard:

1. Open project **cv-miracle** → **Settings** → **Deployment Protection**
2. Set protection to **Only Production Deployments** (or disable for previews)
3. Under **Domains**, confirm `cv-miracle.vercel.app` is assigned and the latest
   `main` deployment is promoted to Production
4. Redeploy `main` if needed

Alternatively, use https://cvmiracle.vercel.app and remove the duplicate
`cv-miracle` project to avoid confusion.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run start` — run the production build

## Structure

```txt
src/
  app/
    layout.tsx        # fonts, metadata, mobile viewport
    page.tsx          # homepage composition
    globals.css       # design system (palette, animations)
  components/
    AppShell.tsx          # provider + header/overlays + toast
    Header.tsx            # sticky header (search, account, cart, categories)
    HeroSlider.tsx        # cinematic hero (swipe + arrows + dots + autoplay)
    TasteMattersSection.tsx  # WMF Germany "TASTE MATTERS" category slider
    CategoryBrowseSection.tsx  # two-tab category/series browse grid (homepage)
    CategoryLayer.tsx     # layered slide-in category panel
    FeatureSection.tsx    # editorial brand / series feature slider
    ProductCarousel.tsx   # reusable best sellers / new arrivals carousel
    FusiontecStory.tsx    # dark editorial brand block
    ServiceCards.tsx      # official-shop trust section
    RecipeSection.tsx     # recipe / inspiration
    NewsList.tsx          # news
    MobileFooter.tsx      # accordion footer
    SearchLayer.tsx       # full-screen mobile search
    ui-context.tsx        # search / category / cart state
    Reveal.tsx            # fade-in on scroll
    icons.tsx             # inline SVG icons
  data/
    content.ts        # all categories, products, news, copy (real WMF JP/DE content)
  hooks/
    useCarousel.ts    # native swipe carousel (arrows, dots, autoplay)
```

## Content & images

- Category names follow the WMF Germany **TASTE MATTERS** section
  (CUTLERY / POTS / PANS / COFFEE MACHINES / KITCHEN KNIVES / KITCHEN APPLIANCES /
  KITCHEN HELPERS) paired with WMF Japan Japanese labels.
- Best-seller product names are the real WMF Japan ranking (Fusiontec Mineral line).
- Images are real WMF assets (category art + lifestyle from WMF Germany, product
  shots from the WMF Fusiontec catalog, lifestyle from WMF Japan's CDN).
- **TODO(prices):** JPY prices in `src/data/content.ts` are representative
  Fusiontec Mineral price points and should be confirmed against the live store —
  `shop.wmf.co.jp` is JS-rendered, so prices could not be crawled directly.
