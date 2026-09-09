/**
 * A EVOLUÇÃO É MANUAL — e o app tinha que parar de prometer o contrário.
 *
 * `MANUAL_EVOLUTION = true` (`types/progression.ts`) e o ramo que evoluía na
 * virada do dia vive atrás de `!MANUAL_EVOLUTION` em `utils/dailyReset.ts`:
 * está MORTO. Quem dispara é o jogador, tocando na criatura com a barra cheia.
 *
 * ## O que a varredura de 09/09/2026 achou
 *
 * Quatro descrições da mesma regra, e três estavam erradas:
 *
 *  1. `'Pronto para evoluir na virada do dia.'` — a frase que aparece
 *     EXATAMENTE quando a barra enche. Quem lia isso esperava a virada, não
 *     acontecia nada, e a barra continuava cheia na tela: o modo de falha lê
 *     como defeito do jogo, não como "faltou tocar".
 *  2. `'Seu Soulmon vai evoluir sozinho assim que o dia virar.'` — o texto do
 *     estado DESTRAVADO, prometendo automático.
 *  3. `'…só espera você dizer quando.'` — o texto do estado TRAVADO, que
 *     descrevia o comportamento do DESTRAVADO. Os dois estavam invertidos:
 *     travado é justamente o estado em que dizer não resolve.
 *  4. A tabela de regras do `CLAUDE.md`, que dizia "Destravado: evolui na
 *     próxima virada" — descrição de antes da mudança.
 *
 * A única correta era `'Pronto para evoluir — mas você segurou a evolução.'`
 *
 * ## Por que um guard, e não só o conserto
 *
 * Porque a regra é um BOOLEANO que alguém pode virar, e o texto não acompanha
 * sozinho. Enquanto `MANUAL_EVOLUTION` for `true`, nenhuma frase de interface
 * pode dizer que a virada evolui; no dia em que virar `false`, este arquivo é o
 * lugar que manda revisar os textos — e o primeiro caso abaixo é o que avisa.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { MANUAL_EVOLUTION } from '../types/progression';

const RAIZ = resolve(__dirname, '../..');
const ler = (p: string) => readFileSync(join(RAIZ, p), 'utf8');

/** Só o conteúdo dos literais de string — comentário conta a história e cita
 *  o texto antigo de propósito (a aceitação autodestrutiva que o
 *  `utils/dungeon.ts` já registra ter consertado uma vez). */
function literaisDeInterface(src: string): string[] {
  const fora: string[] = [];
  for (const linha of src.split('\n')) {
    const s = linha.trim();
    if (s.startsWith('//') || s.startsWith('*') || s.startsWith('/*')) continue;
    for (const m of linha.matchAll(/(['"`])((?:[^\\]|\\.)*?)\1/g)) fora.push(m[2]);
  }
  return fora;
}

/** As formas de dizer "acontece sozinho na virada". */
const PROMETE_AUTOMATICO = [
  /evoluir?\s+sozinh/i,
  /evolve\s+on\s+its\s+own/i,
  /na\s+virada\s+do\s+dia/i,
  /at\s+the\s+(next\s+)?day.?s\s+turn/i,
  /evolui\s+na\s+pr[óo]xima\s+virada/i,
];

describe('🔴 nenhum texto promete evolução automática', () => {
  it('AUTOVERIFICAÇÃO: a regra em vigor É a manual', () => {
    // Se este caso cair, a regra mudou e TODOS os textos abaixo precisam ser
    // revisados — não é para "consertar o teste", é para reescrever a copy.
    expect(
      MANUAL_EVOLUTION,
      'MANUAL_EVOLUTION virou false: revise os textos de EvolutionPath.tsx e a tabela do CLAUDE.md ANTES de mexer neste arquivo.',
    ).toBe(true);
  });

  it('a página de Evolução não diz que a virada evolui', () => {
    const ruins: string[] = [];
    for (const lit of literaisDeInterface(ler('src/components/EvolutionPath.tsx'))) {
      if (PROMETE_AUTOMATICO.some(rx => rx.test(lit))) ruins.push(lit.slice(0, 70));
    }
    expect(
      ruins,
      'A evolução é MANUAL: a virada do dia nunca evolui (o ramo em `utils/dailyReset.ts` está atrás de `!MANUAL_EVOLUTION`). Prometer automático faz a barra cheia parecer defeito.',
    ).toEqual([]);
  });

  it('AUTOVERIFICAÇÃO: a varredura ENXERGA a frase que existia', () => {
    // Sem isto, um erro na expressão deixaria o caso acima verde para sempre.
    const antigas = [
      'Seu Soulmon vai evoluir sozinho assim que o dia virar.',
      'It will evolve on its own at the next day’s turn.',
      'Pronto para evoluir na virada do dia.',
      'Ready to evolve at the day’s turn.',
    ];
    for (const t of antigas) {
      expect(PROMETE_AUTOMATICO.some(rx => rx.test(t)), t).toBe(true);
    }
    // E NÃO reclama do texto correto — guard que reprova a copy certa é
    // desligado na primeira semana.
    for (const bom of [
      'Pronto! Toque no seu Soulmon para evoluir.',
      'Ready! Tap your Soulmon to evolve.',
      'Pronto para evoluir — mas você segurou a evolução.',
      'Quando a barra enche, toque no seu Soulmon para evoluir. Nada acontece sem você.',
    ]) {
      expect(PROMETE_AUTOMATICO.some(rx => rx.test(bom)), bom).toBe(false);
    }
  });

  it('os textos NOVOS dizem quem dispara, nos dois idiomas', () => {
    // O oposto de "não mentir" não é "não dizer nada": a frase tem que ensinar
    // o gesto, senão a barra cheia continua sem saída aparente.
    const src = ler('src/components/EvolutionPath.tsx');
    expect(src).toMatch(/Toque no seu Soulmon para evoluir/);
    expect(src).toMatch(/Tap your Soulmon to evolve/);
  });

  it('e o estado TRAVADO não descreve o comportamento do destravado', () => {
    // Travado é o estado em que dizer NÃO resolve — `handleEvolve` devolve o
    // mesmo objeto e `canEvolve` é false (`App.tsx`). Um texto de travado que
    // diga "só espera você dizer quando" é a inversão que estava lá.
    const src = ler('src/components/EvolutionPath.tsx');
    for (const lit of literaisDeInterface(src)) {
      if (/só espera você dizer quando|waits for your go-ahead/i.test(lit)) {
        throw new Error(`o texto do estado travado voltou a descrever o destravado: "${lit}"`);
      }
    }
    expect(src).toMatch(/evolução está segurada|evolution is on hold/);
  });

  it('a tabela de regras do CLAUDE.md concorda com o código', () => {
    const doc = ler('CLAUDE.md');
    const i = doc.indexOf('🔒 Cadeado de evolução');
    expect(i, 'a linha do cadeado saiu do CLAUDE.md').toBeGreaterThan(-1);
    const linha = doc.slice(i, doc.indexOf('\n', i));
    // A frase antiga pode aparecer CITADA como corrigida (é a história da
    // decisão), mas não como afirmação.
    if (/evolui na próxima virada/.test(linha)) {
      expect(
        /dizia|⚠️/.test(linha),
        'a linha do cadeado voltou a AFIRMAR que a virada evolui',
      ).toBe(true);
    }
    expect(linha).toMatch(/o JOGADOR dispara|jogador dispara/);
  });
});
