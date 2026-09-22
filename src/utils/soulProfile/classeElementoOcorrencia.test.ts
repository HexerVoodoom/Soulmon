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
    const nome = `Elem ${i} Teste`;
    const perfil = buildSoulProfile({
      fullName: nome,
      birthDate: `${1955 + Math.floor(rng() * 55)}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rng() * 28)).padStart(2, '0')}`,
      birthTime: `${String(Math.floor(rng() * 24)).padStart(2, '0')}:${String(Math.floor(rng() * 60)).padStart(2, '0')}`,
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

  it('a grande maioria dos 17 chega a dominar alguma ficha', () => {
    const nunca = CLASS_ELEMENT_ORDER.filter(e => dominou[e] === 0);
    // Eram 7 os que nunca dominavam; medido depois, 1 (`vileza`). O piso de
    // 15/17 protege contra a regressão sem exigir o 17/17, que `vileza` não
    // alcança por razão PRÓPRIA — ver o teste abaixo.
    expect(CLASS_ELEMENT_ORDER.length - nunca.length, `nunca dominam: ${nunca.join(', ') || '(nenhum)'}`)
      .toBeGreaterThanOrEqual(15);
  });

  it('nenhum elemento vira o dominante da maioria', () => {
    const maior = Math.max(...CLASS_ELEMENT_ORDER.map(e => dominou[e])) / N;
    expect(maior, `maior fatia: ${(maior * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.22);
  });

  it('⚠️ `vileza` e `morte` são gêmeas de Plutão — medido, não escondido', () => {
    // As duas saem do MESMO planeta (`vileza` com fator 0,9, `morte` com
    // 1,0), e no caminho das 6 perguntas os termos de traço que deveriam
    // separá-las — Honestidade-Humildade baixa × neuroticismo — são neutros.
    //
    // ⚠️ A primeira versão deste teste afirmava que `morte` tem média maior e
    // por isso sombreia `vileza`. **Falso, e o teste pegou**: as médias são
    // praticamente idênticas (medido: 5,777 × 5,787 — `vileza` de leve à
    // frente). O que separa as duas não é o nível médio, é quem leva o TOPO
    // nos picos, e aí `morte` costuma ganhar.
    //
    // Consequência prática: `vileza` é a única dos 17 que não chega a
    // dominar. Não é regressão de escala; é a assimetria de compartilharem
    // planeta, e só se conserta desacoplando as duas ou dando peso real ao
    // termo de Honestidade-Humildade. Fica registrado aqui para não ser
    // redescoberto como novidade.
    const mediaMorte = soma.morte / N;
    const mediaVileza = soma.vileza / N;
    expect(Math.abs(mediaMorte - mediaVileza), `morte ${mediaMorte.toFixed(2)} × vileza ${mediaVileza.toFixed(2)}`)
      .toBeLessThan(0.5);
    expect(dominou.morte, `morte domina ${dominou.morte}× · vileza ${dominou.vileza}×`)
      .toBeGreaterThanOrEqual(dominou.vileza);
  });
});
