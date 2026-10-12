# Solar Energy — rooftop solar website (frontend)

React 19 + Vite, animated with GSAP (ScrollTrigger, SplitText) and Lenis smooth scrolling.
The hero and footer suns are a hand-written WebGL shader; the house in "How it works" and
the roof-plan drawings are generated SVG — there are no image assets to manage.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

## Make it the client's

Everything business-specific is in **`src/config.js`**:

| What | Where |
| --- | --- |
| Brand name, legal name | `BRAND` |
| Phone, WhatsApp number, email, opening hours | `CONTACT` |
| Social links | `SOCIAL` |
| Location for the live sunrise/sunset readout | `LOCATION` |
| Calculator tariffs, cost per kW, subsidy rules | `CALC` |

Also update the `<title>`, meta description and JSON-LD block in `index.html`, and the
favicon in `public/favicon.svg`.

Copy that makes promises on the client's behalf — warranties, response times, "fixed quote",
timelines — lives in `src/components/FinePrint.jsx`, `Process.jsx`, `Faq.jsx` and
`Services.jsx`. Confirm it with the client before going live.

## Enquiry form

The contact form validates the input and opens WhatsApp with the enquiry pre-filled.
When the backend (`../sw_be`) is ready, set `LEADS_API_URL` in `src/config.js`; the form will
also `POST` the lead as JSON to `${LEADS_API_URL}/api/leads`:

```json
{ "name": "…", "phone": "9876543210", "area": "…", "property": "Home", "bill": "3500", "message": "…", "source": "website" }
```

## Structure

```
src/
  config.js            business data + calculator assumptions
  App.jsx              page assembly, smooth scroll, theme switching, reveal animations
  lib/                 GSAP setup, Lenis, sun maths, savings estimate, formatting, WebGL sun
  components/          one file (+ css) per section
    how/isoScene.js    isometric house geometry
    sizes/plan.js      roof-plan drawing generator
```

## Deploy

`npm run build` and upload `dist/` to any static host (Vercel, Netlify, Cloudflare Pages,
cPanel). Asset paths are relative, so it also works from a sub-folder.
