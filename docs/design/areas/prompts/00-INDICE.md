# Prompts Higgsfield das áreas — índice e estimativa de crédito

> **Estado:** rascunho de fila, 29/09/2026. **Nada foi gerado.** Cada arquivo foi escrito em modo só-prompts a partir de
> [`../00-BIBLIA-DAS-AREAS.md`](../00-BIBLIA-DAS-AREAS.md). Contagens de imagens são **estimativas dos redatores** (seeds por ativo),
> não medição: conte de novo no arquivo antes de gastar crédito.

| Área | Arquivo | Ativos | Imagens (est.) | Prioridade 1 |
|---|---|---|---|---|
| Mercado | [mercado.md](mercado.md) | 6 | 20 | `bg-mercado`, `lote-mercado-conquistas` |
| Laboratório | [laboratorio.md](laboratorio.md) | 8 | ~30 | `bg-laboratorio` (não existe hoje), 3 lotes |
| Hall (+ Bosque) | [hall.md](hall.md) | 11 | ~40 | `bg-hall`, `bg-guild-clareira`, `lote-hall-guilda`, Marla |
| Arena (+ Feira) | [arena.md](arena.md) | 23 | ~75 | `bg-arena` refeito, lote da Feira, Fanfa, fenômeno |
| Exploração | [exploracao.md](exploracao.md) | 4 | 18 | `bg-exploracao` sem caveiras |
| Jogos (repintura, só o fundo) | [jogos.md](jogos.md) | 1 | 4 | `bg-jogos` variante B |
| **Total** | | **~53** | **~187** | |

Com retentativas, some ~30% (o teto prático passa de 240 imagens). Total recalculado em 29/09/2026 depois das decisões do dono: Arena +9 ativos e +30 imagens (12 sprites de fenômeno), Jogos cai para só o fundo.

## Ordem de produção sugerida (uso × distinção)

1. **Fundos das áreas** (6): é o que mais faz o jogador saber onde está. Mercado, Laboratório, Hall, Arena, Exploração, Jogos.
2. **Lotes da Guilda** (`lote-hall-guilda`, lote da Feira, `bg-guild-*` ×5): destravam a implementação em curso.
3. **NPCs novos** (Tamba, Musga, Panora, Medra, Fanfa, Trote, Bento): fecham a lacuna de 16 lotes × NPC.
4. **Demais lotes** e FX (`fx-fair-*` ×4).
5. ~~Repinturas opcionais de Jogos~~ (lote PPT, Pipo, zona): **canceladas** pelo dono em 29/09/2026; só o fundo de Jogos entra (passo 1).

## Decisões suas antes de gerar

**Respondidas em 29/09/2026 (modal):**
- ✅ **Jogos:** repintar **só o fundo** (`bg-jogos`, variante B). Lote do PPT, Pipo ("a do Pipo eu gostei, deixa como está") e zona **não** são repintados.
- ✅ **Tom dos cenários do Bosque:** **diurno**, tom do Hall (creme). A âncora do Hall já é diurna (luz de manhã, "night sky" no negative), então `hall.md` não precisou regerar nada.
- ✅ **Fenômeno da Feira:** **um sprite por tipo** (névoa, maré, estática, enxame) × 3 estados = 12 sprites (+9 ativos). `FAIR_ART` precisará de mapa por tipo×estado (código futuro).

**Continuam abertas:**
- **Prompts de NPC à mão** a partir das fichas da bíblia (a regra da squad diz que prompt de criatura do jogador vem do oráculo; NPC de área não passa por ele). Aceita?
- **PI:** `npc-placeholder-poring` leva o nome de criatura de franquia de terceiros ao bundle; sai (ou vira `slime`) quando o Rinoco chegar. Tico virou **Bento** (Tico é personagem registrado em PT-BR).
- **Navegação:** mover o Dino de Exploração para Jogos ficou como decisão de navegação (bíblia §7).

## Depois de gerar

`arte-conferente` confere cada leva (alfa real, paleta sem 270°–340° de matiz, escala de cinza, silhueta), `arte-instalador` instala com `INSTALAR.md`
e sobe `CACHE_VERSION` em `public/sw.js`. Nenhuma arte entra no bundle sem o conferente.
