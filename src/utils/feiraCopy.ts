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
  'sheet.room': ['Fair path', 'Caminho da Feira'],

  'boss.title': ['A mystery on the path', 'Um mistério no caminho'],
  'boss.line': ['{name} showed up while your Soulmon was out.', '{name} apareceu enquanto o seu Soulmon estava fora.'],
  'boss.level': ['Level {level}', 'Nível {level}'],
  'boss.pool': ['Boss strength', 'Força do chefe'],
  'boss.attack': ['Attack', 'Atacar'],
  'boss.busy': ['Going…', 'Indo…'],
  'boss.shared': ['The whole clan wears it down together. It never heals.', 'O clã inteiro vai desgastando junto. Ele nunca se recupera.'],
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
  'trail.gameName': ['Fair challenge', 'Desafio da Feira'],
  'trail.keepGoing': ['Continue', 'Continuar'],

  'game.zip': ['Join the numbers in order, filling every square.', 'Ligue os números em ordem, preenchendo todas as casas.'],
  'game.patches': ['Tap two corners to draw a patch. Each patch holds one clue and matches its size.', 'Toque em dois cantos para desenhar uma colcha. Cada uma guarda uma pista e tem aquele tamanho.'],
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
} as const;

export type FeiraKey = keyof typeof COPY;

export function feiraText(language: Language, key: FeiraKey, vars?: Record<string, string | number>): string {
  const [en, pt] = COPY[key];
  const raw = language === 'pt-BR' ? pt : en;
  return vars ? raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : raw;
}

/** Só para teste: a tabela inteira. */
export const FEIRA_COPY = COPY;
