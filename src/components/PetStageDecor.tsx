import { ALL_SHOP_ITEMS } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { DECOR_SLOTS, SLOT_ORDER, decorFitsSetting, slotBoxStyle, type SlotId } from '../utils/petStage';

// ─────────────────────────────────────────────────────────────────────────────
// A decoração do palco (utils/petStage.ts) desenhada dentro da área do pet.
//
// Regras que este componente respeita e que NÃO devem ser afrouxadas:
//   · Espaço vazio é vazio — nada de contorno tracejado ou "+" convidando a
//     comprar. Quem não decorou vê o cenário limpo.
//   · Um item por espaço, na caixa em px que o slot declara. A arte é feita
//     PARA a caixa; aqui ela só é posicionada.
//   · Nada aparece em cenário incompatível (sofá na neve, qualquer coisa num
//     cenário abstrato). A loja avisa isso na hora de equipar — o item não
//     some em silêncio.
//   · Tudo fica ATRÁS do pet: é cenário, o pet anda na frente.
//
// A arte de verdade ainda não existe (os itens são emoji). Enquanto isso, o
// emoji é escalado para a caixa do slot, com sombra de contato no chão para não
// parecer colado por cima da imagem.
// ─────────────────────────────────────────────────────────────────────────────

interface PetStageDecorProps {
  equippedDecor: Partial<Record<SlotId, string>>;
  equippedBackground: string | null;
  /** Troféus REAIS de season — a vitrine exibe estes, não enfeite genérico. */
  trophies: Array<{ season: string; place: 1 | 2 | 3 }>;
  language: string;
}

const PLACE_MEDAL: Record<1 | 2 | 3, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function PetStageDecor({ equippedDecor, equippedBackground, trophies, language }: PetStageDecorProps) {
  const bg = equippedBackground ? PET_BACKGROUNDS[equippedBackground] : null;
  // Sem cenário equipado o box é transparente — o "palco" é a página, e não há
  // composição em que apoiar a decoração.
  if (!bg) return null;

  const isPt = language === 'pt-BR';

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
      {SLOT_ORDER.map(slotId => {
        const itemId = equippedDecor[slotId];
        if (!itemId) return null;                       // espaço vazio: vazio mesmo
        if (!bg.slots.includes(slotId)) return null;    // cenário não oferece o espaço
        const item = ALL_SHOP_ITEMS.find(i => i.id === itemId && i.kind === 'furniture');
        if (!item) return null;
        if (!decorFitsSetting(item.fits ?? 'any', bg.setting)) return null;

        const slot = DECOR_SLOTS[slotId];
        const box = slotBoxStyle(slot);
        const label = isPt ? item.namePt : item.nameEn;

        // Tapete: a caixa é larga e baixa, então o emoji não serve de arte —
        // vira uma elipse em perspectiva com o motivo repetido por cima.
        if (slot.anchor === 'ground-flat') {
          return (
            <div key={slotId} style={{ ...box }} title={label}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: 'radial-gradient(closest-side, rgba(60,45,40,0.30), rgba(60,45,40,0.12))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 9, lineHeight: 1, opacity: 0.95,
              }}>
                <span>{item.icon}</span><span>{item.icon}</span><span>{item.icon}</span>
              </div>
            </div>
          );
        }

        const art = Math.round(Math.min(slot.w, slot.h) * 0.78);
        return (
          <div key={slotId} style={{ ...box, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} title={label}>
            {/* Sombra de contato — só para o que está apoiado no chão. */}
            {slot.anchor === 'ground' && (
              <span style={{
                position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                width: Math.round(slot.w * 0.8), height: 7, borderRadius: '50%',
                background: 'rgba(0,0,0,0.28)', filter: 'blur(2px)',
              }} />
            )}
            <span style={{
              position: 'relative', fontSize: art, lineHeight: 1,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
            }}>
              {item.icon}
            </span>

            {/* A vitrine exibe as conquistas REAIS: até 3 medalhas de season
                sobre o móvel. Sem troféus ganhos, só o móvel — a vitrine vazia
                é a verdade, não uma falha. */}
            {slotId === 'trophy' && trophies.length > 0 && (
              <span style={{
                position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 1, fontSize: 13, lineHeight: 1,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
              }}>
                {trophies.slice(-3).map((t, i) => (
                  <span key={`${t.season}-${i}`}>{PLACE_MEDAL[t.place]}</span>
                ))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
