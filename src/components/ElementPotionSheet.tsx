import { useMemo, useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { potionArt } from '../utils/potionArt';
import { essenceName } from '../utils/essences';
import { ElementBaseSlots, ElementIcon as Icon, elName, emptySlots } from './ElementBaseSlots';
import { isPotionUnlocked, canAffordPotion, potionCost, potionIngredients, potionKey, potionListFor, POTION_FILTERS, type PotionFilter, type PotionRecipe } from '../utils/elementPotion';
import type { Language } from '../utils/i18n';
import { Icon as UiIcon } from './ui/Icon';
import { NeutroPotionPanel } from './NeutroPotionPanel';
import { ELEMENTO_NEUTRO_ID } from '../utils/elementoNeutro';
import { NEUTRO_POTION_COSTS } from '../utils/neutroPotion';

/**
 * POÇÃO DE ELEMENTO (Laboratório > Vesca, 30/10/2026; lista completa 12/11/2026). Mostra TODAS as poções, cada uma com o ícone e, por
 * ingrediente, quanto o jogador TEM de quanto PRECISA. Filtro: três espaços de elemento base (E) + status (todas, posso criar, essências
 * suficientes, base, composta). As que já dá para criar vêm primeiro, destacadas, com "Criar" ativo → confirmação com o custo → `onCraft`.
 * Regras e custos: `utils/elementPotion.ts` (nada de literal aqui).
 */
export interface ElementPotionSheetProps {
  open: boolean;
  language: Language;
  essences: Record<string, number> | undefined;
  /** Inventário (`foodInventory`): o composto consome 1 poção de cada base. */
  inventory?: Record<string, number>;
  /** Elemento da poção pendente no Soulmon (se houver), só para informar. */
  pending?: string;
  onBack: () => void;
  onCraft: (elementId: string) => void;
  /** Elementos desbloqueados na Biblioteca (`defeatedElements`). Bloqueado = "???" e não se cria. */
  unlocked?: readonly string[];
}

const PAGE = 30;

export function ElementPotionSheet({ open, language, essences, inventory, pending, onBack, onCraft, unlocked }: ElementPotionSheetProps) {
  const isPt = language === 'pt-BR';
  const [slots, setSlots] = useState<(string | null)[]>(emptySlots);
  const [filter, setFilter] = useState<PotionFilter>('all');
  const [shown, setShown] = useState(PAGE);
  const [sel, setSel] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const list = useMemo(() => potionListFor(essences, inventory, slots, filter, unlocked), [essences, inventory, slots, filter, unlocked]);
  const setSlot = (i: number, id: string | null) => { setSlots(s => s.map((v, j) => (j === i ? id : v))); setShown(PAGE); setDone(null); };
  const pickFilter = (f: PotionFilter) => { setFilter(f); setShown(PAGE); };
  const back = () => { if (sel) setSel(null); else onBack(); };

  const ehNeutro = sel === ELEMENTO_NEUTRO_ID;
  const costRows = sel && !ehNeutro ? potionCost(sel) : [];
  const potionRows = sel ? potionIngredients(sel) : [];
  const t = {
    title: isPt ? 'Criar poção' : 'Create potion',
    back: isPt ? 'Voltar' : 'Back',
    hint: isPt ? 'Todas as poções. Filtre por elementos base: só entram as que contêm todos eles.' : 'Every potion. Filter by base elements: only potions that contain all of them are listed.',
    filters: isPt ? 'Filtrar' : 'Filter',
    f: {
      all: isPt ? 'Todas' : 'All', can: isPt ? 'Posso criar' : 'Can create', enough: isPt ? 'Essências ok' : 'Enough essences',
      base: isPt ? 'Base' : 'Base', composite: isPt ? 'Composta' : 'Compound',
    } as Record<PotionFilter, string>,
    none: isPt ? 'Nenhuma poção com esse filtro.' : 'No potion matches this filter.',
    create: isPt ? 'Criar' : 'Create',
    more: isPt ? 'Mostrar mais' : 'Show more',
    confirmQ: isPt ? 'Gastar estas essências?' : 'Spend these essences?',
    confirmBtn: isPt ? 'Confirmar' : 'Confirm',
    made: isPt ? 'Poção criada! Está na pasta de itens.' : 'Potion created! It is in your item folder.',
    pending: isPt ? 'Poção na espera para a próxima evolução:' : 'Potion waiting for the next evolution:',
    once: isPt ? 'Vale só para a próxima evolução; depois o Soulmon volta ao elemento da pontuação dele.' : 'Only affects the next evolution; after that your Soulmon returns to its score-based element.',
    locked: isPt ? 'Elemento ainda não desbloqueado no Drive' : 'Element not yet unlocked in the Drive',
    lockedHint: isPt ? 'Desbloqueie no Drive' : 'Unlock in the Drive',
    note: isPt ? 'Base: 100 essências da própria. Composta: 1 poção de cada base + 50 essências dela. Dar uma poção ao Soulmon (pasta de itens) troca a que já estava esperando.' : 'Base: 100 of its own essence. Compound: 1 potion of each base + 50 of its essence. Giving a potion to your Soulmon (item folder) replaces the one already waiting.',
    potionOf: (id: string) => (isPt ? 'Poção de ' : '') + elName(id, isPt) + (isPt ? '' : ' potion'),
  };
  const art = (id: string, big: boolean) => (potionArt(id)
    ? <img src={potionArt(id)} alt="" aria-hidden="true" width={big ? 40 : 24} height={big ? 40 : 24} draggable={false} data-potion-art={id} style={{ width: big ? 40 : 24, height: big ? 40 : 24, objectFit: 'contain' }} />
    : (big ? <Icon id={id} size={32} /> : <Icon id={id} size={24} />));
  const confirmDisabled = !sel || !canAffordPotion(essences, sel, inventory);

  const row = (r: PotionRecipe) => {
    if (!isPotionUnlocked(r.id, unlocked)) {
      return (
        <li key={r.id} data-element-locked aria-label={t.locked} style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 10, ...sm2Text, color: 'var(--sm2-muted)' }}>
          <span aria-hidden="true" style={{ width: 24, textAlign: 'center' }}>?</span><span aria-hidden="true">???</span>
          <span style={{ ...sm2Hint, marginLeft: 'auto' }}>{t.lockedHint}</span>
        </li>
      );
    }
    return (
      <li key={r.id} data-potion-item={r.id} data-can-craft={r.canCraft ? 'true' : 'false'} className="sm2-pocao-item">
        <div className="sm2-pocao-head">
          {art(r.id, true)}
          <strong style={{ ...sm2Text, flex: 1, minWidth: 0 }}>{t.potionOf(r.id)}</strong>
          <button type="button" data-potion-create={r.id} className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary" disabled={!r.canCraft} onClick={() => { setSel(r.id); setDone(null); }}>{t.create}</button>
        </div>
        <ul className="sm2-pocao-ing">
          {r.potions.map(p => (
            <li key={`p-${p.id}`} data-ing-potion={p.id} data-ok={p.have >= p.need ? 'true' : 'false'}>
              {art(p.id, false)}<span style={{ flex: 1 }}>{t.potionOf(p.id)}</span><span className="sm2-num">{p.have}/{p.need}</span>
            </li>
          ))}
          {r.essences.map(e => (
            <li key={`e-${e.id}`} data-ing-essence={e.id} data-ok={e.have >= e.need ? 'true' : 'false'}>
              <Icon id={e.id} size={24} /><span style={{ flex: 1 }}>{essenceName(e.id, isPt)}</span><span className="sm2-num">{e.have}/{e.need}</span>
            </li>
          ))}
        </ul>
      </li>
    );
  };

  return (
    <ModalSheet open={open} title={t.title} onClose={onBack} onBack={back} language={language}
      footer={sel ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* §316c (13/11/2026, dono): folha de poção é modal branco, fica com o botão padrão do app (não o CTA do site). */}
          <button type="button" data-potion-confirm className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary" style={{ minWidth: 220 }} disabled={confirmDisabled}
            onClick={() => { onCraft(sel); setDone(sel); setSel(null); }}>
            <UiIcon name="auto_awesome" size={22} tone="inherit" /><span>{t.confirmBtn}</span><Icon id={sel} size={24} />
          </button>
        </div>
      ) : undefined}>
      <div data-element-potion style={{ display: 'grid', gap: 12 }}>
        {pending && <p style={sm2Hint} data-potion-pending>{t.pending} <strong>{elName(pending, isPt)}</strong><br />{t.once}</p>}
        {done && <p role="status" style={sm2Text} data-potion-made>{t.made} ({elName(done, isPt)})</p>}

        {!sel && (
          <>
            <p style={sm2Hint}>{t.hint}</p>
            <NeutroPotionPanel essences={essences} inventory={inventory} isPt={isPt} unlocked={isPotionUnlocked(ELEMENTO_NEUTRO_ID, unlocked)} onCreate={() => { setSel(ELEMENTO_NEUTRO_ID); setDone(null); }} />
            <ElementBaseSlots slots={slots} isPt={isPt} onChange={setSlot} />
            <div role="group" aria-label={t.filters} data-potion-filters style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {POTION_FILTERS.map(f => (
                <button key={f} type="button" data-filter={f} aria-pressed={filter === f} onClick={() => pickFilter(f)} className="sm2-kit-btn sm2-kit-btn-sm sm2-pocao-chip">{t.f[f]}</button>
              ))}
            </div>
            {list.length === 0 ? (
              <p style={sm2Text} data-potion-none>{t.none}</p>
            ) : (
              <ul data-potion-options style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                {list.slice(0, shown).map(row)}
              </ul>
            )}
            {list.length > shown && <button type="button" data-potion-more className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" onClick={() => setShown(n => n + PAGE)}>{t.more}</button>}
            <p style={sm2Hint}>{t.note}</p>
          </>
        )}

        {sel && (
          <div data-potion-cost>
            <p style={{ ...sm2Text, display: 'flex', alignItems: 'center', gap: 8 }}>{art(sel, true)}<strong>{elName(sel, isPt)}</strong></p>
            <p style={sm2Hint}>{t.confirmQ}</p>
            {ehNeutro && (
              <ul data-neutro-resumo style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 6, ...sm2Text }}>
                <li>{isPt ? `Cada elemento base: ${NEUTRO_POTION_COSTS.eachBase} essências ou 1 poção` : `Each base element: ${NEUTRO_POTION_COSTS.eachBase} essence or 1 potion`}</li>
                <li>{isPt ? `${NEUTRO_POTION_COSTS.neutroEssence} essências do Neutro` : `${NEUTRO_POTION_COSTS.neutroEssence} Neutral essence`}</li>
              </ul>
            )}
            <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 6 }}>
              {costRows.map(c => (
                <li key={c.id} data-cost={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, ...sm2Text }}>
                  <Icon id={c.id} size={24} /><span style={{ flex: 1 }}>{essenceName(c.id, isPt)}</span>
                  <span className="sm2-num">{c.qty} / {essences?.[c.id] ?? 0}</span>
                </li>
              ))}
            </ul>
            {potionRows.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'grid', gap: 6 }}>
                {potionRows.map(c => (
                  <li key={c.id} data-cost-potion={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, ...sm2Text }}>
                    <Icon id={c.id} size={24} /><span style={{ flex: 1 }}>{t.potionOf(c.id)}</span>
                    <span className="sm2-num">{c.qty} / {inventory?.[potionKey(c.id)] ?? 0}</span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={back} style={{ ...sm2Button('quiet'), marginTop: 12 }}>{t.back}</button>
          </div>
        )}
      </div>
    </ModalSheet>
  );
}
