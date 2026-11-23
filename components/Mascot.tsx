'use client';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { AccessoryId, MascotId, PetSceneId } from '../lib/gameState';
import PetSceneBackdrop from './PetSceneBackdrop';

type Mood = 'idle' | 'running' | 'happy' | 'sad';

const CONFETTI_COLORS = [
  '#38BDF8', // Sky blue
  '#F472B6', // Bright pink
  '#FBBF24', // Amber gold
  '#34D399', // Emerald
  '#A78BFA', // Purple
  '#FB7185', // Rose
  '#60A5FA', // Blue
  '#F59E0B', // Warm gold
];

const CONFETTI = Array.from({ length: 36 }, (_, i) => {
  // Golden ratio distribution across 360 degrees for natural scatter
  const angle = (i * 137.5 * Math.PI) / 180;
  // Varied blast distance
  const dist = 50 + ((i * 47) % 95); // 50px to 144px
  const bx = Math.round(Math.cos(angle) * dist);
  // Bias upward slightly so particles blast up and out before falling
  const by = Math.round(Math.sin(angle) * dist - 22);
  // Gravity drop during the second half of trajectory
  const gy = 48 + ((i * 31) % 55); // 48px to 102px

  const isCircle = i % 4 === 0;
  const isSquare = i % 4 === 1;
  const w = isCircle ? 7 : isSquare ? 6 : 5 + (i % 3) * 2;
  const h = isCircle ? 7 : isSquare ? 6 : 10 + (i % 3) * 3;

  const spinDir = i % 2 === 0 ? 1 : -1;
  const r1 = `${spinDir * (70 + ((i * 29) % 80))}deg`;
  const r2 = `${spinDir * (220 + ((i * 43) % 160))}deg`;
  const r3 = `${spinDir * (480 + ((i * 61) % 360))}deg`;

  return {
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    w,
    h,
    borderRadius: isCircle ? '50%' : isSquare ? '2px' : '3px',
    delay: `${((i % 7) * 0.018).toFixed(3)}s`,
    duration: `${(1.15 + (i % 5) * 0.09).toFixed(2)}s`,
    bx: `${bx}px`,
    by: `${by}px`,
    gy: `${gy}px`,
    r1,
    r2,
    r3,
  };
});

// Species-specific head art. The eyes, mouth, blush, tears and eyebrows are
// shared below, so every animal gets the same moods with the same positions.
const HEADS: Record<MascotId, ReactNode> = {
  bear: (
    <g>
      <circle cx="30" cy="30" r="12" fill="#FCD34D" />
      <circle cx="90" cy="30" r="12" fill="#FCD34D" />
      <circle cx="30" cy="30" r="5" fill="#FCA5A5" opacity="0.6" />
      <circle cx="90" cy="30" r="5" fill="#FCA5A5" opacity="0.6" />
      <circle cx="60" cy="64" r="40" fill="#FCD34D" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#F59E0B" strokeWidth="3" />
    </g>
  ),
  cat: (
    <g>
      {/* clearly pointed but softly-curved ears */}
      <path
        d="M28 38 Q28 14 42 14 Q56 14 56 30 Q44 38 28 38 Z"
        fill="#FBBF77"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M92 38 Q92 14 78 14 Q64 14 64 30 Q76 38 92 38 Z"
        fill="#FBBF77"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M36 28 Q36 19 42 19 Q48 19 49 27 Q43 32 36 28 Z" fill="#FCA5A5" opacity="0.75" />
      <path d="M84 28 Q84 19 78 19 Q72 19 71 27 Q77 32 84 28 Z" fill="#FCA5A5" opacity="0.75" />
      {/* pink flower on the left ear (classic cute cat) */}
      <g>
        <circle cx="34" cy="16" r="3.2" fill="#F9A8D4" />
        <circle cx="41" cy="16" r="3.2" fill="#F9A8D4" />
        <circle cx="37.5" cy="12" r="3.2" fill="#F9A8D4" />
        <circle cx="34" cy="21" r="3.2" fill="#F9A8D4" />
        <circle cx="41" cy="21" r="3.2" fill="#F9A8D4" />
        <circle cx="37.5" cy="18" r="2.4" fill="#FDE047" />
      </g>
      {/* head */}
      <circle cx="60" cy="64" r="40" fill="#FBBF77" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#F59E0B" strokeWidth="3" />
      {/* white muzzle: two cheek puffs + chin (classic cat "w" face) */}
      <ellipse cx="52" cy="84" rx="9" ry="7" fill="#FFF7ED" />
      <ellipse cx="68" cy="84" rx="9" ry="7" fill="#FFF7ED" />
      <circle cx="60" cy="88" r="6.5" fill="#FFF7ED" />
      {/* tiny rounded nose */}
      <path
        d="M57 74 Q57 71 60 71 Q63 71 63 74 Q63 78 60 80 Q57 78 57 74 Z"
        fill="#F472B6"
      />
      {/* thin curved whiskers sweeping out from the muzzle (no beard-y dots) */}
      <g stroke="#C2703D" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.65">
        <path d="M45 80 Q28 76 16 76" />
        <path d="M45 84 Q27 84 15 85" />
        <path d="M45 89 Q30 93 18 95" />
        <path d="M75 80 Q92 76 104 76" />
        <path d="M75 84 Q93 84 105 85" />
        <path d="M75 89 Q90 93 102 95" />
      </g>
    </g>
  ),
  rabbit: (
    <g>
      {/* long ears with pink inner */}
      <rect x="23" y="6" width="15" height="34" rx="7.5" fill="#FFF1E6" stroke="#F5C97E" strokeWidth="2.5" />
      <rect x="27.5" y="12" width="6" height="24" rx="3" fill="#F9A8D4" />
      <rect x="82" y="6" width="15" height="34" rx="7.5" fill="#FFF1E6" stroke="#F5C97E" strokeWidth="2.5" />
      <rect x="86.5" y="12" width="6" height="24" rx="3" fill="#F9A8D4" />
      {/* head */}
      <circle cx="60" cy="64" r="40" fill="#FFF1E6" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#F5C97E" strokeWidth="3" />
      {/* tiny pink nose */}
      <path d="M57 73 Q57 70 60 70 Q63 70 63 73 Q63 77 60 79 Q57 77 57 73 Z" fill="#F472B6" />
      {/* buck teeth (the rabbit signature) */}
      <rect x="55" y="81" width="4.5" height="6" rx="1.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="60.5" y="81" width="4.5" height="6" rx="1.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    </g>
  ),
  dog: (
    <g>
      {/* floppy ears — smooth rounded lobes hanging at the sides */}
      <path d="M26 40 Q8 46 10 72 Q11 90 26 90 Q38 90 37 66 Q36 48 28 42 Z" fill="#C98A4B" stroke="#A96E34" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M94 40 Q112 46 110 72 Q109 90 94 90 Q82 90 83 66 Q84 48 92 42 Z" fill="#C98A4B" stroke="#A96E34" strokeWidth="2.5" strokeLinejoin="round" />
      {/* head */}
      <circle cx="60" cy="64" r="40" fill="#E8B26A" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#C98A4B" strokeWidth="3" />
      {/* cream muzzle with a round nose */}
      <ellipse cx="60" cy="80" rx="15" ry="11" fill="#FFF3E0" />
      <ellipse cx="60" cy="72" rx="5" ry="4" fill="#1E293B" />
    </g>
  ),
  mouse: (
    <g>
      {/* big round ears with pink inner */}
      <circle cx="30" cy="25" r="13" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2.5" />
      <circle cx="30" cy="21" r="6.5" fill="#F9A8D4" />
      <circle cx="90" cy="25" r="13" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2.5" />
      <circle cx="90" cy="21" r="6.5" fill="#F9A8D4" />
      {/* head */}
      <circle cx="60" cy="64" r="40" fill="#F1F5F9" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#CBD5E1" strokeWidth="3" />
      {/* tiny pink nose */}
      <path d="M57 72 Q57 69 60 69 Q63 69 63 72 Q63 75 60 77 Q57 75 57 72 Z" fill="#F472B6" />
      {/* thin curved whiskers sweeping out from the muzzle */}
      <g stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.65">
        <path d="M45 80 Q28 76 16 76" />
        <path d="M45 84 Q27 84 15 85" />
        <path d="M45 89 Q30 93 18 95" />
        <path d="M75 80 Q92 76 104 76" />
        <path d="M75 84 Q93 84 105 85" />
        <path d="M75 89 Q90 93 102 95" />
      </g>
    </g>
  ),
  panda: (
    <g>
      {/* black ears */}
      <circle cx="30" cy="30" r="11" fill="#1E293B" />
      <circle cx="90" cy="30" r="11" fill="#1E293B" />
      {/* white head */}
      <circle cx="60" cy="64" r="40" fill="#FFFFFF" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#CBD5E1" strokeWidth="3" />
      {/* soft rounded eye patches (pupils render on white sclera below) */}
      <ellipse cx="45" cy="60" rx="11" ry="8.5" fill="#1E293B" />
      <ellipse cx="75" cy="60" rx="11" ry="8.5" fill="#1E293B" />
      {/* rounded nose */}
      <ellipse cx="60" cy="72" rx="4.5" ry="3.5" fill="#1E293B" />
    </g>
  ),
  chick: (
    <g>
      {/* little head tuft */}
      <path d="M60 26 Q54 12 60 8 Q62 18 66 12 Q68 22 60 26 Z" fill="#FACC15" stroke="#EAB308" strokeWidth="2" strokeLinejoin="round" />
      {/* tiny wings peeking out */}
      <ellipse cx="20" cy="76" rx="8" ry="13" fill="#FDE047" stroke="#EAB308" strokeWidth="2.5" transform="rotate(-18 20 76)" />
      <ellipse cx="100" cy="76" rx="8" ry="13" fill="#FDE047" stroke="#EAB308" strokeWidth="2.5" transform="rotate(18 100 76)" />
      <circle cx="60" cy="64" r="40" fill="#FDE047" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#EAB308" strokeWidth="3" />
      {/* orange beak */}
      <path d="M53 70 L67 70 L60 78 Z" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  ),
  frog: (
    <g>
      {/* eye bumps on top of the head */}
      <circle cx="40" cy="34" r="15" fill="#86EFAC" stroke="#22C55E" strokeWidth="3" />
      <circle cx="80" cy="34" r="15" fill="#86EFAC" stroke="#22C55E" strokeWidth="3" />
      <circle cx="60" cy="66" r="40" fill="#86EFAC" />
      <circle cx="60" cy="66" r="40" fill="none" stroke="#22C55E" strokeWidth="3" />
      {/* cover the bump outlines where they meet the head */}
      <circle cx="40" cy="38" r="12" fill="#86EFAC" />
      <circle cx="80" cy="38" r="12" fill="#86EFAC" />
      {/* nostrils */}
      <circle cx="56" cy="71" r="1.6" fill="#15803D" />
      <circle cx="64" cy="71" r="1.6" fill="#15803D" />
    </g>
  ),
  fish: (
    <g>
      {/* tail fin behind the head */}
      <path d="M96 64 L116 46 Q110 64 116 82 Z" fill="#FB923C" stroke="#EA580C" strokeWidth="2.5" strokeLinejoin="round" />
      {/* top fin */}
      <path d="M44 28 Q60 6 78 28 Z" fill="#FB923C" stroke="#EA580C" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="60" cy="64" r="40" fill="#FDBA74" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#EA580C" strokeWidth="3" />
      {/* soft scales + side fin */}
      <g stroke="#FB923C" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7">
        <path d="M80 50 Q86 54 80 58" />
        <path d="M86 62 Q92 66 86 70" />
        <path d="M80 74 Q86 78 80 82" />
      </g>
      <path d="M28 82 Q16 88 22 96 Q30 92 32 86 Z" fill="#FB923C" />
      {/* bubbles */}
      <circle cx="20" cy="30" r="4" fill="none" stroke="#7DD3FC" strokeWidth="2" />
      <circle cx="12" cy="18" r="2.5" fill="none" stroke="#7DD3FC" strokeWidth="2" />
    </g>
  ),
  hamster: (
    <g>
      {/* small round ears */}
      <circle cx="32" cy="32" r="10" fill="#F5C78E" stroke="#D99A4E" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="5" fill="#FCA5A5" opacity="0.7" />
      <circle cx="88" cy="32" r="10" fill="#F5C78E" stroke="#D99A4E" strokeWidth="2.5" />
      <circle cx="88" cy="32" r="5" fill="#FCA5A5" opacity="0.7" />
      <circle cx="60" cy="64" r="40" fill="#F5C78E" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#D99A4E" strokeWidth="3" />
      {/* chubby white cheek pouches + face blaze */}
      <ellipse cx="34" cy="80" rx="15" ry="12" fill="#FFF7ED" />
      <ellipse cx="86" cy="80" rx="15" ry="12" fill="#FFF7ED" />
      <path d="M54 28 Q60 42 66 28 Z" fill="#FFF7ED" />
      <path d="M57 72 Q57 69 60 69 Q63 69 63 72 Q63 75 60 77 Q57 75 57 72 Z" fill="#F472B6" />
    </g>
  ),
  penguin: (
    <g>
      <circle cx="60" cy="64" r="40" fill="#334155" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#1E293B" strokeWidth="3" />
      {/* white heart-shaped face */}
      <path d="M60 50 Q44 36 32 52 Q24 72 40 88 Q50 98 60 98 Q70 98 80 88 Q96 72 88 52 Q76 36 60 50 Z" fill="#FFFFFF" />
      {/* beak */}
      <path d="M53 70 L67 70 L60 78 Z" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  ),
  fox: (
    <g>
      {/* tall pointed ears */}
      <path d="M24 44 L28 10 L54 32 Z" fill="#FB923C" stroke="#C2410C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M96 44 L92 10 L66 32 Z" fill="#FB923C" stroke="#C2410C" strokeWidth="3" strokeLinejoin="round" />
      <path d="M31 34 L33 18 L45 29 Z" fill="#1E293B" opacity="0.8" />
      <path d="M89 34 L87 18 L75 29 Z" fill="#1E293B" opacity="0.8" />
      <circle cx="60" cy="64" r="40" fill="#FB923C" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#C2410C" strokeWidth="3" />
      {/* white cheeks meeting at the muzzle */}
      <path d="M22 70 Q38 66 60 92 Q82 66 98 70 Q94 96 60 104 Q26 96 22 70 Z" fill="#FFF7ED" />
      <ellipse cx="60" cy="74" rx="4.5" ry="3.5" fill="#1E293B" />
    </g>
  ),
  koala: (
    <g>
      {/* big fluffy ears */}
      <circle cx="24" cy="40" r="20" fill="#94A3B8" stroke="#64748B" strokeWidth="3" />
      <circle cx="24" cy="40" r="11" fill="#F1F5F9" />
      <circle cx="96" cy="40" r="20" fill="#94A3B8" stroke="#64748B" strokeWidth="3" />
      <circle cx="96" cy="40" r="11" fill="#F1F5F9" />
      <circle cx="60" cy="64" r="40" fill="#A8B4C4" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#64748B" strokeWidth="3" />
      {/* big oval nose (the koala signature) */}
      <ellipse cx="60" cy="72" rx="8" ry="10" fill="#334155" />
      <ellipse cx="57.5" cy="68" rx="2" ry="3" fill="#FFFFFF" opacity="0.35" />
    </g>
  ),
  pig: (
    <g>
      {/* little folded ears */}
      <path d="M26 42 L28 18 L48 32 Z" fill="#F9A8D4" stroke="#EC4899" strokeWidth="3" strokeLinejoin="round" />
      <path d="M94 42 L92 18 L72 32 Z" fill="#F9A8D4" stroke="#EC4899" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="60" cy="64" r="40" fill="#FBCFE8" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#EC4899" strokeWidth="3" />
      {/* snout */}
      <ellipse cx="60" cy="73" rx="10" ry="7" fill="#F9A8D4" stroke="#EC4899" strokeWidth="2" />
      <ellipse cx="56.5" cy="73" rx="2" ry="3" fill="#BE185D" />
      <ellipse cx="63.5" cy="73" rx="2" ry="3" fill="#BE185D" />
    </g>
  ),
  owl: (
    <g>
      {/* ear tufts */}
      <path d="M28 40 L22 12 L46 30 Z" fill="#A16207" stroke="#854D0E" strokeWidth="3" strokeLinejoin="round" />
      <path d="M92 40 L98 12 L74 30 Z" fill="#A16207" stroke="#854D0E" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="60" cy="64" r="40" fill="#CA8A04" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#854D0E" strokeWidth="3" />
      {/* big pale eye discs (pupils render on top) */}
      <circle cx="45" cy="60" r="12" fill="#FEF3C7" />
      <circle cx="75" cy="60" r="12" fill="#FEF3C7" />
      {/* beak */}
      <path d="M56 70 L64 70 L60 79 Z" fill="#FB923C" stroke="#C2410C" strokeWidth="1.5" strokeLinejoin="round" />
      {/* chest feathers */}
      <g stroke="#854D0E" strokeWidth="1.8" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M44 94 Q48 98 52 94" />
        <path d="M56 97 Q60 101 64 97" />
        <path d="M68 94 Q72 98 76 94" />
      </g>
    </g>
  ),
  turtle: (
    <g>
      {/* little shell dome behind the head */}
      <path d="M20 58 Q24 14 60 12 Q96 14 100 58 Z" fill="#65A30D" stroke="#3F6212" strokeWidth="3" strokeLinejoin="round" />
      <g fill="#84CC16" stroke="#3F6212" strokeWidth="2">
        <path d="M48 22 L60 18 L72 22 L70 34 L50 34 Z" />
        <path d="M30 36 L44 30 L48 42 L36 50 L26 48 Z" />
        <path d="M90 36 L76 30 L72 42 L84 50 L94 48 Z" />
      </g>
      <circle cx="60" cy="68" r="36" fill="#A3E635" />
      <circle cx="60" cy="68" r="36" fill="none" stroke="#4D7C0F" strokeWidth="3" />
    </g>
  ),
  tiger: (
    <g>
      <circle cx="30" cy="30" r="12" fill="#FB923C" stroke="#C2410C" strokeWidth="2.5" />
      <circle cx="30" cy="30" r="5.5" fill="#FFF7ED" />
      <circle cx="90" cy="30" r="12" fill="#FB923C" stroke="#C2410C" strokeWidth="2.5" />
      <circle cx="90" cy="30" r="5.5" fill="#FFF7ED" />
      <circle cx="60" cy="64" r="40" fill="#FB923C" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#C2410C" strokeWidth="3" />
      {/* forehead + cheek stripes */}
      <g fill="#1E293B">
        <path d="M54 26 L60 40 L66 26 Z" />
        <path d="M46 28 L50 38 L52 28 Z" />
        <path d="M74 28 L70 38 L68 28 Z" />
        <path d="M20 58 L34 62 L20 66 Z" />
        <path d="M22 72 L34 72 L24 78 Z" />
        <path d="M100 58 L86 62 L100 66 Z" />
        <path d="M98 72 L86 72 L96 78 Z" />
      </g>
      {/* white muzzle */}
      <ellipse cx="52" cy="82" rx="10" ry="8" fill="#FFF7ED" />
      <ellipse cx="68" cy="82" rx="10" ry="8" fill="#FFF7ED" />
      <path d="M56 72 L64 72 L60 77 Z" fill="#F472B6" />
    </g>
  ),
  lion: (
    <g>
      {/* fluffy mane */}
      <g fill="#D97706">
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return (
            <circle key={i} cx={60 + Math.cos(a) * 44} cy={64 + Math.sin(a) * 44} r="13" />
          );
        })}
      </g>
      <circle cx="60" cy="64" r="44" fill="#D97706" />
      {/* round ears inside the mane */}
      <circle cx="32" cy="34" r="9" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
      <circle cx="88" cy="34" r="9" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
      <circle cx="60" cy="64" r="36" fill="#FCD34D" />
      <circle cx="60" cy="64" r="36" fill="none" stroke="#B45309" strokeWidth="2.5" />
      <ellipse cx="60" cy="81" rx="13" ry="9" fill="#FFF7ED" />
      <path d="M55 72 L65 72 L60 78 Z" fill="#92400E" />
    </g>
  ),
  monkey: (
    <g>
      {/* side ears */}
      <circle cx="18" cy="62" r="14" fill="#A16207" stroke="#713F12" strokeWidth="2.5" />
      <circle cx="18" cy="62" r="7" fill="#FCD9B6" />
      <circle cx="102" cy="62" r="14" fill="#A16207" stroke="#713F12" strokeWidth="2.5" />
      <circle cx="102" cy="62" r="7" fill="#FCD9B6" />
      <circle cx="60" cy="64" r="40" fill="#A16207" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#713F12" strokeWidth="3" />
      {/* heart-shaped face */}
      <path d="M60 52 Q48 36 36 46 Q26 58 34 76 Q42 96 60 98 Q78 96 86 76 Q94 58 84 46 Q72 36 60 52 Z" fill="#FCD9B6" />
      <circle cx="56.5" cy="73" r="1.7" fill="#713F12" />
      <circle cx="63.5" cy="73" r="1.7" fill="#713F12" />
    </g>
  ),
  unicorn: (
    <g>
      {/* rainbow mane behind */}
      <path d="M86 30 Q108 40 104 72 Q100 60 92 56 Z" fill="#C4B5FD" />
      <path d="M90 40 Q112 58 102 88 Q98 72 90 64 Z" fill="#F9A8D4" />
      {/* ears */}
      <path d="M30 40 L34 14 L50 30 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M90 40 L86 14 L70 30 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="60" cy="64" r="40" fill="#FFFFFF" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#CBD5E1" strokeWidth="3" />
      {/* golden horn */}
      <path d="M53 28 L60 2 L67 28 Z" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
      <path d="M55 20 L65 17 M56 13 L64 11" stroke="#F59E0B" strokeWidth="1.5" />
      {/* forelock */}
      <path d="M44 30 Q52 20 64 28 Q56 30 54 40 Q50 32 44 30 Z" fill="#C4B5FD" />
      <path d="M60 28 Q70 22 78 32 Q70 32 66 38 Q64 32 60 28 Z" fill="#F9A8D4" />
      {/* soft nostrils */}
      <ellipse cx="56" cy="76" rx="1.6" ry="1.2" fill="#CBD5E1" />
      <ellipse cx="64" cy="76" rx="1.6" ry="1.2" fill="#CBD5E1" />
    </g>
  ),
  octopus: (
    <g>
      {/* curly tentacles below */}
      <g fill="#C4B5FD" stroke="#8B5CF6" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M26 88 Q14 104 24 112 Q30 102 36 96 Z" />
        <path d="M44 96 Q40 114 50 116 Q52 106 54 100 Z" />
        <path d="M66 100 Q68 114 76 114 Q76 104 74 96 Z" />
        <path d="M84 92 Q96 106 104 102 Q94 96 92 86 Z" />
      </g>
      {/* tall round mantle */}
      <ellipse cx="60" cy="58" rx="40" ry="44" fill="#C4B5FD" />
      <ellipse cx="60" cy="58" rx="40" ry="44" fill="none" stroke="#8B5CF6" strokeWidth="3" />
      {/* spots */}
      <circle cx="44" cy="30" r="4" fill="#A78BFA" />
      <circle cx="74" cy="26" r="5" fill="#A78BFA" />
      <circle cx="62" cy="40" r="3" fill="#A78BFA" />
    </g>
  ),
  dragon: (
    <g>
      {/* small rounded horns */}
      <path d="M36 34 Q26 10 40 8 Q42 22 48 30 Z" fill="#FDE68A" stroke="#D97706" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M84 34 Q94 10 80 8 Q78 22 72 30 Z" fill="#FDE68A" stroke="#D97706" strokeWidth="2.5" strokeLinejoin="round" />
      {/* ear fins */}
      <path d="M22 54 L4 44 L12 64 Z" fill="#6EE7B7" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M98 54 L116 44 L108 64 Z" fill="#6EE7B7" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="60" cy="64" r="40" fill="#6EE7B7" />
      <circle cx="60" cy="64" r="40" fill="none" stroke="#059669" strokeWidth="3" />
      {/* forehead scales */}
      <g fill="#34D399">
        <circle cx="52" cy="34" r="4" />
        <circle cx="60" cy="30" r="4.5" />
        <circle cx="68" cy="34" r="4" />
      </g>
      {/* cream snout + nostrils */}
      <ellipse cx="60" cy="80" rx="15" ry="10" fill="#D1FAE5" />
      <circle cx="56" cy="76" r="1.7" fill="#047857" />
      <circle cx="64" cy="76" r="1.7" fill="#047857" />
    </g>
  ),
};

// Pets whose faces sit on dark fur get white eyes so they stay visible.
const LIGHT_EYES: ReadonlySet<MascotId> = new Set<MascotId>(['panda']);
// Shift the shared mouth down under beaks / big snouts so they don't overlap.
const MOUTH_DY: Partial<Record<MascotId, number>> = {
  chick: 8,
  penguin: 8,
  owl: 8,
  pig: 6,
  koala: 8,
};

// Cosmetic overlays are placed against the normalized transparent portraits.
// The same head and eye anchors are shared by the full catalog so a chosen
// cosmetic follows the pet across every screen and mood.
const ACCESSORIES: Record<AccessoryId, ReactNode> = {
  flower: (
    <g transform="translate(-20 9) scale(1.2)">
      <circle cx="83" cy="16" r="3.2" fill="#F9A8D4" />
      <circle cx="90" cy="16" r="3.2" fill="#F9A8D4" />
      <circle cx="86.5" cy="12" r="3.2" fill="#F9A8D4" />
      <circle cx="83" cy="21" r="3.2" fill="#F9A8D4" />
      <circle cx="90" cy="21" r="3.2" fill="#F9A8D4" />
      <circle cx="86.5" cy="18" r="2.4" fill="#FDE047" />
    </g>
  ),
  scarf: (
    <g>
      <path
        d="M39 76 Q60 84 81 76 L77 86 Q60 93 43 86 Z"
        fill="#38BDF8"
        stroke="#0284C7"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M48 80 Q60 85 72 80" fill="none" stroke="#E0F2FE" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 87 L60 99 L68 87 Z" fill="#0EA5E9" stroke="#0284C7" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M58 90 L60 95 L62 90" fill="none" stroke="#BAE6FD" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),
  'party-hat': (
    <g>
      <path
        d="M60 8 L44 34 L76 34 Z"
        fill="#8B5CF6"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="6" r="4" fill="#FBBF24" />
      <circle cx="51" cy="25" r="1.8" fill="#FDE68A" />
      <circle cx="67" cy="19" r="1.8" fill="#FDE68A" />
    </g>
  ),
  halo: (
    <g>
      <ellipse cx="60" cy="15" rx="17" ry="5.5" fill="none" stroke="#7DD3FC" strokeWidth="6" opacity="0.28" />
      <ellipse cx="60" cy="15" rx="17" ry="5.5" fill="none" stroke="#38BDF8" strokeWidth="2.8" />
      <path d="M47 12 Q60 7 73 12" fill="none" stroke="#E0F2FE" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M40 18 L42 14 L44 18 L48 19.5 L44 21 L42 25 L40 21 L36 19.5 Z" fill="#FBBF24" />
      <path d="M79 9 L80.5 6 L82 9 L85 10.5 L82 12 L80.5 15 L79 12 L76 10.5 Z" fill="#FBBF24" />
    </g>
  ),
  sunglasses: (
    <g>
      <rect x="36" y="54" width="19" height="12" rx="4" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.5" />
      <rect x="65" y="54" width="19" height="12" rx="4" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M55 60 L65 60" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M36 57 L26 55" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
      <path d="M84 57 L94 55" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  crown: (
    <g transform="translate(0 7)">
      <path
        d="M42 36 L42 18 L50 26 L60 14 L70 26 L78 18 L78 36 Z"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="29" r="3" fill="#38BDF8" />
    </g>
  ),
};

const Mascot = ({
  mood,
  variant = 'cat',
  accessory = null,
  scene = 'classic',
  className,
  still = false,
}: {
  mood: Mood;
  variant?: MascotId;
  accessory?: AccessoryId | null;
  scene?: PetSceneId;
  className?: string;
  still?: boolean; // no idle animation (dense grids, locked silhouettes)
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const sad = mood === 'sad';
  const happy = mood === 'happy';
  const eyeColor = LIGHT_EYES.has(variant) ? '#FFFFFF' : '#1E293B';

  useEffect(() => {
    setImageFailed(false);
  }, [variant]);

  const animationClass = still
    ? ''
    : sad
      ? 'mascot-wobble'
      : happy
        ? 'mascot-happy-bounce'
        : mood === 'running'
          ? 'mascot-bob'
          : 'mascot-breathe';

  return (
    <div className={`relative ${className ?? ''}`}>
      <PetSceneBackdrop scene={scene} />
      {/* Explosive celebratory confetti burst */}
      {happy && (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-visible"
          aria-hidden="true"
        >
          <span className="mascot-confetti-shockwave" />
          <span className="mascot-confetti-shockwave-secondary" />
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="mascot-confetti"
              style={
                {
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${c.w}px`,
                  height: `${c.h}px`,
                  borderRadius: c.borderRadius,
                  background: c.color,
                  animationDelay: c.delay,
                  animationDuration: c.duration,
                  '--bx': c.bx,
                  '--by': c.by,
                  '--gy': c.gy,
                  '--r1': c.r1,
                  '--r2': c.r2,
                  '--r3': c.r3,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className={`mascot-art relative z-10 h-full w-full ${animationClass}`} aria-hidden="true">
        {imageFailed ? (
          <svg viewBox="0 0 120 120" className="h-full w-full">
            {HEADS[variant]}

            {/* blush */}
            <ellipse cx="37" cy="78" rx="6" ry="3.5" fill="#FCA5A5" opacity="0.55" />
            <ellipse cx="83" cy="78" rx="6" ry="3.5" fill="#FCA5A5" opacity="0.55" />

            {/* eyes */}
            {happy ? (
              <g stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none">
                <path d="M40 60 Q45 53 50 60" />
                <path d="M70 60 Q75 53 80 60" />
              </g>
            ) : sad ? (
              <g stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none">
                <path d="M40 62 Q45 68 50 62" />
                <path d="M70 62 Q75 68 80 62" />
              </g>
            ) : (
              <g className={mood === 'idle' && !still ? 'mascot-blink' : undefined}>
                {/* white sclera under the pupils (classic cute panda eyes) */}
                {variant === 'panda' && (
                  <>
                    <circle cx="45" cy="60" r="6" fill="#FFFFFF" />
                    <circle cx="75" cy="60" r="6" fill="#FFFFFF" />
                  </>
                )}
                <circle cx="45" cy="60" r="4.8" fill="#1E293B" />
                <circle cx="75" cy="60" r="4.8" fill="#1E293B" />
                <circle cx="46.6" cy="58.2" r="1.6" fill="#FFFFFF" />
                <circle cx="76.6" cy="58.2" r="1.6" fill="#FFFFFF" />
              </g>
            )}

            {/* focused eyebrows while a session is running */}
            {mood === 'running' && (
              <g stroke="#B45309" strokeWidth="3" strokeLinecap="round">
                <path d="M38 50 L50 53" />
                <path d="M82 50 L70 53" />
              </g>
            )}

            {/* tears */}
            {sad && (
              <g fill="#38BDF8">
                <path className="mascot-tear mascot-tear-left" d="M45 68 q3 5 0 9 q-3 -4 0 -9z" />
                <path className="mascot-tear mascot-tear-right" d="M75 68 q3 5 0 9 q-3 -4 0 -9z" />
              </g>
            )}

            {/* mouth */}
            <g transform={`translate(0 ${MOUTH_DY[variant] ?? 0})`}>
              {happy ? (
                <g>
                  <path d="M50 76 Q60 94 70 76 Z" fill="#1E293B" />
                  <ellipse cx="60" cy="84" rx="6" ry="3.5" fill="#F87171" />
                </g>
              ) : sad ? (
                <path
                  d="M50 86 Q60 78 70 86"
                  stroke="#1E293B"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : mood === 'running' ? (
                <path d="M54 82 L66 82" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
              ) : variant === 'cat' ? (
                /* cats get the classic tiny "w" mouth */
                <path
                  d="M54 84 Q57 87 60 84 Q63 87 66 84"
                  stroke="#1E293B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                <path d="M52 80 Q60 87 68 80" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
              )}
            </g>
          </svg>
        ) : (
          <Image
            src={`/pets/${variant}.webp`}
            alt=""
            width={1024}
            height={1024}
            sizes="100vw"
            unoptimized
            draggable={false}
            decoding="async"
            loading={still ? 'lazy' : 'eager'}
            onError={() => setImageFailed(true)}
            className={`mascot-portrait h-full w-full select-none object-contain ${sad ? 'mascot-portrait-sad' : ''}`}
          />
        )}

        {sad && !imageFailed && <span className="mascot-portrait-tear mascot-portrait-tear-left" />}
        {sad && !imageFailed && <span className="mascot-portrait-tear mascot-portrait-tear-right" />}
        {accessory && (
          <svg viewBox="0 0 120 120" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            {ACCESSORIES[accessory]}
          </svg>
        )}
      </div>

      {/* Self-contained animation styles (unique mascot-* prefix) */}
      <style>{`
        .mascot-breathe {
          animation: mascotBreathe 3.2s ease-in-out infinite;
          transform-origin: 50% 70%;
        }
        .mascot-portrait-sad { filter: saturate(0.74); }
        .mascot-portrait-tear {
          position: absolute;
          top: 53%;
          width: 5px;
          height: 8px;
          border-radius: 80% 20% 60% 50%;
          background: #38BDF8;
          box-shadow: 0 1px 2px rgba(14, 165, 233, 0.25);
          animation: mascotPortraitTear 1.1s ease-in infinite;
        }
        .mascot-portrait-tear-left { left: 34%; transform: rotate(20deg); }
        .mascot-portrait-tear-right { right: 34%; transform: rotate(-20deg); animation-delay: 0.55s; }
        @keyframes mascotPortraitTear {
          0% { opacity: 0; translate: 0 -3px; }
          18%, 72% { opacity: 1; }
          100% { opacity: 0; translate: 0 12px; }
        }
        @keyframes mascotBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        .mascot-blink {
          transform-box: fill-box;
          transform-origin: center;
          animation: mascotBlink 4s ease-in-out infinite;
        }
        @keyframes mascotBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.08); }
        }

        .mascot-bob {
          animation: mascotBob 1s ease-in-out infinite;
        }
        @keyframes mascotBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .mascot-happy-bounce {
          animation: mascotHappyBounce 0.7s ease-in-out infinite alternate;
        }
        @keyframes mascotHappyBounce {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }

        .mascot-wobble {
          animation: mascotWobble 0.5s ease-in-out infinite alternate;
        }
        @keyframes mascotWobble {
          from { transform: rotate(-3deg); }
          to { transform: rotate(3deg); }
        }

        .mascot-tear {
          transform-box: fill-box;
          transform-origin: center;
          opacity: 0;
          animation: mascotTear 1.5s ease-in infinite;
        }
        .mascot-tear-right { animation-delay: 0.75s; }
        @keyframes mascotTear {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(24px) scale(0.6); opacity: 0; }
        }

        .mascot-confetti-shockwave {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 3px solid rgba(251, 191, 36, 0.9);
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
          pointer-events: none;
          animation: mascotShockwave 0.5s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
        }

        .mascot-confetti-shockwave-secondary {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(56, 189, 248, 0.8);
          pointer-events: none;
          animation: mascotShockwave 0.42s 0.04s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
        }

        @keyframes mascotShockwave {
          0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 1;
          }
          60% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(5);
            opacity: 0;
            border-width: 1px;
          }
        }

        .mascot-confetti {
          position: absolute;
          left: 50%;
          top: 50%;
          opacity: 0;
          pointer-events: none;
          animation-name: mascotConfettiExplosion;
          animation-timing-function: cubic-bezier(0.14, 0.82, 0.3, 1);
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }

        @keyframes mascotConfettiExplosion {
          0% {
            transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(0) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
            transform: translate(-50%, -50%) translate3d(calc(var(--bx) * 0.35), calc(var(--by) * 0.35), 0) scale(1.3) rotate(var(--r1));
          }
          32% {
            opacity: 1;
            transform: translate(-50%, -50%) translate3d(var(--bx), var(--by), 0) scale(1) rotate(var(--r2));
          }
          68% {
            opacity: 1;
            transform: translate(-50%, -50%) translate3d(calc(var(--bx) * 1.06), calc(var(--by) + var(--gy) * 0.5), 0) scale(0.9) rotate(calc(var(--r2) + 90deg));
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate3d(calc(var(--bx) * 1.12), calc(var(--by) + var(--gy)), 0) scale(0.4) rotate(var(--r3));
          }
        }
      `}</style>
    </div>
  );
};

export default Mascot;
