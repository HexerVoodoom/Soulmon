# Simulados: elemento pelo que a arte mostra (revisão de 09/11/2026)

Regra do dono (30/10/2026): um sprite tem UM elemento e ele vale em todo lugar (criatura e golpes). Os prompts dos simulados nunca nomeiam o elemento (a paleta segue o elemento, a espécie é sorteada), então o elemento tem que seguir o que a ARTE mostra. Auditoria visual de 10 agentes em `E:\Soulmon-assets\auditoria-2026-11-09\simulados\chunk-01..10.json` (170 simulados, 177 linhas).

Critério: `fits=false`, confiança alta ou média, `better_element` válido (um dos 20 ids de `CLASS_ELEMENT_ORDER`); vale o veredito do rookie quando há várias formas. `artLine` recalculada por `ART_LINE_BY_ELEMENT` (fogo=meteoro, luz=thalindra, terra=industrial, ar=alento, senão vazio).

## Alterados (55)

| sim | nick | petName | antes | depois | confiança | evidência (o que a arte mostra) |
|---|---|---|---|---|---|---|
| sim_0003 | PedroH | SolAlpisi | luz | fada | media | fada-cavaleira alada rosa e branca, rosas na cabeca, escudo com rosa, asas com brilhos rosa |
| sim_0005 | mari.silva | Naiasar | agua | marcial | media | lagarta-besouro blindada azul-marinho com detalhes dourados, antenas, sem elemento aquatico visivel |
| sim_0017 | Gabi_R | DoomFornasura | fogo | eletricidade | media | criatura preta e vermelha com asas-lamina, raios ciano em volta, aspecto de orca-ave |
| sim_0031 | Mel | Neviasi | sombra | vileza | media | escorpiao roxo-escuro com detalhes vermelhos |
| sim_0034 | Rodrigo_S | Ignisis | fogo | sombra | media | criatura ouriço preta com espinhos e marcas vermelhas |
| sim_0038 | Davi_L | WarSipetra | terra | planta | media | bear-like treant: bark-brown body with branches, twigs and leaves on shoulders and back |
| sim_0040 | ZePedro | GrimSaharsil | terra | industrial | media | bronze/tan mechanical golem with orbital rings, red gem core and jointed plates |
| sim_0047 | Jujuba | Animasi | sombra | morte | media | black-purple armored creature with skulls on belt and weapon, bone horn |
| sim_0057 | Mayara | Barrento | terra | arcano | media | bolha vermelho-argila com armadura roxa e enfeite dourado; sem textura de rocha; le como fogo ou arcano |
| sim_0059 | Jabuticaba | Xistel | terra | industrial | media | criatura de cobre/bronze com tubos, placas com padroes teal e membros cilindricos; le como maquina |
| sim_0061 | NinaBlue | Rajadel | ar | som | media | criatura lilas com arcos concentricos ciano saindo do corpo e brotos verdes no topo; sem asas nem vento claro |
| sim_0064 | Tapioca | Nimbelo | ar | agua | media | criatura lilas/roxa com tentaculos, espirais e gemas ciano; ser marinho ou fantasmagorico; sem asas nem vento |
| sim_0065 | GatoPreto | Tochinha | fogo | vigor | media | fera carvao com placas e marcas vermelhas em padrao de runa, espinhos, garras teal; sem chamas nem brasas |
| sim_0066 | MangaVerde | Fornalhel | fogo | planta | media | inseto/mariposa laranja-avermelhado com asas, folhas, flor na cabeca e escudo floral; decoracao vegetal |
| sim_0068 | Yumi | Trevina | planta | agua | media | criatura branco-azulada/ciano com barbatanas de axolote e cauda teal; sem folha nem flor verde; le como agua |
| sim_0069 | CorujaNoturna | Lumi | luz | marcial | media | Hidra roxo-lavanda e marfim, armadura em placas, gema vermelha no peito; sem dourado nem brilho sagrado |
| sim_0070 | Litoral | Obscurel | sombra | terra | media | Lagarta marrom de argila, manto violeta-escuro, espirais e ondas ciano |
| sim_0076 | tioBeto | Gotinha | agua | vigor | media | Leao branco-creme com juba teal, corpo marrom, auréola dourada, patas grandes |
| sim_0080 | DonaMarta | Plumel | ar | luz | media | Porco-espinho branco e lavanda com manto violeta, espinhos rosa e halo de cristais rosa |
| sim_0081 | VoDaLu | Solzinho | luz | tempo | media | Aranha de pernas longas com duas ampulhetas no corpo, placas marrom-argila e lavanda, cristais ciano |
| sim_0082 | tuco | Noturno | sombra | morte | media | Corvo/passaro roxo-escuro com cara de caveira branca, escudo, caveira pendurada no cinto |
| sim_0086 | Akemi | Seixo | terra | ar | media | Ave vermelha e azul com plumas e volutas de nuvem, base de rocha bege secundária |
| sim_0088 | Recife_PE | Vultinho | sombra | vida | media | Criatura branco-perolado e rosa com placas roxas nas costas e orbes roxos orbitando; penas e sino |
| sim_0091 | Jake_F | Fagulha | fogo | luz | media | Criatura osseia creme-branca com halo dourado, gema brilhante laranja no peito, barbatanas laranja e folhas verdes |
| sim_0094 | bru.costa | Labarel | fogo | planta | media | Cervo-dragão creme e dourado com chifres cobertos de folhas verdes, manto vermelho-laranja e sino dourado |
| sim_0095 | sabia | Piralis | fogo | planta | alta | Caranguejo/besouro laranja com flores rosa e folhas nas costas, ampulhetas e lanterna dourada |
| sim_0096 | caju | Cobrel | industrial | vileza | media | Escorpião bege-marrom com ferrão vermelho curvo e marcas circulares vermelhas |
| sim_0100 | Igor_T | Galerno | ar | agua | media | Criatura creme-branca com espinhos de cristal azul-gelo nas asas e costas, espinhos marrons, cauda vermelha e gema roxa |
| sim_0103 | Pilar | Musgo | planta | morte | media | Corpo cinza-esverdeado com espinhos e chamas vermelhas nas costas, caveira no peito, cauda de osso |
| sim_0105 | ava_b | Ramelis | planta | sombra | media | Criatura azul-marinho escuro com espirais brancas, tentaculos brancos e cajado com ponta vermelha; sem folhas |
| sim_0107 | DiaBom | Rolamento | industrial | fogo | media | Criatura cinza com placas de armadura e chamas laranja-vermelhas por todo o corpo, runas laranja |
| sim_0109 | Sofi | Bambuzel | planta | luz | media | Golem creme/dourado com cores claras, arcos concentricos de onda e capa rosa; sem folhas |
| sim_0110 | haru.bh | Bobina | industrial | agua | alta | Criatura azul-claro tipo lula com tentaculos, coroa dourada e gema ciano; sem metal nem engrenagem |
| sim_0112 | Erick_P | Pedrinha | terra | planta | media | Criatura com cabeca de folhagem e folhas verdes, raizes nos pes, tronco marrom com ampulheta |
| sim_0113 | FelipeSM | Brumar | agua | planta | alta | Inseto verde-folha com asas de folha, flores rosa nas antenas, corpo azul-marinho com dourado |
| sim_0114 | tarefeiro | Nublado | ar | som | media | Caixa de musica azul/rosa/dourada com chave dourada, notas musicais e escudo; concha de cristal |
| sim_0116 | Ethan_R | Delfira | agua | tempo | media | Mago chibi com chapeu de ampulheta, cajado de relogio e fitas ciano; manto azul-marinho |
| sim_0119 | Cecilia | Radiel | luz | arcano | media | Figura creme/lilas com manto roxo, runas ciano brilhantes e ondas sonoras nos lados |
| sim_0121 | kira_zen | Sibilar | ar | arcano | media | Criatura lilas/violeta com asas azul-claras em lamina e marcas vermelhas. Violeta dominante e marcas de runa apontam arcano; asas azuis sao o unico indicio de ar. |
| sim_0122 | hiro_san | Halonis | luz | planta | media | Lagosta/planta com mandibula de flor carnivora, brotos de folha, rosa e teal. Nada dourado nem halo; luz nao aparece. Planta combina com mandibula e brotos. |
| sim_0123 | dan_oliver | Ventel | ar | agua | media | Lula/medusa azul-acinzentada com musgo verde e gemas ciano. Corpo de lula e tentaculos apontam agua; azul-acinzentado claro nao sustenta ar. |
| sim_0124 | Aiko | Ondalis | agua | luz | media | Sacerdotisa branca com halo dourado, cajado e robe azul com espirais. Halo dourado e figura de sacerdote apontam luz; azul do robe e o unico apoio para agua. |
| sim_0132 | CafeComLeite | Rochedo | terra | morte | media | Touro/bestia com rosto de caveira branco-osso, marcas de ossos e robe marrom com runas douradas. Motivo de caveira (prompt: bone-white skull) aponta morte; marrom e so de fundo. |
| sim_0134 | Bento | Orvalhel | planta | luz | media | Criatura creme/branca/dourada com halo, estrelas douradas e manto verde pequeno. Dominante luz (dourado/branco sagrado); planta so no manto verde. Fada como alternativa (rosa e brilhos). |
| sim_0135 | ListaCheia | Aquelis | agua | terra | alta | Tartaruga/rocha marrom com cristal rosa no casco e escudos teal. Corpo rochoso marrom: terra. Agua nao aparece em nenhum elemento visual. |
| sim_0136 | Noah | Rubrasa | fogo | luz | media | Ave branco-creme com halo e coroa dourada, detalhes vermelhos e cauda com caveira. Dominante branco/dourado (luz); vermelho e acento. Fogo e fraco como dominante. |
| sim_0147 | Hana_chan | Transistel | industrial | ar | media | Ave branca e laranja com crista coral, escudo teal, sino e coroa pequena |
| sim_0151 | Goiaba | Salmoura | agua | vileza | media | Escorpião azul-teal com cauda curva e ferrão, pernas violeta, marcas ciano, pequeno broto |
| sim_0153 | Pastelzinho | Pistonel | industrial | agua | media | Criatura-coroada tipo água-viva/coral, barbatanas teal e rosa de cristal, coroa dourada, cabeça cinza |
| sim_0155 | Rebeca | Rebitel | industrial | agua | media | polvo creme/rosa com olho na cabeca, arnes de cobre/bronze, bolsa com cruz vermelha, halo dourado |
| sim_0159 | Jessi | Calorim | fogo | marcial | media | gato-lagosta laranja/pessego com manto roxo e dourado, cetro com cristal, escudos com cruz |
| sim_0162 | Quati | Parafuso | industrial | arcano | media | criatura cinza-grafite com placas tipo armadura, cristais ciano nas laterais, crina ciano, losangos de runa ciano |
| sim_0166 | Arthur_V | Clarel | luz | terra | media | criatura-rocha creme/rosa-palido com placas de pedra, cauda com mangual roxo, marcas X vermelhas e espirais roxas |
| sim_0168 | lari.mota | Estivel | ar | tempo | alta | figura lilas-branca com corpo em forma de ampulheta, relogio de cristal ao fundo, emblemas de ampulheta e engrenagem ciano, fumaca lilas |
| sim_0170 | Enzo_SP | Circuitel | industrial | arcano | media | figura encapuzada roxa, rosto metalico cinza, chamas azul-ciano nas pontas do halo, runas ciano no manto, cajado com orbe |

## Não alterados (3)

| sim | nick | petName | elemento atual | sugerido | motivo | evidência |
|---|---|---|---|---|---|---|
| sim_0098 | mina_k | Soldinha | industrial | marcial | confianca baixa | Besta marrom-bronze blindada com espinhos, escudos e bandeiras vermelhas, juba laranja |
| sim_0152 | Loboguara | Tarraxa | industrial | marcial | confianca baixa | Besta branco-prateada blindada, juba laranja em chama, asa de morcego, lâmina laranja com gema vermelha |
| sim_0161 | Bela_K | Cascalho | terra | planta | confianca baixa | passaro-criatura creme/cinza-bege com halo de flor rosa, asas creme, pes de folha oliva, runas no peito |

Ids inválidos descartados: nenhum.

## Como chega à produção

O save e o perfil de cada simulado são gravados no KV por `upsertSimulado` (tique diário `ensureSimuladosDia`, disparado por qualquer requisição). A assinatura `simSig` agora inclui `element` e `artLine`: no primeiro tique depois do deploy, cada simulado cujo elemento mudou reescreve o save (`soulmonMeta.dominantElement`, `soulmonSkills`, `demoCharacterId`) e o perfil público (`element`, `artLine`), sem tocar em id, apelido, pontos, rank, scores nem elegibilidade a prêmio (simulados nunca recebem). Nenhuma chamada de admin é necessária. Jogadores reais não passam por esse caminho.
