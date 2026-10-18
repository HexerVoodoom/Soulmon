# Assets de arte faltantes (beta-2): fila priorizada para o SQUAD-ARTE

> 13/10/2026 · alpha-product-designer · só leitura (nenhum código nem imagem tocados).
> Fontes: `docs/ASSETS-A-GERAR.md`, `docs/INVENTARIO-ASSETS.md`, `docs/ARTE-MELHORIAS-FUTURAS.md`,
> `product/beta-play-01/backlog-beta2.md`, `sweeper/design-critic-beta2.md`, `builder/b2-c|b2-d/design-review.md`, grep em `src/`.
> Observação: o `src/` lido é o da árvore de trabalho atual. Parte do beta-2 (frentes B/C/D) vive em branches
> (`feat/b2-*`, PR #323), então o estado foi cruzado com os design-reviews das frentes.

## Resumo (10 linhas)

1. **P1 (bloqueia o beta): 5 itens, cerca de 9 imagens.** São o ícone de fome com 3 estados (o crítico apontou F1: o "⋮" de 4 px fica ilegível), a placa de madeira "In Dungeon" (9-slice), o ícone próprio do PPT, o coração preto (se o filtro CSS não ler) e o material da loja Play (L2/L3, só composição).
2. **P2 (melhora): 9 itens, cerca de 25 imagens.** Lote e busto do prédio Perfil, 5 ícones de atributo e ataque, folha de humor revisada, ícone "Power" da Arena livre, `fx-target-down` e os P0/P1 do Combate v3 (status que colidem a 16 px).
3. **P3 (depois): 10 itens.** Caderno, Ferreiro, os 89 `el-*`, as linhas nautilu/astrase, o pacote LEVEL UP (LU1 e LU3; LU2 descartado) e uma auditoria de emoji em dados.
4. **Em andamento:** as 12 sombras do Pesadelo (`dino-shadow-*`, cerca de 36 gerações). Não entram na conta.
5. **Não precisam de arte:** o timer de energia (texto `xs` com o ícone `energia.png`), o loading (o `ScreenSkeleton` já é minimalista), a mochila (já existe `icones-ui/mochila.png`; o bug é de camada) e o Bond Sanctum (`icon-cat-*` 8/8 já existem e foram ligados na frente D).
6. **Dá para reaproveitar, sem gerar:** a Corrida usa `dino/icone-corrida` (I16, hoje sem chamada) e o "Power" usa `icones-ui/atributo-poder.png`. Isso corta 2 gerações.
7. **Conflito de regra para o dono:** `manual/04` §1 diz "pixel só dentro do visor", mas os ícones de folha e do Game Hall ficam fora dele. O precedente é `icones-ui/` (energia, hp, mochila, atributos, que são pixel e são usados fora do visor). Proponho seguir esse precedente; o dono confirma.
8. **Lacuna de família:** o `arte-gerador` não tem família para ícone de UI. Proponho usar `familia=hud` com o bloco [SPRITE] em folha sobre branco (32²/48², `_fatiar.mjs`), até o dono criar `familia=icone`.
9. **Paleta de todos:** petróleo `#0E2E2E`/`#123232`, ciano `#6EFFFB`, cobre `#C98B4B`/`#8A5A2B`, contorno `#061414`. Nunca magenta, roxo ou rosa. A madeira da placa usa a faixa do cobre e do ocre, não um marrom novo.
10. **Total de geração nova P1+P2: cerca de 34 imagens em cerca de 10 folhas** (as folhas juntam os ícones pequenos), fora as sombras.

## Tabela

Legenda de estado: **emoji** · **placeholder** (arte emprestada/CSS) · **procedural** (desenhado em código) · **inexistente** · **existe** (só ligar/reaproveitar).

| id | onde aparece (arquivo/tela) | estado atual | formato · tamanho · alfa | paleta e regras da família | prio | nº imagens | família arte-gerador |
|---|---|---|---|---|---|---|---|
| **HUNGER-1** ícone de fome, 3 estados (bem alimentado / mediano / faminto) | Home, HUD dentro do cenário, encaixe `statsSlots` (backlog 3.5, crítico F1) | procedural: pontos "⋮" de 4 px, faminto mostra "–" mudo. `fx/anim-hunger-drop` (F6) existe, mas está sem chamada | folha 3×1, 24² exibido (gerar 48², reduzir nearest), alfa binário | [SPRITE] sobre branco. Mesma linha visual de `icones-ui/energia.png` e `hp.png`. Faminto em tinta ouro `#D9A05B` (pedido do crítico), nunca vermelho. **Sujeito:** semente/tigela escura, não gota d'água (a regra F6 proíbe gota). Precisa ler a 24 px em cinza | **P1** | 1 folha (3 peças) | `hud` |
| **DUNGEON-SIGN** placa de madeira "In Dungeon" | Home, timer de retorno da masmorra (backlog 6.2, crítico F2) | placeholder: placa CSS. O texto e o tempo são texto, não arte | 9-slice, 96×48, cantos de 16 px, miolo liso e repetível, alfa (sobre verde `#00FF00`, chroma-key) | Como o H3 (moldura 9-slice): tábua de madeira em ocre e cobre-escuro `#8A5A2B`, prego de cobre `#C98B4B` nos cantos, uma folha de vinha opcional. **Sem texto na arte** (o título "In Dungeon" ou "Back" é DOM, crítico F2). Contorno `#061414` | **P1** | 1 | `hud` |
| **GAMEHALL-PPT** ícone do Pedra-papel-tesoura | Área Jogos, Salão de Jogos, card do PPT (`PlaySheets.tsx`, backlog 9.1) | placeholder: punho reaproveitado (a tesoura saiu a pedido do dono) | 32² exibido (gerar 64²), alfa | [SPRITE]. Mesma família do ícone do Match 3 (que fica). Sugestão: três formas de mão abstratas em leque, ou um losango de três pontas. Não pode ser punho (o punho é do `strike-melee`, regra de um dono por glifo). Legível a 32 px | **P1** | 1 (na folha GAMEHALL) | `hud` |
| **GAMEHALL-CORRIDA** ícone da Corrida com obstáculos | mesmo card (backlog 9.1) | placeholder: bota. **Já existe** `soulmon/dino/icone-corrida` (I16, sem chamada) | 32², alfa | Ligar o existente. Gerar só se o crítico reprovar a 32 px | **P1** | 0 (ou 1) | — (instalador) |
| **HEART-BLACK** coração preto (perdido) | Resumo do dia, folha dos corações (backlog 4.2, b2-c pergunta 3) | procedural: filtro CSS `grayscale(1) brightness(.2)` sobre `hp`; o contorno some sobre `#0f2a2a` | igual a `icones-ui/hp.png`, alfa binário | Reprodução fiel do `hp.png` anexado, com o miolo em `#05080C`, a rachadura em `#123232` e o aro externo de 1 px `#6EFFF8` para separar do fundo. Gerar só se o crítico reprovar o filtro | **P1** (condicional) | 1 | `hud` |
| **LOJA-L2/L3** feature graphic 1024×500 (PT/EN) e og:image 1200×630 | Play Console (ficha) e `public/og-1200x630.png` | inexistente; `og:image` aponta para o favicon | sem alfa. Specs em ASSETS §14.1 | Composição, sem geração. Pixel só dentro do vidro; tagline em Rubik | **P1** se o beta for teste fechado com ficha; senão P2 | 0 geradas (3 composições) | `loja` |
| **PROFILE-LOT** prédio "Perfil do Soulmon" | Laboratório, piso hexagonal de baixo (50%/92%) (backlog 11, b2-d pedido 1) | placeholder: `lote-jogos-mente-akasha.png` | isométrico 300², alfa binário, pós dos `lotes-v2` | Estilo dos lotes do Laboratório (I20). Sugestão: espelho ou atril com retrato e cristal ciano. Contraste sobre `bg-laboratorio` conferido em folha de contato (critério da §16 do Caderno) | P2 | 1 (+2 seeds) | `cenario` |
| **PROFILE-NPC** busto do NPC do Perfil | folha do prédio Perfil (b2-d pedido 2) | placeholder: Oriel (`npc-f-sacerdotisa`) emprestada | 768², alfa binário, pós das I19 (matiz 270–340° travado) | Mesmo pipeline dos `npcs-femininas`. Antes de gerar, o dono decide se o NPC é novo ou se reutiliza um dos 6 de função sem chamada (Ambra/Iris/Faro/Sona/Nuri/Tobi, NPC-1). **Recomendo reutilizar: 0 geração** | P2 | 0 ou 1 | `criatura`* (bustos) |
| **PROFILE-ATTR** atributo principal: Força / Resistência / Agilidade | folha Perfil, carta "Como luta" (backlog 11, b2-d pedido 3) | placeholder: halter, escudo e raio reaproveitados. O raio colide com o glifo de energia (crítico F6) e o escudo com `attr-def` | folha 3×1, 32² exibido (gerar 64²), alfa | [SPRITE]. Silhuetas distintas a 16 px em cinza (regras da medição de 06/10: no máximo 2 tons internos, glifo ocupando ≥70%, aro `#6EFFF8`). Proibido: raio, escudo, punho (cada um já tem dono) | P2 | 1 folha (3) | `hud` |
| **PROFILE-ATK** tipo de ataque: corpo a corpo / à distância | folha Perfil (backlog 11.3; sai da Arena livre) | placeholder: punho e alvo reaproveitados | folha 2×1, 32², alfa | Mesmas regras. Corpo a corpo não pode ser punho (o punho é do `strike-melee`). Sugestão: lâmina curta / arco com seta | P2 | 1 folha (2) | `hud` |
| **PROFILE-ELEM** elemento principal / do especial | folha Perfil | existe: `soulmon/elementos/el-*` (48 recriados) | 32–48² | Ligar. Os 89 `el-*` que faltam estão em P3 | P2 | 0 | — |
| **ARENA-POWER** ícone "Power" na Arena livre | `ArenaGame` / Open Arena (crítico F6) | placeholder: glifo de raio (o mesmo da energia) | existe `icones-ui/atributo-poder.png` | Só ligar | P2 | 0 | — (instalador) |
| **MOOD-2** ícones "How are you today?" (5) | `DailyReportModal` (folha "Hoje"), `assets/icons/mood/mood-{1..5}.png`, `moodArt.ts` (backlog 12) | existe (C6): na main a 24 px; a frente D subiu para 40 px em alvo de 64. Falta validar se ficaram "mais diferenciados" | folha 5×1, 40² exibido (gerar 80²), alfa | Regerar **só se** o teste a 16/40 px em cinza reprovar (SSIM < 0,28 entre vizinhos). Rostos/formas que mudam de silhueta, não só de cor. Sem rótulo fixo na arte (o crítico deu "mood sem rótulos" como ruído) | P2 | 0 ou 1 folha (5) | `hud` |
| **SANCTUM-CAT** ícones de categoria do Bond Sanctum | `TalentTree`/Estatísticas (backlog 10.1) | existe: `soulmon/icons/categories/icon-cat-*.png` (8), ligados na frente D a 24 px | — | Nada a gerar. Aguarda o veredito do crítico sobre a leitura a 24 px | P2 (verificar) | 0 | — |
| **CV3-P0** status `st-buff-atk`, `st-buff-spd`, `st-hot`; selos `soul-lv-badge`, `vinculo-badge`, `talent-respec` | Combate v3: HUD de batalha, Santuário (`ARTE-MELHORIAS-FUTURAS.md` §4–5) | placeholder com defeito: pares se confundem a 16 px (SSIM 0,37–0,56) | 64²/128², alfa (verde + chroma-key) | Prompts prontos no doc (§4). Aro `#6EFFF8`, no máximo 2 tons, glifo ≥70% | P2 | 6 | `hud` |
| **CV3-FX** `fx-target-down` (folha 3×2 de 128) | Combate v3, alvo derrotado | inexistente | 6 quadros de 128², alfa | Fiapos ciano descendo, sem caveira. Não reusar `fx-defeat` | P2 | 1 folha | `fx` |
| **NIGHTMARE-SHADOW** 12 sombras `dino-shadow-*` | `DinoGame` modo Pesadelo (`nightmareShadows.ts`, ASSETS §17) | procedural (o sprite pintado de preto mais os olhos) | 128², alfa binário | §17.2 (corpo `#05080C`, olhos `#A9FBFF`). O prompt de corpo vem do oráculo | **em andamento** | ~36 | `criatura` |
| **CV3-P1/P2** `st-debuff-def`, `tal-pvp-*`, `tal-pve-*`, `tal-com-*`, `eq-nucleo-t1..t3`, `eq-carapaca-*`, `oficio-combate_fisico` | Combate v3 | instaladas com ressalva | 64–96², alfa | Prompts no doc §4 | P3 | ~15 | `hud` |
| **CADERNO-LOT** `lote-exploracao-caderno.png` | Exploração (ASSETS §16) | placeholder: chalé da campina | isométrico 300², alfa | Tons quentes, sem verde ou teal dominante | P3 | 1 | `cenario` |
| **FERREIRO-LOT** `lote-mercado-ferreiro.png` | Mercado (`ARTE-MELHORIAS-FUTURAS` §Ferreiro) | placeholder: `lote-fogo-oficina` | isométrico 300², alfa binário | Prompt pronto no doc | P3 | 1 | `cenario` |
| **ELEM-89** os 89 `el-*` das folhas 4–9 | ícones de elemento (Ficha, Perfil) | placeholder antigo | 48², alfa | Bloqueio de crédito (I27) | P3 | ~6 folhas | `hud` |
| **LINES-NA** `nautilu-*`, `astrase-*` completos (`lines/full/`) | Evolução (sem consumidor ainda) | inexistente | 256², alfa | O prompt vem do oráculo | P3 | ~20 | `criatura` |
| **LEVELUP-LU1/LU3** banner e moldura do número | `LevelUpOverlay` (ASSETS §16 Level up) | procedural (fallback funcionando) | 512×128 / 320×128, alfa | Prompts prontos. **LU2 (burst) descartado:** o backlog 7.2 trocou o sunburst por glow difuso. O dono decide se o banner fica em inglês ("LEVEL UP") ou ganha versão PT | P3 | 2 | `fx` |
| **E1-CHECK** conferir `habit-66` (pode ser a arte do 21 reaproveitada) | Emblemas | existe; `dias-completos-30` já foi trocado (I14) | 64² | Conferir antes de gerar | P3 | 0 ou 1 | `emblema` |
| **EMOJI-DATA** auditoria de emoji em dados | `missions.ts:107` (`🦖`, com `iconName: 'pets'` de fallback), `shop.ts:180/360` (`🪨`, `🦕`), `activityCatalog.ts` (cerca de 30), `attributes.ts` (`👊🎶🤲`), `HelpModal`, `OraclePage`, `SoulmonOnboarding`, `App.tsx` (toasts) | emoji. Parte é chave de mapa de arte (`fxArt`, `itemArt`, `ADVENTURE_ART`: não é visível); parte pode ser visível | — | Antes de gerar: o `alpha-frontend` lista qual emoji **aparece na tela** e o que já tem `iconName` Material de fallback. A diretriz do backlog vale só para "emoji como ícone funcional". O `🦖` da missão contradiz o pedido de tirar o dinossauro (9.1) | P3 (o `🦖` da missão vai para P2) | a definir | `hud` |
| **NÃO-ARTE** timer de energia · loading · mochila | Home (3.4), `ScreenSkeleton` (9.4), `CompanionHUD` (3.2) | — | — | O timer é texto `xs` em tinta do visor ao lado de `energia.png`. O loading já é minimalista (o risco é a altura de 220 para 96 px, P12). A mochila já tem arte; o bug é de camada/z-index | — | 0 | — |

\* Os bustos de NPC (I12/I19/I28) saíram de levas do `rodada3`. Não há família `npc` no `arte-gerador`; o dono indica qual agente usar (o mais próximo é `criatura`, mas a regra "prompt só do oráculo" não vale para NPC).

## Ordem sugerida de lotes (P1 primeiro)

1. **Folha HUD-B2** (`familia=hud`, [SPRITE] sobre branco): HUNGER-1 ×3 + GAMEHALL-PPT + PROFILE-ATTR ×3 + PROFILE-ATK ×2, numa grade de 3×3. Fatiar com `_fatiar.mjs`. É **1 geração para 9 peças**.
2. **DUNGEON-SIGN** (peça única, verde `#00FF00`, chroma-key).
3. **HEART-BLACK** (reprodução fiel do `hp.png`; só se o crítico reprovar o filtro).
4. **LOJA L2/L3** (composição).
5. P2 em seguida: PROFILE-LOT, CV3-P0, CV3-FX, MOOD-2 (condicional).

Para cada lote: `arte-conferente` faz a conferência (alfa real, paleta `r>g+40&&b>g+40 = 0`, leitura a 16/24/32 px em cinza, folha de contato no fundo real) e depois o `arte-instalador` instala (mapa, `CACHE_VERSION`, `vitest`).

## Decisões do dono pendentes

- **D-A:** ícones pixel fora do visor (folhas, Game Hall, Perfil). Seguir o precedente de `icones-ui/` ou usar Material?
- **D-B:** criar `familia=icone` no `arte-gerador`, ou usar `hud` como proposto?
- **D-C:** o busto do Perfil é um NPC novo ou um dos 6 de função sem chamada?
- **D-D:** o beta-2 sai em teste fechado com ficha pública (o que torna L2/L3 P1)?

## Decisões do dono (13/10/2026)
- D-A: ícones novos seguem o estilo pixel da UI (precedente de `icones-ui/`).
- D-B: sem resposta; adotado `familia=hud` até existir `familia=icone`.
- D-C: busto do Perfil reaproveita um dos NPCs de função sem uso.
- D-D: beta-2 sai em teste fechado com ficha pública, então feature graphic e `og:image` são P1.
- D-C (atualizado 14/10): busto do Perfil = nº 50 da folha numerada, `npc-oraculo`. Conferir uso atual do Oráculo antes de instalar (não duplicar rosto sem querer).
- Novo (dono, 14/10): faltam muitos NPCs, inclusive outras versões/poses dos que existem (exemplo: a garça-torre). Levantar quais prédios/telas não têm NPC e quais NPCs precisam de variantes; lote P2 de NPCs.
