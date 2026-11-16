import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  bumpDaily, claimDaily, dailyMissionPool, dailyMissionsFor, dailyStatus, sanitizeDailyMissions, DAILY_MISSION_IDS, type DailyMissionsState,
} from './dailyMissions';
import { dailyTarget, weeklyTarget, achievementTarget } from './missionTargets';
import { resolveGo } from '../components/nav/MissionCard';
import { migrateWeeklyLegacy, weeklyMissionPool, weeklyMissionsFor, claimWeekly, type WeeklyMissionProgress } from './weeklyMissions';
import { MISSIONS } from './missions';
import { buildingLot } from '../navigation';

const app = readFileSync('src/App.tsx', 'utf8');
const DAY = '2026-11-11';

// Acha um dia em que a missão sorteada aparece (Vínculo alto abre tudo).
function diaCom(id: string): string {
  for (let d = 1; d < 400; d += 1) {
    const day = `2027-01-${String((d % 28) + 1).padStart(2, '0')}-${d}`;
    if (dailyMissionsFor(day, 99).some(m => m.id === id)) return day;
  }
  throw new Error(`nenhum dia sorteia ${id}`);
}

describe('humor: tocar leva à CONVERSA com o Soulmon e qualquer mensagem conta', () => {
  it('o alvo do toque é o chat, e o cartão navega', () => {
    const m = dailyMissionPool().find(x => x.id === 'd-humor')!;
    expect(dailyTarget(m)).toBe('chat');
    const chamados: string[] = [];
    const r = resolveGo({ bondLevel: 1, onGo: t => chamados.push(t) }, dailyTarget(m), 'pt-BR');
    r.onGo?.();
    expect(chamados).toEqual(['chat']);
    expect(r.lockNote).toBeUndefined();
  });
  it('o App trata o alvo "chat": fecha a folha, vai à Home e pede foco no campo', () => {
    expect(app).toContain("alvo === 'chat'");
    expect(app).toContain('setChatFocusAt(Date.now())');
    expect(app).toContain('chatFocusRequest={chatFocusAt}');
  });
  it('o chat do App emite o evento diário "humor" (fiação do envio ao progresso)', () => {
    expect(app).toContain("onChatSent={() => contarDiaria('humor')}");
  });
  it('mensagem enviada → missão pronta → resgate paga 1 material uma só vez (idempotente por dia)', () => {
    const day = diaCom('d-humor');
    const m = dailyMissionsFor(day, 99).find(x => x.id === 'd-humor')!;
    let s: DailyMissionsState | undefined;
    expect(dailyStatus(s, day, m)).toBe('available');
    s = bumpDaily(s, day, 'humor');
    expect(dailyStatus(s, day, m)).toBe('ready');
    const a = claimDaily({ dailyMissions: s }, day, 99, 'd-humor');
    expect(a.paid).toBe('moss');
    const b = claimDaily(a.state, day, 99, 'd-humor');
    expect(b.paid).toBeNull();
    expect(b.state).toBe(a.state);
  });
});

describe('presente: a missão antiga de visita foi trocada, sem perder o save', () => {
  it('o catálogo diário não sorteia mais a visita, e o presente ocupa o lugar dela (mesmo prédio e material)', () => {
    expect(dailyMissionPool().some(m => m.id === 'd-amigo')).toBe(false);
    const p = dailyMissionPool().find(m => m.id === 'd-presente')!;
    expect(p.building).toBe('laboratorio.amigos');
    expect(p.material).toBe('keepsake');
    expect(p.target).toBe(1);
    expect(dailyTarget(p)).toBe('laboratorio.amigos');
    expect(buildingLot('laboratorio.amigos')).not.toBeNull();
  });
  it('o id antigo continua válido no save (progresso e resgate de hoje atravessam)', () => {
    expect(DAILY_MISSION_IDS).toContain('d-amigo');
    const s = sanitizeDailyMissions({ day: DAY, counts: { amigo: 1, presente: 1 }, claimed: ['d-amigo'] })!;
    expect(s.counts.amigo).toBe(1);
    expect(s.counts.presente).toBe(1);
    expect(s.claimed).toEqual(['d-amigo']);
  });
  it('só o envio do presente conta: a visita (aposentada) não; com o presente, resgata', () => {
    const day = diaCom('d-presente');
    const m = dailyMissionsFor(day, 99).find(x => x.id === 'd-presente')!;
    let s = bumpDaily(undefined, day, 'amigo');
    expect(dailyStatus(s, day, m)).toBe('available');
    s = bumpDaily(s, day, 'presente');
    expect(dailyStatus(s, day, m)).toBe('ready');
    expect(claimDaily({ dailyMissions: s }, day, 99, 'd-presente').paid).toBe('keepsake');
  });
  it('o App conta o presente SÓ no onGiftSent (que a LibraryPage chama depois do ok do servidor)', () => {
    expect(app).toContain("onGiftSent={() => contarMissao('gift-sent')}");
    expect(app).toContain("'gift-sent': 'presente'");
    expect(app).not.toContain("contarMissao('friend-visit')");
    const lib = readFileSync('src/components/LibraryPage.tsx', 'utf8');
    const i = lib.indexOf('const r = await sendGift(');
    expect(i).toBeGreaterThan(-1);
    expect(lib.indexOf('onGiftSent?.(friendId)', i)).toBeGreaterThan(i);
    expect(lib.slice(i - 200, i)).toContain('try {');
  });
  it('o servidor aceita o evento e o id novos', () => {
    const srv = readFileSync('functions/api/_dailyMissions.js', 'utf8');
    expect(srv).toContain("'presente'");
    expect(srv).toContain("'d-presente'");
  });
});

describe('semanal: friend-visit virou gift-sent com o progresso preservado', () => {
  it('mesmo alvo, mesmos Emblemas, mesmo lugar do sorteio', () => {
    const pool = weeklyMissionPool();
    expect(pool.some(m => (m.id as string) === 'friend-visit')).toBe(false);
    const g = pool.find(m => m.id === 'gift-sent')!;
    expect(g.target).toBe(1);
    expect(g.emblems).toBe(2);
    expect(weeklyTarget('gift-sent')).toBe('laboratorio.amigos');
    // `cook-dish` (15/11/2026) e, em 16/11/2026, `buy-decor` e `buy-backdrop` foram acrescentadas DEPOIS dela, no fim do pool: `gift-sent` é a quarta do fim e não se mexeu.
    expect(pool.findIndex(m => m.id === 'gift-sent')).toBe(pool.length - 4);
  });
  it('save com a antiga cumprida/resgatada vira a nova: não perde e não paga de novo', () => {
    const velho = { week: '2026-W46', counts: { 'friend-visit': 1, shower: 2 }, claimed: ['friend-visit'] } as unknown as WeeklyMissionProgress;
    const novo = migrateWeeklyLegacy(velho);
    expect(novo.counts).toEqual({ shower: 2, 'gift-sent': 1 });
    expect(novo.claimed).toEqual(['gift-sent']);
    const m = weeklyMissionPool().find(x => x.id === 'gift-sent')!;
    expect(claimWeekly(novo, m).emblems).toBe(0);
    const so = migrateWeeklyLegacy({ week: 'w', counts: { 'friend-visit': 1 }, claimed: [] } as unknown as WeeklyMissionProgress);
    expect(claimWeekly(so, m).emblems).toBe(2);
    const limpo: WeeklyMissionProgress = { week: 'w', counts: { shower: 1 }, claimed: [] };
    expect(migrateWeeklyLegacy(limpo)).toBe(limpo);
    expect(weeklyMissionsFor('2026-W46').length).toBe(5);
  });
});

describe('varredura: toda missão listada tem ação ao tocar (ou é conhecida como sem lugar)', () => {
  it('diárias: todas têm alvo e o prédio resolve no Mapa', () => {
    for (const m of dailyMissionPool()) {
      const t = dailyTarget(m);
      expect(t, m.id).not.toBeNull();
      if (t !== 'home' && t !== 'chat') expect(buildingLot(t!), m.id).not.toBeNull();
    }
  });
  it('semanais: todas têm alvo', () => {
    for (const m of weeklyMissionPool()) expect(weeklyTarget(m.id), m.id).not.toBeNull();
  });
  it('conquistas sem lugar (conhecidas, sem ação)', () => {
    const semAcao = MISSIONS.filter(m => achievementTarget(m.category, m.id) === null).map(m => m.id).sort();
    expect(semAcao).toEqual(['mission-rank-gold', 'mission-regen-1']);
  });
});
