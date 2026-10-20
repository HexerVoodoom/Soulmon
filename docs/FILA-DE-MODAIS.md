# Fila de modais — quem dispara o quê, e em que ordem (14/10/2026)

> **Pedido do dono (voz, 14/10/2026), bug real do beta-2:** "Tá dando bugs com esses modais novos, quando sobe de nível ou
> quando começa um dia novo. Às vezes sobrepõe um modal com o outro, trava e o fluxo todo quebra. Exemplo: começou um dia
> novo, subiu de nível, apareceu um modal de um mapa e o de se comprometer com as três tarefas, e quebrou tudo. Fechei o
> jogo, abri de novo, veio um modal, depois outro modal do mapa. Tem que ter uma ordem de prioridade para não haver
> sobreposição."
>
> Decisão: `REGISTRO-DE-DECISOES.md` §42. Código: `src/utils/presentationQueue.ts` (regra pura),
> `src/hooks/usePresentationQueue.ts` (liga ao React), `src/components/PresentationSlot.tsx` (moldura segura). Régua:
> `presentationQueue.test.ts`, `usePresentationQueue.test.tsx` (inclui o cenário exato do dono),
> `filaDeAvisos.contract.test.ts`.

## 1. A regra, em quatro linhas

1. **UM item visível por vez.** `pickPresentation(ready, current, failed)` devolve um id; o resto espera.
2. **Prioridade explícita** (`PRESENTATION_ORDER`, abaixo). Quando o atual fecha, entra o mais prioritário dos que esperam.
3. **Quem está na tela NÃO é expulso.** Antes, a cadeia `interstitial` era recalculada a cada render e um item mais
   prioritário que ficava pronto DEPOIS desmontava o que a pessoa lia (o resumo do dia perdia a página, o check-in perdia o
   que ela marcou). Agora o atual fica até fechar. Única exceção: o ocioso (`welcome`).
4. **Nada trava a fila.** Erro de render, chunk que não carrega (8 s) e fechamento que lança viram `fail(id)`: o item é
   pulado até a próxima abertura do app e o próximo entra. O voltar do Android fecha o item da tela pelo caminho "pular" do
   dono dele.

## 2. A ordem (do mais urgente ao mais leve)

> **Atualizada em 19/10/2026 (dono; REGISTRO §110/§111; D-64).** A tabela abaixo é a ordem VIGENTE; o §2b explica o início de dia (acordar, teto de 3, o que sai).

| # | id | O que é | Dono do "visto" (gravado AO MOSTRAR) | Fecha por |
|---|---|---|---|---|
| 1 | `welcomeTour` | tour do corvo (primeiro uso) | `STORAGE_KEYS.WELCOME_TOUR_SHOWN`, ao fechar (uma vez por aparelho; só quem nunca concluiu nada) | "Let's go" / Skip / Esc / voltar |
| 2 | `triage` | "Arrumar a pilha" — a ÚNICA aberta por toque | nada (o gesto é o pedido) | resolver / fechar / voltar |
| 3 | `nightmare` | pesadelo do dia (jogável) — a PRIMEIRA coisa depois de acordar o Soulmon, a qualquer hora (§149; só com noite registrada; espera a masmorra/missão; se acordou por conclusão, entra depois da celebração); NUNCA junto do sonho | `markNightmareFought` (a noite lutada) | "Bom dia" / voltar |
| 4 | `dream` | sonho da manhã (modal só entre 4h e 12h), NO LUGAR do pesadelo quando não há luta (a coleta do sonho acontece de qualquer jeito: fora da janela, ou com o pesadelo no slot, é coletado em silêncio no dex, sem modal; `dreamMode`) | o sonho é gravado ao sortear (`setMorningDream` após o updater da virada), não ao fechar | OK / voltar |
| 5 | `dailyReport` | resumo do dia: modal CENTRALIZADO "como foi ontem" + corações **+ o humor (5 carinhas, UMA vez, na mesma tela)**; depois a aventura ("From Yesterday's Adventure", com o NPC do scroll; o conteúdo é o `StrollFind`, a mesma peça da folha do Passeio, ligada ao scroll escolhido ontem — §66); depois "hoje" (só convite/memórias, quando houver) | `STORAGE_KEYS.DAILY_REPORT_SHOWN = report.date`, no `onShow`; `lastDayReport.heartsAnimSeen` marca a animação do coração | "Começar o dia" / ✕ / Esc / voltar |
| 6 | `buildingIntro` | NPC apresenta o prédio SÓ na PRIMEIRA ENTRADA nele (`visitarPredio`): tela cheia, `NpcSequence`. Nunca no level-up nem ao abrir o Mapa | `buildingIntrosSeen` (id do prédio), gravado na hora em que a intro abre; save antigo é semeado com os prédios já abertos (não reapresenta) | toque na última fala / Pular / Esc / voltar |
| 6b | `mapTutorial` | tutorial do mapa (`MapTutorial`, na `NpcSequence`): o corvo abre e cada área é uma fala do NPC dela, listando os prédios. SÓ na 1ª abertura do Mapa, depois do tour | `mapTutorialSeen` no SAVE, gravado ao MOSTRAR (REGISTRO §51; save antigo com progresso é semeado como visto) | toque na última fala / Pular / Esc / voltar |
| 7 | `catalogOnboarding` | "Add tasks to list" — escolher as primeiras metas (modal CENTRALIZADO; as sugestões nascem DESMARCADAS, §66) | `markCatalogOnboardingSeen`, ao confirmar (ritual com RESPOSTA) | confirmar (sem "pular", decisão C11) |
| 8 | `dayGoals` | **"HOJE" (REGISTRO §111): metas + compromisso num modal só.** Caixas desmarcadas com os hábitos/tarefas JÁ cadastrados que caem hoje; as TAREFAS marcadas viram o foco (até 3, ontem primeiro); a oferta reduzida de 5 minutos continua | `dayPlan` (save) e `lastCheckInDate`, gravados AO MOSTRAR (`{ day, offered, picked: [], confirmed: false }`) | Confirmar / "Hoje não, obrigado" / ✕ / Esc / voltar (sem confirmar = lista vazia + convite, não reabre no dia) |
| 8b | `checkIn` | `MorningCheckIn` — o compromisso SOZINHO, só quando não há "Hoje" (plano do dia já confirmado, save migrado): é UM modal com o 8, nunca os dois | `lastCheckInDate`, ao mostrar (ritual com RESPOSTA) | Definir / Pular / voltar |
| 9 | `levelUp` | `LevelUpOverlay` (+ "Now Open") — **celebração: DEPOIS do início de dia, só se sobrar vaga no teto de 3** | `lastCelebratedLevel` via `applyLevelUpCelebrated`, no `onShow` (restaura energia/HP 1×) | toque / voltar |
| 10 | `evolveTask` | `EvolveTaskModal` — "crie mais atividades" depois de evoluir (celebração, mesmo teto) | nada (derivado da evolução) | criar / fechar / voltar |
| 11 | `groveMilestone` | marco do Bosque da Guilda (celebração, mesmo teto) | `acknowledgeGroveMilestone` | toque / voltar |
| 12 | `catalogLevelInvite` | convite de subir/descer o nível de um hábito — **FORA do início de dia** | `lastCatalogLevelInviteDayKey` | aceitar / recusar / voltar (= recusar) |
| 13 | `restSetup` | horário de dormir (OBRIGATÓRIO, D-24: pronto enquanto `rest.windowConfirmed` ≠ true; sem X) — **FORA do início de dia**: aparece numa abertura sem nada dele | `handleConfirmRestWindow` | só "Confirmar" — voltar não fecha |
| 14 | `unlockToast` | BALÃO não bloqueante "<Prédio> desbloqueado em <local>" (vários do mesmo level-up num só), PT/EN; NÃO é sticky: qualquer modal pronto o substitui | o level-up (`lastCelebratedLevel`): os ids vêm de `buildingsUnlockedBetween(from, to)` do evento | toque / 6 s |
| 14b | `noticeToast` | BALÃO não bloqueante de aviso acionável (refeição, Refúgio, termos, triagem, recomeço; toque abre a folha de Avisos), PT/EN, 1× por dia cada, NÃO sticky | `soulmon-notice-toast-seen` (`<dia>|<chaves>`), gravado ao MOSTRAR | toque / 6 s |
| 15 | `welcome` | OCIOSO: instalar a PWA / pedir notificação; decide sozinho se tem algo a dizer; **não aparece no início de dia** (nem o priming de push do slot de avisos) | flags próprias | — |

### 2b. O INÍCIO DE DIA (19/10/2026, dono — REGISTRO §110 e §111; D-64/D-66/D-67/D-68)

1. **(0) Acordar o Soulmon — gesto, NÃO modal.** Na 1ª abertura de CADA dia, para todos, o pet aparece dormindo na Home e o botão "Acordar" do deck (1 toque, mudo) o acorda. É estado de APRESENTAÇÃO (`utils/dayWake.ts`, marca local `DAY_WOKE`): o sono real (`isSleeping`: dreno de coração, cocô, janela de descanso) NÃO muda, e "noite sem registro é neutra" continua. Até acordar, só as ações do PET e dos JOGOS param (aviso curto + atalho "Acordar"); concluir tarefa/hábito SEMPRE funciona (app, widget, desktop) e acorda sozinho.
2. Enquanto dorme à espera, a fila segura (`holdDayStart`) o início de dia, as celebrações e os convites; o que nasce de gesto (triagem, intro de prédio, mapa) e o onboarding passam.
3. **Acordou → (1) pesadelo OU sonho (nunca os dois) → (2) resumo de ontem COM o humor → (3) "Hoje" (`dayGoals` + `checkIn` fundidos).** TETO de 3 modais por abertura.
3b. **Pesadelo, regra de 20/10/2026 (§149, `utils/nightmareWake.ts`).** É a primeira coisa do dia do jogador, a QUALQUER hora (sem portão de relógio), e só com noite registrada no horário. Se o Soulmon acordou sozinho por concluir tarefa/hábito, o pesadelo entra DEPOIS da celebração, na próxima vez que a Home ficar livre (5 s depois, estando na Home): a conclusão nunca é interrompida. Soulmon na Masmorra ou em missão da guilda: o pesadelo espera ele voltar no mesmo dia; virou o dia, expira sem custo. Pode pular sem custo (HP, Bits e energia iguais). Dia 1, demo e onboarding incompleto: sem pesadelo. Dia de sonho bom usa o mesmo slot.
4. **Celebrações** (`levelUp`, `evolveTask`, `groveMilestone`) entram DEPOIS e só se sobrar vaga no teto; senão ficam para a próxima abertura (nada é perdido: cada uma só marca "visto" ao ser MOSTRADA).
5. **Convites e configuração** (`catalogLevelInvite`, `restSetup`, o priming de push, o `welcome` ocioso) SAEM do início de dia: só numa abertura em que nada do início de dia/celebração foi mostrado nem está pronto.

Dependências por ordem: a escolha de metas espera o resumo do dia; o "Hoje" (`dayGoals`) espera o resumo e o mapa (só abre depois de o resumo ter sido visto: `DAILY_REPORT_SHOWN`) e já inclui o compromisso; o modal "crie mais atividades" só depois da cerimônia de evolução
(`evolutionCeremony === null` está no "pronto" dele). As regras do início de dia (acordar, teto, pesadelo × sonho, "Hoje" único, convites fora) são PURAS em `utils/presentationQueue.ts` e testadas em `presentationQueue.test.ts`.

> **Onboarding (§81, 15/10/2026):** a fila é INERTE enquanto `!hasCompletedOnboarding` (`readyFor(demo || !hasCompletedOnboarding, ...)` em `App.tsx`). A Ambra, o ovo, o modal de compra e a confirmação da demo são do `SoulmonOnboarding` (nascem de gesto ou de passo do ritual), e a fila não grava "visto" nem toma o voltar por item que não aparece.

## 3. Persistência (o bug "abri de novo e vieram dois modais do mapa")

* **Regra:** o evento é marcado como VISTO **ao ser mostrado** (`onShow` da fila, uma vez por entrada na tela), não ao
  fechar. Fechar o app no meio não faz o mesmo evento voltar.
* **Antes:** `buildingIntrosSeen` só era gravado em "Depois"/"Ir lá"; `DAILY_REPORT_SHOWN` só em `handleCloseDailyReport`;
  `lastCelebratedLevel` só no toque do overlay. Fechar o jogo com o relatório ou o mapa abertos devolvia tudo na abertura
  seguinte — e com vários prédios pendentes vinham um modal por prédio.
* **O que foi mostrado mora num instantâneo** (`levelUpShown`, `introShown`, `unlockToastIds`): a marca de "visto" faz o evento de origem
  sumir, e o item que está na tela não pode sumir junto.
* **Evento que NÃO chegou à tela** fica pendente e volta uma única vez — quando for mostrado, ganha a marca.
* **Rituais com RESPOSTA** (`catalogOnboarding`, `checkIn`) seguem pendentes até a resposta: não são "avisos", são o
  compromisso em si (o check-in é no máximo 1×/dia por `lastCheckInDate`, gravada ao MOSTRAR). O item `checkIn` só depende de `MORNING_COMMITMENT_ENABLED` (§53), não de `CHECKINS_ENABLED`.
* **Campo novo no save desde o §66:** `dayPlan` (o contador do `fuzz2` foi a 134); antes disso a fila não persistia nada. A fila em si não persiste nada.
* **Custo aceito:** o app morto no instante em que o item entrou na tela perde aquele item (era a troca pedida: nunca
  repetir). O resumo do dia não se perde de verdade: os números ficam em `lastDayReport` e na tela de Evolução.

## 4. O que NÃO está na fila, e por quê

| Superfície | Quem dispara | Por que fica de fora |
|---|---|---|
| `EvolutionCeremony` (z 500) | `setEvolutionCeremony` (gesto de evoluir) | acompanha o gesto do usuário; nada mais está aberto quando ele evolui |
| `MilestoneCeremony` (z 300, marco de hábito) | conclusão de um hábito | idem; "comemorar depois não é comemorar" |
| `ProtectProgressModal` | `protectPrompt` | já espera a fila esvaziar (`interstitial === 'welcome'`), reativo |
| `UnlockAccountModal`, `RebirthModal`, `PostponeNudgeSheet`, `CheckInSheet`, `MissionsSheet`, `AvisosSheet`, `DungeonBusyModal` | toque do usuário | nasceram de um gesto; o usuário não consegue tocar sob um modal aberto |
| Drops da masmorra, cartão "enquanto você esteve fora" (`dungeonAway`) | dentro da tela da Masmorra | vivem NA tela dela (`DungeonGame`), nunca por cima da Home |
| `XpGainDisplay`, `Toaster`, `Celebration` (dia completo) | evento | não são diálogos: não pegam foco nem bloqueiam |
| Slot de avisos da Home (`avisos[]`: HP, incubação, semanal, triagem, termos…) | efeito | é a "fila 2" do manual 03 §3.2, que mostra só `avisos[0]` e não é modal |

## 5. Como acrescentar um item novo

1. Acrescente o id em `PRESENTATION_ORDER` na posição que a prioridade pede (e em `filaDeAvisos.contract.test.ts`).
2. No `App.tsx`: uma chave em `ready` do `usePresentationQueue`; o ramo de `onShow` (grave o "visto" aqui) e de `onDismiss`
   (o caminho de "voltar/pular"); o ponto de render `{interstitial === '<id>' && <PresentationSlot …>}`.
3. Declare a CLASSE dele em `utils/presentationQueue.ts` (REGISTRO §111): início de dia (`DAY_START_IDS`: entra depois de acordar e nunca é adiado pelo teto), celebração (`CELEBRATION_IDS`: só se sobrar vaga no teto de 3) ou convite/config (`INVITE_IDS`: fora do início de dia). Sem classe, ele vale como aviso de gesto (sempre elegível). Atualize `presentationQueue.test.ts`.
4. Nunca monte um modal da Home fora disso sem a justificativa da tabela da §4.

## 6. Intro de NPC / mapa (`NpcSequence`)

Componente genérico (`src/components/NpcSequence.tsx`): recebe `lines: {speaker, art, text}[]` e devolve `'done' | 'skip'`.
Dispara só na primeira entrada em cada prédio/NPC. Tela cheia, NPC grande (`min(135vw, 82dvh)`), janela de texto embaixo, SEM "continuar"/"depois"; toque em qualquer lugar
avança, na última fala o toque fecha, "Pular/Skip" no canto superior ESQUERDO (≥ 44 px, safe-area) encerra tudo; Enter/Espaço
avançam, Esc e o voltar do Android pulam. O `BuildingIntro` o usa; o tutorial do mapa (outra sessão,
`feat/dungeon-nv1-tutorial-mapa`) deve usá-lo também em vez de criar outro.

## 7. Nota: missão especial diária

O cartão "Especial do dia" (`SpecialMissionCard`) é inline na folha Missões, aba Diárias. Não é modal e não é item da fila. Sem "!", sem som, sem resgate (REGISTRO §106).
