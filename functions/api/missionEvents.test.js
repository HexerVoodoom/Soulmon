import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Missoes validadas no servidor (12/11/2026, REGISTRO §309): semanais journal-days / focus-days / gift-sent e a diaria d-presente
// so contam o que o servidor CONFIRMOU. Aqui: o razao (`_missionEvents.js`) e a conferencia no POST do save.
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const M = await import('./_missionEvents.js');

const ID = 'a'.repeat(32);
const WEEK = '2026-W46'; // 09..15/11/2026
const QUARTA = '2026-11-11';
function fakeKV() {
  const store = new Map();
  return {
    store,
    get: async (k) => store.get(k) ?? null,
    getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { store.set(k, v); },
    delete: async (k) => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }),
  };
}
const mk = () => ({ DIGIAPP_SAVES: fakeKV(), FIREBASE_PROJECT_ID: 'soulmon-test' });
const postSave = (e, state) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }),
  env: e,
});
const salvo = (e) => JSON.parse(e.DIGIAPP_SAVES.store.get(ID));
const entry = (i, day) => ({ id: `e${i}`, day, formato: 'livre', text: 'x', at: i });
const semana = (counts = {}, claimed = []) => ({ week: WEEK, counts, claimed });

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${QUARTA}T12:00:00Z`)); });
afterEach(() => vi.useRealTimers());

describe('_missionEvents: o razao', () => {
  it('toIsoDay/isoWeekOf leem o dia ISO e o toDateString do jogador', () => {
    expect(M.toIsoDay('2026-11-11')).toBe('2026-11-11');
    expect(M.toIsoDay('Wed Nov 11 2026')).toBe('2026-11-11');
    for (const x of ['', 'x', 5, null, '2026-13-40', 'a'.repeat(50)]) expect(M.toIsoDay(x)).toBeNull();
    expect(M.isoWeekOf('2026-11-11')).toBe(WEEK);
    expect(M.isoWeekOf('2026-11-15')).toBe(WEEK);
    expect(M.isoWeekOf('2026-11-16')).toBe('2026-W47');
  });
  it('journal e foco: 1 dia entra uma vez so (idempotente); dia fora da janela e recusado', async () => {
    const kv = fakeKV();
    expect(await M.recordMissionEvent(kv, ID, 'f', QUARTA)).toBe(true);
    expect(await M.recordMissionEvent(kv, ID, 'f', QUARTA)).toBe(false);
    expect(await M.recordMissionEvent(kv, ID, 'f', '2026-11-05')).toBe(false); // foco e estrito: +-36 h
    expect(await M.recordMissionEvent(kv, ID, 'f', '2026-12-31')).toBe(false); // futuro
    expect(await M.recordMissionEvent(kv, ID, 'j', '2026-11-09')).toBe(true); // journal sincronizado depois (ate 8 dias)
    expect(await M.recordMissionEvent(kv, ID, 'j', '2026-10-20')).toBe(false);
    expect(JSON.parse(kv.store.get(`mval:${ID}:${WEEK}:f`))).toEqual([QUARTA]);
  });
  it('presente: soma por dia, com teto', async () => {
    const kv = fakeKV();
    await M.recordMissionEvent(kv, ID, 'g', QUARTA);
    await M.recordMissionEvent(kv, ID, 'g', QUARTA);
    expect(JSON.parse(kv.store.get(`mval:${ID}:${WEEK}:g`))).toEqual({ [QUARTA]: 2 });
  });
});

describe('save: semanal journal-days', () => {
  it('3 entradas em 3 dias confirmam o progresso e o resgate; 1 contagem por dia, nunca duas', async () => {
    const e = mk();
    const caderno = [entry(1, '2026-11-09'), entry(2, '2026-11-10'), entry(3, QUARTA), entry(4, QUARTA)];
    await postSave(e, { caderno, weeklyMissions: semana({ 'journal-days': 3 }, ['journal-days']) });
    expect(salvo(e).weeklyMissions).toEqual(semana({ 'journal-days': 3 }, ['journal-days']));
    const e2 = mk();
    await postSave(e2, { caderno: [entry(1, QUARTA), entry(2, QUARTA), entry(3, QUARTA)], weeklyMissions: semana({ 'journal-days': 3 }, ['journal-days']) });
    expect(salvo(e2).weeklyMissions).toEqual(semana({ 'journal-days': 1 })); // 3 entradas no MESMO dia = 1 dia; o resgate adulterado cai
  });
  it('progresso sem nenhuma entrada salva e descartado; as outras semanais passam intactas', async () => {
    const e = mk();
    await postSave(e, { weeklyMissions: semana({ 'journal-days': 3, shower: 2 }, ['journal-days']) });
    expect(salvo(e).weeklyMissions).toEqual(semana({ shower: 2 }));
  });
  it('monotonico: o ja gravado nao baixa e o resgate ja pago nao some', async () => {
    const e = mk();
    e.DIGIAPP_SAVES.store.set(ID, JSON.stringify({ weeklyMissions: semana({ 'journal-days': 3 }, ['journal-days']) })); // anterior a regra
    await postSave(e, { weeklyMissions: semana({ 'journal-days': 1 }, ['journal-days']) });
    expect(salvo(e).weeklyMissions).toEqual(semana({ 'journal-days': 3 }, ['journal-days']));
  });
  it('entrada de dia futuro ou muito antigo nao e evento', async () => {
    const e = mk();
    await postSave(e, { caderno: [entry(1, '2026-12-25'), entry(2, '2026-10-01')], weeklyMissions: semana({ 'journal-days': 2 }) });
    expect(salvo(e).weeklyMissions).toEqual(semana());
  });
});

describe('save: semanal focus-days', () => {
  it('so conta o dia com jornada concluida no razao; o corpo adulterado nao passa', async () => {
    const e = mk();
    const kv = e.DIGIAPP_SAVES;
    await M.recordMissionEvent(kv, ID, 'f', QUARTA);
    await postSave(e, { weeklyMissions: semana({ 'focus-days': 3 }, ['focus-days']) });
    expect(salvo(e).weeklyMissions).toEqual(semana({ 'focus-days': 1 })); // 1 confirmado: a contagem cai a 1 e o resgate cai
    vi.setSystemTime(new Date('2026-11-12T12:00:00Z'));
    await M.recordMissionEvent(kv, ID, 'f', '2026-11-12');
    await M.recordMissionEvent(kv, ID, 'f', '2026-11-11');
    vi.setSystemTime(new Date('2026-11-13T12:00:00Z'));
    await M.recordMissionEvent(kv, ID, 'f', '2026-11-13');
    await postSave(e, { weeklyMissions: semana({ 'focus-days': 3 }, ['focus-days']) });
    expect(salvo(e).weeklyMissions).toEqual(semana({ 'focus-days': 3 }, ['focus-days']));
  });
  it('semana diferente da confirmada: nada conta', async () => {
    const e = mk();
    await M.recordMissionEvent(e.DIGIAPP_SAVES, ID, 'f', QUARTA);
    await postSave(e, { weeklyMissions: { week: '2026-W47', counts: { 'focus-days': 3 }, claimed: ['focus-days'] } });
    expect(salvo(e).weeklyMissions).toEqual({ week: '2026-W47', counts: {}, claimed: [] });
  });
  it('idempotencia: rodar a conferencia de novo sobre o resultado nao muda nada', async () => {
    const e = mk();
    await M.recordMissionEvent(e.DIGIAPP_SAVES, ID, 'f', QUARTA);
    await postSave(e, { weeklyMissions: semana({ 'focus-days': 3 }, ['focus-days']) });
    const a = salvo(e).weeklyMissions;
    await postSave(e, { weeklyMissions: a });
    expect(salvo(e).weeklyMissions).toEqual(a);
  });
});

describe('save: semanal gift-sent e diaria d-presente', () => {
  const diaria = (day, presente, claimed = []) => ({ day, counts: presente ? { presente } : {}, claimed });
  it('sem presente aceito pelo servidor nada conta, nem o resgate adulterado', async () => {
    const e = mk();
    await postSave(e, { weeklyMissions: semana({ 'gift-sent': 1 }, ['gift-sent']), dailyMissions: diaria('Wed Nov 11 2026', 1, ['d-presente']) });
    expect(salvo(e).weeklyMissions).toEqual(semana());
    expect(salvo(e).dailyMissions).toEqual(diaria('Wed Nov 11 2026', 0));
  });
  it('com o presente confirmado, semanal e diaria passam; a diaria so no dia do presente', async () => {
    const e = mk();
    await M.recordMissionEvent(e.DIGIAPP_SAVES, ID, 'g', QUARTA);
    await postSave(e, { weeklyMissions: semana({ 'gift-sent': 1 }, ['gift-sent']), dailyMissions: diaria('Wed Nov 11 2026', 1, ['d-presente']) });
    expect(salvo(e).weeklyMissions).toEqual(semana({ 'gift-sent': 1 }, ['gift-sent']));
    expect(salvo(e).dailyMissions).toEqual(diaria('Wed Nov 11 2026', 1, ['d-presente']));
    await postSave(e, { dailyMissions: diaria('Tue Nov 10 2026', 1, ['d-presente']) });
    expect(salvo(e).dailyMissions).toEqual(diaria('Tue Nov 10 2026', 0));
  });
  it('contagem acima do confirmado cai ao confirmado (1 presente nao vira 5)', async () => {
    const e = mk();
    await M.recordMissionEvent(e.DIGIAPP_SAVES, ID, 'g', QUARTA);
    await postSave(e, { weeklyMissions: semana({ 'gift-sent': 5 }), dailyMissions: diaria(QUARTA, 9) });
    expect(salvo(e).weeklyMissions.counts['gift-sent']).toBe(1);
    expect(salvo(e).dailyMissions.counts.presente).toBe(1);
  });
  it('missoes de NPC de presente (Zumi 2, Papus 1): o resgate so passa com o confirmado; 1 presente nao paga a Zumi', async () => {
    const e = mk();
    await M.recordMissionEvent(e.DIGIAPP_SAVES, ID, 'g', QUARTA);
    await postSave(e, { dailyMissions: diaria('Wed Nov 11 2026', 2, ['n-zumi', 'n-papus']) });
    expect(salvo(e).dailyMissions).toEqual(diaria('Wed Nov 11 2026', 1, ['n-papus']));
  });
  it('a chave legada friend-visit nao e atalho: so vale o que ja estava gravado', async () => {
    const e = mk();
    await postSave(e, { weeklyMissions: { week: WEEK, counts: { 'friend-visit': 4 }, claimed: ['friend-visit'] } });
    expect(salvo(e).weeklyMissions).toEqual(semana());
    const e2 = mk();
    e2.DIGIAPP_SAVES.store.set(ID, JSON.stringify({ weeklyMissions: { week: WEEK, counts: { 'friend-visit': 1 }, claimed: [] } }));
    await postSave(e2, { weeklyMissions: { week: WEEK, counts: { 'friend-visit': 3, 'gift-sent': 1 }, claimed: ['gift-sent'] } });
    expect(salvo(e2).weeklyMissions).toEqual({ week: WEEK, counts: { 'friend-visit': 1, 'gift-sent': 1 }, claimed: ['gift-sent'] }); // o legado ja gravado atravessa a migracao do app
  });
});

describe('save: falha do razao nao derruba o save', () => {
  it('KV do razao com erro: o save grava e as missoes validadas voltam ao gravado', async () => {
    const e = mk();
    e.DIGIAPP_SAVES.store.set(ID, JSON.stringify({ weeklyMissions: semana({ 'focus-days': 1 }) }));
    const get = e.DIGIAPP_SAVES.get;
    e.DIGIAPP_SAVES.get = async (k) => { if (String(k).startsWith('mval:')) throw new Error('kv fora'); return get(k); };
    const r = await postSave(e, { petName: 'Bolha', weeklyMissions: semana({ 'focus-days': 3 }, ['focus-days']) });
    expect(r.status).toBe(200);
    expect(salvo(e).petName).toBe('Bolha');
    expect(salvo(e).weeklyMissions).toEqual(semana({ 'focus-days': 1 }));
  });
});
