'use client';
import Icon from './Icon';
import { ACCESSORY_CATALOG, type AccessoryId } from '../lib/gameState';

// Accessory product art. These are shop products, not icons: each is a filled
// illustration on its own 32x32 grid with a darker edge and a light catch, so
// it reads as an object at 30px instead of a flat silhouette. Emoji was doing
// this job before; these are drawn here so they keep real colours instead of
// inheriting the surrounding text like a glyph would.
const ART: Record<AccessoryId, JSX.Element> = {
  flower: (
    <>
      <path
        d="M16 29c0-6 .5-9 1.5-11"
        stroke="hsl(145 55% 42%)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M17 22c3.5 0 6-2 6.5-5-3.5-.4-6 1.6-6.5 5Z"
        fill="hsl(145 55% 52%)"
      />
      <g fill="hsl(347 83% 68%)">
        <ellipse cx="16" cy="7.5" rx="4" ry="5" />
        <ellipse cx="16" cy="20.5" rx="4" ry="5" />
        <ellipse cx="9.5" cy="14" rx="5" ry="4" />
        <ellipse cx="22.5" cy="14" rx="5" ry="4" />
        <ellipse cx="16" cy="7.5" rx="4" ry="5" fill="#fff" opacity="0.22" />
        <ellipse cx="22.5" cy="14" rx="5" ry="4" fill="#fff" opacity="0.14" />
      </g>
      <circle cx="16" cy="14" r="4.2" fill="#FBBF24" />
      <circle cx="16" cy="14" r="2.1" fill="#FDE68A" />
    </>
  ),
  scarf: (
    <>
      <path d="M5 9 Q16 15 27 9 L24 17 Q16 21 8 17 Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 12 Q16 16 23 12" fill="none" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 17 L16 29 L21 17 Z" fill="#0EA5E9" stroke="#0284C7" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M15 20 L16 25 L17 20" fill="none" stroke="#BAE6FD" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  'party-hat': (
    <>
      <path d="M16 5.5 25 25H7L16 5.5Z" fill="hsl(268 62% 58%)" />
      <path d="M16 5.5 20.6 15h-9.2L16 5.5Z" fill="#fff" opacity="0.2" />
      <path
        d="M11.2 17.6h9.6M9 22.6h14"
        stroke="#fff"
        strokeWidth="1.8"
        opacity="0.65"
        strokeLinecap="round"
      />
      <circle cx="16" cy="4.6" r="2.6" fill="#FBBF24" />
      <circle cx="15.2" cy="3.9" r="1" fill="#FEF3C7" />
    </>
  ),
  halo: (
    <>
      <ellipse cx="16" cy="17" rx="10" ry="4" fill="none" stroke="#7DD3FC" strokeWidth="4" opacity="0.35" />
      <ellipse cx="16" cy="17" rx="10" ry="4" fill="none" stroke="#38BDF8" strokeWidth="2" />
      <path d="M8.5 15.2 Q16 12.6 23.5 15.2" fill="none" stroke="#E0F2FE" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4.5 8.5 6 5.5 7.5 8.5 10.5 10 7.5 11.5 6 14.5 4.5 11.5 1.5 10 Z" fill="#FBBF24" />
      <path d="M25.5 7 26.7 4.6 27.9 7 30.3 8.2 27.9 9.4 26.7 11.8 25.5 9.4 23.1 8.2 Z" fill="#FBBF24" />
    </>
  ),
  sunglasses: (
    <>
      <path
        d="M2.6 11h6.8l1.2 5a3.6 3.6 0 0 1-7.2 0L2.6 11ZM29.4 11h-6.8l-1.2 5a3.6 3.6 0 0 0 7.2 0l.8-5Z"
        fill="hsl(222 47% 25%)"
      />
      <path
        d="M9.4 12.6h13.2"
        stroke="hsl(222 32% 40%)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M2.6 8.8 3.9 11M29.4 8.8 28.1 11"
        stroke="hsl(222 32% 40%)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M4.6 12.6h3.4l.5 2.2" stroke="#fff" strokeWidth="1.2" opacity="0.4" fill="none" />
    </>
  ),
  crown: (
    <>
      <path
        d="M4 23 2.4 9.4l7 5.6L16 5l6.6 10 7-5.6L28 23H4Z"
        fill="hsl(45 93% 52%)"
      />
      <path d="M4 23 2.4 9.4l7 5.6L16 5l6.6 10 7-5.6L28 23H4Z" fill="#fff" opacity="0.12" />
      <path d="M4.6 25.6h22.8" stroke="hsl(38 92% 42%)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="5" r="2.2" fill="#DC2626" />
      <circle cx="4.6" cy="10" r="1.6" fill="#38BDF8" />
      <circle cx="27.4" cy="10" r="1.6" fill="#38BDF8" />
      <circle cx="16" cy="18" r="2" fill="#DC2626" opacity="0.9" />
    </>
  ),
};

interface AccessoryShopProps {
  coins: number;
  ownedAccessories: AccessoryId[];
  equippedAccessory: AccessoryId | null;
  onBuy: (id: AccessoryId) => void;
  onEquip: (id: AccessoryId | null) => void;
}

const AccessoryShop = ({
  coins,
  ownedAccessories,
  equippedAccessory,
  onBuy,
  onEquip,
}: AccessoryShopProps) => (
  <section className="mt-3 w-full guide-panel rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 text-slate-500">
        <Icon name="ribbon" size={18} className="text-brand-600" />
        <h2 className="text-sm font-bold tracking-tight text-slate-800">
          Accessories
        </h2>
      </div>
    </header>

    {/* Three columns shorten the shop while keeping each action thumb-sized. */}
    <ul className="mt-3 grid grid-cols-3 gap-2">
      {ACCESSORY_CATALOG.map(item => {
        const owned = ownedAccessories.includes(item.id);
        const active = equippedAccessory === item.id;
        const affordable = coins >= item.price;
        return (
          <li
            key={item.id}
            className={`guide-shop-tile relative flex flex-col rounded-xl border p-2 text-center transition-colors duration-150 ${
              active
                ? 'border-brand-300 bg-brand-50 shadow-sm'
                : 'border-slate-200 bg-white'
            }`}
          >
            <span className="mx-auto" aria-hidden>
              <svg viewBox="0 0 32 32" width={32} height={32} fill="none">
                {ART[item.id]}
              </svg>
            </span>
            <p className="mt-1 text-[11px] font-black text-slate-700">{item.name}</p>
            <p className="flex items-center justify-center gap-0.5 text-[10px] font-bold tabular-nums text-slate-400">
              <Icon name="coin" size={10} />
              {item.price}
            </p>
            {active ? (
                <span className="mt-1.5 flex items-center justify-center gap-1 rounded-lg bg-brand-600 py-1.5 text-[10px] font-bold text-white">
                <Icon name="check" size={11} />
                Worn
              </span>
            ) : owned ? (
              <button
                onClick={() => onEquip(item.id)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-brand-400 bg-white py-1 text-[10px] font-bold text-brand-600 transition-transform active:scale-95"
              >
                Wear
              </button>
            ) : (
              <button
                onClick={() => onBuy(item.id)}
                disabled={!affordable}
                className={`mt-1.5 min-h-11 w-full rounded-lg py-1 text-[10px] font-bold transition-transform active:scale-95 ${
                  affordable
                    ? 'bg-gradient-to-r from-amber-800 to-amber-700 text-white shadow-sm shadow-amber-700/30'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
                }`}
              >
                Unlock
              </button>
            )}
          </li>
        );
      })}
    </ul>

    {equippedAccessory && (
      <button
        type="button"
        onClick={() => onEquip(null)}
        aria-label="Remove equipped accessory"
        className="accessory-remove-button mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98]"
      >
        <Icon name="close" size={14} className="text-slate-500" />
        Remove accessory
      </button>
    )}
  </section>
);

export default AccessoryShop;
