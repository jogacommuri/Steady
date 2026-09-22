# Running Steady as a web app

Unlike the iOS build, this doesn't need a Mac, an Apple ID, or a re-signing
step — it's a static site you visit at a URL from any browser, and it stays
up whether or not your computer is on (the site is hosted, not served from
your machine).

## What makes this work

`app.json` already has `"web": { "bundler": "metro", "output": "static" }`,
so `expo export --platform web` produces a set of plain HTML/JS/CSS files —
no server required, just static hosting.

The one real snag was `expo-sqlite`'s web backend: it loads a `.wasm` binary
at runtime, and Metro doesn't bundle `.wasm` as an asset by default. Fixed by
`metro.config.js`, which registers `wasm` in `resolver.assetExts`. Verified
with a clean `npm run build:web` — all 16 routes exported, the wasm file and
its worker script both land in the output.

**Correction from earlier:** I'd guessed this would also need special
`Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` response
headers (needed when a page uses `SharedArrayBuffer`). Checked the actual
installed `expo-sqlite` web code before setting this up — it uses the OPFS
*Access Handles* API instead, which only requires running inside a Worker
(which it already does), not cross-origin isolation. So no special headers
are needed; any static host works, including plain GitHub Pages.

## Build it

```bash
npm run build:web
```

Outputs to `dist/` (gitignored — a build artifact, not something to commit).

## Deploy it

### Option A: Vercel (recommended — free, simplest)

A `vercel.json` is already in the repo (`buildCommand`, `outputDirectory:
"dist"`, clean URLs so `/today` works without `.html`).

1. [vercel.com](https://vercel.com) → sign up (GitHub login is easiest) →
   **Add New… → Project** → import this repo.
2. Vercel reads `vercel.json` automatically — no settings to fill in. Deploy.
3. You get a URL like `steady-yourname.vercel.app` immediately. Every push
   to this branch (or whichever branch you connect) redeploys automatically.

Or from the CLI, without connecting GitHub:

```bash
npm install -g vercel     # or use npx vercel
vercel --prod
```

### Option B: Netlify / Cloudflare Pages

Same idea, either one: point the build command at `npm run build:web` and
the publish/output directory at `dist`. No headers config needed (see the
correction above).

## Things that behave differently on web

- **Local storage is per-browser, per-origin** — same phone-vs-tablet model
  as before, but now "device" means "this browser on this domain." Switching
  browsers (or a private/incognito window) starts with empty local data,
  same as a new phone would. Supabase sync (if configured) still ties it all
  to one account across browsers/devices, same as on mobile.
- **Camera/photo meal identification** (`app/add.tsx`'s Camera / Photo
  library buttons) uses `expo-image-picker`, which falls back to the
  browser's file picker / `getUserMedia` on web — works, but the OS-level
  "Camera" vs "Photo library" distinction mobile has doesn't really exist in
  a browser; expect one merged file-picker dialog instead of two buttons
  behaving differently.
- **Date picker** (`@react-native-community/datetimepicker`, used on the Log
  entry screen) — worth clicking through once after deploying; some
  RN-native pickers render as a plain HTML `<input type="date">` on web
  rather than the native-style calendar sheet. Cosmetic only.
