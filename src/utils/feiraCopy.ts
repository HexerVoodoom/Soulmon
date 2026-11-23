/**
 * COPY DA FEIRA DO CHEFE (`docs/PLANO-FEIRA-CHEFE.md`): EN primeiro, PT depois, no padrão `[en, pt]` de `guildCopy.ts`.
 *
 * Tom: caloroso, sem cobrança, sem culpa. O chefe "foge por ora" e "o caminho abriu"; ninguém "falhou". Nada por
 * pessoa: só o clã inteiro e o que é da própria pessoa. Superfície MUDA (nenhum som novo).
 * `{x}` entra por `feiraText`; números nunca são frase de cobrança (são o nome do chefe, o nível, a recompensa).
 */
import type { Language } from './i18n';

const COPY = {
  'sheet.close': ['Close', 'Fechar'],
  'sheet.later': ['Later', 'Depois'],
  'sheet.retry': ['Try again', 'Tentar de novo'],
  'sheet.room': ['Merchant path', 'Caminho do Mercador'],

  'boss.title': ['A mystery on the path', 'Um mistério no caminho'],
  'boss.line': ['{name} showed up while your Soulmon was out.', '{name} apareceu enquanto o seu Soulmon estava fora.'],
  'npc.boss': ['Something showed up on the path while your Soulmon was out.', 'Algo apareceu no caminho enquanto o seu Soulmon estava fora.'],
  'npc.trail': ['A small challenge is waiting on the path today.', 'Um desafio pequeno espera no caminho hoje.'],
  'npc.rest': ['The path is calm today.', 'O caminho está calmo hoje.'],
  'boss.level': ['Level {level}', 'Nível {level}'],
  'boss.pool': ['Boss strength', 'Força do chefe'],
  'boss.attack': ['Attack', 'Atacar'],
  'boss.busy': ['Going…', 'Indo…'],
  'boss.shared': ['The whole clan wears it down together. It never heals.', 'O clã inteiro vai desgastando junto. Ele nunca se recupera.'],
  'boss.sameDay': ['Win today: by tomorrow it escapes.', 'Vença hoje: amanhã ele escapa.'],
  'boss.today': ['Your turn today is done. It comes back tomorrow.', 'A sua vez de hoje já foi. Ela volta amanhã.'],
  'boss.gone': ['The way is open. Nothing to fight right now.', 'O caminho está aberto. Nada para enfrentar agora.'],
  'boss.offline': ['No connection right now. Nothing was spent, try again in a moment.', 'Sem conexão agora. Nada foi gasto, tente de novo daqui a pouco.'],
  'boss.error': ['Something got stuck. Nothing was spent, try again in a moment.', 'Algo travou. Nada foi gasto, tente de novo daqui a pouco.'],

  'rest.title': ['A quiet day', 'Um dia calmo'],
  'rest.line': ['The path is quiet today. A new mystery turns up soon.', 'O caminho está tranquilo hoje. Um novo mistério aparece em breve.'],
  'rest.claimable': ['The way opened. Your thanks are ready to collect.', 'O caminho abriu. O agradecimento está pronto para colher.'],
  'rest.claim': ['Collect', 'Colher'],
  'rest.claimed': ['Collected. Thank you for walking the path.', 'Colhido. Obrigado por andar pelo caminho.'],
  'rest.nothing': ['Nothing to collect right now.', 'Nada para colher agora.'],
  'rest.sap': ['House sap', 'Seiva da Casa'],
  'rest.emblems': ['Emblems', 'Emblemas'],
  'rest.bits': ['Bits', 'Bits'],

  'trail.title': ['Today’s challenge', 'Desafio de hoje'],
  'trail.line': ['A small challenge for the House garden. Take your time, nothing is lost if you stop.', 'Um desafio pequeno para o jardim da Casa. Sem pressa, nada se perde se você parar.'],
  'trail.gate': ['It also opens the way for your next outing.', 'Ele também abre o caminho da sua próxima saída.'],
  'trail.marks': ['Marks on the trail', 'Marcas na trilha'],
  'trail.start': ['Start', 'Começar'],
  'trail.send': ['Send', 'Enviar'],
  'trail.sending': ['Checking…', 'Conferindo…'],
  'trail.reset': ['Start over', 'Recomeçar'],
  'trail.wrong': ['Not quite. Have another look and try again.', 'Quase. Olhe de novo e tente outra vez.'],
  'trail.slow': ['That went by fast. Give it a little more time and send again.', 'Passou rápido demais. Dê um pouco mais de tempo e envie de novo.'],
  'trail.limit': ['That is enough for today. The challenge is waiting tomorrow.', 'Chega por hoje. O desafio espera por você amanhã.'],
  'trail.already': ['Already done today. Nice work.', 'Já feito hoje. Bom trabalho.'],
  'trail.done': ['Challenge done', 'Desafio cumprido'],
  'trail.doneLine': ['The House garden thanks you.', 'O jardim da Casa agradece.'],
  'trail.gameName': ['Merchant challenge', 'Desafio do Mercador'],
  'trail.clanBits': ['Bits for the clan treasury', 'Bits para o tesouro do clã'],
  'achado.toast': ['Your Soulmon found {n} Bits on the way back.', 'Seu Soulmon achou {n} Bits no caminho de volta.'],
  'trail.keepGoing': ['Continue', 'Continuar'],

  'game.zip': ['Join the numbers in order, filling every square.', 'Ligue os números em ordem, preenchendo todas as casas.'],
  'game.patches': ['Tap two corners to draw a block. Each block holds one clue and matches its size.', 'Toque em dois cantos para desenhar um bloco. Cada um guarda uma pista e tem aquele tamanho.'],
  'game.selo': ['Find the rule in the grid and pick the seal that fits the empty spot.', 'Ache a regra na grade e escolha o selo que cabe no espaço vazio.'],
  'game.picross': ['Fill squares to match the numbers on each row and column.', 'Pinte as casas para bater com os números de cada linha e coluna.'],
  'game.troca': ['Sort each card to the side the current rule says.', 'Mande cada carta para o lado que a regra do momento pede.'],
  'game.eco': ['Watch the stones light up, then repeat the order.', 'Veja as pedras acenderem e repita a ordem.'],
  'game.troca.forma': ['Rule: young on the left, grown on the right', 'Regra: jovem à esquerda, crescido à direita'],
  'game.troca.lugar': ['Rule: sky on the left, cave on the right', 'Regra: céu à esquerda, caverna à direita'],
  'game.troca.young': ['young', 'jovem'],
  'game.troca.grown': ['grown', 'crescido'],
  'game.troca.sky': ['sky', 'céu'],
  'game.troca.cave': ['cave', 'caverna'],
  'game.left': ['Left', 'Esquerda'],
  'game.right': ['Right', 'Direita'],
  'game.eco.watch': ['Watch…', 'Olhe…'],
  'game.eco.repeat': ['Your turn', 'Sua vez'],
  'game.eco.retry': ['Slipped. Watch again.', 'Escapou. Olhe de novo.'],
  'game.eco.stone.0': ['Circle', 'Círculo'],
  'game.eco.stone.1': ['Triangle', 'Triângulo'],
  'game.eco.stone.2': ['Square', 'Quadrado'],
  'game.eco.stone.3': ['Diamond', 'Losango'],

  'room.boss': ['{name}, level {level}', '{name}, nível {level}'],
  'room.trail': ['A challenge is on the path', 'Há um desafio no caminho'],
  'room.rest': ['The path is quiet', 'O caminho está tranquilo'],
  'room.open': ['Open', 'Abrir'],
  'room.challenge': ['Take the challenge', 'Aceitar o desafio'],
  'room.boss.go': ['Face the boss', 'Enfrentar o chefe'],

  // A FALA DO MERCADOR DEPOIS DO DESAFIO (dono, 16/11/2026): o que o jogador achou hoje, o que o clã achou (SÓ o agregado da sala,
  // nunca por pessoa) e o convite a investigar de novo amanhã. Nada de cobrança: o dia está fechado, o resto é convite.
  'npc.hoje.boss': ['Today your Soulmon brought {name} back from the path, and you faced it.', 'Hoje o seu Soulmon trouxe {name} do caminho, e você o enfrentou.'],
  'npc.hoje.trail': ['Today your Soulmon found a challenge on the path, and you took it on.', 'Hoje o seu Soulmon achou um desafio no caminho, e você o cumpriu.'],
  'npc.hoje.rest': ['Today the path was quiet, and your Soulmon came back without a scare.', 'Hoje o caminho estava tranquilo, e o seu Soulmon voltou sem susto.'],
  'npc.hoje.loja': ['Today your Soulmon met a merchant on the path.', 'Hoje o seu Soulmon encontrou um mercador no caminho.'],
  'npc.hoje.achado': ['Today your Soulmon picked up a few Bits along the path.', 'Hoje o seu Soulmon recolheu uns Bits pelo caminho.'],
  'npc.hoje.nada': ['Today your Soulmon found nothing new on the path.', 'Hoje o seu Soulmon não achou nada de novo no caminho.'],
  'npc.hoje.geral': ['Today your Soulmon came back from investigating.', 'Hoje o seu Soulmon voltou da investigação.'],
  'npc.cla.boss': ['Your clan walked that path too: {name} still stands at {pct}%.', 'O seu clã também passou por esse caminho: {name} ainda está de pé, com {pct}%.'],
  'npc.cla.boss.caiu': ['Your clan walked that path too: {name} has fallen.', 'O seu clã também passou por esse caminho: {name} já caiu.'],
  'npc.cla.trail': ['Your clan walked that path too and left {n} marks on the challenge.', 'O seu clã também passou por esse caminho e deixou {n} marcas no desafio.'],
  'npc.cla.trail.zero': ['Your clan walked that path too: the challenge is still waiting for its first mark.', 'O seu clã também passou por esse caminho: o desafio ainda espera pela primeira marca.'],
  'npc.cla.rest': ['Your clan walked that path too: it was quiet for everyone.', 'O seu clã também passou por esse caminho: estava tranquilo para todos.'],
  'npc.cla.geral': ['Your clan walked that path too, and what it found went into the circle.', 'O seu clã também passou por esse caminho, e o que achou foi para a roda.'],
  'npc.amanha': ['Tomorrow, from {hora}, the path will have more. Send your Soulmon to investigate again.', 'Amanhã, a partir das {hora}, o caminho terá mais. Mande o seu Soulmon investigar de novo.'],

  // A FEIRA DE VERDADE (10/11/2026): rara, calma, sem urgência ("só hoje" é vetado); só Bits, sem ingredientes.
  'loja.title': ['A merchant on the way', 'Um mercador no caminho'],
  'loja.line': ['Your Soulmon met a merchant while it was out.', 'O seu Soulmon encontrou um mercador enquanto estava fora.'],
  'loja.prices': ['Everything here is a bit cheaper. Bits only.', 'Tudo aqui está um pouco mais barato. Só Bits.'],
  'loja.keep': ['The stalls pack up when the day ends.', 'As barracas se recolhem quando o dia termina.'],
  'loja.hex': ['From the Hexsmith', 'Da Hexsmith'],
  'loja.hexNote': ['No ingredients needed here, just Bits.', 'Sem ingredientes aqui, só Bits.'],
  'loja.buy': ['Buy', 'Comprar'],
  'loja.bought': ['Yours', 'Seu'],
  'loja.off': ['{pct}% off', '{pct}% a menos'],
  'loja.ok': ['{name} bought.', '{name} comprado.'],
  'loja.noFunds': ['Not enough Bits for this one. Nothing was spent.', 'Bits insuficientes para este. Nada foi gasto.'],
  'loja.offline': ['No connection right now. Nothing was spent, try again in a moment.', 'Sem conexão agora. Nada foi gasto, tente de novo daqui a pouco.'],
  'loja.gone': ['The stalls have packed up. Nothing was spent.', 'As barracas já se recolheram. Nada foi gasto.'],
  'loja.cap': ['Your stock of this one is full. Nothing was spent.', 'Seu estoque deste já está cheio. Nada foi gasto.'],
  'loja.taken': ['That one is already yours. Nothing was spent.', 'Esse já é seu. Nada foi gasto.'],
  'loja.error': ['Something got stuck. Nothing was spent, try again in a moment.', 'Algo travou. Nada foi gasto, tente de novo daqui a pouco.'],
  'loja.allYours': ['Everything here is yours now. Thank you for walking the path.', 'Tudo daqui já é seu. Obrigado por andar pelo caminho.'],
} as const;

export type FeiraKey = keyof typeof COPY;

export function feiraText(language: Language, key: FeiraKey, vars?: Record<string, string | number>): string {
  const [en, pt] = COPY[key];
  const raw = language === 'pt-BR' ? pt : en;
  return vars ? raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : raw;
}

/** Só para teste: a tabela inteira. */
export const FEIRA_COPY = COPY;
