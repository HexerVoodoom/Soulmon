/**
 * O TEMPO ATÉ O MÁXIMO do Soulsmith (11/10/2026, pedido do dono: "está fácil de upar… tem de levar tempo para colocar tudo no máximo.
 * Mesmo depois do nível ultra o jogador ainda não terá todos os itens no máximo").
 *
 * Simulação DETERMINÍSTICA dia a dia com as funções reais (`applyForgeGrant`, `applyUpgrade`, `claimBuildingQuest`, `bondLevelFor`):
 * a cada dia o jogador resgata a missão de cada prédio aberto (1 material por prédio, só quando o resgata), o Vínculo sobe com um XP
 * médio por dia, e ele aprimora ASSIM que dá — o caminho mais rápido possível (escolha sempre 'a': a escolha não muda o custo).
 * Mede o dia em que as três peças chegam ao nível máximo, para três perfis de presença.
 *
 * O Ultra custa 14 dias perfeitos (rookie → mega) + `ULTRA_PATIENCE_DAYS` (45) = 59 dias (CLAUDE.md, ⭐ Dia completo): é o chão de
 * comparação. A regra de produto que este teste trava: quem joga TODO dia, no melhor ritmo possível, só termina o Soulsmith bem
 * depois do Ultra. Números documentados em `docs/BALANCO-SOULSMITH.md`; mudou custo ou nível, rode de novo e atualize os dois.
 */
import { describe, it, expect } from 'vitest';
import { ULTRA_PATIENCE_DAYS } from '../types/progression';
import { bondLevelFor } from './bond';
import { BUILDING_GATES, type BuildingId } from './gates';
import { claimBuildingQuest, completeBuildingQuest, materialOf, QUEST_BUILDINGS, type BuildingQuestState } from './buildingQuests';
import { FORGE_MAX_LEVEL, FORGE_PIECES, UPGRADE_COST } from './forge';
import { applyForgeGrant, applyUpgrade, levelNow, type ForgeGameState } from './forgeActions';

/** Dias perfeitos de rookie → mega (14, `FORM_REQUIREMENTS`) + a paciência do Ultra. */
const DIAS_ATE_ULTRA = 14 + ULTRA_PATIENCE_DAYS;
const SLOTS = ['nucleo', 'carapaca', 'rastro'] as const;

/** Presença: fração de dias em que ele ENTRA em cada prédio (determinística — o dia `d` do prédio `i` conta se o "relógio" cai dentro). */
function presente(taxa: number, dia: number, i: number): boolean {
  if (taxa >= 1) return true;
  return Math.floor((dia + 1) * taxa + i * 0.37) > Math.floor(dia * taxa + i * 0.37);
}

interface Resultado { diasAteMaximo: number; maximoAoUltra: number; porPeca: number[] }

function simular(opts: { presenca: number; xpPorDia: number; focoPorMaterial?: number; teto?: number }): Resultado {
  const teto = opts.teto ?? 1000;
  let st: ForgeGameState = { totalXP: 0, buildingQuests: { day: 'd0', visited: [], claimed: [], materials: {} } };
  const predios = QUEST_BUILDINGS as readonly BuildingId[];
  const acumulado: Record<string, number> = {};
  let alvoDia = -1;
  let niveisAoUltra = 0;
  for (let dia = 0; dia < teto; dia++) {
    const key = `d${dia}`;
    st = { ...st, totalXP: (st.totalXP ?? 0) + opts.xpPorDia };
    const bond = bondLevelFor(st.totalXP ?? 0);
    predios.forEach((id, i) => {
      if (!materialOf(id) || BUILDING_GATES[id].minBond > bond || !presente(opts.presenca, dia, i)) return;
      const bq = completeBuildingQuest(st.buildingQuests, key, id, bond);
      const r = claimBuildingQuest(bq, key, id, bond);
      st = { ...st, buildingQuests: r.state };
      if (r.paid !== null) st = applyForgeGrant(st, id);
    });
    // O FOCO (opcional): a Oficina do Foco também rende material (`focusExpedition.ts`: ~1 loot por ciclo, 1 de 4 materiais do ambiente,
    // teto de 8 itens/dia). `focoPorMaterial` = quanto a mais POR DIA ele ganha de CADA material que as peças atuais pedem — fração,
    // acumulada. 0,2 ≈ 4 ciclos/dia girando entre os ambientes; 0,64 ≈ 4 ciclos/dia SEMPRE no ambiente que dá os materiais (só 3 dos 6).
    if (opts.focoPorMaterial) {
      for (const s of SLOTS) {
        const alvo = FORGE_PIECES.find((p) => p.id === st.equipment?.equipped[s]);
        if (!alvo) continue;
        for (const m of alvo.mats) {
          acumulado[m] = (acumulado[m] ?? 0) + opts.focoPorMaterial;
          const inteiro = Math.floor(acumulado[m]);
          if (inteiro < 1) continue;
          acumulado[m] -= inteiro;
          const bq = st.buildingQuests!;
          st = { ...st, buildingQuests: { ...bq, materials: { ...bq.materials, [m]: Math.min(99, (bq.materials[m] ?? 0) + inteiro) } } };
        }
      }
    }
    // Aprimora ASSIM que dá, de baixo para cima (o caminho mais rápido).
    for (let volta = 0; volta < 3 * FORGE_MAX_LEVEL; volta++) {
      let subiu = false;
      for (const s of SLOTS) {
        const id = st.equipment?.equipped[s];
        if (!id) continue;
        const r = applyUpgrade(st, id, 'a');
        if (r.ok) { st = r.state; subiu = true; }
      }
      if (!subiu) break;
    }
    const niveis = SLOTS.map((s) => (st.equipment?.equipped[s] ? levelNow(st, st.equipment.equipped[s]) : 0));
    if (dia === DIAS_ATE_ULTRA - 1) niveisAoUltra = niveis.reduce((a, b) => a + b, 0);
    if (niveis.every((l) => l === FORGE_MAX_LEVEL)) { alvoDia = dia + 1; break; }
  }
  const porPeca = SLOTS.map((s) => (st.equipment?.equipped[s] ? levelNow(st, st.equipment.equipped[s]) : 0));
  return { diasAteMaximo: alvoDia, maximoAoUltra: niveisAoUltra, porPeca };
}

describe('tempo até o máximo — as três peças em nível 15', () => {
  const totalMat1 = Object.values(UPGRADE_COST).reduce((a, c) => a + c[0], 0);
  const totalMat2 = Object.values(UPGRADE_COST).reduce((a, c) => a + c[1], 0);

  it('a conta de mesa: 98 do material do prédio + 56 do de apoio por peça (1 por dia por prédio ⇒ ≥ ~100 dias)', () => {
    expect(totalMat1).toBe(98);
    expect(totalMat2).toBe(56);
  });

  it('quem joga TODO dia, no melhor ritmo, só termina DEPOIS do Ultra — com folga (≥ 1,5× os 59 dias do Ultra)', () => {
    const r = simular({ presenca: 1, xpPorDia: 165 }); // XP de "dia bom" (bond.ts): o Vínculo nunca segura
    expect(r.diasAteMaximo).toBeGreaterThan(0);
    expect(r.diasAteMaximo).toBeGreaterThan(DIAS_ATE_ULTRA * 1.5);
    // No dia em que o Ultra chega, as peças ainda estão longe do máximo: menos que 80% dos 45 níveis.
    expect(r.maximoAoUltra).toBeLessThan(0.8 * 3 * FORGE_MAX_LEVEL);
  });

  it('presença menor demora MAIS (monótono) e Vínculo menor nunca encurta', () => {
    const cheio = simular({ presenca: 1, xpPorDia: 165 }).diasAteMaximo;
    const tres = simular({ presenca: 0.75, xpPorDia: 100 }).diasAteMaximo;
    const metade = simular({ presenca: 0.5, xpPorDia: 100 }).diasAteMaximo;
    expect(tres).toBeGreaterThan(cheio);
    expect(metade).toBeGreaterThan(tres);
    expect(simular({ presenca: 1, xpPorDia: 40 }).diasAteMaximo).toBeGreaterThanOrEqual(cheio);
  });

  it('com foco moderado (+0,2 por material por dia ≈ 4 ciclos/dia girando os ambientes), encurta, mas AINDA passa do Ultra (> 59 dias)', () => {
    const sem = simular({ presenca: 1, xpPorDia: 165 }).diasAteMaximo;
    const com = simular({ presenca: 1, xpPorDia: 165, focoPorMaterial: 0.2 }).diasAteMaximo;
    expect(com).toBeLessThan(sem);
    expect(com).toBeGreaterThan(DIAS_ATE_ULTRA);
  });

  it('imprime a tabela do BALANCO-SOULSMITH.md (SOULSMITH_TABELA=1 npx vitest run src/utils/forge.tempo.test.ts)', () => {
    if (!process.env.SOULSMITH_TABELA) return;
    const linhas = [
      ['todo dia, XP 165', { presenca: 1, xpPorDia: 165 }],
      ['todo dia, XP 100', { presenca: 1, xpPorDia: 100 }],
      ['todo dia + foco 0,2/mat', { presenca: 1, xpPorDia: 165, focoPorMaterial: 0.2 }],
      ['todo dia + foco 0,64/mat', { presenca: 1, xpPorDia: 165, focoPorMaterial: 0.64 }],
      ['3 de 4 dias, XP 100', { presenca: 0.75, xpPorDia: 100 }],
      ['metade dos dias, XP 100', { presenca: 0.5, xpPorDia: 100 }],
    ] as const;
    process.stdout.write(linhas.map(([n, o]) => { const r = simular(o); return `${n.padEnd(26)} dias até o máximo: ${String(r.diasAteMaximo).padStart(4)} | níveis no dia ${DIAS_ATE_ULTRA}: ${r.maximoAoUltra}/45`; }).join('\n') + '\n');
  });
});
