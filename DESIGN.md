# Focus Tracker — Design System

The visual authority for this app. Derived from the shipped implementation
(v6, forest removed, SVG icon system in place). Update it when the system
changes, not to describe intentions.

## What this is

A friendly focus buddy. You set the phone down and focus alongside a pet, and
focusing earns you the pets themselves. The product's mechanism is **the
collection is the progression**: every minute of focused time is progress
toward meeting the next animal.

The surface mode is **Operate** — the visitor is completing a task (start a
session, keep a streak, grow a collection). Ambition shows as precision and
restraint, not as expression. Brand lives in exact details.

## Surface & light

Phones and tablets, held at arm's length, often in the evening (the streak
reminder fires at 20:00). Light mode only. The ground is a sky wash
(`--sky-50` → white) so the app reads as calm daylight rather than a dark
productivity tool.

## Color

Four themes, each swapping the whole `brand-*` and `sky-*` ramps via
`data-theme` on the root. Tokens live in `styles/global.css` as **RGB
triplets** consumed through Tailwind (`rgb(var(--brand-600) / <alpha-value>)`),
so alpha utilities work and every theme re-colors automatically.

| Theme    | Brand ramp anchor | Character |
| -------- | ----------------- | --------- |
| `blue`   | `#1A6DFF`         | default, sky |
| `pink`   | `#E11D48`         | rose |
| `purple` | `#7C3AED`         | violet |
| `emerald`| `#059669`         | green |

Rules that hold across themes:

- **Never hard-code a brand hex in a component.** Use `brand-*` / `sky-*`
  utilities so the theme swap is total.
- Semantic colors stay fixed regardless of theme: amber = streak/attention,
  emerald = success/claimable, red = urgency badge, slate = neutral text.
- Text on a brand gradient is white; secondary text on that surface is
  `text-white/75` — tinted from the hue, never gray.
- Micro-labels use `tracking-widest` uppercase at 10–11px, `font-black`.

## Type

One family: **Roboto Flex**, self-hosted through `next/font` as
`--font-roboto`, declared in `lib/gameState`'s consumer `styles/variables.css`
as `--ion-font-family`. Variable weight covers 400–900 without faux-bold.

- Display / numbers: `font-black` + `tabular-nums`. Never proportional figures
  in a counter or a stat tile — they jitter as they tick.
- Body: 12–14px, `leading-relaxed` inside cards.
- **10px is the floor.** Nothing in the UI goes below it. Uppercase section
  labels are 11px.
- Headings carry their own weight: no eyebrow/kicker labels above them.

## Icons

`components/Icon.tsx` is the only icon system. ~35 hand-authored glyphs, all on
one **24×24 grid**, `stroke-width: 2`, round caps and joins, `fill: none`,
`stroke: currentColor`.

- **Colour is layered, not inherited flat.** A stroke-only glyph that just takes
  `currentColor` is too quiet: coin, flame and chart all collapse into the same
  grey outline, which is what flattened the app when the emoji came out. So
  every representational glyph carries an **identity hue** in the `IDENTITY`
  map — coin gold, flame orange, paw violet, freeze ice-blue, sprout green — and
  can sit on a tinted **plate**. Chrome (chevrons, close, the tab bar) has no
  identity and keeps inheriting, because a permanently blue chevron is noise.
- Resolution order, first match wins: explicit `tone` prop → a `text-*` colour
  already in `className` → the glyph's identity hue → `currentColor`. The
  `className` rung exists so a caller that deliberately mutes a glyph still can.
- **On a saturated surface, pass `tone="inherit"`.** Banners, the hero band, the
  coin wallet and the reward toast sit on deep gradients or tinted pills; the
  glyph must take white (or the surrounding tint) rather than its identity hue,
  or it turns low-contrast mud.
- `plate` wraps the glyph in a `bg-*-50` chip with a 1px `ring-*-100`, sized off
  the glyph (`size + 2×clamp(4, size/2)`), and never a shadow — the card already
  owns its elevation. Use it for section headers, so six cards are not six
  identical grey glyphs.
- Sizing scales the square via the `size` prop (default 20). Never pass
  width/height classes — stroke weight stays optically constant.
- Decorative icons beside visible text get no label (`aria-hidden` is the
  default). Standalone icons pass `label`.
- **There are no emoji in this product.** Emoji render as whatever font the OS
  ships, ignore the palette, and differ across iOS/Android/Windows. The pet
  illustrations and the accessory products are authored SVG for the same
  reason.

### Illustration

- **Pets** (`components/Mascot.tsx`): 22 species, each authored on a 120×120
  grid sharing one construction — a centered 40r head at (60,64), a shared eye
  pair at (45,60)/(75,60), shared blush at (37,78)/(83,78), and per-species
  `MOUTH_DY` offsets. Four moods (idle/running/happy/sad) re-use those shared
  features, so every animal reads as one family. New pets must follow the grid,
  not invent positions.
- **Accessories** (`components/AccessoryShop.tsx`): 32×32 filled product art
  with a darker edge and a light catch, so each reads as an object at 30px.
  These are products, not icons — filled, not stroked, and carrying their own
  literal colours (pink flower, red bow, violet hat, blue cap, gold crown)
  rather than `currentColor`. They replace emoji objects, so they keep the
  object's real hue instead of following the theme.

## Layout

- Three tabs: Home, Focus, Rewards (`components/TabBar.tsx`). The tab bar is
  centered in a `max-w-md` so tablets don't fling the targets to the corners.
- **Home answers "where am I"; Rewards is where you claim and collect.** Home
  is the streak band (headline number + today's focus bar), one streak
  protection card, the pet, the week, and a single link to Rewards. It carries
  no shop, no claim button, and no advertising carousel — the rotating banner
  row that used to sit here advertised features one tab away and pushed the
  streak below the fold.
- **The streak number appears once per screen.** The hero band owns it; the
  protection card owns the shield state; the pet card is about the pet. Three
  cards each restating "4 days" made the page stutter.
- **Rewards has two tabs: Claim and Collect.** Claim holds the Today card
  (focus goal → streak check-in → daily gift, in the order they unlock),
  achievements, and the pet collection. Collect holds the accessory and theme
  shops. A single scroll that mixed a wallet, two shops, 22 pets, and 18 badges
  had no hierarchy at all.
- **The Today card spans the full width.** It is the page's primary surface,
  and putting it in a half-width tablet column squeezed the seven check-in
  cells below the 44px tap minimum at every viewport ≥768px.
- Pages live in a horizontally swipeable snap carousel; the tab bar and swipe
  both drive it. A vertical swipe must never change tab (verified in
  `tests/gallery/gesture.js`).
- Content wrappers: `max-w-md` on phones, `md:max-w-3xl` / `lg:max-w-4xl` on
  wider, **always with `mx-auto`**. Without it content hugs the left edge on
  every screen ≥600px — this was a real shipped bug.
- Two-column layouts start at `md`. Tablet columns must be balanced in height;
  do not leave a tall empty gutter.
- The shell is `100dvh` with `100vh` fallback; safe-area insets are applied
  through `env()` on the page wrappers and the tab bar.

## Streak protection

Two ways to survive a miss, and they are **one decision seen from two sides**:
a shield is paid *before* a miss, a repair is paid *after* one. They live in a
single `StreakCard` and it offers exactly one action — the one available now,
in this priority: repair (amber) → shield held (sky, no button) → add a shield
(sky) → nothing purchasable, with a one-line reason.

- **One shield, not a stock.** `STREAK_FREEZE_MAX = 1`. A stock only paid out
  when it covered the *whole* gap, which could not be stated in a card.
- The buy predicate is `canBuyStreakFreeze`, and both the card and the purchase
  read it. A second copy of that rule in the component is how the UI ended up
  offering shields the engine refused.
- Retired saves holding 2–3 shields keep one and are refunded
  `STREAK_FREEZE_COST` for the rest. A count the old shop could never have sold
  is treated as corruption: capped, no refund, so a damaged save cannot mint
  coins.

## Touch

- **44×44 minimum** for anything interactive. Disabled controls are exempt
  (they aren't tappable).
- Where seven cells genuinely cannot each reach 44px (the 7-day check-in strip),
  the strip wraps to 4+3. Seven cells need 332px of content width
  (`7×44 + 6×4` gap), which is a **400px viewport** once page and card padding
  are added — so the breakpoint is `min-[400px]`, not `min-[360px]`. The
  earlier 360px breakpoint shipped 39–41px cells and was wrong in the doc.
- Hover is never load-bearing. Feedback is `active:scale-*` plus haptics on
  native.

## Cards & depth

- One elevation per element: either a `1px` slate border **or** a soft shadow.
  Never both on the same card (that's the ghost-card tell).
- Radii: `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for inner tiles,
  `rounded-lg` for controls. Pills are only for small chips/counters.
- Cards are for genuinely grouped content. Do not nest cards inside cards, and
  do not reduce every section to an identical icon-heading-text card.

## Motion

- One authored moment per event, not scattered effects: the stat pop, the
  confetti burst on a milestone, the drift of clouds.
- `prefers-reduced-motion: reduce` kills all of it globally in `global.css`.
- Exponential/gentle ease-out. The game's celebratory pops use a slight
  overshoot — that is a deliberate, kept trait of this playful product, not a
  default to copy into new chrome.

## Copy

- Second person, warm, specific. The pet is named in the sentence
  ("Bear is ready to focus with you"), not described generically.
- Controls name their action: "Start focus", "Buy 60", "Claim reward".
- Numbers carry their unit or symbol via an icon, not an emoji
  (`<Icon name="coin" /> 140`, not `140 🪙`).

## Accessibility

- Every control has an accessible name; icon-only buttons get `aria-label`.
- Progress bars expose `role="progressbar"` with `aria-valuenow`.
- Live regions announce rewards (`role="status" aria-live="polite"`).
- Focus is visible: `focus-visible:outline-2 outline-offset-2`.
- Body text meets 4.5:1; large text 3:1. Never communicate state by color
  alone — pair it with an icon or a word.

## Verification

Changing UI means running all four:

1. `npm test` — engine + migration coverage.
2. `node tests/gallery/audit.js <tab>` — 17 viewports incl. phone landscape;
   fails on clipping, overflow, and sub-44px targets.
3. `node tests/gallery/scroll.js <tab>` — nothing trapped in the fixed shell.
4. `node tests/gallery/gesture.js` — carousel and banner swipes.
5. `node tests/gallery/emoji-scan.js` — must report 0 lines.

Emulated viewports prove layout, never gestures; Chromium is not Safari. Name
what stayed untested rather than implying device coverage.
