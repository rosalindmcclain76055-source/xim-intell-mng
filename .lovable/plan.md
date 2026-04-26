## Goal
Publish the app to GitHub Pages at `https://<your-user>.github.io/xim-intell-mng/` while keeping the Lovable preview (which serves from `/`) fully working.

## Strategy
The key trick is **conditional base path**: only apply `/xim-intell-mng/` during the GitHub Actions build, not in dev or Lovable's preview. We do this by reading an env var that only GitHub sets.

---

## Changes

### 1. `vite.config.ts` — conditional base path
Read `VITE_BASE_PATH` env var. When unset (Lovable, local dev), base stays `/`. The GitHub workflow will set it to `/xim-intell-mng/`.

```ts
base: process.env.VITE_BASE_PATH || "/",
```

### 2. `src/App.tsx` — matching React Router basename
Add `basename={import.meta.env.BASE_URL}` to `<BrowserRouter>` so routes resolve correctly under the subpath. `BASE_URL` is automatically populated by Vite from the `base` config — no manual sync needed.

### 3. `public/404.html` — fix SPA fallback for GitHub Pages
GitHub Pages doesn't have built-in SPA fallback (unlike Lovable). The current `404.html` uses a hard refresh that breaks state. Replace it with the standard **rafgraph/spa-github-pages** redirect script that preserves the path via `sessionStorage`.

### 4. `index.html` — companion redirect-restore script
Add a small inline script in `<head>` that reads the redirect from `sessionStorage` and restores the URL via `history.replaceState`. Pairs with the new `404.html`.

### 5. `.github/workflows/deploy.yml` — inject secrets + base path
Update the workflow to:
- Pass `VITE_BASE_PATH=/xim-intell-mng/` to the build step
- Inject the three Supabase env vars from GitHub repo secrets
- Switch from `npm install` to `npm ci` for reproducible builds (or keep `npm install` if no lockfile)

```yaml
- name: Build project
  env:
    VITE_BASE_PATH: /xim-intell-mng/
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
    VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
  run: npm run build
```

### 6. `.nojekyll` (new file in `public/`)
Empty file. Prevents GitHub Pages' Jekyll processor from ignoring files starting with `_` (Vite emits `_assets` style chunks in some cases). Standard practice.

---

## Manual steps you'll need to do (outside Lovable)

I'll list these clearly in chat after the code changes ship. Summary:

1. **Connect GitHub** via Lovable's Connectors panel and create a repo named **exactly `xim-intell-mng`**. The base path is hardcoded to that name — if the repo name differs, routing will 404.
2. **Add 3 GitHub repo secrets** in `Settings → Secrets and variables → Actions`:
   - `VITE_SUPABASE_URL` → `https://wqckcxbavbfbbojsthvn.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → the anon key (safe to expose; it's designed for browsers)
   - `VITE_SUPABASE_PROJECT_ID` → `wqckcxbavbfbbojsthvn`
3. **Enable GitHub Pages** in repo `Settings → Pages → Source: GitHub Actions`.
4. **Add the Pages URL to Supabase Auth allowed redirect URLs** so login works:
   - Site URL: `https://<your-user>.github.io/xim-intell-mng/`
   - Redirect URL: `https://<your-user>.github.io/xim-intell-mng/**`
   - I can do this from Lovable once you tell me your GitHub username.

---

## What stays working
- ✅ Lovable preview at `/` — `VITE_BASE_PATH` is unset there, so base stays `/`
- ✅ Local `npm run dev` — same as preview
- ✅ Edge functions (`classify-tweet`, `generate-draft`) — they live on Lovable Cloud, called from any origin
- ✅ Supabase auth & RLS — once redirect URLs are added

## What won't work / out of scope
- ❌ Server-side anything (there's none in this app, so fine)
- ❌ Changing the repo name later without updating `vite.config.ts` and `404.html` base path
- ❌ Edge function secrets (`LOVABLE_API_KEY` etc.) — these stay server-side on Lovable Cloud, not exposed to the client; nothing to do

---

## Risk notes
- **The anon key will be visible in your public repo's built JS.** This is by design for Supabase — security comes from RLS, not key secrecy. Your existing RLS policies already enforce this correctly.
- **First deploy will fail if Pages isn't enabled** in the repo settings — this is a one-time manual step, not a code issue.