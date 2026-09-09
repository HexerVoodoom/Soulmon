/**
 * O GATE DE LOUDNESS COMO TESTE DE VERDADE — run `som-01`, Fase 2, fatia 2.
 *
 * ## O que veio, e o que ficou para trás
 *
 * Na Fase 1 o gate era `squad-alpha-runs/som-01/prototyper/gate-loudness.mjs`:
 * rodava o grafo no **Chrome real por CDP** e media LUFS/dBTP da saída. **Esse
 * arnês NÃO foi promovido**, de propósito e por escrito — ele flaka (1 falha em
 * 11, não diagnosticada) e depende de Chrome instalado na máquina. Um portão
 * que precisa de navegador é um portão que alguém desliga na primeira
 * madrugada, e um portão intermitente ensina o time a reexecutar em vez de
 * ler. A medição por motor real continua existindo, no run, como ferramenta de
 * calibração — não como portão de commit.
 *
 * O que veio é o que é **determinístico e roda em Node**: a política
 * (`utils/loudness.ts`), a calibração, e as assertivas que não precisam de
 * motor nenhum.
 *
 * ## As três assertivas
 *
 * - **AC-4 / cobertura.** Todo `play*` exportado tem categoria, alvo e linha de
 *   calibração. A amostra vem do **FONTE** de `sounds.ts`, não de uma lista
 *   digitada — precedente: `src/plugins/widgetSemCobranca.contract.test.ts`, que
 *   lê o fonte Kotlin pelo mesmo motivo (nenhum teste em Node alcança aquele
 *   runtime; aqui, nenhuma lista à mão alcança o que alguém acrescentar amanhã).
 *   Uma cobertura auto-declarada é exatamente o verde vazio que o AC-4 existe
 *   para impedir.
 * - **AC-5.** `|offset| > 20 dB` reprova: *"não é calibração, é fonte errada"*.
 *   O número tem origem medida — a forma de 180 ms do `playVisorTune` pedia
 *   **+36 dB**, e o conserto não era o ganho, era o envelope e a duração.
 * - **A escada.** Nenhuma categoria acima do teto S3, ordem preservada, e todo
 *   degrau múltiplo de 3,0 dB (que é derivado, §3.2 item 3 — por isso não pode
 *   aparecer um meio-degrau inventado por conveniência de um som só).
 *
 * ## Dono único
 *
 * Este arquivo **não redeclara número nenhum**: todo valor é importado de
 * `utils/loudness.ts`. Duas fontes da verdade sobre loudness é o footgun 9 do
 * `CLAUDE.md` aplicado ao som — a última assertiva daqui varre os dois módulos
 * de produção atrás de um alvo da escada escrito à mão.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALVO_LUFS_M,
  ALVO_TRILHA_LUFS_S,
  CATEGORIA_DO_SOM,
  DEGRAU_DB,
  OFFSET_MAX_DB,
  OFFSET_POR_SOM_DB,
  ORDEM_DA_ESCADA,
  TETO_DBTP,
  TETO_LUFS_INTEGRADO,
  TOLERANCIA_LU,
  db2lin,
  rotuloCategoria,
} from './loudness';
import type { CategoriaSom } from './loudness';

const FONTE_SOUNDS = join(__dirname, 'sounds.ts');
const FONTE_BUS = join(__dirname, 'audioBus.ts');

/** A amostra vem do FONTE de produção, nunca de uma lista digitada (AC-4). */
function playsExportados(): string[] {
  const src = readFileSync(FONTE_SOUNDS, 'utf-8');
  return [...src.matchAll(/^export function (play\w+)/gm)].map(m => m[1]);
}

/* ── AC-4 · cobertura ────────────────────────────────────────────────────── */

describe('AC-4 — todo `play*` exportado tem categoria, alvo e calibração', () => {
  const doFonte = playsExportados();

  it('a varredura enxerga o fonte (o teste não pode passar por amostra vazia)', () => {
    expect(
      doFonte.length,
      'nenhum `export function play*` encontrado em sounds.ts: amostra vazia deixa TODA assertiva abaixo verde por vacuidade',
    ).toBeGreaterThan(0);
  });

  it.each(doFonte)('%s tem categoria em `CATEGORIA_DO_SOM`', nome => {
    expect(
      CATEGORIA_DO_SOM[nome],
      `${nome} é exportado por sounds.ts e não está no mapa de categorias: som de produção que nenhuma medição alcança`,
    ).toBeDefined();
  });

  it.each(doFonte)('%s cai numa categoria que tem alvo na escada', nome => {
    const cat = CATEGORIA_DO_SOM[nome];
    expect(
      ALVO_LUFS_M[cat],
      `${nome} está na categoria '${cat}', que não tem alvo em ALVO_LUFS_M`,
    ).toBeTypeOf('number');
  });

  it.each(doFonte)('%s tem linha de calibração', nome => {
    expect(
      OFFSET_POR_SOM_DB[nome],
      `${nome} não tem offset medido: entraria no grafo com 0 dB, ou seja, NÃO foi medido`,
    ).toBeTypeOf('number');
  });

  it('o mapa não descreve fantasma: nenhuma entrada sem `play*` correspondente no fonte', () => {
    const vivos = new Set(doFonte);
    for (const nome of Object.keys(CATEGORIA_DO_SOM)) {
      expect(
        vivos.has(nome),
        `${nome} tem categoria e alvo mas não existe mais em sounds.ts — a política mede um fantasma (foi o que aconteceu com playPoopClean e playMenuOpen no corte da Fase 0)`,
      ).toBe(true);
    }
    for (const nome of Object.keys(OFFSET_POR_SOM_DB)) {
      expect(vivos.has(nome), `${nome} tem calibração e não existe mais no fonte`).toBe(true);
    }
  });
});

/* ── AC-5 · plausibilidade da calibração ─────────────────────────────────── */

describe('AC-5 — |offset| > 20 dB não é calibração, é fonte errada', () => {
  const linhas = Object.entries(OFFSET_POR_SOM_DB);

  it('a calibração não está vazia', () => {
    expect(linhas.length, 'calibração sem offset nenhum: amostra vazia').toBeGreaterThan(0);
  });

  it.each(linhas)('%s: |%d| dB está dentro do limite de plausibilidade', (nome, db) => {
    expect(
      Math.abs(db),
      `${nome} pede ${db} dB. Acima de ${OFFSET_MAX_DB} dB o problema é a FONTE, não o ganho — foi assim que a forma de 180 ms do playVisorTune pediu +36 dB e o conserto acabou sendo o envelope`,
    ).toBeLessThanOrEqual(OFFSET_MAX_DB);
  });
});

/* ── A escada ────────────────────────────────────────────────────────────── */

describe('a escada: teto S3, ordem e degrau derivado', () => {
  it('nenhuma categoria fica acima do teto S3', () => {
    for (const cat of ORDEM_DA_ESCADA) {
      expect(
        ALVO_LUFS_M[cat],
        `'${cat}' está em ${ALVO_LUFS_M[cat]} LUFS-M, ACIMA do teto S3 (${TETO_LUFS_INTEGRADO}) — a escada inteira é derivada do topo`,
      ).toBeLessThanOrEqual(TETO_LUFS_INTEGRADO);
    }
  });

  it('a ordem é preservada: quem repete mais nunca fica mais alto que quem repete menos', () => {
    for (let i = 1; i < ORDEM_DA_ESCADA.length; i++) {
      const acima = ORDEM_DA_ESCADA[i - 1];
      const abaixo = ORDEM_DA_ESCADA[i];
      expect(
        ALVO_LUFS_M[abaixo],
        `'${abaixo}' (${ALVO_LUFS_M[abaixo]}) ficou ACIMA de '${acima}' (${ALVO_LUFS_M[acima]}): o critério da escada é REPETIÇÃO, não importância`,
      ).toBeLessThanOrEqual(ALVO_LUFS_M[acima]);
    }
  });

  it('não existe meio-degrau: toda distância ao topo é múltipla de 3,0 dB', () => {
    const topo = ALVO_LUFS_M[ORDEM_DA_ESCADA[0]];
    for (const cat of ORDEM_DA_ESCADA) {
      const passos = (topo - ALVO_LUFS_M[cat]) / DEGRAU_DB;
      expect(
        Math.abs(passos - Math.round(passos)),
        `'${cat}' está a ${topo - ALVO_LUFS_M[cat]} dB do topo, que não é múltiplo de ${DEGRAU_DB} — meio-degrau é degrau novo aberto por conveniência de um som só (foi a tentação recusada em §3.1-ter)`,
      ).toBeLessThan(1e-9);
    }
  });

  it('a escada cobre todas as categorias declaradas, sem sobra nem falta', () => {
    expect([...ORDEM_DA_ESCADA].sort()).toEqual(Object.keys(ALVO_LUFS_M).sort());
  });

  it('a trilha fica ABAIXO do último degrau de SFX: ela é contínua e não pode disputar', () => {
    const piso = ALVO_LUFS_M[ORDEM_DA_ESCADA[ORDEM_DA_ESCADA.length - 1]];
    expect(ALVO_TRILHA_LUFS_S).toBeLessThan(piso);
  });

  it('o teto de true peak é o do S3, e a tolerância é a do §3.4', () => {
    expect(TETO_DBTP).toBe(-1.0);
    expect(TOLERANCIA_LU).toBe(1.0);
  });

  it('`db2lin` é a conversão de verdade (0 dB = 1, −6 dB ≈ 0,5)', () => {
    expect(db2lin(0)).toBeCloseTo(1, 12);
    expect(db2lin(-6.0206)).toBeCloseTo(0.5, 4);
  });
});

/* ── Dono único: nenhum número da escada escrito à mão fora daqui ────────── */

describe('footgun 9: a política não é copiada em lugar nenhum', () => {
  const alvos = [...new Set(Object.values(ALVO_LUFS_M)), ALVO_TRILHA_LUFS_S];

  it.each([['sounds.ts', FONTE_SOUNDS], ['audioBus.ts', FONTE_BUS]])(
    '%s não redeclara alvo da escada',
    (nome, caminho) => {
      // Só o CÓDIGO: os comentários citam os números de propósito, e é assim
      // que a decisão fica legível ao lado do que ela governa.
      const codigo = readFileSync(caminho, 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      for (const alvo of alvos) {
        expect(
          new RegExp(`(?<![\\w.])${String(alvo).replace('.', '\\.')}(?![\\d])`).test(codigo),
          `${nome} escreve ${alvo} no código: alvo de loudness tem UM dono (utils/loudness.ts). Duas fontes da verdade sobre loudness é o footgun 9 — importe em vez de repetir`,
        ).toBe(false);
      }
    },
  );

  it('`sounds.ts` importa a categoria da política, em vez de decidir sozinho', () => {
    const src = readFileSync(FONTE_SOUNDS, 'utf-8');
    expect(
      /import\s*\{[^}]*CATEGORIA_DO_SOM[^}]*\}\s*from\s*'\.\/loudness'/.test(src),
      'sounds.ts deixou de importar CATEGORIA_DO_SOM: se ele voltar a escolher a categoria inline, a cobertura do AC-4 vira auto-declaração',
    ).toBe(true);
  });
});

/* ── Superfície: PT-BR e EN, sempre os dois ──────────────────────────────── */

describe('rótulos das categorias existem nos dois idiomas', () => {
  it.each(ORDEM_DA_ESCADA)('%s tem rótulo PT-BR e EN, e eles não são a mesma string', cat => {
    const pt = rotuloCategoria(cat as CategoriaSom, 'pt-BR');
    const en = rotuloCategoria(cat as CategoriaSom, 'en');
    expect(pt.length, `'${cat}' sem rótulo PT-BR`).toBeGreaterThan(0);
    expect(en.length, `'${cat}' sem rótulo EN`).toBeGreaterThan(0);
  });

  it('nenhuma categoria fica só em português', () => {
    // O `CLAUDE.md` é explícito: texto de UI nasce em inglês e o par PT-BR vem
    // junto. String só em PT já chegou a produção (aria-labels, push das 22h).
    const semEn = ORDEM_DA_ESCADA.filter(
      c => rotuloCategoria(c as CategoriaSom, 'en') === rotuloCategoria(c as CategoriaSom, 'pt-BR'),
    );
    expect(semEn, `categorias com rótulo idêntico nos dois idiomas: ${semEn.join(', ')}`).toEqual([]);
  });
});
