# Histórico — como chegamos aqui

> **Dono:** doc-historiador · **Data:** 16/11/2026 (sincronização do delta `b0c1e59c..6b7773143`, 363 commits de 09 a 16/11/2026, nova §1.8 com os dias 10–15/11 por tema e o dia 16/11 por PR); anterior: 09/11/2026 (sincronização do delta `5229b1be..62f204e1b`, 271 commits de 02 a 09/11/2026: nova §1.7 e nota de contagem na §1; **lacuna declarada** — a sincronização de 02/11 não tocou este doc, então 21/10–01/11 segue sem entrada própria); anterior: 30/09/2026 (sincronização do delta `ae366480..5edfcfba`: §1.5 ganha o item de 30/09 — inglês como língua principal, três prédios em Jogos, duelo fantasma, hub de benchmarking e o Actions parado; título da §1.5 passa a 10–30/09); anterior: 27/09/2026 (sincronização do delta `78ef5367..c510c7e4`, correções pós-F3 da minimal-ui: §1.5 ganha a linha das duas correções pós-F3 de 24/09 (`7b4819e6`, `c510c7e4`); anterior: 24/09/2026 (delta `c7bca6d0..78ef5367`: §1.5 ganha dois itens — a incubação WP4.29 de 22/09 e as fatias F1–F6 da minimal-ui de 23–24/09; anterior: 22/09/2026, 3ª sincronização do dia, delta `cd66940f..cf6315e1`: §1.5 ganha **#102–#107** — merge da QA Rodada 2, o livrinho ilustrado + PDF + gerador, o one shot de prólogo e a execução das 32 respostas do dono; anterior no mesmo dia: SHA de `a6c1cd8a`/#100–#101 e a linha da QA Rodada 2; anterior: 21/09/2026, QA Rodada 1; 09/09/2026)) · **Estado:** verificado em 16/11/2026 por doc-verificador (delta `b0c1e59c..6b7773143`: contagens 363/65/3926 e por dia refeitas por `git log`, ~45 SHAs conferidos por `git log -1`, `§N` contra os `##` do REGISTRO, PRs por `--grep`); anterior: verificado em 09/11/2026 por doc-verificador (delta `5229b1be..62f204e1b`, escopo: só o que mudou em 09/11/2026 — os nota de contagem da §1 e a §1.7; todos os SHAs citados conferidos por `git cat-file -t` e por assunto/data em `git log -1`, os `§N` do REGISTRO contra os títulos `##`, e as contagens por comando: `git log --oneline 5229b1be..HEAD | wc -l` → 271, `--merges` → 37, por dia 14/22/67/64/4/21/79, por mês `2026-10` 1786 · `2026-11` 355, `rev-list --count 5229b1be` → 3281, total → 3552; símbolos por `grep` em `src`/`functions`/`public`; corrigido o que consta no texto da §1.7); restante verificado em 30/09/2026 por doc-verificador (delta `ae366480..5edfcfba` — os 10 SHAs do item novo da §1.5 conferidos por `git log -1` (data 30/09/2026 e assunto batem), a causa do Actions contra HANDOFF-LOCAL-SEM-ACTIONS §1, os rótulos de [10 §5, §6, §10 e §13] contra os `##` do doc 10; corrigidos o título da §1.5 (10–24/09 → 10–30/09) e a lista de temas citados); anterior: verificado em 27/09/2026 por doc-verificador (delta `78ef5367..c510c7e4` — os dois hashes, as mensagens e os arquivos conferidos com `git show --stat`); anterior: verificado em 24/09/2026 por doc-verificador (delta `c7bca6d0..78ef5367` — os 18 SHAs dos dois itens novos da §1.5 conferidos por `git log -1`, `git log --merges c7bca6d0..78ef5367` → vazio, `git log --oneline 78ef5367 | wc -l` → **1.117**; título da §1.5 passa a 10–24/09, âncora sem link em `docs/`; anterior: 22/09/2026, §1.5 conferido contra `gh pr list --state merged --json number,title,mergedAt` e `git log --oneline` → **1.080** commits; anterior: 10/09/2026, doc inteiro)
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

Atualização de 09/11/2026 (a tabela acima é a de 09/09 e não foi remedida linha a linha): o mesmo
comando, rodado em 09/11/2026 no HEAD `62f204e1b`, dá `2026-08` 358 · `2026-09` 767 · `2026-10` 1786 ·
`2026-11` 355 (até 09/11); `git rev-list --count 5229b1be` → **3281** (02/11) e `git log --oneline | wc -l`
→ **3552** (09/11). Outubro sozinho tem mais commits que agosto e setembro juntos.

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
(`48e4e3dd`, 30/07), o pacote renomeado para `com.soulmon`
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

### 1.5 10–30/09/2026 — wireframes, identidade, narrativa, som S16, QA geral, QA Rodadas 1 e 2, incubação, minimal-ui

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
- **22/09 — incubação de 30 min (WP4.29)**, sem PR no assunto (`git log --merges c7bca6d0..78ef5367` →
  vazio): a spec muda em `a04b9a71` (D-G8b), `c03df6c8` (D-G5b + escopo v1) e `9e65601a` (D-G8c);
  o código em `8be8f9c5`; o furo do Renascimento/upgrade em `ae16d213`; a página de Evolução deixa
  de dizer "toque para evoluir" durante a incubação em `355959b4`; o canvas de deriva DER-23…27 em
  `7e1fa45d`. Discussão: [10 §3](10-DISCUSSOES-E-DECISOES.md).
- **23–24/09 — minimal-ui (Home + Mapa)**: arquitetura e plano em `70292e34`, respostas D1–D6 em
  `17765819`; fatias **F1** `292533a6` (Home e Mapa de topo, barra inferior sai), **F2** `78dc6ddb`
  (Home B), **F3** `aa76886b` (Mapa com as 6 áreas), **F4** `1f1b969c` (`AreaScene`+`AreaSheet` e
  os 6 NPCs), **F5** `ac631987` + `708fa034` (áreas com conteúdo, `AreaView`), **F6** `11d9bf31` +
  `cfee570b` (código morto, copy PT/EN, manual); `78ef5367` nomeia o NPC do Laboratório. Discussão:
  [10 §11](10-DISCUSSOES-E-DECISOES.md). Contagem: `git log --oneline 78ef5367 | wc -l` → **1.117**.
- **24/09 — as duas correções pós-F3**: `7b4819e6` tira o saldo do Mapa de cima da arte do "Jogos"
  (canto inferior direito, `zIndex` 2) e instala `@capacitor/app` de verdade, movendo o botão físico
  de voltar do Android para `src/utils/androidBack.ts` — na Home ele passa a **minimizar** em vez de
  fechar o app; `c510c7e4` troca os glifos vetoriais de linha fina pela **arte em pixel do squad de
  arte** (`src/assets/soulmon/icones-ui/`, componente `PixelIcon`) nos nove ícones de UI e põe a
  moldura `chip-moeda` em 9-slice no saldo do Mapa. As fatias F1–F3 tinham usado os glifos por
  engano.
- **30/09 — inglês como língua principal, três prédios em Jogos e o Actions parado**: a decisão do
  dono de que o inglês é a língua principal entra em `7d638dcc` (docs) e `3a56de2f` (nomes, manual
  e testes); a área Jogos ganha Salão, Ateliê da Mente e Refúgio em `6d0d1e17`, com o balanço em
  `b596b4e2` e as decisões do dono em `78146c6c` e `7a4bf5b3`; o duelo fantasma do Torneio é
  `2e4cc8ca`; o hub de benchmarking é `6d44c0f5` e os portões locais sem Actions são `d13131da`
  (causa corrigida em `5edfcfba`: cobrança desde 16/09/2026). Discussão:
  [10 §5, §6, §10 e §13](10-DISCUSSOES-E-DECISOES.md).

### 1.6 20/10/2026 — no ar na Google Play (teste fechado)

- **20/10 — no ar na Google Play (teste fechado), divulgação para recrutar testadores; a premissa "ninguém usou" vence.**
  A partir daqui há usuários reais: save, chave e contrato passam a exigir compatibilidade
  ([`CLAUDE.md` › Compatibilidade](../../CLAUDE.md); decisão em `REGISTRO-DE-DECISOES.md` §148;
  régua `src/contexts/saveCompat.contract.test.ts`). Discussão: [10](10-DISCUSSOES-E-DECISOES.md).

### 1.7 02–09/11/2026 — formas, jornada do Foco, Fenda e a árvore de evolução

Sincronização do delta `5229b1be..62f204e1b`: `git log --oneline 5229b1be..HEAD | wc -l` → **271**
commits em 7 dias com commit (`git log --date=short --format=%ad 5229b1be..HEAD | sort | uniq -c`:
02/11 14 · 03/11 22 · 04/11 67 · 05/11 64 · 06/11 4 · 08/11 21 · 09/11 79), dos quais 37 merges
(`git log --merges --oneline 5229b1be..HEAD | wc -l`). Agrupado por tema, sem listar os commits;
cada tema aponta a decisão em `REGISTRO-DE-DECISOES.md` (a numeração `§N` tem colisões, ver o
fim da seção) e a discussão em [10](10-DISCUSSOES-E-DECISOES.md).

- **Evolução, formas e exibição** (05–09/11): troca lateral de forma grátis (§225) e piso "evoluir
  nunca reduz" (§229) em 05/11; elemento combinado por estágio (§232); em 09/11, `formaSnapshot` —
  cada forma carrega seu elemento e skills (§257, `9c433dee`), atributos x10 na tela
  (`560d96b2`, `statExibido`), HP base da Arena no Duelo (§252, `2ddd1ff6`, `hpExibidoPvp`),
  "Degenerar" até o rookie (`fb4f344b`), ícones de ataque/defesa/velocidade (`ef96e3f3`) e a **árvore
  de três caminhos** com ícone de estágio (§259, `21116569`, `ESTAGIO_ICONE_SET`) no lugar das abas
  de galho. A aba Selvagens junta rookie ao mega numa lista só (§254, `0231803a`).
- **Foco/Oficina e a jornada** (05–09/11): sessão sem lista conclui (§238) e dá a chave do
  Calabouço (§239, `77112497`); em 08/11 a **jornada** substitui a descida da masmorra no foco
  (§247, fases 1–5: `489f2014`, `d181f195`, `cadab3d1`, `61ef7d34`, arte pintada `9c923aad` e
  `9914bb49`); em 09/11 card de tempo no topo, só relógio (§256, `4657fa17`) e chave esmaecida no
  lugar do cadeado, com modal do cenário (§255 do Foco, `0743d18b`).
- **Fenda (Rift) e masmorra** (08–09/11): masmorra com andares por elemento e poções deixadas com o
  Soulmon (§249, `d7dfa91d`); ponto de retorno de 2 em 2 camadas (§251, `92e4ecc7`,
  `DUNGEON_RETURN_EVERY`); arte de "Chama Azul" corrigida e guarda de arte por elemento (§255 da
  Fenda, `0867fdb9`); 10 **criaturas paralelas** como inimigos (§258, `331bc120`); cenário que gira
  entre as camadas dos compostos (§260, `206f3cab`); formas dos combinados 212–261 como inimigos
  (§261, `46a1242a`). Glitchtama passa a 1% por marco, no máximo 1 por semana (§226).
- **Combate e poção** (03–08/11): alvo por toque, especial rápido, corte × concussão e corte à
  distância que cresce (§227; `4bf4a6f1`, `dafadfe5`, `8c2c6743`); efeito real nos 11 elementos sem
  efeito (§236); cura do especial calibrada (`59a7f162`); poção de elemento mais barata e oferta da
  Vesca (§250, `35314730`; `912f6348`: curados com essência, drop e Cambista).
- **Social, cartas e Home** (04–09/11): amigos por convite, presente e treino (§243, `458aeb86`,
  `9634070c`); Mensageiro/Papus com cartas e a caixa na Home (§241, §246, §248; `c720b27b`,
  `565efbff`); ícone de carta só com carta e "!/?" das missões sobem sem carta (`fd7eef5d`,
  `486df94f`); Guilda dos Mercenários só com tarefa de um dia (§245, `13a9ff77`); NPC 412, Bastion, no
  portão do Calabouço (§243 de 06/11, `e65a9297`).
- **Minijogos, Refúgio e Feira** (02–05/11): o Refúgio devolve metade da energia (§217, `05763b41`),
  minijogos do Salão custam energia, chips redutores no lugar do Chip Triplo (§219), desafio do dia
  da Feira (§193 de 04/11, `6d1a7b2d`), Restaurante do Mercado abre (`10b4bebf`), Chuva de Almas em
  tela cheia e chefes no splash.
- **Arte e identidade** (02–09/11): rodada 5 de arte, coliseus por faixa, banners
  victory/defeat, intro em painéis animados, cena do ovo-cristal e cerimônia de evolução em 6 tempos
  (`release: v249` a `v253`); regra máxima de identidade (`c2764605`); criatura do Oráculo fora da
  régua (§234); Thassia com arte nova (`a1aa18d1`). Higgsfield segue vetado para gerar; a fila está em
  `docs/ASSETS-A-GERAR.md` (gerar no ChatGPT).
- **Simulados** (05/11): 170 perfis, evolução por faixa, novos em Rookie, teto Champion, formas sob
  demanda (§233, §235; `8246d370`, `ef5ed637`).
- **Privacidade, widget e feedback** (04–09/11): feedback direto ao revisor com retenção de 30
  dias (`ac4f1136`, `c652b823`); widget único e moldura V-Pet por elemento (`a1f2f421`, `f13c521b`);
  política de passos pelo Health Connect publicada antes do recurso e `PRIVACY_VERSION` sobe para
  `2026-11-09` (§253, `0e6b7e72`; só banner informativo, sem reaceite obrigatório).
- **Build, cache e entrada** (03–09/11): `CACHE_VERSION` v248 → v260 (`public/sw.js`; v249–v253 pelos `release:` do período); em 05/11 os assets com hash
  ganham o cache `soulmon-assets-v1`, que o bump não apaga (`aafcc2e7`); `index.js` volta ao orçamento
  (`422f4e52`); guildCopy e o modal de feedback saem do chunk de entrada (`4662a086`); Soulsmith vira
  mapa de chakras (`ba61a08f`) e a Vitra fala primeiro (`119b5a6f`).
- **Release e GM**: AAB beta4 (`3321a17e`, versionCode 24), beta5 (`e940c5d2`, 25) e **beta6**
  (`a4336d56`, 26, `1.3.0-beta6`, 08/11). Em 09/11 `a4f90382` tentou `run_worker_first` para as
  páginas `/gm/*` e `9454d68a` o **desfez no mesmo dia** (derrubou `/api/*` em produção: o GET
  devolvia o `index.html` do SPA) — ⚰️ `run_worker_first` não deve ser habilitado; as páginas `/gm/*`
  não abrem no navegador por causa do SPA fallback.

⚠️ Numeração do registro: no delta, `REGISTRO-DE-DECISOES.md` repete `§220`, `§221` e `§222` (04/11: decoração, ramos e escada da Arena × ramos arquivados, widget e nome do especial), `§242` e `§243` (Passeio e
Amigos × as respostas do dono) e `§255` (Fenda × Oficina do Foco), e `§257` aparece antes de `§251`;
a referência segura é título + data. Contagem: `grep -n '^## §2[0-9][0-9]' docs/REGISTRO-DE-DECISOES.md`.
Lacuna: 21/10–01/11 (849 commits entre `126a7d514` e `5229b1be`) não teve sincronização deste doc na
rodada de 02/11; o que dessa janela aparece aqui só entrou por decisão registrada no delta.

### 1.8 09–16/11/2026 — beta9 a beta12, Hexsmith, Fenda infinita, companheiro invocado e o pacote de 16/11

Sincronização do delta `b0c1e59c..6b7773143`: `git log --oneline b0c1e59c..HEAD | wc -l` →
**363** commits em 8 dias (`git log --date=short --format=%ad b0c1e59c..HEAD | sort | uniq -c`: 09/11 40 ·
10/11 74 · 11/11 31 · 12/11 34 · 13/11 18 · 14/11 42 · 15/11 25 · 16/11 99), dos quais 65 merges
(`git log --merges --oneline b0c1e59c..HEAD | wc -l`); total do repositório `git log --oneline 6b7773143 | wc -l`
→ **3926**. Os dias 10–15/11 não tinham sincronização: ficam por tema, sem listar commit a commit; o dia
16/11 vem à parte, por PR. A numeração `§N` do REGISTRO tem colisões (ver o fim da seção); a referência
segura é título + data. Discussão de cada decisão: [10](10-DISCUSSOES-E-DECISOES.md).

**10–15/11, por tema**

- **Release**: AAB beta9 (`b1fcf4d8f`, versionCode 29, 10/11), beta10 (`eb6ced092`, 30), beta11
  (`3f715b5c3`, 31, `1.3.0-beta11`, com as 20 molduras do V-Pet) e a beta12 para produção (`8c7b4a804`,
  versionCode 32, 13/11, #897). `a9abd642a` (#888) criou o modo demo de evolução instantânea, só para
  gravação de vídeo; o botão DEMO do portão voltou a aparecer por regressão do #897 e foi escondido de
  novo em 16/11 (`fde8a4056`, #976, REGISTRO §446 de 16/11).
- **Hexsmith** (10–13/11): Luvas com 4 ataques (#777), fragmentos 3x a 4x mais caros (#783), trocar nome
  do Soulmon e do especial por 200 Bits (#808), tabela de criação Item/Custo com poção e tooltips (§305
  e §307 de 12/11), Equipar ⇄ Desequipar por HEX (§323) e as 7 coroas por família do especial (§359,
  `46e6f413e`).
- **Feira, Missão e Treino** (10–14/11): feira de verdade na volta da Missão (#770), vendedores
  pendentes (#773), encontro garantido (#820), Missão da Feira que sobrevive a fechar o app (§367,
  #909) e alarme nativo `feira-missao-volta` de uma vez só (§368, #912); aba Treino (Sparring) sem
  ranking (#769) e tickets do Treino (#771); compra em duas fases e dia fixo da conta (#792).
- **Combate, elementos e arena** (10–15/11): mix de ataques e estágio variado dos oponentes (#778, #782),
  especiais variados e ~80% de ataques à distância como Magia (#811, #813), DoT e cura no turno de quem
  carrega (§334), escudo que não é imunidade (§327), efeito de status como marcador no canto do sprite
  (§328, §330) e 13 folhas de FX novas (§336); descritores de elemento autorais (§407) e quatro
  rondas de correção (§408, §411, §412); Ultimate sorteia o nº de elementos por tabela de pesos (§403,
  #945) e 14 Ultimates de 2 componentes (§405, #952); cenários de elemento (`queimada` §409, bosque de
  cerejeiras §410); Arena livre com 4 desafios (§370) e último adversário dropando em dobro (§384).
- **Foco, missões e hábitos** (11–14/11): Prepare to Focus com escolher a tarefa, baú da sessão, porta e
  sala de descanso, ciclos 25/5 (§300, §301); Prioridades (ICE adaptado) no lugar da matriz de Eisenhower
  (§313); missões de NPC em rodízio semanal só com prédio aberto (§318); lista única de 10 categorias
  (#825); chave do Calabouço vale 48 h (§299); journal e Focus Workshop viram semanais (#823).
- **Social e cartas** (11–14/11): presente, convite de amizade e de clã pela caixa do Papus (#807, §358),
  busca de "Convidar" achando quem está com o PvP desligado (§351, decisão do dono) e quem ainda não
  está no índice (§356), convite recusado bloqueia o par por 7 dias (§388) e o pop-up do Papus só na
  1ª carta (§390). Doação diária do clã 50/100 e Buffs no lugar da Loja (#779).
- **Economia e segurança** (10–15/11): aprimorar peça custa Bits em curva crescente (#772), masmorra
  ×0,2 e Avançado ×1,5 (§372), Bit comprado com Créditos em 3 pacotes com teto de 1.000/dia no
  servidor (§373, #919), teto de Bits pela Agulha de bússola (§393), Pesadelo com 25% menos dano
  (§392); QA rodada 1 de segurança (#785–#788), QA r4 (§381–§390, `dfd7a2ad0`, `ad592b5fd`, `eaa3eea77`)
  e a catraca anti-slop com baseline gravado (§379, #925; fechamento `6502f7e74`, #931).
- **Arte e UI** (11–15/11): 88 cosméticos de tema e elemento (#800), 33 fundos da Home refeitos (§377,
  #923), ícone de estágio colorido pela cor do caminho (§369, §394), CTA do site em telas de celebração
  (§364) e o botão `CtaButton` (§316), 57 peças de decoração de Honra (§391) mais ouro envelhecido e
  cristal (§397, §399), 20 decorações novas (§406) e as 33 refeitas (§398), "Elemento novo" como carta
  grande no fim da atividade (§401, #941).

**16/11/2026 — 99 commits, PRs #957–#998**

O dia fecha como o "pacote de 16/11": os PRs entram na `main` e `qa(pacote)` (`f4f244c0f`, `5171d8887`,
`6b7773143`) deixa antislop, contratos e o manual 06-REFERENCIA verdes. `a62cb5d14` renumera no REGISTRO
os `§446/452/457/461` duplicados de PRs paralelos para `§463–§466`. Comando para listar o dia:
`git log --format='%ad %h %s' --date=short --since=2026-11-16 --until=2026-11-17`.

| PR | Hash | O que entrou | REGISTRO |
|---|---|---|---|
| #957 | `32d4b0870` | Pesadelo: janela de 1,2 s antes de o inimigo atacar | §430 |
| #958 | `8b873807a` | Passeio paga na hora, sem timer; "Tarefa criada"; linha Stroll na Home; meta de passos | §413 |
| #959 #960 | `a0eb246fb`, `5003a2fd3` | Retrospectiva de segunda com bônus ao hábito mais difícil; cartão semanal de domingo removido | §431, §432 |
| #961 #962 #964 | `2b5625856`, `77a7ad200`, `c00425753` | Retrospectiva: chama da alma animada, card liso e versão 3 (cristal com chama, título por qualidade, instância única) | §433, §434, §436 |
| #963 | `3acc5ce2d` | Missões da Lasca e da Panora viram semanais | §435 |
| #965 | `808686698` | Tabela de dificuldade §232 vira peso do sorteio de inimigos | §437 |
| #966 | `32a9fd8b2` | Arte das 5 linhas v1 (som, eletricidade, tempo, arcano, marcial) trocada no lugar | §438 |
| #968 #969 | `773d10cf1`, `ec896ccaf` | Amizade que sumia (corrida do perfil) e chat que fecha fora; lint do ChatBox | §439 |
| #967 | `17d080187` | Pacote A: 205 formas de combinados por elemento e estágio | §440 |
| #970 | `827170b58` | Rift infinito: sem teto por level/Vínculo, limite diário de 30 lutas | §441 |
| #971 #972 | `c19689de1`, `428cbea0a` | Vileza passa a "Fel" em inglês; nome do especial coerente com o efeito | §442, §443 |
| #973 #979 #980 | `842621c5f`, `762209378`, `4d30be052` | Companheiro invocado: fundação atrás de flag, 32 sprites, combate/servidor/cena | §444, §447, §449 |
| #974 #977 | `4a9e2e1d5`, `aa19397be` | Rift em conjuntos de andares com mini-boss; mini-boss usa a melhor forma do conjunto | §445, §448 |
| #978 | `b45dd9ca0` | Ramos legados e chefes Ultra das linhas v1 | §463 |
| #982 #983 #985 #989 | merges `65001d893`, `dd74a71a8`, `b874b91fc`, `59715cfaa` | Hexsmith: Coroas de efeito (hot, slow, silence), arte das 6 Coroas, motor lê `specialEffect`, H4 (Coroa equipada faz o companheiro descansar) | §450, §451, §464, §460 |
| #984 | merge `d88e848a9` | Mapa de andares do Rift infinito | §462 |
| #986 | merge `528348120` | Rift vira o sumidouro de energia: sem limite diário, regeneração 80 min por unidade | §453 |
| #987 | merge `a25fb0de5` | Carta de elemento novo ao sair de qualquer atividade, em carrossel | §452 |
| #988 | merge `136059163` | Companheiro invocado com a chave LIGADA no pacote | §459 |
| #990 | merge `86bbdc4dc` | Prédio bloqueado e portão do Bastion só fecham por X ou CTA | §454 |
| #991 | merge `0e37bda67` | O Ultra só abre com as três Megas | §461 |
| #992 #993 | merges `067d99eb5`, `4c675769a` | Prato do Restaurante vai para a pastinha; pasta vira Files/Arquivos e itens viram `<nome>.exe` | §455, §465 |
| #994 #996 | merges `2fb980816`, `5b7d0c675` | Teto de Bits de atividade por categoria e Convite de Duelo (7 por energia na conta paga) | §456, §458 |
| #995 | merge `a553a5ab0` | Calabouço roguelike mais curto (3×5), mesmo prêmio | §457 |
| #997 | merge `24aea63e6` | Passeio sem "Pular"; Feira: dia fechado sem botão | §466 |
| #998 | merge `6643ea626` | Refúgio: bolha em volta do Soulmon na Respiração e chama da alma de 36 quadros (`03bfc12b0`; sem entrada própria no REGISTRO) | — |

⚠️ Numeração do registro: `§446`, `§452`, `§457` e `§461` apareceram em dobro entre PRs paralelos e foram
renumerados em `a62cb5d14` (§463–§466); as seções saem fora de ordem no arquivo (§462 e §460 antes de
§448). No intervalo `§300–§412` repetem-se também `§303`, `§307` (12/11) e os sufixos `§316a/b/c`. Contagem:
`grep -n '^## §[34][0-9][0-9]' docs/REGISTRO-DE-DECISOES.md`.

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
  que o pacote Android vira `com.soulmon` — a tag marca o ponto
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
| **Usuários em produção (2ª virada)** | "Ninguém nunca usou o app em produção" (07/09/2026) | ⚰️ premissa vencida: o app está em teste fechado na Google Play, com usuários reais, e o dono divulga para recrutar testadores; compatibilidade de save vira regra (`CLAUDE.md` › Compatibilidade, `REGISTRO-DE-DECISOES.md` §148) | 20/10/2026 · sem commit único |
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
