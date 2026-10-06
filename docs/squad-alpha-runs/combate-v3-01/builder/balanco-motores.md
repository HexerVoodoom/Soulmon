# Balanço dos motores (Arena, Masmorra, Pesadelo, PvP) medido com o núcleo REAL

| Meta | Valor |
|---|---|
| Medido em | 06/10/2026, `origin/main` bd6adbed (PR1 #221 + PR1b #224). PR2 lido em `origin/combate-v3/pr2` 1b956d91 |
| Script | `docs/squad-alpha-runs/_sim/cv3-medir/` (`fightx.ts`, `medir.ts`, `unit.ts`, `rho.ts`, `cheer.ts` e as saídas `*-out.txt`) |
| Como rodar | copiar a pasta para `<worktree>/_medir/`, `npx esbuild _medir/medir.ts --bundle --platform=node --format=esm --outfile=_medir/medir.mjs` e `node _medir/medir.mjs`. Variáveis: `N`, `ONLY`, `UNIT=10`, `SIG`, `PVP_HP`, `ARENA_CLASS`, `DUN_*`, `FAMPOW` |
| Núcleo | importa `src/utils/combate/{fight,level,curve,rng,specials,ruler}.ts` sem cópia. `fightx.ts` é a **proposta de extensão do PR3** (ganchos). Com os ganchos desligados ele reproduz `fight()` em 300/300 lutas, bit a bit (seção 0) |

## 1. Resumo: medições × metas

Coluna "main" = núcleo atual. Coluna "proposta" = golpe normalizado (`HIT_UNIT_H0 = 10`) + σ 8%. **Aprovada pelo dono em §2.15 P1.** A Arena da §3 (1v1 em sequência) foi **substituída pela §6 (grupos N×1, P2)**. O anel e a esquiva foram recalibrados pela P4 (§6).

| Métrica | Meta (contexto) | main | proposta | Situação |
|---|---|---|---|---|
| DEF×DEF P95 (HP×1) | ≤ 40 s | 36,6 s | 31,1 s | ok nas duas |
| +1 Lv, menor vantagem de TTK | ≥ 2% | 5,2% (L40 def) | igual (razão de tempo contínuo) | ok |
| Gap entre builds, máx | ≤ 10% | 8,0% (def×spd L1) | igual | ok |
| Régua pareada, 7 famílias × 6 levels | ±5% (buff −15% rookie) | 0/42 fora | 0/42 fora | ok, mas **vazia na main** (ver §2) |
| Peso do especial direto no TTK | "1 especial por luta" com efeito | 24% L1 · 9% L13 · 4% L21 · **1,4% L40** | **29% em todo level** | main FALHA no espírito |
| Ataques por segundo na cena (2 lados) | legível | 0,8 L1 → **19,5 L40** | ~0,8 em todo level | main impossível de animar |
| Bônus 5% (teto), vitória do mais forte | ~90% declarado (§2.9) | 70% (61–80%) | 64–67% (= 1 − mais fraco) | abaixo do "~90%" da §2.9 (bom para o PvP) |
| Mais fraco por 5% vence, média | ~31% | 32,4% | 35,6% (PvE) · 33,0% (PvP) | ok |
| ↳ por estágio s0→s4 | uniforme | **42% → 21%** | 34–37% em todos | main não uniforme |
| 1 Lv abaixo vence, média | ~19% | 17,5% | 22,6% (PvE) · 18,6% (PvP) | ok |
| ↳ por estágio s0→s4 | — | 20% → 14% | 8% → 32% | inerente à curva: +1 ponto vale menos com mais pontos |
| PvE: TTK por inimigo (mediana) | 20–29 s | — | Arena 20,5 · Masmorra A1–A5 20,4–24,8 · Pesadelo 18,7–21,8 | ok (Pesadelo top 1–2 levemente abaixo de 20) |
| PvP: duração mediana | 35–42 s | 35,0–37,6 s (HP×1,55) | 38,1–39,1 s (HP×1,7) | ok |
| Arena: spread entre builds | ≤ 20pp | 11,3pp | 5,8pp | ok |
| Arena: spread entre famílias | ≤ 20pp | 12,5pp | 14,3pp (com `PVE_FAMILY_POWER`) / 28,1pp sem | ok com a tabela nova |
| Ofício: efeito no TTK | ≤ ±25% | — | artesão −7,7% · escriba −8,4% · demais ≤4% | ok |
| Torcida no PvP (cheio de toques × fantasma) | ~65% (§2.13) | — | +0,5 energia/s → 57,8% · +1/s → 81,7% | teto de **0,6/s** |
| Empate no PvP | resultado válido | — | 0,3–0,7% das lutas | ok |

## 2. Os três achados que mudam as stories

### A1. O "golpe" do núcleo não é uma unidade constante (FATAL para PR3–PR5 se não tratado)
`hitsToKnockOut` do espelho balanceado vai de **9,9 (L1) a 244 (L40)**. O HP cresce ×1,5 por estágio e ×(1+L/10), mas a janela (`windowSeconds`) força o espelho a durar 25 s. Consequências medidas:
- o especial (`SPECIAL_BUDGET_HITS = 3`) remove 30% do HP no L1 e **1,2% no L40**. A régua pareada passa com 0,0% no L40 porque o especial não faz nada lá;
- a cena teria **19,5 ataques/s** no ultra (intervalo 0,10 s). `PVE_STEP_MS` = 1700 e as animações de 1000–1500 ms não cabem;
- o AR(1) com ρ fixo **por golpe** faz a sorte se diluir quando os golpes crescem. O mais fraco por 5% vence 42% no rookie e 21% no ultra; no PvP (HP×1,55), 40% → 16%;
- "elemento = ±1 golpe" (Q5) vale 10% no L1 e 0,4% no L40.

**Correção proposta (PR3, no núcleo):** golpe normalizado. `u(L) = golpesDoEspelho(L) / HIT_UNIT_H0` (H0 = 10). Cada ataque vale `u` golpes da curva, e o intervalo é ×u. Razões de tempo, +1 Lv, gap de builds e DEF P95 não mudam (são razões contínuas). Muda o que dependia da contagem: especial 29% em todo level, cena a ~2,5 s por ataque de cada lado, sorte uniforme por estágio e elemento ±1 golpe = ±10% em todo level. Com isso o σ precisa cair de 15% para **8%**, para o mais fraco voltar às metas do dono (33%/19% no PvP). Ver P1.

Testei também a alternativa "ρ por fração de HP" sem normalizar (`rho.ts`). Ela uniformiza a sorte, mas não conserta o especial nem a cena. Foi descartada.

### A2. Os motores atuais não são 1v1 nem contínuos
- A Masmorra e o Pesadelo já são 1v1 em sequência, com HP e energia carregados (`reset({ foes: 1, keepPet: true })`).
- A Arena luta contra **grupos simultâneos**: rodadas 1/2/1/3/chefe (`ROUND_COMP`), com especiais em área (`targets: 'all' | 2`). O `fight()` do núcleo é 2 lados.
- O hook `usePveBattle` alterna turnos de `PVE_STEP_MS`, e o anel e a esquiva são **entrada ao vivo no meio da luta**. Por isso o `fight()` (que roda tudo de uma vez) não serve para a tela.

**Correção:** o PR3 estende o núcleo com um gerador `fightSteps` que pausa no cast (o anel e a esquiva resolvem o multiplicador) e com os ganchos `startHp`, `startEnergy`, `hitScale` e `cheer`. A Arena vira 1v1 em sequência (8 lutas por run). Ver P2.

### A3. Os dados do PvP vêm do perfil público, escrito pelo cliente
`duelStats(profile)` lê `profile.stage` e `profile.attrs`, gravados por `community.js action=profile` a partir do corpo do POST. Não existe `combatStats` em lugar nenhum da main (grep vazio). O level do PR2 é derivado do save (`perfectDays`, `evolutionStage`), e esses campos também são do cliente. O servidor não tem histórico próprio de dias. **Correção:** o duelo carrega o SAVE dos dois lados (KV `saveId`) e deriva o combatente com `_combate.js`/`_soulXP.js`. O teto S1 passa a vir de um relógio do servidor (`metadata.f` = primeira gravação do save). Ver P3.

## 3. Tabela de inimigos (substitui `TIER_BASE`, `PLAYER_STATS`, `STAGE_BUDGET`, `CLASS_SHAPE` e `MEDIUM_*`)

O inimigo é **relativo ao jogador**: o espelho balanceado do level do jogador (`combatantAt(L, balanced)`), com a vida × `hp` e a força × `power`. `power` entra como `bonus = power − 1` (negativo, só para NPC; o `combinedBonus` do jogador nunca fica negativo). "Pontos" de dificuldade = ×hp (golpes para derrubar) e ×power (fração do HP do jogador que ele tira).

### Arena (`ARENA_FOES`, rodadas 1v1 em sequência, cura 30% entre rodadas)
| Classe | hp | power | especial | Rodadas |
|---|---|---|---|---|
| weak | 0,75 | 0,125 | — | 2 (×2), 4 (×3) |
| medium | 0,95 | 0,21 | — | 1, 3 |
| boss | 1,20 | 0,445 | direto | 5 |
| por rodada r (0..4) | ×(1+0,04·r) | ×(1+0,13·r) | | |

Resultado (N = 1600 runs, proposta P1): run vencida 68–74% por build, 63–77% por família, 76% (s0) → 65% (s4). Anel/esquiva: sem agir 39%, médio 70%, bom 82%.

### Masmorra (`DUNGEON_SLOTS`, 6 slots por andar = baby-i..mega; cura `curaAndar` 25% entre andares)
| Slot | baby-i | baby-ii | rookie | champion | ultimate | mega |
|---|---|---|---|---|---|---|
| hp | 0,74 | 0,78 | 0,82 | 0,86 | 0,90 | 0,94 |
| power | 0,03 | 0,04 | 0,05 | 0,06 | 0,07 | 0,09 |
| especial | — | — | — | — | — | direto |
| por andar f | hp ×(1+0,09·(f−1)) · power ×(1+0,15·(f−1)) |

Escada (N = 600 runs, mesmo level): termina os andares 1–4 em 99–100%, o andar 5 em 40% e o andar 6 em 0%. Golpes exibidos do slot mega no L1: 9/10/11/12/13/14 (andar n+1 = +1 golpe). TTK mediano A1 20,4 → A5 24,8 s; P95 até 32 s nos andares ≥4. A parede fica no andar 5 para todo level, porque o inimigo é relativo. O `DEEP_START_MAX_LEVEL = 5` continua coerente.

### Pesadelo
Onda = slots `top−1..top` (`NIGHTMARE_WAVE_SIZE = 2`) do **andar 1**, sempre. O andar `max(1, top−1)` de hoje levava o TTK a 31 s no top 5. Vitória de 100%: o Pesadelo é recompensa, e perder não custa. TTK 18,7–21,8 s.

### `PVE_FAMILY_POWER` (multiplica `SPECIAL_POWER` só no PvE, fora da régua do espelho)
`{ direct: 1, dot: 1,1, heal: 0,8, shield: 1, atkBuff: 1,3, defDebuff: 1,3, spdBuff: 1,5 }`. Sem a tabela, a cura domina a sequência (HP carregado: 86% de vitória) e os buffs se perdem quando o inimigo cai (58%), o que dá 28pp de spread. Com a tabela, 14pp.

### NPC do treino (PvP)
`npcAtk ×0,85` vira `NPC_LEVEL_GAP = 2`: o NPC é `combatantAt(max(1, L−2), balanced)`. Não foi medido aqui. O PR5 mede, e a faixa de aceite é a vitória do jogador entre 75% e 92%.

## 4. Constantes calibradas (para as stories)
| Constante | Valor | Dono |
|---|---|---|
| `HIT_UNIT_H0` | 10 | `combate/fight.ts` (PR3) |
| `VARIANCE.sigma` | 0,08 (era 0,15), ρ 0,9, piso 0,05 | `combate/rng.ts` (PR3, se P1 = A) |
| `PVP_HP_SCALE` | 1,7 | `combate/fight.ts` → espelho `_combate.js` |
| `PVE_HP_SCALE` (núcleo) | 1 (o espelho já dura 25 s, ~21 s com especiais) | — |
| `CHEER` | 24 toques = 1 descarga; teto 16 toques por balde de 3 s; descarga = **+3 de energia** (teto ≈ 0,67/s) | `combate/specials.ts` |
| `ARENA_FOES`, `ARENA_ROUND_GROWTH` | tabela da §3 | `utils/arena.ts` |
| `DUNGEON_SLOTS`, `DUNGEON_FLOOR_GROWTH` | tabela da §3 | `utils/dungeon.ts` |
| `PVE_FAMILY_POWER` | tabela da §3 | `combate/specials.ts` |
| `ELEMENT_HITS` | ±1 golpe = hits ×(1 ∓ 1/H0) | `combate/curve.ts` |
| Auto-defesa | `hitScale` = 0 se acc ≥ perfeito, senão (1−acc)/0,3 (média ≈ 0,99) | `utils/autoDefesa.ts` |
| Contra-ataque | +0,5×`contraAtaque` golpe no próximo ataque, com teto de **+0,6** | `utils/profissaoMasmorra.ts` |

## 5. Limites desta medição
- O ofício foi aproximado: artesão/encantador/escriba → `hitScale` do jogador; ferreiro → HP; curtidor → recebido ×0,9; tecelão/luthier/cartógrafo → bônus de defesa. O PR4 mede com o mapeamento real.
- A Arena e a Masmorra são quase determinísticas na sequência (8 e 6 lutas somam a sorte). Por isso os coeficientes são sensíveis: power 0,12→0,13 levou a run de 86% para 60%. O teste do PR tem de fixar faixas, não pontos.
- A espera do anel e da esquiva (pausa do relógio) não entra no TTK. Ela é tempo de cena.
- O mais fraco por 1 Lv sobe de 8% (rookie) para 32% (ultra) porque, na curva, +1 ponto pesa menos com mais pontos. Isso é do PR1 (`level.ts`), não destes PRs.

## 6. Arena em GRUPO (N×1) — §2.15 P2 e P4 (06/10/2026)
- **Fonte:** `_sim/cv3-medir/groupfight.ts` (núcleo N×1 proposto para o PR3a) e `grupo.ts`. Saída em `grupo-final.txt`, com N = 3200 runs por lado (área e único).
- **Compatibilidade:** `groupFight` com N = 1 dá o mesmo 1º KO e o mesmo vencedor que `fight()` (normalizado) em 300 de 300 lutas.
- **Área × único (mesmo orçamento E):** a área dá E/k a cada inimigo vivo no cast; o único dá E ao alvo, e o DoT único repassa os ticks ao próximo alvo vivo.
  - Régua pareada, mesmas seeds: direct −2,4pp / −2,0% · dot −5,4pp / +1,4% · defDebuff −4,2pp / −4,8%. Faixa ≤6pp / ≤5%.
  - Sem o repasse do DoT, a área ganhava de +12 a +20pp. Com a eficiência do class-system (0,9), o direct em área perdia de 6 a 17pp. Por isso a eficiência é 1.
- **Fonte de área no app:** o class-system tem `AreaConfig` (`unico | circulo`), mas `StageSkill` não tem o campo e `realSkillPower` fixa `unico`. A única fonte de área hoje é `SPECIAL_EFFECTS.targets` por escola. Ver Q-AREA no PR3a.

| Métrica | Meta | Medido |
|---|---|---|
| Duração por rodada (mediana) | 20–29 s | R1 21,8 · R2 (2 inimigos) 19,8 · R3 21,0 · R4 (3) 27,6 · R5 boss 24,4; P95 até 44,8 (R4) |
| Vitória por build (spread) | ≤20pp | 64,4–69,1% (4,6pp) |
| Vitória por família × área (spread) | ≤20pp | 61,6–69,0% (7,4pp) |
| Por estágio | uniforme | 63,7–68,9% |
| Habilidade `nenhuma` × `boa` | ≤25pp (P4) | 47,9% × 71,9% = **24,0pp** (antes: 51,6pp) |
| Masmorra com o anel/esquiva novos | AC do PR4 | andares 1–4 98–100%, 5 32%, 6 0% |

Constantes: `ARENA_FOES` weak {0,45 · 0,12}, medium {0,95 · 0,235}, boss {1,2 · 0,495, direto}; `RING_MULT` 0,92/1/1,08; `DODGE_REDUCE` 0/0,2/0,35.

`PVE_FAMILY_POWER`:

| Motor | direct | dot | heal | shield | atkBuff | defDebuff | spdBuff |
|---|---|---|---|---|---|---|---|
| `arena` | 1 | 0,95 | 1,25 | 1,2 | 1,35 | 1,55 | 1,25 |
| `dungeon` | 1 | 1,1 | 0,8 | 1 | 1,3 | 1,3 | 1,5 |

A cura rende pouco em grupo (o dano entra de vários lados) e muito na sequência 1v1.


## 7. Masmorra e Pesadelo no núcleo REAL — PR4 (06/10/2026)
- **Fonte:** `_sim/cv3-medir/pr4/` (`m.ts` escada e Pesadelo, `opt2.ts` ajuste da tabela, `t.ts` torcida, `k.ts`/`q.ts` habilidade e vitória com torcida, `j.ts` ofício, saídas `*.out`). Os gates que ficam no repo são `dungeon.v3.test.ts`, `nightmares.v3.test.ts` e `profissaoMasmorra.v3.test.ts` (mesmas funções que a tela joga: `utils/dungeonFight.ts`).
- **Por que a tabela da §3 mudou:** o `fightX` da §3 não carregava a energia entre as lutas (não tinha `startEnergy`), e o jogo carrega (HP e energia passam para o inimigo seguinte). Reproduzindo a §3 sem carregar o núcleo real dá 100/100/100/98/26/0 e A1 20,4 s (a §3: 100/100/100/98/32/0 e 20,4 s); **carregando**, a mesma tabela dá 100/100/100/100/99,5/33,5 e A1 18,3 s: as lutas encurtam ~2 s e a parede vai do andar 5 para o 6.
- **Tabela recalibrada** (ajuste por busca aleatória sobre hp por slot, power por slot e os dois crescimentos, N = 600 runs por ponto, e depois à mão): `DUNGEON_SLOTS` hp 0,945 / 0,95 / 0,955 / 0,955 / 0,96 / 0,965 · power 0,026 / 0,038 / 0,04 / 0,06 / 0,089 / 0,096 · mega com especial `direct`; `DUNGEON_FLOOR_GROWTH` = { hp 0,14, power 0,11 }; cura entre andares `curaAndar` (0,25).
- **Medido com a tabela final** (N = 1200 runs, 15 levels × 4 builds × 7 famílias, `media`):

| Métrica | Meta | Medido |
|---|---|---|
| Andares 1–4 terminados | ~98–100% | 100 / 100 / 100 / 100% |
| Andar 5 terminado | ~30–40% | 36,6% |
| Andar 6 terminado | ~0% | 0,0% |
| Mediana por inimigo A1..A5 | 20–29 s | 20,6 · 20,1 · 23,5 · 26,8 · 28,9 s (P95 até 39,9) |
| Pesadelo top 1..5, mediana por inimigo | 18–22 s | 22,0 · 22,1 · 22,1 · 22,0 · 21,8 s (vitória 100%) |
| Golpes do mega no L1, andar 1..6 | sobe ≥ 1 por andar | 10 / 11 / 12 / 14 / 15 / 16 (igual em todo level) |
| Slot 0, andar 1 × ATK puro L40 com elemento | ≥ 3 golpes | 7 (o piso de 3 não chega a agir com esta tabela) |
| Habilidade, 3 andares (a da story) | ≤ 25pp | 0,0pp |
| Habilidade, média dos 5 andares | ≤ 25pp | 6,1pp (nenhuma 83,5% · média 87,3% · boa 89,6%) |
| Habilidade, concluir os 5 andares | (a Arena: 23,6pp) | **30,2pp** (18,0% · 36,6% · 48,2%); RED com o anel e a esquiva antigos: 79,1pp |
| Ofício, TTK | ≤ ±25% | ferreiro +0,1 · tecelão −3,7 · artesão −9,0 · joalheiro −2,4 · alquimista −0,4 · curtidor +0,1 · encantador −4,3 · escriba −8,9 · cozinheiro 0,0 · luthier −3,7 · cartógrafo −6,2 (%) |

- **Torcida (`CHEER.energyPerDischarge`):** ver contexto §2.18. Fixado em 90: TTK no teto Arena −23,5% e Masmorra −22,6%; diferença por habilidade com os dois lados torcendo 2,3pp (Arena) e 0,0pp (Masmorra, 5 andares). **Efeito colateral medido e não limitado pelos critérios do dono:** com torcida no teto, andar 5 da Masmorra 100% e andar 6 97,8%; Arena run vencida 96,7% (sem torcida, 66,7%).


## 8. PR4b: sem torcida na Masmorra e no Pesadelo; torcida da Arena (06/10/2026, contexto §2.19)
- **Fonte:** `_medir/a.ts` do worktree do PR4b (copiado para `_sim/cv3-medir/pr4b/`). Gates no repo: `arena.v3.test.ts` (AC5/AC6) e `dungeon.v3.test.ts` (sem torcida).
- **Masmorra e Pesadelo:** a torcida sai da UI (mascote, barra, toque) e do motor (`simulateDungeonRunV3` perde a opção `cheer`; `useGroupBattle` ganha `torcida: false`). A tabela da §7 foi calibrada **sem** torcida, então as metas dela não mudam (30,2pp ao concluir os 5 andares e Pesadelo ≤ 22,5 s: aceitos pelo dono).
- **Arena, `CHEER.energyPerDischarge`:** a métrica é a diferença de vitória da RUN entre "torcendo no teto" e "sem torcer", com a MESMA habilidade, ≤ 25pp, e o TTK ≤ ±25%. Como a habilidade que não age é a mais sensível (48% de base), ela decide o teto.

| `energyPerDischarge` | `nenhuma` (teto − sem) | `boa` (teto − sem) | TTK |
|---|---|---|---|
| 3 (antes do PR4) | +9,3pp | +6,4pp | −2,6% |
| 7 | +22,4pp | +16,7pp | −6,9% |
| 8 | +24,0pp | +17,8pp | −7,9% |
| **9 (fixado)** | **+24,8pp** | **+17,9pp** | **−8,7%** |
| 10 | +25,3pp (reprova) | +18,3pp | −9,6% |
| 11 | +26,5pp | +17,8pp | −10,4% |
| 90 (PR4) | +46,9pp (RED do gate) | — | −23,5% |

- N = 3200 (a amostragem do gate; 9 passa em 24,0pp com N = 9600 e em 24,8pp com N = 2400). A margem do 9 é fina (0,2pp na amostragem do gate): a mesma semente repete o mesmo número, mas qualquer mudança em `ARENA_FOES` ou nas tabelas de anel/esquiva pede nova medição.
- Arena `media`: run vencida 65,9% sem torcida e 86,3% com torcida no teto (era 96,7% com 90).


## 9. PvP no núcleo v3, com espelho no servidor — PR5 (06/10/2026, contexto §2.19)
- **Fonte:** os gates que ficam no repo: `functions/api/_duel.v3.test.js` (S1, duração, mais fraco, torcida, empate), `src/utils/combate/duel.test.ts` (NPC do treino), `functions/api/combate.parity.test.js` (paridade). Medição avulsa: `_sim/cv3-medir/pr5/pvp.ts` e `npc.ts`.
- **Decisões de calibração (o dono não fixou o número):** `CHEER.pvpEnergyPerDischarge` **3 → 2,5** e `NPC_LEVEL_GAP = 2` com **piso no estágio**.
  - A torcida por BALDE faz a descarga cair no FIM do balde de 3 s (é causal: o cliente só sabe a contagem quando o balde fecha). Com 3 de energia isso dá 68,4% no teto, perto do limite de 70%; 2,5 dá **64,5%** (a meta do dono é ~65%, §2.13). 2 dá 60,6%.
  - O NPC "2 levels abaixo" CRUZANDO o estágio (L7 contra L5) faz o jogador vencer 99,4% no champion; com o piso no 1º level do estágio fica 77,8–91,3% (RED sem o piso: 99,4%; gap 1: 63,3% no ultra).

| Métrica | Meta | Medido |
|---|---|---|
| Paridade (log de eventos + vencedor) | igual nos dois lados | 8400 lutas (15 levels × 4 builds × 7 famílias × 10 sementes × com/sem torcida): 0 divergências; RED `VARIANCE.sigma` só no espelho derruba |
| S1 | save forjado (level 40, dia 3) luta com level ≤ 4 | level 4; sem o teto vence 100% o par do dia 4, com o teto 53,5% |
| Duração mediana por estágio | 35–42 s | rookie 38,8 · champion 39,1 · ultimate 38,5 · mega 38,1 s (P95 56,7–58,1) |
| Mais fraco por 5% vence | 25–40% | 31,4% |
| 1 Lv abaixo vence | 10–30% | 17,3% |
| Torcida no teto × fantasma sem torcida | 55–70% (~65%); TTK < 25% | 64,3% · TTK ×0,985 (RED com 36 por descarga: 99,7%) |
| NPC do treino, vitória do jogador | 75–92% por estágio | 89,8 · 91,3 · 88,8 · 83,5 · 77,8% (rookie..ultra) |
| Empate | resultado válido | existe (0,3–0,7% das lutas); a rota devolve `draw: true`, sem pontos, vitória, derrota ou Honra |
