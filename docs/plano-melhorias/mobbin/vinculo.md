# Mobbin × Vínculo — Dossiês 5 e 10 contra o código (guarda-vínculo)

Fonte: `docs/guia-experiencia/09-mobbin-dossie.md` §1, §6 (Dossiê 5) e §11 (Dossiê 10).
Ledger: `docs/plano-melhorias/ledger/vinculo.md`. Anexo de fatos: `../C-presenca.md`.
Data: 02/09/2026. **Toda afirmação sobre o código abaixo foi confirmada por `grep`/leitura
nesta sessão; a referência é `arquivo` + SÍMBOLO (linha só como pista, envelhece).**

## 0. Limites do dossiê que valem para este domínio (§1)

- **Só iOS.** Nada do que segue diz respeito ao APK/FCM/AlarmManager.
- **O acervo fotografa telas em repouso.** Fala de pet (balão de 3–5 s), pulo de saudação
  (`isGreeting`, 800 ms), som — **tudo fora do levantamento por construção**. O Dossiê 5
  não tem nenhuma fala transcrita; o Dossiê 10 não tem nenhuma push. Onde o WP é sobre
  fala/push, o dossiê só serve de TOM, não de padrão de tela.
- **Dossiê 10 misturou re-login com win-back** (9 de 10 telas da 1ª busca eram login). A
  distinção é o achado: `Welcome back` é a mesma frase para dois momentos opostos.
- O que o dossiê **não** cobre e o guarda continua respondendo pela evidência antiga
  (relatórios 02/04 + transcrições B1–B5): memória do chat, som, push.

## 1. Dossiê 5 — Personagem como interface, achado a achado

| App · o que faz | O que o Soulmon faz hoje (confirmado) | Veredito |
|---|---|---|
| **BitePal** — pet fixo no topo, dados rolando por baixo; nome em bold junto do pet; estado em corações sem número; decoração sazonal | Arquitetura igual: `.sm-pet-sticky` (CLAUDE.md, UI) — pet fixo, lista rola. HP/energia no `HomeHud` (`src/components/pixel/HomeHud.tsx`, importado em `CompanionHUD.tsx`): ícone `favorite` + barra segmentada (`PixelSegmentedBar`), tom `viewport-danger` quando `hp <= 1`. **Nome do pet: NÃO há no HUD.** `soulmonDisplayName` (`src/utils/petName.ts`) é usado só em `App.tsx` → `PetPage` (`petName=`) e em `GameStateContext.tsx` (inscrição de push). O `<h1>Soulmon</h1>` no topo é marca, não nome (comentário no próprio `CompanionHUD.tsx`, bloco do `HomeHud`) | Arquitetura: **igual ao PADRÃO**. Nome: **LACUNA** — a convergência (b) do dossiê ("nome imediatamente abaixo ou acima do personagem, nunca longe") não é cumprida; o nome que o jogador deu vive numa página secundária. Corações que descem: o Soulmon já mitigou (teto 1/dia, perdão ≥2 dias) — o medidor desce, mas a regra impede o "acusatório" |
| **Finch** — pet narra em 3ª pessoa ("Lee is growing up"); coração flutuante como estado; meta em linguagem natural que só sobe | Fala é em 1ª pessoa (`speak()`; prompt idle `[ALEATÓRIO] Diga algo espontâneo em primeira pessoa como ${p.currentStage}`, `CompanionHUD.tsx` idle). Estado por sinal sem texto: `showHug` (balão 🤗 com rabinho) após comida/banho; `rubHearts`. Progresso de Vínculo só em `StatsPage.tsx` (`bondProgress`, `bondTitle`) | 1ª pessoa é escolha deliberada (efeito ELIZA, vínculo direto) — **mantém**. O par "coração flutuante + hug" já é o vocabulário sem texto. O que falta é o progresso de Vínculo perto do pet (WP3.3) |
| **Tolan** — tela inteira à criatura; chrome de 3 ícones nus; sombra de contato; partículas; **zero texto** | Ícones nus já são regra do dono (CLAUDE.md, UI). **Sombra de contato: NÃO ENCONTRADA** — `grep "ellipse|pet-shadow|radial-gradient.*shadow"` em `CompanionHUD.tsx` e `index.css` devolve nada; em `index.css` só existem `@keyframes sm2-pet-blink` e `sm2-pet-greet` | Referência de presença, não de arquitetura (o próprio dossiê diz). A sombra é a **convergência (a) do dossiê (5 apps)** e é a única invariante ausente — candidato sem número, §4 |
| **Abode** — 2 medidores que descem + 3 botões de ação por cor; ícone sem rótulo | Ações do pet já são ícones nus de 42 px (CLAUDE.md, UI). Medidores: ver BitePal | Medidores decrescentes = ANTI-PADRÃO que o Soulmon já domesticou por regra, não por UI. Nada a fazer |
| **Alan** — mascote reaparece em 3 slots; **mascote dentro do card de erro** | Recusa de comida e teto de carinho já são FALA do pet (`fullSignal`, `healCapSignal` → `speak`), não toast de sistema. Alívio da assombrada é **toast** do `App.tsx` (`isHaunted(task, …)` → `toast(...)`), não fala | O caso Alan ("o personagem absorve a má notícia") é o que WP3.2 faz para `task`/`haunted`: mover o alívio do toast para a boca do pet |
| **Yazio** — balão com **cauda** apontando para o personagem; nome próprio na 1ª fala | Balão de `speak` **tem rabinho** (`CompanionHUD.tsx`, "Rabinho apontando para BAIXO, na direção do pet"). O chat recebe `petName: currentStage` (= `getStageNameById(gameState.evolutionStage)`, `App.tsx` `getCurrentStageName`), **não** `soulmonDisplayName`. O prompt diz `You are ${petName}` (`chat.js` `buildSystemPrompt`) | Cauda: **PADRÃO cumprido**. Nome: **LACUNA** — a persona do chat se apresenta pela ESPÉCIE, não pelo nome que o jogador deu. É o oposto do "Nice to meet you, Alex": o batismo (`soulmonMeta.petName`) não chega ao canal onde mais importa (WP3.1, §3) |
| **Ahead** — adereço como estado; barra de XP com marcadores que só cresce | Estado idle é **texto** que cita mecânica: `getIdlePhrase` devolve "HP baixo..." / "My HP is low...", "Pouca energia...", "Vamos completar tarefas!" (`CompanionHUD.tsx`, cascata `hpRatio`/`ratio`) | O dossiê é explícito: "**nenhum app do dossiê escreve 'seu pet está feliz'**". O Soulmon escreve "HP baixo". WP3.2 deve incluir uma auditoria do léxico (§3) |
| **timespent** — dica escrita dentro da arte | Nada equivalente; falas são strings PT/EN | Risco evitado. Não replicar |
| **Replika** — **pílula de identidade**: nome em bold + relação (`Your Friend`) em cinza, centralizada no topo | `bondTitle` (`src/utils/bond.ts`) existe com par PT/EN ("Companheiro", "Confidente", "Alma Irmã", "Vínculo de uma Vida") e o comentário de `BOND_REWARDS` promete "aparece na home, sob o nome do pet". `grep bondTitle src/components/CompanionHUD.tsx` → **0**. Só `StatsPage.tsx` e `TournamentPage.tsx` | **É exatamente o formato para WP3.3** — e resolve as duas lacunas de uma vez: a pílula é `nome` + `título do Vínculo`. Hoje não há nem a linha de cima |
| **Any Distance** — mascote de canto, secundário | Não se aplica: o pet é a Home | — |

## 2. Dossiê 10 — Retorno depois de ausência, achado a achado

| App · o que faz | O que o Soulmon faz hoje (confirmado) | Veredito |
|---|---|---|
| **Finch** — "It's okay to miss a day. The important thing is you're here today, cheep!" · cena com objeto tombado · e, três linhas abaixo, "Repair your 2 day streak? … FREE!" | `DailyReportModal.tsx`: `welcome = !!report.welcomeBack`; headline "Que saudade!" / "I missed you!"; nota "Você ficou ${report.daysAway} dias fora e seu Soulmon não perdeu nada esperando. Ele só estava com saudade. Comece de onde parou."; se `soulGoal`: "Lembra por que você começou: …". `welcomeBack`/`daysAway` nascem em `dailyReset.ts` (`wasAway = daysAway >= ABSENCE_FORGIVENESS_DAYS`) | Tom: **já é a linha 2 do Finch** (absolve, credita o presente). Diferença: o Soulmon **quantifica** (`${daysAway} dias`). O dossiê fecha: "para o Soulmon, quantificar é criar uma consequência para depois anunciar que ela não existe". A metade inferior do Finch (reparo) **não existe aqui** — e `onRecoverHearts` (`DailyReportModal.tsx`, "Só faz sentido oferecer quando houve cobrança") deve continuar NUNCA aparecendo no modo `welcome` (ausência ≥2 dias não cobra) |
| **Runna** — duas formas legítimas de seguir, consequência declarada, "no problem, it happens!" | Sem equivalente na tela; a triagem (`triageQueue`) é o análogo mecânico, mas não é oferecida no retorno | Não adotar: o Soulmon não tem plano a reorganizar. O que vale é "zero menção ao que foi perdido" |
| **Todoist** — descanso configurado ANTES (`Days Off`, `Vacation Mode`) | Escudos automáticos (`applyMissedDay`) + perdão por ausência (`ABSENCE_FORGIVENESS_DAYS`) — **agem sem descoberta** | O dossiê diz que o modelo do Soulmon é **superior**. Nada a fazer |
| **Alma / Numo** — "Pause & preserve"; "You can skip a day without losing your streak"; mas "Streak saves 0" e "don't stop!" | Sem streak que zera (regra travada por teste). Escudos existem mas **não são expostos no zero** | Manter invisível o estoque zerado. Não criar card de "escudos: 0" |
| **Lovi** — "Welcome back, Sunshine" · "You've been missed!" · "Let's start!" — **zero métrica, zero pedido** | HUD `saudar()` (`CompanionHUD.tsx`): "Você voltou!", "Oi! Senti sua falta.", "Que bom te ver!", "Oi oi! Tudo bem?" — limiar `10 * 60 * 1000` fixo; **não lê `daysAway`** | A saudação de 10 min já é Lovi (curta, afetiva, sem métrica). O problema não é o tom, é que **11 minutos e 3 semanas ouvem o mesmo** (WP2.7) |
| **Paired** — escudo automático, mas "0 days" três vezes e chama apagada | Não há zero exposto no retorno | "Mecânica generosa não compensa exibição punitiva" — é o alerta para WP3.3: uma barra de Vínculo em 0/75 sob o nome do pet no D1 é o Paired |
| **10B (re-login)** — DoorDash/Xbox/Wolt…: "Welcome back" administrativo | O Soulmon não tem tela de re-login com esse texto | Regra: o `Que saudade!` do relatório e o `Você voltou!` do HUD são o momento afetivo; nenhuma tela de conta pode usar a mesma frase |

## 3. Impacto por WP

### WP3.1 · Memória curta e contexto no chat — **spec MUDA (adendo)**
O dossiê não tem chat capturado; o impacto vem de Yazio/Replika/BitePal: **o personagem tem
nome próprio, e é o nome que o jogador conhece.** Confirmado: o chat recebe `petName:
currentStage` (espécie/estágio) em `CompanionHUD.tsx` (idle e `handlePetClick`), e
`buildSystemPrompt` abre com `You are ${petName}`. O batismo `soulmonMeta.petName` nunca chega.

Adendo à spec (item 0, antes do contexto numérico):
> **0. Identidade.** `CompanionHUD` recebe `displayName = soulmonDisplayName(gameState.soulmonMeta)` e
> envia `petName: displayName || currentStage` ao `/api/chat`. O prompt ganha uma linha
> `SPECIES: ${evolutionStage name}` separada de `You are ${petName}`. Aceite: teste em
> `chat.promptInjection.test.js` provando que um `petName` batizado aparece na 1ª linha e a
> espécie na linha `SPECIES`; `petName` continua `.slice(0, 40)` e passa por `_redact`? — **não**:
> `petName` é nome de criatura, não texto livre do usuário sobre a vida dele; mantém o corte de
> 40 e a sanitização atual. Não altera D8.

Os itens 1–3 da spec (contexto enum, memória de sessão, `soulGoal` só com D8) ficam como
estão. O contexto `daysAway: 0..3` continua **bucket**, nunca o número — Dossiê 10 reforça.

### WP3.2 · Voz nos momentos mudos — **spec MUDA (acréscimo de aceite)**
Dossiê 5, convergência (c): "nenhum app escreve 'seu pet está feliz'"; Ahead usa adereço,
Finch usa coração. Confirmado no código: `getIdlePhrase` diz "HP baixo..." / "My HP is low...",
"Pouca energia...", "Vamos completar tarefas!". Mecânica vazando para a boca do pet.

Acréscimo ao aceite:
> Nenhuma frase de `getIdlePhrase` nem das tabelas novas por `kind` contém `HP`, `%`, `energia`/
> `energy` como substantivo de medidor, nem `tarefa`/`task` como pedido. Substituições
> propostas — "HP baixo..." → "Tô meio quebradinho hoje." / "Feeling a bit fragile today.";
> "Pouca energia..." → "Tô devagarinho..." / "Running slow..."; "Vamos completar tarefas!" →
> "Tô por aqui, se quiser companhia." / "I'm around, if you want company."

A parte "o pet olha a assombrada" (classe CSS, sem texto) é **exatamente** o padrão Ahead
(estado por pose/adereço). Mantém. O alívio, hoje `toast(...)` em `App.tsx` (`isHaunted` →
`relief`), vira fala pelo `speakSignal` — é o caso Alan ("o personagem absorve a notícia").
Confirmado: `haunted` ainda tem **0 ocorrências** em `CompanionHUD.tsx`; a lista já renderiza o
estado (`TaskMeta.tsx`, `haunted && (...)`).

### WP3.3 · Título do Vínculo sob o nome — **spec MUDA (a lacuna é maior)**
A spec diz "mostra sob o nome" — mas **o nome não está no HUD** (§1, BitePal/Replika).
`soulmonDisplayName` só chega ao `PetPage`. Spec revisada:
> `CompanionHUD` recebe `displayName` (mesma prop do adendo WP3.1) e renderiza uma **pílula de
> identidade** (modelo Replika): linha 1 `displayName || currentStage` em bold; linha 2
> `bondTitle(bondLevelFor(totalXP), language)` em tom `muted`, **ausente no L1** (sem título
> ainda → só o nome; nunca "Nível 1"). Sem número, sem barra de progresso na Home — a barra fica
> no `StatsPage` (alerta Paired: barra em 0/75 sob o nome no D1 é o zero exposto). A pílula fica
> **junto do pet** (convergência (b)), não no `<h1>` do `App.tsx`. Ao subir de nível: fala dedicada
> por `speak()` + `bond_level { level }` — o union `TelemetryEvent` (`src/utils/telemetry.ts`)
> hoje **não** tem `bond_level` nem `welcome_back`; entram lá. Aceite: `grep -q "bondTitle"
> src/components/CompanionHUD.tsx` **e** `grep -q "soulmonDisplayName" src/components/CompanionHUD.tsx`;
> render test (`CompanionHUD.render.test.tsx` já existe) com `totalXP=0` provando que a 2ª linha
> não é renderizada. Corrigir o comentário de `BOND_REWARDS` só depois de existir.

### WP3.4 · Push: fonte única + win-back — **spec MUDA (copy do win-back + 20h)**
O dossiê não captura push (limite 5 do §1); o impacto é de TOM (Lovi + Finch linha 2).
Confirmado: `_pushCopy.js` é dono declarado; `NotificationManager.tsx` reimplementa as três
copies (10h/16h/22h) e tem uma **exclusiva das 20h** (`hp-critical-evening` / `evening-reminder`),
disparada só quando `completedSteps < totalRequired` — **a mesma condição do nudge das 21h que
foi removido, uma hora antes**, com o corpo "Marque o que você fez hoje e dê uma comidinha pra
ele — energia cheia fecha o dia perfeito." Não é culpa, mas é diretiva sobre meta não cumprida.

Acréscimos à spec:
> 1b. As copies das 20h **também** passam a viver em `_pushCopy.js` (`eveningCopy(hpLow, name,
> language)`), para o teste de paridade cobri-las. Reescrever `evening-reminder` sem a cláusula
> de meta: "🌙 ${name} está te esperando" / "Se quiser passar aqui antes de dormir, ele adora."
> A versão `hp-critical-evening` ("Se não der, amanhã ele ainda vai estar aqui.") já é Finch —
> mantém.
> 3b. Win-back, duas mensagens, **sem número de dias** (Lovi): D5–7 "${name} guardou tudo como
> estava. Sem pressa." / "${name} kept everything as it was. No rush."; D14–16 "${name} ainda
> tá por aqui. Quando quiser." / "${name} is still around. Whenever you want." Depois, silêncio
> (regra do ledger). Nunca "senti sua falta esses N dias".

Aceite inalterado (paridade cliente×função×worker; scheduler com `refreshedAt` 3/6/15/40 →
0/1/1/0). `refreshedAt` confirmado em `subscribe.js` (`stale`/`REFRESH_AFTER_MS`).

### WP3.5 · Som de presença — **spec NÃO muda**
Nada no acervo sobre som (telas em repouso). Segue `BLOQUEADO:D11`. `grep playChirp
src/utils/sounds.ts` → 0, como antes.

### WP2.7 · Reencontro por dias (dono: guarda-constância) — **o que ele precisa saber**
1. **Silenciar o número.** Dossiê 10, convergência: "para o Soulmon, o eixo é Lovi + Todoist:
   silenciar a métrica". A nota atual do `DailyReportModal` imprime `${report.daysAway} dias`.
   Bucketizar (2–3 / 4–13 / 14+) **internamente** e nunca imprimir N. Copy proposta em §6.
2. **CTA orientado ao futuro.** Todos os apps do 10A usam "Start"/"Let's start"/"keep moving";
   nenhum "recupere". "Comece de onde parou" está no lado certo; "Começa por onde quiser" é
   ainda mais Lovi.
3. **A metade inferior do Finch não pode nascer.** `onRecoverHearts` (`DailyReportModal.tsx`)
   nunca no modo `welcome` — ausência ≥2 dias não cobra, logo não há o que reparar. Teste.
4. **O HUD não lê `daysAway`** (confirmado: `saudar()` só usa `ultimaSaudacaoRef` e 10 min). A
   prop entra do `lastDayReport`; a fala por bucket é a de §6, **sem N e sem "ficou por fazer"**.
5. Emitir `welcome_back { bucket }` (não `days`) — e o union de telemetria precisa ganhar o
   evento (hoje não tem).

## 4. Candidatos SEM número (só lacuna real)

**Sombra de contato sob o sprite** — Dossiê 5, convergência (a): Finch, Yazio, Abode, Tolan,
BitePal. Não encontrada no `CompanionHUD.tsx`/`index.css` (§1, Tolan).
- Spec: elipse `radial-gradient` em `index.css` (fim do arquivo, footgun 1), posicionada em
  `GROUND_Y` (`src/utils/petStage.ts`), sob o sprite, escala com o estágio; some quando
  `isSleeping`? — **não**: dormindo também pousa. Encolhe no `sm2-pet-greet` (pulo).
- Aceite: render test provando o nó da sombra; screenshot Playwright antes/depois; respeita
  `reducedMotion` (sem animação, sombra estática).
- Comando: `grep -q "sm2-pet-shadow" src/index.css src/components/CompanionHUD.tsx`.
- Tamanho PP. Dono natural: quem cuida do palco; o guarda-vínculo só registra porque é a
  única invariante de presença ausente.

**Léxico de fala sem mecânica** — poderia ser WP próprio, mas cabe no aceite do WP3.2 (§3).
Não abre WP.

**Nome do pet no HUD** — cabe em WP3.3 revisado. Não abre WP.

## 5. Anti-padrões dos meus dossiês, com a proibição citada

| Anti-padrão (app) | Copy literal | Proibição no Soulmon |
|---|---|---|
| Recorde como ameaça (Numo) | "It's your longest streak, don't stop!" | Ledger: bloco `NEVER` do `chat.js` — "Never mention … losing progress, streaks, deadlines"; CLAUDE.md: streak que zera desfaz a tese (teste travando) |
| Zero exposto no retorno (Paired ×3, Alma "Streak saves 0") | "0 days" · "0 day streak" · "Streak saves 0" | CLAUDE.md 🌱/🛏️: "nenhuma função devolve número que diminui"; §3 WP3.3 — sem barra de Vínculo sob o nome |
| Preço do perdão (Finch, metade inferior) | "Repair your 2 day streak?" · "1ST TIME OFFER" · "2,000 ~~riscado~~ FREE!" | Ledger: "monetização atravessando o afeto" quebra o vínculo; `onRecoverHearts` nunca em `welcome` |
| Medidor decrescente como acusação (Abode, BitePal) | corações vazios / barra a 60% | CLAUDE.md ❤️: teto 1/dia, `ABSENCE_FORGIVENESS_DAYS`, `WEEKLY_RELIEF_HEARTS` — o medidor desce, a regra impede a sentença |
| Métrica diária que zera na cara (Alan) | "600 berries today" | CLAUDE.md ⚡: energia zera todo dia **mas** é exibida como barra do estágio, não como número que amanhece em 0 |
| Estado escrito em texto ("seu pet está feliz") — nenhum app faz; o Soulmon faz | `getIdlePhrase`: "HP baixo..." | §3 WP3.2 |
| Cobrança no retorno / mesma tela para re-login e win-back (10B) | "Welcome back, Sam · Continue as…" | Ledger: "cobrança no retorno" veta; Dossiê 10: "desperdiça o único momento em que o tom importa" |
| Nudge condicionado à meta não cumprida (interno) | `NotificationManager.tsx` 20h, `completedSteps < totalRequired` | `_pushCopy.js` cabeçalho: "nada deve pedir uma quarta visita ao app, e cobrar tarefa na hora de dormir é o oposto de um companheiro" |

## 6. Copy lado a lado — quem acolhe no retorno

| Fonte | Copy literal |
|---|---|
| Finch (linha 2) | "It's okay to miss a day. The important thing is you're here today, cheep!" |
| Runna | "Looks like you missed a few workouts - no problem, it happens! … let's keep moving forward. You've got this!" |
| Lovi | "Welcome back, Sunshine" · "You've been missed!" · "Let's start!" |
| Numo (só a metade boa) | "You can skip a day without losing your streak" |
| Chase UK (10B, o único útil) | retoma cadastro incompleto sem mencionar o abandono |
| **Soulmon — `DailyReportModal.tsx` (`welcome`)** | "Que saudade!" / "I missed you!" · "Você ficou ${report.daysAway} dias fora e seu Soulmon não perdeu nada esperando. Ele só estava com saudade. Comece de onde parou." / "You were away ${report.daysAway} days and your Soulmon lost nothing waiting. It just missed you. Pick up where you left off." · (se `soulGoal`) "Lembra por que você começou: \"${soulGoal}\"." |
| **Soulmon — `CompanionHUD.tsx` `saudar()`** | "Você voltou!" · "Oi! Senti sua falta." · "Que bom te ver!" · "Oi oi! Tudo bem?" / "You came back!" · "Hi! I missed you." · "Good to see you!" · "Hey hey! How are you?" — o mesmo conjunto para 11 min e 3 semanas |

Leitura: o Soulmon **já está no tom do 10A** — absolve, credita o presente, não pede. As duas
diferenças são (1) o número de dias impresso e (2) o HUD não saber que houve ausência.

Proposta para WP2.7 (bucket interno, N nunca impresso):

| Bucket | `DailyReportModal` nota (PT / EN) | `saudar()` (PT / EN) |
|---|---|---|
| 2–3 dias | "Seu Soulmon guardou tudo como estava. Ele só estava com saudade. Começa por onde quiser." / "Your Soulmon kept everything as it was. It just missed you. Start wherever you like." | "Você voltou! Guardei tudo como estava." / "You're back! I kept everything as it was." |
| 4–13 dias | "Ficar um tempo fora é normal. O que importa é que você está aqui hoje — e seu Soulmon não perdeu nada esperando." / "Being away for a while is normal. What matters is you're here today — and your Soulmon lost nothing waiting." | "Senti saudade esses dias. Sem pressa." / "I missed you these days. No rush." |
| 14+ dias | "Que bom que você voltou. Nada foi perdido, e não tem nada pra pôr em dia. Começa por onde quiser." / "So glad you're back. Nothing was lost, and there's nothing to catch up on. Start wherever you like." | "Oi. Eu fiquei por aqui. Que bom te ver." / "Hi. I stayed right here. Good to see you." |

Nenhuma frase cita N, "ficou por fazer", tarefa, streak ou progresso.

## 7. Estado dos WPs depois deste dossiê

| WP | Estado | Mudou? |
|---|---|---|
| WP3.1 | `PROPOSTO` (camada `soulGoal`: `BLOQUEADO:D8`) | **Sim** — item 0 (nome batizado como persona) |
| WP3.2 | `PROPOSTO` | **Sim** — aceite de léxico sem mecânica; alívio da assombrada sai do toast |
| WP3.3 | `PROPOSTO` | **Sim** — pílula nome + título; nome não existe no HUD; sem barra na Home |
| WP3.4 | `PROPOSTO` | **Sim** — 20h entra na fonte única; win-back sem número |
| WP3.5 | `BLOQUEADO:D11` | Não |
| WP2.7 (guarda-constância) | — | Recomendação em §3/§6: bucket sem N; `onRecoverHearts` nunca em `welcome` |

## 8. A frase que o pet diz hoje e que eu mudaria

`getIdlePhrase` (`CompanionHUD.tsx`), energia entre 35% e 60%: **"Vamos completar tarefas!"** /
**"Let's complete tasks!"**.

É a única fala idle em que o pet **pede trabalho**. O apego nasce da contingência (o bicho
reage ao que você faz) e do ato de cuidar — não de o bicho virar lembrete de to-do. Aqui a
necessidade do pet (fome) é convertida em cobrança sobre a agenda do usuário, no exato tom
que o bloco `NEVER` proíbe no chat ("never a boss keeping score") e que a essência do
CLAUDE.md veta ("nunca um cobrador"). Pior: dispara sozinha, a cada 3 min, sem que a pessoa
tenha feito nada — não é reação, é solicitação. Troca: "Tô por aqui, se quiser companhia." /
"I'm around, if you want company." — mantém a presença, devolve a contingência ao usuário.
