/**
 * NOVA LEITURA — o reroll deixa de ser um sorteio pago (WP5.7 / decisão H.4).
 * ==========================================================================
 *
 * ─── O que havia ─────────────────────────────────────────────────────────
 * `handleRerollCharacter` cobrava 50 Créditos (dinheiro real) e tirava a
 * semente do gerador de aleatórios da linguagem. O `termos.html` §5 chamava a
 * peça, com estas palavras, de "sorteio pago" — que é a definição operacional
 * de uma mecânica de gacha, e era a **única violação declarada** da lista de
 * proibições que ainda estava de pé no código do Soulmon.
 *
 * O incômodo não é abstrato: pagar por um resultado aleatório é pagar para
 * jogar de novo, e o produto inteiro é construído sobre "a criatura veio de
 * VOCÊ". Um dado no meio disso desmente a promessa na hora em que ela custa
 * mais caro.
 *
 * ─── O que existe agora ──────────────────────────────────────────────────
 * A semente vem das RESPOSTAS. Mesma resposta, mesma criatura — e a tela diz
 * isso ANTES de cobrar. Para obter outra criatura, a pessoa muda o que
 * respondeu sobre si mesma, que é exatamente o gesto que o produto quer
 * cobrar: não "tenta de novo", e sim "me leia de novo, assim".
 *
 * O `readingCount` entra no hash porque duas leituras com as MESMAS respostas
 * precisam poder existir sem serem a mesma criatura para sempre — mas a pessoa
 * escolhe: manter as respostas e aceitar a mesma leitura (e aí não faz sentido
 * pagar), ou mudar alguma. O contador só muda quando uma leitura é CONCLUÍDA,
 * então repetir a tela sem confirmar não muda nada.
 *
 * Módulo PURO: sem React, sem storage e — a parte que importa — sem nenhuma
 * fonte de aleatoriedade. O teste tranca essa ausência procurando o nome da
 * função de sorteio neste arquivo, então ele não aparece nem aqui no
 * comentário: uma explicação que cita a agulha reprova o próprio pacote (é a
 * quarta vez que essa armadilha aparece nesta série de mudanças).
 */
import { ORACLE_QUESTIONS } from './oracle';

/**
 * FNV-1a de 32 bits. Escolhido por ser curto, determinístico e sem dependência
 * — não é hash criptográfico e não precisa ser: a única exigência é que a mesma
 * entrada devolva sempre a mesma saída, em qualquer aparelho.
 */
function fnv1a(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * A semente de uma leitura. Ordem das perguntas FIXA (a do `ORACLE_QUESTIONS`),
 * nunca a ordem em que o objeto foi montado: `Object.keys` de um save carregado
 * de JSON não tem ordem garantida entre motores, e a semente mudaria de
 * aparelho para aparelho sem ninguém entender por quê.
 */
export function readingSeed(
  answers: Record<string, string> | undefined,
  readingCount = 0,
): number {
  const a = answers ?? {};
  const assinatura = ORACLE_QUESTIONS.map(q => `${q.id}=${a[q.id] ?? ''}`).join('|');
  // A semente cabe em 31 bits porque é o que o motor do oráculo espera.
  return fnv1a(`${assinatura}#${Math.max(0, Math.floor(readingCount))}`) % (2 ** 31);
}

/** As respostas mudaram em relação às da leitura atual? */
export function answersChanged(
  antes: Record<string, string> | undefined,
  depois: Record<string, string> | undefined,
): boolean {
  const a = antes ?? {};
  const b = depois ?? {};
  return ORACLE_QUESTIONS.some(q => (a[q.id] ?? '') !== (b[q.id] ?? ''));
}
