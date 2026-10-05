# Stories do Builder — run `combate-v3-01`

Cada executor recebe **uma story + `contexto.md`**, nunca o PRD inteiro. Cada PR é mergeado (ff) com CI verde antes do próximo PR dependente (§5).

## Ordem (por risco) e mudança em relação à proposta

| # | Story | Status |
|---|---|---|
| PR1 | `PR1-nucleo.md` | **mergeado** (#221, main 3f73ef78) |
| PR1b | `PR1b-bugs-combate.md` | **próximo**: B1 energia uso único + B2 básico fixo por personagem + N1 nome no selo do pet |
| PR2 | `PR2-xp-level-save.md` | pronto para despacho após PR1 |
| PR3 | `PR3-arena.md` | idem |
| PR4 | `PR4-masmorra-pesadelo.md` | idem |
| PR5 | `PR5-pvp-duel.md` | idem |
| PR6 | `PR6-chips-distribuicao.md` | pergunta §10 antes do merge |
| PR7 | `PR7-vinculo-talentos-gates.md` | idem |
| PR8 | `PR8-equipamento-moeda-comercio.md` | **BLOQUEADO: decisão de lootbox** |
| PR9 | `PR9-nome-especial.md` | paralelizável depois do PR1 |
| PR11 | `PR11-fx-status.md` | tabela + camada após PR1b; ligação por tela fecha após PR5 (Q-FX1 aberta) |
| PR10 | `PR10-docs.md` | por último |

**PR1b (§2.12):** os bugs B1 e B2 vêm antes do PR2. Eles são pequenos, mexem no terreno que PR3/PR4/PR5 vão reescrever e criam o dono único `fighterStrikeForm`. O PR1b também puxa o **N1**, o nome próprio no selo do **pet**, e com isso adianta o critério 4 do PR9 do lado do pet. O PR9 continua com a família por estágio, a `evocacao`, o nome do oponente vindo do servidor e o nome do inimigo.

**Ajuste:** Save + XP do Soulmon sobe de PR5 para **PR2**. Arena, Masmorra e PvP consomem o level. Sem ele primeiro, cada motor criaria um level provisório: duas fontes (footgun 9) e retrabalho em três PRs. Além disso, o clamp S1 do PvP precisa do `_soulXP.js` do servidor. A Arena continua sendo o primeiro **motor**, porque já tem simulador e aceita rng injetado. O PR9 não depende de motor e pode correr em paralelo.

## Grafo de dependências

```
PR1 ─► PR1b ─► PR2 ─► PR3 ─► PR4 ─┐
        │        │      └────────► PR5 ─► PR7 ─► PR8 (BLOQUEADO: lootbox, D1)
        │        └─► PR6           ▲
        │                          └── PR4 (gates de andar)
        ├─► PR9 (paralelo; N1 do pet já no PR1b; telas fecham após PR3/4/5)
        └─► PR11 (tabela+camada; ligação por tela após PR3/4/5)
PR2..PR11 ─► PR10
```

## Pendências do dono que tocam stories
- Lootbox com teto (PR8, bloqueante).
- D1: Bits ganhos × comprados (PR8).
- Se o chip deixar de alimentar `powerPoints`, isso conta como "mudar a economia de galhos" (§10)? (PR6, antes do merge.)
- Reembolso de chips já comprados (PR6).
- Respec de talentos (PR7).
- `ROLE_SHAPE` por escola: sai ou fica (PR3).
- Metas de win rate do mais fraco (§2.10, default 31%/19%).
