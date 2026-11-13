/**
 * BUSCA DE JOGADORES ENQUANTO DIGITA (13/11/2026, pedido do dono, REGISTRO §321).
 *
 * UM componente para os dois convites: o do clã (`guild/GuildInviteSheet`) e o "Convidar" da aba Amigos (`LibraryPage`).
 * Quem chama decide só a AÇÃO de um toque de cada linha (`renderAction`); campo, pausa de 200 ms, estados e linhas são daqui.
 *
 * Linha = miniatura do Soulmon (o sprite próprio, se houver; senão a linha de arte no estágio, `opponentSprite`) + nome com o
 * clã embaixo (`ui/PlayerName`) + o botão. A miniatura é enfeite (`alt=""`): o nome já diz quem é.
 *
 * Estados, todos com frase (nada de lista que some em silêncio):
 *  - menos de 2 letras → a dica do mínimo (e NENHUMA chamada);
 *  - buscando → "Procurando…" (`aria-busy`); a lista do termo anterior SAI, para ninguém convidar por engano alguém de um
 *    termo que já não é o digitado;
 *  - vazio → "Ninguém com um nome que comece assim.";
 *  - erro → por tipo (sem rede / muitas buscas / sem conta / servidor), com "Tentar de novo" onde faz sentido.
 * O status mora numa região `aria-live="polite"`: o leitor de tela ouve "3 pessoas encontradas" sem perder o foco do campo.
 */
import { useId, useState, type ReactNode } from 'react';
import { usePlayerSearch, type PlayerSearchState } from '../hooks/usePlayerSearch';
import { PLAYER_SEARCH_MIN, type PlayerSearchErrorKind, type PlayerSearchHit, searchPlayers } from '../utils/playerSearch';
import { opponentIcon, opponentSprite } from '../utils/opponentArt';
import { Field, sm2Button } from './form/FormKit';
import { Icon } from './ui/Icon';
import { MiniGlass } from './ui/MiniGlass';
import { PlayerName } from './ui/PlayerName';
import type { Language } from '../utils/i18n';

const ERRO: Record<PlayerSearchErrorKind, { pt: string; en: string; retry: boolean }> = {
  offline: { pt: 'Sem conexão. Confira a internet e tente de novo.', en: 'No connection. Check your internet and try again.', retry: true },
  rate: { pt: 'Muitas buscas seguidas. Espere um minutinho.', en: 'Too many searches in a row. Wait a minute.', retry: false },
  login: { pt: 'Entre na sua conta para procurar pessoas.', en: 'Sign in to search for people.', retry: false },
  server: { pt: 'A busca não respondeu agora.', en: "The search didn't respond right now.", retry: true },
};

export function PlayerSearch({ saveId, language, label, placeholder, renderAction, hide, search = searchPlayers, autoFocus = false }: {
  saveId: string;
  language: Language;
  /** Rótulo acessível do campo. */
  label: string;
  placeholder?: string;
  /** O botão de UM toque da linha (convidar para o clã, convidar para amizade…). */
  renderAction: (hit: PlayerSearchHit) => ReactNode;
  /** Linhas que não devem aparecer (ex.: quem já é amigo). */
  hide?: (hit: PlayerSearchHit) => boolean;
  /** Injetável só em teste/prévia. */
  search?: typeof searchPlayers;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState('');
  const { state, retry } = usePlayerSearch(saveId, q, { search });
  const statusId = useId();
  return (
    <div data-player-search style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-2)' }}>
      <div style={{ position: 'relative' }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
          <Icon name="search" size={24} tone="muted" />
        </span>
        {/* `type="text"` + `role="searchbox"`: o `type="search"` desenha o "x" nativo do navegador (cor fora dos tokens). */}
        <Field
          type="text"
          role="searchbox"
          inputMode="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          aria-describedby={statusId}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          maxLength={40}
          autoFocus={autoFocus}
          data-player-search-input
          style={{ paddingLeft: 44 }}
        />
      </div>
      <PlayerSearchResults statusId={statusId} query={q} state={state} retry={retry} language={language} renderAction={renderAction} hide={hide} />
    </div>
  );
}

/**
 * O STATUS e as LINHAS da busca, sem o campo — para quem já tem o próprio campo (a aba Amigos, cujo "Convidar" pelo nome
 * completo continua valendo) e liga o `usePlayerSearch` nele. `quiet` = sem a dica de "digite o começo" com o campo vazio.
 */
export function PlayerSearchResults({ statusId, query, state, retry, language, renderAction, hide, quiet = false }: {
  statusId?: string;
  query: string;
  state: PlayerSearchState;
  retry: () => void;
  language: Language;
  renderAction: (hit: PlayerSearchHit) => ReactNode;
  hide?: (hit: PlayerSearchHit) => boolean;
  quiet?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const hits = state.status === 'ready' ? state.hits.filter(h => !hide?.(h)) : [];

  let status: ReactNode = null;
  if (state.status === 'short') {
    status = query.trim()
      ? (isPt ? `Digite pelo menos ${PLAYER_SEARCH_MIN} letras.` : `Type at least ${PLAYER_SEARCH_MIN} letters.`)
      : quiet ? null : (isPt ? 'Digite o começo do nome da pessoa.' : "Type the start of the person's name.");
  } else if (state.status === 'loading') {
    status = isPt ? 'Procurando…' : 'Searching…';
  } else if (state.status === 'error') {
    const e = ERRO[state.errorKind];
    status = (
      <>
        <span>{isPt ? e.pt : e.en}</span>
        {e.retry && (
          <button type="button" data-player-search-retry onClick={retry} style={{ ...sm2Button('outline', false, 'sm'), marginLeft: 8 }}>
            {isPt ? 'Tentar de novo' : 'Try again'}
          </button>
        )}
      </>
    );
  } else if (hits.length === 0) {
    status = isPt ? 'Ninguém com um nome que comece assim.' : 'No one with a name that starts like that.';
  } else {
    status = isPt
      ? `${hits.length} ${hits.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas'}`
      : `${hits.length} ${hits.length === 1 ? 'person found' : 'people found'}`;
  }

  return (
    <>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        aria-busy={state.status === 'loading' ? true : undefined}
        className="sm2-lib-s"
        data-player-search-status={state.status === 'ready' ? (hits.length ? 'ready' : 'empty') : state.status}
        style={{ margin: 0, display: status ? 'flex' : 'none', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}
      >
        {status}
      </p>
      {hits.length > 0 && (
        <ul data-player-search-results aria-label={isPt ? 'Sugestões' : 'Suggestions'} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-2)' }}>
          {hits.map(h => {
            const icon = opponentIcon(h, 64);
            return (
              <li key={h.id} data-player-search-hit={h.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sm2-space-2)', minHeight: 56 }}>
                <MiniGlass size={48}>
                  <img
                    src={icon ?? opponentSprite(h)}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                    style={{ display: 'block', width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                </MiniGlass>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <PlayerName name={h.name} guildName={h.guildName} isPt={isPt} nameStyle={{ color: 'var(--sm2-ink)', fontWeight: 500 }} />
                </span>
                <span style={{ flexShrink: 0 }}>{renderAction(h)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
