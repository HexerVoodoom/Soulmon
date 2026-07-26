// Simula 3 usuários passando pelo oráculo (utils/oracle.ts) — o MESMO sistema
// real do onboarding — para gerar os prompts de imagem oficiais do jogo
// (CreatureStage.imagePrompt) usados nas linhas placeholder da masmorra
// (Ignar=poder/virus, Lumel=harmonia/data, Serah=benevolência/vaccine).
// Roda com: npx tsx scripts/simulate-oracle-lines.ts
import { generateOracle, ORACLE_QUESTIONS, creatureFormId, type OracleInput } from '../src/utils/oracle';

type Align = 'poder' | 'harmonia' | 'benevolencia';

// Escolhe, pra cada pergunta, a opção cujos efeitos pesam mais pro alinhamento alvo.
function answersFor(align: Align): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const q of ORACLE_QUESTIONS) {
    let best = q.options[0];
    let bestScore = -Infinity;
    for (const opt of q.options) {
      const score = opt.effects.alignments?.[align] ?? 0;
      if (score > bestScore) { bestScore = score; best = opt; }
    }
    answers[q.id] = best.id;
  }
  return answers;
}

const PROFILES: { line: string; align: Align; input: OracleInput }[] = [
  {
    line: 'ignar',
    align: 'poder',
    input: {
      fullName: 'Ignis Valente', birthDate: '1998-03-21', birthTime: '06:15',
      birthPlace: 'Brasília, Brasil', answers: answersFor('poder'),
    },
  },
  {
    line: 'lumel',
    align: 'harmonia',
    input: {
      fullName: 'Lumen Azuria', birthDate: '1995-11-02', birthTime: '23:40',
      birthPlace: 'Kyoto, Japão', answers: answersFor('harmonia'),
    },
  },
  {
    line: 'serah',
    align: 'benevolencia',
    input: {
      fullName: 'Serah Dourado', birthDate: '2001-07-09', birthTime: '12:00',
      birthPlace: 'Lisboa, Portugal', answers: answersFor('benevolencia'),
    },
  },
];

const attrByAlign: Record<Align, 'virus' | 'data' | 'vaccine'> = {
  poder: 'virus', harmonia: 'data', benevolencia: 'vaccine',
};

const out: Record<string, { stage: string; name: string; imagePrompt: string }[]> = {};

for (const { line, align, input } of PROFILES) {
  const result = generateOracle(input);
  const attr = attrByAlign[align];
  const wanted = ['rookie', `champion-${attr}`, `ultimate-${attr}`, `mega-${attr}`];
  const stages = result.creature.stages
    .map(s => ({ id: creatureFormId(s), name: s.name, imagePrompt: s.imagePrompt }))
    .filter(s => wanted.includes(s.id))
    .sort((a, b) => wanted.indexOf(a.id) - wanted.indexOf(b.id));
  out[line] = stages.map(s => ({ stage: s.id, name: s.name, imagePrompt: s.imagePrompt }));
  console.error(`[${line}] baseName=${result.creature.baseName} align=${align} attr=${attr}`);
}

console.log(JSON.stringify(out, null, 2));
