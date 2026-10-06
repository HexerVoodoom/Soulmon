# Alinhamento: visão do dono (07/10/2026) × Combate v3 construído

| Meta | Valor |
|---|---|
| Auditoria | SOMENTE LEITURA, 07/10/2026 |
| Código lido | `origin/main` `3c2dc8298` (worktree só-leitura, depois removido) |
| Docs cruzados | `contexto.md` §2.x, `discovery/arquitetura-camadas.md` (rascunho, parte superada), `builder/balanco-motores.md`, `prototyper/benchmark-monetizacao.md`, `prototyper/benchmark-lootbox.md`, `REGISTRO-DE-DECISOES.md` §24 |
| Regra | Evidência é `arquivo:símbolo` no código; doc só como apoio. Nada foi rodado nesta auditoria (não medi nada novo; números de balanço são os já medidos no run) |

Placar: **ALINHADO 3 · PARCIAL 6 · DIVERGENTE 1 · AUSENTE 0** (V11 é este documento). Há ausências parciais dentro de V9 e V6 (descritas na linha).

## 1. Matriz V1–V11

| # | Visão do dono | Status | Evidência (código) | O que falta |
|---|---|---|---|---|
| V1 | Personagem único, gerado do teste inicial | ALINHADO | `ficha/fromInput.ts` monta `buildFicha(...)` por estágio a partir de `oracleAxes` (onboarding); `buildAllStageSkills(fichaByStage, seedKey, oracleAxes.dominantElement)`. Tudo determinístico por `seedKey`. Anterior ao v3 (REGISTRO 28/09: "criação única") | nada para a visão. Ressalva: cache `soulmonSkills` é gravado uma vez no save |
| V2 | Seleção no bestiário distribuída nas classes | ALINHADO | `ficha/capture.ts: selectCompanion` (sorteio semeado sobre `capturableCreatures`, exige afinidade elemental + Evocação); bestiário = corpus completo menos procedurais (REGISTRO 06/10) | nada. Nota: a classe "nunca aparece ao jogador" (`classeNuncaVisivel.contract.test.tsx`, decisão do dono 28/09) |
| V3 | Evoluir avança nas classes e COMBINA elementos | PARCIAL | `ficha/buildSheet.ts`: `ELEMENT_ORCAMENTO_BY_STAGE` 30/60/120/300/500, `FOCUS_EXPONENT`, cascata de pares (`cascata.ts`, `CUSTO_PONTO_PAR`). Comentário do próprio código: rookie–ultimate só bases; mega "quase destravando"; ultra compra o par em ~73% dos perfis | a combinação só existe no ultra e só em ~73%; o jogador não escolhe e (pela regra da classe invisível) não vê o avanço; ver V4 (o par nem vira golpe básico) |
| V4 | Golpe básico SEMPRE no elemento principal (par/combinado se desbloqueado) | **DIVERGENTE** | ver §2: `skills.ts: buildStageSkills` fixa `elBasica = topBase` (base mais forte, nunca o par); Masmorra/Pesadelo/Duelo usam o elemento do ORÁCULO (`soulmonMeta.dominantElement`, 8 elementos) para básico E especial; Arena usa o da ficha; oponente real do PvP usa hash do nome | unificar o dono do elemento do básico; passar o par adiante (anel só tem 17 bases) |
| V5 | Especial por summon: cura, DoT etc. (várias) | PARCIAL | `combate/specials.ts: SPECIAL_FAMILIES` = direct, dot, heal, shield, atkBuff, defDebuff, spdBuff (7). Sorteio ponderado `nomeEspecial.ts: familiaDoEspecial` (`PESO_FAMILIA_ESCOLA`, `AFINIDADE_ELEMENTO`, seed) — toda família tem peso > 0 em toda escola, logo alcançável | **não há** HoT (heal é instantâneo no orçamento E = 3 golpes), nem maldição como mecânica própria (`maldicao` é só escola; vira defDebuff/dot). A família é decidida pela seed do onboarding, não "pelo que foi gerado" de forma legível ao jogador |
| V6 | Ao evoluir o especial é REVISTO conforme o que o usuário fez | PARCIAL (parte AUSENTE) | Muda por estágio: `buildAllStageSkills` gera família+nome NOVOS por estágio com `usados` (`fam:`/`esp:`), elemento do especial = `topGeral` ou o 2º. Atributos mudam pelo comportamento: `soulXP.ts: soulLevel`, `soulWeights` (galho `powerPoints/harmonyPoints/benevolencePoints`) → `level.ts: distributePoints` (teto 45%, piso 15%); chips afetam só o galho (REGISTRO §24 item 9) | **o ESPECIAL (família/elemento/nome) não reage ao comportamento**: os 5 estágios são pré-calculados de uma vez a partir do onboarding. `ElementPlan` (`buildSheet.ts`, "o plano do jogador") existe mas `buildFicha` nunca o recebe fora de testes (`fromInput.ts:45`) |
| V7 | Mesmas condições de vitória, "mais ou menos" | ALINHADO (margem fina na torcida) | Régua `combate/ruler.ts` ±5% de TEMPO no espelho (buff −15% rookie), 0/42 fora. Medições em §3 abaixo | ver §3: torcida da Arena em +24,8pp (limite 25pp); régua oficial não enxerga o bestiário |
| V8 | Equipamentos, engajamento, theorycraft | PARCIAL | `equipment.ts`: 3 slots (Núcleo→ATK, Carapaça→DEF, Rastro→SPD) × 3 tiers (`TIER_PCT` 0,5/1/1,5%), `FRAGMENTS_PER_RUN`=5 da Masmorra completa, só Bits ganhos (`bitsOrigin.ts: earnedBits`), sem RNG | theorycraft raso: 9 itens, todos "+% num atributo"; nenhum item muda especial, elemento ou jogo; preços/fragmentos são defaults da squad (dono não fixou) |
| V9 | Árvore de talentos DO JOGADOR: PvE/PvP, respec pago, customização, ex. healer+DoT | PARCIAL | `talents.ts: TALENT_TREE` 21 nós em 3 caminhos (pvp, pve, comercio); `talentPointsFor(bondLevel)`; `respecCost`/`applyRespec`/`applyRespecOne` (pago, Bits ganhos); servidor `_talents.js` + paridade. Foco PvE×PvP: ALINHADO | **nenhum talento toca o especial.** Efeitos existentes: `combatBonus` (%), `cheerBoost`, `respecOne`, `equipPrice`, `fragmentGain`, `respecDiscount`; **11 de 21 nós são `kind: 'pendente'`** (pvp 04/06/07, pve 03–07, com 04/06/07; o briefing falava 13, o código dá 11) — ver §4 |
| V10 | Não parecer pay-to-win; benchmark do que funcionou | PARCIAL | Decisões aplicadas: `bitsOrigin.ts` (`CREDIT_BITS_CAP_RATIO` 25%), equipamento sem Crédito, teto único 5% (`combate/bonus.ts: COMBAT_BONUS_CAP`), REGISTRO §24 itens 6–8. Benchmark em `benchmark-monetizacao.md` | falta retorno financeiro/conversão; ver §5 |
| V11 | Ver o quanto alinhou e divergiu | ALINHADO | este documento | — |

## 2. V4 em detalhe: o golpe básico não usa sempre o elemento principal

O que está no código, tela por tela (elemento = o que decide arte e, na Arena, vantagem):

| Tela | De onde vem o elemento do golpe BÁSICO | Do ESPECIAL | Arquivo:símbolo |
|---|---|---|---|
| Arena | `basica.elementoId` da ficha = **base mais forte** (`topBase`); fallback `atributos.principal` | `especial.elementoId` (pode ser o par) | `ArenaGame.tsx:216 playerElement`, `:144 elements`; `skills.ts: elBasica` |
| Masmorra | `soulmonMeta.dominantElement` (elemento do ORÁCULO, 8 ids) | o MESMO elemento (um `petEl` para os dois papéis) | `DungeonGame.tsx:203,289 playerElement: () => petEl` |
| Pesadelo | idem Masmorra | idem | `NightmareBattle.tsx:152,211` |
| Duelo/Torneio (meu lado) | `soulmonMeta.dominantElement` | idem | `DuelScreen.tsx:97 meEl`, `:181` |
| PvP, oponente real | `visualElementFor(oppName)` = **hash do nome**, não o elemento dele | idem | `DuelScreen.tsx:98 oppEl`; `TournamentPage.tsx:512` sem `oppElement`; o `fx` publicado só leva escola/família/lex |
| Treino com NPC | `visualElementFor(npc.id)` | idem | `TournamentPage.tsx:494` |

Pontos:
- **Forma do golpe** (melee/ranged) vem da ESCOLA quando há ficha (`combatFx.ts: fighterStrikeForm`, `SCHOOL_STRIKE_FORM` em `ficha/strikeForm.ts`) e do ELEMENTO só sem ficha (`ELEMENT_STRIKE_FORM`, 17 base + aco + lava/gelo/veneno + neutro). Isso é coerente nas 4 telas (PR1b). O que diverge é o **elemento**, não a forma.
- **`elementoDominante` (#232)** (`skills.ts:80,243`: `{id: topGeral}`, base OU par) só é lido por `arena/DueloSheet.tsx:59-60` para o ícone da ficha de duelo. Nenhuma tela de luta o usa para o golpe. Ou seja, "o elemento principal" aparece com 3 valores diferentes: `topBase` (Arena), oráculo (Masmorra/Pesadelo/Duelo) e `topGeral` (ficha de duelo).
- **Vantagem elemental**: só a Arena aplica (`arena.ts:422 elementAdvantage(p.elements.basica, fe)` e `:452` para o especial). Masmorra, Pesadelo e PvP não têm vantagem elemental, só arte.
- **Elemento combinado**: o par só chega ao ESPECIAL (`elEspecial = topGeral` se não for a base). O anel de vantagem (`arena.ts`, 17 bases) não tem regra para par; hoje o par entra por `elements.especial` sem tratamento explícito.
- Origem: `skills.ts` diz "básica fala a língua de todo dia (base); especial, a mais avançada". É decisão de design anterior à visão de 07/10 e **não aparece em §24 como decisão do dono**. Ou seja, divergência herdada de código, não escolha do dono nem limite técnico duro (o limite parcial é o anel de 17 bases e a arte por elemento).
- Não verifiquei se existe arte por par em `elementIconArt.ts`/`combatFx` (par cai em `neutro` via `fxElementId`).

## 3. V7: medições de balanço (as do run, na `main` `7c76eaf9`/`3c2dc829`)

Fonte: `builder/balanco-motores.md`, `contexto.md` §2.27, `REGISTRO` §24.6. Não rerodei.

- **Régua pareada**: 7 famílias × 6 levels, ±5% de tempo (buff −15% no rookie): 0/42 fora. `PVE_FAMILY_POWER` por motor existe para domar cura/buff no PvE (spread de famílias 28,1pp → 14,3pp com a tabela).
- **Builds** (atk/def/spd/balanced): Arena 64,0–68,6% (4,6pp); gap máx. entre builds ≤ 10% (8,0% def×spd L1); Arena em grupo 64,4–69,1%.
- **Por estágio**: Arena 58,0–70,9%; Pesadelo 100% de vitória (é recompensa).
- **Escolas**: 63,4–71,3% (7,9pp) na régua; 61,9–71,1% (9,2pp) com pool real.
- **Famílias × área**: 60,3–72,3% (12,1pp, meta ≤ 20pp); com pool real 56,9–63,3% (6,4pp).
- **Elemento do jogador no pool real do bestiário** (N = 1600): 60,1–67,5% (7,4pp). Medido à parte porque a régua oficial usa o espelho `arenaFoe`.
- **Habilidade** (anel/esquiva): Arena 23,6pp (meta ≤ 25pp); Masmorra concluir os 5 andares 30,2pp (aceito pelo dono).
- **Torcida** (só Arena e Duelo): `energyPerDischarge` = 9, +24,8pp (margem **0,2pp**), +25,0pp com pool real (ruído ±2pp); PvP 64,3–64,5% com torcida no teto (`pvpEnergyPerDischarge` 2,5).
- **PvP**: o mais fraco por 5% vence 31,4% (meta 25–40%); 1 level abaixo vence 17,3%; mais forte por 5% vence 64–67% (o dono ouviu que prometiam ~90% e manteve); duração mediana 38–39 s.
- **Masmorra**: andares 1–4 100%, andar 5 36,6%, andar 6 0%.
- Dentro de V7 que NÃO foi medido: elemento do jogador no básico com par (não existe ainda), vantagem elemental no PvP/Masmorra (não existe), o efeito de qualquer talento que mude o especial.

## 4. V9: talentos × especial, e o que seria preciso

Hoje: `TalentEffect` (`talents.ts:33-47`) só tem bônus percentual (`combatBonus`: `PVE_STEP` 0,6%/grau, `PVP_STEP` 0,4%/grau), `cheerBoost` (até +15%, `CHEER_SCALE_MAX`), preço/fragmentos/respec. O teto único está em `combate/bonus.ts: COMBAT_BONUS_CAP = 0.05` (soma talento+equipamento+comércio+renascimento, e no PvP a SOMA dos 3 canais ATK/DEF/SPD). **Não existe talento "ao curar, aplica DoT".**

Um talento que MODIFICA o especial sem estourar a régua ±5% e o teto de 5% precisa ser **neutro em orçamento**, não um bônus:

1. **Desenho**: o especial gasta `SPECIAL_BUDGET_HITS = 3` golpes de E. O talento **redistribui** esse orçamento (ex.: heal 3 golpes → heal 2,1 + DoT 0,9), sem somar. Total de E constante ⇒ não entra em `combinedBonus` e não consome os 5%.
2. **Motor** (`combate/fight.ts`, `group.ts`, espelho `functions/api/_combate.js`): suportar família composta (primária + "carona"), com eventos próprios; o DoT já existe como família (`dot`), então a carona reutiliza o tick.
3. **Régua**: acrescentar as células híbridas em `ruler.ts` (cada família × cada carona permitida × 6 levels) e provar ±5% no espelho; recalibrar `SPECIAL_POWER`/`PVE_FAMILY_POWER` para as combinações (o repasse de DoT em área já deu +12–20pp antes de ser corrigido, ver `balanco-motores.md` §6).
4. **Talentos**: novo `TalentEffect` (ex.: `kind: 'specialRider'`), validação em `isValidPicks`/`sanitizeTalentPicks`, espelho `_talents.js` + `talents.parity.test.js`; preencher nós `pendente` (hoje 11).
5. **PvP**: o servidor recalcula tudo do save (`_duel.js`); a carona precisa estar no log de eventos de `combate.parity.test.js` (8400 lutas). Decisão aberta: valer no PvP ou só PvE (o dono aceitou 5% no PvP, §24.3, mas isso é número; mudar a forma do especial no PvP é outra classe de vantagem).
6. **UI/copy**: o nome do especial é por regra (`comporNome`, léxico por família, PvP publica só `lex`); a carona precisa de rótulo e de léxico (`SUBSTANTIVOS_POR_FAMILIA` = 8 por família, validado pelo servidor).
7. **Risco de régua**: é a vantagem "invisível" pelo teto de 5%: uma combinação pode render mais que 5% sem aparecer no `combinedBonus`. Por isso a régua de tempo precisa rodar sobre as combinações, não só sobre bônus.

## 5. V10: benchmark de monetização

**Já existe** (`benchmark-monetizacao.md`, 05/10/2026; `benchmark-lootbox.md`, 05/10/2026): matriz "o que o dinheiro acelera × o que nunca compra" para Marvel Snap, Clash Royale, Habitica, Pokémon GO, Pokémon Sleep, Genshin, Duolingo e Finch; proteção do PvP em 3 famílias (normalizar, rank só por vitória, liga por faixa); regra de ouro "dinheiro compra tempo de recurso com teto diário, nunca o produto final"; teto de aceleração paga +25% (hipótese, `[suposição]`); caso a evitar = Clash Royale nível 16 (nov/2025), Duolingo como contra-padrão (restringir o grátis); lootbox: Brawl Stars (removeu em 12/12/2022), Bélgica/FIFA, Lei 15.211/2025 (vigor 17/03/2026), acordo FTC US$20 mi (17/01/2025). Decisões do dono derivadas: sem RNG pago, Créditos só não-combate com teto +25%, equipamento só com moeda ganha (`REGISTRO` §24.1/§24.6).

**NÃO coberto** (e o que o run diz de si mesmo):
- **Retorno financeiro e aceitação com número**: nenhum dado de receita, ARPPU, conversão, retenção ou churn para nenhum dos 8 exemplos. O texto só tem preço de assinatura e reação de imprensa. Duolingo: "empresa reporta aumento de DAU e conversão" sem fonte/data de número.
- Fontes frágeis: Axios (403) e wiki do Habitica (402) só por snippet; Genshin "grátis ~60/dia" sem fonte primária; imprensa de nicho (score 0,5–0,6); nenhuma fonte oficial de Duolingo/Finch/HoYoverse/FTC.
- Exemplos pedidos que ficaram rasos: **Genshin, Clash Royale, Marvel Snap, Habitica, Finch, Duolingo, Pokémon GO/Sleep** têm preço e política, não retorno.
- Ausentes: Brawl Stars pós-2024 (só indício), EA FC pós-2026, Holanda/UK/Apple/Google, **classificação etária do Soulmon** (lacuna jurídica declarada), nenhum benchmark de **app de hábito/pet com PvP** (reconhecido como gap).
- Sem telemetria do Soulmon: todo número do Soulmon é `[suposição]`.

**Proposta de pesquisa** (cada item com fonte e data, sem inferir quando faltar):
1. Receita/conversão com fonte primária: relatórios trimestrais públicos (Duolingo 10-K/10-Q e carta aos acionistas), Sensor Tower/Appmagic como secundária (marcar score), para Duolingo, Genshin, Clash Royale, Marvel Snap, Pokémon GO. Para Habitica/Finch, entrevistas e posts oficiais (receita não é pública).
2. Aceitação: nota de loja antes/depois e % de reviews citando "pay to win" em cada mudança datada (CR nível 16, Duolingo Energy abr/2025), com contagem e janela de datas.
3. O que é comparável ao Soulmon: **app de hábito com meta-jogo** (Habitica, Finch, Fabulous, Forest, Pokémon Sleep): receita por assinatura vs. por consumível, e se algum vende vantagem competitiva. Marcar claramente o que não é comparável (gacha de personagem).
4. Mesmo assim o resultado só calibra hipótese: o teto +25% e o preço dos Créditos só se confirmam com usuário real.

## 6. Onde divergiu e por quê

| Divergência | Por quê | Natureza |
|---|---|---|
| Básico no `topBase`, não no par (V4) | comentário em `skills.ts` ("língua de todo dia"); herdado, nunca reaberto | **Código herdado**, não decisão registrada do dono. Limite técnico parcial: anel de vantagem só tem 17 bases |
| Masmorra/Pesadelo/Duelo usam o elemento do oráculo (V4) | PR1b unificou a FORMA do golpe, mas o elemento continuou vindo de `petElement`/`soulmonMeta.dominantElement` | Dívida de unificação; sem decisão do dono |
| Oponente real do PvP com elemento por hash (V4) | `fx` do perfil público só leva escola/família/lex; elemento não é publicado | Limite técnico (o PvP publica só ID, nunca texto do save; elemento não entrou no contrato) |
| Especial não reage ao comportamento (V6) | família/nome por REGRA, novo a cada estágio, seed do onboarding; o dono decidiu "nome por regra, sem IA" (§24.6 item 9), não que dependa do comportamento | **Escolha de implementação** do PR9; a visão do dono diz outra coisa. `contexto.md` Q6 ("especial muda ao evoluir") ficou como "muda por estágio", não "muda pelo que fez" |
| Sem HoT/maldição como mecânica (V5) | 7 famílias fechadas, calibradas na régua; heal instantâneo | Escolha de escopo do spike; `maldicao` sobrou só como escola |
| Talentos sem efeito sobre especial (V9) | decisão do dono: efeito percentual ≤ 5% e teto único (§24, §2.8/§2.9); o desenho do canal é de bônus | Decisão do dono sobre a FORMA; a visão de 07/10 pede outra classe de efeito |
| 11 nós `pendente` (V9) | PRs de talento priorizaram os que cabem no teto (PR7/PR7b/PR8) | Escopo ainda não entregue |
| PvE e PvP com 5%, PvP não normalizado | decisão consciente do dono (§24 item 3 e §24.6 item 4) | Decisão do dono, fora da visão de 07/10 (que não menciona) |
| Level desce na degeneração (V3/V6) | decisão do dono (§24.6 item 10) | Decisão do dono |

## 7. Lacunas, em ordem de impacto

| # | Lacuna | Esforço | Risco |
|---|---|---|---|
| 1 | **V4**: um único dono do elemento do golpe básico (maior peso da ficha, base ou par) lido pelas 4 telas; publicar o elemento do oponente real no `fx` (lista fechada, validada no servidor); regra de vantagem para par no anel | **M** | Médio: toca `arena.ts` (`elementHits`), `skills.ts` (cache `soulmonSkills` de saves antigos), `_duel.js`/paridade, testes `combatFx.pr1b` e `arena.v3`; a régua de torcida está a 0,2pp do limite e qualquer mudança em elemento pede nova medição |
| 2 | **V6**: especial revisto na evolução pelo comportamento (galho acumulado, categorias de tarefa) em vez de pré-calculado; ligar `ElementPlan` ou um sinal equivalente a `buildStageSkills` | **G** | Alto: quebra o determinismo do cache (`skillsTemFamilia`), o PvP valida `lex`, mexe em save; precisa de decisão de produto sobre o que "o que o usuário fez" mede |
| 3 | **V9**: talentos que modificam o especial (carona de família) + preencher os 11 nós `pendente` | **G** | Alto: nova classe de vantagem fora do teto de 5%; recalibrar régua para híbridos; paridade servidor de 8400 lutas; nome/léxico |
| 4 | **V10**: benchmark com retorno financeiro e aceitação, com fonte e data | **M** (pesquisa) | Baixo para o código; alto para a confiança do dono: sem dado de receita, os tetos (+25%, 25%) seguem `[suposição]` |
| 5 | **V3/V5**: combinação de elementos só aparece no ultra e o jogador não a vê; HoT/maldição como mecânica própria | **M–G** | Médio: conflita com "classe nunca aparece" e com a escada de orçamento (`ELEMENT_ORCAMENTO_BY_STAGE`) |
| 6 | **V8**: theorycraft do equipamento (hoje 9 itens de % em atributo) | **M** | Médio: qualquer item que mude o especial cai na mesma régua da lacuna 3 |

## 8. Perguntas ao dono (formato modal)

**P1. Qual é "o elemento principal" do golpe básico quando o Soulmon já tem um elemento combinado?**
- (a) O de MAIOR PESO da ficha, base ou combinado, em todas as telas (inclui o oponente real do PvP). Recomendado: é a sua visão literal e unifica 3 fontes que hoje divergem.
- (b) Base mais forte no básico, combinado só no especial (como está hoje na Arena).
- (c) O jogador escolhe qual dos dois usa.
Recomendação: (a). Custo M; a vantagem elemental para combinado precisa de uma regra (melhor dos dois componentes ou média) que você também decide.

**P2. O que deve mudar no especial quando evolui?**
- (a) Família, elemento e atributos são recalculados na evolução a partir do que o usuário FEZ (galho acumulado, categorias de tarefa), com sinal medido e explicado ao jogador. Recomendado.
- (b) Fica como está: o especial de cada estágio é decidido no onboarding e só os atributos reagem ao comportamento.
- (c) Na evolução o jogador escolhe 1 entre 2–3 especiais propostos pelo comportamento.
Recomendação: (a) com (c) como válvula, se você quer previsibilidade. (b) é o que foi construído.

**P3. Como um talento deve mexer no especial (ex.: healer que aplica DoT)?**
- (a) Variante de orçamento neutro: o talento REDISTRIBUI os 3 golpes de E (ex.: 70% cura + 30% DoT), provado na régua ±5%, sem consumir os 5%. Recomendado.
- (b) Bônus numérico dentro dos 5% atuais (não faz o healer+DoT, só um percentual).
- (c) Só PvE: o talento de especial não vale no PvP, que fica com os 5% de atributo.
Recomendação: (a) com (c) até medir o PvP. É a lacuna G; custo de régua e paridade é o principal.

**P4. Como fechar o receio de pay-to-win com dado?**
- (a) Encomendar a pesquisa de retorno financeiro e aceitação com fonte primária e data (seção 5), antes de definir qualquer SKU ou teto novo. Recomendado.
- (b) Seguir com os tetos já decididos (+25%, sem RNG pago, equipamento só moeda ganha) e só medir depois, com usuários reais.
- (c) Congelar qualquer venda que toque combate até haver usuário.
Recomendação: (a) (custo M, sem código). Se quiser ir mais rápido, (b) já é seguro pela regra "dinheiro real nunca vira vantagem percentual".
