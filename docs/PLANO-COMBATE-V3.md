# HANDOFF — Combate v3: atributos lineares + especial com nome e efeito

> **CONCLUÍDO em 06/10/2026.** O run `combate-v3-01` implementou este plano em PR1 a PR11 (com divergências decididas pelo dono ao longo do caminho: curva por level em vez de "1 ponto por dia", golpe normalizado, talentos, equipamento, teto único de 5%). **O que vale hoje está em [`REGISTRO-DE-DECISOES.md`](REGISTRO-DE-DECISOES.md) §24 e em [`manual/02-REGRAS-DE-NEGOCIO.md`](manual/02-REGRAS-DE-NEGOCIO.md) §55-B.** O texto abaixo é o histórico do pedido e fica como estava.

Criado em 04/10/2026, a pedido do dono. Para abrir uma **sessão dedicada** do Claude Code em `D:\Soulmon\repo`.
O prompt de abertura está na seção 0. Ao começar, copie este arquivo para `docs/PLANO-COMBATE-V3.md` (com entrada no
`docs/manual/00-MAPA.md`, senão o `docsManual.contract` reprova) e trabalhe a partir dele.

---

## 0. PROMPT DE ABERTURA (cole na sessão nova)

```
Sessão dedicada do Soulmon: COMBATE v3. Repo D:\Soulmon\repo (main). Leia, nesta ordem:
  1. D:\Soulmon\HANDOFF-COMBATE-V3.md  (este plano — pedido do dono, modelo matemático, mapa do código, fases, perguntas)
  2. CLAUDE.md do repo (regras de jogo, footguns, deploy) e docs/manual/00-MAPA.md
  3. docs/REGISTRO-DE-DECISOES.md §20 (combate v2) e §23 (Torneio R8) antes de mudar qualquer regra
Primeiro passo: copie o handoff para docs/PLANO-COMBATE-V3.md (+ linha no 00-MAPA.md) e me mande, em UM modal
(AskUserQuestion, até 4 perguntas por modal), as decisões abertas da seção 7 que bloqueiam a Fase 1. Siga com o que não
bloqueia enquanto eu respondo. Trabalhe em worktree própria a partir de origin/main (git worktree add E:/soulmon-cv3 ...;
junction de node_modules para D:\Soulmon\repo\node_modules). Fases curtas, cada uma com PR + CI verde + merge ff na main
(merge está sempre autorizado). Regras: um dono por regra (funções PURAS, sem React), simulação como prova de balanço,
paridade cliente/servidor travada por teste, EN primeiro + PT-BR, commits PT-BR com
"Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>". Rode tsc (app + tsconfig.server.json), vitest dos tocados e,
antes do PR, npm run build (dist é commitado). Dúvidas: modal, em paralelo ao trabalho; nunca pare esperando.
```

---

## 1. O pedido do dono (literal, 04/10/2026)

> Quando um soulmon é criado o golpe especial dele deve receber um **nome**! Isso deve considerar a personalidade,
> atributos, tipo de ataque, elementos e recursos utilizados, para criar uma fantasia que seja coerente. É uma boa
> oportunidade para evoluirmos o sistema de combate, com especiais que podem **curar, amaldiçoar, causar dot, buffar**, etc.
>
> Além disso, podemos já balancear o ataque básico: o soulmon tem **1 de atk, 1 spd, 1 def, 10 hp** no nível rookie.
> **A cada dia ele ganha 1 ponto** em um desses atributos, e **quando evolui ganha um boost de 50%**.
> Com **2 de ataque** ele deve derrotar um oponente com atk/def/spd 1 e hp 10 em **9 golpes em vez de 10**.
> Com **2 de def**, deve aguentar **1 golpe a mais**. Com **2 de speed**, deve atacar **10× no tempo em que levaria 9×**.
>
> Quero que o balanceamento seja assim, **simples e linear**, de modo que a estratégia não impacte muito na matemática
> mas só no **playstyle**. Alguém com especial de **dot** deve derrotar o inimigo **no mesmo tempo** que se tivesse um
> especial de dano direto; se for de **cura**, deve se curar **na mesma proporção**. **Buffs e debuffs** também.

Contexto da rodada 8 (já na main ou no PR #219): o tipo do golpe (físico/à distância) vem da skill
(`SCHOOL_STRIKE_FORM`/`ELEMENT_STRIKE_FORM` em `src/utils/combatFx.ts`); o círculo de cast é só do especial; selo
"ESPECIAL!" (`SPECIAL_LABEL`, `specialLabel(isPt)`) — nomes alternativos propostos: Arcano!/Arcane!, Despertar!/Awaken!,
Ápice!/Zenith! (dono ainda não escolheu; o NOME PRÓPRIO do especial pode substituir o selo genérico — ver §7).

---

## 2. Modelo matemático proposto (linear, a validar com o dono)

A unidade de tudo é o **golpe** (um ataque básico). Nada de multiplicação entre atributos — cada ponto vale **um golpe**.

### 2.1 Golpes para derrubar
```
golpesParaDerrubar(atacante, defensor) = max(1, defensor.hp + defensor.def − atacante.atk)
```
- Base rookie 1/1/1/10 contra 1/1/1/10 → `10 + 1 − 1 = 10` golpes. ✔
- ATK 2 → `10 + 1 − 2 = 9`. ✔  ·  DEF 2 (defensor) → `10 + 2 − 1 = 11` (aguenta 1 a mais). ✔  ·  HP +1 → +1 golpe.
- Dano por golpe exibido = `defensor.hpMax / golpesParaDerrubar` (fracionário; a barra anda em passos iguais).
- Piso 1: nunca imune, nunca "um golpe só" abaixo disso — ver a pergunta Q3 sobre o piso.

### 2.2 Velocidade
```
ataquesPorJanela(spd) = BASE_RITMO + spd        // BASE_RITMO = 8
intervalo(spd)        = JANELA / (BASE_RITMO + spd)
```
- SPD 1 → 9 ataques por janela; SPD 2 → 10 na mesma janela. ✔ (Linear no ritmo, não no intervalo.)
- `JANELA` é calibrada para o tempo de luta já acordado (PvE ~20–29 s por inimigo, PvP ~35–42 s; REGISTRO §20).
  Torcida (taps) e energia continuam por cima — o especial é disparado por ENERGIA, não por turno.

### 2.3 Crescimento
- **+1 ponto por dia** num de ATK / DEF / SPD / HP (qual — **Q1**). Sugestão: o ponto do dia vai para o atributo ligado
  ao galho que mais cresceu no dia (Poder→ATK, Harmonia→SPD, Benevolência→DEF; HP… ver Q1), para o combate refletir
  o cuidado real sem criar uma segunda economia. Só em **dia completo**? (Q2)
- **Evolução: +50%** em todos os atributos (arredondamento — Q4). Com crescimento linear diário, o "boost" é o salto
  visível da cerimônia.
- Os 4 atributos de combate são **novos campos no save** (ex.: `combatStats {atk,def,spd,hp, history?}`), separados de
  `powerPoints/harmonyPoints/benevolencePoints` (galho de evolução) — **nunca derivar um do outro com duas fontes**
  (footgun 9). Sanear no load (`?? padrão`) e em `functions/api/save.js`; atualizar o teste de contagem de campos
  `GameStateContext.hydrate.fuzz2.qa.test.tsx` (hoje 103).

### 2.4 Inimigos
- Inimigos (Masmorra, Arena, Pesadelo, NPC do Torneio) passam a ter `atk/def/spd/hp` na MESMA escala, derivados do
  tier/andar por uma tabela única (substitui `TIER_BASE` de `utils/dungeon.ts` e o `dmg/hp` de `PLAYER_STATS` /
  `getArenaPlayerStats` em `utils/arena.ts`). A dificuldade da escada vira "quantos pontos acima/abaixo do jogador".

---

## 3. Especiais: orçamento único em "golpes equivalentes"

Todo especial custa a mesma energia e vale o mesmo **orçamento `E` golpes** (ex.: `E = 3`, calibrar). A forma do efeito
muda o PLAYSTYLE; o valor esperado é o mesmo:

| família | efeito | regra de equivalência |
|---|---|---|
| **Dano direto** | `E` golpes de uma vez | referência |
| **DoT** | `E` golpes em `k` ticks ao longo de `t` s | total = `E`; `t` curto o bastante para não sobrar luta (ou o resto expira em dano imediato) |
| **Cura** | recupera `E` golpes **do inimigo** de HP próprio (o quanto o inimigo te tira em `E` golpes) | cura proporcional ao dano recebido, não ao HP máx |
| **Buff (ATK/SPD)** | +X por `t` s | X·t escolhidos para render `E` golpes extras esperados |
| **Debuff (DEF/ATK do inimigo)** | −X por `t` s | idem, medido em golpes tirados/evitados |
| **Escudo** | absorve `E` golpes do inimigo | mesma conta da cura |
| **Área / múltiplos alvos** | `E` dividido entre alvos (ou `E` em cada com fator <1) | decidir na calibração; hoje `conjuracao` = all, `longo_alcance` = 2 |

**Prova obrigatória (a régua):** simulação determinística (seed) de lutas 1×1 com cada família de especial contra o mesmo
inimigo → **tempo médio para vencer** (ou HP líquido no fim, para cura/escudo) dentro de ±5% da referência de dano
direto. Hoje já existe precedente: `simulateArenaRun`/`simulateArenaRunEnergy` em `utils/arena.ts` + `arena.test.ts`
("win rate por arquétipo 40–80%, spread ≤ 20pp" — `SPECIAL_EFFECTS` foi CALIBRADO por ela). A v3 troca o critério para
paridade de tempo e mantém o teto de spread.

Mapeamento escola → família (ponto de partida; o nome vem depois):
`combate_fisico` → dano direto · `longo_alcance` → dano direto em 2 alvos · `conjuracao` → área · (`evocacao` saiu das escolas de skill no PR9b: é só captura de companheiro) ·
`benca` → cura (ou escudo) · `maldicao` → debuff/maldição. O **elemento** e o **recurso** (`RecursoId`) podem trocar a
família secundária (ex.: água + bênção → cura; sombra + maldição → DoT) — tabela no módulo dono, coberta por teste que
varre todas as escolas × elementos (como o teste de tipo da R8).

---

## 4. Nome do especial (gerado na criação do Soulmon)

- **Entradas:** personalidade (eixos do `soulProfile` — Big Five/HH/junguianos), galho/atributos dominantes, tipo do
  golpe (físico/à distância, `combatFx.ts`), elemento(s) base/par, escola e **recurso** (`RecursoId` da ficha), família
  do efeito (§3).
- **Saída:** `{ nome: {en, pt}, descricao: {en, pt}, familia, forma }` gravado na skill especial da ficha
  (`StageSkill` em `src/utils/soulProfile/ficha/skills.ts` — hoje já tem `nome`/`descricao`/`escolaId`/`recursoId`;
  verificar se o nome atual já é gerado e se é bom o bastante antes de trocar).
- **Determinístico** por seed do Soulmon (mesmo save = mesmo nome), EN primeiro, PT natural (não calco).
- Regras do projeto que mordem aqui: nada de nome de franquia nem sufixo fixo tipo "-mon" (`sprites.dungeonRoster.test`,
  `narrativa.contract.test.ts`, `docs/NARRATIVA-E-UNIVERSO.md` L1–L12 e vocabulário vetado); copy sem cobrança
  (`copy.semFomo`). Considerar IA (`/api/chat`, Groq) só como **opção** com fallback determinístico e higienização —
  a geração tem que funcionar offline e no plano grátis.
- Evolução: o especial muda/fortalece por estágio? (Q6). Renascimento troca escola/elemento → nome novo.
- Onde aparece: selo sobre quem conjura (substitui ou acompanha "ESPECIAL!"), ficha do Pet (habilidades), log do combate.

---

## 5. Mapa do código (pontos de partida — confira por SÍMBOLO, não por linha)

| assunto | onde |
|---|---|
| Stats do jogador hoje | `utils/dungeon.ts` › `PLAYER_STATS`, `playerStatsFor`; `utils/arena.ts` › `getArenaPlayerStats`, `ARENA_HP_SCALE`, `ARENA_FOE_HP_EXTRA` |
| Inimigos | `utils/dungeon.ts` › `TIER_BASE`, `buildDungeonWave`; `utils/arena.ts` › `buildArenaRound`, `ArenaEnemy`; NPCs `utils/tournamentNpcs.ts` (R8) |
| Especiais atuais | `utils/arena.ts` › `SPECIAL_EFFECTS`, `ArenaSpecialEffect` (mult/targets/echo/heal/weaken), `SPECIAL_CHARGE_TURNS` |
| Dano/precisão/crit | `utils/arena.ts` › `playerHitDamage`, `enemyHitDamage`, `CRIT_MULT`, `accuracyScale`, `elementMultiplier`, `ADVANTAGE_MULT/DISADVANTAGE_MULT` (vantagem elemental — decidir se entra como ±1 golpe para manter linear, Q5) |
| Energia/especial/torcida | `utils/energia.ts`; `components/games/TorcidaKit.tsx`, `PveMechanics.tsx` (anel ×0,75/×1/×1,35, esquiva −50%/−85%) |
| Loop de luta | `components/games/usePveBattle.ts` (relógio, `running`, fix A3 da R7), `BattleStage.tsx` (FX, `StageAction.strike`, `SpecialBanner`) |
| Telas | `ArenaGame.tsx`, `DungeonGame.tsx`, `NightmareBattle.tsx`, `DuelScreen.tsx` (fantasma do Torneio) |
| PvP autoritativo | `functions/api/_duel.js` (servidor decide; taps saneados; energia +9/+7/+36) — **paridade obrigatória** com o cliente |
| Tipo do golpe | `utils/combatFx.ts` › `SCHOOL_STRIKE_FORM`, `ELEMENT_STRIKE_FORM`, `SPECIAL_LABEL` |
| Ficha/skills | `utils/soulProfile/ficha/skills.ts` (`StageSkill`, `buildStageSkills`), `realSkillPower.ts`, `buildSheet.ts` |
| Save | `contexts/GameStateContext.tsx`, `functions/api/save.js`, `docs/manual/07-DADOS-E-SAVE.md` |
| Regras escritas | `docs/REGISTRO-DE-DECISOES.md` §20; `docs/manual/02-*` (combate); `GuideModal.tsx`/`HelpModal.tsx` (os números saem das CONSTANTES) |

---

## 6. Fases sugeridas (cada uma = 1 PR mergeado)

1. **Núcleo puro** `src/utils/combate/` (ou `combatStats.ts`): `golpesParaDerrubar`, `intervalo`, crescimento diário,
   boost de evolução, tabela de inimigos; testes com os 4 exemplos do dono como casos literais. Sem UI.
2. **Especiais por família** + simulador de paridade (§3) + tabela escola×elemento×recurso → família. Sem UI.
3. **Save + crescimento**: `combatStats` no GameState/save.js, ganho diário na virada (`computeDailyReset`, função pura),
   boost na cerimônia de evolução; ficha do Pet mostra ATK/DEF/SPD/HP.
4. **Ligar nas 4 lutas + servidor**: trocar `PLAYER_STATS`/`TIER_BASE`/`SPECIAL_EFFECTS` pelo núcleo; `_duel.js` importa
   ou espelha com teste de paridade; manter fix da Arena, torcida, energia, tipo do golpe.
5. **Nome do especial**: gerador determinístico + exibição (selo, ficha, log); passar a ficha ao DuelScreen/Masmorra/
   Pesadelo (hoje eles caem no elemento — pendência da R8).
6. **Docs**: REGISTRO §24 (alternativas que perderam), manual 02/06/07, Guide/Help, `/manter-docs`.

---

## 7. Decisões abertas (perguntar ao dono por modal no início)

- **Q1** Qual atributo recebe o ponto do dia? (a) o do galho dominante do dia (Poder→ATK, Harmonia→SPD,
  Benevolência→DEF, HP por…?) (b) o jogador escolhe (c) rotação/sorteio. E o HP sobe só na evolução?
- **Q2** O ponto vem todo dia aberto, só em dia completo, ou em todo dia com ≥1 tarefa feita? (Lembrar: nunca punir —
  dia ruim não tira ponto.)
- **Q3** Piso de `golpesParaDerrubar` (1? 3?) e teto da diferença de pontos na escada da Masmorra.
- **Q4** Boost de evolução: ×1,5 arredondado para cima/baixo, e em todos os 4 atributos?
- **Q5** Vantagem elemental vira ±1 golpe (linear) ou continua multiplicador (×1,3/×0,8)?
- **Q6** Especial muda de nome/força ao evoluir? Orçamento `E` cresce com o estágio?
- **Q7** Selo na tela: nome próprio do especial no lugar de "ESPECIAL!", ou os dois? E o nome genérico escolhido
  (Especial/Arcano/Despertar/Ápice)?
- **Q8** Nome gerado por regra (determinístico) ou IA com fallback?
- **Q9** Saves existentes: começam 1/1/1/10 + ganhos retroativos pelo histórico (`perfectDays`/galhos) ou do zero?

## 8. Linhas vermelhas (não negociar sem o dono)
- Perder luta **nunca** custa coração; especial/stat nunca vira vantagem paga (Créditos não compram atributo).
- Atributo derivado ≠ atributo persistido em dois lugares. Servidor decide PvP.
- Movimento reduzido reduz o movimento, não a informação. Toda superfície nova nasce muda (R-NOVA, `docs/SOM.md`).
- Sem números de franquia/nomes registrados; EN primeiro.

---

## 9. Revisão pós-Discovery (SQUAD-Alpha, run combate-v3-01, 04/10/2026)

Decisões do dono que **substituem** o texto acima onde conflitarem:
- Q1 galho dominante do dia (Poder→ATK, Harmonia→SPD, Benevolência→DEF); **HP por rodízio: a cada 4º dia que conta**. Q2 gatilho = `dayWasPerfect` na virada (`completeDayReached`), não o delta de `perfectDays`. Glitchtama não dá ponto.
- Q3 **piso de 3 golpes**. Q4 ×1,5 arredondado para cima nos 4 atributos. Q5 vantagem elemental = ±1 golpe.
- §3 régua: **win rate no espelho ±5pp** de cada família contra o dano direto; tempo e HP só informativos. Anel, esquiva e torcida ficam fora da régua (±25%).
- Q8 nome por regra determinística, sem IA. Q9 retroativo por `totalPerfectDays`. Defaults: Q6 `E` constante, nome fixo por estágio; Q7 nome próprio no selo; desempate = mais % de HP, depois seed do servidor.
- **Segurança (S1):** `save.js` e `_duel.js` clampam `combatStats` (finito, piso, teto = base + ganho máx × dias de conta carimbados pelo servidor).

**Ordem nova das fases** (substitui §6): 0) simulação fora do repo com as regras acima → 1) núcleo puro + especiais por família + simulador no repo como teste → 2) motores um por vez: Arena (já tem simulador) → Masmorra/Pesadelo → PvP `_duel.js` por último, com teste de paridade → 3) save + crescimento + clamp no servidor → 4) nome do especial → 5) docs.

## 10. Revisão pós-Prototyper (04/10/2026) — substitui a §9 onde conflitar
- Régua de paridade: **tempo para vencer no espelho ±5%** (win rate sai).
- Curva: `golpes = ceil(HP × (1 + DEF/k) ÷ (1 + ATK/k))`; o HP cresce junto (a cada 4º dia que conta + evolução).
- Energia também por tempo e por dano recebido: **1 especial garantido por luta**.
- Buff SPD mantido (calibrar na Fase 2).
- Q6: **cada estágio gera um especial novo** (nome e efeito). Q7: o selo mostra só o nome próprio.
- **Glitchtama dá ponto.** Invariante: mesmo estágio = mesmo total de pontos ao evoluir. **Empate é resultado válido.**

## 11. Progressão por level (Discovery reaberta, 05/10/2026) — substitui o "1 ponto/dia" das §2.3/§9/§10
- **Soulmon:**
  - XP do dia completo + esforço/meta (nunca contagem), alvo 66/34.
  - Level com teto por estágio derivado de `FORM_REQUIREMENTS.cap` (6/13/21/30/40 acumulado).
  - 1 ponto por level, distribuído em ATK/DEF/SPD pelo galho, com teto de 45% num atributo.
  - **HP sobe automaticamente com o level.**
  - O level desce na degeneração e é exibido com texto neutro.
  - Curva `golpes = HP·(1+DEF/8)/(1+ATK/8)`, fracionária.
- **Usuário:** level = Vínculo. 1 ponto de talento por level. Árvore PvP/PvE/Comércio. Gates por Vínculo. Ver REGISTRO §24.
- **Equipamento:** percentual, moeda ganha jogando. Talento + equipamento ≈5%, também no PvP.
- **Chips:** só distribuição.
- **Ordem dos PRs:** núcleo (curva + level + especiais + simulador vitest) → PvP → save/XP → Vínculo/talentos/gates → equipamento/moeda/Comércio → nome do especial → docs.
