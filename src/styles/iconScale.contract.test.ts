/**
 * GUARD DA ESCALA DE ÍCONE — `tokens.md` §6.1 vira lei executável.
 *
 * O achado que criou este arquivo: a escala de ícone foi DECLARADA em
 * `src/styles/tokens.md` §6.1 (quatro degraus — 20 inline, 24 action, 32 nav,
 * 42 deck) e **38 de 100 call-sites estavam fora dela**. Não havia teste
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
  size: number;
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
 * Varre um fonte por `<Icon …>` / `<NavGlyph …>` e extrai o `size={n}`.
 *
 * Não é um regex de uma linha só de propósito: uma prop pode conter `>` (arrow
 * function, comparação) e um `[^>]*?` pararia cedo, deixando o call-site
 * invisível — guard que não enxerga é guard verde pelo motivo errado. Aqui a
 * tag é fechada contando `{}` e ignorando o que está dentro de string.
 */
export function varrerFonte(src: string, arquivo = '<memória>'): CallSite[] {
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
    const s = corpo.match(/\bsize=\{\s*(\d+)\s*\}/);
    if (!s) continue; // sem `size` literal: usa o padrão (24) ou uma variável
    achados.push({
      arquivo,
      linha: src.slice(0, m.index!).split('\n').length,
      tag: m[1] as CallSite['tag'],
      size: Number(s[1]),
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
 *   · **42 (`deck`) não serve.** A §6.1 escreve o papel de cada degrau e diz
 *     "e SÓ ele": 42 é o deck de ações do aparelho na Home (comida, carinho,
 *     banho). Um estado vazio da Loja desenhado com o tamanho do botão de dar
 *     comida não é hierarquia, é colisão de significado — exatamente o que a
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
    arquivo: 'src/components/TriagePile.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado de CONCLUSÃO: "pilha arrumada!". Era 40. Ver ENTRADA 1.',
  },
  {
    arquivo: 'src/components/WelcomePromptModal.tsx', size: 48, quantos: 1,
    motivo: 'Ilustração de estado: o herói do modal de boas-vindas. Ver ENTRADA 1.',
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
    expect([...DEGRAUS.entries()]).toEqual([
      ['inline', 20], ['action', 24], ['nav', 32], ['deck', 42],
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
    expect(achados).toEqual([{ arquivo: '<memória>', linha: 1, tag: 'Icon', size: 30 }]);
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

  it('`size` ausente ou vindo de variável não é acusado (não há número para julgar)', () => {
    expect(varrerFonte('<Icon name="a" />')).toEqual([]);
    expect(varrerFonte('<Icon name="a" size={props.size} />')).toEqual([]);
  });

  it('o julgamento separa dentro de escala de fora dela', () => {
    const dentro = varrerFonte('<Icon size={20} /><Icon size={24} /><Icon size={32} /><Icon size={42} />');
    expect(dentro.filter(c => !ESCALA.has(c.size))).toEqual([]);
    const fora = varrerFonte('<Icon size={22} /><Icon size={18} />');
    expect(fora.filter(c => !ESCALA.has(c.size)).map(c => c.size)).toEqual([22, 18]);
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
      .filter(c => !ESCALA.has(c.size) && !perdoado(c))
      .map(c => `${chave(c)} — <${c.tag} size={${c.size}}> (degraus: ${[...ESCALA].join('/')})`);
    expect(fora, 'tamanho fora da escala de tokens.md §6.1').toEqual([]);
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
   * A allowlist tem 10 entradas e 9 delas são o MESMO papel. Isso é um sinal
   * sobre a ESCALA, não sobre os call-sites — e um sinal que se apaga sozinho
   * se ninguém contar. Este caso mantém o número visível: no dia em que a
   * dívida de ilustração de estado crescer, alguém tem que decidir entre
   * escrever o 5º degrau na §6.1 ou frouxar o guard, e essa decisão passa a
   * ser consciente.
   */
  it('a allowlist não cresce em silêncio', () => {
    const perdoados = ALLOWLIST.reduce((n, d) => n + d.quantos, 0);
    expect(perdoados, 'dívida nova sem revisar a escala — leia a ENTRADA 1').toBeLessThanOrEqual(12);
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
  it('REGRESSÃO: os dois que apareciam nas telas principais estão na escala', () => {
    const mic = CALL_SITES.filter(c => c.arquivo === 'src/components/ChatBox.tsx');
    expect(mic.length, 'a barra de chat sumiu da varredura').toBeGreaterThan(0);
    expect(mic.map(c => c.size).filter(s => s !== DEGRAUS.get('nav')!)).toEqual([]);

    const evo = CALL_SITES.filter(c => c.arquivo === 'src/components/EvolutionPath.tsx');
    expect(evo.length).toBeGreaterThan(0);
    expect(evo.filter(c => !ESCALA.has(c.size) && !perdoado(c))).toEqual([]);
  });

  /**
   * O degrau `deck` (42) existe para UM lugar só — o deck de ações da Home.
   * Sem este caso, um degrau declarado e nunca usado passaria despercebido, e
   * a §6.1 estaria descrevendo uma tela que não existe.
   */
  it('cada degrau declarado é um degrau USADO (a tabela descreve o app real)', () => {
    const usados = new Set(CALL_SITES.map(c => c.size));
    const orfaos = [...DEGRAUS.entries()]
      .filter(([, px]) => !usados.has(px))
      .map(([nome, px]) => `${nome} (${px}px) está na tabela e não é usado em lugar nenhum`);
    expect(orfaos).toEqual([]);
  });
});
