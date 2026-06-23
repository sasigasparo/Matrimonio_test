# Design

"Luxury Wedding Social Network" — a premium, romantic, mobile-first skin over the existing
React/Vite wedding app. Implemented as a CSS-variable token system in `frontend/index.css`
(no Tailwind/shadcn); pages style largely via `var(--token)` inline, so retuning tokens
reskins the whole app. Motion via `framer-motion`, icons via `lucide-react`.

## Theme

Light, warm, airy. Near-white pink-tinted background; white cards floating on soft,
pink-tinted shadows; one confident pink as the brand voice; deep-rose for pink text that
must meet contrast. Editorial serif display + clean sans body. Feels like Apple Invites
crossed with Instagram, not a wedding template.

## Color

Primary palette — a delicate dusty-rosewood take on the brief's pink (softened from
`#F45C8C` at the couple's request), contrast-tuned:

| Token | Value | Role |
|---|---|---|
| `--bg` / `--ivory` | `#FFF7F9` | App background (pink-white) |
| `--cream` | `#FCEDF2` | Alternating section background |
| `--white` / cards | `#FFFFFF` | Card / surface |
| `--rose` (primary) | `#C76B8B` | Dusty rosewood — buttons, active states, accents (delicate; white text on it = button only, 3.6:1) |
| `--rose-deep` | `#A63D63` | Pink TEXT on light bg (AA ≥4.5:1 — 5.7:1), links, emphasis |
| `--blush` (secondary) | `#FBDCE6` | Soft pink fills, received-bubble, chips |
| `--accent` | `#CFA5B5` | Mauve accent, hairlines, secondary detail |
| `--charcoal` (text) | `#1B1B1B` | Primary text |
| `--warm-gray` (muted) | `#6B7280` | Muted text (AA on white) |
| `--sage` (success) | `#43A047` | Confirmed/success |
| `--gold` | `#C9A36A` | Warm secondary accent / pending |

Rules: never use light pink (`--blush`/`#F45C8C`) for body text on light bg — use
`--rose-deep` or `--charcoal`. Status colours always pair with icon + text. Tints are
transparencies of the hue, not grey.

## Typography

- **Display / headings:** `Playfair Display` (serif), weights 400–700. `text-wrap: balance`.
- **Body / UI:** `Inter` (sans), 400–700. Body line-length ≤ 70ch.
- **Numerals (countdown, stats):** `Inter` 800 with `font-variant-numeric: tabular-nums`
  (stands in for SF Pro Display Bold).
- Pairing is contrast-axis (serif display + geometric sans) — never two similar sans.
- Display clamp ceiling ~5.5rem; letter-spacing floor -0.02em.

## Radius & Shadow

- Radii: cards `--radius-lg: 24px`, inputs `--radius-md: 18px`, floating/FAB
  `--radius-xl: 32px`, small `--radius-sm: 12px`, pill `999px`.
- Shadows: soft, pink-tinted, multi-layer (`--shadow-sm/md/lg/xl`); `--glow-rose` for
  active pink elements. Premium glass surfaces (`backdrop-filter`) used sparingly —
  bottom nav, hero overlays only, never decorative.

## Motion

- Durations 180–350ms. Easing `--ease-out-quart` / `--ease-out-expo` (no bounce/elastic).
- Framer Motion for page/element transitions, staggered list reveals, hero parallax,
  micro-interactions (tap scale on buttons/cards). Every animation has a
  `prefers-reduced-motion` crossfade/instant fallback.

## Components

- **BottomNav** — floating, glass, iOS-style; 5 tabs (Home · Chat · Gallery · Menu ·
  More); active tab pink with indicator; "More" opens a sheet for overflow routes
  (Luoghi, Quiz, Tavoli, Regali, FAQ, RSVP, Admin).
- **Cards** — white, 24px radius, soft shadow, no side-stripes; hover lift on desktop,
  tap-scale on mobile.
- **Buttons** — pill/rounded; primary = pink fill + white text + glow on press; secondary
  = white + hairline; large CTAs in hero.
- **Chips** — pill, selectable (RSVP diet, menu/gallery filters); selected = pink fill.
- **Bubbles** — chat: sent = soft pink (`--blush` tint), received = white; custom audio
  player with waveform.
- **FAB** — 32px-radius floating action (gallery upload, chat camera), pink, glow.

## Layout

Phone-first, max content width ~640px on guest surfaces, centered; generous vertical
rhythm between sections (alternating `--white` / `--cream`). Bottom nav reserves safe-area
padding (`env(safe-area-inset-bottom)`). Masonry for gallery, sticky filter bars, full-
bleed hero with parallax image + dark gradient for legibility.
