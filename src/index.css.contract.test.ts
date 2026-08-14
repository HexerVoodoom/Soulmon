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
