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
 *
 * Canvas Social (§28, D-S1…D-S10): a criatura do outro num `MiniGlass` 64²
 * sem anel (sprite 0,25×), nunca avatar; `groups` 24 pelado no título; abas
 * SIS-04 (`.sm2-kit-tab`, ativa em `primary-ink` + sublinhado — nunca placa
 * cheia); ação inerte por FORMA (tracejado + `muted` + `aria-disabled`, fora
 * do Tab — nunca opacidade); `add` ciano, `paid` tinta, remover `muted`; o
 * `role=alert` é âmbar (`danger-ink` saiu); "Try again" em `outline`.
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { opponentSprite } from '../utils/opponentArt';
import { isSafeSpriteSrc } from '../utils/spriteLibrary';
import { listPlayers, getPlayer, getFriendForms, addFriend, removeFriend, sendGift, suggestNames, answerFriendInvite, getFriendsState, markFriendsSeen, type DirectoryPlayer, type FriendsState } from '../utils/community';
import type { FriendTrainerProps } from './FriendTraining';
import { LIBRARY_NPCS } from '../utils/libraryNpcs';
import { PlayerDetailModal } from './PlayerDetailModal';
import { RitualDialog } from './ritual/RitualKit';
import { elementIcon } from '../utils/elementIconArt';
import { dexElementName } from './ElementDex';
import { readAllForms, recordForms, sanitizeForm, formStageLabel, isCurrentForm, type SeenForm } from '../utils/libraryForms';
import { CoopPanel } from './CoopPanel';
import { BestiaryCollection } from './BestiaryCollection';
import { NewBadge } from './LibraryNewBadge';
import { libraryNewKeys, type LibraryAck } from '../utils/libraryNew';
import type { StrayPlayerSeen } from '../utils/strayPlayers';
import { ElementDex } from './ElementDex';
import { ElementBaseSlots, emptySlots } from './ElementBaseSlots';
import { elementMatchesBases, selectedBases } from '../utils/elementPotion';
import { Icon } from './ui/Icon';
import { InfoTip } from './ui/InfoTip';
import { MiniGlass } from './ui/MiniGlass';
import { Field, sm2Button } from './form/FormKit';
import type { Language } from '../utils/i18n';
import type { PlayerDayAnchor } from '../utils/playerDay';
import { readSeenIds, addSeenId } from '../utils/librarySeen';
import { writeJson } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

const FriendTraining = lazy(() => import('./FriendTraining').then(m => ({ default: m.FriendTraining })));


interface LibraryPageProps {
  saveId: string;
  friends: string[];
  /** Energia cheia do Soulmon: condição do presente (só no Círculo de Amigos). */
  canGiftToday?: boolean;
  onFriendsChange: (friends: string[]) => void;
  onGiftSent?: (friendId: string) => void;
  /** WP4.7 — abriu a criatura de alguém. A missão é sobre VISITAR, então o
   *  gatilho é a abertura do detalhe, não a amizade nem o presente. */
  onVisitPlayer?: () => void;
  /** Fase 4.3 — passa direto ao `CoopPanel`: é o que autoriza o check-in do
   *  dia. Fica aqui, e não dentro do painel, porque a meta do dia é do motor
   *  (`useProgressTracking`) e o painel não pode ter uma segunda cópia dela. */
  metaDoDiaCumprida?: boolean;
  /** Âncora do dia do jogador — o dia que a Guilda envia ao servidor. */
  playerDayTz?: PlayerDayAnchor;
  /** Sprite próprio do jogador (para o CoopPanel/GuildSheet quando aberto por aqui). */
  mySprite?: string | null;
  language: Language;
  /** minimal-ui F5 — dentro da folha do Hall (`AreaSheet`), que já nomeia a
   *  Biblioteca no próprio título: a página não repete o `<h1>` (uma tela, um
   *  heading de topo — o `<h1>` é o do `AreaTopBar`), só a linha de apoio. */
  embedded?: boolean;
  /** Fixa UMA visão (o Hall tem uma construção por visão): esconde as abas e a
   *  visão `coop` (que agora é a Guilda, outra construção). Sem ela, tudo como antes. */
  view?: 'directory' | 'friends';
  /** `GameState.bestiary`: chaves `<id>-<estágio>` dos inimigos já vistos — abas Selvagem/Desgarrado (só na visão `directory`). */
  bestiary?: string[];
  /** `GameState.defeatedElements`: o dex da aba Elemento (só na visão `directory`). */
  defeatedElements?: string[];
  /** §213: desgarrados de JOGADORES já vistos (`GameState.strayPlayersSeen`) — categoria própria na aba Desgarrado. */
  strayPlayersSeen?: StrayPlayerSeen[];
  /** Aviso NEW (01/11/2026): os contadores da última abertura (`GameState.libraryAck`). */
  libraryAck?: LibraryAck;
  /** A Biblioteca (visão `directory`) abriu: grava o "visto" (`ackLibrary`). O selo desta visita já foi congelado. */
  onLibraryOpened?: () => void;
  /** §242: o que o treino com amigo precisa do SEU Soulmon (estágio, arte, elemento, skills). Sem isto o ícone de combate não aparece. */
  trainer?: FriendTrainerProps;
  /** §242: há convite recebido ou presente novo (o "!" do prédio Amigos). Chamado a cada leitura do estado social. */
  onSocialAlert?: (alert: boolean) => void;
}

// Entrada unificada da lista — jogador real ou NPC de teste (ver
// utils/libraryNpcs.ts); isNpc/spriteUrl ficam undefined pros reais.
type LibraryEntry = DirectoryPlayer & { isNpc?: boolean; spriteUrl?: string | null; unresolved?: boolean };

const MAX_FRIENDS = 20;

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
  name: isPt ? 'Amigo (não carregou)' : "Friend (didn't load)",
  petName: '', stage: 'rookie', unlockedStages: [],
  pvpEnabled: false, daysPlaying: 0,
  unresolved: true,
});


/**
 * Botão de ação da linha: ícone pelado 24 dentro de um alvo de 44px.
 * Inerte por FORMA (D-S4): `aria-disabled` + tracejado + tinta `muted`, e
 * `tabIndex=-1` para ficar fora do Tab (R5) — nunca `disabled` nativo com a
 * opacidade do browser. O `aria-label`/`title` continua dizendo o MOTIVO.
 * Cor pela natureza da ação (D-S5): `add` ciano, `paid` tinta, remover `muted`.
 */
function RowAction({
  icon, label, onClick, disabled, busy, tone = 'ink', fill, onInert,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  tone?: 'ink' | 'primary' | 'muted';
  fill?: number;
  /** Toque numa ação inerte: o chamador explica o motivo (o ícone sozinho parecia quebrado). */
  onInert?: () => void;
}) {
  const inert = disabled || busy;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); if (!inert) onClick(); else if (!busy) onInert?.(); }}
      aria-disabled={inert ? true : undefined}
      aria-busy={busy ? true : undefined}
      tabIndex={inert ? -1 : undefined}
      aria-label={label}
      title={label}
      className="sm2-lib-act"
    >
      <Icon
        name={busy ? 'sync' : icon}
        size={24}
        fill={inert ? 0 : fill}
        tone={inert ? 'muted' : tone}
        className={busy ? 'animate-spin' : undefined}
      />
    </button>
  );
}

export function LibraryPage({ saveId, friends, canGiftToday = false, onFriendsChange, onGiftSent, onVisitPlayer, metaDoDiaCumprida = false, playerDayTz, mySprite, language, embedded = false, view, bestiary, defeatedElements, strayPlayersSeen, libraryAck, onLibraryOpened, trainer, onSocialAlert }: LibraryPageProps) {
  // Selo NEW (01/11/2026): o que estava novo AO ABRIR fica marcado durante esta visita; a abertura grava o "visto".
  const [novos] = useState(() => libraryNewKeys({ bestiary, defeatedElements, strayPlayersSeen, libraryAck }));
  useEffect(() => { if (view === 'directory') onLibraryOpened?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const isPt = language === 'pt-BR';
  const [search, setSearch] = useState('');
  const [petBases, setPetBases] = useState<(string | null)[]>(emptySlots);
  // Filtro por bases da aba Selvagens: um estado só para Selvagem + Desgarrado.
  const [wildBases, setWildBases] = useState<(string | null)[]>(emptySlots);
  const [players, setPlayers] = useState<DirectoryPlayer[] | null>(null);
  /** Erro de CARGA (rede/servidor). Separado de "lista vazia", de propósito. */
  const [loadError, setLoadError] = useState(false);
  /** Erro de AÇÃO (amizade/presente). Era `alert()` — um diálogo do sistema
   *  em cima de um app de bichinho, e sem par PT/EN garantido. */
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tabState, setTab] = useState<'directory' | 'friends' | 'coop'>('directory');
  const tab = view ?? tabState;
  /** 27/10/2026 (dono): a Biblioteca do Hall tem 3 abas — Encontrados (a lista de sempre), Selvagens (Selvagem + Desgarrado na mesma aba) e Elemento. */
  const hallTabs = view === 'directory';
  const [libTab, setLibTab] = useState<'found' | 'wild' | 'element'>('found');
  /** Aba que NÃO é a lista de jogadores: some busca, carregamento, vazio e a grade de encontrados. */
  const outroPainel = hallTabs && libTab !== 'found';
  const [giftedToday, setGiftedToday] = useState<Set<string>>(new Set());
  /** §242: estado social vindo do SERVIDOR (convites, presentes de hoje, histórico). `null` = ainda não chegou. */
  const [social, setSocial] = useState<FriendsState | null>(null);
  /** Modo "Remover amigos": só então a exclusão aparece nas linhas, e ainda pede DUAS confirmações. */
  const [removeMode, setRemoveMode] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ p: LibraryEntry; step: 1 | 2 } | null>(null);
  const [trainingWith, setTrainingWith] = useState<LibraryEntry | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<LibraryEntry | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** Amigos resolvidos por pid. `null` = ainda carregando (nao "sem amigos"). */
  const [friendPlayers, setFriendPlayers] = useState<LibraryEntry[] | null>(null);
  /**
   * H17 (01/10/2026, navegação do dono): a BIBLIOTECA DO HALL mostra só os
   * Soulmons que a pessoa já viu — os que ela já abriu aqui e os amigos. A busca
   * por nome alcança qualquer um (sem ela, ninguém novo seria encontrável). Vale só na visão fixa do Hall (`view === 'directory'`).
   */
  const seenOnly = view === 'directory';
  /** C7: o campo "adicionar amigo pelo nome" (aba Amigos). */
  const [addName, setAddName] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addMsg, setAddMsg] = useState<string | null>(null);
  /** Sugestões de nomes (do servidor) que começam com o que a pessoa digitou. */
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  /** Pet aberto no painel simples da Biblioteca do Hall. */
  const [selectedPet, setSelectedPet] = useState<LibraryEntry | null>(null);
  const [seen, setSeen] = useState<string[]>(readSeenIds);
  /** Formas já vistas de cada Soulmon (aparelho) — junta o que a Biblioteca vê agora com o que o servidor conta dos AMIGOS. */
  const [formsMap, setFormsMap] = useState<Record<string, SeenForm[]>>(readAllForms);
  const formaAtualDe = (p: LibraryEntry) => ({ stage: p.stage, spriteUrl: isSafeSpriteSrc(p.spriteUrl) ? p.spriteUrl : null, element: p.element ?? null, date: Date.now() });
  const markSeen = (id: string) => {
    setSeen(prev => {
      if (prev.includes(id)) return prev;
      const next = [...addSeenId(prev, id)];
      writeJson(STORAGE_KEYS.LIBRARY_SEEN, next);
      return next;
    });
  };

  useEffect(() => {
    let vivo = true;
    setPlayers(null);
    setLoadError(false);
    const t = setTimeout(() => {
      // C6: no Hall a busca filtra a lista dos já vistos NO CLIENTE (nome da criatura); o servidor devolve o diretório inteiro.
      listPlayers(seenOnly ? '' : search)
        .then(r => { if (vivo) setPlayers(r.players ?? []); })
        .catch(() => { if (vivo) { setPlayers([]); setLoadError(true); } });
    }, 300);
    return () => { vivo = false; clearTimeout(t); };
  }, [search, reloadKey, seenOnly]);

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

  useEffect(() => {
    const q = addName.trim();
    if (tab !== 'friends' || !q) { setSugestoes([]); return; }
    let vivo = true;
    const t = setTimeout(() => {
      suggestNames(q)
        .then(r => { if (vivo) setSugestoes((r.names ?? []).filter(n => n.toLowerCase().startsWith(q.toLowerCase()) && n.toLowerCase() !== q.toLowerCase()).slice(0, 8)); })
        .catch(() => { if (vivo) setSugestoes([]); });
    }, 250);
    return () => { vivo = false; clearTimeout(t); };
  }, [addName, tab]);

  /**
   * REGISTRO DE FORMAS (31/10/2026): todo Soulmon que a pessoa já viu (aberto aqui, enfrentado no Torneio ou amigo) tem a forma
   * ATUAL gravada quando a Biblioteca o carrega — é isso que migra quem já estava em `LIBRARY_SEEN` para "1 forma". As formas
   * antigas dos AMIGOS vêm do servidor (`action=forms`, só entre amigos), no cadastro e a cada abertura da Biblioteca.
   */
  const vistosKey = seen.join(',');
  useEffect(() => {
    const todos = [...((players ?? []) as LibraryEntry[]), ...(friendPlayers ?? [])].filter(p => !p.isNpc && !p.unresolved && (seen.includes(p.id) || friends.includes(p.id)));
    if (todos.length === 0) return;
    for (const p of todos) recordForms(p.id, [formaAtualDe(p)]);
    setFormsMap(readAllForms());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, friendPlayers, vistosKey, friendsKey]);
  useEffect(() => {
    let vivo = true;
    friendsKey.split(',').filter(Boolean).forEach(pid => {
      getFriendForms(saveId, pid)
        .then(r => { if (vivo && Array.isArray(r.forms)) { recordForms(pid, r.forms); setFormsMap(readAllForms()); } })
        .catch(() => { /* sem rede / 403: fica o que já foi visto */ });
    });
    return () => { vivo = false; };
  }, [friendsKey, saveId, reloadKey]);

  /** Lê o estado social (só o dono). Falha de rede deixa o que já havia. */
  useEffect(() => {
    let vivo = true;
    getFriendsState(saveId, playerDayTz)
      .then(r => { if (vivo) { setSocial(r); onSocialAlert?.(r.incoming.length > 0 || r.unseen > 0); } })
      .catch(() => { /* sem rede: segue sem convites */ });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveId, reloadKey, friendsKey]);
  /** Abriu a aba Amigos: o histórico de presentes passa a "visto" (os convites ficam até alguém decidir). */
  useEffect(() => {
    if (tab !== 'friends' || !social || social.unseen === 0) return;
    const t = setTimeout(() => {
      markFriendsSeen(saveId).catch(() => {});
      onSocialAlert?.(social.incoming.length > 0);
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, social]);

  const answerInvite = async (inv: { id: string; name: string }, decline: boolean) => {
    setBusyId(inv.id);
    setActionError(null);
    try {
      const r = await answerFriendInvite(saveId, inv.id, decline);
      onFriendsChange(r.friends);
      setSocial(prev => {
        if (!prev) return prev;
        const incoming = prev.incoming.filter(i => i.id !== inv.id);
        onSocialAlert?.(incoming.length > 0 || prev.unseen > 0);
        return { ...prev, incoming, friends: r.friends };
      });
      setAddMsg(decline ? null : (isPt ? `${inv.name} agora é seu amigo.` : `${inv.name} is now your friend.`));
    } catch {
      setActionError(isPt ? 'Não deu para responder ao convite agora. Tente de novo.' : "Couldn't answer that invite right now. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFriend = async (p: DirectoryPlayer) => {
    setBusyId(p.id);
    setActionError(null);
    try {
      const isFriend = friends.includes(p.id);
      const r: { friends: string[]; status?: 'pending' | 'friends' } = isFriend ? await removeFriend(saveId, p.id) : await addFriend(saveId, p.id);
      onFriendsChange(r.friends);
      if (!isFriend) setSocial(prev => (prev && r.status === 'pending' ? { ...prev, outgoing: [...prev.outgoing, p.id] } : prev));
    } catch {
      setActionError(isPt ? 'Não deu para mudar a amizade agora. Tente de novo.' : "Couldn't change that friendship right now. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  /** Presente (regressão do M4, decisão do dono 25/10): só no Círculo de Amigos (aba Amigos), nunca na Biblioteca. */
  const gift = async (friendId: string) => {
    setBusyId(friendId);
    setActionError(null);
    try {
      const r = await sendGift(saveId, friendId, playerDayTz);
      const valeu = typeof r?.credited === 'number' ? r.credited : 20;
      setGiftedToday(prev => new Set(prev).add(friendId));
      onGiftSent?.(friendId);
      setSocial(prev => (prev ? { ...prev, sentToday: [...prev.sentToday, friendId] } : prev));
      // A tela diz o valor REAL: o teto de 100 Bits/dia de quem recebe pode cortar o presente.
      setAddMsg(valeu >= 20
        ? (isPt ? '20 Bits enviados!' : 'Sent 20 Bits!')
        : valeu > 0
          ? (isPt ? `Presente enviado: ${valeu} de 20 Bits valeram (teto de 100 por dia).` : `Gift sent: ${valeu} of 20 Bits counted (100 a day cap).`)
          : (isPt ? 'Presente enviado, mas essa pessoa já atingiu o teto de 100 Bits de hoje: 0 Bits valeram.' : 'Gift sent, but this person already hit today’s 100 Bits cap: 0 Bits counted.'));
    } catch {
      setActionError(isPt ? 'O presente não chegou. Tente de novo daqui a pouco.' : "The gift didn't go through. Try again in a bit.");
    } finally {
      setBusyId(null);
    }
  };

  /** Nome que a linha mostra: no Hall é o da CRIATURA (C6); fora dele, o do jogador. */
  const nomeDe = (p: LibraryEntry) => (seenOnly ? (p.petName || p.name) : p.name);
  const searchLower = search.trim().toLowerCase();
  const filteringPets = selectedBases(petBases).length > 0;
  const npcMatches: LibraryEntry[] = LIBRARY_NPCS.filter(p => !searchLower || p.name.toLowerCase().includes(searchLower) || p.petName.toLowerCase().includes(searchLower));
  const directoryAll: LibraryEntry[] | null = players === null ? null : [...(players ?? []), ...(seenOnly ? LIBRARY_NPCS : npcMatches)];
  const onlySeen = seenOnly;
  // C6: todo Soulmon já visto (NPC incluso), filtrado pelo nome da criatura e em ordem alfabética.
  const directoryList: LibraryEntry[] | null = directoryAll && onlySeen
    ? directoryAll
      // Sem busca: só os já vistos e os amigos (H17). COM busca: o diretório inteiro — senão jogador novo nunca aparece (QA R7).
      .filter(p => searchLower !== '' || seen.includes(p.id) || friends.includes(p.id))
      .filter(p => !searchLower || p.petName.toLowerCase().includes(searchLower) || p.name.toLowerCase().includes(searchLower))
      // Filtro por bases do elemento (o mesmo do Cambista): Soulmon cujo elemento contém todas as bases escolhidas.
      .filter(p => elementMatchesBases(p.element, petBases))
      .sort((a, b) => nomeDe(a).localeCompare(nomeDe(b), language, { sensitivity: 'base' }))
    : directoryAll;

  /** C7: adiciona um amigo digitando o nome do jogador (o diretório devolve quem ligou a presença pública). */
  const addByName = async () => {
    const q = addName.trim().toLowerCase();
    if (!q || addBusy) return;
    setAddMsg(null);
    setActionError(null);
    if (friends.length >= MAX_FRIENDS) { setAddMsg(isPt ? `Limite de ${MAX_FRIENDS} amigos.` : `Limit of ${MAX_FRIENDS} friends.`); return; }
    setAddBusy(true);
    try {
      const r = await listPlayers(addName.trim());
      const todos = (r.players ?? []).filter(p => p.id !== saveId);
      const exatos = todos.filter(p => p.name.toLowerCase() === q);
      const cand = exatos.length > 0 ? exatos : todos.filter(p => p.name.toLowerCase().includes(q));
      if (cand.length === 0) { setAddMsg(isPt ? 'Não achei ninguém com esse nome.' : "I couldn't find anyone with that name."); return; }
      if (cand.length > 1) { setAddMsg(isPt ? 'Há mais de uma pessoa assim. Digite o nome completo.' : 'More than one person matches. Type the full name.'); return; }
      const alvo = cand[0];
      if (friends.includes(alvo.id)) { setAddMsg(isPt ? `${alvo.name} já é seu amigo.` : `${alvo.name} is already your friend.`); return; }
      if (social?.outgoing.includes(alvo.id)) { setAddMsg(isPt ? `Você já convidou ${alvo.name}.` : `You already invited ${alvo.name}.`); return; }
      const res = await addFriend(saveId, alvo.id);
      onFriendsChange(res.friends);
      setAddName('');
      if (res.status === 'friends') setAddMsg(isPt ? `${alvo.name} agora é seu amigo.` : `${alvo.name} is now your friend.`);
      else {
        setSocial(prev => (prev ? { ...prev, outgoing: [...prev.outgoing, alvo.id] } : prev));
        setAddMsg(isPt ? `Convite enviado para ${alvo.name}.` : `Invite sent to ${alvo.name}.`);
      }
    } catch {
      setActionError(isPt ? 'Não deu para adicionar agora. Tente de novo.' : "Couldn't add that friend right now. Try again.");
    } finally {
      setAddBusy(false);
    }
  };
  // A aba do grupo não é uma lista de jogadores — tem fonte, estados e vazio
  // próprios. Por isso ela não entra em `list`: entrar faria o esqueleto e o
  // "nenhum jogador com esse nome" do diretório aparecerem por cima dela.
  const list = tab === 'coop' ? [] : tab === 'friends' ? friendPlayers : directoryList;
  /** Carregando e por ABA: cada uma tem a sua fonte e o seu `null`. */
  const carregando = list === null;

  const LIB_TABS = [
    { key: 'found' as const, label: isPt ? 'Outros jogadores' : 'Other players' },
    { key: 'wild' as const, label: isPt ? 'Selvagens' : 'Wild' },
    { key: 'element' as const, label: isPt ? 'Elemento' : 'Element' },
  ];

  const TABS = [
    { key: 'directory' as const, icon: 'person', label: isPt ? 'Todos' : 'All' },
    { key: 'friends' as const, icon: 'volunteer_activism', label: isPt ? `Amigos ${friends.length}/${MAX_FRIENDS}` : `Friends ${friends.length}/${MAX_FRIENDS}` },
    { key: 'coop' as const, icon: 'flag', label: isPt ? 'Grupo' : 'Group' },
  ];

  return (
    <div className="sm2-lib">
      <div className="sm2-lib-ttl">
        {/* `groups` 24 pelado marca a Biblioteca (D-S2) — nunca `person` em box. */}
        {!embedded && (
          <h1 className="sm2-lib-h2">
            <Icon name="groups" size={24} tone="muted" />
            {isPt ? 'Drive' : 'Drive'}
          </h1>
        )}
        {/* K6 (04/10/2026): a legenda da Biblioteca mora atrás do "?". */}
        <InfoTip language={language} label={isPt ? 'Sobre o Drive' : 'About the Drive'} align="left" style={{ minHeight: 24, justifyContent: 'flex-start' }}>
          {seenOnly
            ? (isPt ? 'Os Soulmons que já cruzaram o seu caminho.' : 'The Soulmons that have crossed your path.')
            : (isPt ? 'Veja outros jogadores e seus Soulmon.' : 'See other players and their Soulmon.')}
        </InfoTip>
      </div>

      {tab === 'friends' && (
        <form
          onSubmit={(e) => { e.preventDefault(); void addByName(); }}
          data-friend-add
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
              <Icon name="person" size={24} tone="muted" />
            </span>
            <Field
              value={addName}
              onChange={e => { setAddName(e.target.value); setAddMsg(null); }}
              placeholder={isPt ? 'Nome do amigo…' : "Friend's name…"}
              aria-label={isPt ? 'Nome da pessoa para convidar' : 'Name of the person to invite'}
              maxLength={40}
              style={{ paddingLeft: 44 }}
            />
          </div>
          <button type="submit" disabled={addBusy || !addName.trim()} style={{ ...sm2Button('primary', addBusy || !addName.trim(), 'sm'), flexShrink: 0 }}>
            {isPt ? 'Convidar' : 'Invite'}
          </button>
        </form>
      )}
      {tab === 'friends' && sugestoes.length > 0 && (
        <ul data-friend-suggestions aria-label={isPt ? 'Sugestões de nomes' : 'Name suggestions'} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sugestoes.map(n => (
            <li key={n}>
              <button type="button" onClick={() => { setAddName(n); setAddMsg(null); setSugestoes([]); }} style={sm2Button('outline', false, 'sm')}>{n}</button>
            </li>
          ))}
        </ul>
      )}
      {tab === 'friends' && addMsg && <p role="status" className="sm2-lib-s" data-friend-add-msg style={{ margin: 0 }}>{addMsg}</p>}

      {/* ── Convites recebidos (§242): a amizade só nasce quando a pessoa aceita ── */}
      {tab === 'friends' && social && social.incoming.length > 0 && (
        <section data-friend-invites aria-label={isPt ? 'Convites de amizade' : 'Friend invites'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 className="sm2-lib-s" style={{ margin: 0, fontWeight: 600 }}>{isPt ? 'Convites' : 'Invites'}</h3>
          {social.incoming.map(inv => (
            <div key={inv.id} data-friend-invite={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
              <span className="sm2-lib-s" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sm2-ink)' }}>{inv.name}</span>
              <button type="button" disabled={busyId === inv.id || friends.length >= MAX_FRIENDS} onClick={() => answerInvite(inv, false)} style={sm2Button('primary', busyId === inv.id || friends.length >= MAX_FRIENDS, 'sm')}>
                {friends.length >= MAX_FRIENDS ? (isPt ? `Limite de ${MAX_FRIENDS}` : `Limit of ${MAX_FRIENDS}`) : (isPt ? 'Aceitar' : 'Accept')}
              </button>
              <button type="button" disabled={busyId === inv.id} onClick={() => answerInvite(inv, true)} style={sm2Button('outline', busyId === inv.id, 'sm')}>{isPt ? 'Recusar' : 'Decline'}</button>
            </div>
          ))}
        </section>
      )}

      {/* ── Presentes recebidos: a notícia e o histórico de quem deu (§242) ── */}
      {tab === 'friends' && social && social.notes.length > 0 && (
        <section data-friend-gifts aria-label={isPt ? 'Presentes recebidos' : 'Gifts received'} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h3 className="sm2-lib-s" style={{ margin: 0, fontWeight: 600 }}>{isPt ? 'Presentes' : 'Gifts'}</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 132, overflowY: 'auto' }}>
            {social.notes.slice(0, 10).map(n => (
              <li key={n.at + ':' + n.name} data-gift-note={n.unseen ? 'new' : 'seen'} className="sm2-lib-s" style={{ color: n.unseen ? 'var(--sm2-primary-ink)' : undefined, fontWeight: n.unseen ? 600 : undefined }}>
                {n.bits > 0
                  ? (isPt ? `${n.name || 'Um amigo'} te deu ${n.bits} Bits` : `${n.name || 'A friend'} gave you ${n.bits} Bits`)
                  : (isPt ? `${n.name || 'Um amigo'} te enviou um presente, mas o teto de ${social.dailyCap ?? 100} Bits do dia já tinha sido atingido (0 Bits)` : `${n.name || 'A friend'} sent you a gift, but the daily ${social.dailyCap ?? 100} Bits cap was already reached (0 Bits)`)}
                {' · '}{new Date(n.at).toLocaleDateString(isPt ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit' })}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'directory' && !outroPainel && (
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
          <Icon name="search" size={24} tone="muted" />
        </span>
        <Field
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={seenOnly ? (isPt ? 'Buscar Soulmon por nome…' : 'Search Soulmon by name…') : (isPt ? 'Buscar por nome…' : 'Search by name…')}
          aria-label={seenOnly ? (isPt ? 'Buscar Soulmon por nome' : 'Search Soulmon by name') : (isPt ? 'Buscar jogador por nome' : 'Search player by name')}
          style={{ paddingLeft: 44 }}
        />
      </div>
      )}

      {/* Abas SIS-04 (D-S3): a ativa em `primary-ink` + sublinhado 3px + glifo
          FILL 1; "onde estou" nunca é placa cheia. */}
      {hallTabs && (
      <div role="tablist" aria-label={isPt ? 'Seções do Drive' : 'Drive sections'} className="sm2-kit-tabs" data-library-tabs>
        {LIB_TABS.map(item => {
          const active = libTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={'sm2-libtab-' + item.key}
              aria-selected={active}
              aria-controls="sm2-libpanel"
              tabIndex={active ? 0 : -1}
              onClick={() => setLibTab(item.key)}
              onKeyDown={(e) => {
                const i = LIB_TABS.findIndex(t => t.key === item.key);
                const next = e.key === 'ArrowRight' ? LIB_TABS[(i + 1) % LIB_TABS.length] : e.key === 'ArrowLeft' ? LIB_TABS[(i + LIB_TABS.length - 1) % LIB_TABS.length] : null;
                if (!next) return;
                e.preventDefault();
                setLibTab(next.key);
                document.getElementById('sm2-libtab-' + next.key)?.focus();
              }}
              className={active ? 'sm2-kit-tab sm2-kit-tab-on' : 'sm2-kit-tab'}
              style={{ flex: '1 0 auto', padding: '0 12px', whiteSpace: 'nowrap', gap: 6 }}
            >
              {item.label}
              {((item.key === 'wild' && (novos.bestiary.size > 0 || novos.strays.size > 0)) || (item.key === 'element' && novos.elements.size > 0)) && <NewBadge overlay={false} hidden />}
            </button>
          );
        })}
      </div>
      )}

      {!view && (
      <div role="tablist" aria-label={isPt ? 'Filtro de jogadores' : 'Player filter'} className="sm2-kit-tabs">
        {TABS.map(item => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={active ? 'sm2-kit-tab sm2-kit-tab-on' : 'sm2-kit-tab'}
              style={{ flex: '1 0 auto', padding: '0 12px', whiteSpace: 'nowrap' }}
            >
              <Icon name={item.icon} size={20} fill={active ? 1 : 0} tone="inherit" />
              {item.label}
            </button>
          );
        })}
      </div>
      )}

      {/* ── Selvagem / Desgarrado / Elemento (27/10/2026) ── */}
      {outroPainel && (
        <div role="tabpanel" id="sm2-libpanel" aria-labelledby={'sm2-libtab-' + libTab} data-library-panel={libTab}>
          {libTab === 'wild' && (
            <>
              <div style={{ margin: '0 0 12px' }} data-base-filter>
                <ElementBaseSlots slots={wildBases} isPt={isPt} onChange={(i, v) => setWildBases(s => s.map((x, j) => (j === i ? v : x)))} />
              </div>
              {/* 28/10/2026 (dono): Selvagem e Desgarrado moram na MESMA aba, em duas seções. */}
              <h3 className="sm2-lib-s" style={{ margin: '0 0 6px', fontWeight: 600 }}>{isPt ? 'Selvagem' : 'Wild'}</h3>
              <BestiaryCollection seen={bestiary} mode="wild" language={language} isNew={novos.bestiary} bases={wildBases} />
              <h3 className="sm2-lib-s" style={{ margin: '16px 0 6px', fontWeight: 600 }}>{isPt ? 'Desgarrado' : 'Stray'}</h3>
              {/* 01/11/2026 (dono): desgarrado de jogador (§213) junto, sem distinção. */}
              <BestiaryCollection seen={bestiary} mode="stray" language={language} isNew={novos.bestiary} players={strayPlayersSeen} playersNew={novos.strays} bases={wildBases} />
            </>
          )}
          {libTab === 'element' && <ElementDex defeated={defeatedElements} language={language} isNew={novos.elements} />}
        </div>
      )}

      {/* ── Grupo (Fase 4.3) ── */}
      {tab === 'coop' && (
        <CoopPanel saveId={saveId} language={language} metaDoDiaCumprida={metaDoDiaCumprida} playerDayTz={playerDayTz} mySprite={mySprite} />
      )}

      {/* O alerta é ÂMBAR (D-S6): filete + tinta `gold-ink` — "tente de novo" é
          convite, não culpa. Nunca `danger`. */}
      {actionError && tab !== 'coop' && !outroPainel && (
        <p role="alert" className="sm2-lib-alert">{actionError}</p>
      )}

      {/* ── Carregando ── */}
      {carregando && tab !== 'coop' && !outroPainel && (
        <p className="sm2-lib-busy">
          <Icon name="sync" size={24} tone="muted" className="animate-spin" />
          {isPt ? 'Procurando jogadores…' : 'Looking for players…'}
        </p>
      )}

      {/* ── Erro / sem rede: nunca confundido com "não há ninguém" ── */}
      {/* O erro de carga e do DIRETORIO; na aba Amigos a falha e por linha. */}
      {loadError && tab === 'directory' && !outroPainel && (
        <div className="sm2-lib-cstate">
          <Icon name="cloud_off" size={48} tone="muted" />
          <p className="sm2-stats-t">
            {isPt ? 'Não deu para falar com o servidor.' : "Couldn't reach the server."}
          </p>
          <p className="sm2-lib-s" style={{ margin: 0 }}>
            {isPt ? 'Pode ser a sua conexão. Tente de novo em instantes.' : 'It may be your connection. Try again in a moment.'}
          </p>
          {/* Saída com fronteira (`outline`), nunca `ghost` (D-S10). */}
          <button type="button" onClick={() => setReloadKey(k => k + 1)} style={{ ...sm2Button('outline', false, 'sm'), marginTop: 6, width: '100%', maxWidth: 200 }}>
            <Icon name="refresh" size={20} />
            {isPt ? 'Tentar de novo' : 'Try again'}
          </button>
        </div>
      )}

      {seenOnly && tab === 'directory' && !outroPainel && (
        <div style={{ margin: '0 0 12px' }} data-base-filter>
          <ElementBaseSlots slots={petBases} isPt={isPt} onChange={(i, v) => setPetBases(s => s.map((x, j) => (j === i ? v : x)))} />
        </div>
      )}

      {/* ── Vazio: UMA frase, sem ilustração, sem "0 friends" ── */}
      {list && list.length === 0 && tab !== 'coop' && !outroPainel && !(loadError && tab === 'directory') && (
        <p className="sm2-lib-s" style={{ textAlign: 'center', padding: '24px 0', margin: 0 }}>
          {tab === 'friends'
            ? (isPt ? 'Você ainda não tem amigos. Convide alguém pelo nome acima.' : 'You have no friends yet. Invite someone by name above.')
            : onlySeen
              ? (filteringPets
                ? (isPt ? 'Nenhum Soulmon com essas bases.' : 'No Soulmon with these bases.')
                : searchLower
                ? (isPt ? 'Nenhum Soulmon com esse nome.' : 'No Soulmon has that name.')
                : (isPt ? 'Os Soulmons que você abrir ficam guardados nesta lista. Para achar alguém novo, busque pelo nome.' : 'The Soulmons you open stay on this list. To find someone new, search by name.'))
              : (isPt ? 'Nenhum jogador com esse nome.' : 'No player by that name.')}
        </p>
      )}

      {seenOnly && tab === 'directory' && !outroPainel && list && list.length > 0 && (
        <div className="sm2-lib-grid" data-pet-grid style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          {list.map(p => {
            const sprite = isSafeSpriteSrc(p.spriteUrl) ? p.spriteUrl : opponentSprite(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedPet(p); markSeen(p.id); }}
                aria-label={nomeDe(p)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 4, minHeight: 44, background: 'none', border: 0, cursor: 'pointer', minWidth: 0 }}
              >
                <MiniGlass size={64}>
                  <img src={sprite} alt="" width={64} height={64} style={{ display: 'block', width: 64, height: 64, objectFit: 'contain', imageRendering: 'pixelated' }} />
                </MiniGlass>
                <span className="sm2-lib-s" style={{ fontSize: 12, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomeDe(p)}</span>
              </button>
            );
          })}
        </div>
      )}

      {selectedPet && (() => {
        const atual = sanitizeForm(formaAtualDe(selectedPet));
        const vistas = formsMap[selectedPet.id] ?? [];
        // Só o que foi visto: sem histórico, a forma atual é a única (a gravação roda ao carregar a lista).
        const formas: SeenForm[] = vistas.length > 0 ? vistas : (atual ? [atual] : []);
        const nome = selectedPet.petName || selectedPet.name;
        return (
          <RitualDialog onClose={() => setSelectedPet(null)} labelledBy="sm2-pet-title" closeLabel={isPt ? 'Fechar' : 'Close'} maxWidth={320} closeOnBackdrop>
            <h2 id="sm2-pet-title" className="sm2-lib-h2" style={{ minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: 48 }}>
              {nome}
            </h2>
            <ul data-pet-forms aria-label={isPt ? 'Formas que você já viu' : 'Forms you have seen'} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '55vh', overflowY: 'auto' }}>
              {formas.map(f => {
                const atualAqui = isCurrentForm(f, atual);
                const src = opponentSprite({ ...selectedPet, stage: f.stage, spriteUrl: f.spriteUrl });
                const icon = f.element ? elementIcon(f.element) : undefined;
                return (
                  <li key={f.stage + '|' + (f.spriteUrl ?? '')} data-pet-form={f.stage} data-current={atualAqui ? '1' : '0'} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={src} alt={`${nome} — ${formStageLabel(f.stage, isPt)}`} width={96} height={96} style={{ display: 'block', width: 96, height: 96, flex: '0 0 96px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <span className="sm2-stats-t" style={{ margin: 0 }}>{formStageLabel(f.stage, isPt)}</span>
                      {f.element && (
                        <span className="sm2-lib-s" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {icon && <img src={icon} alt="" aria-hidden="true" width={20} height={20} style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                          {dexElementName(f.element, isPt)}
                        </span>
                      )}
                      {atualAqui && <span className="sm2-lib-s" data-pet-form-now style={{ color: 'var(--sm2-primary-ink)', fontWeight: 600 }}>{isPt ? 'Forma atual' : 'Current form'}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="sm2-lib-s" style={{ margin: '12px 0 0' }}>
              {isPt ? 'Dono' : 'Owner'}: {selectedPet.isNpc ? (isPt ? 'demonstração' : 'demo') : selectedPet.name}
            </p>
          </RitualDialog>
        );
      })()}

      <div className="sm2-lib-list">
        {!(seenOnly && tab === 'directory') && list?.map(p => {
          const isNpc = !!p.isNpc;
          const isFriend = friends.includes(p.id);
          const gifted = giftedToday.has(p.id);
          const sprite = isSafeSpriteSrc(p.spriteUrl) ? p.spriteUrl : opponentSprite(p);
          return (
            <div key={p.id} className="sm2-lib-row">
              {/* A linha inteira é UM botão: abrir o perfil é a ação dominante,
                  e um `<div onClick>` não é alcançável pelo teclado. */}
              <button
                type="button"
                onClick={() => { setSelectedPlayer(p); markSeen(p.id); onVisitPlayer?.(); }}
                aria-label={isPt ? `Ver o perfil de ${nomeDe(p)}` : `View ${nomeDe(p)}'s profile`}
                className="sm2-lib-who"
              >
                {/* A identidade do outro é a CRIATURA num mini-visor 64² sem
                    anel (D-S1/D-S2): sprite 256² a 64 (0,25×). A linha que não
                    carregou fica com o vidro APAGADO — sem "?", sem `person`. */}
                <MiniGlass size={64}>
                  {!p.unresolved && (
                    <img
                      src={sprite}
                      alt=""
                      width={64}
                      height={64}
                      style={{ display: 'block', width: 64, height: 64, objectFit: 'contain', imageRendering: 'pixelated' }}
                    />
                  )}
                </MiniGlass>
                <span className="sm2-lib-nm">
                  <span className="t">
                    {nomeDe(p)}
                    {isNpc && (
                      <span className="s" style={{ marginLeft: 6 }}>{isPt ? '· demonstração' : '· demo'}</span>
                    )}
                  </span>
                  <span className="s sm2-num">
                    {p.unresolved
                      ? (isPt ? 'Não deu para carregar o perfil agora.' : "Couldn't load this profile right now.")
                      // WP4.11 / proibição #21: o `rank` saiu. Número que sobe
                      // e desce conforme o outro joga é métrica de desempenho
                      // alheio, e um diretório de amigos é o pior lugar para ela.
                      : seenOnly && p.petName && !isNpc
                        ? p.name
                        : isPt
                          ? `${p.daysPlaying} dias jogando`
                          : `${p.daysPlaying} days playing`}
                  </span>
                </span>
              </button>

              {!isNpc && isFriend && tab === 'friends' && !p.unresolved && !removeMode && trainer && (
                <RowAction
                  icon="swords"
                  tone="ink"
                  label={isPt ? `Treinar com ${p.name}` : `Train with ${p.name}`}
                  onClick={() => setTrainingWith(p)}
                />
              )}
              {/* Presente: some pelo resto do dia depois de enviado (o servidor é quem sabe, `sentToday`). */}
              {!isNpc && isFriend && tab === 'friends' && !removeMode && !gifted && !(social?.sentToday ?? []).includes(p.id) && (
                <RowAction
                  icon="volunteer_activism"
                  tone="ink"
                  busy={busyId === p.id}
                  disabled={!canGiftToday}
                  label={!canGiftToday
                    ? (isPt ? 'Termine as tarefas de hoje para presentear' : "Finish today's tasks to send a gift")
                    : (isPt ? `Enviar 20 Bits para ${p.name}` : `Send 20 Bits to ${p.name}`)}
                  onClick={() => gift(p.id)}
                  onInert={() => setAddMsg(isPt ? 'Para presentear, termine as tarefas de hoje (a mesma meta que libera o Bosque).' : "To send a gift, finish today's tasks (the same goal that unlocks the Grove).")}
                />
              )}
              {/* Remover só existe no modo "Remover amigos", com dupla confirmação. */}
              {!isNpc && isFriend && removeMode && (
                <RowAction
                  icon="do_not_disturb_on"
                  tone="muted"
                  fill={0}
                  busy={busyId === p.id}
                  label={isPt ? `Remover ${p.name} dos amigos` : `Remove ${p.name} from friends`}
                  onClick={() => setConfirmRemove({ p, step: 1 })}
                />
              )}
              {!isNpc && !isFriend && (
                <RowAction
                  icon="add"
                  tone="primary"
                  fill={1}
                  busy={busyId === p.id}
                  disabled={friends.length >= MAX_FRIENDS || (social?.outgoing ?? []).includes(p.id)}
                  label={(social?.outgoing ?? []).includes(p.id)
                    ? (isPt ? `Convite enviado para ${p.name}` : `Invite sent to ${p.name}`)
                    : friends.length >= MAX_FRIENDS
                      ? (isPt ? `Limite de ${MAX_FRIENDS} amigos` : `Limit of ${MAX_FRIENDS} friends`)
                      : (isPt ? `Convidar ${p.name} para ser amigo` : `Invite ${p.name} to be a friend`)}
                  onClick={() => toggleFriend(p)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Cantinho discreto: liga/desliga o modo de excluir. Texto pequeno, sem cor de alerta. */}
      {tab === 'friends' && friends.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            data-remove-friends-toggle
            aria-pressed={removeMode}
            onClick={() => setRemoveMode(v => !v)}
            className="sm2-lib-s"
            style={{ background: 'none', border: 0, cursor: 'pointer', minHeight: 44, padding: '0 4px', textDecoration: 'underline' }}
          >
            {removeMode ? (isPt ? 'Concluir' : 'Done') : (isPt ? 'Remover amigos' : 'Remove friends')}
          </button>
        </div>
      )}

      {confirmRemove && (
        <RitualDialog onClose={() => setConfirmRemove(null)} labelledBy="sm2-rm-title" closeLabel={isPt ? 'Fechar' : 'Close'} maxWidth={320} closeOnBackdrop>
          <h2 id="sm2-rm-title" className="sm2-lib-h2" style={{ minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: 48 }}>
            {confirmRemove.step === 1 ? (isPt ? `Remover ${confirmRemove.p.name}?` : `Remove ${confirmRemove.p.name}?`) : (isPt ? 'Tem certeza?' : 'Are you sure?')}
          </h2>
          <p className="sm2-lib-s" data-remove-step={confirmRemove.step} style={{ margin: '0 0 12px' }}>
            {confirmRemove.step === 1
              ? (isPt ? 'A amizade acaba para vocês dois.' : 'The friendship ends for both of you.')
              : (isPt ? 'Para voltar, vocês precisam de um novo convite.' : 'To be friends again you need a new invite.')}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setConfirmRemove(null)} style={{ ...sm2Button('outline', false, 'sm'), flex: 1 }}>{isPt ? 'Cancelar' : 'Cancel'}</button>
            <button
              type="button"
              data-remove-confirm
              onClick={async () => {
                if (confirmRemove.step === 1) { setConfirmRemove({ p: confirmRemove.p, step: 2 }); return; }
                const alvo = confirmRemove.p;
                setConfirmRemove(null);
                await toggleFriend(alvo);
              }}
              style={{ ...sm2Button('primary', false, 'sm'), flex: 1 }}
            >
              {confirmRemove.step === 1 ? (isPt ? 'Continuar' : 'Continue') : (isPt ? 'Remover' : 'Remove')}
            </button>
          </div>
        </RitualDialog>
      )}

      {trainingWith && trainer && (
        <Suspense fallback={null}>
          <FriendTraining friend={trainingWith} trainer={trainer} isPt={isPt} onClose={() => setTrainingWith(null)} />
        </Suspense>
      )}

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
