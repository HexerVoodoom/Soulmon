/**
 * Nome PÚBLICO do especial do Soulmon, escolhido pelo jogador. Regra pura (sem KV, sem import pesado): o servidor
 * (`community.js`) e a tela do Laboratório usam a MESMA função. O servidor ainda passa o texto pela régua de contato
 * do apelido (`sanitizarNomeDeGuilda`, `_coop.js`) — este módulo não a importa para não arrastar o `_coop` ao bundle.
 *
 * Forma: até 20 caracteres, só letras, números e espaço. Filtro de palavrão PT + EN: conservador, por palavra inteira
 * (sem "Scunthorpe" em "Classic") e, para as raízes inequívocas e longas, também no texto colado (burla com espaço).
 * Normaliza maiúsculas, acento, "leet", homóglifos (cirílico/grego/largura total), letras repetidas ("fuuuck") e letras
 * separadas ("f u c k"). Recusa também CONTATO (URL, e-mail, telefone, @usuário) e mistura de alfabetos na mesma palavra.
 */

export const ESPECIAL_NOME_MAX = 20;
/** Trocar o nome: uma vez por semana (decidido NO SERVIDOR; a tela só explica). */
export const ESPECIAL_NOME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/** "Leet" e símbolos que fingem letra. Só entram na dobra de palavrão: o telefone conta os dígitos no texto original. */
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i', '|': 'i', '€': 'e', '£': 'l' };
/** Homóglifos: letras de outro alfabeto (cirílico/grego) e latinas especiais que se desenham como letra latina. */
const HOMOGLIFOS = {
  а: 'a', в: 'b', е: 'e', ё: 'e', к: 'k', м: 'm', н: 'h', о: 'o', р: 'p', с: 'c', т: 't', у: 'y', х: 'x', і: 'i', ї: 'i', ј: 'j', ѕ: 's', ԁ: 'd', ԛ: 'q', ԝ: 'w', ӏ: 'i', ь: 'b', ч: 'y', ш: 'w',
  α: 'a', β: 'b', γ: 'y', ε: 'e', ζ: 'z', η: 'n', ι: 'i', κ: 'k', μ: 'u', ν: 'v', ο: 'o', ρ: 'p', σ: 'o', τ: 't', υ: 'u', χ: 'x', ω: 'w',
  ı: 'i', ł: 'l', ø: 'o', đ: 'd', ð: 'd', þ: 'p', ƒ: 'f', ɡ: 'g', ɑ: 'a', ß: 'ss', æ: 'ae', œ: 'oe',
};
/** Segunda leitura das letras ambíguas (como SOAM, não como parecem): "у" é "y" no desenho e "u" na pronúncia. */
const HOMOGLIFOS_ALT = { ...HOMOGLIFOS, у: 'u', в: 'v', н: 'n', р: 'r', ч: 'c', ь: '', γ: 'g', η: 'h', ν: 'n', υ: 'y', μ: 'm', σ: 's' };

const colapsa = (s) => s.replace(/(.)\1+/g, '$1');
function dobra(s, mapa) {
  return String(s ?? '')
    .normalize('NFKC')
    .replace(/[\p{Cf}\p{Cc}]/gu, '') // largura zero, direção, controle
    .normalize('NFD').replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[\s\S]/gu, (c) => mapa[c] ?? LEET[c] ?? c);
}
/** As duas leituras do texto (aparência e som) para a mesma checagem. */
const dobras = (s) => [dobra(s, HOMOGLIFOS), dobra(s, HOMOGLIFOS_ALT)];

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

/** Tokens de letras; uma sequência de letras soltas ("f u c k") vira uma palavra só. */
function tokens(n) {
  const out = [];
  let solta = '';
  for (const t of n.split(/[^a-z]+/).filter(Boolean)) {
    if (t.length === 1) { solta += t; continue; }
    if (solta) { out.push(solta); solta = ''; }
    out.push(t);
  }
  if (solta) out.push(solta);
  return out.map(colapsa);
}

/** `true` se o texto carrega palavrão PT/EN. */
export function temPalavrao(texto) {
  return dobras(texto).some((n) => {
    if (tokens(n).some((t) => SET_PALAVRAS.has(t))) return true;
    const colado = colapsa(n.replace(/[^a-z]/g, ''));
    return LISTA_RAIZES.some((r) => colado.includes(r));
  });
}

/** Palavras de contato que valem INTEIRAS (serviços e verbos de endereço). */
const CONTATO_PALAVRAS = new Set([
  'http', 'https', 'www', 'dot', 'ponto', 'arroba', 'gmail', 'hotmail', 'outlook', 'yahoo', 'icloud', 'protonmail', 'discord', 'telegram',
  'whatsapp', 'whats', 'wpp', 'zap', 'insta', 'instagram', 'tiktok', 'twitter', 'twitch', 'youtube', 'snapchat', 'facebook', 'kwai',
  'onlyfans', 'paypal', 'pix', 'linktree', 'tme', 'wame', 'fone', 'celular', 'telefone', 'phone', 'email', 'mail',
].map(colapsa));
/** Marcas longas que não aparecem dentro de palavra legítima: valem também coladas. */
const CONTATO_RAIZES = ['gmail', 'hotmail', 'outlook', 'whatsapp', 'telegram', 'instagram', 'discord', 'tiktok', 'onlyfans', 'youtube', 'facebook', 'snapchat', 'linktree', 'protonmail', 'arroba', 'http', 'www'].map(colapsa);
/** Menos dígitos que isto passa (ano, nível, "Mk 2"); a partir daqui é telefone/documento. */
const DIGITOS_CONTATO = 6;

/**
 * `true` se o texto parece CONTATO: URL, e-mail, telefone, @usuário, convite ("discord fulano", "insta fulano").
 * Mesma dobra do palavrão (homóglifo, leet, largura total, separadores entre letras); os dígitos contam no texto
 * ORIGINAL, para o leet do telefone não esconder número.
 */
export function temContato(texto) {
  const bruto = String(texto ?? '').normalize('NFKC').replace(/[\p{Cf}\p{Cc}]/gu, '');
  if (/[@#]/.test(bruto) || /:\/\//.test(bruto)) return true;
  if (/[\p{L}\p{N}-]+\.(?:com|me|gg|io|net|org|br|tv|ly|app|co|xyz|link|bio)(?![\p{L}\p{N}])/iu.test(bruto)) return true;
  if ((bruto.match(/\p{Nd}/gu) ?? []).length >= DIGITOS_CONTATO) return true;
  return dobras(bruto).some((n) => {
    if (tokens(n).some((t) => CONTATO_PALAVRAS.has(t))) return true;
    const colado = colapsa(n.replace(/[^a-z]/g, ''));
    return CONTATO_RAIZES.some((r) => colado.includes(r));
  });
}

/** Alfabeto de uma letra: latino ou "outro" (cirílico, grego, armênio... os que se passam por latino). Dígito não conta. */
const alfabeto = (c) => (/\p{Script=Latin}/u.test(c) ? 'lat' : /\p{L}/u.test(c) ? 'outro' : '');
/** Palavra que mistura latino com outro alfabeto: é disfarce (nome real não mistura), recusa. */
function misturaAlfabetos(texto) {
  return texto.split(' ').some((w) => new Set(Array.from(w).map(alfabeto).filter(Boolean)).size > 1);
}

/**
 * Forma + filtro. Devolve o nome limpo, ou `null` (vazio, longo, caractere fora do conjunto, palavrão, contato ou
 * alfabetos misturados).
 * @param {unknown} raw
 * @returns {string | null}
 */
export function nomeEspecialValido(raw) {
  if (typeof raw !== 'string') return null;
  const limpo = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!limpo || Array.from(limpo).length > ESPECIAL_NOME_MAX) return null;
  if (!/^[\p{L}\p{N} ]+$/u.test(limpo)) return null;
  if (misturaAlfabetos(limpo)) return null;
  if (temPalavrao(limpo) || temContato(limpo)) return null;
  return limpo;
}
