import type { CSSProperties, ReactNode } from 'react';

/**
 * O NOME DE OUTRO JOGADOR, com o nome do CLÃ embaixo (13/11/2026, pedido do dono, REGISTRO §321).
 *
 * Dono único dessa dupla em toda tela que mostra outra pessoa (ranking, Torneio, Treino, Drive/Amigos, perfil, Roda do clã,
 * busca de jogadores). O nome continua com o estilo de quem chama (`nameStyle`); o clã vem SEMPRE embaixo, numa linha própria,
 * menor e calma: `--sm2-text-xs` (12, o piso do app), peso 400, tinta `--sm2-muted` — os tokens de texto, nunca número.
 * Sem clã (`guildName` ausente/vazio) não desenha nada: nem linha vazia, nem traço, nem "sem clã".
 *
 * As duas linhas cortam com reticências no próprio espaço (a linha da lista não cresce na horizontal). Para o leitor de tela
 * o clã é lido como "clã <nome>", e não solto depois do nome.
 */
export function PlayerName({ name, guildName, suffix, nameStyle, guildStyle, align = 'start', isPt = true, className }: {
  name: ReactNode;
  /** Nome do clã (do servidor). Ausente/vazio = sem clã = nada. */
  guildName?: string | null;
  /** Colado ao nome, na MESMA linha (ex.: " (você)"). */
  suffix?: ReactNode;
  /** Estilo da linha do NOME (peso, cor, tamanho) — a linha do clã não herda peso nem cor. */
  nameStyle?: CSSProperties;
  guildStyle?: CSSProperties;
  /** `center` no pódio. */
  align?: 'start' | 'center';
  isPt?: boolean;
  className?: string;
}) {
  const guilda = typeof guildName === 'string' ? guildName.trim() : '';
  const corte: CSSProperties = { display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  return (
    <span
      data-player-name
      className={className}
      style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', alignItems: align === 'center' ? 'center' : 'flex-start' }}
    >
      <span data-player-name-text style={{ ...corte, ...nameStyle }}>{name}{suffix}</span>
      {guilda && (
        <span
          data-player-guild
          style={{
            ...corte,
            fontFamily: 'var(--sm2-font-text)',
            fontSize: 'var(--sm2-text-xs)',
            fontWeight: 400,
            lineHeight: 'var(--sm2-leading-body)',
            color: 'var(--sm2-muted)',
            ...guildStyle,
          }}
        >
          <span className="sm2-sr-only">{isPt ? 'Clã ' : 'Clan '}</span>
          {guilda}
        </span>
      )}
    </span>
  );
}
