# NoWaste — standalone business website

This folder is a **static website** separate from the NoWaste Next.js app. Use it for:

- **Stripe** (or other) **business verification** — public URL with business description, contact, and privacy policy
- A simple **marketing presence** before or alongside the product app

## What’s included

- `index.html` — Home: value proposition, how it works, CTAs  
- `contact.html` — Business / support placeholders (**replace** with your legal details)  
- `privacy.html` — Privacy policy template (**have a lawyer review** before relying on it)  
- `css/style.css` — Styling (no build step)

## Deploy (pick one)

### Netlify Drop

1. Zip this `business-website` folder (contents: `index.html`, `css/`, etc.).
2. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop) and drag the zip.
3. Attach your **custom domain** in Netlify DNS settings.

### Vercel (static)

1. Install [Vercel CLI](https://vercel.com/docs/cli).
2. From this directory: `vercel --prod` and follow prompts, or connect the repo subfolder in the Vercel dashboard as a static project with root = `business-website`.

### GitHub Pages

1. Push this folder to a repo (or use a `docs/` branch).
2. In repo **Settings → Pages**, set source to the folder containing `index.html`.
3. Or use the [`peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages) action to publish only `business-website/`.

### Any static host

Upload the files so that `index.html` is served at the site root. Paths assume `css/style.css` relative to each HTML file.

## Local preview

From this directory:

```bash
npx --yes serve .
```

Open the URL shown (usually `http://localhost:3000`).

## Before Stripe / production

1. Replace **`support@nowaste.com`** and **`partners@nowaste.com`** on `contact.html` with the addresses on your domain (and add a full street address if required for verification).  
2. Point your **public domain** (e.g. `www.yourcompany.com`) to this site.  
3. Have counsel **review** `privacy.html`.  
4. Submit your **live business website URL** in the Stripe Dashboard as required.

No changes to the main NoWaste app are required for this site to work.
