# Estudo pré-Mobbin × Permanência — o corpus contra o código

Dono: guarda-permanência (WP4.1–4.14). Data: **03/09/2026**.
Complementa `../mobbin/permanencia.md` (dossiês 7 e 12, já destrinchados em
02/09) — **nada daquele documento é repetido aqui**; quando um achado de lá
muda por causa deste, está dito.

Toda afirmação sobre o código abaixo foi confirmada por `grep`/leitura nesta
sessão. A referência é sempre `arquivo` + **SÍMBOLO**, nunca número de linha.
Onde o grep voltou vazio está escrito `NÃO ENCONTRADO`.

## Fontes lidas (inteiras)

| Fonte | O que cobre |
|---|---|
| `docs/guia-experiencia/07-retencao-engajamento.md` | benchmarks D1/D7/D30, mapa de churn, calendário de push, 25 recomendações, os três eixos de retenção |
| `docs/guia-experiencia/04-monster-taming.md` | V-Pet 97, Pokémon, Monster Rancher, Temtem, Cassette Beasts, Palworld, GO/Sleep, Vital Bracelet; 17 recomendações |
| `docs/guia-experiencia/08-transcricoes-notebooklm.md` | blocos **B4** (creature collector), **C1** (loss aversion, Engelstein), **C2** (Freedom Fallacy), **C3** (dark patterns, só para a régua do FOMO), **C4** (de-gamification) |
| `docs/GUIA-EXPERIENCIA.md` | seções **B.3/B.5/B.7** (D7–D30–D90), **C.1–C.4** (travas e conflitos), **D** (dicas), **E** (roadmap, para conferir o que ele acha que falta), **I** (rodada 2) |
| `docs/guia-experiencia/03-gamificacao-streaks.md` | §1.2–1.3 (benchmarks e regras de loss aversion), §2 (auditoria), §3, §4 (recomendações e guardrails) |
| `docs/plano-melhorias/F-conteudo.md` | o mapeamento do código com as contas (já com a correção do "roster de 60") |
| `docs/plano-melhorias/ledger/permanencia.md` + `docs/PLANO-MELHORIAS.md` §WP4.x | o estado e as specs dos meus pacotes |

Código lido: `src/utils/dungeon.ts`, `seasons.ts`, `missions.ts`, `shop.ts`,
`tournamentSeason.ts`, `tournamentTiers.ts`, `carePattern.ts`, `bond.ts`,
`nightmares.ts` (tabela de recompensa), `restWindow.ts` (`weightedPool`/`rollDream`/
`dexProgress`), `dailyReset.ts` (`getNextEvolution`/`getPreviousForm`/
`degeneratedPerfectDays`), `src/types/progression.ts`; componentes
`EvolutionPath.tsx`, `DungeonGame.tsx`, `TournamentPage.tsx`, `DreamDex.tsx`,
`ShopModal.tsx`, `GuideModal.tsx`, `HelpModal.tsx`, `StatsPage.tsx`,
`DailyReportModal.tsx`, `LibraryPage.tsx`; `App.tsx` (`handleEvolve`,
`handleDegenerate`, `handleEvolveToUnlocked`, fiação de `awardBondXP`);
`functions/api/community.js` (`playMatch`, `closeSeason`, `gift`),
`functions/api/_pushCopy.js`, `workers/push-scheduler.js`.

---

## 0. Três premissas do plano que caíram nesta leitura (antes da tabela)

A regra desta rodada é: **evidência que cita um DADO sem olhar a FUNÇÃO que o
lê está errada até prova em contrário** (foi assim que WP4.4 caiu de manhã).
Apliquei a mesma régua aos outros quatro números do briefing. Dois dos quatro
sobrevivem inteiros (`daysToEvolve` morto; catálogo de Bits esgota D15–D23).
Dois mudam de forma, e apareceu um quinto buraco que nenhuma fonte tinha visto.

### 0.1 As recompensas do Vínculo (L2–L13) **nunca são entregues** — não é "para no 14", é "nunca começou"

O briefing e o `PLANO-MELHORIAS.md` (achado 6, WP4.3) dizem que `bondRewardFor`
devolve `null` a partir do nível 14 e que 9 das 12 recompensas duplicam a loja.
Os dois fatos são verdadeiros **e irrelevantes**, porque:

| O que o grep mostra | Onde |
|---|---|
| `awardBondXP` está fiado em **6** pontos do `App.tsx` (conclusão, dia perfeito, run, torneio, …) — o XP acumula. | `src/App.tsx` `awardBondXP` |
| `bondTitle` chega à UI — o título sob o nome, em **Estatísticas**. | `src/components/StatsPage.tsx` `bondTitle` |
| `unclaimedBondRewards`, `bondRewardLadder`, `bondRewardFor` **não têm consumidor** fora de `bond.ts` e dos testes. | `grep -rn` em `src desktop functions` → só `bond.ts` |
| `bondRewardsClaimed` existe no `GameState` (tipado, hidratado com `strArr`, iniciado `[]`) e **ninguém escreve nele**. | `src/contexts/GameStateContext.tsx` `bondRewardsClaimed` |

Consequência: o vaso de planta do L3 (calibrado para "cair no dia 3" segundo o
cabeçalho do `bond.ts`), o `bg-forest` do L4, os três sonhos exclusivos
(`dream-little-boat`, `dream-lantern-river`, `dream-night-train`) e os móveis —
**nada disso é entregue a ninguém**. O "primeiro sistema de curva infinita"
entrega hoje exatamente **quatro strings** (os títulos), e só para quem abre
Estatísticas. A escada inteira de retenção D1–D7 que o `bond.ts` documenta em
detalhe é código morto na produção.

Isso muda WP4.3 de "estender a escada" para "**ligar a escada, depois estender**"
(ver §2 e candidata C-P1). A frase "9/12 são duplicatas para quem esvaziou a
loja" continua verdadeira para o dia em que a fiação existir.

### 0.2 A medalha de estação **não existe para o jogador** — só o peso ×3 dos sonhos chega

O anexo F (§ Síntese, linha "Medalha estação | 5 runs = 5 dias | 1/trimestre")
e a spec de WP4.7 ("`SEASON_PATHS`: 5 runs = medalha do trimestre em 5 dias")
contam a medalha como conteúdo entregue. Grep de todos os símbolos de
`seasons.ts` fora do próprio arquivo e do teste:

| Símbolo | Consumidor em produção |
|---|---|
| `currentSeason` | **um**: `weightedPool` em `src/utils/restWindow.ts` (repete o sonho da estação `SEASON_DREAM_WEIGHT` = 3 vezes no pool de `rollDream`) |
| `seasonProgress`, `seasonLabel`, `isSeasonalDream` | NÃO ENCONTRADO |
| `SEASON_PATHS`, `startSeasonProgress`, `ensureSeasonProgress`, `seasonMedalStatus`, `applySeasonMedal`, `earnedMedals`, `SeasonProgressState` | NÃO ENCONTRADO (`grep -rn` em `src functions workers desktop` → 0) |

O módulo é puro, tem 40 testes verdes (`seasons.test.ts`, inclusive os três
caminhos da medalha) e o cabeçalho diz "**A fiação no GameState é de outro
dono**" — o outro dono nunca chegou. Hoje o jogador não vê o nome da estação,
não vê os três caminhos, não ganha medalha nenhuma, e a `seasonLabel` que
promete "mais fácil agora, e continua depois" (a frase que separa isto de um
battle pass) nunca é renderizada. O único efeito real das estações é que, nas
manhãs dentro da janela, o sonho sazonal sai mais vezes.

Isso não invalida WP4.4 recusado (as estações **são** cíclicas) nem WP4.5 (a
vitrine). Cria a candidata **C-P2** (fiar o que já existe: PP) e obriga WP4.7 a
tirar `SEASON_PATHS` da lista de "o que já há" (ver §2).

### 0.3 O caminho para o Ultra tem **dois** rebaixamentos possíveis, não um — e os dois são enquadrados como perda

O briefing diz "o único caminho de volta é HP zero". Não é: existe **degeneração
manual**. `EvolutionPath.tsx` oferece o botão em `isPreviousStage` (forma já
alcançada, do galho **atual**), com dupla confirmação, e `App.tsx`
`handleDegenerate` executa com a mesma `degeneratedPerfectDays` (piso
`floor(required/2)`, custo `DEGENERATION_PERFECT_DAYS_COST` = 5).

Mas a exigência de perder continua, e a conta fica assim (verificada em
`getNextEvolution`/`getPreviousForm`, `dailyReset.ts`, e em `isPreviousStage`):

1. rookie → champion-A → ultimate-A → mega-A: **4 + 5 + 5 = 14** dias perfeitos.
2. mega-A → ultimate-A **à mão** (oferecido, porque `ultimate-A` está em
   `unlockedEvolutions` e é do galho atual). Reaparece com `max(2, PD − 5)`.
3. ultimate-A → mega-B: precisa de `required` = 5, logo **+3** dias perfeitos e
   atributos com B dominante (chips ou categoria das tarefas).
4. mega-B → ? A degeneração manual **não é oferecida**: `ultimate-B` nunca foi
   vivido (não está em `unlockedEvolutions`) e `ultimate-A` é de outro galho.
   **Só resta HP = 0**: 4 corações de mega, teto de 1/dia, perdão de ausência
   ≥ 2 dias exigindo abrir o app todo dia para falhar de propósito → ~4–5 dias.
5. ultimate-C (o galho é o que os atributos disserem na virada) → mega-C: **+3**.
6. mega-C → ultra: `required` = 6 → **+6**.

Total: **26 dias perfeitos + uma degeneração manual + uma degeneração forçada
por HP zero (~4–5 dias de falha deliberada)**, contra os "30 + 2 forçadas ≈ D38"
do anexo F. A conclusão de WP4.2 **fica de pé** (o jogo exige perder para
progredir e não explica: a única menção ao Ultra na página é a etiqueta
`ZÊNITE`; `grep -i "megas|three mega|todos os três"` em `EvolutionPath.tsx` →
NÃO ENCONTRADO; `HelpModal.tsx` e `GuideModal.tsx` não citam Ultra). Mas a
evidência da spec precisa dizer "dois caminhos, ambos enquadrados como perda" —
a copy da degeneração manual é literalmente "Você vai perder o progresso além
deste estágio" / "Essa ação NÃO pode ser desfeita".

### 0.4 O guia dentro do app **mente sobre o gate** — e cita o dado morto

`GuideModal.tsx` renderiza `R.rookie.daysToEvolve` etc.: "Rookie→Champion pede
**10** dias perfeitos; Champion→Ultimate 20; Ultimate→Mega 30; Mega→Ultra 40".
O gate real (`handleEvolve`, `canEvolve` em `App.tsx`) é `.required` = 4/5/5/6.
O jogador lê 10 no guia e evolui com 4. `App.tsx` também passa
`digivolutionSegmentsNeeded = daysToEvolve` para o HUD (`CompanionHUD`) — o
único uso de produção do dado morto é para **exibir**. Isto é independente da
decisão D5 (WP4.1): qualquer que seja a escada escolhida, o guia tem de ler o
mesmo símbolo que o gate. Candidata **C-P3** (PP).

---

## 1. A tabela — fonte × código × veredito

Vereditos: **já faz** · **lacuna** · **conflita com a tese** · **não se aplica** ·
**já coberto por WP (qual)**. Fonte entre parênteses = relatório/bloco/seção.

### 1.1 Relatório 07 — Retenção e engajamento

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| (07 §2, "Dias 4–7") Se a 1ª evolução demorar > 7 dias, a maioria nunca vê; garantir ≤ 5 dias. | Gate real = `FORM_REQUIREMENTS.rookie.required` = **4** dias perfeitos (`App.tsx` `handleEvolve`: `if (prev.perfectDays < req)`). | **já faz** — e o guia E #14 já registrou que o problema é o oposto (WP4.1). |
| (07 §2, "Dia 30") Fim da novidade: "Torneio semanal é o único live-ops"; adicionar rotação de conteúdo. | Rodada sex–dom: `tournamentSeason.ts` `getTournamentWindow` → `TournamentPage` (`tournamentWindowLabel`). Estações: `seasons.ts` existe, mas o único consumidor é `restWindow.ts` `weightedPool` (§0.2). | **lacuna** — a rotação está escrita e não chega ao jogador. → **C-P2**. |
| (07 §2, "Dia 90") Teto de conteúdo: mega/ultra atingido, missões completas, 30 sonhos coletados. | Mega em 14 dias perfeitos (`handleEvolve`); `MISSIONS` = 6 alvos únicos (`missions.ts`); `DREAM_CATALOG` = 30 (`dexProgress`). As contas do anexo F confirmam D15–D35 para tudo. | **já faz** (o diagnóstico) — é a onda 4 inteira. |
| (07 §2, "Dia 90", mitigação) "Seasons de torneio com troféus." | **Existe**: `community.js` `closeSeason` dá `pendingTrophies {season, place}` ao top-3; `GameState.trophies`; `TournamentPage` lista os troféus; as 4 vitrines (`TOURNAMENT_ITEMS` `slot:'trophy'`) os exibem no palco. Ressalva: `closeSeason` exige `SEASON_ADMIN_KEY` e o comentário diz "chamado manualmente ou por um cron (ex.: push-scheduler)"; `grep season workers/*.js` → NÃO ENCONTRADO. | **já faz** (mecânica) / **lacuna** (fechamento é manual — sem cron, ninguém ganha troféu). O guia E #36 marca isto como P2 × **G a fazer**: premissa do guia cai. → **C-P4**. |
| (07 §2, "Retorno após ausência") Tela de reencontro explícita + lembrança do período fora. | `DailyReportModal` renderiza `report.welcomeBack`: "Que saudade!" + "Você ficou N dias fora e seu Soulmon não perdeu nada esperando". | **já faz** (versão texto). A cena dedicada é domínio do guarda de retorno (WP de outro ledger). |
| (07 §4) Push de sexta "A arena abriu! \<pet\> está aquecendo". | `functions/api/_pushCopy.js`: três textos (dormir, "pensou em você", "passou pra dizer oi"); `grep -i "arena\|torneio\|tournament"` → NÃO ENCONTRADO. | **lacuna** — fora do meu domínio (push); registrado para o guarda de retorno. |
| (07 §6 #13) Live-ops semanal: Rodada + **1 "visita especial" rotativa** (NPC/cenário na masmorra); FOMO saudável = perder é não ganhar algo extra. | `buildRunScenes` (`dungeonScenes.ts`) sorteia cenários por run; `grep -i "visit\|rotativ\|weekly"` em `dungeonScenes.ts`/`dungeon.ts` → NÃO ENCONTRADO. | **conflita com C2 na forma proposta** (uma "visita" que não se acopla a nada é ponto de ruído) → **já coberto por WP4.7** (missão semanal = comportamento) e pela regra "só cosmético". Não abrir WP de "visita". |
| (07 §6 #16) Seasons de torneio com troféus permanentes. | Ver acima: `closeSeason` + vitrines. | **já faz** (ver C-P4 para o cron). |
| (07 §6 #21) Rotação mensal de cenários/sonhos novos (conteúdo D90). | Sonhos: 12 sazonais em `SEASONS[].dreamIds` (3/estação, trimestral). Cenários/decor: `grep -i season src/utils/shop.ts` → NÃO ENCONTRADO. | **já coberto por WP4.5** (vitrine da estação: 1 bg + 2 decor). A cadência é trimestral, não mensal — e é o certo pelo custo do dev solo (cabeçalho de `seasons.ts`). |
| (07 §6 #22) "Memórias" aos 30/90 dias. | `grep -rn -i "memories\|memórias\|retrospect" src` → NÃO ENCONTRADO. `createdAt` existe no `GameState`. | **já coberto por WP4.8**. |
| (07 §6 #25) Social leve: visitar o pet de um amigo (gate de Vínculo já existe). | `LibraryPage.tsx`: `grep -i visit` → NÃO ENCONTRADO; `meetsPvpBond` (`bond.ts`, L5) é o gate. | **já coberto por WP4.14** (depende de WP4.11). |
| (07 §8) Três eixos: investimento (pet único, evolução, sonhos, troféus) = o mais forte; conteúdo (só Torneio) = o mais fraco. | Confirmado no código: o que é identidade (`evolutionStage`, `unlockedEvolutions`, `rest.dreams`, `trophies`) é monotônico e `applyFreshStart` não toca. O que é conteúdo esgota (F). | **já faz** (diagnóstico) — com a correção de que parte do eixo de conteúdo **já está escrita e dormindo** (§0.1, §0.2). |
| (07 §3) Evento `layer3_used` para masmorra/torneio/dino/loja/sonhos. | `src/utils/telemetry.ts` existe e tem `dungeon_run` (andares 1–5). Não auditei o resto — é WP0. | **não se aplica** (dono WP0). |

### 1.2 Relatório 04 — Monster taming

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| (04 §1 V-Pet) Care mistakes não punem: **selecionam** o galho; nenhum é melhor. | `carePattern.ts` `computeCarePattern` (Constante/Explosivo/Equilibrado) → `patternBranch` → `resolveBranch` só no empate; declara `confident:false` com < 5 conclusões. Teste exige que os três puxem galhos distintos. | **já faz** — é a mecânica que o próprio relatório chama de "mais Digimon de verdade do app". |
| (04 §1 V-Pet) Care mistakes **zeram na evolução**: cada estágio é uma página nova. | `handleEvolve` zera `attributesSinceLastEvolution`; `CARE_WINDOW_DAYS` = 14 (janela deslizante, não acumula). | **já faz**. |
| (04 §1 V-Pet, rec. 1) **Rota de redenção** Numemon → Monzaemon: a forma-castigo tem saída nomeada; degeneração vira capítulo. | `grep -rn -i "redemption\|redenção"` em `src` → NÃO ENCONTRADO (só o id legado `monzaemon` em `LEGACY_FORM_TIERS`). O que existe é misericórdia **numérica**: `degeneratedPerfectDays` = `max(floor(required/2), PD − 5)`. Nenhuma forma, fala ou tela nomeia a volta. `grep -i redenção docs/PLANO-MELHORIAS.md ledger/*.md` → nenhum WP. | **lacuna** — está no guia (V-4, E #19) e **não tem WP em ledger nenhum**. Interage com WP4.2: se o Ultra deixar de exigir a queda, a redenção vira a narrativa da queda **acidental**. → **C-P5**. |
| (04 §1 V-Pet) Morte inaceitável; degeneração já é a versão domesticada, com as travas da Fase 1. | `MAX_HEARTS_LOST_PER_DAY`, `ABSENCE_FORGIVENESS_DAYS`, `WEEKLY_RELIEF_HEARTS` (regras do `CLAUDE.md`); `getPreviousForm` só em `newHP <= 0`. | **já faz** — **mas as fontes discordam**: 04 trata a degeneração como acidente domesticado; o anexo F/WP4.2 mostram que ela é **pré-requisito** do Ultra. O relatório 04 não viu o `ALL_ATTRS.every(mega-*)` de `getNextEvolution`. |
| (04 §1 Pokémon) Dex: completude como meta infinita, sem competição. Análogos: Sonhos, missões, vitrine. | `DreamDex.tsx` (única dex; `dexProgress` só cresce). `MISSIONS` = 6 e acabam. Vitrine = `TOURNAMENT_ITEMS` `slot:'trophy'`. | **já faz** (Sonhos) / **já coberto por WP4.6** (álbum + encontros) e **WP4.7** (missões repetíveis). |
| (04 §1 Pokémon) Shiny: raridade cosmética, zero poder. | `PLAYER_STATS` por **estágio** em `DungeonGame.tsx` e `stagePower` em `community.js` — nenhuma espécie tem stat próprio, então "zero poder" já é estrutural. A variante de paleta não existe (`oracle.ts`). | **não se aplica** a este domínio (é o Oráculo, guia E #46). A régua "zero poder" já vale. |
| (04 §1 Temtem) Paridade total apaga o "meu". | Árvore única por jogador (`progression.ts`: "Cada linha de evolução é ÚNICA por jogador"; `oracle.ts`). | **já faz**. |
| (04 §1 Cassette Beasts) A **fusão** é o clímax mecânico e narrativo; rima com o Ultra. | `oracle.ts` `ultraName` = `Triune…`; `EvolutionPath.tsx` etiqueta `ZÊNITE`/`ZENITH` quando `!areAllMegasUnlocked`. Explicação do que é preciso → NÃO ENCONTRADO em `EvolutionPath`, `GuideModal`, `HelpModal`. | **já coberto por WP4.2** (aceite: "mostra os 3 pisos como horizonte") + guia #50. |
| (04 §1 Palworld) Só transplantar micro-comportamentos idle (dormir, comer, tropeçar); reagir à decoração comprada dá sentido de longo prazo aos Bits. | `CompanionHUD.tsx`: fala idle a cada 3 min (`getIdlePhrase`); recebe `equippedDecor` só para desenhar (`PetStageDecor`). Reação ao item → NÃO ENCONTRADO. | **lacuna** — dono é o HUD/vínculo (guia E #39), não este ledger. Registro porque é o único sumidouro de Bits **emocional** possível: hoje o item comprado é pintura, não relação. |
| (04 §1 GO/Sleep) "Nunca perde, só deixa de ganhar"; reset semanal; tiers em vez de ranking cru. | Masmorra: `onLose` não custa HP ("Você foi derrotado — seus corações continuam intactos"); `getDungeonDifficulty` reseta por `weekKey`; `TOURNAMENT_TIERS` antes do rank. | **já faz** — com a ressalva do Torneio em §1.5 (pontos de rank **descem**). |
| (04 §1 GO Buddy) Vínculo por ações variadas com **marcos visíveis e nomeados**; `bondLevelFor` existe, faltam rostos e nomes. | `BOND_TITLES` (Companheiro/Confidente/Alma Irmã/Vínculo de uma Vida) via `bondTitle` em `StatsPage`. As recompensas materiais **não são entregues** (§0.1). Micro-cerimônia → NÃO ENCONTRADO. | **lacuna** — maior do que o relatório supôs. → WP4.3 reescrito (§2) + **C-P1**. |
| (04 §1 Vital Bracelet) Estagnação no meio da escada + topo caro = produto morto; achatar o topo. | `FORM_REQUIREMENTS` achata (4/5/5/6, `cap` 6–10); o comentário promete que "no topo escala a CONSISTÊNCIA ao longo de semanas (`daysToEvolve`)" — e `daysToEvolve` não é lido. | **conflita com a tese do próprio arquivo**: achatou a exigência diária **e** apagou a exigência de semanas; sobrou 14 dias. → **WP4.1 (opção a)** é exatamente o que o comentário descreve. |
| (04 §2) Masmorra/Torneio como palco de expressão: perder não toca HP, tiers antes de ranking, janela de dias. | Confirmado (acima). ⚠️ O cabeçalho de `dungeon.ts` ainda diz "losing costs a real heart", "resets monthly", "daily play limit" — três afirmações falsas sobre o próprio arquivo. | **já faz** / comentário mentiroso → **C-P6** (PP, mesma família do WP4.9). |
| (04 §2) Fragilidade: o vínculo é mecânico; falta **memória e reação**. | `functions/api/chat.js` `buildSystemPrompt` recebe `mood`, `evolutionStage`, `dominantBranch` — não recebe `welcomeBack`, `perfectDays`, `soulGoal`. | **não se aplica** aqui (WP3.x, memória do chat). |
| (04 rec. 5) Álbum de formas vividas com datas. | `unlockedEvolutions: string[]` sem data; 4 renders sem ficha. | **já coberto por WP4.6 + WP4.10**. |
| (04 rec. 6) Antecipação do galho: silhueta/borrão da próxima forma. | `EvolutionPath.tsx`: visual `forecast` + `revealed` (espiada opt-in, "spoiler"); `grep -i "blur\|silhou"` → NÃO ENCONTRADO; não existe `BranchForecast.tsx` (a previsão vive dentro de `EvolutionPath`). | **lacuna** — guia E #40 (P2). É um filtro CSS sobre o sprite já gerado. → **C-P7**. |
| (04 rec. 12) Card compartilhável da cerimônia. | NÃO ENCONTRADO (`navigator.share`/`toBlob`/`shareCard`). | **já coberto por WP4.8** (reescrito no Mobbin). |
| (04 rec. 13) Nunca segundo pet; coleção só de formas vividas e sonhos. | `GameState` tem um `evolutionStage`; coleções = `unlockedEvolutions`, `rest.dreams`. | **já faz** — e é a razão de WP4.6 ter virado "álbum", não "bestiário de criaturas". |
| (04 rec. 15) Idade e aniversário do pet: "estou com ele há 8 meses". | `createdAt`/`startDate` no `GameState`; `grep -rn "createdAt" src/components` → só `CreateModal` (escrita). Nenhuma tela exibe idade; `grep -i aniversár` → NÃO ENCONTRADO. | **já coberto por WP4.8** (célula "dias de jornada") **parcialmente**; o aniversário é guia E #28 (dono: vínculo). |
| (04 rec. 16) Fusão/Ultra como horizonte explícito desde cedo. | Só a etiqueta `ZÊNITE`. | **já coberto por WP4.2** (aceite). |
| (04 rec. 17) Estágio novo pede consistência-por-semanas, nunca mais-tarefas-por-dia. | `MAX_STAGE_REQUIREMENT` = 6 derivado de `required`; nenhum estágio pede mais de 6/dia. | **já faz** — e é a **régua** de WP4.1(a): a escada 4/10/20/30 mexe em dias, não em tarefas/dia. |

### 1.3 Transcrição B4 — Creature collector / Duolingo characters

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| (B4 #2, frogMak) Upkeep/raising: quanto mais tempo e esforço diário de cuidado, menos descartável a criatura — aversão à perda de progresso. | Todo o `careRules.ts`/`careCaps.ts`; XP de Vínculo por cuidado (`awardBondXP`). | **já faz** (domínio cuidado). O que este domínio acrescenta: o esforço acumulado precisa **aparecer** (álbum, memórias) — WP4.6/4.8. |
| (B4 #4) Evolução em estágios = "orgulho parental": o jogador sente que criou a criatura. | `EvolutionCeremony.tsx` + `MANUAL_EVOLUTION = true` (cerimônia disparada pelo jogador). | **já faz** — mas a fonte de orgulho **acaba em 14 dias** (WP4.1) e o último degrau exige desfazer o que se criou (WP4.2). |
| (B4 #5, Bryson) Variantes ultra-raras cosméticas geram exclusividade. | Ver 04 shiny. | **não se aplica** aqui. |
| (B4 #8, Duolingo) Elenco **fixo** exposto por meses cria relação; figuras descartáveis não. | O pet é um. Os inimigos são **6 linhas fixas** (`DUNGEON_LINE_NAMES`, `sprites.ts`) que o jogador enfrenta centenas de vezes (`dungeonKills`) sem registro nem nome persistente. | **já coberto por WP4.6 (b) Encontros** — a fonte dá a razão: o elenco recorrente só vira relação se for reconhecível. |
| (B4 #1) Espécie, não personagem: não fechar a personalidade. | Descrição do Oráculo. | **não se aplica** (guia I.3.4, dono Oráculo). |

### 1.4 Transcrição C1 — Loss aversion (Engelstein)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| (C1) Perder dói ~2× ganhar; uso legítimo = perda **voluntariamente apostada** e reversível. | Masmorra: o que se perde é a run (`onLose` → `'lost'`, sem HP). Nada mais é apostado. | **já faz**. |
| (C1, Catan) **Progresso dotado**: começar com 2 dos 10 pontos aumenta a motivação. | `degeneratedPerfectDays` devolve piso `floor(required/2)` (quem cai reaparece com 2–3 dias); `bondLevelFor` faz save antigo nascer em nível > 1; `constancy` de hábito novo = 1. | **já faz** (três vezes). |
| (C1) **Level draining** (dar nível e tirar) é o desconforto que a indústria abandonou. | Degeneração = perder um estágio + até 5 dias perfeitos (`DEGENERATION_PERFECT_DAYS_COST`). Domesticada, mas é level draining literal — e o Ultra a **exige** (§0.3). | **conflita com a tese** — é a evidência mais forte para D6/WP4.2: o único level draining do jogo é obrigatório para o último degrau. |
| (C1, Civilization) Perda catastrófica **aleatória** gera paranoia ("o computador rouba"). | Nada aleatório tira: `rollDungeonHeartDrop` só dá; cocô é agendado e avisado; perda de coração é previsível (meta do dia). | **já faz**. |
| (C1, Hearthstone Tracking) O **enquadramento** legitima a perda: dizer o que se ganha, não o que se perde. | Masmorra: "Perder custa a run — nunca os seus corações" ✔. Retorno: "não perdeu nada esperando" ✔. Degeneração manual: "Você vai perder o progresso além deste estágio. Essa ação NÃO pode ser desfeita" ✗ — enquadramento de perda pura, num botão que hoje é **passo necessário** para o Ultra. | **já faz** (2 de 3) / **lacuna de copy** que só faz sentido resolver junto de WP4.2 (se a queda deixar de ser caminho, a copy de perda está certa; se ficar, precisa virar "revisitar"). |
| (C1) "Não ver o mágico": manipulação percebida gera pushback. | `seasonLabel` ("mais fácil agora — e continuam aparecendo depois") é a frase que expõe a regra honestamente **e não é renderizada** (§0.2). | **lacuna** → **C-P2**. |
| (C1) F2P "pague para não perder" = abuso. | Cura por 10 Créditos (guia C.3 #7, "rever"). | **não se aplica** (monetização, decisão do dono). |

### 1.5 Transcrição C2 — Freedom Fallacy

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| (C2 ~00:06:30) Autonomia é **volição**; estrutura satisfaz autonomia melhor que espaço vazio. | Estrutura de longo prazo hoje: 6 `MISSIONS` (acabam ~D30) e a Rodada semanal. A estrutura trimestral (`SEASON_PATHS`, três portas em `OU`) está escrita e **desligada**. | **lacuna** → **C-P2** + **já coberto por WP4.7**. |
| (C2 ~00:09:00, sand traps) Atividade desacoplada de necessidade não gera volição. | Dino: `floor(score/100)` Bits; PPT: `MATCH_POINTS` = 5; ambos sem teto, ambos só rendem Bits. `minigameMultiplier` (buff de brincar, `petNeeds.ts`) é o único acoplamento ao cuidado. | **lacuna** → **já coberto por WP4.5**; a conta: 8.540 Bits ÷ 360–470/dia = **D19–D23** de acoplamento; depois, ruído. |
| (C2 ~00:11:30, Far Cry 3 water buffaloes) Depois de fabricar tudo, a caça vira poluição visual. | Masmorra pós-catálogo rende: Bits (ruído), `DUNGEON_BEST` (**local**, `STORAGE_KEYS.DUNGEON_BEST`; `grep dungeonBest GameStateContext.tsx` → não sincroniza), 5%/inimigo de coraçãozinho (`HEART_DROP_CHANCE`, teto 2/dia) e Glitchtama (+1 `perfectDays`). **Pós-ultra o Glitchtama também vira ruído**: `getNextEvolution` não devolve nada acima de `ultra`. | **lacuna** → WP4.5 (reacoplar Bits), WP4.6 (Encontros dão memória ao inimigo), WP4.7 (comportamento semanal). Nota nova: `DUNGEON_BEST` local é o único placar que sobra e **se perde ao trocar de aparelho**. |
| (C2 ~00:21:00, No Man's Sky/Spore) Escala vazia frustra; "encher o oceano com uma pá". | Abismo (andares 6–8) foi **adiado** no Mobbin. | **já coberto por WP4.6 (c)** — C2 sustenta o adiamento: sem algo que o Abismo alimente, é pá no oceano. |
| (C2 ~00:18:30, Mass Effect) Escolhas ramificadas que funilam num final idêntico violam autonomia. | Três galhos (`AVAILABLE_BRANCHES`) → três megas distintos (nome/sprite próprios) → **um** `ultra` (`getNextEvolution` devolve `'ultra'`; `ultraName` único). | **conflita parcialmente**. Os galhos são escolha real até o mega; o Ultra é o final único. Nota para D6: a proposta de WP4.2 mantém o final único; um cosmético do galho dominante no Ultra custaria pouco. Não é WP — é observação para o dono. |

### 1.6 Transcrição C4 — De-gamification

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| (C4, Errant Signal) Recompensa anunciada reduz a tarefa a "meio para um fim". | Comida por tarefa (`careRules`). O guia I.1.3 arbitrou: manter, e usar como **filtro** para toda mecânica nova. | **não se aplica** (arbitrado) — mas vira **régua deste ledger**: WP4.7 nunca anuncia "faça N tarefas"; WP4.5/4.8 nunca pagam por ato (o card não paga share — já na spec). |
| (C4, Extra Credits) Fadiga extrínseca: pico inicial e colapso abrupto quando a novidade do XP acaba. | É exatamente a curva do anexo F: Bits D15–D23, missões ~D30, Vínculo (títulos) D25–D35, evolução D14. | **já faz** (o diagnóstico). Sustenta a onda 4 inteira; e o antídoto que a fonte nomeia (recompensa **intrínseca**: orgulho, relação) é o que WP4.6/4.8 entregam sem Bits. |
| (C4, De-Gamification) "Provar que passa nos testes do designer" transforma rotina em grind. | `SEASON_PATHS` são `OU` (nunca `E`), calibrados para "presença, não maratona" — desenho correto, **não fiado**. `MISSIONS` são alvos únicos e lifetime (não cobram). | **já faz** (no código) / **lacuna** (na produção) → **C-P2**. |

### 1.7 Guia mestre — B.3, B.5, B.7, C, D, I

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| (B.3 S-3) Garantir 1ª evolução ≤ 5 dias. | 4 (`required`). | **já faz**. |
| (B.5 V-3) Marcos de Vínculo nomeados com micro-cerimônia e comportamento novo. | Títulos ✔ (`bondTitle`); cerimônia e entrega das recompensas ✗ (§0.1). | **lacuna** → WP4.3 reescrito + **C-P1**. |
| (B.5 V-4) Rota de redenção na degeneração. | NÃO ENCONTRADO; sem WP. | **lacuna** → **C-P5**. |
| (B.5 V-7) Álbum de formas vividas. | — | **já coberto por WP4.6/4.10**. |
| (B.5 V-15) Fusão/Ultra como horizonte declarado. | Só `ZÊNITE`. | **já coberto por WP4.2**. |
| (B.7 R-9) Live-ops semanal leve (visita na masmorra), esforço **G**. | — | **conflita com C2** → WP4.7 em vez disso. |
| (B.7 R-10, E #36) Seasons de torneio com troféus permanentes, esforço **G**. | **Já existe** (`closeSeason`, `trophies`, vitrines). | **já faz** — premissa do guia cai; o que falta é o **cron** (C-P4, PP). |
| (B.7 R-11, E #34) Rotação mensal de cenários/sonhos, esforço **G**. | Sonhos sazonais existem (trimestral); cenários não. | **já coberto por WP4.5** (M, não G). |
| (B.7 R-12, E #37) Memórias 30/90. | — | **já coberto por WP4.8**. |
| (C.1 #6, #8, #9, #11) Travado por teste: Emblemas cosméticos; ranking depois da faixa; fresh start não apaga; `bondLevel` derivado. | `currencies.test.ts` ("itens do torneio cobram SEMPRE em Emblemas"); `tournamentTiers.test.ts` ("a faixa nunca desce por causa do que os outros fizeram"); `bond.test.ts` ("NENHUMA recompensa devolve moeda relevante, HP, energia ou perfectDay"). | **já faz** — ⚠️ com uma **fissura** na #8: o teste prova que `getTierStanding` é monotônica na **entrada**; a entrada (`myRank.points`, `community.js` `playMatch`) **desce**: `points = max(0, points − 8)` na derrota e `max(0, points − 4)` para o **oponente que nem jogou** (é um dado ponderado, `power()` com `Math.random() * 18`). A faixa de um jogador com 104 pontos volta de Broto para Semente depois de uma derrota — e pode voltar por uma partida em que ele foi **alvo**. |
| (C.2 #18) Nunca escassez com janela de horas. | `ROUND_LENGTH_DAYS` = 3; `SEASONS` ~13 semanas. | **já faz**. |
| (C.2 #20) Nunca contagem de dias **não** perfeitos. | `MISSIONS.mission-perfect-30` conta perfeitos; `ShopModal` `lockLine` mostra `cur/target` — só acertos. | **já faz**. |
| (C.2 #23) Nunca chamar degeneração de morte; sempre reversível, nunca por pagamento. | `getPreviousForm` reversível por evolução; Créditos não tocam estágio. | **já faz**. |
| (C.3 #2) "Dias juntos" é admissível (monotônico). | `createdAt` existe; nenhuma tela mostra. | **já coberto por WP4.8** (célula "dias de jornada"). |
| (C.3 #5) Compartilhamento: só identidade, nunca posição. | `LibraryPage.tsx` mostra `"${p.daysPlaying} dias jogando · rank ${p.rankPoints}"` no perfil de amigo — posição exposta. | **já coberto por WP4.11** (E3). |
| (D.6) Redenção V-Pet. | — | **lacuna** → C-P5. |
| (D.7) Antecipação retém mais que recompensa: silhueta da próxima forma. | NÃO ENCONTRADO. | **lacuna** → C-P7. |
| (D.9) Escassez que não tira nada: toda live-ops passa por esse teste. | `seasons.ts` regra 1 + `seasons.test.ts` "NADA EXPIRA" (4 testes: pool inteiro o ano todo; Dex fechável fora de estação; catálogo nunca encolhe). | **já faz** — é o precedente com teste para WP4.5 ("sem última chance"). |
| (I.1.2) "O que ainda dói perder no Soulmon? Quase nada." A criatura única é o ativo que sustenta significado. | O único "dói" real é a degeneração (estágio + 5 PD) — e o jogo a **cobra** para o Ultra. | **conflita com a tese** → sustenta D6/WP4.2: não se pode ao mesmo tempo dizer que a criatura é o que dói perder e exigir perdê-la duas vezes. |
| (I.2) Faixas antes do ranking: coortes reduzidas preservam *winnability*. | `TournamentPage`: "A FAIXA vem ANTES"; janela ±3 (`RANK_WINDOW`). | **já faz** — ressalva da fissura acima (WP4.13). |
| (I.3.5) Masmorra e minijogos precisam continuar acoplados depois da loja. | — | **já coberto por WP4.5** (é a origem da spec). |

### 1.8 Relatório 03 — Gamificação (progressão, leaderboard, economia)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| (03 §1.2 Pokémon Sleep) Nunca perde; reset semanal do Snorlax; Dex colecionável. | `getDungeonDifficulty` reseta por `weekKey` (a base da masmorra é o Snorlax do Soulmon); `DreamDex`. | **já faz**. |
| (03 §1.3 regra 1) Perda só sobre recurso **recuperável e voluntariamente apostado**. | Masmorra ✔. Torneio ✗: o oponente perde 4 pontos de rank sem ter apostado nada (`community.js` `playMatch`, `oppRank.points`). | **conflita com a tese** → **WP4.13 precisa de emenda** (§2). |
| (03 §1.3 regra 3) Contador que **acumula** retém; que zera, não. | `totalPerfectDays`, `dungeonKills`, `dungeonRunsCompleted`, `totalXP`, `rest.dreams`, `unlockedEvolutions` — todos monotônicos. `DUNGEON_DIFFICULTY` zera por semana (é base, não identidade — aceitável). Pontos de rank do Torneio zeram por **mês** (`season` = `YYYY-MM`) e descem por derrota. | **já faz** (7 contadores) / **conflita** (rank) → WP4.13. |
| (03 §1.3 regra 4) Variável no cosmético, determinística no essencial. | Comida determinística; `rollDream` determinístico por seed; único variável com efeito de cuidado = coraçãozinho 5% (teto 2/dia) — é bônus, não insumo. | **já faz** (aceitável). |
| (03 §2 lacuna 4) CD5 quase ausente: compartilhar card do pet/sonho raro, sem ranking. | — | **já coberto por WP4.8**. |
| (03 §4 #14) Card exportável: sprite + dias juntos + sonho raro. | — | **já coberto por WP4.8**. |
| (03 §4 #19) Guardrails: ranking absoluto antes de faixa; contador exposto que diminui. | Faixa antes ✔; `rankPoints` de amigo exposto em `LibraryPage` ✗. | **já coberto por WP4.11**. |
| (03 §4 #22) Se D30 decepcionar, a tentação é streak; a resposta é medir onde quebra. | Telemetria (WP0). | **não se aplica**. |

---

## 2. WPs existentes × corpus pré-Mobbin

| WP | O corpus… | Fonte que sustenta / contradiz | O que muda na spec |
|---|---|---|---|
| **WP4.1** `daysToEvolve` vira gate ou some | **SUSTENTA (a)**. 04 Vital Bracelet ("estagnação no meio + topo caro"; achatar tarefas/dia, escalar semanas) + 04 rec. 17 (consistência-por-semanas) + o próprio comentário de `FORM_REQUIREMENTS` descrevem a opção (a) palavra por palavra. B4 #4 (orgulho parental) e 07 §2 D90 dizem que a evolução é o pico e que ele acaba em 14 dias. | 04 §1, 04 rec. 17, 07 §2, B4 #4 | Acrescentar à evidência: **`GuideModal.tsx` exibe `daysToEvolve`** (10/20/30/40) e `App.tsx` passa `daysToEvolve` como `digivolutionSegmentsNeeded` ao HUD — o dado morto **é exibido** ao jogador. Independente de D5, o guia tem de ler o gate (C-P3). Continua `BLOQUEADO:D5`. |
| **WP4.2** Ultra sem degeneração forçada | **SUSTENTA, e mais forte**. C1 nomeia level draining como a prática abandonada pela indústria; I.1.2 diz que a criatura é "o que dói perder"; C2/Mass Effect nota o funil único. 04 §1 **contradiz por omissão**: chama a degeneração de "acidente domesticado" sem ver que ela é pré-requisito. | C1, I.1.2, C2, 04 §1 | Corrigir a evidência: **dois** caminhos (manual via `handleDegenerate`/`isPreviousStage`, e HP = 0), a conta é **26 PD + 1 manual + 1 forçada** (§0.3); a copy da manual ("vai perder o progresso… NÃO pode ser desfeita") é enquadramento de perda num passo obrigatório. Aceite ganha: "nenhuma copy da árvore apresenta a degeneração como caminho para o Ultra" (se D6 aprovar a proposta) — e a rota de redenção (C-P5) é o complemento narrativo. Continua `BLOQUEADO:D6`. |
| **WP4.3** Vínculo depois do L13 | **SUSTENTA o objetivo e DERRUBA a premissa**. 04 GO Buddy pede "rostos e nomes de marco"; B5 V-3 pede cerimônia. Mas §0.1: **L2–L13 nunca é entregue** — `unclaimedBondRewards`/`bondRewardsClaimed` sem consumidor. | 04 §1 GO, B.5 V-3, §0.1 | **Reescrever em duas fases**: (0) fiar a escada existente — ler `unclaimedBondRewards(totalXP, bondRewardsClaimed)` em algum ponto do `App.tsx`, entregar (`ownedFurniture`/`ownedBackgrounds`/`rest.dreams` via `collectDream`), gravar `bondRewardsClaimed`, e uma micro-cerimônia (é **C-P1**, PP–P, e vem antes); (1) a spec atual (variantes exclusivas, escada até L31). Evidência nova: "nenhuma das 12 recompensas chega ao jogador; só `bondTitle` em `StatsPage`". |
| **WP4.4** Estações cíclicas (`RECUSADO`) | **Indiferente** — o corpus não fala em expiração; C3/D.9 pedem "nada expira", e `seasons.test.ts` já trava. | D.9, `seasons.test.ts` | Nada. A recusa fica. |
| **WP4.5** Sumidouro recorrente de Bits | **SUSTENTA**. C2 (sand traps / water buffaloes) é a origem literal; I.3.5 a traduz; C4 (fadiga extrínseca) dá a curva; 07 §6 #21 pede rotação de cenários. | C2, I.3.5, C4, 07 §6 | Uma correção de dependência: a spec diz "por estação de WP4.4" — WP4.4 foi recusado porque **já é** cíclico, então a dependência é de **C-P2** (fiar `currentSeason`/`seasonLabel` na UI), não de WP4.4. Sem C-P2 a vitrine não tem como dizer que estação é. Manter (b) presente cosmético 200 Bits; manter "nenhuma coleção exibe preço" (Mobbin). |
| **WP4.6** Álbum de formas vividas + Encontros | **SUSTENTA a reescrita do Mobbin**. B4 #8 (elenco fixo recorrente vira relação só se reconhecível) é o argumento que faltava para "Encontros"; 04 rec. 13 (coleção só de formas e sonhos) já estava. C2/No Man's Sky sustenta o adiamento do Abismo. | B4 #8, 04 rec. 5/13, C2 | Nada na spec; acrescentar B4 #8 à evidência. |
| **WP4.7** Missões semanais repetíveis | **SUSTENTA o pacote e CORRIGE a evidência**. C2 (estrutura > espaço vazio) e C4 (nunca "testes do designer") dão a régua; 07 §6 #13 pedia "visita especial" e este documento troca por missão de comportamento. A evidência cita `SEASON_PATHS` como "o que já há" — **não há**: está desligado (§0.2). | C2, C4, 07 §6 #13, §0.2 | Trocar "`SEASON_PATHS` (5 runs = medalha do trimestre em 5 dias)" por "`SEASON_PATHS` existe em `seasons.ts` e **não tem consumidor** (C-P2)". Manter o aceite negativo do Mobbin (sem `0/3` em série) e o do C4: "nenhuma missão anuncia 'faça N tarefas'". Pool sugerido ganha itens de **comportamento** que o corpus valida: "3 noites na janela" (B.5/restWindow), "1 tarefa assombrada concluída" (04 rec. 8), "2 runs" (dá destino à masmorra pós-catálogo, C2). |
| **WP4.8** Memórias 30/90 + card | **SUSTENTA**. 07 §6 #22, 04 rec. 12 e 15 (tempo compartilhado), 03 §4 #14 (CD5 white-hat), C.3 #5 (só identidade). | 07, 04, 03, C.3 | Nada além do Mobbin. Registrar 04 rec. 15 como coberto parcialmente (dias de jornada). |
| **WP4.9** Corrigir "roster de 60" | **Indiferente** (já `VERIFICADO`). | — | Nada. |
| **WP4.10** Datar coleções | **SUSTENTA** (04 rec. 5 "com datas"; 04 rec. 15). | 04 | Nada. |
| **WP4.11** Perfil do amigo sem métrica | **SUSTENTA** (03 §4 #19; C.3 #5). Confirmado no código: `LibraryPage` mostra `rank ${p.rankPoints}`. | 03, C.3 | Nada. |
| **WP4.12** Missão bloqueada sem 🔒 + `0/N` | **Indiferente/leve** — C4 ("testes do designer") e C.2 #20 (nada de contagem negativa) apoiam. `ShopModal` `lockLine` hoje mostra `cur/target` inclusive em zero. | C4, C.2 | Nada. |
| **WP4.13** Faixa do Torneio lifetime | **SUSTENTA e AMPLIA**. 03 §1.3 regras 1 e 3 + C.1 #8: a faixa **desce hoje** por dois caminhos que o teste de `tournamentTiers` não vê — derrota própria (−8) e ser oponente sorteado de alguém (−4, sem ter jogado). O reset mensal é o terceiro. | 03 §1.3, C.1 #8, `community.js` `playMatch` | **Emendar a spec**: a faixa deriva de um contador **monotônico** (soma de pontos ganhos, ou `wins`/`losses` que só sobem — ambos já existem em `myRank`), nunca de `points` líquido; o teste passa a exercitar `playMatch` (derrota própria e passiva) e a virada de mês, exigindo faixa ≥ anterior nos três. Continua `PROPOSTO`. |
| **WP4.14** Criatura visitável | **SUSTENTA** (07 §6 #25). | 07 | Nada. |

---

## 3. Candidatas a WP novo (sem número — o consolidador integra)

Todas passaram pela régua deste ledger: nada compra vantagem, nada cobra da
barra de cuidado, nada expira, nenhuma recompensa por contagem, nenhum número
exposto que diminui, ninguém regride de estágio.

**C-P1 · Ligar a escada de recompensas do Vínculo que já existe** — PP/P
- Lacuna: `BOND_REWARDS` (12 itens L2–L13) e `unclaimedBondRewards` estão
  escritos, testados e **sem consumidor**; `bondRewardsClaimed` no `GameState`
  nunca é escrito (§0.1). O jogador recebe só o título.
- Spec: um `useEffect`/ponto único no `App.tsx` (depois de todo `awardBondXP`)
  que chama `unclaimedBondRewards(totalXP, bondRewardsClaimed)` e, para cada
  recompensa: `decor` → `ownedFurniture`; `bg` → `ownedBackgrounds`; `dream` →
  `collectDream(rest, refId)`; `title` → nada a entregar (é `bondTitle`).
  Grava o `id` em `bondRewardsClaimed` (idempotente). Uma fala do pet + toast
  por recompensa; nada de modal bloqueante. Nenhuma recompensa nova; nenhum
  Bits.
- Aceite: teste "save com `totalXP` de L4 e `bondRewardsClaimed: []` termina
  com `furn-plant`, `bg-forest` e o título, e `bondRewardsClaimed` com 3 ids";
  teste de idempotência (rodar 2× não duplica); teste "nenhuma recompensa
  altera `gamePoints`, `emblems`, `healthPoints`, `perfectDays`".
- Comando: `grep -n "unclaimedBondRewards" src/App.tsx` ≥ 1;
  `grep -c "bondRewardsClaimed" src/App.tsx` ≥ 1.
- Ordem: **antes** de WP4.3 — estender uma escada que não entrega é estender
  código morto.

**C-P2 · Fiar as estações que já existem (nome, três caminhos, medalha)** — P
- Lacuna: `seasonLabel`, `seasonProgress`, `SEASON_PATHS`,
  `ensureSeasonProgress`, `seasonMedalStatus`, `applySeasonMedal` sem consumidor
  (§0.2). O jogador não sabe que estação é; a medalha nunca é ganha; a regra
  "nada expira" nunca é dita.
- Spec: `GameState.season?: SeasonProgressState` (migração `?? undefined`);
  na virada (`computeDailyReset`, dono da virada) chamar
  `ensureSeasonProgress(prev.season, counters, now)` e `applySeasonMedal`;
  `counters` = `{ totalPerfectDays, dungeonRunsCompleted }` que já existem.
  UI: um bloco na aba **Missões** da loja (`ShopModal`) — `seasonLabel` +
  os três caminhos com `current/target` **só onde `current ≥ 1`** (Mobbin/
  Tripadvisor) + a medalha ganha (`earnedMedals`) como selo; e a mesma
  `seasonLabel` no `DailyReportModal` no primeiro dia de cada estação (uma vez;
  `lastSeasonGreeted` no save). A medalha continua **só selo** (sem item, sem
  Bits) — o que ela dá é presença no álbum (WP4.6) e no card (WP4.8).
- Aceite: teste da virada "entrar em estação nova tira snapshot e preserva
  `earnedMedals`"; render test "com todos os caminhos em zero, nenhum `0/`
  aparece"; teste "`seasonLabel` fora de estação diz que nada some".
- Comando: `grep -rn "ensureSeasonProgress\|applySeasonMedal" src/utils/dailyReset.ts src/App.tsx` ≥ 2;
  `grep -n "seasonLabel" src/components/ShopModal.tsx` ≥ 1.
- Ordem: **antes** de WP4.5 (a vitrine precisa de uma estação visível) e de
  WP4.7 (que passa a somar à estação, não a competir com ela).

**C-P3 · O guia diz o gate real** — PP
- Lacuna: `GuideModal.tsx` mostra `daysToEvolve` (10/20/30/40); o gate é
  `required` (4/5/5/6). `App.tsx` passa `daysToEvolve` como
  `digivolutionSegmentsNeeded` ao HUD.
- Spec: enquanto D5 não decide, o guia e o HUD leem o **mesmo símbolo** que
  `handleEvolve` (hoje `.required`). Se D5 escolher (a), o símbolo vira
  `evolveGateFor` e os três pontos mudam juntos — o que WP4.1 já prevê.
- Aceite: teste que renderiza `GuideModal` e exige que o número de "Rookie→
  Champion" seja igual ao gate que `canEvolve` usa.
- Comando: `grep -c "daysToEvolve" src/components/GuideModal.tsx src/App.tsx` → 0.

**C-P4 · Fechar a season do Torneio sozinha** — PP
- Lacuna: `closeSeason` (`community.js`) exige `SEASON_ADMIN_KEY` e uma chamada
  manual; `grep -i season workers/*.js` → NÃO ENCONTRADO. As vitrines existem
  para troféus que só chegam se o dono lembrar. O guia lista isto como P2 × G
  (E #36) quando falta só o disparo.
- Spec: no `workers/push-scheduler.js` (único cron), no dia 1 de cada mês, um
  `fetch` POST `closeSeason` com a season anterior e o secret (já é secret de
  wrangler). Idempotente do lado do servidor: se a season já tem
  `pendingTrophies` distribuídos, não redistribui (guardar `closed:<season>`).
- Aceite: teste do worker com relógio falso em `2026-10-01` chamando com
  `season: '2026-09'`; teste de idempotência no `community.js`.
- Comando: `grep -n "closeSeason" workers/push-scheduler.js` ≥ 1.
- Dono provável: comunidade/retorno; listo aqui porque os troféus são a única
  vitrine permanente do meu domínio.

**C-P5 · Rota de redenção nomeada na degeneração** — M · depende de D6
- Lacuna: 04 rec. 1, B.5 V-4, D.6, E #19 — em nenhum ledger. Hoje a queda tem
  misericórdia numérica (`degeneratedPerfectDays`) e copy de perda.
- Spec (só depois de WP4.2, senão a redenção vira o caminho oficial do Ultra):
  ao degenerar por HP zero, `degeneratedByHP: true` (já existe) passa a abrir na
  página de Evolução um cartão "capítulo de volta" — a forma seguinte, quando
  re-evoluída a partir de uma degeneração, ganha uma **variante cosmética**
  (moldura/paleta, sem stat) e a fala da cerimônia cita o retorno. Nunca uma
  forma "melhor"; nunca um atalho de dias perfeitos.
- Aceite: teste "re-evoluir após `degeneratedByHP` marca a forma com
  `redeemed: true` e não altera HP/atributos"; teste "evoluir sem degeneração
  nunca marca".
- Comando: `grep -n "redeemed" src/utils/dailyReset.ts src/App.tsx` ≥ 2.

**C-P6 · Cabeçalho de `dungeon.ts` mente sobre o próprio arquivo** — PP
- Lacuna: o comentário de abertura diz "resets monthly", "a daily play limit",
  "entry is gated only by HP (losing costs a real heart)". As três são falsas:
  `weekKey` semanal; sem limite diário; `onLose` não cobra HP. É a mesma
  família do comentário que gerou o "roster de 60" (WP4.9).
- Spec: reescrever o cabeçalho com o que o código faz (semanal; sem limite;
  sem gate; `HEART_DROP_*`).
- Aceite/Comando: `grep -c "resets monthly\|daily play limit\|costs a real heart" src/utils/dungeon.ts` → 0.

**C-P7 · Silhueta da próxima forma no galho previsto** — P
- Lacuna: 04 rec. 6 / D.7 / E #40 — "o que ele vai virar?" é o gancho nº 1 do
  gênero; `EvolutionPath.tsx` tem `forecast` (texto) e `revealed` (espiada
  opt-in que mostra o sprite inteiro). Não há meio-termo: ou nada, ou spoiler.
- Spec: no nó `forecast`, renderizar o sprite (se já gerado no acervo,
  `spriteLibrary.ts`) com `filter: blur(6px) brightness(0.3)` — a receita da
  silhueta do `DreamDex` — sem toque; a espiada opt-in continua sendo o único
  jeito de ver inteiro. Se o sprite ainda não existe, nada (silêncio, não
  placeholder).
- Aceite: render test "nó forecast com sprite no acervo tem `filter` com
  `blur`; sem sprite, não renderiza `<img>`".
- Comando: `grep -n "blur" src/components/EvolutionPath.tsx` ≥ 1.

Não proponho WP para: "visita especial rotativa" (07 #13 — C2 mostra que é
ruído sem acoplamento; WP4.7 cobre), "rotação mensal" (07 #21 — WP4.5 cobre em
cadência trimestral, que é a sustentável), "micro-comportamentos idle" e
"aniversário" (04 rec. 7/15 — dono é o vínculo/HUD), "push de sexta" (07 §4 —
dono é o retorno).

---

## 4. Onde as fontes discordam entre si

| Tema | Fonte A | Fonte B | Como este guarda lê |
|---|---|---|---|
| A degeneração | 04 §1: "versão domesticada" da morte, acidente com travas | anexo F / WP4.2: **pré-requisito** do Ultra | Os dois estão certos sobre partes diferentes do código; 04 não leu `getNextEvolution`. A tese de 04 ("peso, não crueldade") só vale se WP4.2 passar. |
| Live-ops semanal | 07 §6 #13 / B.7 R-9: "visita especial" rotativa (mais atividade) | C2: atividade desacoplada é ponto de ruído; I.3.5 aplica ao Soulmon | C2 vence — é `via transcrição` e o guia I declara essa hierarquia. WP4.7 (comportamento) em vez de "visita". |
| Cadência de conteúdo | 07 §6 #21: **mensal** | `seasons.ts` cabeçalho: **trimestral**, "um fim de semana a cada três meses" pelo custo do dev solo | Trimestral. A fonte 07 não mediu custo; o código mediu. |
| Seasons de torneio | 07 §6 #16 e guia E #36: a fazer, esforço **G** | código: `closeSeason` + `trophies` + vitrines **existem** | O guia errou o estado do código; falta só o cron (C-P4, PP). |
| "Perda só sobre o apostado" | 03 §1.3 regra 1 | `community.js` `playMatch`: −4 no oponente passivo | O código contradiz a regra que o próprio Torneio afirma seguir (`tournamentTiers.ts` cabeçalho). WP4.13 emendado. |
| Recompensa extrínseca | C4: corrói motivação intrínseca | 04 GO Buddy / B.5 V-3: marcos com recompensa | Guia I.1.3 já arbitrou: manter, filtrar. Neste ledger: recompensas do Vínculo são **cosméticas e por relação**, não por tarefa — passam no filtro; e hoje nem existem (§0.1). |

---

## 5. A conta de Bits (obrigatória)

Nenhum WP nem candidata deste documento cria fonte ou sumidouro de Bits:
C-P1 entrega itens **sem** passar pela loja (não tira Bits, não dá); C-P2 é
medalha-selo; C-P4 são troféus (cosmético, sem moeda); C-P5 é variante
cosmética; C-P3/C-P6/C-P7 são copy/UI.

Catálogo permanente (verificado em `SHOP_ITEMS`): 27 decorações = **3.230** ·
26 cenários (com `bg-room` a 0, 6 de missão a 300) = **5.310** · **53 itens =
8.540 Bits**. Renda ~360–470/dia (F §1; 1 run + Dino + PPT + pesadelo) →
**D19–D23**; com 5 amigos (`gift` 20 Bits × 5/dia) → **D15–D18**. Depois só
chips (120) e coraçãozinho (150). **Inalterado.** WP4.5 continua sendo o único
pacote que mexe nisto, e agora depende de C-P2.

Um número novo que a conta não tinha: das 12 recompensas do Vínculo, 5 são
itens da loja (`furn-plant` 100, `bg-forest` 150, `furn-picture` 130,
`bg-sakura` 180, `furn-rug` 140 = **700 Bits**). Quando C-P1 ligar a escada,
esses 700 saem do catálogo comprável de quem chegou ao L11 antes de comprá-los
— o esgotamento **antecipa ~2 dias** para esse perfil (8.540 → 7.840 ÷ 360–470
≈ D17–D22). WP4.3 (a) (variantes exclusivas em vez de duplicatas) desfaz isso.

---

## 6. O que este guarda mudou de opinião

1. **"O Vínculo para de recompensar no L14"** → **o Vínculo nunca recompensou.**
   Eu repetia o número do anexo F (`bondRewardFor` null ≥ 14) sem perguntar
   quem chama `bondRewardFor`. Ninguém chama. A escada D1–D7 mais bem
   documentada do código é código morto. WP4.3 passa a ter uma fase zero
   (C-P1) e a evidência "9/12 são duplicatas" vira nota de rodapé.
2. **"A medalha de estação fecha em 5 dias"** → **não há medalha.** Contei como
   conteúdo entregue (F §Síntese, spec de WP4.7) uma função pura sem fiação.
   É o mesmo erro do WP4.4 pela manhã, no sentido inverso: lá o dado parecia
   pior que a função; aqui a função parecia entregue e não é.
3. **"O único caminho de volta é HP zero"** → **há degeneração manual**, com
   botão e dupla confirmação. O Ultra continua exigindo pelo menos uma queda
   forçada (a manual só serve uma vez, porque o galho seguinte nunca foi
   vivido), mas a conta certa é 26 PD + 1 manual + 1 forçada, não "30 + 2".
4. **"Seasons de torneio com troféus" era um item G a fazer** (07, guia E #36)
   → já existe inteiro; falta um cron. Passei a desconfiar de todo esforço "G"
   do guia E que não cita símbolo.
5. **A faixa do Torneio "nunca rebaixa"** → o teste prova monotonicidade da
   função, não da entrada. `playMatch` subtrai pontos do perdedor **e do
   oponente que não jogou**. WP4.13 estava mirando só o reset mensal; o dano
   diário é maior.
6. **Sobre o próprio método:** as três premissas que caíram hoje (WP4.4 de
   manhã; §0.1 e §0.2 agora) têm a mesma anatomia — alguém leu uma TABELA
   (`SEASONS`, `BOND_REWARDS`, `SEASON_PATHS`) e escreveu no plano o que a
   tabela "faz". Tabela não faz nada; função faz. A partir daqui, toda
   evidência deste ledger cita **o consumidor** do símbolo, não o símbolo.
7. O que **não** mudou: o catálogo de Bits esgota em D15–D23, `daysToEvolve` é
   dado morto (e agora sei que é **exibido** no guia), o conteúdo real acaba em
   14 dias perfeitos, e a régua de C2 (reacoplar, não adicionar) continua
   sendo a decisão mais importante deste domínio. O corpus pré-Mobbin
   **sustenta todos os 14 WPs**; contradiz a forma de dois (4.3 e 4.7, nas
   evidências) e amplia um (4.13).
