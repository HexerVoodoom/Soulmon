// src/registry/geracoes.ts
var DIVISOR_CASCATA = { 1: 0, 2: 5, 3: 4, 4: 3 };
var LIMIAR_DESTRAVAMENTO = { 1: 0, 2: 10, 3: 6, 4: 4 };
var CUSTO_PONTO_ALOCACAO = { 1: 1, 2: 2, 3: 3, 4: 4 };
var CUSTO_CASCATA_EQUIVALENTE = { 1: 1, 2: 10, 3: 60, 4: 240 };
var DIVISOR_CASCATA_ESPECIAL = 20;
function pesoDiretoNaCascata(aridade) {
  return CUSTO_PONTO_ALOCACAO[aridade] / CUSTO_CASCATA_EQUIVALENTE[aridade];
}
var ORCAMENTO_POR_TIER = {
  1: 60,
  2: 120,
  3: 200,
  4: 340,
  5: 500,
  6: 800,
  7: 1200
};

// src/registry/elementos.ts
var ELEMENTOS_PRIMAIS = [
  "fogo",
  "agua",
  "terra",
  "ar",
  "eletricidade"
];
var pesos = (dano, controle, cura, defesa, suporte) => ({ dano, controle, cura, defesa, suporte });
var ELEMENTOS_BASE = {
  fogo: {
    id: "fogo",
    nome: "Fogo",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(1, 0, 0, 0, 0),
    descricao: "Destrui\xE7\xE3o pura: dano direto e queimadura."
  },
  agua: {
    id: "agua",
    nome: "\xC1gua",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.4, 0.4, 0.2, 0, 0),
    descricao: "Fluxo e adapta\xE7\xE3o: empurra, puxa, afoga e sustenta."
  },
  terra: {
    id: "terra",
    nome: "Terra",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.3, 0.2, 0, 0.5, 0),
    descricao: "Peso e perman\xEAncia: muralhas, tremores e imobilidade."
  },
  ar: {
    id: "ar",
    nome: "Ar",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.4, 0.4, 0, 0, 0.2),
    descricao: "Velocidade e alcance: l\xE2minas de vento e deslocamento."
  },
  eletricidade: {
    id: "eletricidade",
    nome: "Eletricidade",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.8, 0.2, 0, 0, 0),
    descricao: "Picos instant\xE2neos: dano em cadeia e paralisia breve."
  },
  arcano: {
    id: "arcano",
    nome: "Arcano",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.5, 0.2, 0, 0, 0.3),
    descricao: "Magia pura: conversa com todas as escolas e elementos m\xE1gicos."
  },
  sombra: {
    id: "sombra",
    nome: "Sombra",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.5, 0.3, 0, 0, 0.2),
    descricao: "Furtividade, drenagem e medo."
  },
  luz: {
    id: "luz",
    nome: "Luz",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.3, 0, 0.3, 0.2, 0.2),
    descricao: "Revela\xE7\xE3o, puni\xE7\xE3o e prote\xE7\xE3o."
  },
  vileza: {
    id: "vileza",
    nome: "Vileza",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.6, 0.3, 0, 0, 0.1),
    descricao: "Pactos, corrup\xE7\xE3o e dem\xF4nios; vizinha do fogo."
  },
  morte: {
    id: "morte",
    nome: "Morte",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.6, 0.3, 0, 0, 0.1),
    descricao: "Decad\xEAncia, mortos-vivos e o fim inevit\xE1vel."
  },
  vida: {
    id: "vida",
    nome: "Vida",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0, 0, 0.6, 0.2, 0.2),
    descricao: "Cura e crescimento; alimenta os elementos primais."
  },
  vigor: {
    id: "vigor",
    nome: "Vigor",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.6, 0, 0, 0.3, 0.1),
    descricao: "O esp\xEDrito do corpo; potencializa o combate f\xEDsico."
  },
  marcial: {
    id: "marcial",
    nome: "Marcial",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.7, 0.1, 0, 0.2, 0),
    descricao: "A arte das armas: maestria, t\xE9cnica e armas evocadas."
  },
  tempo: {
    id: "tempo",
    nome: "Tempo",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.2, 0.5, 0, 0, 0.3),
    descricao: "A corrente do tempo: pressa, lentid\xE3o, decad\xEAncia e revers\xE3o."
  },
  som: {
    id: "som",
    nome: "Som",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.4, 0.3, 0, 0, 0.3),
    descricao: "Vibra\xE7\xE3o e resson\xE2ncia: brados, can\xE7\xF5es e ondas de choque."
  },
  gravidade: {
    id: "gravidade",
    nome: "Gravidade",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.5, 0.4, 0, 0.1, 0),
    descricao: "A for\xE7a que puxa e esmaga: peso, atra\xE7\xE3o e colapso."
  },
  espaco: {
    id: "espaco",
    nome: "Espa\xE7o",
    tipo: "base",
    fatorPotencia: 1,
    pesos: pesos(0.3, 0.4, 0, 0, 0.3),
    descricao: "A dist\xE2ncia entre os pontos: portais, teleporte e o cosmos."
  }
};
function derivado(id, nome, componentes, descricao, opts = {}) {
  const fator = opts.fator ?? (componentes.length >= 3 ? 1.3 : 1.15);
  const minimo = opts.minimo ?? (componentes.length >= 3 ? 15 : 10);
  const media = { dano: 0, controle: 0, cura: 0, defesa: 0, suporte: 0 };
  for (const c3 of componentes) {
    const p = ELEMENTOS_BASE[c3].pesos;
    media.dano += p.dano / componentes.length;
    media.controle += p.controle / componentes.length;
    media.cura += p.cura / componentes.length;
    media.defesa += p.defesa / componentes.length;
    media.suporte += p.suporte / componentes.length;
  }
  const cascata = opts.cascata ?? (opts.tipo === "especial" ? { pais: [...componentes], divisor: DIVISOR_CASCATA_ESPECIAL, destravavel: false } : void 0);
  return {
    id,
    nome,
    tipo: opts.tipo ?? "derivado",
    fatorPotencia: fator,
    pesos: media,
    descricao,
    receita: componentes.map((elemento) => ({ elemento, nivelMinimo: minimo })),
    ...cascata ? { cascata } : {}
  };
}
var DERIVADOS_LISTA = [
  // ---- fogo + X ----
  derivado("vapor", "Vapor", ["fogo", "agua"], "N\xE9voa escaldante: queima, oculta e sufoca em \xE1rea.", { fator: 1.2 }),
  derivado("lava", "Lava", ["fogo", "terra"], "Fogo que adere: impacto pesado + queimadura persistente."),
  derivado("incendio", "Inc\xEAndio", ["fogo", "ar"], "Fogo alimentado pelo vento: espalha-se sozinho de alvo em alvo."),
  derivado("plasma", "Plasma", ["fogo", "eletricidade"], "Mat\xE9ria ionizada: o dano mais cru do sistema, dif\xEDcil de resistir."),
  derivado("fogo_feiticeiro", "Fogo Feiticeiro", ["fogo", "arcano"], "Chama program\xE1vel: explos\xF5es com atraso, formas e gatilhos."),
  derivado("fogo_negro", "Fogo Negro", ["fogo", "sombra"], "Chama que n\xE3o ilumina: queima e drena ao mesmo tempo."),
  derivado("chama_solar", "Chama Solar", ["fogo", "luz"], "Fogo purificador: dano que tamb\xE9m aben\xE7oa aliados pr\xF3ximos."),
  derivado("fogo_infernal", "Fogo Infernal", ["fogo", "vileza"], "A fornalha dos pactos: queima a carne e a vontade."),
  derivado("chama_azul", "Chama Azul", ["fogo", "morte"], "Fogo que queima a alma; ignora parte da defesa.", { fator: 1.2, minimo: 12 }),
  derivado("fenix", "F\xEAnix", ["fogo", "vida"], "Fogo que renasce: dano que retorna como cura."),
  derivado("fervor", "Fervor", ["fogo", "vigor"], "Sangue fervente: golpes f\xEDsicos incendi\xE1rios."),
  // ---- agua + X ----
  derivado("pantano", "P\xE2ntano", ["agua", "terra"], "Lama viva: prende, afunda e engole os inimigos."),
  derivado("gelo", "Gelo", ["agua", "ar"], "\xC1gua parada no tempo: congela, retarda e estilha\xE7a."),
  derivado("agua_viva", "\xC1gua-Viva", ["agua", "eletricidade"], "Corrente condutora: choques que viajam por superf\xEDcies molhadas."),
  derivado("mare", "Mar\xE9", ["agua", "arcano"], "Fluxo lunar: ondas que reposicionam aliados e inimigos."),
  derivado("abismo", "Abismo", ["agua", "sombra"], "Press\xE3o das profundezas: esmaga e cega quem afunda."),
  derivado("prisma", "Prisma", ["agua", "luz"], "Luz refratada: divide um efeito entre m\xFAltiplos feixes."),
  derivado("acido", "\xC1cido", ["agua", "vileza"], "Corros\xE3o: derrete armadura e derrete defesas."),
  derivado("veneno", "Veneno", ["agua", "morte"], "Toxina paciente: dano cont\xEDnuo que se recusa a sair."),
  derivado("nascente", "Nascente", ["agua", "vida"], "Fonte restauradora: cura em \xE1rea que persiste no ch\xE3o."),
  derivado("correnteza", "Correnteza", ["agua", "vigor"], "Fluidez marcial: golpes encadeados sem pausa."),
  // ---- terra + X ----
  derivado("areia", "Areia", ["terra", "ar"], "Tempestade de areia: cega, corr\xF3i e desloca."),
  derivado("magnetismo", "Magnetismo", ["terra", "eletricidade"], "Atra\xE7\xE3o e repuls\xE3o: desarma, puxa e prende metais."),
  derivado("cristal", "Cristal", ["terra", "arcano"], "Terra lapidada pelo arcano: barreiras e foco amplificador."),
  derivado("obsidiana", "Obsidiana", ["terra", "sombra"], "Vidro vulc\xE2nico: l\xE2minas defensivas que cortam quem ataca."),
  derivado("ouro_vivo", "Ouro Vivo", ["terra", "luz"], "Metal sagrado: armaduras e armas conjuradas brilhantes."),
  derivado("solo_profano", "Solo Profano", ["terra", "vileza"], "Ch\xE3o corrompido: territ\xF3rio que enfraquece quem pisa."),
  derivado("ossuario", "Ossu\xE1rio", ["terra", "morte"], "Os ossos da terra: muralhas e lan\xE7as de osso."),
  derivado("flora", "Flora", ["terra", "vida"], "Natureza desperta: vinhas, ra\xEDzes e crescimento selvagem."),
  derivado("tita", "Tit\xE3", ["terra", "vigor"], "Corpo de pedra: for\xE7a colossal e pele impenetr\xE1vel."),
  // ---- ar + X ----
  derivado("tempestade", "Tempestade", ["ar", "eletricidade"], "C\xE9u em f\xFAria: \xE1rea enorme e rel\xE2mpagos encadeados."),
  derivado("eter", "\xC9ter", ["ar", "arcano"], "O vento entre os mundos: teleporte curto e levita\xE7\xE3o."),
  derivado("murmurio", "Murm\xFArio", ["ar", "sombra"], "Vozes no vento: medo, confus\xE3o e sussurros que distraem."),
  derivado("aurora", "Aurora", ["ar", "luz"], "V\xE9u celeste: prote\xE7\xE3o em \xE1rea e clareza mental."),
  derivado("enxofre", "Enxofre", ["ar", "vileza"], "Fuma\xE7a infernal: nuvens t\xF3xicas que corrompem o f\xF4lego."),
  derivado("miasma", "Miasma", ["ar", "morte"], "Ar p\xFAtrido: praga aerotransportada de longo alcance."),
  derivado("alento", "Alento", ["ar", "vida"], "Sopro vital: cura \xE0 dist\xE2ncia e f\xF4lego renovado."),
  derivado("impeto", "\xCDmpeto", ["ar", "vigor"], "Velocidade sobre-humana: investidas e esquivas rel\xE2mpago."),
  // ---- eletricidade + X ----
  derivado("fluxo", "Fluxo", ["eletricidade", "arcano"], "Corrente de mana: sobrecarrega magias e dispositivos."),
  derivado("trovao_negro", "Trov\xE3o Negro", ["eletricidade", "sombra"], "Rel\xE2mpago silencioso: atinge sem aviso e sem som."),
  derivado("fulgor", "Fulgor", ["eletricidade", "luz"], "Clar\xE3o ofuscante: cega em \xE1rea e pune quem ataca."),
  derivado("tormento", "Tormento", ["eletricidade", "vileza"], "Choque cruel: dor que interrompe e desespera."),
  derivado("galvanismo", "Galvanismo", ["eletricidade", "morte"], "A centelha que reanima: constructos de carne e raio."),
  derivado("sinapse", "Sinapse", ["eletricidade", "vida"], "Sistema nervoso: acelera aliados e trava reflexos inimigos."),
  derivado("reflexo", "Reflexo", ["eletricidade", "vigor"], "Nervos el\xE9tricos: contra-ataques instant\xE2neos."),
  // ---- arcano + X ----
  derivado("ocultismo", "Ocultismo", ["arcano", "sombra"], "Saber proibido: magias que o alvo n\xE3o v\xEA chegar."),
  derivado("runa", "Runa", ["arcano", "luz"], "Palavra gravada: efeitos persistentes ancorados no ch\xE3o ou em aliados."),
  derivado("pacto", "Pacto", ["arcano", "vileza"], "Contrato de poder: sacrifica recurso por efeito ampliado."),
  derivado("alma", "Alma", ["arcano", "morte"], "A moeda dos mortos: manipula esp\xEDritos e ess\xEAncias."),
  derivado("essencia", "Ess\xEAncia", ["arcano", "vida"], "A mat\xE9ria-prima da vida: transmuta\xE7\xE3o e restaura\xE7\xE3o profunda."),
  derivado("encantamento", "Encantamento", ["arcano", "vigor"], "Corpo como foco: armas e punhos imbu\xEDdos de magia."),
  // ---- sombra + X ----
  derivado("crepusculo", "Crep\xFAsculo", ["sombra", "luz"], "A fronteira: revela e oculta ao mesmo tempo.", { fator: 1.25, minimo: 15 }),
  derivado("terror", "Terror", ["sombra", "vileza"], "Medo encarnado: inimigos fogem ou congelam."),
  derivado("espectro", "Espectro", ["sombra", "morte"], "Forma incorp\xF3rea: atravessa paredes e ignora armadura."),
  derivado("parasita", "Parasita", ["sombra", "vida"], "Vida roubada: drena o inimigo para curar voc\xEA."),
  derivado("assassinio", "Assass\xEDnio", ["sombra", "vigor"], "A arte do golpe \xFAnico: dano massivo pelas costas."),
  // ---- luz + X ----
  derivado("heresia", "Heresia", ["luz", "vileza"], "Luz falsa: ilus\xF5es sagradas e milagres corrompidos."),
  derivado("julgamento", "Julgamento", ["luz", "morte"], "O veredito final: executa alvos enfraquecidos."),
  derivado("santidade", "Santidade", ["luz", "vida"], "Gra\xE7a plena: a cura mais pura do sistema."),
  derivado("bravura", "Bravura", ["luz", "vigor"], "Coragem radiante: aura que fortalece a linha de frente."),
  // ---- vileza + X ----
  derivado("praga", "Praga", ["vileza", "morte"], "Corrup\xE7\xE3o contagiosa: veneno e maldi\xE7\xE3o se espalham.", { fator: 1.2, minimo: 12 }),
  derivado("mutacao", "Muta\xE7\xE3o", ["vileza", "vida"], "Carne mold\xE1vel: transforma o pr\xF3prio corpo em arma."),
  derivado("carnificina", "Carnificina", ["vileza", "vigor"], "Sede de sangue: quanto mais fere, mais forte fica."),
  // ---- morte + X ----
  derivado("equilibrio", "Equil\xEDbrio", ["morte", "vida"], "Vida e morte na mesma m\xE3o: converte dano em cura e cura em dano.", { fator: 1.25, minimo: 15 }),
  derivado("ceifa", "Ceifa", ["morte", "vigor"], "A foice encarnada: golpes f\xEDsicos que colhem almas."),
  // ---- vida + X ----
  derivado("vitalidade", "Vitalidade", ["vida", "vigor"], "Regenera\xE7\xE3o cont\xEDnua: o corpo que n\xE3o aceita cair."),
  // ---- marcial + X ----
  derivado("forja", "Forja", ["marcial", "fogo"], "Armas nascidas do fogo: l\xE2minas incandescentes e martelos de brasa."),
  derivado("tempera", "T\xEAmpera", ["marcial", "agua"], "O fio perfeito: l\xE2minas temperadas que nunca perdem o corte."),
  derivado("aco", "A\xE7o", ["marcial", "terra"], "Metal da terra: armas pesadas e armaduras vivas."),
  derivado("esgrima", "Esgrima", ["marcial", "ar"], "A dan\xE7a da l\xE2mina leve: estocadas r\xE1pidas como o vento."),
  derivado("aco_voltaico", "A\xE7o Voltaico", ["marcial", "eletricidade"], "Armas condutoras: cada golpe descarrega um rel\xE2mpago."),
  derivado("arsenal", "Arsenal", ["marcial", "arcano"], "Armas conjuradas do nada: um arsenal et\xE9reo ao seu dispor."),
  derivado("lamina_oculta", "L\xE2mina Oculta", ["marcial", "sombra"], "A arma que ningu\xE9m v\xEA: golpes das sombras."),
  derivado("lamina_radiante", "L\xE2mina Radiante", ["marcial", "luz"], "A espada-voto: arde contra o profano e protege o portador."),
  derivado("serrilha", "Serrilha", ["marcial", "vileza"], "Armas cru\xE9is: feridas que n\xE3o fecham."),
  derivado("fio_funebre", "Fio F\xFAnebre", ["marcial", "morte"], "A l\xE2mina que colhe: cada abate fortalece o pr\xF3ximo golpe."),
  derivado("lamina_viva", "L\xE2mina Viva", ["marcial", "vida"], "Armas que crescem: madeira viva, espinhos e seiva."),
  derivado("maestria", "Maestria", ["marcial", "vigor"], "Corpo e arma como um s\xF3: a t\xE9cnica al\xE9m da perfei\xE7\xE3o."),
  // ---- tempo + X (o 14º elemento base fecha a matriz) ----
  derivado("pira_eterna", "Pira Eterna", ["tempo", "fogo"], "Fogo que arde desde sempre: queima acelerada que nunca se apaga."),
  derivado("erosao", "Eros\xE3o", ["tempo", "agua"], "A \xE1gua que desgasta a montanha: dano que cresce com o tempo."),
  derivado("fossil", "Fossiliza\xE7\xE3o", ["tempo", "terra"], "O peso das eras: petrifica e imobiliza lentamente."),
  derivado("aceleracao", "Acelera\xE7\xE3o", ["tempo", "ar"], "O vento apressado: velocidade e reflexos sobre-humanos."),
  derivado("instante", "Instante", ["tempo", "eletricidade"], "O rel\xE2mpago fora do tempo: golpe que acontece antes de ser visto."),
  derivado("cronomancia", "Cronomancia", ["tempo", "arcano"], "A magia pura do tempo: pressa, lentid\xE3o e paradas temporais.", { fator: 1.2 }),
  derivado("entropia", "Entropia", ["tempo", "sombra"], "A desordem inevit\xE1vel: tudo se desfaz e nada retorna."),
  derivado("eon", "\xC9on", ["tempo", "luz"], "A luz das eras: cura o que o tempo feriu e revela o que vir\xE1."),
  derivado("ruina", "Ru\xEDna", ["tempo", "vileza"], "A maldi\xE7\xE3o da idade: corr\xF3i corpo e vontade lentamente."),
  derivado("ocaso", "Ocaso", ["tempo", "morte"], "O rel\xF3gio que sempre para: acelera o fim de tudo que vive.", { fator: 1.2 }),
  derivado("florescer", "Florescer", ["tempo", "vida"], "O tempo a favor da vida: crescimento e rejuvenescimento acelerados."),
  derivado("frenesi", "Frenesi", ["tempo", "vigor"], "O corpo al\xE9m do limite: cada segundo vale por dois."),
  derivado("contratempo", "Contratempo", ["tempo", "marcial"], "A l\xE2mina no tempo certo: contragolpes e cortes preemptivos."),
  // ---- som + X ----
  derivado("estrondo", "Estrondo", ["som", "fogo"], "Explos\xE3o sonora: o estouro que ensurdece e queima."),
  derivado("sonar", "Sonar", ["som", "agua"], "Eco das profundezas: revela o oculto e esmaga sob a \xE1gua."),
  derivado("terremoto", "Terremoto", ["som", "terra"], "Ondas s\xEDsmicas: o ch\xE3o treme e rasga em \xE1rea."),
  derivado("estampido", "Estampido", ["som", "ar"], "Estrondo s\xF4nico: barreira de ar que empurra tudo."),
  derivado("trovao", "Trov\xE3o", ["som", "eletricidade"], "O estouro do raio: choque e onda de choque juntos."),
  derivado("cantico", "C\xE2ntico", ["som", "arcano"], "Palavra cantada de poder: encantamentos que ecoam."),
  derivado("sussurro", "Sussurro", ["som", "sombra"], "Vozes que enlouquecem: medo sussurrado ao ouvido."),
  derivado("harmonia", "Harmonia", ["som", "luz"], "Acorde perfeito: cura e conforto que restauram a alma."),
  derivado("dissonancia", "Disson\xE2ncia", ["som", "vileza"], "Acorde quebrado: dor que corr\xF3i a mente."),
  derivado("requiem", "R\xE9quiem", ["som", "morte"], "A can\xE7\xE3o f\xFAnebre: paralisa os vivos e comanda os mortos."),
  derivado("melodia", "Melodia Vital", ["som", "vida"], "Can\xE7\xE3o de ninar: regenera\xE7\xE3o embalada em harmonia."),
  derivado("brado", "Brado", ["som", "vigor"], "Grito de guerra: inflama aliados e apavora inimigos."),
  derivado("cadencia", "Cad\xEAncia", ["som", "marcial"], "Ritmo de batalha: golpes no compasso perfeito."),
  derivado("eco", "Eco", ["som", "tempo"], "O som que volta do passado: repete efeitos com atraso."),
  // ---- gravidade + X ----
  derivado("fornalha_estelar", "Fornalha Estelar", ["gravidade", "fogo"], "O cora\xE7\xE3o de uma estrela: fus\xE3o que consome tudo por perto."),
  derivado("voragem", "Voragem", ["gravidade", "agua"], "Redemoinho colossal: engole e afoga em espiral."),
  derivado("colapso", "Colapso", ["gravidade", "terra"], "Desabamento: o terreno afunda sobre os inimigos."),
  derivado("vacuo", "V\xE1cuo", ["gravidade", "ar"], "Aus\xEAncia de ar: sufoca e implode de dentro."),
  derivado("magnetar", "Magnetar", ["gravidade", "eletricidade"], "Campo magn\xE9tico estelar: prende, atrai e eletrocuta."),
  derivado("singularidade", "Singularidade", ["gravidade", "arcano"], "Ponto de massa infinita: dobra as regras da realidade.", { fator: 1.25, minimo: 12 }),
  derivado("buraco_negro", "Buraco Negro", ["gravidade", "sombra"], "Nem a luz escapa: engole tudo num ponto de trevas.", { fator: 1.25, minimo: 12 }),
  derivado("halo_gravitacional", "Halo Gravitacional", ["gravidade", "luz"], "Lente de luz curvada: cega e revela ao mesmo tempo."),
  derivado("jugo", "Jugo", ["gravidade", "vileza"], "O peso da opress\xE3o: prende o alvo esmagado ao solo."),
  derivado("implosao", "Implos\xE3o", ["gravidade", "morte"], "Colapso interno: comprime o alvo at\xE9 o fim."),
  derivado("ancora_vital", "\xC2ncora Vital", ["gravidade", "vida"], "Massa que fixa a alma: impede que os aliados caiam."),
  derivado("peso_descomunal", "Peso Descomunal", ["gravidade", "vigor"], "For\xE7a multiplicada: golpes que carregam toneladas."),
  derivado("ariete", "Ar\xEDete", ["gravidade", "marcial"], "A arma que pesa mundos: impacto que atravessa muralhas."),
  derivado("dilatacao", "Dilata\xE7\xE3o", ["gravidade", "tempo"], "O tempo curvado pela massa: retarda tudo num campo.", { fator: 1.25, minimo: 12 }),
  derivado("onda_de_choque", "Onda de Choque", ["gravidade", "som"], "Pulso gravitacional sonoro: empurra e atordoa em anel."),
  // ---- espaço + X ----
  derivado("meteoro", "Meteoro", ["espaco", "fogo"], "Rocha em chamas do c\xE9u: impacto devastador em \xE1rea."),
  derivado("cometa", "Cometa", ["espaco", "agua"], "Bola de gelo sideral: risca o c\xE9u e congela ao cair."),
  derivado("asteroide", "Asteroide", ["espaco", "terra"], "Fragmento de mundo: bombardeio de rocha do espa\xE7o."),
  derivado("estratosfera", "Estratosfera", ["espaco", "ar"], "O ar rarefeito das alturas: levita e sufoca l\xE1 em cima."),
  derivado("pulsar", "Pulsar", ["espaco", "eletricidade"], "Farol estelar: pulsos de energia em intervalos precisos."),
  derivado("portal", "Portal", ["espaco", "arcano"], "Dobra do espa\xE7o: teleporte, banimento e reposicionamento."),
  derivado("vazio", "Vazio", ["espaco", "sombra"], "O Nada entre estrelas: apaga o que toca.", { fator: 1.25, minimo: 12 }),
  derivado("constelacao", "Constela\xE7\xE3o", ["espaco", "luz"], "Mapa de estrelas: guia, aben\xE7oa e marca alvos."),
  derivado("devorador", "Devorador", ["espaco", "vileza"], "O que vem de al\xE9m: horror c\xF3smico que n\xE3o deveria existir."),
  derivado("nebulosa", "Nebulosa", ["espaco", "morte"], "Ber\xE7o e t\xFAmulo de estrelas: n\xE9voa que mata e cria."),
  derivado("semente_estelar", "Semente Estelar", ["espaco", "vida"], "Vida vinda do cosmos: brota onde nada deveria crescer."),
  derivado("gigante_estelar", "Gigante Estelar", ["espaco", "vigor"], "Corpo de propor\xE7\xF5es c\xF3smicas: for\xE7a al\xE9m da escala."),
  derivado("lamina_sideral", "L\xE2mina Sideral", ["espaco", "marcial"], "Corte que atravessa a dist\xE2ncia: fende o pr\xF3prio espa\xE7o."),
  derivado("continuum", "Continuum", ["espaco", "tempo"], "Espa\xE7o-tempo dominado: mover-se por onde e quando quiser.", { fator: 1.3, minimo: 12 }),
  derivado("silencio_cosmico", "Sil\xEAncio C\xF3smico", ["espaco", "som"], "O v\xE1cuo n\xE3o propaga som: sufoca can\xE7\xF5es e magias."),
  derivado("dobra", "Dobra", ["espaco", "gravidade"], "O espa\xE7o curvado sobre si: encurta dist\xE2ncias e esmaga.", { fator: 1.25, minimo: 12 }),
  // ---- triplas ----
  derivado("chama_demoniaca", "Chama Demon\xEDaca", ["fogo", "vileza", "morte"], "Fogo alimentado por pacto e morte: queima corpo, alma e contrato."),
  derivado("paradoxo", "Paradoxo", ["tempo", "arcano", "morte"], "Vida e morte fora de ordem: desfaz causas e efeitos."),
  derivado("big_bang", "Big Bang", ["espaco", "gravidade", "tempo"], "O in\xEDcio e o fim de tudo: a cria\xE7\xE3o comprimida num instante.", { fator: 1.35, minimo: 15 }),
  derivado("sinfonia", "Sinfonia", ["som", "luz", "vida"], "A can\xE7\xE3o da cria\xE7\xE3o: aura que cura, protege e inspira em grande \xE1rea."),
  derivado("furacao", "Furac\xE3o", ["agua", "ar", "eletricidade"], "A tempestade perfeita: \xE1rea devastadora que se move sozinha."),
  derivado("selva", "Selva", ["agua", "terra", "vida"], "Ecossistema vivo: terreno inteiro que luta por voc\xEA."),
  derivado("abominacao", "Abomina\xE7\xE3o", ["sombra", "morte", "vileza"], "O horror completo: criaturas que n\xE3o deveriam existir."),
  derivado("eclipse", "Eclipse", ["luz", "sombra", "arcano"], "O instante em que os opostos se alinham: anula magias alheias."),
  derivado("reencarnacao", "Reencarna\xE7\xE3o", ["vida", "morte", "arcano"], "O ciclo dominado: retorno da morte e segunda chance."),
  derivado("sobrecarga", "Sobrecarga", ["eletricidade", "arcano", "vigor"], "Corpo-condutor: velocidade e poder al\xE9m do limite seguro."),
  derivado("ascensao", "Ascens\xE3o", ["luz", "vida", "vigor"], "Forma exaltada: transcende brevemente a condi\xE7\xE3o mortal."),
  derivado("nucleo", "N\xFAcleo", ["fogo", "terra", "eletricidade"], "O cora\xE7\xE3o do mundo: erup\xE7\xF5es magn\xE9ticas e magma pressurizado."),
  derivado("avatar_de_guerra", "Avatar de Guerra", ["marcial", "vigor", "arcano"], "A guerra encarnada: cem armas orbitando um corpo perfeito."),
  // ---- amplas e especiais ----
  derivado(
    "primordial",
    "Primordial",
    ["fogo", "agua", "terra", "ar", "eletricidade"],
    "Os cinco primais em harmonia: comanda o pr\xF3prio terreno da batalha.",
    { fator: 1.35, minimo: 12, tipo: "especial" }
  ),
  derivado(
    "ciclo",
    "Ciclo",
    ["vida", "morte", "luz", "sombra"],
    "Nascimento, morte, dia e noite: inverte estados \u2014 cura vira dano, buff vira maldi\xE7\xE3o.",
    { fator: 1.35, minimo: 12, tipo: "especial" }
  ),
  derivado(
    "nulo",
    "Nulo",
    ["fogo", "agua", "terra", "ar", "eletricidade", "arcano", "sombra", "luz", "vileza", "morte", "vida", "vigor", "marcial", "tempo", "som", "gravidade", "espaco"],
    "O elemento de quem dominou todos: nega, absorve e devolve qualquer coisa.",
    { fator: 1.4, minimo: 8, tipo: "especial" }
  )
];
var DERIVADOS = Object.fromEntries(
  DERIVADOS_LISTA.map((d) => [d.id, d])
);
var ELEMENTOS = {
  ...ELEMENTOS_BASE,
  ...DERIVADOS
};
function elementosBase() {
  return Object.values(ELEMENTOS_BASE);
}
function elementosDerivados() {
  return DERIVADOS_LISTA;
}
var SINERGIAS = [
  { de: "vida", para: [...ELEMENTOS_PRIMAIS], razao: 0.2 },
  { de: "fogo", para: ["vileza"], razao: 0.1 },
  { de: "vileza", para: ["fogo"], razao: 0.1 },
  { de: "sombra", para: ["morte"], razao: 0.1 },
  { de: "morte", para: ["sombra"], razao: 0.1 },
  { de: "luz", para: ["vida"], razao: 0.1 },
  { de: "vida", para: ["luz"], razao: 0.1 },
  { de: "vigor", para: ["vida"], razao: 0.1 },
  { de: "vida", para: ["vigor"], razao: 0.1 },
  { de: "marcial", para: ["vigor"], razao: 0.1 },
  { de: "vigor", para: ["marcial"], razao: 0.1 },
  { de: "arcano", para: ["tempo"], razao: 0.08 },
  { de: "tempo", para: ["arcano"], razao: 0.08 },
  { de: "arcano", para: ["espaco"], razao: 0.08 },
  { de: "espaco", para: ["gravidade"], razao: 0.08 },
  { de: "gravidade", para: ["espaco"], razao: 0.08 },
  { de: "eletricidade", para: ["som"], razao: 0.05 },
  { de: "ar", para: ["som"], razao: 0.05 },
  { de: "terra", para: ["vigor"], razao: 0.05 },
  { de: "eletricidade", para: ["ar"], razao: 0.05 },
  // Arcano é magia pura: alimenta de leve tudo que não é físico.
  {
    de: "arcano",
    para: ["fogo", "agua", "terra", "ar", "eletricidade", "sombra", "luz"],
    razao: 0.05
  }
];

// src/registry/afinidades.ts
var MULT_FORTE = 1.5;
var MULT_FRACO = 0.5;
var MULT_NEUTRO = 1;
var AFINIDADES = {
  fogo: { forteContra: ["vida", "terra"], fracoContra: ["agua"] },
  agua: { forteContra: ["fogo"], fracoContra: ["eletricidade", "vida"] },
  terra: { forteContra: ["eletricidade", "som"], fracoContra: ["ar", "fogo"] },
  ar: { forteContra: ["terra"], fracoContra: ["eletricidade"] },
  eletricidade: { forteContra: ["agua", "ar"], fracoContra: ["terra"] },
  arcano: { forteContra: ["vigor", "marcial", "tempo", "espaco"], fracoContra: ["sombra"] },
  sombra: { forteContra: ["luz", "arcano"], fracoContra: ["luz"] },
  luz: { forteContra: ["sombra", "morte", "vileza"], fracoContra: [] },
  vileza: { forteContra: ["vida"], fracoContra: ["luz"] },
  morte: { forteContra: ["vida"], fracoContra: ["luz"] },
  vida: { forteContra: ["morte", "vileza"], fracoContra: ["fogo", "morte"] },
  vigor: { forteContra: [], fracoContra: ["arcano", "tempo"] },
  marcial: { forteContra: [], fracoContra: ["arcano", "tempo"] },
  // Tempo desgasta a vida e supera o físico; o arcano o domina.
  tempo: { forteContra: ["vida", "vigor", "marcial"], fracoContra: ["arcano", "espaco"] },
  // Som ressoa e estilhaça; a terra o absorve.
  som: { forteContra: ["arcano", "ar"], fracoContra: ["terra"] },
  // Gravidade esmaga o físico e o voo; o espaço a curva.
  gravidade: { forteContra: ["ar", "vigor", "marcial"], fracoContra: ["espaco"] },
  // Espaço supera gravidade e tempo; o arcano o mapeia.
  espaco: { forteContra: ["gravidade", "tempo"], fracoContra: ["arcano"] }
};
function baseDominanteDoDef(def) {
  if (!def) return "arcano";
  if (def.tipo === "base") return def.id;
  return def.receita?.[0]?.elemento ?? "arcano";
}
function baseDominante(elemento) {
  return baseDominanteDoDef(ELEMENTOS[elemento]);
}
function efetividade(atacante, alvo) {
  const base = baseDominante(atacante);
  const af = AFINIDADES[base];
  if (!af) return MULT_NEUTRO;
  if (af.forteContra.includes(alvo)) return MULT_FORTE;
  if (af.fracoContra.includes(alvo)) return MULT_FRACO;
  return MULT_NEUTRO;
}
function rotuloEfetividade(mult) {
  if (mult > 1) return "forte";
  if (mult < 1) return "fraco";
  return "neutro";
}

// src/registry/combinacoes.ts
var ARIDADE_MAXIMA = 4;
var FATOR_BASE_ARIDADE = { 2: 1.15, 3: 1.32, 4: 1.52 };
var MINIMO_BASE_ARIDADE = { 2: 10, 3: 14, 4: 18 };
var FATOR_POR_TENSAO = 0.1;
var FATOR_POR_HARMONIA = 0.03;
var MINIMO_POR_TENSAO = 4;
var MINIMO_POR_HARMONIA = 2;
var LIMIAR_PARADOXO = 0.5;
var LIMIAR_TENSAO = 0.25;
var LIMIAR_HARMONIA = 0.5;
var LEXICO = {
  fogo: { adjetivo: { m: "\xCDgneo", f: "\xCDgnea" }, dominio: "Fornalha", genero: "m" },
  agua: { adjetivo: { m: "Aqu\xE1tico", f: "Aqu\xE1tica" }, dominio: "Correnteza", genero: "f" },
  terra: { adjetivo: { m: "Tel\xFArico", f: "Tel\xFArica" }, dominio: "Solo", genero: "f" },
  ar: { adjetivo: { m: "Et\xE9reo", f: "Et\xE9rea" }, dominio: "Ventania", genero: "m" },
  eletricidade: { adjetivo: { m: "Voltaico", f: "Voltaica" }, dominio: "Corrente", genero: "f" },
  arcano: { adjetivo: { m: "Arcano", f: "Arcana" }, dominio: "Segredo", genero: "m" },
  sombra: { adjetivo: { m: "Umbrio", f: "Umbria" }, dominio: "Penumbra", genero: "f" },
  luz: { adjetivo: { m: "Radiante", f: "Radiante" }, dominio: "Aurora", genero: "f" },
  vileza: { adjetivo: { m: "Profano", f: "Profana" }, dominio: "Pacto", genero: "f" },
  morte: { adjetivo: { m: "F\xFAnebre", f: "F\xFAnebre" }, dominio: "Sepulcro", genero: "f" },
  vida: { adjetivo: { m: "Vivaz", f: "Vivaz" }, dominio: "Seiva", genero: "f" },
  vigor: { adjetivo: { m: "Bruto", f: "Bruta" }, dominio: "\xCDmpeto", genero: "m" },
  marcial: { adjetivo: { m: "Marcial", f: "Marcial" }, dominio: "Arte da L\xE2mina", genero: "m" },
  tempo: { adjetivo: { m: "Eterno", f: "Eterna" }, dominio: "Era", genero: "m" },
  som: { adjetivo: { m: "Sonoro", f: "Sonora" }, dominio: "Eco", genero: "m" },
  gravidade: { adjetivo: { m: "Denso", f: "Densa" }, dominio: "Peso", genero: "f" },
  espaco: { adjetivo: { m: "Sideral", f: "Sideral" }, dominio: "Vazio", genero: "m" }
};
var GENERO_EXCECOES = {
  // gregos em -ma são masculinos apesar da terminação
  Miasma: "m",
  Plasma: "m",
  Prisma: "m",
  Enigma: "m",
  Carisma: "m",
  Dogma: "m",
  // outros que a terminação engana
  Parasita: "m",
  Cometa: "m",
  Tit\u00E3: "m",
  F\u00EAnix: "f",
  Mar\u00E9: "f",
  Nascente: "f",
  Tempestade: "f",
  Aljava: "f",
  Ponte: "f",
  Fonte: "f",
  Corrente: "f",
  Serpente: "f"
};
function generoDoNome(nome) {
  const cabeca = nome.split(/[\s-]/)[0];
  const excecao = GENERO_EXCECOES[cabeca];
  if (excecao) return excecao;
  if (/(ção|são)$/i.test(cabeca)) return "f";
  if (/(dade|gem|ice|ência|ância|eza|ura)$/i.test(cabeca)) return "f";
  if (/[aã]$/i.test(cabeca)) return "f";
  return "m";
}
function preposicao(nome) {
  return generoDoNome(nome) === "f" ? "da" : "do";
}
var BASES = elementosBase().map((e) => e.id);
var ORDEM = new Map(BASES.map((id, i) => [id, i]));
function ordenarComponentes(comps) {
  return [...comps].sort((a2, b) => (ORDEM.get(a2) ?? 99) - (ORDEM.get(b) ?? 99));
}
function chaveCombinacao(comps) {
  return ordenarComponentes(comps).join("+");
}
var INDICE_CURADAS = /* @__PURE__ */ new Map();
for (const def of Object.values(ELEMENTOS)) {
  if (!def.receita) continue;
  INDICE_CURADAS.set(
    chaveCombinacao(def.receita.map((c3) => c3.elemento)),
    def.id
  );
}
function nomeDoPar(a2, b) {
  const id = INDICE_CURADAS.get(chaveCombinacao([a2, b]));
  return id ? ELEMENTOS[id].nome : void 0;
}
function relacao(a2, b) {
  const afA = AFINIDADES[a2];
  const afB = AFINIDADES[b];
  const oposto = afA.forteContra.includes(b) || afA.fracoContra.includes(b) || afB.forteContra.includes(a2) || afB.fracoContra.includes(a2);
  if (oposto) return "oposto";
  const aliado = SINERGIAS.some((s) => s.de === a2 && s.para.includes(b)) || SINERGIAS.some((s) => s.de === b && s.para.includes(a2));
  return aliado ? "aliado" : "neutro";
}
function coesaoDe(comps) {
  let opostos = 0;
  let aliados = 0;
  let total = 0;
  for (let i = 0; i < comps.length; i++) {
    for (let j = i + 1; j < comps.length; j++) {
      total++;
      const r = relacao(comps[i], comps[j]);
      if (r === "oposto") opostos++;
      else if (r === "aliado") aliados++;
    }
  }
  const tensao = total ? opostos / total : 0;
  const harmonia = total ? aliados / total : 0;
  let coerencia = "neutra";
  if (tensao >= LIMIAR_PARADOXO) coerencia = "paradoxo";
  else if (tensao >= LIMIAR_TENSAO) coerencia = "tensao";
  else if (harmonia >= LIMIAR_HARMONIA) coerencia = "harmonia";
  return { tensao, harmonia, coerencia };
}
var ROTULO_COERENCIA = {
  harmonia: "Harm\xF4nica",
  neutra: "Neutra",
  tensao: "Em Tens\xE3o",
  paradoxo: "Paradoxal"
};
var DESCRICAO_COERENCIA = {
  harmonia: "Os componentes j\xE1 se alimentam: barata de sustentar, pot\xEAncia contida.",
  neutra: "Componentes independentes: custo e pot\xEAncia medianos.",
  tensao: "For\xE7as que se negam parcialmente: exige mais de cada parte e paga melhor.",
  paradoxo: "A maioria dos componentes se op\xF5e: o extremo do custo e do poder."
};
function fatorDeCombinacao(comps, coesao = coesaoDe(comps)) {
  const base = FATOR_BASE_ARIDADE[comps.length] ?? 1 + 0.2 * (comps.length - 1);
  const f = base + FATOR_POR_TENSAO * coesao.tensao - FATOR_POR_HARMONIA * coesao.harmonia;
  return Math.round(f * 1e3) / 1e3;
}
function minimoDeCombinacao(comps, coesao = coesaoDe(comps)) {
  const base = MINIMO_BASE_ARIDADE[comps.length] ?? 10 + 4 * (comps.length - 2);
  return Math.max(
    1,
    Math.round(base + MINIMO_POR_TENSAO * coesao.tensao - MINIMO_POR_HARMONIA * coesao.harmonia)
  );
}
function perfilDeCombinacao(comps) {
  const media = { dano: 0, controle: 0, cura: 0, defesa: 0, suporte: 0 };
  for (const c3 of comps) {
    const p = ELEMENTOS[c3].pesos;
    media.dano += p.dano / comps.length;
    media.controle += p.controle / comps.length;
    media.cura += p.cura / comps.length;
    media.defesa += p.defesa / comps.length;
    media.suporte += p.suporte / comps.length;
  }
  return media;
}
function nomeProcedural(comps) {
  const [a2, b, c3, d] = ordenarComponentes(comps);
  if (comps.length === 3) {
    const par = nomeDoPar(a2, b) ?? `${ELEMENTOS[a2].nome}-${ELEMENTOS[b].nome}`;
    const g = generoDoNome(par);
    return `${par} ${LEXICO[c3].adjetivo[g]}`;
  }
  if (comps.length === 4) {
    const par1 = nomeDoPar(a2, b) ?? `${ELEMENTOS[a2].nome}-${ELEMENTOS[b].nome}`;
    const par2 = nomeDoPar(c3, d) ?? `${ELEMENTOS[c3].nome}-${ELEMENTOS[d].nome}`;
    return `${par1} ${preposicao(par2)} ${par2}`;
  }
  return ordenarComponentes(comps).map((x) => ELEMENTOS[x].nome).join("-");
}
var FRASE_PERFIL = {
  dano: "poder destrutivo",
  controle: "dom\xEDnio do campo",
  cura: "restaura\xE7\xE3o",
  defesa: "prote\xE7\xE3o",
  suporte: "amplifica\xE7\xE3o"
};
function descricaoProcedural(comps, coesao = coesaoDe(comps)) {
  const perfil = perfilDeCombinacao(comps);
  const eixos = Object.keys(perfil).filter((k) => perfil[k] > 0).sort((x, y) => perfil[y] - perfil[x]);
  const nomes = ordenarComponentes(comps).map((c3) => ELEMENTOS[c3].nome);
  const lista = `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
  const foco = eixos.length >= 2 ? `${FRASE_PERFIL[eixos[0]]} com ${FRASE_PERFIL[eixos[1]]}` : eixos.length === 1 ? FRASE_PERFIL[eixos[0]] : "equil\xEDbrio sem foco";
  const tom = coesao.coerencia === "paradoxo" ? "Um paradoxo est\xE1vel" : coesao.coerencia === "tensao" ? "Uma corrente em tens\xE3o" : coesao.coerencia === "harmonia" ? "Uma corrente harm\xF4nica" : "Uma converg\xEAncia";
  return `${tom}: ${lista} numa s\xF3 forma \u2014 ${foco}.`;
}
var c = (id, nome, componentes, descricao, opts = {}) => ({ id, nome, componentes, descricao, ...opts });
var CURADAS = [
  // ---------------- triplas: os primais e o clima ----------------
  c("vulcao", "Vulc\xE3o", ["fogo", "terra", "ar"], "A montanha que cospe fogo: erup\xE7\xE3o, cinza e c\xE9u escurecido."),
  c("geiser", "G\xEAiser", ["fogo", "agua", "terra"], "Press\xE3o subterr\xE2nea: jatos escaldantes que irrompem do ch\xE3o."),
  c("nevasca", "Nevasca", ["agua", "ar", "terra"], "Tempestade branca: congela, cega e enterra sob a neve."),
  c("monsoes", "Mon\xE7\xE3o", ["agua", "ar", "vida"], "A chuva que traz a esta\xE7\xE3o: dil\xFAvio que faz tudo brotar."),
  c("deserto", "Deserto", ["fogo", "terra", "tempo"], "A paci\xEAncia da areia: tudo que entra seca e vira p\xF3."),
  c("aurora_boreal", "Aurora Boreal", ["ar", "eletricidade", "luz"], "Cortina viva no c\xE9u: hipnotiza e recarrega quem olha."),
  c("relampago_seco", "Rel\xE2mpago Seco", ["fogo", "ar", "eletricidade"], "A tempestade sem chuva: incendeia o que atinge."),
  c("permafrost", "Permafrost", ["agua", "terra", "tempo"], "Gelo que nunca derreteu: prende o que toca em eras de imobilidade."),
  // ---------------- triplas: o corpo e a lâmina ----------------
  c("gladiador", "Gladiador", ["marcial", "vigor", "som"], "A arena encarnada: cada golpe \xE9 aplaudido e ecoa mais forte."),
  c("lamina_do_juizo", "L\xE2mina do Ju\xEDzo", ["marcial", "luz", "morte"], "A espada que sentencia: corta o que j\xE1 foi julgado culpado."),
  c("duelista_temporal", "Duelista Temporal", ["marcial", "tempo", "ar"], "O golpe que chega antes: aparar, prever e ferir fora de ordem."),
  c("punho_gravitico", "Punho Grav\xEDtico", ["marcial", "gravidade", "vigor"], "O soco que carrega um mundo: impacto que afunda o alvo no ch\xE3o."),
  c("cacador_de_almas", "Ca\xE7ador de Almas", ["marcial", "morte", "sombra"], "A l\xE2mina que n\xE3o corta a carne: colhe direto o que anima o corpo."),
  c("arauto", "Arauto", ["marcial", "som", "luz"], "Aquele que anuncia a batalha: o brado vale por um ex\xE9rcito."),
  // ---------------- triplas: as escolas do horror ----------------
  c("peste_negra", "Peste Negra", ["morte", "vileza", "agua"], "A epidemia perfeita: viaja pela \xE1gua e n\xE3o deixa sobrevivente."),
  c("carniceiro", "Carniceiro", ["vileza", "vigor", "morte"], "For\xE7a sem freio: despeda\xE7a e se alimenta do que despeda\xE7ou."),
  c("ossario_vivo", "Oss\xE1rio Vivo", ["terra", "morte", "vida"], "O cemit\xE9rio que respira: os ossos brotam e caminham de novo."),
  c("coro_dos_afogados", "Coro dos Afogados", ["agua", "som", "morte"], "A can\xE7\xE3o que vem do fundo: quem escuta afunda junto."),
  c("sabbat", "Sab\xE1", ["vileza", "arcano", "sombra"], "O c\xEDrculo proibido: rituais que a realidade n\xE3o deveria permitir."),
  // ---------------- triplas: a graça ----------------
  c("milagre", "Milagre", ["luz", "vida", "arcano"], "O imposs\xEDvel concedido: reverte o que n\xE3o deveria ter volta."),
  c("coral_celeste", "Coral Celeste", ["som", "luz", "arcano"], "Vozes em un\xEDssono: b\xEAn\xE7\xE3o que se multiplica por quem canta."),
  c("jardim_eterno", "Jardim Eterno", ["vida", "tempo", "terra"], "O que foi plantado nunca murcha: cura que se recusa a expirar."),
  c("farol", "Farol", ["luz", "espaco", "som"], "O ponto fixo no caos: guia aliados de qualquer dist\xE2ncia."),
  c("bencao_marcial", "B\xEAn\xE7\xE3o Marcial", ["luz", "marcial", "vigor"], "Armas consagradas: a linha de frente que n\xE3o recua."),
  // ---------------- triplas: o cosmos ----------------
  c("supernova", "Supernova", ["espaco", "fogo", "gravidade"], "A morte de uma estrela: tudo num raio absurdo deixa de existir."),
  c("horizonte_de_eventos", "Horizonte de Eventos", ["gravidade", "espaco", "sombra"], "O ponto sem retorno: o que cruza n\xE3o volta, nem a informa\xE7\xE3o."),
  c("via_lactea", "Via L\xE1ctea", ["espaco", "luz", "arcano"], "O mapa das estrelas: poder retirado da pr\xF3pria posi\xE7\xE3o do c\xE9u."),
  c("pulso_cosmico", "Pulso C\xF3smico", ["espaco", "som", "eletricidade"], "A batida do universo: onda que atravessa o v\xE1cuo e o corpo."),
  c("materia_escura", "Mat\xE9ria Escura", ["gravidade", "sombra", "arcano"], "O que segura tudo e ningu\xE9m v\xEA: massa invis\xEDvel que puxa."),
  c("entropia_final", "Entropia Final", ["tempo", "morte", "gravidade"], "O fim marcado: tudo desacelera, esfria e para."),
  // ---------------- triplas: mente e vontade ----------------
  c("hipnose", "Hipnose", ["som", "arcano", "sombra"], "A voz que vira ordem: o alvo obedece achando que quis."),
  c("delirio", "Del\xEDrio", ["vileza", "som", "arcano"], "A realidade que n\xE3o fecha: o alvo luta contra o que n\xE3o existe."),
  c("memoria", "Mem\xF3ria", ["tempo", "arcano", "luz"], "O que j\xE1 foi ainda \xE9: recupera estados anteriores de aliados."),
  c("presagio", "Press\xE1gio", ["tempo", "sombra", "espaco"], "Ver o golpe antes dele partir: esquiva do que ainda n\xE3o aconteceu."),
  // ---------------- quádruplas: as grandes convergências ----------------
  c(
    "tempestade_perfeita",
    "Tempestade Perfeita",
    ["agua", "ar", "eletricidade", "som"],
    "Vento, \xE1gua, raio e trov\xE3o na mesma frente: o clima vira arma de cerco."
  ),
  c(
    "cataclismo",
    "Cataclismo",
    ["fogo", "terra", "gravidade", "espaco"],
    "O impacto que reescreve o mapa: cratera, magma e c\xE9u partido."
  ),
  c(
    "juizo_final",
    "Ju\xEDzo Final",
    ["luz", "morte", "som", "tempo"],
    "A trombeta e a senten\xE7a: o fim anunciado, cumprido no hor\xE1rio marcado."
  ),
  c(
    "senhor_da_praga",
    "Senhor da Praga",
    ["agua", "vileza", "morte", "vida"],
    "A doen\xE7a como jardim: o que mata tamb\xE9m se reproduz e se espalha."
  ),
  c(
    "avatar_elemental",
    "Avatar Elemental",
    ["fogo", "agua", "terra", "ar"],
    "Os quatro cl\xE1ssicos num corpo s\xF3: o elementalista completo.",
    { fator: 1.55 }
  ),
  c(
    "cavaleiro_absoluto",
    "Cavaleiro Absoluto",
    ["marcial", "vigor", "luz", "tempo"],
    "A t\xE9cnica perfeita, consagrada e fora do tempo: nenhum golpe se perde."
  ),
  c(
    "arquiteto_da_realidade",
    "Arquiteto da Realidade",
    ["arcano", "espaco", "tempo", "gravidade"],
    "As quatro alavancas da f\xEDsica: dobra o que existe onde e quando quiser.",
    { fator: 1.6, minimo: 20 }
  ),
  c(
    "sinfonia_do_caos",
    "Sinfonia do Caos",
    ["som", "vileza", "sombra", "arcano"],
    "A orquestra errada de prop\xF3sito: cada acorde desmonta uma certeza."
  ),
  c(
    "genesis",
    "G\xEAnese",
    ["vida", "luz", "terra", "agua"],
    "O primeiro dia: onde passa, o mundo come\xE7a de novo."
  ),
  c(
    "ragnarok",
    "Ragnar\xF6k",
    ["fogo", "morte", "gravidade", "tempo"],
    "O crep\xFAsculo dos deuses: fogo, fim, peso e a hora marcada.",
    { fator: 1.6, minimo: 20 }
  ),
  c(
    "leviata",
    "Leviat\xE3",
    ["agua", "gravidade", "morte", "sombra"],
    "O que vive na fossa: press\xE3o, escurid\xE3o e fome antigas."
  ),
  c(
    "titano_forjado",
    "Tit\xE3 Forjado",
    ["terra", "fogo", "marcial", "vigor"],
    "Nascido da bigorna: corpo de metal vivo que empunha a pr\xF3pria montanha."
  ),
  c(
    "sopro_do_dragao",
    "Sopro do Drag\xE3o",
    ["fogo", "ar", "vigor", "marcial"],
    "A heran\xE7a drac\xF4nica: h\xE1lito incandescente e escamas que aparam l\xE2minas."
  ),
  c(
    "ceifador_estelar",
    "Ceifador Estelar",
    ["morte", "espaco", "marcial", "sombra"],
    "A foice que corta a dist\xE2ncia: colhe do outro lado do vazio."
  ),
  c(
    "renascimento",
    "Renascimento",
    ["vida", "morte", "tempo", "luz"],
    "A roda completa e domada: morrer vira um passo do ciclo, n\xE3o o fim.",
    { fator: 1.6 }
  ),
  c(
    "vontade_absoluta",
    "Vontade Absoluta",
    ["arcano", "vigor", "som", "luz"],
    "A convic\xE7\xE3o que se imp\xF5e ao real: o que voc\xEA declara passa a valer."
  )
];
var CURADAS_POR_CHAVE = new Map(
  CURADAS.map((k) => [chaveCombinacao(k.componentes), k])
);
function infoDe(comps) {
  const componentes = ordenarComponentes(comps);
  const chave = chaveCombinacao(componentes);
  const curadaExistente = INDICE_CURADAS.get(chave);
  const curadaNova = CURADAS_POR_CHAVE.get(chave);
  const coesao = coesaoDe(componentes);
  const defExistente = curadaExistente ? ELEMENTOS[curadaExistente] : void 0;
  return {
    id: curadaExistente ?? curadaNova?.id ?? `comb_${componentes.join("_")}`,
    componentes,
    aridade: componentes.length,
    tensao: coesao.tensao,
    harmonia: coesao.harmonia,
    coerencia: coesao.coerencia,
    fatorPotencia: defExistente?.fatorPotencia ?? curadaNova?.fator ?? fatorDeCombinacao(componentes, coesao),
    nivelMinimo: defExistente?.receita?.[0]?.nivelMinimo ?? curadaNova?.minimo ?? minimoDeCombinacao(componentes, coesao),
    curada: Boolean(curadaExistente || curadaNova)
  };
}
function enumerar(aridade) {
  const saida = [];
  const atual = [];
  const rec = (inicio) => {
    if (atual.length === aridade) {
      saida.push(infoDe(atual));
      return;
    }
    for (let i = inicio; i < BASES.length; i++) {
      atual.push(BASES[i]);
      rec(i + 1);
      atual.pop();
    }
  };
  rec(0);
  return saida;
}
var TRIPLAS = enumerar(3);
var QUADRUPLAS = enumerar(4);
var TODAS_COMBINACOES = [...TRIPLAS, ...QUADRUPLAS];
var INFO_POR_ID = new Map(
  TODAS_COMBINACOES.map((k) => [k.id, k])
);
var INFO_POR_CHAVE = new Map(
  TODAS_COMBINACOES.map((k) => [chaveCombinacao(k.componentes), k])
);
function combinacaoInfo(id) {
  return INFO_POR_ID.get(id);
}
function combinacaoInfoPorComponentes(comps) {
  return INFO_POR_CHAVE.get(chaveCombinacao(comps));
}
var CACHE_DEF = /* @__PURE__ */ new Map();
function materializar(info) {
  const curada = CURADAS_POR_CHAVE.get(chaveCombinacao(info.componentes));
  const coesao = { tensao: info.tensao, harmonia: info.harmonia, coerencia: info.coerencia };
  return {
    id: info.id,
    nome: curada?.nome ?? nomeProcedural(info.componentes),
    tipo: "derivado",
    fatorPotencia: info.fatorPotencia,
    pesos: perfilDeCombinacao(info.componentes),
    descricao: curada?.descricao ?? descricaoProcedural(info.componentes, coesao),
    receita: info.componentes.map((elemento) => ({
      elemento,
      nivelMinimo: info.nivelMinimo
    }))
  };
}
function elementoDef(id) {
  const direto = ELEMENTOS[id];
  if (direto) return direto;
  const cache = CACHE_DEF.get(id);
  if (cache) return cache;
  const info = INFO_POR_ID.get(id);
  if (!info) return void 0;
  const def = materializar(info);
  CACHE_DEF.set(id, def);
  return def;
}
function elementoDePorComponentes(comps) {
  const unicos = ordenarComponentes([...new Set(comps)]);
  if (unicos.length === 0) return void 0;
  if (unicos.length === 1) return ELEMENTOS[unicos[0]];
  const info = combinacaoInfoPorComponentes(unicos);
  if (info) return elementoDef(info.id);
  const id = INDICE_CURADAS.get(chaveCombinacao(unicos));
  return id ? ELEMENTOS[id] : void 0;
}
function nomeElemento(id) {
  return elementoDef(id)?.nome ?? id;
}
function aridadeDe(id) {
  return elementoDef(id)?.receita?.length ?? 1;
}
function baseDominanteDe(id) {
  return baseDominanteDoDef(elementoDef(id));
}
function efetividadeDe(atacante, alvo) {
  const af = AFINIDADES[baseDominanteDe(atacante)];
  if (!af) return MULT_NEUTRO;
  if (af.forteContra.includes(alvo)) return MULT_FORTE;
  if (af.fracoContra.includes(alvo)) return MULT_FRACO;
  return MULT_NEUTRO;
}
function progressoCombinacao(info, niveis) {
  let soma = 0;
  for (const comp of info.componentes) {
    soma += Math.min(1, (niveis[comp] ?? 0) / info.nivelMinimo);
  }
  return soma / info.componentes.length;
}
function combinacoesRelevantes(niveis, opcoes = {}) {
  const { limite = 120, progressoMinimo = 0.5, aridades = [3, 4] } = opcoes;
  const saida = [];
  for (const info of TODAS_COMBINACOES) {
    if (!aridades.includes(info.aridade)) continue;
    const progresso = progressoCombinacao(info, niveis);
    if (progresso < progressoMinimo) continue;
    const nivel = progresso >= 1 ? Math.min(...info.componentes.map((k) => niveis[k] ?? 0)) : 0;
    saida.push({ info, progresso, nivel });
  }
  saida.sort(
    (x, y) => y.nivel - x.nivel || y.progresso - x.progresso || Number(y.info.curada) - Number(x.info.curada) || x.info.id.localeCompare(y.info.id)
  );
  return saida.slice(0, limite);
}
function buscarCombinacoes(termo, limite = 40) {
  const alvo = termo.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (!alvo) return [];
  const saida = [];
  for (const info of TODAS_COMBINACOES) {
    const nome = (elementoDef(info.id)?.nome ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (nome.includes(alvo)) {
      saida.push(info);
      if (saida.length >= limite) break;
    }
  }
  return saida;
}
var PAR_POR_CHAVE = new Map(
  Object.values(ELEMENTOS).filter((d) => d.receita?.length === 2).map((d) => [chaveCombinacao(d.receita.map((c3) => c3.elemento)), d.id])
);
var CACHE_PAIS = /* @__PURE__ */ new Map();
function subCombinacoes(comps) {
  return comps.map((_, i) => comps.filter((__, j) => j !== i));
}
function paisDeCascata(id) {
  const cache = CACHE_PAIS.get(id);
  if (cache) return cache;
  const def = elementoDef(id);
  const declarados = def?.cascata?.pais;
  const receita = def?.receita?.map((c3) => c3.elemento) ?? [];
  let pais;
  if (declarados) {
    pais = [...declarados];
  } else if (receita.length <= 1) {
    pais = [];
  } else if (receita.length === 2) {
    pais = [...receita];
  } else {
    const comps = ordenarComponentes(receita);
    pais = subCombinacoes(comps).map((sub) => {
      if (sub.length === 2) return PAR_POR_CHAVE.get(chaveCombinacao(sub));
      return combinacaoInfoPorComponentes(sub).id;
    });
  }
  CACHE_PAIS.set(id, pais);
  return pais;
}

// src/engine/cascata.ts
var SINERGIAS_ALVO_UNICO = SINERGIAS.filter((s) => s.para.length === 1);
var BASE_IDS = elementosBase().map((d) => d.id);
function aridadeClamp(id) {
  return Math.min(4, Math.max(1, aridadeDe(id)));
}
function divisorDe(id, reducao) {
  const declarado = elementoDef(id)?.cascata?.divisor;
  const aridade = aridadeClamp(id);
  const base = declarado ?? DIVISOR_CASCATA[aridade];
  if (declarado !== void 0 || aridade !== 2) return base;
  return Math.max(1, base - reducao);
}
function destravavel(id) {
  const def = elementoDef(id);
  if (!def || def.tipo === "base") return false;
  return def.cascata?.destravavel !== false;
}
function combinacoesDe(itens, k) {
  const saida = [];
  const atual = [];
  const rec = (inicio) => {
    if (atual.length === k) {
      saida.push([...atual]);
      return;
    }
    for (let i = inicio; i <= itens.length - (k - atual.length); i++) {
      atual.push(itens[i]);
      rec(i + 1);
      atual.pop();
    }
  };
  rec(0);
  return saida;
}
function filhoDe(comps) {
  if (comps.length === 2) {
    const chave = ordenarComponentes(comps).join("+");
    return PAR_POR_CHAVE2.get(chave);
  }
  return combinacaoInfoPorComponentes(comps)?.id;
}
var PAR_POR_CHAVE2 = new Map(
  Object.values(ELEMENTOS).filter((d) => d.receita?.length === 2).map((d) => [ordenarComponentes(d.receita.map((c3) => c3.elemento)).join("+"), d.id])
);
function calcularCascata(diretosRecord, opcoes = {}) {
  const reducao = opcoes.reducaoDivisor ?? 0;
  const bonusTransbordo = opcoes.bonusTransbordo ?? 0;
  const diretos = /* @__PURE__ */ new Map();
  for (const [id, pts] of Object.entries(diretosRecord)) {
    if ((pts ?? 0) > 0 && elementoDef(id)) diretos.set(id, pts);
  }
  const transbordoSimples = /* @__PURE__ */ new Map();
  for (const s of SINERGIAS_ALVO_UNICO) {
    const origem = diretos.get(s.de) ?? 0;
    if (origem <= 0) continue;
    const bonus = Math.floor(origem * s.razao * (1 + bonusTransbordo));
    if (bonus <= 0) continue;
    const alvo = s.para[0];
    transbordoSimples.set(alvo, (transbordoSimples.get(alvo) ?? 0) + bonus);
  }
  const basesSemente = /* @__PURE__ */ new Set();
  for (const id of diretos.keys()) {
    const def = elementoDef(id);
    if (!def) continue;
    if (def.tipo === "base") basesSemente.add(id);
    else for (const c3 of def.receita ?? []) basesSemente.add(c3.elemento);
  }
  for (const alvo of transbordoSimples.keys()) basesSemente.add(alvo);
  const bases = BASE_IDS.filter((b) => basesSemente.has(b));
  const passivos = /* @__PURE__ */ new Map();
  const paraCascata = /* @__PURE__ */ new Map();
  const tocados = [];
  const registrar = (id, passivo) => {
    const direto = diretos.get(id) ?? 0;
    if (passivo <= 0 && direto <= 0) return;
    passivos.set(id, passivo);
    paraCascata.set(id, passivo + pesoDiretoNaCascata(aridadeClamp(id)) * direto);
    tocados.push(id);
  };
  for (const b of bases) {
    const direto = diretos.get(b) ?? 0;
    const bonus = transbordoSimples.get(b) ?? 0;
    const total = direto + bonus;
    if (total <= 0) continue;
    passivos.set(b, 0);
    paraCascata.set(b, total);
    tocados.push(b);
  }
  for (const aridade of [2, 3, 4]) {
    for (const comps of combinacoesDe(bases, aridade)) {
      const id = filhoDe(comps);
      if (!id) continue;
      const pais = paisDeCascata(id);
      const divisor = divisorDe(id, reducao);
      let menor = Infinity;
      for (const pai of pais) {
        const alimento = paraCascata.get(pai) ?? 0;
        const rendimento = Math.floor(alimento / divisor);
        if (rendimento < menor) menor = rendimento;
      }
      const passivo = pais.length > 0 && Number.isFinite(menor) ? menor : 0;
      registrar(id, passivo);
    }
  }
  for (const def of Object.values(ELEMENTOS)) {
    if (!def.cascata?.pais || passivos.has(def.id)) continue;
    const divisor = divisorDe(def.id, reducao);
    let menor = Infinity;
    for (const pai of def.cascata.pais) {
      const alimento = paraCascata.get(pai) ?? 0;
      const rendimento = Math.floor(alimento / divisor);
      if (rendimento < menor) menor = rendimento;
    }
    if (Number.isFinite(menor) && menor > 0) registrar(def.id, menor);
  }
  for (const id of diretos.keys()) {
    if (!passivos.has(id)) registrar(id, 0);
  }
  const efetivos = /* @__PURE__ */ new Map();
  for (const id of tocados) {
    efetivos.set(id, (passivos.get(id) ?? 0) + (diretos.get(id) ?? 0));
  }
  const destravados = new Set(BASE_IDS);
  const progressoDestravamento = /* @__PURE__ */ new Map();
  for (const id of tocados) {
    if (!destravavel(id)) continue;
    const limiar = LIMIAR_DESTRAVAMENTO[aridadeClamp(id)];
    const p = passivos.get(id) ?? 0;
    if (p >= limiar) destravados.add(id);
    else progressoDestravamento.set(id, { passivos: p, limiar });
  }
  return { passivos, diretos, efetivos, paraCascata, destravados, progressoDestravamento };
}
function podeReceberDireto(c3, id) {
  return c3.destravados.has(id);
}
function elementosAlocaveis(c3) {
  const basesCanonicas = BASE_IDS;
  const derivados = [...c3.destravados].filter((id) => elementoDef(id)?.tipo !== "base").sort((a2, b) => aridadeDe(a2) - aridadeDe(b) || a2.localeCompare(b));
  return [...basesCanonicas, ...derivados];
}
function custoDeAlocacao(diretos) {
  const porAridade = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const [id, pts] of Object.entries(diretos)) {
    if ((pts ?? 0) <= 0) continue;
    const aridade = aridadeClamp(id);
    porAridade[aridade] += pts * CUSTO_PONTO_ALOCACAO[aridade];
  }
  return {
    porAridade,
    total: porAridade[1] + porAridade[2] + porAridade[3] + porAridade[4]
  };
}

// src/registry/recursos.ts
var RECURSOS = {
  mana: {
    id: "mana",
    nome: "Mana",
    descricao: "Gasto cont\xEDnuo e previs\xEDvel; regenera a taxa constante.",
    poolBase: 100,
    poolPorProficiencia: 10,
    parametros: {
      regenBasePorSegundo: 5,
      regenPorProficiencia: 0.4
    }
  },
  fe: {
    id: "fe",
    nome: "F\xE9",
    descricao: "Cada uso aumenta o custo dos pr\xF3ximos; a penalidade decai com o tempo sem usar.",
    poolBase: 100,
    poolPorProficiencia: 8,
    parametros: {
      regenBasePorSegundo: 6,
      regenPorProficiencia: 0.4,
      /** Quanto de penalidade cada ponto de energia gasto acumula. */
      penalidadePorEnergia: 0.02,
      /** Meia-vida (s) da penalidade quando o recurso não é usado. */
      meiaVidaPenalidadeSegundos: 20,
      /** Proficiência reduz o acúmulo de penalidade (fração por ponto). */
      reducaoPenalidadePorProficiencia: 0.01,
      /** Multiplicador máximo de custo (trava de segurança). */
      multiplicadorMaximo: 4
    }
  },
  furia: {
    id: "furia",
    nome: "F\xFAria",
    descricao: "Gerada ao causar e receber dano; decai fora de combate; sem regenera\xE7\xE3o passiva.",
    poolBase: 100,
    poolPorProficiencia: 5,
    parametros: {
      ganhoPorDanoCausado: 0.5,
      ganhoPorDanoRecebido: 0.8,
      ganhoPorProficiencia: 0.02,
      decaimentoForaDeCombatePorSegundo: 3,
      segundosParaSairDeCombate: 5
    }
  },
  soullink: {
    id: "soullink",
    nome: "Soullink",
    descricao: "Paga o custo com a pr\xF3pria vida e amplifica o poder; nunca desce do limiar vital.",
    poolBase: 100,
    poolPorProficiencia: 10,
    parametros: {
      /** Regeneração de vida lenta. */
      regenBasePorSegundo: 1,
      regenPorProficiencia: 0.2,
      /** Skills pagas com vida rendem mais poder. */
      multiplicadorPoder: 1.3,
      /** Fração da vida abaixo da qual o elo se recusa a consumir. */
      limiarVidaFracao: 0.1
    }
  },
  ressonancia: {
    id: "ressonancia",
    nome: "Resson\xE2ncia",
    descricao: "Come\xE7a fraca e amplifica a cada uso consecutivo; parar de usar reseta o ac\xFAmulo.",
    poolBase: 100,
    poolPorProficiencia: 8,
    parametros: {
      regenBasePorSegundo: 5,
      regenPorProficiencia: 0.4,
      /** Quanto de multiplicador cada uso acumula. */
      acumuloPorUso: 0.1,
      /** Teto do multiplicador de poder acumulado. */
      multiplicadorPoderMaximo: 1.5,
      /** Segundos sem usar até o acúmulo resetar para o estado fraco. */
      janelaResetSegundos: 8
    }
  }
};

// src/registry/escolas.ts
var ESCOLAS = {
  combate_fisico: {
    id: "combate_fisico",
    nome: "Combate F\xEDsico",
    tipo: "marcial",
    entregaPadrao: "dano",
    pesos: { dano: 0.7, controle: 0, cura: 0, defesa: 0.3, suporte: 0 },
    descricao: "Corpo a corpo; escala com vigor e alimenta a f\xFAria."
  },
  longo_alcance: {
    id: "longo_alcance",
    nome: "Longo Alcance",
    tipo: "marcial",
    entregaPadrao: "dano",
    pesos: { dano: 0.9, controle: 0.1, cura: 0, defesa: 0, suporte: 0 },
    descricao: "Proj\xE9teis e precis\xE3o \xE0 dist\xE2ncia."
  },
  evocacao: {
    id: "evocacao",
    nome: "Evoca\xE7\xE3o",
    tipo: "magica",
    entregaPadrao: "invocacao",
    pesos: { dano: 0.6, controle: 0, cura: 0, defesa: 0.2, suporte: 0.2 },
    descricao: "Traz criaturas e construtos para lutar por voc\xEA."
  },
  conjuracao: {
    id: "conjuracao",
    nome: "Conjura\xE7\xE3o",
    tipo: "magica",
    entregaPadrao: "dano",
    pesos: { dano: 0.7, controle: 0.3, cura: 0, defesa: 0, suporte: 0 },
    descricao: "Molda o elemento em efeito direto: proj\xE9til, explos\xE3o, parede."
  },
  benca: {
    id: "benca",
    nome: "B\xEAn\xE7\xE3o (Buff)",
    tipo: "magica",
    entregaPadrao: "efeito",
    pesos: { dano: 0, controle: 0, cura: 0.3, defesa: 0.3, suporte: 0.4 },
    descricao: "Fortalece aliados: escudos, auras e \xEAxtase."
  },
  maldicao: {
    id: "maldicao",
    nome: "Maldi\xE7\xE3o (Debuff)",
    tipo: "magica",
    entregaPadrao: "efeito",
    pesos: { dano: 0.4, controle: 0.6, cura: 0, defesa: 0, suporte: 0 },
    descricao: "Enfraquece, envenena e amaldi\xE7oa inimigos."
  }
};

// src/registry/talentos.ts
var TALENTOS = {
  // ------------------- gerais -------------------
  area_ampliada: {
    id: "area_ampliada",
    nome: "\xC1rea Ampliada",
    descricao: "Aumenta o raio m\xE1ximo configur\xE1vel das suas skills (+2m/rank).",
    ranksMaximos: 5,
    efeitos: [{ tipo: "raio_maximo_bonus", valorPorRank: 2 }]
  },
  conjuracao_rapida: {
    id: "conjuracao_rapida",
    nome: "Conjura\xE7\xE3o R\xE1pida",
    descricao: "Reduz o tempo m\xEDnimo de conjura\xE7\xE3o (\u22120.1s/rank).",
    ranksMaximos: 5,
    efeitos: [{ tipo: "tempo_conjuracao_minimo_reducao", valorPorRank: 0.1 }]
  },
  alcance_estendido: {
    id: "alcance_estendido",
    nome: "Alcance Estendido",
    descricao: "Aumenta a dist\xE2ncia m\xE1xima de lan\xE7amento (+5m/rank).",
    ranksMaximos: 5,
    efeitos: [{ tipo: "alcance_bonus_metros", valorPorRank: 5 }]
  },
  canalizacao_profunda: {
    id: "canalizacao_profunda",
    nome: "Canaliza\xE7\xE3o Profunda",
    descricao: "Permite investir mais energia por skill (+10%/rank).",
    ranksMaximos: 5,
    efeitos: [{ tipo: "energia_maxima_bonus_fracao", valorPorRank: 0.1 }]
  },
  economia_de_recurso: {
    id: "economia_de_recurso",
    nome: "Economia de Recurso",
    descricao: "Reduz o custo efetivo das skills (\u22123%/rank).",
    ranksMaximos: 5,
    efeitos: [{ tipo: "custo_reducao_fracao", valorPorRank: 0.03 }]
  },
  persistencia: {
    id: "persistencia",
    nome: "Persist\xEAncia",
    descricao: "Efeitos cont\xEDnuos e invoca\xE7\xF5es duram mais (+15%/rank).",
    ranksMaximos: 3,
    efeitos: [{ tipo: "propriedade", chave: "duracao_bonus", rotulo: "Dura\xE7\xE3o de efeitos", valorPorRank: 0.15 }]
  },
  // ------------------- playstyle: entrega -------------------
  impacto_imediato: {
    id: "impacto_imediato",
    nome: "Impacto Imediato",
    descricao: "Especializa em dano instant\xE2neo (+5%/rank; exclui DoT).",
    ranksMaximos: 3,
    exclusivoCom: ["dano_ao_longo_do_tempo"],
    efeitos: [{ tipo: "foco_entrega", entrega: "instantaneo", bonusFracaoPorRank: 0.05 }]
  },
  dano_ao_longo_do_tempo: {
    id: "dano_ao_longo_do_tempo",
    nome: "Dano ao Longo do Tempo",
    descricao: "Especializa em efeitos cont\xEDnuos (+5%/rank; exclui Impacto Imediato).",
    ranksMaximos: 3,
    exclusivoCom: ["impacto_imediato"],
    efeitos: [{ tipo: "foco_entrega", entrega: "continuo", bonusFracaoPorRank: 0.05 }]
  },
  // ------------------- conjuração -------------------
  perfuracao: {
    id: "perfuracao",
    nome: "Perfura\xE7\xE3o",
    descricao: "Suas conjura\xE7\xF5es ignoram parte da defesa (10%/rank; exclui Estilha\xE7o).",
    ranksMaximos: 3,
    requisito: { escola: "conjuracao", nivelMinimo: 5 },
    exclusivoCom: ["estilhaco"],
    efeitos: [{ tipo: "propriedade", chave: "penetracao_defesa", rotulo: "Penetra\xE7\xE3o de defesa", valorPorRank: 0.1, escola: "conjuracao" }]
  },
  estilhaco: {
    id: "estilhaco",
    nome: "Estilha\xE7o",
    descricao: "Acertos em alvo \xFAnico respingam nos vizinhos (12%/rank; exclui Perfura\xE7\xE3o).",
    ranksMaximos: 3,
    requisito: { escola: "conjuracao", nivelMinimo: 5 },
    exclusivoCom: ["perfuracao"],
    efeitos: [{ tipo: "propriedade", chave: "respingo", rotulo: "Dano respingado", valorPorRank: 0.12, escola: "conjuracao" }]
  },
  eco_arcano: {
    id: "eco_arcano",
    nome: "Eco Arcano",
    descricao: "Chance da conjura\xE7\xE3o repetir de gra\xE7a (8%/rank).",
    ranksMaximos: 2,
    requisito: { escola: "conjuracao", nivelMinimo: 10 },
    efeitos: [{ tipo: "propriedade", chave: "eco", rotulo: "Chance de eco", valorPorRank: 0.08, escola: "conjuracao" }]
  },
  // ------------------- evocação -------------------
  enxame: {
    id: "enxame",
    nome: "Enxame",
    descricao: "Evoca mais criaturas, individualmente mais fracas (+1/rank; exclui Colosso).",
    ranksMaximos: 4,
    requisito: { escola: "evocacao", nivelMinimo: 5 },
    exclusivoCom: ["colosso"],
    efeitos: [{ tipo: "invocacao_quantidade_bonus", valorPorRank: 1 }]
  },
  colosso: {
    id: "colosso",
    nome: "Colosso",
    descricao: "Evoca menos criaturas, muito mais poderosas (+10%/rank; exclui Enxame).",
    ranksMaximos: 4,
    requisito: { escola: "evocacao", nivelMinimo: 5 },
    exclusivoCom: ["enxame"],
    efeitos: [{ tipo: "invocacao_potencia_bonus_fracao", valorPorRank: 0.1 }]
  },
  vinculo_marcial: {
    id: "vinculo_marcial",
    nome: "V\xEDnculo Marcial",
    descricao: "Suas evoca\xE7\xF5es herdam sua t\xE9cnica de combate f\xEDsico (+6%/rank).",
    ranksMaximos: 3,
    requisito: { escola: "combate_fisico", nivelMinimo: 5 },
    efeitos: [{ tipo: "invocacao_potencia_bonus_fracao", valorPorRank: 0.06 }]
  },
  simbiose: {
    id: "simbiose",
    nome: "Simbiose",
    descricao: "Suas criaturas curam voc\xEA com parte do dano que causam (5%/rank).",
    ranksMaximos: 3,
    requisito: { escola: "evocacao", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "simbiose", rotulo: "Dano das criaturas vira cura", valorPorRank: 0.05, escola: "evocacao" }]
  },
  autonomia: {
    id: "autonomia",
    nome: "Autonomia",
    descricao: "Criaturas ca\xE7am sozinhas e persistem longe de voc\xEA (exclui Comando).",
    ranksMaximos: 2,
    requisito: { escola: "evocacao", nivelMinimo: 10 },
    exclusivoCom: ["comando"],
    efeitos: [{ tipo: "propriedade", chave: "autonomia", rotulo: "Alcance de ca\xE7a das criaturas", valorPorRank: 0.5, escola: "evocacao" }]
  },
  comando: {
    id: "comando",
    nome: "Comando",
    descricao: "Criaturas pr\xF3ximas a voc\xEA ganham poder (+8%/rank; exclui Autonomia).",
    ranksMaximos: 2,
    requisito: { escola: "evocacao", nivelMinimo: 10 },
    exclusivoCom: ["autonomia"],
    efeitos: [{ tipo: "invocacao_potencia_bonus_fracao", valorPorRank: 0.08 }]
  },
  // ------------------- doma (captura + vínculo) -------------------
  instinto_de_caca: {
    id: "instinto_de_caca",
    nome: "Instinto de Ca\xE7a",
    descricao: "Aumenta o poder de captura de criaturas (+15%/rank).",
    ranksMaximos: 3,
    requisito: { escola: "evocacao", nivelMinimo: 5 },
    efeitos: [{ tipo: "propriedade", chave: "poder_captura", rotulo: "Poder de captura", valorPorRank: 0.15, escola: "evocacao" }]
  },
  vinculo_primal: {
    id: "vinculo_primal",
    nome: "V\xEDnculo Primal",
    descricao: "Desbloqueia a Doma: crie v\xEDnculo permanente com 1 criatura capturada.",
    ranksMaximos: 1,
    requisito: { escola: "evocacao", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "vinculo", rotulo: "V\xEDnculo de doma", valorPorRank: 1, escola: "evocacao" }]
  },
  matilha_domada: {
    id: "matilha_domada",
    nome: "Matilha Domada",
    descricao: "Cada rank vincula +1 criatura ao mesmo tempo (exclui Fera Alfa).",
    ranksMaximos: 3,
    requisito: { escola: "evocacao", nivelMinimo: 10 },
    exclusivoCom: ["fera_alfa"],
    efeitos: [{ tipo: "propriedade", chave: "capacidade_vinculo", rotulo: "Criaturas vinculadas", valorPorRank: 1, escola: "evocacao" }]
  },
  fera_alfa: {
    id: "fera_alfa",
    nome: "Fera Alfa",
    descricao: "Uma \xFAnica fera vinculada, muito mais poderosa (+12%/rank; exclui Matilha).",
    ranksMaximos: 3,
    requisito: { escola: "evocacao", nivelMinimo: 10 },
    exclusivoCom: ["matilha_domada"],
    efeitos: [{ tipo: "propriedade", chave: "poder_alfa", rotulo: "Poder da fera alfa", valorPorRank: 0.12, escola: "evocacao" }]
  },
  evolucao_da_fera: {
    id: "evolucao_da_fera",
    nome: "Evolu\xE7\xE3o da Fera",
    descricao: "Cada n\xEDvel de v\xEDnculo rende mais poder (+25%/rank sobre o v\xEDnculo).",
    ranksMaximos: 3,
    requisito: { escola: "evocacao", nivelMinimo: 10 },
    efeitos: [{ tipo: "propriedade", chave: "evolucao_vinculo", rotulo: "Ganho por n\xEDvel de v\xEDnculo", valorPorRank: 0.25, escola: "evocacao" }]
  },
  // ------------------- sinergia de combate & montaria -------------------
  sincronia_de_combate: {
    id: "sincronia_de_combate",
    nome: "Sincronia de Combate",
    descricao: "Voc\xEA e sua fera lutam em sincronia: +5%/rank de poder da criatura e do seu corpo a corpo.",
    ranksMaximos: 3,
    requisito: { escola: "combate_fisico", nivelMinimo: 5 },
    efeitos: [
      { tipo: "invocacao_potencia_bonus_fracao", valorPorRank: 0.05 },
      { tipo: "propriedade", chave: "sincronia", rotulo: "B\xF4nus lutando junto da fera", valorPorRank: 0.05, escola: "evocacao" }
    ]
  },
  assalto_coordenado: {
    id: "assalto_coordenado",
    nome: "Assalto Coordenado",
    descricao: "Focar o mesmo alvo que sua fera concede +10%/rank de dano contra ele.",
    ranksMaximos: 3,
    requisito: { escola: "evocacao", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "foco_coordenado", rotulo: "Dano no alvo focado", valorPorRank: 0.1, escola: "evocacao" }]
  },
  guarda_da_fera: {
    id: "guarda_da_fera",
    nome: "Guarda da Fera",
    descricao: "Sua fera intercepta 8%/rank do dano que voc\xEA receberia.",
    ranksMaximos: 3,
    requisito: { escola: "evocacao", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "guarda_fera", rotulo: "Dano interceptado pela fera", valorPorRank: 0.08, escola: "evocacao" }]
  },
  montaria: {
    id: "montaria",
    nome: "Montaria",
    descricao: "Monte sua fera vinculada de porte adequado: mobilidade e ataques combinados.",
    ranksMaximos: 1,
    requisito: { escola: "combate_fisico", nivelMinimo: 5 },
    efeitos: [{ tipo: "propriedade", chave: "montaria", rotulo: "Montaria desbloqueada", valorPorRank: 1, escola: "evocacao" }]
  },
  carga_montada: {
    id: "carga_montada",
    nome: "Carga Montada",
    descricao: "Montado, uma investida atinge todos em linha (+12%/rank) e fortalece a fera.",
    ranksMaximos: 3,
    requisito: { escola: "evocacao", nivelMinimo: 10 },
    efeitos: [
      { tipo: "invocacao_potencia_bonus_fracao", valorPorRank: 0.04 },
      { tipo: "propriedade", chave: "carga_montada", rotulo: "Dano da carga montada", valorPorRank: 0.12, escola: "evocacao" }
    ]
  },
  // ------------------- inspirações de outros jogos -------------------
  metamagia_gemea: {
    id: "metamagia_gemea",
    nome: "Metamagia G\xEAmea",
    descricao: "D&D/Sorcerer: chance de a conjura\xE7\xE3o atingir um segundo alvo (10%/rank).",
    ranksMaximos: 3,
    requisito: { escola: "conjuracao", nivelMinimo: 10 },
    efeitos: [{ tipo: "propriedade", chave: "gemea", rotulo: "Chance de alvo g\xEAmeo", valorPorRank: 0.1, escola: "conjuracao" }]
  },
  auto_feitico: {
    id: "auto_feitico",
    nome: "Auto-Feiti\xE7o",
    descricao: "Ragnarok Sage: seus golpes t\xEAm chance de disparar uma magia extra (8%/rank).",
    ranksMaximos: 3,
    requisito: { escola: "combate_fisico", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "auto_feitico", rotulo: "Chance de auto-feiti\xE7o", valorPorRank: 0.08, escola: "combate_fisico" }]
  },
  cancao_persistente: {
    id: "cancao_persistente",
    nome: "Can\xE7\xE3o Persistente",
    descricao: "Bardo: suas b\xEAn\xE7\xE3os em \xE1rea duram mais e afetam +1 aliado por rank.",
    ranksMaximos: 3,
    requisito: { escola: "benca", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "cancao", rotulo: "Aliados extras da can\xE7\xE3o", valorPorRank: 1, escola: "benca" }]
  },
  salto: {
    id: "salto",
    nome: "Salto",
    descricao: "FF Dragoon: um salto que ignora defesas e atinge de cima (+10%/rank).",
    ranksMaximos: 3,
    requisito: { escola: "combate_fisico", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "salto", rotulo: "Dano do salto (ignora defesa)", valorPorRank: 0.1, escola: "combate_fisico" }]
  },
  endossar_elemento: {
    id: "endossar_elemento",
    nome: "Endossar Elemento",
    descricao: "Ragnarok Sage: imbui a arma com o elemento da skill (+8%/rank de dano elemental).",
    ranksMaximos: 3,
    requisito: { escola: "combate_fisico", nivelMinimo: 5 },
    efeitos: [{ tipo: "propriedade", chave: "endosso", rotulo: "Dano elemental na arma", valorPorRank: 0.08, escola: "combate_fisico" }]
  },
  // ------------------- maldição -------------------
  contagio: {
    id: "contagio",
    nome: "Cont\xE1gio",
    descricao: "Maldi\xE7\xF5es pulam para inimigos pr\xF3ximos (+1 salto/rank; exclui Afli\xE7\xE3o).",
    ranksMaximos: 3,
    requisito: { escola: "maldicao", nivelMinimo: 5 },
    exclusivoCom: ["aflicao_profunda"],
    efeitos: [{ tipo: "propriedade", chave: "saltos_contagio", rotulo: "Saltos de cont\xE1gio", valorPorRank: 1, escola: "maldicao" }]
  },
  aflicao_profunda: {
    id: "aflicao_profunda",
    nome: "Afli\xE7\xE3o Profunda",
    descricao: "Maldi\xE7\xF5es acumulam no mesmo alvo (+10% por ac\xFAmulo/rank; exclui Cont\xE1gio).",
    ranksMaximos: 3,
    requisito: { escola: "maldicao", nivelMinimo: 5 },
    exclusivoCom: ["contagio"],
    efeitos: [{ tipo: "propriedade", chave: "acumulo_aflicao", rotulo: "B\xF4nus por ac\xFAmulo", valorPorRank: 0.1, escola: "maldicao" }]
  },
  // ------------------- bênção -------------------
  egide: {
    id: "egide",
    nome: "\xC9gide",
    descricao: "Suas b\xEAn\xE7\xE3os criam escudos absorventes (15%/rank; exclui Exalta\xE7\xE3o).",
    ranksMaximos: 3,
    requisito: { escola: "benca", nivelMinimo: 5 },
    exclusivoCom: ["exaltacao"],
    efeitos: [{ tipo: "propriedade", chave: "escudo", rotulo: "Fra\xE7\xE3o convertida em escudo", valorPorRank: 0.15, escola: "benca" }]
  },
  exaltacao: {
    id: "exaltacao",
    nome: "Exalta\xE7\xE3o",
    descricao: "Suas b\xEAn\xE7\xE3os aumentam o dano dos aliados (8%/rank; exclui \xC9gide).",
    ranksMaximos: 3,
    requisito: { escola: "benca", nivelMinimo: 5 },
    exclusivoCom: ["egide"],
    efeitos: [{ tipo: "propriedade", chave: "exaltacao", rotulo: "Dano concedido a aliados", valorPorRank: 0.08, escola: "benca" }]
  },
  vinculo_de_grupo: {
    id: "vinculo_de_grupo",
    nome: "V\xEDnculo de Grupo",
    descricao: "B\xEAn\xE7\xE3os em \xE1rea afetam +1 aliado por rank sem perder for\xE7a.",
    ranksMaximos: 3,
    requisito: { escola: "benca", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "alvos_extras_benca", rotulo: "Aliados extras", valorPorRank: 1, escola: "benca" }]
  },
  // ------------------- combate físico -------------------
  sequencia_marcial: {
    id: "sequencia_marcial",
    nome: "Sequ\xEAncia Marcial",
    descricao: "Golpes consecutivos aceleram (+6% velocidade por acerto/rank; exclui Golpe Devastador).",
    ranksMaximos: 3,
    requisito: { escola: "combate_fisico", nivelMinimo: 5 },
    exclusivoCom: ["golpe_devastador"],
    efeitos: [{ tipo: "propriedade", chave: "combo", rotulo: "Acelera\xE7\xE3o por combo", valorPorRank: 0.06, escola: "combate_fisico" }]
  },
  golpe_devastador: {
    id: "golpe_devastador",
    nome: "Golpe Devastador",
    descricao: "Golpes lentos com chance de atordoar (10%/rank; exclui Sequ\xEAncia).",
    ranksMaximos: 3,
    requisito: { escola: "combate_fisico", nivelMinimo: 5 },
    exclusivoCom: ["sequencia_marcial"],
    efeitos: [{ tipo: "propriedade", chave: "atordoamento", rotulo: "Chance de atordoar", valorPorRank: 0.1, escola: "combate_fisico" }]
  },
  postura_inabalavel: {
    id: "postura_inabalavel",
    nome: "Postura Inabal\xE1vel",
    descricao: "Reduz dano recebido enquanto ataca (5%/rank).",
    ranksMaximos: 3,
    requisito: { escola: "combate_fisico", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "mitigacao", rotulo: "Redu\xE7\xE3o de dano", valorPorRank: 0.05, escola: "combate_fisico" }]
  },
  // ------------------- longo alcance -------------------
  olho_de_aguia: {
    id: "olho_de_aguia",
    nome: "Olho de \xC1guia",
    descricao: "Tiros precisos: chance de cr\xEDtico (+8%/rank; exclui Rajada).",
    ranksMaximos: 3,
    requisito: { escola: "longo_alcance", nivelMinimo: 5 },
    exclusivoCom: ["rajada"],
    efeitos: [{ tipo: "propriedade", chave: "critico", rotulo: "Chance de cr\xEDtico", valorPorRank: 0.08, escola: "longo_alcance" }]
  },
  rajada: {
    id: "rajada",
    nome: "Rajada",
    descricao: "Dispara proj\xE9teis extras mais fracos (+1/rank; exclui Olho de \xC1guia).",
    ranksMaximos: 3,
    requisito: { escola: "longo_alcance", nivelMinimo: 5 },
    exclusivoCom: ["olho_de_aguia"],
    efeitos: [{ tipo: "propriedade", chave: "projeteis_extras", rotulo: "Proj\xE9teis extras", valorPorRank: 1, escola: "longo_alcance" }]
  },
  // ------------------- recursos -------------------
  devocao: {
    id: "devocao",
    nome: "Devo\xE7\xE3o",
    descricao: "F\xE9: a penalidade por uso cresce 15% mais devagar por rank.",
    ranksMaximos: 3,
    requisito: { recurso: "fe", nivelMinimo: 5 },
    efeitos: [{ tipo: "propriedade", chave: "fe_penalidade_reduzida", rotulo: "Penalidade de f\xE9 reduzida", valorPorRank: 0.15 }]
  },
  fluxo_constante: {
    id: "fluxo_constante",
    nome: "Fluxo Constante",
    descricao: "Mana: regenera\xE7\xE3o 10% maior por rank.",
    ranksMaximos: 3,
    requisito: { recurso: "mana", nivelMinimo: 5 },
    efeitos: [{ tipo: "propriedade", chave: "mana_regen_bonus", rotulo: "Regenera\xE7\xE3o de mana", valorPorRank: 0.1 }]
  },
  sede_de_batalha: {
    id: "sede_de_batalha",
    nome: "Sede de Batalha",
    descricao: "F\xFAria: ganho por dano 12% maior por rank.",
    ranksMaximos: 3,
    requisito: { recurso: "furia", nivelMinimo: 5 },
    efeitos: [{ tipo: "propriedade", chave: "furia_ganho_bonus", rotulo: "Ganho de f\xFAria", valorPorRank: 0.12 }]
  },
  elo_profundo: {
    id: "elo_profundo",
    nome: "Elo Profundo",
    descricao: "Soullink: +5% de poder extra por rank ao pagar com vida.",
    ranksMaximos: 3,
    requisito: { recurso: "soullink", nivelMinimo: 5 },
    efeitos: [{ tipo: "propriedade", chave: "soullink_poder_extra", rotulo: "Poder extra do Soullink", valorPorRank: 0.05 }]
  },
  afinacao: {
    id: "afinacao",
    nome: "Afina\xE7\xE3o",
    descricao: "Resson\xE2ncia: a janela antes do reset dura +2s por rank.",
    ranksMaximos: 3,
    requisito: { recurso: "ressonancia", nivelMinimo: 5 },
    efeitos: [{ tipo: "propriedade", chave: "ressonancia_janela_extra", rotulo: "Janela extra antes do reset (s)", valorPorRank: 2 }]
  },
  // ------------- fusão e modificadores (2ª e 3ª geração) -------------
  engenho_de_skill: {
    id: "engenho_de_skill",
    nome: "Engenho de Skill",
    descricao: "Abre +1 slot de modificador por rank em todas as suas skills.",
    ranksMaximos: 3,
    efeitos: [{ tipo: "propriedade", chave: "slots_modificador", rotulo: "Slots de modificador", valorPorRank: 1 }]
  },
  arte_da_fusao: {
    id: "arte_da_fusao",
    nome: "Arte da Fus\xE3o",
    descricao: "Reduz em 20%/rank a taxa de custo cobrada por fundir skills.",
    ranksMaximos: 3,
    efeitos: [{ tipo: "propriedade", chave: "desconto_fusao", rotulo: "Desconto na taxa de fus\xE3o", valorPorRank: 0.2 }]
  },
  catalisador: {
    id: "catalisador",
    nome: "Catalisador",
    descricao: "Fus\xF5es de elementos em oposi\xE7\xE3o (modo Cat\xE1lise) rendem +8%/rank.",
    ranksMaximos: 3,
    exclusivoCom: ["estabilizador"],
    efeitos: [{ tipo: "propriedade", chave: "bonus_catalise", rotulo: "B\xF4nus em fus\xF5es por cat\xE1lise", valorPorRank: 0.08 }]
  },
  estabilizador: {
    id: "estabilizador",
    nome: "Estabilizador",
    descricao: "Fus\xF5es harm\xF4nicas custam 10%/rank menos e nunca falham (exclui Catalisador).",
    ranksMaximos: 3,
    exclusivoCom: ["catalisador"],
    efeitos: [{ tipo: "propriedade", chave: "bonus_estabilidade", rotulo: "Economia em fus\xF5es harm\xF4nicas", valorPorRank: 0.1 }]
  },
  prisma_interior: {
    id: "prisma_interior",
    nome: "Prisma Interior",
    descricao: "Fus\xF5es de 3+ componentes abrem uma faixa simult\xE2nea extra por rank.",
    ranksMaximos: 2,
    requisito: { escola: "conjuracao", nivelMinimo: 12 },
    efeitos: [{ tipo: "propriedade", chave: "faixas_extras", rotulo: "Faixas extras no modo Prisma", valorPorRank: 1 }]
  },
  // ------------- combinação de elementos -------------
  sintonia_de_receita: {
    id: "sintonia_de_receita",
    nome: "Sintonia de Receita",
    descricao: "Reduz em 2 n\xEDveis/rank o m\xEDnimo exigido de cada componente das receitas \u2014 o caminho pr\xE1tico para triplas e qu\xE1druplas.",
    ranksMaximos: 4,
    efeitos: [{ tipo: "receita_minimo_reducao", valorPorRank: 2 }]
  },
  convergencia_elemental: {
    id: "convergencia_elemental",
    nome: "Converg\xEAncia Elemental",
    descricao: "+1 n\xEDvel efetivo por rank em TODO elemento derivado j\xE1 desbloqueado.",
    ranksMaximos: 3,
    efeitos: [{ tipo: "nivel_derivado_bonus", valorPorRank: 1 }]
  },
  leitor_de_constelacao: {
    id: "leitor_de_constelacao",
    nome: "Leitor de Constela\xE7\xE3o",
    descricao: "Revela e aproxima combina\xE7\xF5es distantes: +5%/rank de progresso aparente em toda receita n\xE3o conclu\xEDda.",
    ranksMaximos: 3,
    efeitos: [{ tipo: "propriedade", chave: "leitura_constelacao", rotulo: "Progresso revelado nas receitas", valorPorRank: 0.05 }]
  },
  transbordo_ampliado: {
    id: "transbordo_ampliado",
    nome: "Transbordo Ampliado",
    descricao: "As sinergias entre elementos vazam 8%/rank mais forte para os vizinhos.",
    ranksMaximos: 3,
    // 0.25 -> 0.08 (auditoria adversarial). Uma sinergia de LEQUE espalha para
    // 5 alvos: com 0.25/rank a razão efetiva de `vida` ia a 0.2x1.75 = 0.35 por
    // alvo, contra 1/aridade = 0.25 da rota honesta de uma quadrupla — e
    // despejar tudo em `vida` batia qualquer build (1,385x a quadrupla honesta,
    // 1,17x a especializacao pura) SEM destravar nada, por fora do gate novo.
    // O limiar e' `razao x (1+bonus) <= 1/aridade`: com 3 ranks, 0.24 < 0.25.
    efeitos: [{ tipo: "propriedade", chave: "transbordo_bonus", rotulo: "Intensidade do transbordo", valorPorRank: 0.08 }]
  },
  maestria_paradoxal: {
    id: "maestria_paradoxal",
    nome: "Maestria Paradoxal",
    descricao: "Elementos de receita paradoxal (componentes opostos) rendem +6%/rank de impacto.",
    ranksMaximos: 3,
    efeitos: [{ tipo: "propriedade", chave: "bonus_paradoxo", rotulo: "Impacto de elementos paradoxais", valorPorRank: 0.06 }]
  },
  // ------------- ofício -------------
  mao_de_mestre: {
    id: "mao_de_mestre",
    nome: "M\xE3o de Mestre",
    descricao: "Soma +8 de qualidade por rank a tudo que voc\xEA cria.",
    ranksMaximos: 3,
    efeitos: [{ tipo: "propriedade", chave: "qualidade_bonus", rotulo: "Qualidade de cria\xE7\xE3o", valorPorRank: 8 }]
  },
  olho_de_materiais: {
    id: "olho_de_materiais",
    nome: "Olho de Materiais",
    descricao: "Extrai 30%/rank a mais de qualidade das peles e carca\xE7as do besti\xE1rio.",
    ranksMaximos: 3,
    efeitos: [{ tipo: "propriedade", chave: "material_bonus", rotulo: "Aproveitamento de materiais", valorPorRank: 0.3 }]
  },
  assinatura_do_artesao: {
    id: "assinatura_do_artesao",
    nome: "Assinatura do Artes\xE3o",
    descricao: "Suas obras carregam uma propriedade emergente extra por rank.",
    ranksMaximos: 2,
    efeitos: [{ tipo: "propriedade", chave: "propriedades_extras", rotulo: "Propriedades emergentes extras", valorPorRank: 1 }]
  },
  linha_de_producao: {
    id: "linha_de_producao",
    nome: "Linha de Produ\xE7\xE3o",
    descricao: "Reduz em 4/rank o n\xEDvel de profiss\xE3o exigido pelas propriedades de item.",
    ranksMaximos: 3,
    efeitos: [{ tipo: "propriedade", chave: "reducao_requisito_profissao", rotulo: "Requisito de profiss\xE3o reduzido", valorPorRank: 4 }]
  },
  // ------------- híbridos entre escolas -------------
  duplo_chaveamento: {
    id: "duplo_chaveamento",
    nome: "Duplo Chaveamento",
    descricao: "FF Red Mage: alterna entre duas escolas sem perder o ritmo (+7%/rank em fus\xF5es de escolas distintas).",
    ranksMaximos: 3,
    efeitos: [{ tipo: "propriedade", chave: "troca_escola", rotulo: "B\xF4nus em fus\xF5es de escolas distintas", valorPorRank: 0.07 }]
  },
  ritmo_de_guerra: {
    id: "ritmo_de_guerra",
    nome: "Ritmo de Guerra",
    descricao: "Cada skill lan\xE7ada acelera a pr\xF3xima em 5%/rank, at\xE9 tr\xEAs elos.",
    ranksMaximos: 3,
    requisito: { escola: "combate_fisico", nivelMinimo: 10 },
    efeitos: [{ tipo: "propriedade", chave: "ritmo", rotulo: "Acelera\xE7\xE3o encadeada", valorPorRank: 0.05 }]
  },
  pacto_de_sangue: {
    id: "pacto_de_sangue",
    nome: "Pacto de Sangue",
    descricao: "Pagar com vida em qualquer fonte concede +6%/rank de impacto \xE0 fus\xE3o inteira.",
    ranksMaximos: 3,
    requisito: { recurso: "soullink", nivelMinimo: 8 },
    efeitos: [{ tipo: "propriedade", chave: "pacto_sangue", rotulo: "Impacto extra ao pagar com vida", valorPorRank: 0.06 }]
  },
  eco_de_batalha: {
    id: "eco_de_batalha",
    nome: "Eco de Batalha",
    descricao: "Skills de 3\xAA gera\xE7\xE3o deixam um eco que repete 15%/rank do efeito.",
    ranksMaximos: 3,
    requisito: { escola: "conjuracao", nivelMinimo: 15 },
    efeitos: [{ tipo: "propriedade", chave: "eco_geracao", rotulo: "Eco das skills de 3\xAA gera\xE7\xE3o", valorPorRank: 0.15 }]
  }
};

// src/registry/arquetipos.ts
var a = (id, nome, descricao, condicao, capacidades) => ({ id, nome, descricao, condicao, capacidades });
var ARQUETIPOS = Object.fromEntries(
  [
    // ---------- evocadores ----------
    a(
      "necromante",
      "Necromante",
      "Morte + Evoca\xE7\xE3o: ergue mortos-vivos para lutar por voc\xEA.",
      { elementos: { morte: 10 }, escolas: { evocacao: 10 } },
      ["evocar_mortos_vivos"]
    ),
    a(
      "verdejante",
      "Verdejante",
      "Vida + Evoca\xE7\xE3o: invoca plantas guardi\xE3s e vinhas.",
      { elementos: { vida: 10 }, escolas: { evocacao: 10 } },
      ["evocar_plantas"]
    ),
    a(
      "demonologista",
      "Demonologista",
      "Vileza + Evoca\xE7\xE3o: sela pactos e invoca dem\xF4nios.",
      { elementos: { vileza: 10 }, escolas: { evocacao: 10 } },
      ["evocar_demonios"]
    ),
    a(
      "senhor_dos_mortos_vis",
      "Senhor dos Mortos Vis",
      "Necromante com Vileza: invoca dem\xF4nios mortos.",
      { elementos: { morte: 15, vileza: 15 }, escolas: { evocacao: 15 } },
      ["evocar_demonios_mortos"]
    ),
    a(
      "arsenal_espectral",
      "Arsenal Espectral",
      "Evoca\xE7\xE3o + Combate F\xEDsico + F\xFAria: armas que orbitam voc\xEA e lutam sozinhas.",
      { escolas: { evocacao: 12, combate_fisico: 12 }, recursos: { furia: 8 } },
      ["evocar_armas_autonomas"]
    ),
    a(
      "piromante_vegetal",
      "Piromante Vegetal",
      "Verdejante com Fogo: plantas e vinhas em chamas.",
      { elementos: { vida: 12, fogo: 12 }, escolas: { evocacao: 10 } },
      ["evocar_plantas_de_fogo", "conjurar_vinha_de_fogo"]
    ),
    a(
      "engenheiro_galvanico",
      "Engenheiro Galv\xE2nico",
      "Galvanismo + Evoca\xE7\xE3o: constructos de carne e raio reanimados.",
      { elementos: { galvanismo: 10 }, escolas: { evocacao: 12 } },
      ["evocar_constructos_galvanicos"]
    ),
    a(
      "senhor_das_feras",
      "Senhor das Feras",
      "Vigor + Vida + Evoca\xE7\xE3o: feras vivas de carne e instinto.",
      { elementos: { vigor: 12, vida: 12 }, escolas: { evocacao: 10 } },
      ["evocar_feras"]
    ),
    a(
      "horologista_do_horror",
      "Tecel\xE3o de Abomina\xE7\xF5es",
      "Abomina\xE7\xE3o + Evoca\xE7\xE3o: costura horrores que n\xE3o deveriam existir.",
      { elementos: { abominacao: 15 }, escolas: { evocacao: 15 } },
      ["evocar_abominacoes"]
    ),
    a(
      "avatar_primordial",
      "Avatar Primordial",
      "Primordial + Evoca\xE7\xE3o: o pr\xF3prio terreno luta ao seu lado.",
      { elementos: { primordial: 12 }, escolas: { evocacao: 12 } },
      ["evocar_elementais_primais"]
    ),
    // ---------- conjuradores ----------
    a(
      "lavamante",
      "Lavamante",
      "Lava + Conjura\xE7\xE3o: erup\xE7\xF5es e rios de magma.",
      { elementos: { lava: 12 }, escolas: { conjuracao: 10 } },
      ["conjurar_erupcao"]
    ),
    a(
      "tempestario",
      "Tempest\xE1rio",
      "Tempestade + Conjura\xE7\xE3o: comanda o c\xE9u em f\xFAria.",
      { elementos: { tempestade: 12 }, escolas: { conjuracao: 10 } },
      ["conjurar_tempestade"]
    ),
    a(
      "feiticeiro_do_abismo",
      "Feiticeiro do Abismo",
      "Abismo + Conjura\xE7\xE3o: press\xE3o das profundezas em terra firme.",
      { elementos: { abismo: 12 }, escolas: { conjuracao: 10 } },
      ["conjurar_abismo"]
    ),
    a(
      "arquimago",
      "Arquimago",
      "Arcano profundo + tr\xEAs escolas m\xE1gicas: reescreve as regras.",
      { elementos: { arcano: 20 }, escolas: { conjuracao: 10, evocacao: 10, benca: 10 } },
      ["metamagia"]
    ),
    a(
      "portador_do_nulo",
      "Portador do Nulo",
      "Nulo: nega, absorve e devolve qualquer magia.",
      { elementos: { nulo: 8 } },
      ["anular_magia", "refletir_magia"]
    ),
    // ---------- marciais ----------
    a(
      "berserker",
      "Berserker",
      "Vigor + Combate F\xEDsico + F\xFAria: quanto mais apanha, mais forte.",
      { elementos: { vigor: 12 }, escolas: { combate_fisico: 12 }, recursos: { furia: 10 } },
      ["furia_crescente"]
    ),
    a(
      "cavaleiro_da_morte",
      "Cavaleiro da Morte",
      "Ceifa + Combate F\xEDsico: golpes que colhem almas.",
      { elementos: { ceifa: 12 }, escolas: { combate_fisico: 10 } },
      ["golpe_ceifador"]
    ),
    a(
      "paladino",
      "Paladino",
      "Bravura + Combate F\xEDsico + F\xE9: o muro sagrado.",
      { elementos: { bravura: 10 }, escolas: { combate_fisico: 10 }, recursos: { fe: 8 } },
      ["aura_sagrada", "golpe_justiceiro"]
    ),
    a(
      "espadachim_arcano",
      "Espadachim Arcano",
      "Encantamento + Combate F\xEDsico: l\xE2minas imbu\xEDdas de magia.",
      { elementos: { encantamento: 12 }, escolas: { combate_fisico: 10 } },
      ["lamina_arcana"]
    ),
    a(
      "sombra_ambulante",
      "Sombra Ambulante",
      "Assass\xEDnio + Combate F\xEDsico: o golpe \xFAnico e perfeito.",
      { elementos: { assassinio: 12 }, escolas: { combate_fisico: 10 } },
      ["execucao_furtiva"]
    ),
    a(
      "olho_da_tormenta",
      "Olho da Tormenta",
      "Tempestade + Longo Alcance: flechas-rel\xE2mpago que nunca erram.",
      { elementos: { tempestade: 10 }, escolas: { longo_alcance: 12 } },
      ["flecha_relampago"]
    ),
    a(
      "atirador_fantasma",
      "Atirador Fantasma",
      "Espectro + Longo Alcance: proj\xE9teis que atravessam paredes.",
      { elementos: { espectro: 10 }, escolas: { longo_alcance: 12 } },
      ["tiro_fantasma"]
    ),
    a(
      "mestre_de_armas",
      "Mestre de Armas",
      "Marcial + Combate F\xEDsico: domina qualquer arma que toca.",
      { elementos: { marcial: 12 }, escolas: { combate_fisico: 10 } },
      ["maestria_de_armas"]
    ),
    a(
      "forjador_de_guerra",
      "Forjador de Guerra",
      "Forja + Evoca\xE7\xE3o: evoca armas incandescentes rec\xE9m-sa\xEDdas da bigorna.",
      { elementos: { forja: 12 }, escolas: { evocacao: 10 } },
      ["evocar_armas_flamejantes"]
    ),
    a(
      "arsenal_arcano",
      "Arsenal Arcano",
      "Arsenal + Evoca\xE7\xE3o: um enxame de armas et\xE9reas conjuradas.",
      { elementos: { arsenal: 12 }, escolas: { evocacao: 10 } },
      ["evocar_arsenal_arcano"]
    ),
    a(
      "avatar_da_guerra",
      "Avatar da Guerra",
      "Avatar de Guerra + Soullink: paga com a alma para SER a guerra.",
      { elementos: { avatar_de_guerra: 15 }, recursos: { soullink: 10 } },
      ["forma_avatar_de_guerra"]
    ),
    // ---------- suporte / híbridos ----------
    a(
      "santo_guardiao",
      "Santo Guardi\xE3o",
      "Santidade + B\xEAn\xE7\xE3o: a cura mais pura do sistema.",
      { elementos: { santidade: 12 }, escolas: { benca: 12 } },
      ["cura_sagrada"]
    ),
    a(
      "mestre_das_runas",
      "Mestre das Runas",
      "Runa + B\xEAn\xE7\xE3o: efeitos persistentes gravados em aliados e no ch\xE3o.",
      { elementos: { runa: 12 }, escolas: { benca: 10 } },
      ["gravar_runas"]
    ),
    a(
      "corruptor",
      "Corruptor",
      "Muta\xE7\xE3o + Maldi\xE7\xE3o: transforma inimigos contra si mesmos.",
      { elementos: { mutacao: 12 }, escolas: { maldicao: 10 } },
      ["maldicao_mutante"]
    ),
    a(
      "toxicologista",
      "Toxicologista",
      "Veneno + Maldi\xE7\xE3o: toxinas que corroem ao longo do tempo.",
      { elementos: { veneno: 10 }, escolas: { maldicao: 10 } },
      ["maldicao_veneno"]
    ),
    a(
      "inquisidor",
      "Inquisidor",
      "Julgamento + Maldi\xE7\xE3o: pune e executa os enfraquecidos.",
      { elementos: { julgamento: 12 }, escolas: { maldicao: 10 } },
      ["sentenca_final"]
    ),
    a(
      "vampiro_espiritual",
      "Vampiro Espiritual",
      "Parasita + Maldi\xE7\xE3o: drena vida \xE0 dist\xE2ncia.",
      { elementos: { parasita: 12 }, escolas: { maldicao: 10 } },
      ["dreno_vital"]
    ),
    a(
      "guardiao_do_ciclo",
      "Guardi\xE3o do Ciclo",
      "Ciclo + B\xEAn\xE7\xE3o + Maldi\xE7\xE3o: inverte cura e dano, buff e maldi\xE7\xE3o.",
      { elementos: { ciclo: 12 }, escolas: { benca: 10, maldicao: 10 } },
      ["inverter_estado"]
    ),
    // ---------- inspirados em Tree of Savior / FF / Ragnarok / WoW / D&D ----------
    a(
      "geomante",
      "Geomante",
      "Terra + Conjura\xE7\xE3o (FF/D&D): molda o pr\xF3prio terreno como arma.",
      { elementos: { terra: 12 }, escolas: { conjuracao: 12 } },
      ["moldar_terreno", "campo_elemental"]
    ),
    a(
      "cronomante",
      "Cronomante",
      "Tempo + B\xEAn\xE7\xE3o + Maldi\xE7\xE3o (ToS/FF): dobra o tempo \u2014 pressa, lentid\xE3o e revers\xE3o.",
      { elementos: { tempo: 12 }, escolas: { benca: 10, maldicao: 8 } },
      ["acelerar", "retardar", "reverter_tempo"]
    ),
    a(
      "senhor_do_paradoxo",
      "Senhor do Paradoxo",
      "Paradoxo (tempo+arcano+morte) + Conjura\xE7\xE3o: desfaz causas e efeitos.",
      { elementos: { paradoxo: 15 }, escolas: { conjuracao: 12 } },
      ["anular_acao", "rebobinar"]
    ),
    a(
      "bardo",
      "Bardo",
      "Ar + B\xEAn\xE7\xE3o (Ragnarok/D&D/ToS): can\xE7\xF5es que fortalecem o grupo.",
      { elementos: { ar: 10 }, escolas: { benca: 12 } },
      ["cancoes_de_batalha", "ensemble"]
    ),
    a(
      "alquimista",
      "Alquimista",
      "\xC1gua + Arcano + B\xEAn\xE7\xE3o (Ragnarok/ToS): po\xE7\xF5es, bombas e hom\xFAnculo.",
      { elementos: { agua: 10, arcano: 10 }, escolas: { benca: 8, conjuracao: 8 } },
      ["pocoes", "bomba_acida", "criar_homunculo"]
    ),
    a(
      "xama_totemico",
      "Xam\xE3 Tot\xEAmico",
      "Eletricidade + B\xEAn\xE7\xE3o (WoW): finca totens que emanam poder.",
      { elementos: { eletricidade: 12 }, escolas: { benca: 10 } },
      ["fincar_totens"]
    ),
    a(
      "feiticeiro_de_cartas",
      "Feiticeiro de Cartas",
      "Evoca\xE7\xE3o + Doma (ToS Sorcerer): sela monstros em cartas e os invoca.",
      { escolas: { evocacao: 15 }, recursos: { mana: 10 } },
      ["selar_carta", "invocar_chefe"]
    ),
    a(
      "bokor",
      "Bokor",
      "Morte + Vileza + Maldi\xE7\xE3o (ToS): vodu, bonecos e zumbis servos.",
      { elementos: { morte: 12, vileza: 10 }, escolas: { maldicao: 12 } },
      ["boneco_vodu", "zumbi_servo"]
    ),
    a(
      "tecelao_de_sangue",
      "Tecel\xE3o de Sangue",
      "Soullink + Maldi\xE7\xE3o (ToS Featherfoot): magia de sangue e drenagem.",
      { escolas: { maldicao: 12 }, recursos: { soullink: 12 } },
      ["magia_de_sangue", "transfusao"]
    ),
    a(
      "cavaleiro_dragao",
      "Cavaleiro Drag\xE3o",
      "Esgrima + Combate + Montaria (FF Dragoon): saltos e lan\xE7as aladas.",
      { elementos: { esgrima: 12 }, escolas: { combate_fisico: 12 } },
      ["salto_draconico", "lanca_alada"]
    ),
    a(
      "cavalaria_negra",
      "Cavalaria Negra",
      "Longo Alcance + F\xFAria montado (ToS Schwarzer Reiter): pistoleiro de cavalaria.",
      { escolas: { longo_alcance: 12, combate_fisico: 8 }, recursos: { furia: 10 } },
      ["tiro_montado", "salva_de_cavalaria"]
    ),
    a(
      "mago_vermelho",
      "Mago Vermelho",
      "Fogo + Arcano + B\xEAn\xE7\xE3o + Maldi\xE7\xE3o (FF): meio-mago, meio-espadachim.",
      { elementos: { fogo: 10, arcano: 10 }, escolas: { conjuracao: 8, benca: 8, maldicao: 8 } },
      ["conjuracao_dupla", "espada_encantada"]
    ),
    a(
      "cabalista",
      "Cabalista",
      "Cristal + Luz + B\xEAn\xE7\xE3o (ToS Kabbalist): numerologia que manipula vida e sorte.",
      { elementos: { cristal: 10, luz: 10 }, escolas: { benca: 12 } },
      ["gematria", "ampliar_vida"]
    ),
    a(
      "invocador",
      "Invocador",
      "Arcano + Vida/Morte + Evoca\xE7\xE3o (FF Summoner): chama entidades primordiais.",
      { elementos: { arcano: 15, equilibrio: 15 }, escolas: { evocacao: 12 } },
      ["invocar_esper"]
    ),
    // ---------- som / gravidade / espaço ----------
    a(
      "menestrel",
      "Menestrel",
      "Som + B\xEAn\xE7\xE3o (Ragnarok Bard/D&D): can\xE7\xF5es que fortalecem o grupo.",
      { elementos: { som: 12 }, escolas: { benca: 12 } },
      ["reger_sinfonia", "brado_de_guerra"]
    ),
    a(
      "trovador_sombrio",
      "Trovador Sombrio",
      "Disson\xE2ncia (som+vileza) + Maldi\xE7\xE3o: can\xE7\xF5es que quebram a mente.",
      { elementos: { dissonancia: 12 }, escolas: { maldicao: 10 } },
      ["cancao_dissonante"]
    ),
    a(
      "senhor_da_gravidade",
      "Senhor da Gravidade",
      "Gravidade + Conjura\xE7\xE3o (FF): esmaga e prende com o pr\xF3prio peso do mundo.",
      { elementos: { gravidade: 12 }, escolas: { conjuracao: 12 } },
      ["campo_gravitacional", "demi"]
    ),
    a(
      "astromante",
      "Astromante",
      "Espa\xE7o + Conjura\xE7\xE3o (ToS Sage/FF): meteoros, portais e o poder das estrelas.",
      { elementos: { espaco: 12 }, escolas: { conjuracao: 12 } },
      ["chuva_de_meteoros", "abrir_portal"]
    ),
    a(
      "viajante_dimensional",
      "Viajante Dimensional",
      "Continuum (espa\xE7o+tempo) + Arcano: move-se por onde e quando quiser.",
      { elementos: { continuum: 12 }, escolas: { conjuracao: 10, benca: 8 } },
      ["saltar_dimensao", "ancorar_tempo"]
    ),
    a(
      "demiurgo",
      "Demiurgo",
      "Big Bang (espa\xE7o+gravidade+tempo) + Conjura\xE7\xE3o: cria e destr\xF3i mundos.",
      { elementos: { big_bang: 15 }, escolas: { conjuracao: 15 } },
      ["genese", "colapso_final"]
    ),
    // ---------- arquétipos de combinações de 3 componentes ----------
    a(
      "vulcanologo",
      "Vulcan\xF3logo",
      "Vulc\xE3o (fogo+terra+ar) + Conjura\xE7\xE3o: erup\xE7\xE3o, cinza e c\xE9u escurecido sob comando.",
      { elementos: { vulcao: 17 }, escolas: { conjuracao: 12 } },
      ["erupcao_dirigida", "chuva_de_cinzas"]
    ),
    a(
      "senhor_das_neves",
      "Senhor das Neves",
      "Nevasca (\xE1gua+ar+terra) + Maldi\xE7\xE3o: o inverno como territ\xF3rio.",
      { elementos: { nevasca: 15 }, escolas: { maldicao: 10 } },
      ["nevasca_perpetua", "congelar_terreno"]
    ),
    a(
      "gladiador_arq",
      "Gladiador",
      "Gladiador (marcial+vigor+som) + Combate F\xEDsico: cada golpe ecoa e o eco fortalece o pr\xF3ximo.",
      { elementos: { gladiador: 14 }, escolas: { combate_fisico: 12 } },
      ["plateia_enfurecida", "golpe_aclamado"]
    ),
    a(
      "executor",
      "Executor",
      "L\xE2mina do Ju\xEDzo (marcial+luz+morte) + Combate F\xEDsico: corta apenas o j\xE1 sentenciado.",
      { elementos: { lamina_do_juizo: 15 }, escolas: { combate_fisico: 12 } },
      ["sentenca_marcial", "corte_do_veredito"]
    ),
    a(
      "epidemiologista",
      "Epidemiologista",
      "Peste Negra (morte+vileza+\xE1gua) + Maldi\xE7\xE3o: a doen\xE7a perfeita, desenhada.",
      { elementos: { peste_negra: 14 }, escolas: { maldicao: 12 } },
      ["epidemia", "vetor_de_contagio"]
    ),
    a(
      "taumaturgo",
      "Taumaturgo",
      "Milagre (luz+vida+arcano) + B\xEAn\xE7\xE3o: reverte o que n\xE3o deveria ter volta.",
      { elementos: { milagre: 14 }, escolas: { benca: 14 } },
      ["milagre_menor", "ressurreicao"]
    ),
    a(
      "astrofisico",
      "Astrof\xEDsico",
      "Supernova (espa\xE7o+fogo+gravidade) + Conjura\xE7\xE3o: a morte de uma estrela em escala de campo.",
      { elementos: { supernova: 15 }, escolas: { conjuracao: 14 } },
      ["detonar_estrela", "colapso_estelar"]
    ),
    a(
      "guardiao_do_horizonte",
      "Guardi\xE3o do Horizonte",
      "Horizonte de Eventos (gravidade+espa\xE7o+sombra): o ponto sem retorno.",
      { elementos: { horizonte_de_eventos: 15 }, escolas: { conjuracao: 12 } },
      ["ponto_sem_retorno", "engolir_projetil"]
    ),
    a(
      "hipnotizador",
      "Hipnotizador",
      "Hipnose (som+arcano+sombra) + Maldi\xE7\xE3o: a voz que vira ordem.",
      { elementos: { hipnose: 17 }, escolas: { maldicao: 12 } },
      ["sugestao", "dominar_mente"]
    ),
    a(
      "vidente",
      "Vidente",
      "Press\xE1gio (tempo+sombra+espa\xE7o) + B\xEAn\xE7\xE3o: esquivar do golpe antes dele partir.",
      { elementos: { presagio: 15 }, escolas: { benca: 10 } },
      ["ver_adiante", "esquiva_profetica"]
    ),
    a(
      "jardineiro_eterno",
      "Jardineiro Eterno",
      "Jardim Eterno (vida+tempo+terra) + B\xEAn\xE7\xE3o: cura que se recusa a expirar.",
      { elementos: { jardim_eterno: 15 }, escolas: { benca: 12 } },
      ["cura_perene", "plantar_bosque"]
    ),
    a(
      "faroleiro",
      "Faroleiro",
      "Farol (luz+espa\xE7o+som) + B\xEAn\xE7\xE3o: o ponto fixo que guia o grupo de qualquer dist\xE2ncia.",
      { elementos: { farol: 14 }, escolas: { benca: 12 } },
      ["guiar_aliados", "chamado_de_retorno"]
    ),
    // ---------- arquétipos de combinações de 4 componentes ----------
    a(
      "senhor_do_clima",
      "Senhor do Clima",
      "Tempestade Perfeita (\xE1gua+ar+eletricidade+som): o clima vira arma de cerco.",
      { elementos: { tempestade_perfeita: 20 }, escolas: { conjuracao: 15 } },
      ["frente_de_tempestade", "cerco_climatico"]
    ),
    a(
      "portador_do_cataclismo",
      "Portador do Cataclismo",
      "Cataclismo (fogo+terra+gravidade+espa\xE7o): o impacto que reescreve o mapa.",
      { elementos: { cataclismo: 19 }, escolas: { conjuracao: 15 } },
      ["impacto_orbital", "refazer_terreno"]
    ),
    a(
      "arauto_do_fim",
      "Arauto do Fim",
      "Ju\xEDzo Final (luz+morte+som+tempo): a trombeta, a senten\xE7a e a hora marcada.",
      { elementos: { juizo_final: 19 }, escolas: { maldicao: 12, benca: 12 } },
      ["trombeta_final", "hora_marcada"]
    ),
    a(
      "demiurgo_absoluto",
      "Arquiteto da Realidade",
      "Arquiteto da Realidade (arcano+espa\xE7o+tempo+gravidade): as quatro alavancas da f\xEDsica.",
      { elementos: { arquiteto_da_realidade: 20 }, escolas: { conjuracao: 15 } },
      ["reescrever_local", "fixar_constante"]
    ),
    a(
      "elementalista_pleno",
      "Elementalista Pleno",
      "Avatar Elemental (os quatro cl\xE1ssicos num corpo s\xF3).",
      { elementos: { avatar_elemental: 20 } },
      ["forma_elemental", "trocar_elemento"]
    ),
    a(
      "cavaleiro_absoluto_arq",
      "Cavaleiro Absoluto",
      "Cavaleiro Absoluto (marcial+vigor+luz+tempo): nenhum golpe se perde.",
      { elementos: { cavaleiro_absoluto: 19 }, escolas: { combate_fisico: 15 } },
      ["tecnica_perfeita", "aparar_o_inevitavel"]
    ),
    a(
      "portador_do_ragnarok",
      "Portador do Ragnar\xF6k",
      "Ragnar\xF6k (fogo+morte+gravidade+tempo): o crep\xFAsculo dos deuses.",
      { elementos: { ragnarok: 20 }, escolas: { conjuracao: 15 } },
      ["crepusculo", "fim_anunciado"]
    ),
    a(
      "semeador",
      "Semeador",
      "G\xEAnese (vida+luz+terra+\xE1gua) + B\xEAn\xE7\xE3o: onde passa, o mundo come\xE7a de novo.",
      { elementos: { genesis: 18 }, escolas: { benca: 15 } },
      ["primeiro_dia", "refazer_ecossistema"]
    ),
    a(
      "regente_do_caos",
      "Regente do Caos",
      "Sinfonia do Caos (som+vileza+sombra+arcano) + Maldi\xE7\xE3o: cada acorde desmonta uma certeza.",
      { elementos: { sinfonia_do_caos: 19 }, escolas: { maldicao: 15 } },
      ["reger_o_caos", "desafinar_realidade"]
    ),
    // ---------- arquétipos de ofício ----------
    a(
      "mestre_encantador",
      "Mestre Encantador",
      "Encantador com arcano profundo: grava elementos inteiros em objetos prontos.",
      { elementos: { arcano: 15 }, escolas: { benca: 10 } },
      ["gravar_elemento", "transferir_encantamento"]
    ),
    a(
      "escriba_do_pacto",
      "Escriba do Pacto",
      "Pacto (arcano+vileza) + Maldi\xE7\xE3o: contratos que a realidade \xE9 obrigada a cumprir.",
      { elementos: { pacto: 12 }, escolas: { maldicao: 12 } },
      ["redigir_contrato", "cobrar_o_preco"]
    ),
    a(
      "mestre_de_banquete",
      "Mestre de Banquete",
      "Vida + Fogo + B\xEAn\xE7\xE3o: a mesa que sustenta uma campanha inteira.",
      { elementos: { vida: 12, fogo: 10 }, escolas: { benca: 12 } },
      ["banquete_de_guerra", "racao_perpetua"]
    ),
    a(
      "luthier_de_guerra",
      "Luthier de Guerra",
      "Som + Marcial + B\xEAn\xE7\xE3o: constr\xF3i o instrumento e a can\xE7\xE3o que ele carrega.",
      { elementos: { cadencia: 12 }, escolas: { benca: 10, combate_fisico: 8 } },
      ["forjar_instrumento", "marcha_de_guerra"]
    ),
    a(
      "cartografo_dimensional",
      "Cart\xF3grafo Dimensional",
      "Continuum + Espa\xE7o: mede o que n\xE3o existe aqui e desenha a rota.",
      { elementos: { continuum: 14 }, escolas: { conjuracao: 10 } },
      ["mapear_dimensao", "rota_estavel"]
    )
  ].map((def) => [def.id, def])
);

// src/registry/criaturas.ts
var FAMILIAS = {
  besta: { nome: "Besta", descricao: "Animais terrestres de carne e instinto." },
  ave: { nome: "Ave", descricao: "Criaturas aladas." },
  aquatica: { nome: "Aqu\xE1tica", descricao: "Seres das \xE1guas e profundezas." },
  ignea: { nome: "\xCDgnea", descricao: "Feras nascidas do fogo e da lava." },
  morto_vivo: { nome: "Morto-vivo", descricao: "O que retornou da morte." },
  aberracao: { nome: "Aberra\xE7\xE3o", descricao: "Horrores das sombras e da corrup\xE7\xE3o." },
  planta: { nome: "Planta", descricao: "Vida vegetal desperta." },
  espirito: { nome: "Esp\xEDrito", descricao: "Entes et\xE9reos e arcanos." },
  construto: { nome: "Construto", descricao: "M\xE1quinas, golens e formas montadas." },
  demonio: { nome: "Dem\xF4nio", descricao: "Entidades de pacto e vileza." },
  draconico: { nome: "Drac\xF4nico", descricao: "Parentes dos drag\xF5es \u2014 raros e poderosos." },
  gigante: { nome: "Gigante/Tit\xE3", descricao: "Seres de escala descomunal, for\xE7a ou presen\xE7a colossal." },
  geleia: { nome: "Geleia/Slime", descricao: "Massas amorfas que engolem e dissolvem." },
  humanoide: { nome: "Humanoide", descricao: "Povos de fala e ferramenta \u2014 n\xE3o bestas, n\xE3o monstros." }
};
var c2 = (id, nome, familia, afinidades, poderBase, descricao) => ({ id, nome, familia, afinidades, poderBase, descricao });
var CRIATURAS = Object.fromEntries(
  [
    // bestas — vida/vigor
    c2("lobo", "Lobo Cinzento", "besta", ["vida", "vigor"], 24, "Ca\xE7ador de matilha, r\xE1pido e leal."),
    c2("urso", "Urso das Cavernas", "besta", ["vida", "vigor"], 42, "For\xE7a bruta e resist\xEAncia."),
    c2("felino", "Pantera Sombria", "besta", ["vida", "sombra"], 38, "Predador furtivo das florestas escuras."),
    c2("javali", "Javali de Presa", "besta", ["vigor", "terra"], 30, "Investida impar\xE1vel."),
    // aves — ar/vida
    c2("falcao", "Falc\xE3o Real", "ave", ["ar", "vida"], 26, "Olhos agu\xE7ados e mergulho veloz."),
    c2("coruja", "Coruja Arcana", "ave", ["ar", "arcano"], 34, "Voa em sil\xEAncio; sente magia."),
    // aquáticas — agua
    c2("serpente_marinha", "Serpente Marinha", "aquatica", ["agua"], 48, "Constritora das correntes profundas."),
    c2("tubarao", "Tubar\xE3o Abissal", "aquatica", ["agua", "sombra"], 52, "Frenesi das profundezas."),
    // ígneas — fogo
    c2("salamandra", "Salamandra", "ignea", ["fogo"], 30, "Lagarto que trilha em brasa."),
    c2("cao_de_lava", "C\xE3o de Lava", "ignea", ["fogo", "terra"], 46, "Matilha incandescente."),
    c2("fenix_menor", "F\xEAnix Menor", "ignea", ["fogo", "vida"], 72, "Renasce das pr\xF3prias cinzas."),
    // mortos-vivos — morte
    c2("ghoul", "Ghoul", "morto_vivo", ["morte"], 28, "Devorador de cad\xE1veres."),
    c2("cavaleiro_morto", "Cavaleiro Morto", "morto_vivo", ["morte", "marcial"], 58, "Guerreiro que a morte n\xE3o deteve."),
    // aberrações — sombra/vileza
    c2("sombra_rastejante", "Sombra Rastejante", "aberracao", ["sombra"], 32, "Vulto que se cola \xE0s paredes."),
    c2("olho_vil", "Olho Vil", "aberracao", ["vileza", "arcano"], 50, "Muitos olhos, muitas maldi\xE7\xF5es."),
    // plantas — vida/terra
    c2("trevo_carnivoro", "Trevo Carn\xEDvoro", "planta", ["vida", "terra"], 22, "Devora o incauto que se aproxima."),
    c2("ent", "Ent Anci\xE3o", "planta", ["vida", "terra"], 64, "Guardi\xE3o centen\xE1rio da floresta."),
    // espíritos — arcano/luz
    c2("fada", "Fada Cintilante", "espirito", ["arcano", "luz"], 26, "Pequena, veloz e travessa."),
    c2("anjo_menor", "Anjo Menor", "espirito", ["luz"], 68, "Mensageiro radiante."),
    c2("espectro", "Espectro Errante", "espirito", ["morte", "arcano"], 44, "Alma presa entre mundos."),
    // construtos — terra/marcial/eletricidade
    c2("golem_pedra", "Golem de Pedra", "construto", ["terra"], 54, "Muralha que anda."),
    c2("automato", "Aut\xF4mato Voltaico", "construto", ["eletricidade", "marcial"], 60, "Engenho movido a raios."),
    // demônios — vileza
    c2("imp", "Imp", "demonio", ["vileza"], 30, "Pequeno dem\xF4nio zombeteiro."),
    c2("demonio_maior", "Dem\xF4nio Maior", "demonio", ["vileza", "fogo"], 80, "Pactos s\xE3o selados com sangue."),
    // dracônicos — raros, exigem afinidade dupla e muito poder
    c2("wyvern", "Wyvern", "draconico", ["ar", "fogo"], 90, "Primo alado dos drag\xF5es."),
    c2("dragao_jovem", "Drag\xE3o Jovem", "draconico", ["fogo", "arcano"], 120, "Ainda jovem \u2014 e j\xE1 aterrador."),
    // gigantes — vigor/terra, corpanzil e força bruta
    c2("troll_montanhes", "Troll Montanh\xEAs", "gigante", ["vigor", "terra"], 56, "Regenera o que perde em combate."),
    c2("ciclope_forjador", "Ciclope Forjador", "gigante", ["vigor", "fogo"], 74, "Um olho s\xF3, martelo enorme."),
    // geleias — água/vileza, massas amorfas
    c2("gosma_acida", "Gosma \xC1cida", "geleia", ["agua", "vileza"], 26, "Dissolve o que toca aos poucos."),
    c2("slime_cristalino", "Slime Cristalino", "geleia", ["terra", "agua"], 40, "N\xFAcleo mineral, corpo l\xEDquido."),
    // humanoides — marcial/arcano, povos de fala e ferramenta
    c2("batedor_orc", "Batedor Orc", "humanoide", ["marcial", "vigor"], 32, "Rastreador implac\xE1vel das fronteiras."),
    c2("arauto_elfico", "Arauto \xC9lfico", "humanoide", ["arcano", "ar"], 46, "Mensageiro de uma corte antiga.")
  ].map((def) => [def.id, def])
);
function criaturas() {
  return Object.values(CRIATURAS);
}

// src/registry/estados.ts
var ESTADOS = {
  queimadura: { id: "queimadura", nome: "Queimadura", tipo: "ofensivo", descricao: "Dano de fogo ao longo do tempo." },
  congelamento: { id: "congelamento", nome: "Congelamento", tipo: "controle", descricao: "Alvo preso no gelo, sem agir." },
  choque: { id: "choque", nome: "Choque", tipo: "controle", descricao: "Paralisia breve por eletricidade." },
  petrificacao: { id: "petrificacao", nome: "Petrifica\xE7\xE3o", tipo: "controle", descricao: "Alvo vira pedra, im\xF3vel." },
  derrubada: { id: "derrubada", nome: "Derrubada", tipo: "controle", descricao: "Alvo \xE9 jogado no ch\xE3o/empurrado." },
  veneno: { id: "veneno", nome: "Veneno", tipo: "ofensivo", descricao: "Dano t\xF3xico cont\xEDnuo, dif\xEDcil de remover." },
  sangramento: { id: "sangramento", nome: "Sangramento", tipo: "ofensivo", descricao: "Ferida que sangra ao longo do tempo." },
  atordoamento: { id: "atordoamento", nome: "Atordoamento", tipo: "controle", descricao: "Alvo atordoado, incapaz de agir." },
  silencio: { id: "silencio", nome: "Sil\xEAncio", tipo: "controle", descricao: "Impede conjurar magias." },
  cegueira: { id: "cegueira", nome: "Cegueira", tipo: "controle", descricao: "Reduz precis\xE3o drasticamente." },
  medo: { id: "medo", nome: "Medo", tipo: "controle", descricao: "Alvo foge sem controle." },
  maldicao: { id: "maldicao", nome: "Maldi\xE7\xE3o", tipo: "ofensivo", descricao: "Enfraquece atributos e amplia dano recebido." },
  lentidao: { id: "lentidao", nome: "Lentid\xE3o", tipo: "controle", descricao: "Reduz velocidade de a\xE7\xE3o e movimento." },
  definhamento: { id: "definhamento", nome: "Definhamento", tipo: "ofensivo", descricao: "Decad\xEAncia da carne; impede cura." },
  encantado: { id: "encantado", nome: "Encantado", tipo: "controle", descricao: "Alvo hesita ou luta ao seu lado brevemente." },
  regeneracao: { id: "regeneracao", nome: "Regenera\xE7\xE3o", tipo: "positivo", descricao: "Recupera vida ao longo do tempo." },
  pressa: { id: "pressa", nome: "Pressa", tipo: "positivo", descricao: "Acelera a\xE7\xF5es e conjura\xE7\xE3o." },
  escudo: { id: "escudo", nome: "Escudo", tipo: "positivo", descricao: "Barreira que absorve dano." },
  furia_abencoada: { id: "furia_abencoada", nome: "F\xFAria Aben\xE7oada", tipo: "positivo", descricao: "Aumenta o dano do alvo." }
};
var ESTADOS_POR_ELEMENTO = {
  fogo: ["queimadura"],
  agua: ["congelamento", "lentidao"],
  terra: ["petrificacao", "derrubada"],
  ar: ["derrubada"],
  eletricidade: ["choque"],
  arcano: ["silencio"],
  sombra: ["cegueira", "medo"],
  luz: ["cegueira"],
  vileza: ["maldicao", "medo"],
  morte: ["definhamento", "medo"],
  vida: ["regeneracao"],
  vigor: [],
  marcial: ["sangramento", "atordoamento"],
  tempo: ["lentidao", "pressa"],
  som: ["silencio", "atordoamento"],
  gravidade: ["derrubada", "lentidao", "atordoamento"],
  espaco: ["derrubada", "lentidao"]
};
var ESTADOS_POR_ESCOLA = {
  combate_fisico: ["sangramento", "atordoamento"],
  longo_alcance: ["sangramento"],
  evocacao: [],
  conjuracao: [],
  maldicao: ["maldicao", "veneno", "lentidao", "silencio"],
  benca: ["regeneracao", "pressa", "escudo", "furia_abencoada"]
};

// src/registry/profissoes.ts
var PROFISSOES = {
  ferreiro: {
    id: "ferreiro",
    nome: "Ferreiro",
    descricao: "Forja armas e armaduras de metal. Escala com vigor, marcial, fogo e terra.",
    fatoresElementos: { vigor: 0.5, marcial: 0.5, fogo: 0.4, terra: 0.4 },
    fatoresEscolas: { combate_fisico: 0.3 }
  },
  tecelao: {
    id: "tecelao",
    nome: "Tecel\xE3o",
    descricao: "Tece vestes e mantos encantados. Escala com arcano, ar e som.",
    fatoresElementos: { arcano: 0.5, ar: 0.4, som: 0.4, luz: 0.3 },
    fatoresEscolas: { benca: 0.3 }
  },
  artesao: {
    id: "artesao",
    nome: "Artes\xE3o",
    descricao: "Monta engenhocas e dispositivos. Escala com arcano, eletricidade, gravidade e espa\xE7o.",
    fatoresElementos: { arcano: 0.5, eletricidade: 0.4, gravidade: 0.4, espaco: 0.4 },
    fatoresEscolas: { conjuracao: 0.3 }
  },
  joalheiro: {
    id: "joalheiro",
    nome: "Joalheiro",
    descricao: "Lapida gemas e forja joias. Escala com luz, arcano e cristal.",
    fatoresElementos: { luz: 0.5, arcano: 0.5, cristal: 0.5, tempo: 0.3 }
  },
  alquimista: {
    id: "alquimista",
    nome: "Alquimista",
    descricao: "Destila po\xE7\xF5es, \xF3leos e bombas. Escala com \xE1gua, vida, morte e vileza.",
    fatoresElementos: { agua: 0.5, vida: 0.4, morte: 0.4, vileza: 0.4 },
    fatoresEscolas: { maldicao: 0.3, benca: 0.2 }
  },
  curtidor: {
    id: "curtidor",
    nome: "Curtidor",
    descricao: "Trabalha couro e peles de criaturas. Escala com vida, vigor e sombra.",
    fatoresElementos: { vida: 0.5, vigor: 0.4, sombra: 0.4, terra: 0.3 },
    fatoresEscolas: { evocacao: 0.2 }
  },
  encantador: {
    id: "encantador",
    nome: "Encantador",
    descricao: "Grava elementos em objetos j\xE1 prontos. \xC9 a profiss\xE3o que mais depende de combina\xE7\xF5es: quanto mais derivados voc\xEA domina, mais fundo o encantamento vai.",
    fatoresElementos: { arcano: 0.6, luz: 0.35, sombra: 0.35, espaco: 0.3 },
    fatoresEscolas: { benca: 0.3, conjuracao: 0.2 }
  },
  escriba: {
    id: "escriba",
    nome: "Escriba",
    descricao: "Redige pergaminhos, glifos e contratos vinculantes. Escala com arcano, tempo, luz e vileza.",
    fatoresElementos: { arcano: 0.5, tempo: 0.45, luz: 0.35, vileza: 0.3 },
    fatoresEscolas: { maldicao: 0.25, benca: 0.25 }
  },
  cozinheiro: {
    id: "cozinheiro",
    nome: "Cozinheiro",
    descricao: "Prepara banquetes e ra\xE7\xF5es que sustentam o grupo. Escala com vida, fogo, \xE1gua e vigor.",
    fatoresElementos: { vida: 0.55, fogo: 0.4, agua: 0.35, vigor: 0.3 },
    fatoresEscolas: { benca: 0.35 }
  },
  luthier: {
    id: "luthier",
    nome: "Luthier",
    descricao: "Constr\xF3i instrumentos que conduzem can\xE7\xF5es de guerra. Escala com som, ar, vida e marcial.",
    fatoresElementos: { som: 0.65, ar: 0.35, vida: 0.3, marcial: 0.25 },
    fatoresEscolas: { benca: 0.3 }
  },
  cartografo: {
    id: "cartografo",
    nome: "Cart\xF3grafo",
    descricao: "Desenha cartas do espa\xE7o, do tempo e do que h\xE1 entre eles. Escala com espa\xE7o, tempo, gravidade e luz.",
    fatoresElementos: { espaco: 0.6, tempo: 0.45, gravidade: 0.35, luz: 0.25 },
    fatoresEscolas: { conjuracao: 0.25 }
  }
};
var item = (id, nome, profissao, categoria, descricao) => ({ id, nome, profissao, categoria, descricao });
var ITENS_BASE = Object.fromEntries(
  [
    // ferreiro
    item("espada", "Espada", "ferreiro", "arma", "L\xE2mina vers\xE1til de corte e estocada."),
    item("adaga", "Adaga", "ferreiro", "arma", "L\xE2mina curta, r\xE1pida e furtiva."),
    item("machado", "Machado", "ferreiro", "arma", "Peso e corte brutais."),
    item("martelo_guerra", "Martelo de Guerra", "ferreiro", "arma", "Impacto que quebra armaduras."),
    item("elmo", "Elmo", "ferreiro", "armadura", "Prote\xE7\xE3o para a cabe\xE7a."),
    item("peitoral", "Peitoral de Placas", "ferreiro", "armadura", "Armadura pesada de metal."),
    item("escudo", "Escudo", "ferreiro", "armadura", "Barreira de metal na m\xE3o."),
    // tecelão
    item("tunica", "T\xFAnica Arcana", "tecelao", "armadura", "Veste leve que amplia a magia."),
    item("manto", "Manto", "tecelao", "armadura", "Capa que protege dos elementos."),
    item("luvas_pano", "Luvas de Pano", "tecelao", "armadura", "Luvas finas para conjurar."),
    item("estandarte", "Estandarte", "tecelao", "acessorio", "Bandeira que inspira aliados."),
    // artesão
    item("besta_mecanica", "Besta Mec\xE2nica", "artesao", "arma", "Arma de repeti\xE7\xE3o engenhosa."),
    item("bracadeira", "Bra\xE7adeira Engenhosa", "artesao", "acessorio", "Dispositivo de pulso multiuso."),
    item("dispositivo", "Dispositivo", "artesao", "acessorio", "Engenhoca de efeito vari\xE1vel."),
    item("granada", "Granada", "artesao", "consumivel", "Explosivo arremess\xE1vel."),
    // joalheiro
    item("anel", "Anel", "joalheiro", "acessorio", "Aro encantado para o dedo."),
    item("amuleto", "Amuleto", "joalheiro", "acessorio", "Pingente de poder protetor."),
    item("coroa", "Coroa", "joalheiro", "acessorio", "Diadema que amplia a mente."),
    item("gema", "Gema Lapidada", "joalheiro", "acessorio", "Cristal que engasta em outro item."),
    // alquimista
    item("pocao", "Po\xE7\xE3o", "alquimista", "consumivel", "Frasco de efeito imediato."),
    item("bomba", "Bomba", "alquimista", "consumivel", "Frasco inst\xE1vel arremess\xE1vel."),
    item("oleo", "\xD3leo de Arma", "alquimista", "consumivel", "Un\xE7\xE3o que imbui uma arma."),
    item("elixir", "Elixir", "alquimista", "consumivel", "Po\xE7\xE3o duradoura e potente."),
    // curtidor
    item("armadura_couro", "Armadura de Couro", "curtidor", "armadura", "Prote\xE7\xE3o leve e flex\xEDvel."),
    item("botas", "Botas", "curtidor", "armadura", "Cal\xE7ado resistente de couro."),
    item("capa_pele", "Capa de Pele", "curtidor", "armadura", "Manto quente de pele de fera."),
    item("aljava", "Aljava", "curtidor", "acessorio", "Porta-flechas que agiliza os tiros."),
    // encantador
    item("selo", "Selo Elemental", "encantador", "acessorio", "Marca gravada que carrega um elemento inteiro."),
    item("orbe", "Orbe de Foco", "encantador", "acessorio", "Esfera que concentra e devolve a magia canalizada."),
    item("inscricao_arma", "Inscri\xE7\xE3o de Arma", "encantador", "arma", "Grava\xE7\xE3o que transforma a arma sem refaz\xEA-la."),
    item("velamento", "Velamento", "encantador", "armadura", "Camada invis\xEDvel de prote\xE7\xE3o tecida sobre a pe\xE7a."),
    // escriba
    item("pergaminho", "Pergaminho", "escriba", "consumivel", "Uma conjura\xE7\xE3o inteira guardada em papel."),
    item("glifo", "Glifo", "escriba", "acessorio", "S\xEDmbolo persistente que dispara ao ser pisado."),
    item("grimorio", "Grim\xF3rio", "escriba", "acessorio", "Volume que amplia tudo que voc\xEA conjura."),
    item("contrato", "Contrato", "escriba", "consumivel", "Acordo vinculante: cobra um pre\xE7o, entrega um poder."),
    // cozinheiro
    item("banquete", "Banquete", "cozinheiro", "consumivel", "Mesa que fortalece o grupo inteiro por horas."),
    item("racao", "Ra\xE7\xE3o de Marcha", "cozinheiro", "consumivel", "Comida densa que sustenta longas jornadas."),
    item("caldo", "Caldo Restaurador", "cozinheiro", "consumivel", "Sopa quente que devolve o f\xF4lego e a vontade."),
    item("conserva", "Conserva", "cozinheiro", "consumivel", "Preparo que guarda um efeito por muito tempo."),
    // luthier
    item("alaude", "Ala\xFAde", "luthier", "arma", "Instrumento de corda que dispara acordes cortantes."),
    item("tambor", "Tambor de Guerra", "luthier", "acessorio", "Batida que marca o ritmo da linha de frente."),
    item("corno", "Corno de Batalha", "luthier", "acessorio", "Sopro que se ouve do outro lado do campo."),
    item("diapasao", "Diapas\xE3o", "luthier", "acessorio", "Refer\xEAncia perfeita: afina magias como afina cordas."),
    // cartógrafo
    item("carta_estelar", "Carta Estelar", "cartografo", "acessorio", "Mapa do c\xE9u que aponta onde o poder est\xE1 agora."),
    item("bussola", "B\xFAssola Dimensional", "cartografo", "acessorio", "Agulha que aponta para lugares que n\xE3o existem aqui."),
    item("atlas", "Atlas", "cartografo", "acessorio", "Comp\xEAndio de rotas entre lugares e \xE9pocas."),
    item("marco", "Marco de Retorno", "cartografo", "consumivel", "\xC2ncora fincada: voc\xEA sempre pode voltar a este ponto.")
  ].map((d) => [d.id, d])
);
function itensDaProfissao(profissao) {
  return Object.values(ITENS_BASE).filter((i) => i.profissao === profissao);
}
var prop = (id, nome, descricao, categorias, cond, bonusQualidade) => ({ id, nome, descricao, categorias, ...cond, bonusQualidade });
var PROPRIEDADES_ITEM = Object.fromEntries(
  [
    prop(
      "tempera_perfeita",
      "T\xEAmpera Perfeita",
      "Fogo e frio no metal: durabilidade e corte superiores.",
      ["arma", "armadura"],
      { requerTodos: ["fogo", "agua"] },
      10
    ),
    prop(
      "flamejante",
      "Flamejante",
      "A arma arde: adiciona queimadura.",
      ["arma"],
      { requerAlgum: ["fogo", "lava", "chama_azul", "plasma"] },
      6
    ),
    prop(
      "gelida",
      "G\xE9lida",
      "O toque congela: lentid\xE3o e congelamento.",
      ["arma"],
      { requerAlgum: ["gelo", "agua"] },
      6
    ),
    prop(
      "envenenada",
      "Envenenada",
      "L\xE2mina untada: aplica veneno persistente.",
      ["arma"],
      { requerAlgum: ["veneno", "morte", "vileza", "praga"] },
      7
    ),
    prop(
      "condutora",
      "Condutora",
      "Metal eletrificado: choque em cadeia.",
      ["arma"],
      { requerAlgum: ["eletricidade", "plasma", "tempestade", "aco_voltaico"] },
      6
    ),
    prop(
      "flutuante",
      "Flutuante",
      "A arma orbita e ataca sozinha, sem m\xE3os.",
      ["arma"],
      { requerAlgum: ["gravidade", "espaco", "ar", "dobra"] },
      9
    ),
    prop(
      "abencoada",
      "Aben\xE7oada",
      "Consagrada: dano sagrado e prote\xE7\xE3o contra o profano.",
      ["arma", "armadura", "acessorio"],
      { requerAlgum: ["luz", "santidade", "bravura"] },
      6
    ),
    prop(
      "espectral",
      "Espectral",
      "Fere a alma: ignora parte da armadura.",
      ["arma"],
      { requerAlgum: ["sombra", "espectro", "vazio"] },
      7
    ),
    prop(
      "regenerativa",
      "Regenerativa",
      "Tece vida no portador: regenera\xE7\xE3o cont\xEDnua.",
      ["armadura", "acessorio"],
      { requerAlgum: ["vida", "vitalidade", "nascente"] },
      6
    ),
    prop(
      "gravitacional",
      "Gravitacional",
      "Campo de massa: puxa e prende inimigos pr\xF3ximos.",
      ["arma"],
      { requerAlgum: ["gravidade", "buraco_negro", "singularidade"] },
      8
    ),
    prop(
      "dimensional",
      "Dimensional",
      "Dobra o espa\xE7o: teleporte curto ao portador.",
      ["acessorio"],
      { requerAlgum: ["espaco", "portal", "continuum", "eter"] },
      8
    ),
    prop(
      "temporal",
      "Temporal",
      "Ancorado no tempo: concede pressa ao portador.",
      ["acessorio"],
      { requerAlgum: ["tempo", "cronomancia", "aceleracao"] },
      8
    ),
    prop(
      "vampirica",
      "Vamp\xEDrica",
      "Sedenta: rouba parte da vida do alvo.",
      ["arma"],
      { requerAlgum: ["parasita", "morte", "abismo"] },
      7
    ),
    prop(
      "runica",
      "R\xFAnica",
      "Gravada com runas: amplia o poder m\xE1gico do portador.",
      ["arma", "armadura", "acessorio"],
      { requerAlgum: ["runa", "arcano", "cristal"] },
      6
    ),
    prop(
      "ressonante",
      "Ressonante",
      "Vibra ao golpear: onda de choque s\xF4nica.",
      ["arma", "acessorio"],
      { requerAlgum: ["som", "trovao", "brado"] },
      6
    ),
    prop(
      "obra_prima",
      "Obra-Prima",
      "Trabalho de mestre: qualidade excepcional em tudo.",
      ["arma", "armadura", "acessorio", "consumivel"],
      { requerProfissaoNivel: 12 },
      12
    ),
    // ---- propriedades que só emergem de COMBINAÇÕES de aridade alta ----
    prop(
      "tempestuosa",
      "Tempestuosa",
      "Vento, \xE1gua e raio no mesmo objeto: cada golpe chama o c\xE9u.",
      ["arma", "acessorio"],
      { requerTodos: ["agua", "ar", "eletricidade"] },
      13
    ),
    prop(
      "cataclismica",
      "Catacl\xEDsmica",
      "Peso de mundo: o impacto abre cratera onde acerta.",
      ["arma"],
      { requerTodos: ["terra", "gravidade", "fogo"] },
      15
    ),
    prop(
      "sepulcral",
      "Sepulcral",
      "Morte, sombra e vileza costuradas: a pe\xE7a se alimenta de quem cai perto.",
      ["arma", "armadura"],
      { requerTodos: ["morte", "sombra", "vileza"] },
      14
    ),
    prop(
      "consagrada",
      "Consagrada",
      "Luz, vida e vigor consagrados juntos: protege e ergue quem porta.",
      ["armadura", "acessorio"],
      { requerTodos: ["luz", "vida", "vigor"] },
      14
    ),
    prop(
      "paradoxal",
      "Paradoxal",
      "Tempo e espa\xE7o tran\xE7ados no material: o objeto est\xE1 sempre um instante \xE0 frente.",
      ["arma", "acessorio"],
      { requerTodos: ["tempo", "espaco"] },
      12
    ),
    prop(
      "primordial_item",
      "Primordial",
      "Os cinco primais assentados numa pe\xE7a s\xF3: ela responde ao terreno.",
      ["arma", "armadura", "acessorio"],
      { requerTodos: ["fogo", "agua", "terra", "ar", "eletricidade"], requerProfissaoNivel: 15 },
      20
    ),
    // ---- propriedades das profissões novas ----
    prop(
      "harmonica",
      "Harm\xF4nica",
      "Afinada com precis\xE3o: as can\xE7\xF5es que saem daqui alcan\xE7am mais longe.",
      ["arma", "acessorio"],
      { requerAlgum: ["som", "harmonia", "cantico", "melodia"] },
      8
    ),
    prop(
      "dissonante",
      "Dissonante",
      "Propositalmente desafinada: quem escuta perde o compasso.",
      ["arma", "acessorio"],
      { requerAlgum: ["dissonancia", "sussurro", "requiem"] },
      8
    ),
    prop(
      "nutritiva",
      "Nutritiva",
      "Sustento de verdade: o efeito dura muito al\xE9m da refei\xE7\xE3o.",
      ["consumivel"],
      { requerAlgum: ["vida", "vitalidade", "nascente", "flora"] },
      7
    ),
    prop(
      "inebriante",
      "Inebriante",
      "Sobe \xE0 cabe\xE7a: coragem emprestada, ju\xEDzo suspenso.",
      ["consumivel"],
      { requerAlgum: ["vileza", "fervor", "carnificina"] },
      7
    ),
    prop(
      "vinculante",
      "Vinculante",
      "O que est\xE1 escrito passa a valer: o efeito n\xE3o pode ser dissipado.",
      ["consumivel", "acessorio"],
      { requerAlgum: ["pacto", "runa", "arcano"] },
      9
    ),
    prop(
      "profetica",
      "Prof\xE9tica",
      "Registra o que ainda n\xE3o aconteceu: revela a pr\xF3xima a\xE7\xE3o do inimigo.",
      ["acessorio"],
      { requerAlgum: ["tempo", "cronomancia", "presagio", "continuum"] },
      11
    ),
    prop(
      "cartografada",
      "Cartografada",
      "O espa\xE7o j\xE1 foi medido: teleporte preciso em vez de aproximado.",
      ["acessorio"],
      { requerAlgum: ["espaco", "portal", "dobra", "constelacao"] },
      10
    ),
    prop(
      "gravada_fundo",
      "Gravada Fundo",
      "Encantamento assentado na estrutura, n\xE3o na superf\xEDcie: n\xE3o se apaga.",
      ["arma", "armadura", "acessorio"],
      { requerAlgum: ["arcano", "cristal", "runa"], requerProfissaoNivel: 10 },
      11
    )
  ].map((d) => [d.id, d])
);
function propriedades() {
  return Object.values(PROPRIEDADES_ITEM);
}
var MATERIAIS_CRIATURA = {
  besta: {
    familia: "besta",
    material: "Couro R\xFAstico",
    propriedade: { nome: "Resistente", descricao: "Couro grosso: aguenta mais castigo.", categorias: ["armadura"], bonusQualidade: 5 },
    qualidadePorPoder: 0.15
  },
  ave: {
    familia: "ave",
    material: "Plumas",
    propriedade: { nome: "Leve como Pena", descricao: "N\xE3o pesa nada: mobilidade e velocidade.", categorias: ["armadura", "acessorio"], bonusQualidade: 6 },
    qualidadePorPoder: 0.15
  },
  aquatica: {
    familia: "aquatica",
    material: "Escamas",
    propriedade: { nome: "Escamada", descricao: "Escamas sobrepostas: desliza golpes e repele \xE1gua.", categorias: ["armadura"], bonusQualidade: 6 },
    qualidadePorPoder: 0.18
  },
  ignea: {
    familia: "ignea",
    material: "Couro \xCDgneo",
    propriedade: { nome: "Ign\xEDfuga", descricao: "Imune ao fogo; queima quem toca.", categorias: ["armadura", "acessorio"], bonusQualidade: 8 },
    qualidadePorPoder: 0.2
  },
  morto_vivo: {
    familia: "morto_vivo",
    material: "Ossos e Mortalha",
    propriedade: { nome: "Profana", descricao: "Feita da morte: resiste a definhamento e medo.", categorias: ["armadura", "arma"], bonusQualidade: 7 },
    qualidadePorPoder: 0.18
  },
  aberracao: {
    familia: "aberracao",
    material: "Carne Aberrante",
    propriedade: { nome: "Perturbadora", descricao: "Errada de prop\xF3sito: apavora quem encara.", categorias: ["armadura", "arma", "acessorio"], bonusQualidade: 7 },
    qualidadePorPoder: 0.2
  },
  planta: {
    familia: "planta",
    material: "Fibra Viva",
    propriedade: { nome: "Rebrotante", descricao: "Fibra que se regenera: repara sozinha com o tempo.", categorias: ["armadura", "acessorio"], bonusQualidade: 6 },
    qualidadePorPoder: 0.16
  },
  espirito: {
    familia: "espirito",
    material: "\xC9ctoplasma",
    propriedade: { nome: "Et\xE9rea", descricao: "Meio-fantasma: \xE0s vezes o golpe atravessa voc\xEA.", categorias: ["armadura", "acessorio"], bonusQualidade: 9 },
    qualidadePorPoder: 0.22
  },
  construto: {
    familia: "construto",
    material: "Placas e Engrenagens",
    propriedade: { nome: "Blindada", descricao: "Ferro reaproveitado: defesa pesada embutida.", categorias: ["armadura"], bonusQualidade: 8 },
    qualidadePorPoder: 0.2
  },
  demonio: {
    familia: "demonio",
    material: "Chifres e Couro Vil",
    propriedade: { nome: "Maldita", descricao: "Pactuada: amplia o poder, mas cobra seu pre\xE7o.", categorias: ["arma", "armadura", "acessorio"], bonusQualidade: 9 },
    qualidadePorPoder: 0.22
  },
  draconico: {
    familia: "draconico",
    material: "Escama de Drag\xE3o",
    propriedade: { nome: "Drac\xF4nica", descricao: "A cobi\xE7a dos reis: resist\xEAncia elemental lend\xE1ria.", categorias: ["arma", "armadura", "acessorio"], bonusQualidade: 14 },
    qualidadePorPoder: 0.28
  },
  gigante: {
    familia: "gigante",
    material: "Ossatura Colossal",
    propriedade: { nome: "Descomunal", descricao: "Peso e alcance fora da escala: golpes mais pesados.", categorias: ["arma", "armadura"], bonusQualidade: 10 },
    qualidadePorPoder: 0.24
  },
  geleia: {
    familia: "geleia",
    material: "Gel Reativo",
    propriedade: { nome: "Absorvente", descricao: "Amortece impacto ao se deformar sob o golpe.", categorias: ["armadura", "acessorio"], bonusQualidade: 6 },
    qualidadePorPoder: 0.17
  },
  humanoide: {
    familia: "humanoide",
    material: "Couro Curtido",
    propriedade: { nome: "Vers\xE1til", descricao: "Trabalhado por m\xE3os h\xE1beis: encaixe confort\xE1vel em qualquer pe\xE7a.", categorias: ["arma", "armadura", "acessorio"], bonusQualidade: 5 },
    qualidadePorPoder: 0.14
  }
};

// src/engine/evocacao.ts
var MAESTRIA_LIMIAR = 8;
var CAPTURA_BASE = 8;
var CAPTURA_POR_NIVEL_ELEMENTO = 4;
var CAPTURA_POR_EVOCACAO = 3;
var CAPTURA_BONUS_INSTINTO = 0.15;
var EVOC_ESCALA = 0.05;
var ELEMENTAL_BASE = 10;
var ELEMENTAL_POR_NIVEL = 4;
var ALEATORIA_BASE = 8;
var ALEATORIA_POR_EVOCACAO = 6;
var IMBUIR_POR_NIVEL = 0.03;
var VINCULO_POR_NIVEL = 0.08;
var ALFA_BONUS = 0.12;
var talento = (p, id) => p.talentos[id] ?? 0;
function elementosDeMaestria(prog, limiar = MAESTRIA_LIMIAR) {
  return Object.keys(prog.niveisEfetivos).filter(
    (id) => (prog.niveisEfetivos[id] ?? 0) >= limiar
  );
}
function poderCaptura(p, prog, criatura) {
  const nivelAfinidade = Math.max(
    0,
    ...criatura.afinidades.map((e) => p.elementos[e] ?? 0)
    // pontos DIRETOS no elemento de afinidade
  );
  if (nivelAfinidade <= 0) return 0;
  const evocacao = p.escolas.evocacao ?? 0;
  const instinto = talento(p, "instinto_de_caca");
  const bruto = CAPTURA_BASE + CAPTURA_POR_NIVEL_ELEMENTO * nivelAfinidade + CAPTURA_POR_EVOCACAO * evocacao;
  return bruto * (1 + CAPTURA_BONUS_INSTINTO * instinto);
}
function avaliarCaptura(p, prog, criaturaId) {
  const criatura = CRIATURAS[criaturaId];
  if (!criatura) return { capturavel: false, poder: 0, exigido: 0, motivo: "Criatura desconhecida." };
  if ((p.escolas.evocacao ?? 0) <= 0) {
    return { capturavel: false, poder: 0, exigido: criatura.poderBase, motivo: "Requer pontos em Evoca\xE7\xE3o." };
  }
  const temAfinidade = criatura.afinidades.some((e) => (p.elementos[e] ?? 0) > 0);
  if (!temAfinidade) {
    const nomes = criatura.afinidades.map((e) => ELEMENTOS[e].nome).join(" ou ");
    return {
      capturavel: false,
      poder: 0,
      exigido: criatura.poderBase,
      motivo: `Sem afinidade: invista em ${nomes} para capturar esta criatura.`
    };
  }
  const poder = poderCaptura(p, prog, criatura);
  return {
    capturavel: poder >= criatura.poderBase,
    poder,
    exigido: criatura.poderBase,
    motivo: poder >= criatura.poderBase ? void 0 : "Poder de captura insuficiente \u2014 suba o elemento de afinidade ou Evoca\xE7\xE3o."
  };
}
function familiasCapturaveis(p, prog) {
  const fam = /* @__PURE__ */ new Set();
  for (const cr of Object.values(CRIATURAS)) {
    if (avaliarCaptura(p, prog, cr.id).capturavel) fam.add(cr.familia);
  }
  return fam;
}
function capacidadeVinculo(p) {
  if (talento(p, "vinculo_primal") <= 0) return 0;
  return 1 + talento(p, "matilha_domada");
}
function bonusVinculo(p, nivelVinculo) {
  if (nivelVinculo <= 0) return 0;
  const evolucao = talento(p, "evolucao_da_fera");
  const alfa = talento(p, "fera_alfa");
  return nivelVinculo * VINCULO_POR_NIVEL * (1 + 0.25 * evolucao) + ALFA_BONUS * alfa;
}
function evocar(p, prog, cfg) {
  const evocacao = p.escolas.evocacao ?? 0;
  const escalaEvoc = 1 + EVOC_ESCALA * evocacao;
  const erros = [];
  if (evocacao <= 0) erros.push("Requer pontos na escola Evoca\xE7\xE3o.");
  if (cfg.modo === "elemental") {
    const elem = cfg.elemento && ELEMENTOS[cfg.elemento];
    const nivel = cfg.elemento ? prog.niveisEfetivos[cfg.elemento] ?? 0 : 0;
    if (!elem) erros.push("Elemento inv\xE1lido.");
    else if (nivel <= 0) erros.push(`Elemento "${elem.nome}" n\xE3o liberado.`);
    const poder2 = elem ? (ELEMENTAL_BASE + ELEMENTAL_POR_NIVEL * nivel) * escalaEvoc * elem.fatorPotencia : 0;
    return {
      valida: erros.length === 0,
      erros,
      nome: elem ? `Elemental de ${elem.nome}` : "Elemental",
      familia: "elemental",
      poder: poder2,
      vinculada: false
    };
  }
  if (cfg.modo === "aleatoria") {
    const poder2 = (ALEATORIA_BASE + ALEATORIA_POR_EVOCACAO * evocacao) * escalaEvoc;
    return {
      valida: erros.length === 0,
      erros,
      nome: "Criatura Aleat\xF3ria",
      familia: "aleatoria",
      poder: poder2,
      vinculada: false
    };
  }
  const criatura = cfg.criaturaId ? CRIATURAS[cfg.criaturaId] : void 0;
  if (!criatura) {
    erros.push("Nenhuma criatura capturada selecionada.");
    return { valida: false, erros, nome: "Criatura", poder: 0, vinculada: false };
  }
  let imbuido;
  let multImbuir = 1;
  if (cfg.elementoImbuido) {
    const nivel = prog.niveisEfetivos[cfg.elementoImbuido] ?? 0;
    if (nivel < MAESTRIA_LIMIAR) {
      erros.push(
        `S\xF3 \xE9 poss\xEDvel imbuir um elemento com maestria (n\xEDvel ${MAESTRIA_LIMIAR}+): ${ELEMENTOS[cfg.elementoImbuido]?.nome ?? cfg.elementoImbuido} est\xE1 em ${nivel}.`
      );
    } else {
      imbuido = cfg.elementoImbuido;
      multImbuir = ELEMENTOS[imbuido].fatorPotencia * (1 + IMBUIR_POR_NIVEL * nivel);
    }
  }
  const nivelVinculo = cfg.nivelVinculo ?? 0;
  const multVinculo = 1 + bonusVinculo(p, nivelVinculo);
  const poder = criatura.poderBase * escalaEvoc * multImbuir * multVinculo;
  const nomeImbuido = imbuido ? `${criatura.nome} de ${ELEMENTOS[imbuido].nome}` : criatura.nome;
  return {
    valida: erros.length === 0,
    erros,
    nome: nomeImbuido,
    familia: criatura.familia,
    poder,
    imbuido,
    vinculada: nivelVinculo > 0
  };
}
function afinidadesAtivas(p) {
  return elementosBase().map((e) => e.id).filter((id) => (p.elementos[id] ?? 0) > 0);
}
var FAMILIAS_MONTAVEIS = [
  "besta",
  "aquatica",
  "ave",
  "construto",
  "draconico"
];
var MONTARIA_PODER_MINIMO = 30;
function avaliarMontaria(p, criaturaId) {
  const cri = CRIATURAS[criaturaId];
  if (!cri) return { montavel: false, motivo: "Criatura desconhecida." };
  if (talento(p, "montaria") <= 0) {
    return { montavel: false, motivo: "Requer o talento Montaria." };
  }
  const entrada = p.bestiario?.find((c3) => c3.criaturaId === criaturaId);
  if (!entrada || entrada.nivelVinculo <= 0) {
    return { montavel: false, motivo: "S\xF3 \xE9 poss\xEDvel montar uma fera vinculada (domada)." };
  }
  if (!FAMILIAS_MONTAVEIS.includes(cri.familia)) {
    return { montavel: false, motivo: `Fam\xEDlia ${cri.familia} n\xE3o serve de montaria.` };
  }
  if (cri.poderBase < MONTARIA_PODER_MINIMO) {
    return { montavel: false, motivo: `Porte insuficiente para montar (poder < ${MONTARIA_PODER_MINIMO}).` };
  }
  return { montavel: true };
}
function bonusSinergiaCombate(p) {
  return 0.05 * talento(p, "sincronia_de_combate");
}
var MONTARIA_RAREZA_TETO = 0.2;
var MONTARIA_RAREZA_DIVISOR = 300;
function bonusMontaria(p, criaturaId) {
  if (!avaliarMontaria(p, criaturaId).montavel) return 0;
  const cri = CRIATURAS[criaturaId];
  const rareza = Math.min(MONTARIA_RAREZA_TETO, cri.poderBase / MONTARIA_RAREZA_DIVISOR);
  return 0.12 * talento(p, "carga_montada") + bonusSinergiaCombate(p) + rareza;
}

// src/engine/profissoes.ts
var QUAL_BASE = 8;
var QUAL_POR_NIVEL_PROFISSAO = 2.5;
var QUAL_POR_PROPRIEDADE = 0;
var TIERS = [
  { nome: "Comum", cor: "#9a92a8", minimo: 0 },
  { nome: "Incomum", cor: "#5fae82", minimo: 24 },
  { nome: "Raro", cor: "#4f8fd0", minimo: 42 },
  { nome: "\xC9pico", cor: "#9d6fd0", minimo: 62 },
  { nome: "Lend\xE1rio", cor: "#d9a24b", minimo: 84 },
  { nome: "M\xEDtico", cor: "#d06a5a", minimo: 108 }
];
function tierDe(qualidade) {
  let tier = TIERS[0];
  for (const t of TIERS) if (qualidade >= t.minimo) tier = t;
  return tier;
}
var talento2 = (p, id) => p.talentos[id] ?? 0;
function elementosDominados(prog, limiar = MAESTRIA_LIMIAR) {
  return Object.keys(prog.niveisEfetivos).filter(
    (id) => (prog.niveisEfetivos[id] ?? 0) >= limiar
  );
}
function propriedadeAtende(def, p, prog, nivelProfissao, imbuidosDominados) {
  if (def.requerProfissaoNivel && nivelProfissao < def.requerProfissaoNivel) return false;
  if (def.requerTalento && talento2(p, def.requerTalento) <= 0) return false;
  if (def.requerTodos && !def.requerTodos.every((e) => imbuidosDominados.has(e))) return false;
  if (def.requerAlgum && !def.requerAlgum.some((e) => imbuidosDominados.has(e))) return false;
  return true;
}
function craftar(p, prog, cfg) {
  const erros = [];
  const profissao = PROFISSOES[cfg.profissao];
  const item2 = ITENS_BASE[cfg.itemId];
  const nivelProfissao = p.profissoes?.[cfg.profissao] ?? 0;
  if (!profissao) erros.push("Profiss\xE3o inv\xE1lida.");
  if (!item2) erros.push("Item inv\xE1lido.");
  if (item2 && item2.profissao !== cfg.profissao) {
    erros.push(`"${item2.nome}" n\xE3o pertence \xE0 profiss\xE3o ${profissao?.nome}.`);
  }
  if (nivelProfissao <= 0) erros.push(`Invista pontos na profiss\xE3o ${profissao?.nome ?? ""}.`);
  const dominados = new Set(elementosDominados(prog));
  const imbuidosDominados = new Set(
    cfg.elementosImbuidos.filter((e) => dominados.has(e))
  );
  for (const e of cfg.elementosImbuidos) {
    if (!dominados.has(e)) {
      erros.push(`Sem maestria (n\xEDvel ${MAESTRIA_LIMIAR}+) em ${ELEMENTOS[e]?.nome ?? e} para imbuir.`);
    }
  }
  const atributos = [];
  let qualidade = QUAL_BASE + nivelProfissao * QUAL_POR_NIVEL_PROFISSAO;
  atributos.push({ rotulo: `Profiss\xE3o ${profissao?.nome ?? ""} (nv ${nivelProfissao})`, valor: nivelProfissao * QUAL_POR_NIVEL_PROFISSAO });
  if (profissao) {
    for (const [elem, peso] of Object.entries(profissao.fatoresElementos)) {
      const nivel = prog.niveisEfetivos[elem] ?? 0;
      if (nivel > 0) {
        const contrib = nivel * peso;
        qualidade += contrib;
        atributos.push({ rotulo: `${ELEMENTOS[elem]?.nome ?? elem} \xD7${peso}`, valor: contrib });
      }
    }
    for (const [escola, peso] of Object.entries(profissao.fatoresEscolas ?? {})) {
      const nivel = p.escolas[escola] ?? 0;
      if (nivel > 0) {
        const contrib = nivel * peso;
        qualidade += contrib;
        atributos.push({ rotulo: `${escola} \xD7${peso}`, valor: contrib });
      }
    }
  }
  const propriedadesAplicaveis = [];
  if (item2) {
    for (const def of Object.values(PROPRIEDADES_ITEM)) {
      if (!def.categorias.includes(item2.categoria)) continue;
      if (propriedadeAtende(def, p, prog, nivelProfissao, imbuidosDominados)) {
        propriedadesAplicaveis.push(def);
        qualidade += def.bonusQualidade + QUAL_POR_PROPRIEDADE;
      }
    }
  }
  if (cfg.materialCriaturaId) {
    const cri = CRIATURAS[cfg.materialCriaturaId];
    if (cfg.profissao !== "curtidor") {
      erros.push("S\xF3 o Curtidor trabalha peles e carca\xE7as de criatura.");
    } else if (!cri) {
      erros.push("Material de criatura desconhecido.");
    } else if (!p.bestiario?.some((b) => b.criaturaId === cri.id)) {
      erros.push(`Capture ${cri.nome} no besti\xE1rio antes de us\xE1-la como material.`);
    } else {
      const mat = MATERIAIS_CRIATURA[cri.familia];
      qualidade += cri.poderBase * mat.qualidadePorPoder;
      atributos.push({
        rotulo: `${mat.material} (${FAMILIAS[cri.familia].nome}, poder ${cri.poderBase})`,
        valor: cri.poderBase * mat.qualidadePorPoder
      });
      if (item2 && mat.propriedade.categorias.includes(item2.categoria)) {
        const propMat = {
          id: `mat_${cri.familia}`,
          nome: mat.propriedade.nome,
          descricao: `${mat.propriedade.descricao} (de ${cri.nome})`,
          categorias: mat.propriedade.categorias,
          bonusQualidade: mat.propriedade.bonusQualidade
        };
        propriedadesAplicaveis.push(propMat);
        qualidade += propMat.bonusQualidade;
      }
    }
  }
  const adjetivos = propriedadesAplicaveis.filter((d) => d.id !== "obra_prima").slice(0, 2).map((d) => d.nome);
  const nomeItem = item2 ? adjetivos.length ? `${item2.nome} ${adjetivos.join(" e ")}` : item2.nome : "Item";
  return {
    valida: erros.length === 0,
    erros,
    item: item2,
    qualidade,
    tier: tierDe(qualidade),
    nomeItem,
    propriedades: propriedadesAplicaveis,
    atributos
  };
}

// src/engine/progressao.ts
function somaEfeitos(p, filtro) {
  let total = 0;
  for (const [id, ranks] of Object.entries(p.talentos)) {
    if (!ranks) continue;
    for (const efeito of TALENTOS[id].efeitos) total += filtro(efeito, ranks);
  }
  return total;
}
var PENALIDADE_CAPACIDADE_DILUIDA = 0.18;
function calcularProgressao(p) {
  const niveis = {};
  const transbordo = {};
  for (const id of Object.keys(ELEMENTOS)) niveis[id] = 0;
  const reducaoMinimoReceita = Math.floor(
    somaEfeitos(p, (e, r) => e.tipo === "receita_minimo_reducao" ? e.valorPorRank * r : 0)
  );
  const bonusNivelDerivado = Math.floor(
    somaEfeitos(p, (e, r) => e.tipo === "nivel_derivado_bonus" ? e.valorPorRank * r : 0)
  );
  const bonusTransbordo = somaEfeitos(
    p,
    (e, r) => e.tipo === "propriedade" && e.chave === "transbordo_bonus" ? e.valorPorRank * r : 0
  );
  const diretosDerivados = {};
  for (const [id, pontos] of Object.entries(p.elementos)) {
    if (ELEMENTOS[id]?.tipo === "base") niveis[id] += pontos;
    else diretosDerivados[id] = pontos;
  }
  for (const s of SINERGIAS) {
    const origem = p.elementos[s.de] ?? 0;
    const bonus = Math.floor(origem * s.razao * (1 + bonusTransbordo));
    if (bonus <= 0) continue;
    for (const alvo of s.para) {
      niveis[alvo] += bonus;
      transbordo[alvo] = (transbordo[alvo] ?? 0) + bonus;
    }
  }
  const reducaoDivisor = somaEfeitos(
    p,
    (e, r) => e.tipo === "cascata_divisor_reducao" ? e.valorPorRank * r : 0
  );
  const cascata = calcularCascata(p.elementos, { reducaoDivisor, bonusTransbordo });
  const alocaveis = elementosAlocaveis(cascata);
  const diretoValido = (id) => cascata.destravados.has(id) ? diretosDerivados[id] ?? 0 : 0;
  for (const def of Object.values(ELEMENTOS)) {
    if (!def.receita) continue;
    const niveisComponentes = def.receita.map((c3) => niveis[c3.elemento]);
    const atendeMinimos = def.receita.every(
      (c3) => niveis[c3.elemento] >= Math.max(1, c3.nivelMinimo - reducaoMinimoReceita)
    );
    niveis[def.id] = atendeMinimos ? Math.min(...niveisComponentes) + bonusNivelDerivado + diretoValido(def.id) : 0;
  }
  const combinacoesLiberadas = [];
  for (const info of TODAS_COMBINACOES) {
    if (niveis[info.id] !== void 0) continue;
    const minimo = Math.max(1, info.nivelMinimo - reducaoMinimoReceita);
    let menor = Infinity;
    let atende = true;
    for (const comp of info.componentes) {
      const n = niveis[comp] ?? 0;
      if (n < minimo) {
        atende = false;
        break;
      }
      if (n < menor) menor = n;
    }
    if (!atende) continue;
    niveis[info.id] = menor + bonusNivelDerivado + diretoValido(info.id);
    combinacoesLiberadas.push(info);
  }
  const arquetipos = [];
  const capacidades = /* @__PURE__ */ new Set();
  for (const arq of Object.values(ARQUETIPOS)) {
    const c3 = arq.condicao;
    const okElementos = Object.entries(c3.elementos ?? {}).every(
      ([id, min]) => niveis[id] >= (min ?? 0)
    );
    const okEscolas = Object.entries(c3.escolas ?? {}).every(
      ([id, min]) => (p.escolas[id] ?? 0) >= (min ?? 0)
    );
    const okRecursos = Object.entries(c3.recursos ?? {}).every(
      ([id, min]) => (p.recursos[id] ?? 0) >= (min ?? 0)
    );
    if (okElementos && okEscolas && okRecursos) {
      arquetipos.push(arq);
      for (const cap of arq.capacidades) capacidades.add(cap);
    }
  }
  const capacidadesDiluidas = /* @__PURE__ */ new Set();
  const arquetiposDiluidos = [];
  const receitasAmplas = [];
  for (const info of combinacoesLiberadas) receitasAmplas.push(info.componentes);
  for (const def of Object.values(ELEMENTOS)) {
    if ((def.receita?.length ?? 0) >= 3 && (niveis[def.id] ?? 0) > 0) {
      receitasAmplas.push(def.receita.map((c3) => c3.elemento));
    }
  }
  if (receitasAmplas.length) {
    for (const arq of Object.values(ARQUETIPOS)) {
      if (arquetipos.includes(arq)) continue;
      const exigidos = Object.keys(arq.condicao.elementos ?? {});
      if (!exigidos.length) continue;
      const contido = receitasAmplas.some((comps) => {
        const conjunto = new Set(comps);
        for (const alvo of exigidos) {
          const def = ELEMENTOS[alvo];
          const partes = def?.receita?.map((c3) => c3.elemento) ?? [alvo];
          if (!partes.every((x) => conjunto.has(x))) return false;
        }
        return true;
      });
      if (!contido) continue;
      arquetiposDiluidos.push(arq);
      for (const cap of arq.capacidades) {
        if (!capacidades.has(cap)) capacidadesDiluidas.add(cap);
      }
    }
  }
  const elementosDisponiveis = Object.keys(niveis).filter(
    (id) => niveis[id] > 0
  );
  return {
    niveisEfetivos: niveis,
    transbordo,
    reducaoMinimoReceita,
    bonusNivelDerivado,
    elementosDisponiveis,
    combinacoesLiberadas,
    cascata,
    alocaveis,
    arquetipos,
    capacidades,
    capacidadesDiluidas,
    arquetiposDiluidos
  };
}

// src/engine/personagem.ts
var MAX_NIVEL_VINCULO = 5;
function criarPersonagem(nome) {
  return { nome, elementos: {}, escolas: {}, recursos: {}, talentos: {}, bestiario: [], profissoes: {} };
}
function investirProfissao(p, profissao, pontos) {
  if (!PROFISSOES[profissao]) throw new Error(`Profiss\xE3o desconhecida: ${profissao}`);
  if (pontos <= 0 || !Number.isInteger(pontos)) throw new Error("Pontos devem ser inteiros positivos.");
  p.profissoes[profissao] = (p.profissoes[profissao] ?? 0) + pontos;
}
function podeInvestir(p, elemento, prog) {
  const def = elementoDef(elemento);
  if (!def) return { ok: false, motivo: `Elemento desconhecido: ${elemento}` };
  if (def.tipo === "base") return { ok: true };
  const cascata = (prog ?? calcularProgressao(p)).cascata;
  if (cascata.destravados.has(elemento)) return { ok: true };
  if (def.cascata?.destravavel === false) {
    return { ok: false, motivo: `"${def.nome}" nunca aceita pontos diretos.` };
  }
  const progresso = cascata.progressoDestravamento.get(elemento);
  const limiar = progresso?.limiar ?? LIMIAR_DESTRAVAMENTO[Math.min(4, def.receita?.length ?? 2)];
  const passivos = progresso?.passivos ?? 0;
  return {
    ok: false,
    motivo: `"${def.nome}" ainda n\xE3o foi destravado: ${passivos}/${limiar} pontos passivos. Invista nos componentes para a cascata destrav\xE1-lo.`,
    faltamPassivos: limiar - passivos
  };
}
function investirElemento(p, elemento, pontos, prog) {
  const permitido = podeInvestir(p, elemento, prog);
  if (!permitido.ok) throw new Error(permitido.motivo);
  if (pontos <= 0 || !Number.isInteger(pontos)) throw new Error("Pontos devem ser inteiros positivos.");
  p.elementos[elemento] = (p.elementos[elemento] ?? 0) + pontos;
}
function desinvestirElemento(p, elemento, pontos) {
  if (pontos <= 0 || !Number.isInteger(pontos)) throw new Error("Pontos devem ser inteiros positivos.");
  const atual = p.elementos[elemento] ?? 0;
  if (pontos > atual) {
    const nome = elementoDef(elemento)?.nome ?? elemento;
    throw new Error(`"${nome}" tem ${atual} pontos diretos \u2014 n\xE3o d\xE1 para remover ${pontos}.`);
  }
  const restante = atual - pontos;
  if (restante <= 0) delete p.elementos[elemento];
  else p.elementos[elemento] = restante;
}
function investirEscola(p, escola, pontos) {
  if (!ESCOLAS[escola]) throw new Error(`Escola desconhecida: ${escola}`);
  if (pontos <= 0 || !Number.isInteger(pontos)) throw new Error("Pontos devem ser inteiros positivos.");
  p.escolas[escola] = (p.escolas[escola] ?? 0) + pontos;
}
function investirRecurso(p, recurso, pontos) {
  if (!RECURSOS[recurso]) throw new Error(`Recurso desconhecido: ${recurso}`);
  if (pontos <= 0 || !Number.isInteger(pontos)) throw new Error("Pontos devem ser inteiros positivos.");
  p.recursos[recurso] = (p.recursos[recurso] ?? 0) + pontos;
}
function investirTalento(p, talento3, ranks) {
  const def = TALENTOS[talento3];
  if (!def) throw new Error(`Talento desconhecido: ${talento3}`);
  if (ranks <= 0 || !Number.isInteger(ranks)) throw new Error("Ranks devem ser inteiros positivos.");
  const atual = p.talentos[talento3] ?? 0;
  if (atual + ranks > def.ranksMaximos) {
    throw new Error(`"${def.nome}" tem no m\xE1ximo ${def.ranksMaximos} ranks.`);
  }
  if (def.requisito) {
    const { escola, recurso, nivelMinimo } = def.requisito;
    if (escola && (p.escolas[escola] ?? 0) < nivelMinimo) {
      throw new Error(`"${def.nome}" exige ${nivelMinimo} pontos em ${ESCOLAS[escola].nome}.`);
    }
    if (recurso && (p.recursos[recurso] ?? 0) < nivelMinimo) {
      throw new Error(
        `"${def.nome}" exige profici\xEAncia ${nivelMinimo} no recurso ${RECURSOS[recurso].nome}.`
      );
    }
  }
  for (const rival of def.exclusivoCom ?? []) {
    if ((p.talentos[rival] ?? 0) > 0) {
      throw new Error(
        `"${def.nome}" \xE9 exclusivo com "${TALENTOS[rival].nome}" \u2014 remova os ranks rivais primeiro.`
      );
    }
  }
  p.talentos[talento3] = atual + ranks;
}
function capturarCriatura(p, prog, criaturaId) {
  if (!CRIATURAS[criaturaId]) throw new Error(`Criatura desconhecida: ${criaturaId}`);
  if (p.bestiario.some((c3) => c3.criaturaId === criaturaId)) {
    throw new Error("Essa criatura j\xE1 est\xE1 no seu besti\xE1rio.");
  }
  const av = avaliarCaptura(p, prog, criaturaId);
  if (!av.capturavel) throw new Error(av.motivo ?? "N\xE3o \xE9 poss\xEDvel capturar esta criatura.");
  p.bestiario.push({ criaturaId, nivelVinculo: 0 });
}
function soltarCriatura(p, criaturaId) {
  p.bestiario = p.bestiario.filter((c3) => c3.criaturaId !== criaturaId);
}
function domarCriatura(p, criaturaId) {
  const entrada = p.bestiario.find((c3) => c3.criaturaId === criaturaId);
  if (!entrada) throw new Error("Capture a criatura antes de dom\xE1-la.");
  const capacidade = capacidadeVinculo(p);
  if (capacidade <= 0) {
    throw new Error("Requer o talento V\xEDnculo Primal (Doma) para criar v\xEDnculo.");
  }
  const jaVinculadas = p.bestiario.filter((c3) => c3.nivelVinculo > 0).length;
  if (entrada.nivelVinculo === 0 && jaVinculadas >= capacidade) {
    throw new Error(
      `Capacidade de v\xEDnculo cheia (${capacidade}). Suba Matilha Domada ou solte o v\xEDnculo de outra fera.`
    );
  }
  if (entrada.nivelVinculo >= MAX_NIVEL_VINCULO) {
    throw new Error(`V\xEDnculo j\xE1 est\xE1 no m\xE1ximo (${MAX_NIVEL_VINCULO}).`);
  }
  entrada.nivelVinculo += 1;
}
function afrouxarVinculo(p, criaturaId) {
  const entrada = p.bestiario.find((c3) => c3.criaturaId === criaturaId);
  if (entrada && entrada.nivelVinculo > 0) entrada.nivelVinculo -= 1;
}

// src/registry/modificadores.ts
var m = (id, nome, descricao, exigeTags, multiplicadorCusto, efeitos, extra = {}) => ({ id, nome, descricao, exigeTags, multiplicadorCusto, efeitos, ...extra });
var MODIFICADORES = Object.fromEntries(
  [
    // ------------------- amplificação bruta -------------------
    m(
      "sobrecarga_bruta",
      "Sobrecarga Bruta",
      "Empurra a skill al\xE9m do regime seguro: muito mais poder, muito mais caro.",
      ["dano"],
      1.45,
      [{ tipo: "poder_mais", valor: 0.34 }]
    ),
    m(
      "concentracao",
      "Concentra\xE7\xE3o",
      "Aperta o efeito num ponto: mais poder por alvo, \xE1rea menor.",
      ["area"],
      1.2,
      [
        { tipo: "poder_mais", valor: 0.22 },
        { tipo: "raio_bonus", valor: -1.5 }
      ]
    ),
    m(
      "ressonancia_ampliada",
      "Resson\xE2ncia Ampliada",
      "A skill vibra com a anterior: ganha poder proporcional ao ac\xFAmulo de resson\xE2ncia.",
      ["magica"],
      1.18,
      [
        { tipo: "poder_mais", valor: 0.15 },
        { tipo: "propriedade", chave: "ressonancia_encadeada", rotulo: "Poder extra por ac\xFAmulo de resson\xE2ncia", valor: 0.2 }
      ]
    ),
    // ------------------- forma -------------------
    m(
      "projeteis_multiplos",
      "Proj\xE9teis M\xFAltiplos",
      "Divide o disparo em tr\xEAs: cobre mais, fere menos por acerto.",
      ["projetil"],
      1.35,
      [
        { tipo: "alvos_mult", valor: 2.6 },
        { tipo: "poder_aumentado", valor: 0.15 }
      ],
      { proibeTags: ["invocacao"] }
    ),
    m(
      "penetracao_encadeada",
      "Penetra\xE7\xE3o Encadeada",
      "O efeito atravessa o primeiro alvo e continua na linha.",
      ["projetil"],
      1.25,
      [
        { tipo: "alvos_mult", valor: 1.8 },
        { tipo: "propriedade", chave: "perfura_linha", rotulo: "Alvos atravessados em linha", valor: 2 }
      ]
    ),
    m(
      "expansao_concentrica",
      "Expans\xE3o Conc\xEAntrica",
      "A \xE1rea cresce em an\xE9is; o total se espalha por muito mais gente.",
      ["area"],
      1.3,
      [
        { tipo: "raio_bonus", valor: 3 },
        { tipo: "poder_aumentado", valor: 0.1 }
      ]
    ),
    m(
      "implosao_dirigida",
      "Implos\xE3o Dirigida",
      "Em vez de explodir, puxa: converte parte do dano em reposicionamento.",
      ["area"],
      1.22,
      [
        { tipo: "poder_mais", valor: 0.12 },
        { tipo: "propriedade", chave: "atracao", rotulo: "For\xE7a de atra\xE7\xE3o dos alvos", valor: 0.4 }
      ]
    ),
    // ------------------- tempo -------------------
    m(
      "gatilho_atrasado",
      "Gatilho Atrasado",
      "O efeito s\xF3 dispara depois de plantado: mais poder, sem controle de timing.",
      ["magica"],
      1.15,
      [
        { tipo: "poder_mais", valor: 0.2 },
        { tipo: "propriedade", chave: "atraso", rotulo: "Atraso at\xE9 detonar (s)", valor: 2 }
      ]
    ),
    m(
      "repeticao_ecoada",
      "Repeti\xE7\xE3o Ecoada",
      "A skill se repete uma vez, mais fraca, logo ap\xF3s a primeira.",
      ["magica"],
      1.4,
      [
        { tipo: "poder_aumentado", valor: 0.55 },
        { tipo: "tempo_fracao", valor: 0.25 },
        { tipo: "propriedade", chave: "repeticoes", rotulo: "Repeti\xE7\xF5es da conjura\xE7\xE3o", valor: 1 }
      ]
    ),
    m(
      "aceleracao_forcada",
      "Acelera\xE7\xE3o For\xE7ada",
      "Corta o tempo de conjura\xE7\xE3o pela metade \u2014 e o or\xE7amento sente.",
      [],
      1.1,
      [
        { tipo: "tempo_fracao", valor: -0.45 },
        { tipo: "propriedade", chave: "conjuracao_forcada", rotulo: "Redu\xE7\xE3o do tempo de conjura\xE7\xE3o", valor: 0.45 }
      ]
    ),
    m(
      "prolongamento",
      "Prolongamento",
      "Estica o efeito cont\xEDnuo: dura muito mais, com o mesmo total dilu\xEDdo.",
      ["continuo"],
      1.2,
      [
        { tipo: "duracao_mult", valor: 1.8 },
        { tipo: "poder_aumentado", valor: 0.12 }
      ]
    ),
    // ------------------- risco e economia -------------------
    m(
      "canalizacao_arriscada",
      "Canaliza\xE7\xE3o Arriscada",
      "Voc\xEA se abre enquanto conjura: mais poder, mais tempo parado.",
      [],
      1.28,
      [
        { tipo: "poder_mais", valor: 0.26 },
        { tipo: "tempo_fracao", valor: 0.6 },
        { tipo: "propriedade", chave: "vulnerabilidade", rotulo: "Dano recebido durante a conjura\xE7\xE3o", valor: 0.25 }
      ]
    ),
    m(
      "sangria_arcana",
      "Sangria Arcana",
      "Parte do custo sai da sua vida, e o efeito responde \xE0 altura.",
      ["magica"],
      1.05,
      [
        { tipo: "poder_mais", valor: 0.24 },
        { tipo: "propriedade", chave: "custo_vital", rotulo: "Fra\xE7\xE3o do custo paga em vida", valor: 0.35 }
      ]
    ),
    m(
      "contencao_disciplinada",
      "Conten\xE7\xE3o Disciplinada",
      "Abre m\xE3o de pot\xEAncia por economia: a \xFAnica troca negativa do sistema.",
      [],
      0.62,
      [{ tipo: "poder_mais", valor: -0.2 }]
    ),
    // ------------------- escola -------------------
    m(
      "legiao_menor",
      "Legi\xE3o Menor",
      "Divide o or\xE7amento entre mais criaturas, individualmente mais fracas.",
      ["invocacao"],
      1.3,
      [{ tipo: "invocacoes_mult", valor: 2 }],
      { requisito: { escola: "evocacao", nivelMinimo: 8 } }
    ),
    m(
      "nucleo_reforcado",
      "N\xFAcleo Refor\xE7ado",
      "Uma s\xF3 criatura, muito mais densa e duradoura.",
      ["invocacao"],
      1.34,
      [
        { tipo: "poder_mais", valor: 0.28 },
        { tipo: "duracao_mult", valor: 1.4 }
      ],
      { requisito: { escola: "evocacao", nivelMinimo: 8 } }
    ),
    m(
      "contagio_ampliado",
      "Cont\xE1gio Ampliado",
      "A maldi\xE7\xE3o salta sozinha para quem estiver perto do alvo.",
      ["efeito"],
      1.32,
      [
        { tipo: "alvos_mult", valor: 2.2 },
        { tipo: "propriedade", chave: "saltos_extra", rotulo: "Saltos adicionais da maldi\xE7\xE3o", valor: 2 }
      ],
      { requisito: { escola: "maldicao", nivelMinimo: 8 } }
    ),
    m(
      "graca_estendida",
      "Gra\xE7a Estendida",
      "A b\xEAn\xE7\xE3o alcan\xE7a todo o grupo, sem perder for\xE7a por alvo.",
      ["efeito"],
      1.38,
      [
        { tipo: "alvos_mult", valor: 2.4 },
        { tipo: "poder_aumentado", valor: 0.3 }
      ],
      { requisito: { escola: "benca", nivelMinimo: 8 } }
    ),
    m(
      "mira_absoluta",
      "Mira Absoluta",
      "Tempo gasto mirando vira dano garantido no ponto fraco.",
      ["projetil"],
      1.26,
      [
        { tipo: "poder_mais", valor: 0.3 },
        { tipo: "tempo_fracao", valor: 0.4 }
      ],
      { requisito: { escola: "longo_alcance", nivelMinimo: 8 } }
    ),
    m(
      "investida_encadeada",
      "Investida Encadeada",
      "O golpe abre uma sequ\xEAncia que se sustenta sozinha.",
      ["marcial"],
      1.24,
      [
        { tipo: "poder_mais", valor: 0.18 },
        { tipo: "propriedade", chave: "elos_sequencia", rotulo: "Elos da sequ\xEAncia marcial", valor: 3 }
      ],
      { requisito: { escola: "combate_fisico", nivelMinimo: 8 } }
    ),
    // ------------------- elemental -------------------
    m(
      "imbuicao_dupla",
      "Imbui\xE7\xE3o Dupla",
      "Carrega a skill com um segundo elemento da sua ficha, somando estados.",
      ["magica"],
      1.33,
      [
        { tipo: "poder_mais", valor: 0.16 },
        { tipo: "propriedade", chave: "segundo_elemento", rotulo: "Estados de um segundo elemento", valor: 1 }
      ]
    ),
    m(
      "fratura_elemental",
      "Fratura Elemental",
      "Racha o alvo na afinidade dele: menos poder cru, muito mais efetividade.",
      ["dano"],
      1.16,
      [
        { tipo: "poder_mais", valor: -0.08 },
        { tipo: "propriedade", chave: "quebra_resistencia", rotulo: "Resist\xEAncia elemental ignorada", valor: 0.35 }
      ]
    ),
    m(
      "convergencia_de_receita",
      "Converg\xEAncia de Receita",
      "S\xF3 em elementos combinados: cada componente da receita contribui de novo.",
      ["derivado"],
      1.42,
      [
        { tipo: "poder_mais", valor: 0.3 },
        { tipo: "propriedade", chave: "convergencia", rotulo: "Contribui\xE7\xE3o extra por componente da receita", valor: 0.08 }
      ]
    )
  ].map((d) => [d.id, d])
);
function modificadores() {
  return Object.values(MODIFICADORES);
}
var ROTULO_TAG = {
  projetil: "Proj\xE9til",
  area: "\xC1rea",
  unico: "Alvo \xFAnico",
  instantaneo: "Instant\xE2neo",
  continuo: "Cont\xEDnuo",
  invocacao: "Invoca\xE7\xE3o",
  efeito: "Efeito",
  dano: "Dano",
  marcial: "Marcial",
  magica: "M\xE1gica",
  temporal: "Temporal",
  derivado: "Elemento combinado"
};

// src/engine/skills.ts
var ENERGIA_MAX_BASE = 40;
var ENERGIA_MAX_POR_NIVEL_ESCOLA = 2;
var TEMPO_MINIMO_BASE = 0.5;
var TEMPO_MINIMO_PISO = 0.1;
var RAIO_MAXIMO_BASE = 4;
var ALCANCE_MAXIMO_BASE = 20;
var CUSTO_EXTRA_POR_METRO_ALCANCE = 5e-3;
var DENSIDADE_ALVOS_POR_M2 = 0.15;
var EFICIENCIA_AREA = 0.9;
var BONUS_POR_NIVEL_ELEMENTO = 0.04;
var FRACAO_BONUS_ARIDADE = 0.38;
var BONUS_POR_NIVEL_ESCOLA = 0.03;
var BONUS_TOTAL_DOT_MAXIMO = 0.3;
var EXPOENTE_DIVISAO_ENXAME = 0.9;
var REDUCAO_CUSTO_POR_PROFICIENCIA = 0.01;
var REDUCAO_CUSTO_MAXIMA = 0.3;
var BONUS_IMPACTO_POR_PROFICIENCIA = 8e-3;
var REDUCAO_TEMPO_POR_PROFICIENCIA = 0.01;
var BONUS_PRESSA_POR_NIVEL = 0.012;
var BONUS_PRESSA_TETO = 0.12;
var FONTE_ALEATORIA_FATOR = 0.9;
var RAREZA_TETO = 0.4;
var RAREZA_DIVISOR = 250;
var TETO_MULT_MODIFICADORES = 2.2;
var TETO_EFICIENCIA_MODIFICADORES = 1.4;
var SLOTS_MODIFICADOR_BASE = 2;
function somaEfeitos2(p, filtro) {
  let total = 0;
  for (const [id, ranks] of Object.entries(p.talentos)) {
    if (!ranks) continue;
    for (const efeito of TALENTOS[id].efeitos) total += filtro(efeito, ranks);
  }
  return total;
}
function normalizarFontes(fontes) {
  const porRecurso = /* @__PURE__ */ new Map();
  for (const f of fontes) {
    if (f.proporcao > 0) porRecurso.set(f.recurso, (porRecurso.get(f.recurso) ?? 0) + f.proporcao);
  }
  const soma = [...porRecurso.values()].reduce((a2, b) => a2 + b, 0);
  if (soma <= 0) return [];
  return [...porRecurso.entries()].map(([recurso, proporcao]) => ({
    recurso,
    proporcao: proporcao / soma
  }));
}
function proficienciaPonderada(p, fontes) {
  const norm = normalizarFontes(fontes);
  return norm.reduce((s, f) => s + f.proporcao * (p.recursos[f.recurso] ?? 0), 0);
}
function calcularLimites(p, escola, fontes = []) {
  const nivelEscola = p.escolas[escola] ?? 0;
  const bonusEnergia = somaEfeitos2(
    p,
    (e, r) => e.tipo === "energia_maxima_bonus_fracao" ? e.valorPorRank * r : 0
  );
  const reducaoTempo = somaEfeitos2(
    p,
    (e, r) => e.tipo === "tempo_conjuracao_minimo_reducao" ? e.valorPorRank * r : 0
  );
  const bonusRaio = somaEfeitos2(
    p,
    (e, r) => e.tipo === "raio_maximo_bonus" ? e.valorPorRank * r : 0
  );
  const bonusAlcance = somaEfeitos2(
    p,
    (e, r) => e.tipo === "alcance_bonus_metros" ? e.valorPorRank * r : 0
  );
  const prof = proficienciaPonderada(p, fontes);
  return {
    energiaMaxima: (ENERGIA_MAX_BASE + ENERGIA_MAX_POR_NIVEL_ESCOLA * nivelEscola) * (1 + bonusEnergia),
    tempoConjuracaoMinimo: Math.max(
      TEMPO_MINIMO_PISO,
      TEMPO_MINIMO_BASE - reducaoTempo - REDUCAO_TEMPO_POR_PROFICIENCIA * prof
    ),
    raioMaximo: RAIO_MAXIMO_BASE + bonusRaio,
    alcanceMaximo: ALCANCE_MAXIMO_BASE + bonusAlcance
  };
}
function tagsDaSkill(cfg) {
  const escola = ESCOLAS[cfg.escola];
  const tags = /* @__PURE__ */ new Set();
  tags.add(escola.tipo === "marcial" ? "marcial" : "magica");
  tags.add(cfg.entrega.tipo === "continuo" ? "continuo" : "instantaneo");
  tags.add(cfg.area.tipo === "circulo" ? "area" : "unico");
  if (escola.entregaPadrao === "invocacao") tags.add("invocacao");
  else if (escola.entregaPadrao === "efeito") tags.add("efeito");
  else tags.add("dano");
  if (escola.entregaPadrao === "dano" && cfg.alcanceMetros > 0) tags.add("projetil");
  if (baseDominanteDe(cfg.elemento) === "tempo") tags.add("temporal");
  if ((elementoDef(cfg.elemento)?.receita?.length ?? 0) > 0) tags.add("derivado");
  return [...tags];
}
function slotsModificador(p) {
  const extra = somaEfeitos2(
    p,
    (e, r) => e.tipo === "propriedade" && e.chave === "slots_modificador" ? e.valorPorRank * r : 0
  );
  return SLOTS_MODIFICADOR_BASE + Math.floor(extra);
}
function avaliarModificador(p, cfg, id, tags = tagsDaSkill(cfg)) {
  const def = MODIFICADORES[id];
  if (!def) return { id, compativel: false, motivo: "Modificador desconhecido." };
  const faltando = def.exigeTags.filter((t) => !tags.includes(t));
  if (faltando.length) {
    return {
      id,
      compativel: false,
      motivo: `Exige skill com ${faltando.map((t) => ROTULO_TAG[t]).join(" + ")}.`
    };
  }
  const proibida = (def.proibeTags ?? []).find((t) => tags.includes(t));
  if (proibida) {
    return { id, compativel: false, motivo: `Incompat\xEDvel com skills de ${ROTULO_TAG[proibida]}.` };
  }
  const req = def.requisito;
  if (req?.escola && (p.escolas[req.escola] ?? 0) < (req.nivelMinimo ?? 0)) {
    return {
      id,
      compativel: false,
      motivo: `Exige ${req.nivelMinimo} em ${ESCOLAS[req.escola].nome}.`
    };
  }
  if (req?.talento && !(p.talentos[req.talento] ?? 0)) {
    return { id, compativel: false, motivo: `Exige o talento ${TALENTOS[req.talento].nome}.` };
  }
  return { id, compativel: true };
}
function agregarModificadores(p, cfg, tags) {
  const ag = {
    multMais: 1,
    aumentado: 0,
    raioBonus: 0,
    alvosMult: 1,
    tempoFracao: 0,
    duracaoMult: 1,
    invocacoesMult: 1,
    multCusto: 1,
    tetoAtingido: false,
    aplicados: [],
    propriedades: []
  };
  const vistos = /* @__PURE__ */ new Set();
  for (const id of cfg.modificadores ?? []) {
    if (vistos.has(id)) continue;
    if (!avaliarModificador(p, cfg, id, tags).compativel) continue;
    vistos.add(id);
    const def = MODIFICADORES[id];
    ag.multCusto *= def.multiplicadorCusto;
    ag.aplicados.push({ id, nome: def.nome, multiplicadorCusto: def.multiplicadorCusto });
    for (const ef of def.efeitos) {
      switch (ef.tipo) {
        case "poder_mais":
          ag.multMais *= 1 + ef.valor;
          break;
        case "poder_aumentado":
          ag.aumentado += ef.valor;
          break;
        case "raio_bonus":
          ag.raioBonus += ef.valor;
          break;
        case "alvos_mult":
          ag.alvosMult *= ef.valor;
          break;
        case "tempo_fracao":
          ag.tempoFracao += ef.valor;
          break;
        case "duracao_mult":
          ag.duracaoMult *= ef.valor;
          break;
        case "invocacoes_mult":
          ag.invocacoesMult *= ef.valor;
          break;
        case "propriedade":
          ag.propriedades.push({ chave: ef.chave, rotulo: ef.rotulo, valor: ef.valor });
          break;
      }
    }
  }
  const bruto = ag.multMais * (1 + ag.aumentado);
  if (bruto > TETO_MULT_MODIFICADORES) {
    ag.tetoAtingido = true;
    ag.multMais = TETO_MULT_MODIFICADORES;
    ag.aumentado = 0;
  }
  return ag;
}
function validarSkill(p, prog, cfg) {
  const erros = [];
  const limites = calcularLimites(p, cfg.escola, cfg.fontes);
  if ((prog.niveisEfetivos[cfg.elemento] ?? 0) <= 0) {
    erros.push(
      `Elemento "${elementoDef(cfg.elemento)?.nome ?? cfg.elemento}" ainda n\xE3o foi liberado.`
    );
  }
  if ((p.escolas[cfg.escola] ?? 0) <= 0) {
    erros.push(`Sem pontos na escola "${ESCOLAS[cfg.escola].nome}".`);
  }
  const fontesAtivas = normalizarFontes(cfg.fontes);
  if (fontesAtivas.length === 0) {
    erros.push("A skill precisa de pelo menos uma fonte de energia com propor\xE7\xE3o maior que zero.");
  }
  for (const f of fontesAtivas) {
    if ((p.recursos[f.recurso] ?? 0) <= 0) {
      erros.push(
        `Sem profici\xEAncia em ${RECURSOS[f.recurso].nome} \u2014 invista pontos nesse recurso para us\xE1-lo como fonte.`
      );
    }
  }
  if (cfg.energia <= 0) erros.push("Energia deve ser positiva.");
  if (cfg.energia > limites.energiaMaxima) {
    erros.push(
      `Energia ${cfg.energia} acima do m\xE1ximo ${limites.energiaMaxima.toFixed(1)} (suba a escola ou o talento Canaliza\xE7\xE3o Profunda).`
    );
  }
  if (cfg.tempoConjuracaoSegundos < limites.tempoConjuracaoMinimo) {
    erros.push(
      `Tempo de conjura\xE7\xE3o m\xEDnimo \xE9 ${limites.tempoConjuracaoMinimo.toFixed(2)}s (talento Conjura\xE7\xE3o R\xE1pida e profici\xEAncia nas fontes reduzem).`
    );
  }
  if (cfg.alcanceMetros < 0) erros.push("Alcance n\xE3o pode ser negativo.");
  if (cfg.alcanceMetros > limites.alcanceMaximo) {
    erros.push(
      `Alcance ${cfg.alcanceMetros}m acima do m\xE1ximo ${limites.alcanceMaximo}m (talento Alcance Estendido aumenta).`
    );
  }
  if (cfg.area.tipo === "circulo") {
    if (cfg.area.raioMetros <= 0) erros.push("Raio deve ser positivo.");
    if (cfg.area.raioMetros > limites.raioMaximo) {
      erros.push(
        `Raio ${cfg.area.raioMetros}m acima do m\xE1ximo ${limites.raioMaximo}m (talento \xC1rea Ampliada aumenta).`
      );
    }
  }
  if (cfg.entrega.tipo === "continuo" && cfg.entrega.duracaoSegundos <= 0) {
    erros.push("Dura\xE7\xE3o do efeito cont\xEDnuo deve ser positiva.");
  }
  if (cfg.capacidadeExigida && !prog.capacidades.has(cfg.capacidadeExigida) && !prog.capacidadesDiluidas.has(cfg.capacidadeExigida)) {
    erros.push(
      `Exige a capacidade "${cfg.capacidadeExigida}" \u2014 desbloqueie o arqu\xE9tipo correspondente ou uma combina\xE7\xE3o ampla que o contenha.`
    );
  }
  if (ESCOLAS[cfg.escola].entregaPadrao === "invocacao" && cfg.evocacao?.modo === "capturada") {
    const cri = cfg.evocacao.criaturaId ? CRIATURAS[cfg.evocacao.criaturaId] : void 0;
    if (!cri) {
      erros.push("Selecione uma criatura capturada para a evoca\xE7\xE3o.");
    } else if (!p.bestiario.some((b) => b.criaturaId === cri.id)) {
      erros.push(`"${cri.nome}" n\xE3o est\xE1 no seu besti\xE1rio \u2014 capture-a antes de evoc\xE1-la.`);
    }
  }
  const modsPedidos = [...new Set(cfg.modificadores ?? [])];
  const slots = slotsModificador(p);
  if (modsPedidos.length > slots) {
    erros.push(
      `${modsPedidos.length} modificadores para ${slots} slots (o talento Engenho de Skill abre mais).`
    );
  }
  const tagsCfg = tagsDaSkill(cfg);
  for (const id of modsPedidos) {
    const av = avaliarModificador(p, cfg, id, tagsCfg);
    if (!av.compativel) {
      erros.push(`Modificador "${MODIFICADORES[id]?.nome ?? id}": ${av.motivo}`);
    }
  }
  if (cfg.montariaId) {
    const av = avaliarMontaria(p, cfg.montariaId);
    if (!av.montavel) {
      const nome = CRIATURAS[cfg.montariaId]?.nome ?? cfg.montariaId;
      erros.push(`N\xE3o \xE9 poss\xEDvel lan\xE7ar montado em "${nome}": ${av.motivo}`);
    }
  }
  return { erros, limites };
}
function calcularSkill(p, prog, cfg) {
  const { erros, limites } = validarSkill(p, prog, cfg);
  const nivelElemento = prog.niveisEfetivos[cfg.elemento] ?? 0;
  const defElemento = elementoDef(cfg.elemento);
  const aridadeElemento = aridadeDe(cfg.elemento);
  const nivelEscola = p.escolas[cfg.escola] ?? 0;
  const fatorPotencia = defElemento?.fatorPotencia ?? 1;
  const fontes = normalizarFontes(cfg.fontes);
  const prof = proficienciaPonderada(p, cfg.fontes);
  const reducaoTalento = somaEfeitos2(
    p,
    (e, r) => e.tipo === "custo_reducao_fracao" ? e.valorPorRank * r : 0
  );
  const reducaoProf = Math.min(REDUCAO_CUSTO_MAXIMA, REDUCAO_CUSTO_POR_PROFICIENCIA * prof);
  const tags = tagsDaSkill(cfg);
  const mods = agregarModificadores(p, cfg, tags);
  const custoTotal = cfg.energia * Math.max(0.5, 1 - reducaoTalento) * (1 - reducaoProf) * (1 + CUSTO_EXTRA_POR_METRO_ALCANCE * cfg.alcanceMetros) * mods.multCusto;
  const custoPorFonte = fontes.map((f) => ({
    recurso: f.recurso,
    custo: custoTotal * f.proporcao
  }));
  const tempoSemMods = Math.max(cfg.tempoConjuracaoSegundos, limites.tempoConjuracaoMinimo);
  const tempo = Math.max(
    cfg.tempoConjuracaoSegundos * (1 + mods.tempoFracao),
    limites.tempoConjuracaoMinimo
  );
  const fatorTempoMods = tempoSemMods > 0 ? Math.sqrt(tempo / tempoSemMods) : 1;
  const ganhoEficienciaMods = mods.multMais * (1 + mods.aumentado) * fatorTempoMods / (mods.multCusto || 1);
  if (mods.aplicados.length && ganhoEficienciaMods > TETO_EFICIENCIA_MODIFICADORES) {
    mods.multMais *= TETO_EFICIENCIA_MODIFICADORES / ganhoEficienciaMods;
    mods.tetoAtingido = true;
  }
  const multTempo = Math.sqrt(tempo);
  const bonusPorNivelElemento = BONUS_POR_NIVEL_ELEMENTO * (1 + FRACAO_BONUS_ARIDADE * (aridadeElemento - 1));
  const multNivel = fatorPotencia * (1 + bonusPorNivelElemento * nivelElemento) * (1 + BONUS_POR_NIVEL_ESCOLA * nivelEscola);
  const bonusFoco = somaEfeitos2(
    p,
    (e, r) => e.tipo === "foco_entrega" && e.entrega === cfg.entrega.tipo ? e.bonusFracaoPorRank * r : 0
  );
  const multFontes = fontes.length ? fontes.reduce(
    (s, f) => s + f.proporcao * (RECURSOS[f.recurso].parametros.multiplicadorPoder ?? 1),
    0
  ) : 1;
  const multProficiencia = 1 + BONUS_IMPACTO_POR_PROFICIENCIA * prof;
  const ehTemporal = baseDominanteDe(cfg.elemento) === "tempo";
  const multPressa = ehTemporal ? 1 + Math.min(BONUS_PRESSA_TETO, BONUS_PRESSA_POR_NIVEL * nivelElemento) : 1;
  const orcamento = cfg.energia * multTempo * multNivel * (1 + bonusFoco) * multFontes * multProficiencia * multPressa * mods.multMais * (1 + mods.aumentado);
  const raioEfetivo = cfg.area.tipo === "circulo" ? Math.max(0.5, cfg.area.raioMetros + mods.raioBonus) : 0;
  const alvosEsperados = (cfg.area.tipo === "unico" ? 1 : Math.max(1, 1 + DENSIDADE_ALVOS_POR_M2 * Math.PI * raioEfetivo ** 2)) * mods.alvosMult;
  const eficienciaArea = cfg.area.tipo === "unico" ? 1 : EFICIENCIA_AREA;
  let impactoTotal = orcamento * eficienciaArea;
  let impactoPorSegundo;
  if (cfg.entrega.tipo === "continuo") {
    const duracao = cfg.entrega.duracaoSegundos * mods.duracaoMult;
    const bonusDot = Math.min(BONUS_TOTAL_DOT_MAXIMO, 0.02 * duracao);
    impactoTotal *= 1 + bonusDot;
    impactoPorSegundo = impactoTotal / duracao;
  }
  const capacidadeDiluida = Boolean(
    cfg.capacidadeExigida && !prog.capacidades.has(cfg.capacidadeExigida) && prog.capacidadesDiluidas.has(cfg.capacidadeExigida)
  );
  if (capacidadeDiluida) {
    impactoTotal *= 1 - PENALIDADE_CAPACIDADE_DILUIDA;
    if (impactoPorSegundo) impactoPorSegundo *= 1 - PENALIDADE_CAPACIDADE_DILUIDA;
  }
  let montaria;
  if (cfg.montariaId && avaliarMontaria(p, cfg.montariaId).montavel) {
    const bonus = bonusMontaria(p, cfg.montariaId);
    impactoTotal *= 1 + bonus;
    if (impactoPorSegundo) impactoPorSegundo *= 1 + bonus;
    montaria = { nome: CRIATURAS[cfg.montariaId].nome, bonus };
  }
  const impactoPorAlvo = impactoTotal / alvosEsperados;
  let invocacoes;
  if (ESCOLAS[cfg.escola].entregaPadrao === "invocacao") {
    const quantidadeBonus = somaEfeitos2(
      p,
      (e, r) => e.tipo === "invocacao_quantidade_bonus" ? e.valorPorRank * r : 0
    );
    const potenciaBonus = somaEfeitos2(
      p,
      (e, r) => e.tipo === "invocacao_potencia_bonus_fracao" ? e.valorPorRank * r : 0
    );
    const quantidade = Math.max(
      1,
      Math.round((1 + Math.floor(quantidadeBonus)) * mods.invocacoesMult)
    );
    const modo = cfg.evocacao?.modo ?? "elemental";
    const nomeElemento2 = defElemento?.nome ?? cfg.elemento;
    let fatorFonte = 1;
    let nomeCriatura = `Elemental de ${nomeElemento2}`;
    let familia = "elemental";
    let imbuida = false;
    if (modo === "aleatoria") {
      fatorFonte = FONTE_ALEATORIA_FATOR;
      nomeCriatura = "Criatura Aleat\xF3ria";
      familia = "aleatoria";
    } else if (modo === "capturada" && cfg.evocacao?.criaturaId) {
      const cri = CRIATURAS[cfg.evocacao.criaturaId];
      const bond = p.bestiario.find((b) => b.criaturaId === cri?.id)?.nivelVinculo ?? 0;
      if (cri) {
        const rareza = Math.min(RAREZA_TETO, cri.poderBase / RAREZA_DIVISOR);
        fatorFonte = 1 + rareza + bonusVinculo(p, bond);
        imbuida = nivelElemento >= MAESTRIA_LIMIAR;
        nomeCriatura = imbuida ? `${cri.nome} de ${nomeElemento2}` : cri.nome;
        familia = cri.familia;
      }
    }
    const poderTotal = impactoTotal * (1 + potenciaBonus) * fatorFonte;
    const poderPorCriatura = poderTotal / quantidade ** EXPOENTE_DIVISAO_ENXAME;
    invocacoes = {
      quantidade,
      poderPorCriatura,
      poderTotal: poderPorCriatura * quantidade ** EXPOENTE_DIVISAO_ENXAME,
      nome: nomeCriatura,
      familia,
      imbuida
    };
  }
  const pesosElemento = defElemento?.pesos ?? {
    dano: 1,
    controle: 0,
    cura: 0,
    defesa: 0,
    suporte: 0
  };
  const pesosEscola = ESCOLAS[cfg.escola].pesos;
  const perfil = {};
  for (const k of ["dano", "controle", "cura", "defesa", "suporte"]) {
    perfil[k] = (pesosElemento[k] + pesosEscola[k]) / 2 * impactoTotal;
  }
  const propriedades2 = [];
  for (const [id, ranks] of Object.entries(p.talentos)) {
    if (!ranks) continue;
    for (const efeito of TALENTOS[id].efeitos) {
      if (efeito.tipo !== "propriedade") continue;
      if (efeito.escola && efeito.escola !== cfg.escola) continue;
      propriedades2.push({
        chave: efeito.chave,
        rotulo: efeito.rotulo,
        valor: efeito.valorPorRank * ranks
      });
    }
  }
  for (const f of fontes) {
    const par = RECURSOS[f.recurso].parametros;
    if (f.recurso === "soullink") {
      propriedades2.push({
        chave: "custo_em_vida",
        rotulo: `${Math.round(f.proporcao * 100)}% do custo pago com a pr\xF3pria vida (poder amplificado)`,
        valor: (par.multiplicadorPoder ?? 1) - 1
      });
    }
    if (f.recurso === "ressonancia") {
      propriedades2.push({
        chave: "ressonancia_maxima",
        rotulo: "Poder extra com resson\xE2ncia no m\xE1ximo",
        valor: (par.multiplicadorPoderMaximo ?? 1) - 1
      });
    }
  }
  if (prof > 0) {
    propriedades2.push({
      chave: "proficiencia_fontes",
      rotulo: `Profici\xEAncia ponderada ${prof.toFixed(1)}: custo \u2212${Math.round(reducaoProf * 100)}%, impacto +${Math.round((multProficiencia - 1) * 100)}%`,
      valor: prof
    });
  }
  if (capacidadeDiluida) {
    propriedades2.push({
      chave: "capacidade_diluida",
      rotulo: `Meia-identidade: "${cfg.capacidadeExigida}" vem de uma combina\xE7\xE3o ampla, n\xE3o do arqu\xE9tipo pleno \u2014 impacto \u2212${Math.round(PENALIDADE_CAPACIDADE_DILUIDA * 100)}%`,
      valor: -PENALIDADE_CAPACIDADE_DILUIDA
    });
  }
  for (const pr of mods.propriedades) propriedades2.push(pr);
  if (mods.aplicados.length) {
    propriedades2.push({
      chave: "custo_modificadores",
      rotulo: `${mods.aplicados.length} modificador(es): custo \xD7${mods.multCusto.toFixed(2)}` + (mods.tetoAtingido ? " \u2014 TETO de composi\xE7\xE3o atingido" : ""),
      valor: mods.multCusto
    });
  }
  if (ehTemporal && multPressa > 1) {
    propriedades2.push({
      chave: "pressa",
      rotulo: "Pressa (Cronomante): conjura\xE7\xE3o acelerada",
      valor: multPressa - 1
    });
  }
  const baseElem = baseDominanteDe(cfg.elemento);
  const estadoIds = /* @__PURE__ */ new Set([
    ...ESTADOS_POR_ELEMENTO[baseElem] ?? [],
    ...ESTADOS_POR_ESCOLA[cfg.escola] ?? []
  ]);
  const estados = [...estadoIds].map((id) => ({
    id,
    nome: ESTADOS[id].nome,
    tipo: ESTADOS[id].tipo
  }));
  let efet;
  if (cfg.alvoElemento) {
    const mult = efetividadeDe(cfg.elemento, cfg.alvoElemento);
    efet = {
      alvo: cfg.alvoElemento,
      multiplicador: mult,
      rotulo: rotuloEfetividade(mult),
      impacto: impactoTotal * mult
    };
  }
  return {
    valida: erros.length === 0,
    erros,
    limites,
    custoTotal,
    custoPorFonte,
    proficienciaPonderada: prof,
    orcamentoDePoder: orcamento,
    alvosEsperados,
    impactoTotal,
    impactoPorAlvo,
    impactoPorSegundo,
    invocacoes,
    montaria,
    estados,
    efetividade: efet,
    perfil,
    propriedades: propriedades2,
    eficiencia: impactoTotal / cfg.energia,
    tags,
    modificadoresAplicados: mods.aplicados,
    multModificadores: mods.multMais * (1 + mods.aumentado),
    tetoModificadoresAtingido: mods.tetoAtingido
  };
}

// src/engine/recursos.ts
var ManaEstado = class {
  recurso = "mana";
  maximo;
  atual;
  regen;
  constructor(proficiencia = 0) {
    const def = RECURSOS.mana;
    this.maximo = def.poolBase + def.poolPorProficiencia * proficiencia;
    this.atual = this.maximo;
    this.regen = def.parametros.regenBasePorSegundo + def.parametros.regenPorProficiencia * proficiencia;
  }
  custoEfetivo(custoBase) {
    return custoBase;
  }
  podePagar(custoBase) {
    return this.atual >= custoBase;
  }
  usar(custoBase) {
    if (this.atual < custoBase) return false;
    this.atual -= custoBase;
    return true;
  }
  tick(dt) {
    this.atual = Math.min(this.maximo, this.atual + this.regen * dt);
  }
};
var FeEstado = class {
  recurso = "fe";
  maximo;
  atual;
  /** Penalidade acumulada; multiplicador de custo = 1 + penalidade. */
  penalidade = 0;
  regen;
  acumuloPorEnergia;
  meiaVida;
  multiplicadorMaximo;
  constructor(proficiencia = 0) {
    const def = RECURSOS.fe;
    const par = def.parametros;
    this.maximo = def.poolBase + def.poolPorProficiencia * proficiencia;
    this.atual = this.maximo;
    this.regen = par.regenBasePorSegundo + par.regenPorProficiencia * proficiencia;
    this.acumuloPorEnergia = par.penalidadePorEnergia * Math.max(0.2, 1 - par.reducaoPenalidadePorProficiencia * proficiencia);
    this.meiaVida = par.meiaVidaPenalidadeSegundos;
    this.multiplicadorMaximo = par.multiplicadorMaximo;
  }
  get multiplicadorAtual() {
    return Math.min(this.multiplicadorMaximo, 1 + this.penalidade);
  }
  custoEfetivo(custoBase) {
    return custoBase * this.multiplicadorAtual;
  }
  podePagar(custoBase) {
    return this.atual >= this.custoEfetivo(custoBase);
  }
  usar(custoBase) {
    const custo = this.custoEfetivo(custoBase);
    if (this.atual < custo) return false;
    this.atual -= custo;
    this.penalidade += custoBase * this.acumuloPorEnergia;
    return true;
  }
  tick(dt) {
    this.atual = Math.min(this.maximo, this.atual + this.regen * dt);
    this.penalidade *= Math.pow(0.5, dt / this.meiaVida);
  }
};
var FuriaEstado = class {
  recurso = "furia";
  maximo;
  atual = 0;
  segundosDesdeUltimoCombate = Infinity;
  ganhoCausado;
  ganhoRecebido;
  decaimento;
  janelaCombate;
  constructor(proficiencia = 0) {
    const def = RECURSOS.furia;
    const par = def.parametros;
    this.maximo = def.poolBase + def.poolPorProficiencia * proficiencia;
    const escala = 1 + par.ganhoPorProficiencia * proficiencia;
    this.ganhoCausado = par.ganhoPorDanoCausado * escala;
    this.ganhoRecebido = par.ganhoPorDanoRecebido * escala;
    this.decaimento = par.decaimentoForaDeCombatePorSegundo;
    this.janelaCombate = par.segundosParaSairDeCombate;
  }
  get emCombate() {
    return this.segundosDesdeUltimoCombate < this.janelaCombate;
  }
  aoCausarDano(dano) {
    this.atual = Math.min(this.maximo, this.atual + dano * this.ganhoCausado);
    this.segundosDesdeUltimoCombate = 0;
  }
  aoReceberDano(dano) {
    this.atual = Math.min(this.maximo, this.atual + dano * this.ganhoRecebido);
    this.segundosDesdeUltimoCombate = 0;
  }
  custoEfetivo(custoBase) {
    return custoBase;
  }
  podePagar(custoBase) {
    return this.atual >= custoBase;
  }
  usar(custoBase) {
    if (this.atual < custoBase) return false;
    this.atual -= custoBase;
    return true;
  }
  tick(dt) {
    this.segundosDesdeUltimoCombate += dt;
    if (!this.emCombate) {
      this.atual = Math.max(0, this.atual - this.decaimento * dt);
    }
  }
};
var SoullinkEstado = class {
  recurso = "soullink";
  /** O pool é a própria vida do personagem. */
  maximo;
  atual;
  limiarVital;
  regen;
  constructor(proficiencia = 0) {
    const def = RECURSOS.soullink;
    const par = def.parametros;
    this.maximo = def.poolBase + def.poolPorProficiencia * proficiencia;
    this.atual = this.maximo;
    this.limiarVital = this.maximo * par.limiarVidaFracao;
    this.regen = par.regenBasePorSegundo + par.regenPorProficiencia * proficiencia;
  }
  custoEfetivo(custoBase) {
    return custoBase;
  }
  podePagar(custoBase) {
    return this.atual - custoBase >= this.limiarVital;
  }
  usar(custoBase) {
    if (this.atual - custoBase < this.limiarVital) return false;
    this.atual -= custoBase;
    return true;
  }
  tick(dt) {
    this.atual = Math.min(this.maximo, this.atual + this.regen * dt);
  }
};
var RessonanciaEstado = class {
  recurso = "ressonancia";
  maximo;
  atual;
  /** Multiplicador de poder acumulado (começa fraco em 1.0). */
  multiplicadorAtual = 1;
  segundosDesdeUltimoUso = 0;
  regen;
  acumuloPorUso;
  multiplicadorMaximo;
  janelaReset;
  constructor(proficiencia = 0) {
    const def = RECURSOS.ressonancia;
    const par = def.parametros;
    this.maximo = def.poolBase + def.poolPorProficiencia * proficiencia;
    this.atual = this.maximo;
    this.regen = par.regenBasePorSegundo + par.regenPorProficiencia * proficiencia;
    this.acumuloPorUso = par.acumuloPorUso;
    this.multiplicadorMaximo = par.multiplicadorPoderMaximo;
    this.janelaReset = par.janelaResetSegundos;
  }
  custoEfetivo(custoBase) {
    return custoBase;
  }
  podePagar(custoBase) {
    return this.atual >= custoBase;
  }
  usar(custoBase) {
    if (this.atual < custoBase) return false;
    this.atual -= custoBase;
    this.multiplicadorAtual = Math.min(
      this.multiplicadorMaximo,
      this.multiplicadorAtual + this.acumuloPorUso
    );
    this.segundosDesdeUltimoUso = 0;
    return true;
  }
  tick(dt) {
    this.atual = Math.min(this.maximo, this.atual + this.regen * dt);
    this.segundosDesdeUltimoUso += dt;
    if (this.segundosDesdeUltimoUso >= this.janelaReset) {
      this.multiplicadorAtual = 1;
    }
  }
};
function criarEstadoRecurso(recurso, proficiencia = 0) {
  switch (recurso) {
    case "mana":
      return new ManaEstado(proficiencia);
    case "fe":
      return new FeEstado(proficiencia);
    case "furia":
      return new FuriaEstado(proficiencia);
    case "soullink":
      return new SoullinkEstado(proficiencia);
    case "ressonancia":
      return new RessonanciaEstado(proficiencia);
  }
}

// src/engine/fusao.ts
var TAXA_CUSTO_GERACAO = { 2: 1.15, 3: 1.35 };
var BONUS_ENERGIA_MAXIMA_POR_COMPONENTE = 0.5;
var FATOR_SINCRONIZACAO = 1;
var CUSTO_TEMPO_POR_COMPONENTE_EXTRA = 0.35;
var TETO_EFICIENCIA_FUSAO = 1.1;
var MODOS_FUSAO = {
  sequencia: {
    id: "sequencia",
    nome: "Sequ\xEAncia",
    descricao: "Mesma escola: as skills se encadeiam numa execu\xE7\xE3o s\xF3, sem tempo morto entre elas.",
    fator: 1.06,
    taxaCusto: 1
  },
  amalgama: {
    id: "amalgama",
    nome: "Am\xE1lgama",
    descricao: "Escolas diferentes sobre elementos que n\xE3o brigam: os efeitos se dissolvem um no outro.",
    fator: 1.1,
    taxaCusto: 1.05
  },
  ressonancia: {
    id: "ressonancia",
    nome: "Resson\xE2ncia",
    descricao: "Elementos aliados: j\xE1 se alimentavam antes da fus\xE3o, ent\xE3o o encaixe \xE9 barato e limpo.",
    fator: 1.12,
    taxaCusto: 0.92
  },
  catalise: {
    id: "catalise",
    nome: "Cat\xE1lise",
    descricao: "Elementos que se negam: for\xE7ar a conviv\xEAncia libera muito mais do que qualquer um dos dois \u2014 e cobra por isso.",
    fator: 1.2,
    taxaCusto: 1.18
  },
  prisma: {
    id: "prisma",
    nome: "Prisma",
    descricao: "Tr\xEAs ou mais correntes distintas: o efeito se abre em faixas simult\xE2neas em vez de um s\xF3 golpe.",
    fator: 1.15,
    taxaCusto: 1.08
  }
};
function basesDe(elemento) {
  const def = elementoDef(elemento);
  if (!def) return [];
  if (def.tipo === "base") return [def.id];
  return (def.receita ?? []).map((c3) => c3.elemento);
}
function unirBases(componentes, niveis) {
  const todas = ordenarComponentes([
    ...new Set(componentes.flatMap((k) => basesDe(k.elemento)))
  ]);
  if (todas.length <= ARIDADE_MAXIMA) return { bases: todas, descartadas: [] };
  const porNivel = [...todas].sort(
    (a2, b) => (niveis[b] ?? 0) - (niveis[a2] ?? 0) || todas.indexOf(a2) - todas.indexOf(b)
  );
  return {
    bases: ordenarComponentes(porNivel.slice(0, ARIDADE_MAXIMA)),
    descartadas: ordenarComponentes(porNivel.slice(ARIDADE_MAXIMA))
  };
}
function determinarModo(bases, escolas) {
  const escolasDistintas = new Set(escolas).size;
  if (bases.length >= 3) return MODOS_FUSAO.prisma;
  const { coerencia } = coesaoDe(bases);
  if (coerencia === "paradoxo" || coerencia === "tensao") return MODOS_FUSAO.catalise;
  if (coerencia === "harmonia") return MODOS_FUSAO.ressonancia;
  if (escolasDistintas === 1) return MODOS_FUSAO.sequencia;
  return MODOS_FUSAO.amalgama;
}
function fundirFontes(componentes) {
  const acc = /* @__PURE__ */ new Map();
  for (const cfg of componentes) {
    for (const f of normalizarFontes(cfg.fontes)) {
      acc.set(f.recurso, (acc.get(f.recurso) ?? 0) + f.proporcao * cfg.energia);
    }
  }
  return [...acc.entries()].map(([recurso, proporcao]) => ({ recurso, proporcao }));
}
function somaEfeitosTalento(p, filtro) {
  let total = 0;
  for (const [id, ranks] of Object.entries(p.talentos)) {
    if (!ranks) continue;
    for (const efeito of TALENTOS[id].efeitos) total += filtro(efeito, ranks);
  }
  return total;
}
function descontoDeFusao(p) {
  return somaEfeitosTalento(
    p,
    (e, r) => e.tipo === "propriedade" && e.chave === "desconto_fusao" ? e.valorPorRank * r : 0
  );
}
function calcularFusao(p, prog, cfg) {
  const erros = [];
  const avisos = [];
  const comps = cfg.componentes;
  if (comps.length < 2) erros.push("Uma fus\xE3o precisa de pelo menos 2 skills componentes.");
  if (comps.length > 4) erros.push("Uma fus\xE3o comporta no m\xE1ximo 4 skills componentes.");
  const geracao = comps.length >= 3 ? 3 : 2;
  const { bases: basesEnvolvidas, descartadas } = unirBases(comps, prog.niveisEfetivos);
  if (descartadas.length) {
    avisos.push(
      `Os componentes re\xFAnem ${basesEnvolvidas.length + descartadas.length} elementos base, e a aridade m\xE1xima do sistema \xE9 ${ARIDADE_MAXIMA}. Ficaram os de maior n\xEDvel; ficaram de fora: ${descartadas.map((b) => ELEMENTOS[b].nome).join(", ")}.`
    );
  }
  if (basesEnvolvidas.length < 2) {
    avisos.push(
      "Os componentes partem do mesmo elemento base \u2014 a fus\xE3o acontece, mas n\xE3o ganha aridade."
    );
  }
  let elementoResultante;
  if (basesEnvolvidas.length === 1) {
    elementoResultante = basesEnvolvidas[0];
  } else {
    const combinado = elementoDePorComponentes(basesEnvolvidas);
    const liberado = combinado ? (prog.niveisEfetivos[combinado.id] ?? 0) > 0 : false;
    if (combinado && liberado) {
      elementoResultante = combinado.id;
    } else {
      const maisForte = [...comps].sort(
        (a2, b) => (prog.niveisEfetivos[b.elemento] ?? 0) - (prog.niveisEfetivos[a2.elemento] ?? 0)
      )[0];
      elementoResultante = maisForte?.elemento ?? basesEnvolvidas[0];
      if (combinado) {
        avisos.push(
          `A fus\xE3o dessas skills produziria "${combinado.nome}", mas essa combina\xE7\xE3o ainda n\xE3o est\xE1 desbloqueada \u2014 o resultado usa "${elementoDef(elementoResultante)?.nome}" e perde o b\xF4nus de converg\xEAncia.`
        );
      }
    }
  }
  const modo = determinarModo(
    basesEnvolvidas,
    comps.map((k) => k.escola)
  );
  const { coerencia } = coesaoDe(basesEnvolvidas);
  const escola = cfg.escolaDominante ?? comps[0]?.escola ?? "conjuracao";
  const energiaTotal = comps.reduce((s, k) => s + k.energia, 0);
  const tempoBase = Math.max(...comps.map((k) => k.tempoConjuracaoSegundos), 0);
  const tempoExtra = comps.map((k) => k.tempoConjuracaoSegundos).sort((a2, b) => b - a2).slice(1).reduce((s, t) => s + t * CUSTO_TEMPO_POR_COMPONENTE_EXTRA, 0);
  const raios = comps.map((k) => k.area.tipo === "circulo" ? k.area.raioMetros : 0).filter((r) => r > 0);
  const duracoes = comps.map((k) => k.entrega.tipo === "continuo" ? k.entrega.duracaoSegundos : 0).filter((d) => d > 0);
  const skillResultante = {
    nome: cfg.nome,
    elemento: elementoResultante,
    escola,
    fontes: fundirFontes(comps),
    energia: energiaTotal,
    tempoConjuracaoSegundos: tempoBase * FATOR_SINCRONIZACAO + tempoExtra,
    alcanceMetros: Math.max(...comps.map((k) => k.alcanceMetros), 0),
    area: raios.length ? { tipo: "circulo", raioMetros: Math.max(...raios) } : { tipo: "unico" },
    entrega: duracoes.length ? { tipo: "continuo", duracaoSegundos: Math.max(...duracoes) } : { tipo: "instantaneo" },
    evocacao: comps.find((k) => k.evocacao)?.evocacao,
    montariaId: comps.find((k) => k.montariaId)?.montariaId,
    modificadores: cfg.modificadores,
    alvoElemento: cfg.alvoElemento
  };
  const folga = 1 + BONUS_ENERGIA_MAXIMA_POR_COMPONENTE * (comps.length - 1);
  const pInflado = {
    ...p,
    talentos: { ...p.talentos }
  };
  const resultadoCru = calcularSkill(pInflado, prog, skillResultante);
  const limiteFundido = resultadoCru.limites.energiaMaxima * folga;
  const errosFiltrados = resultadoCru.erros.filter((e) => !e.startsWith("Energia "));
  if (energiaTotal > limiteFundido) {
    errosFiltrados.push(
      `Energia total ${energiaTotal.toFixed(1)} acima do m\xE1ximo de fus\xE3o ${limiteFundido.toFixed(1)} (mais escola, Canaliza\xE7\xE3o Profunda ou menos componentes).`
    );
  }
  erros.push(...errosFiltrados);
  const componentes = comps.map((k) => calcularSkill(p, prog, k));
  const impactoSeparado = componentes.reduce((s, r) => s + r.impactoTotal, 0);
  const custoSeparado = componentes.reduce((s, r) => s + r.custoTotal, 0);
  const taxaGeracao = TAXA_CUSTO_GERACAO[geracao] ?? 1.5;
  const desconto = Math.min(0.6, descontoDeFusao(p));
  const taxaCusto = 1 + (taxaGeracao * modo.taxaCusto - 1) * (1 - desconto);
  let impactoTotal = resultadoCru.impactoTotal * modo.fator;
  const custoTotal = resultadoCru.custoTotal * taxaCusto;
  let tetoGanhoAtingido = false;
  if (impactoSeparado > 0 && custoSeparado > 0 && custoTotal > 0) {
    const eficienciaSeparada = impactoSeparado / custoSeparado;
    const tetoImpacto = eficienciaSeparada * TETO_EFICIENCIA_FUSAO * custoTotal;
    if (impactoTotal > tetoImpacto) {
      impactoTotal = tetoImpacto;
      tetoGanhoAtingido = true;
    }
  }
  const escala = resultadoCru.impactoTotal > 0 ? impactoTotal / resultadoCru.impactoTotal : 1;
  const perfil = { ...resultadoCru.perfil };
  for (const k of Object.keys(perfil)) perfil[k] *= escala;
  const resultado = {
    ...resultadoCru,
    valida: erros.length === 0,
    erros,
    custoTotal,
    custoPorFonte: resultadoCru.custoPorFonte.map((f) => ({
      ...f,
      custo: f.custo * taxaCusto
    })),
    impactoTotal,
    impactoPorAlvo: resultadoCru.impactoPorAlvo * escala,
    impactoPorSegundo: resultadoCru.impactoPorSegundo ? resultadoCru.impactoPorSegundo * escala : void 0,
    invocacoes: resultadoCru.invocacoes ? {
      ...resultadoCru.invocacoes,
      poderPorCriatura: resultadoCru.invocacoes.poderPorCriatura * escala,
      poderTotal: resultadoCru.invocacoes.poderTotal * escala
    } : void 0,
    perfil,
    eficiencia: impactoTotal / energiaTotal
  };
  const propriedadesEmergentes = [
    {
      chave: "geracao",
      rotulo: `Skill de ${geracao}\xAA gera\xE7\xE3o \u2014 ${comps.length} componentes numa a\xE7\xE3o s\xF3`,
      valor: geracao
    },
    {
      chave: "modo_fusao",
      rotulo: `Modo ${modo.nome}: ${modo.descricao}`,
      valor: modo.fator - 1
    },
    {
      chave: "taxa_fusao",
      rotulo: `Taxa de fus\xE3o: custo \xD7${taxaCusto.toFixed(2)} sobre a skill sint\xE9tica`,
      valor: taxaCusto
    }
  ];
  if (basesEnvolvidas.length >= 2 && aridadeDe(elementoResultante) >= basesEnvolvidas.length) {
    propriedadesEmergentes.push({
      chave: "convergencia_elemental",
      rotulo: `Converg\xEAncia: os elementos dos componentes formaram "${elementoDef(elementoResultante)?.nome}"`,
      valor: basesEnvolvidas.length
    });
  }
  if (modo.id === "prisma") {
    propriedadesEmergentes.push({
      chave: "faixas_simultaneas",
      rotulo: `Prisma: o efeito se abre em ${basesEnvolvidas.length} faixas simult\xE2neas`,
      valor: basesEnvolvidas.length
    });
  }
  if (tetoGanhoAtingido) {
    propriedadesEmergentes.push({
      chave: "teto_fusao",
      rotulo: `TETO de fus\xE3o atingido: a efici\xEAncia foi limitada a ${TETO_EFICIENCIA_FUSAO}\xD7 a de lan\xE7ar os componentes separadamente`,
      valor: TETO_EFICIENCIA_FUSAO
    });
  }
  return {
    valida: erros.length === 0,
    erros,
    avisos,
    geracao,
    modo,
    coerencia,
    elementoResultante,
    nomeElementoResultante: elementoDef(elementoResultante)?.nome ?? elementoResultante,
    basesEnvolvidas,
    skillResultante,
    resultado,
    componentes,
    impactoSeparado,
    custoSeparado,
    ganhoDeFusao: impactoSeparado > 0 ? impactoTotal / impactoSeparado : 1,
    taxaDeCusto: custoSeparado > 0 ? custoTotal / custoSeparado : taxaCusto,
    tetoGanhoAtingido,
    propriedadesEmergentes
  };
}
function previewFusao(prog, componentes) {
  const { bases } = unirBases(componentes, prog.niveisEfetivos);
  const modo = determinarModo(
    bases,
    componentes.map((k) => k.escola)
  );
  const geracao = componentes.length >= 3 ? 3 : 2;
  if (bases.length < 2) {
    return { geracao, bases, elemento: bases[0], nome: elementoDef(bases[0])?.nome, liberado: true, modo };
  }
  const def = elementoDePorComponentes(bases);
  const liberado = def ? (prog.niveisEfetivos[def.id] ?? 0) > 0 : false;
  return { geracao, bases, elemento: def?.id, nome: def?.nome, liberado, modo };
}
function nomeEscola(escola) {
  return ESCOLAS[escola].nome;
}

// src/api/consultas.ts
var BASES2 = elementosBase().map((e) => e.id);
function ordenar(itens, chave, id) {
  return [...itens].sort((a2, b) => chave(b) - chave(a2) || id(a2).localeCompare(id(b)));
}
function panorama() {
  const ids = new Set(Object.keys(ELEMENTOS));
  for (const c3 of TODAS_COMBINACOES) ids.add(c3.id);
  return {
    elementosBase: BASES2.length,
    pares: Object.values(ELEMENTOS).filter((d) => d.receita?.length === 2).length,
    triplas: TODAS_COMBINACOES.filter((c3) => c3.aridade === 3).length,
    quadruplas: TODAS_COMBINACOES.filter((c3) => c3.aridade === 4).length,
    elementosAlcancaveis: ids.size,
    combinacoesCuradas: TODAS_COMBINACOES.filter((c3) => c3.curada).length,
    escolas: Object.keys(ESCOLAS).length,
    recursos: Object.keys(RECURSOS).length,
    talentos: Object.keys(TALENTOS).length,
    arquetipos: Object.keys(ARQUETIPOS).length,
    profissoes: Object.keys(PROFISSOES).length,
    itensBase: Object.keys(ITENS_BASE).length,
    propriedadesItem: Object.keys(PROPRIEDADES_ITEM).length,
    modificadores: Object.keys(MODIFICADORES).length,
    modosDeFusao: Object.keys(MODOS_FUSAO).length,
    criaturas: Object.keys(CRIATURAS).length
  };
}
function requisitosBase(elemento, nivel, acumulado = {}) {
  const def = elementoDef(elemento);
  if (!def) return acumulado;
  if (def.tipo === "base") {
    const id = def.id;
    acumulado[id] = Math.max(acumulado[id] ?? 0, nivel);
    return acumulado;
  }
  for (const comp of def.receita ?? []) {
    requisitosBase(comp.elemento, Math.max(nivel, comp.nivelMinimo), acumulado);
  }
  return acumulado;
}
function fichaCom(elementos, escolas = {}, recursos = {}, talentos = {}) {
  const p = criarPersonagem("planejamento");
  p.elementos = { ...elementos };
  p.escolas = { ...escolas };
  p.recursos = { ...recursos };
  p.talentos = { ...talentos };
  return p;
}
function pontosDiretosPara(alvoEfetivo, base = {}) {
  const ingenuo = { ...base };
  for (const [id, n] of Object.entries(alvoEfetivo)) {
    ingenuo[id] = Math.max(ingenuo[id] ?? 0, n);
  }
  const atende = (direto) => {
    const prog = calcularProgressao(fichaCom(direto));
    return Object.entries(alvoEfetivo).every(
      ([id, n]) => (prog.niveisEfetivos[id] ?? 0) >= n
    );
  };
  let atual = { ...ingenuo };
  for (let iter = 0; iter < 8; iter++) {
    const prog = calcularProgressao(fichaCom(atual));
    let mudou = false;
    for (const id of BASES2) {
      const alvo = alvoEfetivo[id] ?? 0;
      const minimoDaBase = base[id] ?? 0;
      const excedente = (prog.niveisEfetivos[id] ?? 0) - alvo;
      const atualId = atual[id] ?? 0;
      if (excedente > 0 && atualId > minimoDaBase) {
        const novo = Math.max(minimoDaBase, atualId - excedente);
        if (novo !== atualId) {
          atual[id] = novo;
          mudou = true;
        }
      }
    }
    if (!mudou) break;
  }
  if (!atende(atual)) atual = ingenuo;
  for (const id of BASES2) if (!atual[id]) delete atual[id];
  return atual;
}
function totalDePontos(m2) {
  return Object.values(m2).reduce((s, n) => s + (n ?? 0), 0);
}
function analisarFicha(p, limiteDerivados = 40) {
  const prog = calcularProgressao(p);
  const derivados = [];
  for (const id of prog.elementosDisponiveis) {
    const def = elementoDef(id);
    if (!def || def.tipo === "base") continue;
    derivados.push({
      id,
      nome: def.nome,
      tipo: def.tipo,
      aridade: def.receita?.length ?? 0,
      nivel: prog.niveisEfetivos[id] ?? 0,
      componentes: def.receita?.map((c3) => ELEMENTOS[c3.elemento].nome)
    });
  }
  const ordenados = ordenar(derivados, (d) => d.nivel * 100 + d.aridade, (d) => String(d.id));
  const avisos = [];
  if (!Object.keys(p.escolas).length) {
    avisos.push("Nenhuma escola investida \u2014 sem escola n\xE3o \xE9 poss\xEDvel criar skill alguma.");
  }
  if (!Object.keys(p.recursos).length) {
    avisos.push("Nenhum recurso com profici\xEAncia \u2014 toda skill precisa de ao menos uma fonte de energia.");
  }
  if (!prog.elementosDisponiveis.length) {
    avisos.push("Nenhum elemento investido \u2014 a ficha n\xE3o consegue lan\xE7ar nada.");
  }
  return {
    nome: p.nome,
    pontos: {
      // ORÇAMENTO, não soma crua: ponto direto em derivado custa mais (a UI
      // já cobrava; esta é a camada que os AGENTES consomem, e sem isso um
      // agente montava 1,76x de impacto pelo mesmo "custo" declarado).
      elementos: custoDeAlocacao(p.elementos).total,
      escolas: totalDePontos(p.escolas),
      recursos: totalDePontos(p.recursos),
      talentos: totalDePontos(p.talentos),
      profissoes: totalDePontos(p.profissoes),
      total: custoDeAlocacao(p.elementos).total + totalDePontos(p.escolas) + totalDePontos(p.recursos) + totalDePontos(p.talentos) + totalDePontos(p.profissoes)
    },
    elementosBase: BASES2.filter((id) => (prog.niveisEfetivos[id] ?? 0) > 0).map((id) => ({
      id,
      direto: p.elementos[id] ?? 0,
      transbordo: prog.transbordo[id] ?? 0,
      efetivo: prog.niveisEfetivos[id] ?? 0
    })),
    derivadosAbertos: ordenados.slice(0, limiteDerivados),
    combinacoesAbertas: prog.combinacoesLiberadas.length,
    arquetipos: prog.arquetipos.map((a2) => ({
      id: a2.id,
      nome: a2.nome,
      capacidades: a2.capacidades
    })),
    arquetiposDiluidos: prog.arquetiposDiluidos.map((a2) => ({ id: a2.id, nome: a2.nome })),
    capacidades: [...prog.capacidades].sort(),
    capacidadesDiluidas: [...prog.capacidadesDiluidas].sort(),
    talentos: Object.entries(p.talentos).filter(([, r]) => r > 0).map(([id, ranks]) => ({ id, nome: TALENTOS[id].nome, ranks, maximo: TALENTOS[id].ranksMaximos })).sort((a2, b) => a2.id.localeCompare(b.id)),
    avisos
  };
}
function proximasCombinacoes(p, opcoes = {}) {
  const { limite = 15, aridades = [2, 3, 4], apenasCuradas = false } = opcoes;
  const prog = calcularProgressao(p);
  const reducao = prog.reducaoMinimoReceita;
  const candidatos = [];
  const avaliar = (id, componentes, curada, coerencia) => {
    if ((prog.niveisEfetivos[id] ?? 0) > 0) return;
    if (!aridades.includes(componentes.length)) return;
    if (apenasCuradas && !curada) return;
    const faltam = {};
    let custo = 0;
    for (const c3 of componentes) {
      const minimo = Math.max(1, c3.nivelMinimo - reducao);
      const falta = minimo - (prog.niveisEfetivos[c3.elemento] ?? 0);
      if (falta > 0) {
        faltam[c3.elemento] = falta;
        custo += falta;
      }
    }
    if (custo === 0) return;
    const def = elementoDef(id);
    if (!def) return;
    candidatos.push({
      id,
      nome: def.nome,
      aridade: componentes.length,
      coerencia,
      curada,
      progresso: componentes.reduce(
        (s, c3) => s + Math.min(1, (prog.niveisEfetivos[c3.elemento] ?? 0) / Math.max(1, c3.nivelMinimo - reducao)),
        0
      ) / componentes.length,
      faltam,
      custoTotal: custo,
      descricao: def.descricao
    });
  };
  for (const def of Object.values(ELEMENTOS)) {
    if (!def.receita || def.receita.length > 4) continue;
    const comps = def.receita.map((c3) => c3.elemento);
    avaliar(def.id, def.receita, true, ROTULO_COERENCIA[coesaoDe(comps).coerencia]);
  }
  for (const info of TODAS_COMBINACOES) {
    if (ELEMENTOS[info.id]) continue;
    avaliar(
      info.id,
      info.componentes.map((elemento) => ({ elemento, nivelMinimo: info.nivelMinimo })),
      info.curada,
      ROTULO_COERENCIA[info.coerencia]
    );
  }
  return [...candidatos].sort(
    (a2, b) => a2.custoTotal - b.custoTotal || Number(b.curada) - Number(a2.curada) || a2.aridade - b.aridade || String(a2.id).localeCompare(String(b.id))
  ).slice(0, limite);
}
function caminhoParaArquetipo(p, arquetipoId) {
  const arq = ARQUETIPOS[arquetipoId];
  if (!arq) return void 0;
  const progAtual = calcularProgressao(p);
  const alcancado = progAtual.arquetipos.some((a2) => a2.id === arquetipoId);
  const alvoEfetivo = {};
  for (const [id, nivel] of Object.entries(arq.condicao.elementos ?? {})) {
    requisitosBase(id, nivel, alvoEfetivo);
  }
  const elementos = pontosDiretosPara(alvoEfetivo, p.elementos);
  const escolas = { ...p.escolas };
  for (const [id, n] of Object.entries(arq.condicao.escolas ?? {})) {
    escolas[id] = Math.max(escolas[id] ?? 0, n);
  }
  const recursos = { ...p.recursos };
  for (const [id, n] of Object.entries(arq.condicao.recursos ?? {})) {
    recursos[id] = Math.max(recursos[id] ?? 0, n);
  }
  const delta = (alvo, atual) => {
    const saida = {};
    for (const k of Object.keys(alvo).sort()) {
      const d = (alvo[k] ?? 0) - (atual[k] ?? 0);
      if (d > 0) saida[k] = d;
    }
    return saida;
  };
  const faltam = {
    elementos: delta(elementos, p.elementos),
    escolas: delta(escolas, p.escolas),
    recursos: delta(recursos, p.recursos)
  };
  const teste = fichaCom(elementos, escolas, recursos, p.talentos);
  const verificado = calcularProgressao(teste).arquetipos.some((a2) => a2.id === arquetipoId);
  return {
    arquetipo: { id: arq.id, nome: arq.nome, descricao: arq.descricao },
    alcancado,
    elementos,
    escolas,
    recursos,
    faltam,
    custoTotal: totalDePontos(faltam.elementos) + totalDePontos(faltam.escolas) + totalDePontos(faltam.recursos),
    capacidades: arq.capacidades,
    verificado
  };
}
function arquetiposProximos(p, limite = 10) {
  const planos = [];
  for (const id of Object.keys(ARQUETIPOS).sort()) {
    const plano = caminhoParaArquetipo(p, id);
    if (plano && !plano.alcancado && plano.verificado) planos.push(plano);
  }
  return planos.sort((a2, b) => a2.custoTotal - b.custoTotal || a2.arquetipo.id.localeCompare(b.arquetipo.id)).slice(0, limite);
}
function diagnosticarSkill(p, cfg) {
  const prog = calcularProgressao(p);
  const { erros, limites } = validarSkill(p, prog, cfg);
  const base = {
    valida: erros.length === 0,
    erros,
    tags: tagsDaSkill(cfg).map((t) => ROTULO_TAG[t]),
    limites: {
      energiaMaxima: limites.energiaMaxima,
      tempoConjuracaoMinimo: limites.tempoConjuracaoMinimo,
      raioMaximo: limites.raioMaximo,
      alcanceMaximo: limites.alcanceMaximo
    },
    slotsModificador: slotsModificador(p)
  };
  if (erros.length) return base;
  const r = calcularSkill(p, prog, cfg);
  return {
    ...base,
    resultado: {
      custoTotal: r.custoTotal,
      impactoTotal: r.impactoTotal,
      impactoPorAlvo: r.impactoPorAlvo,
      alvosEsperados: r.alvosEsperados,
      eficiencia: r.eficiencia,
      perfil: { ...r.perfil },
      estados: r.estados.map((e) => e.nome),
      propriedades: r.propriedades
    }
  };
}
function modificadoresPara(p, cfg) {
  const tags = tagsDaSkill(cfg);
  return Object.keys(MODIFICADORES).sort().map((id) => {
    const def = MODIFICADORES[id];
    const av = avaliarModificador(p, cfg, id, tags);
    return {
      id: def.id,
      nome: def.nome,
      descricao: def.descricao,
      multiplicadorCusto: def.multiplicadorCusto,
      compativel: av.compativel,
      motivo: av.motivo,
      exigeTags: def.exigeTags.map((t) => ROTULO_TAG[t])
    };
  }).sort((a2, b) => Number(b.compativel) - Number(a2.compativel) || a2.id.localeCompare(b.id));
}
function previaDeFusao(p, componentes) {
  const prog = calcularProgressao(p);
  const pv = previewFusao(prog, componentes);
  return {
    geracao: pv.geracao,
    modo: pv.modo.nome,
    descricaoModo: pv.modo.descricao,
    basesEnvolvidas: pv.bases.map((b) => ELEMENTOS[b].nome),
    elementoResultante: pv.elemento ? String(pv.elemento) : void 0,
    nomeElementoResultante: pv.nome,
    liberado: pv.liberado
  };
}
function diagnosticarFusao(p, cfg) {
  const prog = calcularProgressao(p);
  const r = calcularFusao(p, prog, cfg);
  return {
    geracao: r.geracao,
    modo: r.modo.nome,
    descricaoModo: r.modo.descricao,
    basesEnvolvidas: r.basesEnvolvidas.map((b) => ELEMENTOS[b].nome),
    elementoResultante: String(r.elementoResultante),
    nomeElementoResultante: r.nomeElementoResultante,
    liberado: true,
    valida: r.valida,
    erros: r.erros,
    avisos: r.avisos,
    custoTotal: r.resultado.custoTotal,
    impactoTotal: r.resultado.impactoTotal,
    impactoSeparado: r.impactoSeparado,
    custoSeparado: r.custoSeparado,
    ganhoDeFusao: r.ganhoDeFusao,
    taxaDeCusto: r.taxaDeCusto,
    eficienciaRelativa: r.taxaDeCusto > 0 ? r.ganhoDeFusao / r.taxaDeCusto : 1,
    tetoAtingido: r.tetoGanhoAtingido,
    propriedadesEmergentes: r.propriedadesEmergentes
  };
}
var semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function buscar(termo, limite = 20) {
  const alvo = semAcento(termo.trim());
  if (!alvo) return [];
  const achados = [];
  const push = (tipo, id, nome, descricao) => {
    if (semAcento(nome).includes(alvo) || semAcento(id).includes(alvo)) {
      achados.push({ tipo, id, nome, descricao });
    }
  };
  for (const d of Object.values(ELEMENTOS)) push("elemento", d.id, d.nome, d.descricao);
  for (const d of Object.values(ESCOLAS)) push("escola", d.id, d.nome, d.descricao);
  for (const d of Object.values(RECURSOS)) push("recurso", d.id, d.nome, d.descricao ?? "");
  for (const d of Object.values(TALENTOS)) push("talento", d.id, d.nome, d.descricao);
  for (const d of Object.values(ARQUETIPOS)) push("arquetipo", d.id, d.nome, d.descricao);
  for (const d of Object.values(PROFISSOES)) push("profissao", d.id, d.nome, d.descricao);
  for (const d of Object.values(MODIFICADORES)) push("modificador", d.id, d.nome, d.descricao);
  for (const d of Object.values(ITENS_BASE)) push("item", d.id, d.nome, d.descricao);
  for (const d of Object.values(PROPRIEDADES_ITEM)) push("propriedade", d.id, d.nome, d.descricao);
  for (const d of Object.values(CRIATURAS)) push("criatura", d.id, d.nome, d.descricao ?? "");
  if (achados.length < limite) {
    for (const info of buscarCombinacoes(termo, limite)) {
      const def = elementoDef(info.id);
      if (def && !achados.some((a2) => a2.id === String(info.id))) {
        achados.push({
          tipo: "combinacao",
          id: String(info.id),
          nome: def.nome,
          descricao: def.descricao
        });
      }
    }
  }
  return achados.sort((a2, b) => a2.nome.length - b.nome.length || a2.id.localeCompare(b.id)).slice(0, limite);
}
function explicarElemento(id, limiteUsos = 12) {
  const def = elementoDef(id);
  if (!def) return void 0;
  const info = combinacaoInfo(def.id);
  const usadoEm = [];
  const alvo = new Set(
    def.tipo === "base" ? [def.id] : (def.receita ?? []).map((r) => r.elemento)
  );
  for (const c3 of TODAS_COMBINACOES) {
    if (usadoEm.length >= limiteUsos) break;
    if (c3.id === def.id) continue;
    const conjunto = new Set(c3.componentes);
    if ([...alvo].every((x) => conjunto.has(x))) {
      const d = elementoDef(c3.id);
      if (d) usadoEm.push({ id: String(c3.id), nome: d.nome, aridade: c3.aridade });
    }
  }
  return {
    id: def.id,
    nome: def.nome,
    tipo: def.tipo,
    aridade: def.receita?.length ?? 1,
    descricao: def.descricao,
    fatorPotencia: def.fatorPotencia,
    perfil: { ...def.pesos },
    receita: def.receita?.map((c3) => ({
      elemento: c3.elemento,
      nome: ELEMENTOS[c3.elemento].nome,
      nivelMinimo: c3.nivelMinimo
    })),
    coerencia: def.receita ? ROTULO_COERENCIA[coesaoDe(def.receita.map((c3) => c3.elemento)).coerencia] : void 0,
    curada: info ? info.curada : def.tipo !== "base" ? true : void 0,
    usadoEm,
    requisitosBase: requisitosBase(def.id, def.receita?.[0]?.nivelMinimo ?? 1)
  };
}
function verificarIntegridade() {
  const problemas = [];
  const existe = (id) => Boolean(elementoDef(id));
  for (const arq of Object.values(ARQUETIPOS)) {
    for (const id of Object.keys(arq.condicao.elementos ?? {})) {
      if (!existe(id)) {
        problemas.push({
          severidade: "erro",
          tipo: "elemento_inexistente",
          onde: `arquetipos.${arq.id}`,
          mensagem: `Exige o elemento "${id}", que n\xE3o existe no registro.`
        });
      }
    }
    for (const id of Object.keys(arq.condicao.escolas ?? {})) {
      if (!ESCOLAS[id]) {
        problemas.push({
          severidade: "erro",
          tipo: "escola_inexistente",
          onde: `arquetipos.${arq.id}`,
          mensagem: `Exige a escola "${id}", que n\xE3o existe.`
        });
      }
    }
    for (const id of Object.keys(arq.condicao.recursos ?? {})) {
      if (!RECURSOS[id]) {
        problemas.push({
          severidade: "erro",
          tipo: "recurso_inexistente",
          onde: `arquetipos.${arq.id}`,
          mensagem: `Exige o recurso "${id}", que n\xE3o existe.`
        });
      }
    }
    const plano = caminhoParaArquetipo(criarPersonagem("teste"), arq.id);
    if (plano && !plano.verificado) {
      problemas.push({
        severidade: "erro",
        tipo: "arquetipo_inalcancavel",
        onde: `arquetipos.${arq.id}`,
        mensagem: "Nenhuma distribui\xE7\xE3o de pontos derivada da condi\xE7\xE3o destrava este arqu\xE9tipo \u2014 a condi\xE7\xE3o \xE9 imposs\xEDvel ou depende de algo que a progress\xE3o n\xE3o produz."
      });
    }
  }
  for (const prop2 of Object.values(PROPRIEDADES_ITEM)) {
    for (const id of [...prop2.requerTodos ?? [], ...prop2.requerAlgum ?? []]) {
      if (!existe(String(id))) {
        problemas.push({
          severidade: "erro",
          tipo: "elemento_inexistente",
          onde: `propriedades_item.${prop2.id}`,
          mensagem: `Exige o elemento "${id}", que n\xE3o existe no registro.`
        });
      }
    }
    if (prop2.requerTalento && !TALENTOS[prop2.requerTalento]) {
      problemas.push({
        severidade: "erro",
        tipo: "talento_inexistente",
        onde: `propriedades_item.${prop2.id}`,
        mensagem: `Exige o talento "${prop2.requerTalento}", que n\xE3o existe.`
      });
    }
  }
  for (const prof of Object.values(PROFISSOES)) {
    for (const id of Object.keys(prof.fatoresElementos)) {
      if (!existe(id)) {
        problemas.push({
          severidade: "erro",
          tipo: "elemento_inexistente",
          onde: `profissoes.${prof.id}`,
          mensagem: `Escala com o elemento "${id}", que n\xE3o existe.`
        });
      }
    }
    if (!Object.values(ITENS_BASE).some((i) => i.profissao === prof.id)) {
      problemas.push({
        severidade: "aviso",
        tipo: "profissao_sem_itens",
        onde: `profissoes.${prof.id}`,
        mensagem: "Nenhum item-base pertence a esta profiss\xE3o \u2014 ela n\xE3o produz nada."
      });
    }
  }
  for (const tal of Object.values(TALENTOS)) {
    for (const rival of tal.exclusivoCom ?? []) {
      if (!TALENTOS[rival]) {
        problemas.push({
          severidade: "erro",
          tipo: "talento_inexistente",
          onde: `talentos.${tal.id}`,
          mensagem: `\xC9 exclusivo com "${rival}", que n\xE3o existe.`
        });
      } else if (!(TALENTOS[rival].exclusivoCom ?? []).includes(tal.id)) {
        problemas.push({
          severidade: "aviso",
          tipo: "exclusividade_assimetrica",
          onde: `talentos.${tal.id}`,
          mensagem: `Declara exclusividade com "${rival}", mas "${rival}" n\xE3o retribui.`
        });
      }
    }
    if (tal.requisito?.escola && !ESCOLAS[tal.requisito.escola]) {
      problemas.push({
        severidade: "erro",
        tipo: "escola_inexistente",
        onde: `talentos.${tal.id}`,
        mensagem: `Exige a escola "${tal.requisito.escola}", que n\xE3o existe.`
      });
    }
  }
  for (const mod of Object.values(MODIFICADORES)) {
    if (mod.requisito?.escola && !ESCOLAS[mod.requisito.escola]) {
      problemas.push({
        severidade: "erro",
        tipo: "escola_inexistente",
        onde: `modificadores.${mod.id}`,
        mensagem: `Exige a escola "${mod.requisito.escola}", que n\xE3o existe.`
      });
    }
    if (mod.requisito?.talento && !TALENTOS[mod.requisito.talento]) {
      problemas.push({
        severidade: "erro",
        tipo: "talento_inexistente",
        onde: `modificadores.${mod.id}`,
        mensagem: `Exige o talento "${mod.requisito.talento}", que n\xE3o existe.`
      });
    }
    const impossivel = (mod.proibeTags ?? []).some((t) => mod.exigeTags.includes(t));
    if (impossivel) {
      problemas.push({
        severidade: "erro",
        tipo: "modificador_impossivel",
        onde: `modificadores.${mod.id}`,
        mensagem: "Exige e pro\xEDbe a mesma tag \u2014 nenhuma skill jamais o aceita."
      });
    }
  }
  return problemas.sort(
    (a2, b) => (a2.severidade === b.severidade ? 0 : a2.severidade === "erro" ? -1 : 1) || a2.onde.localeCompare(b.onde)
  );
}
function paginar(todos, limite, offset) {
  const itens = todos.slice(offset, offset + limite);
  return { itens, total: todos.length, restantes: Math.max(0, todos.length - offset - itens.length) };
}
function listarArquetipos(limite = 25, offset = 0) {
  const todos = Object.values(ARQUETIPOS).sort((a2, b) => a2.id.localeCompare(b.id)).map((d) => ({ tipo: "arquetipo", id: d.id, nome: d.nome, descricao: d.descricao }));
  return paginar(todos, limite, offset);
}
function listarTalentos(limite = 25, offset = 0) {
  const todos = Object.values(TALENTOS).sort((a2, b) => a2.id.localeCompare(b.id)).map((d) => ({ tipo: "talento", id: d.id, nome: d.nome, descricao: d.descricao }));
  return paginar(todos, limite, offset);
}
function listarModificadores(limite = 25, offset = 0) {
  const todos = Object.values(MODIFICADORES).sort((a2, b) => a2.id.localeCompare(b.id)).map((d) => ({ tipo: "modificador", id: d.id, nome: d.nome, descricao: d.descricao }));
  return paginar(todos, limite, offset);
}
function listarCombinacoes(opcoes = {}) {
  const { aridade, apenasCuradas = false, limite = 25, offset = 0 } = opcoes;
  const filtradas = TODAS_COMBINACOES.filter(
    (c3) => (aridade === void 0 || c3.aridade === aridade) && (!apenasCuradas || c3.curada)
  ).sort((a2, b) => String(a2.id).localeCompare(String(b.id)));
  const todos = filtradas.map((c3) => {
    const def = elementoDef(c3.id);
    return {
      tipo: "combinacao",
      id: String(c3.id),
      nome: def.nome,
      descricao: def.descricao,
      aridade: c3.aridade,
      coerencia: ROTULO_COERENCIA[c3.coerencia],
      curada: c3.curada
    };
  });
  return paginar(todos, limite, offset);
}
export {
  AFINIDADES,
  ARIDADE_MAXIMA,
  ARQUETIPOS,
  CRIATURAS,
  CURADAS,
  CUSTO_CASCATA_EQUIVALENTE,
  CUSTO_PONTO_ALOCACAO,
  DESCRICAO_COERENCIA,
  DIVISOR_CASCATA,
  DIVISOR_CASCATA_ESPECIAL,
  ELEMENTOS,
  ELEMENTOS_PRIMAIS,
  ESCOLAS,
  ESTADOS,
  ESTADOS_POR_ELEMENTO,
  ESTADOS_POR_ESCOLA,
  FAMILIAS,
  FAMILIAS_MONTAVEIS,
  FATOR_BASE_ARIDADE,
  FeEstado,
  FuriaEstado,
  ITENS_BASE,
  LEXICO,
  LIMIAR_DESTRAVAMENTO,
  MAESTRIA_LIMIAR,
  MATERIAIS_CRIATURA,
  MAX_NIVEL_VINCULO,
  MINIMO_BASE_ARIDADE,
  MODIFICADORES,
  MODOS_FUSAO,
  MULT_FORTE,
  MULT_FRACO,
  MULT_NEUTRO,
  ManaEstado,
  ORCAMENTO_POR_TIER,
  PENALIDADE_CAPACIDADE_DILUIDA,
  PROFISSOES,
  PROPRIEDADES_ITEM,
  QUADRUPLAS,
  RECURSOS,
  ROTULO_COERENCIA,
  ROTULO_TAG,
  RessonanciaEstado,
  SINERGIAS,
  SLOTS_MODIFICADOR_BASE,
  SoullinkEstado,
  TALENTOS,
  TETO_EFICIENCIA_MODIFICADORES,
  TETO_MULT_MODIFICADORES,
  TIERS,
  TODAS_COMBINACOES,
  TRIPLAS,
  afinidadesAtivas,
  afrouxarVinculo,
  analisarFicha,
  aridadeDe,
  arquetiposProximos,
  avaliarCaptura,
  avaliarModificador,
  avaliarMontaria,
  baseDominante,
  baseDominanteDe,
  baseDominanteDoDef,
  bonusMontaria,
  bonusSinergiaCombate,
  bonusVinculo,
  buscar,
  buscarCombinacoes,
  calcularCascata,
  calcularFusao,
  calcularLimites,
  calcularProgressao,
  calcularSkill,
  caminhoParaArquetipo,
  capacidadeVinculo,
  capturarCriatura,
  chaveCombinacao,
  coesaoDe,
  combinacaoInfo,
  combinacaoInfoPorComponentes,
  combinacoesRelevantes,
  craftar,
  criarEstadoRecurso,
  criarPersonagem,
  criaturas,
  custoDeAlocacao,
  descontoDeFusao,
  descricaoProcedural,
  desinvestirElemento,
  diagnosticarFusao,
  diagnosticarSkill,
  domarCriatura,
  efetividade,
  efetividadeDe,
  elementoDePorComponentes,
  elementoDef,
  elementosAlocaveis,
  elementosBase,
  elementosDeMaestria,
  elementosDerivados,
  elementosDominados,
  evocar,
  explicarElemento,
  familiasCapturaveis,
  fatorDeCombinacao,
  generoDoNome,
  investirElemento,
  investirEscola,
  investirProfissao,
  investirRecurso,
  investirTalento,
  itensDaProfissao,
  listarArquetipos,
  listarCombinacoes,
  listarModificadores,
  listarTalentos,
  minimoDeCombinacao,
  modificadores,
  modificadoresPara,
  nomeElemento,
  nomeEscola,
  nomeProcedural,
  normalizarFontes,
  ordenarComponentes,
  paisDeCascata,
  panorama,
  perfilDeCombinacao,
  pesoDiretoNaCascata,
  podeInvestir,
  podeReceberDireto,
  poderCaptura,
  pontosDiretosPara,
  previaDeFusao,
  previewFusao,
  proficienciaPonderada,
  progressoCombinacao,
  propriedades,
  proximasCombinacoes,
  requisitosBase,
  rotuloEfetividade,
  slotsModificador,
  soltarCriatura,
  tagsDaSkill,
  tierDe,
  totalDePontos,
  validarSkill,
  verificarIntegridade
};
