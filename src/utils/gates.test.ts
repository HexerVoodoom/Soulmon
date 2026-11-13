/**
 * Combate v3 / PR7 — a tabela única de portões do Vínculo (critério 4 da story).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILDING_GATES, BUILDINGS_ALWAYS_OPEN, buildingGateFor, areaMinBond, buildingLockLine, type BuildingId, GATES, gateFor, gateLine, masmorraFloorOpen, MASMORRA_ALTO_A_PARTIR_DO_ANDAR, type GateFeature } from './gates';
import { BOND_PVP_MIN_LEVEL, BOND_RANKED_MIN_LEVEL, meetsPvpBond, meetsRankedBond, xpToRankedBond, xpForLevel } from './bond';
import { rebirthRefusal } from './rebirthGate';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const FEATURES = Object.keys(GATES) as GateFeature[];

describe('gateFor', () => {
  it('abre exatamente no Vínculo pedido, em todas as portas', () => {
    for (const f of FEATURES) {
      const min = GATES[f].minBond;
      expect(gateFor(f, min - 1).open, `${f} ${min - 1}`).toBe(min <= 1);
      expect(gateFor(f, min).open, `${f} ${min}`).toBe(true);
      expect(gateFor(f, min + 40).open).toBe(true);
    }
  });

  it('lixo cai em Vínculo 1 (ausência de prova não é prova)', () => {
    for (const f of FEATURES) for (const lixo of [NaN, null, undefined, -4, 'x', {}]) expect(gateFor(f, lixo).open, `${f} ${String(lixo)}`).toBe(GATES[f].minBond <= 1);
  });

  it('o PvP abre no 1 (dono 12/11/2026: sem limite por level; era 3), e meetsPvpBond é a MESMA entrada', () => {
    expect(GATES.pvp.minBond).toBe(1);
    expect(BOND_PVP_MIN_LEVEL).toBe(GATES.pvp.minBond);
    expect(meetsPvpBond(0)).toBe(true);
    expect(meetsPvpBond(xpForLevel(3))).toBe(true);
  });

  it('SÓ a Ranqueada mantém limite: Vínculo 5 (dono 12/11/2026); todo o resto abre no 1', () => {
    expect(GATES.ranqueada.minBond).toBe(5);
    expect(BOND_RANKED_MIN_LEVEL).toBe(5);
    expect(meetsRankedBond(xpForLevel(4))).toBe(false);
    expect(meetsRankedBond(xpForLevel(5))).toBe(true);
    expect(xpToRankedBond(0)).toBe(xpForLevel(5));
    expect(xpToRankedBond(xpForLevel(5))).toBe(0);
    for (const f of FEATURES) if (f !== 'ranqueada') expect(GATES[f].minBond, f).toBe(1);
  });

  it('as portas existem: Arena/PvP, Torneio, Ranqueada, andares altos, Renascimento', () => {
    expect([...FEATURES].sort()).toEqual(['masmorraAlto', 'pvp', 'ranqueada', 'renascimento', 'torneio']);
  });
});

describe('D7: sem portão por Vínculo nos andares da Masmorra (dono 12/11/2026)', () => {
  it('com Vínculo 1 todos os andares entram (o teto por Lv do Soulmon segue, é dificuldade)', () => {
    for (let f = 1; f <= 8; f++) expect(masmorraFloorOpen(f, 1), `andar ${f}`).toBe(true);
    expect(GATES.masmorraAlto.minBond).toBe(1);
  });
  it('com o Vínculo do portão todos entram', () => {
    for (let f = 1; f <= 5; f++) expect(masmorraFloorOpen(f, GATES.masmorraAlto.minBond), `andar ${f}`).toBe(true);
  });
});

describe('Renascimento = conta paga + Vínculo (o Vínculo nunca é pago)', () => {
  const ultra = { evolutionStage: 'ultra', accountTier: 'paid' as const };
  it('sem portão de Vínculo (dono 12/11/2026): paga + ápice no Vínculo 1 já é elegível', () => {
    expect(GATES.renascimento.minBond).toBe(1);
    expect(rebirthRefusal({ ...ultra })).toBeNull();
  });
  it('paga + ápice + Vínculo no portão = elegível', () => {
    expect(rebirthRefusal({ ...ultra, totalXP: xpForLevel(GATES.renascimento.minBond) })).toBeNull();
  });
  it('NÃO paga nunca renasce, por mais Vínculo que tenha (e o motivo continua sendo a conta)', () => {
    expect(rebirthRefusal({ evolutionStage: 'ultra', accountTier: 'demo', totalXP: xpForLevel(40) })).toBe('not-paid');
  });
  it('conta paga continua exigida: sem ela, nem Vínculo 1 nem 40 renascem', () => {
    expect(rebirthRefusal({ evolutionStage: 'ultra', accountTier: 'demo', totalXP: 0 })).toBe('not-paid');
  });
});

describe('copy do portão fechado (semFomo): neutra, com o Vínculo pedido', () => {
  it('diz onde abre e onde a pessoa está, nas duas línguas, sem contagem', () => {
    for (const f of FEATURES) {
      const pt = gateLine(f, 1, 'pt-BR');
      const en = gateLine(f, 1, 'en-US');
      if (GATES[f].minBond <= 1) { expect(pt, f).toBe(''); expect(en, f).toBe(''); continue; }
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

describe('prédios por Vínculo (Tarefa A)', () => {
  const IDS = Object.keys(BUILDING_GATES) as BuildingId[];
  it('cada prédio abre exatamente no seu Vínculo', () => {
    for (const id of IDS) {
      const min = BUILDING_GATES[id].minBond;
      expect(buildingGateFor(id, min - 1).open, `${id} ${min - 1}`).toBe(min <= 1);
      expect(buildingGateFor(id, min).open, id).toBe(true);
      expect(buildingGateFor(id, min + 30).open).toBe(true);
    }
  });
  it('lixo cai em Vínculo 1', () => {
    for (const l of [NaN, null, undefined, 'x', -3]) expect(buildingGateFor('hall.guilda', l).bondLevel).toBe(1);
  });
  it('sempre livres: mínimo 1 e abertos no Vínculo 1', () => {
    expect(BUILDINGS_ALWAYS_OPEN).toEqual(['mercado.itens', 'laboratorio.evolucao', 'forja.refugio', 'exploracao.passeio', 'exploracao.fenda']);
    for (const id of BUILDINGS_ALWAYS_OPEN) {
      expect(BUILDING_GATES[id].minBond).toBe(1);
      expect(buildingGateFor(id, 1).open).toBe(true);
    }
  });
  it('Masmorra livre desde o Vínculo 1 (14/10/2026); só os andares ALTOS seguem no portão', () => {
    expect(buildingGateFor('exploracao.fenda', 1)).toMatchObject({ open: true, minBond: 1 });
    expect(masmorraFloorOpen(1, 1)).toBe(true);
    expect(masmorraFloorOpen(MASMORRA_ALTO_A_PARTIR_DO_ANDAR, 1)).toBe(true);
    expect(areaMinBond('exploracao')).toBe(1);
  });
  it('Arena/Feira/Torneio leem a tabela de portões (um número só)', () => {
    expect(BUILDING_GATES['arena.duelo'].minBond).toBe(GATES.pvp.minBond);
    expect(BUILDING_GATES['hall.feira'].minBond).toBe(1); // era 5; dono 12/11/2026
    expect(BUILDING_GATES['arena.torneio'].minBond).toBe(GATES.torneio.minBond);
  });
  it('a área no Mapa = menor Vínculo dos seus prédios; o aviso é neutro e bilíngue', () => {
    expect(areaMinBond('arena')).toBe(1); // dono 12/11/2026: sem limite por level (a Ranqueada é aba dentro do Torneio)
    expect(areaMinBond('forja')).toBe(1); // o Refúgio (Vínculo 1, sempre livre) mora na Forja
    expect(areaMinBond('exploracao')).toBe(1);
    expect(areaMinBond('hall')).toBe(1);
    expect(areaMinBond('laboratorio')).toBe(1);
    expect(areaMinBond('mercado')).toBe(1);
    expect(buildingLockLine(4, 'en-US')).toBe('Opens at Bond 4. It grows with what you already do here.');
    expect(buildingLockLine(4, 'pt-BR')).toContain('Vínculo 4');
    expect(buildingLockLine(4, 'pt-BR')).not.toMatch(/faltam|falta|!/);
  });
});

describe('beta-2 (11): o Perfil do Soulmon', () => {
  it('abre no mesmo Vínculo do Arquivo (de onde lê a ficha) e nunca é prédio de entrada', () => {
    expect(BUILDING_GATES['laboratorio.perfil'].minBond).toBe(BUILDING_GATES['laboratorio.pet'].minBond);
    expect(buildingGateFor('laboratorio.perfil', 1).open).toBe(true); // dono 12/11/2026: sem limite por level
    expect(buildingGateFor('laboratorio.perfil', 2).open).toBe(true);
    expect(buildingGateFor('laboratorio.perfil', undefined).open).toBe(true);
    expect(BUILDINGS_ALWAYS_OPEN).not.toContain('laboratorio.perfil');
    expect(areaMinBond('laboratorio')).toBe(1); // o Centro de Evolução mantém a área aberta
  });
  it('é leitura: não dá missão nem material (fora de QUEST_BUILDINGS), e o texto de trancado é neutro', () => {
    expect(buildingLockLine(2, 'pt-BR')).not.toMatch(/faltam|falta|!/);
  });
});
