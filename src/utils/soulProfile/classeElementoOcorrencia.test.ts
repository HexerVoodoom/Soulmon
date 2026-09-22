// OS 17 ELEMENTOS DO CLASS-SYSTEM, EM PÉ DE IGUALDADE — régua de ocorrência.
//
// Decisão do dono (22/09/2026): "o class-system deve ser explorado ao máximo,
// com mesma chance pra todas as combinações e classes".
//
// O que havia antes (`ANCHOR_BASE` = 15), medido em 400 perfis pelo pipeline
// real: os 6 elementos de nome compartilhado com o jogo (fogo, água, terra,
// ar, sombra, luz) entravam na escala CRUA do eixo de elementos (25-55) e os
// 11 cósmicos numa âncora de base 15 — escalas incomensuráveis. Resultado:
// **2,4× de vantagem estrutural** para os clássicos e **7 dos 17 nunca
// dominando** (eletricidade, vileza, morte, vigor, som, gravidade, espaço).
//
// A razão era a MESMA nos dois caminhos do ritual — 2,36× com só as 6
// perguntas, 2,41× com os 20 itens —, o que descarta a camada psicométrica
// como causa e aponta a escala. `ANCHOR_BASE` passou a 45.
//
// Este arquivo trava o RESULTADO, não o coeficiente: se alguém mexer em 45,
// em `ANCHOR_GAIN` ou nos termos de traço, o que precisa continuar valendo é
// que nenhum grupo tenha vantagem estrutural e que o catálogo siga alcançável.

import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from './profile';
import { CITIES } from './cities';
import { applyRitualAnswers } from './ritualAnswers';
import { CLASS_ELEMENT_ORDER } from './types';
import { ORACLE_QUESTIONS, mulberry32 } from '../oracle';
import type { Answers } from './personality/types';
import { nomeSintetico, nascimentoSintetico } from './perfisSinteticos';

const N = 250;
const SEED = 31337;

/** Os 6 que compartilham nome com os elementos do JOGO — é esse grupo que
 *  entrava numa escala maior que a dos outros 11. */
const COMPARTILHADOS = ['fogo', 'agua', 'terra', 'ar', 'sombra', 'luz'];

function medir() {
  const rng = mulberry32(SEED);
  const soma: Record<string, number> = {};
  const dominou: Record<string, number> = {};
  for (const e of CLASS_ELEMENT_ORDER) { soma[e] = 0; dominou[e] = 0; }

  for (let i = 0; i < N; i++) {
    const c = CITIES[Math.floor(rng() * CITIES.length)];
    // ⚠️ Nome VARIADO, não `Elem ${i}`: `normalizeName` descarta dígitos, e
    // índice no nome dá numerologia idêntica à amostra inteira. Ver
    // `perfisSinteticos.ts` — custou 45pp de erro de medição.
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
    const ce = applyRitualAnswers(perfil.oracle, respostas).classElements as Record<string, number>;

    let topo = CLASS_ELEMENT_ORDER[0];
    for (const e of CLASS_ELEMENT_ORDER) {
      soma[e] += ce[e];
      if (ce[e] > ce[topo]) topo = e;
    }
    dominou[topo]++;
  }
  return { soma, dominou };
}

describe('ocorrência dos 17 elementos do class-system', () => {
  const { soma, dominou } = medir();
  const cosmicos = CLASS_ELEMENT_ORDER.filter(e => !COMPARTILHADOS.includes(e));

  it('nenhum GRUPO tem vantagem estrutural sobre o outro', () => {
    const mediaComp = COMPARTILHADOS.reduce((a, e) => a + soma[e], 0) / (COMPARTILHADOS.length * N);
    const mediaCosm = cosmicos.reduce((a, e) => a + soma[e], 0) / (cosmicos.length * N);
    const razao = mediaComp / mediaCosm;
    // Era 2,47×. Medido depois: 1,10×. O teto de 1,45 dá folga para variação
    // de amostra sem admitir volta ao regime de escalas incomensuráveis.
    expect(razao, `compartilhados ${mediaComp.toFixed(2)} × cósmicos ${mediaCosm.toFixed(2)} = ${razao.toFixed(2)}x`)
      .toBeLessThanOrEqual(1.45);
  });

  it('TODOS os 17 chegam a dominar alguma ficha', () => {
    const nunca = CLASS_ELEMENT_ORDER.filter(e => dominou[e] === 0);
    // Eram 7 os que nunca dominavam. Depois de `ANCHOR_BASE` 45 sobrou 1
    // (`vileza`); depois de desacoplá-la de Plutão, **nenhum**. Medido:
    // 17/17 em 400 perfis. O piso de 16 dá folga para a amostra menor do CI
    // sem admitir a volta de elemento inalcançável.
    expect(CLASS_ELEMENT_ORDER.length - nunca.length, `nunca dominam: ${nunca.join(', ') || '(nenhum)'}`)
      .toBeGreaterThanOrEqual(16);
  });

  it('nenhum elemento vira o dominante da maioria', () => {
    const maior = Math.max(...CLASS_ELEMENT_ORDER.map(e => dominou[e])) / N;
    expect(maior, `maior fatia: ${(maior * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.22);
  });

  it('`vileza` e `morte` estão DESACOPLADAS — as duas alcançam o topo', () => {
    // Histórico, para não ser redescoberto: as duas saíam do MESMO planeta
    // (`vileza` com fator 0,9 contra 1,0 de `morte`), e o termo que deveria
    // separá-las — Honestidade-Humildade baixa × neuroticismo — é NEUTRO no
    // caminho das 6 perguntas, metade dos jogadores. As médias empatavam
    // (5,78 × 5,79) e `vileza` nunca dominava: `morte` levava o topo nos
    // picos.
    //
    // Desde 22/09/2026 `vileza` é Plutão + Marte (os dois maléficos
    // clássicos) e `morte` segue Plutão puro. Cada uma tem mapa próprio em
    // que vencer.
    expect(dominou.vileza, `vileza domina ${dominou.vileza}× · morte ${dominou.morte}×`)
      .toBeGreaterThan(0);
    expect(dominou.morte).toBeGreaterThan(0);
  });
});
