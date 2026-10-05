# Arquitetura de camadas (ADR-rascunho) · combate-v3-01 · Discovery reaberta (§2.7)

Status: **rascunho, não aceito**. Autor: alpha-architect. Entradas: `contexto.md` §2.4–§2.7, `dossie-progressao.md`, `benchmark-progressao.md`, `spike-level.md`, `prototyper/_superseded/gate.md`. Código lido: `E:\soulmon-cv3` (`src/types/progression.ts`, `functions/api/_duel.js`, referências do dossiê a `bond.ts`/`_bond.js`).

Princípio: **cada regra tem um dono (um símbolo, um arquivo)**. Nada que seja derivável é persistido (footgun 9; proib. 5 `bondLevel` nunca persistido). Toda função de camada é pura e tem espelho em `functions/api/_*.js` travado por `*.parity.test.js`, no padrão do `bond.parity.test.js`.

## Visão geral (fluxo de dados, só para baixo)

```
fatos persistidos (já existem)          derivado puro (novo)                       consumidor
completions/perfectDays/stage/galho ─► soulXP ─► soulLevel(≤ teto do estágio) ─► pontos ─► distribuição(X_MAX) ─► stats PvE
totalXP (bond) ─────────────────────► bondLevelFor ─► talentos (escolhas persistidas) ─► modificador % PvE
inventário de equipamento (persist.) ─► modificador % (teto escalado) ──────────────────────────► stats PvE
stage ──────────────────────────────► duelStats(stage) fixo ──────────────────────────────────► PvP/Torneio (ignora tudo acima)
```

## Camada 1 · Soulmon: XP → level → pontos → stats

| Regra | Dono proposto | Persistido × derivado |
|---|---|---|
| XP do Soulmon | `src/utils/soulXP.ts` › `soulXP(state)` (+ `_soulXP.js`) | **Derivado** dos fatos que já existem (completions ponderadas por esforço + `perfectDays`). Nenhum campo novo. |
| Teto de level por estágio | `progression.ts` › `levelCapFor(stage)` **derivado de `FORM_REQUIREMENTS`** (ex.: cap acumulado em dias × 1 level/dia → 6/13/21/30/40) | Derivado. Proibido número paralelo (comentário de `FORM_REQUIREMENTS`: "nunca acrescentar um segundo número"). |
| Level | `soulLevel(state) = min(levelFor(soulXP), levelCapFor(stage))` | Derivado. |
| Pontos totais | `statPoints(level)` = 1/level, cada 4º → HP (S-L3) | Derivado. Invariante §2.4: mesmo estágio + mesmo level ⇒ mesmo total, inclusive Glitchtama. |
| Distribuição | `combat/allocate.ts` › `allocate(points, galho, X_MAX=0.45)` | Derivado do galho dominante (já persistido). |
| Curva | `combat/curve.ts` › `golpes = HP·(1+DEF/8)/(1+ATK/8)`, fracionário | Constante única. |

- **Degeneração**: o level **desce** porque é função de `perfectDays` (§2.5 "pontos espelham perfectDays"). Não há XP "guardado" que precise ser reconciliado; recupera ao recuperar. Isso é decisão do dono (abaixo).
- **Paridade**: o servidor nunca recebe `level` nem `stats` do cliente; recalcula de fatos. Teste: `soulXP.parity.test.js`.
- **FATAIS F1**:
  - Dominância: resolvida por `X_MAX=0.45` (spike: pior gap −1,9%; prova de vermelho X=1 → −46,2%).
  - Ponto invisível: pontos crus sobre base do estágio, curva re-escala por estágio; +1 level ≥ +2,4% (folga mínima). **Restrição dura: `levelCapFor` ≤ 10 levels por estágio**; teto maior derruba abaixo de 2%.
  - Estágio longo: o teto de level congela o poder no estágio; dias extras não somam pontos (fecha o +54,3% do d45).
  - DEF puro: 36,2 s no L50 com X=0,45 (< 40 s). **Quem fixa X é a regra dos 40 s**, não o gap.
- **Aberto**: o spike usou tetos 10/20/30/40/50; a derivação de `FORM_REQUIREMENTS` dá outro vetor (ex. 6/13/21/30/40, 6-10 por estágio). Re-rodar `cv3-sim4.mjs` com o vetor derivado. E o **FATAL `direto2` −8,3% no L1** continua aberto e bloqueia o Builder independentemente desta arquitetura.

## Camada 2 · Usuário: Vínculo como level, talentos, gates

- **Decisão proposta: reusar o Vínculo** (`bondLevelFor` em `bond.ts` / `_bond.js`) como o level do usuário. Já é derivado de `totalXP`, nunca persistido, nunca desce, já tem paridade travada e já gateia PvP (5). Um segundo level = footgun 9 (C2).
- Talentos: dono `src/utils/talents.ts` › `talentPointsFor(bondLevel)` (derivado) + **persistido só o vetor de escolhas** `talentPicks: string[]` (validado no servidor contra `talentPointsFor` em `_talents.js`; escolha inválida é descartada, não corrigida). Efeito = **modificador percentual ≤5%, só PvE** (spike: +5% → +5,0% de gap, previsível).
- Gates: dono único `src/utils/gates.ts` › `gateFor(feature, bondLevel)` com a tabela num lugar só; `meetsPvpBond` passa a ser uma entrada dela. Servidor espelha em `community.js` como hoje.
- Conflito declarado: `bond.ts` §6 diz "escada de gates sociais é grind" e invariante 3 diz "recompensas 100% cosméticas, nunca vantagem de combate". **Talento com efeito numérico viola o invariante 3 do Vínculo**. Se o dono aceitar, o invariante é reescrito (não contornado) e o teste `bond.test.ts` muda junto.
- Paridade: `talents.parity.test.js`, `gates.parity.test.js`.

## Camada 3 · Equipamento → moeda

- Dono: `src/utils/equipment.ts` (catálogo + `equipModifier(items, level)`) e `_equipment.js`. **Persistido: posse e slot equipado** (fato de compra). Efeito derivado.
- Forma obrigatória: **percentual, com teto que escala com o level** (spike: +1 ponto plano = +11,1% no L1, estoura). Teto proposto de equipamento+talento somados ≤ 10% do TTK, verificado pelo simulador vitest.
- **Só PvE.** O PvP ignora (camada 4), o que reduz, mas não elimina, o conflito com "Créditos não compram atributo".
- Moeda: Bits ganhos jogando. **Bloqueio**: Créditos→Bits (`BITS_EXCHANGE`) já furam essa linha hoje via `chip-*` (C1). Sem decisão do dono, equipamento herda o mesmo furo.

## Camada 4 · PvP normalizado

- Dono: `functions/api/_duel.js` › `duelStats(profile)` — **já é por estágio fixo** (`STAGE_POWER`, `DUEL_HP_BASE + sp·DUEL_HP_PER_STAGE`). Proposta: PvP/Torneio usam stats do estágio com level = teto e distribuição pelo galho (`allocate` com X_MAX), **sem talento, sem equipamento**. Paridade: servidor autoritativo, cliente só exibe.
- Resolve de graça os conflitos "5% no PvP" e "equipamento comprado no PvP": a vantagem numérica fica estruturalmente fora.
- Custo aceito: o Torneio não premia grind de level dentro do estágio; o diferencial é estágio + build.

## Decisões do dono que bloqueiam (não resolvidas aqui)

| # | Pergunta | Bloqueia |
|---|---|---|
| D1 | Chip de atributo já comprável via Créditos→Bits: manter, remover ou isolar Bits ganhos × comprados? | Camada 3 inteira |
| D2 | Vantagem de ~5% no PvP: aceitar ou PvP normalizado (proposta)? | Camada 2 talentos PvP, camada 4 |
| D3 | Level do Soulmon pode descer com degeneração (consequência de "espelha perfectDays")? Copy `semFomo` | Camada 1 |
| D4 | XP por tarefa: peso de esforço (proib. #16, contagem não), e a divisão 66/34 é meta ou resultado? | `soulXP` |
| D5 | Caminho "Comércio": o que ele toca sem tocar preço/vantagem (Mercado/Guilda)? | Talentos |
| D6 | Renascimento já é Ultra+pago+1 vez: acrescentar level como 3º requisito? | `gates.ts` |
| D7 | Gates em Masmorra/Pesadelo × `bond.ts` §6 ("escada de gates é grind") e "sem gate de entrada" da Masmorra | `gates.ts` |
| D8 | Talento numérico reescreve invariante 3 do Vínculo? | Camada 2 |
| D9 | "X ≤ 45% ainda é build?" (ressalva do spike) | Camada 1 |

## Alternativas consideradas

1. **Segundo level de usuário novo** (separado do Vínculo). Pró: livre do invariante 3. Contra: dois números de level, nova persistência, nova paridade. Rejeitada.
2. **Level do Soulmon persistido como XP acumulado (não desce)**. Pró: sem perda. Contra: quebra "pontos espelham perfectDays" e o invariante de mesmo total por estágio; abre dessincronia. Rejeitada salvo D3.
3. **Equipamento plano em pontos**. Estoura 10% no L1. Rejeitada pelo spike.
4. **PvP com stats reais + talentos ≤5%**. Previsível (+5,0%), mas viola "estratégia só muda playstyle" e importa o furo D1 para o PvP. Rejeitada como default.
5. **Curva aditiva k=20**: fecha só com X=0,40 fracionário, margem mínima (+6,5%). Rejeitada.

## O que reverteria

- Re-spike com `levelCapFor` derivado de `FORM_REQUIREMENTS` der +1 level < 2% ou DEF > 40 s → muda o teto (não a arquitetura).
- `direto2` −8,3% revelar erro no motor e não na régua → todos os números do spike caem; refazer antes de aceitar.
- Dono aceitar 5% no PvP (D2) → camada 4 passa a ler talentos PvP com teto; a separação PvE/PvP vira só um filtro.
- Dono recusar level que desce (D3) → `soulXP` precisa de estado persistido e a alternativa 2 volta à mesa.
