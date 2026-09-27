# Meridian scroll demo

Apple-style image-sequence product story that moves one chapter per gesture on
Windows mouse wheels, Mac trackpads, Firefox line-mode wheels, touch and keyboard.

- Canvas 2D image sequence, GSAP for chapter tweens, Lenis + ScrollTrigger below the hero
- Frames are rendered procedurally by `scripts/generate-frames.mjs` (no licensed assets)
- Separate landscape (1440×810, 181 frames) and portrait (640×1136, 121 frames) sequences
- Bounded decode window with `createImageBitmap`; canvas never exceeds frame resolution
- Add `?debug` to the URL for FPS, frame, decode cache and input-type overlay

## Develop

```bash
npm install
npm run dev        # generates frames on first run, then starts Vite
npm run build      # frames + type-check + production build into dist/
npm run preview
```

Frames are regenerated only when `src/sequence.json` or the generator changes.
Output goes to `public/frames/<hash>/`, so it can be cached as immutable.

## Deploy to Cloudflare Pages

**Option A: direct upload from this machine**

```bash
npx wrangler login
npm run deploy     # builds, then uploads dist/ to a Pages project named meridian-scroll-demo
```

**Option B: connect a Git repository** (Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git)

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |

Node 22 is pinned in `.node-version`. `public/_headers` sets long-lived caching for frames and hashed assets.

## Tuning

- Chapters and frame sets: `src/sequence.json` (`cache` = max decoded frames per set)
- Product poses per chapter: `KEYS` in `scripts/generate-frames.mjs`
- Gesture thresholds: constants at the top of `src/input.ts`
- To use real renders, drop `NNNN.webp` files into a folder, point `basePath` in
  `src/frames.generated.json` at it, and remove the `frames` step from the build script.
