# Dossiê de progressão — combate v3 (run `combate-v3-01`, Discovery reaberta, §2.7)

Curador: alpha-curador-de-contexto · 05/10/2026 · Escopo: o que JÁ EXISTE de moeda, XP, level, gate, equipamento, degeneração e linhas vermelhas. Substitui a versão anterior deste arquivo (mais curta; seus fatos únicos foram incorporados).
Código lido em `E:\soulmon-cv3` (caminhos relativos); docs em `D:\Soulmon\repo\docs`.
**Datas:** sem mtime nas ferramentas; a coluna Data traz a data escrita no símbolo/doc; sem ela, `[data desconhecida]`. **Nada foi executado** (leitura estática). Memória entre runs: inexistente.

## 0. Achado-mãe

**A proposta "level de usuário separado + XP + gate de PvP" JÁ EXISTE com outro nome: o Vínculo.** `src/utils/bond.ts`: tabela de XP, teto diário suave, curva de nível, escada de recompensas, gate de PvP (nível 5) decidido no servidor. A proposta não é "criar level": é **reabrir/estender o Vínculo** ou **criar um 2º level ao lado dele**. Ambos colidem com decisões escritas (§9).

## 1. Mapa: XP / level / bond

| Item | Caminho › símbolo | Data / estado | Teste que trava | Doc dono |
|---|---|---|---|---|
| XP por evento | `src/utils/bond.ts` › `bondXP`; `XP_PER_EFFORT`=10, `XP_PERFECT_DAY`=50, `XP_REST_NIGHT`=15, `XP_NEW_DREAM`=25, `XP_NIGHTMARE_CLEARED`=10, `XP_DUNGEON_FLOOR`=10, `XP_DUNGEON_RUN`=60, `XP_TOURNAMENT_WIN/LOSS`=15/8, `XP_HABIT_MILESTONE` 7/21/66 = 100/200/400, `XP_TRIAGE_CLEARED`=30, `XP_CHECK_IN`=10 | canônico, `[data desconhecida]` | `bond.test.ts`, `bond.diaCompleto.test.ts`, `bond.wiring.test.ts` | `02-REGRAS` §55 (l. 4940) · `PLANO-PRODUTO.md` Parte 4 (l. 179) |
| XP por comer | `src/utils/careRules.ts` l. 126: `totalXP + (power+harmony+benevolence)×10` | canônico | `[teste não localizado]` | `bond.ts` cabeçalho. **Chip e comida já alimentam o XP de conta.** `02` l. 5005: "comida fora da tabela" (decisão #55/#59b não implementada) |
| Teto diário | `BOND_DAILY_CAP` = dungeon 120, tournament 60; só essas duas fontes | canônico | `bond.test.ts` | idem |
| Nível | `bondLevelFor(totalXP)`, `xpForLevel`, `BOND_MAX_LEVEL`=1000; nível 2 no dia 1, nível 3 no dia 2–3 | canônico | `bond.test.ts` | idem |
| **Nível nunca persistido** | invariante 4; só `bondRewardsClaimed?: string[]` no save | **linha vermelha #5** | `bond.test.ts` | `01-VISAO` §7 |
| Recompensas | `BOND_REWARDS` (2–13) + `BOND_TITLES` (até 31); kinds só `title`/`decor`/`bg`/`dream`; invariante 3: "NUNCA Bits/Emblemas/Créditos, nunca HP, energia, perfectDays ou vantagem de combate" | canônico | `bond.recompensas.test.ts` | `bond.ts` §4 |
| **Gate PvP** | `BOND_PVP_MIN_LEVEL`=5 (`xpForLevel(5)`=700), `meetsPvpBond`, `xpToPvpBond`; `GameStateContext.tsx` l. 1638; `TournamentPage.tsx` | canônico (H13, 02/10/2026) | `GameStateContext.pvpBlocked.test.tsx`, `TournamentPage.bondGate.test.tsx` | `02` §55 |
| Servidor decide | `functions/api/community.js` ação `profile` (`pvpEnabled:false` + `pvpBlocked`); curva em `functions/api/_bond.js` | canônico | `functions/api/bond.parity.test.js` | `02` §55 |
| Regra "todo destrave social reusa ESTE nível" | `bond.ts` l. 539 | **contraria a proposta** | só comentário | `bond.ts`, `02` §55 |
| `level-de-conta.md` §6 (derivação do 5) | citado em `bond.ts` e `REGISTRO` l. 1418 | **AUSENTE** (confirmado em `02` l. 5018) | — | — |

**Outros "levels" (não confundir):**
| Item | Caminho | Estado |
|---|---|---|
| `catalogLevel` 1–3 (nível de DIFICULDADE de atividade) | `catalogLevel.ts`, `catalogLevelSignal.ts`; `LEVEL_UP_WINDOW_DAYS`=21, `LEVEL_MIN_DAYS`=21, `LEVEL_DOWN_WINDOW_DAYS`=14; só SUGERE; desce com copy gentil; nunca em `optInOnly` | canônico (A6, 28/09/2026) · `catalogLevel.test.ts` |
| Estágio do pet | `types/progression.ts` › `FORM_REQUIREMENTS` rookie 4/6 · champion 5/7 · ultimate 5/8 · mega 6/9 · ultra 6/10; `ULTRA_PATIENCE_DAYS`=45 | canônico. É o "level do Soulmon" por degraus |
| `perfectDays` / `totalPerfectDays` | `dailyReset.ts` | `perfectDays` sobe e desce; `totalPerfectDays` só sobe |
| Faixa do Torneio | `tournamentTiers.ts` (lifetime: Madeira 0 … Diamante 1500; Mestre/Grão-Mestre por lugar) | canônico (R7/R8, 04/10/2026) |
| Estágio do Bosque (Guilda) | `_coop.js` › `bosqueStageFor` (`BOSQUE_THRESHOLDS` 2/10/25/50/90 dias-de-guilda) | canônico, coletivo. ⚠️ O comentário l. 522 diz "`bondLevelFor`", mas a função é por `progress` de guilda: comentário impreciso |

**Busca por variantes (ausência):** `accountLevel`, `nivelConta`, `xpToNext`, `userLevel`, `talent`, `talento`, `skillTree`, `árvore` → nenhuma em produção. **Árvore de talentos não existe.**

## 2. Moedas

| Moeda | Campo | Origem | Gasta em | Teste | Doc |
|---|---|---|---|---|---|
| Bits 💠 | `gamePoints` (cliente) | dia completo `BITS_PER_COMPLETE_DAY`=100 + minijogos até `MINIGAME_BITS_PER_DAY`=150 (`creditMinigameBits`, ledger `minigameBits`) | loja comum (8.900 Bits no total), `deepStartCost` (16/nível, teto 5) | `currencies.test.ts`, `regrasDeJogo.qaRodada2.test.ts` (#61/#63), `dungeon.deepStart.test.ts` | `02` §46 (l. 3908) |
| Honra 🎖️ | `emblems` (cliente) | Torneio 3/1; missões semanais; Resgate da Feira 4 ou 2 | só `TOURNAMENT_ITEMS` (8 itens, 8–70) | `currencies.test.ts` ("o torneio só vende cosmético": `kind`∈`bg`/`furniture`, `attr` undefined) | `02` §46 |
| Créditos 💎 | `credits` (**servidor**, `ent:<saveId>`) | dinheiro real; anúncio `AD_REWARD_CREDITS`=5 (cap 3/dia; `ADS_ENABLED=false`) | reroll do Oráculo (`REROLL_COST_CREDITS`=50), câmbio → Bits, sprite próprio, `accountTier:'paid'` | `currencies.test.ts` (sem `BITS_TO_CREDIT`), `_entitlements.*.test.js` | `_entitlements.js` ("o cliente NUNCA dita tier nem saldo") |
| Câmbio | `CREDIT_TO_BITS`=10; `BITS_EXCHANGE` 10/25/60 | **só Créditos→Bits** | — | `currencies.test.ts` | `currencies.ts` |

**Fato 1 (para a colisão de equipamento):** Créditos→Bits→loja já é caminho dinheiro→Bits. O 💗 saiu da loja em 06/09/2026 por isso (`shop.ts` l. 120: "Indireto não é melhor: é o mesmo, escondido"). Equipamento em Bits herda o argumento.

**Fato 2: os 3 chips já são atributo comprável.** `shop.ts`: `chip-power/harmony/benevolence`, 120 Bits, `CHIP_BOOST`=3. Alimentam `powerPoints/harmonyPoints/benevolencePoints`, que entram no atk do **PvP** (`duelStats`: `min(2, soma/50)`, `_duel.js`), no galho de evolução e no `totalXP`. `02` §47 admite: "nada dela dá vantagem de jogo **além dos três chips de atributo**". A linha "Créditos não compram atributo" **já tem exceção indireta documentada**.

## 3. Loja e o que dinheiro nunca compra

| Item | Caminho | Estado | Teste |
|---|---|---|---|
| Catálogo | `shop.ts` › `SHOP_ITEMS` (56), `TOURNAMENT_ITEMS` (8), `GUILD_ITEMS` (1, `price:0`, nunca à venda), `ALL_SHOP_ITEMS` (64; contagens de 09/09/2026) | canônico | `currencies.test.ts`, `mercadoCatalog.test.ts` |
| Transação | `shopBuy.ts` › `shopBuyRefusal`/`applyShopBuy` (`no-funds`, `already-owned`) | canônico | `shopBuy.test.ts` |
| Cadeado | `UnlockReq={kind:'mission'}`, `isShopItemUnlocked` (`missions.ts`): único gate da loja é MISSÃO | canônico | `missions.test.ts` |
| "Nunca vender" | `REGISTRO-DE-DECISOES.md` §5.4 (l. 313): evolução, `perfectDays`, HP irrestrito, escudos, conclusão, "pular o dia", **vantagem em PvP**, Glitchtama | canônico | **tese**, sem teste único |
| Cura por Créditos | removida (§5.4 l. 315) | canônico | — |

**Correção ao pedido:** `monetization.fronteira.test.ts` **não** trava "o que dinheiro nunca compra". Trava a fronteira **demo × pago de ATIVIDADES** (teto TOTAL de hábitos ativos; `DEMO_ACTIVITY_TOTAL_CAP` = `FORM_REQUIREMENTS.rookie.cap`; sem teto diário; tarefa avulsa nunca consome teto). Quem trava "dinheiro não compra vantagem": `currencies.test.ts` (Honra só cosmético; sem Bits→Créditos), `bond.recompensas.test.ts`, `frames.test.ts`, `guildReward.contract.test.js` (LV-G6). **Não existe teste que diga "nenhum item comprável altera combate"** (e `chip` altera atributo). O comentário de `currencies.ts` l. 12 ("reroll, cura instantânea") está **obsoleto**.

## 4. Itens, equipamento, decoração, molduras

| Item | Caminho | Estado | Observação |
|---|---|---|---|
| **Equipamento de combate** | — | **NÃO EXISTE** (`equipment`, `equipamento`, `gear`, `armadura`, `arma`, `inventory slot`: só ocorrências incidentais) | Superfície 100% nova |
| Decoração com SLOT | `shop.ts` `kind:'furniture'` + `slot` (`petStage.ts` `SlotId`); `ownedFurniture`, `equippedFurniture` ("um espaço, um item") | canônico | Cosmético (`PALCO-E-DECORACAO.md`). Molde de posse/slot/save |
| Cenários | `ownedBackgrounds`, `equippedBackground` (`bg-room` semeado) | canônico | idem |
| Molduras | `frames.ts` › `FRAMES` (13: 8 rank, 3 loja a 600/900/900 Bits, 1 conquista, 2 evento), `ownedFrames`/`equippedFrame` (`GameStateContext.tsx` l. 466–469), `sanitizeOwnedFrames`, `FRAMES_MAX_OWNED`=200 | canônico (R8, 04/10/2026) | `frames.test.ts`, `save.frames.test.js`. Cabeçalho: "não muda luta, ganho, XP, Bits, Emblemas nem Vínculo; nunca pode virar vantagem". Precedente: cosmético comprável com Bits |
| Consumíveis de uso | `SPECIAL_ITEMS` (chips, 💗, 🌀) em `foodInventory` | canônico | 🌀 nunca à venda |
| **Ofício / profissão** | `profissaoMasmorra.ts` › `jeitoDaProfissao` (hp×, dmg×, `reducaoDano`, `contraAtaque`, `atravessaGuarda`, `perfeito`) | canônico `[data desconhecida]` | Modificador de combate não comprado, só na Masmorra. Mais próximo de "build" que existe |
| Renascimento (orçamento) | `REBIRTH_BUDGET_MULTIPLIER`=1,5 sobre o orçamento da FICHA (`buildSheet.ts`) | canônico; **gate PAGO** | Só chega ao combate se a ficha alimentar a v3 |
| Alocação manual de elemento | `ElementPlan`, `allocateElementos` | **⏸️ parqueada v2.0**, inerte | `01-VISAO` l. 561; `G-alocacao-elemento.md`; `arena.alocacao.test.ts` (R-B verde: "a alocação não compra combate") |

## 5. Energia (duas, não confundir)

| Energia | Caminho | Regra | Teste / doc |
|---|---|---|---|
| **Cuidado** (`energyPoints`) | `types/progression.ts` › `getMaxEnergyForStage`; zera na virada | enche só COMENDO; máx = `required` do estágio; gasta só brincando (`PLAY_ENERGY_COST`=1); **entra na condição do dia completo** | `progression.test.ts`, `useDailyReset.test.ts`, `p5DiaCompleto.contract.test.ts` · `02` §6 (l. 416) |
| **Combate** (barra 0–100) | `energia.ts`, constantes de `_duel.js` | +9 dado, +7 sofrido, +36 cheer; cheia = especial | `energia.test.ts` · `02` §51/§53, REGISTRO §20.10 |

**Não existe energia de ENTRADA.** Masmorra: "sem limite diário e sem porta de entrada" (`02` §51). Pesadelo: `NIGHTMARES_PER_NIGHT`=1. Torneio: `MATCHES_PER_DAY`=5 (servidor). Feira: `RAID_ROUNDS_PER_DAY`=1.

## 6. Gates por progresso HOJE

| Modo | Gate atual | Caminho | Teste | Relação com "gate no level do usuário" |
|---|---|---|---|---|
| **Arena (Duelo)** | nenhum de progresso achado (área `arena` do `AreaView.tsx`); perder não custa nada | `ArenaGame.tsx`, `arena.ts` | `arena.test.ts` | Hoje livre. Gate novo = regressão de acesso (ninguém em produção) |
| **Torneio / PvP** | **Vínculo ≥ 5** + `MATCHES_PER_DAY`=5; faixa por lifetime | `bond.ts`, `community.js`, `tournamentTiers.ts` | `GameStateContext.pvpBlocked.test.tsx`, `tournamentTiers.test.ts` | **Já é o gate proposto.** Duplicar = 2ª fonte (footgun 9) |
| **Masmorra** | nenhum de level. Escada fixa de 6 tiers; base semanal 1–5; `deepStartCost` em Bits | `dungeon.ts` | `dungeon.deepStart.test.ts`, `dungeon.derrotaNaoCobra.test.ts` | Mudaria `02` §51 ("sem porta de entrada"); `derrotaNaoCobra` proíbe prometer custo inexistente |
| **Pesadelo** | (a) noite na janela de descanso e `onTime`; (b) `STAGE_TIER_CAP` por ESTÁGIO do pet (`nightmares.ts` l. 142) | `nightmares.ts` | `nightmares.test.ts` | Gate hoje é do Soulmon, não do usuário. Onda = 2 inimigos: "andares altos" não existe |
| **Renascimento** | `rebirthRefusal`: `already-used` → `not-paid` → `not-ultra` | `rebirthGate.ts` | `[testes de rebirth não lidos]` | **Colisão forte:** gate atual é **PAGO** + `ultra` + 1 vez. Level como gate = 3º requisito ou tira o paywall |
| **Evolução** | `perfectDays >= required` + incubação; **manual** (`MANUAL_EVOLUTION=true`) | `progression.ts`, `App.tsx` | `evolutionTarget.regression.test.ts` | Proposta mantém: sem colisão |
| **Guilda** | nenhum ("sem gate de fio, de meta ou de Vínculo", G15). Cenários do Bosque: 7 dias distintos de fio por estágio | `_coop.js` | `guild.*.test.js`, `guildReward.contract.test.js` | G15 diz o contrário do gate por level |
| **Loja** | só MISSÃO (6 cenários a 300 Bits) | `missions.ts` | `missions.test.ts` | — |

## 7. Degeneração

| Fato | Caminho | Estado |
|---|---|---|
| HP 0 na virada: desce 1 estágio, HP cheio do novo, `perfectDays = max(floor(required/2), prev − DEGENERATION_PERFECT_DAYS_COST(5))`, zera `attributesSinceLastEvolution` | `dailyReset.ts` › `computeDailyReset`, `degeneratedPerfectDays` | canônico · `02` §18 (l. 1338) |
| Manual (`handleDegenerate`, dupla confirmação) usa a MESMA conta | `App.tsx` | paridade em `useDailyReset.test.ts` |
| Raiz (rookie): piso `newHP=1`, não desce | idem | `degeneracao.cenarios.test.ts` |
| **NÃO tira:** tarefas, hábitos, moedas, coleção, `unlockedEvolutions`, `totalPerfectDays`, `totalXP` | `02` §18 "O que NÃO faz" | canônico |
| Pontos vitalícios `powerPoints/…` | `02` só cita zerar `attributesSinceLastEvolution` | `[confirmar no código se os vitalícios descem]` |
| Redenção cosmética (`applyRedemption`, `showRedeemed` opt-in, sem ponto) | `dailyReset.ts` | `redemption.test.ts`; ⚠️ `REGISTRO` §5.6 diz "⬜ não implementado" e o código existe (divergência já registrada em `02` l. 1413) |
| #59 (22/09/2026): "uma virada completa antes de re-evoluir" | `02` l. 1424 | canônico |
| **"Soulmon regride, usuário não" JÁ É o desenho:** `perfectDays` desce, `totalXP` não | `bond.ts` invariante 1 | alinhado |

## 8. Linhas vermelhas que tocam a proposta (`01-VISAO` §7 l. 212; ledger `docs/plano-melhorias/ledger/vetos.md`)

| # | Linha | Trava | Toca |
|---|---|---|---|
| 5 | `bondLevel` nunca persistido | `bond.test.ts` | Level novo = derivado de XP. A ÁRVORE de talentos precisa ser gravada: campo novo (+1 em `fuzz2`) |
| 4 | Honra comprando vantagem | `currencies.test.ts` | Equipamento com Honra |
| 3 | Bits → Créditos | `currencies.test.ts` | Qualquer troca de volta |
| 13 | Nunca vender proteção contra punição (tese) | — | Equipamento "anti-dano/regen" pago |
| 15 | Sem FOMO | `copy.semFomo.contract.test.ts` | Copy de gate ("falta N") e de talento "nunca suficiente" |
| 16 | Nunca recompensa por CONTAGEM de tarefas (tese + varredura de vocabulário) | — | "Toda atividade dá XP": hoje `completion` usa PESO DE ESFORÇO, não contagem |
| 21 | Nunca métrica de desempenho de outro jogador | tese | Level/talentos visíveis no PvP/ranking |
| 1/12/14 | Sem streak que zera / sem número que desce / sem % cru | `habitRhythm.test.ts` | Level e XP não podem descer |
| 20 | Save só ACRESCENTAR | tese | `combatStats`, talentos, equipamento |
| 19 | Mecânica cuja resposta seja "querer a notificação" | tese | n/a direto |
| — | Atributo/especial nunca vantagem paga (contexto §6) | **sem teste ainda** | Equipamento comprado; talento PvP |
| — | `REGISTRO` §5.4: nunca vender vantagem em PvP | tese | Talento PvP ~5% |
| — | R-B: "a alocação não compra combate" | `arena.alocacao.test.ts` | Mesmo princípio para qualquer build |
| — | Vínculo: recompensas 100% cosméticas, nunca vantagem de combate (`bond.ts` inv. 3; `PLANO-PRODUTO` l. 191) | `bond.recompensas.test.ts` | "1 ponto de talento por level" só cabe num level NOVO, não no Vínculo |

## 9. Colisões com a proposta do dono (§2.7) — sem escolher vencedor

| # | Proposta | Colide com | Tipo |
|---|---|---|---|
| K1 | "Level separado do usuário" + gates | Vínculo **é** o level de conta; `bond.ts` l. 539: "Todo destrave social futuro reusa ESTE nível; escada de gates sociais é grind com outro nome" | Decisão escrita |
| K2 | "1 ponto de talento por level" | `bond.ts` invariante 3 e `PLANO-PRODUTO` l. 191 | Decisão escrita |
| K3 | Gate de Arena/Masmorra/Pesadelo por level | `02` §51 "sem porta de entrada"; hoje só o Torneio tem gate | Regra de negócio |
| K4 | Gate de Renascimento no level | `rebirthGate.ts`: gate é **pago** + `ultra` + 1 vez | Regra + monetização |
| K5 | Equipamento com moeda | Fatos 1 e 2 (§2): Créditos→Bits→loja existe; chips já compram atributo | Linha vermelha (pergunta 1 do dono) |
| K6 | Vantagem ~5% no PvP | `REGISTRO` §5.4; contexto §2.7 conflito 2 | Linha vermelha |
| K7 | Gate/regressão × `copy.semFomo` | `copy.semFomo.contract.test.ts` varre `components/**`, i18n, push | Teste que trava |
| K8 | "Soulmon regride, usuário não" | já é o desenho | **Alinhado** |
| K9 | "~66% do XP vem do dia completo" | `XP_PERFECT_DAY`=50 vs `10×peso` (meta 4–6 → 40–60 de esforço): hoje ~50/50. Sem telemetria para calibrar | Calibração |
| K10 | Level define TOTAL; galho decide distribuição | Galho do DIA não existe (`dossie-codigo.md` §2.4) | Dado novo |
| K11 | Teto de level por estágio | `FORM_REQUIREMENTS.required` já é o teto de dias; segunda tabela = footgun 9 | Reaproveitável |
| K12 | Glitchtama | 🌀 soma `perfectDays` sem `totalPerfectDays`; contexto §2.4 já decidiu "DÁ ponto" | Cruzar com "XP só de dia real" |
| K13 | Level visível no PvP | Linha #21 | Linha vermelha |
| K14 | Talento "Comércio" | Não há comércio entre jogadores; `mercadoCatalog` é vitrine de itens da loja/Guilda; "Mercado" é área de UI | Superfície inexistente |
| K15 | Servidor autoritativo | Bits/Honra moram no cliente (forjáveis; aviso literal em `currencies.test.ts` l. 94–99). Só Créditos e tier são do servidor. Qualquer vantagem PvP derivada de saldo de cliente é forjável; `save.js`/`_duel.js` teriam de clampar (S1) | Restrição técnica |
| K16 | XP "de toda atividade" e combate | Bond: "não pede ação nova"; luta já rende XP com teto diário (120/60). Não inflar sem teto | Desenho |

## 10. Reaproveitável

| Reuso | De onde | Para quê |
|---|---|---|
| `bondXP`/`awardBondXP` (funil único, teto suave por fonte, `bondDaily`) | `bond.ts` | Molde de XP |
| `bondLevelFor`/`xpForLevel` + `_bond.js` + `bond.parity.test.js` | `bond.ts`, `functions/api/_bond.js` | Curva com paridade cliente/servidor |
| `meetsPvpBond`/`xpToPvpBond` + `pvpBlocked` + copy que explica | `bond.ts`, `TournamentPage.tsx` | Gate "explicado, não sumido" |
| Level derivado, nunca persistido | `bond.ts` inv. 4 | Regra do level novo |
| `completeDayReached`/`dayWasPerfect` | `dailyReset.ts` | Gatilho do XP de dia completo |
| `FORM_REQUIREMENTS`, `getMaxEnergyForStage` | `progression.ts` | Teto por estágio |
| `degeneratedPerfectDays`, espelho de `perfectDays` | `dailyReset.ts` | Regressão do level do Soulmon |
| `ownedFrames`/`sanitizeOwnedFrames`/`FRAMES_MAX_OWNED` + `save.frames.test.js` | `frames.ts` | Molde de posse e saneamento |
| `slot` + `equippedFurniture` | `shop.ts`, `petStage.ts` | Molde de slot |
| `UnlockReq` + `isShopItemUnlocked` | `shop.ts`, `missions.ts` | Cadeado visível |
| `jeitoDaProfissao` | `profissaoMasmorra.ts` | Modificadores de combate já existentes (N11) |
| `MINIGAME_BITS_PER_DAY`, `creditMinigameBits`, `deepStartCost` | `currencies.ts`, `dungeon.ts` | Teto e sumidouro de moeda |
| Honra + `TOURNAMENT_ITEMS` | `shop.ts` | Moeda de equipamento **só se** o item continuar cosmético (proib. 4) |
| `hydrate.fuzz2.qa.test.tsx` (=103 campos) | `GameStateContext` | Campo novo = 104+ |

## 11. Vazios (buscados com variantes)

- Level/XP de **usuário** separado do Vínculo.
- Árvore/pontos de talento.
- Equipamento de combate e qualquer `statBonus` em item.
- Teste de "nenhum item comprável altera combate".
- `level-de-conta.md`.
- Gate de nível em Arena/Masmorra/Pesadelo/Guilda.
- Comércio entre jogadores.
- Energia de entrada.
- Galho dominante do DIA.
- Não lidos (limite): testes de rebirth, frames, energia, `_entitlements`; `STATUS.md`; `PERGUNTAS-DO-DONO.md` #55/#59b.
- Telemetria: nenhuma, nada para calibrar level.

## 12. Ordem de leitura (3 que mais economizam tempo)

1. `src/utils/bond.ts` (cabeçalho l. 1–45; §4 recompensas; §6 gate PvP l. 525–566) + `02-REGRAS` §55 (l. 4940): a proposta de level já existe aqui, com o argumento contra "escada de gates".
2. `01-VISAO.md` §7 (l. 212–250) + `REGISTRO-DE-DECISOES.md` §5.4 (l. 309–324) + `src/utils/currencies.test.ts`: linhas vermelhas e o que cada teste realmente trava.
3. `src/utils/shop.ts` (chips l. 49–120; `GUILD_ITEMS` l. 433) + `src/utils/rebirthGate.ts` + cabeçalho de `src/utils/frames.ts`: atributo comprável, gate pago do Renascimento, molde de cosmético por moeda.
Depois: `02` §18 (degeneração), §51 (Masmorra), §53 (Torneio).
