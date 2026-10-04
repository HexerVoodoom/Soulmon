# Checklist mestre dos ajustes do dono — Soulmon

Lista ÚNICA de tudo que o dono pediu para mudar no app, por rodada. Fonte dos pedidos:
`AJUSTES-NAVEGACAO-2026-10-01.md` (rodadas 1–2) e `AJUSTES-NAVEGACAO-2026-10-02.md`
(rodadas 3, 4 e 5); a rodada 6 vem do pedido de 04/10/2026.

**Reverificado em 04/10/2026 (2ª passada, rodadas 1–6 completas), no código de `feat/r6-verif2` (= `main` com as
rodadas 1 a 6 integradas, HEAD `487e75ec`), pelo `ajustes-verificador`.**
Método: ✅ = existe E está montado numa tela alcançável (arquivo:linha); ⚠️ = existe mas
parcial/condicional/depende de arte; ❌ = não existe ou regrediu; ⏳ = não iniciado / aguarda o dono.
Sem prova de código = ⚠️. Não confia em commit message nem em relatório de agente.
Testes rodados nesta passada: `voltarFechar.contract`, `energia`, `travessias`, `entradaEnxuta.contract` (todos verdes).

> **ACHADO Nº 1 (da 1ª passada) — RESOLVIDO:** a rodada 5 já está na `main` (as rodadas 1–6 estão todas
> integradas em `feat/r6-verif2`). Resta só confirmar que o APK do dono foi rebuildado depois do merge.

Legenda de Tipo: **cód** = código · **arte** = depende de imagem do dono
(prompts em `E:\Soulmon-assets\out\ajustes-20261001\PROMPTS-PARA-O-DONO.md`) · **dec** = decisão do dono.

---

## Rodada 1 (01/10/2026) — itens A–J

| ID | Pedido (nas palavras do dono) | Tipo | Verif. | Evidência | Obs. |
|---|---|---|---|---|---|
| A1 | Logo no login e no header da Home | cód+**arte** | ⚠️ | `SoulmonOnboarding.tsx:1535` (logo no portão); `src/assets/brand/final/logo-wordmark.png` | Logo PROVISÓRIO (recorte local). Header da Home perdeu o logo de propósito (H5 r4). Alfa real = **ARTE do dono** (prompt 4 e 5; `entrada-dono/01-logo` e `02-mascote` VAZIAS) |
| A2 | Trocar a fonte de título (Fredoka) | cód | ✅ | `index.css:5027` (Cinzel self-host); `SoulmonOnboarding.tsx:136` | Sem `Fredoka` residual no src |
| A3 | Login Google ligado à conta Play | cód | ✅ | `utils/auth.ts:166`; `SoulmonOnboarding.tsx:1580` | Vínculo Steam só documentado (decisão) |
| B1 | Nome do jogador é a 1ª pergunta | cód | ✅ | `SoulmonOnboarding.tsx:407,938` | |
| B2 | Pergunta aberta → objetiva | cód | ✅ | `SoulTestItem.tsx:128` | |
| B3 | Remover "I'd rather not say" | cód | ✅ | ausente no src; trava em `SoulmonOnboarding.copyRitual.render.test.tsx:66` | |
| B4 | Todas as ~20 perguntas, obrigatórias | cód | ✅ | `utils/soulTestAnswers.ts:6` (`GameState.soulTestAnswers`) | |
| B5 | Força e dificuldade (≥1 de cada) | cód | ✅ | `catalog/CatalogOnboardingFlow.tsx:86` | |
| B6 | "Back" padronizado, seta no canto sup. esq. | cód | ✅ | `ui/BackArrow.tsx:24`; `SoulmonOnboarding.tsx:1491`; `form/FormKit.tsx:442` | Ver I3 (auditoria r5) |
| B7 | "Get the Full Game" → "Get your own Soulmon" | cód | ✅ | `SoulmonOnboarding.tsx:1636` | |
| B8 | Card "Your Soul Creature": botão "criar a própria criatura" | cód | ✅ | `SoulmonOnboarding.tsx:2201` | |
| B9 | Sprites mal recortados → alfa real | cód | ✅ | commit `9c10e2fa` (6 sprites) | Pyraka rookie ainda cortado no próprio PNG → ver H4 r4 |
| B10 | Remover opção de coloração | cód | ✅ | `demoTint` só em tipo (`SoulmonOnboarding.tsx:203`), sem UI | |
| B11 | "Less details" → "Name your Soulmon", solto | cód | ✅ | `SoulmonOnboarding.tsx:2068` | |
| C1 | Header: logo à esq., menu = 3 tracinhos | cód | ✅ | `App.tsx:6005` (`MenuBars`); `pixel/HomeHud.tsx:128` | Reposicionado em B2/H5 |
| C2 | Tirar espaço header↔pet | cód | ✅ | `App.tsx:5970` (`data-home-col`, gap 16) | |
| C3 | Pet sem box de gradiente; background padrão | cód | ✅ | `CompanionHUD.tsx:18,1305` | |
| C4 | Cradle/sininho menor | cód | ✅ | substituído: berço removido em H8 — `CompanionHUD.tsx:1396` | |
| C5 | Área do pet altura fixa, sem scroll interno | cód | ✅ | `CompanionHUD.tsx:104`; `App.tsx:6107` | |
| C6 | "How are you today": emojis → assets próprios | **arte** | ⚠️ | `utils/moodArt` + `assets/icons/mood/mood-1..5` (interino) | Folha DEFINITIVA = **ARTE do dono** (prompt 8; `entrada-dono/06-mood-folha` vazia) |
| C7 | Remover descrições pequenas | cód | ✅ | `catalog/CatalogOnboardingFlow.tsx:179` | Ainda sobra copy em outras telas → K6 |
| C8 | Investigar hábito "Leitura diária" | cód | ✅ | `CatalogOnboardingFlow.tsx:58`; string não existe mais no src | |
| C9 | Card de hábito: "Commit" → "Definir" | cód | ✅ | `MorningCheckIn.tsx:453` | |
| C10 | Força/dificuldade: mínimo 1 obrigatório | cód | ✅ | `CatalogOnboardingFlow.tsx:86` | |
| C11 | Starting point sem "pular" | cód | ✅ | `CatalogOnboardingFlow.tsx:31` | |
| C12 | Swap/keep → botão "Commit" que vira checkbox | cód | ✅ | `CatalogOnboardingFlow.tsx:58` | |
| C13 | Tooltip ao tocar energia/coração | cód | ✅ | `CompanionHUD.tsx:1858` (`statTip`) | |
| C14 | Ícone do mapinha na Home | cód | ✅ | `App.tsx:6701` (`CornerLink` mapa) | Movido p/ topo direito em B2 r3 |
| D1 | Concluir tarefa: card com glow descendo | cód | ✅ | `DailyRituals.tsx` (D1) | |
| D2 | Remover botão pena; editar = ícone esquerdo | cód | ✅ | `DailyRituals.tsx:90,283` | |
| D3 | Remover tracejado + bolinha | cód | ✅ | `DailyRituals.tsx:81` | |
| D4 | Catálogo: busca vira lupa; sem scroll horizontal | cód | ✅ | `catalog/CatalogBrowserModal.tsx:32,96` | |
| D5 | Catálogo sem emojis-ícone | cód | ✅ | `CatalogBrowserModal.tsx:135` | |
| D6 | Botão "adicionar" mais baixo | cód | ✅ | `QuickAddBar.tsx` | Sem marcador no código; conferido só por existência — ver obs. de risco |
| E1 | Chat: digitar direto | cód | ✅ | `ChatBox.tsx` (dock) | |
| E2 | Ocultar copy "If you're going through…" | cód | ✅ | `ChatBox.tsx:555` | |
| E3 | Campo vazio = microfone; com texto = enviar | cód | ✅ | `ChatBox.tsx:66` | Mic só aparece com `SUPABASE_*` no ambiente (CLAUDE.md) |
| F1 | Saquinho → mochila | cód | ✅ | `home/Mochila.tsx:179`; `CompanionHUD.tsx:235` | |
| F2 | Modal de recompensa claro + "Equipar" | cód | ✅ | `MorningDream.tsx:39` | |
| F3 | Franja branca nos sprites | cód/arte | ✅ | commit `abf071e1` (56 arquivos, 3657 px) | |
| F4 | Ícone de banho refeito | cód | ✅ | `CompanionHUD.tsx:403` | |
| G1 | Ocultar "Oracle" e "Redo the ritual" | cód | ✅ | `nav/HomeMenuSheet.tsx:10` | |
| G2 | Settings em accordion fechado | cód | ✅ | `SettingsPage.tsx:74,283` | |
| G3 | "Your Plan: Full" → selo | cód | ✅ | `AccountSection.tsx:109` | |
| G4 | Remover campo de e-mail | cód | ✅ | `SettingsPage.tsx:27` | |
| G5 | "Your Data": "?" com as 2 explicações | cód | ✅ | `SettingsPage.tsx:178,283` | |
| G6 | Notificações ligadas por padrão | cód | ✅ | `utils/notificationDefault.ts:2`; `App.tsx:1115` | |
| G7 | Personalidade derivada do onboarding | cód | ✅ | `App.tsx:4964` (`derivePersonality`); `SettingsPage.tsx:39` | |
| G8 | Auto sleep + rest window: modal no 2º dia | cód | ✅ | `App.tsx:7093` (`RestSetupModal`) | |
| G9 | Explicar "Restore Purchases" | dec | ✅ | resposta no doc; `SettingsPage.tsx:49` | |
| H1 | Ajuste fino da posição dos prédios | cód | ✅ | `utils/areaLotGeometry.ts:24-36` | |
| H2 | Casinha do mapa | cód | ✅ | `nav/CornerLink.tsx:32`; `App.tsx:6710` | |
| H3 | Loja: background não sobre o texto | cód | ✅ | `nav/AreaSheet.tsx:114` | |
| H4 | Modal de loja: X sup. esq. acima do NPC | cód | ✅ | `AreaSheet.tsx:93-108` | |
| H5 | Revisar nomes/textos dos NPCs | cód | ✅ | `utils/areaNpcVoice.ts:31,135` | |
| H6 | Faixa título/fechar/filtro sem vão | cód | ✅ | `AreaSheet.tsx:178`; `MercadoSheets.tsx:35` (sticky) | |
| H7 | Item já ganho não aparece à venda | cód | ✅ | `mercado/ShopShelf.tsx:380-390` (seção "Já são seus") | Agora fica numa seção separada, não some |
| H8 | Sem recurso → modal "como conseguir" | cód | ✅ | `ShopShelf.tsx:40,414` | |
| H9 | Conquistas: item + como ganhar | cód | ✅ | `MercadoSheets.tsx:179,214-231` | |
| H10 | Exploração: reposicionar prédios | cód | ✅ | `areaLotGeometry.ts:31-32` | |
| H11 | Dungeon: tirar linha 2-3-4-5; copy abaixo do botão | cód | ✅ | `DungeonGame.tsx:515,540` | |
| H12 | Stroll: cards fechados, título criativo | cód | ✅ | `play/PasseioSheet.tsx:20,230` | |
| H13 | Games: redistribuir; "Run" → "Play" | cód | ✅ | `play/PlaySheets.tsx:172` | |
| H14 | Primário em todos os botões de ação | cód | ✅ | `PlaySheets.tsx:62` | |
| H15 | Arena: treino + duelo juntos; feira à parte | cód | ✅ | `utils/areaSheetCopy.ts:36` (`torneio\|duelo\|feira`) | |
| H16 | Laboratório: prédios maiores | cód | ✅ | `areaLotGeometry.ts:36` | |
| H17 | Biblioteca: só Soulmons vistos | cód | ✅ | `LibraryPage.tsx:39,158` | |
| H18 | Backgrounds de Hall e Laboratório refeitos | **arte** | ❌ | `utils/areaSheetCopy.ts:85` (aviso: "sendo refeitos") | **ARTE do dono** (prompts 6 e 7); `entrada-dono/05-bg-hall` e `05-bg-laboratorio` VAZIAS |
| I1 | Padronização de botões | cód | ✅ | `form/FormKit.tsx:105` (`sm2Button`) | |
| I2 | Separação de cards nas lojas | cód | ✅ | `MercadoSheets.tsx:182`; `ShopShelf.tsx:380` | |
| I3 | Voltar sempre no canto sup. esq. | cód | ✅ | `nav/cornerAnchor.ts`; `AreaSheet.tsx:93` | Auditoria completa em I3 r5 |
| J1 | Metas obrigatórias p/ quem já joga | cód | ✅ | `App.tsx:212` (`needsCatalogOnboarding`) | |

**Rodada 1: 72 itens — ✅ 69 · ⚠️ 2 (A1, C6: arte provisória) · ❌ 1 (H18: arte).**

---

## Rodada 3 (02/10/2026) — itens A–G

| ID | Pedido | Tipo | Verif. | Evidência | Obs. |
|---|---|---|---|---|---|
| A1 | App abre SEMPRE em inglês | cód | ✅ | `SoulmonOnboarding.tsx:290` (`resolveLanguage`) | |
| A2 | Portão com UM botão: "Continuar com Google" | cód | ✅ | `SoulmonOnboarding.tsx:1572-1585` | Portão ainda tem um parágrafo explicativo (`:1574`) → K6 |
| A3 | Termos DEPOIS do login | cód | ✅ | `SoulmonOnboarding.tsx:1591-1605,1141` | |
| A4 | Títulos do onboarding em Rubik | cód | ✅ | `SoulmonOnboarding.tsx:131-136` | |
| B1 | Só o nome do Soulmon (sai "companheiro") | cód | ✅ | `App.tsx:6084`; `HomeHud.tsx:92-151` | |
| B2 | Navegação: mapa sup. dir., casinha sup. esq., ☰ à esq. | cód | ✅ | `CornerLink.tsx:46-47`; `App.tsx:5996-6008` | |
| B3 | "Evoluir" mais dramático, imagem própria | **arte** | ⚠️ | `pixel/EvolveButton.tsx:28` (glob de `evoluir-btn.png`) | Funciona sem o PNG (moldura interina). Moldura final = **ARTE do dono** (prompt 2; `entrada-dono/evoluir-btn` vazia) |
| B4 | Animação da evolução alterna frames iguais | — | ➖ | — | DISPENSADO pelo dono |
| B5 | Mic/enviar mais fino, azul | cód | ✅ | `ChatBox.tsx` (B5) | |
| B6 | Água do chuveiro opaca e mais baixa | cód | ✅ | `CompanionHUD.tsx:1548-1558` | |
| C1 | Card do pesadelo: criatura real | cód | ✅ | `NightmareBattle.tsx` (convite) | |
| C2 | Torcida na Arena e no Pesadelo | cód | ✅ | `NightmareBattle.tsx:442`; `DungeonGame.tsx:417`; `ArenaGame.tsx:495`; `DuelScreen.tsx:176` | Torcida existe; K1 redesenha |
| D1 | Comprar item pede confirmação | cód | ✅ | `ShopShelf.tsx:414,475,638` | |
| D2 | Decoração: limite/restrição/fundo claros | cód | ✅ | `ShopShelf.tsx` (`DecorRuleLine`); `utils/decorRules` | |
| E1 | Masmorra: texto longo → "?" | cód | ✅ | `DungeonGame.tsx:480` | "?" próprio, não o `InfoTip` |
| E2 | "Descer mais fundo" só até andar alcançado | cód | ✅ | `DungeonGame.tsx:136,363,540` | |
| F1 | Cada travessia com ícone | cód | ✅ | `play/TravessiaIcon.tsx` | |
| F2 | Card da travessia em uso + modal com todas | cód | ✅ | `PasseioSheet.tsx:26,230` | |
| F3 | "deixa pra depois" → "recuar" | cód | ✅ | `PasseioSheet.tsx:307` | |
| F4 | "Fiz" dá feedback e mostra recompensa | cód | ✅ | `PasseioSheet.tsx:230` (`justDone`) | |
| F5 | Travessia todo dia | cód | ✅ | `PasseioSheet.tsx` (`todayKey`/`doneDay`) | |
| G1 | Lab: Soulmon sem box de gradiente | cód | ✅ | commit `c2e88307`; `PetPage.tsx` | |
| G2 | Estatísticas vão para o Laboratório | cód | ✅ | `App.tsx:5285` | |
| G3 | Guilda: NPC Bastia | cód | ✅ | `utils/areaNpcVoice.ts:172-174` | |
| G4 | Arena: explicar a feira; prédios maiores | cód | ✅ | `GuildSheet.tsx:892` (`InfoTip`) | |

**Rodada 3: 25 itens — ✅ 23 · ⚠️ 1 (B3, arte) · ➖ 1 (B4 dispensado).**

---

## Rodada 4 (02/10/2026, tarde) — H1–H14

| ID | Pedido | Tipo | Verif. | Evidência | Obs. |
|---|---|---|---|---|---|
| H1 | Idioma num MODAL na abertura | cód | ✅ | `SoulmonOnboarding.tsx:301,1415-1440` | Só quando `LANGUAGE` nunca foi gravado; some em conta já usada |
| H2 | Onboarding todo em fonte de texto | cód | ✅ | `SoulmonOnboarding.tsx:136` | |
| H3 | BUG: Google em conta existente não restaurava save | cód | ✅ | `SoulmonOnboarding.tsx:1124-1131` → `utils/cloudSave.ts:489` (`restaurarContaNoLogin`) | Fix `c33e0695` JÁ está na `main`. Só restaura se houver save na nuvem para o e-mail; se o dono ainda vê o onboarding, checar se o save foi gravado na conta (`cloudSave`) antes ou se o APK é anterior ao fix |
| H4 | Sprites cortados (Pyraka e outra) | **arte** | ⚠️ | `src/assets/soulmon/lines/kaelen-rookie.png` (256×256, bbox 32,26–224,230 = corpo inteiro; commit `18c18303`, derivado da entrega 1024² do dono) | **Pyraka INSTALADO**. A "outra" ("Acache") nunca foi identificada → resta ⚠️ até o dono dizer qual |
| H5 | Home sem logo no topo | cód | ✅ | `HomeHud.tsx:92-151` | |
| H6 | Chat em largura total | cód | ✅ | `CompanionHUD.tsx` (dock); `index.css:3947` | |
| H7 | Scroll só da lista | cód | ✅ | `App.tsx:6107-6118` (`data-home-scroll`) | |
| H8 | Área do pet sem risco; sem berço | cód | ✅ | `CompanionHUD.tsx:1396` | |
| H9 | Mapa/casinha/✕ na mesma posição | cód | ✅ | `nav/cornerAnchor.ts:10-30`; `AreaSheet.tsx:93` | |
| H10 | Jogos: prédios maiores; ícones PPT novos | cód | ✅ | commit `2ad50c50`; `nav/AreaView.tsx` | |
| H11 | NPC fixo por lote | cód | ✅ | `AreaSheet.tsx:56` (`lotNpcVoice`); commit `fbeb544d` | |
| H12 | Conquistas: prédio largo | cód | ✅ | `areaLotGeometry.ts:6,27` | |
| H13 | PvP sem toggle | cód | ✅ | `TournamentPage.tsx:245-250` (`pvpAberto = meetsPvpBond`) | Sem toggle; resta o requisito de Vínculo (explicado na tela) |
| H14 | Torcida também no Duelo da Arena | cód | ✅ | `DuelScreen.tsx:176-200`; `AreaView.tsx:250,261` | |

**Rodada 4: 14 itens — ✅ 13 · ⚠️ 1 (H4: Pyraka instalado; falta identificar a "outra").**

---

## Rodada 5 (02/10/2026, noite) — I1–I14  (agora na `main`)

| ID | Pedido | Tipo | Verif. | Evidência | Obs. |
|---|---|---|---|---|---|
| I1 | Lojinha: NPC fala e texto digita aos poucos | cód | ✅ | `nav/AreaSheet.tsx:147` → `nav/NpcSpeech.tsx:15,38` → `ui/TypewriterText.tsx:28-48` | Risco da r5 RESOLVIDO (`18c18303`): com "remover animações" a digitação continua, 2× mais rápida (`reducedSpeed`); `prefersNoTypewriter` só vale sem `matchMedia` |
| I2 | Modais de base SOBEM animados | cód | ✅ | `index.css:5714-5717,5757`; `FormKit.tsx:413`; `AreaSheet.tsx:152`; `Mochila.tsx:185` | Todos os `ModalSheet` (59 usos) herdam. Respeita reduced-motion |
| I3 | Voltar/fechar à esquerda; ✕ direito só p/ encerrar atividade | cód | ✅ | `ui/voltarFechar.contract.test.ts:25-40` (TABELA: todo arquivo com ✕ classificado; falha se surgir ✕ fora da tabela; passou); `FormKit.tsx:376-460`, `AreaSheet.tsx:93`, `Mochila.tsx:193`; ✕ à direita só em `GameKit.tsx`/`BattleStage.tsx` (atividade) e dispensar-inline (`DailyReportModal`, `CreateModal`, banners do `App`) | Auditoria fechada pelo contrato; `RitualKit`/`ConfirmDialog`/`EditModal` ficam cobertos pela regra "todo ✕ entra na tabela" |
| I4 | Ilustração própria dos BITS | **arte** | ⚠️ | `ui/BitsIcon.tsx:15,28` (glob de `assets/icons/bits.png`) | Moeda SVG interina montada (`ShopShelf`, `MapPage`). Arte final = **ARTE do dono** (prompt 3; `entrada-dono/bits-icon` vazia) |
| I5 | Mercado: modalzinho + preview GRANDE solto; lightbox do fundo | cód | ✅ | `mercado/ShopItemSheet.tsx:49-86,143-215`; montado em `ShopShelf.tsx:393` | |
| I6 | Pílula interno/externo na decoração | cód | ✅ | `ShopItemSheet.tsx:124`; `ShopShelf.tsx:337` | |
| I7 | Torneio: treinamento testável | cód | ✅ | `TournamentPage.tsx:232-241,372-388,507-520` | Botão "Treinar" na aba Desafiar, local, sem Vínculo |
| I8 | Ícone da faixa maior; Missões = "!" | cód | ✅ | `TournamentPage.tsx:341,366`; `ui/NavGlyphs.tsx:586` | Indicador só aparece com `rank` carregado (precisa rede) |
| I9 | Duelo simplificado + "?"; Feira com "?" | cód | ✅ | `arena/DueloSheet.tsx:46-135`; `GuildSheet.tsx:892` | |
| I10 | Combate da Arena em TELA CHEIA, profundidade, HP nos pés, golpes do elemento, mais lento | cód | ✅ | `games/BattleStage.tsx`; montado em `DuelScreen.tsx:179`, `ArenaGame.tsx:607-670`, `NightmareBattle.tsx:246-290`, `DungeonGame.tsx:347-499`; `utils/combatFx.ts:72,90,104` | Agora vale para as 4 lutas (ver K1) |
| I11 | Lab › Árvore: pílulas com cor e ícone | cód | ✅ | `EvolutionPath.tsx:66-74,1285-1310` | Título "Evolution branches" (`:1255`) continua texto simples, sem cor/ícone |
| I12 | Emblemas fora do box e maiores | cód | ✅ | `PetPage.tsx:149-160,334-391` (grade solta, 64 px, 3 col.); montado `App.tsx:5509` | |
| I13 | VARREDURA: texto explicativo → "?" | cód | ⚠️ | `ui/InfoTip.tsx`; 44 usos de `<InfoTip` em 37 telas (antes 5), ver K6 | Ainda há `sm2Hint`/parágrafos corridos fora das exceções → K6 |
| I14 | AUDITORIA do que ficou de fora | — | ⚠️ | este documento (2ª passada) | Pendências na seção final |

**Rodada 5: 14 itens — ✅ 11 (I1, I3 e I10 subiram) · ⚠️ 3 (I4 arte, I13 parcial, I14).** Nenhum ❌ de código.

---

## Rodada 6 (04/10/2026) — implementada e integrada

| ID | Pedido | Tipo | Verif. | Evidência (código MONTADO numa tela) | Obs. |
|---|---|---|---|---|---|
| K1 | Combate v2: cena grande; torcida/mascote; barra de cheer lenta; Masmorra persiste a barra; PvE com anel (especial) e esquiva por deslize; PvP especial direto; lutas mais longas; HP + ENERGIA em cima do lutador | cód | ✅ | **Cena cheia nas 4 lutas** (`BattleStage` + `TorcidaLayer mascot`): Pesadelo `NightmareBattle.tsx:246-290` (montado `App.tsx:7239`), Masmorra `DungeonGame.tsx:347-499` (`AreaView.tsx:332`), Arena PvE `ArenaGame.tsx:607-670` (`AreaView.tsx:274`; `ARENA_ENERGY_ENABLED = true`, `utils/arena.ts:604`), Duelo/PvP `DuelScreen.tsx:179-196` (`TournamentPage.tsx:374,394`). **Mascote**: `TorcidaKit.tsx:54,89-138`. **HP + energia em cima**: `BattleStage.tsx:164-198` (`data-stage-energy`). **Barra de cheer lenta**: `energia.ts:43` (`CHEER_TAPS_FULL = DUEL_TAPS_FULL = 24`, `_duel.js:78`). **Anel PvE**: `energia.ts:98-125` + `PveMechanics.tsx` (`SpecialRing`) via `BattleStage.tsx:34`. **Esquiva por deslize**: `TorcidaKit.tsx:103,135,159-162`; ligado em `NightmareBattle:252`, `DungeonGame:353`, `ArenaGame:613` (`swipeActive={phase==='dodge'}`). **PvP direto no servidor**: `_duel.js:35-41,216-223` (especial sai quando `enMe>=MAX`, sem anel/esquiva). **Persistência na Masmorra**: `usePveBattle.ts:135,194` (`keepPet`; só zera na run nova, `DungeonGame.tsx:202`). **Duração**: `energia.ts:79` (`PVE_HP_SCALE=1.8`, inimigo ×1,1), `combatFx.ts:90` (`DUEL_STEP_MS=1700`), `:104` (`ARENA_STRIKE_MS=2400`). Teste `energia.test.ts` verde | Alcançável por jogador comum (PvP exige Vínculo, `TournamentPage:245`; treino local sem Vínculo, `:232`). **Não provado em tela** (só código + teste unitário): a sensação de duração real. Dificuldade da Masmorra → TORC-6 pendente (K11) |
| K2 | Refazer fundos do Laboratório e do Hall | **arte**/dec | ⏳ | Prompts 6 e 7 prontos; `entrada-dono/05-bg-hall` e `05-bg-laboratorio` **vazias** (04/10); aviso interino `areaSheetCopy.ts:85` | **ARTE do dono** |
| K3 | Rodadas de QA só de bug e correção | cód | ✅ | 31 commits `fix(qa1/qa2/qa3)` no log (8+11+12), ex. `c164f0fb`, `b2f65ba6`, `463fac60`; merges `e6955df4`, `a487bbb1`, `753540ff` | A contagem do dono (37) inclui itens sem a tag; ver K11 |
| K4 | Exploração › Missões: marcador "!"/"?", 3 missões/dia (escolhe 1), cenário, pontuação (Marcos), influencia o Pesadelo | cód+dec | ✅ | **Marcador no lote**: `AreaView.tsx:295` (`missionMark`) → `AreaScene.tsx:141` (`MissionMark`); **no card**: `PasseioSheet.tsx:141,229`; **3/dia**: `types/travessias.ts:130` (`MISSIONS_OFFERED_PER_DAY=3`), `travessias.ts:98-106`, `PasseioSheet.tsx:311-316` (`dailyOffer`/`pickMission`); **Marcos**: `travessiasSave.ts` (`score`, `marcosAbertos`), `travessias.test.ts:378-401` (1/missão/dia, cosmético; verde); **Pesadelo**: `travessias.ts:167-272` (`trip` + `VIAGENS`, viagem da noite) | Perguntas §21 (marcador todo dia, Marcos→decoração, total de Marcos) abertas → K11 |
| K5 | Prédios novos na Exploração: Pomodoro/técnicas; journaling | cód+**arte**+dec | ⚠️ | `playAreaLots.ts:32,62-63` (lotes `oficina`, `caderno`); `AreaView.tsx:321-322` monta `OficinaSheet`/`CadernoSheet`; `areaLotGeometry.ts:30-31` | Código ✅. **Arte provisória**: lotes reusam sprites do Observatório/Biblioteca (comentário em `areaLotGeometry.ts:29`) → **ARTE do dono** |
| K6 | Varredura de texto explicativo → `InfoTip` | cód | ⚠️ | 44 usos de `<InfoTip` em 37 telas (antes 5): `PlaySheets` ×6, `PasseioSheet` ×5, `TournamentPage` ×3, `OficinaSheet` ×2, `StatsPage`, `RestSetupModal`… | **Sobram** `sm2Hint` em 25+ telas (`TournamentPage` 19, `AccountDataSection` 14, `ShopShelf` 13, `EvolutionPath` 12, `PetPage` 11, `App.tsx` 9) e literais ≥120 caracteres fora de InfoTip em `SettingsPage` ×6, `AccountDataSection` ×4, `RebirthModal` ×4, `OraclePage` ×4, `GameTutorialFlow` ×3, `PixelizerCard`, `mente/TrocaGame`, `BalanceWeekModal`, `NewReadingModal` (grep heurístico; `GuideModal`/`HelpModal` = ajuda, exceção natural). Lista de exceções declaradas não encontrada em doc |
| K7 | Corrida com o BOUNCING da Home; feedback de animação; modais sobem | cód | ✅ | `DinoGame.tsx:10,126-135` (`idlePose`/`runPose` de `utils/petBounce.ts`, squash/stretch/poeira; commits `f37f4a56`, `ca5f6ef4`); montado `AreaView.tsx:353`; modais sobem = I2 (`index.css:5714-5757`) | Orientação do sprite (de costas) não provada em tela |
| K8 | Checklist + verificador a cada rodada | proc | ✅ | `docs/CHECKLIST-MESTRE.md`; `.claude/agents/ajustes-verificador.md` | |
| K9 | Botão "Começar agora — é grátis" do onboarding não avançava | cód | ✅ | `SoulmonOnboarding.tsx:720,962-976` (`escolherGratis`/`iniciandoGratis`, falha com `console.warn` e aviso), `:1644-1649` (botão `aria-busy`/`disabled`, texto de "preparando"); commit `17548bd1` (aquece o Oráculo) | Portão alcançável por todo usuário novo |
| K10 | Oficina do Foco + Caderno na Exploração (técnicas, timer, journaling na nuvem, vibração com interruptor) | cód | ✅ | `play/OficinaSheet.tsx:95`; `utils/focoTimer.ts:141-148` (vibra 180 ms, padrão ligada); interruptor `SettingsPage.tsx:9,113`; Caderno `CadernoSheet.tsx` + `utils/cadernoSave.ts` (4 formatos), no save `App.tsx:4259,6047` (`GameState.caderno`), contrato de dado sensível `cadernoSensivel.contract.test.ts`; testes `OficinaCaderno.render.test.tsx` | Arte dos lotes provisória (K5) |
| K11 | QA de bug 1/2/3: bugs corrigidos + o que ficou como DECISÃO do dono | cód+dec | ⚠️ | Corrigidos: ver K3 (31 commits `qa*`). Decisões abertas: **TORC-6** (dificuldade da Masmorra, `PERGUNTAS-DO-DONO.md:415`, "Nada aplicado"); perguntas de missões §21 (`REGISTRO-DE-DECISOES.md:1711-1718`, 3 perguntas) | **Não achei em nenhum doc do repo** as decisões "relógio que volta", "duas abas", "corrida do KV no `match`", "pós-exclusão de conta", `consumedOrders` (só como resíduo da exclusão em `STATUS.md:1126`) e "banho farmável" → registrar em `PERGUNTAS-DO-DONO.md`, senão ficam invisíveis ao dono |
| K12 | JS de entrada reduzido (893→544 KB) com contrato | cód | ✅ | `dist/assets/index-CnR684pc.js` = 545.892 B; `src/deploy/entradaEnxuta.contract.test.ts` (2 testes, verdes); Pesadelo lazy `App.tsx:645` | |

**Rodada 6: 12 itens — ✅ 8 (K1, K3, K4, K7, K8, K9, K10, K12) · ⚠️ 3 (K5 arte provisória, K6 varredura parcial, K11 decisões abertas) · ⏳ 1 (K2 arte do dono).**

---

## Fechamento da verificação (2ª passada, 04/10/2026)

### Contagem por rodada
| Rodada | Itens | ✅ | ⚠️ | ❌ | ⏳/➖ |
|---|---|---|---|---|---|
| 1 | 72 | 69 | 2 (A1, C6: arte) | 1 (H18: arte) | 0 |
| 3 | 25 | 23 | 1 (B3: arte) | 0 | 1 (B4 dispensado) |
| 4 | 14 | 13 | 1 (H4) | 0 | 0 |
| 5 | 14 | 11 | 3 (I4 arte, I13, I14) | 0 | 0 |
| 6 | 12 | 8 | 3 (K5, K6, K11) | 0 | 1 (K2 arte) |

### Regressões (item ✅ → ⚠️/❌)
Nenhuma. Todos os caminhos de arquivo citados nas rodadas 1–5 ainda existem (só faltam, como esperado, os PNGs de arte `bits.png` e `evoluir-btn.png`). H7 (r1) segue contrariando a letra do pedido (seção "Já são seus", `ShopShelf.tsx:380`) — confirmar com o dono.

### Lista priorizada de ⚠️/❌ restantes
1. **K6/I13 — varredura do "?"** (código) — `TournamentPage.tsx`, `AccountDataSection.tsx`, `mercado/ShopShelf.tsx`, `EvolutionPath.tsx`, `PetPage.tsx`, `SettingsPage.tsx`, `RebirthModal.tsx`, `OraclePage.tsx`, `GameTutorialFlow.tsx`, `App.tsx`. Usar `ui/InfoTip.tsx`; declarar as exceções num doc.
2. **K11 — registrar as decisões dos QAs** (dec) — entradas em `docs/PERGUNTAS-DO-DONO.md` para relógio que volta, duas abas, corrida do KV, pós-exclusão, `consumedOrders`, banho farmável; **TORC-6** (`buildDungeonWave`) e as 3 perguntas de missões (§21).
3. **H7 (r1)** — confirmar "Já são seus" (dec).
4. **H4 — identificar a segunda sprite cortada ("Acache")** (dec do dono).
5. **Confirmar o APK**: rebuild a partir da `main` atual; o dono tem de ver K1, K4, K9, K10 no aparelho.
6. **Provar em tela** a duração dos combates e a orientação do sprite da Corrida (só há código/teste).

### O que é ARTE do dono (não é bug de código)
| Item | Prompt | Pasta de entrega | Estado (04/10) |
|---|---|---|---|
| A1/logo | 4 | `entrada-dono/01-logo` | vazia |
| A1/mascote | 5 | `entrada-dono/02-mascote` | vazia |
| B3 r3 — moldura do "Evoluir" | 2 | `entrada-dono/evoluir-btn` | vazia |
| I4 — moeda Bits | 3 | `entrada-dono/bits-icon` | vazia |
| C6 — 5 humores | 8 | `entrada-dono/06-mood-folha` | vazia |
| H18/K2 — fundo do Hall | 6 | `entrada-dono/05-bg-hall` | vazia |
| H18/K2 — fundo do Laboratório | 7 | `entrada-dono/05-bg-laboratorio` | vazia |
| H4 — Pyraka rookie | 1 | `entrada-dono/pyraka-rookie` | entregue e INSTALADO |
| K5 — arte dos lotes Oficina/Caderno | a escrever | — | provisória (sprites reusados) |
