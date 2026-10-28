# PLANO — Feira: Chefe e Desafio na volta da Missão (28/10/2026)

Status: plano para execução, nada implementado. Pedido do dono em 28/10/2026. Leitura-base: `docs/PLANO-GUILDA.md` (LV-G1..G10, tabela de chaves KV, G11), `docs/REGISTRO-DE-DECISOES.md` (§27 PR3, §104, §141), `functions/api/{guild,_coop,_casa,_guerra,_claMisterio,_dayCounters}.js`, `src/utils/guildMission.ts`, `src/App.tsx` (`handleGuildMissionSend`, efeito de volta), `src/components/games/BattleStage.tsx`.

> Verificações a refazer pelo executor antes de codar (não li tudo): assinatura real de `loadDuelSide`/`simulateDuel`, `cartao(g)`/`lerCartoes`, `marcarParticipacao`, `membrosAtivos`, `scoreIsPlausible`. Onde o plano cita esses nomes, a forma é a do brief; confirmar no código.

## 0. Decisões de partida (do dono, 28/10)

| # | Regra |
|---|---|
| R1 | Missão fica **igual** (30 min fora, 1×/dia, `guildRaidHit`, rega a Casa, alimenta o fenômeno semanal, resgate semanal intacto). |
| R2 | NOVO: na **volta**, acontece um evento: **Chefe** ou **Desafio**. |
| R3 | Chefe: 1 ataque/dia/pessoa; nunca morre sozinho; HP **compartilhado, nunca regenera**, acumula entre membros e dias; morto → **dia de descanso** → próximo mistério. Meta: clã de 4 ativos mata nível 1 em ~2 dias. |
| R4 | Desafio: cada pessoa cumpre o seu para liberar a PRÓPRIA próxima incursão; independentes, mas o bem comum cresce sem atribuição individual. |
| R5 | Dificuldade sobe com mistérios concluídos pelo clã (HP/tempo e recompensa). |
| R6 | Gancho para essências elementais (backlog `BACKLOG-PRODUTO.md` "Essências dos elementos"): só campo no payload, nada implementado. |

## 1. Modelo de servidor, chaves KV e máquina de estados

### 1.1 Conceitos

- **Mistério k** (k = 0,1,2…): unidade do clã. Tem `kind` ∈ {`boss`,`trail`} e `level L = min(20, 1 + k)` (k = nº de mistérios concluídos pelo clã). Determinístico: `kind = hash32(gid + ':' + k) % 100 < TRAIL_PCT ? 'trail' : 'boss'` com `TRAIL_PCT = 30`. O mistério 0 é sempre `boss` (primeira impressão).
- **Chefe**: `bossId` = `hash(gid,k) % BOSS_ROSTER.length` (24 bustos; o `arauto-do-fim` fica fora do sorteio comum, reservado a L≥15 — ver D6). Elemento vem de `BOSS_ROSTER`.
- **Trilha (desafio)**: mistério sem chefe. Cada membro recebe 1 desafio pessoal; mistério conclui quando **quórum** (ceil(50% dos ativos do snapshot)) de desafios foi cumprido **ou** passam `TRAIL_MAX_DAYS = 3` dias (sem estagnação, LV-G3/G9).
- Dia = **dia do jogador** (`dayKey` enviado, ±1 UTC já aceito), exatamente como `guildRaidHit` hoje (`hoje`).

### 1.2 Chaves (todas novas, opcionais, lidas com `?? padrão`; KV sem transação → cada membro escreve só a sua; totais derivados na leitura, padrão `_claMisterio.js`)

| Chave | Valor | Quem escreve | TTL |
|---|---|---|---|
| `feiraEvt:<gid>` | `{k, kind, level, bossId, hp0, spawnDay, trailN}` — foto do mistério ATUAL | qualquer membro, na 1ª leitura do dia (idempotente: entradas determinísticas, ver 1.4) | 120 d |
| `feiraHit:<gid>:<k>:<save>` | `{days[], dmg}` — dano acumulado só do próprio membro neste chefe | o dono da chave | 60 d |
| `feiraDead:<gid>:<k>` | `{day, level, hp0}` constante e idempotente (como `coopRaidOk`) | quem lê e vê soma ≥ hp0 | 120 d |
| `feiraTrail:<gid>:<k>:<save>` | `{day, clearedDay|null, act, attemptsToday}` desafio pessoal e se foi cumprido | o dono | 30 d |
| `feiraGate:<save>` | `{lockedUntilCleared: bool, k, day}` — porta da próxima incursão do jogador | o dono | 30 d |
| `feiraDone:<gid>` | `{n, bosses, trails, lastDay}` — mistérios concluídos (`n` = k atual). Só cresce (LV-G3). Escrita idempotente por `max()` | quem fecha o mistério | 120 d |
| `feiraClaim:<gid>:<k>:<save>` | `{day}` recibo do resgate do chefe, por pessoa | o dono | 60 d |
| `feiraPart:<gid>:<k>:<save>` | direito de participação (dia do primeiro golpe/desafio) | o dono | 60 d |

Reaproveita `cartao(g)`/`marcarParticipacao` onde couber. Nada em `coop:<gid>` (blob) é tocado: **LV-G7 preservado** (`bosqueProgress` intacto); ver teste em §8. Não há novos DO/D1.

### 1.3 Máquina de estados do clã (derivada na leitura; nenhuma transição é "agendada")

```
          mistério k aberto
   ┌───────────────┴──────────────┐
 kind=boss                      kind=trail
   │                               │
 ALIVE ──(soma dano ≥ hp0)──► DEAD(day=d)     TRAIL_OPEN ──(quórum ou 3 dias)──► TRAIL_DONE(day=d)
   │ (a cada dia o chefe "foge" p/ cada jogador que já bateu;               │
   │  volta no dia seguinte, HP intacto)                                     │
   ▼                                                                         ▼
 REST(d): dia d+1 sem evento (Missão normal, sem chefe/desafio) ──► mistério k+1 abre em d+2
```

- `DEAD`/`TRAIL_DONE` gravam `feiraDead`/`feiraDone` constantes; uma vez gravados valem para sempre, mesmo se alguém sair e a soma encolher (copia `resolverFeira`/§10.5; LV-G3).
- **Dia de descanso**: no dia `d+1` a volta não gera evento; o cliente mostra um estado calmo ("o chefe se foi, a trilha descansa"). Mistério k+1 abre em `d+2` (`spawnDay = d+2`).
- **Ocioso**: chefe vivo sem ninguém bater continua vivo (nunca regenera, nunca expira). Um clã parado não perde nada (LV-G3).
- **Por jogador por dia** (`feiraHit`/`feiraTrail`):
  - Chefe vivo e `days` não contém `hoje` → pode atacar 1×; senão "fugiu hoje" (429 `daily limit`).
  - Trilha aberta e sem `clearedDay` → o jogador tem **porta travada** (`feiraGate`): `guildMission` do cliente continua rodando a volta, mas **a próxima incursão só é aceita** após `clearedDay` ≥ dia do desafio. Ao cumprir, destrava a mesma pessoa no dia seguinte (R4: "libera outra incursão dela mesma").
  - Entrada tardia (membro novo): só participa se tiver `feiraPart`. Resgate exige `feiraPart` (A-1 já existe: "direito ao resgate mora com a pessoa").

### 1.4 Corrida de escritas (sem transação)

Todo valor de `feiraEvt` e `feiraDead` é função **determinística** de `(gid, k, spawnDay, cartões)`, então duas escritas concorrentes gravam o mesmo conteúdo. `hp0` usa `membrosAtivos(g, fios, spawnDay)` — o mesmo `refDay` para todos, não "agora". `spawnDay` do mistério 0 = dia da 1ª volta pós-flag (`min` entre corredores; erro máximo ±1 dia, aceito). `spawnDay(k+1) = feiraDead(k).day + 2`.

## 2. Calibração (números)

Premissas: o dano de um ataque `d` vem do servidor (§3), média alvo **d̄ = 100** com `stagePower = 3` (estágio médio), faixa 70..150 (cap por ataque = `1.5 × d̄(power)`). Clã pequeno alvo: 4 ativos, nível 1 → ~2 dias. Eficiência de comparecimento 0,9.

```
dias_alvo(L) = min(7, 2 + 0,25·(L−1))
HP(L, N)    = round( max(N,3) · d̄ · 0,9 · dias_alvo(L) / 10 ) · 10      // N = ativos no spawnDay
dano/ataque = round( DANO_BASE(power) · mult_desempenho ),  mult ∈ [0,7 ; 1,5]
DANO_BASE(p)= 70 + 10·p   (p=1..5 → 80..120)  — p=3 → 100
```

HP do chefe por nível e tamanho do clã (script-able: ver snippet ao final):

| Nível | dias alvo | N=3 | N=4 | N=8 | N=12 |
|---|---|---|---|---|---|
| 1 | 2,00 | 540 | 720 | 1 440 | 2 160 |
| 5 | 3,00 | 810 | 1 080 | 2 160 | 3 240 |
| 10 | 4,25 | 1 150 | 1 530 | 3 060 | 4 590 |
| 20 | 6,75 | 1 820 | 2 430 | 4 860 | 7 290 |

Leitura: 4 ativos × d̄ 100 = 400/dia → nível 1 (720) cai em ~1,8 dia. Um ataque = 1/(N×dias) do HP (14% a 25% no N=4/L1 após 1 dia de cada um; nunca >`cap/HP`: com N=3, L1 → um ataque máx 150/540 = 28%, nunca mata sozinho; invariante testada: `HP ≥ 3·cap`). Se o clã crescer após o spawn, o HP não muda (foto) → mata mais cedo, nunca regride (LV-G3). Se N cair, HP fica e o clã demora mais (aceito; o piso `max(N,3)` já protege). Alternativa avaliada: HP por ataque-médio dinâmico → rejeitada (gera regressão/ganho por ausência).

Duração da luta: **30 s de relógio** (`FIGHT_SECONDS`), com 6 a 8 rounds simulados; não é "tempo para derrotar" mas o teto do ataque. "Mais tempo" por nível (R5) = mais dias, não luta mais longa.

Recompensa por nível: ver §5. Snippet para regenerar a tabela:

```js
for (const L of [1,5,10,20]) { const d=Math.min(7,2+0.25*(L-1));
  console.log(L, [3,4,8,12].map(N=>Math.round(Math.max(N,3)*100*0.9*d/10)*10)); }
```

## 3. Cliente da luta (um ataque)

Decisão: **repetição validada pelo servidor** (padrão `_guerra.js`, não "cliente manda dano").

1. Cliente chama `POST guildFeiraAttack {id, dayKey}` (novo). Servidor valida o gate, carrega o lado do jogador (`loadDuelSide`, cartão gravado em `cartao(g)`/perfil), monta o chefe como `FightSide` com HP enorme (`BOSS_SIM_HP = 1e6`, nunca zera) e atributos por nível, simula `FIGHT_ROUNDS` rounds com **semente do servidor** (`crypto`) usando `simulateDuel`, soma o dano ao chefe, aplica o cap `1.5·d̄`, grava `feiraHit:<...>:<save>` e devolve `{seed, rounds: <log mínimo>, dmg, bossHp: {now, max}, dead: bool}`. O "dmg" do jogador é somado SÓ em `feiraHit` próprio.
2. Cliente toca o replay do log retornado (o mesmo motor de `fight.ts` consome o log) — sem input do jogador que afete o resultado. Sem rede → o botão não ataca; nada fica pendente (o ataque só existe quando o servidor aceita).
3. Resposta ao cliente: só agregado do clã — `{bossHpPct, max}` e o dano **desse** golpe do próprio jogador (ok, é dele). **Nunca** lista de contribuições, `hitters` por nome ou contagem de quem bateu (LV-G1). `hp` do chefe como fração arredondada (5%) para não dar para inferir contribuições por diferença entre leituras? Decisão: mostrar barra contínua; a diferença entre duas leituras é dano de **alguém não identificado**, aceito (como a Feira hoje).
4. **Tela**: novo `mode: 'boss'` em `stageLayout` em `BattleStage.tsx`:
   - `me` igual; `foes[0]` = `{ x: w/2, y: ~h*0.28 (metade de cima), size: min(w*0.9, h*0.46) }` (≈2,2× o normal); barra grande de HP do clã (agregado) em cima do chefe via `barsH` ampliado; sem plataforma lateral.
   - Chefe usa arte: provisório = bust com `image-rendering: pixelated` ampliado em escala inteira (2×/3×/4× ≤ largura); definitivo = `bossArt(id,'corpo-inteiro')` (`BOSS_FULL_ART`). Fallback automático busto → corpo inteiro.
   - Teste `BattleStage.layout.test.ts` novo: chefe centralizado (|x − w/2| ≤ 1), `y + size·SPRITE_TOP` dentro da metade superior para 320×568, 360×640, 412×915.
5. **Resultado**: `ResultScreen` (`src/components/games/ResultScreen.tsx`) variante `kind: 'boss'`: título "O chefe fugiu", dano do jogador, barra do clã (agregado), recompensa só no abate (§5). Variante de morte do chefe: "O caminho abriu". Reducing motion respeitado. Sem som novo (nasce mudo, decisão de som pendente).

## 4. O Desafio

### 4.1 Atividades que qualificam (apenas as já existentes em `src/components/` e `src/components/mente/`)

| Classe | Atividades | Como o servidor verifica |
|---|---|---|
| Determinísticas, semente do servidor | Picross, Zip, Patches, Troca | `guildFeiraTrailStart` devolve `{seed, game, size}`; cliente joga e envia a **solução**; servidor regera a mesma instância pela semente e confere (resolução válida ⇒ cumpriu). Tempo mínimo plausível = `0,3 × tempo_ótimo_conhecido`. |
| Reflexo/pontuação | os minijogos de reflexo/Mente já usados em rankings | `scoreIsPlausible` (`rankings.js`) + piso de duração; cumprir = atingir um alvo MODESTO (`par`), nunca ranking. Tentativas ilimitadas, aceito 1 cumprimento/dia. |
| Atividade no jogo | tarefa/cuidado já existente | **fora do 1º corte** (dependem do save do cliente, sem prova). Backlog. |

Sorteio do desafio do dia: `hash(save + ':' + dia + ':' + k) % lista` filtrado pelas atividades do 1º corte (Picross/Zip/Patches/Troca + 1 reflexo). Garantia de dificuldade baixa e curta (≤ 2 min); sem punição por falha; **sem energia/Créditos/coração** gastos (LV-G6).

### 4.2 Benefício do clã sem atribuição

Cada desafio cumprido grava a chave pessoal `feiraTrail:<gid>:<k>:<save>.clearedDay`. O clã vê só um agregado derivado na leitura:

- **Marcas da trilha** = nº de `clearedDay` não nulos (nunca nome, nunca "quem falta", LV-G1/G2). A UI mostra uma barra de marcas **sem ponto por pessoa**.
- Efeito comum: ao concluir a trilha, o **próximo chefe nasce com −3% de HP por marca, teto −15%** (aplicado na foto `hp0` do mistério k+1; guardado em `feiraDone` como `trailBonus` constante). Mais a **seiva da Casa** bônus (§5). Quem não cumpriu não é exposto.
- Mistério `trail` conclui por quórum **ou** 3 dias; quem não cumpriu continua com a porta travada até cumprir (ou o 3º dia passar: o gate libera sozinho no dia em que a trilha conclui, sem punição, LV-G9).
- O bônus é **monotônico**, nunca regride por saída (marcas contadas na conclusão, congeladas).

### 4.3 Retrocompatibilidade da porta

Cliente antigo ignora `feiraGate`: o servidor, ao ver `guildRaidHit` de quem tem porta travada, **ainda registra a rodada** (golpe do fenômeno e rega) mas não gera novo evento Feira → nada quebra no cache velho; o gate só vale para a camada nova (`gate` na resposta, ausente ⇒ liberado).

## 5. Recompensas

Princípio: tudo cosmético/Emblemas/Casa, nada pago, nada de odds (LV-G6). Resgate por pessoa, idempotente por `feiraClaim`, exige `feiraPart`.

| Item antigo (resgate semanal, mantido) | Novo (abate do chefe) | Escala de nível (R5) |
|---|---|---|
| Emblemas `RAID_EMBLEMS = 4` (piso `RAID_EMBLEMS_FLOOR = 2`) | `+ 2 + floor(L/2)` Emblemas (teto 10) | cresce com L |
| Troféu `trophy-concha-mare` a cada `RAID_TROPHY_EVERY = 4` Feiras | troféu do chefe: cosmético `trophy-boss-<bossId>` no 1º abate daquele chefe (coleção; 24 = fim) | por chefe, não por nível |
| Seiva da Casa (`pontosDeMissao`) | `+ 10·L` de seiva em `somarPontos(... 'missao')` no abate (chave pessoal, servidor decide) | linear, teto L20 |
| Bits | `min(masmorra, 30 + 10·L)` no abate, nunca acima do teto de masmorra (§269) | L |
| **Gancho de essências (R6)** | payload `reward.essences: []` (sempre vazio hoje) + `element` do chefe em `reward.element`. Quando o backlog existir: quantidade `= base_chefe × (1 + L/4)`, maior que inimigo comum. **Não implementar agora**, só o campo e um teste que trava o formato. | futura |

Desafio: cumprir paga `+3` seiva Casa e `+1` Emblema (1×/dia) e destrava a incursão; não paga Créditos. Resgate semanal da Feira (`guildRewards/guildClaim`) fica como está (R1).

## 6. Migração (Missão e fenômeno ficam)

- `guildMission` (save) **não muda de formato**. O evento pendura na **volta**: o efeito do `App.tsx` já chama `hitGuildRaid`; a resposta ganha `evento?: {k, kind, level, bossId, bossHpPct, canAttack, trail?, rest?, gate?}` (campo aditivo, ausente em servidor/cliente antigo ⇒ comportamento de hoje). Depois do `encerrar()` o cliente abre o `FeiraEventoSheet`/`ResultScreen` se `evento.canAttack` ou `trail.pending`.
- Ordem no servidor (`guildRaidHit`): (1) lógica existente intacta (golpe, participação, seiva, cartão); (2) **depois** calcula `evento` de leitura. Erro no passo 2 não derruba o passo 1 (try/catch, evento omitido).
- Save novo: `gameState.guildFeira?: { seenK: number, ... }` apenas para "já mostrei a animação de volta" (cosmético). Campo tolerante, `?? padrão`, migração idempotente, **espelho no servidor não é necessário** (a fonte da verdade é a KV), mas o parity test do `CLAUDE.md` (Compatibilidade) cobre o shape (§8).
- Flag/data: constante `FEIRA_CHEFE_DESDE = '2026-11-xx'` (data de liga) em `_coop.js`; antes dela `evento` nunca é emitido. Clãs existentes entram em k=0 com `spawnDay` da 1ª volta pós-liga.

## 7. O que isto ALTERA no REGISTRO (para o `alpha-registro` conferir seções exatas)

| Seção | Efeito |
|---|---|
| §27 PR3 (Missão rega a Casa) | **Mantida**; apenas nota "a volta agora dispara o evento Feira". |
| §104 (Feira = fenômeno coletivo com HP `max(ativos,3)×45`, resgate semanal) | **Emendada**: o fenômeno semanal permanece, mas deixa de ser o único clímax da Feira; o chefe é um segundo ciclo, mistério a mistério. |
| §141 (Missão/Feira, 1 golpe/dia, janela ISO inteira G11) | **Mantida** para o golpe; **estendida**: o 1 ataque/dia ao chefe é independente do golpe do fenômeno. |
| `PLANO-GUILDA.md` G11 | Janela ISO continua para o fenômeno; chefe não tem janela (dura até morrer, LV-G9). |
| "Torneio × Arena" (CLAUDE.md) | Inalterada; chefe NÃO é Arena e não usa `tournamentSeason`. |

Texto novo (entrada para `docs/REGISTRO-DE-DECISOES.md`, número seguinte livre):

> **§N — Feira: o Chefe e o Desafio (28/10/2026).** A Missão não muda. Quando o Solmon volta, o clã encontra um mistério: um Chefe de HP compartilhado ou uma Trilha de desafios pessoais. **Decidido:** HP do chefe fixo na foto do dia de surgimento (`max(ativos,3)·d̄·0,9·dias(L)`, nunca regenera, nunca regride); 1 ataque/dia/pessoa re-simulado no servidor; abate idempotente por chave constante; resgate por pessoa com direito de participação; descanso de 1 dia; nível = mistérios concluídos (teto 20). Trilha: cada pessoa cumpre o seu para destravar a própria incursão; o clã só vê marcas agregadas. **Alternativa que perdeu:** contador único do clã (KV sem transação perde escritas); cliente envia dano (barato de fraudar); HP dinâmico com ausências (regride, fere LV-G3). **O que falsifica a aposta:** clãs de 4 levando >4 dias no nível 1, ou <1 dia (recalibrar `d̄`/`0,9`); >20% dos jogadores com porta travada por mais de 3 dias (desafio chato demais); qualquer leitura de agregado permitindo inferir contribuição individual. **Essências:** gancho no payload, implementação no backlog.

## 8. Testes e contratos

| Arquivo | Ação |
|---|---|
| `functions/api/guildFeiraFiacao.contract.test.ts` | **Adaptar**: nova chave `feiraHit`/`feiraTrail` lida na mesma fiação; resposta de `guildRaidHit` mantém `landed` e `[chave]` (contrato aditivo). |
| `functions/api/guild.vista.test.js` | Estender: a vista nunca contém `dmg`, `hits`, `hitters`, marcas por pessoa (LV-G1/G10); evento só traz `bossHpPct`, `max`, `marks` (número). |
| `functions/api/guild.raid.test.js` | Acrescentar: ataque ao chefe e desafio **não alteram `bosqueProgress`** (LV-G7). |
| `functions/api/guild.semPush.contract.test.js` | Nenhum push novo para chefe/trilha (LV-G4). |
| NOVO `functions/api/guild.feira.chefe.test.js` | (a) limite 1/dia (429); (b) `HP ≥ 3·cap` para todo L e N; (c) abate idempotente: duas leituras gravam o mesmo `feiraDead`; (d) saída de membro não reabre; (e) tardio sem `feiraPart` não resgata; (f) resgate 2× não duplica; (g) `descanso` d+1 sem evento; (h) `spawnDay` determinístico; (i) tabela §2 como teste de snapshot (script acima); (j) re-simulação com semente do servidor ignora `dmg` enviado pelo cliente. |
| NOVO `functions/api/guild.feira.trilha.test.js` | quórum, 3 dias, gate libera, solução inválida rejeitada, `scoreIsPlausible` para o reflexo. |
| `src/utils/guildMission.test.ts` | inalterado (formato intocado) + teste de que `evento` ausente = comportamento antigo. |
| Parity/Compatibilidade | save `guildFeira?` tolerante: carga de save sem o campo, migração 2× = no-op, `src/utils/*` vs. espelho servidor (se houver) em `parity` existente. |
| `BattleStage.layout.test.ts` | modo `boss` (§3). |
| UI | `ResultScreen` variante boss: render, reduced motion, EN+PT (chaves i18n, EN primeiro). |

## 9. Arte

- **Resolvido pelo dono (28/10): a arte JÁ EXISTE.** Os chefes são os arquivos em `src/assets/soulmon/bosses/` (banco do jogo J196–J220: 24 `boss-<id>.png` + `boss-arauto-do-fim-full.png`, todos 512x512 RGBA, criaturas inteiras; não são bustos). Os J221+ são silhuetas do Pesadelo e NÃO são chefes. Ampliar com escala **inteira** e `image-rendering: pixelated` (alvo ~70% da largura); `boss-arauto-do-fim-full.png` fica para L≥15.
- Sem arte nova pendente para chefes: NÃO criar linhas de geração de chefes em `ASSETS-A-GERAR.md` (a linha abaixo fica só como referência histórica de 'corpo inteiro maior', opcional e sem prioridade).
- Linha para `docs/ASSETS-A-GERAR.md` (copiar):

> `| boss-<id>-full (23 chefes) | corpo inteiro, 1024 px, alfa real (gpt_image_2 --background transparent), pose frontal calma, estilo arcano (natureza+magia), cor própria por criatura, SEM engrenagem/arreio | Chefe da Feira (BattleStage modo boss, metade superior) | substitui busto ampliado |`
> `| ícones do desafio da Trilha (marcas, barra de trilha) | 1 glifo + 1 selo | FeiraEventoSheet | provisório: glifo existente |`
> `| selo de troféu do chefe (24) | 1 selo por chefe | resgate | opcional |`

## 10. Itens de execução e ordem de PRs

Executor: **Sonnet** = código/servidor/regra; **Haiku** = mecânico (i18n, snapshot de tabela, ASSETS-A-GERAR).

| ID | Item | Critério de aceite | Arquivos | Executor | Depende |
|---|---|---|---|---|---|
| F-01 | Constantes e funções puras do chefe: `bossHpFor(L,N)`, `diasAlvo`, `danoBaseFor`, `kindDoMisterio`, `nivelDoMisterio`, `FEIRA_CHEFE_DESDE`. | Tabela §2 reproduzida em snapshot; `HP ≥ 3·cap`. | `functions/api/_feira.js` (novo), `_coop.js` (export) | Sonnet | — |
| F-02 | Chaves KV e leitura derivada do estado (`lerEstadoFeira`): ALIVE/DEAD/REST/TRAIL, foto `feiraEvt`, `feiraDead` idempotente. | testes (c)(d)(h) verdes; sem escrita no blob. | `_feira.js`, `_coop.js` | Sonnet | F-01 |
| F-03 | Ataque ao chefe: `POST guildFeiraAttack` com re-simulação (`loadDuelSide`+`simulateDuel`, semente `crypto`), cap, 429 diário, 409 morto. | (a)(j) verdes; resposta só agregado. | `guild.js` (rota + `ACTIONS`), `_feira.js`, `_duel.js`/`_combate.js` (somente leitura) | Sonnet | F-02 |
| F-04 | Resgate do abate: `guildFeiraClaim` idempotente com `feiraPart`, recompensas §5, `reward.essences: []`, `reward.element`. | (e)(f) verdes; LV-G6 (`guildReward.contract`) verde. | `guild.js`, `_feira.js`, `_casa.js` (seiva) | Sonnet | F-03 |
| F-05 | Evento na volta: `guildRaidHit` devolve `evento?` (aditivo) depois da lógica existente; `FEIRA_CHEFE_DESDE` | contrato `guildFeiraFiacao` adaptado; clientes antigos funcionam. | `guild.js`, `guildFeiraFiacao.contract.test.ts` | Sonnet | F-02 |
| F-06 | Trilha: `guildFeiraTrailStart` (semente) / `guildFeiraTrailDone` (verificação por atividade), gate `feiraGate`, quórum/3 dias, bônus −3%/marca teto −15%. | testes da trilha verdes; gate libera. | `_feira.js`, `guild.js`, `rankings.js` (só uso de `scoreIsPlausible`) | Sonnet | F-02 |
| F-07 | Vista segura: agregados no `guildVista` (`bossHpPct`, `marks`), sem contribuição individual. | `guild.vista.test` e `GuildSheet.render.test` verdes. | `guild.js` (montar), `GuildSheet.tsx` | Sonnet | F-05 |
| F-08 | `stageLayout` modo `boss` + teste de layout. | 3 viewports passam; centrado e na metade de cima. | `BattleStage.tsx`, teste novo | Sonnet | — |
| F-09 | Cliente: API (`community.ts`), `FeiraEventoSheet`, replay de luta com log do servidor, `ResultScreen` variante boss, save `guildFeira?` + migração. | luta mostra barra do clã agregada; replay determinístico; migração 2× no-op. | `community.ts`, `App.tsx` (efeito de volta), `ResultScreen.tsx`, `src/components/guild/*`, tipos do save | Sonnet | F-03, F-05, F-08 |
| F-10 | Cliente da Trilha: carrega minijogo semeado, envia solução, mostra marcas. | cumprir destrava; erro de rede não trava. | `src/components/mente/*`, minijogos Picross/Zip/Patches/Troca, `FeiraEventoSheet` | Sonnet | F-06, F-09 |
| F-11 | i18n EN+PT de todas as strings (EN primeiro); superfícies mudas. | teste de chaves i18n verde. | `src/i18n/*` | Haiku | F-09 |
| F-12 | Arte: aplicar escala inteira nos bustos; linha em `ASSETS-A-GERAR.md`; mapeamento quando o dono enviar a foto. | `docs/ASSETS-A-GERAR.md` com as 3 linhas; sem mudar código de regra. | `bossRoster.ts`, `docs/ASSETS-A-GERAR.md` | Haiku | F-08 |
| F-13 | REGISTRO §N + atualizar `CLAUDE.md` linha "Guilda: Casa · Missão · Guerra" e `PLANO-GUILDA.md` chave table. | texto de §7 entra; links ok. | `docs/REGISTRO-DE-DECISOES.md`, `CLAUDE.md`, `docs/PLANO-GUILDA.md` | Haiku | F-05 |
| F-14 | Verificação final (tsc, vitest, build) e observação de calibração em produção. | portões verdes; métrica "dias até abate por tamanho de clã" registrada. | — | Sonnet | todos |

### Ordem de PRs (pequenos)

1. PR-A: F-01+F-02 (puro, sem rota). 2. PR-B: F-03 (rota atrás de `FEIRA_CHEFE_DESDE` futura) + F-04. 3. PR-C: F-05+F-06+F-07 (servidor completo, `evento` ainda emitido só após a data; clientes antigos ignoram). 4. PR-D: F-08+F-09+F-11 (cliente do chefe). 5. PR-E: F-10 (trilha). 6. PR-F: F-12+F-13. **Liga** = trocar a data de `FEIRA_CHEFE_DESDE` para hoje.

### Rollback

Servidor aditivo: voltar `FEIRA_CHEFE_DESDE` para uma data futura desliga o `evento` (a Missão e o fenômeno continuam). Dados em chaves novas com TTL, nenhuma migração destrutiva. Ponto de não retorno: o primeiro resgate de chefe pago (Emblemas gravam no save do cliente; ver "Emblemas" em CLAUDE.md) — a partir daí não se apaga o histórico de `feiraDead`, só se desliga a emissão.

## 11. Riscos

| Risco | Mitigação |
|---|---|
| Cliente antigo em cache | contrato aditivo; ausência de `evento` = hoje. |
| Corrida de `feiraEvt` (`spawnDay` do k=0 pode diferir ±1) | `min` de dias; recompute só dá HP ligeiramente diferente se N mudou de 1 dia para o outro; aceito, documentado. |
| Soma de N leituras por request (12 membros) | leitura em paralelo (padrão `resolverFeira`), cartões já em `lerCartoes`; ver teto de subrequests Workers. |
| Contribuição inferida por diferença de leituras | só dano do próprio jogador + barra do clã; sem lista; mesmo risco aceito do fenômeno. |
| Trilha como pressão social (porta travada) | libera sozinha no 3º dia; sem nome; sem push (LV-G4). |
| Clã de 2 → HP piso 3 desproporcional | `max(N,3)`; teste de dias estimados (>2 d no L1 para N=2: ok, aviso na UI "chame mais um"? NÃO, LV-G2 — não implementar). |
| Luta "sem escolha" parecer vazia | repetição com animação rica; decisão de jogador (ver DÚVIDA 2). |
| Arte provisória em escala grande parecer ruim | escala inteira pixelada + moldura; troca quando a arte do dono chegar. |
| `ResultScreen` não suportar variante | F-09 inclui extensão por prop `kind`. |
| Tabela de dano desatualizada ao mudar `stagePower` | teste de snapshot §8 (i). |

## DÚVIDAS PARA O DONO

1. **Quando a próxima incursão do chefe/trilha chega?** (a) Mistério seguinte abre 2 dias depois do abate (1 dia de descanso) — recomendada; (b) abre no dia seguinte, sem descanso; (c) descanso de 2 dias.
2. **A luta do jogador tem escolha?** (a) Repetição automática validada pelo servidor, jogador só assiste e toca "bater" — recomendada (anti-fraude barato); (b) 1 escolha entre 3 golpes que o servidor re-simula; (c) luta jogável de verdade (mais caro, mais fraudável).
3. **Frequência de Desafio vs Chefe.** (a) 30% dos mistérios são Trilha, 70% Chefe, mistério 0 sempre Chefe — recomendada; (b) alternar 1 Chefe, 1 Trilha; (c) só Chefe nas primeiras 5 vezes.
4. **Benefício comum da Trilha.** (a) −3% de HP do próximo chefe por marca (teto −15%) + seiva da Casa — recomendada; (b) só seiva da Casa; (c) um enfeite cosmético para o clã.
5. **Teto de nível do chefe.** (a) Nível 20, depois repete em 20 — recomendada; (b) sem teto (HP cresce para sempre); (c) teto 10.
6. **Quem pode ver o chefe "Arauto do Fim" (única arte corpo inteiro hoje)?** (a) Reservado a L≥15, chefe final — recomendada; (b) entra no sorteio comum e usa corpo inteiro; (c) fora, até a arte dos outros chegar.


## 11. Decisões do dono (28/10/2026) — fecham as dúvidas e emendam o plano

- Luta: **replay automático validado pelo servidor** (F-03/F-09 como escritos).
- Descanso: **1 dia**; o mistério seguinte abre 2 dias depois do abate.
- Proporção: **30% Desafio (Trilha), 70% Chefe**; o mistério 0 é sempre Chefe.
- Benefício do Desafio: **SÓ seiva da Casa** (⚠️ emenda ao F-06: NÃO existe −3% de HP por marca nem teto de −15%; a Trilha não mexe na vida do chefe). Cada pessoa cumpre o seu Desafio para liberar a PRÓPRIA próxima incursão; o clã não precisa de quórum para os outros jogarem (a porta de cada um é individual; o contador de mistérios do clã avança quando o dia da Trilha fecha com pelo menos 1 cumprimento).
- Nível máximo do chefe: **20**. O **Arauto do Fim** só como chefe final a partir do nível 15.
- Arte: **os chefes já existem** (J196–J220, `src/assets/soulmon/bosses/`, 512x512; ver §9). Nenhuma geração de arte de chefe.
- A Missão de 30 min, o fenômeno semanal e o resgate semanal **continuam como hoje**; o evento (Chefe ou Desafio) aparece quando o Soulmon VOLTA.
- Liberação: o código vai para a `main` **DESLIGADO** (`FEIRA_CHEFE_DESDE` no futuro/chave off); o dono manda ligar depois de testar.
- Essências: fora do escopo (backlog `docs/BACKLOG-PRODUTO.md`); só o gancho `reward.essences: []`.
