// OS 8 ELEMENTOS DO JOGO E OS 9 REINOS — régua de ocorrência.
//
// Irmã de `classeElementoOcorrencia.test.ts`, que cuida dos 17 elementos do
// class-system. Esta cuida dos eixos que o JOGADOR vê no reveal.
//
// O que havia antes (medido em 600 perfis pelo pipeline real, 22/09/2026):
// `sombra` dominava **3,8%** e `pantano` **4,8%**, os dois pontos que
// destoavam. A causa de `sombra` está escrita em `axes.ts`, na própria linha
// dela: a média já estava em linha; faltava VARIÂNCIA — ela era o único
// elemento sem nenhuma das duas fontes de PICO (pool astrológico e
// numerologia), e o que lhe sobrava (neuroticismo) é neutro no caminho das 6
// perguntas. E o conserto tinha de levantar a dominância SEM levantar o
// nível, porque `sombra` é repassada crua ao class-system, onde ela já era a
// mais comum dos 17.
//
// `pantano` é o único reino cujo peso não tem nenhum elemento em 3
// (`{ agua: 2, sombra: 2, planta: 2 }`), então ele soma três elementos de
// dominância baixa e nunca tem um pico próprio. Tentou-se dar-lhe um 3: com
// `{ agua: 2, sombra: 3, planta: 2 }` ele salta para **32,3%**, porque o
// escore do reino é soma CRUA e o peso total passaria de 6 para 7 — os nove
// reinos empatam em 6 de propósito. Com `{ agua: 1, sombra: 3, planta: 2 }`,
// que mantém o total, ele anda 0,2pp e a água deixa de liderar um pântano.
// **A tabela ficou como está**, e `pantano` andou pouco (4,8% → 5,0%): o
// resto da diferença é fidelidade — o reino segue os elementos da pessoa, e
// os dele continuam entre os menos dominantes. O que se recusou foi comprar
// os pontos dele quebrando o empate de peso total entre os nove reinos. Desigualdade populacional é o desenho (ver a decisão
// do dono em `escolaFidelidade.test.ts`); outlier de 4× não era.
//
// Este arquivo trava o RESULTADO, não os coeficientes.

import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from './profile';
import { CITIES } from './cities';
import { applyRitualAnswers } from './ritualAnswers';
import { ELEMENT_ORDER, REALM_ORDER, ORACLE_QUESTIONS, mulberry32 } from '../oracle';
import type { Answers } from './personality/types';
import { nomeSintetico, nascimentoSintetico } from './perfisSinteticos';

const N = 250;
const SEED = 20260922;

function medir() {
  const rng = mulberry32(SEED);
  const elemento: Record<string, number> = {};
  const reino: Record<string, number> = {};
  for (const e of ELEMENT_ORDER) elemento[e] = 0;
  for (const r of REALM_ORDER) reino[r] = 0;

  for (let i = 0; i < N; i++) {
    const c = CITIES[Math.floor(rng() * CITIES.length)];
    // ⚠️ Nome VARIADO — ver `perfisSinteticos.ts`, custou 45pp de erro.
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
    const eixos = applyRitualAnswers(perfil.oracle, respostas);
    const els = eixos.elements as Record<string, number>;
    let topo = ELEMENT_ORDER[0];
    for (const e of ELEMENT_ORDER) if (els[e] > els[topo]) topo = e;
    elemento[topo]++;
    reino[eixos.dominantRealm]++;
  }
  return { elemento, reino };
}

describe('ocorrência dos 8 elementos e dos 9 reinos', () => {
  const { elemento, reino } = medir();
  const fatias = (o: Record<string, number>) =>
    Object.entries(o).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${(v / N * 100).toFixed(1)}%`).join(' · ');

  it('nenhum elemento fica fora do alcance da população', () => {
    // `sombra` estava em 3,8%. Medido depois do conserto: 10,3% em 600
    // perfis (`industrial` 10,7% é o vizinho, `planta` 6,5% o piso real). O
    // piso de 5% dá folga para a amostra menor do CI sem admitir a volta do
    // outlier.
    for (const e of ELEMENT_ORDER) {
      expect(elemento[e] / N, `${e} — ${fatias(elemento)}`).toBeGreaterThanOrEqual(0.05);
    }
  });

  it('nenhum elemento vira o dominante da maioria', () => {
    const maior = Math.max(...ELEMENT_ORDER.map(e => elemento[e])) / N;
    // Medido: terra 16,8% · ar 16,8%. O teto admite a liderança (que é fiel —
    // são os elementos mais dominantes da população) e recusa o monopólio.
    expect(maior, fatias(elemento)).toBeLessThanOrEqual(0.28);
  });

  it('todos os 9 reinos são alcançáveis, e nenhum some', () => {
    // Medido: floresta 21,0% … cavernas 6,7% · pantano 5,0%. O piso de 4% recusa
    // reino inalcançável; ele NÃO exige uniformidade — o reino segue os
    // elementos da pessoa, e a proporção desigual é o desenho.
    for (const r of REALM_ORDER) {
      expect(reino[r] / N, `${r} — ${fatias(reino)}`).toBeGreaterThanOrEqual(0.04);
    }
  });

  it('nenhum reino vira o dominante da maioria', () => {
    const maior = Math.max(...REALM_ORDER.map(r => reino[r])) / N;
    expect(maior, fatias(reino)).toBeLessThanOrEqual(0.28);
  });
});
