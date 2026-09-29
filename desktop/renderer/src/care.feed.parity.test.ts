// PARIDADE DA COMIDA SEM CONTA — a última regra que o overlay reimplementava.
//
// O achado: `menu.ts:459` fazia
//   `state.energy = Math.min(state.maxEnergy, state.energy + 1)`
// LOGO DEPOIS de chamar `feedFood`, que já devolve exatamente essa energia
// calculada com `getMaxEnergyForStage(evolutionStage)`. A regra estava escrita
// duas vezes; hoje as duas dão o mesmo número por coincidência de origem
// (`state.maxEnergy` é preenchido por `cloudSync` com a MESMA função), então a
// mudança é ESTRUTURAL e o que se prova aqui é paridade byte a byte com o
// caminho antigo — mais o guard que faz a coincidência parar de ser sorte.
import { describe, it, expect } from 'vitest';
import { localFeed } from './care';
import { feedFood, FOOD_LIMIT_PER_HOUR, type CareState } from '../../../src/utils/careRules';
import { getMaxEnergyForStage } from '../../../src/types/progression';

const AGORA = 1_772_000_000_000;

/**
 * O CAMINHO ANTIGO, copiado de `menu.ts` (pré-conserto) linha a linha:
 * pré-teste de janela, `feedFood` com o cast mentiroso, e a energia à mão.
 * Está aqui para o teste poder AFIRMAR que nada mudou para o jogador.
 */
function legado(
  st: { stage: string; energy: number; maxEnergy: number; foodInventory: Record<string, number>; feedTimes: number[] },
  emoji: string,
  now: number,
) {
  const local = feedFood(st as unknown as CareState, emoji, st.feedTimes, now);
  if (local.refused) return { energy: st.energy, foodInventory: st.foodInventory, refused: local.refused };
  return {
    foodInventory: local.state.foodInventory,
    energy: Math.min(st.maxEnergy, st.energy + 1),
    refused: undefined as undefined | string,
  };
}

const ESTAGIOS = ['rookie', 'champion-power', 'ultimate-harmony', 'mega-benevolence', 'ultra'];

describe('a comida sem conta continua exatamente a mesma para o jogador', () => {
  it('paridade com o caminho antigo em todo estagio, energia, estoque e janela', () => {
    let casos = 0;
    for (const stage of ESTAGIOS) {
      const maxEnergy = getMaxEnergyForStage(stage); // o que o cloudSync teria posto em cache
      for (let energy = 0; energy <= maxEnergy; energy++) {
        for (const foodInventory of [{}, { '🍎': 1 }, { '🍎': 3, '🍚': 2 }] as Record<string, number>[]) {
          for (const feedTimes of [
            [],
            [AGORA - 1000],
            Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => AGORA - i * 1000), // janela cheia
            Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => AGORA - 2 * 3600_000 - i), // toda vencida
          ]) {
            const base = { stage, energy, maxEnergy, foodInventory, feedTimes };
            const velho = legado({ ...base }, '🍎', AGORA);
            const novo = localFeed({ stage, energy, foodInventory, feedTimes }, '🍎', AGORA);
            expect(novo.refused, `${stage}/${energy}`).toBe(velho.refused);
            expect(novo.energy, `${stage}/${energy}`).toBe(velho.energy);
            expect(novo.foodInventory, `${stage}/${energy}`).toEqual(velho.foodInventory);
            casos++;
          }
        }
      }
    }
    expect(casos).toBeGreaterThan(100);
  });
});

describe('o teto de energia do overlay passa a ser o do JOGO, nao um cache', () => {
  // VERMELHO com a linha antiga: ela usava `state.maxEnergy`, um campo de
  // cache. Um save de mega lido antes de o cache atualizar (ou um teto que o
  // jogo passe a calcular de outro jeito) fazia o overlay parar de encher a
  // energia num número velho. `localFeed` nem oferece onde escrever esse cache.
  it.each(ESTAGIOS)('%s: enche ate getMaxEnergyForStage e para', stage => {
    const teto = getMaxEnergyForStage(stage);
    let st = { stage, energy: 0, foodInventory: { '🍎': 99 } as Record<string, number>, feedTimes: [] as number[] };
    for (let i = 0; i < teto + 3; i++) {
      // Janela sempre limpa: o que se mede aqui é o teto de energia, nao o de ritmo.
      const r = localFeed({ ...st, feedTimes: [] }, '🍎', AGORA + i * 1000);
      expect(r.refused).toBeUndefined();
      st = { ...st, energy: r.energy, foodInventory: r.foodInventory };
    }
    expect(st.energy).toBe(teto);
  });

  // A PROVA DE QUE A COPIA ERA COPIA, e nao so redundancia visual.
  //
  // Nao e um bug alcancavel HOJE: `stage` e `maxEnergy` sao escritos juntos em
  // `applySnapshot`/`syncNow`, entao o cache nunca esta atrasado em relacao ao
  // estagio. Nao e, portanto, correcao de comportamento, e nada muda para o
  // jogador. O que este caso mede e a DISTANCIA entre as duas escritas da
  // regra: basta um caminho que atualize um campo sem o outro (um snapshot
  // parcial, um estado legado carregado do localStorage, um estagio novo) para
  // o overlay parar de encher a energia num numero velho, em silencio. Com a
  // regra escrita uma vez so, esse caminho deixa de existir: nao ha onde
  // escrever o teto errado.
  it('a linha antiga divergia com o cache atrasado; a nova nao tem cache', () => {
    const atrasado = { stage: 'mega-harmony', energy: 4, maxEnergy: 4, foodInventory: { '🍎': 1 }, feedTimes: [] };
    expect(legado({ ...atrasado }, '🍎', AGORA).energy).toBe(4);            // preso no teto de rookie
    expect(localFeed(atrasado, '🍎', AGORA).energy).toBe(5);                // o teto do estagio real
    expect(getMaxEnergyForStage('mega-harmony')).toBe(6);
  });

  it('nao ha campo de teto para o chamador passar errado', () => {
    // O tipo `LocalFeedState` nao tem `maxEnergy` — o teto entra pelo `stage`.
    const r = localFeed({ stage: 'mega-harmony', energy: 5, foodInventory: { '🍎': 1 }, feedTimes: [] }, '🍎', AGORA);
    expect(r.energy).toBe(getMaxEnergyForStage('mega-harmony'));
    expect(r.energy).toBe(6);
  });
});

describe('as recusas continuam sendo as do app', () => {
  it('sem estoque devolve no-stock e nao mexe em nada', () => {
    const r = localFeed({ stage: 'rookie', energy: 1, foodInventory: {}, feedTimes: [] }, '🍎', AGORA);
    expect(r.refused).toBe('no-stock');
    expect(r.energy).toBe(1);
  });

  it('janela cheia devolve hourly-limit e PODA os vencidos mesmo recusando', () => {
    const cheia = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => AGORA - i * 1000);
    const r = localFeed(
      { stage: 'rookie', energy: 0, foodInventory: { '🍎': 5 }, feedTimes: [...cheia, AGORA - 5 * 3600_000] },
      '🍎', AGORA,
    );
    expect(r.refused).toBe('hourly-limit');
    expect(r.feedTimes).toHaveLength(FOOD_LIMIT_PER_HOUR); // o vencido saiu
    expect(r.energy).toBe(0);
  });

  it('o limite de ritmo continua sendo o do app, nao um literal do overlay', () => {
    let st = { stage: 'rookie', energy: 0, foodInventory: { '🍎': 99 } as Record<string, number>, feedTimes: [] as number[] };
    for (let i = 0; i < FOOD_LIMIT_PER_HOUR; i++) {
      const r = localFeed(st, '🍎', AGORA + i);
      expect(r.refused).toBeUndefined();
      st = { ...st, foodInventory: r.foodInventory, feedTimes: r.feedTimes };
    }
    expect(localFeed(st, '🍎', AGORA + FOOD_LIMIT_PER_HOUR).refused).toBe('hourly-limit');
  });
});
