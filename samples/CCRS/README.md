# CCRS — Recovery & Performance (Demo Redesign)

Static demo redesign for **CCRS, LLC** (recoverwithccrs.com), a Dallas, TX–based DME distributor and authorized partner of the NICE1 cold + compression therapy system.

> Live client site: https://recoverwithccrs.com

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero, what we do, NICE1 teaser, prospective-patient + provider audience cards, testimonial, CTA |
| `products.html` | Full product catalog: NICE1, accessory wraps, ambIT, PlasmaFlow, DJO bone growth stimulators |
| `videos.html` | NICE1 how-to video library (links currently point to existing CCRS video page; ready for YouTube/Vimeo embeds) |
| `contact.html` | Patient / Provider / Other contact form (mailto submission for demo) |
| `survey.html` | Private patient feedback survey — 5-point scales, outcome questions, optional public-testimonial consent |

## Design language

- **Palette:** clinical white + teal (`#0fa8a3` / `#0a3f3e`) drawn from the existing CCRS logo, deep ink-blue text.
- **Type:** Space Grotesk for display, Inter for body — modern, technical, medical.
- **Motion:** subtle reveal-on-scroll, soft hover lifts, pulsing "live system" indicator on hero.
- **Imagery:** custom inline SVGs for product visuals so the demo runs with zero external image deps.

## Form handling

Both the contact form and the patient survey currently submit via `mailto:` (opens the user's email client pre-filled, addressed to `contact@recoverwithccrs.com`). This keeps the demo fully static.

When you're ready to go live, swap the handlers in `script.js` to POST to:
- **Formspree** / **Basin** / **Web3Forms** — fastest, no backend
- **Resend** + a serverless function on **Vercel** — most flexible, your stack
- A custom API on your existing infra

The survey is explicitly **private by default** — public-testimonial use requires an opt-in checkbox.

## Local preview

```bash
# any static server works
npx serve .
# or
python3 -m http.server 8080
```

## Notes

- All product specs (NICE1 dimensions, temp range, wrap list, ambIT/PlasmaFlow/DJO copy) were lifted directly from the live recoverwithccrs.com content.
- Replace the inline SVG product illustrations with real product photography when available.
- Video thumbnails are stylized placeholders — drop in YouTube/Vimeo `iframe`s or thumbnail images to play inline.
