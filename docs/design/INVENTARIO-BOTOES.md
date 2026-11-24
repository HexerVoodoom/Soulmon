# Soulmon — Inventário de botões

> **Atualização 24/11/2026:** só as linhas C5 e C9 do plano de arte foram revistas. As contagens e a tabela por tela abaixo continuam as de 23/11, e as linhas de `sm2-guild-btn`, `sm2-chat-action-btn` e `sm3-mochila-usar-btn` descrevem classes que já saíram do CSS. Não reconferido por grep nesta consolidação.
>
> **Fase 3, lote 2 (24/11/2026, `guild/` e `mercado/`):** conferido botão a botão em `b7f4c57aa`: nenhum `<button` de ação cru sobrou. Restam 26, todos fora da regra do dono: células de jogo da Feira (`FeiraTrailPlay`), setas e ícones sem texto (`GroveVisor`, `PlantioVisor`, `GuildSheet` ajustes, copiar e compartilhar), hotspot (`GroveWalkers`), chips de moeda, cartões de prateleira e miniaturas ampliáveis (`mercado/`), `data-mission-go` (nome da missão como link), e 2 de teste. Os passos −/+ da Essência já usam `sm2Button('outline')`.
>
> **Dono:** squad de design (UI) · **Data:** 23/11/2026 · **Verificação:** levantamento estático por `git grep` e extração por script sobre a `origin/main` em `e9a4f12b9`; nada foi rodado nem visto em tela. Números de linha (`arquivo:L`) valem para esse commit e escorregam; o símbolo se reencontra por grep. Este doc fica em `docs/design/` (a regra "sem `arquivo:linha`" do `docsManual` vale só para `docs/manual/`).
>
> **Para que serve:** o [DESIGN-GUIDE §3.1](DESIGN-GUIDE.md) tem só categorias com contagem. Aqui está o inventário por tela/modal e a lista de arte a gerar, para responder "todos os botões do jogo estão mapeados?". Resposta curta: **os 700 `<button>` de produção estão listados (apêndice, 222 arquivos)**; só 15 usos de CTA e 16 de Especial têm arte; o resto (≈ 98% dos botões) é CSS/inline sem arte. Lacunas de inspeção na seção E.

## A. Metodologia e contagens

Fonte única: `git grep` e um script de extração (`<button` … `</button>`, `sm2Button(` no tag de abertura, `className`, `aria-label`, texto literal) sobre `src/` da `origin/main`, **excluindo `*test*`**. Rótulos que vêm por `t('chave')` ou por props (`label`, `actionLabel`) aparecem como chave ou ficam vazios: o inventário de rótulos **subestima**. Botões gerados em laço (`.map`) contam 1 vez (o código tem 1 `<button`).

| O que | Contagem (produção) | Observação |
|---|---|---|
| `<button` (linhas) | **700** em **222** arquivos `.tsx` (759 em 255 contando testes) | 31 arquivos de teste têm `<button` |
| `sm2Button(` chamadas | **410** em 136 arquivos (422 linhas em 139 com testes e definição) | 386 estão no tag `<button>`; 24 são spread/const/`<a>`/`<span>` |
| `sm2Button` por variante | `primary` 183 · `outline` 170 · `quiet` 28 · `ghost` 11 · dinâmica 27 (ternário/const) | tamanhos explícitos: `'sm'` 75, `'lg'` 8, `'md'` 1; o resto usa o padrão |
| Classe `sm2-kit-btn*` | 46 `<button` (45 `sm2-kit-btn`, 29 `-sm`, 11 `-md`; `-primary` 18, `-outline` 17, `-quiet` 7, `-ghost` 2) | `PixelButton` direto: 2 usos (`PlayCard`) |
| `CtaButton` | **15** usos em 14 arquivos | mais 3 `CtaTextButton` em 2 arquivos |
| `BotaoEspecial` | **16** usos em 8 arquivos | `ranking` 5, `pve` 4, `pvp` 4, dourado (padrão) 3 |
| `EscolhaLinha` | 6 usos em 3 arquivos (Torneio 2, Arena/`DueloSheet` 1, `Match3Escolha` 3) | `SortearNovos` 4 usos em 3 arquivos |
| `BackArrow` | 12 usos em 11 arquivos | internamente usa `BackCircleButton` |
| `BackCircleButton` | 11 usos em 9 arquivos | + o ✕ de aço da moldura (`AreaSheet`) |
| `ChevronAcao` | 2 usos em 2 arquivos | |
| `role="button"` | 0 em produção (só CSS `.sm2-splash[role="button"]` e 1 guarda em `TorcidaKit`) | botões acessíveis são `<button>` |
| `<a … className=…btn` | 0 | links de ação usam `<button>` ou `.sm2-corner-link` |
| Legado (`sm-btn`, `sm-btn-secondary`, `.sm2-pxbtn`, `retro-button`) | `sm-btn`: 2 (`App.tsx`), `sm2-pxbtn`: 1 (`EvolutionPath`), `retro-button`: 0 | |
| Classes locais com "btn/button" | 52 `<button` (`sm2-guild-btn` 10, `sm2-chat-action-btn` 4, `sm3-chatpanel-btn` 3, `sm3-mochila-usar-btn` 2, `sm3-material-btn` 2, `sm2-hex-equip-btn` 2, e 1 de cada: `sm2-guild-invite-btn`, `sm2-grove-walker-btn`, `sm2-evolve-btn`, `sm2-conta-head-btn`, `sm2-chat-btn`, `sm2-acc-btn`, `sm-game-card__btn`) | |
| Outros `<button>` sem `sm2Button` nem classe de botão | 216 | chips, abas, segmentos, switches, checkboxes, steppers, cartas-botão, tiles de mapa, toasts: **controles, não botões de ação** (categoria C11) |
| Modais/diálogos | `ModalSheet` 55 arquivos (61 usos) · `AreaSheet` 6 (10) · `ModalFrame` 5 · `ModalInfo` 12 arquivos (18) · `BlockedActionModal` 1 · 43 arquivos com `role="dialog"` | |

`<button` por área (soma 700): raiz de `components/` 343 (telas e modais históricos) · guild 63 · play 55 · mente 45 · mercado 29 · ui 20 · nav 18 · refugio 17 · perfil 17 · games 17 · pixel 15 · catalog 12 (9 já com `sm2Button`; 3 só-ícone: §534) · onboarding 11 · home 10 · hex 9 · form 7 · rift 6 · evolution 3 · ritual 1 · forge 1 · arena 1.

Legenda do apêndice: **P** primary · **O** outline · **Q** quiet · **G** ghost (todas `sm2Button`) · **P\*** `sm2Button` com variante dinâmica · **K** classe `sm2-kit-btn*` · **L** classe local de botão · **B** controle sem estilo de botão (chip/aba/ícone/cartão). Rótulo vazio = não extraído (vem de `t()`, prop ou só ícone).

## B. Tabela por tela e modal

Categorias (do DESIGN-GUIDE §3.1): **CTA** = CTA principal · **ESP** = Especial combate/ranking · **PAD** = padrão modal (`sm2Button`) · **KIT** = `sm2-kit-btn` · **LIN** = escolha de linha/sorteio · **VOL** = voltar/fechar · **ICO** = ícone de ação · **LOC** = local por tela · **LEG** = legado · **CTL** = controle (chip/aba/etc.). **Arte própria** hoje: *sim* (PNG/WebP por estado), *parcial* (glifo/disco sem fundo de botão), *não* (CSS/inline). Estados: N normal · H hover (só desktop) · Pr pressed · D disabled · Bu busy · Sel selecionado/equipado.

Em toda a tabela, **PAD = `sm2Button`**: estados reais N, Pr (`--sm2-btn`), D (`disabled` → surface-2/muted); H só por CSS; Bu só em `PixelButton`/`EscolhaLinha` (spinner `sync`); Sel não existe (usa `primary` no lugar de `outline`). **Arte: não.**

### B.1 Home e mochila (raiz + `home/`)

| Botão (PT / EN) | Onde | Cat. | Componente/classe | Estados | Arte |
|---|---|---|---|---|---|
| Alimentar / dormir / banho / cuidados (Acordar, Dormir) | `src/components/CompanionHUD.tsx:2198`, `:2215`, `:2231` | LOC | `sm3-cuidado` | N, D (cooldown) | parcial (glifos `icones-ui`: banho, dormir) |
| HP / energia (tocar na barra) | `CompanionHUD.tsx:2113`, `:2128` | LOC | `sm3-stat` | N | parcial |
| Tentar de novo / Evoluir assim | `CompanionHUD.tsx:2066`, `:2070` | PAD | `sm2Button` primary/outline sm | N, D | não |
| Balão dourado (seta) | `CompanionHUD.tsx:1932`, `:2318` | LOC/ICO | `sm3-balao` + `ChevronAcao` | N | parcial |
| Curar (rub-heal) | `CompanionHUD.tsx:1978`, `:1987` | LOC | `sm2-rub-heal` | N | não |
| Mochila: Usar / Ir lá | `src/components/home/Mochila.tsx:485`, `:464` | LOC | `sm3-mochila-usar-btn` | N, D | não |
| Mochila: ✕ fechar, item (`sm3-item`), material | `Mochila.tsx:306`, `:353`, `:401`, `:421` | VOL/CTL/LOC | `sm3-files-fechar`, `sm3-item`, `sm3-material-btn` | N, Sel | parcial |
| Fome (indicador), DungeonSign, Demo sair | `home/HungerIndicator.tsx:57`, `home/DungeonSign.tsx:54`, `home/DemoExitButton.tsx:34` | ICO/CTL | `sm3-hunger`, sem classe | N | parcial |
| Cantos da Home: Perfil, Correio, Avisos, Missões, Feedback, Som (demo) | `nav/CornerLink.tsx:31`, `nav/MailLink.tsx:22`, `nav/AvisosLink.tsx:25`, `nav/MissionsLink.tsx:30`, `nav/HomeFeedbackButton.tsx:40`, `perfil/DemoSoundButton.tsx:12`, `perfil/ProfileAvatarButton.tsx:20` | ICO | `sm2-corner-link` | N, Pr (scale .94), foco | parcial (glifos autorais) |
| Evoluir (botão grande da Home) | `src/components/pixel/EvolveButton.tsx:56` | LOC | `sm2-evolve-btn` | N, Pr | **sim** (`src/assets/icons/evoluir-btn.png`) |
| Rituais: Ver hoje / Montar o meu dia / Retomar / Ordem / Inverter | `DailyRituals.tsx:676`, `:379`, `:473`, `:613`-`:619` | CTL/PAD/VOL | `BackArrow` + `sm2Button` + chip | N, Sel | não (voltar = glifo) |
| Ritual: adicionar (+), editar, expandir | `pixel/RitualPanel.tsx:511`, `:526`, `:567`, `:366`, `:377`, `:400`; `pixel/RitualPanel.tsx:396` (`ChevronAcao`) | ICO/PAD | `sm3-add`, `sm2-ritual-edit` | N | parcial |
| Atalhos da tarefa: Adicionar (QuickAdd), Desfazer conclusão, adiar (`TaskMeta`) | `QuickAddBar.tsx:101`, `CompletionTag.tsx:50`, `TaskMeta.tsx:136` | ICO/LOC | sem classe | N | não |
| Chat: ações Agora não / Salvar nome / Editar / Criar | `ChatActionCard.tsx:61`-`:73` | LOC | `sm2-chat-action-btn` | N, Sel (`-primary`) | não |
| Chat: fechar / meia tela / tela cheia | `ChatPanel.tsx:111`, `:116`, `:127` | ICO/VOL | `sm3-chatpanel-btn` | N | parcial |
| Pet: escolher forma (`PetPage`), Luz (Apagar a luz) | `PetPage.tsx:391`, `PetStageDecor.tsx:236` | CTL | sem classe | N, Sel | parcial |

### B.2 Tarefas, check-in, hábitos, diários (modais corriqueiros, raiz)

| Botão | Onde | Cat. | Obs. |
|---|---|---|---|
| Salvar / Cancelar / Excluir (editar tarefa) | `TaskEditModal.tsx:105`, `:108`, `:114`; `EditModal.tsx:119`, `:122`, `:130` | PAD | Excluir = `quiet` com cor `--sm2-danger-ink` (perigo improvisado) |
| Criar tarefa (Cancelar/Criar, Adicionar passo, remover passo) | `CreateModal.tsx:595`, `:597`, `:356`, `:369`, `:691` | PAD/ICO | `ghost` sm; remover = ícone `close` |
| Fazer (check-in), Commit/Definir, Hoje não | `CheckInSheet.tsx:52`, `MorningCheckIn.tsx:456`, `:462`, `:323` | PAD | |
| Confirmar / Hoje não, obrigado (metas do dia) | `DayGoalsModal.tsx:102`, `:106` | PAD | |
| Entendi / Ótimo / OK (avisos) | `BonusTaskIntroModal.tsx:31`, `FirstTaskCompletedPopup.tsx:60`, `EvolutionStatsModal.tsx:34`, `DungeonReturnModal.tsx:53`, `EvolveTaskModal.tsx:91`, `TermsUpdateBanner.tsx:65`, `GoodDream.tsx:63`, `BalanceWeekModal.tsx:150` | PAD | **9+ cópias do mesmo "Entendi"** |
| Agora não / Instalar / Atualizar / Avaliar | `InstallPrompt.tsx:89`, `:92`; `AppUpdateGate.tsx:48`, `:49`; `PlayReviewModal.tsx:17`, `:18`; `NewReadingModal.tsx:72`, `:83`; `MealInviteCard.tsx:44`, `:47`; `ProtectProgressModal.tsx:61`, `:73` | PAD | par primary+outline |
| Passos: Aceitar/Recusar convite, meta de passos | `StepsInviteModal.tsx:52`-`:65`, `StepsCard.tsx:89`-`:133`, `StepGoalModal.tsx:20` | PAD/CTL | |
| Adiar/Decompor/Encolher/Deixar pra lá | `PostponeNudgeSheet.tsx:111`, `:161`, `:190`, `:207`, `:232` | CTL/PAD | 5 `<button>`, só 1 com `sm2Button` |
| Retrospectiva semanal (Toque para ver, CTA) | `WeeklyRetroModal.tsx:222`, `:226` (`CtaButton`), `:323` (`CtaButton fillMs`), `:281` | CTL/**CTA** | **CTA com arte** |
| Relatório diário | `DailyReportModal.tsx:325`, `:377`, `:397`, `:504` | PAD/CTL/VOL | |
| Diário de aventuras / Caderno | `AdventureDiary.tsx:80`, `:139`; `play/CadernoSheet.tsx:123`-`:183` (Guardar, Apagar tudo, Voltar, Mostrar menos, lixeira) | VOL/PAD | |
| Descanso/Jornada (Seguir, Concluir a missão, Sair) | `play/RestRoom.tsx:105`-`:107` | **CTA**/CTA texto | arte sim (CTA) |

### B.3 Mercado e Decoração (`mercado/`, loja)

| Botão | Onde | Cat. | Obs. |
|---|---|---|---|
| Comprar / Confirmar / Cancelar (prateleiras) | `mercado/ShopShelf.tsx:564`, `:567`, `:642`, `:705`, `:736` (Comprar Créditos), `:798`; `mercado/FrameShelf.tsx:58`, `:67`; `mercado/MercadoSheets.tsx:368`, `:377`, `:527` | PAD | |
| Resgatar (missão/semanal) | `mercado/MercadoSheets.tsx:317`, `nav/MissionCard.tsx:141` | PAD | |
| **Comprar / Equipar / Tirar (item de loja)** | `mercado/ShopItemSheet.tsx:192` (`data-item-primary`: rótulo muda por estado) | PAD | 1 botão, 3 rótulos; **sem estado "equipado" visual** |
| Essência: − / + / Cancelar / Comprar | `mercado/EssenceBuySheet.tsx:59`, `:76`, `:84`, `:85` | ICO/PAD | stepper |
| Restaurante: Cozinhar | `mercado/RestauranteSheet.tsx:139` | PAD | |
| Moldura de widget: Usar / Confirmar / Comprar | `WidgetFramePicker.tsx:89`-`:126` | PAD | |
| Chips de moeda/categoria, cartões da prateleira | `mercado/MercadoSheets.tsx:78`, `mercado/ShopShelf.tsx:364`, `mercado/SubscriptionShelf.tsx:86`, `:115`, `:140`, `mercado/GuildOwnedShelf.tsx:73`, `:90` | CTL | cartão-botão |
| Pagar assinatura / Planos | `SubscriptionSection.tsx:114`, `UnlockAccountModal.tsx:142`-`:167`, `RevealContaNaoPaga.tsx:18` | PAD | |
| Ingressos: Comprar (BotaoEspecial) | `play/TicketBuyModal.tsx:73`, `:77`; `play/TicketFan.tsx:132` | **ESP** (dourado) + PAD | arte sim no ESP |

### B.4 Games / minigames (`play/`, `games/`, `mente/`, `refugio/`, raiz)

Entrada comum: `MinigameModeGate` (`play/MinigameModeGate.tsx:66` Ranking, `:75` abas, `:96`/`:97` modo (radios ESP `pve`/`pvp`), `:101`/`:102` escolher modo, `:106`/`:109` fallback `outline`/`primary` `lg` quando a arte do modo não vale, **`:116` `data-gate-play` "Jogar / Play" = `sm2Button('primary', false, 'lg')`**, sem arte). `PlayCard.tsx:165` "Brincar / Play" = `PixelButton` lg primary (**KIT**, sem arte). Cartão do jogo: `play/GameCard.tsx:58` (`sm-game-card__btn`, arte do **CardFrame**, não de botão). Fim de partida: `games/ResultScreen.tsx:515` (Jogar de novo, `data-result-again`, `P` + ícone/arte do jogo), `:524` (Voltar/Home, `O`). Sair no meio: `games/GameKit.tsx:214`/`:215` (Sair/Ficar), `games/BattleStage.tsx:1272`-`:1280` (idem), `games/GameKit.tsx:151` (`BackCircleButton`).

| Jogo | Botões (PT) | Onde | Cat. |
|---|---|---|---|
| Match-3 / Elemental Fusion | Aventura (`pve`) / PVP (`pvp`), Regras, Mirar em, Tentar de novo, escolha de inimigo (`EscolhaLinha` 3×, `SortearNovos`) | `Match3Game.tsx:1310`, `:1312`, `:934`, `:869`; `play/Match3Escolha.tsx:77`, `:95`, `:114`, `:142`, `:160` | ESP + LIN + PAD |
| Corrida com obstáculos | Pular / Dash (os dois grandes), escolha 1/2 | `DinoGame.tsx:733`, `:743`, `:692` | PAD `lg` (disabled fora de `playing`) |
| Pedra-papel-tesoura | 3 mãos, Cancelar/Jogar | `RPSGame.tsx:202`, `:205`, `:263` | PAD `lg` + CTL |
| Soul Barrage | Especial, mover lado, Começar | `SoulBarrage.tsx:354`, `:375`, `:407` | PAD |
| Pesadelo | Encarar o pesadelo, 3 ações | `NightmareBattle.tsx:455`-`:492` | LOC |
| Mente (minijogos) | **Começar**, Sair, Jogar de novo, Próxima/Outros, Desfazer, Limpar, Mostrar resposta, Lembrei/Ainda não (Revisão), Pular / Entendi, jogar (tutorial) | `mente/BolhasGame.tsx:265`-`:293`, `EcoGame.tsx:277`, `PatchesGame.tsx:325`-`:333`, `PicrossGame.tsx:248`-`:446`, `RevisaoGame.tsx:156`-`:331`, `SeloGame.tsx:170`, `:183`, `TrocaGame.tsx:181`-`:242`, `ZipGame.tsx:272`-`:284`, `MindTutorial.tsx:142`, `:143`, `:185` | PAD (45 botões; padrão repetido: Começar/Sair/De novo) |
| Refúgio (respirar) | Começar, Sair, De novo, Terminar, Entendi, modo olhos fechados, Hoje não / Respirar com o Soulmon | `refugio/RespiracaoGame.tsx:152`-`:250`, `refugio/ChamaGame.tsx:203`-`:290`, `refugio/RefugeInviteCard.tsx:40`, `:43` | PAD |
| Oficina de Foco (jornada) | Começar jornada (**CTA** `acao`), Voltar ao descanso / à jornada, modo, Refazer, Fechar; Pegar a chave, Próxima etapa, Salvar sessão, Pular, Cancelar; prioridades (Salvar, Tirar a classificação); tarefa (Começar, Criar) | `play/FocusBoard.tsx:240` (CTA), `:222`-`:293`; `play/OficinaPlano.tsx:60`-`:235` (12); `play/OficinaPrioridades.tsx:42`-`:85`; `play/FocusTaskPicker.tsx:42`-`:60`; `play/JourneyScreen.tsx:183`-`:197` (5 ícones); `play/RogueKeyGate.tsx:19` (CTA) | CTA + PAD + CTL |
| Passeio / Travessias | Escolher esta, Feito hoje, Registro, Continuar/Olhar/Voltar para casa/OK, Feito (linha de missão) | `play/PasseioSheet.tsx:152`, `:232`, `:263`; `StrollScene.tsx:157`-`:170`; `nav/StrollQuestLine.tsx:59` | PAD |
| Rift / Dungeon / Fenda | Entrar no Rift, Ver o mapa; Descer/sem volta (`RiftMap`); Ver a descida / Retirar da Fenda; Usar Coraçãozinho / Não usar; ocupado (Ir à Fenda, Trazer de volta, Deixar lá, Entendi); poções (Menos/Mais/Todas, Deixar e sair); Continuar | `play/PlaySheets.tsx:192`, `:196`; `rift/RiftMap.tsx:121`-`:213`; `DungeonGame.tsx:900`-`:1144`; `DungeonBusyModal.tsx:75`-`:90`; `DungeonPotionsModal.tsx:28`-`:46`; `RogueFight.tsx:196`-`:212`; `RogueDungeon.tsx:103`-`:339`; `play/PlaySheets.tsx:150` (Ranking, **ESP**) | PAD + ESP |
| Boss / drop / cura | OK do boss, OK do drop, Próximo (cura), Torcer! | `games/BossSplash.tsx:83`, `games/DropNotice.tsx:70`, `games/ArenaCuraModal.tsx:47`, `games/TorcidaKit.tsx:279` | PAD |
| Batalha (visor) | Alvo, Avanço rápido, carga, Alvo aliado | `games/BattleStage.tsx:1163`, `games/BattleSpeed.tsx:41`, `games/AlvoAliadoMarca.tsx:39` | CTL |

### B.5 Arena e Torneio

| Botão (PT / EN) | Onde | Cat. | Componente | Estados | Arte |
|---|---|---|---|---|---|
| **Lutar / Fight** (cada adversário da Arena aberta; 1 por linha, `data-arena-card-fight`) | `src/components/arena/DueloSheet.tsx:117` → `src/components/ui/EscolhaLinha.tsx:48` | LIN (botão = `primary` sm, `minWidth` 88) | `EscolhaLinha` | N, D, Bu (spinner) | **não** (card da linha e botão são CSS/inline) |
| **Sortear de novo · N grátis / custo (Draw again)** | `DueloSheet.tsx:131` → `ui/EscolhaLinha.tsx:70` | LIN (outline, largura cheia) | `SortearNovos` | N, D (sem Bits) | não |
| **Comprar convites / Buy invites** (+ custo de energia) | `DueloSheet.tsx:158` | **ESP** dourado | `BotaoEspecial` | N, Pr, D (arte por estado) | **sim** |
| Tentar de novo (erro de carga) | `DueloSheet.tsx:92` | PAD | `sm2Button` outline | N | não |
| Torneio: **Desafiar / Fight** (adversário e Soulmon desgarrado) | `TournamentPage.tsx:1007`, `:1029` | PAD primary sm | `sm2Button` | N, D | não |
| Torneio: escolha de adversário (Ranqueada/Treino) | `TournamentPage.tsx:1055`, `:1165` (`EscolhaLinha`), `:1079`, `:1182` (`SortearNovos`) | LIN | | | não |
| Torneio: abas Ranqueada / Treino | `TournamentPage.tsx:953`, `:954` | **ESP** (`pvp`/`pve`, `role="radio"`) | `BotaoEspecial` | N, Pr (selecionado = pressed), D | **sim** |
| Torneio: Ver ranking / Ranking inteiro | `TournamentPage.tsx:867`, `:1307`; `RankingPanel.tsx:58` | **ESP** `ranking` | `BotaoEspecial` | N, Pr, D | **sim** |
| Torneio: Comprar ingresso, Moldura, Continuar, Tentar de novo | `TournamentPage.tsx:1118`, `:1281`, `:1349`, `:1376`, `:976`, `:1045`, `:1137`, `:1152`, `:1212` | PAD | | | não |
| Torneio: voltar dos níveis | `TournamentPage.tsx:222` | VOL | `BackCircleButton` | N, Pr | parcial (glifo) |
| Fechar (RankingModal) | `RankingModal.tsx:47` | VOL | `sm3-ranking-fechar` | N | não |
| Duelo de amizade / treino | `FriendTraining.tsx:94`, `LibraryPage.tsx:482` (Convidar), `:575`/`:578` (Aceitar/Recusar) | PAD | | | não |

### B.6 Guilda / Clan War / Bosque (`guild/`)

| Botão | Onde | Cat. | Obs. |
|---|---|---|---|
| Entrar na guilda (**CTA**), Tentar de novo (CTA texto) | `guild/GuildSheet.tsx:499`, `:506` | **CTA** + CTA texto | arte sim |
| Ações da guilda (Entrar, Criar, Sair, Convidar, Renomear, Código novo, Copiar, Compartilhar, Doar, Tirar/Escolher da casa, Missão, Defesa) | `GuildSheet.tsx:508`-`:1454` (22 `<button>`) | LOC (`${btn}` = classe local `sm2-guild-btn`) / KIT `-md`/`-sm` | **a maior família local (10 `sm2-guild-btn`)**; sem arte |
| Convidar amigo (guilda) | `guild/GuildInviteSheet.tsx:68` | LOC | `sm2-guild-invite-btn` |
| Procurar clã / pedir / aceitar / recusar | `guild/ClaProcurar.tsx:87`-`:258` | LOC | |
| Plantio: Plantar / Regar / Colher / Lutar (defesa) / Entrar na cena | `guild/PlantioVisor.tsx:177`-`:295` | LOC/KIT | |
| Praça: Tirar / Trocar / Abrir / Doar | `guild/PracaVisor.tsx:121`-`:204` | KIT sm | |
| Bosque: setas, passeadores | `guild/GroveVisor.tsx:177`, `:182`, `guild/GroveWalkers.tsx:104` | ICO/LOC | `sm2-grove-seta`, `sm2-grove-walker-btn` |
| Boss / Feira / Trilha (Atacar, Começar, Resgatar, Fechar, Enviar, Reset, Esquerda/Direita) | `guild/FeiraEventoSheet.tsx:250`-`:256`, `guild/FeiraTrailPlay.tsx:42`-`:246`, `guild/BossCheerPrelude.tsx:72` (Ir!), `guild/GroveRaidFight.tsx:168` | PAD | |
| Loja da Feira: Comprar / Fechar | `guild/FeiraLojaSheet.tsx:181`, `:229`, `:249` | PAD | |
| Buffs: Renovar / Comprar | `guild/GuildBuffs.tsx:39` | KIT sm | |
| Mercenários: Pegar a missão / Decidir depois / Sim, fiz / Ainda não | `MercGuildSheet.tsx:73`-`:87` | PAD | |

### B.7 Hexsmith, Soulsmith/Forja, Vesca, Elementos

| Botão | Onde | Cat. | Estados | Arte |
|---|---|---|---|---|
| **Equipar / Equipado / Tirar (Desequipar) um Hex** (por linha de Hex possuído) | `src/components/hex/HexsmithSheet.tsx:319` (equipado; `data-state="equipped"`, mostra "Equipado" e, no hover/foco, "Tirar"), `:326` (idle "Equipar") | LOC | `sm2-kit-btn sm2-hex-equip-btn` | N, Pr, **Sel** (`data-state` idle/equipped), D | **não** |
| **Forjar** (rodapé do slot: "Forjar: Nome" + ícone + custo) | `HexsmithSheet.tsx:285` | PAD primary | N, D (recusa) | não (ícone `HEX_ART.forge`) |
| Slot do hexágono (Porta/portas), picker de Hex | `HexsmithSheet.tsx:185`, `:391`; `hex/HexRenameButton.tsx:23` | CTL/ICO | N, Sel | **parcial** (hexágono = arte da moldura; `btn-lapis`/`btn-chama` já existem em `src/assets/soulmon/hexsmith/` para Renomear) |
| Renomear (Salvar / Cancelar / Aplicar) | `hex/HexRenameModal.tsx:32`, `:35`, `:39` | PAD | N, D, Bu | não |
| Forja/Vitra: Aprimorar / Reforjar / Refazer / Confirmar / Cancelar / Fechar; opções de nível, custo | `ForgeCard.tsx:213`-`:428` (12), `forge/VitraMap.tsx:68` | KIT sm | N, D, Bu | não |
| Árvore de talentos (Refazer, Confirmar, − / +, Tirar ponto, nó) | `TalentTree.tsx:362`-`:491` (9), `TalentTreeEntry.tsx:47` (**CTA** abrir) , `:54` (Fechar) | KIT sm + CTA | N, D | CTA sim; resto não |
| Poção de elemento / Vesca (Fazer a poção, Depois), Poção criada, Prato feito | `ElementPotionSheet.tsx:90`-`:173`, `VescaPotionOffer.tsx:45`-`:59`, `PocaoCriada.tsx:33` (**CTA** OK), `PratoFeito.tsx:42` (**CTA** OK), `App.tsx:7974` (**CTA** abrir) | KIT/PAD/CTA | | CTA sim |
| Elementos novos (prev/próx, OK) | `ElementosNovosModal.tsx:86`, `:117`, `:121` (**CTA**), `:82` (`BackArrow icon=close`) | VOL/CTA | | CTA sim |
| Laboratório: campos, opções de base, essências | `ElementBaseSlots.tsx:40`-`:56`, `EssencesSection.tsx:36` | CTL | N, Sel | não |

### B.8 Drive/Dex, Centro de Evolução, Perfil/Bond, Cerimônias

| Botão | Onde | Cat. | Obs. |
|---|---|---|---|
| Caminho de evolução (Cancelar/Trocar, Sim degenerar, Sim revelar, Editar, Reset, ajustes) | `EvolutionPath.tsx:685`-`:1349` (15) | PAD + LEG (`sm2-pxbtn` em `:1072`) | |
| Formas alternativas (Degenerar / Equipar) | `evolution/FormasAlternativasSheet.tsx:77`, `:78` | PAD sm | |
| Nó de alma (SoulNode) | `evolution/SoulNode.tsx:137` | CTL | |
| Dex / Bestiário / Dex de elementos | `BestiaryCollection.tsx:47`, `:117`, `ElementDex.tsx:91` | CTL | |
| Cerimônias (Evolução, Marco, Recap, Guild marco) | `EvolutionCeremony.tsx:322`, `MilestoneCeremony.tsx:127`, `EvoRecapModal.tsx:86`, `guild/GroveMilestoneCeremony.tsx:85` | **CTA** | 4 `CtaButton` |
| Level up (tocar para continuar) | `LevelUpOverlay.tsx:266` | LOC | |
| Perfil (editar home, avatar, salvar, regenerar aparência) | `perfil/EditHomeScreen.tsx:76` (`BackArrow`), `:160`-`:253`; `perfil/ProfileEditor.tsx:113`, `:155`; `perfil/RegenAparencia.tsx:101`-`:127`; `perfil/PerfilCardTile.tsx:33`; `ui/AvatarFrame.tsx:177`-`:192`; `ReviewSoulmonRow.tsx:83`-`:113` | PAD/CTL | |
| Biblioteca/amigos (Perfil de, Buscar, Convidar, Aceitar, Concluir) | `LibraryPage.tsx:149`-`:946` (13), `PlayerSearch.tsx:113` | PAD/CTL | |
| Correio | `MailboxSheet.tsx:131`-`:251` (13; Aceitar, Recusar, Assistir, Entrar no clã, **Resgatar**, Deletar, Apagar mesmo assim) | PAD sm | |
| Oráculo | `OraclePage.tsx:533`-`:1006` (5, `btnCls` local, algumas só debug) | LEG/LOC | `OraclePage` usa classes locais (`btnCls`) |

### B.9 Configurações, Conta, Backup, Legal

| Botão | Onde | Cat. |
|---|---|---|
| Entrar com Google, Exportar backup, Restaurar, Sair e apagar, Ficar na conta | `AccountSection.tsx:182`-`:241` | PAD |
| Apagar conta / Voltar / Voltar ao início | `AccountDataSection.tsx:297`-`:371` | PAD (destrutivo = outline, sem tom de perigo) |
| Restaurar backup: Escolher / Importar / Cancelar / Fechar | `RestoreBackupSection.tsx:106`-`:181` | PAD |
| Configurações: copiar, restaurar | `SettingsPage.tsx:254`, `:472`, `:492`; `form/FormKit.tsx:631`-`:766` (cabeçalho de seção, linha-switch) | LOC/CTL |
| IA (Padrão/Salvar), Feedback (Enviar), Créditos | `AISettingsModal.tsx:117`, `:120`; `FeedbackModal.tsx:69`, `:71`; `CreditsModal.tsx:129` | PAD |
| Consentimento / Termos / Aceitar e continuar | `ConsentGate.tsx:55`, `TermsUpdateBanner.tsx:65` | PAD |
| Erro: Recarregar | `ErrorBoundary.tsx:57` | PAD |
| Guia (capítulos) | `GuideModal.tsx:621` | CTL |
| Conta bloqueada / Desbloquear | `RevealContaNaoPaga.tsx:18`, `UnlockAccountModal.tsx:142`-`:167`, `UnlockNudge.tsx:91`, `WakeToEnter.tsx:56`, `:57` | PAD/KIT |
| GM (debug) | `GmPanel.tsx:85`, `:94`, `PixelizerCard.tsx:126` | LEG |

### B.10 Onboarding

| Botão | Onde | Cat. |
|---|---|---|
| Escolher idioma | `SoulmonOnboarding.tsx:1776`, `onboarding/intro/SeletorIdiomaAbertura.tsx:33` | PAD/CTL |
| Entrar com Google / DEMO / Continuar / Entrar / Assinar e gerar o meu / Agora não / Revelar / Gostei / Me deixa tentar de novo / Voltar ao início | `SoulmonOnboarding.tsx:1909`-`:2730` (20) | PAD |
| Voltar (setas) | `SoulmonOnboarding.tsx:1825`, `:1807` | VOL |
| Ovo: Chocar, Conhecer o seu Soulmon, "Me empreste um Soulmon guia" | `OnboardingOvo.tsx:112`, `:168`-`:178`, `ChocarBB.tsx:74`, `:112` | PAD |
| Tutorial (Começar, sugerir com IA, Tarefa única/Hábito, Começar) | `GameTutorialFlow.tsx:248`-`:444` (7) | PAD |
| Tour (Pular / Voltar / Vamos lá), Prompt de boas-vindas | `WelcomeTour.tsx:50`-`:95`, `WelcomePromptModal.tsx:167`, `:171` | PAD |
| Etapas do duelo/tarefa (Atacar, Sim fiz, Ainda não) | `onboarding/etapas/EtapaDuelo.tsx:87`, `EtapaTarefa.tsx:52`-`:60`, `EtapaAlimentar.tsx:71` | LOC |
| Intro (Pular), sequência | `onboarding/intro/IntroCinematica.tsx:152`, `:158`, `onboarding/sequencia/SequenciaPlayer.tsx:13`-`:129`, `NpcSequence.tsx:91`, `:156` | LOC |
| Beta fechado | `BetaClosedScreen.tsx:57` | LOC |
| Catálogo (continuar, adicionar, convite de nível) | `catalog/CatalogOnboardingFlow.tsx:108`, `:117`; `catalog/CatalogMindNotice.tsx:44`, `:95`; `catalog/CatalogBrowserModal.tsx:121`-`:208`; `catalog/CatalogLevelInviteModal.tsx:40`-`:66` | PAD |

### B.11 Navegação, mapa e área

| Botão | Onde | Cat. | Arte |
|---|---|---|---|
| ✕ da moldura de aço | `nav/AreaSheet.tsx:254` (`sm2-moldura-aco__fechar`) | VOL | **parcial** (disco da arte da moldura) |
| Voltar da área/folha (`BackCircleButton`) | `nav/AreaSheet.tsx:120`, `:211`; `nav/AreaTopBar.tsx:91`; `nav/GuildaMapPage.tsx:93` | VOL | parcial (glifo) |
| Abas da área | `nav/AreaView.tsx:356` | CTL | não |
| Pontos do mapa (tiles de prédio/NPC) | `nav/AreaScene.tsx:126`, `:243`; `nav/MapPage.tsx:36`, `:155`; `nav/GuildaMapPage.tsx:68`, `:123` | LOC | arte do prédio (cenário), não de botão |
| Cartão de missão (Resgatar) | `nav/MissionCard.tsx:92`, `:141` | PAD | não |
| Pílula/Link de canto | `nav/CornerLink.tsx:31` (+5 variantes) | ICO | parcial |
| Voltar genérico (`BackArrow`) | `ui/BackArrow.tsx:50` | VOL | glifo |
| Toasts clicáveis | `NoticeToast.tsx:62`, `UnlockToast.tsx:41` | CTL | não |
| Skeleton: Tentar de novo | `ui/ScreenSkeleton.tsx:70` | PAD | não |

## C. Resumo por categoria e lista de arte a gerar

Contagem aproximada de `<button>` por categoria (sobre os 700; uma linha pode pertencer a 2 categorias, então os números não somam exatamente): **PAD ≈ 386**, **KIT 46 (+2 `PixelButton`)**, **LOC 52**, **CTL ≈ 216** (inclui ícones sem classe), **CTA 15 usos**, **ESP 16 usos**, **LIN 6 + 4**, **VOL 12 + 11 + ✕ aço + ≈ 14 ícones de fechar**, **LEG 3-8**.

Direção de consolidação: os ≈ 25 estilos locais viram **uma única família "Padrão modal"** com 3 tons, mais "linha" (card), "ícone de ação" e "controles". Só existem hoje CTA e Especial como arte.

| # | Categoria | Estado | Conjunto mínimo de arte a gerar | Arquivos |
|---|---|---|---|---|
| C1 | CTA principal (`CtaButton`) | **tem** (`btn-cta`, `-hover`, `-press`, `-off`) | nada novo; opcional `busy` (preenchimento já é `fillMs`) | 0 |
| C2 | CTA de texto | n/a | nada | 0 |
| C3 | Especial (`BotaoEspecial`: dourado, pve, pvp, ranking) | **tem** (3 estados por variante, 12 arquivos) | opcional: hover desktop ×4 | 0 (4 opcionais) |
| C4 | **Padrão modal** (`primary`/`outline`/`quiet`/`ghost`): 183+170+28+11 usos | **não** (CSS/inline; revogado em 22/11, vai ganhar arte, P6) | 9-slice **primary** (turquesa/cobre), **outline** (aço/borda cobre, miolo escuro), **perigo** (para Excluir/Apagar conta, hoje `quiet` com cor); cada um em N, Pr, D = **9**; `quiet`/`ghost` ficam só texto (sem arte); `sm`/`md`/`lg` reaproveitam o mesmo 9-slice (altura 44/48/56 por token, não por arquivo); spinner de `busy` = glifo `sync` já existente | 9 (+3 hover opcionais) |
| C5 | `sm2-kit-btn` / `PixelButton` (24/11: 5 arquivos, 16 ocorrências; eram 46 + 2 em 23/11, o resto migrou para `sm2Button` nos #1174, #1175, #1182, #1183) | **não** | migrar o que sobra para C4 (zero arte própria) | 0 |
| C6 | Escolha de linha + Sortear (Arena, Torneio, Match-3) | **não** | 9-slice do **card da linha** (`escolhaCardStyle`) N + Pr (linha tocável) = **2**; o botão "Lutar/Fight" = C4 primary sm; "Sortear de novo" = C4 outline | 2 |
| C7 | Voltar/fechar | glifo + disco da moldura de aço | disco do `BackCircleButton` (N, Pr, D) = **3**; glifos `arrow_back`, `close`, `chevron` já autorais (39 glifos) | 3 |
| C8 | Ícone de ação / canto (`sm2-corner-link`, steppers −/+, `sm3-*` ícones) | parcial | fundo 44×44 (quadrado de cantos ou disco) em N, Pr, D = **3**; os glifos são os 39 existentes | 3 |
| C9 | Locais por tela (≈ 25 classes em 23/11; `sm2-guild-btn`, `sm2-chat-action-btn` e `sm3-mochila-usar-btn` JÁ SAÍRAM do CSS em 24/11) | **não** | migrar o que resta: `sm2-deck-btn`, `sm3-material-btn`, `sm2-evolve-btn` etc. → C4 sm (`sm2-hex-equip-btn` e `sm2-guild-invite-btn` ficam como classes locais); pendentes: `App.tsx` `sm-btn` ×2, `sm3-ranking-fechar`, `btnCls` do PixelizerCard. Única arte nova: tom **equipado/selecionado** (Hex "Equipado", chips ativos, "Já é amigo") em N, Pr = **2** | 2 |
| C10 | Legado (`sm-btn`, `sm2-pxbtn`, debug do Oráculo) | **não** | aposentar; zero arte | 0 |
| C11 | Controles (chip, aba, segmento, switch, checkbox, cartão-botão): ≈ 216 `<button>` | **não** | chip (off/on/D) 3; aba (off/on) 2; segmento (off/on) 2; switch (trilho off/on + botão) 3; checkbox (off/on) 2 = **12** | 12 |
| C12 | Toast clicável (`NoticeToast`, `UnlockToast`) e cartão-botão de loja/jogo | **não verificado** (o cartão do jogo usa `CardFrame`, que tem arte) | moldura de toast 9-slice N, Pr = **2** | 2 |

**Total proposto: 33 arquivos obrigatórios** (C4 9 + C6 2 + C7 3 + C8 3 + C9 2 + C11 12 + C12 2) **+ 7 opcionais** (hover: C3 ×4, C4 ×3). Todas as artes: 9-slice com insets fixos para permitir altura 44–56 e largura livre; tons claro/escuro lidos de tokens (o tema escuro é o canônico, o claro precisa de paridade). Tamanhos de referência: alvo ≥ 44 (`alvo44.test.tsx`), `sm` 44 · `md` 48 · `lg` 56.

Ordem sugerida pelo retorno: **C4 primeiro** (cobre ≈ 386 botões e os modais pequenos da seção D), depois C6 (Arena/Torneio/Match-3), C7/C8, C9, C11, C12.

## D. Modais e popups pequenos e corriqueiros fora de componente padrão

Quase todos usam `sm2Button` direto dentro de `ModalSheet`/`div` próprio. Só 15 usos de `CtaButton` e `BlockedActionModal` (classe `sm2-kit-btn-primary`) fogem disso. Rótulos literais PT achados por extração (subestima os que vêm de `t()`): **Cancelar 17, Continuar 14, Entendi 9, Agora não 11, Confirmar 11, Voltar 11, Tentar de novo 11, Salvar 8, Sair 9, Começar 9, Excluir/Apagar/Deletar 9, Hoje não 3, Pular 6, De novo/Jogar de novo 6, Comprar 5, Aceitar/Recusar 6, Resgatar 4, Equipar/Tirar 4, OK/Ótimo 2**.

| Popup/modal | Onde | O que usa hoje | Candidato a |
|---|---|---|---|
| Confirmação genérica (Cancelar/Confirmar, destrutivo = outline) | `ConfirmDialog.tsx:46`, `:49` | `sm2Button` | **ConfirmDialog único + tom perigo (C4)** |
| Sair do jogo? (Sair/Ficar) | `games/GameKit.tsx:214`, `:215`; `games/BattleStage.tsx:1272`-`:1280`; `play/MinigameModeGate.tsx` | `sm2Button` (3 cópias do mesmo par) | `ConfirmDialog` |
| Aviso "Entendi / Ótimo / OK" (≥ 9 cópias) | ver B.2 e `games/DropNotice.tsx:70`, `games/BossSplash.tsx:83`, `ui/BlockedActionModal.tsx:23` | `sm2Button` / `sm2-kit-btn-primary` | `AvisoModal` único (1 botão C4 primary) |
| Convite "Agora não / ação" (≥ 8 pares) | `InstallPrompt.tsx`, `AppUpdateGate.tsx`, `PlayReviewModal.tsx`, `NewReadingModal.tsx`, `MealInviteCard.tsx`, `ProtectProgressModal.tsx`, `WelcomePromptModal.tsx`, `DayGoalsModal.tsx`, `SoulmonOnboarding.tsx:2015`-`:2018` | `sm2Button` primary+outline | `ConviteModal` (par C4) |
| Ocupado/Fenda (4 variantes de 2 botões) | `DungeonBusyModal.tsx:75`-`:90` | `sm2Button` + `sm2-conta-two` | par C4 |
| Poções da Fenda (Menos/Mais/Todas) | `DungeonPotionsModal.tsx:44`-`:46` | `sm2Button` | stepper C8 |
| Toasts clicáveis | `NoticeToast.tsx:62`, `UnlockToast.tsx:41` | `<button role="status">` sem estilo de botão | C12 |
| Info "i" (`ModalInfo`/`InfoTip`) | `ui/InfoTip.tsx:118` | `sm2-info-hit` | C8 |
| Ingresso (Comprar/Agora não) | `play/TicketBuyModal.tsx:73`, `:77` | `BotaoEspecial` + `sm2Button` | misto (ESP + C4) |
| Torcer! (Arena/Torneio) | `games/TorcidaKit.tsx:279` | `sm2Button` outline | C4 outline |
| Backup, Conta, Apagar | `RestoreBackupSection.tsx`, `AccountDataSection.tsx` | `sm2Button`; destrutivo sem tom de perigo | C4 perigo |
| Ordem/Inverter/Ver hoje (rituais) | `DailyRituals.tsx:613`-`:676` | chip/`BackArrow` | C11 |
| Desfazer conclusão, Adicionar rápido | `CompletionTag.tsx:50`, `QuickAddBar.tsx:101` | sem classe | C8 |

## E. Lacunas (não inspecionado ou não conclusivo)

- **Visual e estados reais**: nada foi aberto em tela; "estados existentes" vêm do CSS/props, não de captura. Hover/foco/pressed só confirmados onde há `data-*` ou regra em `index.css` (CtaButton, BotaoEspecial, `sm2-corner-link`, `sm2-area-back`).
- **Rótulos via `t()` e props** (≈ 30% dos `<button>`: `guild.*`, `trail.*`, `boss.*`, `loja.*`, `label`, `actionLabel`): constam como chave/vazio no apêndice; texto final não resolvido.
- **Botões fora de `src/components/` e `App.tsx`**: não achei `<button` em `src/hooks`, `src/utils`; `functions/` (servidor), `desktop/` (Electron) e `public/` (HTML estático, site) **não foram inspecionados**.
- **Site e marketing** (`site*/`, landing) e **Admin/GM** (`admin`, `GmPanel` só listado): fora do escopo do app, não inventariados.
- **`<input type="button|submit">`, `<summary>` e elementos com `onClick` em `div`/`span`**: 882 linhas com `onClick` em `.tsx`; não classifiquei quais são `div` clicáveis (possível botão não-`<button>`). Vale um passe de a11y.
- **Texto exato e estados de**: `OraclePage` (classes locais `btnCls`), `CompanionHUD` (`sm2-rub-heal`), `Mochila` (`sm3-item`), `play/JourneyScreen` (5 ícones só `<path>`), `ChatBox.tsx:728`, `PetStageDecor`, `TriagePile.tsx:234`: rótulo/uso não confirmados.
- **Arte do `HEXSMITH_RENAME_ART`** (`btn-lapis`/`btn-chama`): arquivos existem; não verifiquei se o `find()` os resolve no build (o `index.ts` fala em "assim que existir").
- **Arte de toast e de card-botão da loja**: não verifiquei se existe moldura própria.
- **Dobras de contagem**: `BotaoEspecial` por variante foi contado por leitura dos 16 usos; `sm2Button` dinâmico (27) não tem variante conhecida.

## Apêndice — índice bruto por arquivo (700 `<button>`, gerado por script)

Formato: `arquivo (N): linha código rótulo; …`. Códigos na legenda da seção A.

- `src/components/AISettingsModal.tsx` (2): 117 Q Padrão; 120 P Salvar
- `src/components/AccountDataSection.tsx` (5): 297 O; 314 O; 338 O; 350 Q Voltar; 371 O Voltar ao início
- `src/components/AccountSection.tsx` (7): 182 P Entrando…; 200 O Restaurando…; 212 Q; 227 P Exportar backup; 230 O Tentar enviar de novo; 233 Q Sair e apagar daqui; 241 Q Ficar na conta
- `src/components/AdventureDiary.tsx` (1): 80 B Diário de aventuras
- `src/components/AppUpdateGate.tsx` (2): 48 O Depois; 49 P Atualizar
- `src/components/BalanceWeekModal.tsx` (3): 150 O Entendi; 188 O; 191 O
- `src/components/BestiaryCollection.tsx` (2): 47 L; 117 B
- `src/components/BetaClosedScreen.tsx` (1): 57 B
- `src/components/BonusTaskIntroModal.tsx` (1): 31 P Entendi
- `src/components/ChatActionCard.tsx` (4): 61 L Agora não; 65 L Salvar nome; 69 L Editar; 73 L Criar
- `src/components/ChatBox.tsx` (1): 728 L
- `src/components/ChatPanel.tsx` (3): 111 L; 116 L; 127 L
- `src/components/CheckInSheet.tsx` (1): 52 P Fazer
- `src/components/ChocarBB.tsx` (2): 74 B; 112 P Continuar
- `src/components/CityPicker.tsx` (1): 77 B
- `src/components/CompanionHUD.tsx` (11): 1621 B; 1932 B break-words; 1978 B; 1987 B; 2066 P; 2070 O; 2113 B; 2128 B; 2198 B; 2215 B Acordar; 2231 B
- `src/components/CompletionTag.tsx` (1): 50 B Desfazer
- `src/components/ConfirmDialog.tsx` (2): 46 O Cancelar; 49 B Confirmar
- `src/components/ConsentGate.tsx` (1): 55 P Aceitar e continuar
- `src/components/CreateModal.tsx` (5): 356 G; 369 B; 595 O; 597 P; 691 G
- `src/components/CreditsModal.tsx` (1): 129 B
- `src/components/DailyReportModal.tsx` (4): 325 P; 377 O Eu fiz, esqueci de marcar; 397 B; 504 B
- `src/components/DailyRituals.tsx` (7): 264 B Configurações; 379 O Montar o meu dia; 473 G Retomar; 613 B; 616 B; 619 B; 676 B Ver hoje
- `src/components/DayGoalsModal.tsx` (2): 102 P Confirmar; 106 O Hoje não, obrigado
- `src/components/DinoGame.tsx` (3): 692 P; 733 P Pular; 743 P
- `src/components/DungeonBusyModal.tsx` (7): 75 P Ir à Fenda; 76 O Trazer de volta; 80 O Deixar lá; 81 P Trazer de volta; 84 P Entendi; 87 O Deixar lá; 90 P Retirar da Fenda
- `src/components/DungeonGame.tsx` (5): 900 P Ver a descida; 903 O Retirar da Fenda; 1044 O Não usar; 1045 P Usar Coraçãozinho; 1144 P
- `src/components/DungeonPotionsModal.tsx` (4): 28 P Deixar e sair; 44 O; 45 O; 46 O Todas
- `src/components/DungeonReturnModal.tsx` (1): 53 P Ótimo
- `src/components/EditModal.tsx` (3): 119 O Cancelar; 122 P Salvar; 130 Q Excluir
- `src/components/ElementBaseSlots.tsx` (3): 40 B; 53 B; 56 B
- `src/components/ElementDex.tsx` (1): 91 B
- `src/components/ElementPotionSheet.tsx` (4): 90 K; 119 K; 140 K; 173 Q
- `src/components/ElementosNovosModal.tsx` (2): 86 B; 117 B
- `src/components/ErrorBoundary.tsx` (1): 57 P Recarregar
- `src/components/EssencesSection.tsx` (1): 36 B
- `src/components/EvolutionPath.tsx` (15): 685 O; 699 B; 937 O Cancelar; 940 O Trocar; 969 O Cancelar; 972 O Sim, degenerar; 996 O Cancelar; 999 P Sim, revelar; 1011 B; 1015 B; 1211 O; 1259 P; 1309 O; 1339 O; 1349 O
- `src/components/EvolutionStatsModal.tsx` (1): 34 P Ótimo
- `src/components/EvolveTaskModal.tsx` (2): 87 P Criar nova tarefa; 91 P Entendi
- `src/components/FeedbackModal.tsx` (2): 69 P; 71 P
- `src/components/FirstTaskCompletedPopup.tsx` (1): 60 P Entendi
- `src/components/ForgeCard.tsx` (12): 213 K Aprimorar; 234 K Reforjar; 267 K Refazer; 277 K Fechar; 344 K Cancelar; 346 K Confirmar; 350 K; 354 K Confirmar; 389 B; 399 B; 420 K Aprimorar; 428 K Reforjar
- `src/components/FriendTraining.tsx` (1): 94 O Fechar
- `src/components/GameTutorialFlow.tsx` (7): 248 B; 320 P Começar; 383 P*; 430 P; 439 P* Tarefa única; 440 P* Hábito recorrente; 444 P Começar
- `src/components/GmPanel.tsx` (2): 85 O Ir; 94 O
- `src/components/GoodDream.tsx` (1): 63 B Que bom!
- `src/components/GuideModal.tsx` (1): 621 B
- `src/components/InstallPrompt.tsx` (2): 89 P Instalar; 92 O Agora não
- `src/components/LevelUpOverlay.tsx` (1): 266 B Toque para continuar
- `src/components/LibraryPage.tsx` (13): 149 B; 482 P Já é amigo; 556 P !add; 575 P Aceitar; 578 O Recusar; 623 B; 656 B; 720 O; 753 B; 820 B; 921 B Concluir; 945 O Cancelar; 946 P Continuar
- `src/components/MailboxSheet.tsx` (13): 131 O; 135 P; 159 B; 187 P Aceitar; 189 O Recusar; 194 P Assistir; 199 P Entrar no clã; 201 O Recusar; 207 P Resgatar; 213 O Deletar; 234 P Resgatar; 236 Q Apagar mesmo assim; 251 P
- `src/components/Match3Game.tsx` (4): 791 O; 869 B; 934 B Regras; 1251 B
- `src/components/MealInviteCard.tsx` (2): 44 O Agora não; 47 P
- `src/components/MercGuildSheet.tsx` (4): 73 P Pegar missão; 76 O Decidir depois; 84 P Sim, fiz; 87 O Ainda não
- `src/components/MorningCheckIn.tsx` (4): 323 O; 365 B; 456 P Commit; 462 O Hoje não, obrigado
- `src/components/MorningDream.tsx` (2): 136 O Equipar; 140 P Bom dia!
- `src/components/NewReadingModal.tsx` (2): 72 P !pode; 83 O Agora não
- `src/components/NightmareBattle.tsx` (4): 455 B Encarar o pesadelo; 467 B; 483 B; 492 B
- `src/components/NoticeToast.tsx` (1): 62 B
- `src/components/NpcSequence.tsx` (2): 91 B; 156 B Pular
- `src/components/OnboardingOvo.tsx` (4): 112 B; 168 P Chocar; 174 P Conhecer o seu Soulmon; 178 B Me empreste um Soulmon gui
- `src/components/OraclePage.tsx` (5): 533 L 🔮 Refazer leitura; 902 L 🎲 Gerar outra variação; 943 B Gerar (debug); 955 B Prompts; 1006 B
- `src/components/PetPage.tsx` (1): 391 B
- `src/components/PetStageDecor.tsx` (1): 236 B
- `src/components/PixelizerCard.tsx` (1): 126 L Enviar imagem
- `src/components/PlayReviewModal.tsx` (2): 17 O Agora não; 18 P Avaliar
- `src/components/PlayerSearch.tsx` (1): 113 O Tentar de novo
- `src/components/PostponeNudgeSheet.tsx` (5): 111 B; 161 B; 190 P; 207 B; 232 B
- `src/components/ProtectProgressModal.tsx` (2): 61 P; 73 O Agora não
- `src/components/QuickAddBar.tsx` (1): 101 B
- `src/components/RPSGame.tsx` (3): 202 O; 205 P; 263 B
- `src/components/RankingModal.tsx` (1): 47 B
- `src/components/RebirthModal.tsx` (1): 158 P Renascendo…
- `src/components/RestSetupModal.tsx` (1): 81 P Confirmar
- `src/components/RestoreBackupSection.tsx` (6): 106 O Restaurar backup; 127 O Escolher; 150 O Importar arquivo; 153 Q Fechar; 172 O; 181 Q Cancelar
- `src/components/RevealContaNaoPaga.tsx` (1): 18 O Desbloquear a conta
- `src/components/ReviewSoulmonRow.tsx` (3): 83 O; 87 P; 113 P
- `src/components/RogueDungeon.tsx` (3): 103 B Voltar; 322 B; 339 B
- `src/components/RogueFight.tsx` (3): 196 O Não usar; 197 P Usar Coraçãozinho; 212 P Continuar
- `src/components/SettingsPage.tsx` (3): 254 P semUsos; 472 B; 492 O
- `src/components/SoulBarrage.tsx` (3): 354 P Especial; 375 O; 407 P Começar
- `src/components/SoulTestItem.tsx` (3): 88 B; 109 B; 129 B
- `src/components/SoulmonOnboarding.tsx` (20): 1730 B; 1776 P; 1909 P Entrar com Google; 1931 O; 1959 P Continuar; 2015 P Assinar e gerar o meu; 2018 O Agora não; 2046 P Entrar; 2114 P Continuar; 2145 P Continuar; 2187 P Continuar; 2213 P Voltar ao início; 2363 B; 2414 P Revelar meu Soulmon; 2502 B; 2523 O; 2566 P Gostei; 2570 O Me deixa tentar de novo; 2668 B; 2730 P Continuar
- `src/components/StepGoalModal.tsx` (1): 20 P*
- `src/components/StepRow.tsx` (2): 27 B; 29 B
- `src/components/StepsCard.tsx` (3): 89 O; 92 P; 133 P
- `src/components/StepsInviteModal.tsx` (3): 52 P; 62 O; 65 P
- `src/components/StrollScene.tsx` (4): 157 P Continuar; 162 P Olhar; 167 P; 170 P Voltar para casa
- `src/components/SubscriptionSection.tsx` (1): 114 P Abrindo a Google Play…
- `src/components/TalentTree.tsx` (9): 362 B; 399 K talent-respec; 414 K Agora não; 415 K Refazer; 466 K; 469 K; 481 K Tirar um ponto; 490 K Cancelar; 491 K Confirmar
- `src/components/TalentTreeEntry.tsx` (1): 54 B
- `src/components/TaskEditModal.tsx` (4): 105 O Cancelar; 108 P Salvar; 114 Q Excluir; 146 G
- `src/components/TaskMeta.tsx` (1): 136 B
- `src/components/TermsUpdateBanner.tsx` (1): 65 Q Entendi
- `src/components/TournamentPage.tsx` (12): 659 B; 976 O Tentar de novo; 1007 P Desafiar; 1029 P Desafiar; 1045 O Tentar de novo; 1118 O; 1137 O Tentar de novo; 1152 O Tentar de novo; 1212 O Tentar de novo; 1281 O; 1349 P Continuar; 1376 P Continuar
- `src/components/TriagePile.tsx` (1): 234 O
- `src/components/UnlockAccountModal.tsx` (3): 142 P; 159 O Agora não; 167 Q
- `src/components/UnlockNudge.tsx` (1): 91 B
- `src/components/UnlockToast.tsx` (1): 41 B
- `src/components/VescaPotionOffer.tsx` (3): 45 Q Depois; 46 P Fazer a poção; 59 P Fazer a poção
- `src/components/WakeToEnter.tsx` (2): 56 K; 57 K
- `src/components/WeeklyRetroModal.tsx` (2): 222 B Toque para ver; 281 B tarefa pontual
- `src/components/WelcomePromptModal.tsx` (2): 167 P; 171 O Agora não
- `src/components/WelcomeTour.tsx` (3): 50 Q Pular; 91 G Voltar; 95 P Vamos lá
- `src/components/WidgetFramePicker.tsx` (5): 89 O Usar; 108 O Usar; 116 P Confirmar; 120 P Comprar; 126 P Indisponível
- `src/components/arena/DueloSheet.tsx` (1): 92 O Tentar de novo
- `src/components/catalog/CatalogBrowserModal.tsx` (4): 121 B (só-ícone, fica cru); 148 B (só-ícone, fica cru); 196 P Adicionado; 208 O
- `src/components/catalog/CatalogLevelInviteModal.tsx` (4): 40 O; 43 O; 63 P Vamos!; 66 O Continuar assim
- `src/components/catalog/CatalogMindNotice.tsx` (2): 44 B (seta, fica cru); 95 P Adicionar
- `src/components/catalog/CatalogOnboardingFlow.tsx` (2): 108 P Continuar; 117 P Confirmar
- `src/components/evolution/FormasAlternativasSheet.tsx` (2): 77 O Degenerar; 78 O Equipar
- `src/components/evolution/SoulNode.tsx` (1): 137 B
- `src/components/forge/VitraMap.tsx` (1): 68 B
- `src/components/form/FormKit.tsx` (7): 258 B; 316 B; 516 B; 631 L; 674 B; 743 B; 766 B
- `src/components/games/AlvoAliadoMarca.tsx` (1): 39 B
- `src/components/games/ArenaCuraModal.tsx` (1): 47 P
- `src/components/games/BattleSpeed.tsx` (1): 41 B
- `src/components/games/BattleStage.tsx` (4): 1163 B; 1272 O; 1275 P; 1280 O
- `src/components/games/BossSplash.tsx` (1): 83 P
- `src/components/games/DropNotice.tsx` (1): 70 O
- `src/components/games/GameKit.tsx` (2): 214 O; 215 P
- `src/components/games/PveMechanics.tsx` (2): 106 B; 129 B
- `src/components/games/ResultScreen.tsx` (2): 515 P; 524 O
- `src/components/games/TorcidaKit.tsx` (2): 211 B; 279 O Torcer!
- `src/components/guild/BossCheerPrelude.tsx` (1): 72 P Ir!
- `src/components/guild/ClaProcurar.tsx` (5): 87 L; 105 L; 127 L guild.procurar.pedir; 254 L; 258 L
- `src/components/guild/FeiraEventoSheet.tsx` (4): 250 P boss.busy; 252 P trail.start; 254 P rest.claim; 256 O sheet.close
- `src/components/guild/FeiraLojaSheet.tsx` (3): 181 O Fechar; 229 P loja.buy; 249 P loja.buy
- `src/components/guild/FeiraMisterio.tsx` (1): 31 K
- `src/components/guild/FeiraTrailPlay.tsx` (9): 42 O trail.reset; 43 P !!busy; 76 B; 101 B; 134 B; 173 B; 194 O game.left; 195 O game.right; 246 B
- `src/components/guild/GroveRaidFight.tsx` (1): 168 P Continuar
- `src/components/guild/GroveVisor.tsx` (2): 177 B; 182 B
- `src/components/guild/GroveWalkers.tsx` (1): 104 L
- `src/components/guild/GuildBuffs.tsx` (1): 39 K
- `src/components/guild/GuildInviteSheet.tsx` (1): 68 P* !ativo
- `src/components/guild/GuildSheet.tsx` (22): 508 L; 539 L; 553 L; 582 L; 714 B; 751 L guild.ajustes.renomear.sal; 760 L guild.ajustes.codigoNovo; 778 B; 788 B; 803 L guild.convidar.botao; 876 L; 1018 K; 1047 K; 1063 K; 1113 K guild.casa.doar.botao; 1135 K; 1146 K inventory_2; 1154 K; 1353 K; 1401 K; 1419 K; 1454 K
- `src/components/guild/PlantioVisor.tsx` (6): 177 L; 186 B; 209 L; 242 L; 250 L; 295 K
- `src/components/guild/PracaVisor.tsx` (6): 121 K; 140 K; 144 K inventory_2; 156 K; 176 K; 204 K guild.praca.abrir
- `src/components/hex/HexRenameButton.tsx` (1): 23 L
- `src/components/hex/HexRenameModal.tsx` (3): 32 P; 35 O; 39 P
- `src/components/hex/HexsmithSheet.tsx` (5): 185 L; 285 P; 319 K; 326 K; 391 L
- `src/components/home/DemoExitButton.tsx` (1): 34 B
- `src/components/home/DungeonSign.tsx` (1): 54 B
- `src/components/home/HungerIndicator.tsx` (1): 57 B
- `src/components/home/Mochila.tsx` (7): 306 B; 317 B; 353 B -sel; 401 L; 421 L; 464 L Ir lá; 485 L Usar
- `src/components/mente/BolhasGame.tsx` (5): 231 B; 265 P Começar; 282 O Sair; 285 P Jogar de novo; 293 O Sair
- `src/components/mente/EcoGame.tsx` (3): 233 B; 274 B Eco reverso; 277 P Começar
- `src/components/mente/MindTutorial.tsx` (3): 142 O Pular; 143 P Entendi, jogar; 185 O Ver o tutorial
- `src/components/mente/PatchesGame.tsx` (3): 325 O Sair; 328 P Próxima colcha; 333 O Limpar tudo
- `src/components/mente/PicrossGame.tsx` (8): 248 P; 292 O; 355 O Sair; 358 P Outros; 413 B; 434 O Desfazer; 443 O Limpar; 446 G Outros
- `src/components/mente/RevisaoGame.tsx` (13): 156 P Começar; 160 O Meus cartões; 182 P Novo cartão; 199 O Apagar; 207 Q Cancelar; 213 G Editar; 216 Q Apagar; 254 O Cancelar; 257 P Salvar; 294 P Mostrar resposta; 300 O Lembrei; 303 O Ainda não; 331 P Sair
- `src/components/mente/SeloGame.tsx` (3): 148 B; 170 P Ver resultado; 183 P Começar
- `src/components/mente/TrocaGame.tsx` (3): 181 O; 239 O Sair; 242 P De novo
- `src/components/mente/ZipGame.tsx` (4): 272 O Sair; 275 P Próxima trilha; 281 O Voltar um passo; 284 O Recomeçar
- `src/components/mercado/EssenceBuySheet.tsx` (4): 59 B; 76 B; 84 O Cancelar; 85 P !!bu
- `src/components/mercado/FrameShelf.tsx` (2): 58 P Confirmar; 67 P Comprar
- `src/components/mercado/GuildOwnedShelf.tsx` (2): 73 B; 90 B
- `src/components/mercado/MercadoSheets.tsx` (7): 78 B; 300 B; 317 P Resgatar; 328 B; 368 P Confirmar; 377 P Comprar; 527 O Comprar
- `src/components/mercado/RestauranteSheet.tsx` (2): 82 O; 139 O Cozinhar
- `src/components/mercado/ShopItemSheet.tsx` (2): 162 B; 192 P* affordable ? 'pri
- `src/components/mercado/ShopShelf.tsx` (7): 364 B; 564 O Cancelar; 567 P Confirmar; 642 P Entendi; 705 O; 736 O Comprar Créditos; 798 P
- `src/components/mercado/SubscriptionShelf.tsx` (3): 86 B; 115 B; 140 B
- `src/components/nav/AreaScene.tsx` (2): 126 B; 243 B
- `src/components/nav/AreaSheet.tsx` (1): 254 B
- `src/components/nav/AreaTopBar.tsx` (1): 91 B
- `src/components/nav/AreaView.tsx` (1): 356 B
- `src/components/nav/AvisosLink.tsx` (1): 25 B
- `src/components/nav/CornerLink.tsx` (1): 31 B
- `src/components/nav/GuildaMapPage.tsx` (3): 68 B; 93 B; 123 P
- `src/components/nav/HomeFeedbackButton.tsx` (1): 40 B currentColor
- `src/components/nav/MailLink.tsx` (1): 22 B
- `src/components/nav/MapPage.tsx` (2): 36 B; 155 B
- `src/components/nav/MissionCard.tsx` (2): 92 B; 141 P
- `src/components/nav/MissionsLink.tsx` (1): 30 B ) e 05/10/2026 (
- `src/components/nav/StrollQuestLine.tsx` (1): 59 P Feito
- `src/components/onboarding/etapas/EtapaAlimentar.tsx` (1): 71 B
- `src/components/onboarding/etapas/EtapaDuelo.tsx` (1): 87 B Atacar
- `src/components/onboarding/etapas/EtapaTarefa.tsx` (3): 52 B Sim, fiz; 53 B Ainda não; 60 B Pronto, já fiz
- `src/components/onboarding/intro/IntroCinematica.tsx` (2): 152 B; 158 B Pular
- `src/components/onboarding/intro/SeletorIdiomaAbertura.tsx` (1): 33 B
- `src/components/onboarding/sequencia/SequenciaPlayer.tsx` (3): 13 B; 119 B; 129 B
- `src/components/perfil/DemoSoundButton.tsx` (1): 12 B
- `src/components/perfil/EditHomeScreen.tsx` (7): 101 B; 126 B; 160 O Ver a loja de Decoração; 173 O Cancelar; 176 P Salvar; 235 G Ver a loja; 253 B
- `src/components/perfil/PerfilCardTile.tsx` (1): 33 B
- `src/components/perfil/ProfileAvatarButton.tsx` (1): 20 B
- `src/components/perfil/ProfileEditor.tsx` (2): 113 P Salvo; 155 B
- `src/components/perfil/RegenAparencia.tsx` (5): 101 O; 102 P; 122 Q; 123 P; 127 P* no-credits
- `src/components/pixel/EvolveButton.tsx` (1): 56 L
- `src/components/pixel/PixelKit.tsx` (6): 116 B; 232 B; 324 B; 376 B; 429 B; 524 B
- `src/components/pixel/RitualPanel.tsx` (7): 128 B; 366 B; 377 B; 400 B; 511 B; 526 P; 567 P
- `src/components/pixel/TimingBar.tsx` (1): 116 P
- `src/components/play/CadernoSheet.tsx` (6): 123 P Guardar; 163 B; 173 Q Mostrar menos; 179 Q Apagar tudo; 182 O Apagar tudo mesmo; 183 G Voltar
- `src/components/play/FocusBag.tsx` (1): 54 B
- `src/components/play/FocusBoard.tsx` (9): 222 P Voltar ao descanso; 226 P Voltar à jornada; 229 P* p25; 231 O; 248 B Refazer; 258 Q; 261 QO; 287 P*; 293 Q Fechar
- `src/components/play/FocusTaskDock.tsx` (1): 77 B
- `src/components/play/FocusTaskPicker.tsx` (3): 42 P !!bu; 50 O; 60 O Criar
- `src/components/play/GameCard.tsx` (1): 58 L
- `src/components/play/JourneyScreen.tsx` (5): 183 B; 187 B; 190 B; 194 B; 197 B
- `src/components/play/Match3Escolha.tsx` (1): 142 O Tentar de novo
- `src/components/play/MinigameModeGate.tsx` (4): 75 P; 106 O; 109 P; 116 P Jogar
- `src/components/play/OficinaPlano.tsx` (12): 60 O; 132 P*; 143 B Cancelar; 191 O; 199 P* Reiniciar; 226 B Cancelar; 227 B Não tenho tarefas agora; 228 P Pegar a chave; 230 B Voltar; 232 B Pular; 233 P Próxima etapa; 235 P Salvar sessão
- `src/components/play/OficinaPrioridades.tsx` (5): 42 Q; 46 O; 75 P Salvar; 76 Q Tirar a classificação; 85 P
- `src/components/play/PasseioSheet.tsx` (4): 127 B; 152 P Escolher esta; 232 P Feito hoje; 263 B Registro
- `src/components/play/PlaySheets.tsx` (2): 192 B Entrar no Rift; 196 O Ver o mapa
- `src/components/play/TicketBuyModal.tsx` (1): 77 O Agora não
- `src/components/refugio/ChamaGame.tsx` (8): 203 P Entendi; 206 O Usar olhos fechados; 230 B; 233 B Modo olhos fechados; 236 P Começar; 264 O; 265 P De novo; 290 Q Terminar
- `src/components/refugio/RefugeInviteCard.tsx` (2): 40 O Hoje não; 43 P Respirar com o Soulmon
- `src/components/refugio/RespiracaoGame.tsx` (7): 134 B; 146 B; 152 P Começar; 171 O Sair; 174 P De novo; 221 O; 250 Q Terminar
- `src/components/rift/RiftMap.tsx` (6): 121 O; 153 B; 199 P; 204 O; 212 O; 213 P
- `src/components/ritual/RitualKit.tsx` (1): 174 B
- `src/components/ui/AvatarFrame.tsx` (3): 177 B; 181 P; 192 B
- `src/components/ui/BackArrow.tsx` (1): 50 B
- `src/components/ui/BackCircleButton.tsx` (1): 32 B
- `src/components/ui/BlockedActionModal.tsx` (2): 23 K; 34 B
- `src/components/ui/BotaoEspecial.tsx` (1): 26 B
- `src/components/ui/ChevronAcao.tsx` (2): 9 B; 28 B
- `src/components/ui/CtaButton.tsx` (4): 56 B; 61 B; 67 B; 92 B
- `src/components/ui/EscolhaLinha.tsx` (2): 48 P; 70 O
- `src/components/ui/InfoTip.tsx` (1): 118 B
- `src/components/ui/LockBadge.tsx` (1): 65 B
- `src/components/ui/ScreenSkeleton.tsx` (1): 70 B Tentar de novo
- `src/components/ui/Viewport.tsx` (1): 19 B
