// ---------------------------------------------------------------------------
// A oferta reduzida do "never miss twice", com o QUE A PESSOA CONTOU (WP2.5).
//
// `soulStruggle` é a segunda pergunta aberta do onboarding — "o que costuma
// atrapalhar?" — e era **escrita e nunca lida**: nenhum lugar do app usava a
// resposta. Perguntar algo pessoal, guardar e não devolver é extração; foi
// exatamente essa a crítica que o produto faz aos apps de sono, aplicada ao
// próprio produto.
//
// O lugar certo de devolver não é uma tela de resumo: é o momento em que ela
// custa. Na SEGUNDA falta seguida (`MISS_INTERVENTION_AT`), o pet oferece a
// versão de 5 minutos — e é ali que "você me contou que X costuma atrapalhar"
// deixa de ser enfeite e vira reconhecimento.
//
// Três limites, e os três são a diferença entre lembrar e cobrar:
//  · **é frase LOCAL**, montada aqui — nada vai para a IA. O texto é da pessoa
//    e não sai do aparelho;
//  · **não repete o que ela falhou**, não conta quantas vezes, não usa
//    "deveria"/"falhou"/"de novo". Há teste;
//  · **some se ela não respondeu**. Sem `soulStruggle`, a oferta é a genérica
//    que já existia — nunca um espaço vazio com ar de formulário incompleto.
// ---------------------------------------------------------------------------

/** Teto do que é reexibido. A pergunta é aberta; um parágrafo inteiro dentro
 *  de uma frase falada vira ruído, e cortar no meio de uma palavra é pior. */
export const STRUGGLE_ECHO_MAX = 80;

/** Colapsa espaço e corta na última palavra inteira dentro do teto. */
export function echoStruggle(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const limpo = raw.replace(/\s+/g, ' ').trim();
  if (limpo.length <= STRUGGLE_ECHO_MAX) return limpo;
  const corte = limpo.slice(0, STRUGGLE_ECHO_MAX);
  const ultimoEspaco = corte.lastIndexOf(' ');
  return (ultimoEspaco > 20 ? corte.slice(0, ultimoEspaco) : corte).trim();
}

/**
 * A linha que abre a oferta reduzida. `null` = a pessoa não respondeu, e aí
 * não há nada a lembrar: quem chama mostra só a oferta de sempre.
 */
export function tinyOfferIntro(soulStruggle: unknown, isPt: boolean): string | null {
  const eco = echoStruggle(soulStruggle);
  if (!eco) return null;
  return isPt
    ? `Você me contou que ${eco} costuma atrapalhar.`
    : `You told me that ${eco} usually gets in the way.`;
}
