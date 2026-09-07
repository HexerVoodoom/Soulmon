/**
 * WP4.20 — o cabeçalho da masmorra para de mentir, e a verdade fica travada.
 *
 * As cinco linhas de abertura de `dungeon.ts` afirmavam três coisas, e as três
 * eram falsas: o nível "resets monthly" (é `weekKey`, semanal), havia "a daily
 * play limit" (não há) e "entry is gated only by HP (losing costs a real
 * heart)" (perder não custa nada — `handleDungeonLose` é um callback vazio).
 *
 * Corrigir o comentário sozinho não impede a próxima divergência: comentário
 * não quebra. Então o teste trava a REGRA que o comentário passou a descrever —
 * perder não pode voltar a cobrar coração — por leitura da fiação, do mesmo
 * jeito que `playerDay.contract.test.ts` trava a família do dia do jogador.
 *
 * A regra em si está no `CLAUDE.md` ⚔️ e não é estética: o jogo NUNCA cobra da
 * barra que representa o cuidado que o usuário teve consigo mesmo. Cobrar ali
 * trancava fora do conteúdo justamente quem tinha tido uma semana ruim.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Normaliza CRLF antes de qualquer recorte. O guard delimita corpo de funcao
// procurando a LINHA EM BRANCO; num checkout Windows ela e CRLF, a busca
// falhava, o recorte pegava quase o arquivo inteiro e o teste acusava
// `healthPoints` de uma funcao VIZINHA. Falso positivo so fora do Linux.
const ler = (p: string) =>
  readFileSync(resolve(process.cwd(), p), 'utf-8')
    .replace(/\r\n/g, '\n');

describe('masmorra — perder não cobra coração (WP4.20)', () => {
  it('o cabeçalho não afirma nenhuma das três coisas falsas', () => {
    // O arquivo INTEIRO, e não só o cabeçalho: é o comando de aceite do WP4.20.
    // Nem a nota histórica pode repetir as frases — foi por isso que o WP4.9
    // teve de reescrever o próprio aceite (a agulha dentro do comando).
    const fonte = ler('src/utils/dungeon.ts');
    for (const mentira of ['resets monthly', 'daily play limit', 'costs a real heart']) {
      expect(fonte, `\`dungeon.ts\` voltou a dizer "${mentira}"`).not.toContain(mentira);
    }
  });

  it('o cabeçalho diz o que o arquivo faz: reset semanal, sem limite, sem gate', () => {
    const fonte = ler('src/utils/dungeon.ts');
    expect(fonte).toContain('resets WEEKLY');
    expect(fonte).toMatch(/no per-day cap.*no entry gate/s);
    // E a função que ele descreve continua sendo semanal de verdade.
    expect(fonte).toMatch(/function weekKey/);
    expect(fonte).not.toMatch(/function monthKey/);
  });

  it('`handleDungeonLose` continua sem tocar em coração nenhum', () => {
    const app = ler('src/App.tsx');
    const inicio = app.indexOf('const handleDungeonLose');
    expect(inicio, '`handleDungeonLose` sumiu — se mudou de nome, atualize este guard').toBeGreaterThan(0);
    const corpo = app.slice(inicio, app.indexOf('\n\n', inicio));
    for (const proibido of ['healthPoints', 'setGameState', 'HEART']) {
      expect(corpo, `a derrota na masmorra passou a mexer em \`${proibido}\``).not.toContain(proibido);
    }
  });

  it('o componente também não promete um custo que não existe', () => {
    const jogo = ler('src/components/DungeonGame.tsx');
    expect(jogo).not.toMatch(/-1 real heart/);
  });
});
