import type { CSSProperties } from 'react';
import { PET_SCENE_CATALOG, type PetSceneId } from '../lib/gameState';

const PetSceneBackdrop = ({ scene }: { scene: PetSceneId }) => {
  if (scene === 'classic') return null;
  const item = PET_SCENE_CATALOG.find(candidate => candidate.id === scene) ?? PET_SCENE_CATALOG[0];
  const style = {
    background: `radial-gradient(circle at 50% 42%, ${item.detail} 0 13%, transparent 48%), linear-gradient(145deg, ${item.background}, ${item.base})`,
    '--scene-base': item.base,
    '--scene-accent': item.accent,
    '--scene-detail': item.detail,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className="pet-scene-backdrop pointer-events-none absolute inset-[4%] z-0 overflow-hidden rounded-[42%] transition-[background] duration-300 motion-reduce:transition-none"
      style={style}
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" fill="none">
        {item.motif === 'clouds' && (
          <>
            <path d="M0 91c19-10 31-11 48-3 18 8 35 9 72-3v35H0z" fill="var(--scene-base)" opacity=".72" />
            <path d="M4 33c0-5 4-9 9-9 2-6 12-7 15 0 5 0 8 4 8 9H4zm76 8c0-4 3-7 8-7 2-5 10-6 12 0 4 0 7 3 7 7H80z" fill="var(--scene-detail)" opacity=".88" />
            <circle cx="17" cy="70" r="2" fill="var(--scene-accent)" opacity=".72" />
            <circle cx="102" cy="65" r="2.5" fill="var(--scene-accent)" opacity=".66" />
          </>
        )}
        {item.motif === 'meadow' && (
          <>
            <path d="M0 91c22-21 40-16 61-2 18-14 36-18 59-4v35H0z" fill="var(--scene-base)" opacity=".78" />
            <path d="M8 95c13-14 27-16 40-11m28 7c11-11 22-14 35-10" stroke="var(--scene-detail)" strokeWidth="3" strokeLinecap="round" opacity=".85" />
            <circle cx="19" cy="70" r="2.5" fill="var(--scene-accent)" />
            <circle cx="23" cy="66" r="2" fill="var(--scene-detail)" />
            <circle cx="98" cy="72" r="2.5" fill="var(--scene-accent)" />
            <circle cx="94" cy="68" r="2" fill="var(--scene-detail)" />
          </>
        )}
        {item.motif === 'moon' && (
          <>
            <circle cx="95" cy="25" r="10" fill="var(--scene-detail)" opacity=".92" />
            <circle cx="100" cy="21" r="9" fill={item.background} />
            <path d="m26 28 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5zm39 17 1.5 3.5 3.5 1.5-3.5 1.5L65 55l-1.5-3.5L60 50l3.5-1.5L65 45z" fill="var(--scene-detail)" opacity=".92" />
            <circle cx="20" cy="55" r="1.7" fill="var(--scene-accent)" />
            <circle cx="83" cy="63" r="1.7" fill="var(--scene-accent)" />
          </>
        )}
        {item.motif === 'ocean' && (
          <>
            <path d="M0 88c17-9 28-9 44 0 17 9 31 9 46 0 11-6 20-7 30-2v34H0z" fill="var(--scene-base)" opacity=".72" />
            <path d="M0 99c17-9 28-9 44 0 17 9 31 9 46 0 11-6 20-7 30-2" stroke="var(--scene-detail)" strokeWidth="3" strokeLinecap="round" opacity=".9" />
            <circle cx="19" cy="54" r="3" stroke="var(--scene-accent)" strokeWidth="2" opacity=".8" />
            <circle cx="101" cy="67" r="2" fill="var(--scene-detail)" opacity=".9" />
            <circle cx="92" cy="57" r="1.5" fill="var(--scene-accent)" />
          </>
        )}
        {item.motif === 'blossoms' && (
          <>
            <path d="M6 95c13-12 17-24 15-38m-12 23 12-8m-9-9-8-5M114 94c-13-12-17-24-15-38m12 23-12-8m9-9 8-5" stroke="var(--scene-accent)" strokeWidth="2" strokeLinecap="round" opacity=".75" />
            <g fill="var(--scene-detail)" opacity=".95">
              <circle cx="18" cy="54" r="3" /><circle cx="14" cy="54" r="2.5" /><circle cx="22" cy="54" r="2.5" /><circle cx="18" cy="50" r="2.5" /><circle cx="18" cy="58" r="2.5" />
              <circle cx="101" cy="53" r="3" /><circle cx="97" cy="53" r="2.5" /><circle cx="105" cy="53" r="2.5" /><circle cx="101" cy="49" r="2.5" /><circle cx="101" cy="57" r="2.5" />
            </g>
            <circle cx="18" cy="54" r="1.5" fill="var(--scene-accent)" />
            <circle cx="101" cy="53" r="1.5" fill="var(--scene-accent)" />
          </>
        )}
      </svg>
    </div>
  );
};

export default PetSceneBackdrop;
