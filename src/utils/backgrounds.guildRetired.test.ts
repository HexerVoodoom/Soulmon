import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PET_BACKGROUNDS, visibleBackground, isGuildScene, isGuildSceneRetired, GUILD_SCENES_RETIRED, GUILD_SCENES_RETIRED_IDS } from './backgrounds';
import { grantGroveScenes, groveSceneIds } from './groveLocal';
import { SHOP_ITEMS, ALL_SHOP_ITEMS } from './shop';
import { GROVE_STAGES } from './guildRules';

/**
 * D-26 / P10 / S-9 (19/10/2026): os cenários `bg-guild-*` saíram do jogo até a arte nova; a POSSE e o campo EQUIPADO
 * do save ficam como estão. D-27 (W5-L7): a arte nova entrou para os cinco estágios, então a lista de aposentados
 * (`GUILD_SCENES_RETIRED_IDS`) está vazia; só um id que voltar para ela cai no cenário padrão.
 */
describe('cenários do Bosque (D-26 aposentados → D-27 de volta com arte nova)', () => {
  it('com a arte nova nenhum estágio está aposentado: `visibleBackground` devolve o bg-guild-* e os outros passam', () => {
    expect(GUILD_SCENES_RETIRED).toBe(false);
    expect(GUILD_SCENES_RETIRED_IDS.size).toBe(0);
    for (const st of GROVE_STAGES) {
      expect(isGuildScene(`bg-guild-${st}`)).toBe(true);
      expect(isGuildSceneRetired(`bg-guild-${st}`)).toBe(false);
      expect(visibleBackground(`bg-guild-${st}`)).toBe(`bg-guild-${st}`);
    }
    expect(visibleBackground('bg-room')).toBe('bg-room');
    expect(visibleBackground('bg-mission-aurora')).toBe('bg-mission-aurora');
    expect(visibleBackground(null)).toBeNull();
    expect(visibleBackground(undefined)).toBeNull();
  });

  it('um estágio SEM arte nova continua aposentado: cai no padrão, os outros seguem visíveis', () => {
    const retired = GUILD_SCENES_RETIRED_IDS as Set<string>;
    retired.add('bg-guild-bosque-antigo');
    try {
      expect(visibleBackground('bg-guild-bosque-antigo')).toBeNull();
      expect(isGuildSceneRetired('bg-guild-bosque-antigo')).toBe(true);
      expect(visibleBackground('bg-guild-copa')).toBe('bg-guild-copa');
    } finally { retired.clear(); }
  });

  it('a posse é preservada: a entrega dos cenários (cloud save/servidor) não apaga nem troca o equipado', () => {
    const save = { ownedBackgrounds: ['bg-room', ...groveSceneIds(3)], equippedBackground: 'bg-guild-copa' as string | null };
    // um ciclo de entrega do servidor (idempotente: mesma referência) e um com estágio novo (só acrescenta)
    expect(grantGroveScenes(save, groveSceneIds(3))).toBe(save);
    const depois = grantGroveScenes(save, groveSceneIds(4));
    expect(depois.equippedBackground).toBe('bg-guild-copa');
    expect(depois.ownedBackgrounds).toEqual(expect.arrayContaining(['bg-room', 'bg-guild-copa', 'bg-guild-mata']));
    // o JSON do save (o que o cloud save carrega) continua com o campo equipado intacto
    expect(JSON.parse(JSON.stringify(depois)).equippedBackground).toBe('bg-guild-copa');
    // e, com a arte nova, o cenário equipado volta sozinho a ser o desenhado
    expect(visibleBackground(depois.equippedBackground)).toBe('bg-guild-copa');
  });

  it('o App desenha por `visibleBackground` nos 3 pontos de leitura e NUNCA grava o resultado no save', () => {
    const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');
    expect((app.match(/visibleBackground\(gameState\.equippedBackground\)/g) ?? [])).toHaveLength(3);
    expect(app).not.toMatch(/setGameState[^\r\n]*visibleBackground/);
    // a ÚNICA escrita do campo continua sendo a escolha da pessoa
    expect((app.match(/equippedBackground:\s*id\b/g) ?? [])).toHaveLength(1);
  });

  it('fora da loja e do sorteio: nenhum item da loja é bg-guild-*, e a posse continua desenhável (PET_BACKGROUNDS)', () => {
    expect(SHOP_ITEMS.filter(i => i.id.startsWith('bg-guild-'))).toEqual([]);
    expect(ALL_SHOP_ITEMS.filter(i => i.kind === 'bg' && i.id.startsWith('bg-guild-'))).toEqual([]);
    for (const st of GROVE_STAGES) expect(PET_BACKGROUNDS[`bg-guild-${st}`]).toBeTruthy();
  });
});
