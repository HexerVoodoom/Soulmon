import { useEffect, useState } from 'react';
import { Swords, Trophy, Loader2 } from 'lucide-react';
import { getSpriteForStage } from '../utils/sprites';
import { getStageLevel } from '../types/progression';
import { getOpponents, playMatch, getRank, type Opponent, type MatchResult, type RankRow } from '../utils/community';
import tournamentBg from '../assets/soulmon/bg/tournament.png';

interface TournamentPageProps {
  saveId: string;
  petStage: string;
  pvpEnabled: boolean;
  onTogglePvp: (enabled: boolean) => void;
  trophies: Array<{ season: string; place: 1 | 2 | 3 }>;
  language: string;
}

const PLACE_COLOR: Record<1 | 2 | 3, string> = { 1: '#e8c96a', 2: '#c7cad4', 3: '#c98a52' };

export function TournamentPage({ saveId, petStage, pvpEnabled, onTogglePvp, trophies, language }: TournamentPageProps) {
  const isPt = language === 'pt-BR';
  const [opponents, setOpponents] = useState<Opponent[] | null>(null);
  const [matchesLeft, setMatchesLeft] = useState(5);
  const [rank, setRank] = useState<RankRow[] | null>(null);
  const [fighting, setFighting] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [tab, setTab] = useState<'arena' | 'rank'>('arena');

  const loadOpponents = () => {
    if (!pvpEnabled) return;
    getOpponents(saveId).then(r => { setOpponents(r.opponents); setMatchesLeft(r.matchesLeft); }).catch(() => setOpponents([]));
  };

  useEffect(() => { loadOpponents(); }, [pvpEnabled, saveId]);
  useEffect(() => {
    if (tab === 'rank' && !rank) getRank().then(r => setRank(r.rank)).catch(() => setRank([]));
  }, [tab, rank]);

  const fight = async (opp: Opponent) => {
    setFighting(opp.id);
    try {
      const r = await playMatch(saveId, opp.id);
      setResult(r);
      setMatchesLeft(r.matchesLeft);
    } catch (err) {
      setResult(null);
      alert(err instanceof Error ? err.message : 'error');
    } finally {
      setFighting(null);
    }
  };

  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', minHeight: 420 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${tournamentBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '20px 16px 24px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Swords size={22} strokeWidth={2.2} />
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{isPt ? 'Torneio' : 'Tournament'}</h1>
        </div>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', margin: '0 0 16px' }}>
          {isPt ? 'PvP assíncrono — desafie os pets de outros jogadores.' : 'Asynchronous PvP — challenge other players\' pets.'}
        </p>

        {/* Troféus */}
        {trophies.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {trophies.map((t, i) => (
              <div key={i} title={`${t.season} — ${isPt ? 'lugar' : 'place'} ${t.place}`}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '4px 8px' }}>
                <Trophy size={14} color={PLACE_COLOR[t.place]} />
                <span style={{ fontSize: 11, fontWeight: 700 }}>{t.season}</span>
              </div>
            ))}
          </div>
        )}

        {/* Opt-in */}
        <div className="sm-card" style={{ background: 'rgba(20,15,40,0.72)', border: '1px solid rgba(255,255,255,0.15)', padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5 }}>{isPt ? 'Participar do PvP' : 'Join PvP'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>
              {isPt ? 'Seu pet fica disponível como oponente de outros jogadores.' : 'Your pet becomes available as an opponent for other players.'}
            </p>
          </div>
          <button
            onClick={() => onTogglePvp(!pvpEnabled)}
            role="switch" aria-checked={pvpEnabled}
            style={{
              width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: pvpEnabled ? 'var(--sm-gold)' : 'rgba(255,255,255,0.25)', position: 'relative', transition: 'background .15s',
            }}>
            <span style={{ position: 'absolute', top: 3, left: pvpEnabled ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button className="sm-btn" style={{ flex: 1, padding: '9px 0', background: tab === 'arena' ? undefined : 'rgba(255,255,255,0.12)', boxShadow: tab === 'arena' ? undefined : 'none' }} onClick={() => setTab('arena')}>
            {isPt ? 'Arena' : 'Arena'}
          </button>
          <button className="sm-btn" style={{ flex: 1, padding: '9px 0', background: tab === 'rank' ? undefined : 'rgba(255,255,255,0.12)', boxShadow: tab === 'rank' ? undefined : 'none' }} onClick={() => setTab('rank')}>
            {isPt ? 'Rank' : 'Rank'}
          </button>
        </div>

        {tab === 'arena' && !pvpEnabled && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '30px 0' }}>
            {isPt ? 'Ative o PvP acima para desafiar oponentes.' : 'Enable PvP above to challenge opponents.'}
          </p>
        )}

        {tab === 'arena' && pvpEnabled && (
          <>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
              {isPt ? `${matchesLeft} partida(s) restante(s) hoje` : `${matchesLeft} match(es) left today`}
            </p>
            {opponents === null && <Loader2 className="animate-spin" size={24} style={{ margin: '20px auto', display: 'block' }} />}
            {opponents?.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '20px 0' }}>
                {isPt ? 'Nenhum oponente disponível agora.' : 'No opponents available right now.'}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {opponents?.map(o => (
                <div key={o.id} className="sm-card" style={{ background: 'rgba(20,15,40,0.72)', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={getSpriteForStage(o.stage)} alt="" style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{o.petName || o.stage} · {getStageLevel(o.stage)}</p>
                  </div>
                  <button className="sm-btn sm-btn-gold" style={{ padding: '8px 14px', fontSize: 12 }} disabled={matchesLeft <= 0 || fighting === o.id} onClick={() => fight(o)}>
                    {fighting === o.id ? <Loader2 className="animate-spin" size={16} /> : (isPt ? 'Desafiar' : 'Fight')}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'rank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rank === null && <Loader2 className="animate-spin" size={24} style={{ margin: '20px auto', display: 'block' }} />}
            {rank?.map((r, i) => (
              <div key={r.id} className="sm-card" style={{ background: 'rgba(20,15,40,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 22, textAlign: 'center', fontWeight: 800, color: i < 3 ? PLACE_COLOR[(i + 1) as 1 | 2 | 3] : 'rgba(255,255,255,0.5)' }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{r.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {result && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(8,5,20,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="sm-card" style={{ maxWidth: 340, width: '100%', padding: 24, textAlign: 'center', background: '#fff' }}>
            <p style={{ fontSize: 13, color: 'var(--sm-muted)', fontWeight: 700, letterSpacing: 1, margin: 0 }}>
              {result.won ? (isPt ? 'VITÓRIA' : 'VICTORY') : (isPt ? 'DERROTA' : 'DEFEAT')}
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 14px', color: result.won ? '#3fae5a' : '#d9534f' }}>
              {result.myScore} × {result.oppScore}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--sm-ink)', margin: '0 0 18px' }}>
              {isPt ? `Contra ${result.opponent.name}` : `Against ${result.opponent.name}`} · {result.points} pts
            </p>
            <button className="sm-btn" style={{ width: '100%' }} onClick={() => { setResult(null); loadOpponents(); }}>
              {isPt ? 'Continuar' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
