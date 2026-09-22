// O CLASS-SYSTEM EXPLORADO AO MÁXIMO — régua de ocorrência dos arquétipos.
//
// Decisão do dono (22/09/2026): "o class-system deve ser explorado ao máximo,
// com mesma chance pra todas as combinações e classes".
//
// O que havia antes, medido em 120 perfis pelo pipeline real, no ultra:
//
//   · **76 dos 79 arquétipos se qualificavam** em pelo menos uma ficha;
//   · cada ficha qualificava **24,7** deles na mediana (mín 13, máx 46);
//   · e mesmo assim **só 9 venciam** — `mago_vermelho` em **73 de 120 (61%)**,
//     e ele era o mais comum em TODOS os cinco papéis, inclusive tanque e
//     suporte.
//
// O conteúdo estava lá; o critério de escolha é que o jogava fora. Era
// "sempre o arquétipo de condição mais específica", uma função só da
// CONDIÇÃO — então o mesmo conjunto qualificado devolvia o mesmo vencedor
// sempre, e as fichas do Soulmon se concentram nos mesmos eixos.
//
// Hoje a escolha é determinística pela IDENTIDADE entre os qualificados
// (`melhorArquetipo` em `classTitle.ts`). Duas propriedades que NÃO podem se
// perder, e por isso estão travadas aqui:
//
//   1. a classe continua EMERGENTE — só entra arquétipo que a ficha
//      conquistou. Nada é escolhido à mão, nada é sorteado fora do merecido;
//   2. a classe continua ESTÁVEL — mesma pessoa, mesma classe, em toda
//      recomputação. Ela é cache determinístico no save (`soulmonClassTitles`),
//      e uma classe que muda sozinha entre aparelhos é a QA rodada 1 de novo.

import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from '../profile';
import { CITIES } from '../cities';
import { buildFicha } from './buildSheet';
import { computeClassTitle } from './classTitle';
import { buildRealPersonagem } from './realEngine';
import { applyRitualAnswers } from '../ritualAnswers';
import { ORACLE_QUESTIONS, mulberry32 } from '../../oracle';
import { CLASS_TITLE_EN } from './classTitle';
import type { Answers } from '../personality/types';

const N = 200;
const SEED = 20260922;

async function amostrar() {
  const rng = mulberry32(SEED);
  const out: { nome: string; classe: string; origem: string }[] = [];
  for (let i = 0; i < N; i++) {
    const c = CITIES[Math.floor(rng() * CITIES.length)];
    const nome = `Perfil ${i} Teste`;
    const perfil = buildSoulProfile({
      fullName: nome,
      birthDate: `${1970 + Math.floor(rng() * 40)}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rng() * 28)).padStart(2, '0')}`,
      birthTime: `${String(Math.floor(rng() * 24)).padStart(2, '0')}:${String(Math.floor(rng() * 60)).padStart(2, '0')}`,
      timeUnknown: false,
      placeLabel: c.name,
      latitude: c.latitude, longitude: c.longitude, timeZone: c.timeZone,
    }, {} as Answers);
    const respostas: Record<string, string> = {};
    for (const q of ORACLE_QUESTIONS) respostas[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
    const ficha = buildFicha(nome, applyRitualAnswers(perfil.oracle, respostas), 'ultra', nome);
    const cl = await computeClassTitle(ficha);
    out.push({ nome, classe: cl.nome.en, origem: cl.origem });
  }
  return out;
}

describe('ocorrência das classes do class-system', () => {
  it('muitas classes distintas aparecem — o catálogo é explorado', async () => {
    const amostra = await amostrar();
    const distintas = new Set(amostra.map(a => a.classe));
    // Medido em 22/09/2026: 59 distintas em 300 perfis (eram 9). O piso é
    // conservador para a amostra menor de CI; o que ele impede é a REGRESSÃO
    // para o punhado de sempre, que é o defeito que existia.
    expect(distintas.size, `distintas: ${distintas.size} — ${[...distintas].slice(0, 10).join(', ')}`)
      .toBeGreaterThanOrEqual(35);
  });

  it('nenhuma classe domina — a mais comum fica longe do monopólio', async () => {
    const amostra = await amostrar();
    const contagem = new Map<string, number>();
    for (const a of amostra) contagem.set(a.classe, (contagem.get(a.classe) ?? 0) + 1);
    const [maisComum, quantas] = [...contagem.entries()].sort((x, y) => y[1] - x[1])[0];
    const fatia = quantas / amostra.length;
    // Antes: 61%. Medido depois: 5,7% em 300 perfis. O teto de 15% dá folga
    // para a variação da amostra sem admitir volta ao monopólio.
    expect(fatia, `mais comum: ${maisComum} em ${(fatia * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.15);
  });

  it('a classe é ESTÁVEL: a mesma pessoa recebe sempre a mesma', async () => {
    // É cache determinístico no save. Instabilidade aqui reapareceria como
    // "a classe mudou sozinha ao abrir noutro aparelho".
    const a = await amostrar();
    const b = await amostrar();
    expect(b.map(x => x.classe)).toEqual(a.map(x => x.classe));
  });

  it('a classe é EMERGENTE: sempre um arquétipo que a ficha conquistou', async () => {
    // A escolha determinística não pode sortear fora da lista do motor —
    // seria classe dada, não merecida.
    const rng = mulberry32(SEED);
    for (let i = 0; i < 20; i++) {
      const c = CITIES[Math.floor(rng() * CITIES.length)];
      const nome = `Emerg ${i}`;
      const perfil = buildSoulProfile({
        fullName: nome, birthDate: '1990-05-05', birthTime: '10:00', timeUnknown: false,
        placeLabel: c.name, latitude: c.latitude, longitude: c.longitude, timeZone: c.timeZone,
      }, {} as Answers);
      const respostas: Record<string, string> = {};
      for (const q of ORACLE_QUESTIONS) respostas[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
      const ficha = buildFicha(nome, applyRitualAnswers(perfil.oracle, respostas), 'ultra', nome);
      const { prog } = await buildRealPersonagem(ficha);
      const cl = await computeClassTitle(ficha);
      if (cl.origem !== 'arquetipo') continue;
      const nomesQualificados = (prog.arquetipos as { id: string }[])
        .map(a => CLASS_TITLE_EN[a.id] ?? a.id);
      expect(nomesQualificados, `${cl.nome.en} não está entre os qualificados`)
        .toContain(cl.nome.en);
    }
  });
});
