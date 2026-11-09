import { estagioIcone } from '../../assets/soulmon/icones-ui/estagio';

/** O ícone do estágio (rookie→ultra) em pixel art. Bebê/ovo e ids desconhecidos: não renderiza nada. Decorativo (`alt=""`): o nome do estágio já está no texto vizinho. */
export function EstagioIcone({ forma, size = 18, label, style }: { forma: string | null | undefined; size?: number; label?: string; style?: React.CSSProperties }) {
  const src = estagioIcone(forma);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      data-estagio-icone={forma}
      width={size}
      height={size}
      draggable={false}
      style={{ width: size, height: size, flex: 'none', imageRendering: 'pixelated', objectFit: 'contain', ...style }}
    />
  );
}
