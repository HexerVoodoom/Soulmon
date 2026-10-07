# Referência — `src/components`

> **Dono:** doc-redator-referencia · **Data:** 07/10/2026 (sincronização `e3d55bb8..e71061b8`, Combate v3 PR1–PR18, prédios, missões, avatar: HomeMenuSheet ⚰️, PR18 em TorcidaKit/BattleStage, exports novos); anterior: 01/10/2026 (delta `bcfe7ca6..e3d55bb8`, PRs #189–#197, arte da rodada 3: `Corrida com obstáculos` (`DinoGame`/`PlaySheets`/`StatsPage`/`AreaView`) e `Honra` (`TournamentPage`, `MercadoSheets`, `ShopShelf`, `MapPage`, `HelpModal`, `RebirthModal`, `GmPanel`) — REGISTRO §17; arte nova em `DinoGame` (variantes), `TournamentPage` (`TierMark`), `RebirthModal` (ovo), `CompanionHUD` (mochila e sol), `FeiraVisor` (tipo × estado), `GroveVisor`/`GroveMilestoneCeremony`/`GuildOwnedShelf` (cenário pintado), `AreaView` (`HALL_BG`/`LABORATORIO_BG`), jogos da mente e do Refúgio (`visorScenes`)); anterior: 30/09/2026 (delta `cfe27cc7..3532ccf5`: `PasseioSheet` (entrada do PR conferida); `AreaView` (lote `passeio`, prop `passeio`), `CompanionHUD` (`walkingTo`), `DailyReportModal` (`adventure` como `Pick`), `AdventureDiary` (`findAnyById`), `GuideModal`/`HelpModal` (Passeio e Travessias), `App.tsx` (7076 linhas, 89 handlers, assentamento da noite)); anterior: 30/09/2026 (delta `ae366480..5edfcfba`: Ateliê da Mente/Refúgio/Salão em `AreaView`+`PlaySheets`, `DuelScreen` no `TournamentPage`, convite ao Refúgio e `createEntitlementSync` no `App`, `supportLine` no `ChatBox`, `cityLabel(city, isPt)`, `#pt` nos links de termos, `DUNGEON_BITS_FACTOR` no `clearBonus`, minijogos mudos); anterior: 30/09/2026 (sincronização `8e6d0d9a..ae366480`: `AreaTopBar` `covered`, `AreaView` `onLayerChange`); anterior: 29/09/2026 (sincronização da Guilda completa, delta `38c3ccb5..b657a340`: `guild/FeiraVisor.tsx`, `guild/GroveVisor.tsx`, `guild/GroveMilestoneCeremony.tsx` e `mercado/GuildOwnedShelf.tsx` NOVOS; `guild/GuildSheet.tsx` reescrito; `CoopPanel.tsx` vira reexport; `App.tsx`, `AreaView.tsx`, `AreaScene.tsx`, `AreaSheet.tsx`, `MercadoSheets.tsx`, `GuideModal.tsx`, `HelpModal.tsx`, `LibraryPage.tsx` reconferidos); anterior: delta `cf8a851d..38c3ccb5`: `guild/GuildSheet.tsx` NOVO; `nav/AreaSheet.tsx` com `lotNpcVoice`/`useBackLayer`) · **Estado:** verificado em 01/10/2026 por doc-redator-referencia (delta `bcfe7ca6..e3d55bb8`, só as entradas tocadas, conferidas símbolo a símbolo contra o fonte em `e3d55bb8`; sem verificador independente nesta rodada — `wc -l src/App.tsx` → 7076, `grep -c "const handle[A-Za-z0-9_]* *="` → 89, `grep -c "useState("` → 40); anterior: verificado em 30/09/2026 por doc-verificador (delta `ae366480..5edfcfba` — `wc -l src/App.tsx` → 7008; `grep -c "useState("` → 40; `grep -c "lazy("` → 20; `grep -c "const handle[A-Za-z0-9_]* *="` → 88 e a lista = `grep -o` do fonte; `grep -n "key: '"` → 11 avisos, `termos` último; `grep -rl "types'"` em `mente/`+`refugio/` → 6; exports de `AreaView.tsx`/`PlaySheets.tsx`/`supportLine.ts` e props de `DuelScreen`/`TournamentPage`/`AreaTopBar`/`CityPicker`/`DungeonGame` (`clearBonus` × `DUNGEON_BITS_FACTOR` = 0,4 → 4/6/8/10/12) lidos no fonte; corrigidos: 'o 8º e último item', '19 lazy', três handlers ausentes da lista, `#en` do Sobre sem lápide, comando `grep -l` sem `-r`, `Depende de` de `mente/types.ts`); anterior: verificado em 29/09/2026 por doc-verificador (entradas tocadas); anterior: 28/09/2026 (sincronização do delta `25fd3c41..f465d266`, PR #131: `PetPage` repassa `dominantElement` ao card de classe); anterior: 28/09/2026 (sincronização do delta `1d9e278d..8110efc5`: `AreaScene` perdeu o NPC anfitrião fixo; `AreaSheet` ganhou altura fixa 2/3 da tela, `lotId`/`language` e NPC por sub-loja via `lotNpcArt`); anterior: 27/09/2026 (sincronização do delta `c510c7e4..2336e4e7`: aviso da `OraclePage` corrigido para o D-B1); anterior: 27/09/2026 (sincronização do delta `78ef5367..c510c7e4`, correções pós-F3 da minimal-ui: `CornerLink` (prop `icon: 'mapa' | 'home'`, arte em pixel no lugar do glifo) e `MapPage` (a pílula `chip-moeda` em 9-slice no saldo); anterior: 24/09/2026 (fechamento F6 da minimal-ui: `ItemsWindow.tsx` perdeu a tela (só `getFoodName`/`getFoodDesc`), `MapPage`/`CornerLink`/`AreaSheet`/`AreaScene`/`AreaTopBar` atualizados, "Chamado por" de `ArenaGame`/`DinoGame`/`DungeonGame`/`RPSGame`/`Icon`/`NavGlyphs` trocados de `ActivitiesPage`/`BottomNav` para `AreaView`/`nav/*`); anterior: 22/09/2026 (5ª sincronização do dia, delta `89554b5d..c7bca6d`: `SoulmonOnboarding.tsx` — ⚰️ `FAVORITE_STEP` não renderiza nada, `favoriteCreature`/`skipFavorite` saíram do estado e do `writeOracleDraft`, degrau pulado nos dois sentidos, constante e `ORACLE_DRAFT_VERSION` mantidas de propósito; anterior: 22/09/2026 (3ª sincronização do dia, delta `cd66940f..cf6315e1`: `App.tsx` **6384 linhas** e **81** handlers (`handleDungeonFloorCleared` entrou), mais o bloco da execução das respostas (`ofereceDesfazer`, os 6 emissores de `BondEvent`, a trava #59, o teto de Bits, `rebirth-reset`, `missionPerfectDays`); `DungeonGame.tsx` **577 linhas** e a prop nova `onFloorCleared`; `ActivitiesPage.tsx` **306 linhas** repassando-a; `UndoToast.tsx` já entrou em `cf6315e1`; anterior: 2ª sincronização do dia: delta `a6c1cd8a..592e2c14`, QA Rodada 2 — ⚰️ `figma/ImageWithFallback.tsx` apagado; `CompanionHUD`/`EvolutionPath` `onError` no sprite próprio e falas do fallback em `PET_VOICE_LINES`; `FeedbackLink` `BUILD_ID`; `GameTutorialFlow` `falhaIa`; `MorningCheckIn` âncora visível; `SettingsPage` Termos; `SoulmonOnboarding` `aposAutenticar` + região viva; `FormKit.ActionRow` `language`/sr-only; `RitualPanel` `aria-disabled`; `App.tsx` `termsNoticePrimeiraVez`/selo/`PostponeNudgeSheet` ids/trilha por estado))) · **Estado:** verificado em 28/09/2026 por doc-verificador (delta `25fd3c41..f465d266` — passagens tocadas conferidas símbolo a símbolo contra o fonte; anterior: verificado em 28/09/2026 por doc-verificador (delta `1d9e278d..8110efc5` — entradas de `AreaScene` e `AreaSheet` conferidas símbolo a símbolo contra o fonte: ausência do bloco `data-area-npc` em `AreaScene.tsx`; `height`, `data-area-sheet-npc-zone`, `data-area-sheet-npc-line`, props `lotId`/`language`/`npcArt` em `AreaSheet.tsx`; `lotNpcArt`/`LOT_NPC_ART`/`PLACEHOLDER_NPC_ART` em `src/assets/soulmon/npcs/index.ts`); anterior: verificado em 27/09/2026 por doc-verificador (delta `78ef5367..c510c7e4` — as duas entradas conferidas contra `CornerLink.tsx` e `MapPage.tsx`; a entrada de `PixelIcon` já tinha entrado com `c510c7e4` e foi reconferida); anterior: verificado em 24/09/2026 por doc-verificador (minimal-ui F1–F6 em HEAD `78ef5367` — entradas alteradas e pastas `arena/`, `home/`, `mercado/`, `nav/`, `play/` conferidas símbolo a símbolo: `wc -l src/App.tsx` → 6659, `useState(` → 37, `lazy(` → 19, handlers → 81 (lista = `grep -o` do fonte), `CompanionHUD` → 66; lápides por `git log --diff-filter=D`: `BottomNav` `292533a6`, `ActivitiesPage` `708fa034`, `ShopModal` `ac631987`); anterior: verificado em 22/09/2026 por doc-verificador (delta `89554b5d..c7bca6d` — conferido no fonte: nenhum `step === FAVORITE_STEP` renderiza, `useState`/`setFavoriteCreature`/`setSkipFavorite` ausentes, `writeOracleDraft` sem as duas chaves, e o `OracleInput` sem `favoriteCreature`); anterior: verificado em 22/09/2026 por doc-verificador (delta `cd66940f..cf6315e1` — `wc -l` refeito nos três arquivos, `grep -c "const handle[A-Za-z0-9_]* *=" src/App.tsx` → 81, e cada símbolo citado conferido no fonte); anterior: verificado em 22/09/2026 por doc-verificador (delta `a6c1cd8a..592e2c14` — as entradas acima conferidas símbolo a símbolo contra o fonte; anterior no mesmo dia: delta `f4086ce0..a6c1cd8a`, QA Rodada 1 — seções tocadas conferidas símbolo a símbolo contra o fonte: `App.tsx` (`widgetPetName`, `limparOrigemDaUrl`, `changed`), `CompanionHUD.tsx` (`getFoodName`), `FeedbackLink.tsx` (`__APP_VERSION__`, `originLabel`), `GameTutorialFlow.tsx`, `ItemsWindow.tsx` (`getFoodName` exportado), `NotificationManager.tsx`, `SettingsPage.tsx` (Sobre/Ajuda), `SoulmonOnboarding.tsx` (`avisoContaExcluida`), `TermsUpdateBanner.tsx` (`changed`, `region`), `form/FormKit.tsx` (`mailto:`); anterior: delta `f02a3166..4a8b8049`, execução das respostas #11–#39 — `App.tsx`, `ChatBox.tsx`, `CompanionHUD.tsx`, `ErrorBoundary.tsx`, `FeedbackLink.tsx`, `NotificationManager.tsx`, ⚰️ `SettingsModal.tsx`, `SettingsPage.tsx`, `TermsUpdateBanner.tsx`; anterior: entradas `src/App.tsx`, `src/components/SettingsModal.tsx` e `src/components/SettingsPage.tsx`, delta `5ac3d351..8d318529`, som/S16 + grupo Som; o resto: mecânico completo; delta `dc72579e..9875477b` conferido símbolo a símbolo, sha a sha)
> **Estado:** verificado em 30/09/2026 por doc-mantenedor (delta `cfe27cc7..3532ccf5`, só as passagens tocadas, conferidas símbolo a símbolo contra o fonte em `3532ccf5` — `utils/travessias.ts`, `utils/travessiasSave.ts`, `types/travessias.ts`, `PasseioSheet.tsx`, `adventure.ts` › `adventureOfNight`, `playAreaLots.ts`, `CompanionHUD` › `walkingTo`, `GameStateContext` › `crossings`; sem verificador independente — subagentes `doc-*` não registrados); anterior: verificado em 30/09/2026 por doc-mantenedor (sem verificador independente nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — `_admin.js`, `gmTools.ts`, `corvoAdocao.ts`, `AreaTopBar.tsx`, `npcScale.ts`, `attributes.ts`; só as seções tocadas; delta `8e6d0d9a..ae366480`); anterior: verificado em 29/09/2026 por doc-mantenedor (sem a ferramenta Agent nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — exports de `_coop.js`/`guild.js`/`_profile.js`, módulos novos de `src/`, constantes e chaves de KV; delta `38c3ccb5..b657a340`, só as seções tocadas; `docsManual`/`docsSemMentira` verdes)
> **Verificação:** `npx vitest run src/docsManual.contract.test.ts` (item c — cobertura de referência) e a lista de `.test.tsx`/`.test.ts` citada em cada entrada.
> **Não cobre:** regra de negócio em profundidade (→ [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md)), fluxo de tela a tela (→ [03-FLUXO-DE-TELAS.md](../03-FLUXO-DE-TELAS.md)), identidade visual/tokens (→ [04-IDENTIDADE-VISUAL.md](../04-IDENTIDADE-VISUAL.md)).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

Uma entrada por módulo não-teste de `src/components` (91 módulos, `find src/components -type f \( -name '*.tsx' -o -name '*.ts' \) ! -name '*.test.ts*' | wc -l`, 09/09/2026) + `src/App.tsx` + `src/main.tsx` (orquestrador e ponto de entrada, fora da árvore `src/components` mas essenciais para achar quem chama cada componente). "Chamado por" é sempre `grep -rl` pelo nome do arquivo (import estático ou `lazy(() => import(...))`), não memória.

## Índice por página/família

- **Orquestração:** [`src/App.tsx`](#srcapptsx) · [`src/main.tsx`](#srcmaintsx) · [`ErrorBoundary.tsx`](#srccomponentserrorboundarytsx) · [`ContentModals.tsx`](#srccomponentscontentmodalstsx) · ⚰️ [`BottomNav.tsx`](#srccomponentsbottomnavtsx) · [`nav/CornerLink.tsx`](#srccomponentsnavcornerlinktsx) · [`nav/MapPage.tsx`](#srccomponentsnavmappagetsx) · [`nav/AreaTopBar.tsx`](#srccomponentsnavareatopbartsx) · ⚰️ `nav/HomeMenuSheet.tsx` (apagado em `0671982f`, 07/10/2026: o botão de avatar leva às Configurações) · [`IntroScreen.tsx`](#srccomponentsintroscreentsx)
- **Home e pet:** [`CompanionHUD.tsx`](#srccomponentscompanionhudtsx) · [`CareSystem.tsx`](#srccomponentscaresystemtsx) · [`ChatBox.tsx`](#srccomponentschatboxtsx) · [`PetPage.tsx`](#srccomponentspetpagetsx) · [`PetStageDecor.tsx`](#srccomponentspetstagedecortsx) · [`PlayCard.tsx`](#srccomponentsplaycardtsx) · [`GamePopups.tsx`](#srccomponentsgamepopupstsx) · [`FirstTaskCompletedPopup.tsx`](#srccomponentsfirsttaskcompletedpopuptsx) · [`nestArt.ts`](#srccomponentsnestartts) · [`evolution/SoulNode.tsx`](#srccomponentsevolutionsoulnodetsx) · [`evolution/nodeArt.tsx`](#srccomponentsevolutionnodearttsx) · [`RestWindowCard.tsx`](#srccomponentsrestwindowcardtsx) · [`DreamDex.tsx`](#srccomponentsdreamdextsx) · [`AdventureDiary.tsx`](#srccomponentsadventurediarytsx) · [`MorningDream.tsx`](#srccomponentsmorningdreamtsx) · [`NightmareBattle.tsx`](#srccomponentsnightmarebattletsx) · [`StepsCard.tsx`](#srccomponentsstepscardtsx) · [`StepRow.tsx`](#srccomponentssteprowtsx)
- **Atividades e tarefas:** [`DailyRituals.tsx`](#srccomponentsdailyritualstsx) · [`CreateModal.tsx`](#srccomponentscreatemodaltsx) · [`EditModal.tsx`](#srccomponentseditmodaltsx) · [`TaskEditModal.tsx`](#srccomponentstaskeditmodaltsx) · [`TaskMeta.tsx`](#srccomponentstaskmetatsx) · [`TriagePile.tsx`](#srccomponentstriagepiletsx) · [`QuickAddBar.tsx`](#srccomponentsquickaddbartsx) · [`EvolveTaskModal.tsx`](#srccomponentsevolvetaskmodaltsx) · [`HabitConstancy.tsx`](#srccomponentshabitconstancytsx) · [`MilestoneCeremony.tsx`](#srccomponentsmilestoneceremonytsx) · [`MorningCheckIn.tsx`](#srccomponentsmorningcheckintsx) · [`WeeklyReportCard.tsx`](#srccomponentsweeklyreportcardtsx) · [`FirstDayCard.tsx`](#srccomponentsfirstdaycardtsx)
- **Evolução:** [`EvolutionPath.tsx`](#srccomponentsevolutionpathtsx) · [`EvolutionCeremony.tsx`](#srccomponentsevolutionceremonytsx) · [`EvoTrail.tsx`](#srccomponentsevotrailtsx) · [`FormAlbum.tsx`](#srccomponentsformalbumtsx) · [`BestiaryCard.tsx`](#srccomponentsbestiarycardtsx) · [`RebirthModal.tsx`](#srccomponentsrebirthmodaltsx)
- **Jogos:** [`DungeonGame.tsx`](#srccomponentsdungeongametsx) · [`ArenaGame.tsx`](#srccomponentsarenagametsx) · [`DinoGame.tsx`](#srccomponentsdinogametsx) · [`RPSGame.tsx`](#srccomponentsrpsgametsx) · [`pixel/TimingBar.tsx`](#srccomponentspixeltimingbartsx) · [`games/GameKit.tsx`](#srccomponentsgamesgamekittsx)
- **Loja e economia:** [`mercado/MercadoSheets.tsx`](#srccomponentsmercadomercadosheetstsx) · [`mercado/ShopShelf.tsx`](#srccomponentsmercadoshopshelftsx) · [`home/Mochila.tsx`](#srccomponentshomemochilatsx) · [`ItemsWindow.tsx`](#srccomponentsitemswindowtsx) · [`CreditsModal.tsx`](#srccomponentscreditsmodaltsx) · [`UnlockAccountModal.tsx`](#srccomponentsunlockaccountmodaltsx)
- **Rituais e relatórios:** [`DailyReportModal.tsx`](#srccomponentsdailyreportmodaltsx) · [`MemoriesCard.tsx`](#srccomponentsmemoriescardtsx) · [`BalanceWeekModal.tsx`](#srccomponentsbalanceweekmodaltsx) · [`ProtectProgressModal.tsx`](#srccomponentsprotectprogressmodaltsx) · [`StatsPage.tsx`](#srccomponentsstatspagetsx) · [`BirthCard.tsx`](#srccomponentsbirthcardtsx)
- **Conta e configurações:** [`SettingsPage.tsx`](#srccomponentssettingspagetsx) · ⚰️ [`SettingsModal.tsx`](#srccomponentssettingsmodaltsx) (apagado em `4a8b8049`) · [`FeedbackLink.tsx`](#srccomponentsfeedbacklinktsx) · [`TermsUpdateBanner.tsx`](#srccomponentstermsupdatebannertsx) · [`AccountSection.tsx`](#srccomponentsaccountsectiontsx) · [`AccountDataSection.tsx`](#srccomponentsaccountdatasectiontsx) · [`AISettingsModal.tsx`](#srccomponentsaisettingsmodaltsx) · [`NotificationManager.tsx`](#srccomponentsnotificationmanagertsx) · [`InstallPrompt.tsx`](#srccomponentsinstallprompttsx) · [`GuideModal.tsx`](#srccomponentsguidemodaltsx) · [`HelpModal.tsx`](#srccomponentshelpmodaltsx) · [`GameTutorialFlow.tsx`](#srccomponentsgametutorialflowtsx) · [`WelcomePromptModal.tsx`](#srccomponentswelcomepromptmodaltsx) · [`CityPicker.tsx`](#srccomponentscitypickertsx)
- **Onboarding e oráculo:** [`SoulmonOnboarding.tsx`](#srccomponentssoulmononboardingtsx) · [`OraclePage.tsx`](#srccomponentsoraclepagetsx) · [`SoulTestItem.tsx`](#srccomponentssoultestitemtsx) · [`AlignmentIcons.tsx`](#srccomponentsalignmenticonstsx) · [`PixelizerCard.tsx`](#srccomponentspixelizercardtsx) · [`NewReadingModal.tsx`](#srccomponentsnewreadingmodaltsx)
- **Comunidade:** [`LibraryPage.tsx`](#srccomponentslibrarypagetsx) · [`PlayerDetailModal.tsx`](#srccomponentsplayerdetailmodaltsx) · [`CoopPanel.tsx`](#srccomponentscooppaneltsx) · [`TournamentPage.tsx`](#srccomponentstournamentpagetsx)
- **Infraestrutura de UI:** [`ConfirmDialog.tsx`](#srccomponentsconfirmdialogtsx) · [`PixelFrame.tsx`](#srccomponentspixelframetsx) · [`figma/ImageWithFallback.tsx`](#srccomponentsfigmaimagewithfallbacktsx) · [`form/FormKit.tsx`](#srccomponentsformformkittsx) · [`pixel/HomeHud.tsx`](#srccomponentspixelhomehudtsx) · [`pixel/PixelKit.tsx`](#srccomponentspixelpixelkittsx) · [`pixel/RitualPanel.tsx`](#srccomponentspixelritualpaneltsx) · [`ritual/RitualKit.tsx`](#srccomponentsritualritualkittsx) · [`pixel/SpriteAnim.tsx`](#srccomponentspixelspriteanimtsx) · [`pixel/VisorBar.tsx`](#srccomponentspixelvisorbartsx) · [`ui/BackArrow.tsx`](#srccomponentsuibackarrowtsx) · [`ui/Icon.tsx`](#srccomponentsuiicontsx) · [`ui/LockBadge.tsx`](#srccomponentsuilockbadgetsx) · [`ui/MiniGlass.tsx`](#srccomponentsuiminiglasstsx) · [`ui/NavGlyphs.tsx`](#srccomponentsuinavglyphstsx) · [`ui/OfflineSeal.tsx`](#srccomponentsuiofflinesealtsx) · [`ui/PixelIcon.tsx`](#srccomponentsuipixelicontsx) · [`ui/ScreenSkeleton.tsx`](#srccomponentsuiscreenskeletontsx) · [`ui/Viewport.tsx`](#srccomponentsuiviewporttsx) · [`ui/sonner.tsx`](#srccomponentsuisonnertsx)

---

### `src/components/AISettingsModal.tsx`
**Dono de:** modal de personalidade do companheiro — tom, intensidade de emoji, estilo de motivação e "mais opções" (instruções livres + temperatura) atrás de `Disclosure`.
**Props principais:** `AISettingsModalProps` — `isOpen`, `onClose`, `currentSettings: AISettings`, `onSave(settings)`, `language?` (se ausente, lê `resolveLanguage`/`STORAGE_KEYS` via `readLocal`).
**Exports:** `Disclosure(children, título)` — revelação colapsável para o avançado · `SwitchRow` — linha de configuração com alvo = linha inteira · `ActionRow` — linha que leva a outro painel/guia/política · `AISettingsModal(props)` — o modal.
**Estado/efeitos relevantes:** `useState` local (`open`, `s: AISettings`); `useEffect` resseta `s` quando `currentSettings`/`isOpen` mudam. `onSave` é quem persiste (o modal não grava sozinho).
**Chamado por:** `src/App.tsx`, `src/components/ChatBox.tsx`, `src/components/SettingsPage.tsx` (`grep -rl "from '.*/AISettingsModal'" src`, 21/09/2026 — ⚰️ o `SettingsModal.tsx`, que montava a segunda instância, foi apagado em `4a8b8049`).
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

### `src/components/catalog/CatalogMindNotice.tsx`
**Dono de:** o cartão de aviso (A1 da revisão de psicologia, `docs/reviews/2026-09-28-catalogo-psicologia.md`) mostrado antes de adicionar um item `optInOnly` do catálogo (protocolos de TCC da área "mente"). Disclaimer "autocuidado, não tratamento", a linha de crise reaproveitada de `chatSafety.crisisLineText`, as `contraindications` do item, e um checkbox "Entendi" que precisa estar marcado para o botão "Adicionar" habilitar.
**Props principais:** `CatalogMindNoticeProps` — `item: CatalogItem`, `language?`, `onCancel()`, `onConfirm()`.
**Estado/efeitos relevantes:** `useState` local (`understood: boolean`) — sem persistência; reabrir o cartão sempre começa desmarcado (não é dispensável para sempre, de propósito).
**Chamado por:** (ainda não ligado ao navegador de catálogo — F4 do plano); hoje só `src/components/catalog/CatalogMindNotice.render.test.tsx`.
**Régua:** `src/components/catalog/CatalogMindNotice.render.test.tsx`.

### `src/components/catalog/CatalogOnboardingFlow.tsx`
**Dono de:** o convite do catálogo (F3) — áreas/dificuldades/forças (até 3 cada) e a tela "Seu ponto de partida", com `recommendStarterSet`. Roda para jogador novo e antigo pelo MESMO mecanismo (ver `catalogOnboarding.ts`). Pulável em qualquer passo.
**Props principais:** `CatalogOnboardingFlowProps` — `language?`, `onSkip()`, `onComplete(chosen: CatalogItem[])`.
**Exports:** `CatalogOnboardingFlow(props)` · `activitiesFromCatalogChoice(items)` — monta as `Activity` (nível 1, agenda do nível 1 do item, id novo).
**Chamado por:** `src/App.tsx` (intersticial `catalogOnboarding`, menor prioridade da fila).
**Régua:** `src/components/catalog/CatalogOnboardingFlow.render.test.tsx`.

### `src/components/catalog/CatalogBrowserModal.tsx`
**Dono de:** o navegador do catálogo (F4) — busca, abas por área, cartão "por que funciona", "Algo que não está aqui?" (abre o `CreateModal` legado, inalterado). Item `optInOnly` abre `CatalogMindNotice` antes de adicionar.
**Props principais:** `CatalogBrowserModalProps` — `isOpen`, `onClose()`, `language?`, `onAdd(item)`, `onCreateFromScratch()`.
**Chamado por:** `src/App.tsx` (substitui a abertura direta do `CreateModal` pelo botão "+" — `handleAddNewActivity`).
**Régua:** `src/components/catalog/CatalogBrowserModal.render.test.tsx`.

### `src/components/catalog/CatalogLevelInviteModal.tsx`
**Dono de:** o convite de subir/descer nível de um item do catálogo (F4, `utils/catalogLevel.ts`). A6 da revisão de psicologia: o convite de descer nunca mostra "descer" nem "Nível 1" (`catalogLevelDownCopy`), botões com peso visual igual.
**Props principais:** `CatalogLevelInviteModalProps` — `isOpen`, `direction: 'up'|'down'`, `itemName`, `language?`, `onAccept()`, `onDecline()`.
**Chamado por:** `src/App.tsx` (intersticial `catalogLevelInvite`, gatilho real via `utils/catalogLevelSignal.ts` → `pickCatalogLevelInviteCandidate` — CAT-7 fechado).
**Régua:** `src/components/catalog/CatalogLevelInviteModal.render.test.tsx`.

### `src/components/AccountSection.tsx`
**Dono de:** bloco "Conta & compras" dentro do grupo "Sua conta" da `SettingsPage` — sair da conta e restaurar compras.
**Props principais:** `AccountSectionProps` — `language`, `onEntitlementChange?(ent: Entitlement)`.
**Exports:** `AccountSection(props)`.
**Estado/efeitos relevantes:** `useState` (`ent`, `authEmail`, `restoring`, `message`); `useEffect` busca `fetchEntitlement` e `getCurrentEmail` ao montar. Chama `restorePurchases`/`isBillingAvailable` de `src/utils/playBilling.ts` e `signOut` de `src/utils/auth.ts`.
**Chamado por:** `src/components/SettingsPage.tsx` (`grep -rl "from '.*/AccountSection'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'AccountSection.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** "Restaurar compras" não é opcional — a Play exige restauração para compras não consumíveis, sem isso quem reinstala perde o que pagou; "Sair da conta" é ação comum, sem vermelho `#e0483e` cravado.

### `src/components/ActivitiesPage.tsx` — ⚰️ apagado em `708fa034`
⚰️ **`ActivitiesPage.tsx` saiu em 24/09/2026 (minimal-ui F5, Exploração + Jogos).** O hub de cartões virou lotes nas áreas do Mapa: Masmorra e Corrida do Dino na Exploração, Pedra-papel-tesoura em Jogos — ver `src/components/nav/AreaView.tsx` e `src/components/play/PlaySheets.tsx`. O Torneio e o Duelo moram na área Arena.

### `src/components/AdventureDiary.tsx`
**Dono de:** diário de aventuras — o que a criatura trouxe, noite após noite; mora ao lado do Dex de Sonhos na página do pet.
**Props principais:** `AdventureDiaryProps` — `entries: {id, day}[]` (ordem de coleta), `language`.
**Exports:** `AdventureDiary(props)`.
**Estado/efeitos relevantes:** nenhum estado local — apresentação pura sobre `entries`; lê `findAnyById` de `src/utils/travessias.ts` (desde `3532ccf5`, resolve também os postais `trv-*` das regiões; ⚰️ era `findById` de `src/utils/adventure.ts`) e `ADVENTURE_ART` de `src/utils/adventureArt.ts`.
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
**Dono de:** a Arena — cinco rodadas em GRUPO (N × 1) contra criaturas do bestiário, no núcleo do Combate v3 (PR3b): o pet é `soulCombatant`, os inimigos lutam ao mesmo tempo, o relógio é o do núcleo (`games/useGroupBattle.ts`); anel de 17 elementos e a habilidade especial da ficha (família provisória por escola até o PR9). Lê o level do save por `useGameStateOptional()` (sem provider, cai no estágio).
**Props principais:** `ArenaGameProps` (exportado).
**Exports:** `ArenaGameProps` (interface) · `ArenaGame(props)`.
**Estado/efeitos relevantes:** `useState` para `pool`, `fase` (`carregando`/`sem-motor`/`intro`/`luta`/`rodada-limpa`/`venceu`/`perdeu`/`empatou`), `rodada`, `inimigos` (só o sabor), `pontos`, `sprites`, `fightKey`; refs para a semente da run, o HP e a energia que passam de uma rodada para a outra; `useGroupBattle` roda a luta. Derrota e empate encerram a run sem custo (não escreve no save).
**Chamado por:** `src/components/nav/AreaView.tsx` (lote Duelo da Arena, minimal-ui F5; ⚰️ até então `ActivitiesPage.tsx`) (`grep -rl "ArenaGame'" src`, 24/09/2026).
**Régua:** `src/components/ArenaGame.render.test.tsx` (as fases que não são a luta) e `ArenaGame.torcida.render.test.tsx` (a luta em grupo: cheer, anel com o relógio pausado, especial em área × único, derrota/empate/vitória, pausa, movimento reduzido); os balanços moram em `src/utils/arena.v3.test.ts`.
**Cena (02/10/2026, rodada 5/I10):** a LUTA (sem as flags de timing) é a `BattleStage` em tela cheia, não mais o visor 348×160: golpes com a arte do elemento da skill básica/especial da ficha (físico investe, o resto atira; o escudo da defesa automática é o do elemento do defensor) e X com confirmação (a corrida se perde). Intro, rodada limpa e resultado seguem no layout antigo. **PR3b:** a luta é sempre a `BattleStage` (os caminhos antigos de barra de timing e de carga em turnos saíram).
**Energia (PR3b, Combate v3):** a energia vem do evento do núcleo ("uma barra, um uso"); a barra de cheer (`CHEER_TAPS_FULL` = 24, no máximo 16 toques por janela de 3 s) despeja uma descarga que o núcleo recolhe por `cheerDrain`; só o chefe mostra barra de energia nos inimigos. Energia cheia = o `cast` PAUSA o relógio e o anel devolve o multiplicador do especial; o `cast` do inimigo abre a esquiva. A explicação da intro mora atrás de um `InfoTip`.
**Avisos do arquivo:** ⚠️ as constantes de balanço (`ARENA_FOES` etc.) são MEDIDAS por `_sim/cv3-medir/grupo.ts` — recalibrar por ele, nunca à mão (risco R1: power do DoT 0,85→1,1 vai de 56% a 79%). Sem `Math.random`: a luta é função da semente.

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
**Props principais:** `BirthCardProps` — `spriteUrl?`, `name`, `epithet?` (linha de essência do oráculo), `soulGoal?` (o que a pessoa escreveu no início), `bornAt?` (`YYYY-MM-DD`, dia do jogador), `language`, `pending?` (novo — estado de geração de sprite ainda em curso) `silhouette?` (novo — desenha silhueta em vez do sprite, enquanto `pending`).
**Exports:** `BirthCard(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — função `dataPorExtenso` interna converte `bornAt` em data por extenso sem ano numérico.
**Chamado por:** `src/components/SoulmonOnboarding.tsx`, `src/components/StatsPage.tsx` (`grep -rl "from '.*/BirthCard'" src`, 09/09/2026).
**Régua:** `src/components/BirthCard.render.test.tsx`.
**Avisos do arquivo:** nenhum número (nem dias, nem nível, nem contagem) — é certidão, não painel; nenhum verbo de personalidade fechada — diz DE ONDE a criatura veio, nunca COMO ela é; data por extenso, sem ano-mês-dia numérico.

### `src/components/BottomNav.tsx` — ⚰️ apagado em `292533a6`
⚰️ **Apagado na fatia F1 do minimal-ui (23/09/2026, branch `feat/nav-home-mapa`).** A barra inferior de 5 abas saiu (decisão 1 do dono); a navegação virou Home ↔ Mapa → áreas — ver `src/components/nav/*` abaixo e `src/navigation.ts`. A régua `BottomNav.render.test.tsx` foi reescrita como `src/components/nav/nav.render.test.tsx`, e `navRotulo.contract.test.ts` passou a medir os rótulos das áreas.

### `src/components/mente/BolhasGame.tsx`
**Dono de:** Bolhas do Sonho — `mode='foco'` no Ateliê da Mente (paga pelo funil) e `mode='calma'` no Refúgio (nunca chama `onEarnPoints`). Bolhas são botões movidos por intervalo (não animação CSS, que o movimento reduzido zeraria). Delta `bcfe7ca6..e3d55bb8` (01/10/2026, leva `visores`): o visor tem o fundo `REFUGIO_SCENE` (`<GameVisor scene>`) e as formas são sprites 48² de `MINI_FX` — `bolhaSonho` (bolha de vidro com estrela) e `fiapo` (fio ondulado escuro; a distinção segue sendo de forma, não só de cor), e os efeitos de estouro `pop`/`fumaca`; ⚰️ as bolhas em CSS (círculo com borda tracejada e `radial-gradient`) saíram.
**Exports:** `BolhasGame(props: MiniGameBaseProps & { mode; onEarnPoints? })`.
**Depende de:** `src/utils/mente/bolhas.ts`, `src/utils/visorScenes.ts` (`MINI_FX`, `REFUGIO_SCENE`).
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy).
**Régua:** `src/components/mente/ecoBolhas.render.test.tsx`; a fiação em `src/components/play/playArea.render.test.tsx`.

### `src/components/mente/EcoGame.tsx`
**Dono de:** Eco do Pet — o pet acende as 4 pedras (forma + nome, nunca só cor), o jogador repete; o erro encerra a rodada com "Maior eco: N". Delta `bcfe7ca6..e3d55bb8` (01/10/2026, leva `visores`): o visor tem o fundo `ATELIE_SCENE`; `StoneShape({ stone, size })` (perdeu a prop `color`) desenha o sprite 48² `MINI_FX.pedras[stone]` — anel, losango, quadrado e triângulo com engaste de cobre, então a FORMA da própria arte cumpre "forma e nome, não só cor"; a cor do kit segue só no brilho e no sublinhado do nome. ⚰️ pedras em `clip-path`/`border-radius`.
**Exports:** `EcoGame(props: EarningGameProps)`.
**Depende de:** `src/utils/mente/eco.ts`, `src/utils/visorScenes.ts` (`ATELIE_SCENE`, `MINI_FX`).
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy).
**Régua:** `src/components/mente/ecoBolhas.render.test.tsx`; a fiação em `src/components/play/playArea.render.test.tsx`.

### `src/components/mente/PicrossGame.tsx`
**Dono de:** Nonograma da Malha — desenho do dia + "Outros"; pintar/marcar X por botão ou toque longo, desfazer ilimitado, revela o desenho no visor. Paga por tamanho (`picrossBits`); o bônus do dia é pago uma vez por dia do jogador no aparelho (`STORAGE_KEYS.PICROSS_DAILY_PAID`).
**Exports:** `PicrossGame(props: EarningGameProps & { todayKey })`.
**Depende de:** `src/utils/mente/picross.ts`, `picrossPatterns.ts`.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy).
**Régua:** `src/components/mente/trocaPicross.render.test.tsx`; a fiação em `src/components/play/playArea.render.test.tsx`.

### `src/components/mente/RevisaoGame.tsx`
**Dono de:** Revisão da Malha — início (cartões para hoje), lista (criar/editar/apagar com confirmação), sessão (pet pergunta → mostrar resposta → Lembrei / Ainda não). Grava a cada resposta via `onReviewChange`. Delta `bcfe7ca6..e3d55bb8` (01/10/2026): o `GameVisor` ganhou o fundo `ATELIE_SCENE`.
**Exports:** `RevisaoGame(props: EarningGameProps & { review; onReviewChange; todayKey })`.
**Depende de:** `src/utils/mente/revisao.ts`, `src/utils/visorScenes.ts` (`ATELIE_SCENE`).
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy).
**Régua:** `src/components/mente/revisaoRespiracao.render.test.tsx`; a fiação em `src/components/play/playArea.render.test.tsx`.

### `src/components/mente/TrocaGame.tsx`
**Dono de:** Troca de Regra — a carta é o visor (criatura 64 = jovem / 128 = crescida; céu claro / gruta escura); a regra da vez no topo pulsa ao trocar; separar por botão, arrastar ou setas. 30 cartas ou 60 s. Delta `bcfe7ca6..e3d55bb8` (01/10/2026, leva `visores`): `SKY_BG`/`CAVE_BG` passam por `trocaCeuScene(fallback)`/`trocaGrutaScene(fallback)` — faixas pintadas, com o degradê antigo só como cor de reserva.
**Exports:** `TrocaGame(props: EarningGameProps)`.
**Depende de:** `src/utils/mente/troca.ts`, `src/utils/visorScenes.ts` (`trocaCeuScene`, `trocaGrutaScene`).
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy).
**Régua:** `src/components/mente/trocaPicross.render.test.tsx`; a fiação em `src/components/play/playArea.render.test.tsx`.

### `src/components/mente/types.ts`
**Dono de:** o contrato comum dos jogos dos prédios de Jogos (30/09/2026) e as regras que todos cumprem (nascem mudos, não prometem efeito cognitivo, sem vermelho).
**Exports:** `MiniGameBaseProps`, `EarningGameProps`.
**Depende de:** `utils/i18n` (só o tipo `Language`).
**Chamado por:** os seis componentes de jogo que o importam (`BolhasGame`, `EcoGame`, `PicrossGame`, `RevisaoGame`, `TrocaGame` em `src/components/mente/` e `RespiracaoGame` em `src/components/refugio/`; `grep -rl "types'" src/components/mente src/components/refugio`, 30/09/2026).
**Régua:** indireta (tsc); a fiação em `src/components/play/playArea.render.test.tsx`.

### `src/components/nav/AreaTopBar.tsx`
**Dono de:** o topo de uma área do Mapa e das páginas do menu da Home — voltar (seta em círculo, exceção D1 do dono) + título centralizado.
**Props principais:** `icon?` (`'map'` nas áreas, `'arrow_back'` padrão — 29/09/2026), `overScene?` (topo sobre o fundo full-screen: tinta `#E9F5F2` + scrim), `covered?` (há folha/jogo/duelo aberto: o topo some por `visibility:hidden`, sai do foco e da árvore de acessibilidade), `title`, `backLabel` (diz PARA ONDE), `onBack`, `ownsHeading?` (`false` quando a página de baixo já tem `<h1>`: o título vira `<p aria-hidden>`; desde a F5 o `App` não passa mais — nenhuma área tem página dona do `<h1>` —, fica o padrão `true`).
**Exports:** `AreaTopBar(props)`. Delta `ae366480..5edfcfba`: com `icon="map"` o botão voltar renderiza `PixelIcon name="mapa"` (32 px, o MESMO ícone ilustrado do `CornerLink` da Home — pedido do dono, 30/09/2026); `arrow_back` segue `NavGlyph`. ⚰️ o glifo `map` de `NavGlyphs` deixou de ser usado aqui.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/components/nav/nav.render.test.tsx`.

### `src/components/nav/npcScale.ts`
**Dono de:** a escala do NPC na folha do lote — `NPC_SCALE = 1.4` (pedido do dono, 29/09/2026), sobre o teto de largura anterior de 46% (`NPC_BASE_MAX_WIDTH_PCT`); a altura segue limitada pela zona de 1/3 da tela. ⚰️ `NPC_PORTRAIT_ZOOM` (1,4×) saiu em 07/10/2026 (o zoom era do avatar, não do NPC do mapa): o NPC tem o tamanho de antes e `NPC_BASE_UNDER_SHEET` (0,04 da altura da arte) é quanto da base entra sob a folha. Segue o `AVATAR_PORTRAIT_ZOOM` 1,3 nas miniaturas de avatar (`AvatarImg`, já recortadas em círculo).
**Exports:** `NPC_SCALE`, `NPC_BASE_MAX_WIDTH_PCT`, `NPC_MAX_WIDTH_PCT`, `NPC_BASE_UNDER_SHEET`, `AVATAR_PORTRAIT_ZOOM`, `AVATAR_PORTRAIT_ORIGIN`.
**Chamado por:** `src/components/nav/AreaSheet.tsx`, `src/components/ui/AvatarImg.tsx`.
**Régua:** `src/components/nav/areaShell.render.test.tsx`.

### `src/components/nav/sheetKit.ts`
**Dono de:** o CARD de dentro de uma folha de lote (01/10/2026, I1/I2 da navegação do dono) — toda opção escolhível dentro de uma folha (jogo do Salão/Ateliê/Refúgio, proposta e região de Travessia) é um bloco com fundo `surface-2`, traço `line`, raio `radius-md` e respiro `space-3` entre vizinhos, nunca uma linha com filete. Só tokens existentes (`04-IDENTIDADE-VISUAL.md` §4).
**Exports:** `sheetCard`, `sheetCardList`, `sheetCardTitle`.
**Chamado por:** `src/components/play/PlaySheets.tsx`, `src/components/play/PasseioSheet.tsx`.
**Régua:** `src/components/play/playArea.render.test.tsx`.

### `src/components/arena/DueloSheet.tsx`
**Dono de:** a folha do lote **Duelo** da Arena (minimal-ui F5, 24/09/2026) — mostra a ficha (elemento e habilidade especial do estágio, de `soulmonSkills`; sem ficha no aparelho, o par padrão) e abre a `ArenaGame` em tela cheia. Não decide nada da luta: rodadas (`ARENA_ROUNDS`), balanceamento e recompensa (Bits) continuam na `ArenaGame`.
**Props principais:** `language`, `evolutionStage`, `skills?`, `onStart`.
**Exports:** `DueloSheet(props)`.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy, dentro do `AreaSheet` da Arena).
**Régua:** `src/components/arena/arenaSheets.render.test.tsx`.

### `src/components/mercado/MercadoSheets.tsx`
**Dono de:** o conteúdo das 4 lojinhas do Mercado (minimal-ui F5, 24/09/2026; mock `product/squad-minimal-ui/propostas/loja/mock.html`, citado no cabeçalho do arquivo — fora do repositório) — `MercadoStallSheet` (Itens / Decoração / Background, com abas POR MOEDA vindas de `STALL_CURRENCIES`; saldo sempre da moeda da aba; aba de Créditos = a troca Créditos → Bits + o convite passivo `UnlockNudge reason="shop"` só para `demo`) e `ConquistasSheet` (as missões de `utils/missions.ts` filtradas por `category`, sem moeda nenhuma; sem "0/N" sem progresso — WP4.12). Substitui a `ShopModal` (⚰️ 24/09/2026). **Honra (30/09/2026, `docs/REGISTRO-DE-DECISOES.md` §17):** o rótulo da moeda `emblems` na aba e na linha de status é "Honra"/"Honor" (⚰️ "Emblemas"/"Emblems", que reverteu a D3 de 23/09/2026); só o RÓTULO mudou — o id `'emblems'`, o campo do save e `STALL_CURRENCIES` continuam.
**Props principais:** `MercadoStallProps` — `stall`, `language`, `points`/`emblems`/`credits`, posse (`ownedBackgrounds`, `equippedBackground`, `ownedFurniture`, `equippedDecor`, `missionProgress`), `onBuy`/`onEquip`/`onEquipFurniture`, `onExchangeCredits`, `accountTier?`, `onUnlock?`.
**Exports:** `MercadoStallSheet(props)`, `MercadoStallProps`, `ConquistasSheet(props)`. Desde a Guilda os segmentos Background e Decoração abrem com o `GuildOwnedShelf` ("Do bosque", só equipa) antes dos ~20 cenários da loja.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy, dentro do `AreaSheet` do Mercado).
**Régua:** `src/components/mercado/MercadoSheets.render.test.tsx`, `src/utils/mercadoCatalog.test.ts`, `src/components/ofertaDoisCanais.contract.test.ts`.

### `src/components/mercado/ShopShelf.tsx`
**Dono de:** as peças da loja (canvas Loja, D-L1…D-L11), extraídas da `ShopModal` para servir o Mercado e a loja de Emblemas do Torneio — o card de item (mini-visor, estados por FORMA: travado, equipado, comprado, sem saldo em âmbar), o saldo de UMA moeda, a região `status`, a troca Créditos → Bits e a lista das missões da semana. Não decide compra: `onBuy` é o `handleShopBuy` do `App.tsx`; a prateleira descarta item de outra moeda (defesa das três moedas). Desde 30/09/2026 a unidade da moeda `emblems` aparece como "Honra"/"Honor" no preço, no `aria-label` do card e no resgate da missão ("Receber N de Honra"); ⚰️ "Emblemas"/"Emblems" (REGISTRO §17; o identificador `isEmblem` e o campo `mission.emblems` não mudaram).
**Exports:** `ShopShelf(props)`, `CurrencyBalance(props)`, `CreditExchange(props)`, `WeeklyMissionList(props)`, `ShopStatus(props)`, `useShopFlash()`, `Bits(props)`, `shopTagStyle`, `ShopFlash`, `ShopOwnership`, `ShopActions`.
- Também exporta `bgThumb`, `DecorRuleLine`, `PurchaseQuestion`, `PurchaseConfirmSheet` e `HowToEarnSheet` (confirmação de compra e "como ganhar", rodada 8).
**Chamado por:** `src/components/mercado/MercadoSheets.tsx`, `src/components/TournamentPage.tsx`; `src/components/nav/AreaView.tsx` importa só os tipos `ShopOwnership`/`ShopActions` (24/09/2026).
**Régua:** `src/components/mercado/MercadoSheets.render.test.tsx`, `src/components/arena/arenaSheets.render.test.tsx`, `src/utils/weeklyMissions.fiacao.test.ts`.

### `src/components/mercado/ShopItemSheet.tsx`
**Dono de:** a FOLHA DO ITEM da lojinha (I5/I6, 02/10/2026): tocar num item abre um bottom sheet com as opções (Comprar / Equipar / Tirar) e um PREVIEW GRANDE — o ícone do item solto, SEM o quadradinho de vidro, centrado na área escurecida acima da folha (portal em `document.body`, decorativo); para cenário a miniatura abre o LIGHTBOX (fundo escurecido, arte grande, ✕ no topo esquerdo, fecha ao tocar fora). A compra real continua na `PurchaseConfirmSheet`. Também dono da pílula Interno/Externo/Qualquer da decoração.
**Props principais:** `item`, `language`, `currency`, `balance`, `owned`, `equipped`, `onClose`, `onBuy`, `onEquip`, `bitsPrice`, `emblemPrice` (render props do preço).
**Exports:** `ShopItemSheet`, `BackgroundLightbox`, `DecorFitTag`.
**Depende de:** `ModalSheet` (`form/FormKit`), `useDialogA11y`, `utils/decorRules.ts` › `decorFitLabel`.
**Chamado por:** `src/components/mercado/ShopShelf.tsx` (`DecorFitTag` também no card da peça).
**Régua:** `src/components/mercado/ShopItemSheet.render.test.tsx`.

### `src/components/nav/AreaView.tsx`
**Dono de:** UMA área do Mapa inteira (minimal-ui F5, 24/09/2026) — a `AreaScene`, o lote aberto (`AreaSheet`, estado LOCAL; o `App` monta com `key` da view, então trocar de área fecha a folha) e o conteúdo: no Mercado as 4 lojinhas (fundo, arte dos lotes e os vendedores de `STALL_NPC_ART`), na Arena o Torneio (`TournamentPage` com a loja de Emblemas) e o Duelo (`DueloSheet` → `ArenaGame` em tela cheia); na Exploração a Masmorra e a Corrida com obstáculos (⚰️ "Corrida do Dino"; o id de jogo `dino` não mudou), em Jogos o Pedra, papel e tesoura (folhas-porta de `play/PlaySheets.tsx` → `DungeonGame`/`DinoGame`/`RPSGame` em tela cheia, com os handlers de `play`); no Laboratório a folha com as abas Evolução/Soulmon/Stats (`labContent`, montado no `App`) e no Hall a Biblioteca (`hallContent`, `LibraryPage` `embedded`). Consolidado das PRs #117 e #118. Entra por `lazy()` no `App` para ficar fora do chunk de entrada (orçamento de bytes, decisão #31). Não decide regra: compra, troca, partida e luta chegam prontas por props.
**Props principais:** `AreaViewProps` — `area`, `language`, `ownership`/`actions` (os mesmos para Mercado e Torneio), `points`/`emblems`/`credits`, `onExchangeCredits`, `accountTier?`/`onUnlock?`, `tournament` (as props do `TournamentPage` menos `shop`), `evolutionStage`, `demoCharacterId?`, `skills?`, `onEarnPoints`, `play: PlayHandlers` (masmorra/dino/sumidouro de Bits), `labTab`, `labContent`, `hallContent`, `onLayerChange?` (29/09/2026: avisa o `App` quando há camada de tela cheia — folha, jogo ou duelo; o `App` guarda em `areaLayerOpen` e passa `covered` ao `AreaTopBar`; o cleanup do efeito avisa `false`), `passeio?` (desde `3532ccf5`: `{ crossings, onChange(f) }` — o estado `GameState.crossings` e o ÚNICO caminho de escrita, uma função pura de `utils/travessias` aplicada sobre `prev` no `App`; o lote `passeio` da Exploração abre `PasseioSheet` lazy, com `CROSSINGS_EMPTY` na falta da prop).
**Delta `bcfe7ca6..e3d55bb8` (01/10/2026, fundos-v2):** a cena do Laboratório e a do Hall passam `background={LABORATORIO_BG}` e `background={HALL_BG}` (de `assets/soulmon/areas`) à `AreaScene`; as outras continuam com `AREA_BG`/`PLAY_AREA_BG`.
**Exports:** `AreaView(props)`, `AreaViewProps`, `PlayHandlers`, `LabTab`, **`PlayGame`** (novo como export: `'masmorra' | SalaoGame | MenteGame | RefugioGame`, os tipos de `play/PlaySheets`; ⚰️ era `'masmorra' | 'dino' | 'ppt'` e não exportado). **Delta `ae366480..5edfcfba` (30/09/2026, os três prédios de Jogos):** os lotes de Jogos abrem `SalaoSheet`/`MenteSheet`/`RefugioSheet` (lazy; ⚰️ `DinoSheet`/`PptSheet` não são mais lazy-importados aqui — entram dentro do `SalaoSheet`); a folha da Masmorra recebe `bitsToday`; `MenteSheet` recebe `reviewDue = dueCards(review, todayKey).length`. `PlayHandlers` ganhou `todayKey?` (dia do JOGADOR; sem ele cai no dia UTC do aparelho), `review?`/`onReviewChange?` (os cartões da Revisão, que moram em `GameState.review`; sem eles, `REVIEW_EMPTY`) e `minigameBitsToday?`. `AreaViewProps` ganhou `initialGame?: PlayGame` e `onInitialGameConsumed?` — abre um jogo direto ao montar (o convite ao Refúgio abre `respiracao`), one-shot: o `useState` do jogo nasce de `props.initialGame` e um efeito de montagem chama `onInitialGameConsumed`. Jogos em tela cheia novos, lazy: `EcoGame`, `BolhasGame` (`mode="foco"` paga; `"calma"`, id `bolhas-calmas`, NÃO recebe `onEarnPoints`), `TrocaGame`, `PicrossGame` (`todayKey`), `RevisaoGame` (`todayKey`/`review`/`onReviewChange`) e `RespiracaoGame` (sem `onEarnPoints`: "não pagam, não pontuam"); todos recebem um `base` comum (`evolutionStage`, `demoCharacterId`, `language`, `onExit`). A prop `guild` mudou de forma com a Guilda completa: `{ saveId, metaDoDiaCumprida, playerDayTz?, fioGoal?, mySprite?, onClaimed?, onScenes?, accountTier?, onUnlock?, onLogin? }` — o **Hall** abre o `GuildSheet room="salao"` (lote `guilda`) e a **Arena** abre `room="feira"` (lote `feira`, no lugar do antigo `guilda` da Arena; `GUILDA_LOT_ART` deixou de ser usado ali).
**Chamado por:** `src/App.tsx` (lazy).
**Régua:** `src/components/nav/areaShell.render.test.tsx` (o molde), `src/components/mercado/MercadoSheets.render.test.tsx`, `src/components/arena/arenaSheets.render.test.tsx`, `src/components/play/playArea.render.test.tsx`, `src/components/nav/areaLabHall.render.test.tsx`.

### `src/components/guild/FeiraVisor.tsx`
**Dono de:** o visor da Feira (`PLANO-GUILDA.md` §9, WPG-10) — o fenômeno da semana em três estados (aberto, ferido, dissipado) e quatro tipos. ⚰️ **Era PLACEHOLDER** até a rodada 3 (30/09/2026): agora a arte real de `utils/fairArt.ts` é lida por TIPO × ESTADO — `FAIR_ART[fairFenomenoId(raid.phenomenon, state)]` (12 ids `fair-fenomeno-<tipo>-<estado>`, `<img data-fair-fenomeno>`) — e o FX do tipo (`fairFxId`) é um motivo 128² desenhado a 64 px nos dois cantos de cima (o da direita espelhado, `data-fair-fx`), nunca um véu sobre o fenômeno; o fundo é `VISOR_ART.visorFeira` (leva `visores`, 01/10/2026, 696×352 a 0,5×) sobre o degradê antigo. O SVG na paleta do Visor (petróleo, turquesa, cobre, osso: lajes + `Fx`) ficou só como FALLBACK para id sem arte. Sem rosto, olho, boca, barra de HP, número ou letra: o fenômeno é tempo da Malha, nunca inimigo; nenhum estado se lê como "quanto EU bati" (o servidor só entrega `ferido: boolean`). Movimento reduzido deixa o FX parado.
**Props principais:** `{ raid: GuildRaid, label, reducedMotion }`.
**Depende de:** `src/utils/fairArt.ts` (`FAIR_ART`, `fairFenomenoId`, `fairFxId`, `fairStateOf`), `src/utils/visorScenes.ts` (`VISOR_ART`).
**Exports:** `FeiraVisor(props)`, `FEIRA_VISOR_HEIGHT` (176).
**Chamado por:** `src/components/guild/GuildSheet.tsx` (sala `feira`).
**Régua:** `src/components/guild/GuildSheet.feira.render.test.tsx`, `guildFeiraFiacao.contract.test.ts`.

### `src/components/guild/GroveMilestoneCeremony.tsx`
**Dono de:** a cerimônia do marco do Bosque — irmã da `MilestoneCeremony` do hábito, com as mesmas regras caras: **espera o gesto** (um botão, sem auto-fechar), a DATA como saída relacional, z-index **300** (acima da fila de intersticiais, 200), movimento reduzido reduz o MOVIMENTO e nunca a pausa. Saídas: o botão, o **Escape** e o voltar do sistema (`useBackLayer`); o véu NÃO fecha ao toque. Frase do MUNDO manda, fala do pet embaixo em voz mais baixa; sem "parabéns", sem número. O vidro mostra o cenário do estágio novo com a criatura de quem olha — desde 30/09/2026 a arte pintada de `PET_BACKGROUNDS` (`bg.css` com `center bottom / auto 100% no-repeat`, `image-rendering: pixelated`, cor de reserva `bg.baseColor`).
**Props principais:** `stage` (`GroveMarcoStage`), `spriteUrl`, `dateLabel`, `sceneGranted`, `language`, `onDone`.
**Exports:** `GroveMilestoneCeremony(props)` (nomeado e default).
**Chamado por:** `src/App.tsx` (intersticial `groveMilestone`, depois de relatório e check-in e antes do sonho).
**Régua:** `src/components/guild/GroveMilestoneCeremony.render.test.tsx`, `src/components/filaDeAvisos.contract.test.ts` (posição na fila).

### `src/components/guild/GroveVisor.tsx`
**Dono de:** o visor do Bosque (`PLANO-GUILDA.md` §6, WPG-11) — o cenário `bg-guild-<estágio>` de `PET_BACKGROUNDS` — arte pintada 1200×648 desde 30/09/2026 (fundos-v2; ⚰️ era gradiente), assentada com `center bottom / auto 100% no-repeat` e `image-rendering: pixelated` — e as criaturas na linha do chão (`GROUND_Y`), decididas por `utils/groveStage.ts` (5–12 membros → só a sua; ≤ 4 → todos, em ordem de chegada). Pixel art só dentro do vidro; estágio, linha e fio ficam fora dele.
**Props principais:** `guild: Pick<GuildView, 'size' | 'members' | 'bosque'>`, `mySprite`, `reducedMotion`, `label?`.
**Exports:** `GroveVisor(props)`, `GROVE_VISOR_HEIGHT` (176).
**Chamado por:** `src/components/guild/GuildSheet.tsx`.
**Régua:** `src/utils/groveStage.test.ts` (a lógica), `src/components/guild/GuildSheet.render.test.tsx`.

### `src/components/guild/GuildSheet.tsx`
**Dono de:** a GUILDA como tela (29/09/2026) — UMA folha com duas SALAS (`room`): o **Salão** (`room="salao"`, padrão; porta do lote `guilda` do Hall) é um scroll com três seções — **Bosque** (visor, nome do estágio, faixa `perto` binária, fio), **Roda** (os três gestos fixos e anônimos, os gestos recebidos no topo) e **Mural** (marcos com data e peças de maré); a **Feira** (`room="feira"`; porta do lote `feira` da Arena, NPC Fanfare) tem o `FeiraVisor`, UM botão de rodada por dia e o cartão de resgate. Fala com `/api/guild` por `utils/community.ts` e lê todo texto de `guildCopy.ts`. **Vazio é SILÊNCIO** (seção sem nada a dizer nem desenha título). Sair é um toque, sem confirmação, com o botão fixo no rodapé. Falha de carga é tela de erro com "tentar de novo" (nunca "sem roda"); 401 vira convite (Entrar / `UnlockNudge` para o demo). Quem SAIU ainda vê o cartão de colher (o direito é do titular). O 409 do resgate credita pelo `claimed`, só de quem tentou neste aparelho.
**Props principais:** `GuildSheetProps` — `saveId`, `language`, `metaDoDiaCumprida`, `fioGoal?` (`{done, heart, full}` em PESO de esforço), `mySprite?`, `playerDayTz?`, `room?`, `onClaimed?({emblems, trophyId})`, `onScenes?(ids)`, `accountTier?`, `onUnlock?`, `onLogin?`.
**Exports:** `GuildSheet(props)`, `resetRaidTelemetryForTests`.
**Estado/efeitos relevantes:** consulta a roda ao montar e ao voltar ao app (`visibilitychange`) — nunca em timer; `setGuildSheetOpen` avisa o `useGroveWatch` para ficar quieto; grava a memória local via `observeGuildView`; telemetria `guild_*` (`guild_stage` uma vez por estágio, `guild_raid` por desfecho).
**Chamado por:** `src/components/nav/AreaView.tsx` (Hall → `room="salao"`, Arena → `room="feira"`) e, por alias, `CoopPanel`.
**Régua:** `src/components/guild/GuildSheet.render.test.tsx`, `GuildSheet.feira.render.test.tsx`, `guildSemCobranca.contract.test.ts`, `guildFeiraFiacao.contract.test.ts`, `src/utils/guildNoSave.contract.test.ts`.
**Avisos do arquivo:** ⚰️ a arte de Bosque e Feira NÃO é mais placeholder (rodada 3, 30/09/2026 — `GroveVisor`/`FeiraVisor`); nenhum número por pessoa nem de progresso da semana (`progress`/`target` foram descartados pelo cliente).

### `src/components/mercado/GuildOwnedShelf.tsx`
**Dono de:** a seção "DA SUA RODA" do Mercado — o que a Guilda deu e NÃO se compra: os cenários `bg-guild-<estágio>` (em `ownedBackgrounds` quando `mine.groveScenes`) e a Concha da Maré (`trophy-concha-mare`, em `ownedFurniture` pelo resgate). A vitrine só lista o catálogo e um item só na lista de posse ficava INVISÍVEL — a frase `guild.marco.cenario` prometia o que a tela não entregava. Só EQUIPA: sem preço, "comprar", cadeado nem contagem do que falta (o cenário vai como `center bottom / cover`, `pixelated`, desde 30/09/2026, e a Concha da Maré é a arte real `trophy-concha-mare`, ⚰️ o placeholder em SVG); quem não tem nada não vê nem o título. A posse é do save e fica com quem sai (G12).
**Props principais:** `{ language, kind: 'bg' | 'furniture', ownership, actions }`.
**Exports:** `GuildOwnedShelf(props)`.
**Chamado por:** `src/components/mercado/MercadoSheets.tsx` (NO TOPO dos segmentos Background e Decoração, fora da aba de Créditos).
**Régua:** `src/components/mercado/MercadoSheets.render.test.tsx`.

### `src/components/play/PlaySheets.tsx`
**Dono de:** as folhas-porta dos minijogos (minimal-ui F5; desde 30/09/2026 também as folhas dos três prédios de Jogos — Salão, Ateliê da Mente e Refúgio): `MasmorraSheet` (5 andares, dificuldade da semana (rótulo "Camada N"/"Layer N" desde 06/10/2026, ⚰️ "Nível N"/"Level N"), melhor placar, o que pode cair, "perder custa só a run"), `DinoSheet` (recorde e Bits no recorde; a seção se chama "Corrida com obstáculos"/"Obstacle Run" desde 30/09/2026, ⚰️ "Corrida do Dino"/"Dino Runner") e `PptSheet` (Bits por vitória, rodadas para vencer). Os números vêm das constantes dos donos (`MAX_FLOORS`/`clearBonus` da `DungeonGame`, `HEART_DROP_CHANCE` de `utils/dungeon.ts`, `MATCH_POINTS`/`WINS_NEEDED` do `RPSGame`) e os placares das mesmas chaves que os jogos gravam (`DUNGEON_BEST`, `DUNGEON_DIFFICULTY`, `DINO_BEST`). O CTA da Masmorra nunca fica desabilitado (sem gate de entrada).
**Exports:** `MasmorraSheet` (ganhou `bitsToday?`), `DinoSheet`, `PptSheet`, e — delta `ae366480..5edfcfba`, 30/09/2026 — `BitsHoje({ language, earned? })` (linha neutra "Bits de minijogo hoje: N de `MINIGAME_BITS_PER_DAY`", sem barra nem alerta; `null` se `earned` é `undefined`; cheia diz que os jogos seguem abertos e os Bits voltam amanhã), `SalaoSheet({ language, onStart(g: SalaoGame), bitsToday? })` (Dino + PPT reaproveitando `DinoSheet`/`PptSheet` sob um `BitsHoje`), `MenteSheet({ language, reviewDue, onStart(g: MenteGame), bitsToday? })` (cinco linhas `GameRow` — Eco do Pet, Bolhas do Sonho, Troca de Regra, Nonograma da Malha, Revisão da Malha; "até N Bits" vem de `ECO_MAX_BITS`/`BOLHAS_MAX_BITS`/`TROCA_MAX_BITS`/`PICROSS_MAX_BITS`, e a Revisão mostra "N para hoje" quando `reviewDue > 0`, senão `REVIEW_SESSION_BITS`), `RefugioSheet({ language, onStart(g: RefugioGame) })` (Respirar com o Soulmon e Bolhas calmas, sem Bits, e o `SupportNote` no rodapé) e os tipos `SalaoGame` (`'dino' | 'ppt'`), `MenteGame` (`'eco' | 'bolhas' | 'troca' | 'picross' | 'revisao'`) e `RefugioGame` (`'respiracao' | 'bolhas-calmas'`). `GameRow` é interno. A copy DESCREVE o que o jogo pede ("Pede: lembrar uma sequência"), nunca promete efeito cognitivo.
**Imports novos:** as constantes de Bits dos donos `utils/mente/*` (`ECO_MAX_BITS`, `BOLHAS_MAX_BITS`, `TROCA_MAX_BITS`, `PICROSS_MAX_BITS`, `REVIEW_SESSION_BITS`), `MINIGAME_BITS_PER_DAY` de `utils/currencies` e `refugio/SupportNote`.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy).
**Régua:** `src/components/play/playArea.render.test.tsx`.

### `src/components/play/PasseioSheet.tsx`
**Dono de:** a folha do Passeio na Exploração (30/09/2026): para onde o Soulmon vai hoje (postais das regiões abertas, casa inclusa) e, se não escondida, as Travessias — a ativa (texto pleno + versão pequena, "Fiz" / "Recuar"; ⚰️ "Trocar" entre os mesmos 3 e o modal das 21 saíram em 04/10/2026), os "Fiz" guardados ("abre no passeio da próxima noite", sem contagem) e, sem ativa, as regiões em névoa (tocar mostra as 3 propostas). Linha de segurança discreta (parecer 04 R-9) e o link "Esconder/Mostrar Travessias". Nunca mostra número de regiões, total, percentual, prazo, prêmio nem a palavra "desafio"/"challenge". Muda, sem push nem badge (R-NOVA). Nenhuma regra nasce aqui: cada toque entrega ao `App` uma função pura de `utils/travessias`.
**Exports:** `PasseioSheet({ language, crossings, onChange(f), todayKey? })`. Redesenhada em 02/10/2026 (F1–F5): a tela mostra só a Travessia em uso (card com postal da região, glifo da área, título, ato, linha "No mapa" vinda de `crossingYield`, estado de hoje), com "Fiz" (uma vez por dia, `markDone(c, dia)`), "Ver todas e trocar" (abre `ModalSheet` com as 21) e "Recuar" (`dropCrossing`); ⚰️ "Deixar pra lá" e a lista de regiões em névoa na tela principal.
**Missões do dia (04/10/2026):** props novas `seed?` (id do save); sem escolha mostra as 3 de `dailyOffer(dia, seed)` (cards fechados, "Escolher esta" → `pickMission`) com o "!" (`MissionMark`); escolhida vira o card com "?"; depois do "Fiz" diz para onde o Soulmon viaja; `data-marcos` ("Marcos de Aventura · N", só com N ≥ 1) com `InfoTip`. Explicações atrás de `InfoTip`.
**Imports novos:** `dailyOffer`/`pickMission`/`doneToday`/`crossingYield` de `utils/travessias`, `InfoTip`, `MissionMark`.

### `src/components/play/OficinaSheet.tsx`
**Dono de:** a folha da Oficina do Foco na Exploração (04/10/2026, [PLANO-OFICINA-FOCO](../../PLANO-OFICINA-FOCO.md)): o timer de foco real (25/5 e 50/10; iniciar, pausar, continuar, cancelar; ao fim, "Foquei" ou "Agora não") e os cards das técnicas de `FOCO_TECNICAS`, com a explicação, a evidência e a fonte atrás de `InfoTip`.
**Exports:** `OficinaSheet({ language, todayKey? })`. O relógio relê `Date.now()` (`useNow`: 1 s + `visibilitychange`); a regra mora em `utils/focoTimer`. Sem Bits/XP, sem placar: só "Hoje: N focos" local.

### `src/components/play/CadernoSheet.tsx`
**Dono de:** a folha do Caderno (04/10/2026): a missão de journaling com quatro formatos (3 coisas boas, gratidão, o que aprendi, escrita livre), lista das anotações com apagar uma / apagar tudo (confirmado) e a linha de apoio (`SupportNote`) quando o rascunho casa com o léxico de sofrimento (`needsBridge`). Sensível: as entradas vêm do save (`GameState.caderno`) e a folha escreve por funções puras de `utils/cadernoSave` entregues ao `App` (`handleCaderno`).
**Exports:** `CadernoSheet({ language, todayKey?, entries, onChange(f) })`.

### `src/components/play/MissionMark.tsx`
**Dono de:** o marcador de missão à la World of Warcraft (04/10/2026): "!" (`exclamation`, tom gold) = missões do dia disponíveis, "?" (`question`, tom primary) = missão escolhida em andamento. Glifos autorais pelados (sem box), parados, com `label` PT/EN.
**Exports:** `MissionMark({ kind, size?, isPt, style?, tone? })`, `QuestGlyph({ kind, tone?, size })`. `tone: 'blue'` (missões semanais, 07/10/2026) pinta a arte como máscara com o token `--sm2-primary-ink`; `'gold'` (padrão) é a arte original.
**Chamado por:** `src/components/play/PasseioSheet.tsx`, `src/components/nav/AreaScene.tsx` (campo `mark` do lote).
**Régua:** `src/components/play/PasseioSheet.render.test.tsx`, `src/components/play/playArea.render.test.tsx`.

### `src/components/play/TravessiaIcon.tsx`
**Dono de:** o sinal visual de cada Travessia (02/10/2026, F1): o postal da região (`PET_BACKGROUNDS`) e o glifo da área da vida (`AREA_ICON`, nomes do subset Material — provisórios).
**Exports:** `AREA_ICON`, `AREA_LABEL`, `RegionPostal`, `AreaGlyph`.
**Chamado por:** `src/components/play/PasseioSheet.tsx`.
**Régua:** `src/components/play/PasseioSheet.render.test.tsx`.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy, lote `passeio` da Exploração).
**Régua:** `src/utils/travessias.contract.test.ts` (e), `src/components/play/playArea.render.test.tsx`.

### `src/components/nav/CornerLink.tsx`
**Dono de:** o link de canto entre as duas telas de topo — Mapa no canto inferior direito da Home, Home no canto inferior esquerdo do Mapa. Ícone pelado de 32 (papel `nav`), alvo 56 no botão. Desde a correção pós-F3 (24/09/2026) o ícone é a ARTE em pixel do squad (`PixelIcon`, `mapa.png`/`home.png`) — ⚰️ era um glifo vetorial de linha fina (`NavGlyph`), posto ali por engano nas fatias F1–F3.
**Props principais:** `icon: 'mapa' | 'home'` (⚰️ era `NavGlyphName`), `label`, `side: 'left' | 'right'`, `onClick`, `glow?` (o halo do link da Home sobre a cena do Mapa).
**Exports:** `CornerLink(props)`.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/components/nav/nav.render.test.tsx`.

### `src/components/nav/MissionsLink.tsx`
**Dono de:** o ícone de Missões da Home (rodada 7, M8, 04/10/2026) — botão fixo no canto superior direito, logo abaixo do `CornerLink` do Mapa, no mesmo anel. Glifo de quest: "!" com missão disponível, "?" com missão pronta (vence o "!"), "?" esmaecido sem pendência. Parado, sem número e sem som.
**Props principais:** `mark: QuestMark` (de `questMarks().corner`), `tone?` (`questMarks().cornerTone`; azul quando a marca vencedora é semanal), `markLabel`, `label`, `onClick`.
**Exports:** `MissionsLink(props)`.
**Chamado por:** `src/App.tsx` (só com `currentView === 'home'`).
**Régua:** `src/styles/iconScale.contract.test.ts` (glifo 24).

### `src/components/nav/MissionsSheet.tsx`
**Dono de:** a lista de missões aberta pelo ícone da Home — a MESMA folha do Passeio (`PasseioSheet`, lazy) dentro de um `ModalSheet`, mais as missões da semana (`WeeklyMissionList`, com o resgate) e as Conquistas (`ConquistasSheet`) — TODAS as missões num lugar só; o card de missões saiu da Home (07/10/2026). Cada seção leva a marca do seu local. Nada daqui escreve estado que o Passeio/Torneio não escrevam.
**Props principais:** `open`, `onClose`, `language`, `crossings`, `onChange` (função pura sobre `prev`), `todayKey`, `seed`.
**Exports:** `MissionsSheet(props)`.
**Chamado por:** `src/App.tsx`.

### `src/components/ui/Celebration.tsx`
**Dono de:** a celebração curta (rodada 7, M5) — 12 faíscas CSS, ~1,3 s, uma vez, decorativa (`aria-hidden`). Em `prefers-reduced-motion` o CSS (`.sm2-celebrate`, bloco canônico) a esconde.
**Props principais:** `fixed?` (sobre a tela, para a meta do dia), `onDone?`.
**Exports:** `Celebration(props)`.
**Chamado por:** `src/components/play/PasseioSheet.tsx` (o "Fiz"), `src/App.tsx` (meta do dia cumprida).
**Régua:** `src/components/play/PasseioSheet.render.test.tsx`.

### `src/components/nav/AreaScene.tsx`
**Dono de:** o MOLDE de uma área do Mapa (minimal-ui F4) — fundo de cena e "lotes" (construções clicáveis, posicionadas em % sobre a cena). ⚠️ **Decisão do dono, 28/09/2026: não existe mais NPC anfitrião fixo no rodapé da cena.** Cada lote tem o NPC dele próprio, mostrado só dentro da folha que abre ao tocá-lo (`AreaSheet`, via `lotNpcArt`) — a `AreaScene` não desenha NPC nem balão de fala nenhum. Não decide o conteúdo de cada folha — isso é do `AreaView`.
**Props principais:** `areaId: AreaId`, `language`, `lots: AreaLot[]` (`id`, `label`, `left`/`top`, `ariaLabel`, `onOpen`, `art?` — a arte isométrica do lote, desde F5), `background?` (fundo pintado 9:16 em `cover`, desde F5; sem ele, o degradê de tokens), `children?` (onde entra o `AreaSheet` aberto, no mesmo empilhamento da cena).
**Exports:** `AreaScene(props)`, `AreaLot` (interface). A cena termina no FIM DA TELA (QA L1 #31: `minHeight` `100dvh − 56px` com margem negativa que devolve os 40 px ao `<main>`, sem rolagem nova).
- `LOT_WIDTH_DEFAULT` (`'38%'`) — largura padrão de um lote, em % da cena (molde F4).
**Chamado por:** `src/components/nav/AreaView.tsx`.
**Régua:** `src/components/nav/areaShell.render.test.tsx`.

### `src/components/nav/AreaSheet.tsx`
**Dono de:** a folha (bottom-sheet) de um lote de área (minimal-ui F4). ⚠️ **Proporção redecidida pelo dono em 28/09/2026: a folha ocupa `height: 66.6667dvh` (2/3 da tela), fixo — não é mais um range `min-height`/`max-height`.** A metade de cima da folha é do NPC **do lote** + balão de fala (`data-area-sheet-npc-zone`/`data-area-sheet-npc-line`; a fala continua vindo de `src/utils/areaNpcVoice.ts`, nunca escrita aqui); a metade de baixo é o conteúdo rolável (`children`). Backdrop fecha ao tocar fora, Escape fecha, foco vai para o botão de fechar ao abrir. O NPC não é mais um único anfitrião da área espiando por cima — é o de CADA lote, resolvido por `lotNpcArt(areaId, lotId)` (`src/assets/soulmon/npcs/index.ts`): cai no NPC histórico da área se o lote não tiver mapeamento próprio, e em `PLACEHOLDER_NPC_ART` (coruja-cervo/poring) para sub-lojas ainda sem NPC dedicado.
**Props principais:** `areaId: AreaId`, `lotId?: string | null` (id do lote aberto — resolve o NPC via `lotNpcArt`), `language: Language` (obrigatória — idioma da fala do NPC), `title`, `closeLabel`, `open`, `onClose`, `npcArt?` (override explícito e raro do NPC — sem ele, usa `lotNpcArt(areaId, lotId)`), `children`.
**Exports:** `AreaSheet(props)`. Desde 29/09/2026 a fala do NPC vem de `lotNpcVoice` (por lote, `utils/areaNpcVoice.ts`) e a folha aberta se registra em `useBackLayer` (`utils/backStack.ts`): o voltar do Android/navegador fecha a folha antes de mudar de tela. Desde 02/10/2026, `headSlotRef?` entrega um encaixe no canto direito da linha do título (o Torneio põe ali o indicador da faixa por portal).
**Chamado por:** `src/components/nav/AreaView.tsx`.
**Régua:** `src/components/nav/areaShell.render.test.tsx`.
**Acessibilidade (Guilda L1 #24):** o foco/`aria-modal` passou para `useDialogA11y` (foco inicial no fechar, Tab preso, fundo `inert`, Escape, foco DEVOLVIDO ao lote que abriu); o botão de fechar tem 44 px e o corpo respeita `safe-area-inset-bottom`.

### `src/components/home/Mochila.tsx`
**Dono de:** a MOCHILA da Home B (minimal-ui F2, 23/09/2026) — folha de baixo (`min-height` 56vh) com as abas "Comida e chips" / "Especiais" sobre o `foodInventory`. Uso por ARRASTO até o pet (pointer events: fantasma segue o dedo, a folha desce durante o arrasto, soltar sobre o alvo do carinho chama `onUse`); tocar sem arrastar só seleciona; o item selecionado (toque ou foco) mostra o botão "Usar"/"Use" — a alternativa acessível. Não decide regra: `onUse` é o `handleFeed` do App.
**Props principais:** `open`, `onClose`, `foodInventory`, `language`, `onUse(emoji)`, `petTargetRef`, `onTargetChange?`, `petName?`.
**Exports:** `Mochila(props)`, `MochilaProps`, `mochilaTabs(inv)`, `pontoSobre(x, y, rect, folga?)`, `DRAG_THRESHOLD_PX`, `DROP_SLOP_PX`, `MochilaAba`.
**Chamado por:** `src/components/CompanionHUD.tsx`.
**Régua:** `src/components/home/Mochila.render.test.tsx`.

### `src/components/home/statTips.ts`
**Dono de:** o TEXTO da dica que abre ao tocar no coração ou na energia da Home (C13 da navegação do dono, 01/10/2026): como sobe e como desce, em PT/EN, com os números lidos das constantes (`MAX_HEARTS_LOST_PER_DAY`, `WEEKLY_RELIEF_HEARTS`, `RUB_HEAL_DAILY_CAP`). Não decide regra nenhuma — só descreve.
**Exports:** `statTip(kind, isPt)`, `StatTip`, `StatTipKind`.
**Chamado por:** `src/components/CompanionHUD.tsx`.
**Régua:** `src/components/home/statTips.test.ts`, `src/components/CompanionHUD.cta.test.tsx`.

### `src/components/perfil/ProfileAvatarButton.tsx`
**Dono de:** o botão do USUÁRIO no canto superior esquerdo da Home (Tarefa C, 07/10/2026) — a foto de perfil (NPC) com a moldura equipada, num alvo de 44 no fluxo (coluna de 48 do `HomeHud`, como antes) com o avatar de 42 (+50% em 07/10/2026) SOBREPOSTO em `absolute` e `z-index` 20 — não empurra o pet nem o nome. ⚰️ Substitui o sanduíche e o `HomeMenuSheet` (apagado): abre `page:settings`. O que morava no menu foi para as Configurações: Guia (já em Ajuda), Créditos (linha `onOpenCredits`) e Oráculo/Refazer o ritual (ocultos por `MENU_SHOWS_RITUAL_TOOLS = false`, hoje exportada de `SettingsPage.tsx`).
**Props principais:** `avatarId?`, `frameId?`, `seed?`, `language`, `onClick`.
**Exports:** `ProfileAvatarButton(props)`.
**Chamado por:** `src/App.tsx` (`leading` do `HomeHud`).
**Régua:** `src/components/nav/nav.render.test.tsx`.

### `src/components/perfil/BondXpBar.tsx`
**Dono de:** a barra de XP do Vínculo (o level do usuário) nas Configurações › Perfil: nível atual, `into / need XP` até o próximo e uma `progressbar` acessível (`aria-valuetext`). Tudo DERIVADO de `bondProgress(totalXP)` (nunca persistido); no nível máximo (`BOND_MAX_LEVEL`) a barra fica cheia e diz "Max"/"Nível máximo". Só descreve — sem meta, sem cobrança.
**Props principais:** `totalXP`, `language`.
**Exports:** `BondXpBar(props)`.
**Chamado por:** `src/components/SettingsPage.tsx`.
**Régua:** `src/components/perfil/perfilNivel.render.test.tsx`.

### `src/components/perfil/ProfileEditor.tsx`
**Dono de:** a folha "Editar perfil" (Configurações › Perfil): e-mail desativado ("em breve"), moldura (`FrameSelector`, contexto de rank vivo via `getRank(undefined, saveId)`) e foto em grade com busca e filtro por domínio (miniaturas lazy, 64 px, cabe em 375 px). Só IDs de lista fechada saem daqui.
**Exports:** `ProfileEditor(props)`.
**Chamado por:** `src/components/SettingsPage.tsx`.
**Régua:** `src/utils/avatar.test.ts`.

### `src/components/nav/MapPage.tsx`
**Dono de:** a tela do Mapa (minimal-ui F1 + arte isométrica F3) — cena com as seis construções (`AREAS` de `src/navigation.ts`), cada uma um `<button>` com `aria-label` = `areaLabel` que chama `onOpenArea`, posicionada em % da cena; o saldo das 3 moedas num menu discreto no canto inferior direito, acima da arte (`zIndex` 2; até 24/09/2026 ficava no topo e a arte do "Jogos" o cobria), cada moeda numa **pílula** com a moldura `chip-moeda` do squad de arte em 9-slice (`CHIP_MOEDA_ART`/`CHIP_MOEDA_SLICE` de `assets/soulmon/icones-ui`, `border-image … fill` a 1/3 da arte: o miolo opaco segura o contraste sobre qualquer trecho da cena e as tampas não deformam quando o texto cresce) — moldura de TEXTO, não de ícone (formato e cor de `utils/currencies.ts`); o canto inferior esquerdo vinhetado para o `CornerLink glow` da Home. `<h1>` visualmente oculto (`#sm-map-title`).
**Props principais:** `language`, `onOpenArea(AreaId)`, `bits`, `emblems`, `credits`. A pílula da 2ª moeda diz "Honra"/"Honor" (`aria-label` "N de Honra"/"N Honor") desde 30/09/2026 — ⚰️ "Emblemas"/"Emblems" (REGISTRO §17); a prop continua `emblems`.
**Exports:** `MapPage(props)`.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/components/nav/nav.render.test.tsx`, `src/styles/navRotulo.contract.test.ts`.

### `src/components/ShopModal.tsx` — ⚰️ apagado em `ac631987`
⚰️ **A `ShopModal` saiu na minimal-ui F5 (Mercado + Arena, 24/09/2026).** As peças viraram `src/components/mercado/ShopShelf.tsx`; o conteúdo das lojinhas mora em `src/components/mercado/MercadoSheets.tsx` (área Mercado) e a loja de Emblemas + missões da semana no `TournamentPage` (área Arena).

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
**Props principais:** `ChatBoxProps` — `petName`, `mood`, `evolutionStage`, `dominantBranch?`, `useAI`, `onSendMessage(response)`, `aiSettings?`, ⚰️ `onOpenAISettings?` (saiu em `4a8b8049`, #37 — era destruturada e nunca chamada), `language?`, `chatContext?` (`hp`/`energy`/`bond`/`daysAway`/`moodToday`, sempre inteiros — nunca texto, `soulGoal`/`soulStruggle` não passam por rota de IA), `onCreateActivity?`.
**Exports:** `ChatBox(props)`.
- `ChatSupportNote({ isPt })` — a nota de apoio (sem consumidor hoje; quem a realocar importa daqui).
**Estado/efeitos relevantes:** `useState` para `inputValue`, `history` (só em memória — nunca save/localStorage), `isLoading`, `isRecording`, `mediaRecorder`, `micDisponivel`, `audioChunks`, `isInputReadOnly`, `focado`, `randomName`; `useCallback` (`garantirConfig`) busca `fetchServerConfig`; chama `aiFetch` (`src/utils/aiClient.ts`) e `fetch('/api/transcribe')` para voz; usa `toast.warning`/`toast.error` (sonner) quando a IA cai para respostas locais; `chatSafetyDecision`/`detectMessageCategory` filtram a mensagem antes de enviar.
**Chamado por:** `src/components/CompanionHUD.tsx` (`grep -rl "from '.*/ChatBox'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ChatBox.*test.ts*'` vazio, 09/09/2026); o microfone/transcrição são cobertos indiretamente por `src/security/supabase.contract.test.ts`.
**Avisos do arquivo:** o histórico do chat mora só em `useState` de propósito — fechar o app apaga a conversa; `chatContext` é sempre inteiro, nunca texto (D8: `soulGoal`/`soulStruggle` não passam por IA). Desde `6ad2e629` (21/09/2026, parecer clínico — `docs/NARRATIVA-COPY.md` §6): a **superfície de suporte** mora AQUI, no rodapé do chat (`.sm2-chat-support`, `.sm2-chat-support-link` em `src/index.css`) — texto pequeno, `muted`, sem ícone nem caixa (proeminência estigmatiza), com o caminho ANTES da limitação do produto; desde `f3654076` (decisão 1 do dono) link para `findahelpline.com` + CVV 188 (PT) / 988 e 116 123 (EN). A lista é CURADA, estática e humana — faz par com a cláusula SAFETY de `functions/api/chat.js`, que proíbe o modelo de citar qualquer número. Trocar/adicionar serviço é decisão do dono. **Desde a minimal-ui F2 (`78dc6ddb`) a barra é o TERMINAL `>_`** (`.sm3-chatbar`, `<label className="sm3-term" data-terminal>` + `.sm3-term-input`): sempre aberto no rodapé da Home, o `>` e o cursor `_` piscando são desenho `aria-hidden` (⚰️ o `placeholder=">_"` que o leitor de tela lia como "maior que sublinhado"); o `_` some quando a pessoa começa a escrever (`focado` — o foco é medido na BARRA inteira, para sair do campo rumo ao link de apoio não esconder o link antes do toque — ou texto no campo); a frase de suporte só aparece enquanto a pessoa escreve (decisão de desenho registrada para o dono em PERGUNTAS-DO-DONO). Delta `ae366480..5edfcfba`: o rodapé de suporte deixou de ter URL e números à mão — importa `HELPLINE_DIRECTORY_URL`, `helplineDirectoryLabel(isPt)` e `helplineNumbers(isPt)` de `src/utils/supportLine.ts` (mesmo dono do `refugio/SupportNote`); ⚰️ os literais `findahelpline.com` e "No Brasil: CVV, 188…" / "US/Canada: 988…" não moram mais aqui.

### `src/components/CityPicker.tsx`
**Dono de:** busca de cidade de nascimento com fuso IANA, usada no oráculo/onboarding para o mapa astral.
**Props principais:** `CityPickerProps` — `value: City | null`, `onChange(city)`, `isPt`, `inputStyle`, `optionStyle(selected)?` (agora com padrão `choiceStyle` de `form/FormKit.tsx`), `inputClass?`/`optionClass?` (classes do kit; a `OraclePage` não passa nada, fora da navegação).
**Exports:** `CityPicker(props)`.
**Estado/efeitos relevantes:** `useState` (`query`, `touched`); `useMemo` (`matches`) chama `searchCities` (`src/utils/soulProfile/cities.ts`) só depois do primeiro toque (`touched`). Delta `ae366480..5edfcfba`: o rótulo da cidade passa a depender do idioma — `cityLabel(city, isPt)` (antes `cityLabel(city)`) no valor inicial de `query`, na comparação de `showList` e no botão de cada opção.
**Chamado por:** `src/components/OraclePage.tsx`, `src/components/SoulmonOnboarding.tsx` (`grep -rl "from '.*/CityPicker'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'CityPicker.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** tabela embarcada, não geocoding de terceiro — mantém onboarding instantâneo, offline e sem enviar data de nascimento a serviço externo; erro de fuso desloca o Ascendente em ~15° (histórico de horário de verão real, não faixa por data).

### `src/components/CompanionHUD.tsx`
**Dono de:** a área do pet inteira — sprite, HUD do "aparelho" (visor pixel-art), gesto de esfregar, ações (comer/banho/dormir/item), fala, chat embutido e decoração do palco.
**Props principais:** `CompanionHUDProps` (arquivo lido, interface em torno da linha 124) — estado do pet (`healthPoints`, `energyLevel`, `evolutionStage`, `dominantBranch`, `currentXP`…), sinais que só crescem (`fullSignal`, `healCapSignal`, `speakSignal`, `daysAway`, `moodToday`, `hauntedWatching`), `walkingTo?` (desde `3532ccf5`: o nome da região de destino do Passeio, ≠ casa; vira 🎒 nas costas do pet, `data-pet-passeando`, `pointerEvents: none`, sem animação nem som, o nome só no `aria-label`; `null` = em casa), decoração (`equippedBackground`, `equippedDecor`, `trophies`), evolução manual (`onEvolve`, `canEvolve`, `onEvolveRequest`), cuidado (`careEvent`, `onFeed`, `onShower`, `onSleep`, `onPet`, `foodInventory`, `hasNewItems?`, `onBackpackSeen?` — ⚰️ era `onOpenItems`, a pastinha que saiu na minimal-ui), chat (`useAI`, `aiSettings`, `onCreateActivity`; ⚰️ `onOpenAISettings` não está mais nas props), `language`.
**Exports:** `PET_RENDER` (re-export de `src/utils/petStage.ts` — não redeclarado aqui, de propósito) · `CompanionHUD` (`const`, `memo(function CompanionHUD(...))`).
- `DEFAULT_PET_BACKGROUND` (`'bg-room'`) — o Quarto grátis, pré-possuído por todo save, quando nenhum cenário está equipado (C3).
**Delta `bcfe7ca6..e3d55bb8` (01/10/2026, arte da rodada 3):** ⚰️ o emoji 🎒 do Passeio (`walkingTo`) e o glifo Material `wb_sunny` do botão "Acordar" saíram — a mochila nas costas do pet é `<img src={UI_ICON_ART.mochila}>` 20×20 `pixelated` (de `assets/soulmon/icones-ui`) e, dormindo, o botão usa `<PixelIcon name="acordar" size={24} />` (o sol `sol-acordar.png`); o import de `./ui/Icon` foi removido e entrou `UI_ICON_ART`.
**Estado/efeitos relevantes:** 66 linhas com `useState`/`useEffect`/`useLayoutEffect`/`useCallback`/`useRef` (`grep -cE`, 24/09/2026; eram 58 em 10/09/2026); toca som via `playShower`/`playVisorTune`/`playPresence` (`src/utils/sounds.ts`); renderiza `CareSystem`, `ChatBox`, `PetStageDecor`, `home/Mochila` (⚰️ `HomeHud` e `VisorBar` não são mais importados), `Viewport` (com `useVarreduraDeSintonia`/`usePrefersReducedMotion`); usa `createPortal` para overlays. **Home B (minimal-ui F2, `78dc6ddb`):** a cena vai de ponta a ponta (`.sm3-cena`, `RING_PX = 0` — sem o anel de cobre; `STAGE_FALLBACK_H = 330`; janela lida de `--sm3-cena-h`); o GRUPO do pet (`data-pet-group`: berço, sprite, corações, comida) cresce `CENA_ZOOM = 1.5` com origem nos pés, a decoração não; HP/energia saíram da placa do vidro (⚰️ `sm2-visor-plate` + `VisorBar`) para `.sm3-stats` em vetor, fora do `role="img"`; o deck (⚰️ folha de Alimentar `feedOpen`/`handleDeckFeed`) virou o grupo `.sm3-cuidar` com três `data-cuidado` — `mochila` (abre `Mochila`, `mochilaOpen`, chama `onBackpackSeen`; ponto de item novo por `hasNewItems`), `dormir`, `banho`; usar item = `handleUseItem(emoji)` → o mesmo `onFeed` (regra toda no `handleFeed` do App); `petIsTarget` realça o pet como alvo do arrasto (`data-pet-target`, `.sm3-pet-alvo`); brincar = duplo-clique no pet (`handleDeckPlay`); o "+1" de energia é `.sm3-mais` (`plusOne`), não mais fala; dormindo, véu `data-sleep-veil` + filtro no pet e o Z animado (`ANIM_ART.sleepZ`/`sleepZLight` conforme `isDarkBackground`). ⚰️ De `a6c1cd8a` até a minimal-ui o nome do alimento no deck vinha de `getFoodName` de `./ItemsWindow` — hoje quem nomeia é a `Mochila`; ⚰️ `FOOD_NAME_BY_EMOJI` (derivado de `FOOD_BY_CATEGORY`, só EN: o leitor de tela em PT ouvia "Protein × 2" aqui e "Proteína ×2" na Pastinha).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/CompanionHUD'" src`, 09/09/2026).
**Régua:** `src/components/CompanionHUD.render.test.tsx`, `.cta.test.tsx`, `.reacao.render.test.tsx`, `.scanline.render.test.tsx`, `.sintonia-fade.render.test.tsx`, `.vinculo.render.test.tsx`, `.voz.render.test.tsx`; também tocado por `src/components/sintonia-chiado.render.test.tsx` e `src/components/som-presenca-d11.render.test.tsx`.
**Avisos do arquivo:** ⚠️ `digivolutionSegments*`/`requiredDays` SAÍRAM das props em 03/09/2026 — eram três fontes para o mesmo número, nenhuma lida; quem precisa do gate de evolução lê `FORM_REQUIREMENTS[…].required`; `PET_RENDER` não pode ser redeclarado aqui (footgun 9) — sempre importado de `utils/petStage.ts`; escala do sprite é sempre múltiplo inteiro de 128 (guard no teste de render — lado não múltiplo reabre borrão de pixel art). Desde `a2ded861` (21/09/2026) as falas de `fullSignal` (recusa de comida) e `healCapSignal` (teto de carinho) NÃO moram mais inline aqui — vêm de `petVoiceLine('full' | 'healCap', …)` (`utils/petVoice.ts`), alcançadas pelo teste de tom. **Desde `592e2c14` (QA Rodada 2, `07-simulacao-jogo-r2` §2.9) a ESCADA DE FALLBACK do toque e do ócio também saiu daqui** (duas cópias inline — ⚰️ `'Me limpa!'`, `'Me alimenta!'`, `'Me alimenta por favor!'`, `'Cheio de energia!'`, `'Preciso de comida!'`… — a única fala que o jogador que menos faz ouvia, e era pedido imperativo): hoje `petVoiceLine('dirty' | 'hungry' | 'energized' | 'fine' | 'peckish' | 'starving', isPt, Math.random())`, por `careEvent.type` e faixas de `ratio` (≥ 1 / ≥ 0,6 / ≥ 0,1 / resto); os testes de render casam por `kind`, nunca por literal. **`onError` no sprite próprio (`592e2c14`, `02b-design-i18n-estados-r2` E2):** `ownSpriteUrl` é URL de rede (acervo) — offline ou com o cache do provedor fora, o `<img>` falhava e o visor ficava QUEBRADO; hoje `spriteQuebrado` guarda a URL que falhou e o visor cai em `getSpriteForStage(evolutionStage, demoCharacterId)`; URL nova (regeneração) tenta de novo. O flash de evolução usa `--sm2-viewport-bg`/`--sm2-viewport-ink` (⚰️ `#2dd4bf` sobre branco/70 dava ~1,6:1 — L1). Desde `66e32d43` (R2-4) o `SpriteAnim` do sono usa `ANIM_ART.sleepZLight` quando `isDarkBackground(equippedBackground)` (`utils/backgrounds.ts`), senão `ANIM_ART.sleepZ`.

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
**Dono de:** nada mais — é um REEXPORT de uma linha (`export { GuildSheet as CoopPanel } from './guild/GuildSheet'`). O modo cooperativo leve (Fase 4.3) virou a Guilda; o nome antigo ficou só para os imports e o teste `CoopPanel.render.test.tsx` que ainda o citam. Regra e tela vivem em `GuildSheet`.
**Exports:** `CoopPanel` (alias de `GuildSheet`).
**Chamado por:** `src/components/LibraryPage.tsx` — mas a aba "Grupo" da Biblioteca é **inalcançável** (o único mount, `hallContent`, passa `view`, que esconde as abas); o caminho real é `AreaView` → `GuildSheet`. (⚠️ dizia "Chamado por LibraryPage" como se fosse o caminho vivo — achado L1-conformidade #28.)
**Régua:** `src/components/CoopPanel.render.test.tsx`; a tela em si → `guild/GuildSheet.*.test.tsx`.
**Avisos do arquivo:** as invariantes (nenhum número por pessoa, sair num toque, sem push) agora são do `GuildSheet` e de `functions/api/guild.js` — [02 §56-A](../02-REGRAS-DE-NEGOCIO.md).

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
**Props principais:** `DailyReportModalProps` — `report: GameState['lastDayReport']`, `adventure?` (desde `3532ccf5` tipado `Pick<AdventureFind, 'id' | 'emoji' | 'titlePt' | 'titleEn' | 'textPt' | 'textEn'>`, porque pode ser um postal de região do Passeio, sem raridade; achado da noite, vem PRONTO de fora — nunca `useState` local, senão reabrir o relatório sortearia um achado novo), `adventureIsNew?`, `onClose`, `language`, `soulGoal?`, `onRecoverHearts?`, `moodToday?`/`onPickMood?`/`moodNote?`, `showOffer?` (decisão de `src/utils/offerMoment.ts`, só o resultado chega aqui), `spriteUrl?` (novo — o sprite do pet, para o vidro `ritual/RitualKit.tsx` dentro do relatório).
**Exports:** `DailyReportModal(props)`.
**Estado/efeitos relevantes:** usa `useDialogA11y` (`src/hooks/useDialogA11y.ts`); renderiza `MemoriesCard`, `UnlockNudge`; lê `MOOD_OPTIONS`/`MoodValue` de `src/utils/mood.ts` e `ADVENTURE_ART` de `src/utils/adventureArt.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/DailyReportModal'" src`, 09/09/2026). A relação com `MemoriesCard.tsx` é a INVERSA: é este arquivo que importa e renderiza `MemoriesCard` (ver Estado/efeitos acima), não o contrário — corrigido em 10/09/2026 por doc-verificador (`grep -n "MemoriesCard" src/components/DailyReportModal.tsx` mostra o import; `grep -n "DailyReportModal" src/components/MemoriesCard.tsx` não acha nada).
**Régua:** `src/components/DailyReportModal.aventura.render.test.tsx`.
**Avisos do arquivo:** o TOM não regride — nenhum vermelho, nenhum sinal de menos (cabeçalho do export principal); `adventure` chega pronto de fora de propósito, para não virar caça-níquel de reabertura; `showOffer` é só o resultado de uma decisão de ética que mora em `utils/offerMoment.ts`, a tela não decide. Desde `84ae4937` (21/09/2026, copy §2 da bíblia): as manchetes CONSTATAM sem `!` ("Um trecho fechou." no lugar de "Dia completo!"; a queda de forma "recolheu", nunca "voltou"/"regrediu"); a perda de coração vira uma frase única ("O padrão afrouxou um pouco.") sem atribuir causa; folga e alívio semanal falam em "maré" (§12) e sem SALDO; duas notas novas — a linha de apoio da degeneração (nada descoberto saiu) e a do dia completo ("A fagulha firmou."). O ramo `welcome` segue com `welcomeBack.ts` (decisão 3 do dono).

### `src/components/DinoGame.tsx`
**Dono de:** a **Corrida com obstáculos** (EN "Obstacle Run"; ⚰️ "Corrida do Dino"/"Dino Runner" até 30/09/2026, `docs/REGISTRO-DE-DECISOES.md` §17 — o id `dino`, a pasta `assets/soulmon/dino/`, `STORAGE_KEYS.DINO_BEST` e o componente `DinoGame` NÃO mudaram) — o pet pulando obstáculos que sobem de tier conforme o tempo decorrido. Delta `bcfe7ca6..e3d55bb8` (30/09/2026, tema da rodada 3): os obstáculos são ossos e cristais de fogo frio (⚰️ ruínas de masmorra: pilar, rocha, coluna, barricada) e cada um dos 4 tiers (`OBSTACLE_TIERS`, `from` 0/20/45/75 s, `size` 38/44/50/56) tem 3 VARIANTES (`variants: ObstacleArt[]`, PNGs `dino-obstacle-<n>`, `<n>b`, `<n>c`), sorteadas no spawn (`v`); cada variante carrega a caixa de colisão medida — `hit` (fração horizontal opaca) e `top` (fração vazia acima da arte) —, de modo que as variantes baixas não matam o jogador "no ar". `tierImgsRef` virou matriz tier × variante. O título do `GameHeader` é "Corrida com obstáculos"/"Obstacle Run". Delta 04/10/2026 (K7): o pet NÃO corre mais estático — `utils/petBounce` (`runPose`/`idlePose`) dá quique por passada, estica no impulso e achata no pouso (teto ±8%, ±2% em movimento reduzido, grade nítida), com poeira pixel de 3 cores do visor atrás dos pés e no pouso (`Dust`, `spawnDust`; desligada em movimento reduzido) e respiração idle antes de começar e depois de perder. Só desenho: física, colisão, pontuação e tempo intactos.
**Props principais:** não documentado por interface própria no trecho lido (arquivo de 292 linhas — corrigido de "293" por doc-verificador, `wc -l`, 10/09/2026 — ver props recebidas do `AreaView`, ⚰️ antes da `ActivitiesPage`).
**Exports:** `DinoGame(props)`.
**Estado/efeitos relevantes:** `useRef` para `canvasRef`, `scoreElRef`, `petImgRef`, `tierImgsRef`, `phaseRef`, o laço de física (`g`); `useState` (`phase`, `finalScore`, `earned`, `best` — lido de `STORAGE_KEYS.DINO_BEST` via `readNumber`); `useCallback` (`jump`); toca `playTaskComplete` (`src/utils/sounds.ts`); grava recorde com `writeLocal`. Desde `66e32d43` (21/09/2026, R2-2/D-J13) o sprite do pet é `lineIconForStage(evolutionStage, 64, demoCharacterId)` (`utils/lineIcons.ts`, ícone-ficha 64² com bbox cheia) e só cai em `getSpriteForStage` quando o estágio não é de linha. Delta `ae366480..5edfcfba` (C-11, decisão do dono, 30/09/2026): ⚰️ `playTaskComplete` NÃO é mais chamado — no fim da partida, `if (pts > 0) onEarnPoints(pts)` e silêncio (pela R-CAT a categoria vem do evento, e vencer um minijogo não é concluir tarefa); o jogo fica mudo até existir a categoria arcade.
**Chamado por:** `src/components/nav/AreaView.tsx` (lote Corrida com obstáculos da Exploração, minimal-ui F5; ⚰️ até então `ActivitiesPage.tsx`) (24/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'DinoGame.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** fronteira retrô interna ao arquivo — DENTRO do `<canvas>` é território diegético/retrô e não migra para o kit `--sm2-*`; FORA é chrome em Material Symbols; `expand_less` (não `arrow_upward`) no botão de pular porque `arrow_upward` não está no subset da fonte (`src/styles/tokens.md`) e renderizaria vazio.

### `src/components/DuelScreen.tsx`
**Dono de:** a TELA do duelo fantasma do Torneio. Os pets lutam sozinhos e o dono torce. Só anima: quem decide é o servidor (`match`), e a regra é `functions/api/_duel.js` sobre o núcleo v3.
**Cena (PR5, 06/10/2026):** a CENA em tela cheia de `games/BattleStage.tsx` (HP e ENERGIA em cima de cada lutador, mascote da torcida e barra de cheer de 24 toques, X com confirmação — sair conta como derrota), agora em **TEMPO REAL** (~38 s): `simulatePvp` (`utils/combate/duel.ts`) com a SEMENTE e a FICHA que o `duelStart` mandou; cada golpe tem o seu instante, a ação começa antes (`impactMs`) e o dano/HP chega no impacto. Um golpe básico novo corta um básico em curso, nunca um especial; dois especiais no mesmo instante esperam um ao outro. **Torcida por BALDE de 3 s** (`CHEER.bucketSeconds`, até `CHEER.tapsCapPerBucket` = 16 toques): ao fechar o balde a luta é simulada de novo com a descarga que ele pagou (cai no fim do balde, igual ao servidor), sem mexer no que já foi mostrado. O especial sai direto. A forma do golpe do oponente vem da `fx` da ficha dele (escola), a do dono da ficha local.
**Exports:** `DuelScreen` (props `me`/`opp` = `DuelSide`, `seed`, sprites/nomes, `petElement?`/`oppElement?`/`skills?`, `onDone(taps)` — os toques de cada BALDE —, `onClose`); `cheerQuality`/`CHEER_MS`/`CHEER_TARGET` (o anel por TIMING — guardados, sem UI).
**Quem chama:** `TournamentPage` (`fight` chama `startDuel`; o treino monta as fichas locais com `soulCombatant` e `npcSide`; o × antes do fim chama `leaveDuel` = derrota). Sair antes do fim NÃO entrega o resultado depois.
**Régua:** `src/components/DuelScreen.render.test.tsx` e `TournamentPage.duelo.v3.render.test.tsx`. Nasce muda (R-NOVA).
### `src/components/games/TorcidaKit.tsx`
**Dono de:** as peças de TELA da torcida (02/10/2026, decisão do dono; mascote em 04/10/2026): tocar em qualquer lugar da luta (ou no mascote) enche a BARRA DE CHEER, que despeja energia no pet. Só desenha e repassa o toque; a regra mora em `src/utils/energia.ts` (PvE) e em `functions/api/_duel.js` (duelo).
**Exports:** `TorcidaLayer({ onTap, active, isPt, children, style, mascot, onSwipe, swipeActive })` (envolve a luta, pega o `pointerdown`, solta o "grito" no ponto tocado — sem animação com movimento reduzido — e NÃO engole botão, link nem campo; com `mascot` desenha o **mascote da torcida** fixo no canto inferior direito, que a cada toque pula, levanta os pompons e mostra o balão "VAI!"/"CHEER!"; ele é um BOTÃO para teclado e leitor de tela; com `swipeActive`, o deslize horizontal de ≥ `SWIPE_MIN_PX` (44) chama `onSwipe(-1 | 1)` — a ESQUIVA do PvE) · `CheerMascot({ cheer, size })` (o pixel SVG de 16×16, só com tokens; `cheer` = braços e pompons para cima) · `SWIPE_MIN_PX` · `TorcidaGauge({ taps, onCheer, isPt, disabled, full, bare })` (a barra de cheer; `full` padrão = `CHEER_TAPS_FULL` (24); `bare` = a versão da cena de combate, SEM texto e SEM "?" na tela (A7, rodada 7): só a barra e o ícone — a explicação de torcer/anel/esquiva mora no InfoTip único da folha anterior (`DueloSheet`, `data-duelo-como-lutar`); sem `bare` mantém a frase e o botão "Torcer!").
**Quem chama:** `DuelScreen`, `ArenaGame`, `NightmareBattle`, `DungeonGame`.
**Sem barrinha (PR18, 06/10/2026, pedido do dono):** a barra de cheer saiu das telas de combate — fica só o ÍCONE do mascote (40 px de arte, alvo de toque 44) no canto; o que a torcida já encheu aparece como trecho claro na barra de ENERGIA do pet (`StageFighter.cheerPending`, `FighterBars`) e vira preenchimento real quando o motor soma a descarga. Nova prop `cheerRatio` (0..1, em `data-torcida-ratio`). Só UI: `CHEER` e `energyPerDischarge` intactos; `TorcidaGauge` segue exportado só para o layout antigo.
**Carga do especial (04/10/2026):** no `bare`, o raio cinza ao lado da barra virou o cristal de carga do dono — `especialCargaArt(ratio)` (export) escolhe vazio (0) / meio (0<r<1) / cheio (1, especial pronto).
**Régua:** `src/components/games/TorcidaKit.test.tsx` (mascote no canto, pulo + balão por toque, reduced-motion, deslize), `DuelScreen.render.test.tsx`, `NightmareBattle.render.test.tsx`. Nasce muda (R-NOVA); keyframes `sm-torcida-burst`, `sm-cheer-jump`, `sm-cheer-bubble` em `src/index.css`.

### `src/components/games/BattleStage.tsx`
**Dono de:** a CENA de combate em tela cheia (02/10/2026, rodada 5/I10; maior e com energia em 04/10/2026) — o background cobrindo a viewport, o seu Soulmon embaixo à esquerda (BEM maior: até ~64% da largura) e o inimigo em cima à direita (0,66×), plataforma/sombra sob cada um, as barras EM CIMA de cada lutador, coladas nele (nome + HP numérico e, logo abaixo, a barra de ENERGIA, que pulsa quando cheia), o bouncing idle dos lutadores, o X no canto superior direito (com confirmação opcional), a barra de cheer no pé e os golpes com a arte de SKILL do ELEMENTO (investida `melee`, projétil `ranged`/`special`, escudo `shield`). Só DESENHA: o jogo decide e manda a ação (`StageAction`) e o número do dano com um selo curto (`StageHit`, `tag`) no instante do impacto.
**Cena do especial e som (PR18, 06/10/2026):** antes do golpe do ESPECIAL o NOME do ataque aparece grande no centro com o fundo escurecido, quem conjura e a aura ficam acima do véu e SÓ DEPOIS o golpe sai (pausa `SPECIAL_INTRO_MS` = 1000 ms, `introMs(kind)` em `utils/combatFx.ts`; apresentação pura — o motor não enxerga a pausa e nenhum evento muda de ordem; movimento reduzido reduz o movimento, nunca a pausa). É o ÚNICO chamador de `playAttack` (no impacto do golpe básico) e `playSpecial` (a subida cai no fim da cena, o estouro quando o golpe sai); a vitória (`playVictory`) toca nas telas (Arena por rodada, Duelo só se o pet venceu, Masmorra por andar, Pesadelo).
**Exports:** `BattleStage(props)` (`scene`, `me`, `foes[]` — cada um com `energy?` 0..1 —, `target`, `action`, `hit` (um ou vários), `badge`, `title`, `closeLabel`, `onClose`, `exitConfirm`, `onPauseChange`, `hud`, `status`, e as mecânicas do PvE: `charging`, `ring`/`onRingGrade`, `dodge`/`onDodge`, `petDodge`, `mechLabels`) · `BATTLE_LAYER_STYLE` (o estilo da `TorcidaLayer` que a envolve: fixa, tela cheia) · `stageLayout(w, h, nFoes)` (pura: onde cada um pousa) · tipos `StageFighter`, `StageAction`, `StageHit`, `StageLayout`, `Spot`, `BattleStageProps`.
**Quem chama:** `ArenaGame` (durante a luta, no caminho sem as flags de timing), `DuelScreen`, `DungeonGame` e `NightmareBattle` (desde 04/10/2026).
**FX de status e cast (PR11):** `StageFighter.status` desenha a camada de status (UMA folha em loop por lutador, peça estática de cura/escudo, selos com glifo + forma + texto curto + turnos e `aria-label` EN/PT; `isPt`), e o especial ganha o círculo `data-stage-cast="special"` nas 4 telas. O Duelo deriva o status dos eventos do núcleo já chegados (`duelStatusBoard`). Movimento reduzido: sem loop e sem animação do selo, a mesma informação. Régua: `BattleStage.status.test.tsx`, `*.pr11.render.test.tsx` (Arena, Masmorra, Pesadelo, Duelo).
**Régua:** `src/components/games/BattleStage.test.tsx` (layout em números; o que cada ação desenha; escudo no lugar do impacto; movimento reduzido); `ArenaGame.torcida.render.test.tsx`, `DuelScreen.render.test.tsx`. Nasce muda (R-NOVA); keyframes `sm-bs-*` em `src/index.css` (e as regras de movimento reduzido no bloco canônico).

### `src/components/games/useGroupBattle.ts`
**Dono de:** o RELÓGIO da luta em GRUPO da Arena no núcleo v3 (PR3b): consome os eventos de `groupFightSteps` (`attack`/`tick`/`ko`/`cast`) no relógio do núcleo, em segundos. A animação do golpe começa `impactMs` antes e o número e a barra mudam NO IMPACTO; evento novo com a animação rodando a CORTA no impacto; o especial em área desenha o hit em todos os alvos do mesmo instante; o `cast` do pet PAUSA o relógio (anel) e o do inimigo abre a esquiva; a torcida vira descarga por `cheerDrain`.
**Exports:** `useGroupBattle({ running, paused, reduced, runKey, seed, round, scene, onEnd })` → `{ action, hits, hp, foesHp[], petEnergy, foeEnergy[], meter, phase ('idle' | 'ring' | 'dodge'), ring, dodge, petDodge, charging, status ({ me, foes[] }: os efeitos que o núcleo deixou, PR11), cheer(), swipe(dir), resolveRing(grade), stateKey, clock() }` · tipos `GroupRound`, `GroupScene`, `GroupBattle`, `GroupBattleOptions`.
**Quem chama:** `ArenaGame`, `DungeonGame` e `NightmareBattle` (a Masmorra e o Pesadelo, com 1 inimigo por luta, desde o PR4 — o `usePveBattle` foi apagado).
**Régua:** `ArenaGame.torcida.render.test.tsx`, `DungeonGame.defesaAuto.render.test.tsx` e `NightmareBattle.render.test.tsx` (instrumentam a entrada do núcleo por `vi.mock`); `arena.semRandom.contract.test.ts` e `dungeon.v3.test.ts` (sem `Math.random`).

### `src/components/games/useCombatV3Art.ts`
**Dono de:** o hook que entrega as URLs da arte de `utils/combatV3Art.ts` assim que carregam (PR11). Enquanto a imagem não chega — ou se ela não existe — o valor é `undefined` e o chamador desenha o fallback em CSS.
**Exports:** `useCombatV3Art(ids)` → `Record<id, url | undefined>`.
**Quem chama:** `games/BattleStage.tsx` (`StatusLayer` e `CastCircle`).
**Régua:** `src/components/games/BattleStage.status.test.tsx`.

### `src/components/games/pveTags.ts`
**Dono de:** os selos curtos (PT/EN) da cena de PvE no núcleo v3 — o anel (`RING_TAG`: ÓTIMO!/BOM/FRACO), a esquiva (`DODGE_TAG`: Esquivou!/Quase!) e o especial pessoal (`PERSONAL_TAG`: Cura!/Escudo!/Poder!/Ligeiro!). Só texto de tela; a regra (notas, multiplicadores) é de `utils/energia.ts`.
**Exports:** `RING_TAG` · `DODGE_TAG` · `PERSONAL_TAG`.
**Quem chama:** `ArenaGame`, `DungeonGame`, `NightmareBattle` (um dono só para as três telas).
**Régua:** `ArenaGame.torcida.render.test.tsx`, `DungeonGame.defesaAuto.render.test.tsx`, `NightmareBattle.render.test.tsx`.

### `src/components/games/PveMechanics.tsx`
**Dono de:** o DESENHO e o gesto das duas mecânicas ativas do PvE (04/10/2026) — a regra (notas, multiplicadores, janelas) é de `utils/energia.ts`. `SpecialRing` é o anel que encolhe sobre o alvo (estilo Pokémon GO): desenhado por JS (intervalo curto), não por CSS, porque é a mecânica essencial e o `prefers-reduced-motion` não pode congelá-la (WCAG 2.3.3); um toque QUALQUER na tela (ou o botão do alvo, para teclado) para o anel e dá a nota; sem toque vale `ruim` depois de um respiro. `DodgeButtons` são as setas de cada lado do pet (alternativa por toque/teclado ao deslize).
**Exports:** `SpecialRing({ spec, x, y, size, onGrade, label, now? })` · `DodgeButtons({ x, y, size, onDodge, labelLeft, labelRight })`.
**Quem chama:** `games/BattleStage.tsx`.
**Régua:** `src/components/games/PveMechanics.test.tsx`.

### `src/components/DreamDex.tsx`
**Dono de:** a Dex de Sonhos — coleção de cenas noturnas colecionáveis, apresentação pura de `DREAM_CATALOG`.
**Props principais:** `DreamDexProps` (exportado) — recebe `RestState` e devolve a grade com `dexProgress`.
**Exports:** `DreamDexProps` (interface) · `SILHOUETTE_INK` (cor da silhueta do não coletado) · `DreamDex(props)` · `default`.
**Estado/efeitos relevantes:** nenhum estado — sem GameState, sem storage; lê `DREAM_CATALOG`/`DREAMS_BY_RARITY`/`dexProgress`/`Dream`/`DreamRarity` de `src/utils/restWindow.ts`; usa `DREAM_ART` (`src/utils/dreamArt.ts`, sprites próprios desde ago/2026, substituindo emoji do sistema).
**Chamado por:** `grep -rl "from '.*/DreamDex'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/DreamDex'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'DreamDex.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** o Dex só cresce — sonho não coletado é SILHUETA, nunca "faltando" nem vermelho nem contador de falta; as 30 cenas eram emoji do sistema até ago/2026, hoje são sprites próprios.

### `src/components/DungeonGame.tsx`
**Dono de:** o minijogo Masmorra — run de até 5 andares (`MAX_FLOORS`, declarado NESTE arquivo, não em `utils/dungeon.ts`), escada de 6 inimigos por andar. **Desde 04/10/2026 a luta é a `BattleStage` em tela cheia; desde o PR4 do Combate v3 (06/10/2026) o MOTOR é o núcleo (`utils/combate/`, `groupFightSteps` com 1 inimigo, a regra de cada luta em `utils/dungeonFight.ts`) e o relógio é o de `games/useGroupBattle.ts`, com o inimigo RELATIVO ao level do jogador (`dungeonFoe`) e o ofício por `jeitoParaPve`: o Soulmon golpeia e se defende sozinho, HP e ENERGIA em cima de cada lutador, mascote da torcida, barra de cheer no pé; a barra de cheer e a energia do pet **PERSISTEM entre os inimigos e as camadas** (os cartões de inimigo caído, camada limpa, fim e derrota moram SOBRE a mesma cena); energia cheia = especial com o ANEL; o especial do inimigo pode ser esquivado deslizando o dedo; HP, energia e barra de cheer atravessam as lutas (~20–29 s por inimigo). A `TimingBar` saiu desta tela (`pixel/TimingBar.tsx` fica no repo). Prop nova `petElement?` (a arte dos golpes).
**Props principais:** `Popup` (interface interna) e as props recebidas do `AreaView` (⚰️ antes da `ActivitiesPage`; não redeclaradas aqui em detalhe — arquivo de **577 linhas**, `wc -l`, 22/09/2026; eram 568 em 10/09/2026). **Nova em `cf6315e1`: `onFloorCleared?: () => void`** (decisão do dono #59b) — o componente não expunha o momento "andar limpo": só `onEnemyDefeated`, `onEarnPoints` e `onGlitchtama` (a run inteira), e era por isso que o `BondEvent` `dungeonFloor` da tabela do §55 nunca tinha emissor. É chamada em `onFloorCleared?.()` **antes** do `if (floor >= MAX_FLOORS)`, de propósito: o 5º andar é um andar limpo **e** uma run completa, e a tabela paga os dois — quem limita é o teto diário de `bond.ts`.
**Exports:** `DungeonGame(props)` · `MAX_FLOORS` (5) · `clearBonus(floor)` — Bits do andar limpo, `10 + 5 × (floor − 1)` (ambos exportados na minimal-ui F5 para a folha-porta `play/PlaySheets.tsx` citar os números do dono). Delta `ae366480..5edfcfba`: `clearBonus(floor)` agora é `Math.round((10 + 5 × (floor − 1)) × DUNGEON_BITS_FACTOR)` (constante de `utils/dungeon.ts`, 0,4 → 4/6/8/10/12; ⚰️ era 10/15/20/25/30, decisão do dono de 30/09/2026 — uma run completa fica perto do teto diário); o arquivo importa `DUNGEON_BITS_FACTOR` (o `playerStatsFor` saiu no PR4).
**Estado/efeitos relevantes:** `useState` para `enemies`, `enemyIdx`, `hpFrac`, `fightKey`, `phase`, `rewardMsg`, `baseLevel` (de `getDungeonDifficulty()`), `floor`, `best` (de `getDungeonBest()`), `runScore`, `runScenes` (de `buildRunScenes()`); `useRef`/`useCallback` (`after`, temporizadores); toca `playFeed` (`src/utils/sounds.ts`); chama `buildDungeonWave`, `recordDungeonScore`, `setDungeonDifficultyAtLeast`, `deepStartCost`/`canBuyDeepStart` de `src/utils/dungeon.ts`.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy, lote Masmorra da Exploração, minimal-ui F5; ⚰️ até então `ActivitiesPage.tsx`); `src/components/play/PlaySheets.tsx` importa `MAX_FLOORS`/`clearBonus` (24/09/2026).
**Régua:** `src/components/DungeonGame.defesaAuto.render.test.tsx` (a cena, a defesa automática e a persistência da barra de cheer e da energia entre os inimigos) e `DungeonGame.profissao.render.test.tsx` (o ofício no lobby); a régua de tetos globais (Glitchtama, coraçãozinhos) vive nos testes de `src/utils/dungeon.ts`/`specialItemUse.ts`.
**Avisos do arquivo:** ⚠️ `MAX_FLOORS` mora AQUI, não em `utils/dungeon.ts` — achado na auditoria de 09/09/2026 (`CLAUDE.md`, linha ⚔️ Masmorra); sem limite diário e sem gate de entrada; perder custa só a run (nunca corações). Desde `84ae4937` (21/09/2026, copy §4 da bíblia): o VOCABULÁRIO de jogador mudou — "camada"/"layer" (não andar), "descer"/"descida" (não entrar/run), vencer é o inimigo "parar de insistir" (nunca "derrotado"/"defeated"; EN nunca "passed"), a derrota é "Você subiu. A descida ficou pelo caminho" + a linha dos corações intactos; contagens vêm de `MAX_FLOORS`/`ladderLen`, nunca à mão; duas linhas de contexto (a fenda como assentamento falho; a camada mais antiga) e a frase do Glitchtama com o nome mantido (P5 decidida pelo dono em 21/09/2026); desde a minimal-ui o item se usa pela "mochila"/"Backpack" (⚰️ era "pastinha de itens"). Os SÍMBOLOS (`MAX_FLOORS`, `floor`, `startRun`, `exitRun`) não mudaram.

### `src/components/EditModal.tsx`
**Dono de:** modal de edição de hábito/tarefa aberto pelo botão principal da tela inicial — reusa os blocos de campo de `CreateModal`.
**Props principais:** `EditModalProps` — `isOpen`, `onClose`, `onSave(data)` (grava `weekDays` legado junto de `schedule` para widget Android/desktop lerem), `onDelete?`.
**Exports:** `EditModal(props)`.
**Estado/efeitos relevantes:** `useState` (`name`, `category`, `steps`, `alarmTime`); `useEffect` popula os campos ao abrir; usa `useHabitSchedule` (`src/hooks/useItemForm.ts`) e importa `CategoryChips`/`HabitAnchorFields`/`HabitScheduleFields`/`StepsFields` de `src/components/CreateModal.tsx`; renderiza `UnlockNudge` quando bate o teto de hábitos ativos do modo demo.
**Chamado por:** `grep -rl "from '.*/EditModal'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/EditModal'))` (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'EditModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** ⚠️ (D-12) este é o modal do botão principal da tela inicial — era por onde o teto do modo grátis vazava (salvava sem checar cap); hoje mostra o mesmo convite (`UnlockNudge`) que o `CreateModal`, com as mesmas palavras, em vez de recusar em silêncio depois de a pessoa escrever tudo.

### `src/components/FeedbackLink.tsx` (novo em 21/09/2026, QA geral)
**Dono de:** o canal de feedback in-app — `mailto:` para o e-mail de contato com versão, 8 caracteres do `saveId` e origem (e a mensagem do erro, nunca stack, quando vem do `ErrorBoundary`).
**Exports:** `FEEDBACK_EMAIL`, **`BUILD_ID`** (desde `592e2c14`, `00-skeptic-r2` #7 — lê `__BUILD_ID__`, injetado por `define` no `vite.config.ts`: `CACHE_VERSION` do `public/sw.js` + `CF_PAGES_COMMIT_SHA`/`GITHUB_SHA` curto quando há, ex.: `v159+592e2c1`; `'dev'` fora do Vite; vai no corpo do `mailto:` como `Build:` — a versão do `package.json` não distingue dois deploys), `APP_VERSION` (desde `a6c1cd8a` lê `__APP_VERSION__`, injetado por `define` no `vite.config.ts` a partir do `version` do `package.json` — **1.1.4**, o mesmo `versionName` do `build.gradle`; fallback `'0.0.0-dev'` fora do Vite; `vitest.config.ts` repassa o mesmo `define`; ⚰️ literal `'1.0.2'` — havia TRÊS versões no repositório, design-critic B1; régua `src/deploy/versaoUnica.contract.test.ts`), `feedbackMailto(opts)` (a linha "Origem" é localizada por `originLabel` — "configurações"/"tela de erro" em PT, B4; desde `592e2c14` o `subject` da origem `error` é por idioma — `Soulmon — erro`/`Soulmon — error`, A6), `feedbackLabel(language)`, `FeedbackRow` (linha do grupo **Ajuda** da `SettingsPage` desde `a6c1cd8a`, B3 — ⚰️ ficava em Sobre; o hint diz o endereço `FEEDBACK_EMAIL`), `FeedbackLink` (link solto, usado no `ErrorBoundary`).
**Chamado por:** `src/components/SettingsPage.tsx`, `src/components/ErrorBoundary.tsx`.
**Régua:** `src/components/SettingsPage.sobre.render.test.tsx`, `src/components/ErrorBoundary.feedback.render.test.tsx`.

### `src/components/TermsUpdateBanner.tsx` (novo em 21/09/2026, decisão #24)
**Dono de:** o cartão discreto (`.sm2-notice`, **`role="region"` + `aria-labelledby` do título** desde `a6c1cd8a` — ⚰️ `role="status"`, que é para texto que muda sozinho, e este cartão tem controles; A4) que avisa que Termos/Política mudaram — só os links do que MUDOU, em aba nova, e um "Entendi"/"Got it" (⚰️ "Ok") que grava o aviso como visto. Não bloqueia nada.
**Props:** `language`, `changed?: DocMudado` (`'terms' | 'privacy' | 'both'`, padrão `'both'`; desde `a6c1cd8a`, design-critic A1 — o `App.tsx` passa `qualDocMudou(...)`; o título é `TITULO[changed]` e `showTerms`/`showPrivacy` escondem o link do documento que não mudou, porque afirmar "os Termos e a Política mudaram" quando só um mudou era mentira de interface), `onOk`.
**Copy e links (desde `a6c1cd8a`):** subtítulo "Você continua jogando normalmente. Se quiser ler o que mudou, está aqui." (⚰️ "Nada muda no seu jogo…"); `HREF` por idioma — EN aponta para a âncora `#en` de `/termos.html`/`/privacidade.html` (A5); cada link tem `aria-label` "… (abre em nova aba)" (A3). Delta `ae366480..5edfcfba`: `HREF` agora é `terms: { pt-BR: /termos.html#pt, en-US: /termos.html }` e `privacy: { pt-BR: /privacidade.html#pt, en-US: /privacidade.html }` — ⚰️ a âncora `#en` (A5) acima foi invertida: o inglês é a página pura e o português ganha `#pt`.
**Chamado por:** `src/App.tsx` (item `termos`, o ÚLTIMO da fila de avisos — travado em `filaDeAvisos.contract.test.ts` desde `a6c1cd8a`).
**Régua:** `src/components/TermsUpdateBanner.render.test.tsx` (título por `changed`, links por idioma, `region`) e `TermsUpdateBanner.qa.render.test.tsx` (desde `a6c1cd8a`: "Entendi" não dispara no render e conta 1 por clique; EN sem PT vazando; idioma desconhecido cai em inglês).

### `src/components/ErrorBoundary.tsx`
**Dono de:** boundary de erro de renderização do app inteiro — tela de fallback com o mascote e um botão de recarregar.
**Props principais:** `Props` (`children`), `State` (`hasError`, `error`).
**Exports:** `ErrorBoundary` (class). Desde `42b07bec` a tela de erro monta um `FeedbackLink` abaixo do único botão "Recarregar" (`saveId` lido direto de `STORAGE_KEYS.SAVE_ID`, `errorMessage` = `error.message`, nunca o stack).
**Estado/efeitos relevantes:** `getDerivedStateFromError`/`componentDidCatch` (loga só em `import.meta.env.DEV`); lê o idioma direto de `readLocal(STORAGE_KEYS.LANGUAGE)` porque é a única superfície que pode aparecer antes do app montar (não pode depender de contexto/provider).
**Chamado por:** `src/main.tsx` (`grep -rl "from '.*/ErrorBoundary'" src`, 09/09/2026).
**Régua:** `src/components/ErrorBoundary.feedback.render.test.tsx` (2 casos, desde `42b07bec`). ⚰️ "nenhuma" até então.
**Avisos do arquivo:** nenhum.

### `src/components/EvoTrail.tsx` — ⚰️ apagado em `7ea27825`
**Dono de (histórico):** a trilha de evolução resumida na Home (nós serpenteantes ao lado do painel de rituais) — atalho para a página de Evolução real. Saiu da Home no canvas Atividades (DECISÕES §20): o painel "Daily rituals" (`DailyRituals.tsx`) tomou o espaço, e o atalho para a árvore de Evolução deixou de ter um resumo próprio ali (`grep -n "EvoTrail" src/App.tsx` só acha o comentário que registra a saída).
**Props principais:** `EvoTrailProps` — `stages: CreatureStage[]`, `currentStageId`, `unlockedEvolutions?`, `branch: Attr` (já resolvido por quem chama, mesmo `resolveBranch` da página), `demoCharacterId?`, `onOpen()`, `language?`.
**Exports:** `EvoTrail(props)`.
**Estado/efeitos relevantes:** `useMemo` para `unlockedSet` e `trail`; sem regra de grafo própria (footgun 9) — reusa `SoulNode` e o galho resolvido de fora.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/EvoTrail'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'EvoTrail.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** é RESUMO, não a árvore — nenhuma regra do grafo mora aqui; medidas (`NODE`, `COL_W`, `STEP_Y`) apertadas de propósito para caber em viewport de 390px sem truncar rótulos nem cobrir o dock do chat.

### `src/components/EvolutionCeremony.tsx`
**Dono de:** a tela dedicada da cerimônia de evolução manual — sprites atual/próxima intercalando em velocidade progressiva sobre vídeo cósmico em loop.
**Props principais:** `EvolutionCeremonyProps` — `fromStage`, `toStage`, `toName`, `language`, `demoCharacterId?`, `onEvolved()` (commit da evolução no estado), `onClose()`.
**Exports:** `TOTAL_MS` (3000ms, duração total da troca de sprites) · `MIN_STEP_MS` (340ms, piso do intervalo) · `buildSchedule()` — monta os intervalos decrescentes que somam `TOTAL_MS` · `EvolutionCeremony(props)`.
**Estado/efeitos relevantes:** `useState` (`showNext`, `done`); `useRef` (`evolvedRef`); `useEffect` roda o `buildSchedule()` (intervalos decrescentes somando `TOTAL_MS`=3000ms) que alterna os sprites até estabilizar.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/EvolutionCeremony'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'EvolutionCeremony.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** o botão de saída é "Seguimos juntos"/"We keep going together" desde `84ae4937` (21/09/2026, copy §3.2) — a MESMA saída relacional do `MilestoneCeremony`. ⚠️ o `CLAUDE.md` (seção "DUAS FILAS") registra que esta cerimônia (z-500) chegou a abrir junto do `EvolveTaskModal`, que reaparecia por baixo cobrando "crie mais atividades" quando ela fechava — achado na auditoria de 06/09/2026, corrigido pela fila de intersticiais declarada no `App.tsx`.

### `src/components/EvolutionLight.tsx`
**Dono de:** a luz PROCEDURAL da cerimônia de evolução (07/10/2026, no lugar do PNG `gain-evolution-burst`): canvas 2D com raios em duas camadas que giram e pulsam, halo que respira, flash de entrada com easing e partículas subindo, cores lidas do tema do visor (`--sm2-viewport-ink`, `--sm2-primary-fill`), teto de ~60 fps. Sem asset; em `prefers-reduced-motion` a cerimônia nem o monta (fica o quadro parado antes → depois).
**Props principais:** `size`.
**Exports:** `EvolutionLight({ size })`.
**Chamado por:** `src/components/EvolutionCeremony.tsx`.
**Régua:** `src/components/EvolutionCeremony.render.test.tsx`.

### `src/components/EvolutionPath.tsx`
**Dono de:** a página de Evolução — a árvore por galho, o cadeado `evolutionLocked`, a cerimônia manual, o spoiler-guard de formas futuras e o desempate por ritmo de cuidado.
**Props principais:** `EvolutionPathProps` (arquivo de 1179 linhas — `wc -l src/components/EvolutionPath.tsx`, 10/09/2026, corrigido de "1180" por doc-verificador; props cobrem estágio atual, galhos, `unlockedEvolutions`, sprites por forma, idioma e os callbacks de evolução/cadeado — ver o corpo a partir da interface). **`incubating?`** (WP4.29, `8be8f9c5`/`355959b4`, D-G8c): com a barra cheia e a forma incubando o toque NÃO evolui (`evoluiNoToque` exige `!incubating`), a frase vira "A próxima forma está tomando corpo. Leva um tempo — volte quando quiser, ela espera por você." (vem antes do cadeado) e o rótulo do visor diz o mesmo em vez de prometer um gesto que o `handleEvolve` recusaria.
**Exports:** `EvolutionPath(props)`.
**Estado/efeitos relevantes:** 11 ocorrências de `useState`/`useEffect`/`useRef`/`useMemo` (`grep -c`, 09/09/2026; desde `592e2c14` mais `spriteQuebrado` — a URL própria que falhou ao carregar cai na reserva via `onError`, E2 da QA Rodada 2, como no `CompanionHUD`; e o card usa `SM2_SHADOW_CARD` do `FormKit`); usa `SoulNode`/`AlignmentIcons` para o desenho; `useVarreduraDeSintonia` mora em `ui/Viewport.tsx` (não duplicado aqui, de propósito); lê `canManualRetry`/`cardState`/`displaySprite` de `src/utils/spriteLibrary.ts` e `pointsToEvolve` de `src/utils/spriteTrigger.ts`.
**Chamado por:** `grep -rl "from '.*/EvolutionPath'" src` (testes próprios + `src/components/sintonia-chiado.render.test.tsx`); consumo real em `src/App.tsx` via `lazy(() => import('./components/EvolutionPath'))` (09/09/2026).
**Régua:** `.credencial.render.test.tsx`, `.estados.render.test.tsx`, `.scanline.render.test.tsx`, `.silhueta.render.test.tsx`, `.sintonia-anuncio.render.test.tsx`, `.sprite.render.test.tsx`; evolução manual travada por `src/components/evolucaoManual.contract.test.ts`.
**Avisos do arquivo:** progresso virou PALAVRA ("Faltam N dias completos"/"O padrão está pronto. Ele espera você encostar."), a barra é só apoio visual; desde `84ae4937` (21/09/2026, copy §3): `tituloDoVisor` é "Encostar"/"Touch it" (evolui no toque), "Soltar"/"Release" e "Segurar"/"Hold" (o par do cadeado — nunca "travar"/"lock"); com o cadeado fechado e a barra cheia a frase é "Ele espera. Esperar não tira nada dele." (a pessoa nunca é causa de um "mas"); a nota do cadeado perdeu "nos dias difíceis" (avaliava o dia) e a 2ª oração "Toque no seu Soulmon para evoluir" FICA porque `evolucaoManual.contract.test.ts` exige o gesto ensinado; atributos usam UM desenho só (SVG inline de `AlignmentIcons`), não mais PNG pixel-art + SVG divergindo na mesma tela; situação de cada nó sempre dita em palavras no `aria-label` (WCAG 1.4.1 — cor/posição nunca é o único portador).

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
**Props principais:** `AlbumForm` (interface exportada: `id`, `name`, `spriteUrl?`) · `FormAlbumProps` — `forms: readonly AlbumForm[]`, `reached: readonly string[]` (`unlockedEvolutions`), `reachedAt?: Record<string,string>` (WP4.10), `language`, `hideMetrics?` (novo, padrão `false` — mesma bandeira de "esconder números" da Janela de Descanso).
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
**Estado/efeitos relevantes:** `useState` (`step`, `goalText`, `selectedCats`, `suggestions`, `loading`, `searched`, `selected` e, desde `592e2c14`, **`falhaIa: 'offline' | 'error' | null`**); `useMemo` (`categoriasOrdenadas`, via `orderCategoriesForGoal`); chama **`suggestTasksResult`** (`src/utils/taskSuggestions.ts`, mesma API do chat — `functions/api/suggest-tasks.js`; ⚰️ `suggestTasks`, que apagava a diferença entre "veio vazio" e "quebrou"). **E1 (QA Rodada 2):** falha com nome — `<p role="status" data-ai-failure="offline|error">` ("Sem conexão agora — estas são sugestões locais…" / "A IA não respondeu agora…"); as sugestões locais vêm mesmo assim; vazio legítimo não mostra falha. **A10:** o hint "Este texto vai para o provedor de IA…" (`data-ai-hint`) FICA enquanto o botão puder ser tocado (⚰️ sumia depois da 1ª busca, com o botão vivo e o texto saindo a cada toque).
**Chamado por:** `grep -rl "from '.*/GameTutorialFlow'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/GameTutorialFlow'))` (09/09/2026).
**Régua:** `src/components/GameTutorialFlow.render.test.tsx` (desde `5513b5b6`, 20/09/2026; +4 casos em `592e2c14`: offline/erro/vazio legítimo/hint que fica; ⚰️ "nenhuma" era a leitura de 09/09/2026).
**Aviso de IA (desde `a6c1cd8a`, compliance #2 da QA Rodada 1):** o campo do objetivo nasce pré-preenchido com o `soulGoal` do onboarding — que a política dizia não passar por IA —, então o hint diz "Este texto vai para o provedor de IA se você pedir sugestões." (⚰️ "Seu objetivo é enviado à IA para escrever as sugestões."); provisório "declarar" até o dono decidir declarar × cortar (#42). Guard da fronteira: `src/ia.camposEnviados.contract.test.ts`.
**Avisos do arquivo:** eram ~12 telas antes do primeiro toque (splash + 4 do demo + 6 conceituais + criação + `WelcomePromptModal`), reduzidas a 2 — as 5 páginas conceituais removidas já estavam ditas, melhor, no `GuideModal`/`HelpModal`; era o último consumidor de `lucide-react` do `src/` — migrado para `<Icon>`, guard `iconScale.contract.test.ts` acusa reimportação.

### `src/components/GuideModal.tsx`
**Dono de:** o Guia — capítulos fechados por padrão (ganhou o da Guilda, `id: 'guild'`, cuja copy é de `guildText('guild.guide.*')` — sem número à mão), cada número vindo de uma constante (não de texto à mão).
**Props principais:** `GuideModalProps` — `isOpen`, `onClose()`, `language?`.
**Exports:** `GuideModal(props)`.
**Estado/efeitos relevantes:** `useState<string|null>` (`open`, qual capítulo está expandido); importa dezenas de constantes de regra (`FOOD_LIMIT_PER_HOUR`, `FORM_REQUIREMENTS`, `MAX_HEARTS_LOST_PER_DAY`, `HABIT_MILESTONES`, `CONSTANCY_WINDOW_DAYS`, `REST_SHIELD_MAX`, `DREAM_CATALOG` etc.) para os números do texto nunca serem hardcoded. Desde WP4.29 (`8be8f9c5`) o capítulo de evolução tem o parágrafo da incubação ("a próxima forma começa a tomar corpo… nada se perde no caminho") — sem número nem unidade de tempo (R-I), com as três metades que o parecer R-N exige. Delta `ae366480..5edfcfba`: ganhou um parágrafo do duelo do Torneio ("os pets lutam sozinhos; você torce três vezes… torcer só ajuda") no capítulo de jogos, em PT/EN por `L(...)`. Delta `cfe27cc7..3532ccf5`: capítulo novo `id: 'passeio'` ("Passeio e Travessias" / "Stroll and Crossings") — três parágrafos, sem número (não há contagem de regiões nem prazo a mostrar).
**Chamado por:** `grep -rl "from '.*/GuideModal'" src` → `src/components/ContentModals.tsx` (lazy) e `src/components/GuideModal.gateReal.render.test.tsx` (09/09/2026).
**Régua:** `src/components/GuideModal.gateReal.render.test.tsx`.
**Avisos do arquivo:** era 16 seções/~60 parágrafos, cortado para 7 capítulos fechados — a pergunta de corte foi "isto muda alguma decisão do jogador?"; todo número do texto vem de constante importada, nunca escrito à mão.

### `src/components/HabitConstancy.tsx`
**Dono de:** o indicador de constância de um hábito (grade "N das últimas 7", sem streak).
**Props principais:** `HabitConstancyProps` (exportado) — recebe `HabitRhythm`, `Schedule`, `language`.
**Exports:** `TIER_FILL` (mapa tier→fração do glifo de maturidade) · `HabitConstancyProps` (interface) · `dotStyle(state)` — estilo de um ponto da grade · `MaturityGlyph({tier,aura,label})` — o selo de maturidade · `ConstancyWindow({rhythm,now,language,hideMetrics})` — a grade "N das últimas 7" sozinha · `HabitConstancy(props)` · `default`.
**Estado/efeitos relevantes:** nenhum estado — apresentação pura sobre `constancy`/`habitTier`/`dayKeyOf`/`steadyWindow` de `src/utils/habitRhythm.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/HabitConstancy'" src`, 09/09/2026).
**Régua:** `src/components/HabitConstancy.hideMetrics.render.test.tsx`; também exercitado por `src/components/dailyList.sm2.render.test.tsx`.
**Avisos do arquivo:** sem streak de propósito — falha custa ~14% (1/7), não 100%; cada estado tem FORMA própria, não só cor (quadrado cheio=feito, losango=protegido, anel vazado=falta, traço=não devido); dia protegido por escudo conta como feito e usa a cor de destaque, nunca a de falta.

### `src/components/HelpModal.tsx`
**Dono de:** o glossário (HelpModal) — tradução curta de termos da interface, sem repetir o `GuideModal`. Ganhou os verbetes da Guilda (Guilda, roda, Bosque, fio, Feira, Maré, Concha; números das constantes de `guildRules`) e por isso o `App.tsx` o carrega `lazy` (fora do JS de entrada).
**Props principais:** `HelpModalProps` — `isOpen`, `onClose()`, `language?` (a interface `Term` estrutura cada verbete).
**Exports:** `HelpModal(props)`.
**Estado/efeitos relevantes:** nenhum estado próprio; deriva `GOOD_DAYS` de `GOOD_CONSTANCY_RATIO * CONSTANCY_WINDOW_DAYS` e `DREAM_COUNT` de `DREAM_CATALOG.length` — nunca literal. Verbete "Bits vs. Honra vs. Créditos"/"Bits vs. Honor vs. Credits" (30/09/2026, REGISTRO §17: Honra vem do Torneio e compra só cosmético; ⚰️ "Emblemas"). Verbete "Incubação"/"Incubation" (🥚, WP4.29) sem número nem unidade de tempo; o coraçãozinho se usa "pela mochila"/"from the Backpack" (⚰️ era "pastinha de itens"). Desde `3532ccf5`, verbete 🧭 "Passeio e Travessias" / "Stroll & Crossings" — sem número, sem prazo, sem prêmio.
**Chamado por:** `src/App.tsx` (`lazy(() => import('./components/HelpModal'))`, dentro de `Suspense`, desde a B2).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'HelpModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** desde `5b91717c` (21/09/2026, copy §6, L10/§16 da bíblia) a frase de abertura diz que o universo é universo — "estes são os nomes dele, e nenhum deles descreve você" — para bloquear a inferência de tipologia ("então eu sou akasha") que a adjacência ficha ↔ respostas ensina; era 7 seções/24 verbetes até 90 palavras, cortado para o que o `GuideModal` NÃO responde; verbete cuja explicação já está na própria tela (indicador de cocô, botão de banho) saiu; nenhuma descrição passa de duas linhas; números sempre de constante, nunca escritos à mão.

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
**Estado/efeitos relevantes:** tela de abertura (07/10/2026, S17: `TelaDeAbertura`, pôster + "Tap to start", toque → `iniciarTemaNoGesto()` + vídeo; pulada por `precisaDeAbertura()`); `useState` (`leaving`, `videoFailed`); `useRef` (`doneTimerRef`, `leaveTimerRef`); `useEffect` agenda `scheduleFinish(1500)` como fallback, substituído pela duração real do vídeo quando conhecida; toque/clique pula direto com o mesmo fade de 400ms.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/IntroScreen'" src`, 09/09/2026).
**Régua:** `src/components/IntroScreen.render.test.tsx`.
**Avisos do arquivo:** puramente cosmético, self-dismiss via `onFinish`; cai para o wordmark raven/gradiente se o vídeo falhar (WebView antiga sem suporte ao formato).

### `src/components/ItemsWindow.tsx`
**Dono de:** os nomes e descrições (PT/EN) de comida e item especial. ⚰️ **A tela da Pastinha (`ItemsWindow(props)`, `ItemsWindowProps`, `effectLine`) foi apagada no fechamento da minimal-ui (F6, 24/09/2026)**: desde a F2 a entrada de item é a Mochila da Home (`home/Mochila.tsx`) e nada mais abria a pastinha (`handleOpenItems` sem chamador).
**Exports:** `getFoodDesc(emoji, lang)` · `getFoodName(emoji, lang)` (exportada desde `a6c1cd8a`, PL-5 — dono único do nome do alimento/item no idioma da pessoa; o `CompanionHUD` a importa em vez de derivar um nome só EN de `FOOD_BY_CATEGORY`).
**Estado/efeitos relevantes:** nenhum; lê `SPECIAL_ITEMS` de `src/utils/shop.ts`.
**Chamado por:** `src/components/home/Mochila.tsx` (`getFoodName`, `getFoodDesc`) (`grep -rl "ItemsWindow'" src`, 24/09/2026; ⚰️ o `CompanionHUD`, que importava `getFoodName` desde `a6c1cd8a`, não importa mais).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ItemsWindow.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** o emoji É a chave de inventário (`utils/shop.ts`) — nenhum PNG paralelo, para não repetir o bug de moeda que a loja teve com duas representações do mesmo item.

### `src/components/LibraryPage.tsx`
**Dono de:** a Biblioteca — diretório de jogadores, amigos e o painel cooperativo, com quatro estados explícitos (carregando/vazio/erro/sem rede).
**Props principais:** `LibraryPageProps` — `saveId`, `friends: string[]`, `canGiftToday` (energia cheia), `onFriendsChange`, `onGiftSent`, `onVisitPlayer?` (WP4.7, dispara na abertura do detalhe), `metaDoDiaCumprida?` (repassado ao `CoopPanel`, decidido pelo motor de progresso e não duplicado no painel), `playerDayTz?` (a âncora do dia do jogador que a Guilda envia ao servidor), `embedded?` (minimal-ui F5 — dentro da folha do Hall o `<h1>` "Biblioteca" não renderiza; o `<h1>` da tela é o do `AreaTopBar`).
**Exports:** `LibraryPage(props)`.
**Estado/efeitos relevantes:** `useState` para `search`, `players`, `loadError`, `actionError`, `busyId`, `tab`, `giftedToday`, `selectedPlayer`, `reloadKey`, `friendPlayers`; `useEffect` carrega via `listPlayers`/`getPlayer` (`src/utils/community.ts`); renderiza `PlayerDetailModal` e `CoopPanel`.
**Chamado por:** `grep -rl "from '.*/LibraryPage'" src` (testes); consumo real em `src/App.tsx` via `lazy(() => import('./components/LibraryPage'))`, montado `embedded` como `hallContent` do `AreaView` (24/09/2026).
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
**Estado/efeitos relevantes:** `useEffect` dispara háptico curto (`navigator.vibrate`, onde disponível) ao montar; sem timer de auto-fechamento — a saída é sempre o botão "Seguimos juntos" (EN "We keep going together" desde `84ae4937`, 21/09/2026 — era "Let's keep going together").
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
**A12 (`592e2c14`, QA Rodada 2):** a âncora do hábito ("depois do café — na cozinha", `h.anchor.after`/`where`) vivia num `title`, que só existe no hover — no celular e no leitor de tela, nunca; hoje é texto visível `data-habit-anchor` (12 px, `--sm2-muted`) ao lado do nome.
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
**Dono de:** o combate do Pesadelo — luta curta de manhã, apresentação pura de `utils/nightmares.ts`, sem GameState nem localStorage. **Desde 04/10/2026 a luta é a `BattleStage` em tela cheia** (o diálogo só serve ao convite, à vitória e à derrota): HP e ENERGIA em cima de cada um, mascote da torcida, barra de cheer lenta (a energia e a barra seguem do 1º inimigo para o 2º), anel no especial do pet e esquiva no especial do pesadelo. **Desde o PR4 do Combate v3 (06/10/2026)** o motor é o núcleo (`groupFightSteps`, 1 inimigo por vez, HP e energia carregados), com as regras da Masmorra (`utils/dungeonFight.ts`, incluindo o ofício por `jeitoParaPve`: antes o Pesadelo ignorava o jeito) e o relógio de `games/useGroupBattle.ts`; ~22 s por inimigo. Props novas `petElement?`, `soul?` (o estado que o level lê) e `profissao?`.
**Props principais:** `NightmareBattleProps` — onda já montada (`buildNightmareWave`), raridade, callbacks `markFought`/recompensas resolvidos pelo App.
**Exports:** `NightmareBattleProps` (interface) · `NightmareBattle(props)` · `default`.
**Estado/efeitos relevantes:** `useState` (`idx`, `hpFrac`, `fightKey`, `seedLuta`, `phase`, `rewards`); `useRef` (HP e energia carregados, semente da noite, `waveRef`); `useCallback` (`rodadaDoNucleo`, `cena`, `aoFimDaLuta`); `useGroupBattle`; `useEffect` que reabre limpo com outra noite.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/NightmareBattle'" src`, 09/09/2026).
**Régua:** `src/components/NightmareBattle.render.test.tsx` (o convite, a cena em tela cheia, o anel, a esquiva, vencer, perder sem custo, a energia que segue de um inimigo para o outro); a régua de recompensa/onda vive em `src/utils/nightmares.test.ts`.
**Avisos do arquivo:** perder não custa nada (mesma regra da Masmorra) — tela de derrota diz "o sonho passou, você acorda bem"; tom sem horror/susto/vermelho de perigo; `DungeonGame` deliberadamente NÃO reutilizado — ele não aceita onda pronta, é uma run de 5 andares (não uma luta única) e escreve direto no localStorage (misturaria a economia da Masmorra com a do Pesadelo).

### `src/components/NotificationManager.tsx`
**Dono de:** o agendamento em memória de toasts/notificações locais (nudges de hábito, boa noite, lembrete de deitar) — não decide texto/hora (isso é `functions/api/_pushCopy.js`).
**Props principais:** `Activity`/`Task` (interfaces locais) · `NotificationManagerProps` — `activities`, `tasks`, `userName`, `petName`, `bornAt?` (WP1.17), `restWindow?` (WP3.11, opt-in), `isSleeping?`, `saveId?` (desde `42b07bec`, decisão #23 — amarra a inscrição de push à conta; repassado a `subscribeToPush`/`registerForPushNotifications`; entrou nas deps do efeito, então mudar de conta reenvia a inscrição).
**Exports:** `NotificationManager(props)`.
**Estado/efeitos relevantes:** `useRef` para datas de disparo únicas por dia (`lastEveningWarnDate`, `lastNudge10Date`, `lastNudge16Date`, `lastGoodnightDate`, `lastSleepReminderDate`); cinco `useEffect` de polling/agendamento; chama `pushCopy`/`sleepReminderCopy`/`eveningCopy` (`functions/api/_pushCopy.js` — mesma função lida pelo worker e pelo cron) e `checkAndShowNotifications`/`syncActivityAlarms`/`syncTaskAlarms`/`registerForPushNotifications` de `src/utils/notifications.ts`; usa `toast` (sonner) e o plugin nativo `SoulmonAlarm`. Desde `a6c1cd8a` a chamada de `unregisterFromPushNotifications()` (ao desligar push) leva `.catch(console.error)` — a função passou a rejeitar quando o servidor não confirma e o token local fica para a próxima tentativa.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/NotificationManager'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'NotificationManager.*test.ts*'` vazio, 09/09/2026); a paridade de horas com `_pushCopy.js` é testada no lado do worker.
**Avisos do arquivo:** dono único do texto/horário é `_pushCopy.js` — as três árvores (cliente, worker, cron) leem a mesma função, não reintroduza cópia local (footgun 9); `restWindow` ausente = sem lembrete de deitar (mecânica inteiramente opt-in).

### `src/components/PetPage.tsx`
**Dono de:** a página do Pet — a ficha viva da criatura, forma a forma, com skills recomputadas do perfil do oráculo.
**Props principais:** `PetPageProps` — `stages: CreatureStage[]`, `savedSkills?` (persistidas no save), `savedClassTitles?`, callback quando a página recomputa skills localmente, `headingLevel?: 1 | 2` (minimal-ui F5 — dentro da folha do Laboratório o nome da criatura desce para `<h2>`; padrão 1).
**Exports:** `PetPage(props)`.
**Estado/efeitos relevantes:** `useState` (`skills`, `classTitles`, inicializados de `savedSkills`/`savedClassTitles`); `useEffect` recomputa via o pipeline determinístico de `src/utils/soulProfile/ficha/` quando o perfil local (`SOULMON_PROFILE`) existe (desde 28/09/2026 passa o `dominantElement` de `buildFichaESkills` a `computeClassTitlesAllStages`, pra o card de classe não contradizer a bio do reveal); `useMemo` (`formas`); renderiza a forma atual dentro de `<Viewport>` em escala inteira. Desde `66e32d43` (21/09/2026, R2-3) a aura atrás da criatura é `auraForElement(dominantElement, 96)` (`utils/attackFxArt.ts`) a 2× = o vidro inteiro de 192 (`AURA`); quando só existe a 128² cai em `AURA_128` (256 com 32 px fora de cada lado — o corte declarado de X3 b).
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
**Props principais:** props inline (sem interface nomeada) — `language`, `onEarnPoints`, `onExit`; `evolutionStage` e `demoCharacterId?` SEGUEM no tipo (assinatura comum dos minijogos, o `AreaView` ainda passa) mas não são lidos — desde o canvas Jogos o pet não aparece na cena, e o visor vem do kit `games/GameKit.tsx`.
**Exports:** `RPSGame(props)` · `MATCH_POINTS` (5, Bits por partida vencida) · `WINS_NEEDED` (3) — exportados na minimal-ui F5 para `play/PlaySheets.tsx`.
**Estado/efeitos relevantes:** `useState` (`playerWins`, `petWins`, `playerHand`, `petHand`, `thinking`, `roundMsg`, `matchOver`); `useRef`/`useEffect` limpam o timer da IA ao desmontar; toca `playTaskComplete` (`src/utils/sounds.ts`). Delta `ae366480..5edfcfba` (C-11): ⚰️ o `playTaskComplete` ao vencer a partida saiu — `onEarnPoints(MATCH_POINTS)` e `setMatchOver('won')` sem som (vencer não é concluir tarefa, R-CAT); a frase "toca `playTaskComplete`" acima não vale mais.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy, lote Pedra, papel e tesoura de Jogos, minimal-ui F5; ⚰️ até então `ActivitiesPage.tsx`); `src/components/play/PlaySheets.tsx` importa `MATCH_POINTS`/`WINS_NEEDED` (24/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'RPSGame.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** as três peças eram emoji do sistema (dívida de arte, `docs/BACKLOG-ARTE-GERAR.md` item A11) — hoje são sprites próprios; cada peça carrega rótulo PT/EN próprio porque `<img>` não carrega nome acessível como o emoji carregava.

### `src/components/RebirthModal.tsx`
**Dono de:** a cerimônia de Renascimento — a única tela em que o jogador ESCOLHE a criatura (criatura livre + escola + elemento), disponível só depois do ultra.
**Props principais:** `RebirthModalProps` — `language`, `onConfirm(choices: RebirthChoices): Promise<boolean>|boolean`, `onClose()`.
**Exports:** `RebirthModal(props)` · `default`.
**Arte (01/10/2026, leva `visores`):** no topo do corpo, `OVO_RENASCIMENTO` (de `utils/visorScenes`: casulo de cristal com raízes, 256² desenhado a 128 px = 0,5×, `pixelated`, `data-rebirth-egg`, decorativo). O texto "nada mais é perdido" diz "Bits, Honra, Créditos…" (⚰️ "Emblemas"; REGISTRO §17).
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

### `src/components/SettingsModal.tsx` — ⚰️ apagado em `4a8b8049`

⚰️ **Apagado em 21/09/2026** (rodada QA GERAL, decisão do dono #37). Era o painel "Ajustes rápidos" (Sons / Trilha / Conversa com IA / Personalidade), aberto pelo `App.tsx` via `lazy()` a partir de `handleOpenAISettings` → `CompanionHUD` → `ChatBox.onOpenAISettings` — prop que o `ChatBox` destruturava e **nunca chamava** (sem gatilho vivo). Todas as quatro linhas já existiam na [`SettingsPage.tsx`](#srccomponentssettingspagetsx) (grupo "Som" + "Conversa com IA" + "Personalidade"), que é o único caminho do jogador; o mudo global tinha dois donos de UI e agora tem um. Saíram junto: `settingsOpen`, `handleOpenAISettings` (`App.tsx`) e a prop `onOpenAISettings` em `CompanionHUD`/`ChatBox`. Régua do caminho vivo: `src/components/settingsSom.render.test.tsx`.

### `src/components/SettingsPage.tsx`
**Dono de:** a página de Configurações — grupos por intenção do usuário, uma ação dominante (entrar/sincronizar). Desde `980bc84c` (21/09/2026) há o grupo **Som** (só se `onToggleSound` chegar): switch "Sons"/"Sound effects" (`checked={!soundMuted}` → `onToggleSound`) e switch "Trilha"/"Music" (estado local `trilha` por `trilhaPreferida()`; toque → `desligarTrilha()`/`ligarTrilha()` de `src/utils/trilha.ts` — o gesto da S2; hint "Duas camadas calmas, em loop…" ou, mudo, "Com os sons desligados, a trilha fica em silêncio."). Desde `5b91717c` (21/09/2026) há o grupo **Sobre**: os três limites da §16 da bíblia em voz de PRODUTO (não avalia/diagnostica/trata; questionário não é teste validado e mapa astral não prevê nada; o app não sabe nada além do que foi escrito) — a exceção declarada ao registro diegético (L10), sem "Malha" nem kit pixel.
**Props principais:** `SettingsPageProps` — `soundMuted?`, `onToggleSound?()` (desde `980bc84c`), `useAI`, `onToggleAI()`, `aiSettings`, `onSaveAISettings()`, `language`, `onChangeLanguage()`, `onOpenGuide()`, `onOpenGlossary()`, `notificationsEnabled`, `onToggleNotifications()`, `onRestoreFromCloud(saveId)`, `onLoginWithEmail(email)`.
**Exports:** `SettingsPage(props)`.
- `MENU_SHOWS_RITUAL_TOOLS` (`false`) — as ferramentas do ritual vieram do menu da Home, que saiu em 07/10/2026; a página recebe `onOpenCredits` e as mostra.
**Estado/efeitos relevantes:** `useState` para `trilha` (`trilhaPreferida()`, lido uma vez na montagem), `enabled` (telemetria, `isTelemetryEnabled()`), `showAISettings`, `copied`, `restoreInput`/`restoreStatus`, `emailInput`/`loginStatus`, `autoSleepEnabled`/`autoSleepStart`/`autoSleepEnd` (lidos via `readFlag`/`readLocal` de `STORAGE_KEYS.AUTO_SLEEP_*`); usa `useTheme` (`src/contexts/ThemeContext.tsx`); renderiza `AccountSection`, `AccountDataSection`, `InstallPrompt`.
**Chamado por:** `grep -rl "from '.*/SettingsPage'" src` (testes de telemetria); consumo real em `src/App.tsx` via `lazy(() => import('./components/SettingsPage'))` (09/09/2026).
**Sobre (desde `42b07bec`; reescrito em `a6c1cd8a`, QA Rodada 1 C1–C2):** o grupo "Sobre" ganhou o **aviso de IA** (decisão #22 — parágrafo `sm2Text`: "A imagem da sua criatura, as falas do chat e alguns sons (evolução, regressão e conclusão de tarefa) são gerados por IA (Higgsfield e Gemini para a imagem, Groq para a conversa), sem revisão humana." + que não é canal de emergência; ⚰️ a versão de `42b07bec` não citava os sons S16 nem a ausência de revisão), o `ActionRow` "O que o chat recebe" → `/privacidade.html#chat-contexto` (EN: `#chat-context`) e o terceiro limite da §16.3 da bíblia em `sm2Text` (⚰️ `sm2Hint` — era o único dos três limites em peso de rodapé). **Termos no app (`592e2c14`, QA Rodada 2 A4/A5):** o grupo Ajuda ganhou o `ActionRow` **"Termos de Uso"** → `/termos.html` (⚰️ não havia link para os Termos dentro do app) e a Política passou a abrir por idioma — em EN os dois apontam para a âncora **`#en`** (`/termos.html#en`, `/privacidade.html#en`, mesma tabela do `TermsUpdateBanner` — ⚰️ `#en` removida em 30/09/2026: hoje PT usa `#pt` e EN a página pura; ⚰️ abria sempre a versão PT); as linhas recebem `language` para o sufixo acessível "(abre em nova aba)" do `FormKit.ActionRow`. A linha de feedback `FeedbackRow` (`FeedbackLink.tsx`, `mailto:` com versão + 8 caracteres do `saveId`) **mudou para o grupo Ajuda** (`a6c1cd8a`, B3 — logo acima da linha "Soulmon `APP_VERSION`", que desde `a6c1cd8a` mostra **1.1.4** vinda do `package.json`). ⚠️ O cabeçalho da prop `soundMuted` diz que esta página é o ÚNICO caminho do mudo — verdade desde `4a8b8049` (⚰️ `SettingsModal`).
**Régua:** `src/components/SettingsPage.sobre.render.test.tsx` (aviso de IA PT/EN com sons e "sem revisão humana", link da política por idioma, `mailto:` com versão e trecho do `saveId`; +4 em `592e2c14`: Termos PT/EN com `#en` e "(abre em nova aba)" no nome acessível, `mailto:` sem o sufixo, `subject` por idioma + `BUILD_ID` no corpo), `src/components/settingsTelemetry.render.test.tsx` e, para o grupo Som, `src/components/settingsSom.render.test.tsx` (as duas chaves em PT/EN, o toque chega ao dono, sem `onToggleSound` o grupo não monta).
**Avisos do arquivo:** era ONZE cartões empilhados na ordem histórica de implementação — hoje nove grupos (`grep -c "<Group title=" src/components/SettingsPage.tsx` → 9, 21/09/2026; ⚰️ "cinco" era a contagem de 09/09/2026); o que é avançado (código de recuperação, restauração manual) vive atrás de revelação. Delta `ae366480..5edfcfba`: os `ActionRow` de Termos e Política apontam `#pt` em PT e a página pura em EN (⚰️ `#en`); ⚠️ a `Régua` acima ainda diz "Termos PT/EN com `#en`": `SettingsPage.sobre.render.test.tsx` já afirma `#pt` em PT, mas o título do `describe` e do `it` EN seguem falando em "âncora `#en`" — rótulo de teste defasado, o código manda.

### `src/components/SoulTestItem.tsx`
**Dono de:** desenha UMA pergunta do teste de personalidade (Likert/escolha forçada/cenário) — usado tanto no onboarding quanto na `OraclePage`.
**Props principais:** `SoulTestItemProps` — `item: Item`, resposta atual, callback de resposta, `optionStyle?` (agora com padrão `choiceStyle` de `form/FormKit.tsx`, em vez de exigir que todo chamador passasse o próprio estilo).
**Exports:** `itemPrompt(item)` — o enunciado no formato certo · `itemHint(item)` — dica de como responder · `SoulTestItem(props)`.
**Estado/efeitos relevantes:** nenhum — componente puro; `LIKERT_LABELS` fixa os cinco rótulos (1–5, extremos e meio sempre nomeados).
**Chamado por:** `src/components/OraclePage.tsx`, `src/components/SoulmonOnboarding.tsx` (`grep -rl "from '.*/SoulTestItem'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'SoulTestItem.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** único lugar que desenha os três formatos — onboarding e `OraclePage` usam o mesmo, senão o teste mediria coisas diferentes dependendo de onde foi respondido; escala Likert sempre 1–5 com extremos e meio rotulados (escala sem rótulo é adivinhação).

### `src/components/SoulmonOnboarding.tsx`
**Dono de:** o ritual de onboarding inteiro — consentimento, as 6 perguntas do oráculo, teste de personalidade opcional, criação de conta, reveal da criatura e o modo `upgrade` (desbloqueio no meio do jogo).
**Props principais:** `SoulmonOnboardingProps` (não totalmente citada no trecho lido) — `onComplete`, `mode?: 'onboarding'|'upgrade'`, `onRevealed?`, `onCancel?`.
**Exports:** `OnboardingCompleteData` (type) · `REVEAL_WAIT_MS` (const, 12_000 — quanto o reveal espera pelo desenho antes de seguir só com texto) · `GOOGLE_SEM_RESPOSTA_MS` (const, 120_000 — rede de segurança do login Google) · `SoulmonOnboarding(props)`.
**Estado/efeitos relevantes:** 51 ocorrências de `useState`/`useEffect`/`useRef`/`useMemo`/`useCallback` (`grep -c`, 09/09/2026); `lazy(() => import('./OraclePage'))` interno (ferramenta de dev, fora do bundle da intro); grava rascunho em `utils/oracleDraft.ts`/`utils/gateDraft.ts`; chama `generateOracle` (`src/utils/oracle.ts`), `buildConsentRecord`/`isAgeBlocked` (`src/utils/consent.ts`), `entrarComSenha`/`criarContaComSenha`/`entrarComGoogle` (`src/utils/auth.ts`), `purchase` (`src/utils/playBilling.ts`), `track`/`flushTelemetry` (`src/utils/telemetry.ts`). Delta `ae366480..5edfcfba`: `birthPlace` usa `cityLabel(birthCity, isPt)`; os links de Termos/Privacidade apontam `/termos.html#pt` e `/privacidade.html#pt` em PT e a página sem âncora em EN (⚰️ a âncora `#en` saiu — o padrão do HTML agora é o inglês).
**Chamado por:** `grep -rl "from '.*/SoulmonOnboarding'" src` (testes); consumo real em `src/App.tsx` via `lazy(() => import('./components/SoulmonOnboarding'))` (09/09/2026).
**Régua:** `.batismo.render.test.tsx`, `.copyRitual.render.test.tsx`, `.portao.render.test.tsx`, `.rascunho.render.test.tsx`, `.reveal.render.test.tsx`, `.contaExcluida.render.test.tsx` (desde `592e2c14` — lápide no login fica no portão com cabeçalho + região viva; sem lápide segue; `checarContaExcluidaNoLogin` chamado com o e-mail); também tocado por `src/components/telemetryWiring.render.test.tsx`.
**Avisos do arquivo:** ⚰️ **`FAVORITE_STEP` não renderiza mais nada desde 22/09/2026** — o degrau "Qual sua criatura favorita?" saiu do ritual (decisão do dono: o jogador só insere texto que vai para o prompt depois do Renascimento), e com ele os estados `favoriteCreature`/`skipFavorite` e o campo homônimo do `OracleInput` montado aqui. A **constante continua valendo 5**: `utils/oracleDraft.ts` persiste o `step`, então renumerar mandaria quem retomou um rascunho para a tela errada. O degrau é pulado nos dois sentidos (`next()` em `FAVORITE_STEP − 1` → `QUIZ_START`; `back()` em `QUIZ_START` → `FAVORITE_STEP − 1`) e o inicializador de `step` desvia para `QUIZ_START` o rascunho antigo parado nele. `ORACLE_DRAFT_VERSION` **não subiu**, de propósito. As 6 perguntas do ritual continuam sendo `ORACLE_QUESTIONS`; o teste psicométrico de 20 itens é bifurcação sem volta, decidida ANTES do reveal; modo `upgrade` roda o MESMO ritual sem intro/cadastro e troca só a criatura (estágio/atividades/Bits/histórico continuam). **Conta excluída (desde `a6c1cd8a`, adendo 11; reescrito em `592e2c14`, QA Rodada 2 F1/A1/A2):** `avisoContaExcluida` (`useState` com inicializador que lê E apaga `STORAGE_KEYS.ACCOUNT_DELETED_NOTICE`, uma vez) — e, **novo, o portão com lápide ANTES do onboarding**: `aposAutenticar(mail?)` (chamado pelos dois logins, senha e Google) roda `checarContaExcluidaNoLogin` (`cloudSave.ts`); conta com lápide → **não entra no "porquê"**: apaga a notice, mostra o aviso, limpa o e-mail e volta a `IDENTITY_STEP`. A R1 só descobria a lápide DEPOIS de criar conta nova sob o mesmo saveId (410 → wipe → loop — FATAL). Acessibilidade: a região `<div aria-live="polite" aria-atomic data-account-deleted-live>` existe VAZIA na primeira pintura e o texto entra pós-montagem (`avisoAnunciado`, `setTimeout(0)`) — senão o leitor de tela não anuncia; com aviso, renderiza `<section aria-labelledby="sm2-conta-excluida-titulo" data-account-deleted-notice>` com cabeçalho "Conta excluída"/"Account deleted" e a frase de `mensagemContaExcluida` com a data (⚰️ `<p role="status">` sem cabeçalho, sem saída — "se não foi você" agora tem texto). Idioma por `resolveLanguage`.

### `src/components/OraclePage.tsx`
**Dono de:** ferramenta interna de criação — a "metade da criação" do oráculo: elementos/papéis/alinhamentos/reinos, teste de personalidade, geração de prompts de sprite. Não tem entrada na navegação do jogo.
**Props principais:** `OraclePageProps` — `language?`, `initialDebugMode?` (semeia o modo sem custo, usado pelo atalho oculto da tela de intro). `SavedOracleForm` estende `OracleInput` com `seed?`, `overrides?`, `testAnswers?`, `city?`, `timeUnknown?`.
**Exports:** `OraclePage(props)`.
**Estado/efeitos relevantes:** 21 ocorrências de `useState`/`useEffect` (`grep -c`, 09/09/2026); usa `toast` (sonner); grava/lê `SavedOracleForm` via `readLocal`/`writeJson` (`STORAGE_KEYS`); chama `generateOracle` e os catálogos `ELEMENT_INFO`/`ROLE_INFO`/`ALIGNMENT_INFO`/`REALM_INFO` (`src/utils/oracle.ts`); renderiza `CityPicker`, `SoulTestItem`, `PixelizerCard`; usa `generateAllSprites` (`src/utils/spriteGen.ts`). Delta `ae366480..5edfcfba`: `birthPlace` usa `cityLabel(birthCity, isPt)`, e o título "Lua em/Moon in" mostra `signLabel(soulProfile.astrology.bigThree.moon, isPt)` (importado de `utils/soulProfile/astrology/labels`) em vez do nome cru do signo.
**Chamado por:** `grep -rl "from '.*/OraclePage'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/OraclePage'))` e em `src/components/SoulmonOnboarding.tsx` via `lazy()` interno (09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'OraclePage.*test.ts*'` vazio, 09/09/2026); o motor por trás é coberto em `src/utils/oracle.test.ts`/`src/utils/soulProfile/**.test.ts`.
**Avisos do arquivo:** o jogador comum nunca vê esta página — é ferramenta de criação; o nome da criatura-inspiração ⚰️ "nunca entra em prompt" foi REVERTIDO pelo dono em 27/09/2026 (D-B1): hoje vai na 1ª tentativa e não no fallback (regra travada em `pipeline.test.ts`, não aqui).

### `src/components/StatsPage.tsx`
**Dono de:** a página de Estatísticas — deixou de ser uma parede de números; só o Nível de Vínculo é leitura grande.
**Props principais:** `CompletedTask`, `ActivityStats` (interfaces internas) · `StatsPageProps` — dados de progresso, formas desbloqueadas, jornada (kills, runs, recorde da Corrida — `dinoBest`; a linha diz "marcaram N na Corrida"/"on the Obstacle Run" desde 30/09/2026), histórico de conclusões.
**Exports:** `StatsPageProps` (interface) · `StatsPage(props)`.
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

### `src/components/DailyRituals.tsx`
**Dono de:** a LISTA DO DIA da Home — o painel "Daily rituals" (tarefas ativas, hábitos devidos hoje, hábitos fora do dia, concluídas de hoje) e a gaveta "Put aside", sobre o canvas Atividades (identidade, `docs/design/wireframes/atividades/identidade/`, DECISÕES §20). Saiu do `App.tsx` em 20/09/2026.
**Props principais:** `DailyRitualsProps` — `tasks`, `activities`, `completedTasks`, `habitRhythms`, `hideMetrics`, `language`, `now`, `expanded`/`onExpand`, handlers (`onToggleTask`, `onEditTask`, `onPostponeNudge`, `onEditActivity`, `onToggleActivity`, `onUpdateStep`, `onRestoreTask`, `onCreate`), `ctaLabel`, `emptyMessage`, `variant?: 'panel' | 'home'` (Home B, minimal-ui F2: cabeçalho "Hoje N/M" + botão "+" no lugar do CTA largo; repassado ao `RitualPanel`), `dayComplete?` (o selo "Dia completo", regra da virada `completeDayReached`).
**Exports:** `DailyRituals(props)` · `frequencyLabel(activity, isPt, diasCurtos)` (veio do `App.tsx`) · `stepsLabel(done, total, isPt)` · `default`.
**Estado/efeitos relevantes:** nenhum — puramente apresentacional; compõe `RitualPanel`/`RitualRow` (`pixel/RitualPanel.tsx`), `TaskMeta`, `HabitConstancy compact` e `StepRow`. "feitos/total" = devidos hoje + concluídas de hoje (A4): o hábito fora do dia não entra no total, e a tarefa concluída hoje (já em `completedTasks`) continua na lista, riscada e inerte, até a virada. "N/M steps" só com N ≥ 1 (A7).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/DailyRituals'" src`, 20/09/2026).
**Régua:** `src/components/pixel/RitualPanel.render.test.tsx`, `src/components/dailyList.sm2.render.test.tsx`, `src/components/TaskMeta.render.test.tsx` (o caminho `App → DailyRituals → TaskMeta` do `onPostponeNudge`).
**Avisos do arquivo:** esmaecer é TINTA (`muted`), nunca `opacity` — na linha, na gaveta e no `<details>`; `someday`/`dropped` ficam na gaveta, nunca na lista; o selo da linha é o TIPO (`task_alt`/`event_repeat`), não a categoria.

### `src/components/TaskMeta.tsx`
**Dono de:** a faixa de metadados de uma tarefa (assombrada/atrasada/parada/adiada) — a diferença entre ALERTA e CONVITE, sem vermelho de cobrança.
**Props principais:** `TaskMetaProps` (exportado) — a tarefa e o relógio (`now`), sem GameState.
**Exports:** `sm2Tag` (estilo do selo de metadado) · `TaskMetaProps` (interface) · `TaskMeta(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — puramente apresentacional; usa `effortOf`/`isHaunted`/`daysStale`/`isOverdue`/`needsPostponeNudge` de `src/utils/taskTriage.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/TaskMeta'" src`, 09/09/2026); também exercitado por `src/components/dailyList.sm2.render.test.tsx`.
**Régua:** `src/components/TaskMeta.render.test.tsx`.
**Avisos do arquivo:** roxo do assombro (`--sm2-*`, não mais hex cru `#7c5cbf`) — NÃO é vermelho, é a mecânica; opacidade global (`opacity: 0.72`) foi removida porque derrubava o contraste de todo o conteúdo junto (chips caíam para 2,94:1); tarefa assombrada anuncia bônus de alívio, é mini-chefe, não acusação.

### `src/components/TournamentPage.tsx`
**Dono de:** o conteúdo da folha **Torneio** da Arena (PvP assíncrono; desde minimal-ui F5, 24/09/2026, mora dentro do `AreaSheet` — o `<h1>` saiu, o título é da folha). Abas: **Faixa** (abre nela — as 5 faixas em fila, progresso, ranking em janela de ±3), **Desafiar** (opt-in do PvP com o gate de Vínculo e o aviso do nick, oponentes), **Missões** (as missões da semana, pagas em Honra) e **Loja** (os prêmios de `tournamentShopItems()` de `utils/mercadoCatalog.ts`, só cosmético, só Honra, pintados pela `ShopShelf`). Placar de derrota em tinta neutra.
**Props principais:** `TournamentPageProps` — `headSlot?` (encaixe do canto do título: `undefined` = indicador inline; `null` = espera; elemento = portal), `saveId`, `pvpEnabled` (gate de vínculo mínimo), `language`, callbacks de partida, `weeklyMissions?`/`onClaimWeekly?` (antes na `ShopModal`), `shop?` (`ownership` + `actions` da prateleira; sem ele, não há aba Loja).
**Exports:** `TournamentPage(props)`.
**Estado/efeitos relevantes:** `useState` para `opponents`, `matchesLeft`, `loadFailed`, `rank`, `rankFailed`, `fighting`, `result`, `fightError`, `rankExpanded`, `tab` (`'arena' | 'missions' | 'shop'`, abre em `arena`; menu só de ícone — `swords`/`task_alt`/`storefront` — nas classes `sm2-kit-tab*`, nome em `aria-label`/`title`), `tiersOpen` (a folha das faixas, antiga aba Faixa, aberta pelo indicador `data-tier-indicator` no canto do título; o ranking agora é buscado ao montar); `useShopFlash()` para a região de status da loja; a linha do topo é a rodada da semana (`tournamentWindowLabel` de `utils/tournamentSeason.ts`) + a Honra (a moeda `emblems`: o rótulo "Honra"/"Honor" vale na UI desde 30/09/2026, REGISTRO §17 — ⚰️ "Emblemas"; o id, o campo do save e `EMBLEMS_PER_WIN` não mudaram); `useEffect` (`loadOpponents`) recarrega ao mudar `pvpEnabled`/`saveId`; partida resolvida no servidor (`playMatch`), sem frame de combate local. Desde `66e32d43` (21/09/2026, R2-2 — D-J13 cumprida) a criatura do oponente (mini-visor 64) e a do ranking (mini-visor 32, a cabeça) vêm de `lineIconForStage(stage, 64 | 32)` (`utils/lineIcons.ts`), `pixelated`; quando o estágio não é de linha cai em `getSpriteForStage` (0,25× / 0,125× com filtro `auto`). Delta `ae366480..5edfcfba` (duelo fantasma, 30/09/2026): novos `useState` `duel` (`{ opp, seed, me, oppStats }` do duelo em andamento) e `myDuel` (a ficha `DuelStats` do jogador, vinda de `r.me.duel` em `loadOpponents`). `fight(opp)` só abre duelo quando o servidor mandou a ficha (`opp.duel && myDuel`): chama `startDuel` (`utils/community.ts` — `duelStart`, que gasta a partida e devolve a semente) e guarda `duel`; sem a ficha (servidor antigo) cai em `resolveMatch(opp, [])`. `resolveMatch(opp, cheers, forfeit = false)` chama `playMatch(saveId, opp.id, cheers, forfeit)`, e no `finally` zera `duel` e recarrega os oponentes (a semente depende da partida do dia). `leaveDuel(opp)` = `resolveMatch(opp, [], true)` — sair antes do fim é derrota. Com `duel` ativo o componente devolve `<DuelScreen>` no lugar da folha (`onDone` → `resolveMatch` com as torcidas; `onClose` → `leaveDuel`). ⚰️ "partida resolvida no servidor, sem frame de combate local" — agora há animação local, mas a decisão segue no servidor.
**Arte (30/09/2026, rodada 3; faixas e ícones da rodada 7, 04/10/2026):** `TierMark({ id, size: 24 | 32, state: 'current' | 'passed' | 'next' })` (interno) mostra a INSÍGNIA em pixel da faixa quando `TIER_INSIGNIA_ART[id]` (de `assets/soulmon/icones-ui`, `data-tier-insignia`, `pixelated`) tem arte — hoje o mapa está VAZIO e as 7 faixas clássicas (Madeira→Mestre) saem como glifo sem box de `TIER_ICON` — no cartão da faixa (32) e na fila das 7 faixas (24); a aba Missões usa o `question` em `tone="gold"` (A2); a faixa ainda não alcançada sai apagada por FILTRO (`grayscale(1) brightness(0.55)`), nunca por `opacity`; id sem arte cai no glifo Material de `TIER_ICON`. O aria do saldo, a dica da loja e o resultado da partida dizem "Honra".
**Chamado por:** `src/components/nav/AreaView.tsx` via `lazy(() => import('../TournamentPage'))`, dentro da folha Torneio da Arena, com `shop={{ ownership, actions }}` (24/09/2026; ⚰️ até a minimal-ui F5, `lazy` direto no `App.tsx`); também `src/components/TournamentPage.bondGate.test.tsx`.
**R8 (04/10/2026):** (1) a faixa lê também a POSIÇÃO na season (`serverPlace` ← `myPlace` de `getRank(undefined, saveId)`; fallback `resolveSeasonPlace` = índice na lista pública): Mestre (top 100) e Grão-Mestre (top 20, glifo `bolt`) saem com o "#N" (`data-tier-place`) no indicador, no cartão e na fila — agora as 8 de `TOURNAMENT_LADDER`; (2) lista de oponentes VAZIA → os três desafiantes NPC de `utils/tournamentNpcs.ts` (`data-torneio-npc`), que abrem o TREINO (`startTraining(npc)`, sem rede, partida ou ganho); (3) UM só `InfoTip` ("Sobre o Torneio"/"About the Tournament", `data-torneio-info`) no canto superior direito, com `InfoTipSection` para faixas, desafiar/lista pública, luta e treino, missões, loja e molduras — os cinco de antes saíram; (4) MOLDURAS: props `equippedFrame?`, `ownedFrames?`, `onEquipFrame?`; botão "Moldura" (`data-frame-open`) na folha das faixas abre um `RitualDialog` com o `FrameSelector`; a linha do próprio jogador no ranking sai com `AvatarFrame`.
**Régua:** `src/components/TournamentPage.bondGate.test.tsx`, `src/components/TournamentPage.r8.render.test.tsx`, `src/components/arena/arenaSheets.render.test.tsx`, `src/utils/weeklyMissions.fiacao.test.ts`.
**Avisos do arquivo:** cena de arena NÃO existe aqui — a moldura antiga (fundo pintado + véu) saiu inteira, junto da razão de a tela ser escura no tema claro; a FAIXA sempre vem ANTES do ranking (posição absoluta é associada a comparação tóxica); ranking é janela de ±3, nunca lista completa; derrota é tinta neutra, nunca vermelho.

### `src/components/TriagePile.tsx`
**Dono de:** "Arrumar a Pilha" — a triagem em massa de tarefas atrasadas/assombradas, apresentação pura sobre `triageQueue`.
**Props principais:** `TriagePileProps` (exportado) — a fila já pronta (`TriageTask[]`), callbacks das quatro ações (hoje/esta semana/algum dia/deixar pra lá), `language`.
**Exports:** `TriageAction` (type) · `TriagePileProps` (interface) · `TriagePile(props)` · `default`.
**Estado/efeitos relevantes:** `useState` (`resolved: string[]`); `useMemo` (`remaining`); `useEffect` sincroniza com a fila recebida; usa `useDialogA11y`; lê `effortOf`/`daysStale`/`isOverdue`/`deadlineAt` de `src/utils/taskTriage.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/TriagePile'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'TriagePile.*test.ts*'` vazio, 09/09/2026); a fila em si é travada em `src/utils/taskTriage.test.ts`.
**Avisos do arquivo:** as quatro saídas têm o mesmo peso visual — "Deixar pra lá" não é o botão feio do canto; nenhum vermelho de cobrança, nenhum total de pendências gritando no topo; dá para sair no meio sem penalidade.

### `src/components/UndoToast.tsx`
**Dono de:** o toast de "Desfazer" da conclusão de hábito (decisão do dono #57, 22/09/2026) — o ÚNICO toast do app que o usuário precisa acionar, e por isso o único com marcação própria.
**Props principais:** `language`, `mensagem` (já traduzida pelo chamador), `onUndo()`.
**Exports:** `UndoToast(props)`.
**Estado/efeitos relevantes:** nenhum — componente de apresentação, montado por `toast.custom` do `sonner` com `duration = UNDO_WINDOW_MS`.
**Chamado por:** `src/App.tsx` (`ofereceDesfazer`).
**Régua:** `regrasDeJogo.qaRodada2.test.ts` (bloco `#57`, a regra por trás).
**Avisos do arquivo:** o `sonner` 2.0.3 não põe `role` nenhum no toast e o botão de ação dele tem ~24px de alvo — daí `role="status"` e o alvo de 44×44 escritos à mão aqui; PT+EN como todo texto do app.

### `src/components/UnlockAccountModal.tsx`
**Dono de:** o desbloqueio completo DENTRO do jogo (não só na tela inicial) — o modal de compra e o convite discreto `UnlockNudge`.
**Props principais:** `UnlockReason` (type: `'task-limit'|'evolution'|'report'|'shop'`) · `UnlockAccountModalProps` — `language`, entitlement atual, motivo do convite, callbacks de compra/restauração.
**Exports:** `UnlockReason` (type) · `UnlockAccountModal(props)` · `UnlockNudge(props)` — convite discreto, uma linha clicável, só para contas `demo`.
**Estado/efeitos relevantes:** `useState` (`loading: 'buy'|'restore'|null`, `message`); usa `purchase`/`restorePurchases`/`isBillingAvailable` (`src/utils/playBilling.ts`), `useUnlockPriceLabel` (`src/utils/priceLabel.ts`), `track`/`unlockReasonCode` (`src/utils/telemetry.ts`).
**Chamado por:** `src/App.tsx`, `src/components/CreateModal.tsx`, `src/components/DailyReportModal.tsx`, `src/components/EditModal.tsx`, `src/components/ShopModal.tsx` (`grep -rl "from '.*/UnlockAccountModal'" src`, 09/09/2026; ⚰️ `ShopModal.tsx` apagado na minimal-ui F5 — o convite do Mercado mora em `mercado/MercadoSheets.tsx`); também tocado por `src/components/telemetryWiring.render.test.tsx`.
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
**Chamado por:** `src/components/EvolutionPath.tsx` (`grep -rl "from '.*/SoulNode'" src`, 20/09/2026 — era `EvoTrail.tsx` também, mas esse arquivo foi apagado em `7ea27825`).
**Régua:** nenhuma direta (`find src/components/evolution -maxdepth 1 -name 'SoulNode.*test.ts*'` vazio, 09/09/2026); exercitado pelos testes de `EvolutionPath.tsx`.
**Avisos do arquivo:** divisão de responsabilidade de propósito — `nodeArt.tsx` desenha, `SoulNode` interage, `EvolutionPath` monta o grafo; alvo sempre ≥44px mesmo quando o cristal desenhado é menor.

### `src/components/evolution/nodeArt.tsx`
**Dono de:** a fronteira única de arte do nó da árvore — hoje quatro PNGs 128×128 (um por `SoulNodeVisual`), não SVG.
**Props principais:** `NodeArtProps` (exportado) — `visual: SoulNodeVisual`, `size` → devolve um quadrado `size`×`size`px, decorativo (`aria-hidden`).
**Exports:** `SoulNodeVisual` (type: `'current'|'reached'|'forecast'|'locked'`) · `NODE_SIZE`/`NODE_GLASS`/`NODE_SPRITE` (medidas do nó, 88/80/64) · `NodeArtProps` (interface) · `NodeArt(props)`.
**Estado/efeitos relevantes:** nenhum — módulo de arte estático, importa os 4 PNGs de `src/assets/soulmon/evolution/`.
**Chamado por:** `src/components/evolution/SoulNode.tsx` (`grep -rl "from '.*/nodeArt'" src`, 09/09/2026).
**Régua:** `src/components/evolution/nodeArt.render.test.tsx`.
**Avisos do arquivo:** a troca SVG→PNG foi FEITA em 18/08/2026 — arte gerada e recortada por algoritmo, medida contra `src/assets/assets.contract.test.ts` (0,00% magenta, 0,6–2,2% cinza, teto 5%, 12–23% de transparência real); hierarquia visual CRESCENTE em presença (locked→forecast→reached→current) carrega o significado sem depender só de cor.

### `src/components/figma/ImageWithFallback.tsx` — ⚰️ apagado em `592e2c14` (22/09/2026, QA Rodada 2)
Era um `<img>` com fallback visual (SVG de erro em base64) remanescente do import do Figma, sem consumidor desde 09/09/2026. O fallback de sprite que o app precisava de verdade entrou por `onError` dentro de `CompanionHUD.tsx`/`EvolutionPath.tsx` (E2), sem componente genérico. A pasta `src/components/figma/` deixou de existir.

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
**Props principais:** cada função tem props próprias — `Field` estende `React.InputHTMLAttributes<HTMLInputElement>` (+ `warn?`); `Chip`, `Segment`, `CheckRow`, `ModalSheet` (I2/I3, 02/10/2026: entra subindo com o véu em fade — classes `sm2-sheet-rise`/`sm2-sheet-fade`; o fechar é um `BackArrow icon="close"` numa linha PRÓPRIA acima do título; `closeSide?: 'start' | 'end'` move o X para a direita só para folha que encerra atividade; `onBack?` troca o fechar pela seta de voltar de uma sub-tela da folha), e desde 20/09/2026 (canvas Conta §29) `GroupCard`, `SwitchRow`, `ActionRow`, `Disclosure`, `TimeField`, `AlertLine` têm assinaturas próprias (ver o corpo, arquivo de 614 linhas, `wc -l`, 20/09/2026).
**Exports:** `SM2_SHADOW_CARD`, `SM2_SHADOW_SHEET` (const) · `sm2Text`, `sm2Hint`, `sm2Label`, `sm2TitleStyle` (const, estilos de texto) · `Sm2ButtonVariant`, `Sm2ButtonSize` (type) · `sm2Button(variant, disabled?, size?)` · `Field(props)` — agora com `warn?` · `FieldWarn(props)` — legenda âmbar de convite abaixo de um `Field` com `warn` · `choiceStyle(selected)` — estilo de opção em linha inteira · `Chip(props)` · `Segment(props)` · `CheckRow(props)` · `ModalSheet(props)` — bottom sheet com `useDialogA11y` embutido · `GroupCard(props)` — card por intenção, canvas Conta · `SwitchRow(props)` — linha de configuração `role="switch"`, alvo = linha inteira · `ActionRow(props)` — linha que leva a outro painel/guia/política · `Disclosure(props)` — revelação colapsável · `TimeField(props)` — campo de hora com ícone `schedule` · `AlertLine(props)` — `role="alert"` em âmbar · `default`.
**Estado/efeitos relevantes:** `useState` interno a alguns componentes (ex.: `ModalSheet`); usa `useDialogA11y` (`src/hooks/useDialogA11y.ts`) para foco preso/Escape/devolução de foco. Desde `a6c1cd8a` (design-critic B2) o `ActionRow` com `href` começando em `mailto:` renderiza `<a>` **sem** `target="_blank"` — `_blank` num `mailto:` deixava uma aba em branco atrás do app de e-mail em alguns navegadores. **Desde `592e2c14` (QA Rodada 2 A6) o `ActionRow` aceita `language?: Language`** e, para `href` externo (não-`mailto:`), acrescenta ao rótulo um `<span>` só para leitor de tela — "(abre em nova aba)"/"(opens in a new tab)" — via `SR_ONLY` inline (não existe classe `sr-only` no `index.css`, footgun 1); sem a prop, o idioma vem de `resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE))`. Arquivo com 638 linhas (`wc -l`, 22/09/2026).
**Chamado por:** praticamente toda a árvore de telas/modais (`grep -rl "from '.*/FormKit'" src` lista dezenas de arquivos — `AISettingsModal`, `AccountDataSection`, `CreateModal`, `DailyReportModal`, `ShopModal`, `SoulmonOnboarding` etc., 09/09/2026).
**Régua:** nenhuma direta (`find src/components/form -maxdepth 1 -name 'FormKit.*test.ts*'` vazio, 09/09/2026); exercitado indiretamente por todos os `.render.test.tsx` das telas que o usam.
**Avisos do arquivo:** `Field` é nativo, não o `Input` do shadcn (aquele sorteia `id`/`name` a cada montagem, quebrando `htmlFor`, e traz `--foreground`/`--background` presos ao tema claro); tudo por `style` inline, nada por classe utilitária nova (Tailwind pré-compilado — classe fora do `index.css` não aplica nada, footgun 1); `ModalSheet` vem de baixo de propósito (o polegar alcança).

### `src/components/pixel/HomeHud.tsx`
**Dono de:** o HUD do topo da Home — marca à esquerda, medidores segmentados de HP/Energia/Bits abaixo, sob o orçamento de 5 leituras numéricas (`PLANO-DESIGN` §5.1).
**Props principais:** `HomeHudProps` — HP, energia, Bits, `language`, `focusSealed?`, `leading?: ReactNode` (B2, 02/10/2026 — slot na ponta ESQUERDA, onde o `App` põe o botão do menu só ícone), `trailing?: ReactNode` (ponta direita, reserva o espaço do link do Mapa, que é `fixed` no topo) e `petName?` (B1 — só o nome do Soulmon, ao lado do logo).
**Exports:** `HomeHud(props)`.
**Estado/efeitos relevantes:** nenhum — apresentação pura sobre valores já calculados.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/HomeHud'" src`, 24/09/2026; ⚰️ o `CompanionHUD` não o importa mais).
**Régua:** `src/components/pixel/HomeHud.render.test.tsx`, `.selo.render.test.tsx`.
**Avisos do arquivo:** Créditos e os 3 atributos SAÍRAM deste HUD (troca declarada: Vínculo só entraria se duas leituras saíssem no mesmo PR) — Créditos continuam acionáveis no menu/`CreditsModal`, atributos moram em "CURRENT ALIGNMENT" na `EvolutionPath`; `TODO(Vínculo)` aberto para uma terceira `.sm2-meter` lendo `src/utils/bond.ts`, sem tirar outra leitura antes; Bits sem ícone, fonte de calculadora, para não repetir o bug do ícone 💎 compartilhado com Créditos.

### `src/components/pixel/EvolveButton.tsx`
**Dono de:** o botão "Evoluir" da Home (B3, 02/10/2026) — centralizado no alto da área do pet, moldura pixel dupla + brilho pulsante em CSS (`.sm2-evolve-btn`, `index.css`).
**Props principais:** `language`, `onClick?`, `reducedMotion`, `style?` (posição).
**Exports:** `EvolveButton(props)` · `EVOLVE_BTN_H` (56, o balão desce essa altura) · `EVOLVE_BTN_ART` (URL de `src/assets/icons/evoluir-btn.png` se o arquivo existir; senão `undefined` e vale o CSS — ponto de troca para a arte do dono, que deve vir SEM texto).
**Estado/efeitos relevantes:** nenhum; o pulso é só `box-shadow` e some com movimento reduzido.
**Chamado por:** `src/components/CompanionHUD.tsx`.
**Régua:** `src/components/CompanionHUD.cta.test.tsx`, `CompanionHUD.render.test.tsx`.
**Avisos do arquivo:** rótulo é texto vivo PT/EN (alvo ≥ 44, `aria-label`); a regra de movimento reduzido mora no bloco canônico do `index.css`.

### `src/components/pixel/PixelKit.tsx`
**Dono de:** os primitivos de UI da direção visual pixel (`docs/ui-refs/SPEC-UI-PIXEL.md`) — botão, painel, barra segmentada, checkbox, abas, chip, tag, switch, medidor, slot.
**Props principais:** cada função tem sua interface própria — `PixelButtonProps`, `PixelPanelProps`, `PixelSegmentedBarProps`, `PixelCheckboxProps`, `PixelTabItem`/`PixelTabsProps`, `PixelChoiceChipProps`, `PixelTagProps`, `PixelSwitchProps`, `PixelMeterProps`, `PixelSlotProps`, `PixelChipProps` (arquivo de 556 linhas — corrigido de "557" por doc-verificador, `wc -l`, 10/09/2026).
**Exports:** `PixelSize` (type) · `PixelTone` (type: `'cyan'|'red'|'gold'`) · `PixelButton(props)` · `PixelPanel(props)` — `titleIconName?` novo (ícone do título por nome, além do `titleIcon` de imagem) · `PixelSegmentedBar(props)` · `PixelCheckbox(props)` · `PixelTabs(props)` — conserto do "G9" (a seleção de aba passou a ser carregada pela sublinha, não só por cor de texto) · `PixelChoiceChip(props)` · `PixelTag(props)` — sem hover, é etiqueta informativa · `PixelSwitch(props)` · `PixelMeter(props)` · `PixelSlot(props)` — casa de 44px, fallback é o quadro vazio, nunca emoji do sistema · `PixelChip(props)` — `iconName?` novo, ao lado do `icon` de imagem.
**Estado/efeitos relevantes:** nenhum estado global — cada primitivo é apresentacional; a arte 9-slice usa PNGs recortados na bbox alfa (`src/assets/soulmon/ui/btn-{sm,md,lg}.png`, via `sharp`, determinístico).
**Chamado por:** `src/components/ArenaGame.tsx`, `CompanionHUD.tsx`, `DinoGame.tsx`, `DungeonGame.tsx`, `GameTutorialFlow.tsx`, `NightmareBattle.tsx`, `PlayCard.tsx`, `RPSGame.tsx`, `RestWindowCard.tsx`, `StepsCard.tsx`, `WeeklyReportCard.tsx`, `pixel/RitualPanel.tsx` (`grep -rl "from '.*/PixelKit'" src`, 09/09/2026).
**Régua:** `src/components/pixel/PixelKit.render.test.tsx`; também exercitado por `src/components/pixel/PixelStates.render.test.tsx`.
**Avisos do arquivo:** os quatro estados (normal/hover/active/disabled) são arte DERIVADA do `normal` (classificação de pixel cobre/teal), não redesenhados — fatia que não bate faz a moldura pular no hover; os nove arquivos medem 0,0000% de magenta (resíduo antigo apagado por inpainting); a barra segmentada é DOM, não PNG.

### `src/components/pixel/RitualPanel.tsx`
**Dono de:** o painel de rituais da Home — um painel titulado, coluna única, linhas de ~72px, dimensionado para o PT-BR (mais longo que o EN).
**Props principais:** `RitualRowProps` (exportado), `RitualPanelProps` (exportado) — lista de itens (hábitos/tarefas do dia), progresso segmentado, callback de concluir/editar; `RitualPanelProps.variant?: 'panel' | 'home'` (minimal-ui F2: `home` = a lista da Home B, sem o painel em volta — cabeçalho `<h2>` "Hoje" com o contador `N/M` só com feitos ≥ 1 (piso E5), botão "+" `data-ritual-add` no papel do CTA; vazio SIS-06 `task_alt` 48 ciano, que na Home B ganha o CTA largo) e `dayComplete?` (selo "Dia completo" — quem decide é a regra da virada, nunca o painel).
**Exports:** `RITUAL_TEXT_INSET` (const — recuo do texto até o fim do selo) · `RitualKind` (type: `'task'|'habit'`) · `RITUAL_KIND_ICON` (const, mapa `RitualKind`→nome do ícone: `task_alt`/`event_repeat` — substitui o antigo `RitualIcon`, removido) · `RitualRowProps` (interface) · `RitualRow(props)` · `RitualPanelProps` (interface) · `RitualPanel(props)`.
- `RITUAL_FLIP_MS` (420, deslize da linha concluída) · `RITUAL_GLOW_MS`.
**Estado/efeitos relevantes:** nenhum estado próprio — apresentação pura; etapas nascem RECOLHIDAS (barra segmentada mostra `2/4`, expansor abre para marcar). **A11 (`592e2c14`, QA Rodada 2):** o `RitualCheck` inerte usa SÓ `aria-disabled`, nunca `disabled` junto — o `disabled` nativo tira o checkbox da ordem de foco e do leitor de tela, e a pessoa deixava de saber que o item existe e está concluído; inerte = anunciado como inerte, alcançável, clique sem efeito.
**Chamado por:** `src/components/DailyRituals.tsx` (`grep -rl "RitualPanel'" src`, 24/09/2026; ⚰️ o `App.tsx` o importava direto até a lista sair para `DailyRituals`).
**Régua:** `src/components/pixel/RitualPanel.render.test.tsx`.
**Avisos do arquivo:** coluna única até 768px (duas colunas só a partir daí, e nem isso é feito aqui); nome do item trunca com `…` + `title` completo, nunca altura dependente de texto; sem ícone não sobra caixa vazia (quadro de cobre em volta do ícone saiu por direção do dono); a coluna de texto inteira é o botão de editar.

### `src/components/pixel/SpriteAnim.tsx`
**Papel:** spritesheet quadro a quadro DENTRO do visor — tira horizontal de N células avançada por `background-position` em `steps(N)`; `prefers-reduced-motion` mostra o último quadro (`.sm-sheet` no bloco único de movimento reduzido do `index.css`).
**Props:** `sheet` (`AnimSheet` de `utils/animArt.ts`), `size`, `durationMs`, `loop`, `style`, `className`.
**Estado/efeitos relevantes:** nenhum — apresentação pura.
**Usado por:** `CompanionHUD.tsx` (coração do carinho, respingo do banho, Z do sono, migalhas), `CareSystem.tsx` (plop do cocô).

### `src/components/pixel/VisorBar.tsx`
**Papel:** barra segmentada PIXEL dentro do visor (D3): moldura 96×8 + segmentos 6×6 de `utils/hudArt.ts`; meia unidade = segmento de 3 px. A barra DOM da Home é do aparelho e continua.
**Props:** `value`, `max`, `label`, `style`.
**Usado por:** `CompanionHUD.tsx` (HP e energia no canto do palco, `data-visor-hud`).

### `src/components/games/GameKit.tsx`
**Dono de:** as peças partilhadas dos minijogos pelo canvas Jogos (DECISÕES §25, D-J3…D-J8): a página que toma a tela (`GameRoot`, `data-game-root`, reserva embaixo a faixa do link de canto `--sm-corner-h` — B2; ⚰️ era `--sm-bottomnav-h`, a barra que saiu na minimal-ui F1), o chrome vetor (`GameHeader`: Fredoka 20 ou Rubik 14/500 na run + linha 12 `muted` + × 44 pelado, o PRIMEIRO interativo), o **visor de jogo** (`GameVisor`: `Viewport` a 2× de 174 lógicos = 348 CSS px, cena em `cover` com `image-rendering: auto`, filhos absolutos dentro), o sprite 256² a 128/64 (`VisorSprite`, `flip` = de frente para o pet, idle `.sm-battle-idle`), o FX 128² a 1×/0,5× (`VisorFx`, chave EMOJI de `FX_ART`), as barras de HP fora do vidro (`HpBars` sobre `PixelMeter`: "You" ciano, o outro `gold-fill` — nunca ❤️/vermelho), o popup do golpe (`FxPopup`: `role=status` com o FX num `MiniGlass` 64 + título 14/500 + detalhe 12 `muted`, mesma tinta em "PERFECT!" e "Too slow!"), a etiqueta 24 com valor em `ink` (`StatTag`) e os estilos de fase (`phaseTitle`/`phaseLine`).
**Exports:** `GAME_VISOR_W` (174) · `DIALOG_VISOR_W` (144) · `GameRoot` · `GameHeader` · `GameVisor` · `VisorSprite` (prop `hop`: contador de acertos → pulinho de 300 ms, classe `.sm-visor-hop`, usado por `EcoGame` e `BolhasGame`; 04/10/2026) · `VisorFx` · `HpBars` · `FxPopup` · `StatTag` · `phaseTitle` · `phaseLine`.
- `gameExitConfirm(isPt, what?)` — texto padrão da confirmação de sair de partida em andamento (`GameHeader exitConfirm`).
**Estado/efeitos relevantes:** nenhum — peças puras; a escala inteira é do `Viewport`.
**Chamado por:** `src/components/DungeonGame.tsx`, `NightmareBattle.tsx`, `ArenaGame.tsx`, `DinoGame.tsx`, `RPSGame.tsx`, `TournamentPage.tsx` (24/09/2026).
**Régua:** exercitado por `ArenaGame.render.test.tsx` (a raiz `data-game-root` é a MESMA da Masmorra).
**Avisos do arquivo:** tudo por `style` inline (footgun 1); `scene` é o shorthand `background` de `utils/dungeonScenes.ts` (`url(...) center/cover` ou pilha de gradientes) — nunca `backgroundColor`, e sem misturar com `backgroundSize`/`backgroundPosition` (aviso do React em re-render); o FX de derrota/faísca vai sempre na caixa do OUTRO, nunca sobre o pet (X1 da crítica).

### `src/components/pixel/TimingBar.tsx`
**Dono de:** a mecânica de timing de todo combate do Soulmon — marcador vaivém, `onStop` devolve precisão 0..1; quem interpreta o número é cada jogo.
**Props principais:** `TimingBarProps` (exportado) — `speed` (ciclos/segundo), `label`, `onStop` (precisão 0..1), `ariaLabel?`. A prop `color` saiu no canvas Jogos (D-J6): a barra é vetor por token (trilho `surface-2` + fronteira `muted`, zona central `primary-soft` com filetes `primary-ink`, marcador `primary-ink` 3×22, botão primário 48) — a mesma peça em todo jogo.
**Exports:** `TimingBarProps` (interface) · `TimingBar(props)`.
**Estado/efeitos relevantes:** `useState` (`pos`); `useRef` (`posRef`, `rafRef`, `stoppedRef`); `useEffect` roda o loop `requestAnimationFrame`.
**Chamado por:** `src/components/ArenaGame.tsx`, `src/components/DungeonGame.tsx`, `src/components/NightmareBattle.tsx` (`grep -rl "from '.*/TimingBar'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components/pixel -maxdepth 1 -name 'TimingBar.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** era código local em `DungeonGame.tsx`, COPIADO para `NightmareBattle.tsx` (footgun 9 documentado no próprio cabeçalho antigo) — esta é a extração feita antes da Arena existir, para não abrir uma terceira cópia; ⚠️ não acrescentar regra de jogo aqui (dano/elemento/crítico/carga de especial são de quem chama) — a barra só mede.

### `src/components/refugio/RefugeInviteCard.tsx`
**Dono de:** o cartão do convite ao Refúgio no slot de avisos da Home — copy do parecer do psicólogo ("Um respiro?"; voz do pet falando de si; sem humor, sem crise, sem promessa). Marca "exibido" ao montar.
**Exports:** `RefugeInviteCard({ language, onShown, onAccept, onDismiss })`.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/components/refugio/refugeInvite.render.test.tsx`, `src/components/filaDeAvisos.contract.test.ts`.

### `src/components/refugio/RespiracaoGame.tsx`
**Dono de:** Respirar com o Soulmon — escolher ritmo e 1–3 min; a bolha enche e esvazia sozinha e o pet respira junto (movimento reduzido: opacidade + barra, sem escala). Aviso de ajuda profissional nas três telas. Sem pontuação, sem Bits. Delta `bcfe7ca6..e3d55bb8` (01/10/2026, leva `visores`): os três `GameVisor` recebem `scene={REFUGIO_SCENE}` e a bolha é o sprite 48² `MINI_FX.bolhaRespiro` com `BUBBLE = 144` (3× inteiro; ⚰️ 136 px com círculo e borda em CSS).
**Exports:** `RespiracaoGame(props: MiniGameBaseProps)`, `CrisisNote({ isPt })`.
**Depende de:** `src/utils/refugio/respiracao.ts`, `src/utils/visorScenes.ts` (`MINI_FX`, `REFUGIO_SCENE`).
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy).
**Régua:** `src/components/mente/revisaoRespiracao.render.test.tsx`; a fiação em `src/components/play/playArea.render.test.tsx`.

### `src/components/refugio/SupportNote.tsx`
**Dono de:** o rodapé de ajuda do Refúgio (folha e respiração): "não substitui ajuda profissional", os números, o atalho `tel:188` (PT) e o diretório internacional. Textos de `utils/supportLine.ts`.
**Exports:** `SupportNote({ isPt, ...data })`.
**Chamado por:** `src/components/play/PlaySheets.tsx`, `src/components/refugio/RespiracaoGame.tsx`.
**Régua:** `src/components/refugio/refugeInvite.render.test.tsx`.

### `src/components/ritual/RitualKit.tsx`
**Dono de:** as três peças partilhadas pelos oito rituais (canvas Rituais, DECISÕES §21, D-R1…D-R3): o **diálogo centrado** `.dlg` SIS-06 sobre o scrim literal do `ModalSheet` (`RITUAL_SCRIM` = `rgba(4,18,20,.55)`), o **vidro sem anel** onde o pixel entra (sprite 64/128, cena 96, aventura 48, emblema 64 — sempre múltiplo de 0,5× do nativo) e a **linha rótulo/valor** do relatório (12 `muted` · 14/500 tabular; destaque em tinta `primary-ink`, perda em peso 400 sem sinal).
**Props principais:** `RitualDialogProps` (exportado) — `label?`/`labelledBy?`, `onClose`, `zIndex?` (200 intersticial · 300 cerimônia), `maxWidth?` (380/340/320), `closeLabel?` (× 44; ausente = sem ×), `closeSide?: 'start' | 'end'` (I3: `'start'` padrão = `BackArrow icon="close"` no fluxo, canto superior ESQUERDO acima do título, com `order: -1` para `closeLast` manter o foco por último; `'end'` = X absoluto no canto superior DIREITO, só quando fechar encerra uma atividade — o `NightmareBattle`), `closeLast?` (× por último no foco, E9), `focusContainer?` (foco inicial no container em efeito de layout — o check-in), `veilRole?: 'status'`. `RitualGlassProps` — `width`, `height?`, `align?: 'center'|'end'`. `SpriteGlass` — `spriteUrl`, `size?` (96), `sprite?` (64). `RitualRow` — `label`, `value`, `tone?: 'hi'|'soft'`.
**Exports:** `RITUAL_SCRIM` · `RitualDialog` · `RitualGlass` · `SpriteGlass` · `RitualRow` · `RitualRowTone` · `ritualLabel` (Rubik 12/500 caixa alta `muted`) · `ritualTitle` (Fredoka 20/600 `ink`).
**Estado/efeitos relevantes:** `useDialogA11y` (trap, Escape = `onClose`, devolução do foco); `useLayoutEffect` para o foco no container quando `focusContainer`.
**Chamado por:** `src/components/MorningCheckIn.tsx`, `FirstTaskCompletedPopup.tsx`, `DailyReportModal.tsx`, `MorningDream.tsx`, `MilestoneCeremony.tsx` (`grep -rl "ritual/RitualKit" src`, 20/09/2026).
**Régua:** exercitado pelos testes de render dos chamadores (`MilestoneCeremony.render.test.tsx`, `MorningCheckIn.*.render.test.tsx`, `DailyReportModal.aventura.render.test.tsx`).
**Avisos do arquivo:** tudo por `style` inline (footgun 1); o vidro reusa `.sm2-viewport-screen`/`.sm2-viewport-glass` do `index.css` — nenhum CSS novo; o × vive em `position:absolute` e a ORDEM no DOM (`closeLast`) é o que decide a ordem de foco.

### `src/components/ui/Icon.tsx`
**Dono de:** o único ponto de ícone do app — dois motores (glifo SVG próprio ou ligature Material Symbols), mesma API.
**Props principais:** `IconProps` (exportado) — `name` (nome Material, mesmo com glifo próprio), `size`, `fill` (eixo de estado), `weight` (espessura de traço no SVG), `tone`, `label`.
**Exports:** `IconTone` (type — tokens de TINTA, nunca fill) · `IconProps` (interface) · `Icon` (`const`, `memo`) · `default`.
**Estado/efeitos relevantes:** nenhum — componente puro; `memo` porque é o mais instanciado do app (nav, cada card de tarefa, cada ação do pet), todas as props primitivas.
**Chamado por:** dezenas de arquivos (`grep -rl "from '.*/Icon'" src` — `App.tsx`, `AISettingsModal`, `ArenaGame`, `CompanionHUD`, `CreateModal`, `EvolutionPath`, `TournamentPage`, `home/Mochila`, `mercado/*`, `nav/HomeMenuSheet` etc.; ⚰️ `ActivitiesPage`, `BottomNav` e `ShopModal` saíram na minimal-ui) e `src/styles/iconScale.contract.test.ts` (09/09/2026).
**Régua:** exercitado por `src/components/ui/foundation.render.test.tsx`; a regra "ícone nunca dentro de box" é travada por teste próprio.
**Avisos do arquivo:** ícone NUNCA dentro de box — nenhuma moldura/fundo/borda/chanfro/padding, em nenhuma prop; se existir glifo próprio com o mesmo nome em `NavGlyphs.tsx`, o `Icon` o desenha, senão cai na ligature Material — a troca é invisível para quem chama.

### `src/components/ui/LockBadge.tsx`

Cadeado dos prédios trancados por Vínculo (Tarefa A, 07/10/2026): `LockGlyph` (SVG procedural, sem emoji), `LockBadge` (chip "Vínculo N"/"Bond N", decorativo para leitor de tela), `LockNotice` (`role="status"`) e `lockLabel` (texto acessível do botão). Quem decide trancar é `buildingGateFor`/`areaLockedAt` em `src/utils/gates.ts`; usado por `MapPage`, `AreaScene` e `AreaView`.

### `src/components/ui/PixelIcon.tsx`
**Dono de:** o ícone de UI em pixel art do squad de arte (`src/assets/soulmon/icones-ui/`, alfa real, 128px no lado maior) — `<img>` decorativo (`alt=""`, `aria-hidden`), caixa quadrada `size` com `object-fit: contain`, sem fundo nem moldura.
**Props principais:** `name?: UiIconArt` (`mapa`/`home`/`itens`/`dormir`/`banho`/`acoes`/`enviar`/`hp`/`energia`) **ou** `src?: string` (04/10/2026: arte de outro mapa — `QUEST_ART`, os ícones de interação de `icones-ui/interacao.ts`, a carga do especial), `size`, `style?`. Com `src`, a escala de ícone (20/24/32) continua vigiada pelo `iconScale.contract.test.ts`.
**Exports:** `PixelIcon`.
**Chamado por:** `src/App.tsx` (menu da Home → `acoes`), `src/components/nav/CornerLink.tsx` (`mapa`/`home`), `src/components/CompanionHUD.tsx` (cuidados `itens`/`dormir`/`banho`, stats `hp`/`energia`), `src/components/ChatBox.tsx` (`enviar`) — 24/09/2026. A moldura `chip-moeda` do mesmo pacote é usada direto pelo `MapPage` (9-slice).
**Régua:** `size` entra na varredura de `src/styles/iconScale.contract.test.ts` (mesma escala de §6.1); o `CornerLink` é exercitado em `src/components/nav/nav.render.test.tsx`.

### `src/components/ui/NavGlyphs.tsx`
**Dono de:** os glifos SVG próprios do Soulmon (nav + deck do aparelho + lista diária + moedas + utilitários) — mesma métrica da Material Symbols Rounded (caixa 24dp, traço 2.1×wght/500).
**Props principais:** `GlyphSvgProps` (exportado), `NavGlyphProps` (exportado) — `name`/`GlyphName`, `size`, `weight`, `fill`, `tone`.
**Exports:** `NavGlyphName` (type — `'home' | 'map' | 'menu' | 'arrow_back' | 'activities' | 'evolution' | 'shop'`: Home ↔ Mapa, o menu da Home, o voltar das áreas e os ícones das áreas; `map` e `arrow_back` entraram na minimal-ui F1 — `map` é a folha dobrada em três com o NÓ, dobras vazadas no cheio por `strokeHole`) · `GlyphName` (type) · `hasGlyph(name)` — existe glifo próprio? · `GLYPH_NAMES` (const, para inspeção/teste) · `GlyphSvgProps` (interface) · `GlyphSvg(props)` — o desenho puro, sem casca · `NavGlyphTone` (type) · `NavGlyphProps` (interface) · `NavGlyph` (`const`, `memo`) · `default`.
**Estado/efeitos relevantes:** `useState`/`useEffect`/`useId` para detectar `prefers-reduced-motion` (`reduced`).
**Chamado por:** `src/components/nav/AreaTopBar.tsx`, `src/components/ui/Icon.tsx` (`grep -rl "from '.*/NavGlyphs'" src`, 24/09/2026; ⚰️ `BottomNav.tsx` apagado na minimal-ui F1; `App.tsx` (menu da Home) e `CornerLink.tsx` passaram para `PixelIcon` na correção pós-F3).
**Régua:** exercitado por `src/components/ui/foundation.render.test.tsx`.
**Avisos do arquivo:** critério de corte é "um Material honesto é melhor que um glifo próprio feio" — nem todo ícone do app tem glifo próprio, de propósito; copiam a métrica do Material para não parecer adesivo colado.

### `src/components/ui/OfflineSeal.tsx`
**Dono de:** o selo discreto de "sem sinal" — cobre todas as telas sem redesenhar nenhuma, montado uma vez no topo do App.
**Props principais:** `OfflineSealProps` (exportado) — `language?`, `topOffset?` (o App empurra o selo abaixo de barra de status/notch sem que este componente saiba o que existe lá em cima).
**Exports:** `OfflineSealProps` (interface) · `useIsOnline()` (hook) · `OfflineSeal(props)` · `default`.
**Estado/efeitos relevantes:** `useState` (`online`); `useEffect` escuta `online`/`offline` do `navigator`.
**Chamado por:** `src/App.tsx` (desde `592e2c14` também nas TRÊS telas anteriores à Home — onboarding, tutorial e upgrade: `const selo = <OfflineSeal language={language} topOffset={8} />` montado antes do `Suspense`; ⚰️ o onboarding não tinha selo, E1 da QA Rodada 2), `src/components/EvolutionPath.tsx` (`grep -rl "from '.*/OfflineSeal'" src`, 09/09/2026).
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

### `src/components/ui/BackArrow.tsx`
**Dono de:** o VOLTAR padrão do app (checklist do dono 01/10/2026, B6/I3) — seta `arrow_back` 24 pelada num alvo 44 (classe `sm2-ora-back`), no canto superior esquerdo, ACIMA do título.
**Props principais:** `onClick`, `language` (`'pt-BR' | 'en-US'` → nome acessível Voltar/Back, ou Fechar/Close com `icon="close"`), `label?` (nome acessível próprio), `style?`, `icon?: 'arrow_back' | 'close'` (I3, 02/10/2026: o FECHAR de modal/folha simples mora no mesmo lugar do voltar — canto superior esquerdo, acima do título; o X à direita é só de quem encerra atividade, ver `03-FLUXO-DE-TELAS.md` §1.5).
**Exports:** `BackArrow`.
**Chamado por:** `src/components/SoulmonOnboarding.tsx` (um ponto de montagem para o onboarding inteiro, `temVolta`). Outras telas adotam ao migrar seus "Back" de texto.
**Régua:** exercitado por `src/components/SoulmonOnboarding.funil.render.test.tsx` (`[data-back-arrow]` antes do título).

### `src/components/ui/UserAvatar.tsx`
**Dono de:** o ÍCONE DO USUÁRIO — a foto (NPC, recorte circular) com a moldura equipada (`AvatarFrame`); padrão determinístico por `seed`. Serve ao botão da Home, à linha de Perfil e ao editor.
**Exports:** `UserAvatar(props)`.
**Chamado por:** `perfil/ProfileAvatarButton.tsx` (lazy), `SettingsPage.tsx`, `perfil/ProfileEditor.tsx`.
**Régua:** `src/components/nav/nav.render.test.tsx`.

### `src/components/ui/AvatarImg.tsx`
**Dono de:** a imagem do avatar CARREGADA SOB DEMANDA (`import.meta.glob` preguiçoso das miniaturas webp de `assets/avatares/`; cada uma vira mini-chunk). Id fora do catálogo cai no padrão.
**Exports:** `AvatarImg(props)`, `AVATAR_THUMB_IDS`.
**Chamado por:** `UserAvatar.tsx` (lazy), `perfil/ProfileEditor.tsx`.

### `src/components/ui/AvatarFrame.tsx`
**Dono de:** o DESENHO das molduras de avatar (R8, 04/10/2026) e o seletor. `AvatarFrame` envolve o avatar (normalmente um `MiniGlass`) com a ARTE da moldura (`FRAME_ART`, `utils/frames.ts`: canvas 192² com abertura de 96 centrada) desenhada por cima, a abertura em 94% do lado do avatar e o transbordo reservado na `margin`; id sem arte cai no anel CSS do `look`; `null` = sem moldura. Mestre/Grão-Mestre escrevem o `#N` (`plaque`) como texto vivo na plaquinha. `FrameSelector` lista "Sem moldura" + o catálogo: as disponíveis são botões (`aria-pressed`), as trancadas mostram como se consegue (tracejado, `aria-disabled`, fora do Tab — nunca opacidade).
**Exports:** `AvatarFrame({ frame, children, style?, size = 32, plaque? })` · `FrameSelector({ ctx, equipped, onEquip, previewSrc, isPt })`.
**Chamado por:** `src/components/TournamentPage.tsx` (linha do próprio jogador no ranking; diálogo "Moldura" aberto pela folha das faixas).
**Régua:** `src/components/TournamentPage.r8.render.test.tsx`.
**Avisos do arquivo:** moldura de avatar é peça própria, não "ícone dentro de box" (a regra vale para glifos de UI). A arte chegou em 04/10/2026 (14 molduras, `src/assets/soulmon/molduras/`); o cadeado das trancadas é a arte de status do dono. Régua da arte: `src/assets/arteDono20261004.contract.test.ts`.

### `src/components/ui/MiniGlass.tsx`
**Dono de:** o vidro SEM anel — o slot SIS-07 na versão "palco" do canvas Pet (D-P7/D-P8/D-P9): retângulo `--sm2-viewport-bg` (escuro nos dois temas) + reflexo `.sm2-viewport-glass`, sem anel de cobre e sem respiração, para a arte pixel que vive dentro de uma CÉLULA vetor.
**Props principais:** `MiniGlassProps` (exportado) — `size` (lado em CSS px: 48 · 64 · 80), `children`, `style?`. Sempre `aria-hidden` (o nome fica FORA, no texto da célula); marca `data-mini-glass`.
**Exports:** `MiniGlassProps` (interface) · `MiniGlass(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — componente puro.
**Chamado por:** `src/components/DreamDex.tsx` (célula 64², cena a 48), `src/components/AdventureDiary.tsx` (48², arte a 48), `src/components/PetPage.tsx` (forma anterior 80², sprite a 64) (`grep -rl "from '.*/MiniGlass'" src`, 20/09/2026).
**Régua:** exercitado por `DreamDex.render.test.tsx`, `AdventureDiary.render.test.tsx` e `PetPage.render.test.tsx` (todos conferem `[data-mini-glass]` com `.sm2-viewport-screen` e SEM `.sm2-viewport` em volta).
**Avisos do arquivo:** reusa as classes do `Viewport` (`index.css`), nenhum CSS novo; raio `--sm2-radius-sm` porque é célula, não visor; escala inteira — quem chama passa a arte em múltiplo de 0,5× do nativo.

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
**Dono de:** o orquestrador do app inteiro — **7076 linhas** (`wc -l src/App.tsx`, 30/09/2026; 7008 em `cfe27cc7`; 6936 em `ae366480`; 6659 em 24/09/2026; eram 6384 em 22/09/2026 e 6245 em 09/09/2026): navegação de páginas, os handlers de todo gesto de jogo, os efeitos que gravam save/tocam som/disparam notificação, e a fila de intersticiais (`const interstitial`).
**Props principais:** não aplicável — é o componente raiz montado por `src/main.tsx`, consome `GameStateContext`/`ThemeContext` via hooks.
**Delta `bcfe7ca6..e3d55bb8`:** só um comentário do JSX do `AreaView` mudou ("Corrida com obstáculos"); sem símbolo novo (`wc -l` 7076, 89 handlers, 40 `useState`). O tom da Home nas telas, os sprites do widget e os NPCs extras entraram por assets e utils (`assets/soulmon/*`, `utils/backgrounds.ts`), não por código do `App.tsx`.
**Exports:** `App` (default export — componente raiz).
**Estado/efeitos relevantes:** 40 chamadas a `useState` (`grep -c "useState("`, 30/09/2026 — `refugeLaunch` entrou no delta `ae366480..5edfcfba` (39 em `ae366480`); eram 37 em 24/09/2026 — a minimal-ui trouxe `homeMenuOpen` e `labTab`; eram 36 em 21/09/2026 — ⚰️ `settingsOpen` saiu com o `SettingsModal` em `4a8b8049`; entrou `termsNoticeSeen`, a marca do banner de termos lida de `STORAGE_KEYS.TERMS_NOTICE_SEEN`; eram 37 em 09/09/2026), incluindo as de página/modal: `showIntro`, `currentView: ViewType` (desde a minimal-ui F1, `'home' | 'map' | area:<AreaId> | page:<MenuPageId>` de `src/navigation.ts`; `paneFor(view, labTab)` deriva o painel), `labTab: LabTab`, `homeMenuOpen`, `editModalOpen`, `balanceOpen`, `taskEditModalOpen`, `createModalOpen`, `evolveModalStage`, `guideModalOpen`, `creditsOpen`, `newReadingOpen`, `rebirthOpen`, `resetOnboardingOpen`, `showEvolutionChoice`, ⚰️ `settingsOpen`, ⚰️ `showItemsWindow` (a pastinha saiu na F6 da minimal-ui), `showDailyReport`, `nightmareOpen`, `showFirstTaskPopup`, `hasShownFirstTaskPopup`, `showHelpModal` (`grep -noE` filtrado por page/modal/view/open/show, 09/09/2026). 20 componentes de tela/modal entram por `lazy(() => import(...))` (`grep -c "lazy("`, 30/09/2026 → 20, igual a `ae366480`; eram 19 em 24/09/2026 — entrou `nav/AreaView`, saíram `TournamentPage`/`ActivitiesPage`/`ShopModal`/`ItemsWindow` do `App`; eram 22 em 09/09/2026) — ver a lista completa em cada entrada de componente correspondente ("Chamado por"). A fila de intersticiais (`const interstitial`, linha declarada por `SÍMBOLO` — busque por `grep -n "const interstitial" src/App.tsx`) decide qual overlay monta por vez, na ordem: primeiro dia → HP → semanal → triagem → priming → recomeço.
  - **Handlers `handle*`** (`grep -c "const handle[A-Za-z0-9_]* *=" src/App.tsx`, 30/09/2026 — **89** ao todo (88 em `cfe27cc7` — entrou `handleCrossings`; 84 em `ae366480`, +4 do convite ao Refúgio: `handleRefugeShown`, `handleRefugeDismiss`, `handleRefugeAccept`, `handleRefugeLaunchConsumed`); antes, 24/09/2026 — **81**; eram 79 em 09/09/2026, `handleDungeonFloorCleared` entrou em `cf6315e1`, e na minimal-ui `handleBackpackSeen` entrou e ⚰️ `handleOpenItems` saiu): `handleAICreateActivity`, `handleAccountUnlocked`, `handleAddNewActivity` (abre o `CreateModal` desde 20/09/2026; `handleAddNewTask` saiu — não tinha chamador), `handleAplicarEquilibrio`, `handleBackpackSeen` (zera `newItemsReady` quando a `Mochila` abre), `handleBuyCreditPack`, `handleCareEventComplete`, `handleChangeRestWindow`, `handleCheckInConfirm`, `handleCheckInSkip`, `handleClassTitlesComputed`, `handleCloseDailyReport`, `handleCloseNudge`, `handleCompanheiroComputed`, `handleCompleteOnboarding`, `handleCompleteTutorial`, `handleConfirmResetOnboarding`, `handleDecomposeTask`, `handleDegenerate`, `handleDeleteActivity`, `handleDeleteTask`, `handleDinoScore`, `handleDismissFreshStart`, `handleDismissHpBanner`, `handleDismissWeeklyReport`, `handleDropTask`, `handleDungeonEnemyDefeated`, `handleDungeonEnter`, `handleDungeonHeartDrop`, `handleDungeonLose`, `handleEarnGamePoints`, `handleEditActivity`, `handleEditTask`, `handleEquipBackground`, `handleEquipFurniture`, `handleEvolve`, `handleEvolveRequest`, `handleEvolveToUnlocked`, `handleExchangeCredits`, `handleExpandRitual`, `handleFeed`, `handleFreshStart`, `handleGlitchtama`, `handleGuildClaimed`, `handleGuildScenes`, `handleNewReading`, `handleNightmareWin`, `handleOpenTriage`, `handlePet`, `handlePickMood`, `handlePlay`, `handlePostponeNudge`, `handleProtectProgress`, `handleQuickAdd`, `handleRebirth`, `handleRecoverHearts`, `handleResetOnboarding`, `handleRestoreTask`, `handleRetrySprite`, `handleRevertVisor`, `handleSaveActivity`, `handleSaveTask`, `handleSeenTune`, `handleShopBuy`, `handleShower`, `handleShrinkTask`, `handleSkillsComputed`, `handleSleep`, `handleStepsDecline`, `handleStepsRequestPermission`, `handleTermsNoticeOk`, `handleToggleActivityCompletion`, `handleToggleAvisos`, `handleToggleEvolutionLock`, `handleToggleNotifications`, `handleToggleRestMetrics`, `handleToggleSound`, `handleToggleTask`, `handleTriageResolve`, `handleTuneVisor`, `handleUpdateStep`, `handleUpgradeRevealed`, `handleWatchAd`.
  - **Navegação minimal-ui (F1–F6, 23–24/09/2026):** Home e Mapa são as telas de topo — `<MapPage>` (saldo das 3 moedas, `onOpenArea`), dois `<CornerLink>` (Mapa na Home, Home com `glow` no Mapa), ⚰️ `<HomeMenuSheet>` (o menu sanduíche saiu em 07/10/2026; o `trailing` do `HomeHud` agora é o `ProfileAvatarButton`, que abre Configurações), e cada área/página do menu com `<AreaTopBar>`; a área é o `<AreaView>` (lazy, `key` da view) que recebe prontos `ownership`/`actions` da loja (`handleShopBuy`/`handleEquip*`), o `tournament`, os `play` (masmorra/dino/sumidouro de Bits), `labContent` (abas Evolução/Soulmon/Stats sobre `labTab`, com `PetPage headingLevel={2}` e `EvolutionPath incubating`) e `hallContent` (`LibraryPage embedded`). ⚰️ `BottomNav`, `ActivitiesPage`, `ShopModal` e a pastinha `ItemsWindow` saíram. ⚰️ `handleOpenAISettings` (apagado em `4a8b8049`) e `handleOpenItems` (F6) não existem mais.
**Chamado por:** `src/main.tsx` (`grep -rl 'from "\./App' src`, 09/09/2026 — corrigido o comando em 10/09/2026 por doc-verificador: o padrão anterior, `grep -rl "from '.*/App'" src`, não batia com o import real de `main.tsx`, `import App from "./App.tsx"`, por causa das aspas duplas e da extensão `.tsx` explícita).
**Guilda no `App.tsx` (29/09/2026):** `useGroveWatch` (memória do aparelho + cenários ao save via `grantGroveScenes`), o intersticial `'groveMilestone'` (→ `GroveMilestoneCeremony`, posição travada por `filaDeAvisos.contract.test.ts`), o aviso `marcoBosque` na Home, `fioGoal`/`fioMetaCumprida` pela meta de CORAÇÃO (`heartGoalFor`, G1 — aguarda o dono), `minhaCriaturaUrl`, `earnEmblems` (UM caminho de Emblemas, do Torneio e do resgate da Feira), `handleGuildClaimed` (Emblemas + Concha via `grantGuildTrophy`) e `handleGuildScenes`. O `HelpModal` passou a `lazy`.
**Delta `ae366480..5edfcfba` (30/09/2026):** · 🫧 **convite ao Refúgio** — `refugeLaunch` (`useState`) + `handleRefugeShown`/`handleRefugeDismiss`/`handleRefugeAccept`/`handleRefugeLaunchConsumed` gravam `gameState.refugeInvite` com `markRefugeShown`/`dismissRefugeInvite`/`acceptRefugeInvite` de `utils/refugio/convite.ts` (dono da regra: humor baixo, 1×/dia, intervalo, silêncio após recusas; o `App` só grava e navega, sempre com `playerDayIso(new Date(), prev.playerDayTz)`). Na fila de avisos entra `key: 'refugio'` (`<RefugeInviteCard>`, quando `shouldInviteRefuge(gameState.refugeInvite, moodFor(...), playerDayIso(...))`) **logo depois de `firstDay` e ANTES de `hp`** — parecer do psicólogo: num dia difícil o primeiro cartão não pode ser coração perdido; aceitar chama `handleRefugeAccept()` + `goTo(areaView('jogos'))`, e o `AreaView` recebe `initialGame={area === 'jogos' && refugeLaunch ? 'respiracao' : undefined}` + `onInitialGameConsumed`. · 🏛️ **`play` para os prédios de Jogos** — `todayKey: playerDayIso(...)`, `review: gameState.review`, `minigameBitsToday: minigameBitsToday(gameState, playerDayKey(...))` (`utils/currencies`) e `onReviewChange` (grava `review` no save). · 🔄 **entitlement** — o `useEffect` de `[saveId, setGameState]` deixou de ser um `fetchEntitlement().then` único: usa `createEntitlementSync` (`utils/entitlementSync.ts`, sem timer recorrente) e refaz a consulta no mount, quando `subscribeAuthState` (`utils/auth`) dispara, ao voltar ao primeiro plano (`visibilitychange`, no máx. 1 por 30 s) e uma vez 2,5 s depois se a 1ª veio `null`; o `apply` segue sendo `setAdminFlag(adminFromEntitlement(ent))` + `credits`/`accountTier`. · 🐦‍⬛ **adoção do corvo** — `corvoAdoptedRef` (uma vez por sessão) virou `corvoAdoptingRef` (só evita import duplo em voo, zerado no `finally`) + `stateIsCorvo = isCorvo(gameState)`; o efeito roda `[isAdmin, stateIsCorvo, setGameState]`, então um save remoto SEM corvo que chegue depois da adoção é adotado de novo (a marca do admin vence). · ⚠️ a frase "o 8º e último item é `key: 'termos'`" mais abaixo está defasada: `grep -n "key: '" src/App.tsx` no bloco de avisos lista hoje `firstDay`, `refugio`, `hp`, `incubacao`, `semanal`, `triagem`, `priming`, `recomeco`, `carga`, `marcoBosque`, `termos` (11); `termos` segue ÚLTIMO.
**Delta `cfe27cc7..3532ccf5` (30/09/2026, Passeio + Travessias):** `aventuraDaNoite` passa a ser `passeioFindOfDay` (com `trv`, o módulo `utils/travessias` carregado por `import()` só quando `crossingsTouchMap(gameState.crossings)`) ou `adventureOfNight` (sem mapa tocado); o efeito que guarda o achado ao ABRIR o relatório assenta a noite no mesmo updater puro (`settleNight` + `collectAdventure` sobre `prev`, nada mudou → `prev`); `aventuraInedita` = "não estava no diário ANTES desta noite"; `handleCrossings(f)` é o único caminho de escrita de `crossings` (prop `passeio` do `AreaView`); `passeandoEm` (nome da região de destino ≠ casa) vai ao `CompanionHUD` como `walkingTo`.
**Fila de avisos (desde `42b07bec`, decisão #24):** o 11º e último item é `key: 'termos'` (10º é `marcoBosque`, 9º `carga`; a fila tinha 8 em 21/09/2026 e tem 11 em 30/09/2026, `grep -n "key: '" src/App.tsx` — ver `03-FLUXO-DE-TELAS.md` §3.2) — `<TermsUpdateBanner changed={qualDocMudou(gameState.consent!, TERMS_VERSION, PRIVACY_VERSION)}>` (a prop `changed` desde `a6c1cd8a`) quando `precisaAvisarTermos(gameState.consent, TERMS_VERSION, PRIVACY_VERSION, termsNoticeSeen)`; `handleTermsNoticeOk` grava `marcaAvisoTermos(...)` em `STORAGE_KEYS.TERMS_NOTICE_SEEN` (fora do updater, footgun 6). **Desde `592e2c14` (QA Rodada 2 A3) a PRIMEIRA aparição do banner entra em posição 1** (`termsNoticePrimeiraVez` = `TERMS_NOTICE_SHOWN` ≠ `marcaAvisoTermos(...)` → `avisos.unshift(termos)`, senão `push`); um `useEffect` grava `STORAGE_KEYS.TERMS_NOTICE_SHOWN` na primeira exibição, e dali em diante o banner volta ao fim da fila — "termos é o único aviso que não fala do dia da pessoa" continua valendo, mas um aviso de termos que nunca chega ao topo nunca é lido. `filaDeAvisos.contract.test.ts` trava o `unshift`/`push` literal. O `NotificationManager` passa a receber `saveId` (decisão #23). **QA Rodada 2 (`592e2c14`):** os dois caminhos de login (o `useEffect` de sessão e o botão da conta) chamam `checarContaExcluidaNoLogin(email)` (`cloudSave.ts`) ANTES de `cloudLoad`/`adoptCloudSave` — lápide → recarrega / lança `account-deleted` (portão com lápide antes do onboarding); a trilha obedece ao ESTADO, não ao gesto — `useEffect([isSleeping])` → `pausarTrilha('sono')`/`retomarTrilha('sono')`, checagem a cada 60 s de `isWithinWindow(rest.window ?? createRestState().window, now, 0)` → `'descanso'`, `handleToggleSound` → `'mudo'` (⚰️ a pausa vivia em `handleSleep` e o sono automático não a tocava, S-1); `OfflineSeal` também nas três telas pré-Home; **`PostponeNudgeSheet`** usa `useId()` para `aria-labelledby` (título) + `aria-describedby` (explicação) em cada uma das 3 opções (⚰️ o nome acessível era título + explicação, 30 palavras — A9) e o hint do Decompor não mistura ficção com "provedor de IA" (A10). `useState` continua em 36 (`grep -c "useState("`, 22/09/2026; `termsNoticeShown` entrou, mas é `useState` com inicializador — conta igual). **QA Rodada 1 (`a6c1cd8a`):** o boot chama `limparOrigemDaUrl()` logo depois de `track('app_open', { source: openSourceFromUrl(...) })` (um favorito com `?src=convite` reemitiria `invite` toda semana); o bridge do widget manda `petName: widgetPetName(gameState.soulmonMeta)` (⚰️ `evolutionStage` capitalizado — "Rookie" nos widgets enquanto a Home dizia "Pyraka"; `gameState.soulmonMeta` entrou nas deps do efeito; régua `src/plugins/widgetNome.contract.test.ts`).
**Execução das 32 respostas do dono (`cf6315e1`, 22/09/2026):** ↩️ **`ofereceDesfazer(antes, nomeDoHabito)`** (`useCallback`, decisão **#57**) monta o `UndoToast` por `toast.custom` com `duration = UNDO_WINDOW_MS`; o **snapshot** é tirado FORA do updater, do `gameState` que o handler já tem em mãos (mesmo lugar e motivo de `habitMilestoneOf` — o updater roda 2× no StrictMode, e duas fotos iguais sairiam como dois toasts), e a **reversão** roda DENTRO de um updater, sobre o `prev`, que é a única leitura que enxerga o que mudou entre o clique e o commit. Chamado pelos dois caminhos de conclusão: o `handleToggleActivityCompletion` e a ÚLTIMA etapa de um hábito com etapas. · 🔗 **os 6 `BondEvent` mudos ganharam emissor** (decisão **#59b**): `habitMilestone` em `withHabitCompletion` (via `milestoneReached`), **`handleDungeonFloorCleared`** (novo, `dungeonFloor`, passado como `onFloorCleared`), `triageCleared` na transição "fila tinha itens → vazia", `restNight` só dentro da Janela de Descanso e com guard `rest.nights.some(...)`, `dreamNew` só para sonho inédito, `nightmareCleared` no mesmo updater de `markFought`. · ⚠️ **#59**: `handleEvolve` reconfere `podeEvoluirDepoisDaQueda(prev)` sobre o `prev` (é o updater que commita), o `canEvolve` que acende o botão chama a mesma função, e o efeito da cerimônia sai cedo com `if (degeneratedByHP) return;` — senão o ritual abriria e o commit recusaria. · 💠 **#61/#63**: `handleEarnGamePoints` é o funil ÚNICO de Dino, PPT e Masmorra, então uma linha lá cobre os três — `creditMinigameBits(base, total, playerDayKey(...))`, pura e dentro do updater. · 🥚 **#62**: `handleRebirth` chama `void resetSpriteLifetimeAfterRebirth()` — `void` de propósito, porque falhar não pode bloquear o renascimento. · **#41/#60**: o objeto de `MissionState` passa `missionPerfectDays: gameState.missionPerfectDays ?? gameState.totalPerfectDays ?? 0`.
**Régua:** `src/hooks/useDailyReset.test.ts` (importa `computeDailyReset` de `utils/dailyReset.ts`, não duplica a regra); `src/components/filaDeAvisos.contract.test.ts` (as duas filas de avisos; desde `a6c1cd8a` também trava `termos` como ÚLTIMO da fila e o `changed={qualDocMudou(` no banner); `src/plugins/widgetNome.contract.test.ts` (`petName` do bridge vem de `widgetPetName`; o "nome = estágio" não volta); `src/components/evolucaoManual.contract.test.ts`; `src/components/telemetryWiring.render.test.tsx`; `src/components/ofertaDoisCanais.contract.test.ts`; `src/components/p5DiaCompleto.contract.test.ts`; `src/components/upgradeReveal.contract.test.ts`; `src/components/textoBilingue.contract.test.ts`.
**Avisos do arquivo:** ⚠️ a contagem de linhas do arquivo mentiu cinco vezes em `CLAUDE.md` ("~1500", "~4700", "4489", "5772", "5991") antes de virar `wc -l` obrigatório no lugar de número fixo (09/09/2026 mediu 6245; 22/09/2026 mede 6384) — quem lê "1500" acha que o arquivo cabe num contexto e o lê inteiro à toa; side effects nunca dentro de updater do `setGameState` (StrictMode invoca 2×, footgun 6); desde `a2ded861` (21/09/2026, copy §1) `falar(kind)` (`useCallback`, chama `petVoiceLine` de `utils/petVoice.ts`) é o ponto único de fala fora do HUD: `handleSleep` fala `sleep`/`wake` FORA do updater (o sono automático segue mudo), um `useEffect` sobre `careEvent` fala `residue` na CHEGADA da borra (o dreno segue mudo) e a recusa `already-full` do coraçãozinho fala `steady` em vez de acender `healCapSignal` (que fica só para `rubDecision === 'daily-cap'`); `MILESTONE_TEXT.tree` diz "Isso virou raiz" desde `1480b632` (L1: a pessoa nunca é sujeito de verbo de ser, nem no elogio); desde `a2ded861` a página de Evolução mostra a frase de `rebirthRefusal(gameState) === 'not-ultra'` (só fora do demo, sem convite nem botão) e o registro `rebirth` termina com "É ele. Ainda é ele." (família obrigatória da §11); "DUAS FILAS, e nada monta fora delas" (`filaDeAvisos.contract.test.ts`) — superfície nova de overlay entra numa das duas, com posição declarada. Desde `ee79fd44` (21/09/2026, S16) o `App.tsx` importa `pausarTrilha`/`retomarTrilha` de `src/utils/trilha.ts` e é o dono dos dois ganchos de E0: `handleSleep` (dentro do `useCallback` que chama `falar(isSleeping ? 'wake' : 'sleep')`: `if (isSleeping) retomarTrilha(); else pausarTrilha();`) e `handleToggleSound` (`useCallback` sobre `soundMuted`, único desde `980bc84c`; passado como `onToggleSound` à `SettingsPage` — o caminho vivo do jogador, grupo "Som"; ⚰️ o `SettingsModal`, que também o recebia, foi apagado em `4a8b8049` junto com `handleOpenAISettings`/`settingsOpen`/o `lazy()` dele: `if (mudo) pausarTrilha(); else retomarTrilha();`, depois de `setMuted`/`setSoundMuted` e antes de `trackSoundOff()`, que só dispara na transição para mudo). `playEvolve`/`playDegenerate`/`playTaskComplete`, que o `App.tsx` já chamava, passaram a preferir o asset de IA por dentro (`playComAsset` em `sounds.ts`) — nada mudou no chamador.

### `src/main.tsx`
**Dono de:** o ponto de entrada do app — monta `App` dentro de `ErrorBoundary`/`ThemeProvider`/`GameStateProvider`, roda a migração de chaves legadas ANTES de qualquer provider, e remove a splash estática do `index.html`.
**Props principais:** não aplicável — script de bootstrap, sem componente.
**Exports:** nenhum (módulo de efeito, sem export).
**Estado/efeitos relevantes:** chama `migrateLegacyStorageKeys()` (`src/utils/storageKeys.ts`) antes de `createRoot(...).render(...)`, porque `GameStateProvider` lê o save no inicializador do próprio estado; remove o nó `#splash` com um `requestAnimationFrame` duplo (paint) + um `window.setTimeout(remover, 1200)` como rede de segurança independente do rAF.
**Chamado por:** ponto de entrada do Vite (referenciado em `index.html`), não importado por outro módulo do app.
**Régua:** nenhuma direta (`find src -maxdepth 1 -name 'main.test.ts*'` vazio, 09/09/2026); a migração em si é coberta por `src/utils/storageKeys.reconcile.test.ts` e `src/utils/storageKeys.migration.test.ts` (não existe `src/utils/storageKeys.test.ts` — corrigido por doc-verificador em 10/09/2026, `find src -iname 'storageKeys*'`).
**Avisos do arquivo:** ⚠️ até 27/08/2026 a rede de segurança da splash vivia DENTRO do duplo `requestAnimationFrame`, que nunca dispara em aba/WebView em segundo plano — a splash ficava para sempre por cima do app carregado ("não consigo passar da tela de loading"); o `setTimeout` foi movido para fora do rAF, agendado na hora; só os subsets `latin` 400/700 do Silkscreen são importados (não `latin-ext`, que não tem acento de PT-BR e custaria 6,8kB à toa).

### `src/components/GmPanel.tsx`
**Dono de:** o grupo "Painel de GM"/"GM panel" das Configurações — visível só com `useAdmin() === true`.
**Exports:** `GmActions` (interface), `function GmPanel({ language, gm })`. A dica do botão de saldo diz "Bits e Honra em `GM_BALANCE`" / "Bits and Honor" desde 30/09/2026 (⚰️ "Emblemas"; REGISTRO §17).
**Chamado por:** `src/components/SettingsPage.tsx` (prop `gm`, que o `App.tsx` só passa para o admin).
**Régua:** `src/components/GmPanel.render.test.tsx`.


### `src/components/RestSetupModal.tsx`
**Dono de:** o convite do sono (G8, 01/10/2026): explica e configura Janela de Descanso + sono automático, intersticial `restSetup` (antes de `welcome`).
**Exports:** `RestSetupModal`, `RestSetupModalProps`.
**Chamado por:** `src/App.tsx`
**Régua:** `src/components/RestSetupModal.render.test.tsx`.

### `src/components/nav/cornerAnchor.ts`
**Dono de:** a âncora ÚNICA dos botões do canto superior esquerdo/direito (H9, 02/10/2026): caixa de 56, anel de 44, topo e lado, cor e brilho — para o Mapa, a casinha e o voltar-ao-mapa das folhas ficarem sempre no mesmo lugar.
**Exports:** `CORNER_BOX`, `CORNER_RING`, `CORNER_BOX_TOP`, `CORNER_SIDE`, `CORNER_RING_TOP`, `CORNER_RING_SIDE`, `CORNER_INK`, `CORNER_GLOW`, `CORNER_RING_STYLE`.
**Chamado por:** `src/components/nav/CornerLink.tsx` e o `AreaTopBar`.
**Régua:** `src/components/nav/nav.render.test.tsx`.

### `src/components/ui/InfoTip.tsx`
**Dono de:** o "?" PADRÃO do app (pedido do dono, 02/10/2026): todo texto explicativo sai da tela e vira um "?" em círculo (glifo `help`, pelado) que abre um tooltip.
**Props principais:** `children` (texto do tooltip), `label` (nome acessível, por idioma), `language`, `align?`, `style?`.
**Exports:** `InfoTip`.
**Estado/efeitos relevantes:** tooltip num portal em `document.body` (nunca cortado por `overflow`), posicionado junto ao botão e preso às bordas; fecha com novo toque, toque fora ou Esc; `aria-expanded` + `aria-describedby`. Alvo de toque 44.
**Chamado por:** as telas que tinham texto explicativo corrido (Duelo, Feira, Torneio, Masmorra, Seus dados…).
**Régua:** `src/components/ui/InfoTip.render.test.tsx`.

### `src/components/ui/TypewriterText.tsx`
**Dono de:** o texto que surge letra a letra, como máquina de escrever (I1, 02/10/2026): ~30 ms por caractere, sem som, altura final reservada (a parte não dita fica no fluxo com `visibility: hidden` — sem reflow), toque completa na hora, `prefers-reduced-motion` (ou sem `matchMedia`) mostra tudo de uma vez. Leitor de tela lê o texto inteiro de um nó oculto; o desenho animado é `aria-hidden` e não há `aria-live`.
**Props principais:** `text`, `speedMs?` (30), `onDone?` (uma vez por texto), `style?`, `className?`.
**Exports:** `TypewriterText`, `prefersNoTypewriter`.
**Estado/efeitos relevantes:** contador amarrado ao texto (trocar `text` recomeça); um `setInterval` enquanto fala.
**Chamado por:** `src/components/nav/NpcSpeech.tsx`.
**Régua:** `src/components/ui/TypewriterText.render.test.tsx`.

### `src/components/ui/BitsIcon.tsx`
**Dono de:** a moeda dos Bits (I4, 02/10/2026) — o PONTO ÚNICO de troca de arte. Detecta `src/assets/icons/bits.png` por `import.meta.glob`; sem o arquivo, desenha uma moeda pixel 8×8 provisória (aro `primary-ink`, miolo `gold-ink`, barra gravada) com tokens de cor. Decorativa (`aria-hidden`) salvo quando recebe `label`.
**Props principais:** `size?` (20), `label?`, `style?`.
**Exports:** `BitsIcon`.
**Chamado por:** `src/components/mercado/ShopShelf.tsx` (`Bits`), `src/components/nav/MapPage.tsx` (chip de saldo).
**Régua:** `src/components/ui/BitsIcon.render.test.tsx`, `src/components/mercado/MercadoSheets.render.test.tsx`.

### `src/components/nav/playPrefetch.ts`
**Dono de:** o prefetch dos chunks de jogar (rodada 7 · J1, 04/10/2026). Causa do "Opening…" demorado: o APK carrega o app de URL remota e cada `lazy()` só baixava no toque (cascata `PlaySheets` → jogo → `GameKit`/`BattleStage` → arte; chunks de 6–30 KB, o custo é a latência de cada ida). Os `load*` são os MESMOS `import()` que o `lazy()` do `AreaView`/`App` usa (o Vite deduplica), chamados em tempo ocioso, um por tick, com falha silenciosa.
**Props principais:** —
**Exports:** `loadAreaView`, `loadPlaySheets`, `loadDungeonGame`, `loadDinoGame`, `loadRPSGame`, `loadEcoGame`, `loadBolhasGame`, `loadTrocaGame`, `loadPicrossGame`, `loadRevisaoGame`, `loadRespiracaoGame`, `prefetchSequence`, `useAreaViewPrefetch`, `usePlayPrefetch`.
**Estado/efeitos relevantes:** `requestIdleCallback` (cai para `setTimeout`); `useAreaViewPrefetch` (Home) sobe `AreaView` e `PlaySheets`; `usePlayPrefetch` (áreas Exploração/Jogos) sobe a folha e, com uma folha aberta, os nove jogos.
**Chamado por:** `src/App.tsx`, `src/components/nav/AreaView.tsx`.
**Régua:** `src/components/nav/playPrefetch.test.tsx`.

### `src/components/nav/NpcSpeech.tsx`
**Dono de:** o balão de fala do NPC na folha do lote (I1, 02/10/2026): nome + fala digitada (`TypewriterText`). Desde a rodada 7 (J2) a digitação é só da PRIMEIRA vez que aquele NPC (`speakerKey` = `area:lote`) fala neste aparelho — a lista fica em `STORAGE_KEYS.NPC_FALA_VISTA`; depois a fala aparece inteira. Sem `speakerKey` sempre digita. Monta de novo a cada abertura da folha e não bloqueia o resto; enquanto fala aceita toque (completa sem fechar a folha), depois volta a ser transparente ao toque. Mantém `data-area-sheet-npc-line` (o CSS de viewport baixa depende dele).
**Props principais:** `name`, `line`, `speakerKey?`.
**Exports:** `NpcSpeech`, `npcJaFalou`.
**Chamado por:** `src/components/nav/AreaSheet.tsx`.
**Régua:** `src/components/nav/NpcSpeech.render.test.tsx`.

### `src/components/TalentTreeCard.tsx`
**Dono de:** o RESUMO dos talentos na `StatsPage` (Tarefa B, §2.37): pontos gastos/livres e o botão "Abrir a árvore", que MONTA o `TalentTree` (`lazy`). Sem save (demo) não renderiza nada.
**Régua:** `src/components/TalentTree.render.test.tsx` (bloco "Tarefa B").

### `src/components/TalentTree.tsx`
**Dono de:** a árvore de talentos DESENHADA como árvore (PR7 + Tarefa B): hub no centro, três caminhos que se bifurcam e se reencontram, nós como botões HTML sobre um SVG só de linhas, sempre a 100% (sem zoom; rolagem nativa, hub centralizado ao abrir), e tocar num nó abre um MODAL (`role=dialog`, `aria-modal`, foco preso e devolvido ao nó, Esc/toque fora cancelam) com descrição, o pré-requisito que falta EM TEXTO, stepper de pontos a atribuir (0 até o espaço = grau máximo, pontos livres e pré-requisitos) e Confirmar/Cancelar (Confirmar aplica N× `pickTalent`), setas/roving tabindex, `aria-label` por nó, movimento reduzido (CSS). Pontos, graus, pré-requisitos e respec vêm de `utils/talents.ts`; o desenho de `utils/talentLayout.ts`; local-first (o servidor valida na sincronia e poda o que viola pré-requisito). Com `tal-com-05` (Balança) o modal ganha "Tirar um ponto" (recusado se outro nó depende do grau).
**Régua:** `src/components/TalentTree.render.test.tsx`.

### `src/components/ForgeCard.tsx`
O Soulsmith (07/10/2026, lazy): 9 peças em cards (Lv N → Lv N+1 / Max, bônus, custo e saldo em chips, botão Upgrade; recusa em texto), modal de escolha A/B e Refazer escolha (Bits ganhos/fragmentos). Substituiu a `EquipmentCard` (compra por Bits). Regras em `utils/forge.ts`/`forgeActions.ts`.
**Régua:** `src/components/ForgeCard.render.test.tsx`.


## `src/components/nav/BuildingQuestList.tsx` (07/10/2026)

Seção "Dos prédios"/"Buildings" da `MissionsSheet` (import dinâmico): a missão do dia de cada prédio
aberto, o botão de pegar o material e o inventário. Recebe `{state, day, bondLevel, onClaim}`;
não escreve estado por conta própria. `AreaView` ganhou `buildingMarks` e `onVisitBuilding`.
