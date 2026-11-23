'use client';
import Icon from './Icon';
import { THEME_CATALOG, type AppearanceMode, type ThemeId } from '../lib/gameState';

interface ThemeShopProps {
  coins: number;
  ownedThemes: ThemeId[];
  activeTheme: ThemeId;
  appearanceMode: AppearanceMode;
  onBuy: (id: ThemeId) => void;
  onEquip: (id: ThemeId) => void;
  onSetAppearanceMode: (mode: AppearanceMode) => void;
}

const APPEARANCE_OPTIONS: { id: AppearanceMode; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const ThemeShop = ({
  coins,
  ownedThemes,
  activeTheme,
  appearanceMode,
  onBuy,
  onEquip,
  onSetAppearanceMode,
}: ThemeShopProps) => (
  <section className="mt-3 w-full guide-panel rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 text-slate-500">
        <Icon name="palette" size={18} className="text-brand-600" />
        <h2 className="text-sm font-bold tracking-tight text-slate-800">Themes</h2>
      </div>
    </header>

    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700">Appearance</h3>
        <span className="text-[10px] font-semibold text-slate-500">
          {APPEARANCE_OPTIONS.find(option => option.id === appearanceMode)?.label}
        </span>
      </div>
      <div
        role="group"
        aria-label="Appearance mode"
        className="guide-segmented mt-2 grid grid-cols-3 gap-1 rounded-xl p-1 ring-1 ring-slate-200/70"
      >
        {APPEARANCE_OPTIONS.map(option => {
          const selected = appearanceMode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSetAppearanceMode(option.id)}
              className={`min-h-11 rounded-lg px-2 text-xs font-bold transition-colors active:scale-[0.98] ${
                selected ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>

    <ul className="mt-3 grid grid-cols-2 gap-2">
      {THEME_CATALOG.map(item => {
        const owned = ownedThemes.includes(item.id);
        const active = activeTheme === item.id;
        const affordable = coins >= item.price;
        const isStarter = item.price === 0;
        return (
          <li
            key={item.id}
            className={`guide-shop-tile relative flex flex-col rounded-xl border p-2 text-center transition-colors duration-150 ${
              active
                ? 'border-brand-300 bg-brand-50 shadow-sm'
                : 'border-slate-200 bg-white'
            }`}
          >
            {/* the swatch IS the product: a real two-stop ramp of the theme */}
            <span
              className="mx-auto block h-8 w-8 rounded-full ring-2 ring-white shadow-inner"
              style={{
                background: `linear-gradient(135deg, ${item.swatch[0]}, ${item.swatch[1]})`,
              }}
              aria-hidden
            />
            <p className="mt-1 text-[11px] font-black text-slate-700">{item.name}</p>
            <p className="flex items-center justify-center gap-0.5 text-[10px] font-bold tabular-nums text-slate-400">
              {isStarter ? (
                'Default'
              ) : (
                <>
                  <Icon name="coin" size={10} />
                  {item.price}
                </>
              )}
            </p>
            {active ? (
                <span className="mt-1.5 flex items-center justify-center gap-1 rounded-lg bg-brand-600 py-1.5 text-[10px] font-bold text-white">
                <Icon name="check" size={11} />
                Active
              </span>
            ) : owned ? (
              <button
                onClick={() => onEquip(item.id)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-brand-400 bg-white py-1 text-[10px] font-bold text-brand-600 transition-transform active:scale-95"
              >
                Apply
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
  </section>
);

export default ThemeShop;
