# Guilda 05 — Desenho de servidor (Bosque + raid cooperativa)

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

Autor: arquiteto de servidor. Data: 29/09/2026. **Etiqueta: PLANO.** A Camada 3
está congelada (`REGISTRO-DE-DECISOES.md` §5.6, gatilho 10 usuários × 14 dias);
nada aqui autoriza código. O objetivo é que, no dia em que descongelar, o WPG-1
comece sem nenhuma pergunta de arquitetura em aberto — as que sobram são do dono
e estão marcadas **DEPENDE DO DONO**.

Precedência: código > teste > `CLAUDE.md` > manual > este arquivo. Referências
por `arquivo` + SÍMBOLO. Leitura-base: `00-inventario-tecnico.md`,
`02-psicologia.md` (§2, §3, §6, vetos LV-G1..G10), `04-arena.md` (§2a, §4),
`docs/PLANO-COOP.md`, `REGISTRO §5.5/§5.6`, `functions/api/_coop.js`,
`functions/api/community.js` (`vistaDoGrupo`, ações `coop*`, `match`),
`_rateLimit.js`, `_redact.js`, `_accountTombstone.js`, `account.js`.

## 0. O que já existe e que o desenho NÃO pode perder

Invariantes do coop que viram invariantes da Guilda (todas já travadas por
`functions/api/community.coop.test.js` e irmãos):

| # | Invariante | Onde vive hoje |
|---|---|---|
| I1 | Uma única montagem de resposta; o que não passa por ela não sai | `community.js` › `vistaDoGrupo` |
| I2 | Nenhuma resposta devolve `saveId` (membros saem como `pid`) | `vistaDoGrupo` + `ensurePid` |
| I3 | Cada membro escreve só a PRÓPRIA chave no caminho quente; o blob do grupo muda só em criar/entrar/sair | `_coop.js` › `coopCkKey`, `gravarCheckins` |
| I4 | Entrar confere a própria entrada; perdedor da corrida recebe `409 join collision`, nunca 200 falso | `community.js` › `coopJoin` |
| I5 | As três chaves (`coop:`, `coopOf:`, `coopCode:`) renovam JUNTAS | `_coop.js` › `gravarGrupo`, `renovarPrazos` |
| I6 | TTL de 120 dias, renovado pelo evento diário | `_coop.js` › `COOP_TTL` |
| I7 | Meta DERIVADA do tamanho, nunca gravada; sair encolhe a meta | `vistaDoGrupo` (`target`) |
| I8 | Um grupo por pessoa (409 `already in a group`) | `coopCreate`/`coopJoin` |
| I9 | Entrada só por código; nada achável | `coopJoin` |
| I10 | Sair é um toque, idempotente, e é o mesmo passo da exclusão de conta | `_coop.js` › `coopLeave`; `account.js` › `handleDeleteConfirm` |
| I11 | Virada de semana é LIDA, não escrita (sem cron) | `_coop.js` › `semanaDe`, `rolarSemana` |

**Dívidas do coop atual que este plano corrige de carona** (achadas nesta leitura):

- **D-1 — nome sem tratamento.** `coopCreate` só faz `replace/trim/slice(0,24)`;
  `PLANO-COOP.md` prometia o tratamento de texto de jogador. (Inventário, achado 3.)
- **D-2 — presença nominal violaria LV-G2 acima de 4.** `vistaDoGrupo` devolve
  `apareceuHoje` POR MEMBRO. Com 4 é companhia; com 12 é chamada de sala de aula
  (`02-psicologia.md` §2.2). Hoje não é bug (teto 4), mas vira bug no dia em que
  `COOP_MAX_MEMBERS` subir — e subir o teto é uma linha.
- **D-3 — `stage` por membro na vista.** Contradiz "exibir GALHO, não altura"
  (`REGISTRO §5.5`) e encosta em LV-G10. Passa a sair só a LINHA/galho.
- **D-4 — exportação não carrega o progresso próprio.** `account.js` exporta a
  vaga (`coopGroupId`, lista de chaves), não o conteúdo de `coopCk:`. Com fios
  cumulativos, o que é DO titular (a própria contagem) tem de ir no export.
- **D-5 — não existe evento de telemetria de coop** (inventário, último parágrafo).

## 1. Esquema de chaves KV

### 1.1 Decisão: **manter a família `coop*`**, não migrar para `guild:*`

A Guilda é o coop com teto maior e duas camadas novas. Migrar prefixo exigiria
(a) leitura dupla `guild:`/`coop:` em `grupoDe`, (b) uma rotina de cópia que ou é
job (proibido) ou é "copia na primeira leitura" com janela em que dois
blobs vivem, e (c) atualizar `account.js` (exportação e exclusão), que já lista
`coopOfKey`/`coopCkKey` por nome. O ganho seria só estético: o prefixo **não
aparece para ninguém** (a vista não o expõe, o export lista chaves mas com rótulo
humano). É o mesmo raciocínio que manteve `gamePoints` para os Bits e
`perfectDays` para o dia completo: nome interno não é interface.

"Guilda" passa a ser o nome de PRODUTO; no servidor o módulo `_coop.js` ganha um
cabeçalho dizendo "coop = guilda". Constante nova: `COOP_MAX_MEMBERS = 12`.

**Migração 4 → 12**: não há migração de dados. O blob `coop:<gid>` de hoje
(`{id,name,code,createdAt,members,weekKey,checkins}`) já é um blob de guilda
válido; campos novos entram opcionais e são lidos com `?? padrão` (leitura
tolerante, a regra do cloud save). Idempotente por construção: não se escreve
nada para "migrar". `g.checkins` (resíduo pré-`coopCk`) continua só como fallback
de leitura, como hoje.

### 1.2 Tabela de chaves

| Chave | Valor | Quem escreve | Quando | TTL |
|---|---|---|---|---|
| `coop:<gid>` | blob: `{id, name, code, createdAt, members[], hostSave, weekKey, fiosHerdados, bosqueEpoch}` | servidor | criar/entrar/sair/renomear/novo código | 120 d, renovado |
| `coopOf:<save>` | `<gid>` | servidor | entrar; renovado com o blob | 120 d, renovado |
| `coopCode:<code>` | `<gid>` | servidor | criar/novo código | 120 d, renovado |
| `coopCk:<gid>:<save>` | `{weekKey, days[]}` (inalterado) | só o próprio membro | fio do dia | 120 d |
| **`coopFio:<gid>:<save>`** (novo) | `{total, lastDay}` — contador CUMULATIVO do membro | só o próprio membro | fio do dia (mesma requisição do `coopCk`) | 120 d, renovado a cada fio |
| **`coopHit:<gid>:<week>:<save>`** (novo) | `{days[], dmg}` — golpes do membro na semana | só o próprio membro | rodada da raid | 21 d (a semana + folga de leitura do resultado) |
| **`coopRaidOk:<gid>:<week>`** (novo) | `{at, hp, members}` — marca "fenômeno dissipado" | servidor, 1ª leitura que vê `dano ≥ hp` | derivado na leitura | 60 d |
| **`coopClaim:<save>:<week>`** (novo) | `{at, kind}` — "já entreguei a recompensa desta semana a este titular" | servidor | resgate | 60 d |

Por que `coopHit` é **por semana com `days[]` dentro** e não
`guildHit:<gid>:<save>:<day>` como sugerido: a vista precisa somar o dano da
semana. Com chave por dia seriam até 12 × 7 = 84 `get` por leitura (ou um
`list` por prefixo, que é a classe cara). Com chave por semana são 12 `get`. O
que importa — **nenhum read-modify-write sobre valor compartilhado** — é igual:
cada membro só lê e escreve a própria chave. É exatamente o padrão de
`coopCkKey`, que já provou o ponto.

### 1.3 O Bosque é monotônico por construção

`fiosTotais = g.fiosHerdados + Σ coopFio[m].total` (m ∈ membros).
Estágio = `bosqueStageFor(fiosTotais)` — função pura, **nunca gravada**
(Clareira → Ramagem → Copa → Mata → Bosque antigo; limiares **DEPENDE DO DONO**,
proposta: 0/30/120/360/900 fios, i.e. ~uma guilda de 6 com metade aparecendo
chega a Copa em ~6 semanas).

Os três caminhos que poderiam fazer o número CAIR, e como cada um é fechado:

1. **Membro sai.** `coopLeave` lê o `coopFio` de quem sai e SOMA em
   `g.fiosHerdados` antes de apagar a chave. É read-modify-write no blob, mas
   no mesmo evento raro que já regrava o blob hoje (I3). O fio fica, a autoria
   some — exatamente LV-G3 + LV-G1.
2. **Exclusão de conta.** Passa por `coopLeave` (I10) → mesmo caminho. O
   número agregado não é dado pessoal (não identifica ninguém); a chave pessoal
   é apagada.
3. **TTL de um `coopFio` de membro ausente há >120 d.** Fecha-se com
   "viajante" (§5.4): `grupoDe` / leitura da vista, ao encontrar membro sem
   `coopFio` e sem `coopOf`, trata como saída. Para não perder fios por expirar
   enquanto a pessoa ainda é membro, a vista **renova `coopFio` de todos** só
   quando renova o blob (evento diário de qualquer membro já chama
   `renovarPrazos`; acrescenta-se a renovação dos `coopFio` lá — ≤12 `put` de
   valor RELIDO no instante, sem mudança de conteúdo; a janela sem CAS é a mesma
   que `renovarPrazos` já aceita e documenta). Enquanto UMA pessoa aparecer, nada
   expira; guilda em que ninguém aparece por 120 d some inteira (§5.6), que é
   o comportamento de hoje.

Ainda sobra uma corrida: fio concorrente com saída do MESMO membro (dois
aparelhos). Pior caso: um fio perdido. Aceitável: nunca faz cair, só não sobe 1.

Teste que trava: `bosque.monotonic.test.js` (§8).

### 1.4 Renovação conjunta

`gravarGrupo` continua sendo o ÚNICO escritor das três chaves de índice (I5).
Ganha: renovar `coopFio:<gid>:<m>` de cada membro (relendo). `coopHit` e
`coopRaidOk`/`coopClaim` têm TTL próprio curto porque são da semana — não
renovam, e expirar é o comportamento correto.

## 2. API

### 2.1 Onde mora: **arquivo próprio `functions/api/guild.js`**, estado em `_coop.js`

`community.js` já tem 908 linhas e mistura diretório, torneio, amigos e coop;
as classes de rate limit (`HEAVY_ACTIONS`) foram pensadas para varredura de
diretório. A Guilda ganha rota própria `/api/guild?action=…`, com:

- `_coop.js` como dono do ESTADO (chaves, leitura, gravação, `coopLeave`,
  `bosqueStageFor`, `raidHpFor`, `raidDamageFor`) — a exclusão de conta continua
  importando só ele;
- `guild.js` como dono da RESPOSTA: `vistaDaGuilda` substitui `vistaDoGrupo`
  (I1 — continua havendo UMA);
- `community.js` mantém as ações `coop*` como **aliases finos** que chamam o
  mesmo código até o cliente migrar (WPG-2), e depois as remove. `getProfile`,
  `ensurePid`, `authorizeSaveAccess` passam a ser importados (os dois primeiros
  hoje são internos de `community.js` → extrair para `_profile.js` no WPG-1).

### 2.2 Ações

Todas exigem `denyUnlessOwner(id)` (Authorization + dono do `saveId`, 410 se lápide).
Classe de rate limit: `GUILD_LIGHT = { limit: 60, windowMs: 60_000 }` por IP
(`_rateLimit.js` › `takeToken` bucket `'guild'`) para tudo; nenhuma ação varre
prefixo (máx. ~40 `get`), então não há classe pesada.

| Ação | Método | Entrada | Servidor verifica | Devolve | Erros |
|---|---|---|---|---|---|
| `guild` | GET | `id` | dono | `{ guild: Vista \| null }` | 400/401/403/410 |
| `guildCreate` | POST | `id, name` | dono; não está em guilda; nome passa por `sanitizarNomeDeGuilda` (§5.1); código livre (3 tentativas) | `{ guild }` | 409 `already in a guild`, 400 `invalid name`, 503 `try again` |
| `guildJoin` | POST | `id, code` | dono; não está em guilda; código existe; `members < 12`; confirmação pós-gravação (I4) | `{ guild }` | 404 `invalid code`, 409 `guild full`, 409 `join collision`, 409 `already in a guild` |
| `guildThread` ("fio") | POST | `id`, `kind: 'fio' \| 'semente'` | dono; tem guilda; idempotente por (dia, kind) | `{ guild }` | 404 `no guild` |
| `guildRaidHit` | POST | `id` | dono; tem guilda; raid aberta (§4.4); `days` não contém hoje | `{ guild, hit: { landed: true } }` — **sem número de dano** | 404 `no guild`, 409 `raid closed`, 429 `daily limit` |
| `guildRewards` | GET | `id` | dono | `{ rewards: [{week, kind, emblems, cosmeticId}] }` não resgatadas | — |
| `guildClaim` | POST | `id, week` | dono; `week` com raid resolvida; `coopClaim:<save>:<week>` ausente; foi membro na semana (tem `coopCk`/`coopHit` daquela semana **ou** era membro no fechamento — §4.5) | `{ granted: {emblems, cosmeticId} }` | 409 `already claimed`, 404 `nothing to claim` |
| `guildRename` | POST | `id, name` | dono; é `hostSave`; mesmo sanitizador | `{ guild }` | 403 `not host` |
| `guildNewCode` | POST | `id` | dono; é `hostSave` | `{ guild }` (código novo; o velho some) | 403 `not host`, 503 |
| `guildLeave` | POST | `id` | dono | `{ ok: true }` (sempre, idempotente) | — |

`day` = dia UTC do servidor (`today()`), como o coop. Não se usa o dia do jogador
(`playerDay`): o servidor não conhece o fuso do save, e aceitar fuso do corpo
permitiria dois fios em 24 h trocando de fuso. Custo: o "dia" da guilda vira à
meia-noite UTC (21h BRT). **DEPENDE DO DONO** se isso incomoda; a alternativa
honesta é fuso FIXO da guilda gravado no blob na criação.

### 2.3 A vista (`vistaDaGuilda`) — o que sai e o que NUNCA sai

```
{
  id, name, code,                    // code só vai para membros (como hoje)
  isHost: boolean,                   // só sobre QUEM PERGUNTA
  size, full,
  members: [{ pid, name, line }],    // line = galho/linha do sprite, nunca estágio (D-3)
  presence: members <= 4
    ? [{ pid, cameToday }]           // regra de ≤4 herdada do coop (limiar DEPENDE DO DONO)
    : null,
  plantedToday: number,              // agregado — "hoje, 7 plantaram" (só > 4? ver nota)
  mine: { threadToday, seedToday, hitToday },   // só de quem pergunta
  grove: { stage, stageIndex, progressToNext },  // progressToNext em FAIXA (0..4), não fios
  raid: { weekKey, phenomenonId, open, cleared, hpBand }  // hpBand 0..10, nunca HP cru
}
```

**Nunca sai** (cada item vira asserção do teste de invariante):
`saveId` (nem `hostSave`: sai só `isHost` de quem pergunta); qualquer contagem
por pessoa (fios, dias, dano, golpes); quem NÃO apareceu (em >4 não há lista
nenhuma, e `plantedToday` é número sem nomes); quem saiu; HP/degeneração/estágio
da criatura de alguém (LV-G10); `fiosHerdados` cru; `dmg` de qualquer um;
`attrs`. `plantedToday` não é "contagem por pessoa", mas em grupo de 2 ela
identifica o outro — por isso **só aparece com `size ≥ 5`** (abaixo disso a
presença binária do coop já cobre, que é a regra aceita hoje).

## 3. O fio: afirmação do cliente vs derivação do save

| | A. Cliente afirma (como `coopCheckin`) | B. Servidor deriva do save |
|---|---|---|
| Fonte | `POST guildThread` quando o app vê `feito ≥ heartGoalFor` do dia | `save.js` POST recebe o `GameState`; ler `lastDayReport`/`perfectDays` e emitir fio |
| Confiança real | Nenhuma além de "1 por dia, só sobre si" | **A mesma**: o save inteiro é escrito pelo cliente (`save.js` só sobrepõe `accountTier`/`credits`) |
| Regra duplicada | Não — `heartGoalFor` fica no cliente, dono único | Sim: ou copia `dailyGoalFor`/`heartGoalFor` para o servidor (footgun 9), ou confia em `lastDayReport`, que é escrito pelo cliente |
| Latência | Imediata (planta ao cumprir) | Só na virada (`lastDayReport` nasce no reset) — o fio de hoje aparece amanhã |
| Acoplamento | Nenhum com `save.js` | `save.js` (caminho de maior tráfego) passa a escrever em chaves de guilda; exclusão/concorrência do save ganham um efeito colateral |
| Semente (§2.3 psicologia) | Trivial: `kind:'semente'` num gesto de cuidado | Precisaria de novos campos no save para cada gesto |

**Recomendação: A**, a mesma fronteira declarada em `PLANO-COOP.md` §4.6.
Critério do fio: **meta de CORAÇÃO** (`heartGoalFor`), não a meta inteira — a
correção da psicologia (§2.1-B); **DEPENDE DO DONO** porque o briefing dizia
"meta do dia". A semente é opcional (WPG-3b).

**O que fica farmável e por que não importa.** Um cliente adulterado afirma
1 fio + 1 semente por dia, e nada mais: o servidor garante um por (dia, kind,
pessoa) — o teto é o mesmo de quem cumpriu honestamente. O efeito máximo é o
Bosque de UMA guilda crescer no ritmo de "todo mundo cumpriu todo dia", o que
não compra vantagem nenhuma: o Bosque não paga moeda, não entra em ranking, não
é comparado entre guildas (LV-G7), e quem o vê são pessoas que o próprio
adulterador convidou. Contas alt para inflar: entrada só por código, teto 12,
e cada alt também só dá 1/dia — o ganho é cosmético e local.

## 4. Raid cooperativa

### 4.1 O que o servidor tem para decidir o dano

Do perfil (`profile:<save>`, gravado por `community.js` › ação `profile`):
`stage` (string, declarada pelo cliente, cortada em 40), `attrs
{virus,data,vaccine}`, `lifetimePoints`, `pvpEnabled`. **Não há escola nem
elemento no perfil hoje.** Duas opções:

- **v1 (recomendada): só `stage`.** `dano = 6 + 2 × stagePower(stage) + rnd(0..4)`
  (sorteio no servidor com `crypto.getRandomValues`, não `Math.random`).
  Faixa 8..20 por golpe. A diferença rookie→ultra é < 2×, pequena de propósito:
  a contribuição é invisível (LV-G1), mas o ritmo do grupo não pode depender de
  quem é mega.
- **v2 (se o dono quiser sabor de escola):** acrescentar `school` (enum das 6
  do class-system, validado por lista) ao POST `profile`; a escola muda o
  **sabor** do golpe (qual animação/qual "fraqueza" do fenômeno da semana dá
  +2), nunca a ordem de grandeza. Custa um campo novo no perfil e na exportação.

`stagePower` sai de `community.js` para `_profile.js` (hoje é local) — mesmo
código usado por `match`, sem cópia.

Como `stage` é declarado pelo cliente, um adulterado se declara `ultra` e bate
20 em vez de 10. Consequência: o fenômeno da SUA guilda cai um dia antes. Não
compra nada fora dela (§4.5).

### 4.2 HP e teto

`hp = raidHpFor(size) = size × K`, com `size` = membros **no momento da
leitura** (I7: sai alguém, o HP encolhe junto; o dano de quem saiu some junto —
mesma regra do progresso do coop, `PLANO-COOP.md` §3.4).
`K` proposto = 45 → um golpe médio de 13 × ~3,5 dias por membro derruba.
Calibrado para "metade da guilda aparecendo metade dos dias" chegar a ~70%, e
"todos 4 dias" dissipar. **Números DEPENDEM DO DONO.**

Teto: **1 golpe por pessoa por dia** (`GUILD_HITS_PER_DAY = 1`), guardado em
`coopHit.days`. Não reusa a cota `MATCHES_PER_DAY` do torneio (são rodadas
diferentes; misturar faria o torneio concorrer com a guilda). Janela: a raid
fica aberta **a semana ISO inteira**, não sex–dom — LV-G9 proíbe exigir
presença em horário/dias sincronizados; uma janela de 3 dias com teto 1/dia
dá a quem trabalha no fim de semana 3 chances, e a quem não pode, nenhuma.
(A `tournamentSeason` sex–dom continua sendo do Torneio.) **DEPENDE DO DONO**
se quer a raid colada ao ritual de sexta.

### 4.3 Sorteio e rodada local

O cliente roda a animação da arena local (`src/utils/arena.ts`) contra o
fenômeno, puramente cosmética, e chama `guildRaidHit`. O resultado da animação
não é enviado. O servidor sorteia o dano e grava `coopHit.dmg += d`. A resposta
diz só `landed: true` e a `hpBand` nova da vista.

### 4.4 Fechamento no domingo sem cron

Igual ao `rank:<season>`: o estado da semana está na CHAVE (`<week>` em
`coopHit`), então a virada é lida. Na vista:

- `dano = Σ coopHit:<gid>:<week>:<m>.dmg` sobre membros atuais;
- se `dano ≥ hp` e não há `coopRaidOk:<gid>:<week>`, grava a marca (idempotente,
  valor constante por semana — duas gravações concorrentes não divergem, como
  as chaves de índice). Uma vez marcada, a semana fica `cleared` **mesmo que
  alguém saia depois** (senão sair desfaria uma vitória — regressão, LV-G3);
- semana passada sem marca = "o fenômeno recuou" (nunca "falhou").

Não há `closeSeason` nem `SEASON_ADMIN_KEY`: não há ranking a fechar.

### 4.5 Recompensa: como o servidor "concede" Emblemas

Hoje o servidor **não concede Emblemas**: `TournamentPage.tsx` chama
`onEarnEmblems(r.won ? EMBLEMS_PER_WIN : EMBLEMS_PER_LOSS)` e o cliente soma no
próprio save. O `match` só devolve `won`. Os Emblemas são farmáveis por quem
edita o localStorage, e isso só é aceitável porque **compram só cosmético**
(`TOURNAMENT_ITEMS`, teste travando — `CLAUDE.md`, linha 🎖️).

A raid segue o mesmo contrato, com uma melhora barata:

- O servidor registra **o direito** (`coopRaidOk` + `coopClaim` ausente) e o
  resgate (`guildClaim` grava `coopClaim:<save>:<week>` e devolve
  `{emblems, cosmeticId}`); o cliente então soma no save. Isso não impede quem
  edita o save, mas impede o **cliente honesto com bug** (ou dois aparelhos) de
  receber duas vezes, que é o risco real.
- Valores: dissipado = `GUILD_RAID_EMBLEMS` (proposta 6 ≈ 2 vitórias) + 1 peça
  cosmética do Bosque (enfeite, não estágio); recuou = piso 2 Emblemas (sabor,
  não "se existe" — `REGISTRO §5.6`). Todos os membros no fechamento recebem,
  presentes ou não (`04-arena.md` §2a: não punir ausência). Quem entrou depois do
  domingo não recebe a semana anterior.
- **Consequência de desenho, escrita para não ser esquecida:** como o cliente
  poderia se autoconceder os mesmos Emblemas, a raid **só pode premiar o que o
  próprio cliente já poderia farmar** — cosmético e Emblemas. Nada de Bits com
  valor de loja acima do que a masmorra dá, nunca Créditos (servidor), nunca
  coração, nunca perfectDay (LV-G6). Se um dia a raid premiar algo que compre
  vantagem, a recompensa tem de viver no servidor (`ent:`), como os Créditos.
- A peça cosmética do Bosque vive **no blob da guilda**
  (`g.ornaments: [{week, id}]`, append no primeiro `guildClaim` da semana —
  RMW raro, uma vez por semana, e duplicata é inofensiva por dedupe na leitura),
  não no save de ninguém.

## 5. Segurança e privacidade

### 5.1 Nome da guilda (corrige D-1)

`sanitizarNomeDeGuilda(raw)` em `_coop.js`, chamada em `guildCreate` e
`guildRename`:
1. normaliza espaço e controla caracteres (remove `\p{C}`), NFKC;
2. corta em 24;
3. passa por `_redact.js` › `minimizeForAi(nome, 24)` e **recusa** (400
   `invalid name`) se `redactionCount > 0` — nome com e-mail, telefone,
   @handle ou URL não é nome, é contato; recusar é melhor que publicar
   `[email]` como nome;
4. não passa por `_aiGuard.js`: não há chamada de IA, e o guard é de cota de
   IA, não de conteúdo. (O inventário listou os dois; só o primeiro se aplica.)

A regra "mesmo tratamento que o apelido" (comentário em `coopCreate`) continua
valendo: o apelido do perfil (`community.js` › `profile`, `name`) ganha a mesma
função no mesmo WP, senão reabre o footgun 9 em miniatura. Termos ofensivos:
fora de escopo (sem lista; é dono).

### 5.2 Convite por código

Herdado integralmente (`novoCodigo`, 8 chars, alfabeto sem 0/O/1/I, ~40 bits,
checagem de colisão). Novo: `guildNewCode` (anfitrião) apaga `coopCode:<velho>`
e grava o novo — é a ferramenta de "fechar a porta" depois que o código vazou,
no lugar de expulsão. Código aparece só para membros.

### 5.3 Anfitrião

`hostSave` = quem criou; **nunca sai na vista** (só `isHost` para quem pergunta).
Pode: **renomear** e **gerar código novo**. Não pode: ver presença individual
além do que todos veem, ver contagens, mandar mensagem, expulsar (v1).

Expulsão: `02-psicologia.md` §6.2 aceita "remover só pelo criador, sem motivo
exposto". Recomendo **não** na v1: sem chat, a única superfície de abuso é
nome/apelido, e ambos já passam pelo sanitizador; o código novo fecha a entrada.
Expulsar é o poder que converte anfitrião em supervisor. **DEPENDE DO DONO.** Se
entrar: `guildRemove {id, memberPid}`, 403 se não host, efeito = `coopLeave` do
alvo (fios vão para `fiosHerdados`), resposta ao removido idêntica a "você não
está em nenhuma guilda".

Anfitrião sai → `hostSave` passa ao membro mais antigo (`members[0]` após o
filtro), em silêncio. Guilda nunca fica sem anfitrião nem trava renomear.

### 5.4 Saída de um toque e "viajante"

`guildLeave` = `coopLeave` (I10) + dobra dos fios (§1.3) + apaga `coopHit` da
semana corrente do saído. Nenhuma notificação, nada na vista dos outros ("quem
saiu" não existe — LV-G5).

"Viajante" (`02-psicologia.md` §3.2, "para sempre"): derivado, não gravado — um
membro sem `coopCk` há ≥ 4 semanas sai da conta de `size` para `hp` e para
`plantedToday`, mas continua em `members` e continua vendo a guilda. Implementa-se
com `coopFio.lastDay` (já lido). Nada visível a ninguém.

### 5.5 Guilda vazia / morta

Vazia: apagada no `coopLeave` do último (hoje). Morta (ninguém aparece): as
chaves expiram juntas em 120 d (I5/I6), sem lápide. A "lembrança da última
colheita" no save da pessoa (§6.3 psicologia) é **cliente**: ao ler a vista, o
app guarda localmente o último estágio visto (§7.2). O servidor não escreve nada.

### 5.6 Exclusão e exportação de conta (corrige D-4)

**Exclusão** (`account.js` › `handleDeleteConfirm`, passo 3b): continua
chamando `coopLeave`, que passa a (a) dobrar `coopFio` em `fiosHerdados`
(agregado, não pessoal), (b) apagar `coopFio:<gid>:<save>`,
`coopCk:<gid>:<save>`, `coopHit:<gid>:<week>:<save>` da semana corrente e
anterior, `coopOf:<save>`, e (c) passar anfitrião adiante. **Novo:** apagar
`coopClaim:<save>:*` — há no máximo ~9 semanas vivas (TTL 60 d), então são `get`
diretos por `weekKey` calculado, não `list`. `_accountTombstone.js` não muda: a
lápide já faz `denyUnlessOwner` devolver 410 em todas as ações `guild*`, o que
impede o segundo aparelho de reentrar 3 s depois (mesmo fechamento de hoje para
`profile:`/`pid:`).

**Exportação** (`account.js` › coleta que hoje devolve `coopGroupId`): passa a
exportar `{ guildName, joinedAs: 'host'|'member', myThreads: coopFio.total,
myHitsThisWeek: days.length, claimedWeeks[] }` — o que é DO titular. Não
exporta nada de outro membro (nem nomes: são dados de terceiros). O teste
`account.coopExport.qa2.test.js` ganha o caso.

### 5.7 Push

**Nenhum** push da Guilda na v1, nem de cobrança nem de celebração (LV-G4). A
vista é lida quando a pessoa abre. `workers/push-scheduler.js` não ganha nada.
Teste de fiação: nenhuma referência a `coop`/`guild` em `workers/` e em
`functions/api/_pushCopy.js`.

## 6. Telemetria mínima

Eventos são declarados em allowlist dupla: `functions/api/metrics.js` ›
`EVENT_SCHEMA` e o espelho em `src/utils/telemetry.ts` (teste de paridade em
`telemetry.test.ts`). Props só inteiros em faixa; sem id de guilda, sem pid.

| Evento | Props | Quando (cliente) |
|---|---|---|
| `guild_create` | `null` | 200 de `guildCreate` |
| `guild_join` | `size: {min:2,max:12}` | 200 de `guildJoin` |
| `guild_leave` | `size: {min:0,max:11}` (restantes), `weeks: {min:0,max:3}` (faixa de permanência) | 200 de `guildLeave` |
| `guild_thread` | `kind: {min:0,max:1}` | 1ª vez no dia (o servidor é idempotente; o cliente só emite na transição) |
| `guild_raid` | `outcome: {min:0,max:2}` (0 golpe, 1 dissipado visto, 2 recuou visto) | golpe / primeira leitura do resultado |
| `guild_stage` | `level: {min:1,max:5}` | primeira vez que o cliente vê um estágio novo |

Nenhum evento carrega contagem pessoal de fios ou dano. `guild_leave.weeks`
responde a pergunta que importa ("a guilda segura?") sem identificar ninguém.

## 7. Camada cliente

### 7.1 `src/utils/community.ts`

- Tipos `CoopMember`/`CoopGroup` → `GuildMember { pid; name; line }`,
  `GuildView` (exatamente a forma de §2.3, com `presence: … | null`).
  `CoopGroup` fica como `type` alias deprecado até o WPG-2 terminar.
- Funções: `getGuild`, `createGuild`, `joinGuild`, `threadGuild(kind)`,
  `hitRaid`, `getGuildRewards`, `claimGuildReward(week)`, `renameGuild`,
  `newGuildCode`, `leaveGuild` — todas contra `/api/guild`.

### 7.2 O que vai (e não vai) para o `GameState`

**Nada da guilda no save** — nem `guildId`. Motivo: o ponteiro autoritativo é
`coopOf:<save>` no servidor; um `guildId` no save seria a segunda fonte do
mesmo fato (footgun 9) e **mentiria** depois de uma saída feita em outro
aparelho. O cliente descobre a guilda com um `GET guild` (1 `get` de índice +
~25 `get`s), cacheado em memória por sessão.

Exceções, todas em `localStorage` via `storageKeys.ts` (conveniência por
aparelho, perder não quebra nada): `soulmon-guild-last-stage` (para
`guild_stage` e a "lembrança"), `soulmon-guild-thread-day` (evitar POST
repetido no dia). Os **Emblemas** resgatados entram no save, porque são moeda do
jogador, pelo caminho que o Torneio já usa (`onEarnEmblems`).

### 7.3 `GuildSheet.tsx` / `CoopPanel.tsx`

`GuildSheet` deixa de só renderizar `CoopPanel` e passa a compor três blocos:
Bosque (estágio desenhado + faixa de progresso, sem número), Fenômeno da semana
(barra em faixa, botão "enviar meu Soulmon" desabilitado após o golpe do dia,
sem dano exibido) e Membros (sprites por `line`; presença binária só com ≤4;
com >4, "hoje, N plantaram"). `CoopPanel` vira o bloco Membros + criar/entrar/
sair. Toda string PT+EN; vocabulário pela squad-narrativa (não há termo
canônico de guilda na §12 da bíblia — pendência de lore, não de servidor).

Onde o fio é disparado: no mesmo ponto em que hoje o app chama `coopCheckin`
(a transição "meta de coração atingida"), e a semente nos handlers de carinho/
banho/dormir — **fora** de updater (footgun 6), como efeito após o set.

## 8. Fatiamento

Estimativas em dias de uma sessão; tudo depois do descongelamento da Camada 3.

| WP | Conteúdo | Depende | Dias | Aceite executável | Dívida corrigida de carona |
|---|---|---|---|---|---|
| **WPG-1** | Extrair `getProfile`/`ensurePid`/`stagePower` para `_profile.js`; `guild.js` com `guild`/`guildCreate`/`guildJoin`/`guildLeave` + aliases `coop*`; `COOP_MAX_MEMBERS = 12`; `vistaDaGuilda` (presença só ≤4, `line` no lugar de `stage`, `isHost`, sem `hostSave`) | — | 2 | `npx vitest run functions/api/guild.vista.test.js` — varre a vista para 1, 4, 5 e 12 membros e reprova qualquer chave `saveId`/`hostSave`/`stage`/`dmg`/`total`/lista de ausentes; `functions/api/community.coop.test.js` continua verde pelos aliases | D-2, D-3 |
| **WPG-2** | `sanitizarNomeDeGuilda` em `guildCreate`, `guildRename` e no apelido de `profile`; `guildNewCode`; anfitrião passa adiante | WPG-1 | 1 | `npx vitest run functions/api/guild.nome.test.js` (e-mail/telefone/URL/@ → 400; controle/zero-width removidos; paridade com apelido) + `guild.anfitriao.test.js` (403 para não-host; host sai → herdeiro) | D-1 |
| **WPG-3a** | `guildThread kind:'fio'`, `coopFio`, `bosqueStageFor`, dobra em `fiosHerdados` no `coopLeave`, renovação de `coopFio` em `gravarGrupo` | WPG-1 | 2 | `npx vitest run functions/api/bosque.monotonic.test.js` — sequência aleatória de fios/saídas/exclusões/entradas (property test, 500 seeds) e o estágio **nunca** decresce; 2 fios no mesmo dia = 1 | — |
| **WPG-3b** | `kind:'semente'` (DEPENDE DO DONO) | WPG-3a | 0,5 | caso extra em `bosque.monotonic.test.js` | — |
| **WPG-4** | Raid: `coopHit`, `raidHpFor`, `raidDamageFor` (sorteio `crypto`), `guildRaidHit`, fechamento lido + `coopRaidOk` | WPG-3a | 2 | `npx vitest run functions/api/guild.raid.test.js` — 2º golpe no dia = 429; 12 golpes concorrentes (`Promise.all`) somam 12 (sem RMW compartilhado); HP encolhe com saída; semana marcada `cleared` continua `cleared` após saída; resposta nunca contém número de dano | — |
| **WPG-5** | `guildRewards`/`guildClaim`, `coopClaim`, `g.ornaments`; cliente soma Emblemas via caminho do Torneio | WPG-4 | 1,5 | `npx vitest run functions/api/guild.recompensa.test.js` — 2º claim = 409; quem entrou depois da semana = 404; ausente na semana recebe; `src/utils/guildReward.contract.test.ts` exige que a recompensa só referencie Emblemas + itens `bg`/`furniture`/ornamento (nunca Bits > teto, Créditos, coração, perfectDay) | — |
| **WPG-6** | Conta: exclusão apaga `coopFio`/`coopHit`/`coopClaim`, exportação traz o que é do titular | WPG-3a, WPG-5 | 1 | `npx vitest run functions/api/account.coopExport.qa2.test.js functions/api/account.deleteConfirm.qa.test.js` com casos novos: após exclusão, nenhuma chave com o saveId sob `coop*`; `fiosHerdados` aumentou; export contém `myThreads` e nenhum nome de outro membro | D-4 |
| **WPG-7** | Telemetria (6 eventos, dois lados) | WPG-1 | 0,5 | `npx vitest run src/utils/telemetry.test.ts functions/api/metrics.test.js` (paridade + props fora de faixa derrubam o evento) | D-5 |
| **WPG-8** | Cliente: `community.ts` tipos/funções, `GuildSheet` em três blocos, disparo do fio/semente fora de updater, remoção dos aliases `coop*` | WPG-1..5 | 3 | `npx vitest run src/components/guild/GuildSheet.render.test.tsx` (com 5+ membros não renderiza presença por pessoa nem número de dano; 0 ocorrência de `saveId`) + `src/components/guild/guildSemCobranca.contract.test.ts` (varre as strings PT/EN da guilda contra o vocabulário vetado de `narrativa.contract.test.ts` e contra "precisa de você"/"faltou"/"saiu") + `src/utils/guildNoSave.contract.test.ts` (AST: nenhum campo `guild*`/`coop*` em `GameState`) + screenshot Playwright | — |
| **WPG-9** | Guard de push | WPG-8 | 0,25 | `npx vitest run functions/api/guild.semPush.contract.test.js` — `workers/` e `_pushCopy.js` sem `coop`/`guild` | — |

Total ≈ 13,5 dias. Caminho crítico: WPG-1 → 3a → 4 → 5 → 8.
Portões de todo WP: os cinco comandos do `CLAUDE.md` (inclusive
`tsc -p tsconfig.server.json`, que cobre `functions/`).

## 9. DEPENDE DO DONO (lista fechada)

1. Fio vale a meta de CORAÇÃO (`heartGoalFor`, recomendação da psicologia) ou a meta inteira.
2. Semente por gesto de cuidado (WPG-3b) entra ou não.
3. Limiar de presença nominal: 4 (recomendado) ou 5.
4. Limiares do Bosque (proposta 0/30/120/360/900) e `K` da raid (proposta 45), `GUILD_RAID_EMBLEMS` (proposta 6/piso 2).
5. Raid aberta a semana toda (recomendado, LV-G9) ou colada ao ritual sex–dom.
6. Dia da guilda em UTC (recomendado v1) ou fuso fixo por guilda.
7. Expulsão pelo anfitrião: fora da v1 (recomendado) ou `guildRemove`.
8. Escola no perfil para sabor do golpe (v2).
9. Exceção formal ao congelamento da Camada 3 no `REGISTRO §5.6`, ou esperar o gatilho.
