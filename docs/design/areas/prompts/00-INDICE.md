# Prompts Higgsfield das áreas — índice e estimativa de crédito

> **Estado:** rascunho de fila, 29/09/2026. **Nada foi gerado.** Cada arquivo foi escrito em modo só-prompts a partir de
> [`../00-BIBLIA-DAS-AREAS.md`](../00-BIBLIA-DAS-AREAS.md). Contagens de imagens são **estimativas dos redatores** (seeds por ativo),
> não medição: conte de novo no arquivo antes de gastar crédito.

| Área | Arquivo | Ativos | Imagens (est.) | Prioridade 1 |
|---|---|---|---|---|
| Mercado | [mercado.md](mercado.md) | 6 | 20 | `bg-mercado`, `lote-mercado-conquistas` |
| Laboratório | [laboratorio.md](laboratorio.md) | 8 | ~30 | `bg-laboratorio` (não existe hoje), 3 lotes |
| Hall (+ Bosque) | [hall.md](hall.md) | 11 | ~40 | `bg-hall`, `bg-guild-clareira`, `lote-hall-guilda`, Marla |
| Arena (+ Feira) | [arena.md](arena.md) | 14 | ~45 | `bg-arena` refeito, lote da Feira, Fanfa, fenômeno |
| Exploração | [exploracao.md](exploracao.md) | 4 | 18 | `bg-exploracao` sem caveiras |
| Jogos (repintura) | [jogos.md](jogos.md) | 4 a 8 | 4 (só o fundo) a 20 | `bg-jogos` variante B |
| **Total** | | **~47 a 51** | **~157 (com Jogos só o fundo) a ~173** | |

Com retentativas, some ~30% (o teto prático dos arquivos passa de 200 imagens).

## Ordem de produção sugerida (uso × distinção)

1. **Fundos das áreas** (6): é o que mais faz o jogador saber onde está. Mercado, Laboratório, Hall, Arena, Exploração, Jogos.
2. **Lotes da Guilda** (`lote-hall-guilda`, lote da Feira, `bg-guild-*` ×5): destravam a implementação em curso.
3. **NPCs novos** (Tamba, Musga, Panora, Medra, Fanfa, Trote, Bento): fecham a lacuna de 16 lotes × NPC.
4. **Demais lotes** e FX (`fx-fair-*` ×4).
5. **Repinturas opcionais de Jogos** (lote PPT, Pipo, zona): só se você aprovar.

## Decisões suas antes de gerar

- **Jogos:** repintar só o fundo (rosa e roxo fora da paleta do Visor) ou manter tudo como está? A bíblia recomenda repintar o fundo; lote do PPT, Pipo e zona ficam opcionais.
- **Prompts de NPC à mão** a partir das fichas da bíblia (a regra da squad diz que prompt de criatura do jogador vem do oráculo; NPC de área não passa por ele). Aceita?
- **Tom dos cenários do Bosque:** a âncora do Hall é creme diurno e o palco do pet é escuro; os `bg-guild-*` podem destoar. Diurno ou noturno?
- **Fenômeno da Feira:** um sprite genérico (3 estados) + FX por tipo, ou um sprite por tipo (+9 ativos).
- **PI:** `npc-placeholder-poring` leva o nome de criatura de franquia de terceiros ao bundle; sai (ou vira `slime`) quando o Rinoco chegar. Tico virou **Bento** (Tico é personagem registrado em PT-BR).
- **Navegação:** mover o Dino de Exploração para Jogos ficou como decisão de navegação (bíblia §7).

## Depois de gerar

`arte-conferente` confere cada leva (alfa real, paleta sem 270°–340° de matiz, escala de cinza, silhueta), `arte-instalador` instala com `INSTALAR.md`
e sobe `CACHE_VERSION` em `public/sw.js`. Nenhuma arte entra no bundle sem o conferente.
