// Copy da Versão C (landing de aquisição, /beta/c/ e /beta/en/c/). Fatos continuam vindos de textos.ts / FEATURE_TRUTH.md;
// o que não está no repo está marcado com "CONFERIR" para o dono confirmar (ver relatório da entrega).
// Recompensa: nada é prometido ao primeiro grupo. A seção "Prêmios do beta" (premios) está pronta e DESLIGADA
// (PREMIOS_BETA = false em LandingB.astro) até existir a arte dos quatro itens.
import { CONTATO } from './textos';

const pt = {
  titulo: 'Soulmon: acesso antecipado para Android',
  desc: 'Crie uma criatura nascida da sua personalidade, cumpra atividades da vida real e evolua seu Soulmon. Acesso antecipado para Android.',
  cta: 'Quero acesso antecipado', ctaConvite: 'Quero acesso antecipado',
  hero: {
    eyebrow: 'ACESSO ANTECIPADO · ANDROID',
    // Uma entrada por linha;   = espaço que não quebra. "ações reais" nunca se separa.
    h1: ['Suas ações reais.', 'A evolução dele.'],
    sub: 'Crie uma criatura nascida da sua personalidade. Cumpra atividades da vida real, evolua seu Soulmon e explore um mundo misterioso cheio de criaturas, desafios e descobertas.',
    ver: 'Veja como funciona',
    micro: 'Grátis para entrar · Só Android · 18+ · Acesso antecipado',
    evoRotulo: 'As cinco formas de um Soulmon',
  },
  como: {
    h2: 'Como o Soulmon funciona',
    passos: [
      ['Aja na vida real', 'Cumpra suas atividades do dia e construa hábitos melhores.'],
      ['Ajude seu Soulmon a evoluir', 'Seu progresso alimenta o crescimento e a evolução do seu companheiro.'],
      ['Explore um mundo juntos', 'Descubra novos lugares, colecione formas e desafie outros jogadores.'],
    ] as [string, string][],
    demoH: 'Experimente: complete o dia',
    demoDica: 'Toque nas tarefas e veja o que acontece com ele.',
    demoRotulo: 'Tarefas de exemplo',
    hoje: 'Hoje', missao: 'Missão', secTarefas: 'Tarefas', secHabitos: 'Hábitos',
    estagio: 'Forma {n} de 5', progresso: '{n} de {total} tarefas',
    demoFim: 'Dia completo. Foi assim que ele chegou à última forma.', recomecar: 'Recomeçar',
    demoNota: 'Demonstração. No jogo, a evolução segue as atividades que você mesmo registra.',
  },
  meet: {
    h2: 'Nenhum Soulmon é igual a outro.',
    p: 'Sua personalidade molda a criatura que você desperta. O elemento dela influencia o visual, as habilidades e os caminhos de evolução.',
    stats: [['20', 'elementos base'], ['200+', 'combinações']] as [string, string][],
    sorteioH: 'Gere o seu Soulmon',
    gerar: 'Gerar meu Soulmon', outro: 'Gerar outro',
    dica: 'Ele fica no canto da tela e evolui enquanto você desce a página.',
    maisResumo: 'Ver os 20 elementos', maisRotulo: 'Os 20 elementos base',
  },
  mundo: {
    h2: 'Um mundo para explorar',
    p: 'Passeie, colecione, batalhe e cresça junto com outros jogadores.',
    pilares: [
      // [id, título, texto]. CONFERIR com o dono item a item.
      ['explorar', 'Explore', 'Passeios, o Endless Rift e a Masmorra: uma descida sem teto de camadas.'],
      ['colecionar', 'Colecione', 'Cada forma tem uma versão para cada elemento. Colecione todas.'],
      ['batalhar', 'Batalhe', 'Duelos no Torneio e na Arena, contra jogadores (PvP) e contra a máquina (PvE).'],
      ['social', 'Cresça com amigos', 'Compartilhe seu progresso, ajude amigos e tenha uma Casa e missões de clã.'],
    ] as [string, string, string][],
    alts: { explorar: 'Capa do Endless Rift, a descida sem fim do Soulmon.', batalhar: 'Capa da Arena do Soulmon.', social: 'Salão do Clã, no Hall do Soulmon.' } as Record<string, string>,
    colecao: {
      rotulo: 'Uma criatura de fogo e os três caminhos de evolução que saem dela',
      raiz: 'Ponto de partida',
      caminhosH: 'Três caminhos',
      caminhos: ['Poder', 'Harmonia', 'Benevolência'],
      dica: 'Do mesmo ponto de partida, cada caminho leva a um corpo diferente.',
    },
  },
  acao: {
    h2: 'Veja em ação',
    p: 'Telas reais do app e o trailer do jogo.',
    trailerLegenda: 'Telas do app e a música do jogo. Toque para assistir.',
    telasH: 'Telas do jogo',
    printAlt: { combate: 'Combate na Arena do Soulmon: seu Soulmon contra um adversário, com as barras de vida.', mapa: 'Mapa central do Soulmon, com Mercado, Jogos, Exploração, Arena, Hall e Laboratório ao redor do cristal.', home: 'Home do Soulmon: sua criatura no quarto e a lista de tarefas e hábitos do dia.' } as Record<string, string>,
  },
  fundador: {
    selo: 'Treinador Fundador',
    eyebrow: 'ACESSO ANTECIPADO · ANDROID',
    h2: 'Faça parte do começo do Soulmon.',
    p: 'Entre na primeira geração de Treinadores Soulmon. Conheça o jogo antes do lançamento público, conte como foi e ajude a moldar o mundo enquanto ele cresce.',
    itens: ['Acesso antecipado ao jogo', 'Recursos novos antes do lançamento público', 'Ajude a influenciar as próximas melhorias'],
    nota: 'Só Android · 18+ · Grátis para entrar.',
  },
  // Seção oculta (PREMIOS_BETA = false). Só publicar com a arte pronta e a decisão do dono sobre prometer prêmio.
  premios: {
    h2: 'Prêmios do beta',
    p: 'Quem testa desde o começo leva quatro itens especiais para o perfil e para a Casa.',
    itens: [
      ['moldura', 'Moldura especial', 'Uma moldura exclusiva para o retrato do seu perfil.'],
      ['retrato', 'Retrato especial', 'Um retrato único para representar você no jogo.'],
      ['cristal', 'Cristal decorativo', 'Um cristal de enfeite, exclusivo, para decorar a sua Casa.'],
      ['background', 'Background especial', 'Um fundo exclusivo para o seu perfil.'],
    ] as [string, string, string][],
  },
  entrar: {
    h2: 'Como entrar', frase: 'Três passos, sem pressa.',
  },
  faq: {
    h2: 'Perguntas frequentes',
    itens: [
      ['Quanto custa?', 'Entrar não custa nada. O jogo tem loja, e compras dentro do beta são de teste.'],
      ['Preciso jogar todo dia?', 'Não há rotina diária obrigatória. O Google Play exige que os testadores permaneçam inscritos por 14 dias seguidos. Você pode explorar o Soulmon no seu ritmo, e qualquer feedback que compartilhar ajuda a melhorar o jogo.'],
      ['Funciona no iPhone?', 'Não. O beta é só para Android.'],
      ['Quem pode entrar?', 'Quem tem 18 anos ou mais e um celular Android com a Play Store.'],
      ['Quando vou ter acesso?', 'Depois de seguir os três passos de "Como entrar", você entra no teste fechado pela Play Store.'],
      ['O que preciso fazer depois de entrar?', 'O teste fechado da Play exige que você continue participando por 14 dias.'],
      ['Meu progresso fica salvo?', 'Sim, o progresso fica salvo na sua conta do Soulmon e continua quando você atualiza o app. Por ser uma versão de teste, podem aparecer falhas; se algo se perder, conte para a gente.'],
      ['Posso sair quando eu quiser?', 'Pode. Você decide quando sair do teste, e a exclusão da conta fica em Configurações, Seus dados. Só lembre que o Google conta 14 dias seguidos de participação.'],
      ['Preciso reportar bugs?', 'Não, é opcional. Depois da sua primeira sessão, vamos fazer uma pergunta rápida; qualquer feedback ajuda a melhorar o jogo.'],
      ['Tem compras dentro do app?', 'O jogo tem loja, mas no beta as compras são de teste: ninguém é cobrado.'],
      ['O que acontece depois do beta?', 'O beta é um teste fechado antes do lançamento público. Quando houver notícia sobre o lançamento, avisamos quem participou.'],
      ['O que fazem com meus dados?', 'O e-mail serve só para o convite do beta. Para pedir a remoção, escreva do próprio endereço para ' + CONTATO + '.'],
    ] as [string, string][],
  },
};

const en: typeof pt = {
  titulo: 'Soulmon: early access for Android',
  desc: 'Raise a creature born from your personality, complete real-life activities and evolve your Soulmon. Early access for Android.',
  cta: 'Get early access', ctaConvite: 'Get early access',
  hero: {
    eyebrow: 'EARLY ACCESS · ANDROID',
    // Dono (23/11): "real life" não quebra entre linhas. Cada entrada é uma linha;   = espaço que não quebra.
    h1: ['Your real-life', 'actions.', 'Their evolution.'],
    sub: 'Raise a creature born from your personality. Complete real-life activities, evolve your Soulmon and explore a mysterious world filled with creatures, challenges and discoveries.',
    ver: 'See how it works',
    micro: 'Free to join · Android only · 18+ · Early access',
    evoRotulo: 'The five forms of a Soulmon',
  },
  como: {
    h2: 'How Soulmon works',
    passos: [
      ['Take action in real life', 'Complete your daily activities and build better habits.'],
      ['Help your Soulmon evolve', "Your progress fuels your companion's growth and evolution."],
      ['Explore a world together', 'Discover new places, collect forms and challenge other players.'],
    ],
    demoH: 'Try it: finish your day',
    demoDica: 'Tap the tasks and watch what happens to it.',
    demoRotulo: 'Sample tasks',
    hoje: 'Today', missao: 'Mission', secTarefas: 'Tasks', secHabitos: 'Habits',
    estagio: 'Form {n} of 5', progresso: '{n} of {total} tasks',
    demoFim: 'Day complete. That is how it reached its last form.', recomecar: 'Start over',
    demoNota: 'Demo. In the game, evolution follows the activities you log yourself.',
  },
  meet: {
    h2: 'No two Soulmon are alike.',
    p: 'Your personality shapes the creature you awaken. Its element influences its appearance, abilities and evolution paths.',
    stats: [['20', 'base elements'], ['200+', 'combinations']],
    sorteioH: 'Generate your Soulmon',
    gerar: 'Generate my Soulmon', outro: 'Generate another',
    dica: 'It stays in the corner of the screen and evolves as you scroll down the page.',
    maisResumo: 'See all 20 elements', maisRotulo: 'The 20 base elements',
  },
  mundo: {
    h2: 'A world to explore',
    p: 'Explore, collect, battle and grow alongside other players.',
    pilares: [
      ['explorar', 'Explore', 'Strolls, the Endless Rift and the Dungeon: a descent with no floor limit.'],
      ['colecionar', 'Collect', 'Every form has a version for each element. Collect them all.'],
      ['batalhar', 'Battle', 'Duels in the Tournament and the Arena, against players (PvP) and against the game (PvE).'],
      ['social', 'Grow with friends', 'Share your progress, help your friends and have a House and clan missions.'],
    ],
    alts: { explorar: "Cover art of the Endless Rift, Soulmon's endless descent.", batalhar: 'Cover art of the Soulmon Arena.', social: "The Clan Hall, in Soulmon's Hall." },
    colecao: {
      rotulo: 'A fire creature and the three evolution paths that branch from it',
      raiz: 'Starting point',
      caminhosH: 'Three paths',
      caminhos: ['Power', 'Harmony', 'Benevolence'],
      dica: 'From the same starting point, each path leads to a different body.',
    },
  },
  acao: {
    h2: 'See it in action',
    p: 'Real app screens and the game trailer.',
    trailerLegenda: "App screens and the game's music. Tap to watch.",
    telasH: 'Game screens',
    printAlt: { combate: 'Soulmon Arena combat: your Soulmon against an opponent, with health bars.', mapa: 'Soulmon central map, with Market, Games, Exploration, Arena, Hall and Laboratory around the crystal.', home: "Soulmon Home: your creature in its room and the day's task and habit list." },
  },
  fundador: {
    selo: 'Founding Trainer',
    eyebrow: 'EARLY ACCESS · ANDROID',
    h2: "Be part of Soulmon's beginning.",
    p: 'Join the first generation of Soulmon Trainers. Discover the game before its public launch, share your experience and help shape the world as it grows.',
    itens: ['Early access to the game', 'New features before the public release', 'Help influence future improvements'],
    nota: 'Android only · 18+ · Free to join.',
  },
  premios: {
    h2: 'Beta rewards',
    p: 'Players who test from the start get four special items for their profile and their House.',
    itens: [
      ['moldura', 'Special frame', 'An exclusive frame for your profile portrait.'],
      ['retrato', 'Special portrait', 'A one-of-a-kind portrait to represent you in the game.'],
      ['cristal', 'Decorative crystal', 'An exclusive ornamental crystal to decorate your House.'],
      ['background', 'Special background', 'An exclusive background for your profile.'],
    ],
  },
  entrar: {
    h2: 'How to join', frase: 'Three steps, no rush.',
  },
  faq: {
    h2: 'FAQ',
    itens: [
      ['What does it cost?', 'Joining costs nothing. The game has a shop, and purchases during the beta are test purchases.'],
      ['Do I need to play every day?', 'No daily play schedule is required. Google Play requires testers to remain opted in for 14 consecutive days. You can explore Soulmon at your own pace, and any feedback you share helps improve the game.'],
      ['Does it work on iPhone?', 'No. The beta is Android only.'],
      ['Who can join?', 'Anyone 18 or older with an Android phone that has the Play Store.'],
      ['When will I get access?', 'After the three steps in "How to join", you enter the closed test through the Play Store.'],
      ['What do I need to do after joining?', 'The Play closed test requires you to stay in for 14 days.'],
      ['Will my progress be saved?', 'Yes, your progress is saved to your Soulmon account and carries on when you update the app. Because this is a test version, glitches can happen; if something gets lost, let us know.'],
      ['Can I leave whenever I want?', 'Yes. You decide when to leave the test, and account deletion is under Settings, Your data. Just remember that Google counts 14 consecutive days of participation.'],
      ['Do I need to report bugs?', 'No, it is optional. After your first session we will ask one quick question; any feedback helps improve the game.'],
      ['Are there in-app purchases?', 'The game has a shop, but during the beta purchases are test-only: nobody is charged.'],
      ['What happens after the beta?', 'The beta is a closed test before the public launch. When there is news about the launch, we will let participants know.'],
      ['What happens to my data?', 'Your email is used only for the beta invitation. To have it removed, write from that address to ' + CONTATO + '.'],
    ],
  },
};

export const TEXTOS_B = { pt, en };
