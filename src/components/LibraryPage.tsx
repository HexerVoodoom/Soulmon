import { useEffect, useState } from 'react';
import { Search, UserPlus, UserMinus, Gift, Loader2 } from 'lucide-react';
import { getSpriteForStage } from '../utils/sprites';
import { listPlayers, addFriend, removeFriend, sendGift, type DirectoryPlayer } from '../utils/community';
import { LIBRARY_NPCS } from '../utils/libraryNpcs';
import { PlayerDetailModal } from './PlayerDetailModal';
import type { Language } from '../utils/i18n';

interface LibraryPageProps {
  saveId: string;
  friends: string[];
  canGiftToday: boolean; // energia cheia
  onFriendsChange: (friends: string[]) => void;
  onGiftSent: (friendId: string) => void;
  language: Language;
}

// Entrada unificada da lista — jogador real ou NPC de teste (ver
// utils/libraryNpcs.ts); isNpc/spriteUrl ficam undefined pros reais.
type LibraryEntry = DirectoryPlayer & { isNpc?: boolean; spriteUrl?: string };

export function LibraryPage({ saveId, friends, canGiftToday, onFriendsChange, onGiftSent, language }: LibraryPageProps) {
  const isPt = language === 'pt-BR';
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<DirectoryPlayer[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<'directory' | 'friends'>('directory');
  const [giftedToday, setGiftedToday] = useState<Set<string>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<LibraryEntry | null>(null);

  const load = () => {
    setPlayers(null);
    listPlayers(search).then(r => setPlayers(r.players ?? [])).catch(() => setPlayers([]));
  };
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  const toggleFriend = async (p: DirectoryPlayer) => {
    setBusyId(p.id);
    try {
      const isFriend = friends.includes(p.id);
      const r = isFriend ? await removeFriend(saveId, p.id) : await addFriend(saveId, p.id);
      onFriendsChange(r.friends);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'error');
    } finally {
      setBusyId(null);
    }
  };

  const gift = async (friendId: string) => {
    setBusyId(friendId);
    try {
      await sendGift(saveId, friendId);
      setGiftedToday(prev => new Set(prev).add(friendId));
      onGiftSent(friendId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'error');
    } finally {
      setBusyId(null);
    }
  };

  const friendPlayers: LibraryEntry[] = (players ?? []).filter(p => friends.includes(p.id));
  const searchLower = search.toLowerCase();
  const npcMatches: LibraryEntry[] = LIBRARY_NPCS.filter(p => !searchLower || p.name.toLowerCase().includes(searchLower) || p.petName.toLowerCase().includes(searchLower));
  const directoryList: LibraryEntry[] | null = players === null ? null : [...(players ?? []), ...npcMatches];
  const list = tab === 'friends' ? friendPlayers : directoryList;

  return (
    <div style={{ padding: '4px 0 20px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>{isPt ? 'Biblioteca' : 'Library'}</h1>
      <p style={{ fontSize: 12.5, color: 'var(--sm-muted)', margin: '0 0 14px' }}>
        {isPt ? 'Veja outros jogadores e seus Soulmon.' : 'See other players and their Soulmon.'}
      </p>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--sm-muted)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={isPt ? 'Buscar por nome…' : 'Search by name…'}
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px', borderRadius: 14, border: '2px solid var(--sm-line)', fontSize: 14, outline: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className={`sm-btn ${tab === 'directory' ? '' : 'sm-btn-secondary'}`} style={{ flex: 1, padding: '9px 0' }} onClick={() => setTab('directory')}>
          {isPt ? 'Todos' : 'All'}
        </button>
        <button className={`sm-btn ${tab === 'friends' ? '' : 'sm-btn-secondary'}`} style={{ flex: 1, padding: '9px 0' }} onClick={() => setTab('friends')}>
          {isPt ? `Amigos (${friends.length}/5)` : `Friends (${friends.length}/5)`}
        </button>
      </div>

      {players === null && <Loader2 className="animate-spin" size={24} style={{ margin: '20px auto', display: 'block', color: 'var(--sm-primary)' }} />}
      {list && list.length === 0 && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--sm-muted)', padding: '24px 0' }}>
          {tab === 'friends' ? (isPt ? 'Você ainda não tem amigos.' : 'You have no friends yet.') : (isPt ? 'Nenhum jogador encontrado.' : 'No players found.')}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list?.map(p => {
          const isNpc = !!p.isNpc;
          const isFriend = friends.includes(p.id);
          const gifted = giftedToday.has(p.id);
          return (
            <div
              key={p.id} className="sm-card"
              style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => setSelectedPlayer(p)}
            >
              <img src={p.spriteUrl ?? getSpriteForStage(p.stage)} alt="" style={{ width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {p.name}
                  {isNpc && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--sm-muted)', background: 'var(--sm-bg)', borderRadius: 999, padding: '1px 6px', flexShrink: 0 }}>
                      NPC
                    </span>
                  )}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--sm-muted)' }}>
                  {isPt ? 'Rank' : 'Rank'} {p.rankPoints} · {isPt ? `${p.daysPlaying}d jogando` : `${p.daysPlaying}d playing`}
                </p>
              </div>
              {!isNpc && isFriend && (
                <button
                  className="sm-btn sm-btn-gold" style={{ padding: '8px 10px' }}
                  disabled={!canGiftToday || gifted || busyId === p.id}
                  title={!canGiftToday ? (isPt ? 'Precisa de energia cheia' : 'Needs full energy') : gifted ? (isPt ? 'Já presenteado hoje' : 'Already gifted today') : (isPt ? 'Enviar 20 Bits' : 'Send 20 Bits')}
                  onClick={e => { e.stopPropagation(); gift(p.id); }}
                >
                  {busyId === p.id ? <Loader2 className="animate-spin" size={16} /> : <Gift size={16} strokeWidth={2.2} />}
                </button>
              )}
              {!isNpc && (
                <button
                  className="sm-btn sm-btn-secondary" style={{ padding: '8px 10px' }}
                  disabled={busyId === p.id || (!isFriend && friends.length >= 5)}
                  title={isFriend ? (isPt ? 'Remover amigo' : 'Remove friend') : (isPt ? 'Adicionar amigo' : 'Add friend')}
                  onClick={e => { e.stopPropagation(); toggleFriend(p); }}
                >
                  {busyId === p.id ? <Loader2 className="animate-spin" size={16} /> : isFriend ? <UserMinus size={16} strokeWidth={2.2} /> : <UserPlus size={16} strokeWidth={2.2} />}
                </button>
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
