// COOPERATIVO — o estado do grupo (chaves, prazos, leitura/gravação) e a
// operação de SAIR, num módulo próprio.
//
// Por que saiu de `community.js` (QA rodada 2, `04-dados-r2` §1.3): a exclusão
// de conta (`account.js` › `handleDeleteConfirm`) precisa tirar o titular do
// grupo — `coop:<gid>.members`, `coopOf:<saveId>` e `coopCk:<gid>:<saveId>`
// ficavam 120 d depois de a conta sumir, e o membro apagado virava FANTASMA:
// `target = members.length × 5` continuava contando com ele, e o grupo nunca
// mais batia a meta, sem nenhum evento que explicasse. O corpo de `coopLeave`
// já existia na rota; importar `community.js` inteiro dentro da exclusão
// arrastaria o rate limit, o torneio e o diretório para dentro de `account.js`.
// Aqui mora só o que os dois precisam. `community.js` continua sendo a ÚNICA
// montagem de resposta (`vistaDoGrupo`) — nada daqui sai para o cliente.

import { VALID_ID } from './_entitlements.js';
import { kvOrThrow } from './_kv.js';
import { minimizeForAi, redactionCount } from './_redact.js';

/** Teto da Guilda (D-G1: o coop EVOLUI para guilda de até 12). Era 4. */
export const COOP_MAX_MEMBERS = 12;
export const GUILD_MAX_MEMBERS = COOP_MAX_MEMBERS;
/** Até quantos membros a presença sai NOMINAL (G4). Acima disso, só o agregado
 *  qualitativo `threadedToday` — com 5+ pessoas, "quem veio" vira "quem faltou". */
export const PRESENCA_NOMINAL_MAX = 4;
/** Check-ins por membro por semana. 5 e não 7: exigir dia perfeito por pressão
 *  social desfaz o perdão de ausência da Fase 1 (`PLANO-EVOLUCAO.md` §1.2). */
export const COOP_CHECKINS_POR_MEMBRO = 5;
export const COOP_TTL = 86400 * 120;

/** Semana ISO (`YYYY-Www`) — a chave que faz o progresso rolar sozinho na
 *  virada, sem job agendado. Mesmo padrão da season. */
export function semanaDe(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // A quinta-feira da mesma semana define o ano ISO.
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const inicio = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  // `.getTime()` explícito: subtrair dois `Date` funciona em runtime (o JS
  // coage por `valueOf`), mas o typecheck do servidor recusa — eram os outros
  // 2 dos 5 erros que deixavam o CI vermelho. Mesma aritmética, zero mudança
  // de comportamento.
  const n = Math.ceil(((t.getTime() - inicio.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(n).padStart(2, '0')}`;
}

/**
 * O DIA DO JOGADOR, validado (override de G6 — `PLANO-GUILDA.md` §0.1).
 *
 * O servidor não conhece o fuso do save, então quem diz o dia é o cliente
 * (`playerDayKey`, formato `toDateString` — `Mon Sep 29 2026` — ou `YYYY-MM-DD`).
 * Aceitar qualquer dia deixaria marcar a semana inteira de uma vez; por isso o
 * dia só vale a no máximo ±1 do dia UTC de agora, que é a faixa real dos fusos
 * civis (UTC−12..UTC+14). Sem `dayKey` (cliente antigo), vale o dia UTC.
 *
 * @returns {{ ok: true, day: string } | { ok: false }}  `day` em `YYYY-MM-DD`
 */
const MESES = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
export function diaDoJogador(raw, now = new Date()) {
  const hojeUtc = now.toISOString().slice(0, 10);
  if (raw === undefined || raw === null || raw === '') return { ok: true, day: hojeUtc };
  const s = String(raw).trim();
  let y, m, d;
  let r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (r) { y = +r[1]; m = +r[2] - 1; d = +r[3]; }
  else {
    r = /^[A-Z][a-z]{2} ([A-Z][a-z]{2}) (\d{2}) (\d{4})$/.exec(s);
    if (!r || !(r[1] in MESES)) return { ok: false };
    y = +r[3]; m = MESES[r[1]]; d = +r[2];
  }
  const t = Date.UTC(y, m, d);
  const dt = new Date(t);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m || dt.getUTCDate() !== d) return { ok: false };
  const diff = Math.abs(t - Date.parse(`${hojeUtc}T00:00:00Z`)) / 86400000;
  if (diff > 1) return { ok: false };
  return { ok: true, day: dt.toISOString().slice(0, 10) };
}

/** Semana ISO de um dia `YYYY-MM-DD` (o dia do jogador, já validado). */
export const semanaDoDia = day => semanaDe(new Date(`${day}T00:00:00Z`));

/** Teto do nome da guilda E do apelido do perfil — a mesma régua nos dois. */
export const NOME_MAX = 24;

/**
 * Nome da guilda / apelido do perfil (D-1, `05-servidor.md` §5.1). Texto do
 * jogador lido por OUTRAS pessoas: normaliza (NFKC, sem caractere de controle,
 * espaço colapsado), e RECUSA — devolve `null` — o que carrega contato: e-mail,
 * telefone, URL, documento ou `@`. Recusar e não mascarar: publicar `[email]`
 * como nome não é nome. A verificação roda sobre o texto INTEIRO antes do
 * corte, senão um contato longo passaria cortado ao meio.
 *
 * Não passa por `_aiGuard.js`: não há chamada de IA aqui, e o guard é de cota.
 * @returns {string | null}
 */
export function sanitizarNomeDeGuilda(raw) {
  const limpo = String(raw ?? '').normalize('NFKC')
    .replace(/\p{C}/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!limpo) return null;
  if (limpo.includes('@')) return null;
  const { redactions } = minimizeForAi(limpo, 200);
  if (redactionCount(redactions) > 0) return null;
  const nome = limpo.slice(0, NOME_MAX).trim();
  return nome || null;
}

export const coopKey = gid => `coop:${gid}`;
export const coopOfKey = save => `coopOf:${save}`;
export const coopCodeKey = code => `coopCode:${code}`;
/**
 * Os check-ins de UM membro, numa chave só dele.
 *
 * ⚠️ ELES NÃO MORAM MAIS DENTRO DO BLOB DO GRUPO, e o motivo é uma corrida
 * real. O KV da Cloudflare não tem transação nem compare-and-set: `coopCheckin`
 * fazia ler-modificar-gravar sobre o objeto do grupo INTEIRO, então dois
 * membros marcando presença na mesma noite (o caso normal de um grupo de 4,
 * não um caso exótico) liam a mesma versão e a segunda gravação apagava a
 * primeira. O check-in sumia **em silêncio**: ninguém via erro, e o progresso
 * do grupo — que é a única coisa que o modo inteiro entrega — ficava menor que
 * a verdade.
 *
 * Com uma chave por membro, cada pessoa só escreve sobre si mesma e a corrida
 * deixa de existir: não há mais campo compartilhado no caminho quente. O blob
 * do grupo passa a mudar só em criar/entrar/sair, que são eventos raros.
 */
export const coopCkKey = (gid, save) => `coopCk:${gid}:${save}`;

export function novoCodigo() {
  // Sem 0/O/1/I: o código é lido em voz alta e digitado à mão.
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(x => alfabeto[x % alfabeto.length]).join('');
}

/**
 * Um código de convite que ainda não está em uso, ou `null` depois de três
 * colisões. O `put` cego roubaria o código de outro grupo — que ficaria
 * inalcançável por convite, e a saída do último membro do grupo NOVO apagaria a
 * chave do VELHO junto. Com ~40 bits, três colisões seguidas não são sorte.
 */
export async function sortearCodigoLivre(env) {
  for (let i = 0; i < 3; i++) {
    const tentativa = novoCodigo();
    if (!(await kvOrThrow(env).get(coopCodeKey(tentativa)))) return tentativa;
  }
  return null;
}

export async function lerGrupo(env, groupId) {
  if (!VALID_ID.test(groupId || '')) return null;
  const raw = await kvOrThrow(env).get(coopKey(groupId));
  return raw ? JSON.parse(raw) : null;
}

/**
 * Grava o grupo E RENOVA OS DOIS ÍNDICES que apontam para ele.
 *
 * ⚠️ Renovar os índices junto não é zelo, é correção. As três chaves nascem com
 * o mesmo `COOP_TTL`, mas só `coop:<gid>` era reescrita a cada movimento — e
 * `coopOf:<save>` e `coopCode:<code>` eram escritas UMA vez, na entrada. Um
 * grupo vivo e ativo, passados 120 dias, perdia os dois índices enquanto o
 * blob seguia lá: cada membro passava a ver "você não está em nenhum grupo"
 * (`grupoDe` não acha o ponteiro, e ainda apaga o que sobrou), e o código de
 * convite deixava de abrir o grupo. Nada disso dá erro — o modo simplesmente
 * evapora para todo mundo ao mesmo tempo, sem nenhum evento que explique.
 */
export async function gravarGrupo(env, g) {
  // G17(a): guilda com Bosque plantado (`bosqueProgress > 0`) NÃO expira — o
  // que a roda construiu não evapora por inatividade. Sem progresso, 120 d.
  const semPrazo = Number(g.bosqueProgress ?? 0) > 0;
  await kvOrThrow(env).put(coopKey(g.id), JSON.stringify(g), semPrazo ? {} : { expirationTtl: COOP_TTL });
  // Os índices seguem o blob: blob sem prazo com ponteiro que expira seria o
  // mesmo "modo evapora" descrito acima, pelo lado oposto.
  const prazo = semPrazo ? {} : { expirationTtl: COOP_TTL };
  await Promise.all([
    kvOrThrow(env).put(coopCodeKey(g.code), g.id, prazo),
    ...g.members.map(m => kvOrThrow(env).put(coopOfKey(m), g.id, prazo)),
  ]);
  // O FIO renova junto (G17a): índice e blob sem prazo com o fio pessoal
  // expirando apagaria os dias distintos (cenários) e o `lastDay` (viajante) de
  // quem só voltou depois de 120 d. Relê cada chave imediatamente antes de
  // regravar o MESMO valor — não é read-modify-write, é renovação de prazo.
  await Promise.all(g.members.map(async m => {
    const raw = await kvOrThrow(env).get(coopFioKey(g.id, m));
    if (raw) await kvOrThrow(env).put(coopFioKey(g.id, m), raw, prazo);
  }));
}

/**
 * Os check-ins de um membro na semana corrente. Chave própria (ver `coopCkKey`),
 * com a semana DENTRO do registro: assim a virada de semana é lida, e não
 * escrita — quem abrir primeiro na semana nova simplesmente enxerga uma lista
 * vazia, sem job agendado e sem gravação de limpeza.
 */
/**
 * Renova o prazo das três chaves do grupo, sem mudar nada.
 *
 * A RELEITURA IMEDIATAMENTE ANTES DA GRAVAÇÃO é o ponto: gravar de volta a
 * cópia que o handler leu no começo da requisição desfaria uma entrada que
 * tivesse acontecido no meio dela. Reler encolhe essa janela para o intervalo
 * entre o `get` e o `put` — não a fecha (o KV não tem compare-and-set), e é por
 * isso que `coopJoin` confere a própria entrada depois de gravar.
 *
 * As duas chaves de índice não correm risco nenhum: o valor delas é constante
 * (o id do grupo), então duas gravações concorrentes escrevem o mesmo byte.
 */
export async function renovarPrazos(env, gid) {
  const fresco = await lerGrupo(env, gid);
  if (fresco) await gravarGrupo(env, fresco);
}

/** `semana` é calculada UMA vez por requisição e passada adiante (L1 BAIXO-6):
 *  ler na semana N e gravar na N+1 com os dias da N era uma janela real. */
export async function lerCheckins(env, gid, save, semana = semanaDe()) {
  const raw = await kvOrThrow(env).get(coopCkKey(gid, save));
  if (!raw) return [];
  try {
    const r = JSON.parse(raw);
    return r && r.weekKey === semana && Array.isArray(r.days) ? r.days : [];
  } catch { return []; }
}

export async function gravarCheckins(env, gid, save, days, semana = semanaDe()) {
  await kvOrThrow(env).put(
    coopCkKey(gid, save),
    JSON.stringify({ weekKey: semana, days }),
    { expirationTtl: COOP_TTL },
  );
}

/**
 * Zera o progresso quando a semana virou. Leitura preguiçosa, sem cron: quem
 * abrir primeiro na semana nova paga o custo, e ninguém precisa operar nada.
 */
export function rolarSemana(g, agora = semanaDe()) {
  // `g.checkins` é resíduo de grupo criado antes de os check-ins ganharem chave
  // própria. Ele é lido como fallback em `vistaDoGrupo` e some na virada da
  // semana, como sempre somiu — nenhum caminho novo volta a escrever nele.
  if (g.weekKey !== agora) { g.weekKey = agora; g.checkins = {}; }
  return g;
}

/** O grupo de quem pergunta, já rolado para a semana corrente. `null` se não há. */
export async function grupoDe(env, saveId, semana = semanaDe()) {
  const groupId = await kvOrThrow(env).get(coopOfKey(saveId));
  if (!groupId) return null;
  const g = await lerGrupo(env, groupId);
  // Índice apontando para grupo morto (ou do qual a pessoa já saiu) se limpa
  // aqui: é o mesmo custo de uma leitura e evita fantasma permanente no KV.
  if (!g || !g.members.includes(saveId)) { await kvOrThrow(env).delete(coopOfKey(saveId)); return null; }
  return rolarSemana(g, semana);
}

/**
 * Tira `saveId` do grupo em que está — sem penalidade, sem confirmação de
 * ninguém. É o corpo de `POST action=coopLeave` e também o passo da EXCLUSÃO
 * de conta. Idempotente: sem grupo, não faz nada e responde `{ left: false }`.
 *
 * O progresso de quem saiu some junto — a meta encolhe com o grupo, então o
 * que ele fez não pode continuar contando (`PLANO-COOP.md` §3.4). Grupo vazio
 * some na hora (blob + código) — sem lápide, sem "seu grupo morreu".
 *
 * @returns {Promise<{ left: boolean, groupId: string | null, remaining: number }>}
 */
export async function coopLeave(env, saveId, { exclusao = false, now = new Date() } = {}) {
  const lido = await grupoDe(env, saveId);
  if (!lido) return { left: false, groupId: null, remaining: 0 };
  // O FIO DE QUEM SAI NÃO SOME DO BOSQUE (LV-G3): o que já foi fechado está em
  // `bosqueProgress`; o que ainda não foi (dias depois de `progressDay`,
  // inclusive hoje) vira contagem ANÔNIMA em `fiosAvulsos` antes de a chave
  // pessoal ser apagada. Sair e ser excluído só mudam a taxa futura.
  const fio = await lerFio(env, lido.id, saveId);
  await kvOrThrow(env).delete(coopOfKey(saveId));
  await kvOrThrow(env).delete(coopCkKey(lido.id, saveId));
  await kvOrThrow(env).delete(coopFioKey(lido.id, saveId));
  await kvOrThrow(env).delete(coopGestKey(lido.id, saveId));
  if (exclusao) {
    // Exclusão de conta (§10.6): também os golpes (semana corrente e anterior).
    // `coopClaim` não depende do grupo e é apagado por `apagarClaims`.
    // O `coopHit` vive 21 d: três semanas cobrem tudo o que pode existir.
    const semanas = [0, 1, 2, 3].map(k => semanaDe(new Date(now.getTime() - k * 7 * 86400000)));
    await Promise.all(semanas.map(w => kvOrThrow(env).delete(coopHitKey(lido.id, w, saveId))));
  }
  // RELEITURA imediatamente antes de gravar (L1-codigo MÉDIO-2): gravar a
  // cópia lida no começo apagava quem tivesse ENTRADO no meio — e, com um
  // membro só, apagava o grupo inteiro por cima da entrada de outra pessoa,
  // que já tinha recebido 200. Não fecha a janela (o KV não tem CAS), encolhe
  // para o intervalo entre este `get` e o `put`/`delete`.
  const g = (await lerGrupo(env, lido.id)) ?? lido;
  g.members = (g.members || []).filter(m => m !== saveId);
  if (g.checkins) delete g.checkins[saveId];
  if (g.desde) delete g.desde[saveId];
  if (fio) {
    const pendentes = fio.days.filter(d => !g.progressDay || d > g.progressDay);
    if (pendentes.length) {
      g.fiosAvulsos = { ...(g.fiosAvulsos || {}) };
      for (const d of pendentes) g.fiosAvulsos[d] = (g.fiosAvulsos[d] ?? 0) + 1;
    }
  }
  // Anfitrião que sai passa a vez ao membro mais antigo, em silêncio (G7: não
  // há expulsão; a guilda nunca fica sem quem renomeia ou troca o código).
  if (g.hostSave === saveId || (g.hostSave && !g.members.includes(g.hostSave))) {
    g.hostSave = g.members[0] ?? null;
  }
  if (g.members.length === 0) {
    // Só apaga se a releitura AINDA estiver vazia de outros.
    const ultima = await lerGrupo(env, g.id);
    const outros = (ultima?.members || []).filter(m => m !== saveId);
    if (outros.length > 0) {
      const vivo = { ...ultima, fiosAvulsos: g.fiosAvulsos ?? ultima.fiosAvulsos, members: outros, hostSave: ultima.hostSave && outros.includes(ultima.hostSave) ? ultima.hostSave : outros[0] };
      await gravarGrupo(env, vivo);
      return { left: true, groupId: g.id, remaining: outros.length };
    }
    await kvOrThrow(env).delete(coopKey(g.id));
    await kvOrThrow(env).delete(coopCodeKey(g.code));
  } else {
    await gravarGrupo(env, g);
  }
  return { left: true, groupId: g.id, remaining: g.members.length };
}

// ===========================================================================
// O BOSQUE, O FIO, AS MARÉS E OS GESTOS (WPG-3a / WPG-3c, `PLANO-GUILDA.md` §3)
//
// DONO ÚNICO DAS CONSTANTES da Guilda (§3.1): nenhum outro arquivo inventa
// número — a simulação (`docs/reviews/guilda/sim/guilda-sim.mjs`) IMPORTA daqui.
// ===========================================================================

/** Um fio por membro por dia, nunca peso nem contagem de tarefa (LV-G8). */
export const FIO_PER_MEMBER_DAY = 1;
/** Limiares do Bosque em DIAS-DE-GUILDA (a cada dia fechado soma fios/ativos). */
export const BOSQUE_THRESHOLDS = Object.freeze([2, 10, 25, 50, 90]);
/** Ids estáveis dos cinco estágios (a copy é do cliente). */
export const BOSQUE_STAGES = Object.freeze(['clareira', 'ramagem', 'copa', 'mata', 'bosque-antigo']);
/** Fração do intervalo até o próximo marco abaixo da qual o Bosque está "perto".
 *  Sai como booleano — nunca "faltam N" (§6). */
export const BOSQUE_PERTO_FRACAO = 0.2;
/** Dias DISTINTOS (não seguidos, LV-G9) de fio para liberar os cenários de estágio. */
export const STAGE_UNLOCK_DAYS = 7;
/** Sem fio há 4 semanas = viajante: sai do denominador, continua na roda. */
export const TRAVELER_AFTER_WEEKS = 4;
export const GUILD_TIDE_WEEKS = 6;
/** Floração cheia a partir de 12 dias-de-guilda na maré; Corola a partir de 4. */
export const TIDE_BLOOM_TARGET = 12;
export const TIDE_COROLLA_AT = 4;
export const TIDE_SIZES = Object.freeze(['petala', 'corola', 'floracao']);
/** Os três gestos fixos (§4): anônimos, para a roda inteira, sem texto livre. */
export const GUILD_GESTURES = Object.freeze(['aceno', 'luz', 'descanso']);
/** Quantos dias de fio a chave pessoal guarda (o fechamento lê daqui). */
export const FIO_DIAS_GUARDADOS = 60;

/**
 * A META QUE FIRMA UM FIO (G1, decidido pelo dono: a meta de CORAÇÃO,
 * `heartGoalFor`, e não a do dia completo). O servidor não conhece o save — o
 * fio é afirmação do cliente (§10.4) —, então esta é a régua que o cliente
 * aplica e que o servidor confere QUANDO o corpo traz os números. Trocar a
 * regra é trocar esta constante.
 */
export const META_DO_FIO = 'heart';
/** `true` se o dia cumpriu a meta que firma fio. `goal = { done, heart, full }`. */
export function metaDoFioCumprida(goal) {
  const done = Number(goal?.done);
  const meta = Number(META_DO_FIO === 'heart' ? goal?.heart : goal?.full);
  if (!Number.isFinite(done) || !Number.isFinite(meta)) return false;
  return meta <= 0 ? done > 0 : done >= meta;
}

const DIA_MS = 86400000;
export const numDia = day => Math.round(Date.parse(`${day}T00:00:00Z`) / DIA_MS);
export const diaDeNum = n => new Date(n * DIA_MS).toISOString().slice(0, 10);

export const coopFioKey = (gid, save) => `coopFio:${gid}:${save}`;
export const coopGestKey = (gid, save) => `coopGest:${gid}:${save}`;
export const coopHitKey = (gid, week, save) => `coopHit:${gid}:${week}:${save}`;
export const coopClaimKey = (save, week) => `coopClaim:${save}:${week}`;
/** Semanas de `coopClaim` que ainda podem existir (TTL 60 d ≈ 9 semanas). */
export const CLAIM_WEEKS_VIVAS = 9;

/** Normaliza o registro de fio de UM membro: `{ lastDay, distinctDays, days[] }`. */
export function normalizarFio(r) {
  const days = Array.isArray(r?.days) ? r.days.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
  const distinct = Number.isFinite(r?.distinctDays) ? Math.max(0, Math.floor(r.distinctDays)) : days.length;
  const lastDay = typeof r?.lastDay === 'string' ? r.lastDay : (days.length ? [...days].sort().at(-1) : null);
  return { lastDay, distinctDays: distinct, days };
}

/** Registra o fio de `day` (puro, idempotente): a mesma referência se já havia. */
export function firmarFio(fio, day) {
  const f = normalizarFio(fio);
  if (f.days.includes(day)) return f;
  const corte = numDia(day) - FIO_DIAS_GUARDADOS;
  const days = [...f.days, day].filter(d => numDia(d) > corte).sort();
  return {
    lastDay: f.lastDay && f.lastDay > day ? f.lastDay : day,
    distinctDays: f.distinctDays + FIO_PER_MEMBER_DAY,
    days,
  };
}

export async function lerFio(env, gid, save) {
  const raw = await kvOrThrow(env).get(coopFioKey(gid, save));
  if (!raw) return null;
  try { return normalizarFio(JSON.parse(raw)); } catch { return null; }
}

const prazoDoGrupo = g => (Number(g?.bosqueProgress ?? 0) > 0 ? {} : { expirationTtl: COOP_TTL });

/** A escrita do fio: SÓ a chave do próprio membro (I3), nunca o blob. */
export async function gravarFio(env, g, save, fio) {
  await kvOrThrow(env).put(coopFioKey(g.id, save), JSON.stringify(fio), prazoDoGrupo(g));
}

/** Estágio do Bosque, DERIVADO na leitura (nunca gravado) — `bondLevelFor`. */
export function bosqueStageFor(progress) {
  const p = Number(progress) || 0;
  const stageIndex = BOSQUE_THRESHOLDS.filter(t => p >= t).length;
  const stage = stageIndex > 0 ? BOSQUE_STAGES[stageIndex - 1] : null;
  let perto = false;
  if (stageIndex < BOSQUE_THRESHOLDS.length) {
    const prev = stageIndex > 0 ? BOSQUE_THRESHOLDS[stageIndex - 1] : 0;
    const next = BOSQUE_THRESHOLDS[stageIndex];
    perto = p > prev && (next - p) <= BOSQUE_PERTO_FRACAO * (next - prev);
  }
  return { stage, stageIndex, perto };
}

/**
 * Viajante: sem fio há `TRAVELER_AFTER_WEEKS` semanas no dia `day`. A
 * referência é o último fio; sem fio, o dia em que entrou (`g.desde`); sem
 * nenhum dos dois (grupo antigo), conta como ativo. Derivado, nunca gravado,
 * visível a ninguém.
 */
export function ehViajante(g, save, fio, day) {
  const ref = fio?.lastDay ?? g.desde?.[save] ?? null;
  if (!ref) return false;
  return numDia(day) - numDia(ref) >= TRAVELER_AFTER_WEEKS * 7;
}

/** Membros ativos no dia (denominador do Bosque). */
export function membrosAtivos(g, fios, day) {
  return g.members.filter(m => !ehViajante(g, m, fios[m], day));
}

/** Maré (6 semanas, virando na segunda) de um dia `YYYY-MM-DD`. */
const SEGUNDA_ZERO = numDia('1970-01-05');
export function mareDe(day) {
  return `T${Math.floor((numDia(day) - SEGUNDA_ZERO) / (7 * GUILD_TIDE_WEEKS))}`;
}

/** Tamanho DESCRITIVO de uma floração (nenhum é "pior"); `null` se nada cresceu. */
export function tamanhoDaFloracao(bloom) {
  const b = Number(bloom) || 0;
  if (b <= 0) return null;
  if (b >= TIDE_BLOOM_TARGET) return 'floracao';
  if (b >= TIDE_COROLLA_AT) return 'corola';
  return 'petala';
}

/**
 * Colhe a maré anterior quando a de `day` é outra (puro; muta `g`). A floração
 * é colhida NO ESTADO EM QUE ESTIVER e vira peça permanente em `g.ornaments`.
 * Maré sem crescimento não gera peça nenhuma — e nada é dito: nenhuma maré
 * "falha", nada é resetado (o Bosque segue somando). `true` se mudou.
 */
export function colherMare(g, day) {
  const atual = mareDe(day);
  const p = Number(g.bosqueProgress ?? 0);
  if (!g.tideKey) { g.tideKey = atual; g.tideBase = p; return true; }
  if (g.tideKey === atual) return false;
  const size = tamanhoDaFloracao(p - Number(g.tideBase ?? 0));
  if (size) g.ornaments = [...(Array.isArray(g.ornaments) ? g.ornaments : []), { tide: g.tideKey, size, day }];
  g.tideKey = atual;
  g.tideBase = p;
  return true;
}

/**
 * Fecha os dias pendentes do Bosque (puro; muta `g`): para cada dia entre
 * `progressDay` (exclusivo) e `hoje` (exclusivo — hoje ainda está aberto), soma
 * `fios_do_dia / ativos_do_dia` (teto 1,0). `fios` = `{ [save]: fio }` dos
 * membros atuais; os fios de quem SAIU ou foi EXCLUÍDO antes do fechamento
 * estão em `g.fiosAvulsos[day]` (anônimos, só contagem) e entram nos dois lados
 * da razão. SÓ SOMA: nenhum caminho daqui subtrai (LV-G3).
 * @returns {boolean} se algo mudou
 */
export function fecharDiasDoBosque(g, fios, hoje) {
  const alvo = numDia(hoje) - 1;
  let mudou = false;
  if (!g.progressDay) { g.progressDay = diaDeNum(alvo); mudou = true; }
  let d = Math.max(numDia(g.progressDay) + 1, alvo - FIO_DIAS_GUARDADOS + 1);
  let p = Number(g.bosqueProgress ?? 0);
  if (!Number.isFinite(p) || p < 0) p = 0;
  for (; d <= alvo; d++) {
    const dia = diaDeNum(d);
    g.bosqueProgress = p;
    colherMare(g, dia);
    const avulsos = Math.max(0, Math.floor(Number(g.fiosAvulsos?.[dia] ?? 0)));
    const ativos = membrosAtivos(g, fios, dia);
    const n = ativos.length + avulsos;
    const firmados = g.members.filter(m => fios[m]?.days?.includes(dia)).length + avulsos;
    if (n > 0 && firmados > 0) p += Math.min(1, firmados / n);
    g.progressDay = dia;
    mudou = true;
  }
  if (numDia(g.progressDay) < alvo) { g.progressDay = diaDeNum(alvo); mudou = true; }
  g.bosqueProgress = Math.max(Number(g.bosqueProgress ?? 0), p);
  if (colherMare(g, hoje)) mudou = true;
  if (g.fiosAvulsos) {
    for (const k of Object.keys(g.fiosAvulsos)) if (k <= g.progressDay) delete g.fiosAvulsos[k];
  }
  return mudou;
}

export async function lerFiosDaRoda(env, g) {
  const lidos = await Promise.all(g.members.map(m => lerFio(env, g.id, m)));
  return Object.fromEntries(g.members.map((m, i) => [m, lidos[i]]));
}

/**
 * Fecha o Bosque na LEITURA, sem cron (§10.5). Relê o blob imediatamente antes
 * de gravar e não refaz o que outra requisição já fechou (`progressDay`), para
 * dois leitores simultâneos não somarem o mesmo dia duas vezes.
 * @returns {Promise<object>} o grupo atualizado (ou o mesmo)
 */
export async function atualizarBosque(env, g, hoje) {
  const fios = await lerFiosDaRoda(env, g);
  const teste = structuredClone(g);
  if (!fecharDiasDoBosque(teste, fios, hoje)) return g;
  const fresco = (await lerGrupo(env, g.id)) ?? g;
  if (fresco.progressDay && fresco.progressDay >= teste.progressDay && fresco.tideKey === teste.tideKey) {
    return { ...fresco, weekKey: g.weekKey, checkins: g.checkins };
  }
  fecharDiasDoBosque(fresco, fios, hoje);
  await gravarGrupo(env, fresco);
  return { ...fresco, weekKey: g.weekKey, checkins: g.checkins };
}

/** Semanas ISO de `coopClaim` que ainda podem existir para um save. */
export function semanasDeClaim(now = new Date()) {
  return Array.from({ length: CLAIM_WEEKS_VIVAS }, (_, k) => semanaDe(new Date(now.getTime() - k * 7 * DIA_MS)));
}

/** Gestos que UM membro mandou hoje (`day`). */
export async function lerGestos(env, gid, save, day) {
  const raw = await kvOrThrow(env).get(coopGestKey(gid, save));
  if (!raw) return [];
  try {
    const r = JSON.parse(raw);
    return r && r.day === day && Array.isArray(r.kinds) ? r.kinds.filter(k => GUILD_GESTURES.includes(k)) : [];
  } catch { return []; }
}

/** Apaga os resgates (`coopClaim:<save>:<week>`) vivos — exclusão de conta. Sem `list`. */
export async function apagarClaims(env, saveId, now = new Date()) {
  await Promise.all(semanasDeClaim(now).map(w => kvOrThrow(env).delete(coopClaimKey(saveId, w))));
  // WPG-5: o contador das Conchas e os cenários liberados também são do titular.
  await kvOrThrow(env).delete(`coopShell:${saveId}`);
  await kvOrThrow(env).delete(`coopScenes:${saveId}`);
}

// ===========================================================================
// A FEIRA (WPG-4) e as RECOMPENSAS (WPG-5) — `PLANO-GUILDA.md` §3/§7/§10
//
// A roda contra um FENÔMENO (D-G4): sem guilda × guilda, sem ranking. O estado
// da semana está na CHAVE (`coopHit:<gid>:<week>:<save>`, uma por pessoa); o
// fechamento é resolvido na LEITURA (`coopRaidOk:<gid>:<week>`), sem cron.
// NADA daqui sai numérico para o cliente: nem HP, nem dano, nem quem golpeou,
// nem quantos golpes (LV-G1; vetos do guarda). No máximo `ferido: boolean`.
// ===========================================================================

/** Piso do HP: guilda de 1–2 não fica trivial. */
export const GUILD_MIN_RAID_MEMBERS = 3;
/** HP por membro ativo — 60% de presença derruba na sexta (`07` §3). */
export const RAID_HP_PER_MEMBER = 45;
export const RAID_DMG_BASE = 10;
export const RAID_DMG_PER_POWER = 2;
/** ±20%, sorteado NO SERVIDOR (`crypto`). */
export const RAID_DMG_JITTER = 0.2;
/** Um golpe por pessoa por dia do jogador (não reusa `MATCHES_PER_DAY`). */
export const RAID_ROUNDS_PER_DAY = 1;
/** Emblemas quando o fenômeno se dissipou; piso quando recuou (G9). */
export const RAID_EMBLEMS = 4;
export const RAID_EMBLEMS_FLOOR = 2;
/** Uma Concha da Maré (decoração, slot `trophy`) a cada 4 Feiras dissipadas com participação. */
export const RAID_TROPHY_EVERY = 4;
export const RAID_TROPHY_ID = 'trophy-concha-mare';
/** Rotação semanal dos quatro fenômenos (`fx-fair-*`). Tempo da Malha, nunca inimigo. */
export const RAID_PHENOMENA = Object.freeze(['nevoa', 'mare', 'estatica', 'enxame']);
/** Prefixo dos cenários de estágio do Bosque (`bg-guild-<estágio>`). */
export const GUILD_SCENE_PREFIX = 'bg-guild-';
export const COOP_HIT_TTL = 86400 * 21;
export const COOP_RAIDOK_TTL = 86400 * 60;
export const COOP_CLAIM_TTL = 86400 * 60;

export const coopRaidOkKey = (gid, week) => `coopRaidOk:${gid}:${week}`;
/** Contador vitalício das Feiras dissipadas RESGATADAS (conjunto de semanas). */
export const coopShellKey = save => `coopShell:${save}`;
/** Cenários `bg-guild-*` já liberados — ficam com quem sai (G12). */
export const coopScenesKey = save => `coopScenes:${save}`;

/** HP coletivo do fenômeno: `max(ativos, 3) × 45`. */
export function raidHpFor(ativos) {
  const n = Math.max(0, Math.floor(Number(ativos) || 0));
  return Math.max(n, GUILD_MIN_RAID_MEMBERS) * RAID_HP_PER_MEMBER;
}

/**
 * Dano de UM golpe: `10 + 2 × stagePower`, ±20%, com `u ∈ [0,1)` vindo de
 * `crypto.getRandomValues` (o chamador passa `u` só em teste). Inteiro ≥ 1.
 * O `stagePower` vem do ESTÁGIO DECLARADO no perfil — ver `guild.js` sobre o
 * que um cliente adulterado consegue com isso.
 */
export function raidDamageFor(power, u = sorteio()) {
  const p = Math.min(5, Math.max(1, Math.floor(Number(power) || 1)));
  const base = RAID_DMG_BASE + RAID_DMG_PER_POWER * p;
  const f = 1 - RAID_DMG_JITTER + 2 * RAID_DMG_JITTER * Math.min(Math.max(Number(u) || 0, 0), 0.999999);
  return Math.max(1, Math.round(base * f));
}

/** Um uniforme em [0,1) de `crypto` — nunca `Math.random` (o dano não é do cliente). */
export function sorteio() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

/** Fenômeno da semana ISO (`YYYY-Www`), determinístico. */
export function fenomenoDaSemana(week) {
  const m = /^(\d{4})-W(\d{2})$/.exec(String(week));
  const n = m ? Number(m[1]) * 53 + Number(m[2]) : 0;
  return RAID_PHENOMENA[n % RAID_PHENOMENA.length];
}

/** Os dias ISO (`YYYY-MM-DD`) de segunda a domingo de uma semana, a partir de um dia dela. */
export function ultimoDiaDaSemana(day) {
  const n = numDia(day);
  const dow = (n - SEGUNDA_ZERO) % 7; // 0 = segunda
  return diaDeNum(n - dow + 6);
}

/** Normaliza `coopHit`: `{ week, days[], dmg }`. */
export function normalizarGolpes(r, week) {
  if (!r || (r.week && r.week !== week)) return { week, days: [], dmg: 0 };
  const days = Array.isArray(r.days) ? r.days.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
  const dmg = Number.isFinite(r.dmg) && r.dmg > 0 ? Math.floor(r.dmg) : 0;
  return { week, days, dmg };
}

export async function lerGolpes(env, gid, week, save) {
  const raw = await kvOrThrow(env).get(coopHitKey(gid, week, save));
  if (!raw) return normalizarGolpes(null, week);
  try { return normalizarGolpes(JSON.parse(raw), week); } catch { return normalizarGolpes(null, week); }
}

/** A marca de semana vencida (`{at, hp, members}`) ou `null`. */
export async function lerRaidOk(env, gid, week) {
  const raw = await kvOrThrow(env).get(coopRaidOkKey(gid, week));
  if (!raw) return null;
  try { return JSON.parse(raw) ?? { at: 0 }; } catch { return { at: 0 }; }
}

/**
 * O estado da Feira de `week`, RESOLVIDO NA LEITURA (§10.5): soma o dano das
 * chaves pessoais dos membros atuais; se `dano ≥ hp`, grava `coopRaidOk` (valor
 * constante e idempotente — duas leituras gravam o mesmo). Uma vez gravada, a
 * semana fica vencida PARA SEMPRE, mesmo que alguém saia e a soma encolha.
 *
 * `hp` usa os membros ativos no dia `refDay` (hoje, ou o domingo de uma semana
 * passada). Uso INTERNO: o retorno tem números e nunca vai ao cliente inteiro.
 * @returns {Promise<{ week, cleared: boolean, hp: number, dmg: number, hitters: string[] }>}
 */
export async function resolverFeira(env, g, week, refDay) {
  const golpes = await Promise.all(g.members.map(m => lerGolpes(env, g.id, week, m)));
  const dmg = golpes.reduce((s, h) => s + h.dmg, 0);
  const hitters = g.members.filter((_, i) => golpes[i].days.length > 0);
  const fios = await lerFiosDaRoda(env, g);
  const hp = raidHpFor(membrosAtivos(g, fios, refDay).length);
  let cleared = !!(await lerRaidOk(env, g.id, week));
  if (!cleared && dmg >= hp) {
    await kvOrThrow(env).put(coopRaidOkKey(g.id, week), JSON.stringify({ at: week, hp, members: g.members.length }), { expirationTtl: COOP_RAIDOK_TTL });
    cleared = true;
  }
  return { week, cleared, hp, dmg, hitters };
}

/** Semana ISO anterior a `day`. */
export const semanaAnterior = day => semanaDoDia(diaDeNum(numDia(day) - 7));

/** Cenários `bg-guild-*` até o estágio `stageIndex` (1..5). */
export function cenariosAte(stageIndex) {
  return BOSQUE_STAGES.slice(0, Math.max(0, Math.min(BOSQUE_STAGES.length, stageIndex))).map(s => GUILD_SCENE_PREFIX + s);
}

export async function lerConjunto(env, key) {
  const raw = await kvOrThrow(env).get(key);
  try { const r = raw ? JSON.parse(raw) : null; return Array.isArray(r?.ids) ? r.ids.filter(x => typeof x === 'string') : []; } catch { return []; }
}

/** União idempotente (relê antes de gravar); nunca remove. Sem TTL: é conquista. */
export async function unirConjunto(env, key, novos) {
  const atual = await lerConjunto(env, key);
  const uniao = [...new Set([...atual, ...novos])].sort();
  if (uniao.length !== atual.length) await kvOrThrow(env).put(key, JSON.stringify({ ids: uniao }));
  return uniao;
}
