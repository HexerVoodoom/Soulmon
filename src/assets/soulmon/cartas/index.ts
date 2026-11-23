/**
 * Imagem da carta global do widget (§288): o casco do widget com um cenário na abertura do LCD, sem Soulmon (576x384). Já instalada:
 * `tutorial-2-widget.(webp|png)`. Não há mais print obrigatório; sem o arquivo a carta mostra só o texto.
 */
const arquivos = import.meta.glob('./tutorial-2-widget.{png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const TUTORIAL_WIDGET_ART: string | undefined = Object.values(arquivos)[0];
