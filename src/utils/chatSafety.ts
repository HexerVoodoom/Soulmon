/**
 * A PONTE DE AJUDA DO CHAT (WP3.9 — decisão D16, parcial).
 * =======================================================
 *
 * O chat do pet passa por uma IA, e o WP3.1 quer dar memória a ele. O corpus
 * estudado é direto sobre a consequência: memória aumenta a PROJEÇÃO (o efeito
 * ELIZA, documentado desde 1966) sem aumentar o amparo. Um bichinho que parece
 * lembrar de você é um bichinho para quem se conta coisa — e algumas dessas
 * coisas não podem terminar numa resposta gerada por um modelo de linguagem
 * pequeno, otimizado para ser fofo.
 *
 * ─── O que este módulo faz, e o que ele deliberadamente NÃO faz ───────────
 * FAZ: reconhece um punhado de frases de sofrimento agudo, **antes de a
 * mensagem sair do aparelho**, e devolve uma resposta local, fixa, na voz do
 * pet, com a ponte para quem sabe ajudar (CVV 188 em português; a linha
 * internacional em inglês).
 *
 * NÃO FAZ, e cada ausência é uma decisão:
 *  · **não diagnostica.** Não classifica risco, não mede gravidade, não guarda
 *    histórico. Não é triagem clínica e não tem competência para ser.
 *  · **não alarma.** Sem push, sem toast vermelho, sem modal por cima. Quem
 *    escreveu aquilo não precisa de um susto do aplicativo.
 *  · **não vira dado.** A frase que casou NUNCA é enviada, NUNCA é gravada e
 *    NUNCA vira telemetria. É a linha mais importante deste arquivo. Medir
 *    "quantas pessoas escreveram isso" seria transformar o pior momento de
 *    alguém em métrica de produto.
 *  · **não muda o estado do pet.** Nada de HP, humor ou registro.
 *
 * A linha "sou companhia, não tratamento" foi decidida FORA (D16): o dono
 * escolheu não abrir o chat com um aviso institucional. Fica a ponte, que é a
 * metade que protege a pessoa em vez do produto.
 *
 * ─── Sobre o léxico ──────────────────────────────────────────────────────
 * A régua não é "pegar tudo": é **não errar para mais**. Um falso positivo aqui
 * é grotesco — responder com o CVV a quem escreveu "tô morrendo de rir"
 * quebraria a confiança de um jeito difícil de recuperar, e ensinaria a pessoa
 * a não falar sério com o pet nunca mais. Por isso os padrões exigem a frase
 * quase inteira, em vez de palavras soltas, e existe uma lista explícita de
 * expressões que NUNCA casam.
 */

export type ChatSafetyLanguage = 'pt-BR' | 'en-US';

/**
 * Expressões idiomáticas comuns que contêm as mesmas palavras e não têm nada a
 * ver. Conferidas ANTES do léxico — a negativa vence sempre.
 */
const NUNCA_CASA: RegExp[] = [
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

/**
 * O léxico. Frases quase inteiras, de propósito: `sozinho` sozinho é o dia a
 * dia de muita gente; "não aguento mais viver" é outra coisa.
 */
const LEXICO: RegExp[] = [
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

/**
 * Sem acento, minúsculo. "nao quero mais viver" é como MUITA gente escreve
 * no celular, e o léxico com "não" não casava (skeptic #11). A MESMA
 * normalização vai no texto e nos padrões — senão o `ã` do padrão nunca
 * encontra o `a` do texto. `ç` também vira `c` (a cedilha é marca combinante).
 */
export function normalizarParaLexico(texto: string): string {
  return tirarAcentos(texto).toLowerCase();
}
function tirarAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
/** S\u00f3 tira acento do padr\u00e3o \u2014 NUNCA `toLowerCase()`, que transformaria `\S`
 *  em `\s` e inverteria a classe. As flags j\u00e1 t\u00eam `i`. */
const semAcento = (r: RegExp): RegExp => new RegExp(tirarAcentos(r.source), r.flags);
const NUNCA_CASA_N = NUNCA_CASA.map(semAcento);
const LEXICO_N = LEXICO.map(semAcento);

/** A pessoa escreveu algo que pede a ponte? */
export function needsBridge(mensagem: string): boolean {
  const texto = normalizarParaLexico(String(mensagem ?? ''));
  if (!texto.trim()) return false;
  if (NUNCA_CASA_N.some(r => r.test(texto))) return false;
  return LEXICO_N.some(r => r.test(texto));
}

/**
 * A resposta local. Na voz do pet, curta, sem susto — e ela FICA: "tô aqui" é
 * a única coisa que um bichinho pode honestamente oferecer, e oferecer isso
 * junto do número de quem sabe ajudar é o máximo que o app deve fazer.
 *
 * O CVV (188) é gratuito, 24h, em todo o Brasil. Em inglês vai a rede
 * internacional, porque o app não sabe em que país a pessoa está e um número
 * local errado é pior que nenhum.
 */
export function bridgeReply(language: ChatSafetyLanguage): string {
  return language === 'pt-BR'
    ? 'Eu tô aqui com você. Não vou saber o que dizer, mas tem gente que sabe: o CVV atende de graça, 24 horas, no 188. Você não precisa passar por isso sozinho.'
    : "I'm right here with you. I won't know what to say, but there are people who do — a crisis line can talk with you any time, for free: findahelpline.com lists the one for your country. You don't have to go through this alone.";
}

/**
 * O que o chat deve fazer com esta mensagem.
 * `local` = responde daqui e **não chama a IA**.
 */
export function chatSafetyDecision(
  mensagem: string,
  language: ChatSafetyLanguage,
): { kind: 'local'; reply: string } | { kind: 'pass' } {
  return needsBridge(mensagem)
    ? { kind: 'local', reply: bridgeReply(language) }
    : { kind: 'pass' };
}
