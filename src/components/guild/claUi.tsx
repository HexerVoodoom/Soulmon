/**
 * PEÇAS COMUNS DOS PRÉDIOS DO CLÃ (Praça, Plantio, Mistério): o contrato de props, o carregamento do estado
 * do prédio, a trava de duplo toque e a tradução de erro. Cada prédio só diz o QUE chamar e COMO desenhar.
 *
 * Erro: 409 é ESTADO ("já foi feito", talvez de outro aparelho) -> relê em silêncio e o botão certo aparece;
 * qualquer outro vira a frase calma (`guild.cla.erro`, ou "sem rede" quando é o caso). Nunca acusa a pessoa.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { GuildError, type GuildView } from '../../utils/community';
import type { PlayerDayAnchor } from '../../utils/playerDay';
import type { GuildKey } from '../../utils/guildCopy';
import { ALL_SHOP_ITEMS } from '../../utils/shop';
import type { Language } from '../../utils/i18n';
import type { ClaReward } from '../../utils/claApi';

export type ClaT = (k: GuildKey, vars?: Record<string, string | number>) => string;

/** A ponte dos prêmios com o save: o App credita UMA vez por recibo (`utils/claCredit.ts`). */
export type ClaOnReward = (receipt: string, rewards: ClaReward[]) => void;

export interface ClaSalaProps {
  saveId: string;
  language: Language;
  t: ClaT;
  guild: GuildView;
  tz: PlayerDayAnchor | undefined;
  reducedMotion: boolean;
  mySprite: string;
  onReward: ClaOnReward;
  /** Região viva da folha: o leitor de tela anuncia o fato. */
  onAnnounce: (text: string) => void;
}

/** O nome (na língua) de um item de decoração da loja; sem cadastro, o próprio id. */
export function decorName(language: Language, id: string): string {
  const it = ALL_SHOP_ITEMS.find(x => x.id === id);
  return it ? (language === 'pt-BR' ? it.namePt : it.nameEn) : id;
}

/** A frase do que se recebeu (Bits, item, comida). */
export function rewardText(t: ClaT, language: Language, r: ClaReward): string {
  if (r.kind === 'bits') return t('guild.cla.recebeu.bits', { bits: r.amount });
  if (r.kind === 'food') return t('guild.cla.recebeu.comida');
  if (r.kind === 'chip') return t('guild.cla.recebeu.item', { nome: t(`guild.cla.item.${r.id.replace('-', '.')}` as GuildKey) });
  return t('guild.cla.recebeu.item', { nome: decorName(language, r.id) });
}

/** O estado de um prédio: carrega ao montar, relê em silêncio e guarda o erro como frase. */
export function useClaBuilding<V>(load: () => Promise<V>) {
  const [view, setView] = useState<V | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(false);
  const vivo = useRef(true);
  const busy = useRef(false);
  const seq = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => { vivo.current = true; return () => { vivo.current = false; }; }, []);

  const recarregar = useCallback(async (silencioso: boolean) => {
    const meu = ++seq.current;
    if (!silencioso) setStatus('loading');
    try {
      const v = await loadRef.current();
      if (!vivo.current || meu !== seq.current) return;
      setView(v);
      setStatus('ready');
    } catch {
      if (!vivo.current || meu !== seq.current) return;
      if (!silencioso) setStatus('error');
    }
  }, []);

  useEffect(() => { void recarregar(false); }, [recarregar]);

  /** UMA ação por vez; devolve o que `fn` devolveu, ou `undefined` se falhou/estava ocupado. */
  const agir = useCallback(async <R,>(fn: () => Promise<R>): Promise<R | undefined> => {
    if (busy.current) return undefined;
    busy.current = true;
    setOcupado(true);
    setErro(false);
    try {
      return await fn();
    } catch (e) {
      if (!vivo.current) return undefined;
      if (e instanceof GuildError && e.status === 409) void recarregar(true);
      else setErro(true);
      return undefined;
    } finally {
      busy.current = false;
      if (vivo.current) setOcupado(false);
    }
  }, [recarregar]);

  return { view, setView, status, ocupado, erro, agir, recarregar };
}
