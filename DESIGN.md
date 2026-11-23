---
name: Focus Tracker
description: A calm blue-and-white field guide to focused time and small wins.
colors:
  primary: "#1766F3"
  primary-deep: "#0052DB"
  sky: "#0EA5E9"
  ice: "#F0F9FF"
  ice-soft: "#E0F2FE"
  canvas: "#F7FBFF"
  paper: "#FFFFFF"
  ink: "#10233F"
  muted-ink: "#53677F"
  line: "#DFEAF5"
  success: "#047857"
  warning: "#B45309"
typography:
  display:
    fontFamily: "Roboto Flex, Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Roboto Flex, Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1.2
  title:
    fontFamily: "Roboto Flex, Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    lineHeight: 1.35
  body:
    fontFamily: "Roboto Flex, Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Roboto Flex, Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 850
    lineHeight: 1.35
    letterSpacing: "0.16em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  panel: "22px"
  hero: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.primary-deep}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "44px"
  card-panel:
    backgroundColor: "rgba(255, 255, 255, 0.74)"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
  waypoint:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.primary-deep}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: Focus Tracker

## Overview

**Creative North Star: "Field Guide of Small Wins"**

Focus Tracker treats a focus session as a small step along a personal trail. A
cool white and ice-blue canvas keeps the app quiet, while cobalt route marks
connect today's focus to the next pet portrait. The field-guide character comes
from clear labels, compact milestone details, and original animal artwork—not
from paper textures or a dense illustrated map.

Roboto Flex gives the screens a compact, sturdy voice. Familiar mobile controls
stay easy to scan and reach. A cool sky wash sits behind softly frosted white
panels across the app, with brighter glass on the focus surface and companion
stage. Fine white edges and diffuse blue shadows keep the layers light. The
bottom navigation stays translucent as native chrome.

**Key Characteristics:**

- A blue waypoint links focus progress and the next companion.
- Original soft-sculpted 3D portraits give all 22 pets one visual family.
- White panels and subtle depth keep the interface open and legible.
- Cobalt actions, route marks, and tab selection carry the brand.

## Colors

The base theme uses cobalt and white over an ice-blue wash. The user can also
select pink, purple, or emerald themes; those themes replace the `brand-*` and
`sky-*` ramps through `data-theme` while semantic success, warning, and urgent
states keep their own hues.

### Primary

- **Cobalt** (`colors.primary`): brand identity, focus progress, and selected
  controls.
- **Deep cobalt** (`colors.primary-deep`): high-contrast primary actions and
  waypoint emphasis.
- **Clear sky** (`colors.sky`): supporting blue accents and progress ramps.

### Neutral

- **Ice** (`colors.ice`, `colors.ice-soft`): calm page washes and secondary
  control surfaces.
- **Canvas** (`colors.canvas`) and **paper** (`colors.paper`): app background
  and raised panels.
- **Ink** (`colors.ink`) and **muted ink** (`colors.muted-ink`): primary and
  supporting text.
- **Line** (`colors.line`): quiet separators and panel outlines.
- **Success** (`colors.success`) and **warm warning** (`colors.warning`):
  completion and attention states.

### Named Rules

**The Waypoint Rule.** Cobalt marks the next action and the route toward the
next companion. Warm warning and success colors stay attached to their
meanings instead of becoming extra brand accents.

## Typography

**Display Font:** Roboto Flex (with Roboto and system sans-serif fallbacks)
**Body Font:** Roboto Flex (with Roboto and system sans-serif fallbacks)
**Label/Mono Font:** Roboto Flex; tabular figures for timers and counters

**Character:** Compact, direct, and friendly. Variable weights create a clear
step from heavy headings to relaxed supporting copy without introducing a
second font voice.

### Hierarchy

- **Display** (900, 30px, 1.1): top-level Home and Rewards headlines.
- **Headline** (900, 24px, 1.2): the Focus page title and primary result
  messages.
- **Title** (800, 16px, 1.35): pet names and grouped section titles.
- **Body** (400, 14px, 1.55): instructions and explanatory copy.
- **Label** (850, 10px, 1.35, widely tracked uppercase): field notes, section
  labels, and compact status metadata.

Timer values and changing counters use tabular numerals. Small labels remain
secondary to the action and its status.

## Layout

The app keeps three horizontally swipeable destinations—Home, Focus, and
Rewards—with a centered bottom tab bar. Focus is the main task surface. Its
header uses a target glyph as a focus marker; it is not an ordinal step. Home
shows the current streak and today's progress, then the pet and next waypoint.
Rewards separates Claim from Collect so claimable progress stays distinct from
the pet, accessory, and theme collections.

Phone content is centered in a narrow column. Wider screens expand to a
balanced two-column composition, with claim strips kept wide enough for their
touch targets. The shell follows the visible viewport (`100dvh`, with a `vh`
fallback); page wrappers and the tab bar respect iOS and Android safe-area
insets. Narrow check-in rows wrap to preserve a 44px minimum target.

## Elevation & Depth

The system is layered and quiet: grouped white panels use a softly translucent
glass treatment over a pale sky-blue wash, with a fine bright edge and diffuse
blue shadow. The focus surface and companion stage get a slightly deeper glass
layer to frame the active task and pet art. Dense controls and text fields stay
more opaque for clarity. Bottom navigation uses translucent white and blur as
native chrome. The segmented Rewards control uses a frosted base and a
deep-blue selected state.

## Shapes

Panels use a soft, generous radius (about 22px); focus and result surfaces use
24–32px corners. Inner tiles and controls step down to 12–16px, while compact
wallet and streak indicators use full pills. Pet portraits stay cut out over a
soft orbital glow. Route lines are thin and dotted, with circular waypoint
marks rather than numbered stages.

## Components

### Buttons

Primary actions are deep cobalt with white type and a generous hit area. The
focus action and retry action use the same primary treatment; successful
completion and available purchases use semantic success or warm-warning
surfaces. Secondary actions use a white fill, fine outline, and cobalt label.
Press states are immediate and restrained; keyboard focus gets a visible
three-pixel brand outline.

### Chips

Small streak, wallet, and cycle indicators use rounded pills with a pale tinted
fill. Their icon and text remain paired so status is not communicated by color
alone.

### Cards / Containers

Grouped sections use frosted white panels with a fine bright outline, a subtle
blue shadow, and 16px internal spacing. Focus and companion panels use a
slightly stronger glass layer. Pet tiles and shop items use a smaller radius;
active and locked states use a restrained blue fill or dashed outline.

### Inputs / Fields

The custom-duration editor uses numeric inputs on a white fill with a cool
outline, centered figures, and a clear focus ring. The two inputs remain
reachable on narrow phones, alongside a 44px Set control.

### Navigation

The bottom bar is a translucent white surface with three centered, 44px-minimum
targets. The active tab uses a cobalt icon and a pale-blue capsule; the reward
dot appears only when something is claimable. During an active focus session,
navigation remains disabled.

### Waypoint

The focus screen and pet progress card use a slim dotted rail, a solid cobalt
marker, a next-pet label, and the remaining focus goal. This connects progress
to the next unlock without adding a numbered step sequence.

### Pet Portraits

`components/Mascot.tsx` loads the 22 original square WebP portraits from
`public/pets/`. The portraits share a friendly soft-sculpted 3D treatment,
species-accurate colors, and a white background. The component keeps the
existing idle, running, happy, and sad motion, celebration burst, and accessory
overlays. New portraits should match the same lighting, centered framing, and
readability at small sizes.

### Icons and Launch Art

`components/Icon.tsx` remains the interface icon system: custom SVG glyphs with
a consistent 24px grid and stroke treatment. The app mark uses a bear portrait
inside a cobalt focus waypoint. The favicon, PWA icons, Apple touch icon, iOS
app icon, Android adaptive icons, and native splash images use that mark and
the same blue-and-white field-guide world. Android and iOS splash variants also
include dark-appearance artwork; the in-app UI remains light.

## Do's and Don'ts

### Do:

- **Do** keep cobalt and white as the default identity; use the theme ramps for
  theme-aware controls.
- **Do** show the next pet and the remaining goal wherever a waypoint appears.
- **Do** use soft white glass across grouped surfaces, with stronger blur only
  where the sky wash remains visible behind it.
- **Do** preserve 44px interactive targets, safe-area insets, visible keyboard
  focus, and reduced-motion behavior.
- **Do** use the supplied portrait family and authored SVG icons instead of
  platform-dependent emoji.

### Don't:

- **Don't** add numbered stage markers to the Focus header; its target glyph is
  a focus marker, not a step number.
- **Don't** blur dense inner controls or fields; keep them clear and readable.
- **Don't** use emoji as interface icons or pet substitutes.
- **Don't** introduce a second illustration style into the pet collection.
- **Don't** use color alone to explain a claim, lock, success, or warning state.
