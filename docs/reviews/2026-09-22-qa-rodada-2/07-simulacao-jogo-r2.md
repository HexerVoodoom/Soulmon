# 07 — Simulação do JOGO (90 dias) — QA Rodada 2, 22/09/2026

Guardas de REGRA DE JOGO (permanência · constância · nascimento · vínculo · sustento) + monster-taming-designer + alpha-comportamento, atuando inline.
Repo `D:\Soulmon\repo`, branch `qa/rodada-2-2026-09-22`, HEAD `a6c1cd8a`. Somente leitura no repo; scripts e saída em
`E:/tmp/claude/D--Soulmon/cd027ac4-4330-4f5c-b0a7-b8a491506f57/scratchpad/qa3/sim/` (`sim90.ts`, `run.ts`, `oracle-census.ts`, `oracle-census2.ts`; bundle com o `esbuild` do próprio repo; tabela completa dia×perfil em `sim/tabela-dia-x-perfil.md`, censo do oráculo em `sim/oracle-census*.out.md`).

## 0. Método (o que a simulação É e o que NÃO é)

- Importa as funções puras reais: `src/utils/dailyReset.ts` › `computeDailyReset`/`tasksToAvoidHeartLoss`, `careRules.ts` › `feedFood`/`foodForCompletedTask`, `habitRhythm.ts` › `completeHabit`/`attributeMultiplier`/`habitTier`/`needsIntervention`, `bond.ts` › `awardBondXP`/`bondLevelFor`, `evolutionTarget.ts` › `evolutionTarget`, `specialItemUse.ts` › `applySpecialItem`, `poopDrain.ts` › `applyPoopDrain`, `shop.ts` › `SHOP_ITEMS`/`TOURNAMENT_ITEMS`, `petVoice.ts` › `petVoiceLine`, `oracle.ts` › `generateOracle`/`ORACLE_QUESTIONS`, `newReading.ts` › `readingSeed`.
- Reproduz o que o `App.tsx` faz em volta delas (lido, não importado): `handleEvolve` (evolução manual assim que `perfectDays >= required`, HP volta ao máximo, `perfectDays = 0`), `withHabitCompletion` (bond XP `completion` + multiplicador de tier), `handleFeed` (come tudo o que ganhou na mesma sessão), `handleGlitchtama` (1 🌀 por run completa), Bits de uma run = `TIER_BASE.points × ptsMult` por andar + `clearBonus` (`DungeonGame.tsx`), fala do toque = escada de fallback de `CompanionHUD.tsx`.
- Uma virada por abertura (como `useDailyReset.ts` › `rolloverPendingFor`): quem some N dias tem UMA virada ao voltar. Dia começa 22/09/2026 (terça), d1 = 23/09. Sem traço de nascimento, sem tarefas avulsas (só hábitos), sem check-in de humor, sem noite/sonhos/pesadelo, sem torneio.
- **Limites**: energia/comida assumem que a pessoa come na mesma sessão em que conclui; o dreno de cocô só é simulado nos perfis `Dp`/`Dmp` (abre 9h, cocô na tela, reabre 21h sem banho); o censo do oráculo roda o caminho `generateOracle` (legado = demo reveal + saves anteriores ao `soulProfile`), não o pipeline pago (`generateOracleComplete`, que exige efemérides/class-system).

## 1. Perfis e resultado em uma linha

| Perfil | O que faz | d90 | Evoluções (dia) | Quedas | ♥ perdidos | Dias completos reais | Vínculo d1/d7/d30/d90 | Bits d90 |
|---|---|---|---|---|---|---|---|---|
| **A** | tudo, todo dia, 4 hábitos | ultra 5/5 | ch d5 · ul d10 · mg d15 · **ultra d60** | 0 | 0 | 89 | L3/L6/L12/L21 | **0** |
| **A6** | tudo, todo dia, 6 hábitos | ultra 5/5 | idênticas a A | 0 | 0 | 89 | L3/L7/L15/L25 | 0 |
| **B** | abre todo dia; faz tudo seg/qua/sex + 1 run masmorra/dia feito + usa 🌀 | mega 3.5/4 | ch d4 · ul d11 · mg d18, depois **ioiô mg↔ul ×6** | 6 | **37** | 38 (+39 de 🌀) | L3/L5/L10/L16 | 13 598 |
| **Bg** | = B sem masmorra/🌀 (hábitos cadastrados todo dia) | rookie 3/3 | ch d9, depois **ioiô rookie↔ch ×12** (evolui qui, cai seg) | **12** | 37 | 38 | L3/L4/L9/L14 | 0 |
| **Bs** | = Bg com hábitos cadastrados SÓ seg/qua/sex | mega 4/4 | ch d9 · ul d21 · **mg d32** | 0 | **0** | 38 | idem Bg | 0 |
| **Bt** | = Bg com hábitos "3x por semana" (`timesPerWeek 3`) | rookie 3/3 | ch d9, depois ioiô ×6 (cai toda 2ª semana) | 6 | **25** | 38 | idem Bg | 0 |
| **Bx** | = Bg mas **só abre** seg/qua/sex | rookie 3/3 | **nenhuma** | 0 | 0 | **0** | L3/L4/L8/L14 | 0 |
| **Bsx** | = Bs mas só abre seg/qua/sex | rookie 3/3 | **nenhuma** | 0 | 0 | **0** | idem Bx | 0 |
| **C** | tudo; some d20–29; volta e faz tudo | ultra 5/5 | mg d15 · ultra **d71** (A: d60) | 0 | 0 | 78 | L3/L6/L10/L20 | 0 |
| **C2** | = C, volta d30 e fica 5 dias sem fazer nada | ultra 5/5 | ultra d76 | 0 | 1 | 73 | L3/L6/L10/L19 | 0 |
| **D** | só abre, não faz nada | rookie **1/3** | — | 0 (piso da raiz) | 3 (d5, d6, d8) e depois HP=1 fixo | 0 | **L1 sempre** | 0 |
| **Dp** | D + cocô sem banho | rookie **0/3** | — | 0 | **90** (1/dia, todo dia, inclusive d1–d3 e dias de folga) | 0 | L1 | 0 |
| **Dm** | tudo (6 hábitos) até d40, depois só abre | rookie 1/3 | mg d15; **d46 cai e re-evolui no MESMO dia** | 4 (d46, d52, d55, d59) | 17 | 40 | L3/L7/L15/L17 | 0 |
| **Dmp** | = Dm + cocô sem banho a partir de d41 | rookie **0/3** | idem | 4 (d44, d47, d50, d52) — **2 ♥/dia** | **59,5** | 40 | idem | 0 |
| **G** | zero hábitos; 1 run masmorra/dia + usa 🌀 | ch 2.5/3 | ch d5, ioiô rookie↔ch ×12 | 12 | 74 | **0** (mas `totalPerfectDays` = **90**) | L1/L4/L7/L11 | **34 566** |

Legenda: ch = champion, ul = ultimate, mg = mega. Tabela dia a dia (HP, estágio, `perfectDays`, marcas `*`/`-N`/`perdoa`/`folga`/`volta`/`+0.5`/`Gn`/`EVO`/`DEG`) em `sim/tabela-dia-x-perfil.md`.

## 2. Achados

### 2.1 🔴 A virada só julga ONTEM: quem faz e não abre no dia seguinte nunca recebe o dia completo (perfis Bx, Bsx)

`computeDailyReset` › `yesterdayString` julga um único dia. `daysSinceLastReset` só serve ao perdão (`wasAway`). Quem faz tudo na segunda e reabre na quarta tem a virada de quarta olhando a TERÇA: `activity.lastCompletedDate === yesterdayString` falha, `dailyDone = 0`, e como `daysAway = 2 >= ABSENCE_FORGIVENESS_DAYS` a virada perdoa — e também **não credita**. Resultado medido: **Bx e Bsx = 0 dias completos em 90 dias, rookie para sempre**, fazendo 100% dos hábitos 3× por semana (39 `welcomeBack` seguidos). O mesmo jogador abrindo todo dia (Bs) chega a mega em 32 dias sem perder coração.

- É a persona da métrica-norte (`01-VISAO` §3: usuário ativo = "concluiu ≥1 item real na semana"; sustentação = "≥4 dos 7 dias"). A pessoa que abre para fazer e fecha satisfeita é a que o produto diz querer — e é a única que o motor não vê.
- Não é perdão que esvazia nem cobrança: é **crédito que evapora**. Nenhuma das 21 linhas vermelhas cobre ("contador que zera" não é; o contador nunca subiu).
- `02-REGRAS` §1 diz "Não cobra de quem sumiu"; nada diz "nem credita". §7 (dia completo) não avisa que o dia completo só existe se houver virada no dia seguinte. `welcomeBack.ts` recebe a pessoa "sem cobrança" — e sem contar o que ela fez.
- Agrava: `habitRhythms` também não é escrito (`if (!wasAway)`), mas `withHabitCompletion` já gravou `done` na hora da conclusão — o ritmo sabe que foi feito; a virada não lê.

**Conserto** (decisão do dono, não de squad): a virada julgar o dia de `lastResetDate` (o último dia em que a pessoa esteve), não `now − 1`; ou creditar `dayWasPerfect` para cada dia entre `lastResetDate` e ontem em que `habitRhythms[*].done` cubra a meta. Guard: teste "faz tudo na segunda, abre na quarta → `perfectDays` +1". Dono: `soulmon-guarda-constancia` + dono do produto (é regra de jogo nova).

### 2.2 🔴 Degenerar → re-evoluir no MESMO dia, com HP cheio (perfis B, Dm, Dmp)

`degeneratedPerfectDays` devolve `max(floor(req/2), prev − 5)`; `handleEvolve` (`App.tsx`) só exige `perfectDays >= required` do estágio ATUAL. Mega com 26 dias completos que cai para ultimate reaparece com 21 ≥ 5 → o botão Evoluir acende **na mesma abertura**, e a evolução entrega `healthPoints = MAX_HP_BY_FORM` (4) de novo. Medido: Dm d46 `DEGENEROU mega→ultimate (26→21, HP 1→3)` e `EVOLUIU ultimate→mega (21/5)` no mesmo dia; B em d54, d66 e d89 idem. `applyRedemption` marca `redeemed: true` por apertar um botão segundos depois de cair.

- A queda vira **cura cheia grátis** para quem tem ≥ `required + 5` dias no banco (todo mega a caminho do ultra, que acumula até 45). Contradiz "consequência dá sentido ao cuidado" (`REGISTRO-DE-DECISOES.md` §10.1, Aposta 4) — e a cerimônia de evolução toca por uma queda.
- Quem NÃO aperta o botão cai 3 estágios em 14 dias (Dm sem re-evoluir: ul d46 → ch ~d50 → rookie ~d54) com 11 dias completos ainda no banco. Dois jogadores idênticos, um clique de diferença, três estágios de diferença.
- `02-REGRAS` §18 descreve piso+custo e a paridade auto/manual, mas não este efeito; §17 (cadeado) não menciona carência pós-queda.

**Conserto**: ou a queda zera `perfectDays` até o piso quando o piso é menor que `required` do estágio novo (aí o custo é real), ou `handleEvolve`/`canEvolve` exigem `!degeneratedByHP` até o próximo `dayWasPerfect` (uma virada boa antes de subir — é isso que "redenção" deveria significar). Guard: `degeneracao.cenarios.test.ts` "cair e evoluir na mesma virada é impossível". Dono: `soulmon-guarda-permanencia` (decisão do dono sobre qual das duas).

### 2.3 🔴 "3x por semana" cobra coração 3 vezes por semana (perfil Bt)

`habitCountsOn` › `timesPerWeek`: elegível "enquanto `weeklyProgress().done < target`", com semana começando no DOMINGO (`weekStart`). Hábito 3×/semana feito seg/qua/sex: terça (1/3) e quinta (2/3) são elegíveis → falta → coração; domingo abre semana nova (0/3) → elegível → falta → coração na segunda. **3 cobranças/semana, 1 folga**: champion (3 ♥) cai a cada 2 semanas — Bt: 6 quedas, 25 ♥, 18 dias com fala `lowHp`. O mesmo jogador com `weekdays [1,3,5]` (Bs): 0 ♥ em 90 dias, mega em 32.

- `habitRhythm.ts` › `isDueOn` diz por escrito que o formato existe para "eliminar a falha diária" e tem "perdão embutido"; `02-REGRAS` §24 repete. A meta de CORAÇÃO (`heartGoalFor`) usa a mesma lista, então o perdão do formato existe só na constância, não no HP.
- Efeito comportamental (alpha-comportamento): o preset "3x por semana" é o que o `CreateModal` oferece a quem não quer compromisso diário; é o que mais pune.

**Conserto**: `registeredForDay`/`heartGoalFor` não contarem `timesPerWeek` enquanto ainda restam dias na semana suficientes para cumprir o alvo (`diasRestantes >= target − done`), ou contarem só para `dailyDone` (crédito) e nunca para a meta de coração. Guard: teste "3x/semana feito seg/qua/sex, 4 semanas, 0 corações". Dono: `soulmon-guarda-constancia`.

### 2.4 🟠 Vínculo: 7 dos 11 eventos nunca são emitidos; 76% do XP real vem de COMER, que não está na tabela

`grep -rn "kind: '…'" src desktop` fora de teste: só `completion` (2×), `dungeonRun`, `tournamentMatch`, `checkIn` chegam a `awardBondXP`. **`perfectDay`, `restNight`, `dreamNew`, `nightmareCleared`, `dungeonFloor`, `habitMilestone`, `triageCleared` não têm chamador** (`bond.wiring.test.ts` testa a função pura com `TODOS`, não a fiação). Ao mesmo tempo `careRules.ts` › `feedFood` soma `totalXP += (v+d+vac) × 10` = **40 XP por comida** — 4 comidas = 160 dos 210 XP do dia 1 do perfil A.

- A curva de `bond.ts` foi calibrada para "dia bom ≈ 165 XP (check-in + conclusões + dia perfeito 50 + noite 15 + sonho 25 + pesadelo 10)": 100 desses 165 vêm de eventos mudos, e os 160 de comida não estão na conta. Medido: A = L3 no d1, L4 no d2, L6 no d7, **L12 no d30, L21 no d90** (declarado: L2 d1, L3 d2–3, L6 d7). `08-produto-maestro` (rodada geral) pediu esta conferência ("grep de 5 minutos que nenhuma rodada fez").
- Consequência de tese: o Vínculo declara "relê o esforço que as 8 trilhas registram"; na prática relê **comer** — e comer é o gesto que `careCaps` limita por hora, i.e., o Vínculo cresce com sessão longa, não com hábito. D (não faz nada) fica em L1 para sempre — nunca vê a "1ª recompensa cosmética no dia 1".
- `02-REGRAS` §55 lista a tabela inteira como se toda ela pagasse; §7 (dia completo) não diz que o dia completo NÃO dá XP de Vínculo.

**Conserto**: (a) ligar `perfectDay` em `computeDailyReset` (ou no consumidor do `lastDayReport`) e `habitMilestone` em `withHabitCompletion` (o marco já é detectado por `habitMilestoneOf`); (b) decidir se `feedFood` continua somando `totalXP` (se sim, pôr na tabela e recalibrar; se não, mover para `awardBondXP({kind:'feed'})` com teto); (c) `bond.wiring.test.ts` varrer `src/` por cada `kind` (o padrão do "módulo mudo" que o próprio arquivo cita). Dono: `soulmon-guarda-vinculo`.

### 2.5 🟠 `MAX_HEARTS_LOST_PER_DAY` é por MECANISMO: virada + dreno = 2 ♥/dia; dreno ignora carência de save novo, rampa de retorno, folga e piso da raiz (perfis Dp, Dmp)

`applyPoopDrain` tem teto próprio (`poopDrainCharge`) e só consulta `ABSENCE_FORGIVENESS_DAYS`. Dmp (mega, para de fazer, cocô sem banho): **−2/dia**, 4 ♥ → 0 em 2 dias, 59,5 ♥ em 50 dias, 43 dias em HP ≤ 25%. Dp (save novo): perde 1 ♥ em d1, d2 e d3 (a carência `NEW_SAVE_GRACE_DAYS` que `dailyReset.ts` justifica em 12 linhas não vale para o dreno), perde nos dias de `folga`, e como o piso da raiz só existe na virada, **fica em HP 0 todos os dias** (a virada devolve 1, o dreno tira de novo).

- `02-REGRAS` §8: "respeitando exatamente as mesmas travas da virada do dia" — falso (3 de 6 travas); §1: "tira no máximo um coração" — falso no dia com cocô. A folga é decisão do dono (08/09) e está documentada; carência de save novo e piso da raiz não foram decididos, foram esquecidos.
- Dp d1 mostra o relatório dizendo `forgiven: true, heartsLost: 0` enquanto a barra mostra 2/3.

**Conserto**: `applyPoopDrain` ler `saveDaysLived`/`returnGraceLeft` (já estão em `lastDayReport`) e `remainingDrainToday` descontar o que a virada já cobrou hoje (teto do DIA, não do mecanismo); rookie em 0 pelo dreno → 1. Dono: `soulmon-guarda-sustento`; a decisão "teto do dia vale para os dois?" é do dono.

### 2.6 🟠 Glitchtama (#41): 90 "dias completos" sem um único dia completo; `dias-completos-30` (correção da Rodada 1) é farmável em 30 dias de masmorra

G (zero hábitos, 1 run/dia): 90 🌀 em 90 dias, `totalPerfectDays = 90`, **0** `wasPerfect`. `achievements.ts` › `'dias-completos-30': totalPerfectDays >= 30` e `'perfect-day': totalPerfectDays >= 1` abrem por masmorra; `mission-perfect-30` (fundo Aurora) idem. A troca `tasks-100 → dias-completos-30` (Rodada 1, veto #16) tirou a contagem de tarefas e pôs um contador que um minijogo infla.

- Quanto o 🌀 "compra" para o perfil B: 39 de 77 `totalPerfectDays` (**51%**) e a chegada a mega em d18 em vez de d32 (Bs) — mas B, que abre todo dia e não faz nada em 4 dias/semana, entra no ioiô (−37 ♥); o 🌀 sobe a escada e a virada a desce.
- Teto de 1/dia funciona como declarado ("no melhor caso dobra o ritmo") — o teto que falta é o de **quem não fez nada**: G evolui toda semana sem tocar num hábito, e cai toda sexta.

**Conserto**: 🌀 creditar `perfectDays` sem tocar `totalPerfectDays` (a conquista e a missão leem o vitalício), ou só valer em dia com `dailyDone > 0`. Dono: `soulmon-guarda-permanencia` (#41 já na fila do dono — este número é a resposta).

### 2.7 🟠 Economia: Bits só vêm de minijogo — quem cuida e não joga nunca compra nada; quem joga compra a loja inteira em ~9 semanas

`SHOP_ITEMS` pagos em Bits: **55 itens = 8 900 Bits** (25 cenários 5 310, 27 mobílias 3 230, 3 chips 360; mais barato 100). Fontes de Bits: masmorra (**327–417 por run**, sem teto de runs), Dino (`score/100`), PPT (5/partida), pesadelo, presente de amigo, troca de Créditos. Hábito, tarefa, dia completo, evolução: **0 Bits**.

- A: 0 Bits em 90 dias (loja invisível). B (3 runs/semana): 4 511 em 30 dias (metade da loja), 13 598 em 90 (152%). G (1 run/dia): 34 566 (4× a loja) — e 288 chips = +864 de atributo, contra ~4 por comida: o galho da evolução é comprável por Bits (cosmético? o galho é identidade da criatura).
- `02-REGRAS` §46/§47 descrevem as moedas, não a curva; `PLANO-MELHORIAS` diz que Emblemas saturam em ~82 vitórias — Bits saturam em ~27 runs e ninguém escreveu.

**Conserto**: decisão do dono — ou Bits por dia completo (torna a loja alcançável a quem cuida; risco: recompensa por contagem, #16, mas dia completo já é a unidade sancionada), ou aceitar que a loja é dos minijogos e escrever isso. Dono: `soulmon-guarda-sustento` + dono.

### 2.8 🟡 Nascimento: o ritual de 6 perguntas quase não decide o elemento; planta/industrial são linhas quase mortas; a "nova leitura" com respostas iguais dá criatura diferente

`oracle-census.ts` (3 identidades × 9 600 combinações) e `oracle-census2.ts` (40 identidades × 9 600):

- Por pessoa, as 9 600 respostas produzem **139–478 tuplas de eixos** (elemento/secundário/papel/alinhamento/reino), **153–160 famílias**, ~1 500–2 100 `baseName` e **~9 575 pares nome+descrição** — a diversidade de NOME é do hash (`readingSeed` → RNG), a de LEITURA é 30× menor.
- O elemento dominante é da astrologia/numerologia (≈25 pontos) e não das respostas (≤9): média de **61% das respostas dão o mesmo elemento** para uma pessoa (min 26%, max 100%: "Rita Souza" = terra em 98%); 1 pessoa em 40 alcança os 8 elementos, 6 em 40 alcançam ≤3. Responder "explode (fogo:3)" dá fogo em **47%** dos casos (0% para a identidade 1). O `hint` "Isto alimenta o ELEMENTO — a matéria de que ela é feita" é verdadeiro e quase sempre irrelevante.
- Agregado de 40 pessoas: **planta 2,7%, industrial 1,6%** (só o quiz alimenta os dois) — duas das 8 linhas de sprite/arte nascem em ~1 de 25 criaturas.
- Mudar UMA resposta: eixos mudam em 17/22 casos, nome/família em 22/22 → "mudar uma resposta é o que muda quem ela vai ser" (copy do `NewReadingModal`) é verdadeiro pelo dado, não pela leitura.
- `readingSeed(answers, readingCount)`: mesmas respostas, `readingCount` 0..9 → **eixos idênticos, 10 criaturas diferentes** (nome, família). A tela bloqueia pagar sem mudar resposta (`disabled={!mudou…}`), mas mudar A→B e depois B→A devolve uma TERCEIRA criatura, não a primeira: "mesma resposta, mesma criatura" vale só contra a leitura imediatamente anterior. E o primeiro nascimento (`SoulmonOnboarding.tsx` › `generateOracle(input)` sem seed; `pipeline.ts` › `salt = Math.random()`) É sorteio — `02-REGRAS` §22 "Não sorteia" vale só para o reroll.
- Limite: medido no caminho legado; o pipeline pago substitui os eixos por `soul.oracle` e reaplica as 6 respostas com peso menor (`oracle.ts`: "o reino NÃO leva o ×3"), então a dependência de nascimento tende a ser MAIOR lá, não menor.

**Conserto**: ou o quiz pesa o bastante para escolher o elemento quando a pessoa é consistente (3 respostas apontando fogo = fogo), ou o `hint` diz "ajusta", não "alimenta"; guard de distribuição (nenhum elemento < 8% no agregado). Dono: `soulmon-guarda-nascimento`.

### 2.9 🟡 A voz que o perfil D ouve não é a do dono da voz

Escada de fallback do toque em `CompanionHUD.tsx` (duas cópias: ciclo idle e `onClick`): `'Preciso de banho!' / 'Estou sujo!' / 'Me limpa!'`, `'Estou com fome!' / 'Me alimenta!'`, `'Com muita fome...' / 'Me alimenta por favor!' / 'Estômago vazio...'` são literais inline, fora de `PET_VOICE_LINES`. D ouve **89/90 dias** "Me alimenta por favor!"; Dp/Dmp ouvem "Preciso de banho!" 90/90; G, 78/90. `petVoice.test.ts` varre só `petVoice.ts` (e proíbe `me limpa` — que existe inline no HUD); `CompanionHUD.render.test.tsx` **espera** `/Estômago vazio|Me alimenta/`. `01-VISAO` §7 diz que a voz "obedece ao sensório" e `02-REGRAS` §8 diz que a régua varre `me limpa`.

- Não é cobrança de desempenho (é fome/sujeira), mas é **pedido imperativo diário** ao jogador que menos faz — a única fala que ele ouve. L12 da bíblia ("nomeia o ato, nunca instrução") não alcança o HUD.

**Conserto**: mover as linhas inline para `PET_VOICE_LINES` (`hungry`, `dirty`, `energized`…) e a régua alcança; `CompanionHUD.render.test.tsx` casar por `kind`, não por texto. Dono: `soulmon-guarda-vinculo`.

### 2.10 🟢 O que a simulação CONFIRMA da doc (sem achado)

- Os 8 perdões fazem o que dizem: C (some 10 dias) volta com `welcomeBack`, 0 ♥, `returnGraceLeft = 2`; primeira cobrança real só em d34 (5 dias depois de voltar, com folga no meio) — C2 mede. `NEW_SAVE_GRACE_DAYS` = 3 viradas sem cobrança em todos os perfis. Folga 1/semana gasta sozinha (13 em 90 dias no D). `WEEKLY_RELIEF_HEARTS` só quando HP > 0.
- D não é punido além das linhas vermelhas: 3 ♥ em 9 dias, depois HP = 1 fixo pelo piso da raiz, relatório sem "perda" fantasma, `perfectDays` nunca desce, Vínculo nunca desce (fica em 0). O preço de D é a voz (2.9) e o Vínculo L1 (nunca ganha a 1ª recompensa — correto pela tese "nenhuma ação nova").
- Bond nunca desce em nenhum perfil (`totalXP` monótono); D perde 0.
- `02-REGRAS` §18 "mega que não faz nada por 14 dias desce dois estágios; a 1ª queda em menos de uma semana": Dm cai em 5 dias (d41→d46) ✓; dois estágios em 14 dias ✓ (se não re-evoluir — ver 2.2). "Quem abre a cada 3 dias e não faz nada nunca perde coração" ✓ (Bx: 0 ♥).
- `ULTRA_PATIENCE_DAYS` = 45: A chega ao ultra em d60 (mega d15 + 45); C em d71 (perdeu 11 dias de ausência, não perdeu progresso). Entre d21 e d60 a barra fica "cheia sem destino" por **39 dias** (A) — a UI mostra 45 como alvo? (não verificado em tela; nota para design).
- Escada 4→5→5→6 não morde quem tem ≤ 4 hábitos: A (4 hábitos) e A6 (6) evoluem nos mesmos dias, porque `dailyGoalFor = min(cadastradas, required)`. É a regra ("cadastrar mais nunca aumenta o risco") e está escrita; só não está escrito que a escada é decorativa para a maioria.
- Escudos: A acumula 3 e nunca gasta; Bg/Bt (3/7 < 5/7) nunca ganham. `needsIntervention` só é verdadeiro na 2ª falta seguida (D: 89 dias) — a "versão reduzida" é oferecida a D todo dia; a D-persona precisa dela; ok.
- `tasksToAvoidHeartLoss` para rookie com 4 hábitos = 3 (não "metade"), como a doc diz.

## 3. Divergências doc × simulado (resumo)

| Doc | Afirma | Medido |
|---|---|---|
| `02` §1 | "tira no máximo um coração" por dia | 2/dia com cocô (2.5) |
| `02` §8 | dreno respeita "exatamente as mesmas travas da virada" | ignora carência de save novo, rampa, folga (decidida) e piso da raiz (2.5) |
| `02` §7 / §1 | dia completo = fez a meta + energia | + **abrir no dia seguinte** (2.1) |
| `02` §24 / `isDueOn` | `timesPerWeek` tem "perdão embutido", elimina a falha diária | cobra 3 ♥/semana feito seg/qua/sex (2.3) |
| `02` §18 | degeneração custa 5 dias, piso é chão | e o botão Evoluir acende no mesmo dia com HP cheio (2.2) |
| `02` §55 / `bond.ts` | tabela de 11 eventos; L2 d1, L3 d2–3, L6 d7 | 4 eventos ligados; comida = 76% do XP; L3 d1, L6 d7, L12 d30 (2.4) |
| `02` §48 / #41 | 🌀 dá "1 dia completo" | e `totalPerfectDays` → conquista/missão sem nenhum dia completo (2.6) |
| `02` §22 | "Não sorteia" | nascimento usa `Math.random`; reroll com respostas repetidas dá criatura nova (2.8) |
| `ORACLE_QUESTIONS.hint` | "isto alimenta o ELEMENTO" | decide o elemento em ~39% dos casos; planta/industrial ~2% (2.8) |
| `01` §7 / `02` §8 | voz obedece ao sensório; régua varre `me limpa` | 15 falas inline no HUD, `'Me limpa!'` incluída (2.9) |

## 4. Tabela final — achado · severidade · conserto · dono

| # | Achado | Sev. | Conserto | Dono |
|---|---|---|---|---|
| 2.1 | Virada julga só ontem → quem faz e não abre no dia seguinte nunca ganha dia completo (0/90 em Bx/Bsx) | 🔴 | julgar o dia de `lastResetDate` ou creditar dias entre `lastResetDate` e ontem via `habitRhythms.done`; guard "seg feito, qua aberto → +1" | dono (regra nova) + `soulmon-guarda-constancia` |
| 2.2 | Cair e re-evoluir no mesmo dia com HP cheio; `redeemed` por um clique | 🔴 | `canEvolve`/`handleEvolve` exigem uma virada completa depois de `degeneratedByHP`, ou piso ≤ required−1; guard em `degeneracao.cenarios.test.ts` | `soulmon-guarda-permanencia` (escolha é do dono) |
| 2.3 | `timesPerWeek 3` feito seg/qua/sex custa 3 ♥/semana (25 ♥, 6 quedas em 90 d) | 🔴 | meta de coração não contar `timesPerWeek` enquanto `diasRestantes >= target − done`; guard 4 semanas = 0 ♥ | `soulmon-guarda-constancia` |
| 2.4 | 7/11 eventos do Vínculo mudos; comida = 76% do XP; níveis 1 degrau à frente do declarado nos 3 primeiros dias (L3 no d1) e L12 no d30 | 🟠 | ligar `perfectDay` e `habitMilestone`; decidir `feedFood.totalXP`; `bond.wiring.test.ts` varrer `src/` por `kind` | `soulmon-guarda-vinculo` |
| 2.5 | Virada + dreno = 2 ♥/dia; dreno ignora carência de save novo, rampa e piso da raiz (rookie em HP 0 diário) | 🟠 | dreno ler `saveDaysLived`/`returnGraceLeft`; teto do DIA compartilhado; piso 1 para rookie | `soulmon-guarda-sustento` (teto compartilhado = dono) |
| 2.6 | 🌀 infla `totalPerfectDays`: `dias-completos-30`/`mission-perfect-30`/`perfect-day` sem nenhum dia completo (G: 90) | 🟠 | 🌀 não tocar `totalPerfectDays` ou só valer com `dailyDone > 0` | `soulmon-guarda-permanencia` (#41) |
| 2.7 | Bits só de minijogo: A = 0 Bits/90 d; B compra 152% da loja; G 4×; chips compram galho | 🟠 | decisão: Bits por dia completo ou documentar "loja é dos minijogos"; teto de runs/dia | dono + `soulmon-guarda-sustento` |
| 2.8 | Quiz decide o elemento em ~39%; planta/industrial ~2%; nascimento é `Math.random`; reroll repetido = criatura nova | 🟡 | peso do quiz ou `hint` honesto; guard de distribuição; doc §22 "não sorteia" restrito ao reroll | `soulmon-guarda-nascimento` |
| 2.9 | as falas imperativas inline (~15) no `CompanionHUD` fora da régua (`'Me limpa!'`, `'Me alimenta por favor!'` ×89 para D) | 🟡 | mover para `PET_VOICE_LINES`; render test casar por `kind` | `soulmon-guarda-vinculo` |
| 2.10 | 39 dias de barra "cheia sem destino" no mega a caminho do ultra (A d21–d60) | 🟢 | verificar o que `EvolutionPath` mostra (45 como alvo?) | `squad-design` |

**Sem dono**: a decisão de fundo por trás de 2.1 e 2.2 — "o jogo julga DIAS ou julga ABERTURAS?" — não pertence a nenhum guarda; é a pergunta D4 (`PLANO-MELHORIAS` §7, "onde é a linha do perdão") pelo outro lado: hoje o produto perdoa quem some e ignora quem fez. Idem 2.7: nenhum guarda é dono da curva de Bits (o `sustento` cuida de HP/energia, o `permanencia` de evolução; a loja não tem guarda).
