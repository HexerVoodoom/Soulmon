// FAIXA DE EVOLUÇÕES (04/11/2026, pedido do dono): "<jogador> acabou de evoluir <criatura> para o nível <forma> através da <alinhamento>".
// Um feed GLOBAL e curto, escrito pelo servidor quando o perfil público de alguém sobe de estágio (`community.js`, ação `profile`).
//
// PRIVACIDADE (REGISTRO, TORC-5 e o gate de Vínculo 5): o apelido só entra no feed de quem JÁ aparece na lista pública — Vínculo no gate de PvP e
// SEM `publicHidden`. Quem se esconde (agora ou depois) some do feed: `purgeFeedOf` roda na troca do interruptor. Nada de saveId/pid na resposta.
// Todo texto é de lista fechada (estágio, alinhamento) ou já saneado (apelido e nome da criatura, `sanitizarNomeDeGuilda`), nunca texto livre do cliente.
//
// Puro: sem KV nem relógio próprio (`now` por parâmetro). Quem lê e grava é `community.js`.

export const EVO_FEED_KEY = 'evofeed:v1';
export const EVO_FEED_MAX = 20;
export const EVO_FEED_TTL_MS = 24 * 60 * 60 * 1000;
/** Quantos eventos a resposta pública devolve. */
export const EVO_FEED_VIEW = 10;

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

/** O evento (sem saveId público): `by` é interno, só serve para retirar quem se esconde, e NUNCA sai na resposta. */
export function buildEvent({ by, name, petName, stage, now }) {
  const s = parseStage(stage);
  if (!s || !name || !petName) return null;
  return { by, name, pet: petName, tier: s.tier, branch: s.branch, at: now };
}

/** Lê o feed gravado (texto JSON) com defesa: lixo vira lista vazia. */
export function readFeed(raw) {
  try {
    const arr = JSON.parse(raw ?? '[]');
    return Array.isArray(arr) ? arr.filter(e => e && typeof e === 'object' && typeof e.at === 'number') : [];
  } catch { return []; }
}

/** Acrescenta um evento: mais novo primeiro, sem repetir o mesmo (jogador, estágio), podado por idade e por tamanho. */
export function pushEvent(feed, ev, now) {
  const vivo = feed.filter(e => now - e.at < EVO_FEED_TTL_MS && !(e.by === ev.by && e.tier === ev.tier && e.branch === ev.branch));
  return [ev, ...vivo].slice(0, EVO_FEED_MAX);
}

/** Retira todos os eventos de uma conta (ela se escondeu da lista pública). */
export function purgeFeedOf(feed, by) {
  return feed.filter(e => e.by !== by);
}

/** A vista pública: só o que a faixa mostra. Sem `by`, sem saveId, sem horário exato além do `at` (para ordenar/dedupe no cliente). */
export function feedView(feed, now) {
  return feed
    .filter(e => now - e.at < EVO_FEED_TTL_MS)
    .slice(0, EVO_FEED_VIEW)
    .map(e => ({ name: e.name, pet: e.pet, tier: e.tier, branch: e.branch, at: e.at }));
}
