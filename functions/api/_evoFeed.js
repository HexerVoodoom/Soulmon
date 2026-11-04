// FAIXA DE EVOLUÇÕES (04/11/2026, pedido do dono): "<jogador> acabou de evoluir <criatura> para o nível <forma> através da <alinhamento>".
// Um feed GLOBAL e curto, escrito pelo servidor quando o estágio CONFIRMADO PELO SAVE passa do pico da conta (`community.js`, ação `profile`).
//
// PRIVACIDADE (REGISTRO, TORC-5 e o gate de Vínculo 5): o apelido só sai de quem aparece na lista pública AGORA. O filtro decisivo é na LEITURA
// (`community.js`, ação `evoFeed`): perfil ausente, escondido ou sem PvP não sai, e nome e criatura são os ATUAIS. `purgeFeedOf` é a limpeza do blob
// (esconder-se, desligar o PvP, excluir a conta). Nada de saveId/pid na resposta.
// CONTEÚDO: estágio e alinhamento são de lista fechada; apelido e criatura passam por `feedText` (sem controle/bidi, sem contato, sem palavrão).
// ABUSO: pico que só sobe (`evoPeakRank`), cooldown por conta (`evoFeedAt`) e no máximo 1 evento por conta.
//
// Puro: sem KV nem relógio próprio (`now` por parâmetro). Quem lê e grava é `community.js` (e `account.js`, na exclusão).
import { sanitizarNomeDeGuilda } from './_coop.js';
import { temPalavrao } from './_especialNomeRegra.js';

export const EVO_FEED_KEY = 'evofeed:v1';
export const EVO_FEED_MAX = 20;
export const EVO_FEED_TTL_MS = 24 * 60 * 60 * 1000;
/** O blob expira sozinho no KV: sem evolução nova por 2 dias, nada do feed fica guardado. */
export const EVO_FEED_BLOB_TTL_S = 2 * 24 * 60 * 60;
/** Quantos eventos a resposta pública devolve. */
export const EVO_FEED_VIEW = 10;
/** Entre dois avisos da mesma conta. */
export const EVO_FEED_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const FEED_TEXT_MAX = 32;

/** Estágios em ordem de evolução. `bb` (forma especial) e `rookie` (ponto de partida) não geram aviso: o aviso é a partir do Champion. */
const TIERS = ['bb', 'rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const BRANCHES = ['power', 'harmony', 'benevolence'];

/** `champion-power` → `{ tier: 'champion', branch: 'power', rank: 2 }`; id fora da lista → `null`. */
export function parseStage(id) {
  if (typeof id !== 'string') return null;
  const [tier, branch, ...resto] = id.split('-');
  const rank = TIERS.indexOf(tier);
  if (rank < 0 || resto.length) return null;
  if (branch !== undefined && !BRANCHES.includes(branch)) return null;
  return { tier, branch: branch ?? null, rank };
}

/** O estágio `next` é uma EVOLUÇÃO sobre `prev` (sobe de tier, chega ao Champion ou mais)? Sem estágio anterior conhecido, não é: evita anunciar o 1º perfil. */
export function isEvolution(prev, next) {
  const a = parseStage(prev);
  const b = parseStage(next);
  if (!a || !b) return false;
  return b.rank >= TIERS.indexOf('champion') && b.rank > a.rank;
}

/** O pico gravado; perfil antigo (sem o campo) parte do estágio que tinha; perfil novo, `null` (o 1º perfil não anuncia). */
export function peakOf(prev) {
  if (Number.isInteger(prev?.evoPeakRank)) return prev.evoPeakRank;
  return parseStage(prev?.stage)?.rank ?? null;
}

/**
 * A decisão do aviso, pura. `savedStage` é o `evolutionStage` do SAVE no servidor: o corpo do perfil é texto do cliente e sozinho não prova nada.
 * O pico sobe com o estágio do save mesmo sem anunciar (escondido, sem PvP, em cooldown): evolução não vira aviso atrasado.
 * @returns {{ peak: number | null, announce: boolean }}
 */
export function decideEvo({ peak, stage, savedStage, lastAt, now }) {
  const salvo = parseStage(savedStage);
  if (!salvo) return { peak, announce: false };
  const novoPico = peak === null ? salvo.rank : Math.max(peak, salvo.rank);
  const announce = peak !== null
    && stage === savedStage
    && salvo.rank >= TIERS.indexOf('champion')
    && salvo.rank > peak
    && !(Number(lastAt) > 0 && now - Number(lastAt) < EVO_FEED_COOLDOWN_MS);
  return { peak: novoPico, announce };
}

/** Apelido/criatura para o feed: tira controle e bidi, recusa contato e palavrão. Vale só aqui: as outras listas seguem com o apelido como está. `null` = não publica. */
export function feedText(v) {
  if (typeof v !== 'string') return null;
  // Remove (não troca por espaço): "Car\u200Balho" não pode escapar do filtro nem chegar ao texto.
  const semControle = v.normalize('NFKC').replace(/\p{C}/gu, '').replace(/\s+/g, ' ').trim();
  const limpo = sanitizarNomeDeGuilda(semControle);
  if (!limpo || temPalavrao(limpo)) return null;
  return Array.from(limpo).slice(0, FEED_TEXT_MAX).join('').trim() || null;
}

/** O evento (sem saveId público): `by` é interno, só serve para retirar quem se esconde, e NUNCA sai na resposta. */
export function buildEvent({ by, name, petName, stage, now }) {
  const s = parseStage(stage);
  const nome = feedText(name);
  const pet = feedText(petName);
  if (!s || !nome || !pet) return null;
  return { by, name: nome, pet, tier: s.tier, branch: s.branch, at: now };
}

/** Lê o feed gravado (texto JSON) com defesa: lixo vira lista vazia. */
export function readFeed(raw) {
  try {
    const arr = JSON.parse(raw ?? '[]');
    return Array.isArray(arr) ? arr.filter(e => e && typeof e === 'object' && typeof e.at === 'number' && typeof e.by === 'string') : [];
  } catch { return []; }
}

/** Acrescenta um evento: mais novo primeiro, no máximo 1 por conta, podado por idade e por tamanho. */
export function pushEvent(feed, ev, now) {
  const vivo = feed.filter(e => now - e.at < EVO_FEED_TTL_MS && e.by !== ev.by);
  return [ev, ...vivo].slice(0, EVO_FEED_MAX);
}

/** Retira todos os eventos de uma conta (ela se escondeu, desligou o PvP ou excluiu a conta). */
export function purgeFeedOf(feed, by) {
  return feed.filter(e => e.by !== by);
}

/** O que ainda pode sair: dentro da idade e 1 por conta (duas gravações concorrentes no KV podem deixar repetido no blob). */
export function liveFeed(feed, now) {
  const contas = new Set();
  return feed.filter(e => {
    if (now - e.at >= EVO_FEED_TTL_MS || contas.has(e.by)) return false;
    contas.add(e.by);
    return true;
  });
}

/** A vista pública de um evento com o perfil ATUAL. Sem `by`, sem saveId. Nome ou criatura que hoje não passam: `null`. */
export function publicEvent(ev, profile) {
  const name = feedText(profile?.name);
  const pet = feedText(profile?.petName);
  if (!name || !pet) return null;
  return { name, pet, tier: ev.tier, branch: ev.branch ?? null, at: ev.at };
}
