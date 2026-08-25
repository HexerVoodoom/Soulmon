/**
 * Microcopy da geração incremental de sprite (`spec-geracao-incremental.md` §7).
 *
 * PT-BR **e** EN, sempre os dois (`CLAUDE.md`: inglês é a base, PT-BR é
 * localização). Linguagem **diegética**, nunca técnica: o jogador nunca é
 * informado do custo, da fila ou do provedor (Invariante nº 3). "O Oráculo
 * está desenhando", nunca "gerando imagem" ou "3 créditos".
 */
import type { Language } from './i18n';

export interface SpriteText { pt: string; en: string }

export const SPRITE_COPY = {
  drawing: { pt: 'O Oráculo está desenhando…', en: 'The Oracle is drawing…' },
  new: { pt: 'NOVO', en: 'NEW' },
  offline: { pt: 'Sem conexão — volta quando você voltar.', en: "Offline — it'll be here when you're back." },
  kept: { pt: 'Esta forma ficou com o traço antigo.', en: 'This form kept the old look.' },
  retry: { pt: 'Tentar de novo', en: 'Try again' },
  locked: { pt: 'Ainda não revelado', en: 'Not revealed yet' },
  tie: { pt: 'Seu ritmo ainda pode decidir.', en: 'Your rhythm can still decide.' },
  final: {
    pt: 'O Oráculo não conseguiu desenhar esta forma. Ela fica com o traço antigo.',
    en: "The Oracle couldn't draw this form. It keeps the old look.",
  },
  tuneReady: { pt: 'O Oráculo terminou o traço desta forma.', en: "The Oracle finished this form's look." },
  tune: { pt: 'Sintonizar o Visor', en: 'Tune the Visor' },
  tuneAuto: {
    pt: 'Se você não escolher, o Visor sintoniza sozinho amanhã.',
    en: "If you don't choose, the Visor tunes itself tomorrow.",
  },
  revert: { pt: 'Voltar ao traço antigo', en: 'Keep the old look' },
  tuned: { pt: 'Visor sintonizado', en: 'Visor tuned' },
} as const satisfies Record<string, SpriteText>;

export type SpriteCopyKey = keyof typeof SPRITE_COPY;

export function spriteText(key: SpriteCopyKey, language: Language): string {
  const t = SPRITE_COPY[key];
  return language === 'pt-BR' ? t.pt : t.en;
}
