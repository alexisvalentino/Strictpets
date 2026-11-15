'use client';

// One hand-authored icon system for the whole app.
//
// Every glyph is drawn on the same 24x24 grid with a 2px stroke, round caps
// and round joins. Nothing here is an emoji: emoji render as whatever the OS
// ships, which breaks the visual voice, ignores the palette, and renders
// differently on iOS, Android and Windows.
//
// COLOUR. A stroke-only glyph inherits `currentColor`, and on its own that is
// too quiet: a coin, a flame and a chart all rendered as the same grey slate
// outline, which is what flattened the app when the emoji came out. So each
// representational glyph carries an IDENTITY HUE (coin is gold, flame is
// orange, paw is violet) and can sit on a tinted PLATE. Chrome - chevrons,
// close, the tab bar - has no identity and keeps inheriting, because a
// chevron that is permanently blue is noise.
//
// Resolution order, first match wins:
//   1. explicit `tone` prop
//   2. a `text-*` colour already in `className` (caller decided)
//   3. the glyph's identity hue
//   4. `currentColor`
// Rule 2 exists so callers that deliberately mute a glyph still can; passing a
// hue on `className` instead of `tone` is fine, this component gets out of the
// way.
//
// Sizing rule: the glyph is square and scales with the `size` prop; callers
// never pass width/height classes, so stroke weight stays optically constant.

import type { SVGProps } from 'react';

export type IconName =
  // navigation
  | 'home'
  | 'focus'
  | 'gift'
  // economy & progress
  | 'coin'
  | 'flame'
  | 'shield'
  | 'freeze'
  | 'target'
  | 'chart'
  | 'calendar'
  | 'player'
  // pets
  | 'paw'
  | 'pets'
  | 'bolt'
  | 'sprout'
  | 'trophy'
  | 'dice'
  | 'crown'
  | 'gem'
  | 'star'
  | 'medal'
  | 'compass'
  | 'rocket'
  | 'wings'
  | 'timer'
  // actions & states
  | 'check'
  | 'lock'
  | 'close'
  | 'plus'
  | 'chevronRight'
  | 'chevronDown'
  | 'sparkle'
  | 'palette'
  | 'ribbon'
  | 'heart'
  | 'info';

/** Identity palettes. Every hue resolves against the four themes, because
 *  `brand` reads from the ramp and the rest are theme-independent semantics. */
export type IconTone =
  | 'brand'
  | 'sky'
  | 'amber'
  | 'orange'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'slate'
  | 'inherit';

type ResolvedTone = Exclude<IconTone, 'inherit'>;

// What each glyph IS, not where it happens to be used. An object gets the hue
// the emoji used to give it; chrome is left out and keeps inheriting.
const IDENTITY: Partial<Record<IconName, ResolvedTone>> = {
  coin: 'amber',
  flame: 'orange',
  crown: 'amber',
  trophy: 'amber',
  medal: 'amber',
  star: 'amber',
  sparkle: 'amber',
  bolt: 'amber',
  gem: 'sky',
  freeze: 'sky',
  shield: 'sky',
  timer: 'sky',
  calendar: 'sky',
  chart: 'sky',
  target: 'sky',
  compass: 'sky',
  gift: 'rose',
  heart: 'rose',
  rocket: 'rose',
  sprout: 'emerald',
  paw: 'violet',
  pets: 'violet',
  dice: 'violet',
  ribbon: 'violet',
  wings: 'violet',
  player: 'brand',
  palette: 'brand',
};

const TONE_TEXT: Record<ResolvedTone, string> = {
  brand: 'text-brand-600',
  sky: 'text-sky-600',
  amber: 'text-amber-600',
  orange: 'text-orange-600',
  emerald: 'text-emerald-600',
  violet: 'text-violet-600',
  rose: 'text-rose-600',
  slate: 'text-slate-400',
};

// A plate is a tint of the glyph's own hue plus a 1px ring of the next step.
// Never a shadow: one elevation per element, and the plates sit inside cards
// that already own theirs.
const TONE_PLATE: Record<ResolvedTone, string> = {
  brand: 'bg-brand-50 ring-brand-100',
  sky: 'bg-sky-50 ring-sky-100',
  amber: 'bg-amber-50 ring-amber-100',
  orange: 'bg-orange-50 ring-orange-100',
  emerald: 'bg-emerald-50 ring-emerald-100',
  violet: 'bg-violet-50 ring-violet-100',
  rose: 'bg-rose-50 ring-rose-100',
  slate: 'bg-slate-50 ring-slate-200',
};

// A caller who already named a text colour keeps it (rule 2 above).
const CALLER_COLOUR =
  /\btext-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|brand|white|black|current|transparent|inherit)\b/;

const resolveTone = (
  name: IconName,
  tone: IconTone | undefined,
  className: string | undefined,
): IconTone => {
  if (tone) return tone;
  if (className && CALLER_COLOUR.test(className)) return 'inherit';
  return IDENTITY[name] ?? 'inherit';
};

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
  size?: number | string;
  /** Accessible label; omit for decorative icons beside visible text. */
  label?: string;
  /** Override the glyph's identity hue. `inherit` takes the surrounding text. */
  tone?: IconTone;
  /** Wrap in a tinted chip of the same hue - for section headers and badges. */
  plate?: boolean;
};

// A glyph marked solid is drawn as a FILLED shape with a light catch, the way
// the accessory art is drawn: at 9-14px a 2px hollow outline reads as a grey
// donut, which is exactly what made the coin and the flame disappear when the
// emoji came out. Chrome stays stroked. Solid glyphs are always rendered in an
// identity hue, so the white highlight reads as light on a coloured object
// rather than as a hole.
const P = ({ d, ...rest }: { d: string } & SVGProps<SVGPathElement>) => (
  <path d={d} {...rest} />
);

// The light catch used on every solid glyph is a translucent white stroke or
// fill on top of `currentColor` - a highlight, not a knockout, in the same
// spirit as the light catch on AccessoryShop's product art.

const GLYPHS: Record<IconName, JSX.Element> = {
  home: (
    <>
      <P d="M3.5 10.5 12 3.5l8.5 7" />
      <P d="M5.5 9.5v9a1.5 1.5 0 0 0 1.5 1.5h3v-5.5h4V20h3a1.5 1.5 0 0 0 1.5-1.5v-9" />
    </>
  ),
  focus: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <P d="M12 9.5V13l2.5 1.5" />
      <P d="M9 2.5h6" />
      <P d="M12 2.5v3" />
    </>
  ),
  gift: (
    <>
      <P d="M4 11h16v8.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11Z" />
      <P d="M3 7.5h18V11H3z" />
      <P d="M12 7.5V20.5" />
      <P d="M12 7.5S10.6 3.5 8.4 3.5a2.2 2.2 0 0 0 0 4.4H12Z" />
      <P d="M12 7.5s1.4-4 3.6-4a2.2 2.2 0 0 1 0 4.4H12Z" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="5.4" opacity="0.45" />
      <P d="M9.9 12.7c0 .9.9 1.5 2.1 1.5s2.1-.6 2.1-1.5-.9-1.4-2.1-1.7-2.1-.8-2.1-1.7.9-1.5 2.1-1.5 2.1.6 2.1 1.5" />
    </>
  ),
  flame: (
    <>
      <P d="M12 2.8s5.4 4 5.4 8.9a5.4 5.4 0 0 1-10.8 0c0-2 .9-3.6 1.9-4.8.5 1.6 1.3 2.6 2.3 2.9.2-2.4.7-4.8 1.2-7Z" />
    </>
  ),
  shield: (
    <>
      <P d="M12 3 4.8 6v5.6c0 4.3 3 7.7 7.2 9.4 4.2-1.7 7.2-5.1 7.2-9.4V6L12 3Z" />
    </>
  ),
  freeze: (
    <>
      <P d="M12 2.8 5.5 5.8v5.3c0 4 2.8 7.2 6.5 8.8 3.7-1.6 6.5-4.8 6.5-8.8V5.8L12 2.8Z" />
      <P d="M12 8.4v6.4" />
      <P d="M9.6 10.1 12 12.4l2.4-2.3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  chart: (
    <>
      <P d="M4 20V3.5" />
      <P d="M4 20h16.5" />
      <P d="M8.2 20v-6.5" />
      <P d="M12.6 20V9" />
      <P d="M17 20v-9.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <P d="M3.5 10.2h17" />
      <P d="M8 3.5v4" />
      <P d="M16 3.5v4" />
    </>
  ),
  player: (
    <>
      <P d="M8.5 5.5 18 12l-9.5 6.5V5.5Z" />
    </>
  ),
  paw: (
    <>
      <ellipse cx="7.4" cy="9.4" rx="1.9" ry="2.5" transform="rotate(-16 7.4 9.4)" />
      <ellipse cx="12" cy="7.6" rx="1.9" ry="2.6" />
      <ellipse cx="16.6" cy="9.4" rx="1.9" ry="2.5" transform="rotate(16 16.6 9.4)" />
      <P d="M12 12.2c2.6 0 4.9 1.9 4.9 4.2 0 1.7-1.4 2.8-3.1 2.8-.9 0-1.2-.4-1.8-.4s-.9.4-1.8.4c-1.7 0-3.1-1.1-3.1-2.8 0-2.3 2.3-4.2 4.9-4.2Z" />
    </>
  ),
  pets: (
    <>
      <ellipse cx="6.6" cy="10" rx="1.7" ry="2.2" transform="rotate(-16 6.6 10)" />
      <ellipse cx="10.4" cy="8" rx="1.7" ry="2.3" />
      <ellipse cx="14.6" cy="8" rx="1.7" ry="2.3" />
      <ellipse cx="18.4" cy="10" rx="1.7" ry="2.2" transform="rotate(16 18.4 10)" />
      <P d="M12.5 12.4c2.4 0 4.5 1.8 4.5 3.9 0 1.6-1.3 2.6-2.9 2.6-.8 0-1.1-.4-1.6-.4s-.8.4-1.6.4c-1.6 0-2.9-1-2.9-2.6 0-2.1 2.1-3.9 4.5-3.9Z" />
    </>
  ),
  bolt: (
    <>
      <P d="M13.2 2.8 5.6 13.4h5.3l-.9 7.8 7.6-10.6h-5.3l.9-7.8Z" />
    </>
  ),
  sprout: (
    <>
      <P d="M12 21v-8.4" />
      <P d="M12 12.6c0-3.1-2.3-5.6-5.2-5.6-.6 0-1.2.1-1.8.3.2 3.1 2.6 5.3 5.5 5.3H12Z" />
      <P d="M12 12.6c0-3.4 2.5-6.1 5.7-6.1.6 0 1.2.1 1.8.3-.2 3.4-2.8 5.8-6 5.8H12Z" />
    </>
  ),
  trophy: (
    <>
      <P d="M7.5 4h9v4.6a4.5 4.5 0 0 1-9 0V4Z" />
      <P d="M7.5 5.5H4.6v1.7a3.2 3.2 0 0 0 3.2 3.2" />
      <P d="M16.5 5.5h2.9v1.7a3.2 3.2 0 0 1-3.2 3.2" />
      <P d="M12 13.1V17" />
      <P d="M8.4 20.5h7.2l-.7-3.5H9.1l-.7 3.5Z" />
    </>
  ),
  dice: (
    <>
      <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3.4" />
      <circle cx="8.6" cy="8.6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="8.6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="15.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="15.4" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  crown: (
    <>
      <P d="M3.4 8.4 6.8 12l5.2-6.4L17.2 12l3.4-3.6-1.5 10.4H4.9L3.4 8.4Z" />
    </>
  ),
  gem: (
    <>
      <P d="M7.4 3.5h9.2l3.4 5.1L12 20.5 2 8.6l3.4-5.1Z" />
      <P d="M2 8.6h20" />
      <P d="m8.6 8.6 3.4 11.9 3.4-11.9" />
    </>
  ),
  star: (
    <>
      <P d="m12 3.4 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.9l6.1-.9L12 3.4Z" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="15" r="5.5" />
      <P d="M8.2 9.6 6 3.4h4l2 4.6" />
      <P d="M15.8 9.6 18 3.4h-4l-2 4.6" />
      <P d="m12 12.4.9 1.9 2.1.3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2.1-.3.9-1.9Z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <P d="m15.4 8.6-1.9 4.9-4.9 1.9 1.9-4.9 4.9-1.9Z" />
    </>
  ),
  rocket: (
    <>
      <P d="M12 2.8c2.9 2.4 4.4 5.6 4.4 9.1 0 1.6-.3 3.1-.8 4.4H8.4c-.5-1.3-.8-2.8-.8-4.4 0-3.5 1.5-6.7 4.4-9.1Z" />
      <circle cx="12" cy="9.6" r="1.8" />
      <P d="M8.4 12.6 5.6 16c1.4.3 2.6.9 3.5 1.7" />
      <P d="M15.6 12.6 18.4 16c-1.4.3-2.6.9-3.5 1.7" />
      <P d="M10.2 19.6c.4 1 .9 1.6 1.8 2.1.9-.5 1.4-1.1 1.8-2.1" />
    </>
  ),
  wings: (
    <>
      <P d="M12 12.4c-1.3-2.6-3.9-4.3-7.4-4.6.2 3.6 2.2 6.4 5.6 7.4" />
      <P d="M12 12.4c1.3-2.6 3.9-4.3 7.4-4.6-.2 3.6-2.2 6.4-5.6 7.4" />
      <P d="M12 8.2v9.6" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.4" r="7.4" />
      <P d="M12 10v3.6l2.4 1.4" />
      <P d="M9.4 2.6h5.2" />
    </>
  ),
  check: (
    <>
      <P d="m4.8 12.6 4.6 4.6L19.2 6.8" />
    </>
  ),
  lock: (
    <>
      <rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.4" />
      <P d="M8 10.4V7.8a4 4 0 0 1 8 0v2.6" />
      <circle cx="12" cy="15.2" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  close: (
    <>
      <P d="m6.2 6.2 11.6 11.6" />
      <P d="m17.8 6.2-11.6 11.6" />
    </>
  ),
  plus: (
    <>
      <P d="M12 5.2v13.6" />
      <P d="M5.2 12h13.6" />
    </>
  ),
  chevronRight: (
    <>
      <P d="m9.4 5.6 6.4 6.4-6.4 6.4" />
    </>
  ),
  chevronDown: (
    <>
      <P d="m5.6 9.4 6.4 6.4 6.4-6.4" />
    </>
  ),
  sparkle: (
    <>
      <P d="M12 3.2 13.7 8 18.5 9.7 13.7 11.4 12 16.2 10.3 11.4 5.5 9.7 10.3 8 12 3.2Z" />
      <P d="M17.8 15.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
  palette: (
    <>
      <P d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 2-.8 2-1.8s-.7-1.6-.7-2.5c0-1 .8-1.7 1.9-1.7h1.5a3.8 3.8 0 0 0 3.8-3.8c0-4-3.6-7.2-8.5-7.2Z" />
      <circle cx="8" cy="10" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="11.4" cy="7.2" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="8.6" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  ribbon: (
    <>
      <P d="M12 3.2 7.4 6.4v3.2L12 12.8l4.6-3.2V6.4L12 3.2Z" />
      <P d="M7.4 9.6 4.2 14l2.5 2.4 1.9-3.6" />
      <P d="M16.6 9.6 19.8 14l-2.5 2.4-1.9-3.6" />
    </>
  ),
  heart: (
    <>
      <P d="M12 20.2c-4.6-3.1-7.6-5.9-7.6-9.2A4.2 4.2 0 0 1 12 8.4a4.2 4.2 0 0 1 7.6 2.6c0 3.3-3 6.1-7.6 9.2Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <P d="M12 11v5.4" />
      <circle cx="12" cy="8.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
};

const Icon = ({ name, size = 20, label, tone, plate, className, ...rest }: Props) => {
  const glyph = GLYPHS[name];
  if (!glyph) return null;

  const px = Number(size);
  const resolved = resolveTone(name, tone, className);
  const toneClass = resolved === 'inherit' ? '' : TONE_TEXT[resolved];

  const svg = (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={plate ? undefined : [className, toneClass].filter(Boolean).join(' ')}
      {...rest}
    >
      {glyph}
    </svg>
  );

  if (!plate || resolved === 'inherit') return svg;

  // The plate is sized off the glyph so stroke weight and breathing room stay
  // proportional: a 16px glyph gets a 32px chip, a 22px glyph a 44px one.
  const pad = Math.max(4, Math.round(px * 0.5));
  return (
    <span
      aria-hidden={label ? undefined : true}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ring-1 ${
        TONE_PLATE[resolved]
      } ${toneClass} ${className ?? ''}`}
      style={{ width: px + pad * 2, height: px + pad * 2 }}
    >
      {svg}
    </span>
  );
};

export default Icon;
