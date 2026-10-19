import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/App.tsx', 'utf8');
const card = readFileSync('src/components/nav/SpecialMissionCard.tsx', 'utf8');
const sheet = readFileSync('src/components/nav/MissionsSheet.tsx', 'utf8');

describe('a missão especial está plugada', () => {
  it('App chama resolveSpecialMission( exatamente uma vez', () => {
    expect((app.match(/resolveSpecialMission\(/g) ?? []).length).toBe(1);
  });
  it('sondagem pendente do sensor não decide a missão', () => {
    const i = app.indexOf('resolveSpecialMission(');
    const antes = app.slice(i - 500, i);
    expect(antes).toMatch(/stepsAvailable === null/);
    expect(antes).toMatch(/stepsPermission === null/);
  });
  it('o cartão nasce mudo', () => {
    expect(card).not.toMatch(/\bplay[A-Z]\w*\(/);
    expect(card).not.toContain('useSound');
  });
  it('a folha renderiza o cartão e o App passa special', () => {
    expect(sheet).toContain('<SpecialMissionCard');
    expect(app).toMatch(/special=\{\{/);
  });
  it('o cartão só recebe a missão do dia de hoje (ontem some)', () => {
    expect(app).toMatch(/state: gameState\.specialMission\?\.day === playerDayKey\(new Date\(\), gameState\.playerDayTz\) \? gameState\.specialMission : undefined/);
  });
});
