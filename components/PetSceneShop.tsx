'use client';
import { useState } from 'react';
import Icon from './Icon';
import Mascot from './Mascot';
import {
  PET_SCENE_CATALOG,
  featuredPetScenes,
  type AccessoryId,
  type MascotId,
  type PetSceneDefinition,
  type PetSceneId,
} from '../lib/gameState';

interface PetSceneShopProps {
  coins: number;
  activeMascot: MascotId;
  equippedAccessory: AccessoryId | null;
  ownedPetScenes: PetSceneId[];
  equippedPetScene: PetSceneId;
  onBuy: (id: PetSceneId) => void;
  onEquip: (id: PetSceneId) => void;
}

const SceneTile = ({
  scene,
  coins,
  activeMascot,
  equippedAccessory,
  owned,
  active,
  featured,
  onBuy,
  onEquip,
}: {
  scene: PetSceneDefinition;
  coins: number;
  activeMascot: MascotId;
  equippedAccessory: AccessoryId | null;
  owned: boolean;
  active: boolean;
  featured: boolean;
  onBuy: (id: PetSceneId) => void;
  onEquip: (id: PetSceneId) => void;
}) => {
  const [paletteName, ...motifParts] = scene.name.split(' ');
  const motifName = motifParts.join(' ');
  const price = featured ? Math.round(scene.price * 0.75) : scene.price;
  const affordable = coins >= price;

  return (
    <li
      className={`guide-shop-tile flex min-w-0 flex-col rounded-xl border p-2 text-center transition-[border-color,background-color,box-shadow,transform] duration-200 ${
        active
          ? 'border-brand-300 bg-brand-50 shadow-sm'
          : 'border-slate-200/80 bg-white'
      }`}
    >
      <Mascot
        mood="idle"
        variant={activeMascot}
        accessory={equippedAccessory}
        scene={scene.id}
        still
        className="mx-auto mt-0.5 h-14 w-14"
      />
      <p aria-label={scene.name} className="mt-1 min-h-7 text-[10px] font-bold leading-3 text-slate-500">
        <span className="block">{paletteName}</span>
        <span className="block font-black text-slate-800">{motifName}</span>
      </p>
      {owned ? (
        <p className="mt-0.5 min-h-4 text-[10px] font-bold text-slate-500">
          {active ? 'In use' : 'Owned'}
        </p>
      ) : (
        <p
          className="mt-0.5 flex min-h-4 items-center justify-center gap-1 text-[10px] font-bold tabular-nums text-slate-500"
          aria-label={`${price} coins${featured ? `, featured price, regular price ${scene.price}` : ''}`}
        >
          <Icon name="coin" size={10} />
          {price}
          {featured && <span className="text-[9px] text-slate-400 line-through">{scene.price}</span>}
        </p>
      )}
      {active ? (
        <span className="mt-1.5 flex min-h-11 items-center justify-center gap-1 rounded-lg bg-brand-600 px-1 text-[10px] font-bold text-white">
          <Icon name="check" size={11} />
          Worn
        </span>
      ) : owned ? (
        <button
          type="button"
          onClick={() => onEquip(scene.id)}
          aria-label={`Use ${scene.name} pet scene`}
          className="pet-scene-action mt-1.5 min-h-11 w-full rounded-lg border border-brand-300 bg-white px-1 text-[10px] font-bold text-brand-700 transition-transform hover:bg-brand-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Use
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onBuy(scene.id)}
          disabled={!affordable}
          aria-label={
            affordable
              ? `Unlock ${scene.name} for ${price} coins`
              : `${scene.name} costs ${price} coins; you have ${coins}`
          }
          className={`mt-1.5 min-h-11 w-full rounded-lg px-1 text-[10px] font-bold transition-[transform,background-color,box-shadow] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
            affordable
              ? 'bg-gradient-to-r from-brand-700 to-sky-600 text-white shadow-sm shadow-brand-700/15 hover:shadow-md'
              : 'pet-scene-disabled cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
          }`}
        >
          Unlock
        </button>
      )}
    </li>
  );
};

const PetSceneShop = ({
  coins,
  activeMascot,
  equippedAccessory,
  ownedPetScenes,
  equippedPetScene,
  onBuy,
  onEquip,
}: PetSceneShopProps) => {
  const [showAll, setShowAll] = useState(false);
  const paidScenes = PET_SCENE_CATALOG.filter(scene => scene.price > 0);
  const featuredIds = new Set(featuredPetScenes().map(scene => scene.id));
  const scenes = showAll ? PET_SCENE_CATALOG : featuredPetScenes();
  const owned = new Set(ownedPetScenes);
  const paidOwnedCount = paidScenes.filter(scene => owned.has(scene.id)).length;

  return (
    <section className="guide-panel mt-3 w-full rounded-2xl border border-white/80 p-3.5 text-left shadow-sm sm:p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5 text-slate-500">
          <Icon name="sparkle" size={18} className="shrink-0 text-brand-600" />
          <h2 className="truncate text-sm font-bold tracking-tight text-slate-800">Pet scenes</h2>
        </div>
        <span className="shrink-0 rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold text-brand-700">
          {showAll ? `${paidOwnedCount}/${paidScenes.length} owned` : 'Weekly picks · 25% off'}
        </span>
      </header>

      <ul className={`mt-3 grid grid-cols-3 gap-2 ${showAll ? 'sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6' : ''}`}>
        {scenes.map(scene => (
          <SceneTile
            key={scene.id}
            scene={scene}
            coins={coins}
            activeMascot={activeMascot}
            equippedAccessory={equippedAccessory}
            owned={owned.has(scene.id)}
            active={equippedPetScene === scene.id}
            featured={featuredIds.has(scene.id)}
            onBuy={onBuy}
            onEquip={onEquip}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setShowAll(value => !value)}
        aria-expanded={showAll}
        className="pet-scene-toggle mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-bold text-slate-600 transition-[background-color,color,transform] hover:bg-white active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 motion-reduce:transition-none"
      >
        <Icon name={showAll ? 'chevronDown' : 'chevronRight'} size={13} />
        {showAll ? 'Show weekly picks' : `Browse all ${paidScenes.length}`}
      </button>
    </section>
  );
};

export default PetSceneShop;
