# Checklist — revisão 2 do dono (2026-10-18)

Status: `[ ]` aberto · `[~]` em andamento · `[x]` feito+verificado (PR/commit citado).
Verificador: agente `general-purpose` "verificador" confere cada item contra o código/PR e marca aqui.

## Faixa A — Home / Tarefas / Missões
- [x] A1 (PR #385) Home, lista Tasks: remover opção de editar; tocar em qualquer lugar da tarefa = marca como feita.
- [x] A2 (PR #385) Ao marcar, aparecem 2 avisos no topo (comida +"2 de 4 hoje"); deixar só o "dia andu" (progresso do dia), remover o outro.
- [x] A3 (PR #385) Editar tarefa só pelo "View all" (edita qualquer uma).
- [x] A4 (PR #385) View all: campo de busca + filtro/ordenação.
- [x] A5 (PR #385) Quests: concluídas/prontas para claim sobem para o topo da lista.
- [x] A6 (PR #385) First Times: some quando o usuário completou todas.

## Faixa B — Configurações / Perfil / Descanso / Energia / Modais
- [x] B1 Auto sleep vem LIGADO por padrão, 23h–7h. — PR #387
- [x] B2 Investigar por que o pesadelo não apareceu hoje (bug ou regra?) e reportar/corrigir. — PR #387
- [x] B3 Profile: frames com botão de comprar estão travados/sem compra — corrigir (comprar funciona). — PR #387
- [x] B4 Conta/Notificações: todas as opções de notificação ligadas por padrão (pedir permissão quando fizer sentido). — PR #387 — PR #387 + ajustes (§94): o app pede a permissão nativa na primeira abertura (já existia, `App.tsx` efeito "PRIMEIRA ABERTURA") e, concedida, o interruptor geral liga; os de refeição já nasciam ligados
- [x] B5 Rest: deixar só o horário do auto sleep; remover "métrica de sono". — PR #387
- [x] B6 Investigar e reportar estado da contagem de passos e monitoramento de sono (existe? funciona no Android/Capacitor?). — PR #387
- [x] B7 Energia NÃO zera na virada do dia (remover reset diário). Fome continua caindo ao longo do dia. — PR #387
- [x] B8 Profile: usuário pode alterar o próprio nome. — PR #387
- [x] B9 Remover modal "Good morning / picking your focus…" (Set / Not today, thanks) — substituído pelo de checkboxes. — PR #387
- [x] B10 Remover as janelinhas "seu pet tem algo pra você / request" (notificações in-app desse tipo). — PR #387 · ajustes (§94): o cartão-convite de refeição (`MealInviteCard`, fila de avisos) removido do app
- [x] B11 Remover NPCs Tobi, Faro e Sona (localizar onde aparecem e tirar sem quebrar referências). — PR #387

## Faixa C — Mercado / Mochila / Soulsmith / Biblioteca / Amigos / Dungeon
- [x] C1 (PR #388) Mochila: abas Food, Specials (little heart, chips…), Materiais (nova).
- [~] C2 (PR #388) Mercado > Achievements: itens bloqueados com cadeado; itens liberados com botão Comprar + preço (backgrounds, ex. Dino Valley — bug visual — e qualquer outro item de conquista). — **verificação: cadeado e Comprar+preço confirmados; o "bug visual" do Dino Valley segue não reproduzido (precisa de print)**
- [x] C3 (PR #388) Mercado: Backgrounds + Frames juntos (Panora vende os dois); separar Frames / Backgrounds, e dentro, sub-aba Bits / Honra.
- [x] C4 (PR #388) Soulsmith: botão Upgrade à direita, na linha do nome do item; atributos abaixo do nome; materiais necessários abaixo do Upgrade; remover texto "materials are still missing".
- [x] C5 (PR #388) Dungeon: tela de entrada com informação demais — enxugar; remover HP 100% (sem relevância).
- [x] C6 (PR #388) Biblioteca (hall): busca "search by name" = nome do Soulmon/criatura; lista todo Soulmon que o usuário já viu (inclusive NPC), ordem alfabética.
- [x] C7 (PR #388) Friend Circle: campo para digitar nome do amigo e adicionar (hoje não adiciona); botão com moedinha → ícone de presente (se for presente).

## Faixa D — Arte / Assets / Visual
- [x] D1 (PR feat/faixa-d-arte, §88) Gerar assets dos materiais (lista de materiais do Soulsmith/crafting).
- [x] D2 Soulsmith: sprite do item muda a cada N níveis (copper→bronze→silver→golden core…; definir tier após golden) — gerar assets + ligar no jogo.
- [x] D3 Modal do pesadelo: visual sombrio (preto, aberração cromática, glitch), usar os assets de sombra de pesadelo (hoje aparece triceratops de fogo); remover botão "Not now" (fechar basta); trocar texto "standing its way to fight nightmare".
- [x] D4 Banners do Guild Hall (strand) muito pixelados — corrigir; caçar outros quadradinhos pixelados em outros lugares. — ajustes (§94): cenário pintado do combate (`BattleStage.tsx`) suavizado; sprites seguem pixelados
- [~] D5 Backgrounds gerados em paisagem sendo esticados em retrato — regerar em retrato.
- [x] D6 Prédio do jornal e Focus fora do tema (já comentado antes) — ajustar ao tema.

## Faixa E — Onboarding (PR #384, continuação)
- [~] E1 Dono decide dúvidas (a)–(e) do relatório do #384. — **só a decisão "nascimento antes do ovo" foi aplicada (PR #389, §93); as dúvidas (a)–(e) do relatório do #384 não estavam no repositório — dono precisa listá-las**
- [x] E2 Fome 0/3 exibida na chegada paga (hoje mostra 1/3 por piso do indicador). — **PR #389: `hungerDisplayLevel`**
- [x] E3 Merge do #384 (Actions bloqueado; só com OK do dono). — **#384 mergeado (dono autorizou sem CI)**

## Regras de execução
- Worktree em E:/soulmon-<x>, PR por faixa, REGISTRO §, testes verdes (tsc + vitest), docs/manual se criar módulo.
- Sem deploy manual (`wrangler deploy`); merge só com OK do dono (Actions bloqueado).
- Dúvida de produto → anotar aqui em "Dúvidas", não inventar.

## Dúvidas abertas
- **Faixa C (PR #388):**
  - C1: ícone dos materiais = emoji (placeholder); a faixa D liga os PNGs em `src/utils/materialArt.ts` (`MATERIAL_ART`, chave = id do material), sem tocar na Mochila.
  - C2: o "bug visual" do Dino Valley não foi reproduzido sem screenshot; a miniatura agora tem véu + cadeado quando bloqueada. Se for arte esticada, é a D5; se persistir, o dono manda um print.
  - C3: nenhuma moldura custa Honra, então Molduras > Honra fica vazia (padrão adotado: não criar moldura paga em Honra). A compra de moldura (`handleFrameBuy`, `utils/frameBuy.ts`) pode sobrepor o B3 (comprar moldura no Profile); no rebase, unificar no mesmo handler.
  - C5: "informação demais" = saiu o HP e a linha de plano encurtou (custo por camada e teto do Lv seguem no "?"). Dúvida: cortar também a linha de Ofício? Padrão: manter.
  - C6: "já viu" = Soulmons abertos na Biblioteca + amigos (H17 mantido); NPC só aparece depois de aberto. Dúvida: NPCs da demo sempre listados? Padrão: não.
  - C7: o diretório só devolve quem ligou a presença pública (pvpEnabled), então adicionar pelo nome só acha esses.
(os agentes preenchem)
- B9: entendi "o de checkboxes" como o `dayGoals` (reafirmar o dia) e desliguei `MORNING_COMMITMENT_ENABLED` (reversível). Confirmar.
- B10: removi só os balões de convite do pet (refeição e Refúgio) do `NoticeToast`. Se a "janelinha de request" era outra (cartão de refeição no HUD / `useCareSystem`), apontar qual.
- B5: o horário de descanso agora É o do sono automático (`rest.window` copia); o botão "lembrete de deitar" saiu junto. Confirmar.
- B6: sensor de sono não existe (decisão contra Health Connect); passos só no APK, falta teste em aparelho real.
- Faixa A / A2: "dia andu" interpretado como o progresso do dia (`📋 N/M do dia`); mantido só ele, removida a parte da comida. Se eram 2 avisos separados, confirmar qual outro some.
- Faixa A / A3: View all agora inclui hábitos e tarefas de hoje (para "editar qualquer uma").
- Faixa A / A5: ordem adotada = prontas para resgatar, depois já resgatadas, depois abertas (`missionOrder.ts`).
- Faixa A / A6: "completou todas" = todas RESGATADAS (não só feitas).
- **D2 (faixa D):** o 5º degrau após o dourado ("prismático", níveis 13–15) é definição minha; degrau a cada 3 níveis. Confirmar com o dono ou pedir outro nome/visual.
- **D5 (faixa D):** corrigi o único ponto que esticava (`GuerraVisor`) e o lightbox. Não regerei os 44 cenários 1200x648 em retrato: dizer QUAL tela mostra um cenário esticado (candidata: Diário de Aventuras em tela cheia, `cover` sobre paisagem). Regerar custa ~0,5 crédito/cenário mas troca arte já vendida.
- **D1 (faixa D):** ícones dos materiais ligados no Soulsmith; Mochila segue com emoji até a faixa C (abas) entrar (uma linha, ver §88).

## Resultado da verificação (18/10/2026, verificador/integrador)
Merges em `main`, nesta ordem: #384 (já), #385 (A), #387 (B), #388 (C), #386 (D), #389 (E) + PR da verificação. Antes de mergear cada um: rebase em `main`, `tsc` limpo e testes dos arquivos afetados verdes; depois do último, suíte cheia (822 arquivos) verde. Integrações feitas: REGISTRO renumerado (A passou de §81 duplicado para **§82**; B §90, C §92, D §88, E §93); `handleFrameBuy(id, equipar)` único no `App.tsx` (Mercado não equipa, Perfil/Torneio B3 equipa); `MaterialIcon` ligado na Mochila (mapa provisório `materialArt.ts` removido); 3 contratos quebrados pela D corrigidos (CSS do glitch no `index.css`, caixas dos lotes Caderno/Oficina + largura do Caderno 40→44%, manual `06-REFERENCIA`). Arte (D1/D2/D4/D6) conferida só por arquivo/código — não vi as imagens.

| Item | Status | Evidência (main) |
|---|---|---|
| A1 | ok | `pixel/RitualPanel.tsx:320` (`data-ritual-tap`, toque na linha marca; "Editar" só em `editOnly`, :329) |
| A2 | ok | `App.tsx:3072` (só `📋 N/M do dia`) |
| A3 | ok | `DailyRituals.tsx:291` (`renderEditOnly`), :218 lista tarefas e hábitos |
| A4 | ok | `DailyRituals.tsx:519` (busca `type="search"`), :531 (ordenar A–Z) |
| A5 | ok | `utils/missionOrder.ts:10` + usado em `DailyMissionList`, `BuildingQuestList`, `FirstTimesList`, `ShopShelf`, `MercadoSheets` |
| A6 | ok | `nav/MissionsSheet.tsx:133`, `FirstTimesList.tsx:34` |
| B1 | ok | `RestSetupModal.tsx:39-41`, `App.tsx:5622,5626-5627` (default ligado, 23:00–07:00) |
| B2 | ok (investigação) | REGISTRO §90 B2: sem bug; faltava noite registrada/janela separada, fechado por B1+B5 |
| B3 | ok | `App.tsx:4186` (`handleFrameBuy`) e :4279 (`handleBuyFrame` = mesmo handler, equipa); `ui/AvatarFrame.tsx:163` botão Comprar |
| B4 | parcial | `utils/mealRhythm.ts:62` (push/in-app ligados); geral depende da permissão (`notificationDefault.ts:31`) |
| B5 | ok | `RestSetupModal.tsx:81` (só sono automático); `RestWindowCard.tsx` (métrica) removido |
| B6 | ok (relato) | REGISTRO §90 B6; `package.json:11` pedometer, `utils/steps.ts:28-39` (sem sensor de sono); falta teste em aparelho |
| B7 | ok | `utils/dailyReset.ts:1281` (sem `setEnergy(...,0)`) |
| B8 | ok | `perfil/ProfileEditor.tsx:65`, `App.tsx:4282` |
| B9 | ok | `utils/checkIns.ts:45` (`MORNING_COMMITMENT_ENABLED=false`), `App.tsx:5132` |
| B10 | ok | `NoticeToast.tsx:9` (balões de convite do pet removidos) — ver dúvida |
| B11 | ok | grep de Tobi/Faro/Sona só acha comentários (`ui/FunctionNpcNote.tsx:8`) |
| C1 | ok | `home/Mochila.tsx:266` (aba Materiais), ícones via `MaterialIcon` |
| C2 | parcial | `mercado/ShopShelf.tsx:349,355` (cadeado/bloqueado), `MercadoC.render.test.tsx:17-40`; bug Dino Valley não reproduzido |
| C3 | ok | `mercado/MercadoSheets.tsx:79` (Molduras/Backgrounds), `FrameShelf.tsx:70`; Honra vazia por desenho |
| C4 | ok | `ForgeCard.tsx:172` (Upgrade à direita + custos abaixo), :189 sem texto de "faltam materiais" |
| C5 | ok | `DungeonGame.tsx` (HP 100% e custo por camada fora do lobby) |
| C6 | ok | `LibraryPage.tsx:258` (vistos + NPCs, filtro por nome, ordem alfabética) |
| C7 | ok | `LibraryPage.tsx:267` (`addByName`), :496 ícone `volunteer_activism` |
| D1 | ok (arquivos) | 16 PNG em `assets/soulmon/materiais/`, `MaterialIcon.tsx`, Soulsmith `ForgeCard.tsx` e Mochila |
| D2 | ok (arquivos) | `utils/forgeVisual.ts:19`, `ForgeCard.tsx:161`, 36 PNG `combate-v3/equip/eq-*-n2..n5` |
| D3 | ok | `NightmareBattle.tsx:116,425`; sem "Not now"; `index.css` `.nm-glitch*` |
| D4 | parcial | `Casa/Grove/GuerraVisor`, `GroveMilestoneCeremony`; Feira corrigida agora; ver D4 acima |
| D5 | parcial | `GuerraVisor.tsx:39` corrigido; 44 cenários não regerados (aguarda dono dizer a tela) |
| D6 | ok (arquivos) | REGISTRO §88 D6; `areaLotGeometry.ts:39,41` remedidos |
| E1 | parcial | `SoulmonOnboarding.tsx:973-974,1384` (nascimento → ovo → Chocar vai à geração), `gateDraft.ts` persiste os dados |
| E2 | ok | `utils/hunger.ts:273` (`hungerDisplayLevel`), `home/HungerIndicator.tsx:38` |
| E3 | ok | #384 mergeado |

### Dúvidas para o dono (acrescentadas)
- **E1:** quem escolhe o Soulmon guia (demo) agora também responde nome/data/hora/cidade antes do ovo (ordem única, o 18+ da data vale para todos). Aceita? Quais eram as dúvidas (a)–(e) do relatório do #384?
- **B4:** o interruptor geral de notificação só nasce ligado se o Android/navegador já concedeu a permissão; senão fica desligado até o priming. Quer pedir a permissão já na primeira abertura?
- **D4:** o cenário de combate (`BattleStage.tsx:751`) segue `pixelated`; é arte pintada que deve suavizar?
- **Caderno:** o lote do Caderno ganhou 40→44% de largura para a arte repintada (mais estreita) não ficar minúscula; conferir a olho no Mapa.
