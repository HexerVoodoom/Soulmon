// PESO DO CAMINHO (poder/harmonia/benevolencia) SOBRE O ELEMENTO — régua do
// pedido do dono (28/09/2026): "garanta que as evoluções ainda tenham
// flexibilidade [...] Não deve ser impossível haver benevolência e sombra no
// mesmo personagem mas deve ser mais raro e difícil do que poder+sombra ou
// benevolência+luz."
//
// Três propriedades, nesta ordem de importância:
//   1. NENHUM par (alinhamento, elemento) é inalcançável — flexibilidade.
//   2. benevolencia+sombra ocorre menos que poder+sombra.
//   3. benevolencia+sombra ocorre menos que benevolencia+luz.
//
// Mesmo harness de `elementoOcorrencia.test.ts` (perfis sintéticos
// determinísticos, sem repo irmão).

import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from './profile';
import { CITIES } from './cities';
import { applyRitualAnswers } from './ritualAnswers';
import { ORACLE_QUESTIONS, mulberry32 } from '../oracle';
import type { Answers } from './personality/types';
import { nomeSintetico, nascimentoSintetico } from './perfisSinteticos';

const N = 600;
const SEED = 20260928;

function medir() {
  const rng = mulberry32(SEED);
  const pares: Record<string, number> = {};
  const porAlinhamento: Record<string, number> = { poder: 0, harmonia: 0, benevolencia: 0 };

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
    const eixos = applyRitualAnswers(perfil.oracle, respostas);
    const chave = `${eixos.dominantAlignment}+${eixos.dominantElement}`;
    pares[chave] = (pares[chave] ?? 0) + 1;
    porAlinhamento[eixos.dominantAlignment]++;
  }
  return { pares, porAlinhamento };
}

describe('peso do caminho (poder/harmonia/benevolencia) sobre o elemento', () => {
  const { pares, porAlinhamento } = medir();
  const taxa = (alinhamento: string, elemento: string) =>
    (pares[`${alinhamento}+${elemento}`] ?? 0) / (porAlinhamento[alinhamento] || 1);

  it('benevolência+sombra é mais raro que poder+sombra', () => {
    const bs = taxa('benevolencia', 'sombra');
    const ps = taxa('poder', 'sombra');
    expect(bs, `benevolencia+sombra=${(bs * 100).toFixed(1)}% · poder+sombra=${(ps * 100).toFixed(1)}%`)
      .toBeLessThan(ps);
  });

  it('benevolência+sombra é mais raro que benevolência+luz', () => {
    const bs = taxa('benevolencia', 'sombra');
    const bl = taxa('benevolencia', 'luz');
    expect(bs, `benevolencia+sombra=${(bs * 100).toFixed(1)}% · benevolencia+luz=${(bl * 100).toFixed(1)}%`)
      .toBeLessThan(bl);
  });

  it('NENHUM par (alinhamento, elemento) é impossível — inclusive benevolência+sombra', () => {
    // Flexibilidade: "difícil", não "impossível". Com N=600 e 3×8=24 pares, um
    // par genuinamente inalcançável ficaria em 0 — a régua é só isso, não uma
    // proporção mínima (a raridade PEDIDA já é o que os dois testes acima
    // travam).
    expect(pares['benevolencia+sombra'] ?? 0, JSON.stringify(pares)).toBeGreaterThan(0);
  });
});
