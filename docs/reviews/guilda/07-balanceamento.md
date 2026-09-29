# Guilda — 07 · Balanceamento (plano, 29/09/2026)

> Plano de números, sem código de produto. Decisões do dono de 29/09/2026 são premissa
> (até 12 membros, Bosque de 5 estágios, 1 fio por membro que cumpre `dailyGoalFor`,
> agregado/anônimo/nunca regride, raid semanal com HP = membros × k, prêmio só
> cosmético/Emblemas, nenhuma perda material). Vetos LV-G1..G10: `02-psicologia.md` §8.
> Simulação reprodutível: `docs/reviews/guilda/sim/guilda-sim.mjs`.

## 0. Âncoras medidas no código

| Âncora | Valor | Fonte |
|---|---|---|
| Fio = cumpriu a própria meta | `dailyGoalFor` (meta INTEIRA, não a de coração) | `src/utils/dailyReset.ts` |
| `stagePower` | rookie 1 · champion 2 · ultimate 3 · mega 4 · ultra 5 | `functions/api/community.js` |
| Arena | +20/−8 pontos, `MATCHES_PER_DAY` = 5 | idem |
| Emblemas do Torneio | 3 vitória / 1 derrota | `EMBLEMS_PER_WIN`/`_LOSS` |
| Loja do Torneio | 8/12/15/20/25/40/55/70 = **245** no total | `TOURNAMENT_ITEMS`, `src/utils/shop.ts` |
| Missões semanais | 3 por semana, 2–4 Emblemas cada (≈8/semana) | `src/utils/weeklyMissions.ts` |
| Meta do coop | 5 × membros por semana, não 7× | `docs/PLANO-COOP.md` §3.2 |

## 1. Limiares do Bosque

### 1.1 Absoluto vs proporcional

**Absoluto** (limiar em fios crus, ex.: 1.500 fios para o Bosque antigo):
guilda de 12 a 60% = 7,2 fios/dia → 208 dias; guilda de 3 a 60% = 1,8/dia → **833 dias**.
A guilda pequena fica presa e alt accounts compram velocidade — reprovado.

**Proporcional** (recomendado): o progresso soma, a cada virada,
`fios_do_dia / membros_do_dia`, uma unidade que chamo de **dia-de-guilda** (1,0 = todos
cumpriram a própria meta naquele dia). Os limiares ficam em dias-de-guilda:

| Estágio | Limiar (dias-de-guilda) | 40% presença | 60% | 80% |
|---|---|---|---|---|
| 1 Clareira (marco 1) | **2** | 5 d | 4 d | 3 d |
| 2 Ramagem | **10** | 25 d | 17 d | 13 d |
| 3 Copa | **25** | 63 d | 42 d | 32 d |
| 4 Mata | **50** | 125 d | 84 d | 63 d |
| 5 Bosque antigo | **90** | 225 d | 150 d | 113 d |

A conta é `dias = limiar / presença`, **a mesma para 3, 6 e 12 membros** — o tamanho só
reduz a variância (uma guilda de 3 oscila mais de um dia para o outro, mas a média é igual).
Metas: marco 1 em ≤7 dias para qualquer presença ≥30% (2/0,3 = 6,7 d) ✔; último marco
em 90–180 d para a guilda mediana (60% → 150 d) ✔; guilda de 3 não fica presa ✔.
Antes do marco 1 a guilda vê um terreno vazio com os primeiros fios (estado 0, não é estágio). Curva monotônica e com intervalos crescentes (2, 8, 15, 25, 40): marco cedo como
progresso dotado, espaçamento que cabe no ciclo de hábito (66 dias ≈ Mata).

Por que isto casa com "a meta encolhe ao sair" do coop: se um membro sai, o
denominador do dia seguinte encolhe e ninguém paga pela saída (LV-G5). O progresso
acumulado nunca é recalculado para trás (LV-G3) — só a taxa futura muda.

Estágio NUNCA regride: o servidor guarda `bosqueProgress` (float, só soma) e o estágio é
derivado dele na leitura (mesmo padrão de `bondLevelFor(totalXP)` — sem estágio persistido
duplicado).

### 1.2 Membro novo numa guilda madura

- **Vê** o Bosque inteiro no estágio atual (é dele também, sem assimetria de "chegou tarde")
  e, desde o primeiro dia, o próprio fio aparece como **brilho novo** na obra da maré
  corrente (§2), que começou há no máximo 6 semanas — é ali que o progresso dotado mora.
- **Não recebe de graça**: Emblemas retroativos de raids que não participou, nem os
  cenários de estágio que a guilda liberou antes dele. Proposta: cenário de estágio é
  liberado a quem estava na guilda na virada do marco **ou** a quem contribuiu fios em
  **7 dias distintos** (não consecutivos — LV-G9) desde que entrou. 7 dias em janela livre
  impede "entrar, pegar 5 cenários, sair" (guilda-hopping) sem exigir sequência.
- Hopping entre guildas não acelera nada porque o progresso é da guilda, não do membro.

## 2. Estações ou perpétuo → **perpétuo com marés**

Tradução da §5.2 da psicologia ("a estação colhe, a guilda guarda"):

- **O Bosque é perpétuo** e só cresce (estágios da §1).
- **Maré** = ciclo de **6 semanas** (`GUILD_TIDE_WEEKS` = 6; dentro da faixa 4–6 da §5.2,
  no teto para caber meio ciclo de hábito). Cada maré tem uma **obra sazonal** pequena
  (ex.: "a floração"), com meta em dias-de-guilda **12** (60% → 20 dias; 40% → 30 dias).
- Na virada da maré a floração é **colhida no estado em que estiver** e vira uma peça
  permanente no Bosque (ex.: um anel de flores com a cor da maré). Três tamanhos
  descritivos, nenhum chamado de pior: broto (<4), ramo (4–11), floração (≥12).
  Nenhuma maré "falha"; não há reset do Bosque.
- A peça não é exclusiva à venda nem exige presença diária: a paleta da maré volta
  no ciclo seguinte do ano (regra dos Sonhos sazonais, obtível fora da estação).

## 3. Raid (o "fenômeno" semanal)

| Parâmetro | Proposta | Motivo |
|---|---|---|
| Janela | segunda 00:00 → domingo 23:59 (dia do jogador) | espelha a semana; sexta–domingo do Torneio fica como clímax natural |
| HP | `max(membros, 3) × 45` | piso de 3 impede guilda de 1–2 trivial |
| Rodada | 1 por membro por dia, **só por gesto** (não automática) | teto diário = 1; nenhum horário sincronizado (LV-G9) |
| Dano | `10 + 2 × stagePower` (rookie 12 → ultra 20), ±20% sorteado no servidor | ultra dá 1,67× um rookie, não 5×: a diferença de estágio conta sem virar pay-to-win nem humilhar rookie |
| Quem decide | servidor, com `stagePower` lido do save verificado | cliente é editável |
| Vínculo com a meta | a rodada **não** exige ter cumprido a meta do dia | a raid é convite, não segunda cobrança; o fio do Bosque é que depende da meta |

Dano esperado por membro/dia = presença × 16 (criatura média ~champion/ultimate).
Dias até derrubar = 45 / (16 × presença):

| Presença média | Dias | Resultado |
|---|---|---|
| 100% | 2,8 | cai na quarta — cedo, mas exige 3 dias de todos, não trivial |
| 80% | 3,5 | quinta |
| 60% | 4,7 | sexta ✔ (meta sexta–domingo) |
| 45% | 6,3 | domingo |
| 30% | 9,4 | não cai: **recua** |

**Recuo sem culpa**: o fenômeno "volta para a névoa" no domingo; o dano não é exibido por
membro (LV-G1), não há rótulo de derrota, nenhuma perda. Texto coletivo apenas.
**Só 1 membro joga** (guilda de 3, HP 135): 16×7 = 112 → recua; um ultra com sorte
(20×7 = 140) derruba no domingo. Nenhum dos dois casos gera aviso aos outros (LV-G4).

## 4. Recompensas

### 4.1 Emblemas

`RAID_EMBLEMS` = **4** para cada membro que deu ≥1 rodada numa raid concluída (não
proporcional ao dano — LV-G1/LV-G8).

| Perfil | Emblemas/semana hoje | + raid (90% de conclusão) | Variação | Semanas p/ esvaziar a loja (245) antes → depois |
|---|---|---|---|---|
| casual (missões ≈8 + 2 partidas/dia ≈ 28) | ≈36 | ≈39,6 | +10% | 6,8 → 6,2 |
| leve (só missões ≈8) | ≈8 | ≈11,6 | +45% | 31 → 21 |
| pesado (5 partidas/dia, 70% vitória ≈ 84 + 8) | ≈92 | ≈95,6 | +4% | 2,7 → 2,6 |

A raid pesa para quem hoje quase não ganha Emblema (o jogador que não compete), sem
esvaziar a escada 8..70 para quem já joga Torneio. 4 < 1,5 vitória do Torneio por
semana: a raid não substitui o Torneio como fonte.

### 4.2 Cosméticos do Bosque (preço 0 = conquista)

- 5 cenários `bg-guild-*` (um por estágio), regra de liberação da §1.2; fora da loja,
  fora de venda (LV-G6), mesmo padrão dos `bg-mission-*`.
- Peça de maré (§2), no Bosque (não no palco do pet).
- 1 decoração de raid a cada **4 raids concluídas** em que participou (contador lifetime,
  sem janela), slot `trophy` — reusa a vitrine do Torneio.

### 4.3 Farmável por save editável

Emblemas vivem no save do cliente e já são farmáveis hoje; `RAID_EMBLEMS` passa a ser
concedido pelo **servidor** (é ele que decide a raid), mas o saldo continua no cliente.
Aceitável pela regra existente: tudo que Emblemas compram é `bg`/`furniture` cosmético
(há teste travando a aba Torneio). Quem edita o save ganha enfeite para si, e ninguém mais
perde nada. Se Emblemas um dia comprarem vantagem, sobem para o servidor junto dos Créditos.

### 4.4 Constantes propostas

| Constante | Valor | Justificativa | Dono |
|---|---|---|---|
| `GUILD_MAX_MEMBERS` | 12 | decisão do dono | `functions/api/_guild.js` (servidor decide) + reexport tipado em `src/types/guild.ts` |
| `GUILD_MIN_RAID_MEMBERS` | 3 | piso do HP; guilda de 1–2 não fica trivial | `_guild.js` |
| `FIO_PER_MEMBER_DAY` | 1 | um fio por quem cumpriu `dailyGoalFor`, nunca peso (LV-G8) | `_guild.js` |
| `BOSQUE_THRESHOLDS` | [2, 10, 25, 50, 90] dias-de-guilda | marco 1 ≤7 d a 30%; Bosque antigo ≈150 d a 60% | `_guild.js` (fonte) e `src/types/guild.ts` (leitura para a UI) |
| `GUILD_TIDE_WEEKS` | 6 | faixa 4–6 da psicologia | `_guild.js` |
| `TIDE_BLOOM_TARGET` | 12 dias-de-guilda | floração em ~20 d a 60% | `_guild.js` |
| `STAGE_UNLOCK_DAYS` | 7 dias distintos | anti-hopping sem sequência (LV-G9) | `_guild.js` |
| `RAID_HP_PER_MEMBER` | 45 | 60% derruba na sexta | `_guild.js` |
| `RAID_DMG_BASE` / `RAID_DMG_PER_POWER` | 10 / 2 | ultra 1,67× rookie | `_guild.js`, importando `stagePower` de `community.js` (extrair para `_stage.js`, não copiar — footgun 9) |
| `RAID_DMG_JITTER` | 0,20 | sorteio no servidor | `_guild.js` |
| `RAID_ROUNDS_PER_DAY` | 1 | teto diário | `_guild.js` |
| `RAID_EMBLEMS` | 4 | +4–45% Emblemas/semana conforme perfil | `_guild.js` (concede) |
| `RAID_TROPHY_EVERY` | 4 | decoração a cada 4 raids | `_guild.js` |

## 5. Exploits e dark patterns

- **12 alt accounts**: progresso é normalizado, então 12 alts com presença 100% andam
  exatamente como 1 guilda de 3 com presença 100% (Bosque antigo em 90 d). Ganho: 5
  cenários, peças de maré e 4 Emblemas/semana por conta — tudo cosmético, sem ranking
  entre guildas (sem ranking não há quem perca posição). Dano real: **nenhum** a terceiros.
  Custo para o servidor: 12 cadastros; o teto de convites por dia já limita.
- **Guilda de 1**: permitida (alguém cujo grupo saiu), Bosque anda normal pela
  normalização; a raid tem piso de 3 → raramente cai. Mostrar "o fenômeno é maior
  que um só" sem cobrança; nunca bloquear a pessoa.
- **Guilda que só cresce por 1 membro**: a normalização já trata (3 membros com 1 ativo
  = 33% → marco 1 em 6 d, Bosque antigo em 270 d). Não se esconde que a obra anda devagar,
  mas nenhum texto aponta quem não veio (LV-G2).
- **"Faltam N fios"**: permitido **só coletivo e em dias-de-guilda arredondados** ("a
  Copa está perto"), nunca "faltam 3 pessoas hoje" (transformaria o número em lista de
  ausentes → LV-G2/G4). Preferir barra sem número de pessoas.
- **Vetos aplicados aos números**: LV-G1 (dano e fios nunca por membro; Emblemas iguais
  para quem participou) · LV-G3 (progresso só soma; float nunca decresce) · LV-G6 (sem
  Créditos em nada daqui) · LV-G8 (fio = 1, independente do peso da meta) · LV-G9
  (7 dias distintos, rodada a qualquer hora) · LV-G10 (dano usa `stagePower`, nunca HP).

## 6. Simulação

Método (mesmo espírito da sim de 90 dias da rodada 2: Monte Carlo com semente fixa):
200 guildas, tamanho uniforme 3–12, presença por membro ~ Beta(3,2)×0,95 (média ≈57%),
criatura uniforme rookie..ultra, raid e Bosque com as constantes da §4.4.

`node docs/reviews/guilda/sim/guilda-sim.mjs 42 200` (seed 42, horizonte 200 dias):

| métrica | p10 | p25 | p50 | p75 | p90 |
|---|---|---|---|---|---|
| dia do marco 1 (Clareira) | 3 | 4 | 4 | 5 | 5 |
| dia do marco 3 (Copa) | 38 | 41 | 44 | 49 | 56 |
| dia do marco 5 (Bosque antigo) | 139 | 146 | 156 | 175 | 195 |
| raids concluídas / semana | 69% | 93% | 97% | 97% | 100% |

Média de raids concluídas: 90%; 186/200 chegam ao Bosque antigo em 200 dias (as 14 restantes são as
de presença baixa, que continuam crescendo — nada regride). Com horizonte de 90 dias
(`… 42 90`), nenhuma guilda chega ao Bosque antigo e o marco 3 fica em p50 = 45 d — o topo é
de longo prazo, como pedido.

Leitura: a taxa de raids de 90% reflete a presença média de 57% da amostra; é alta de
propósito (a raid é celebração coletiva, não filtro). Se o dono quiser mais tensão, o
botão único é `RAID_HP_PER_MEMBER` (55 leva 60% para domingo).
