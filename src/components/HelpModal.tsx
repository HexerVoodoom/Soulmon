import { ModalSheet, sm2Hint } from './form/FormKit';
import { FOOD_LIMIT_PER_HOUR } from '../utils/careRules';
import { Language } from '../utils/i18n';
import {
  HABIT_MILESTONES,
  CONSTANCY_WINDOW_DAYS,
  REST_SHIELD_MAX,
  REST_SHIELD_EARN_EVERY_DAYS,
  MAX_DAILY_FOCUS,
  OVERCOMMIT_EFFORT,
  HAUNTED_AFTER_DAYS,
  DEFAULT_REST_WINDOW,
  REST_WINDOW_DAYS,
} from '../types/taskModel';
import { GOOD_CONSTANCY_RATIO } from '../utils/habitRhythm';
import { GATES } from '../utils/gates';
import { TALENT_POINTS_MAX } from '../utils/talents';
import { COMBAT_BONUS_CAP } from '../utils/combate/bonus';
import { FORGE_MAX_LEVEL } from '../utils/forge';
import { DREAM_CATALOG } from '../utils/restWindow';
import { guildText } from '../utils/guildCopy';
import { GUILD_MAX_MEMBERS, GUILD_TIDE_WEEKS, RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, RAID_TROPHY_EVERY } from '../utils/guildRules';

/**
 * GLOSSÁRIO — o que a palavra na tela quer dizer
 * ==============================================
 *
 * Este arquivo tinha 7 seções e 24 verbetes de até 90 palavras, e a maior
 * parte era o GUIA escrito de novo com outras palavras: HP, energia, comida,
 * escudo, assombrada e janela de descanso apareciam nos dois, com explicações
 * divergindo em detalhe. Aqui ficou só o que o `GuideModal` NÃO responde: a
 * tradução de um termo que a pessoa acabou de ler na interface, em UMA frase.
 *
 * Regra de corte aplicada: verbete que só repetia o guia saiu; verbete cuja
 * explicação já está impressa na própria tela (indicador de cocô, botão de
 * banho) saiu; e nenhuma descrição passa de duas linhas.
 *
 * **Os números continuam vindo das CONSTANTES** — glossário que escreve número
 * à mão passa a mentir no dia em que a regra muda.
 */

const [, , MS_3] = HABIT_MILESTONES;
/** O "5" de "5 das últimas 7" sai da razão que concede escudo, não de um literal. */
const GOOD_DAYS = Math.round(GOOD_CONSTANCY_RATIO * CONSTANCY_WINDOW_DAYS);
const DREAM_COUNT = DREAM_CATALOG.length;

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

/** Emoji aqui é CONTEÚDO do jogo (o item, a moeda), não ícone de interface. */
interface Term {
  icon: string;
  en: string;
  pt: string;
  descEn: string;
  descPt: string;
}

const TERMS: Term[] = [
  {
    icon: '❤️', en: 'Hearts (HP)', pt: 'Corações (HP)',
    descEn: 'Its health. Rubbing heals it; a bad day costs at most one, and it never drops to zero out of nowhere.',
    descPt: 'A saúde do seu Soulmon. Carinho cura; um dia ruim custa no máximo um, e nunca zera do nada.',
  },
  {
    icon: '⚡', en: 'Energy', pt: 'Energia',
    descEn: `The side bar. Fills only by feeding (up to ${FOOD_LIMIT_PER_HOUR}/hour) and resets each day.`,
    descPt: `A barra lateral. Sobe apenas alimentando (até ${FOOD_LIMIT_PER_HOUR}/hora) e zera todo dia.`,
  },
  {
    // Combate v3: Vínculo N (você) e Lv N (o Soulmon). Números das CONSTANTES; sem prazo, sem cobrança.
    icon: '🔗', en: 'Bond N / Lv N', pt: 'Vínculo N / Lv N',
    descEn: `Bond N is your level as a carer (up to ${TALENT_POINTS_MAX}); each one gives a talent point. Lv N is your Soulmon's. The Arena opens at Bond ${GATES.pvp.minBond}.`,
    descPt: `Vínculo N é o seu nível como pessoa que cuida (até ${TALENT_POINTS_MAX}); cada um rende um ponto de talento. Lv N é o do seu Soulmon. A Arena abre no Vínculo ${GATES.pvp.minBond}.`,
  },
  {
    icon: '🎖️', en: 'Talents & equipment', pt: 'Talentos e equipamento',
    descEn: `Talents (three paths) live in Stats; the three equipment slots are at the Soulsmith in the Market. Pieces come from building missions (level 1) and are upgraded there with mission materials, choosing one of two gains per level (up to level ${FORGE_MAX_LEVEL}). Together they add at most ${Math.round(COMBAT_BONUS_CAP * 100)}% strength; never drawn, never bought with money.`,
    descPt: `Os talentos (três caminhos) ficam em Estatísticas; os três espaços de equipamento, no Soulsmith, no Mercado. As peças vêm das missões dos prédios (nível 1) e se aprimoram lá com os materiais, escolhendo um de dois ganhos por nível (até o nível ${FORGE_MAX_LEVEL}). Juntos somam no máximo ${Math.round(COMBAT_BONUS_CAP * 100)}% de força; nunca sorteado, nunca comprado com dinheiro.`,
  },
  {
    icon: '🥚', en: 'Rebirth', pt: 'Renascimento',
    descEn: 'After the Ultra: your creature becomes an egg and you choose who they come back as. Once per creature.',
    descPt: 'Depois do Ultra: sua criatura vira ovo e você escolhe quem ela volta a ser. Uma vez por criatura.',
  },
  {
    // P5: o glossário é uma das duas superfícies que a convenção do CLAUDE.md
    // manda atualizar junto com regra de jogo (a outra é o `GuideModal`, que
    // foi atualizado). Esta entrada ficou para trás.
    icon: '📊', en: 'Complete Day', pt: 'Dia Completo',
    descEn: 'Daily goal met plus full energy. It is the currency of evolution, and it only accumulates.',
    descPt: 'Meta do dia cumprida mais energia cheia. É a moeda da evolução, e só acumula.',
  },
  {
    icon: '👊', en: 'Power / 🎶 Harmony / 🤲 Benevolence', pt: 'Poder / 🎶 Harmonia / 🤲 Benevolência',
    descEn: 'Attribute points from feeding. The dominant one picks which branch it evolves into.',
    descPt: 'Pontos de atributo ganhos alimentando. O dominante define o galho da evolução.',
  },
  {
    // INCUBAÇÃO (D-G8b/D-G8c). Sem número e sem unidade de tempo (R-I); diz
    // que espera por você, que é a metade que impede a mecânica de ser lida
    // como prazo (R-N).
    icon: '🥚', en: 'Incubation', pt: 'Incubação',
    descEn: 'When the bar fills, the next form starts taking shape — it takes a while. Come back whenever you like: it waits for you, and nothing is lost.',
    descPt: 'Quando a barra enche, a próxima forma começa a tomar corpo — leva um tempo. Volte quando quiser: ela espera por você, e nada se perde.',
  },
  {
    icon: '🔒', en: 'Evolution padlock', pt: 'Cadeado de evolução',
    descEn: 'Tap your current Soulmon on the Evolution page. Locked, it never evolves — complete days keep counting.',
    descPt: 'Toque no seu Soulmon atual na página de Evolução. Travado, seu Soulmon nunca evolui — os dias completos seguem contando.',
  },
  {
    icon: '🌀', en: 'Glitchtama', pt: 'Glitchtama',
    descEn: 'Rare item from clearing all 5 dungeon floors. Using it grants one complete day — one a day, so the ladder stays measured in days.',
    descPt: 'Item raro de concluir os 5 andares da masmorra. Usar concede um dia completo — um por dia, para a escada continuar sendo medida em dias.',
  },
  {
    // 🧭 Passeio e Travessias (30/09/2026). Sem número, sem prazo, sem prêmio.
    icon: '🧭', en: 'Stroll & Crossings', pt: 'Passeio e Travessias',
    descEn: 'In Exploration: pick where your Soulmon strolls each day. Crossings are optional things you do in your own life that clear the mist over a new region — no deadline, and they never touch your pet or the daily goal.',
    descPt: 'Na Exploração: escolha para onde seu Soulmon passeia cada dia. Travessias são coisas opcionais que você faz na sua vida e abrem a névoa de uma região nova — sem prazo, e nunca mexem no seu Soulmon nem na meta do dia.',
  },
  {
    icon: '💗', en: 'Little Heart', pt: 'Coraçãozinho',
    descEn: 'Shop item and rare dungeon drop. Using it from the Backpack heals 1 HP.',
    descPt: 'Item da loja e drop raro da masmorra. Usar pela mochila cura 1 HP.',
  },
  {
    icon: '📈', en: 'Consistency', pt: 'Constância',
    descEn: `Replaces the streak: "${GOOD_DAYS} of the last ${CONSTANCY_WINDOW_DAYS}". Nothing here resets to zero.`,
    descPt: `Substitui a sequência: "${GOOD_DAYS} das últimas ${CONSTANCY_WINDOW_DAYS}". Nada aqui volta para zero.`,
  },
  {
    icon: '🛡️', en: 'Rest shield', pt: 'Escudo de descanso',
    descEn: `Earned every ${REST_SHIELD_EARN_EVERY_DAYS} days of good consistency (up to ${REST_SHIELD_MAX}), and spent automatically on a day you miss.`,
    descPt: `Ganho a cada ${REST_SHIELD_EARN_EVERY_DAYS} dias de boa constância (até ${REST_SHIELD_MAX}), e gasto sozinho no dia em que você falta.`,
  },
  {
    icon: '🌳', en: 'Habit maturity', pt: 'Maturidade do hábito',
    descEn: `Seed → Sprout → Sapling → Tree. The icon grows and the habit yields more attribute, up to ${MS_3} days done.`,
    descPt: `Semente → Broto → Muda → Árvore. O ícone cresce e o hábito rende mais atributo, até ${MS_3} dias feitos.`,
  },
  {
    icon: '🏋️', en: 'Effort', pt: 'Esforço',
    descEn: `Quick (1), Medium (2), Project (3). The goal adds up effort, not items; past ${OVERCOMMIT_EFFORT} in a day it's a heads-up, never a block.`,
    descPt: `Rápida (1), Média (2), Projeto (3). A meta soma esforço, não itens; passando de ${OVERCOMMIT_EFFORT} no dia é aviso, nunca bloqueio.`,
  },
  {
    icon: '🎯', en: 'Today\'s focus', pt: 'Foco do dia',
    descEn: `Up to ${MAX_DAILY_FOCUS} tasks chosen at check-in. Completing all ${MAX_DAILY_FOCUS} earns the day's seal.`,
    descPt: `Até ${MAX_DAILY_FOCUS} tarefas escolhidas no check-in. Completar as ${MAX_DAILY_FOCUS} rende o selo do dia.`,
  },
  {
    icon: '👻', en: 'Haunted', pt: 'Assombrada',
    descEn: `Overdue or untouched for ${HAUNTED_AFTER_DAYS} days. Clearing one pays a relief bonus — it is not a scolding.`,
    descPt: `Vencida ou parada há ${HAUNTED_AFTER_DAYS} dias. Concluir uma dá bônus de alívio — não é bronca.`,
  },
  {
    icon: '💤', en: 'Someday', pt: 'Algum dia',
    descEn: 'A deliberately inert list: out of the goal, never ages, never haunts. And it comes back whenever you want.',
    descPt: 'Uma lista deliberadamente parada: fora da meta, não envelhece, não assombra. E volta quando você quiser.',
  },
  {
    icon: '🌙', en: 'Let it go', pt: 'Deixar pra lá',
    descEn: 'An honest ending for a task that will not happen — with its own list and an undo.',
    descPt: 'Um fim honesto para a tarefa que não vai acontecer — com lista própria e volta atrás.',
  },
  {
    icon: '🛏️', en: 'Rest Window', pt: 'Janela de Descanso',
    descEn: `The sleep window you choose (default ${DEFAULT_REST_WINDOW.start}–${DEFAULT_REST_WINDOW.end}). Read as "how many of the last ${REST_WINDOW_DAYS} nights" — no score, no penalty.`,
    descPt: `A janela de sono que você escolhe (padrão ${DEFAULT_REST_WINDOW.start}–${DEFAULT_REST_WINDOW.end}). Lida como "quantas das últimas ${REST_WINDOW_DAYS} noites" — sem nota, sem castigo.`,
  },
  {
    icon: '🌠', en: 'Dream', pt: 'Sonho',
    descEn: `A collectible scene of your Soulmon, one per night inside the window. ${DREAM_COUNT} to discover.`,
    descPt: `Uma cena colecionável do seu Soulmon, uma por noite dentro da janela. São ${DREAM_COUNT} para descobrir.`,
  },
  {
    icon: '💠', en: 'Bits vs. 🎖️ Honor vs. 💎 Credits', pt: 'Bits vs. 🎖️ Honra vs. 💎 Créditos',
    descEn: 'Bits come from minigames and buy the shop. Honor comes from the Tournament and buys cosmetics only. Credits are bought with real money.',
    descPt: 'Bits vêm dos minijogos e compram a loja. Honra vem do Torneio e compra só cosméticos. Créditos são comprados com dinheiro real.',
  },
  // A GUILDA (`docs/NARRATIVA-COPY-GUILDA.md` §11): a copy mora em `guildCopy.ts` (dono único) e os
  // números vêm das CONSTANTES de `guildRules.ts`. O `icon` é dado, nunca desenhado aqui.
  ...guildTerms(),
];

function guildTerms(): Term[] {
  const par = (icon: string, termo: Parameters<typeof guildText>[1], def: Parameters<typeof guildText>[1], vars?: Record<string, number>): Term => ({
    icon, en: guildText('en-US', termo), pt: guildText('pt-BR', termo),
    descEn: guildText('en-US', def, vars), descPt: guildText('pt-BR', def, vars),
  });
  return [
    par('🌳', 'guild.help.guilda.termo', 'guild.help.guilda.def', { max: GUILD_MAX_MEMBERS }),
    par('🌳', 'guild.help.bosque.termo', 'guild.help.bosque.def'),
    par('🌳', 'guild.help.fio.termo', 'guild.help.fio.def'),
    par('🌳', 'guild.help.feira.termo', 'guild.help.feira.def', { cheio: RAID_EMBLEMS, piso: RAID_EMBLEMS_FLOOR }),
    par('🌳', 'guild.help.mare.termo', 'guild.help.mare.def', { semanas: GUILD_TIDE_WEEKS }),
    par('🌳', 'guild.help.concha.termo', 'guild.help.concha.def', { n: RAID_TROPHY_EVERY }),
  ];
}

export function HelpModal({ isOpen, onClose, language }: HelpModalProps) {
  const isPt = language === 'pt-BR';

  return (
    <ModalSheet
      open={isOpen}
      onClose={onClose}
      language={language}
      title={isPt ? 'Glossário' : 'Glossary'}
      maxWidth={520}
    >
      {/* Copy §6 (L10, §16): é aqui que "o universo é descrito como universo".
          A 2ª oração bloqueia a inferência de tipologia ("então eu sou
          akasha") que a mera ADJACÊNCIA entre ficha da criatura e respostas
          da pessoa ensina (§6 da bíblia). */}
      <p style={sm2Hint}>
        {isPt
          ? 'O que cada palavra da tela quer dizer. O Soulmon tem um universo próprio: estes são os nomes dele, e nenhum deles descreve você.'
          : 'What each word on screen means. Soulmon has a world of its own: these are its names, and none of them describe you.'}
      </p>

      {/* Canvas Conta (`GuiaGlossario.dc.html`, CONTA-16): `dl` com `dt`
          14/500 e `dd` 12 `muted`, sem acordeão e sem o emoji na frente — o
          `icon` fica no dado (é o glifo que a tela usa), não no glossário. */}
      <dl className="sm2-conta-gl">
        {TERMS.map(t => (
          <div key={t.en}>
            <dt>{isPt ? t.pt : t.en}</dt>
            <dd>{isPt ? t.descPt : t.descEn}</dd>
          </div>
        ))}
      </dl>
    </ModalSheet>
  );
}
