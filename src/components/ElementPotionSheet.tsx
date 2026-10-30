import { useMemo, useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { essenceName } from '../utils/essences';
import { ElementBaseSlots, ElementIcon as Icon, elName, emptySlots } from './ElementBaseSlots';
import { isPotionUnlocked, affordablePotionElements, canAffordPotion, potionCost } from '../utils/elementPotion';
import type { Language } from '../utils/i18n';
import { Icon as UiIcon } from './ui/Icon';

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
  /** Elementos desbloqueados na Biblioteca (`defeatedElements`). Bloqueado = "???" e não se cria. */
  unlocked?: readonly string[];
}

export function ElementPotionSheet({ open, language, essences, pending, onBack, onCraft, unlocked }: ElementPotionSheetProps) {
  const isPt = language === 'pt-BR';
  const [slots, setSlots] = useState<(string | null)[]>(emptySlots);
  const [picked, setPicked] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const options = useMemo(() => affordablePotionElements(essences, slots), [essences, slots]);
  const isOpen = (id: string) => isPotionUnlocked(id, unlocked);
  const sel = picked && options.includes(picked) && isOpen(picked) ? picked : null;
  const setSlot = (i: number, id: string | null) => {
    setSlots(s => s.map((v, j) => (j === i ? id : v)));
    setPicked(null); setDone(null);
  };
  const back = () => { if (confirm) setConfirm(false); else onBack(); };

  const costRows = sel ? potionCost(sel) : [];
  const t = {
    title: isPt ? 'Criar poção de elemento' : 'Create element potion',
    back: isPt ? 'Voltar' : 'Back',
    hint: isPt ? 'Escolha até 3 elementos base. Aparecem só os elementos que contêm todos eles e que você consegue pagar.' : 'Pick up to 3 base elements. Only elements that contain all of them, and that you can afford, are listed.',
    none: isPt ? 'Nenhum — você não tem essências suficientes para produzir um elemento deste.' : "None — you don't have enough essences to make an element like this.",
    generate: isPt ? 'Gerar' : 'Generate',
    confirmQ: isPt ? 'Gastar estas essências?' : 'Spend these essences?',
    confirmBtn: isPt ? 'Confirmar' : 'Confirm',
    made: isPt ? 'Poção criada! Está na pasta de itens.' : 'Potion created! It is in your item folder.',
    pending: isPt ? 'Poção na espera para a próxima evolução:' : 'Potion waiting for the next evolution:',
    locked: isPt ? 'Elemento ainda não desbloqueado na Biblioteca' : 'Element not yet unlocked in the Library',
    lockedHint: isPt ? 'Desbloqueie na Biblioteca' : 'Unlock in the Library',
    note: isPt ? 'Dar uma poção ao Soulmon (pasta de itens) troca a que já estava esperando.' : 'Giving a potion to your Soulmon (item folder) replaces the one already waiting.',
  };

  return (
    <ModalSheet open={open} title={t.title} onClose={onBack} onBack={back} language={language}
      // 30/10/2026 (dono): botão centralizado no fim do modal, com largura própria e ícone (frasco + o elemento escolhido).
      footer={(() => {
        const disabled = confirm ? (!sel || !canAffordPotion(essences, sel)) : !sel;
        const label = confirm ? t.confirmBtn : t.generate;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="button" {...(confirm ? { 'data-potion-confirm': true } : { 'data-potion-generate': true })}
              style={{ ...sm2Button('primary', disabled), width: 'auto', minWidth: 220, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingInline: 24 }}
              disabled={disabled}
              onClick={() => {
                if (!confirm) { setConfirm(true); return; }
                if (sel) { onCraft(sel); setConfirm(false); setDone(sel); setPicked(null); }
              }}>
              <UiIcon name="science" size={22} tone="inherit" />
              <span>{label}</span>
              {sel && <Icon id={sel} size={22} />}
            </button>
          </div>
        );
      })()}>
      <div data-element-potion style={{ display: 'grid', gap: 12 }}>
        {pending && <p style={sm2Hint} data-potion-pending>{t.pending} <strong>{elName(pending, isPt)}</strong></p>}
        {done && <p role="status" style={sm2Text} data-potion-made>{t.made} ({elName(done, isPt)})</p>}

        {!confirm && (
          <>
            <p style={sm2Hint}>{t.hint}</p>
            <ElementBaseSlots slots={slots} isPt={isPt} onChange={setSlot} />

            {options.length === 0 ? (
              <p style={sm2Text} data-potion-none>{t.none}</p>
            ) : (
              <ul data-potion-options style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
                {options.map(id => isOpen(id) ? (
                  <li key={id}>
                    <button type="button" data-element={id} aria-pressed={sel === id} onClick={() => setPicked(sel === id ? null : id)}
                      style={{ all: 'unset', cursor: 'pointer', minHeight: 44, width: '100%', display: 'flex', alignItems: 'center', gap: 10, ...sm2Text, fontWeight: sel === id ? 700 : 400, color: sel === id ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)' }}>
                      <Icon id={id} size={24} /><span>{elName(id, isPt)}</span>
                    </button>
                  </li>
                ) : (
                  <li key={id} data-element-locked aria-label={t.locked} style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 10, ...sm2Text, color: 'var(--sm2-muted)' }}>
                    <span aria-hidden="true" style={{ width: 24, textAlign: 'center' }}>?</span><span aria-hidden="true">???</span>
                    <span style={{ ...sm2Hint, marginLeft: 'auto' }}>{t.lockedHint}</span>
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
