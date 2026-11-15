/** GUARD (§391): nenhum PNG do set de estágio é renderizado fora de `EstagioIcone`; todo consumidor passa pelo componente central. */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAIZ = join(__dirname, '..', '..');
const fontes: string[] = [];
const varre = (d: string) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (n !== 'node_modules') varre(p); } else if (/\.(ts|tsx)$/.test(n) && !/\.test\./.test(n)) fontes.push(p);
  }
};
varre(RAIZ);
const rel = (p: string) => relative(RAIZ, p).replace(/\\/g, '/');
const texto = (p: string) => readFileSync(p, 'utf8');

/** Allowlist explícita: o módulo do set (dono dos PNGs) e o componente central. */
const PERMITIDOS = new Set(['assets/soulmon/icones-ui/estagio.ts', 'components/ui/EstagioIcone.tsx']);

describe('ícone de estágio: um único renderizador', () => {
  it('só o componente central importa o módulo do set ou nomeia os PNGs de estágio', () => {
    const infratores = fontes.filter(p => !PERMITIDOS.has(rel(p))).filter(p => {
      const t = texto(p);
      return /icones-ui\/estagio['"]/.test(t) || /estagio-(branco-)?(rookie|champion|ultimate|mega|ultra)/.test(t) || /estagioIcone\(/.test(t);
    }).map(rel);
    expect(infratores).toEqual([]);
  });

  it('todo ponto que mostra o ícone de estágio usa EstagioIcone/EstagioMarca (varredura por consumidor)', () => {
    const usam = fontes.filter(p => /<Estagio(Icone|Marca)\b/.test(texto(p))).map(rel).sort();
    expect(usam).toEqual(['components/EvolutionPath.tsx', 'components/TournamentPage.tsx', 'components/games/BattleStage.tsx', 'components/ui/EstagioMarca.tsx']);
  });

  it('ícone de TIPO (elemento) nunca recebe a cor de caminho', () => {
    const infratores = fontes.filter(p => /elementIcon\(/.test(texto(p)) && /CAMINHO_(SEM_)?COR|corDoCaminho/.test(texto(p))).map(rel);
    expect(infratores).toEqual([]);
  });

  it('nenhum consumidor repete o hex do creme, do verde e do azul de caminho (o amarelo é cor de moeda também: coincidência legítima)', () => {
    const hex = /#(fff1d6|4cd964|4aa3ff)\b/i;
    const infratores = fontes.filter(p => rel(p) !== 'types/attributes.ts' && hex.test(texto(p))).map(rel);
    expect(infratores).toEqual([]);
  });
});
