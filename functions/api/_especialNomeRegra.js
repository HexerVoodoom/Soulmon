/**
 * Nome PÚBLICO do especial do Soulmon, escolhido pelo jogador. Regra pura (sem KV, sem import pesado): o servidor
 * (`community.js`) e a tela do Laboratório usam a MESMA função. O servidor ainda passa o texto pela régua de contato
 * do apelido (`sanitizarNomeDeGuilda`, `_coop.js`) — este módulo não a importa para não arrastar o `_coop` ao bundle.
 *
 * Forma: até 20 caracteres, só letras, números e espaço. Filtro de palavrão PT + EN: conservador, por palavra inteira
 * (sem "Scunthorpe" em "Classic") e, para as raízes inequívocas e longas, também no texto colado (burla com espaço).
 * Normaliza maiúsculas, acento, "leet" (0 1 3 4 5 7) e letras repetidas ("fuuuck").
 */

export const ESPECIAL_NOME_MAX = 20;
/** Trocar o nome: uma vez por semana (decidido NO SERVIDOR; a tela só explica). */
export const ESPECIAL_NOME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't' };
const colapsa = (s) => s.replace(/(.)\1+/g, '$1');
const normaliza = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[013457]/g, (c) => LEET[c] ?? c);

/** Palavras que só valem INTEIRAS (podem estar dentro de palavra legítima). */
const PALAVRAS = [
  // PT
  'porra', 'puta', 'puto', 'foda', 'fodase', 'foder', 'fodido', 'fodida', 'cu', 'cuzao', 'bosta', 'babaca', 'otario', 'otaria',
  'retardado', 'mongol', 'cacete', 'piroca', 'rola', 'pica', 'vadia', 'piranha', 'corno', 'estupro', 'estuprador', 'nazista', 'pedofilo',
  // EN
  'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'asshole', 'ass', 'whore', 'slut', 'bastard', 'nazi',
  'rape', 'rapist', 'cum', 'sex', 'porn', 'anal', 'tits', 'boobs', 'retard', 'fag', 'dyke', 'tranny', 'chink', 'spic', 'kike', 'coon', 'paki',
  'nigger', 'nigga', 'hitler', 'molester', 'pedo',
];
/** Raízes longas e sem uso legítimo: valem também dentro do texto sem espaços. */
const RAIZES = [
  'caralho', 'buceta', 'boceta', 'xoxota', 'xereca', 'punheta', 'arrombad', 'vagabund', 'viado', 'merda', 'pedofil', 'estupr', 'cuzao',
  'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'nigga', 'faggot', 'whore', 'pussy', 'asshole', 'hitler', 'motherfuck', 'cocksuck',
];
const SET_PALAVRAS = new Set(PALAVRAS.map((w) => colapsa(w)));
const LISTA_RAIZES = RAIZES.map((w) => colapsa(w));

/** `true` se o texto carrega palavrão PT/EN. */
export function temPalavrao(texto) {
  const n = normaliza(String(texto ?? ''));
  const tokens = n.split(/[^a-z]+/).filter(Boolean).map(colapsa);
  if (tokens.some((t) => SET_PALAVRAS.has(t))) return true;
  const colado = colapsa(n.replace(/[^a-z]/g, ''));
  return LISTA_RAIZES.some((r) => colado.includes(r));
}

/**
 * Forma + filtro. Devolve o nome limpo, ou `null` (vazio, longo, caractere fora do conjunto ou palavrão).
 * @param {unknown} raw
 * @returns {string | null}
 */
export function nomeEspecialValido(raw) {
  if (typeof raw !== 'string') return null;
  const limpo = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!limpo || Array.from(limpo).length > ESPECIAL_NOME_MAX) return null;
  if (!/^[\p{L}\p{N} ]+$/u.test(limpo)) return null;
  if (temPalavrao(limpo)) return null;
  return limpo;
}
