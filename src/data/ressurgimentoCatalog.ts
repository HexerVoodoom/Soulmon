/**
 * OS 10 CUIDADOS NOVOS DO CAMINHO RESSURGIMENTO (12/11/2026, `docs/design/RESSURGIMENTO-PESQUISA.md` §1).
 *
 * A lista-base tem 22 cuidados: 12 já existiam no catálogo (reusados em `utils/ressurgimento.ts`) e estes 10 são novos.
 * Cada um tem como NÍVEL 1 a versão de 2 minutos ("a que conta como vitória"). Linguagem e vetos da pesquisa (§3):
 * nada de diagnóstico, de promessa, de culpa, de dieta/peso/horas de sono; o catálogo nunca diz que "trata" nada.
 * `pathOnly: 'ressurgimento'` os tira do starter set automático dos outros caminhos (`recommendStarterSet`);
 * continuam disponíveis no navegador do catálogo. Evidência: indireta (rotina/domínio dentro da ativação comportamental);
 * a base está na pesquisa, e por isso o nível é C com nota.
 */
import type { CatalogItem, CatalogLevelSpec } from '../types/activityCatalog';
import type { Schedule } from '../types/taskModel';

const daily: Schedule = { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] };
const x1: Schedule = { kind: 'timesPerWeek', target: 1 };
const x2: Schedule = { kind: 'timesPerWeek', target: 2 };
const x3: Schedule = { kind: 'timesPerWeek', target: 3 };

const NOTE = 'Evidência indireta: rotina e pequenas vitórias dentro da ativação comportamental (docs/design/RESSURGIMENTO-PESQUISA.md). Entra porque a versão mínima é de 2 minutos e o caminho é opcional.';
const lv = (pt1: string, en1: string, pt2: string, en2: string, pt3: string, en3: string, s1: Schedule, s2: Schedule = s1, s3: Schedule = s2): [CatalogLevelSpec, CatalogLevelSpec, CatalogLevelSpec] => [
  { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: pt1, en: en1 }, effort: 1, defaultSchedule: s1 },
  { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: pt2, en: en2 }, effort: 1, defaultSchedule: s2 },
  { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: pt3, en: en3 }, effort: 2, defaultSchedule: s3 },
];

export const RESSURGIMENTO_ITEMS: CatalogItem[] = [
  {
    id: 'ressurg-comer-algo', pathOnly: 'ressurgimento', kind: 'especifica', area: 'corpo', category: 'corpo', emoji: '🍽️',
    name: { pt: 'Comer alguma coisa', en: 'Eat something' },
    why: { pt: 'Um horário mais ou menos regular ajuda a dar forma ao dia. Só o pequeno já vale.', en: 'A roughly regular time gives the day some shape. Just the small version counts.' },
    levels: lv('Uma coisa de que você gosta, sentado', 'One thing you like, sitting down', 'Uma refeição sentado, sem pressa nenhuma', 'One meal sitting down, no hurry', 'Duas refeições no dia, do seu jeito', 'Two meals in the day, your way', daily),
    anchorSuggestion: { pt: 'quando bater a fome, sentado à mesa', en: 'when hunger shows up, sitting at the table' },
    addresses: ['comecar', 'energia'], leverages: [], evidence: { level: 'C', refs: [], note: NOTE },
  },
  {
    id: 'ressurg-luz-do-dia', pathOnly: 'ressurgimento', kind: 'especifica', area: 'corpo', category: 'corpo', emoji: '🌅',
    name: { pt: 'Abrir a janela', en: 'Open the window' },
    why: { pt: 'Um pouco de luz do dia faz parte de um dia mais leve. Dois minutos perto da janela já contam.', en: 'A bit of daylight is part of a lighter day. Two minutes by the window already count.' },
    levels: lv('Ficar 2 min perto da janela ou na porta', 'Spend 2 min by the window or the door', 'Ficar 5 min na janela, com a luz do dia', 'Spend 5 min at the window in daylight', 'Tomar o café perto da luz do dia', 'Have your coffee near the daylight', daily),
    anchorSuggestion: { pt: 'logo depois de levantar', en: 'right after getting up' },
    addresses: ['comecar', 'energia'], leverages: [], evidence: { level: 'C', refs: [], note: NOTE },
  },
  {
    id: 'ressurg-ar-livre', pathOnly: 'ressurgimento', kind: 'especifica', area: 'corpo', category: 'corpo', emoji: '🌤️',
    name: { pt: 'Ficar ao ar livre', en: 'Spend time outdoors' },
    why: { pt: 'Sair um pouco, no seu ritmo e se estiver bem para isso. Ficar na porta por 2 minutos já conta.', en: 'Stepping out a little, at your pace and if you feel up to it. Standing at the door for 2 minutes already counts.' },
    levels: lv('Ficar na porta ou na varanda por 2 min', 'Stand at the door or balcony for 2 min', 'Ficar 5 min ao ar livre', 'Spend 5 min outdoors', 'Ficar 15 min ao ar livre, na rua ou no parque', 'Spend 15 min outdoors, on the street or in a park', x2, x2, x3),
    anchorSuggestion: { pt: 'depois do almoço', en: 'after lunch' },
    contraindications: ['dor ou doença que limite sair: combine com um profissional de saúde'],
    addresses: ['comecar', 'energia'], leverages: [], evidence: { level: 'C', refs: [], note: NOTE },
  },
  {
    id: 'ressurg-banho', pathOnly: 'ressurgimento', kind: 'especifica', area: 'corpo', category: 'corpo', emoji: '🚿',
    name: { pt: 'Tomar banho ou lavar o rosto', en: 'Shower or wash your face' },
    why: { pt: 'Um cuidado básico do dia a dia. Se hoje foi só o rosto, valeu.', en: 'A basic day-to-day care. If today it was just your face, that counts.' },
    levels: lv('Lavar o rosto e as mãos', 'Wash your face and hands', 'Tomar um banho rápido', 'Take a quick shower', 'Banho com calma, do seu jeito', 'A relaxed shower, your way', x3, x3, daily),
    anchorSuggestion: { pt: 'antes de trocar de roupa', en: 'before changing clothes' },
    addresses: ['comecar'], leverages: [], evidence: { level: 'C', refs: [], note: NOTE },
  },
  {
    id: 'ressurg-dentes', pathOnly: 'ressurgimento', kind: 'especifica', area: 'corpo', category: 'corpo', emoji: '🦷',
    name: { pt: 'Escovar os dentes', en: 'Brush your teeth' },
    why: { pt: 'Um gesto curto, de 30 segundos, que já é um cuidado.', en: 'A short, 30-second gesture that is already a form of care.' },
    levels: lv('Escovar uma vez, por 30 segundos', 'Brush once, for 30 seconds', 'Escovar de manhã', 'Brush in the morning', 'Escovar de manhã e à noite', 'Brush morning and night', daily),
    anchorSuggestion: { pt: 'depois de tomar o café', en: 'after breakfast' },
    addresses: ['comecar', 'esquecer'], leverages: [], evidence: { level: 'C', refs: [], note: NOTE },
  },
  {
    id: 'ressurg-trocar-roupa', pathOnly: 'ressurgimento', kind: 'especifica', area: 'corpo', category: 'corpo', emoji: '👕',
    name: { pt: 'Vestir algo limpo', en: 'Put on something clean' },
    why: { pt: 'Trocar uma peça ajuda a separar o dia da noite.', en: 'Changing one piece helps tell day from night.' },
    levels: lv('Trocar só uma peça de roupa', 'Change just one piece of clothing', 'Vestir uma roupa limpa', 'Put on a clean outfit', 'Vestir uma roupa de que você goste', 'Put on an outfit you like', daily),
    anchorSuggestion: { pt: 'depois do banho ou de lavar o rosto', en: 'after the shower or washing your face' },
    addresses: ['comecar'], leverages: [], evidence: { level: 'C', refs: [], note: NOTE },
  },
  {
    id: 'ressurg-aparencia', pathOnly: 'ressurgimento', kind: 'especifica', area: 'corpo', category: 'corpo', emoji: '💇',
    name: { pt: 'Cuidar do cabelo, unha ou barba', en: 'Look after hair, nails or beard' },
    why: { pt: 'Um cuidado só seu, sem relação com estética de ninguém.', en: 'A care that is only yours, with no link to anyone else\'s idea of looks.' },
    levels: lv('Pentear o cabelo', 'Comb your hair', 'Cuidar de uma coisa: unha, cabelo ou barba', 'Look after one thing: nails, hair or beard', 'Um momento de cuidado na semana', 'One moment of care in the week', x1),
    anchorSuggestion: { pt: 'num dia mais calmo da semana', en: 'on a calmer day of the week' },
    addresses: ['comecar'], leverages: [], evidence: { level: 'C', refs: [], note: NOTE },
  },
  {
    id: 'ressurg-cama', pathOnly: 'ressurgimento', kind: 'especifica', area: 'casa', category: 'casa', emoji: '🛏️',
    name: { pt: 'Arrumar a cama', en: 'Make the bed' },
    why: { pt: 'Uma pequena vitória logo cedo: puxar o lençol já conta.', en: 'A small win early on: pulling the sheet up already counts.' },
    levels: lv('Puxar o lençol', 'Pull the sheet up', 'Esticar o lençol e a coberta', 'Smooth the sheet and the blanket', 'Arrumar a cama inteira', 'Make the whole bed', daily),
    anchorSuggestion: { pt: 'logo depois de levantar', en: 'right after getting up' },
    addresses: ['comecar'], leverages: [], evidence: { level: 'C', refs: [], note: NOTE },
  },
  {
    id: 'ressurg-lixo', pathOnly: 'ressurgimento', kind: 'especifica', area: 'casa', category: 'casa', emoji: '🗑️',
    name: { pt: 'Tirar o lixo', en: 'Take out the trash' },
    why: { pt: 'Um espaço um pouco mais livre ajuda no dia. Um saquinho já conta.', en: 'A slightly clearer space helps the day. One small bag counts.' },
    levels: lv('Juntar um saquinho', 'Gather one small bag', 'Levar o lixo para fora', 'Take the trash outside', 'Tirar o lixo e trocar o saco', 'Take the trash out and change the bag', x2),
    anchorSuggestion: { pt: 'ao sair de casa', en: 'when leaving the house' },
    addresses: ['comecar'], leverages: [], evidence: { level: 'C', refs: [], note: NOTE },
  },
  {
    id: 'ressurg-rede-apoio', pathOnly: 'ressurgimento', kind: 'especifica', area: 'relacoes', category: 'relacoes', emoji: '💬',
    name: { pt: 'Contar a alguém como foi o dia', en: 'Tell someone how the day went' },
    why: { pt: 'Se fizer sentido para você: um "hoje foi pesado" ou só um "oi" para alguém de confiança. Você não precisa explicar tudo.', en: 'If it makes sense for you: a "today was heavy" or just a "hi" to someone you trust. You do not need to explain everything.' },
    levels: lv('Mandar um "oi" ou um emoji', 'Send a "hi" or an emoji', 'Contar em uma frase como foi o dia', 'Say in one sentence how the day went', 'Conversar um pouco com alguém de confiança', 'Chat a little with someone you trust', x1),
    anchorSuggestion: { pt: 'no fim do dia, com o celular na mão', en: 'at the end of the day, phone in hand' },
    addresses: ['comecar'], leverages: ['sociabilidade'], evidence: { level: 'C', refs: [], note: NOTE + ' Sempre opcional, nunca contada como falha se pulada.' },
  },
];
