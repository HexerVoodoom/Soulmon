import { EstagioIcone } from './EstagioIcone';
import { STAGE_NAMES } from '../../utils/oracle/base';
import type { StageId } from '../../utils/oracle';

const ID_DO_NIVEL: Record<string, StageId> = { rookie: 'rookie', champion: 'champion', ultimate: 'perfeito', mega: 'mega', ultra: 'ultra' };

/** Nome do estágio ao usuário (Desperto/Ascendente/Transcendente/Apoteose/Zênite) a partir de um id de forma (`ultimate-power`) ou nível; `undefined` se desconhecido. */
export function nomeDoEstagio(forma: string | null | undefined, isPt: boolean): string | undefined {
  const nivel = typeof forma === 'string' ? forma.split('-')[0] : '';
  const id = ID_DO_NIVEL[nivel];
  return id ? STAGE_NAMES[id][isPt ? 'pt' : 'en'] : undefined;
}

/** O estágio do oponente como ÍCONE (no lugar do texto). Acessível: `role="img"` com `aria-label` = nome do estágio, `title` = tooltip curto. Estágio sem ícone (bebê/desconhecido): nada. */
export function EstagioMarca({ forma, isPt, size = 16 }: { forma: string | null | undefined; isPt: boolean; size?: number }) {
  const nome = nomeDoEstagio(forma, isPt);
  if (!nome) return null;
  return (
    <span role="img" aria-label={nome} title={nome} data-estagio-marca={forma} style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 4 }}>
      <EstagioIcone forma={forma} size={size} />
    </span>
  );
}
