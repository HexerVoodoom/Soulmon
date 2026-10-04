# Checklist mestre dos ajustes do dono — Soulmon

Lista ÚNICA de tudo que o dono pediu para mudar no app, por rodada. Fonte dos pedidos:
`AJUSTES-NAVEGACAO-2026-10-01.md` (rodadas 1–2) e `AJUSTES-NAVEGACAO-2026-10-02.md`
(rodadas 3, 4 e 5); a rodada 6 vem do pedido de 04/10/2026.

**Verificado em 04/10/2026, no código de `feat/r5-int` (HEAD `c426ecee`), pelo `ajustes-verificador`.**
Método: ✅ = existe E está montado numa tela alcançável (arquivo:linha); ⚠️ = existe mas
parcial/condicional/depende de arte; ❌ = não existe ou regrediu; ⏳ = não iniciado.
Sem prova de código = ⚠️. Não confia em commit message nem em relatório de agente.

> **ACHADO Nº 1 (explica o "ainda não vi" do dono):** a rodada 5 (I1–I12, 21 commits) está só em
> `feat/r5-int` / `origin/feat/r5-int`. **`main` termina em `b402bd4b` (rodada 4 + Torneio)** —
> `git merge-base --is-ancestor feat/r5-int main` = falso. O APK que o dono testa vem da `main`,
> logo lojinha com NPC digitando, preview grande, treino no Torneio, combate em tela cheia,
> modais subindo, pílulas coloridas, emblemas soltos e voltar/fechar à esquerda NÃO estão no
> aparelho dele. O código existe e está montado (abaixo); falta merge + build do APK.

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
| H4 | Sprites cortados (Pyraka e outra) | **arte** | ⚠️ | `assets/soulmon/lines/kaelen-rookie.png` (86 KB, antigo) | **O dono JÁ ENTREGOU** `E:\Soulmon-assets\entrada-dono\pyraka-rookie\kaelen-rookie.png` (523 KB, 02/10 23:11) — **NÃO instalado no repo**. "Acache" ainda não identificado |
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

**Rodada 4: 14 itens — ✅ 13 · ⚠️ 1 (H4: arte entregue, falta instalar).**

---

## Rodada 5 (02/10/2026, noite) — I1–I14  (**só em `feat/r5-int`, NÃO na `main`**)

| ID | Pedido | Tipo | Verif. | Evidência | Obs. |
|---|---|---|---|---|---|
| I1 | Lojinha: NPC fala e texto digita aos poucos | cód | ✅ | `nav/AreaSheet.tsx:147` → `nav/NpcSpeech.tsx:15,38` → `ui/TypewriterText.tsx:38` | **Risco**: `prefersNoTypewriter()` (`TypewriterText.tsx:35`) mostra tudo de uma vez se o aparelho tem "remover animações" (Android) — o dono pode não ver a digitação mesmo com o build novo |
| I2 | Modais de base SOBEM animados | cód | ✅ | `index.css:5714-5717,5757`; `FormKit.tsx:413`; `AreaSheet.tsx:152`; `Mochila.tsx:185` | Todos os `ModalSheet` (59 usos) herdam. Respeita reduced-motion |
| I3 | Voltar/fechar à esquerda; ✕ direito só p/ encerrar atividade | cód | ⚠️ | `FormKit.tsx:376-460` (`closeSide`); `AreaSheet.tsx:93`; `Mochila.tsx:193`; `NightmareBattle.tsx:401` (`end`) | Auditoria PARCIAL: ainda com ✕ à direita fora do padrão — `ritual/RitualKit.tsx:152-158` (fecha folha, não atividade?), `DailyReportModal.tsx:397` (dispensar, aceitável), `games/GameKit.tsx:130-141` (sair do jogo = atividade, aceitável), `GamePopups`/`ConfirmDialog` não auditados |
| I4 | Ilustração própria dos BITS | **arte** | ⚠️ | `ui/BitsIcon.tsx:15,28` (glob de `assets/icons/bits.png`) | Moeda SVG interina montada (`ShopShelf`, `MapPage`). Arte final = **ARTE do dono** (prompt 3; `entrada-dono/bits-icon` vazia) |
| I5 | Mercado: modalzinho + preview GRANDE solto; lightbox do fundo | cód | ✅ | `mercado/ShopItemSheet.tsx:49-86,143-215`; montado em `ShopShelf.tsx:393` | |
| I6 | Pílula interno/externo na decoração | cód | ✅ | `ShopItemSheet.tsx:124`; `ShopShelf.tsx:337` | |
| I7 | Torneio: treinamento testável | cód | ✅ | `TournamentPage.tsx:232-241,372-388,507-520` | Botão "Treinar" na aba Desafiar, local, sem Vínculo |
| I8 | Ícone da faixa maior; Missões = "!" | cód | ✅ | `TournamentPage.tsx:341,366`; `ui/NavGlyphs.tsx:586` | Indicador só aparece com `rank` carregado (precisa rede) |
| I9 | Duelo simplificado + "?"; Feira com "?" | cód | ✅ | `arena/DueloSheet.tsx:46-135`; `GuildSheet.tsx:892` | |
| I10 | Combate da Arena em TELA CHEIA, profundidade, HP nos pés, golpes do elemento, mais lento | cód | ✅ | `games/BattleStage.tsx:37,147,422`; `DuelScreen.tsx:182`; `ArenaGame.tsx:496`; `utils/combatFx.ts:90` (1,5 s/golpe); `_duel.js:62` (16 toques) | **Só Arena/Duelo.** Pesadelo (`NightmareBattle.tsx:442`) e Masmorra (`DungeonGame.tsx:417`) NÃO usam `BattleStage` → K1 |
| I11 | Lab › Árvore: pílulas com cor e ícone | cód | ✅ | `EvolutionPath.tsx:66-74,1285-1310` | Título "Evolution branches" (`:1255`) continua texto simples, sem cor/ícone |
| I12 | Emblemas fora do box e maiores | cód | ✅ | `PetPage.tsx:149-160,334-391` (grade solta, 64 px, 3 col.); montado `App.tsx:5509` | |
| I13 | VARREDURA: texto explicativo → "?" | cód | ⚠️ | `ui/InfoTip.tsx`; só 5 usos reais (`TournamentPage` ×3, `GuildSheet`, `DueloSheet`, `PetPage`, `TorcidaKit`) | Resto ainda em `sm2Hint` (ex.: `ConquistasSheet`, `ShopShelf` ×14, `SoulmonOnboarding` ×14, `AccountDataSection` ×16) → K6 |
| I14 | AUDITORIA do que ficou de fora | — | ⚠️ | este documento | Auditoria feita; pendências na seção final |

**Rodada 5: 14 itens — ✅ 10 · ⚠️ 4 (I3 parcial, I4 arte, I13 parcial, I14 em curso).** Nenhum ❌ de código.

---

## Rodada 6 (04/10/2026) — pedidos novos, NÃO implementados

| ID | Pedido | Tipo | Verif. | Estado atual no código | Obs. |
|---|---|---|---|---|---|
| K1 | Combate v2 (Arena/Torneio PvP, Pesadelo e Masmorra PvE): cena maior; ícone de TORCIDA lateral estilo Digimon 1 ("CHEER!"); barra de cheer demora a encher; Masmorra persiste a barra entre combates; PvE: mecânica ativa estilo Pokémon GO p/ especial e outra p/ reduzir dano; PvP: especial sai direto; batalhas bem mais longas; HP em cima do personagem + barra de ENERGIA (3 fatores: atacar, apanhar, cheer) que solta o ESPECIAL do elemento | cód | ⏳ | Base reaproveitável: `games/BattleStage.tsx` (só Arena/Duelo), `games/TorcidaKit.tsx`, `utils/torcida.ts` (`TORCIDA_PVE_TAPS_FULL`), `utils/combatFx.ts`, `functions/api/_duel.js` (regra PvP — servidor decide). Pesadelo e Masmorra têm layout próprio | Maior item. Mexe em regra do servidor (PvP) — fatiar |
| K2 | Refazer fundos do Laboratório e do Hall: revisar prompts aprovados e produzir novos | **arte**/dec | ⏳ | Prompts 6 e 7 existem em `PROMPTS-PARA-O-DONO.md`; `entrada-dono/05-bg-*` vazias; geometria já pronta (`areaLotGeometry.ts:36`) | Entrega = prompts; o dono gera a imagem |
| K3 | Rodadas de QA só de bug e correção | cód | ⏳ | — | Sem features novas |
| K4 | Exploração › Missões: "!" / "?" estilo WoW; 3 missões aleatórias/dia, escolhe 1; cada uma é um cenário; pontuação; influencia o Pesadelo (volta no dia seguinte com historinha) | cód+dec | ⏳ | Exploração só tem `masmorra` e `passeio` (`areaLotGeometry.ts:31-32`); "Missões" atual do Torneio = conquistas (`utils/missions`), outra coisa. Pesadelo: `NightmareBattle.tsx`; viagem noturna: `App.tsx:4128-4154` (`adventureOfNight`) | Definir/sugerir pontuação; decisão do dono |
| K5 | Prédios novos na Exploração: Pomodoro e outras técnicas; missão de journaling | cód+**arte**+dec | ⏳ | Nada no código (`grep pomodoro/journal` só acha `data/activityCatalog.ts`) | Cada prédio precisa de lote em `areaLotGeometry.ts` + arte do fundo/prédio |
| K6 | Varredura de texto explicativo → `InfoTip` | cód | ⏳ | Só 5 usos hoje (ver I13) | Exceto onboarding/termos/segurança |
| K7 | Corrida com o BOUNCING da Home (não de costas, estático); feedback de animação; modais de base sobem | cód | ⏳/✅ parcial | Corrida: `DinoGame.tsx:130` usa sprite estático; bounce da Home = squash em `CompanionHUD.tsx:1522` (`getSquashScale`). Modais sobem = **✅** (I2) | Só a parte da corrida/animação falta |
| K8 | Este checklist + verificador a cada rodada | proc | ✅ | `docs/CHECKLIST-MESTRE.md`; `.claude/agents/ajustes-verificador.md` | |

**Rodada 6: 8 itens — ⏳ 7 · ✅ 1 (K8). Dentro do K7, "modais sobem" já está ✅.**

---

## Fechamento da verificação (04/10/2026)

### Contagem por rodada
| Rodada | Itens | ✅ | ⚠️ | ❌ | ⏳/➖ |
|---|---|---|---|---|---|
| 1 | 72 | 69 | 2 | 1 | 0 |
| 3 | 25 | 23 | 1 | 0 | 1 (dispensado) |
| 4 | 14 | 13 | 1 | 0 | 0 |
| 5 | 14 | 10 | 4 | 0 | 0 |
| 6 | 8 | 1 | 0 | 0 | 7 |

### Regressões (item ✅ → ⚠️/❌)
Nenhuma encontrada nas rodadas 1–5. Atenção: H7 (r1) mudou de "item já ganho NÃO aparece na loja" para "aparece numa seção **Já são seus**" (`ShopShelf.tsx:380`) — decisão posterior, não é bug, mas contraria a letra do pedido H7; confirmar com o dono.

### Lista priorizada de ❌/⚠️
1. **Deploy (bloqueia tudo da r5)** — merge de `feat/r5-int` na `main` + build do APK. Sem isso o dono continua "não vendo" I1–I12.
2. **H4 — instalar o Pyraka entregue** (`entrada-dono/pyraka-rookie/kaelen-rookie.png` → `src/assets/soulmon/lines/kaelen-rookie.png` + derivados `icons/kaelen-rookie-32/64.png`). Arte já está com o dono feita; falta só o pipeline.
3. **I13 / K6 — varredura de "?"** — arquivos prováveis: `mercado/ShopShelf.tsx`, `mercado/MercadoSheets.tsx` (`idleLine`, "Como ganhar"), `SoulmonOnboarding.tsx:1574`, `AccountDataSection.tsx`, `PetPage.tsx`, `EvolutionPath.tsx`, `play/PasseioSheet.tsx`. Usar `ui/InfoTip.tsx`.
4. **I3 — auditoria de ✕ à direita** — `ritual/RitualKit.tsx:152-158`, `GamePopups.tsx`, `ConfirmDialog.tsx`, `EditModal.tsx`, `CreateModal.tsx`, `ContentModals.tsx`.
5. **I1 — risco reduced-motion** — `ui/TypewriterText.tsx:35`: avaliar se Android "remover animações" deve desligar a digitação (hoje desliga; pode explicar "não vi o texto digitando").
6. **I11 — título "Linhas de evolução"** sem cor/ícone — `EvolutionPath.tsx:1255`.
7. **I10 — estender a cena cheia a Pesadelo/Masmorra** (vira K1) — `NightmareBattle.tsx`, `DungeonGame.tsx`.
8. **H7 (r1)** — confirmar que "Já são seus" é aceito.

### O que é ARTE do dono (não é bug de código)
| Item | Prompt | Pasta de entrega (hoje vazia) |
|---|---|---|
| A1/logo | 4 | `entrada-dono/01-logo` |
| A1/mascote | 5 | `entrada-dono/02-mascote` |
| B3 r3 — moldura do "Evoluir" | 2 | `entrada-dono/evoluir-btn` |
| I4 — moeda Bits | 3 | `entrada-dono/bits-icon` |
| C6 — 5 humores | 8 | `entrada-dono/06-mood-folha` |
| H18/K2 — fundo do Hall | 6 | `entrada-dono/05-bg-hall` |
| H18/K2 — fundo do Laboratório | 7 | `entrada-dono/05-bg-laboratorio` |
| H4 — Pyraka rookie | 1 | **entregue**, só instalar |
| K5 — prédios novos da Exploração | a escrever | — |
