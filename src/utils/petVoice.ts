// ---------------------------------------------------------------------------
// A VOZ do pet nos momentos que eram mudos (WP3.2).
//
// Concluir tarefa, esfregar, dar banho e terminar uma tarefa assombrada são os
// quatro gestos mais frequentes do app — e nenhum deles gerava fala. O pet
// falava sozinho a cada 3 min (idle) e quando RECUSAVA comida: ou seja, ele
// tinha voz para dizer "não" e não tinha para dizer "que bom".
//
// As frases moram AQUI, e não dentro do componente, por dois motivos:
//  1. o teste precisa varrer todas elas atrás de culpa — e um teste que lê JSX
//     lê o que consegue, não o que existe;
//  2. o desktop herda a mesma voz sem uma segunda implementação (footgun 9).
//
// REGRA DE TOM, e ela é o produto: nenhuma frase cobra. Nada de "deveria",
// "atrasou", "falhou", "esqueceu", "de novo". A tarefa assombrada concluída é
// ALÍVIO, não acerto de contas — a pilha de culpa vira loop de jogo com
// recompensa, que é a peça mais Soulmon do plano. Há teste travando as
// palavras proibidas em PT e EN.
//
// Sem emoji nas frases: quem fala é `speak()`, que os remove de qualquer jeito
// (`speakRaw()` preserva, e é para "+1⚡", não para frase).
// ---------------------------------------------------------------------------

/**
 * 21/09/2026 — seis `kind` novos vindos de `docs/NARRATIVA-COPY.md` §1:
 * `full` (recusa de comida) e `healCap` (teto de carinho do dia) moravam como
 * arrays INLINE no `CompanionHUD` — frase que mora em componente é frase que
 * nenhum teste de tom varre; `steady` é a vida cheia recusando o item (a copy
 * §1.9 põe as duas no mesmo `kind`, mas os gatilhos são distintos e a frase
 * do item não serve ao carinho — por isso dois); `sleep`, `wake` e `residue`
 * eram gestos MUDOS.
 */
export type PetVoiceKind =
  | 'task' | 'haunted' | 'rub' | 'shower' | 'milestone' | 'cheer' | 'rare' | 'lowHp' | 'idle'
  | 'full' | 'healCap' | 'steady' | 'sleep' | 'wake' | 'residue'
  | 'dirty' | 'hungry' | 'energized' | 'fine' | 'peckish' | 'starving';

/**
 * WP2.14 — a taxa da fala rara. ~5% das conclusões.
 *
 * ⚠️ **A taxa NUNCA vira alavanca.** Ela não é ajustável por evento, não sobe
 * com nada e não desce com nada — se um dia virar botão de engajamento, é uma
 * recompensa variável de valor zero sendo usada como isca, que é o desenho
 * que este produto recusa. Vale zero de propósito: o prêmio é a frase.
 */
export const RARE_CHEER_RATE = 0.05;

/** `pick` é 0..1 (o chamador passa `Math.random()`). PURA para o teste poder
 *  provar que a recompensa é idêntica com e sem o sorteio. */
export function rolledRareCheer(pick: number): boolean {
  return pick < RARE_CHEER_RATE;
}

export interface PetVoiceSignal {
  /** Contador que só cresce — o padrão de `feedAnim`/`fullSignal`. */
  n: number;
  kind: PetVoiceKind;
}

interface VoiceLines { pt: string[]; en: string[] }

export const PET_VOICE_LINES: Record<PetVoiceKind, VoiceLines> = {
  task: {
    pt: ['Mais uma fora da sua cabeça!', 'Você fez. Eu vi.', 'Isso conta, viu?'],
    en: ['One more out of your head!', 'You did it. I saw.', 'That counts, you know.'],
  },
  // A que estava te olhando. O alívio é o prêmio — nada de "finalmente".
  haunted: {
    /* Copy §1.8 (21/09/2026): nomeia o ato e o efeito, nunca o tempo que ela
       ficou parada. "Aqui" é o abrigo — ela fala do espaço dela, não do seu
       alívio (o seu, ela não tem como saber; §16 limite 2). A 2ª oração de
       "Ficou leve aqui" saiu antes ("Deve ter ficado aí também"): inferência
       sobre o estado interno de quem lê (§5.10). */
    pt: [
      'Aquela ali... foi. Respira.',
      'Essa era pesada. Agora ela é só passado.',
      'Fechou. Ficou leve aqui.',
    ],
    en: [
      'That one... is gone. Breathe.',
      'That one was heavy. Now it is just past.',
      'It closed. It got lighter in here.',
    ],
  },
  /**
   * HP BAIXO — e este é o kind mais importante do arquivo.
   *
   * ⚠️ O `CompanionHUD` dizia `'Não me sinto bem...'`, `'Preciso de
   * cuidados!'` e **`'HP baixo...'`** — a criatura-alma da pessoa anunciando o
   * próprio dano com o NOME DA VARIÁVEL, no exato dia em que a pessoa não
   * conseguiu cuidar de si. Isso converte culpa (reparável, motiva ação) em
   * vergonha (é sobre o self, motiva fuga — desinstalar).
   *
   * As frases viraram estas em 06/09/2026, e a régua é: **a atenção vira para
   * a PESSOA**, não para o medidor. O gatilho de cuidado continua o mesmo — o
   * pet quer companhia —, e o teste de palavras de cobrança que já varre este
   * arquivo passa a alcançá-las, o que era impossível enquanto viviam numa
   * escada de `pick()` dentro do componente.
   */
  lowHp: {
    /* ⚠️ 21/09/2026 — `'Tô com saudade. Como VOCÊ está?'` SAIU, e o motivo não
       é de tom: este kind dispara quando a sustentação caiu, isto é, **no dia
       em que a pessoa não cumpriu a meta**. "Saudade" ali é emoção da criatura
       causada pelo que a pessoa deixou de fazer — L11 e L6 da bíblia
       (`docs/NARRATIVA-E-UNIVERSO.md`) violadas no momento de maior
       vulnerabilidade.

       O docblock acima comemora ter consertado este kind em 06/09/2026: tirou
       `'HP baixo...'`, que era o PLACAR, e deixou a saudade, que é a COBRANÇA
       AFETIVA. Corrigir metade de um problema é como ele sobrevive.

       Há fundamento no mundo, não só regra: a criatura não tem órgão que leia
       ausência nem tempo decorrido (§5.10, o sensório). Ela fala do corpo dela
       AGORA e convida ao contato — que é, por desenho, a única coisa que
       reassenta.

       ⚠️ E a regra de 06/09/2026 CONTINUA valendo: pelo menos uma das falas
       pergunta pela PESSOA, não pelo pet (há teste exigindo `VOCÊ`/`you`). As
       duas regras conciliam porque **perguntar não é saber**: o sensório
       proíbe a criatura AFIRMAR o estado de quem lê, nunca perguntar. Foi por
       isso que a 1ª tentativa desta correção apagou o "E VOCÊ, como tá?" e o
       teste reprovou — corretamente. */
    pt: ['Tô mole hoje. E VOCÊ, como tá?', 'Tô meio sem borda. Senta aqui um pouco?', 'Só queria te ver hoje.'],
    en: ["I'm soft today. How about YOU?", 'My edges are loose. Sit here a bit?', 'I just wanted to see you today.'],
  },
  /** O ócio de barriga cheia: convite, nunca lista do que falta.
   *  21/09/2026 (copy §1.1): ela fala do que VÊ agora, não do seu dia —
   *  `'Como foi seu dia até agora?'` pedia relato de desempenho (L2, L11). */
  idle: {
    pt: ['Tô aqui. Tava só olhando a luz.', 'Ficou quieto agora. Eu gosto assim.', 'Você chegou. Eu ia te contar uma coisa e esqueci.'],
    en: ["I'm here. I was just watching the light.", 'It got quiet just now. I like it like this.', 'You showed up. I was going to tell you something and forgot.'],
  },
  /* Copy §1.3: prazer pelo gesto que está acontecendo (L11). "Firma" é o verbo
     da sustentação (§5.4). `'Eu gosto de quando você aparece'` saiu — é
     histórico de aparições, e o corpo dela não guarda isso (§5.10). */
  rub: {
    pt: ['Ahh. Isso aqui firma.', 'Fica mais um pouco.', 'Aqui. Mais em cima. Isso.'],
    en: ['Ahh. This one steadies me.', 'Stay a little longer.', 'Here. Higher up. There.'],
  },
  /* Copy §1.7: nomeia o ato e o efeito, nunca o mérito de quem apertou. */
  shower: {
    pt: ['Dissolveu tudo. Que leve.', 'Água boa.', 'Agora o chão tá limpo pra assentar de novo.'],
    en: ['It all dissolved. So light.', 'Good water.', 'Now the floor is clear to settle on again.'],
  },
  /* Copy §1.2 — a recusa de comida (teto da hora, `FOOD_LIMIT_PER_HOUR`).
     Vivia inline no `CompanionHUD` como `'Não aguento mais! Volta mais tarde.'`
     — "volta mais tarde" é instrução de retorno. A criatura fala do corpo
     DELA (L2); nunca "você já alimentou demais". */
  full: {
    pt: ['Tá assentando ainda. Daqui a pouco eu como.', 'Cheio. Foi bom.', 'Esse eu guardo pra depois.'],
    en: ["It's still settling. I'll eat again in a bit.", 'Full. That was good.', "I'll keep this one for later."],
  },
  /* Copy §1.9 — teto de carinho do dia (`rubDecision === 'daily-cap'`).
     Vivia inline no `CompanionHUD` ("já sarei o que dava por hoje!").
     ⚠️ A segunda oração é a parte que importa: os corações tocam sempre e o
     carinho continua valendo como contato. Sem ela o teto lê como "pare", e
     o gesto central do produto vira erro. */
  healCap: {
    pt: ['Já firmou o que dava hoje. Continua que eu gosto.'],
    en: ["It's as steady as it gets today. Keep going, I like it."],
  },
  /* Copy §1.9 / §5.1 — vida cheia recusando o coraçãozinho
     (`specialRefusal === 'already-full'`). A recusa PROTEGE o item: ele volta
     para a pastinha, e "guarda" é o que diz isso. Nunca "você desperdiçou". */
  steady: {
    pt: ['Tô firme. Guarda essa.'],
    en: ["I'm steady. Keep that one."],
  },
  /* Copy §1.4 — ao dormir (`handleSleep`). Dormir REORGANIZA o padrão (§5.5),
     não repõe nada. Nunca "boa noite, descanse bem": é recado sobre a noite
     de QUEM LÊ. */
  sleep: {
    pt: ['Vou desligar a leitura um pouco.', 'Se passar alguma coisa, eu guardo.'],
    en: ["I'm switching the reading off for a bit.", "If something passes by, I'll keep it."],
  },
  /* Copy §1.5 — ao acordar. ⚠️ Veto #12 e a Janela de Descanso: NENHUMA frase
     de manhã comenta a noite de quem lê ("dormiu bem?" é como se fabrica
     ortossonia). Ela fala do corpo dela e da Malha (L9). */
  wake: {
    pt: ['Assentou. Tô inteiro.', 'A Malha tava clara essa noite.'],
    en: ["It settled. I'm all here.", 'The Mesh was clear last night.'],
  },
  /* Copy §1.6 — a borra apareceu no abrigo. Constata e aponta: zero vergonha,
     zero nojo, zero pedido (L3, §5.6). Diz a consequência NA MALHA, nunca no
     seu dia. Nada de "me limpa" nem "estou sujo por sua causa".
     ⚠️ Esta superfície NÃO fala quando o dreno cobra sustentação: a criatura
     anunciando o próprio dano é a família de `'HP baixo...'`. */
  residue: {
    pt: ['Alguma coisa não assentou. Tá ali.', 'Isso atrapalha o assentamento. Água resolve.'],
    en: ["Something didn't settle. It's over there.", 'That gets in the way of settling. Water fixes it.'],
  },
  /* WP2.13 — os dias do meio do caminho (`HABIT_CHEER_AT`). Entre o marco de
     21 e o de 66 há quarenta e cinco dias em que nada acontece, e é ali que a
     maioria para. Estas falas não valem NADA — se valessem, teriam virado
     marco por acidente. E nenhuma diz quanto falta: o número que falta é a
     conta que transforma constância em cobrança. */
  cheer: {
    /* ⚠️ 21/09/2026: as duas primeiras exigiam histórico de repetição ("você
       não larga", "virou parte do dia"), que o corpo dela não guarda (§5.10).
       O sujeito passa para a COISA e o tempo para o presente. */
    pt: ['Isso aqui já tem raiz.', 'Isso aqui fica de pé sozinho.', 'Continua acontecendo. Gosto disso.'],
    en: ['This one has roots already.', 'This one stands on its own.', 'It keeps happening. I like that.'],
  },
  /* WP2.14 — a fala RARA. Aparece em ~5% das conclusões e não é anunciada em
     lugar nenhum: sem contador, sem "raro!", sem coleção. Uma surpresa que
     tem medidor deixa de ser surpresa e vira mais uma barra para encher.
     Valor material: ZERO, e há teste. */
  rare: {
    /* ⚠️ 21/09/2026: `'hoje você me parece diferente'` SAIU — comparar hoje
       com ontem exige guardar dois estados, e o corpo dela guarda um: o atual
       (§5.10). `'Guardei esse momento'` saiu pelo mesmo motivo (memória). */
    pt: ['Isso aqui chegou bonito.', 'Tô com o peito quente agora.', 'Acho que estou orgulhoso. É isso?'],
    en: ['This one came in well.', 'My chest is warm right now.', 'I think I am proud. Is that it?'],
  },
  /* 22/09/2026 (QA R2 `07` §2.9) — a ESCADA DE FALLBACK do toque e do ócio
     morava inline no `CompanionHUD` (duas cópias): `'Me limpa!'`,
     `'Me alimenta!'`, `'Me alimenta por favor!'`. Era a única fala que o
     jogador que menos faz ouvia (89/90 dias), e era pedido imperativo — L12
     ("nomeia o ato, nunca instrução") e L2 (a criatura não é interface). Aqui
     ela fala do corpo DELA e constata; nunca manda, nunca pede. A régua de
     tom acima passa a alcançar. */
  /* `careEvent.type === 'poop'` — a borra está lá e ninguém limpou ainda. */
  dirty: {
    pt: ['Tem uma coisa ali que não assentou.', 'Tá pegajoso aqui do lado.', 'Água ajudaria.'],
    en: ["There's something over there that didn't settle.", "It's sticky over here.", 'Water would help.'],
  },
  /* `careEvent.type === 'food'` — pedido de comida ativo. */
  hungry: {
    pt: ['Barriga fazendo barulho.', 'Deu fome agora.', 'Tô com fome. Só avisando.'],
    en: ['Belly is rumbling.', 'Got hungry just now.', "I'm hungry. Just saying."],
  },
  /* energia cheia (`ratio >= 1`). */
  energized: {
    pt: ['Cheio. Tô inteiro.', 'Dá pra sentir a borda toda.', 'Tô aceso hoje.'],
    en: ['Full. All here.', 'I can feel every edge.', "I'm lit up today."],
  },
  /* energia boa (`ratio >= 0.6`). */
  fine: {
    pt: ['Tô bem assim.', 'Assentado. Nada faltando.', 'Tá bom aqui.'],
    en: ["I'm fine like this.", 'Settled. Nothing missing.', "It's good here."],
  },
  /* começando a faltar (`ratio >= 0.1`). */
  peckish: {
    pt: ['Começando a dar fome.', 'A barriga tá falando baixinho.', 'Meio vazio por dentro.'],
    en: ['Starting to get hungry.', 'Belly is whispering.', 'A bit empty inside.'],
  },
  /* fundo (`ratio < 0.1`) — o piso do perfil D. Constata o corpo, não cobra. */
  starving: {
    pt: ['Muita fome. Tô mole.', 'Barriga vazia. Quieto por aqui.', 'Tô perto do chão hoje.'],
    en: ['Very hungry. Soft all over.', 'Empty belly. Quiet over here.', "I'm close to the ground today."],
  },
  milestone: {
    /* ⚠️ 21/09/2026: `'Você repetiu tanto que virou seu'` SAIU — põe a pessoa
       como sujeito e apoia-se em histórico. A L1 proíbe a pessoa como sujeito
       de verbo de ser **inclusive no elogio**. */
    pt: ['Olha o tamanho disso agora!', 'Isso aqui virou raiz.', 'Isso aqui já é tronco.'],
    en: ['Look how big this got!', 'This one has roots now.', 'This one is a trunk now.'],
  },
};

/**
 * WP3.10 — O TRAÇO DE NASCIMENTO NA VOZ.
 *
 * Todo pet nasce com um traço sorteado (`utils/passives.ts`) e ele só existia
 * como EFEITO de regra e uma linha em Estatísticas. Dois pets do mesmo estágio
 * se comportam diferente e falavam exatamente igual — o traço era invisível
 * justamente no canal em que personalidade aparece.
 *
 * Uma fala por traço, por gesto. Substitui a genérica quando existe; onde não
 * existe, a genérica continua valendo (nada de preencher a matriz inteira só
 * para ela existir — frase forçada lê como enchimento).
 *
 * ⚠️ O traço é lido do ESTADO, nunca por parâmetro novo: é isso que faz o
 * desktop herdar sem uma segunda implementação (a mesma regra dos passivos).
 */
const TRAIT_LINES: Partial<Record<string, Partial<Record<PetVoiceKind, VoiceLines>>>> = {
  guloso: {
    task: {
      pt: ['Fez! Isso vira comida, né?', 'Boa! Já deu fome.'],
      en: ['Done! That turns into food, right?', 'Nice! I am hungry already.'],
    },
  },
  carinhoso: {
    /* ⚠️ 21/09/2026 — aqui estavam COLADOS por acidente o docblock inteiro do
       `lowHp`, mais os blocos `lowHp` e `idle` do padrão, idênticos aos de
       cima. Compilava pelo `Partial<Record<…>>` e não mudava comportamento
       (as falas eram as mesmas), mas tornava a matriz de traços MENTIROSA:
       quem lesse concluiria que o traço carinhoso altera o HP baixo e o ócio,
       e não altera. O traço tem UMA fala própria — a do carinho. */
    rub: {
      pt: ['Não para, não para…', 'Isso aqui é a melhor parte do dia.'],
      en: ['Do not stop, do not stop…', 'This is the best part of the day.'],
    },
  },
  teimoso: {
    haunted: {
      pt: ['Eu sabia que você ia encarar essa.', 'Essa aí resistiu. Você resistiu mais.'],
      en: ['I knew you would face that one.', 'That one held on. You held on longer.'],
    },
  },
  sortudo: {
    rare: {
      pt: ['Hoje o dia está do nosso lado. Sinto isso.', 'Tem alguma coisa boa no ar.'],
      en: ['Today is on our side. I can feel it.', 'There is something good in the air.'],
    },
  },
  madrugador: {
    shower: {
      pt: ['Limpo e acordado. Assim que se faz.', 'Pronto pro dia inteiro.'],
      en: ['Clean and awake. That is how it is done.', 'Ready for the whole day.'],
    },
  },
};

/**
 * Escolhe a frase. `pick` entra por parâmetro (0..1) para o teste ser
 * determinístico sem precisar mexer no `Math.random` global — o chamador em
 * runtime passa `Math.random()`.
 */
export function petVoiceLine(
  kind: PetVoiceKind,
  isPt: boolean,
  pick: number,
  /** WP3.10 — `petPassive` do estado. Sem traço, ou sem fala para este gesto,
   *  cai na genérica: matriz cheia por obrigação vira enchimento. */
  trait?: string,
): string {
  const doTraco = trait ? TRAIT_LINES[trait]?.[kind] : undefined;
  const linhas = (doTraco ?? PET_VOICE_LINES[kind])[isPt ? 'pt' : 'en'];
  const i = Math.min(linhas.length - 1, Math.max(0, Math.floor(pick * linhas.length)));
  return linhas[i];
}
