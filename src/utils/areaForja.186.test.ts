/**
 * #186 (28/10/2026, dono) — A FORJA e a nova divisão das áreas: a Forja (7ª área) recebe Oficina, Caderno, Refúgio e Soulsmith; a Exploração recebe
 * as masmorras e mantém o Passeio; o Arquivo vira seção do Perfil e o Círculo de Amigos seção do Salão do Clã. Trava: as listas de lotes, os ids que
 * acompanham o lote (migração idempotente, sem chave de storage nova), os atalhos antigos, os portões (o Vínculo de cada prédio é o de antes) e o
 * resolvedor de arte (o arquivo-alvo assume sozinho; sem ele vale o provisório).
 */
import { describe, it, expect } from 'vitest';
import { AREAS, areaLabel, areaHint, buildingDestination, BUILDING_HOME } from '../navigation';
import { exploracaoLots, forjaLots, jogosLots } from './playAreaLots';
import { arenaLots, laboratorioLots, hallLots, mercadoLots, sectionBuildingLabel } from './areaSheetCopy';
import { BUILDING_GATES, MOVED_BUILDINGS, currentBuildingId, buildingGateFor } from './gates';
import { sanitizeBuildingQuests, QUEST_BUILDINGS } from './buildingQuests';
import { sanitizeBuildingIntrosSeen } from './buildingIntro';
import { sanitizeFirstTimes } from './dailyMissions';
import { DEMO_BLOCKED_LOTS, isDemoBlockedLot } from './demoMode';
import { resolveArt, FORJA_BG, FORJA_LOT_ART, EXPLORACAO_LOT_ART, LABORATORIO_LOT_ART } from '../assets/soulmon/areas';
import { resolveMapaZona } from '../assets/soulmon/mapa/zonas';

const ids = (l: { id: string }[]) => l.map(x => x.id).sort();

describe('#186: as áreas e os lotes', () => {
  it('a Forja é a 7ª área, entre a Exploração e o Laboratório, com nome EN/PT', () => {
    expect(AREAS).toHaveLength(7);
    expect(AREAS.indexOf('forja')).toBe(AREAS.indexOf('exploracao') + 1);
    expect(areaLabel('forja', false)).toBe('The Forge');
    expect(areaLabel('forja', true)).toBe('A Forja');
    expect(areaHint('forja', true)).not.toBe(areaHint('forja', false));
  });
  it('Forja = Soulsmith + Oficina + Caderno + Refúgio; Exploração = Passeio + as duas masmorras; Jogos e Arena sem as masmorras', () => {
    expect(ids(forjaLots('pt-BR'))).toEqual(['caderno', 'ferreiro', 'oficina', 'refugio']);
    expect(ids(exploracaoLots('pt-BR'))).toEqual(['dungeon', 'fenda', 'passeio']);
    expect(ids(jogosLots('pt-BR'))).toEqual(['mente', 'salao']);
    expect(ids(arenaLots('pt-BR'))).toEqual(['duelo', 'guerra', 'torneio']);
    expect(ids(mercadoLots('pt-BR') as { id: string }[])).not.toContain('ferreiro');
  });
  it('o Passeio SEGUE na Exploração (e não está na Forja)', () => {
    expect(exploracaoLots('en-US').find(l => l.id === 'passeio')?.label).toBe('Stroll');
    expect(ids(forjaLots('en-US'))).not.toContain('passeio');
  });
  it('Laboratório sem Arquivo e Amigos; Hall com os três de sempre', () => {
    expect(ids(laboratorioLots('pt-BR'))).toEqual(['biblioteca', 'evolucao', 'perfil', 'stats']);
    expect(ids(hallLots('pt-BR'))).toEqual(['feira', 'grove', 'guilda']);
  });
  it('rótulo EN e PT em todo lote novo', () => {
    for (const l of [...forjaLots('pt-BR'), ...exploracaoLots('pt-BR')]) expect(l.label.length).toBeGreaterThan(1);
    for (const l of [...forjaLots('en-US'), ...exploracaoLots('en-US')]) expect(l.ariaLabel.length).toBeGreaterThan(1);
  });
});

describe('#186: os ids de prédio acompanham o lote, e o save antigo migra sozinho', () => {
  const NOVOS: Record<string, string> = {
    'exploracao.oficina': 'forja.oficina', 'exploracao.caderno': 'forja.caderno', 'exploracao.refugio': 'forja.refugio',
    'mercado.ferreiro': 'forja.ferreiro', 'arena.fenda': 'exploracao.fenda', 'jogos.dungeon': 'exploracao.dungeon',
    // ids de migrações anteriores seguem chegando ao id de hoje
    'jogos.refugio': 'forja.refugio', 'exploracao.masmorra': 'exploracao.fenda', 'exploracao.preparar': 'forja.oficina',
  };
  it('cada id antigo vira o de hoje; o novo passa intacto; a tabela não tem corrente (idempotente)', () => {
    for (const [velho, novo] of Object.entries(NOVOS)) {
      expect(currentBuildingId(velho), velho).toBe(novo);
      expect(currentBuildingId(novo), novo).toBe(novo);
      expect(BUILDING_GATES, novo).toHaveProperty([novo]);
      expect(BUILDING_GATES, `${velho} não pode mais ser prédio`).not.toHaveProperty([velho]);
    }
    for (const alvo of Object.values(MOVED_BUILDINGS)) expect(MOVED_BUILDINGS).not.toHaveProperty([alvo]);
  });
  it('o Vínculo mínimo de cada prédio movido é o de antes', () => {
    const bond = (id: keyof typeof BUILDING_GATES) => BUILDING_GATES[id].minBond;
    expect(bond('forja.oficina')).toBe(3);
    expect(bond('forja.caderno')).toBe(2);
    expect(bond('forja.refugio')).toBe(1);
    expect(bond('forja.ferreiro')).toBe(2);
    expect(bond('exploracao.fenda')).toBe(1);
    expect(bond('exploracao.dungeon')).toBe(3);
    expect(buildingGateFor('forja.refugio', 1).open).toBe(true); // o Refúgio segue sempre livre
  });
  it('missões de prédio, apresentações vistas e primeiras vezes: save velho segue (progresso e estoque), 2ª rodada = no-op', () => {
    const antigo = { day: 'Wed Oct 28 2026', visited: ['exploracao.oficina', 'arena.fenda', 'jogos.dungeon', 'laboratorio.pet'], claimed: ['exploracao.caderno', 'exploracao.refugio'], materials: { gear: 3, ore: 2, ink: 1, moss: 4 } };
    const a = sanitizeBuildingQuests(antigo)!;
    expect(a.visited).toEqual(expect.arrayContaining(['forja.oficina', 'exploracao.fenda', 'laboratorio.pet']));
    expect(a.claimed).toEqual(['forja.caderno', 'forja.refugio']);
    expect(JSON.stringify(a)).not.toMatch(/exploracao\.(oficina|caderno|refugio)|arena\.fenda|mercado\.ferreiro|jogos\.dungeon/);
    expect(a.materials).toMatchObject({ gear: 3, ore: 2, ink: 1, moss: 4 });
    expect(sanitizeBuildingQuests(JSON.parse(JSON.stringify(a)))).toEqual(a);
    const v = sanitizeBuildingIntrosSeen(['exploracao.oficina', 'mercado.ferreiro', 'arena.fenda'], 3);
    expect(v).toEqual(['forja.oficina', 'forja.ferreiro', 'exploracao.fenda']);
    expect(sanitizeBuildingIntrosSeen(v, 3)).toEqual(v);
    const f = sanitizeFirstTimes({ done: ['visit:exploracao.oficina', 'visit:mercado.ferreiro', 'visit:arena.fenda'], claimed: ['visit:arena.fenda'] })!;
    expect(f.done).toEqual(['visit:forja.oficina', 'visit:forja.ferreiro', 'visit:exploracao.fenda']);
    expect(f.claimed).toEqual(['visit:exploracao.fenda']);
    expect(sanitizeFirstTimes(JSON.parse(JSON.stringify(f)))).toEqual(f);
  });
  it('o Soulsmith segue sem missão/material (agora na Forja); Arquivo e Amigos seguem com missão', () => {
    expect(QUEST_BUILDINGS).not.toContain('forja.ferreiro');
    expect(QUEST_BUILDINGS).toEqual(expect.arrayContaining(['laboratorio.pet', 'laboratorio.amigos', 'forja.oficina', 'forja.caderno', 'forja.refugio', 'exploracao.fenda']));
  });
});

describe('#186: atalhos', () => {
  it('prédio movido → lote novo (id antigo ou novo)', () => {
    for (const [velho, area, lot] of [['exploracao.oficina', 'forja', 'oficina'], ['mercado.ferreiro', 'forja', 'ferreiro'], ['arena.fenda', 'exploracao', 'fenda'], ['jogos.dungeon', 'exploracao', 'dungeon'], ['forja.refugio', 'forja', 'refugio']] as const) {
      expect(buildingDestination(velho), velho).toEqual({ kind: 'lot', area, lot });
    }
  });
  it('Arquivo → Perfil (seção arquivo); Amigos → Salão do Clã (seção amigos), inclusive o id mais antigo `hall.amigos`', () => {
    expect(buildingDestination('laboratorio.pet')).toEqual({ kind: 'lot', area: 'laboratorio', lot: 'perfil', section: 'arquivo' });
    expect(buildingDestination('laboratorio.amigos')).toEqual({ kind: 'lot', area: 'hall', lot: 'guilda', section: 'amigos' });
    expect(buildingDestination('hall.amigos')).toEqual({ kind: 'lot', area: 'hall', lot: 'guilda', section: 'amigos' });
  });
  it('o lote-casa de cada seção existe de verdade no mapa, e o rótulo do prédio sem lote diz onde ele mora', () => {
    for (const h of Object.values(BUILDING_HOME)) {
      const lots = h.area === 'laboratorio' ? laboratorioLots('pt-BR') : hallLots('pt-BR');
      expect(ids(lots), `${h.area}:${h.lot}`).toContain(h.lot);
    }
    expect(sectionBuildingLabel('laboratorio.pet', 'en-US')).toContain('Profile');
    expect(sectionBuildingLabel('laboratorio.amigos', 'pt-BR')).toContain('Salão do Clã');
    expect(sectionBuildingLabel('forja.oficina', 'en-US')).toBeUndefined();
  });
});

describe('#186: demo e arte', () => {
  it('na demo, a Forja segue como as outras (sem bloqueio) e os Amigos seguem fora (Salão do Clã bloqueado)', () => {
    expect(DEMO_BLOCKED_LOTS).not.toHaveProperty('forja');
    expect(isDemoBlockedLot('hall', 'guilda')).toBe(true);
    expect(DEMO_BLOCKED_LOTS.laboratorio).toEqual(['biblioteca']);
  });
  it('o resolvedor devolve o provisório quando o arquivo-alvo não existe (e a arte provisória está registrada)', () => {
    expect(resolveArt('lote-que-nao-existe', 'provisorio.png')).toBe('provisorio.png');
    expect(resolveMapaZona('zona-que-nao-existe', 'zona.png')).toBe('zona.png');
    expect(typeof FORJA_BG).toBe('string');
    for (const id of ['oficina', 'caderno', 'refugio', 'ferreiro'] as const) expect(FORJA_LOT_ART[id].length, id).toBeGreaterThan(0);
    for (const id of ['passeio', 'fenda', 'dungeon'] as const) expect(EXPLORACAO_LOT_ART[id].length, id).toBeGreaterThan(0);
    for (const id of ['evolucao', 'stats', 'perfil', 'biblioteca'] as const) expect(LABORATORIO_LOT_ART[id].length, id).toBeGreaterThan(0);
  });
});
