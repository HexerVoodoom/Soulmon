/**
 * O ícone da caixa de cartas da Home (§246). Arte instalada em 09/11/2026 (`carta-correio.png`, 96x96 alfa real). O consumidor (`nav/MailLink`)
 * cai no glifo `chat_bubble` enquanto não houver arquivo. Para ligar, basta soltar `carta-correio.png` (ou `.webp`) nesta pasta, 96x96 como `quest.png`, alfa real.
 */
const arquivos = import.meta.glob('./carta-correio.{png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const CARTA_ART: string | undefined = Object.values(arquivos)[0];
