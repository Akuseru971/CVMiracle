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
