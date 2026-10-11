/**
 * A FIAÇÃO da Feira (B2): quem soma o quê, e por onde. Testes de fonte — o App é grande demais
 * para montar, e o que importa aqui é que UM caminho só credite Emblemas.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { lotNpcArt } from '../../assets/soulmon/npcs';
import npcArenaFeira from '../../assets/soulmon/npcs/npc-arena-feira.png';
import { FAIR_ART, FAIR_ART_IDS, fairStateOf } from '../../utils/fairArt';
import { arenaLots, hallLots } from '../../utils/areaSheetCopy';

const ler = (rel: string) => fs.readFileSync(path.resolve(__dirname, '../..', rel), 'utf8');
const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const app = semComentarios(ler('App.tsx'));

describe('Emblemas: o Torneio e a Feira passam pelo MESMO caminho', () => {
  it('só existe UM updater que soma `emblems` por quantia (`earnEmblems`), usado pelo Torneio e pelo resgate', () => {
    expect(app.match(/emblems: \(prev\.emblems \?\? 0\) \+ amount/g) ?? []).toHaveLength(1);
    expect(app).toMatch(/onEarnEmblems: amount => \{\s*earnEmblems\(amount\);/);
    expect(app).toMatch(/const handleGuildClaimed = useCallback\(\(claim: \{ emblems: number; trophyId: string \| null \}\) => \{\s*earnEmblems\(claim\.emblems\);/);
    expect(app).toContain('onClaimed: handleGuildClaimed');
  });

  it('a Concha só entra no save por `grantGuildTrophy` (id conhecido, idempotente), fora de updater com efeito', () => {
    expect((app.match(/grantGuildTrophy\(/g) ?? [])).toHaveLength(1);
    expect(app).toMatch(/setGameState\(prev => grantGuildTrophy\(prev, trophyId\)\)/);
    // a missão do Torneio (`contarMissao('tournament-match')`) NÃO conta o resgate da Feira
    const bloco = app.slice(app.indexOf('const handleGuildClaimed'), app.indexOf('const handleGuildClaimed') + 500);
    expect(bloco).not.toMatch(/contarMissao/);
  });

  it('os cenários liberados pelo servidor entram por `grantGuildScenes` (só ids do Bosque)', () => {
    expect(app).toMatch(/setGameState\(prev => grantGuildScenes\(prev, ids\)\)/);
    expect(app).toContain('onScenes: handleGuildScenes');
  });
});

describe('o lote e o NPC da Feira', () => {
  it('PR3 (11/10/2026): a Arena tem só Torneio e Arena livre; a Feira virou a MISSÃO, dentro do Salão do Hall', () => {
    expect(arenaLots('pt-BR').map(l => l.id)).toEqual(['torneio', 'duelo']);
    expect(hallLots('pt-BR').map(l => l.id)).toContain('guilda');
    const av = ler('components/nav/AreaView.tsx');
    expect(av).not.toMatch(/room="feira"/);
    expect(av).toMatch(/open\?\.id === 'guilda'[\s\S]{0,80}room="salao"/);
    expect(ler('components/guild/GuildSheet.tsx')).toMatch(/<SalaFeira[\s\S]{0,400}missao=\{missao/);
  });

  it('PR3: o busto do Fanfare segue no repo sem lote (`arena:feira` saiu das tabelas) e os ids da leva de arte estão declarados', () => {
    expect(ler('assets/soulmon/npcs/index.ts')).not.toContain("'arena:feira'");
    expect(npcArenaFeira).toContain(FAIR_ART_IDS.npc);
    expect(ler('assets/soulmon/npcs/index.ts')).not.toContain("'arena:guilda'");
    expect(ler('utils/areaNpcVoice.ts')).not.toContain("'arena:guilda'");
    expect(FAIR_ART_IDS.npc).toBe('npc-arena-feira');
    expect(FAIR_ART_IDS.lote).toBe('lote-arena-feira');
    // Rodada 3 (30/09/2026): a arte saiu por TIPO × ESTADO (12), e toda id declarada tem PNG.
    expect(FAIR_ART_IDS.fenomeno).toHaveLength(12);
    expect(FAIR_ART_IDS.fenomeno).toContain('fair-fenomeno-mare-ferido');
    for (const id of [...FAIR_ART_IDS.fenomeno, ...FAIR_ART_IDS.fx]) expect(FAIR_ART[id], id).toBeTruthy();
    expect(FAIR_ART_IDS.fx).toEqual(['fx-fair-nevoa', 'fx-fair-mare', 'fx-fair-estatica', 'fx-fair-enxame']);
  });

  it('os três estados visuais vêm só de `state` e `ferido` (booleano do servidor)', () => {
    expect(fairStateOf({ state: 'aberta', ferido: false })).toBe('aberto');
    expect(fairStateOf({ state: 'aberta', ferido: true })).toBe('ferido');
    expect(fairStateOf({ state: 'dissipada', ferido: true })).toBe('dissipado');
    expect(fairStateOf({ state: 'dissipada', ferido: false })).toBe('dissipado');
  });
});
