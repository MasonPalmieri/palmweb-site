# CCRS — Recovery &amp; Performance

Production website for **CCRS, LLC** — a Dallas-based DME distributor, authorized partner of NICE Recovery Systems.

> Built and maintained by [PalmWeb](https://palmweb.net) · mason@palmweb.net

## Stack

Pure static site — HTML / CSS / vanilla JS. No build step, no framework. Deploys to anything that serves files (Vercel, Netlify, GitHub Pages, S3, etc.).

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero, what we do, NICE1 feature, patient/provider audience cards, testimonial, CTA |
| `products.html` | Full product catalog: NICE1 / NICE2 / NICE3, accessory wraps, ambIT, PlasmaFlow, DJO bone growth stimulators |
| `videos.html` | NICE1 how-to library — 9 embedded Vimeo videos, click-to-play |
| `contact.html` | Patient / Provider / Other contact form (mailto submission until backend wired) |
| `survey.html` | Private patient feedback survey — 5-point scales, outcome questions, optional public-testimonial consent |

## Local preview

```bash
# any static server works
npx serve .
# or
python3 -m http.server 8080
```

## Deploying to Vercel

The repo includes `vercel.json`. From the project root:

```bash
vercel          # preview deploy
vercel --prod   # production
```

Or import the repo at [vercel.com/new](https://vercel.com/new) — no settings needed, framework preset is "Other".

## Pre-launch checklist

- [ ] Finalize **NICE2** and **NICE3** spec copy (currently flagged as placeholder on `products.html`)
- [ ] Wire contact + survey forms to a real backend. Recommended:
  - **Resend + Vercel serverless function** (cleanest for your stack — see `/api/notes` below)
  - **Formspree** / **Web3Forms** / **Basin** (zero-backend, fastest)
- [ ] Remove the **Mockup** banner before go-live:
  - Delete `.demo-banner` block from `styles.css`
  - Remove the `<div class="demo-banner">…</div>` row from each page's `<body>`
  - Remove `.wip-tag` rendering in each footer (or keep — it's a small "Demo build · v0.1" pill)
- [ ] Point `recoverwithccrs.com` DNS at the new host
- [ ] Set up an SPF/DKIM-aligned sender (`contact@recoverwithccrs.com`) for the form backend

## Form backend — recommended path (Resend + Vercel)

Drop two files into the project, push, and the forms will work end-to-end:

```
api/
  contact.js     // POST { role, name, email, phone, organization, message }
  survey.js      // POST { p_name, p_email, ratings, comments, consent, ... }
```

Each handler validates the payload, calls Resend, and returns 200. Update `script.js` to `fetch('/api/contact', ...)` and `fetch('/api/survey', ...)` instead of using `mailto:`.

Happy to wire this whenever you're ready.

## Asset map

```
assets/
  logo.svg         # CCRS teal cross + leaf mark
  nice1.jpg        # NICE1 console + carry bag + battery
  nice2.jpg        # NICE2 in-use shot
  nice3.jpg        # NICE3 with touchscreen, knee application
  nice-wraps.jpg   # NICE accessory wrap layout
  ambit.jpg        # ambIT electronic pain pump
  plasmaflow.jpg   # PlasmaFlow PF0001 DVT prevention system
  djo-bgs.jpg      # DJO bone growth stimulators
```

---

© 2026 CCRS, LLC — All rights reserved.
