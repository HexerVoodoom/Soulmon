import type { PurposePath } from './purpose';

/**
 * Os TEXTOS das 3 cartas (PT/EN). A carta só orienta a escolha das tarefas; o nome do caminho é escolha da pessoa e o app não
 * classifica ninguém (pesquisa do Ressurgimento §3, "chamar o caminho de 'para quem está mal'" é vetado).
 * `icon` é o nome do glifo Material do placeholder (TODO(arte): arquétipo de tarô).
 */
export const PATH_COPY: Record<PurposePath, { name: { pt: string; en: string }; text: { pt: string; en: string }; icon: string }> = {
  ambicao: {
    name: { pt: 'Ambição', en: 'Ambition' },
    text: { pt: 'Tenho um objetivo maior e uma meta clara.', en: 'I have a bigger goal and a clear target.' },
    icon: 'flag',
  },
  satisfacao: {
    name: { pt: 'Satisfação', en: 'Contentment' },
    text: { pt: 'Quero melhorar meus hábitos e minha rotina no geral.', en: 'I want to improve my habits and my routine in general.' },
    icon: 'spa',
  },
  ressurgimento: {
    name: { pt: 'Ressurgimento', en: 'Rising again' },
    text: { pt: 'Quero me reerguer.', en: 'I want to get back on my feet.' },
    icon: 'wb_sunny',
  },
};

export const PATH_TITLE = { pt: 'Em que momento você está?', en: 'Where are you right now?' };
export const PATH_HINT = {
  pt: 'A carta só ajuda a escolher suas primeiras tarefas. Você pode trocar quando quiser.',
  en: 'The card only helps pick your first tasks. You can change it any time.',
};
