/**
 * A GUILDA (`docs/PLANO-GUILDA.md`, fatia A do cliente — 29/09/2026).
 *
 * É a folha que o Salão do Hall abre (e a construção da Arena, até a Feira ter
 * a sua): o cooperativo leve da Fase 4.3 com teto de 12, agora falando com
 * `/api/guild` (`utils/community.ts`) e lendo todo texto de `utils/guildCopy.ts`.
 *
 * O DESENHO DESTA TELA É A FEATURE. O item 4.2 do `docs/PLANO-EVOLUCAO.md`
 * registra que 31,3% relataram efeito psicológico negativo de comparação em
 * ambiente de leaderboard; um grupo que mostrasse quanto cada pessoa fez
 * reinventaria o leaderboard entre amigos, onde a comparação dói mais. Por isso:
 *
 *  - **nenhum número por pessoa, e nenhum número de progresso da semana** — a
 *    barra `progress/target` do CoopPanel saiu (`sanitizeGuildView` a descarta):
 *    uma meta com estado de "não bateu" é o oposto do Bosque, que só cresce;
 *  - presença NOMINAL só com até `GUILD_PRESENCE_NOMINAL_MAX` (4) membros, só do
 *    DIA corrente, **sem ordenar** e **sem estado para quem não veio** (nenhum
 *    ícone, nenhuma cor apagada, nenhum lugar vazio — LV-G2). Com 5 ou mais,
 *    ninguém tem estado; o agregado é UMA frase qualitativa, e só quando há fio
 *    (`threadedToday === true`) — com 0, silêncio, nunca "0" nem `{n}`;
 *  - **sair é um toque**, sem confirmação (LV-G5), e a nota diz só o fato;
 *  - "meta do dia ainda não cumprida" é SILÊNCIO: nada é desenhado (§3, linha
 *    `guild.bosque.fio.ainda`) — a frase de explicação do CoopPanel saiu;
 *  - falha de CARGA nunca vira "sem roda" (QA L1 #16): é uma tela de erro com
 *    "tentar de novo", e sem login (401) é um convite a entrar na conta, sem
 *    formulário morto.
 *
 * SALAS (`PLANO-GUILDA.md` §6): o Salão é UM scroll com seções — Bosque, Roda,
 * Mural. A Feira é lote da Arena (fatia B). O visor do Bosque, o palco de
 * criaturas, os gestos e o Mural são da fatia B: `SalaMural` é um placeholder
 * que NÃO desenha nada (seção vazia não escreve "nada ainda" — L6), e o Bosque
 * desenha só o que já tem contrato (o fio e o agregado).
 *
 * Nada da guilda vai para o `GameState`: o ponteiro é do servidor.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  getGuild, createGuild, joinGuild, guildCheckin, leaveGuild, renameGuild, newGuildCode,
  GuildError, type GuildErrorKind, type GuildView,
} from '../../utils/community';
import { playerDayKey, type PlayerDayAnchor } from '../../utils/playerDay';
import { guildText, guildInviteRoom, GUILD_ERROR_KEY, type GuildKey } from '../../utils/guildCopy';
import {
  GUILD_NAME_MAX, GUILD_CODE_LENGTH, GUILD_PRESENCE_NOMINAL_MAX, normalizeGuildCode,
} from '../../utils/guildRules';
// ⚠️ Todo `name` de ícone tem de estar no inventário de `icon_names` de
// `src/styles/tokens.md`: a fonte é SUBSETADA, e um nome fora dele renderiza um
// <span> VAZIO — sem erro e sem aparecer em teste nenhum.
import { Icon } from '../ui/Icon';
import { Field } from '../form/FormKit';
import type { Language } from '../../utils/i18n';

interface GuildSheetProps {
  saveId: string;
  language: Language;
  /** `true` quando a pessoa já cumpriu a própria meta do dia — é o que autoriza
   *  "firmar meu fio": cada um tem a SUA meta, e é assim que uma roda com um
   *  ultra e um rookie não vira injustiça. */
  metaDoDiaCumprida: boolean;
  /** Âncora do DIA DO JOGADOR (`gameState.playerDayTz`); sem ela vale o do aparelho. */
  playerDayTz?: PlayerDayAnchor;
}

type Load =
  | { status: 'loading' }
  | { status: 'error'; kind: GuildErrorKind }
  | { status: 'ready'; guild: GuildView | null; day: string };

const kindOf = (e: unknown): GuildErrorKind => (e instanceof GuildError ? e.kind : 'server');

export function GuildSheet({ saveId, language, metaDoDiaCumprida, playerDayTz }: GuildSheetProps) {
  const t = useCallback((k: GuildKey, vars?: Record<string, string | number>) => guildText(language, k, vars), [language]);
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [aviso, setAviso] = useState<GuildKey | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [ajustes, setAjustes] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [copiado, setCopiado] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const vivo = useRef(false);
  const busy = useRef(false);            // trava SÍNCRONA: `disabled` só vale depois do re-render
  const seq = useRef(0);                 // resposta velha nunca sobrescreve a nova
  const tz = useRef(playerDayTz);
  tz.current = playerDayTz;
  const copiadoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foco = useRef<HTMLElement | null | 'raiz'>(null);
  const ajustesId = useId();

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
      if (copiadoTimer.current) clearTimeout(copiadoTimer.current);
    };
  }, []);

  const carregar = useCallback(async (silencioso: boolean) => {
    const meu = ++seq.current;
    if (!silencioso) setLoad({ status: 'loading' });
    try {
      const guild = await getGuild(saveId, tz.current);
      if (!vivo.current || meu !== seq.current) return;
      setLoad({ status: 'ready', guild, day: playerDayKey(new Date(), tz.current) });
    } catch (e) {
      if (!vivo.current || meu !== seq.current) return;
      // Recarga silenciosa que falha NÃO derruba uma tela boa: fica a que já estava.
      if (!silencioso) setLoad({ status: 'error', kind: kindOf(e) });
    }
  }, [saveId]);

  useEffect(() => { void carregar(false); }, [carregar]);

  // Abrir o campo de código leva o foco a ele (o botão que abriu sumiu).
  useEffect(() => { if (entrando) document.getElementById(`${ajustesId}-codigo`)?.focus(); }, [entrando, ajustesId]);

  // Voltar ao app (aba, APK): os fios dos outros e a virada do dia não aparecem
  // sozinhos. Sem timer — só o evento, e só com a página visível.
  useEffect(() => {
    const aoVoltar = () => { if (!document.hidden && !busy.current) void carregar(true); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => document.removeEventListener('visibilitychange', aoVoltar);
  }, [carregar]);

  // Foco (QA L1 #24b): quando o botão apertado some (criar, sair, firmar o fio),
  // o foco iria para o `<body>` e, dentro de um diálogo modal, o teclado se perde.
  useEffect(() => {
    const alvo = foco.current;
    if (!alvo) return;
    foco.current = null;
    const raiz = rootRef.current;
    if (!raiz) return;
    if (raiz.contains(document.activeElement) && document.activeElement !== raiz) return;
    if (alvo !== 'raiz' && alvo.isConnected && !(alvo as HTMLButtonElement).disabled && raiz.contains(alvo)) alvo.focus();
    else raiz.focus({ preventScroll: true });
  });

  const aplicar = (guild: GuildView | null, anunciar?: GuildKey) => {
    seq.current++;
    setLoad({ status: 'ready', guild, day: playerDayKey(new Date(), tz.current) });
    setAviso(null);
    if (anunciar) setAnuncio(t(anunciar));
  };

  /** Toda ação passa por aqui: um só lugar trava o duplo toque, traduz o erro e cuida do foco. */
  const agir = async (fn: () => Promise<GuildView | null>, opts: { anunciar?: GuildKey; depois?: () => void } = {}) => {
    if (busy.current) return;
    busy.current = true;
    const abriu = document.activeElement as HTMLElement | null;
    setOcupado(true);
    setAviso(null);
    setAnuncio('');
    try {
      const guild = await fn();
      if (!vivo.current) return;
      aplicar(guild, opts.anunciar);
      opts.depois?.();
    } catch (e) {
      if (!vivo.current) return;
      const kind = kindOf(e);
      if (kind === 'login') {
        setLoad({ status: 'error', kind });
      } else if (kind === 'alreadyIn') {
        // #10: mostra a roda que a pessoa JÁ tem (e, nela, a saída), em vez de um beco.
        if (e instanceof GuildError && e.guild) aplicar(e.guild);
        else void carregar(true);
        setAviso('guild.erro.jaEmOutra');
      } else if (kind === 'noGuild') {
        aplicar(null);
        setAviso('guild.esvaziada.mundo');
      } else {
        if (kind === 'notHost') void carregar(true);
        setAviso(GUILD_ERROR_KEY[kind]);
      }
    } finally {
      busy.current = false;
      foco.current = abriu ?? 'raiz';
      if (vivo.current) setOcupado(false);
    }
  };

  const copiar = async (code: string) => {
    try {
      await navigator.clipboard?.writeText(code);
      if (!navigator.clipboard || !vivo.current) return;
      setCopiado(true);
      setAnuncio(t('guild.codigo.copiado'));
      if (copiadoTimer.current) clearTimeout(copiadoTimer.current);
      copiadoTimer.current = setTimeout(() => { if (vivo.current) setCopiado(false); }, 2000);
    } catch {
      // `clipboard` falha em WebView antigo/contexto não seguro. O código está
      // escrito na tela do lado, então falhar não tira nada de ninguém.
    }
  };

  const compartilhar = async (g: GuildView) => {
    try { await navigator.share({ title: g.name, text: g.code }); } catch { /* cancelou */ }
  };

  const alerta = aviso && <p role="alert" className="sm2-lib-alert">{t(aviso)}</p>;
  const btn = 'sm2-kit-btn sm2-kit-btn-md';

  let corpo: React.ReactNode;
  if (load.status === 'loading') {
    corpo = (
      <p className="sm2-lib-busy" aria-busy="true">
        <Icon name="sync" size={24} tone="muted" className="animate-spin" />
        {t('guild.salao.carregando')}
      </p>
    );
  } else if (load.status === 'error') {
    // QA L1 #16: falha de leitura NÃO é "sem roda". Só o aviso e — salvo sem
    // login, onde tentar de novo não muda nada — o botão de tentar de novo.
    corpo = (
      <div className="sm2-guild-sec">
        <p role="alert" className="sm2-lib-alert">{t(GUILD_ERROR_KEY[load.kind])}</p>
        {load.kind !== 'login' && (
          <button type="button" onClick={() => void carregar(false)} className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}>
            <Icon name="refresh" size={20} />
            {t('guild.erro.tentar')}
          </button>
        )}
      </div>
    );
  } else if (!load.guild) {
    const semNome = ocupado || !nome.trim();
    const semCodigo = ocupado || codigo.length < GUILD_CODE_LENGTH;
    corpo = (
      <>
        <p className="sm2-stats-t">{t('guild.salao.vazio.corpo')}</p>
        {alerta}
        <div className="sm2-stats-card">
          <label className="sm2-lib-s" style={{ fontWeight: 500 }} htmlFor={`${ajustesId}-nome`}>{t('guild.criar.nome.label')}</label>
          <Field
            id={`${ajustesId}-nome`}
            value={nome}
            maxLength={GUILD_NAME_MAX}
            onChange={e => setNome(e.target.value)}
            placeholder={t('guild.criar.nome.placeholder')}
          />
          <button
            type="button"
            disabled={semNome}
            aria-disabled={semNome ? true : undefined}
            aria-busy={ocupado ? true : undefined}
            onClick={() => void agir(() => createGuild(saveId, nome.trim(), tz.current))}
            className={`${btn} sm2-kit-btn-primary sm2-guild-btn`}
          >
            <Icon name={ocupado ? 'sync' : 'add'} size={20} className={ocupado ? 'animate-spin' : undefined} />
            {t('guild.criar.botao')}
          </button>
        </div>
        <div className="sm2-stats-card">
          {!entrando ? (
            <button
              type="button"
              onClick={() => setEntrando(true)}
              className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
            >
              <Icon name="arrow_forward" size={20} />
              {t('guild.entrar.botao.abrir')}
            </button>
          ) : (
            <>
              <label className="sm2-lib-s" style={{ fontWeight: 500 }} htmlFor={`${ajustesId}-codigo`}>{t('guild.entrar.codigo.label')}</label>
              {/* Entra-se por CÓDIGO, nunca por busca: roda achável é raide de
                  estranho. O campo só aceita o alfabeto do código (sem 0/O/1/I). */}
              <Field
                id={`${ajustesId}-codigo`}
                value={codigo}
                maxLength={GUILD_CODE_LENGTH}
                autoCapitalize="characters"
                autoComplete="off"
                inputMode="text"
                onChange={e => setCodigo(normalizeGuildCode(e.target.value))}
                placeholder="ABCD2345"
                style={{ letterSpacing: '0.12em' }}
              />
              <button
                type="button"
                disabled={semCodigo}
                aria-disabled={semCodigo ? true : undefined}
                aria-busy={ocupado ? true : undefined}
                onClick={() => void agir(() => joinGuild(saveId, codigo, tz.current))}
                className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
              >
                <Icon name={ocupado ? 'sync' : 'arrow_forward'} size={20} className={ocupado ? 'animate-spin' : undefined} />
                {t('guild.entrar.botao')}
              </button>
            </>
          )}
        </div>
      </>
    );
  } else {
    const g = load.guild;
    // Presença nominal: só ≤4, só do dia corrente (a vista veio do MESMO dia do
    // jogador que vale agora) e só o que o servidor mandou.
    const nominal = g.size <= GUILD_PRESENCE_NOMINAL_MAX && load.day === playerDayKey(new Date(), tz.current);
    const semNovoNome = ocupado || !novoNome.trim() || novoNome.trim() === g.name;
    corpo = (
      <>
        {alerta}
        <div className="sm2-stats-card">
          <div className="sm2-guild-hd">
            {/* O nome quebra em qualquer ponto (QA #4) e é o alvo do foco depois de uma ação. */}
            <h2 className="sm2-lib-h2 sm2-guild-name">{g.name}</h2>
            {g.isHost && (
              <button
                type="button"
                className="sm2-lib-act"
                aria-label={t('guild.ajustes.aria')}
                title={t('guild.ajustes.aria')}
                aria-expanded={ajustes}
                aria-controls={ajustesId}
                onClick={() => { setAjustes(a => !a); setNovoNome(g.name); }}
              >
                <Icon name="settings" size={24} fill={ajustes ? 1 : 0} tone={ajustes ? 'primary' : 'ink'} />
              </button>
            )}
          </div>

          {g.isHost && ajustes && (
            <section id={ajustesId} className="sm2-guild-sec" aria-label={t('guild.ajustes.titulo')}>
              <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.ajustes.somenteAbriu')}</p>
              <label className="sm2-lib-s" style={{ fontWeight: 500 }} htmlFor={`${ajustesId}-renomear`}>{t('guild.ajustes.renomear')}</label>
              <Field
                id={`${ajustesId}-renomear`}
                value={novoNome}
                maxLength={GUILD_NAME_MAX}
                onChange={e => setNovoNome(e.target.value)}
              />
              <button
                type="button"
                disabled={semNovoNome}
                aria-disabled={semNovoNome ? true : undefined}
                onClick={() => void agir(() => renameGuild(saveId, novoNome.trim(), tz.current))}
                className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
              >
                {t('guild.ajustes.renomear.salvar')}
              </button>
              <button
                type="button"
                disabled={ocupado}
                aria-disabled={ocupado ? true : undefined}
                onClick={() => void agir(() => newGuildCode(saveId, tz.current))}
                className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
              >
                {t('guild.ajustes.codigoNovo')}
              </button>
              <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.ajustes.codigoNovo.nota')}</p>
            </section>
          )}

          <SalaBosque
            guild={g}
            t={t}
            metaDoDiaCumprida={metaDoDiaCumprida}
            ocupado={ocupado}
            onFio={() => void agir(() => guildCheckin(saveId, tz.current), { anunciar: 'guild.bosque.fio.toast' })}
          />

          <SalaRoda guild={g} t={t} nominal={nominal} />

          <div className="sm2-coop-code">
            <span className="sm2-lib-s">{t('guild.codigo.label')}</span>
            <code className="sm2-coop-cd sm2-num">{g.code}</code>
            <button
              type="button"
              onClick={() => void copiar(g.code)}
              className="sm2-lib-act"
              aria-label={t('guild.aria.codigo.copiar')}
              title={t('guild.codigo.copiar')}
            >
              <Icon name={copiado ? 'check' : 'content_copy'} size={24} fill={copiado ? 1 : 0} tone={copiado ? 'primary' : 'ink'} />
            </button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={() => void compartilhar(g)}
                className="sm2-lib-act"
                aria-label={t('guild.criar.compartilhar')}
                title={t('guild.criar.compartilhar')}
              >
                <Icon name="share" size={24} tone="ink" />
              </button>
            )}
            {copiado && <span className="sm2-lib-s" aria-hidden="true">{t('guild.codigo.copiado')}</span>}
          </div>
          {g.size <= 1 && <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.criar.codigo.corpo', { n: guildInviteRoom() })}</p>}

          <SalaMural />

          {/* Saída limpa (LV-G5): um toque, sem diálogo de confirmação e sem
              penalidade. Um "tem certeza?" aqui seria o app negociando com quem
              quer sair. A nota é só o fato. `outline`, nunca `quiet`/`ghost` (D-S10). */}
          <button
            type="button"
            disabled={ocupado}
            aria-disabled={ocupado ? true : undefined}
            onClick={() => void agir(async () => { await leaveGuild(saveId); return null; })}
            className={`${btn} sm2-kit-btn-outline sm2-guild-btn`}
          >
            {t('guild.sair.botao')}
          </button>
          <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.sair.nota')}</p>
        </div>
      </>
    );
  }

  return (
    <div ref={rootRef} tabIndex={-1} className="sm2-guild" aria-label={t('guild.aria.salao')} data-guild-sheet>
      {/* Região viva SEMPRE montada (QA L1 BAIXO-3): o texto entra depois, e é
          assim que o leitor de tela anuncia — uma região que nasce preenchida não é lida. */}
      <div role="status" aria-live="polite" className="sm2-guild-sr" data-guild-status>{anuncio}</div>
      {corpo}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SALAS — o Salão é um scroll com seções (`PLANO-GUILDA.md` §6). Cada uma é uma
// função para que a fatia B encaixe o visor, os gestos e o Mural sem reabrir
// esta tela.

type T = (k: GuildKey, vars?: Record<string, string | number>) => string;

/**
 * BOSQUE. A fatia B põe aqui o visor do estágio e a faixa "perto de {estagio}".
 * Hoje só o que tem contrato: o fio (a presença de quem pergunta) e o agregado.
 * Sem nada a dizer, NÃO desenha nada — nem título (`guild.bosque.fio.ainda`).
 */
function SalaBosque({ guild, t, metaDoDiaCumprida, ocupado, onFio }: {
  guild: GuildView; t: T; metaDoDiaCumprida: boolean; ocupado: boolean; onFio: () => void;
}) {
  const fioHoje = guild.mine.cameToday;
  const podeFirmar = !fioHoje && metaDoDiaCumprida;
  // 5+: UMA frase qualitativa, só com fio; nunca número, nunca `{n}`.
  const agregado = guild.threadedToday === true;
  if (!fioHoje && !podeFirmar && !agregado) return null;
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.bosque.titulo')} data-guild-room="bosque">
      {fioHoje && <p className="sm2-stats-t" style={{ margin: 0 }}>{t('guild.bosque.fio.hoje')}</p>}
      {podeFirmar && (
        <button
          type="button"
          disabled={ocupado}
          aria-disabled={ocupado ? true : undefined}
          aria-busy={ocupado ? true : undefined}
          aria-label={t('guild.aria.fio')}
          onClick={onFio}
          className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary sm2-guild-btn"
        >
          <Icon name={ocupado ? 'sync' : 'check_circle'} size={20} className={ocupado ? 'animate-spin' : undefined} />
          {t('guild.bosque.fio.botao')}
        </button>
      )}
      {agregado && <p className="sm2-lib-s" style={{ margin: 0 }} data-guild-agregado>{t('guild.bosque.agregado.um')}</p>}
    </section>
  );
}

/**
 * RODA: nomes na ORDEM DE CHEGADA (a que o servidor manda — nunca reordenada).
 * ≤4: a marca "no bosque hoje" SÓ em quem veio; quem não veio fica sem marca,
 * sem ícone e sem cor apagada (LV-G2). 5+: só nomes, ninguém tem estado.
 */
function SalaRoda({ guild, t, nominal }: { guild: GuildView; t: T; nominal: boolean }) {
  return (
    <section className="sm2-guild-sec" aria-label={t('guild.aria.roda')} data-guild-room="roda">
      <div className="sm2-guild-secHd">
        <h3 className="sm2-stats-lab">{t('guild.roda.titulo')}</h3>
        <span className="sm2-lib-s sm2-num">{t('guild.roda.contagem', { n: guild.size })}</span>
      </div>
      <ul className="sm2-coop-mem">
        {guild.members.map((m, i) => (
          <li key={m.id ?? `m${i}`}>
            <span className="t">{m.name ?? t('guild.roda.alguem')}</span>
            {m.euMesmo && <span className="sm2-guild-you">{t('guild.roda.voce')}</span>}
            {nominal && m.apareceuHoje === true && <span className="sm2-guild-pres">{t('guild.roda.presente')}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** MURAL — fatia B (marcos com DATA, peças de maré). Vazio não escreve "nada ainda". */
function SalaMural(): null {
  return null;
}
