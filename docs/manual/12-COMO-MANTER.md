# Como manter o manual

> **Dono:** doc-bibliotecario · **Data:** 09/09/2026 · **Estado:** verificado em 10/09/2026 por doc-verificador
> **Verificação:** `npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts` (as duas travas descritas aqui) + `node scripts/docs-inventario.mjs` (a medição que alimenta o ciclo)
> **Não cobre:** o CONTEÚDO de nenhum doc (cada um tem dono declarado no próprio cabeçalho) e as regras do jogo ([02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md)). Aqui só se responde "como se escreve, verifica e trava documentação neste repositório".
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

Este documento é a versão **operacional** do método. A fonte canônica das dez regras é
[`.claude/skills/squad-docs/METODO.md`](../../.claude/skills/squad-docs/METODO.md), e o
roster e o contrato de despacho estão em
[`CONTRACT.md`](../../.claude/skills/squad-docs/CONTRACT.md). Este arquivo existe para
**qualquer sessão** — com ou sem a squad aberta — poder tocar em `docs/manual/` sem
apodrecer nada.

O método nasceu de uma medição, não de preferência: em 09/09/2026 o `CLAUDE.md` carregava
cinco referências `arquivo:linha` apodrecidas, quatro contagens erradas (o `src/App.tsx`
"de 1500 linhas" tinha 6212, medido com `wc -l`) e um número de `CACHE_VERSION` que, lido e
obedecido, andaria o cache para TRÁS. **Doc que mente é pior que doc que falta — quem lê
acredita.**

---

## 1. As dez regras, uma linha cada

| # | Regra |
|---|---|
| **R1** | Referência de código é `caminho` + **SÍMBOLO** em crases, nunca `arquivo` com número de linha — a linha escorrega no primeiro commit, o símbolo se reencontra com `grep`. |
| **R2** | Toda regra de negócio tem três âncoras: **dono** (o símbolo que decide), **régua** (o teste que trava) e **decisão** (a linha do registro de decisões ou o bloco datado do STATUS) — sem régua, escreve-se `régua: nenhuma`, explícito. |
| **R3** | Número vem com nome: valor copiado do código cita a CONSTANTE, contagem cita o COMANDO que mediu, com data — nunca "cerca de", nunca "~". |
| **R4** | Nada morto sem lápide: regra que não existe mais só entra com ⚰️ / "não existe mais" / "era …" na mesma linha; doc inteiro de registro leva `<!-- doc-historico -->` no cabeçalho. |
| **R5** | Um dono por documento e um assunto por documento — onde outro doc já é dono, **aponte, não copie** (é o footgun 9 aplicado a prosa). |
| **R6** | Cabeçalho obrigatório em todo doc do manual: dono · data · como verificar · o que NÃO cobre · precedência. |
| **R7** | Datas absolutas (dd/mm/aaaa) — proibido "hoje", "atual", "recente", "novo", "antigo" sem data ao lado. |
| **R8** | Todo doc é alcançável a partir de [00-MAPA.md](00-MAPA.md) em um salto, e todo link relativo resolve. |
| **R9** | Cobertura de referência é executável: todo módulo não-teste das árvores medidas tem entrada em `06-REFERENCIA/`. |
| **R10** | Nada é VERIFICADO por quem escreveu — o carimbo é de outra pessoa/agente, que confere símbolo por símbolo e roda os comandos. |

## 2. O cabeçalho obrigatório (R6)

Cole isto no topo de qualquer doc novo do manual. O guard lê as **40 primeiras linhas** e
exige `Dono:` e `Verificação:`.

```
# <Título>

> **Dono:** <agente ou pessoa> · **Data:** dd/mm/aaaa · **Estado:** rascunho
> **Verificação:** <o comando ou os testes que provam este doc>
> **Não cobre:** <o que fica para outro doc, com o nome do doc>
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.
```

## 3. O ciclo: medir → redigir → verificar → indexar → travar

| Passo | O que acontece | Quem |
|---|---|---|
| **Medir** | `node scripts/docs-inventario.mjs > <scratchpad>/inventario.md`. O inventário é a ÚNICA lista de módulos, exports, campos, chaves e rotas que os redatores recebem. **Ninguém lista de memória.** | `doc-cartografo` |
| **Redigir** | Cada redator escreve **um** doc, lendo o CÓDIGO (não o `CLAUDE.md`), com as âncoras da R2 e o cabeçalho da R6. | os `doc-redator-*` e `doc-historiador` |
| **Verificar** | Adversarial, doc por doc, com a pergunta "o que aqui é falso?". Devolve `caminho — afirmação — evidência — veredito`. Corrige o trivial; devolve ao redator o que muda sentido. **É bloqueante.** | `doc-verificador` |
| **Indexar** | [00-MAPA.md](00-MAPA.md) ganha o doc novo nos três índices (assunto, pergunta, arquivo); [11-GLOSSARIO.md](11-GLOSSARIO.md) ganha os termos novos. | `doc-bibliotecario` |
| **Travar** | Guard verde, e só então commit. | quem estiver conduzindo |

## 4. Os comandos

```bash
node scripts/docs-inventario.mjs            # a medição (aceita --json)
npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts
```

E, antes de qualquer commit que toque em `src/` (portões do `CLAUDE.md`):

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

## 5. O guard ficou vermelho — o que cada item quer

`src/docsManual.contract.test.ts` tem cinco travas. O que segue descreve **o que o teste
faz de fato**, não o que seria bom que ele fizesse.

### (a) todo doc de `docs/` é citado no [00-MAPA.md](00-MAPA.md)

Varre todo `.md` dentro de `docs/` e subpastas — **exceto `docs/historico-digiapp/`**, que
tem guard próprio — e reprova qualquer caminho relativo (ex.: `SOM.md`,
`plano-melhorias/LEDGER.md`) que não apareça como texto dentro do [00-MAPA.md](00-MAPA.md). Docs do
manual também contam pelo nome sem o prefixo `manual/`.

**Conserto:** acrescente a linha do doc no [00-MAPA.md](00-MAPA.md), na seção "os outros documentos",
com a etiqueta certa (vivo · registro · pesquisa · plano) e uma frase do que é. Nunca
deixe um doc de fora "porque é antigo" — doc que o índice não alcança é doc que uma sessão
nova nunca lê. Este item é do **bibliotecário**.

### (b) todo link relativo do manual resolve

Varre os links markdown de todos os docs do manual e confere no disco o arquivo apontado.
Âncoras (`#secao`) **não** são conferidas, e links `http:`/`mailto:` são ignorados.

**Conserto:** corrija o caminho (lembre que os links são relativos a `docs/manual/`:
`../STATUS.md` para o STATUS, `../../CLAUDE.md` para o `CLAUDE.md`). Se o doc de destino
ainda não existe, há duas saídas legítimas e a escolha é de PRAZO: numa rodada em que os
redatores estão escrevendo em paralelo, **linke assim mesmo** e conte com o item (b) ficando
vermelho até o último doc nascer — foi o que esta rodada fez em 09/09/2026, e é por isso que
o guard só precisa estar verde no momento do commit, não a cada arquivo salvo. Se o doc de
destino **não vai nascer tão cedo**, cite o nome do arquivo em crases, sem link, e converta
quando ele existir — link permanentemente quebrado ensina o leitor a ignorar o item (b).

### (c) todo módulo das árvores medidas tem entrada em `06-REFERENCIA/`

Para cada árvore de `ARVORES` (`src/utils`, `src/hooks`, `src/contexts`, `src/types`,
`src/plugins`, `src/components`, `src/security`, `src/deploy`, `src/constants`,
`functions/api`, `workers`, `desktop/renderer/src`, `desktop/electron`), cada módulo
não-teste tem de aparecer, em crases, dentro de algum arquivo de `06-REFERENCIA/`. Testes,
`.d.ts` e as pastas `node_modules`/`assets` ficam de fora.

**Conserto:** acrescente a entrada `### \`caminho/do/modulo.ts\`` no arquivo de referência
da árvore correspondente, com o que o módulo faz e seus exports. Este item é do
**redator de referência** — é ele que impede a referência de virar foto de setembro/2026.

### (d) nenhum doc do manual cita código por `arquivo:linha`

Reprova qualquer linha em que uma extensão de código (`.ts`, `.tsx`, `.js`, `.mjs`,
`.css`, `.kt`, `.java`, `.json`, `.yml`) apareça dentro de crases seguida de `:` e
dígitos. O erro aponta o doc e a linha do DOC (não do código).

**Conserto:** troque o número pelo SÍMBOLO. `src/utils/dailyReset.ts` mais
`HEART_GOAL_RATIO` sobrevive a refatoração; `src/utils/dailyReset.ts` mais um número
aponta, depois do próximo commit, para código não relacionado — e continua parecendo
correto.

### (e) todo doc do manual declara `Dono` e `Verificação`

Lê as 40 primeiras linhas de cada doc do manual e exige as duas palavras.

**Conserto:** cole o cabeçalho da seção 2. Doc sem dono é doc que ninguém atualiza.

### O guard irmão: `src/docsSemMentira.contract.test.ts`

Varre **só os `.md` do primeiro nível de `docs/`** (não entra em `docs/manual/`) e reprova
uma linha que afirme uma regra morta sem lápide — hoje: os estágios que não existem mais e
o nome da chave de save antiga. Um documento inteiro pode se isentar declarando
`<!-- doc-historico -->` no cabeçalho. A marca é **literal** de propósito: a primeira
versão reconhecia a isenção por vocabulário e acusou o próprio aviso escrito minutos antes.

## 6. Carimbar e desatualizar

O campo `Estado:` do cabeçalho tem exatamente três valores, nesta ordem de vida:

```
rascunho  →  verificado em dd/mm/aaaa por doc-verificador  →  desatualizado desde <commit>
```

- **Carimbar**: só depois de conferir símbolo por símbolo (`grep`), caminho por caminho
  (`ls`) e número por número (rodando o comando). Quem escreveu **não** carimba (R10) —
  autor lê o que quis escrever, verificador lê o que está escrito.
- **Desatualizar**: quando uma sessão descobre divergência e não pode consertar na hora,
  troque o carimbo por `desatualizado desde <hash curto>` **com o motivo em uma linha**.
  Pegue o hash com `git rev-parse --short HEAD`. **Nunca apague o carimbo em silêncio** — um
  doc sem carimbo lê como "ainda não verificado", e não como "sabidamente errado".

## 7. Quando abrir a squad, quando editar à mão

| Situação | O que fazer |
|---|---|
| O manual não existe, ou uma rodada completa de revisão | `/squad-docs start` (ou `/documentar start`) |
| Um módulo, tela ou regra mudou e o doc dono precisa acompanhar | `/squad-docs atualizar <assunto ou caminho>` — despacha só o redator dono |
| Suspeita de que a documentação apodreceu | `/squad-docs verificar [doc]` — devolve a lista `afirmação — evidência — veredito` |
| Um doc nasceu à mão fora da squad e o guard ficou vermelho no item (a) | `/squad-docs indice` |
| Só quer saber o estado (dono, carimbo, data, guard) | `/squad-docs status` — não escreve nada |
| Uma frase errada, um símbolo renomeado, um link quebrado | **Edite o doc à mão.** Corrija, ajuste a data do cabeçalho, rode o guard, commit. Abrir a squad para trocar uma palavra é overhead, não rigor. |
| Vai mudar uma REGRA DE PRODUTO | **A squad não decide isso.** Ela DESCREVE o que o código faz e registra onde a decisão vive; quem decide é o dono, no [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md). |
| Vai escrever no `CLAUDE.md` | **Não.** Ele é do dono; o manual só aponta para ele. |

O comando `/documentar` é um atalho para a mesma skill — com argumento vazio ele assume
`status` e, havendo doc sem carimbo ou guard vermelho, `verificar`.

## 8. Precedência, e o que fazer ao achar divergência

**código > teste > `CLAUDE.md` > manual.**

Ao encontrar uma afirmação do `CLAUDE.md` (ou de qualquer doc) que o código contradiz:

1. **O manual descreve o CÓDIGO.** Escreva o que o código faz, com o símbolo.
2. Marque a linha com **⚠️ divergência**, dizendo qual é a outra afirmação e o comando que
   mediu a diferença.
3. Abra um bloco datado no [`STATUS.md`](../STATUS.md) com o achado.
4. **Não "corrija" o `CLAUDE.md` por conta própria** — ele é do dono. Levar o achado com a
   conta na mão é o gesto certo; reescrever o arquivo de outra pessoa não é.

Exemplo real desta rodada, em 09/09/2026: o `CLAUDE.md` chama o gate de PvP do cliente de
`canPvp`; o símbolo não existe em lugar nenhum (`grep -rn "canPvp" src/ functions/
desktop/` não devolve nada) — o que existe é `meetsPvpBond` em `src/utils/bond.ts`. O
glossário registra o símbolo real e marca a divergência; o `CLAUDE.md` fica como está.

## 9. Os donos

| Doc | Dono |
|---|---|
| [00-MAPA.md](00-MAPA.md) · [11-GLOSSARIO.md](11-GLOSSARIO.md) · [12-COMO-MANTER.md](12-COMO-MANTER.md) | `doc-bibliotecario` |
| [01-VISAO.md](01-VISAO.md) · [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) | `doc-redator-regras` |
| [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) | `doc-redator-telas` |
| [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) | `doc-redator-identidade` |
| [05-ARQUITETURA.md](05-ARQUITETURA.md) · [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) · [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) | `doc-redator-arquitetura` |
| `06-REFERENCIA/` (utils · components · hooks-contexts-types · plugins-constants · api-workers · desktop) | `doc-redator-referencia` |
| [09-HISTORICO.md](09-HISTORICO.md) · [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md) | `doc-historiador` |
| a MEDIÇÃO (`scripts/docs-inventario.mjs`) | `doc-cartografo` |
| o carimbo `verificado` — **bloqueante** | `doc-verificador` |
| `src/docsManual.contract.test.ts` (o guard) | `doc-bibliotecario` |
| a linha do manual no [`STATUS.md`](../STATUS.md) | quem conduz a rodada |

Dois redatores **nunca** escrevem no mesmo arquivo na mesma rodada.

## 10. Checklist de fim de sessão

Antes de fechar qualquer sessão que tenha tocado em código ou em documentação:

- [ ] **O doc dono do assunto foi atualizado** — mudou uma regra, mudou o doc que a
      descreve; mudou um módulo, mudou a entrada dele em `06-REFERENCIA/`.
- [ ] **Data do cabeçalho ajustada** no doc tocado, e o `Estado:` coerente (rascunho se
      não foi verificado nesta rodada).
- [ ] **Divergências foram para o [`STATUS.md`](../STATUS.md)** em bloco datado, e nenhuma
      virou edição no `CLAUDE.md`.
- [ ] **Guard verde:**
      `npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts`
- [ ] **Portões, se `src/` mudou:** `npx tsc --noEmit`, `npx vitest run`, `npm run build`.
- [ ] **Commit** em PT-BR, no formato `docs(manual): <resumo>` — e, pela regra de
      autonomia do [`CLAUDE.md`](../../CLAUDE.md), PR e merge ff-only na hora, sem loop de
      check-in.
