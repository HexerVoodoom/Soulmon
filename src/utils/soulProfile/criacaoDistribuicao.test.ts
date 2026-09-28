// A CRIAÇÃO É ÚNICA, USA A BASE INTEIRA E NÃO TEM VENCEDOR ESTRUTURAL.
//
// Régua do pedido do dono (28/09/2026): "que o personagem seja único,
// aproveite toda base que temos tanto do class-system quanto do bestiário,
// seja resultado dos dados do user, mantenha uma lógica de evolução com
// flexibilidade e balanceamento para que todos elementos, classes, etc,
// tenham chances proporcionais de aparecerem".
//
// Medido no Loop A (N=400, pipeline real) ANTES dos consertos do Loop B:
//   família visual 13/44 (Canino 28%) · companheiro 12/32 (top 5 = 80%) ·
//   8 elementos com razão topo/piso 5,4× · harmonia 46% · 79% das
//   evoluções presas na mesma família · tupla visível colidindo em 74%.
// Cada limite abaixo recusa a volta de um desses números, com folga para a
// amostra menor e para uma seed DIFERENTE da usada na calibração (senão a
// régua mediria o próprio ajuste).
//
// Onde mora cada conserto:
//   família visual → `oracle.ts` › `BESTIARY_FAMILY_PULL` / `pickFamilies`
//   companheiro    → `pipeline.ts` › `selectCompanion(fichaByStage.mega, …)`
//   8 elementos    → `oracle.ts` › `RITUAL_ELEMENT_SCALE`, `ELEMENT_DOMINANCE_COMPENSATION`
//   caminhos       → `oracle.ts` › `RITUAL_ALIGNMENT_SCALE`, `axes.ts` › `ALIGNMENT_COMPENSATION`
//   evolução       → `bestiary/select.ts` › `LINEAGE_PROXIMITY_WEIGHT`
//   espécies       → `bestiary/select.ts` › sorteio igual por `especieDe`
//   classes        → `ficha/buildSheet.ts` › `ALIGNMENT_SCHOOL_WEIGHT` (régua: `ficha/classeOcorrencia.test.ts`)

import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from './profile';
import { CITIES } from './cities';
import { ELEMENT_ORDER, ALIGNMENT_ORDER, ORACLE_QUESTIONS, mulberry32 } from '../oracle';
import type { OracleInput } from '../oracle';
import type { Answers } from './personality/types';
import { nomeSintetico, nascimentoSintetico } from './perfisSinteticos';
import { generateOracleComplete, type OracleComplete } from './pipeline';
import { especieDe } from './bestiary/select';
import { REALM_ORDER, ROLE_ORDER } from '../oracle';

const N = 240;
const SEED = 19870412; // ≠ 20260928, a seed da calibração

type Pessoa = { input: OracleInput; alt: OracleInput };

function pessoas(): Pessoa[] {
  const rng = mulberry32(SEED);
  const out: Pessoa[] = [];
  for (let i = 0; i < N; i++) {
    const c = CITIES[Math.floor(rng() * CITIES.length)];
    const nome = nomeSintetico(rng);
    const nasc = nascimentoSintetico(rng);
    const quiz: Record<string, string> = {}; const alt: Record<string, string> = {};
    for (const q of ORACLE_QUESTIONS) {
      const k = Math.floor(rng() * q.options.length);
      quiz[q.id] = q.options[k].id;
      alt[q.id] = q.options[(k + 1) % q.options.length].id;
    }
    const soulProfile = buildSoulProfile({
      fullName: nome, ...nasc, timeUnknown: false, placeLabel: c.name,
      latitude: c.latitude, longitude: c.longitude, timeZone: c.timeZone,
    }, {} as Answers);
    const base = { fullName: nome, birthDate: nasc.birthDate, birthTime: nasc.birthTime, birthPlace: c.name, soulProfile };
    out.push({ input: { ...base, answers: quiz } as OracleInput, alt: { ...base, answers: alt } as OracleInput });
  }
  return out;
}

const conta = (xs: string[]) => xs.reduce((o, x) => (o[x] = (o[x] ?? 0) + 1, o), {} as Record<string, number>);
const fatia = (o: Record<string, number>) =>
  Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / N * 100).toFixed(1)}%`).join(' · ');

describe('distribuição da criação — pipeline completo, população sintética', async () => {
  const ps = pessoas();
  const rs: OracleComplete[] = [];
  for (let i = 0; i < N; i++) rs.push(await generateOracleComplete(ps[i].input, 5000 + i));

  const elementos = conta(rs.map(r => r.result.dominantElement));
  const caminhos = conta(rs.map(r => r.result.dominantAlignment));
  const familias = conta(rs.map(r => r.result.creature.family.primary.family.pt));
  const companheiros = conta(rs.map(r => r.companion?.criatura.nome ?? 'nenhum'));
  const especies = conta(rs.map(r => especieDe(r.bestiaryPick.creature.nome)));
  const papeis = conta(rs.map(r => r.result.dominantRole));
  const reinos = conta(rs.map(r => r.result.dominantRealm));

  it('os 8 elementos do jogo: todos alcançáveis, nenhum vencedor estrutural', () => {
    // Medido depois do Loop B: 10,5%–14,5%. Antes: industrial 4,5% · ar 24,5%.
    for (const e of ELEMENT_ORDER) {
      expect((elementos[e] ?? 0) / N, `${e} — ${fatia(elementos)}`).toBeGreaterThanOrEqual(0.06);
    }
    expect(Math.max(...Object.values(elementos)) / N, fatia(elementos)).toBeLessThanOrEqual(0.2);
  });

  it('os 3 caminhos: nenhum passa de ~2/5 nem cai abaixo de ~1/5', () => {
    // Medido: 36/36/28%. Antes: harmonia 46%, benevolência 21,5%.
    for (const a of ALIGNMENT_ORDER) {
      expect((caminhos[a] ?? 0) / N, `${a} — ${fatia(caminhos)}`).toBeGreaterThanOrEqual(0.2);
      expect((caminhos[a] ?? 0) / N, `${a} — ${fatia(caminhos)}`).toBeLessThanOrEqual(0.42);
    }
  });

  it('papel: os 5 são alcançáveis e nenhum passa de ~1/4 (Fase 1, C2)', () => {
    // Fase 0 (N=240, esta seed): mágico 26,3% · alcance 15,0% — 1,75×; a
    // auditoria (N=800, 2 seeds de validação) mediu 1,89×. Fase 1 (28/09/2026):
    // `ROLE_DOMINANCE_COMPENSATION` por caminho + argmax sem arredondar
    // (`oracle.ts`); a auditoria passou a 1,42× (ruído 1,2×) e as fatias
    // estruturais N=2400 a 1,10–1,15×. Com N=240 o piso de ruído de 5 caixas
    // é ~1,4×, então aqui trava o PISO e o TETO, não a razão.
    for (const p of ROLE_ORDER) {
      expect((papeis[p] ?? 0) / N, `${p} — ${fatia(papeis)}`).toBeGreaterThanOrEqual(0.13);
    }
    expect(Math.max(...Object.values(papeis)) / N, fatia(papeis)).toBeLessThanOrEqual(0.27);
  });

  it('reino: os 9 são alcançáveis, nenhum passa de ~1/6 (Fase 1, C2)', () => {
    // Fase 0: auditoria 2,75× (akasha/floresta ~16% × cavernas/deserto ~7%).
    // Fase 1: `REALM_DOMINANCE_COMPENSATION` por caminho + argmax sem
    // arredondar; auditoria 1,36× (ruído 1,38×), fatias estruturais N=2400
    // 1,19–1,33×. N=240 com 9 caixas tem ruído ~2× — só piso e teto aqui.
    for (const r of REALM_ORDER) {
      expect((reinos[r] ?? 0) / N, `${r} — ${fatia(reinos)}`).toBeGreaterThanOrEqual(0.06);
    }
    expect(Math.max(...Object.values(reinos)) / N, fatia(reinos)).toBeLessThanOrEqual(0.16);
  });

  it('família visual: a base inteira aparece, nenhuma domina', () => {
    // Medido: 44/44, topo 7%. Antes: 13/44, Canino 28%.
    expect(Object.keys(familias).length, fatia(familias)).toBeGreaterThanOrEqual(34);
    expect(Math.max(...Object.values(familias)) / N, fatia(familias)).toBeLessThanOrEqual(0.12);
  });

  it('companheiro: o registro inteiro do class-system é alcançável, sem panelinha', () => {
    // Medido: 32/32, top 5 = 22%. Antes: 12/32, top 5 = 80%.
    expect(companheiros.nenhum ?? 0, 'todo perfil tem companheiro').toBe(0);
    expect(Object.keys(companheiros).length, fatia(companheiros)).toBeGreaterThanOrEqual(26);
    const top5 = Object.values(companheiros).sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0);
    expect(top5 / N, fatia(companheiros)).toBeLessThanOrEqual(0.4);
  });

  it('bestiário: muitas espécies servem de inspiração, e o tamanho do corpus não decide', () => {
    // Medido: 92/126 espécies, topo 6%. Antes: "Cão" 10% (mais variantes no pool).
    expect(Object.keys(especies).length).toBeGreaterThanOrEqual(60);
    expect(Math.max(...Object.values(especies)) / N, fatia(especies)).toBeLessThanOrEqual(0.1);
  });

  it('evolução: continuidade é o normal, mas atravessar família não é raro', () => {
    // Medido (28/09, pool de originais, peso 3): 56% trocam de família ao menos uma vez; 84% dos pares
    // consecutivos continuam. Antes: 43%/80% (peso 0,5) e 21%/91% (original).
    const estagios = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'] as const;
    let atravessaram = 0; let pares = 0; let continuas = 0;
    for (const r of rs) {
      let trocou = false;
      for (let s = 1; s < estagios.length; s++) {
        pares++;
        const a = r.bestiaryLineage[estagios[s - 1]].creature.familia;
        const b = r.bestiaryLineage[estagios[s]].creature.familia;
        if (a === b) continuas++; else trocou = true;
      }
      if (trocou) atravessaram++;
    }
    expect(atravessaram / N).toBeGreaterThanOrEqual(0.3);
    expect(atravessaram / N).toBeLessThanOrEqual(0.65);
    expect(continuas / pares).toBeGreaterThanOrEqual(0.7);
  });

  it('unicidade: o que o jogador vê quase nunca se repete', () => {
    // Tupla de 3 (elemento, família visual, espécie do bestiário) — medido:
    // 95% distintas. Antes: 26%.
    const tuplas = new Set(rs.map(r => [
      r.result.dominantElement, r.result.creature.family.primary.family.pt, especieDe(r.bestiaryPick.creature.nome),
    ].join('|')));
    expect(tuplas.size / N).toBeGreaterThanOrEqual(0.85);
  });

  it('é resultado dos dados do usuário: trocar as respostas do ritual muda a criatura', async () => {
    // Mesmo nascimento, mesma seed, respostas diferentes: o que o jogador vê
    // tem de mudar em quase todo caso — senão o ritual é decorativo.
    let mudou = 0;
    const M = 30;
    for (let i = 0; i < M; i++) {
      const a = rs[i];
      const b = await generateOracleComplete(ps[i].alt, 5000 + i);
      const vis = (r: OracleComplete) => [
        r.result.dominantElement, r.result.dominantAlignment,
        r.result.creature.family.primary.family.pt, r.bestiaryPick.creature.nome,
      ].join('|');
      if (vis(a) !== vis(b)) mudou++;
    }
    expect(mudou / M).toBeGreaterThanOrEqual(0.9);
  });
}, 120000);
