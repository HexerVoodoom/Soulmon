/**
 * CONTRATO mapa-de-arte → arquivo — a fronteira `id do domínio ↔ PNG`.
 *
 * O `assets.contract.test.ts` abre PNG e mede pixel; este NÃO abre imagem
 * nenhuma. Ele fecha o buraco que aquele deixa: um mapa `*Art.ts` cuja CHAVE é
 * um id do jogo (conquista, linha, cenário, comida, sonho, achado, mobília) e
 * cujo VALOR é um arquivo que pode não existir. Import estático que falta
 * quebra o build; chave que falta num `import.meta.glob` **não quebra nada** —
 * o consumidor recebe `undefined` e desenha nada, em silêncio (o achado das
 * 924 auras com chave errada em 20/09/2026 nasceu exatamente assim).
 *
 * Três direções, por mapa:
 *  (a) todo id do DOMÍNIO tem arte (id → arquivo);
 *  (b) toda arte na pasta do glob é alcançada por algum id (arquivo → id);
 *  (c) todo `import x from '../assets/...'` dos `*Art.ts` resolve em disco.
 *
 * QA Rodada 2 (22/09/2026). Autoverificação: um id inventado tem de devolver
 * `undefined` — se devolvesse arte, o mapa estaria mentindo.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { ACHIEVEMENT_IDS } from '../utils/achievements';
import { emblemArt, EMBLEM_COUNT } from '../utils/emblemArt';
import { DUNGEON_LINE_NAMES } from '../utils/sprites';
import { lineIcon, LINE_ICON_COUNT } from '../utils/lineIcons';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { CHIP_EMOJI, HEART_ITEM_EMOJI, GLITCHTAMA_EMOJI, ALL_SHOP_ITEMS } from '../utils/shop';
import { ITEM_ART } from '../utils/itemArt';
import { DREAM_CATALOG } from '../utils/restWindow';
import { DREAM_ART } from '../utils/dreamArt';
import { ADVENTURE_CATALOG } from '../utils/adventure';
import { ADVENTURE_ART } from '../utils/adventureArt';
import { REGIONS } from '../data/travessiasCatalog';
import { DECOR_ART } from '../utils/decorArt';
import { elementIcon } from '../utils/elementIconArt';

const SRC = path.resolve(process.cwd(), 'src');
const ASSETS = path.join(SRC, 'assets');
const ls = (dir: string, re = /\.png$/) =>
  fs.readdirSync(path.join(ASSETS, dir)).filter(f => re.test(f)).map(f => f.replace(/\.png$/, ''));

describe('emblemas — ACHIEVEMENT_IDS ↔ assets/soulmon/emblems', () => {
  it('(a) toda conquista tem emblema', () => {
    const sem = ACHIEVEMENT_IDS.filter(id => !emblemArt(id));
    expect(sem, `conquistas sem emblema: ${sem.join(', ')}`).toEqual([]);
  });
  it('(b) nenhum emblema órfão na pasta', () => {
    const orfaos = ls('soulmon/emblems').filter(f => !(ACHIEVEMENT_IDS as readonly string[]).includes(f));
    expect(orfaos, `emblemas sem conquista: ${orfaos.join(', ')}`).toEqual([]);
    expect(EMBLEM_COUNT).toBe(ACHIEVEMENT_IDS.length);
  });
});

describe('ícones de linha — DUNGEON_LINE_NAMES × 4 tiers × 2 tamanhos ↔ assets/soulmon/lines/icons', () => {
  const TIERS = ['rookie', 'champion', 'ultimate', 'mega'] as const;
  const SIZES = [32, 64] as const;
  it('(a) toda linha tem os 8 ícones', () => {
    const faltam: string[] = [];
    for (const line of Object.keys(DUNGEON_LINE_NAMES))
      for (const tier of TIERS) for (const size of SIZES)
        if (!lineIcon(line, tier, size)) faltam.push(`${line}:${tier}:${size}`);
    expect(faltam, `ícones faltando: ${faltam.join(', ')}`).toEqual([]);
  });
  it('(b) a pasta tem exatamente linhas × 4 × 2 e nenhum arquivo fora do padrão', () => {
    const esperado = Object.keys(DUNGEON_LINE_NAMES).length * TIERS.length * SIZES.length;
    expect(LINE_ICON_COUNT).toBe(esperado);
    const arquivos = ls('soulmon/lines/icons');
    expect(arquivos.length, 'arquivo na pasta que o regex do glob não lê').toBe(esperado);
    const linhas = new Set(Object.keys(DUNGEON_LINE_NAMES));
    const estranhos = arquivos.filter(f => !linhas.has(f.split('-')[0]));
    expect(estranhos, `ícones de linha inexistente: ${estranhos.join(', ')}`).toEqual([]);
  });
});

describe('miniaturas da loja — PET_BACKGROUNDS ↔ assets/backgrounds/thumbs', () => {
  it('(a)+(b) 1:1 entre cenário e miniatura', () => {
    const ids = Object.keys(PET_BACKGROUNDS).sort();
    const thumbs = ls('backgrounds/thumbs').sort();
    expect(thumbs).toEqual(ids);
  });
  it('(c) todo cenário PINTADO (`url(...)`) aponta para arquivo do bundle', () => {
    // Em vitest o import de PNG vira URL `/src/assets/...png`; conferimos que o arquivo existe.
    let pintados = 0;
    for (const [id, bg] of Object.entries(PET_BACKGROUNDS)) {
      const m = /url\(([^)]+)\)/.exec(bg.css);
      if (!m) continue;
      pintados++;
      const rel = m[1].replace(/^\/?(src\/)?/, '').split('?')[0];
      const abs = path.join(process.cwd(), 'src', rel);
      expect(fs.existsSync(abs), `${id}: ${m[1]} não resolve em disco`).toBe(true);
    }
    expect(pintados).toBeGreaterThan(0);
  });
});

describe('itens — comidas e especiais ↔ ITEM_ART', () => {
  it('(a) toda comida de FOOD_BY_CATEGORY e todo especial tem arte', () => {
    const emojis = [
      ...Object.values(FOOD_BY_CATEGORY).map(f => f.emoji),
      ...Object.values(CHIP_EMOJI), HEART_ITEM_EMOJI, GLITCHTAMA_EMOJI,
    ];
    const sem = emojis.filter(e => !ITEM_ART[e]);
    expect(sem, `itens sem arte: ${sem.join(' ')}`).toEqual([]);
  });
  it('(b) nenhuma arte de item sem item', () => {
    const conhecidos = new Set([
      ...Object.values(FOOD_BY_CATEGORY).map(f => f.emoji),
      ...Object.values(CHIP_EMOJI), HEART_ITEM_EMOJI, GLITCHTAMA_EMOJI,
    ]);
    const orfaos = Object.keys(ITEM_ART).filter(k => !conhecidos.has(k));
    expect(orfaos).toEqual([]);
  });
});

describe('sonhos — DREAM_CATALOG ↔ DREAM_ART', () => {
  it('(a)+(b) 1:1', () => {
    const ids = DREAM_CATALOG.map(d => d.id).sort();
    expect(Object.keys(DREAM_ART).sort()).toEqual(ids);
    expect(ls('soulmon/dreams').sort()).toEqual(ids);
  });
});

describe('achados da aventura — ADVENTURE_CATALOG (+ postais das Travessias) ↔ ADVENTURE_ART', () => {
  it('(a)+(b) 1:1', () => {
    // Rodada 3 (30/09/2026): os 48 postais `trv-*` (chegada + achados de cada região,
    // `data/travessiasCatalog.ts`) entraram no MESMO mapa, arquivo `adv-trv-*.png`.
    const trv = REGIONS.flatMap(r => [r.arrival.id, ...r.finds.map(f => f.id)]);
    const ids = [...ADVENTURE_CATALOG.map(a => a.id), ...trv].sort();
    expect(Object.keys(ADVENTURE_ART).sort()).toEqual(ids);
    expect(ls('soulmon/adventures').sort()).toEqual([...ADVENTURE_CATALOG.map(a => a.id), ...trv.map(t => `adv-${t}`)].sort());
  });
});

describe('mobílias — SHOP_ITEMS kind=furniture ↔ DECOR_ART ↔ assets/decor', () => {
  const furn = ALL_SHOP_ITEMS.filter(i => i.kind === 'furniture').map(i => i.id).sort();
  it('(a) toda mobília da loja tem arte', () => {
    const sem = furn.filter(id => !DECOR_ART[id]);
    expect(sem, `mobílias sem arte: ${sem.join(', ')}`).toEqual([]);
  });
  it('(b) nenhuma arte de mobília sem item na loja', () => {
    const orfaos = Object.keys(DECOR_ART).filter(k => !furn.includes(k));
    expect(orfaos, `DECOR_ART sem item: ${orfaos.join(', ')}`).toEqual([]);
    const naPasta = ls('decor').filter(f => !Object.keys(DECOR_ART).includes(f));
    expect(naPasta, `PNG em assets/decor fora do mapa: ${naPasta.join(', ')}`).toEqual([]);
  });
});

describe('(c) todo import estático de asset nos mapas `*Art.ts` resolve em disco', () => {
  it('nenhum caminho quebrado', () => {
    const mapas = fs.readdirSync(path.join(SRC, 'utils')).filter(f => /Art\.ts$/.test(f) || f === 'dungeonScenes.ts' || f === 'sprites.ts' || f === 'backgrounds.ts');
    const quebrados: string[] = [];
    for (const f of mapas) {
      const abs = path.join(SRC, 'utils', f);
      const s = fs.readFileSync(abs, 'utf8');
      for (const m of s.matchAll(/from\s+['"](\.{1,2}\/[^'"]+\.(?:png|webp|mp4|svg))['"]/g)) {
        if (!fs.existsSync(path.resolve(path.dirname(abs), m[1]))) quebrados.push(`${f}: ${m[1]}`);
      }
    }
    expect(quebrados).toEqual([]);
    expect(mapas.length).toBeGreaterThan(10);
  });
});

describe('autoverificação — id inventado não ganha arte', () => {
  it('os mapas por glob devolvem undefined para chave desconhecida', () => {
    expect(emblemArt('nao-existe' as never)).toBeUndefined();
    expect(lineIcon('zzz', 'rookie', 64)).toBeUndefined();
    expect(elementIcon('nao-existe')).toBeUndefined();
    expect(DREAM_ART['dream-nao-existe']).toBeUndefined();
  });
});
