# Elemento por sprite

Decisão do dono (30/10/2026): **um sprite tem UM elemento e ele vale em todo lugar** em que o sprite aparece (criatura e golpes básico/especial): Soulmon do jogador, outros jogadores (duelo/torneio/guilda), inimigos de masmorra/arena/pesadelo/rogue, minigames, biblioteca/bestiário e jogadores simulados.

- **Dono único:** `src/utils/spriteElement.ts` (`SPRITE_ELEMENT`, `lineElementOf`, `rosterEntryElement`).
- **Contrato:** `src/utils/spriteElement.contract.test.ts` (arquivos de arte x mapa, combinados x manifest, simulados x prompt embutido, golpes do pet = elemento do sprite) e `functions/api/spriteElement.parity.test.js` (espelho do servidor).
- **Pet do jogador:** a arte vence. Elemento = `petElementOf` (inicial; senão `soulmonMeta.dominantElement` do oráculo). Golpe básico e especial usam esse elemento; a ficha decide só forma/escola. Servidor: `petElementDeSave` em `functions/api/_duel.js` alimenta `fx.elBasica/elEspecial` (duelo, torneio, guerra de guilda).
- **Combinados:** o elemento é o id FUNDIDO (ex.: fogo+agua = `vapor`), não o 1º componente. `RosterEntry.element` = fundido; `RosterEntry.elements` = 2 componentes (a tabela de vantagem só conhece as 17 bases).

## O que mudou
- `spriteElement.ts` novo; `enemyRoster.ts` (combinado: element = fundido); `arena.ts`/`ArenaGame.tsx` (FX/forma do inimigo usam `element`; vantagem do jogador pelo `petElement`).
- `combatFx.ts`: `dungeonEnemyElement` (linha antiga -> elemento do chefe cuja arte ela mostra; sem hash) e `opponentElementFor` (sem elemento = `neutro`, sem hash). `visualElementFor` continua exportado mas não é mais usado em combate.
- `dungeon.ts`: inimigo de linha antiga já nasce com `element`.
- `fighterIdentity.ts`: básico e especial = elemento do sprite; `fxDoLutador(par, petElement)`.
- `DuelScreen.tsx`, `TournamentPage.tsx` (NPC desafiante usa `DESAFIANTE_ELEMENT`; fx do treino com o elemento do pet).
- `GameStateContext.tsx`: o perfil público publica `petElementOf(gameState)` (antes só o dominante cru: iniciais e corvo ficavam sem elemento).
- `match3Combat.ts`/`match3Pvp.ts`/`Match3Game.tsx`: inimigo do Elemental Fusion tem o elemento do sprite (roster, linha própria, oponente PvP).
- `soulBarrage.ts`: filtro espaço por `elements[0]` (mesmo conjunto de antes).
- Simulados: `element` = elemento do prompt (33/50 mudaram), `artLine` só quando existe linha/inicial do MESMO elemento (senão vazio); save do simulado ganha `soulmonMeta.dominantElement`.

## Tabelas
### Base (20): `novos/<elemento>-<estágio>.png` — prefixo do arquivo = elemento (NOVOS_DATA).
### Iniciais (5): industrial=terra, nascente=som, alento=ar, vida=vida, meteoro=fogo (`STARTER_ELEMENT`, pedido do dono).
### Inimigos da API (5): cinderkit=fogo, ashimp=fogo, tailhorn=terra, tidewark=agua, gloomhorn=sombra (escolha manual de `INIMIGOS_API_DATA`; nenhuma evidência contrária encontrada).
### Linhas de `lines/` (4) — evidência: bio PT/EN em `PREMADE_CHARACTERS` (commit c11dc49d), não prompt Higgsfield
| linha | elemento | evidência |
|---|---|---|
| kaelen | fogo | "espírito de chamas contidas, forjado em brasa" |
| thalindra | luz | "presença dourada e serena, tecida a partir de luz calma" |
| igni | fogo | "lagarto de brasa que carrega a fornalha nas costas" |
| astrase | luz | "coruja rosada que guarda uma luz mansa sob as asas" |

Na masmorra as linhas antigas mostram arte de chefe (`DUNGEON_LINE_SPRITES`): kaelen=Cinderhorn (fervor), thalindra=Corallume (mare), igni=Obsidarch (obsidiana), astrase=Glimmerswarm (alento); o elemento do inimigo é o do chefe exibido.
### Chefes (24): 1º elemento de `BOSS_ROSTER`
| chefe | elemento |
|---|---|
| arauto-do-fim | juizo_final |
| cinderhorn | fervor |
| thrummer | tempestade |
| squallstride | trovao |
| orbitant | peso_descomunal |
| mycelar | miasma |
| obsidarch | obsidiana |
| bladeveil | lamina_viva |
| sabrefin | lamina_oculta |
| glimmerswarm | alento |
| corallume | mare |
| halorune | runa |
| chorale | cristal |
| drifela | nascente |
| hollowmere | florescer |
| astrawing | estratosfera |
| nebulara | nebulosa |
| voltbloom | sinapse |
| graftfang | mutacao |
| duskveil | crepusculo |
| dawnloom | aurora |
| aeonyx | eon |
| tallyjack | ouro_vivo |
| cuprex | aco |

Os prompts de `E:/Soulmon-assets/out/rodada3/poderosos/prompts.json` descrevem a criatura sem citar o elemento; o roster (2 a 4 ids por chefe) é a única fonte. Escolhi o 1º listado. **Ambíguo** (ver relatório).
### Desafiantes do Torneio (3): espina=planta ("planta espinhosa"), quartzo=cristal ("cristal"), mare=agua ("aquática") — comentário de `tournamentNpcs.ts`; `cristal` é um par (terra+arcano).
### Combinados (211): elemento = slug do arquivo (id fundido) — manifest `novos-arquivo/manifest.json`
| nº | arquivo | elemento | componentes (manifest) |
|---|---|---|---|
| 001 | combinados/001-vapor.png | vapor | fogo+agua |
| 002 | combinados/002-lava.png | lava | fogo+terra |
| 003 | combinados/003-incendio.png | incendio | fogo+ar |
| 004 | combinados/004-plasma.png | plasma | fogo+eletricidade |
| 005 | combinados/005-fogo_feiticeiro.png | fogo_feiticeiro | fogo+arcano |
| 006 | combinados/006-fogo_negro.png | fogo_negro | fogo+sombra |
| 007 | combinados/007-chama_solar.png | chama_solar | fogo+luz |
| 008 | combinados/008-fogo_infernal.png | fogo_infernal | fogo+vileza |
| 009 | combinados/009-chama_azul.png | chama_azul | fogo+morte |
| 010 | combinados/010-fenix.png | fenix | fogo+vida |
| 011 | combinados/011-fervor.png | fervor | fogo+vigor |
| 012 | combinados/012-pantano.png | pantano | agua+terra |
| 013 | combinados/013-gelo.png | gelo | agua+ar |
| 014 | combinados/014-agua_viva.png | agua_viva | agua+eletricidade |
| 015 | combinados/015-mare.png | mare | agua+arcano |
| 016 | combinados/016-abismo.png | abismo | agua+sombra |
| 017 | combinados/017-prisma.png | prisma | agua+luz |
| 018 | combinados/018-acido.png | acido | agua+vileza |
| 019 | combinados/019-veneno.png | veneno | agua+morte |
| 020 | combinados/020-nascente.png | nascente | agua+vida |
| 021 | combinados/021-correnteza.png | correnteza | agua+vigor |
| 022 | combinados/022-areia.png | areia | terra+ar |
| 023 | combinados/023-magnetismo.png | magnetismo | terra+eletricidade |
| 024 | combinados/024-cristal.png | cristal | terra+arcano |
| 025 | combinados/025-obsidiana.png | obsidiana | terra+sombra |
| 026 | combinados/026-ouro_vivo.png | ouro_vivo | terra+luz |
| 027 | combinados/027-solo_profano.png | solo_profano | terra+vileza |
| 028 | combinados/028-ossuario.png | ossuario | terra+morte |
| 029 | combinados/029-flora.png | flora | terra+vida |
| 030 | combinados/030-tita.png | tita | terra+vigor |
| 031 | combinados/031-tempestade.png | tempestade | ar+eletricidade |
| 032 | combinados/032-eter.png | eter | ar+arcano |
| 033 | combinados/033-murmurio.png | murmurio | ar+sombra |
| 034 | combinados/034-aurora.png | aurora | ar+luz |
| 035 | combinados/035-enxofre.png | enxofre | ar+vileza |
| 036 | combinados/036-miasma.png | miasma | ar+morte |
| 037 | combinados/037-alento.png | alento | ar+vida |
| 038 | combinados/038-impeto.png | impeto | ar+vigor |
| 039 | combinados/039-fluxo.png | fluxo | eletricidade+arcano |
| 040 | combinados/040-trovao_negro.png | trovao_negro | eletricidade+sombra |
| 041 | combinados/041-fulgor.png | fulgor | eletricidade+luz |
| 042 | combinados/042-tormento.png | tormento | eletricidade+vileza |
| 043 | combinados/043-galvanismo.png | galvanismo | eletricidade+morte |
| 044 | combinados/044-sinapse.png | sinapse | eletricidade+vida |
| 045 | combinados/045-reflexo.png | reflexo | eletricidade+vigor |
| 046 | combinados/046-ocultismo.png | ocultismo | arcano+sombra |
| 047 | combinados/047-runa.png | runa | arcano+luz |
| 048 | combinados/048-pacto.png | pacto | arcano+vileza |
| 049 | combinados/049-alma.png | alma | arcano+morte |
| 050 | combinados/050-essencia.png | essencia | arcano+vida |
| 051 | combinados/051-encantamento.png | encantamento | arcano+vigor |
| 052 | combinados/052-crepusculo.png | crepusculo | sombra+luz |
| 053 | combinados/053-terror.png | terror | sombra+vileza |
| 054 | combinados/054-espectro.png | espectro | sombra+morte |
| 055 | combinados/055-parasita.png | parasita | sombra+vida |
| 056 | combinados/056-assassinio.png | assassinio | sombra+vigor |
| 057 | combinados/057-heresia.png | heresia | luz+vileza |
| 058 | combinados/058-julgamento.png | julgamento | luz+morte |
| 059 | combinados/059-santidade.png | santidade | luz+vida |
| 060 | combinados/060-bravura.png | bravura | luz+vigor |
| 061 | combinados/061-praga.png | praga | vileza+morte |
| 062 | combinados/062-mutacao.png | mutacao | vileza+vida |
| 063 | combinados/063-carnificina.png | carnificina | vileza+vigor |
| 064 | combinados/064-equilibrio.png | equilibrio | morte+vida |
| 065 | combinados/065-ceifa.png | ceifa | morte+vigor |
| 066 | combinados/066-vitalidade.png | vitalidade | vida+vigor |
| 067 | combinados/067-forja.png | forja | marcial+fogo |
| 068 | combinados/068-tempera.png | tempera | marcial+agua |
| 069 | combinados/069-aco.png | aco | marcial+terra |
| 070 | combinados/070-esgrima.png | esgrima | marcial+ar |
| 071 | combinados/071-aco_voltaico.png | aco_voltaico | marcial+eletricidade |
| 072 | combinados/072-arsenal.png | arsenal | marcial+arcano |
| 073 | combinados/073-lamina_oculta.png | lamina_oculta | marcial+sombra |
| 074 | combinados/074-lamina_radiante.png | lamina_radiante | marcial+luz |
| 075 | combinados/075-serrilha.png | serrilha | marcial+vileza |
| 076 | combinados/076-fio_funebre.png | fio_funebre | marcial+morte |
| 077 | combinados/077-lamina_viva.png | lamina_viva | marcial+vida |
| 078 | combinados/078-maestria.png | maestria | marcial+vigor |
| 079 | combinados/079-pira_eterna.png | pira_eterna | tempo+fogo |
| 080 | combinados/080-erosao.png | erosao | tempo+agua |
| 081 | combinados/081-fossil.png | fossil | tempo+terra |
| 082 | combinados/082-aceleracao.png | aceleracao | tempo+ar |
| 083 | combinados/083-instante.png | instante | tempo+eletricidade |
| 084 | combinados/084-cronomancia.png | cronomancia | tempo+arcano |
| 085 | combinados/085-entropia.png | entropia | tempo+sombra |
| 086 | combinados/086-eon.png | eon | tempo+luz |
| 087 | combinados/087-ruina.png | ruina | tempo+vileza |
| 088 | combinados/088-ocaso.png | ocaso | tempo+morte |
| 089 | combinados/089-florescer.png | florescer | tempo+vida |
| 090 | combinados/090-frenesi.png | frenesi | tempo+vigor |
| 091 | combinados/091-contratempo.png | contratempo | tempo+marcial |
| 092 | combinados/092-estrondo.png | estrondo | som+fogo |
| 093 | combinados/093-sonar.png | sonar | som+agua |
| 094 | combinados/094-terremoto.png | terremoto | som+terra |
| 095 | combinados/095-estampido.png | estampido | som+ar |
| 096 | combinados/096-trovao.png | trovao | som+eletricidade |
| 097 | combinados/097-cantico.png | cantico | som+arcano |
| 098 | combinados/098-sussurro.png | sussurro | som+sombra |
| 099 | combinados/099-harmonia.png | harmonia | som+luz |
| 100 | combinados/100-dissonancia.png | dissonancia | som+vileza |
| 101 | combinados/101-requiem.png | requiem | som+morte |
| 102 | combinados/102-melodia.png | melodia | som+vida |
| 103 | combinados/103-brado.png | brado | som+vigor |
| 104 | combinados/104-cadencia.png | cadencia | som+marcial |
| 105 | combinados/105-eco.png | eco | som+tempo |
| 106 | combinados/106-fornalha_estelar.png | fornalha_estelar | gravidade+fogo |
| 107 | combinados/107-voragem.png | voragem | gravidade+agua |
| 108 | combinados/108-colapso.png | colapso | gravidade+terra |
| 109 | combinados/109-vacuo.png | vacuo | gravidade+ar |
| 110 | combinados/110-magnetar.png | magnetar | gravidade+eletricidade |
| 111 | combinados/111-singularidade.png | singularidade | gravidade+arcano |
| 112 | combinados/112-buraco_negro.png | buraco_negro | gravidade+sombra |
| 113 | combinados/113-halo_gravitacional.png | halo_gravitacional | gravidade+luz |
| 114 | combinados/114-jugo.png | jugo | gravidade+vileza |
| 115 | combinados/115-implosao.png | implosao | gravidade+morte |
| 116 | combinados/116-ancora_vital.png | ancora_vital | gravidade+vida |
| 117 | combinados/117-peso_descomunal.png | peso_descomunal | gravidade+vigor |
| 118 | combinados/118-ariete.png | ariete | gravidade+marcial |
| 119 | combinados/119-dilatacao.png | dilatacao | gravidade+tempo |
| 120 | combinados/120-onda_de_choque.png | onda_de_choque | gravidade+som |
| 121 | combinados/121-meteoro.png | meteoro | espaco+fogo |
| 122 | combinados/122-cometa.png | cometa | espaco+agua |
| 123 | combinados/123-asteroide.png | asteroide | espaco+terra |
| 124 | combinados/124-estratosfera.png | estratosfera | espaco+ar |
| 125 | combinados/125-pulsar.png | pulsar | espaco+eletricidade |
| 126 | combinados/126-portal.png | portal | espaco+arcano |
| 127 | combinados/127-vazio.png | vazio | espaco+sombra |
| 128 | combinados/128-constelacao.png | constelacao | espaco+luz |
| 129 | combinados/129-devorador.png | devorador | espaco+vileza |
| 130 | combinados/130-nebulosa.png | nebulosa | espaco+morte |
| 131 | combinados/131-semente_estelar.png | semente_estelar | espaco+vida |
| 132 | combinados/132-gigante_estelar.png | gigante_estelar | espaco+vigor |
| 133 | combinados/133-lamina_sideral.png | lamina_sideral | espaco+marcial |
| 134 | combinados/134-continuum.png | continuum | espaco+tempo |
| 135 | combinados/135-silencio_cosmico.png | silencio_cosmico | espaco+som |
| 136 | combinados/136-dobra.png | dobra | espaco+gravidade |
| 137 | combinados/137-planta.png | planta | vida+terra |
| 138 | combinados/138-industrial.png | industrial | marcial+terra |
| 139 | combinados/139-fogo_fatuo.png | fogo_fatuo | fada+fogo |
| 140 | combinados/140-orvalho.png | orvalho | fada+agua |
| 141 | combinados/141-circulo_feerico.png | circulo_feerico | fada+terra |
| 142 | combinados/142-brisa_cintilante.png | brisa_cintilante | fada+ar |
| 143 | combinados/143-glitter.png | glitter | fada+eletricidade |
| 144 | combinados/144-feerie.png | feerie | fada+arcano |
| 145 | combinados/145-sonho_sombrio.png | sonho_sombrio | fada+sombra |
| 146 | combinados/146-arco_iris.png | arco_iris | fada+luz |
| 147 | combinados/147-encanto_traicoeiro.png | encanto_traicoeiro | fada+vileza |
| 148 | combinados/148-banshee.png | banshee | fada+morte |
| 149 | combinados/149-coracao.png | coracao | fada+vida |
| 150 | combinados/150-graca.png | graca | fada+vigor |
| 151 | combinados/151-lamina_purpurina.png | lamina_purpurina | fada+marcial |
| 152 | combinados/152-sono_encantado.png | sono_encantado | fada+tempo |
| 153 | combinados/153-cancao_feerica.png | cancao_feerica | fada+som |
| 154 | combinados/154-leveza.png | leveza | fada+gravidade |
| 155 | combinados/155-poeira_estelar.png | poeira_estelar | fada+espaco |
| 156 | combinados/156-fornalha.png | fornalha | industrial+fogo |
| 157 | combinados/157-hidraulica.png | hidraulica | industrial+agua |
| 158 | combinados/158-mineracao.png | mineracao | industrial+terra |
| 159 | combinados/159-pneumatica.png | pneumatica | industrial+ar |
| 160 | combinados/160-usina.png | usina | industrial+eletricidade |
| 161 | combinados/161-artificio.png | artificio | industrial+arcano |
| 162 | combinados/162-fuligem.png | fuligem | industrial+sombra |
| 163 | combinados/163-holofote.png | holofote | industrial+luz |
| 164 | combinados/164-poluicao.png | poluicao | industrial+vileza |
| 165 | combinados/165-ferro_velho.png | ferro_velho | industrial+morte |
| 166 | combinados/166-biomecanica.png | biomecanica | industrial+vida |
| 167 | combinados/167-exoesqueleto.png | exoesqueleto | industrial+vigor |
| 168 | combinados/168-armaria.png | armaria | industrial+marcial |
| 169 | combinados/169-relojoaria.png | relojoaria | industrial+tempo |
| 170 | combinados/170-britadeira.png | britadeira | industrial+som |
| 171 | combinados/171-prensa.png | prensa | industrial+gravidade |
| 172 | combinados/172-estacao_orbital.png | estacao_orbital | industrial+espaco |
| 173 | combinados/173-brinquedo.png | brinquedo | industrial+fada |
| 174 | combinados/174-queimada.png | queimada | planta+fogo |
| 175 | combinados/175-mangue.png | mangue | planta+agua |
| 176 | combinados/176-raiz_profunda.png | raiz_profunda | planta+terra |
| 177 | combinados/177-polen.png | polen | planta+ar |
| 178 | combinados/178-fotossintese.png | fotossintese | planta+eletricidade |
| 179 | combinados/179-druidismo.png | druidismo | planta+arcano |
| 180 | combinados/180-fungo.png | fungo | planta+sombra |
| 181 | combinados/181-girassol.png | girassol | planta+luz |
| 182 | combinados/182-espinheiro.png | espinheiro | planta+vileza |
| 183 | combinados/183-murcha.png | murcha | planta+morte |
| 184 | combinados/184-seiva.png | seiva | planta+vida |
| 185 | combinados/185-carvalho.png | carvalho | planta+vigor |
| 186 | combinados/186-bambu.png | bambu | planta+marcial |
| 187 | combinados/187-estacoes.png | estacoes | planta+tempo |
| 188 | combinados/188-farfalhar.png | farfalhar | planta+som |
| 189 | combinados/189-trepadeira.png | trepadeira | planta+gravidade |
| 190 | combinados/190-arvore_mundo.png | arvore_mundo | planta+espaco |
| 191 | combinados/191-jardim_encantado.png | jardim_encantado | planta+fada |
| 192 | combinados/192-estufa.png | estufa | planta+industrial |
| 193 | combinados/193-chama_demoniaca.png | chama_demoniaca | fogo+vileza+morte |
| 194 | combinados/194-paradoxo.png | paradoxo | tempo+arcano+morte |
| 195 | combinados/195-big_bang.png | big_bang | espaco+gravidade+tempo |
| 196 | combinados/196-sinfonia.png | sinfonia | som+luz+vida |
| 197 | combinados/197-furacao.png | furacao | agua+ar+eletricidade |
| 198 | combinados/198-selva.png | selva | agua+terra+vida |
| 199 | combinados/199-abominacao.png | abominacao | sombra+morte+vileza |
| 200 | combinados/200-eclipse.png | eclipse | luz+sombra+arcano |
| 201 | combinados/201-reencarnacao.png | reencarnacao | vida+morte+arcano |
| 202 | combinados/202-sobrecarga.png | sobrecarga | eletricidade+arcano+vigor |
| 203 | combinados/203-ascensao.png | ascensao | luz+vida+vigor |
| 204 | combinados/204-nucleo.png | nucleo | fogo+terra+eletricidade |
| 205 | combinados/205-pestilencia.png | pestilencia | planta+morte+vileza |
| 206 | combinados/206-maldicao.png | maldicao | fada+sombra+vileza |
| 207 | combinados/207-cyber.png | cyber | industrial+eletricidade+arcano |
| 208 | combinados/208-avatar_de_guerra.png | avatar_de_guerra | marcial+vigor+arcano |
| 209 | combinados/209-primordial.png | primordial | fogo+agua+terra+ar+eletricidade |
| 210 | combinados/210-ciclo.png | ciclo | vida+morte+luz+sombra |
| 211 | combinados/211-nulo.png | nulo | 20 elementos |
| lote 3 (30/10/2026) | 16 curados de 4 componentes, sem arte propria: sprite cai no rookie do 1o componente; dados em `src/utils/elementosLote3.data.ts` | | |
| 246 | combinados/246-avatar_elemental.png (pendente) | avatar_elemental | fogo+agua+terra+ar |
| 247 | combinados/247-titano_forjado.png (pendente) | titano_forjado | fogo+terra+vigor+marcial |
| 248 | combinados/248-cataclismo.png (pendente) | cataclismo | fogo+terra+gravidade+espaco |
| 249 | combinados/249-sopro_do_dragao.png (pendente) | sopro_do_dragao | fogo+ar+vigor+marcial |
| 250 | combinados/250-ragnarok.png (pendente) | ragnarok | fogo+morte+tempo+gravidade |
| 251 | combinados/251-genesis.png (pendente) | genesis | agua+terra+luz+vida |
| 252 | combinados/252-tempestade_perfeita.png (pendente) | tempestade_perfeita | agua+ar+eletricidade+som |
| 253 | combinados/253-leviata.png (pendente) | leviata | agua+sombra+morte+gravidade |
| 254 | combinados/254-senhor_da_praga.png (pendente) | senhor_da_praga | agua+vileza+morte+vida |
| 255 | combinados/255-sinfonia_do_caos.png (pendente) | sinfonia_do_caos | arcano+sombra+vileza+som |
| 256 | combinados/256-vontade_absoluta.png (pendente) | vontade_absoluta | arcano+luz+vigor+som |
| 257 | combinados/257-arquiteto_da_realidade.png (pendente) | arquiteto_da_realidade | arcano+tempo+gravidade+espaco |
| 258 | combinados/258-ceifador_estelar.png (pendente) | ceifador_estelar | sombra+morte+marcial+espaco |
| 259 | combinados/259-renascimento.png (pendente) | renascimento | luz+morte+vida+tempo |
| 260 | combinados/260-juizo_final.png (pendente) | juizo_final | luz+morte+tempo+som |
| 261 | combinados/261-cavaleiro_absoluto.png (pendente) | cavaleiro_absoluto | luz+vigor+marcial+tempo |

Linhas 193-211 têm 3+ componentes: o jogo guarda só 2 (`COMBINADOS_DATA`) para a vantagem; o id fundido de cada uma (`chama_demoniaca`...`nulo`) NÃO está em `PARES`/`DERIVED_ELEMENT_PAIRS` (mas tem ícone `el-<id>.png`, cor em `elementVisual.data.ts` e direção em `fxFacingTable.ts`). 137 (planta) e 138 (industrial) são ids base.
### Simulados (50): elemento = `base` do prompt (paleta confere: planta=verde/rosa-flor, industrial=cromo/latão, luz=rosa-aurora/marfim, agua=azul/marinho, terra=argila/ocre, fogo=vermelho/laranja, sombra=violeta/preto, ar=azul-céu/prata)
| simulado | elemento do prompt |
|---|---|
| sim_0001 | planta |
| sim_0002 | industrial |
| sim_0003 | luz |
| sim_0004 | luz |
| sim_0005 | agua |
| sim_0006 | luz |
| sim_0007 | planta |
| sim_0008 | industrial |
| sim_0009 | terra |
| sim_0010 | industrial |
| sim_0011 | luz |
| sim_0012 | fogo |
| sim_0013 | sombra |
| sim_0014 | terra |
| sim_0015 | ar |
| sim_0016 | industrial |
| sim_0017 | fogo |
| sim_0018 | ar |
| sim_0019 | terra |
| sim_0020 | fogo |
| sim_0021 | planta |
| sim_0022 | ar |
| sim_0023 | ar |
| sim_0024 | fogo |
| sim_0025 | fogo |
| sim_0026 | ar |
| sim_0027 | agua |
| sim_0028 | agua |
| sim_0029 | luz |
| sim_0030 | terra |
| sim_0031 | sombra |
| sim_0032 | sombra |
| sim_0033 | planta |
| sim_0034 | fogo |
| sim_0035 | industrial |
| sim_0036 | fogo |
| sim_0037 | sombra |
| sim_0038 | terra |
| sim_0039 | ar |
| sim_0040 | terra |
| sim_0041 | luz |
| sim_0042 | sombra |
| sim_0043 | terra |
| sim_0044 | industrial |
| sim_0045 | sombra |
| sim_0046 | planta |
| sim_0047 | sombra |
| sim_0048 | terra |
| sim_0049 | industrial |
| sim_0050 | luz |
