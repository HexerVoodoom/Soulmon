/**
 * NADA DA GUILDA MORA NO SAVE (`docs/PLANO-GUILDA.md` §10.7).
 *
 * O ponteiro autoritativo é `coopOf:<saveId>`, no servidor. Um `guildId` no
 * GameState seria uma segunda fonte para o mesmo fato — e mentiria depois de uma
 * saída feita em outro aparelho (footgun 9). Também não vai `localStorage` além
 * de duas chaves de conveniência, e todas passam por `storageKeys.ts`.
 *
 * Guard sobre o AST (não regex sobre texto): comentário que cita o nome do campo
 * para explicar por que ele NÃO existe não pode reprovar.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(__dirname, '../..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');
const src = (rel: string) => ts.createSourceFile(rel, read(rel), ts.ScriptTarget.Latest, true);

const VETADO = /guild|coop|roda\b|bosque|grove/i;
/**
 * As ÚNICAS chaves de localStorage da guilda que o plano admite (§10.7). Decisão do dono (B2): a
 * SEGUNDA do plano (`thread-day`) nunca foi necessária e SAIU da lista: no lugar entram os RECIBOS
 * do resgate da Feira (`soulmon-guild-claimed`) — o KV é eventualmente consistente, e é essa lista
 * que impede o segundo crédito de Emblemas. São exatamente DUAS chaves admitidas, e nenhuma outra.
 */
const CHAVES_DE_CONVENIENCIA = new Set(['soulmon-guild-last-stage', 'soulmon-guild-claimed']);

function membrosDe(file: ts.SourceFile, nome: string): string[] {
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isInterfaceDeclaration(n) && n.name.text === nome) {
      for (const m of n.members) if (m.name) out.push(m.name.getText(file));
    }
    ts.forEachChild(n, visit);
  };
  visit(file);
  return out;
}

describe('a guilda não entra no save nem no localStorage', () => {
  it('a interface GameState existe e não tem campo de guilda', () => {
    const campos = membrosDe(src('src/contexts/GameStateContext.tsx'), 'GameState');
    expect(campos.length).toBeGreaterThan(50); // o guard enxerga o alvo
    // EXCEÇÃO ÚNICA, decidida na Casa da guilda (PR2, 11/10/2026): `guildDonatedItem` NÃO é estado da guilda
    // (o ponteiro e o slot são do servidor) — é o INVENTÁRIO do jogador: o item de decoração que ele pôs na
    // casa e que, por regra, não pode valer no cenário pessoal enquanto estiver lá (`utils/guildHouse.ts`).
    // Sem o campo, o item voltaria ao cenário pessoal offline. O servidor continua sendo a fonte do slot.
    // 2ª EXCEÇÃO (Bosque, 18/10/2026): `bosqueArvores` é o PICO de cada árvore por estação e o ano-ciclo em que completou/
    // aperfeiçoou — pedido do dono (a aperfeiçoada só nasce no ano seguinte à completa, derivada do save, não de relógio).
    // O servidor só mostra a estação de hoje; sem guilda, id, nome, código nem membro nele: só 4 estações × 3 anos.
    const PERMITIDOS = new Set(['guildDonatedItem', 'guildMission', 'bosqueArvores']);
    expect(campos.filter(c => VETADO.test(c) && !PERMITIDOS.has(c))).toEqual([]);
  });

  it('storageKeys.ts: exatamente as duas chaves de conveniência (last-stage e claimed), com esses nomes', () => {
    const file = src('src/utils/storageKeys.ts');
    const valores: string[] = [];
    const visit = (n: ts.Node) => {
      if (ts.isStringLiteralLike(n)) valores.push(n.text);
      ts.forEachChild(n, visit);
    };
    visit(file);
    expect(valores.length).toBeGreaterThan(20); // o guard enxerga o alvo
    const daGuilda = valores.filter(v => VETADO.test(v));
    expect(daGuilda.filter(v => !CHAVES_DE_CONVENIENCIA.has(v))).toEqual([]);
    expect(daGuilda.sort()).toEqual(['soulmon-guild-claimed', 'soulmon-guild-last-stage']);
  });

  it('o cliente da guilda não grava em localStorage direto (só storageKeys/safeStorage)', () => {
    for (const rel of ['src/utils/community.ts', 'src/utils/guildCopy.ts', 'src/utils/guildCopyCore.ts', 'src/utils/guildRules.ts', 'src/utils/guildClaimLocal.ts', 'src/utils/groveLocal.ts', 'src/hooks/useGroveWatch.ts', 'src/components/guild/GuildSheet.tsx', 'src/components/guild/FeiraVisor.tsx', 'src/components/guild/GroveMilestoneCeremony.tsx']) {
      const ids: string[] = [];
      const visit = (n: ts.Node) => {
        if (ts.isIdentifier(n)) ids.push(n.text);
        ts.forEachChild(n, visit);
      };
      visit(src(rel));
      expect(ids, rel).not.toContain('localStorage');
      expect(ids, rel).not.toContain('setGameState');
    }
  });
});

describe('L4: as memórias de FALLBACK (storage cheio) vivem no módulo, nunca no save', () => {
  it('as duas memórias de execução (`reconhecido`, `memoria`) são `Map`/`Set` de módulo — o GameState continua sem campo de guilda', () => {
    expect(read('src/utils/groveLocal.ts')).toMatch(/const reconhecido = new Map<string, number>\(\)/);
    expect(read('src/utils/guildClaimLocal.ts')).toMatch(/const memoria = new Set<string>\(\)/);
    // e o crédito da Feira continua entrando por UM caminho: `earnEmblems` no App, chamado pela folha via `onClaimed`
    expect(read('src/App.tsx')).toMatch(/const handleGuildClaimed = useCallback\(\(claim: \{ emblems: number; trophyId: string \| null \}\) => \{\s*earnEmblems\(claim\.emblems\)/);
  });

  it('a chave `soulmon-guild-claimed` guarda só recibos opacos e a MARCA `~semana` de tentativa — nenhum id de guilda nem quantia', () => {
    const fonte = read('src/utils/guildClaimLocal.ts');
    expect(fonte).toMatch(/const ATTEMPT = '~'/);
    expect(fonte).not.toMatch(/emblems|gid|guildId|\.name\b/);
  });
});
