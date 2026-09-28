// PONTE 8→17 — cobertura de SAÍDA dos elementos do class-system (Fase 1 B6,
// docs/PLANO-ORACULO.md).
//
// `classeElementoOcorrencia.test.ts` trava a ENTRADA: os 17 `classElements`
// que a leitura produz. Isso não prova que cada um dos 17 chega a ser o
// elemento DOMINANTE da ficha montada por `buildFicha` — a distribuição de
// orçamento pode concentrar ou apagar um elemento no caminho. Este arquivo
// mede o que sai: para cada estágio, qual elemento BASE tem mais pontos na
// ficha, sobre uma população sintética com semente própria (19870412 — não a
// de calibração, 20260928, para não medir no mesmo ponto que foi ajustado).
//
// Se algum elemento for inalcançável, a calibração NÃO se muda aqui: o
// buraco fica registrado (it.fails / todo) com o número medido.
//
// Medido em 28/09/2026 (N=2000): 17/17 nos dois estágios. Cauda rara —
// rookie `gravidade` 2/2000, ultra `vileza` 8/2000 — por isso N=2000: com
// N=300 três deles sumiam da amostra sem estarem inalcançáveis.

import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from '../profile';
import { CITIES } from '../cities';
import { applyRitualAnswers } from '../ritualAnswers';
import { CLASS_ELEMENT_ORDER } from '../types';
import { ORACLE_QUESTIONS, mulberry32 } from '../../oracle';
import type { Answers } from '../personality/types';
import { nomeSintetico, nascimentoSintetico } from '../perfisSinteticos';
import { buildFicha } from './buildSheet';
import type { FichaStage } from './types';

const N = 2000;
const SEED = 19870412;
const ESTAGIOS: FichaStage[] = ['rookie', 'ultra'];

function medir() {
  const rng = mulberry32(SEED);
  const dominou: Record<FichaStage, Record<string, number>> = {} as never;
  for (const s of ESTAGIOS) {
    dominou[s] = {};
    for (const e of CLASS_ELEMENT_ORDER) dominou[s][e] = 0;
  }
  for (let i = 0; i < N; i++) {
    const c = CITIES[Math.floor(rng() * CITIES.length)];
    const nome = nomeSintetico(rng);
    const perfil = buildSoulProfile({
      fullName: nome,
      ...nascimentoSintetico(rng),
      timeUnknown: false,
      placeLabel: c.name,
      latitude: c.latitude, longitude: c.longitude, timeZone: c.timeZone,
    }, {} as Answers);
    const respostas: Record<string, string> = {};
    for (const q of ORACLE_QUESTIONS) respostas[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
    const oracle = applyRitualAnswers(perfil.oracle, respostas);
    for (const s of ESTAGIOS) {
      const el = buildFicha(nome, oracle, s, nome).elementos;
      // Só ids BASE: pares destravados (ex.: `vapor`) não são um dos 17.
      let topo = CLASS_ELEMENT_ORDER[0];
      for (const e of CLASS_ELEMENT_ORDER) if ((el[e] ?? 0) > (el[topo] ?? 0)) topo = e;
      dominou[s][topo]++;
    }
  }
  return dominou;
}

describe('ponte 8→17: cada elemento do class-system domina alguma ficha', () => {
  const dominou = medir();

  for (const s of ESTAGIOS) {
    it(`${s}: os 17 são alcançáveis como elemento dominante`, () => {
      const nunca = CLASS_ELEMENT_ORDER.filter(e => dominou[s][e] === 0);
      const fatias = CLASS_ELEMENT_ORDER.map(e => `${e}=${dominou[s][e]}`).join(' ');
      expect(nunca, `nunca dominam (${s}): ${nunca.join(', ') || '(nenhum)'} — ${fatias}`).toEqual([]);
    });

    it(`${s}: nenhum elemento monopoliza o topo`, () => {
      const maior = Math.max(...CLASS_ELEMENT_ORDER.map(e => dominou[s][e])) / N;
      expect(maior, `maior fatia (${s}): ${(maior * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.22);
    });
  }
});
