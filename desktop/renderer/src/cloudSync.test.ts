import { describe, it, expect } from 'vitest';
import { emailToSaveId, normalizeForRules, isSaneCareState } from './cloudSync';
import { emailToSaveId as appEmailToSaveId } from '../../../src/utils/cloudSave';
import { MAX_HP_BY_FORM, FORM_REQUIREMENTS, getStageLevel } from '../../../src/types/progression';

// O desktop reimplementava três regras do app porque o renderer é TS puro e não
// carrega o bundle do jogo. Duas delas (as tabelas de HP/energia e o nível do
// estágio) foram ELIMINADAS: hoje o `cloudSync.ts` importa `types/progression`.
// A que resta é a derivação do `saveId` — e ela não tem como ser importada de
// `src/utils/cloudSave.ts` sem arrastar o localStorage do app junto, então
// continua sendo cópia guardada por teste, abaixo. Divergir dela não dá erro
// nenhum: o overlay lê um save que não existe e mostra um bicho genérico.

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

// AS TABELAS COPIADAS DEIXARAM DE EXISTIR.
//
// Este bloco guardava três cópias (`MAX_HP_BY_LEVEL`, `ENERGY_BY_LEVEL` e uma
// `stageLevel` de prefixo) contra as do jogo. Guardar cópia é o segundo melhor
// resultado: o melhor é não ter cópia. Hoje o `cloudSync.ts` IMPORTA
// `MAX_HP_BY_FORM`, `getStageLevel` e `getMaxEnergyForStage` de
// `src/types/progression.ts` — que não importa nada e por isso nunca arrastou o
// roster legado, ao contrário do que o comentário de lá afirmava.
//
// O que sobra para testar não é igualdade de tabela (agora é tautologia), e sim
// que os NÚMEROS QUE CHEGAM AO OVERLAY saem da regra do jogo, inclusive no caso
// que a cópia errava: o save legado.
describe('HP e energia do overlay saem da regra do jogo', () => {
  for (const [stage, nivel] of [
    ['rookie', 'rookie'], ['champion-virus', 'champion'], ['ultimate-data', 'ultimate'],
    ['mega-vaccine', 'mega'], ['ultra', 'ultra'],
    // O caso que a cópia errava: id legado, sem prefixo de nível.
    ['mega-virus', 'mega'], ['rookie', 'rookie'], ['ultra', 'ultra'],
  ] as const) {
    it(`${stage} -> ${nivel}: maxHealthPoints é o do jogo`, () => {
      expect(getStageLevel(stage)).toBe(nivel);
      expect(normalizeForRules({ evolutionStage: stage }).maxHealthPoints)
        .toBe(MAX_HP_BY_FORM[nivel]);
    });
  }

  it('estágio que não é string cai em rookie sem derrubar nada', () => {
    // Save vindo da nuvem é dado NÃO confiável; `/api/save` só valida que
    // `state` é objeto. `getStageLevel` já trata, e agora o desktop herda isso.
    expect(normalizeForRules({ evolutionStage: 42 }).maxHealthPoints)
      .toBe(MAX_HP_BY_FORM.rookie);
  });

  it('AUTOVERIFICAÇÃO: a regra do jogo distingue mesmo os níveis', () => {
    // Sem isto, uma `getStageLevel` que devolvesse sempre 'rookie' passaria em
    // tudo acima — que é literalmente o bug que este bloco substitui.
    expect(MAX_HP_BY_FORM.mega).not.toBe(MAX_HP_BY_FORM.rookie);
    expect(FORM_REQUIREMENTS.mega.required).not.toBe(FORM_REQUIREMENTS.rookie.required);
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

  it('um id do esquema da árvore vale igual no overlay e no app', () => {
    // O bug: o desktop tinha a PRÓPRIA `stageLevel`, que lia só o prefixo do id
    // e devolvia 'rookie' para qualquer coisa que não casasse. O app tem
    // `LEGACY_FORM_TIERS` (`types/progression.ts`) exatamente para o save antigo
    // em `mega-virus` continuar MEGA — é compatibilidade de save, não roster.
    // Divergindo, o mesmo jogador via 4 corações no celular e 3 no overlay, e o
    // `maxHealthPoints` ERRADO voltava para o save na escrita de volta: o
    // `applyRub` corta a cura em `maxHealthPoints`, então o teto do carinho do
    // mega passava a ser o de um rookie. Nenhum erro, nenhum log.
    expect(getStageLevel('mega-virus')).toBe('mega'); // a régua é o app
    const n = normalizeForRules({ evolutionStage: 'mega-virus', healthPoints: 4 });
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
