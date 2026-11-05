# Checklist do dono

> **Dono do documento:** a sessão do checklist, a pedido do dono em 04/11/2026. **Base das tabelas §2–§6:** `main` em `c27646058`, ainda não refeitas; a seção "Checkup da onda" vale sobre elas, em `f13c521be`.
> **Fontes:** mensagens do dono de 03–04/11, [BACKLOG-PRODUTO](BACKLOG-PRODUTO.md), [PEDIDOS-DO-DONO-2026-10-28](PEDIDOS-DO-DONO-2026-10-28.md), [PERGUNTAS-DO-DONO](PERGUNTAS-DO-DONO.md), [ASSETS-A-GERAR](ASSETS-A-GERAR.md).
> **Regra:** ✅ só com evidência lida no código ou no diff (`alpha-fiscal-entrega`), nunca por relato de agente. Título de PR não prova nada.
> **Não cobre:** visual, som e aparelho. Nada aqui foi compilado, executado ou aberto em aparelho; a conferência foi só leitura. ✅ quer dizer "o código faz", não "ficou bonito".
> **Precedência:** código > este arquivo. Atualizar a cada PR que fechar um item.

Legenda: ✅ feito · 🟡 parcial · ❌ não · ⬜ aberto · ❓ decisão do dono · 📱 só dá para provar no aparelho · ⚰️ órfão (revogado ou superado).
Responsável: **Dono** decide ou confere; **Arte** é fila de geração; **A atribuir** é código sem sessão designada.

## Checkup da onda (04/11/2026)

**Veredito: ainda não pronto.** O código da `main` está saudável, mas faltam o #562 e os itens do dono abaixo.

Evidência:
- CI, Android e Workers Builds verdes em `793d842a6`. Depois disso entraram #564, #563 e #552; o CI da `main` deles não foi lido aqui.
- O #558 quebrou o deploy da web e o APK por `export const` sem `declare` em um `.d.ts`. Corrigido no #560, com teste de contrato.
- Autenticação do save ativa em produção: `GET /api/save` sem token responde 401 (sonda com id inexistente).
- Os 3 testes duvidosos do QA passam em checkout completo. As falhas vieram de worktree parcial. A suíte inteira local não fechou limpa; a prova é o CI.
- **Bytes:** `index.js` com 935.485 B (`vite build` em `00e793323`, sem o passo de WebP), 31.926 B acima do limite de 903.559 B. O web não trava; o contrato reprova no próximo release.
- **Alta de `PRIVACY_VERSION` para 2026-11-04:** cada jogador vê uma tela bloqueante de aceite uma vez (`App.tsx:7266`). Funciona offline.

Corrigir logo, sem bloquear a onda:
- Filtro do nome do especial: homóglifos, nome invisível e contato (`insta joao123`) passam.
- Busca de jogadores lê só os primeiros 300 perfis, e `?search=` aleatório gera até 300 leituras de KV.
- Molduras: `POST /api/save` com `widgetFramesOwned` libera todas sem pagar (lido no código, não executado).
- `orderId` ausente, moldura perdida em escrita concorrente e `isConsentCurrent` com `===`.
- Glossário e `_chatKnowledge` ainda dizem que não há novo aceite, o que está errado.

Só o dono:
1. **Cloudflare:** criar regra de Rate Limiting em `/api/feedback`, sem ela o teto é por isolate.
2. **Secrets:** `RESEND_API_KEY` e `FEEDBACK_FROM`; testar um envio real (o remetente padrão de sandbox pode só entregar ao dono da conta).
3. **Play Console:** deixar os SKUs `moldura_*` inativos até a arte estar no APK (0 de 20 em `drawable-nodpi`); atualizar Data Safety com feedback e feed.
4. **Build na Play:** AAB novo, depois do corte de bytes ou de aceitar a dívida. Widget adaptativo e microfone (#505) só chegam assim; o resto vai pelo Worker (`server.url`).
5. **Aparelho:** widget, double tap, escada da Arena, vitrine 1,75×, feira com servidor, som, tela de aceite.
6. **Feedback, retenção 90 dias (decidido 04/11):** a KV já expira em 90 dias e a política diz isso (teste trava). MANUAL: o e-mail já entregue na caixa `soulmon.revisor@gmail.com` não se apaga por código; criar filtro/rotina na caixa para apagar mensagens `[Soulmon ...]` com mais de 90 dias (e conferir o prazo de logs do Resend).
6b. **Busca de jogadores:** depois do deploy, rodar o backfill do índice de apelidos até `done: true`: `POST /api/community?action=backfillNicks` com `{"adminKey":"<SEASON_ADMIN_KEY>","cursor":"<cursor da resposta anterior>"}` (40 perfis por chamada; idempotente, não rouba apelido de ninguém).
6c. **Decisões:** prazo de limpeza da caixa de feedback (a política não dá prazo); ~~risco de moldura grátis pelo save~~ (decidido: servidor é a autoridade, PR fix/molduras-servidor); ~~§21 contra a faixa de evoluções~~ (decidido: a faixa fica, REGISTRO §224); revisão jurídica de transferência internacional (ver item 8).
7. **Limpeza:** apagar `D:/soulmon-bytes-dist` (5.012 arquivos, D: em 97%, E: cheio).
8. **Revisão jurídica da transferência internacional de dados** (Groq, Gemini, Resend/Gmail, Cloudflare etc.): o dono decidiu fazer **antes da abertura ao público**; a onda de testers NÃO espera por ela (04/11/2026). Responsável: **Dono** (contratar/consultar advogado de LGPD). Entregável: parecer sobre base legal para enviar dados a operadores fora do Brasil e sobre o que `public/privacidade.html` diz disso; se mudar o texto, subir `PRIVACY_VERSION`.

## 1. O que importa agora

**Nada dos PRs #500–#529 está em um AAB.** A Play segue no versionCode 22 (1.3.0-beta2, 21/10). O conserto do microfone (#505) mexe no manifesto, então só chega ao aparelho com AAB novo. O último `release:` no git é a v253, anterior a todos eles, e o repo não tem workflow de deploy web: o código não diz se o Worker recebeu algum.

**O próximo build reprova no orçamento de bytes.** O limite do `index.js` é 903.559 B; o REGISTRO §220 registra build de 927.969 B (~24,4 KB acima). O contrato só passa hoje porque lê o `dist/` antigo da v253. Re-medir antes do release.

**Bugs e lacunas sem responsável:**
- Respiração: a cena é 100% procedural, sem os assets pedidos.
- Cosméticos: 0 de 108 artes e nenhum item com `element`, logo o exclusivo de elemento não aparece para ninguém.
- Trilhas animadas: nenhum doc tem os prompts pedidos; `PROMPTS-TRILHAS-FALTANTES.md` ainda diz "Calma até no combate", e as 11 faixas de minijogo estão pendentes.
- Vitrine: a escala ficou em 1,75×, não 2,5×, por escolha do agente.
- Energia dos minijogos: só no cliente e no save; o servidor não valida.
- Autoplay da intro: depende de `VITE_ONBOARDING_VELADO`, desligado. Em produção só "Ver abertura" a mostra.
- Os 3 Soulmon de teste estão fora apenas porque nunca foram baixados; não há filtro no código.

**Decisões do dono (modal, 04/11):**
- Chama: mantém os 5 Bits e a energia. Fundos de missão: mantêm 1500 Bits.
- Patchwork: ✅ #537 (`_feira.js` `TRAIL_GAMES` com `selo`; `patches` aceito só em trilha já guardada; `PatchesGame` segue para incursões antigas do Calabouço).
- Chip redutor: ✅ #538 (`index.css` `2 2`; selo em `ShopShelf` e `ShopItemSheet`). Não visto na tela.
- Ramos: ✅ #536 (`arena.ts`, `strayFoes.ts` `STRAY_RAMOS`; chefe da Fusão fora). A escada do #543 restringe onde aparecem. Os 3 de teste seguem sem filtro, pois não há identificador no código.
- Vitrine: fica em 1,75× até conferir no aparelho. 📱
- AAB novo: depois das lacunas de código, dos widgets e da re-medição de bytes; o upload é do dono.

**Pedidos posteriores (04/11):**
| Pedido | Estado | Evidência | Não verificado |
|---|---|---|---|
| Soul Barrage: double tap solta o especial, rótulo perto da barra | ✅ #540 | `soulBarrage.ts` `registerTap`, `data-barrage-doubletap`; só no modo Avançado | sensação em toque real; limites de tempo são estimativa |
| Soul Barrage: asset da barra do especial | 🟡 Arte | slot em `assets/soulmon/barrage/index.ts`; `barra-especial.png` na fila | arte não gerada |
| Mente e Diversão voltam para lista | ✅ #540 | `PlaySheets`; Refúgio mantém `GameCard` | tela |
| Widget redimensionável com texto por prioridade | ✅ #542 | `SoulmonWidgetAdaptiveProvider`, `WidgetAdaptive.kt`; Gradle e 5 testes passaram localmente | nunca visto em aparelho; só chega com AAB novo |
| Arena escala: Rookie, Champion, Ultimate, sem subir ao perder | ✅ #543 | `arenaLadder`, §222; números vêm de simulação | não jogado; a dificuldade inicial segue igual à de hoje |

## 2. Pedidos de 04/11/2026

| # | Pedido | Estado | Responsável | Evidência e o que falta |
|---|---|---|---|---|
| D-01 | Comida enche 1,5/3 | ✅ feito | — | `home/HungerIndicator.tsx` `meios` (HUNGER_PER_FOOD=50 da 1,5/3), consumido por `CompanionHUD` #501 |
| D-02 | Barras de HP e especial ficam como estão (PixelMeter) | ✅ feito | — | `games/BattleStage.tsx` `PixelMeter` nos fighters e boss #500 |
| D-03 | Torneio e Arena só com cenário exclusivo; coliseu por rank | ✅ feito | — | `TournamentPage` `coliseuSceneFor` (6 artes), `DuelScreen` `sceneElement={scene ? null : oppEl}` #502; Arena `arenaSceneOfSeed`/`ARENA_BG_SCENES`, fora de `RUN_SCENE_POOL` |
| D-04 | Intro em painéis animados; "Ver abertura" no menu Ajuda | ✅ feito | — | `IntroCinematica` `PAINEIS` (9 webp), `SettingsPage` grupo Ajuda "Ver abertura" `onReplayIntro` #504. FLAG: autoplay exige `onboardingVeladoLigado` (`VITE_ONBOARDING_VELADO`, ausente em .github/package.json); so o menu Ajuda garante a exibicao |
| D-05 | Microfone do chat funcionando | 📱 só aparelho | Dono (aparelho) | `AndroidManifest` MODIFY_AUDIO_SETTINGS, `ChatBox` `MIC_ERR` toasts #505. Manifesto e nativo: nao chega ao aparelho sem AAB novo (versionCode segue 22, de 21/10) |
| D-06 | Segurar tarefa: editar; marcada abre Desmarcar/Editar, com estorno; bloqueia se o item foi usado | ✅ feito | — | `DailyRituals` `onLongPress`, `App` `holdDone` modal Desmarcar/Editar, `taskUncomplete` `uncompleteTask`/`uncompleteBlock` ('used') #508. Tambem bloqueia em outro dia (`old`), missao resgatada e conclusao anterior a versao (`legacy`) |
| D-07 | Ranqueado mostra oponentes mais perto no rank | ✅ feito | — | `functions/api/community.js` + `_rankedPick.js` `pickRankedOpponents` por pontos da season, `RANKED_WINDOW`=4; `TournamentPage` `loadOpponents`/`reloadRank` apos luta #509 |
| D-08 | Arena sorteia 3 de novo a cada participação, sem custo | ✅ feito | — | `ArenaGame` `onRunEnd`, `arenaSorteio` `applyArenaRunEnd`, `DueloSheet` `arenaCards(...runsDone)`, sem tocar no reroll #509 |
| D-09 | Arena entre rodadas: modal com 3 corações, "Pronto pro combate", cenário escurecido atrás | ✅ feito | — | `games/ArenaCuraModal` (ModalSheet, 3 PixelIcon `hp` enchendo, "+N de vida", "Pronto pro combate"), montado sobre `BattleStage` em `ArenaGame` `entreRodadas` #513 #519. Identidade visual e padrao do ModalSheet, conferir a olho |
| D-10 | Vitória na Arena diz "Lutar de novo"; derrota, "Tentar de novo" | ✅ feito | — | `ArenaGame` `playAgainLabel` Lutar de novo/Battle again x Tentar de novo/Try again #509 |
| D-11 | Modo rápido: especial sai sozinho em intensidade média | ✅ feito | — | `useGroupBattle` `RAPIDO_RING_GRADE='bom'` com speed>1 #507. Vale nos 5 usuarios do hook (Arena, Dungeon, Grove, Nightmare, RogueFight) |
| D-12 | Soul Barrage em tela cheia, com o fundo do jogo | ✅ feito | — | `SoulBarrage` `GameRoot` com `SCENE_BG.barrage`, arrasto em `data-barrage-area` #506 |
| D-13 | Intro: mais curta, fonte com identidade, glitch/ruído/aberração, troca como estação de rádio | ✅ feito | — | `IntroCinematica` Cinzel, `intro-aberr-*`/`intro-rasgo`, `intro-sintonia`; 35 s no #510, depois substituido pelo D-14 |
| D-14 | Intro um pouco mais lenta, com o logo animado no fim (vídeo magenta) | ✅ feito | — | `copy.ts` `PLANOS_INTRO` soma 42,5 s (+logo ate 11,5 s `LOGO_TETO_S`, total ~53 s); `logo-final.webm` com AlphaMode=1 e BlockAdditions presentes #511. Video magenta de origem nao esta no repo |
| D-15 | Tirar o Patchwork; jogo cognitivo de resolução de problema no lugar | 🟡 parcial | A atribuir | Selo wired: `AreaView` `SeloGame`, `PlaySheets`, `dailyMissions` #523. Falta: Patchwork segue ativo na Feira (`_feira.js` `TRAIL_GAMES`, `feira.ts` `FEIRA_TRAIL_GAMES`, `FeiraTrailPlay` `PatchesPlay`, `feiraCopy`) e nome ao jogador em `missions.ts` "Colcha de retalhos" (conta Selo) e `shop.ts` `bg-mission-colcha` |
| D-16 | Carta ilustrada em cada jogo (Ateliê, Salão, Refúgio) | 🟡 parcial | Arte | `play/GameCard` usado em `PlaySheets` nos 3 menus #517. Falta: 0 de 10 artes, `assets/soulmon/cards/` so tem `.gitkeep`; todas caem no placeholder procedural |
| D-17 | Minijogos de diversão gastam energia: 1 = 3 rodadas em 30 min | ✅ feito | — | `funSession` `startFunRound`, `AreaView` `funKey`/`replayRound`, `onReplayRound` em Dino/PPT/Match3/Barrage #516 #525. Nenhum jogo do Salao escapa. Fora de proposito: Atelie, Refugio, Masmorra; `RogueDungeon` e `EtapaPuzzle` montam os jogos sem custo. Servidor NAO valida: so cliente/save |
| D-18 | Respiração subaquática em tela cheia, com assets próprios | 🟡 parcial | Arte | `refugio/CenaSubaquatica` tela cheia wired em `RespiracaoGame`, faixa `tema-respiracao` #521 #526. Falta: `assets/soulmon/respiracao/` nao existe; cena 100% procedural, sem asset proprio |
| D-19 | Exercício da Chama: concentração olhando a chama | ✅ feito | — | `ChamaGame` em `AreaView`; paga `CHAMA_BITS`=5 Bits 1x/dia so ao concluir (`premioDevido`) E devolve energia do Refugio via `onRefugioComplete`/`grantRefugioEnergy` (1x/dia, compartilhada com Respiracao/Bolhas) #521. Fundo procedural (`assets/soulmon/chama/` nao existe) |
| D-20 | Prompts Suno de todas as trilhas; as próximas mais animadas (desafio, combate, adrenalina) | 🟡 parcial | A atribuir | Prompts em `docs/som/PROMPTS-TRILHAS-FALTANTES.md` (17); `tema-respiracao`, `tema-chama` instalados `musica.ts` #526. Falta: nenhum doc tem os prompts energeticos; "adrenalin" nao aparece em docs, regra 2 diz "Calma ate no combate", dino/ppt/etc levam `calm`. Sem prompt do Selo; §3.7 ainda e Colcha. Minijogos: 0 instaladas, todas pendentes (dino, ppt, barrage, match3, eco, zip, selo, picross, troca, revisao, bolhas). Escuta: so o dono |
| D-21 | Ramos evoluídos parados viram inimigos de nível alto, exceto os 3 de teste | ✅ feito | — | `enemyRoster` `buildRamos`/`pickEnemy`, `RAMO_CHANCE`=1/3 #529. Usam: masmorra (`dungeon.ts` `getDungeonEncounter`), Fusao normal (`match3Combat`), NPC PvP (`match3Pvp`), Bestiario. Ausentes: Arena (`NOVOS_DATA`), boss (`semRamos`), stray (`STRAY_ROSTER`). Os 3 de teste: excluidos por ausencia, nunca baixados (REGISTRO §220); sem filtro no codigo, #529 nao adicionou arquivos em ramos/ |
| D-22 | Missão (! e ?) no Mapa, no círculo igual ao da casinha | ✅ feito | — | `App` `currentView==='map'` `MissionsLink row={0}` (`!`/`?` via `QuestGlyph`), `CORNER_RING_STYLE` #520 #527 |
| D-23 | Botão ilustrado sob o avatar: e-mail para soulmon.revisor@gmail.com | ✅ feito | — | `HomeFeedbackButton` (icone `enviar`, so aria-label) no `App` abaixo do `ProfileAvatarButton`; `REVISOR_EMAIL`='soulmon.revisor@gmail.com', assunto PT 'Feedback e bug report', EN 'Feedback & bug report' #520 |
| D-24 | Decoração maior na área do pet | 🟡 parcial | A atribuir | `PetStageDecor` le `decorRenderBox`/`DECOR_RENDER_SCALE`; `decorPrices`, `shop.ts` #524. Falta: `trophy` (vitrine) 1,75x, nao 2,5x, por escolha do agente. Clipping so em `petStage.test` a 390 px para pecas de chao; aparelho nao conferido |
| D-25 | Cosméticos com mais cor e exclusivo de elemento (108 peças) | 🟡 parcial | Arte | `elementExclusive` `elementShopVisible` wired em ShopShelf/FrameShelf/AvatarFrame etc #524. Falta: 0 de 108 com arte (fila em `docs/ASSETS-A-GERAR.md`), 0 itens com `element` em `shop.ts`/`frames.ts`: efeito hoje invisivel |
| D-26 | Chips redutores no lugar do Chip Triplo | 🟡 parcial | A atribuir | `shop.ts` `chip-reduce-*` no lugar de `chip-triple`; `SPECIAL_ITEMS` mantem o triplo, save antigo OK #515. Falta: loja SEM selo (`ShopShelf` usa so `ITEM_ART`, mesma arte do chip comum). BUG Mochila: `index.css` `.sm3-item-arte[data-reduce]::after` tem content = U+0091 + "2" em vez de "−": aparece "2" vermelho |
| D-27 | Busca por elementos base no Drive e nas essências | ✅ feito | — | `ElementBaseSlots` + `elementMatchesBases` em `LibraryPage`, `EssencesSection`, `ElementDex` #518 |
| D-28 | Feira: desafio do dia, aviso da volta, mapa próprio, energia, projétil do especial | 🟡 parcial | Arte | `feiraDesafio`, `feiraNotificacao`, `feiraEnergyAt`, fix em `BossFightScreen` #514. Falta: `bg/feira-batalha.png` AUSENTE; `FEIRA_SCENE` cai em `visor-feira.png` (arte horizontal da sala), cena propria nao existe |
| D-29 | Barra amarela sob o baú = teto diário de Bits | ✅ feito | — | `games/ResultScreen` `data-result-bitscap` texto do maximo + `BitsAmount` + `PixelMeter` cyan #512 |
| D-30 | Cenários ×2/×3/×5 e prévia grande nas Conquistas | ✅ feito | — | `shop.ts` precos x2/x3/x5, `MercadoSheets` `ConquistasSheet` + `ShopItemSheet` `hidePrimary` #522. Fundos de missao: 1500 Bits fixos nos 20 `bg-mission-*` |
| D-31 | Regra máxima de identidade registrada | ✅ feito | — | `docs/REGRA-IDENTIDADE-SOULMON.md` existe, citado em 14 arquivos entre docs, CLAUDE.md e .claude #528 |
| D-32 | Orçamento de bytes e build para a Play | ❌ não | A atribuir | Orcamento: `orcamentoDeBytes` `DIVIDA_ATUAL['index.js']`=895.367 + `FOLGA_JS_CSS` 8 KB = limite 903.559 B. O teste le `dist/` commitado (v253, entry 899.538 B, passa com dist velho); REGISTRO §220 registra build de 927.969 B, ~24,4 KB ACIMA: proximo build reprova sem re-medir. Play: `build.gradle` versionCode 22 / 1.3.0-beta2 (21/10); nenhum de #500-#529 em AAB. Web via `capacitor.config` `server.url`, ultimo `release:` v253 (`sw.js` CACHE_VERSION v253, 03/11) antes de todos; repo nao tem workflow de deploy web. `docs/STATUS.md` sem registro de build Play recente |

Sem linha de código, só registro:
- **Talento do especial (recarga rápida):** a resposta do dono foi "manter como está"; o texto vem do resumo da sessão, sem medição conferida aqui.
- **Sprite por API a US$ 0,037:** o dono perguntou se batia com as contas. Não conferido neste checklist.
- **Lista do backlog:** é este documento.

## 3. Backlog de produto

| # | Item | Estado | Responsável | Evidência | Não verificado |
|---|---|---|---|---|---|
| BP-01 | Loja do clã | ✅ feito | — | `functions/api/_lojaCla.js` `comprarNaLoja`; `components/guild/GuildLoja.tsx`; REGISTRO §175 | tela no app; preços provisórios, ver P5-1 |
| BP-02 | Match 3: 17 Novos como inimigos, afinidade, níveis, reset mensal, rank | 🟡 parcial | A atribuir | Feito: inimigos do roster (`Match3Game.tsx` `rosterOf`, `newCombat`), vantagem (`match3Combat.ts` `elementAdvantage`), ranking (`RankingPanel game="match3"`). Não achado: níveis com dificuldade e reset mensal; sorteio "6 dos 17" por fase (PvE usa `M3_TILE_ELEMENTS` fixo) | ranking é por pontos; reset mensal não confirmado por grep |
| BP-03 | Cena própria da Casa da Guilda | ⬜ aberto | Arte | `components/guild/GroveCena.tsx` ainda usa `PANORAMA_SRC`; nenhum asset de casa da guilda em `src/assets` | parado por decisão de 20/10 |
| BP-04 | Busto próprio do Grove | ❓ decisão | Dono | `npcs/index.ts` `hall:grove` = `npc-n-musa.png` (Lilia, D-50, escolha do dono); `areaNpcVoice.ts` | dono ainda quer busto próprio? comentário em `npcs/index.ts` ainda diz "Ramo" |
| BP-05 | Silhuetas Pesadelo 1b/2c/3/4b | ✅ feito | — | `dino/dino-shadow-{1b,2c,3,4b}.png`, commit `10ad02468`, `nightmareShadows.ts` `SHADOW_ART`; SHA1 dos 12 todos distintos | visual; 1b mede 256x75 (doc pedia 128²) |
| BP-06 | Widget Kotlin compilado e testado | 📱 só aparelho | Dono (aparelho) | `widget/WidgetRenderer` presente; `android-build.yml` compila Android | compilação nesta revisão; aparelho |
| BP-07 | 149 textos longos | 🟡 parcial | A atribuir | Dos 159 literais de `D:/Soulmon/prompts/d72-textos-longos.md`, 52 ainda têm o início no código (27 Guia/Ajuda); regex acha 32 literais de 160+ em components/i18n. Commits `f1dca1c41`, `9b35501c7`, `15455a2f7` | contagem por prefixo, aproximada; `src/data` e `utils` fora da régua |
| BP-08 | Métricas APK (tamanho, Home, memória) | 📱 só aparelho | Dono (aparelho) | Nenhuma medição em `docs` | tudo |
| BP-09 | Apresentação do Soulmon | ✅ feito | — | `utils/soulmonIntro.ts`, `SoulmonOnboarding.tsx`, REGISTRO §156 | fluxo no app; ressalva "rebasear normalização planta/industrial" |
| BP-10 | Gerar de novo a aparência | ✅ feito | — | `d2e3e447a`; `_spriteRegen.js`; `perfil/RegenAparencia.tsx`; `useRegenAparencia.ts`; `termos.html` §5 e `TERMS_VERSION` 2026-10-26; dúvidas fechadas em §34b (50 Créditos, 1/forma/mês, guarda só a anterior) | geração paga real |
| BP-11 | Passos: pedir no fim do onboarding, card curto | ⬜ aberto | A atribuir | `StepsCard` só em Configurações (`App.tsx`, `pane === 'settings'`), ausente em `SoulmonOnboarding.tsx`. Pronto só na branch não mergeada `rodada5-passos` (`1c141a15d`, 1 commit à frente) | se a branch ainda aplica |
| BP-12 | Passos: contar com app fechado (Health Connect) | ⬜ aberto | A atribuir | `AndroidManifest.xml` só `ACTIVITY_RECOGNITION`, "NÃO é Health Connect"; `privacidade.html` idem; `READ_STEPS`/`connect-client` ausentes; `capacitor-pedometer` em `package.json` | aparelho, Console |
| BP-13 | Passos: "N de M hoje" e meta definida | 🟡 parcial | A atribuir | `StepsCard` `goal`/`onChangeGoal`/`todayGoal`, `steps.ts` `STEP_GOAL_OPTIONS` | "em tempo real" na missão |
| BP-14 | Dúvida passos: meta padrão e opções | ❓ decisão | Dono | Main: padrão 7000, opções 3k/5k/7k/10k (`steps.ts`); doc da branch: padrão 5000 e 8000 | sem resposta do dono |
| BP-15 | Dúvida passos: consentimento separado do Health Connect | ❓ decisão | Dono | Sem resposta; depende de BP-12 |  |
| BP-16 | Dúvida passos: total na Home | ❓ decisão | Dono | `StepsTotalChip` ausente na main (só na branch, conforme doc) |  |
| BP-17 | Som D-88 "push" | ✅ feito | — | `sonsAssets.ts` D-88; `2408a19b8` | escuta do dono (seção 5) |
| BP-18 | FX de ataque virados | ✅ feito | — | REGISTRO §151 citado no doc; grep não achou símbolo de direção em `combatFx.ts`/`attackFxArt.ts` | auditoria não refeita; conferência lado a lado em aparelho |
| BP-19 | Steps viram Fragmentos | ✅ feito | — | `utils/soulFragment.ts`, §153 | migração do save |
| BP-20 | Rookie pequeno | ✅ feito | — | `utils/spriteScale.ts` `ROOKIE_RENDER_RATIO`, `petScaleStyle` em várias telas, §181 | visual |
| BP-21 | Essências: drop e Arquivo | ✅ feito | — | `utils/essences.ts`, `_essences.js`, `_feira.js` `essenceDoChefe`, §183 | em jogo |
| BP-22 | Essências "sem uso por enquanto" | ⚰️ órfão | — | Superado por `utils/elementPotion.ts` (poção, 300 da essência; `essenceSpent`) e compra por Créditos em `entitlements.js` (`essencePackPrice`). Backlog desatualizado | se o dono quer preço e uso assim |

## 4. Pedidos de 27–29/10

| # | Item | Estado | Responsável | Evidência | Não verificado |
|---|---|---|---|---|---|
| B3 | Resultado da Fenda | ✅ feito | — | `DungeonGame.tsx` `hero` com `STAIRS_ICON`, `deepest`, energia com `ENERGY_ICON`, `hearts` só se >0; `rewardIcons.ts` "Item de recuperar vida"; sem "caminho lacrado" em src | texto do Vínculo 8 não localizado por grep |
| B4 | Itens pop-in + odômetro + som em todo o app | ✅ feito | — | `f89317e93`; `ui/RewardPop`, `RollingCount`, `hooks/useRewardReveal`; `ResultScreen` em 14 telas | som (ouvido) |
| B5 | Selo novo recorde | ✅ feito | — | `icons/icon-record-seal.png` 128², `c70639976`; `rewardIcons.ts` `RECORD_SEAL_ICON` (comentário "PROVISÓRIO" obsoleto) | visual |
| D1 | Arena: sorteio geral | ✅ feito | — | `ab5e0d991`; `arenaSorteio.ts` `arenaFoesOfSeed` | em jogo |
| D2 | Reroll 3 grátis, depois Bits | ✅ feito | — | `ARENA_REROLL_FREE_PER_DAY`, `ARENA_REROLL_PRICES`; `_dayCounters.js` | em jogo |
| D3 | Cenário sempre de arena | ✅ feito | — | `arenaSceneOfSeed`, usado em `ArenaGame.tsx` | visual |
| E1 | Feira servidor | ✅ feito | — | `_feira.js`, `guild.js`; branch `feira-chefe-servidor` é ancestral de HEAD |  |
| E2 | Modo chefe e tela | ✅ feito | — | `guild/BossFightScreen.tsx`; branch `feira-chefe-ui` ancestral |  |
| E3 | Cliente, trilha, i18n | ✅ feito | — | `FeiraTrailPlay`, `FeiraEventoSheet`, `FeiraMisterio`; `feira-chefe-cliente` ancestral; §193 |  |
| E4 | Verificação e calibração em produção | 🟡 parcial | A atribuir | Ligada: `FEIRA_CHEFE_DESDE = '2026-10-29'`, `7b5e8ca17`. Métrica "dias até abate" (`PLANO-FEIRA-CHEFE` F-14) sem registro em STATUS/REGISTRO | dado de produção |
| F1 | Essências | ✅ feito | — | ver BP-21 |  |
| F2 | Gerar no ChatGPT quando liberar | 🟡 parcial | Arte | Selo gerado; fila ainda aberta (108 cosméticos, feira-batalha) |  |
| H2 | D-03 textos longos | 🟡 parcial | A atribuir | `15455a2f7` cobriu Guia, Ajuda, passos, caminho, talentos; restam literais (BP-07) |  |
| H4 | Noite com app fechado | ✅ feito | — | Decisão respondida: §189 "Sim, conta a janela"; `restWindow.ts` `decideMissedWindowNight`; `15491d34a` | em aparelho |
| H6 | RewardPreview em toda ação | 🟡 parcial | A atribuir | `ui/RewardPreview.tsx` em 13 arquivos; `a50ccd02a`, `92b4e903f` | "toda" ação não auditada uma a uma |
| H7 | APK alfa conflita com a Play | ❓ decisão | Dono | `android/app/build.gradle`: `applicationId "com.soulmon"`, sem `applicationIdSuffix`; conflito segue possível | aprovação por prints; assinatura |

## 5. Perguntas ao dono (Beta3 rodada 4 em diante)

| # | Item | Estado | Responsável | Evidência | Não verificado |
|---|---|---|---|---|---|
| SOM-8 | Ouvir A/B cego | ❓ decisão | Dono | "fica aberto", não bloqueia; S16 instalou | ouvido do dono |
| P4-1 | Barrage sem teto de estágio | ✅ feito | — | Aceita; `soulBarrage.ts` `pickWaveStage` |  |
| P4-2 | Barrage 1 s de invulnerabilidade | ✅ feito | — | Aceita; `soulBarrage.ts` `s.invuln` | valor exato |
| P4-3 | Obstáculos 40% maiores | ✅ feito | — | Aceita; `DinoGame.tsx` 54/62/70/78 |  |
| P4-4 | N10 Vínculo da Fenda na Arena | ⚰️ órfão | — | #187 devolveu a Fenda à Exploração: `gates.ts` `exploracao.fenda` |  |
| P4-5 | N10 posição da Fenda na Arena | ⚰️ órfão | — | Idem; `EXPLORACAO_LOT_ART.fenda` | posição nova na Exploração |
| P4-6 | N7 Calabouço em tela cheia | ✅ feito | — | Aceita; `RogueDungeon.tsx` `RogueFight`/`BattleStage` |  |
| P4-7 | N8 Prepare to Focus na Oficina | ✅ feito | — | Aceita; `gates.ts` `exploracao.preparar` para `forja.oficina` |  |
| P4-8 | Match 3 dois supers | ✅ feito | — | Aceita; `match3.ts` `resolveBoard` | comportamento |
| P5-1 | Loja: calibrar preços | ❓ decisão | Dono | Sem resposta; `_lojaCla.js`; pede dado real |  |
| P5-2 | Loja: trava em compra simultânea | ❓ decisão | Dono | Sem resposta; `_lojaCla.js` ainda "best-effort" |  |
| P5-3 | Botão Gerar Soulmon grátis | ❓ decisão | Dono | Respondida "grátis até a produção"; `SettingsPage.tsx` segue. App já na Play: dono define quando remover |  |
| P5-4 | Textos "uma geração por forma" | 🟡 parcial | A atribuir | Sem resposta; `RegenAparencia.tsx` já diz por mês; `_chatKnowledge.data.js` `termo-acervo-de-sprites` a reler | texto integral do chat e Guia |
| P5-5 | Manter `SPRITE_REGEN_DISABLED` | ❓ decisão | Dono | Sem resposta; no código e no rollback §34b |  |
| P5-6 | Passos sem segundo plano | ⚰️ órfão | — | Pergunta sobre branch não mergeada; decide-se com BP-12 |  |
| P5-7 | `StepsTotalChip` na Home | ⚰️ órfão | — | Idem, ver BP-16 |  |
| P5-8 | Meta 5000 e `connect-client` alpha | ⚰️ órfão | — | Idem, ver BP-14 |  |
| P5-9 | ~44 textos, lane própria | 🟡 parcial | A atribuir | D-03 fez lane depois; resta BP-07 |  |
| R6-1 | Conquistas novas sem cenário | ❓ decisão | Dono | Sem resposta; `dfad440b9` deu emblemas próprios às 6 de elementos | cenários |
| R6-2 | Diária do Calabouço paga `ore` | ❓ decisão | Dono | Sem resposta; `dailyMissions.ts` `d-calabouco` |  |
| R6-3 | Círculo na casinha, minimapa, diálogos | ❓ decisão | Dono | Sem resposta | estado visual |
| R6-4 | Diárias Eco/Chuva só com pontos | ❓ decisão | Dono | Sem resposta; `EcoGame.tsx` `bits > 0`; `AreaView.tsx` `onEarnPoints` chama `onDailyEvent('barrage')` | limite Chuva <100 |
| N-1 | Rookie 50% nos inimigos | ✅ feito | — | §181; `BattleStage.tsx` `foeRookie`; `TournamentPage.tsx` `oppStage` |  |
| N-2 | Rookie 50% em Bestiário, listas | ⚰️ órfão | — | Respondida não em §181 ("só combate e Home") |  |
| N-3 | Tabela `ART_LINE_BY_ELEMENT` | ❓ decisão | Dono | `_simulados.data.js` ainda "provisória" |  |
| N-4 | `petName` dos simulados | ⚰️ órfão | — | §182: não renomeia |  |
| N-5 | Golpe básico do simulado | ✅ feito | — | §182; `_simulados.elemento.test.js` |  |
| N-6 | Fada em `VISUAL_ELEMENTS` | ✅ feito | — | `combatFx.ts`, `792a650d7` |  |
| N-7 | Âncora pelo pé com sprites reais | 📱 só aparelho | Dono (aparelho) | `BattleStage.tsx` `useFeetShift` | conferência |
| V-1 | Trocar preço na Play + termos no dia do velado | ❓ decisão | Dono | `ONBOARDING_VELADO` DESLIGADO no repo: `flag.ts` exige `VITE_ONBOARDING_VELADO`, ausente em `.env.production`, workflows e wrangler; há teste por pessoa em `_velado.js`. Termos NÃO mudados: US$ 6.99 e R$ 29,90 em `termos.html` | Play Console; env do painel; build local |
| V-2 | Frase de privacidade `freeGen` | ✅ feito | — | D28 no doc; `privacidade.html` 6d, `PRIVACY_VERSION` 2026-10-30 (conforme doc) | texto da 6d não reaberto |

## 6. Assets a gerar

| # | Item | Estado | Responsável | Evidência | Não verificado |
|---|---|---|---|---|---|
| A2-C1 | dungeon-1..5 em pé | ✅ feito | — | `bg/dungeon-1.png`, `-5` 1080x1920 | 2, 3, 4 |
| A3-B1 | recorte `branches/` | ⚰️ órfão | — | `igni` e `astrase` existem; `nautilu` não, linha aposentada D-78 (`sprites.ts`) |  |
| A3-C2 | placeholder | ✅ feito | — | `placeholder/{dormant,forming,glitch}.png` |  |
| A4-F6 | anim-hunger-drop | 🟡 parcial | Arte | `fx/anim-hunger-drop.png`, `animArt.ts`; sem consumidor achado fora do mapa | grep limitado |
| A5-E1 | rearte dias-completos-30 | ✅ feito | — | Arquivo trocado em `b60fce81e`; imagem aberta: medalha com orbe e entalhes, sem lajes. `INVENTARIO-ASSETS` e `emblemArt.ts` estão desatualizados | conferência a 32px; `habit-66` |
| A6-M1 | marca vetorizada | ✅ feito | — | `005a2941` (doc), favicons, `brand/final` | derivados um a um |
| A6-C4 | ícone de notificação | ✅ feito | — | `drawable/ic_notification.xml`, manifest |  |
| A7-H1 | 3 versões EvoArvore | ⚰️ órfão | — | Dono escolheu SVG por token, 16/09 |  |
| A7-H2 | barra segmentada | ✅ feito | — | `hud/bar-frame-96x8.png`, `bar-fill-6.png` |  |
| A7-H3 | moldura 9-slice | ✅ feito | — | `hud/frame-pipe-vine-96.png` | consumidor |
| A7-C5 | glifos overlay | ✅ feito | — | `hud/glyph-affection.png`, `glyph-bath.png` |  |
| A14-L1 | 16 screenshots Play | ⬜ aberto | Arte | `docs/loja` não existe; `public/screenshots` só tem 3 de PWA | Play Console (app já publicado) |
| A14-L2 | Feature graphic | ⬜ aberto | Arte | Sem arquivo no repo nem em `E:/Soulmon-assets` até profundidade 3 | Play Console |
| A14-L3 | og:image | ✅ feito | — | `public/og-image.png` 1200x630; `index.html` (nome difere do doc) |  |
| A14-L4 | Ícone 512 sem alfa | 🟡 parcial | Arte | `brand/final/icon-512.png` tem alfa (ct6); destino `docs/loja/play` inexistente | Console |
| A15 | Prédios Jogos | ✅ feito | — | `lote-jogos-mente.png`, `lote-jogos-refugio.png` |  |
| A16 | Caderno arte própria | ✅ feito | — | `lote-exploracao-caderno.png`, `lote-forja-caderno.png` |  |
| A17 | 12 sombras | ✅ feito | — | 12 `dino-shadow-*`, `SHADOW_ART` completo | visual |
| A16b | Level up LU1-3 | ✅ feito | — | `levelup/` banner, burst, frame + `levelup-banner-pt.png` (resolve a dúvida do PT) | visual |
| A18-EL1-3 | Linhas fada/industrial/planta | ✅ feito | — | `novos/{fada,industrial,planta}-*` (15), `novosSoulmonData.ts` |  |
| A18-EL4 | 54 pares | ✅ feito | — | `combinados/` 261 arquivos, `139-fogo_fatuo` a `192-estufa`; `enemyRosterData.ts` | contagem exata dos 54 |
| A18-EL5 | Triplas | ✅ feito | — | `205-pestilencia`, `206-maldicao`, `207-cyber` (doc pedia 193-195) |  |
| A18-EL6 | Sigilos simulador | 🟡 parcial | Arte | `Class-System/assets/sigilos/fam_planta.png` achado; fada e industrial não por esse padrão | nomes reais |
| A18-EL7 | Ícones simulador | ⬜ aberto | Arte | `D:/Soulmon/Class-System/assets/icones-elementos` vazio ou ausente | outro clone |
| A18-EL8 | FX 3 elementos | ✅ feito | — | `fx-ataque/fx-{fada,industrial,planta}-*` |  |
| A18-EL9 | Pet-box temático, opcional | ⬜ aberto | Arte | Nenhum em `assets/backgrounds` | opcional |
| A19 | Arena por elemento | ⚰️ órfão | — | Retirada, §180; `arenaSceneOfSeed` |  |
| A20 | Selo recorde | ✅ feito | — | ver B5 |  |
| A-sereia | sereia-pintora | 🟡 parcial | Arte | `npcs/npc-n-sereiaPintora.png` 726x1100, `NOVO_NPC_ART`; `areaNpcVoice.ts`: "SEM CHAMADA HOJE" |  |
| A21-1 | zona-forja | ✅ feito | — | 512², `d390ba0dd` |  |
| A21-2 | bg-mapa, opcional | 🟡 parcial | Arte | Arquivo é de 30/09, plataforma da Forja não redesenhada | visual |
| A21-3 | bg-forja | ✅ feito | — | 760x1344, `a348d8447` |  |
| A21-4 | lote-forja-ferreiro/oficina/caderno/refugio | ✅ feito | — | 4 de 512² RGBA |  |
| A21-5 | lote-lab-biblioteca/vinculo/evolucao-v2 | ✅ feito | — | 3 de 512² RGBA; `LABORATORIO_LOT_ART` |  |
| A21-a | Anfitriã própria da Forja | ❓ decisão | Dono | `AREA_NPC_ART.forja` = `npcFForjaFerreiro` (Vitra) |  |
| A21-b | Fundo novo da Exploração, 3ª masmorra | ❓ decisão | Dono | `bg-exploracao.png` mantido |  |
| A21-c | Plataformas vazias | ❓ decisão | Dono | Sem arte nova | visual |
| A21-d | Bustos Tinta e Zumi | ❓ decisão | Dono | Doc; `laboratorio:amigos` existe |  |
| A-faisca | Faísca | ✅ feito | — | `icones-ui/item-faisca.png`, `itemArt.ts` `itemSpark` |  |
| A-quadro | quadro-ranking | ✅ feito | — | `10ad02468`; `MinigameModeGate.tsx` importa e usa `borderImage` | 512² em vez de 96² |
| A22-1 | Prédio do Drive | ✅ feito | — | `lote-lab-biblioteca-v2.png`, `91bb9b765` |  |
| A22-2 | Anfitriã e nome | ✅ feito | — | `npc-laboratorio-biblioteca-glifa.png`; `areaNpcVoice.ts` "Glifa, a arquivista" | dono ter validado Glifa |
| A22-3 | Propostas Restinho, Guarda-Fogo, rodada Cubone | ❓ decisão | Dono | Sem arquivo; não baixadas | conversas no ChatGPT |
| A-hex1 | Arte hex (mapa, 5 slots, forjar) | ✅ feito | — | `soulmon/hex/*` 7 PNG; `HEX_ART`, `HEX_MAP_ART` | visual |
| A-hex2 | `TODO hexsmith-ui` | ✅ feito | — | TODO só no doc; `nav/AreaView.tsx` abre `HexsmithSheet` |  |
| A-hex3 | Vínculo mínimo e aprovação da arte | ❓ decisão | Dono | `gates.ts` e `_gates.js` `forja.hexsmith` minBond 2 |  |
| A-feira | bg/feira-batalha.png | ⬜ aberto | Arte | Arquivo ausente; `FEIRA_SCENE` cai em `visor-feira.png` |  |
| A-108 | 108 cosméticos (32 bg, 32 frame, 44 furn) | ⬜ aberto | Arte | 0 de 108 ids em `src/assets`; 0 ids referenciados em `src`/`functions`; fila `bc4a862cb` |  |

## 7. Docs de origem defasados

`BACKLOG-PRODUTO`, `PEDIDOS-DO-DONO` e `ASSETS-A-GERAR` marcam como aberto o que já está na `main` (B3–B5, D1–D3, E1–E3, F1, H4, loja do clã, Gerar de novo, rookie, silhuetas, §20–§22, Faísca, quadro, hex). Em caso de dúvida, vale a tabela acima.
