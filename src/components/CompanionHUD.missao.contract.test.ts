import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/** PR3: com o Solmon em missão (`missionAway`) o sprite SOME do palco (visibility), sem texto de cobrança, e o App a liga só por `isMissionAway`. */
describe('o Solmon em missão some da Home', () => {
  const hud = fs.readFileSync(path.resolve(__dirname, 'CompanionHUD.tsx'), 'utf8');
  const app = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf8');
  it('o HUD esconde o sprite e mostra uma lupa muda quando `missionAway`', () => {
    expect(hud).toMatch(/visibility: missionAway \? 'hidden' : undefined/);
    expect(hud).toContain('data-pet-missao');
    expect(hud).toMatch(/alt=\{missionAway \? '' : currentStage\}/);
  });
  it('o App liga `missionAway` pelo relógio da ida e registra a volta no servidor', () => {
    expect(app).toMatch(/missionAway=\{isMissionAway\(guildMission, Date\.now\(\)\)\}/);
    expect(app).toMatch(/hitGuildRaid(Evento)?\(saveId, gameState\.playerDayTz\)/);
  });
});
