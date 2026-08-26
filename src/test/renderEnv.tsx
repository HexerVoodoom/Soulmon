/**
 * Ambiente de RENDER para os testes de componente.
 *
 * Por que este arquivo existe (rodada 2 do sweeper):
 * `vitest.config.ts` fixa `environment: 'node'` — durante toda a vida do projeto
 * **nenhum teste montou um componente**. O checkbox de 2px em produção não foi um
 * teste que falhou em pegar o bug: a suíte era estruturalmente incapaz de vê-lo,
 * porque o defeito não vivia no JSX nem no CSS isoladamente, e sim na FRONTEIRA
 * entre os dois (classe utilitária usada no JSX que não existe no CSS
 * pré-compilado — footgun 1).
 *
 * A contramedida é montar o componente COM o `index.css` real dentro do
 * documento e medir o estilo COMPUTADO. Não é layout de navegador — jsdom não
 * faz layout, `getBoundingClientRect()` sempre devolve 0 —, mas resolve a
 * cascata, que é exatamente onde a fronteira JSX↔CSS quebra.
 *
 * ## Duas limitações que precisam estar escritas, não descobertas depois
 *
 * 1. **jsdom ignora blocos `@layer`.** Medido: `.shrink-0` (que vive em
 *    `@layer utilities`) computa `flex-shrink: 1` com o CSS cru injetado. Por
 *    isso `loadAppCss()` **desembrulha** os `@layer X { … }`, deixando as regras
 *    no nível superior. Isso muda a PRECEDÊNCIA (regra em layer perde para regra
 *    sem layer no navegador; aqui passam a competir por ordem de origem), então
 *    este ambiente responde bem a "esta classe declara este valor?" e mal a
 *    "qual regra ganha entre duas concorrentes". Os testes escritos aqui só
 *    fazem a primeira pergunta.
 * 2. **Sem layout.** Alvo de toque é verificado pelo `width`/`height`
 *    computado (que é o que a regra declara), não por caixa medida na tela.
 *
 * Os casos de autoverificação em `renderEnv.selfcheck.test.tsx` provam que o
 * ambiente ENXERGA: uma classe presente devolve o valor declarado e uma classe
 * ausente (`w-7`, a do bug real) devolve vazio. Guard sem autoverificação passa
 * sempre — pelo motivo errado.
 */
import fs from 'node:fs';
import path from 'node:path';
import { render as rtlRender, cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import type { ReactElement } from 'react';
import { TEST_TIMEOUT_MS } from '../../vitest.budget.mjs';

// ---------------------------------------------------------------------------
// O SEGUNDO TETO — o que o `testTimeout` do `vitest.config.ts` NÃO governa.
//
// Achado medido em 26/08/2026, na 5ª rodada do passe de orçamento
// (`scripts/orcamento-de-tempo.mjs`, baseline em
// `sweeper/orcamento-de-tempo.md`): sob contenção, `AccountDataSection.render
// .test.tsx > confirmar com o token executa e devolve uma despedida` falhou
// com "Unable to find an element with the text: /Obrigado pelo tempo/" —
// **não** com timeout de teste. A rodada inteira levou 63,5 s contra os 32 s
// habituais (transform 55 s contra 7,6 s), e o elemento aparecia depois.
//
// A causa é que `findBy*`/`waitFor` do testing-library têm orçamento PRÓPRIO,
// `asyncUtilTimeout`, cujo default é **1000 ms** e que ignora completamente o
// `testTimeout`. Ou seja: subir o teto global para 15 s comprou ZERO folga
// para toda espera assíncrona de render — o teto real desses casos continuou
// em 1 s, escondido, e é 15× mais apertado que o declarado. Duas réguas para
// a mesma pergunta é o footgun 9 do `CLAUDE.md`; aqui ele já cobrou.
//
// A fração (20%) é deliberada, e não "o mesmo valor do testTimeout": a espera
// tem de estourar ANTES do teste, senão a falha chega como um timeout opaco
// do runner em vez da mensagem do testing-library dizendo o que não achou na
// tela — que é a diferença entre diagnosticar em 1 minuto e em 1 hora.
//
// Por que isto não pode transformar verde em vermelho: `asyncUtilTimeout` só
// define até quando esperar. Mais paciência nunca reprova o que já passava;
// no máximo faz uma falha REAL demorar mais para aparecer, e ela continua
// aparecendo com a mesma mensagem.
configure({ asyncUtilTimeout: TEST_TIMEOUT_MS * 0.2 });

// Desmonta o que foi montado entre casos. Sem isto, dois `render()` no mesmo
// arquivo deixam dois checkboxes no documento e `getByRole` passa a falhar por
// ambiguidade — falha barulhenta, mas por motivo errado.
afterEach(() => { cleanup(); });

const CSS_PATH = path.resolve(process.cwd(), 'src/index.css');

let cached: string | null = null;

/** Lê o `index.css` real e desembrulha os `@layer` (ver nota 1 no topo). */
export function loadAppCss(): string {
  if (cached !== null) return cached;
  const raw = fs.readFileSync(CSS_PATH, 'utf8');
  if (raw.length < 10_000) {
    throw new Error(`index.css tem ${raw.length} bytes — pequeno demais para ser o CSS do app`);
  }
  cached = unwrapLayers(raw);
  return cached;
}

/**
 * Remove as chaves de `@layer nome { … }` mantendo o conteúdo.
 * `@layer a, b;` (declaração de ordem, sem bloco) é apagada.
 */
export function unwrapLayers(css: string): string {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf('@layer', i);
    if (at === -1) { out += css.slice(i); break; }
    out += css.slice(i, at);
    // acha o '{' ou ';' que fecha o prelúdio do @layer
    let j = at + 6;
    while (j < css.length && css[j] !== '{' && css[j] !== ';') j++;
    if (css[j] === ';') { i = j + 1; continue; }          // @layer a, b;
    // varre até a chave que fecha o bloco
    let depth = 1;
    let k = j + 1;
    while (k < css.length && depth > 0) {
      if (css[k] === '{') depth++;
      else if (css[k] === '}') depth--;
      k++;
    }
    out += css.slice(j + 1, k - 1);
    i = k;
  }
  return out;
}

/** Injeta o CSS do app no `document` atual (idempotente por documento). */
export function installAppCss(): void {
  if (document.getElementById('__soulmon_app_css')) return;
  const style = document.createElement('style');
  style.id = '__soulmon_app_css';
  style.textContent = loadAppCss();
  document.head.appendChild(style);
}

/**
 * FRONTEIRA node ↔ jsdom: a partir do Node 22 existe um `globalThis.localStorage`
 * experimental (o aviso `--localstorage-file was provided without a valid path`).
 * Ele já está definido quando o jsdom instala os globais, então o `localStorage`
 * NU que os componentes usam (`localStorage.getItem(...)`, sem `window.`) cai no
 * do Node — que lança `localStorage.getItem is not a function`. Medido em
 * `CompanionHUD.tsx:228`. Aqui forçamos o do jsdom.
 */
export function installDomGlobals(): void {
  if (typeof (globalThis as { localStorage?: Storage }).localStorage?.getItem === 'function') return;
  installFakeStorage();
}

/**
 * Instala um `localStorage` de mentira que o TESTE controla, SEMPRE — sem o
 * atalho de `installDomGlobals`, que devolve cedo quando já existe algum
 * storage funcional.
 *
 * Existe porque espionar a plataforma aqui não funciona, e a suíte levou meses
 * para perceber: neste ambiente `globalThis.localStorage` **não é** uma
 * instância do `Storage` do jsdom (medido: `constructor` indefinido,
 * `instanceof Storage === false` — é o `localStorage` experimental do Node 22,
 * o mesmo que emite o aviso `--localstorage-file`). Então
 * `vi.spyOn(Storage.prototype, 'setItem')` decorava uma classe que o objeto
 * real não herda: o método verdadeiro seguia intacto, o caminho de falha nunca
 * era exercitado, e 6 testes de resiliência ficavam vermelhos rotulados como
 * "falha de ambiente". Um teste que não consegue tocar no código que afirma
 * testar é pior que teste nenhum — ele ocupa o lugar dele.
 *
 * Devolve o objeto instalado para que o caso substitua `setItem`/`getItem` por
 * uma versão que lança, que é como a falha real do navegador chega.
 */
export function installFakeStorage(): Storage {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() { return store.size; },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    getItem: (k: string) => (store.has(String(k)) ? store.get(String(k))! : null),
    setItem: (k: string, v: string) => { store.set(String(k), String(v)); },
    removeItem: (k: string) => { store.delete(String(k)); },
    clear: () => { store.clear(); },
  };
  for (const target of [globalThis, globalThis.window].filter(Boolean)) {
    Object.defineProperty(target as object, 'localStorage', {
      value: storage, configurable: true, writable: true,
    });
  }
  return storage;
}

/** Monta um componente com o `index.css` real aplicado. */
export function renderWithCss(ui: ReactElement) {
  installDomGlobals();
  installAppCss();
  return rtlRender(ui);
}

/**
 * Valor computado de uma propriedade, já com o CSS do app instalado.
 * Devolve string vazia quando nada na cascata declara a propriedade — é assim
 * que uma classe fantasma se manifesta.
 */
export function computed(el: Element, prop: string): string {
  return window.getComputedStyle(el).getPropertyValue(prop).trim();
}

/**
 * Tamanho declarado (px) de um alvo de toque. Lê `width`/`height`; se o
 * elemento não declarar, cai em `min-width`/`min-height` (o padrão inline que o
 * projeto usa desde a correção dos 44px). `null` = nada declarado, que é
 * exatamente o estado do bug de 2px.
 */
export function declaredTargetSize(el: Element): { w: number | null; h: number | null } {
  const px = (v: string) => (/^-?[\d.]+px$/.test(v) ? parseFloat(v) : null);
  const cs = window.getComputedStyle(el);
  const inline = (el as HTMLElement).style;
  const pick = (a: string, b: string) =>
    px(inline.getPropertyValue(a) || cs.getPropertyValue(a)) ??
    px(inline.getPropertyValue(b) || cs.getPropertyValue(b));
  return { w: pick('width', 'min-width'), h: pick('height', 'min-height') };
}
