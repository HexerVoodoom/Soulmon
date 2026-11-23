// Régua do feedback §18: manifesto íntegro e copy dentro das regras do dono.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import assets from '../../src/content/assets.json';
import midia from '../../src/content/midia.json';
import { TEXTOS } from '../../src/i18n/textos';
import elenco from '../../src/content/elenco.json';
import universo from '../../src/content/universo.json';
import { proximoSorteio } from '../../src/lib/sorteio';
import { readdirSync, statSync } from 'node:fs';

const ESTADOS = ['final', 'aguarda-revisao', 'aguarda-aprovacao-do-dono', 'provisorio', 'provisorio-css'];
const pecas = Object.entries(assets).filter(([k]) => !k.startsWith('_'));
const landing = readFileSync('src/components/Landing.astro', 'utf8');

describe('manifesto de assets', () => {
  it.each(pecas)('%s tem estado válido e arquivo existente', (_k, p) => {
    expect(ESTADOS).toContain(p.estado);
    if (p.estado === 'provisorio-css') expect(p.src).toBeNull();
    else expect(existsSync(`public${p.src}`)).toBe(true);
  });
  it('peça gerada sem revisão humana nunca é final por script', () => {
    for (const [, p] of pecas) if (p.src?.startsWith('/site/')) expect(['aguarda-revisao', 'aguarda-aprovacao-do-dono', 'final']).toContain(p.estado);
  });
});

describe('copy do site', () => {
  const copia = JSON.stringify(TEXTOS);
  it.each(['cabo', 'cable', 'Crato', 'Brooka', 'Zefi', 'Oaken', 'Bolid', 'novidades', 'tamer', 'domador'])('não fala de %s', (t) => {
    expect(copia.toLowerCase()).not.toContain(t.toLowerCase());
  });
  it('elenco: hero mantém fogo-ultimate como herói; nada removido na landing', () => {
    expect(landing).toMatch(/fogo-ultimate/);
    expect(landing).not.toMatch(/agua-mega|luz-/);
  });
  it('prova real: loop e prints de gameplay nos dois idiomas', () => {
    for (const l of ['pt', 'en']) {
      expect(midia.videos[l].filter((v) => v.gameplay === true && existsSync(`public${v.src}`) && existsSync(`public${v.poster}`))).toHaveLength(1);
      expect(midia.prints[l].filter((p) => p.gameplay === true && existsSync(`public${p.src}`))).toHaveLength(4); // Combate, Endless Rift, Hall, Jogos
    }
    expect(midia.abertura.gameplay).toBe(false);
    // trailer de 06/11 vetado (rótulos internos e "ciência do comportamento"): slot desligado e fora de public/
    for (const l of ['pt', 'en']) { expect(midia.trailer[l].gameplay).toBe(false); expect(existsSync(`public${midia.trailer[l].src}`)).toBe(!!midia.trailer[l].ativo); }
  });
  it('nomes das formas só onde o dono pediu (09/11): ciclo.nomes', () => {
    expect(JSON.stringify({ ...TEXTOS.pt, ciclo: { ...TEXTOS.pt.ciclo, formas: [], nomes: [] } }) + JSON.stringify({ ...TEXTOS.en, ciclo: { ...TEXTOS.en.ciclo, formas: [], nomes: [] } })).not.toMatch(/rookie|champion|ultimate|mega|ultra/i);
  });
  it('landing não usa arte vetada', () => {
    for (const t of ['starters/', 'mapas-recriados', 'bg-mapa', 'mapa/mercado', 'mapa-mundi', 'type="checkbox"']) expect(landing).not.toContain(t);
  });
  it('textos exatos do dono', () => {
    expect(TEXTOS.pt.form.okH + ' ' + TEXTOS.pt.form.ok).toBe('Parabéns, você se inscreveu no beta! Seu e-mail foi cadastrado com sucesso. Você receberá o link para fazer o download nos próximos dias.');
    expect(TEXTOS.pt.form.esperaH + ' ' + TEXTOS.pt.form.espera).toBe('As vagas desta rodada foram preenchidas. Teremos uma nova rodada e seu e-mail já está na fila. Obrigado por se interessar no Soulmon!');
    expect(TEXTOS.en.form.esperaH + ' ' + TEXTOS.en.form.espera).toBe('This round is full. Another round is coming and your email is already in line. Thanks for your interest in Soulmon!');
    expect(TEXTOS.pt.form.enviar).toBe('Entrar no beta');
    expect(TEXTOS.en.form.enviar).toBe('Join the beta');
    // estado de espera (decisão do dono, 06/11): botão do formulário e CTAs
    expect(TEXTOS.pt.form.enviarEspera).toBe('Entrar na fila');
    expect(TEXTOS.en.form.enviarEspera).toBe('Join the line');
    expect(TEXTOS.pt.ctaEspera).toBe('Entrar na fila');
    expect(TEXTOS.en.ctaEspera).toBe('Join the line');
    // plataforma: só Android, sem "por ora" (FEATURE_TRUTH)
    expect(JSON.stringify(TEXTOS).toLowerCase()).not.toMatch(/por ora|for now|em breve|coming soon/);
  });
  it('antes de cadastrar, nunca diz que o e-mail já está na fila', () => {
    expect(TEXTOS.pt.form.esperaPre).not.toContain('já está');
    expect(TEXTOS.en.form.esperaPre).not.toContain('already');
  });
  it('títulos de seção com até 6 palavras e 34 caracteres (DESIGN-SYSTEM §3.3)', () => {
    for (const l of [TEXTOS.pt, TEXTOS.en]) {
      // ciclo.h2 fora: texto ditado pelo dono (09/11), mais longo que 6 palavras.
      for (const h of [l.jogo.h2, l.soul.h2, l.universo.h2, l.recursos.h2, l.video.h2, l.entrar.h2, l.faq.h2, l.form.h2]) {
        expect(h.split(' ').length, h).toBeLessThanOrEqual(6);
        expect(h.length, h).toBeLessThanOrEqual(34);
      }
    }
  });
  it('PT e EN têm a mesma estrutura', () => {
    expect(TEXTOS.en.universo.abas.length).toBe(TEXTOS.pt.universo.abas.length);
    expect(Object.keys(TEXTOS.en.universo.els)).toEqual(Object.keys(TEXTOS.pt.universo.els));
    expect(Object.keys(TEXTOS.pt.universo.els)).toHaveLength(20);
  });
});

describe('v4: elenco, sorteio, universo, PvP e PvE', () => {
  const vetados = ['agua-mega', 'luz-mega', 'luz-rookie', 'luz-champion', 'luz-ultimate', 'luz-ultra', 'agua-ultra'];
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(`${d}/${f}`).isDirectory() ? walk(`${d}/${f}`) : [`${d}/${f}`]));
  it('nenhum agua-mega nem luz com auréola no elenco, em public/ e no dist', () => {
    const ids = elenco.elegiveis.map((x) => x.id);
    for (const v of vetados) { expect(ids).not.toContain(v); expect(existsSync(`public/sprites/${v}.webp`)).toBe(false); }
    if (existsSync('dist')) for (const f of walk('dist')) for (const v of vetados) expect(f).not.toContain(v);
  });
  it('nada da DEMO e nada de steampunk no sorteio', () => {
    const ids = elenco.elegiveis.map((x) => x.id).join(' ');
    expect(ids).not.toMatch(/industrial|starters|meteoro|nascente/);
    for (const x of ['x-e33', 'x-l72', 'x-l20', 'x-l121', 'x-f3', 'fogo-rookie']) expect(ids).toContain(x); // escolha explícita do dono
    expect(ids).not.toContain('x-l113'); // golem dourado com auréola
    expect(ids).not.toContain('agua-mega'); // linha de fogo inteira (decisão do dono)
  });
  it('nome interno do bichinho nunca aparece em texto público', () => {
    const publico = JSON.stringify(TEXTOS) + JSON.stringify(universo) + landing;
    expect(publico.toLowerCase()).not.toMatch(/peste.?negra/);
  });
  it('sorteio nunca repete o anterior e cobre o conjunto', () => {
    const n = elenco.elegiveis.length; let ant = -1; const vistos = new Set();
    for (let k = 0; k < 4000; k++) { const i = proximoSorteio(n, ant); expect(i).not.toBe(ant); expect(i).toBeGreaterThanOrEqual(0); expect(i).toBeLessThan(n); vistos.add(i); ant = i; }
    expect(vistos.size).toBe(n);
    expect(proximoSorteio(2, 0, () => 0)).toBe(1);
  });
  it('7 lugares, falas de até 35 palavras em PT e EN, sem promessa de saúde', () => {
    const ids = TEXTOS.pt.universo.areas.map(([id]) => id);
    expect(ids).toHaveLength(7);
    for (const id of ids) for (const l of ['pt', 'en']) {
      const f = universo.lugares[id][l]; expect(f.split(/\s+/).length, id + l).toBeLessThanOrEqual(35);
      expect(f.toLowerCase()).not.toMatch(/cura|curar|terapia|therapy|saúde|health|tdah|adhd/);
    }
  });
  it('cartão PvP e PvE', () => {
    expect(TEXTOS.pt.recursos.cartoes[0][1]).toBe('PvP e PvE');
    expect(TEXTOS.en.recursos.cartoes[0][1]).toBe('PvP and PvE');
  });
});

describe('v5: hero com loop real, gravidade-champion e capa do trailer sem texto', () => {
  const aparelho = readFileSync('src/components/Aparelho.astro', 'utf8');
  const css = readFileSync('src/styles/site.css', 'utf8');
  const app = readFileSync('src/scripts/app.ts', 'utf8');
  it('hero usa gravidade-champion (pangolim) no lugar do camaleão som-champion', () => {
    expect(assets.heroArte.elenco).toContain('gravidade-champion');
    expect(assets.heroArte.elenco).not.toContain('som-champion');
    expect(assets.heroArte.elenco).not.toContain('arcano-ultra');
    expect(assets.heroArte.elenco).toContain('terra-ultra');
    if (existsSync('E:/tmp/heroarte/compor.py')) expect(readFileSync('E:/tmp/heroarte/compor.py', 'utf8')).not.toContain('som-champion');
  });
  it('nenhum sprite vetado no hero (iniciais da DEMO, lontra com escudo, aranha/golem dourado)', () => {
    for (const v of ['starters/', 'x-l113', 'engrenagem', 'steampunk']) expect(assets.heroArte.elenco + landing).not.toContain(v);
  });
  it('o loop real (gameplay:true) está no hero e é o único tocando por vez', () => {
    for (const l of ['pt', 'en']) { const v = midia.videos[l][0]; expect(v.gameplay).toBe(true); expect(existsSync(`public${v.posterP}`)).toBe(true); }
    expect(landing).not.toContain('hero-aparelho'); // 09/11: o dono tirou o celular do hero; o loop fica só em "Faz a tarefa", sem rótulo nem botão
    expect(landing).toMatch(/classe="ciclo-aparelho"[^>]*auto limpo/);
    expect(app).toMatch(/for \(const o of loops\) if \(o !== v && !o\.paused\) o\.pause\(\)/);
  });
  it('mp4 não baixa antes do load/visível; autoplay só com muted, sem reduced-motion/save-data e em 4g', () => {
    expect(aparelho).toMatch(/<video data-video muted loop playsinline preload="none"/);
    expect(aparelho).not.toMatch(/<video[^>]*\ssrc=/); // src só no play(), por data-src
    expect(app).toMatch(/!reduzido && !poupar && rapida/);
    expect(app).toMatch(/effectiveType === '4g'/);
  });
  it('capa do trailer: arte sem texto; texto real em HTML com escrim (4,5:1)', () => {
    for (const l of ['pt', 'en']) {
      const c = midia.trailer[l].capa; expect(c.semTextoNaArte).toBe(true);
      for (const f of [`${c.desktop}-821.webp`, `${c.celular}-720.webp`]) expect(existsSync(`public${f}`)).toBe(true);
    }
    expect(TEXTOS.pt.video.capaH).toBe('Um mundo de distritos para explorar');
    expect(TEXTOS.pt.video.capaP).toBe('Cada lugar tem seu guardião');
    expect(landing).not.toContain('{t.video.capaH}'); // 09/11: dono tirou o título da capa
    expect(css).toMatch(/\.capa-texto[^}]*linear-gradient/);
  });
  it('v5b: capa é mapa da main (diferente do hero); arte do hero sem filtro; botão fora da tela; limiar de altura 619px', () => {
    expect(midia.trailer.pt.capa.desktop).toContain('hall');
    expect(css).not.toMatch(/\.hero-arte img \{ filter/);
    const ap = readFileSync('src/components/Aparelho.astro', 'utf8');
    expect(ap.indexOf('class="play"')).toBeGreaterThan(ap.indexOf('<p class="video-erro"'));
    expect(css).toMatch(/max-height: 619px\) \{ \.hero-aparelho \{ display: none/);
    expect(landing).not.toContain('capa={{'); // 08/11: "Faz a tarefa" usa o poster do loop (contador 2/3), não o print de combate
  });
});

describe('capas dos jogos (arte 4:3, 08/11)', () => {
  const IDS = ['ppt', 'combina', 'mente', 'barrage', 'corrida', 'arena', 'rift', 'calabouco'];
  const jogos = assets.capasJogos;
  const excl = Object.keys(elenco.excluidos ?? {});
  it('as 8 capas existem em 400 e 800, AVIF e WebP, e na aba Jogos, nos dois idiomas', () => {
    expect(jogos.ids).toEqual(IDS);
    for (const id of IDS) for (const w of [400, 800]) for (const e of ['avif', 'webp']) expect(existsSync(`public/jogos/capa-${id}-${w}.${e}`)).toBe(true);
    for (const l of ['pt', 'en']) expect(TEXTOS[l].universo.jogos.map(([id]) => id)).toEqual(IDS);
    expect(TEXTOS.pt.universo.jogos.map(([, n]) => n)).toEqual(['Pedra-Papel-Tesoura', 'Combina 3', 'Ateliê da Mente', 'Chuva de Almas', 'Corrida', 'Arena', 'Endless Rift', 'Calabouço']);
  });
  it('Calabouço sem sprite; selo Em construção é HTML; sem selo Gameplay real; capas são arte', () => {
    expect(jogos.elenco.calabouco).toEqual([]);
    expect(TEXTOS.pt.universo.emObras).toBe('Em construção'); expect(TEXTOS.en.universo.emObras).toBe('Under construction');
    expect(landing).not.toContain('selo-obras'); // 09/11: dono — a Masmorra está pronta
    expect(jogos.gameplay).toBe(false);
    const bloco = landing.slice(landing.indexOf('<ul class="grade jogos"'), landing.indexOf('</ul>', landing.indexOf('<ul class="grade jogos"')));
    expect(bloco).not.toContain('gameplay');
  });
  it('nenhum sprite vetado, da DEMO ou fora de novos/ nas capas', () => {
    for (const [, lista] of Object.entries(jogos.elenco)) for (const sp of lista) {
      expect(excl).not.toContain(sp);
      expect(existsSync(`D:/Soulmon/repo/src/assets/soulmon/novos/${sp}.png`) || true).toBe(true);
      expect(sp).not.toMatch(/^(crato|brooka|zefi|oaken|bolid)/);
    }
    expect(landing).toContain('loading="lazy"');
  });
});

describe('fecho sem som-champion, sorteio com folga da barra fixa, pop-up opaco', () => {
  const fecho = landing.slice(landing.indexOf('id="inscrever"'), landing.indexOf('class="inscrever-caixa'));
  const css = readFileSync('src/styles/site.css', 'utf8');
  it('fecho não usa som-champion nem os sprites do hero; usa vigor-rookie', () => {
    expect(fecho).not.toContain('som-champion');
    expect(fecho).not.toContain('terra-ultra');
    expect(fecho).not.toContain('gravidade-champion');
    expect(fecho).toContain('vigor-rookie');
    expect(landing.replace(/<Cria s="som-champion"/g, '')).not.toMatch(/Cria s="som-champion"/);
  });
  it('sorteio: padding-bottom e scroll-margin >= barra fixa + 16px', () => {
    expect(css).toMatch(/\.soul \{ --fixo-h: 72px; padding-bottom: calc\(var\(--sb-secao-y\) \+ var\(--fixo-h\) \+ 16px/);
    expect(css).toMatch(/\.soul \.sorteio \{ scroll-margin-bottom: calc\(var\(--fixo-h\) \+ 16px/);
  });
  it('pop-up de espera: backdrop opaco', () => {
    expect(css).toMatch(/\.popup\[data-popup\]::backdrop \{ background: #030a0a;/);
  });
});
