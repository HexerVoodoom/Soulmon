// ---------------------------------------------------------------------------
// MINIMIZAÇÃO NA FRONTEIRA COM O PROCESSADOR DE IA (Groq, EUA)
//
// N-3 do relatório de segurança. O caminho REAL do texto livre até o Groq é
// (verificado nesta rodada, e é diferente do que o relatório afirmava):
//
//   1. `src/components/ChatBox.tsx:127`  → `message` = o que o usuário DIGITA
//      para o pet → `functions/api/chat.js:96` → Groq. Este é o principal.
//   2. `src/components/GameTutorialFlow.tsx:149` → `goalText` (estado LOCAL do
//      tutorial, não `soulGoal`) → `src/utils/taskSuggestions.ts:23` →
//      `functions/api/suggest-tasks.js:50` → Groq.
//   3. `CompanionHUD.tsx:298,338` manda só template nosso (`[ALEATÓRIO] …`),
//      sem texto do usuário.
//
//   `soulGoal`/`soulStruggle` NÃO passam por nenhuma dessas rotas — vão ao KV
//   pelo cloud save e são lidos localmente. Zero ocorrências em `taskSuggestions`.
//
// O que esta camada faz e o que não faz:
//   - FAZ: tirar identificadores DIRETOS (e-mail, telefone com ou sem DDD,
//     CPF/CNPJ, cartão, URL, @handle) e três QUASE-identificadores baratos de
//     pegar (CEP, data `dd/mm/aaaa`) antes de o texto sair da nossa borda, e
//     limitar tamanho.
//     Isso é minimização (LGPD art. 6º, III) e reduz o dano de um vazamento no
//     processador.
//   - NÃO FAZ: tornar o conteúdo não-sensível. "Estou em depressão" continua
//     sendo dado de saúde e continua saindo do país. Isso não se resolve com
//     regex: exige base legal, aviso no ponto de coleta e política publicada —
//     itens do dono, não de código.
//   - NÃO manda identidade junto: `chat.js`/`suggest-tasks.js` usam `body.id`
//     só no guard de cota; o `saveId` nunca vai no corpo enviado ao Groq. O
//     texto chega lá pseudonimizado, e isso é verificado por teste.
// ---------------------------------------------------------------------------

/** Ordem importa: o mais específico primeiro (CPF antes de "sequência longa"). */
const RULES = [
  { kind: 'email', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g, tag: '[email]' },
  { kind: 'url', re: /\b(?:https?:\/\/|www\.)\S+/gi, tag: '[link]' },
  { kind: 'cpf', re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, tag: '[documento]' },
  { kind: 'cnpj', re: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, tag: '[documento]' },
  { kind: 'phone', re: /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,3}\)[\s.-]?|\b\d{2,3}[\s.-])\d{4,5}[\s.-]?\d{4}\b/g, tag: '[telefone]' },
  // QA rodada 1 (achado 06 §6.1, baixo): três quase-identificadores que
  // passavam inteiros. CEP e data ANTES do celular curto — `12345-678` e
  // `21/09/1990` não podem ser mastigados pela metade por outra regra.
  //  · CEP `12345-678`: sozinho localiza um quarteirão; junto com o resto da
  //    frase, uma pessoa.
  //  · data `dd/mm/aaaa`: no texto livre de um app deste tipo é, quase sempre,
  //    a data de nascimento — o mesmo dado que `soulmon-profile` guarda só no
  //    aparelho de propósito.
  //  · celular SEM DDD (8 ou 9 dígitos, `98765-4321`/`987654321`/`3456-7890`):
  //    a regra de telefone exigia DDD e a de "sequência longa" exigia ≥ 11
  //    dígitos, então o número mais comum de se digitar caía no vão. O 9 no
  //    início é opcional para não deixar fixo passar; 8 dígitos contíguos
  //    (`20260921`) também caem aqui — quase-identificador de qualquer jeito.
  { kind: 'cep', re: /\b\d{5}-\d{3}\b/g, tag: '[cep]' },
  { kind: 'date', re: /\b\d{2}\/\d{2}\/\d{4}\b/g, tag: '[data]' },
  { kind: 'phone', re: /\b9?\d{4}[\s.-]?\d{4}\b/g, tag: '[telefone]' },
  { kind: 'digits', re: /\b\d[\d\s.-]{9,}\d\b/g, tag: '[número]' },
  { kind: 'handle', re: /(^|\s)@[A-Za-z0-9_.]{2,}/g, tag: '$1[perfil]' },
];

/**
 * Remove identificadores diretos e corta o texto.
 *
 * @returns {{ text: string, redactions: Record<string, number>, truncated: boolean }}
 *   `redactions` conta por tipo — é o que se pode logar. **Nunca logue o texto.**
 */
export function minimizeForAi(input, maxLength = 500) {
  const original = (input ?? '').toString();
  let text = original;
  /** @type {Record<string, number>} */
  const redactions = {};

  for (const { kind, re, tag } of RULES) {
    text = text.replace(re, (match, ...rest) => {
      redactions[kind] = (redactions[kind] || 0) + 1;
      // A regra de handle preserva o espaço anterior ($1); as outras não capturam.
      return tag.includes('$1') ? `${rest[0] ?? ''}${tag.replace('$1', '')}` : tag;
    });
  }

  const truncated = text.length > maxLength;
  if (truncated) text = text.slice(0, maxLength);

  return { text, redactions, truncated };
}

/** `true` se alguma coisa foi removida — útil para métrica, sem expor conteúdo. */
export function redactionCount(redactions) {
  return Object.values(redactions).reduce((a, b) => a + b, 0);
}
