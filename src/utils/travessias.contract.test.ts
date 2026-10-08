/**
 * CONTRATO DAS TRAVESSIAS (Crossings) e do PASSEIO — decisão do dono de
 * 30/09/2026 (`REGISTRO-DE-DECISOES.md` §5.6) com as condições dos pareceres:
 * `docs/reviews/2026-09-30-missoes/01..04` e `2026-09-30-exploracao/01`.
 *
 *  (a) catálogo: 8 regiões, casa sem desafios, as outras com exatamente 3 de
 *      áreas distintas, todos com versão pequena e `minAge: 13`; nenhuma
 *      contagem, prazo ou prêmio no texto; nada que o parecer de menores e
 *      marca veta (04 R-2, R-3, R-5, R-6, R-8); ids únicos e sem colisão com
 *      a Aventura comum;
 *  (b) o NÚCLEO não lê Travessia (meta, HP, `perfectDays`, evolução, Vínculo,
 *      missões, conquistas, moedas) — R-27/R-37;
 *  (c) nada fora do app fala de Travessia/Passeio (push, widget, overlay,
 *      Android) — R-38 da linha vermelha, R-1 do Passeio;
 *  (d) o desafio não tem campo que diferencie a versão pequena da plena
 *      (psicologia R-4) nem campo de prêmio; o save só guarda ids/enum/dia
 *      (04 R-4);
 *  (e) a folha do Passeio não mostra "N de M", percentual, "unlock" nem a
 *      palavra "desafio"/"challenge" (04 R-5), e mostra a linha de segurança.
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { createElement } from 'react';
import { REGIONS } from '../data/travessiasCatalog';
import { ADVENTURE_CATALOG } from './adventure';
import { CROSSINGS_EMPTY, HOME_REGION, type CrossingsState } from '../types/travessias';
import { PasseioSheet } from '../components/play/PasseioSheet';
import { dailyOffer, markDone, pickCrossing, pickMission, setDestination } from './travessias';

const RAIZ = resolve(__dirname, '../..');
const ler = (rel: string) => readFileSync(join(RAIZ, rel), 'utf8');

const FORA = REGIONS.filter(r => r.id !== HOME_REGION);
const TODOS_DESAFIOS = FORA.flatMap(r => r.challenges);
const textosDoDesafio = (c: (typeof TODOS_DESAFIOS)[number]) => [c.textEn, c.textPt, c.smallEn, c.smallPt];

describe('(a) o catálogo', () => {
  it('8 regiões; casa sem desafios; as outras com exatamente 3, de áreas distintas', () => {
    expect(REGIONS).toHaveLength(8);
    expect(new Set(REGIONS.map(r => r.id)).size).toBe(8);
    const casa = REGIONS.find(r => r.id === HOME_REGION)!;
    expect(casa.challenges).toHaveLength(0);
    for (const r of FORA) {
      expect(r.challenges, r.id).toHaveLength(3);
      expect(new Set(r.challenges.map(c => c.area)).size, r.id).toBe(3);
      expect(r.finds.length, r.id).toBeGreaterThanOrEqual(4);
      expect(r.finds.length, r.id).toBeLessThanOrEqual(6);
    }
  });

  it('todo desafio tem versão pequena nos dois idiomas e minAge 13 (04 R-1)', () => {
    for (const c of TODOS_DESAFIOS) {
      for (const t of textosDoDesafio(c)) expect(t.trim().length, c.id).toBeGreaterThan(0);
      expect(c.minAge, c.id).toBe(13);
    }
  });

  it('nenhum texto de desafio conta tarefa, marca prazo ou anuncia prêmio (R-31, M5)', () => {
    const PROIBIDO = /\b(tasks?|tarefas?|streak|sequ[êe]ncia|until|at[ée] dia|deadline|prazo|unlock\w*|desbloque\w*|rewards?|recompensa\w*|pr[êe]mio\w*|bits|xp)\b|\d+\s*(vezes|times|dias|days)\b/i;
    for (const c of TODOS_DESAFIOS) {
      for (const t of textosDoDesafio(c)) expect(t, c.id).not.toMatch(PROIBIDO);
    }
  });

  it('nada do que o parecer de menores e marca veta (04 R-2, R-3, R-5, R-6, R-8), em EN e PT, pleno e pequeno', () => {
    const VETOS: Array<[string, RegExp]> = [
      ['R-2 contato com desconhecido', /desconhecid|estranh|stranger|someone new|algu[ée]m novo|conhecer (gente|algu[ée]m|pessoas)|\bmeet(ing)?( up)?\b|encontr(ar|o) (com|algu[ée]m)|\bgrupo\b|\bgroup\b|online friend|amigo virtual|servidor|\bserver\b|f[óo]rum|dating|namoro/i],
      ['R-3 lugar isolado, água, altura, noite', /trilha|\btrails?\b|\bmata\b|\bwoods\b|\brio\b|\brivers?\b|\blagos?\b|\blakes?\b|praia|\bbeach|\bmar\b|\bsea\b|\bswim|nadar|telhado|rooftop|\bclimb|escalar|\baltura\b|abandonad|abandoned|escondid|\bhidden\b|\bsecret|secret[oa]|\bnight\b|\bnoite\b|anoitecer|\bdusk\b|go alone|by yourself to/i],
      ['R-5 postar, filmar, compartilhar', /\bpost(ar|ing)?\b|publicar|\bshare|compartilh|\bfilm|filmar|record yourself|selfie|\bstor(y|ies)\b|hashtag|#/i],
      ['R-6 marca ou plataforma', /\b(TED|YouTube|TikTok|Instagram|Facebook|WhatsApp|Discord|Duolingo|Spotify|Netflix|Pok[ée]mon|Digimon|Tamagotchi|Finch|Habitica)\b/i],
      ['R-8 conteúdo proibido', /[áa]lcool|alcohol|cerveja|\bbeer|\bwine\b|vinho|tabac|tobacco|\bvape|drogas?|\bdrugs?\b|rem[ée]dio|medicine|\bcrush\b|flert|flirt|dinheiro|\bmoney\b|comprar|\bbuy\b|apost|\bbet\b|dirigir|\bdrive\b|jejum|\bfast(ing)?\b|dieta|\bdiet\b|\bpeso\b|\bweight\b|calori|fritura|deep[- ]fr|flamb|escondido dos pais|sem contar a ningu[ée]m|without telling/i],
      ['04 R-5 a palavra da camada', /desafio|challenge/i],
    ];
    for (const c of TODOS_DESAFIOS) {
      for (const t of textosDoDesafio(c)) {
        for (const [regra, re] of VETOS) expect(t, `${c.id} · ${regra}`).not.toMatch(re);
      }
    }
  });

  it('ids únicos em todo o catálogo, com prefixo trv-, e sem colisão com a Aventura comum', () => {
    const ids = [
      ...TODOS_DESAFIOS.map(c => c.id),
      ...REGIONS.flatMap(r => [r.arrival.id, ...r.finds.map(f => f.id)]),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^trv-/);
    const comuns = new Set(ADVENTURE_CATALOG.map(a => a.id));
    for (const id of ids) expect(comuns.has(id), id).toBe(false);
  });
});

describe('(b) o núcleo não lê Travessia (R-27, R-37)', () => {
  const NUCLEO = [
    'src/utils/dailyReset.ts', 'src/hooks/useDailyReset.ts', 'src/utils/careRules.ts', 'src/utils/careUpdaters.ts',
    'src/utils/bond.ts', 'src/utils/weeklyMissions.ts', 'src/utils/missions.ts', 'src/utils/achievements.ts',
    'src/types/progression.ts', 'src/utils/currencies.ts', 'src/utils/poopDrain.ts', 'src/utils/adventure.ts',
  ];
  it.each(NUCLEO)('%s não importa nem menciona o estado das Travessias', rel => {
    expect(existsSync(join(RAIZ, rel)), `${rel} sumiu — atualize a lista`).toBe(true);
    const src = ler(rel);
    expect(src).not.toMatch(/from\s+['"][^'"]*travessias[^'"]*['"]/);
    // adventure.ts cita a exceção da regra 4 no cabeçalho, mas não lê o estado.
    expect(src).not.toMatch(/\bcrossings\b|CrossingsState/);
  });
});

describe('(c) nada fora do app fala de Travessia ou Passeio (R-38, Passeio R-1)', () => {
  const MENCAO = /\btravessia|\bcrossings?\b|\bpasseio|\bstroll/i;
  const PULAR = new Set(['node_modules', 'build', 'dist', '.gradle', 'release', 'out', 'generated', 'intermediates']);
  const TEXTO = /\.(ts|tsx|js|mjs|cjs|kt|java|xml|json|html|toml)$/;
  function varrer(dir: string, acc: string[] = []): string[] {
    const abs = join(RAIZ, dir);
    if (!existsSync(abs)) return acc;
    for (const nome of readdirSync(abs)) {
      if (PULAR.has(nome)) continue;
      const rel = join(dir, nome);
      const st = statSync(join(RAIZ, rel));
      if (st.isDirectory()) varrer(rel, acc);
      else if (TEXTO.test(nome) && st.size < 2_000_000) acc.push(rel);
    }
    return acc;
  }
  const ARQUIVOS = [
    ...varrer('functions'), ...varrer('workers'), ...varrer('desktop'), ...varrer('android/app/src'),
    ...varrer('src/plugins'), 'src/components/NotificationManager.tsx',
  ];

  it('a varredura acha arquivos (senão ela passaria sem olhar nada)', () => {
    expect(ARQUIVOS.length).toBeGreaterThan(20);
  });

  it('push, widget, overlay e Android não citam Travessia nem Passeio', () => {
    const achados = ARQUIVOS.filter(rel => MENCAO.test(ler(rel)));
    expect(achados).toEqual([]);
  });
});

describe('(d) o formato: nada distingue a versão pequena, nada paga, o save só guarda id/enum/dia', () => {
  const TIPOS = ler('src/types/travessias.ts');
  const corpo = (nome: string) => {
    const i = TIPOS.indexOf(`export interface ${nome}`);
    expect(i, nome).toBeGreaterThan(-1);
    return TIPOS.slice(TIPOS.indexOf('{', i) + 1, TIPOS.indexOf('\n}', i));
  };
  const campos = (bloco: string) => [...bloco.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/^\s*(\w+)\??:/gm)].map(m => m[1]);

  it('CrossingChallenge tem só id, área, textos (pleno/pequeno) e o piso de idade', () => {
    expect(campos(corpo('CrossingChallenge')).sort()).toEqual(
      ['area', 'id', 'minAge', 'smallEn', 'smallPt', 'textEn', 'textPt'].sort());
    for (const c of TODOS_DESAFIOS) {
      expect(Object.keys(c).sort(), c.id).toEqual(['area', 'id', 'minAge', 'smallEn', 'smallPt', 'textEn', 'textPt'].sort());
    }
  });

  it('nenhum tipo das Travessias tem campo de prêmio, peso, bônus ou multiplicador', () => {
    const semComentarios = TIPOS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(semComentarios).not.toMatch(/\b(reward|recompensa|prize|bonus|b[ôo]nus|weight|peso|multiplier|xp|bits|emblems?)\s*\??:/i);
  });

  it('CrossingsState guarda só regiões, id do desafio, dias, o total de Marcos e o interruptor (04 R-4)', () => {
    // 04/10/2026 (missões diárias): + pickDay (dia da escolha), score (Marcos de Aventura, pedido do dono)
    // e trip (dia + região da viagem da noite). Nenhum texto livre.
    // Rodada 7 (M4, M6): + pickAt (instante da escolha, a janela de 24 h) e log (o registro: dia + região + id).
    // 07/10/2026: + claimDay (o dia do recibo da linha "Take a stroll" do menu; só um dia).
    const CAMPOS = ['active', 'claimDay', 'destination', 'doneDay', 'hidden', 'log', 'opened', 'pending', 'pickAt', 'pickDay', 'score', 'trip'].sort();
    expect(campos(corpo('CrossingsState')).sort()).toEqual(CAMPOS);
    expect(Object.keys(CROSSINGS_EMPTY).sort()).toEqual(CAMPOS);
  });
});

describe('(e) a folha do Passeio', () => {
  const R1 = FORA[0];
  const R2 = FORA[1];
  const HOJE = '2026-10-02';
  const M = dailyOffer(HOJE, '')[0];
  const escolhida = pickMission(CROSSINGS_EMPTY, HOJE, '', M.region.id, M.challenge.id);
  const estados: Array<[string, CrossingsState]> = [
    ['vazio (as três do dia)', CROSSINGS_EMPTY],
    ['ativa', escolhida],
    ['pendentes', markDone(pickCrossing(markDone(pickCrossing(CROSSINGS_EMPTY, R1.id, R1.challenges[0].id, '2026-09-30'), '2026-09-30'), R2.id, R2.challenges[1].id, '2026-10-01'), '2026-10-01')],
    ['ativa feita hoje', markDone(escolhida, HOJE)],
    ['ativa em região aberta', { ...escolhida, opened: [{ region: M.region.id, day: '2026-09-01' }] }],
    ['aberta + destino', setDestination({ ...CROSSINGS_EMPTY, opened: [{ region: R1.id, day: '2026-09-01' }] }, R1.id)],
    ['escondida', { ...CROSSINGS_EMPTY, hidden: true }],
  ];
  const PROIBIDO_NA_TELA: Array<[string, RegExp]> = [
    ['contagem', /\d+\s*(of|de)\s*\d+/i],
    ['percentual', /%/],
    ['unlock', /unlock|desbloque/i],
    ['a palavra da camada', /challenge|desafio/i],
    // Rodada 7 (M4): a missão escolhida vale 24 h e a folha diz quantas horas restam ("Vale por mais 18 h"),
    // mas nunca a palavra de cobrança nem uma data-limite.
    ['prazo', /deadline|prazo|expira|expires|until|at[ée] (dia|domingo|amanh)/i],
    ['prêmio', /reward|recompensa|pr[êe]mio|\bbits\b|\bxp\b|emblem/i],
  ];

  for (const language of ['en-US', 'pt-BR'] as const) {
    for (const [nome, crossings] of estados) {
      it(`${language} · ${nome}: sem contagem, percentual, unlock, prazo, prêmio nem "desafio"`, () => {
        const { container } = render(createElement(PasseioSheet, { language, crossings, onChange: () => {}, todayKey: HOJE }));
        let texto = container.textContent ?? '';
        // H12 (01/10/2026): as propostas são cards FECHADOS — abre um por um para varrer o texto de dentro.
        for (const abrir of Array.from(container.querySelectorAll<HTMLButtonElement>('[data-travessia-abrir]'))) {
          fireEvent.click(abrir);
          texto += container.textContent ?? '';
        }
        for (const [regra, re] of PROIBIDO_NA_TELA) expect(texto, regra).not.toMatch(re);
        // Rodada 7 (M7): a camada não se esconde mais — nem o `hidden` de um save antigo a apaga.
        expect(container.querySelector('[data-travessias-mostrar]')).toBeNull();
        expect(container.querySelector('[data-travessias-esconder]')).toBeNull();
        const seguranca = container.querySelector('[data-travessias-seguranca]');
        expect(seguranca?.textContent ?? '').toMatch(language === 'pt-BR' ? /seguro/ : /safe/);
        cleanup();
      });
    }
  }
});
