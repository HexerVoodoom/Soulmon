# L3 — Conformidade da Guilda implementada × plano × linhas vermelhas

> **Autor:** `guarda-linha-vermelha` · **Data:** 29/09/2026 · **Branch:** `ccr-1aa8b7db-xk45mh`
> **Etiqueta:** registro (auditoria SÓ-LEITURA; nenhum código de produto foi tocado).
> **Contra:** `docs/PLANO-GUILDA.md` §3, §4, §5, §6, §7, §8, §10, §11, §13, §14, §15 · `ledger/vetos.md` · `02-psicologia.md` §8 · as 21 linhas vermelhas (`manual/01-VISAO.md` §7).
> **Método:** leitura de `functions/api/guild.js`, `_coop.js`, `account.js`, cliente (`GuildSheet.tsx`, `community.ts`, `guildRules.ts`, `groveStage.ts`, `App.tsx`) e **respostas reais**: script que roda `onRequest` de `guild.js` sobre KV falso (o mesmo mock de `guild.vista.test.js`) e imprime a vista com 1, 4, 5 e 12 membros + erros.

## 0. Portões

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npx tsc -p tsconfig.server.json --noEmit` | exit 0 |
| `npx tsc -p desktop/tsconfig.json --noEmit` | exit 0 |
| `npx vitest run` | 421 arquivos, 5883 passam, **4 falham** em 3 arquivos: `orcamentoDeBytes` (conhecido), `convertToWebp` (conhecido) e **`docsManual` (2 casos)** — ver abaixo. |

`docsManual` vermelho por entradas faltando:
- (a) sem entrada no `00-MAPA.md`: `reviews/guilda/qa/L2-backend.md`, `reviews/guilda/qa/impl-notas-front-b1.md` (e este `L3-conformidade.md`, ao ser commitado).
- (c) sem entrada em `06-REFERENCIA/`: `src/utils/fairArt.ts`, `src/utils/groveLocal.ts`, `src/utils/groveStage.ts`, `src/utils/guildClaimLocal.ts`, `src/hooks/useGroveWatch.ts`, `src/components/guild/FeiraVisor.tsx`, `src/components/guild/GroveMilestoneCeremony.tsx`, `src/components/guild/GroveVisor.tsx`, `src/components/mercado/GuildOwnedShelf.tsx`.

## 1. Respostas reais (resumo do que trafega)

- **1 membro**: `presence:[{cameToday:true}]`, `threadedToday:null`, `progress:0,target:5`.
- **4 membros**: `members[].apareceuHoje` **e** `presence[].cameToday` com **`false` explícito para os 3 que não vieram**; `progress:0,target:20`.
- **5 e 12 membros**: `presence:null`, sem `apareceuHoje`, `threadedToday:true` (booleano), `progress:null`, `target:25/60`.
- Em todos: ids opacos (`idOpacoDoMembro`), nenhum `saveId`/`pid`/`hostSave`/`stage`/`hp`/`dmg`/`attrs`; `raid` só com `state`, `ferido` (bool), `lastWeek`, `mine.hitToday`; `bosque` só `stage/stageIndex/perto/tide/ornaments`.
- Erros: 409 `guild full` (13º) · 429 `daily limit` (2º golpe) · 403 `not host` · 400 `invalid name` (`insta: fulano`) · 404 `invalid code` · 400 `goal not met` · 400 `invalid day` (fora de ±1) · `guildLeave` 200 `{ok:true}` duas vezes (idempotente). Nenhuma mensagem de erro cobra ou nomeia alguém.
- Exportação (`account.js`, bloco `coopExport`): `grupo {id,name,joinedAs,myDistinctDays,myLastThreadDay,myHitsThisWeek}` + `recompensas {claimedWeeks,guildScenes,shellWeeks}` — só do titular, sem dado de outro membro, sem dano. Conforme §10.6.

## 2. Achados

### FATAL — 0

Nenhum caminho expõe saveId, estágio/HP alheio, contribuição por pessoa, faz o Bosque descer, cobra por push/widget, recompensa contagem de tarefa, vende nada da guilda ou usa streak que zera.

### ALTO — 2

**A-1 · Sair custa Emblemas já conquistados (LV-G5 "sem perda"; linha vermelha "sair custando algo").**
`functions/api/guild.js` › `handleGuild`, ramo `guildRewards`/`guildClaim`, função `direito`: `if (!g) return null` — sem guilda não há direito. E `_coop.js` › `coopLeave` apaga `coopHit` das últimas 4 semanas. O resgate é **manual** (`GuildSheet.tsx` › `colher`). Cenário: a pessoa golpeou na semana passada (Feira recuou → 2 Emblemas, ou dissipou → 4 + passo para a Concha), não abriu a folha de resgate e toca "Seguir o próprio caminho": o direito some, até 3 semanas × 4 Emblemas. O botão de sair diz "sem perda".
*Correção mínima:* resgatar automaticamente os `pending` antes do `leaveGuild` no cliente **e** (servidor) em `coopLeave` gravar `coopClaim` pendentes como crédito devido (ou manter `coopHit` + derivar direito sem exigir guilda atual). Teste: `guild.recompensa.test.js` — "golpeou, saiu, `guildRewards` ainda lista a semana".

**A-2 · G1 implementado sem decisão registrada — e o plano diz o contrário.**
`_coop.js` › `META_DO_FIO = 'heart'` e `App.tsx` (`fioMetaCumprida` com `heartGoalFor`) dizem "G1, decidido pelo dono". Mas `PLANO-GUILDA.md` §3 linha 🧵 e §15 G1 dizem "este plano segue a letra (inteira) até a confirmação", e `STATUS.md` ainda lista G1 como **pendente**. Não há linha no `REGISTRO-DE-DECISOES.md`. O guarda apoia `heartGoalFor` (é o que a psicologia e este ledger recomendaram), mas "decidido pelo dono" num comentário sem registro é drift sem decisão — exatamente o que a linha da Camada 3 proíbe.
*Correção mínima:* registrar G1 = `heartGoalFor` no `REGISTRO` (data, quem) e reescrever §3 🧵/§15 G1 do plano e o `STATUS.md`; se o dono não confirmar, trocar a constante.

### MÉDIO — 5

**M-1 · Estado de ausência no payload com ≤4 (LV-G2, ressalva do parecer "Obs 2").** `guild.js` › `vistaDaGuilda` emite `apareceuHoje:false` e `presence[].cameToday:false` para quem não veio. A UI só marca quem veio (`GuildSheet.tsx`, `m.apareceuHoje === true`), mas o parecer fechou LV-G2 como "nunca mostra um ESTADO de ausência" e o payload é superfície (qualquer cliente lê). *Correção:* emitir só `true` (omitir a chave quando não veio) e ajustar `guild.vista.test.js`.

**M-2 · Sair zera o progresso para o cenário (`STAGE_UNLOCK_DAYS`).** `coopLeave` apaga `coopFio` (onde vive `distinctDays`). Quem tinha 6 dos 7 dias e volta recomeça de 0. É progresso, não moeda (regra "perda só sobre recuperável"). *Correção:* guardar `distinctDays` numa chave do titular fora da guilda (como `coopScenes`) ou somar ao voltar.

**M-3 · Número semanal `progress/target` ainda trafega com ≤4, e zera toda semana.** `vistaDaGuilda` mantém `progress`/`target` (a barra do coop antigo, que tem estado "não bateu" e é um número que DESCE na virada). O cliente descarta (`community.ts` › `sanitizeGuildView`) e o `CoopPanel` virou reexport do `GuildSheet`, então os aliases `coop*` (`COOP_ALIASES`) não têm mais consumidor — WPG-8 pedia a remoção. *Correção:* remover `progress/target` e os aliases.

**M-4 · WPG-15 não feito: `STATUS.md` e manual mentem por omissão.** `STATUS.md` ainda abre com "Plano da Guilda — PLANO, sem código" e G16 pendente; `manual/02-REGRAS-DE-NEGOCIO.md` e `01-VISAO.md` não têm a Guilda; a bíblia não ganhou §7.1/§12; `docsManual` vermelho (§0). O plano (`PLANO-GUILDA.md` cabeçalho) diz "Nada aqui está implementado". *Correção:* passe `/manter-docs` + `/squad-narrativa` (WPG-15).

**M-5 · Régua de LV-G6 prometida não existe.** `src/utils/guildReward.contract.test.ts` (§3 🎁, §13 LV-G6, aceite do WPG-5) não foi criado. A conformidade existe em código (`bg-guild-*` fora de `SHOP_BG_ACCENTS` e da loja; Concha com `price:0` + `unlock`; Emblemas só em `TOURNAMENT_ITEMS`), mas nada reprova a regressão. *Correção:* criar o contrato (nenhum `bg-guild-*` em `SHOP_BG_ACCENTS`/loja; `GUILD_ITEMS` sem preço; nenhuma ação `guild*` toca `ent:`/Créditos).

### BAIXO — 5

- **B-1** `hpBand 0..10` (§10.3) virou `raid.ferido: boolean` e `lastWeek`. Mais conservador que o plano (aprovado), mas **divergência não registrada** no plano.
- **B-2** `threadedToday` é derivado de `veio` (check-in **ou** fio), não só de fio: com 5+ ele diz "o bosque recebeu fios" num dia em que só houve check-in. *Correção:* usar `firmou`.
- **B-3** Cenário "quem estava na virada do marco" (§3 🎁, §7) **não implementado** — só os 7 dias distintos liberam. Mais restritivo, não fere linha vermelha; registrar.
- **B-4** `App.tsx` calcula `heartGoalFor`/`registeredForDay` com `new Date().getDay()`/`toDateString()` (dia do APARELHO), enquanto o `dayKey` enviado é o dia do jogador. Em fuso diferente, a meta avaliada pode ser a de outro dia. Baixo impacto (o fio é afirmação do cliente).
- **B-5** Ícone do aceno é `pan_tool` (no subset), não `waving_hand` (§4). Resolvido por outro caminho; registrar no plano.

## 3. Decisões G1..G17 × código

| G | Plano | Código | Situação |
|---|---|---|---|
| G1 | inteira até confirmar | `META_DO_FIO='heart'` | **diverge, sem registro** (A-2) |
| G2 | Guilda/roda | `guildCopy.ts` | fato |
| G3 | semente v1.1 | não existe (`invalid kind`) | fato (não feito, correto) |
| G4 | nominal ≤4 | `PRESENCA_NOMINAL_MAX=4` | fato (ressalva M-1) |
| G5 | marés 6 sem | `mareDe`, `colherMare`, `TIDE_*` | fato |
| G6 | UTC → override §0.1 dia do jogador ±1 | `diaDoJogador` (±1), `atualizarBosque` fecha até UTC−2, `semanaAindaAberta` | **fato; §0.1 descreve e o código cumpre** (§3 🧵 ainda diz "dia UTC" — texto velho) |
| G7 | sem expulsão | não existe `guildRemove`; `guildNewCode` apaga código velho | fato |
| G8 | sem escola | — | fato |
| G9 | 4/2 a quem golpeou | `RAID_EMBLEMS`/`_FLOOR`, `direito` | fato (A-1) |
| G10 | 10+2sp ±20%, HP max(ativos,3)×45 | `raidDamageFor`, `raidHpFor`, `crypto` | fato; `guild.simParidade.test.js` |
| G11 | semana ISO | `semanaDoDia` + tolerância seg 12:00 UTC | fato |
| G12 | cenário fica com quem sai | `coopScenes:<save>` sem TTL, não apagado no leave | fato |
| G13 | ≤4 criaturas só em ≤4 | `groveStage.ts` › `groveCreatures` (5+: só a própria) | fato; sprites dos outros por hash do id opaco, nunca estágio real |
| G14 | Feira roda × fenômeno | `RAID_PHENOMENA`, sem outra guilda | fato |
| G15 | sem gate de Vínculo | só teto diário | fato |
| G16 | exceção | registrada no `REGISTRO` (linha Camada 3, 29/09) | fato; `STATUS.md` ainda diz pendente (M-4) |
| G17 | (a) sem TTL com Bosque>0 | `gravarGrupo` › `semPrazo`, índices e `coopFio` sem prazo | **fato** |

Paridade servidor×cliente (`src/utils/guildRules.parity.test.ts`): teto, nominal, nome, código, estágios, gestos, Emblemas, troféu, maré, fenômenos — **conforme** (lê o fonte do servidor). Não cobre `STAGE_UNLOCK_DAYS`/`BOSQUE_THRESHOLDS` porque o cliente não os tem — correto (o cliente não deriva estágio). `src/types/guild.ts` (§3.1) não existe; o papel é de `src/utils/guildRules.ts` — divergência de endereço, não de regra.

## 4. Varredura das linhas vermelhas

| Procura | Resultado |
|---|---|
| saveId/pid/hostSave na resposta | ausente (id opaco por guilda) |
| estágio/HP/dano/contagem por pessoa | ausente; `dmg` só no KV do próprio |
| quem faltou | ≤4: `false` explícito no payload (M-1); 5+: ausente |
| estado que diminui | Bosque só soma (`fecharDiasDoBosque` com `Math.max`); `unirConjunto` nunca remove; Concha/cenários só por união; Emblemas só `+`; sem TTL com Bosque>0. Guilda que esvazia some (plano §5, postal local) |
| agregado numérico + tamanho | 5+: não; ≤4: `progress/target` (M-3) |
| push/widget que cobra | `guild.semPush.contract.test.js` verde; nenhuma referência em `workers/`/`android/`; widget sem chave de guilda (WPG-14 não feito) |
| recompensa por contagem de tarefa | não: fio = 1 por meta de coração cumprida |
| Emblemas comprando vantagem | não: `GUILD_ITEMS` é cosmético, `TOURNAMENT_ITEMS` cosmético |
| streak que zera / dias seguidos | não: 7 dias **distintos** |
| punição por ausência | não; viajante sai do denominador em silêncio |
| sair custando algo | **sim, Emblemas pendentes (A-1)** e progresso dos 7 dias (M-2) |

"Isto perdoa demais": o piso de 2 Emblemas por um toque semanal continua no limite (já registrado); com o recibo determinístico (`reciboDoResgate`) não há como duplicar. Nada novo perdoa demais nesta implementação.

## 5. Tabela WP × entregue (§14)

| WP | Entregue? | Onde (arquivo › símbolo) | Teste que trava |
|---|---|---|---|
| WPG-0 copy | sim (parcial: sem tabela em `NARRATIVA-COPY.md` conferida) | `src/utils/guildCopy.ts` | `guildSemCobranca.contract.test.ts`, `narrativa.contract.test.ts` |
| WPG-W wireframes | **não** | `INVENTARIO-WIREFRAMES.md` sem GUI-01..16 | — |
| WPG-A fila de arte | **não** | `ASSETS-A-GERAR.md` sem `bg-guild-*`/`fx-fair-*` | — |
| WPG-1 | sim | `guild.js` › `vistaDaGuilda`, `COOP_ALIASES`; `_profile.js` | `guild.vista.test.js`, `community.coop.test.js` |
| WPG-2 | sim | `_coop.js` › `sanitizarNomeDeGuilda`; `guildRename`/`guildNewCode`; `coopLeave` (anfitrião) | `guild.nome.test.js`, `guild.anfitriao.test.js` |
| WPG-3a | sim | `firmarFio`, `fecharDiasDoBosque`, `bosqueStageFor`, `ehViajante`, `atualizarBosque` | `bosque.monotonic.test.js`, `guild.thread.test.js`, `guild.simParidade.test.js` |
| WPG-3b semente | não (G3 = v1.1, correto) | — | — |
| WPG-3c marés | sim | `mareDe`, `colherMare`, `g.ornaments` | `guild.mare.test.js` |
| WPG-4 Feira | sim (`ferido` no lugar de `hpBand`) | `raidHpFor`, `raidDamageFor`, `resolverFeira`, `guildRaidHit` | `guild.raid.test.js` |
| WPG-5 recompensas | sim, **com A-1**; cenário "virada do marco" ausente | `guildRewards`/`guildClaim`, `coopShell`/`coopScenes` | `guild.recompensa.test.js`; **`guildReward.contract.test.ts` ausente (M-5)** |
| WPG-6 conta | sim | `account.js` (`coopExport`, `apagarClaims`) | `account.coopExport.qa2`, `account.deleteConfirm.qa`, `account.guildBosque`, `account.guildFeira` |
| WPG-7 telemetria | sim | `metrics.js` › `EVENT_SCHEMA`; `telemetry.ts`; `track('guild_*')` | `telemetry.test.ts`, `metrics.test.js` |
| WPG-8 cliente | sim, **aliases não removidos** (M-3) | `GuildSheet.tsx`, `community.ts`, `CoopPanel` = reexport | `GuildSheet.render.test.tsx`, `guildNoSave.contract.test.ts` |
| WPG-9 push | sim | — | `guild.semPush.contract.test.js` |
| WPG-10 lote `'feira'` | sim (arte placeholder) | `areaSheetCopy.ts` › `ArenaLotId`, `areaNpcVoice.ts` | `areaLotsNovos.test.ts` |
| WPG-11 palco | sim | `groveStage.ts` › `groveCreatures`; `GroveVisor.tsx` | `groveStage.test.ts` |
| WPG-12 marco | sim | `App.tsx` `'groveMilestone'`; `GroveMilestoneCeremony.tsx`; `useGroveWatch.ts` | `filaDeAvisos.contract.test.ts`, `GroveMilestoneCeremony.render.test.tsx` |
| WPG-13 arte real | **não** (placeholders CSS/SVG em `backgrounds.ts`, `fairArt.ts`, `decorArt.ts`; `pan_tool` no lugar de `waving_hand`) | — | — |
| WPG-14 widget | **não** | nenhuma chave de guilda no bridge | `widgetSemCobranca` segue verde (nada a varrer) |
| WPG-15 docs | **não** (só Guide/Help) | `GuideModal`/`HelpModal` via `guildText` | `docsManual` **vermelho** |

## 6. Parecer por seção

| Seção | Parecer |
|---|---|
| §3 regras/constantes | APROVADO COM RESSALVA — A-2 (G1 sem registro) |
| §4 interação | APROVADO COM RESSALVA — M-1, B-2 |
| §5 entrar/sair | **APROVADO COM RESSALVA (bloqueante para release)** — A-1, M-2 |
| §6 salas | APROVADO |
| §7 benefícios | APROVADO COM RESSALVA — M-5, B-3 |
| §8 balanceamento | APROVADO |
| §10 servidor/dados | APROVADO COM RESSALVA — M-3, B-1 |
| §11 paridade | APROVADO (widget fora, nada cobra) |
| §13 LV-G1..G10 | APROVADO COM RESSALVA — LV-G5 (A-1), LV-G2 (M-1), LV-G6 sem régua (M-5) |
| §14 fila | APROVADO COM RESSALVA — WPG-W/A/13/14/15 abertos |

Nenhum VETO: não há linha vermelha cruzada por desenho; A-1 é defeito de implementação com correção de uma função.
