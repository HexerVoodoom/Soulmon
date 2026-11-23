/**
 * O elemento EFETIVO influencia TODO prompt de sprite (dono, 10/11/2026): tema (poção/combinado natural) + pistas visuais de forma e paleta
 * DO elemento (derivadas dos prompts dos assets) + fundo chroma coerente (verde por padrão; magenta quando há verde; verde de novo quando só
 * há magenta). Só gerações futuras usam isto — nada de sprite/save existente muda.
 */
import { describe, it, expect } from 'vitest';
import { escolherChaveDeMatiz, hueDist, KEY_HUE } from '../../functions/api/_chromaHue.js';
import { createHash } from 'node:crypto';
import { ELEMENTOS_PUROS_LOTE5, PROMPT_ROOT_EXTRA, stagesComElemento, pistasVisuaisDoElemento, PALAVRA_CHAVE_BASE, TETO_PISTAS, nomeiaBase, pistaTerraDe, escolherChroma, aplicarChroma, chromaDoPrompt, semChromaSeguro } from './elementoCombinado';
import { DESCRITORES_ELEMENTO } from './elementoDescritores.data';
import { ESSENCE_ELEMENT_IDS, BASE_ELEMENT_IDS, essenceComposition } from './elementDex';

const FUNDO_VERDE = 'Tamagotchi-style v-pet sprite, 16x16 pixel art, isolated subject, on a solid flat pure #00FF00 chroma-green background (uniform, no gradient, no shadow), the creature itself contains no green and no green fringe: macaw, Blood Reaver. Flat dark violet and ash-gray colors.';
const RAW = `Generate this RPG creature. ${FUNDO_VERDE}`;
const st = [{ stage: 'perfeito', branch: 'poder', imagePrompt: RAW, imagePromptFallback: RAW + ' (fb)' }] as never;
type P = { imagePrompt: string; imagePromptFallback: string };
const gen = (id?: string, base?: string): P => stagesComElemento(st, undefined, id ? { ultimate: id } : undefined, base)![0] as P;

describe('elemento efetivo em TODO prompt', () => {
  it('sem nenhuma informação de elemento (sem poção, sem registro, sem base): o prompt não muda', () => {
    expect(gen().imagePrompt).toBe(RAW);
    expect(stagesComElemento(st, undefined, undefined, undefined)).toBe(st);
  });
  it('prompt NATURAL (sem poção; elemento = base do Soulmon): leva as pistas do base, sem tema extra', () => {
    const p = gen(undefined, 'sombra').imagePrompt;
    expect(p.startsWith(RAW)).toBe(true);
    expect(p).toContain('Visual cues of this element: curling black smoke, ink black and cold grey-blue palette.');
    expect(p).not.toContain('Elemental theme');
    expect(chromaDoPrompt(p)).toBe('green');
  });
  it('poção simples COM prompt-fonte (Marcial, Morte): tema + pistas de forma e paleta', () => {
    const m = gen('marcial', 'sombra').imagePrompt;
    expect(m).toContain('Elemental theme of this form: Martial.');
    expect(m).toContain('Visual cues of this element: one large sword, steel grey and deep red palette.');
    const d = gen('morte', 'sombra').imagePrompt;
    expect(d).toContain('Elemental theme of this form: Death.');
    expect(d).toContain('a pale bone-white antler crown');
  });
  it('combinado: esquema do PRÓPRIO elemento (kit) + um traço dos componentes (70/30); Sabá = arcano+sombra+vileza', () => {
    expect(gen('armaria', 'sombra').imagePrompt).toContain('forged blades and anvil sparks');
    const s = gen('sabbat', 'sombra').imagePrompt;
    expect(s).toContain('Elemental theme of this form: Sabbath, with arcano as its main element.');
    expect(s).toContain('ring of candles around rune, with hints of a large floating violet rune disc, curling black smoke, barbed thorns');
    expect(s).toContain('royal violet, ink black, sickly green accents');
    expect(chromaDoPrompt(s)).not.toBe('magenta'); // violeta fica entre azul e magenta: fundo magenta/azul comeria o corpo (#749)
  });
  it('elemento simples (base): só o próprio, sem traço de componentes', () => {
    for (const b of BASE_ELEMENT_IDS) expect(`${DESCRITORES_ELEMENTO[b].forma} ${DESCRITORES_ELEMENTO[b].paleta}`, b).not.toMatch(/hints of|accents/);
  });
  it('a forma original (elemento = base) leva as pistas do base, também em forma de poção do mesmo elemento', () => {
    expect(gen('sombra', 'sombra').imagePrompt).toContain('Visual cues of this element: curling black smoke');
  });
});

describe('fundo chroma coerente com as cores do elemento', () => {
  it('elemento com verde (planta, vileza) → fundo NUNCA verde: o de maior distância real de matiz (magenta ou azul), com a cláusula da própria chave', () => {
    // Regra de 10/11/2026: sem penalidade de posição, vence a chave de maior distância real; planta (verde + amarelo) fica a 120 do azul e 115 do magenta => azul.
    const clausula = { magenta: 'contains no magenta, no hot pink and no magenta fringe', blue: 'contains no blue and no blue fringe' } as const;
    const hex = { magenta: '#FF00FF', blue: '#0000FF' } as const;
    for (const id of ['planta', 'vileza']) {
      const p = gen(id, 'sombra').imagePrompt;
      const k = chromaDoPrompt(p) as 'magenta' | 'blue';
      expect(['magenta', 'blue'], id).toContain(k);
      expect(p, id).toContain(hex[k]);
      expect(p, id).toContain(clausula[k]);
      expect(p, id).not.toContain('#00FF00');
    }
    expect(chromaDoPrompt(gen('planta', 'sombra').imagePrompt)).toBe('blue');
  });
  it('elemento sem verde mantém o fundo VERDE #00FF00', () => {
    for (const id of ['marcial', 'morte', 'sombra', 'fogo']) {
      const p = gen(id, 'sombra').imagePrompt;
      expect(p, id).toContain('#00FF00 chroma-green');
      expect(p, id).not.toContain('#FF00FF');
    }
  });
  it('verde e magenta juntos: o fundo é AZUL #0000FF (3ª chave), sem azul forte na paleta', () => {
    expect(escolherChroma(`${RAW} Visual cues of this element: hot-pink glitter, green leaves palette.`)).toBe('blue');
    expect(escolherChroma(`${RAW} Visual cues of this element: green leaves, hot-pink glitter, cyan and navy palette.`)).toBe('blue');
  });
  it('verde, magenta E azul forte: sem cor segura -> regra antiga (a que não domina) e semChromaSeguro marca', () => {
    const t = `${RAW} Visual cues of this element: green leaves, hot-pink glitter, royal blue palette.`;
    expect(semChromaSeguro(t)).toBe(true);
    expect(escolherChroma(t)).toBe('blue'); // por matiz: a 3ª cor citada (azul) é a menos dominante e a sacrificada
  });
  it('elementos com verde E magenta nas pistas: o fundo é o de maior distância de matiz (nunca a cor dominante da criatura)', () => {
    for (const id of ['tormento', 'praga', 'devorador', 'cyber', 'bencao_feerica']) {
      const p = gen(id, 'sombra').imagePrompt;
      const corpo = p.replace(/on a solid flat pure #[0-9A-Fa-f]{6} chroma-\w+ background \([^)]*\), the creature itself contains no [^:]*? fringe/, '');
      const r = escolherChaveDeMatiz(corpo);
      expect(chromaDoPrompt(p), id).toBe(r.key);
      expect(r.cores[0] && Math.min(...[r.cores[0]].map(c => hueDist(c.hue, KEY_HUE[r.key]))) >= 30, id).toBe(true); // a cor dominante nunca fica a <30 graus da chave
    }
  });
  it('criatura ROXA (entre azul e magenta) pede fundo VERDE, não magenta nem azul', () => {
    for (const t of ['purple dragon with violet wings', 'dragão roxo com asas violeta', 'lilac fox, amethyst eyes']) {
      expect(escolherChroma(`${RAW} ${t}`), t).toBe('green');
    }
  });
  it('portal e glitter (magenta, sem verde nas pistas) ficam no verde; elementos normais não mudam', () => {
    for (const id of ['portal', 'glitter']) expect(chromaDoPrompt(gen(id, 'sombra').imagePrompt), id).toBe('green');
    expect(chromaDoPrompt(gen('planta', 'sombra').imagePrompt)).toBe('blue'); // (era magenta pela penalidade de posicao, removida em 10/11/2026)
    expect(chromaDoPrompt(gen('fogo', 'sombra').imagePrompt)).toBe('green');
  });
  it('aplicarChroma troca entre as 3 chaves e volta ao original', () => {
    for (const k of ['green', 'magenta', 'blue'] as const) {
      const x = aplicarChroma(RAW, k);
      expect(chromaDoPrompt(x)).toBe(k);
      expect(aplicarChroma(x, 'green')).toBe(RAW);
    }
  });
  it('só magenta/rosa-choque (sem verde em lugar nenhum) → volta ao fundo VERDE', () => {
    const mag = aplicarChroma(RAW, 'magenta');
    const t = `${mag} Visual cues of this element: hot-pink glitter sparks, yellow palette.`;
    expect(escolherChroma(t)).toBe('green');
    expect(aplicarChroma(t, 'green')).toContain('#00FF00 chroma-green');
  });
  it('aplicarChroma é reversível e idempotente', () => {
    expect(aplicarChroma(aplicarChroma(RAW, 'magenta'), 'green')).toBe(RAW);
    expect(aplicarChroma(RAW, 'green')).toBe(RAW);
  });
  it('em todo o catálogo, o fundo pedido é o de maior pontuação de matiz, e a cor dominante nunca colide', () => {
    for (const id of ESSENCE_ELEMENT_IDS) {
      const p = gen(id, 'sombra');
      for (const txt of [p.imagePrompt, p.imagePromptFallback]) {
        const corpo = txt.replace(/on a solid flat pure #[0-9A-Fa-f]{6} chroma-\w+ background \([^)]*\), the creature itself contains no [^:]*? fringe/, '');
        const r = escolherChaveDeMatiz(corpo);
        expect(chromaDoPrompt(txt), id).toBe(r.key);
        if (r.cores[0]) expect(hueDist(r.cores[0].hue, KEY_HUE[r.key]), id).toBeGreaterThanOrEqual(Math.min(30, r.ranking[0].score));
      }
    }
  });
  it('catálogo com o círculo cheio (sem chave segura) é um conjunto pequeno e conhecido: listar para o dono', () => {
    expect(ESSENCE_ELEMENT_IDS.filter(id => semChromaSeguro(gen(id, 'sombra').imagePrompt))).toEqual(['requiem']);
  });
  it('a troca de texto é a MESMA do Oráculo (motor.ts › withChroma)', () => {
    const doMotor = FUNDO_VERDE.replace('#00FF00 chroma-green', '#FF00FF chroma-magenta').replace('contains no green and no green fringe', 'contains no magenta, no hot pink and no magenta fringe');
    expect(aplicarChroma(FUNDO_VERDE, 'magenta')).toBe(doMotor);
  });
});

describe('tabela de descritores', () => {
  it('todos os 20 elementos base têm prompt-fonte e só existem ids do catálogo', () => {
    for (const b of BASE_ELEMENT_IDS) expect(DESCRITORES_ELEMENTO[b]?.forma || DESCRITORES_ELEMENTO[b]?.paleta, b).toBeTruthy();
    for (const id of Object.keys(DESCRITORES_ELEMENTO)) expect(ESSENCE_ELEMENT_IDS, id).toContain(id);
  });
  it('TODO elemento do catálogo tem descritor (sem exceções: cada um tem kit próprio de ícone + FX)', () => {
    for (const id of ESSENCE_ELEMENT_IDS) expect(pistasVisuaisDoElemento(id), id).toBeTruthy();
  });
  it('sem identidade Soulmon (cristal da alma) nos descritores; engrenagem só onde o elemento pede (tempo/relojoaria)', () => {
    for (const [id, d] of Object.entries(DESCRITORES_ELEMENTO)) expect(`${d.forma ?? ''} ${d.paleta ?? ''}`, id).not.toMatch(/soul-?crystal|steampunk/i);
  });
});

/**
 * REGISTRO §407 (15/11/2026): descritores AUTORAIS. Antes, o descritor escrito não nomeava todos os componentes (53 pares, 14 trios, 19 quartetos) e o
 * código completava com uma forma genérica. Agora o PRÓPRIO descritor traz uma pista forte por componente; o completamento do código fica só de rede.
 */
const REESCRITOS: readonly string[] = ['lava', 'fervor', 'pantano', 'correnteza', 'areia', 'magnetismo', 'cristal', 'obsidiana', 'ouro_vivo', 'solo_profano', 'ossuario', 'flora', 'tita', 'impeto', 'reflexo', 'encantamento', 'assassinio', 'bravura', 'carnificina', 'ceifa', 'vitalidade', 'aco', 'maestria', 'fossil', 'frenesi', 'terremoto', 'brado', 'colapso', 'peso_descomunal', 'asteroide', 'gigante_estelar', 'circulo_feerico', 'graca', 'mineracao', 'exoesqueleto', 'queimada', 'mangue', 'raiz_profunda', 'polen', 'fotossintese', 'druidismo', 'fungo', 'girassol', 'espinheiro', 'murcha', 'seiva', 'carvalho', 'bambu', 'estacoes', 'farfalhar', 'arvore_mundo', 'jardim_encantado', 'estufa', 'pestilencia', 'geiser', 'vulcao', 'deserto', 'nevasca', 'permafrost', 'ossario_vivo', 'jardim_eterno', 'bencao_marcial', 'carniceiro', 'gladiador', 'punho_gravitico', 'avatar_elemental', 'titano_forjado', 'cataclismo', 'sopro_do_dragao', 'ragnarok', 'genesis', 'tempestade_perfeita', 'leviata', 'senhor_da_praga', 'sinfonia_do_caos', 'vontade_absoluta', 'arquiteto_da_realidade', 'ceifador_estelar', 'renascimento', 'juizo_final', 'cavaleiro_absoluto', 'clareira', 'alto_forno', 'floresta_ancestral', 'colosso_blindado', 'corte_feerica'];
const textoDoDescritor = (id: string): string => `${DESCRITORES_ELEMENTO[id].forma ?? ''} ${DESCRITORES_ELEMENTO[id].paleta ?? ''}`.toLowerCase();
const REGEX_FRANQUIA = /digimon|pok[eé]mon|monster rancher|yu-?gi-?oh|warhammer|palworld|final fantasy|hello kitty|tamagotchi|ragnarok online|warcraft|mana\b/i;

/** Lote 5 (P5, 23/11/2026): descritores provisórios montados dos componentes, fora do hash dos 183 originais. */
const LOTE5_PROVISORIO: readonly string[] = ['fantasma', 'morto_vivo', 'sangue', 'furia'];

describe('Hemolisk: override só do root (REGISTRO §505)', () => {
  const rookie = (id: string, stage: string) => (stagesComElemento([{ stage, branch: 'poder', imagePrompt: RAW, imagePromptFallback: RAW }] as never, undefined, { [stage === 'rookie' ? 'rookie' : 'ultimate']: id } as never, undefined)![0] as P);
  it('o rookie de sangue leva o Tarrasque bebê; o descritor geral e os outros estágios/espécies não', () => {
    expect(rookie('sangue', 'rookie').imagePrompt).toContain(PROMPT_ROOT_EXTRA.sangue);
    expect(rookie('sangue', 'perfeito').imagePrompt).not.toMatch(/tarrasque/i);
    expect(rookie('fantasma', 'rookie').imagePrompt).not.toMatch(/tarrasque/i);
    expect(textoDoDescritor('sangue')).not.toMatch(/tarrasque/);
    expect(Object.keys(PROMPT_ROOT_EXTRA)).toEqual(['sangue']);
  });
});

describe('descritores autorais (REGISTRO §407)', () => {
  it('são 86: 53 pares, 14 trios, 19 quartetos', () => {
    const n = (k: number) => REESCRITOS.filter(id => essenceComposition(id)?.length === k).length;
    expect([REESCRITOS.length, n(2), n(3), n(4)]).toEqual([86, 53, 14, 19]);
  });
  it('o DESCRITOR escrito (sem o completamento do código) nomeia a palavra-chave de CADA componente', () => {
    const ruins = REESCRITOS.map(id => [id, (essenceComposition(id) ?? []).filter(c => !nomeiaBase(textoDoDescritor(id), c))] as const).filter(([, f]) => f.length);
    expect(ruins).toEqual([]);
  });
  it('em TODO combinado do catálogo o descritor escrito já cobre os componentes (o código não precisa completar)', () => {
    const ruins = ESSENCE_ELEMENT_IDS.filter(id => !ELEMENTOS_PUROS_LOTE5.has(id)).filter(id => (essenceComposition(id) ?? []).some(c => !nomeiaBase(textoDoDescritor(id), c)));
    expect(ruins).toEqual([]);
    for (const id of REESCRITOS) expect(pistasVisuaisDoElemento(id), id).toBe([DESCRITORES_ELEMENTO[id].forma, `${DESCRITORES_ELEMENTO[id].paleta} palette`].join(', '));
  });
  it(`pistas finais <= ${TETO_PISTAS} caracteres`, () => {
    for (const id of REESCRITOS) expect((pistasVisuaisDoElemento(id) ?? '').length, id).toBeLessThanOrEqual(TETO_PISTAS);
  });
  it('regra do tempo (§324): no máximo UM motivo, nunca ampulheta e relógio juntos', () => {
    for (const id of REESCRITOS) {
      const t = textoDoDescritor(id);
      expect(/hourglass/.test(t) && /\bclock|\bwatch\b|sundial|pendulum/.test(t), id).toBe(false);
      expect((t.match(/hourglass/g) ?? []).length, id).toBeLessThanOrEqual(1);
    }
  });
  it('sem nome de franquia, sem engrenagem e sem palavra que induza texto na imagem', () => {
    for (const id of REESCRITOS) {
      expect(textoDoDescritor(id), id).not.toMatch(REGEX_FRANQUIA);
      expect(textoDoDescritor(id), id).not.toMatch(/\bgears?\b|\bcogs?\b|steampunk|soul-?crystal/);
      expect(textoDoDescritor(id), id).not.toMatch(/\b(text|letters?|words?|caption|label|writing|inscription|logo|number|numerals?)\b/);
    }
  });
  it('determinismo: o mesmo elemento gera o mesmo prompt duas vezes', () => {
    for (const id of REESCRITOS) expect(gen(id, 'sombra').imagePrompt, id).toBe(gen(id, 'sombra').imagePrompt);
  });
  it('lote 5 (fantasma, morto_vivo, sangue, furia): elemento PURO (sem folha, gema, coração de luz, coroa de osso nem Tarrasque), sem completar com formas dos componentes, cabe no teto', () => {
    for (const id of LOTE5_PROVISORIO) {
      expect(DESCRITORES_ELEMENTO[id], id).toBeDefined();
      expect(textoDoDescritor(id), id).not.toMatch(/leaves|leaf|budding|gem|hearts? of light|antler|crystal|pipes?|tarrasque/);
      expect((pistasVisuaisDoElemento(id) ?? '').length, id).toBeLessThanOrEqual(TETO_PISTAS);
    }
  });
  it('os outros 183 elementos: hash do conteúdo (REGISTRO §408 trocou as pistas fracas em 112 deles; antes de §408 o hash era 909d77b1…; §411 trocou mais 114 deles (180 dos 269 no total: 66 autorais + 114 daqui), hash 0c25ed7d… anterior; §412 trocou as pistas de espaço e vigor em 58 descritores no total, hash aae74725… anterior)', () => {
    const resto = Object.keys(DESCRITORES_ELEMENTO).filter(i => !REESCRITOS.includes(i) && !LOTE5_PROVISORIO.includes(i)).sort(); // o lote 5 (P5, 23/11/2026) é provisório e vem abaixo: o hash dos 183 originais NÃO muda
    const h = createHash('sha256').update(JSON.stringify(resto.map(i => [i, DESCRITORES_ELEMENTO[i]]))).digest('hex');
    expect([resto.length, h]).toEqual([183, 'fa8c9f70b156ccff3e0a4be1b3d478392ad8a8111e0b7cc1bf70d496ea5c8442']);
  });
});

/**
 * REGISTRO §408 (15/11/2026): 6 amostras de criaturas no Higgsfield mostraram que pista de TEXTURA ou OBJETO PEQUENO não aparece (barro rachado, contas
 * em cordão, lâminas cruzadas, estrelas caindo, ondas sonoras); o que aparece é FORMA GRANDE ou COR FORTE. As pistas fracas foram trocadas por formas grandes.
 */
describe('pistas fortes (REGISTRO §408)', () => {
  const FRACAS = /concentric rings|amber collar|swirling wind ribbons|cracked clay|amber beads|crossed blades|falling stars|sound waves|sound-waves|tiny stones|bleached branches|orbiting violet glyphs|thin orbit lines|rolling sound/;
  it('nenhuma forma de nenhum dos 269 descritores contém uma pista fraca medida', () => {
    for (const [id, d] of Object.entries(DESCRITORES_ELEMENTO)) expect(d.forma ?? '', id).not.toMatch(FRACAS);
  });
  it('REGISTRO §412: nenhuma forma usa mais "a band of stars" nem "a large amber gem" (a R3 mediu os dois como parciais); as formas novas existem', () => {
    const todas = Object.values(DESCRITORES_ELEMENTO).map(d => d.forma ?? '');
    for (const f of todas) { expect(f).not.toContain('a band of stars'); expect(f).not.toContain('a large amber gem'); }
    expect(todas.some(f => f.includes('a large floating ring of stars'))).toBe(true);
    expect(todas.some(f => f.includes('a big amber gem glowing on its chest'))).toBe(true);
    expect(DESCRITORES_ELEMENTO.espaco.forma).toContain('ring of stars');
    expect(DESCRITORES_ELEMENTO.vigor.forma).toContain('amber gem glowing on its chest');
  });
  it('as palavras-chave de PALAVRA_CHAVE_BASE são formas grandes (e nenhuma é a pista fraca)', () => {
    for (const k of Object.values(PALAVRA_CHAVE_BASE).flat()) expect(k, k).not.toMatch(FRACAS);
    expect(PALAVRA_CHAVE_BASE).toMatchObject({ terra: ['boulder shoulder', 'stone slabs', 'rocky horn crest'], marcial: ['sword'], vigor: ['amber gem glowing on its chest', 'amber gem'], som: ['bronze bell'], espaco: ['ring of stars', 'band of stars'], morte: ['antler crown'], arcano: ['rune disc'], gravidade: ['stone orbiting a ring'], ar: ['ring of wind'] });
  });
  it('teto de 260 caracteres vale para os 269 (não só os 86), e toda pista tem no máximo UM motivo de tempo', () => {
    for (const id of Object.keys(DESCRITORES_ELEMENTO)) expect((pistasVisuaisDoElemento(id) ?? '').length, id).toBeLessThanOrEqual(TETO_PISTAS);
  });
  it('trios e quartetos: a pista de forma grande das bases fracas vem ANTES das demais na lista de "hints of"', () => {
    const GRANDES = ['boulder shoulder', 'stone slabs', 'rocky horn crest', 'sword', 'amber gem', 'bronze bell', 'ring of stars', 'band of stars', 'antler crown', 'rune disc', 'stone orbiting a ring', 'ring of wind'];
    for (const id of ESSENCE_ELEMENT_IDS) {
      if ((essenceComposition(id)?.length ?? 0) < 3) continue;
      const hints = (DESCRITORES_ELEMENTO[id].forma ?? '').split(', with hints of ')[1]?.split(', ') ?? [];
      const ehGrande = hints.map(h => GRANDES.some(g => h.includes(g)));
      expect(ehGrande.join(), id).not.toMatch(/false,true/);
    }
  });
});

/**
 * REGISTRO §411 (15/11/2026): a 2ª rodada de amostras no Higgsfield (11 para 16 de 24 componentes visíveis) deixou ARCANO e SOM ausentes, AR/MORTE/VIGOR/GRAVIDADE
 * parciais e a terra repetida; e achou um BUG de texto: "a band of a band of stars" (o artigo do espaço foi colado duas vezes ao editar à mão os descritores).
 */
describe('sem repetição de texto e formas grandes novas (REGISTRO §411)', () => {
  const REPETIDO = /(\w+(?: \w+){0,3}) /;
  it('nenhum dos 269 descritores nem das pistas finais repete uma palavra ou grupo de até 4 palavras em seguida ("a band of a band of", "a a", "of of")', () => {
    for (const id of Object.keys(DESCRITORES_ELEMENTO)) {
      const d = DESCRITORES_ELEMENTO[id];
      for (const t of [d.forma ?? '', d.paleta ?? '', pistasVisuaisDoElemento(id) ?? '']) expect(t.toLowerCase().match(REPETIDO)?.[0] ?? null, `${id}: ${t}`).toBeNull();
    }
  });
  it('o prompt final de cada combinado também não repete', () => {
    for (const id of ESSENCE_ELEMENT_IDS) expect(gen(id, 'sombra').imagePrompt.toLowerCase().match(REPETIDO)?.[0] ?? null, id).toBeNull();
  });
  it('ar: anel de vento solto, cinza/prata (nunca lê como água); arcano: disco de runa violeta; morte: osso pálido', () => {
    for (const id of ESSENCE_ELEMENT_IDS) {
      const t = textoDoDescritor(id);
      const comp = essenceComposition(id) ?? [];
      if (comp.includes('ar')) { expect(t, id).toContain('ring of wind'); expect(t, id).not.toMatch(/sky blue/); }
      if (comp.includes('arcano')) { expect(t, id).toContain('violet rune disc'); expect(t, id).toMatch(/violet/); }
      if (comp.includes('morte') && !ELEMENTOS_PUROS_LOTE5.has(id)) { expect(t, id).toContain('bone-white antler crown'); expect(t, id).toMatch(/bone white/); }
    }
    expect(textoDoDescritor('ar')).toMatch(/silver-grey/);
  });
  it('som é um OBJETO (sino), vigor é uma gema âmbar, gravidade é uma pedra escura em órbita de um anel', () => {
    for (const id of ESSENCE_ELEMENT_IDS) {
      const t = textoDoDescritor(id); const comp = essenceComposition(id) ?? [];
      if (comp.includes('som')) expect(t, id).toContain('big bronze bell');
      if (comp.includes('vigor') && !ELEMENTOS_PUROS_LOTE5.has(id)) expect(t, id).toContain('big amber gem glowing on its chest');
      if (comp.includes('gravidade')) expect(t, id).toContain('large dark stone orbiting a ring');
    }
  });
  it('terra: cada combinado usa a forma que o hash do id manda, e as 3 formas aparecem', () => {
    const usadas = new Set<string>();
    for (const id of ESSENCE_ELEMENT_IDS) {
      if (!(essenceComposition(id) ?? []).includes('terra')) continue;
      const esperada = pistaTerraDe(id);
      expect(textoDoDescritor(id), id).toContain(esperada);
      usadas.add(esperada);
    }
    expect(usadas.size).toBe(3);
  });
});
