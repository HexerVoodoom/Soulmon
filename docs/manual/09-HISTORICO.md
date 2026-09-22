# Histórico — como chegamos aqui

> **Dono:** doc-historiador · **Data:** 22/09/2026 (3ª sincronização do dia, delta `cd66940f..cf6315e1`: §1.5 ganha **#102–#107** — merge da QA Rodada 2, o livrinho ilustrado + PDF + gerador, o one shot de prólogo e a execução das 32 respostas do dono; anterior no mesmo dia: SHA de `a6c1cd8a`/#100–#101 e a linha da QA Rodada 2; anterior: 21/09/2026, QA Rodada 1; 09/09/2026) · **Estado:** verificado em 22/09/2026 por doc-verificador (§1.5 conferido contra `gh pr list --state merged --json number,title,mergedAt` e `git log --oneline` → **1.080** commits; anterior: 10/09/2026, doc inteiro)
> **Verificação:** os comandos `git log` colados ao lado de cada afirmação nesta página — rode-os de novo para reconferir
> **Não cobre:** o CONTEÚDO de cada decisão (isso é `10-DISCUSSOES-E-DECISOES.md`); o changelog linha a linha (`../CHANGELOG.md`, que não se reescreve); regras de jogo em vigor hoje (`02-REGRAS-DE-NEGOCIO.md`)
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

Este documento responde **"como chegamos aqui"**, com o `git log` como evidência.
Toda data vem de `git` (formato `--date=short`) ou de um bloco datado num doc
existente — nenhuma data é lembrança. Toda contagem vem com o comando que a
mediu, colado.

Medido em 09/09/2026: `git log --oneline | wc -l` → **827 commits**,
`git rev-parse --short HEAD` → `90018377`. O repositório cobre de 25/12/2025
(`git log --format='%ad %h %s' --date=short --reverse | head -1` →
`2025-12-25 954a92b7 Initial commit`) a 09/09/2026 (`git log -1 --format='%ad %h %s' --date=short`
→ `2026-09-09 4e77a08a test(redirect): o que dá para provar do redirecionamento, e o que não dá`).

---

## 1. Linha do tempo por era

Comando-base, colado por completo (roda uma vez, vale para toda a seção):

```
git log --date=short --format=%ad | cut -c1-7 | sort | uniq -c
```

Saída (09/09/2026):

| Mês | Commits |
|---|---|
| 2025-12 | 18 |
| 2026-01 | 10 |
| 2026-02 | 5 |
| 2026-03 | 12 |
| 2026-04 | 1 |
| 2026-05 | 0 (nenhuma linha no `uniq -c` — sem commit no mês) |
| 2026-06 | 139 |
| 2026-07 | 101 |
| 2026-08 | 358 |
| 2026-09 | 182 (até 09/09, dia inclusive) |

Quatro eras saem direto desta tabela: um projeto que nasceu em dezembro/2025 e
ficou quase parado de fevereiro a abril/2026 (18 commits em 4 meses), um hiato
total em maio, uma retomada em junho que já é outro produto por dentro, e dois
meses (agosto e setembro) que concentram **540 dos 827 commits** — 65% do
histórico inteiro em 5 semanas.

### 1.1 Era DigiApp (25/12/2025 – 01/04/2026, retomada em 08/03–01/04)

46 commits (18+10+5+12+1, tabela acima) antes do hiato de maio. É o produto
**anterior** ao fork: `docs/CHANGELOG.md` até a entrada `[1.0.0] - 2024-12-28`
(a data da entrada é do produto original, não do commit — o changelog é
registro do DigiApp e não se reescreve, ver `<!-- doc-historico -->` no topo do
arquivo) descreve `DigiEgg`, `Baby I/II`, evolução automática e tabelas de HP
que **não são mais as regras do Soulmon**. O inventário completo do que essa
documentação ensinava de errado está em
`docs/historico-digiapp/LEIA-ANTES.md` — 11 documentos aposentados em
07/09/2026 (`f9a1542b docs: aposentar os 11 documentos do DigiApp e travar a
volta deles`; conferido com `ls docs/historico-digiapp/*.md | grep -v
LEIA-ANTES.md | wc -l` → 11), fora do alcance do `00-MAPA.md` de propósito
(guard próprio em
`src/docsSemMentira.contract.test.ts`).

Os commits desta era não têm o padrão `tipo(escopo): resumo` — mensagens como
`v3`, `b4`, `v5`, `vx`, `vn`, `fixno degenerate`, `eglish`, `english`, `eng3`
(e o `Revert "eng3"` logo depois). É o rastro de iteração rápida sem squad nem
convenção de commit — a convenção `feat/fix/refactor/...` só aparece
consistentemente a partir de junho/2026 (ver 1.2).

### 1.2 Junho–julho/2026 — o produto vira outro por dentro, ainda sem o nome

240 commits (139 + 101, tabela acima). A retomada de junho reconstrói a base:
`74c98138 feat: centralizar localStorage, extrair GameStateContext, lazy
loading de modais` (17/06), i18n completo PT/EN (`c97ac50e`, `f8dedf38`,
17/06), o motor de cuidado atual nasce aqui — carinho por esfregar
(`e77ddb0c Add 8-bit procedural sound effects` 23/06, `20b880c2 feat(carinho):
esfregar o pet para curar` 01/07), cocô com dreno de HP (`7093f167` 01/07),
energia derivada de comida (`29634fc6` 01/07), a Masmorra e a loja 8-bit
nascem (`9f1deb5c` 02/07, `b5140b8a` 02/07), e o Firebase Auth por link de
e-mail entra em 30/07 (`48e4e3dd`).

**A virada de nome**: o primeiro commit com "soulmon" na mensagem é
`748cbaa9 feat(soulmon): Fase 1 — onboarding pergunta-a-pergunta no lugar do
ovo`, 13/07/2026 —

```
git log --format='%ad %h %s' --date=short -i --grep=soulmon --reverse | head -1
```

O primeiro commit que cria `src/assets/soulmon` é **13 dias depois**:
`b174c406 feat(soulmon): evolução manual com cerimônia, sprites placeholder
próprios e UI nova no onboarding/modais`, 26/07/2026 —

```
git log --diff-filter=A --format='%ad %h' --date=short --reverse -- src/assets/soulmon | head -1
```

O mesmo dia (`b28a609b feat(ui): rebrand Soulmon + design system moderno
estilo Duolingo`) é o rebrand visual. De 26 a 31/07 saem, na sequência:
Tournament PvP e Biblioteca (`3f76d697`, 26/07), sprites reais via Higgsfield
(`a5a09ffc`, 26/07), 3 linhas de inimigo próprias da masmorra — Kaelen/Orrin/
Thalindra (`081dd49c`, 27/07), cadastro obrigatório (`2058ff8b`, 28/07),
sistema demo/pago + créditos (`030167a6`, 29/07), login por e-mail
(`48e4e3dd`, 30/07), o pacote renomeado para `com.hexervoodoom.soulmon`
(`af23bbd5`, 30/07) e o overlay Electron (`d18544ee`, 31/07 — é também o
commit da tag `v0.1.0`, ver §3).

### 1.3 Agosto/2026 — redesign "O Visor", motor de tarefas, o dia de 115 commits

358 commits no mês. Três frentes concentram a maior parte:

- **O motor de hábitos e tarefas** nasce inteiro em um commit:
  `f1accb99 feat(tarefas): motor de hábitos e tarefas com mecânicas
  distintas`, 19/08/2026 — os cinco módulos de `docs/PLANO-TAREFAS.md`
  (`habitRhythm.ts`, `taskTriage.ts`, `restWindow.ts`, `rituals.ts` e as
  constantes de `taskModel.ts`) têm essa mesma data de nascimento.
- **O redesenho "O Visor"** começa no mesmo dia — `7ff43fcc feat(design):
  fundação do redesenho — tokens, Visor, ícones Material`, 19/08/2026 — e
  segue em ondas (`00e50734` onda 2, `3f000f74`, `ae284161` fecho do revamp,
  todos 19/08) até 26/08, quando ganha arte própria: 33 decorações e 8
  cenários pintados (`519c7109`), 25 sprites de consumíveis/FX
  (`6614c115`), a varredura de "sintonia" de 400ms (`5dcf5486`).
- **O dia de 115 commits**, 26/08/2026 —
  `git log --format='%ad' --date=short | grep -c '^2026-08-26'` → **115** —
  é uma auditoria de segurança + consolidação rodada em paralelo por
  **worktrees**: 43 dos 86 merges do repositório inteiro
  (`git log --merges --oneline | grep -c "Merge frente/wt-"`) são desse único
  dia, cada um fechando uma frente nomeada (`wt-b3`, `wt-f1`, `wt-d1`,
  `wt-paywall2`, `wt-som`, `wt-desk2`...). É o dia descrito na seção 1 de
  `../STATUS.md` ("Segurança — auditoria de 2026-08") e nos merges "Segurança
  — seis frentes" / "Suprimentos" / "Workflows" listados no cabeçalho do
  mesmo doc.

Entre as duas pontas: o Oráculo ganha o teste psicométrico de 20 itens e mapa
astral real (`13c04afc`, 15/08), a fusão com o class-system e o bestiário
(`235ca40e` PR #6, 17/08, e a sequência de PRs #8–#17 no mesmo dia — ver §5),
e o balanceamento que impede degenerar de compensar mais que cuidar
(`9ce17775`, 14/08).

### 1.4 Setembro/2026 (até 09/09) — separação do DigiApp, Firebase próprio, nomes sem `-mon`, som, QA

182 commits até o dia 9 inclusive. A guinada de premissa do mês está descrita
em detalhe na seção 2 (viradas de premissa); resumo cronológico:

- **06/09**: o plano de melhorias (`e295589e`, 02/09, e a rodada 4 em
  `d9a2ce90`, 03/09) vira 17 pacotes implementados num único dia de sprint —
  rebirth (`e37b7dc8`), o Ultra sem degeneração forçada (`41e866d7`), o canal
  de reação do pet (`f6a3a1bf`), as estações (`51318dbb`), entre outros.
- **07/09**: a separação do DigiApp — projeto Firebase próprio
  (`8073f09a`), chaves de storage `soulmon-*` no lugar de `digiapp-*`
  (`5128ffd0`), a ponte Android deixa de se chamar DigiApp (`977634f1`), o
  binding KV para de exigir sincronia com o painel (`b1be036f`), a Bandai
  sai do bundle/APK/bestiário — `LEGACY_FORM_TIERS` incluído (`cd820d40`), e
  o documento `167ff9ff docs: ninguém nunca usou o app em produção` que
  motiva os 44 pontos citados no topo do `CLAUDE.md`. Os P1/P2/P5 do
  balanceamento de coração também são deste dia (`44b7a7c3`).
- **08/09**: sessão de QA e revisão do app inteiro (detalhada em
  `../STATUS.md`, bloco "🔎 08/09/2026"), o sufixo `-mon` sai dos três
  personagens curados (`056c116b`), a aventura narrada da noite fecha a
  Fase 2 do motor de tarefas.
- **09/09**: a squad de som entrega a Fase 0–3 do eixo sonoro (10 PRs
  mergeados nesse único dia — ver §5), a transcrição por voz é assumida e
  declarada em vez de removida (`06ef9ea0`), a Arena ganha tela
  (`b55ffa5a`), 38 assets de arte "arcano-tech" entram (`271e2185`).

### 1.5 10–22/09/2026 — wireframes, identidade, narrativa, som S16, QA geral, QA Rodadas 1 e 2

Só o que existe no `git log` e no `gh pr list` em 21/09/2026 (`git log --oneline | wc -l` →
**1.080** em 22/09/2026, 1.070 em 21/09; `gh pr list --state merged --json number | jq length` →
maior PR **#107** em 22/09/2026, **#99** em 21/09). O
detalhe de cada PR está na mensagem do próprio merge; este bloco é o índice.

- **10–15/09**: a SQUAD-DESIGN desenha os 13 canvases da Fase 1 (wireframes) e fecha a
  Fase 2 (identidade) — PRs **#50–#84** (`docs/design/`); **#85–#87** (15/09) são a sincronização
  do manual e os dois handoffs da identidade (`55a3940c`, `4f313269`, `4b695322`).
- **21/09 (manhã)**: a bíblia do universo (**#88**, `34f7a851`, `docs/NARRATIVA-E-UNIVERSO.md`)
  e o **QA geral** (**#89**, `f9faf7a7`: 19 frentes, mentiras legais corrigidas, fila do dono
  #11–#39), com a sincronização do manual em **#90/#91** (`f02a3166`, `954a7c03`).
- **21/09 (tarde)**: as 29 respostas do dono (**#92**, `11e9b237`) e a **execução** delas —
  **#93** `42b07bec` (cortesia `grantCourtesy`, `scripts/metrics-report.mjs`, aviso de WebView,
  `FeedbackLink`, banner de termos, roster 64 → 37 com `soulmon-operador` e
  `soulmon-guarda-plataforma`, ADRs 001–003 em `docs/adr/`, fósseis da raiz em
  `historico-digiapp/`) e **#94** `4a8b8049` (`SettingsModal` fora, 40 deps mortas removidas +
  `depsVivas`, `dist/` sem PNG + `orcamentoDeBytes`, `targetSdk 36`, `versionCode 15`,
  `PLAY-FICHA`/`PLAY-LANCAMENTO`). Sincronização do manual em **#95–#98** (`7f0cbf56`, `07d08d7e`,
  `f4086ce0`, `5228145e`).
- **22/09 (UTC; noite de 21/09 BRT)**: **#99** `959e3bee` — o livrinho da Malha (booklet PT+EN
  do universo, `docs/BOOKLET-UNIVERSO.md`; ainda não está nesta branch — só na `main`).
- **21/09 (noite) — QA Rodada 1** (`docs/reviews/2026-09-21-qa-rodada-1/`, 12 frentes sobre a
  execução acima): três FATAIS que nenhuma sessão tinha visto — **GitHub Actions parado por
  cobrança desde 16/09** (`gh run list` → 339 runs `failure` em 2–6 s; nenhum portão de CI rodou
  em 6 dias e ninguém registrou), `billing-ktx:6.2.1` recusada pela Play (só 8.x passa desde
  31/08/2026) e a política de privacidade negando dados que de fato vão ao Groq. Achou também o
  STATUS afirmando um conserto do ledger (WP1.14/WP3.4) que não tinha acontecido. O que essa
  rodada corrigiu é o §3 do seu consolidado e o commit desta branch (`qa/rodada-a`); a fila do
  dono ganhou #40–#53. ⚰️ ~~"este parágrafo foi escrito antes do merge — o SHA fica para o
  próximo `/manter-docs`"~~ — o merge é **#100** `a6c1cd8a` (22/09 04:18Z; `git log -1 --format='%h %ci' a6c1cd8a`
  → 22/09/2026 01:18 BRT: tier derivado, exclusão com tombstone/410, `pushidx`, telemetria oculta,
  política fiel ao Groq, Billing 8, WebView por plataforma; 40 arquivos de teste, suíte 4 266 → 4 631)
  e a sincronização do manual é **#101** `95b18314` (`gh pr list --state merged --json number,mergedAt`).
- **22/09 — QA Rodada 2** (`docs/reviews/2026-09-22-qa-rodada-2/`, 9 frentes sobre `a6c1cd8a` + a
  primeira **medição do ar** + uma **simulação de 90 dias** com as funções puras reais): a lápide
  de conta bloqueava o **próprio titular** por 30 dias (FATAL); as migrações D1 **não estão
  aplicadas** e a 1ª compra Play daria 500 (o STATUS dizia "cai no caminho antigo" — falso); o free
  tier estoura por escrita de KV em ~18 DAU; `METRICS_ADMIN_KEY` estava definida e o worker de push
  deployado desde 21/09 (três rodadas perguntaram sem medir), mas `ENTITLEMENTS_ADMIN_KEY` e
  `FIREBASE_SERVICE_ACCOUNT` não; 3 correções "em correção" da R1 não tinham aterrissado; a
  simulação mostrou que a virada julga só ontem (0 dias completos em 90 para quem faz e não abre
  no dia seguinte), que cair e re-evoluir no mesmo dia cura de graça e que "3×/semana" cobra 3
  corações. Fila do dono #54–#71; `E0-PREREGISTRO.md` e `E0-CONSENTIMENTO.md` nasceram; o inventário
  KV do `07` passou de 11 para 25 famílias. Consolidado: `reviews/2026-09-22-qa-rodada-2/00-CONSOLIDADO.md`.
  O merge é **#102** `592e2c14` (22/09 05:35Z) e a sincronização do manual, **#103** `cd66940f`
  + **#104** `6f29aba0` (o carimbo).
- **22/09 — narrativa ilustrada**: **#105** `917c9465` (o livrinho da Malha ganha **124 figuras**
  — 60 arquivos únicos — em PT e EN, todas por caminho relativo para `src/assets/`: nenhuma cópia,
  nenhum asset novo; se a arte mudar lá, o livrinho muda junto) e **#106** `19f0d1f3`
  (`docs/historias/01-A-CAMADA-QUE-NAO-FECHOU.md` — o **one shot de prólogo**, PT + EN, ilustrado:
  ficção SOBRE o cânone, nunca fonte dele). No meio dos dois, `7d80f8d7` trouxe o
  **PDF mobile-first** do livrinho (`docs/BOOKLET-UNIVERSO.pdf`, 41 páginas, 2,3 MB) e o gerador
  reprodutível `scripts/booklet-pdf.mjs`, atrás de `npm run booklet:pdf` — o PDF é **gerado, nunca
  editado à mão**, e quem mexer no `.md` roda o comando e commita os dois juntos. Página de
  **390 × 844** (a caixa de telefone dos artboards da squad-design), imagens reamostradas por
  `sharp` a 2× a largura de exibição com kernel *nearest* (12,0 MB → 1,1 MB; em Lanczos a grade,
  que É a estética do visor, borraria).
- **22/09 — as 32 respostas do dono (#40–#71) e a execução delas**: **#107** `cf6315e1`
  (22/09 11:52Z). Modelo de receita novo (compra única + **assinatura de IA**, sprite fora,
  construir depois do E0) · oito regras de jogo mexidas pela simulação de 90 dias (🌀 fora das
  conquistas, "Desfazer" de 5 s, `timesPerWeek` só cobra na virada da semana, a virada julga o
  último dia aberto, dreno com as travas da virada, uma virada completa antes de re-evoluir, os 6
  `BondEvent` mudos ligados, Bits por dia completo + teto de minijogo) · SteamID apagado na
  exclusão · encarregado LGPD nomeado · plataformas declaradas · tagline única travada por
  contrato · rota `rebirth-reset` · **ADR-006 aceita** · symlinks `higgsfield-*` fora ·
  **migrações D1 aplicadas em produção**. `CACHE_VERSION` v159 → **v160**; suíte 4 758 → **4 806**.
  Sincronização do manual: **esta**, em `docs/sync-cf6315e1`.

---

## 2. Marcos por sistema — quando cada módulo nasceu

Comando usado para cada linha: `git log --diff-filter=A --format='%ad %h'
--date=short --follow -- <arquivo>` (ou `--reverse ... | head -1` quando o
`--follow` reordena a saída), lendo a **primeira** entrada — a data de
adição do arquivo à árvore, não da última mudança.

| Módulo | Nasceu em | Commit | Observação |
|---|---|---|---|
| `src/utils/dailyReset.ts` | 08/03/2026 | `12cb739a` | Era DigiApp ("Update DigiApp to latest version from UPDATE folder") — o arquivo é anterior ao Soulmon e foi reescrito por cima |
| `src/utils/sounds.ts` | 23/06/2026 | `e77ddb0c` | "Add 8-bit procedural sound effects via Web Audio API" — os 8 sons sintetizados |
| `src/utils/missions.ts` | 09/07/2026 | `db87ec91` | |
| `src/utils/oracle.ts` | 10/07/2026 | `e51dfb71` | |
| `src/utils/shop.ts` | 02/07/2026 | `b5140b8a` | |
| `src/components/DungeonGame.tsx` | 02/07/2026 | `9f1deb5c` | |
| `src/utils/dungeon.ts` | 03/07/2026 | `b7aef95a` | |
| `src/utils/passives.ts` | 07/08/2026 | `49e7f8c1` | Traço de nascimento |
| `src/utils/tournamentSeason.ts` | 08/08/2026 | `93feef6a` | |
| `src/utils/soulProfile/` | 15/08/2026 | `5958fe48` | Os 4 eixos do Oráculo (elemento/papel/alinhamento/reino) |
| `src/utils/habitRhythm.ts` | 19/08/2026 | `f1accb99` | Motor de tarefas — nascem juntos |
| `src/utils/taskTriage.ts` | 19/08/2026 | `f1accb99` | idem |
| `src/utils/restWindow.ts` | 19/08/2026 | `f1accb99` | idem |
| `src/utils/rituals.ts` | 19/08/2026 | `f1accb99` | idem |
| `src/utils/nightmares.ts` | 19/08/2026 | `109654b2` | |
| `src/utils/bond.ts` | 19/08/2026 | `32698731` | Nível de Vínculo |
| `src/components/ArenaGame.tsx` | 18/08/2026 | `8cc0c290` | |
| `src/utils/arena.ts` | 18/08/2026 | `8cc0c290` | O motor de combate (517 linhas) ficou sem tela até `b55ffa5a`, 09/09/2026 |
| `src/utils/careRules.ts` | 01/08/2026 | `8449b5bc` | |
| `src/utils/careCaps.ts` | 25/08/2026 | `1e8f821f` | "tetos de carinho e comida saem do localStorage e vão para o save" |
| `src/utils/poopDrain.ts` | 25/08/2026 | `ec432992` | |
| `src/utils/playerDay.ts` | 26/08/2026 | `b8296e0b` | "o dia dos registros diários vira o dia do JOGADOR, em fuso fixo" |
| `src/utils/specialItemUse.ts` | 26/08/2026 | `dcbeb42d` | |
| `src/utils/weeklyMissions.ts` | 06/09/2026 | `544ff5f3` | Módulo existiu **sem consumidor** desde a criação até este commit (ver `CLAUDE.md`, tabela de regras, linha 🛒 Loja) |
| `src/utils/rebirth.ts` | 06/09/2026 | `e37b7dc8` | Renascimento — só depois do `accountTier:'paid'` no Ultra |
| `src/utils/adventure.ts` | 08/09/2026 | `b29f3523` | Aventura narrada da noite |
| `src/utils/audioBus.ts` | 09/09/2026 | `97245b74` | Barramento único, mata o `AudioContext`-por-chamada |
| `src/utils/loudness.ts` | 09/09/2026 | `97245b74` | Mesmo commit que `audioBus.ts` |
| `functions/api/billing.js` | 30/07/2026 | `5e00a783` | |
| `functions/api/_billing.js` | 31/07/2026 | `3e9eb9eb` | |
| `functions/api/community.js` | 26/07/2026 | `3f76d697` | |
| `functions/api/transcribe.js` | 09/09/2026 | `06ef9ea0` | "o recado falado passou a existir de verdade — e declarado" |
| `workers/fcm.js` | 26/06/2026 | `cf137031` | Implementado, revertido no mesmo dia (`056a6b06`), reintroduzido em 06/07/2026 (`faa98276`) |
| `desktop/` | 31/07/2026 | `d18544ee` | Overlay Electron |
| `android/.../widget/` (nome atual) | 30/07/2026 | `af23bbd5` | Renomeado de `com.digiapp...`; o `WidgetRenderer.kt` original é de 26/06/2026 (`7f97320e feat(widget): 3 variantes de widget`) |

Módulos citados no framework operacional mas ausentes do código atual, com
lápide:

- ⚰️ `src/utils/adventure.ts` **não** tem entrada de "nasceu antes e foi
  renomeado" — é módulo genuinamente novo de 08/09/2026.
- ⚰️ Não existe arquivo próprio `missions.ts` separado de `weeklyMissions.ts`
  no sentido usado aqui — os dois coexistem em 09/09/2026 (missões permanentes vs.
  semanais), ambos citados na tabela.

---

## 3. Tags e versões

- `package.json` → `"version": "0.1.0"` — **nunca mudou**. Conferido em
  `git log -p --format='%ad %h' --date=short -- package.json | grep
  '"version"'`: todas as ocorrências no histórico são `"0.1.0"`.
- Tag `git tag -l` → **`v0.1.0`**, apontando para `d18544ee feat(desktop):
  overlay do pet na barra de tarefas (Windows) + plano Steam`, 31/07/2026
  (`git log -1 --format='%ad %h %s' --date=short v0.1.0`). É o mesmo dia em
  que o pacote Android vira `com.hexervoodoom.soulmon` — a tag marca o ponto
  em que o produto já tinha nome, domínio de app id e overlay próprios.
- `CACHE_VERSION` mora em `public/sw.js`, primeiras linhas — **só o lugar
  entra aqui, nunca o número** (o `CLAUDE.md` já documenta por quê: o
  parágrafo do valor apodreceu três vezes e foi tirado de propósito).
  Consulte o arquivo direto para o valor vigente.

---

## 4. As viradas de premissa

Cada linha: a premissa antiga, a nova, a data e o commit que a virou.

| Premissa | Antes | Depois | Data · commit |
|---|---|---|---|
| **Usuários em produção** | Código e docs (44 pontos, ver `CLAUDE.md`) assumiam save de jogador real em risco | "Ninguém nunca usou o app em produção" — documentado, não decisão de apagar nada | 07/09/2026 · `167ff9ff` |
| **Firebase** | Compartilhado com o DigiApp (implícito) | Projeto próprio `soulmon-app`, Google + e-mail/senha, domínios de produção autorizados | 07/09/2026 · `8073f09a` |
| **`LEGACY_FORM_TIERS`** | 57 nomes de personagem registrado da Bandai no bundle de produção, para "compat de save" de jogador inexistente | Tabela apagada; id fora do esquema cai em `'rookie'` + sprite por hash (arte nossa) | 07/09/2026 · `cd820d40` |
| **`digimonName`** | Campo do bridge/save/chat com dois nomes possíveis, "porque APKs já instalados" (não havia) | Campo único `petName` em cliente, bridge (`pet_name`), chat e push | 07/09/2026 · `c31d9599` / `977634f1` |
| **Chaves de storage** | Prefixo `digiapp-*` / `digiapp_state_v3`, "mantido de propósito" | `soulmon-*` / `soulmon_state_v1`, com migração idempotente só para o save do dono | 07/09/2026 · `5128ffd0` |
| **Nomes curados sem sufixo `-mon`** | Pyrakamon, Akashaoimon, Nimbratamon — a própria regra do `CLAUDE.md` proibindo o sufixo não valia para os três nomes prontos | Pyraka, Akashaoi, Nimbrata (o `id` da linha — `kaelen`/`orrin`/`thalindra` — não mudou) | 08/09/2026 · `056c116b` |
| **Transcrição por voz (chat Supabase)** | Gravava áudio e mandava direto a um projeto Supabase da era DigiApp, com JWT commitado, bloqueado pela CSP, sem `RECORD_AUDIO` no Android, não declarado em lugar nenhum | Funcionalidade real: passa por `functions/api/transcribe.js` (mesma origem, credencial no servidor), declarada em `../PLAY-DATA-SAFETY.md` §2.4 e travada por `src/security/supabase.contract.test.ts`. Fica desligada sem `SUPABASE_PROJECT_ID`/`SUPABASE_ANON_KEY` | 09/09/2026 · `06ef9ea0` |
| **Evolução automática** | A virada do dia evoluía sozinha ao cumprir o critério (`daysToEvolve`, ramo `!MANUAL_EVOLUTION` de `utils/dailyReset.ts`) | `MANUAL_EVOLUTION = true` desde a introdução em `b174c406` (26/07/2026) — o jogador dispara a cerimônia tocando na criatura com a barra cheia; o ramo morto foi apagado em `81f0b515 refactor(evolucao): D5 — apaga daysToEvolve e o subsistema morto inteiro` (06/09/2026) | Nasce 26/07/2026 (`b174c406`); ramo morto apagado 06/09/2026 (`81f0b515`) |
| **Tetos de cuidado (carinho/comida)** | Contadores no `localStorage`, furáveis por troca de aparelho (PWA + APK = 2× o teto) | `careCaps` no `GameState`/save, com migração idempotente das chaves antigas | 25/08/2026 · `1e8f821f` |
| **Dia dos registros diários** | `new Date().toDateString()` — dia do APARELHO, dois celulares em fusos diferentes discordavam do nome do dia | `playerDayKey` em fuso FIXO gravado no save (`playerDayTz`) | 26/08/2026 · `b8296e0b` |

---

## 5. Os PRs mergeados

`git log --merges --oneline | wc -l` → **86 merges** no total. Três formatos
coexistem no histórico:

**(A) `Merge pull request #N` — squash/merge via GitHub, 19 no total**
(`git log --merges --format='%ad %h %s' --date=short | grep -c "Merge pull
request"`):

| Data | Commit | PR | Assunto |
|---|---|---|---|
| 09/09 | `112c751b` | #45 | `som/skill-aprendizado` |
| 09/09 | `70d53195` | #44 | `som/docs-atualiza` |
| 09/09 | `df2a8fd7` | #43 | `som/s15-termos` |
| 09/09 | `81b08d72` | #42 | `fix/kv-undefined` |
| 09/09 | `9e748100` | #41 | `som/s11-s13` |
| 09/09 | `fc26669f` | #40 | `som/s10-emenda` |
| 09/09 | `0d84cdcc` | #37 | `som/docs-som` |
| 09/09 | `456a1631` | #36 | `som-01-fatia2-barramento` |
| 09/09 | `773d45fa` | #35 | `som/status-blocos` |
| 09/09 | `b56f67c9` | #29 | `arte/arcano-tech-main` |
| 18/08 | `229cca22` | #25 | `claude/oracle-teste-personalidade-soulmon-dohefw` |
| 18/08 | `215f5475` | #24 | idem |
| 18/08 | `c15ed619` | #23 | idem |
| 18/08 | `8ad9662f` | #22 | idem |
| 18/08 | `8b5e1cf6` | #21 | idem |
| 18/08 | `bcf8c7c6` | #20 | idem |
| 18/08 | `28e24d02` | #19 | idem |
| 18/08 | `d2d6478f` | #18 | idem |
| 17/08 | `85390ab4` | #17 | idem |

> **Atualizado em 21/09/2026 (QA Rodada 1):** as contagens abaixo são as de 09/09 e param no
> **#45**. Desde então entraram os PRs **#46–#99** (ver §1.5 para o índice por tema; a lista
> completa é `gh pr list --state merged --limit 100 --json number,title,mergedAt`) — quase todos
> squash com `(#N)` no fim da mensagem (formato B). Não foram recontados linha a linha aqui:
> o comando é a régua, e `docs-delta.mjs` nunca lista este doc (`08-governanca-docs-marca-r1.md` §2.2).

**(B) Squash com `(#N)` no fim da mensagem, sem "Merge pull request" — 15 no
total** (`git log --format='%ad %h %s' --date=short | grep -E '\(#[0-9]+\)$'`):
09/09 `ea1a735f` #39 (R-EX + 9 cortes de som); 17/08 a sequência #6 a
#16 da fusão do Oráculo (`235ca40e` #6, `1fcb812e` #8, `ee2c4018` #9,
`262637f5` #10, `c2cebde5` #11, `4fe1a984` #12, `bd0c1fb3` #13, `b62e8870`
#14, `3d164471` #15, `e78799d2` #16); `159ff0fd` #7 (regra de autonomia de
merge, 17/08); e três anteriores ao Oráculo: `fd03187b` #1 (24/07, skills
Higgsfield), `08f00b92` #1 (25/06, bug de speech bubble — numeração reiniciada
entre repositórios/branches), `fda16077` #2 (26/06).

**(C) `Merge frente/wt-*` e outras — 52 no total** (86 − 19 − 15 = 52; a
maioria, 43, é do dia de 26/08/2026 descrito em §1.3 — cada `wt-<nome>`
fecha uma frente paralela da auditoria de segurança/consolidação daquele dia,
rodada em worktrees git separados, não PRs do GitHub). Para listar as 43:

```
git log --merges --format='%ad %h %s' --date=short | grep "Merge frente/wt-"
```

---

## 6. Como consultar o histórico

Comandos de referência, todos usados para escrever este documento:

| Pergunta | Comando |
|---|---|
| Commits por mês | `git log --date=short --format=%ad \| cut -c1-7 \| sort \| uniq -c` |
| Commits contendo uma palavra na mensagem | `git log --format='%ad %h %s' --date=short -i --grep=<termo>` |
| Quando um símbolo apareceu/sumiu | `git log -S<símbolo> --format='%ad %h %s' --date=short` (conta ocorrências; toda mudança de contagem aparece — some com `--reverse` para achar a primeira) |
| Quando um arquivo nasceu | `git log --diff-filter=A --format='%ad %h' --date=short --follow -- <arquivo>` (leia a ÚLTIMA linha se não usar `--reverse`, já que a ordem padrão é mais-recente-primeiro) |
| Ver o corpo de um commit | `git show --format='%ad %h %s' --date=short -s <hash>` (só a mensagem) ou sem `-s` para o diff |
| Merges (PRs e frentes) | `git log --merges --format='%ad %h %s' --date=short` |
| Tags | `git tag -l`, depois `git log -1 --format='%ad %h %s' --date=short <tag>` |
| Commits num dia específico | `git log --format='%ad %h %s' --date=short --since=AAAA-MM-DD --until=AAAA-MM-DD` (o `--until` é exclusivo; some 1 dia para incluir o dia final) |
| Contar commits de um dia | `git log --format='%ad' --date=short \| grep -c '^AAAA-MM-DD'` |

O clone deste repositório é completo (verificado nesta sessão: primeiro commit
25/12/2025, `git log --oneline \| wc -l` → 827) — não é raso, e
`git fetch --unshallow` não é necessário nem deve ser repetido.
