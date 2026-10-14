# Guia de consistência — o padrão de 23/09/2026 (Higgsfield)

> **Origem:** as 68 gerações de 23/09/2026 (18:12–23:09 UTC), todas `gpt_image_2`, que o dono aprovou como
> "excelentes" — prédios, mapas, UI e NPCs. Prompts completos: [`PROMPTS-HIGGSFIELD-2026-09-23.md`](PROMPTS-HIGGSFIELD-2026-09-23.md)
> (e `prompts-2026-09-23.json` + as 52 imagens de referência anexadas em
> `E:/Soulmon-assets/higgsfield-banco/_meta/ref-2026-09-23/`). Imagens finais = banco Higgsfield (`BANCO-HIGGSFIELD.md`),
> números #N citados abaixo.
> **Regra:** todo asset novo de prédio, mapa, UI-kit ou NPC deve sair desta receita. Onde a receita contradiz uma
> correção posterior do dono (§6), vale a decisão registrada na §7.

## 1. Receita técnica (igual em todas as 68)

| Família | Modelo / formato | Fundo | Referência anexada |
|---|---|---|---|
| Folha de 3 ou 6 prédios | `gpt_image_2`, 3:2, 2k, high | `transparent` | **1** imagem: a folha anterior (cadeia de iteração, §3) |
| Prédio avulso / prédio vivo | 1:1, 2k, high | `transparent` | **1** imagem: a folha aprovada do lote (ou o prédio-irmão já aprovado) |
| Mapa isométrico (ilha flutuante) | 3:4 (e 9:16 para telefone), 2k, high | opaco (vazio `#08191A`) | **1** imagem: o mapa-mestre aprovado |
| Cena lateral de palco | 3:2, 2k, high | opaco | 1 imagem (cenário do visor) |
| UI kit / ícones / barras | 4:3, 3:2 ou 1:1, 2k, high | `transparent` | **1** imagem: a prancha "SOUL MON UI DESIGN KIT v1.2" |
| NPC busto | **1:1, 2k, high** (o último, 1k/medium) | `transparent` | **nenhuma** (molde de texto) |

Sempre uma referência só, e sempre uma imagem **do próprio projeto**. Lotes saem em sequência: cada geração usa a anterior
aprovada como referência (a folha de prédios passou por 5 gerações: teal → cores distintas → materiais → vivos).
Cada geração produziu 1 imagem.

## 2. Invariantes de estilo (frases que se repetem em quase todos os prompts)

- **Pixel:** "detailed/crisp 16-bit pixel art", "crisp pixel edges, no anti-aliased blur"; câmera "true isometric 2:1", luz do topo-esquerda, mesma escala em todas as peças do lote.
- **Paleta-base (hex):** pedra petróleo `#071413 / #0F2A29 / #163735`; cobre/bronze `#C68642`; cristal/neon turquesa `#5FF3E0`; vazio do mapa `#08191A`/`#0b1a1a`; vinhas verdes pequenas; linhas de circuito gravadas.
- **Assinatura do mundo (em TODA peça):** cristais-alma facetados turquesa com uma chama minúscula dentro + chamas turquesa em braseiros/lanternas.
- **Humor:** "arcane-tech ancient ruins" — ruínas arcano-tecnológicas, escuro e moody, "saturated but not candy".
- **Negativos fixos:** "no ground tile, no text, no letters, no glow haze, no drop shadow outside its base", "fully isolated on a fully transparent background".
- **Variedade dentro da família:** cada prédio de um mesmo lote tem **material próprio + uma cor de acento** (máquina/âmbar, planta/rosa, mineral/vermelho-brasa, etéreo/verde-folha e azul-céu, árvore/violeta) para se distinguirem de relance. O teal fica reservado a cristais e chamas.
- **Prédio vivo (Trent de Legend of Mana):** a estrutura inteira É o ser, com rosto escultural na fachada (olhos como janelas/cristais, boca como porta), "calm sleepy friendly face", **nunca humanoide** (sem braços/pernas), enraizado.
- **Mapa:** ilha flutuante única, "NO buildings, NO characters, NO text, NO UI", bordas escurecendo até o vazio, 6 lotes vazios planos (2×3) ligados por caminhos de circuito + praça central com obelisco-cristal; a versão 9:16 recompõe o mesmo mapa preenchendo o quadro.
- **UI kit:** painéis `#0F2A29`, bordas de cobre com rebites, gemas turquesa de canto, "designed for 9-slice", centros lisos, sem texto; ícones de 12 em grade 4×3, "readable at 24px", máx. 5 cores, sem caixa atrás.
- **NPC (molde fixo do dono):** cabeçalho "Generate an original creature NPC for a monster-raising RPG inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh, Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi, Ragnarok Online and World of Warcraft. Do not copy any existing franchise character." → "Detailed pixel-art CHARACTER PORTRAIT, BUST ONLY … 32-bit era … clean bold BLACK OUTLINES … cel shading 2 to 3 tones" → blocos `CREATURE:` (espécie + elemento com essências) / `PROFESSION:` (adereços que tornam a função inequívoca) / "It belongs to a place that is …" (material da área) / `COLORS:` … "plus small glowing turquoise soul-crystal accents (#5FF3E0) as the shared signature of the world. Do not tint the whole creature in a single hue — use clearly distinct colors."

## 3. Cadeia de iteração dos prédios (como o resultado bom foi construído)

Folha 1 (#768) teal uniforme → recolor com cor própria por prédio (#645) → "NOVOS" com material próprio (#84, #83, #767…) →
**vivos** (#774, #85) → cada prédio vivo gerado **avulso**, 1:1, usando o golem de cristal da arena como referência
(#770, #646, #649, #648, #650, #773). Padrão: folha para explorar → escolher → gerar avulso com a escolhida como âncora.

## 4. Mapa de números (o que existe de 23/09 no banco)

- Folhas de prédios: #768 #84 #769 #645 #83 #767 #642 #80 #771 #775 #81 #772 #774 #85
- Prédios avulsos: #647 #653 #652 #643 #644 #651 · vivos: #770 #646 #649 #648 #650 #773
- Mapas: #194 #206 #204 #201 #197 #209 #208 #207 #212 #198 #196 #195 #199 #200 #203 · cena de palco #202 · 9:16: #193 #76 #210 #211
- UI: #79 #77 #205 #78 #82 #86
- NPCs: #386 #387 #376 #378 #383 #384 #377 #381 #389 #379 #385 #382 #388 #390 #541 #380

## 5. O que a squad tem hoje (auditoria)

- **Agentes de arte** (`.claude/agents/`): `arte-gerador` (famílias cenario/criatura/fx/emblema/marca/hud/loja), `arte-conferente`, `arte-instalador`, mais `soulmon-visual-designer`, `soulmon-design-lead`, `design-critic`, `design-wireframer`. Briefs: `ASSETS-A-GERAR.md` §1 (blocos de estilo), `BRIEF-ARTE-DECORACAO.md`, `E:/Soulmon-assets/out/rodada3/BRIEF-COMUM.md`, `BACKLOG-ARTE-GERAR.md`.
- **Lacunas frente ao padrão de 23/09:**
  1. `ASSETS-A-GERAR.md` §1 tem blocos de **cena / pet-box / sprite** (Gemini, 1080×1920) e **não tem** bloco de prédio isométrico, prédio vivo, mapa isométrico, UI-kit nem NPC busto. O molde de NPC só existe na memória (`npc-molde-e-gpt-image-2-5-flare`).
  2. `arte-gerador` gera por Gemini web ou CLI `higgsfield` e prevê fundo verde `#00FF00` + chroma-key; o padrão de 23/09 usou `gpt_image_2 --background transparent`, e a regra atual é alfa real (`assets-transparencia-real`). Nenhum agente conhece a cadeia "folha → avulso com referência".
  3. Nenhum agente aponta para as **referências anexadas** (prancha de UI v1.2, mapa-mestre, folha de prédios aprovada). Elas só existiam como uploads da conta Higgsfield; agora estão copiadas em `_meta/ref-2026-09-23/referencias/`.
  4. O `arte-conferente` mede alfa/paleta/dimensão, mas não confere **consistência de lote** (mesma câmera 2:1, escala, luz, cristal-assinatura, cor de acento distinta).

## 6. Onde 23/09 CONFLITA com correções do dono de 30/09

A rodada 3 (30/09) registrou "steampunk demais e feliz demais" e proibiu, em NPC/criatura/lote: engrenagem, cano, rebite, cartola, goggles, relógio, arreio/cinto/fivela, penca de bolsinhas, telescópio de latão; exigiu uma cor dominante por criatura, expressão calma, mais dark, **mapas sem robô/maquinário gigante** e pixelização com pós-processo (nearest 1/3–1/4, ≤32 cores).
As peças aprovadas de 23/09 contêm justamente: #378 (castor com goggles, engrenagens, bolsinhas, ábaco), #379 (triceratops com cartola, balança, caixas, engrenagens), #390 (cogumelo ciber com goggles e cinto de ferramentas), #389/#381 (cartola, bolsas), os prédios #653/#646/#651 (canos, engrenagens, vapor, chaminé) e o "mercado mecânico" dos mapas #76/#195.

## 7. Decisão do dono (14/10/2026)

1. **NPCs: 23/09 + vibe de 30/09, sem a regra de "uma cor por criatura".** Molde e traço de 23/09; mantém de 30/09 apenas: sem cartola/goggles/arreio/cinto/fivela/penca de bolsinhas, cobre só como detalhe (1–2 engrenagens discretas), expressão calma. A regra "uma cor dominante por criatura" foi **revogada**.
2. **Pixelização: não.** Peça sai como o gerador entrega (só alfa limpo). O pós-processo nearest/≤32 cores de 30/09 está revogado.
3. **Squad atualizada** (sem commit): famílias `predio`/`mapa`/`ui`/`npc` no `arte-gerador`, checagem de consistência de lote no `arte-conferente`, blocos `[PRÉDIO]`, `[PRÉDIO-VIVO]`, `[MAPA-ISO]`, `[UI-KIT]`, `[NPC-BUSTO]` em `ASSETS-A-GERAR.md` §1, linha no `squad-arte/SKILL.md` e `CORREÇÃO 9` no `BRIEF-COMUM.md`.
4. Prédios, mapas e UI seguem 23/09 integralmente. O UI-kit pixel só vale onde a identidade manda pixel (dentro do visor); botão/nav/ícone de sistema continuam `--sm2-*` + Material.
