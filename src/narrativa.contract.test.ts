/**
 * A RÉGUA DA NARRATIVA — trava o vocabulário de `docs/NARRATIVA-E-UNIVERSO.md`.
 *
 * ## Por que este arquivo existe
 *
 * A bíblia do universo (21/09/2026) tem uma seção de vocabulário canônico com
 * uma coluna "proibido / por quê", e o parecer do `soulmon-guarda-linha-vermelha`
 * sobre ela terminou pedindo esta régua por escrito (proposta P13): *"a mitigação
 * tem de ser EXECUTÁVEL, não editorial — sem esse teste, a palavra volta na
 * próxima feature"*.
 *
 * O precedente é medido, não teórico. Este repositório já viu:
 *
 * - `ArenaGame.tsx` reintroduzir dois sons cortados com 3.974 testes verdes,
 *   porque o corte era prosa e não régua (`src/utils/cortes.contract.test.ts`);
 * - o widget Android manter três frases de cobrança que a spec mandou remover,
 *   porque nenhum teste em `node` alcança Kotlin
 *   (`src/plugins/widgetSemCobranca.contract.test.ts`).
 *
 * Vocabulário é justamente o que se lê. Então é o que dá para travar.
 *
 * ## A ideia: uma lista de exceções DECLARADAS, não uma lista de pendências
 *
 * ⚠️ **O dono decidiu em 21/09/2026, e a decisão muda o estatuto desta tabela.**
 * Perguntado sobre trocar `Vírus/Dado/Vacina`, `Glitchtama`, `Serah`, `Pyraka` e
 * `Zeed`, ele respondeu **"nenhum, aceito todos assim"**. Então a tabela
 * `EXCECOES` abaixo não é mais dívida a quitar: é a lista do que ficou, por
 * decisão registrada (`docs/REGISTRO-DE-DECISOES.md`).
 *
 * O guard continua valendo, e por dois motivos que sobrevivem à decisão:
 *
 * - **os termos NUNCA aceitos continuam travados** — `tamer`, `domador`,
 *   `treinador`, `digievolução`, `mundo digital`. Esses não têm exceção
 *   nenhuma, e é por eles que esta régua existe;
 * - **espalhar um termo aceito para um arquivo NOVO continua reprovando.** A
 *   decisão foi "fica como está", não "use à vontade": arquivo novo é uma
 *   escolha nova, e ela passa a ser visível em vez de silenciosa.
 *
 * Deliberadamente NÃO asserto o número de ocorrências por arquivo: contagem
 * apodrece a cada edição não relacionada, e este repositório tem cinco lápides
 * de número que apodreceu (a `CACHE_VERSION` do `CLAUDE.md`, o `wc -l` do
 * `App.tsx`, as referências `arquivo:linha`). Conjunto de arquivos não apodrece.
 *
 * ## O que esta régua NÃO alcança, dito por extenso
 *
 * - Ela lê **fonte**, não tela. Termo montado por concatenação
 *   (`'Vír' + 'us'`) ou vindo do servidor passa.
 * - Ela não sabe se a string é visível: um comentário com a palavra reprova
 *   junto. É de propósito — comentário vira texto na próxima refatoração, e o
 *   falso positivo custa uma linha na tabela, enquanto o falso negativo custa a
 *   palavra de volta na tela.
 * - Ela não julga tom. As doze leis (§2 da bíblia) e o checklist (§17) são de
 *   leitura humana ou de agente; nenhum teste reprova uma frase por ser
 *   cobrança. Isso continua sendo trabalho do `soulmon-guarda-linha-vermelha`.
 * - Os **ids** do save (`virus`/`data`/`vaccine`, `champion-virus`) são
 *   minúsculos e estão fora do alvo por desenho — a linha vermelha #20 diz que
 *   chave só se acrescenta, e trocar id não tem ganho nenhum de PI.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// `fileURLToPath`, não `.pathname`: no Windows o pathname vem `/D:/…` e o `join` vira `D:\D:\…`.
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(RAIZ, 'src');
const BIBLIA = join(RAIZ, 'docs', 'NARRATIVA-E-UNIVERSO.md');

/** Fontes de texto de jogador. Testes ficam de fora: um teste PRECISA citar o
 *  termo que ele trava, e reprová-lo por isso tornaria a régua impossível. */
function fontesDeTexto(): string[] {
  const saida: string[] = [];
  const anda = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const cheio = join(dir, nome);
      if (statSync(cheio).isDirectory()) { anda(cheio); continue; }
      if (!/\.(ts|tsx)$/.test(nome)) continue;
      if (/\.(test|spec)\.(ts|tsx)$/.test(nome)) continue;
      saida.push(cheio);
    }
  };
  anda(SRC);
  return saida;
}

/**
 * Os termos vetados pela §12 da bíblia que dá para ler em fonte.
 *
 * `motivo` é o que aparece no erro — quem tropeçar nisto daqui a um ano precisa
 * entender a proibição sem abrir a bíblia.
 */
const TERMOS: { termo: string; re: RegExp; motivo: string }[] = [
  {
    termo: 'Weave',
    re: /\bWeave\b/,
    motivo:
      'o par EN de `data` NÃO é "Weave" — *the Weave* é a trama de magia de ' +
      'Forgotten Realms / D&D, franquia banida. A bíblia §6.6 fixa **Braid** ' +
      'para lore NOVO; o ponto que já existe é exceção declarada abaixo.',
  },
  {
    termo: 'Vírus/Vacina/Virus/Vaccine (rótulo)',
    re: /(Vírus|Vacina|Vaccine|\bVirus\b)/,
    motivo:
      'a tríade Virus/Data/Vaccine é o sistema de atributos assinatura de outra ' +
      'franquia, não vocabulário genérico do gênero. ⚠️ O DONO DECIDIU MANTER o ' +
      'rótulo em 21/09/2026 (REGISTRO-DE-DECISOES §14.4), e os arquivos onde ele ' +
      'já está são exceção declarada abaixo — o que este termo trava é a volta ' +
      'dele num arquivo NOVO. Ruptura / Trama / Guarda são vocabulário de MUNDO ' +
      '(bíblia §6.6), para lore, não rótulo de interface.',
  },
  {
    termo: 'Glitchtama',
    re: /Glitchtama/,
    motivo:
      '"-tama" é eco fonético de marca registrada de brinquedo, e aparece num ' +
      'app de bichinho virtual, que é a classe de produto onde essa marca é ' +
      'mais forte. ⚠️ O DONO DECIDIU MANTER em 21/09/2026 (§14.4): o que este ' +
      'termo trava é o espalhamento para arquivo NOVO, não o que já existe.',
  },
  {
    termo: 'domador/treinador/tamer',
    re: /\b(domador|domadora|treinador|treinadora|tamer)\b/i,
    motivo:
      'fronteira de PI direta com o vocabulário de outra franquia. O jogador é ' +
      '**você**, em 2ª pessoa — a bíblia §12 não tem palavra para "quem treina" ' +
      'porque ninguém treina ninguém neste universo.',
  },
  {
    termo: 'digievolução/digievoluir',
    re: /\bdigi[ée]volu/i,
    motivo: 'marca de terceiro. O termo é **forma** / **mudar de forma** (§12).',
  },
  {
    termo: 'mundo digital',
    re: /\b(mundo digital|digital world)\b/i,
    motivo:
      'colisão frontal com o nome do mundo de outra franquia. O lugar se chama ' +
      '**a Malha** / the Mesh (bíblia §3).',
  },
];

/**
 * AS EXCEÇÕES: onde cada termo vetado está, e por decisão de quem.
 *
 * Medido em 21/09/2026. **Todas foram ACEITAS pelo dono no mesmo dia** — a
 * coluna `proposta` guarda a proposta que as cobria e que ele fechou.
 *
 * **Como usar:** esta lista não precisa encolher. Se um dia o dono reabrir e
 * trocar o termo num arquivo, tire o arquivo daqui — o 3º teste reclama
 * sozinho quando isso acontecer e a linha ficar sobrando.
 */
const EXCECOES: Record<string, { arquivos: string[]; proposta: string }> = {
  'Weave': {
    proposta: 'P1 — par EN do galho `data`. ACEITO PELO DONO em 21/09/2026',
    arquivos: [
      // O único ponto no app: o léxico de nome de skill, que compõe
      // "Weave of <algo>" e vai para a Página do Pet. O verbo comum em
      // minúscula ("weave protective magic", em `oracle.ts`) NÃO é alvo — o
      // que colide é o nome próprio, e por isso a regex exige a maiúscula.
      'src/utils/soulProfile/ficha/skills.ts',
    ],
  },
  'Vírus/Vacina/Virus/Vaccine (rótulo)': {
    proposta: 'P1 — rótulo dos três galhos. ACEITO PELO DONO em 21/09/2026',
    arquivos: [
      'src/components/GuideModal.tsx',
      'src/components/HelpModal.tsx',
      'src/components/PlayCard.tsx',
      'src/types/attributes.ts',
      'src/utils/i18n.ts',
      'src/utils/itemArt.ts',
      'src/utils/oracle.ts',
      'src/utils/shop.ts',
      'src/utils/sprites.ts',
    ],
  },
  'Glitchtama': {
    proposta: 'P5 — rótulo do item. ACEITO PELO DONO em 21/09/2026',
    arquivos: [
      'src/App.tsx',
      'src/components/ActivitiesPage.tsx',
      'src/components/CompanionHUD.tsx',
      'src/components/DungeonGame.tsx',
      'src/components/HelpModal.tsx',
      'src/components/ItemsWindow.tsx',
      'src/components/NightmareBattle.tsx',
      'src/contexts/GameStateContext.tsx',
      'src/utils/dungeon.ts',
      'src/utils/gainArt.ts',
      'src/utils/itemArt.ts',
      'src/utils/shop.ts',
      'src/utils/specialItemUse.ts',
    ],
  },
};

describe('régua da narrativa — vocabulário da bíblia (§12)', () => {
  const fontes = fontesDeTexto();

  it('nenhum termo vetado aparece fora da dívida declarada', () => {
    const novos: string[] = [];

    for (const { termo, re, motivo } of TERMOS) {
      const permitidos = new Set(EXCECOES[termo]?.arquivos ?? []);
      for (const arquivo of fontes) {
        const rel = relative(RAIZ, arquivo).split('\\').join('/');
        if (permitidos.has(rel)) continue;
        if (!re.test(readFileSync(arquivo, 'utf8'))) continue;
        novos.push(`${rel} → "${termo}"\n      ${motivo}`);
      }
    }

    expect(
      novos,
      'termo vetado pela §12 da bíblia num arquivo fora da tabela EXCECOES.\n' +
        'Os termos aceitos pelo dono (21/09/2026) ficam onde já estavam — ' +
        'espalhá-los para um arquivo novo é uma escolha nova. Use o termo ' +
        'canônico, ou declare o arquivo aqui com a decisão que o cobre.',
    ).toEqual([]);
  });

  it('a dívida não aponta para arquivo que não existe mais', () => {
    const fantasmas: string[] = [];
    for (const [termo, { arquivos }] of Object.entries(EXCECOES)) {
      for (const rel of arquivos) {
        if (!existsSync(join(RAIZ, rel))) fantasmas.push(`${termo}: ${rel}`);
      }
    }
    expect(
      fantasmas,
      'a tabela EXCECOES cita arquivo inexistente — ela vira mentira em silêncio, ' +
        'que é exatamente o modo de falha que esta régua existe para impedir.',
    ).toEqual([]);
  });

  it('todo arquivo da dívida ainda contém o termo (senão a linha sobra)', () => {
    const resolvidos: string[] = [];
    for (const { termo, re } of TERMOS) {
      for (const rel of EXCECOES[termo]?.arquivos ?? []) {
        const cheio = join(RAIZ, rel);
        if (!existsSync(cheio)) continue;
        if (!re.test(readFileSync(cheio, 'utf8'))) {
          resolvidos.push(`${termo}: ${rel}`);
        }
      }
    }
    expect(
      resolvidos,
      'estes arquivos já não têm o termo vetado: tire a linha da EXCECOES.\n' +
        'Exceção que sobra depois do trabalho feito vira ruído, e ruído é o que ' +
        'ensina o próximo leitor a ignorar a tabela inteira.',
    ).toEqual([]);
  });
});

describe('régua da narrativa — a bíblia não apodrece', () => {
  it('todo caminho `src/…` citado na bíblia existe', () => {
    const texto = readFileSync(BIBLIA, 'utf8');
    const citados = new Set(
      [...texto.matchAll(/`((?:src|functions|workers|desktop)\/[^`]+?\.(?:ts|tsx|js))`/g)]
        .map(m => m[1]),
    );

    const sumidos = [...citados].filter(rel => !existsSync(join(RAIZ, rel)));

    expect(
      sumidos,
      'a bíblia cita arquivo que não existe. A §10 (mecânica → significado) só ' +
        'vale enquanto cada linha aponta para código real — uma citação morta é ' +
        'como este repositório já perdeu o `CLAUDE.md` para o apodrecimento.',
    ).toEqual([]);
  });

  it('as doze leis estão todas declaradas na tabela de leis', () => {
    const texto = readFileSync(BIBLIA, 'utf8');
    const faltando = Array.from({ length: 12 }, (_, i) => `L${i + 1}`)
      .filter(lei => !new RegExp(`\\*\\*${lei}\\*\\*`).test(texto));

    expect(
      faltando,
      'lei citada pelo documento e ausente da tabela da §2. As leis são o que ' +
        'impede lore novo de virar cobrança; uma lei que só existe na referência ' +
        'não obriga ninguém.',
    ).toEqual([]);
  });
});
