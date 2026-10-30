# Prompts — Velados do onboarding (30/10/2026)

Decisões do dono (30/10): Ordem = nome dos grupos (D22). Ancião e Velado da Mão são
**Remendados**. Lote = onboarding + Guilda (na Guilda, cada Ordem = o **desbravador**, líder do trio; ver `docs/lore/VELADOS-ORDENS.md`). Estilo **fiel às refs** (cobre, rebite,
capuz, máscara, lanterna turquesa) — exceção explícita à regra "arcano, não steampunk",
só para os Velados.

Refs: `E:\Soulmon-assets\entrada-dono\velados-ref\` (`ordem-*.png`, `os-desfeitos.png`,
`rompente-garra.png`). Anexar a folha da Ordem de cada personagem.

Saída: busto quadrado, fundo transparente real (ChatGPT), salvar em
`E:\Soulmon-assets\gerados-2026-10-30\velados\<id>.png`. Instalar depois em
`src/assets/soulmon/npcs/` a 512², igual aos outros NPCs.

## Cabeçalho comum (colar antes de cada bloco)

> Create an original character for a monster-raising RPG. Use the attached concept sheet
> only for this character's faction design language (hood, mask, layered torn cloth,
> aged riveted copper plates, glowing turquoise soul-lantern #5FF3E0); do not copy the
> sheet's text, layout or pose. Detailed pixel-art CHARACTER PORTRAIT, BUST ONLY (head,
> shoulders and upper chest, slight 3/4 view, facing the viewer's left), 32-bit era game
> portrait, cel shading in 2 to 3 tones, crisp dark outline, dramatic rim light. The face
> is always hidden behind the faction mask, with glowing turquoise eyes. No text, no
> logo, no frame, no background scenery. Transparent background. Square 1:1 composition.

## Personagens

| id | Ordem / ref | Bloco específico |
|---|---|---|
| `velado-anciao` | Remendados (`ordem-remendados.png`) | THE ELDER: the oldest of the Patched Ones. A heavy hood of many patched cloths in teal, cream and rust; a weathered cream copper face-plate with a filter disc and a vertical turquoise seam; a long braided grey beard of frayed rope escaping under the mask; a cloak shoulder full of little stitched charms and small copper lanterns. Calm, wise, protective presence; one gloved hand raised open, palm up, as if offering help. |
| `velado-mao` | Remendados | THE HAND: a younger, agile Patched One, a rescuer. Lighter wrapping of patched teal cloth, a slim copper visor helmet with one horizontal turquoise slit; holding up a small round copper lantern-grenade crackling with turquoise light, ready to throw. Determined, alert. |
| `desfeito` | Os Desfeitos (`os-desfeitos.png`) | THE UNDONE: a hooded wraith whose body is dissolving into black-and-turquoise glitch pixels; a black cracked mask with white static where the eyes should be; rusted copper scraps and loose cables hanging from torn black robes; one clawed hand reaching toward the viewer, its fingers breaking into pixels. Menacing, cold, silent. No gore. |
| `desfeito-pesadelo` | Os Desfeitos | THE UNDONE'S NIGHTMARE CREATURE: a corrupted beast companion (not humanoid), a hound-like shadow with a cracked copper skull-mask, glitching pixel mane, turquoise static eyes, black smoke tendrils. Bust only. Menacing. |
| `merc-filtrador` | Filtradores (`ordem-filtradores.png`) | THE FILTERERS' PATHFINDER (trio leader, a cleric-healer who guides): twin round copper gas-filter mask with turquoise lenses, teal hood with cream scarf with leaf runes, a small turquoise healing lantern held close to the chest, soft healing glow on one gloved hand. Steady, kind. Benevolence. |
| `merc-tecelao` | Tecelões (`ordem-teceloes.png`) | THE WEAVERS' PATHFINDER (trio leader, a monk-druid): smooth white porcelain mask with a single turquoise line, cream and teal hood overgrown with vines and small bells, a copper crescent blade on a long chain wrapped over the shoulder, one tiny glowing turquoise fairy beside the head. Calm, grounded. Harmony. |
| `merc-rompente` | Rompentes (`ordem-rompentes.png` + `rompente-garra.png`) | THE BREAKERS' PATHFINDER (trio leader, a heavy two-handed greatsword warrior): tall pointed copper great-helm with a turquoise visor slit, heavy riveted copper pauldrons, torn teal hood, fur collar, a huge cleaver hilt over the shoulder and a caged turquoise lantern on a chain. Fierce, powerful. Power. |

## Poses (só depois do busto aprovado)

Para o quadro a quadro (D23), a partir do busto aprovado como âncora dominante
("recreate this exact character, preserving precisely ... — only the pose changes"):

- `velado-anciao`: neutro · mão estendida · apontando para frente · assustado/protegendo.
- `velado-mao`: lançando a lanterna · olhando para trás.
- `desfeito`: parado · avançando · desfazendo (mais glitch).
