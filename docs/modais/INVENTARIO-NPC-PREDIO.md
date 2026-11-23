# Inventário dos modais de NPC/prédio e prompts de fundo (17/11/2026)

> Etapa 2 do `docs/PLANO-MOLDURAS-MODAIS.md` (estratégia lá; não reaberta). Levantado só lendo código: nada gerado, nada instalado.
> Fontes: `src/navigation.ts`, `src/utils/areaSheetCopy.ts`, `src/utils/playAreaLots.ts`, `src/utils/areaNpcVoice.ts`, `src/assets/soulmon/npcs/index.ts`, `src/components/nav/AreaView.tsx`, `docs/FILA-DE-MODAIS.md`.

## 1. Achado que simplifica a execução

**Todo modal de NPC/prédio passa por UM componente: `src/components/nav/AreaSheet.tsx`**, que recebe `areaId` + `lotId` (hoje pinta `var(--sm2-surface)`). O fundo por prédio e a moldura modular entram num lugar só (mapa `lotId -> arte`, como `LOT_NPC_ART`). Exceção: camadas de tela cheia (seção 4).

## 2. Tabela (30 fundos próprios = 26 lotes do Mapa/seções + 4 telas cheias; mais 1 linha `perfil-generico`, fundo genérico compartilhado)

Chave `área:lote` = a de `LOT_NPC_VOICE`/`LOT_NPC_ART`. **cor-acento** = cor do prédio, somada ao verde-azulado escuro base.

| # | id | prédio (PT / EN) | NPC (PT / EN) | componente | ambiente | cor-acento | fundo existente |
|---|---|---|---|---|---|---|---|
| 1 | `mercado:itens` | Itens / Items | Lamela, a mascate / Lamela, the peddler | `MercadoStallSheet` (stall=itens), `src/components/mercado/MercadoSheets.tsx` | banca de miudezas: frascos, cogumelos secos, cestos | verde-musgo e âmbar | parcial: `bg/dungeon-interior-bazar.png` (9:16), `areas/bg-mercado.png` (9:20) |
| 2 | `mercado:decoracao` | Decoração / Decor | Lasca, a marceneira / Lasca, the carpenter | `MercadoStallSheet` (stall=decoracao), idem | marcenaria: bancada, serragem, painéis de madeira clara | madeira quente e ocre | parcial: `areas/bg-mercado.png` |
| 3 | `mercado:background` | Background / Background | Panora, a sonhadora / Panora, the dreamer | `MercadoStallSheet` (stall=background; abas Backgrounds/Frames), idem | galeria de telas pintadas de horizontes, cheiro de chuva | azul-chuva e lavanda | parcial: `areas/bg-mercado.png` |
| 4 | `mercado:conquistas` | Conquistas / Achievements | Medra, o guardião dos marcos / Medra, keeper of milestones | `ConquistasSheet`, `MercadoSheets.tsx` | pátio de pedra com placas e marcos gravados | cinza-pedra e dourado fosco | parcial: `bg/dungeon-interior-templo.png` (9:16) |
| 5 | `mercado:cambista` | Cambista / Exchanger | Farthing, o cambista / Farthing, the exchanger | `CambistaSheet`, `MercadoSheets.tsx` | balcão de troca: balança, bolsas de moedas, poções | verde-bile e latão | parcial: `areas/bg-mercado.png` |
| 6 | `mercado:restaurante` | Restaurante / Restaurant | Snapjaw, a chef carnívora (Caldo alterna por dia) / Snapjaw, the carnivorous chef (Caldo on alternate days) | `RestauranteSheet`, `src/components/mercado/RestauranteSheet.tsx` | cozinha de taverna: caldeirão, ervas penduradas, lenha | laranja-brasa e verde-erva | parcial: `bg/dungeon-interior-taverna.png` (9:16) |
| 7 | `arena:torneio` | Torneio / Tournament | Vultrak, mestre da arena / Vultrak, master of the arena | `TournamentPage`, `src/components/TournamentPage.tsx` (via `AreaSheet`) | arena antiga de chão batido, arquibancada de pedra | bronze e areia | parcial: `areas/bg-arena.png` (9:20) |
| 8 | `arena:duelo` | Arena livre / Open Arena | Tessaria, a gladiadora / Tessaria, the gladiator | `DueloSheet`, `src/components/arena/DueloSheet.tsx` (o combate é `ArenaGame` em tela cheia) | corredor de entrada da arena: redes, tridentes, areia | azul-aço e areia | parcial: `areas/bg-arena.png` |
| 9 | `arena:guerra` | Guerra de Clãs / Clan War | Mirevesper, a quimera do brejo / Mirevesper, the mire chimera | `GuildSheet` room=guerra, `src/components/guild/GuildSheet.tsx` (+ `GuerraVisor.tsx`) | pântano enevoado com estandartes de clã | verde-pântano e roxo-sombra | parcial: `areas/bg-arena.png` |
| 10 | `exploracao:passeio` | Passeio / Stroll | Lisel, a mariposa do caminho / Lisel, the path moth | `PasseioSheet`, `src/components/play/PasseioSheet.tsx` | trilha na névoa, mariposas, caminho de pedras | verde-névoa e prata | parcial: `areas/bg-exploracao.png` (9:20) |
| 11 | `exploracao:fenda` | Fenda Sem Fim / Endless Rift | Zeph, a guia / Zeph, the guide | `MasmorraSheet` (`PlaySheets.tsx`); a descida (`DungeonGame`) é tela cheia | borda de uma fenda profunda, névoa subindo | índigo e roxo-profundo | parcial: `areas/bg-exploracao.png` |
| 12 | `exploracao:dungeon` | Calabouço / Dungeon | Corva, a vigia do calabouço / Corva, the dungeon watcher | `RogueDungeonPlaceholder` (folha só sem incursão); com incursão é `RogueKeyGate`/`RogueDungeon` em tela cheia | entrada de calabouço de pedra, tochas apagadas | cinza-ardósia e vermelho-ferrugem | parcial: `bg/calabouco-mapa.png`, `areas/bg-exploracao.png` |
| 13 | `forja:ferreiro` | Soulsmith / Soulsmith | Vitra, a Soulsmith / Vitra, the Soulsmith | `SoulsmithSheet`, `src/components/SoulsmithSheet.tsx` (o mapa abre `ForgeCard` em tela cheia) | forja de vidro: forno aceso, bigorna, vidro soprado | laranja-brasa e vidro-âmbar | parcial: `bg/dungeon-interior-forja.png` (9:16), `areas/bg-forja.png` (9:20) |
| 14 | `forja:hexsmith` | Hexsmith / Hexsmith | Hexsmith / Hexsmith | `HexsmithSheet`, `src/components/hex/HexsmithSheet.tsx` | bancada de circuitos hex e poções de elemento | verde-circuito e cobre | parcial: `areas/bg-forja.png` |
| 15 | `forja:oficina` | Oficina do Foco / Focus Workshop | Sépia, a copista / Sépia, the scribe | `FocusBoard`, `src/components/play/FocusBoard.tsx` | escritório de copista: pergaminhos, tinta, luz de vela | sépia e âmbar-vela | parcial: `areas/bg-forja.png` |
| 16 | `forja:caderno` | Caderno / Journal | Trilho, o maquinista dos croquis / Trilho, the sketching engineer | `CadernoSheet`, `src/components/play/CadernoSheet.tsx` | vagão de trem fantasma, croquis de paisagens na parede | azul-fumaça e papel | parcial: `areas/bg-forja.png` |
| 17 | `forja:refugio` | Refúgio / Refuge | Yuzu, a guardiã da fonte / Yuzu, the spring warden | `RefugioSheet` (`PlaySheets.tsx`) | fonte termal, vapor, pedras lisas, cítricos | rosa-pêssego e verde-água | parcial: `areas/bg-forja.png` |
| 18 | `jogos:salao` | Salão de Jogos / Game Hall | Pipo, o anfitrião / Pipo, the host | `SalaoSheet` (`PlaySheets.tsx`) | salão festivo: fitas, bilhetes, mesas de jogo | magenta-vinho e dourado | parcial: `areas/bg-jogos.png` (9:20) |
| 19 | `jogos:mente` | Ateliê da Mente / Mind Workshop | Tessela, a enigmista / Tessela, the puzzler | `MenteSheet` (`PlaySheets.tsx`) | ateliê de quebra-cabeças: peças de mosaico, runas fracas | azul-tinta e roxo-runa | parcial: `areas/bg-jogos.png` |
| 20 | `laboratorio:evolucao` | Centro de Evolução / Evolution Center | Vesca, a alquimista / Vesca, the alchemist | `labContent` (labTab=evolution) em `src/App.tsx`, `EvolutionPath` (via `AreaSheet`) | laboratório em casa-na-árvore encantada, frascos | verde-folha e dourado suave | parcial: `areas/bg-laboratorio.png` (9:20), `bg/dungeon-interior-laboratorio-estufa.png` |
| 21 | `laboratorio:stats` | Vínculo / Bond | Sumi, o guardião do Vínculo / Sumi, keeper of the Bond | `labContent` (labTab=stats) em `src/App.tsx`, `StatsPage` | santuário de água com carpas, pedra e lanternas | azul-lago e prata | parcial: `areas/bg-laboratorio.png` |
| 22 | `laboratorio:perfil` | Perfil / Profile | Soulmon misterioso (o Corvo) / Mysterious Soulmon (the Raven) | `labContent` (labTab=perfil) em `src/App.tsx`, `PetPage` | saleta de espelho e galhos, luz azul de fim de tarde | azul-crepúsculo e preto-corvo | parcial: `areas/bg-laboratorio.png` |
| 23 | `laboratorio:biblioteca` | Drive (Biblioteca) / Drive (Library) | Glifa, a arquivista / Glifa, the archivist | `LibraryPage` via `hallContent('directory')`, `src/components/LibraryPage.tsx` | biblioteca de mariposas: estantes altas, páginas soltas, pó de luz | castanho-papel e turquesa-escuro | parcial: `bg/dungeon-interior-biblioteca.png` (9:16) |
| 24 | `laboratorio:pet` | Arquivo (seção do Perfil) / Archive (Profile section) | Tinta, a escriba do Arquivo / Tinta, scribe of the Archive | seção `pet` dentro do lote `perfil` (`SectionTabs` em `AreaView.tsx`; `PetPage`) | mesa de escriba: fichas, tinta, gaveteiros | tinta-azul e papel | nenhum próprio; herdar o de `laboratorio:perfil` se não houver variante |
| 25 | `laboratorio:amigos` | Círculo de Amigos (seção do Salão do Clã) / Friends Circle (Clan Hall section) | Zumi, o filhote de mel / Zumi, the honey cub | seção `friends` dentro do lote `hall:guilda` (`hallContent('friends')`) | clareira com favos de mel e almofadas, luz dourada | mel-dourado e verde-campina | nenhum próprio; herdar o de `hall:guilda` se não houver variante |
| 26 | `hall:feira` | Feira / Fair | Fanfare / Fanfare | `GuildSheet` room=feira (`FeiraVisor.tsx`; eventos em `FeiraEventoSheet`/`FeiraLojaSheet`) | feira noturna: barracas, lanternas de papel, sanfona | vermelho-feira e dourado | parcial: `areas/bg-hall.png` (9:20) |
| 27 | `hall:grove` | Grove / Grove | Lilia, a musa do jardim / Lilia, the garden muse | `GuildSheet` room=grove (`GroveVisor.tsx`) | pavilhão de cristal em volta de uma árvore jovem | verde-bosque e turquesa-escuro | parcial: `areas/bg-hall.png` |
| 28 | `hall:guilda` | Clan Hall (Salão do Clã) / Clan Hall | Aurea, a sacerdotisa do Salão / Aurea, priestess of the Hall | `GuildSheet` room=salao (`GuildSheet.tsx`, seções Clã/Amigos) | salão de pedra clara com colunas e luz solar | dourado-sol e pedra clara | parcial: `areas/bg-hall.png`, `bg/dungeon-interior-templo.png` |
| 29 | `tela:fenda` | Fenda Sem Fim / Endless Rift (tela cheia) | sem NPC | `DungeonGame` (`src/components/DungeonGame.tsx`, `gameName` Fenda Sem Fim) | fenda arcana de pedra e cristal, descida sem fim | turquesa-fenda e preto-pedra | nenhum; `bg/dungeon-interior-*.png` só recorte de emergência |
| 30 | `tela:calabouco` | Calabouço / Dungeon (tela cheia) | sem NPC | `RogueDungeon` (`src/components/RogueDungeon.tsx`; combate em `RogueFight.tsx`) | corredor de masmorra de pedra úmida, tochas baixas | cinza-pedra e âmbar-tocha | nenhum |
| 31 | `tela:soulsmith-mapa` | Mapa do Soulsmith / Soulsmith map (tela cheia) | sem NPC | `ForgeCard` view=`map` (`src/components/ForgeCard.tsx`) | mesa de cartógrafo da forja, pergaminho, brasas fracas | cobre-brasa e pergaminho | nenhum |
| 32 | `tela:arena-livre` | Arena livre / Free Arena (tela cheia) | sem NPC | `ArenaGame` (`src/components/ArenaGame.tsx`) | arena de pedra a céu aberto ao entardecer | vermelho-arena e areia | nenhum |
| 33 | `perfil-generico` | Perfil (fundo genérico) / Profile (generic backdrop) | Soulmon misterioso (o Corvo), sem criatura nomeada | `labContent` (labTab=perfil) em `src/App.tsx`, `PetPage` | névoa escura com malha digital e galhos ao fundo | azul-crepúsculo e turquesa | `areas/bg-laboratorio.png` provisório |

**"Fundo existente":** não existe NENHUM fundo de modal por prédio (em `E:\Soulmon-assets` só há `modais-moldura/` com a referência e o kit em preparo). Existem (a) o fundo da ÁREA em `src/assets/soulmon/areas/bg-<area>.png`, já em ~9:20 (741x1648, 721x1603, 821x1826, 641x1425, 841x1870), que serve de plano provisório se desfocado a 10-18% de opacidade; (b) `bg/dungeon-interior-*.png` (608x1080, 9:16), cenários de combate, só recorte de emergência. **Nada é por prédio**; o plano (1 fundo por NPC/prédio) exige arte nova, e os existentes são rede de segurança para a amostra.

### Aliases de área (sem linha própria)
Os 7 anfitriões de área (`AREA_NPC_VOICE`: Grom, Vultrak, Zeph, Vitra, Pipo, Vesca, Lumi) só aparecem quando o lote não tem entrada própria; desde H11 (02/10/2026) todo lote tem. Logo não há fundo por área: `arena:torneio` = Vultrak, `exploracao:fenda` = Zeph, `jogos:salao` = Pipo, `laboratorio:evolucao` = Vesca, `forja:ferreiro` = Vitra; Grom (anfitrião do Mercado) ficou sem lote.

## 3. Prompts por linha (EN)

Modelo do plano + **ajuste do dono (17/11/2026): malha digital muito tênue** (linhas de circuito/grade, brilho turquesa fraco, integrada ao ambiente) em TODOS os prompts, além do acento Soulmon sutil (`one tiny dark-turquoise crystal glint`, só em 11 dos 26 modais, e nas telas cheias só onde indicado, nunca em todas). Sem engrenagem. Anexar como referência o print do Mind Workshop e `referencias-identidade/02-fundo-moldura-vertical-cristais.png`. ChatGPT, 1 conversa por imagem, arquivo opaco (a opacidade 10-18% é do CSS; a malha tem que continuar discreta mesmo a 100%).

**1. `mercado:itens` (Items / Lamela)**

> Soft, dim, out-of-focus background plate of a cozy peddler's stall with hanging dried mushrooms, small jars and woven baskets, vertical 9:20, very low contrast, dark teal and moss green and amber palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-mercado-itens.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `items`, `lamela`, `bg-modal`, `mercado`, `itens`, `malha-digital`

**2. `mercado:decoracao` (Decor / Lasca)**

> Soft, dim, out-of-focus background plate of a tidy carpenter's workshop with a workbench, wood shavings and stacked planks, vertical 9:20, very low contrast, dark teal and warm wood and ochre palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-mercado-decoracao.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `decor`, `lasca`, `bg-modal`, `mercado`, `decoracao`, `malha-digital`

**3. `mercado:background` (Background / Panora)**

> Soft, dim, out-of-focus background plate of a quiet gallery of blank canvases leaning on easels, soft rainy light through a window, vertical 9:20, very low contrast, dark teal and rain blue and lavender palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-mercado-background.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `background`, `panora`, `bg-modal`, `mercado`, `background`, `malha-digital`

**4. `mercado:conquistas` (Achievements / Medra)**

> Soft, dim, out-of-focus background plate of an old stone courtyard with weathered milestone plaques and worn steps, vertical 9:20, very low contrast, dark teal and stone grey and muted gold palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-mercado-conquistas.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `achievements`, `medra`, `bg-modal`, `mercado`, `conquistas`, `malha-digital`

**5. `mercado:cambista` (Exchanger / Farthing)**

> Soft, dim, out-of-focus background plate of a small money-changer's counter with a brass scale, coin pouches and potion vials, vertical 9:20, very low contrast, dark teal and bile green and brass palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-mercado-cambista.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `exchanger`, `farthing`, `bg-modal`, `mercado`, `cambista`, `malha-digital`

**6. `mercado:restaurante` (Restaurant / Snapjaw)**

> Soft, dim, out-of-focus background plate of a warm tavern kitchen with a bubbling cauldron, hanging herbs and a glowing hearth, vertical 9:20, very low contrast, dark teal and ember orange and herb green palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-mercado-restaurante.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `restaurant`, `snapjaw`, `bg-modal`, `mercado`, `restaurante`, `malha-digital`

**7. `arena:torneio` (Tournament / Vultrak)**

> Soft, dim, out-of-focus background plate of an ancient packed-earth arena with weathered stone stands and long shadows, vertical 9:20, very low contrast, dark teal and bronze and sand palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-arena-torneio.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `tournament`, `vultrak`, `bg-modal`, `arena`, `torneio`, `malha-digital`

**8. `arena:duelo` (Open Arena / Tessaria)**

> Soft, dim, out-of-focus background plate of an arena gate corridor with hanging nets, racked tridents and sand-dusted flagstones, vertical 9:20, very low contrast, dark teal and steel blue and sand palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-arena-duelo.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `open arena`, `tessaria`, `bg-modal`, `arena`, `duelo`, `malha-digital`

**9. `arena:guerra` (Clan War / Mirevesper)**

> Soft, dim, out-of-focus background plate of a misty marsh edge with faded clan banners on leaning poles, vertical 9:20, very low contrast, dark teal and swamp green and shadow violet palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-arena-guerra.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `clan war`, `mirevesper`, `bg-modal`, `arena`, `guerra`, `malha-digital`

**10. `exploracao:passeio` (Stroll / Lisel)**

> Soft, dim, out-of-focus background plate of a winding forest trail dissolving into soft mist, faint moth silhouettes far away, vertical 9:20, very low contrast, dark teal and mist green and silver palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-exploracao-passeio.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `stroll`, `lisel`, `bg-modal`, `exploracao`, `passeio`, `malha-digital`

**11. `exploracao:fenda` (Endless Rift / Zeph)**

> Soft, dim, out-of-focus background plate of the lip of a bottomless rift with rising mist and distant floating stones, vertical 9:20, very low contrast, dark teal and indigo and deep violet palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-exploracao-fenda.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `endless rift`, `zeph`, `bg-modal`, `exploracao`, `fenda`, `malha-digital`

**12. `exploracao:dungeon` (Dungeon / Corva)**

> Soft, dim, out-of-focus background plate of a stone dungeon entrance with cold unlit torches and worn steps descending, vertical 9:20, very low contrast, dark teal and slate grey and rust red palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-exploracao-dungeon.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `dungeon`, `corva`, `bg-modal`, `exploracao`, `dungeon`, `malha-digital`

**13. `forja:ferreiro` (Soulsmith / Vitra)**

> Soft, dim, out-of-focus background plate of a glassblower's forge with a softly glowing furnace, an anvil and cooling glass shapes, vertical 9:20, very low contrast, dark teal and ember orange and amber glass palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-forja-ferreiro.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `soulsmith`, `vitra`, `bg-modal`, `forja`, `ferreiro`, `malha-digital`

**14. `forja:hexsmith` (Hexsmith / Hexsmith)**

> Soft, dim, out-of-focus background plate of a tinkerer's bench with potion vials and hex-grid circuit etchings on the wall, vertical 9:20, very low contrast, dark teal and circuit green and copper palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-forja-hexsmith.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `hexsmith`, `hexsmith`, `bg-modal`, `forja`, `hexsmith`, `malha-digital`

**15. `forja:oficina` (Focus Workshop / Sépia)**

> Soft, dim, out-of-focus background plate of a scribe's quiet desk with parchment rolls, an inkwell and warm candle glow, vertical 9:20, very low contrast, dark teal and sepia and candle amber palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-forja-oficina.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `focus workshop`, `sépia`, `bg-modal`, `forja`, `oficina`, `malha-digital`

**16. `forja:caderno` (Journal / Trilho)**

> Soft, dim, out-of-focus background plate of a ghostly train carriage interior with pinned landscape sketches and a rainy window, vertical 9:20, very low contrast, dark teal and smoke blue and paper cream palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-forja-caderno.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `journal`, `trilho`, `bg-modal`, `forja`, `caderno`, `malha-digital`

**17. `forja:refugio` (Refuge / Yuzu)**

> Soft, dim, out-of-focus background plate of a quiet hot spring with drifting steam, smooth stones and floating citrus peels, vertical 9:20, very low contrast, dark teal and peach pink and aqua green palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-forja-refugio.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `refuge`, `yuzu`, `bg-modal`, `forja`, `refugio`, `malha-digital`

**18. `jogos:salao` (Game Hall / Pipo)**

> Soft, dim, out-of-focus background plate of a festive game hall with draped ribbons, small lanterns and empty play tables, vertical 9:20, very low contrast, dark teal and wine magenta and gold palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-jogos-salao.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `game hall`, `pipo`, `bg-modal`, `jogos`, `salao`, `malha-digital`

**19. `jogos:mente` (Mind Workshop / Tessela)**

> Soft, dim, out-of-focus background plate of a puzzler's atelier with scattered mosaic tiles and faintly glowing rune stones, vertical 9:20, very low contrast, dark teal and ink blue and rune violet palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-jogos-mente.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `mind workshop`, `tessela`, `bg-modal`, `jogos`, `mente`, `malha-digital`

**20. `laboratorio:evolucao` (Evolution Center / Vesca)**

> Soft, dim, out-of-focus background plate of an enchanted treehouse alchemy lab with glass flasks, hanging vines and warm lamplight, vertical 9:20, very low contrast, dark teal and leaf green and soft gold palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-laboratorio-evolucao.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `evolution center`, `vesca`, `bg-modal`, `laboratorio`, `evolucao`, `malha-digital`

**21. `laboratorio:stats` (Bond / Sumi)**

> Soft, dim, out-of-focus background plate of a still sanctuary pool with faint koi shapes, smooth stones and paper lanterns, vertical 9:20, very low contrast, dark teal and lake blue and silver palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-laboratorio-stats.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `bond`, `sumi`, `bg-modal`, `laboratorio`, `stats`, `malha-digital`

**22. `laboratorio:perfil` (Profile / Mysterious Soulmon)**

> Soft, dim, out-of-focus background plate of a small dusk chamber with a standing mirror, bare branches and soft blue light, vertical 9:20, very low contrast, dark teal and dusk blue and raven black palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-laboratorio-perfil.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `profile`, `mysterious soulmon`, `bg-modal`, `laboratorio`, `perfil`, `malha-digital`

**23. `laboratorio:biblioteca` (Drive (Library) / Glifa)**

> Soft, dim, out-of-focus background plate of a tall archive of shelves with drifting loose pages and slow dust motes in lamplight, vertical 9:20, very low contrast, dark teal and paper brown and dark turquoise palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-laboratorio-biblioteca.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `drive`, `glifa`, `bg-modal`, `laboratorio`, `biblioteca`, `malha-digital`

**24. `laboratorio:pet` (Archive (Profile section) / Tinta)**

> Soft, dim, out-of-focus background plate of a scribe's index room with small drawers, loose cards and a pooled inkwell, vertical 9:20, very low contrast, dark teal and ink blue and paper palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-laboratorio-pet.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `archive`, `tinta`, `bg-modal`, `laboratorio`, `pet`, `malha-digital`

**25. `laboratorio:amigos` (Friends Circle (Clan Hall section) / Zumi)**

> Soft, dim, out-of-focus background plate of a sunlit clearing with honeycomb lanterns and soft cushions in the grass, vertical 9:20, very low contrast, dark teal and honey gold and meadow green palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-laboratorio-amigos.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `friends circle`, `zumi`, `bg-modal`, `laboratorio`, `amigos`, `malha-digital`

**26. `hall:feira` (Fair / Fanfare)**

> Soft, dim, out-of-focus background plate of a quiet night fair with closed striped stalls and strings of paper lanterns, vertical 9:20, very low contrast, dark teal and carnival red and gold palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-hall-feira.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `fair`, `fanfare`, `bg-modal`, `hall`, `feira`, `malha-digital`

**27. `hall:grove` (Grove / Lilia)**

> Soft, dim, out-of-focus background plate of a crystal pavilion around a young tree, with soft leaf light and a few quiet fireflies, vertical 9:20, very low contrast, dark teal and grove green and dark turquoise palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-hall-grove.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `grove`, `lilia`, `bg-modal`, `hall`, `grove`, `malha-digital`

**28. `hall:guilda` (Clan Hall / Aurea)**

> Soft, dim, out-of-focus background plate of a hall of pale stone columns with a long beam of soft sunlight on the floor, vertical 9:20, very low contrast, dark teal and sun gold and pale stone palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-hall-guilda.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `clan hall`, `aurea`, `bg-modal`, `hall`, `guilda`, `malha-digital`

**29. `tela:fenda` (Endless Rift, full screen)**

> Soft, dim, out-of-focus background plate of an arcane rift of dark stone and crystal descending into a faint glow, vertical 9:20, very low contrast, dark teal and stone black and dark turquoise palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-tela-fenda.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `fenda`, `endless rift`, `bg-modal`, `tela-cheia`, `malha-digital`

**30. `tela:calabouco` (Dungeon, full screen)**

> Soft, dim, out-of-focus background plate of a damp stone dungeon corridor with low torchlight and worn flagstones, vertical 9:20, very low contrast, dark teal and stone grey and amber palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-tela-calabouco.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `calabouco`, `dungeon`, `bg-modal`, `tela-cheia`, `malha-digital`

**31. `tela:soulsmith-mapa` (Soulsmith map, full screen)**

> Soft, dim, out-of-focus background plate of a forge cartographer's table with parchment and faint embers, vertical 9:20, very low contrast, dark teal and copper and parchment palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-tela-soulsmith-mapa.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `soulsmith`, `mapa`, `bg-modal`, `tela-cheia`, `malha-digital`

**32. `tela:arena-livre` (Free Arena, full screen)**

> Soft, dim, out-of-focus background plate of an open stone arena at dusk with sand floor and distant banners, vertical 9:20, very low contrast, dark teal and arena red and sand palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-tela-arena-livre.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `arena livre`, `arena`, `bg-modal`, `tela-cheia`, `malha-digital`

**33. `perfil-generico` (Profile generic backdrop)**

> Soft, dim, out-of-focus background plate of a dark misty void with faint branches and a soft digital mesh, vertical 9:20, very low contrast, dark teal and twilight blue and dark turquoise palette, subtle depth, a very faint digital mesh of thin circuit lines and grid with weak turquoise glow woven into the environment (walls, floor, props), barely visible, one tiny dark-turquoise crystal glint as a subtle accent, no text, no characters, no UI, no gears, calm empty center for overlaid content. Hand-painted 2D game background style.

- Arquivo: `bg-modal-perfil-generico.png` em `E:\Soulmon-assets\modais-fundos\`
- Tags: `perfil`, `generico`, `bg-modal`, `malha-digital`

## 4. Telas cheias (entram agora, decisão do dono 17/11/2026)

Fenda (`DungeonGame`), Calabouço (`RogueDungeon`), mapa do Soulsmith (`ForgeCard` view=map) e Arena livre (`ArenaGame`) ganham fundo próprio e moldura de tela cheia, linhas 29-32. Não passam por `AreaSheet`: a moldura é aplicada no componente de cada tela. Continuam fora: jogos de Salão/Mente/Refúgio, `RogueKeyGate`, `NpcSequence` (intro de prédio). O Torneio usa `AreaSheet` com `hideClose` durante o duelo.

## 5. Etapa 3: modais da Home da fila central (`docs/FILA-DE-MODAIS.md`), sem prompts

`PRESENTATION_ORDER` em `src/utils/presentationQueue.ts` tem **23 ids** (22 + o ocioso `PRESENTATION_IDLE`); 2 são balões (sem moldura de modal), logo **21 superfícies de modal**. O doc da fila está defasado: faltam `evoRecap` e `messenger`.

| ordem | id | superfície |
|---|---|---|
| 1 | `welcomeTour` | tour do corvo (1º uso) |
| 2 | `triage` | `TriagePile` (por toque) |
| 3 | `dungeonReturn` | `DungeonReturnModal` |
| 4 | `feiraEvento` | `FeiraEventoSheet` / `FeiraLojaSheet` |
| 5 | `evoStats` | `EvolutionStatsModal` |
| 6 | `nightmare` | `NightmareBattleHost` |
| 7 | `dream` | `MorningDream` / `GoodDream` |
| 8 | `dailyReport` | `DailyReportModal` |
| 9 | `evoRecap` | `EvoRecapModal` (não está no doc da fila) |
| 10 | `buildingIntro` | `BuildingIntro` (`NpcSequence`) |
| 11 | `mapTutorial` | `MapTutorial` (`NpcSequence`) |
| 12 | `catalogOnboarding` | escolha das primeiras metas |
| 13 | `dayGoals` | `DayGoalsModal` ("Hoje") |
| 14 | `checkIn` | `MorningCheckIn` |
| 15 | `levelUp` | `LevelUpOverlay` |
| 16 | `evolveTask` | `EvolveTaskModal` |
| 17 | `groveMilestone` | `GroveMilestoneCeremony` |
| 18 | `messenger` | `MessengerSequence` (não está no doc da fila) |
| 19 | `catalogLevelInvite` | `CatalogLevelInviteModal` |
| 20 | `restSetup` | `RestSetupModal` |
| 21 | `welcome` (ocioso) | `WelcomePromptModal` (PWA/notificação) |
| - | `unlockToast`, `noticeToast` | balões, sem moldura de modal |

## 6. Etapa 4: demais modais

57 arquivos `*Modal*`/`*Sheet*`/`*Ceremony*`/`*Overlay*`/`*Popup*` em `src/components` (sem testes). Descontados `AreaSheet` (contêiner) e os ~14 cobertos nas seções 2 e 5, restam **cerca de 40** (ex.: `AISettingsModal`, `BalanceWeekModal`, `BlockedActionModal`, `CatalogBrowserModal`, `CheckInSheet`, `CreateModal`, `EditModal`, `TaskEditModal`, `CreditsModal`, `FeedbackModal`, `GuideModal`, `HelpModal`, `MailboxSheet`, `MercGuildSheet`, `MissionsSheet`, `AvisosSheet`, `PlayerDetailModal`, `PlayReviewModal`, `ProtectProgressModal`, `RebirthModal`, `UnlockAccountModal`, `ShopItemSheet`, `ElementPotionSheet`, `FormasAlternativasSheet`, `DungeonPotionsModal`, `ArenaCuraModal`, `DungeonBusyModal`, `NewReadingModal`, `GamePopups`, `FirstTaskCompletedPopup`, `ContentModals`, `EvolutionCeremony`, `MilestoneCeremony`). Contagem aproximada; a lista exata sai de um grep na etapa 4.

## 7. Dúvidas reais para o dono
1. **Fundo por prédio = 28 imagens novas, ou basta o fundo da área desfocado?** O plano pede 1 por prédio; como há plano provisório (7 áreas em ~9:20), dá para aprovar a moldura primeiro e decidir na amostra.
2. **Seções sem lote** (`laboratorio:pet`, `laboratorio:amigos`): fundo próprio ou herdar o do lote-pai? DECIDIDO (17/11/2026): Arquivo (`laboratorio:pet`) e Círculo (`laboratorio:amigos`) herdam o fundo do pai (`laboratorio:perfil` / `hall:guilda`); gera-se 26 + 4 telas cheias = 30.
3. **Perfil**: o NPC é o "Soulmon misterioso" (o Corvo), sem criatura nomeada; DECIDIDO: o Perfil usa fundo genérico discreto (linha 33 `perfil-generico`, turquesa + malha digital).
4. **Camadas de tela cheia** (Fenda, Calabouço, mapa do Soulsmith, Arena livre) DECIDIDO: entram agora (linhas 29-32, total 30).
