# Estudo × Vínculo — o corpus pré-Mobbin contra o código (guarda-vínculo)

Data: 03/09/2026. Dono: `soulmon-guarda-vinculo` (WP3.1–3.7).
Ledger: `../ledger/vinculo.md`. Anexo de fatos: `../C-presenca.md`. O dossiê Mobbin
já foi destrinchado em `../mobbin/vinculo.md` e **não é repetido aqui** — onde ele já
decidiu algo, a linha aponta para lá.

**Toda afirmação sobre o código abaixo foi confirmada por `grep`/leitura nesta sessão.
A referência é `arquivo` + SÍMBOLO, nunca número de linha.** Onde não achei, está
escrito `NÃO ENCONTRADO`.

## Fontes lidas (inteiras)

- `docs/guia-experiencia/02-tamagotchi-effect-psicologia.md` (§1 mecanismos, §2 fortalece,
  §3 quebra, §4 DON'Ts, §5 recomendações 1–17)
- `docs/guia-experiencia/08-transcricoes-notebooklm.md` — B1 (Maia Faith / Pew Moments),
  B2 (PBS Game/Show / Takayama), B3 (morte e punição), B5 (animação do Duolingo)
- `docs/guia-experiencia/04-monster-taming.md` (§1 V-Pet/GO/Palworld, §2 fragilidade da
  fantasia, §3 recomendações 1–17)
- `docs/GUIA-EXPERIENCIA.md` — B.5 (Vínculo de longo prazo, V-1…V-18), B.7 (Retenção e
  win-back, R-1…R-15 + calendário), I (rodada 2: I.1.3, I.2, I.3.3, I.3.4)
- `docs/guia-experiencia/07-retencao-engajamento.md` (§4 calendário de push, §5 widget,
  §6 recomendações, §8 três eixos)
- `docs/plano-melhorias/C-presenca.md`

Código lido/grepado: `src/components/CompanionHUD.tsx`, `ChatBox.tsx`,
`NotificationManager.tsx`, `DailyReportModal.tsx`, `StatsPage.tsx`, `EvolutionPath.tsx`,
`functions/api/chat.js`, `_pushCopy.js`, `_redact.js`, `subscribe.js`,
`workers/push-scheduler.js`, `src/utils/bond.ts`, `passives.ts`, `sounds.ts`,
`petNeeds.ts`, `nightmares.ts`, `restWindow.ts`, `telemetry.ts`, `habitRhythm.ts`,
`src/hooks/useCareSystem.ts`, `src/App.tsx` (trechos), `src/contexts/GameStateContext.tsx`
(GameState), `android/.../widget/WidgetRenderer.kt`.

## Cinco fatos novos que este destrinchado produziu (leia antes da tabela)

1. **A fala de alívio da tarefa assombrada nunca acontece.** `App.tsx`
   (`handleToggleTask`, bloco `relief`) chama `setMessageTrigger(prev => prev + 1)` com o
   comentário "O mesmo caminho de fala do resto do app — o pet reage, não um banner". Mas
   a prop `triggerMessage` do `CompanionHUD` é **declarada e desestruturada e nunca lida**
   (`grep -rn triggerMessage src` → 3 ocorrências: a interface, o default e o
   `triggerMessage={messageTrigger}` do `App.tsx`; nenhum `useEffect` a consome). O mesmo
   vale para o `setMessageTrigger` do cocô em `useCareSystem.ts`. O que o jogador vê é o
   `toast(...)` — exatamente o banner que o comentário nega.
2. **O push de deitar não existe.** `sleepReminderAt` (`utils/restWindow.ts`) não tem
   nenhum chamador fora do próprio arquivo (`grep -rn sleepReminderAt src` → só a definição
   e o comentário de cabeçalho). O `CLAUDE.md` (🛏️), o `GUIA-EXPERIENCIA.md` B.7 e o
   relatório 07 §4 o listam como "existente".
3. **A oferta "hoje, só 5 minutos?" não está ligada.** `needsIntervention`/
   `consecutiveMisses` (`utils/habitRhythm.ts`) não aparecem em nenhum componente nem no
   `App.tsx`; o `GuideModal.tsx` cita `MISS_INTERVENTION_AT` como regra em vigor. Domínio do
   guarda-constância — registrado aqui porque a recomendação 12 do relatório 02 pede que a
   oferta venha **na voz do pet**.
4. **`bond_level` e `welcome_back` existem no union de `utils/telemetry.ts` e nunca são
   emitidos** (`grep -rn "bond_level\|welcome_back" src` fora de `telemetry.ts` e testes →
   0). O `App.tsx` tem 10 `track(` e nenhum deles é de vínculo ou retorno.
5. **O widget Android fala só em inglês e tem três frases de cobrança**:
   `WidgetRenderer.kt` `CHAT_FIXED_PHRASES` inclui "Don't forget about me today!",
   "Let's tackle our tasks together?" e "Ready to evolve today?". Sem par PT.

## A tabela

Vereditos: **já faz** · **lacuna** · **conflita com a tese** · **não se aplica** ·
**já coberto por WP (qual)**.

### Relatório 02 — Tamagotchi effect e psicologia

| O que a fonte diz (fonte + bloco) | O que o Soulmon faz hoje (arquivo + SÍMBOLO) | Veredito |
|---|---|---|
| 02 §1.1 — o apego nasce do **ato de cuidar**; o ingrediente é responsabilidade percebida, necessidades que surgem "queira você ou não" | Necessidades em relógio real: cocô agendado (`useCareSystem.ts`, `setCareEvent({type:'poop'})`), fome (`careEvent.type==='food'`), energia que zera na virada (`dailyReset.ts`), dreno de cocô (`poopDrain.ts`). `petNeeds.ts` (`needsAttention`) devolve **no máximo 1** pedido, por princípio escrito no cabeçalho ("NÃO ADICIONAR MAIS MEDIDORES") | **já faz** — versão domesticada: a necessidade existe, o custo é limitado |
| 02 §1.2 — animismo dispara com **comportamento contingente** (a coisa reage a mim) e com linguagem | Reage: comida → `showHug()` + `speakRaw('+1⚡')`; banho → `showHug()` (`handleShowerClick`); carinho → `rubHearts`; toque → `handlePetClick` (fala + IA). **Não reage**: concluir tarefa (`App.tsx` só `playTaskComplete()`), assombrada (prop `triggerMessage` morta — fato 1), subir de Vínculo (`awardBondXP` sem fala) | **lacuna** → **já coberto por WP3.2** (voz nos momentos mudos) + WP3.3, com o fato 1 como aceite novo |
| 02 §1.3 — efeito ELIZA: a fala é o amplificador mais potente e a maior responsabilidade ética | `chat.js` `buildSystemPrompt`: bloco `NEVER` que "overrides every setting above, including the user style block"; `sanitizeCustomKeywords` impede forjar estrutura; `minimizeForAi` (`_redact.js`) tira PII. Sem memória: `messages: [system, user]` | **já faz** (a trava) · **lacuna** (a memória) → **WP3.1** |
| 02 §1.4 — cuidar é gratificante em si (Paro, AIBO) | Cinco gestos de cuidado (comida, carinho, banho, dormir, brincar em `petNeeds.ts` `play`) | **já faz** |
| 02 §1.5 — **autocompaixão por procuração**: o pet é espelho; sem punição, sem julgamento por dias perdidos (Finch) | `ChatBox.tsx` `getPetResponse` caso `sad`: "Tô aqui. / Não precisa estar bem agora. / Fico com você." (o pool antigo "Cheer up!" foi removido, comentário no código). `chat.js` `NEVER`: "If they say they had a bad day… stay with them, do not propose tasks and do not try to cheer them out of it" | **já faz** — é precedente com evidência |
| 02 §1.6 — apego cresce com **singularidade**, **memória** e **trajetória** | Singularidade: Oráculo (`soulProfile/`), sprite próprio. Memória: NÃO EXISTE no chat (`chat.js`, `messages=[system,user]`); nem no cliente (`ChatBox.tsx` não tem lista de mensagens — só `inputValue`; a resposta vai para `onSendMessage` → `speak`). Trajetória: `StatsPage.tsx` "Formas já alcançadas" (`formNames`, só nomes; sem sprite, sem data) | singularidade **já faz** · memória **lacuna → WP3.1** · trajetória **parcial** (V-7 álbum, fora deste domínio) |
| 02 §1.7 — SDT: **autonomia** (eu escolho a meta, o pet não manda) | `CompanionHUD.tsx` `getIdlePhrase`/`handlePetClick`: "Vamos completar tarefas!" / "Let's complete tasks!", "Me alimenta!", "Feed me!". `WidgetRenderer.kt`: "Don't forget about me today!" | **conflita com a tese** → **WP3.2** (aceite de léxico do Mobbin cobre HUD; o widget **não** — ver C-V5) |
| 02 §1.8 — Fogg: prompt sem habilidade frustra; daí o "hoje, só 5 minutos?" | `needsIntervention` sem consumidor (fato 3) | **lacuna** — domínio constância; a voz é deste guarda (ver "Cruzamentos") |
| 02 §2 — reação específica > genérica; reage ao **horário**, ao **histórico** ("você voltou!") | `periodoDoDia()` só muda o céu do visor; nenhuma fala varia por período. `saudar()`: 4 frases fixas, limiar `10 * 60 * 1000`, não lê `daysAway` | **lacuna** — retorno é WP2.7 (constância, já mapeado no Mobbin); horário cabe no WP3.2 como tabela `kind:'period'` |
| 02 §2 — vulnerabilidade **sem chantagem**: depende de você, custo limitado e reparável | Teto 1/dia, `ABSENCE_FORGIVENESS_DAYS`, carinho cura (`careRules.ts`, `rubDecision`) | **já faz** (regra do guarda-constância; citada porque sustenta o tom) |
| 02 §2 — memória e continuidade: referenciar `soulGoal`, o **nome**, dias marcantes | `soulGoal` só em `DailyReportModal.tsx` (perfeito/retorno) e `StatsPage.tsx` ("Começou por:"). O chat recebe `petName: currentStage` (espécie) e nunca `soulmonDisplayName` (Mobbin, WP3.1 item 0). `soulGoal` não vai à IA (`_redact.js` cabeçalho: "NÃO passam por nenhuma dessas rotas") | **lacuna → WP3.1** (nome: item 0; `soulGoal` em texto: `BLOQUEADO:D8`) |
| 02 §2 — rituais: cerimônia de evolução MANUAL | `EvolutionPath.tsx` (`evolutionLocked`, sintonia no visor `useVarreduraDeSintonia`) | **já faz** |
| 02 §2 — **voz consistente e gentil**; o pet torce, nunca cobra | `chat.js` BRANCH/MATURITY (maturidade pelo NÍVEL, "never from above"); `motivMap.challenging` reescrito como convite; `ChatBox.tsx` pools `task`/`food`/`farewell` reescritos sem cobrança (comentários no código registram cada troca) | **já faz** |
| 02 §3 — **culpa → vergonha**: se a criatura É a alma, criatura sofrendo = "eu sou ruim" | `getIdlePhrase` com `hpRatio <= 0.25`: "Não me sinto bem... / Preciso de cuidados! / HP baixo...". `RUB_HINT_SHOWN`: "Estou machucado... faz carinho em mim!". `NotificationManager.tsx` 20h `hp-critical-evening`: "${petName} está meio pra baixo" **só quando `completedSteps < totalRequired`** — o estado do pet é ligado à meta não cumprida | **conflita com a tese** (V-2 "se preocupa, não sofre") → adendo ao **WP3.2** (léxico de sofrimento, não só de medidor) e ao **WP3.4** (a condição da 20h) |
| 02 §3 — cobrança no retorno = desinstalação | `DailyReportModal.tsx` `welcome`: "não perdeu nada esperando — só estava com saudade. Comece de onde parou." `onRecoverHearts` só quando `!welcome` (`canRecover`) | **já faz** (o `${daysAway}` impresso já está no WP2.7) |
| 02 §3 — notificações manipuladoras ("triste porque VOCÊ não veio") | `_pushCopy.js` (10h/16h/22h): nenhuma. `App.tsx` `poop-drain-warning`: "Seu Soulmon está na sujeira! Cocô não limpo tira 1 coração em breve" — fato + ação, sem "você"; 07 §4 a classifica como o único push urgente legítimo | **já faz** — com a ressalva da 20h (linha acima) |
| 02 §3 — monetização atravessando o afeto | `grep -c "Crédit\|credit"` em `CompanionHUD.tsx`, `ChatBox.tsx`, `_pushCopy.js`, `NotificationManager.tsx` → **0**. A voz e o push nunca vendem. (Cura por Créditos é B.6, fora deste domínio) | **já faz** (neste canal) |
| 02 §3 — superjustificação: devolver reflexão e atribuição interna | `soulGoal` devolvido no dia perfeito; humor nunca vira score (`mood.ts`) | **já faz** (parcial — rec 6 "reflexão de 1 linha" NÃO ENCONTRADO em `rituals.ts`/`mood.ts`/`DailyReportModal.tsx`) |
| 02 §4.3 — **nunca usar a voz DO PET para cobrar**; push repetido no momento errado → habituação | 10h "Tem algo do seu dia que você já fez?" (pergunta). 20h `evening-reminder`: "Marque o que você fez hoje e dê uma comidinha — energia cheia fecha o dia perfeito" (diretiva condicionada à meta). Três pushes fixos por dia + 20h + cocô | 10h/16h/22h **já faz** · 20h **conflita** → **WP3.4** (o Mobbin já absorveu) · volume: ver "Cruzamentos" |
| 02 §4.10 — disclaimer "não é tratamento" + ponte para ajuda (CVV 188) se o chat detectar sofrimento agudo | `grep "tratamento\|treatment\|CVV\|188\|crisis"` em `ChatBox.tsx`, `AISettingsModal.tsx`, `SettingsModal.tsx`, `chat.js` → **NÃO ENCONTRADO**. O bloco `NEVER` manda "stay with them" — o modelo fica, mas ninguém aponta a saída | **lacuna** → **C-V2** (obrigação que acompanha WP3.1, como B.5 já avisava) |
| 02 §4 públicos vulneráveis — ansiedade: possibilidade de esconder métricas | `hideMetrics` só no descanso (`restWindow.ts`); HP/energia sempre visíveis no `HomeHud` | **não se aplica** a este domínio (é UI de medidores; registrado para o guarda de HUD) |
| 02 rec 1 — memória afetiva no chat (`perfectDays`, evolução recente, `soulGoal`, dias fora) | Nada disso entra (`C-presenca.md` "NÃO ENTRA") | **já coberto por WP3.1** |
| 02 rec 2 — criatura que se preocupa, não que sofre | ver §3 acima | **adendo WP3.2** |
| 02 rec 3 — ritual de reencontro: cena dedicada, fala de saudade sem menção a perda | `saudar()`: pulo `isGreeting` 800 ms + 1 frase; `DailyReportModal` modo `welcome`. Sem cena; sem leitura de ausência no HUD | **parcial** → WP2.7 (constância) + a fala é WP3.2 |
| 02 rec 4 — diário da criatura (linha do tempo: nascimento, evoluções, sonhos, 1º dia perfeito) | `StatsPage.tsx` seção "A jornada" em FRASE (`feitos`, `formNames`, `soulGoal`). Sem datas; sem nascimento (não existe campo — fato em C-V4) | **lacuna** (P2; dono natural: jornada/StatsPage). Registrada, sem candidata própria |
| 02 rec 5 — devolver o "porquê" em mais momentos (marcos, evolução) | `soulGoal` NÃO ENCONTRADO em `EvolutionPath.tsx` nem na cerimônia; `grep -rln soulGoal src/components` → só `DailyReportModal`, `StatsPage`, onboarding | **lacuna** (V-13; dono: evolução). Não é canal de IA, então **não** esbarra em D8 |
| 02 rec 7 — aniversário do pet (data de criação no save) | `GameState` (`GameStateContext.tsx`): `createdAt` existe só em **Task**; `soulmonMeta` = `seed/baseName/petName/dominant*`. **Nenhuma data de nascimento da criatura** | **lacuna** → **C-V4** |
| 02 rec 8 — toque com variedade por humor/hora/traço (`petPassive`) | `grep -n "passive\|petPassive" CompanionHUD.tsx` → **0**. O carinho não fala (`rubTick` só `onPetRef`), o toque tem cascata só por HP/energia/cocô | **lacuna** → **C-V3** |
| 02 rec 9 — implementation intentions no check-in | NÃO ENCONTRADO campo "quando/onde" (`rituals.ts` só cita Gollwitzer no `stackingSuggestion`) | **não se aplica** a este domínio (rituais) |
| 02 rec 10 — push com voz do pet e sem culpa; nunca estado de sofrimento no push | `_pushCopy.js`: `name = petName \|\| 'Soulmon'` em todo título. 20h "está meio pra baixo" = estado de sofrimento | **já faz** (worker) · **conflita** (20h) → **WP3.4** |
| 02 rec 11 — modo pausa/férias explícito; pet hiberna feliz, carta na volta | `grep -rni "vacation\|férias\|hibern\|pauseMode"` em `src` → **NÃO ENCONTRADO**. O perdão de ausência age por acidente | **lacuna** (V-17; dono: constância/dailyReset). A "carta na volta" é voz — ver "Cruzamentos" |
| 02 rec 12 — never-miss-twice COMO cuidado do pet | fato 3 | **lacuna** (constância) |
| 02 rec 13 — sonhos que referenciam o dia | `DREAM_CATALOG` (`restWindow.ts`) é fixo; nenhuma referência a tarefa/`soulGoal` (`grep` → 0) | **não se aplica** (descanso; e referenciar nome de tarefa esbarra em D8 se for por IA) |
| 02 rec 14 — degeneração como "resfriado", nunca morte; recuperar rápido e afetivo, nunca pago | `DailyReportModal.tsx` headline `degenerated`: "Seu Soulmon voltou um estágio" / "stepped back a stage"; ícone `bedtime`; `grep "morr\|morte\|death"` nos componentes → nada fora de Dino/masmorra. `sounds.ts` `playDegenerate`: "Descending sad tones + low thud" | **já faz** — o único resíduo "triste" é o som |
| 02 rec 15 — marcos do VÍNCULO com nomes relacionais, desbloqueando falas e gestos | `bond.ts` `BOND_TITLES` (Companheiro L2 / Confidente L6 / Alma Irmã L10 / Vínculo de uma Vida L13); `BOND_REWARDS` 100% cosméticas. `grep bondTitle CompanionHUD.tsx` → 0. Nenhuma fala/gesto por nível | **já coberto por WP3.3** (pílula) — "falas e gestos novos" ainda não está na spec (ver WPs × corpus) |
| 02 rec 16 — transparência das regras (GuideModal com constantes) | `GuideModal.tsx` importa `MISS_INTERVENTION_AT` etc. — mas descreve a intervenção que não está ligada (fato 3) | **já faz** na forma; **falso** no conteúdo daquela linha |
| 02 rec 17 — disclaimer gentil + ponte de ajuda | ver §4.10 | **C-V2** |

### Transcrição B1 — por que as pessoas odiaram os v-pets

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| B1/Maia 1 — morte em menos de meio dia → ansiedade e luto (padrão atribuído a outros) | Sem morte; degeneração reversível (`degeneratedByHP`, `dailyReset.ts`); teto 1 coração/dia | **já faz** — decisão oposta, de propósito |
| B1/Maia 2 — **bipes na escola**, banimento: o brinquedo que chama atenção sozinho | Som 100% sintetizado com `SOUND_MUTED` (`sounds.ts` `isMuted`); **nenhum som ligado a fala/saudação/idle** (o HUD importa só `playShower`, `playVisorTune`). Push: 3 horários fixos + 20h condicional + cocô | **já faz** — e é o argumento mais forte para o WP3.5 ficar `BLOQUEADO` |
| B1/Maia 3 — Pocket Pikachu **bravo e gelado**, ignora o jogador negligente | `saudar()` sempre cumprimenta; `ChatBox.tsx` `farewell` sem "não suma!" (comentário: "culpa por ir embora contradiz o perdão de ausência") | **já faz** — anti-padrão evitado |
| B1/Maia 5/8 — Neopet/Pixel Chick **vai embora** por negligência ("ainda assim doía") | Nada equivalente; win-back do ledger termina em **silêncio, com o pet ficando** ("Eu fiquei por aqui", copy Mobbin §6) | **não se aplica** (o oposto é a regra) |
| B1/Maia 7 — Blinkies "extremamente bravos" sem comida | `fullSignal`/`healCapSignal` falam "estou cheio"; fome idle é pedido, nunca raiva | **já faz** |
| B1/Maia 12–13 — hardware ultrapassado; migrou para mundos mais ricos (Webkinz, Nintendogs) | Palco com decoração/cenários (`petStage.ts`); masmorra/torneio | **não se aplica** (é conteúdo, não vínculo) |
| B1/Pew 1–2 — rotina incessante vira **chore**: "parecia tarefa doméstica" (experiência pessoal) | `petNeeds.ts` cabeçalho: regra de ouro contra medidores novos. **Mas**: idle fala a cada `180000` ms com a cascata de pedidos ("Me alimenta!", "Preciso de banho!"), sem teto de repetição; é o bipe do Tamagotchi em texto | **conflita parcialmente** → adendo ao **WP3.2**: cadência de pedidos |

### Transcrição B2 — mecanismos nomeados

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| B2/PBS 1 — Tamagotchi effect: interpretar comportamento lógico como reação afetiva (argumento do apresentador) | `showHug` após comida/banho é um comportamento lógico que lê como afeto | **já faz** |
| B2/PBS 2 — Pentland (MIT): **responsividade, mimetismo, reatividade** são as pistas que o cérebro usa para "está vivo" | Responsividade: toque → fala (`handlePetClick`). Reatividade: contingente parcial (tabela 02 §1.2). **Mimetismo: nada** — o humor do check-in (`moodLog`, `mood.ts`) nunca chega ao pet; o chat recebe `mood: companionMood` (derivado de energia/HP, `App.tsx` `getCompanionMood`), não o humor da pessoa | **lacuna** → **WP3.1** já prevê `mood` como enum; o corpus dá o **motivo** (mimetismo) |
| B2/PBS 3 — vulnerabilidade/esforço físico engaja empatia (robô de minas, Washington Post) | `RUB_HINT_SHOWN`: "Estou machucado... faz carinho em mim! Segura e esfrega aqui que eu saro!" — pede ajuda e ensina o gesto | **já faz** — e **discorda de 02 §3**; ver "Desacordos" |
| B2/PBS 4 — legitimidade por complexidade (criador do Furby) | — | **não se aplica** (filosofia, não design) |
| B2/Takayama 1 — vieses sociais transferidos (altura = credibilidade; Nass) | `chat.js` `maturity` por estágio ("never from above") — a autoridade percebida cresce com o estágio, e o prompt a contém | **já faz** |
| B2/Takayama 2 — locus de controle interno rejeita automação que decide por ele | Carga do dia é aviso, nunca bloqueio (`isOvercommitted`); o pet não reagenda | **já faz** (regra de constância) |
| B2/Takayama 3 — distanciamento "videogame" incentiva abuso | — | **não se aplica** |
| B2/Takayama 4 — **Tweenbot**: fragilidade deliberada que "pede ajuda" ativa cuidado coletivo | Mesma linha do `RUB_HINT` | **já faz** — e é o modelo para reescrever "HP baixo..." |

### Transcrição B3 — morte e punição

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| B3 (1) — Yokoi: sem upkeep real não há responsabilidade; bicho real é fofo 20–30% do tempo; a "dor do cuidado" foi emulada de propósito | Necessidades existem (tabela 02 §1.1) mas a dor é limitada por regra | **conflita com a tese — de propósito** (decisão registrada em `GUIA` I.2: "o Soulmon fica com a primeira metade") |
| B3 (1) — irreversibilidade: reset não ressuscita o mesmo pet | Um pet só, nunca substituído por regra (04 rec 13); degeneração reversível; reroll troca a criatura (`handleUpgradeRevealed`, fora deste domínio) | **já faz** por decisão contrária — a irreversibilidade que sobra é a identidade, não a vida |
| B3 (1) — contingência em tempo real, no relógio do bicho, mesmo sem o dono olhar | Cocô em relógio real (`poopEventsScheduled`), dreno pausa dormindo; push em nome do pet com app fechado (`push-scheduler.js`) | **já faz** |
| B3 (2) — severidade e rapidez: morrer numa manhã de escola | Teto 1/dia; `ABSENCE_FORGIVENESS_DAYS` | **já faz** |
| B3 (2) — **sem botão de pausa**: 5–6 h ignorado = morte | Pausa explícita NÃO ENCONTRADA (02 rec 11); ausência ≥2 dias é perdoada sem pedir | **parcial** — o perdão automático é melhor que um botão (Mobbin/Todoist), mas quem está doente 1 dia não é "ausente" e sofre o dreno de cocô |
| B3 (2) — chore | ver B1/Pew | **adendo WP3.2** |
| B3 (2) — fantasma sobre a lápide = culpa direta; Bandai trocou por "voou para casa" | `DailyReportModal` degeneração: "voltou um estágio", ícone `bedtime`, sem sprite de morte | **já faz** |
| B3 (2) — CD-ROM daycare 85% escondido nos termos: regra oculta mata confiança | `GuideModal.tsx` usa as constantes | **já faz** (com a exceção do fato 3) |

### Transcrição B5 — animação e emoção (Duolingo)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| B5 (1) — áudio sobre sprite estático lê como software frio; fala **sincronizada com o corpo** vira "parceiro atencioso" | Balão `speak()` com rabinho; corpo: `isGreeting` (pulo) só na saudação; blink irregular (`sm2-pet-blink`); andar com pausas irregulares (`WALK_TICK_MS`); squash. Fora da saudação, **fala e corpo não se sincronizam** | **parcial** → WP3.2: cada `kind` de fala com uma pose (o Mobbin já apontou "pose por adereço") |
| B5 (2) — **olhar direcionado** guia a atenção e expressa interesse | "O pet olha a assombrada": `grep haunted CompanionHUD.tsx` → 0 | **já coberto por WP3.2** |
| B5 (3) — absurdo/humor desarma a fadiga | Falas idle são utilitárias; `aiSettings.tone='playful'` existe no prompt | **parcial**; sem candidata (é conteúdo de fala, cabe nas tabelas do WP3.2) |
| B5 (4) — DuoRadio: variabilidade mantém fresco | 3 frases por estado na cascata idle | **lacuna pequena** (WP3.2 amplia os pools) |
| B5 (5) — celebração rica **só em marcos**, que interrompe o fluxo | Evolução: sintonia (`useVarreduraDeSintonia`) interrompe. Vínculo sobe: nada (`awardBondXP` silencioso; `bond_level` nunca emitido — fato 4). Assombrada: toast (fato 1) | **já coberto por WP3.3** (micro-cerimônia) + WP3.2 |

### Relatório 04 — monster taming (vínculo e personalidade)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| 04 §1 V-Pet — care mistakes selecionam galho, não game over | `carePattern.ts` desempate | **já faz** (constância/evolução) |
| 04 §1 V-Pet — rota de redenção nomeada (Numemon → Monzaemon) | `grep -rni "redemption\|redenção\|redeem"` em `progression.ts`/`dailyReset.ts`/`EvolutionPath.tsx` → **NÃO ENCONTRADO** (`monzaemon` só em `LEGACY_FORM_TIERS`) | **lacuna** (V-4, P1; dono: evolução). A fala do pet na volta é deste guarda — registrada em "Cruzamentos" |
| 04 §1 GO — Buddy: ações diárias baratas sobem amizade com **marcos visíveis** (coração na tela, badge) | `bond.ts` tem a escada e os títulos; HUD não mostra (`bondTitle` → 0 no HUD) | **já coberto por WP3.3** |
| 04 §1 Palworld — animações de vida própria (dormir, comer, tropeçar) | Andar/parar/virar, piscar, squash, pulo de chegada — todos com guard `document.hidden`, `isSleeping`, `reducedMotion` | **já faz** |
| 04 §1 Palworld — reagir a itens que o jogador COMPROU | `equippedDecor` entra no HUD só para renderizar (`PetStage`); nenhum comportamento lê decoração | **lacuna** (V-10, P2; sem candidata — custo de arte) |
| 04 §2 — "quase todo o vínculo hoje é mecânico; o que falta é **memória e reação**" | Confirmado: `C-presenca.md` + fatos 1 e 4 | **já coberto por WP3.1/3.2** |
| 04 rec 2 — marcos de Vínculo com cerimônia **e um comportamento novo do pet** (corre até a borda ao abrir) | `saudar()` é igual em todo nível | **parcial no WP3.3** — a spec do Mobbin tem pílula + fala + telemetria; **não** tem comportamento por nível (ver WPs × corpus) |
| 04 rec 3 — ecos do Oráculo no chat ("criatura que sabe de onde veio") | `soulmonMeta.dominantElement/Alignment/Realm` são **uniões de literais** (`oracle.ts` `ElementId`) — enum, não texto livre; nunca vão ao chat | **lacuna → WP3.1** — e é o **único eco do Oráculo que passa em D8 hoje** (enum) |
| 04 rec 7 — micro-comportamentos idle raros (cochilar, olhar decoração) | ver Palworld | **parcial** |
| 04 rec 8 — o pet **testemunha** a assombrada concluída ("essa estava te pesando, né?") | Fato 1: só toast | **já coberto por WP3.2**, com aceite novo |
| 04 rec 9 — memória curta no chat; humor alimenta FALA, nunca pontuação | `mood.ts` nunca pontua (teste); chat não recebe `moodLog` | **já coberto por WP3.1** (`mood` do check-in como enum) |
| 04 rec 10 — traço de nascimento visível em comportamento | `passives.ts` só regras de cuidado; HUD → 0 | **lacuna → C-V3** |
| 04 rec 13 — nunca segundo pet simultâneo | Um `evolutionStage`, um `soulmonMeta`; sem slots | **já faz** (regra de produto, não deste domínio) |
| 04 rec 15 — idade e aniversário; "estou com ele há 8 meses" | sem data de nascimento | **lacuna → C-V4** |
| 04 rec 16 — fusão/Ultra como horizonte explícito | `EvolutionPath.tsx`: nó `ultra` renderizado com tag `ZÊNITE`/`ZENITH` (`isUltraMode`) | **já faz** |

### GUIA B.5 / B.7 / I e Relatório 07 (o que ainda não apareceu acima)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| B.5 ⚠️ — com memória e personalidade o chat fica mais convincente: **disclaimer + ponte (CVV 188)** acompanham V-1 | NÃO ENCONTRADO | **C-V2** — condição de saída do WP3.1 |
| B.7 / 07 §4 — **deduplicar Web Push × FCM por saveId** | `push-scheduler.js` `drainPrefix('push:')` e `drainPrefix('fcm:')` sequenciais; chaves `push:${hashEndpoint}`/`fcm:${hashToken}`; nenhum saveId na inscrição (`subscribe.js` grava `petName`, `language`, `refreshedAt`) | **já coberto por WP3.4** |
| B.7 / 07 §4 — win-back D5–7 "guardou uma surpresa" **e entregar**; D14 último; depois silêncio | Worker não lê o save (`C-presenca.md`); `welcomeBack` nasce em `dailyReset.ts` no cliente | **já coberto por WP3.4** (mensagens) · a **entrega** é do cliente na virada (constância) — ver "Cruzamentos" |
| B.7 R-3 — auditoria de copy contra a régua, EN + PT | `_pushCopy.js` PT/EN nos três; `NotificationManager.tsx` 20h PT/EN; **widget só EN** (fato 5); `notifications.ts` "⏰ Lembrete de Atividade!" (genérico, em nome do app) | **parcial** → **WP3.4** + **C-V5** |
| B.7 / 07 §4 — push diário com **1 fato do dia** | Worker não tem o save; só o cliente sabe (`completedSteps`) | **conflita com a arquitetura** — WP3.4 mantém a 20h no cliente por isso |
| B.7 R-14 — notificação rica com sprite (FCM) | `fcm.js` só título/corpo/tag | **lacuna** P2 (sem candidata: depende de URL pública do sprite — pendência de host do dono) |
| 07 §4 — máx. **1 push de campanha/dia** | Três agendados (10/16/22) + 20h + cocô (2×) + `poop-drain-warning` = até 7 num dia ruim | **conflita** — registrado; ver "Desacordos" (02 §4.3 habituação) |
| 07 §5 — widget: humor do pet dinâmico; **nunca estado negativo/culpado** | `WidgetRenderer.kt` `CHAT_FIXED_PHRASES`: "Don't forget about me today!" | **conflita com a tese** → **C-V5** |
| 07 §5 — `sleepReminderAt` "existente" | Fato 2: nunca chamado | **premissa caiu** → **C-V6** |
| 07 §2 — retorno após ausência: "tela de reencontro explícita + sonho/lembrança do período fora" | `DailyReportModal` `welcome` (sem lembrança do período) | **parcial** (R-6/V-5; WP2.7) |
| I.1.3 — o trabalho vira "estorvo entre o usuário e a notificação de conquista" | Idle "Vamos completar tarefas!"; widget "Let's tackle our tasks together?" — a voz do pet como lembrete de to-do | **conflita** → WP3.2 + C-V5 |
| I.2 — o Tamagotchi original perdia usuários pela dor | ver B3 | **já faz** |
| I.3.3 — celebração que faz **parar** | ver B5 (5) | **WP3.3** |
| I.3.4 — frogMak: **espécie, não personagem**; traços rígidos impedem projeção | `chat.js` `branch.trait/style` ("Creative, instinctive, full of chaotic energy…") + `maturity` são personalidade **fechada**; `aiSettings.tone` deixa o jogador ajustar | **conflita parcialmente** — não pede código; pede que o **WP3.1 não acrescente personalidade** (ver "Mudei de opinião") |
| 07 §8 — eixo *investimento* é o mais forte; protegê-lo é a razão do perdão | `bondLevelFor(totalXP)` nunca desce (invariante 1 de `bond.ts`) | **já faz** |

## Desacordos entre fontes (mostrados, não mediados)

1. **B1/Pew ("odiava: virou chore") × B3/Yokoi ("a dor do cuidado é o motor") × 02 §1.1
   ("responsabilidade percebida").** O guia (I.2) já arbitrou: necessidades sim, dor
   limitada. O que este destrinchado acrescenta: o **bipe** sobreviveu em texto — a cascata
   idle a cada 3 min que pede comida/banho sem teto de repetição é o mecanismo do Pew
   Moments, não o do Yokoi. Necessidade não é o problema; **insistência** é.
2. **B2/PBS 3 + Takayama 4 (vulnerabilidade e "pedir ajuda" engajam cuidado) × 02 §3
   (criatura sofrendo = vergonha, porque ela É a alma).** Não são contraditórios se a
   fronteira for esta: **pedir ajuda sem atribuir causa** (Tweenbot; `RUB_HINT` "faz
   carinho em mim") fortalece; **sofrer ligado ao que a pessoa não fez** (20h "está meio
   pra baixo" só quando a meta não foi cumprida) envergonha. A régua do WP3.2/3.4 é essa
   fronteira, não "nunca vulnerável".
3. **I.3.4/frogMak ("espécie, não personagem") × 02 §2 ("voz consistente e gentil,
   personalidade estável") × `chat.js` (BRANCH com traços fechados).** Resolução proposta:
   **voz** estável (tom, gentileza, maturidade) e **caráter** aberto (sem manias, sem gostos
   fixos, sem biografia). A memória do WP3.1 deve ser da **história compartilhada**
   (enum/inteiros), não autodescrição do pet.
4. **07 §4 ("máx. 1 push de campanha/dia", "diário com 1 fato do dia") × arquitetura (o
   worker não lê o save) × 02 §4.3 (push repetido → habituação).** Hoje são 3 fixos + 20h
   condicional. Nenhuma fonte pré-Mobbin sustenta três pushes diários em nome do pet; o
   `_pushCopy.js` sustenta por eliminação ("21h saiu"). Registro sem candidata: reduzir
   horários é decisão do dono (D-push), e o WP3.4 pode carregar a pergunta.
5. **02 rec 2 ("como VOCÊ está?") × NEVER do `chat.js` ("do not propose tasks… do not try
   to cheer them out of it").** Perguntar como a pessoa está é convite, não animação
   forçada; compatível. Mas em fala **idle** (sem gesto do usuário) "como você está?" a cada
   3 min vira interrogatório — o próprio `ChatBox.tsx` removeu "fez as tarefas?" por isso.
   Perguntar só em resposta a toque.

## WPs existentes × corpus pré-Mobbin

| WP | Sustenta | Contradiz | Indiferente | O que muda |
|---|---|---|---|---|
| **WP3.1** contexto + memória curta | 02 §1.3/§1.6/§2/rec 1; 04 §2/rec 3/rec 9; B2 Pentland (mimetismo → `mood` do check-in como enum); B.5 V-1 | I.3.4 (não acrescentar personalidade); 02 rec 17 + B.5 ⚠️ (memória sem disclaimer é irresponsável) | B1, B3 | (a) **eco do Oráculo por enum**: `dominantElement/Alignment/Realm` (`ElementId` é união de literais) entram como `ORIGIN:` — passa em D8 sem esperar a camada `soulGoal`; (b) **C-V2 vira condição de saída**; (c) aceite novo: o prompt **não** ganha linhas de caráter (traços, gostos, manias) — só história compartilhada em números |
| **WP3.2** voz nos momentos mudos + o pet olha | 02 §1.2/§2/rec 2/rec 8; 04 rec 7/rec 8; B5 (1)(2)(5); B2 responsividade; I.1.3 | B1/Pew + B3 chore (cadência: falar mais pode virar bipe) | — | (a) **aceite novo**: `triggerMessage` ganha consumidor ou é apagada — `grep -c "triggerMessage" src/components/CompanionHUD.tsx` ≥ 3 com um `useEffect`, e o `toast` do alívio sai do `App.tsx`; (b) **léxico de sofrimento** além do de medidor: nenhuma fala de HP baixo atribui causa nem descreve dor ("machucado", "pra baixo" só com pedido de ajuda estilo Tweenbot); (c) **cadência**: a cascata idle de pedido (`poop`/`food`) não repete antes de N min; (d) pose por `kind` (B5) |
| **WP3.3** pílula nome + título + micro-cerimônia | 02 rec 15; 04 rec 2 (Buddy); B5 (5); I.3.3; B.5 V-3 | Paired (Mobbin) — nenhuma barra | B1–B3 | (a) fato 4: `bond_level` já está no union — o aceite "emitido" tem de ser `grep "track('bond_level'" src/App.tsx`; (b) 04 rec 2 pede **um comportamento novo por marco** — proposta mínima: a partir de L6 (`Confidente`) o `saudar()` ganha uma linha extra própria do nível; sem número, sem barra |
| **WP3.4** push fonte única, dedup, win-back | 02 §3/§4.3/rec 10; 07 §4 (dedup, win-back com fim); B.7 R-2/R-3; B1/Maia 2 (barulho → volume importa) | 07 R-5 "entregar a surpresa" — o worker não pode; a entrega é do cliente na virada (constância) | B5 | (a) 20h `hp-critical-evening` condicionada à meta é o **desacordo 2** materializado — na fonte única, a versão "está meio pra baixo" **sai**; fica só a copy de espera; (b) carregar a pergunta D-push: 3 horários fixos × "1 campanha/dia" |
| **WP3.5** som de presença | B5 (1): áudio **sincronizado a gesto** lê como vivo | **B1/Maia 2 + B3 (2)**: bipe que chama atenção foi o que baniu o Tamagotchi | 02, 04 | Mantém `BLOQUEADO:D11`. Quando destravar, a spec herda a fronteira: som **só em resposta a gesto do usuário** (chegada, toque), nunca idle, nunca com `document.hidden`, 1× por sessão |
| **WP3.6** sombra de contato | B5 (2) linguagem corporal (fraco) | — | todo o corpus pré-Mobbin | Nada muda |
| **WP3.7** copy neutra por nome (VERIFICADO) | I.3.4 (neutralidade deixa projeção) | — | resto | Nada muda; o corpus confirma a decisão 2 |

## Cruzamentos (achados que pertencem a outro guarda, com o que este guarda precisa deles)

- **Constância (WP2.7 e afins)**: `needsIntervention` sem UI (fato 3) — quando ligar, a
  oferta vem por `speak()` do pet, nunca por modal do app (02 rec 12); `sleepReminderAt`
  sem chamador (fato 2) — a copy vai para `_pushCopy.js` (dono único) e é local ao
  cliente; win-back "entregar surpresa" (07 R-5) — só o cliente sabe `daysAway`, então a
  entrega mora em `computeDailyReset` junto de `welcomeBack`; modo pausa (02 rec 11/V-17) —
  a "carta na volta" é uma fala por `kind:'welcome'` do WP3.2.
- **Evolução**: rota de redenção (04 §1/V-4) NÃO ENCONTRADA; `soulGoal` na cerimônia
  (V-13) NÃO ENCONTRADO em `EvolutionPath.tsx`.
- **Jornada/StatsPage**: álbum com sprite e data (V-7), linha do tempo (02 rec 4) — hoje só
  `formNames` em frase.
- **HUD/medidores**: `hideMetrics` só no descanso (02 §4 ansiedade).

## Candidatas (não integradas — o consolidador decide depois da linha vermelha)

### C-V1 — Consumir (ou apagar) `triggerMessage`: a fala de alívio que nunca tocou
- **Fonte**: 02 §1.2, 04 rec 8, B5 (5); fato 1.
- **Spec**: PP. `CompanionHUD` ganha `useEffect` sobre `triggerMessage` que dispara
  `speak()` com a tabela `kind:'relief'` (PT/EN, sem "deveria/atrasou/falhou/finalmente";
  ex.: "Essa estava te pesando, né? Aliviou." / "That one was weighing on you, huh? Lighter now.").
  O `toast` do alívio em `App.tsx` **sai** (o pet absorve a notícia — caso Alan do Mobbin).
  Pode sair sozinha antes do WP3.2 ou como primeiro item dele; se o WP3.2 trocar
  `triggerMessage` por `speakSignal` tipado, a prop antiga é apagada no mesmo commit.
- **Aceite**: render test (`CompanionHUD.render.test.tsx` existe) incrementando
  `triggerMessage` e esperando o balão; `grep -c "assombrada" src/App.tsx` sem `toast`.
- **Comando**: `grep -A3 "triggerMessage" src/components/CompanionHUD.tsx | grep -q useEffect`.

### C-V2 — Disclaimer gentil + ponte de ajuda no chat (responsabilidade do canal ELIZA)
- **Fonte**: 02 §4.10, rec 17; B.5 ⚠️ ("duas obrigações que acompanham V-1"). NÃO ENCONTRADO.
- **Spec**: M, **gate `D-dono`** (texto de saúde mental é decisão do dono). (1) Uma linha
  fixa, discreta, na 1ª abertura do `ChatBox` por sessão: "Sou companhia, não tratamento."
  / "I'm company, not treatment." (2) Lista local mínima de léxico de sofrimento agudo
  (PT/EN) em `src/utils/chatSafety.ts`: mensagem que casa **não vai ao Groq** — resposta
  local fixa, na voz do pet, que fica ("Tô aqui.") e aponta a ponte (CVV 188 quando
  `language==='pt-BR'`; linha internacional quando EN). Nunca alarme, nunca push.
  (3) É **condição de saída do WP3.1**: memória sem isto aumenta a projeção sem a rede.
- **Aceite**: teste em `chatSafety.test.ts` provando que o léxico devolve resposta local e
  que `aiFetch` **não** é chamado; teste de que uma frase comum não casa (falso positivo
  zero para "matar a fome", "morrendo de rir").
- **Comando**: `grep -q "chatSafety" src/components/ChatBox.tsx && npx vitest run chatSafety`.

### C-V3 — Traço de nascimento visível na voz e no toque
- **Fonte**: 02 rec 8, 04 rec 10, B.5 V-6; `grep petPassive CompanionHUD.tsx` → 0.
- **Spec**: P. Sem arte nova. (1) Nas tabelas por `kind` do WP3.2, **uma** linha extra por
  traço em `feed` (Guloso), `rub` (Carinhoso), `hp-low` (Teimoso), `poop` (Madrugador),
  `dungeon` (Sortudo) — lida de `getPassive(gameState.petPassive)`; (2) no WP3.1, `TRAIT:`
  entra como **id do traço** (enum de 5 valores), nunca a descrição. Todos os traços já
  são positivos por teste — nenhuma fala pode inverter isso.
- **Aceite**: teste por traço provando frase distinta; teste de que save sem `petPassive`
  cai na tabela base; nenhuma frase contém número de regra ("1½", "10h").
- **Comando**: `grep -q "petPassive" src/components/CompanionHUD.tsx`.

### C-V4 — Nascimento e aniversário da criatura
- **Fonte**: 02 rec 7, 04 rec 15, B.5 V-8. NÃO ENCONTRADO campo de nascimento
  (`createdAt` é de `Task`).
- **Spec**: P. `soulmonMeta.bornOn` = `playerDayKey` do reveal (`playerDay.ts`, fuso fixo).
  Save antigo: **não inventar** — sem `bornOn` não há aniversário (nunca "0 dias juntos").
  Na virada (`computeDailyReset`), se `bornOn` faz mês/ano cheio → flag `anniversary:
  'month'|'year'` no `lastDayReport`; o HUD fala 1× (`kind:'anniversary'`, "Hoje faz um mês
  que a gente se conhece." / "It's been a month since we met."); `bond.ts` **não** ganha XP
  por isso (invariante: o Vínculo não pede ação nova). Sem push, sem número que desce.
- **Aceite**: teste de `computeDailyReset` com `bornOn` −1 mês → flag; sem `bornOn` → nada;
  teste de que `awardBondXP` não recebe evento novo.
- **Comando**: `grep -q "bornOn" src/contexts/GameStateContext.tsx src/utils/dailyReset.ts`.

### C-V5 — Frases do widget Android: PT/EN e sem cobrança
- **Fonte**: 07 §5 ("nunca estado negativo/culpado no widget"), 02 §1.7/§4.3, I.1.3,
  `CLAUDE.md` (idioma). Fato 5. Dono natural: quem cuida do Android; a **voz** é deste guarda.
- **Spec**: P. Remover "Don't forget about me today!", "Let's tackle our tasks together?",
  "Ready to evolve today?". Adicionar o par PT lido de `language` nos SharedPreferences
  (`DigiWidgetPlugin` já grava prefs). As frases vivem num JSON único
  (`src/utils/widgetPhrases.json`) copiado para `android/app/src/main/res/raw/` por script
  de build, com teste de paridade (mesmo padrão do `pushCopy.parity.test.js`) — regra
  copiada em Kotlin é o footgun 9 outra vez.
- **Aceite**: `! grep -q "Don't forget about me" android/.../WidgetRenderer.kt`; teste de
  paridade JSON × raw; nenhuma frase contém "task"/"tarefa"/"forget"/"esquece".
- **Comando**: `npx vitest run widgetPhrases.parity`.

### C-V6 — Ligar o lembrete de deitar (a única push de sono permitida)
- **Fonte**: `CLAUDE.md` 🛏️, B.7, 07 §4 (todos o listam como existente); fato 2. Dono:
  descanso/constância; canal: este guarda.
- **Spec**: P. `NotificationManager.tsx` calcula `sleepReminderAt(restWindow, now)` a cada
  poll de 60 s e dispara 1×/dia (`lastSleepReminderDate`), **só se** a janela estiver
  configurada e o pet não estiver dormindo. Copy em `_pushCopy.js` (`sleepCopy(name,
  language)`): "🌙 ${name} já tá bocejando" / "Se quiser, a gente deita daqui a pouco." —
  convite, sem hora impressa, sem "deveria".
- **Aceite**: teste do `NotificationManager` com janela 23:00 → notificação às 22:30 e
  nenhuma segunda no mesmo dia; `pushCopy.parity` cobre a copy nova.
- **Comando**: `grep -q "sleepReminderAt" src/components/NotificationManager.tsx`.

### C-V7 — Emitir `welcome_back` e `bond_level` (telemetria já declarada)
- **Fonte**: 07 §3 (eventos `welcome_back`, `bond_level`); fato 4. Pequena demais para WP
  próprio — cabe no WP3.3 (`bond_level`) e no WP2.7 (`welcome_back { bucket }`, nunca dias);
  listada só para o consolidador não a perder.
- **Comando**: `grep -q "track('bond_level'" src/App.tsx && grep -q "track('welcome_back'" src/App.tsx`.

## O que este guarda mudou de opinião

1. **Eu achava que o alívio da assombrada era "só um toast a mais"; é um comentário
   falso no código.** `App.tsx` afirma que o pet reage e a prop que faria isso está morta
   há tempo suficiente para o `CLAUDE.md` ter prometido "o pet olha" em cima dela. Não é
   lacuna de feature, é dívida de verdade — por isso C-V1 é PP e sai antes do WP3.2.
2. **Eu tratava "vulnerabilidade" e "sofrimento" como a mesma coisa a evitar.** B2
   (Tweenbot, robô de minas) mostra que pedir ajuda engaja cuidado; 02 §3 mostra que sofrer
   *por sua causa* envergonha. A fronteira é a **atribuição de causa**, e ela me obriga a
   defender o `RUB_HINT` ("faz carinho em mim") e a cortar a 20h ("está meio pra baixo"
   porque a meta não foi cumprida) — duas frases que eu punha na mesma gaveta.
3. **Eu queria "mais personalidade" no WP3.1; frogMak (I.3.4) me convenceu do contrário.**
   O `chat.js` já tem caráter fechado por galho. Memória boa é de história compartilhada
   (dias, evoluções, retorno, elemento do Oráculo como enum), não de "eu sou assim". Voz
   estável, caráter aberto.
4. **O bipe do Tamagotchi não morreu — virou texto.** Eu contava a cascata idle como
   "presença"; B1/B3 mostram que pedido repetido sem teto é o que transformou cuidado em
   chore. O WP3.2 precisa de cadência, não só de vocabulário.
5. **O WP3.5 estar bloqueado deixou de ser burocracia.** B1/Maia 2 é a única evidência do
   corpus inteiro sobre som, e ela é contra o som que chama. Se D11 destravar, a spec
   nasce com "só em resposta a gesto".
6. **Três pushes fixos por dia não têm sustentação no corpus** — só a história de terem
   sobrado depois de tirar o quarto. Não proponho cortar (é do dono), mas parei de
   defender o número como se fosse regra.
7. **Duas coisas que o projeto "tem" não existem** (`sleepReminderAt` push, intervenção
   "só 5 minutos") e os documentos que as prometem são os que eu citava como evidência.
   Regra que aprendi hoje: promessa em `CLAUDE.md`/guia só vale depois do `grep`.

## A frase que o pet diz hoje e que eu mudaria (com o motivo)

`NotificationManager.tsx`, 20h, `hp-critical-evening`: **"${petName} está meio pra baixo"**
— disparada **só quando `completedSteps < totalRequired`**. É o Tamagotchi de 1997 em
miniatura: o estado do bicho anunciado fora do app, e o gatilho é a meta que a pessoa não
cumpriu. Pela psicologia do relatório 02 (§3), criatura-alma sofrendo por algo que eu não
fiz produz vergonha, e vergonha motiva fuga (desinstalar), não reparação; pela B2
(Tweenbot), o que engaja cuidado é o pedido de ajuda **sem atribuição de causa**. Troca, na
fonte única do WP3.4: "🌙 ${name} está te esperando" / "Se quiser passar aqui antes de
dormir, ele adora." — e nenhuma condição sobre a meta: quem cumpriu e quem não cumpriu
recebem a mesma frase ou nenhuma. (A do HUD que eu mudaria continua sendo "Vamos completar
tarefas!", já registrada no Mobbin.)
