# Estudo pré-Mobbin × Constância — leitura do guarda (WP2.1–WP2.9)

**Data:** 03/09/2026 · **Guarda:** `soulmon-guarda-constancia` · **Ledger:** `../ledger/constancia.md`

Este documento destrincha o corpus estudado **antes** do dossiê Mobbin. O Mobbin já foi
destrinchado em `../mobbin/constancia.md` e não se repete aqui — quando uma fonte pré-Mobbin
discorda da leitura Mobbin, o desacordo está mostrado, não a média.

## Fontes lidas (inteiras)

- `docs/guia-experiencia/03-gamificacao-streaks.md` (rel. 03, §1–§4, 22 recomendações)
- `docs/guia-experiencia/08-transcricoes-notebooklm.md` — blocos **A1** (Duolingo streaks, Lenny's
  Podcast, com repergunta e timestamps), **A2** (Tim Gabe 500+ apps / leaderboards + Duolingo),
  **A5** (Fogg, Clear, Eyal Hooked × Indistractable), **C1** (Engelstein, GDC, loss aversion),
  **C4** (Extra Credits De-Gamification / Gamification Sucks + Errant Signal)
- `docs/GUIA-EXPERIENCIA.md` §B.4 (hábito e constância), §C (C.1–C.4), §D (dicas), §I (rodada 2)
- `docs/guia-experiencia/07-retencao-engajamento.md` (§2 churn, §4 push, §5 widget, §6 recs, §8)
- `docs/plano-melhorias/B-habitos.md` (mapeamento do código) + ledger
- Código, reconferido por `grep` em 03/09/2026: `src/utils/habitRhythm.ts`, `taskTriage.ts`,
  `rituals.ts`, `restWindow.ts`, `dailyReset.ts`, `telemetry.ts`, `src/types/taskModel.ts`,
  `src/components/MorningCheckIn.tsx`, `HabitConstancy.tsx`, `TriagePile.tsx`,
  `DailyReportModal.tsx`, `WeeklyReportCard.tsx`, `MorningDream.tsx`, `CompanionHUD.tsx`,
  `StatsPage.tsx`, `ProtectProgressModal.tsx`, `pixel/HomeHud.tsx`, `App.tsx`,
  `functions/api/_pushCopy.js`, `workers/push-scheduler.js`,
  `android/.../plugins/DigiWidgetPlugin.kt`, e os testes `habitRhythm.test.ts`,
  `rituals.test.ts`, `taskTriage.test.ts`, `useDailyReset.test.ts`, `restWindow.test.ts`.

**Convenção:** referência é `arquivo` + SÍMBOLO, nunca linha. `NÃO ENCONTRADO` = procurei e não
existe.

---

## 1. Tabela — três colunas

Vereditos: **já faz** · **lacuna** · **conflita com a tese** · **não se aplica** · **já coberto por WP (qual)**.

### 1.1 A1 — Duolingo streaks (Jackson Shuttleworth, Lenny's Podcast)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **A1 (≈00:49:00):** o Streak Freeze era comprado com gems, "a little bit of pain"; dar 2 equipados no início do streak foi "holy smokes" de ganho. | Escudo é **ganho** (`earnShield`, `habitRhythm.ts`: 1 a cada `REST_SHIELD_EARN_EVERY_DAYS` com `ratio ≥ GOOD_CONSTANCY_RATIO`) e **gasto sozinho** (`applyMissedDay`). Loja: `grep -i "shield\|escudo" src/utils/shop.ts` → nada. | **já faz** — e vai além: a proteção nunca foi opt-in nem comprável. Linha vermelha "nunca vender proteção" íntegra. |
| **A1 (≈00:46:30–00:48:30):** 1→2 ou 3 freezes = "huge DAU win"; **"three streak freezes was actually no better than two"**; "we were training them to take more time off". | `REST_SHIELD_MAX = 3` (`taskModel.ts`). Hidratação (`GameStateContext.tsx`, campo `shields`) só faz `Math.max(0, floor)`, sem clamp ao teto. Testes: `habitRhythm.test.ts` usa `REST_SHIELD_MAX` derivado; `habitEligibility.regression.test.ts` espera `2` após 8 viradas. | **já coberto por WP (WP2.1)** — o único número da família que a evidência contraria. Ver §2 para o que o A1 acrescenta ao WP: a métrica de sucesso é semanal, não diária. |
| **A1 (≈00:47:31):** mais freezes foi **ruim para CURR** (volta no dia seguinte) e **bom para WAURR** (volta na semana); o ganho líquido só apareceu na métrica semanal. | `telemetry.ts` tem `day_active` (1×/dia) e `week_active` (`goal_days`/`active_days`). **`welcome_back` está no esquema mas não tem emissor** (`grep "'welcome_back'" src --include=*.ts{,x}` fora de `telemetry.ts` e testes → 0). | **lacuna** (de instrumentação) — WP2.1 pede "medir retorno após ausência" e o evento que mediria isso não dispara. Ver C-C6. |
| **A1:** streaks de 1–3 dias são fáceis de abandonar; a aversão à perda só "consolida" aos **7 dias**. | `NEW_SAVE_GRACE_DAYS = 3` (`dailyReset.ts`) — 3 viradas sem cobrança de HP para save novo; `RETURN_GRACE_DAYS = 2` na volta. Primeiro marco de hábito: `HABIT_MILESTONES[0] = 7`. Primeiro escudo possível: dia 7 (`earnShield` exige 7 dias de janela boa). | **já faz** (a carência inicial existe) — com uma **observação**: entre o dia 1 e o dia 7 o hábito não tem escudo nem celebração; a única proteção é a própria matemática do N/7. Ver §4. |
| **A1:** metas altas de XP faziam perder o streak num dia atípico; simplificaram para "uma lição por dia". | `dailyGoalFor` (`dailyReset.ts`) = `min(peso cadastrado, requisito do estágio)`; `someday`/`dropped` fora da meta; teto `MAX_HEARTS_LOST_PER_DAY = 1`. | **já faz** — a meta é limitada pelo estágio e pelo que a pessoa cadastrou; o pior dia custa 1 coração. |
| **A1 (≈00:52:00):** "cheapening the streak… you kind of got to hold the line at some point. And it's not clear where that line is" → **extinction level event**. | Oito mecanismos de perdão (guia I.1.2), nenhum documento diz o que ainda dói perder. Nada no código responde. | **não se aplica como WP** — é a decisão **D4** do dono. O guarda registra: **nenhum nono perdão passa sem D4 respondida.** |
| **A1:** streaks são "engagement hack" sobre um produto que já é bom; sem loop de valor real, manter streak vira "aborrecimento vazio". | O loop central é tarefa → comida → energia/atributo → galho (CLAUDE.md 🍎/⚡). | **não se aplica** (é critério, não mecânica) — coincide com I.1.3: toda recompensa nova responde "faz querer a tarefa ou a notificação?". |
| **A1 (≈00:08:00):** 9 milhões de usuários com streak ≥ 1 ano — a escala do risco. | Não há número exposto que possa "deixar de importar"; o ativo é a criatura. | **não se aplica** — assimetria a favor do Soulmon já registrada em I.1.2. |

### 1.2 A2 — Tim Gabe (500+ apps, leaderboards) + Duolingo

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **A2:** *Completion drive* — anéis do Apple Watch fecham padrões incompletos (49,5% de mudança de comportamento em 160k pessoas — afirmação com dado). | Por hábito: `HabitConstancy.tsx` desenha `CONSTANCY_WINDOW_DAYS` pontos (`DotState`) — é um "anel" linear por hábito. Na home: `HomeHud.tsx` mostra feito/meta do dia; anel agregado **NÃO ENCONTRADO**. | **já faz** (por hábito) / **lacuna leve** (home). Não proposto como WP: o dossiê Mobbin já classificou a fileira de pontos como LIMÍTROFE-aceita; um segundo anel na home é decisão de UI, não de motor. |
| **A2:** *Competence feedback* — ELO, PRs do Peloton, Body Battery sinalizam habilidade real (+15% de frequência; meta-análise 2024). | `habitTier(totalDone)` seed→tree + `attributeMultiplier` (`habitRhythm.ts`), `MILESTONE_TEXT` (`App.tsx`); `StatsPage.tsx` mostra `totalPerfectDays` como "dias perfeitos até aqui". | **já faz** — feedback de competência sem placar contra terceiros. |
| **A2:** *Localized cohorts* — placar global "parece impossível" e desmotiva; coortes pequenas preservam winnability. | Faixas do Torneio antes do ranking (`tournamentTiers.ts`) — domínio de outro guarda. | **já faz** (outro guarda; registrado por completude). |
| **A2:** *Variable reward magnitude* — antecipação positiva do que vem, em vez de medo de perder (mix dado/opinião). | Sonhos: `dreamRarity`/`rollDream` (`restWindow.ts`) variam **no sabor**, nunca no valor. Celebração rara ao concluir tarefa (rel. 03 rec. 7, ~5%): `grep "Math.random() < 0.0\|rare" src/App.tsx` → **NÃO ENCONTRADO**. | **já faz** (sonhos) / **lacuna** (conclusão de tarefa). Ver C-C5. |
| **A2 / I.3.2:** *Intentional commitment* — "Continue" → "Commit To My Goal" = +10.000 DAU; meta de streak 14/30/50 com opt-out visível. | `MorningCheckIn.tsx`: botão "Assumir minha meta de hoje" / "Commit to today's goal" quando `plannedEffort > 0`, senão "Começar o dia"; `track('checkin_commit')` só no confirm. **Meta de N dias** (14/30/50): **NÃO ENCONTRADO**, e não deve existir. | **já coberto por WP (WP2.3, VERIFICADO)** para o botão. A "meta de streak em dias" **conflita com a tese** — é uma contagem que pode falhar, e falhar nela é o zeramento com outro nome. Não importar. |
| **A2 / I.3.3:** celebração multissensorial (háptico + animação rica) faz **pausar e saborear**; as mais complexas ficam para marcos. | Marco = `celebrateHabitMilestone` (`App.tsx`): `playEvolve()` + `setMessageTrigger` + `toast.success`. `navigator.vibrate`: só em `DinoGame`, `NightmareBattle`, `RPSGame`, `ShopModal`, `CompanionHUD`, `DungeonGame` — **não no marco**. `MilestoneCeremony.tsx` **NÃO ENCONTRADO**. | **já coberto por WP (WP2.4)**. O A2 é a evidência primária do WP; o Mobbin deu a forma (modal que espera gesto). |
| **A2 / I.3.1:** *Perfect Streak* — recompensa **puramente estética** por não usar freeze; "reações intensas de usuários e funcionários que se importavam profundamente com a marca dourada". | `shielded[]` existe em `HabitRhythm`; `steadyWindow`/`aura`: **NÃO ENCONTRADO**. Nenhum consumidor de prestígio. | **já coberto por WP (WP2.2)** — **com um alerta que o Mobbin não tinha**: a fonte diz que as pessoas *se importavam profundamente* com o dourado. Prestígio cosmético **dói** ao sumir, mesmo sem toast. Isso é D4 (ver §2, WP2.2). |
| **A2:** reconhecimento humano/parasocial (instrutor chamando nome) cria identidade. | Falas do pet com nome do jogador; push em nome do pet (`_pushCopy.js`). | **não se aplica** ao motor de hábitos (é vínculo — outro guarda). |
| **A2 (insights):** jogos idle — progresso continua enquanto você está fora; check-in em horário rígido mata retenção; a volta é celebração, não culpa. | Nada acumula na ausência, mas **nada se perde** (`ABSENCE_FORGIVENESS_DAYS`, relatório `welcomeBack` "não perdeu nada esperando"). `needsCheckIn` (`rituals.ts`) sem janela de horário. Reencontro na HUD: limiar de 10 min por `visibilitychange` (`CompanionHUD.tsx`, `ultimaSaudacaoRef`), não por dias. | **já faz** (sem horário rígido, sem perda) / **já coberto por WP (WP2.7)** para a volta por dias. |
| **A2 (insights):** *PBL fallacy* — empilhar pontos, medalhas e conquistas gera sobrecarga e troca qualidade por quantidade. | Só a linha de constância tem 4 sinais (headline N/7, pontos, tier, escudos); o app inteiro tem HP, energia, Bits, Emblemas, Créditos, `perfectDays`, Vínculo, dex de sonhos, missões. | **conflita com a tese** (risco, não fato) — registrado para D4: cada WP deste domínio **acrescenta** um sinal (aura, selo de foco, dias juntos). Nenhum WP deveria entrar sem dizer o que **sai** ou o que `hideMetrics` cobre (WP2.8). |

### 1.3 A5 — Fogg, Clear, Eyal (Hooked × Indistractable)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **A5 / Fogg B=MAP:** comportamento = motivação × habilidade × prompt; *tiny habits* = reduzir a habilidade exigida ("floss one tooth"). | CLAUDE.md 🚫 e `GuideModal.tsx` prometem: "em 2 seguidas, o pet oferece uma versão bem menor do hábito — aceitar já conta como feito". Motor: `needsIntervention`/`consecutiveMisses` (`habitRhythm.ts`) existem e têm teste. **Consumidor na UI: NÃO ENCONTRADO** — `grep "needsIntervention\|consecutiveMisses\|MISS_INTERVENTION" src/App.tsx` → 0; em `src/components/` só `GuideModal`/`HelpModal` (texto). | **lacuna — a maior deste estudo.** O "never miss twice" existe como função pura e como promessa no guia, e **o pet nunca oferece nada**. É o mesmo tipo de achado de "o pet olha" (WP3.2). Ver C-C1. **WP2.5 pressupõe uma intervenção que não existe** — ver §2. |
| **A5 / Fogg:** facilidade extrema também vicia (pornografia, refrigerante) — ética da simplicidade. | Comida por tarefa é o loop; humor nunca vira score; `isOvercommitted` é aviso. | **não se aplica** como WP; é o critério I.1.3. |
| **A5 / Clear:** hábitos de longo prazo se sustentam por **identidade**, não por recompensa externa. | `MILESTONE_TEXT.tree`: "66 dias! Este hábito virou parte de quem você é." Tiers como substantivo (semente/broto/muda/árvore), não como número. | **já faz** — o vocabulário do marco maior é de identidade. |
| **A5 / Eyal (Hooked):** gatilho interno = emoção negativa (tédio, solidão) associada ao app como alívio automático. | Check-in de humor: opcional, nunca pontua (`utils/mood.ts`), devolve resumo. Nenhuma mecânica usa humor ruim como gatilho de uso. | **não se aplica** — o Soulmon não desenha em cima da emoção negativa; a regra "humor nunca vira score" é o oposto do gatilho interno do Hooked. |
| **A5 / Eyal (Indistractable):** "hack back" — o usuário deve poder remover gatilhos externos; *Regret test* — "sabendo tudo que eu sei como designer, você faria o que desenhei?". | Push: 3 crons/dia (10h, 16h, 22h, `_pushCopy.js`), todos na voz do pet, sem culpa; opt-out existe (`push_optout` é evento do plano F; telemetria tem `setTelemetryEnabled`). `hideMetrics` só cobre a Janela de Descanso (`restWindow.ts`; `RestWindowCard.tsx`). | **já faz** (push) / **já coberto por WP (WP2.8)** para esconder a constância — é a forma mais direta de "hack back" dentro do motor. |
| **A5 / Eyal:** *Identity Pact* — "eu sou indistraível" como compromisso declarado. | `soulGoal`/`soulStruggle` coletados no onboarding; `soulGoal` devolvido em `DailyReportModal` (dia perfeito ou volta). `soulStruggle`: consumido só no onboarding e gravado no `GameState` (`grep soulStruggle src/components src/App.tsx` → nenhum uso de leitura). | **já faz** (goal) / **já coberto por WP (WP2.5)** para o `soulStruggle` — **mas WP2.5 depende de C-C1** (a intervenção precisa existir antes de ter texto). |

### 1.4 C1 — Engelstein (GDC), psicologia da aversão à perda

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **C1:** perder dói ~2× mais que ganhar; a pessoa **prefere arriscar** para evitar uma perda certa. | HP: perda máxima 1/dia, previsível, com aviso (`MAX_HEARTS_LOST_PER_DAY`); nunca aleatória. Masmorra: perder não custa coração (CLAUDE.md ⚔️). | **já faz** — o Soulmon só põe em risco o que foi apostado voluntariamente (a run). |
| **C1 — legítimo:** *progresso dotado* (Catan começa com 2 de 10). | `constancy` devolve `ratio: 1` sem histórico (`habitRhythm.ts`, comentário Nunes & Drèze); `HabitConstancy.tsx` headline "hábito novo" / "Ninguém começa em 0%". | **já faz** — agora com precedente de design, não só de paper (I.2). |
| **C1 — legítimo:** sentir o peso de uma decisão (The Expanse: pagar 1 PV para guardar carta). | `shrink` (`taskTriage.ts`) rebaixa effort e **zera** `postponedCount`; `drop`/`toSomeday` sem custo. Nada no motor de hábitos cobra por uma decisão. | **não se aplica** — o Soulmon escolheu não cobrar decisão; é coerente com a tese e é exatamente o que D4 precisa nomear ("o que ainda pesa?"). |
| **C1 — legítimo:** *reframing* (Hearthstone Tracking): o mesmo mecanismo lido como ganho em vez de perda. | `HabitConstancy.tsx`: "Nada zera aqui: um dia perdido custa um pontinho, não a sua história." `DailyReportModal.tsx`: coração perdido vira "em recuperação"; headline "Um dia mais devagar". | **já faz** — o enquadramento é a metade do motor. |
| **C1 — abuso:** *level draining* (dar nível e tirar) — a indústria abandonou. | `attributeMultiplier ≥ 1` (teste), `perfectDays` só acumulam, `habitTier` só lê `totalDone` (sobrevive à poda `HISTORY_CAP`), `applyFreshStart` não toca `habitRhythms`/`perfectDays`/`dreams` (teste em `rituals.test.ts`). | **já faz, travado por teste** — C.1 #1, #9, #10 do guia. |
| **C1 — abuso:** desastre aleatório (Civilization) — perda que o jogador não pode prever gera paranoia. | Perdas possíveis: virada (previsível, meta visível) e cocô (agendado, notificado 30 min antes, teto diário). Nenhuma perda sorteada. | **já faz** (cocô é de outro guarda; registrado). |
| **C1 — abuso:** "pague para não perder" em F2P. | Escudo nunca à venda; cura instantânea por Créditos existe (C.3 #7 → WP5.2, outro guarda). | **já faz** no meu domínio; a pendência de WP5.2 é de outro guarda. |
| **C1 — fronteira:** "you don't want to see the man behind the curtain" — manipulação percebida gera pushback. | `HabitConstancy.tsx` explica o custo na própria linha; `GuideModal.tsx` deriva números das constantes; `WeeklyReportCard.tsx` "descrição, nunca veredito". | **já faz** — o Soulmon mostra o mágico de propósito. É por isso que a **aura de WP2.2 não pode ter nome de pureza**: nomear a impureza é mostrar a cortina. |

### 1.5 C4 — Extra Credits + Errant Signal (o caso contra)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **C4 / Errant Signal:** gamificação = "colar um motivador extrínseco a uma atividade"; **anunciar a recompensa** reduz a tarefa a "meio para um fim". | Tarefa → comida → atributo (CLAUDE.md). `HABIT_TIER_BONUS` anunciado no `GuideModal` ("rendendo mais atributo"). | **conflita com a tese — de propósito e admitido** (I.1.3). Não vira WP. **Efeito prático:** a linha "este hábito já rende mais" proposta pelo Mobbin para WP2.4 é exatamente o anúncio de recompensa que C4 desaconselha. Ver §2, WP2.4. |
| **C4 / Gamification Sucks:** recompensa extrínseca é o "fruto mais baixo"; a curva desmorona quando a novidade acaba. | Peças não extrínsecas: relatório sem veredito, humor sem score, `soulGoal` devolvido, ritmo de cuidado decide galho (`carePattern.ts`). | **já faz** — as defesas contra a curva existem; o roadmap P0 investe nelas. |
| **C4 / De-Gamification:** "flexibility to play your way" — medir e avaliar cada passo transforma o app em "testes do designer"; desvio vira "inferior ou errado". | `someday`/`dropped` (`taskTriage.ts`) = permissão formal para não fazer; `timesPerWeek` deixa a pessoa escolher os dias; `hideMetrics` só na Janela de Descanso. | **já faz** (modelo de tarefa) / **já coberto por WP (WP2.8)** para a constância. |
| **C4:** "grind para sobrevivência" — rotina como prisão regida pela culpa de quebrar métricas. | Widget: `contextualMessage` em `WidgetRenderer.kt` ainda diz "X de Y feitas" abaixo de 40% e "N task(s) left" (Mobbin §1). Check-in: "Ficou de ontem — sem cobrança" (`MorningCheckIn.tsx`). | **já coberto por WP (WP2.6)** para o widget; **já faz** no check-in. |

### 1.6 Relatório 03 — as 22 recomendações e as 6 lacunas

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **03 §1.3 regra 1:** perda só sobre recurso recuperável e apostado. | Escudos (recuperáveis), run da masmorra (apostada). Identidade/coleção intocáveis (testes de fresh start, dex só cresce). | **já faz**. |
| **03 §1.3 regra 3 / §3:** contador que **acumula** retém; que zera produz violação da abstinência (Marlatt). | `habitRhythm.test.ts`: `expect(Object.keys(r)).not.toContain('streak')`. `HomeHud.tsx` removeu a chama de propósito (comentário "chama é vocabulário de STREAK"). `StatsPage.tsx` mostra `totalPerfectDays` (prop chamada `streakDays`, rótulo "dias perfeitos até aqui"). | **já faz, travado por teste** — nota cosmética: o nome da prop `streakDays` é resíduo; o valor é monotônico. |
| **03 lacuna 1 / H-2 / D#8 / C.3 #2:** falta um **número de identidade** ("dias juntos") — monotônico por construção, admissível. | `saveDaysLived` + `lastDayReport.saveDay` (`dailyReset.ts`) já contam os dias de vida do save. **Consumidor de UI: NÃO ENCONTRADO** (`grep saveDay src --include=*.tsx` → 0). "Dias em que você apareceu": não agregado. | **lacuna** — o dado existe, a UI não. Ver C-C2. Guarda-corpo já arbitrado em C.3 #2: nunca diminui. |
| **03 lacuna 2 / P0-1 / H-1:** widget = janela do pet, com sprite atual e humor do dia. | `DigiWidgetPlugin.kt` recebe `digimon_name`, `current_stage`, `egg_type`, `branch_type`, `completed_tasks`, `total_tasks`, `hp`, `health_points`, `max_health_points`, `energy_points`, `has_poop`. Nenhum dado de hábito. | **já coberto por WP (WP2.6)**. |
| **03 lacuna 3 / rec. 6 / H-5:** buraco de ~6 semanas entre 21 e 66; falas do pet a cada ~15 dias efetivos usando `totalDone`, sem tocar `HABIT_MILESTONES`. | `milestoneReached(before, after)` só nos cruzamentos 7/21/66 (teste "dispara UMA vez"). Fala intermediária: **NÃO ENCONTRADO**. | **lacuna**. Ver C-C4 — com a correção do A1: o buraco que importa é também **1→7**. |
| **03 lacuna 5 / rec. 5 / H-4 / D#2:** prestígio que **só some** (Aura). | **NÃO ENCONTRADO**. | **já coberto por WP (WP2.2)**. |
| **03 rec. 3 / H-3:** anel 0–7 na home em vez de percentual. | Pontos por hábito em `HabitConstancy.tsx`; sem anel agregado. | **já faz** (por hábito) — ver 1.2, não proposto. |
| **03 rec. 7 / H-8:** celebração rara (~5%) ao concluir — variável no sabor. | **NÃO ENCONTRADO** (ver 1.2). Tarefa assombrada: `relief = isHaunted(...)` em `App.tsx` rende fala + comida extra (determinístico). | **lacuna**. Ver C-C5. |
| **03 rec. 8 / H-7 / 07 rec. 12:** selo de Foco do dia (3 completas) visível no palco. | `focusComplete` (`taskTriage.ts`, com teste). `GuideModal`/`HelpModal` prometem "completar os 3 rende o selo". **Consumidor na UI: NÃO ENCONTRADO** (`grep focusComplete src/App.tsx src/components` → 0). | **lacuna — segunda promessa do guia sem implementação.** Ver C-C3. |
| **03 rec. 9 / 07 §2 "retorno":** roteirizar a volta como o melhor momento do app. | `DailyReportModal.tsx` modo `welcome`: "Que saudade!", "não perdeu nada esperando — só estava com saudade", `soulGoal` devolvido, `canRecover` desligado. HUD: saudação por 10 min de aba, não por dias. | **já faz** (relatório) / **já coberto por WP (WP2.7)** (HUD). |
| **03 rec. 10 / 07 §4:** push de **saudade** após ~3 dias, nunca de perda; nunca diário-insistente. | `_pushCopy.js`: 3 crons/dia (10h "passou pra dizer oi", 16h "pensou em você", 22h "está indo dormir") — voz do pet, sem culpa, sem "seu progresso vai sumir". Push por ausência (D2 sonho, D5/D14 win-back): **NÃO ENCONTRADO** — o scheduler é broadcast por hora, não por jogador. | **já faz** (tom) / **já coberto por WP (WP3.4, guarda de presença)** para o win-back. **Desacordo a registrar:** rel. 07 §4 pede "máx. 1 push de campanha/dia" e rel. 03 "nunca diário-insistente"; o cron manda **3 por dia**, todo dia. Não é do meu domínio, mas cruza a tese: 3 pushes diários na voz do pet ainda são 3 pushes diários. Encaminhado ao guarda de presença. |
| **03 rec. 11:** fresh start como convite caloroso, não botão administrativo. | `freshStartOffer` consumido em `App.tsx` (com `freshStartDismissed`); `applyFreshStart` zera só `postponedCount` (teste). | **já faz** — o tom da oferta não foi verificado visualmente (Playwright fora deste estudo). |
| **03 rec. 12:** devolver `soulGoal` na cerimônia de evolução. | `EvolutionCeremony.tsx`: `grep soulGoal` → **NÃO ENCONTRADO**. | **lacuna de outro guarda** (evolução, WP1.2 "porquê ecoado" cobre o reveal; a cerimônia de evolução não). Registrado, não proposto aqui. |
| **03 rec. 13:** diário de uma linha no check-in que o pet relembra. | `MorningCheckIn.tsx`: sem campo de texto livre. | **lacuna de outro guarda** (WP3.1 memória do chat). Não proposto: acrescentar campo ao check-in aumenta o custo do ritual que WP2.3 acabou de tornar compromisso. |
| **03 rec. 14:** card compartilhável (identidade, nunca posição). | **NÃO ENCONTRADO** no meu domínio; é WP4.8. | **já coberto por WP (WP4.8, outro guarda)**. |
| **03 rec. 15:** sonho como momento de UI próprio (virar carta). | `MorningDream.tsx` existe: "a revelação", só de manhã, "NÃO EXISTE PERDA NESTA MECÂNICA". | **já faz**. |
| **03 rec. 16 / H-10:** nunca percentual cru. | `HabitConstancy.tsx` headline "N das últimas M"; `WeeklyReportCard.tsx` sem `%`; teste WP2.9 (10 casos) passa. | **já coberto por WP (WP2.9, VERIFICADO)**. |
| **03 rec. 17 / H-9:** escudos como "cobertinhas"; quando um é consumido, o relatório diz "usei uma cobertinha por você". | `DailyReportModal.tsx`: nenhuma menção a escudo (`grep -i "shield\|escudo\|cobertinha"` → 0). `HabitConstancy.tsx` mostra escudos só se `shields > 0`, com title "Usados sozinhos num dia perdido". `shield_used` está no esquema de telemetria **sem emissor**. | **conflita com a tese — desacordo entre fontes, mostrado:** rel. 03 quer anunciar o consumo; o Mobbin (§1, 6B Alma) concluiu "nenhum toast de escudo usado, e o dossiê não dá motivo para criar um"; o **A1** dá o motivo contrário: tornar o escudo saliente ("usei um por você") é ensinar que faltar tem cobertura — "training them to take more time off". **Veredito do guarda: não anunciar o consumo.** Fica como pendência D4, não como WP. |
| **03 rec. 18 / H-11:** minigráfico de 28 dias de `effortDone` no relatório semanal. | `weeklyReport` (`rituals.ts`) cobre a semana; `WeeklyReportCard.tsx` imprime `effortDone` como número. 28 dias: **NÃO ENCONTRADO**. | **lacuna** sem candidata: `completedTasks` tem histórico, mas um gráfico de tendência é um número que pode **descer** — viola "nenhum contador exposto diminui" (guia B.4). Só entraria como barras absolutas por semana, sem linha. Deixo para o consolidador decidir se vale abrir. |
| **03 rec. 19 (guardrails):** nunca streak que zera, streak recíproco, push de perda, ranking antes de faixa, contador que diminui, proteção opt-in, recompensa por contagem. | Todos verificados acima; contagem → `dailyGoal.contract.test.ts`. | **já faz**. |
| **03 rec. 20 / D#14 / C.2 #15:** nunca monetizar proteção. | `shop.ts` sem escudo; `SPECIAL_ITEMS` sem escudo. | **já faz**. |
| **03 rec. 21:** nenhuma função nova devolve número exposto que diminui. | `restWindow.test.ts` "estado vazio devolve ratio 0, nunca negativo"; `restConstancy` neutra. Teste geral "nenhuma função devolve número que diminui" para o motor de hábitos: **NÃO ENCONTRADO** como teste único; está espalhado (multiplicador ≥ 1, `totalDone`, sem `streak`). | **já faz** (por partes). |
| **03 rec. 22:** se D30 decepcionar, medir onde o funil quebra antes de adicionar Black Hat. | Telemetria: `telemetry.ts` com 20 eventos; **cinco sem emissor** (`shield_used`, `milestone`, `welcome_back`, `dungeon_run`, `bond_level`); `heart_lost`/`perfect_day`/`task_completed` do plano F **não estão no esquema**. | **lacuna** (instrumentação, fronteira com o guarda de telemetria). Ver C-C6 para os dois que são meus. |

### 1.7 Relatório 07 — retenção (a parte de hábito/ritual)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **07 §2 "1º fracasso":** provável maior ponto de churn é perder coração; mitigar trocando a mensagem por convite de carinho. | `DailyReportModal.tsx`: "Um dia mais devagar" + "Um carinho devolve meio coração, se você quiser — e nunca se perde mais que um por dia"; valor "em recuperação". | **já faz** (rec. 9). Falta o dado: `heart_lost` não existe na telemetria. |
| **07 §2 "retorno ≥5 dias":** o alívio passa despercebido se não for celebrado. | Relatório `welcome` (acima). | **já faz** / **WP2.7** para a HUD. |
| **07 §5 widget:** "2/4 hoje" + humor do pet + prompt de adicionar widget no D2–D3. | Widget tem `completed_tasks`/`total_tasks` e imprime "X de Y feitas". Prompt de widget in-app: **NÃO ENCONTRADO**. | **desacordo entre fontes, mostrado:** rel. 07 **quer** o contador; o Mobbin (decisão posterior, WP2.6) **tira** o texto "X de Y" quando `completed < total`. O guarda fica com o Mobbin: no widget, o que falta é cobrança; o que foi feito (`≥ total` → "Dia perfeito!") fica. Prompt de widget = APK, outro guarda. |
| **07 §6 rec. 12:** daily quests = os 3 focos já são isso; falta o **fecho** (selo + celebração). | `focusComplete` sem consumidor (ver 1.6). | **lacuna** → C-C3. |
| **07 §6 rec. 14:** coleção de sonhos exposta na home de manhã. | `MorningDream.tsx` faz o reveal; `dexProgress` na home: outro guarda. | **já faz** (reveal). |
| **07 §6 rec. 17:** push de **quase-marco** — "amanhã seu hábito X completa 7 dias". | **NÃO ENCONTRADO**. | **conflita com a tese** — é a "cobrança preventiva" que o Mobbin §3 proíbe ("Study tomorrow to keep your streak"). Um lembrete de véspera transforma o marco em prazo. **Não fazer.** Desacordo registrado: rel. 07 propõe, Mobbin veta, o guarda veta. |
| **07 §6 rec. 22:** "Memórias" aos 30/90 dias. | WP4.8 (outro guarda). | **já coberto por WP (WP4.8)**. |
| **07 §8:** eixo "investimento" (o que se perderia: pet, evolução, sonhos, troféus) é o mais forte; protegê-lo é a razão do perdão de ausência. | Tudo intocável por `applyFreshStart` e pela ausência. | **já faz** — e é a resposta parcial a D4 que o rel. 07 já dava: o que dói perder é o **acesso** ao investimento, não um contador. |

### 1.8 Guia — §B.4, §C, §D, §I

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **B.4 estado atual:** N/7, escudos automáticos, never miss twice, 7/21/66, meta ponderada, teto 1, perdão ≥2, alívio de segunda, fresh start, assombrada, humor sem score, descanso por comportamento, dex só cresce. | Conferido símbolo a símbolo acima. **Exceção:** "never miss twice… a 2ª oferece versão reduzida que conta como feito" é verdadeiro no motor e **falso na UI**. | **já faz**, com a exceção que vira C-C1. |
| **B.4 lições — "três dos quatro mecanismos do streak são de graça".** | Número que cresce: `totalPerfectDays` (Stats), `totalDone` (tier) — sim; `saveDay` sem UI. Identidade: tiers — sim. Presença: widget sem hábito — WP2.6. Medo: ausente — correto. | **já faz** 2 de 3; o terceiro é WP2.6; o número lifetime é C-C2. |
| **C.1 #1, #2, #9, #10:** travado por teste. | `habitRhythm.test.ts`, `dailyGoal.contract.test.ts`, `rituals.test.ts` (fresh start), multiplicador. | **já faz**. |
| **C.2 #17:** nunca a voz do pet para cobrar; nunca estado negativo no widget. | Push: ok. Widget: "⚠️ Cuide de mim!" (`WidgetRenderer.kt`) é estado negativo. | **já coberto por WP (WP2.6)**. |
| **C.2 #20:** nunca mostrar contagem de dias NÃO perfeitos. | `StatsPage.tsx` só "dias perfeitos até aqui"; `DailyReportModal` não conta os não-perfeitos. | **já faz**. |
| **C.2 #24:** `isOvercommitted` é aviso. | `MorningCheckIn.tsx` cabeçalho: "AVISO, NUNCA bloqueio"; botão continua ativo. | **já faz**. |
| **C.3 #2:** "dias juntos" admissível (monotônico). | Ver 1.6. | arbitrado; **C-C2** herda o guarda-corpo. |
| **D#1–#3, #11, #13, #14:** já cobertos acima. `stackingSuggestion` devolve `null` sem dados (`STACKING_MIN_WINDOW = 4`). | `rituals.ts`; `WeeklyReportCard.tsx` só renderiza a sugestão quando não-nula. | **já faz**. |
| **I.1.1:** `REST_SHIELD_MAX` 3→2, experimento P1, depende de telemetria. | Ver 1.1. | **WP2.1** — e a telemetria de que depende tem o evento sem emissor. |
| **I.1.2:** oito perdões, nenhuma linha. | — | **D4**, pergunta permanente do guarda. **Contagem desta auditoria: continuam oito.** Nenhum WP de outro guarda acrescentou perdão ou cobrança ao motor desde o Mobbin (WP3.4 declara-se "acolhimento, não perdão mecânico"; WP1.3 "check-in não dispara no D0" é adiamento de ritual, não perdão — vigiado). |
| **I.2 (tabela):** escudo automático, ratio 1, streak proibido, faixas, aviso-não-bloqueio, humor — confirmados por transcrição. | Tudo conferido acima. | **já faz** — tese virou precedente com evidência. |
| **I.2 (Tamagotchi de 97):** o "Forced Play" é dark pattern catalogado; o Tamagotchi perdia usuários por morte em <12h. | Degeneração reversível, nunca chamada de morte (C.2 #23); ausência não cobra. | **já faz**. |
| **I.3.1–I.3.3:** Perfect Streak, Commit, celebração que pausa. | WP2.2 / WP2.3 (verificado) / WP2.4. | **já coberto por WP**. |

---

## 2. WPs existentes × corpus pré-Mobbin

| WP | O corpus… | Fonte | O que muda |
|---|---|---|---|
| **WP2.1** `REST_SHIELD_MAX` 3→2 | **SUSTENTA** — é a única mudança numérica com dado primário: "three… no better than two", "training them to take more time off" (A1 ≈00:47–00:48). **E acrescenta uma condição de leitura:** o efeito do 3º freeze foi ruim em CURR e bom em WAURR; o julgamento tem que ser pela **volta semanal** (`week_active`), não pela diária, e o retorno após ausência precisa de `welcome_back` **emitindo** (hoje não emite). | A1 | Continua `BLOQUEADO:D3`. Acrescentar ao aceite: "`welcome_back` emitido na virada com `wasAway`" (C-C6) e "métrica de decisão = `week_active`, não `day_active`". Lembrar a assimetria: o escudo do Soulmon é ganho a cada 7 dias, então o 3º só existe para quem já teve 21 dias de boa constância — o público que o Duolingo diz que **não** precisa dele. |
| **WP2.2** Aura (`steadyWindow`) | **SUSTENTA a existência e TENSIONA a inocuidade.** A2 relata "reações intensas de usuários e funcionários que se importavam profundamente com a marca dourada". Ou seja: prestígio cosmético **não é indolor** — as pessoas se esforçam para mantê-lo e sentem quando some. Isso é exatamente o que a linha vermelha "some em silêncio" tenta amortecer, mas não elimina. | A2, A1 | Spec não muda (nome `steadyWindow`, sem rótulo de pureza, já vestida). **A pendência D4 sobe de "pode a aura ser a única coisa que dói?" para "a aura VAI doer — o dono aceita que ela seja a resposta de I.1.2?"** Enquanto D4 não responder, `PROPOSTO`. |
| **WP2.3** Botão vira compromisso | **SUSTENTA** — +10.000 DAU só pelo texto (A2, I.3.2). **Contradiz** só a extensão: a meta de streak em dias (14/30/50) do mesmo experimento **não** entra — é contagem que pode falhar. | A2 | Nada (VERIFICADO em 03/09). Registrar no ledger que a metade "meta de N dias" foi lida e recusada. |
| **WP2.4** Celebração de marco | **SUSTENTA** — háptico + animação para "pausar e saborear" (A2, I.3.3). **C4 tensiona um detalhe da spec Mobbin:** a linha "este hábito já rende mais" é anúncio de recompensa; para Errant Signal isso reduz a atividade a "meio para um fim". | A2, C4 | Sugestão de spec: a linha de permanência fica ("Marco permanente"), a linha de rendimento **sai** ou vira `title` do ícone — o modal celebra identidade (`MILESTONE_TEXT`), não yield. Mantido `navigator.vibrate` (hoje ausente no marco). |
| **WP2.5** Never-miss-twice usa `soulStruggle` | **SUSTENTA o conteúdo** (A5: tiny habits + identity pact), **mas o corpus revelou que a premissa do WP é falsa:** a intervenção ("hoje, só 5 minutos?") **não existe na UI**. `needsIntervention` não tem consumidor fora de testes e do guia. | A5, B.4 | **WP2.5 passa a depender de C-C1.** Redigir a frase com `soulStruggle` antes de existir a tela é escrever legenda para um quadro que não foi pintado. Estado sugerido: `PROPOSTO (bloqueado por C-C1)`. |
| **WP2.6** Widget = janela do pet | **SUSTENTA** (rel. 03 P0-1, rel. 07 §5, D#3: widget "tão eficaz quanto push", funciona porque mostra o pet **personalizado**). **Desacordo interno:** rel. 07 quer "2/4 hoje"; Mobbin tirou o texto abaixo da meta. | 03, 07 | Spec Mobbin mantida (frases sem dígito quando `completed < total`). Registrar o desacordo com rel. 07 como decidido, não reaberto. |
| **WP2.7** Reencontro por dias | **SUSTENTA** — Finch "your bird simply waits for you" (rel. 03 rec. 9), idle games "a volta é celebração" (A2), rel. 07 §2 "se o retorno não for celebrado, o alívio passa despercebido". | 03, A2, 07 | Nada. `daysAway` já vem no `lastDayReport` — a HUD só precisa ler. |
| **WP2.8** `hideMetrics` cobre constância | **SUSTENTA** — De-Gamification "flexibility to play your way" (C4) e "hack back" (A5) são o argumento pré-Mobbin que o candidato Headspace não tinha. | C4, A5 | Nada; ganha duas fontes. |
| **WP2.9** Teste de percentual | **SUSTENTA** — rel. 03 rec. 16, H-10. | 03 | Nada (VERIFICADO). |

**Indiferentes:** nenhum WP é contradito pelo corpus. O que caiu foi uma **premissa** (WP2.5) e
subiu uma **pendência** (WP2.2).

---

## 3. Candidatas (não integradas — o consolidador decide após a linha vermelha)

### C-C1 · A intervenção do never-miss-twice existe de verdade — M
- **Lacuna:** `needsIntervention` (`habitRhythm.ts`) tem teste e comentário de 40 linhas; `GuideModal`/`HelpModal` e o CLAUDE.md prometem "o pet oferece uma versão bem menor do hábito — aceitar já conta como feito". **Nenhum componente chama `needsIntervention`.** O pet nunca oferece nada. A primeira falha não gera nada visível (certo) — e a segunda também não (errado).
- **Fonte:** A5 (Fogg: tiny habits = reduzir a habilidade exigida), rel. 03 §2 "never miss twice… a redução conta como feito", B.4.
- **Spec:** no check-in (`MorningCheckIn.tsx`, que já lista `habitsToday`) e/ou na lista de atividades, todo hábito devido hoje com `needsIntervention(rhythm, now) === true` ganha, no lugar do checkbox comum, uma oferta em dois botões: **"Só 5 minutos hoje"** (aceita → `completeHabit` com o `dayKey` de hoje, mesmo caminho do check normal; fala do pet) e o check normal. Sem terceiro botão, sem "pular". Nunca menciona quantas faltas houve. Texto PT/EN. Nenhuma mudança no motor.
- **Aceite:** render test com rhythm de 2 faltas seguidas → oferta presente; com 1 falta → ausente; aceitar chama o mesmo handler de conclusão (guard de fiação lendo `App.tsx`); nenhuma frase contém dígito além do "5".
- **Comando:** `grep -c "needsIntervention" src/App.tsx src/components/MorningCheckIn.tsx` → ≥ 1 fora de comentário; `npx vitest run src/components/MorningCheckIn`.
- **Nota de guarda:** isto **não é um nono perdão** — é a implementação de um dos oito que estava só no papel. A contagem de D4 não muda.

### C-C2 · "Dias juntos" no perfil — P
- **Lacuna:** `saveDaysLived`/`lastDayReport.saveDay` (`dailyReset.ts`) já contam; nenhuma tela mostra. O número de identidade do streak, sem o zeramento.
- **Fonte:** rel. 03 lacuna 1 e rec. 2, H-2, D#8 ("estou com ele há 8 meses"), C.3 #2 (admissível).
- **Spec:** `StatsPage.tsx` ganha uma linha ao lado de "dias perfeitos até aqui": **"N dias juntos"** / "N days together", lida de `saveDaysLived(state)`. Só cresce por construção. **Não** vai ao widget nesta candidata (WP2.6 decide chaves). Sem "dias em que você apareceu" — seria um segundo número, e A2 (PBL fallacy) pede parcimônia.
- **Aceite:** teste: `saveDaysLived` nunca devolve menos que o valor anterior após `computeDailyReset` (já implícito no `+1` por virada; travar); render test com `saveDay: 42` → texto contém "42".
- **Comando:** `grep -q "saveDaysLived" src/components/StatsPage.tsx`.
- **Custo de D4:** acrescenta um número exposto. Compensa: renomear a prop `streakDays` → `perfectDaysTotal` no mesmo commit (resíduo de vocabulário).

### C-C3 · Selo de Foco do dia visível — P
- **Lacuna:** `focusComplete` (`taskTriage.ts`) tem teste; `GuideModal`/`HelpModal` dizem "completar os 3 rende o selo". **Nenhum componente chama `focusComplete`.** Segunda promessa do guia sem implementação.
- **Fonte:** rel. 03 rec. 8, H-7; rel. 07 rec. 12 ("falta o fecho de loop"); A2 (completion drive).
- **Spec:** quando `focusComplete(tasks, completedTasks, dayKey)` vira `true` no dia, o pet fala uma linha (PT/EN) e a `HomeHud`/palco mostra um selo discreto **só naquele dia** (some na virada, sem toast de perda — é estado do dia, não conquista). Nunca "2 de 3" — ou está completo, ou não há selo. Sem recompensa material (C4).
- **Aceite:** render test: 3 focos concluídos → selo presente; 2 → ausente e sem contagem; dia seguinte → ausente sem mensagem.
- **Comando:** `grep -c "focusComplete" src/App.tsx src/components/pixel/HomeHud.tsx` → ≥ 1.

### C-C4 · Falas intermediárias de constância (sem tocar nas constantes) — P
- **Lacuna:** entre 21 e 66 dias efetivos não há nada (rel. 03 lacuna 3); e o A1 diz que os dias **1–7** são onde o hábito morre — hoje também não há nada antes do 7.
- **Fonte:** rel. 03 rec. 6 / H-5; A1 (consolidação aos 7 dias); A5 (Clear: identidade).
- **Spec:** tabela `HABIT_CHEER_AT = [3, 36, 51]` em `taskModel.ts` (dono único de constantes) — **não** em `HABIT_MILESTONES`; `cheerReached(before, after)` em `habitRhythm.ts` no molde de `milestoneReached`. Efeito: **só fala do pet** (`setMessageTrigger`), sem toast, sem som, sem modal, sem bônus. Textos de identidade, não de contagem regressiva ("a gente já fez isso 36 vezes", nunca "faltam 30 para árvore").
- **Aceite:** `HABIT_MILESTONES` e `HABIT_TIER_BONUS` inalterados (teste existente); `cheerReached` dispara uma vez por cruzamento; nenhum texto contém "faltam"/"left".
- **Comando:** `grep -q "HABIT_CHEER_AT" src/types/taskModel.ts && npx vitest run src/utils/habitRhythm`.

### C-C5 · Celebração rara ao concluir (sabor, não valor) — P
- **Lacuna:** conclusão de tarefa é sempre a mesma animação; a única variação é a da tarefa assombrada (determinística).
- **Fonte:** rel. 03 rec. 7 / H-8; A2 (variable reward magnitude — na antecipação, não no medo).
- **Spec:** em `handleCompleteTask`, ~5% (`RARE_CHEER_RATE` em `taskModel.ts`) de uma fala rara + animação existente do pet (`isGreeting` ou equivalente). **Zero** efeito em comida/energia/atributo/Bits (C4: variável só no cosmético). Nunca anunciada no guia.
- **Aceite:** teste com RNG fixo: recompensa material idêntica com e sem o sorteio.
- **Comando:** `grep -q "RARE_CHEER_RATE" src/types/taskModel.ts`.

### C-C6 · Emissores para `milestone`, `shield_used`, `welcome_back` — PP
- **Lacuna:** os três eventos estão em `TelemetryEvent`/`EVENT_SCHEMA` (`telemetry.ts`) e **nenhum dispara**. WP2.1 precisa de `welcome_back`; WP2.4 emite `milestone` na spec; `shield_used` é o dado de D3.
- **Fonte:** rel. 03 rec. 22 ("medir antes de adicionar Black Hat"); A1 (CURR × WAURR); rel. 07 §3.
- **Spec:** `track('welcome_back', { days_away })` no efeito que mostra o relatório com `welcomeBack` (fora de updater — footgun 6); `track('shield_used')` quando `applyMissedDay` consumiu escudo (comparar `shields` antes/depois no hook, não na função pura); `milestone` fica para WP2.4. Sem texto, sem id de hábito.
- **Aceite:** teste do hook com estado `wasAway` → evento na fila; sem ausência → nenhum.
- **Comando:** `for e in welcome_back shield_used; do grep -c "'$e'" src/App.tsx src/hooks/*.ts; done` → ≥ 1 cada.
- **Fronteira:** `heart_lost`, `perfect_day`, `task_completed` do plano F **não estão no esquema** — é do guarda de telemetria; registrado, não proposto.

### Não propostas (e por quê)
- **Anel agregado na home** (rel. 03 rec. 3): UI, não motor; Mobbin já classificou a fileira como limítrofe. Deixar para o guarda de UI.
- **Minigráfico de 28 dias** (rel. 03 rec. 18): tendência é número que desce.
- **"Usei uma cobertinha por você"** (rel. 03 rec. 17): conflita com A1 — ver 1.6.
- **Push de quase-marco** (rel. 07 rec. 17): cobrança preventiva — vetado.
- **Meta de streak 14/30/50** (A2): contagem que falha — vetado.
- **Copy "You're on a good streak!"** em `ProtectProgressModal.tsx` (`reason: 'streak'`): resíduo de vocabulário, sem contador. Cabe num `fix(copy)` de 2 linhas ("Você está num bom ritmo" / "You're in a good rhythm"); não merece WP. Anotado para quem passar por ali.

---

## 4. O que este guarda mudou de opinião

1. **A tese está mais implementada no motor do que na tela.** Duas das promessas do
   `GuideModal` — "o pet oferece uma versão bem menor do hábito" e "completar os 3 rende o
   selo" — **não existem na UI** (`needsIntervention` e `focusComplete` sem consumidor). Eu
   entrei nesta auditoria defendendo o subsistema "mais bem resolvido"; ele é o mais bem resolvido
   **como funções puras**. O guia do jogo está mentindo em dois pontos, do mesmo jeito que "o pet
   olha" mentia. C-C1 e C-C3 são correções de promessa, não features.

2. **WP2.5 estava construído sobre areia.** Redigir a frase com `soulStruggle` para uma
   intervenção que ninguém dispara. Passa a depender de C-C1.

3. **O buraco de celebração não é só 21→66; é também 1→7.** O rel. 03 viu as 6 semanas sem
   marco; o A1 diz que o hábito morre nos dias 1–3 e consolida no 7. Hoje, antes do dia 7, o hábito
   não tem escudo (só chega no 7), não tem marco e não tem fala. O N/7 amortece o custo, mas não
   celebra nada. C-C4 inclui o dia 3 por isso.

4. **"Some em silêncio" não torna a aura indolor.** A2 relata que a marca dourada do Duolingo
   gerava reações intensas. A aura vai doer ao sumir; o silêncio só evita que o app *esfregue*.
   Isso muda a pergunta de D4: não é "pode a aura ser a única coisa que dói?", é "o dono aceita
   que ela seja?". Se a resposta for não, WP2.2 não deve existir — e o guarda prefere isso a fingir
   que prestígio é neutro.

5. **A recomendação "cobertinha" (rel. 03 rec. 17) está errada, e o A1 é quem mostra.** Anunciar
   o consumo do escudo é torná-lo saliente; saliência é o mecanismo pelo qual o 3º freeze treinava
   ausência. Escudo bom é escudo que a pessoa esquece que tem. O Mobbin já tinha chegado a "não
   criar toast" por falta de motivo; agora há motivo positivo para não criar.

6. **WP2.1 não está bloqueado só por D3.** Está bloqueado por instrumentação: o evento que mediria
   "retorno após ausência" existe no esquema e não dispara. Mesmo com D3 aprovada, o experimento
   não teria leitura. C-C6 vem antes.

7. **Cada WP meu acrescenta um sinal** (aura, selo, dias juntos, falas). O A2 (PBL fallacy) me faz
   escrever o que não escrevi no Mobbin: WP2.8 (`hideMetrics`) não é candidato "sem número" — é o
   contrapeso obrigatório dos outros. Deveria subir de prioridade junto com qualquer um deles.

8. **A contagem de perdões continua em oito.** Nenhum WP de outro guarda acrescentou perdão ou
   cobrança ao motor de hábitos desde o Mobbin; WP1.3 ("check-in não dispara no D0") é adiamento
   de ritual, não perdão, mas fica vigiado — se virar "check-in não dispara nos 3 primeiros dias",
   passa a ser o nono, e D4 precisa estar respondida antes.
