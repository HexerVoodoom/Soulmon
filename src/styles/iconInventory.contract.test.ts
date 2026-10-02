/**
 * TODO ÍCONE USADO TEM DE ESTAR NO SUBSET DA FONTE.
 *
 * A Material Symbols Rounded completa tem 5,3 MB; a que o app carrega é
 * subsetada por `icon_names` e tem 145 KB (`src/index.css`, `@font-face`). A
 * consequência é o modo de falha mais silencioso do projeto: **um nome fora do
 * inventário renderiza um `<span>` vazio** — sem erro no console, sem exceção,
 * sem falhar em teste de render (o texto do ícone É o nome, e ele está lá; só
 * não existe glifo para ele).
 *
 * Este teste existe porque isso ACONTECEU: o botão "Equilibrar minha semana"
 * (P4) saiu com `<Icon name="balance" />`, e `balance` não está no subset. O
 * botão foi ao ar sem ícone, e `tsc`, `vitest` e o build passaram limpos —
 * porque nenhum deles olhava para a fonte.
 *
 * A fonte da verdade é a lista de `icon_names` em `src/styles/tokens.md`, que é
 * a MESMA string usada para rebaixar o `.woff2` (o comando está lá). Se alguém
 * acrescentar um ícone, tem de acrescentar nos dois lugares — e é exatamente
 * isso que este teste cobra.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

function inventario(): Set<string> {
  const md = readFileSync(join(RAIZ, 'styles/tokens.md'), 'utf-8').replace(/\r\n/g, '\n');
  // A lista é o único bloco em crase que começa com `accessibility_new`.
  const bloco = /`(accessibility_new,[^`]+)`/.exec(md);
  expect(bloco, 'a lista de `icon_names` sumiu do tokens.md').toBeTruthy();
  return new Set(bloco![1].split(',').map(s => s.trim()).filter(Boolean));
}

function arquivosTsx(dir: string, saida: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) {
      if (nome === 'node_modules' || nome === 'assets') continue;
      arquivosTsx(p, saida);
    } else if (nome.endsWith('.tsx') && !nome.includes('.test.')) {
      saida.push(p);
    }
  }
  return saida;
}

/**
 * Nomes que NÃO são ícones da fonte: são glifos AUTORAIS (`ui/NavGlyphs.tsx`)
 * sem par no subset. `activities`/`evolution`/`shop` eram a barra inferior e
 * hoje são os ícones das áreas no Mapa. `mapa` é o link de canto da Home:
 * desde a correção pós-F3 (24/09/2026) ele é ARTE em pixel do squad de arte
 * (`assets/soulmon/icones-ui`, via `PixelIcon`), não fonte — era o glifo
 * `map` antes. Ficam de fora explicitamente, e não por um
 * filtro esperto — assim acrescentar outro caso obriga a decidir de novo.
 */
const NAO_SAO_ICONES = new Set(['activities', 'evolution', 'shop', 'mapa', 'exclamation']);

describe('inventário de ícones', () => {
  it('todo `<Icon name="…">` literal existe no subset da fonte', () => {
    const nomes = inventario();
    /** @type {string[]} */
    const fora: string[] = [];
    for (const arquivo of arquivosTsx(RAIZ)) {
      const src = readFileSync(arquivo, 'utf-8');
      for (const m of src.matchAll(/(?:name|icon|iconName|titleIconName)\s*[=:]\s*['"]([a-z][a-z_]{2,})['"]/g)) {
        const nome = m[1];
        if (NAO_SAO_ICONES.has(nome) || nomes.has(nome)) continue;
        // Só reclama de quem está mesmo num `<Icon`/prop de ícone; `name="…"`
        // de input e de rota não interessa aqui.
        if (!/Icon|icon/.test(m[0])) continue;
        fora.push(`${arquivo.slice(RAIZ.length)} → '${nome}'`);
      }
    }
    expect(
      fora,
      `ícone fora do subset renderiza VAZIO. Acrescente o nome em src/styles/tokens.md (ordenado) E rebaixe a fonte:\n${fora.join('\n')}`,
    ).toEqual([]);
  });
});
