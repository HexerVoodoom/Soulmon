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
