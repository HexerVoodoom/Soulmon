import { useMemo, useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { elementIcon } from '../utils/elementIconArt';
import { essenceName } from '../utils/essences';
import { elementLabel } from '../utils/arena';
import { elementoNomeDe } from '../utils/soulProfile/ficha/elementoNome';
import { BASE_ELEMENT_IDS } from '../utils/elementDex';
import { affordablePotionElements, canAffordPotion, potionCost, POTION_MAX_BASES } from '../utils/elementPotion';
import type { Language } from '../utils/i18n';

/**
 * POÇÃO DE ELEMENTO (Laboratório > Centro de Evolução, 30/10/2026). Três espaços lado a lado; tocar um abre a lista dos elementos BASE;
 * o filtro é E (só entra o elemento cuja composição contém TODAS as bases escolhidas) e só aparece o que o jogador PODE pagar.
 * Escolher → "Gerar" → confirmação com o custo → `onCraft`. Regras e custos: `utils/elementPotion.ts` (nada de literal aqui).
 */
export interface ElementPotionSheetProps {
  open: boolean;
  language: Language;
  essences: Record<string, number> | undefined;
  /** Elemento da poção pendente no Soulmon (se houver), só para informar. */
  pending?: string;
  onBack: () => void;
  onCraft: (elementId: string) => void;
}

const elName = (id: string, isPt: boolean) => (BASE_ELEMENT_IDS.includes(id) ? elementLabel(id, isPt) : (isPt ? elementoNomeDe(id).pt : elementoNomeDe(id).en));

function Icon({ id, size }: { id: string; size: number }) {
  const src = elementIcon(id);
  return src ? <img src={src} alt="" aria-hidden="true" width={size} height={size} draggable={false} style={{ width: size, height: size, imageRendering: 'pixelated' }} /> : null;
}

export function ElementPotionSheet({ open, language, essences, pending, onBack, onCraft }: ElementPotionSheetProps) {
  const isPt = language === 'pt-BR';
  const [slots, setSlots] = useState<(string | null)[]>(() => Array.from({ length: POTION_MAX_BASES }, () => null));
  const [menu, setMenu] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const options = useMemo(() => affordablePotionElements(essences, slots), [essences, slots]);
  const sel = picked && options.includes(picked) ? picked : null;
  const setSlot = (i: number, id: string | null) => {
    setSlots(s => s.map((v, j) => (j === i ? id : v)));
    setMenu(null); setPicked(null); setDone(null);
  };
  const back = () => { if (confirm) setConfirm(false); else onBack(); };

  const costRows = sel ? potionCost(sel) : [];
  const t = {
    title: isPt ? 'Criar poção de elemento' : 'Create element potion',
    back: isPt ? 'Voltar' : 'Back',
    hint: isPt ? 'Escolha até 3 elementos base. Aparecem só os elementos que contêm todos eles e que você consegue pagar.' : 'Pick up to 3 base elements. Only elements that contain all of them, and that you can afford, are listed.',
    none: isPt ? 'Nenhum — você não tem essências suficientes para produzir um elemento deste.' : "None — you don't have enough essences to make an element like this.",
    empty: isPt ? 'Vazio' : 'Empty',
    clear: isPt ? 'Limpar espaço' : 'Clear slot',
    generate: isPt ? 'Gerar' : 'Generate',
    confirmQ: isPt ? 'Gastar estas essências?' : 'Spend these essences?',
    confirmBtn: isPt ? 'Confirmar' : 'Confirm',
    made: isPt ? 'Poção criada! Está na pasta de itens.' : 'Potion created! It is in your item folder.',
    pending: isPt ? 'Poção na espera para a próxima evolução:' : 'Potion waiting for the next evolution:',
    note: isPt ? 'Dar uma poção ao Soulmon (pasta de itens) troca a que já estava esperando.' : 'Giving a potion to your Soulmon (item folder) replaces the one already waiting.',
  };

  return (
    <ModalSheet open={open} title={t.title} onClose={onBack} onBack={back} language={language}
      footer={confirm ? (
        <button type="button" data-potion-confirm style={sm2Button('primary', !sel || !canAffordPotion(essences, sel))} disabled={!sel || !canAffordPotion(essences, sel)}
          onClick={() => { if (sel) { onCraft(sel); setConfirm(false); setDone(sel); setPicked(null); } }}>{t.confirmBtn}</button>
      ) : (
        <button type="button" data-potion-generate style={sm2Button('primary', !sel)} disabled={!sel} onClick={() => setConfirm(true)}>{t.generate}</button>
      )}>
      <div data-element-potion style={{ display: 'grid', gap: 12 }}>
        {pending && <p style={sm2Hint} data-potion-pending>{t.pending} <strong>{elName(pending, isPt)}</strong></p>}
        {done && <p role="status" style={sm2Text} data-potion-made>{t.made} ({elName(done, isPt)})</p>}

        {!confirm && (
          <>
            <p style={sm2Hint}>{t.hint}</p>
            <div style={{ display: 'flex', gap: 8 }} data-potion-slots>
              {slots.map((id, i) => (
                <button key={i} type="button" data-slot={i} aria-expanded={menu === i} aria-label={`${i + 1}: ${id ? elName(id, isPt) : t.empty}`}
                  onClick={() => setMenu(menu === i ? null : i)}
                  style={{ all: 'unset', cursor: 'pointer', flex: 1, minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderBottom: `2px solid ${menu === i ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'}` }}>
                  {id ? <Icon id={id} size={32} /> : <span aria-hidden="true" style={{ fontSize: 24, color: 'var(--sm2-muted)' }}>+</span>}
                  <span style={{ ...sm2Hint, textAlign: 'center' }}>{id ? elName(id, isPt) : t.empty}</span>
                </button>
              ))}
            </div>
            {menu !== null && (
              <ul data-potion-menu style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2, maxHeight: 220, overflowY: 'auto' }}>
                {slots[menu] && <li><button type="button" onClick={() => setSlot(menu, null)} style={{ all: 'unset', cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', ...sm2Text }}>{t.clear}</button></li>}
                {BASE_ELEMENT_IDS.filter(id => !slots.includes(id) || slots[menu] === id).map(id => (
                  <li key={id}>
                    <button type="button" data-base={id} onClick={() => setSlot(menu, id)} style={{ all: 'unset', cursor: 'pointer', minHeight: 44, width: '100%', display: 'flex', alignItems: 'center', gap: 10, ...sm2Text }}>
                      <Icon id={id} size={24} /><span>{elName(id, isPt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {options.length === 0 ? (
              <p style={sm2Text} data-potion-none>{t.none}</p>
            ) : (
              <ul data-potion-options style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
                {options.map(id => (
                  <li key={id}>
                    <button type="button" data-element={id} aria-pressed={sel === id} onClick={() => setPicked(sel === id ? null : id)}
                      style={{ all: 'unset', cursor: 'pointer', minHeight: 44, width: '100%', display: 'flex', alignItems: 'center', gap: 10, ...sm2Text, fontWeight: sel === id ? 700 : 400, color: sel === id ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)' }}>
                      <Icon id={id} size={24} /><span>{elName(id, isPt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p style={sm2Hint}>{t.note}</p>
          </>
        )}

        {confirm && sel && (
          <div data-potion-cost>
            <p style={{ ...sm2Text, display: 'flex', alignItems: 'center', gap: 8 }}><Icon id={sel} size={32} /><strong>{elName(sel, isPt)}</strong></p>
            <p style={sm2Hint}>{t.confirmQ}</p>
            <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 6 }}>
              {costRows.map(c => (
                <li key={c.id} data-cost={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, ...sm2Text }}>
                  <Icon id={c.id} size={24} /><span style={{ flex: 1 }}>{essenceName(c.id, isPt)}</span>
                  <span className="sm2-num">{c.qty} / {essences?.[c.id] ?? 0}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={back} style={{ ...sm2Button('quiet'), marginTop: 12 }}>{t.back}</button>
          </div>
        )}
      </div>
    </ModalSheet>
  );
}
