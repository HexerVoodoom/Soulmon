import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// D-60 (resíduo, 19/10/2026): RÉGUA que reprova desenhar OUTRO jogador com a árvore genérica
// (`SOULMON_SPRITES`, gato-coruja descartado). Oponente/perfil público só passa por `opponentArt.ts`.
// Chamadas de `getSpriteForStage` SEM linha de arte (1 argumento): hoje só o PRÓPRIO jogador, como piso quando ainda não há linha
// (lista fechada abaixo). D-104 (20/10/2026): a árvore genérica foi REMOVIDA — o piso agora é um INICIAL atual (`fallbackStarterFor`),
// então essas chamadas não mostram mais arte defasada. Entrada nova aqui = decisão consciente; nunca para oponente.

const SRC = join(__dirname, '..');
function arquivos(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== 'assets') arquivos(p, out); }
    else if (/\.(ts|tsx)$/.test(n) && !/\.test\./.test(n)) out.push(p);
  }
  return out;
}
const rel = (p: string) => relative(SRC, p).split(sep).join('/');

/** Argumentos de cada chamada `nome(...)` (parênteses balanceados), sem comentário. */
function chamadas(src: string, nome: string): string[][] {
  const limpo = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const res: string[][] = [];
  const re = new RegExp(String.raw`(?<![\w.])` + nome + String.raw`\(`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(limpo))) {
    let i = re.lastIndex, d = 1, atual = '';
    const args: string[] = [];
    for (; i < limpo.length && d > 0; i++) {
      const c = limpo[i];
      if (c === '(' || c === '[' || c === '{') d++;
      else if (c === ')' || c === ']' || c === '}') { d--; if (d === 0) break; }
      if (c === ',' && d === 1) { args.push(atual.trim()); atual = ''; } else atual += c;
    }
    if (atual.trim()) args.push(atual.trim());
    res.push(args);
  }
  return res;
}

// Quem pode chamar sem linha (jogador PRÓPRIO, rookie de reserva): arquivo → quantas chamadas.
const SEM_LINHA_PERMITIDO: Record<string, number> = {
  'components/guild/GuildSheet.tsx': 1, // `mySprite || getSpriteForStage('rookie')` — o próprio jogador, calculado UMA vez e reusado (card único do Bosque)
  'components/TournamentPage.tsx': 1, // previewSrc da moldura — o próprio jogador
  'components/perfil/ProfileEditor.tsx': 1, // previewSrc da moldura do perfil — o próprio jogador
};
const OPONENTE = /\b(opp|opponent|duel|rival|enemy|member|friend|player|result\.opponent|training\.npc)\b/i;

describe('D-60: oponente nunca na árvore genérica (régua)', () => {
  const todos = arquivos(SRC).filter(f => rel(f) !== 'utils/sprites.ts' && rel(f) !== 'utils/opponentArt.ts');

  it('getSpriteForStage/lineIconForStage com argumento de oponente é reprovado', () => {
    const ruins: string[] = [];
    for (const f of todos) {
      const src = readFileSync(f, 'utf8');
      for (const nome of ['getSpriteForStage', 'lineIconForStage']) {
        for (const args of chamadas(src, nome)) if (OPONENTE.test(args[0] ?? '')) ruins.push(`${rel(f)}: ${nome}(${args.join(', ')})`);
      }
    }
    expect(ruins, `use opponentSprite/opponentIcon (utils/opponentArt.ts):\n${ruins.join('\n')}`).toEqual([]);
  });

  it('getSpriteForStage SEM linha (1 argumento) só existe na lista fechada do jogador próprio', () => {
    const achados: Record<string, number> = {};
    for (const f of todos) {
      const n = chamadas(readFileSync(f, 'utf8'), 'getSpriteForStage').filter(a => a.length === 1).length;
      if (n) achados[rel(f)] = n;
    }
    expect(achados).toEqual(SEM_LINHA_PERMITIDO);
  });

  it('SOULMON_SPRITES não vaza de sprites.ts', () => {
    for (const f of todos) {
      const src = readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(src, rel(f)).not.toMatch(/\bSOULMON_SPRITES\b/);
    }
    expect(readFileSync(join(SRC, 'utils/sprites.ts'), 'utf8')).not.toMatch(/export const SOULMON_SPRITES/);
  });
});
