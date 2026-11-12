/**
 * CONTRATO DAS FICHAS DOS NPCs (beta12, B3).
 *
 *  1. TODO NPC registrado tem ficha (e nenhuma ficha é órfã): o NPC novo que
 *     entrar num registro sem ficha FALHA aqui — "todo NPC novo nasce já nesse
 *     parâmetro".
 *  2. A ficha usa o vocabulário real do Oráculo: elementos que existem nos 229 do
 *     class-system (combinados inclusive), classe entre os 79 arquétipos cujas
 *     condições de elemento a ficha cumpre, arquétipo de personalidade conhecido.
 *  3. Distribuição de estágio: maioria Ultimate/Mega, poucos Ultra; Vesca,
 *     Hexsmith e Tessária são Ultra; Tessária é Marcial + Vileza (Serrilha).
 *  4. NADA da ficha aparece ao jogador (molde de `classeNuncaVisivel.contract`):
 *     nenhum componente importa as fichas, nenhum texto de NPC cita nome de
 *     classe, e a tela de um NPC não mostra classe, arquétipo nem estágio.
 *  5. A fala dos NPCs perdeu o enchimento ("no seu tempo", "se quiser", "sem pressa").
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { NPC_FICHAS, NPC_FICHA_ALIAS, NPC_FICHA_KEYS, npcFicha } from './npcFichas';
import { ALL_ARCHETYPES } from '../utils/soulmonCharacter';
import {
  AREA_NPC_VOICE, LOT_NPC_VOICE, FUNCTION_NPC_VOICE, EXTRA_NPC_VOICE, NOVO_NPC_VOICE,
} from '../utils/areaNpcVoice';
import { AREA_NPC_ART, LOT_NPC_ART, FUNCTION_NPC_ART, EXTRA_NPC_ART, NOVO_NPC_ART } from '../assets/soulmon/npcs';
import { BOSS_ROSTER, bossText } from './bossRoster';
import { TOURNAMENT_NPCS } from '../utils/tournamentNpcs';
import { LIBRARY_NPCS } from '../utils/libraryNpcs';
import { CLASS_TITLE_EN } from '../utils/soulProfile/ficha/classTitle';
import { FunctionNpcNote } from '../components/ui/FunctionNpcNote';

const RAIZ = process.cwd();

/** Todas as chaves de NPC que existem nos registros do app. */
function chavesRegistradas(): string[] {
  const k = new Set<string>();
  for (const id of Object.keys(AREA_NPC_ART)) k.add(`area:${id}`);
  for (const id of new Set([...Object.keys(LOT_NPC_VOICE), ...Object.keys(LOT_NPC_ART)])) k.add(`lote:${id}`);
  for (const id of new Set([...Object.keys(FUNCTION_NPC_VOICE), ...Object.keys(FUNCTION_NPC_ART)])) k.add(`funcao:${id}`);
  for (const id of new Set([...Object.keys(EXTRA_NPC_VOICE), ...Object.keys(EXTRA_NPC_ART)])) k.add(`extra:${id}`);
  for (const id of new Set([...Object.keys(NOVO_NPC_VOICE), ...Object.keys(NOVO_NPC_ART)])) k.add(`novo:${id}`);
  for (const b of BOSS_ROSTER) k.add(`boss:${b.id}`);
  for (const t of TOURNAMENT_NPCS) k.add(`torneio:${t.id}`);
  for (const l of LIBRARY_NPCS) k.add(`biblioteca:${l.id}`);
  return [...k];
}

describe('toda NPC registrada tem ficha', () => {
  it('nenhuma chave de registro está sem ficha (NPC novo exige ficha)', () => {
    const sem = chavesRegistradas().filter(k => !npcFicha(k));
    expect(sem, 'NPC registrado SEM ficha em src/data/npcFichas.ts').toEqual([]);
  });
  it('nenhuma ficha é órfã (a chave existe num registro)', () => {
    const reg = new Set(chavesRegistradas());
    const orfas = NPC_FICHA_KEYS.filter(k => !reg.has(k));
    expect(orfas, 'ficha/alias sem NPC registrado').toEqual([]);
  });
  it('todo alias aponta para uma ficha que existe', () => {
    for (const [a, alvo] of Object.entries(NPC_FICHA_ALIAS)) expect(NPC_FICHAS[alvo], `${a} → ${alvo}`).toBeDefined();
  });
  it('chave desconhecida devolve undefined', () => {
    expect(npcFicha('lote:inexistente:x')).toBeUndefined();
  });
});

describe('a ficha usa o vocabulário real do Oráculo', () => {
  it('arquétipo, elementos, estágio e classe são válidos; a classe é alcançada pelos elementos', async () => {
    const eng = await import('class-system');
    // `elementoDef` é o acessor real dos 6 mil+ elementos (base, pares, trios e quartetos); `ELEMENTOS` só traz os ~230 de 1º e 2º nível.
    const def = (id: string) => (eng as unknown as { elementoDef: (i: string) => { receita?: Array<{ elemento: string }> } | undefined }).elementoDef(id);
    const ELEM = new Proxy({} as Record<string, { receita?: Array<{ elemento: string }> } | undefined>, { get: (_t, id: string) => def(id) });
    const closure = (ids: readonly string[]) => {
      const out = new Set<string>();
      const go = (i: string) => { if (out.has(i)) return; out.add(i); for (const r of ELEM[i]?.receita ?? []) go(r.elemento); };
      ids.forEach(go);
      return out;
    };
    const classes: Record<string, { id: string; condicao: { elementos?: Partial<Record<string, number>> } }> =
      Object.fromEntries(Object.values(eng.ARQUETIPOS).map(a => [a.id, a]));
    expect(Object.keys(eng.ELEMENTOS).length).toBeGreaterThanOrEqual(200);
    expect(Object.keys(classes).length).toBe(79);

    const erros: string[] = [];
    for (const [key, fi] of Object.entries(NPC_FICHAS)) {
      if (!(ALL_ARCHETYPES as readonly string[]).includes(fi.arquetipo)) erros.push(`${key}: arquétipo ${fi.arquetipo}`);
      if (fi.elementos.length < 1 || fi.elementos.length > 4) erros.push(`${key}: ${fi.elementos.length} elementos`);
      for (const e of fi.elementos) if (!ELEM[e]) erros.push(`${key}: elemento inexistente "${e}"`);
      if (!['champion', 'ultimate', 'mega', 'ultra'].includes(fi.estagio)) erros.push(`${key}: estágio ${fi.estagio}`);
      if (!classes[fi.classe] || !CLASS_TITLE_EN[fi.classe]) { erros.push(`${key}: classe inexistente "${fi.classe}"`); continue; }
      const alcance = closure(fi.elementos);
      for (const exigido of Object.keys(classes[fi.classe].condicao.elementos ?? {})) {
        if (!alcance.has(exigido)) erros.push(`${key}: a classe ${fi.classe} exige ${exigido}, que os elementos [${fi.elementos}] não alcançam`);
      }
    }
    expect(erros).toEqual([]);
  });

  it('chefes e guardiões: os elementos da ficha são exatamente os do roster', () => {
    for (const b of BOSS_ROSTER) {
      expect(NPC_FICHAS[`boss:${b.id}`].elementos, b.id).toEqual(b.elements.map(e => e.id));
    }
  });

  it('a personalidade é variada: usa a maioria dos arquétipos e nenhum passa de 30% do elenco', () => {
    const cont = new Map<string, number>();
    for (const fi of Object.values(NPC_FICHAS)) cont.set(fi.arquetipo, (cont.get(fi.arquetipo) ?? 0) + 1);
    const total = Object.keys(NPC_FICHAS).length;
    expect(cont.size).toBeGreaterThanOrEqual(8);
    for (const [a, n] of cont) expect(n / total, a).toBeLessThanOrEqual(0.3);
  });
});

describe('estágios: maioria Ultimate/Mega, poucos Ultra', () => {
  const todas = Object.entries(NPC_FICHAS);
  it('Vesca, Hexsmith e Tessária são Ultra', () => {
    expect(NPC_FICHAS['area:laboratorio'].estagio).toBe('ultra');
    expect(NPC_FICHAS['lote:forja:hexsmith'].estagio).toBe('ultra');
    expect(NPC_FICHAS['lote:arena:duelo'].estagio).toBe('ultra');
    expect(NPC_FICHAS['area:laboratorio'].nome).toMatch(/Vesca/);
    expect(NPC_FICHAS['lote:arena:duelo'].nome).toMatch(/Tess/);
  });
  it('Tessária é vileza + marcial: o combinado Serrilha (e a classe cabe)', async () => {
    const fi = NPC_FICHAS['lote:arena:duelo'];
    expect(fi.elementos).toEqual(['serrilha']);
    const eng = await import('class-system');
    const serrilha = (eng as unknown as { elementoDef: (i: string) => { receita: Array<{ elemento: string }> } }).elementoDef('serrilha');
    expect(serrilha.receita.map(r => r.elemento).sort()).toEqual(['marcial', 'vileza']);
  });
  it('maioria ultimate/mega; ultra em poucos (de 3 a 10% do elenco); champion é raro', () => {
    const n = (s: string) => todas.filter(([, fi]) => fi.estagio === s).length;
    expect((n('ultimate') + n('mega')) / todas.length).toBeGreaterThanOrEqual(0.8);
    expect(n('ultra')).toBeGreaterThanOrEqual(3);
    expect(n('ultra') / todas.length).toBeLessThanOrEqual(0.1);
    expect(n('champion') / todas.length).toBeLessThanOrEqual(0.05);
    expect(n('mega')).toBeGreaterThan(5);
  });
  it('chefes do roster são mega/ultra e guardiões ultimate (o tier manda)', () => {
    for (const b of BOSS_ROSTER) {
      const e = NPC_FICHAS[`boss:${b.id}`].estagio;
      if (b.tier === 'chefe') expect(['mega', 'ultra'], b.id).toContain(e);
      else expect(e, b.id).toBe('ultimate');
    }
  });
});

// ── NADA da ficha aparece ao jogador ─────────────────────────────────────────

function fontesDeUI(): string[] {
  const saida: string[] = [];
  const anda = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const cheio = join(dir, nome);
      if (statSync(cheio).isDirectory()) { anda(cheio); continue; }
      if (!/\.tsx$/.test(nome) || /\.(test|spec)\.tsx$/.test(nome)) continue;
      saida.push(cheio);
    }
  };
  anda(join(RAIZ, 'src', 'components'));
  saida.push(join(RAIZ, 'src', 'App.tsx'));
  return saida;
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const comoPalavra = (nome: string) => new RegExp(`(?<!\\p{L})${escapar(nome)}(?!\\p{L})`, 'u');

interface TextoNpc {
  key: string;
  /** Nome e ofício: palavras de papel ("Alquimista de limo") são texto normal. */
  rotulos: string[];
  /** Fala e lore: onde o jogador ouve o NPC. */
  falas: string[];
}

/** Todo texto de NPC que o jogador pode ler, nos dois idiomas, com a chave da ficha. */
function textosDeNpc(): TextoNpc[] {
  const t: TextoNpc[] = [];
  const voz = (key: string, v: { namePt: string; nameEn: string; linePt: string; lineEn: string; officePt?: string; officeEn?: string }) =>
    t.push({ key, rotulos: [v.namePt, v.nameEn, v.officePt ?? '', v.officeEn ?? ''].filter(Boolean), falas: [v.linePt, v.lineEn] });
  for (const [k, v] of Object.entries(AREA_NPC_VOICE)) voz(`area:${k}`, v);
  for (const [k, v] of Object.entries(LOT_NPC_VOICE)) voz(`lote:${k}`, v);
  for (const [k, v] of Object.entries(FUNCTION_NPC_VOICE)) voz(`funcao:${k}`, v);
  for (const [k, v] of Object.entries(EXTRA_NPC_VOICE)) voz(`extra:${k}`, v);
  for (const [k, v] of Object.entries(NOVO_NPC_VOICE)) voz(`novo:${k}`, v);
  for (const b of BOSS_ROSTER) {
    const pt = bossText(b, true); const en = bossText(b, false);
    t.push({ key: `boss:${b.id}`, rotulos: [pt.name, en.name, pt.papel, en.papel, ...pt.elements, ...en.elements], falas: [pt.lore, en.lore] });
  }
  for (const n of TOURNAMENT_NPCS) t.push({ key: `torneio:${n.id}`, rotulos: [n.namePt, n.nameEn], falas: [] });
  return t;
}

describe('nada da ficha aparece ao jogador (molde de classeNuncaVisivel)', () => {
  it('nenhum componente nem o App importa as fichas dos NPCs', () => {
    const achados: string[] = [];
    for (const arquivo of fontesDeUI()) {
      if (/npcFichas/.test(readFileSync(arquivo, 'utf8'))) achados.push(relative(RAIZ, arquivo));
    }
    expect(achados, 'a ficha é dado de bastidor: só a FALA chega à UI').toEqual([]);
  });

  it('a fala e o lore dos NPCs não citam nome de classe (79 PT + 79 EN); nome e ofício nunca entregam a classe DAQUELE NPC', async () => {
    const { ARQUETIPOS } = await import('class-system');
    const porId = Object.fromEntries(Object.values(ARQUETIPOS).map((a: { id: string; nome: string }) => [a.id, a.nome]));
    const nomes = [...new Set([...Object.values(porId), ...Object.values(CLASS_TITLE_EN)])];
    const achados: string[] = [];
    for (const { key, rotulos, falas } of textosDeNpc()) {
      for (const texto of falas) for (const nome of nomes) if (comoPalavra(nome).test(texto)) achados.push(`${key} fala: "${texto.slice(0, 50)}" → ${nome}`);
      const fi = npcFicha(key);
      if (!fi) continue;
      for (const proprio of [porId[fi.classe], CLASS_TITLE_EN[fi.classe]]) {
        for (const texto of rotulos) if (comoPalavra(proprio).test(texto)) achados.push(`${key} rótulo "${texto}" entrega a própria classe ${proprio}`);
      }
    }
    expect(achados).toEqual([]);
  });

  it('o texto dos NPCs não nomeia o estágio da ficha nem o arquétipo de personalidade', () => {
    const proibidos = [/\bultra\b/i, /\bmega\b/i, /\bultimate\b/i, /arqu[eé]tipo/i, /archetype/i, /\bclasse\b/i, /\bclass\b/i, /big five/i];
    const achados: string[] = [];
    for (const { key, rotulos, falas } of textosDeNpc()) for (const texto of [...rotulos, ...falas]) for (const p of proibidos) if (p.test(texto)) achados.push(`${key}: "${texto.slice(0, 60)}" ~ ${p}`);
    expect(achados).toEqual([]);
  });

  it('a tela de um NPC (nota de função) mostra nome e fala, nunca classe, estágio nem arquétipo', () => {
    for (const language of ['pt-BR', 'en-US'] as const) {
      for (const id of Object.keys(FUNCTION_NPC_VOICE) as Array<keyof typeof FUNCTION_NPC_VOICE>) {
        // Texto visível da nota: a marcação sem tags (sem DOM, roda em node).
        const texto = renderToStaticMarkup(<FunctionNpcNote id={id} language={language} />).replace(/<[^>]*>/g, ' ');
        const fi = NPC_FICHAS[`funcao:${id}`];
        expect(texto.length).toBeGreaterThan(5);
        expect(texto.toLowerCase()).not.toContain(fi.arquetipo);
        expect(texto.toLowerCase()).not.toContain(fi.classe.replace(/_/g, ' '));
        expect(texto).not.toMatch(/ultra|mega|ultimate|champion/i);
      }
    }
  });
});

// ── A fala perdeu o enchimento ───────────────────────────────────────────────

const ENCHIMENTO_PT = /no seu tempo|se quiser|se preferir|quando estiver pronto|quando quiser|sem pressa|à vontade|com calma|devagar o quanto/i;
const ENCHIMENTO_EN = /at your own pace|if you want|if you like|if you would like|when you're ready|when you are ready|whenever you|no rush|take your time|as slow as you|nice and slow|all the time you need|at your pace/i;

describe('a fala dos NPCs perdeu o enchimento (B2) e soa direta', () => {
  const vozes: Array<[string, { linePt: string; lineEn: string }]> = [
    ...Object.entries(AREA_NPC_VOICE).map(([k, v]) => [`area:${k}`, v] as [string, typeof v]),
    ...Object.entries(LOT_NPC_VOICE).map(([k, v]) => [`lote:${k}`, v] as [string, typeof v]),
    ...Object.entries(FUNCTION_NPC_VOICE).map(([k, v]) => [`funcao:${k}`, v] as [string, typeof v]),
    ...Object.entries(EXTRA_NPC_VOICE).map(([k, v]) => [`extra:${k}`, v] as [string, typeof v]),
    ...Object.entries(NOVO_NPC_VOICE).map(([k, v]) => [`novo:${k}`, v] as [string, typeof v]),
  ];
  it('nenhuma fala de NPC usa "no seu tempo / se quiser / sem pressa" (PT e EN)', () => {
    const achados: string[] = [];
    for (const [k, v] of vozes) {
      if (ENCHIMENTO_PT.test(v.linePt)) achados.push(`${k} PT: ${v.linePt}`);
      if (ENCHIMENTO_EN.test(v.lineEn)) achados.push(`${k} EN: ${v.lineEn}`);
    }
    expect(achados).toEqual([]);
  });
  it('toda fala tem os dois idiomas e não cobra', () => {
    for (const [k, v] of vozes) {
      expect(v.linePt.length, k).toBeGreaterThan(3);
      expect(v.lineEn.length, k).toBeGreaterThan(3);
      expect(v.linePt, k).not.toMatch(/deveria|devia |atrasou|falhou|esqueceu|finalmente|preguiç|culpa|perdeu/i);
      expect(v.lineEn, k).not.toMatch(/\bshould\b|\blate\b|failed|forgot|finally|\blazy\b|guilt|\blost\b/i);
    }
  });
  it('NPCs de arquétipos diferentes não falam todos do mesmo jeito (a fala é única por NPC)', () => {
    const linhas = vozes.map(([, v]) => v.linePt);
    expect(new Set(linhas).size).toBeGreaterThan(linhas.length * 0.7);
  });
});
