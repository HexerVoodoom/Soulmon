// MOTIVOS DE REINO e CRESCIMENTO POR PAPEL (decisao do dono, 15/10/2026).
// NARRATIVA 6.2/7.2: reino e ONDE (clima/habitat), nunca confundir com
// elemento (DE QUE). Entram do Champion em diante; no Mega vale a regra da
// 5.8 (o corpo carrega cobre, videira, ferragem do reino onde assentou) -
// pool `mass`. `akasha` (7.2.1): sem superficie; so borda que nunca fecha -
// NUNCA memoria, arquivo, biblioteca ou saber. Sem cicatriz, rachadura,
// remendo ou desgaste (5.8). Itens novos entram SEMPRE no fim.
import type { LText, RealmId, RoleId } from '../oracle';

const t = (pt: string, en: string): LText => ({ pt, en });

export const REALM_MOTIFS: Record<RealmId, { motifs: LText[]; mass: LText[] }> = {
  deserto: {
    motifs: [t('areia fina nas dobras do corpo', 'fine sand settled in the folds of its body'), t('cobre exposto, sem videira', 'bare exposed copper without any vine'), t('longos espaços vazios entre duas pequenas fagulhas', 'wide empty gaps between two small sparks'), t('linhas econômicas e lisas', 'economical smooth lines')],
    mass: [t('placas de cobre exposto recolhidas do deserto', 'plates of bare copper gathered from the desert'), t('uma cauda longa de cobre polido', 'a long tail of polished copper')],
  },
  picos: {
    motifs: [t('estruturas altas e finas', 'tall thin structures'), t('uma fagulha ardendo no alto da cabeça', 'a single spark burning at the very top of its head'), t('silhueta esguia, legível de longe', 'a slender silhouette readable from afar'), t('cristas finas como agulhas', 'needle-thin crests')],
    mass: [t('torres finas de ferragem recolhidas dos picos', 'thin towers of ironwork gathered from the peaks'), t('uma coroa alta de hastes de metal', 'a tall crown of metal rods')],
  },
  oceano: {
    motifs: [t('camadas sobrepostas até o escuro', 'overlapping layers deepening into darkness'), t('contornos sem nenhuma borda reta', 'outlines without any straight edge'), t('corpo ondulante de fundo escuro', 'a rippling dark-bottomed body'), t('mantos em véus sobrepostos', 'stacked veil-like mantles')],
    mass: [t('camadas de véu pesadas do fundo do mar', 'heavy veil layers from the deep sea'), t('uma saia ampla de camadas escuras', 'a wide skirt of dark layers')],
  },
  pantano: {
    motifs: [t('videira solta sem tubo por baixo', 'loose vine with no tube beneath it'), t('borra escura escorrendo', 'dark sludge hanging in soft drips'), t('partes meio assentadas, inacabadas', 'half-settled, unfinished-looking parts'), t('musgo mole nos ombros', 'soft moss on the shoulders')],
    mass: [t('videira pesada recolhida do pântano', 'heavy vine gathered from the swamp'), t('um manto de borra e videira', 'a mantle of sludge and vine')],
  },
  floresta: {
    motifs: [t('cobertura vegetal completa sobre o corpo', 'a full plant cover over the whole body'), t('estrutura por baixo apenas adivinhada', 'the structure underneath only guessed at'), t('camada sobre camada de folhas', 'layer upon layer of leaves'), t('galhos que crescem por acréscimo', 'branches grown by slow addition')],
    mass: [t('cobre inteiro tomado por vegetação da floresta', 'copper wholly overgrown with forest plants'), t('uma carga de ramos e folhas empilhados', 'a load of stacked boughs and leaves')],
  },
  cavernas: {
    motifs: [t('uma fagulha como única fonte de luz', 'a single spark as the only light source'), t('brilho que vem de dentro do próprio corpo', 'a glow that comes from within its own body'), t('formas recolhidas, sem nada apontado para fora', 'inward-gathered forms with nothing pointing outward'), t('tons profundos e escuros ao redor da fagulha', 'deep dark tones around the spark')],
    mass: [t('ferragem escura recolhida das cavernas', 'dark ironwork gathered from the caves'), t('placas pesadas que só brilham por dentro', 'heavy plates that glow only from within')],
  },
  gelo: {
    motifs: [t('tudo exatamente como assentou, imóvel', 'everything exactly as it settled, perfectly still'), t('superfícies lisas e preservadas', 'smooth preserved surfaces'), t('tons pálidos e translúcidos', 'pale translucent tones'), t('contornos paralisados e nítidos', 'sharp frozen outlines')],
    mass: [t('placas de gelo parado recolhidas do reino', 'slabs of still ice gathered from the realm'), t('um manto liso de gelo assentado', 'a smooth mantle of settled ice')],
  },
  campina: {
    motifs: [t('videira baixa junto ao chão', 'low vine close to the ground'), t('postura aberta e acolhedora', 'an open welcoming posture'), t('cores suaves e generosas', 'soft generous colors'), t('pequenos companheiros ao redor, sem destaque', 'small companions around it, none standing out')],
    mass: [t('videira baixa e trançada recolhida da campina', 'low braided vine gathered from the meadowland'), t('uma capa simples de grama trançada', 'a plain cape of woven grass')],
  },
  akasha: {
    motifs: [t('contorno que nunca fecha por completo', 'an outline that never fully closes'), t('corpo meio ausente, translúcido nas bordas', 'a half-absent body, translucent at the edges'), t('sem sombra no chão', 'no shadow cast on the ground'), t('partes que parecem sem superfície', 'parts that seem to have no surface')],
    mass: [t('uma borda aberta que nunca se fecha', 'an open edge that never closes'), t('um manto translúcido sem peso', 'a weightless translucent mantle')],
  },
};

/** Crescimento do corpo por PAPEL no Champion (5.8): itens NOVOS, anexados ao
 *  fim de `ROLE_METAMORPHS` em motor.ts. Sem cicatriz nem desgaste. */
export const ROLE_METAMORPHS_EXTRA: Record<RoleId, Array<{ en: string; pt: string }>> = {
  tanque: [
    { en: 'a bastion stalwart: a broad domed carapace, thick pillar-like legs and a wide shielding forearm', pt: 'baluarte firme: carapaça larga em cúpula, pernas grossas como pilares e um antebraço largo de escudo' },
    { en: 'a rampart beast: stacked armored ridges along the spine and a heavy low-slung frame', pt: 'fera-muralha: cristas blindadas empilhadas ao longo da coluna e uma testa baixa e pesada' },
  ],
  suporte: [
    { en: 'a gentle mender: long soft sleeves, a small glowing pouch and a tail curled like a cradle', pt: 'remendeiro gentil: mangas longas e macias, uma pequena bolsa luminosa e cauda enrolada como berço' },
    { en: 'a bell-bearer: a chiming charm at the throat, and wide sheltering shoulders', pt: 'portador de sino: um amuleto tilintante na garganta, ombros largos que abrigam e cabeça calma baixa' },
  ],
  fisico: [
    { en: 'a lunging striker: oversized hind legs, forward-leaning shoulders and sharpened forelimb tips', pt: 'atacante de bote: patas traseiras grandes, ombros inclinados à frente e pontas afiadas nos membros dianteiros' },
    { en: 'a heavy bruiser: a thick neck, broad fists and a barrel chest set in a wide stance', pt: 'brutamontes pesado: pescoço grosso, punhos largos e peito de barril em postura aberta' },
  ],
  magico: [
    { en: 'a pattern-reader: a crest of fine glowing lines, long slender fingers and a tall poised neck', pt: 'leitor de padrões: crista de linhas finas brilhantes, dedos longos e esguios e pescoço alto e equilibrado' },
    { en: 'a sigil carrier: a floating ring behind the head and slow-drifting marks around the shoulders', pt: 'portador de sigilos: um anel flutuante atrás da cabeça e marcas à deriva ao redor dos ombros' },
  ],
  alcance: [
    { en: 'a long-sighted skirmisher: a long slim snout or beak, a tall upright frame and a spring-loaded tail', pt: 'escaramuçador de longa vista: olhos grandes e agudos, focinho ou bico longo e esguio e cauda de mola' },
    { en: 'a lance thrower: a long prehensile arm with a shoulder rest for aiming, standing tall on slim legs', pt: 'lançador de dardos: braço longo e preênsil com apoio no ombro para mirar, de pé sobre pernas esguias' },
  ],
};
