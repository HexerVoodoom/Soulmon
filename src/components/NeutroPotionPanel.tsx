import { useState } from 'react';
import { sm2Hint, sm2Text } from './form/FormKit';
import { ElementIcon as Icon } from './ElementBaseSlots';
import { essenceName } from '../utils/essences';
import { neutroProgresso, NEUTRO_POTION_COSTS } from '../utils/neutroPotion';
import { ELEMENTO_NEUTRO_ID } from '../utils/elementoNeutro';

/** Textos do painel (EN primeiro; PT-BR é localização). Tom calmo: a poção é rara de propósito, nada aqui cobra o jogador. */
export const NEUTRO_PANEL_COPY = {
  title: { en: 'Neutral potion', pt: 'Poção do Neutro' },
  lead: {
    en: 'The rarest potion. For each base element it asks for 100 essence or one potion, plus 50 Neutral essence. Nothing is spent until you have it all.',
    pt: 'A poção mais rara. De cada elemento base pede 100 essências ou uma poção, mais 50 essências do Neutro. Nada é gasto antes de ter tudo.',
  },
  bases: { en: (n: number, t: number) => `${n} of ${t} bases complete`, pt: (n: number, t: number) => `${n} de ${t} bases completas` },
  neutro: { en: (n: number, t: number) => `Neutral ${Math.min(n, t)}/${t}`, pt: (n: number, t: number) => `Neutro ${Math.min(n, t)}/${t}` },
  viaPotion: { en: 'potion', pt: 'poção' },
  seeMissing: { en: 'See what is missing', pt: 'Ver o que falta' },
  hideMissing: { en: 'Hide', pt: 'Esconder' },
  create: { en: 'Create', pt: 'Criar' },
  notYet: { en: 'Not enough yet. Keep collecting; it will be here when you are ready.', pt: 'Ainda falta um pouco. Siga coletando; ela espera por você.' },
  locked: { en: 'Meet the Neutral element first.', pt: 'Conheça o elemento Neutro primeiro.' },
} as const;

/** A receita do Neutro navegável (16/11/2026): "x de 20 bases completas" + "Neutro x/50"; a lista só do que FALTA abre sob demanda. Regra em `utils/neutroPotion.ts`. */
export function NeutroPotionPanel({ essences, inventory, isPt, unlocked, onCreate }: {
  essences: Record<string, number> | undefined; inventory?: Record<string, number>; isPt: boolean; unlocked: boolean; onCreate: () => void;
}) {
  const C = NEUTRO_PANEL_COPY;
  const [open, setOpen] = useState(false);
  const p = neutroProgresso(essences, inventory);
  const can = p.completo && unlocked;
  const faltam = p.bases.filter(b => !b.ok);
  return (
    <section data-neutro-potion data-complete={p.completo ? 'true' : 'false'} aria-label={isPt ? C.title.pt : C.title.en} className="sm2-pocao-item">
      <div className="sm2-pocao-head">
        <Icon id={ELEMENTO_NEUTRO_ID} size={32} />
        <strong style={{ ...sm2Text, flex: 1, minWidth: 0 }}>{isPt ? C.title.pt : C.title.en}</strong>
        <button type="button" data-potion-create={ELEMENTO_NEUTRO_ID} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary" disabled={!can}
          aria-describedby={can ? undefined : 'sm2-neutro-nota'} onClick={onCreate}>{isPt ? C.create.pt : C.create.en}</button>
      </div>
      <p style={sm2Hint}>{isPt ? C.lead.pt : C.lead.en}</p>
      <p data-neutro-bases role="status" style={{ ...sm2Text, margin: 0 }}>{isPt ? C.bases.pt(p.basesFeitas, p.basesTotal) : C.bases.en(p.basesFeitas, p.basesTotal)}</p>
      <p data-neutro-neutro style={{ ...sm2Text, margin: 0 }}>{isPt ? C.neutro.pt(p.neutro, p.neutroNeed) : C.neutro.en(p.neutro, p.neutroNeed)}</p>
      {!can && <p id="sm2-neutro-nota" data-neutro-nota style={sm2Hint}>{unlocked ? (isPt ? C.notYet.pt : C.notYet.en) : (isPt ? C.locked.pt : C.locked.en)}</p>}
      {(faltam.length > 0 || p.neutro < p.neutroNeed) && (
        <button type="button" data-neutro-ver aria-expanded={open} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" style={{ marginTop: 6 }} onClick={() => setOpen(o => !o)}>
          {open ? (isPt ? C.hideMissing.pt : C.hideMissing.en) : (isPt ? C.seeMissing.pt : C.seeMissing.en)}
        </button>
      )}
      {open && (
        <ul data-neutro-faltam style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 4 }}>
          {faltam.map(b => (
            <li key={b.id} data-neutro-falta={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, ...sm2Text }}>
              <Icon id={b.id} size={24} /><span style={{ flex: 1 }}>{essenceName(b.id, isPt)}</span><span className="sm2-num">{b.essencia}/{NEUTRO_POTION_COSTS.eachBase}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
