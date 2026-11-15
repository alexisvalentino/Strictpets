'use client';
import Icon from './Icon';
import { THEME_CATALOG, type ThemeId } from '../lib/gameState';

interface ThemeShopProps {
  coins: number;
  ownedThemes: ThemeId[];
  activeTheme: ThemeId;
  onBuy: (id: ThemeId) => void;
  onEquip: (id: ThemeId) => void;
}

const ThemeShop = ({
  coins,
  ownedThemes,
  activeTheme,
  onBuy,
  onEquip,
}: ThemeShopProps) => (
  <section className="mt-3 w-full rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm">
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 text-slate-500">
        <Icon name="palette" size={16} plate />
        <h2 className="text-[11px] font-black uppercase tracking-widest">Themes</h2>
      </div>
      <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black tabular-nums text-brand-600">
        <Icon name="coin" size={11} />
        {coins}
      </span>
    </header>

    <ul className="mt-3 grid grid-cols-2 gap-2">
      {THEME_CATALOG.map(item => {
        const owned = ownedThemes.includes(item.id);
        const active = activeTheme === item.id;
        const affordable = coins >= item.price;
        const isStarter = item.price === 0;
        return (
          <li
            key={item.id}
            className={`relative flex flex-col rounded-xl border p-2 text-center transition-all duration-150 ${
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
              <span className="mt-1.5 flex items-center justify-center gap-1 rounded-lg bg-brand-600 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">
                <Icon name="check" size={11} />
                Active
              </span>
            ) : owned ? (
              <button
                onClick={() => onEquip(item.id)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-brand-400 bg-white py-1 text-[10px] font-black uppercase tracking-wide text-brand-600 transition-transform active:scale-95"
              >
                Apply
              </button>
            ) : (
              <button
                onClick={() => onBuy(item.id)}
                disabled={!affordable}
                className={`mt-1.5 min-h-11 w-full rounded-lg py-1 text-[10px] font-black uppercase tracking-wide transition-transform active:scale-95 ${
                  affordable
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-500/30'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
                }`}
              >
                Buy {item.price}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  </section>
);

export default ThemeShop;
