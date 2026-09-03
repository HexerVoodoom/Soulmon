# Linha vermelha × dossiê Mobbin — parecer do guarda

- **Guarda:** `soulmon-guarda-linha-vermelha` (sem WP próprio, de propósito)
- **Data:** 02/09/2026
- **Fonte lida inteira:** `docs/guia-experiencia/09-mobbin-dossie.md` (2.460 linhas, §1–§17)
- **Ledger:** `docs/plano-melhorias/ledger/vetos.md` (todo parecer daqui está lá, datado)
- **Régua:** as 20 proibições do ledger + as seis perguntas. Onde escrevo `P1`…`P6`
  é a pergunta; onde escrevo `#13` é a proibição.

> Método: cada achado marcado ANTI-PADRÃO ou LIMÍTROFE no dossiê foi cruzado com a
> proibição que ele cruzaria se fosse copiado, e o estado do Soulmon foi conferido
> **por `grep` no código**, não por leitura do plano. Onde o código diz uma coisa e a
> §16 do dossiê decidiu outra, está anotado.

---

## 0. Resumo numérico

| | |
|---|---|
| Achados únicos marcados ANTI-PADRÃO ou LIMÍTROFE (famílias contadas uma vez) | **73** |
| … dos quais carregam ANTI-PADRÃO (total ou parcial) | **43** |
| … dos quais são só LIMÍTROFE | **30** |
| O Soulmon **já evita** (confirmado por grep) | **36** |
| **Sancionados por desenho** — número que desce, mas é a única punição do jogo, com teto e perdões (HP, energia) | **4** |
| **Parciais** — evita a regra, tropeça na exibição/copy | **12** |
| **EXPOSTOS** — o código hoje faz o que o dossiê marca como anti-padrão | **8 linhas = 5 exposições distintas** (E1–E5, §2) |
| Fora do escopo deste guarda (UI pura, não toca regra, dinheiro nem dado) | **12** |
| Não verificado nesta passada | **1** (empty state da Biblioteca sem amigos) |

Os cinco expostos, do mais grave ao menos: **E1** widget Android com `"Don't forget
about me today!"` e `"N task(s) left"` (o anti-padrão de referência do arquivo inteiro,
dentro do nosso APK) · **E2** Créditos comprando cura de HP (#13, e o D7 já está na mesa)
· **E3** perfil do amigo exibindo `rank N` e a escada Rookie→Mega com o nível atual
marcado (a armadilha do Mimo, §14 13B, que a §16.4 declarou regra 1 e o código viola) ·
**E4** aba Missões com cadeado + `0/100` em série (Withings/Tripadvisor) · **E5** faixa
do Torneio derivada dos pontos da **season**, logo caduca todo mês (Shopee).

---

## 1. Inventário — cada anti-padrão/limítrofe, a proibição que cruzaria, e onde o Soulmon está

Legenda de estado: **EVITA** · **EXPOSTO** · **PARCIAL** · **SANCIONADO** (número que
desce por desenho, com teto — é onde mora a D4) · **N/A** (não toca regra; não passa por
este guarda).

| # | Achado (app · §) | Classe | Proibição / pergunta cruzada | Soulmon hoje | Evidência (grep) |
|---|---|---|---|---|---|
| 1 | Life Reset — atributos `65` que podem descer · §2, §15.2 | L | P4 (número que desce) | **SANCIONADO** para HP/energia; **EVITA** para atributos (chips só somam `+3`, `CHIP_BOOST`) | `shop.ts:48`; HP = regra ❤️ com `MAX_HEARTS_LOST_PER_DAY` |
| 2 | Replika — paywall no clímax · §2 | A (parcial) | #13-adjacente; tese "criatura antes do pedágio" | **EVITA**: `REVEAL < REGISTER`, `DEMO_PICK` grátis, `UnlockNudge` "nunca abre sozinho" | `SoulmonOnboarding.tsx:181-183`; `UnlockAccountModal.tsx:16` |
| 3 | Tock — folha modal mata sacralidade · §2 | L | — | N/A | — |
| 4 | MyFitnessPal — consentimentos pré-marcados · §2 | A | #18 (dado pessoal), P5 | **PARCIAL**: notificação nasce OFF (`App.tsx:776`), mas **telemetria nasce ON** (`readLocal(K_ENABLED) !== 'false'`) — opt-out; mitigado por "sem conteúdo, sem identidade" e toggle em Configurações | `telemetry.ts:497`; `SettingsPage.tsx:102` |
| 5 | Google Photos — "Results may be unexpected" · §3 | L | — | N/A (copy de espera) | — |
| 6 | Any Distance — pedir follow na espera · §3 | L | P5 | N/A — não há pedido social na geração | `useSpriteGeneration.ts` |
| 7 | WhatsApp — espera sem saída · §3 | A | — | N/A | — |
| 8 | Snapchat — sem estimativa/saída · §3 | L | — | N/A | — |
| 9 | Mimo — erro sem ação · §3 | A | — | N/A | — |
| 10 | Shopify — checklist `0/6` + oferta enxertada · §4 | A | #15-família (dívida), dinheiro no onboarding | **EVITA** hoje (não há checklist). Ressalva vale para **WP1.3** | grep `checklist`: nenhum |
| 11 | Hatch — "6 remaining" (conta restantes) · §4 | L | P4 | **PARCIAL**: `"Faltam 4 dias perfeitos"` na Evolução e `"${total - completed} task(s) left"` no widget | `EvolutionPath.tsx:14-15`; `WidgetRenderer.kt:106` |
| 12 | Future Pro — contagem regressiva · §4 | A | **#15** | **EVITA**: `seasons.daysLeft` e `tournament.daysLeft` existem no util e **não são renderizados**; `DungeonGame.defendTimeLeft` é timer de combate, não de escassez; pesadelo "EXPIRA sem custo" | grep `daysLeft` em `components/`: 0; `nightmares.ts:59` |
| 13 | Duolingo — seta apontando `Allow` · §5 | L / A | **#19**, P5 | **EVITA**: sem mock do diálogo nativo, sem seta | `WelcomePromptModal.tsx:144-150` |
| 14 | Liven — recusa em link pequeno + seta · §5 | L | #19 | **EVITA**: `onSecondary` é botão do `ModalSheet`, mesmo peso | idem |
| 15 | Tempo — diálogo cobre o priming · §5 | L | — | **EVITA**: `onPrimary` só dispara após o modal | idem |
| 16 | Yazio — permissão atrelada à meta, sem recusa · §5 | A | **#19** | **EVITA**: copy "Lembretes das suas tarefas e recados do seu Soulmon", sem promessa de resultado | `WelcomePromptModal.tsx:146` |
| 17 | Buddy — copy de perda ("easiest way to fail") · §5 | L | P1 | **EVITA** | idem |
| 18 | BitePal — corações que esvaziam · §6 | L / A | P4 | **SANCIONADO** (regra ❤️: teto 1/dia, ausência perdoada, segunda devolve 0,5) | `careRules.ts`, `dailyReset.ts` |
| 19 | Abode — dois medidores que descem · §6 | A | P4 | **SANCIONADO** (idem; e `tiredness` é só cosmético — "NÃO PODE reduzir recompensa") | `petNeeds.ts:262-280` |
| 20 | Alan — `600 berries today` zera amanhã · §6 | L / A | P4 | **SANCIONADO**: energia zera todo dia e é exibida `energyPoints/max` | `HomeHud.tsx:195-201` |
| 21 | timespent — dica escrita na arte · §6 | L | regra de idioma (não é proibição) | **PARCIAL**: frases do widget são **só EN, hardcoded em Kotlin** | `WidgetRenderer.kt:62-73` |
| 22 | Me+ — anúncio visível atrás da celebração · §7 | L | dinheiro no clímax | **EVITA** hoje; **WP5.1** propõe oferta no 1º dia perfeito — ver ressalva | `PLANO-MELHORIAS.md` WP5.1 |
| 23 | Weverse — confete cobre o título · §7 | A (parcial) | — | N/A | — |
| 24 | Beli — `125 week streak` exposto · §7 | A | **#1** | **EVITA** (teste em `habitRhythm`); Stats mostra `totalPerfectDays` "dias perfeitos até aqui" (só sobe). Ressalva: copy `"You're on a good streak!"` e strings mortas `currentStreak`/`longestStreak` | `StatsPage.tsx:304-306`; `ProtectProgressModal.tsx:35`; `i18n.ts:527-528` |
| 25 | Deepstash — conquista não obtida com arte completa · §7 | L | — | **EVITA** por decisão 5 (próxima forma não nomeável → silhueta/`?`) | §16.5 |
| 26 | Alma — `Streak saves 0` · §7, §11 | L | D4 / P4 | **EVITA**: escudos só desenhados quando `> 0` ("as CASAS VAZIAS saíram") | `HabitConstancy.tsx:255-264` |
| 27 | Me+ — `Not obtained` ×4 · §8 | L | P4 | **PARCIAL**: aba Missões escreve `cur/target` = `0/100` | `ShopModal.tsx:145-146` |
| 28 | Withings — cadeado + `Unlocked 0/30` · §8 | A | P4, P6 | **EXPOSTO (E4)**: itens `unlock` aparecem "escurecidos com 🔒" + fração em zero | `shop.ts:12-35`; `ShopModal.tsx:141-146` |
| 29 | Replika — traços de personalidade precificados · §8, §9 | A | tese "dinheiro nunca compra vantagem" | **PARCIAL**: reroll (50 Créditos) troca **identidade**, não poder (copy diz isso); chips (Bits) somam atributo → galho; `Créditos→Bits→chip` compra o **galho** indiretamente. Aceitável enquanto atributo não entrar em combate — hoje não entra (`PLAYER_STATS` por estágio; `arena.ts` usa elemento) | `CreditsModal.tsx:216-228`; grep `virusPoints` em `dungeon.ts`/`arena.ts`: 0 |
| 30 | Duolingo — grade mensal cinza permanente · §8 | A | **#1** (fóssil de falha) | **EVITA**: nenhum calendário/heatmap de dias em `components/` | grep `calendar|heatmap`: 0 em UI |
| 31 | Tripadvisor — `0/3` ×5 + cadeado + barra vazia · §8 | A | P4 | **EXPOSTO (E4)** — mesmo que 28 | idem |
| 32 | GoHenry — sem estado obtido/não obtido · §8 | L | — | N/A | — |
| 33 | Mimo — `Wooden LEAGUE` (degrau mais baixo como título) · §9 | L | P4 | **PARCIAL**: `Semente` é o piso, lê como começo; **mas** ver 43 — a faixa reseta com a season | `tournamentTiers.ts:27-33` |
| 34 | Headway — fileira `S M T W T F S` desenha os vazios · §9 8B | A | P4, #1-adjacente | **PARCIAL**: `HabitConstancy` desenha 7 dias e a falta é "anel vazado" — forma própria, escudo parece protegido, nunca vermelho. Ok no app; **nunca no widget** | `HabitConstancy.tsx:17,22-30` |
| 35 | Quizlet — "Study tomorrow to keep your streak" · §9 8B | A | **#15**, **#19** | **EVITA** no push (`"pensou em você"`, `"passou pra dizer oi"`, `"indo dormir"`); **EXPOSTO (E1)** no widget: `"Don't forget about me today!"` | `_pushCopy.js:48-67`; `WidgetRenderer.kt:72` |
| 36 | Calm — `Longest 3` vs `Current 1` · §9 8B | A | P4 | **EVITA** (strings `currentStreak`/`longestStreak` existem em `i18n.ts` e **ninguém usa** — apagar) | grep em `components/`: 0 usos |
| 37 | Duolingo — `FRIEND STREAKS` em fileira · §9 8B, §14 | A | comparação por vizinhança (→ **#21**, nova) | **EXPOSTO (E3)**: Biblioteca lista cada jogador com `"N dias jogando · rank N"` | `LibraryPage.tsx:340-341` |
| 38 | Speak — `LONGEST STREAK` (só cresce) · §9 8B | A (tabela) | — | (detalhe positivo) — `totalPerfectDays` é exatamente isso | `StatsPage.tsx:304` |
| 39 | Headspace — olho para ocultar streak · §9 8B | A (tabela) | — | (detalhe positivo) — `hideMetrics` já existe para a Janela de Descanso | `restWindow.ts` |
| 40 | Duolingo — widget coruja raivosa `Don't forget me!` · §9 8B, §10 | A | **#19**, tese inteira | **EXPOSTO (E1)**: `"Don't forget about me today!"` + `"${total - completed} task(s) left, let's go!"` + corações vermelho/escuro na home screen | `WidgetRenderer.kt:72,106,138` |
| 41 | Deepstash — vende escudos (`2 extra freezes com Pro`) · §9 8B, §15.5 | A | **#13** | **EVITA** para escudos (só ganhos por constância); **EXPOSTO (E2)** para HP: `HEART_COST_CREDITS = 10` cura 1 coração com dinheiro real; e `AD_REWARD_CREDITS` (ads desligados) → mesmo caminho | `monetization.ts:77,104-108`; `CreditsModal.tsx:198-208`; `App.tsx:2628` |
| 42 | adidas — pontos que expiram / nível por inatividade · §9 8B | A | P4 | **EVITA**: `seasons.ts` "NADA EXPIRA. Nunca."; Vínculo "não expira, não decai" | `seasons.ts:26`; `bond.ts:442` |
| 43 | Shopee — `Silver valid till 08 Oct` (patamar caduca) · §9 8B | A | P4 | **EXPOSTO (E5)**: `myPoints` vem de `rank:<season>` (season = `YYYY-MM`) e `getTierStanding(myPoints)` — a **faixa volta a Semente todo mês**. O teste "nunca rebaixa" cobre só dentro da season | `TournamentPage.tsx:153-155`; `community.js:6,199-204` |
| 44 | Mimo (widget) — fileira semanal com seis vazios · §10 | L | P4 | **PARCIAL** — ver 34; widget hoje não tem fileira (mostra `completed/total`) | `WidgetRenderer.kt:97` |
| 45 | MyFitnessPal — `1,284 Remaining` · §10 | L | P4 | **PARCIAL** — ver 11 | — |
| 46 | pushr — pílulas cinza como falhas · §10 | L | P4 | **PARCIAL** — ver 34 | — |
| 47 | Finch — `1ST TIME OFFER` com preço riscado no retorno · §11 | L | #13, P5 | **EVITA**: relatório de retorno diz "não perdeu nada esperando", sem oferta | `DailyReportModal.tsx:102-103` |
| 48 | Numo — "It's your longest streak, don't stop!" · §11 | L / A | **#15** | **EVITA** | grep `não pare|don't stop`: 0 |
| 49 | Paired — `0 days` ×3 · §11 | L | P4 | **EVITA** (quantifica a ausência — "ficou N dias fora" — mas nunca um zero) | `DailyReportModal.tsx:102` |
| 50 | 9 paywalls de tela cheia (Vibecode…Tinder) · §12 | A (família) | tese monetização, P5 | **EVITA**: `UnlockAccountModal` só abre por `UnlockNudge` (3 lugares), nunca sozinho | `UnlockAccountModal.tsx:16`; `CreateModal.tsx:475`; `EditModal.tsx:123` |
| 51 | 9 faixas promocionais permanentes sem `×` · §12 | A (família) | P5 | **PARCIAL**: o `UnlockNudge` da página de Evolução (demo) é permanente e **sem dispensa** — é "uma linha", mas é faixa | `CLAUDE.md` "Desbloqueio no meio do jogo" |
| 52 | Duolingo — `top 8% learner` no card · §13 | A (parcial) | comparação crua | **EVITA** hoje (sem card). Ressalva para **WP4.8** | grep `navigator.share|shareCard`: 0 |
| 53 | Beli — percentil ×2 · §13 | L | idem | **EVITA** hoje; ressalva WP4.8 | — |
| 54 | Uxcel — oferece compartilhar no dia 2 · §13 | L | P5 (constrangimento) | **EVITA** hoje; parecer em §17 Q4 | — |
| 55 | Paired — barras pareadas expõem quem fez menos · §13 | L | #21 | **EVITA** hoje | — |
| 56 | Goodreads — card com dado zero · §13 | L | P4 | **EVITA** hoje | — |
| 57 | Marriott — "brag a little" sobre quatro zeros · §13 | A | P4, P5 | **EVITA** hoje | — |
| 58 | Lapse — `Best friend of` (aba vazia devastadora) · §14 | L | — | N/A (não existe) | — |
| 59 | Telegram — presente pago em moeda comprável · §14 | A (parcial) | tese "afeto sem hierarquia" | **EVITA**: presente é **grátis**, 20 Bits, 1×/dia por amigo, condicionado a energia cheia | `community.js:25,617-637`; `LibraryPage.tsx:30` |
| 60 | Mimo — perfil do amigo reusa card de métrica · §14 13B | A | **#21** (nova) | **EXPOSTO (E3)**: `PlayerDetailModal` mostra `rank N` **e** a escada `Rookie→Mega` com o atual marcado (= altura, não galho). `tasksDone` saiu da UI "de propósito" mas o servidor ainda o envia | `PlayerDetailModal.tsx:98-149`; `community.js:180-188` |
| 61 | Runbuds/Fitbit — `Group Leaderboard` com `0.0 km` · §14 13B | A | comparação crua | **PARCIAL**: ranking global existe (top 50/season), **mitigado**: faixa antes, janela ±3, expansível | `TournamentPage.tsx:27-30,167-170` |
| 62 | Apple Games — três zeros sociais em coluna · §14 13B | A | P4 | **não verificado** (empty state da Biblioteca) | — |
| 63 | Deepstash — `0 Followers · 1 Following` · §14 13B | L / A | P4 | **EVITA**: sem contador de seguidores; amigos = lista, teto `MAX_FRIENDS = 5` | `LibraryPage.tsx:40` |
| 64 | 7 apps — referral em dinheiro, `$0 earned` · §14 | A (família) | tese, #21-regra 6 | **EVITA**: não há referral | grep `referral`: 0 |
| 65 | Numo — convite paga assinatura em escada com cadeados · §14 | L | idem | **EVITA** | — |
| 66 | Replika — fluxo pede tudo, entrega no fim, cobra no clímax · §15.1 | A | tese | **EVITA**: ordem Finch (porquê → 6 perguntas → reveal → cadastro); 20 itens opcionais e **antes** do reveal com justificativa (`CONSENT_STEP`) | `SoulmonOnboarding.tsx:163-189,413-424` |
| 67 | Babbel — fonte pixelada em corpo de texto · §15.2 | L | — | N/A | — |
| 68 | Glow/Uniswap — preço e raridade % por traço · §15.2 | A (parcial) | — | N/A (referência visual) | — |
| 69 | Tolan — `COMPATIBILITY 92%` em barra de semáforo · §15.3 | L / A | **#5**, P4 | **EVITA**: Vínculo é `bondLevelFor(totalXP)`, nunca persistido, "nunca desce" (teste) | `bond.ts:20-41` |
| 70 | Noom — `NO STREAK FREEZE` em caixa alta · §15.5 | A | P4 | **EVITA** (ver 26) | `HabitConstancy.tsx:264` |
| 71 | Finch — `⏱ 4d 22h` de evento sazonal · §15.5 | L | **#15** | **EVITA** (ver 12) — `daysLeft` não renderizado; se um dia for, é calendário ("até domingo"), nunca cronômetro | `tournamentSeason.ts:35-36` |
| 72 | Crypto.com/Xbox/ShopBack — check-in diário com reset e recompensa escalonada · §15.5 | A (família) | **#19**, **#16** | **EVITA**: check-in é ritual sem prêmio escalonado; buff de brincar é "OFERTA, não obrigação", `≥ 1`; teto do Vínculo é suave | `petNeeds.ts:56-60,240-244`; `bond.ts:28-30` |
| 73 | Character AI — quests com valor fixo sem prazo · §15.5 | L | — | N/A (é o aproveitável) | — |

---

## 2. Os cinco expostos — parecer e alternativa

### E1 · Widget Android: `"Don't forget about me today!"` + `"N task(s) left, let's go!"` + corações vermelho/escuro
- **Onde:** `android/app/src/main/java/com/hexervoodoom/soulmon/widget/WidgetRenderer.kt:62-73` (`CHAT_FIXED_PHRASES`), `:106` (`buildChatPhrases`), `:138` (hearts).
- **Cruza:** **#19** ("querer a notificação"), e a frase da tese dita em voz alta — o dossiê chama o widget do Duolingo de "o anti-padrão mais puro do arquivo", e a nossa frase é a mesma frase. Multiplicada pela frequência da home screen (§10: "`Well done!` visto 40 vezes por dia é diferente de `Don't forget me!` visto 40 vezes por dia").
- **Agravante:** só existe em inglês, hardcoded — viola a regra de idioma também.
- **Parecer: VETADO.** Vai para **WP2.6** (Widget = janela do pet) como critério de aceite.
- **Alternativa que dá o mesmo valor:** o modelo Mimo/Alma — mascote em **repouso** + elogio pós-fato (`"Streak secured! Nice work."` → aqui: `"Hoje já rendeu."` / `"Today already counted."`). A frase contextual de dívida vira **contagem do feito**, não do restante: `"2 feitas hoje"` em vez de `"3 task(s) left"`. Corações: manter os cheios; o vazio some (o mesmo princípio dos escudos: "só existe o que existe"). PT+EN via a bridge que já leva `language`.

### E2 · Créditos (dinheiro real) compram cura de 1 coração — `HEART_COST_CREDITS = 10`
- **Onde:** `src/utils/monetization.ts:77`, `src/components/CreditsModal.tsx:198-208`, `src/App.tsx:2628` (`handleInstantHealWithCredits`), `src/utils/instantHeal.ts`.
- **Cruza:** **#13** ("nunca vender proteção contra punição"). O HP é a única punição do jogo; vender a cura dele é o Deepstash vendendo freezes — só que **depois** em vez de antes. E é a pergunta 5 na forma mais crua: se o usuário visse por dentro, veria que o produto **lucra quando o coração dói**, ao mesmo tempo em que empilha oito perdões para ele não doer. As duas coisas não cabem no mesmo produto.
- **Já está na mesa como D7 / WP5.2**, e o plano recomenda (a) remover. **Este guarda concorda com (a) e registra que (b) reenquadrar como item 💗 continua sendo HP por dinheiro — não resolve #13, só esconde.**
- **Parecer: VETADO (pendente de D7 — decisão do dono).** Se o dono decidir manter, o parecer fica registrado e a decisão também.
- **Alternativa:** Créditos gastam em **identidade e arte** (reroll, criatura própria, cosmético exclusivo pago) — o que o Finch/Alan fazem. Cura continua vindo de carinho (grátis, 1/dia), 💗 comprado com **Bits ganhos** ou dropado na masmorra. **Caminho residual a fechar junto:** `Créditos→Bits` (`BITS_EXCHANGE`) → 💗 (150 Bits) ainda é dinheiro→HP com um passo a mais. Aceitável só porque Bits é moeda recuperável e o 💗 é caro em Bits — mas é o mesmo "esconder" da opção (b). Recomendo que WP5.2 registre isso explicitamente em vez de descobrir depois.

### E3 · Perfil do amigo: `"N dias jogando · rank N"` + escada Rookie→Mega com o atual marcado
- **Onde:** `src/components/LibraryPage.tsx:340-341`, `src/components/PlayerDetailModal.tsx:98-149`; servidor `functions/api/community.js:180-188` (`publicProfile` devolve `stage`, `unlockedStages`, `tasksDone`, `daysPlaying`, + `rankPoints` no diretório).
- **Cruza:** a **regra 1 da §16.4** ("nenhum componente de métrica reusado do próprio perfil") e a **regra 3** ("exibir galho, não altura") — que o próprio dossiê chama de "a única que não pode ser negociada depois". O código hoje faz exatamente o Mimo: não desenhou um leaderboard, mas `rank 340` ao lado de cada amigo **é** a fileira `FRIEND STREAKS`. E `tasksDone` foi tirado da tela "de propósito" (comentário em `:98`) mas continua saindo do servidor — a decisão foi tomada no componente, não na API, que é onde o Mimo perdeu.
- **Parecer: VETADO** sob a proibição **#21** (inscrita abaixo). Não há WP cobrindo hoje — precisa entrar (sugiro dentro do WP4.6 ou como WP próprio da presença).
- **Alternativa:** o modelo Finch (§14 13A): a visita mostra **a criatura, o nome da dupla, o galho como palavra** (`"Forma: Brasa"`), e **só verbos de dar** (`sendGift` já existe e já é grátis — é o `Send Good Vibes`). Zero números. No servidor, `publicProfile` deixa de devolver `tasksDone` e `rankPoints` fora da rota `rank`; `unlockedStages` vira só o galho atual. A escada de níveis vive na **própria** página de Evolução, nunca na do outro.

### E4 · Aba Missões: 🔒 + `0/100 kills` em série
- **Onde:** `src/utils/shop.ts:12-35` (`unlock`, "darkened, with a 🔒"), `src/components/ShopModal.tsx:141-146` (`${cur}/${m.target}`).
- **Cruza:** P4 (seis zeros expostos em coluna) e P6 — cadeado "convoca o motor errado" (bloqueio, não curiosidade). É o par Withings (`Unlocked 0/30` + cadeado) que o dossiê marca como "o pior estado inicial possível de uma coleção".
- **Parecer: APROVADO COM RESSALVA** (não é regra, é exibição). Ressalva = critério de aceite para quem tocar a loja (WP4.7 Missões semanais, WP5.1): (1) **suprimir a fração enquanto `cur === 0`** (Reddit) — a condição fica em palavras ("Complete 3 runs da masmorra"); (2) `?` ou arte desfocada em vez de 🔒 (Finch/Withings-técnica); (3) `NEW`/data no obtido, nunca `Not obtained` no não obtido.

### E5 · Faixa do Torneio caduca todo mês
- **Onde:** `src/components/TournamentPage.tsx:153-155` (`myPoints` da linha do ranking da season → `getTierStanding`), `functions/api/community.js:6` (`rank:<season>`, season = `YYYY-MM`).
- **Cruza:** P4 — é o Shopee (`Current tier is valid till…`): um Lendário volta a Semente no dia 1. O teste "acumular pontos nunca rebaixa" é verdadeiro **dentro** da season e falso entre elas. A tese das faixas ("mede o jogador contra ele mesmo") só se sustenta se o número for **lifetime**.
- **Parecer: APROVADO COM RESSALVA** (a faixa é boa; a fonte do número está errada). Ressalva: faixa deriva de pontos **acumulados** (eixo 2 do dossiê 8, "total acumulado só cresce"); a season fica só no **ranking** e nos troféus (que já persistem como cosmético). Teste novo: `getTierStanding` alimentado por lifetime não pode devolver faixa menor após virada de season.

---

## 3. As convergências (3+ apps) sob as seis perguntas

Um padrão que muitos apps usam não é automaticamente aceitável. Marcados com **⚠ NOTIF** os
que respondem à P1 com "querer a notificação" em vez de "querer fazer a tarefa".

| Convergência (§) | P1 tarefa ou notificação? | P2 tira algo? | P3 mais um perdão? | P4 número que desce? | P5 manipulação vista por dentro? | P6 cabe na tese? | Parecer |
|---|---|---|---|---|---|---|---|
| Nome próprio antes do texto; um botão primário (§2, 5+) | tarefa | não | não | não | não | sim | **APROVADO** |
| Gerúndio "Generating…" + orbe centralizado (§3, 7+) | — | não | não | não | só se a barra mentir | sim | **APROVADO** — barra só com marcos reais; senão orbe + estimativa verbal |
| Checklist com `0/4` + barra segmentada + círculo à esquerda (§4, 6+) | tarefa, mas o `0/N` é dívida | não | não | **sim, no zero** | não | com ajuste | **APROVADO COM RESSALVA** para WP1.3: nunca `0/N` (contar feitos, Cleo "you're on a roll"); todo item dispensável (`I don't have one`); **nunca oferta dentro** |
| Prévia de notificação como card do iOS + `Maybe later` (§5, 7+) | **⚠ NOTIF** — a tela existe para vender a notificação | não | não | não | se a seta/assimetria existir, sim | só se o remetente for o pet e a recusa tiver peso igual | **APROVADO COM RESSALVA** para WP1.5: remetente = pet (Finch); botões de peso igual (Outsiders); pedido **depois** de valor entregue, idealmente por ação do usuário (Buddy); prévia mostra zelo, nunca cobrança; escopo declarado (5 Minute Journal) |
| Sombra elíptica; nome perto; estado sem texto (§6, 6+) | tarefa | não | não | "estado sem texto" **pode** ser medidor que desce | não | sim | **APROVADO** — estado por pose/adereço (Ahead), nunca barra de felicidade (Abode) |
| Celebração: `×` + emblema + nome + botão; 4/11 datam (§7, 7+) | depende do botão | não | não | não | — | sim | **APROVADO** para a composição e a data |
| … a saída `CLAIM REWARD` / `Collect my Gold Badge` (§7 divergência) | **⚠ NOTIF** — a celebração vira o guichê do prêmio (recompensa tangível, esperada, condicional) | não | não | não | sim | não | **VETADO** (#19, #16). Alternativa: Ahead `"Let's continue together!"` — saída de **relação**; a recompensa cosmética já vem **vestida** (Alan) |
| Grade 2–3 colunas + categorias na coleção (§8, 7+) | tarefa | não | não | zeros em série, se houver | não | sim | **APROVADO COM RESSALVA**: `?` não cadeado; barra suprimida no zero (Reddit); sem `Not obtained` |
| Prestígio = saldo vivo que zera (§9, 7/10) | **⚠ NOTIF** — o saldo existe para ser defendido à noite | **sim, identidade** | — | **sim** | sim | não | **VETADO** (#1). Eixos 2/3/4 (total acumulado, fato populacional, substantivo) **APROVADOS** — e `Owned by X%` **só em cosmético**, nunca na criatura |
| Fileira `S M T W T F S` no widget (§10, 6+) | **⚠ NOTIF** — no widget, a fileira é a superfície de defesa do streak | não | não | desenha ausências | sim, no widget | não | **VETADO no widget/overlay**; no app, `HabitConstancy` já faz com forma própria — **APROVADO COM RESSALVA** (nunca vermelho, escudo parece protegido) |
| Normalização explícita da falha + CTA para o futuro (§11, 5+) | tarefa | não | é copy, não mecanismo | não | não | sim | **APROVADO** — o eixo Lovi + Todoist; usar a linha do Finch e descartar a metade que contradiz |
| Tabela Free vs Pago por privação (`—`/`×`) (§12, 6+) | — | — | — | — | **sim** — "desenha o que você não tem" | não; "sem urgência legítima, o paywall interruptivo só é extrativo" | **VETADO** para WP5.4. Alternativa: Garmin (`×` no card) + Finch `always available` + Alan (cosmético vs doação) |
| Card 2×2 + marca no rodapé + 1ª pessoa (§13, 6+) | tarefa | não | não | **percentil e streak, se copiados** | não | com ajuste | **APROVADO COM RESSALVA** para WP4.8: só números que crescem; a criatura é o ativo; piso = marco de evolução; **nunca percentil** |
| Métrica por pessoa no social (§14, quase todos) | — | — | — | — | sim (Mimo) | não | **VETADO** → **#21** |
| Retrô confinado (§15.2, 4+) | — | — | — | — | — | — | N/A (visual) |
| Escudo automático, com estoque exibido (§15.5, 7 apps) | tarefa | não | é o perdão que já existe | **`0` exposto** em 3 de 7 | não | sim | **APROVADO** — manter "só desenha se `> 0`" |
| Check-in diário com reset à meia-noite + recompensa escalonada (§15.5, 4 apps) | **⚠ NOTIF** — a forma mais pura: o prêmio é por **aparecer**, e o cronômetro é para o reset | não | — | multiplicador que se perde | sim | não | **VETADO** (#19, #16, #15) para WP4.7: missões com valor fixo e **sem prazo** (Character AI); sem multiplicador que caduca |

---

## 4. Parecer prévio à §16 (decisões tomadas sem passar por este guarda) e à §17

O BRIEF pedia uma seção "o que eu não pedi" (item 3). O dossiê entregou o equivalente
como **§16 — decisões já tomadas** e **§17 — perguntas em aberto**. Parecer a cada uma:

### §16.1 — as oito decisões

| # | Decisão | Parecer | Por quê / ressalva |
|---|---|---|---|
| 1 | Criatura comum grátis, própria paga | **APROVADO** | É a ordem do Finch, e o código já faz (`DEMO_PICK`, reveal antes de `REGISTER`). Ressalva ligada à Q1 abaixo: a comum **tem que ramificar igual** — senão o grátis vira um pet mecanicamente pior, visível na árvore de amigos (P6 falha). |
| 2 | Gênero neutro por nome próprio | **APROVADO** | Não é regra de jogo. Nota: o custo é disciplina de redação em PT-BR, e o dossiê já o declarou. |
| 3 | A criatura É o overlay de desktop | **APROVADO COM RESSALVA** | O overlay é o widget do desktop — a superfície de maior frequência. **A mesma proibição do E1 vale nele**: nunca "N restantes", nunca coração vazio piscando, nunca frase de saudade-cobrança. O desktop já importa as regras de cuidado (footgun 9); a copy do overlay precisa vir da mesma fonte que a do push (WP3.4) para não divergir. |
| 4 | Estoque de escudos invisível | **APROVADO COM RESSALVA** | O código hoje é **melhor que a decisão**: mostra só quando `> 0`, esconde no zero (`HabitConstancy.tsx:255-264`). "Invisível total" jogaria fora a leitura positiva do Yazio (`1 Streak Freeze`, "propriedade do sistema"). Ressalva: manter ">0 only, nunca zero"; não persistir nada novo. |
| 5 | Árvore ramificada por comportamento | **APROVADO** | Já é (3 galhos por atributo, ritmo desempata). Consequência aceita: a Evolução mostra `"Faltam N dias perfeitos"`, nunca o nome da próxima forma — silhueta/`?`. |
| 6 | Psicométrico invisível, só alimenta a criatura | **APROVADO COM RESSALVA** (#18-adjacente) | "Invisível" ≠ "sem sinal" (o dossiê já diz). Ressalva de dado pessoal: os 20 itens são dado íntimo; a **saída** (`Delete my answers`, Speak) é obrigatória e já existe em `AccountDataSection`; e **nada** dos 20 itens pode ir para chat/IA sem D8. |
| 7 | Sem os 20 itens, criatura completa | **APROVADO** | P6 passa: pular não custa. É o oposto do Replika. |
| 8 | Camada social (amigos + criaturas visitáveis) | **APROVADO COM RESSALVA** | Condicionado à **#21**. Hoje o código viola (E3). |
| 8b | Criatura do amigo no estágio real | **APROVADO COM RESSALVA** | Só se a UI mostrar **galho, não altura** (regra 3). `PlayerDetailModal` hoje mostra a escada com o nível atual marcado — é altura. Enquanto isso não mudar, 8b está aprovada no papel e vetada no código. |

### §16.4 — as seis regras da camada social
Todas **APROVADAS**. A regra 1 ("nenhum componente de métrica reusado do próprio perfil")
é promovida a **proibição #21** deste ledger, porque o dossiê está certo em que ela é
decisão de design system, não de tela — e porque o código já a viola. A regra 6
(convite pago em cosmético) fica como critério de aceite de qualquer referral futuro.

### §17 — perguntas em aberto

| Q | Parecer prévio |
|---|---|
| 1 · A criatura grátis ramifica? | **Sim, obrigatoriamente.** O pago compra arte única e insubstituibilidade — "valor mais fino", mas o único coerente com a tese. Um grátis com mecânica pior, exposto socialmente, é o Numo com cadeados na escada de referral. |
| 2 · Como sinalizar que os 20 itens foram usados | Speak `What I heard` (uma linha de síntese, não citação) + Noom `Next steps` + destaque cromático do Lovi. **Nunca diagnóstico, nunca pontuação de eixo** — `OraclePage` continua sem entrada na navegação. |
| 3 · Overlay: área e repouso | Fora do acervo; a ressalva da decisão 3 vale como régua enquanto não há levantamento. |
| 4 · Piso de compartilhamento | **Marco de evolução, nunca calendário; nunca zero.** O primeiro card só existe quando existe uma forma nova para mostrar (Uxcel no dia 2 e Marriott com quatro zeros são o contraexemplo). |
| 5 · A tela de amigos escala? | `MAX_FRIENDS = 5` já resolve — cinco criaturas cabem numa cena sem ordem. **APROVADO manter o teto**; subir o teto é o que reintroduz a lista. |
| 6 · `Buddy up` cria pressão nova? | **Sim, e é VETADO na forma "a falha de um decepciona o outro".** A tese cobre punição pelo sistema; pressão por outra pessoa é punição terceirizada (P2: tira algo — a paz com o amigo). Alternativa: meta **somada** (regra 5) sem exibir a fileira vazia do parceiro; a única ação é kudos. |
| 7 · O estado da criatura é visível socialmente? | **VETADO expor estado.** Visita mostra forma + pose idle neutra. Hoje `publicProfile` **não** expõe HP/sono — bom — mas expõe `tasksDone`/`rankPoints`, que é estado por outro nome (ver E3). |
| 8 · Celebração não bloqueante | Fora do escopo deste guarda. WP2.4 é bloqueante de propósito; a ressalva é só a saída do modal (nunca `CLAIM REWARD`). |

---

## 5. Proibição nova inscrita — #21

> **#21 · Nunca métrica de desempenho de outro jogador — nem por reuso de componente do
> próprio perfil.** A tela do outro só mostra presença (criatura, nome da dupla, galho como
> palavra) e só oferece verbos de dar. Travada por **tese**.
>
> **Motivo:** o Mimo (§14 13B) não desenhou um leaderboard e produziu um — a comparação
> emergiu da simetria de componente. No Soulmon a forma da criatura já É a métrica
> (§16.3), então qualquer número a mais é ranking. O código de 02/09/2026 já cruza esta
> linha (`LibraryPage.tsx:340`, `PlayerDetailModal.tsx:105`, `community.js:180-188`).

Também registrado: **WP5.1** (oferta no 1º dia perfeito) é o padrão Me+ (§7) — oferta
visível no momento de conquista. **APROVADO COM RESSALVA**: a linha do pet vem primeiro; a
oferta nunca no mesmo modal em que `heartsLost > 0`; cap 1/semana (já no aceite); e o
`UnlockNudge` ganha `×` persistente (Garmin) — o mesmo `×` que falta ao nudge da Evolução
(#51 da tabela).

---

## 6. A metade que falta: o que perdoa demais

Este guarda recusa nos dois sentidos. Contei no código, sem decidir o que é "perdão" e o que é
"não-punição" — porque **decidir isso é a D4**, e ninguém decidiu:

teto de 1 coração/dia · ausência ≥ 2 dias não cobra · segunda devolve 0,5 · Teimoso
(0,5) · escudos automáticos · never-miss-twice com versão reduzida · fresh start zera
adiamentos · `every!` da conclusão · **"eu fiz, só esqueci de marcar" devolve os corações
da virada** (`DailyReportModal.tsx:16,47`, `App.tsx:2800`) · `timesPerWeek` · hábito
novo nasce em 100% · pesadelo expira sem custo · masmorra sem custo de coração.

O plano fala em "oito"; eu conto entre oito e treze conforme a definição — e é exatamente
por isso que a pergunta importa. O que este parecer aponta:

- **O "esqueci de marcar" é o candidato a nono perdão.** É autorrelato sem verificação,
  reversível na mesma manhã em que o carinho já devolve 0,5 e o teto já limitou a 1. Somados,
  um coração perdido tem **três** caminhos de volta antes do almoço. Não é que seja errado —
  é que ninguém disse que era o limite. **Parecer: BLOQUEADO:D4** para qualquer perdão
  adicional (WP2.x, WP4.x); e recomendação de que a resposta à D4 **nomeie** quais destes
  são a linha, em vez de contar.
- **A contradição que só se vê olhando os dois lados:** o produto empilha perdões para o
  coração não doer **e** vende a cura do coração por dinheiro (E2). Se o coração não dói, a
  cura não vale 10 Créditos; se vale, o produto tem incentivo para que doa. D4 e D7 são a
  mesma pergunta vista de dois lados, e deviam ser respondidas juntas.
- **Onde NÃO perdoa demais, e está certo:** o Vínculo tem teto suave e não decai; a
  constância custa 14% por falta (custa algo); o Torneio rende XP na derrota mas menos que
  na vitória. A mecânica ainda significa. É esse o ponto a proteger.

---

## Apêndice — proibições citadas, para referência rápida

`#1` streak que zera · `#5` bondLevel persistido · `#13` vender proteção contra punição ·
`#15` "última chance"/FOMO · `#16` recompensa por contagem · `#17` nono perdão sem D4 ·
`#18` texto do usuário em IA/telemetria sem D8 · `#19` "querer a notificação" · `#21`
métrica de outro jogador (nova). Perguntas P1–P6: ver cabeçalho do ledger.
