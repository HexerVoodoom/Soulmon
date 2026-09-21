# Dossiê de cobertura — Soulmon (21/09/2026)

Fonte primária de verificação: `docs/manual/00-MAPA.md` §6 (tabela "todo `.md` de
`docs/` etiquetado vivo/registro/pesquisa/plano" — mantida por `doc-mantenedor` e
travada por `src/docsManual.contract.test.ts`), cruzada com `docs/STATUS.md`,
`CLAUDE.md`, `docs/plano-melhorias/LEDGER.md` e `squad-alpha-runs/ROADMAP.md`
(fora do git — `.gitignore:9`). Convenção de referência: `caminho` + SÍMBOLO,
nunca linha.

## 1. Classificação por documento-fonte

| Doc | Classificação (MAPA §6) | Estado real (prova) | Leitura |
|---|---|---|---|
| `docs/PLANO-EVOLUCAO.md` | plano | **FEITO (parcial permanente)**: guarda a "essência declarada", citada em `docs/manual/01-VISAO.md` §2. O benchmark é histórico; a essência rege regra viva | 3ª |
| `docs/PLANO-PRODUTO.md` | plano | **FEITO nas partes que decidem**: absorvido por `01-VISAO.md` §1, §5, §8, §10 | não prioritária |
| `docs/PLANO-TAREFAS.md` | plano (executado) | **FEITO**: motor de tarefas inteiro em `src/types/taskModel.ts`, `src/utils/habitRhythm.ts`, `src/utils/taskTriage.ts`, `src/utils/restWindow.ts`, `src/utils/rituals.ts` — mapeado símbolo a símbolo em `02-REGRAS-DE-NEGOCIO.md` §23–§45 e na tabela do `CLAUDE.md` | não prioritária (já espelhado) |
| `docs/PLANO-TELA-IDENTIDADE.md` | plano (executado) | **FEITO** — implementada 07/09/2026, mapeada em `03-FLUXO-DE-TELAS.md` §2.3 | não prioritária |
| `docs/SHOP-PLAN.md` | plano (executado) | **FEITO** — `src/utils/shop.ts` + `src/utils/shopBuy.ts` → `applyShopBuy`, régua `src/utils/shopBuy.test.ts` | não prioritária |
| `docs/PLANO-COOP.md` | plano (executado) | **FEITO, com diferenças anotadas no próprio doc** — `src/utils/community.ts` + `functions/api/community.js`, `CoopPanel.tsx` | não prioritária |
| `docs/RENASCIMENTO.md` | **vivo** | **FEITO** — `src/utils/rebirth.ts` (`applyRebirth`, `rebirthRefusal`), `RebirthModal.tsx`; doc é referência ativa, não histórico | 2ª — é doc dono de regra viva |
| `docs/PLANO-DESIGN.md` | plano | **FEITO (a virada "O Visor")** — o que está no ar virou `docs/manual/04-IDENTIDADE-VISUAL.md` §11 | não prioritária |
| `docs/PLANO-MELHORIAS.md` | plano | **PARCIAL, em execução contínua** — 86 WPs sob custódia de 7 `soulmon-guarda-*`; estado durável é `docs/plano-melhorias/LEDGER.md` + `ledger/*.md` por área. Não é "fechado": é o único plano com mecanismo de progresso vivo | **1ª — é o plano ativo do projeto** |
| `docs/PLANO-DESKTOP-STEAM.md` | plano | **PARCIAL** — overlay funcional (`desktop/`), regras de cuidado deixaram de ser cópia (footgun 9), mas o doc é "2ª redação, depois de a 1ª ser medida como falsa" — histórico de já ter mentido sobre o próprio estado | 2ª |
| `docs/ASSETS-A-GERAR.md` | **vivo** | **PARCIAL** — fila de arte por família; §13 é a rodada 2 (21/09/2026, R2-1…R2-6 ✅); execução contínua pela SQUAD-ARTE | 3ª, só se for mexer em arte |
| `docs/BACKLOG-ARTE-GERAR.md` | plano | **plano, não é backlog geral do produto** — é fila específica de produção de arte, "não é backlog de produto" (nota do próprio MAPA) | não prioritária |
| `docs/NARRATIVA-PROPOSTAS.md` | **vivo** | **PARCIAL — 6 de 16 fechadas**: P1, P2, P5, P8, P9, P10 decididas pelo dono em 21/09/2026 (registro em `docs/REGISTRO-DE-DECISOES.md` §14); as 10 restantes seguem `DEPENDE DO DONO` | **1ª se for mexer em narrativa/PI** |
| `PROJETO.md` (raiz) | **registro, OBSOLETO** | assinado "DigiApp" (`grep -c -i digiapp PROJETO.md` → 16 em 10/09/2026); substituído por `01-VISAO.md` + `02-REGRAS-DE-NEGOCIO.md` + `05-ARQUITETURA.md` | não ler — é fóssil pré-rebrand |
| `PLANO_MELHORIAS.md` (raiz, maiúsculo, sem hífen) | **registro, OBSOLETO** | plano de refatoração de 17/06/2026, era DigiApp; **não confundir com `docs/PLANO-MELHORIAS.md`**, que é outro documento ativo. O que sobrou virou `docs/manual/09-HISTORICO.md` §1.1 | não ler |
| `squad-alpha-runs/ROADMAP.md` | fora do MAPA (fora do git, `.gitignore:9`) | **5ª reescrita, contra o código** — HEAD `e8aef62a`, tsc/vitest verificados na data. Documenta uma **falha de segurança aberta em produção** (Fase 1): `authorizeSaveAccess` (`functions/api/_auth.js`) é fail-open sem `FIREBASE_PROJECT_ID`; `/api/save` aceita qualquer chamada, `saveId` é derivável do e-mail | **DEPENDE DO DONO — 1ª leitura se a pauta for segurança/save** |
| `product/soulmon-01/**` (sweeper, ui, balance) | **fora do índice do MAPA** — não citado nenhuma vez em `00-MAPA.md` | Runs de squad antigos (rodadas 1–9 do sweeper, alinhamentos de UI 1–6, balanceamento). Não há como confirmar se o conteúdo ainda é verdade sem ler cada arquivo; o MAPA não aponta dono nem estado | **NÃO CONFIÁVEL sem leitura — é o achado da seção 4 abaixo** |

## 2. Contradições entre docs

| Contradição | Lado A | Lado B |
|---|---|---|
| Nome do produto/marca | `PROJETO.md` e `PLANO_MELHORIAS.md` (raiz) descrevem "DigiApp" como o nome do produto, plataformas e stack | `CLAUDE.md` (topo) e todo `docs/manual/`: "Soulmon nasceu de um fork do DigiApp", nomes/chaves/canais renomeados em 07/09/2026 |
| KV storage | `PROJETO.md` linha 27: `Storage backend \| Cloudflare KV (DIGIAPP_SAVES, PUSH_SUBSCRIPTIONS)` | `CLAUDE.md` (Arquitetura): `functions/api/_kv.js` prefere `SOULMON_SAVES`, cai em `DIGIAPP_SAVES` só por compat — dois nomes aceitos, dono é um arquivo só |
| Existência de dois planos "PLANO-MELHORIAS" | `PLANO_MELHORIAS.md` (raiz) — plano de refatoração DigiApp de 17/06/2026, morto | `docs/PLANO-MELHORIAS.md` — plano ativo com 86 WPs e ledger vivo. **Mesmo nome de arquivo quase idêntico, conteúdo e vigência opostos** — risco real de uma sessão abrir o errado |
| Segurança do save: "resolvido" vs "aberto" | `docs/STATUS.md` (21/09/2026) registra fechamentos de segurança recentes (oráculo e-mail→conta, diretório público, XSS de sprite) como concluídos | `squad-alpha-runs/ROADMAP.md` (mesma data, fora do git) afirma que a causa-raiz continua de pé: `authorizeSaveAccess` fail-open enquanto `FIREBASE_PROJECT_ID` não estiver configurado em produção — **não é contradição de fato, é lacuna de visibilidade**: quem só lê `STATUS.md` não vê que a falha-mãe segue aberta |

## 3. Docs desatualizados (afirmam estado que o código desmente)

Todos já achados e marcados pelo próprio `doc-mantenedor`/`doc-verificador` — não
são achado novo desta varredura, mas seguem valendo citar porque continuam no
arquivo até o dono autorizar a correção:

- `CLAUDE.md` › Áudio: tabela do guard chamada de "DÍVIDA" quando é `EXCECOES` desde `f3654076` — decisão pendente do dono para editar `CLAUDE.md` (D31, `02-REGRAS-DE-NEGOCIO.md` §59).
- `docs/manual/00-MAPA.md` linha 110 já avisa: linhas 11–59 do índice §4.1 foram levantadas do código na mesma rodada, e "onde o `02` divergir, o `02` manda" — ou seja, o próprio MAPA se declara secundário nesse trecho.
- `functions/api/chat.js` (comentário `contextBlock`): afirma que a superfície de suporte "depende do dono" — falso, existe desde `6ad2e629` (achado em `STATUS.md`, 21/09/2026).
- `src/utils/welcomeBack.ts` (cabeçalho): chama de "pendência" o que a §14.3 do `REGISTRO-DE-DECISOES.md` já decidiu.
- `docs/manual/09-HISTORICO.md` × `CLAUDE.md`: `CLAUDE.md` ainda diz "três personagens prontos" — são 6 desde `c11dc49d` (achado registrado em `STATUS.md`, delta `dc72579e`).
- `achievements.ts`/`emblemArt.ts` (cabeçalho): dizem 8 emblemas, são 9.
- `gainArt.ts` (cabeçalho): diz "sem chamada", mas `evolutionBurst` já é desenhado pela cerimônia.

## 4. PONTOS DO PROJETO NUNCA ANALISADOS OU NUNCA DESENVOLVIDOS (vazio real)

1. **`product/soulmon-01/**` inteiro está fora do índice do manual.** `00-MAPA.md`
   nunca cita `product/soulmon-01` — nem como vivo, nem como registro, nem como
   obsoleto. São 30 arquivos (sweeper rodadas 1–9, `ui/frontend-kit-*`,
   `ui/align-round1..6`, `ui/gap-analysis*`, `balance/p0-fixes.md`,
   `balance/carga-diaria.md` — este último É citado por `CLAUDE.md` como fonte
   de P5, então pelo menos um arquivo da pasta é referência viva, sem estar
   indexado). Ninguém tem como saber, sem ler cada um, se os outros 29 ainda
   valem ou já foram absorvidos/superados.
2. **`squad-alpha-runs/` inteiro não vai para o git** (`.gitignore:9`) e não
   está no manual — é a única fonte que documenta a falha de segurança aberta
   em produção (Fase 1 do ROADMAP). Se a máquina que guarda essa pasta for
   perdida, a lacuna de save fail-open perde a única descrição ativa do risco.
3. **Nenhum doc é dono do fluxo "primeiro login depois de ligar `enforced:true`
   em `FIREBASE_PROJECT_ID`".** É o "ponto de não retorno" citado no próprio
   ROADMAP (Bloco 2, passo 4) — não há runbook indexado no manual, só a
   referência a `GUIA-DO-DONO.md` (não conferido nesta varredura se está
   indexado em `00-MAPA.md`).
4. **`src/components/PlayCard.tsx` e `SettingsModal` são candidatos a remoção
   documentados, mas sem doc dono de decisão** — ambos aparecem como "achado,
   não removido" em notas do `STATUS.md`, sem um plano/backlog que rastreie a
   remoção até o fim.
5. **Cobertura de testes E2E/visual fora do escopo dos planos**: todos os
   planos varridos descrevem REGRA (unit/contract test); não há doc dono que
   trate cobertura de fluxo ponta-a-ponta na UI real (o próprio `CLAUDE.md`
   footgun 7 trata isso como workaround pontual de sandbox, não como suite).
6. **A pasta `docs/design/wireframes/**`** é citada pelo MAPA como "porta de
   entrada" via `HANDOFF-WIREFRAMES.md`/`HANDOFF-IDENTIDADE.md`, mas esta
   varredura não abriu o conteúdo interno — não dá para confirmar aqui se as
   13 aprovações de fluxo (Fase 2) têm cobertura de teste visual proporcional,
   ou só de contrato de CSS/token.

## 5. Ordem de leitura recomendada (as 3 que mais economizam tempo)

1. **`squad-alpha-runs/ROADMAP.md`** (Fase 1) — se a pauta tocar em segurança,
   save ou dinheiro: é o único doc que descreve a falha aberta em produção, e
   fica fora do git.
2. **`docs/PLANO-MELHORIAS.md` + `docs/plano-melhorias/LEDGER.md`** — é o único
   plano com progresso vivo (86 WPs, 7 guardas); qualquer outra frente de
   trabalho de melhoria deveria checar aqui antes de propor pacote novo, para
   não duplicar um WP já `PROPOSTO`/`EM CURSO`.
3. **`docs/manual/00-MAPA.md` §6** (a tabela inteira, não só as linhas citadas
   aqui) — é o único lugar que já faz, para TODO `.md` de `docs/`, exatamente a
   pergunta deste dossiê ("o que é isto, e o código confirma?"). Ler esta tabela
   evita reabrir como novidade qualquer plano já executado ou já registrado
   como obsoleto.

**Nunca leia como estado corrente**: `PROJETO.md` e `PLANO_MELHORIAS.md` na raiz
— os dois são fósseis da era DigiApp, mantidos só por rastro histórico.
