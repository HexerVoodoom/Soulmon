# Review: English-first player-visible names (30/09/2026)

Scope: read-only audit after the owner decision "English is the main language, PT-BR is a secondary localization, global audience, including character names". No code was edited. Read first: CLAUDE.md, `NARRATIVA-E-UNIVERSO.md` §12 (vocabulary), `REGISTRO-DE-DECISOES.md` §14 (§14.1 keeps `Soulmon`; §14.4 keeps Serah/Pyraka/Zeed/Glitchtama; §14.5 branches are Power/Harmony/Benevolence).

Criteria: (a) is the EN name natural and pronounceable for English speakers (not a PT word, PT calque, PT-only pun)? (b) should the PT name be identical (proper names) or is the difference justified (common nouns)?

Rule of thumb applied: proper names of characters/NPCs/creatures are IDENTICAL in both languages; common-noun names (items, scenes, dreams) are translated. Verdicts: OK / RENAME EN / IDENTICAL (make PT = EN) / REVIEW (owner call).

Caveat: §14.1 and §14.4 record that the owner kept Serah, Pyraka, Zeed, Glitchtama on 21/09/2026. The owner has now changed the criterion (global audience), so these appear below as "was decided under another criterion" and are not reopened silently; propose only where pronunciation is genuinely the problem.

## 1. Creature lines and pre-made characters
Owner of names: `DUNGEON_LINE_NAMES` (`src/utils/sprites.ts`); `PREMADE_CHARACTERS` (`src/utils/monetization.ts`) and NPC petName (`libraryNpcs.ts`) read from it. Bios are PT/EN and fine.

| id / location | EN now | PT now | Verdict |
|---|---|---|---|
| ignar | Ignar | Ignar | OK |
| lumel | Lumel | Lumel | OK |
| serah | Serah | Serah | OK (decided 14.4) |
| kaelen (Pyraka) | Pyraka | Pyraka | OK; reads "pie-RAH-ka", easy. Decided 14.4 |
| orrin (Akashaoi) | Akashaoi | Akashaoi | RENAME EN+PT: 4 syllables, "-aoi" cluster is hard, and it collides with the realm "Akasha". Propose **Akashai** (or **Ashaoi**) |
| thalindra (Nimbrata) | Nimbrata | Nimbrata | OK |
| igni | Igni | Igni | OK (Latin "fire"; slightly generic, same root as Ignar; acceptable) |
| nautilu | Nautilu | Nautilu | RENAME: reads as a truncated "Nautilus". Propose **Nautil** or **Nauli** |
| astrase | Astrase | Astrase | RENAME: unclear stress ("as-TRAY-zee?"). Propose **Astria** or **Astrys** |
| Zeed (mega-poder prefix) | Zeed | Zeed | OK (14.4) |

Library NPC player names (`libraryNpcs.ts`): Kaelen, Orrin, Thalindra are fantasy-generic and identical in both languages. OK. Note the PET id `kaelen` and NPC display `Kaelen` vs pet `Pyraka` is confusing but internal.

## 2. Area NPCs (`src/utils/areaNpcVoice.ts`)
The pattern is "Name, the role"; role is translated, name must be identical.

| id | EN | PT | Verdict |
|---|---|---|---|
| area NPC | Grom, the merchant | Grom, o mercador | OK |
| area NPC | Vultrak, master of the arena | Vultrak, mestre da arena | OK |
| area NPC | Brisa, the guide | Brisa, a guia | RENAME name (both): "Brisa" is a PT/ES common noun (breeze). Propose **Zeph** or **Breezy** in both languages |
| area NPC | Pipo, the host | Pipo, o anfitrião | OK |
| area NPC | Vesca, the alchemist | Vesca, a alquimista | OK |
| area NPC | Lumi, the host | Lumi, a anfitriã | OK |
| lot NPC | Rhinoco, the champion | Rinoco, o campeão | IDENTICAL: use **Rhinoco** in PT too (PT drops the h for no reason) |
| lot NPC | Fanfa | Fanfa | RENAME: "Fanfa" is short for PT "fanfarra"; EN speakers get no pun. Propose **Fanfare** (same both) or drop the pun |
| lot NPC | Tessela, the puzzler | Tessela, a enigmista | OK (tessella = tile; works in EN) |
| lot NPC | Boio, the bubble-blower | Boio, o soprador de bolhas | RENAME: "boiar" (to float) is a PT-only pun, and "Boio" reads "boy-oh". Propose **Bobbi** / **Bloop** |
| lot NPC | Nino, the courier | Nino, o carteiro | OK |
| lot NPC | Marla, the steward | Marla, a intendente | OK |
| lot NPC | Tico, the keeper | Tico, o cuidador | OK |
| lot NPC | Quill, the scribe | Quill, a escriba | OK. Note: PT keeps an English word as a name; fine |

## 3. Stages, branches, oracle axes
| location | EN | PT | Verdict |
|---|---|---|---|
| `STAGE_NAMES` (oracle.ts) | Awakened / Ascendant / Transcendent / Apotheosis / Zenith | Desperto / Ascendente / Transcendente / Apoteose / Zênite | OK; "Apotheosis" is heavy but consistent |
| forms (`progression.ts`) | Rookie / Champion / Ultimate / Mega / Ultra | same | OK (genre vocabulary, kept) |
| branches (14.5) | Power / Harmony / Benevolence | Poder / Harmonia / Benevolência | OK. "Benevolence" is long but natural |
| lore branch names | Rupture / Braid / Ward | Ruptura / Trama / Guarda | OK |
| elements (`ELEMENT_INFO`) | Water, Fire, Earth, Air, Shadow, Light, Plant, Industrial | Água, Fogo, Terra, Ar, Sombra, Luz, Planta, Industrial | OK |
| roles | Support, Tank, Physical damage, Magic damage, Long range | Suporte, Tanque, Dano físico, Dano mágico, Longo alcance | OK (gamer English) |
| realms | Arid Desert, Stormy Peaks, Deep Ocean, Deadly Swamps, Wild Forest, Rocky Caverns, Frozen Wastes, Serene Meadow, Akasha Realm | Deserto Árido, Picos Tempestuosos, Oceano Profundo, Pântanos Mortais, Floresta Selvagem, Cavernas Rochosas, Desertos Gelados, Campina Serena, Reino de Akasha | OK. "Deadly Swamps" is tonally harsh for a no-punishment app (REVIEW: **Murky Swamps**) |
| schools (ofício) EN | Craft / school names from class-system | Ofício | OK; class titles via `CLASS_TITLE_EN` (79 ids) not audited line by line; spot check: `horologista_do_horror` = "Abomination Weaver" is a loose translation (REVIEW: "Horologist of Horror") |
| passives | Foodie / Cuddly / Stubborn / Lucky / Early Bird | Guloso / Carinhoso / Teimoso / Sortudo / Madrugador | OK. "Stubborn" and "Foodie" have a mild negative/casual tone, but match the PT |
| mood | Rough / Low / Okay / Good / Great | Difícil / Meio pra baixo / Normal / Bem / Ótimo | OK |
| care pattern | Steady / Burst / Balanced | Constante / Explosivo / Equilibrado | OK |

## 4. Creature name generator (visible: every generated pet name is built from these)
`ELEMENT_NAME_STEMS` and `REALM_NAME_STEMS` in `oracle.ts`. Stems that are plain PT/ES words and read as words, not invented names, to English speakers, with proposed neutral replacements:

| stem (bank) | Meaning | Propose |
|---|---|---|
| Chama (fogo) | flame | Emba |
| Brisa (ar) | breeze | Aira |
| Cipo (planta) | vine | Vinea |
| Musgo (planta) | moss | Mossa |
| Cobre, Zinco (industrial) | copper, zinc | Cupra, Zinka |
| Argil, Basal, Monti (terra) | clay-ish, basalt | OK (cognates) |
| Cume, Cerro, Prado, Trigo, Relva, Brejo, Lodra, Bruma, Cerne, Rama, Fronda, Neva, Iglu, Savan, Cacta (realms) | summit, hill, meadow, wheat, lawn, marsh, mud, mist, heartwood, branch, frond, snow, igloo | RENAME each to invented radicals (e.g. Cumo, Cerra, Prati, Trigo->Tryga, Relva->Relva stays acceptable, Brejo->Brego, Bruma->Brume...) |
| Sludge, Gear, Thorn, Skye, Boggu | English | OK |
| Kodama | Japanese | OK (real cultural word, see IP check by ip-brand-guardian) |

Note: the stems bank has an internal rule "sabor do elemento/reino, pronunciável". Suggest applying the rule "no dictionary word in PT" for new stems. Changing a stem changes NAMES GENERATED IN FUTURE only (seeded by hash), and would change the name of already-generated pets if regenerated from seed: check `seed` reproducibility before touching (pets store `baseName`, so existing saves keep their name).

## 5. Shop, decor, backgrounds (`shop.ts`, `backgrounds.ts`)
Almost all are natural. Only PT-flavoured/unnatural ones:

| id | EN now | PT | Verdict |
|---|---|---|---|
| bg-snow | Freezeland | Terra Gelada | RENAME EN: **Frostlands** |
| bg-forest | Native Forest | Floresta Nativa | RENAME EN: "Native" is a calque. **Old-Growth Forest** |
| bg-mission-filecity | File City | Cidade do Arquivo | RENAME EN: **Archive City** |
| bg-gameboy | Retro LCD | LCD Retrô | OK |
| bg-matrix | Green Matrix | Matriz Verde | OK, but "Matrix" is a franchise word (IP note) |
| bg-arena-champion | Champions' Arena | Arena dos Campeões | OK |
| furn-picture | Soulmon Portrait | Quadro do Soulmon | OK |
| furn-garland | Bunting Garland | Varal de Bandeirinhas | REVIEW: **Pennant Bunting** |
| special | Little Heart | Coraçãozinho | OK; emoji 💗 |
| Glitchtama | Glitchtama | Glitchtama | OK, kept (14.4) |
| Bosque/Guild stages | Clearing / Boughs / Canopy / Thicket / Old grove | Clareira / Ramagem / Copa / Mata / Bosque antigo | OK ("Boughs" slightly literary) |
| trophy-concha-mare | Tide shell | Concha da Maré | OK |

All other decor (Pixel Sofa, Armchair, Bookshelf, Lamp, Paw Print Rug, Potted Plant, Campfire, Tent, Mossy Rock, Grass Patch, Packed Sand, Stone Tiles, Wooden Deck, Circuit Mat, Corner Arcade, Bubbling Cauldron, Raw Crystal, Stone Well, Paper Lantern, Glowing Mushrooms, Hourglass, Food Bowl, Little Window, Wind Chime, Wall Clock, Wooden Crate, Simple Shelf, Medal Wall, Trophy Shelf, Podium, Spotlight Arena) and scenes (Bedroom, Night Sky, Pixel Desert, Deep Sea, Lava Mountain, Cherry Blossom, Toy Town, Synthwave, Rainy Attic, Arcade Room, Arcane Library, Stone Shrine, City Rooftop, Sea of Clouds, Observatory, Glowing Swamp, Mount Infinity, Digital Coliseum, Dungeon Abyss, Dino Valley, Digital Aurora): OK.

Dungeon scenes (`dungeonScenes.ts`): Tamagotchi (trademark, IP note), VHS Tape, Neon Sunset, CRT Terminal, Glitch Void, Blue Grotto, Green Cavern, Golden Hall, Violet Abyss, Rose Rift, Sunken Ruin, Soul Forge, Bone Necropolis, Data Core, Shattered Sky, Ruined Hall, Night Arena, Elder Colosseum: all OK. "Tamagotchi" is a registered mark: REVIEW ("Retro Pet" as EN and PT).

## 6. Tiers, missions, seasons, achievements, dreams, games
| location | EN now | PT now | Verdict |
|---|---|---|---|
| tournament tiers | Seedling / Sprout / Guardian / Elder / Legend | Semente / Broto / Guardião / Ancião / Lendário | OK. Note "Sprout" appears also as habit tier and as a season name; not a bug, but three unrelated "Sprout"s |
| missions | First Champion / Mega Legend / Gladiator / Abyss Conqueror / Jurassic Marathoner / Perfect Consistency | Primeiro Campeão / Lenda Mega / Gladiador / Conquistador do Abismo / Maratonista Jurássico / Constância Perfeita | OK except "Perfect Consistency": "perfect" is the word retired for tone (P5, "dia completo"). Propose **Thirty Full Days** (both languages) |
| seasons | Sprout / Ember / Tide / Starlit Season | Estação do Broto / da Fogueira / da Maré / da Constelação | Mismatch: Ember vs Fogueira (bonfire), Starlit vs Constelação. Make PT **Estação da Brasa** and **Estação Estrelada** |
| achievements | First complete day, Sprout, Sapling, Tree, First evolution, Mega form, Ten dungeon runs, Tournament champion, Thirty complete days | PT counterparts | OK. "Sprout — 7-day habit" fine |
| dreams (30) | Napping on a cloud, ... Dreaming inside a snow globe | Cochilando numa nuvem ... | OK all 30; natural EN, idiomatic. "Sunbeam on the floor" vs "quadrado de sol do chão" fine |
| adventure log titles | natural EN | | OK |
| bond rewards | Companion / Confidant / Kindred Spirit / Lifelong Bond | Companheiro / Confidente / Alma Irmã / Vínculo de uma Vida | OK |
| play lots | Dungeon / Game Hall / Mind Workshop / Refuge | Masmorra / Salão de Jogos / Ateliê da Mente / Refúgio | OK; narrative bible prefers "the rifts" in new lore |
| minigames | Dino Runner, Rock · Paper · Scissors, Pet's Echo, Dream Bubbles, Rule Switch, Mesh Picross, Mesh Review | Corrida do Dino, Pedra · Papel · Tesoura, Eco do Pet, Bolhas do Sonho, Troca de Regra, Picross da Malha, Revisão da Malha | "Picross" is a Nintendo trademark (REVIEW: **Mesh Nonogram**, PT "Nonograma da Malha"); "Pet's Echo" -> **Your Soulmon's Echo** optional |
| the Mesh | the Mesh | a Malha | OK |

## 7. Persisted identifiers that are PT words (rename = save migration)
Counts are `grep` hits of the quoted literal in `src functions workers desktop/renderer/src desktop/electron` (.ts/.tsx/.js, tests included); files = distinct files.

| Identifier family | Where persisted | Refs / files | Migration needed? |
|---|---|---|---|
| Element ids `agua fogo terra ar sombra luz planta industrial` | `soulmonMeta.dominantElement` (GameStateContext, saved and cloud-synced); rebirth choice `elemento`; class-system `ClassElementId` shares 6 of them plus `eletricidade arcano vileza morte vida vigor marcial tempo som gravidade espaco` | agua 58/14, fogo 66/14, terra 63/8, ar 52/7, sombra 63/10, luz 82/17, planta 40/5, industrial 30/4 | YES if renamed (pass in `hydrateSave`, cloud adopt, desktop `cloudSync.ts`; also `ELEMENT_INFO`, `essenceLabels.ts BASE_EN`, `derivedElements.ts`, `arena.ts`, `elementIconArt.ts`, `oracle/familias.ts`). Also the class-system snapshot is PT-only and synced by diff; renaming ids forks it. Recommendation: DO NOT rename ids; keep them internal and translate only display (already done) |
| Role ids `suporte tanque fisico magico alcance` | oracle axes (not stored beyond the reading, recomputed) | 15/4, 12/4, 9/3, 11/6, 10/3 | No stored copy found; low risk |
| Alignment ids `poder harmonia benevolencia` | `soulmonMeta.dominantAlignment` in the save; also `NUMBER_ELEMENTS`/prefix tables | 49/8, 51/10, 42/5 | YES. Note the DUPLICATE vocabulary: branch ids are already `power/harmony/benevolence` (14.5), while the oracle alignment ids stay PT. Unifying is a real cleanup; `migrateBranchIds` (`branchMigration.ts`) is the natural home |
| Realm ids `deserto picos oceano pantano floresta cavernas gelo campina akasha` | `soulmonMeta.dominantRealm` | 25/4, 18/4, 22/7, 21/2, 39/5, 28/2, 18/4, 30/4, 20/3 | YES if renamed (same passes as elements) |
| School ids `combate_fisico longo_alcance evocacao conjuracao benca maldicao` | ficha (`Ficha`, `EscolaId`), captured/rebirth | many, class-system engine keys | YES and forks class-system; keep |
| Archetype/essence ids (`fogo_feiticeiro`, `ouro_vivo`...) | `soulmonClassTitles` cache in save | 100+ in `essenceLabels.ts`, class engine | YES; keep |
| Tier ids `semente broto guardiao anciao lendario` | derived from points (not stored as far as found) | 8/5, 5/5, 3/2, 1/1, 3/2 | No |
| Play-area lot ids `masmorra salao mente refugio` | lots/routing; not a save field as far as found | 5/2, 12/6, 19/9, 9/6 | No save migration; mostly code/test churn |
| Achievement id `dias-completos-30` and `conquistasHerdadas` | `conquistasHerdadas` persisted | few | Only if renamed; keep |
| Dream ids, item ids (`furn-*`, `bg-*`), mission ids | persisted (inventory, equippedDecor, dream collection) | already EN | none |
| Rebirth `criatura` etc. | free text | | none |
| Line ids `kaelen orrin thalindra ignar lumel serah igni nautilu astrase` | `demoCharacterId` in save, asset filenames, `LINE` maps | see sprites.ts | Names can change freely; IDS must not (they resolve sprites/drawables). Renaming a display name (e.g. Akashaoi->Akashai) needs NO migration: `DUNGEON_LINE_NAMES` is the single owner; only `sprites.dungeonRoster.test.ts` and any test asserting the old name change |

Summary for identifiers: nothing PT-named is required to rename for the English-first goal, because all of it is internal and display strings already have EN. Renaming element/alignment/realm ids would touch ~15-20 source files, the cloud save schema, the desktop overlay and the PT-only class-system snapshot, and requires an idempotent migration in every entry point (`hydrateSave`, `adoptCloudSave`, `desktop/renderer/src/cloudSync.ts`), plus server-side `functions/api` only if any of these are validated there (grep found none outside a test). Recommend: no rename; if the owner wants unification, do only the alignment ids (`poder/harmonia/benevolencia` -> `power/harmony/benevolence`) because that vocabulary is already duplicated and a migrator exists.

## 8. Doc and tooling impact if names change
- `CLAUDE.md` and `docs/manual` cite Pyraka/Akashaoi/Nimbrata, Igni/Nautilu/Astrase; `sprites.dungeonRoster.test.ts` and `narrativa.contract.test.ts` (EXCECOES) guard the names. The 14.1/14.4 records must get a new decision section ("14.6, 30/09/2026: English-first names") citing this review.
- NARRATIVA bible §12 is PT-first (PT column leads). With English as primary, the column order and the "PT proibido/why" phrasing should be inverted in a later pass.
- Guide/Help modals are PT/EN; no rule text needed for a name change.

## 9. Proposed replacement summary (EN only where genuinely needed)
Akashaoi -> Akashai; Nautilu -> Nautil; Astrase -> Astria; Brisa -> Zeph; Fanfa -> Fanfare; Boio -> Bobbi; Rinoco (PT) -> Rhinoco; Freezeland -> Frostlands; Native Forest -> Old-Growth Forest; File City -> Archive City; Perfect Consistency -> Thirty Full Days; PT "Estação da Fogueira" -> "Estação da Brasa" and "da Constelação" -> "Estrelada"; Mesh Picross -> Mesh Nonogram; Tamagotchi (scene) -> Retro Pet; name-stem swaps in section 4.
