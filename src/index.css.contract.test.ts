import { describe, it, expect, beforeAll } from 'vitest';

// FOOTGUN 1, travado por teste em vez de por revisão visual.
//
// `src/index.css` é Tailwind v4 PRÉ-COMPILADO e é o único CSS empacotado — não
// há plugin do Tailwind no Vite, então NÃO existe geração de classe. Uma classe
// utilitária que não está no arquivo simplesmente não aplica nada, e falha em
// SILÊNCIO: nada quebra, nada avisa, o elemento só sai com o tamanho/estilo
// errado. Foi assim que `w-7`/`h-7` deixaram o checkbox de concluir tarefa —
// a ação central do app — renderizando com 2px.
//
// Esta verificação é mecânica, então não depende de alguém olhar a tela certa.
//
// Dois detalhes de encanamento, ambos por causa do portão `npx tsc --noEmit`:
//  · o JSX entra por `import.meta.glob(...?raw)`;
//  · o CSS **não** pode entrar assim — o vitest desliga o processamento de CSS
//    e `./index.css?raw` chega como string VAZIA, o que faria este teste passar
//    sempre, por motivo errado. Por isso o CSS é lido do disco. E é lido por
//    `import()` com especificador em variável porque o tsconfig do projeto
//    cobre só `src` e não carrega os tipos do Node: um `import fs from 'fs'`
//    literal quebraria o typecheck (TS2591).
//
// Os `it` do primeiro describe existem exatamente para provar que a leitura
// funcionou — sem eles, um guard mecânico vira decoração.

/**
 * Componentes que o app realmente renderiza.
 *
 * `components/ui/**` (shadcn) e `components/figma/**` ficam de fora: são
 * boilerplate herdado, só `ui/sonner` é importado por `App.tsx`, e travá-los
 * agora geraria ruído sem proteger nenhuma tela de verdade.
 */
const MODULOS = import.meta.glob('./**/*.{tsx,jsx}', {
  eager: true, query: '?raw', import: 'default',
}) as Record<string, string>;

const ARQUIVOS = Object.entries(MODULOS).filter(
  ([caminho]) => !caminho.includes('/ui/') && !caminho.includes('/figma/'),
);

let cssRaw = '';

beforeAll(async () => {
  // Especificador em variável de propósito: o TS não resolve o módulo (logo,
  // não exige @types/node) e o Vite não tenta empacotá-lo.
  const specFs = 'node:fs';
  const specUrl = 'node:url';
  const fs = await import(/* @vite-ignore */ specFs);
  const { fileURLToPath } = await import(/* @vite-ignore */ specUrl);
  const aqui = fileURLToPath(new URL('.', import.meta.url));
  cssRaw = fs.readFileSync(`${aqui}index.css`, 'utf8');
});

/** Toda classe que o CSS de fato define (desescapando `.w-\[44px\]`, `.top-1\/2`). */
function classesDefinidas(): Set<string> {
  const set = new Set<string>();
  const re = /\.((?:\\.|[A-Za-z0-9_/[\]().,%#:-])+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cssRaw))) set.add(m[1].replace(/\\/g, ''));
  return set;
}

interface Uso { classe: string; arquivo: string; linha: number }

function classesUsadas(): Uso[] {
  const usos: Uso[] = [];
  for (const [caminho, src] of ARQUIVOS) {
    const rel = caminho.replace(/^\.\//, 'src/');
    // Só literais estáticos. Interpolação (`${...}`) é ignorada de propósito:
    // não dá para resolver estaticamente, e um falso positivo aqui faria o
    // teste virar ruído — que é como um guard mecânico morre.
    const re = /class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const bruto = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '').replace(/\$\{[^}]*\}/g, ' ');
      const linha = src.slice(0, m.index).split('\n').length;
      for (const t of bruto.split(/\s+/)) {
        const classe = t.trim().replace(/^!/, '');
        if (!classe || /[{}$]/.test(classe)) continue;
        usos.push({ classe, arquivo: rel, linha });
      }
    }
  }
  return usos;
}

describe('o verificador enxerga os arquivos de verdade', () => {
  // Sem isto, um erro de regex faria o teste passar sempre por motivo errado —
  // o modo clássico de um guard mecânico virar decoração.
  it('leu o index.css do disco (não a string vazia do vitest)', () => {
    expect(cssRaw.length).toBeGreaterThan(100_000);
    expect(classesDefinidas().size).toBeGreaterThan(500);
  });

  it('reconhece classes que comprovadamente existem', () => {
    const def = classesDefinidas();
    for (const c of ['flex', 'items-center', 'w-full', 'text-center', 'p-4', 'rounded-lg']) {
      expect(def.has(c), `esperava ${c} definida no index.css`).toBe(true);
    }
  });

  it('reconhece a ausência do bug histórico (w-7/h-7 nunca foram compilados)', () => {
    const def = classesDefinidas();
    expect(def.has('w-7')).toBe(false);
    expect(def.has('h-7')).toBe(false);
  });

  it('encontra classes em uso nos componentes', () => {
    expect(ARQUIVOS.length).toBeGreaterThan(30);
    expect(classesUsadas().length).toBeGreaterThan(500);
  });
});

describe('[BUG] classes utilitárias usadas no JSX que não existem no index.css', () => {
  // Levantamento desta rodada: 130 ocorrências de 80 classes distintas em 15
  // componentes de produção. Nenhuma aplica nada. As de maior impacto:
  //
  //  · `flex-shrink-0` (15×) — nome do Tailwind v3; no v4 é `shrink-0`, que
  //    ESTÁ compilado. Todo ícone/avatar marcado assim pode ser espremido a
  //    zero num container apertado — o mesmo modo de falha do checkbox de 2px.
  //  · `gap-4`/`gap-5`/`gap-6` — o espaçamento entre checkbox e texto em
  //    TaskCard/ActivityCard/StatsPage colapsa para 0.
  //  · `max-h-[88vh]` (AISettingsModal) — `max-h-[80vh]` existe, `88vh` não:
  //    o modal cresce sem limite e o botão de salvar sai da tela.
  //  · `left-1/2` + `-translate-x-1/2` (CompanionHUD) — o balão de fala e a
  //    seta dele não centralizam (`top-1/2` existe, `left-1/2` não).
  //  · `disabled:opacity-50/60/40` (ChatBox, SettingsPage) — botão desabilitado
  //    fica idêntico ao habilitado: o usuário clica achando que funciona.
  //  · `break-all` (SettingsPage) — o saveId longo estoura o container.
  //
  // Correção: trocar pelo nome v4 equivalente, ou acrescentar a regra no fim do
  // `src/index.css`, ou (para layout crítico) `style={{}}` inline, como o
  // CLAUDE.md manda. Este teste passa a valer como trava permanente.
  it('nenhuma classe fantasma nos componentes de tela', () => {
    const def = classesDefinidas();
    const faltando = classesUsadas().filter(u => !def.has(u.classe));
    const relatorio = [...new Set(faltando.map(f => f.classe))]
      .sort()
      .map(c => `${c} → ${faltando.filter(f => f.classe === c).map(f => `${f.arquivo}:${f.linha}`).join(', ')}`)
      .join('\n');
    expect(relatorio, `classes usadas que não existem em src/index.css:\n${relatorio}`).toBe('');
  });

  it('flex-shrink-0 (v3) não é usado — o nome compilado é shrink-0 (v4)', () => {
    const def = classesDefinidas();
    expect(def.has('shrink-0')).toBe(true);
    expect(def.has('flex-shrink-0')).toBe(false);
    const usos = classesUsadas().filter(u => u.classe === 'flex-shrink-0');
    expect(usos.map(u => `${u.arquivo}:${u.linha}`)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RODADA 4 — trava mecânica da QUINA.
//
// O defeito que isto impede de voltar: toda peça do kit é `border: Npx solid`
// + `clip-path` de octógono, e o clip corta a borda nas quatro quinas. Sem a
// banda de 45° que fecha o chanfro, a moldura para a N px do canto — e ninguém
// vê isso em review, só em recorte ampliado de pixel.
//
// Duas coisas são verificadas, porque as duas já quebraram na prática:
//   1. toda classe com `clip-path: polygon(Npx 0, …)` está na regra das bandas;
//   2. o chanfro declarado na banda (`--sm-cham-c`) é o MESMO do `clip-path` —
//      se divergirem, a banda nasce fora da diagonal e fica um degrau.
// ─────────────────────────────────────────────────────────────────────────────
describe('a moldura chanfrada FECHA na quina', () => {
  /** `.classe` → chanfro em px declarado no `clip-path` daquela regra. */
  function chanfrosDeclarados(): Map<string, number> {
    const m = new Map<string, number>();
    // Uma regra por vez: seletor (uma classe simples) + corpo até o `clip-path`.
    const re = /\.([a-z0-9-]+)\s*\{([^}]*?)clip-path:\s*polygon\((\d+)px 0,/g;
    let x: RegExpExecArray | null;
    while ((x = re.exec(cssRaw))) {
      // O losango do `.sm-px-*` que não é octógono (polygon(50% 0, …)) não casa
      // com o regex — é o que se quer: ele não tem quina para fechar.
      m.set(x[1], Number(x[3]));
    }
    return m;
  }

  /** Seletores cobertos pela regra das bandas de quina. */
  function classesComBanda(): Set<string> {
    const bloco = cssRaw.slice(cssRaw.indexOf('RODADA 4 — A QUINA FECHA'));
    const i = bloco.indexOf('--sm-cham-c: 5px;');
    const seletores = bloco.slice(0, i);
    return new Set([...seletores.matchAll(/\.([a-z0-9-]+)[,\s]*\{?\s*$/gm)].map(m => m[1]));
  }

  /** `--sm-cham-c` efetivo por classe (o padrão da regra base é 5px). */
  function chanfrosDaBanda(): Map<string, number> {
    const m = new Map<string, number>();
    for (const c of classesComBanda()) m.set(c, 5);
    const re = /\.([a-z0-9-]+)\s*\{[^}]*?--sm-cham-c:\s*(\d+)px/g;
    let x: RegExpExecArray | null;
    while ((x = re.exec(cssRaw))) m.set(x[1], Number(x[2]));
    return m;
  }

  it('a regra das bandas existe e cobre o kit inteiro', () => {
    expect(cssRaw).toContain('RODADA 4 — A QUINA FECHA');
    // Eram > 15; `.sm-px-tree-plate`/`.sm-px-tree-degen` saíram em 20/09/2026
    // (canvas Evolução §24: a árvore virou cards SIS-03, sem chanfro), e
    // `.sm-px-pop`/`.sm-px-fab`/`.sm-px-chatbar`/`.sm-px-code` saíram na poda
    // das órfãs do canvas Loja (§26) — sem consumidor em TSX nenhum. O piso
    // existe só para provar que a varredura ENXERGA a lista, não para travar
    // o tamanho dela.
    expect(classesComBanda().size).toBeGreaterThan(8);
  });

  it('nenhuma peça chanfrada ficou sem banda de quina', () => {
    const comBanda = classesComBanda();
    // Peças sem moldura por direção do dono (sem borda não há quina para
    // fechar). `.sm-px-ritual-icon` estava aqui até 20/09/2026 — a regra
    // inteira `.sm-px-ritual-*` saiu do CSS (canvas Atividades, achado 4:
    // pixel fora do visor); a lista fica vazia de propósito, para quem
    // precisar da exceção declará-la aqui.
    const semMoldura = new Set<string>([]);
    const faltando = [...chanfrosDeclarados().keys()]
      .filter(c => !comBanda.has(c) && !semMoldura.has(c));
    expect(faltando, `peças com clip-path chanfrado e SEM banda de quina: ${faltando.join(', ')}`).toEqual([]);
  });

  it('o chanfro da banda é o mesmo do clip-path, peça por peça', () => {
    const clip = chanfrosDeclarados();
    const banda = chanfrosDaBanda();
    const divergentes: string[] = [];
    for (const [classe, c] of clip) {
      if (!banda.has(classe)) continue;
      if (banda.get(classe) !== c) divergentes.push(`${classe}: clip ${c}px vs banda ${banda.get(classe)}px`);
    }
    expect(divergentes, `chanfro divergente:\n${divergentes.join('\n')}`).toEqual([]);
  });

  it('nenhuma variante usa o atalho `background:` numa peça com banda', () => {
    // O atalho zera `background-image` — é a única forma de a quina sumir de
    // novo sem ninguém mexer na regra das bandas. Foi o que aconteceu no
    // `:hover` de 5 peças e no `:disabled` do `.sm-px-jump`.
    const comBanda = classesComBanda();
    const ofensores: string[] = [];
    const re = /\.([a-z0-9-]+)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    let x: RegExpExecArray | null;
    while ((x = re.exec(cssRaw))) {
      if (!comBanda.has(x[1])) continue;
      const variantes = x[2].match(/&:[a-z-]+(?:\([^)]*\))?\s*\{[^}]*\}/g) ?? [];
      for (const v of variantes) {
        if (/(?:^|[;{\s])background:\s/.test(v)) ofensores.push(`${x[1]} → ${v.slice(0, 60)}`);
      }
    }
    expect(ofensores, `use background-color:\n${ofensores.join('\n')}`).toEqual([]);
  });
});
