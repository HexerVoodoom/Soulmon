// O BUNDLE SERVIDO NÃO CARREGA FRANQUIA DE TERCEIRO — guard sobre `dist/`.
//
// ⚠️ Existe porque o guard de fonte MENTIU. `pipeline.test.ts` tinha um caso
// chamado "nenhuma criatura do pool vem de franquia protegida" que passava
// verde enquanto 1.101 das 1.718 entradas do pool eram de franquia. O que ele
// checava era uma lista de onze nomes, copiada do script de sync; as duas
// cópias erraram igual.
//
// Este arquivo olha o que É SERVIDO, não o que está escrito. É o mesmo
// precedente de `sprites.dungeonRoster.test.ts`, e pelo mesmo motivo: o dano
// aqui não é aparecer na tela — o jogador nunca vê esses nomes (há teste
// travando) —, é o texto viajar no `dist/` que a Cloudflare serve. Para
// direito autoral, "está no bundle" já é distribuição de cópia: qualquer
// pessoa abre o DevTools e lê o verbete oficial.

import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist', 'assets');

/** Nomes que NUNCA podem voltar ao bundle. Amostra deliberadamente pequena e
 *  inequívoca — esta lista não é o critério (o critério é a allowlist de
 *  `scripts/bestiario-procedencia.mjs`); ela é a prova de fogo sobre o
 *  artefato servido. */
const PROIBIDOS = [
  // Pokémon (Nintendo / Game Freak / The Pokémon Company)
  'Bulbasaur', 'Charmander', 'Squirtle', 'Zubat', 'Rattata', 'Jigglypuff', 'Meowth',
  // Wizards of the Coast — Product Identity, fora da OGL
  'Beholder', 'Mind Flayer', 'Displacer Beast',
  // Blizzard · Square Enix · Capcom · Tolkien
  'Murloc', 'Deathwing', 'Zergling', 'Chocobo', 'Tonberry', 'Rathalos', 'Balrog',
];

/** Titulares nomeados NA PRÓPRIA descrição — é isto que transforma risco
 *  teórico em prova de conhecimento. */
const TITULARES = /Game Freak|Wizards of the Coast|Giochi Preziosi|Marvel Comics/;

function bundles(): string[] {
  if (!existsSync(DIST)) return [];
  return readdirSync(DIST).filter(f => f.endsWith('.js')).map(f => join(DIST, f));
}

describe('o `dist/` servido não carrega criatura de franquia', () => {
  const arquivos = bundles();

  it('a varredura tem chão embaixo — o bundle existe e tem o pool dentro', () => {
    // Sem isto, um `dist/` ausente faria os casos abaixo passarem por vacuidade,
    // que é a forma preferida de um guard de bundle morrer em silêncio.
    expect(arquivos.length, 'rode `npm run build` antes').toBeGreaterThan(0);
    const algum = arquivos.some(f => /Okapia johnstoni|Ambystoma mexicanum|Rafflesia/.test(readFileSync(f, 'utf8')));
    expect(algum, 'o pool do bestiário não foi encontrado em dist/assets/*.js').toBe(true);
  });

  it('nenhum nome de criatura de franquia aparece', () => {
    const achados: string[] = [];
    for (const f of arquivos) {
      const src = readFileSync(f, 'utf8');
      for (const nome of PROIBIDOS) {
        if (src.includes(nome)) achados.push(`${f.split('/').pop()}: ${nome}`);
      }
    }
    expect(achados).toEqual([]);
  });

  it('nenhuma descrição nomeia o titular do direito', () => {
    const achados = arquivos
      .filter(f => TITULARES.test(readFileSync(f, 'utf8')))
      .map(f => f.split('/').pop()!);
    expect(achados).toEqual([]);
  });
});
