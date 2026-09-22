# Glossário do Soulmon

> **Dono:** doc-bibliotecario · **Data:** 21/09/2026 (9 termos da QA Rodada 1: cortesia, dias completos 30, banner de termos, orçamento de bytes, operador, guarda-plataforma, E0, `pushidx`, tombstone; anterior: 09/09/2026) · **Estado:** verificado em 10/09/2026 por doc-verificador (os 9 termos novos conferidos por grep em 21/09 pelo doc-mantenedor; ⚠️ este doc não tem código-fonte e nunca aparece no `docs-delta.mjs` — envelhece em silêncio, `08-governanca-docs-marca-r1.md` §2.2)
> **Verificação:** `node scripts/docs-inventario.mjs` (todo símbolo citado aqui aparece no inventário medido) + `npx vitest run src/docsManual.contract.test.ts`
> **Não cobre:** a REGRA por trás de cada termo (é do [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md)), o motivo pelo qual ela foi escolhida ([10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md)), quando mudou ([09-HISTORICO.md](09-HISTORICO.md)) e a assinatura de cada função (`06-REFERENCIA/`). Aqui só se responde "o que essa palavra quer dizer e onde ela mora no código".
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

## Como usar

Três colunas por termo:

- **O que é** — uma ou duas frases. Nunca a regra inteira.
- **Símbolo / dono no código** — o identificador que se procura com `grep`. Referência é sempre `caminho` + SÍMBOLO, nunca `arquivo` mais número de linha (R1 do método — ver [12-COMO-MANTER.md](12-COMO-MANTER.md)).
- **Onde se aprofunda** — o doc do manual que é DONO do assunto.

Termos com **⚰️** são nomes mortos: aparecem aqui só para que quem os encontrar num commit antigo, num comentário ou num doc de registro saiba o que os substituiu.

Termos com **⚠️** têm uma armadilha de nome: o que o jogador lê e o que o código chama são coisas diferentes.

**Índice:** [A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [I](#i) · [J](#j) · [K](#k) · [L](#l) · [M](#m) · [N](#n) · [O](#o) · [P](#p) · [Q](#q) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w)

---

## A

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Acervo de sprites** | O estado da geração incremental de arte: que forma já tem sprite próprio, quantas tentativas restam, o que está esperando adoção. Só metadado — o binário mora no Cache Storage. | `SpriteLibrary`, `displaySprite`, `recordSprite` em `src/utils/spriteLibrary.ts` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |
| **`accountTier`** | O tier da conta: `'demo'` (grátis) ou `'paid'`. Campo do save, mas **quem decide é o servidor** — o cliente nunca se promove. | `accountTier` em `src/contexts/GameStateContext.tsx`; `AccountTier` em `src/utils/monetization.ts`; `requirePaidTier` em `functions/api/_entitlements.js` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |
| **Adiamento** | Cada vez que uma tarefa é empurrada para outro dia. O contador é VISÍVEL; ao chegar no limite, o pet oferece decompor, encolher ou deixar pra lá. | `postpone`, `needsPostponeNudge` em `src/utils/taskTriage.ts`; `POSTPONE_NUDGE_AT` em `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Alívio de segunda** | Meio coração devolvido na virada de domingo para segunda. É o que faz o teto do estrago ser de 7 dias. | `WEEKLY_RELIEF_HEARTS` em `src/utils/dailyReset.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Algum dia** | Ver **Someday**. |  |  |
| **Âncora de hábito** | O "quando X, então Y" que acompanha um hábito (*implementation intention*, Gollwitzer). Não é texto decorativo: é a formulação que aumenta adesão. | `HabitAnchor` em `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Andar** | Um dos 5 níveis de uma run de masmorra; cada andar é uma escada de 6 inimigos e tem cenário próprio. | `MAX_FLOORS` em `src/components/DungeonGame.tsx`; `buildDungeonWave` em `src/utils/dungeon.ts`; `sceneForFloor` em `src/utils/dungeonScenes.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Aniversário** | O dia em que a relação com a criatura completa um mês ou um ano, contado a partir de `bornAt`. | `anniversaryOn`, `daysTogether` em `src/utils/anniversary.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Arena** | O combate por elementos e escolas (17 elementos, contra-ataques, especial com carga). Regras calibradas por simulação de balanceamento. | `simulateArenaRun`, `elementMultiplier`, `SPECIAL_CHARGE_TURNS` em `src/utils/arena.ts`; tela em `src/components/ArenaGame.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Assombrada** | Tarefa ativa vencida OU parada há muitos dias. Esmaece, ganha partícula escura e **o pet olha** — sem uma palavra de cobrança. Concluir dá bônus de alívio. | `isHaunted`, `daysStale` em `src/utils/taskTriage.ts`; `HAUNTED_AFTER_DAYS` em `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Atributos** | ⚠️ Os três eixos que decidem o galho da evolução. O jogador lê **Poder / Harmonia / Benevolência**; o código chama `virus` / `data` / `vaccine`, identificadores internos herdados do fork. | `ATTR_LABEL`, `ATTR_COLOR`, `AttributePoints` em `src/types/attributes.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Aventura** | O que a criatura traz de volta à noite: um achado narrado e colecionável, com raridade em função de quanto do dia foi cumprido. | `adventureOfDay`, `ADVENTURE_CATALOG`, `collectAdventure` em `src/utils/adventure.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## B

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Banho** | Ação sempre disponível que limpa o cocô e, com isso, para o relógio do dreno de HP. | `cleanPoop` em `src/utils/poopDrain.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Base (da masmorra)** | A dificuldade do andar 1. Sobe ao concluir uma run, persiste no aparelho e **reseta toda semana**. | `getDungeonDifficulty`, `setDungeonDifficultyAtLeast` em `src/utils/dungeon.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Bestiário** | A coleção das artes de inimigo já vistas na masmorra, exibida em Estatísticas com silhueta para o que ainda não apareceu. Contagem de coleção, nunca percentual. | campo `bestiary` em `src/contexts/GameStateContext.tsx`; `BestiaryCard` em `src/components/BestiaryCard.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Bits** | A moeda dos minijogos e da loja comum. Exibida sem ícone, só o número, em fonte de calculadora. | campo `gamePoints` no `GameState`; `bitsStyle`, `CURRENCIES` em `src/utils/currencies.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Brincar** | Oferta diária que gasta energia e devolve um buff temporário de Bits para o próximo minijogo, mais um ponto de atributo. Oferta, nunca dever. | `play`, `canPlay`, `PLAY_BUFF_MULTIPLIER` em `src/utils/petNeeds.ts`; `PlayCard` em `src/components/PlayCard.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Banner de termos** | O aviso informativo que aparece no slot de avisos da Home (último da fila) quando `TERMS_VERSION`/`PRIVACY_VERSION` subiram depois do consentimento gravado no save. Informa e oferece os dois links; **não há re-aceite** (decisão #24, 21/09/2026). Conta nova nunca o vê — a versão consentida já é a atual. | `TermsUpdateBanner` em `src/components/TermsUpdateBanner.tsx`; `precisaAvisarTermos`, `marcaAvisoTermos` em `src/utils/termsNotice.ts`; `STORAGE_KEYS.TERMS_NOTICE_SEEN`; chave `'termos'` da IIFE `avisos` em `src/App.tsx` | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) |

## C

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **`CACHE_VERSION`** | A versão do cache do service worker. Ao mudar asset estático de forma incompatível, some 1 no valor que está no arquivo — **o número não se copia de nenhum doc**, porque copiado ele apodrece e anda para trás. | `CACHE_VERSION` em `public/sw.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Cadeado de evolução** | O gesto de tocar na criatura atual na página de Evolução, que trava/destrava a cerimônia. Travado, a cerimônia não abre e os dias completos continuam acumulando. | campo `evolutionLocked` no `GameState`; `EvolutionPath` em `src/components/EvolutionPath.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Capacitor** | O empacotador que transforma o app web no APK Android. O APK carrega a URL de produção, então mudança web não pede APK novo. | `capacitor.config.json`; plugins em `src/plugins/` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **`careCaps`** | Onde os tetos de cuidado (carinho por dia, comida por hora) MORAM: no save, nunca no `localStorage`. O módulo guarda estado; as regras continuam em outro dono. | `CareCaps`, `hydrateCareCaps`, `mergeCareCaps` em `src/utils/careCaps.ts` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |
| **Carga do dia** | O peso de esforço planejado para hoje comparado ao limite de sobrecarga. **É aviso, nunca bloqueio.** | `plannedEffort`, `isOvercommitted` em `src/utils/taskTriage.ts`; `OVERCOMMIT_EFFORT` em `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Carinho** | Esfregar o pet com o dedo/ponteiro. É a cura PRINCIPAL de HP, com teto diário. A animação toca sempre, mesmo quando a cura é recusada. | `rubHeal`, `rubRefusal`, `RUB_HEAL_DAILY_CAP` em `src/utils/careRules.ts`; `applyRub`, `rubDecision` em `src/utils/careUpdaters.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Cenário** | O fundo do palco do pet. Cada um declara onde se passa (interior, exterior ou vazio), que espaços de decoração oferece e onde fica o horizonte. | `PET_BACKGROUNDS` em `src/utils/backgrounds.ts`; `StageSetting` em `src/utils/petStage.ts` | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) |
| **Cerimônia** | O modal que marca uma passagem e **espera o gesto** do jogador para fechar. Há a da evolução e a do marco de hábito. Movimento reduzido corta o MOVIMENTO, nunca a pausa. | `EvolutionCeremony` em `src/components/EvolutionCeremony.tsx`; `MilestoneCeremony` em `src/components/MilestoneCeremony.tsx` | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) |
| **ChatBox** | A caixa de conversa com o pet. Aceita texto e, quando a transcrição está configurada no servidor, um **recado falado**. | `ChatBox` em `src/components/ChatBox.tsx`; `chatSafetyDecision` em `src/utils/chatSafety.ts` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Check-in** | O ritual de uma vez por dia civil: hábitos do dia, até três focos e o humor, com as pendências de ontem primeiro. "Matinal" é convite, não janela de horário. | `needsCheckIn`, `checkInPlan`, `completeCheckIn` em `src/utils/rituals.ts`; `MorningCheckIn` em `src/components/MorningCheckIn.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Chip** | Item de atributo comprado na loja. Vai para a pastinha de itens e, ao ser usado, dá pontos de atributo e **nada mais** (sem energia). | `CHIP_BOOST`, `CHIP_EMOJI`, `SPECIAL_ITEMS` em `src/utils/shop.ts`; `applySpecialItem` em `src/utils/specialItemUse.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Cloud save** | A cópia do save no servidor, identificada pelo `saveId`. Agendada com debounce a cada mudança de estado. | `cloudSave`, `cloudSaveComRetry`, `cloudLoad` em `src/utils/cloudSave.ts`; `functions/api/save.js` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |
| **Cloudflare Pages / Functions / Workers** | Onde o app roda: Pages publica o site a cada push da `main`; Functions são as rotas `/api/*`; o Worker de push é separado e tem deploy manual. | `functions/api/`, `workers/push-scheduler.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Cocô** | Aparece até duas vezes por dia, nunca com o pet dormindo. Não limpo, dreno periódico de HP — com o MESMO teto diário da virada. | `applyPoopDrain`, `POOP_DRAIN_PERIOD_MS`, `PoopDrainCharge` em `src/utils/poopDrain.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Constância** | "N das últimas 7" — a métrica que substitui o streak. Uma falha custa uma fração, nunca tudo. O denominador conta só os dias em que o hábito era devido. | `constancy`, `CONSTANCY_WINDOW_DAYS` em `src/utils/habitRhythm.ts` e `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Coop** | Grupo de presença: aparecer conta, e sair é um toque sem penalidade. Estado no servidor. | `getCoop`, `coopCheckin`, `leaveCoop` em `src/utils/community.ts`; `CoopPanel` em `src/components/CoopPanel.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Coração (HP)** | A barra de saúde do pet, em passos de 0,5. Perde-se na virada do dia proporcionalmente ao que não foi cumprido, com teto diário. HP 0 leva à degeneração. | `MAX_HP_BY_FORM` em `src/types/progression.ts`; `rawHeartsLostFor`, `MAX_HEARTS_LOST_PER_DAY` em `src/utils/dailyReset.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Coraçãozinho** | Item consumível (loja ou drop raro da masmorra) que cura HP ao ser usado na pastinha. Não tem teto diário — por isso o uso não mora junto dos tetos. | `HEART_HEAL`, `HEART_ITEM_EMOJI` em `src/utils/shop.ts`; `applySpecialItem` em `src/utils/specialItemUse.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Créditos** | A moeda comprada com **dinheiro real**. Vive no servidor, nunca no save do cliente. Compra reroll, cura instantânea e troca por Bits — e é a única que libera gerar o pet próprio. | `CREDIT_TO_BITS`, `BITS_EXCHANGE` em `src/utils/currencies.ts`; `spendCredits`, `readEntitlement` em `functions/api/_entitlements.js` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Criatura** | O companheiro do jogador. No modo grátis é um dos três personagens prontos; no modo pago é gerada pelo oráculo a partir da leitura da pessoa. | `PREMADE_CHARACTERS` em `src/utils/monetization.ts`; `CreatureStage`, `OracleResult` em `src/utils/oracle.ts` | [01-VISAO.md](01-VISAO.md) |
| **Cortesia** | Tier `paid` concedido **sem compra**, por rota administrativa, a um número limitado de contas (o E0: 10 conhecidos). Abre o portão do Oráculo e das 11 formas; **não paga a conta** — gasta o orçamento de IA como um pagante (`_aiGuard.js` não lê `provider`). O pedido tem `provider:'courtesy'` e `orderId = courtesy:<saveId>` (idempotente por construção). Decisão #12 (21/09/2026). | `grantCourtesy`, `paidProviderOf` em `functions/api/_entitlements.js`; `handleGrant` (`action=grant`, `ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS`) em `functions/api/entitlements.js`; réguas `entitlements.grant.qa.test.js`, `_entitlements.tierDerivado.qa.test.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |

## D

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **D1 (Cloudflare)** | ⚠️ O banco relacional do Cloudflare, ligado como `env.DB`. Usado para a reivindicação ATÔMICA de comprovante de compra — sem ele, a mesma decisão cai no KV. Não confundir com a linha de baixo. | `claimOrder` (caminho `env.DB`) em `functions/api/_entitlements.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **D1 / D7 / D30 (retenção)** | ⚠️ Os marcos de sobrevivência de usuário (voltou no dia 1, 7, 30). São um EVENTO de telemetria, não um banco. Hoje são hipótese não confrontada: ninguém usou o app em produção (informado pelo dono em 07/09/2026). | evento `retained` em `src/utils/telemetry.ts` e a agregação em `functions/api/metrics.js` | [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md) |
| **Decoração** | Item que ocupa um dos espaços do palco. Cada peça declara em que espaço entra e em que tipo de cenário faz sentido; o que não combina não é desenhado. | `DecorSlot`, `decorFitsSetting`, `applyDecorEquip` em `src/utils/petStage.ts`; campo `equippedDecor` no `GameState` | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) |
| **Degeneração** | A queda de estágio quando o HP chega a zero. Custa dias completos acumulados, com piso — quem tinha pouco não fica devendo. | `degeneratedPerfectDays`, `DEGENERATION_PERFECT_DAYS_COST`, `applyRedemption` em `src/utils/dailyReset.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Demo / grátis** | O caminho sem compra: personagem pronto, teto de atividades ativas e sem geração de sprite próprio. | `AccountTier`, `DEMO_ACTIVITY_TOTAL_CAP`, `canCreateActivity` em `src/utils/monetization.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Dia completo** | A condição de um dia bem-sucedido: peso feito ≥ meta do dia, pelo menos uma atividade cadastrada e energia ≥ meta do dia. Rende +1 ponto de evolução. **O NOME mudou em 07/09/2026 (decisão P5)**: os textos PT/EN dizem "dia completo" / "complete day". ⚰️ Chamava-se **"dia perfeito"**, e o nome era pior que o mecanismo — o contador nunca decresce, mas "perfeito" transforma um dia bom em fracasso para quem tem traço perfeccionista. | `computeDailyReset`, `dailyGoalFor` em `src/utils/dailyReset.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Dia do jogador** | O nome do dia usado por TODO registro diário do save, calculado num fuso FIXO gravado no save — nunca o dia do aparelho. É o que faz dois celulares em fusos diferentes concordarem. | `playerDayKey`, `PlayerDayAnchor`, `resolvePlayerDayAnchor` em `src/utils/playerDay.ts`; campo `playerDayTz` no `GameState` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |
| **DigiApp** | ⚰️ O app do qual o Soulmon nasceu como fork. A limpeza da herança foi feita em 07/09/2026 (chaves, rótulos, canal de push, arte e nomes). O que ainda depende do painel do dono, e não do código, está no inventário de separação. | acessor `kv` em `functions/api/_kv.js` (aceita os dois nomes de binding); `migrateLegacyStorageKeys` em `src/utils/storageKeys.ts` | [`SEPARACAO-DIGIAPP.md`](../SEPARACAO-DIGIAPP.md) |
| **Dino** | O minijogo de corredor. Paga Bits em função do placar. | `DinoGame` em `src/components/DinoGame.tsx`; contador `dinoBest` no `GameState` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **`<!-- doc-historico -->`** | A marca literal que um documento inteiro põe no cabeçalho para se declarar REGISTRO — a partir dali ele pode citar regra morta sem lápide linha a linha. A marca é literal de propósito: reconhecer isenção por sinônimo já falhou. | `MARCA_DE_REGISTRO` em `src/docsSemMentira.contract.test.ts` | [12-COMO-MANTER.md](12-COMO-MANTER.md) |
| **Dono (de regra)** | O ÚNICO símbolo que decide uma regra. Regra copiada é regra que diverge em silêncio (footgun 9): quem escreve regra nova encaixa no dono existente, ou importa dele. | ex.: `applyPoopDrain` é o dono do dreno; `applySpecialItem` é o dono do uso de item especial | [05-ARQUITETURA.md](05-ARQUITETURA.md) |
| **Dormir** | Estado persistido, por gesto manual ou por janela automática. Dormindo: sem cocô, dreno pausado. É também a única entrada da Janela de Descanso — **não há sensor nenhum**. | campo de sono no `GameState`; `recordNight` em `src/utils/restWindow.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Dropped (deixar pra lá)** | Estado terminal de tarefa COM volta atrás. Não é deletar (perde o contexto) nem concluir (é mentira). É a saída que quebra o ciclo de falência periódica. | `drop`, `restore`, `TaskStatus` em `src/utils/taskTriage.ts` e `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Dias completos 30** | A conquista cosmética que substituiu ⚰️ `tasks-100` (decisão #30, 21/09/2026): abre ao acumular 30 dias completos na vida do save (`totalPerfectDays`), não ao contar tarefas — a #16 veta recompensa por contagem. Quem já tinha a antiga herda a nova UMA vez (`conquistasHerdadas`). ⚠️ O Glitchtama também soma em `totalPerfectDays`, então a conquista pode abrir por masmorra — decisão do dono #41. | `'dias-completos-30'`, `DIAS_COMPLETOS_PARA_CONQUISTA`, `gatilhoAntigoTasks100` em `src/utils/achievements.ts`; `conquistasHerdadas` em `hydrateSave` (`src/contexts/GameStateContext.tsx`); arte em `src/utils/emblemArt.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## E

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Electron** | O runtime do overlay de desktop. Ver **Overlay**. | `desktop/electron/main.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Emblemas** | A moeda do Torneio. Ganha-se por partida (vitória e derrota) e gasta-se só na aba de Torneio da loja, que é **toda cosmética** — e isso é regra, porque Emblemas vivem no save do cliente. | `EMBLEMS_PER_WIN`, `EMBLEMS_PER_LOSS` em `src/utils/currencies.ts`; `TOURNAMENT_ITEMS` em `src/utils/shop.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Energia** | Barras que enchem só comendo e zeram todo dia. A quantidade de barras exibidas é o requisito de tarefas do estágio. | `getMaxEnergyForStage`, `FORM_REQUIREMENTS` em `src/types/progression.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Entitlements** | O registro no servidor do que uma conta tem direito: tier, créditos e comprovantes já consumidos. Chave `ent:<saveId>`. O cliente nunca decide. | `readEntitlement`, `writeEntitlement`, `applyVerifiedPurchase` em `functions/api/_entitlements.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Escola** | Uma das seis escolas do class-system, escolhida no renascimento e usada no prompt da criatura e no especial da Arena. | `rebirthEscolaOptions` em `src/utils/rebirth.ts`; `SPECIAL_EFFECTS` em `src/utils/arena.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Escudo de descanso** | A proteção de constância de um hábito, ganha por boa constância e **consumida AUTOMATICAMENTE** na falta. Proteção que exige lembrar de ativar antes de falhar não protege ninguém. Nunca tocou em HP. | `earnShield`, `applyMissedDay` em `src/utils/habitRhythm.ts`; `REST_SHIELD_MAX`, `REST_SHIELD_EARN_EVERY_DAYS` em `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Esforço (`effort`)** | O peso de uma tarefa pontual: rápida, média ou projeto. É ele que a meta do dia soma — **peso, nunca contagem de itens**. Hábito tem peso fixo. | `Effort`, `normalizeEffort`, `HABIT_WEIGHT` em `src/types/taskModel.ts`; `weightOf` em `src/utils/taskTriage.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Espaços (slots)** | Os cinco lugares de tamanho fixo do palco onde a decoração entra. A arte é desenhada PARA a caixa; espaço vazio é vazio, sem contorno e sem "+". | `DECOR_SLOTS`, `SLOT_ORDER`, `slotBoxStyle` em `src/utils/petStage.ts` | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) |
| **Estações** | O calendário sem battle pass: quatro estações por ano, três caminhos alternativos para a medalha, contadores que já existiam. Fora de estação o app segue inteiro. | `SEASONS`, `SEASON_PATHS`, `seasonMedalStatus` em `src/utils/seasons.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Estágio** | O degrau da criatura: rookie, champion, ultimate, mega, ultra. Define HP máximo, requisito diário e barras de energia. ⚰️ **Não existem mais ovo nem baby** — a árvore nasce em rookie. | `EvolutionStage`, `FORM_REQUIREMENTS`, `getStageLevel` em `src/types/progression.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Evolução manual** | Quem dispara a evolução é o JOGADOR, tocando na criatura com a barra cheia. A virada do dia **nunca** evolui sozinha. | `MANUAL_EVOLUTION` em `src/types/progression.ts`; `evolutionTarget` em `src/utils/evolutionTarget.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **E0** | O primeiro experimento com gente de verdade, decidido em 21/09/2026 (#11): **10 conhecidos do dono, adultos, PWA, cortesia, 14 dias**. Testa se o produto retém quem chega com contexto; critério de morte `first_task_done < 6/10` ou `retained.d7 ≤ 2/10` (denominador = pessoas, nunca `install`; leitura no D15, efeito no D21). É também o gatilho de descongelar a Camada 3 (#13). Não confundir com o E0 do som (S13). | não tem símbolo no código — o procedimento ainda não existe (pergunta #51); leitura por `scripts/metrics-report.mjs`; concessão por `grantCourtesy` | [01-VISAO.md](01-VISAO.md) |

## F

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Faixas do Torneio** | Semente, Broto, Guardião, Ancião, Lendário. Aparecem **antes** do ranking global: posição absoluta é a leitura associada a comparação tóxica; a faixa mede o jogador contra ele mesmo e nunca rebaixa. | `TOURNAMENT_TIERS`, `getTierStanding` em `src/utils/tournamentTiers.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **FCM** | Firebase Cloud Messaging — o canal de push NATIVO, só no app Android. Convive com o Web Push; os dois compartilham a mesma KV, o mesmo cron e a **tag** da copy, que é o que impede notificação duplicada. | `functions/api/fcm-subscribe.js`, `workers/fcm.js`; `registerForPushNotifications` em `src/utils/notifications.ts` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Firebase** | Autenticação (Google e e-mail/senha) e o FCM. Desde 07/09/2026 o Soulmon tem projeto próprio, `soulmon-app`. | `src/utils/auth.ts`; `verifyIdToken` em `functions/api/_auth.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Foco do dia** | Até três tarefas escolhidas no check-in. **O número é a mecânica.** As três completas rendem o selo do dia; sem foco escolhido não existe selo por omissão. | `setFocus`, `focusComplete` em `src/utils/taskTriage.ts`; `MAX_DAILY_FOCUS` em `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Folga semanal** | Um dia de folga por semana, grátis e automático: a primeira perda de coração da semana é absorvida sozinha, na virada, sobre um dia que já terminou. Sem acúmulo, não vira dia completo, e o relatório CONTA que foi usada. | `REST_DAYS_PER_WEEK`, `restWeekKeyFor` em `src/utils/dailyReset.ts`; `restDayUsed` em `lastDayReport` no `GameState` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Footgun** | Um erro que este repositório já cometeu e documentou para não repetir. A lista numerada vive no `CLAUDE.md`; o mais citado é o **footgun 9** (regra copiada diverge em silêncio). | seção "Footguns" em [`CLAUDE.md`](../../CLAUDE.md) | [05-ARQUITETURA.md](05-ARQUITETURA.md) |
| **Fresh start** | O convite de recomeço em toda segunda ou dia 1. **Nunca apaga progresso**: limpa só a cobrança (contador de adiamentos das tarefas ativas). Recomeço não é amnésia, é perdão. | `isFreshStartDay`, `freshStartOffer`, `applyFreshStart` em `src/utils/rituals.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## G

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Galho** | O ramo da evolução: `virus`, `data` ou `vaccine`. Decidido pelos atributos; no empate, quem decide é o **ritmo de cuidado**. | `getStageBranch`, `AVAILABLE_BRANCHES` em `src/types/progression.ts`; `resolveBranch`, `patternBranch` em `src/utils/carePattern.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Glitchtama** | Recompensa por concluir os cinco andares da masmorra. Usado na pastinha, dá +1 dia completo — **no máximo um por dia do jogador**, e a recusa acontece antes do decremento (o item volta e vale amanhã). Nunca é vendido. | `GLITCHTAMA_PER_DAY`, `GlitchtamaUse`, `applySpecialItem` em `src/utils/specialItemUse.ts`; `GLITCHTAMA_EMOJI` em `src/utils/shop.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Groq** | O provedor de IA das falas do pet e do chat (modelo pequeno e rápido). A chave é secret de servidor. | `functions/api/chat.js` (variável `GROQ_API_KEY`) | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Guard / contract test** | Um teste que trava uma decisão em vez de exercitar uma função: ele reprova o RETORNO de uma regra morta, a cópia de uma constante, uma fiação ausente. É o que sobra quando um comentário some no build. | ex.: `src/deploy/appUrl.contract.test.ts`, `src/utils/cortes.contract.test.ts`, `src/docsManual.contract.test.ts` | [12-COMO-MANTER.md](12-COMO-MANTER.md) |
| **Guarda** | O agente responsável por um pacote de trabalho (WP) do plano de melhorias: ele confere o aceite contra o código real antes do commit e atualiza o ledger. | comando `/guarda-soulmon`; [`LEDGER.md`](../plano-melhorias/LEDGER.md) | [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md) |
| **Guarda-plataforma** | O oitavo guarda (desde `42b07bec`, #28): paridade web × APK/widget × overlay, EN como base, a11y de código. Dono de `android/` e `desktop/` como código e do ledger `plataforma.md` (PL-1…PL-9). Não decide regra de jogo. | `.claude/agents/soulmon-guarda-plataforma.md`; ledger `docs/plano-melhorias/ledger/plataforma.md`; réguas `care*.parity.test.ts`, `saveId.parity.test.js`, `widgetSemCobranca.contract.test.ts`, `pushCopy.parity.test.js` | [12-COMO-MANTER.md](12-COMO-MANTER.md) |

## H

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Hábito** | O contrato de **CONSTÂNCIA**: o valor está em repetir. Tem recorrência, histórico, constância, escudos e marcos. Não se mistura com tarefa. | `Activity` em `src/contexts/GameStateContext.tsx`; `HabitRhythm` em `src/utils/habitRhythm.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Higgsfield** | O provedor de geração de imagem dos sprites próprios. A chamada passa pelo servidor, com dois prompts (com referências e sem) e um disjuntor de custo. | `functions/api/generate-sprite.js`, `functions/api/sprite-image.js`; `AI_LIMITS` em `functions/api/_aiGuard.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Humor** | Cinco carinhas dentro do relatório diário. **Opcional, e nunca alimenta pontuação** — se virasse insumo de score, a pessoa responderia o que rende ponto em vez do que sente. O app devolve um resumo. | `recordMood`, `moodFor`, `moodSummary` em `src/utils/mood.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## I

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Intersticial** | Uma das DUAS filas de superfícies do app: modais que ocupam a tela inteira e montam **um por vez**, em ordem declarada. Superfície nova entra numa das duas filas, com posição declarada. | `interstitial` em `src/App.tsx`; guard em `src/components/filaDeAvisos.contract.test.ts` | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) |

## J

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Janela de Descanso** | A faixa de horário que o próprio usuário escolhe para deitar. **Premia o COMPORTAMENTO (deitar no horário), nunca o RESULTADO (dormir bem)** — e noite sem registro é NEUTRA, sai do denominador. Sem sensor nenhum. | `isWithinWindow`, `recordNight`, `restConstancy` em `src/utils/restWindow.ts`; `DEFAULT_REST_WINDOW`, `REST_WINDOW_GRACE_MIN` em `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## K

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **KV** | O armazenamento chave-valor do Cloudflare onde vivem saves, entitlements e assinaturas de push. O namespace é resolvido em **um lugar só** — nunca se lê o binding direto. | `kv`, `kvOrThrow` em `functions/api/_kv.js` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |

## L

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Lápide** | A marca que autoriza um doc a citar uma regra morta: ⚰️, "não existe mais" ou "era …", **na mesma linha**. Sem ela, citar é afirmar. | `MARCA_DE_LAPIDE` em `src/docsSemMentira.contract.test.ts` | [12-COMO-MANTER.md](12-COMO-MANTER.md) |
| **Ledger** | O registro por pacote do plano de melhorias: o que foi aceito, por quem, contra qual evidência. | [`LEDGER.md`](../plano-melhorias/LEDGER.md) | [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md) |
| **Leitura (oráculo)** | A primeira metade do oráculo: transforma quem a pessoa é em quatro eixos (elemento, papel, alinhamento, reino). Hoje são 20 itens psicométricos, mapa astral real e numerologia. ⚰️ Era signo por faixa de datas e ascendente chutado. | `buildSoulProfile`, `generateOracleAxes` em `src/utils/soulProfile/index.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Linha** | Uma das seis famílias de criatura próprias do repositório. Cada linha tem sprites por tier e um nome de exibição com **dono único** — o mesmo nome alimenta o inimigo da masmorra, o personagem pronto e o NPC. | `DUNGEON_LINE_SPRITES`, `DUNGEON_LINE_NAMES` em `src/utils/sprites.ts` | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) |
| **Loja** | O catálogo em abas (Itens, Cenários, Mobílias, Torneio, Missões). Preços em Bits, menos a aba de Torneio, que cobra em Emblemas. Item bloqueado aparece escurecido com cadeado e explica como abrir. | `SHOP_ITEMS`, `ALL_SHOP_ITEMS`, `UnlockReq` em `src/utils/shop.ts`; `ShopModal` em `src/components/ShopModal.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## M

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Marco de hábito** | Os degraus de maturidade em dias efetivos: 7, 21 e 66. Os 66 são a mediana real de Lally et al. (2010); os "21 dias" populares vêm de outra coisa e não têm a ver com hábito. Cada marco tem cerimônia e sobe o rendimento de atributo. | `HABIT_MILESTONES`, `HABIT_TIER_BONUS` em `src/types/taskModel.ts`; `habitTier`, `milestoneReached` em `src/utils/habitRhythm.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Masmorra** | O modo de combate por andares. **Sem limite diário e sem gate de entrada; perder não custa coração nenhum** — o jogo nunca cobra da barra que representa o cuidado que o usuário teve consigo mesmo. | `buildDungeonWave`, `PLAYER_STATS` em `src/utils/dungeon.ts`; `DungeonGame` em `src/components/DungeonGame.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Memória** | O marco de convivência que o app devolve ao jogador em datas de relação (não de desempenho). Mostrado uma vez, de forma idempotente. | `MEMORY_MARKS`, `memoryToShow`, `markMemoryShown` em `src/utils/memories.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Meta de coração × meta do dia** | ⚠️ **São DUAS réguas desde 07/09/2026 (decisão P1)**. A que PROTEGE o coração é menor; a do **dia completo** é a meta inteira. A excelência não foi afrouxada: quem quer evoluir continua tendo que fazer tudo. | `heartGoalFor`, `HEART_GOAL_RATIO`, `dailyGoalFor` em `src/utils/dailyReset.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Missões** | Seis objetivos permanentes que **liberam a compra** de cenários exclusivos. Contadores lifetime no save. | `MISSIONS`, `getMissionProgress`, `isShopItemUnlocked` em `src/utils/missions.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Missões semanais** | Três missões sorteadas por semana ISO, **determinísticas** pela chave da semana (lista que muda a cada abertura ensina a reabrir o app até cair uma fácil), pagas em Emblemas. **Nenhuma premia contagem de tarefas** — é proibição escrita, com teste varrendo. | `weeklyMissionsFor`, `forWeek`, `claimWeekly` em `src/utils/weeklyMissions.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## N

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Never miss twice** | A regra de intervenção: **a primeira falha não gera nada visível**; só na segunda seguida o pet aparece oferecendo uma versão reduzida do hábito ("hoje, só 5 minutos?"), e aceitar conta como feito. | `consecutiveMisses`, `needsIntervention` em `src/utils/habitRhythm.ts`; `MISS_INTERVENTION_AT` em `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Nova leitura** | O caminho de refazer a leitura do oráculo a partir de respostas mudadas — em vez de um sorteio pago às cegas. | `readingSeed`, `answersChanged` em `src/utils/newReading.ts`; `NewReadingModal` em `src/components/NewReadingModal.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## O

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **O Visor** | O elemento de marca do app: a fronteira declarada entre o mundo **pixel** (dentro) e o mundo **vetor** (fora). Anel de cobre, interior escuro nos dois temas, escala inteira sempre. | `Viewport` em `src/components/ui/Viewport.tsx`; tokens `--sm2-*` em `src/index.css` | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) |
| **Oráculo** | O sistema que cria a criatura. Tem duas metades: a **leitura** (quem a pessoa é → quatro eixos) e a **criação** (eixos → arquétipo, família, as 11 formas e os prompts de sprite). O ritual visível continua sendo as seis perguntas. | `ORACLE_QUESTIONS`, `generateOracle` em `src/utils/oracle.ts`; `generateOracleComplete` em `src/utils/soulProfile/pipeline.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Overlay (desktop)** | O app Electron separado: o pet anda numa faixa transparente na barra de tarefas do Windows. É um **controle remoto** do app — lê e escreve o save pela API. Suas regras de cuidado **importam** do app, não copiam. | `desktop/renderer/src/care.ts`, `desktop/renderer/src/cloudSync.ts`, `desktop/electron/main.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Operador** | O agente dono da pergunta "o que está NO AR bate com o que está no GIT?" (desde `42b07bec`, #28): deploy manual do worker de push, migrações D1, secrets do painel, `CACHE_VERSION`, incidentes — e, desde 21/09/2026, **se o GitHub Actions está vivo** (`gh run list --limit 5` é a primeira linha do runbook; o CI ficou parado por cobrança de 16 a 21/09 sem ninguém ver). Nunca cola valor de segredo. | `.claude/agents/soulmon-operador.md`; réguas `src/deploy/firebaseNoBuild.contract.test.ts`, `src/deploy/appUrl.contract.test.ts` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Orçamento de bytes** | O teto de tamanho do `dist/` travado por guard (decisão #31, 21/09/2026): JS de entrada ≤ 250 KB, CSS ≤ 100 KB, imagem ≤ 400 KB, vídeo ≤ 800 KB, medidos por `statSync` (cru, não gzip). A dívida existente é **nomeada** em `DIVIDA_ATUAL` — o guard reprova crescimento, não o passado. Chunk lazy (`pool-*.js`, 832 KB) ainda não tem teto (proposta `TETO_JS_LAZY`). | `TETO_JS_DE_ENTRADA`, `TETO_CSS_DE_ENTRADA`, `TETO_IMAGEM`, `TETO_VIDEO`, `DIVIDA_ATUAL` em `src/deploy/orcamentoDeBytes.contract.test.ts` | [05-ARQUITETURA.md](05-ARQUITETURA.md) |

## P

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Pago / full** | O tier que uma compra verificada concede. Libera gerar o pet próprio e o renascimento. | `FULL_UNLOCK_SKU` em `src/utils/monetization.ts`; `applyVerifiedPurchase` em `functions/api/_entitlements.js` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Palco** | A área do pet como COMPOSIÇÃO, não um canto onde se joga ícone: linha do chão única, cinco espaços de tamanho fixo em px, horizonte declarado por cenário. | `GROUND_Y`, `DECOR_SLOTS`, `STAGE_HEIGHT` em `src/utils/petStage.ts` | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) |
| **Passos** | Contador opcional de passos, com degradação graciosa: sem sensor ou sem permissão, o app segue inteiro. Agregado diário e nada mais sai do aparelho. | `readStepsToday`, `stepsConsentCopy`, `DEFAULT_STEP_GOAL` em `src/utils/steps.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **`perfectDays`** | ⚠️ O contador de dias completos no save. **O nome do campo NÃO mudou** quando o termo de interface virou "dia completo" (07/09/2026) — mudar identificador de save é outra decisão, e a interface é que precisava do conserto de tom. **Só acumula**: dia não-completo não tira nada. | campo `perfectDays` e `totalPerfectDays` no `GameState`; `computeDailyReset` em `src/utils/dailyReset.ts` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |
| **Perdão por ausência** | A partir de certo número de dias sem abrir o app, a virada para de cobrar HP. Quem volta encontra saudade, não fatura. Tem parentes: carência de save novo e rampa de retorno. | `ABSENCE_FORGIVENESS_DAYS`, `NEW_SAVE_GRACE_DAYS`, `RETURN_GRACE_DAYS` em `src/utils/dailyReset.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Pesadelo** | O combate curto da MANHÃ que transforma o sono em conteúdo de jogo. Um por noite registrada, teto absoluto; vencer restaura energia e no máximo meio coração. Pesadelo não combatido expira **sem custo nenhum**. | `nightmaresFor`, `NIGHTMARES_PER_NIGHT`, `nightmareRewards` em `src/utils/nightmares.ts`; `NightmareBattle` em `src/components/NightmareBattle.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Pixelizador** | O pipeline que transforma a imagem gerada pela IA em sprite v-pet: recorte, redução ao grid, quantização de paleta e reampliação com pixels duros. | `pixelizeBuffer`, `medianCutPalette` em `src/utils/pixelizer.ts`; `pixelizeDataUrl` em `src/utils/spriteGen.ts` | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) |
| **`playerDayTz`** | O campo do save que grava o fuso FIXO do jogador. Ver **Dia do jogador**. | campo `playerDayTz` no `GameState`; `sanitizePlayerDayAnchor` em `src/utils/playerDay.ts` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |
| **PPT** | Pedra-papel-tesoura — o minijogo rápido que paga Bits por vitória. | `RPSGame` em `src/components/RPSGame.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Priming** | O convite para ligar notificações, oferecido numa janela estreita de dias de vida da criatura e nunca menos de um dia depois de um "agora não". A frase é do PET, na primeira pessoa, e **pergunta**. | `shouldPrimePush`, `pushPrimingLine`, `PRIMING_MIN_DAYS` em `src/utils/pushPriming.ts` | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) |
| **Push** | As notificações. **Dois canais**: Web Push (VAPID, cobre PWA e desktop) e FCM (nativo, Android). Mesma KV, mesmo cron, mesma tag de copy. | `functions/api/subscribe.js`, `workers/webpush.js`, `workers/push-scheduler.js`; copy em `functions/api/_pushCopy.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **PvP** | O confronto entre jogadores, liberado a partir de um nível de Vínculo. A mesma derivação roda nos dois lados, e **quem decide é o servidor**, porque o cliente é editável. | `BOND_PVP_MIN_LEVEL`, `meetsPvpBond` em `src/utils/bond.ts`; `bondLevelFor` em `functions/api/_bond.js` (⚠️ divergência: o `CLAUDE.md` chama o símbolo do cliente de `canPvp`, que não existe em lugar nenhum — verificado com `grep -rn "canPvp" src/ functions/ desktop/` em 09/09/2026) | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **`pushidx`** | Índice inverso `pushidx:<saveId>` → chaves `push:*`/`fcm:*` da conta, no namespace `PUSH_SUBSCRIPTIONS`. Existe para a exclusão de conta apagar as inscrições em O(1) (≤ 34 subrequests) em vez de varrer o namespace inteiro com um `get` por chave — que estourava o teto de subrequests do Worker com ~900 inscrições e deixava o save já apagado (QA Rodada 1). Teto de 16 entradas por conta; TTL = o da inscrição; autocura a cada abertura do app. | `PUSHIDX_PREFIX`, indexação em `functions/api/_pushIdentity.js`; consumidor `deletePushSubscriptions` em `functions/api/account.js` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |

## Q

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Quatro superfícies** | Os quatro lugares onde o Soulmon aparece: o app web/PWA, o APK Android (com widgets), o overlay de desktop e as notificações. A regra web vale para todas — o APK carrega a URL de produção. | `capacitor.config.json`, `desktop/`, `android/`, `public/sw.js` | [05-ARQUITETURA.md](05-ARQUITETURA.md) |

## R

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Recado falado** | A mensagem de voz do ChatBox. Passa por `/api/transcribe` (mesma origem, credencial no servidor) e **fica desligada** enquanto o ambiente não tiver as variáveis do provedor — sem elas o botão de microfone nem é desenhado. | `functions/api/transcribe.js`; guard em `src/security/supabase.contract.test.ts` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Régua viva** | O teste que decide, quando um doc e o código discordam. É sempre ele que se cita como prova — nunca um parágrafo de documentação, que envelhece sem ficar vermelho. | ex.: `src/deploy/appUrl.contract.test.ts` para a URL de produção | [12-COMO-MANTER.md](12-COMO-MANTER.md) |
| **Relatório diário** | O resumo do dia escrito na virada e mostrado uma vez por dia. Carrega o check-in de humor, a memória do dia e o objetivo do jogador em dias completos. | campo `lastDayReport` no `GameState`; `DailyReportModal` em `src/components/DailyReportModal.tsx` | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) |
| **Relatório semanal** | A leitura de domingo, checada por SEMANA e não por dia: constância por hábito, melhor hábito, categoria dominante, esforço concluído, sonhos e a sugestão de encadeamento. **Tudo descrição, nunca veredito** — e a sugestão devolve `null` sem dados suficientes. | `weeklyReport`, `needsWeeklyReport`, `stackingSuggestion` em `src/utils/rituals.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Renascimento (Rebirth)** | Voltar a rookie com cerimônia de ovo, uma vez só, depois do ultra e só no tier pago. Perde-se o estágio e os três atributos, **e só**. Em troca, o jogador escolhe criatura, escola e elemento, e o orçamento da ficha é multiplicado. | `applyRebirth`, `rebirthRefusal`, `REBIRTH_BUDGET_MULTIPLIER` em `src/utils/rebirth.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Reroll** | Refazer a criatura pagando Créditos. | `REROLL_COST_CREDITS` em `src/utils/monetization.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Reveal** | O momento em que a criatura gerada é mostrada ao jogador pela primeira vez, no fim do ritual do oráculo. | `SoulmonOnboarding` em `src/components/SoulmonOnboarding.tsx`; faixa de tempo em `revealDurationBucket` (`src/utils/telemetry.ts`) | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) |
| **Ritmo de cuidado** | A leitura do histórico de conclusões classificada em Constante, Explosivo ou Equilibrado. Entra como **critério de desempate** do galho. **Nenhum ritmo é melhor que outro**, e com pouco histórico a leitura se declara não-confiável. | `computeCarePattern`, `careHistory`, `patternBranch` em `src/utils/carePattern.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Rodada do Torneio** | A janela semanal, de sexta a domingo. É **ritual, não tranca**: fora dela o Torneio segue inteiro disponível. Janela de DIAS, nunca de horas. | `getTournamentWindow`, `ROUND_START_DAY`, `ROUND_LENGTH_DAYS` em `src/utils/tournamentSeason.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Run** | Uma partida de masmorra: os cinco andares, com cenários sorteados e HP do jogador carregando entre eles. | `buildRunScenes` em `src/utils/dungeonScenes.ts`; `dungeonRunsCompleted` no `GameState` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## S

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **`saveId`** | O identificador do save: SHA-256 do e-mail normalizado, com salt do projeto, cortado. Mesmo e-mail, mesmo save. Tem **três implementações** em três árvores com três ciclos de deploy, travadas por teste de paridade — divergir não dá erro, dá 403 ou um bicho genérico. | `emailToSaveId` em `src/utils/cloudSave.ts`, em `desktop/renderer/src/cloudSync.ts` e em `functions/api/_auth.js`; paridade em `functions/api/saveId.parity.test.js` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |
| **Slot de avisos** | A segunda das duas filas de superfícies: a faixa da Home que renderiza só o PRIMEIRO aviso e colapsa o resto em "+N", em ordem declarada. | `src/App.tsx`; guard em `src/components/filaDeAvisos.contract.test.ts` | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) |
| **Someday (algum dia)** | Estado deliberadamente INERTE de uma tarefa: fora da meta, não envelhece, não assombra. É permissão formal para não fazer. | `toSomeday`, `isActive`, `TaskStatus` em `src/utils/taskTriage.ts` e `src/types/taskModel.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Sonhos / DreamDex** | A coleção de cenas do pet, uma por noite dentro da janela de descanso. **Raridade vem da REGULARIDADE, nunca da duração**, com piso comum — pouca regularidade rende menos prêmio, jamais castigo. A barra só cresce. | `DREAM_CATALOG`, `dreamRarity`, `rollDream`, `dexProgress` em `src/utils/restWindow.ts`; `DreamDex` em `src/components/DreamDex.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **`soulGoal` / `soulStruggle`** | As duas perguntas abertas do onboarding — o "porquê" e a dificuldade do usuário —, feitas **antes de qualquer mecânica de jogo** e ambas puláveis. O app as devolve depois, em dias completos e no retorno. | campos `soulGoal` e `soulStruggle` no `GameState`; `echoStruggle`, `tinyOfferIntro` em `src/utils/tinyOffer.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **soulProfile** | O subsistema da leitura: itens psicométricos, mapa astral com efemérides reais, numerologia, e a montagem da ficha do class-system. Os coeficientes dos eixos foram calibrados por simulação — mexer num deles sem refazer a simulação reabre o buraco que ele fechou. | `src/utils/soulProfile/axes.ts`, `src/utils/soulProfile/profile.ts`, `src/utils/soulProfile/pipeline.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Soulmon** | O app e a criatura. Um app de produtividade gamificado do gênero v-pet, em que o avatar **evolui COM o usuário e o encoraja — nunca cobra**. | repositório inteiro; a essência declarada está em [`PLANO-EVOLUCAO.md`](../PLANO-EVOLUCAO.md) | [01-VISAO.md](01-VISAO.md) |
| **Squad** | Um conjunto de agentes com contrato, método e guard executável, invocado por comando. A que escreve este manual é a **SQUAD-DOCS**. | `.claude/skills/squad-docs/`, `.claude/agents/doc-*.md` | [12-COMO-MANTER.md](12-COMO-MANTER.md) |
| **Supabase** | O provedor da transcrição do recado falado, chamado **pelo servidor**. ⚠️ Até 09/09/2026 o `ChatBox` mandava áudio direto para um projeto da era do fork, com o JWT commitado — bloqueado pela CSP, sem permissão de áudio no Android e declarado em lugar nenhum. Hoje é funcionalidade de verdade, presa por guard. | `functions/api/transcribe.js`; `src/security/supabase.contract.test.ts` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |

## T

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Tarefa** | O contrato de **EXECUÇÃO**: o valor está em terminar e sair da cabeça. Tem esforço, prazo, adiamentos, estados e assombração. Não se mistura com hábito. | `Task` em `src/contexts/GameStateContext.tsx`; `TriageTask` e o motor em `src/utils/taskTriage.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Telemetria** | Os eventos mínimos que arbitram as decisões do plano, com **allowlist de props por evento** e nenhum campo de texto livre. Hoje não há o que ler: ninguém usou o app em produção. | `TelemetryEvent`, `EVENT_SCHEMA`, `sanitizeEvent` em `src/utils/telemetry.ts`; agregação em `functions/api/metrics.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Torneio** | O modo competitivo com faixas, rodada semanal e moeda própria (Emblemas). | `TournamentPage` em `src/components/TournamentPage.tsx`; `src/utils/tournamentTiers.ts`, `src/utils/tournamentSeason.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Traço de nascimento** | O traço único sorteado quando o pet nasce, visível em Estatísticas. **Todos são positivos** — traço negativo puniria por um dado que o jogador não jogou; a variedade é em espécie, não em força. Os efeitos são lidos do ESTADO, nunca por parâmetro novo, e é isso que faz o overlay herdar sem uma segunda implementação. | `PET_PASSIVES`, `rollPetPassive`, `rubDailyCap`, `heartLossCap` em `src/utils/passives.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Transcrição** | Ver **Recado falado**. |  |  |
| **Triagem (arrumar a pilha)** | A fila de tudo atrasado ou assombrado, ordenada, apresentada como cartas com quatro ações grandes. Terminar rende recompensa: **planejar é o que alivia**, mais que concluir (Masicampo & Baumeister). | `triageQueue` em `src/utils/taskTriage.ts`; `TriagePile` em `src/components/TriagePile.tsx` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Tombstone (lápide de conta)** | Registro `del:done:<saveId>` (TTL **30 dias**) gravado no `delete-confirm` **antes** de destruir qualquer coisa. `save.js` o lê em `GET`/`POST` e devolve 410 `account-deleted` — sem ele, outro aparelho do titular ainda logado recriava o save inteiro 3 s depois da exclusão. Depois dos 30 dias o mesmo e-mail cria conta nova do zero ("a porta fica aberta"). | `TOMBSTONE_PREFIX` em `functions/api/_accountTombstone.js`; `handleDeleteConfirm` em `functions/api/account.js`; `CLOUD_SAVE_POLICY` em `src/utils/cloudSave.ts` | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) |

## U

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Ultra** | O ápice da escada, acima do mega. Tem um segundo caminho por paciência, além dos dias completos — e a paciência é "o recurso que não cresce indefinidamente", que é o argumento que justifica o teto do Glitchtama. | `ULTRA_PATIENCE_DAYS`, `canReachUltra` em `src/types/progression.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **UnlockNudge** | O convite de compra dentro do app. **Nunca abre sozinho** e aparece em pontos declarados — ao bater o teto de criação do modo grátis e na página de Evolução de quem está no demo. | `UnlockAccountModal` em `src/components/UnlockAccountModal.tsx`; `unlockReasonCode` em `src/utils/telemetry.ts` | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) |

## V

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Vínculo (bond)** | A trilha unificadora: XP por peso de esforço, dias completos, noites, sonhos, marcos, triagem e check-in, com tetos por fonte repetível. **O nível NUNCA vai para o save** — é sempre derivado do XP total na leitura (footgun 9 na forma mais cara: duas fontes para o mesmo número). Destrava cosmético e superfície social, nunca capacidade de cuidar do bicho. | `bondLevelFor`, `applyBondXP`, `BOND_DAILY_CAP`, `BOND_MAX_LEVEL` em `src/utils/bond.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| **Virada do dia** | O momento em que o dia anterior é fechado: perda de HP, folga semanal, alívio de segunda, relatório, energia zerada. É função **PURA**, e o hook só a agenda. | `computeDailyReset` em `src/utils/dailyReset.ts`; `useDailyReset` em `src/hooks/useDailyReset.ts` | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |

## W

| Termo | O que é | Símbolo / dono no código | Onde se aprofunda |
|---|---|---|---|
| **Web Push** | O canal de push por VAPID, que cobre PWA e desktop e também funciona dentro do WebView do Android. Ver **Push**. | `functions/api/subscribe.js`, `workers/webpush.js`, `public/sw.js` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **Widget** | Os atalhos na tela inicial do Android. **O widget NÃO COBRA** — é a superfície mais exposta do telefone, vista dezenas de vezes sem que ninguém decida abri-la. Placar, percentual de constância e escudo estão vetados ali. | `SoulmonWidgetPlugin` em `src/plugins/SoulmonWidgetPlugin.ts`; guard em `src/plugins/widgetSemCobranca.contract.test.ts` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| **WP** | *Work package* — um pacote do plano de melhorias, com aceite escrito, guarda dono e linha no ledger. Aparece em comentários de código como `WP4.15`, `WP0.10` etc. | [`PLANO-MELHORIAS.md`](../PLANO-MELHORIAS.md), [`LEDGER.md`](../plano-melhorias/LEDGER.md) | [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md) |

---

## Nomes que mudaram

Quem encontrar o nome da esquerda num commit, num comentário ou num doc de registro está lendo algo anterior à data indicada.

| Nome antigo | Nome de hoje | Quando | Onde a troca está registrada |
|---|---|---|---|
| "dia perfeito" (interface) | **dia completo** / *complete day* | 07/09/2026 (decisão P5) | [09-HISTORICO.md](09-HISTORICO.md) |
| ⚰️ `digiapp_state_v3` | `soulmon_state_v1` | 07/09/2026 | `STORAGE_KEYS` e `migrateLegacyStorageKeys` em `src/utils/storageKeys.ts` |
| ⚰️ prefixo `digiapp-` de `localStorage` | prefixo `soulmon-` | 07/09/2026 | `STORAGE_KEYS` em `src/utils/storageKeys.ts` |
| ⚰️ `digimonName` | `petName` (cliente, chat e push); `pet_name` no bridge Android | 07/09/2026 | `src/utils/petName.ts` |
| ⚰️ `LEGACY_FORM_TIERS` | não existe mais — id fora do esquema cai em rookie e o sprite cai em arte nossa por hash | 07/09/2026 | `getSpriteForStage` em `src/utils/sprites.ts` |
| ⚰️ estágios ovo / baby-i / baby-ii | a árvore nasce em **rookie** | anterior a 26/08/2026 | `EvolutionStage` em `src/types/progression.ts` |
| ⚰️ `PURE_WINDOW_DAYS` / `pureWindow` | `STEADY_WINDOW_DAYS` / `steadyWindow` — um selo que nomeia a PUREZA fabrica a impressão de que quebrar suja | 06/09/2026 | `src/utils/habitRhythm.ts` |
| ⚰️ `equippedFurniture` (uma decoração, badge no canto) | `equippedDecor` (um item por espaço do palco) | — | `migrateDecor` em `src/contexts/GameStateContext.tsx` |
| Pyrakamon · Akashaoimon · Nimbratamon | **Pyraka · Akashaoi · Nimbrata** (nenhum nome de criatura leva sufixo fixo tipo "-mon"; os ids `kaelen`/`orrin`/`thalindra` NÃO mudaram) | 08/09/2026 | `DUNGEON_LINE_NAMES` em `src/utils/sprites.ts` |
| ⚰️ binding KV `DIGIAPP_SAVES` como única opção | o acessor aceita `SOULMON_SAVES` **e** `DIGIAPP_SAVES` — separar os DADOS continua sendo decisão do dono | 07/09/2026 | `kv` em `functions/api/_kv.js` |

---

*Termo que faltar aqui: acrescente a linha no doc dono do assunto e depois nesta tabela — nesta ordem, nunca só aqui. O glossário APONTA; ele não é fonte da regra.*
