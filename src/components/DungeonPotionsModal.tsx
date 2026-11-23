import { useState } from 'react';
import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import { rewardItemIconSync } from '../utils/rewardIcons';
import { SPECIAL_ITEMS } from '../utils/shop';
import { HEAL_POTIONS, type PotionStock } from '../utils/dungeonPotions';
import type { Language } from '../utils/i18n';

/**
 * 🧪 "Quantas poções deixar com o Soulmon?" (08/11/2026). Aparece ao SAIR da masmorra com a descida ainda viva. Mostra cada tipo de
 * poção de cura que o jogador tem (já deixadas + no inventário), de 0 até todas (ex.: 20 de 20). O Soulmon usa as deixadas sozinho nas
 * quedas; o que sobrar volta quando a descida acabar. `owned` = o total por tipo (inventário + estoque já deixado).
 */
export function DungeonPotionsModal({ owned, initial, language, onConfirm }: {
  owned: PotionStock; initial: PotionStock; language: Language; onConfirm: (wanted: PotionStock) => void;
}) {
  const isPt = language === 'pt-BR';
  const tipos = HEAL_POTIONS.filter(k => (owned[k] ?? 0) > 0);
  const [qty, setQty] = useState<PotionStock>(() => Object.fromEntries(tipos.map(k => [k, Math.min(owned[k] ?? 0, initial[k] ?? owned[k] ?? 0)])));
  const set = (k: string, n: number) => setQty(q => ({ ...q, [k]: Math.max(0, Math.min(owned[k] ?? 0, n)) }));
  return (
    <ModalSheet
      open
      placement="center" titulo="inline"
      onClose={() => onConfirm(qty)}
      language={language}
      title={isPt ? 'Poções para o Soulmon' : 'Potions for your Soulmon'}
      maxWidth={380}
      footer={<button type="button" onClick={() => onConfirm(qty)} style={{ ...sm2Button('primary'), width: '100%' }} data-dungeon-potions-ok>{isPt ? 'Deixar e sair' : 'Leave them and exit'}</button>}
    >
      <div data-dungeon-potions-modal>
        <p style={{ ...sm2Text, margin: '0 0 10px' }}>
          {isPt ? 'Ele segue descendo sozinho e usa estas poções quando cair. O que sobrar volta para você quando a descida acabar.' : 'He keeps descending on his own and uses these potions when he falls. Whatever is left comes back to you when the descent ends.'}
        </p>
        {tipos.map(k => {
          const item = SPECIAL_ITEMS[k];
          const nome = item ? (isPt ? item.namePt : item.nameEn) : k;
          const art = k === HEAL_POTIONS[0] ? rewardItemIconSync('heart') : null;
          const n = qty[k] ?? 0;
          const max = owned[k] ?? 0;
          return (
            <div key={k} data-dungeon-potion-row={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {art ? <img src={art} alt="" width={28} height={28} /> : <span aria-hidden>{k}</span>}
              <span style={{ ...sm2Text, flex: 1, minWidth: 0 }}>{nome} <span data-dungeon-potion-count>{n} / {max}</span></span>
              <button type="button" aria-label={isPt ? 'Menos' : 'Less'} onClick={() => set(k, n - 1)} disabled={n <= 0} style={{ ...sm2Button('outline'), minWidth: 40 }}>−</button>
              <button type="button" aria-label={isPt ? 'Mais' : 'More'} onClick={() => set(k, n + 1)} disabled={n >= max} style={{ ...sm2Button('outline'), minWidth: 40 }}>+</button>
              <button type="button" data-dungeon-potion-all onClick={() => set(k, max)} disabled={n >= max} style={{ ...sm2Button('outline') }}>{isPt ? 'Todas' : 'All'}</button>
            </div>
          );
        })}
      </div>
    </ModalSheet>
  );
}
