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
export async function coopLeave(env, saveId) {
  const lido = await grupoDe(env, saveId);
  if (!lido) return { left: false, groupId: null, remaining: 0 };
  await kvOrThrow(env).delete(coopOfKey(saveId));
  await kvOrThrow(env).delete(coopCkKey(lido.id, saveId));
  // RELEITURA imediatamente antes de gravar (L1-codigo MÉDIO-2): gravar a
  // cópia lida no começo apagava quem tivesse ENTRADO no meio — e, com um
  // membro só, apagava o grupo inteiro por cima da entrada de outra pessoa,
  // que já tinha recebido 200. Não fecha a janela (o KV não tem CAS), encolhe
  // para o intervalo entre este `get` e o `put`/`delete`.
  const g = (await lerGrupo(env, lido.id)) ?? lido;
  g.members = (g.members || []).filter(m => m !== saveId);
  if (g.checkins) delete g.checkins[saveId];
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
      const vivo = { ...ultima, members: outros, hostSave: ultima.hostSave && outros.includes(ultima.hostSave) ? ultima.hostSave : outros[0] };
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
