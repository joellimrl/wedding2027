# wedding2027

Minimal static wedding site intended for GitHub Pages.

## What’s included

- `index.html`: The page
- `styles.css`: Earth-tone, minimalist styling
- `index_1.html` + `styles_1.css`: Editorial card concept with a faded full-page photo backdrop
- `index_2.html` + `styles_2.css`: Cinematic full-bleed hero with a filmstrip gallery
- `index_3.html` + `styles_3.css`: Botanical invitation concept with rounded gallery thumbnails
- `index_4.html` + `styles_4.css` + `index_4.js`: Enchanted hall concept with clickable doors, themed sections, and lightweight interactions
- `index_5.html` + `styles_5.css`: Animated orbital stage concept with more theatrical motion
- `index_6.html` + `styles_6.css` + `index_6.js`: Enchanted manor concept with a gate reveal, floating hallway objects, a secret map, portrait popup, and owl RSVP transition
- `index_7.html` + `styles_7.css` + `index_7.js`: Gate-only cinematic landing concept with a smooth click-to-open entrance into a castle interior
- `index_8.html` + `styles_8.css` + `index_8.js`: Opening-film concept that plays `opening.mp4` once, then transitions into `hall.png` and skips the video on refresh
- `countdown.js`: Shared countdown utility reused by multiple alternate concepts

`index.html` now acts as a landing page linking to all concept files.

## Alternate design concepts

Open any of these directly in your browser to compare concepts:

- `index_1.html`
- `index_2.html`
- `index_3.html`
- `index_4.html`
- `index_5.html`
- `index_6.html`
- `index_7.html`
- `index_8.html`

The concept pages include shared essentials such as:

- Light earth-tone styling
- A faded background image treatment
- Your names in the hero section
- A horizontally scrollable gallery using placeholder imagery
- A shared countdown to `19 June 2027, 7:00 PM` in Asia/Singapore (`2027-06-19T19:00:00+08:00`)

## Publish on GitHub Pages

1. Push this repo to GitHub.
2. In GitHub: **Settings → Pages**
3. Under **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Wait for the deployment link to appear.

If you prefer hosting from `/docs` instead, tell me and I’ll restructure it.

## Suggested next additions (still minimal)

- **Map link**: Add a clickable Google Maps / Apple Maps link for the venue.
- **Schedule**: A tiny timeline (e.g., Ceremony, Reception, Dinner) once confirmed.
- **RSVP** (pick one):
   - Link to a Google Form (fastest, no backend)
   - `mailto:` RSVP email link (simplest)
   - Embed a form via a third-party service (if you already have one)

## Other good sections to include later

- **Dress code**
- **Accommodation** (hotel suggestions + booking notes)
- **Getting there** (parking, transit, ride-hailing)
- **FAQ** (kids, plus-ones, dietary needs)
- **Contact** (a single email/WhatsApp contact)
- **Registry** (or a short “no gifts” note)
- **Photos** (link to an album + where guests can upload)
- **Calendar invite** (downloadable `.ics`)
- **Language** (English/Chinese toggle if you want)
