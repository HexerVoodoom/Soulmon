import { describe, it, expect } from 'vitest';
import { arenaLots, hallLots, laboratorioLots, mercadoLots } from '../../utils/areaSheetCopy';
import { exploracaoLots, forjaLots, jogosLots } from '../../utils/playAreaLots';
import { BUILDING_GATES } from '../../utils/gates';
import { lotNpcVoice, areaNpcVoice } from '../../utils/areaNpcVoice';
import fs from 'node:fs';
import { LOT_ART_BOUNDS, lotHitRects } from '../../utils/areaLotGeometry';
import path from 'node:path';
import { lotNpcArt, AREA_NPC_ART, FUNCTION_NPC_ART } from '../../assets/soulmon/npcs';
import npcArenaDuelo from '../../assets/soulmon/npcs/npc-extra-arena-duelo.png';
import { functionNpcVoice } from '../../utils/areaNpcVoice';

describe('lotes novos (29/09/2026)', () => {
  it('Arena tem Torneio, Duelo e Guerra (a Fenda voltou à Exploração, #187); Hall tem Feira, Grove e Salão do Clã; Laboratório tem Evolução, Vínculo, Perfil e Biblioteca (sem Arquivo e Amigos, #187)', () => {
    expect(arenaLots('pt-BR').map(l => l.id)).toEqual(['torneio', 'duelo', 'guerra']);
    expect(hallLots('pt-BR').map(l => l.id)).toEqual(['feira', 'grove', 'guilda']); // D-50 (19/10/2026): Biblioteca e Amigos saíram do Hall
    expect(laboratorioLots('en-US').map(l => l.id)).toEqual(['evolucao', 'stats', 'perfil', 'biblioteca']); // beta-2 (11): o Perfil do Soulmon; #187: o Arquivo e o Círculo de Amigos viraram seções
    expect(exploracaoLots('pt-BR').map(l => l.id)).toEqual(['passeio', 'fenda', 'dungeon']); // #187: a Exploração recebe as masmorras e mantém o Passeio
    expect(forjaLots('pt-BR').map(l => l.id).sort()).toEqual(['caderno', 'ferreiro', 'oficina', 'refugio']); // #187: a Forja
    expect(jogosLots('pt-BR').map(l => l.id)).toEqual(['salao', 'mente']); // o Calabouço saiu de Jogos
  });

  it('29/10/2026 (dono, marcas em vermelho): Torneio à esquerda, Arena livre à direita, Guerra na plataforma de cima; prédios ocupam a plataforma', () => {
    const pct = (s?: string) => Number(String(s ?? '38%').replace('%', ''));
    const arena = Object.fromEntries(arenaLots('pt-BR').map(l => [l.id, l as { left: string; top: string; width?: string }]));
    expect(pct(arena.torneio.left)).toBeLessThan(40);
    expect(pct(arena.duelo.left)).toBeGreaterThan(70);
    expect(Math.abs(pct(arena.torneio.top) - pct(arena.duelo.top))).toBeLessThan(5);       // mesma fileira (plataformas da esquerda e da direita)
    expect(pct(arena.duelo.top) - pct(arena.guerra.top)).toBeGreaterThanOrEqual(12);       // a Guerra fica na plataforma de cima
    expect(pct(arena.guerra.width)).toBeGreaterThan(pct(arena.torneio.width));             // a de baixo é a maior
    const lab = Object.fromEntries(laboratorioLots('pt-BR').map(l => [l.id, l as { width?: string; top: string }]));
    expect(pct(lab.stats.width)).toBeGreaterThanOrEqual(pct(lab.evolucao.width) * 1.4);
    for (const l of hallLots('pt-BR')) expect(pct((l as { width?: string }).width)).toBeGreaterThan(38);
  });

  it('o rinoceronte é o NPC do Duelo, com voz própria nos dois idiomas', () => {
    expect(lotNpcArt('arena', 'duelo')).toBe(npcArenaDuelo);
    expect(lotNpcArt('arena', 'duelo')).not.toBe(AREA_NPC_ART.arena);
    expect(lotNpcVoice('arena', 'duelo', 'pt-BR').name).toContain('Naia');
    expect(lotNpcVoice('arena', 'duelo', 'en-US').name).toContain('Naia');
  });

  it('lote sem voz própria cai na voz da área; o Torneio segue com o Vultrak', () => {
    expect(lotNpcVoice('arena', 'torneio', 'pt-BR')).toEqual(areaNpcVoice('arena', 'pt-BR'));
    expect(lotNpcArt('arena', 'torneio')).toBe(AREA_NPC_ART.arena);
  });

  it('os 10 bustos de lote da leva npcs-flare (30/09/2026) são arte PRÓPRIA — nenhum placeholder no bundle', () => {
    const lotes: Array<[Parameters<typeof lotNpcArt>[0], string, string]> = [
      ['arena', 'duelo', 'Naia'], ['hall', 'feira', 'Fanfare'], ['jogos', 'mente', 'Tessela'],
      ['forja', 'refugio', 'Marim'], ['mercado', 'conquistas', 'Medra'], ['laboratorio', 'amigos', 'Zumi'],
      ['hall', 'guilda', 'Aurea'], ['laboratorio', 'pet', 'Tinta'], ['laboratorio', 'stats', 'Sumi'],
      ['exploracao', 'passeio', 'Lisel'],
    ];
    const artes = lotes.map(([a, l]) => lotNpcArt(a, l));
    expect(new Set(artes).size).toBe(lotes.length);
    for (const [a, l, nome] of lotes) {
      // G3 (02/10/2026): o Salão da Guilda usa o busto da Bastia (`npc-f-guarda`), já aprovado.
      // 07/10/2026: Amigos (Trill), Arquivo (Faro) e Santuário (Oriel) trocaram de busto a pedido do dono.
      const TROCADOS: Record<string, string> = { 'arena:duelo': 'npc-extra-arena-duelo', 'forja:refugio': 'npc-oceano-jogos-refugio', 'hall:guilda': 'npc-luz-hall-guilda', 'hall:feira': 'npc-arena-feira', // a Feira mudou da Arena para o Hall (11/10/2026); o arquivo mantém o nome da leva
        'laboratorio:amigos': 'npc-extra-filhote-de-mel', 'laboratorio:pet': 'npc-agua-laboratorio-pet', 'laboratorio:stats': 'npc-agua-laboratorio-stats' };
      const arquivo = TROCADOS[`${a}:${l}`] ?? `npc-${a}-${l}`;
      expect(lotNpcArt(a, l)).toMatch(new RegExp(arquivo));
      expect(Object.values(AREA_NPC_ART)).not.toContain(lotNpcArt(a, l));
      for (const lang of ['pt-BR', 'en-US'] as const) expect(lotNpcVoice(a, l, lang).name).toContain(nome);
    }
    const dir = path.resolve(__dirname, '../../assets/soulmon/npcs');
    expect(fs.readdirSync(dir).filter(f => f.includes('placeholder'))).toEqual([]);
    expect(fs.readFileSync(path.join(dir, 'index.ts'), 'utf8')).not.toMatch(/PLACEHOLDER_NPC_ART|poring/i);
  });

  it('o nome antigo do NPC do Arquivo (ex-Meu Soulmon) saiu: é Tinta nos dois idiomas', () => {
    expect(lotNpcVoice('laboratorio', 'pet', 'pt-BR').name).toMatch(/^Tinta/);
    expect(lotNpcVoice('laboratorio', 'pet', 'en-US').name).toMatch(/^Tinta/);
  });

  it('os 3 NPCs de função (Faro, Sona e Tobi saíram, 18/10/2026) têm arte própria e voz nos dois idiomas', () => {
    const nomes = { onboarding: 'Ambra', oraculo: 'Iris', cuidados: 'Nuri' } as const;
    expect(new Set(Object.values(FUNCTION_NPC_ART)).size).toBe(3);
    for (const [id, nome] of Object.entries(nomes) as Array<[keyof typeof nomes, string]>) {
      expect(FUNCTION_NPC_ART[id]).toMatch(new RegExp(`npc-${id}`));
      for (const lang of ['pt-BR', 'en-US'] as const) {
        const v = functionNpcVoice(id, lang);
        expect(v.name).toBe(nome);
        expect(v.line.length).toBeGreaterThan(0);
        expect(v.line).not.toMatch(/\d/);
      }
    }
  });
});

describe('as bancas do Mercado têm nome próprio (01/10/2026)', () => {
  it('Itens é a Lamela e Decoração é a Lasca — não herdam mais o Grom', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      expect(lotNpcVoice('mercado', 'itens', lang).name).toMatch(/^Lamela/);
      expect(lotNpcVoice('mercado', 'decoracao', lang).name).toMatch(/^Lasca/);
      for (const l of ['itens', 'decoracao']) {
        const v = lotNpcVoice('mercado', l, lang);
        expect(v.name).not.toContain('Grom');
        expect(v.line).not.toMatch(/\d|Bits|!/);
      }
    }
  });
});

describe('o Ferreiro (07/10/2026; #187: agora lote da Forja) para os equipamentos', () => {
  it('existe, com rótulo EN/PT, Vínculo 2 e o NPC Vitra', () => {
    expect(forjaLots('en-US').find(l => l.id === 'ferreiro')?.label).toBe('Soulsmith');
    expect(forjaLots('pt-BR').find(l => l.id === 'ferreiro')?.label).toBe('Soulsmith');
    expect((mercadoLots('en-US') as { id: string }[]).some(l => l.id === 'ferreiro')).toBe(false);
    expect(BUILDING_GATES['forja.ferreiro'].minBond).toBe(2);
    expect(lotNpcVoice('forja', 'ferreiro', 'en-US').name).toContain('Vitra');
    expect(lotNpcVoice('forja', 'ferreiro', 'pt-BR').name).toContain('Vitra');
  });
  it('a folha do lote abre a ForgeCard, e as Estatísticas não a montam mais', () => {
    const lerSrc = (f: string) => fs.readFileSync(path.resolve(__dirname, f), 'utf8');
    expect(lerSrc('./AreaView.tsx')).toMatch(/open\?\.id === 'ferreiro' && <ForgeCard/);
    expect(lerSrc('../StatsPage.tsx')).not.toMatch(/<ForgeCard/);
  });
});

