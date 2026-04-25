# Freedom Shield Legal — Demo Site

A redesigned, premium law-firm-grade marketing site for **Freedom Shield Legal** (Matthew R.J. Knych). Built as a static HTML/CSS/JS bundle, drop-in ready for `palmweb.net/samples/FSL/` and easy to relocate to `freedomshieldlegal.com` in production.

## Files

```
index.html           — Home (hero, bio, approach, tiers preview, sets-apart, recognition, CTA, contact)
services.html        — General Counsel Services (full tier detail, scope, trust)
styles.css           — Single stylesheet, ~990 lines, fully responsive
script.js            — Sticky nav, mobile menu, scroll reveals, contact form handler
assets/              — All images (logo, headshot, portrait, handshake)
```

## Contact form delivery

The contact form is wired to deliver inquiries to **matt@freedomshieldlegal.com**.

**Demo behavior (default):**
- On submit, the page validates fields client-side, then opens the visitor's email client with a fully prefilled message addressed to Matt — name, email, phone, company, tier interest, and message body. This requires no backend, no API key, and works on every device.

**Production upgrade (no-touch email forwarding):**
1. Visit https://web3forms.com and request an Access Key using `matt@freedomshieldlegal.com`.
2. Verify the email and copy the access key from the verification message.
3. Open `script.js` and replace the `WEB3FORMS_ACCESS_KEY` constant near the top:
   ```js
   var WEB3FORMS_ACCESS_KEY = 'YOUR-ACCESS-KEY-HERE';
   ```
4. That's it — submissions now POST directly to Web3Forms, which delivers to Matt's inbox. The mailto fallback automatically activates if the API ever fails.

Alternative providers (any drop-in works with a small endpoint swap):
- **Formspree** (`https://formspree.io/f/<id>`) — paid plans for high volume
- **SendGrid / Mailgun / Postmark** — if you want a custom backend
- **Custom Vercel function** — quick to add given your existing Vercel setup

## Deploying to palmweb.net/samples/FSL/

This is a flat static site. To deploy:
1. Replace the contents of your repo's `samples/FSL/` directory with these files.
2. Push to GitHub. Vercel (or whichever host serves palmweb.net) will pick it up.

No build step required.

## Brand notes

- **Palette** — Navy `#0A1733`, Crimson `#B91C2C`, Gold accent `#C8A24A`, Cream backgrounds
- **Type** — Playfair Display (serif headings) + Inter (sans body)
- **Imagery** — Uses all 8 of Matt's existing photos. Logo is rendered as-is.
- **Tone** — Premium, authoritative, founder-friendly. Heavy on whitespace, clean tier cards, and proactive credibility cues (real GC experience, weekly engagement, subscription model).

## Browser support

Tested layouts at: 1440 desktop, 1024 tablet, 390 mobile. Uses modern CSS (`backdrop-filter`, `aspect-ratio`, custom properties, `IntersectionObserver`) — supported in all evergreen browsers.
