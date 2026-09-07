/**
 * BIBLIOTECA — quem mais está cuidando de um Soulmon.
 *
 * REVAMP: saiu do fliperama (kit `sm-px-*`), saiu do `lucide-react` e saíram os
 * PNGs de ícone. Superfície limpa sobre `--sm2-*`, glifos pela `<Icon>`.
 *
 * Uma ação dominante por linha: TOCAR NO JOGADOR abre o perfil. Presentear e
 * adicionar/remover amigo continuam existindo, mas como botões com rótulo de
 * verdade (`aria-label` PT+EN) e 44px de alvo, e não como dois quadradinhos
 * disputando a mesma linha.
 *
 * Os quatro estados existem, e é de propósito: **carregando · vazio · erro ·
 * sem rede**. A versão anterior tratava falha de rede como "nenhum jogador
 * encontrado" (`.catch(() => setPlayers([]))`), que é a pior mentira possível
 * numa tela social — a pessoa concluía que o app não tem ninguém.
 */
import { useEffect, useState } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { isSafeSpriteSrc } from '../utils/spriteLibrary';
import { listPlayers, getPlayer, addFriend, removeFriend, sendGift, type DirectoryPlayer } from '../utils/community';
import { LIBRARY_NPCS } from '../utils/libraryNpcs';
import { PlayerDetailModal } from './PlayerDetailModal';
import { Icon } from './ui/Icon';
import { Field, sm2Button, sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import type { Language } from '../utils/i18n';

interface LibraryPageProps {
  saveId: string;
  friends: string[];
  canGiftToday: boolean; // energia cheia
  onFriendsChange: (friends: string[]) => void;
  onGiftSent: (friendId: string) => void;
  /** WP4.7 — abriu a criatura de alguém. A missão é sobre VISITAR, então o
   *  gatilho é a abertura do detalhe, não a amizade nem o presente. */
  onVisitPlayer?: () => void;
  language: Language;
}

// Entrada unificada da lista — jogador real ou NPC de teste (ver
// utils/libraryNpcs.ts); isNpc/spriteUrl ficam undefined pros reais.
type LibraryEntry = DirectoryPlayer & { isNpc?: boolean; spriteUrl?: string; unresolved?: boolean };

const MAX_FRIENDS = 5;

/**
 * Linha de amigo que NAO resolveu (rede caiu, 502, perfil apagado no servidor).
 *
 * Ela existe de proposito: o vinculo esta na lista `friends` e o contador
 * `Amigos N/5` o conta, entao sumir com a linha faria o contador mentir — que e
 * exatamente o sintoma da regressao que este arquivo conserta. A linha fica,
 * degradada, e as duas acoes que NAO dependem do perfil continuam de pe:
 * presentear e remover, que o servidor resolve pelo pid.
 */
const amigoNaoResolvido = (id: string, isPt: boolean): LibraryEntry => ({
  id,
  name: isPt ? 'Amigo (nao carregou)' : "Friend (didn't load)",
  petName: '', stage: 'rookie', unlockedStages: [],
  pvpEnabled: false, daysPlaying: 0,
  unresolved: true,
});

const rowStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 12,
  textAlign: 'left',
  cursor: 'pointer',
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: SM2_SHADOW_CARD,
};

/** Botão de ação da linha: ícone pelado dentro de um alvo de 44px. */
function RowAction({
  icon, label, onClick, disabled, busy, tone = 'ink',
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  tone?: 'ink' | 'primary';
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled || busy}
      aria-label={label}
      title={label}
      style={{
        width: 44, height: 44, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', borderRadius: 10,
        cursor: disabled || busy ? 'not-allowed' : 'pointer',
        opacity: disabled ? .4 : 1,
      }}
    >
      <Icon
        name={busy ? 'sync' : icon}
        size={24}
        tone={disabled ? 'muted' : tone}
        className={busy ? 'animate-spin' : undefined}
      />
    </button>
  );
}

export function LibraryPage({ saveId, friends, canGiftToday, onFriendsChange, onGiftSent, onVisitPlayer, language }: LibraryPageProps) {
  const isPt = language === 'pt-BR';
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<DirectoryPlayer[] | null>(null);
  /** Erro de CARGA (rede/servidor). Separado de "lista vazia", de propósito. */
  const [loadError, setLoadError] = useState(false);
  /** Erro de AÇÃO (amizade/presente). Era `alert()` — um diálogo do sistema
   *  em cima de um app de bichinho, e sem par PT/EN garantido. */
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<'directory' | 'friends'>('directory');
  const [giftedToday, setGiftedToday] = useState<Set<string>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<LibraryEntry | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** Amigos resolvidos por pid. `null` = ainda carregando (nao "sem amigos"). */
  const [friendPlayers, setFriendPlayers] = useState<LibraryEntry[] | null>(null);

  useEffect(() => {
    let vivo = true;
    setPlayers(null);
    setLoadError(false);
    const t = setTimeout(() => {
      listPlayers(search)
        .then(r => { if (vivo) setPlayers(r.players ?? []); })
        .catch(() => { if (vivo) { setPlayers([]); setLoadError(true); } });
    }, 300);
    return () => { vivo = false; clearTimeout(t); };
  }, [search, reloadKey]);

  /**
   * A ABA AMIGOS RESOLVE POR `action=player`, E NAO PELO DIRETORIO.
   *
   * Antes daqui a lista era `players.filter(p => friends.includes(p.id))` —
   * derivada de `action=players`. Desde `f1ce3848` (N-4) o diretorio publico so
   * devolve quem ligou o `pvpEnabled`, entao um amigo JA ADICIONADO que nao
   * consentiu sumia da aba: o vinculo continuava no servidor, so a renderizacao
   * o perdia, e com ele o botao de presente.
   *
   * Amizade e consentimento PROPRIO — quem me adicionou aceitou me mostrar A
   * ELE. Sair do diretorio publico nao e sair da lista de amigos de quem ja me
   * tem. Por isso o conserto e resolver por pid (`action=player` nao tem gate de
   * `pvpEnabled`) em vez de afrouxar o filtro do diretorio.
   *
   * N CHAMADAS: `Promise.allSettled` dispara as (no maximo 5) de uma vez e
   * espera UMA rodada — nao 5 idas e voltas em serie travando a aba. E
   * `allSettled` (nao `all`) porque uma falha isolada nao pode derrubar as
   * outras quatro: cada indice e tratado sozinho, e o que falhou vira linha
   * degradada em vez de desaparecer.
   */
  const friendsKey = friends.join(',');
  useEffect(() => {
    let vivo = true;
    const ids = friendsKey ? friendsKey.split(',') : [];
    if (ids.length === 0) { setFriendPlayers([]); return; }
    setFriendPlayers(null);
    Promise.allSettled(ids.map(id => getPlayer(id))).then(rs => {
      if (!vivo) return;
      setFriendPlayers(rs.map((r, i) => (
        r.status === 'fulfilled' && r.value.found && r.value.player
          ? (r.value.player as LibraryEntry)
          : amigoNaoResolvido(ids[i], isPt)
      )));
    });
    return () => { vivo = false; };
  }, [friendsKey, reloadKey, isPt]);

  const toggleFriend = async (p: DirectoryPlayer) => {
    setBusyId(p.id);
    setActionError(null);
    try {
      const isFriend = friends.includes(p.id);
      const r = isFriend ? await removeFriend(saveId, p.id) : await addFriend(saveId, p.id);
      onFriendsChange(r.friends);
    } catch {
      setActionError(isPt ? 'Não deu para mudar a amizade agora. Tente de novo.' : "Couldn't change that friendship right now. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const gift = async (friendId: string) => {
    setBusyId(friendId);
    setActionError(null);
    try {
      await sendGift(saveId, friendId);
      setGiftedToday(prev => new Set(prev).add(friendId));
      onGiftSent(friendId);
    } catch {
      setActionError(isPt ? 'O presente não chegou. Tente de novo daqui a pouco.' : "The gift didn't go through. Try again in a bit.");
    } finally {
      setBusyId(null);
    }
  };

  const searchLower = search.toLowerCase();
  const npcMatches: LibraryEntry[] = LIBRARY_NPCS.filter(p => !searchLower || p.name.toLowerCase().includes(searchLower) || p.petName.toLowerCase().includes(searchLower));
  const directoryList: LibraryEntry[] | null = players === null ? null : [...(players ?? []), ...npcMatches];
  const list = tab === 'friends' ? friendPlayers : directoryList;
  /** Carregando e por ABA: cada uma tem a sua fonte e o seu `null`. */
  const carregando = list === null;

  const TABS = [
    { key: 'directory' as const, icon: 'person', label: isPt ? 'Todos' : 'All' },
    { key: 'friends' as const, icon: 'volunteer_activism', label: isPt ? `Amigos ${friends.length}/${MAX_FRIENDS}` : `Friends ${friends.length}/${MAX_FRIENDS}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
      <div>
        <h1
          style={{
            fontFamily: 'var(--sm2-font-display)',
            fontSize: 'var(--sm2-text-xl)',
            fontWeight: 600,
            lineHeight: 'var(--sm2-leading-title)',
            color: 'var(--sm2-ink)',
            margin: 0,
          }}
        >
          {isPt ? 'Biblioteca' : 'Library'}
        </h1>
        <p style={{ ...sm2Hint, marginTop: 4 }}>
          {isPt ? 'Veja outros jogadores e seus Soulmon.' : 'See other players and their Soulmon.'}
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
          <Icon name="search" size={20} tone="muted" />
        </span>
        <Field
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isPt ? 'Buscar por nome…' : 'Search by name…'}
          aria-label={isPt ? 'Buscar jogador por nome' : 'Search player by name'}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* As duas abas: a selecionada é a ÚNICA preenchida. */}
      <div role="tablist" aria-label={isPt ? 'Filtro de jogadores' : 'Player filter'} style={{ display: 'flex', gap: 8 }}>
        {TABS.map(item => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              style={{ ...sm2Button(active ? 'primary' : 'ghost'), flex: 1 }}
            >
              <Icon name={item.icon} size={20} fill={active ? 1 : 0} />
              {item.label}
            </button>
          );
        })}
      </div>

      {actionError && (
        <p role="alert" style={{ ...sm2Text, color: 'var(--sm2-danger-ink)' }}>{actionError}</p>
      )}

      {/* ── Carregando ── */}
      {carregando && (
        <p style={{ ...sm2Hint, display: 'flex', alignItems: 'center', gap: 8, padding: '24px 0', justifyContent: 'center' }}>
          <Icon name="sync" size={24} tone="primary" className="animate-spin" />
          {isPt ? 'Procurando jogadores…' : 'Looking for players…'}
        </p>
      )}

      {/* ── Erro / sem rede: nunca confundido com "não há ninguém" ── */}
      {/* O erro de carga e do DIRETORIO; na aba Amigos a falha e por linha. */}
      {loadError && tab === 'directory' && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Icon name="cloud_off" size={48} tone="muted" />
          <p style={{ ...sm2Text, marginTop: 8 }}>
            {isPt ? 'Não deu para falar com o servidor.' : "Couldn't reach the server."}
          </p>
          <p style={{ ...sm2Hint, marginTop: 4 }}>
            {isPt ? 'Pode ser a sua conexão. Os personagens de demonstração continuam aqui.' : 'It may be your connection. The demo characters are still here.'}
          </p>
          <button type="button" onClick={() => setReloadKey(k => k + 1)} style={{ ...sm2Button('ghost'), marginTop: 12 }}>
            <Icon name="refresh" size={20} />
            {isPt ? 'Tentar de novo' : 'Try again'}
          </button>
        </div>
      )}

      {/* ── Vazio ── */}
      {list && list.length === 0 && !(loadError && tab === 'directory') && (
        <p style={{ ...sm2Hint, textAlign: 'center', padding: '24px 0' }}>
          {tab === 'friends'
            ? (isPt ? 'Você ainda não tem amigos. Toque em alguém na aba Todos.' : 'You have no friends yet. Tap someone in the All tab.')
            : (isPt ? 'Nenhum jogador com esse nome.' : 'No player by that name.')}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list?.map(p => {
          const isNpc = !!p.isNpc;
          const isFriend = friends.includes(p.id);
          const gifted = giftedToday.has(p.id);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* A linha inteira é UM botão: abrir o perfil é a ação dominante,
                  e um `<div onClick>` não é alcançável pelo teclado. */}
              <button
                type="button"
                onClick={() => { setSelectedPlayer(p); onVisitPlayer?.(); }}
                aria-label={isPt ? `Ver o perfil de ${p.name}` : `View ${p.name}'s profile`}
                style={rowStyle}
              >
                <img
                  src={isSafeSpriteSrc(p.spriteUrl) ? p.spriteUrl : getSpriteForStage(p.stage)}
                  alt=""
                  style={{ width: 44, height: 44, flexShrink: 0, objectFit: 'contain', imageRendering: 'pixelated' }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{ ...sm2Text, fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {p.name}
                    {isNpc && (
                      <span style={{ ...sm2Hint, marginLeft: 6 }}>{isPt ? '· demonstração' : '· demo'}</span>
                    )}
                  </span>
                  <span className="sm2-num" style={{ ...sm2Hint, display: 'block' }}>
                    {p.unresolved
                      ? (isPt ? 'Nao deu para carregar o perfil agora.' : "Couldn't load this profile right now.")
                      // WP4.11 / proibição #21: o `rank` saiu. Número que sobe
                      // e desce conforme o outro joga é métrica de desempenho
                      // alheio, e um diretório de amigos é o pior lugar para ela.
                      : isPt
                        ? `${p.daysPlaying} dias jogando`
                        : `${p.daysPlaying} days playing`}
                  </span>
                </span>
              </button>

              {!isNpc && isFriend && (
                <RowAction
                  /* `paid` (moeda) e não `redeem`/`card_giftcard`: o presente
                     são 20 Bits, e só `paid` existe no inventário de 102 nomes
                     da fonte subsetada — nome fora dele renderiza VAZIO. */
                  icon="paid"
                  tone="primary"
                  busy={busyId === p.id}
                  disabled={!canGiftToday || gifted}
                  label={!canGiftToday
                    ? (isPt ? 'Precisa de energia cheia para presentear' : 'Needs full energy to gift')
                    : gifted
                      ? (isPt ? 'Já presenteado hoje' : 'Already gifted today')
                      : (isPt ? `Enviar 20 Bits para ${p.name}` : `Send 20 Bits to ${p.name}`)}
                  onClick={() => gift(p.id)}
                />
              )}
              {!isNpc && (
                <RowAction
                  icon={isFriend ? 'do_not_disturb_on' : 'add'}
                  busy={busyId === p.id}
                  disabled={!isFriend && friends.length >= MAX_FRIENDS}
                  label={isFriend
                    ? (isPt ? `Remover ${p.name} dos amigos` : `Remove ${p.name} from friends`)
                    : friends.length >= MAX_FRIENDS
                      ? (isPt ? `Limite de ${MAX_FRIENDS} amigos` : `Limit of ${MAX_FRIENDS} friends`)
                      : (isPt ? `Adicionar ${p.name} como amigo` : `Add ${p.name} as a friend`)}
                  onClick={() => toggleFriend(p)}
                />
              )}
            </div>
          );
        })}
      </div>

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          language={language}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
