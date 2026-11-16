// ---------------------------------------------------------------------------
// MEDIÇÃO do companheiro invocado (PR 1, 16/11/2026): quantos Soulmon, por estágio, entram no gatilho.
// Perfis sintéticos pelo pipeline REAL (mesmo gerador de `criacaoDistribuicao.test.ts`, seed diferente), ficha por estágio
// (`buildFichaESkills`) e classe REAL (`computeClassTitlesAllStages`, motor do class-system). Gatilho = arquétipo na lista (B)
// OU escola dominante com Evocação (A). Imprime a tabela; as asserções travam só o que é invariante (não um percentual, que
// é decisão de balanceamento do dono — ver Q7 do plano).
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { buildSoulProfile } from '../profile';
import { CITIES } from '../cities';
import { ORACLE_QUESTIONS, mulberry32 } from '../../oracle';
import type { OracleInput } from '../../oracle';
import type { Answers } from '../personality/types';
import { nomeSintetico, nascimentoSintetico } from '../perfisSinteticos';
import { buildFichaESkills } from './fromInput';
import { computeClassTitlesAllStages, arquetipoIdDoTitulo } from './classTitle';
import { derivarEvocacao, escolaDominanteComEvocacao } from './evocacaoPorEstagio';
import { ARQUETIPOS_EVOCACAO, eEvocador } from '../../companheiroInvocado';
import { FICHA_STAGE_ORDER } from './types';

const N = 48;
const SEED = 16112026;

function pessoa(rng: () => number): OracleInput {
  const c = CITIES[Math.floor(rng() * CITIES.length)];
  const nome = nomeSintetico(rng);
  const nasc = nascimentoSintetico(rng);
  const quiz: Record<string, string> = {};
  for (const q of ORACLE_QUESTIONS) quiz[q.id] = q.options[Math.floor(rng() * q.options.length)].id;
  const soulProfile = buildSoulProfile({
    fullName: nome, ...nasc, timeUnknown: false, placeLabel: c.name,
    latitude: c.latitude, longitude: c.longitude, timeZone: c.timeZone,
  }, {} as Answers);
  return { fullName: nome, birthDate: nasc.birthDate, birthTime: nasc.birthTime, birthPlace: c.name, soulProfile, answers: quiz } as OracleInput;
}

describe('medição: quem entra no gatilho do companheiro invocado, por estágio', () => {
  it('conta A (escola), B (arquétipo) e A∪B por estágio sobre perfis sintéticos', async () => {
    const rng = mulberry32(SEED);
    const porEstagio = Object.fromEntries(FICHA_STAGE_ORDER.map(s => [s, { A: 0, B: 0, uniao: 0 }]));
    let escolaIgualNosCinco = 0;
    let comAlgumEstagio = 0;
    for (let i = 0; i < N; i++) {
      const input = pessoa(rng);
      const { fichaByStage, dominantElement } = buildFichaESkills(input, `medicao-evocacao-${i}`);
      const titulos = await computeClassTitlesAllStages(fichaByStage, dominantElement);
      const cache = derivarEvocacao(fichaByStage, titulos);
      const escolas = FICHA_STAGE_ORDER.map(s => escolaDominanteComEvocacao(fichaByStage[s]));
      if (escolas.every(e => e === escolas[0])) escolaIgualNosCinco++;
      let algum = false;
      for (const s of FICHA_STAGE_ORDER) {
        const A = escolaDominanteComEvocacao(fichaByStage[s]) === 'evocacao';
        const arq = arquetipoIdDoTitulo(titulos[s]);
        const B = !!arq && ARQUETIPOS_EVOCACAO.includes(arq);
        // o cache bate com a regra por construção
        expect(cache[s]?.evocador).toBe(A || B);
        expect(cache[s]?.evocador).toBe(eEvocador(s, { arquetipoId: arq, escolaDominante: escolaDominanteComEvocacao(fichaByStage[s]) }));
        if (A) porEstagio[s].A++;
        if (B) porEstagio[s].B++;
        if (A || B) { porEstagio[s].uniao++; algum = true; }
      }
      if (algum) comAlgumEstagio++;
    }
    const linhas = FICHA_STAGE_ORDER.map(s => `${s.padEnd(9)} A(escola)=${String(porEstagio[s].A).padStart(3)}  B(arquétipo)=${String(porEstagio[s].B).padStart(3)}  A∪B=${String(porEstagio[s].uniao).padStart(3)}  (${Math.round((100 * porEstagio[s].uniao) / N)}% de ${N})`);
    console.info(`[medição companheiro invocado] N=${N} seed=${SEED}\n${linhas.join('\n')}\nescola dominante igual nos 5 estágios: ${escolaIgualNosCinco}/${N}; evocador em ao menos 1 estágio: ${comAlgumEstagio}/${N}`);

    for (const s of FICHA_STAGE_ORDER) {
      expect(porEstagio[s].uniao).toBeLessThanOrEqual(N);
      expect(porEstagio[s].uniao).toBeGreaterThanOrEqual(Math.max(porEstagio[s].A, porEstagio[s].B));
      expect(porEstagio[s].uniao).toBeLessThanOrEqual(porEstagio[s].A + porEstagio[s].B);
    }
    expect(comAlgumEstagio).toBeLessThanOrEqual(N);
  }, 120_000);
});
