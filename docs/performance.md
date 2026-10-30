# Performance and UX checks

Run after a build (`npm run build`):

```bash
npm run check:perf
```

This checks the budget on `dist/` (HTML under 120 KB per page, JS under 20 KB, CSS inlined, no
third-party requests, at most 3 preloads, every `<img>` has width, height and alt) in a few
seconds. To add Lighthouse (mobile and desktop on Home, Blog and the newest post, all four
categories must reach 95):

```bash
CHROME_PATH=/path/to/chromium npm run check:perf -- --lighthouse
```

## Decisions

- Covers are generated images (lossless WebP with a palette PNG fallback, 600 and 1200 px,
  explicit width and height, lazy except the first one). AVIF was measured at 2 to 6 times the
  size of lossless WebP for this five-tone dithered art, so it is not served.
- Social cards (`/og/*.png`, `/og.png`) stay 1200x630 palette PNG because social crawlers do
  not reliably read WebP or AVIF.
- Fonts are self-hosted through Astro (`font-display: swap`, latin subset, metric-matched
  fallbacks). Only Inter 400 and 700 are preloaded; the serif is preloaded on posts only.
- Stylesheets are inlined (`build.inlineStylesheets: 'always'`), so there is no render-blocking
  request. The hero banner starts after load and pauses off screen.
- GitHub Pages sets its own cache headers; hashed `/_astro/` file names keep updates safe.
