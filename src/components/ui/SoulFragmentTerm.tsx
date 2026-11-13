import { Fragment, type ReactNode } from 'react';

/**
 * 💠 Destaque do termo "Fragmento(s) de Alma" / "Soul Fragment(s)" (pedido do dono, 13/11/2026): em TODO texto de UI o termo
 * sai em NEGRITO e TURQUESA (`--sm2-primary-ink`, o turquesa do check). Dois jeitos de usar:
 *  · `<SoulFragmentTerm>fragmento de alma</SoulFragmentTerm>` quando quem chama já separou o termo;
 *  · `emphasizeSoulFragment(texto)` para uma frase pronta (copy de `utils/soulFragment.ts`, i18n…): devolve os nós com o termo
 *    destacado e o resto intacto. Sem termo na frase = a própria string (nada muda no DOM).
 */
export function SoulFragmentTerm({ children }: { children: ReactNode }) {
  return (
    <strong data-soul-fragment-term style={{ fontWeight: 700, color: 'var(--sm2-primary-ink)' }}>{children}</strong>
  );
}

/** PT e EN, singular e plural, qualquer caixa. */
export const SOUL_FRAGMENT_TERM_RE = /(fragmentos? de alma|soul fragments?)/gi;

export function emphasizeSoulFragment(text: string): ReactNode {
  if (!text) return text;
  const parts = text.split(SOUL_FRAGMENT_TERM_RE);
  if (parts.length === 1) return text;
  return parts.map((p, i) => (i % 2 === 1
    ? <SoulFragmentTerm key={i}>{p}</SoulFragmentTerm>
    : <Fragment key={i}>{p}</Fragment>));
}
