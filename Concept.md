# Updated

This website will be for guests attending my wedding on 19 june 2027, 7pm at JW Marriott south beach Singapore.

## Entry Flow

When user enters the website, they should first see a portrait of the fat lady in a decorative painted CSS-art frame.
She says one line of dialogue: "Welcome sorcerer, are you ready?" and then asks for the password.
If the user has entered before (localStorage key `HP_HAS_VISITED` is set), skip the gate entirely and go straight to the common room.

**Password:** `wedding` (single fixed password for all guests, dev placeholder)

**Wrong password:** Fat lady says "Oh no! That's not the password, try again!"
After 3 failed attempts, lock the user out for 24 hours. Store the lockout expiry as a timestamp in localStorage key `HP_LOCKOUT_UNTIL`.

**Correct password:** The fat lady portrait swings open with a CSS 3D hinge animation (perspective rotation from one side), and the camera perspective animates into the room (CSS scale + translate, similar to the intro zoom in the existing index.html).

Set `HP_HAS_VISITED = true` in localStorage after a successful password entry.

## First-Time vs Returning Flow

**First time only** (localStorage key `HP_FIRST_RSVP_SEEN` not set):
After the door-swing animation fully completes, an owl flies in from the side of the screen, drops an envelope, the envelope unfolds/opens, and the RSVP form is displayed inside it.
Set `HP_FIRST_RSVP_SEEN = true` after this plays.

**Returning visitors:** Land directly on the common room.

## Common Room

The common room is a CSS-art illustrated scene (no external structural images). Style: slightly cartoonish but darker HP palette — dark reds, wood browns, candlelight amber, near-blacks. Scene elements: wooden floors, bookshelf walls, candle sconces on walls, fireplace.

Four clickable items are placed around the room:
- **Pensieve** — center table area
- **Clock** — left wall
- **Map** — right side table
- **Owl Stand** — corner near window

**Hover behaviour:** When the cursor enters a ~10px proximity zone around any item, the entire background blurs out, the item is highlighted, and its name fades in as a label. Cursor must leave the zone to remove the effect.

**Close behaviour:** When any item is clicked and its view is open, a cross (×) button is always visible to close and return to the common room.

**Spell easter eggs (keyboard listener always active on landing page):**
- `lumos` → candle sconces on the room walls light up with a CSS glow animation; the wand cursor emits a soft light halo.
- `nox` → extinguishes all candles and the cursor light.
- Implementation: rolling buffer of last ~10 keypresses checked against spell strings. More spells can be added later.

## Cursor

The user's cursor is replaced with a wand (custom CSS cursor) with a sparkle/particle trail effect (canvas overlay or DOM nodes).

## Music

Music icon always visible top-right, toggleable on/off.
Each view has its own looped BGM track (audio files to be supplied later — wire up the player with placeholder `src` attributes):
- Common room
- Pensieve
- Clock
- Map
- RSVP / Owl Stand

## Clickable Items — Detail

### Pensieve
Clicking triggers a bubble/ripple expand animation (CSS keyframe expanding circle from the pensieve's screen position).
Opens into a masonry-style CSS grid of the couple's photos and videos.
- Grid has no fixed item sizing — mix of portrait and landscape in an unfixed/variable grid.
- Each item is wrapped with a CSS decorative picture-frame border (HP portrait-frame style).
- Videos are auto-muted and play on hover.
- Photos and videos are provided as asset files (placeholders during development).
- Closing plays the bubble animation in reverse back to the pensieve.
- Pensieve-specific BGM loops while open.

### Clock (Weasley-style)
Reuse the existing `.specialClock` implementation pattern from `index.html` exactly:
- Two hands: Joel and HW (Hui Wen).
- 6 location labels around the clock face.
- Funny notes per location shown in a readout below the clock face.
- Routes and notes are defined as JS data arrays (easy to update).
- Locations/routes/notes TBD — will be decided and populated before implementation of this section.
- Clock-specific BGM loops while open.

### Marauder's Map
Reuse and adapt the existing multi-stage fold animation from `index.html`/`index.js`:
1. Paper fold-open animation.
2. SVG handwriting reveal: "I solemnly swear / I am up to no good".
3. Map is revealed: the actual JW Marriott South Beach Singapore venue floor plan, styled as aged parchment with ink-line drawing aesthetic (Marauder's Map style).
4. Animated CSS footprints walk along paths on the map.

Reference style: https://codepen.io/oliviale/pen/ZwWbNg
Map-specific BGM loops while open.

### Owl Stand (RSVP)
Clicking plays an owl animation, then the owl drops an envelope which opens to reveal the Tally RSVP form (same Tally form as `index.html`, ID `Pd07pB`; use the same lazy-load embed pattern from `index.js`).
After form submission:
- Envelope closes (animation).
- Owl flies in from one side, grabs the envelope, flies off the opposite side.

Always allows re-submission (no localStorage block; owl stand is always interactive).
RSVP-specific BGM or room BGM continues while open.

## Tech Stack

- Pure vanilla HTML/CSS/JS — no frameworks, no build tools.
- Fully mobile-responsive.
- localStorage keys all prefixed `HP_`.
- RSVP handled entirely by Tally (no backend needed).

## Assets (to be supplied)
- Couple's photos and videos for the Pensieve wall (use placeholders during dev).
- BGM audio files per view (use silent/placeholder `<audio>` elements during dev).
- Actual venue floor plan for the Marauder's Map section.

## Assets — Pixel Art Sprites to Draw

All art is 8-bit pixel art style. Dark HP palette: deep reds, wood browns, candlelight amber, near-blacks. Each asset is a PNG with transparent background unless noted.

### Fat Lady (Entry Gate)
- `fat-lady-idle.png` — portrait, seated, neutral expression, in ornate painted frame
- `fat-lady-talking.png` — mouth open / speaking frame (used for dialogue)
- `fat-lady-wrong.png` — disapproving / stern expression frame
- `fat-lady-swing-open-1.png` through `fat-lady-swing-open-4.png` — hinge swing animation frames (portrait rotating on left edge to reveal doorway behind)
- `fat-lady-frame.png` — decorative gold/carved wooden portrait frame (separate layer so the portrait can animate inside it)

### Owl
- `owl-fly-1.png` through `owl-fly-4.png` — flying cycle sprite frames (wings up/down, used for entrance and exit)
- `owl-perched.png` — owl sitting still on the stand
- `owl-drop.png` — owl talons releasing envelope mid-flight
- `owl-grab.png` — owl talons gripping envelope (for post-RSVP exit)

### Envelope / Letter
- `envelope-closed.png` — sealed envelope, wax seal visible
- `envelope-open-1.png` through `envelope-open-3.png` — flap lifting animation frames
- `envelope-open.png` — fully open envelope with letter/parchment visible inside
- `envelope-close-1.png` through `envelope-close-3.png` — closing animation frames (reverse of open)

### Common Room Background
- `common-room-bg.png` — full room background scene:
  - Stone/wood-panelled walls
  - Dark red carpet/wooden floor
  - Bookshelf wall sections (left and right)
  - Fireplace centre-back with stone surround
  - Two arched windows
  - 4 wall-mounted candle sconces
- `candle-sconce-unlit.png` — sconce with unlit candle (used for `nox` state)
- `candle-sconce-lit-1.png` / `candle-sconce-lit-2.png` — two-frame flicker animation (used for `lumos` state and default idle)
- `fireplace-1.png` through `fireplace-3.png` — looping flame flicker animation frames (overlaid on the fireplace area of the background)

### Common Room — Clickable Items (placed as overlays on the background)
- `pensieve-idle.png` — stone basin on central table, faint swirling mist inside
- `pensieve-glow.png` — highlighted/hover state (brighter mist, subtle glow)
- `clock-idle.png` — tall Weasley-style clock mounted on the wall, two hands visible
- `clock-glow.png` — highlighted/hover state
- `map-idle.png` — folded aged-parchment map resting on a side table
- `map-glow.png` — highlighted/hover state (edge slightly glowing)
- `owl-stand-idle.png` — wooden stand/perch in the corner, owl perched on it
- `owl-stand-glow.png` — highlighted/hover state

### Cursor
- `cursor-wand.png` — wand cursor sprite (tip pointing up-left, ~32×32px)
- `cursor-wand-lumos.png` — same wand with a soft glowing orb at the tip (used during `lumos` state)
- `cursor-sparkle-1.png` through `cursor-sparkle-3.png` — small sparkle/star frames for the particle trail effect

### Pensieve View
- `pensieve-bubble-expand-1.png` through `pensieve-bubble-expand-5.png` — expanding ripple/bubble overlay frames for the open transition
- `photo-frame-border.png` — HP portrait-style decorative pixel art border, tileable/resizable, used to wrap each photo and video in the memory wall

### Weasley Clock View
- `clock-face.png` — full clock face: parchment-coloured circle, 6 location label segments, roman numerals or HP-style markings, decorative border
- `clock-hand-joel.png` — Joel's hand (pointed, labelled "Joel", pivot at base)
- `clock-hand-hw.png` — HW's hand (pointed, labelled "HW", pivot at base)
- `clock-frame.png` — ornate wooden/carved outer clock case

### Marauder's Map View
- `map-folded.png` — tightly folded map from above (starting state before fold-open animation)
- `map-fold-2.png` / `map-fold-3.png` — intermediate fold-open frames
- `map-parchment-bg.png` — aged parchment texture background for the revealed map (sepia, stained edges)
- `map-venue-lineart.png` — JW Marriott South Beach venue floor plan drawn in Marauder's Map ink style (thin ink lines, room labels in script) — *requires actual floor plan reference*
- `footprint-left.png` / `footprint-right.png` — small pixel footprint sprites used for the walking path animation on the map

### UI Chrome
- `music-icon-on.png` — musical note / speaker icon, lit state (top-right toggle)
- `music-icon-off.png` — same icon, muted/crossed-out state
- `close-btn.png` — pixel art × close button (used when any item view is open)
- `item-label-bg.png` — small dark pill/banner background for the hover item name label