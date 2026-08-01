import { describe, it, expect } from 'vitest';
import { emailToSaveId, normalizeForRules, isSaneCareState } from './cloudSync';
import { emailToSaveId as appEmailToSaveId } from '../../../src/utils/cloudSave';
import { MAX_HP_BY_FORM, FORM_REQUIREMENTS, getStageLevel } from '../../../src/types/progression';

// O desktop reimplementa três regras que já existem no app, porque o renderer
// é TS puro e não carrega o bundle do jogo. Divergir delas não dá erro nenhum:
// o overlay simplesmente lê um save que não existe, ou mostra HP/energia
// errados. Estes testes são o único lugar onde as duas cópias se encontram.

describe('saveId do desktop bate com o do app', () => {
  // Este é o bug que já aconteceu: o código veio do DigiApp com o salt
  // 'digiapp:'. Rodava sem erro e lia o save errado.
  const emails = ['mateus@exemplo.com', 'A@B.COM', '  espaco@x.com  '];

  for (const email of emails) {
    it(`mesma derivação para ${JSON.stringify(email)}`, async () => {
      expect(await emailToSaveId(email)).toBe(await appEmailToSaveId(email));
    });
  }

  it('normaliza caixa e espaços igual ao app', async () => {
    expect(await emailToSaveId(' Mateus@Exemplo.com ')).toBe(await emailToSaveId('mateus@exemplo.com'));
  });

  it('tem o comprimento que o servidor valida (VALID_ID: 8–64)', async () => {
    const id = await emailToSaveId('mateus@exemplo.com');
    expect(id).toMatch(/^[a-f0-9]{32}$/);
  });
});

// As tabelas do cloudSync são privadas; reproduzimos a mesma leitura que ele
// faz para garantir que os números continuam iguais aos do jogo.
describe('tabelas copiadas continuam iguais às do jogo', () => {
  const DESKTOP_MAX_HP: Record<string, number> = {
    rookie: 3, champion: 3, ultimate: 3, mega: 4, ultra: 5,
  };
  const DESKTOP_ENERGY: Record<string, number> = {
    rookie: 4, champion: 5, ultimate: 6, mega: 7, ultra: 8,
  };

  it('HP máximo por nível', () => {
    expect(DESKTOP_MAX_HP).toEqual({ ...MAX_HP_BY_FORM });
  });

  it('barras de energia por nível', () => {
    const fromGame = Object.fromEntries(
      Object.entries(FORM_REQUIREMENTS).map(([level, r]) => [level, r.required]),
    );
    expect(DESKTOP_ENERGY).toEqual(fromGame);
  });

  it('a regra de prefixo do estágio casa com getStageLevel', () => {
    const desktopStageLevel = (stage: string): string => {
      if (stage === 'rookie' || stage === 'ultra') return stage;
      const prefix = stage.split('-')[0];
      return prefix === 'champion' || prefix === 'ultimate' || prefix === 'mega' ? prefix : 'rookie';
    };
    for (const stage of ['rookie', 'ultra', 'champion-virus', 'ultimate-data', 'mega-vaccine']) {
      expect(desktopStageLevel(stage)).toBe(getStageLevel(stage));
    }
  });
});

describe('proteção da escrita de volta', () => {
  it('completa maxHealthPoints a partir do estágio', () => {
    // O app recalcula esse campo ao carregar o save, então ele pode faltar num
    // save antigo. Sem completar, Math.min(undefined, x) vira NaN e
    // JSON.stringify(NaN) grava `null` — o HP do jogador some.
    const n = normalizeForRules({ evolutionStage: 'mega-virus', healthPoints: 2 });
    expect(n.maxHealthPoints).toBe(4);
  });

  it('preserva campos que não são de cuidado', () => {
    const n = normalizeForRules({ evolutionStage: 'rookie', perfectDays: 9, soulmonStages: [1] });
    expect(n.perfectDays).toBe(9);
    expect(n.soulmonStages).toEqual([1]);
  });

  it('recusa estado com número inválido', () => {
    expect(isSaneCareState({
      healthPoints: NaN, maxHealthPoints: 3, energyPoints: 0,
      virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
    })).toBe(false);
  });

  it('recusa inventário com quantidade negativa', () => {
    expect(isSaneCareState({
      healthPoints: 1, maxHealthPoints: 3, energyPoints: 0,
      virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
      foodInventory: { '🍎': -1 },
    })).toBe(false);
  });

  it('aceita um estado íntegro', () => {
    expect(isSaneCareState({
      healthPoints: 1.5, maxHealthPoints: 3, energyPoints: 1,
      virusPoints: 0, dataPoints: 3, vaccinePoints: 1, totalXP: 40,
      foodInventory: { '🍎': 1 },
    })).toBe(true);
  });
});
