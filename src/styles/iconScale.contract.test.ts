/**
 * GUARD DA ESCALA DE ÍCONE — `tokens.md` §6.1 vira lei executável.
 *
 * O achado que criou este arquivo: a escala de ícone foi DECLARADA em
 * `src/styles/tokens.md` §6.1 (quatro PAPÉIS — 20 inline, 24 action, 32 nav e
 * o deck, que era 42 dedicado e virou 24 em 27/08/2026, dividindo `action`)
 * e **38 de 100 call-sites estavam fora dela**. Não havia teste
 * nenhum: uma escala que só o documento conhece não é escala, é intenção.
 * `size` é um `number` livre na API do `Icon`, então cada call-site escolhia o
 * dele — foi assim que a Loja chegou a desenhar 14/16/18/22/32 na mesma tela,
 * que é o defeito que a §6.1 nasceu para fechar.
 *
 * TRÊS decisões de construção, e cada uma responde a um jeito conhecido de um
 * guard destes apodrecer:
 *
 * 1. **A escala é LIDA de `tokens.md`, não digitada aqui.** Número copiado é
 *    número que diverge (footgun 9 do CLAUDE.md). Se alguém acrescentar um
 *    degrau na tabela, o guard passa a aceitá-lo no mesmo commit; se alguém
 *    apagar a tabela, o guard fica vermelho em vez de passar vazio.
 * 2. **O inventário é DERIVADO do `src/`**, como nos outros contract tests
 *    deste projeto (`assets.contract.test.ts` varre PNG, este varre JSX). Não
 *    existe lista de arquivos digitada — arquivo novo já nasce coberto.
 * 3. **A allowlist é EXPLÍCITA, NOMEADA e VERIFICADA NOS DOIS SENTIDOS.** Cada
 *    entrada carrega o motivo escrito, e o teste exige que a dívida ainda
 *    exista: se alguém migrar o call-site e esquecer de tirar a entrada, o
 *    guard acusa a entrada morta. Lista que só cresce vira cemitério — é a
 *    mesma regra da QUARANTINE de `assets.contract.test.ts`.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DOIS FUROS FECHADOS (auditoria de agosto), e o segundo explica o primeiro
 * achado da mesma auditoria:
 *
 * A. **`size={CONST}` passava invisível.** O parser só lia `size={<literal>}`
 *    e o resto virava "não há número para julgar". Uma constante local com
 *    valor fora da escala atravessava o guard sem deixar rastro. Agora o
 *    guard RESOLVE o identificador quando ele é uma const de módulo literal
 *    (ou um parâmetro com default literal) do MESMO arquivo, e quando não
 *    consegue resolver com segurança ele **acusa a FORMA** e pede um literal.
 *    Falso positivo que o autor resolve escrevendo o número é melhor que furo
 *    silencioso — é a mesma escolha do `[^>]*?` lá em cima.
 *
 * B. **O guard não enxergava uma BIBLIOTECA de ícone inteira.** Ele media o
 *    tamanho de `<Icon>`/`<NavGlyph>` e ficava verde enquanto o
 *    `GameTutorialFlow` — o segundo onboarding, OBRIGATÓRIO, a primeira tela
 *    de verdade de todo usuário novo — desenhava cinco glifos de
 *    `lucide-react` em 16/18/42px com `strokeWidth` 2.2–3. Um quarto idioma
 *    de ícone entrou pela porta que o guard não vigiava: escala é sobre
 *    TAMANHO, mas o defeito que a §6.1 nasceu para fechar (a tela com cinco
 *    linguagens visuais) também entra por MOTOR. Agora qualquer import de
 *    `lucide-react` no `src/` reprova, com allowlist própria — hoje VAZIA,
 *    e o caso de entrada morta abaixo garante que ela volte a ficar vazia.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, 'src');
const TOKENS_MD = path.join(SRC, 'styles', 'tokens.md');

// ───────────────────────────────────────────────────── a escala (do documento)

/**
 * Lê os degraus da tabela de §6.1. A forma da linha é
 * `| \`inline\` | **20** | papel… |` — o nome em crase, o px em negrito.
 * Só a tabela de §6.1 entra: o corte vai do cabeçalho dela até o **próximo
 * `###` qualquer**, e não até `### 6.2` especificamente. A diferença não é
 * estética — §6.1a propõe um 5º degrau (`state` = 48) que ainda NÃO foi aceito,
 * numa tabela do mesmo formato. Um corte que fosse só até §6.2 engoliria a
 * proposta como se fosse lei e a allowlist inteira viraria dispensável em
 * silêncio, sem ninguém ter decidido nada. Proposta escrita ≠ escala.
 */
function escalaDeclarada(): { degraus: Map<string, number>; trecho: string } {
  const md = fs.readFileSync(TOKENS_MD, 'utf8');
  const i = md.indexOf('### 6.1');
  const j = md.indexOf('\n### ', i + 1);
  const trecho = md.slice(i, j > 0 ? j : undefined);
  const degraus = new Map<string, number>();
  for (const m of trecho.matchAll(/^\|\s*`([a-z]+)`\s*\|\s*\*\*(\d+)\*\*\s*\|/gm)) {
    degraus.set(m[1], Number(m[2]));
  }
  return { degraus, trecho };
}

const { degraus: DEGRAUS, trecho: SECAO_61 } = escalaDeclarada();
const ESCALA = new Set(DEGRAUS.values());

// ──────────────────────────────────────────────── o inventário (do código)

interface CallSite {
  arquivo: string;   // relativo à raiz, com `/`
  linha: number;
  tag: 'Icon' | 'NavGlyph';
  /** O número desenhado, quando dá para saber. `null` = forma não resolvível. */
  size: number | null;
  /** O que estava escrito entre as chaves (`24`, `ICON_ACTION`, `props.size`). */
  expr: string;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * Constantes de tamanho resolvíveis DENTRO de um arquivo. Duas formas, e só
 * duas — porque cada forma a mais é uma chance de o guard "resolver" errado e
 * julgar um número que o app não desenha:
 *
 *   · `const ICON_ACTION = 24;` no topo do módulo (é o padrão que ShopModal e
 *     BottomNav já usam, e é o padrão CERTO: dá nome ao papel do degrau);
 *   · `{ size = 20 }` — parâmetro desestruturado com default literal, que é o
 *     tamanho que o componente DESENHA quando ninguém passa nada.
 *
 * O que NÃO se resolve (`props.size`, ternário, soma, valor vindo de outro
 * módulo) fica `null` e é ACUSADO pela forma. Assumir um valor ali seria pior
 * que não olhar: o guard passaria a afirmar um número inventado.
 */
function constantesLiterais(src: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of src.matchAll(/^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::\s*number\s*)?=\s*(\d+(?:\.\d+)?)\s*;/gm)) {
    m.set(c[1], Number(c[2]));
  }
  for (const c of src.matchAll(/[{,]\s*size\s*=\s*(\d+(?:\.\d+)?)\s*[,}]/g)) {
    m.set('size', Number(c[1]));
  }
  return m;
}

/**
 * Varre um fonte por `<Icon …>` / `<NavGlyph …>` e extrai o `size={…}`.
 *
 * Não é um regex de uma linha só de propósito: uma prop pode conter `>` (arrow
 * function, comparação) e um `[^>]*?` pararia cedo, deixando o call-site
 * invisível — guard que não enxerga é guard verde pelo motivo errado. Aqui a
 * tag é fechada contando `{}` e ignorando o que está dentro de string.
 *
 * `size` AUSENTE continua não sendo acusado: aí não há escolha de tamanho, o
 * componente usa o padrão dele (24, um degrau). O que passou a ser acusado é
 * `size={…}` com algo que não é literal nem constante local resolvível.
 */
export function varrerFonte(src: string, arquivo = '<memória>'): CallSite[] {
  const CONSTS = constantesLiterais(src);
  const achados: CallSite[] = [];
  const abertura = /<(Icon|NavGlyph)(?=[\s/>])/g;
  for (const m of src.matchAll(abertura)) {
    let i = m.index! + m[0].length;
    let chaves = 0;
    let aspas: string | null = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (aspas) { if (c === aspas && src[i - 1] !== '\\') aspas = null; continue; }
      if (c === '"' || c === "'" || c === '`') { aspas = c; continue; }
      if (c === '{') chaves++;
      else if (c === '}') chaves--;
      else if (c === '>' && chaves === 0) break;
    }
    const corpo = src.slice(m.index!, i);
    const temSize = /\bsize=\{/.test(corpo);
    if (!temSize) continue; // sem `size`: usa o padrão do componente (24, um degrau)
    // `[^{}]*` só casa expressão SEM chave aninhada. Quando não casa (template
    // string, objeto, chamada com bloco), o call-site não some da varredura —
    // ele entra com a forma marcada e cai no caso que exige literal.
    const s = corpo.match(/\bsize=\{([^{}]*)\}/);
    const expr = s ? s[1].trim() : '<expressão com chave aninhada>';
    const size = /^\d+(\.\d+)?$/.test(expr)
      ? Number(expr)
      : (CONSTS.has(expr) ? CONSTS.get(expr)! : null);
    achados.push({
      arquivo,
      linha: src.slice(0, m.index!).split('\n').length,
      tag: m[1] as CallSite['tag'],
      size,
      expr,
    });
  }
  return achados;
}

/**
 * ESTE arquivo sai do inventário, e não é conveniência: os call-sites fora de
 * escala escritos aqui em cima são as AUTOVERIFICAÇÕES — `size={30}`,
 * `size={40}`, `size={22}` existem para provar que o detector enxerga. Varrer a
 * si mesmo faz o guard acusar a própria prova, que é a versão em JSX do "guard
 * que lê comentário" de `dailyGoal.contract.test.ts`. A exclusão é de UM
 * arquivo nomeado — não um padrão de `*.test.tsx`, senão um `<Icon size={18}>`
 * escrito num teste de render de verdade escaparia junto (é justamente o que
 * faz `foundation.render.test.tsx` estar na ALLOWLIST, e não numa exclusão).
 */
const ARQUIVO_DESTE_GUARD = 'src/styles/iconScale.contract.test.ts';

function inventario(): CallSite[] {
  const out: CallSite[] = [];
  for (const f of walk(SRC)) {
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    if (rel === ARQUIVO_DESTE_GUARD) continue;
    out.push(...varrerFonte(fs.readFileSync(f, 'utf8'), rel));
  }
  return out;
}

const CALL_SITES = inventario();
const chave = (c: CallSite) => `${c.arquivo}:${c.linha}`;

// ───────────────────────────────────────────── o 4º idioma de ícone (motor)

/**
 * Acha IMPORT de `lucide-react` — não a palavra. Os arquivos migrados citam a
 * biblioteca em comentário ("o que saiu daqui: `lucide-react`…"), e um guard
 * que acusasse a MENÇÃO puniria justamente quem documentou a migração; o
 * primeiro a apagar o comentário ficaria verde. Cobre as quatro formas que
 * fazem o código entrar no bundle — `import … from`, `import '…'` de efeito,
 * `import('…')` dinâmico e `require('…')` — e o alias versionado
 * (`lucide-react@0.487.0`) que o `vite.config.ts` mapeia.
 */
export function importaLucide(src: string): boolean {
  const alvo = String.raw`lucide-react(@[\w.^~*-]+)?`;
  return new RegExp(
    String.raw`(?:from|import|require)\s*\(?\s*['"]${alvo}['"]`,
  ).test(src);
}

interface DividaDeMotor { arquivo: string; motivo: string }

/**
 * ALLOWLIST DE MOTOR — vazia, e é para continuar vazia.
 *
 * Ela existe (em vez de o guard ser uma proibição sem saída) porque o dia em
 * que alguém tiver um motivo real vai chegar, e a alternativa a uma linha com
 * o motivo escrito é alguém apagar o teste inteiro. Regra de entrada: o mesmo
 * motivo de 40 caracteres que a allowlist de tamanho cobra, e a mesma
 * verificação nos dois sentidos — entrada que não corresponde a um import real
 * reprova como dívida morta.
 */
const ALLOWLIST_MOTOR: DividaDeMotor[] = [];

const IMPORTS_LUCIDE = walk(SRC)
  .map(f => path.relative(ROOT, f).split(path.sep).join('/'))
  .filter(rel => rel !== ARQUIVO_DESTE_GUARD)
  .filter(rel => importaLucide(fs.readFileSync(path.join(ROOT, rel), 'utf8')));

// ──────────────────────────────────────────────────────────────── allowlist

interface Divida {
  /** Arquivo (relativo à raiz). A LINHA de propósito NÃO entra: linha muda a
   *  cada edição e a manutenção viraria ruído. O par arquivo+tamanho basta. */
  arquivo: string;
  size: number;
  /** Quantos call-sites com esse tamanho, nesse arquivo, estão perdoados. */
  quantos: number;
  motivo: string;
}

/**
 * ALLOWLIST — dívidas conscientes, cada uma com o motivo escrito.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTRADA 1 — `ILUSTRAÇÃO DE ESTADO` (48px, 10 call-sites)
 *
 * Este é o ACHADO desta onda, e ele é informação sobre a escala, não sobre os
 * call-sites: **a escala de §6.1 tem um buraco de um degrau.**
 *
 * Os 38 usos fora de escala não eram 38 caprichos. Depois de migrar cada um
 * pelo PAPEL (a pergunta da §6.1: "o ícone está ao lado de uma palavra na
 * mesma linha?"), 28 caíram limpos nos quatro degraus — e os 10 que sobraram
 * são todos a MESMA coisa, escrita por seis autores diferentes em seis
 * arquivos: **um glifo sozinho, centralizado, acima de um parágrafo, que É a
 * tela naquele momento**. Estado vazio ("sua árvore ainda não foi revelada"),
 * estado de erro ("não deu para falar com o servidor"), estado de conclusão
 * ("pilha arrumada!"), o herói do relatório diário e da tela de intro da
 * masmorra. Estavam em 40 e 48; foram unificados em **48**.
 *
 * Por que NÃO forçar nos quatro degraus, que era a alternativa:
 *   · **24 (`action`/`deck`) não serve.** A §6.1 escreve o papel de cada
 *     degrau e diz "e SÓ ele": 24 é a coluna de ação da linha e o deck de
 *     ações do aparelho na Home (comida, carinho, banho — o `deck` era 42
 *     dedicado e encolheu para 24 em 27/08/2026). Um estado vazio da Loja
 *     desenhado com o tamanho do botão de dar comida não é hierarquia, é
 *     colisão de significado — e a 24 seria ainda metade do que já é — exatamente o que a
 *     §6.1 acusa quando diz que 22 ao lado de 24 "não é hierarquia, é ruído".
 *   · **32 (`nav`) também não.** É a barra do aparelho. E rebaixar de 48 para
 *     32 encolhe em 33% a única coisa desenhada numa tela vazia.
 *   · **48 já era o valor de 3 dos 10** (relatório diário, masmorra,
 *     WelcomePrompt) e o do relatório vive numa caixa de 48×48 declarada no
 *     próprio JSX — o precedente da §6.2 ("arte mora numa CAIXA, e a caixa
 *     manda no glifo") já aponta para cá.
 *
 * PROPOSTA, para quem for dono do `tokens.md`: um 5º degrau
 * `state` = **48** — "o glifo que É a tela: estado vazio, estado de erro,
 * estado de conclusão, herói de modal. Nunca em linha, nunca em lista, no
 * máximo UM por tela." Fica em 48 e não em 56 porque 56 é a caixa `art-md` da
 * §6.2, e um ícone de sistema do tamanho da caixa de arte confunde as duas
 * escalas. No dia em que a linha entrar na tabela de §6.1, `escalaDeclarada()`
 * passa a aceitar 48 sozinha e **esta entrada da allowlist tem que sair** — o
 * caso "nenhuma entrada da allowlist é dívida morta" abaixo cobra isso.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTRADA 2 — `CLAMP DE opsz` (12 e 64, no teste da fundação)
 *
 * `foundation.render.test.tsx` passa 12 e 64 de propósito: é o teste que prova
 * a regra 3 da §6 (o `opsz` é clampado em 20–48, porque valor inválido em
 * `font-variation-settings` invalida a declaração INTEIRA em alguns WebViews
 * e o ícone perde junto o FILL e o wght). Ele PRECISA passar valor fora da
 * escala — é o que ele está testando. Migrar seria apagar o teste.
 */
const ALLOWLIST: Divida[] = [
  {
    arquivo: 'src/components/DailyReportModal.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado: o herói do relatório diário, dentro de uma caixa de 48×48 declarada no JSX (precedente da §6.2). Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/DungeonGame.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado: o glifo da tela de intro da masmorra, que é a tela inteira. Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/EvolutionPath.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado VAZIO: "sua árvore ainda não foi revelada". Era 40. Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/LibraryPage.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado de ERRO: "não deu para falar com o servidor". Era 40. Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/PetPage.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado VAZIO: a página do Pet sem criatura revelada. Era 40. Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/TournamentPage.tsx', size: 48, quantos: 3,
    motivo: 'Três ilustrações de estado: PvP desligado, erro ao carregar oponentes, erro ao carregar o ranking. Eram 40. Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/pixel/RitualPanel.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado VAZIO da lista do dia: `task_alt` 48 ciano acima de "No activity registered." (canvas Atividades `ListaVazia`, SIS-06). Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/MorningDream.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado: a manhã SEM cena — `wb_sunny` 48 `gold-ink` no lugar do vidro vazio (canvas Rituais `SonhoSemCena`, D-R2). Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/MilestoneCeremony.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado: o tier do marco — `eco` 48 FILL .34/.67/1, o mesmo glifo da lista, fora do vidro da cerimônia (canvas Rituais `MarcoCerimonia`, D-R10). Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/WelcomePromptModal.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado: o herói do modal de boas-vindas. Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/GameTutorialFlow.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado: o glifo herói do segundo onboarding — sozinho, centralizado, acima do parágrafo, É a tela. Veio de `lucide-react` em 42px dentro de uma caixa de 84px (ícone em box, proibido). Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/ui/foundation.render.test.tsx', size: 64, quantos: 1,
    motivo: 'NÃO é UI: é o teste do clamp de `opsz` (§6 regra 3). Precisa passar acima de 48 para provar que o componente clampa. Ver ENTRADA 2.',
  },
  {
    arquivo: 'src/components/ui/foundation.render.test.tsx', size: 12, quantos: 1,
    motivo: 'NÃO é UI: é o teste do clamp de `opsz` (§6 regra 3). Precisa passar abaixo de 20. Ver ENTRADA 2.',
  },
];

function perdoado(c: CallSite): Divida | undefined {
  return ALLOWLIST.find(d => d.arquivo === c.arquivo && d.size === c.size);
}

// ────────────────────────────────────────────────────────── autoverificação

describe('guard da escala de ícone — autoverificação (o instrumento enxerga?)', () => {
  it('a escala saiu do documento, com os quatro degraus e os papéis', () => {
    // `deck` passou a valer 24 em 27/08/2026 (dividiu o degrau de `action` —
    // o dono encolheu o deck da Home, e três valores de px bastam para os
    // quatro papéis nomeados; ver tokens.md §6.1).
    expect([...DEGRAUS.entries()]).toEqual([
      ['inline', 20], ['action', 24], ['nav', 32], ['deck', 24],
    ]);
    // Se a tabela sumir, `DEGRAUS` fica vazio e TUDO viraria violação —
    // vermelho, que é o certo. Mas o caso explícito diz por quê.
    expect(DEGRAUS.size, 'a tabela de §6.1 sumiu do tokens.md').toBeGreaterThan(0);
    // E a §6.2 (caixa 56 / glifo 28) NÃO pode ter vazado para dentro da escala.
    expect(ESCALA.has(56)).toBe(false);
    expect(ESCALA.has(28)).toBe(false);
    // Nem a PROPOSTA de §6.1a (`state` = 48): ela está escrita no documento, na
    // mesma forma de tabela, e ainda assim não é lei. Este é o caso que impede
    // "alguém escreveu a proposta" de virar "o guard parou de cobrar".
    expect(ESCALA.has(48), '§6.1a é proposta, não degrau — não pode entrar na escala').toBe(false);
    expect(SECAO_61).not.toContain('`state`');
  });

  it('a §6.1 continua declarando a pergunta que decide o degrau', () => {
    // O guard proíbe o número; quem escolhe o número é esta frase. Se ela sair
    // do documento, o guard vira aritmética sem critério.
    expect(SECAO_61).toContain('o ícone está ao lado de uma palavra na');
  });

  it('o parser acha o call-site e lê o tamanho', () => {
    const achados = varrerFonte('<Icon name="mic" size={30} tone="ink" />');
    expect(achados).toEqual([{ arquivo: '<memória>', linha: 1, tag: 'Icon', size: 30, expr: '30' }]);
  });

  it('o parser NÃO se perde numa prop que contém `>` (o furo do regex ingênuo)', () => {
    // Este era o furo real: `[^>]*?` para no `>` da arrow function e o
    // `size={40}` some da varredura — o call-site fora de escala fica invisível.
    const src = '<Icon name="x" onClick={() => setOpen(true)} size={40} />';
    expect(varrerFonte(src).map(c => c.size)).toEqual([40]);
  });

  it('o parser lê tag multilinha e NÃO confunde `Icon` com `IconButton`', () => {
    const src = [
      '<IconButton size={13} />',
      '<Icon',
      '  name="pets"',
      '  size={42}',
      '/>',
    ].join('\n');
    const achados = varrerFonte(src);
    expect(achados.map(c => c.size)).toEqual([42]);
    expect(achados[0].linha).toBe(2);
  });

  it('o parser cobre NavGlyph também', () => {
    expect(varrerFonte('<NavGlyph name="home" size={32} />')[0].tag).toBe('NavGlyph');
  });

  it('`size` AUSENTE não é acusado (aí não há escolha: vale o padrão 24)', () => {
    expect(varrerFonte('<Icon name="a" />')).toEqual([]);
  });

  /**
   * FURO 1 da auditoria, em forma de teste: `size={CONST}` passava invisível.
   * Uma constante local fora da escala atravessava o guard sem rastro — e o
   * padrão `const ICON_ACTION = 24` é justamente o padrão BOM (dá nome ao
   * papel), então ele precisa ser lido, não ignorado.
   */
  it('o parser RESOLVE `size={CONST}` quando a const é local e literal', () => {
    const src = [
      'const ICON_ACTION = 24;',
      'const ICON_TORTO = 18;',
      '<Icon name="a" size={ICON_ACTION} />',
      '<Icon name="b" size={ICON_TORTO} />',
    ].join('\n');
    const achados = varrerFonte(src);
    expect(achados.map(c => [c.expr, c.size])).toEqual([['ICON_ACTION', 24], ['ICON_TORTO', 18]]);
    // e o de 18 é julgado como qualquer literal fora de escala seria
    expect(achados.filter(c => c.size !== null && !ESCALA.has(c.size)).map(c => c.expr)).toEqual(['ICON_TORTO']);
  });

  it('o parser resolve o default literal de um parâmetro desestruturado', () => {
    const src = 'function Spinner({ size = 20 }: { size?: number }) {\n  return <Icon name="sync" size={size} />;\n}';
    expect(varrerFonte(src).map(c => c.size)).toEqual([20]);
  });

  it('forma NÃO resolvível vira `size: null` — a forma é acusada, não adivinhada', () => {
    // Adivinhar aqui seria pior que não olhar: o guard passaria a afirmar um
    // número que o app não desenha. `null` é a acusação.
    expect(varrerFonte('<Icon name="a" size={props.size} />').map(c => c.size)).toEqual([null]);
    expect(varrerFonte('<Icon name="a" size={aberto ? 20 : 32} />').map(c => c.size)).toEqual([null]);
    expect(varrerFonte('<Icon name="a" size={BASE + 4} />').map(c => c.size)).toEqual([null]);
    // const de OUTRO módulo não é local: não se resolve, se acusa.
    expect(varrerFonte('import { ICON } from "./x";\n<Icon size={ICON} />').map(c => c.size)).toEqual([null]);
  });

  it('nem uma expressão com chave aninhada some da varredura', () => {
    const achados = varrerFonte('<Icon name="a" size={{ a: 1 }.a} />');
    expect(achados.length).toBe(1);
    expect(achados[0].size).toBe(null);
  });

  /**
   * FURO 2, o que deixou o furo do `GameTutorialFlow` passar: o guard media
   * TAMANHO e ficava cego a MOTOR. Um quarto idioma de ícone entrou pela porta
   * que ninguém vigiava.
   */
  it('o detector de `lucide-react` acusa IMPORT, nas quatro formas', () => {
    expect(importaLucide("import { Heart } from 'lucide-react';")).toBe(true);
    expect(importaLucide('import Foo from "lucide-react";')).toBe(true);
    expect(importaLucide("import 'lucide-react';")).toBe(true);
    expect(importaLucide("const m = await import('lucide-react');")).toBe(true);
    expect(importaLucide("require('lucide-react')")).toBe(true);
    // e o alias versionado que o vite.config.ts mapeia
    expect(importaLucide("import { Heart } from 'lucide-react@0.487.0';")).toBe(true);
  });

  it('o detector NÃO acusa a MENÇÃO em comentário (senão pune quem documentou)', () => {
    expect(importaLucide('// O que saiu daqui: `lucide-react`, o PNG raster.')).toBe(false);
    expect(importaLucide("import { Icon } from './ui/Icon'; // era lucide-react")).toBe(false);
  });

  it('o julgamento separa dentro de escala de fora dela', () => {
    // 42 saiu da amostra "dentro" em 27/08/2026: não é mais um degrau da
    // escala (o `deck` encolheu para dividir `action`, 24px).
    const dentro = varrerFonte('<Icon size={20} /><Icon size={24} /><Icon size={32} />');
    expect(dentro.filter(c => c.size === null || !ESCALA.has(c.size))).toEqual([]);
    const fora = varrerFonte('<Icon size={22} /><Icon size={18} />');
    expect(fora.filter(c => c.size !== null && !ESCALA.has(c.size)).map(c => c.size)).toEqual([22, 18]);
  });

  it('a exclusão do próprio guard aponta para um arquivo que existe', () => {
    // Se este arquivo for renomeado, a exclusão vira letra morta e o guard
    // passa a acusar as próprias autoverificações — vermelho barulhento, não
    // silencioso, mas ainda assim melhor dizer aqui o que está acontecendo.
    expect(fs.existsSync(path.join(ROOT, ARQUIVO_DESTE_GUARD))).toBe(true);
  });

  it('a varredura achou call-sites de verdade (não uma pasta vazia)', () => {
    expect(CALL_SITES.length).toBeGreaterThan(60);
    // e mede o repositório inteiro, não um arquivo só
    expect(new Set(CALL_SITES.map(c => c.arquivo)).size).toBeGreaterThan(20);
  });
});

// ──────────────────────────────────────────────────────────────────── o guard

describe('guard da escala de ícone — §6.1 é lei', () => {
  it('todo `<Icon size>` / `<NavGlyph size>` cai num degrau da escala', () => {
    const fora = CALL_SITES
      .filter(c => c.size !== null && !ESCALA.has(c.size) && !perdoado(c))
      .map(c => `${chave(c)} — <${c.tag} size={${c.expr}}>${c.expr === String(c.size) ? '' : ` (= ${c.size})`} (degraus: ${[...ESCALA].join('/')})`);
    expect(fora, 'tamanho fora da escala de tokens.md §6.1').toEqual([]);
  });

  /**
   * O FURO 1: `size={CONST}` cujo valor estivesse fora da escala passava
   * invisível, porque o parser antigo só entendia literal e tratava todo o
   * resto como "não há número para julgar". Resolver o que dá para resolver
   * fechou a maior parte; o resto tem que ser ESCRITO como número, e é isso
   * que este caso cobra. É a escolha consciente por falso positivo: quem
   * escreveu a expressão sabe o valor e troca por um literal ou por uma const
   * local nomeada (`const ICON_ACTION = 24`, que é o padrão bom) — enquanto um
   * furo silencioso não tem dono nenhum.
   */
  it('nenhum `size={…}` é opaco: ou é literal, ou resolve para um número', () => {
    const opacos = CALL_SITES
      .filter(c => c.size === null)
      .map(c => `${chave(c)} — <${c.tag} size={${c.expr}}>: escreva o número (ou uma const LOCAL literal, ex. \`const ICON_ACTION = 24\`) para o guard poder julgar`);
    expect(opacos, 'forma de `size` que o guard não consegue julgar').toEqual([]);
  });

  /**
   * O outro lado da allowlist, e o que a impede de virar cemitério: entrada
   * que não corresponde mais a uma dívida REAL tem que sair. Sem este caso,
   * migrar um call-site e esquecer a entrada deixaria um buraco permanente por
   * onde a próxima regressão entraria em silêncio.
   */
  it('nenhuma entrada da allowlist é dívida morta', () => {
    const mortas = ALLOWLIST
      .map(d => {
        const reais = CALL_SITES.filter(c => c.arquivo === d.arquivo && c.size === d.size).length;
        if (reais === 0) return `${d.arquivo} size=${d.size}: a dívida sumiu — TIRE a entrada`;
        if (reais !== d.quantos) return `${d.arquivo} size=${d.size}: a entrada perdoa ${d.quantos} e existem ${reais} — atualize o número`;
        if (ESCALA.has(d.size)) return `${d.arquivo} size=${d.size}: ${d.size} virou degrau oficial — TIRE a entrada`;
        return null;
      })
      .filter(Boolean);
    expect(mortas, 'allowlist desatualizada').toEqual([]);
  });

  it('toda entrada da allowlist tem um motivo escrito de verdade', () => {
    // Motivo de uma palavra ("legado", "TODO") é o jeito mais rápido de a
    // allowlist deixar de significar alguma coisa.
    const vagos = ALLOWLIST
      .filter(d => d.motivo.trim().length < 40)
      .map(d => `${d.arquivo} size=${d.size}`);
    expect(vagos, 'motivo curto demais para ser um motivo').toEqual([]);
  });

  /**
   * A allowlist tem 11 entradas e 10 delas são o MESMO papel. Isso é um sinal
   * sobre a ESCALA, não sobre os call-sites — e um sinal que se apaga sozinho
   * se ninguém contar. Este caso mantém o número visível: no dia em que a
   * dívida de ilustração de estado crescer, alguém tem que decidir entre
   * escrever o 5º degrau na §6.1 ou frouxar o guard, e essa decisão passa a
   * ser consciente.
   *
   * O teto foi de 12 para **13** UMA vez, e aqui está a decisão por escrito,
   * que é exatamente o que este caso existe para forçar: o herói do
   * `GameTutorialFlow` era `lucide-react` e não aparecia na contagem — ao
   * migrar para `<Icon>`, o 11º caso do papel `state` ficou visível. Não é
   * dívida nova, é dívida que estava fora do alcance do instrumento. A
   * alternativa era desenhar o herói do segundo onboarding em 24 (`deck` = o
   * botão de dar comida da Home, que era 42 e encolheu em 27/08/2026), que é a colisão de significado que a §6.1a
   * já recusou. **O próximo aumento não deve ser um aumento**: 11 de 13 são o
   * mesmo papel, e a resposta certa é a §6.1a virar linha da tabela de §6.1 —
   * aí `escalaDeclarada()` aceita 48 sozinha e nove entradas caem de uma vez.
   *
   * Segundo aumento, 13 → **15** (20/09/2026, canvas Rituais §21, aprovado
   * pelo dono): o `wb_sunny` da manhã sem cena (`SonhoSemCena`) e o `eco` do
   * tier na cerimônia do marco (`MarcoCerimonia`) são desenhados a 48 nos
   * artboards — ilustração de estado, o mesmo papel dos outros 13. Continua
   * valendo o parágrafo acima: 13 de 15 são `state`, e a saída é a §6.1a
   * virar degrau — decisão do lead de design, não deste teste.
   */
  it('a allowlist não cresce em silêncio', () => {
    const perdoados = ALLOWLIST.reduce((n, d) => n + d.quantos, 0);
    expect(perdoados, 'dívida nova sem revisar a escala — leia a ENTRADA 1').toBeLessThanOrEqual(15);
    // e ela é uma FATIA pequena: se um dia a maior parte dos call-sites estiver
    // perdoada, a escala virou ficção outra vez.
    expect(perdoados / CALL_SITES.length).toBeLessThan(0.2);
  });

  /**
   * REGRESSÃO nomeada, com os dois call-sites que a avaliação viu na tela: o
   * `mic` da Home (barra de chat) estava em 30 — o degrau da barra é 32 — e o
   * `pets` do estado vazio da Evolução estava em 40. Um caso genérico
   * ("nenhum está fora") passaria também num repositório onde alguém tivesse
   * quebrado a varredura; estes dois provam que a varredura chega ATÉ LÁ.
   */
  /**
   * O outro lado do FURO 2. `<Icon>` é "o ÚNICO ponto de ícone do app"
   * (`Icon.tsx`) — uma biblioteca paralela desfaz isso em silêncio, e desfez:
   * a §6.1 nasceu contra a tela com cinco tamanhos, e um segundo motor traz
   * cinco tamanhos DE VOLTA junto com um traço (`strokeWidth`) que a escala
   * nem sabe medir.
   */
  it('`lucide-react` não é importado em lugar nenhum do `src/`', () => {
    const intrusos = IMPORTS_LUCIDE
      .filter(f => !ALLOWLIST_MOTOR.some(d => d.arquivo === f))
      .map(f => `${f}: importa \`lucide-react\` — o app tem UM motor de ícone (\`components/ui/Icon.tsx\`, §6 do tokens.md)`);
    expect(intrusos, 'quarto idioma de ícone de volta no app').toEqual([]);
  });

  it('a allowlist de motor está vazia — e cada entrada dela seria dívida VIVA', () => {
    const mortas = ALLOWLIST_MOTOR
      .filter(d => !IMPORTS_LUCIDE.includes(d.arquivo))
      .map(d => `${d.arquivo}: não importa mais \`lucide-react\` — TIRE a entrada`);
    expect(mortas, 'allowlist de motor desatualizada').toEqual([]);
    const vagos = ALLOWLIST_MOTOR.filter(d => d.motivo.trim().length < 40).map(d => d.arquivo);
    expect(vagos, 'motivo curto demais para justificar um segundo motor de ícone').toEqual([]);
  });

  /**
   * A dependência também sai do `package.json`. Pacote instalado com zero
   * imports é uma porta encostada: o próximo `import { Heart }` funciona de
   * primeira, sem instalar nada e sem ninguém decidir nada.
   */
  it('`lucide-react` não está mais nas dependências', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps).filter(d => d.startsWith('lucide-react'))).toEqual([]);
  });

  it('REGRESSÃO: os dois que apareciam nas telas principais estão na escala', () => {
    const mic = CALL_SITES.filter(c => c.arquivo === 'src/components/ChatBox.tsx');
    expect(mic.length, 'a barra de chat sumiu da varredura').toBeGreaterThan(0);
    expect(mic.map(c => c.size).filter(s => s !== DEGRAUS.get('nav')!)).toEqual([]);

    const evo = CALL_SITES.filter(c => c.arquivo === 'src/components/EvolutionPath.tsx');
    expect(evo.length).toBeGreaterThan(0);
    expect(evo.filter(c => c.size === null || (!ESCALA.has(c.size) && !perdoado(c)))).toEqual([]);
  });

  /**
   * O degrau `deck` existia em 42px, dedicado, para UM lugar só — o deck de
   * ações da Home. Desde 27/08/2026 ele vale 24 e divide o degrau `action`
   * (ver tokens.md §6.1); os dois nomes continuam na tabela porque o
   * CONTEXTO é diferente, mesmo com o mesmo px. Sem este caso, um degrau
   * declarado e nunca usado passaria despercebido, e a §6.1 estaria
   * descrevendo uma tela que não existe.
   */
  it('cada degrau declarado é um degrau USADO (a tabela descreve o app real)', () => {
    const usados = new Set(CALL_SITES.map(c => c.size).filter((s): s is number => s !== null));
    const orfaos = [...DEGRAUS.entries()]
      .filter(([, px]) => !usados.has(px))
      .map(([nome, px]) => `${nome} (${px}px) está na tabela e não é usado em lugar nenhum`);
    expect(orfaos).toEqual([]);
  });
});
