# Level up do Vínculo — arte OPCIONAL (pacote de geração)

Nenhum PNG está nesta pasta **de propósito**: o `LevelUpOverlay` funciona sem eles (palavra em texto,
luz em canvas, chevron `fx/gain-levelup.png` que já existe). Esta pasta é o DESTINO. O pedido, os
prompts finais e as regras estão em `docs/ASSETS-A-GERAR.md` §16 (ids LU1–LU3). **Bloqueio: crédito do
Higgsfield (dono).** Ninguém gera à mão: o `arte-gerador` (`/squad-arte gerar fx LU1 LU2 LU3`) roda os
prompts da §16 quando houver crédito.

## Destino e mapa

| id | arquivo (nome EXATO) | nativo | slot |
|---|---|---|---|
| LU1 | `src/assets/soulmon/levelup/levelup-banner.png` | 512×128, alfa | `levelUpArt('banner')` |
| LU2 | `src/assets/soulmon/levelup/levelup-burst.png` | 680×680, alfa | `levelUpArt('burst')` |
| LU3 | `src/assets/soulmon/levelup/levelup-frame.png` | 320×128, alfa | `levelUpArt('frame')` |

O mapa é `src/utils/levelUpArt.ts` (`import.meta.glob('../assets/soulmon/levelup/*.png')`, chave =
`levelup-<slot>.png`). **Não há mapa a editar**: o nome certo liga o slot; nome fora do padrão é
ignorado em silêncio. Código só muda se o dono pedir uma 4ª peça.

## Passos do `arte-instalador` (só com `CONFERENCIA.md` aprovada e "sim" do dono)

1. Conferir `git log -1` antes e depois (duas sessões no mesmo checkout).
2. Gerar sobre verde chapado `#00FF00`, recortar por chroma-key (`chroma-key.mjs`), reduzir com
   vizinho-mais-próximo para o tamanho NATIVO da tabela (múltiplo de 0,5× do exibido — nunca 0,75×).
3. Copiar os 3 PNGs para esta pasta com os nomes exatos.
4. Conferir: alfa real (sem xadrez), `r > g+40 && b > g+40` = 0 (sem magenta/roxo/rosa), dimensões
   exatas, palavra `LEVEL UP` legível e grafada certo (LU1), burst simétrico e miolo livre (LU2),
   miolo liso (LU3). Folha de contato no vidro 340² com o sprite a 128 no centro.
5. `npx vitest run src/components/LevelUpOverlay.render.test.tsx` — o teste "sem arte instalada: o
   banner é procedural" passa a ver `data-lvup-banner` (imagem) em vez de `data-lvup-banner-text`;
   ajustar esse teste junto (a condição do teste é "arte ausente", não "arte nunca existe").
6. Atribuição em `docs/Attributions.md` (origem, modelo, prompt, data), `docs/INVENTARIO-ASSETS.md`
   (linha nova), `docs/ASSETS-A-GERAR.md` §16 (marcar ✅), `public/sw.js` `CACHE_VERSION` + 1
   (os PNGs entram no bundle por glob, então o build muda), `/manter-docs auto`.
7. `dist/` é commitado: o build do dono publica.

## Fallback (o que o jogador vê sem arte)

Banner = `LEVEL UP` em Silkscreen dourada; burst = canvas `EvolutionLight`; moldura = nenhuma. Um PNG que
falha ao carregar (`onError`) volta ao procedural sozinho.
