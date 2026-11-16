import { useState } from 'react';
import { sm2Hint, sm2Text } from './form/FormKit';
import { ElementIcon as Icon } from './ElementBaseSlots';
import { essenceName } from '../utils/essences';
import { neutroProgresso, NEUTRO_GRUPOS, NEUTRO_TOTAL, type NeutroGrupo } from '../utils/neutroPotion';
import { ELEMENTO_NEUTRO_ID } from '../utils/elementoNeutro';

const PAGE = 20;

/** Textos do painel (EN primeiro; PT-BR é localização). Tom calmo: a poção é rara de propósito, nada aqui cobra o jogador. */
export const NEUTRO_PANEL_COPY = {
  title: { en: 'Neutral potion', pt: 'Poção do Neutro' },
  lead: {
    en: 'The rarest potion. It asks for 100 essence of every base element and 50 essence of every compound element. Nothing is spent until you have them all.',
    pt: 'A poção mais rara. Pede 100 essências de cada elemento base e 50 essências de cada elemento composto. Nada é gasto antes de ter tudo.',
  },
  complete: { en: (n: number, t: number) => `${n} of ${t} complete`, pt: (n: number, t: number) => `${n} de ${t} completos` },
  grupo: {
    base: { en: 'Base elements', pt: 'Elementos base' },
    par: { en: 'Pairs', pt: 'Pares' },
    trio: { en: 'Trios', pt: 'Trios' },
    quad: { en: 'Quads', pt: 'Quádruplos' },
  } as Record<NeutroGrupo, { en: string; pt: string }>,
  each: { en: (n: number) => `${n} each`, pt: (n: number) => `${n} de cada` },
  seeMissing: { en: 'See what is missing', pt: 'Ver o que falta' },
  hideMissing: { en: 'Hide', pt: 'Esconder' },
  more: { en: 'Show more', pt: 'Mostrar mais' },
  create: { en: 'Create', pt: 'Criar' },
  notYet: { en: 'Not enough essences yet. Keep collecting; it will be here when you are ready.', pt: 'Ainda faltam essências. Siga coletando; ela espera por você.' },
  locked: { en: 'Meet the Neutral element first.', pt: 'Conheça o elemento Neutro primeiro.' },
} as const;

/**
 * A receita do Neutro NAVEGÁVEL (16/11/2026): agrupada por tipo com "x de 269 completos" e, por grupo, a lista só do que FALTA (paginada),
 * em vez de 269 linhas soltas. A regra e o custo moram em `utils/neutroPotion.ts`.
 */
export function NeutroPotionPanel({ essences, isPt, unlocked, onCreate }: {
  essences: Record<string, number> | undefined; isPt: boolean; unlocked: boolean; onCreate: () => void;
}) {
  const C = NEUTRO_PANEL_COPY;
  const [open, setOpen] = useState<NeutroGrupo | null>(null);
  const [shown, setShown] = useState(PAGE);
  const prog = neutroProgresso(essences);
  const pick = (g: NeutroGrupo) => { setOpen(o => (o === g ? null : g)); setShown(PAGE); };
  const can = prog.completo && unlocked;
  return (
    <section data-neutro-potion data-complete={prog.completo ? 'true' : 'false'} aria-label={isPt ? C.title.pt : C.title.en} className="sm2-pocao-item">
      <div className="sm2-pocao-head">
        <Icon id={ELEMENTO_NEUTRO_ID} size={32} />
        <strong style={{ ...sm2Text, flex: 1, minWidth: 0 }}>{isPt ? C.title.pt : C.title.en}</strong>
        <button type="button" data-potion-create={ELEMENTO_NEUTRO_ID} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary" disabled={!can}
          aria-describedby={can ? undefined : 'sm2-neutro-nota'} onClick={onCreate}>{isPt ? C.create.pt : C.create.en}</button>
      </div>
      <p style={sm2Hint}>{isPt ? C.lead.pt : C.lead.en}</p>
      <p data-neutro-total role="status" style={{ ...sm2Text, margin: 0 }}>{isPt ? C.complete.pt(prog.feitos, NEUTRO_TOTAL) : C.complete.en(prog.feitos, NEUTRO_TOTAL)}</p>
      {!can && <p id="sm2-neutro-nota" data-neutro-nota style={sm2Hint}>{unlocked ? (isPt ? C.notYet.pt : C.notYet.en) : (isPt ? C.locked.pt : C.locked.en)}</p>}
      <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 8 }}>
        {NEUTRO_GRUPOS.map(g => {
          const gp = prog.grupos.find(x => x.grupo === g);
          if (!gp) return null;
          const aberto = open === g;
          return (
            <li key={g} data-neutro-grupo={g}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sm2Text }}>
                <span style={{ flex: 1 }}>{isPt ? C.grupo[g].pt : C.grupo[g].en} <span style={sm2Hint}>({isPt ? C.each.pt(gp.cada) : C.each.en(gp.cada)})</span></span>
                <span className="sm2-num" data-neutro-grupo-n>{gp.feitos}/{gp.total}</span>
              </div>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={gp.total} aria-valuenow={gp.feitos} aria-label={isPt ? C.grupo[g].pt : C.grupo[g].en}
                style={{ height: 4, borderRadius: 2, background: 'var(--sm2-line, rgba(0,0,0,.12))', overflow: 'hidden', marginTop: 4 }}>
                <div style={{ width: `${(gp.feitos / gp.total) * 100}%`, height: '100%', background: 'var(--sm2-accent, #1c7f86)' }} />
              </div>
              {gp.faltam.length > 0 && (
                <button type="button" data-neutro-ver={g} aria-expanded={aberto} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" style={{ marginTop: 6 }} onClick={() => pick(g)}>
                  {aberto ? (isPt ? C.hideMissing.pt : C.hideMissing.en) : (isPt ? C.seeMissing.pt : C.seeMissing.en)}
                </button>
              )}
              {aberto && (
                <ul data-neutro-faltam={g} style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 4 }}>
                  {gp.faltam.slice(0, shown).map(f => (
                    <li key={f.id} data-neutro-falta={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, ...sm2Text }}>
                      <Icon id={f.id} size={24} /><span style={{ flex: 1 }}>{essenceName(f.id, isPt)}</span><span className="sm2-num">{f.tem}/{f.precisa}</span>
                    </li>
                  ))}
                  {gp.faltam.length > shown && (
                    <li><button type="button" data-neutro-mais className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" onClick={() => setShown(n => n + PAGE)}>{isPt ? C.more.pt : C.more.en}</button></li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
