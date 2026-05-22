# Willy's — Maintenance Mode

Static HTML maintenance page for [Willy's](https://github.com/TBM-TECH). Displays the Willy's logo, a "We'll be right back" message, and a 10-minute live countdown that auto-reloads the page when it reaches zero.

## Preview

Just open `index.html` in any browser — no build step required.

```bash
open index.html
# or serve locally
python3 -m http.server 8080
```

## Files

- `index.html` — page markup
- `styles.css` — brand-aligned styling (red `#e31f26`, dark `#14151a`)
- `countdown.js` — 10-minute timer + auto-reload
- `logo.svg` — Willy's "W" mark

## Deploy

Drop these files behind your CDN / reverse proxy maintenance route. Works on GitHub Pages, Netlify, Vercel, S3, Nginx `error_page 503`, or any static host.

## Customize

- **Duration** — change `TOTAL_SECONDS` in `countdown.js`
- **Brand colors** — edit the `:root` variables in `styles.css`
- **Copy** — edit the headline and subtitle in `index.html`
