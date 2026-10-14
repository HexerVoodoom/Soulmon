import { useEffect } from 'react';
import { areaLabel, type AreaId } from '../navigation';
import { buildingIntroView } from '../utils/buildingIntroCopy';
import type { BuildingId } from '../utils/gates';
import type { Language } from '../utils/i18n';

/** Quanto o balão fica na tela sozinho. */
export const UNLOCK_TOAST_MS = 6000;

/**
 * O texto do balão (14/10/2026, dono): um prédio = "<Prédio> desbloqueado no <local>"; vários do MESMO level-up = um
 * balão só, "N lugares novos no Mapa: A, B, C". Puro.
 */
export function unlockToastText(ids: readonly BuildingId[], language: Language): string {
  const isPt = language === 'pt-BR';
  if (ids.length === 0) return '';
  const nome = (id: BuildingId) => buildingIntroView(id, language).place;
  if (ids.length === 1) {
    const area = ids[0].split('.')[0] as AreaId;
    const local = areaLabel(area, isPt);
    return isPt ? `${nome(ids[0])} desbloqueado em ${local}` : `${nome(ids[0])} unlocked in ${local}`;
  }
  const lista = ids.map(nome).join(', ');
  return isPt ? `${ids.length} lugares novos no Mapa: ${lista}` : `${ids.length} new places on the Map: ${lista}`;
}

/**
 * BALÃOZINHO "prédio desbloqueado": NÃO é modal (sem foco, sem véu, sem trava de fundo). Some sozinho em 6 s ou ao toque.
 * A apresentação com o NPC só vem na PRIMEIRA entrada no prédio (`BuildingIntro`). Muda e sem recompensa (R-NOVA).
 */
export function UnlockToast({ ids, language, onDone }: { ids: readonly BuildingId[]; language: Language; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, UNLOCK_TOAST_MS);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <button
      type="button"
      role="status"
      data-unlock-toast
      onClick={onDone}
      style={{
        position: 'fixed', zIndex: 150, left: '50%', transform: 'translateX(-50%)',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)', maxWidth: 'min(92vw, 420px)', minHeight: 44,
        padding: '10px 16px', boxSizing: 'border-box', cursor: 'pointer',
        background: 'rgba(15,42,41,.96)', color: '#E9F5F2',
        border: '2px solid var(--sm2-gold-fill)', borderRadius: 16,
        boxShadow: '0 6px 18px rgba(0,0,0,.45)',
        font: '500 14px/1.35 var(--sm2-font-text)', textAlign: 'center',
      }}
    >
      {unlockToastText(ids, language)}
    </button>
  );
}
