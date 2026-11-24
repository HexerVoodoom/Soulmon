# Referência — `src/components`

> **Dono:** doc-redator-referencia · **Data:** 16/11/2026 (sincronização `b0c1e59c..6b7773143`, 363 commits, PRs #977–#998: companheiro invocado (`SummonLayer`), Rift infinito (`RiftMap`), convite de Duelo, Feira de verdade (`FeiraLojaSheet`), Passeio sem timer, retrospectiva de segunda (`WeeklyRetroModal`), tarefa bônus, Ultra só com as 3 Megas, poção do Neutro, Prato feito, Bits por categoria; ver a seção "Sync 16/11/2026" no fim e as entradas novas) ; anterior: 09/11/2026 (sincronização `5229b1be..62f204e1b`, 271 commits: árvore de evolução em 3 caminhos + modal "Degenerar para…" (`EvolutionPath`, `FormasAlternativasSheet`), `EstagioIcone`, HP base no duelo (`hpExibidoPvp`/`statExibido`), corte `ranged` que cresce (`BattleStage`), masmorra por elemento + poções + ponto de retorno de 2 camadas (`DungeonGame`, `DungeonPotionsModal`), Fenda, Amigos/Selvagens (`LibraryPage`), Soulsmith/Vitra (`SoulsmithSheet`, `ForgeCard` mapa), ⚰️ `OficinaSheet` e `PrepararFocoSheet` (jornada do Foco: `FocusBoard`/`JourneyScreen`), `App.tsx`; as entradas dos componentes novos já existiam) ; anterior: 02/11/2026 (sincronização `8649fa426..5229b1be`: exports novos/alterados de `CompanionHUD`, `EvoRecapModal`, `BattleStage`, `useGroupBattle`, `Mochila`, `MercadoSheets`, `npcScale` e lápide de `EvolutionLight`; as entradas dos arquivos novos já existiam) ; anterior: 29/10/2026 (sincronização `f3acead1..15624b69b`, parcial: módulos novos e apagados) ; anterior: 11/10/2026 (delta `e71061b8..f3acead1`: componentes novos (`LevelUpOverlay`, `BuildingIntro`, `WelcomeTour`, `EvolutionGaugeMini`, `MealInviteCard`, `ForgeCard`, `CasaVisor`) com entrada); anterior: 07/10/2026 (sincronização `e3d55bb8..e71061b8`, Combate v3 PR1–PR18, prédios, missões, avatar: HomeMenuSheet ⚰️, PR18 em TorcidaKit/BattleStage, exports novos); anterior: 01/10/2026 (delta `bcfe7ca6..e3d55bb8`, PRs #189–#197, arte da rodada 3: `Corrida com obstáculos` (`DinoGame`/`PlaySheets`/`StatsPage`/`AreaView`) e `Honra` (`TournamentPage`, `MercadoSheets`, `ShopShelf`, `MapPage`, `HelpModal`, `RebirthModal`, `GmPanel`) — REGISTRO §17; arte nova em `DinoGame` (variantes), `TournamentPage` (`TierMark`), `RebirthModal` (ovo), `CompanionHUD` (mochila e sol), `FeiraVisor` (tipo × estado), `GroveVisor`/`GroveMilestoneCeremony`/`GuildOwnedShelf` (cenário pintado), `AreaView` (`HALL_BG`/`LABORATORIO_BG`), jogos da mente e do Refúgio (`visorScenes`)); anterior: 30/09/2026 (delta `cfe27cc7..3532ccf5`: `PasseioSheet` (entrada do PR conferida); `AreaView` (lote `passeio`, prop `passeio`), `CompanionHUD` (`walkingTo`), `DailyReportModal` (`adventure` como `Pick`), `AdventureDiary` (`findAnyById`), `GuideModal`/`HelpModal` (Passeio e Travessias), `App.tsx` (7076 linhas, 89 handlers, assentamento da noite)); anterior: 30/09/2026 (delta `ae366480..5edfcfba`: Ateliê da Mente/Refúgio/Salão em `AreaView`+`PlaySheets`, `DuelScreen` no `TournamentPage`, convite ao Refúgio e `createEntitlementSync` no `App`, `supportLine` no `ChatBox`, `cityLabel(city, isPt)`, `#pt` nos links de termos, `DUNGEON_BITS_FACTOR` no `clearBonus`, minijogos mudos); anterior: 30/09/2026 (sincronização `8e6d0d9a..ae366480`: `AreaTopBar` `covered`, `AreaView` `onLayerChange`); anterior: 29/09/2026 (sincronização da Guilda completa, delta `38c3ccb5..b657a340`: `guild/FeiraVisor.tsx`, `guild/GroveVisor.tsx`, `guild/GroveMilestoneCeremony.tsx` e `mercado/GuildOwnedShelf.tsx` NOVOS; `guild/GuildSheet.tsx` reescrito; `CoopPanel.tsx` vira reexport; `App.tsx`, `AreaView.tsx`, `AreaScene.tsx`, `AreaSheet.tsx`, `MercadoSheets.tsx`, `GuideModal.tsx`, `HelpModal.tsx`, `LibraryPage.tsx` reconferidos); anterior: delta `cf8a851d..38c3ccb5`: `guild/GuildSheet.tsx` NOVO; `nav/AreaSheet.tsx` com `lotNpcVoice`/`useBackLayer`) · **Estado:** verificado em 29/10/2026 por doc-verificador (sincronização f3acead1..15624b69b, SÓ as entradas tocadas — novas `evoRecap`/`CompletionTag`/`EvoRecapModal`/`RewardPreview` e lápides `GuerraClaSheet`/`RestWindowCard`/`UndoToast`, conferidas símbolo a símbolo contra o fonte; papéis redator/verificador exercidos na mesma sessão; o restante do delta, ~100 módulos com exports alterados, NÃO foi reconferido); anterior: verificado em 01/10/2026 por doc-redator-referencia (delta `bcfe7ca6..e3d55bb8`, só as entradas tocadas, conferidas símbolo a símbolo contra o fonte em `e3d55bb8`; sem verificador independente nesta rodada — `wc -l src/App.tsx` → 7076, `grep -c "const handle[A-Za-z0-9_]* *="` → 89, `grep -c "useState("` → 40); anterior: verificado em 30/09/2026 por doc-verificador (delta `ae366480..5edfcfba` — `wc -l src/App.tsx` → 7008; `grep -c "useState("` → 40; `grep -c "lazy("` → 20; `grep -c "const handle[A-Za-z0-9_]* *="` → 88 e a lista = `grep -o` do fonte; `grep -n "key: '"` → 11 avisos, `termos` último; `grep -rl "types'"` em `mente/`+`refugio/` → 6; exports de `AreaView.tsx`/`PlaySheets.tsx`/`supportLine.ts` e props de `DuelScreen`/`TournamentPage`/`AreaTopBar`/`CityPicker`/`DungeonGame` (`clearBonus` × `DUNGEON_BITS_FACTOR` = 0,4 → 4/6/8/10/12) lidos no fonte; corrigidos: 'o 8º e último item', '19 lazy', três handlers ausentes da lista, `#en` do Sobre sem lápide, comando `grep -l` sem `-r`, `Depende de` de `mente/types.ts`); anterior: verificado em 29/09/2026 por doc-verificador (entradas tocadas); anterior: 28/09/2026 (sincronização do delta `25fd3c41..f465d266`, PR #131: `PetPage` repassa `dominantElement` ao card de classe); anterior: 28/09/2026 (sincronização do delta `1d9e278d..8110efc5`: `AreaScene` perdeu o NPC anfitrião fixo; `AreaSheet` ganhou altura fixa 2/3 da tela, `lotId`/`language` e NPC por sub-loja via `lotNpcArt`); anterior: 27/09/2026 (sincronização do delta `c510c7e4..2336e4e7`: aviso da `OraclePage` corrigido para o D-B1); anterior: 27/09/2026 (sincronização do delta `78ef5367..c510c7e4`, correções pós-F3 da minimal-ui: `CornerLink` (prop `icon: 'mapa' | 'home'`, arte em pixel no lugar do glifo) e `MapPage` (a pílula `chip-moeda` em 9-slice no saldo); anterior: 24/09/2026 (fechamento F6 da minimal-ui: `ItemsWindow.tsx` perdeu a tela (só `getFoodName`/`getFoodDesc`), `MapPage`/`CornerLink`/`AreaSheet`/`AreaScene`/`AreaTopBar` atualizados, "Chamado por" de `ArenaGame`/`DinoGame`/`DungeonGame`/`RPSGame`/`Icon`/`NavGlyphs` trocados de `ActivitiesPage`/`BottomNav` para `AreaView`/`nav/*`); anterior: 22/09/2026 (5ª sincronização do dia, delta `89554b5d..c7bca6d`: `SoulmonOnboarding.tsx` — ⚰️ `FAVORITE_STEP` não renderiza nada, `favoriteCreature`/`skipFavorite` saíram do estado e do `writeOracleDraft`, degrau pulado nos dois sentidos, constante e `ORACLE_DRAFT_VERSION` mantidas de propósito; anterior: 22/09/2026 (3ª sincronização do dia, delta `cd66940f..cf6315e1`: `App.tsx` **6384 linhas** e **81** handlers (`handleDungeonFloorCleared` entrou), mais o bloco da execução das respostas (`ofereceDesfazer`, os 6 emissores de `BondEvent`, a trava #59, o teto de Bits, `rebirth-reset`, `missionPerfectDays`); `DungeonGame.tsx` **577 linhas** e a prop nova `onFloorCleared`; `ActivitiesPage.tsx` **306 linhas** repassando-a; `UndoToast.tsx` já entrou em `cf6315e1`; anterior: 2ª sincronização do dia: delta `a6c1cd8a..592e2c14`, QA Rodada 2 — ⚰️ `figma/ImageWithFallback.tsx` apagado; `CompanionHUD`/`EvolutionPath` `onError` no sprite próprio e falas do fallback em `PET_VOICE_LINES`; `FeedbackLink` `BUILD_ID`; `GameTutorialFlow` `falhaIa`; `MorningCheckIn` âncora visível; `SettingsPage` Termos; `SoulmonOnboarding` `aposAutenticar` + região viva; `FormKit.ActionRow` `language`/sr-only; `RitualPanel` `aria-disabled`; `App.tsx` `termsNoticePrimeiraVez`/selo/`PostponeNudgeSheet` ids/trilha por estado))) · **Estado:** verificado em 28/09/2026 por doc-verificador (delta `25fd3c41..f465d266` — passagens tocadas conferidas símbolo a símbolo contra o fonte; anterior: verificado em 28/09/2026 por doc-verificador (delta `1d9e278d..8110efc5` — entradas de `AreaScene` e `AreaSheet` conferidas símbolo a símbolo contra o fonte: ausência do bloco `data-area-npc` em `AreaScene.tsx`; `height`, `data-area-sheet-npc-zone`, `data-area-sheet-npc-line`, props `lotId`/`language`/`npcArt` em `AreaSheet.tsx`; `lotNpcArt`/`LOT_NPC_ART`/`PLACEHOLDER_NPC_ART` em `src/assets/soulmon/npcs/index.ts`); anterior: verificado em 27/09/2026 por doc-verificador (delta `78ef5367..c510c7e4` — as duas entradas conferidas contra `CornerLink.tsx` e `MapPage.tsx`; a entrada de `PixelIcon` já tinha entrado com `c510c7e4` e foi reconferida); anterior: verificado em 24/09/2026 por doc-verificador (minimal-ui F1–F6 em HEAD `78ef5367` — entradas alteradas e pastas `arena/`, `home/`, `mercado/`, `nav/`, `play/` conferidas símbolo a símbolo: `wc -l src/App.tsx` → 6659, `useState(` → 37, `lazy(` → 19, handlers → 81 (lista = `grep -o` do fonte), `CompanionHUD` → 66; lápides por `git log --diff-filter=D`: `BottomNav` `292533a6`, `ActivitiesPage` `708fa034`, `ShopModal` `ac631987`); anterior: verificado em 22/09/2026 por doc-verificador (delta `89554b5d..c7bca6d` — conferido no fonte: nenhum `step === FAVORITE_STEP` renderiza, `useState`/`setFavoriteCreature`/`setSkipFavorite` ausentes, `writeOracleDraft` sem as duas chaves, e o `OracleInput` sem `favoriteCreature`); anterior: verificado em 22/09/2026 por doc-verificador (delta `cd66940f..cf6315e1` — `wc -l` refeito nos três arquivos, `grep -c "const handle[A-Za-z0-9_]* *=" src/App.tsx` → 81, e cada símbolo citado conferido no fonte); anterior: verificado em 22/09/2026 por doc-verificador (delta `a6c1cd8a..592e2c14` — as entradas acima conferidas símbolo a símbolo contra o fonte; anterior no mesmo dia: delta `f4086ce0..a6c1cd8a`, QA Rodada 1 — seções tocadas conferidas símbolo a símbolo contra o fonte: `App.tsx` (`widgetPetName`, `limparOrigemDaUrl`, `changed`), `CompanionHUD.tsx` (`getFoodName`), `FeedbackLink.tsx` (`__APP_VERSION__`, `originLabel`), `GameTutorialFlow.tsx`, `ItemsWindow.tsx` (`getFoodName` exportado), `NotificationManager.tsx`, `SettingsPage.tsx` (Sobre/Ajuda), `SoulmonOnboarding.tsx` (`avisoContaExcluida`), `TermsUpdateBanner.tsx` (`changed`, `region`), `form/FormKit.tsx` (`mailto:`); anterior: delta `f02a3166..4a8b8049`, execução das respostas #11–#39 — `App.tsx`, `ChatBox.tsx`, `CompanionHUD.tsx`, `ErrorBoundary.tsx`, `FeedbackLink.tsx`, `NotificationManager.tsx`, ⚰️ `SettingsModal.tsx`, `SettingsPage.tsx`, `TermsUpdateBanner.tsx`; anterior: entradas `src/App.tsx`, `src/components/SettingsModal.tsx` e `src/components/SettingsPage.tsx`, delta `5ac3d351..8d318529`, som/S16 + grupo Som; o resto: mecânico completo; delta `dc72579e..9875477b` conferido símbolo a símbolo, sha a sha)
> **Estado:** verificado em 16/11/2026 por doc-verificador (escopo: amostra de alto risco da sincronização `b0c1e59c..6b7773143` — constantes, exports, contagens de `App.tsx`, entradas novas e apagadas, símbolo por símbolo contra `6b7773143`; as linhas "Sync" de só texto/estilo NÃO foram reconferidas; 1 correção: `SLEEP_ENERGY_REGEN_BONUS` é ×1,5, não "o dobro").
> **Verificado em 09/11/2026 por doc-verificador** (delta `5229b1be..62f204e1b`: símbolos, caminhos e contagens do delta conferidos contra o código).
> **Estado:** verificado em 30/09/2026 por doc-mantenedor (delta `cfe27cc7..3532ccf5`, só as passagens tocadas, conferidas símbolo a símbolo contra o fonte em `3532ccf5` — `utils/travessias.ts`, `utils/travessiasSave.ts`, `types/travessias.ts`, `PasseioSheet.tsx`, `adventure.ts` › `adventureOfNight`, `playAreaLots.ts`, `CompanionHUD` › `walkingTo`, `GameStateContext` › `crossings`; sem verificador independente — subagentes `doc-*` não registrados); anterior: verificado em 30/09/2026 por doc-mantenedor (sem verificador independente nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — `_admin.js`, `gmTools.ts`, `corvoAdocao.ts`, `AreaTopBar.tsx`, `npcScale.ts`, `attributes.ts`; só as seções tocadas; delta `8e6d0d9a..ae366480`); anterior: verificado em 29/09/2026 por doc-mantenedor (sem a ferramenta Agent nesta sessão: verificação própria, símbolo a símbolo por `grep` contra o fonte — exports de `_coop.js`/`guild.js`/`_profile.js`, módulos novos de `src/`, constantes e chaves de KV; delta `38c3ccb5..b657a340`, só as seções tocadas; `docsManual`/`docsSemMentira` verdes)
> **Verificação:** `npx vitest run src/docsManual.contract.test.ts` (item c — cobertura de referência) e a lista de `.test.tsx`/`.test.ts` citada em cada entrada.
> **Não cobre:** regra de negócio em profundidade (→ [02-REGRAS-DE-NEGOCIO.md](../02-REGRAS-DE-NEGOCIO.md)), fluxo de tela a tela (→ [03-FLUXO-DE-TELAS.md](../03-FLUXO-DE-TELAS.md)), identidade visual/tokens (→ [04-IDENTIDADE-VISUAL.md](../04-IDENTIDADE-VISUAL.md)).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

Uma entrada por módulo não-teste de `src/components` (91 módulos, `find src/components -type f \( -name '*.tsx' -o -name '*.ts' \) ! -name '*.test.ts*' | wc -l`, 09/09/2026) + `src/App.tsx` + `src/main.tsx` (orquestrador e ponto de entrada, fora da árvore `src/components` mas essenciais para achar quem chama cada componente). "Chamado por" é sempre `grep -rl` pelo nome do arquivo (import estático ou `lazy(() => import(...))`), não memória.

## Índice por página/família

- **Orquestração:** [`src/App.tsx`](#srcapptsx) · [`src/main.tsx`](#srcmaintsx) · [`ErrorBoundary.tsx`](#srccomponentserrorboundarytsx) · [`ContentModals.tsx`](#srccomponentscontentmodalstsx) · ⚰️ [`BottomNav.tsx`](#srccomponentsbottomnavtsx) · [`nav/CornerLink.tsx`](#srccomponentsnavcornerlinktsx) · [`nav/MapPage.tsx`](#srccomponentsnavmappagetsx) · [`nav/AreaTopBar.tsx`](#srccomponentsnavareatopbartsx) · ⚰️ `nav/HomeMenuSheet.tsx` (apagado em `0671982f`, 07/10/2026: o botão de avatar leva às Configurações) · [`IntroScreen.tsx`](#srccomponentsintroscreentsx)
- **Home e pet:** [`CompanionHUD.tsx`](#srccomponentscompanionhudtsx) · [`CareSystem.tsx`](#srccomponentscaresystemtsx) · [`ChatBox.tsx`](#srccomponentschatboxtsx) · [`PetPage.tsx`](#srccomponentspetpagetsx) · [`PetStageDecor.tsx`](#srccomponentspetstagedecortsx) · [`ArcadeTela.tsx`](#srccomponentsarcadetelatsx) · [`play/ArcadeModal.tsx`](#srccomponentsplayarcademodaltsx) · [`PlayCard.tsx`](#srccomponentsplaycardtsx) · [`GamePopups.tsx`](#srccomponentsgamepopupstsx) · [`FirstTaskCompletedPopup.tsx`](#srccomponentsfirsttaskcompletedpopuptsx) · [`nestArt.ts`](#srccomponentsnestartts) · [`evolution/SoulNode.tsx`](#srccomponentsevolutionsoulnodetsx) · [`evolution/nodeArt.tsx`](#srccomponentsevolutionnodearttsx) · [`RestWindowCard.tsx`](#srccomponentsrestwindowcardtsx) · [`DreamDex.tsx`](#srccomponentsdreamdextsx) · [`AdventureDiary.tsx`](#srccomponentsadventurediarytsx) · [`MorningDream.tsx`](#srccomponentsmorningdreamtsx) · [`NightmareBattle.tsx`](#srccomponentsnightmarebattletsx) · [`StepsCard.tsx`](#srccomponentsstepscardtsx) · [`StepRow.tsx`](#srccomponentssteprowtsx)
- **Atividades e tarefas:** [`DailyRituals.tsx`](#srccomponentsdailyritualstsx) · [`DaySquares.tsx`](#srccomponentsdaysquarestsx) · [`CreateModal.tsx`](#srccomponentscreatemodaltsx) · [`EditModal.tsx`](#srccomponentseditmodaltsx) · [`TaskEditModal.tsx`](#srccomponentstaskeditmodaltsx) · [`TaskMeta.tsx`](#srccomponentstaskmetatsx) · [`TriagePile.tsx`](#srccomponentstriagepiletsx) · [`QuickAddBar.tsx`](#srccomponentsquickaddbartsx) · [`EvolveTaskModal.tsx`](#srccomponentsevolvetaskmodaltsx) · [`HabitConstancy.tsx`](#srccomponentshabitconstancytsx) · [`MilestoneCeremony.tsx`](#srccomponentsmilestoneceremonytsx) · [`MorningCheckIn.tsx`](#srccomponentsmorningcheckintsx) · [`WeeklyReportCard.tsx`](#srccomponentsweeklyreportcardtsx) · [`FirstDayCard.tsx`](#srccomponentsfirstdaycardtsx)
- **Evolução:** [`EvolutionPath.tsx`](#srccomponentsevolutionpathtsx) · [`EvolutionCeremony.tsx`](#srccomponentsevolutionceremonytsx) · [`EvoTrail.tsx`](#srccomponentsevotrailtsx) · [`BestiaryCard.tsx`](#srccomponentsbestiarycardtsx) · [`RebirthModal.tsx`](#srccomponentsrebirthmodaltsx)
- **Jogos:** [`DungeonGame.tsx`](#srccomponentsdungeongametsx) · [`ArenaGame.tsx`](#srccomponentsarenagametsx) · [`DinoGame.tsx`](#srccomponentsdinogametsx) · [`RPSGame.tsx`](#srccomponentsrpsgametsx) · [`pixel/TimingBar.tsx`](#srccomponentspixeltimingbartsx) · [`games/GameKit.tsx`](#srccomponentsgamesgamekittsx)
- **Loja e economia:** [`mercado/MercadoSheets.tsx`](#srccomponentsmercadomercadosheetstsx) · [`mercado/ShopShelf.tsx`](#srccomponentsmercadoshopshelftsx) · [`home/Mochila.tsx`](#srccomponentshomemochilatsx) · [`ItemsWindow.tsx`](#srccomponentsitemswindowtsx) · [`CreditsModal.tsx`](#srccomponentscreditsmodaltsx) · [`UnlockAccountModal.tsx`](#srccomponentsunlockaccountmodaltsx)
- **Rituais e relatórios:** [`DailyReportModal.tsx`](#srccomponentsdailyreportmodaltsx) · [`DayGoalsModal.tsx`](#srccomponentsdaygoalsmodaltsx-15102026-registro-66) · [`play/StrollFind.tsx`](#srccomponentsplaystrollfindtsx-15102026-registro-66) · [`MemoriesCard.tsx`](#srccomponentsmemoriescardtsx) · [`BalanceWeekModal.tsx`](#srccomponentsbalanceweekmodaltsx) · [`ProtectProgressModal.tsx`](#srccomponentsprotectprogressmodaltsx) · [`StatsPage.tsx`](#srccomponentsstatspagetsx) · [`BirthCard.tsx`](#srccomponentsbirthcardtsx)
- **Conta e configurações:** [`SettingsPage.tsx`](#srccomponentssettingspagetsx) · ⚰️ [`SettingsModal.tsx`](#srccomponentssettingsmodaltsx) (apagado em `4a8b8049`) · [`FeedbackLink.tsx`](#srccomponentsfeedbacklinktsx) · [`TermsUpdateBanner.tsx`](#srccomponentstermsupdatebannertsx) · [`AccountSection.tsx`](#srccomponentsaccountsectiontsx) · [`AccountDataSection.tsx`](#srccomponentsaccountdatasectiontsx) · [`AISettingsModal.tsx`](#srccomponentsaisettingsmodaltsx) · [`NotificationManager.tsx`](#srccomponentsnotificationmanagertsx) · [`InstallPrompt.tsx`](#srccomponentsinstallprompttsx) · [`GuideModal.tsx`](#srccomponentsguidemodaltsx) · [`HelpModal.tsx`](#srccomponentshelpmodaltsx) · [`GameTutorialFlow.tsx`](#srccomponentsgametutorialflowtsx) · [`WelcomePromptModal.tsx`](#srccomponentswelcomepromptmodaltsx) · [`CityPicker.tsx`](#srccomponentscitypickertsx)
- **Onboarding e oráculo:** [`SoulmonOnboarding.tsx`](#srccomponentssoulmononboardingtsx) · [`OnboardingOvo.tsx`](#srccomponentsonboardingovotsx) · [`ChocarBB.tsx`](#srccomponentschocarbbtsx) · [`OraclePage.tsx`](#srccomponentsoraclepagetsx) · [`SoulTestItem.tsx`](#srccomponentssoultestitemtsx) · [`AlignmentIcons.tsx`](#srccomponentsalignmenticonstsx) · [`PixelizerCard.tsx`](#srccomponentspixelizercardtsx) · [`NewReadingModal.tsx`](#srccomponentsnewreadingmodaltsx)
- **Comunidade:** [`LibraryPage.tsx`](#srccomponentslibrarypagetsx) · [`PlayerDetailModal.tsx`](#srccomponentsplayerdetailmodaltsx) · [`CoopPanel.tsx`](#srccomponentscooppaneltsx) · [`TournamentPage.tsx`](#srccomponentstournamentpagetsx)
- **Infraestrutura de UI:** [`ForgeResultModal.tsx`](#srccomponentsforgeresultmodaltsx) · [`FundadorAvisoModal.tsx`](#srccomponentsfundadoravisomodaltsx) · [`CreateChoicePopup.tsx`](#srccomponentscreatechoicepopuptsx) · [`HabitOverRecommendedPopup.tsx`](#srccomponentshabitoverrecommendedpopuptsx) · [`ConfirmDialog.tsx`](#srccomponentsconfirmdialogtsx) · [`PixelFrame.tsx`](#srccomponentspixelframetsx) · [`figma/ImageWithFallback.tsx`](#srccomponentsfigmaimagewithfallbacktsx) · [`form/FormKit.tsx`](#srccomponentsformformkittsx) · [`pixel/HomeHud.tsx`](#srccomponentspixelhomehudtsx) · [`pixel/PixelKit.tsx`](#srccomponentspixelpixelkittsx) · [`pixel/RitualPanel.tsx`](#srccomponentspixelritualpaneltsx) · [`ritual/RitualKit.tsx`](#srccomponentsritualritualkittsx) · [`pixel/SpriteAnim.tsx`](#srccomponentspixelspriteanimtsx) · [`pixel/VisorBar.tsx`](#srccomponentspixelvisorbartsx) · [`ui/BackArrow.tsx`](#srccomponentsuibackarrowtsx) · [`ui/ChevronAcao.tsx`](#srccomponentsuichevronacaotsx) · [`ui/CristalChama.tsx`](#srccomponentsuicristalchamatsx) · [`ui/EstagioIcone.tsx`](#srccomponentsuiestagioiconetsx) · [`ui/Icon.tsx`](#srccomponentsuiicontsx) · [`ui/LoadingBar.tsx`](#srccomponentsuiloadingbartsx) · [`ui/LockBadge.tsx`](#srccomponentsuilockbadgetsx) · [`ui/MiniGlass.tsx`](#srccomponentsuiminiglasstsx) · [`ui/NavGlyphs.tsx`](#srccomponentsuinavglyphstsx) · [`ui/OfflineSeal.tsx`](#srccomponentsuiofflinesealtsx) · [`ui/PixelIcon.tsx`](#srccomponentsuipixelicontsx) · [`ui/ScreenSkeleton.tsx`](#srccomponentsuiscreenskeletontsx) · [`ui/Viewport.tsx`](#srccomponentsuiviewporttsx) · [`ui/sonner.tsx`](#srccomponentsuisonnertsx)

---

### `src/components/AISettingsModal.tsx`
**Dono de:** modal de personalidade do companheiro — tom, intensidade de emoji, estilo de motivação e "mais opções" (instruções livres + temperatura) atrás de `Disclosure`.
**Props principais:** `AISettingsModalProps` — `isOpen`, `onClose`, `currentSettings: AISettings`, `onSave(settings)`, `language?` (se ausente, lê `resolveLanguage`/`STORAGE_KEYS` via `readLocal`).
**Exports:** `Disclosure(children, título)` — revelação colapsável para o avançado · `SwitchRow` — linha de configuração com alvo = linha inteira · `ActionRow` — linha que leva a outro painel/guia/política · `AISettingsModal(props)` — o modal.
**Estado/efeitos relevantes:** `useState` local (`open`, `s: AISettings`); `useEffect` resseta `s` quando `currentSettings`/`isOpen` mudam. `onSave` é quem persiste (o modal não grava sozinho).
**Chamado por:** `src/App.tsx`, `src/components/ChatBox.tsx`, `src/components/SettingsPage.tsx` (`grep -rl "from '.*/AISettingsModal'" src`, 21/09/2026 — ⚰️ o `SettingsModal.tsx`, que montava a segunda instância, foi apagado em `4a8b8049`).
**Régua:** `src/components/settingsTelemetry.render.test.tsx` (cobre a superfície de configurações, incluindo este modal).
**Avisos do arquivo:** número que o usuário não usa para decidir vira palavra (Previsível/Equilibrado/Criativo), não `0.85` — régua nº 2 do cabeçalho; instruções livres e criatividade são avançado, atrás de "Mais opções" — régua nº 3; uma ação dominante (Salvar).

### `src/components/DaySquares.tsx`
**Dono de:** os 7 quadrados Dom→Sáb (rótulos curtos PT/EN, `aria-pressed`, alvo ≥ 44px) — o seletor de dias COMPARTILHADO: hoje nos filtros de dia da `View all` (`DailyRituals`), depois o "Quando" da Nova tarefa. Apresentacional e controlado: nunca grava nem lê `schedule`.
**Props principais:** `DaySquaresProps` — `days: WeekDay[]` (selecionados, Dom=0…Sáb=6), `onToggle(day)`, `mode: 'multi' | 'single-filter'`, `language`, `groupLabel?`.
**Exports:** `WeekDay` · `WEEK_DAYS` · `DaySquares(props)` (nomeado e default).
**Estado/efeitos relevantes:** nenhum. No `single-filter` o pai trata o toque no dia já ligado como limpar (volta a "Todos").
**Chamado por:** `src/components/DailyRituals.tsx` (`AllFilters`).
**Régua:** `src/components/DailyRituals.diaFiltro.render.test.tsx` (360/375/412, filtrar muda a lista, não altera o schedule).
**Avisos do arquivo:** CSS `.sm2-day-squares`/`.sm2-day-square` só em `src/index.css`, grade de 7 colunas iguais (cabe em 360px); sem `all:unset`, só tokens `--sm2-*`. Semântica do filtro: `weekdays` = os dias do schedule; `everyNDays`/`timesPerWeek` = todo dia (`weekDaysForSchedule`); tarefa "uma vez" com `startDate` = só o dia da semana dela.

### `src/components/RevealContaNaoPaga.tsx`
**Dono de:** o aviso do reveal do onboarding quando a geração do desenho foi recusada por conta não paga (402 `paid-tier-required`): diz o porquê (PT/EN, sem culpa) e oferece "Desbloquear a conta" pelo MESMO modal de compra do jogo. Antes o cristal ficava parado e a tela dizia "o desenho ainda está sendo feito".
**Props principais:** `isPt`, `onDesbloquear`.
**Exports:** `RevealContaNaoPaga(props)` (nomeado e default).
**Chamado por:** `src/components/SoulmonOnboarding.tsx` (no reveal, no lugar da frase "ainda está sendo feito").
**Régua:** `src/components/RevealContaNaoPaga.render.test.tsx`.

### `src/components/XpGainDisplay.tsx`
**Dono de:** o display transitório "+N EXP" do ganho de XP do Vínculo (entra pela esquerda, 1 s no centro, sai pela direita).
**Props principais:** `totalXP`, `language`, `demo?`.
**Exports:** `XpGainDisplay(props)`.
**Estado/efeitos relevantes:** compara `totalXP` anterior × atual num efeito (pura leitura, StrictMode-safe) via `xpGainBetween` (`src/utils/xpGain.ts`); coalesce em `XP_COALESCE_MS` (400 ms), fila de um por vez, 1,7 s por display.
**Chamado por:** `src/App.tsx` (`lazy`, `Suspense fallback={null}`, antes do `Toaster`).
**Régua:** `src/components/XpGainDisplay.render.test.tsx`.
**Avisos do arquivo:** fora das duas filas de avisos; sem som (R-NOVA); sem campo no save; não mostra hidratação, delta ≤ 0, salto > `XP_GAIN_DISPLAY_CAP` (adoção/migração) nem demo.

### `src/components/LevelUpOverlay.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** layout em coluna de altura cheia (12/11/2026, `data-lvup-column`): o emblema BOND UP no topo, o pet na maior área no meio e o LV + "Tap to continue" na base (zona do polegar), com safe-area; só layout/estilo.
**Dono de:** o display de LEVEL UP do Vínculo (pedido do dono, 11/10/2026): sobrepõe a tela, escurece o fundo (`rgba(2,10,12,.88)`) e SÓ SAI AO TOQUE — sem timer de saída. A palavra "LEVEL UP", o pet (128), o número grande (que "sobe" de `from` a `to`) e a luz moram dentro de um VIDRO do visor (regra-mãe: pixel só no visor); fora dele, "Lv A → Lv B" (quando sobem vários níveis), a lista do que veio (ponto de talento, recompensas do Vínculo, portões abertos) e "Tap to continue"/"Toque para continuar".
**Props principais:** `event` (`{from,to}` de `levelUpPending`), `language`, `spriteUrl?`, `onDone(celebrated)`.
**Exports:** `LevelUpOverlay(props)`, `ARM_MS` (450 ms em que o toque é ignorado — o gesto que causou a subida não pode fechá-lo).
**Estado/efeitos relevantes:** `useDialogA11y` (trap, Escape = o mesmo gesto); luz procedural própria só fora de movimento reduzido (⚰️ o `EvolutionLight` da cerimônia de evolução foi apagado em 31/10/2026, REGISTRO §208); arte opcional (banner/burst/moldura) por `utils/levelUpArt.ts` com fallback procedural; som `playLevelUp` só com aba visível E `barramentoAtual()?.ctx.state === 'running'` (D11 no chamador — a abertura do app nasce muda).
**Chamado por:** `src/App.tsx` (`lazy`; intersticial `'levelUp'`, depois de `groveMilestone` e antes de `dream`; z-index 300).
**Régua:** `src/components/LevelUpOverlay.render.test.tsx` · `src/components/filaDeAvisos.contract.test.ts` (posição e montagem única).
**Avisos do arquivo:** movimento reduzido reduz o MOVIMENTO, nunca a pausa (regra no bloco canônico do `index.css`); nunca "faltam N"; demo local não celebra.

### `src/components/RestoreBackupSection.tsx`
**Dono de:** a tela "Restaurar backup" (L08-04): lista as cópias do aparelho (data, "Nome · Estágio", origem em palavras, nunca XP/percentual/contagem), importa o arquivo exportado e pede confirmação antes de restaurar. Props: `language`, `reload?` (injeção de teste).
**Chamado por:** `AccountDataSection.tsx` (fim da seção). **Régua:** `src/components/RestoreBackupSection.render.test.tsx`.
**Avisos do arquivo:** recarrega a página só depois de `restaurarCopia` devolver `'ok'`; voz calma, sem cobrança.

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
**Dono de:** o convite do catálogo (F3) — áreas/dificuldades/forças (até 3 cada) e a tela "Seu ponto de partida", com `recommendStarterSet`. Roda para jogador novo e antigo pelo MESMO mecanismo (ver `catalogOnboarding.ts`). Pulável em qualquer passo. **Desde 15/10/2026 (REGISTRO §66) as sugestões nascem DESMARCADAS** e só entra o que for marcado (substitui o "todas marcadas" do 7.3).
**Props principais:** `CatalogOnboardingFlowProps` — `language?`, `onSkip()`, `onComplete(chosen: CatalogItem[])`.
**Exports:** `CatalogOnboardingFlow(props)` · `activitiesFromCatalogChoice(items)` — monta as `Activity` (nível 1, agenda do nível 1 do item, id novo).
**Chamado por:** `src/App.tsx` (intersticial `catalogOnboarding`, menor prioridade da fila).
**Régua:** `src/components/catalog/CatalogOnboardingFlow.render.test.tsx`.

### `src/components/catalog/CatalogBrowserModal.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props `habitsCount`/`habitsCap`/`capIsDemoBoundary`: com a cota de hábitos de todo dia cheia o "Adicionar" fica desligado e o aviso explica (§376); conta grátis no limite mostra o mesmo `UnlockNudge` (`task-limit`) do `CreateModal` (§385).
**Dono de:** o navegador do catálogo (F4) — busca, abas por área, cartão "por que funciona", "Algo que não está aqui?" (abre o `CreateModal` legado, inalterado). Item `optInOnly` abre `CatalogMindNotice` antes de adicionar.
**Props principais:** `CatalogBrowserModalProps` — `isOpen`, `onClose()`, `language?`, `onAdd(item)`, `onCreateFromScratch()`, `existingActivities?`, `habitsCount?`/`habitsCap?`/`capIsDemoBoundary?` (§376: cota de hábitos cheia mostra o aviso `catalogHabitCapNotice` e desliga o "Adicionar").
**Chamado por:** `src/App.tsx` (substitui a abertura direta do `CreateModal` pelo botão "+" — `handleAddNewActivity`).
**Régua:** `src/components/catalog/CatalogBrowserModal.render.test.tsx`, `CatalogBrowserModal.teto.render.test.tsx`.

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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `onEarnPoints(points, extraCap?)` (teto de Bits da Arena por categoria, §456); prop `onBeginRun?: () => boolean` pede 1 convite de Duelo ao começar a run (`false` = volta para a folha onde está a troca por energia, §458); `onRunEnd` re-sorteia `ARENA_CHOICES` cards; `arenaRoundDrops` mostra a linha "×2" do último adversário (§384); `RiftResultExtras` no resultado; cena com companheiro invocado (`companheiroDoEstado`, `summonsDoGrupo`) e golpes do inimigo por `foeStrikeForm`.
**Dono de:** a Arena — cinco rodadas em GRUPO (N × 1) contra criaturas do bestiário, no núcleo do Combate v3 (PR3b): o pet é `soulCombatant`, os inimigos lutam ao mesmo tempo, o relógio é o do núcleo (`games/useGroupBattle.ts`); anel de 17 elementos e a habilidade especial da ficha (família provisória por escola até o PR9). Lê o level do save por `useGameStateOptional()` (sem provider, cai no estágio).
**Props principais:** `ArenaGameProps` (exportado).
**Exports:** `ArenaGameProps` (interface) · `ArenaGame(props)`.
**Estado/efeitos relevantes:** `useState` para `pool`, `fase` (`carregando`/`sem-motor`/`intro`/`luta`/`rodada-limpa`/`venceu`/`perdeu`/`empatou`), `rodada`, `inimigos` (só o sabor), `pontos`, `sprites`, `fightKey`; refs para a semente da run, o HP e a energia que passam de uma rodada para a outra; `useGroupBattle` roda a luta. Derrota e empate encerram a run sem custo (não escreve no save).
**Chamado por:** `src/components/nav/AreaView.tsx` (lote Duelo da Arena, minimal-ui F5; ⚰️ até então `ActivitiesPage.tsx`) (`grep -rl "ArenaGame'" src`, 24/09/2026).
**Régua:** `src/components/ArenaGame.render.test.tsx` (as fases que não são a luta) e `ArenaGame.torcida.render.test.tsx` (a luta em grupo: cheer, anel com o relógio pausado, especial em área × único, derrota/empate/vitória, pausa, movimento reduzido); os balanços moram em `src/utils/arena.v3.test.ts`.
**Cena (02/10/2026, rodada 5/I10):** a LUTA (sem as flags de timing) é a `BattleStage` em tela cheia, não mais o visor 348×160: golpes com a arte do elemento da skill básica/especial da ficha (físico investe, o resto atira; o escudo da defesa automática é o do elemento do defensor) e X com confirmação (a corrida se perde). Intro, rodada limpa e resultado seguem no layout antigo. **PR3b:** a luta é sempre a `BattleStage` (os caminhos antigos de barra de timing e de carga em turnos saíram).
**Energia (PR3b, Combate v3):** a energia vem do evento do núcleo ("uma barra, um uso"); a barra de cheer (`CHEER_TAPS_FULL` = 24, no máximo 16 toques por janela de 3 s) despeja uma descarga que o núcleo recolhe por `cheerDrain`; só o chefe mostra barra de energia nos inimigos. Energia cheia = o `cast` PAUSA o relógio e o anel devolve o multiplicador do especial; o `cast` do inimigo abre a esquiva. A explicação da intro mora atrás de um `InfoTip`.
**Avisos do arquivo:** ⚠️ as constantes de balanço (`ARENA_FOES` etc.) são MEDIDAS por `_sim/cv3-medir/grupo.ts` — recalibrar por ele, nunca à mão (risco R1: power do DoT 0,85→1,1 vai de 56% a 79%). Sem `Math.random`: a luta é função da semente.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** `onRunEnd(outcome)` (uma vez por run — o `App` re-sorteia o trio), `ladder` (congelado no começo da run, `runLadderRef`), `petBase`, `onEarnPoints` devolvendo os Bits creditados; entre rodadas abre `ArenaCuraModal`; o "Poder" mostrado é `statExibido(atk)` (atributos ×10 só na tela); essências da run entram no livro "Ganhou" (`essenceLedgerRows`); velocidade por `useBattleSpeed`.

### `src/components/BalanceWeekModal.tsx`
**Dono de:** tela de confirmação de "Equilibrar minha semana" (P4) — mostra antes/depois de uma proposta de redistribuição e só aplica com confirmação explícita.
**Props principais:** `Props` — `open`, `onClose`, `language`, `atividades: {id,name,weekDays}[]` (só `Schedule.kind==='weekdays'`), `teto` (o `required` do estágio, decidido fora), e um handler que recebe só o que mudou.
**Exports:** `BalanceWeekModal(props)` · `default`.
**Estado/efeitos relevantes:** `useMemo` calcula `proposta` (via `equilibrarSemana` de `src/utils/weekBalance.ts`) e `nomePorId`; sem estado próprio — decisão de aplicar ou recusar vive no `App.tsx`.
**Chamado por:** `grep -rl "from '.*/BalanceWeekModal'" src` → `src/components/BalanceWeekModal.render.test.tsx`; consumo real em `src/App.tsx` via `lazy(() => import('./components/BalanceWeekModal'))` (09/09/2026).
**Régua:** `src/components/BalanceWeekModal.render.test.tsx`.
**Avisos do arquivo:** não é um planejador — é proposta pronta, aceita ou recusada; antes/depois mostrado antes de qualquer escrita; "Agora não" é saída de primeira classe; muda QUAIS dias, nunca QUANTOS; quando a carga não cabe em `7 × teto`, a tela diz explicitamente que não resolve, em vez de prometer alívio que não vem.


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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** "jogar de novo" com a arte do prédio.
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

### `src/components/nav/GuildaMapPage.tsx` (05/11/2026)
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `glitchtama { left, bits, onBuy }` (⚠️ TESTE, `utils/glitchtamaTeste.ts`: o Desfeito vende o 🌀) e `kind: "limite"` na recusa.

**Dono de:** o mapa da Guilda dos Mercenários: cinco prédios pintados no fundo (`GUILDA_PREDIOS`); as três Ordens abrem o líder em `MercGuildSheet` (folha `AreaSheet`: a missão primeiro, depois Aceito ou Vou pensar), Remendados e Desfeitos abrem só o NPC. A entrada é secreta: `MapPage` › `onSecretoGuilda`, segurar o cristal por 3 s.

### `src/components/nav/npcGiver.ts` (12/11/2026 — REGISTRO §314)
**Dono de:** quem passa a missão no cartão da lista do dia: `giverOf(chave, language)` devolve nome curto e retrato do NPC (`LOT_NPC_VOICE`/`LOT_NPC_ART`, Papus, Nuri) e `npcKeyOfBuilding` dá a chave do anfitrião de um prédio. **Chamado por:** `DailyMissionList.tsx`. **Régua:** `npcMissionCards.render.test.tsx`.

### `src/components/nav/lotHalo.ts`
**Dono de:** o HALO PRETO dos prédios (20/10/2026, REGISTRO §140): `lotArtFilter({ locked?, accent? })` devolve o `filter` único dos sprites de lote — contorno preto (`LOT_HALO_BLACK`) + sombra de chão; trancado = cinza (`LOT_LOCKED_FILTER`) com o mesmo halo; `LOT_HALO_ACCENT` é o acento claro do Caderno. **Chamado por:** `AreaScene` e `MapPage`. **Régua:** `lotHalo.contract.test.ts` (as 6 áreas, abertos e trancados; só o `AreaScene` desenha sprite de lote).

### `src/components/nav/AreaTopBar.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o Voltar esmaece com modal aberto por cima (`useBackDimmed`, `data-modal-dimmed`).
**Dono de:** o topo de uma área do Mapa e das páginas do menu da Home — voltar (seta em círculo, exceção D1 do dono) + título centralizado.
**Props principais:** `icon?` (`'map'` nas áreas, `'arrow_back'` padrão — 29/09/2026), `overScene?` (topo sobre o fundo full-screen: tinta `#E9F5F2` + scrim), `covered?` (há folha/jogo/duelo aberto: o topo some por `visibility:hidden`, sai do foco e da árvore de acessibilidade), `title`, `backLabel` (diz PARA ONDE), `onBack`, `ownsHeading?` (`false` quando a página de baixo já tem `<h1>`: o título vira `<p aria-hidden>`; desde a F5 o `App` não passa mais — nenhuma área tem página dona do `<h1>` —, fica o padrão `true`).
**Exports:** `AreaTopBar(props)`. Delta `ae366480..5edfcfba`: com `icon="map"` o botão voltar renderiza `PixelIcon name="mapa"` (32 px, o MESMO ícone ilustrado do `CornerLink` da Home — pedido do dono, 30/09/2026); `arrow_back` segue `NavGlyph`. ⚰️ o glifo `map` de `NavGlyphs` deixou de ser usado aqui.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/components/nav/nav.render.test.tsx`.

### `src/components/nav/TopStatusBar.tsx` (24/11/2026 — P2 + arte da P6)
**Dono de:** a BARRINHA DO TOPO, faixa fina fixa (`.sm2-topbar*` no index.css, 52 px, colada no topo físico, SEM safe-area) no Mapa e nos prédios: à esquerda Bits (`BitsIcon`) e Energia (`energia`, "6/6"; teto >= 10 mostra só o atual); à direita, colada ao canto, Honra (`HonorIcon`) | Créditos (`CreditIcon`); o meio fica vazio (sem Corações, ordem do dono 24/11/2026). Cada valor numa bordinha de bronze 9-slice horizontal (`TOPBAR_ART` em `assets/soulmon/icones-ui`, arte @2x), ícone de 24 px, valor abreviado (`abreviar`: 99999 → "99k", 1234 → "1,2k"/"1.2k"; Bits só passam a "12k" a partir de 10 mil). Cada slot é um `InfoTip` (dica de 4 s; `aria-label` por slot; toque ≥ 44). Enquanto montada publica `--sm2-topbar-push` na raiz e as âncoras de canto (`cornerAnchor.ts`), o `AreaTopBar` e a zona do NPC do `AreaSheet` descem `max(safe-area do topo, push)`: com a barra (colada no topo físico) vale só ela, sem safe-area somada; sem a barra (Home) o push é 0 e vale a safe-area, como sempre. No `MapPage`, o palco do mapa (`MAPA_PALCO_STYLE`, cover pela largura, sem esticar) preenche o espaço livre entre a base da barrinha e a base da tela (safe-area inferior), centrado verticalmente; só sobra corte de céu/rochas no topo e na base, os 7 prédios e rótulos ficam visíveis (360/375/412).
**Props principais:** `data?: TopStatusBarData` (`language`, `credits`, `emblems`, `bits`, `energy`, `maxEnergy`) — sem ela lê o `TopStatusBarContext` (o `App` o provê em volta do `AreaView`); sem as duas, não renderiza. `covered` esconde (`visibility`) quando uma folha/jogo cobre a cena.
**Exports:** `TopStatusBar` · `TopStatusBarContext` · `TopStatusBarData` · `abreviar(n, language, de?)` · `formatEnergia(atual, teto)` (teto >= 10 mostra só o atual).
**Chamado por:** `MapPage` (por prop), `App.tsx` (a da cena dos prédios) e `AreaSheet` (pelo contexto; ponto de encaixe: depois do `SheetShell`, ainda dentro do `[data-area-sheet-frame]`).
**Régua:** `src/components/nav/TopStatusBar.render.test.tsx`.

### `src/components/nav/DailyMissionList.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** cada cartão diz NOME, o que fazer, RECOMPENSA (sempre, `RewardChip`) e QUEM passa (`giverOf`), um por NPC em rodízio (§310/§318).
**Dono de:** os cartões das missões diárias dos outros recursos na folha de Missões (convite, nunca cobrança; REGISTRO §52).
**Props principais:** `language`, `state` (`DailyMissionsState`), `day` (dia do jogador), `bondLevel`, `onClaim(id)`.
**Exports:** `DailyMissionsProps` (interface), `dailyMissionEntries(props)` (entradas `MissionEntry` para o quadro).
**Chamado por:** `src/components/nav/DailyMissionBoard.tsx`.
**Régua:** `src/components/nav/dailyMissionList.render.test.tsx`.

### `src/components/nav/RewardChip.tsx` (13/11/2026)
**Dono de:** a recompensa em ÍCONE (+ quantidade) nos cartões de missão: Bits, materiais e fallback para XP/Créditos (§336/missões com retrato do NPC).
**Props principais:** `kind`, `materialId?`, `amount?`, `name`, `isPt`.
**Exports:** `rewardIcon(kind, materialId?, size?)`, `RewardChip`.
**Chamado por:** `src/components/nav/DailyMissionList.tsx`, cartões de missão de NPC.
**Régua:** `src/components/nav/npcMissionCards.render.test.tsx`.

### `src/components/nav/DailyMissionBoard.tsx` (20/10/2026)
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `onDoneStroll` (concluir o passeio escolhido direto da linha).
**Dono de:** o QUADRO da aba Diárias (seção "Hoje"/"Today", lazy): UM `<ul data-daily-board>` com a especial do dia, o Passeio, as missões de prédio e as diárias, na ordem de `layoutMissionBoard` — rótulo "Special mission"/"Missão especial" + especial aberta no topo, linha fina (`data-mission-divider`), prontas, abertas e, no fim, as resgatadas (REGISTRO §132).
**Régua:** `src/components/nav/dailyMissionBoard.render.test.tsx`.

### `src/components/nav/MissionCard.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** export `MISSION_PORTRAIT_FOCUS` (`50% 18%`); props `giver` (retrato + nome do NPC), `rewardAlways` (recompensa também depois de resgatada), `openAction` (botão do estado aberto: o "Done" do passeio, §413) e `title: ReactNode`.
**Dono de:** o CARTÃO DE MISSÃO — um por missão em todas as abas da folha de Missões (borda `--sm2-line`, fundo `--sm2-surface`): "!" amarelo da paleta sem círculo (check quando resgatada), título que vira "Ir" quando a missão tem lugar, descrição curta, progresso, recompensa, estado e a ação (Resgatar). `resolveGo` decide a navegação pelo Vínculo: prédio fechado não navega e mostra o requisito (REGISTRO §62).
**Props principais:** `language`, `attrs` (`data-*`), `status` (`open`/`ready`/`claimed`), `title`, `desc`, `progress`, `reward`, `onGo`, `lockNote`, `action`.
**Exports:** `MissionNav` (interface) · `resolveGo(nav, target, language)` · `MissionCardStatus` · `MissionCard(props)` · `MissionCardList` · `ClaimButton`.
**Chamado por:** `strollEntries`, `buildingQuestEntries`, `dailyMissionEntries`, `specialMissionEntries` (todos montados no `DailyMissionBoard`), `FirstTimesList`, `WeeklyMissionList` (`ShopShelf.tsx`). Tipo `MissionEntry { key, state, node }`.
**Régua:** `src/components/nav/missionCards.render.test.tsx`.

### `src/components/nav/FirstTimesList.tsx`
**Dono de:** a lista das PRIMEIRAS VEZES (missões únicas, 1× na vida) na folha de Missões — convite, as já resgatadas viram só contagem (REGISTRO §54).
**Props principais:** `language`, `state` (`FirstTimesState`), `bondLevel`, `onClaim(id)`.
**Exports:** `FirstTimesProps` (interface), `FirstTimesList(props)`.
**Chamado por:** `src/components/nav/MissionsSheet.tsx`.
**Régua:** `src/components/nav/missionsMenu.render.test.tsx`.

### `src/components/nav/npcScale.ts`
**Dono de:** a escala do NPC na folha do lote — `NPC_SCALE = 1.4` (pedido do dono, 29/09/2026), sobre o teto de largura anterior de 46% (`NPC_BASE_MAX_WIDTH_PCT`); a altura segue limitada pela zona de 1/3 da tela. ⚰️ `NPC_PORTRAIT_ZOOM` (1,4×) saiu em 07/10/2026 (o zoom era do avatar, não do NPC do mapa): o NPC tem o tamanho de antes e `NPC_BASE_UNDER_SHEET` (0,04 da altura da arte) é quanto da base entra sob a folha. Segue o `AVATAR_PORTRAIT_ZOOM` 1,3 nas miniaturas de avatar (`AvatarImg`, já recortadas em círculo).
**Exports:** `NPC_SCALE`, `NPC_BASE_MAX_WIDTH_PCT`, `NPC_MAX_WIDTH_PCT`, `NPC_BASE_UNDER_SHEET`, `AVATAR_PORTRAIT_ZOOM`, `AVATAR_PORTRAIT_ORIGIN`, `NpcFrame` (`zoom`, `underSheet`, `flushLeft`), `NPC_FRAME_OVERRIDES` (enquadramento por NPC, chave `areaId:lotId`, 01/11/2026, Hexsmith) e `npcFrameFor(areaId?, lotId?)` (devolve o override ou `undefined` = enquadramento padrão).
**Chamado por:** `src/components/nav/AreaSheet.tsx`, `src/components/ui/AvatarImg.tsx`.
**Régua:** `src/components/nav/areaShell.render.test.tsx`.

### `src/components/nav/sheetKit.ts`
**Dono de:** o CARD de dentro de uma folha de lote (01/10/2026, I1/I2 da navegação do dono) — toda opção escolhível dentro de uma folha (jogo do Salão/Ateliê/Refúgio, proposta e região de Travessia) é um bloco com fundo `surface-2`, traço `line`, raio `radius-md` e respiro `space-3` entre vizinhos, nunca uma linha com filete. Só tokens existentes (`04-IDENTIDADE-VISUAL.md` §4).
**Exports:** `sheetCard`, `sheetCardList`, `sheetCardTitle`.
**Chamado por:** `src/components/play/PlaySheets.tsx`, `src/components/play/PasseioSheet.tsx`.
**Régua:** `src/components/play/playArea.render.test.tsx`.

### `src/components/arena/DueloSheet.tsx`
**§489 (18/11/2026):** os cards de escolha usam a linha compartilhada `ui/EscolhaLinha` (1º elemento no mini-visor 64, nome no título, demais ícones embaixo, "Lutar") e o sorteio usa `SortearNovos`; regras, custo e `data-arena-*` intactos.
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `ARENA_CHOICES` desafios (4 desde §370; coluna única), estoque de convites de Duelo (`invites { count, max, perEnergy, canExchange, onExchange, onBegin }`: 1 convite por run, 1 energia = 5, 7 na conta paga, estoque 0–7, §458) com o papiro `conviteDueloArt`; `playerDayIso`/`arenaRuns` (semente dos cards e rerolls grátis); linha calma do teto de Bits da categoria (§456) e da multiplicação do último adversário (§384); falha da carga do bestiário tem aviso.
**Dono de:** a folha do lote **Arena livre** (id `duelo`) da Arena (minimal-ui F5, 24/09/2026) — o poder, a escolha entre `ARENA_CHOICES` adversários (4 desde 14/11/2026, §370; eram 3) e o botão que abre a `ArenaGame` em tela cheia. **Beta-2 (9.3 + 11.3, 13/10/2026):** a Arena livre ganhou o próprio bloco no mapa (o Torneio fica no outro tablado) e o ELEMENTO e os GOLPES do Soulmon saíram daqui — moram no Perfil (`components/perfil/SoulmonPerfil.tsx`), pela mesma fonte (`fighterIdentity`). Não decide nada da luta: rodadas (`ARENA_ROUNDS`), balanceamento e recompensa (Bits) continuam na `ArenaGame`.
**Props principais:** `language`, `evolutionStage`, `onStart` (⚰️ `skills?` e `petElement?` saíram em 13/10/2026: a folha não lê mais a ficha).
**Exports:** `DueloSheet(props)`.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy, dentro do `AreaSheet` da Arena).
**Régua:** `src/components/arena/arenaSheets.render.test.tsx`.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** props `runs?` (`ArenaReroll`: runs do dia — cada run terminada re-sorteia os cards de graça, `arenaCards(..., runsDone)`) e `ladder?` (escada Rookie > Champion > Ultimate, §222): `arenaFoesOfSeed(seed, ARENA_ROUNDS, ladder)` e o selo "Desgarrado" vem de `arenaRunIsStray`.

### `src/components/arena/GuerraClaSheet.tsx` — ⚰️ apagado

⚰️ **Apagado em `99881459d` (19/10/2026).** Era a folha do lote Guerra de Clãs da Arena (NPC + parágrafo que mandava ao Salão do Clã); o `AreaView` não a monta mais. A guerra 4×4 vive no servidor (`functions/api/_guerra.js`).

### `src/components/mercado/MercadoSheets.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `CambistaSheet` ganha `onRecoverPendingBits` (reenvia os pacotes de Bits pendentes ao abrir, §386) e `onGetCredits` (atalho para a compra de Créditos quando falta saldo); os pacotes de Bits são `BITS_PACKS` (3 pacotes, teto 1.000/dia no servidor, §373).
**Dono de:** o conteúdo das 4 lojinhas do Mercado (minimal-ui F5, 24/09/2026; mock `product/squad-minimal-ui/propostas/loja/mock.html`, citado no cabeçalho do arquivo — fora do repositório) — `MercadoStallSheet` (Itens / Decoração / Background, com abas POR MOEDA vindas de `STALL_CURRENCIES`; saldo sempre da moeda da aba; aba de Créditos = a troca Créditos → Bits + o convite passivo `UnlockNudge reason="shop"` só para `demo`) e `ConquistasSheet` (as missões de `utils/missions.ts` filtradas por `category`, sem moeda nenhuma; sem "0/N" sem progresso — WP4.12). Substitui a `ShopModal` (⚰️ 24/09/2026). **Honra (30/09/2026, `docs/REGISTRO-DE-DECISOES.md` §17):** o rótulo da moeda `emblems` na aba e na linha de status é "Honra"/"Honor" (⚰️ "Emblemas"/"Emblems", que reverteu a D3 de 23/09/2026); só o RÓTULO mudou — o id `'emblems'`, o campo do save e `STALL_CURRENCIES` continuam.
**Props principais:** `MercadoStallProps` — `stall`, `language`, `points`/`emblems`/`credits`, posse (`ownedBackgrounds`, `equippedBackground`, `ownedFurniture`, `equippedDecor`, `missionProgress`), `onBuy`/`onEquip`/`onEquipFurniture`, `onExchangeCredits`, `accountTier?`, `onUnlock?`.
**Exports:** `MercadoStallSheet(props)`, `MercadoStallProps`, `ConquistasSheet(props)`, `CambistaSheet(props)` / `CambistaSheetProps` (`language`, `credits`, `onExchangeCredits`, `accountTier?`, `onUnlock?`, `unlockedElements?`, `essences?`, `onBuyEssence?`), `CambistaTab` (`bits` | `essences` | `other`), `CAMBISTA_TABS`. Desde a Guilda os segmentos Background e Decoração abrem com o `GuildOwnedShelf` ("Do bosque", só equipa) antes dos ~20 cenários da loja.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy, dentro do `AreaSheet` do Mercado).
**Régua:** `src/components/mercado/MercadoSheets.render.test.tsx`, `src/utils/mercadoCatalog.test.ts`, `src/components/ofertaDoisCanais.contract.test.ts`.

### `src/components/mercado/ShopShelf.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `discounts?: Record<id, {was, pct}>` (Feira de verdade: os `items` já trazem o preço FINAL; `data-shop-discount`); `CreditExchange` vira os 3 pacotes de Bits do Cambista (`data-bits-pack`, `onExchangeCredits(packId)`, `onRecoverPending`, `onGetCredits`, §373/§386).
**Dono de:** as peças da loja (canvas Loja, D-L1…D-L11), extraídas da `ShopModal` para servir o Mercado e a loja de Emblemas do Torneio — o card de item (mini-visor, estados por FORMA: travado, equipado, comprado, sem saldo em âmbar), o saldo de UMA moeda, a região `status`, a troca Créditos → Bits e a lista das missões da semana. Não decide compra: `onBuy` é o `handleShopBuy` do `App.tsx`; a prateleira descarta item de outra moeda (defesa das três moedas). Desde 30/09/2026 a unidade da moeda `emblems` aparece como "Honra"/"Honor" no preço, no `aria-label` do card e no resgate da missão ("Receber N de Honra"); ⚰️ "Emblemas"/"Emblems" (REGISTRO §17; o identificador `isEmblem` e o campo `mission.emblems` não mudaram).
**Exports:** `ShopShelf(props)`, `CurrencyBalance(props)`, `CreditExchange(props)`, `WeeklyMissionList(props)`, `ShopStatus(props)`, `useShopFlash()`, `Bits(props)`, `shopTagStyle`, `ShopFlash`, `ShopOwnership`, `ShopActions`.
- Também exporta `bgThumb`, `DecorRuleLine`, `PurchaseQuestion`, `PurchaseConfirmSheet` e `HowToEarnSheet` (confirmação de compra e "como ganhar", rodada 8).
**Chamado por:** `src/components/mercado/MercadoSheets.tsx`, `src/components/TournamentPage.tsx`; `src/components/nav/AreaView.tsx` importa só os tipos `ShopOwnership`/`ShopActions` (24/09/2026).
**Régua:** `src/components/mercado/MercadoSheets.render.test.tsx`, `src/components/arena/arenaSheets.render.test.tsx`, `src/utils/weeklyMissions.fiacao.test.ts`.

### `src/components/mercado/EssenceBuySheet.tsx`
**Dono de:** a confirmação de compra de essência do Cambista com SELETOR DE QUANTIDADE (§479): imagem grande, nome, custo unitário, "Você tem N" (só aqui; a lista não mostra posse), − / número (`role="spinbutton"`) / +, custo total ao vivo e "Comprar N · custo". O máximo vem de `essenceMaxBuy` (teto por compra, teto de estoque e saldo); com máximo 0 o botão desabilita com o motivo.

**Exports:** `EssenceBuySheet`.

**Régua:** `src/components/mercado/MercadoSheets.render.test.tsx`, `src/utils/essenceShop.test.ts`.

### `src/components/mercado/ShopItemSheet.tsx`
**Dono de:** a FOLHA DO ITEM da lojinha (I5/I6, 02/10/2026): tocar num item abre um bottom sheet com as opções (Comprar / Equipar / Tirar) e um PREVIEW GRANDE — o ícone do item solto, SEM o quadradinho de vidro, centrado na área escurecida acima da folha (portal em `document.body`, decorativo); para cenário a miniatura abre o LIGHTBOX (fundo escurecido, arte grande, ✕ no topo esquerdo, fecha ao tocar fora). A compra real continua na `PurchaseConfirmSheet`. Também dono da pílula Interno/Externo/Qualquer da decoração.
**Props principais:** `item`, `language`, `currency`, `balance`, `owned`, `equipped`, `onClose`, `onBuy`, `onEquip`, `bitsPrice`, `emblemPrice` (render props do preço).
**Exports:** `ShopItemSheet`, `BackgroundLightbox`, `DecorFitTag`.
**Depende de:** `ModalSheet` (`form/FormKit`), `useDialogA11y`, `utils/decorRules.ts` › `decorFitLabel`.
**Chamado por:** `src/components/mercado/ShopShelf.tsx` (`DecorFitTag` também no card da peça).
**Régua:** `src/components/mercado/ShopItemSheet.render.test.tsx`.

### `src/components/nav/AreaView.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props/fiações novas: `arena.invites` (convites de Duelo), marcação do hábito de foco adotado ao concluir a sessão (`habit:<id>`), Prioridades (ICE) por tarefa, criar tarefa a partir do modal de escolha do foco, `dungeonKeyExpiresAt` (chave 48 h, §299), atividade rodando agora (portão da carta "Elemento novo"), atalho e reenvio do Cambista (§386), concluir o Passeio na hora, `RiftMap` em tela cheia (§462) e a pergunta "Acordar" do Soulmon dormindo (`SLEEP_BLOCKED_LOTS`, §329).
**Dono de:** UMA área do Mapa inteira (minimal-ui F5, 24/09/2026) — a `AreaScene`, o lote aberto (`AreaSheet`, estado LOCAL; o `App` monta com `key` da view, então trocar de área fecha a folha) e o conteúdo: no Mercado as 4 lojinhas (fundo, arte dos lotes e os vendedores de `STALL_NPC_ART`), na Arena o Torneio (`TournamentPage` com a loja de Emblemas) e o Duelo (`DueloSheet` → `ArenaGame` em tela cheia); na Exploração a Masmorra e a Corrida com obstáculos (⚰️ "Corrida do Dino"; o id de jogo `dino` não mudou), em Jogos o Pedra, papel e tesoura (folhas-porta de `play/PlaySheets.tsx` → `DungeonGame`/`DinoGame`/`RPSGame` em tela cheia, com os handlers de `play`); no Laboratório a folha com as abas Evolução/Soulmon/Stats (`labContent`, montado no `App`) e no Hall a Biblioteca (`hallContent`, `LibraryPage` `embedded`). Consolidado das PRs #117 e #118. Entra por `lazy()` no `App` para ficar fora do chunk de entrada (orçamento de bytes, decisão #31). Não decide regra: compra, troca, partida e luta chegam prontas por props.
**Props principais:** `AreaViewProps` — `area`, `language`, `ownership`/`actions` (os mesmos para Mercado e Torneio), `points`/`emblems`/`credits`, `onExchangeCredits`, `accountTier?`/`onUnlock?`, `tournament` (as props do `TournamentPage` menos `shop`), `evolutionStage`, `demoCharacterId?`, `skills?`, `onEarnPoints`, `play: PlayHandlers` (masmorra/dino/sumidouro de Bits), `labTab`, `labContent`, `hallContent`, `onLayerChange?` (29/09/2026: avisa o `App` quando há camada de tela cheia — folha, jogo ou duelo; o `App` guarda em `areaLayerOpen` e passa `covered` ao `AreaTopBar`; o cleanup do efeito avisa `false`), `passeio?` (desde `3532ccf5`: `{ crossings, onChange(f) }` — o estado `GameState.crossings` e o ÚNICO caminho de escrita, uma função pura de `utils/travessias` aplicada sobre `prev` no `App`; o lote `passeio` da Exploração abre `PasseioSheet` lazy, com `CROSSINGS_EMPTY` na falta da prop).

**#187 (28/10/2026, REGISTRO #187):** o `AreaView` desenha 7 áreas (`forja` entra no mesmo ramo de Exploração/Jogos). Props novas: `initialSection` (`'arquivo'` no Perfil, 'amigos' no Salão do Clã — atalhos de `BUILDING_HOME`). Dentro dele, `SectionTabs` (privado) desenha as abas Perfil | Arquivo (lote `perfil`, via `onLabTab('pet')`) e Clã | Amigos (lote `guilda`, a `LibraryPage` `friends`); entrar numa seção conta a visita do prédio `laboratorio.pet`/`laboratorio.amigos`. A Fenda Sem Fim (`exploracao.fenda`) abre direto a descida quando `naMasmorra`.
**Delta `bcfe7ca6..e3d55bb8` (01/10/2026, fundos-v2):** a cena do Laboratório e a do Hall passam `background={LABORATORIO_BG}` e `background={HALL_BG}` (de `assets/soulmon/areas`) à `AreaScene`; as outras continuam com `AREA_BG`/`PLAY_AREA_BG`.
**Exports:** `AreaView(props)`, `AreaViewProps`, `PlayHandlers`, `LabTab`, **`PlayGame`** (novo como export: `'masmorra' | SalaoGame | MenteGame | RefugioGame`, os tipos de `play/PlaySheets`; ⚰️ era `'masmorra' | 'dino' | 'ppt'` e não exportado). **Delta `ae366480..5edfcfba` (30/09/2026, os três prédios de Jogos):** os lotes de Jogos abrem `SalaoSheet`/`MenteSheet`/`RefugioSheet` (lazy; ⚰️ `DinoSheet`/`PptSheet` não são mais lazy-importados aqui — entram dentro do `SalaoSheet`); a folha da Masmorra recebe `bitsToday`; `MenteSheet` recebe `reviewDue = dueCards(review, todayKey).length`. `PlayHandlers` ganhou `todayKey?` (dia do JOGADOR; sem ele cai no dia UTC do aparelho), `review?`/`onReviewChange?` (os cartões da Revisão, que moram em `GameState.review`; sem eles, `REVIEW_EMPTY`) e `minigameBitsToday?`. `AreaViewProps` ganhou `initialGame?: PlayGame` e `onInitialGameConsumed?` — abre um jogo direto ao montar (o convite ao Refúgio abre `respiracao`), one-shot: o `useState` do jogo nasce de `props.initialGame` e um efeito de montagem chama `onInitialGameConsumed`. Jogos em tela cheia novos, lazy: `EcoGame`, `BolhasGame` (`mode="foco"` paga; `"calma"`, id `bolhas-calmas`, NÃO recebe `onEarnPoints`), `TrocaGame`, `PicrossGame` (`todayKey`), `RevisaoGame` (`todayKey`/`review`/`onReviewChange`) e `RespiracaoGame` (sem `onEarnPoints`: "não pagam, não pontuam"); todos recebem um `base` comum (`evolutionStage`, `demoCharacterId`, `language`, `onExit`). A prop `guild` mudou de forma com a Guilda completa: `{ saveId, metaDoDiaCumprida, playerDayTz?, fioGoal?, mySprite?, onClaimed?, onScenes?, accountTier?, onUnlock?, onLogin? }` — o **Hall** abre o `GuildSheet room="salao"` (lote `guilda`) e a **Arena** abre `room="feira"` (lote `feira`, no lugar do antigo `guilda` da Arena; `GUILDA_LOT_ART` deixou de ser usado ali).
**Chamado por:** `src/App.tsx` (lazy).
**Régua:** `src/components/nav/areaShell.render.test.tsx` (o molde), `src/components/mercado/MercadoSheets.render.test.tsx`, `src/components/arena/arenaSheets.render.test.tsx`, `src/components/play/playArea.render.test.tsx`, `src/components/nav/areaLabHall.render.test.tsx`.

### `src/components/guild/BossCheerPrelude.tsx`
**Dono de:** a torcida do Chefe da Feira (dono, 30/10/2026): tela antes do golpe (cena parada, mascote, barra), até 30 s ou "Go!"; os toques vão em baldes de 3 s para `guildFeiraAttack`, e o servidor (`simularAtaque`) os aplica de forma determinística — sem toques, resultado idêntico ao de antes.
**Exports:** `BOSS_CHEER_SECONDS`, `BOSS_CHEER_BUCKETS`, `addBossTap(taps, elapsedMs)`, `BossCheerPrelude({ language, bossId, level, poolPct, me, busy, onGo })`.

### `src/components/guild/BossFightScreen.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o tick de DoT entra em cena no começo do golpe que vem logo depois (`sceneTimeOf`, §334).
**Dono de:** a luta contra o chefe da Feira (`PLANO-FEIRA-CHEFE.md` §3, F-08/F-09), só apresentação: toca o replay que o servidor validou (eventos no formato de `fightSteps`, lado 0 = jogador, lado 1 = chefe) na `BattleStage` em modo `boss` e, ao fim (ou ao pular), mostra o `ResultScreen` com `kind="boss"`. Só AGREGADO: a barra é o pool do clã (`poolPctBefore` → `poolPctAfter`, interpolado pelos golpes do jogador) e a única cifra é o dano do próprio jogador (`myDamage`); nada por membro. O chefe "foge" (`<nome> fled, for now` / `<nome> fugiu por ora`) ou, no abate, "O caminho abriu"; recompensa (`rewards.sap`, `rewards.emblems`) só aparece quando dada. Arte: `bossArt(id, 'corpo-inteiro') ?? bossArt(id)` (o Arauto tem corpo inteiro). Sem torcida (o replay é do servidor; nada que o jogador toque muda o resultado) e sem som novo.
**Exports:** `BossFightScreen(props)`, `BossFightScreenProps`, `BossFightMe`.
**Props principais:** `{ language, bossId, level, poolPctBefore, poolPctAfter, myDamage, events, me: { sprite, name, element, scale?, maxHp? }, meStrike?, rewards?, onDone, skipReplay? }`.
**Depende de:** `games/BattleStage` (prop `boss`, `stageLayout(w, h, n, boss)`), `games/ResultScreen` (`kind`, `pool`), `data/bossRoster` (`BOSS_ROSTER`, `bossArt`, `bossText`), `utils/combate/fight` (`FightEvent`).
**Régua:** `src/components/guild/BossFightScreen.render.test.tsx`, `src/components/games/BattleStage.layout.test.ts`.

### `src/components/guild/FeiraEventoSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `start`/`done` do desafio levam `k` (índice do encontro); `doneRow` ganha `clanBits`; quando o servidor diz que o golpe de hoje já saiu (ou o chefe caiu), a sala não oferece atacar de novo.
**Dono de:** a folha do evento da Feira do Chefe (`PLANO-FEIRA-CHEFE.md` §3–§5, F-09/F-10): o que o clã encontra quando o Solmon VOLTA da Missão. Chefe (`boss`): "Atacar" 1×/dia → `attackGuildFeira` → `BossFightScreen` com o registro do servidor mapeado por `mapFeiraLog`; já bateu hoje / chefe caído / sem rede viram frases calmas. Desafio (`trail`): `startGuildFeiraTrail` → `FeiraTrailPlay` com a instância do servidor → ESPERA o piso de tempo do jogo (`FEIRA_TRAIL_MIN_MS`) → `doneGuildFeiraTrail` → `ResultScreen` com +1 Emblema e +3 seiva; 400/409/429/offline calmos; a porta (`gate`) só informa. Descanso (`rest`): com `claimable`, "Colher" via `claimGuildFeira`, creditando UMA vez por recibo (`creditFeiraOnce`). Chamada e crédito injetáveis (`api`, `onCredit`). Mudo; só agregado do clã.
**Exports:** `FeiraEventoSheet(props)` (e default), `FeiraEventoSheetProps`, `FeiraApi`.
**Props principais:** `{ language, saveId, tz?, evento, me, onClose, onCredit, onEvento?, api?, skipReplay? }`.
**Depende de:** `BossFightScreen`, `FeiraTrailPlay`, `games/ResultScreen`, `form/FormKit` (`ModalSheet`), `utils/community` (wrappers `*GuildFeira*`), `utils/feira`, `utils/feiraCopy`, `utils/feiraCredit`, `data/bossRoster`.
**Chamado por:** `src/App.tsx` (item `feiraEvento` da fila central, lazy) e `src/components/guild/GuildSheet.tsx` (reabrir pela sala da Feira, lazy).
**Régua:** `src/components/guild/FeiraEventoSheet.render.test.tsx`, `GuildSheet.feira.chefe.render.test.tsx`.

### `src/components/guild/FeiraTrailPlay.tsx`
**Dono de:** o desenho do Desafio da Feira (F-10): recebe a INSTÂNCIA do servidor (zip, colcha, picross, troca ou eco) e devolve a solução no formato de `guildFeiraTrailDone`. ⚠️ Renderizadores MÍNIMOS, não os minijogos de `components/mente/` (que misturam tela com ciclo de jogo, Bits, ranking e tutorial): a REGRA de cada um é reaproveitada de `utils/mente/*` (`canStep`/`validateZip`, `placeRect`/`rectBetween`/`validatePatches`, `matchesClues`, `sideFor`, `checkTap`/`seededRng` do Eco); só a casca de tela é nova (toque simples, sem arrastar, sem som).
**Exports:** `FeiraTrailPlay(props)`, `FeiraTrailPlayProps`, `trocaGabarito`.
**Props principais:** `{ language, trail, onSubmit, busy? }`.
**Depende de:** `utils/mente/{zip,patches,picross,troca,eco}`, `utils/feira`, `utils/feiraCopy`, `form/FormKit`.
**Chamado por:** `FeiraEventoSheet.tsx`.
**Régua:** `FeiraEventoSheet.render.test.tsx` (um caso por jogo).

### `src/components/guild/FeiraMisterio.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `feito = false`: o desafio do dia já resolvido não é mais oferecido (§461).
**Dono de:** o bloco do mistério na sala da Feira: nome e nível do chefe, a barra agregada do que resta dele (`role="meter"`), as marcas da trilha / o dia calmo, e o botão que reabre a folha do evento. Só AGREGADO do clã (LV-G1/G10). Mora em arquivo próprio porque a régua da sala proíbe barra de HP no fenômeno semanal dentro do `GuildSheet.tsx`.
**Exports:** `FeiraMisterio(props)`.
**Props principais:** `{ language, resumo: FeiraResumo, ocupado, onAbrir }`.
**Depende de:** `data/bossRoster`, `utils/feiraCopy`, `utils/feira` (tipo).
**Chamado por:** `GuildSheet.tsx` (sala `feira`, só quando a vista traz `feira` e o App passa a ponte).
**Régua:** `GuildSheet.feira.chefe.render.test.tsx`.

### `src/components/guild/FeiraVisor.tsx`
**Dono de:** o visor da Feira (`PLANO-GUILDA.md` §9, WPG-10) — o fenômeno da semana em três estados (aberto, ferido, dissipado) e quatro tipos. ⚰️ **Era PLACEHOLDER** até a rodada 3 (30/09/2026): agora a arte real de `utils/fairArt.ts` é lida por TIPO × ESTADO — `FAIR_ART[fairFenomenoId(raid.phenomenon, state)]` (12 ids `fair-fenomeno-<tipo>-<estado>`, `<img data-fair-fenomeno>`) — e o FX do tipo (`fairFxId`) é um motivo 128² desenhado a 64 px nos dois cantos de cima (o da direita espelhado, `data-fair-fx`), nunca um véu sobre o fenômeno; o fundo é `VISOR_ART.visorFeira` (leva `visores`, 01/10/2026, 696×352 a 0,5×) sobre o degradê antigo. O SVG na paleta do Visor (petróleo, turquesa, cobre, osso: lajes + `Fx`) ficou só como FALLBACK para id sem arte. Sem rosto, olho, boca, barra de HP, número ou letra: o fenômeno é tempo da Malha, nunca inimigo; nenhum estado se lê como "quanto EU bati" (o servidor só entrega `ferido: boolean`). Movimento reduzido deixa o FX parado.
**Props principais:** `{ raid: GuildRaid, label, reducedMotion }`.
**Depende de:** `src/utils/fairArt.ts` (`FAIR_ART`, `fairFenomenoId`, `fairFxId`, `fairStateOf`), `src/utils/visorScenes.ts` (`VISOR_ART`).
**Exports:** `FeiraVisor(props)`, `FEIRA_VISOR_HEIGHT` (176).
**Chamado por:** `src/components/guild/GuildSheet.tsx` (sala `feira`).
**Régua:** `src/components/guild/GuildSheet.feira.render.test.tsx`, `guildFeiraFiacao.contract.test.ts`.

### `src/components/guild/GroveMilestoneCeremony.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o botão final é `CtaButton`.
**Dono de:** a cerimônia do marco do Bosque — irmã da `MilestoneCeremony` do hábito, com as mesmas regras caras: **espera o gesto** (um botão, sem auto-fechar), a DATA como saída relacional, z-index **300** (acima da fila de intersticiais, 200), movimento reduzido reduz o MOVIMENTO e nunca a pausa. Saídas: o botão, o **Escape** e o voltar do sistema (`useBackLayer`); o véu NÃO fecha ao toque. Frase do MUNDO manda, fala do pet embaixo em voz mais baixa; sem "parabéns", sem número. O vidro mostra o cenário do estágio novo com a criatura de quem olha — desde 30/09/2026 a arte pintada de `PET_BACKGROUNDS` (`bg.css` com `center bottom / auto 100% no-repeat`, `image-rendering: pixelated`, cor de reserva `bg.baseColor`).
**Props principais:** `stage` (`GroveMarcoStage`), `spriteUrl`, `dateLabel`, `sceneGranted`, `language`, `onDone`.
**Exports:** `GroveMilestoneCeremony(props)` (nomeado e default).
**Chamado por:** `src/App.tsx` (intersticial `groveMilestone`, depois de relatório e check-in e antes do sonho).
**Régua:** `src/components/guild/GroveMilestoneCeremony.render.test.tsx`, `src/components/filaDeAvisos.contract.test.ts` (posição na fila).

### `src/components/guild/GroveCasaArvore.tsx`
**Dono de:** a árvore do clã (seiva Fagulha..Aurora) mostrada no Bosque: nome do estágio, linha, "perto" binário e InfoTip da regra, a partir da MESMA vista `guild.casa` e das mesmas chaves `guild.casa.*` da Casa. Só texto (não há arte da árvore da casa).
**Props principais:** `language`, `casa` (`NonNullable<GuildView['casa']>`).
**Exports:** `GroveCasaArvore(props)`.
**Chamado por:** `guild/GuildSheet.tsx` (sala `grove`).
**Régua:** `guild/GuildSheet.groveCuidado.render.test.tsx`.

### `src/components/guild/GroveCena.tsx`
**Dono de:** a CENA do Bosque na ficha do Clã (D-49/D-55/D-56, 19/10/2026) — a janela do cenário ÚNICO do Bosque: o recorte do panorama pintado (`assets/bosque`) com os membros andando (`GroveWalkers`) e, no canto, a fileirinha de arte dos itens que os membros puseram na casa (sem nome nem número). Substitui o antigo `CasaVisor.tsx` (⚰️ SVG vetorial de cobre/turquesa com cristal em losango; o dono não sabia o que era).
**Props principais:** `language`, `guild: Pick<GuildView, 'members' | 'casa'>`, `mySprite`, `reducedMotion`.
**Exports:** `GroveCena(props)`, `SPRITE_CENA` (`{ own: 52, other: 40 }`).
**Chamado por:** `guild/GuildSheet.tsx` (`SalaBosque`).
**Régua:** `guild/GroveWalkers.render.test.tsx`, `guild/GuildSheet.casa.render.test.tsx` (bloco D-55/D-56/D-57).

### `src/components/guild/GroveWalkers.tsx`
**Dono de:** a camada de membros ANDANDO no Bosque (D-51..D-53), compartilhada pelo panorama (`GroveVisor`) e pela cena do Clã (`GroveCena`). Até 12 sprites (`GUILD_MAX_MEMBERS`), animação só em CSS (`sm2-grove-walk` + `sm2-grove-flip`, sem JS por frame), contorno por `drop-shadow` (o seu na cor primária), bounce do `sm2-grove-bob`; balão de frase FIXA (EN+PT, `guild.bosque.fala.*`, 20–45 s entre balões, sem IA); tocar = reação visual + nome (sem número), sem som. Movimento reduzido: ninguém anda nem bate.
**Props principais:** `language`, `guild: Pick<GuildView, 'members'>`, `mySprite`, `reducedMotion`, `sizes`, `baseY`, `faixa?`.
**Exports:** `GroveWalkers(props)`.
**Chamado por:** `guild/GroveVisor.tsx`, `guild/GroveCena.tsx`.
**Régua:** `guild/GroveWalkers.render.test.tsx`, `utils/groveWalkers.test.ts`.

### `src/components/guild/GuerraVisor.tsx`
**Dono de:** o visor da GUERRA de guilda (PR4): o esquadrão da roda (até 4) de um lado e, do outro, silhuetas pálidas do esquadrão rival (a mesma quantidade) sobre o cenário `bg-arena-spotlight`. Os rivais são só silhueta de propósito: o servidor nunca manda estágio, linha nem nome de pessoa de outra guilda (LV-G10).
**Exports:** `GuerraVisor(props)`, `GUERRA_VISOR_HEIGHT` (176).
**Chamado por:** `guild/GuildSheet.tsx` (`SalaGuerra`).
**Régua:** `guild/GuildSheet.casa.render.test.tsx` (bloco "a Guerra no Salão").

### `src/components/guild/GroveVisor.tsx`
**Dono de:** o panorama do Bosque (tela cheia, 18/10/2026) com as árvores por estação e, desde 19/10/2026 (D-51), os membros ANDANDO nele via `GroveWalkers` (todos, até 12; ⚰️ a regra "5–12 membros → só a sua"). Estágio, linha e fio ficam fora do vidro.
**Props principais:** `guild: Pick<GuildView, 'size' | 'members' | 'bosque'>`, `mySprite`, `reducedMotion`, `label?`.
**Exports:** `GroveVisor(props)`, `GROVE_VISOR_HEIGHT` (176).
**Chamado por:** `src/components/guild/GuildSheet.tsx`.
**Régua:** `src/utils/groveStage.test.ts` (a lógica), `src/components/guild/GuildSheet.render.test.tsx`.

### `src/components/guild/GuildSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `missao.onVerAchado` (reabre o que a volta achou, `utils/feiraVolta.ts`); botão "Convidar" abre `GuildInviteSheet` (§321); `GuildBuffs` substitui a Loja do clã (`GuildLoja` apagado); o saldo da doação é o inteiro (o Bit de Crédito também doa, §373); Guerra e Feira entram livres, BUSCAR guerra/RODADA do chefe/MANDAR perguntam com o Soulmon dormindo (§329); "Tentar de novo" só texto ao lado do CTA (§316c).
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

### `src/components/play/MinigameModeGate.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `tickets?` (leque `TicketFan` ao lado do NPC via `npcOverlay`).
**Dono de:** a porta de entrada dos minijogos (dono, 30/10/2026): o NPC do Salão de Jogos (busto + balão) mostra o botão "Ver ranking" (outline, acima dos botões de modo) que abre um MODAL com a tabela (`RankingPanel inline`; Corrida com obstáculos tem abas Comum | Avançado, Comum primeiro) e os botões de modo embaixo — Comum à esquerda, Avançado à direita; Fusão Elemental (`pveVsPvp`) usa PvE | PvP e inicia direto no modo (`Match3Game initialMode`, sem o seletor de dentro); jogo sem dificuldade mostra um botão "Jogar".
**Exports:** `GateRanking` (type), `MinigameModeGate({ language, gameName, rankings, saveId, withDifficulty, pveVsPvp?, onPick, … })`.
**§488 (18/11/2026):** prop `renderChoices?(level, pick)` — com ela os dois botões de modo viram SELETOR (rádio, como Ranqueada | Treino do Torneio, `data-especial-state="pressed"`) e a lista do modo aparece embaixo (`data-gate-choices`); "Lutar" chama `onPick(modo, escolha)`. Usado pela Fusão Elemental com `Match3Escolha`.

### `src/components/play/Match3Escolha.tsx`
**Dono de:** a LISTA DE 3 do Elemental Fusion (§488): Aventura = 3 ELEMENTOS (ícone + nome + "Lutar"; o time de 4 só aparece na partida), PvP = até 3 jogadores da rota `opponents` (sem demo, sem monstro, sem simulado local; boss decidido antes = só a linha "Boss"), "Sortear 3 novos" grátis 1× por visita. Estados: carregando, erro com "Tentar de novo", vazio, sem conta. **Exports:** `Match3Escolha({ language, mode, saveId?, playerLevel?, onFight })`. **Usa:** `ui/EscolhaLinha`, `utils/match3Escolha`. **Chamado por:** `nav/AreaView.tsx` (no `MinigameModeGate`) e `Match3Game.tsx` (o "De novo" volta à lista). **Régua:** `play/Match3Escolha.render.test.tsx`.

### `src/components/ui/EscolhaLinha.tsx`
**Dono de:** a linha "escolha 1 de N" extraída do Torneio (§488): mini-visor à esquerda, nome/detalhe, recompensa e botão de lutar (alvo 44 px, rótulo visível contido no nome acessível) — e o botão `SortearNovos`. **Exports:** `EscolhaLinha(props)`, `SortearNovos(props)`, `escolhaCardStyle`. **Chamado por:** `TournamentPage.tsx` (Ranqueada e Treino), `arena/DueloSheet.tsx` (Arena livre, §489) e `play/Match3Escolha.tsx`. `SortearNovos` aceita `ariaLabel` e rótulo em nó (a Arena põe o custo num `span`). Sem CSS novo (estilos inline com tokens do kit).

### `src/components/play/GameCard.tsx`
**Dono de:** a carta de jogo dentro da MOLDURA de card (`CardFrame`; arte ou placeholder procedural no vão, nome na placa, descrição opcional no pergaminho — o Salão passa só o título; selos fora do botão) e a grade de 2 colunas usadas pelas folhas `SalaoSheet`, `MenteSheet` e `RefugioSheet`. A arte é `src/assets/soulmon/cards/<id>.webp` (`docs/CARDS-JOGOS.md`).
**Exports:** `CARD_IDS`, `CardId`, `cardArt(id)`, `GameCard(props)`, `GameCardGrid(props)`.
**Chamado por:** `src/components/play/PlaySheets.tsx`.

### `src/components/play/PlaySheets.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `BitsHoje` ganha `extraCap` (Agulha de bússola, só a Fenda) e `category` (teto por categoria: minigames/explorar/arena); saiu `FunSessionLine`; sem ticket de minijogo abre `TicketBuyModal`; abre o `RiftMap`.
**Dono de:** as folhas-porta dos minijogos (minimal-ui F5; desde 30/09/2026 também as folhas dos três prédios de Jogos — Salão, Ateliê da Mente e Refúgio): `MasmorraSheet` (descida automática sem fim, dificuldade da semana (rótulo "Camada N"/"Layer N" desde 06/10/2026, ⚰️ "Nível N"/"Level N"), melhor placar, o que pode cair, "perder custa só a run"), `DinoSheet` (recorde e Bits no recorde; a seção se chama "Corrida com obstáculos"/"Obstacle Run" desde 30/09/2026, ⚰️ "Corrida do Dino"/"Dino Runner") e `PptSheet` (Bits por vitória, rodadas para vencer). Os números vêm das constantes dos donos (`DUNGEON_MILESTONE_FLOOR` de `utils/dungeonIdle.ts`/`clearBonus` da `DungeonGame`, `HEART_DROP_CHANCE` de `utils/dungeon.ts`, `MATCH_POINTS`/`WINS_NEEDED` do `RPSGame`) e os placares das mesmas chaves que os jogos gravam (`DUNGEON_BEST`, `DUNGEON_DIFFICULTY`, `DINO_BEST`). O CTA da Masmorra nunca fica desabilitado (sem gate de entrada).
**Exports:** `MasmorraSheet` (ganhou `bitsToday?`), `DinoSheet`, `PptSheet`, e — delta `ae366480..5edfcfba`, 30/09/2026 — `BitsHoje({ language, earned? })` (linha neutra "Bits de minijogo hoje: N de `MINIGAME_BITS_PER_DAY`", sem barra nem alerta; `null` se `earned` é `undefined`; cheia diz que os jogos seguem abertos e os Bits voltam amanhã), `SalaoSheet({ language, onStart(g: SalaoGame), bitsToday? })` (Dino + PPT reaproveitando `DinoSheet`/`PptSheet` sob um `BitsHoje`), `MenteSheet({ language, reviewDue, onStart(g: MenteGame), bitsToday? })` (cinco linhas `GameRow` — Eco do Pet, Bolhas do Sonho, Troca de Regra, Nonograma da Malha, Revisão da Malha; "até N Bits" vem de `ECO_MAX_BITS`/`BOLHAS_MAX_BITS`/`TROCA_MAX_BITS`/`PICROSS_MAX_BITS`, e a Revisão mostra "N para hoje" quando `reviewDue > 0`, senão `REVIEW_SESSION_BITS`), `RefugioSheet({ language, onStart(g: RefugioGame) })` (Respirar com o Soulmon e Bolhas calmas, sem Bits, e o `SupportNote` no rodapé) e os tipos `SalaoGame` (`'dino' | 'ppt'`), `MenteGame` (`'eco' | 'bolhas' | 'troca' | 'picross' | 'revisao'`) e `RefugioGame` (`'respiracao' | 'bolhas-calmas'`). `GameRow` é interno. A copy DESCREVE o que o jogo pede ("Pede: lembrar uma sequência"), nunca promete efeito cognitivo.
**Imports novos:** as constantes de Bits dos donos `utils/mente/*` (`ECO_MAX_BITS`, `BOLHAS_MAX_BITS`, `TROCA_MAX_BITS`, `PICROSS_MAX_BITS`, `REVIEW_SESSION_BITS`), `MINIGAME_BITS_PER_DAY` de `utils/currencies` e `refugio/SupportNote`.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy).
**Régua:** `src/components/play/playArea.render.test.tsx`.

### `src/components/nav/StrollQuestLine.tsx` (08/10/2026)
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `strollEntries` ganha `onDone` (concluir o passeio escolhido direto da linha, §413).
**Dono de:** a LINHA "Take a stroll" / "Faça um passeio" do menu de Missões (`MissionsSheet kind="daily"`): `point` ("!", só texto) · `ready` ("?" + Claim/Resgatar) · `claimed`. Não monta `PasseioSheet`, sem timer. **Export:** `strollEntries({ language, crossings, todayKey, onClaim, onGo })` (desde 20/10/2026 o cartão entra no `DailyMissionBoard`). O Claim chama `claimStroll` (`utils/travessiasSave.ts`), que só grava o recibo `crossings.claimDay`.
**Régua:** `src/components/nav/missionsMenu.render.test.tsx`, `src/utils/travessias.test.ts`.

### `src/components/play/PasseioSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o Passeio conclui na hora, sem timer: saiu `formatEspera`/`strollWaitMs`; a frase é "O Soulmon já foi a X e voltou com a novidade"; cria a "Tarefa criada".
**Desde 08/10/2026** montada SÓ pela folha do lote Passeio (`AreaView` › prop `passeio`); o menu de Missões não a monta mais. O botão do card é "Done · mm:ss" (desabilitado nos 30 min) → "Done" → "Done today".
**Dono de:** a folha do Passeio na Exploração (30/09/2026): para onde o Soulmon vai hoje (postais das regiões abertas, casa inclusa) e, se não escondida, as Travessias — a ativa (texto pleno + versão pequena, "Fiz" / "Recuar"; ⚰️ "Trocar" entre os mesmos 3 e o modal das 21 saíram em 04/10/2026), os "Fiz" guardados ("abre no passeio da próxima noite", sem contagem) e, sem ativa, as regiões em névoa (tocar mostra as 3 propostas). Linha de segurança discreta (parecer 04 R-9) e o link "Esconder/Mostrar Travessias". Nunca mostra número de regiões, total, percentual, prazo, prêmio nem a palavra "desafio"/"challenge". Muda, sem push nem badge (R-NOVA). Nenhuma regra nasce aqui: cada toque entrega ao `App` uma função pura de `utils/travessias`.
**Exports:** `PasseioSheet({ language, crossings, onChange(f), todayKey? })`. Redesenhada em 02/10/2026 (F1–F5): a tela mostra só a Travessia em uso (card com postal da região, glifo da área, título, ato, linha "No mapa" vinda de `crossingYield`, estado de hoje), com "Fiz" (uma vez por dia, `markDone(c, dia)`), "Ver todas e trocar" (abre `ModalSheet` com as 21) e "Recuar" (`dropCrossing`); ⚰️ "Deixar pra lá" e a lista de regiões em névoa na tela principal.
**Missões do dia (04/10/2026):** props novas `seed?` (id do save); sem escolha mostra as 3 de `dailyOffer(dia, seed)` (cards fechados, "Escolher esta" → `pickMission`) com o "!" (`MissionMark`); escolhida vira o card com "?"; depois do "Fiz" diz para onde o Soulmon viaja; `data-marcos` ("Marcos de Aventura · N", só com N ≥ 1) com `InfoTip`. Explicações atrás de `InfoTip`.
**Imports novos:** `dailyOffer`/`pickMission`/`doneToday`/`crossingYield` de `utils/travessias`, `InfoTip`, `MissionMark`.
**Achado de ontem (15/10/2026, REGISTRO §66):** prop `achado?` (`PasseioAchado` = `adventure`/`isNew`/`stroll`); com ela a folha abre com a seção `data-passeio-achado` ("Da aventura de ontem") desenhada pelo `StrollFind` — o mesmo achado do resumo do dia, no contexto do passeio. O `App` só a entrega enquanto o relatório é recente (≤ 2 dias).

### `src/components/play/OficinaPlano.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** a matriz de Eisenhower saiu (`QUADRANTS`, `setQuadrant`, `matrixOrder`); a etapa é Prioridades (`OficinaPrioridades`, ICE); box da sessão só com a tarefa escolhida.
**Dono de:** o planejamento da sessão da Oficina em ETAPAS (10/10/2026): preparar → ritmo/ambiente → regra dos 2 minutos (picker tocável, até 5) → **Prioridades** (ICE, §313: monta `OficinaPrioridades`; era a Matriz de Eisenhower) → sapo (um só) → se-então (com sugestões) → brain dump (tempo 3/5/10 min por timestamp) → lista organizada. Cada etapa tem "Pular" (avança sem apagar nada). Só desenha e coleta; a regra é de `utils/focoSessao`. **Exports:** `OficinaPlano({ language, tasks, initial, onSave, onCancel, only?, onSetIce?, onCompleteTask? })` (`onSetIce` grava/limpa `Task.ice`; `only.onKey` recebe também `classified`). Não conclui nem reordena tarefa do jogo. Barra de etapas = classe `sm-oficina-bar` (reduced-motion no bloco canônico).
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** continua vivo, mas não é mais montado pela folha apagada ⚰️ `OficinaSheet`: o `FocusBoard` o usa em modo `only` (uma técnica/chave por card).

### `src/components/play/OficinaPrioridades.tsx`
**Dono de:** a etapa/card **Prioridades** (12/11/2026, REGISTRO §313; substitui a Matriz de Eisenhower): `OficinaPrioridades({ language, tasks, onSetIce?, onComplete? })` lista TODAS as tarefas abertas (hábito fica de fora), ordenadas por `sortByIce` (maior pontuação no topo; sem nota no fim com o chip «Classificar»); cada linha tem o ✓ (conclui pela origem), o nome, a pontuação em destaque discreto e os 4 valores em chips curtos. Tocar na linha abre `IceSheet` — um `ModalSheet` (modalDepth/Voltar) com 4 seletores 1–5 (`role=radiogroup`, alvo ≥ 48 px, legenda do 1 e do 5 em `ICE_COPY`), a pontuação ao vivo e «Salvar»/«Tirar a classificação». Só desenha e coleta; a conta é de `utils/iceScore`. Não muda a ordem da Home. **Régua:** `OficinaPrioridades.render.test.tsx`.

### `src/components/play/OficinaTags.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** perdeu os rótulos da matriz de Eisenhower.
**Dono de:** as etiquetas (2 min / Sapo / Fazer / Agendar / Delegar) da lista da Oficina — arquivo à parte para a folha e o planejamento compartilharem sem circularidade. **Exports:** `TagChips`, `TAG_LABEL`.

### `src/components/play/OficinaSheet.tsx` — ⚰️ apagado
⚰️ A folha antiga da Oficina (timer 25/5 e 50/10 + cards das técnicas) foi apagada em `5b3c6105b` (08/11/2026, REGISTRO §247, "remove Oficina antiga"), junto de `PrepararFocoSheet.tsx` e dos testes `OficinaCaderno`/`OficinaOrigem`/`PrepararFoco.salvar`. Quem a substitui é o quadro `play/FocusBoard.tsx` (card Sessão + 6 cards de chave) e a jornada em tela cheia `play/JourneyScreen.tsx`; o planejamento segue em `OficinaPlano.tsx` (agora em modo `only`, uma técnica por card). `onCompleteTask`/`onFocusReward`/`onPlanReward` já não existem.

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

### `src/components/nav/AvisosLink.tsx`
**Dono de:** o botão de AVISOS da Home (beta-2, F3 do crítico de design, 13/10/2026) — mais um botão fixo da pilha do canto direito, logo abaixo das missões, com um SELO (ponto dourado, sem número). Os avisos do dia deixaram a faixa acima de "HOJE" (altura zero, com ou sem aviso) e moram na folha `AvisosSheet`. Some quando não há aviso.
**Props principais:** `count` (0 = some), `label`, `countLabel` (o nome falado com a contagem), `row` (linha da pilha), `onClick`.
**Exports:** `AvisosLink(props)`.
**Chamado por:** `src/App.tsx` (só com `currentView === 'home'`).
**Régua:** `src/components/nav/avisos.render.test.tsx`.

### `src/components/nav/AvisosSheet.tsx`
**Dono de:** a folha (`ModalSheet`) dos avisos do dia, na ordem da fila de prioridade da Home (a fila não mudou, só o lugar onde é lida); o check-in da janela entra por ela. Fecha sozinha quando o último aviso some.
**Props principais:** `open`, `language`, `items` (`{ key, node }[]`), `onClose`.
**Exports:** `AvisosSheet(props)`.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/components/nav/avisos.render.test.tsx`.

### `src/components/nav/HomeFeedbackButton.tsx`
**Dono de:** o botão só-ícone abaixo do avatar da Home (`mailto:` para a caixa de revisão).
**Props principais:** `language`.
**Exports:** `HomeFeedbackButton(props)`.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/components/nav/missaoMapaFeedback.render.test.tsx`.

### `src/components/nav/MissionsLink.tsx`
**Dono de:** o ícone de Missões da Home (rodada 7, M8, 04/10/2026) — botão fixo no canto superior direito, abaixo do `CornerLink` do Mapa e, desde o §246, abaixo do ícone de carta (linha 2), no mesmo anel. Glifo de quest: "!" com missão disponível, "?" com missão pronta (vence o "!"), "?" esmaecido sem pendência. Parado, sem número e sem som.
**Props principais:** `kind` (`daily`|`weekly`, um ícone por acesso), `row` (linha da pilha), `mark: QuestMark` (de `questMarks().dailyCorner`/`weeklyCorner`), `tone?` (`weeklyTone`), `markLabel`, `label`, `onClick`.
**Exports:** `MissionsLink(props)`.
**Chamado por:** `src/App.tsx` (`currentView` `home` e `map`).
**Régua:** `src/styles/iconScale.contract.test.ts` (glifo 24).

### `src/components/nav/MissionsSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `onDoneStroll` (marcar o passeio como feito direto da linha "Stroll").
**Dono de:** a lista de missões aberta pelo ícone da Home — a MESMA folha do Passeio (`PasseioSheet`, lazy) dentro de um `ModalSheet`, mais as missões da semana (`WeeklyMissionList`, com o resgate) e as Conquistas (`ConquistasSheet`) — TODAS as missões num lugar só; o card de missões saiu da Home (07/10/2026). Cada seção leva a marca do seu local. Nada daqui escreve estado que o Passeio/Torneio não escrevam.
**Props principais:** `kind` (`daily`: Primeiro dia + Hoje; `weekly`: Esta semana + Conquistas), `open`, `onClose`, `language`, `crossings`, `onChange` (função pura sobre `prev`), `todayKey`, `seed`.
**Exports:** `MissionsSheet(props)`.
**Chamado por:** `src/App.tsx`.

### `src/components/ui/Celebration.tsx`
**Dono de:** a celebração curta (rodada 7, M5) — 12 faíscas CSS, ~1,3 s, uma vez, decorativa (`aria-hidden`). Em `prefers-reduced-motion` o CSS (`.sm2-celebrate`, bloco canônico) a esconde.
**Props principais:** `fixed?` (sobre a tela, para a meta do dia), `onDone?`.
**Exports:** `Celebration(props)`.
**Chamado por:** `src/components/play/PasseioSheet.tsx` (o "Fiz"), `src/App.tsx` (meta do dia cumprida).
**Régua:** `src/components/play/PasseioSheet.render.test.tsx`.

### `src/components/ui/SpriteFx.tsx`
**Dono de:** FX por folha 3×2 (6 quadros, `.sm-fxs` por `steps()` no `index.css`; quadro parado ou some em `prefers-reduced-motion`) e o título de resultado com lettering na arte (`ResultBanner`, VICTORY/DEFEAT/DRAW em PNG alfa real, `aria-label` PT/EN).
**Props principais:** `SpriteFx`: `sheet` (`fusao`/`bau`/`recompensa`/`evolucao`), `size`, `ms`, `loops`, `delayMs`, `still` (`last`/`hide`); `ResultBanner`: `kind`, `isPt`, `width`.
**Exports:** `SpriteFx`, `ResultBanner`, `bannerForOutcome`.
**Chamado por:** `games/ResultScreen.tsx`, `ui/Celebration.tsx`, `Match3Game.tsx`, `EvolutionCeremony.tsx`, `DuelScreen.tsx`.
**Régua:** `src/components/games/fxPack.render.test.tsx`.

### `src/components/nav/AreaScene.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props novas `onNoticeClose` (X do aviso: sem ele o aviso é só texto) e `palco` (camada extra no palco da imagem: a chave do Calabouço na Exploração, `DungeonKeyBadge`).
**Dono de:** o MOLDE de uma área do Mapa (minimal-ui F4) — fundo de cena e "lotes" (construções clicáveis, posicionadas em % sobre a cena). ⚠️ **Decisão do dono, 28/09/2026: não existe mais NPC anfitrião fixo no rodapé da cena.** Cada lote tem o NPC dele próprio, mostrado só dentro da folha que abre ao tocá-lo (`AreaSheet`, via `lotNpcArt`) — a `AreaScene` não desenha NPC nem balão de fala nenhum. Não decide o conteúdo de cada folha — isso é do `AreaView`.
**Props principais:** `areaId: AreaId`, `language`, `lots: AreaLot[]` (`id`, `label`, `left`/`top`, `ariaLabel`, `onOpen`, `art?` — a arte isométrica do lote, desde F5), `background?` (fundo pintado 9:16 em `cover`, desde F5; sem ele, o degradê de tokens), `children?` (onde entra o `AreaSheet` aberto, no mesmo empilhamento da cena).
**Exports:** `AreaScene(props)`, `AreaLot` (interface). A cena termina no FIM DA TELA (QA L1 #31: `minHeight` `100dvh − 56px` com margem negativa que devolve os 40 px ao `<main>`, sem rolagem nova).
- `LOT_WIDTH_DEFAULT` (`'38%'`) — largura padrão de um lote, em % da cena (molde F4).
**Chamado por:** `src/components/nav/AreaView.tsx`.
**Régua:** `src/components/nav/areaShell.render.test.tsx`.
**Delta 13/11/2026 (REGISTRO §319):** prop `palco?: ReactNode`, desenhada DENTRO do palco da imagem (só com prédios pintados), em % da arte; a Exploração passa a `DungeonKeyBadge`.

### `src/components/nav/DungeonKeyBadge.tsx` (13/11/2026 — REGISTRO §319)
**Dono de:** a chave do Calabouço no mapa da Exploração: com a chave valendo, o ícone `recompensa-chave.png` (arte do dono, `icones-ui/interacao`) + o relógio até ela expirar (`formatEnergyCountdown`, anda de 1 em 1 s), na caixa `EXPLORACAO_CHAVE_BOX` (ponte entre Passeio e Calabouço). Sem chave ou relógio zerado: não desenha nada. Só visual (sem toque); `role="img"` com o rótulo falado em h/min.
**Exports:** `DungeonKeyBadge({ expiresAt, language })` (`expiresAt` = `dungeonKeyExpiresAt` do `App`, via `play.dungeonKeyExpiresAt`).
**Chamado por:** `src/components/nav/AreaView.tsx` (prop `palco` da `AreaScene`). **Régua:** `src/components/nav/DungeonKeyBadge.render.test.tsx`.

### `src/components/nav/AreaSheet.tsx`
**Moldura de aço (18/11/2026):** prop `moldura?: 'padrao' | 'aco'`. `'aco'` (só o lote `forja.hexsmith`, ligado em `AreaView`) troca as peças do `ModalFrame` pela arte de `ui/hex-moldura/` (classe `sm2-moldura-modal--aco`), põe o `CristalChama` no encaixe do topo e o ✕ (só o glifo, `.sm2-moldura-aco__fechar`, `data-area-sheet-close`, na tela principal) no disco esquerdo; o ✕ fica SEMPRE no disco esquerdo e SEMPRE fecha tudo (24/11/2026: telas internas não o trocam por Voltar nem o movem; só esmaece com modal de FORA da folha). `useDialogA11y` poupa o ✕ (`data-aco-medalhao`) e o encaixe do "i" (`data-moldura-info`) ao inertizar o fundo. Régua: `AreaSheet.aco.render.test.tsx`.
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props novas `npcArt2` (segundo busto: os dois chefs do Restaurante no domingo) e `npcOverlay` (peça na zona do NPC, entre o NPC e o balão: o leque de tickets do Salão).
**Dono de:** a folha (bottom-sheet) de um lote de área (minimal-ui F4). ⚠️ **Proporção redecidida pelo dono em 28/09/2026: a folha ocupa `height: 66.6667dvh` (2/3 da tela), fixo — não é mais um range `min-height`/`max-height`.** A metade de cima da folha é do NPC **do lote** + balão de fala (`data-area-sheet-npc-zone`/`data-area-sheet-npc-line`; a fala continua vindo de `src/utils/areaNpcVoice.ts`, nunca escrita aqui); a metade de baixo é o conteúdo rolável (`children`). Backdrop fecha ao tocar fora, Escape fecha, foco vai para o botão de fechar ao abrir. O NPC não é mais um único anfitrião da área espiando por cima — é o de CADA lote, resolvido por `lotNpcArt(areaId, lotId)` (`src/assets/soulmon/npcs/index.ts`): cai no NPC histórico da área se o lote não tiver mapeamento próprio, e em `PLACEHOLDER_NPC_ART` (coruja-cervo/poring) para sub-lojas ainda sem NPC dedicado.
**Props principais:** `areaId: AreaId`, `lotId?: string | null` (id do lote aberto — resolve o NPC via `lotNpcArt`), `language: Language` (obrigatória — idioma da fala do NPC), `title`, `closeLabel`, `open`, `onClose`, `npcArt?` (override explícito e raro do NPC — sem ele, usa `lotNpcArt(areaId, lotId)`), `children`.
**Exports:** `AreaSheet(props)`. Desde 29/09/2026 a fala do NPC vem de `lotNpcVoice` (por lote, `utils/areaNpcVoice.ts`) e a folha aberta se registra em `useBackLayer` (`utils/backStack.ts`): o voltar do Android/navegador fecha a folha antes de mudar de tela. Desde 02/10/2026, `headSlotRef?` entrega um encaixe no canto direito da linha do título (o Torneio põe ali o indicador da faixa por portal).
**Chamado por:** `src/components/nav/AreaView.tsx`.
**Régua:** `src/components/nav/areaShell.render.test.tsx`.
**Acessibilidade (Guilda L1 #24):** o foco/`aria-modal` passou para `useDialogA11y` (foco inicial no fechar, Tab preso, fundo `inert`, Escape, foco DEVOLVIDO ao lote que abriu); o botão de fechar tem 44 px e o corpo respeita `safe-area-inset-bottom`.

### `src/components/home/Mochila.tsx`
**Modal Files (18/11/2026, dono; referência `ref3-cristal-chama-ESCOLHIDA.jpg`):** com `MOLDURA_MODAL` (de `nav/AreaSheet`) a folha é um `ModalFrame` com a classe `sm2-moldura-modal--files`, que troca as peças pela arte aprovada de `src/assets/soulmon/ui/files/` (topo com encaixe do cristal e dois discos, base, laterais, abas em 3 fatias, slot, disquete; LEIA-ME da pasta). Cristal-chama (`.sm3-files-cristal`) no encaixe do topo; X redondo (`.sm3-files-fechar`, 44 px) no disco esquerdo; título central; o "i" é o `ModalFrame info` no disco direito ("Como usar um item"). Abas `tablist/tab/tabpanel` com foco itinerante e setas/Home/End. Grade de 4 slots, completada por slots vazios decorativos (`slotsVazios`, mínimo 8). COMIDA (comum, prato, premium: `ehDisquete`) vira DISQUETE com a arte no rótulo (escurecido) e `X.exe` + `×N` embaixo; selecionado = `files-disquete-sel`; chip, especiais e materiais usam o slot com a arte do item (`files-slot`/`-sel`). Kill-switch `MOLDURA_MODAL = false` volta à folha lisa (o "i" volta ao cabeçalho). CSS: bloco "MODAL FILES" em `src/index.css`; token novo `--sm2-viewport-accent` (turquesa claro sobre o vidro, igual nos dois temas).
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `extras { fragments?, bossShards? }` (Fragmento do Soulsmith e de Boss na aba Materiais, com balão "Encontrado em/Usar em"); sem Essências na Bolsa (só no Laboratório › Arquivo); comida e chip aparecem como arquivo `.exe` (`getFileName`) e o prato feito vai para a pastinha.
**Rótulo (30/10/2026, dono):** "Mochila"/"Backpack" virou "Arquivos"/"Files" em todo texto do jogador (botão da Home com ícone de pasta, título da folha, aria-labels, avisos, recompensas); o nome do componente, `data-mochila` e ids ficam.
**Dono de:** a MOCHILA da Home B (minimal-ui F2, 23/09/2026) — folha de baixo (`min-height` 56vh) com as abas "Comida e chips" / "Especiais" sobre o `foodInventory`. Uso por ARRASTO até o pet (pointer events: fantasma segue o dedo, a folha desce durante o arrasto, soltar sobre o alvo do carinho chama `onUse`); tocar sem arrastar só seleciona; o item selecionado (toque ou foco) mostra o botão "Usar"/"Use" — a alternativa acessível. Não decide regra: `onUse` é o `handleFeed` do App.
**Props principais:** `open`, `onClose`, `foodInventory`, `language`, `onUse(emoji)`, `petTargetRef`, `onTargetChange?`, `petName?`, `materials?`, `onGoToBuilding?(building)`, `demo?`.
**Materiais (07/10/2026, pedido do dono):** na aba Especiais, a seção "Materials" lista os 16 de `MATERIALS` (`buildingQuestsCopy`, por import dinâmico) SEMPRE, com ×0 — regra específica do ingrediente-recurso; os outros especiais seguem só com estoque. Tocar no ícone (botão sem moldura, `aria-expanded`) abre o painel "Find more at <prédio>" com o botão "Go there"/"Ir lá": fecha a Mochila e chama `onGoToBuilding`; o App resolve por `buildingDestination` (`src/navigation.ts`: Caderno → menu de Missões; os demais → área + folha do lote via `initialSheet`). Esc e toque fora fecham só o painel. Na demo, prédio de `DEMO_BLOCKED_LOTS` mostra "Not available in the demo" sem botão. O ícone do botão da Mochila no `CompanionHUD` é `PixelIcon name="mochila"` (o glifo vetorial `backpack` saiu).
**Exports:** `Mochila(props)`, `MochilaProps`, `ehDisquete(emoji)`, `slotsVazios(n, colunas?, minimo?)`, `USAR_TRAVA_MS` (400 ms: dois toques em "Usar" dentro dela gastam um item só), `mochilaTabs(inv)`, `pontoSobre(x, y, rect, folga?)`, `DRAG_THRESHOLD_PX`, `DROP_SLOP_PX`, `MochilaAba`.
**Chamado por:** `src/components/CompanionHUD.tsx`.
**Régua:** `src/components/home/Mochila.render.test.tsx`, `Mochila.filesModal.render.test.tsx` (moldura, disquete com `.exe` e ×N, selecionado, vazio, slots, a11y das abas).

### `src/components/home/FeedBubble.tsx`
**Papel:** balão do pet ao comer — mostra a COMIDA dada em 3 estágios (~350 ms cada) e some; sem arte dos estágios mostra só um coração (`ITEM_ART['💗']`), nunca as mãozinhas. Movimento reduzido: estágio 1 e some.
**Props:** `emoji`, `runKey`, `reducedMotion`, `position`, `onDone`.
**Estado/efeitos relevantes:** `stage` + timers por `runKey`.
**Usado por:** `CompanionHUD.tsx` (disparado por `feedAnim`).

### `src/components/home/statTips.ts`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** a dica da energia cita a velocidade ×1,5 dormindo (`SLEEP_ENERGY_REGEN_BONUS`).
**Dono de:** o TEXTO da dica que abre ao tocar no coração ou na energia da Home (C13 da navegação do dono, 01/10/2026): como sobe e como desce, em PT/EN, com os números lidos das constantes (`MAX_HEARTS_LOST_PER_DAY`, `WEEKLY_RELIEF_HEARTS`, `RUB_HEAL_DAILY_CAP`). Não decide regra nenhuma — só descreve.
**Exports:** `statTip(kind, isPt)`, `StatTip`, `StatTipKind`.
**Chamado por:** `src/components/CompanionHUD.tsx`.
**Régua:** `src/components/home/statTips.test.ts`, `src/components/CompanionHUD.cta.test.tsx`.

### `src/components/perfil/SoulmonPerfil.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o nome do especial é só leitura (`EspecialNomeLeitura`).
**Dono de:** a folha do prédio **Perfil** do Soulmon (`laboratorio.perfil`, beta-2 item 11, 13/10/2026) — duas cartas curtas, só valores QUALITATIVOS e só o que o app tem: **Quem ele é** (personalidade = o traço de nascimento; atributo principal = Força/Resistência/Agilidade; nível do equipamento do Soulsmith) e **Como luta** (elemento principal, tipo de ataque, nome e efeito do especial e, só quando difere do principal, o elemento do especial). A linha some quando o dado não existe. Sem pontuação, sem melhoria do Soulsmith (o aprimoramento mora no Mercado). Ícones: arte que já existia no repo.
**Props principais:** `language`, `input: PerfilInput` (`utils/soulmonPerfil.ts`).
**Exports:** `SoulmonPerfil(props)`.
**Chamado por:** `src/App.tsx` (`labContent`, `labTab === 'perfil'`, `lazy`).
**Régua:** `src/components/perfil/SoulmonPerfil.render.test.tsx`, `src/utils/soulmonPerfil.test.ts`.

### `src/components/perfil/ProfileAvatarButton.tsx`
**Dono de:** o botão do USUÁRIO no canto superior esquerdo da Home (Tarefa C, 07/10/2026) — a foto de perfil (NPC) com a moldura equipada, num alvo de 44 no fluxo (coluna de 48 do `HomeHud`, como antes) com o avatar de 42 (+50% em 07/10/2026) SOBREPOSTO em `absolute` e `z-index` 20 — não empurra o pet nem o nome. ⚰️ Substitui o sanduíche e o `HomeMenuSheet` (apagado): abre `page:settings`. O que morava no menu foi para as Configurações: Guia (já em Ajuda), Créditos (linha `onOpenCredits`) e Oráculo/Refazer o ritual (ocultos por `MENU_SHOWS_RITUAL_TOOLS = false`, hoje exportada de `SettingsPage.tsx`).
**Props principais:** `avatarId?`, `frameId?`, `seed?`, `language`, `onClick`.
**Exports:** `ProfileAvatarButton(props)`.
**Chamado por:** `src/App.tsx` (`leading` do `HomeHud`).
**Régua:** `src/components/nav/nav.render.test.tsx`.

### `src/components/perfil/EditHomeScreen.tsx`
**Dono de:** "Editar Home" (04/11/2026) — tela cheia, em portal, aberta pela linha do grupo Perfil das Configurações: o retângulo da Home com o cenário aplicado, ponto branco a 50% em cada espaço vazio e folha (`ModalSheet`) com as peças que a pessoa tem e cabem no espaço, mais "Vazio". Tudo é rascunho local até Salvar.
**Props principais:** `EditHomeProps` — `language`, `ownedFurniture`, `equippedDecor`, `equippedBackground`, `onSave(decor)`, `onClose`, `onOpenShop?`.
**Exports:** `EditHomeScreen`, `EditHomeProps`.
**Estado/efeitos relevantes:** `draft` (cópia de `equippedDecor`) e `picking` (espaço aberto); reusa `PetStageDecor` para desenhar o rascunho; Salvar só fica ativo com mudança; o pet fica de fora.
**Cristal Fundador (§511):** peça com `slotsPermitidos:'chao'` desenha em qualquer espaço de chão (caixa via `slotParaItem`), no máximo uma vez; fora do chão ou duplicada não desenha.
**Chamado por:** `components/SettingsPage.tsx` (`profile.editHome`, montado no `App.tsx` com `handleSaveHomeDecor`, que grava o mesmo `equippedDecor` da loja).
**Régua:** `src/components/perfil/EditHomeScreen.render.test.tsx`.

### `src/components/perfil/DemoSoundButton.tsx`
**Dono de:** o botão de SOM da demo do portfólio (15/10/2026): no lugar do avatar na Home, liga/desliga todo o áudio pelo mudo existente; alvo 44, aria PT/EN. A demo não abre Configurações.
**Props principais:** `muted`, `language`, `onToggle`.
**Exports:** `DemoSoundButton(props)`.
**Chamado por:** `src/App.tsx` (`leading` do `HomeHud`, só na demo).
**Régua:** `src/utils/demoPortfolio.test.tsx`.

### `src/components/perfil/BondXpBar.tsx`
**Dono de:** a barra de XP do Vínculo (o level do usuário) nas Configurações › Perfil: nível atual, `into / need XP` até o próximo e uma `progressbar` acessível (`aria-valuetext`). Tudo DERIVADO de `bondProgress(totalXP)` (nunca persistido); no nível máximo (`BOND_MAX_LEVEL`) a barra fica cheia e diz "Max"/"Nível máximo". Só descreve — sem meta, sem cobrança.
**Props principais:** `totalXP`, `language`.
**Exports:** `BondXpBar(props)`.
**Chamado por:** `src/components/SettingsPage.tsx`.
**Régua:** `src/components/perfil/perfilNivel.render.test.tsx`.

### `src/components/perfil/PerfilCardTile.tsx`
**Dono de:** o card do menu da Home em Configurações › Perfil (Perfil / Home / Widget): a mesma peça para os três, palco com o visual do item e o nome embaixo, no estilo turquesa escuro com fio de cobre. Slot de arte opcional em `src/assets/soulmon/perfil-cards/card-<chave>.{webp,png}` (vira o fundo do palco; ausente = visual de hoje).
**Props principais:** `cardKey`, `attr`, `label`, `ariaLabel`, `onClick`, `children`.
**Exports:** `PerfilCardTile(props)`, `perfilCardArt(key)`.
**Chamado por:** `src/components/SettingsPage.tsx`.
**Régua:** `src/components/perfil/perfilCards.render.test.tsx`.

### `src/components/perfil/ProfileEditor.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** nome do Soulmon e do especial só leitura (a troca é na Hexsmith por `HexRenameModal`); `EspecialNomeEditor` saiu, entrou `EspecialNomeLeitura`.
**Dono de:** a folha "Editar perfil" (Configurações › Perfil): e-mail desativado ("em breve"), moldura (`FrameSelector` — sem opção "sem moldura": o frame básico preto, grátis e padrão, vem primeiro; contexto de rank vivo via `getRank(undefined, saveId)`) e foto em grade com busca e filtro por domínio (miniaturas lazy, 64 px, cabe em 375 px). Só IDs de lista fechada saem daqui.
**Exports:** `ProfileEditor(props)`.
**Chamado por:** `src/components/SettingsPage.tsx`.
**Régua:** `src/utils/avatar.test.ts`.

### `src/components/nav/MapPage.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o aviso de prédio trancado deixou de sumir em 5 s: fecha só pelo X (`LockNotice onClose`, §454); margens laterais simétricas.
**Dono de:** a tela do Mapa (minimal-ui F1 + arte isométrica F3) — cena com as seis construções (`AREAS` de `src/navigation.ts`), cada uma um `<button>` com `aria-label` = `areaLabel` que chama `onOpenArea`, posicionada em % da cena; o saldo das 3 moedas num menu discreto no canto inferior direito, acima da arte (`zIndex` 2; até 24/09/2026 ficava no topo e a arte do "Jogos" o cobria), cada moeda numa **pílula** com a moldura `chip-moeda` do squad de arte em 9-slice (`CHIP_MOEDA_ART`/`CHIP_MOEDA_SLICE` de `assets/soulmon/icones-ui`, `border-image … fill` a 1/3 da arte: o miolo opaco segura o contraste sobre qualquer trecho da cena e as tampas não deformam quando o texto cresce) — moldura de TEXTO, não de ícone (formato e cor de `utils/currencies.ts`); o canto inferior esquerdo vinhetado para o `CornerLink glow` da Home. `<h1>` visualmente oculto (`#sm-map-title`).
**24/11/2026 (P2):** as 3 pílulas do canto inferior direito saíram; o saldo é a barrinha do topo (`TopStatusBar`), com as props novas `energy`, `maxEnergy`.
**Props principais:** `language`, `onOpenArea(AreaId)`, `bits`, `emblems`, `credits`, `energy?`, `maxEnergy?`. A pílula da 2ª moeda diz "Honra"/"Honor" (`aria-label` "N de Honra"/"N Honor") desde 30/09/2026 — ⚰️ "Emblemas"/"Emblems" (REGISTRO §17); a prop continua `emblems`.
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

### `src/components/ChatPanel.tsx`

**Dono de:** o painel do chat da beta12 (meia tela estilo WhatsApp e tela cheia com o sprite no canto); recebe a barra de digitar do `ChatBox` e a lista de até 20 mensagens da sessão (`role="log"`). Decisões em `docs/beta12/DECISOES-C.md`.

**Chamado por:** `src/components/ChatBox.tsx`.

### `src/components/ChatBox.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props novas: `onUserMessage` (qualquer mensagem enviada conta para a missão "Conte como você está se sentindo", sem olhar o conteúdo; não dispara na resposta local da ponte nem sem rede), `focusRequest` (`Date.now()` do toque; só vale 4 s) e o sprite equipado no canto da tela cheia; o painel passa a ser o `ChatPanel`; qualquer diálogo que entra no documento tira o painel de cena; `fecharChat` em `useCallback` (§439).
**Dono de:** a caixa de chat do pet — texto e transcrição de voz via `/api/transcribe`, com contexto de jogo em inteiros (`chatContext`) e detecção de categoria de mensagem.
**Props principais:** `ChatBoxProps` — `petName`, `mood`, `evolutionStage`, `dominantBranch?`, `useAI`, `onSendMessage(response)`, `aiSettings?`, ⚰️ `onOpenAISettings?` (saiu em `4a8b8049`, #37 — era destruturada e nunca chamada), `language?`, `chatContext?` (`hp`/`energy`/`bond`/`daysAway`/`moodToday`, sempre inteiros — nunca texto, `soulGoal`/`soulStruggle` não passam por rota de IA), `onCreateActivity?`.
**Exports:** `ChatBox(props)`.
- `ChatSupportNote({ isPt })` — a nota de apoio (sem consumidor hoje; quem a realocar importa daqui).
**Estado/efeitos relevantes:** `useState` para `inputValue`, `history` (só em memória — nunca save/localStorage), `isLoading`, `isRecording`, `mediaRecorder`, `micDisponivel`, `audioChunks`, `isInputReadOnly`, `focado`, `randomName`; `useCallback` (`garantirConfig`) busca `fetchServerConfig`; chama `aiFetch` (`src/utils/aiClient.ts`) e `fetch('/api/transcribe')` para voz; usa `toast.warning`/`toast.error` (sonner) quando a IA cai para respostas locais; `chatSafetyDecision`/`detectMessageCategory` filtram a mensagem antes de enviar.
**Chamado por:** `src/components/CompanionHUD.tsx` (`grep -rl "from '.*/ChatBox'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ChatBox.*test.ts*'` vazio, 09/09/2026); o microfone/transcrição são cobertos indiretamente por `src/security/transcribe.contract.test.ts`.
**Avisos do arquivo:** o histórico do chat mora só em `useState` de propósito — fechar o app apaga a conversa; `chatContext` é sempre inteiro, nunca texto (D8: `soulGoal`/`soulStruggle` não passam por IA). Desde `6ad2e629` (21/09/2026, parecer clínico — `docs/NARRATIVA-COPY.md` §6): a **superfície de suporte** mora AQUI, no rodapé do chat (`.sm2-chat-support`, `.sm2-chat-support-link` em `src/index.css`) — texto pequeno, `muted`, sem ícone nem caixa (proeminência estigmatiza), com o caminho ANTES da limitação do produto; desde `f3654076` (decisão 1 do dono) link para `findahelpline.com` + CVV 188 (PT) / 988 e 116 123 (EN). A lista é CURADA, estática e humana — faz par com a cláusula SAFETY de `functions/api/chat.js`, que proíbe o modelo de citar qualquer número. Trocar/adicionar serviço é decisão do dono. **Desde a minimal-ui F2 (`78dc6ddb`) a barra é o TERMINAL `>_`** (`.sm3-chatbar`, `<label className="sm3-term" data-terminal>` + `.sm3-term-input`): sempre aberto no rodapé da Home, o `>` e o cursor `_` piscando são desenho `aria-hidden` (⚰️ o `placeholder=">_"` que o leitor de tela lia como "maior que sublinhado"); o `_` some quando a pessoa começa a escrever (`focado` — o foco é medido na BARRA inteira, para sair do campo rumo ao link de apoio não esconder o link antes do toque — ou texto no campo); a frase de suporte só aparece enquanto a pessoa escreve (decisão de desenho registrada para o dono em PERGUNTAS-DO-DONO). Delta `ae366480..5edfcfba`: o rodapé de suporte deixou de ter URL e números à mão — importa `HELPLINE_DIRECTORY_URL`, `helplineDirectoryLabel(isPt)` e `helplineNumbers(isPt)` de `src/utils/supportLine.ts` (mesmo dono do `refugio/SupportNote`); ⚰️ os literais `findahelpline.com` e "No Brasil: CVV, 188…" / "US/Canada: 988…" não moram mais aqui.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** falha de microfone deixou de virar mensagem do usuário no chat: vira `toast` (`MIC_ERR`: negado, sem aparelho, sem motor de gravação/`MediaRecorder`, gravando); o Android exige `MODIFY_AUDIO_SETTINGS` no manifesto.

### `src/components/CityPicker.tsx`
**Dono de:** busca de cidade de nascimento com fuso IANA, usada no oráculo/onboarding para o mapa astral.
**Props principais:** `CityPickerProps` — `value: City | null`, `onChange(city)`, `isPt`, `inputStyle`, `optionStyle(selected)?` (agora com padrão `choiceStyle` de `form/FormKit.tsx`), `inputClass?`/`optionClass?` (classes do kit; a `OraclePage` não passa nada, fora da navegação).
**Exports:** `CityPicker(props)`.
**Estado/efeitos relevantes:** `useState` (`query`, `touched`); `useMemo` (`matches`) chama `searchCities` (`src/utils/soulProfile/cities.ts`) só depois do primeiro toque (`touched`). Delta `ae366480..5edfcfba`: o rótulo da cidade passa a depender do idioma — `cityLabel(city, isPt)` (antes `cityLabel(city)`) no valor inicial de `query`, na comparação de `showList` e no botão de cada opção.
**Chamado por:** `src/components/OraclePage.tsx`, `src/components/SoulmonOnboarding.tsx` (`grep -rl "from '.*/CityPicker'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'CityPicker.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** tabela embarcada, não geocoding de terceiro — mantém onboarding instantâneo, offline e sem enviar data de nascimento a serviço externo; erro de fuso desloca o Ascendente em ~15° (histórico de horário de verão real, não faixa por data).

### `src/components/CompanionHUD.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** balão dourado (borda dourada que LEVA a um lugar; um por vez; `data-pet-gold-bubble`; o de evento some em `tempoMs`, §383) com `onBalaoDourado`/`onBalaoIgnorado`; dica comum da vez (§333, fome/cochilo) no lugar da fala ociosa; `onUserMessage`/`focusRequest` repassados ao chat; materiais extras (Fragmento do Soulsmith, de Boss) na aba Materiais da Mochila.

**Balões de dica (§333, 13/11/2026):** props `dicaFala` (`{ tipo, text }` da dica COMUM da vez, fome/cochilo) e `onDicaFalada(tipo)`. A dica entra no LUGAR da fala ociosa (o mesmo intervalo de 3 min), nunca num turno a mais e nunca por cima de outra fala; dormindo ou ausente não fala e não grava. `balaoDourado.tipo` aceita também `relaxar`/`lilia` (dica DOURADA, mesmo botão `[data-pet-gold-bubble]`, alvo >= 44 px, sem `sm3-balao` em movimento reduzido). **Seta no círculo (dono, 13/11):** TODO balão dourado (eventos `grove`/`rift`/`achado` e as dicas douradas) termina com `[data-pet-gold-bubble-arrow]` (componente local `BalaoDouradoTexto`): o glifo autoral `arrow_forward` (`Icon`, 11 px) num contorno circular de 1,5 px em CSS, sem fundo, 16 px (~1,15em da linha de 14 px), tinta `--sm2-ink` (o mesmo par do texto sobre `--sm2-surface`), `aria-hidden` (o `aria-label` do botão já diz o destino); a última palavra e a seta moram num `nowrap`, então a seta nunca quebra sozinha; estática, sem animação. O balão COMUM (`[data-pet-bubble]`) não tem seta. Régua: `CompanionHUD.dica.render.test.tsx`, `CompanionHUD.balaoDourado.render.test.tsx`.

**Balão de fala (14/10/2026, REGISTRO §57):** `[data-pet-bubble]` é um balão de verdade (`role="status"`, `aria-live="polite"`): fundo `--sm2-surface` sólido, borda `--sm2-line`, sombra sutil, texto à esquerda, largura máx. 80%, 3 linhas com reticências, cauda (`[data-pet-bubble-tail]`) para baixo no x do pet (`50 + (position-50)*CENA_ZOOM`, o balão acompanha o pet que anda sem sair da janela). Fora do fluxo (`position:absolute` em `[data-pet-bubble-row]`, `BUBBLE_TOP` = `BUBBLE_GAP`+14); fade de entrada `sm3-balao` só fora de `reducedMotion`.
**Dono de:** a área do pet inteira — sprite, HUD do "aparelho" (visor pixel-art), gesto de esfregar, ações (comer/banho/dormir/item), fala, chat embutido e decoração do palco.
**Props principais:** `CompanionHUDProps` (arquivo lido, interface em torno da linha 124) — estado do pet (`healthPoints`, `energyLevel`, `evolutionStage`, `dominantBranch`, `currentXP`…), sinais que só crescem (`fullSignal`, `healCapSignal`, `speakSignal`, `daysAway`, `moodToday`, `hauntedWatching`), `walkingTo?` (desde `3532ccf5`: o nome da região de destino do Passeio, ≠ casa; vira 🎒 nas costas do pet, `data-pet-passeando`, `pointerEvents: none`, sem animação nem som, o nome só no `aria-label`; `null` = em casa), decoração (`equippedBackground`, `equippedDecor`, `trophies`), evolução manual (`onEvolve`, `canEvolve`, `onEvolveRequest`), cuidado (`careEvent`, `onFeed`, `onShower`, `onSleep`, `onPet`, `foodInventory`, `hasNewItems?`, `onBackpackSeen?` — ⚰️ era `onOpenItems`, a pastinha que saiu na minimal-ui), chat (`useAI`, `aiSettings`, `onCreateActivity`; ⚰️ `onOpenAISettings` não está mais nas props), `language`.
**Exports:** `PET_RENDER` (re-export de `src/utils/petStage.ts` — não redeclarado aqui, de propósito) · `CompanionHUD` (`const`, `memo(function CompanionHUD(...))`) · `HOME_PET_SIZE` (0,7: fator de porte do Soulmon na Home, 01/11/2026, "uns 30% menor").
- `DEFAULT_PET_BACKGROUND` (`'bg-room'`) — o Quarto grátis, pré-possuído por todo save, quando nenhum cenário está equipado (C3).
**Delta `bcfe7ca6..e3d55bb8` (01/10/2026, arte da rodada 3):** ⚰️ o emoji 🎒 do Passeio (`walkingTo`) e o glifo Material `wb_sunny` do botão "Acordar" saíram — a mochila nas costas do pet é `<img src={UI_ICON_ART.mochila}>` 20×20 `pixelated` (de `assets/soulmon/icones-ui`) e, dormindo, o botão usa `<PixelIcon name="acordar" size={24} />` (o sol `sol-acordar.png`); o import de `./ui/Icon` foi removido e entrou `UI_ICON_ART`.
**Estado/efeitos relevantes:** 66 linhas com `useState`/`useEffect`/`useLayoutEffect`/`useCallback`/`useRef` (`grep -cE`, 24/09/2026; eram 58 em 10/09/2026); toca som via `playShower`/`playVisorTune`/`playPresence` (`src/utils/sounds.ts`); renderiza `CareSystem`, `ChatBox`, `PetStageDecor`, `home/Mochila` (⚰️ `HomeHud` e `VisorBar` não são mais importados), `Viewport` (com `useVarreduraDeSintonia`/`usePrefersReducedMotion`); usa `createPortal` para overlays. **Home B (minimal-ui F2, `78dc6ddb`):** a cena vai de ponta a ponta (`.sm3-cena`, `RING_PX = 0` — sem o anel de cobre; `STAGE_FALLBACK_H = 330`; janela lida de `--sm3-cena-h`); o GRUPO do pet (`data-pet-group`: berço, sprite, corações, comida) cresce `CENA_ZOOM = 1.5` com origem nos pés, a decoração não; HP/energia saíram da placa do vidro (⚰️ `sm2-visor-plate` + `VisorBar`) para `.sm3-stats` em vetor, fora do `role="img"`; o deck (⚰️ folha de Alimentar `feedOpen`/`handleDeckFeed`) virou o grupo `.sm3-cuidar` com três `data-cuidado` — `mochila` (abre `Mochila`, `mochilaOpen`, chama `onBackpackSeen`; ponto de item novo por `hasNewItems`), `dormir`, `banho`; usar item = `handleUseItem(emoji)` → o mesmo `onFeed` (regra toda no `handleFeed` do App); `petIsTarget` realça o pet como alvo do arrasto (`data-pet-target`, `.sm3-pet-alvo`); brincar = duplo-clique no pet (`handleDeckPlay`); o "+1" de energia é `.sm3-mais` (`plusOne`), não mais fala; dormindo, véu `data-sleep-veil` + filtro no pet e o Z animado (`ANIM_ART.sleepZ`/`sleepZLight` conforme `isDarkBackground`). ⚰️ De `a6c1cd8a` até a minimal-ui o nome do alimento no deck vinha de `getFoodName` de `./ItemsWindow` — hoje quem nomeia é a `Mochila`; ⚰️ `FOOD_NAME_BY_EMOJI` (derivado de `FOOD_BY_CATEGORY`, só EN: o leitor de tela em PT ouvia "Protein × 2" aqui e "Proteína ×2" na Pastinha).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/CompanionHUD'" src`, 09/09/2026).
**Régua:** `src/components/CompanionHUD.render.test.tsx`, `.cta.test.tsx`, `.reacao.render.test.tsx`, `.scanline.render.test.tsx`, `.sintonia-fade.render.test.tsx`, `.vinculo.render.test.tsx`, `.voz.render.test.tsx`; também tocado por `src/components/sintonia-chiado.render.test.tsx` e `src/components/som-presenca-d11.render.test.tsx`.
**Avisos do arquivo:** ⚠️ `digivolutionSegments*`/`requiredDays` SAÍRAM das props em 03/09/2026 — eram três fontes para o mesmo número, nenhuma lida; quem precisa do gate de evolução lê `FORM_REQUIREMENTS[…].required`; `PET_RENDER` não pode ser redeclarado aqui (footgun 9) — sempre importado de `utils/petStage.ts`; escala do sprite é sempre múltiplo inteiro de 128 (guard no teste de render — lado não múltiplo reabre borrão de pixel art). Desde `a2ded861` (21/09/2026) as falas de `fullSignal` (recusa de comida) e `healCapSignal` (teto de carinho) NÃO moram mais inline aqui — vêm de `petVoiceLine('full' | 'healCap', …)` (`utils/petVoice.ts`), alcançadas pelo teste de tom. **Desde `592e2c14` (QA Rodada 2, `07-simulacao-jogo-r2` §2.9) a ESCADA DE FALLBACK do toque e do ócio também saiu daqui** (duas cópias inline — ⚰️ `'Me limpa!'`, `'Me alimenta!'`, `'Me alimenta por favor!'`, `'Cheio de energia!'`, `'Preciso de comida!'`… — a única fala que o jogador que menos faz ouvia, e era pedido imperativo): hoje `petVoiceLine('dirty' | 'hungry' | 'energized' | 'fine' | 'peckish' | 'starving', isPt, Math.random())`, por `careEvent.type` e faixas de `ratio` (≥ 1 / ≥ 0,6 / ≥ 0,1 / resto); os testes de render casam por `kind`, nunca por literal. **`onError` no sprite próprio (`592e2c14`, `02b-design-i18n-estados-r2` E2):** `ownSpriteUrl` é URL de rede (acervo) — offline ou com o cache do provedor fora, o `<img>` falhava e o visor ficava QUEBRADO; hoje `spriteQuebrado` guarda a URL que falhou e o visor cai em `getSpriteForStage(evolutionStage, demoCharacterId)`; URL nova (regeneração) tenta de novo. O flash de evolução usa `--sm2-viewport-bg`/`--sm2-viewport-ink` (⚰️ `#2dd4bf` sobre branco/70 dava ~1,6:1 — L1). Desde `66e32d43` (R2-4) o `SpriteAnim` do sono usa `ANIM_ART.sleepZLight` quando `isDarkBackground(equippedBackground)` (`utils/backgrounds.ts`), senão `ANIM_ART.sleepZ`.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** o pé e a sombra do pet seguem a escala REAL desenhada (`PET_DRAWN_SCALE` = 1): o `scale` do `<img>` não aplicava (React escreve "0.25px"), então a sombra ficava escondida atrás do corpo e o Soulmon parecia flutuar; ligar o `scale` de verdade é decisão à parte (muda o tamanho de todos os bichos).

### `src/components/ConsentGate.tsx`

**Dono de:** a tela BLOQUEANTE de reaceite dos Termos e da Política de Privacidade (REGISTRO §185, 28/10/2026; revoga o banner informativo da #24).
**Props principais:** `language`, `onAccept`.
**Exports:** `ConsentGate({ language, onAccept })`.
**Estado/efeitos relevantes:** `useState` da caixa de aceite; o botão só liga com a caixa marcada; links de Termos/Privacidade abrem em aba nova. Quem grava `buildConsentRecord()` é o `src/App.tsx`, aqui só se desenha.
**Chamado por:** `src/App.tsx` quando o save não tem consentimento da versão atual (`exigeTermo` de `utils/embedGates.ts` = `!isConsentCurrent`), MENOS no `/embed` (13/11/2026, REGISTRO §360: a demo do portfólio não mostra termo e não envia nada).

### `src/components/ForgeResultModal.tsx`
**Dono de:** modal de resultado de forja (23/11/2026): popup central do `ModalSheet` (`placement="center"`, `titulo="inline"`, ✕ redondo à direita, `maxWidth` 328) com arte + nome + efeito do que acabou de ser criado.
**Props principais:** `ForgeResultModalProps` — `language`, `title`, `name`, `effect?`, `art`, `closeLabel`, `onClose`, `primary?` (`{ label, onClick }`, ex.: "Equipar agora").
**Exports:** `ForgeResultModal(props)`.
**Estado/efeitos relevantes:** nenhum — só apresenta; quem monta decide quando abrir (uma vez por forja, só após o servidor confirmar; `already` não reabre).
**Chamado por:** `src/components/hex/HexsmithSheet.tsx` (HEX forjado, com "Equipar agora"), `src/components/ElementPotionSheet.tsx` (poção base ou composta criada, só "Fechar").
**Régua:** `src/components/ForgeResultModal.render.test.tsx`.
**Avisos do arquivo:** a Hexsmith auto-equipa o HEX só em Porta vazia (`applyServerHexForge`); "Equipar agora" é o que troca quando a Porta já tinha outro. A poção é criada no cliente (`craftPotion`), sem servidor: o "confirmado" é o `onCraft` devolver diferente de `false`.

### `src/components/CreateChoicePopup.tsx`
**Dono de:** escolhedor Hábito/Tarefa do botão de criar (24/11/2026): bottom sheet simples (sem moldura, só tokens), botões Nova tarefa / Novo hábito no topo.
**Props principais:** `CreateChoicePopupProps` — `open`, `language`, `onClose`, `onPick('habit'|'task')`, `onCommit?` (3ª opção só quando o App passa).
**Exports:** `CreateChoicePopup(props)`.
**Estado/efeitos relevantes:** nenhum; Esc (via `useDialogA11y`) e toque no véu fecham.
**Chamado por:** `src/App.tsx` (`createChoiceOpen`; hábito abre o catálogo, tarefa abre o `CreateModal`).
**Régua:** `src/components/CreateChoicePopup.render.test.tsx`.

### `src/components/HabitOverRecommendedPopup.tsx`
**Dono de:** a sugestão de limite de hábitos (dono, 24/11/2026, opção A): bottom sheet simples (mesmo padrão do `CreateChoicePopup`: sem moldura, só tokens `--sm2-*`, sem ✕) que pergunta ao pagante que passaria do número recomendado do estágio.
**Props principais:** `HabitOverRecommendedPopupProps` — `open`, `language`, `recommended` (X), `onCommitAnyway` ("Quero me comprometer mesmo assim" / "I still want to commit": cria), `onDecline` ("Você tem razão" / "You're right": fecha sem criar).
**Exports:** `HabitOverRecommendedPopup(props)`.
**Estado/efeitos relevantes:** nenhum; Esc (via `useDialogA11y`) e toque no véu valem `onDecline`. Não carrega dado do hábito, só o número X.
**Chamado por:** `src/App.tsx` (`habitOverAsk`, estado de UI transitório fora do save; aberto por `commitHabitCreate` quando `habitOverRecommended` acusa excesso; a confirmação reentra pelo mesmo portão com `confirmed`).
**Régua:** `src/components/HabitOverRecommendedPopup.render.test.tsx`, `src/utils/monetization.limiteSugestao.test.ts`, `src/utils/activityCreate.contract.test.ts`.

### `src/components/FundadorAvisoModal.tsx`
**Dono de:** aviso do Conjunto Fundador (23/11/2026, REGISTRO §523): popup central (mesma composição do `ForgeResultModal`) com a arte, o nome PT/EN e a frase do(s) prêmio(s) ganho(s).
**Props principais:** `FundadorAvisoModalProps` — `language`, `premios` (≥ 1), `dias`, `onClose`, `onEquip(premio)`.
**Exports:** `FundadorAvisoModal(props)`, `FUNDADOR_EQUIPAVEIS`.
**Estado/efeitos relevantes:** nenhum; prêmio único equipável (fundo, moldura, retrato) mostra "Equipar"; vários de uma vez (conta existente) = grade, só "Fechar"; Cristal só "Fechar".
**Chamado por:** `src/App.tsx` (Home, depois do onboarding, sem retrospectiva/intro de bônus na frente; fechar/equipar grava `fundadorAvisados`).
**Régua:** `src/components/FundadorAvisoModal.render.test.tsx`.

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
**Avisos do arquivo:** as invariantes (nenhum número por pessoa, sair num toque, sem push) agora são do `GuildSheet` e de `functions/api/guild.js` — [02 §57-A](../02-REGRAS-DE-NEGOCIO.md).

### `src/components/CreateModal.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `CATEGORIES` vem de `ACTIVITY_CATEGORIES` (`types/categories.ts`, lista única de 10 categorias); "Novo hábito" mostra tudo aberto (`habitMode`, exemplo "Caminhar 20 minutos"); `isAtCap` só vale com teto finito (teto infinito nunca imprime "até Infinity"); a dica `stageCapHint` (teto de hábitos do estágio) é texto visível (`data-create-cap-hint`, §385).
**Dono de:** formulário de criação de hábito/tarefa — Quick-Add como caminho primário e formulário sempre aberto (sem More/Fewer options, sem campo Name duplicado, exemplo por categoria via `categoryExamples.ts`, 22/11/2026).
**Props principais:** `CreateModalProps` — `isOpen`, `onClose`, `onSaveTask(data)` (nome, categoria, recorrência, esforço, passos…).
**Exports:** `HabitScheduleFields`, `HabitAnchorFields`, `CategoryChips`, `StrengthensLine`, `StepsFields`, `EffortFields` (blocos de campo reaproveitados por `EditModal`/`TaskEditModal`) · `CreateModal(props)`.
**Estado/efeitos relevantes:** `useState` (`gradeAberta`, `isSingleExecution`, `quickText`, `quickTokens`, entre outros); usa `useItemForm`/`useHabitSchedule` (`src/hooks/useItemForm.ts`); `parseQuickAdd`/`quickAddHint` (`src/utils/quickAdd.ts`) interpretam a linha digitada; renderiza `UnlockNudge` quando o cadastro esbarra no teto do modo demo.
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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `onGoHome?` (fim da cena do Passeio "Voltar para casa": fecha o resumo e leva à Home; sem ela só fecha).
**Dono de:** o relatório do dia, mostrado uma vez na primeira abertura após a virada — resumo de cuidado, humor, aventura da noite e convite de desbloqueio no value moment.
**Props principais:** `DailyReportModalProps` — `report: GameState['lastDayReport']`, `adventure?` (desde `3532ccf5` tipado `Pick<AdventureFind, 'id' | 'emoji' | 'titlePt' | 'titleEn' | 'textPt' | 'textEn'>`, porque pode ser um postal de região do Passeio, sem raridade; achado da noite, vem PRONTO de fora — nunca `useState` local, senão reabrir o relatório sortearia um achado novo), `adventureIsNew?`, `onClose`, `language`, `soulGoal?`, `onRecoverHearts?`, `moodToday?`/`onPickMood?`/`moodNote?`, `showOffer?` (decisão de `src/utils/offerMoment.ts`, só o resultado chega aqui), `spriteUrl?` (novo — o sprite do pet, para o vidro `ritual/RitualKit.tsx` dentro do relatório).
**Exports:** `DailyReportModal(props)`. O passo da aventura (e a missão/destino do dia anterior) agora é desenhado pelo `StrollFind` (15/10/2026, REGISTRO §66).
**Estado/efeitos relevantes:** usa `useDialogA11y` (`src/hooks/useDialogA11y.ts`); renderiza `MemoriesCard`, `UnlockNudge`; lê `MOOD_OPTIONS`/`MoodValue` de `src/utils/mood.ts` e `ADVENTURE_ART` de `src/utils/adventureArt.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/DailyReportModal'" src`, 09/09/2026). A relação com `MemoriesCard.tsx` é a INVERSA: é este arquivo que importa e renderiza `MemoriesCard` (ver Estado/efeitos acima), não o contrário — corrigido em 10/09/2026 por doc-verificador (`grep -n "MemoriesCard" src/components/DailyReportModal.tsx` mostra o import; `grep -n "DailyReportModal" src/components/MemoriesCard.tsx` não acha nada).
**Régua:** `src/components/DailyReportModal.aventura.render.test.tsx`.
**Avisos do arquivo:** o TOM não regride — nenhum vermelho, nenhum sinal de menos (cabeçalho do export principal); `adventure` chega pronto de fora de propósito, para não virar caça-níquel de reabertura; `showOffer` é só o resultado de uma decisão de ética que mora em `utils/offerMoment.ts`, a tela não decide. Desde `84ae4937` (21/09/2026, copy §2 da bíblia): as manchetes CONSTATAM sem `!` ("Um trecho fechou." no lugar de "Dia completo!"; a queda de forma "recolheu", nunca "voltou"/"regrediu"); a perda de coração vira uma frase única ("O padrão afrouxou um pouco.") sem atribuir causa; folga e alívio semanal falam em "maré" (§12) e sem SALDO; duas notas novas — a linha de apoio da degeneração (nada descoberto saiu) e a do dia completo ("A fagulha firmou."). O ramo `welcome` segue com `welcomeBack.ts` (decisão 3 do dono).
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** prop `strollScene?` (`regionId`, `bgId`, `bestiary`, `onDiscover(key)`): com Passeio no dia anterior o passo "aventura" renderiza `StrollScene` em tela cheia, e a descoberta é sorteada UMA vez por abertura (`strollDiscoveryOf`, `descoberta` em ref); ausente = a folha de sempre.

### `src/components/DinoGame.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** Bits da run por `bitsForLevel(floor(score/100), level)` (o fator do Avançado saiu daqui); "jogar de novo" usa a arte do prédio (`playAgainArt={lotIconArt(...)}`).
**Dono de:** a **Corrida com obstáculos** (EN "Obstacle Run"; ⚰️ "Corrida do Dino"/"Dino Runner" até 30/09/2026, `docs/REGISTRO-DE-DECISOES.md` §17 — o id `dino`, a pasta `assets/soulmon/dino/`, `STORAGE_KEYS.DINO_BEST` e o componente `DinoGame` NÃO mudaram) — o pet pulando obstáculos que sobem de tier conforme o tempo decorrido. Delta `bcfe7ca6..e3d55bb8` (30/09/2026, tema da rodada 3): os obstáculos são ossos e cristais de fogo frio (⚰️ ruínas de masmorra: pilar, rocha, coluna, barricada) e cada um dos 4 tiers (`OBSTACLE_TIERS`, `from` 0/20/45/75 s, `size` 38/44/50/56) tem 3 VARIANTES (`variants: ObstacleArt[]`, PNGs `dino-obstacle-<n>`, `<n>b`, `<n>c`), sorteadas no spawn (`v`); cada variante carrega a caixa de colisão medida — `hit` (fração horizontal opaca) e `top` (fração vazia acima da arte) —, de modo que as variantes baixas não matam o jogador "no ar". `tierImgsRef` virou matriz tier × variante. O título do `GameHeader` é "Corrida com obstáculos"/"Obstacle Run". Delta 04/10/2026 (K7): o pet NÃO corre mais estático — `utils/petBounce` (`runPose`/`idlePose`) dá quique por passada, estica no impulso e achata no pouso (teto ±8%, ±2% em movimento reduzido, grade nítida), com poeira pixel de 3 cores do visor atrás dos pés e no pouso (`Dust`, `spawnDust`; desligada em movimento reduzido) e respiração idle antes de começar e depois de perder. Só desenho: física, colisão, pontuação e tempo intactos.
**Props principais:** não documentado por interface própria no trecho lido (arquivo de 292 linhas — corrigido de "293" por doc-verificador, `wc -l`, 10/09/2026 — ver props recebidas do `AreaView`, ⚰️ antes da `ActivitiesPage`).
**Exports:** `DinoGame(props)`.
**Estado/efeitos relevantes:** `useRef` para `canvasRef`, `scoreElRef`, `petImgRef`, `tierImgsRef`, `phaseRef`, o laço de física (`g`); `useState` (`phase`, `finalScore`, `earned`, `best` — lido de `STORAGE_KEYS.DINO_BEST` via `readNumber`); `useCallback` (`jump`); toca `playTaskComplete` (`src/utils/sounds.ts`); grava recorde com `writeLocal`. Desde `66e32d43` (21/09/2026, R2-2/D-J13) o sprite do pet é `lineIconForStage(evolutionStage, 64, demoCharacterId)` (`utils/lineIcons.ts`, ícone-ficha 64² com bbox cheia) e só cai em `getSpriteForStage` quando o estágio não é de linha. Delta `ae366480..5edfcfba` (C-11, decisão do dono, 30/09/2026): ⚰️ `playTaskComplete` NÃO é mais chamado — no fim da partida, `if (pts > 0) onEarnPoints(pts)` e silêncio (pela R-CAT a categoria vem do evento, e vencer um minijogo não é concluir tarefa); o jogo fica mudo até existir a categoria arcade.
**Chamado por:** `src/components/nav/AreaView.tsx` (lote Corrida com obstáculos da Exploração, minimal-ui F5; ⚰️ até então `ActivitiesPage.tsx`) (24/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'DinoGame.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** fronteira retrô interna ao arquivo — DENTRO do `<canvas>` é território diegético/retrô e não migra para o kit `--sm2-*`; FORA é chrome em Material Symbols; `expand_less` (não `arrow_upward`) no botão de pular porque `arrow_upward` não está no subset da fonte (`src/styles/tokens.md`) e renderizaria vazio.

### `src/components/DuelScreen.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** companheiro invocado em cena (`companheiroTurnos` = `FighterFx.comp` de cada lado; `summonsDoGrupo`); o tipo do básico sai da identidade SEM Coroa/Amuleto/Garra (`fighterIdentitySemItensFromFx`, `tipoDoBasicoPvp`, §332); os números dos ticks de DoT entram no começo da ação do golpe seguinte (`sceneTimeOf`, §334); o especial usa o `impacto` do especial do oponente quando há.
**Dono de:** a TELA do duelo fantasma do Torneio. Os pets lutam sozinhos e o dono torce. Só anima: quem decide é o servidor (`match`), e a regra é `functions/api/_duel.js` sobre o núcleo v3.
**Cena (PR5, 06/10/2026):** a CENA em tela cheia de `games/BattleStage.tsx` (HP e ENERGIA em cima de cada lutador, mascote da torcida e barra de cheer de 24 toques, X com confirmação — sair conta como derrota), agora em **TEMPO REAL** (~38 s): `simulatePvp` (`utils/combate/duel.ts`) com a SEMENTE e a FICHA que o `duelStart` mandou; cada golpe tem o seu instante, a ação começa antes (`impactMs`) e o dano/HP chega no impacto. Um golpe básico novo corta um básico em curso, nunca um especial; dois especiais no mesmo instante esperam um ao outro. **Torcida por BALDE de 3 s** (`CHEER.bucketSeconds`, até `CHEER.tapsCapPerBucket` = 16 toques): ao fechar o balde a luta é simulada de novo com a descarga que ele pagou (cai no fim do balde, igual ao servidor), sem mexer no que já foi mostrado. O especial sai direto. A forma do golpe do oponente vem da `fx` da ficha dele (escola), a do dono da ficha local.
**Exports:** `DuelScreen` (props `me`/`opp` = `DuelSide`, `seed`, sprites/nomes, `petElement?`/`oppElement?`/`skills?`, `onDone(taps)` — os toques de cada BALDE —, `onClose`); `cheerQuality`/`CHEER_MS`/`CHEER_TARGET` (o anel por TIMING — guardados, sem UI).
**Quem chama:** `TournamentPage` (`fight` chama `startDuel`; o treino monta as fichas locais com `soulCombatant` e `npcSide`; o × antes do fim chama `leaveDuel` = derrota). Sair antes do fim NÃO entrega o resultado depois.
**Régua:** `src/components/DuelScreen.render.test.tsx` e `TournamentPage.duelo.v3.render.test.tsx`. Nasce muda (R-NOVA).
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** **HP base no duelo** (`hpExibidoPvp`, `utils/combate/fight.ts`): o máximo mostrado (`maxHpOf`) é o HP base da Arena, não o inflado do PvP (`PVP_HP_SCALE` saiu daqui) — só exibição; a simulação e o servidor seguem iguais. Props novas: `scene?` (CSS `background`; o Torneio passa o coliseu da faixa, `coliseuSceneFor`; ausente = `DUEL_SCENE.bg`, sem `sceneElement`) e `oppEspecialNome?` (nome do especial do oponente, público e já filtrado no servidor). O fim da luta mostra `ResultBanner` (victory/defeat/draw, `ui/SpriteFx.tsx`); `me` leva `stageIcon` (ícone de estágio na placa) e o impacto do golpe vem de `meleeImpactOf`.
### `src/components/GuildWarReplay.tsx`
**Dono de:** o "Assistir" da Guerra de clãs (22/11/2026, P4/C): reproduz os duelos de uma guerra já resolvida, um depois do outro, com `DuelScreen observar` e silhuetas neutras (nunca nome nem estágio de outra guilda).
**Exports:** `GuildWarReplay({ replay, onClose })`.
**Chamado por:** `App.tsx` (lazy), aberto pelo botão "Assistir" da carta `guild-war` do `MailboxSheet`. Só mostra: o resultado vem do servidor (`functions/api/_guerra.js`, `replayDaGuerra`) e não muda; nasce muda (R-NOVA).

### `src/components/games/ArenaCuraModal.tsx`
**Dono de:** o modal de fôlego entre rodadas da Arena (04/11/2026): cenário da run escurecido, 3 corações que enchem do "antes" ao "depois", e o botão "Pronto pro combate".
**Exports:** `ArenaCuraModal(props)`.
**Chamado por:** `ArenaGame.tsx`.

### `src/components/games/AlvoAliadoMarca.tsx`
**Dono de:** a marca de ALVO ALIADO (§327, 13/11/2026): o botão sobre um aliado na luta em grupo; tocar liga a mira de apoio (o próximo escudo/cura/reforço vai nele, `utils/combate/alvoAliado.ts`), tocar de novo desliga. Losango turquesa contínuo (`--sm2-primary-fill`) com "+", aceso enquanto a mira vale — de propósito diferente do anel dourado tracejado do inimigo (`BattleStage`, pisca 1 s). Alvo de toque ≥ 44 px, `aria-pressed`, rótulo "Apoiar X"/"Support X", foco visível (`.sm-alvo-aliado:focus-visible`), pulso desligado com movimento reduzido.
**Exports:** `AlvoAliadoMarca({ x, y, size, name, on, isPt, reduced, onPick })`, `AlvoAliadoMarcaProps`.
**Quem chama:** ninguém. **Pronto e testado, mas desligado: não está ligado a nenhuma tela** (decisão do dono, 13/11/2026, §327). Nenhuma luta tem aliado na tela; liga quando existir um modo com aliados. Prévia local com a `BattleStage` real em `E:\Soulmon-assets\_prints-aliado\`.

### `src/components/games/BattleSpeed.tsx`
**Dono de:** o botão de velocidade PADRÃO dos combates (03/11/2026, dono): "1x" ↔ "Fast" (o fator interno segue 3×, `DUNGEON_SPEEDS`), com UMA preferência por aparelho (`STORAGE_KEYS.DUNGEON_SPEED`). Só encurta o relógio da cena (`useGroupBattle.speed`); o resultado da luta é o mesmo.
**Exports:** `useBattleSpeed()` (`{ speed, speedRef, cycle }`) · `BattleSpeedButton({ speed, onCycle, isPt, corner?, attr? })` · `battleSpeedLabel`.
**Quem chama:** `DungeonGame`, `NightmareBattle`, `ArenaGame`, `RogueFight`, `GroveRaidFight`. Fora de propósito: o Torneio ranqueado e os replays de servidor (`DuelScreen`, `BossFightScreen`), cujo resultado já vem decidido.
**Régua:** `DungeonGame.beta-play.render.test.tsx`.
### `src/components/games/BossSplash.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** z-index 40 → 60 (a abertura do chefe fica acima do botão voltar).
**Dono de:** o splash de TELA CHEIA do boss dos minigames (04/11/2026): arte grande (slot `portrait` 9:16 de `assets/soulmon/boss/<id>.webp`, fallback no sprite), título, nome do monstro e, opcional, cartões das regras. Toque em qualquer lugar pula; sem movimento com `prefers-reduced-motion`.
**Exports:** `BossSplash`, `BossSplashCard`.
**Chamado por:** `src/components/Match3Game.tsx` (3 regras), `src/components/SoulBarrage.tsx` (boss especial, sem cartões). **Régua:** `games/BossSplash.render.test.tsx`.

### `src/components/games/ResultExtrasContext.ts`
**Dono de:** o contexto que leva os extras do resultado (`utils/resultExtras.ts`) do `App` até o `ResultScreen` sem prop-drilling. Sem Provider = sem extras.
**Exports:** `ResultExtrasContext` · `useResultExtras()`.

### `src/components/games/RiftResultExtras.tsx`

Sobrepõe o `bitsCap` do `ResultExtrasContext` com o teto diário efetivo da Fenda/Masmorra/Arena (150 + o extra da Agulha de bússola, `tal-pve-04`, REGISTRO §393). Só envolve a `ResultScreen` dessas três telas; os outros jogos seguem no teto base.

**Exports:** `RiftResultExtras({ extraCap, children })`.
**Quem chama:** `App.tsx` (Provider) e `ResultScreen`.
### `src/components/games/TorcidaKit.tsx`
**Dono de:** as peças de TELA da torcida (02/10/2026, decisão do dono; mascote em 04/10/2026): tocar em qualquer lugar da luta (ou no mascote) enche a BARRA DE CHEER, que despeja energia no pet. Só desenha e repassa o toque; a regra mora em `src/utils/energia.ts` (PvE) e em `functions/api/_duel.js` (duelo).
**Exports:** `TorcidaLayer({ onTap, active, isPt, children, style, mascot, onSwipe, swipeActive })` (envolve a luta, pega o `pointerdown`, solta o "grito" no ponto tocado — sem animação com movimento reduzido — e NÃO engole botão, link nem campo; com `mascot` desenha o **mascote da torcida** fixo no canto inferior direito, que a cada toque pula, levanta os pompons e mostra o balão "VAI!"/"CHEER!"; ele é um BOTÃO para teclado e leitor de tela; com `swipeActive`, o deslize horizontal de ≥ `SWIPE_MIN_PX` (44) chama `onSwipe(-1 | 1)` — a ESQUIVA do PvE) · `CheerMascot({ cheer, size })` (o pixel SVG de 16×16, só com tokens; `cheer` = braços e pompons para cima) · `SWIPE_MIN_PX` · `TorcidaGauge({ taps, onCheer, isPt, disabled, full, bare })` (a barra de cheer; `full` padrão = `CHEER_TAPS_FULL` (24); `bare` = a versão da cena de combate, SEM texto e SEM "?" na tela (A7, rodada 7): só a barra e o ícone — a explicação de torcer/anel/esquiva mora no InfoTip único da folha anterior (`DueloSheet`, `data-duelo-como-lutar`); sem `bare` mantém a frase e o botão "Torcer!").
**Quem chama:** `DuelScreen`, `ArenaGame`, `NightmareBattle`, `DungeonGame`.
**Sem barrinha (PR18, 06/10/2026, pedido do dono):** a barra de cheer saiu das telas de combate — fica só o ÍCONE do mascote (40 px de arte, alvo de toque 44) no canto; o que a torcida já encheu aparece como trecho claro na barra de ENERGIA do pet (`StageFighter.cheerPending`, `FighterBars`) e vira preenchimento real quando o motor soma a descarga. Nova prop `cheerRatio` (0..1, em `data-torcida-ratio`). Só UI: `CHEER` e `energyPerDischarge` intactos; `TorcidaGauge` segue exportado só para o layout antigo.
**`belowMascot` (15/10/2026, REGISTRO §75):** prop opcional (`ReactNode`) desenhada logo ABAIXO do mascote, alinhada à direita; a Masmorra põe aí o botão 1×/3× sem caixa. O mascote sobe 44 px quando ela existe.
**Carga do especial (04/10/2026):** no `bare`, o raio cinza ao lado da barra virou o cristal de carga do dono — `especialCargaArt(ratio)` (export) escolhe vazio (0) / meio (0<r<1) / cheio (1, especial pronto).
**Régua:** `src/components/games/TorcidaKit.test.tsx` (mascote no canto, pulo + balão por toque, reduced-motion, deslize), `DuelScreen.render.test.tsx`, `NightmareBattle.render.test.tsx`. Nasce muda (R-NOVA); keyframes `sm-torcida-burst`, `sm-cheer-jump`, `sm-cheer-bubble` em `src/index.css`.

### `src/components/games/BattleStage.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o marcador do efeito sobre o sprite (§328) e suas funções puras: `STAGE_FX_MARK_MIN`/`STAGE_FX_MARK_MAX` (24–75 px), `stageFxMarkSize(fieldW)` (17% da largura), `StageRect`, `stageBarsRect`, `Z_FX_MARK` (11), `StatusSide`, `FxMarkRowPlace`, `fxMarkAnchor`, `fxMarkRowPlacement`, `fxMarkIconSize`; `STAGE_STATUS_ICON` saiu; rótulo do ícone de estágio da plaquinha; camada do companheiro invocado (`SummonLayer`).
**Dono de:** a CENA de combate em tela cheia (02/10/2026, rodada 5/I10; maior e com energia em 04/10/2026) — o background cobrindo a viewport, o seu Soulmon embaixo à esquerda (BEM maior: até ~64% da largura) e o inimigo em cima à direita (0,66×), plataforma/sombra sob cada um, as barras EM CIMA de cada lutador, coladas nele (nome + HP numérico e, logo abaixo, a barra de ENERGIA, que pulsa quando cheia), o bouncing idle dos lutadores, o X no canto superior direito (com confirmação opcional), a barra de cheer no pé e os golpes com a arte de SKILL do ELEMENTO (investida `melee`, projétil `ranged`/`special`, escudo `shield`). Só DESENHA: o jogo decide e manda a ação (`StageAction`) e o número do dano com um selo curto (`StageHit`, `tag`) no instante do impacto.
**Cena do especial e som (PR18, 06/10/2026):** antes do golpe do ESPECIAL o NOME do ataque aparece grande no centro com o fundo escurecido, quem conjura e a aura ficam acima do véu e SÓ DEPOIS o golpe sai (pausa `SPECIAL_INTRO_MS` = 1000 ms, `introMs(kind)` em `utils/combatFx.ts`; apresentação pura — o motor não enxerga a pausa e nenhum evento muda de ordem; movimento reduzido reduz o movimento, nunca a pausa). É o ÚNICO chamador de `playAttack` (no impacto do golpe básico) e `playSpecial` (a subida cai no fim da cena, o estouro quando o golpe sai); a vitória (`playVictory`) toca nas telas (Arena por rodada, Duelo só se o pet venceu, Masmorra por andar, Pesadelo).
**Exports:** `BattleStage(props)` (`scene`, `me`, `foes[]` — cada um com `energy?` 0..1 —, `target`, `action`, `hit` (um ou vários), `badge`, `title`, `closeLabel`, `onClose`, `exitConfirm`, `onPauseChange`, `hud`, `status`, e as mecânicas do PvE: `charging`, `ring`/`onRingGrade`, `dodge`/`onDodge`, `petDodge`, `mechLabels`) · `ME_BELOW_FIELD` (52 px: quanto os pés do seu Soulmon ficam abaixo do fim do campo) · `stageFxMarkSize(fieldW)` / `STAGE_FX_MARK_MIN`·`STAGE_FX_MARK_MAX` (o MARCADOR do efeito no sprite: 17% da largura do campo, 24–75 px; ~61 px em 360 px; §328, revisto no PR #877) · `fxMarkIconSize(spot, side, { avoid, fieldW, fieldH })` (pura: o alvo, encolhido de 1 em 1 px só o necessário se os 3 marcadores de um canto não couberem; nas telas medidas só o inimigo do meio com 3 inimigos e o 2º com 2 inimigos em 360×500) · `fxMarkAnchor(side, zone)` (a borda de onde a fileira parte: inimigo debuff ←, buff →; pet espelhado) · `fxMarkRowPlacement(spot, side, zone, n, { icon, avoid, fieldW, fieldH })` (pura: a fileira de um canto — o 1º marcador na borda do sprite, os seguintes para dentro, dentro do campo, desvia das caixas de HP; `anchor`, `dir`, `fits`) · `stageBarsRect(spot, tone, hasElementIcon, barsH, fieldW)` (pura: a caixa de HP/especial, a mesma conta do `FighterBars`) · `Z_FX_MARK` (11: os marcadores ficam na frente do sprite, do véu, da aura e do nome do especial; só o escudo segue sobre o corpo; REGISTRO §330/§328) · `foeFacesRight(layout, i)` (o inimigo à esquerda do jogador olha para a direita, §200) · `BATTLE_LAYER_STYLE` (o estilo da `TorcidaLayer` que a envolve: fixa, tela cheia) · `stageLayout(w, h, nFoes)` (pura: onde cada um pousa) · tipos `StageFighter`, `StageAction`, `StageHit`, `StageLayout`, `Spot`, `BattleStageProps`.
**Quem chama:** `ArenaGame` (durante a luta, no caminho sem as flags de timing), `DuelScreen`, `DungeonGame` e `NightmareBattle` (desde 04/10/2026).
**FX de status e cast (PR11; §328; §330; §331):** `StageFighter.status` desenha a camada de status: o ESCUDO sobre o corpo (`fx-shield`) e um MARCADOR ANIMADO por efeito no canto do sprite (§328: a folha em loop DO EFEITO E DA VARIANTE, `statusLoopId(kind, variant)`, recortada no conteúdo, `STATUS_LOOP_CROP`; sem folha, a peça estática). Desde §336 (13/11/2026, arte nova sem identidade) cada efeito toca a SUA folha: lento `fx-lento`, defesa em baixa `fx-debuff-def`, ataque em alta `fx-buff-atk` (e físico/mágico), velocidade em alta `fx-buff-spd` (e aceleração) e cura `fx-cura` deixaram de emprestar a do buff/debuff genérico; o marcador expõe `data-stage-fx-sheet`. INIMIGO: debuff em cima à esquerda (1º na borda esquerda, seguintes à direita), buff embaixo à direita (1º na borda direita, seguintes à esquerda); SEU SOULMON espelhado: debuff em cima à direita, buff embaixo à esquerda. Ordem = início do efeito; até `MAX_STATUS_CHIPS` (3) por canto, sem "+k"; `data-stage-fx-mark`/`-turns`/`-variant`/`-crop`, fileira com `data-stage-fx-anchor`/`-order`. Desde §331 (dono, 13/11/2026) o efeito aparece UMA vez: o selo de 22 px com contador ao lado da barra de HP/especial (`data-stage-status*`, `STAGE_STATUS_ICON`, `.sm-bs-stpop`) saiu; cada marcador e o escudo levam o `aria-label`/`alt` EN/PT com efeito + turnos (`statusAriaLabel`; `isPt`). O marcador só entra quando a arte (`combatV3Art`, sob demanda) chega. O especial ganha o círculo `data-stage-cast="special"` nas 4 telas. O Duelo deriva o status dos eventos do núcleo já chegados (`duelStatusBoard`). Movimento reduzido: o marcador fica no 1º quadro, a mesma informação. Régua: `BattleStage.status.test.tsx`, `*.pr11.render.test.tsx` (Arena, Masmorra, Pesadelo, Duelo).
**Régua:** `src/components/games/BattleStage.test.tsx` (layout em números; o que cada ação desenha; escudo no lugar do impacto; movimento reduzido); `ArenaGame.torcida.render.test.tsx`, `DuelScreen.render.test.tsx`. Nasce muda (R-NOVA); keyframes `sm-bs-*` em `src/index.css` (e as regras de movimento reduzido no bloco canônico).
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** `StageFighter.stageIcon?` (id da forma → `EstagioIcone` antes do nome na placa; cai em `stage` no inimigo; bebê/ausente = sem ícone). `StageAction.impacto?: ImpactoMelee` (corpo a corpo: `concussao` troca o corte pelo splash) e `cut?` — o golpe `ranged` vira CORTE (lâmina que viaja até o alvo) quando `cut` ou `impacto === 'corte'` (decidido por elemento, 08/11): a lâmina/projétil **nasce pequena e cresce** (~0 → 100%) nos dois sentidos pela escala de perspectiva de `projectileScaleRange` (`utils/combate/projetilEscala.ts`, `--s0`/`--s1`, classe `sm-bs-persp`); o loop de status ganhou `lento`, `queimadura`, `veneno` em `LOOP_PRIORITY`; `useMiraFlash` pisca o anel de mira.

### `src/components/games/useGroupBattle.ts`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** devolve `summon: readonly number[]` (turnos do companheiro de cada lutador; o contador real `FighterFx.comp`; índice 0 = pet, 1+i = inimigo; `SEM_COMPANHEIRO` é a mesma referência vazia sempre).
**Dono de:** o RELÓGIO da luta em GRUPO da Arena no núcleo v3 (PR3b): consome os eventos de `groupFightSteps` (`attack`/`tick`/`ko`/`cast`) no relógio do núcleo, em segundos. A animação do golpe começa `impactMs` antes e o número e a barra mudam NO IMPACTO; evento novo com a animação rodando a CORTA no impacto; o especial em área desenha o hit em todos os alvos do mesmo instante; o `cast` do pet PAUSA o relógio (anel) e o do inimigo abre a esquiva; a torcida vira descarga por `cheerDrain`.
**Exports:** `RING_LEAD_MS` (1000 ms entre o anúncio do especial e o anel, §202) · `useGroupBattle({ running, paused, reduced, runKey, seed, round, scene, onEnd })` → `{ action, hits, hp, foesHp[], petEnergy, foeEnergy[], meter, phase ('idle' | 'ring' | 'dodge'), ring, dodge, petDodge, charging, status ({ me, foes[] }: os efeitos que o núcleo deixou, PR11), cheer(), swipe(dir), resolveRing(grade), stateKey, clock() }` · tipos `GroupRound`, `GroupScene`, `GroupBattle`, `GroupBattleOptions`.
**Quem chama:** `ArenaGame`, `DungeonGame` e `NightmareBattle` (a Masmorra e o Pesadelo, com 1 inimigo por luta, desde o PR4 — o `usePveBattle` foi apagado).
**Régua:** `ArenaGame.torcida.render.test.tsx`, `DungeonGame.defesaAuto.render.test.tsx` e `NightmareBattle.render.test.tsx` (instrumentam a entrada do núcleo por `vi.mock`); `arena.semRandom.contract.test.ts` e `dungeon.v3.test.ts` (sem `Math.random`).

### `src/components/games/useMiraFlash.ts`
**Dono de:** o marcador do ALVO POR TOQUE (dono, 03/11/2026): o anel tracejado dourado aparece só por 1 s depois do toque num inimigo e some; a escolha continua valendo (`aria-pressed`). Tocar de novo reacende. Estático, então vale igual com movimento reduzido.
**Exports:** `MIRA_FLASH_MS` (1000) · `useMiraFlash()` → `[foe | null, flash(foe)]`.
**Quem chama:** `BattleStage` e `Match3Game`.
**Régua:** `BattleStage.alvo.test.tsx`, `Match3Game.render.test.tsx` (ALVO POR TOQUE).

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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** a Fenda sem limite diário nem teto por level/Vínculo: `layersToday` no lugar de `dungeonLayerCap`/`startLayerFor`; `riftStartLayer`/`consumeResume` (retomada pelo mapa `RiftMap`, §462); minichefe por `isMiniBossFight`/`riftSetOfLayer`; Bits da run pelo teto diário por categoria (`minigameBitsCap`); fator da masmorra 0,2 → 2/3/4/5/6 (§372); companheiro invocado e `RiftResultExtras` no resultado.
**Dono de:** o minijogo Masmorra — descida automática e infinita (08/10/2026: lutas encadeadas por `DUNGEON_AUTO_FIGHT_MS`, HP persistente `dungeonHp`, marco no andar 5; constantes em `utils/dungeonIdle.ts`; ⚰️ `MAX_FLOORS` e os botões de próximo), escada de 6 inimigos por andar. **Desde 04/10/2026 a luta é a `BattleStage` em tela cheia; desde o PR4 do Combate v3 (06/10/2026) o MOTOR é o núcleo (`utils/combate/`, `groupFightSteps` com 1 inimigo, a regra de cada luta em `utils/dungeonFight.ts`) e o relógio é o de `games/useGroupBattle.ts`, com o inimigo RELATIVO ao level do jogador (`dungeonFoe`) e o ofício por `jeitoParaPve`: o Soulmon golpeia e se defende sozinho, HP e ENERGIA em cima de cada lutador, mascote da torcida, barra de cheer no pé; a barra de cheer e a energia do pet **PERSISTEM entre os inimigos e as camadas** (os cartões de inimigo caído, camada limpa, fim e derrota moram SOBRE a mesma cena); energia cheia = especial com o ANEL; o especial do inimigo pode ser esquivado deslizando o dedo; HP, energia e barra de cheer atravessam as lutas (~20–29 s por inimigo). A `TimingBar` saiu desta tela (`pixel/TimingBar.tsx` fica no repo). Prop nova `petElement?` (a arte dos golpes).
**Props principais:** `Popup` (interface interna) e as props recebidas do `AreaView` (⚰️ antes da `ActivitiesPage`; não redeclaradas aqui em detalhe — arquivo de **577 linhas**, `wc -l`, 22/09/2026; eram 568 em 10/09/2026). **Nova em `cf6315e1`: `onFloorCleared?: () => void`** (decisão do dono #59b) — o componente não expunha o momento "andar limpo": só `onEnemyDefeated`, `onEarnPoints` e `onGlitchtama` (a run inteira), e era por isso que o `BondEvent` `dungeonFloor` da tabela do §55 nunca tinha emissor. É chamada em `onFloorCleared?.()` **antes** do `if (floor >= MAX_FLOORS)`, de propósito: o 5º andar é um andar limpo **e** uma run completa, e a tabela paga os dois — quem limita é o teto diário de `bond.ts`.
**Exports:** `DungeonGame(props)` · `clearBonus(floor)` (⚰️ `MAX_FLOORS`) — Bits do andar limpo, `10 + 5 × (floor − 1)` (ambos exportados na minimal-ui F5 para a folha-porta `play/PlaySheets.tsx` citar os números do dono). Delta `ae366480..5edfcfba`: `clearBonus(floor)` agora é `Math.round((10 + 5 × (floor − 1)) × DUNGEON_BITS_FACTOR)` (constante de `utils/dungeon.ts`, 0,2 → 2/3/4/5/6 desde 14/11/2026, REGISTRO §372; ⚰️ 0,4 → 4/6/8/10/12 de 30/09 a 14/11; ⚰️ era 10/15/20/25/30, decisão do dono de 30/09/2026 — uma run completa fica perto do teto diário); o arquivo importa `DUNGEON_BITS_FACTOR` (o `playerStatsFor` saiu no PR4).
**Estado/efeitos relevantes:** `useState` para `enemies`, `enemyIdx`, `hpFrac`, `fightKey`, `phase`, `rewardMsg`, `baseLevel` (de `getDungeonDifficulty()`), `floor`, `best` (de `getDungeonBest()`), `runScore`, `runScenes` (de `buildRunScenes()`); `useRef`/`useCallback` (`after`, temporizadores); toca `playFeed` (`src/utils/sounds.ts`); chama `buildDungeonWave`, `recordDungeonScore`, `setDungeonDifficultyAtLeast`, `deepStartCost`/`canBuyDeepStart` de `src/utils/dungeon.ts`.
**Chamado por:** `src/components/nav/AreaView.tsx` (lazy, lote Masmorra da Exploração, minimal-ui F5; ⚰️ até então `ActivitiesPage.tsx`); `src/components/play/PlaySheets.tsx` importa `MAX_FLOORS`/`clearBonus` (24/09/2026).
**Régua:** `src/components/DungeonGame.defesaAuto.render.test.tsx` (a cena, a defesa automática e a persistência da barra de cheer e da energia entre os inimigos) e `DungeonGame.profissao.render.test.tsx` (o ofício no lobby); a régua de tetos globais (Glitchtama, coraçãozinhos) vive nos testes de `src/utils/dungeon.ts`/`specialItemUse.ts`.
**Avisos do arquivo:** ⚠️ `MAX_FLOORS` mora AQUI, não em `utils/dungeon.ts` — achado na auditoria de 09/09/2026 (`CLAUDE.md`, linha ⚔️ Masmorra); sem limite diário e sem gate de entrada; perder custa só a run (nunca corações). Desde `84ae4937` (21/09/2026, copy §4 da bíblia): o VOCABULÁRIO de jogador mudou — "camada"/"layer" (não andar), "descer"/"descida" (não entrar/run), vencer é o inimigo "parar de insistir" (nunca "derrotado"/"defeated"; EN nunca "passed"), a derrota é "Você subiu. A descida ficou pelo caminho" + a linha dos corações intactos; contagens vêm de `MAX_FLOORS`/`ladderLen`, nunca à mão; duas linhas de contexto (a fenda como assentamento falho; a camada mais antiga) e a frase do Glitchtama com o nome mantido (P5 decidida pelo dono em 21/09/2026); desde a minimal-ui o item se usa pela "mochila"/"Backpack" (⚰️ era "pastinha de itens"). Os SÍMBOLOS (`MAX_FLOORS`, `floor`, `startRun`, `exitRun`) não mudaram.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** **Cenário por elemento:** cada camada usa o cenário do ELEMENTO dela (`elementoDaCamada(layer)`, 2 camadas por elemento — `CAMADAS_POR_ELEMENTO` em `utils/dungeonElementos.ts`), via `combatSceneBgDaCamada(id, layer)` (`utils/combatArt.ts`; elemento composto sem arte própria gira entre os cenários das bases componentes pela camada, REGISTRO §258); o sorteio antigo `runScenes` ficou só de reserva. **Ponto de retorno:** a descida recomeça em `startLayerFor(recorde, teto)` — depois do último múltiplo de `DUNGEON_RETURN_EVERY` (= 2) já limpo (antes: 5, `utils/dungeonIdle.ts`); o marco de prêmio segue a cada 5 camadas (§251). `onGlitchtama` agora recebe `{ runReward, drop }` (recompensa da run 1× por descida no 1º marco; o 🌀 raro, 1%/marco, 1/semana, `utils/glitchtamaDrop.ts`) e `onEarnPoints` devolve os Bits realmente creditados (teto diário). **Poções:** ao SAIR com a descida viva abre `DungeonPotionsModal` ("Poções para o Soulmon"): `deixarPocoes`/`devolverPocoes`/`recolherPocoes` de `utils/dungeonPotions.ts`; o Soulmon usa as deixadas sozinho nas quedas. O botão de velocidade é `useBattleSpeed`/`BattleSpeedButton` (`games/BattleSpeed.tsx`, preferência única por aparelho); o resultado lista essências (`essenceLedgerRows`) e usa `EnergyCost`/`lotIconName`; o golpe leva `efeitoElementoPve`.

### `src/components/EditModal.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `CATEGORIES` vem de `ACTIVITY_CATEGORIES` (lista única de 10 categorias).
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

**Atualização 23/11/2026:** a tela de erro mostra a linha "Detalhes: <mensagem> · v<versão> · <build>" (`detalhesDoErro`, também no link de feedback, em produção) e o botão Recarregar limpa caches/SW antes do reload (`limparSwERecarregar`).
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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o botão fechar é `CtaButton width="auto"`; a linha de fragmentos destaca o termo (`emphasizeSoulFragment`).
**Dono de:** a TRANSFORMAÇÃO que fecha o cristal da evolução (refeita em 31/10/2026, REGISTRO §208, sem vídeo nem sunburst; e de novo em 03/11/2026, revisão visual P1+P2 aprovada pelo dono): num PALCO 9:16 que cobre o vidro (container query) sobre o fundo `SCENE_BG.evolucao` (agora o B-bg2, altar em ≈61% da altura), seis tempos (~6 s) — a forma antiga se despede dentro do cristal, o cristal carrega (`EVOLUCAO_ART.build`), racha (`cracks`), estilhaça (`shards` + `flash`), a forma nova surge grande (58% da largura) sobre o `pedestal` com `leaves`, e um respiro de 600 ms antes da faixa. Faixa final: cartão antes→depois (`EVOLUCAO_ART.card`, forma antiga e nova nos soquetes, nome no meio), data e fragmentos numa linha, pontos zerados pequeno, botão. `prefers-reduced-motion` = estado final direto (forma nova no pedestal), commit na montagem. Não há "pular ao tocar".
**Props principais:** `EvolutionCeremonyProps` — `fromStage`, `toStage`, `toName`, `language`, `demoCharacterId?`, `fromSpriteUrl?`, `toSpriteUrl?`, `reachedAt?`, `fragmentsSpent?` (custo em Fragmentos de Alma, dito uma vez ao concluir), `onEvolved()` (commit da evolução, no começo da revelação), `onClose()`.
**Exports:** `CeremonyPhase` (`despede`/`carrega`/`racha`/`estilhaca`/`revela`) · `PHASE_AT` · `SURGE_MS` (800) · `RESPIRO_MS` (600) · `TOTAL_MS` (6000 ms) · `ALTAR_Y` (61) · `FORMA_W` (58) · `SHARDS` · `EvolutionCeremony(props)`. Artes em `src/utils/criacaoEvolucaoArt.ts` (`EVOLUCAO_ART`).
**Estado/efeitos relevantes:** `phase`, `done`, `evolvedRef`; timers por `PHASE_AT`; a cerimônia espera o gesto de saída (RIT-20).
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/EvolutionCeremony'" src`, 09/09/2026).
**Régua:** `src/components/evolucaoCristal.render.test.tsx` (6 tempos, reduced-motion, artes, cartão) e `EvolutionCeremony.fragmentos.render.test.tsx`.
**Avisos do arquivo:** o botão de saída é "Seguimos juntos"/"We keep going together" desde `84ae4937` (21/09/2026, copy §3.2) — a MESMA saída relacional do `MilestoneCeremony`. ⚠️ o `CLAUDE.md` (seção "DUAS FILAS") registra que esta cerimônia (z-500) chegou a abrir junto do `EvolveTaskModal`, que reaparecia por baixo cobrando "crie mais atividades" quando ela fechava — achado na auditoria de 06/09/2026, corrigido pela fila de intersticiais declarada no `App.tsx`.

### `src/components/evolution/EvoBar.tsx`

**Dono de:** a barra de evolução na arte B (`barra-evolucao-B` 1x/2x, `aspect-ratio: 480/128`, canal medido x 19–456 / y 58–68) com o preenchimento desenhado em código dentro do canal; usada pelo `EvoRecapModal` e pela barra de fragmentos da `EvolutionPath` (mesma aparência em todas as barras de evolução). Mantém `role="progressbar"` e `aria-valuemin/max/now/label`. CSS `.sm2-evo-barra*` em `src/index.css`.

### `src/components/EvolutionRing.tsx`

**Dono de:** o anel circular (SVG) de cada ramo de evolução na `EvolutionPath` (tarefa 23): preenchimento = pontos do ramo ÷ pontos do ramo líder, número ao centro, texto para leitor de tela; só visualiza dado existente, sem regra. Props: `value`, `max`, `color`, `label`. CSS `.sm2-evo-ring*` em `src/index.css`. Teste: `EvolutionRing.render.test.tsx`.

### `src/components/EvolutionPath.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** Ultra só abre com as três Megas liberadas e só então a barra acumula (`megasLiberadas`, `ULTRA_MEGA_IDS`, `gaugeTravadaPelasMegas`; `canReachUltra` não olha mais os pontos); prop `glitchtamaBuffAte`; `onSwitchForm(targetStageId, elemento?)` leva o elemento da forma alternativa; ícone de estágio colorido pelo caminho.
**Dono de:** a página de Evolução — a árvore por galho, o cadeado `evolutionLocked`, a cerimônia manual, o spoiler-guard de formas futuras e o desempate por ritmo de cuidado.
**Props principais:** `EvolutionPathProps` (arquivo de 1179 linhas — `wc -l src/components/EvolutionPath.tsx`, 10/09/2026, corrigido de "1180" por doc-verificador; props cobrem estágio atual, galhos, `unlockedEvolutions`, sprites por forma, idioma e os callbacks de evolução/cadeado — ver o corpo a partir da interface). **Botão Evoluir** (31/10/2026, REGISTRO §208): com a barra a 100% o `EvolveButton` aparece sob a frase de progresso (mesmo gesto do visor e da Home). **`incubating?`** (desde 31/10/2026 = o Soulmon está NO CRISTAL; WP4.29, `8be8f9c5`/`355959b4`, D-G8c): com a barra cheia e a forma incubando o toque NÃO evolui (`evoluiNoToque` exige `!incubating`), a frase vira "A próxima forma está tomando corpo. Leva um tempo — volte quando quiser, ela espera por você." (vem antes do cadeado) e o rótulo do visor diz o mesmo em vez de prometer um gesto que o `handleEvolve` recusaria.
**Exports:** `EvolutionPath(props)`.
**Estado/efeitos relevantes:** 11 ocorrências de `useState`/`useEffect`/`useRef`/`useMemo` (`grep -c`, 09/09/2026; desde `592e2c14` mais `spriteQuebrado` — a URL própria que falhou ao carregar cai na reserva via `onError`, E2 da QA Rodada 2, como no `CompanionHUD`; e o card usa `SM2_SHADOW_CARD` do `FormKit`); usa `SoulNode`/`AlignmentIcons` para o desenho; `useVarreduraDeSintonia` mora em `ui/Viewport.tsx` (não duplicado aqui, de propósito); lê `canManualRetry`/`cardState`/`displaySprite` de `src/utils/spriteLibrary.ts` e `pointsToEvolve` de `src/utils/spriteTrigger.ts`.
**Chamado por:** `grep -rl "from '.*/EvolutionPath'" src` (testes próprios + `src/components/sintonia-chiado.render.test.tsx`); consumo real em `src/App.tsx` via `lazy(() => import('./components/EvolutionPath'))` (09/09/2026).
**Régua:** `.credencial.render.test.tsx`, `.estados.render.test.tsx`, `.scanline.render.test.tsx`, `.silhueta.render.test.tsx`, `.sintonia-anuncio.render.test.tsx`, `.sprite.render.test.tsx`; evolução manual travada por `src/components/evolucaoManual.contract.test.ts`.
**Avisos do arquivo:** progresso virou PALAVRA ("Faltam N dias completos"/"O padrão está pronto. Ele espera você encostar."), a barra é só apoio visual; desde `84ae4937` (21/09/2026, copy §3): `tituloDoVisor` é "Encostar"/"Touch it" (evolui no toque), "Soltar"/"Release" e "Segurar"/"Hold" (o par do cadeado — nunca "travar"/"lock"); com o cadeado fechado e a barra cheia a frase é "Ele espera. Esperar não tira nada dele." (a pessoa nunca é causa de um "mas"); a nota do cadeado perdeu "nos dias difíceis" (avaliava o dia) e a 2ª oração "Toque no seu Soulmon para evoluir" FICA porque `evolucaoManual.contract.test.ts` exige o gesto ensinado; atributos usam UM desenho só (SVG inline de `AlignmentIcons`), não mais PNG pixel-art + SVG divergindo na mesma tela; situação de cada nó sempre dita em palavras no `aria-label` (WCAG 1.4.1 — cor/posição nunca é o único portador).
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** a árvore deixou as abas por galho: `caminhos` = os três galhos (`ATTR_ORDER`) lado a lado, saindo do rookie e voltando ao ultra por `TreeLinks({ mode: 'split'|'join' })` (conectores SVG coloridos por atributo; REGISTRO §256); ⚰️ o `PixelTabs`, o `selectedBranch` e o gesto de deslizar entre abas saíram. Cada nó é uma coluna (arte `SoulNode`, nome, `EstagioIcone` + nome do estágio, selos ATUAL/PREVISTA/SEGURADA/ZÊNITE/BLOQUEADA) e **tocar numa forma liberada abre o modal da forma** (`opcoes`, `FormasAlternativasSheet`) em um de três `modo`: `degenerar` ("Degenerar para…", forma de nível ABAIXO do atual, de qualquer galho, e desde 09/11 também o **rookie**/tronco — `isPreviousStage` usa `stageLevelIndex`, não mais o galho do cartão), `equipar` (forma atual ou troca LATERAL grátis de mesmo nível, `canSwitchLaterally` de `utils/trocaLateral.ts`) e `ver` (nível acima, só leitura); forma trancada ("?") não abre nada. Props novas: `onSwitchForm(targetStageId)`, `spriteLibraryReal`, `formasAlt`, `formaAltEquipada`, `onEquipFormaAlt(formId, elemento)`. O elemento escolhido no modal vale DEPOIS da troca (`equiparDepois`): equipar a forma atual aplica elemento, ataque e especial da forma (`trocarFormaCompleta` de `utils/formaSnapshot.ts`, que guarda a foto `formaSnapshot` de cada forma ao sair dela). A forma PREVISTA vem de `forecastNodeId` (`utils/evolutionForecast.ts`). Régua nova: `EvolutionPath.arvore.render.test.tsx`.

### `src/components/EvolveTaskModal.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o termo Fragmento(s) de Alma é destacado (`emphasizeSoulFragment`).
**Dono de:** modal pós-evolução que pede para criar tarefas suficientes para garantir o próximo dia completo no novo estágio.
**Props principais:** `EvolveTaskModalProps` — `isOpen`, `onClose`, `onCreateTask()`, `requiredTasks`, `registeredTasks`, `stageName`, `language?`.
**Exports:** `EvolveTaskModal(props)`.
**Estado/efeitos relevantes:** nenhum — função pura de apresentação; calcula `hasEnough`/`missing` a partir das props.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/EvolveTaskModal'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'EvolveTaskModal.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** ver o aviso da fila em `EvolutionCeremony.tsx` acima — este modal já reapareceu por baixo da cerimônia, cobrando tarefas; hoje entra na fila de intersticiais declarada no `App.tsx`.

### `src/components/FeedbackModal.tsx`
**Dono de:** o modal de feedback da Home (REGISTRO §223): `ModalSheet` com Feedback/Sugestão/Bug (`Segment`), textarea (contador /2000), Enviar/Tentar de novo, estados de envio/sucesso/erro em PT/EN. Controlado pelo pai: o rascunho nunca se perde em falha.
**Exports:** `FeedbackModal`, `feedbackCopy(language)`, tipo `FeedbackStatus`.
**Quem usa:** `components/nav/HomeFeedbackButton.tsx`.

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


### `src/components/GamePopups.tsx`
**Dono de:** wrapper que hospeda os popups de minijogo/marco — hoje só encaminha para `FirstTaskCompletedPopup`.
**Props principais:** `GamePopupsProps` — `showFirstTaskPopup`, `onCloseFirstTaskPopup()`, `language?`.
**Exports:** `GamePopups(props)`.
**Estado/efeitos relevantes:** nenhum — repassa props para `FirstTaskCompletedPopup`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/GamePopups'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'GamePopups.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** nenhum.

### `src/components/GameTutorialFlow.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o tutorial usa as 10 categorias (`ACTIVITY_CATEGORIES`: sono, corpo, mente, foco, aprendizado, relacoes, casa, financas, proposito, criatividade), cada uma com o exemplo de hábito próprio.
**Dono de:** o segundo onboarding (depois do nascimento do oráculo) — duas telas: a promessa central e a criação obrigatória da 1ª atividade, com sugestões de tarefa por IA.
**Props principais:** `TutorialPage` (interface interna) · `GameTutorialFlowProps` (props do fluxo — objetivo, categorias, callback de conclusão).
**Exports:** `SHOP_AND_CURRENCY_PRIMER` (const — único assunto das 5 páginas removidas que o `GuideModal` ainda não cobre) · `GameTutorialFlow(props)`.
**Estado/efeitos relevantes:** `useState` (`step`, `goalText`, `selectedCats`, `suggestions`, `loading`, `searched`, `selected` e, desde `592e2c14`, **`falhaIa: 'offline' | 'error' | null`**); `useMemo` (`categoriasOrdenadas`, via `orderCategoriesForGoal`); chama **`suggestTasksResult`** (`src/utils/taskSuggestions.ts`, mesma API do chat — `functions/api/suggest-tasks.js`; ⚰️ `suggestTasks`, que apagava a diferença entre "veio vazio" e "quebrou"). **E1 (QA Rodada 2):** falha com nome — `<p role="status" data-ai-failure="offline|error">` ("Sem conexão agora — estas são sugestões locais…" / "A IA não respondeu agora…"); as sugestões locais vêm mesmo assim; vazio legítimo não mostra falha. **A10:** o hint "Este texto vai para o provedor de IA…" (`data-ai-hint`) FICA enquanto o botão puder ser tocado (⚰️ sumia depois da 1ª busca, com o botão vivo e o texto saindo a cada toque).
**Chamado por:** `grep -rl "from '.*/GameTutorialFlow'" src` vazio; consumo real em `src/App.tsx` via `lazy(() => import('./components/GameTutorialFlow'))` (09/09/2026).
**Régua:** `src/components/GameTutorialFlow.render.test.tsx` (desde `5513b5b6`, 20/09/2026; +4 casos em `592e2c14`: offline/erro/vazio legítimo/hint que fica; ⚰️ "nenhuma" era a leitura de 09/09/2026).
**Aviso de IA (desde `a6c1cd8a`, compliance #2 da QA Rodada 1):** o campo do objetivo nasce pré-preenchido com o `soulGoal` do onboarding — que a política dizia não passar por IA —, então o hint diz "Este texto vai para o provedor de IA se você pedir sugestões." (⚰️ "Seu objetivo é enviado à IA para escrever as sugestões."); provisório "declarar" até o dono decidir declarar × cortar (#42). Guard da fronteira: `src/ia.camposEnviados.contract.test.ts`.
**Avisos do arquivo:** eram ~12 telas antes do primeiro toque (splash + 4 do demo + 6 conceituais + criação + `WelcomePromptModal`), reduzidas a 2 — as 5 páginas conceituais removidas já estavam ditas, melhor, no `GuideModal`/`HelpModal`; era o último consumidor de `lucide-react` do `src/` — migrado para `<Icon>`, guard `iconScale.contract.test.ts` acusa reimportação.

### `src/components/GuideModal.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** textos lidos das constantes novas: Arena (`ARENA_CHOICES`, `ARENA_ROUNDS`, `ARENA_ULTIMO_DROP_MULT`, `ARENA_REROLL_FREE_PER_DAY`), Ultra (`ULTRA_MEGA_IDS`), aprimorar peça (`upgradeBitsCost`), pacotes de Bits (`BITS_PACK_DAILY_CAP`), dormir (`SLEEP_ENERGY_REGEN_BONUS`); `emphasizeSoulFragment`.
**Dono de:** o Guia — capítulos fechados por padrão (ganhou o da Guilda, `id: 'guild'`, cuja copy é de `guildText('guild.guide.*')` — sem número à mão), cada número vindo de uma constante (não de texto à mão).
**Props principais:** `GuideModalProps` — `isOpen`, `onClose()`, `language?`.
**Exports:** `GuideModal(props)`.
**Estado/efeitos relevantes:** `useState<string|null>` (`open`, qual capítulo está expandido); importa dezenas de constantes de regra (`FOOD_LIMIT_PER_HOUR`, `FORM_REQUIREMENTS`, `MAX_HEARTS_LOST_PER_DAY`, `HABIT_MILESTONES`, `CONSTANCY_WINDOW_DAYS`, `REST_SHIELD_MAX`, `DREAM_CATALOG` etc.) para os números do texto nunca serem hardcoded. Desde WP4.29 (`8be8f9c5`) o capítulo de evolução tem o parágrafo da incubação ("a próxima forma começa a tomar corpo… nada se perde no caminho") — sem número nem unidade de tempo (R-I), com as três metades que o parecer R-N exige. Delta `ae366480..5edfcfba`: ganhou um parágrafo do duelo do Torneio ("os pets lutam sozinhos; você torce três vezes… torcer só ajuda") no capítulo de jogos, em PT/EN por `L(...)`. Delta `cfe27cc7..3532ccf5`: capítulo novo `id: 'passeio'` ("Passeio e Travessias" / "Stroll and Crossings") — três parágrafos, sem número (não há contagem de regiões nem prazo a mostrar).
**Chamado por:** `grep -rl "from '.*/GuideModal'" src` → `src/components/ContentModals.tsx` (lazy) e `src/components/GuideModal.gateReal.render.test.tsx` (09/09/2026).
**Régua:** `src/components/GuideModal.gateReal.render.test.tsx`.
**Avisos do arquivo:** era 16 seções/~60 parágrafos, cortado para 7 capítulos fechados — a pergunta de corte foi "isto muda alguma decisão do jogador?"; todo número do texto vem de constante importada, nunca escrito à mão.

### `src/components/HabitConstancy.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** perdeu a referência ao cartão semanal de domingo (apagado).
**Dono de:** o indicador de constância de um hábito (grade "N das últimas 7", sem streak).
**Props principais:** `HabitConstancyProps` (exportado) — recebe `HabitRhythm`, `Schedule`, `language`.
**Exports:** `TIER_FILL` (mapa tier→fração do glifo de maturidade) · `HabitConstancyProps` (interface) · `dotStyle(state)` — estilo de um ponto da grade · `MaturityGlyph({tier,aura,label})` — o selo de maturidade · `ConstancyWindow({rhythm,now,language,hideMetrics})` — a grade "N das últimas 7" sozinha · `HabitConstancy(props)` · `default`.
**Estado/efeitos relevantes:** nenhum estado — apresentação pura sobre `constancy`/`habitTier`/`dayKeyOf`/`steadyWindow` de `src/utils/habitRhythm.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/HabitConstancy'" src`, 09/09/2026).
**Régua:** `src/components/HabitConstancy.hideMetrics.render.test.tsx`; também exercitado por `src/components/dailyList.sm2.render.test.tsx`.
**Avisos do arquivo:** sem streak de propósito — falha custa ~14% (1/7), não 100%; cada estado tem FORMA própria, não só cor (quadrado cheio=feito, losango=protegido, anel vazado=falta, traço=não devido); dia protegido por escudo conta como feito e usa a cor de destaque, nunca a de falta.

### `src/components/HelpModal.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** glossário: energia (×`SLEEP_ENERGY_REGEN_BONUS` dormindo), "A Ranqueada abre no Vínculo N" (`GATES.ranqueada`), Bits e pastinha (convenção `.exe`).
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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** a abertura toca direto: saiu a tela "Tap to start" (`precisaDeAbertura`, §292).
**Dono de:** a splash screen do cold start — toca o vídeo de marca e cai no gate de onboarding/app principal.
**Props principais:** `{ onFinish: () => void }` (tipo inline, sem interface nomeada).
**Exports:** `IntroScreen(props)`.
**Estado/efeitos relevantes:** sem tela de abertura desde 11/11/2026 (§292: `TelaDeAbertura`/`precisaDeAbertura` removidas; a intro abre direto e o tema liga no 1º gesto, pelo ouvinte de `main.tsx`; o toque de pular chama `iniciarTemaNoGesto()`); `useState` (`leaving`, `videoFailed`); `useRef` (`doneTimerRef`, `leaveTimerRef`); `useEffect` agenda `scheduleFinish(1500)` como fallback, substituído pela duração real do vídeo quando conhecida; toque/clique pula direto com o mesmo fade de 400ms.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/IntroScreen'" src`, 09/09/2026).
**Régua:** `src/components/IntroScreen.render.test.tsx`.
**Avisos do arquivo:** puramente cosmético, self-dismiss via `onFinish`; cai para o wordmark raven/gradiente se o vídeo falhar (WebView antiga sem suporte ao formato).

### `src/components/ui/IntroWelcomePill.tsx`
**Dono de:** o selinho "Welcome"/"Bem-vindo" no topo que oculta o patch/versão pintado na arte da intro (REGISTRO §79); CSS `.sm2-intro-*` em `src/index.css`.
**Props principais:** nenhuma.
**Exports:** `IntroWelcomePill()`.
**Estado/efeitos relevantes:** nenhum; lê o idioma. Ancorada na caixa `cover` 9:16 do vídeo (cq), `aria-hidden`, `pointer-events: none`.
**Chamado por:** `src/components/IntroScreen.tsx` (abertura e vídeo).
**Régua:** `src/components/IntroScreen.render.test.tsx`.
**Avisos do arquivo:** as regiões (% do quadro 720x1280) são da arte atual; arte nova exige remedir.

### `src/components/ItemsWindow.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** exports novos: `EXE_SUFFIX` (`.exe`), `isExeItem(key)` (chip, premium, prato e itens sem `kind`) e `getFileName(key, lang)` (nome + `.exe`) — a pastinha é uma pasta de arquivos.
**Dono de:** os nomes e descrições (PT/EN) de comida e item especial. ⚰️ **A tela da Pastinha (`ItemsWindow(props)`, `ItemsWindowProps`, `effectLine`) foi apagada no fechamento da minimal-ui (F6, 24/09/2026)**: desde a F2 a entrada de item é a Mochila da Home (`home/Mochila.tsx`) e nada mais abria a pastinha (`handleOpenItems` sem chamador).
**Exports:** `getFoodDesc(emoji, lang)` · `getFoodName(emoji, lang)` (exportada desde `a6c1cd8a`, PL-5 — dono único do nome do alimento/item no idioma da pessoa; o `CompanionHUD` a importa em vez de derivar um nome só EN de `FOOD_BY_CATEGORY`).
**Estado/efeitos relevantes:** nenhum; lê `SPECIAL_ITEMS` de `src/utils/shop.ts`.
**Chamado por:** `src/components/home/Mochila.tsx` (`getFoodName`, `getFoodDesc`) (`grep -rl "ItemsWindow'" src`, 24/09/2026; ⚰️ o `CompanionHUD`, que importava `getFoodName` desde `a6c1cd8a`, não importa mais).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'ItemsWindow.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** o emoji É a chave de inventário (`utils/shop.ts`) — nenhum PNG paralelo, para não repetir o bug de moeda que a loja teve com duas representações do mesmo item.

### `src/components/FriendTraining.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o treino com amigo leva o companheiro invocado (`invoca: true`, `companheiro`) e o efeito do especial da Hexsmith (`hx.specialEffect`).
**Dono de:** o treino com amigo (§243) — luta local e unilateral na `DuelScreen`, sem prêmio, ranking, Bits, Honra, XP nem progresso.
**Props principais:** `friend` (só dado público: estágio, elemento, arte), `trainer` (`FriendTrainerProps`: estágio, linha, elemento e skills do SEU Soulmon), `isPt`, `onClose`.
**Exports:** `FriendTraining`, `friendTrainingSide`.
**Estado/efeitos relevantes:** semente sorteada no cliente; nenhuma chamada de rede; não grava no save.
**Chamado por:** `src/components/LibraryPage.tsx` (lazy), na aba Amigos.
**Régua:** `src/components/LibraryPage.amigos.render.test.tsx`.

### `src/components/LibraryPage.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** a busca do "Convidar" vira `usePlayerSearch`/`PlayerSearch` (acha quem está com o PvP desligado, §351); a memória de Biblioteca vem de `useLibraryMemory` (`seen`, `formsMap`, `markSeen`, `record`); portão do Soulmon dormindo (`useRequireAwake`); nome do clã por baixo do jogador (`PlayerName`).
**Dono de:** a Biblioteca — diretório de jogadores, amigos e o painel cooperativo, com quatro estados explícitos (carregando/vazio/erro/sem rede).
**Props principais:** `LibraryPageProps` — `saveId`, `friends: string[]`, `canGiftToday` (meta do dia cumprida), `onFriendsChange`, `onGiftSent`, `onVisitPlayer?` (WP4.7, dispara na abertura do detalhe), `metaDoDiaCumprida?` (repassado ao `CoopPanel`, decidido pelo motor de progresso e não duplicado no painel), `playerDayTz?` (a âncora do dia do jogador que a Guilda envia ao servidor), `embedded?` (minimal-ui F5 — dentro da folha do Hall o `<h1>` "Biblioteca" não renderiza; o `<h1>` da tela é o do `AreaTopBar`).
**Exports:** `LibraryPage(props)`.
**Estado/efeitos relevantes:** `useState` para `search`, `players`, `loadError`, `actionError`, `busyId`, `tab`, `giftedToday`, `selectedPlayer`, `reloadKey`, `friendPlayers`; `useEffect` carrega via `listPlayers`/`getPlayer` (`src/utils/community.ts`); renderiza `PlayerDetailModal` e `CoopPanel`.
**Chamado por:** `grep -rl "from '.*/LibraryPage'" src` (testes); consumo real em `src/App.tsx` via `lazy(() => import('./components/LibraryPage'))`, montado `embedded` como `hallContent` do `AreaView` (24/09/2026).
**Régua:** `src/components/LibraryPage.amigos.render.test.tsx`; também tocado por `src/components/spriteUrl.beacon.render.test.tsx`.
**Avisos do arquivo:** falha de rede antes caía em `.catch(() => setPlayers([]))` — lida como "nenhum jogador encontrado", a pior mentira possível numa tela social; hoje os quatro estados são distintos de propósito.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** **Amigos (§242/§243):** `MAX_FRIENDS` = 20; props `trainer` (`FriendTrainerProps`, habilita o ícone de combate) e `onSocialAlert(bool)` (o "!" do prédio Amigos); estado social do servidor (`getFriendsState`: convites recebidos, presentes de hoje, histórico; `markFriendsSeen` 1,5 s depois de abrir a aba), `answerFriendInvite`, modo "Remover amigos" com DUAS confirmações e treino com amigo (`FriendTraining`, lazy). **Selvagens:** a aba virou UMA lista rookie → mega com subtítulo por estágio, desgarrado de jogador junto no fim (§254), com o filtro por elementos base (`wildBases`, `ElementBaseSlots`) compartilhado entre Selvagem e Desgarrado; a busca por elementos base (`elementMatchesBases`) também é desta rodada.

### `src/components/MemoriesCard.tsx`
**Dono de:** o cartão de memórias aos 30 e 90 dias — dentro do relatório diário, uma vez só, sem números de desempenho.
**Props principais:** `MemoriesCardProps` — `mark: 30|90`, `petName`, `spriteUrl?`, `formNames: readonly string[]`, `dreamCount`, `soulGoal?`, `language`.
**Exports:** `MemoriesCard(props)` · `default`.
**Estado/efeitos relevantes:** nenhum — apresentação pura.
**Chamado por:** `src/components/DailyReportModal.tsx` (`grep -rl "from '.*/MemoriesCard'" src`, 09/09/2026).
**Régua:** `src/components/MemoriesCard.render.test.tsx`.
**Avisos do arquivo:** não é balanço — nenhum "você concluiu N tarefas", nenhum percentual, nenhuma comparação com o mês anterior; as contagens exibidas (formas vividas, sonhos) são de COLEÇÃO, só crescem; não é gatilho de volta — sem push, badge ou lembrete.

### `src/components/MilestoneCeremony.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o botão final é `CtaButton width="auto"`.
**Dono de:** a cerimônia dos marcos de hábito (7/21/66 dias efetivos) — pausa com saída pelo gesto do jogador, não auto-fechamento.
**Props principais:** `MilestoneCeremonyProps` — `tierIcon` (`HABIT_TIER_ICONS`), nome do hábito, dias efetivos, `language`.
**Exports:** `MilestoneCeremony(props)` · `default`.
**Estado/efeitos relevantes:** `useEffect` dispara háptico curto (`navigator.vibrate`, onde disponível) ao montar; sem timer de auto-fechamento — a saída é sempre o botão "Seguimos juntos" (EN "We keep going together" desde `84ae4937`, 21/09/2026 — era "Let's keep going together").
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/MilestoneCeremony'" src`, 09/09/2026).
**Régua:** `src/components/MilestoneCeremony.render.test.tsx`.
**Avisos do arquivo:** ⚠️ até 06/09/2026 fechava sozinha em 2,5s sem botão, em z-60 (abaixo do check-in, z-200) — o marco de 66 dias era comemorado atrás de um véu invisível; movimento reduzido corta as ANIMAÇÕES, nunca a pausa nem o botão — a versão antiga caía para um `toast.success` igual ao de qualquer tarefa, entregando menos cerimônia a quem mais precisa de acessibilidade.

### `src/components/MorningCheckIn.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** aceitar a versão reduzida marca a TAREFA BÔNUS do dia (`onTinyHabit` → `utils/bonusTask.ts`; rótulo "tarefa bônus"); não conclui mais.
**Dono de:** o ritual matinal — hábitos do dia + até 3 focos + humor, com as pendências de ontem primeiro; pulável sem culpa.
**Props principais:** `CheckInHabitItem`, `CheckInTaskItem`, `CheckInPlanShape` (formato de `checkInPlan`, `src/utils/rituals.ts`), `MorningCheckInProps`.
**Exports:** `CheckInHabitItem` (interface) · `CheckInTaskItem` (interface) · `CheckInPlanShape` (interface) · `MorningCheckInProps` (interface) · `MorningCheckIn(props)` · `default`.
**Estado/efeitos relevantes:** `useMemo` (`candidates`); `useState` (`selected`); `useEffect`/`useLayoutEffect` de sincronização visual; sem GameState/localStorage — o plano vem pronto de `checkInPlan` e quem grava é o `App.tsx`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/MorningCheckIn'" src`, 09/09/2026).
**Régua:** `src/components/MorningCheckIn.commit.render.test.tsx`, `.ofertaReduzida.render.test.tsx`.
**A12 (`592e2c14`, QA Rodada 2):** a âncora do hábito ("depois do café — na cozinha", `h.anchor.after`/`where`) vivia num `title`, que só existe no hover — no celular e no leitor de tela, nunca; hoje é texto visível `data-habit-anchor` (12 px, `--sm2-muted`) ao lado do nome.
**Avisos do arquivo:** `overcommitted` é AVISO, nunca bloqueio — o botão de confirmar continua sempre ativo (o Motion é odiado por decidir no lugar do usuário); `onSkip` sempre visível — ritual que só sai da frente se cumprido é cobrança na porta do app.

### `src/components/GoodDream.tsx`
**Dono de:** o SONHO BOM (15/10/2026, REGISTRO §65): o modal curto, de voz encorajadora, que paga Honra a cada 6 dias de pesadelo. Puro: recebe o prêmio e devolve o gesto; quem paga e reinicia o ciclo é o `App` (`claimGoodDream`).
**Props principais:** `GoodDreamProps` (exportado) — `open`, `honor`, `petStage`, `demoCharacterId?`, `language`, `onClaim()` (o botão e o × fazem o mesmo).
**Exports:** `GoodDreamProps` (interface) · `GoodDream(props)` · `default`.
**Estado/efeitos relevantes:** nenhum estado; usa `RitualDialog` e `GameVisor`.
**Chamado por:** `src/App.tsx` (no slot `nightmare` da fila de apresentação).
**Régua:** `src/components/GoodDream.render.test.tsx`.

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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** luta com companheiro invocado (`companheiroDoEstado`, lido do contexto por `useGameStateOptional`) e o efeito do especial da Hexsmith (`efeitoElementoPve(..., hx)`); janela de abertura em que o Pesadelo ainda não ataca (§413); o impacto do básico vem de `ident.basico.impacto` quando há.
**Dono de:** o combate do Pesadelo — luta curta de manhã, apresentação pura de `utils/nightmares.ts`, sem GameState nem localStorage. **Desde 04/10/2026 a luta é a `BattleStage` em tela cheia** (o diálogo só serve ao convite, à vitória e à derrota): HP e ENERGIA em cima de cada um, mascote da torcida, barra de cheer lenta (a energia e a barra seguem do 1º inimigo para o 2º), anel no especial do pet e esquiva no especial do pesadelo. **Desde o PR4 do Combate v3 (06/10/2026)** o motor é o núcleo (`groupFightSteps`, 1 inimigo por vez, HP e energia carregados), com as regras da Masmorra (`utils/dungeonFight.ts`, incluindo o ofício por `jeitoParaPve`: antes o Pesadelo ignorava o jeito) e o relógio de `games/useGroupBattle.ts`; ~22 s por inimigo. Props novas `petElement?`, `soul?` (o estado que o level lê) e `profissao?`.
**Props principais:** `NightmareBattleProps` — onda já montada (`buildNightmareWave`), raridade, callbacks `markFought`/recompensas resolvidos pelo App.
**Exports:** `NightmareBattleProps` (interface) · `NightmareBattle(props)` · `default`.
**Estado/efeitos relevantes:** `useState` (`idx`, `hpFrac`, `fightKey`, `seedLuta`, `phase`, `rewards`); `useRef` (HP e energia carregados, semente da noite, `waveRef`); `useCallback` (`rodadaDoNucleo`, `cena`, `aoFimDaLuta`); `useGroupBattle`; `useEffect` que reabre limpo com outra noite.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/NightmareBattle'" src`, 09/09/2026).
**Régua:** `src/components/NightmareBattle.render.test.tsx` (o convite, a cena em tela cheia, o anel, a esquiva, vencer, perder sem custo, a energia que segue de um inimigo para o outro); a régua de recompensa/onda vive em `src/utils/nightmares.test.ts`.
**Avisos do arquivo:** perder não custa nada (mesma regra da Masmorra) — tela de derrota diz "o sonho passou, você acorda bem"; tom sem horror/susto/vermelho de perigo; `DungeonGame` deliberadamente NÃO reutilizado — ele não aceita onda pronta, é uma run de 5 andares (não uma luta única) e escreve direto no localStorage (misturaria a economia da Masmorra com a do Pesadelo).

### `src/components/NoticeToast.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** exports novos: `TaskAutoTag({ name, language, onDone })` (a tag "Tarefa criada" por `NOTICE_TOAST_MS`) e `TaskCreatedToast` (aviso de tarefa criada pelo Passeio/Oficina, §413).
**Dono de:** o balãozinho de aviso acionável da Home (REGISTRO §56): não é modal, some sozinho em `NOTICE_TOAST_MS` (8 s) e o toque abre a folha de Avisos.
**Exports:** `NOTICE_TOAST_MS` · `NOTICE_TOAST_KEYS` (`refeicao`, `refugio`, `termos`, `triagem`, `recomeco`) · `NoticeToastKey` · `pickNoticeKey(presentes, vistos)` (puro: o primeiro ainda não visto) · `noticeToastText(key, language)` · `NoticeToast({ noticeKey, language, onOpen, onDone })`.
**Chamado por:** `src/App.tsx`.

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

### `src/components/PostponeNudgeSheet.tsx`
**Dono de:** o sheet das três saídas da tarefa adiada (encolher, soltar, decompor com IA), movido do `App.tsx` para chunk lazy (REGISTRO §499): o `App` só o monta com `nudgeTaskId` aberto. **Chamado por:** `App.tsx` (lazy). **Régua:** `taskTriage.test.ts`, `DailyRituals.segurar.render.test.tsx`.

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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o nome do jogador leva o clã por baixo (`PlayerName`, §321).
**Dono de:** perfil resumido de outro jogador na Biblioteca — nick, tempo de jogo, rank e o branch atual do pet com todo o progresso já desbloqueado nele.
**Props principais:** `PlayerDetailModalProps` — recebe um `DirectoryPlayer` (`src/utils/community.ts`) e `language`.
**Exports:** `PlayerDetailModal(props)`.
**Estado/efeitos relevantes:** nenhum — apresentação pura; usa `FORM_REQUIREMENTS`/`getStageBranch`/`getStageLevel` de `src/types/progression.ts` e `Viewport`/`AlignmentIcons` para o desenho.
**Chamado por:** `src/components/LibraryPage.tsx` (`grep -rl "from '.*/PlayerDetailModal'" src`, 09/09/2026).
**Régua:** `src/components/PlayerDetailModal.semMetrica.render.test.tsx`; também tocado por `src/components/spriteUrl.beacon.render.test.tsx`.
**Avisos do arquivo:** o progresso mostrado vem sempre de `unlockedStages` — nunca vaza forma além da já alcançada; `LEVEL_LABEL` era uma SEGUNDA cópia do mapa de `types/attributes.ts` (idêntica à de `EvolutionPath`) — duas cópias que concordam ainda são duas cópias (footgun 9), e a `StatsPage` não usava nenhuma das duas.

### `src/components/PlayerSearch.tsx` (13/11/2026, busca de jogadores — REGISTRO §321)
**Dono de:** a BUSCA ENQUANTO DIGITA dos dois convites. `PlayerSearch` = campo (`role="searchbox"`, `inputMode="search"`, rótulo acessível) + `PlayerSearchResults`; `PlayerSearchResults` = o status (`role="status"`, `aria-live="polite"`) e as linhas, para quem já tem o próprio campo (a aba Amigos). Linha = miniatura do Soulmon (`opponentIcon`/`opponentSprite`, `alt=""`) + `ui/PlayerName` (nome com o clã embaixo) + a ação de UM toque que quem chama passa em `renderAction`. Estados: menos de 2 letras (dica, nenhuma chamada), procurando, vazio ("Ninguém com um nome que comece assim."), erro por tipo (sem rede / muitas buscas / sem conta / servidor, com "Tentar de novo" onde faz sentido).
**Props principais:** `saveId`, `language`, `label`, `placeholder?`, `renderAction(hit)`, `hide?(hit)`, `search?` (injetável em teste/prévia), `autoFocus?`; `PlayerSearchResults` recebe `query`, `state`/`retry` de `usePlayerSearch` e `quiet?` (sem a dica com o campo vazio).
**Exports:** `PlayerSearch`, `PlayerSearchResults`.
**Chamado por:** `src/components/guild/GuildInviteSheet.tsx`, `src/components/LibraryPage.tsx` (aba Amigos).
**Régua:** `src/components/PlayerSearch.render.test.tsx`.

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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** Bits da partida por `bitsForLevel(MATCH_POINTS, level)`; "jogar de novo" com a arte do prédio.
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

### `src/components/RestWindowCard.tsx` — ⚰️ apagado

⚰️ **Apagado em `e4bbe9361` (18/10/2026, faixa B, REGISTRO 90).** Era o cartão de configurar/ver a Janela de Descanso. A regra (constância de HORÁRIO, sem score de sono) continua em `src/utils/restWindow.ts`; a tela de descanso hoje é `RestSetupModal`/`SettingsPage`.

### `src/components/SettingsModal.tsx` — ⚰️ apagado em `4a8b8049`

⚰️ **Apagado em 21/09/2026** (rodada QA GERAL, decisão do dono #37). Era o painel "Ajustes rápidos" (Sons / Trilha / Conversa com IA / Personalidade), aberto pelo `App.tsx` via `lazy()` a partir de `handleOpenAISettings` → `CompanionHUD` → `ChatBox.onOpenAISettings` — prop que o `ChatBox` destruturava e **nunca chamava** (sem gatilho vivo). Todas as quatro linhas já existiam na [`SettingsPage.tsx`](#srccomponentssettingspagetsx) (grupo "Som" + "Conversa com IA" + "Personalidade"), que é o único caminho do jogador; o mudo global tinha dois donos de UI e agora tem um. Saíram junto: `settingsOpen`, `handleOpenAISettings` (`App.tsx`) e a prop `onOpenAISettings` em `CompanionHUD`/`ChatBox`. Régua do caminho vivo: `src/components/settingsSom.render.test.tsx`.

### `src/components/SettingsPage.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props novas `review` (`ReviewRowState` → `ReviewSoulmonRow`: "Pedir revisão do meu Soulmon"), `voiceMode`/`onChangeVoiceMode` (`SoulmonVoiceMode`, padrão `complementar`); `especial: { nome }` e nome do Soulmon só leitura (a troca é na Hexsmith); os 3 cards Perfil/Home/Widget (`PerfilCardTile`).
**Dono de:** a página de Configurações — grupos por intenção do usuário, uma ação dominante (entrar/sincronizar). Desde `980bc84c` (21/09/2026) há o grupo **Som** (só se `onToggleSound` chegar): switch "Sons"/"Sound effects" (`checked={!soundMuted}` → `onToggleSound`) e switch "Trilha"/"Music" (estado local `trilha` por `trilhaPreferida()`; toque → `desligarTrilha()`/`ligarTrilha()` de `src/utils/trilha.ts` — o gesto da S2; hint "Duas camadas calmas, em loop…" ou, mudo, "Com os sons desligados, a trilha fica em silêncio."). Desde `5b91717c` (21/09/2026) há o grupo **Sobre**: os três limites da §16 da bíblia em voz de PRODUTO (não avalia/diagnostica/trata; questionário não é teste validado e mapa astral não prevê nada; o app não sabe nada além do que foi escrito) — a exceção declarada ao registro diegético (L10), sem "Malha" nem kit pixel.
**Props principais:** `SettingsPageProps` — `soundMuted?`, `onToggleSound?()` (desde `980bc84c`), `useAI`, `onToggleAI()`, `aiSettings`, `onSaveAISettings()`, `language`, `onChangeLanguage()`, `onOpenGuide()`, `onOpenGlossary()`, `notificationsEnabled`, `onToggleNotifications()`, `onRestoreFromCloud(saveId)`, `onLoginWithEmail(email)`.
**Exports:** `SettingsPage(props)`.
- `MENU_SHOWS_RITUAL_TOOLS` (`false`) — as ferramentas do ritual vieram do menu da Home, que saiu em 07/10/2026; a página recebe `onOpenCredits` e as mostra.
**Estado/efeitos relevantes:** `useState` para `trilha` (`trilhaPreferida()`, lido uma vez na montagem), `enabled` (telemetria, `isTelemetryEnabled()`), `showAISettings`, `copied`, `restoreInput`/`restoreStatus`, `emailInput`/`loginStatus`, `autoSleepEnabled`/`autoSleepStart`/`autoSleepEnd` (lidos via `readFlag`/`readLocal` de `STORAGE_KEYS.AUTO_SLEEP_*`); usa `useTheme` (`src/contexts/ThemeContext.tsx`); renderiza `AccountSection`, `AccountDataSection`, `InstallPrompt`.
**Chamado por:** `grep -rl "from '.*/SettingsPage'" src` (testes de telemetria); consumo real em `src/App.tsx` via `lazy(() => import('./components/SettingsPage'))` (09/09/2026).
**Sobre (desde `42b07bec`; reescrito em `a6c1cd8a`, QA Rodada 1 C1–C2):** o grupo "Sobre" ganhou o **aviso de IA** (decisão #22 — parágrafo `sm2Text`: "A imagem da sua criatura, as falas do chat e alguns sons (evolução, regressão e conclusão de tarefa) são gerados por IA (Higgsfield e Gemini para a imagem, Groq para a conversa), sem revisão humana." + que não é canal de emergência; ⚰️ a versão de `42b07bec` não citava os sons S16 nem a ausência de revisão), o `ActionRow` "O que o chat recebe" → `/privacidade.html#chat-contexto` (EN: `#chat-context`) e o terceiro limite da §16.3 da bíblia em `sm2Text` (⚰️ `sm2Hint` — era o único dos três limites em peso de rodapé). **Termos no app (`592e2c14`, QA Rodada 2 A4/A5):** o grupo Ajuda ganhou o `ActionRow` **"Termos de Uso"** → `/termos.html` (⚰️ não havia link para os Termos dentro do app) e a Política passou a abrir por idioma — em EN os dois apontam para a âncora **`#en`** (`/termos.html#en`, `/privacidade.html#en`, mesma tabela do `TermsUpdateBanner` — ⚰️ `#en` removida em 30/09/2026: hoje PT usa `#pt` e EN a página pura; ⚰️ abria sempre a versão PT); as linhas recebem `language` para o sufixo acessível "(abre em nova aba)" do `FormKit.ActionRow`. A linha de feedback `FeedbackRow` (`FeedbackLink.tsx`, `mailto:` com versão + 8 caracteres do `saveId`) **mudou para o grupo Ajuda** (`a6c1cd8a`, B3 — logo acima da linha "Soulmon `APP_VERSION`", que desde `a6c1cd8a` mostra **1.1.4** vinda do `package.json`). ⚠️ O cabeçalho da prop `soundMuted` diz que esta página é o ÚNICO caminho do mudo — verdade desde `4a8b8049` (⚰️ `SettingsModal`).
**Régua:** `src/components/SettingsPage.sobre.render.test.tsx` (aviso de IA PT/EN com sons e "sem revisão humana", link da política por idioma, `mailto:` com versão e trecho do `saveId`; +4 em `592e2c14`: Termos PT/EN com `#en` e "(abre em nova aba)" no nome acessível, `mailto:` sem o sufixo, `subject` por idioma + `BUILD_ID` no corpo), `src/components/settingsTelemetry.render.test.tsx` e, para o grupo Som, `src/components/settingsSom.render.test.tsx` (as duas chaves em PT/EN, o toque chega ao dono, sem `onToggleSound` o grupo não monta).
**Avisos do arquivo:** era ONZE cartões empilhados na ordem histórica de implementação — hoje nove grupos (`grep -c "<Group title=" src/components/SettingsPage.tsx` → 9, 21/09/2026; ⚰️ "cinco" era a contagem de 09/09/2026); o que é avançado (código de recuperação, restauração manual) vive atrás de revelação. Delta `ae366480..5edfcfba`: os `ActionRow` de Termos e Política apontam `#pt` em PT e a página pura em EN (⚰️ `#en`); ⚠️ a `Régua` acima ainda diz "Termos PT/EN com `#en`": `SettingsPage.sobre.render.test.tsx` já afirma `#pt` em PT, mas o título do `describe` e do `it` EN seguem falando em "âncora `#en`" — rótulo de teste defasado, o código manda.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** `profile.editHome` (linha "Editar Home" → `EditHomeScreen` em tela cheia) e `profile.widgetFrames` (linha "Moldura do widget" → `ModalSheet` com `WidgetFramePicker`); sem a prop a linha não existe. `profile.petElement` alimenta as molduras exclusivas de elemento. A política de privacidade subiu a `PRIVACY_VERSION = '2026-11-09'` (`utils/consent.ts`; passos pelo Health Connect, só o total do dia e só com opt-in): o bump faz quem aceitou a anterior rever o aviso de re-aceite.

### `src/components/SoulTestItem.tsx`
**Dono de:** desenha UMA pergunta do teste de personalidade (Likert/escolha forçada/cenário) — usado tanto no onboarding quanto na `OraclePage`.
**Props principais:** `SoulTestItemProps` — `item: Item`, resposta atual, callback de resposta, `optionStyle?` (agora com padrão `choiceStyle` de `form/FormKit.tsx`, em vez de exigir que todo chamador passasse o próprio estilo).
**Exports:** `itemPrompt(item)` — o enunciado no formato certo · `itemHint(item)` — dica de como responder · `SoulTestItem(props)`.
**Estado/efeitos relevantes:** nenhum — componente puro; `LIKERT_LABELS` fixa os cinco rótulos (1–5, extremos e meio sempre nomeados).
**Chamado por:** `src/components/OraclePage.tsx`, `src/components/SoulmonOnboarding.tsx` (`grep -rl "from '.*/SoulTestItem'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'SoulTestItem.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** único lugar que desenha os três formatos — onboarding e `OraclePage` usam o mesmo, senão o teste mediria coisas diferentes dependendo de onde foi respondido; escala Likert sempre 1–5 com extremos e meio rotulados (escala sem rótulo é adivinhação).

### `src/components/SoulmonOnboarding.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** export novo `gateLoginOutcome(erro?: AuthErro): number` (mapeia o erro de login do portão — popup fechado, sem resposta, rede, domínio/provedor/popup bloqueado — num código de desfecho); o botão DEMO do portão fica escondido pelo interruptor único (§320, regressão corrigida em §446).
**Dono de:** o ritual de onboarding inteiro — consentimento, as 6 perguntas do oráculo, teste de personalidade opcional, criação de conta, reveal da criatura e o modo `upgrade` (desbloqueio no meio do jogo).
**Props principais:** `SoulmonOnboardingProps` (não totalmente citada no trecho lido) — `onComplete`, `mode?: 'onboarding'|'upgrade'`, `onRevealed?`, `onCancel?`.
**Exports:** `OnboardingCompleteData` (type) · `REVEAL_WAIT_MS` (const, 12_000 — quanto o reveal espera pelo desenho antes de seguir só com texto) · `GOOGLE_SEM_RESPOSTA_MS` (const, 120_000 — rede de segurança do login Google) · `SoulmonOnboarding(props)`.
**Estado/efeitos relevantes:** 51 ocorrências de `useState`/`useEffect`/`useRef`/`useMemo`/`useCallback` (`grep -c`, 09/09/2026); `lazy(() => import('./OraclePage'))` interno (ferramenta de dev, fora do bundle da intro); grava rascunho em `utils/oracleDraft.ts`/`utils/gateDraft.ts`; chama `generateOracle` (`src/utils/oracle.ts`), `buildConsentRecord`/`isAgeBlocked` (`src/utils/consent.ts`), `entrarComSenha`/`criarContaComSenha`/`entrarComGoogle` (`src/utils/auth.ts`), `purchase` (`src/utils/playBilling.ts`), `track`/`flushTelemetry` (`src/utils/telemetry.ts`). Delta `ae366480..5edfcfba`: `birthPlace` usa `cityLabel(birthCity, isPt)`; os links de Termos/Privacidade apontam `/termos.html#pt` e `/privacidade.html#pt` em PT e a página sem âncora em EN (⚰️ a âncora `#en` saiu — o padrão do HTML agora é o inglês).
**Chamado por:** `grep -rl "from '.*/SoulmonOnboarding'" src` (testes); consumo real em `src/App.tsx` via `lazy(() => import('./components/SoulmonOnboarding'))` (09/09/2026).
**Régua:** `.batismo.render.test.tsx`, `.copyRitual.render.test.tsx`, `.portao.render.test.tsx`, `.rascunho.render.test.tsx`, `.reveal.render.test.tsx`, `.contaExcluida.render.test.tsx` (desde `592e2c14` — lápide no login fica no portão com cabeçalho + região viva; sem lápide segue; `checarContaExcluidaNoLogin` chamado com o e-mail); também tocado por `src/components/telemetryWiring.render.test.tsx`.
**Delta 15/10/2026 (REGISTRO §81):** depois dos Termos entra a `NpcSequence` da Ambra (`AMBRA_INTRO`, -14; só para quem ainda não gravou o passo do nome); o fim das perguntas é o `OvoCristal` (`CHOICE_STEP`, -7) — ⚰️ saíram a escolha grátis/completo, o REVEAL DEMO (-4), o `REGISTER` da demo e `handleUnlockFull`; o primário abre o `UnlockAccountModal` (`reason="ovo"`, `aoComprar` -> `comprado`), o secundário abre `DEMO_PICK` ("Soulmon guia") + `ConfirmDialog` e, no "Sim", `AMBRA_DEMO` (-15) e `finish()` (`mode: 'demo'`); "Chocar" dispara `useLuzDeChocar` e, coberta a tela, entra o passo 1 do ritual pago. Régua nova: `.ovo.render.test.tsx`; `.gratis.render.test.tsx` removido.
**Avisos do arquivo:** ⚰️ **`FAVORITE_STEP` não renderiza mais nada desde 22/09/2026** — o degrau "Qual sua criatura favorita?" saiu do ritual (decisão do dono: o jogador só insere texto que vai para o prompt depois do Renascimento), e com ele os estados `favoriteCreature`/`skipFavorite` e o campo homônimo do `OracleInput` montado aqui. A **constante continua valendo 5**: `utils/oracleDraft.ts` persiste o `step`, então renumerar mandaria quem retomou um rascunho para a tela errada. O degrau é pulado nos dois sentidos (`next()` em `FAVORITE_STEP − 1` → `QUIZ_START`; `back()` em `QUIZ_START` → `FAVORITE_STEP − 1`) e o inicializador de `step` desvia para `QUIZ_START` o rascunho antigo parado nele. `ORACLE_DRAFT_VERSION` **não subiu**, de propósito. As 6 perguntas do ritual continuam sendo `ORACLE_QUESTIONS`; o teste psicométrico de 20 itens é bifurcação sem volta, decidida ANTES do reveal; modo `upgrade` roda o MESMO ritual sem intro/cadastro e troca só a criatura (estágio/atividades/Bits/histórico continuam). **Conta excluída (desde `a6c1cd8a`, adendo 11; reescrito em `592e2c14`, QA Rodada 2 F1/A1/A2):** `avisoContaExcluida` (`useState` com inicializador que lê E apaga `STORAGE_KEYS.ACCOUNT_DELETED_NOTICE`, uma vez) — e, **novo, o portão com lápide ANTES do onboarding**: `aposAutenticar(mail?)` (chamado pelos dois logins, senha e Google) roda `checarContaExcluidaNoLogin` (`cloudSave.ts`); conta com lápide → **não entra no "porquê"**: apaga a notice, mostra o aviso, limpa o e-mail e volta a `IDENTITY_STEP`. A R1 só descobria a lápide DEPOIS de criar conta nova sob o mesmo saveId (410 → wipe → loop — FATAL). Acessibilidade: a região `<div aria-live="polite" aria-atomic data-account-deleted-live>` existe VAZIA na primeira pintura e o texto entra pós-montagem (`avisoAnunciado`, `setTimeout(0)`) — senão o leitor de tela não anuncia; com aviso, renderiza `<section aria-labelledby="sm2-conta-excluida-titulo" data-account-deleted-notice>` com cabeçalho "Conta excluída"/"Account deleted" e a frase de `mensagemContaExcluida` com a data (⚰️ `<p role="status">` sem cabeçalho, sem saída — "se não foi você" agora tem texto). Idioma por `resolveLanguage`.

### `src/components/ChocarBB.tsx`
**Dono de:** o CHOCAR do BB em tela cheia (Início BB, REGISTRO §472, 17/11/2026). A Home o abre quando a arte do BB já está no acervo e o aparelho tem o marcador "ainda vai chocar" (`utils/inicioBB.ts`). Mesma cena e rachadura do `OvoCristal`: a pessoa toca `OVO_TOQUES_PARA_BOTOES` vezes, a luz turquesa cobre a tela e o BB aparece; a apresentação (`NpcSequence` com as falas de `soulmonIntroLines`) só entra com a imagem CARREGADA (pré-carga com `Image`). Arte que não carrega: "Continuar" sem apresentação.
**Props principais:** `ChocarBB({ language, spriteUrl, nome, falas, onDone })` — só apresentação; o `App` grava o "chocou" (`limparBBNascimento`).
**Chamado por:** `src/App.tsx` (retorno cedo `chocarAberto`).
**Régua:** `src/components/ChocarBB.render.test.tsx`.

**Delta 17/11/2026 (SoulmonOnboarding, Início BB):** com `isInicioBB()` o `CHOICE_STEP` (-7) deixa de ser o ovo: quem tem acesso (compra confirmada, BETA_EMAILS, entitlement `paid`) segue direto à leitura do oráculo; quem não tem vê "Want to generate your own Soulmon?" (aviso do bebê: a 1ª forma só é desenhada no nascimento) com o `UnlockAccountModal` existente ou "Not now" (grátis: `inicialDoBB`). Os dois terminam em `PRONTO_STEP` (-8, telemetria 42) "Your Soulmon will be ready soon" → `finish()`. Sem reveal, batismo, guia nem Ambra de despedida nesse fluxo; o legado segue com o Início BB desligado (régua legada marca `setInicioBB(false)`). Régua: `SoulmonOnboarding.inicioBB.render.test.tsx`. `REFINE_OFFER` (erro de geração) passou de "All set" para "Almost there". `OnboardingOvo` exporta `OVO_CSS`.

### `src/components/OnboardingOvo.tsx`
**Dono de:** a tela do OVO-CRISTAL do onboarding (REGISTRO §81, 15/10/2026; cena refeita em 03/11/2026, revisão visual P1+P2 aprovada pelo dono), o fim do ritual de perguntas: a cena pintada (`CRIACAO_ART.bg`) com o cristal ASSENTADO no altar e o halo de runas respirando; o cristal é a folha `CRIACAO_ART.crack` em 3 níveis (`nivelDaRachadura`: 0, 1 a partir de 2 toques, 2 com 5 toques ou comprado); cada toque balança e solta as lascas (`fxTouch`, substitui a palavra "crack"); antes do 1º toque um pulso convida. `data-ovo-arte` segue `dormant` → `forming` (3º toque). Com `OVO_TOQUES_PARA_BOTOES` (5) toques mostra "Conhecer o seu Soulmon" (o ÚNICO primário — a compra fica visível ANTES do "Chocar", decisão do dono) e "Me empreste um Soulmon guia" (link discreto sublinhado, alvo 44); com `comprado` mostra só "Chocar". Também a luz do "Chocar" (`LuzBranca`, nome mantido: agora turquesa `LUZ_COR` + estrela `CRIACAO_ART.hatchLight`, disco que expande do meio e fade out) e o relógio dela (`useLuzDeChocar`). A espera `GENERATING` do `SoulmonOnboarding` mostra `CRIACAO_ART.crystalOpen` (o cristal já aberto).
**Props principais:** `OvoCristal({ language, comprado, ocupado, onConhecer, onGuia, onChocar })` — só apresentação; quem decide compra, demo e o que vem depois é o `SoulmonOnboarding`. `LuzBranca({ fase: 'expande' | 'some' })`. `useLuzDeChocar(quandoCobriu)` -> `{ fase, disparar }` (`quandoCobriu` roda uma vez, com a tela toda branca).
**Exports:** `OVO_TOQUES_PARA_BOTOES` (5) · `nivelDaRachadura(toques, comprado?)` · `LUZ_EXPANDE_MS` (1100) · `LUZ_SOME_MS` (800) · `LUZ_REDUZIDA_MS` (400) · `LUZ_COR` · `quadroDaTira(src, n, i)` (quadro de tira como `background`, também usado pela `EvolutionCeremony`) · `OvoCristal` · `LuzBranca` · `useLuzDeChocar`.
**Estado/efeitos relevantes:** `toques`/`pulso` (a `key` do invólucro reinicia a animação sem remontar o botão, o foco fica); `navigator.vibrate(12 | 30)` só sem movimento reduzido; `usePrefersReducedMotion` (de `ui/Viewport`) escolhe `sm-ovo-balanco` x `sm-ovo-fade` e a luz expansiva x fade branco; keyframes em `<style>` inline (sem classe nova em `index.css`). A luz é `LUZ_COR` (turquesa claro), não mais o branco `#FFFFFF`; movimento reduzido: sem convite, sem lascas, halo parado.
**Chamado por:** `src/components/SoulmonOnboarding.tsx` (passo `CHOICE_STEP`).
**Régua:** `src/components/SoulmonOnboarding.ovo.render.test.tsx`, `src/components/OnboardingOvo.crack.render.test.tsx` (cena, níveis, lascas, convite, hierarquia compra-antes-de-chocar, luz turquesa); helpers `src/test/ovoOnboarding.ts`.
**Avisos do arquivo:** jsdom não anima: os testes conferem o NOME da animação escolhida, não quadros. Arte: `src/assets/soulmon/criacao-evolucao/` via `utils/criacaoEvolucaoArt.ts` (folhas fatiadas por projeção de alfa, células iguais alinhadas pela base).

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
**Estado/efeitos relevantes:** 3 ocorrências de `useMemo` (`grep -c`, 09/09/2026); renderiza `BirthCard` (⚰️ `FormAlbum`/`BestiaryCard` apagados em 07/10/2026); usa `getPassive` (`src/utils/passives.ts`).
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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props novas: `playerDayTz` (dia do jogador no "a cada N dias"), `stepsInfo {hoje, meta}` (linha do hábito de caminhar: só o contador, sem cobrança), `onGoToBuilding` (o "Ir lá" do hábito linkado a prédio, `utils/tarefaLink.ts`), `bonusActivityIds` (lista; título em bronze nas tarefas bônus de hoje) e `weeklyBonusActivityId` (o mesmo selo para o bônus de retorno da retrospectiva).
**04/11/2026 (segurar):** prop `onHoldDoneTask`; segurar (~500 ms, `useLongPress` via `RitualRow.onLongPress`) uma tarefa pendente chama `onEditTask`, uma marcada chama `onHoldDoneTask` (menu "Desmarcar / Editar" no `App`, estorno em `utils/taskUncomplete.ts`). Régua: `DailyRituals.segurar.render.test.tsx`.
**Dono de:** a LISTA DO DIA da Home — o painel "Daily rituals" (tarefas ativas, hábitos devidos hoje, hábitos fora do dia, concluídas de hoje) e a gaveta "Put aside", sobre o canvas Atividades (identidade, `docs/design/wireframes/atividades/identidade/`, DECISÕES §20). Saiu do `App.tsx` em 20/09/2026.
**Props principais:** `DailyRitualsProps` — `tasks`, `activities`, `completedTasks`, `habitRhythms`, `hideMetrics`, `language`, `now`, `expanded`/`onExpand`, handlers (`onToggleTask`, `onEditTask`, `onPostponeNudge`, `onEditActivity`, `onToggleActivity`, `onUpdateStep`, `onRestoreTask`, `onCreate`), `ctaLabel`, `emptyMessage`, `variant?: 'panel' | 'home'` (Home B, minimal-ui F2: cabeçalho "Hoje N/M" + botão "+" no lugar do CTA largo; repassado ao `RitualPanel`), `dayComplete?` (o selo "Dia completo", regra da virada `completeDayReached`).
**Reafirmar o dia (15/10/2026, REGISTRO §66):** prop `dayPlan?` (`view` de `dayPlanView`, `invite?`, `onInvite?`) — o não marcado para hoje não aparece (o concluído de hoje aparece sempre), e com `invite` a lista mostra o botão discreto `data-day-plan-invite` ("Montar o meu dia") que reabre o `DayGoalsModal`; `RitualPanel` ganhou o slot `lead` para isso.
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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** Treino com ticket extra pago em Bits (`spendableBits` + cobrança só DEPOIS de o servidor confirmar a compra; `false` = nada cobrado, §373); o Treino abre para todos e só a aba Ranqueada mantém o Vínculo mínimo (`BOND_RANKED_MIN_LEVEL`); `playerDayTz` dá o mesmo dia dos demais tetos; companheiro invocado e efeito do especial no duelo; Torneio entra livre, LUTAR/TREINAR perguntam com o Soulmon dormindo (§329); clã por baixo do nome do oponente; `EstagioMarca` nas listas; histórico por temporada (`data-torneio-temporada-item`).
**Dono de:** o conteúdo da folha **Torneio** da Arena (PvP assíncrono; desde minimal-ui F5, 24/09/2026, mora dentro do `AreaSheet` — o `<h1>` saiu, o título é da folha). Abas: **Faixa** (abre nela — as 5 faixas em fila, progresso, ranking em janela de ±3), **Desafiar** (opt-in do PvP com o gate de Vínculo e o aviso do nick, oponentes), **Missões** (as missões da semana, pagas em Honra) e **Loja** (os prêmios de `tournamentShopItems()` de `utils/mercadoCatalog.ts`, só cosmético, só Honra, pintados pela `ShopShelf`). Placar de derrota em tinta neutra.
**Props principais:** `TournamentPageProps` — `headSlot?` (encaixe do canto do título: `undefined` = indicador inline; `null` = espera; elemento = portal), `saveId`, `pvpEnabled` (gate de vínculo mínimo), `language`, callbacks de partida, `weeklyMissions?`/`onClaimWeekly?` (antes na `ShopModal`), `shop?` (`ownership` + `actions` da prateleira; sem ele, não há aba Loja).
**Exports:** `TournamentPage(props)`.
**Estado/efeitos relevantes:** `useState` para `opponents`, `matchesLeft`, `loadFailed`, `rank`, `rankFailed`, `fighting`, `result`, `fightError`, `rankExpanded`, `tab` (`'arena' | 'missions' | 'shop'`, abre em `arena`; menu só de ícone — `swords`/`task_alt`/`storefront` — nas classes `sm2-kit-tab*`, nome em `aria-label`/`title`), `tiersOpen` (a folha das faixas, antiga aba Faixa, aberta pelo indicador `data-tier-indicator` no canto do título; o ranking agora é buscado ao montar); `useShopFlash()` para a região de status da loja; a linha do topo é a rodada da semana (`tournamentWindowLabel` de `utils/tournamentSeason.ts`) + a Honra (a moeda `emblems`: o rótulo "Honra"/"Honor" vale na UI desde 30/09/2026, REGISTRO §17 — ⚰️ "Emblemas"; o id, o campo do save e `EMBLEMS_PER_WIN` não mudaram); `useEffect` (`loadOpponents`) recarrega ao mudar `pvpEnabled`/`saveId`; partida resolvida no servidor (`playMatch`), sem frame de combate local. Desde `66e32d43` (21/09/2026, R2-2 — D-J13 cumprida) a criatura do oponente (mini-visor 64) e a do ranking (mini-visor 32, a cabeça) vêm de `lineIconForStage(stage, 64 | 32)` (`utils/lineIcons.ts`), `pixelated`; quando o estágio não é de linha cai em `getSpriteForStage` (0,25× / 0,125× com filtro `auto`). Delta `ae366480..5edfcfba` (duelo fantasma, 30/09/2026): novos `useState` `duel` (`{ opp, seed, me, oppStats }` do duelo em andamento) e `myDuel` (a ficha `DuelStats` do jogador, vinda de `r.me.duel` em `loadOpponents`). `fight(opp)` só abre duelo quando o servidor mandou a ficha (`opp.duel && myDuel`): chama `startDuel` (`utils/community.ts` — `duelStart`, que gasta a partida e devolve a semente) e guarda `duel`; sem a ficha (servidor antigo) cai em `resolveMatch(opp, [])`. `resolveMatch(opp, cheers, forfeit = false)` chama `playMatch(saveId, opp.id, cheers, forfeit)`, e no `finally` zera `duel` e recarrega os oponentes (a semente depende da partida do dia). `leaveDuel(opp)` = `resolveMatch(opp, [], true)` — sair antes do fim é derrota. Com `duel` ativo o componente devolve `<DuelScreen>` no lugar da folha (`onDone` → `resolveMatch` com as torcidas; `onClose` → `leaveDuel`). ⚰️ "partida resolvida no servidor, sem frame de combate local" — agora há animação local, mas a decisão segue no servidor.
**Arte (30/09/2026, rodada 3; faixas e ícones da rodada 7, 04/10/2026):** `TierMark({ id, size: 24 | 32, state: 'current' | 'passed' | 'next' })` (interno) mostra a INSÍGNIA em pixel da faixa quando `TIER_INSIGNIA_ART[id]` (de `assets/soulmon/icones-ui`, `data-tier-insignia`, `pixelated`) tem arte — hoje o mapa está VAZIO e as 7 faixas clássicas (Madeira→Mestre) saem como glifo sem box de `TIER_ICON` — no cartão da faixa (32) e na fila das 7 faixas (24); a aba Missões usa o `question` em `tone="gold"` (A2); a faixa ainda não alcançada sai apagada por FILTRO (`grayscale(1) brightness(0.55)`), nunca por `opacity`; id sem arte cai no glifo Material de `TIER_ICON`. O aria do saldo, a dica da loja e o resultado da partida dizem "Honra".
**Chamado por:** `src/components/nav/AreaView.tsx` via `lazy(() => import('../TournamentPage'))`, dentro da folha Torneio da Arena, com `shop={{ ownership, actions }}` (24/09/2026; ⚰️ até a minimal-ui F5, `lazy` direto no `App.tsx`); também `src/components/TournamentPage.bondGate.test.tsx`.
**R8 (04/10/2026):** (1) a faixa lê também a POSIÇÃO na season (`serverPlace` ← `myPlace` de `getRank(undefined, saveId)`; fallback `resolveSeasonPlace` = índice na lista pública): Mestre (top 100) e Grão-Mestre (top 20, glifo `bolt`) saem com o "#N" (`data-tier-place`) no indicador, no cartão e na fila — agora as 8 de `TOURNAMENT_LADDER`; (2) lista de oponentes VAZIA → os três desafiantes NPC de `utils/tournamentNpcs.ts` (`data-torneio-npc`), que abrem o TREINO (`startTraining(npc)`, sem rede, partida ou ganho); (3) UM só `InfoTip` ("Sobre o Torneio"/"About the Tournament", `data-torneio-info`) no canto superior direito, com `InfoTipSection` para faixas, desafiar/lista pública, luta e treino, missões, loja e molduras — os cinco de antes saíram; (4) MOLDURAS: props `equippedFrame?`, `ownedFrames?`, `onEquipFrame?`; botão "Moldura" (`data-frame-open`) na folha das faixas abre um `RitualDialog` com o `FrameSelector`; a linha do próprio jogador no ranking sai com `AvatarFrame`.
**Régua:** `src/components/TournamentPage.bondGate.test.tsx`, `src/components/TournamentPage.r8.render.test.tsx`, `src/components/arena/arenaSheets.render.test.tsx`, `src/utils/weeklyMissions.fiacao.test.ts`.
**Avisos do arquivo:** cena de arena NÃO existe aqui — a moldura antiga (fundo pintado + véu) saiu inteira, junto da razão de a tela ser escura no tema claro; a FAIXA sempre vem ANTES do ranking (posição absoluta é associada a comparação tóxica); ranking é janela de ±3, nunca lista completa; derrota é tinta neutra, nunca vermelho.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** o topo mostra "Rank" (`TierMark` + posição) e "Temporada: N dias" (`seasonDaysLabel`); o ranking é relido após cada luta (`reloadRank`); duelo e treino usam o coliseu da faixa (`coliseuSceneFor(standing.tier.id)`) e passam `oppEspecialNome`; o Desgarrado do treino mostra a essência que deixou (`trainingEssence`); lobby com cena `torneioLobby`.

### `src/components/TriagePile.tsx`
**Dono de:** "Arrumar a Pilha" — a triagem em massa de tarefas atrasadas/assombradas, apresentação pura sobre `triageQueue`.
**Props principais:** `TriagePileProps` (exportado) — a fila já pronta (`TriageTask[]`), callbacks das quatro ações (hoje/esta semana/algum dia/deixar pra lá), `language`.
**Exports:** `TriageAction` (type) · `TriagePileProps` (interface) · `TriagePile(props)` · `default`.
**Estado/efeitos relevantes:** `useState` (`resolved: string[]`); `useMemo` (`remaining`); `useEffect` sincroniza com a fila recebida; usa `useDialogA11y`; lê `effortOf`/`daysStale`/`isOverdue`/`deadlineAt` de `src/utils/taskTriage.ts`.
**Chamado por:** `src/App.tsx` (`grep -rl "from '.*/TriagePile'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components -maxdepth 1 -name 'TriagePile.*test.ts*'` vazio, 09/09/2026); a fila em si é travada em `src/utils/taskTriage.test.ts`.
**Avisos do arquivo:** as quatro saídas têm o mesmo peso visual — "Deixar pra lá" não é o botão feio do canto; nenhum vermelho de cobrança, nenhum total de pendências gritando no topo; dá para sair no meio sem penalidade.

### `src/components/UndoToast.tsx` — ⚰️ apagado

⚰️ **Apagado em `744c06633` (29/10/2026).** Era o toast de Desfazer da conclusão (decisão #57). Substituído pela tag de rodapé `CompletionTag` (entrada própria abaixo), que também mostra o ganho exato.

### `src/components/UiSkinRow.tsx` (24/11/2026)
**Dono de:** a linha "Interface" (Padrão com arte / Minimalista) de Configurações › Aparência. **Props:** `language`, `enabled?` (padrão `UI_SKIN_OPTION_ENABLED`; desligada não renderiza nem lê o contexto). **Chamado por:** `src/components/SettingsPage.tsx`. **Régua:** `src/components/UiSkinRow.render.test.tsx`.

### `src/components/UnlockAccountModal.tsx`
**Dono de:** o desbloqueio completo DENTRO do jogo (não só na tela inicial) — o modal de compra e o convite discreto `UnlockNudge`.
**Props principais:** `UnlockReason` (type: `'task-limit'|'evolution'|'report'|'shop'`) · `UnlockAccountModalProps` — `language`, entitlement atual, motivo do convite, callbacks de compra/restauração.
**Exports:** `UnlockReason` (type) · `UnlockAccountModal(props)` · `UnlockNudge(props)` — convite discreto, uma linha clicável, só para contas `demo`.
**Estado/efeitos relevantes:** `useState` (`loading: 'buy'|'restore'|null`, `message`); usa `purchase`/`restorePurchases`/`isBillingAvailable` (`src/utils/playBilling.ts`), `useUnlockPriceLabel` (`src/utils/priceLabel.ts`), `track`/`unlockReasonCode` (`src/utils/telemetry.ts`).
**Chamado por:** `src/App.tsx`, `src/components/CreateModal.tsx`, `src/components/DailyReportModal.tsx`, `src/components/EditModal.tsx`, `src/components/ShopModal.tsx` (`grep -rl "from '.*/UnlockAccountModal'" src`, 09/09/2026; ⚰️ `ShopModal.tsx` apagado na minimal-ui F5 — o convite do Mercado mora em `mercado/MercadoSheets.tsx`); também tocado por `src/components/telemetryWiring.render.test.tsx`.
**Régua:** `src/components/UnlockAccountModal.copy.render.test.tsx`, `.dismiss.render.test.tsx`.
**Avisos do arquivo:** ⚠️ eram "dois lugares" documentados para o `UnlockNudge` (limite de criação + Evolução); `src/components/EditModal.tsx` passou a ser o terceiro — era o caminho que contornava o teto do demo, salvando sem checar cap; "Agora não" tem a mesma largura do botão de compra (recusar é resposta legítima); "restaurar" sussurra (`quiet`), não é uma segunda oferta.

### `src/components/WeeklyReportCard.tsx` — ⚰️ apagado

⚰️ **Apagado em `5003a2fd3` (16/11/2026, REGISTRO §432).** Era o cartão do relatório semanal de domingo (`WeeklyReportCardProps`: `report`, `suggestion`, `language`, `onDismiss`). A retrospectiva de segunda (`WeeklyRetroModal`, §433) o substitui; `weeklyReport`/`stackingSuggestion` de `src/utils/rituals.ts` não alimentam mais nenhuma tela, e o `handleDismissWeeklyReport` saiu do `App.tsx` (entrou `handleCloseWeeklyRetro`).

### `src/components/BuildingIntro.tsx`
**Dono de:** a apresentação do prédio novo (08/10/2026; refeita em 14/10/2026): monta as falas (3 por prédio, cada prédio com o NPC e a arte de `lotNpcArt`) e entrega à `NpcSequence`. Vários prédios = UMA sequência. Sem botões "Próximo/Ir lá/Depois".
**Props principais:** `ids` (`BuildingId[]`), `language`, `onFinish('done' | 'skip')`.
**Exports:** `BuildingIntro(props)` (nomeado e default).
**Chamado por:** `src/App.tsx` (intersticial `buildingIntro`, aberto por `visitarPredio` na primeira entrada no prédio).
**Régua:** `src/components/BuildingIntro.render.test.tsx`, `src/components/filaDeAvisos.contract.test.ts` (posição na fila, montagem única, "visto ao mostrar").
**Avisos do arquivo:** só fecha por gesto (sem timer); muda e sem recompensa (R-NOVA); não grava nada (o "visto" é de quem monta, ao MOSTRAR).

### `src/components/MapTutorial.tsx`
**Dono de:** o tutorial do mapa (14/10/2026, pedido do dono): monta as falas a partir de `MAP_TOUR_STEPS` (uma de abertura com o corvo + uma por área, com o NPC da área e a lista dos prédios) e entrega à `NpcSequence`.
**Props principais:** `language`, `onFinish('done' | 'skip')`.
**Exports:** `MapTutorial(props)` (nomeado e default).
**Chamado por:** `src/App.tsx` (item `mapTutorial` da fila, só na 1ª abertura do Mapa, depois do tour básico).
**Régua:** `src/components/MapTutorial.render.test.tsx`, `src/components/WelcomeTour.render.test.tsx` (conteúdo e regras de `MAP_TOUR_STEPS`), `src/components/filaDeAvisos.contract.test.ts` (posição na fila).
**Avisos do arquivo:** só fecha por gesto; muda e sem recompensa; não grava nada (o `mapTutorialSeen` é gravado por quem monta, ao MOSTRAR).

### `src/components/NpcSequence.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props novas `action?: ReactNode` (CTA na última fala) e `closeOnTap = true` (`false`: o toque não fecha na última fala — aviso de prédio bloqueado e portão do Bastion só fecham por X/CTA, §454).
**Dono de:** a sequência de falas de um NPC em TELA CHEIA (14/10/2026, pedido do dono): NPC bem grande (`min(135vw, 82dvh)`), janela de texto embaixo (`TypewriterText`), toque em qualquer lugar avança, a última fala fecha, "Pular/Skip" discreto no canto superior ESQUERDO (≥ 44 px, safe-area). Genérico: o tutorial do mapa pode usá-lo.
**Props principais:** `lines` (`NpcSequenceLine[]`: `speaker`, `art`, `text`), `language`, `onFinish('done' | 'skip')`, `label?`.
**Exports:** `NpcSequence(props)`, `NpcSequenceLine` (type).
**Delta 13/11/2026 (REGISTRO §319):** prop `action?: ReactNode` — ação opcional na ÚLTIMA fala, dentro da janela de texto (`data-npc-action`, recebe toque); não avança nem fecha sozinha. Chamado também por `src/components/play/RogueKeyGate.tsx`.
**Chamado por:** `src/components/BuildingIntro.tsx`, `src/components/MapTutorial.tsx`.
**Régua:** `src/components/NpcSequence.render.test.tsx` (toque avança, pular, última fala, teclado, voltar do Android, alvo de 44 px, PT/EN, `onFinish` uma vez).
**Avisos do arquivo:** o botão de avançar cobre a tela e é o PRIMEIRO focável (Enter/Espaço avançam; Esc e voltar pulam); o texto do "Pular" vem depois no foco; usa `useDialogA11y` e `useBackLayer`; nenhum som, nenhum timer.

### `src/components/UnlockToast.tsx`
**Dono de:** o balãozinho "<Prédio> desbloqueado em <local>" (14/10/2026): NÃO bloqueante (`role="status"`, sem foco/véu), some em 6 s ou ao toque; vários prédios do mesmo level-up viram um texto só.
**Props principais:** `ids` (`BuildingId[]`), `language`, `onDone()`.
**Exports:** `UnlockToast`, `unlockToastText(ids, language)`, `UNLOCK_TOAST_MS`.
**Chamado por:** `src/App.tsx` (item `unlockToast` da fila).
**Régua:** `src/components/UnlockToast.render.test.tsx`.
**Avisos do arquivo:** muda e sem recompensa (R-NOVA); a apresentação do NPC só vem na primeira entrada no prédio.

### `src/components/PresentationSlot.tsx`
**Dono de:** a moldura de segurança de cada item da fila central de modais: `Suspense` + boundary de erro. Erro de render ou chunk que não carrega em `PRESENTATION_LOAD_TIMEOUT_MS` (8 s) viram `onFail`, e a fila pula o item.
**Props principais:** `id`, `onFail()`, `fallback?`, `children`.
**Exports:** `PresentationSlot`, `PRESENTATION_LOAD_TIMEOUT_MS`.
**Chamado por:** `src/App.tsx` (um por item de `PRESENTATION_ORDER`).
**Régua:** `src/hooks/usePresentationQueue.test.tsx` (bloco "PresentationSlot").
**Avisos do arquivo:** reporta o erro por `reportCrash('boundary')` (sem conteúdo do usuário); `onFail` é chamado fora do render (microtask).

### `src/components/WelcomeTour.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o termo Fragmento de Alma é destacado (`emphasizeSoulFragment`).
**Dono de:** o tour de boas-vindas do corvo (07/10/2026): oito cartões em `RitualDialog` (z-200, `useDialogA11y` — Esc pula) com o `mascot-raven.png`, o balão `NpcSpeech` (falante "Rook") e, nos passos do mapa, uma lista de uma frase por área. "Skip" e "Next"/"Back" sempre visíveis; muda e sem recompensa (R-NOVA).
**Props principais:** `language`, `onDone(how: 'finished' | 'skipped')`.
**Exports:** `WelcomeTour(props)` (nomeado e default), `WelcomeTourEnd` (type).
**Chamado por:** `src/App.tsx` (intersticial `welcomeTour`, o PRIMEIRO da fila; `grep -rl "from '.*/WelcomeTour'" src`).
**Régua:** `src/components/WelcomeTour.render.test.tsx`, `src/components/filaDeAvisos.contract.test.ts` (posição na fila, flag única, replay sem marca).
**Avisos do arquivo:** o movimento do corvo (`.sm-corvo-bob`) para no bloco canônico de movimento reduzido; os passos esperam o toque nos dois casos.

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

### `src/components/evolution/FormasAlternativasSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `ehAtual = true`: se a forma do modal não é a atual (outra linha, mesmo nível) o botão diz "Trocar forma" e nenhuma é marcada EQUIPADA.
**Dono de:** a tela das formas alternativas de UMA forma (05/11/2026): as desbloqueadas (equipáveis), sempre até 3 `???` abaixo, e a dica "degenerar e evoluir com poção elemental" enquanto não houver nenhuma.
**Exports:** `FormaAltItem` · `FormasAlternativasSheet(props)`.
**Chamado por:** `src/components/EvolutionPath.tsx` (setinha → do cartão da forma).
**Régua:** `src/utils/formasAlternativas.test.ts` (a regra); exercitado pelos testes de `EvolutionPath.tsx`.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** a tela ganhou `modo?: 'equipar' | 'degenerar' | 'ver'` (padrão `equipar`) e é o MODAL aberto ao tocar o nó da forma na árvore (não mais a "setinha"): em `degenerar` o título é "Degenerar para…" e cada opção tem o botão "Degenerar"; em `ver` não há botão; a dica "degenerar e evoluir com poção elemental" só aparece em `equipar` com ≤ 1 item. `onEquip(elemento)` serve aos dois botões. `ALT_ORIGINAL`/`'__atual'` rotulam "Original".

### `src/components/StrollScene.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `onGoHome` ("Voltar para casa" no fim da cena); saiu o botão Pular (a cena é a recompensa, §461); `dock` com o CTA ancorado no rodapé.
**Dono de:** a CENA do Passeio em tela cheia (05/11/2026): cenário da região, cartão de texto no topo, "Espera… tem alguma coisa ali." → deslize → descoberta de um Soulmon novo (OK grava no Drive) → deslize de volta → fecha. Nasce muda; movimento reduzido corta o deslize.
**Botões (REGISTRO §413):** todos no MESMO rodapé (`data-scene-dock`): o principal em cima, "Pular" logo abaixo, em toda fase; o texto fica no topo.
**Props principais:** `StrollSceneProps` — `regionId`, `bgId`, `playerSprite?`, `adventure`, `stroll`, `discovery` (`null` = Drive completo), `onDiscover(key)`, `onFinish`, `finishLabel`, `language`.
**Exports:** `StrollSceneProps` · `StrollScene(props)`.
**Chamado por:** `src/components/DailyReportModal.tsx` (passo "aventura", quando há Passeio e a cena ainda não rodou na hora) · `src/components/StrollNowScene.tsx`.
**Régua:** `src/components/StrollScene.render.test.tsx`.

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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `ActionRow` ganha `disabled` (sem toque, `aria-disabled`, esmaecida; só para linhas de ação, não `href`).
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
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** export novo `pickRowStyle(base, checked)`: linha de escolha selecionada ganha borda turquesa de 2px (o check turquesa some sobre o fill do botão `primary`); chevron de ação no fim da linha.

**Missão N/G (14/10/2026, REGISTRO §57):** na variante `home` o cabeçalho tem UM indicador, `data-today-count` (`sm3-missao`, tabular-nums): com `goal > 0` mostra `Missão N/G` / `Mission N/G` (`aria-label` `Missão N de G`; N = feitos da lista, pode passar de G; o atributo `data-today-goal` guarda G); sem meta, a contagem simples `N/total`. O bloco separado `Goal`/`sm3-meta` saiu. Só exibição.
**Dono de:** o painel de rituais da Home — um painel titulado, coluna única, linhas de ~72px, dimensionado para o PT-BR (mais longo que o EN).
**Props principais:** `RitualRowProps` (exportado), `RitualPanelProps` (exportado) — lista de itens (hábitos/tarefas do dia), progresso segmentado, callback de concluir/editar; `RitualPanelProps.variant?: 'panel' | 'home'` (minimal-ui F2: `home` = a lista da Home B, sem o painel em volta — cabeçalho `<h2>` "Hoje" com o contador `N/M` só com feitos ≥ 1 (piso E5), botão "+" `data-ritual-add` no papel do CTA; vazio SIS-06 `task_alt` 48 ciano, que na Home B ganha o CTA largo) e `dayComplete?` (selo "Dia completo" — quem decide é a regra da virada, nunca o painel). **Ação = seta turquesa no fim da linha (§365, 14/11/2026; reverte o "link na frente" do §355):** `RitualRowProps.action` (`{ label, onClick, kind? }`) renderiza o `ChevronAcao` à direita da linha (`[data-ritual-action]`, nome acessível = `label`, sem texto visível), some com a linha feita; `below` segue para o que não é ação (contador de passos, `TaskMeta`). Régua: `DailyRituals.recurso.render.test.tsx`.
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

### `src/components/games/ResultScreen.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `playAgainArt` (PNG do prédio no botão "jogar de novo", no lugar do glifo); `noteMinigameOutcome` (métricas); o "jogar de novo" dos jogos do Salão mostra o ticket (`useFunTicketCost`).
**Dono de:** a tela de resultado PADRÃO de todo minijogo (Proposta D, dono, 27/10/2026; `product/resultado-padrao/`): visor com o Soulmon reagindo ao desfecho (`win`/`record` alegre, `calm`, `tired`; classes `.sm-result-*` no fim do `index.css`), título Cinzel + frase, UMA métrica-herói (32 px; 7+ dígitos cai para 24), selo dourado só no recorde, faixa opcional (a célula "Melhor" some no recorde), livro "Ganhou" com uma moeda por linha (`BitsAmount`, Honra em serifa dourada, itens) e dock fixo (jogar de novo + sair). Revelação em degraus (~2,6 s), toque pula, `prefers-reduced-motion` = estado final no 1º quadro; região viva `role=status` existe vazia antes do conteúdo. Mudo (R-NOVA). Não conhece regra de recompensa nem de recorde: quem chama passa os dados prontos.
**Exports:** `ResultScreen` · `useResultReveal` · `formatResultTime` · `RESULT_FINAL_STEP` · tipos `ResultOutcome`, `ResultHero`, `ResultStripCell`, `ResultLedgerRow`, `ResultScreenProps`.
**Estado/efeitos relevantes:** `useResultReveal` (timers do cronograma + `skip`); contagem do herói por `requestAnimationFrame`; Escape no modo `dialog` (Torneio).
**Chamado por:** `DungeonGame.tsx` (fase `ended`), `Match3Game.tsx`, `ArenaGame.tsx` (fim da run; a "rodada limpa" fica compacta inline), `TournamentPage.tsx` (`ResultDialog`), `RogueDungeon.tsx`, `DinoGame.tsx`, `SoulBarrage.tsx`, `RPSGame.tsx`, `mente/EcoGame.tsx`, `mente/ZipGame.tsx`, `mente/PatchesGame.tsx`. Fora: `NightmareBattle.tsx` (desfecho narrativo, sem métrica).
**Régua:** `games/ResultScreen.render.test.tsx`.
**Avisos do arquivo:** os `data-*` das telas antigas que testes leem entram por `rootAttrs`/`lineAttrs`/`againAttrs`; o valor final do herói fica sempre no DOM (`data-result-final`); hero/selo/faixa/livro/notas são `aria-hidden` porque o resumo único vai pela região viva.

### `src/components/pixel/TimingBar.tsx`
**Dono de:** a mecânica de timing de todo combate do Soulmon — marcador vaivém, `onStop` devolve precisão 0..1; quem interpreta o número é cada jogo.
**Props principais:** `TimingBarProps` (exportado) — `speed` (ciclos/segundo), `label`, `onStop` (precisão 0..1), `ariaLabel?`. A prop `color` saiu no canvas Jogos (D-J6): a barra é vetor por token (trilho `surface-2` + fronteira `muted`, zona central `primary-soft` com filetes `primary-ink`, marcador `primary-ink` 3×22, botão primário 48) — a mesma peça em todo jogo.
**Exports:** `TimingBarProps` (interface) · `TimingBar(props)`.
**Estado/efeitos relevantes:** `useState` (`pos`); `useRef` (`posRef`, `rafRef`, `stoppedRef`); `useEffect` roda o loop `requestAnimationFrame`.
**Chamado por:** `src/components/ArenaGame.tsx`, `src/components/DungeonGame.tsx`, `src/components/NightmareBattle.tsx` (`grep -rl "from '.*/TimingBar'" src`, 09/09/2026).
**Régua:** nenhuma (`find src/components/pixel -maxdepth 1 -name 'TimingBar.*test.ts*'` vazio, 09/09/2026).
**Avisos do arquivo:** era código local em `DungeonGame.tsx`, COPIADO para `NightmareBattle.tsx` (footgun 9 documentado no próprio cabeçalho antigo) — esta é a extração feita antes da Arena existir, para não abrir uma terceira cópia; ⚠️ não acrescentar regra de jogo aqui (dano/elemento/crítico/carga de especial são de quem chama) — a barra só mede.

### `src/components/refugio/RefugeInviteCard.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** só texto do convite ("Vem comigo.").
**Dono de:** o cartão do convite ao Refúgio no slot de avisos da Home — copy do parecer do psicólogo ("Um respiro?"; voz do pet falando de si; sem humor, sem crise, sem promessa). Marca "exibido" ao montar.
**Exports:** `RefugeInviteCard({ language, onShown, onAccept, onDismiss })`.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/components/refugio/refugeInvite.render.test.tsx`, `src/components/filaDeAvisos.contract.test.ts`.

### `src/components/refugio/CenaSubaquatica.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `BolhaGuia` (bolha em volta do Soulmon) substitui `AguaViva` como guia da respiração.
**Dono de:** a cena subaquática em tela cheia da Respiração (degradê, raios, bolhas, algas e coral) e o guia bolha (em volta do pet). Arte opcional em `src/assets/soulmon/respiracao/{fundo,meio,frente}.webp`, com camada procedural quando falta. Movimento reduzido: cena parada.
**Exports:** `CenaSubaquatica`, `BolhaGuia`.
**Chamado por:** `src/components/refugio/RespiracaoGame.tsx`.
**Régua:** `src/components/refugio/chama.render.test.tsx`.

### `src/components/refugio/ChamaGame.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** a chama é a folha de 36 quadros em grade 6×6 (`chama-v4-folha.webp`), tocada por CSS `step-end`; maior e centralizada.
**Dono de:** o exercício Chama (trataka, 04/11/2026): aviso da 1ª vez, escolha de duração e modo olhos fechados, sessão em tela cheia com chama lenta (WCAG 2.3.1), sino + vibração, wake lock, toque duplo privado e Bits fixos 1×/dia. Arte opcional em `src/assets/soulmon/chama/fundo.webp`; a chama é a folha 6x6 de 36 quadros `chama-alma/chama-v4-folha.webp` (CSS `step-end`, 2,4 s, parada em movimento reduzido). É a exceção do Refúgio: soa nas trocas e paga Bits.
**Exports:** `ChamaGame`, `ChamaViva`.
**Depende de:** `src/utils/refugio/chama.ts`, `src/utils/refugio/sinoChama.ts`.
**Chamado por:** `src/components/nav/AreaView.tsx`.
**Régua:** `src/components/refugio/chama.render.test.tsx`.

### `src/components/refugio/RespiracaoGame.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o guia é a bolha em volta do pet (cresce na inspiração, encolhe na expiração).
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

### `src/components/ui/ModalFrame.tsx`
**Variante de aço (18/11/2026):** `className="sm2-moldura-modal--aco"` (vinda do `AreaSheet moldura="aco"`, só a Hexsmith) usa as peças de `src/assets/soulmon/ui/hex-moldura/` (LEIA-ME com as medidas); o ✕ e o "i" são só glifos centrados nos discos que a arte do topo já desenha.
**Dono de:** a MOLDURA de modal (17/11/2026, `docs/PLANO-MOLDURAS-MODAIS.md`): fatiamento vertical de largura fixa (topo e base de proporção fixa + laterais repetidas em Y), base escura e fundo do lote (`fundo`) a 15% de opacidade; sem `fundo`, pedra com runas. Visual em `.sm2-moldura-modal` (`index.css`); arte em `src/assets/soulmon/ui/moldura/` (WebP).
**Props principais:** `title` (texto da placa), `info?: { label, content, language }` (atalho do `ModalInfo`), `fundo`, `fillOpacity`, `children`; repassa `data-*`/`aria-*`/`className`/`style`/`ref`.
**Informação (18/11/2026):** a arte já traz o ornamento "i" no canto superior direito; o modal NÃO desenha ícone próprio. Abre um `ModalInfoSlotProvider` com o encaixe `.sm2-moldura-modal__info` sobre o ornamento (unidade `--u`); todo `InfoTip`/`ModalInfo` dentro dele se registra e vira UM botão transparente (`.sm2-info-hit`, ≥ 44 px, `aria-label`) com painel único (uma seção por info). Sem info, sem botão.
**Exports:** `ModalFrame`, `ModalFrameProps`.
**Chamado por:** `src/components/nav/AreaSheet.tsx`.

### `src/components/ui/SheetFrame.tsx`
**Dono de:** a MOLDURA da FOLHA DE BAIXO da Home (etapa 3, 17/11/2026): o `ModalFrame` sem base (haste de cima com cantos, placa e (i); laterais até a borda da tela; alça por CSS, provisório), sempre em tema escuro. Também guarda os kill-switches `MOLDURA_HOME_FOLHAS` e `MOLDURA_HOME_DIALOGOS`. Visual em `.sm2-moldura-sheet` (`index.css`).
**Exports:** `SheetFrame`, `MOLDURA_HOME_FOLHAS`, `MOLDURA_HOME_DIALOGOS`.
**Chamado por:** `src/components/form/FormKit.tsx` (`ModalSheet`), `src/components/home/Mochila.tsx`.

### `src/components/ui/CardFrame.tsx`
**Dono de:** a MOLDURA de card (arte, nome, descrição e recompensa sobre topo/base fixos); visual em `.sm2-moldura-card` (`index.css`).
**Exports:** `CardFrame`.

### `src/components/ui/TelaMoldura.tsx`
**Dono de:** a moldura de TELA CHEIA como decoração solta (fundo por baixo do conteúdo, moldura por cima, nada intercepta toque); reusa as classes `.sm2-moldura-tela` + `.sm2-moldura-modal__*`.
**Props:** `tela`, `title`, `infoSlotRef?` (encaixe do botão "i" sobre o ornamento da arte; `GameRoot` liga o provedor). Só o botão recebe toque; o resto é `aria-hidden`.
**Exports:** `TelaMoldura`, `MOLDURA_TELAS`.

### `src/assets/soulmon/ui/moldura/fundos.ts`
**Dono de:** o mapa prédio → fundo do lote (WebP em `moldura/fundos/`) usado pela moldura; régua em `fundos.test.ts`.

### `src/components/ui/EstagioMarca.tsx`
**Dono de:** o estágio do OPONENTE como ÍCONE nas listas do Torneio (Ranqueada/Treino), no lugar do texto (10/11/2026, REGISTRO §282): `role="img"` com `aria-label` e `title` = nome do jogo (Desperto/Ascendente/Transcendente/Apoteose/Zênite). Bebê/desconhecido não renderiza. Desde 14/11/2026 (§369) o ícone vem tingido pelo caminho da forma (`caminhoDaForma`).
**Props principais:** `forma`, `isPt`, `size?`.
**Exports:** `EstagioMarca`, `nomeDoEstagio`.
**Chamado por:** `src/components/TournamentPage.tsx`.
**Régua:** `src/components/ui/EstagioMarca.test.tsx`.

### `src/components/ui/EstagioIcone.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** exports novos `EstagioCaminho` e `caminhoDaForma`: o ícone do estágio ganha a cor do caminho (Poder/Harmonia/Benevolência); sem caminho = creme (§391).
**Dono de:** o ícone de ESTÁGIO (rookie, champion, ultimate, mega, ultra) antes do nome — placa de HP/especial do `BattleStage` e nós do Centro de Evolução (09/11/2026, REGISTRO §259). Bebê/ovo e id desconhecido não renderizam nada. **Cor do caminho (14/11/2026, REGISTRO §369):** com `caminho`, o ícone é tingido em `CAMINHO_COR` (`types/attributes.ts`: Poder `#4cd964` verde, Harmonia `#4aa3ff` azul, Benevolência `#ffd23f` amarelo) por UMA técnica: o PNG do set atual vira `mask-image` e a cor entra como `background-color` (`span[data-estagio-tinta]` dentro de `span[data-estagio-icone][data-estagio-caminho]`), com contorno escuro fino (`drop-shadow` 0,6 px em `ATTR_ON_FILL_INK` no invólucro) para o amarelo não sumir na plaquinha clara. Sem caminho (rookie, ultra, tier de inimigo sem ramo, formas legadas): creme `CAMINHO_SEM_COR` (`#fff1d6`, §394, 15/11/2026), pela mesma máscara; não existe mais o `<img>` neutro, e o componente deriva o caminho do id da forma sozinho. `caminhoDaForma(forma)` só lê o ramo que o id já tem (`getStageBranch`), nunca inventa. Aparece tingido nas plaquinhas de TODAS as telas de combate (Arena, Masmorra, Fenda/Rogue, Pesadelo, Bosque, Duelo PvP: jogador sempre que a forma tem caminho; oponente quando o `stage` dele tem), nos nós da Evolução (pelo galho do nó) e no Torneio (`EstagioMarca`).
**Props principais:** `forma` (id da forma ou nível), `size?`, `label?`, `style?`, `caminho?` (`'power' | 'harmony' | 'benevolence' | null`; omitido = derivado do id; `null` = creme).
**Exports:** `EstagioIcone`, `caminhoDaForma`, tipo `EstagioCaminho`.
**Chamado por:** `src/components/games/BattleStage.tsx`, `src/components/EvolutionPath.tsx`, `src/components/ui/EstagioMarca.tsx`.
**Régua:** `src/components/ui/EstagioIcone.test.tsx`, `src/components/ui/EstagioIcone.guard.test.ts` (só este componente renderiza o PNG de estágio), `src/components/games/BattleStage.estagio.test.tsx`, `EvolutionPath.arvore.render.test.tsx`; a arte e o set (`creme`/`branco`) vivem em `assets/soulmon/icones-ui/estagio.ts`.

### `src/components/ui/Icon.tsx`
**Dono de:** o único ponto de ícone do app — dois motores (glifo SVG próprio ou ligature Material Symbols), mesma API.
**Props principais:** `IconProps` (exportado) — `name` (nome Material, mesmo com glifo próprio), `size`, `fill` (eixo de estado), `weight` (espessura de traço no SVG), `tone`, `label`.
**Exports:** `IconTone` (type — tokens de TINTA, nunca fill) · `IconProps` (interface) · `Icon` (`const`, `memo`) · `default`.
**Estado/efeitos relevantes:** nenhum — componente puro; `memo` porque é o mais instanciado do app (nav, cada card de tarefa, cada ação do pet), todas as props primitivas.
**Chamado por:** dezenas de arquivos (`grep -rl "from '.*/Icon'" src` — `App.tsx`, `AISettingsModal`, `ArenaGame`, `CompanionHUD`, `CreateModal`, `EvolutionPath`, `TournamentPage`, `home/Mochila`, `mercado/*`, `nav/HomeMenuSheet` etc.; ⚰️ `ActivitiesPage`, `BottomNav` e `ShopModal` saíram na minimal-ui) e `src/styles/iconScale.contract.test.ts` (09/09/2026).
**Régua:** exercitado por `src/components/ui/foundation.render.test.tsx`; a regra "ícone nunca dentro de box" é travada por teste próprio.
**Avisos do arquivo:** ícone NUNCA dentro de box — nenhuma moldura/fundo/borda/chanfro/padding, em nenhuma prop; se existir glifo próprio com o mesmo nome em `NavGlyphs.tsx`, o `Icon` o desenha, senão cai na ligature Material — a troca é invisível para quem chama.

### `src/components/ui/BackCircleButton.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** esmaece com modal aberto por cima (`useBackDimmed`, `data-modal-dimmed`).
**Dono de:** o VOLTAR padrão de toda tela cheia (rodada 6, L2): seta `arrow_back` pelada num círculo de 44 px (`BACK_CIRCLE`), sempre no canto esquerdo do cabeçalho; título/andar/nome da área vai à direita. Nunca "Fechar"/✕ em tela cheia.
**Props principais:** `onClick`, `label?` (padrão Voltar/Back por `language`), `language?`, `overScene?` (tinta clara sobre cena escura), `icon?` (`arrow_back` | `map`), `style?`, `data-*`.
**Exports:** `BACK_CIRCLE` · `BackCircleButton`.

### `src/components/ui/ChevronAcao.tsx` (14/11/2026, REGISTRO §365)
**Dono de:** a SETA de ação do app: chevron `>` turquesa (`--sm2-primary-ink`) sem haste e sem círculo, glifo `chevron_right`. Um dono para dois lugares: o fim da linha de hábito que leva a um prédio (`RitualRow.action`) e o fim do texto do balão dourado (`CompanionHUD`, `BalaoDouradoTexto`).
**Props principais:** `onClick?` (com ele é `<button>` com alvo de 44 px; sem ele é só desenho `aria-hidden`), `label?` (nome acessível), `size?` (20), `style?`, `data-*`.
**Exports:** `ChevronAcao`.
**Régua:** `DailyRituals.recurso.render.test.tsx` e `CompanionHUD.balaoDourado.render.test.tsx`.

### `src/components/ui/BlockedActionModal.tsx`
**Dono de:** o modalzinho PADRÃO de ação bloqueada (dono, 09/11/2026): diz POR QUE a ação não pode, PT/EN. `ModalSheet` centralizado em portal (foco, Esc, véu, camada acima do voltar); fecha com OK, com o fechar do canto ou tocando fora. O lugar em "pode ser obtido em <lugar>" é tocável e leva até lá (`requestGoToBuilding`).
**Props principais:** `reason` (`BlockedReason | null`), `onClose`, `language`, `onGo?`.
**Exports:** `BlockedActionModal` · `useBlockedAction(language, onGo?)` → `[modal, explain]`.
**Régua:** `ui/BlockedActionModal.render.test.tsx`.

### `src/components/WakeToEnter.tsx` (13/11/2026, REGISTRO §329)
**Dono de:** o portão ÚNICO das atividades com o Soulmon dormindo. `WakeToEnterProvider` (montado na raiz do `App` com `isSleeping`, `dayWakePending`, `language` e `onWake` = o `handleSleep` de sempre, só chamado dormindo) guarda a entrada pedida e mostra `WakeToEnterPrompt`: "Seu Soulmon está dormindo. Quer acordá-lo?", "Acordar" (acorda e SEGUE para a atividade escolhida) e "Agora não" (fecha e fica; o fechar, Esc e toque fora fazem o mesmo). `ModalSheet` centralizado em portal (foco preso, Esc, `aria-label`), botões `sm2-kit-btn` de 48 px, sem `CtaButton`. Sem provedor tudo segue direto.
**Exports:** `WakeToEnterProvider` · `WakeToEnterPrompt` · `useWakeGate()` → `{ require(entrada, seguir), held(entrada) }` · `useRequireAwake()` (atalho do `require`).
**Usado por:** `nav/AreaView.tsx` (a porta do Calabouço e a folha inicial do atalho, o "Lutar" da Arena livre, o `start` dos jogos — que inclui o "Descer" da Fenda), `TournamentPage.tsx` (lutar, treino, desgarrado), `guild/GuildSheet.tsx` (Buscar guerra, rodada da Feira, mandar o Soulmon na missão), `guild/PlantioVisor.tsx` (cuidar e lutar no Grove), `play/PasseioSheet.tsx` (escolher a missão), `play/FocusBoard.tsx` (Começar jornada), `LibraryPage.tsx` (Treinar com amigo). Desde a emenda de 13/11 as folhas entram livres e o botão de dentro pergunta no toque.
**Régua:** `WakeToEnter.render.test.tsx`.

### `src/components/ui/BitsAmount.tsx`
**Dono de:** o ÚNICO componente que mostra um valor de Bits (D-62, 19/10/2026, REGISTRO §105): ícone de Bits (`BitsIcon`, 16 px por padrão) + número em `bitsStyle`; a palavra "Bits" só para leitor de tela (`sm2-sr-only`). **Régua:** `ui/BitsAmount.render.test.tsx` (Bits sempre pelo componente; as três moedas nunca com a mesma tinta).

### `src/components/CompletionTag.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `fragments = 0`: "+N fragmento(s) de alma" (termo destacado por `SoulFragmentTerm`, `data-completion-fragments`) quando a conclusão rendeu Fragmentos de Alma hoje.
**Dono de:** a tag de "feito" no RODAPÉ (pedido do dono, 29/10/2026): uma só peça que confirma a conclusão, mostra o ganho exato e oferece o Desfazer — substitui o ⚰️ `UndoToast` e o aviso do placar do dia. Desenho inline, `role="status"`, glifo `check_circle`, alvo do botão de 44px, PT+EN.
**Props principais:** `language`, `name`, `items` (`readonly PreviewItem[]`), `onUndo()`.
**Exports:** `CompletionTag(props)`.
**Depende de:** `ui/Icon`, `ui/RewardPreview` (modo `after`).
**Chamado por:** `src/App.tsx`. A janela de vida (`UNDO_WINDOW_MS`) é de quem monta a tag.
**Régua:** `src/components/CompletionTag.render.test.tsx`.

### `src/components/EvoRecapModal.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o botão fechar é `CtaButton`.
**Dono de:** a 2ª página do resumo da manhã (REGISTRO §190): a barra do gauge sai do valor de ontem e enche até o de hoje, com três números (ontem, agora, falta). Só existe quando houve progresso, então nunca cobra.
**Props principais:** `recap` (`EvoRecap`), `language`, `onClose()`.
**Exports:** `EvoRecapModal(props)` · `default` · `lanternaDaEvolucao(pct)` (estágio estático da lanterna do corvo: <34 / <67 / resto; o recap usa a `lanterna-anim.webp` e só cai nos estáticos em movimento reduzido).
**Estado/efeitos relevantes:** `filled` vira `true` após 350 ms e faz a largura transicionar (classes `sm2-evo-recap-fill`/`sm2-evo-recap-glow` em `index.css`); `role="progressbar"`; com `prefers-reduced-motion` a barra salta ao valor final.
**Depende de:** `utils/evoRecap` (tipo), `ritual/RitualKit` (`RitualDialog`), `form/FormKit`, `ui/SoulFragmentIcon`.
**Chamado por:** `src/App.tsx`.
**Régua:** `src/components/EvoRecapModal.render.test.tsx`.

### `src/components/EvolutionStatsModal.tsx`
**Dono de:** o modalzinho de DEPOIS da evolução (05/11/2026, pedido do dono): Vida, Ataque, Defesa e Velocidade do Soulmon em "antes → depois (+N)". Só desenha; os números vêm de `utils/evolutionStatsDelta.ts`. Delta 0 = "+0" (peso 400); nunca há "−N" (evoluir nunca reduz, REGISTRO §229). Sem animação própria (o fade do `ModalSheet` já respeita movimento reduzido). Glifos existentes: `favorite`, `swords`, `military_tech`, `bolt`.
**Props principais:** `delta` (`EvoStatsDelta`), `stageName`, `language`, `onClose()`.
**Exports:** `EvolutionStatsModal(props)`.
**Depende de:** `form/FormKit` (`ModalSheet`, centralizado), `ui/Icon`, `utils/evolutionStatsDelta`, `utils/soulXP` (`soulLevelLabel`).
**Chamado por:** `src/App.tsx` (id `evoStats` da fila de apresentação).
**Régua:** `src/components/EvolutionStatsModal.render.test.tsx`.

### `src/components/ui/RewardPreview.tsx`
**Dono de:** a linha ÚNICA de recompensas antes e depois de uma ação (`docs/RECOMPENSAS-VISIVEIS.md`, 29/10/2026). `mode="before"`: valor fixo `+N`, faixa `até N`/`up to N`, ou só o ícone; `mode="after"`: o valor realmente concedido (some se 0). Nenhuma regra mora aqui: quem chama deriva os números das funções que concedem.
**Props principais:** `items`, `mode` (`'before' | 'after'`), `language`, `size` (padrão 20).
**Exports:** `PreviewItem` (união `bits` | `xp` | `honor` | `energy` | `item` | `custom`, todas com `amount?`/`max?`) · `RewardPreview(props)`.
**Depende de:** `Icon`, `BitsAmount`, `RewardPop` (`RewardIcon`), `utils/rewardIcons`, `utils/currencies` (`emblemStyle`).
**Chamado por:** `src/App.tsx`, `CompletionTag`, `ArenaGame`, `DungeonGame`, `RPSGame`, `SoulBarrage`, `NightmareBattle`, `TournamentPage`, `MorningCheckIn`, `guild/FeiraEventoSheet`, `play/OficinaSheet`, `play/PlaySheets`.
**Régua:** `src/components/ui/RewardPreview.render.test.tsx`.

### `src/components/ui/RewardPop.tsx`
**Dono de:** as peças de desenho da REVELAÇÃO DE RECOMPENSA (dono, 28/10/2026): `RewardPop` (o que nasce minúsculo, passa um pouco do tamanho e assenta — keyframes `sm-pop-in` no fim do `index.css`; invisível mas ocupando o lugar antes de nascer), `RewardIcon` (ícone pelado em pixel-art dentro de `RewardPop`) e `RollingCount` (odômetro de caça-níquel: colunas de dígitos que rolam de 0 ao valor; o valor final fica sempre no DOM em `sm2-sr-only`, os dígitos são desenhados por CSS `::before` para o `textContent` não poluir). Quem sequencia é `hooks/useRewardReveal.ts`; o cronograma é `utils/rewardReveal.ts`. **Usado em:** `games/ResultScreen.tsx`, `DungeonReturnModal.tsx`, `ui/BitsAmount.tsx` (prop `roll`), `ui/BitsReveal.tsx`. **Régua:** `games/ResultScreen.reveal.render.test.tsx`.

### `src/components/ui/EnergyCost.tsx`
**Dono de:** o ícone de custo de energia nos botões e cartões (04/11/2026, dono). Decorativo (`aria-hidden`), `data-energy-cost`. **Usado em:** `play/PlaySheets.tsx` (Salão, Masmorra), `PlayCard.tsx` (Brincar), `DungeonGame.tsx` (Descer), `play/OficinaSheet.tsx` (iniciar foco). Régua: `play/energiaCusto.render.test.tsx`.

### `src/components/EvoBanner.tsx`
**Dono de:** a faixa de evoluções logo abaixo da linha do voltar (04/11/2026, dono): feed global + aviso local da própria evolução, em fila, sem bloquear toque; movimento reduzido fica parado. **Usado em:** `App.tsx` (`lazy`). **Régua:** `EvoBanner.render.test.tsx`.

### `src/components/TalentTreeEntry.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o botão é `CtaButton tone="acao"` com o rótulo "Árvore de talentos".
**Dono de:** a entrada da árvore de talentos na `StatsPage` (04/11/2026, dono): cartão com os pontos livres e botão que abre a árvore em TELA CHEIA. **Usado em:** `StatsPage.tsx`. **Régua:** `TalentTreeEntry.render.test.tsx`.

### `src/components/forge/VitraMap.tsx`
**Dono de:** o layout do Soulsmith em mapa de chakras (04/11/2026, dono): figura de vidro soprado (`vitra-mapa.png`, 852x1846, em TELA CHEIA; sem fallback em SVG) e os três chakras com o balão abaixo do anel. Só layout; as regras ficam em `ForgeCard.tsx`. **Usado em:** `ForgeCard.tsx` (`view="map"`). **Régua:** `ForgeCard.mapa.render.test.tsx`.

### `src/components/nav/LotIndicator.tsx`
**Dono de:** o disco com ícone dourado "há o que gastar" sobre o prédio (04/11/2026, dono). **Usado em:** `nav/AreaScene.tsx` (camada de marcas), `TalentTreeEntry.tsx`. Regra de quando acende: `src/utils/lotIndicators.ts`.

### `src/components/nav/LotCoin.tsx`
**Dono de:** a moeda de recurso sobre o prédio do mapa (04/11/2026, dono): raio da energia amarelo num círculo escuro de fio de cobre; só indica que há recurso a pegar. **Usado em:** `nav/AreaScene.tsx` (camada de marcas). Regra de quando acende: `src/utils/lotMarks.ts`.

### `src/components/ui/BitsReveal.tsx`
**Dono de:** a linha ÚNICA de Bits de um fim de partida com a revelação padrão (a moeda estoura, o número rola e pousa com o "ding"; toque pula). **Usado em:** `mente/TrocaGame.tsx`, `mente/PicrossGame.tsx`, `mente/RevisaoGame.tsx`. Telas com mais de uma linha de recompensa usam `ResultScreen`. **Régua:** `mente/revisaoRespiracao.render.test.tsx`.

### `src/components/ui/RewardLine.tsx`
**Dono de:** a linha de recompensa com ícones (D-71, 19/10/2026): Bits, energia (`bolt`) e coração (`favorite`), nome só para leitor de tela. **Usado em:** vitória do `NightmareBattle`.

### `src/components/ui/LockBadge.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** `LockNotice({ text, onClose?, closeLabel })`: com `onClose` o aviso NÃO some sozinho nem por toque fora, só pelo X (16/11/2026, dono).

Cadeado dos prédios trancados por Vínculo (Tarefa A, 07/10/2026): `LockGlyph` (SVG procedural, sem emoji), `LockBadge` (chip "Vínculo N"/"Bond N", decorativo para leitor de tela), `LockNotice` (`role="status"`) e `lockLabel` (texto acessível do botão). Quem decide trancar é `buildingGateFor`/`areaLockedAt` em `src/utils/gates.ts`; usado por `MapPage`, `AreaScene` e `AreaView`.

### `src/components/ui/PixelIcon.tsx`
**Dono de:** o ícone de UI em pixel art do squad de arte (`src/assets/soulmon/icones-ui/`, alfa real, 128px no lado maior) — `<img>` decorativo (`alt=""`, `aria-hidden`), caixa quadrada `size` com `object-fit: contain`, sem fundo nem moldura.
**Props principais:** `name?: UiIconArt` (`mapa`/`home`/`itens`/`dormir`/`banho`/`acoes`/`enviar`/`hp`/`energia`) **ou** `src?: string` (04/10/2026: arte de outro mapa — `QUEST_ART`, os ícones de interação de `icones-ui/interacao.ts`, a carga do especial), `size`, `style?`. Com `src`, a escala de ícone (20/24/32) continua vigiada pelo `iconScale.contract.test.ts`.
**Exports:** `PixelIcon`.
**Chamado por:** `src/App.tsx` (menu da Home → `acoes`), `src/components/nav/CornerLink.tsx` (`mapa`/`home`), `src/components/CompanionHUD.tsx` (cuidados `itens`/`dormir`/`banho`, stats `hp`/`energia`), `src/components/ChatBox.tsx` (`enviar`) — 24/09/2026. A moldura `chip-moeda` do mesmo pacote é usada direto pelo `MapPage` (9-slice).
**Régua:** `size` entra na varredura de `src/styles/iconScale.contract.test.ts` (mesma escala de §6.1); o `CornerLink` é exercitado em `src/components/nav/nav.render.test.tsx`.

### `src/components/ui/PlayerName.tsx` (13/11/2026, o clã embaixo do nome — REGISTRO §321)
**Dono de:** o NOME DE OUTRO JOGADOR com o nome do CLÃ embaixo, em toda tela que mostra outra pessoa. O nome mantém o estilo de quem chama (`nameStyle`); o clã vem numa linha própria, menor e calma: `--sm2-text-xs`, peso 400, `--sm2-muted`, `--sm2-font-text`. Sem clã não desenha nada. As duas linhas cortam com reticências; o leitor de tela ouve "Clã <nome>".
**Props principais:** `name`, `guildName?` (ausente/vazio = nada), `suffix?` (na linha do nome, ex. " (você)"), `nameStyle?`, `guildStyle?`, `align?` (`center` no pódio), `isPt?`.
**Exports:** `PlayerName`.
**Chamado por:** `RankingPodium` (pódio dos placares dos jogos), `RankingList` (linhas dos placares), `TournamentPage` (oponentes do Torneio, Treino e ranking da temporada), `PlayerDetailModal` (título do perfil), `LibraryPage` (linhas do Drive/Amigos e convites de amizade recebidos), `guild/GuildSheet` (Roda), `PlayerSearch` (sugestões).
**Régua:** `src/components/PlayerSearch.render.test.tsx` (com e sem clã); `GuildSheet.render.test.tsx` (a linha do nome continua só o nome).
**Régua:** `src/components/RankingPodium.render.test.tsx` (com e sem clã).

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

### `src/components/ui/LoadingBar.tsx`
**Dono de:** o ÚNICO indicador de carregando do app (REGISTRO §50): barra de 3px turquesa que enche da esquerda para a direita; sem texto, spinner nem ilustração. A splash do `index.html` usa o mesmo visual (`.sm2-loadbar` em `index.css`).
**Props principais:** `LoadingBarProps` — `progress?` (0-1; ausente = simulado assintótico, teto 94%), `done?` (completa a 100% e some em fade de 220ms), `onExited?`, `language?`, `label?` (só leitor de tela), `style?`.
**Exports:** `LoadingBar` · `default` · `SIMULATED_CEILING` · `simulatedStep` · `steppedStep`.
**Estado/efeitos relevantes:** `setInterval` de 120ms só no simulado (500ms em passos de 20% com `prefers-reduced-motion`); `role=progressbar` com `aria-valuenow` só quando determinado, `aria-busy`.
**Chamado por:** `src/components/ui/ScreenSkeleton.tsx`.
**Régua:** `src/components/ui/LoadingBar.render.test.tsx`.

### `src/components/ui/ScreenSkeleton.tsx`
**Dono de:** o que aparece enquanto uma tela `lazy()` chega — substitui os 20 `Suspense fallback={null}` que apagavam a tela.
**Props principais:** `ScreenSkeletonProps` — `language?`, `label?` (só leitor de tela), `variant?` (`page` · `overlay` · `inline`), `state?` (`loading` · `error` · `done`) e `onRetry?`. Desde §50 o `loading` é a `LoadingBar`; este componente só enquadra e guarda o `error`.
**Exports:** `ScreenSkeletonProps` (interface) · `ScreenSkeleton(props)` · `default`.
**Estado/efeitos relevantes:** nenhum estado próprio.
**Chamado por:** `src/App.tsx`, `src/components/ContentModals.tsx`, `src/components/SoulmonOnboarding.tsx` (`grep -rl "from '.*/ScreenSkeleton'" src`, 09/09/2026).
**Régua:** `src/components/ui/ScreenSkeleton.render.test.tsx` (beta-2, 9.4).
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

### `src/components/ui/FunctionNpcNote.tsx`
**Dono de:** o busto de FUNÇÃO de uma tela (14/10/2026): imagem de `FUNCTION_NPC_ART` + nome e fala de `functionNpcVoice`, só acolhida, sem cobrança.
**Exports:** `FunctionNpcNote({ id, language, size? })`.
**Chamado por:** `SettingsPage.tsx` (Tobi em Configurações, Faro em "Sua conta"), `RestWindowCard.tsx` (Sona), (a Nuri, `cuidados`, não é mais usada na Mochila desde 14/10/2026; sem chamada hoje).

### `src/components/ui/AvatarFrame.tsx`
**Dono de:** o DESENHO das molduras de avatar (R8, 04/10/2026) e o seletor. `AvatarFrame` envolve o avatar (normalmente um `MiniGlass`) com a ARTE da moldura (`FRAME_ART`, `utils/frames.ts`: canvas 192² com abertura de 96 centrada) desenhada por cima, a abertura em 94% do lado do avatar e o transbordo reservado na `margin`; id sem arte cai no anel CSS do `look`; o frame BÁSICO (`origin: 'basic'`, preto, 2px, grátis e padrão de todos) é só `outline` sem margem — não desloca layout — e `null` não existe mais (`frameOrBasic`/`resolveEquippedFrame` devolvem o básico). Mestre/Grão-Mestre escrevem o `#N` (`plaque`) como texto vivo na plaquinha. `FrameSelector` lista o catálogo: as disponíveis são botões (`aria-pressed`), as trancadas mostram como se consegue (tracejado, `aria-disabled`, fora do Tab — nunca opacidade).
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
**Chamado por:** `src/components/CompanionHUD.tsx`, `src/components/EvolutionPath.tsx`, `src/components/PetPage.tsx`, `src/components/PlayerDetailModal.tsx`, (`grep -rl "from '.*/Viewport'" src`, 09/09/2026).
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
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** **10163 linhas** (`wc -l src/App.tsx`), **128** handlers (`grep -c "const handle[A-Za-z0-9_]* *="`), 64 `useState(` e 65 `lazy(`. Entraram: a caixa de cartas do Papus (`useMailbox`, `MailboxSheet` via `lazyOverlay`, `openMailbox`, `mostraCarta` = sem demo e com carta); a fila da Vesca (`vescaQueue`, `essenceThresholdCrossings`, `readVescaOffered`/`writeVescaOffered`, `VescaPotionOffer` lazy); `EvoBanner` (lazy); `handleEquipFormaAlt` (equipar a forma do estágio ATUAL aplica tudo com `trocarFormaCompleta`) e `capturarForma`/`aoDescerDeForma` no evoluir/degenerar (`utils/formaSnapshot.ts`); `elementoAoEvoluir`/`nascerElementoJornada` (elemento por estágio); `handleStrollDiscover`; `handleSaveHomeDecor`, `handleSelectWidgetFrame`, `handleBuyWidgetFrame`; `handleGlitchtama({ runReward, drop })`; `handleEarnGamePoints` devolvendo os Bits creditados; `applyJourneyGrants` (jornada do Foco) e o id `evoStats` na fila de apresentação.
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** **10881 linhas** (`wc -l src/App.tsx`), **134** handlers (`grep -c "const handle[A-Za-z0-9_]* *="`), 74 `useState(` e 70 `lazy(`. Handlers novos: `handleAcceptBonusTask` (grava `bonusTask` como LISTA de `{day, activityId}` e já inclui o hábito no plano do dia — a oferta reduzida do "nunca falte duas vezes" vira a tarefa bônus, não conclui nada), `handleBalaoIgnorado`/`handleBalaoDourado` (balão dourado e dica dourada), `handleFeiraLojaBuy`/`handleFeiraHexBought`/`handleFeiraVoltaVer` (Feira de verdade), `handleCloseWeeklyRetro`, `handleStepsInviteAccept`. Mudaram de assinatura: `handleToggleActivityCompletion(activityId, opts?: { auto? })`, `handleEarnGamePoints(pts, extraCap = 0, category)` (teto de Bits por categoria), `handleExchangeCredits(packId)` (os 3 pacotes de Bits do Cambista; devolve o resultado com o motivo da recusa), `handleSwitchForm(targetStage, elemento?)`, `handleTuneVisor`/`handleRetrySprite` (formId passa por `chaveDe`). Saíram: `handleChangePetName` (renomear é da Hexsmith) e `handleDismissWeeklyReport`. `lazy` novos: `StepGoalModal`, `StrollNowScene`, `ElementosNovosModal`, `FeiraLojaSheet`, `StepsInviteModal`, `WeeklyRetroModal`; `BonusTaskIntroModal` por `lazyOverlay`; `WakeToEnterProvider` monta o portão do Soulmon dormindo. `/embed`: `mostraVideoDeMarca`/`tocaCinematicaInicial`/`exigeTermo` (`utils/embedGates.ts`) desligam vídeo de marca, cinemática e termo.

### `src/main.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** chama `installEmbedNetworkGuard()` (`utils/embedMode.ts`) antes de qualquer provider: em `/embed` (demo do portfólio) corta `/api/*` e beacon; fora do embed é no-op.
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


### `src/components/StepGoalModal.tsx`
**Dono de:** o modalzinho da meta de passos ao ADOTAR o hábito de caminhar (REGISTRO §413): 3.000 / 5.000 / 7.000 / 10.000 (`STEP_GOAL_OPTIONS`); escolher grava `stepGoal`, fechar não muda nada.
**Exports:** `StepGoalModal`.
**Chamado por:** `src/App.tsx` (lazy, aberto por `commitHabitCreate` quando o item tem recurso `steps`).
**Régua:** `src/components/StepGoalModal.render.test.tsx`.

### `src/components/StrollNowScene.tsx`
**Dono de:** a cena do Passeio que roda NA HORA do "Concluir" (REGISTRO §413): a `StrollScene` alimentada por `applyStrollNow`; o avistado já entrou no Drive, então OK/Pular não gravam nada; fechar leva à Home.
**Exports:** `StrollNowScene`.
**Chamado por:** `src/App.tsx` (lazy, estado `strollNow`).
**Régua:** a conta é testada em `src/utils/strollNow.test.ts`; a cena em `src/components/StrollScene.render.test.tsx`.

### `src/components/StepsInviteModal.tsx`
**Dono de:** o convite curto da contagem de passos (REGISTRO §283), intersticial `stepsInvite` da fila central: pergunta sim/não do MESMO peso, meta escolhível, sem X.
**Exports:** `StepsInviteModal`, `StepsInviteModalProps`.
**Chamado por:** `src/App.tsx`
**Régua:** `src/components/StepsInviteModal.render.test.tsx`.

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

### `src/components/ui/BotaoEspecial.tsx`

**Dono de:** o botão ESPECIAL de compra (18/11/2026, pedido do dono): placa dourada em pedra turquesa escura, 3-slice por `border-image` (pontas de 110 px na arte, 40 px na tela; miolo liso estica), um WebP por estado (`assets/soulmon/ui/btn-especial{,-press,-off}.webp`, 580x146, alfa real, sem texto, pintado no ChatGPT). **Exports:** `BotaoEspecial({ width?: 'full'|'auto', variant?: 'dourado'|'pve'|'pvp', ...button })` (variantes de 18/11/2026: `pve` = Aventura/Amistoso, `pvp` = PvP/Ranqueada; arte `btn-pve*.webp` e `btn-pvp*.webp`) (`forwardRef`; rótulo e `EnergyCost` vêm como `children`). Visual único em `.sm2-especial` (`index.css`; reduced-motion no bloco canônico). **Usos:** "Comprar 3 tickets" (`TicketPanel` do Salão e confirmação do `TicketBuyModal`) e "Comprar convites" (`ComprarConvites` do `DueloSheet`). A compra não mudou. Outras ações seguem `CtaButton`/`sm2-kit-btn`.

### `src/components/ui/HonorIcon.tsx`

**Dono de:** o ícone da HONRA (a medalha, `assets/soulmon/icones-ui/moeda-emblema.png`, alfa real): par do `CreditIcon` e do `BitsIcon` nas 3 pílulas iguais do HUD de moedas do Mapa (24/11/2026). **Exports:** `HonorIcon({ size = 20, label?, className?, style? })` (decorativo por padrão; com `label` vira imagem nomeada). **Quem usa:** `MapPage` (pílula de Honra). **Régua:** só a arte da medalha; largura, fundo e gap da pílula são do `index.css` (`.sm2-moeda*`), não do ícone.

### `src/components/ui/CreditIcon.tsx`

**Dono de:** o ícone dos CRÉDITOS (a moeda premium, comprada com dinheiro de verdade; 18/11/2026, pedido do dono): o diamante turquesa lapidado com a chama da alma (`assets/soulmon/icones-ui/moeda-creditos.png`, 256², alfa real, pintado no ChatGPT). **Exports:** `CreditIcon({ size = 20, label?, className?, style? })` (decorativo por padrão; com `label` vira imagem nomeada). Substitui o glifo `diamond` em Conta, `CreditsModal`, Cambista/`ShopShelf`, `MercadoSheets` e no chip do Mapa; o glifo `diamond` segue para outros usos.

### `src/components/ui/CtaButton.tsx`
**Dono de:** o botão especial dos CTAs principais (REGISTRO §316, §316b, §316c): `CtaButton({ width: 'full' | 'auto', tone: 'padrao' | 'acao', ...button })`, visual em `.sm2-cta` (`index.css`, o mesmo botão do site do beta: `assets/soulmon/ui/btn-cta{,-hover,-press,-off}.webp`, de `site-beta/public/dono/botao*.webp`, 9-slice `62 74 fill`). Um arquivo por estado como no site: normal, hover, pressed (desce 2 px), disabled (moldura cinza), foco (arte de hover + brilho turquesa); `ref` repassado ao `<button>`; alvo >= 56, `prefers-reduced-motion`. E a secundária dele, `CtaTextButton({ width: 'auto' | 'full', surface: 'claro' | 'escuro', ...button })` (`data-cta-texto`), visual em `.sm2-cta-texto`: SÓ TEXTO, sem fundo e sem borda, cor `--sm2-muted` (`--sm2-viewport-ink` em `surface="escuro"`), sublinhado ao tocar/hover/foco, alvo >= 44, anel de foco `primary-ink`. **Usado por:** `App.tsx` (Criar poção), `FocusBoard` (Começar jornada), `RestRoom` (Seguir + `CtaTextButton` Concluir a missão e Sair), `EvoRecapModal` (Seguir), `PocaoCriada` (OK, §364), `EvolutionCeremony`/`MilestoneCeremony`/`GroveMilestoneCeremony` (§364), `TalentTreeEntry` ("Árvore de talentos"), `GuildSheet` (Entrar, sem conta + `CtaTextButton` Tentar de novo).
**Tom (§316b, 13/11/2026):** `tone="acao"` (`data-cta-tone="acao"`) = a ação que a pessoa VEIO buscar, não uma escolha: repousa na arte CHEIA (`btn-cta-hover.webp`), porque no celular não existe hover. Pressionado (`btn-cta-press`) e desabilitado (`btn-cta-off`) mantêm a arte própria; hover e foco usam a mesma arte cheia (o foco ainda ganha o brilho turquesa). `padrao` (omissão) = confirmar, seguir, entrar. Hoje em `acao`: "Criar poção" (Laboratório), "Árvore de talentos", "Começar jornada" (Foco).
**Regra de par (§316c, 13/11/2026, dono): `CtaButton` só convive com secundária SÓ TEXTO.** Ao lado (ou embaixo) de um `CtaButton`, a outra ação é sempre `CtaTextButton` — nunca botão com fundo (`primary`) nem com contorno (`outline`). Se a ação secundária for importante demais para ser só texto, a tela NÃO usa `CtaButton`: volta ao par padrão `sm2-kit-btn` (`primary` + `quiet`/`outline`), em linha.
**Onde o CTA do site ENTRA também (§364, 14/11/2026, dono): telas de celebração/revelação em tela cheia** (poção criada, cerimônia de evolução, marcos de hábito e do Bosque) usam o CTA do site; modais comuns seguem com os botões antigos.
**Onde o CTA do site NÃO entra (§316c):** modais e popups brancos pequenos (nó da árvore de talentos, folhas de poção, `ConfirmDialog`, oferta da Vesca e similares) — ali ele fica pesado; usam o botão padrão do app, Confirmar/Cancelar em linha, como antes do §316. O CTA fica em telas cheias e cards.
**Layout em coluna (§316b):** quando há CTA + secundária: (1) CTA em cima, largura total; (2) `CtaTextButton` embaixo, centralizado; (3) `display: grid`, alvo >= 44 em todos; (4) ordem do DOM = ordem visual = ordem de tab (CTA primeiro); (5) contêiner marcado com `data-cta-stack`.

| Tela | Botões | Decisão (§316c) |
|---|---|---|
| `TalentTreeEntry` | "Árvore de talentos" (sozinho) | CTA do site, tom `acao`; rótulo sem "Abrir" |
| `RestRoom` | Seguir + Concluir a missão + Sair | CTA do site; Concluir e Sair viram `CtaTextButton surface="escuro"` |
| `GuildSheet` (erro sem conta) | Entrar na conta + Tentar de novo | CTA do site; Tentar de novo vira `CtaTextButton` (sem conta/CTA ao lado, segue `outline`) |
| `App.tsx` Laboratório, `FocusBoard`, `EvoRecapModal` | CTA sozinho, largura total | CTA do site, sem secundária |
| **Celebração/revelação em tela cheia (§364, 14/11/2026, dono)** — `PocaoCriada` (OK, tom `acao`, `auto`), `EvolutionCeremony` e `MilestoneCeremony` ("Seguimos juntos"), `GroveMilestoneCeremony` (botão do marco) | CTA sozinho, sem secundária | CTA do site (`data-vesca-ok`/`data-cer-close` mantidos); foco, toque e fila iguais. Fora: `LevelUpOverlay` (toque na tela), `BossSplash` (aviso pré-luta), `DropNotice` (cartão pequeno), `ResultScreen` (par de escolhas) |
| `TalentTree` (modal do nó) | Confirmar + Cancelar | botão padrão do app em linha (`sm2-kit-btn-primary` + `quiet`) |
| `ElementPotionSheet` (rodapé) | Confirmar | botão padrão do app (`sm2-kit-btn-md sm2-kit-btn-primary`, `minWidth: 220`, centralizado) |
| `VescaPotionOffer` | Depois + Fazer a poção | botão padrão do app em linha (`sm2Button('quiet')` + `sm2Button('primary')`) |
| `ConfirmDialog` e demais confirmações pequenas | Sim/Não | nunca usaram `CtaButton`; seguem em linha |

### `src/components/ui/InfoTip.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `trigger?: ReactNode` (gatilho próprio no lugar do "i") e o tooltip aberto registra camada de voltar (`useBackLayer`).
**Dono de:** o "?" PADRÃO do app (pedido do dono, 02/10/2026): todo texto explicativo sai da tela e vira um "?" em círculo (glifo `help`, pelado) que abre um tooltip.
**Sync 18/11/2026:** dentro de uma moldura (`ModalInfoSlotProvider`, aberto por `ModalFrame`/`GameRoot moldura`) o `InfoTip`/`ModalInfo` NÃO desenha ícone: se registra e o provedor monta um único botão transparente sobre o ornamento "i" da arte (várias infos = um painel com seções; nenhuma = sem botão). `inherit` faz a sub-folha do miolo assumir o ornamento. Fora de moldura nada muda.
**Props principais:** `children` (texto do tooltip), `label` (nome acessível, por idioma), `language`, `align?`, `style?`, `trigger?`.
**Exports:** `InfoTip`, `InfoTipSection`, `ModalInfo`, `ModalInfoSlotProvider`, `useModalInfoSlot`, `alvo44`.
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

### `src/components/ui/CristalChama.tsx`
**Dono de:** o CRISTAL-CHAMA turquesa (arte aprovada 18/11/2026, `assets/soulmon/ui/cristal-chama.webp`) como puxador/ornamento de TOPO reutilizável para molduras e modais: absoluto, topo-centro, sobreposto ao encaixe; usa o `--u` do pai (que precisa ser `position: relative`). Decorativo (`aria-hidden`, `alt=""`). Brilho pulsante opcional que para com `prefers-reduced-motion` e pausa fora da tela (IntersectionObserver). Só UI/moldura (REGRA-IDENTIDADE-SOULMON): nunca em criatura, FX ou ícone de elemento.
**Props principais:** `tamanho?` (largura em `u`, 17), `topo?` (distância do topo em `u`, -14), `pulsar?` (false), `className?`, `style?`.
**Exports:** `CristalChama` · `default`.
**Uso:** `<CristalChama />` dentro do corpo de um modal com `--u`; maior e pulsando: `<CristalChama tamanho={22} topo={-18} pulsar />`. CSS: `.sm2-cristal-chama` em `src/index.css`.
**Chamado por:** `src/components/home/Mochila.tsx` (modal Files).
**Régua:** `src/components/ui/CristalChama.render.test.tsx`, `src/components/home/Mochila.filesModal.render.test.tsx`.

### `src/components/ui/BitsIcon.tsx`
**Dono de:** a moeda dos Bits (I4, 02/10/2026) — o PONTO ÚNICO de troca de arte. Detecta `src/assets/icons/bits.png` por `import.meta.glob`; sem o arquivo, desenha uma moeda pixel 8×8 provisória (aro `primary-ink`, miolo `gold-ink`, barra gravada) com tokens de cor. Decorativa (`aria-hidden`) salvo quando recebe `label`.
**Props principais:** `size?` (20), `label?`, `style?`.
**Exports:** `BitsIcon`.
**Chamado por:** `src/components/mercado/ShopShelf.tsx` (`Bits`), `src/components/nav/MapPage.tsx` (chip de saldo).
**Régua:** `src/components/ui/BitsIcon.render.test.tsx`, `src/components/mercado/MercadoSheets.render.test.tsx`.

### `src/components/ui/SoulFragmentIcon.tsx`
**Dono de:** o glifo do Fragmento de Alma (20/10/2026, REGISTRO §153): cristal losango pixel 8×8 em SVG de `rect`s (`primary-ink`/`primary-fill`/`surface`), mesma família do `BitsIcon` com forma própria. Decorativo (`aria-hidden`) salvo com `label`.
**Props principais:** `size?` (20), `label?`, `style?`.
**Exports:** `SoulFragmentIcon`.
**Chamado por:** `src/components/EvolutionPath.tsx`, `src/components/EvolutionCeremony.tsx`, `src/components/EvolutionGaugeMini.tsx`.
**Régua:** `src/components/EvolutionPath.gauge.render.test.tsx`, `src/components/EvolutionCeremony.fragmentos.render.test.tsx`.

### `src/components/ui/SoulFragmentTerm.tsx`
**Dono de:** o destaque do termo "Fragmento(s) de Alma" / "Soul Fragment(s)" em texto de UI (13/11/2026): negrito + turquesa (`--sm2-primary-ink`).
**Props principais:** `children`.
**Exports:** `SoulFragmentTerm` · `emphasizeSoulFragment(text)` · `SOUL_FRAGMENT_TERM_RE`.
**Chamado por:** `CompletionTag`, `HelpModal`, `GuideModal`, `EvolveTaskModal`, `EvolutionCeremony`, `EvolutionGaugeMini`, `EvolutionPath`, `hex/HexsmithSheet`, `WelcomeTour`.
**Régua:** `src/components/BonusTaskIntroModal.render.test.tsx`.

### `src/components/BonusTaskIntroModal.tsx`
**Dono de:** a apresentação da tarefa bônus (13/11/2026), aberta UMA vez na primeira conclusão de uma tarefa bônus (`GameState.bonusIntroSeen`). Dois exemplos lado a lado com a mesma `RitualRow` ("Item comum" / "Item especial" com título bronze) e a frase do dono, PT + EN.
**Props principais:** `open`, `language`, `onClose`.
**Exports:** `BonusTaskIntroModal`.
**Chamado por:** `src/App.tsx` (lazy).
**Régua:** `src/components/BonusTaskIntroModal.render.test.tsx`.

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
**Dono de:** a árvore de talentos dentro da `StatsPage` (Tarefa B, §2.37) — **desde o beta-2 (10.2, 13/10/2026) ela nasce ABERTA**: o botão "Abrir/Recolher a árvore" e o cartão de resumo (que repetia a linha da própria árvore) saíram; o progresso (`talentPicks`) mora no save e nunca dependeu de abrir. Monta o `TalentTree` (`lazy`). Sem save (demo) não renderiza nada.
**Régua:** `src/components/TalentTree.render.test.tsx` (bloco "Tarefa B").

### `src/components/TalentTree.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o talento da Fenda vira "teto de Bits +N" (`talentRiftBitsCap`, no lugar de `talentRiftBits`); refazer custa Bits sem a distinção "ganhos"; modal branco pequeno não usa `CtaButton` (§316c).
**Dono de:** a árvore de talentos DESENHADA como árvore (PR7 + Tarefa B): hub no centro, três caminhos que se bifurcam e se reencontram, nós como botões HTML sobre um SVG só de linhas, sempre a 100% (sem zoom; rolagem nativa, hub centralizado ao abrir), e tocar num nó abre um MODAL (`role=dialog`, `aria-modal`, foco preso e devolvido ao nó, Esc/toque fora cancelam) com descrição, o pré-requisito que falta EM TEXTO, stepper de pontos a atribuir (0 até o espaço = grau máximo, pontos livres e pré-requisitos) e Confirmar/Cancelar (Confirmar aplica N× `pickTalent`), setas/roving tabindex, `aria-label` por nó, movimento reduzido (CSS). Pontos, graus, pré-requisitos e respec vêm de `utils/talents.ts`; o desenho de `utils/talentLayout.ts`; local-first (o servidor valida na sincronia e poda o que viola pré-requisito). Com `tal-com-05` (Balança) o modal ganha "Tirar um ponto" (recusado se outro nó depende do grau).
**Régua:** `src/components/TalentTree.render.test.tsx`.

### `src/components/ForgeCard.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** aprimorar peça custa Bits em curva crescente (`upgradeBitsCost`, `BitsAmount` no botão; `data-forge-bits-cost`); o saldo é `spendableBits` (o Bit de Crédito paga tudo, §373) e o refazer custa Bits (ou fragmentos); tocar no custo do material abre "onde conseguir" (missão do prédio + expedições de foco, `FOCUS_ENVIRONMENTS`); `BackCircleButton` (`onBack`, `data-vitra-back`) no mapa.
**Uma peça por tipo (07/10/2026, pedido do dono):** o card é UM por slot (3 no total: Núcleo/Carapaça/Rastro), mostrando a peça possuída (o tier mais alto) com o nome do tier ("Copper Carapace"/"Carapaça de cobre"…) já equipada, e o ÚNICO botão é Upgrade (+ "Refazer escolha" dentro de "Escolhas feitas"). Sem "Equip"/"Equipar" e sem "Tirar". Peça ainda não obtida: card informativo "Vem da missão de X", sem botão. `sanitizeEquipment` (cliente e `_equipment.js`) deixa só o tier mais alto por slot; `applyForgeGrant` de um tier maior SUBSTITUI a peça anterior e herda nível e escolhas.
O Soulsmith (07/10/2026, lazy): 9 peças em cards (Lv N → Lv N+1 / Max, bônus, custo e saldo em chips, botão Upgrade; recusa em texto), modal de escolha A/B e Refazer escolha (Bits/fragmentos). Substituiu a `EquipmentCard` (compra por Bits). Regras em `utils/forge.ts`/`forgeActions.ts`. **Não existe "Tirar"/"Unequip"** (pedido do dono, 07/10/2026): as peças são partes da alma, aprimoradas; o selo diz "Parte da sua alma"/"Part of your soul" e `applyUnequip` foi apagada. O `Equip` só sobra para trocar entre tiers do mesmo slot.
**Régua:** `src/components/ForgeCard.render.test.tsx`.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** prop `view?: 'list' | 'map'` (padrão `list`) e `onBack`: `map` desenha o Soulsmith como mapa de chakras (`forge/VitraMap`, balão com as duas opções de aprimoramento, `pop`/`popChoice`); as regras e as recusas são as mesmas nos dois; `runUpgrade` serve ao modal da lista e ao balão. Cada peça mostra o bônus de atributo que dá agora (`bonusTexto`); `forgeReadySlots` acende o indicador do prédio. Entrada: `AreaView` monta `<ForgeCard view="map" inline>` (a ForgeCard original: figura humanoide + 3 chakras; `inline` = sem tela cheia, sem moldura de tela e sem barra própria, palco na largura do modal) DENTRO da `AreaSheet` do lote `ferreiro` (23/11/2026, REGISTRO §513, revisto: a lista `view="list"` foi rejeitada pelo dono).


### `src/components/SoulsmithSheet.tsx` (removido em 23/11/2026)
Removido a pedido do dono (a folha com texto e botão intermediários não volta): o lote `ferreiro` abre a `AreaSheet` COM a Vitra (retrato + fala de `areaNpcVoice`, como a Hexsmith) e a `ForgeCard` (`view="map" inline`) rola DENTRO dela; sem tela cheia (a tentativa de 23/11, #1130, foi revertida) e com o ✕ único da folha.
**Régua:** `src/components/nav/areaLotsNovos.test.ts`, `src/components/nav/AreaView.forja.render.test.tsx`.


### `src/components/MaterialIcon.tsx`
Ícone de MATERIAL de aprimoramento (REGISTRO §88, D1): a arte pixel `assets/soulmon/materiais/mat-<id>.png`, carregada SOB DEMANDA (fora do chunk de entrada); sem arte (ou enquanto carrega) cai no emoji de `MaterialDef.icon`. Usado no Soulsmith (`ForgeCard`) e na aba Materiais da Mochila (`home/Mochila.tsx`). Exporta também `materialArtIds()` (para teste).
**Régua:** `src/components/ForgeCard.render.test.tsx`, `src/components/home/Mochila.render.test.tsx`.


## `src/components/nav/BuildingQuestList.tsx` (07/10/2026)

Desde 20/10/2026 exporta `buildingQuestEntries` (cartões no `DailyMissionBoard`) e `nameOf`. Histórico: seção "Dos prédios"/"Buildings" da `MissionsSheet` (import dinâmico): a missão do dia de cada prédio
aberto, o botão de pegar o material e o inventário. Recebe `{state, day, bondLevel, onClaim}`;
não escreve estado por conta própria. `AreaView` ganhou `buildingMarks` e `onVisitBuilding`.

### `src/components/EvolutionGaugeMini.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** com a barra do Ultra travada (`v.locked`) a Home mostra "Libere as N Megas para abrir o Ultra · x/N" (`data-evo-gauge-mini-locked`) em vez da barra.
**Dono de:** o gauge de evolução COMPACTO da Home (11/10/2026): rótulo, `pontos/meta`, a prévia de hoje (mais clara, "+N hoje") e a barra. Só descreve — a regra é de `utils/evolutionGauge.ts`. Medidor permanente, fora do slot de avisos. Lazy.
**Exports:** `EvolutionGaugeMini({ language, evolutionPoints, evolutionStage, unlockedEvolutions, todayWeight })`.
**Chamado por:** `src/App.tsx` (lazy, topo do `data-home-scroll`).
**Régua:** `src/components/EvolutionGaugeMini.render.test.tsx`.

### `src/components/MealInviteCard.tsx`
**Dono de:** o cartão do convite da refeição no slot de avisos da Home (posição `refeicao`: depois do recomeço, antes da carga). Texto de `mealInviteCopy` (a MESMA fonte do push); um botão de ação e "Agora não" (dispensa a janela). Lazy.
**Exports:** `MealInviteCard({ language, petName, meal, kind, onAct, onSkip })`.
**Chamado por:** `src/App.tsx` (lazy).
**Régua:** `src/components/filaDeAvisos.contract.test.ts`, `src/utils/mealRhythm.contract.test.ts`.

### `src/components/CheckInSheet.tsx`
**Dono de:** a folha (bottom sheet `ModalSheet`) dos três check-ins do dia (beta-2 4.1, REGISTRO §40): as janelas com horário e estado (feito · aberto agora · mais tarde · passou); só a janela aberta tem botão. Sem número de recompensa, sem sequência. Abre do atalho `data-checkin-open` do slot de avisos, mesmo com o ritmo das refeições desligado. Lazy.
**Exports:** `CheckInSheet({ open, language, windows, onClaim, onClose })`.
**Chamado por:** `src/App.tsx` (lazy; estado `checkInsAbertos` vive no App para sobreviver ao resgate).
**Régua:** `src/components/home/energiaFome.render.test.tsx`, `src/utils/checkIns.test.ts` (`checkInWindows`).

### `src/components/UnlockNudge.tsx`
**Dono de:** o convite discreto de desbloqueio (uma linha clicável), separado do modal para o chunk de entrada não carregar o modal de compra (orçamento de bytes, beta-2). `UnlockAccountModal.tsx` o reexporta.
**Exports:** `UnlockNudge({ language, reason, variant, onOpen, trailingSpace })`.
**Chamado por:** `src/App.tsx` (estático), `CreateModal`, `DailyReportModal`, `GuildSheet`, `MercadoSheets`, `SoulmonOnboarding` (via `UnlockAccountModal`).
**Régua:** `src/components/UnlockAccountModal.copy.render.test.tsx`, `src/deploy/orcamentoDeBytes.contract.test.ts`.

### `src/components/unlockReason.ts`
**Dono de:** o tipo `UnlockReason` (os motivos do convite de desbloqueio), em módulo mínimo para `UnlockNudge` e `App` não puxarem o modal.
**Exports:** `UnlockReason`.
**Chamado por:** `UnlockNudge.tsx`, `UnlockAccountModal.tsx`, `src/App.tsx`.

### `src/components/SpritePoseRows.tsx`
**Dono de:** as duas linhas da pose do Soulmon em Configurações > Aparência — "Virar Soulmon" / "Flip Soulmon" (`flipX`) e "Soulmon voando" / "Soulmon flying" (`altitude`). Só desenha; escreve por `applySpritePose`.
**Exports:** `SpritePoseRows({ language, pose })`.
**Chamado por:** `src/components/SettingsPage.tsx`.
**Régua:** `src/components/SpritePoseRows.render.test.tsx`.

### `src/components/MealRhythmRows.tsx`
**Dono de:** as linhas do ritmo das refeições nas Configurações — UM interruptor "Meal check-ins" que liga/desliga juntos o convite no app e o push das 3 janelas (o push exige notificações ligadas; a linha diz por quê; REGISTRO §117) e os três `<select>` de horário (só oferece o que `normalizeMealTimes` aceita).
**Exports:** `MealRhythmRows({ language, settings, notificationsEnabled, onChange })`.
**Chamado por:** `src/components/SettingsPage.tsx`.
**Régua:** `src/utils/mealRhythm.contract.test.ts`.

### `src/components/ChatActionCard.tsx`

O cartão de confirmação das ações propostas pelo chat ("Criar hábito “Beber água” — todo dia às 09:00? [Criar] [Editar] [Agora não]"). Editar troca só o nome.
**Exports:** `ChatActionCard({ action, isPt, onConfirm, onDismiss })`.
**Chamado por:** `src/components/ChatBox.tsx`.
**Régua:** `src/components/ChatActionCard.render.test.tsx`.


## `src/components/SubscriptionSection.tsx` (11/10/2026)

**Dono de:** a assinatura cosmética trimestral dentro de "Sua conta" (Configurações): divulgação pré-compra (preço localizado da Play, "a cada 3 meses", renova sozinha, como cancelar), "Assinar" e "Gerenciar assinatura" (link da Central de assinaturas da Play).
**Props principais:** `language`.
**Exports:** `SubscriptionSection(props)`.
**Chamado por:** `src/components/SettingsPage.tsx`.
**Régua:** `src/components/SubscriptionSection.render.test.tsx`.

## `src/components/mercado/SubscriptionShelf.tsx` (11/10/2026)

**Dono de:** a vitrine "Do trimestre" nas lojinhas Background e Decoração — item escurecido com o porquê sem assinatura, "Resgatar" (de graça) com ela, "Equipar" para sempre depois de resgatado.
**Props principais:** `language`, `kind` (`bg`/`furniture`), `ownership`, `actions` (`onClaimSubscription`, `onEquip`, `onEquipFurniture`).
**Exports:** `SubscriptionShelf(props)`.
**Chamado por:** `src/components/mercado/MercadoSheets.tsx`.
**Régua:** `src/components/SubscriptionSection.render.test.tsx`.

### `src/components/BetaClosedGate.tsx` (release/beta-1, 11/10/2026)
Envolve o `<App />` em `main.tsx`: com o veredito `beta-closed` (`utils/betaClosed.ts`) troca o app inteiro pela `BetaClosedScreen` — logo, mascote, texto PT/EN (`BETA_CLOSED_COPY`), sem save, IA nem compra. **Régua:** `src/utils/betaClosed.render.test.tsx`.

### `src/components/BetaClosedScreen.tsx` (release/beta-1)
A TELA do beta fechado, separada do portão para sair do chunk de entrada (`lazy` em `BetaClosedGate`). Logo, mascote, o e-mail da sessão, "peça ao Mateus para incluir este e-mail" e **Trocar de conta** (`trocarContaBetaFechado`), PT/EN (`BETA_CLOSED_COPY`). **Régua:** `src/utils/betaClosed.render.test.tsx`.

### `src/components/Match3Game.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** especial por combinação com 2 setas (`sp === "both"`: limpa linha e coluna); "jogar de novo" com a arte do prédio.

**Dono de:** a TELA do Elemental Fusion (Salão de Jogos, REGISTRO §36). **Exports:** `Match3Game(props: EarningGameProps & { seed? })`. **Entrada (26/10/2026; 30/10: o portão `MinigameModeGate` já pergunta PvE | PvP e passa `initialMode`, que pula o seletor de dentro):** com `rankSaveId` e sem `challenge` e sem `initialMode`, o jogo abre com DUAS opções — Normal (a rodada de sempre) e PVP (1 contra 1, oponente de `getOpponents` pareado por level, NPC de reserva sem rede, 6 elementos sorteados por partida, sem ranking nem recorde, mesmas recompensas); sem `rankSaveId` abre o Normal direto. O ícone de elemento do Soulmon (jogador e oponente) cresceu (32/26 px). Tabuleiro `role="grid"` com foco rotativo (setas, Enter/Espaço), arrasto, dica, cascata animada passo a passo (movimento reduzido: sem animação), recorde no aparelho (`STORAGE_KEYS.MATCH3_BEST`), `onEarnPoints(bits)` UMA vez no fim da rodada. **Assets:** os ícones de elemento `el-fogo`/`el-agua`/`el-terra`/`el-vida`/`el-ar`/`el-luz` (`utils/elementIconArt`). **Chamado por:** `nav/AreaView.tsx` (lazy; `game === 'match3'`). **D-99/D-100 (19/10/2026):** jogador em cima à esquerda, time inimigo embaixo à direita (`data-m3-pos`); ao fechar um combo sai da célula dele o ícone do elemento até o alvo e o número do dano (o do log do combate) aparece no alvo — `PowerFx`, Web Animations, mudo; movimento reduzido: sem viagem, número direto. **D-102 (20/10/2026):** o combo ganha ritmo — a AURA do especial (`fxFrame(el,'aura')` + `sm-bs-pop`, a mesma do `BattleStage`) acende ~0,45 s no atacante (você ou o inimigo ativo), depois o poder (arte `orb`, 56 px; 84 px nos combos 4+) viaja ~0,95 s em arco com 2 de rastro, e no alvo há burst (arte `impact` + anel; onda extra nos 4+), tremida curta e o número maior (30 px; 36 nos 4+). Agenda em `match3Powers.planFx` (2 pistas, teto de 2,5 s por lado da jogada; cascata longa → versão rápida só com burst + número). A lógica não espera o efeito. Movimento reduzido: sem aura nem viagem, flash estático + número. **Régua:** `Match3Game.render.test.tsx`.

### `src/components/DungeonPotionsModal.tsx`

**Dono de:** o modal "Poções para o Soulmon" (REGISTRO §249), aberto por `DungeonGame` ao sair com a descida viva: por tipo de cura, de 0 a todas. **Chamado por:** `DungeonGame`. **Lógica em:** `utils/dungeonPotions.ts`.

### `src/components/DungeonBusyModal.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `onGo`: a plaquinha da Home leva a "Ir à Fenda" (ação principal) e "trazê-lo de volta" vira ação secundária com confirmação (`data-dungeon-busy-go`, §305).

**Dono de:** o aviso "Ele está na masmorra" (REGISTRO §36) sobre o `ModalSheet` base. Com `onGo` (plaquinha) a ação principal é **Ir à Fenda** (`data-dungeon-busy-go`) e **Trazer de volta** (`data-dungeon-busy-bring`) é secundária, com confirmação. **Régua:** `DungeonBusyModal.render.test.tsx`. **Exports:** `DungeonBusyModal`, `OcupadoAcao`, `ocupadoVerbo`, `ocupadoMensagem`. **Chamado por:** `App.tsx` (`bloqueiaOcupado`, a plaquinha) e `nav/AreaView.tsx` (via `onBusy`).

### `src/components/games/DropNotice.tsx`

**Dono de:** o modalzinho de drop da Masmorra (ícone, nome, quantidade; fecha por toque, "OK", Esc ou sozinho). Fora do `ModalSheet` de propósito (a luta e o avanço rápido seguem à mão). **Exports:** `DropNotice`, `DROP_AUTOCLOSE_MS`. **Chamado por:** `DungeonGame`.

### `src/components/home/DungeonSign.tsx`

**Dono de:** a PLACA DE MADEIRA "Na masmorra" / "In Dungeon" + o tempo de retorno (beta-2 6.2) que fica no lugar do pet na Home (só a arte `placa-madeira.png` 60×35 em escala inteira 2× — `<img>` pixelated, sem border-image, sem ícone; caixa fixa 120 × 70; texto xs na área lisa). **Exports:** `DungeonSign({ language, onTap, returnInMs })`, `SIGN_W`, `SIGN_H`, `SIGN_ART_W/H`, `SIGN_SCALE`. **Chamado por:** `CompanionHUD` (prop `naMasmorra`). **Régua:** `home/DungeonSign.render.test.tsx`.

### `src/components/home/DemoExitButton.tsx` (20/10/2026)
**Dono de:** o botão SAIR DA DEMO fixo no canto inferior esquerdo (acima da barra do chat), só na demo local. Toque duplo: o 1º troca o rótulo por "Tocar de novo para sair" por 3 s; o 2º chama `leaveDemo` (apaga o save local e volta ao portão demo/login). Existe porque a saída de Configurações é inalcançável na demo (`isDemoBlockedView('page:settings')`). **Exports:** `DemoExitButton({ language, onLeave })`. **Chamado por:** `App` (`demo && hasCompletedOnboarding`, `onLeave={handleLeaveDemo}`).

### `src/components/home/EnergyTimer.tsx` (beta-2 3.4)
**Dono de:** a CONTAGEM REGRESSIVA ao vivo da próxima energia, que mora DENTRO da dica da energia (abre ao tocar no raio; REGISTRO §43 — não há mais timer fixo na faixa). `H:MM:SS` com hora, `M:SS` sem (`formatEnergyCountdown`), 1 s; `paused` mostra "pausada"; `full` não renderiza. `aria-live="polite"` só no rótulo (o número é `aria-hidden`). Sem relógio próprio — ancora no `msToNext` de `energyStatus` e desconta o decorrido. **Exports:** `EnergyTimer`. **Chamado por:** `CompanionHUD` (dica `energy`, prop `energyInfo`).

### `src/components/home/HungerIndicator.tsx` (beta-2 3.5)
**Dono de:** o indicador de fome da Home (ícone de carne + três marcas cheias/contorno = nível 3/2/1 de 3, 14/10/2026; o estado não depende de cor; tocar abre a dica da FOME com `HungerTimer`, a contagem ao vivo até cair de nível, e o impacto na energia). Props simples (`tier`, `value?`, `language`). **Exports:** `HungerIndicator`. **Chamado por:** `CompanionHUD` (prop `energyInfo`). Contrato: `docs/FRENTE-B-REGRAS-BETA2.md`.
**Dono de:** a plaquinha "Estou na masmorra, volto logo" que fica no lugar do pet na Home (só a placa pixel, sem ícone). **Exports:** `DungeonSign({ language, onTap })`. **Chamado por:** `CompanionHUD` (prop `naMasmorra`). **Régua:** `home/DungeonSign.render.test.tsx`.

### `src/components/DayGoalsModal.tsx` (15/10/2026, REGISTRO §66)
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** aceitar a oferta reduzida vira a TAREFA BÔNUS do dia (rótulo "tarefa bônus", não conclui; `utils/bonusTask.ts`), não mais "conta como feito". **18/11/2026 (§474):** a bufada é a MESMA linha das demais, em negrito e `--sm2-gold-ink`; marcar = aceitar; várias bufadas valem todas.
**Dono de:** "reafirmar o dia" — o modal CENTRALIZADO (`ModalSheet placement="center"`) com caixas de marcar (a `CheckRow` do kit: rótulo inteiro = alvo de 44, contorno bronze, check turquesa) do que a pessoa JÁ cadastrou e cai hoje (Hábitos / Tarefas). As caixas nascem DESMARCADAS (substitui o "todas marcadas" do 7.3); só o marcado aparece no Hoje. Fechar sem confirmar é permitido (sem cobrança). Apresentacional: quem grava é o `App`.
**Props principais:** `DayGoalsModalProps` — `candidates: DayPlanCandidate[]` (de `dayPlanCandidates`), `language`, `initiallyPicked?`, `onConfirm(ids, focusIds)`, `onClose()`, `fuse?` (modo **"Hoje"**, 19/10/2026, REGISTRO §111: metas + compromisso num modal só — as TAREFAS marcadas viram o foco do dia, até 3, ontem primeiro por `dayPlanFocusIds`; a oferta reduzida de 5 minutos continua; "Hoje não, obrigado" sempre visível; `plan`, `taskIds`, `onTinyHabit?`, `soulStruggle?`).
**Exports:** `DayGoalsModal(props)`.
**Chamado por:** `src/App.tsx` (item `dayGoals` da fila, depois de `catalogOnboarding` e antes de `checkIn`).
**Régua:** `src/components/DayGoalsModal.render.test.tsx`, `src/utils/dayPlan.test.ts`, `src/components/DailyRituals.dayPlan.render.test.tsx`, `src/utils/dailyReset.dayPlan.test.ts`.

### `src/components/play/StrollFind.tsx` (15/10/2026, REGISTRO §66)
**Dono de:** a peça "o que o Soulmon encontrou no passeio", ligada à missão e ao destino escolhidos no dia anterior (`data-stroll-link`, `data-stroll-mission`, `data-stroll-destination`, o achado com arte/emoji e o selo `Novo`). Peça ÚNICA dos dois lugares onde o achado aparece — o passo "From Yesterday's Adventure" do resumo do dia e a seção "Da aventura de ontem" da folha do Passeio —, em vez de um pop-up com visual próprio. Apresentacional (o sorteio é determinístico, de fora).
**Props principais:** `StrollFindProps` — `adventure`, `isNew?`, `stroll?`, `language`.
**Exports:** `StrollFind(props)`.
**Chamado por:** `src/components/DailyReportModal.tsx`, `src/components/play/PasseioSheet.tsx` (prop `achado`).
**Régua:** `src/components/DailyReportModal.aventura.render.test.tsx`, `src/components/play/PasseioSheet.render.test.tsx`.

### `src/components/DayHearts.tsx` (beta-2, 13/10/2026)
**Dono de:** a fileira de corações do resumo pós-dia: os inteiros ficam como estão; o cobrado treme (`sm2-heart-shake`), quebra (`sm2-heart-snap`) e vira coração preto (o ícone `hp` do HUD, escurecido por filtro). Só anima quando `play` é verdadeiro na montagem; movimento reduzido pula para o preto.
**Props principais:** `strip` (`HeartStrip`), `play`, `onPlayed`, `isPt`.
**Exports:** `DayHearts`, `HEART_SHAKE_MS`, `HEART_SNAP_MS`.
**Chamado por:** `src/components/DailyReportModal.tsx` (folha dos corações).
**Régua:** `src/components/DailyReportModal.secoes.render.test.tsx`.

### `src/components/mercado/FrameShelf.tsx`
**Dono de:** a prateleira de MOLDURAS de avatar do Mercado (C3, 18/10/2026) — a aba "Molduras" da lojinha da Panora, ao lado de Backgrounds. Lista só as de loja (`origin: 'shop'`, Bits); a aba Honra vem vazia (nenhuma moldura custa Honra). Compra em dois toques (Comprar, Confirmar); a regra é de `utils/frameBuy.ts`.
**Props principais:** `{ language, currency, balance, owned, onBuy? }`.
**Exports:** `FrameShelf(props)`.
**Chamado por:** `src/components/mercado/MercadoSheets.tsx` (`MercadoStallSheet`, stall `background`).
**Régua:** `src/components/mercado/MercadoC.render.test.tsx`.

### `src/components/guild/ClaProcurar.tsx` (30/10/2026, procurar clã — REGISTRO §203)
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** os clãs cheios (§322) vêm DEPOIS, em seção própria, com o selo "Cheia" e sem botão de pedir.
**Dono de:** `ProcurarCla` (sem clã: lista de clãs com vaga com nome e "n de max", "Pedir para entrar", pendente com "Cancelar pedido") e `PedidosDeEntrada` (só o anfitrião, na ficha do clã: Recusar à esquerda, Aceitar à direita; sem pedido = silêncio). Cada peça carrega o próprio dado por `utils/community.ts` (`getGuildDirectory`, `requestToJoinGuild`, `cancelGuildRequest`, `getGuildJoinRequests`, `decideGuildRequest`); copy em `utils/guildCopy.ts` (`guild.procurar.*`, `guild.pedidos.*`). Desde 13/11/2026 (REGISTRO §322) os clãs CHEIOS aparecem depois dos com vaga, sob "Clãs cheios" (`guild.procurar.cheiosTitulo`), com nome, "12 de 12" e a etiqueta "Cheia"/"Full" (`guild.procurar.cheia`, `sm2-kit-tag`, `data-guild-cheia`), SEM botão de pedir; "Nenhum clã com lugar" passa a olhar só os com vaga. **Chamado por:** `GuildSheet.tsx`. **Régua:** `ClaProcurar.render.test.tsx`.

### `src/components/guild/GuildInviteSheet.tsx` (13/11/2026, convidar para o clã — REGISTRO §321)
**Dono de:** a folha "Convidar para o clã", aberta pelo botão "Convidar" do Salão (`GuildSheet`, ficha do clã; botão SIMPLES do kit `sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary sm2-guild-btn`, largura total como os outros botões da ficha, sem a arte do `CtaButton` — decisão do dono de 13/11; com o clã cheio o botão fica apagado com o porquê). O botão de cada linha tem largura FIXA (`.sm2-guild-invite-btn`, 11,5rem, no máx. 42vw, alvo >= 44 px): "Convidar", "Já está na roda", "Já tem clã" e "Convite enviado" ocupam a mesma coluna; rótulo longo quebra em 2 linhas. É um `RitualDialog` com `PlayerSearch` e UM toque por linha (`inviteToGuild` de `utils/community.ts` → `POST /api/guild?action=guildInvite`): o convidado recebe uma carta do Papus com o nome e o código do clã. Cada linha guarda o próprio desfecho (enviado / já está na roda / já tem clã / clã cheio / muitos convites / sem rede / erro); quem já tem clã nasce sem botão ativo. Copy em `utils/guildCopy.ts` (`guild.convidar.*`). O foco volta ao botão ao fechar.
**Chamado por:** `GuildSheet.tsx`. **Régua:** `src/components/PlayerSearch.render.test.tsx` (convite de um toque, largura única dos botões de linha), `GuildSheet.render.test.tsx` (botão simples na largura da ficha, clã cheio); servidor: `functions/api/guild.convite.test.js`.

### `src/components/guild/PracaVisor.tsx`, `PlantioVisor.tsx`, `MisterioVisor.tsx` e `claUi.tsx` (18/10/2026, prédios do clã)
**Sync 16/11/2026 (`b0c1e59c..6b7773143`) — `PlantioVisor.tsx`:** o Bosque entra livre; CUIDAR (regar/defender) e LUTAR na defesa perguntam com o Soulmon dormindo (`useRequireAwake`, §329); o plantio da estação não pergunta.
**Dono de:** os três visores do clã e o encanamento comum. `src/components/guild/PracaVisor.tsx` (`PracaVisor`, `SalaPraca`, `PRACA_VISOR_HEIGHT`): 4 slots de decoração e o presente diário. `src/components/guild/PlantioVisor.tsx` (`PlantioVisor`, `SalaPlantio`, `PLANTIO_VISOR_HEIGHT`): o plantio coletivo. `src/components/guild/MisterioVisor.tsx` (`MisterioVisor`, `SalaMisterio`, `MISTERIO_VISOR_HEIGHT`): o mistério diário. `src/components/guild/claUi.tsx` (`ClaT`, `ClaOnReward`, `ClaSalaProps`, `decorName`, `rewardText`, `useClaBuilding`): tipos e ganchos que as três salas dividem. Onde moram (§141): a Praça no Clan Hall, o Plantio na sala do Grove e o Mistério na sala da Feira (`room="feira"`, cartão `guild.feira.predios.titulo`).
**Chamado por:** `src/components/guild/GuildSheet.tsx`. **Régua:** `src/components/guild/GuildSheet.cla.render.test.tsx`.

### `src/components/guild/GroveFolha.tsx` e `src/components/guild/GroveVisor.tsx` (18/10/2026, o panorama do Bosque)
**Exports:** `GroveFolha` (default e nomeado), `OnPlantio`; `GroveVisor`, `SLOTS_X`. A folha é o diálogo de tela cheia (`createPortal`, `useDialogA11y`, `useBackLayer`) que o botão "Entrar no bosque" do Salão da Guilda abre, sob demanda (`lazy` no `GuildSheet`): lê o plantio do clã (`getPlantio`) e junta ao pico guardado no save. O `GroveVisor` é a pintura de ~3 telas de largura com rolagem horizontal (deslize, arrastar com mouse, setas do teclado movem UMA tela, `prefers-reduced-motion` salta sem animar) e 4 lugares, um por estação, cada um com a árvore no nível atual ou o lugar vazio. Sem `image-rendering: pixelated`. O Bosque só se alcança pelo Hall (teste de fonte em `GroveVisor.render.test.tsx`).
**Chamado por:** `src/components/guild/GuildSheet.tsx` (sala `bosque`). **Régua:** `src/components/guild/GroveVisor.render.test.tsx`, `GuildSheet.render.test.tsx`.

### `src/components/DungeonReturnModal.tsx` · ⚰️ `src/components/play/PrepararFocoSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** saíram as razões `sealed` (andar selado) e `daily` (limite diário de camadas) do texto de retorno.
**Props principais:** `DungeonReturnModal` — resumo centralizado de quando o Soulmon volta sozinho da masmorra (beta3 A2), sem cobrança. `PrepararFocoSheet` — folha do prédio Prepare to Focus (beta3 F1): planejar a sessão (`OficinaPlano`) e salvar dá a chave da Oficina do Foco.
**Chamado por:** `src/App.tsx` e as folhas do Play. **Régua:** nenhuma específica; a regra da chave é de `src/utils/focusKey.ts`.
⚰️ `PrepararFocoSheet` foi apagada em `5b3c6105b` (08/11/2026, §247): a chave do Calabouço agora vem de concluir a jornada do Foco (`focusKey.ts`, `FocusBoard`/`JourneyScreen`); sem ela o portão abre `RogueKeyGate`.


### `src/components/BestiaryCollection.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o título de cada estágio usa `STAGE_NAMES` (nome do jogo, nunca Rookie/Champion/Ultimate/Mega); `ultimate` mostra o nome `perfeito`.
**Dono de:** a coleção do Bestiário (M10): uma célula por criatura × estágio do `enemyRoster`; vista = arte e nome, não vista = silhueta sem nome. O número é de coleção ("N de M"), nunca percentual. Chaves antigas fora do roster não contam. **Exports:** `BestiaryCollection({ seen, language })`.

### `src/components/RankingList.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o pódio saiu daqui (agora `RankingPodium`); a linha leva `guildName` (clã por baixo do nome).
**Dono de:** a lista ÚNICA de ranking (30/10/2026): pódio ouro/prata/bronze (desenhado pelo `RankingPodium`, §326), top 50, linha do jogador destacada (`aria-current`) e, fora do top 50, linha fixa no fim depois de "…". Só tokens `--sm2-*`; animação só sem `prefers-reduced-motion`. **Exports:** `RankingList`, `RANKING_LIST_SIZE`. **Usa:** `src/utils/rankings.ts`, `RankingPodium`.

### `src/components/RankingPodium.tsx` (13/11/2026, o pódio refeito — REGISTRO §326)
**Dono de:** o PÓDIO dos placares dos jogos (o único pódio do app: o ranking da temporada do Torneio é uma janela de ±3 "sem ouro no top 3" e a Guilda não tem ranking, por regra). Grade 2º · 1º · 3º com o DOM em 1 · 2 · 3; o 1º no centro, coluna 1,25×, pedestal mais alto, coroa, medalha 44, nome 16 e pontos 20 em `gold-ink` com brilho atrás. Cada lugar: [coroa] · medalha · `ui/PlayerName` (clã embaixo) · pontos (`sm2-num`, tabulares) · [prêmio] · pedestal (`role="img"`, rótulo "Nº lugar"; medalha e coroa `aria-hidden`). Lugar sem ninguém (placar com 1 ou 2): pedestal apagado, `aria-hidden`, para o 1º continuar no centro. Estilo em `index.css` (`.sm-rank-podium*`), tokens `--sm2-gold-fill`/`--sm2-silver-fill`/`--sm2-bronze-fill` + `--sm2-on-*`.
**Arte por slot:** `resolvePodiumArt(place)` de `src/assets/soulmon/ranking/index.ts` (`import.meta.glob`, mesmo padrão de `resolveHexCrownArt`): `podio-1..3.png` (360×240, 288×180, 288×144), `medalha-1..3.png` (128²), `coroa-1.png` (128×96). Sem o PNG, cada peça cai na versão em CSS (pedestal em gradiente do metal com a lasca turquesa; medalha em disco com o número; coroa = glifo `emoji_events`). Soltar o PNG na pasta basta. Fila: `docs/ASSETS-A-GERAR.md` → "Pódio do ranking".
**Props principais:** `rows: PodiumRow[]` (até 3; `PodiumRow = RankingRow & { guildName? }`), `language`, `format?`, `art?` (só teste).
**Exports:** `RankingPodium`, `PodiumRow`.
**Chamado por:** `RankingList`.
**Régua:** `src/components/RankingPodium.render.test.tsx` (ordem, rótulos, fallback CSS × arte, lugar vazio, clã, tabulares); `RankingList.render.test.tsx`; contraste do numeral em `src/styles/tokens.contrast.test.ts`.

### `src/components/RankingPanel.tsx`
**Dono de:** a tela de ranking de um jogo: a FAIXA vem antes da lista; com `score`, envia o resultado uma vez ao montar; falha de rede é silenciosa. **Exports:** `RankingPanel({ game, saveId, language, score?, period?, inline? })` (`inline` = a lista direto na tela, sem botão nem modal, usada dentro do modal do `MinigameModeGate`). **Usa:** `src/utils/rankings.ts`.

### `src/components/RogueDungeon.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** incursão 3×5 (15 passos, mesmo prêmio; save 3×8 migrado, §456); os Bits devidos descontam `rogueBits({ won: paidWon })`; "jogar de novo" com a arte da Fenda.
**Dono de:** a tela do prédio `exploracao.dungeon` (ex-`jogos.dungeon`, #187) (Calabouço, M7 + N7): um MAPA em tela cheia (cenário de `DUNGEON_SCENES`, 3 nós = os 3 andares numa trilha SVG, o Soulmon no nó atual) com a folha de baixo para escolher 1 de 3 caminhos e 1 de 3 bônus; o combate é uma luta visível (`RogueFight`) e os demais desafios são os jogos reais em modo desafio. Regras em `utils/rogueDungeon.ts`. Não é o Endless Rift (`DungeonGame.tsx`). **Exports:** `RogueDungeonProps`, `RogueDungeon`. **Usa:** `RogueFight`.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** a derrota agora PAGA o que a incursão rendeu (`paidWon` evita pagar de novo) e deixa o Soulmon em descanso (`rogueRestMs`/`settleRest`, aviso "Volte em …" via `formatarEspera`; a incursão espera, §239); `bitsPagos` = o creditado após o teto diário; nova prop `petBase` (repassada ao `Match3Game`) e o minijogo `selo` (`SeloGame`, lazy) entrou no sorteio de desafios; `onEarnPoints` devolve `number | void`.

### `src/components/RogueFight.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** luta com companheiro invocado (string estável, não refaz a rodada) e efeito do especial da Hexsmith; impacto do básico por `ident.basico.impacto`.
**Dono de:** a luta do Calabouço em cena (N7): a `BattleStage` com o núcleo v3 decidindo pela semente de `rogueFightSetup`, relógio de `useGroupBattle` com especial automático, avanço rápido 1×/3× e o cartão de fim ("Continuar"). Sair no meio conta como derrota. Superfície muda (nenhum som novo). **Exports:** `RogueFightProps`, `RogueFight`. **Chamado por:** `RogueDungeon`.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** o avanço 1×/Fast usa `useBattleSpeed`/`BattleSpeedButton` (`corner`, `data-rogue-speed`); a luta leva `efeitoElementoPve`, `meleeImpactOf` e `stageIcon`; a onda usa `dungeonWaveOf(..., false)`.

### `src/components/guild/GroveRaidFight.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** companheiro invocado (`companheiroDoEstado`, `summonsDoGrupo`), efeito do especial da Hexsmith e `foeStrikeForm` na luta do Bosque.
**Dono de:** a luta do Bosque em cena (§204): `BattleStage` + `useGroupBattle` com torcida, anel e esquiva contra as 3 pragas de `groveRaidLineup`; cartão de fim ("Continuar"); sair = derrota sem custo. Superfície muda. **Exports:** `GroveRaidFightProps`, `GroveRaidFight`. **Chamado por:** `PlantioVisor` (lazy).

### `src/components/SoulBarrage.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** Bits da run por `bitsForLevel(barrageBits(score), level)` e `advancedFactorLabel` no texto; "jogar de novo" com a arte do prédio.
**Dono de:** a tela do Soul Barrage (4º card do Salão de Jogos, M9): desenha o campo e traduz toque em `targetX`; a regra mora em `utils/soulBarrage.ts`. Usa o `RankingPanel`. **Exports:** `SoulBarrage`.

### `src/components/mente/PatchesGame.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** "jogar de novo" com a arte do prédio.
**Dono de:** a tela da Colcha (id `patches`; fora do menu desde 04/11/2026, só para incursões salvas do Calabouço); só aplica a regra de `utils/mente/patches.ts`. **Exports:** `PatchesGame`.

### `src/components/mente/SeloGame.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** "jogar de novo" com a arte do prédio.
**Dono de:** a tela do Selo Faltante (minigame da Oficina da Mente, id `selo`, substitui a Colcha no menu); só aplica a regra de `utils/mente/selo.ts`. **Exports:** `SeloGame`.

### `src/components/mente/SeloSeal.tsx`
**Dono de:** o desenho SVG de um selo e a descrição dele para leitor de tela. **Exports:** `SeloSeal`, `seloLabel`. **Chamado por:** `SeloGame.tsx`, `MindTutorial.tsx`.

### `src/components/mente/ZipGame.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** "jogar de novo" com a arte do prédio.
**Dono de:** a tela da Trilha do Pet (minigame da Oficina da Mente, id `zip`); só aplica a regra de `utils/mente/zip.ts`. **Exports:** `ZipGame`.

### `src/components/play/RogueDungeonPlaceholder.tsx`
**Dono de:** o ponto de encaixe "em breve" do Calabouço (M3), que a lane M7 troca pelo `RogueDungeon` real. **Exports:** `RogueDungeonPlaceholder({ language })`.

### `src/components/NightmareBattleHost.tsx` (beta3, perf do bundle)
**Dono de:** montar a luta do Pesadelo dentro do chunk lazy, sorteando a onda (`buildNightmareWave`) lá dentro, para o `App` não carregar o roster de inimigos na entrada.
**Chamado por:** `src/App.tsx`.

### `src/components/mente/MindTutorial.tsx` (beta3)
**Dono de:** o tutorial de primeira vez dos jogos do Ateliê da Mente: 4 passos curtos por jogo (EN+PT), demonstrações em CSS (quadro fixo com movimento reduzido), "Próximo"/"Pular"/"Entendi, jogar"; reabre sob demanda pelo "Ver o tutorial" do "Como se joga" sem gravar nada. Vive no chunk lazy de cada jogo. O modo desafio do Calabouço não o recebe.
**Chamado por:** `EcoGame.tsx`, `ZipGame.tsx`, `PatchesGame.tsx`. **Régua:** `mindTutorial.render.test.tsx`.

### `src/components/DriveAcordeao.tsx`
**Dono de:** o accordion do Drive (extraído do `BestiaryCollection` em 23/11/2026): `Acordeao({ id, titulo, contagem?, aberto, onToggle })` (cabeçalho-botão com `aria-expanded`/`aria-controls`, corpo `hidden`) e `useAcordeaoFechados()` (ids fechados no storage). **Chamado por:** `BestiaryCollection.tsx`, `ElementDex.tsx`. **Régua:** `BestiaryCollection.acordeao.render.test.tsx`, `ElementDex.drive.render.test.tsx`.

### `src/components/ElementDex.tsx`
**Dono de:** a aba "Elemento" da Biblioteca (27/10/2026): grade dos 20 base + 190 derivados; trancado = "?" sem nome, ícone nem id no DOM; destrancado abre uma `RitualDialog` com ícone grande, nome, composição (derivado) e forte/fraco contra (o que ainda está trancado ali aparece "?"). **Exports:** `ElementDex({ defeated, language })`, `dexElementName`. **Chamado por:** `LibraryPage.tsx`. **Régua:** `LibraryPage.abas.render.test.tsx`.

**Sync 23/11/2026 (P5):** o modal de um elemento BASE mostra, acima da composição e das vantagens, o texto aprovado do dono (`[data-element-text]`, de `utils/elementoTextos.data.ts`); combinado e curado seguem sem texto. **Régua:** `src/components/ElementDex.textos.render.test.tsx`.

**Sync 23/11/2026 (P5, accordion):** os chips de categoria saíram; a tag "Só novos" (CheckRow, sem accordion, abaixo do filtro de bases; 24/11) e Base/Comb II/III/IV/Special viraram seções do MESMO accordion do Bestiário (`DriveAcordeao.tsx`: `Acordeao` + `useAcordeaoFechados`, estado em `DRIVE_ACORDEAO_FECHADOS`; ids `dex-base`…; tudo ABERTO por padrão, só os fechados pelo usuário persistem, cabeçalho com "destrancados / total"). Com filtro (Novo/bases) as seções vazias somem. **Régua:** `ElementDex.drive.render.test.tsx`.

**Sync 23/11/2026 (P5/24):** a aba ganhou chips de categoria (`[data-element-cat]`: Base, Comb II, Comb III, Comb IV, Special; `utils/elementoCategoria.ts`) e a caixa "Novo" (`[data-element-only-new]`, só destrancados com selo); combinam em E com o filtro por bases. A ficha mora em `ElementModal.tsx` (`dexElementName` segue reexportado). O cabeçalho `X / Y` já existia (PT/EN iguais).

### `src/components/EssencesSection.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** a dica da Essência de Pesadelo diz "ainda sem uso, só guardar" (`data-essence-sem-uso`).
**Dono de:** a seção Essências do Laboratório (aba do pet, logo abaixo dos Sonhos; 28/10/2026): só as com quantidade > 0, cada uma = ícone do próprio elemento (`elementIcon`; `nightmareIcon` no Pesadelo) + quantidade, sem caixa; tocar mostra o nome EN/PT. Sem nenhuma, não renderiza. **Exports:** `EssencesSection({ essences, language })`.

### `src/components/games/ElementAdvantageBadge.tsx`
**Dono de:** o selo "Super eficiente!/Pouco eficiente" (EN "Super effective!/Not very effective") a partir de `elementAdvantage` (+1/-1; neutro não renderiza). Vai no slot `badge` do `BattleStage` (Arena, Duelo) e sob o ícone do jogador no Combina 3; textos em `pveTags.ts` (`ELEMENT_ADVANTAGE_TAG`). **Chamado por:** `ArenaGame.tsx`, `DuelScreen.tsx`, `Match3Game.tsx`. **Régua:** `ElementAdvantageBadge.test.tsx`.

### `src/components/ElementModal.tsx`
**Dono de:** a ficha de um elemento destrancado (P5/24, 23/11/2026), extraída do `ElementDex`: ícone, texto (base), Composição, Forte/Fraco contra. Cada componente destrancado da Composição é botão (`[data-dex-ref-open]`) que abre a ficha dele numa pilha; "Voltar" (`[data-element-back]`, e o voltar do sistema via `useBackLayer`) volta um nível, o X fecha tudo; trancado segue "?". **Exports:** `ElementModal({ id, unlocked, isPt, onClose })`, `dexElementName`. **Chamado por:** `ElementDex.tsx`, `BestiaryCollection.tsx` (ícone do elemento da criatura, só se destrancado). **Régua:** `ElementDex.drive.render.test.tsx`.

### `src/components/ElementBaseSlots.tsx`

Dono único da UI do filtro de elementos base: 3 campos de dropdown lado a lado (borda arredondada, "Select"; 1ª opção do menu é "Clear"). Usado pela Poção de Elemento e pelas Essências do Cambista; a regra (E entre as bases) é `elementsMatchingBases` em `utils/elementPotion.ts`. Exporta também `elName`, `ElementIcon`, `emptySlots`.

### `src/components/ElementPotionSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** a folha lista TODAS as poções (ícone + "tem/precisa" por ingrediente), filtro por 3 espaços de elemento base (E) + status (`POTION_FILTERS`: todas, posso criar, essências suficientes, base, composta), paginada em 30 (`PAGE`); as criáveis vêm primeiro; o Neutro tem painel próprio (`NeutroPotionPanel`, `ELEMENTO_NEUTRO_ID`, `NEUTRO_POTION_COSTS`).

Folha da Poção de Elemento (Laboratório › Centro de Evolução): 3 espaços de base, lista filtrada (E) só do que o jogador paga (elemento ainda não desbloqueado na Biblioteca aparece como "???" e não se cria — `isPotionUnlocked`), confirmação com custo e `onCraft`. Regras em `utils/elementPotion.ts`. Avisa (aviso da poção na espera e nota) que vale só para a próxima evolução; depois o Soulmon volta ao elemento da pontuação.
**Sync 09/11/2026 (`5229b1be..62f204e1b`):** prop nova `inventory` (`foodInventory`): o elemento COMPOSTO consome 1 poção de cada base dele além das essências (`potionIngredients`/`potionKey`), mostradas em linhas `data-cost-potion` "n / possuídas"; `affordablePotionElements`/`canAffordPotion` recebem o inventário. Custo base 100 da própria essência; composto 50 dele (`POTION_COSTS`, §249/§250); a oferta da Vesca (`VescaPotionOffer`) é a porta de entrada.

### `src/components/VescaPotionOffer.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** prop `elementIds?` (várias poções ofertadas de uma vez; `onMake` pode devolver `false`); lista as ainda não feitas (`feitas`) e a poção criada abre `PocaoCriada`.
**Dono de:** a pergunta da Vesca ("Fazer a poção" / "Depois") quando a essência de um elemento base cruza 100 (§250). Só apresenta; quem decide quando abrir é o `App.tsx` (`essenceThresholdCrossings`) e a regra/custo vivem em `utils/elementPotion.ts`.

### `src/components/MercGuildSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** só texto: "Feito. Amanhã tem mais."
**Dono de:** a ficha da Guilda dos Mercenários (missão do dia, "Sim, fiz"); o BB fica de fora e só vê o convite para voltar depois.

### `src/components/onboarding/etapas/EtapaAlimentar.tsx`
**Dono de:** a etapa em que o ancião ensina "força = tarefa + alimento": arrastar o alimento até o Soulmon (D24).

### `src/components/onboarding/etapas/EtapaDuelo.tsx`
**Dono de:** a etapa do duelo do onboarding (cena 7, D16), totalmente local, sem servidor nem recompensa; compõe `dueloLogic`.

### `src/components/onboarding/etapas/EtapaPuzzle.tsx`
**Dono de:** a etapa do puzzle (cena 4, D13): meta mínima de trocas que formam linha e o passo a passo.

### `src/components/onboarding/etapas/EtapaTarefa.tsx`
**Dono de:** a etapa em que o jogador cria e conclui a primeira tarefa pelo caminho normal do App (cena 6).

### `src/components/onboarding/etapas/dueloLogic.ts`
**Dono de:** a lógica pura do duelo do onboarding (dupla jogador + BB contra o Desfeito).

### `src/components/onboarding/etapas/tipos.ts`
**Dono de:** o contrato dos slots do player: toda etapa recebe `onDone`.

### `src/components/onboarding/intro/IntroCinematica.tsx`
**Dono de:** o opening "A Parede" (primeira abertura de quem é novo, antes do login, independe do ONBOARDING_VELADO); vídeo ausente = tela preta com legendas.

### `src/components/onboarding/intro/SeletorIdiomaAbertura.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o toque escolhe o idioma no `pointerup` mesmo se o dedo mexer; alvo ≥ 48 px e estado pressionado direto no DOM (`data-pressed`, `.sm2-idioma-opcao`).
**Dono de:** o seletor English/Português que vem antes do opening, só para quem ainda não escolheu o idioma.

### `src/components/onboarding/intro/introGate.ts`
**Dono de:** as regras de entrada da cinemática (`deveTocarIntro`, `introVista`, `marcarIntroVista`), separadas do componente para o App decidir sem carregá-lo.

### `src/components/onboarding/intro/copy.ts`
**Dono de:** as legendas EN/PT da cinemática, 9 planos.

### `src/components/onboarding/sequencia/SequenciaOnboarding.tsx`
**Dono de:** a sequência do onboarding do Velado (ponto de entrada; "Rever a história" ignora o interruptor).

### `src/components/onboarding/sequencia/SequenciaReal.tsx`
**Dono de:** `SequenciaReal`: a sequência do onboarding com as ligações reais (`SLOTS_REAIS`) num módulo só, que o App carrega `lazy` para levar Match3Game/BattleStage para fora da entrada.

### `src/components/onboarding/sequencia/SequenciaPlayer.tsx`
**Dono de:** o player de cenas e quadros; slots das etapas interativas, stub quando ausentes.

### `src/components/onboarding/sequencia/assets.ts`
**Dono de:** o mapa central de arte da sequência (arquivo ausente = silhueta nomeada).

### `src/components/onboarding/sequencia/cenas.ts`
**Dono de:** a definição das cenas 0–9.

### `src/components/onboarding/sequencia/copy.ts`
**Dono de:** o roteiro do ancião Remendado.

### `src/components/onboarding/sequencia/flag.ts`
**Dono de:** o interruptor do onboarding do Velado, desligado por padrão.

### `src/components/onboarding/sequencia/logic.ts`
**Dono de:** a lógica pura de quadros: avançar e pular a fala (D12), nunca a etapa interativa.

### `src/components/onboarding/sequencia/slotsReais.tsx`
**Dono de:** o que o App liga às etapas reais (tarefa, alimentar, puzzle, duelo).

### `src/components/onboarding/sequencia/types.ts`
**Dono de:** os tipos de props que toda frente encaixa num slot.


### `src/components/LibraryNewBadge.tsx`
Selo "NEW" (`NewBadge`, tokens `--sm2-gold-fill`/`--sm2-on-gold`, classe `.sm2-new-badge`) e o aviso discreto de entrada nova na Biblioteca (`useLibraryNewNotice`: um toast de id fixo, o mesmo para 1 ou várias entradas). Regra em `utils/libraryNew.ts`. Régua: `LibraryNewBadge.render.test.tsx`.

### `src/components/home/StrayRecoveryNotice.tsx`
Aviso curto na Home (REGISTRO §213 emenda 2): o Soulmon do jogador está desgarrado e volta com todas as tarefas do dia em 2 dias seguidos, com o progresso 0/2, 1/2 (`community?action=strayStatus`, só o dono). Classe `.sm2-lib-alert` (âmbar). Não monta na demo.


### `src/components/hex/HexsmithSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** Coroas de efeito (`hot`/`slow`/`silence`, H1), "Coroa equipada faz o companheiro descansar" (H4) com legenda por slot (`HEX_SLOT_COPY[slot].desc`); cada HEX possuído tem 1 botão Equipar/Desequipar (`data-hex-equip`/`data-hex-unequip`); tabela de custo com poção/fragmentos/Bits (`data-hex-cost-*`); os 2 botões de renomear (`HexRenameButton`) acima da linha da Coroa.
**Dono de:** a tela da Hexsmith no lote `forja:hexsmith` (lazy em `nav/AreaView.tsx`): mapa de 5 encaixes ao redor do Soulmon, código hex e o painel de cada encaixe (itens possuídos, forja com filtro por elementos). Regras em `utils/hexsmith.ts`; textos em `utils/hexsmithCopy.ts`.
**Navegação (23/11/2026, §503):** o ✕ é só o do modal principal (`AreaSheet moldura="aco"`, fecha tudo; fica apagado com tela por cima). O painel de Porta (`SlotPanel`, `ModalSheet onBack={onClose}`) e o `HexRenameModal` são telas internas: Voltar desfaz UM nível e o voltar do sistema também (`useBackLayer`). Desde 24/11/2026 (revoga o medalhão de 23/11): ✕ SEMPRE à esquerda (fecha tudo) e (i) SEMPRE à direita (a Porta registra a descrição dela), nas mesmas posições do mapa e vivos; o Voltar (`BackCircleButton`) mora no corpo da tela interna. Ingredientes: poção/fragmento do elemento relevante sobem ao topo (`ordenarPorRelevancia`, `utils/hexsmith.ts`; Bits fora da regra); a linha "Forja"/"Filtre por até 3 elementos base" saiu (fica "Você tem X Bits"). Contrato: `hex/HexsmithVoltar.render.test.tsx` (360/375/412 px).
**Botão Equipar/Desequipar (23/11/2026, §503, aprovado pelo dono):** UM botão com texto ÚNICO que nomeia a ação: livre = "Equipar/Equip" (`sm2-kit-btn-primary`), equipado = "Desequipar/Unequip" (`sm2-kit-btn-outline`); `aria-label` = "ação: nome" (sem "(Equipado)"). "Equipado" virou SELO (`.sm2-hex-seal`, `data-hex-seal`, aria-hidden, `primary-ink` sobre `primary-soft`) ao lado do nome; cartão equipado com borda de 2px `primary-ink` (`data-on`). Sem modal: `<span class="sm2-sr-only" role="status" data-hex-equip-status>` anuncia "X: equipado/desequipado". Layout: < 400 px o botão vai à linha própria, largura total, 48 px; ≥ 400 px ao lado, 112 px fixos. Sem estado bloqueado/busy (item possuído nunca é recusado; equipar é síncrono). Contrato: `HexsmithSheet.render.test.tsx`. O trecho abaixo sobre "✓ Equipped + Unequip" em duas linhas está superado.
**Itens possuídos (13/11/2026, §323):** cada HEX possuído tem UM botão grande na linha (`.sm2-kit-btn.sm2-hex-equip-btn`, alvo 56 px, `data-state="idle|equipped"`): "Equip"/"Equipar" (`data-hex-equip`, `equipHexItem`, troca se já há outro) ⇄ "✓ Equipped" + "Unequip"/"Desequipar" (`data-hex-unequip`, `unequipHexSlot`). A linha "Empty the Port" (`HEX_UI.clear`, `data-hex-clear`) saiu; o texto novo é `HEX_UI.unequip`. **Coroa por família:** `SlotFace` resolve a coroa com valor por `resolveHexCrownArt(familia)` (`assets/soulmon/hex/index.ts`: `coroa-<familia>.png`, fallback `slot-coroa.png`; `data-hex-crown` no `<img>`). Arte nova entra só soltando o PNG na pasta. **Régua:** `HexsmithSheet.render.test.tsx`.

### `src/components/hex/HexSlotGlyph.tsx`
**Dono de:** os glifos SVG de cada tipo de encaixe da Hexsmith, usados enquanto a arte de `src/assets/soulmon/hex/` não existe.

### `src/components/EvolutionLight.tsx` — ⚰️ apagado

⚰️ **Apagado em `63719e356` (31/10/2026, REGISTRO §208).** Era a luz procedural da cerimônia de evolução; a transformação refeita (`EvolutionCeremony`: `treme`/`racha`/`estilhaca`/`revela`) não a usa mais, e o `LevelUpOverlay` tem luz própria.


### `src/components/WidgetFramePicker.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** o preview mostra a moldura com o pet no LCD (`WIDGET_FRAME_LCD`, `data-widget-frame-preview`, 90×60); `id` nulo mostra a moldura padrão.

**Dono de:** a escolha da moldura do widget V-Pet, em Configurações, usando `src/utils/widgetFrames.ts`.

**Chamado por:** `src/components/SettingsPage.tsx`.
**Chamado por (conferido):** `src/components/SettingsPage.tsx` (linha "Moldura do widget", dentro de `ModalSheet`) e `src/components/mercado/MercadoSheets.tsx` (aba "Widget" da lojinha de Background). Compra = Play Billing `moldura_<elemento>`; preço sempre de `getLocalizedPrice` (sem plugin/loja fechada = "Indisponível").

### `src/components/mercado/RestauranteSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** chef do dia, missão do prato e modal Elemento novo; no domingo os dois chefs (tocar um filtra o cardápio dele, `data-restaurante-chef`); o prato feito vai para a pastinha e abre `PratoFeito` (um modal por vez; repetir o mesmo prato só soma).
**Dono de:** a folha do Restaurante no Mercado (`RestauranteSheet`): cardápio (sem bloco de chef; ingredientes e pratos com a arte do app), custo com o que se tem, confirmação e `applyCook` no updater. Aberta pelo lote `restaurante` em `nav/AreaView.tsx`.

### `src/components/MessengerSequence.tsx`

O AVISO do Papus (NPC 440) no modal padrão `NpcSequence`, item `messenger` da fila de apresentação: só diz que chegou carta, e só na 1ª carta da conta (§390; depois só a bolinha vermelha); fechar não credita nada (o resgate é da caixa). Decisão: REGISTRO §241 e §246.

### `src/components/MailboxSheet.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props novas `onAnswerInvite(m, decline)` (aceitar/recusar convite de amizade ou de clã: `accepted`/`declined`/`gone`) e `onJoinGuild(m)` ("Entrar no clã" na carta do clã); `deletableRead` não apaga convite (§389); a imagem do NPC (Papus/Hexsmith) e a carta tutorial do widget (`CartaTutorialWidget`).

A caixa de cartas do Papus, folha aberta pelo ícone da Home: accordion de uma carta aberta por vez, "Resgatar" (só com item), "Deletar" (confirmação se houver item não resgatado), rodapé "Excluir todas lidas" (não apaga convite, §389; o cartão de convite com "Recusar" não tem "Deletar") e "Resgatar tudo" (pop-up com a lista e o total). Recebe a lista e as ações de `hooks/useMailbox.ts`. Decisão: REGISTRO §246.

### `src/components/CartaTutorialWidget.tsx`

A imagem da carta global do widget (§288): o casco do widget com cenário no LCD, sem Soulmon (`src/assets/soulmon/cartas/tutorial-2-widget.(webp|png)`, por glob em `index.ts`); sem o arquivo não mostra nada. `MailboxSheet` também mostra a imagem do NPC remetente (96px, campo `npc`: `mensageiro` ou `hexsmith`) nas cartas globais e Aceitar/Recusar nas cartas `friend-invite` (`onAnswerInvite` de `useMailbox`); nas cartas `guild-invite` (§358), "Entrar no clã" (`onJoinGuild` = `useMailbox.joinGuildFromLetter`, o mesmo `guildJoin` do Salão) e "Recusar" (só apaga a carta). Carta de clã antiga, sem `kind`, segue como carta comum (o corpo traz o código). **Régua:** `MailboxSheet.cartas.render.test.tsx`.

### `src/components/nav/MailLink.tsx`

O ícone de carta da Home, linha 1 da pilha do canto direito (entre o Mapa e as Missões), com a bolinha vermelha de carta nova. Arte por glob em `assets/soulmon/icones-ui/carta.ts`; sem arquivo cai no glifo `chat_bubble`. Decisão: REGISTRO §246.

### `src/components/play/RogueKeyGate.tsx`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props `expired` (a chave passou das 48 h) e `onGoToWorkshop` (CTA "Ir para a Oficina do Foco"); só fecha por X, CTA, Esc ou voltar (§454).

Portão do Calabouço sem a chave do dia: Bastion (NPC 412) no modal padrão `NpcSequence` manda à Oficina do Foco. Decisão: REGISTRO §239. **Régua:** `RogueKeyGate.render.test.tsx`.
**Delta 13/11/2026 (REGISTRO §319):** prop `onGoToWorkshop?` — com ela, a fala ("Você precisa de uma chave…") ganha o `CtaButton` "Ir para a Oficina do Foco" / "Go to the Focus Workshop" (`data-rogue-gate-workshop`); o `AreaView` fecha o portão e pede `requestGoToBuilding('forja.oficina')`.

### `src/components/play/FocusBoard.tsx` · `src/components/play/JourneyScreen.tsx` · `src/components/play/FocusTaskDock.tsx` · `src/components/play/journeyArt.ts`
**Sync 16/11/2026 (`b0c1e59c..6b7773143`) — `JourneyScreen.tsx`:** export `JOURNEY_LEAVE_MS` (900 ms: o mapa se dissolve na cor da sala de descanso); props `collected`, `focusTaskId`, `tasks`, `onToggleTask`, `onToggleStep` (`FocusTaskDock`); tela sempre acordada só com o timer rodando; achados saem do baú do mapa para o baú do canto.
**Sync 16/11/2026 (`b0c1e59c..6b7773143`) — `journeyArt.ts`:** exports novos `OASIS_ART` (arte da sala de descanso por ambiente, por glob `oasis-*`), `OasisTone`, `OASIS_TONE`; `ARRIVAL_ART` saiu (§315).
**Sync 16/11/2026 (`b0c1e59c..6b7773143`):** props `tasks`, `onCompleteTask`, `onToggleStep`, `onSetIce` (Prioridades ICE no lugar da matriz de Eisenhower, §313), `onCreateTask`, `onFocusCycle(taskId)` (missão do dia conta; leva `habit:<id>` para hábito); Começar abre a escolha da tarefa (`FocusTaskPicker`), a sala de descanso (`RestRoom`) entra ao fim do foco e há avisos com o app fechado (§301); a Oficina entra livre e COMEÇAR pergunta com o Soulmon dormindo (§329).

A Oficina do Foco desde §247: card Sessão + 6 cards de chave (as técnicas de `OficinaPlano.tsx` em modo `only`), e a jornada em tela cheia (arte pintada de `journeyArt.ts` em `src/assets/focus-jornada/`, com fallback SVG/ícone quando falta um asset; modal pequeno do relógio, pausas e encerrar). Posição = tempo do servidor. **Régua:** `FocusBoard.render.test.tsx`, `playArea.render.test.tsx`.

**§304 (11/11/2026):** `JourneyScreen` ganhou as props `tasks`, `onToggleTask`, `onToggleStep` e renderiza `play/FocusTaskDock.tsx` (`FocusTaskDock`, `DockTask`, `JOURNEY_CARD_WIDTH`, `JOURNEY_GLASS`; props `language`, `tasks`, `onToggleTask`, `onToggleStep`, `top`, `bottom`; linhas = `RitualRow` + `StepRow`); `FocusBoard` ganhou `onToggleStep` (e `steps` em `BoardTask`) e `AreaView` a prop `play.onToggleFocusStep` (App: `handleToggleTaskStep`). `utils/keepAwake.ts`: `useKeepAwake(active)` e `keepAwakeSupported()`. **Régua:** `FocusTaskDock.render.test.tsx`.

**§312 (12/11/2026):** `FocusTaskDock` mostra SÓ a tarefa de `focusId` e os subtópicos dela (sem cabeçalho nem «Em foco»; sem `focusId`/tarefa, o vazio `data-focus-dock-empty`); altura auto até 25dvh; a alça `data-focus-dock-handle` só existe se o conteúdo transborda (ou já está aumentado). `RitualPanel.tsx` exporta `pickRowStyle(base, checked)` (linha de escolha selecionada = `outline` + borda `--sm2-primary-ink`, nunca fill primário), usado por `FocusTaskPicker` e `OficinaPlano`.

### `src/components/play/FocusTaskPicker.tsx` · `src/components/play/FocusBag.tsx` (12/11/2026 — REGISTRO §300)

`FocusTaskPicker({ language, tasks, initialId?, busy?, onClose, onPick, onCreate? })`: `ModalSheet` que escolhe a tarefa da sessão (sempre; sem abertas, campo para criar). `FocusBag` (baú da sessão: `items`, `pending`, ref no botão; tooltip com o coletado, fecha ao tocar fora/Voltar), `FlyingItem` (voo do item; `onDone` ao terminar, na hora sem Web Animations ou com movimento reduzido) e `ItemIcon` (imagem do slot ou emoji). `FocusBoard` ganhou `onCreateTask`, `JourneyScreen` ganhou `collected` e `focusTaskId`, `FocusTaskDock` ganhou `focusId`; `AreaView`: `play.onCreateFocusTask`. **Régua:** `FocusBoard.render.test.tsx`, `FocusBag.render.test.tsx`.

### `src/components/play/EndSessionModal.tsx` (23/11/2026 — 15.3)

`EndSessionModal({ language, onYes, onNo })`: popup central (`ModalSheet`, título inline, ✕) «Deseja encerrar a sessão?» / «Do you want to end the session?» com Não e Sim (`data-end-session-no/-yes`). Aberto por Encerrar (`JourneyScreen`) e Concluir a missão (`RestRoom`); Sim chama `onEnd`/`onFinish`; Não, ✕ e Esc só fecham. **Régua:** `FocusBoard.render.test.tsx`.

### `src/components/play/RestRoom.tsx` (12/11/2026 — REGISTRO §301)

`RestRoom({ language, rest, petSprite, cycles, now, onNext, onFinish, onClose, busy?, error? })`: a sala de descanso em tela cheia (portal, z 210): card do relógio (`mm:ss` restante, «Descanso concluído» no fim), Soulmon, «Baú aberto» com itens e chave do Calabouço e os botões «Seguir» / «Concluir a missão». Fundo = `OASIS_ART[env]` (slot) ou `OasisFallback` (gradiente + lagoa, paleta `OASIS_TONE`), ambos em `journeyArt.ts`. §315: sem porta nem `ARRIVAL_ART` (o quadrado no meio era a arte opaca `cena-chegada.webp`, 60×60 no fim do mapa; apagada); `JourneyScreen` ao chegar a `p>=1` mostra `data-journey-leave` (camada na cor `OASIS_TONE[env].sky`, `JOURNEY_LEAVE_MS`=900) e só então chama `onClaim`; a `RestRoom` tem fundo sólido nessa cor e a camada `data-rest-bg` (arte ou fallback) aparece em fade. `FocusBoard` guarda o `RestState` e faz `nextCycle`/`finishMission`. **Régua:** `FocusBoard.render.test.tsx` (descrição «sala de descanso e ciclos»).

### `src/components/play/TicketFan.tsx` (09/11/2026 — REGISTRO §270)

`TicketFan` (os tickets em leque), `TicketPanel` (leque + contagem + validade + comprar), `TicketCost` (ticketzinho "x1" dos botões), `TicketArt` (arte; SVG provisório enquanto `TICKET_IMG` é `null`) e `FunTicketCostContext` (o `ResultScreen` mostra o x1 no "Jogar de novo"). **Chamado por:** `PlaySheets.tsx`, `MinigameModeGate.tsx`, `AreaView.tsx`, `games/ResultScreen.tsx`.

### `src/components/play/TicketBuyModal.tsx` (15/11/2026 — REGISTRO §395)

`TicketBuyModal` (o modal "sem ticket, quer comprar?": `ModalSheet` centralizado, a arte do ticket metade dentro/metade fora da borda de cima por portal, "Cada partida gasta x1", Comprar 3 tickets / Agora não) e `TICKET_BUY_ART_W`. **Chamado por:** `PlaySheets.tsx` (`SalaoSheet`).

### `src/components/AppUpdateGate.tsx`

Modal de atualizacao do app NATIVO (11/11/2026; so web, sem APK novo). Le `App.getInfo().build` + `/api/app-config` e usa `decideUpdate`: 'block' (sem fechar, so "Atualizar") ou 'suggest' ("Depois", 1x por abertura). Web/desktop nunca mostram; erro/sem rede = nada. "Atualizar" = `SoulmonReview.openStore()` (market://, fallback https). Montado em `App.tsx`.

### `src/components/PlayReviewModal.tsx`

Modal "Avaliar / Agora nao" mostrado depois da evolucao (App.tsx).

### `src/components/guild/FeiraLojaSheet.tsx`
**Dono de:** a folha da Feira de verdade (vendedor + `ShopShelf` com desconto + Hexsmith sem ingrediente), montada pela fila na vaga `feiraEvento`.
**Props principais:** `{ language, saveId, loja, points, ownership, getState, onBuyShop, onHexBought, onClose }`.

### `src/components/hex/HexRenameButton.tsx`

**Dono de:** os 2 botões hexagonais de renomear da Hexsmith (11/11/2026, §287): lápis = nome do Soulmon, chama = nome do especial. Arte final por `assets/soulmon/hexsmith/btn-lapis|btn-chama`; sem arquivo, hexágono generativo SVG. Montados em `HexsmithSheet.tsx` na linha da Coroa.

### `src/components/hex/HexRenameModal.tsx`

**Dono de:** o modal de renomear (§287): caixa de texto, custo `HEX_RENAME_COST`, confirmação antes de gastar; a troca é do servidor (`cloudHexRename`). Usa `ModalSheet` (modalDepth/Voltar).

**Voltar de UM nível (23/11/2026, §503):** `onBack`/`onClose` = `voltar`: na confirmação (Sim/Não) volta ao campo de texto; no campo, fecha só este modal (volta ao mapa). Registra `useBackLayer(true, voltar)`, então o voltar do sistema faz o mesmo e nunca fecha a Hexsmith. O Voltar é o do corpo da tela interna; o ✕ é o medalhão esquerdo da moldura (`AreaSheet moldura="aco"`), sempre fechando tudo.

### `src/components/perfil/EspecialNomeLeitura.tsx`

**Dono de:** a leitura do nome do especial no Perfil (§287). Substituiu `EspecialNomeEditor`: o Perfil só mostra os nomes e aponta para a Hexsmith. Usado por `ProfileEditor` e `SoulmonPerfil`.

**`ui/InfoTip` (12/11/2026):** prop nova `trigger?: ReactNode` (gatilho próprio no lugar do "i", ex.: o ícone de uma poção na tabela da Hexsmith) e o tooltip aberto registra uma camada de voltar (`useBackLayer`). `hex/HexsmithSheet`: catálogo em tabela Item/Custo (`.sm2-hex-table`, `data-hex-cost`, `data-hex-cost-potion`, `data-hex-potion-tip`). Textos: `hexsmithCopy.potionHowTo`, `hexCostHowTo`. Custo (§307): fileira única poção + fragmentos + Bits, cada um com `InfoTip` (`data-hex-cost-bits`, `data-hex-bits-tip`, `data-hex-fragments-tip`).

### `src/components/PocaoCriada.tsx`

**`PocaoCriada` (12/11/2026, §306):** `{ language, elementId, onClose }` — tela cheia (portal, `aria-modal`, voltar/Esc fecham) com `.sm2-potion-made`, `.sm2-potion-rays` (luz girando), `.sm2-potion-icon`, texto `data-pocao-texto` e `data-vesca-ok`. `VescaPotionOffer.onMake` agora pode devolver `false` (sem saldo: não mostra "criada").

### `src/components/ElementosNovosModal.tsx`

**`ElementosNovosModal` (15/11/2026, §396 e §401):** `{ language, elementIds, onClose }` — a CARTA de "Elemento novo": carta preta 5:7 (`ui/carta-elemento.webp`, igual para todos), ícone grande, nome na fonte de título e, nos compostos, fileira de componentes (`componentesDoElemento`). Vários ids = carrossel (setas 44 px, deslize, pontinhos, "1 de N"); o OK fica `disabled` até todas as cartas serem a página atual; o X no topo (`BackArrow close`), Esc e o voltar fecham. Sem frase de poção. O App grava o "visto" do lote AO MOSTRAR.

### `src/components/WeeklyRetroModal.tsx`
**`WeeklyRetroModal` (16/11/2026, §433):** `WeeklyRetroModalProps` — o modal da retrospectiva de segunda: um card liso com a chama da alma em cristal (`ui/SoulFlameAnim`) metade fora da borda, o Soulmon do usuário por baixo e o `CtaButton` tom `acao`; `RETRO_FILL_MS` é o tempo do preenchimento. Com `prefers-reduced-motion` mostra o estado final. Regra em `utils/weeklyRetro.ts`. **Régua:** `WeeklyRetroModal*.test.tsx`.

### `src/components/ui/SoulFlameAnim.tsx`
**`SoulFlameAnim` (16/11/2026):** `{ height?, cycleSeconds?, className?, style? }` — a chama da alma turquesa dentro de um cristal, folha de 8 quadros em grade 4x2 (`FLAME_SHEET_COLS`, `FLAME_SHEET_ROWS`, `FLAME_SHEET_FRAMES`, `FRAME_ASPECT`) tocada por CSS `steps`; parada no quadro 1 com `prefers-reduced-motion`.

### `src/components/games/SummonLayer.tsx`
**Dono de:** o sprite do companheiro invocado na cena (16/11/2026, REGISTRO §449): `SummonLayer({ summons, me, foes, reduced })` desenha a criatura um pouco à frente de quem invocou enquanto o contador real `FighterFx.comp` for maior que zero (nenhum timer decide a presença; só a saída suave de 200 ms). Exports: `StageSummon` (`side`, `creature`, `turns`), `SUMMON_SIZE`, `SUMMON_ADVANCE`, `summonPlace`, `summonsDoGrupo`. Sem sprite para a criatura = não desenha. Usado por `BattleStage`.
### `src/components/NeutroPotionPanel.tsx` ⚰️ apagado em 17/11/2026 (§468)
**Dono de (histórico):** o painel da poção do Neutro no Centro de Evolução (16/11/2026, REGISTRO §452): `NeutroPotionPanel` mostra o progresso por elemento base (`neutroProgresso`, `NEUTRO_POTION_COSTS`) e o botão de forjar; textos em `NEUTRO_PANEL_COPY`. A regra mora em `utils/neutroPotion.ts`.

### `src/components/PratoFeito.tsx`
**Dono de:** o modal "Prato feito" (16/11/2026, REGISTRO §455/§465): `PratoFeito` abre ao cozinhar no Restaurante e ao comprar na Feira (variante "Comprado"), mostra a arte do prato (`dishArt`) ou o ícone, e fecha por X ou CTA (`useBackLayer`). O prato já está na pastinha (`dish:<id>`).

### `src/components/arena/conviteDueloArt.ts`
**Dono de:** a arte do convite de Duelo (REGISTRO §458): `conviteDueloArt(language)` devolve o papiro `convite-duelo-96-*` por idioma, ou `undefined` se o arquivo faltar (a folha só não mostra o papiro, nunca quebra).

### `src/components/rift/RiftMap.tsx`
**Dono de:** a tela do mapa de andares do Rift infinito (16/11/2026, REGISTRO §462): `RiftMap` (`RiftMapProps`) desenha os nós e o caminho do `utils/riftMap.ts`, rola até o andar atual e deixa voltar a um conjunto já visitado (`riftRewindRefusal` explica a recusa). Só leitura do plano; o estado vive no save do Rift.

### `src/components/ReviewSoulmonRow.tsx` (10/11/2026; manual em 16/11/2026)
**Dono de:** a linha "Pedir revisão do meu Soulmon" da Ajuda/Configurações e o aviso de conclusão: o jogador acha o desenho com problema, escolhe o motivo (Estilo inconsistente / Recorte com falhas) e UM toque manda o pedido; o botão fica inativo com "Seu Soulmon está em revisão" (ou "Enviamos para a nossa equipe olhar") até o servidor concluir. O estado vive no servidor, por forma (sobrevive a fechar o app).
**Exports:** `reviewCopy(language)` (textos PT/EN e o texto de cada `ReviewRequestError`: `network`, `cooldown`, `limit`, `server`, `no-sprite`) · `reviewResultMessage(language, finished)` (o conserto vence: `consertado` → "atualizado"; `sem-problema` → "tudo certo"; senão "ainda não conseguimos consertar") · `ReviewRowState` (`active`, `team?`, `sending`, `error`, `reviewable`, `onRequest(motivo?)`) · `ReviewSoulmonRow({ language, review? })` (sem `review` não renderiza; usa `ActionRow` com `disabled` e `ModalSheet` do motivo) · `ReviewResultModal({ language, message, onClose })` (aviso de conclusão, uma vez por conclusão).
**Chamado por:** `src/components/SettingsPage.tsx` (prop `review`), `src/App.tsx` (monta `ReviewResultModal` com o resultado do `useReviewWatcher`).
**Régua:** `src/hooks/useReviewWatcher.test.tsx`. Servidor e hook: `api-workers.md` e `hooks-contexts-types.md`.

### `src/components/guild/GuildBuffs.tsx` (10/11/2026; manual em 16/11/2026)
**Dono de:** o painel dos Buffs do clã na sala do Salão (`data-guild-room="buffs"`), que SUBSTITUI a Loja do clã (`GuildLoja`, apagada). O tesouro é um número do CLÃ; cada Buff vale para a roda inteira por `BUFF_DIAS` (7) dias; só o anfitrião (`euPosso`) compra, os demais veem o que está ativo. Sem saldo o botão só descansa (nenhuma frase cobra); o preço aqui é exibição, o servidor cobra o dele (`utils/guildBuffs.ts`, `functions/api/_buffsCla.js`).
**Exports:** `GuildBuffs({ casa, language, ocupado, now, onComprar(buffId) })` — lista `BUFF_IDS` com nome/descrição (`buffText`), "ativo até <data>" (`data-buff-ate`), botão comprar/renovar com `BitsAmount` (`data-buff-comprar`), saldo (`data-buffs-saldo`) e aviso "só o anfitrião" (`data-buffs-so-anfitriao`).
**Chamado por:** `src/components/guild/GuildSheet.tsx`.

### `src/components/guild/GuildLoja.tsx` — ⚰️ apagado
⚰️ **Apagado em `e91c1f8bd` (10/11/2026, §281).** Era a vitrine da Loja do clã dentro do Salão; a doação diária (50/100 Bits) e os Buffs do clã (`GuildBuffs`) a substituem, e `functions/api/_lojaCla.js` saiu junto.

### `src/components/perfil/EspecialNomeEditor.tsx` — ⚰️ apagado
⚰️ **Apagado em `4168e6d70` (11/11/2026, §287).** Era o campo de renomear o especial no Editar perfil; o Perfil só lê os nomes (`EspecialNomeLeitura`) e a troca é na Hexsmith (`HexRenameButton`/`HexRenameModal`).

## Sync 17/11/2026 (`6b7773143..65ba36dc7`, REGISTRO §467–§470)

- `play/PlaySheets.tsx`: `SalaoSheet`/`MenteSheet` em `GameCardGrid` + `GameCard` com `Badge`, `DinoBadges`, `Match3Badges`, `PptBadges` (selos sob a carta; §469); `MasmorraSheet({ language, onStart, onMap, bitsToday, saveId, headSlot })` com só "Entrar no Rift" e "Ver o mapa", "Drop rate" em `ModalInfo`, botão "Ranking" em portal no `headSlot` abrindo `RankingPanel` (`RIFT_GAME_ID`, mensal) (§470).
- `nav/AreaSheet.tsx`: prop nova `headStartRef` (encaixe à esquerda do título, `data-area-sheet-head-start`). `nav/AreaView.tsx`: estados `riftAuto` e `riftHeadStart`, `conviteDueloFan` + `TicketFan` no `npcOverlay` do Duelo, `autoStart={riftAuto}` na `DungeonGame`.
- `DungeonGame.tsx`: prop `autoStart?: boolean` (larga a descida uma vez de `riftStartLayer`, com energia e piso de HP; senão lobby); HUD com `riftFloorName`.
- `rift/RiftMap.tsx`: película preta `data-rift-map-veil` (`RIFT_VEIL_START` 24, `RIFT_VEIL_FADE` 110, `RIFT_VEIL_ALPHA` 0,96), nó com `riftSetName`.
- `arena/DueloSheet.tsx`: `ComprarConvites` (1º item; `EnergyCost`, `DUEL_INVITE_ENERGY_COST`), "Duelar" desabilitado sem convite. `arena/conviteDueloArt.ts`: novo `conviteDueloFan(language, max): FanArt | undefined`. `play/TicketFan.tsx`: `TicketFan({ count, language, art? })` e a interface `FanArt` (`src`, `portrait`, `ratio`, `max`, `unit`, `attr`); sem `art` é o ticket dos minijogos (teto 6).
- `ElementPotionSheet.tsx`: sem filtros de status nem `NeutroPotionPanel`; Neutro = última linha comum (`neutroProgresso`). `VescaPotionOffer.tsx`: só elemento base (texto único "Gasta N essências"). `App.tsx`: fila da Vesca por `VESCA_OFFER_ELEMENT_IDS`.

### `src/components/ArcadeTela.tsx`
**Dono de:** a tela animada (jogo de poucos bits + interferência, turquesa médio) do Fliperama de Canto na Home.
**Props:** `dormindo` (tela escurecida e parada).
**Estado/efeitos relevantes:** canvas 40×40 redesenhado por `setInterval` de 100 ms; pausa com `document.hidden`; movimento reduzido = um quadro.
**Chamado por:** `src/components/PetStageDecor.tsx`

### `src/components/play/ArcadeModal.tsx`
**Dono de:** o modal de minigames sobre a Home aberto pelo Fliperama de Canto (corpo do `SalaoSheet`, sem o Pipo nem o mapa; REGISTRO §486).
**Props:** `open`, `onClose`, `language`, `bitsToday`, `funStatus`, `onBuyTickets`, `onStart(jogo)`.
**Chamado por:** `src/App.tsx`

### `src/components/RankingModal.tsx`

**Dono de:** o MODAL DO RANKING (18/11/2026, §485): `ModalFrame` com a moldura própria `ui/ranking/` (ouro envelhecido, faixas vermelhas, medalhas, placa de bronze), corpo rolável SEM borda interna. **Props:** `open`, `onClose`, `language`, `title`, `info?`, `children`. X e "i" são só glifos sobre os discos da arte (alvo ≥ 44 px transparente). **Usado por:** `MinigameModeGate` (Ver ranking) e `RankingPanel` (modal da semana/mês). **Régua:** `RankingModal.render.test.tsx`. Geometria em `index.css` (`.sm2-moldura-modal--ranking`). O botão que o abre é `BotaoEspecial variant="ranking"` (`ui/btn-ranking{,-press,-off}.webp`).

**Sync 24/11/2026 (P5, Drive em popup central):** todo detalhe do Drive abre no MESMO popup central simples (`ModalSheet placement="center"`, título inline, ✕ `.sm2-popup-fechar` só fecha): ficha do elemento (`ElementModal`), detalhe do Selvagem (`BestiaryCollection`), formas do amigo (`LibraryPage`, `[data-pet-forms]`) e ficha do jogador (`PlayerDetailModal`, via `ModalSheet.titleNode`). Saíram o `RitualDialog` com placa nesses quatro. **Régua:** `ElementDex.drive.render.test.tsx`, `BestiaryCollection.acordeao.render.test.tsx`, `PlayerDetailModal.semMetrica.render.test.tsx`.
