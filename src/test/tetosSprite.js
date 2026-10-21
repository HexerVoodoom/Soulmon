// Tetos de geração de sprite NOS TESTES (QA, dono, 21/10/2026).
//
// O commit 372df3132 LIBEROU os tetos de produção "só para os testes iniciais" (6 → 60 por dia, 15 → 500 vitalício, 1 → 20 por forma)
// e deixou os números de produção num comentário de `_aiGuard.js`. Os testes de guard provam a MÁQUINA do teto ("a 7ª do dia é 429",
// "a forma esgota em 1"), e essa máquina só é alcançável com os números de produção: com o teto diário por conta (60) acima do global
// diário (40), nenhuma conta chegava ao 429 por conta. Por isso estes testes rodam COM os números de produção, fixados AQUI (uma constante só),
// e um teste separado prova que o valor vigente é de produção ou o liberado — voltar para produção depois dos testes iniciais não quebra nada.
import { beforeEach, afterEach } from 'vitest';
import { AI_LIMITS } from '../../functions/api/_aiGuard.js';

/** Os números de produção aprovados pelo dono (11/10/2026): 6/dia, 15 vitalício (11 formas + 4), 1 por forma, 800/mês e 40/dia global. */
export const SPRITE_PRODUCAO = Object.freeze({ perAccount: 6, perAccountLifetime: 15, perFormLifetime: 1, globalMonth: 800, globalDay: 40 });
/** Os números LIBERADOS para os testes iniciais (dono, 21/10/2026). */
export const SPRITE_LIBERADO = Object.freeze({ perAccount: 60, perAccountLifetime: 500, perFormLifetime: 20, globalMonth: 800, globalDay: 40 });

/** O valor VIGENTE de `AI_LIMITS.sprite` quando o módulo carrega (antes de qualquer troca de teste). */
export const SPRITE_VIGENTE = AI_LIMITS.sprite;

/** Registra beforeEach/afterEach que trocam `AI_LIMITS.sprite` pelos números de produção durante o teste e restauram o valor vigente depois. */
export function usarTetosDeSpriteDeProducao() {
  let vigente;
  beforeEach(() => { vigente = AI_LIMITS.sprite; AI_LIMITS.sprite = { ...SPRITE_PRODUCAO }; });
  afterEach(() => { AI_LIMITS.sprite = vigente; });
}
