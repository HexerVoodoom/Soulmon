# Guilda — notas da implementação do cliente, fatia B1 (29/09/2026)

Fatia B1 = salas do Bosque, gestos e cerimônia de marco. A Feira (sala/lote, golpe, resgate) é a B2 e NÃO foi tocada.
Dono do que mora onde: `utils/groveStage.ts` (quem aparece no visor, puro) · `utils/groveLocal.ts` (memória de UI do aparelho +
entrega de cenários) · `hooks/useGroveWatch.ts` (o App olha o Bosque) · `components/guild/GroveVisor.tsx` ·
`components/guild/GroveMilestoneCeremony.tsx` · salas em `components/guild/GuildSheet.tsx` (`SalaBosque`/`SalaRoda`/`SalaMural`).

## Desvios e escolhas registradas

1. **O fio vale a meta de CORAÇÃO** (`heartGoalFor`, G1): o servidor já confere `META_DO_FIO = 'heart'`. O `App` calcula
   `fioGoal = {done, heart, full}` (peso de esforço) e `fioMetaCumprida = dailyTotal > 0 && dailyDone >= heartGoalHoje`; a folha não
   decide meta nenhuma (há teste de fonte). O `CoopPanel`/`LibraryPage` legados seguem com a meta inteira (não mexi).
2. **Estado "fio ainda não firmado" = SILÊNCIO**, como na fatia A; o visor e a regra sóbria (`guild.bosque.regra`, linha FIXA do
   documento) ficam sempre. O teste antigo que vetava a palavra "própria meta" foi estreitado para a frase velha do CoopPanel.
3. **Palco do Bosque** (`groveStage.ts`): ≤4 membros → todos, na ordem de chegada, a sua em 128 e as dos outros em 64 (escalas
   INTEIRAS do sprite 256/384); 5–12 → só a sua, no centro. Nada lê presença (contrato de fonte). O servidor não manda linha nem
   estágio de ninguém (LV-G10, `line` nunca foi implementado), então a criatura dos OUTROS é uma das nossas 9 linhas (rookie) por hash
   do id opaco do membro: mesma pessoa, mesma criatura. A distribuição horizontal conta o tamanho (a grande não come a vizinha).
   **Não feitas:** "poses de trabalho", rotação por seed, e "tocar leva o seu pet a dar uma volta" (§6) — dependem de arte/desenho.
4. **Cenários `bg-guild-*`** entram em `PET_BACKGROUNDS` como PLACEHOLDERS em gradiente (teal/videira/cobre; sem magenta/roxo/rosa),
   `outdoor`, `horizonY: 66`, fora de `SHOP_BG_ACCENTS` (fora da loja e da masmorra) e com miniaturas 96×52 geradas da mesma CSS
   (o `artMaps.contract` exige 1:1). Quando `mine.groveScenes` chega `true`, o `useGroveWatch` entrega `bg-guild-<estágio>` até o
   estágio atual em `ownedBackgrounds` do SAVE (idempotente, fora de updater) — é isso que faz ficar com quem sai (G12).
   ⚠️ **Lacuna real: não há superfície para EQUIPAR.** A vitrine (`ShopShelf`/`mercadoCatalog`) só lista itens do catálogo; um `bg`
   que só está em `ownedBackgrounds` fica invisível. A copy `guild.marco.cenario` ("Está entre os seus cenários") promete o que a
   UI ainda não entrega. Precisa de decisão de design (linha "Cenários do bosque" no Background? entrada no Mural?) — não inventei.
5. **Gestos**: ícones `pan_tool` (Aceno) / `light_mode` / `bedtime`. `waving_hand` NÃO está no subset e regerar a fonte exige rede +
   `CACHE_VERSION`; `pan_tool` (mão aberta) já está no inventário. Um teste lê o inventário de `tokens.md` e exige os três nomes.
   Roda de 1 não desenha a fileira. **B5 do backend (3b7bb1d3):** com <3 membros o servidor NÃO manda o tipo recebido, só
   `gestureReceived: true|null` → nova chave **PENDENTE** `guild.gesto.recebido.agregado` ("Alguém fez um gesto para a roda." /
   "Someone made a gesture for the circle."), ainda sem o `soulmon-narrative-critic`. Com 3+ vale a lista de tipos (nunca as duas).
6. **Mural** (`SalaMural`): marcos (nome do estágio, com a DATA que ESTE aparelho viu — o servidor não tem data de marco) e peças de
   maré (`ornaments`: nome do tamanho + "Floração colhida, {data}"). Vazio é silêncio, nem título. A floração EM ANDAMENTO
   (`bosque.tide.size`) não é mostrada: não há copy para ela e seria uma meta com estado. Sem "boas-vindas anônimas" (`guild.mural.boasvindas`):
   o servidor não manda data de chegada.
7. **Cerimônia** (`GroveMilestoneCeremony`): reusa `RitualDialog` (z 300, trap, Escape = mesmo `onDone`). A fala do pet aparece como
   TEXTO dentro da cerimônia (o `speak()` mora no App/CompanionHUD e a cerimônia é um intersticial). Só da Ramagem em diante (a copy
   não tem marco de Clareira). O aviso da Home é o `marcoBosque`: depois de `carga`, antes de `termos` (o teste "`termos` é o último"
   continua valendo — o aviso é o último dos que falam do dia, e some na virada do jogador).
8. **Memória do aparelho** (`STORAGE_KEYS.GUILD_LAST_STAGE`, uma chave; a segunda do plano, `thread-day`, não foi necessária):
   `{gid, index, base, tracked, joinedDay, marks, pending, scenes}` — id PÚBLICO, índices e datas; nada de nome/código/contagem
   (teste). 1ª vez que o aparelho vê a roda = BASELINE (sem cerimônia, sem aviso: `base`); roda diferente recomeça; sair apaga.
   Só quem já tem memória de roda no aparelho é consultado pelo App (sem timer; ao montar e no `visibilitychange`).
9. **Telemetria**: `guild_create`, `guild_join {size}`, `guild_leave {size, weeks}`, `guild_thread {kind:0}`, `guild_stage {level}`.
   `guild_raid` é da B2. `weeks` (o servidor só declara 0..3) ficou: 0 = <1 sem, 1 = 1–3, 2 = 4–11, 3 = 12+, contada a partir do dia
   em que ESTE aparelho viu a roda (subestima quem entrou por outro aparelho). `TelemetryProps` ganhou `size`/`weeks`/`outcome`.
10. **Erros novos** sem alerta: `goalNotMet` (400) e `dailyLimit` (429 daily limit) recarregam em silêncio; o botão certo aparece.

## Contrato do backend (loop 2) absorvido

`members[].pid` saiu; `members[].id` = `memberId` opaco (16 hex por guilda) e `presence[]` = `{memberId, cameToday}` — fixtures
trocadas, o sprite dos OUTROS muda uma vez (a semente mudou) e nada usa esse id em `community?action=player` (régua de fonte).
`progress` vem `null` com 5+ (já descartado por `sanitizeGuildView`, agora com teste). `gestureReceived` lido (item 5).
**Para a B2:** `guildClaim` devolve `claimed.receipt` (e o 409, também) — o cliente credita Emblemas UMA vez por recibo. Onde guardar
os recibos creditados é decisão pendente: `guildNoSave.contract.test.ts` admite só duas chaves de conveniência (`last-stage`, já
usada, e `thread-day`, que a B1 não precisou) — a B2 pode usar a segunda com o nome que o plano já reserva, ou pedir ao dono a
terceira (o teste terá de mudar junto).

## Não feito nesta fatia (fora do escopo ou dependente)

- Feira (lote, sala, golpe, resgate) e o troféu Concha da Maré: fatia B2.
- `GuideModal`/`HelpModal` (chaves `guild.help.*`/`guild.guide.*`), NPC/pet falando (`guild.retorno.pet`, `guild.bosque.fio.pet`),
  widget com o nome do estágio, arte real dos `bg-guild-*`.
- Superfície de equipar os cenários (item 4). Demo → `UnlockNudge` (`guild.erro.demo`, herdado da fatia A).

## O que a régua trava (e onde)

- `GuildSheet.render.test.tsx` (106 casos): Bosque por estágio (5 × PT/EN), `perto` binário, palco ≤4 × 5–12, presença que não
  mexe no palco, fio com `goal`, gestos (enviado/limite/duplo toque/foco/inventário de ícones), Mural, memória e telemetria,
  movimento reduzido (JS e CSS canônico). `GroveMilestoneCeremony.render.test.tsx`, `useGroveWatch.test.tsx`, `groveStage.test.ts`,
  `groveLocal.test.ts`, `community.guild.test.ts` (sanitização).
- `guildSemCobranca.contract.test.ts`: placeholders permitidos, `perto` sem número/razão, gestos anônimos, cerimônia sem "parabéns",
  toda chave da B1 no documento (exceto a PENDENTE explícita), fonte sem sort/presença/estágio de membro.
- `filaDeAvisos.contract.test.ts`: `groveMilestone` na ordem certa da união E da cadeia, montada uma vez, z 300, sem timer;
  `marcoBosque` depois de recomeço/carga e antes de termos; o fio pela meta de coração; entrega de cenário só no efeito do hook.

## Verificação visual

`docs/reviews/guilda/qa/shots-fatia-B1/` (14 PNG, 390×844, `vite` dev + Playwright, `/api/guild` mockado por `page.route`, save
por `addInitScript`): os 5 estágios em PT-claro e EN-escuro (4 membros com presença · 3 com `perto` e fio firmado · 12 com agregado ·
3 com gestos recebidos · 2), roda+gestos+Mural rolados, a cerimônia PT-claro e EN-escuro e o aviso da Home. `dist/` não foi tocado
(não rodei `npm run build`). **Não capturado:** o botão "Firmar meu fio" (exige save com a meta de coração cumprida — coberto por
teste) e o contraste medido por pixel (todo texto novo usa `--sm2-*`; a medição por pixel fica para a passada de QA).

## Mutação (cópia em /tmp/mut, 32 mutantes, 32 mortos)

Palco ordenado por presença · 5+ desenhando todos · criatura "apagada" · `perto` sem guarda de próximo · fio sem a meta · fio sem `goal` ·
`goalNotMet`/`dailyLimit` viram alerta · gestos numa roda de 1 · recebidos com contagem · Mural com título vazio / com a ordem
revertida / sem data · cerimônia fechando sozinha / animada com movimento reduzido · `groveMilestone` depois do sonho · aviso depois de
`termos` · baseline virando marco / aviso · entrega de cenário não idempotente / ausente · hook consultando sem memória · telemetria com
id · sair sem apagar a memória · estágios trocados · Clareira com cerimônia · dígito na copy de `perto` · vidro com nomes · meta inteira no
fio · memória guardando o nome · agregado do gesto removido · visor lendo o estágio de outro membro. (Na 1ª rodada sobreviveram
"meta inteira no fio" e "visor lê estágio de outro membro" — o teste de fonte não olhava a definição de `fioMetaCumprida` nem o
`(m as any).stage`; ambos passaram a ser travados e morreram.)

## Vermelhos que NÃO são desta fatia

`orcamentoDeBytes` e `convertToWebp` (pré-existentes) · `docsManual` (a) `reviews/guilda/qa/L2-backend.md` e este arquivo sem entrada
no `00-MAPA.md`, (c) os cinco módulos novos (`groveLocal`, `groveStage`, `GroveVisor`, `GroveMilestoneCeremony`, `useGroveWatch`) sem
entrada em `06-REFERENCIA/` — é trabalho do `doc-mantenedor` (`/manter-docs`); não toquei `docs/manual/`. O `App` passou a importar
`guildCopy`/`groveLocal`/`useGroveWatch` estaticamente (a folha segue lazy): confira o orçamento do JS de entrada num build real.
