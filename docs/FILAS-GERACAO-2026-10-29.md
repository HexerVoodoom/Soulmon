# Filas de geracao de arte (29/10/2026)

Tres filas prontas para o orquestrador rodar no app do ChatGPT (1 item = 1 conversa nova, anexar `ref`, colar `prompt`, salvar em `out`).
Formato: lista JSON de `{id, ref, prompt, out}`.

| Fila | Arquivo | Itens |
|---|---|---|
| A. FX de ataque faltando | `E:/tmp/fila-fx.json` | **0** (nada falta) |
| B. Cena de combate por elemento | `E:/tmp/fila-elementos.json` | **210** (20 base + 190 derivados) |
| C. Mapas integrados | `E:/tmp/fila-mapas.json` | **8** (mapa geral + 7 areas) |

## A. FX de ataque

Catalogo = `CLASS_ELEMENT_ORDER` (20) + `DERIVED_ELEMENT_PAIRS` (190) = 210 ids. Todos tem as 7 pecas
(`aura, aura-96, cast, defended, impact, orb, slash`) em `src/assets/soulmon/fx-ataque/`. **Fila vazia.**
Ha 20 ids ORFAOS em `fx-ataque/` e `elementos/` que nao existem mais no catalogo (abominacao, ascensao, avatar_de_guerra,
big_bang, chama_demoniaca, ciclo, cyber, eclipse, furacao, maldicao, neutro, nucleo, nulo, paradoxo, pestilencia, primordial,
reencarnacao, selva, sinfonia, sobrecarga); `neutro` ainda e usado por `combatArt`. Nao e falta, so sobra.

Se um elemento novo entrar: 1 folha 3x2 por id; template em `E:/Soulmon-assets/beta3-geradas/fase2-ataques/PROMPTS-FASE2.md`
(`{N}` nome, `{P}` paleta), refs `fase2-ataques/_refs/novo-{fada,industrial,planta}.png` + tira do FX atual do irmao;
salvar em `E:/Soulmon-assets/gerados-2026-10-29/fx-raw/<id>.png`. Fatiar/instalar: `tools/regerar-fx-cortados.py`
(fatia por componente conexo, 118 px em tela 128x128, alfa normalizado; fontes lidas de `.../elementos-novos/_raw/fx-<id>.png`
ou `.../fase2-ataques/_raw/<id>.png` — para a pasta nova, acrescentar o template em `RAWS`) e depois `aura-96` por LANCZOS (Pillow).
Aviso: se a IA devolver xadrez/fundo, pedir de novo; nunca chroma.

## B. Cenas de combate por elemento

Prompt unico parametrizado: camera BAIXA tipo GBA, chao plano livre em (33%,81%) e (70%,39%), sem personagem/texto/UI, topo 10% e base 25% calmos,
identidade Soulmon (cristais turquesa, tecnologia, vida), sem roxo/magenta/engrenagem. Tema base por elemento; derivados = fusao dos dois componentes + nome.
`ref` = `E:/Soulmon-assets/gerados-2026-10-29/combate/bg-<base>.png` (existe para os 17 + neutro; todos conferidos). Base do derivado = 1o componente
(a mesma regra de `combatArt.DERIVED_TO_BASE`). Sem `bg-` proprio: fada -> bg-arcano, industrial -> bg-eletricidade, planta -> bg-vida.
Saida: `E:/Soulmon-assets/gerados-2026-10-29/combate-elementos/<id>.png`. Os 17 `bg-<base>` novos ja sao a cena base: gerar primeiro os base
(itens 1-20) e, se o dono aprovar, usar o resultado como ref dos derivados (trocar `ref`).
Ligacao futura no codigo: `src/utils/combatArt.ts` — `BG` (glob `combate/bg-*.png`) + `combatBaseElement`/`combatSceneBg(id)` colapsam derivado -> base;
para cena por elemento, glob novo `combate/elemento/*.png` consultado ANTES de `combatBaseElement` em `combatSceneBg`, e `BG_MEAN` por id (cor media).
Consumo: `src/components/games/BattleStage.tsx` (e Duel via `combatSceneBg`). 210 PNG ~70 KB cada => ~15 MB: reduzir a 360x640/64 cores como os `bg-*`
e conferir `orcamentoDeBytes.contract.test.ts`.

## C. Mapas integrados

Referencias compostas por `tools/compor-ref-mapa.py` (fundo atual cover 760x1344 + artes dos lotes nas posicoes reais de
`areaSheetCopy.ts`/`playAreaLots.ts`; Mapa geral com `AREA_POS` de `MapPage.tsx`, ancora -78%): `E:/Soulmon-assets/gerados-2026-10-29/ref-mapas/<area>.png`
(+ `mapa.png`). Ja rodado: mercado, jogos, exploracao, arena, hall, laboratorio, forja, mapa. Saida: `.../mapas-integrados/<id>.png`.
Cada prompt traz as posicoes dos predios em % (para manter as areas de toque) e proibe texto/rotulo (as referencias do dono tinham rotulos assados).
Para instalar: `bg-<area>.png` vira a imagem integrada e os `lote-*` sairiam da cena (ou ficam so como alvo de toque invisivel; os `LOT_ART_BOUNDS`/hit rects
seguem validos se as posicoes forem mantidas — se os predios sairem da cena, `AreaScene` precisa de modo "sem sprite").

## Bloqueios / observacoes
- Fila A vazia: nada a gerar.
- `bg-arena.png` atual e 760x1018 (nao 9:16); a ref composta usa cover (corta nas laterais), as posicoes % da Arena foram medidas assim.
- Rotulos dos lotes ficam fora do desenho (sao HTML), entao os predios na ref nao levam texto.
- Python precisa de Pillow no usuario (rodar sem `-I`).
