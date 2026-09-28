# Ledger — guarda-permanência (WP4.1–4.8)

Dono: `soulmon-guarda-permanencia`. Anexo: `../F-conteudo.md`.
É o domínio com os números mais duros do plano — e o eixo mais fraco do produto.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP4.1 | `daysToEvolve` apagado (D5, opção b) | `VERIFICADO` (06/09/2026) | `grep -c daysToEvolve` em progression/App/Guide/EvolutionPath/dailyReset → 0; teste novo "não existe segundo número de evolução" | **Saiu um SUBSISTEMA inteiro, não um campo.** Eram quatro tabelas de números para uma regra só: `required` (viva), `daysToEvolve` (10/20/30/40/999, morta), `EVOLVE_SEGMENTS` (7/9/11/14/999, no `App.tsx`) e os campos de save `digivolutionSegments`/`…Needed` que ela alimentava — escritos em TODO save de TODO jogador, por anos, e lidos por ninguém. As três últimas foram apagadas. As props do `EvolutionPath` foram renomeadas (`perfectDays`/`gateDays`): elas carregavam o nome do subsistema morto e recebiam `required`. Dois comentários que descreviam a realidade antiga ("iminente mede uma régua, a barra mede outra") foram corrigidos — eram a mesma família de dano. Nada fora de `src/` lia os campos (conferido em desktop/, android/, workers/, functions/), então não houve migração: a chave de um save antigo continua como passageira inofensiva |
| WP4.2 | Ultra sem degeneração forçada (D6) | `VERIFICADO` (06/09/2026) | `ultra.doisCaminhos.test.ts` (8 casos) prova ultra alcançável a partir de UMA linha só de evolução | O topo abria só com as TRÊS megas — e como a árvore sobe por um galho de cada vez, isso exigia **descer e subir duas vezes**: o jogo pedia que o jogador machucasse a criatura de propósito, numa tela que diz "você vai perder o progresso" e "NÃO pode ser desfeita". Contradizia a tese duas vezes (a criatura é "o que dói perder"; a indústria abandonou perda de nível). Agora são DOIS caminhos, nenhum melhor: **coleção** (as três megas, que continua sendo escolha) ou **permanência** (`ULTRA_PATIENCE_DAYS` = 45 dias perfeitos como mega). A regra mora em `canReachUltra` (`types/progression.ts`, dono da árvore) — `getNextEvolution` só pergunta, não decide, senão seria a segunda cópia de uma regra de evolução. O número é UM e mora sozinho (a lição do `daysToEvolve`). O cartão do Ultra e o **guia** passaram a dizer os dois caminhos, com a permanência primeiro — enquanto a omissão durou, quem via o Ultra trancado concluía "preciso descer". Um teste do `spriteTrigger` travava a regra antiga e foi atualizado com o motivo escrito. **Destrava o WP4.19** (rota de redenção), que agora pode voltar a ser o capítulo de quem caiu em vez do caminho oficial do topo |
| WP4.3 | Vínculo depois do nível 13 | `VERIFICADO` (06/09/2026) | `node -e "…bondRewardFor(20)"` ≠ null; teste até L31; nenhuma recompensa duplica item da loja | `bondRewardFor` → null ≥ L14; 9/12 são duplicatas |
| WP4.4 | Estações cíclicas | `RECUSADO` (03/09/2026 — premissa falsa) | teste: `currentSeason()` ≠ null para qualquer data 2026–2036, exceto 28/29 de fevereiro | `coversDay` compara **mês/dia** desde a origem (`seasons.ts`, cabeçalho "O ANO É CÍCLICO") e `seasons.test.ts` já testava 2031; o único `null` é a folga deliberada de 28/29/fev. O anexo F §5 leu a tabela ISO e não a função. Teste novo varre todos os dias de 2026–2036 e trava a premissa — **passa**. Nada a implementar; WP4.5 (vitrine da estação) segue válido |
| WP4.5 | Sumidouro recorrente de Bits | `IMPLEMENTADO` (07/09/2026 — o que foi entregue é o **deep-start**, não a vitrine sazonal) | `grep -c deepStartCost src/utils/dungeon.ts` → ≥1 (a vitrine: `grep -c currentSeason src/utils/shop.ts` → **0**) | ⚠️ **A linha de aceite descrevia OUTRO pacote** e mesmo assim estava `VERIFICADO`: "vitrine muda com `currentSeason()`" nunca foi construída. E o dreno entregue **se auto-obsoleta de graça** — `nextEnemy` chama `setDungeonDifficultyAtLeast(base+1)` em toda run completa, então quatro runs levam a base de 1 a 5 sem gastar um Bit, contra os 400 Bits/semana da compra. Catálogo: 56 itens em Bits somando 8.900; renda ~285/run sem limite diário → **a janela D15–D23 continua exata; o WP4.5 não a moveu** |
| WP4.6 | Álbum de formas vividas + Encontros (molde `DreamDex`) | `VERIFICADO` (07/09/2026 — as duas metades; o ABISMO fica RECUSADO, ver abaixo) | `test -f src/components/BestiaryCard.tsx` + `npx vitest run src/components/BestiaryCard` → 4 testes verdes + screenshot do app rodando (4 de 24, resto em silhueta) ⚠️ **O aceite antigo pedia `BestiaryPage.tsx`, que NUNCA existiu, e o pacote estava `IMPLEMENTADO` com a ressalva culpando o Abismo** — o que faltava era a tela do bestiário. Pior: `bestiary` era gravado no save de TODO jogador e lido por ninguém (até 36 strings crescendo no KV de produção), a terceira repetição do padrão dos WP4.15/4.16. Feito em 07/09 como `BestiaryCard`, com condição PRÓPRIA e **não aninhado no álbum de formas**: o álbum depende de `soulmonStages`, que o jogador grátis não tem — e ele é quem mais roda masmorra. **O ABISMO (andares 6–8) passa a RECUSADO**: não existe tier acima de mega nem arte de ultra, e somar andares hoje pioraria ao mesmo tempo a economia saturada e a escada farmável do Glitchtama. | ⚠️ evidência corrigida em 02/09: **não há roster de 60** — 6 linhas × 4 artes (`DUNGEON_LINE_SPRITES`); WP4.6 vira Álbum de formas vividas + Encontros (G→M), Abismo adiado |
| WP4.7 | Missões semanais repetíveis | `VERIFICADO` (07/09/2026) | `npx vitest run src/utils/weeklyMissions.fiacao.test.ts` → 4 verdes, incluindo "TODA missão do pool tem gatilho no app" + `grep -c "contarMissao(" src/App.tsx` → **12** | ⚠️ O aceite antigo só pedia `test -f` do módulo, e por isso não viu o essencial: o arquivo tinha **ZERO consumidores** — completo, testado e mudo. E era o único sumidouro dos Emblemas (`TOURNAMENT_ITEMS` somam 245; a 3/vitória, ~82 vitórias e a moeda nunca mais compra nada). Fiado em 07/09 com **um ponto único** de contagem (`forWeek` tem de virar a semana no mesmo updater que soma) e a lista no topo do segmento Torneio |
| WP4.8 | "Memórias" aos 30/90 dias + card | `VERIFICADO` (06/09/2026 — cartão dentro do relatório; o PNG compartilhável fica de fora, ver commit) | `test -f src/utils/shareCard.ts` + render test | — |
| WP4.9 | Corrigir "roster de 60" nas 3 fontes + comentário `progression.ts:57-59` | `VERIFICADO` (02/09/2026) | `grep -rn "60 nomes" docs/plano-melhorias --exclude-dir=mobbin \| grep -v "grep -rn"` → 0 (o arquivo de análise do guarda cita a frase falsa como histórico, de propósito); teste `getDungeonEnemySprite` ∈ `DUNGEON_LINE_NAMES` | comentário de `progression.ts:57-59` reescrito (`grep -c 'Roster "selvagem"'` → 0); `F-conteudo.md` e WP4.6 corrigidos; teste novo `sprites.dungeonRoster.test.ts` (6 linhas × 4 artes; `getDungeonEnemySprite` nunca devolve id legado) — **passa** |
| WP4.10 | Datar coleções (`formReachedAt`, `rest.dreamDates`) | `VERIFICADO` (06/09/2026) | `grep -n "formReachedAt\|dreamDates" src/contexts/GameStateContext.tsx src/utils/restWindow.ts` ≥ 2 | Mobbin D7 |
| WP4.11 | **E3** — perfil do amigo sem métrica de desempenho | `VERIFICADO` (06/09/2026) | `grep rank|tasksDone` em `LibraryPage`/`PlayerDetailModal` → 0 + `PlayerDetailModal.semMetrica.render.test.tsx` | A proibição **#21** era violada em três camadas ao mesmo tempo, e a terceira ninguém tinha visto: (1) `rank N` na linha do diretório, (2) `rank N` no cartão do amigo **e a ESCADA inteira** com o estágio atual preenchido, (3) **o diretório era ORDENADO por `rankPoints`** — mesmo sem o número na tela, ordenar por desempenho faz da lista um placar, e a leitura acontece sozinha. A ordem passou a ser por nome, e `getRank` saiu do caminho: o dado não é escondido, ele não é buscado. `tasksDone` e `rankPoints` saíram do FIO (`publicProfile`), não da UI — escondido na tela o campo volta no dia em que alguém desenhar um cartão novo. **Galho é identidade, altura é placar**: fica o sprite e o caminho como palavra, sai a escada. É a condição exata com que D13 ratificou a decisão 8b, então esta entrega a destrava |
| WP4.12 | **E4** missão bloqueada sem 🔒 + `0/N` | `VERIFICADO` (06/09/2026) | render test da aba Missões sem `0/` | vetado no código hoje |
| WP4.13 | **E5** faixa do Torneio lifetime (nunca rebaixa) | `VERIFICADO` (06/09/2026) | teste: faixa após virada de mês ≥ anterior | vetado no código hoje |
| WP4.14 | Criatura visitável (decisão 8), sem estado nem número; depende de WP4.11 | `VERIFICADO` (06/09/2026) | `grep -q visit src/components/LibraryPage.tsx functions/api/community.js` + teste "nunca expõe HP" | não existe hoje |
| WP4.15 | Ligar `BOND_REWARDS` (a escada que nunca entregou) | `VERIFICADO` (06/09/2026) | `grep -c unclaimedBondRewards src/App.tsx` ≥ 1 + `bond.recompensas.test.ts` (9 casos) | As 12 recompensas dos níveis 2–13 estavam escritas e testadas, e `bondRewardsClaimed` **nunca era escrito por ninguém**: um jogador no nível 11 tinha 3 decorações, 2 cenários e 3 sonhos esperando desde sempre. Só o título chegava, porque é derivado — e é isso que explica o defeito ter durado: a única peça da escada que funcionava era a que não precisava de ninguém para funcionar. A regra virou `applyBondRewards` em `bond.ts` (dono único, PURA e **idempotente** — o chamador é um `setGameState` e o StrictMode roda updater 2×). Devolve o MESMO objeto quando não há nada, senão o save seria gravado a cada render. Item já possuído marca o degrau e **não devolve Bits** (ressalva da linha vermelha: reembolso viraria gerador de moeda). Save antigo sem `rest` não ganha um `rest` inventado — o degrau conta como cumprido. Ordem respeitada: **antes** de WP4.3, porque estender uma escada que não entrega é estender código morto |
| WP4.16 | Fiar as estações (nome, caminhos, medalha) | `VERIFICADO` (06/09/2026) | `grep -rn 'ensureSeasonProgress|applySeasonMedal' src/utils/dailyReset.ts` ≥ 2 + `seasons.fiada.test.ts` (6 casos) | **O caso mais caro do padrão da rodada 4:** `seasons.ts` tem ~500 linhas, teste próprio e um cabeçalho com cinco regras inegociáveis — e nenhum consumidor. A medalha da estação **não podia ser ganha por ninguém** desde que o arquivo existe. Quanto mais completo o módulo, menos óbvio que ele está mudo: um arquivo com testes verdes parece um arquivo que funciona. `GameState.season` + `ensureSeasonProgress`/`applySeasonMedal` na virada (nessa ordem, sobre os contadores JÁ atualizados — senão a medalha chega um dia tarde). ⚠️ **A spec mandava o bloco para a aba Missões da Loja, e essa aba não existe mais** (removida num redesenho): foi para a `StatsPage`, ao lado de "dias perfeitos até aqui". Duas travas da ressalva #15/E4 travadas por teste: nada de contagem regressiva (calendário, não prazo) e caminho com progresso ZERO não vira `0/20` na tela |
| WP4.17 | Guia diz o gate real | `VERIFICADO` (06/09/2026) | `grep -c daysToEvolve src/components/GuideModal.tsx src/App.tsx` → 0 | estudo C-P3; APROVADO (rodada 4). **Verificado 06/09:** `grep -c '.daysToEvolve'` em `GuideModal.tsx` e `App.tsx` → 0 e 0; o guia e a barra da página de Evolução passaram a ler `required` (4/5/5/6), o número que `handleEvolve` e `canEvolve` leem. O guia prometia uma escada 2,5× mais longa que a real, na tela que a pessoa abre justamente quando não entendeu a regra. ⚠️ **Achado maior que o pacote:** o `CompanionHUD` declarava, recebia e **nunca lia** `digivolutionSegments`, `digivolutionSegmentsNeeded` e `requiredDays` — três fontes do mesmo número, zero desenhadas, duas vindas do save (`handleEvolve` ainda escreve `digivolutionSegments*` e ninguém lê). As três saíram; teste trava que não voltem |
| WP4.18 | Cron `closeSeason` | `VERIFICADO` (06/09/2026) | `grep -n closeSeason workers/push-scheduler.js` ≥ 1 | estudo C-P4; APROVADO (03/09/2026, rodada 4 — `../estudo/permanencia.md`) |
| WP4.19 | Rota de redenção | `VERIFICADO` (06/09/2026) | `grep -n redeemed src/utils/dailyReset.ts src/App.tsx` ≥ 2 | estudo C-P5; RESSALVA #21 · **D6 respondida em 06/09** (Ultra sem degeneração forçada): a redenção deixa de ser o caminho oficial do topo e volta a ser o que sempre devia ser — o capítulo de quem caiu. Segue DEPOIS de WP4.2 (rodada 4 — `../estudo/permanencia.md`) |
| WP4.20 | Cabeçalho de `dungeon.ts` | `VERIFICADO` (06/09/2026) | `grep -c 'resets monthly\|daily play limit\|costs a real heart' src/utils/dungeon.ts` → 0 | estudo C-P6; APROVADO (rodada 4). **Verificado 06/09:** `grep -c` das três frases → 0; o cabeçalho descreve o arquivo (reset semanal, sem limite, sem gate, derrota sem custo) e o comentário do `DungeonGame` que prometia um coração de custo saiu. ⚠️ **Aceite autodestrutivo pela 2ª vez no plano** (a 1ª foi WP4.9): a nota histórica natural — 'este cabeçalho dizia X' — reproduz as frases que o `grep` procura e reprova o próprio pacote; a nota descreve sem citar, e diz por quê. O teste vai além do comentário e trava a REGRA: `handleDungeonLose` não pode voltar a tocar em coração |
| WP4.21 | Silhueta da próxima forma | `VERIFICADO` (06/09/2026) | `grep -n blur src/components/EvolutionPath.tsx` ≥ 1 | estudo C-P7; APROVADO (03/09/2026, rodada 4 — `../estudo/permanencia.md`) |

## Verdades deste domínio que o guarda defende
- **Recompensa por contagem de tarefas é proibida** (`CLAUDE.md`). WP4.7 respeita: missão é comportamento, nunca "faça N tarefas".
- Tudo que Emblemas e Vínculo entregam é **cosmético** — há teste travando. Se algum dia comprar vantagem, vai para o servidor.
- Perda só sobre item recuperável (moedas, escudos), **nunca** sobre identidade ou progresso acumulado.
- "Última chance" / FOMO que tira é **dark pattern nomeado** (C3). A vitrine da estação volta no ano seguinte.
- O conteúdo real hoje é **muito menor do que o declarado** (mega em 14 dias perfeitos, não 100). Quem citar 10/20/30/40 está lendo dado morto.

## WP4.22b — R-B verde: a medição (22/09/2026)

Simulação adversarial exigida por R-B(ii): 17 planos de alocação, um
concentrado em cada elemento base, 3000 runs cada, seed `20260818`, escola
`conjuracao`, estágio rookie, pool real do bestiário.

**A alocação dirige os atributos de verdade** — 17 pares `principal/secundario`
distintos, um por elemento. O teste não passa por vacuidade (há trava própria
exigindo os 17 distintos, porque um dia em que `getArenaAttributes` parasse de
ler os pontos devolveria `vigor/vigor` 17 vezes e a janela passaria sem medir
nada).

| | |
|---|---|
| melhor escolha | `morte` — 63,8% |
| pior escolha | `vigor` — 60,0% |
| spread | **3,8pp** |
| janela exigida | 40–80%, spread ≤20pp |

**Veredito: passa, com folga larga.** A saída declarada na decisão #73 (a
alocação perder efeito de combate) **não é acionada**. Contexto que ajuda a ler
o número: 20pp é o mesmo teto que `arena.test.ts` já tolera entre as SEIS
ESCOLAS — escolher elemento move menos o resultado do que escolher escola já
movia.

⚠️ **O que a medição não diz**: que a vantagem é zero. São 3,8pp entre a melhor
e a pior escolha. Está dentro do padrão que o projeto pratica, e por isso R-B
fecha — mas quem escrever a copy C-S1 ("pagar nunca deixa sua criatura mais
forte") precisa saber que o número não é 0,0, e escrever o que é verdade.

Aceite (iii) também verde: mudar só a alocação não muda `getArenaPlayerStats`
em nenhum dos 17 casos — o orçamento de poder continua sendo do estágio e da
escola.

## WP4.23 — T-PISO: a régua da spec NÃO passa (22/09/2026) — DEPENDE DO DONO

Medição com 120 perfis sintéticos (seed 20260922) × 3 planos adversários
(tudo-num-só · espalhado · contra-o-oráculo), estágio ultra, orçamento 500.

**A régua de §10.2 — "pares destravados ≥ os da ficha sem plano em ≥95%" — não
foi atingida por nenhum dos três mecanismos tentados:**

| Mecanismo | Pares ≥ auto | Sobra ≥1 par | Identidades de combate |
|---|---|---|---|
| **carve-out de orçamento** (o que está no ar) | 49,7% | 82,6% | **17** |
| média ponderada das afinidades | 41,7% | — | — |
| bias multiplicativo com piso | **62,5%** | **98,3%** | **1** |

**O trade-off é o achado principal, e ele é direto.** O bias multiplicativo
compra o piso — sobe o estrito para 62,5% e o não-desastre para 98,3%, com só
6 fichas zerando em vez de 62 — mas **colapsa as identidades de combate de 17
para 1**: a escolha do jogador deixa de mudar `getArenaAttributes`. Quem pegou
isso foi a trava anti-vacuidade de `arena.alocacao.test.ts`, escrita no
WP4.22b justamente para esse caso. O carve-out preserva as 17 identidades e
paga com 62 fichas zeradas. **Nenhum dos dois atende a régua**, e escolher
entre "a alocação significa algo" e "a alocação não quebra nada" é decisão do
dono.

**A causa é estrutural, não de implementação.** Par destrava com
`min(floor(a/5), floor(b/5)) >= 10`, ou seja **≥50 pontos em cada componente**.
O orçamento do ultra é 500 e a maior base típica tem **62 pontos** (mediana;
mín. 45, máx. 100) — os elementos ficam EM CIMA do limiar. Redistribuir um
quarto da influência empurra vários através dele, nos dois sentidos:

| | |
|---|---|
| ganhou pares | 14,4% |
| ficou igual | 48,1% |
| perdeu 1 | 0,6% |
| perdeu 2+ | 36,9% |

A alocação não DEGRADA a ficha — ela TROCA pares, que é o que escolher
significa. Mas a régua como está escrita proíbe a troca.

**A leitura alternativa, e a medição dela.** O parecer de psicologia (R6.2)
pediu em palavras que o jogador "possa escolher diferente, nunca escolher
quebrado". Por essa formulação, no mecanismo que está no ar: **82,6%
(295/357) mantêm ≥1 par**, e **62 casos zeram**. 62 é muito — é a razão de o
trade-off acima não ser uma escolha óbvia. Os casos que zeram são o gatilho
previsto em R-A(c): a tela nomeia o fato antes do commit, sem impedir a
escolha.

**Estado: a régua da spec segue NÃO ATENDIDA e não foi movida.** O teste
`buildSheet.piso.test.ts` trava os valores medidos como piso de REGRESSÃO
(0,49 estrito e 0,82 não-desastre, os do mecanismo no ar), com a divergência
escrita no cabeçalho. As
três saídas postas ao dono: (a) trocar a métrica para não-desastre; (b) baixar
`ALLOC_FRACTION` até o estrito passar, com o risco de a alocação virar
decorativa (o que a #72 rejeitou); (c) manter a régua e procurar um quarto
mecanismo — sem garantia de que exista, dada a causa acima; (d) trocar o
mecanismo para o bias multiplicativo, aceitando que a alocação não influa no
combate (o que a decisão #73 já autoriza como saída) em troca de 98,3% de
não-desastre.

## WP4.29 — incubação de 30 min na elegibilidade (D-G5b/D-G8b/c/d): `VERIFICADO COM UM FURO` (22/09/2026)

Commit `8be8f9c`, branch `claude/soulmon-creation-process-01ujcm`, **não
mergeado**. Verificação feita contra o CÓDIGO, não contra a descrição do autor.

**Portões, rodados aqui (não herdados):**

```
npx tsc --noEmit                          → TSC_APP_OK
npx tsc -p tsconfig.server.json --noEmit  → TSC_SERVER_OK
npx tsc -p desktop/tsconfig.json --noEmit → TSC_DESKTOP_OK

npx vitest run
 Test Files  1 failed | 362 passed (363)
      Tests  1 failed | 4885 passed | 1 expected fail | 2 skipped | 4 todo (4893)
 FAIL tests/convertToWebp.test.ts > reescrita que FALHA (arquivo somente-leitura)

npx vitest run src/utils/spriteTrigger.esperaMinima.test.ts \
  src/utils/spriteTrigger.semPrazo.contract.test.ts \
  src/utils/spriteTrigger.test.ts src/components/filaDeAvisos.contract.test.ts
 Test Files  4 passed (4) · Tests  55 passed (55)
```

A única falha é o artefato conhecido do sandbox rodar como root (root ignora
permissão somente-leitura) — confirmado isolando o arquivo. ⚠️ **Na PRIMEIRA
execução da suíte inteira houve uma SEGUNDA falha**
(`SoulmonOnboarding.portao.render.test.tsx:247`) que **não reproduziu** nem
isolada nem na segunda execução completa: é flake de poluição entre arquivos,
não regressão deste pacote — mas fica registrada, porque flake que ninguém
anota é flake que vira "sempre foi assim".

**Veredito por condição do parecer (`vetos.md` › Parecer — WP4.29):**

| # | Veredito | Prova lida no código |
|---|---|---|
| **R-I** | `CUMPRIDA` | `semPrazo.contract.test.ts` recorta o bloco do aviso no `App.tsx` e reprova dígito, unidade de tempo, `setInterval`/`Date.now`/`progress`/`remaining`; e trava o ticker em `60_000`, reprovando `1_000`/`setTimeout`. A copy é palavra grossa nos dois idiomas |
| **R-J** | `CUMPRIDA` | `INCUBATION_MIN_MS` tem dono único provado por `grep -rln` em `src/` (um arquivo); nenhum `* / +` sobre o valor; o bloco não menciona `accountTier`/`paid`/`bondLevel`/`petPassive`/`gamePoints`/`credits`/`emblems` |
| **R-K(b)** | `CUMPRIDA` | `R-K(b): o ESTADO é idêntico com 30 min e com 30 dias` compara `JSON.stringify` dos dois. Nenhum caminho premia chegar cedo. Nenhum push, badge ou chave de widget foi acrescentado (o bridge não conhece `incubation`) |
| **R-L** | `CUMPRIDA PELA METADE` | A metade da degeneração está certa e testada (`voltou.since['champion-virus'] === T0`; libera aos 30 min do relógio ORIGINAL). **A fronteira de identidade NÃO está implementada** — ver o furo abaixo |
| **R-M** | `CUMPRIDA` | Estrutural, que é mais forte que o caso de teste: `incubationFor` não recebe `library` (travado na assinatura pela régua), o efeito do `App.tsx` não consulta `spriteBatch`, e `grep` por `hasSprite\|isFormCapped\|isAccountCapped` em `App.tsx`/`EvolutionPath.tsx`/cerimônia → **zero**. Jogador em `sprite-lifetime-cap`, em `sprite-form-cap` ou com geração falha **evolui aos 30 min**; a cerimônia cai em `fallbackSpriteForStage` em silêncio, como já era |
| **R-N** | `CUMPRIDA` | Aviso da Home + `GuideModal` + `HelpModal` dizem as três metades (leva um tempo · volte quando quiser · nada se perde), PT+EN no mesmo commit. ⚠️ **Ressalva de cobertura**: `copy.semFomo.contract.test.ts` varre `src/components`, `src/utils`, `workers`, `android` e `_pushCopy.js` — **não varre `src/App.tsx`**, que é justamente onde a copy nova do aviso mora. O Guia e o Glossário estão cobertos; o aviso da Home só está coberto pela varredura R-I. Lacuna pré-existente, exposta por este pacote |
| **R-O** | `CUMPRIDA COM DESVIO` | O aviso entra na fila declarada, na posição certa (`filaDeAvisos.contract.test.ts` exige `hp` < `incubacao` < `semanal`), e não há fala do pet, modal nem intersticial. **Mas `notified` está no tipo e no higienizador e não é consumido por ninguém**: o aviso reaparece enquanto durar a incubação, em vez de uma vez só. Erra para o lado de informar, não de cobrar — é desvio registrado, não veto |
| **R-P** | `CUMPRIDA` | `spriteTrigger.semPrazo.contract.test.ts` existe, é varredura de FONTE, nomeia a única comparação permitida (`now.getTime() - t >= INCUBATION_MIN_MS`) e reprova vocabulário de expiração. Confirmado que `incubationReady` é a única aritmética de data do módulo, e que ela só libera (sem `since` → `true`; `since` corrompido → `true`) |

### O furo (bloqueante antes do merge)

**A incubação atravessa a fronteira de identidade.** Nem `applyRebirth`
(`src/utils/rebirth.ts`) nem `handleUpgradeRevealed` (`src/App.tsx`) limpam
`incubation` — `grep` por `incubation` em `rebirth.ts` → zero.

O caso é alcançável e não é teórico: o Renascimento **preserva `perfectDays`**
(regra escrita) e devolve o jogador a `rookie`, então ele fica apto na hora; o
`since` da forma de champion que já correu na vida anterior continua no save,
tem semanas de idade, e `incubationReady` devolve `true`. **A primeira
evolução da criatura nova nasce sem incubação nenhuma** — exatamente o
"carimbo herdado que libera na hora" que o parecer nomeou como o ponto em que
R-L perdoa demais. A troca de criatura pelo upgrade é o mesmo defeito, mais
brando (o estágio não volta).

Conserto: `incubation: emptyIncubation()` nos dois pontos + um caso de teste em
cada, e a lista campo-a-campo do teste do Renascimento precisa ganhar a linha —
hoje ela prova que `incubation` passa intacto, que é o comportamento errado.

### Escopo puxado, e o que continua faltando

**O aviso da Home é escopo do WP4.30 e foi puxado para o 4.29**, de propósito:
entregar o portão sem explicação seria a regressão já documentada no
`CLAUDE.md` (barra cheia, gesto sem efeito, "lê como defeito"). Registrado
aqui para que ninguém conte o 4.30 como feito por causa dele.

**WP4.30 NÃO está pronto.** Faltam (a) a superfície da página de Evolução — a
silhueta da próxima forma, aprovada em R-M/§16.1-5 e que é o marcador passivo e
durável que R-K(a) pede — e (b) o consumo one-shot de `notified`. Sem (a), o
jogador que fica pronto **não encontra** o estado "pode nascer" em lugar
nenhum além do botão da Evolução acendendo.

**Alocação de elemento**: confirmado PARQUEADA. `grep -rn "ElementPlan"` em
`src/` → zero; nenhum caminho de produção passa `plano` de alocação (o único
`pending.plano` é o da exportação de dados, outro assunto).

### A conta dos Bits não se move

O WP4.29 não toca economia: não cria nem drena Bits, não muda preço nem
catálogo. **A janela D15–D23 continua exata** — 56 itens permanentes somando
8.900 Bits contra ~360–470/dia (WP4.5 já tinha medido que o deep-start não a
movia). A incubação adia o GESTO da evolução em 30 minutos; ela não adia
nenhuma compra, e portanto não estende o conteúdo por um dia sequer. Quem citar
a incubação como resposta ao esgotamento do catálogo está trocando de assunto.

## Auditoria de completude do bestiário (WP4.6, 27/09/2026)

Escopo: `src/utils/soulProfile/bestiary/pool.json` (617 criaturas), depois do
corte de PI (`779f7815`) e da curadoria nome/tags/descrição (`b6ae2dc0`).
**Não** é sobre design de jogo nem PI — é sobre se o dado bate com o que
`select.ts` (`scoreCreature`) e o pipeline realmente CONSOMEM. Não mexi em
código nem no pool; tudo abaixo é achado, não conserto.

### Achado real #1 — 3 dos 17 elementos-base do class-system não têm NENHUMA
criatura que os alcance na pontuação

`scoreCreature` pontua por `baseElements(c.elementos)`, que resolve um
elemento derivado (`veneno`, `plasma`, `trovao`...) para os componentes base
via `DERIVED_TO_BASE` (tabela de `derivedElements.ts`). O termo de elemento é
o de MAIOR peso na função (`* 0.35` por base batida, é o único termo
proporcional ao vetor de 17 elementos da leitura — os outros quatro somam no
máximo +7 fixo).

Rodei um scan de `elementos` sobre as 617 entradas e cruzei com
`DERIVED_ELEMENT_PAIRS`: **`eletricidade` e `marcial` não aparecem em NENHUMA
criatura**, nem como base direta nem como componente de nenhum dos 16
derivados de eletricidade (plasma, trovão, magnetismo, tempestade, fulgor...)
ou dos 16 de marcial (forja, têmpera, aço, esgrima, arsenal...) — zero desses
32 ids de elemento derivado aparece em `elementos` de qualquer entrada do
pool. **`sombra` está quase tão vazio: só 2 de 617** (as duas variantes do
Sangue-de-dragão — Espiritual e Cristalino — de um total de 5 prefixos
possíveis; nenhum derivado de sombra — abismo, obsidiana, crepúsculo,
espectro, vazio... — aparece tampouco).

Consequência prática: um jogador cuja leitura do oráculo é dominada por
Eletricidade, Marcial ou Sombra (3/17 elementos, uma fatia real de perfis)
recebe pontuação de elemento **ZERO contra as 617 criaturas do pool inteiro**
— a escolha da criatura-inspiração degrada para família/bioma/hostilidade/
tamanho (teto +7), ignorando por completo o eixo mais forte da própria
leitura. Não é falha de código (o pipeline não quebra, sempre há uma faixa de
`MIN_BAND`=24 candidatas por hostilidade/tamanho/família) — é buraco de DADO:
o corpus upstream (`sync-oracle-data.mjs`) simplesmente não gerou nenhuma
criatura com esses 3 elementos entre os 17 do class-system.

Comando usado (reproduzível):
```
node -e "... coleta elementos de pool.json, cruza com DERIVED_ELEMENT_PAIRS de derivedElements.ts ..."
```
Resultado: `eletricidade`→0 ocorrências (direta ou via 16 derivados),
`marcial`→0 (via outros 16 derivados), `sombra`→2 diretas / 0 via 16 derivados.

**Recomendação**: não é conserto de uma linha — precisa de novas entradas no
corpus upstream (space real ou mitológico) com esses 3 elementos, ou ao menos
com os derivados mais óbvios (Trovão/Aço para Eletricidade+Marcial, algo
sombrio para Sombra). Registro para o dono decidir prioridade; não é WP4.6
puro, é upstream de `sync-oracle-data.mjs`.

### Achado real #2 — `bioma` é "Variado" fixo nas 84 variantes "Venenoso",
mesmo quando o NOME cita geografia específica

Confirmado como bug de dado, não decisão de design: as 84 entradas da linha
"Venenoso" (Tigre do Himalaia Venenoso, Urso Polar Venenoso, Leão Subterrâneo
Venenoso, Baobá do Pântano Venenoso etc. — 12 espécies × até 7 variantes
geográficas) têm **100% delas** `bioma: ["Variado"]`, sem exceção — o
modificador geográfico no nome nunca chega ao campo `bioma`. Isso não é
neutro: `scoreCreature` usa `REALM_TO_BIOMA` (`c.bioma.some(b =>
biomas.some(k => b.toLowerCase().includes(k)))`) para dar +2 quando o bioma
da criatura casa com o reino dominante da leitura — e `"variado".includes(k)`
nunca bate com nenhuma palavra-chave de `REALM_TO_BIOMA` (`montanha`,
`pântano`, `gelo`, `oceano`...). Resultado: as 84 entradas "Venenoso" perdem
sempre o bônus de bioma, mesmo para o jogador cujo reino dominante é
literalmente o bioma anunciado no NOME da criatura ("Urso Polar Venenoso"
nunca ganha o bônus de reino `gelo`, apesar do nome). ~14% do pool carrega um
campo estruturalmente inerte.

**Recomendação**: mapear o modificador geográfico do nome (Himalaia→gelo/
picos, Pântano→pantano, Saara/Deserto→deserto, Abissal/Profundezas→oceano,
Selva/Tropical→floresta, etc.) para `bioma` real nessas 84 entradas. É
conserto de DADO (reescrever o campo), não de código — `select.ts` já lê
`bioma` corretamente, só falta o corpus preencher com algo além de
"Variado".

### Não são bugs — checados e descartados

- **`atributos`/`hostilidade`/`tamanho` por prefixo (Titânico/Espiritual/
  Cristalino/Corrompido/Ancião)**: `tamanho` é 100% determinístico por
  prefixo (Titânico=Colossal, Ancião=Enorme, Corrompido=Cristalino=Medio,
  Espiritual=Pequeno — SEMPRE, sem exceção nas 509 entradas com prefixo).
  A soma de atributos escala PERFEITAMENTE com esse mesmo prefixo: nas 95
  famílias que têm as 5 variantes completas, **100% são monótonas** na ordem
  Espiritual < Cristalino < Corrompido < Ancião < Titânico — zero inversão.
  `hostilidade` NÃO segue essa ordem (Corrompido tem a maior média, 4.84,
  maior que Ancião e Titânico) — mas isso lê como temperamento
  (Corrompido=agressivo, Ancião=sábio/calmo), eixo independente de poder, e
  não achei nenhuma inversão DENTRO da mesma família que sugerisse ruído
  aleatório — é consistente entre as 95 famílias completas. O caso citado no
  pedido ("Enorme tem hostilidade média menor que Medio no pool inteiro") é
  real em agregado (2.84 vs 4.68) mas é epifenômeno do fato de `tamanho` ser
  1:1 com prefixo — não é ruído, é o prefixo Ancião (sempre Enorme) sendo
  tematicamente menos hostil. Nenhum conserto necessário.
- **Duplicação Elefante Africano (60, procedural) × Elefante Veneno (1,
  fauna-real)**: são dois MECANISMOS de amostragem diferentes
  (`origem` distingue), overlap pequeno (1/617) e não vale consolidar —
  consolidar exigiria decidir qual dos dois mecanismos "vence", e o custo de
  decisão é maior que o ganho de remover 1 entrada redundante.
- **`biologia` vazio (`[]`) em plantas e criaturas mitológicas**: intencional
  e testado (`curadoria.contract.test.ts` afirma explicitamente que a
  Mantícora deve ter `biologia: []`). Todas as bases com `familia: 'planta'`
  têm `biologia: []` de forma 100% consistente (Welwitschia, Rafflesia,
  Girassol, Carvalho, Baobá, Sakura, Sangue-de-dragão, Mandrágora — 8 bases,
  ~184 entradas) — não é buraco, é convenção (biologia = classe taxonômica
  animal; planta não usa o campo).
- **MAS dois casos dentro desse padrão SÃO buraco real, não convenção**:
  `Urso-d'água (Tardígrado)` (70 entradas, `familia: 'besta'`) e `Dragão-azul
  (Glaucus atlanticus)` (9 entradas, `familia: 'aquatica'`) são ANIMAIS REAIS
  (tardígrado = invertebrado; Glaucus atlanticus = molusco/lesma-do-mar), não
  plantas nem mito, e ainda assim têm `biologia: []` — quebrando o padrão que
  toda espécie animal real do pool segue (Axolote→Anfíbio, Aranha→
  Inseto/Aracnídeo, Cão→Mamífero...). **79 entradas (70+9) deveriam ter
  `biologia: ["Invertebrado"]` (tardígrado) e `["Molusco"]` (dragão-azul)** e
  não têm. É a mesma classe de conserto do achado #2: dado de corpus
  incompleto, não decisão de design.
- **`familia` só tem 6 valores usados no pool inteiro** (`aquatica` 120,
  `besta` 315, `planta` 178, `ave` 2, `draconico` 1, `demonio` 1) — bem
  menos que os "12 reais + ~7 temáticas" que eu assumi no pedido original.
  Rodei o teste real de continuidade de linhagem (`pipeline.test.ts`,
  "maioria das transições preserva a família", limiar `same/total > 0.5`)
  com 80 perfis variados e a razão observada foi **0,98** (315/320) — passa
  com folga folgadíssima, mas não porque o mecanismo de bônus (+4 por família
  igual) seja robusto: é porque a distribuição de família no pool é tão
  desequilibrada (besta=51% das entradas) que, para o conjunto de perfis que
  testei, **98% de TODAS as 400 escolhas em 5 estágios × 80 perfis caíram em
  `besta`** — `ave`/`draconico`/`demonio` (2/1/1 entradas) nunca foram
  escolhidas nenhuma vez. O teste passa, mas mede um efeito quase trivial: a
  "continuidade de linhagem" na prática é "quase tudo vira besta", não uma
  demonstração real de que dragões puxam dragões (há só 1 entrada de
  `draconico` no pool inteiro — literalmente não há segunda entrada dessa
  família para uma linhagem "continuar" nela). Registro isto para quem for
  mexer em balanceamento (fora do meu escopo de completude), mas é
  estruturalmente relevante: o mecanismo de linhagem não tem instância
  suficiente em 4 das 6 famílias (`ave`, `draconico`, `demonio`, e em menor
  grau `aquatica`) para produzir o efeito que o nome do teste descreve.
- **`atributos` com algum valor 0**: só acontece em `familia: 'planta'` (131
  de 178 entradas de planta) — inteligência/velocidade zeradas em planta faz
  sentido temático (sem sistema nervoso, sem locomoção). Nenhum outro campo
  nulo/ausente encontrado fora de `biologia` (achados acima).

### Conta dos Bits

Não mexi em economia — este WP é auditoria de dado do bestiário, não toca
`shop.ts` nem preço. A conta **D15–D23** (56 itens / 8.900 Bits contra
~360–470/dia) continua valendo, sem alteração.
