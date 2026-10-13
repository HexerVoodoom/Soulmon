/**
 * A RÉGUA DE BALANCEAMENTO da fome × energia (beta-2 3.5, REGISTRO §40) — simulada com as funções REAIS (`eat`, `settleEnergy`, `setEnergy`),
 * não com uma planilha: se alguém mexer em `HUNGER_FULL_TO_EMPTY_HOURS`, `HUNGER_PER_FOOD`, nas faixas, nas velocidades ou em
 * `ENERGY_REGEN_MINUTES`, esta tabela anda e este teste diz se a curva ainda cabe no orçamento.
 *
 * O ORÇAMENTO vem do REGISTRO §30: antes a energia GANHA por dia era ≈ o nº de conclusões (1 comida = +1 energia): leve ≈ 2, médio ≈ 3–4, intenso 6+
 * (até o máximo do estágio, 8–12). A nova curva (energia por TEMPO, na velocidade que a fome deixa) tem de manter a ORDEM e a ordem de grandeza:
 *  · mais comida (= mais atividade concluída) nunca rende MENOS energia;
 *  · sem comer, nada (faminto = regeneração interrompida);
 *  · o teto físico é o relógio: a 100% o dia inteiro dá 24 h / ENERGY_REGEN_MINUTES unidades, e a energia zera na virada;
 *  · o "leve" (2 conclusões) ainda dá para pelo menos 1 camada por dia, e o "intenso" enche mais da metade do tanque do estágio.
 * O dia do jogador come ao longo de 08h–22h, uniforme; a energia gasta é gasta na hora (sem tanque cheio travando a conta).
 */
import { describe, it, expect } from 'vitest';
import { ENERGY_REGEN_MINUTES, HUNGER_PER_FOOD, eat, settleEnergy, setEnergy, maxEnergyOf, type HungerState } from './hunger';

const MIN = 60_000;
const DIA = 24 * 60 * MIN;
const T0 = Date.UTC(2026, 9, 5, 3, 0, 0); // meia-noite de Brasília, só um ponto de partida

/** Energia ganha por dia (média dos dias `aquecimento..dias`) para `comidasPorDia`, comendo entre as 8 h e as 22 h. */
function energiaPorDia(comidasPorDia: number, opts: { dias?: number; aquecimento?: number; gasta?: boolean; estagio?: string; refeicoesJuntas?: boolean } = {}): number {
  const { dias = 14, aquecimento = 4, gasta = true, estagio = 'champion', refeicoesJuntas = false } = opts;
  const horas: number[] = [];
  for (let i = 0; i < comidasPorDia; i++) horas.push(refeicoesJuntas ? 8 + i * 0.05 : 8 + (14 * (i + 0.5)) / comidasPorDia);
  let s: HungerState = { energyPoints: 0, evolutionStage: estagio, hunger: { v: 100, at: T0 }, energyClock: { at: T0, carry: 0 } };
  const ganhos: number[] = [];
  for (let d = 0; d < dias; d++) {
    let ganho = 0;
    for (let m = 0; m < 1440; m += 5) {
      const t = T0 + d * DIA + m * MIN;
      for (const h of horas) if (m <= h * 60 && h * 60 < m + 5) s = eat(s, t, HUNGER_PER_FOOD);
      const antes = s.energyPoints;
      s = settleEnergy(s, t);
      ganho += Math.max(0, s.energyPoints - antes);
      if (gasta && s.energyPoints > 0) s = setEnergy(s, t, () => 0);
    }
    ganhos.push(ganho);
    s = setEnergy(s, T0 + (d + 1) * DIA, () => 0); // a virada zera a energia (nunca a fome nem o relógio)
  }
  const util = ganhos.slice(aquecimento);
  return util.reduce((a, b) => a + b, 0) / util.length;
}

describe('a curva fome × energia cabe no orçamento do REGISTRO §30', () => {
  const perfis = [0, 1, 2, 3, 4, 6, 9, 12].map(n => [n, energiaPorDia(n)] as const);

  it('a tabela (para o REGISTRO): energia por dia × conclusões por dia', () => {
    // não afirma número fixo — só que a simulação rodou e os números são finitos e ≥ 0
    for (const [, e] of perfis) { expect(Number.isFinite(e)).toBe(true); expect(e).toBeGreaterThanOrEqual(0); }
  });
  it('sem comer, NADA: faminto = regeneração interrompida (0 energia por dia)', () => {
    expect(perfis.find(([n]) => n === 0)![1]).toBe(0);
  });
  it('comer mais nunca rende MENOS energia (monotônica)', () => {
    for (let i = 1; i < perfis.length; i++) expect(perfis[i][1], `${perfis[i][0]} comidas`).toBeGreaterThanOrEqual(perfis[i - 1][1] - 1e-9);
  });
  it('o "leve" (2 conclusões) ainda paga pelo menos 1 camada por dia; o "médio" (4) paga 4+; o "intenso" (9) chega a 9+', () => {
    const e = Object.fromEntries(perfis);
    expect(e[2]).toBeGreaterThanOrEqual(1);
    expect(e[2]).toBeLessThanOrEqual(3);
    expect(e[4]).toBeGreaterThanOrEqual(4);
    expect(e[4]).toBeLessThanOrEqual(8);
    expect(e[9]).toBeGreaterThanOrEqual(9);
  });
  it('o teto é o RELÓGIO: nem 12 comidas por dia passam de 24 h ÷ ENERGY_REGEN_MINUTES', () => {
    const teto = (24 * 60) / ENERGY_REGEN_MINUTES;
    for (const [n, e] of perfis) expect(e, `${n} comidas`).toBeLessThanOrEqual(teto + 1e-9);
  });
  it('comer tudo de uma vez rende menos que comer espalhado (a fome desce com o tempo: comida junta é desperdiçada) — sem exploit de "empilhar"', () => {
    expect(energiaPorDia(6, { refeicoesJuntas: true })).toBeLessThanOrEqual(energiaPorDia(6) + 1e-9);
  });
  it('a energia que sobra no tanque (não gasta) respeita o máximo do estágio e a virada: nunca passa das barras', () => {
    const maxEst = maxEnergyOf({ evolutionStage: 'champion' });
    expect(energiaPorDia(9, { gasta: false })).toBeLessThanOrEqual(maxEst + 1e-9);
  });
});
