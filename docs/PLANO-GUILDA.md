# Plano: a Guilda do Soulmon (o Bosque e a Feira)

> **Dono:** dono do produto (decide) · redação: sessão de consolidação da Guilda · **Data:** 29/09/2026 · **Estado:** rascunho
> **Etiqueta:** plano. Descreve o que se pretende; **o estado é o código**. Nada aqui está implementado.
> **Verificação:** `node docs/reviews/guilda/sim/guilda-sim.mjs 42 200` reproduz a §8; `npx vitest run src/docsManual.contract.test.ts` exige que este arquivo esteja indexado no `00-MAPA.md` §6.2. Os testes citados como "régua proposta" **ainda não existem**: nascem no WP que os cita (§14).
> **Não cobre:** o coop no ar hoje (é o [`PLANO-COOP.md`](PLANO-COOP.md), executado, e o manual [02 §56](manual/02-REGRAS-DE-NEGOCIO.md#comunidade)); a bíblia do universo ([`NARRATIVA-E-UNIVERSO.md`](NARRATIVA-E-UNIVERSO.md)); a copy final (é do `soulmon-copy-redator`).
> **Fontes:** `docs/reviews/guilda/00-inventario-tecnico.md` · `01-benchmark.md` · `02-psicologia.md` · `03-lore.md` · `04-arena.md` · `05-servidor.md` · `06-produto-telas.md` · `07-balanceamento.md` (+ `sim/guilda-sim.mjs`). Onde este plano e uma fonte divergem, **vale este plano** e a divergência está marcada como "alternativa que perdeu".
> **Precedência:** código > teste > `CLAUDE.md` > manual > este documento. Onde discordarem, o código está certo e este doc tem defeito.
> **Referências:** sempre `arquivo` + SÍMBOLO, nunca número de linha.

---

## 0. Status, o que já está decidido e por que existe

### 0.1 Status

**PLANO, CONGELADO.** A Guilda é Camada 3 pura, e a Camada 3 está congelada
desde 21/09/2026 até **10 usuários conhecidos × 14 dias de dado**
(`REGISTRO-DE-DECISOES.md`, linha "Camada 3 CONGELADA", sob §5.6). O coop
atual está listado nominalmente nesse congelamento. **Nenhum WP da §14 começa**
antes de uma de duas coisas:

1. o gatilho de revisão ser atingido (medido por `scripts/metrics-report.mjs`), **ou**
2. o dono registrar uma **exceção** na mesma linha do `REGISTRO`, como fez com o
   `BOOKLET-UNIVERSO.md` em 22/09/2026 ("o que não pode é drift sem decisão").

### 0.2 Decisões do dono (29/09/2026, modal)

| # | Decisão | Consequência neste plano |
|---|---|---|
| D-G1 | O **Grupo cooperativo EVOLUI para Guilda de até 12**; **um coletivo por pessoa** | Não nasce um segundo sistema social: é o coop (`functions/api/_coop.js`) com teto maior e duas camadas novas. `COOP_MAX_MEMBERS` 4 → 12 |
| D-G2 | A construção é o **Bosque** (Clareira → Ramagem → Copa → Mata → Bosque antigo); **1 fio por membro que cumpre a própria meta do dia**, agregado, anônimo, **nunca regride** | §3 linhas 🌳 e 🧵; LV-G1, LV-G3 |
| D-G3 | Esta sessão entrega **só o plano + fila de WPs**; a Camada 3 segue congelada e o código espera o gatilho ou uma exceção registrada | §0.1, §14 |
| D-G4 | A arena de guilda é a **raid cooperativa** (a **Feira**), **sem confronto guilda × guilda** | §3 linha 🎪; a variante (c) do `04-arena.md` §2 está descartada |

**Sobre o nome "Feira":** passou pelo parecer de lore (`03-lore.md` §2, linha
"A arena de grupo") com ⚠️ de PI — `soulmon-ip-brand-guardian` revisa antes de
qualquer string, junto com Bosque/Grove e roda/circle. ⚠️ **Mas a lore a
descreveu como encontro ENTRE bosques** ("Tem gente de outros bosques",
`03-lore.md` §4 linha 6b). Com D-G4, a Feira é o encontro **da roda** contra um
fenômeno; as falas 6/6b/7 do parecer precisam ser reescritas pela
squad-narrativa (item G14 da §15).

### 0.3 Por que existe

- **Essência** (`PLANO-EVOLUCAO.md`): o Soulmon é um avatar que evolui COM o
  usuário e o encoraja — nunca um cobrador. A Guilda estende o "COM" a outras
  pessoas **sem trazer o cobrador junto**. O risco específico é **terceirizar a
  cobrança**: o app não cobra, mas 11 pessoas cobram (`02-psicologia.md` §7.2).
- **Evidência**: `PLANO-EVOLUCAO.md` 4.3 — cooperação tem evidência mais forte
  que competição para adesão a hábito, e precisa de saída limpa, sem
  penalidade. 4.2 — em ambientes só-de-leaderboard, **31,3%** relataram efeito
  psicológico negativo de comparação. Carr & Walton (2014): o *sinal* de
  trabalhar junto aumenta persistência sem chat, placar ou prazo.
- **`soulGoal`**: o porquê do usuário **fica privado** e nunca é lido pela
  Guilda. A ligação aparece só para a pessoa, no `DailyReportModal`: o que ela
  fez hoje pelo próprio porquê *também* firmou um fio. O Bosque é
  **consequência** do cuidado, nunca o motivo (superjustificação, Deci,
  Koestner & Ryan 1999).
- **O que ela NÃO resolve**: o gargalo do projeto é distribuição, e o app não
  tem usuários (`CLAUDE.md`). Guilda em base vazia é tela vazia. O convite por
  código é canal de aquisição, mas o coop já cumpre esse papel com o mesmo
  código (`02-psicologia.md` §7.3).

---

## 1. Objetivo e como ajuda o jogador

**A promessa em uma frase** (modelo; a string final é do `soulmon-copy-redator`):

| EN (base) | PT-BR |
|---|---|
| A grove that gains a strand each time someone in the circle reaches their own goal for the day, and never shrinks. | Um bosque que ganha um fio cada vez que alguém da roda alcança a própria meta do dia, e nunca encolhe. |

Como ajuda: dá **pertencimento** (relatedness, Deci & Ryan 2000) a quem cuida de
si, sem frustrar **autonomia** (não há obrigação) nem **competência** (não há
comparação). O valor não vem de os outros verem você; vem de **saber que outros
também estão cuidando de si**.

| | Grupo (hoje) | Guilda |
|---|---|---|
| Teto | 4 (`COOP_MAX_MEMBERS`) | 12 |
| Sinal por pessoa | presença binária nominal | nominal **só até 4**; de 5 a 12, só agregado |
| Objeto comum | barra semanal `progress/target`, que tem estado de "não bateu" | **Bosque** que só cresce, sem meta que falha |
| Ritual | nenhum | Feira semanal cooperativa |

---

## 2. O que já existe e é reusado

| Peça | Onde | O que vira |
|---|---|---|
| Folha da Guilda | `src/components/guild/GuildSheet.tsx` › `GuildSheet` | Hoje só renderiza `CoopPanel`; Arena e Hall abrem a mesma folha (`src/components/nav/AreaView.tsx`, estado `sheet`). Vira o **Salão** (§6) com prop de sala inicial |
| Painel do grupo | `src/components/CoopPanel.tsx` › `CoopPanel` | Vira o bloco **Roda** + criar/entrar/sair |
| Estado do grupo | `functions/api/_coop.js` › `coopCkKey`, `gravarCheckins`, `gravarGrupo`, `renovarPrazos`, `coopLeave`, `semanaDe`, `rolarSemana`, `COOP_TTL` | **Dono do estado da Guilda.** A família de chaves `coop*` é mantida (§10.1) |
| Resposta do grupo | `functions/api/community.js` › `vistaDoGrupo`, ações `coop*`, `ensurePid`, `getProfile`, `stagePower` | `vistaDoGrupo` é substituída por `vistaDaGuilda` (uma montagem só); `coop*` ficam como aliases até o cliente migrar |
| Cliente | `src/utils/community.ts` › `createCoop`/`joinCoop`/`coopCheckin`/`leaveCoop`/`getCoop`, `gift`/`getGifts` | Ganha `getGuild`/`createGuild`/`joinGuild`/`threadGuild`/`hitRaid`/`getGuildRewards`/`claimGuildReward`/`renameGuild`/`newGuildCode`/`leaveGuild`; presentes seguem em Amigos |
| Ritual semanal | `src/utils/tournamentSeason.ts` (sex–dom), `src/utils/tournamentTiers.ts` | **Não** é reusado para a janela da Feira (§3, divergência 3); as faixas são o precedente de "medir contra si mesmo, nunca rebaixa" |
| Motor de arena | `src/utils/arena.ts` | A rodada da Feira é **animação local cosmética**; o resultado não vai ao servidor |
| Cenários | `src/utils/backgrounds.ts` › `PET_BACKGROUNDS` (padrão `bg-mission-*`); `src/utils/dungeonScenes.ts` › `SHOP_BG_ACCENTS`/`SHOP_BG_SCENES` | `bg-guild-*` entram em `PET_BACKGROUNDS` e **ficam fora** de `SHOP_BG_ACCENTS` — fora da loja e do sorteio da masmorra por construção |
| Texto de jogador | `functions/api/_redact.js` › `minimizeForAi` | Sanitiza nome da guilda (e o apelido do perfil) |
| Lápide / exclusão | `functions/api/_accountTombstone.js`; `functions/api/account.js` › `handleDeleteConfirm` | Inalterados no contrato; `coopLeave` ganha passos (§10.6) |
| Telemetria | `functions/api/metrics.js` › `EVENT_SCHEMA`; `src/utils/telemetry.ts` | Ganha 6 eventos (§10.8) |
| Intersticiais | `src/App.tsx` › `const interstitial` | Ganha `'groveMilestone'` (§4) |

### 2.1 As 5 dívidas do coop atual que o plano corrige de carona (`05-servidor.md` §0)

| # | Dívida | Corrigida em |
|---|---|---|
| D-1 | **Nome do grupo sem tratamento**: `coopCreate` só faz `replace/trim/slice(0,24)`, contra o que o `PLANO-COOP.md` prometia | WPG-2 (`sanitizarNomeDeGuilda`) |
| D-2 | **Presença nominal** (`apareceuHoje` por membro em `vistaDoGrupo`) viraria chamada de sala de aula acima de 4 — subir o teto é uma linha | WPG-1 (`presence` só com ≤4) |
| D-3 | **`stage` por membro na vista** contradiz "exibir GALHO, não altura" (`REGISTRO` §5.5) e encosta em LV-G10 | WPG-1 (`line` no lugar de `stage`) |
| D-4 | **Exportação não carrega o progresso próprio** (`account.js` exporta a vaga, não o conteúdo) | WPG-6 |
| D-5 | **Não existe evento de telemetria de coop** | WPG-7 |

### 2.2 Invariantes herdadas (não podem cair; já travadas por `functions/api/community.coop.test.js` e irmãos)

I1 uma única montagem de resposta · I2 nenhuma resposta devolve `saveId` · I3
cada membro escreve só a própria chave no caminho quente · I4 entrar confere a
própria entrada (`409 join collision`) · I5 as três chaves de índice renovam
juntas · I6 TTL 120 d renovado pelo evento diário · I7 meta/HP derivados do
tamanho, nunca gravados · I8 um coletivo por pessoa · I9 entrada só por código ·
I10 sair = `coopLeave`, idempotente, mesmo passo da exclusão de conta · I11
virada de semana é LIDA, sem cron.

---

## 3. Regras de jogo

Cada linha: regra · **dono** (arquivo + símbolo proposto) · **régua** (teste
proposto) · **decisão** (fonte).

| Sistema | Regra | Dono | Régua | Decisão |
|---|---|---|---|---|
| 🫂 Guilda / a roda | Até **12** membros (`GUILD_MAX_MEMBERS`). **Um coletivo por pessoa** (409 `already in a guild`). Entrada **só por código**; nada achável. Nunca pago, sem vínculo mínimo. Guilda de 1 é permitida. Na UI: "Guilda" (nome do lugar, já nos lotes) e "roda"/"circle" (quem está nela) — ver G2 | `functions/api/_coop.js` › `GUILD_MAX_MEMBERS`; `functions/api/guild.js` › `guildCreate`/`guildJoin` | `functions/api/guild.vista.test.js` | D-G1; `02-psicologia.md` §6.1 |
| 🌳 Bosque | Cinco estágios, **perpétuo, só cresce**. Progresso em **dias-de-guilda**: a cada dia fechado soma `fios_do_dia / membros_ativos_do_dia` (1,0 = todos cumpriram). Limiares `BOSQUE_THRESHOLDS` = [2, 10, 25, 50, 90]. `bosqueProgress` é float que **só soma**, guardado no blob; o estágio é **derivado na leitura** (`bosqueStageFor`), nunca gravado — o padrão de `bondLevelFor(totalXP)`. Saída, exclusão, TTL e derrota na Feira **não tocam** o progresso já somado; só mudam a taxa futura | `_coop.js` › `bosqueStageFor`, `fecharDiasDoBosque` | `functions/api/bosque.monotonic.test.js` (property test, 500 seeds: estágio nunca decresce) | D-G2; `07-balanceamento.md` §1.1; LV-G3 |
| 🧵 Fio | **1 por membro por dia** (`FIO_PER_MEMBER_DAY`), afirmado pelo cliente (`guildThread kind:'fio'`) quando o app vê a **própria meta do dia cumprida** — `dailyGoalFor` inteira, pela letra de D-G2 (ver G1: a psicologia recomenda `heartGoalFor`). Idempotente por (dia, pessoa). Nunca por peso ou contagem de tarefa. O fio **não leva nome**. Disparo **fora** de updater (footgun 6). "Dia" = dia UTC do servidor (G6) | `guild.js` › `guildThread`; cliente: efeito após o set, no mesmo ponto que hoje decide a meta | `bosque.monotonic.test.js` (2 fios no mesmo dia = 1) | D-G2; `05-servidor.md` §3 (alternativa A); LV-G8 |
| 🌊 Marés | Ciclo de **6 semanas** (`GUILD_TIDE_WEEKS`). Cada maré tem uma **obra sazonal** (a floração), meta `TIDE_BLOOM_TARGET` = 12 dias-de-guilda. Na virada é **colhida no estado em que estiver** e vira peça permanente do Bosque, em três tamanhos descritivos (broto <4 · ramo 4–11 · floração ≥12), nenhum chamado de pior. Nenhuma maré falha; nada é resetado. A paleta volta no ciclo seguinte do ano (não é FOMO) | `_coop.js` › `mareDe`, `colherMare` (lida, sem cron) | `functions/api/guild.mare.test.js` | `02-psicologia.md` §5.2; `07-balanceamento.md` §2; G5 |
| 🎪 Feira (raid) | Um **fenômeno** por semana, HP coletivo `raidHpFor` = `max(membros_ativos, 3) × 45`. **Uma rodada por pessoa por dia, só por gesto**, a qualquer hora, **semana ISO inteira** (seg 00:00 → dom 23:59 UTC). O cliente anima localmente (`arena.ts`) e afirma só "rodei"; o **servidor sorteia o dano** (`crypto.getRandomValues`): `10 + 2 × stagePower(stage)`, ±20%. A resposta nunca contém número de dano. Não exige ter cumprido a meta. Semana com `dano ≥ hp` fica `cleared` para sempre (mesmo se alguém sair); sem marca = "o fenômeno recuou", nunca "falhou". **Sem confronto entre guildas, sem ranking** | `_coop.js` › `raidHpFor`, `raidDamageFor`; `guild.js` › `guildRaidHit`; `stagePower` extraído para `functions/api/_profile.js` | `functions/api/guild.raid.test.js` | D-G4; `04-arena.md` §2a; `05-servidor.md` §4; `07-balanceamento.md` §3 |
| 🎁 Recompensas | Feira dissipada: **4 Emblemas** (`RAID_EMBLEMS`) a quem deu ≥1 rodada na semana; recuou: piso **2** (`RAID_EMBLEMS_FLOOR`, G9). O servidor registra o **direito** e o **resgate** (`coopClaim`), o cliente soma no save pelo caminho do Torneio (`onEarnEmblems`). 1 decoração a cada **4** Feiras dissipadas com participação (`RAID_TROPHY_EVERY`), slot `trophy`. Cenário `bg-guild-<estágio>` a quem estava na virada do marco **ou** firmou fio em **7 dias distintos** (`STAGE_UNLOCK_DAYS`, não consecutivos) — e **fica com quem sai**. Peça da maré vive no Bosque. **Só** o que o cliente já poderia farmar: cosmético e Emblemas | `guild.js` › `guildRewards`/`guildClaim`; `src/utils/backgrounds.ts` › `PET_BACKGROUNDS` | `functions/api/guild.recompensa.test.js`; `src/utils/guildReward.contract.test.ts` | `07-balanceamento.md` §4; `05-servidor.md` §4.5; LV-G6 |
| 🚪 Entrada · saída · anfitrião | Criar: qualquer conta com `saveId`, nunca pago. Entrar: código de 8 chars. **Sair: um toque**, sem confirmação, sem aviso, sem perda; `coopLeave` apaga as chaves pessoais e o progresso já somado fica. **Anfitrião** = quem criou; pode só **renomear** e **gerar código novo** (fecha a porta de um código vazado). Não vê nada que os outros não vejam. Sai → passa em silêncio ao membro mais antigo. **Sem expulsão na v1** (G7) | `guild.js` › `guildLeave`, `guildRename`, `guildNewCode`; `_coop.js` › `coopLeave` | `functions/api/guild.anfitriao.test.js` | `02-psicologia.md` §6.2; `05-servidor.md` §5.3 |
| 🧳 Viajante | Membro sem fio há **≥ 4 semanas** (`TRAVELER_AFTER_WEEKS`) sai da conta de membros ativos (denominador do Bosque, HP da Feira, agregado), **continua na roda** e volta com um gesto. Derivado de `coopFio.lastDay`, nunca gravado, visível a ninguém | `_coop.js` › `membrosAtivos` | `guild.vista.test.js` (caso viajante) | `02-psicologia.md` §3.2; `05-servidor.md` §5.4 |
| 🚫 O que NUNCA acontece | Contribuição por pessoa em qualquer unidade · lista de ausentes · Bosque que desce, murcha, seca ou perde peça · push sobre outro membro · custo de sair · algo à venda · a Feira tocar o Bosque · ranking entre guildas · contribuição por peso de tarefa · recompensa que exige horário ou dias seguidos · HP/estágio da criatura alheia visível · chat livre · `soulGoal` visível à guilda | §13 | §13 | `02-psicologia.md` §6.4 |

### 3.1 Constantes propostas (tabela única)

Todas moram em **`functions/api/_coop.js`** (o servidor decide); a UI lê por
reexport tipado em `src/types/guild.ts`. **Nenhum outro arquivo inventa
número** (o mesmo contrato de `src/types/taskModel.ts`).

| Constante | Valor | Justificativa (uma linha) |
|---|---|---|
| `GUILD_MAX_MEMBERS` | 12 | D-G1; camada de ~15 de Dunbar com folga; `COOP_MAX_MEMBERS` vira alias até WPG-8 |
| `GUILD_NOMINAL_PRESENCE_MAX` | 4 | Com 4 é companhia, com 12 é chamada de sala de aula (`02` §2.2) |
| `FIO_PER_MEMBER_DAY` | 1 | Um fio por quem cumpriu, nunca peso (LV-G8) |
| `BOSQUE_THRESHOLDS` | [2, 10, 25, 50, 90] dias-de-guilda | Marco 1 em ≤7 d a 30% de presença; Bosque antigo ≈150 d a 60% |
| `STAGE_UNLOCK_DAYS` | 7 dias distintos | Anti "entrar, pegar 5 cenários, sair" sem exigir sequência (LV-G9) |
| `TRAVELER_AFTER_WEEKS` | 4 | Igual ao apagamento de grupo inativo do coop |
| `GUILD_TIDE_WEEKS` | 6 | Faixa 4–6 da psicologia, no teto para caber meio ciclo de hábito |
| `TIDE_BLOOM_TARGET` | 12 dias-de-guilda | Floração em ~20 d a 60% |
| `GUILD_MIN_RAID_MEMBERS` | 3 | Piso do HP: guilda de 1–2 não fica trivial |
| `RAID_HP_PER_MEMBER` | 45 | 60% de presença derruba na sexta |
| `RAID_DMG_BASE` / `RAID_DMG_PER_POWER` | 10 / 2 | Ultra = 1,67× rookie: estágio conta sem virar pay-to-win |
| `RAID_DMG_JITTER` | 0,20 | Sorteio no servidor |
| `RAID_ROUNDS_PER_DAY` | 1 | Teto diário por `saveId`; não reusa `MATCHES_PER_DAY` do Torneio |
| `RAID_EMBLEMS` | 4 | < 1,5 vitória do Torneio: pesa para quem não compete, sem esvaziar a escada 8..70 |
| `RAID_EMBLEMS_FLOOR` | 2 | Recuar é sabor, não castigo (G9) |
| `RAID_TROPHY_EVERY` | 4 | Um marco de coleção por mês de Feiras |
| `GUILD_NAME_MAX` | 24 | Herdado do coop |
| `GUILD_LIGHT` (rate limit) | 60 req / 60 s por IP | Nenhuma ação varre prefixo (máx. ~40 `get`) |

### 3.2 As três divergências entre as fontes, reconciliadas

| # | Tema | **Escolhido** | Por quê (uma linha) | Alternativa que perdeu |
|---|---|---|---|---|
| 1 | Fórmula de dano | **`10 + 2 × stagePower`, ±20%** (`07` §3) | É a fórmula contra a qual `RAID_HP_PER_MEMBER = 45` e a simulação foram calibrados; trocar uma sem a outra descalibra | `6 + 2 × stagePower + rnd(0..4)` (`05` §4.1): média 13, faria 60% de presença cair só no domingo com K=45 |
| 2 | Limiar da presença nominal | **≤ 4** | `02` §2.2, `05` §2.3 e `06` §1 recomendam 4; é o teto que o coop já validou em código | ≤ 5 (a pergunta aberta de `02`/`05`/`06`) |
| 3 | Janela da Feira | **Semana ISO inteira**, dia UTC | LV-G9: janela de 3 dias com teto 1/dia dá 3 chances a quem pode no fim de semana e nenhuma a quem não pode | Sex–dom colada à `tournamentSeason` (`04` §2) |

Outras reconciliações feitas aqui (menores, mas que deixariam duas verdades):

- **Unidade do Bosque**: dias-de-guilda proporcionais (`07`) **vencem** fios crus absolutos 0/30/120/360/900 (`05` §1.3) — no absoluto, a guilda de 3 levaria 833 dias e alts comprariam velocidade. Com isso o `fiosHerdados` do `05` **some**: o progresso já está somado no blob no fechamento do dia, e sair não tem o que dobrar. `coopFio` continua existindo, mas só para `lastDay` (viajante), dias distintos (`STAGE_UNLOCK_DAYS`) e exportação.
- **Onde moram as constantes**: `_coop.js` (`05` §1.1, manter a família `coop*`) **vence** um `_guild.js` novo (`07` §4.4). **`stagePower`** vai para `_profile.js` (`05`), não `_stage.js` (`07`).
- **HP**: `max(ativos, 3) × 45` (`07`) **vence** `size × 45` (`05`) — o piso impede guilda de 1–2 trivial; viajantes fora da conta (`05` §5.4).
- **Emblemas**: a quem deu ≥1 rodada (`07`) **vence** "todos os membros no fechamento, presentes ou não" (`04`/`05`); a rodada é gesto de um toque sem pré-requisito, e o que se veda é pagar por *tamanho* de contribuição, não por ter vindo. Nunca proporcional ao dano.
- **Sprites no palco do Bosque**: até 4 criaturas, só em guilda de até 4 (`06` §3.2) **vence** até 20 rotacionados (`04` §3) — a fileira com lacunas é a sala de aula que LV-G2 veta.
- **Vínculo na Feira**: só o teto diário por `saveId` (`06` §2.1) **vence** o gate `BOND_PVP_MIN_LEVEL` (`04` §4) — o gate barraria justamente o novato convidado.

---

## 4. Como os jogadores interagem

- **O agregado nunca aparece com valor 0** (parecer do guarda, 29/09/2026): "hoje, 0 fios firmaram" é o placar vazio da manhã e lê como chamada; com 0 a linha simplesmente não é desenhada. Régua: `guild.vista.test.js` (`threadedToday` é `null` quando 0).
- **Presença binária** até 4 membros (nome + veio/não veio hoje, como o `CoopPanel` faz). **De 5 a 12, só o agregado** ("hoje, 7 fios firmaram"), sem nomes de quem veio ou não. O agregado só aparece com `size ≥ 5` — em 2, o número identifica o outro.
- **Três gestos fixos**, anônimos, para a roda inteira e nunca para uma pessoa escolhida; um de cada por dia, recebidos **em lote** ao abrir, sem push:

  | Gesto | Ícone | EN (modelo) | PT (modelo) |
  |---|---|---|---|
  | Aceno | `waving_hand` — **não está no subset de `src/styles/tokens.md`**, entra no WP de UI (senão renderiza vazio); fallback já inventariado `sentiment_satisfied` | Someone waved at the circle. | Alguém acenou para a roda. |
  | Luz | `light_mode` | Someone left a little light. | Alguém deixou uma luz. |
  | Descanso | `bedtime` | Someone wished everyone a good rest. | Alguém desejou bom descanso. |

- **Sem chat livre** na v1: menores e moderação, texto livre é onde a cobrança volta, e ninguém modera.
- **Presentes** (`gift`/`getGifts`) seguem na aba Amigos da `LibraryPage` — presente é 1:1, a Guilda é da roda.
- **Cerimônia de marco do Bosque**: tipo novo `'groveMilestone'` na união de `const interstitial` (`src/App.tsx`). **Posição: depois de `dailyReport` e `checkIn`, antes de `dream`.** Espera o gesto (z-300, como a `MilestoneCeremony`); movimento reduzido reduz o movimento, nunca a pausa. Toca uma vez por pessoa por estágio (`soulmon-guild-last-stage` em `storageKeys.ts`).
- **Slot de avisos da Home**: um aviso de marco, **último** da ordem (depois de "recomeço"), só no dia do marco novo. Régua: `src/components/filaDeAvisos.contract.test.ts` ganha a posição.
- **NUNCA push de cobrança** — e, na v1, **nenhum push da Guilda**, nem de celebração (§10.9).

---

## 5. Criar · encontrar · entrar · sair

**Critérios**: nunca pago (LV-G6; revolta do Remote Raid Pass, `01-benchmark.md` §4 item 7) · sem vínculo mínimo · exige conta (`saveId`); o demo vê o convite para criar conta · um coletivo por pessoa.

**Descoberta**: (1) lote do **Hall** "Salão da Guilda" e lote da **Arena** "Feira" (§6); (2) NPC `'hall:guilda'`/`'arena:guilda'` em `src/utils/areaNpcVoice.ts`, hoje dizendo "grupo pequeno" (fica falso com 12) — modelo: EN "Some creatures keep a grove together. It only grows." / PT "Algumas criaturas cuidam de um bosque juntas. Ele só cresce."; (3) link de convite com o código preenchido, caminho principal. **Nunca** por push, aviso na Home ou nudge.

| Estado | O que aparece | Copy (modelo EN / PT) |
|---|---|---|
| Carregando | `sync` girando [existe] | Looking for your circle… / Procurando sua roda… |
| Sem guilda | Clareira vazia no visor, sem slot marcado nem "+"; **Criar** `primary`, **Entrar** `outline` | No circle yet. Open a clearing, or join with a code. / Ainda sem roda. Abra uma clareira ou entre com um código. |
| Criar | Nome (24, sanitizado) → código grande + `share`, fallback `content_copy` | Share this code with up to 11 people. / Compartilhe este código com até 11 pessoas. (o número sai de `GUILD_MAX_MEMBERS − 1`) |
| Nome recusado (400 `invalid name`) | Alerta âmbar (`gold-ink`), nunca `danger` | Names can't carry contacts or links. / O nome não pode ter contato nem link. |
| Código inválido (404) | Alerta âmbar | That code didn't open any clearing. / Esse código não abriu nenhuma clareira. |
| Cheia (409 `guild full`) | Alerta âmbar | This circle is full. / Esta roda está cheia. |
| Já em outra (409 `already in a guild`) | Alerta âmbar + botão de sair ali | You're already in a circle. / Você já está numa roda. |
| Colisão (409 `join collision`) | Tentar de novo | Try once more. / Tente de novo. |
| Sem rede / 503 | Alerta âmbar, nada muda | No connection. Nothing changed. / Sem conexão. Nada mudou. |
| Sozinho | O Bosque cresce com 1 | — |
| Sair | **Um toque**, sem confirmação, sem aviso, sem perda | Go your own way / Seguir o próprio caminho |
| Anfitrião sai | Papel passa em silêncio ao mais antigo | — |
| Viajante volta | Tudo como estava — **enquanto a guilda existir** (as chaves têm TTL de 120 d renovado por qualquer movimento; ver G17) | Hi. The grove's still here. / Oi. O bosque tá aqui. |
| Esvaziou | Apagada sem tombstone; a pessoa guarda **localmente** o último estágio visto como postal | nunca "seu grupo morreu" |

---

## 6. Acesso no mapa e salas

- **Hall → "Salão da Guilda"**: a porta da **Guilda**, o lar; abre no Bosque.
- **Arena → "Feira"**: a porta da **Feira**; abre direto no fenômeno da semana. Precisa de id novo `'feira'` em `ArenaLotId` (`src/utils/areaSheetCopy.ts`), nos testes `areaLotsNovos.test.ts`, de arte de lote (hoje `GUILDA_LOT_ART`) e de uma prop de sala inicial no `GuildSheet`.
- **O Salão é UM scroll com três seções, sem abas** (a minimal-ui tirou as abas de dentro das folhas — `AreaView.tsx`, `docs/design/minimal-ui/README.md` item 5):

| Seção | Mostra | NÃO mostra | Gesto |
|---|---|---|---|
| **Bosque** (topo) | O visor com o cenário do estágio; "Seu fio firmou hoje" **só para você**; agregado (≥5); nome do estágio; faixa de progresso **sem número** ("a Copa está perto") | "faltam X", percentual, contribuição por pessoa, ausentes, desgaste | **Firmar meu fio** (substitui "Avisar que apareci hoje"); tocar leva o seu pet a dar uma volta |
| **Roda** | ≤4: nome + presença binária + criaturas no palco do Bosque. 5–12: nomes em ordem de chegada, **sem estado de presença**, + agregado | HP, degeneração, estágio de evolução, "N dias", ícone de inativo | os 3 gestos |
| **Mural** | Marcos com **DATA**, peças de maré colhidas, boas-vindas | números por pessoa, quem saiu, "próximo marco em X" | ler |

- **Ajustes** num ícone `settings` no cabeçalho da folha: renomear e código novo (só anfitrião), sair (todos).
- **O palco do Bosque é NOVO.** `src/utils/petStage.ts` descreve o palco de **um pet só** (`PET_BOX` = 152, `PET_TOP_OFFSET`, `BASE_SLOTS` só com `'nest'`; os `DECOR_SLOTS` são caixas de objeto). O palco do Bosque tem posições próprias para até 4 criaturas pequenas na linha do chão, em **poses de trabalho**, ordem de chegada do dia rotacionada por seed; o palco pessoal não é tocado. ⚠️ `PALCO-E-DECORACAO.md` diz sprite 80×80 e o código diz 152: quem desenhar mede no código. Sprites **só de `src/assets/soulmon/`** por `line`+estágio, nunca URL de sprite de outro jogador (`isSafeSpriteUrl` não fixa host).

---

## 7. Benefícios

| Ganha | Como | Regra |
|---|---|---|
| Pertencimento | Bosque, gestos, Mural | — |
| **Cenário `bg-guild-<estágio>`** (5) | Quem estava na virada do marco, ou firmou fio em 7 dias distintos | É **conquista**: fica com quem sai. Em `PET_BACKGROUNDS`, `setting:'outdoor'`, fora de `SHOP_BG_ACCENTS` (fora da loja e da masmorra), como os `bg-mission-*` |
| **Peça da maré** | Colhida a cada 6 semanas | Vive no Bosque (blob da guilda, `g.ornaments`), não no save de ninguém |
| **Troféu da Feira** | 1 decoração a cada 4 Feiras dissipadas com participação | Slot `trophy` do palco pessoal; contador lifetime sem janela |
| **Emblemas** | 4 (dissipada) / 2 (recuou) por semana com ≥1 rodada | Resgate registrado no servidor (`coopClaim:<save>:<week>`), saldo no save; compram só cosmético (`TOURNAMENT_ITEMS`) |
| **NUNCA** | coração, Créditos, energia, `perfectDays`, Glitchtama, Bits acima da masmorra, vantagem de evolução, fio ou estágio comprável | LV-G6, LV-G7 |

---

## 8. Balanceamento

### 8.1 Prazos do Bosque por presença (`dias = limiar / presença`, igual para 3, 6 ou 12 membros)

| Estágio | Limiar | 40% | 60% | 80% |
|---|---|---|---|---|
| 1 Clareira | 2 | 5 d | 4 d | 3 d |
| 2 Ramagem | 10 | 25 d | 17 d | 13 d |
| 3 Copa | 25 | 63 d | 42 d | 32 d |
| 4 Mata | 50 | 125 d | 84 d | 63 d |
| 5 Bosque antigo | 90 | 225 d | 150 d | 113 d |

Intervalos crescentes (2, 8, 15, 25, 40): marco cedo como progresso dotado; a Mata cai perto dos 66 dias de Lally.

### 8.2 Feira: HP `max(ativos,3) × 45`, dano médio ≈16/rodada (criatura média champion/ultimate)

| Presença média | Dias até dissipar | Resultado |
|---|---|---|
| 100% | 2,8 | quarta |
| 80% | 3,5 | quinta |
| 60% | 4,7 | sexta |
| 45% | 6,3 | domingo |
| 30% | 9,4 | recua |

Só 1 membro jogando numa guilda de 3 (HP 135): rookie recua; ultra com sorte derruba no domingo. Nenhum dos casos gera aviso a ninguém. Botão único de tensão, se o dono quiser: `RAID_HP_PER_MEMBER` = 55 leva 60% para domingo.

### 8.3 Emblemas por semana, antes → depois (90% de Feiras dissipadas; loja do Torneio = 245)

| Perfil | Hoje | Com a Feira | Semanas p/ esvaziar a loja |
|---|---|---|---|
| casual (missões + 2 partidas/dia) | ≈36 | ≈39,6 (+10%) | 6,8 → 6,2 |
| leve (só missões) | ≈8 | ≈11,6 (+45%) | 31 → 21 |
| pesado (5 partidas/dia) | ≈92 | ≈95,6 (+4%) | 2,7 → 2,6 |

### 8.4 Membro novo

Vê o Bosque inteiro no estágio atual (é dele também) e, desde o 1º dia, o próprio fio aparece como brilho novo na maré corrente (começou há no máximo 6 semanas). Não recebe retroativos: Emblemas de Feiras em que não estava, nem cenários de marcos anteriores antes de **7 dias distintos**. Hopping não acelera nada: o progresso é da guilda.

### 8.5 Simulação

`node docs/reviews/guilda/sim/guilda-sim.mjs 42 200` — 200 guildas, tamanho 3–12, presença por membro ~ Beta(3,2)×0,95 (média ≈57%), criatura uniforme rookie..ultra:

| Métrica | p10 | p25 | p50 | p75 | p90 |
|---|---|---|---|---|---|
| dia do marco 1 | 3 | 4 | 4 | 5 | 5 |
| dia do marco 3 (Copa) | 38 | 41 | 44 | 49 | 56 |
| dia do marco 5 (Bosque antigo) | 139 | 146 | 156 | 175 | 195 |
| Feiras dissipadas / semana | 69% | 93% | 97% | 97% | 100% |

186/200 chegam ao Bosque antigo em 200 dias; as 14 restantes seguem crescendo. Com horizonte 90 (`… 42 90`), nenhuma chega ao topo. A taxa de 90% é alta **de propósito**: a Feira é celebração, não filtro. ⚠️ O script ainda usa as constantes da §3.1 como literais; o WPG-3a/WPG-4 o passa a importar `_coop.js` (ou ganha teste de paridade).

---

## 9. Estética

- **"O Visor"** (`docs/manual/04-IDENTIDADE-VISUAL.md` §1): pixel art **só dentro do visor** (`.sm2-viewport-screen`). Roda, Mural, Ajustes e textos ficam no aparelho: tokens `--sm2-*`, Material Symbols, ícone pelado, nunca em box. Alerta em âmbar (`gold-ink`), nunca `danger`.
- **Paleta**: videira sobre cobre, a assinatura da Malha. **Proibido desenhar**: folha seca, galho caído, cor desbotada, ruína.
- **Fila para `docs/ASSETS-A-GERAR.md`, família `cenario`** (todos `outdoor`, `horizonY ≤ GROUND_Y` = 74, mesma composição com mais camadas a cada estágio):

  | id | Estágio |
  |---|---|
  | `bg-guild-clareira` | Clareira: chão comum aberto, primeiros fios |
  | `bg-guild-ramagem` | Ramagem: videira achou estrutura |
  | `bg-guild-copa` | Copa: a videira fecha em cima |
  | `bg-guild-mata` | Mata: camadas sobre camadas |
  | `bg-guild-bosque-antigo` | Bosque antigo: cobre tomado, luz filtrada |

  Mais uma arte de lote para `'feira'` (família `hud`/lote, a squad-arte decide).
- **4 FX da Feira** (família `fx`, sobre o visor, **sem sprite de inimigo**), em rotação semanal: `fx-fair-nevoa`, `fx-fair-mare`, `fx-fair-estatica`, `fx-fair-enxame`. O fenômeno é **tempo da Malha** (névoa, maré alta, estática, enxame: camada que não assentou), **nunca** a pilha de pendências de ninguém — ver `reviews/guilda/08-critica-narrativa.md` B2.
- **Movimento reduzido**: fio sem animação de crescimento, FX estático, cerimônia com pausa inteira.
- **Contraste (footgun 10)**: texto com cor própria `--sm2-*`, nunca herdada de `--foreground`; o agregado vai num painel, nunca direto sobre o pixel art; medido **por pixel** no Playwright.

---

## 10. Servidor e dados

### 10.1 Chaves (família `coop*` mantida; "Guilda" é nome de produto)

| Chave | Valor | Quem escreve | TTL |
|---|---|---|---|
| `coop:<gid>` | `{id, name, code, createdAt, members[], hostSave, weekKey, bosqueProgress, progressDay, tideKey, ornaments[]}` — campos novos opcionais, lidos com `?? padrão` | servidor (criar/entrar/sair/renomear/código; fechamento do dia; 1º resgate da semana) | 120 d, renovado — ⚠️ uma guilda sem nenhum movimento por 120 d **some com o Bosque**: é regressão por ausência (LV-G3), decisão em G17 |
| `coopOf:<save>` · `coopCode:<code>` | `<gid>` | servidor | 120 d, renovados juntos (I5) |
| `coopCk:<gid>:<save>` | `{weekKey, days[]}` (inalterado) | só o próprio membro | 120 d |
| `coopFio:<gid>:<save>` (novo) | `{lastDay, distinctDays}` | só o próprio membro | 120 d, renovado por `gravarGrupo` |
| `coopHit:<gid>:<week>:<save>` (novo) | `{days[], dmg}` | só o próprio membro | 21 d |
| `coopRaidOk:<gid>:<week>` (novo) | `{at, hp, members}` | servidor, 1ª leitura com `dano ≥ hp` (valor constante, idempotente) | 60 d |
| `coopClaim:<save>:<week>` (novo) | `{at, kind}` | servidor, no resgate | 60 d |

**Migração 4 → 12**: nenhuma. O blob de hoje já é um blob de guilda válido.

### 10.2 Ações de `functions/api/guild.js` (rota `/api/guild?action=…`)

Todas com `denyUnlessOwner(id)` (410 se lápide) e `GUILD_LIGHT`. Ações: `guild` (GET) · `guildCreate` · `guildJoin` · `guildThread` (`kind:'fio'`; `'semente'` só se G3) · `guildRaidHit` (devolve `landed:true`, **sem dano**; 429 `daily limit`, 409 `raid closed`) · `guildRewards` (GET) · `guildClaim` (409 `already claimed`, 404 `nothing to claim`) · `guildRename` / `guildNewCode` (403 `not host`) · `guildLeave` (sempre `ok`, idempotente). `community.js` mantém `coop*` como aliases finos até o WPG-8.

### 10.3 `vistaDaGuilda` — o que sai e o que NUNCA sai

```
{ id, name, code,               // code só para membros
  isHost,                       // só sobre quem pergunta
  size, full,
  members: [{ pid, name, line }],             // line = galho, nunca estágio (D-3)
  presence: size <= 4 ? [{ pid, cameToday }] : null,
  threadedToday: size >= 5 ? number : null,   // agregado, sem nomes
  mine: { threadToday, hitToday },
  grove: { stageIndex, band },                // band 0..4, nunca progresso cru
  tide: { tideKey, size: 'bud'|'branch'|'bloom' },
  raid: { weekKey, phenomenonId, open, cleared, hpBand } }  // hpBand 0..10
```

**Nunca sai** (cada item é asserção de `guild.vista.test.js`): `saveId`, `hostSave`, qualquer contagem por pessoa (fios, dias, dano, golpes), lista de quem não veio, quem saiu, HP/degeneração/estágio de criatura alheia, `bosqueProgress` cru, `dmg`, `attrs`, `soulGoal`.

### 10.4 Fronteira de confiança do fio

O fio é **afirmação do cliente** (a mesma fronteira do `PLANO-COOP.md` §4.6). Derivar do save no servidor não dá mais confiança — o save inteiro é escrito pelo cliente — e obrigaria copiar `dailyGoalFor` para o servidor (footgun 9). O servidor garante **1 por (dia, pessoa)**. Um adulterado faz a própria guilda crescer no ritmo de "todos cumpriram todo dia": não compra moeda, não entra em ranking, só é visto por quem ele convidou. O dano da Feira usa `stage` **declarado** no perfil: um adulterado bate 20 em vez de 12, e o fenômeno da própria guilda cai um dia antes.

### 10.5 Fechamento na leitura, sem cron

Bosque: toda requisição da guilda compara `progressDay` com hoje e fecha os dias pendentes (`fecharDiasDoBosque`), somando `fios/ativos` de cada um; fechar é idempotente porque o valor de um dia fechado é determinístico a partir das chaves. Feira: o estado está na CHAVE (`<week>`); `coopRaidOk` é gravado na 1ª leitura que vê `dano ≥ hp`; semana passada sem marca = recuou. Maré: `tideKey` derivado da semana; colher = registrar a peça no primeiro acesso da maré nova. Não há `closeSeason` nem chave de admin.

### 10.6 Exclusão e exportação de conta

**Exclusão** (`account.js` › `handleDeleteConfirm`, via `coopLeave`): apaga `coopFio`, `coopCk`, `coopHit` (semana corrente e anterior), `coopOf`, `coopClaim:<save>:*` (~9 semanas vivas, `get` diretos por `weekKey`, sem `list`); passa o anfitrião adiante. O progresso agregado do Bosque não é dado pessoal e fica. A lápide faz `denyUnlessOwner` devolver 410 em todas as `guild*`.
**Exportação**: `{ guildName, joinedAs, myDistinctDays, myHitsThisWeek, claimedWeeks[] }` — só o que é do titular; nenhum dado de outro membro.

### 10.7 O que vai (e não vai) para o `GameState`

**Nada da guilda no save**, nem `guildId`: o ponteiro autoritativo é `coopOf:<save>`, e um segundo mentiria depois de uma saída feita em outro aparelho. Só `localStorage` via `storageKeys.ts`: `soulmon-guild-last-stage` (cerimônia, postal, telemetria) e `soulmon-guild-thread-day`. Emblemas resgatados entram no save (são moeda do jogador). Régua: `src/utils/guildNoSave.contract.test.ts` (AST: nenhum campo `guild*`/`coop*` em `GameState`).

### 10.8 Telemetria (6 eventos; allowlist dupla `metrics.js` › `EVENT_SCHEMA` + `telemetry.ts`, props só inteiros em faixa, sem id de guilda nem pid)

| Evento | Props | Quando |
|---|---|---|
| `guild_create` | — | 200 de `guildCreate` |
| `guild_join` | `size` 2..12 | 200 de `guildJoin` |
| `guild_leave` | `size` 0..11, `weeks` 0..3 (faixa de permanência) | 200 de `guildLeave` |
| `guild_thread` | `kind` 0..1 | 1ª vez no dia |
| `guild_raid` | `outcome` 0..2 (golpe / dissipada vista / recuou vista) | golpe ou 1ª leitura do resultado |
| `guild_stage` | `level` 1..5 | 1ª vez que o cliente vê um estágio |

### 10.9 Push e rate limit

**Nenhum push da Guilda na v1.** Régua: `functions/api/guild.semPush.contract.test.js` (nenhuma referência a `coop`/`guild` em `workers/` e em `functions/api/_pushCopy.js`). Rate limit: `GUILD_LIGHT` em `_rateLimit.js` › `takeToken`, bucket `'guild'`.

---

## 11. Paridade

- **Widget Android**: no máximo o **nome do estágio** do Bosque, numa chave NOVA do bridge (as antigas são congeladas). Nunca contagem nem presença. `src/plugins/widgetSemCobranca.contract.test.ts` passa a varrer a chave nova.
- **Overlay desktop**: fora da v1. O fio firma pelo cuidado feito lá, que grava no mesmo save e é visto pelo app.
- **Idioma**: EN é a base, PT pelo padrão `language === 'pt-BR'`; nenhuma string só em PT (inclusive `aria-label`).
- **a11y**: movimento reduzido reduz movimento, nunca pausa; presença e estágio com texto, não só cor; toque ≥ 44 px; revisão pelo `soulmon-guarda-plataforma`.

---

## 12. Lore e vocabulário (`03-lore.md` §2–3, resumido)

| Conceito | PT | EN | Proibido |
|---|---|---|---|
| O coletivo | Guilda (lugar, UI) · a **roda** (quem está nela) ⚠️ | Guild · the **circle** ⚠️ | clã, tribo, facção, time, equipe |
| O lugar | o **Bosque** ⚠️ | the **Grove** ⚠️ | horta, fazenda, cidade, base, território |
| A unidade | **fio** | **strand** | semente/broto (colidem com `tournamentTiers.ts`), folha, tijolo, ponto, XP, contribuição |
| Estágios | Clareira · Ramagem · Copa · Mata · Bosque antigo | Clearing · Boughs · Canopy · Thicket · Old grove | nível, level, upgrade; `seed`/`sprout`/`sapling`/`tree` (são `HABIT_MILESTONES`) |
| A raid | a **Feira** ⚠️, contra um **fenômeno** | the **Fair** ⚠️ | guerra, batalha de clãs, raide, conquista, Gathering, liga, coliseu |
| O ciclo | a **maré** | the **tide** | temporada de ranking, reset, wipe |
| Quem abriu | **anfitrião/anfitriã** | **host** | líder, chefe, mestre, dono, fundador |
| Entrar / sair | chegar à roda / **seguir o próprio caminho** | join the circle / go your own way | abandonar, desertar, ser expulso |

| Mecânica | Significado | Frase que NUNCA pode ser dita |
|---|---|---|
| Entrar | Uma borda a mais encosta no chão comum | "Agora você tem responsabilidade com o grupo" |
| Sair | A borda desencosta; o que firmou fica | "Você abandonou o grupo", "o bosque perdeu X", "tem certeza? eles vão ficar sozinhos" |
| Fio | Um fio firmou (nomeia o ATO, não a pessoa) | "Você é o que mais contribui", "Ana trouxe 9 fios" |
| Ausência | Nada; a roda não tem lugar vazio desenhado | "Fulano não apareceu hoje", "o grupo esperou você" |
| Guilda vazia | O chão volta a ser Malha aberta | "Seu grupo morreu", "ruínas" |
| Bosque parado | Está do tamanho que está | "O bosque está murchando", "faltam N para não perder" |
| Feira dissipada | O fenômeno se desfez diante da roda | "Vocês são campeões", "MVP" |
| Feira recuou | O fenômeno voltou para a névoa; o Bosque segue como estava | "Vocês perderam", "por culpa de quem não lutou" |
| Maré vira | O que assentou, ficou | "Reset", "tudo zerou", "última chance" |

**Strings-modelo da Feira** (substituem as falas 6/6b/7/7b de `03-lore.md` §4, que falavam de "outros bosques" contra D-G4; a final é do `soulmon-copy-redator`):

| Momento | Voz | EN (base) | PT-BR |
|---|---|---|---|
| Feira aberta | mundo | The tide opened the Fair. Something came in from the mist. | A maré abriu a Feira. Algo chegou da névoa. |
| | pet | It's all fuzzy over there. Shall we go? | Tá tudo embaçado ali. Vamos? |
| Rodada feita (hoje) | mundo | Your round reached it. | A sua rodada chegou até ele. |
| Dissipado | mundo | The phenomenon came apart before the circle. | O fenômeno se desfez diante da roda. |
| | pet | Look, the air's clear. | Olha, o ar limpou. |
| Recuou | mundo | The phenomenon went back into the mist. The grove stays as it was. | O fenômeno voltou para a névoa. O bosque segue como estava. |
| | pet | It went away on its own. | Ele foi embora sozinho. |

Nenhuma fala da Feira cita outro bosque, outra roda, "o outro lado" ou adversário com gente dentro.

**Nota da régua narrativa** (`src/narrativa.contract.test.ts`): nenhum termo
acima casa com `TERMOS`. O risco é o **espalhamento para arquivo NOVO**: se a
Feira ou a roda citar galho, em arquivo novo (`guild.js`, `GuildSheet` novo,
`FeiraSheet`) escreve-se **Ruptura / Trama / Guarda** (*Rupture / Braid / Ward*,
nunca `Weave`), não `Vírus`/`Vacina` — o rótulo aceito só vive nos arquivos de
`EXCECOES`. O mesmo vale para `Glitchtama` (a Feira não o premia; se um dia
premiar, importe o rótulo de onde ele mora). A bíblia (§7.1, §12) e
`NARRATIVA-PROPOSTAS.md` só ganham a Guilda no mesmo passe que o código.

---

## 13. Linhas vermelhas da Guilda (`02-psicologia.md` §6.4, literal)

| Linha | Texto | Régua que trava (quando houver) |
|---|---|---|
| **LV-G1** | A guilda nunca mostra quanto cada membro contribuiu, em nenhuma unidade. | `functions/api/guild.vista.test.js` (nenhum `dmg`/`total`/contagem por pessoa) + `GuildSheet.render.test.tsx` |
| **LV-G2** | A guilda nunca mostra quem não apareceu, hoje, na semana ou na estação. | `guild.vista.test.js` (com 5+ membros `presence === null`) |
| **LV-G3** | A obra nunca regride, decai, murcha nem perde peça por ausência. | `functions/api/bosque.monotonic.test.js` |
| **LV-G4** | A guilda nunca dispara notificação sobre outro membro, nem "a guilda precisa de você". | `functions/api/guild.semPush.contract.test.js` |
| **LV-G5** | Sair é um toque, sem confirmação alheia, sem perda, sem aviso aos outros. | `guild.anfitriao.test.js` (leave idempotente) + `GuildSheet.render.test.tsx` (sem diálogo de confirmação) |
| **LV-G6** | Nada da guilda é à venda: sem acelerar obra com Créditos, sem slot de membro pago, sem peça sazonal comprável, sem "reviver guilda" pago. | `src/utils/guildReward.contract.test.ts` |
| **LV-G7** | A arena nunca consome, aposta ou afeta a obra, e não tem ranking absoluto como tela principal. | `guild.raid.test.js` (golpe não altera `bosqueProgress`) |
| **LV-G8** | Contribuição nunca é por contagem ou peso de tarefa. | `bosque.monotonic.test.js` (fio = 1 independente do peso) |
| **LV-G9** | Nenhuma peça/recompensa exige presença em horário sincronizado ou em dias consecutivos. | `guild.recompensa.test.js` (7 dias distintos, não seguidos) |
| **LV-G10** | O estado da criatura (HP, degeneração) de um membro nunca é visível à guilda. | `guild.vista.test.js` (sem `stage`/`hp`) |

Mais a régua de copy: `src/components/guild/guildSemCobranca.contract.test.ts`
(strings PT/EN da Guilda contra o vocabulário vetado e contra "precisa de
você"/"faltou"/"saiu").

---

## 14. Fila de WPs

> ⛔ **Gatilho de execução**: fim do congelamento da Camada 3 (10 usuários × 14 dias) **ou** exceção registrada pelo dono no `REGISTRO-DE-DECISOES.md`. Os itens marcados 📝 (copy, wireframe, fila de arte) são **documento, sem código e sem asset**, e podem correr antes **só se** o dono os aceitar como exceção do mesmo tipo do booklet (G16). Portões de todo WP de código: os cinco comandos do `CLAUDE.md`.

| id | O que | Dono (agente) | Depende | Dias | Aceite |
|---|---|---|---|---|---|
| WPG-0 📝 | Copy PT+EN de todas as superfícies (§4, §5, §6, NPC, cerimônia, Feira reescrita para roda × fenômeno) + parecer PI de Bosque/Grove/roda/circle/Feira/Fair | `/squad-narrativa` (`soulmon-copy-redator`, `narrative-critic`, `ip-brand-guardian`) | G2, G14 | 1 | `npx vitest run src/narrativa.contract.test.ts` + tabela em `NARRATIVA-COPY.md` |
| WPG-W 📝 | Wireframes **GUI-01..16** (abaixo), substituindo a linha `SOC-06` do canvas Social | `/squad-design` (`design-wireframer`, `design-critic`, `guarda-linha-vermelha`) | WPG-0 | 2 | `docs/design/INVENTARIO-WIREFRAMES.md` com os 16 ids `aprovado` |
| WPG-A 📝 | Entrar na fila de `ASSETS-A-GERAR.md`: 5 `bg-guild-*` (família `cenario`), 4 `fx-fair-*` (`fx`), arte do lote `'feira'` | `/squad-arte` (fila; a geração é pós-gatilho) | WPG-W | 0,5 | ids presentes em `docs/ASSETS-A-GERAR.md` |
| WPG-1 | `_profile.js` (extrai `getProfile`/`ensurePid`/`stagePower`); `guild.js` com `guild`/`guildCreate`/`guildJoin`/`guildLeave` + aliases `coop*`; `GUILD_MAX_MEMBERS = 12`; `vistaDaGuilda` | `staff-backend` | gatilho | 2 | `npx vitest run functions/api/guild.vista.test.js functions/api/community.coop.test.js` (1, 4, 5, 12 membros; nenhum `saveId`/`hostSave`/`stage`/`dmg`) — corrige D-2, D-3 |
| WPG-2 | `sanitizarNomeDeGuilda` (guilda + apelido do perfil); `guildRename`, `guildNewCode`; anfitrião passa adiante | `staff-backend` | WPG-1 | 1 | `npx vitest run functions/api/guild.nome.test.js functions/api/guild.anfitriao.test.js` — corrige D-1 |
| WPG-3a | `guildThread`, `coopFio`, `bosqueProgress` + `fecharDiasDoBosque`, `bosqueStageFor`, viajante, renovação em `gravarGrupo`; sim passa a importar as constantes | `staff-backend` | WPG-1 | 2 | `npx vitest run functions/api/bosque.monotonic.test.js` |
| WPG-3b | `kind:'semente'` (só se G3 = sim) | `staff-backend` | WPG-3a | 0,5 | caso extra em `bosque.monotonic.test.js` |
| WPG-3c | Marés: `mareDe`, `colherMare`, `g.ornaments` | `staff-backend` | WPG-3a | 1 | `npx vitest run functions/api/guild.mare.test.js` |
| WPG-4 | Feira: `coopHit`, `raidHpFor`, `raidDamageFor` (`crypto`), `guildRaidHit`, `coopRaidOk` | `staff-backend` | WPG-3a | 2 | `npx vitest run functions/api/guild.raid.test.js` (2º golpe = 429; 12 golpes concorrentes somam 12; `cleared` sobrevive a saída; sem número de dano) |
| WPG-5 | `guildRewards`/`guildClaim`, `coopClaim`, troféu a cada 4, liberação de `bg-guild-*` | `staff-backend` | WPG-4 | 1,5 | `npx vitest run functions/api/guild.recompensa.test.js src/utils/guildReward.contract.test.ts` |
| WPG-6 | Conta: exclusão e exportação | `staff-backend` | WPG-3a, WPG-5 | 1 | `npx vitest run functions/api/account.coopExport.qa2.test.js functions/api/account.deleteConfirm.qa.test.js` — corrige D-4 |
| WPG-7 | Telemetria, 6 eventos nos dois lados | `staff-backend` | WPG-1 | 0,5 | `npx vitest run src/utils/telemetry.test.ts functions/api/metrics.test.js` — corrige D-5 |
| WPG-8 | Cliente: `community.ts`, `GuildSheet` em 3 seções + prop de sala, `CoopPanel` → Roda, disparo do fio fora de updater, remoção dos aliases | `staff-frontend` | WPG-1..5, WPG-0, WPG-W | 3 | `npx vitest run src/components/guild/GuildSheet.render.test.tsx src/components/guild/guildSemCobranca.contract.test.ts src/utils/guildNoSave.contract.test.ts` + screenshot Playwright |
| WPG-9 | Guard de push | `staff-backend` | WPG-8 | 0,25 | `npx vitest run functions/api/guild.semPush.contract.test.js` |
| WPG-10 | Lote `'feira'` em `ArenaLotId` + arte, NPC corrigido | `staff-frontend` | WPG-8, WPG-A | 1 | `npx vitest run src/utils/areaLotsNovos.test.ts` |
| WPG-11 | Palco do Bosque (≤4 criaturas, só guilda ≤4) | `staff-frontend` + `visual-designer` | WPG-8 | 2 | `GuildSheet.render.test.tsx` (5+ membros: só a própria criatura) + screenshot |
| WPG-12 | `'groveMilestone'` na fila de intersticiais e aviso na Home | `staff-frontend` | WPG-8 | 1 | `npx vitest run src/components/filaDeAvisos.contract.test.ts` |
| WPG-13 | Instalar `bg-guild-*` e `fx-fair-*` em `PET_BACKGROUNDS`/mapas; `waving_hand` no subset | `/squad-arte` (`arte-instalador`) | WPG-A gerado, WPG-5 | 1 | `npx vitest run src/assets/artMaps.contract.test.ts src/utils/iconScale.contract.test.ts` |
| WPG-14 | Chave nova do widget (só estágio) | `soulmon-guarda-plataforma` | WPG-8 | 0,5 | `npx vitest run src/plugins/widgetSemCobranca.contract.test.ts` |
| WPG-15 | Bíblia + manual + `STATUS.md` + `GuideModal`/`HelpModal` | `/squad-narrativa` + `/manter-docs` | WPG-8 | 1 | `npx vitest run src/docsManual.contract.test.ts src/narrativa.contract.test.ts` |

Total de código ≈ 22 dias; caminho crítico WPG-1 → 3a → 4 → 5 → 8.

**Wireframes (squad-design):** GUI-01 Salão sem guilda (P0) · GUI-02 Criar + código (P0) · GUI-03 Entrar: inválido/cheia/já em outra/sem rede (P0) · GUI-04 Bosque, Clareira sozinho (P0) · GUI-05 Bosque, fio firmado × meta ainda não cumprida (P0) · GUI-06 Roda ≤4 + criaturas (P0) · GUI-07 Roda 5–12 agregado (P0) · GUI-08 Cerimônia `'groveMilestone'` normal + movimento reduzido (P1) · GUI-09 Feira aberta/rodada feita/dissipada/recuou (P1) · GUI-10 Mural com marcos/vazio (P1) · GUI-11 Ajustes anfitrião × membro, sair (P0) · GUI-12 Viajante/esvaziada (postal) (P1) · GUI-13 Gestos recebidos em lote (P2) · GUI-14 Home, aviso de marco (P2) · GUI-15 Widget com estágio (P2) · GUI-16 Mapa, Hall "Salão da Guilda" × Arena "Feira" (P1).

---

## 15. O que depende do dono

| # | Pergunta | Recomendação | Se escolher o contrário |
|---|---|---|---|
| G1 | O fio vale a meta **inteira** (`dailyGoalFor`, letra de D-G2) ou a **meta de coração** (`heartGoalFor`, 60%)? | **Confirmar `heartGoalFor`**: a Guilda não pode cobrar mais que o próprio app cobra para não perder coração (`02` §2.1, `05` §3). Este plano segue a letra (inteira) até a confirmação | Com a inteira, o dia parcial (o dia real de quem tem TDAH/depressão) nunca firma; os prazos da §8 pioram com a presença efetiva menor |
| G2 | Nome na UI: "Guilda" (lotes já no ar) + "roda" para quem está nela, ou só "Grupo" (lore)? | Guilda no lugar, roda nas pessoas | "Grupo" exige renomear lotes e NPCs; "guilda" solta em tudo puxa MMO e hierarquia |
| G3 | **Semente** de cuidado mínimo (carinho/banho/dormir) entra? | Sim, na v1.1, **fora** do `bosqueProgress` (vira flor decorativa) | Não: menos a oferecer num dia ruim; sem custo técnico |
| G4 | **[divergência 2]** Presença nominal até **4**? | Confirmar 4 | 5: uma quinta pessoa passa a ter a ausência visível |
| G5 | Marés de 6 semanas com floração colhida | Sim | Perpétuo puro: o novato numa guilda madura sente que o fio não importa (Halfaker 2013) |
| G6 | Dia da guilda em **UTC** (vira 21h BRT) ou fuso fixo por guilda gravado no blob? | UTC na v1 | Fuso fixo: um campo a mais, sem risco de dois fios em 24 h |
| G7 | Expulsão pelo anfitrião | **Fora da v1**; o código novo fecha a porta | Com `guildRemove`: resposta ao removido idêntica a "sem guilda", sem motivo; o anfitrião vira supervisor |
| G8 | Escola no perfil para dar sabor ao golpe (v2) | Não na v1 | Um campo novo no perfil e na exportação |
| G9 | Emblemas: 4 dissipada / **piso 2** recuou, só a quem deu ≥1 rodada | Sim | Sem piso: o recuo passa a ler como perda; a todos os membros: premia quem não abriu a Feira (sem dano, mas sem sentido de gesto) |
| G10 | **[divergência 1]** Dano `10 + 2×stagePower` ±20% com HP `max(ativos,3)×45` | Confirmar | `6 + 2×sp + rnd(0..4)` exige recalibrar K (≈37) e refazer a sim |
| G11 | **[divergência 3]** Feira aberta a **semana ISO inteira** | Confirmar | Sex–dom: vira ritual colado ao Torneio, e quem não pode no fim de semana fica fora (LV-G9) |
| G12 | `bg-guild-*` fica com quem sai | Sim | Não: sair passa a custar algo (LV-G5) |
| G13 | Até 4 criaturas no palco do Bosque, só em guilda ≤4 | Sim | Até 20 rotacionados (`04` §3): fileira com lacunas em guilda grande |
| G14 | A Feira é da **roda contra um fenômeno**; reescrever as falas 6/6b/7 da lore que falam de "outros bosques" | Sim | Manter "outros bosques" contradiz D-G4 |
| G15 | Sem gate de Vínculo na Feira, só teto diário | Sim | Gate `BOND_PVP_MIN_LEVEL` barra o novato convidado |
| G17 | **TTL do Bosque** (parecer do guarda, 29/09/2026): hoje o blob `coop:<gid>` expira em 120 d sem movimento, e com ele o Bosque — o que contradiz "nunca regride" e "viajante volta, tudo como estava". Opções: (a) sem TTL no blob enquanto `bosqueProgress > 0` (custo KV permanente, pequeno); (b) manter o TTL e, ao expirar, cada ex-membro guarda o postal local do último estágio (como na guilda esvaziada) — o chão volta, mas nada é dito como perda | **(a)** — é o único jeito de a promessa "só cresce" ser verdade para quem volta depois de 4 meses | (b): a copy nunca pode prometer "o bosque tá aqui" a quem volta; o texto do viajante passa a ser condicional |
| G16 | Exceção ao congelamento para os WPs 📝 (copy, wireframe, fila de arte — sem código, sem asset) ou esperar o gatilho para tudo | Esperar, salvo se o dono quiser o wireframe pronto no dia do gatilho | Registrar a exceção na linha da Camada 3, como a do booklet |

---

## 16. Métricas de sucesso e gatilho de revisão

Nenhuma aposta foi testada; os limiares são projeções. Instrumento: os 6
eventos da §10.8 + `scripts/metrics-report.mjs`.

| # | A aposta | Se estiver CERTA | Se estiver ERRADA | Instrumento |
|---|---|---|---|---|
| AG1 | **Pertencer sem ser visto retém.** O agregado anônimo dá relatedness sem cobrança | D30 de quem entrou numa guilda ≥ D30 de quem não entrou, na mesma coorte | D30 de membros **menor** — a guilda virou mais uma relação a decepcionar | `guild_join` + coorte D30 |
| AG2 | **A guilda segura** | Mediana de permanência ≥ 3 semanas (`guild_leave.weeks` na faixa máxima) | Maioria sai na 1ª semana | `guild_leave.weeks` |
| AG3 | **Sem presença nominal acima de 4, o loafing não mata a obra** | Guildas de 5–12 com taxa de fio/ativo ≥ a de guildas de 2–4 menos 10 p.p. | Queda maior que 10 p.p. com o tamanho — o *sucker effect* ou a diluição apareceu | `guild_thread` / `guild_join.size` |
| AG4 | **A Feira é celebração, não segunda cobrança** | ≥ 70% das semanas com ≥1 golpe dissipadas; nenhuma queda de `guild_thread` em semana de recuo | Recuo seguido de `guild_leave` acima da base | `guild_raid` + `guild_leave` |
| AG5 | **O Bosque dá marco cedo** | Mediana do marco 1 ≤ 7 dias | Mediana > 14 dias — limiar alto demais | `guild_stage` level 1 |
| AG6 | **Convite é canal de aquisição** | ≥ 20% dos `guild_join` são de contas com < 7 dias | Quase só contas antigas | `guild_join` + `days_since_install` |

**Gatilho de revisão**: o próprio desbloqueio (10 usuários × 14 dias) para
começar; depois, **4 semanas com ≥ 3 guildas ativas** para ler AG1–AG6. Se AG1
ou AG2 vier errada, a pergunta não é "como aumentar a guilda", é se a Camada 3
deveria ter sido aberta. Se AG3 vier errada, a alavanca é baixar
`GUILD_MAX_MEMBERS`, **nunca** tornar a contribuição identificável (LV-G1).
