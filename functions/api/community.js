// Cloudflare Pages Function — comunidade do Soulmon: perfis públicos,
// Tournament (PvP assíncrono) e Biblioteca (diretório + amigos + presentes).
// Usa o MESMO KV dos saves (DIGIAPP_SAVES) com prefixos:
//   profile:<saveId>          → perfil público (nome, pet, formas, pvp, amigos…)
//   rank:<season>:<saveId>    → pontos de rank da season (season = YYYY-MM)
//   gifts:<saveId>            → presentes de bits pendentes para o jogador
//
// Rotas (query ?action=):
//   POST profile   {id, name, stage, unlockedStages[], pvpEnabled, createdAt?}
//   GET  players   ?search=&limit=      → diretório público
//   GET  player    ?id=                 → perfil detalhado
//   GET  opponents ?id=                 → 3 oponentes com pvp habilitado
//   POST match     {id, opponentId}     → resolve a partida no servidor
//   GET  rank      ?season=             → top 50 da season
//   GET  seasonResult ?season=          → top 3 (para troféus)
//   POST closeSeason {season, adminKey} → fecha a season: dá troféu (top 3)
//   GET  trophies  ?id=&claim=1         → troféus pendentes do jogador (e zera)
//   POST friends   {id, friendId, remove?} → até 5 amigos
//   POST gift      {id, friendId}      → 20 bits (1x/dia por amigo; grátis)
//   GET  gifts     ?id=&claim=1        → lê (e zera) presentes pendentes

import { authorizeSaveAccess } from './_auth.js';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;
const MATCHES_PER_DAY = 5;

const json = (obj, status = 200) => Response.json(obj, { status, headers: CORS });
const today = () => new Date().toISOString().slice(0, 10);
const currentSeason = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// Nível numérico de uma forma pelo prefixo do id (rookie=1 … ultra=5)
function stagePower(stage) {
  if (!stage) return 1;
  const p = String(stage).split('-')[0];
  return { rookie: 1, champion: 2, ultimate: 3, mega: 4, ultra: 5 }[p] ?? 1;
}

async function getProfile(env, id) {
  const raw = await env.DIGIAPP_SAVES.get(`profile:${id}`);
  return raw ? JSON.parse(raw) : null;
}
async function putProfile(env, id, profile) {
  await env.DIGIAPP_SAVES.put(`profile:${id}`, JSON.stringify(profile), { expirationTtl: 86400 * 365 });
}
async function getRank(env, season, id) {
  const raw = await env.DIGIAPP_SAVES.get(`rank:${season}:${id}`);
  return raw ? JSON.parse(raw) : { points: 0, wins: 0, losses: 0, day: today(), matchesToday: 0 };
}
async function putRank(env, season, id, rec) {
  await env.DIGIAPP_SAVES.put(`rank:${season}:${id}`, JSON.stringify(rec), { expirationTtl: 86400 * 120 });
}
async function listPrefix(env, prefix, limit = 100) {
  const out = [];
  let cursor;
  do {
    const page = await env.DIGIAPP_SAVES.list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) {
      out.push(k.name);
      if (out.length >= limit) return out;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequest({ request, env }) {
  if (!env.DIGIAPP_SAVES) return json({ error: 'Storage not bound' }, 500);
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const method = request.method;
  const body = method === 'POST' ? await request.json().catch(() => ({})) : {};
  const id = body.id || url.searchParams.get('id');

  // ── Perfil público (upsert; chamado junto do cloud save) ──────────────────
  if (action === 'profile' && method === 'POST') {
    if (!VALID_ID.test(id || '')) return json({ error: 'invalid id' }, 400);
    // Sem isto, qualquer um escreve o perfil público de qualquer conta —
    // trocar o apelido e os atributos alheios na Biblioteca/Torneio.
    const auth = await authorizeSaveAccess(request, env, id);
    if (!auth.ok) return json({ error: auth.reason }, auth.reason === 'forbidden' ? 403 : 401);
    const prev = (await getProfile(env, id)) || {};
    const profile = {
      id,
      name: String(body.name || prev.name || 'Anônimo').slice(0, 24),
      stage: String(body.stage || prev.stage || 'rookie').slice(0, 40),
      petName: String(body.petName || prev.petName || '').slice(0, 32),
      unlockedStages: Array.isArray(body.unlockedStages) ? body.unlockedStages.slice(0, 16) : (prev.unlockedStages || []),
      pvpEnabled: !!body.pvpEnabled,
      attrs: body.attrs && typeof body.attrs === 'object'
        ? { virus: +body.attrs.virus || 0, data: +body.attrs.data || 0, vaccine: +body.attrs.vaccine || 0 }
        : (prev.attrs || { virus: 0, data: 0, vaccine: 0 }),
      tasksDone: Number.isFinite(+body.tasksDone) ? Math.max(0, +body.tasksDone) : (prev.tasksDone || 0),
      friends: prev.friends || [],
      createdAt: prev.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await putProfile(env, id, profile);
    return json({ ok: true });
  }

  // ── Diretório / busca ─────────────────────────────────────────────────────
  if (action === 'players' && method === 'GET') {
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const keys = await listPrefix(env, 'profile:', 300);
    const season = currentSeason();
    const players = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (search && !String(p.name).toLowerCase().includes(search)) continue;
      const rank = await getRank(env, season, p.id);
      players.push({
        id: p.id, name: p.name, petName: p.petName, stage: p.stage,
        unlockedStages: p.unlockedStages, pvpEnabled: p.pvpEnabled,
        rankPoints: rank.points,
        daysPlaying: Math.max(1, Math.floor((Date.now() - (p.createdAt || Date.now())) / 86400000) + 1),
        tasksDone: p.tasksDone || 0,
      });
      if (players.length >= 50) break;
    }
    players.sort((a, b) => b.rankPoints - a.rankPoints);
    return json({ players });
  }

  if (action === 'player' && method === 'GET') {
    const p = await getProfile(env, id);
    if (!p) return json({ found: false });
    const rank = await getRank(env, currentSeason(), id);
    return json({
      found: true,
      player: {
        id: p.id, name: p.name, petName: p.petName, stage: p.stage,
        unlockedStages: p.unlockedStages, pvpEnabled: p.pvpEnabled,
        friends: p.friends,
        rankPoints: rank.points, wins: rank.wins, losses: rank.losses,
        daysPlaying: Math.max(1, Math.floor((Date.now() - (p.createdAt || Date.now())) / 86400000) + 1),
        tasksDone: p.tasksDone || 0,
      },
    });
  }

  // ── Tournament ────────────────────────────────────────────────────────────
  if (action === 'opponents' && method === 'GET') {
    const keys = await listPrefix(env, 'profile:', 300);
    const me = id;
    const pool = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (!p.pvpEnabled || p.id === me) continue;
      pool.push({ id: p.id, name: p.name, petName: p.petName, stage: p.stage });
    }
    // embaralha e devolve até 3
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const season = currentSeason();
    const myRank = id ? await getRank(env, season, id) : null;
    const matchesLeft = myRank
      ? MATCHES_PER_DAY - (myRank.day === today() ? myRank.matchesToday : 0)
      : MATCHES_PER_DAY;
    return json({ opponents: pool.slice(0, 3), matchesLeft: Math.max(0, matchesLeft) });
  }

  if (action === 'match' && method === 'POST') {
    const { opponentId } = body;
    if (!VALID_ID.test(id || '') || !VALID_ID.test(opponentId || '')) return json({ error: 'invalid id' }, 400);
    const me = await getProfile(env, id);
    const opp = await getProfile(env, opponentId);
    if (!me?.pvpEnabled) return json({ error: 'pvp disabled' }, 403);
    if (!opp?.pvpEnabled) return json({ error: 'opponent unavailable' }, 404);

    const season = currentSeason();
    const myRank = await getRank(env, season, id);
    if (myRank.day !== today()) { myRank.day = today(); myRank.matchesToday = 0; }
    if (myRank.matchesToday >= MATCHES_PER_DAY) {
      // Futuro: liberar partidas extras via anúncio (ads). Hoje: bloqueia.
      return json({ error: 'daily limit', matchesLeft: 0 }, 429);
    }

    // Poder = nível da forma + atributos totais (leve) + sorte
    const power = p =>
      stagePower(p.stage) * 10 +
      Math.min(20, ((p.attrs?.virus || 0) + (p.attrs?.data || 0) + (p.attrs?.vaccine || 0)) / 5) +
      Math.random() * 18;
    const myScore = power(me);
    const oppScore = power(opp);
    const won = myScore >= oppScore;

    myRank.matchesToday += 1;
    myRank.points = Math.max(0, myRank.points + (won ? 20 : -8));
    if (won) myRank.wins += 1; else myRank.losses += 1;
    await putRank(env, season, id, myRank);

    const oppRank = await getRank(env, season, opponentId);
    oppRank.points = Math.max(0, oppRank.points + (won ? -4 : 10));
    if (won) oppRank.losses += 1; else oppRank.wins += 1;
    await putRank(env, season, opponentId, oppRank);

    return json({
      won,
      myScore: Math.round(myScore), oppScore: Math.round(oppScore),
      points: myRank.points,
      matchesLeft: MATCHES_PER_DAY - myRank.matchesToday,
      opponent: { name: opp.name, petName: opp.petName, stage: opp.stage },
    });
  }

  if ((action === 'rank' || action === 'seasonResult') && method === 'GET') {
    const season = url.searchParams.get('season') || currentSeason();
    if (!/^\d{4}-\d{2}$/.test(season)) return json({ error: 'invalid season' }, 400);
    const keys = await listPrefix(env, `rank:${season}:`, 300);
    const rows = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      const rec = JSON.parse(raw);
      const pid = k.slice(`rank:${season}:`.length);
      const p = await getProfile(env, pid);
      rows.push({ id: pid, name: p?.name || 'Anônimo', petName: p?.petName || '', stage: p?.stage || 'rookie', points: rec.points, wins: rec.wins, losses: rec.losses });
    }
    rows.sort((a, b) => b.points - a.points);
    if (action === 'seasonResult') return json({ season, top3: rows.slice(0, 3) });
    return json({ season, rank: rows.slice(0, 50) });
  }

  // Fecha uma season: dá troféu (place 1/2/3) aos 3 primeiros do rank. Chamado
  // manualmente ou por um cron (ex.: workers/push-scheduler.js) no 1º dia do
  // mês seguinte. Protegido por SEASON_ADMIN_KEY (secret do wrangler).
  if (action === 'closeSeason' && method === 'POST') {
    const { season, adminKey } = body;
    if (!env.SEASON_ADMIN_KEY || adminKey !== env.SEASON_ADMIN_KEY) return json({ error: 'unauthorized' }, 401);
    if (!/^\d{4}-\d{2}$/.test(season || '')) return json({ error: 'invalid season' }, 400);
    const keys = await listPrefix(env, `rank:${season}:`, 300);
    const rows = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      rows.push({ id: k.slice(`rank:${season}:`.length), points: JSON.parse(raw).points });
    }
    rows.sort((a, b) => b.points - a.points);
    const top3 = rows.slice(0, 3);
    for (let i = 0; i < top3.length; i++) {
      const p = await getProfile(env, top3[i].id);
      if (!p) continue;
      p.pendingTrophies = p.pendingTrophies || [];
      p.pendingTrophies.push({ season, place: i + 1 });
      await putProfile(env, top3[i].id, p);
    }
    return json({ ok: true, season, awarded: top3.length });
  }

  if (action === 'trophies' && method === 'GET') {
    if (!VALID_ID.test(id || '')) return json({ error: 'invalid id' }, 400);
    const p = await getProfile(env, id);
    const trophies = p?.pendingTrophies || [];
    if (url.searchParams.get('claim') === '1' && trophies.length && p) {
      p.pendingTrophies = [];
      await putProfile(env, id, p);
    }
    return json({ trophies });
  }

  // ── Amigos ────────────────────────────────────────────────────────────────
  if (action === 'friends' && method === 'POST') {
    const { friendId, remove } = body;
    if (!VALID_ID.test(id || '') || !VALID_ID.test(friendId || '')) return json({ error: 'invalid id' }, 400);
    if (id === friendId) return json({ error: 'cannot befriend yourself' }, 400);
    const me = await getProfile(env, id);
    if (!me) return json({ error: 'profile not found' }, 404);
    const friend = await getProfile(env, friendId);
    if (!friend) return json({ error: 'friend not found' }, 404);
    me.friends = me.friends || [];
    if (remove) {
      me.friends = me.friends.filter(f => f !== friendId);
    } else {
      if (me.friends.includes(friendId)) return json({ ok: true, friends: me.friends });
      if (me.friends.length >= 5) return json({ error: 'friend limit (5)' }, 400);
      me.friends.push(friendId);
    }
    await putProfile(env, id, me);
    return json({ ok: true, friends: me.friends });
  }

  // ── Presente de bits (grátis; exige energia cheia no cliente; 1x/dia/amigo)
  if (action === 'gift' && method === 'POST') {
    const { friendId } = body;
    if (!VALID_ID.test(id || '') || !VALID_ID.test(friendId || '')) return json({ error: 'invalid id' }, 400);
    const me = await getProfile(env, id);
    if (!me) return json({ error: 'profile not found' }, 404);
    if (!(me.friends || []).includes(friendId)) return json({ error: 'not a friend' }, 403);
    me.giftLog = me.giftLog || {};
    if (me.giftLog[friendId] === today()) return json({ error: 'already gifted today' }, 429);
    me.giftLog[friendId] = today();
    await putProfile(env, id, me);

    const raw = await env.DIGIAPP_SAVES.get(`gifts:${friendId}`);
    const gifts = raw ? JSON.parse(raw) : [];
    gifts.push({ from: me.name, bits: 20, at: Date.now() });
    await env.DIGIAPP_SAVES.put(`gifts:${friendId}`, JSON.stringify(gifts.slice(-50)), { expirationTtl: 86400 * 60 });
    return json({ ok: true });
  }

  if (action === 'gifts' && method === 'GET') {
    if (!VALID_ID.test(id || '')) return json({ error: 'invalid id' }, 400);
    const raw = await env.DIGIAPP_SAVES.get(`gifts:${id}`);
    const gifts = raw ? JSON.parse(raw) : [];
    if (url.searchParams.get('claim') === '1' && gifts.length) {
      await env.DIGIAPP_SAVES.delete(`gifts:${id}`);
    }
    return json({ gifts });
  }

  return json({ error: 'unknown action' }, 400);
}
