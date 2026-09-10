# Referência — `src/components`

> **Dono:** doc-redator-referencia · **Data:** 09/09/2026 · **Estado:** rascunho
> **Verificação:** `npx vitest run src/docsManual.contract.test.ts` (item c — cobertura de referência) e a lista de `.test.tsx`/`.test.ts` citada em cada entrada.
> **Não cobre:** regra de negócio em profundidade (→ [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md)), fluxo de tela a tela (→ [03-FLUXO-DE-TELAS.md](../03-FLUXO-DE-TELAS.md)), identidade visual/tokens (→ [04-IDENTIDADE-VISUAL.md](../04-IDENTIDADE-VISUAL.md)).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

Uma entrada por módulo não-teste de `src/components` (91 módulos, `find src/components -type f \( -name '*.tsx' -o -name '*.ts' \) ! -name '*.test.ts*' | wc -l`, 09/09/2026) + `src/App.tsx` + `src/main.tsx` (orquestrador e ponto de entrada, fora da árvore `src/components` mas essenciais para achar quem chama cada componente). "Chamado por" é sempre `grep -rl` pelo nome do arquivo (import estático ou `lazy(() => import(...))`), não memória.

## Índice por página/família

- **Orquestração:** [`src/App.tsx`](#srcapptsx) · [`src/main.tsx`](#srcmaintsx) · [`ErrorBoundary.tsx`](#srccomponentserrorboundarytsx) · [`ContentModals.tsx`](#srccomponentscontentmodalstsx) · [`BottomNav.tsx`](#srccomponentsbottomnavtsx) · [`IntroScreen.tsx`](#srccomponentsintroscreentsx)
- **Home e pet:** [`CompanionHUD.tsx`](#srccomponentscompanionhudtsx) · [`CareSystem.tsx`](#srccomponentscaresystemtsx) · [`ChatBox.tsx`](#srccomponentschatboxtsx) · [`PetPage.tsx`](#srccomponentspetpagetsx) · [`PetStageDecor.tsx`](#srccomponentspetstagedecortsx) · [`PlayCard.tsx`](#srccomponentsplaycardtsx) · [`GamePopups.tsx`](#srccomponentsgamepopupstsx) · [`FirstTaskCompletedPopup.tsx`](#srccomponentsfirsttaskcompletedpopuptsx) · [`nestArt.ts`](#srccomponentsnestartts) · [`evolution/SoulNode.tsx`](#srccomponentsevolutionsoulnodetsx) · [`evolution/nodeArt.tsx`](#srccomponentsevolutionnodearttsx) · [`RestWindowCard.tsx`](#srccomponentsrestwindowcardtsx) · [`DreamDex.tsx`](#srccomponentsdreamdextsx) · [`AdventureDiary.tsx`](#srccomponentsadventurediarytsx) · [`MorningDream.tsx`](#srccomponentsmorningdreamtsx) · [`NightmareBattle.tsx`](#srccomponentsnightmarebattletsx) · [`StepsCard.tsx`](#srccomponentsstepscardtsx) · [`StepRow.tsx`](#srccomponentssteprowtsx)
- **Atividades e tarefas:** [`ActivitiesPage.tsx`](#srccomponentsactivitiespagetsx) · [`CreateModal.tsx`](#srccomponentscreatemodaltsx) · [`EditModal.tsx`](#srccomponentseditmodaltsx) · [`TaskEditModal.tsx`](#srccomponentstaskeditmodaltsx) · [`TaskMeta.tsx`](#srccomponentstaskmetatsx) · [`TriagePile.tsx`](#srccomponentstriagepiletsx) · [`QuickAddBar.tsx`](#srccomponentsquickaddbartsx) · [`EvolveTaskModal.tsx`](#srccomponentsevolvetaskmodaltsx) · [`HabitConstancy.tsx`](#srccomponentshabitconstancytsx) · [`MilestoneCeremony.tsx`](#srccomponentsmilestoneceremonytsx) · [`MorningCheckIn.tsx`](#srccomponentsmorningcheckintsx) · [`WeeklyReportCard.tsx`](#srccomponentsweeklyreportcardtsx) · [`FirstDayCard.tsx`](#srccomponentsfirstdaycardtsx)
- **Evolução:** [`EvolutionPath.tsx`](#srccomponentsevolutionpathtsx) · [`EvolutionCeremony.tsx`](#srccomponentsevolutionceremonytsx) · [`EvoTrail.tsx`](#srccomponentsevotrailtsx) · [`FormAlbum.tsx`](#srccomponentsformalbumtsx) · [`BestiaryCard.tsx`](#srccomponentsbestiarycardtsx) · [`RebirthModal.tsx`](#srccomponentsrebirthmodaltsx)
- **Jogos:** [`DungeonGame.tsx`](#srccomponentsdungeongametsx) · [`ArenaGame.tsx`](#srccomponentsarenagametsx) · [`DinoGame.tsx`](#srccomponentsdinogametsx) · [`RPSGame.tsx`](#srccomponentsrpsgametsx) · [`pixel/TimingBar.tsx`](#srccomponentspixeltimingbartsx)
- **Loja e economia:** [`ShopModal.tsx`](#srccomponentsshopmodaltsx) · [`ItemsWindow.tsx`](#srccomponentsitemswindowtsx) · [`CreditsModal.tsx`](#srccomponentscreditsmodaltsx) · [`UnlockAccountModal.tsx`](#srccomponentsunlockaccountmodaltsx)
- **Rituais e relatórios:** [`DailyReportModal.tsx`](#srccomponentsdailyreportmodaltsx) · [`MemoriesCard.tsx`](#srccomponentsmemoriescardtsx) · [`BalanceWeekModal.tsx`](#srccomponentsbalanceweekmodaltsx) · [`ProtectProgressModal.tsx`](#srccomponentsprotectprogressmodaltsx) · [`StatsPage.tsx`](#srccomponentsstatspagetsx) · [`BirthCard.tsx`](#srccomponentsbirthcardtsx)
- **Conta e configurações:** [`SettingsPage.tsx`](#srccomponentssettingspagetsx) · [`SettingsModal.tsx`](#srccomponentssettingsmodaltsx) · [`AccountSection.tsx`](#srccomponentsaccountsectiontsx) · [`AccountDataSection.tsx`](#srccomponentsaccountdatasectiontsx) · [`AISettingsModal.tsx`](#srccomponentsaisettingsmodaltsx) · [`NotificationManager.tsx`](#srccomponentsnotificationmanagertsx) · [`InstallPrompt.tsx`](#srccomponentsinstallprompttsx) · [`GuideModal.tsx`](#srccomponentsguidemodaltsx) · [`HelpModal.tsx`](#srccomponentshelpmodaltsx) · [`GameTutorialFlow.tsx`](#srccomponentsgametutorialflowtsx) · [`WelcomePromptModal.tsx`](#srccomponentswelcomeprompmodaltsx) · [`CityPicker.tsx`](#srccomponentscitypickertsx)
- **Onboarding e oráculo:** [`SoulmonOnboarding.tsx`](#srccomponentssoulmononboardingtsx) · [`OraclePage.tsx`](#srccomponentsoraclepagetsx) · [`SoulTestItem.tsx`](#srccomponentssoultestitemtsx) · [`AlignmentIcons.tsx`](#srccomponentsalignmenticonstsx) · [`PixelizerCard.tsx`](#srccomponentspixelizercardtsx) · [`NewReadingModal.tsx`](#srccomponentsnewreadingmodaltsx)
- **Comunidade:** [`LibraryPage.tsx`](#srccomponentslibrarypagetsx) · [`PlayerDetailModal.tsx`](#srccomponentsplayerdetailmodaltsx) · [`CoopPanel.tsx`](#srccomponentscooppaneltsx) · [`TournamentPage.tsx`](#srccomponentstournamentpagetsx)
- **Infraestrutura de UI:** [`ConfirmDialog.tsx`](#srccomponentsconfirmdialogtsx) · [`PixelFrame.tsx`](#srccomponentspixelframetsx) · [`figma/ImageWithFallback.tsx`](#srccomponentsfigmaimagewithfallbacktsx) · [`form/FormKit.tsx`](#srccomponentsformformkittsx) · [`pixel/HomeHud.tsx`](#srccomponentspixelhomehudtsx) · [`pixel/PixelKit.tsx`](#srccomponentspixelpixelkittsx) · [`pixel/RitualPanel.tsx`](#srccomponentspixelritualpaneltsx) · [`ui/Icon.tsx`](#srccomponentsuiicontsx) · [`ui/NavGlyphs.tsx`](#srccomponentsuinavglyphstsx) · [`ui/OfflineSeal.tsx`](#srccomponentsuiofflinesealtsx) · [`ui/ScreenSkeleton.tsx`](#srccomponentsuiscreenskeletontsx) · [`ui/Viewport.tsx`](#srccomponentsuiviewporttsx) · [`ui/sonner.tsx`](#srccomponentsuisonnertsx)

---

### `src/components/AISettingsModal.tsx`
**Dono de:** modal de personalidade do companheiro — tom, intensidade de emoji, estilo de motivação e "mais opções" (instruções livres + temperatura) atrás de `Disclosure`.
**Props principais:** `AISettingsModalProps` — `isOpen`, `onClose`, `currentSettings: AISettings`, `onSave(settings)`, `language?` (se ausente, lê `resolveLanguage`/`STORAGE_KEYS` via `readLocal`).
**Exports:** `Disclosure(children, título)` — revelação colapsável para o avançado · `SwitchRow` — linha de configuração com alvo = linha inteira · `ActionRow` — linha que leva a outro painel/guia/política · `AISettingsModal(props)` — o modal.
**Estado/efeitos relevantes:** `useState` local (`open`, `s: AISettings`); `useEffect` resseta `s` quando `currentSettings`/`isOpen` mudam. `onSave` é quem persiste (o modal não grava sozinho).
**Chamado por:** `src/App.tsx`, `src/components/ChatBox.tsx`, `src/components/SettingsModal.tsx`, `src/components/SettingsPage.tsx` (`grep -rl "from '.*/AISettingsModal'" src`, 09/09/2026).
**Régua:** `src/components/settingsTelemetry.render.test.tsx` (cobre a superfície de configurações, incluindo este modal).
**Avisos do arquivo:** número que o usuário não usa para decidir vira palavra (Previsível/Equilibrado/Criativo), não `0.85` — régua nº 2 do cabeçalho; instruções livres e criatividade são avançado, atrás de "Mais opções" — régua nº 3; uma ação dominante (Salvar).

### `src/components/AccountDataSection.tsx`
**Dono de:** seção "Seus dados" nas Configurações — exportar (levar embora) e apagar a conta, consumindo `functions/api/account.js`.
**Props principais:** `AccountDataSectionProps` — `language`, `saveId?` (injeção de teste; produção lê do localStorage), `authAvailable?` (injeção de teste).
**Exports:** `AccountDataSection(props)`.
**Estado/efeitos relevantes:** `useState` para as fases de exportação (`exportPhase`, `exportNote`, `notIncluded`, `exportFail`) e de exclusão (`deletePhase`, `pending`, `deleteFail`, `farewell`); `useRef`/`useEffect` só para limpar o timer de expiração da confirmação ao desmontar. Chama `requestExport`/`requestDelete`/`confirmDelete`/`downloadExport` de `src/utils/accountData.ts`.
**Chamado por:** `src/components/SettingsPage.tsx` (`grep -rl "from '.*/AccountDataSection'" src`, 09/09/2026).
**Régua:** `src/components/AccountDataSection.render.test.tsx`.
**Avisos do arquivo:** 503 é ESTADO (login ainda não existe), não erro — botão desabilitado com o motivo escrito antes do toque; o inventário do que apaga/minimiza/sobrevive vem ANTES da confirmação; `naoIncluido` aparece NA TELA, não só no arquivo exportado; voz sem "tem certeza?", sem culpa, sem cancelar destacado.

### `src/components/AccountSection.tsx`
**Dono de:** bloco "Conta & compras" dentro do grupo "Sua conta" da `SettingsPage` — sair da conta e restaurar compras.
**Props principais:** `AccountSectionProps` — `language`, `onEntitlementChange?(ent: Entitlement)`.
**Exports:** `AccountSection(props)`.
**Estado/efeitos relevantes:** `useState` (`ent`, `authEmail`, `restoring`, `message`); `useEffect` busca `fetchEntitlement` e `getCurrentEmail` ao montar. Chama `restorePurchases`/`isBillingAvailable` de `src/utils/playBilling.ts` e `signOut` de `src/utils/auth.ts`.
**Chamado por:** `src/components/SettingsPage.tsx` (`grep -rl "from '.*/AccountSection'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'AccountSection.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** "Restaurar compras" não é opcional — a Play exige restauração para compras não consumíveis, sem isso quem reinstala perde o que pagou; "Sair da conta" é ação comum, sem vermelho `#e0483e` cravado.

### `src/components/ActivitiesPage.tsx`
**Dono de:** hub de MINIJOGOS (Dungeon/Arena/Dino/RPS) — não é a lista de hábitos, apesar do nome. A Loja não é card daqui (é destino da `BottomNav`).
**Props principais:** não documentado por interface própria no topo do arquivo lido; recebe callbacks de jogo e dados de progresso (ver o corpo para a lista completa — arquivo de 299 linhas).
**Exports:** `ActivitiesPage(props)`.
**Estado/efeitos relevantes:** `useState<'dungeon' | 'arena' | 'dino' | 'rps' | null>` (`openGame`) controla qual minijogo está aberto sobre a página.
**Chamado por:** `src/App.tsx` via `lazy(() => import('./components/ActivitiesPage'))` (`grep -n "lazy(" src/App.tsx`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ActivitiesPage.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** rótulo nomeado no lugar do número de balanceamento (ex.: "Ranking" em vez de "Bits por inimigo + ranking"); sem PNG/Silkscreen — só o título da página é bitmap; nome de ícone fora do inventário de `tokens.md` renderiza vazio, sem erro.

### `src/components/AdventureDiary.tsx`
**Dono de:** diário de aventuras — o que a criatura trouxe, noite após noite; mora ao lado do Dex de Sonhos na página do pet.
**Props principais:** `AdventureDiaryProps` — `entries: {id, day}[]` (ordem de coleta), `language`.
**Exports:** `AdventureDiary(props)`.
**Estado/efeitos relevantes:** nenhum estado local — apresentação pura sobre `entries`; lê `findById` de `src/utils/adventure.ts` e `ADVENTURE_ART` de `src/utils/adventureArt.ts`.
**Chamado por:** `grep -rl "from '.*/AdventureDiary'" src` → só `src/components/AdventureDiary.render.test.tsx`; o consumo real é `src/App.tsx` via `lazy(() => import('./components/AdventureDiary'))` (09/09/2026).
**Régua:** `src/components/AdventureDiary.render.test.tsx`.
**Avisos do arquivo:** não mostra o que falta (sem silhueta do não coletado, ao contrário do Dex de Sonhos); não mostra raridade; não conta nem premia — a recompensa é a cena; mais recente primeiro.

### `src/components/AlignmentIcons.tsx`
**Dono de:** os três ícones geométricos de alinhamento do oráculo (Poder/Harmonia/Benevolência), com detalhe interno para não virarem emoji genérico.
**Props principais:** `AlignmentIconProps` — `size?`, `color?`, `strokeWidth?` (cada ícone aceita as três).
**Exports:** `PowerIcon(props)` — triângulo com triângulo menor concêntrico · `HarmonyIcon(props)` — círculo com espiral · `BenevolenceIcon(props)` — "Y" com ponto central.
**Estado/efeitos relevantes:** nenhum — três funções puras que devolvem `<svg>`.
**Chamado por:** `src/components/EvolutionPath.tsx`, `src/components/PlayerDetailModal.tsx` (`grep -rl "from '.*/AlignmentIcons'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'AlignmentIcons.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** nenhum.

### `src/components/ArenaGame.tsx`
**Dono de:** a Arena — cinco rodadas de combate contra criaturas do bestiário, anel de 17 elementos e a habilidade especial da ficha do jogador.
**Props principais:** `ArenaGameProps` (exportado).
**Exports:** `ArenaGameProps` (interface) · `ArenaGame(props)`.
**Estado/efeitos relevantes:** `useState` para `pool`, `fase`, `rodada`, `inimigos`, `hp`, `carga`, `eco`, `enfraquecidos`, `defensor`, `pontos`, `popup`, `sprites`; `useRef` (`popupTimer`); `useEffect` carrega sprites e limpa o timer do popup ao desmontar; `useCallback`/`useMemo` para `stats`, `mostrarPopup`, `montarRodada`, `comecar`, `abrirDefesa`, `limparRodada`, `atacar`, `defender`. Usa `TimingBar` (`src/components/pixel/TimingBar.tsx`) para a precisão do jogador (em vez de `sampleAcc()` do motor).
**Chamado por:** `src/components/ActivitiesPage.tsx` (`grep -rl "from '.*/ArenaGame'" src`, 09/09/2026).
**Régua:** `src/components/ArenaGame.render.test.tsx`; a ordem de turno é travada por `arena.test.ts` (motor puro `src/utils/arena.ts`, `simulateArenaRun`), que calibrou os especiais por 300+ runs/arquétipo (taxa de vitória 40–80%, dispersão ≤20pp).
**Avisos do arquivo:** ⚠️ a ordem de turno DEVE ser idêntica à de `simulateArenaRun` — trocar a sequência (eco → ação do jogador → revide de todo inimigo vivo → enfraquecimento da maldição) invalida o balanceamento sem ficar vermelho; a única diferença permitida é a origem da precisão (aqui vem da `TimingBar`, não de `sampleAcc()`); a Arena não cobra corações, não toca no cuidado do pet e não tem porta de entrada paga — perder custa só a run.

### `src/components/BalanceWeekModal.tsx`
**Dono de:** tela de confirmação de "Equilibrar minha semana" (P4) — mostra antes/depois de uma proposta de redistribuição e só aplica com confirmação explícita.
**Props principais:** `Props` — `open`, `onClose`, `language`, `atividades: {id,name,weekDays}[]` (só `Schedule.kind==='weekdays'`), `teto` (o `required` do estágio, decidido fora), e um handler que recebe só o que mudou.
**Exports:** `BalanceWeekModal(props)` · `default`.
**Estado/efeitos relevantes:** `useMemo` calcula `proposta` (via `equilibrarSemana` de `src/utils/weekBalance.ts`) e `nomePorId`; sem estado próprio — decisão de aplicar ou recusar vive no `App.tsx`.
**Chamado por:** `grep -rl "from '.*/BalanceWeekModal'" src` → `src/components/BalanceWeekModal.render.test.tsx`; consumo real em `src/App.tsx` via `lazy(() => import('./components/BalanceWeekModal'))` (09/09/2026).
**Régua:** `src/components/BalanceWeekModal.render.test.tsx`.
**Avisos do arquivo:** não é um planejador — é proposta pronta, aceita ou recusada; antes/depois mostrado antes de qualquer escrita; "Agora não" é saída de primeira classe; muda QUAIS dias, nunca QUANTOS; quando a carga não cabe em `7 × teto`, a tela diz explicitamente que não resolve, em vez de prometer alívio que não vem.

### `src/components/BestiaryCard.tsx`
**Dono de:** cartão "Os Encontros" — o bestiário coletado na masmorra, na aba Estatísticas, com silhueta para o que ainda não apareceu.
**Props principais:** `encountered: readonly string[]` (chaves `linha-tier` do save, só cresce), `language`.
**Exports:** `BestiaryCard(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — apresentação pura sobre `encountered`; usa `DUNGEON_LINE_SPRITES`/`DUNGEON_LINE_NAMES` de `src/utils/sprites.ts`.
**Chamado por:** `src/components/StatsPage.tsx` (`grep -rl "from '.*/BestiaryCard'" src`, 09/09/2026).
**Régua:** `src/components/BestiaryCard.render.test.tsx`.
**Avisos do arquivo:** ⚠️ `bestiary` era escrito no save de todo jogador desde 06/09/2026 e lido por ninguém — este cartão é o consumidor; não coletado = silhueta (nunca espaço vazio); contagem é de COLEÇÃO e só cresce, nunca percentual nem "faltam N".

### `src/components/BirthCard.tsx`
**Dono de:** o Cartão de Nascimento — mesma peça no reveal do onboarding e nas Estatísticas (a lembrança).
**Props principais:** `BirthCardProps` — `spriteUrl?`, `name`, `epithet?` (linha de essência do oráculo), `soulGoal?` (o que a pessoa escreveu no início), `bornAt?` (`YYYY-MM-DD`, dia do jogador), `language`.
**Exports:** `BirthCard(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — função `dataPorExtenso` interna converte `bornAt` em data por extenso sem ano numérico.
**Chamado por:** `src/components/SoulmonOnboarding.tsx`, `src/components/StatsPage.tsx` (`grep -rl "from '.*/BirthCard'" src`, 09/09/2026).
**Régua:** `src/components/BirthCard.render.test.tsx`.
**Avisos do arquivo:** nenhum número (nem dias, nem nível, nem contagem) — é certidão, não painel; nenhum verbo de personalidade fechada — diz DE ONDE a criatura veio, nunca COMO ela é; data por extenso, sem ano-mês-dia numérico.

### `src/components/BottomNav.tsx`
**Dono de:** navegação principal do app — teto de 4 destinos + menu sanduíche para o resto.
**Props principais:** `BottomNavProps` — `currentView: ViewType`, `onNavigate(view)`, `onResetOnboarding?`, `onOpenCredits?`, `language?`.
**Exports:** `BottomNav(props)`.
**Estado/efeitos relevantes:** `useState` (`menuOpen`); `useRef` (`menuBtnRef`); `useCallback` para `closeMenuAndFocus`, `onNavKeyDown`, `onMenuBlur`, `toggleMenu`, `closeMenu` (navegação por teclado e foco do menu sanduíche).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/BottomNav'" src`, 09/09/2026).
**Régua:** `src/components/BottomNav.render.test.tsx`.
**Avisos do arquivo:** os cinco glifos da nav são NOSSOS (`ui/NavGlyphs.tsx`), não Material — copiam a métrica dele (caixa 24dp) para conviver sem parecer adesivo; o eixo FILL é o sistema de estado (inativo `fill 0`, ativo `fill 1` + sublinhado de 3px — nunca placa/moldura/halo); rótulo em Rubik 12px (piso da escala tipográfica), não Silkscreen 8px (que fecharia contornos ilegíveis e hoje é reservada ao "aparelho").

### `src/components/CareSystem.tsx`
**Dono de:** o sprite flutuante de cocô/comida que aparece sobre o palco do pet quando um evento de cuidado está pendente.
**Props principais:** `CareSystemProps` — `careEvent: CareEvent | null`, `onCareEventComplete()`, `language?`.
**Exports:** `CareEvent` (interface: `type: 'poop'|'food'`, `requestTime`, `showSprite`) · `CareSystem(props)` · `scheduleCareEvents(lastResetDate, hasIncompleteTasks)`.
**Estado/efeitos relevantes:** componente sem estado próprio (`useState`/`useEffect` importados mas o corpo lido é só renderização condicional); posiciona o sprite sobre `GROUND_Y` (`src/utils/petStage.ts`).
**Chamado por:** `src/App.tsx`, `src/components/CompanionHUD.tsx`, `src/hooks/useCareSystem.ts` (`grep -rl "from '.*/CareSystem'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'CareSystem.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** ⚠️ `scheduleCareEvents` é código morto sem consumidor (`grep -rn "scheduleCareEvents" src` só acha a própria definição, 09/09/2026) e usa `new Date().toDateString()` — o dia do APARELHO, não `playerDayKey` — não reative sem migrar para `src/utils/playerDay.ts`; `getCareMessage` foi removida de propósito (era cobrança factualmente errada) e o comentário adverte para não recriá-la sem uma linha de contexto.

### `src/components/ChatBox.tsx`
**Dono de:** a caixa de chat do pet — texto e transcrição de voz via `/api/transcribe`, com contexto de jogo em inteiros (`chatContext`) e detecção de categoria de mensagem.
**Props principais:** `ChatBoxProps` — `petName`, `mood`, `evolutionStage`, `dominantBranch?`, `useAI`, `onSendMessage(response)`, `aiSettings?`, `onOpenAISettings?`, `language?`, `chatContext?` (`hp`/`energy`/`bond`/`daysAway`/`moodToday`, sempre inteiros — nunca texto, `soulGoal`/`soulStruggle` não passam por rota de IA), `onCreateActivity?`.
**Exports:** `ChatBox(props)`.
**Estado/efeitos relevantes:** `useState` para `inputValue`, `history` (só em memória — nunca save/localStorage), `isLoading`, `isRecording`, `mediaRecorder`, `micDisponivel`, `audioChunks`, `isInputReadOnly`, `randomName`; `useCallback` (`garantirConfig`) busca `fetchServerConfig`; chama `aiFetch` (`src/utils/aiClient.ts`) e `fetch('/api/transcribe')` para voz; usa `toast.warning`/`toast.error` (sonner) quando a IA cai para respostas locais; `chatSafetyDecision`/`detectMessageCategory` filtram a mensagem antes de enviar.
**Chamado por:** `src/components/CompanionHUD.tsx` (`grep -rl "from '.*/ChatBox'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ChatBox.*test.ts*'` vazio, 09/09/2026); o microfone/transcrição são cobertos indiretamente por `src/security/supabase.contract.test.ts`.
**Avisos do arquivo:** o histórico do chat mora só em `useState` de propósito — fechar o app apaga a conversa; `chatContext` é sempre inteiro, nunca texto (D8: `soulGoal`/`soulStruggle` não passam por IA).

### `src/components/CityPicker.tsx`
**Dono de:** busca de cidade de nascimento com fuso IANA, usada no oráculo/onboarding para o mapa astral.
**Props principais:** `CityPickerProps` — `value: City | null`, `onChange(city)`, `isPt`, `inputStyle`, `optionStyle(selected)`, `inputClass?`/`optionClass?` (classes do kit; a `OraclePage` não passa nada, fora da navegação).
**Exports:** `CityPicker(props)`.
**Estado/efeitos relevantes:** `useState` (`query`, `touched`); `useMemo` (`matches`) chama `searchCities` (`src/utils/soulProfile/cities.ts`) só depois do primeiro toque (`touched`).
**Chamado por:** `src/components/OraclePage.tsx`, `src/components/SoulmonOnboarding.tsx` (`grep -rl "from '.*/CityPicker'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'CityPicker.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** tabela embarcada, não geocoding de terceiro — mantém onboarding instantâneo, offline e sem enviar data de nascimento a serviço externo; erro de fuso desloca o Ascendente em ~15° (histórico de horário de verão real, não faixa por data).

### `src/components/CompanionHUD.tsx`
**Dono de:** a área do pet inteira — sprite, HUD do "aparelho" (visor pixel-art), gesto de esfregar, ações (comer/banho/dormir/item), fala, chat embutido e decoração do palco.
**Props principais:** `CompanionHUDProps` (arquivo lido, interface em torno da linha 124) — estado do pet (`healthPoints`, `energyLevel`, `evolutionStage`, `dominantBranch`, `currentXP`…), sinais que só crescem (`fullSignal`, `healCapSignal`, `speakSignal`, `daysAway`, `moodToday`, `hauntedWatching`), decoração (`equippedBackground`, `equippedDecor`, `trophies`), evolução manual (`onEvolve`, `canEvolve`, `onEvolveRequest`), cuidado (`careEvent`, `onFeed`, `onShower`, `onSleep`, `onPet`, `foodInventory`), chat (`useAI`, `aiSettings`, `onOpenAISettings`, `onCreateActivity`), `language`.
**Exports:** `PET_RENDER` (re-export de `src/utils/petStage.ts` — não redeclarado aqui, de propósito) · `CompanionHUD` (`const`, `memo(function CompanionHUD(...))`).
**Estado/efeitos relevantes:** 58 ocorrências de `useState`/`useEffect`/`useLayoutEffect`/`useCallback`/`useRef` no arquivo (`grep -cE '\b(useState|useEffect|useLayoutEffect|useCallback|useRef)\b' src/components/CompanionHUD.tsx`, 10/09/2026 — corrigido de "56" por doc-verificador); toca som via `playShower`/`playVisorTune`/`playPresence` (`src/utils/sounds.ts`); renderiza `CareSystem`, `ChatBox`, `PetStageDecor`, `HomeHud`, `Viewport` (com `useVarreduraDeSintonia`/`usePrefersReducedMotion`); usa `createPortal` para overlays.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/CompanionHUD'" src`, 09/09/2026).
**Régua:** `src/components/CompanionHUD.render.test.tsx`, `.cta.test.tsx`, `.reacao.render.test.tsx`, `.scanline.render.test.tsx`, `.sintonia-fade.render.test.tsx`, `.vinculo.render.test.tsx`, `.voz.render.test.tsx`; também tocado por `src/components/sintonia-chiado.render.test.tsx` e `src/components/som-presenca-d11.render.test.tsx`.
**Avisos do arquivo:** ⚠️ `digivolutionSegments*`/`requiredDays` SAÍRAM das props em 03/09/2026 — eram três fontes para o mesmo número, nenhuma lida; quem precisa do gate de evolução lê `FORM_REQUIREMENTS[…].required`; `PET_RENDER` não pode ser redeclarado aqui (footgun 9) — sempre importado de `utils/petStage.ts`; escala do sprite é sempre múltiplo inteiro de 128 (guard no teste de render — lado não múltiplo reabre borrão de pixel art).

### `src/components/ConfirmDialog.tsx`
**Dono de:** diálogo de confirmação genérico (ModalSheet), com variante `destructive` para ações que apagam algo de verdade.
**Props principais:** `ConfirmDialogProps` — `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmLabel?`, `cancelLabel?`, `language?` (padrão lê `resolveLanguage`/`STORAGE_KEYS.LANGUAGE`), `destructive?` (padrão `false`).
**Exports:** `ConfirmDialog(props)`.
**Estado/efeitos relevantes:** nenhum — apresentação pura sobre `ModalSheet` (`src/components/form/FormKit.tsx`); `destructive=true` troca o estilo do botão primário para `--sm2-danger-fill`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/ConfirmDialog'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ConfirmDialog.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** `destructive` só quando a ação destrói algo de verdade — vermelho de perigo gasta força quando enfeita confirmação inofensiva.

### `src/components/ContentModals.tsx`
**Dono de:** wrapper `lazy()`+`Suspense` do `GuideModal` — evita a tela apagar sem feedback ao carregar o guia num 3G.
**Props principais:** `ContentModalsProps` — `guideModalOpen`, `onCloseGuide()`, `language`.
**Exports:** `ContentModals(props)`.
**Estado/efeitos relevantes:** nenhum estado próprio; `lazy(() => import('./GuideModal'))` com `fallback={<ScreenSkeleton variant="overlay">}` em vez de `null`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/ContentModals'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ContentModals.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** o `fallback={null}` antigo apagava a tela por meio segundo durante o `lazy()` — trocado por `ScreenSkeleton`.

### `src/components/CoopPanel.tsx`
**Dono de:** modo cooperativo leve (Fase 4.3) — criar/entrar/sair de um grupo e fazer check-in coletivo, sem leaderboard entre membros.
**Props principais:** `CoopPanelProps` — `saveId`, `language`, `metaDoDiaCumprida` (autoriza o check-in individual — cada membro tem a própria meta).
**Exports:** `CoopPanel(props)`.
**Estado/efeitos relevantes:** `useState` (`group`, `erro`, `ocupado`, `nome`, `codigo`, `copiado`); `useEffect` carrega o grupo via `getCoop` ao montar; chama `createCoop`/`joinCoop`/`coopCheckin`/`leaveCoop` (`src/utils/community.ts`), que fala com `functions/api/community.js`.
**Chamado por:** `src/components/LibraryPage.tsx` (`grep -rl "from '.*/CoopPanel'" src`, 09/09/2026).
**Régua:** `src/components/CoopPanel.render.test.tsx`.
**Avisos do arquivo:** número mostrado é do GRUPO (`progress/target`), nunca de um membro — 31,3% relatam efeito psicológico negativo de comparação em leaderboard (`docs/PLANO-EVOLUCAO.md` item 4.2); por pessoa só existe "apareceu hoje: sim/não" (binário, não ordena); sair é um toque, sem confirmação nem penalidade, e a meta do grupo encolhe junto; sem push de cobrança quando alguém falta.

### `src/components/CreateModal.tsx`
**Dono de:** formulário de criação de hábito/tarefa — Quick-Add como caminho primário, formulário completo atrás de "mais opções".
**Props principais:** `CreateModalProps` — `isOpen`, `onClose`, `onSaveTask(data)` (nome, categoria, recorrência, esforço, passos…).
**Exports:** `HabitScheduleFields`, `HabitAnchorFields`, `CategoryChips`, `StrengthensLine`, `StepsFields`, `EffortFields` (blocos de campo reaproveitados por `EditModal`/`TaskEditModal`) · `CreateModal(props)`.
**Estado/efeitos relevantes:** `useState` (`gradeAberta`, `isSingleExecution`, `quickText`, `quickTokens`, `showForm`, entre outros); usa `useItemForm`/`useHabitSchedule` (`src/hooks/useItemForm.ts`); `parseQuickAdd`/`quickAddHint` (`src/utils/quickAdd.ts`) interpretam a linha digitada; renderiza `UnlockNudge` quando o cadastro esbarra no teto do modo demo.
**Chamado por:** `src/components/EditModal.tsx`, `src/components/TaskEditModal.tsx` (blocos de campo); consumo principal em `src/App.tsx` via `lazy(() => import('./components/CreateModal'))` (`grep -rl`/`grep -n "lazy("`, 09/09/2026).
**Régua:** `src/components/CreateModal.presets.render.test.tsx`.
**Avisos do arquivo:** Quick-Add e formulário completo abertos ao mesmo tempo eram a maior fonte de poluição visual do app — por isso o formulário fica atrás de "mais opções"; os blocos de campo são exportados porque há três usos reais (não abstração antecipada).

### `src/components/CreditsModal.tsx`
**Dono de:** modal da moeda Créditos (dinheiro real) — comprar pacote, assistir anúncio recompensado, reroll do oráculo.
**Props principais:** `CreditsModalProps` — `language`, `credits`, `accountTier: 'demo'|'paid'`, e (não totalmente listado no trecho lido) se há perfil de oráculo salvo.
**Exports:** `CreditsModal(props)`.
**Estado/efeitos relevantes:** `useState` (`busy`, `message`, `confirmingReroll`, `adsLeft`, `adsEnabled`); `useEffect` inicializa `adsEnabled`/`adsLeft`; usa `fetchEntitlement` (`src/utils/entitlements.ts`) e `isBillingAvailable` (`src/utils/playBilling.ts`); confirmação de reroll acontece NA LINHA, sem segundo modal.
**Chamado por:** `grep -rl "from '.*/CreditsModal'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/CreditsModal'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'CreditsModal.*test.ts*'` vazio, 09/09/2026); as fronteiras entre moedas são travadas em `src/utils/currencies.ts`.
**Avisos do arquivo:** Créditos usam só `Icon name="diamond"`, sem PNG/emoji de gem (as três moedas nunca se misturam visualmente); ícone nunca dentro de box; nenhuma roda de carregamento — botão ocupado diz que está trabalhando por texto.

### `src/components/DailyReportModal.tsx`
**Dono de:** o relatório do dia, mostrado uma vez na primeira abertura após a virada — resumo de cuidado, humor, aventura da noite e convite de desbloqueio no value moment.
**Props principais:** `DailyReportModalProps` — `report: GameState['lastDayReport']`, `adventure?` (achado da noite, vem PRONTO de fora — nunca `useState` local, senão reabrir o relatório sortearia um achado novo), `adventureIsNew?`, `onClose`, `language`, `soulGoal?`, `onRecoverHearts?`, `moodToday?`/`onPickMood?`/`moodNote?`, `showOffer?` (decisão de `src/utils/offerMoment.ts`, só o resultado chega aqui).
**Exports:** `DailyReportModal(props)`.
**Estado/efeitos relevantes:** usa `useDialogA11y` (`src/hooks/useDialogA11y.ts`); renderiza `MemoriesCard`, `UnlockNudge`; lê `MOOD_OPTIONS`/`MoodValue` de `src/utils/mood.ts` e `ADVENTURE_ART` de `src/utils/adventureArt.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/DailyReportModal'" src`, 09/09/2026). A relação com `MemoriesCard.tsx` é a INVERSA: é este arquivo que importa e renderiza `MemoriesCard` (ver Estado/efeitos acima), não o contrário — corrigido em 10/09/2026 por doc-verificador (`grep -n "MemoriesCard" src/components/DailyReportModal.tsx` mostra o import; `grep -n "DailyReportModal" src/components/MemoriesCard.tsx` não acha nada).
**Régua:** `src/components/DailyReportModal.aventura.render.test.tsx`.
**Avisos do arquivo:** o TOM não regride — nenhum vermelho, nenhum sinal de menos (cabeçalho do export principal); `adventure` chega pronto de fora de propósito, para não virar caça-níquel de reabertura; `showOffer` é só o resultado de uma decisão de ética que mora em `utils/offerMoment.ts`, a tela não decide.

### `src/components/DinoGame.tsx`
**Dono de:** o minijogo Dino Runner — o pet pulando obstáculos que sobem de tier (Bakemon→Tuskmon→Gigadramon→Titamon) conforme o tempo decorrido.
**Props principais:** não documentado por interface própria no trecho lido (arquivo de 293 linhas — ver props recebidas do `ActivitiesPage`).
**Exports:** `DinoGame(props)`.
**Estado/efeitos relevantes:** `useRef` para `canvasRef`, `scoreElRef`, `petImgRef`, `tierImgsRef`, `phaseRef`, o laço de física (`g`); `useState` (`phase`, `finalScore`, `earned`, `best` — lido de `STORAGE_KEYS.DINO_BEST` via `readNumber`); `useCallback` (`jump`); toca `playTaskComplete` (`src/utils/sounds.ts`); grava recorde com `writeLocal`.
**Chamado por:** `src/components/ActivitiesPage.tsx` (`grep -rl "from '.*/DinoGame'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'DinoGame.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** fronteira retrô interna ao arquivo — DENTRO do `<canvas>` é território diegético/retrô e não migra para o kit `--sm2-*`; FORA é chrome em Material Symbols; `expand_less` (não `arrow_upward`) no botão de pular porque `arrow_upward` não está no subset da fonte (`src/styles/tokens.md`) e renderizaria vazio.

### `src/components/DreamDex.tsx`
**Dono de:** a Dex de Sonhos — coleção de cenas noturnas colecionáveis, apresentação pura de `DREAM_CATALOG`.
**Props principais:** `DreamDexProps` (exportado) — recebe `RestState` e devolve a grade com `dexProgress`.
**Exports:** `DreamDexProps` (interface) · `DreamDex(props)` · `default`.
**Estado/efeitos relevantes:** nenhum estado — sem GameState, sem storage; lê `DREAM_CATALOG`/`DREAMS_BY_RARITY`/`dexProgress`/`Dream`/`DreamRarity` de `src/utils/restWindow.ts`; usa `DREAM_ART` (`src/utils/dreamArt.ts`, sprites próprios desde ago/2026, substituindo emoji do sistema).
**Chamado por:** `grep -rl "from '.*/DreamDex'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/DreamDex'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'DreamDex.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** o Dex só cresce — sonho não coletado é SILHUETA, nunca "faltando" nem vermelho nem contador de falta; as 30 cenas eram emoji do sistema até ago/2026, hoje são sprites próprios.

### `src/components/DungeonGame.tsx`
**Dono de:** o minijogo Masmorra — run de até 5 andares (`MAX_FLOORS`, declarado NESTE arquivo, não em `utils/dungeon.ts`), escada de 6 inimigos por andar, combate por `TimingBar`.
**Props principais:** `Popup` (interface interna) e as props recebidas do `ActivitiesPage` (não redeclaradas aqui em detalhe — arquivo de 569 linhas).
**Exports:** `DungeonGame(props)`.
**Estado/efeitos relevantes:** `useState` para `enemies`, `enemyIdx`, `enemyHp`, `playerHp`, `phase`, `popup`, `hitFx`, `rewardMsg`, `defendTimeLeft`, `baseLevel` (de `getDungeonDifficulty()`), `floor`, `best` (de `getDungeonBest()`), `runScore`, `runScenes` (de `buildRunScenes()`); `useRef`/`useCallback` (`after`, temporizadores); toca `playFeed` (`src/utils/sounds.ts`); chama `buildDungeonWave`, `recordDungeonScore`, `setDungeonDifficultyAtLeast`, `deepStartCost`/`canBuyDeepStart` de `src/utils/dungeon.ts`.
**Chamado por:** `src/components/ActivitiesPage.tsx` (`grep -rl "from '.*/DungeonGame'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'DungeonGame.*test.ts*'` vazio, 09/09/2026); a régua de tetos globais (Glitchtama, coraçãozinhos) vive nos testes de `src/utils/dungeon.ts`/`specialItemUse.ts`.
**Avisos do arquivo:** ⚠️ `MAX_FLOORS` mora AQUI, não em `utils/dungeon.ts` — achado na auditoria de 09/09/2026 (`CLAUDE.md`, linha ⚔️ Masmorra); sem limite diário e sem gate de entrada; perder custa só a run (nunca corações).

### `src/components/EditModal.tsx`
**Dono de:** modal de edição de hábito/tarefa aberto pelo botão principal da tela inicial — reusa os blocos de campo de `CreateModal`.
**Props principais:** `EditModalProps` — `isOpen`, `onClose`, `onSave(data)` (grava `weekDays` legado junto de `schedule` para widget Android/desktop lerem), `onDelete?`.
**Exports:** `EditModal(props)`.
**Estado/efeitos relevantes:** `useState` (`name`, `category`, `steps`, `alarmTime`); `useEffect` popula os campos ao abrir; usa `useHabitSchedule` (`src/hooks/useItemForm.ts`) e importa `CategoryChips`/`HabitAnchorFields`/`HabitScheduleFields`/`StepsFields` de `src/components/CreateModal.tsx`; renderiza `UnlockNudge` quando bate o teto de hábitos ativos do modo demo.
**Chamado por:** `grep -rl "from '.*/EditModal'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/EditModal'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'EditModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** ⚠️ (D-12) este é o modal do botão principal da tela inicial — era por onde o teto do modo grátis vazava (salvava sem checar cap); hoje mostra o mesmo convite (`UnlockNudge`) que o `CreateModal`, com as mesmas palavras, em vez de recusar em silêncio depois de a pessoa escrever tudo.

### `src/components/ErrorBoundary.tsx`
**Dono de:** boundary de erro de renderização do app inteiro — tela de fallback com o mascote e um botão de recarregar.
**Props principais:** `Props` (`children`), `State` (`hasError`, `error`).
**Exports:** `ErrorBoundary` (class).
**Estado/efeitos relevantes:** `getDerivedStateFromError`/`componentDidCatch` (loga só em `import.meta.env.DEV`); lê o idioma direto de `readLocal(STORAGE_KEYS.LANGUAGE)` porque é a única superfície que pode aparecer antes do app montar (não pode depender de contexto/provider).
**Chamado por:** `src/main.tsx` (`grep -rl "from '.*/ErrorBoundary'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ErrorBoundary.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** nenhum.

### `src/components/EvoTrail.tsx`
**Dono de:** a trilha de evolução resumida na Home (nós serpenteantes ao lado do painel de rituais) — atalho para a página de Evolução real.
**Props principais:** `EvoTrailProps` — `stages: CreatureStage[]`, `currentStageId`, `unlockedEvolutions?`, `branch: Attr` (já resolvido por quem chama, mesmo `resolveBranch` da página), `demoCharacterId?`, `onOpen()`, `language?`.
**Exports:** `EvoTrail(props)`.
**Estado/efeitos relevantes:** `useMemo` para `unlockedSet` e `trail`; sem regra de grafo própria (footgun 9) — reusa `SoulNode` e o galho resolvido de fora.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/EvoTrail'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'EvoTrail.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** é RESUMO, não a árvore — nenhuma regra do grafo mora aqui; medidas (`NODE`, `COL_W`, `STEP_Y`) apertadas de propósito para caber em viewport de 390px sem truncar rótulos nem cobrir o dock do chat.

### `src/components/EvolutionCeremony.tsx`
**Dono de:** a tela dedicada da cerimônia de evolução manual — sprites atual/próxima intercalando em velocidade progressiva sobre vídeo cósmico em loop.
**Props principais:** `EvolutionCeremonyProps` — `fromStage`, `toStage`, `toName`, `language`, `demoCharacterId?`, `onEvolved()` (commit da evolução no estado), `onClose()`.
**Exports:** `EvolutionCeremony(props)`.
**Estado/efeitos relevantes:** `useState` (`showNext`, `done`); `useRef` (`evolvedRef`); `useEffect` roda o `buildSchedule()` (intervalos decrescentes somando `TOTAL_MS`=3000ms) que alterna os sprites até estabilizar.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/EvolutionCeremony'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'EvolutionCeremony.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** ⚠️ o `CLAUDE.md` (seção "DUAS FILAS") registra que esta cerimônia (z-500) chegou a abrir junto do `EvolveTaskModal`, que reaparecia por baixo cobrando "crie mais atividades" quando ela fechava — achado na auditoria de 06/09/2026, corrigido pela fila de intersticiais declarada no `App.tsx`.

### `src/components/EvolutionPath.tsx`
**Dono de:** a página de Evolução — a árvore por galho, o cadeado `evolutionLocked`, a cerimônia manual, o spoiler-guard de formas futuras e o desempate por ritmo de cuidado.
**Props principais:** `EvolutionPathProps` (arquivo de 1179 linhas — `wc -l src/components/EvolutionPath.tsx`, 10/09/2026, corrigido de "1180" por doc-verificador; props cobrem estágio atual, galhos, `unlockedEvolutions`, sprites por forma, idioma e os callbacks de evolução/cadeado — ver o corpo a partir da interface).
**Exports:** `EvolutionPath(props)`.
**Estado/efeitos relevantes:** 11 ocorrências de `useState`/`useEffect`/`useRef`/`useMemo` (`grep -c`, 09/09/2026); usa `SoulNode`/`AlignmentIcons` para o desenho; `useVarreduraDeSintonia` mora em `ui/Viewport.tsx` (não duplicado aqui, de propósito); lê `canManualRetry`/`cardState`/`displaySprite` de `src/utils/spriteLibrary.ts` e `pointsToEvolve` de `src/utils/spriteTrigger.ts`.
**Chamado por:** `grep -rl "from '.*/EvolutionPath'" src` (testes próprios + `src/components/sintonia-chiado.render.test.tsx`); consumo real em `src/App.tsx` via `lazy(() => import('./components/EvolutionPath'))` (09/09/2026).
**Régua:** `.credencial.render.test.tsx`, `.estados.render.test.tsx`, `.scanline.render.test.tsx`, `.silhueta.render.test.tsx`, `.sintonia-anuncio.render.test.tsx`, `.sprite.render.test.tsx`; evolução manual travada por `src/components/evolucaoManual.contract.test.ts`.
**Avisos do arquivo:** progresso virou PALAVRA ("Faltam N dias completos"/"Pronto para evoluir"), a barra é só apoio visual; atributos usam UM desenho só (SVG inline de `AlignmentIcons`), não mais PNG pixel-art + SVG divergindo na mesma tela; situação de cada nó sempre dita em palavras no `aria-label` (WCAG 1.4.1 — cor/posição nunca é o único portador).

### `src/components/EvolveTaskModal.tsx`
**Dono de:** modal pós-evolução que pede para criar tarefas suficientes para garantir o próximo dia completo no novo estágio.
**Props principais:** `EvolveTaskModalProps` — `isOpen`, `onClose`, `onCreateTask()`, `requiredTasks`, `registeredTasks`, `stageName`, `language?`.
**Exports:** `EvolveTaskModal(props)`.
**Estado/efeitos relevantes:** nenhum — função pura de apresentação; calcula `hasEnough`/`missing` a partir das props.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/EvolveTaskModal'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'EvolveTaskModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** ver o aviso da fila em `EvolutionCeremony.tsx` acima — este modal já reapareceu por baixo da cerimônia, cobrando tarefas; hoje entra na fila de intersticiais declarada no `App.tsx`.

### `src/components/FirstDayCard.tsx`
**Dono de:** o cartão do primeiro dia (WP1.3) na Home — ensina os três gestos não-descobríveis (carinho, comida, marcar tarefa) sem virar checklist de cobrança.
**Props principais:** `FirstDayCardProps` — `progress: FirstDayProgress` (`src/utils/firstDay.ts`), `language`.
**Exports:** `FirstDayCard(props)` · `default`.
**Estado/efeitos relevantes:** nenhum estado próprio — apresentação pura sobre `progress`; usa `FIRST_DAY_GESTURES`/`shouldShowFirstDay` de `src/utils/firstDay.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/FirstDayCard'" src`, 09/09/2026).
**Régua:** `src/components/FirstDayCard.render.test.tsx`.
**Avisos do arquivo:** não dá prêmio (a reação da criatura é o produto); não abre modal nem intercepta nada; some sozinho na virada do dia mesmo incompleto — não vira lista de pendências.

### `src/components/FirstTaskCompletedPopup.tsx`
**Dono de:** popup de celebração da primeira tarefa concluída na vida do jogador.
**Props principais:** `FirstTaskCompletedPopupProps` — `isOpen`, `onClose()`, `language?`.
**Exports:** `FirstTaskCompletedPopup(props)`.
**Estado/efeitos relevantes:** nenhum — apresentação pura sobre `ModalSheet`.
**Chamado por:** `src/components/GamePopups.tsx` (`grep -rl "from '.*/FirstTaskCompletedPopup'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'FirstTaskCompletedPopup.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** uma frase e um botão — sem segunda frase explicativa (roubaria a comemoração) e sem X próprio (o `ModalSheet` já traz um acessível).

### `src/components/FormAlbum.tsx`
**Dono de:** o álbum das formas vividas (WP4.6/WP4.10) — cada forma alcançada com arte e data, o resto como silhueta.
**Props principais:** `AlbumForm` (interface exportada: `id`, `name`, `spriteUrl?`) · `FormAlbumProps` — `forms: readonly AlbumForm[]`, `reached: readonly string[]` (`unlockedEvolutions`), `reachedAt?: Record<string,string>` (WP4.10), `language`.
**Exports:** `AlbumForm` (interface) · `FormAlbum(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — apresentação pura; usa `collectedAt` de `src/utils/collectionDates.ts` para a data da primeira vez.
**Chamado por:** `src/components/StatsPage.tsx` (`grep -rl "from '.*/FormAlbum'" src`, 09/09/2026).
**Régua:** `src/components/FormAlbum.render.test.tsx`.
**Avisos do arquivo:** ausência é convite, nunca dívida — forma não alcançada é silhueta, sem "faltam N"; data é a PRIMEIRA vez e some quando não existe (save antigo sem data não é inventada); contagem de completude é de COLEÇÃO, só cresce.

### `src/components/GamePopups.tsx`
**Dono de:** wrapper que hospeda os popups de minijogo/marco — hoje só encaminha para `FirstTaskCompletedPopup`.
**Props principais:** `GamePopupsProps` — `showFirstTaskPopup`, `onCloseFirstTaskPopup()`, `language?`.
**Exports:** `GamePopups(props)`.
**Estado/efeitos relevantes:** nenhum — repassa props para `FirstTaskCompletedPopup`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/GamePopups'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'GamePopups.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** nenhum.

### `src/components/GameTutorialFlow.tsx`
**Dono de:** o segundo onboarding (depois do nascimento do oráculo) — duas telas: a promessa central e a criação obrigatória da 1ª atividade, com sugestões de tarefa por IA.
**Props principais:** `TutorialPage` (interface interna) · `GameTutorialFlowProps` (props do fluxo — objetivo, categorias, callback de conclusão).
**Exports:** `SHOP_AND_CURRENCY_PRIMER` (const — único assunto das 5 páginas removidas que o `GuideModal` ainda não cobre) · `GameTutorialFlow(props)`.
**Estado/efeitos relevantes:** `useState` (`step`, `goalText`, `selectedCats`, `suggestions`, `loading`, `searched`, `selected`); `useMemo` (`categoriasOrdenadas`, via `orderCategoriesForGoal`); chama `suggestTasks` (`src/utils/taskSuggestions.ts`, mesma API do chat — `functions/api/suggest-tasks.js`).
**Chamado por:** `grep -rl "from '.*/GameTutorialFlow'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/GameTutorialFlow'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'GameTutorialFlow.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** eram ~12 telas antes do primeiro toque (splash + 4 do demo + 6 conceituais + criação + `WelcomePromptModal`), reduzidas a 2 — as 5 páginas conceituais removidas já estavam ditas, melhor, no `GuideModal`/`HelpModal`; era o último consumidor de `lucide-react` do `src/` — migrado para `<Icon>`, guard `iconScale.contract.test.ts` acusa reimportação.

### `src/components/GuideModal.tsx`
**Dono de:** o Guia — 7 capítulos fechados por padrão, cada número vindo de uma constante (não de texto à mão).
**Props principais:** `GuideModalProps` — `isOpen`, `onClose()`, `language?`.
**Exports:** `GuideModal(props)`.
**Estado/efeitos relevantes:** `useState<string|null>` (`open`, qual capítulo está expandido); importa dezenas de constantes de regra (`FOOD_LIMIT_PER_HOUR`, `FORM_REQUIREMENTS`, `MAX_HEARTS_LOST_PER_DAY`, `HABIT_MILESTONES`, `CONSTANCY_WINDOW_DAYS`, `REST_SHIELD_MAX`, `DREAM_CATALOG` etc.) para os números do texto nunca serem hardcoded.
**Chamado por:** `grep -rl "from '.*/GuideModal'" src` → `src/components/ContentModals.tsx` (lazy) e `src/components/GuideModal.gateReal.render.test.tsx` (09/09/2026).
**Régua:** `src/components/GuideModal.gateReal.render.test.tsx`.
**Avisos do arquivo:** era 16 seções/~60 parágrafos, cortado para 7 capítulos fechados — a pergunta de corte foi "isto muda alguma decisão do jogador?"; todo número do texto vem de constante importada, nunca escrito à mão.

### `src/components/HabitConstancy.tsx`
**Dono de:** o indicador de constância de um hábito (grade "N das últimas 7", sem streak).
**Props principais:** `HabitConstancyProps` (exportado) — recebe `HabitRhythm`, `Schedule`, `language`.
**Exports:** `HabitConstancyProps` (interface) · `HabitConstancy(props)` · `default`.
**Estado/efeitos relevantes:** nenhum estado — apresentação pura sobre `constancy`/`habitTier`/`dayKeyOf`/`steadyWindow` de `src/utils/habitRhythm.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/HabitConstancy'" src`, 09/09/2026).
**Régua:** `src/components/HabitConstancy.hideMetrics.render.test.tsx`; também exercitado por `src/components/dailyList.sm2.render.test.tsx`.
**Avisos do arquivo:** sem streak de propósito — falha custa ~14% (1/7), não 100%; cada estado tem FORMA própria, não só cor (quadrado cheio=feito, losango=protegido, anel vazado=falta, traço=não devido); dia protegido por escudo conta como feito e usa a cor de destaque, nunca a de falta.

### `src/components/HelpModal.tsx`
**Dono de:** o glossário (HelpModal) — tradução curta de termos da interface, sem repetir o `GuideModal`.
**Props principais:** `HelpModalProps` — `isOpen`, `onClose()`, `language?` (a interface `Term` estrutura cada verbete).
**Exports:** `HelpModal(props)`.
**Estado/efeitos relevantes:** nenhum estado próprio; deriva `GOOD_DAYS` de `GOOD_CONSTANCY_RATIO * CONSTANCY_WINDOW_DAYS` e `DREAM_COUNT` de `DREAM_CATALOG.length` — nunca literal.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/HelpModal'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'HelpModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** era 7 seções/24 verbetes até 90 palavras, cortado para o que o `GuideModal` NÃO responde; verbete cuja explicação já está na própria tela (indicador de cocô, botão de banho) saiu; nenhuma descrição passa de duas linhas; números sempre de constante, nunca escritos à mão.

### `src/components/InstallPrompt.tsx`
**Dono de:** cartão de instalação da PWA dentro das Configurações — não é modal, nasce numa lista de opções.
**Props principais:** `InstallPromptProps` — `language?`. `BeforeInstallPromptEvent` (interface local para o evento nativo do navegador).
**Exports:** `InstallPrompt(props)`.
**Estado/efeitos relevantes:** `useState` (`deferredPrompt`, `dismissed` — lido de `readFlag(STORAGE_KEYS.PWA_INSTALL_DISMISSED)`, `installed`); `useEffect` detecta `display-mode: standalone` e escuta `beforeinstallprompt`.
**Chamado por:** `src/components/SettingsPage.tsx` (`grep -rl "from '.*/InstallPrompt'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'InstallPrompt.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** nenhum.

### `src/components/IntroScreen.tsx`
**Dono de:** a splash screen do cold start — toca o vídeo de marca e cai no gate de onboarding/app principal.
**Props principais:** `{ onFinish: () => void }` (tipo inline, sem interface nomeada).
**Exports:** `IntroScreen(props)`.
**Estado/efeitos relevantes:** `useState` (`leaving`, `videoFailed`); `useRef` (`doneTimerRef`, `leaveTimerRef`); `useEffect` agenda `scheduleFinish(1500)` como fallback, substituído pela duração real do vídeo quando conhecida; toque/clique pula direto com o mesmo fade de 400ms.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/IntroScreen'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'IntroScreen.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** puramente cosmético, self-dismiss via `onFinish`; cai para o wordmark raven/gradiente se o vídeo falhar (WebView antiga sem suporte ao formato).

### `src/components/ItemsWindow.tsx`
**Dono de:** a Pastinha — inventário de itens (chips, coraçãozinho, especiais) com uma ação dominante: usar.
**Props principais:** `ItemsWindowProps` — inventário do save, callback de uso, `language`.
**Exports:** `ItemsWindow(props)`.
**Estado/efeitos relevantes:** `useState` (`selected`); lê `ITEM_ART`, `SPECIAL_ITEMS`/`CHIP_BOOST`/`HEART_HEAL` de `src/utils/shop.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/ItemsWindow'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ItemsWindow.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** o emoji É a chave de inventário (`utils/shop.ts`) — nenhum PNG paralelo, para não repetir o bug de moeda que a loja teve com duas representações do mesmo item; efeito virou frase ("+2 Benevolência, +1 Poder") no lugar de cor chapada; sem contador "N itens" (a grade já mostra).

### `src/components/LibraryPage.tsx`
**Dono de:** a Biblioteca — diretório de jogadores, amigos e o painel cooperativo, com quatro estados explícitos (carregando/vazio/erro/sem rede).
**Props principais:** `LibraryPageProps` — `saveId`, `friends: string[]`, `canGiftToday` (energia cheia), `onFriendsChange`, `onGiftSent`, `onVisitPlayer?` (WP4.7, dispara na abertura do detalhe), `metaDoDiaCumprida?` (repassado ao `CoopPanel`, decidido pelo motor de progresso e não duplicado no painel).
**Exports:** `LibraryPage(props)`.
**Estado/efeitos relevantes:** `useState` para `search`, `players`, `loadError`, `actionError`, `busyId`, `tab`, `giftedToday`, `selectedPlayer`, `reloadKey`, `friendPlayers`; `useEffect` carrega via `listPlayers`/`getPlayer` (`src/utils/community.ts`); renderiza `PlayerDetailModal` e `CoopPanel`.
**Chamado por:** `grep -rl "from '.*/LibraryPage'" src` (testes); consumo real em `src/App.tsx` via `lazy(() => import('./components/LibraryPage'))` (09/09/2026).
**Régua:** `src/components/LibraryPage.amigos.render.test.tsx`; também tocado por `src/components/spriteUrl.beacon.render.test.tsx`.
**Avisos do arquivo:** falha de rede antes caía em `.catch(() => setPlayers([]))` — lida como "nenhum jogador encontrado", a pior mentira possível numa tela social; hoje os quatro estados são distintos de propósito.

### `src/components/MemoriesCard.tsx`
**Dono de:** o cartão de memórias aos 30 e 90 dias — dentro do relatório diário, uma vez só, sem números de desempenho.
**Props principais:** `MemoriesCardProps` — `mark: 30|90`, `petName`, `spriteUrl?`, `formNames: readonly string[]`, `dreamCount`, `soulGoal?`, `language`.
**Exports:** `MemoriesCard(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — apresentação pura.
**Chamado por:** `src/components/DailyReportModal.tsx` (`grep -rl "from '.*/MemoriesCard'" src`, 09/09/2026).
**Régua:** `src/components/MemoriesCard.render.test.tsx`.
**Avisos do arquivo:** não é balanço — nenhum "você concluiu N tarefas", nenhum percentual, nenhuma comparação com o mês anterior; as contagens exibidas (formas vividas, sonhos) são de COLEÇÃO, só crescem; não é gatilho de volta — sem push, badge ou lembrete.

### `src/components/MilestoneCeremony.tsx`
**Dono de:** a cerimônia dos marcos de hábito (7/21/66 dias efetivos) — pausa com saída pelo gesto do jogador, não auto-fechamento.
**Props principais:** `MilestoneCeremonyProps` — `tierIcon` (`HABIT_TIER_ICONS`), nome do hábito, dias efetivos, `language`.
**Exports:** `MilestoneCeremony(props)` · `default`.
**Estado/efeitos relevantes:** `useEffect` dispara háptico curto (`navigator.vibrate`, onde disponível) ao montar; sem timer de auto-fechamento — a saída é sempre o botão "Seguimos juntos".
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/MilestoneCeremony'" src`, 09/09/2026).
**Régua:** `src/components/MilestoneCeremony.render.test.tsx`.
**Avisos do arquivo:** ⚠️ até 06/09/2026 fechava sozinha em 2,5s sem botão, em z-60 (abaixo do check-in, z-200) — o marco de 66 dias era comemorado atrás de um véu invisível; movimento reduzido corta as ANIMAÇÕES, nunca a pausa nem o botão — a versão antiga caía para um `toast.success` igual ao de qualquer tarefa, entregando menos cerimônia a quem mais precisa de acessibilidade.

### `src/components/MorningCheckIn.tsx`
**Dono de:** o ritual matinal — hábitos do dia + até 3 focos + humor, com as pendências de ontem primeiro; pulável sem culpa.
**Props principais:** `CheckInHabitItem`, `CheckInTaskItem`, `CheckInPlanShape` (formato de `checkInPlan`, `src/utils/rituals.ts`), `MorningCheckInProps`.
**Exports:** `CheckInHabitItem` (interface) · `CheckInTaskItem` (interface) · `CheckInPlanShape` (interface) · `MorningCheckInProps` (interface) · `MorningCheckIn(props)` · `default`.
**Estado/efeitos relevantes:** `useMemo` (`candidates`); `useState` (`selected`); `useEffect`/`useLayoutEffect` de sincronização visual; sem GameState/localStorage — o plano vem pronto de `checkInPlan` e quem grava é o `App.tsx`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/MorningCheckIn'" src`, 09/09/2026).
**Régua:** `src/components/MorningCheckIn.commit.render.test.tsx`, `.ofertaReduzida.render.test.tsx`.
**Avisos do arquivo:** `overcommitted` é AVISO, nunca bloqueio — o botão de confirmar continua sempre ativo (o Motion é odiado por decidir no lugar do usuário); `onSkip` sempre visível — ritual que só sai da frente se cumprido é cobrança na porta do app.

### `src/components/MorningDream.tsx`
**Dono de:** a revelação do sonho da manhã — o único feedback da Janela de Descanso, sempre de manhã, nunca julgando a noite.
**Props principais:** `MorningDreamProps` (exportado) — `open`, `dream: Dream | null` (`null` = manhã sem cena, não é falha), `isNew`, `language`, `onClose()`.
**Exports:** `MorningDreamProps` (interface) · `MorningDream(props)` · `default`.
**Estado/efeitos relevantes:** nenhum estado — componente puro; usa `useDialogA11y` (`src/hooks/useDialogA11y.ts`) e `DREAM_ART` (`src/utils/dreamArt.ts`).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/MorningDream'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'MorningDream.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** nenhuma variante julga a noite — sem "você dormiu tarde", sem score, sem nota; `dream===null` é um bom-dia neutro, nunca cobrança.

### `src/components/NewReadingModal.tsx`
**Dono de:** "Nova Leitura" — substituiu o reroll pago por Math.random() (WP5.7/decisão H.4); a semente vem das RESPOSTAS mudadas, não de sorteio.
**Props principais:** `NewReadingModalProps` — `language`, `answers: Record<string,string>` (leitura atual), `credits`, `onConfirm(answers): Promise<boolean>`, `onClose()`.
**Exports:** `NewReadingModal(props)`.
**Estado/efeitos relevantes:** `useState` (`rascunho`, `ocupado`, `erro`); usa `answersChanged` (`src/utils/newReading.ts`) para desabilitar o botão enquanto nada mudou; `REROLL_COST_CREDITS` de `src/utils/monetization.ts`.
**Chamado por:** `grep -rl "from '.*/NewReadingModal'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/NewReadingModal'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'NewReadingModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** o antigo reroll cobrava 50 Créditos e sorteava com `Math.random()` — definição de gacha, única violação declarada ainda de pé; a tela diz "mesma resposta, mesma criatura" ANTES de cobrar; botão desligado enquanto nada mudou (impede pagar para receber a mesma criatura).

### `src/components/NightmareBattle.tsx`
**Dono de:** o combate do Pesadelo — luta curta de manhã, apresentação pura de `utils/nightmares.ts`, sem GameState nem localStorage.
**Props principais:** `NightmareBattleProps` — onda já montada (`buildNightmareWave`), raridade, callbacks `markFought`/recompensas resolvidos pelo App.
**Exports:** `NightmareBattleProps` (interface) · `NightmareBattle(props)` · `default`.
**Estado/efeitos relevantes:** `useState` (`relaxedTiming` — lido uma vez, de `prefersReducedMotion`, `idx`, `enemyHp`, `playerHp`, `phase`, `popup`, `hitFx`, `defendLeft`, `rewards`); `useRef` (`timerRef`, `fxRef`, `defendResolved`, `defendRef`, `firedRef`); `useCallback` (`after`); `useEffect` de limpeza de timers.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/NightmareBattle'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'NightmareBattle.*test.ts*'` vazio, 09/09/2026); a régua de recompensa/onda vive em `src/utils/nightmares.test.ts`.
**Avisos do arquivo:** perder não custa nada (mesma regra da Masmorra) — tela de derrota diz "o sonho passou, você acorda bem"; tom sem horror/susto/vermelho de perigo; `DungeonGame` deliberadamente NÃO reutilizado — ele não aceita onda pronta, é uma run de 5 andares (não uma luta única) e escreve direto no localStorage (misturaria a economia da Masmorra com a do Pesadelo).

### `src/components/NotificationManager.tsx`
**Dono de:** o agendamento em memória de toasts/notificações locais (nudges de hábito, boa noite, lembrete de deitar) — não decide texto/hora (isso é `functions/api/_pushCopy.js`).
**Props principais:** `Activity`/`Task` (interfaces locais) · `NotificationManagerProps` — `activities`, `tasks`, `userName`, `petName`, `bornAt?` (WP1.17), `restWindow?` (WP3.11, opt-in), `isSleeping?`.
**Exports:** `NotificationManager(props)`.
**Estado/efeitos relevantes:** `useRef` para datas de disparo únicas por dia (`lastEveningWarnDate`, `lastNudge10Date`, `lastNudge16Date`, `lastGoodnightDate`, `lastSleepReminderDate`); cinco `useEffect` de polling/agendamento; chama `pushCopy`/`sleepReminderCopy`/`eveningCopy` (`functions/api/_pushCopy.js` — mesma função lida pelo worker e pelo cron) e `checkAndShowNotifications`/`syncActivityAlarms`/`syncTaskAlarms`/`registerForPushNotifications` de `src/utils/notifications.ts`; usa `toast` (sonner) e o plugin nativo `SoulmonAlarm`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/NotificationManager'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'NotificationManager.*test.ts*'` vazio, 09/09/2026); a paridade de horas com `_pushCopy.js` é testada no lado do worker.
**Avisos do arquivo:** dono único do texto/horário é `_pushCopy.js` — as três árvores (cliente, worker, cron) leem a mesma função, não reintroduza cópia local (footgun 9); `restWindow` ausente = sem lembrete de deitar (mecânica inteiramente opt-in).

### `src/components/PetPage.tsx`
**Dono de:** a página do Pet — a ficha viva da criatura, forma a forma, com skills recomputadas do perfil do oráculo.
**Props principais:** `PetPageProps` — `stages: CreatureStage[]`, `savedSkills?` (persistidas no save), `savedClassTitles?`, callback quando a página recomputa skills localmente.
**Exports:** `PetPage(props)`.
**Estado/efeitos relevantes:** `useState` (`skills`, `classTitles`, inicializados de `savedSkills`/`savedClassTitles`); `useEffect` recomputa via o pipeline determinístico de `src/utils/soulProfile/ficha/` quando o perfil local (`SOULMON_PROFILE`) existe; `useMemo` (`formas`); renderiza a forma atual dentro de `<Viewport>` em escala inteira.
**Chamado por:** `grep -rl "from '.*/PetPage'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/PetPage'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'PetPage.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** mostra só formas já desbloqueadas, nunca as futuras (spoiler-guard); skills são determinísticas por identidade (mesmo `soulProfile` → mesmas skills), sem campo novo no save; save legado sem `soulProfile` simplesmente não mostra a seção de habilidades.

### `src/components/PetStageDecor.tsx`
**Dono de:** desenha a decoração equipada do palco (móveis, cenário, vitrine de troféus) dentro da área do pet.
**Props principais:** `PetStageDecorProps` — `equippedDecor: Partial<Record<SlotId,string>>`, `equippedBackground: string|null`, `trophies` (troféus reais de season), `language`.
**Exports:** `PetStageDecor(props)`.
**Estado/efeitos relevantes:** nenhum — apresentação pura; lê `ALL_SHOP_ITEMS`/`DECOR_ART`/`DECOR_SLOTS`/`slotBoxStyle` de `src/utils/shop.ts`, `src/utils/decorArt.ts`, `src/utils/petStage.ts`.
**Chamado por:** `src/components/CompanionHUD.tsx` (`grep -rl "from '.*/PetStageDecor'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'PetStageDecor.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** espaço vazio é vazio — sem contorno tracejado nem "+" convidando a comprar; um item por espaço, na caixa em px do slot; nada aparece em cenário incompatível (a loja avisa ao equipar, o item não some em silêncio); tudo fica atrás do pet.

### `src/components/PixelFrame.tsx`
**Dono de:** a moldura decorativa de cantos (cano de cobre + trepadeira + cristal) desenhada como pixel art em SVG (`<rect>` 1×1, `shape-rendering: crispEdges`).
**Props principais:** nenhuma prop — módulo autocontido, sem interface exportada.
**Exports:** `PixelFrame(props)`.
**Estado/efeitos relevantes:** nenhum — `buildCorner()` roda a nível de módulo (custo zero por render); overlay `position: fixed` com `pointer-events: none`, nunca captura toque.
**Chamado por:** `grep -rn "PixelFrame" src` não acha nenhum import fora do próprio arquivo — só comentários em `src/App.tsx` e `src/components/SoulmonOnboarding.tsx` registrando a remoção (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'PixelFrame.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** ⚠️ sem consumidor ativo em 09/09/2026 — `src/App.tsx` (linha ~4457) registra em comentário que a peça foi tirada de propósito, a pedido do dono (estética); o arquivo continua no repositório mas não é importado por nada; nada de `transform`/`filter` no elemento raiz (criaria bloco contenedor, ver footgun de `.sm-pet-sticky`).

### `src/components/PixelizerCard.tsx`
**Dono de:** o Pixelador — cola/envia uma imagem gerada por IA e converte em sprite v-pet real (grid 16×16, paleta quantizada em 4 cores).
**Props principais:** `PixelizerCardProps` — `language?`.
**Exports:** `PixelizerCard(props)`.
**Estado/efeitos relevantes:** `useState` (`source`, `grid`, `colors`, `transparentBg`, `resultUrl`); `useRef` (`previewRef`, `fileInputRef`); `useCallback` (`loadImageFile`); `useEffect` escuta colar (`paste`) e redesenha o preview; usa `pixelizeBuffer` (`src/utils/pixelizer.ts`); `toast.error`/`toast.success` (sonner) para falha/sucesso de colagem.
**Chamado por:** `src/components/OraclePage.tsx` (`grep -rl "from '.*/PixelizerCard'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'PixelizerCard.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** garante o resultado 16×16/4 cores que o prompt de geração pede.

### `src/components/PlayCard.tsx`
**Dono de:** o cartão de Brincar — a oferta de um buff de Bits, apresentação pura de `utils/petNeeds.ts`.
**Props principais:** `PlayCardProps` (exportado) — recebe `canPlay`, o `PlayBuff` ativo (se houver) e callback `onPlay`.
**Exports:** `PlayCardProps` (interface) · `PlayCard(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — não lê GameState, não toca localStorage, não decide nada; usa `PLAY_BUFF_MULTIPLIER`/`PLAY_ENERGY_COST` de `src/utils/petNeeds.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/PlayCard'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'PlayCard.*test.ts*'` vazio, 09/09/2026); a regra em si é travada por `src/utils/petNeeds.test.ts`.
**Avisos do arquivo:** nunca pode ganhar barra de diversão, contador regressivo nem alerta/badge por não ter brincado — `canPlay===false` não é falha; brincar nunca entra em dia perfeito, HP ou evolução; custo e prêmio aparecem ANTES do clique.

### `src/components/PlayerDetailModal.tsx`
**Dono de:** perfil resumido de outro jogador na Biblioteca — nick, tempo de jogo, rank e o branch atual do pet com todo o progresso já desbloqueado nele.
**Props principais:** `PlayerDetailModalProps` — recebe um `DirectoryPlayer` (`src/utils/community.ts`) e `language`.
**Exports:** `PlayerDetailModal(props)`.
**Estado/efeitos relevantes:** nenhum — apresentação pura; usa `FORM_REQUIREMENTS`/`getStageBranch`/`getStageLevel` de `src/types/progression.ts` e `Viewport`/`AlignmentIcons` para o desenho.
**Chamado por:** `src/components/LibraryPage.tsx` (`grep -rl "from '.*/PlayerDetailModal'" src`, 09/09/2026).
**Régua:** `src/components/PlayerDetailModal.semMetrica.render.test.tsx`; também tocado por `src/components/spriteUrl.beacon.render.test.tsx`.
**Avisos do arquivo:** o progresso mostrado vem sempre de `unlockedStages` — nunca vaza forma além da já alcançada; `LEVEL_LABEL` era uma SEGUNDA cópia do mapa de `types/attributes.ts` (idêntica à de `EvolutionPath`) — duas cópias que concordam ainda são duas cópias (footgun 9), e a `StatsPage` não usava nenhuma das duas.

### `src/components/ProtectProgressModal.tsx`
**Dono de:** pedido de e-mail DEPOIS do onboarding, quando existe algo que doeria perder (evolução ou sequência) — nunca bloqueia.
**Props principais:** `ProtectProgressModalProps` — `language`, `reason: 'evolution'|'streak'`, `onDismiss()`, `onConfirm(email): Promise<void>` (quem chama migra o save).
**Exports:** `ProtectProgressModal(props)`.
**Estado/efeitos relevantes:** `useState` (`email`, `error`, `saving`); valida e-mail com regex antes de habilitar o envio.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/ProtectProgressModal'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ProtectProgressModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** e-mail deixou de ser obrigatório no início do onboarding (pedir contato antes de ver o pet andar era o maior ponto de abandono) — pede quando passa a existir algo que doeria perder; sempre dá para fechar e continuar jogando.

### `src/components/QuickAddBar.tsx`
**Dono de:** a linha de captura rápida na tela inicial (`docs/PLANO-TAREFAS.md` §2.5) — mesmo parser do `CreateModal`.
**Props principais:** `QuickAddBarProps` — `language`, `onCommit(r: QuickAddResult): boolean` (devolve `false` quando o teto recusou; a barra mantém o texto digitado).
**Exports:** `QuickAddBar(props)`.
**Estado/efeitos relevantes:** `useState` (`texto`, `recusado`, `ajudaAberta`); `useMemo` (`resultado`, `chips`) chama `parseQuickAdd`/`quickAddHint` (`src/utils/quickAdd.ts`).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/QuickAddBar'" src`, 09/09/2026).
**Régua:** `src/components/QuickAddBar.render.test.tsx`.
**Avisos do arquivo:** a confirmação (chips) é VISÍVEL antes de gravar; a gravação NÃO é reimplementada aqui — usa os mesmos `commitTaskCreate`/`commitHabitCreate` do `CreateModal`, para não furar o teto do modo grátis por uma segunda rota.

### `src/components/RPSGame.tsx`
**Dono de:** o minijogo Pedra-Papel-Tesoura contra o pet — melhor de 5 (primeiro a 3 vitórias de rodada).
**Props principais:** props inline (sem interface nomeada) — `evolutionStage`, `demoCharacterId?`, `language`, `onEarnPoints`, `onExit`.
**Exports:** `RPSGame(props)`.
**Estado/efeitos relevantes:** `useState` (`playerWins`, `petWins`, `playerHand`, `petHand`, `thinking`, `roundMsg`, `matchOver`); `useRef`/`useEffect` limpam o timer da IA ao desmontar; toca `playTaskComplete` (`src/utils/sounds.ts`).
**Chamado por:** `src/components/ActivitiesPage.tsx` (`grep -rl "from '.*/RPSGame'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'RPSGame.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** as três peças eram emoji do sistema (dívida de arte, `docs/BACKLOG-ARTE-GERAR.md` item A11) — hoje são sprites próprios; cada peça carrega rótulo PT/EN próprio porque `<img>` não carrega nome acessível como o emoji carregava.

### `src/components/RebirthModal.tsx`
**Dono de:** a cerimônia de Renascimento — a única tela em que o jogador ESCOLHE a criatura (criatura livre + escola + elemento), disponível só depois do ultra.
**Props principais:** `RebirthModalProps` — `language`, `onConfirm(choices: RebirthChoices): Promise<boolean>|boolean`, `onClose()`.
**Exports:** `RebirthModal(props)` · `default`.
**Estado/efeitos relevantes:** `useMemo` (`escolas`, `elementos`, via `rebirthEscolaOptions`/`rebirthElementOptions` de `src/utils/rebirth.ts`); `useState` (`criatura`, `escola`, `elemento`, `confirmando`, `ocupado`, `erro`); usa `sanitizeCriatura`/`REBIRTH_CRIATURA_MAX` para higienizar o campo livre antes de ir ao prompt.
**Chamado por:** `grep -rl "from '.*/RebirthModal'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/RebirthModal'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'RebirthModal.*test.ts*'` vazio, 09/09/2026); a regra de negócio (uma vez só, `paid`+`ultra`) é travada em `src/utils/rebirth.test.ts`.
**Avisos do arquivo:** o que se perde é dito ANTES de qualquer escolha, com nome e número, junto do que NÃO se perde; é uma vez só, dito como aviso e não como letra miúda; confirmação exige um segundo toque (`confirmando`) — única ação irreversível do app.

### `src/components/RestWindowCard.tsx`
**Dono de:** o cartão de configurar/ver a Janela de Descanso — apresentação pura, sem score de sono nem julgamento da noite.
**Props principais:** `RestWindowCardProps` (exportado) — `rest` (`RestState`), `now`, sem chamada a `Date.now()`.
**Exports:** `RestWindowCardProps` (interface) · `RestWindowCard(props)` · `default`.
**Estado/efeitos relevantes:** `useId` para acessibilidade dos controles; sem GameState/localStorage — usa `restConstancy` de `src/utils/restWindow.ts`.
**Chamado por:** `grep -rl "from '.*/RestWindowCard'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/RestWindowCard'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'RestWindowCard.*test.ts*'` vazio, 09/09/2026); a regra "sem score" é travada em `src/utils/restWindow.test.ts`.
**Avisos do arquivo:** PROIBIDO nesta tela e em qualquer tela de sono do app: score 0–100, gráfico de estágios, texto que julgue a noite, meta de duração — ortossonia atinge 3–14% da população (~23% de 18–35 anos relatam estresse com apps de sono); o único número exibido é constância de HORÁRIO, nunca resultado fisiológico; `hideMetrics` esconde números e preserva recompensas.

### `src/components/SettingsModal.tsx`
**Dono de:** o painel rápido de configurações do menu sanduíche — três linhas, alvo é a linha inteira.
**Props principais:** `SettingsModalProps` — `isOpen`, `onClose()`, `useAI`, `onToggleAI()`, `soundMuted?`, `onToggleSound?`, `aiSettings: AISettings`, `onSaveAISettings(settings)`, `language?` (padrão lê a preferência salva).
**Exports:** `SettingsModal(props)`.
**Estado/efeitos relevantes:** `useState` (`showAISettings`); renderiza `AISettingsModal`, `SwitchRow`, `ActionRow` (de `src/components/AISettingsModal.tsx`).
**Chamado por:** `grep -rl "from '.*/SettingsModal'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/SettingsModal'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'SettingsModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** era a única superfície de configuração 100% em inglês — hoje o par PT/EN é obrigatório; fechar é só X/Escape do `ModalSheet` (sem botão "✅ Close" redundante).

### `src/components/SettingsPage.tsx`
**Dono de:** a página de Configurações — cinco grupos por intenção do usuário, uma ação dominante (entrar/sincronizar).
**Props principais:** `SettingsPageProps` — `useAI`, `onToggleAI()`, `aiSettings`, `onSaveAISettings()`, `language`, `onChangeLanguage()`, `onOpenGuide()`, `onOpenGlossary()`, `notificationsEnabled`, `onToggleNotifications()`, `onRestoreFromCloud(saveId)`, `onLoginWithEmail(email)`.
**Exports:** `SettingsPage(props)`.
**Estado/efeitos relevantes:** `useState` para `enabled` (telemetria, `isTelemetryEnabled()`), `showAISettings`, `copied`, `restoreInput`/`restoreStatus`, `emailInput`/`loginStatus`, `autoSleepEnabled`/`autoSleepStart`/`autoSleepEnd` (lidos via `readFlag`/`readLocal` de `STORAGE_KEYS.AUTO_SLEEP_*`); usa `useTheme` (`src/contexts/ThemeContext.tsx`); renderiza `AccountSection`, `AccountDataSection`, `InstallPrompt`.
**Chamado por:** `grep -rl "from '.*/SettingsPage'" src` (testes de telemetria); consumo real em `src/App.tsx` via `lazy(() => import('./components/SettingsPage'))` (09/09/2026).
**Régua:** exercitada por `src/components/settingsTelemetry.render.test.tsx`.
**Avisos do arquivo:** era ONZE cartões empilhados na ordem histórica de implementação — hoje cinco grupos; o que é avançado (código de recuperação, restauração manual) vive atrás de revelação.

### `src/components/ShopModal.tsx`
**Dono de:** a Loja — dois segmentos por MOEDA (Bits/Torneio), missões embutidas no próprio card bloqueado.
**Props principais:** sem interface nomeada no trecho lido — recebe inventário do save, saldo de Bits/Emblemas, `language` e callbacks de compra (arquivo de 488 linhas).
**Exports:** `ShopModal(props)`.
**Estado/efeitos relevantes:** `useState` (`seg: ShopSegment`, `flash`, `exchanging`); lê `SHOP_ITEMS`/`TOURNAMENT_ITEMS` de `src/utils/shop.ts`, `MISSIONS`/`isShopItemUnlocked` de `src/utils/missions.ts`; renderiza `UnlockNudge`.
**Chamado por:** `grep -rl "from '.*/ShopModal'" src` (testes); consumo real em `src/App.tsx` via `lazy(() => import('./components/ShopModal'))` (09/09/2026).
**Régua:** `src/components/ShopModal.convitePassivo.render.test.tsx`, `.missoes.render.test.tsx`.
**Avisos do arquivo:** as 5 abas antigas (Itens/Cenários/Mobílias/Torneio/Missões) viraram 2 segmentos — a única troca de contexto real é a MOEDA (Bits/Emblemas não se misturam, regra de produto); a aba Missões morreu — o card bloqueado agora diz a missão e o progresso na própria linha; toda arte de ícone de interface (8 PNGs + 15 símbolos de terceiro) saiu — o card mostra o que o item É (prévia CSS, arte pixel, emoji).

### `src/components/SoulTestItem.tsx`
**Dono de:** desenha UMA pergunta do teste de personalidade (Likert/escolha forçada/cenário) — usado tanto no onboarding quanto na `OraclePage`.
**Props principais:** `SoulTestItemProps` — `item: Item`, resposta atual, callback de resposta.
**Exports:** `itemPrompt(item)` — o enunciado no formato certo · `itemHint(item)` — dica de como responder · `SoulTestItem(props)`.
**Estado/efeitos relevantes:** nenhum — componente puro; `LIKERT_LABELS` fixa os cinco rótulos (1–5, extremos e meio sempre nomeados).
**Chamado por:** `src/components/OraclePage.tsx`, `src/components/SoulmonOnboarding.tsx` (`grep -rl "from '.*/SoulTestItem'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'SoulTestItem.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** único lugar que desenha os três formatos — onboarding e `OraclePage` usam o mesmo, senão o teste mediria coisas diferentes dependendo de onde foi respondido; escala Likert sempre 1–5 com extremos e meio rotulados (escala sem rótulo é adivinhação).

### `src/components/SoulmonOnboarding.tsx`
**Dono de:** o ritual de onboarding inteiro — consentimento, as 6 perguntas do oráculo, teste de personalidade opcional, criação de conta, reveal da criatura e o modo `upgrade` (desbloqueio no meio do jogo).
**Props principais:** `SoulmonOnboardingProps` (não totalmente citada no trecho lido) — `onComplete`, `mode?: 'onboarding'|'upgrade'`, `onRevealed?`, `onCancel?`.
**Exports:** `OnboardingCompleteData` (type) · `REVEAL_WAIT_MS` (const, 12_000 — quanto o reveal espera pelo desenho antes de seguir só com texto) · `GOOGLE_SEM_RESPOSTA_MS` (const, 120_000 — rede de segurança do login Google) · `SoulmonOnboarding(props)`.
**Estado/efeitos relevantes:** 51 ocorrências de `useState`/`useEffect`/`useRef`/`useMemo`/`useCallback` (`grep -c`, 09/09/2026); `lazy(() => import('./OraclePage'))` interno (ferramenta de dev, fora do bundle da intro); grava rascunho em `utils/oracleDraft.ts`/`utils/gateDraft.ts`; chama `generateOracle` (`src/utils/oracle.ts`), `buildConsentRecord`/`isAgeBlocked` (`src/utils/consent.ts`), `entrarComSenha`/`criarContaComSenha`/`entrarComGoogle` (`src/utils/auth.ts`), `purchase` (`src/utils/playBilling.ts`), `track`/`flushTelemetry` (`src/utils/telemetry.ts`).
**Chamado por:** `grep -rl "from '.*/SoulmonOnboarding'" src` (testes); consumo real em `src/App.tsx` via `lazy(() => import('./components/SoulmonOnboarding'))` (09/09/2026).
**Régua:** `.batismo.render.test.tsx`, `.copyRitual.render.test.tsx`, `.portao.render.test.tsx`, `.rascunho.render.test.tsx`, `.reveal.render.test.tsx`; também tocado por `src/components/telemetryWiring.render.test.tsx`.
**Avisos do arquivo:** as 6 perguntas do ritual continuam sendo `ORACLE_QUESTIONS`; o teste psicométrico de 20 itens é bifurcação sem volta, decidida ANTES do reveal; modo `upgrade` roda o MESMO ritual sem intro/cadastro e troca só a criatura (estágio/atividades/Bits/histórico continuam).

### `src/components/OraclePage.tsx`
**Dono de:** ferramenta interna de criação — a "metade da criação" do oráculo: elementos/papéis/alinhamentos/reinos, teste de personalidade, geração de prompts de sprite. Não tem entrada na navegação do jogo.
**Props principais:** `OraclePageProps` — `language?`, `initialDebugMode?` (semeia o modo sem custo, usado pelo atalho oculto da tela de intro). `SavedOracleForm` estende `OracleInput` com `seed?`, `overrides?`, `testAnswers?`, `city?`, `timeUnknown?`.
**Exports:** `OraclePage(props)`.
**Estado/efeitos relevantes:** 21 ocorrências de `useState`/`useEffect` (`grep -c`, 09/09/2026); usa `toast` (sonner); grava/lê `SavedOracleForm` via `readLocal`/`writeJson` (`STORAGE_KEYS`); chama `generateOracle` e os catálogos `ELEMENT_INFO`/`ROLE_INFO`/`ALIGNMENT_INFO`/`REALM_INFO` (`src/utils/oracle.ts`); renderiza `CityPicker`, `SoulTestItem`, `PixelizerCard`; usa `generateAllSprites` (`src/utils/spriteGen.ts`).
**Chamado por:** `grep -rl "from '.*/OraclePage'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/OraclePage'))` e em `src/components/SoulmonOnboarding.tsx` via `lazy()` interno (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'OraclePage.*test.ts*'` vazio, 09/09/2026); o motor por trás é coberto em `src/utils/oracle.test.ts`/`src/utils/soulProfile/**.test.ts`.
**Avisos do arquivo:** o jogador comum nunca vê esta página — é ferramenta de criação; nome da criatura-inspiração nunca entra em prompt (regra travada em `pipeline.test.ts`, não aqui).

### `src/components/StatsPage.tsx`
**Dono de:** a página de Estatísticas — deixou de ser uma parede de números; só o Nível de Vínculo é leitura grande.
**Props principais:** `CompletedTask`, `ActivityStats` (interfaces internas) · `StatsPageProps` — dados de progresso, formas desbloqueadas, jornada (kills, runs, recorde do Dino), histórico de conclusões.
**Exports:** `StatsPage(props)`.
**Estado/efeitos relevantes:** 3 ocorrências de `useMemo` (`grep -c`, 09/09/2026); renderiza `BirthCard`, `FormAlbum`, `BestiaryCard`; usa `getPassive` (`src/utils/passives.ts`).
**Chamado por:** `grep -rl "from '.*/StatsPage'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/StatsPage'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'StatsPage.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** era 13 números simultâneos (XP cru, Bits, 3 atributos, 5 contadores, 3 tabelas) — a pergunta "o usuário decide algo com este número?" respondia "não" na maioria; atributos (Poder/Harmonia/Benevolência) SAÍRAM daqui, moram na página de Evolução; jornada virou FRASE, não grade de caixas.

### `src/components/StepRow.tsx`
**Dono de:** uma linha de passo (etapa) dentro de um hábito/tarefa — checkbox com alvo de toque 44×44.
**Props principais:** `StepRowProps` — `id`, `label`, `completed`, `onToggle(id)`, `disabled?`, `language?`.
**Exports:** `StepRow(props)`.
**Estado/efeitos relevantes:** nenhum — apresentação pura; `<button role="checkbox">` para foco de teclado e leitor de tela.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/StepRow'" src`, 09/09/2026).
**Régua:** `src/components/StepRow.render.test.tsx`.
**Avisos do arquivo:** perdeu a moldura própria (ONDA 2) — era `sm-px-card` aninhado dentro do painel do hábito, três molduras para dizer "subitem"; hoje o recuo e o marcador dizem isso.

### `src/components/StepsCard.tsx`
**Dono de:** o cartão opcional de Passos — apresentação pura de `utils/steps.ts`, sem estado de falha nem cobrança.
**Props principais:** `StepsCardProps` (exportado) — contagem de passos, meta, `available` (se há sensor), callbacks de consentimento/dispensa.
**Exports:** `StepsCardProps` (interface) · `StepsCard(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — não lê GameState, não chama o plugin, não toca localStorage; usa `DEFAULT_STEP_GOAL`/`stepsConsentCopy`/`stepsGoalProgress` de `src/utils/steps.ts`; renderiza `PixelButton`/`PixelMeter`/`PixelPanel`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/StepsCard'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'StepsCard.*test.ts*'` vazio, 09/09/2026); as três regras (consentimento, nunca pontua, sem desvantagem sem sensor) são travadas em `src/utils/steps.test.ts`.
**Avisos do arquivo:** consentimento ANTES do diálogo do sistema, recusar tão fácil quanto aceitar (padrão escuro proibido); passos nunca pontuam sozinhos (nunca viram HP/energia/`perfectDays`); sem sensor (`available===false`) não mostra erro nem medidor vazio, só uma linha neutra dispensável.

### `src/components/TaskEditModal.tsx`
**Dono de:** modal de edição de tarefa (não-hábito) — reusa os blocos de campo do `CreateModal`.
**Props principais:** `TaskEditModalProps` — `isOpen`, `onClose()`, `onSave(data)` (nome, categoria, passos, prazo, alarme, esforço, `startDate`, `lastTouchedAt`), `onDelete?`, `title?`, `initialData?`.
**Exports:** `TaskEditModal(props)`.
**Estado/efeitos relevantes:** usa `useItemForm`/`todayIso` (`src/hooks/useItemForm.ts`); importa `CategoryChips`/`EffortFields`/`StepsFields` de `src/components/CreateModal.tsx`.
**Chamado por:** `grep -rl "from '.*/TaskEditModal'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/TaskEditModal'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'TaskEditModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** `startDate` é o único campo que traz a tarefa para o "Hoje".

### `src/components/TaskMeta.tsx`
**Dono de:** a faixa de metadados de uma tarefa (assombrada/atrasada/parada/adiada) — a diferença entre ALERTA e CONVITE, sem vermelho de cobrança.
**Props principais:** `TaskMetaProps` (exportado) — a tarefa e o relógio (`now`), sem GameState.
**Exports:** `TaskMetaProps` (interface) · `TaskMeta(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — puramente apresentacional; usa `effortOf`/`isHaunted`/`daysStale`/`isOverdue`/`needsPostponeNudge` de `src/utils/taskTriage.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/TaskMeta'" src`, 09/09/2026); também exercitado por `src/components/dailyList.sm2.render.test.tsx`.
**Régua:** `src/components/TaskMeta.render.test.tsx`.
**Avisos do arquivo:** roxo do assombro (`--sm2-*`, não mais hex cru `#7c5cbf`) — NÃO é vermelho, é a mecânica; opacidade global (`opacity: 0.72`) foi removida porque derrubava o contraste de todo o conteúdo junto (chips caíam para 2,94:1); tarefa assombrada anuncia bônus de alívio, é mini-chefe, não acusação.

### `src/components/TournamentPage.tsx`
**Dono de:** a página do Torneio (PvP assíncrono) — faixa de constância ANTES do ranking, ranking em janela de ±3 posições, placar de derrota em tinta neutra.
**Props principais:** `TournamentPageProps` — `saveId`, `pvpEnabled` (gate de vínculo mínimo), `language`, callbacks de partida.
**Exports:** `TournamentPage(props)`.
**Estado/efeitos relevantes:** `useState` para `opponents`, `matchesLeft`, `loadFailed`, `rank`, `rankFailed`, `fighting`, `result`, `fightError`, `rankExpanded`, `tab`; `useEffect` (`loadOpponents`) recarrega ao mudar `pvpEnabled`/`saveId`; partida resolvida no servidor (`playMatch`), sem frame de combate local.
**Chamado por:** `grep -rl "from '.*/TournamentPage'" src` → `src/components/TournamentPage.bondGate.test.tsx`; consumo real em `src/App.tsx` via `lazy(() => import('./components/TournamentPage'))` (09/09/2026).
**Régua:** `src/components/TournamentPage.bondGate.test.tsx`.
**Avisos do arquivo:** cena de arena NÃO existe aqui — a moldura antiga (fundo pintado + véu) saiu inteira, junto da razão de a tela ser escura no tema claro; a FAIXA sempre vem ANTES do ranking (posição absoluta é associada a comparação tóxica); ranking é janela de ±3, nunca lista completa; derrota é tinta neutra, nunca vermelho.

### `src/components/TriagePile.tsx`
**Dono de:** "Arrumar a Pilha" — a triagem em massa de tarefas atrasadas/assombradas, apresentação pura sobre `triageQueue`.
**Props principais:** `TriagePileProps` (exportado) — a fila já pronta (`TriageTask[]`), callbacks das quatro ações (hoje/esta semana/algum dia/deixar pra lá), `language`.
**Exports:** `TriageAction` (type) · `TriagePileProps` (interface) · `TriagePile(props)` · `default`.
**Estado/efeitos relevantes:** `useState` (`resolved: string[]`); `useMemo` (`remaining`); `useEffect` sincroniza com a fila recebida; usa `useDialogA11y`; lê `effortOf`/`daysStale`/`isOverdue`/`deadlineAt` de `src/utils/taskTriage.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/TriagePile'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'TriagePile.*test.ts*'` vazio, 09/09/2026); a fila em si é travada em `src/utils/taskTriage.test.ts`.
**Avisos do arquivo:** as quatro saídas têm o mesmo peso visual — "Deixar pra lá" não é o botão feio do canto; nenhum vermelho de cobrança, nenhum total de pendências gritando no topo; dá para sair no meio sem penalidade.

### `src/components/UnlockAccountModal.tsx`
**Dono de:** o desbloqueio completo DENTRO do jogo (não só na tela inicial) — o modal de compra e o convite discreto `UnlockNudge`.
**Props principais:** `UnlockReason` (type: `'task-limit'|'evolution'|'report'|'shop'`) · `UnlockAccountModalProps` — `language`, entitlement atual, motivo do convite, callbacks de compra/restauração.
**Exports:** `UnlockReason` (type) · `UnlockAccountModal(props)` · `UnlockNudge(props)` — convite discreto, uma linha clicável, só para contas `demo`.
**Estado/efeitos relevantes:** `useState` (`loading: 'buy'|'restore'|null`, `message`); usa `purchase`/`restorePurchases`/`isBillingAvailable` (`src/utils/playBilling.ts`), `useUnlockPriceLabel` (`src/utils/priceLabel.ts`), `track`/`unlockReasonCode` (`src/utils/telemetry.ts`).
**Chamado por:** `src/App.tsx`, `src/components/CreateModal.tsx`, `src/components/DailyReportModal.tsx`, `src/components/EditModal.tsx`, `src/components/ShopModal.tsx` (`grep -rl "from '.*/UnlockAccountModal'" src`, 09/09/2026); também tocado por `src/components/telemetryWiring.render.test.tsx`.
**Régua:** `src/components/UnlockAccountModal.copy.render.test.tsx`, `.dismiss.render.test.tsx`.
**Avisos do arquivo:** ⚠️ eram "dois lugares" documentados para o `UnlockNudge` (limite de criação + Evolução); `src/components/EditModal.tsx` passou a ser o terceiro — era o caminho que contornava o teto do demo, salvando sem checar cap; "Agora não" tem a mesma largura do botão de compra (recusar é resposta legítima); "restaurar" sussurra (`quiet`), não é uma segunda oferta.

### `src/components/WeeklyReportCard.tsx`
**Dono de:** o relatório semanal — o ritual de domingo, bloco discreto no topo da lista, nunca um modal que tranca a tela.
**Props principais:** `WeeklyReportCardProps` (exportado) — `report: WeeklyReport` (`src/utils/rituals.ts`), `suggestion: string | null` (`stackingSuggestion`), `language`, `onDismiss()`.
**Exports:** `WeeklyReportCardProps` (interface) · `WeeklyReportCard(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — apresentação pura; renderiza via `PixelPanel`/`PixelButton` (`src/components/pixel/PixelKit.tsx`).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/WeeklyReportCard'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'WeeklyReportCard.*test.ts*'` vazio, 09/09/2026); a regra "sem veredito" vem de `src/utils/rituals.ts`.
**Avisos do arquivo:** tudo aqui é DESCRIÇÃO, nunca veredito; `suggestion` é `null` sem dados suficientes e esse silêncio é a metade importante; nenhum número deste cartão pode diminuir por castigo.

### `src/components/WelcomePromptModal.tsx`
**Dono de:** pergunta única sobre instalar a PWA e autorizar notificações — cada metade some quando deixa de se aplicar.
**Props principais:** `BeforeInstallPromptEvent` (interface local) · `WelcomePromptModalProps` — `language`, `notificationsEnabled`, `notificationsUnlocked` (condição de ENTRADA do pedido — `false` = a metade de notificações nem existe), `onEnableNotifications()`.
**Exports:** `WelcomePromptModal(props)`.
**Estado/efeitos relevantes:** `useState` (`deferredPrompt`, `ready`, `installed`, `installDismissed`, `notifDismissed`, `step: 'install'|'notif'|null`); `useEffect` detecta instalação/`Capacitor.isNativePlatform()` e checa `checkNotificationPermission` (`src/utils/notifications.ts`).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/WelcomePromptModal'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'WelcomePromptModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** sheet de baixo (não modal centralizado); sem X próprio — o do `ModalSheet` já dispensa; uma ação dominante, "Agora não" em voz baixa.

### `src/components/evolution/SoulNode.tsx`
**Dono de:** um nó do grafo de evolução (interação, foco, alvo de toque, `aria-label`) — a arte vem de `nodeArt.tsx`, os dados de `EvolutionPath.tsx`.
**Props principais:** `SoulNodeProps` — `visual: SoulNodeVisual`, `size?`, `tone?` (só pinta nó já alcançado), `sprite?` (decorativo, pousado no nó), `label` (situação completa em palavras — WCAG 1.4.1), `title?`, `onClick?`, `ring?` (anel do nó atual), `silhouette?` (WP4.21, sombra da próxima forma prevista).
**Exports:** `SoulNodeVisual` (re-export de `nodeArt.tsx`) · `SoulNode(props)`.
**Estado/efeitos relevantes:** nenhum — componente de interação/apresentação puro.
**Chamado por:** `src/components/EvoTrail.tsx`, `src/components/EvolutionPath.tsx` (`grep -rl "from '.*/SoulNode'" src`, 09/09/2026).
**Régua:** nenhuma direta (`find src/components/evolution -maxdepth 1 -name 'SoulNode.*test.ts*'` vazio, 09/09/2026); exercitado pelos testes de `EvolutionPath.tsx`.
**Avisos do arquivo:** divisão de responsabilidade de propósito — `nodeArt.tsx` desenha, `SoulNode` interage, `EvolutionPath` monta o grafo; alvo sempre ≥44px mesmo quando o cristal desenhado é menor.

### `src/components/evolution/nodeArt.tsx`
**Dono de:** a fronteira única de arte do nó da árvore — hoje quatro PNGs 128×128 (um por `SoulNodeVisual`), não SVG.
**Props principais:** `NodeArtProps` (exportado) — `visual: SoulNodeVisual`, `size` → devolve um quadrado `size`×`size`px, decorativo (`aria-hidden`).
**Exports:** `SoulNodeVisual` (type: `'current'|'reached'|'forecast'|'locked'`) · `NodeArtProps` (interface) · `NodeArt(props)`.
**Estado/efeitos relevantes:** nenhum — módulo de arte estático, importa os 4 PNGs de `src/assets/soulmon/evolution/`.
**Chamado por:** `src/components/evolution/SoulNode.tsx` (`grep -rl "from '.*/nodeArt'" src`, 09/09/2026).
**Régua:** `src/components/evolution/nodeArt.render.test.tsx`.
**Avisos do arquivo:** a troca SVG→PNG foi FEITA em 18/08/2026 — arte gerada e recortada por algoritmo, medida contra `src/assets/assets.contract.test.ts` (0,00% magenta, 0,6–2,2% cinza, teto 5%, 12–23% de transparência real); hierarquia visual CRESCENTE em presença (locked→forecast→reached→current) carrega o significado sem depender só de cor.

### `src/components/figma/ImageWithFallback.tsx`
**Dono de:** `<img>` com fallback visual (SVG de erro embutido em base64) quando a imagem falha ao carregar — remanescente do import do Figma.
**Props principais:** `React.ImgHTMLAttributes<HTMLImageElement>` (repassa `src`, `alt`, `style`, `className`, resto).
**Exports:** `ImageWithFallback(props)`.
**Estado/efeitos relevantes:** `useState` (`didError`); `onError` troca para o placeholder.
**Chamado por:** `grep -rn "ImageWithFallback" src` não acha nenhum import fora do próprio arquivo (09/09/2026) — sem consumidor.
**Régua:** nenhuma (`find src/components/figma -maxdepth 1 -name 'ImageWithFallback.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** ⚠️ sem consumidor ativo em 09/09/2026 — resíduo do import original do Figma, mantido no repositório sem ser importado por nenhum outro módulo.

### `src/components/nestArt.ts`
**Dono de:** a fronteira única de arte do berço (espaço `nest` debaixo do pet) — qual PNG desenha a mobília base.
**Props principais:** nenhuma — módulo de dados estático.
**Exports:** `NestId` (type: `'nest-base'|'nest-basket'|'nest-cushion'` — id da PEÇA, não do espaço) · `NEST_ART: Record<NestId,string>` (mapa id→PNG) · `DEFAULT_NEST: NestId` (`'nest-base'`).
**Estado/efeitos relevantes:** nenhum.
**Chamado por:** `src/components/CompanionHUD.tsx` (`grep -rl "from '.*/nestArt'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'nestArt.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** mesmo contrato de `evolution/nodeArt.tsx` — a geometria mora no palco (`utils/petStage.ts`), a arte entra por fora; `NestId` (peça) e `BaseSlotId` (espaço) são deliberadamente distintos, vão divergir no dia em que existir mais de um berço.

### `src/components/form/FormKit.tsx`
**Dono de:** as primitivas de formulário do kit `--sm2-*` (campos, chips, segmentos, bottom sheet) — usadas por seis+ superfícies para não divergir em silêncio.
**Props principais:** cada função tem props próprias — `Field` estende `React.InputHTMLAttributes<HTMLInputElement>`; `Chip`, `Segment`, `CheckRow`, `ModalSheet` têm assinaturas próprias (ver o corpo, arquivo de 333 linhas).
**Exports:** `SM2_SHADOW_CARD`, `SM2_SHADOW_SHEET` (const) · `sm2Text`, `sm2Hint`, `sm2Label`, `sm2TitleStyle` (const, estilos de texto) · `sm2Button(variant, disabled?)` · `Field(props)` · `Chip(props)` · `Segment(props)` · `CheckRow(props)` · `ModalSheet(props)` — bottom sheet com `useDialogA11y` embutido · `default`.
**Estado/efeitos relevantes:** `useState` interno a alguns componentes (ex.: `ModalSheet`); usa `useDialogA11y` (`src/hooks/useDialogA11y.ts`) para foco preso/Escape/devolução de foco.
**Chamado por:** praticamente toda a árvore de telas/modais (`grep -rl "from '.*/FormKit'" src` lista dezenas de arquivos — `AISettingsModal`, `AccountDataSection`, `CreateModal`, `DailyReportModal`, `ShopModal`, `SoulmonOnboarding` etc., 09/09/2026).
**Régua:** nenhuma direta (`find src/components/form -maxdepth 1 -name 'FormKit.*test.ts*'` vazio, 09/09/2026); exercitado indiretamente por todos os `.render.test.tsx` das telas que o usam.
**Avisos do arquivo:** `Field` é nativo, não o `Input` do shadcn (aquele sorteia `id`/`name` a cada montagem, quebrando `htmlFor`, e traz `--foreground`/`--background` presos ao tema claro); tudo por `style` inline, nada por classe utilitária nova (Tailwind pré-compilado — classe fora do `index.css` não aplica nada, footgun 1); `ModalSheet` vem de baixo de propósito (o polegar alcança).

### `src/components/pixel/HomeHud.tsx`
**Dono de:** o HUD do topo da Home — marca à esquerda, medidores segmentados de HP/Energia/Bits abaixo, sob o orçamento de 5 leituras numéricas (`PLANO-DESIGN` §5.1).
**Props principais:** `HomeHudProps` — HP, energia, Bits, `language`.
**Exports:** `HomeHud(props)`.
**Estado/efeitos relevantes:** nenhum — apresentação pura sobre valores já calculados.
**Chamado por:** `src/App.tsx`, `src/components/CompanionHUD.tsx` (`grep -rl "from '.*/HomeHud'" src`, 09/09/2026).
**Régua:** `src/components/pixel/HomeHud.render.test.tsx`, `.selo.render.test.tsx`.
**Avisos do arquivo:** Créditos e os 3 atributos SAÍRAM deste HUD (troca declarada: Vínculo só entraria se duas leituras saíssem no mesmo PR) — Créditos continuam acionáveis no menu/`CreditsModal`, atributos moram em "CURRENT ALIGNMENT" na `EvolutionPath`; `TODO(Vínculo)` aberto para uma terceira `.sm2-meter` lendo `src/utils/bond.ts`, sem tirar outra leitura antes; Bits sem ícone, fonte de calculadora, para não repetir o bug do ícone 💎 compartilhado com Créditos.

### `src/components/pixel/PixelKit.tsx`
**Dono de:** os primitivos de UI da direção visual pixel (`docs/ui-refs/SPEC-UI-PIXEL.md`) — botão, painel, barra segmentada, checkbox, abas, chip, tag, switch, medidor, slot.
**Props principais:** cada função tem sua interface própria — `PixelButtonProps`, `PixelPanelProps`, `PixelSegmentedBarProps`, `PixelCheckboxProps`, `PixelTabItem`/`PixelTabsProps`, `PixelChoiceChipProps`, `PixelTagProps`, `PixelSwitchProps`, `PixelMeterProps`, `PixelSlotProps`, `PixelChipProps` (arquivo de 557 linhas).
**Exports:** `PixelSize` (type) · `PixelButton(props)` · `PixelPanel(props)` · `PixelSegmentedBar(props)` · `PixelCheckbox(props)` · `PixelTabs(props)` — conserto do "G9" (a seleção de aba passou a ser carregada pela sublinha, não só por cor de texto) · `PixelChoiceChip(props)` · `PixelTag(props)` — sem hover, é etiqueta informativa · `PixelSwitch(props)` · `PixelMeter(props)` · `PixelSlot(props)` — casa de 44px, fallback é o quadro vazio, nunca emoji do sistema · `PixelChip(props)`.
**Estado/efeitos relevantes:** nenhum estado global — cada primitivo é apresentacional; a arte 9-slice usa PNGs recortados na bbox alfa (`src/assets/soulmon/ui/btn-{sm,md,lg}.png`, via `sharp`, determinístico).
**Chamado por:** `src/components/ArenaGame.tsx`, `CompanionHUD.tsx`, `DinoGame.tsx`, `DungeonGame.tsx`, `GameTutorialFlow.tsx`, `NightmareBattle.tsx`, `PlayCard.tsx`, `RPSGame.tsx`, `RestWindowCard.tsx`, `StepsCard.tsx`, `WeeklyReportCard.tsx`, `pixel/RitualPanel.tsx` (`grep -rl "from '.*/PixelKit'" src`, 09/09/2026).
**Régua:** `src/components/pixel/PixelKit.render.test.tsx`; também exercitado por `src/components/pixel/PixelStates.render.test.tsx`.
**Avisos do arquivo:** os quatro estados (normal/hover/active/disabled) são arte DERIVADA do `normal` (classificação de pixel cobre/teal), não redesenhados — fatia que não bate faz a moldura pular no hover; os nove arquivos medem 0,0000% de magenta (resíduo antigo apagado por inpainting); a barra segmentada é DOM, não PNG.

### `src/components/pixel/RitualPanel.tsx`
**Dono de:** o painel de rituais da Home — um painel titulado, coluna única, linhas de ~72px, dimensionado para o PT-BR (mais longo que o EN).
**Props principais:** `RitualRowProps` (exportado), `RitualPanelProps` (exportado) — lista de itens (hábitos/tarefas do dia), progresso segmentado, callback de concluir/editar.
**Exports:** `RitualIcon(props)` — casa 40×40 sem moldura · `RitualRowProps` (interface) · `RitualRow(props)` · `RitualPanelProps` (interface) · `RitualPanel(props)`.
**Estado/efeitos relevantes:** nenhum estado próprio — apresentação pura; etapas nascem RECOLHIDAS (barra segmentada mostra `2/4`, expansor abre para marcar).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/RitualPanel'" src`, 09/09/2026).
**Régua:** `src/components/pixel/RitualPanel.render.test.tsx`.
**Avisos do arquivo:** coluna única até 768px (duas colunas só a partir daí, e nem isso é feito aqui); nome do item trunca com `…` + `title` completo, nunca altura dependente de texto; sem ícone não sobra caixa vazia (quadro de cobre em volta do ícone saiu por direção do dono); a coluna de texto inteira é o botão de editar.

### `src/components/pixel/TimingBar.tsx`
**Dono de:** a mecânica de timing de todo combate do Soulmon — marcador vaivém, `onStop` devolve precisão 0..1; quem interpreta o número é cada jogo.
**Props principais:** `TimingBarProps` (exportado) — `speed` (ciclos/segundo), `color`, e (não citado no trecho) callback `onStop`.
**Exports:** `TimingBarProps` (interface) · `TimingBar(props)`.
**Estado/efeitos relevantes:** `useState` (`pos`); `useRef` (`posRef`, `rafRef`, `stoppedRef`); `useEffect` roda o loop `requestAnimationFrame`.
**Chamado por:** `src/components/ArenaGame.tsx`, `src/components/DungeonGame.tsx`, `src/components/NightmareBattle.tsx` (`grep -rl "from '.*/TimingBar'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components/pixel -maxdepth 1 -name 'TimingBar.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** era código local em `DungeonGame.tsx`, COPIADO para `NightmareBattle.tsx` (footgun 9 documentado no próprio cabeçalho antigo) — esta é a extração feita antes da Arena existir, para não abrir uma terceira cópia; ⚠️ não acrescentar regra de jogo aqui (dano/elemento/crítico/carga de especial são de quem chama) — a barra só mede.

### `src/components/ui/Icon.tsx`
**Dono de:** o único ponto de ícone do app — dois motores (glifo SVG próprio ou ligature Material Symbols), mesma API.
**Props principais:** `IconProps` (exportado) — `name` (nome Material, mesmo com glifo próprio), `size`, `fill` (eixo de estado), `weight` (espessura de traço no SVG), `tone`, `label`.
**Exports:** `IconTone` (type — tokens de TINTA, nunca fill) · `IconProps` (interface) · `Icon` (`const`, `memo`) · `default`.
**Estado/efeitos relevantes:** nenhum — componente puro; `memo` porque é o mais instanciado do app (nav, cada card de tarefa, cada ação do pet), todas as props primitivas.
**Chamado por:** dezenas de arquivos (`grep -rl "from '.*/Icon'" src` — `App.tsx`, `AISettingsModal`, `ActivitiesPage`, `ArenaGame`, `BottomNav`, `CompanionHUD`, `CreateModal`, `EvolutionPath`, `ShopModal`, `TournamentPage` etc.) e `src/styles/iconScale.contract.test.ts` (09/09/2026).
**Régua:** exercitado por `src/components/ui/foundation.render.test.tsx`; a regra "ícone nunca dentro de box" é travada por teste próprio.
**Avisos do arquivo:** ícone NUNCA dentro de box — nenhuma moldura/fundo/borda/chanfro/padding, em nenhuma prop; se existir glifo próprio com o mesmo nome em `NavGlyphs.tsx`, o `Icon` o desenha, senão cai na ligature Material — a troca é invisível para quem chama.

### `src/components/ui/NavGlyphs.tsx`
**Dono de:** os glifos SVG próprios do Soulmon (nav + deck do aparelho + lista diária + moedas + utilitários) — mesma métrica da Material Symbols Rounded (caixa 24dp, traço 2.1×wght/500).
**Props principais:** `GlyphSvgProps` (exportado), `NavGlyphProps` (exportado) — `name`/`GlyphName`, `size`, `weight`, `fill`, `tone`.
**Exports:** `NavGlyphName` (type) · `GlyphName` (type) · `hasGlyph(name)` — existe glifo próprio? · `GLYPH_NAMES` (const, para inspeção/teste) · `GlyphSvgProps` (interface) · `GlyphSvg(props)` — o desenho puro, sem casca · `NavGlyphTone` (type) · `NavGlyphProps` (interface) · `NavGlyph` (`const`, `memo`) · `default`.
**Estado/efeitos relevantes:** `useState`/`useEffect`/`useId` para detectar `prefers-reduced-motion` (`reduced`).
**Chamado por:** `src/components/BottomNav.tsx`, `src/components/ui/Icon.tsx` (`grep -rl "from '.*/NavGlyphs'" src`, 09/09/2026).
**Régua:** exercitado por `src/components/ui/foundation.render.test.tsx`.
**Avisos do arquivo:** critério de corte é "um Material honesto é melhor que um glifo próprio feio" — nem todo ícone do app tem glifo próprio, de propósito; copiam a métrica do Material para não parecer adesivo colado.

### `src/components/ui/OfflineSeal.tsx`
**Dono de:** o selo discreto de "sem sinal" — cobre todas as telas sem redesenhar nenhuma, montado uma vez no topo do App.
**Props principais:** `OfflineSealProps` (exportado) — `language?`, `topOffset?` (o App empurra o selo abaixo de barra de status/notch sem que este componente saiba o que existe lá em cima).
**Exports:** `OfflineSealProps` (interface) · `useIsOnline()` (hook) · `OfflineSeal(props)` · `default`.
**Estado/efeitos relevantes:** `useState` (`online`); `useEffect` escuta `online`/`offline` do `navigator`.
**Chamado por:** `src/App.tsx`, `src/components/EvolutionPath.tsx` (`grep -rl "from '.*/OfflineSeal'" src`, 09/09/2026).
**Régua:** nenhuma direta (`find src/components/ui -maxdepth 1 -name 'OfflineSeal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** `cloud_off`, não `wifi_off` — o que falha é o save na nuvem/resposta da IA, não a antena; não bloqueia nada — offline é um modo, o jogo roda local; `role="status"` + `aria-live="polite"`.

### `src/components/ui/ScreenSkeleton.tsx`
**Dono de:** o que aparece enquanto uma tela `lazy()` chega — substitui os 20 `Suspense fallback={null}` que apagavam a tela.
**Props principais:** `ScreenSkeletonProps` (exportado) — `language?`, `label?` (rótulo do que está carregando, par PT/EN já resolvido por quem chama).
**Exports:** `ScreenSkeletonProps` (interface) · `ScreenSkeleton(props)` · `default`.
**Estado/efeitos relevantes:** `useState`/`useEffect` detectam `prefers-reduced-motion` (`reduced`) e cortam a varredura em JS (o bloco global do projeto usa `animation-duration:.01ms` que, num loop `infinite`, vira milhares de recálculos/segundo).
**Chamado por:** `src/App.tsx`, `src/components/ContentModals.tsx`, `src/components/SoulmonOnboarding.tsx` (`grep -rl "from '.*/ScreenSkeleton'" src`, 09/09/2026).
**Régua:** nenhuma direta (`find src/components/ui -maxdepth 1 -name 'ScreenSkeleton.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** o desenho é o do APARELHO (`Viewport` com varredura), não um spinner genérico; nenhuma classe utilitária de valor arbitrário — layout em `style={{}}`, `@keyframes` em `<style>` local (footgun 1).

### `src/components/ui/Viewport.tsx`
**Dono de:** o elemento de marca do Soulmon — a fronteira entre pixel (dentro) e vetor (fora); anel de cobre + tela, escala inteira (2 ou 3, nunca fracionária).
**Props principais:** `ViewportProps` (exportado) — `width`, `height`, `scale: 2|3`, `label?` (torna o elemento `role="img"`), conteúdo (sprite/HUD do aparelho).
**Exports:** `ViewportProps` (interface) · `usePrefersReducedMotion()` (hook) · `DUR_VARREDURA_MS` (const — os 400ms da varredura em JS, gêmeo do token `--sm2-dur-scan` do CSS) · `useVarreduraDeSintonia()` (hook — verdadeira só enquanto a faixa está passando) · `Viewport(props)` · `default`.
**Estado/efeitos relevantes:** `useState`/`useEffect` para `reduced` (reduced motion); `useRef` (`anterior`, guarda o sprite anterior para detectar troca) e `useState` (`varrendo`) dentro de `useVarreduraDeSintonia`.
**Chamado por:** `src/components/CompanionHUD.tsx`, `src/components/EvolutionPath.tsx`, `src/components/PetPage.tsx`, `src/components/PlayerDetailModal.tsx`, `src/components/ui/ScreenSkeleton.tsx` (`grep -rl "from '.*/Viewport'" src`, 09/09/2026).
**Régua:** `src/components/ui/Viewport.contract.test.tsx`; também exercitado por `src/components/ui/foundation.render.test.tsx`.
**Avisos do arquivo:** com `label`, o elemento vira `role="img"` — tudo dentro dele some da árvore de acessibilidade, por isso o corpo do aparelho (`.sm2-device`, com controles focáveis) fica FORA, envolvendo este componente, nunca dentro; respiração do anel é loop de 4s desligado por `prefers-reduced-motion`; sem scanline permanente por padrão — a varredura de 400ms é transição única, não estado do visor.

### `src/components/ui/sonner.tsx`
**Dono de:** o wrapper do Toaster (sonner) — canal de ERRO/OFFLINE/IA-INDISPONÍVEL do app inteiro (11 call-sites).
**Props principais:** repassa `ToasterProps` da lib `sonner@2.0.3`.
**Exports:** `Toaster` (re-export, repintado).
**Estado/efeitos relevantes:** `useAppTheme()` (função local) lê `document.documentElement.dataset.theme` via `useState`/`useEffect` com `MutationObserver` (o tema troca por mutação de atributo, não por evento).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/sonner'" src`, 09/09/2026).
**Régua:** nenhuma direta (`find src/components/ui -maxdepth 1 -name 'sonner.*test.ts*'` vazio, 09/09/2026); o contraste é travado por `src/styles/tokens.contrast.test.ts`.
**Avisos do arquivo:** era o scaffold shadcn/Figma intacto, lendo `next-themes` (nunca configurado neste app) e `--normal-bg: var(--popover)` (token congelado no claro, footgun 10) — medido em tema escuro, creme `#FFFCF0` com texto `#DC7609` a 13px dava 3,08:1 (abaixo de AA); corrigido para `--sm2-surface`/`--sm2-ink`; `next-themes` ficou sem consumidor no app depois desta troca.

### `src/App.tsx`
**Dono de:** o orquestrador do app inteiro — 6245 linhas (`wc -l src/App.tsx`, 09/09/2026): navegação de páginas, os handlers de todo gesto de jogo, os efeitos que gravam save/tocam som/disparam notificação, e a fila de intersticiais (`const interstitial`).
**Props principais:** não aplicável — é o componente raiz montado por `src/main.tsx`, consome `GameStateContext`/`ThemeContext` via hooks.
**Exports:** `App` (default export — componente raiz).
**Estado/efeitos relevantes:** 37 chamadas a `useState` (`grep -c "useState("`, 09/09/2026), incluindo as de página/modal: `showIntro`, `currentView: ViewType`, `editModalOpen`, `balanceOpen`, `taskEditModalOpen`, `createModalOpen`, `evolveModalStage`, `guideModalOpen`, `creditsOpen`, `newReadingOpen`, `rebirthOpen`, `resetOnboardingOpen`, `showEvolutionChoice`, `settingsOpen`, `showItemsWindow`, `showDailyReport`, `nightmareOpen`, `showFirstTaskPopup`, `hasShownFirstTaskPopup`, `showHelpModal` (`grep -noE` filtrado por page/modal/view/open/show, 09/09/2026). 22 componentes de tela/modal entram por `lazy(() => import(...))` (`grep -c "lazy("`, 09/09/2026) — ver a lista completa em cada entrada de componente correspondente ("Chamado por"). A fila de intersticiais (`const interstitial`, linha declarada por `SÍMBOLO` — busque por `grep -n "const interstitial" src/App.tsx`) decide qual overlay monta por vez, na ordem: primeiro dia → HP → semanal → triagem → priming → recomeço.
  - **Handlers `handle*`** (`grep -noE "const handle[A-Za-z0-9_]+ *=" src/App.tsx | sort -u`, 09/09/2026 — 79 ao todo): `handleAICreateActivity`, `handleAccountUnlocked`, `handleAddNewActivity`, `handleAddNewTask`, `handleAplicarEquilibrio`, `handleBuyCreditPack`, `handleCareEventComplete`, `handleChangeRestWindow`, `handleCheckInConfirm`, `handleCheckInSkip`, `handleClassTitlesComputed`, `handleCloseDailyReport`, `handleCloseNudge`, `handleCompleteOnboarding`, `handleCompleteTutorial`, `handleConfirmResetOnboarding`, `handleDecomposeTask`, `handleDegenerate`, `handleDeleteActivity`, `handleDeleteTask`, `handleDinoScore`, `handleDismissFreshStart`, `handleDismissHpBanner`, `handleDismissWeeklyReport`, `handleDropTask`, `handleDungeonEnemyDefeated`, `handleDungeonEnter`, `handleDungeonHeartDrop`, `handleDungeonLose`, `handleEarnGamePoints`, `handleEditActivity`, `handleEditTask`, `handleEquipBackground`, `handleEquipFurniture`, `handleEvolve`, `handleEvolveRequest`, `handleEvolveToUnlocked`, `handleExchangeCredits`, `handleFeed`, `handleFreshStart`, `handleGlitchtama`, `handleNewReading`, `handleNightmareWin`, `handleOpenAISettings`, `handleOpenItems`, `handleOpenTriage`, `handlePet`, `handlePickMood`, `handlePlay`, `handlePostponeNudge`, `handleProtectProgress`, `handleQuickAdd`, `handleRebirth`, `handleRecoverHearts`, `handleResetOnboarding`, `handleRestoreTask`, `handleRetrySprite`, `handleRevertVisor`, `handleSaveActivity`, `handleSaveTask`, `handleSeenTune`, `handleShopBuy`, `handleShower`, `handleShrinkTask`, `handleSkillsComputed`, `handleSleep`, `handleStepsDecline`, `handleStepsRequestPermission`, `handleToggleActivityCompletion`, `handleToggleAvisos`, `handleToggleEvolutionLock`, `handleToggleNotifications`, `handleToggleRestMetrics`, `handleToggleTask`, `handleTriageResolve`, `handleTuneVisor`, `handleUpdateStep`, `handleUpgradeRevealed`, `handleWatchAd`.
**Chamado por:** `src/main.tsx` (`grep -rl 'from "\./App' src`, 09/09/2026 — corrigido o comando em 10/09/2026 por doc-verificador: o padrão anterior, `grep -rl "from '.*/App'" src`, não batia com o import real de `main.tsx`, `import App from "./App.tsx"`, por causa das aspas duplas e da extensão `.tsx` explícita).
**Régua:** `src/hooks/useDailyReset.test.ts` (importa `computeDailyReset` de `utils/dailyReset.ts`, não duplica a regra); `src/components/filaDeAvisos.contract.test.ts` (as duas filas de avisos); `src/components/evolucaoManual.contract.test.ts`; `src/components/telemetryWiring.render.test.tsx`; `src/components/ofertaDoisCanais.contract.test.ts`; `src/components/p5DiaCompleto.contract.test.ts`; `src/components/upgradeReveal.contract.test.ts`; `src/components/textoBilingue.contract.test.ts`.
**Avisos do arquivo:** ⚠️ a contagem de linhas do arquivo mentiu cinco vezes em `CLAUDE.md` ("~1500", "~4700", "4489", "5772", "5991") antes de virar `wc -l` obrigatório no lugar de número fixo (09/09/2026 mediu 6245) — quem lê "1500" acha que o arquivo cabe num contexto e o lê inteiro à toa; side effects nunca dentro de updater do `setGameState` (StrictMode invoca 2×, footgun 6); "DUAS FILAS, e nada monta fora delas" (`filaDeAvisos.contract.test.ts`) — superfície nova de overlay entra numa das duas, com posição declarada.

### `src/main.tsx`
**Dono de:** o ponto de entrada do app — monta `App` dentro de `ErrorBoundary`/`ThemeProvider`/`GameStateProvider`, roda a migração de chaves legadas ANTES de qualquer provider, e remove a splash estática do `index.html`.
**Props principais:** não aplicável — script de bootstrap, sem componente.
**Exports:** nenhum (módulo de efeito, sem export).
**Estado/efeitos relevantes:** chama `migrateLegacyStorageKeys()` (`src/utils/storageKeys.ts`) antes de `createRoot(...).render(...)`, porque `GameStateProvider` lê o save no inicializador do próprio estado; remove o nó `#splash` com um `requestAnimationFrame` duplo (paint) + um `window.setTimeout(remover, 1200)` como rede de segurança independente do rAF.
**Chamado por:** ponto de entrada do Vite (referenciado em `index.html`), não importado por outro módulo do app.
**Régua:** nenhuma direta (`find src -maxdepth 1 -name 'main.test.ts*'` vazio, 09/09/2026); a migração em si é coberta por `src/utils/storageKeys.reconcile.test.ts` e `src/utils/storageKeys.migration.test.ts` (não existe `src/utils/storageKeys.test.ts` — corrigido por doc-verificador em 10/09/2026, `find src -iname 'storageKeys*'`).
**Avisos do arquivo:** ⚠️ até 27/08/2026 a rede de segurança da splash vivia DENTRO do duplo `requestAnimationFrame`, que nunca dispara em aba/WebView em segundo plano — a splash ficava para sempre por cima do app carregado ("não consigo passar da tela de loading"); o `setTimeout` foi movido para fora do rAF, agendado na hora; só os subsets `latin` 400/700 do Silkscreen são importados (não `latin-ext`, que não tem acento de PT-BR e custaria 6,8kB à toa).

