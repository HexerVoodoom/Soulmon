# Nomenclatura dos estágios (registro, 09/11/2026)

O dono fala e escreve **Rookie, Champion, Ultimate, Mega, Ultra** (mais fácil). Tudo que o JOGADOR vê (app, site, vídeos novos, ficha da Play, textos de marketing) usa os **nomes do jogo** (`STAGE_NAMES` em `src/utils/oracle/base.ts`). Vídeos já renderizados ficam como estão; os próximos usam os nomes do jogo.

| Fala do dono / id interno | Nome no jogo (PT) | Nome no jogo (EN) | Ícone (`estagio-branco-*`) |
|---|---|---|---|
| `rookie` | Desperto | Awakened | triângulo cheio |
| `champion` | Ascendente | Ascendant | losango cheio |
| `ultimate` (id da árvore: `perfeito`) | Transcendente | Transcendent | estrela de 4 pontas vazada no meio |
| `mega` | Apoteose | Apotheosis | duas estrelas de 4 pontas, uma girada 45° (8 pontas) |
| `ultra` | Zênite | Zenith | coroa |

- O bebê/ovo não tem ícone.
- Ícones: set `branco` (procedural, 96², alfa real) é o padrão (`ESTAGIO_ICONE_SET` em `src/assets/soulmon/icones-ui/estagio.ts`). O set `creme` fica como alternativa.
- Código novo nunca escreve "Rookie/Champion/Ultimate/Mega" como texto de tela: usar `STAGE_NAMES` (ou `formStageLabel`).
