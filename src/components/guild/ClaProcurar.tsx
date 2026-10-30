/**
 * PROCURAR CLÃ (REGISTRO §203, pedido do dono de 30/10/2026).
 *
 * Duas peças pequenas, cada uma dona da própria carga (a folha só as monta):
 *  - `ProcurarCla`: quem NÃO tem clã vê os clãs com vaga (nome e "n de max") e pede para entrar.
 *    Um pedido por vez; o pendente mostra para quem foi e "Cancelar pedido" (à ESQUERDA).
 *    Aprovado, a pessoa já está no clã na próxima carga — e a folha relê ao voltar ao app.
 *  - `PedidosDeEntrada`: só o ANFITRIÃO vê; cada pedido tem Recusar (esquerda) e Aceitar (direita).
 *    Sem pedido = silêncio (nem título, L6).
 * Nada de saveId: o servidor só manda ids opacos (`dirId`, `requestId`).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getGuildDirectory, requestToJoinGuild, cancelGuildRequest, getGuildJoinRequests, decideGuildRequest,
  GuildError, type GuildDirectory, type GuildJoinRequest, type GuildView,
} from '../../utils/community';
import { GUILD_ERROR_KEY, type GuildKey } from '../../utils/guildCopy';
import type { PlayerDayAnchor } from '../../utils/playerDay';
import { Icon } from '../ui/Icon';

type T = (k: GuildKey, vars?: Record<string, string | number>) => string;
const btn = 'sm2-kit-btn sm2-kit-btn-md';
const kindDe = (e: unknown) => (e instanceof GuildError ? e.kind : 'server' as const);

export function ProcurarCla({ saveId, t, tz, onJoined }: {
  saveId: string; t: T; tz?: PlayerDayAnchor;
  /** O pedido foi aprovado entre uma carga e outra: a folha relê a vista. */
  onJoined?: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [dir, setDir] = useState<GuildDirectory | null>(null);
  const [aviso, setAviso] = useState<GuildKey | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const vivo = useRef(true);
  useEffect(() => () => { vivo.current = false; }, []);
  // Refs: callback/fuso inline do pai não podem refazer `carregar` (senão o efeito relê a cada render).
  const joinedRef = useRef(onJoined); joinedRef.current = onJoined;
  const tzRef = useRef(tz); tzRef.current = tz;
  const onJoinedStable = () => joinedRef.current?.();

  const carregar = useCallback(async () => {
    try {
      const d = await getGuildDirectory(saveId, tzRef.current);
      if (vivo.current) setDir(d);
    } catch (e) {
      if (!vivo.current) return;
      const k = kindDe(e);
      if (k === 'alreadyIn') { onJoinedStable(); return; }
      setAviso(GUILD_ERROR_KEY[k]);
    }
  }, [saveId]);

  // Já há um pedido pendente? Lê uma vez ao montar (o pendente aparece sem abrir a lista).
  useEffect(() => { void carregar(); }, [carregar]);

  const agir = async (fn: () => Promise<unknown>) => {
    if (ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      await fn();
    } catch (e) {
      if (!vivo.current) return;
      const k = kindDe(e);
      if (k === 'alreadyIn') { onJoinedStable(); return; }
      setAviso(GUILD_ERROR_KEY[k]);
    } finally {
      if (vivo.current) { setOcupado(false); await carregar(); }
    }
  };

  const pendente = dir?.pending ?? null;
  const alerta = aviso && <p role="alert" className="sm2-lib-alert">{t(aviso)}</p>;

  if (pendente) {
    return (
      <div className="sm2-stats-card" data-guild-procurar data-guild-pendente>
        {alerta}
        <p className="sm2-lib-s" style={{ margin: 0 }} role="status">
          {pendente.name ? t('guild.procurar.pendente', { nome: pendente.name }) : t('guild.procurar.pendente.semNome')}
        </p>
        <div className="sm2-guild-row">
          <button
            type="button"
            disabled={ocupado}
            data-guild-cancelar-pedido
            onClick={() => void agir(() => cancelGuildRequest(saveId, tzRef.current))}
            className={`${btn} sm2-kit-btn-outline`}
          >
            <Icon name="close" size={20} />
            {t('guild.procurar.cancelar')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sm2-stats-card" data-guild-procurar>
      {!aberto ? (
        <button
          type="button"
          data-guild-procurar-abrir
          onClick={() => { setAberto(true); void carregar(); }}
          className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
        >
          <Icon name="search" size={20} />
          {t('guild.procurar.botao.abrir')}
        </button>
      ) : (
        <section aria-label={t('guild.procurar.titulo')} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-2)' }}>
          <h3 className="sm2-stats-lab" style={{ margin: 0 }}>{t('guild.procurar.titulo')}</h3>
          {alerta}
          {dir && dir.clans.length === 0 && <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.procurar.vazio')}</p>}
          {dir === null && !aviso && <Icon name="sync" size={20} tone="muted" className="animate-spin" />}
          {dir && dir.clans.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-2)' }}>
              {dir.clans.map(c => (
                <li key={c.dirId} className="sm2-guild-row" data-guild-cla={c.dirId}>
                  <span className="sm2-lib-s" style={{ margin: 0, overflowWrap: 'anywhere' }}>
                    <strong>{c.name}</strong>{' · '}<span className="sm2-num">{t('guild.procurar.tamanho', { n: c.size, max: c.max })}</span>
                  </span>
                  <button
                    type="button"
                    disabled={ocupado}
                    data-guild-pedir
                    onClick={() => void agir(() => requestToJoinGuild(saveId, c.dirId, tzRef.current))}
                    className={`${btn} sm2-kit-btn-primary`}
                  >
                    {t('guild.procurar.pedir')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export function PedidosDeEntrada({ saveId, t, tz, guildKey, onGuild }: {
  saveId: string; t: T; tz?: PlayerDayAnchor;
  /** Muda quando a vista muda (tamanho): relê a fila. */
  guildKey: string;
  onGuild: (g: GuildView | null) => void;
}) {
  const [pedidos, setPedidos] = useState<GuildJoinRequest[]>([]);
  const [aviso, setAviso] = useState<GuildKey | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const vivo = useRef(true);
  useEffect(() => () => { vivo.current = false; }, []);

  const tzRef = useRef(tz); tzRef.current = tz;
  const carregar = useCallback(async () => {
    try {
      const r = await getGuildJoinRequests(saveId, tzRef.current);
      if (vivo.current) setPedidos(r);
    } catch {
      // Falhar a fila não é frase: some (silêncio) e volta na próxima carga.
      if (vivo.current) setPedidos([]);
    }
  }, [saveId]);
  useEffect(() => { void carregar(); }, [carregar, guildKey]);

  const decidir = async (requestId: string, aprovar: boolean) => {
    if (ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      const r = await decideGuildRequest(saveId, requestId, aprovar, tzRef.current);
      if (!vivo.current) return;
      if (r.guild) onGuild(r.guild);
    } catch (e) {
      if (vivo.current) setAviso(GUILD_ERROR_KEY[kindDe(e)]);
    } finally {
      if (vivo.current) { setOcupado(false); await carregar(); }
    }
  };

  if (pedidos.length === 0 && !aviso) return null;
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.pedidos.titulo')} data-guild-pedidos>
      <h3 className="sm2-stats-lab" style={{ margin: 0 }}>{t('guild.pedidos.titulo')}</h3>
      {aviso && <p role="alert" className="sm2-lib-alert">{t(aviso)}</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-2)' }}>
        {pedidos.map(p => {
          const nome = p.name ?? t('guild.pedidos.semNome');
          return (
            <li key={p.requestId} className="sm2-guild-row" aria-label={t('guild.pedidos.aria', { nome })} data-guild-pedido={p.requestId}>
              <span className="sm2-lib-s" style={{ margin: 0, overflowWrap: 'anywhere' }}>{nome}</span>
              {/* Esquerda = recusar, direita = confirmar (regra do dono). */}
              <button type="button" disabled={ocupado} data-guild-recusar onClick={() => void decidir(p.requestId, false)} className={`${btn} sm2-kit-btn-outline`}>
                <Icon name="close" size={20} />
                {t('guild.pedidos.recusar')}
              </button>
              <button type="button" disabled={ocupado} data-guild-aceitar onClick={() => void decidir(p.requestId, true)} className={`${btn} sm2-kit-btn-primary`}>
                <Icon name="check" size={20} />
                {t('guild.pedidos.aceitar')}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
