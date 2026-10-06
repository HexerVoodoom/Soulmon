/**
 * Combate v3 / PR7 — a tabela única de portões do Vínculo (critério 4 da story).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GATES, gateFor, gateLine, masmorraFloorOpen, MASMORRA_ALTO_A_PARTIR_DO_ANDAR, type GateFeature } from './gates';
import { BOND_PVP_MIN_LEVEL, meetsPvpBond, xpForLevel } from './bond';
import { rebirthRefusal } from './rebirthGate';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const FEATURES = Object.keys(GATES) as GateFeature[];

describe('gateFor', () => {
  it('abre exatamente no Vínculo pedido, em todas as portas', () => {
    for (const f of FEATURES) {
      const min = GATES[f].minBond;
      expect(gateFor(f, min - 1).open, `${f} ${min - 1}`).toBe(false);
      expect(gateFor(f, min).open, `${f} ${min}`).toBe(true);
      expect(gateFor(f, min + 40).open).toBe(true);
    }
  });

  it('lixo cai em Vínculo 1 (ausência de prova não é prova)', () => {
    for (const f of FEATURES) for (const lixo of [NaN, null, undefined, -4, 'x', {}]) expect(gateFor(f, lixo).open, `${f} ${String(lixo)}`).toBe(false);
  });

  it('o PvP continua no 5 que já valia, e meetsPvpBond é a MESMA entrada', () => {
    expect(GATES.pvp.minBond).toBe(5);
    expect(BOND_PVP_MIN_LEVEL).toBe(GATES.pvp.minBond);
    expect(meetsPvpBond(xpForLevel(4))).toBe(false);
    expect(meetsPvpBond(xpForLevel(5))).toBe(true);
  });

  it('as portas pedidas pelo dono existem: Arena/PvP, Torneio, andares altos, Renascimento', () => {
    expect(FEATURES.sort()).toEqual(['masmorraAlto', 'pvp', 'renascimento', 'torneio']);
  });
});

describe('D7: só andares ALTOS da Masmorra têm portão; o andar 1 é livre', () => {
  it('com Vínculo 1 os andares abaixo do alto entram; o alto não', () => {
    for (let f = 1; f < MASMORRA_ALTO_A_PARTIR_DO_ANDAR; f++) expect(masmorraFloorOpen(f, 1), `andar ${f}`).toBe(true);
    expect(masmorraFloorOpen(MASMORRA_ALTO_A_PARTIR_DO_ANDAR, 1)).toBe(false);
    expect(masmorraFloorOpen(5, 1)).toBe(false);
  });
  it('com o Vínculo do portão todos entram', () => {
    for (let f = 1; f <= 5; f++) expect(masmorraFloorOpen(f, GATES.masmorraAlto.minBond), `andar ${f}`).toBe(true);
  });
});

describe('Renascimento = conta paga + Vínculo (o Vínculo nunca é pago)', () => {
  const ultra = { evolutionStage: 'ultra', accountTier: 'paid' as const };
  it('paga + ápice + Vínculo abaixo do portão = low-bond', () => {
    expect(rebirthRefusal({ ...ultra, totalXP: xpForLevel(GATES.renascimento.minBond - 1) })).toBe('low-bond');
    expect(rebirthRefusal({ ...ultra })).toBe('low-bond');
  });
  it('paga + ápice + Vínculo no portão = elegível', () => {
    expect(rebirthRefusal({ ...ultra, totalXP: xpForLevel(GATES.renascimento.minBond) })).toBeNull();
  });
  it('NÃO paga nunca renasce, por mais Vínculo que tenha (e o motivo continua sendo a conta)', () => {
    expect(rebirthRefusal({ evolutionStage: 'ultra', accountTier: 'demo', totalXP: xpForLevel(40) })).toBe('not-paid');
  });
  it('conta paga não compra Vínculo: com Vínculo 1 ela continua recusada', () => {
    expect(rebirthRefusal({ ...ultra, totalXP: 0 })).toBe('low-bond');
  });
});

describe('copy do portão fechado (semFomo): neutra, com o Vínculo pedido', () => {
  it('diz onde abre e onde a pessoa está, nas duas línguas, sem contagem', () => {
    for (const f of FEATURES) {
      const pt = gateLine(f, 1, 'pt-BR');
      const en = gateLine(f, 1, 'en-US');
      expect(pt).toContain(`Vínculo ${GATES[f].minBond}`);
      expect(en).toContain(`Bond ${GATES[f].minBond}`);
      expect(gateLine(f, GATES[f].minBond, 'pt-BR')).toBe('');
    }
  });
});

// ── Teste de grep: nenhum `bondLevel >= N` solto fora do dono ────────────────

function anda(dir: string, saida: string[]) {
  for (const nome of readdirSync(dir)) {
    const cheio = join(dir, nome);
    if (statSync(cheio).isDirectory()) { if (nome !== 'node_modules') anda(cheio, saida); continue; }
    if (!/\.(ts|tsx|js)$/.test(nome) || /\.(test|spec)\./.test(nome) || /\.d\.ts$/.test(nome)) continue;
    saida.push(cheio);
  }
}

describe('uma tabela só: ninguém compara o Vínculo com um número de portão', () => {
  const DONOS = new Set(['src/utils/gates.ts', 'functions/api/_gates.js']);
  const arquivos: string[] = [];
  anda(join(RAIZ, 'src'), arquivos);
  anda(join(RAIZ, 'functions'), arquivos);
  // `bondLevel`/`bondLevelFor(...)`/`bondLevelOf(...)` comparado (>=, >, <, <=) com qualquer coisa
  const SOLTO = /\bbondLevel(?:For|Of)?\s*(?:\([^)]*\))?\s*(?:>=|<=|>|<)\s*[\w.]/;

  it('a varredura tem chão (arquivos existem)', () => {
    expect(arquivos.length).toBeGreaterThan(200);
    expect(arquivos.some((a) => a.replace(/\\/g, '/').endsWith('src/utils/gates.ts'))).toBe(true);
  });

  it('nenhum arquivo fora do dono tem `bondLevel >= …`', () => {
    const violacoes: string[] = [];
    for (const a of arquivos) {
      const rel = relative(RAIZ, a).replace(/\\/g, '/');
      if (DONOS.has(rel)) continue;
      readFileSync(a, 'utf8').split('\n').forEach((l, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;
        if (SOLTO.test(l)) violacoes.push(`${rel}:${i + 1} :: ${l.trim().slice(0, 100)}`);
      });
    }
    expect(violacoes, violacoes.join('\n')).toEqual([]);
  });

  it('PROVA DE VERMELHO: o regex pega a forma solta', () => {
    expect(SOLTO.test('if (bondLevel >= 5) return;')).toBe(true);
    expect(SOLTO.test('if (bondLevelFor(xp) < MIN) x();')).toBe(true);
    expect(SOLTO.test("if (gateFor('pvp', bondLevel).open) x();")).toBe(false);
  });
});
