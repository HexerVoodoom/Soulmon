// ---------------------------------------------------------------------------
// DETECTOR DE SOFRIMENTO NO SERVIDOR (E12, docs/PLANO-OBJETIVO-ANUAL.md 8b.4)
//
// ESPELHO de `src/utils/chatSafety.ts` (`needsBridge`): as mesmas listas NUNCA_CASA
// e LEXICO, byte a byte (há teste de paridade em `chat.purpose.test.js` que compara
// o texto dos dois arquivos e uma amostra de frases). Existe porque os campos do
// objetivo (objetivo, motivo, frase, plano) são texto livre escrito num campo que
// pode ter sido editado em OUTRO aparelho: o servidor confere a cada envio, logo
// antes de montar o prompt. Se casar, o texto NÃO é enviado à IA (decisão do dono:
// só isto, sem tela). Nada daqui é gravado, logado ou medido: nem o trecho, nem o
// fato de ter casado.
// ---------------------------------------------------------------------------

const NUNCA_CASA = [
  /* A regra que separa hipérbole de declaração, em português, é o
     COMPLEMENTO. "Quero morrer" é uma frase; "quero morrer de tanto
     trabalhar", "morrendo de rir", "morro de vergonha" são outra coisa — o
     `de <alguma coisa>` transforma o verbo em intensificador, e isso vale para
     qualquer complemento, não só para uma lista que sempre estaria incompleta.
     A ÚNICA exceção é "de vez", que intensifica no sentido literal. */
  /morr(er|o|i|endo|ia|eu) de (?!vez\b)\S/i,
  /morrend[oa] de (rir|rid[íi]culo|fome|sono|vontade|calor|frio|amor|medo|vergonha|saudade|inveja|preguiça|tédio|curiosidade)/i,
  /mat(ar|ando|ei|o) (a|as) (fome|sede|saudade|aula|cobra|charada|pau)/i,
  /morr(o|i|endo) de rir/i,
  /dying (of|to) (laughter|laugh|know|see|hear|try|thirst|hunger|boredom)/i,
  /dead (tired|serious|inside joke|line|end|weight)/i,
  /kill(ing|ed)? (time|it|the mood|two birds|the lights)/i,
  /\bi could kill for\b/i,
  /me mata de (rir|vergonha|curiosidade|amor)/i,
];

const LEXICO = [
  // PT — intenção declarada
  /(quero|queria|vou|penso em|pensando em|tenho vontade de)\s+(me\s+)?(matar|morrer|sumir de vez|acabar com tudo|dar cabo)/i,
  /(tirar|acabar com)\s+(a\s+)?minha\s+vida/i,
  /me (matar|machucar|cortar|ferir)\b/i,
  /não (quero|queria) mais (viver|existir|acordar|estar aqui)/i,
  /não aguento mais (viver|existir|nada disso|essa vida)/i,
  /(seria|é) melhor se eu (não existisse|morresse|sumisse|nunca tivesse nascido)/i,
  /(quero|queria) (desaparecer|sumir) (para sempre|de vez)/i,
  /ninguém (ia|iria) sentir (a minha|minha) falta/i,
  /pensamento[s]? suicida/i,
  /me automutil|automutila|\bme cortei\b/i,
  // EN — mesma régua
  /(want|wanted|going)\s+to\s+(kill myself|end (my life|it all)|die)/i,
  /(i|I)('| a)?m going to kill myself/i,
  // `live`/`exist` casam sós; `wake up`/`be here` EXIGEM `anymore`/`ever
  // again` (skeptic R2 #10): "don't want to wake up early" e "don't want to
  // be here for the meeting" são frases de segunda-feira, não de crise.
  /(don'?t|do not) want to (live|exist)\b/i,
  /(don'?t|do not) want to (wake up|be here) (any\s?more|ever again)\b/i,
  /(better off|be better) (dead|without me|if i (was|were) gone)/i,
  /(hurt|harm|cut)\s+myself/i,
  /suicidal (thought|ideation)/i,
  /no one would miss me/i,
  // EN coloquial (skeptic #11, 21/09/2026): é assim que se escreve num chat.
  /\b(i )?wanna die\b/i,
  /\bkms\b/i,
  /\bkill myself\b/i,
  /\bend it all\b/i,
  /\bno reason to live\b/i,
];

function tirarAcentos(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
/** Só tira acento do padrão: NUNCA `toLowerCase()` (viraria `\S` em `\s`). */
const semAcento = (r) => new RegExp(tirarAcentos(r.source), r.flags);
const NUNCA_CASA_N = NUNCA_CASA.map(semAcento);
const LEXICO_N = LEXICO.map(semAcento);

export function normalizarParaLexico(texto) {
  return tirarAcentos(texto).toLowerCase();
}

/** O texto pede a ponte de ajuda (sinal de sofrimento agudo)? */
export function needsBridge(mensagem) {
  const texto = normalizarParaLexico(String(mensagem ?? ''));
  if (!texto.trim()) return false;
  if (NUNCA_CASA_N.some((r) => r.test(texto))) return false;
  return LEXICO_N.some((r) => r.test(texto));
}
