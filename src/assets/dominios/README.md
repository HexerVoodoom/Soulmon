# Domínios — arte guardada / Domains — stored art

**EN.** Art for the 17 domains (8 Oracle elements + 9 realms), versioned here with **no consumer yet**: nothing in `src/` imports these files, so Vite does not emit them into `dist` and the byte budget is unchanged. Layout: `<domain>/<type>/<file>.png` with `masmorra` (3 dungeon backgrounds, 608x1080), `praca` (1 plaza background, 608x1080), `predios` (4 lots: shelter, shop, shrine, workshop; 300x300, binary alpha) and `npcs` (4 NPCs, 512x512, binary alpha). Names are stable. Kept at full processed quality (about 114 MB) by the owner's decision of 2026-10-06. Do not import by relative path from the entry chunk; when a consumer exists, load through a lazy `import.meta.glob`.

**PT.** Arte dos 17 domínios (8 elementos do Oráculo + 9 reinos), versionada aqui **sem consumidor ainda**: nada em `src/` importa estes arquivos, então o Vite não os emite no `dist` e o orçamento de bytes não muda. Estrutura: `<dominio>/<tipo>/<arquivo>.png`, com `masmorra` (3 cenários, 608x1080), `praca` (1 cenário, 608x1080), `predios` (4 lotes: abrigo, loja, santuário, oficina; 300x300, alfa binário) e `npcs` (4 NPCs, 512x512, alfa binário). Nomes estáveis. Mantida sem perda de qualidade (cerca de 114 MB) por decisão do dono em 06/10/2026. Quando houver consumidor, carregar por `import.meta.glob` preguiçoso, nunca do chunk de entrada.

## `_npcs-extras/`

**EN.** 10 extra NPCs from the owner (`archive (3).zip`, 2026-10-06), kept for future use. The domain was not clear from style/element, so they sit outside any domain folder, named `npc-extra-<description>.png` (512x512, same processing as the other NPCs). Contact sheet: `E:\tmp\soulmon-assets-check\outros\contato-npcs-novos.png`.

**PT.** 10 NPCs extras do dono (`archive (3).zip`, 06/10/2026), guardados para uso futuro. O domínio não ficou claro pelo estilo/elemento, então ficam fora das pastas de domínio, com nome `npc-extra-<descricao>.png` (512x512, mesmo processamento dos outros NPCs). Mapeamento original → nome:

| hf_* (origem) | arquivo |
|---|---|
| `hf_20261006_075222_3fb32175-1b6b-4e65-8629-914c82eb3cbf.png` | `npc-extra-medusa-pescadora-a.png` |
| `hf_20261006_075232_04c0729a-8dd2-46d6-805c-b63dfcbccdb6.png` | `npc-extra-aranha-fiandeira-a.png` |
| `hf_20261006_075305_609dd3b4-24ef-4f76-999b-2fb6ee60226b.png` | `npc-extra-ferreira-eletrica.png` |
| `hf_20261006_075325_5081015c-794c-4499-b63a-a2f441a4655e.png` | `npc-extra-lanterna-fantasma.png` |
| `hf_20261006_075353_659d2ee4-1b19-4daa-85a3-d470c3e5a621.png` | `npc-extra-dragao-cogumelo.png` |
| `hf_20261006_075724_87fef09d-1afc-459d-ae33-9a8b681f8d29.png` | `npc-extra-medusa-pescadora-b.png` |
| `hf_20261006_075736_e8de5cee-5375-4539-a767-5d2d91ac6062.png` | `npc-extra-ferreira-coelho-robo-a.png` |
| `hf_20261006_075848_e65665f6-6209-45ce-93bb-050c73c23f53.png` | `npc-extra-aranha-fiandeira-b.png` |
| `hf_20261006_080255_dada9ed4-cfeb-4346-b09b-a90859a2572c.png` | `npc-extra-ferreira-coelho-robo-b.png` |
| `hf_20261006_080310_a43b1ff8-84aa-4daf-8e73-a3b09be21714.png` | `npc-extra-filhote-de-mel.png` |
