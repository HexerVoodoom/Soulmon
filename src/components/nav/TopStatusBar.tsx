import { createContext, useContext, useLayoutEffect, type ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import { InfoTip } from '../ui/InfoTip';
import { CreditIcon } from '../ui/CreditIcon';
import { HonorIcon } from '../ui/HonorIcon';
import { BitsIcon } from '../ui/BitsIcon';
import { PixelIcon } from '../ui/PixelIcon';
import { statTip } from '../home/statTips';

/**
 * A BARRINHA DO TOPO (24/11/2026, P2 + arte da P6): faixa fina FIXA no topo do Mapa e dos prédios (`AreaSheet`).
 * ESQUERDA: Bits | Energia. DIREITA, colada ao canto: Honra | Créditos (diamante). No meio, espaço vazio (4 slots; sem Corações, ordem do dono 24/11/2026).
 * Cada valor mora numa bordinha de bronze (`.sm2-topbar__slot`, 9-slice horizontal). Layout e larguras em `.sm2-topbar*` no index.css.
 *
 * Os valores vêm por PROP (o Mapa) ou pelo `TopStatusBarContext` (as folhas dos prédios, que não recebem saldo: o `App` provê o contexto em volta do `AreaView`).
 * Sem prop e sem contexto, não renderiza nada (Home, testes de folha isolada).
 *
 * Enquanto montada, ela publica `--sm2-topbar-push` (a altura da faixa) na raiz do documento: as âncoras de canto (`cornerAnchor.ts`) e o topo das áreas
 * somam esse valor e descem para baixo da faixa; sem a barra o valor é 0 e nada muda.
 */
export interface TopStatusBarData {
  language: Language;
  credits: number;
  emblems: number;
  bits: number;
  /** Energia de agora e o teto (`maxEnergyOf`). */
  energy: number;
  maxEnergy: number;
}

export const TopStatusBarContext = createContext<TopStatusBarData | null>(null);

/** Valor grande abreviado: `99999` → `99k`, `1234` → `1.2k` (PT: `1,2k`). Abaixo de `de` devolve o número inteiro com milhar. */
export function abreviar(n: number, language: Language, de = 1000): string {
  const v = Math.max(0, Math.floor(n));
  if (v < de) return v.toLocaleString(language);
  const k = v / 1000;
  const txt = k >= 10 ? String(Math.floor(k)) : (Math.floor(k * 10) / 10).toFixed(1).replace(/\.0$/, '');
  return `${language === 'pt-BR' ? txt.replace('.', ',') : txt}k`;
}

/** Energia no slot: "atual/teto"; com teto de 2+ dígitos (>= 10) só o atual, para nunca cortar nos 60 px. */
export function formatEnergia(atual: number, teto: number): string {
  return teto >= 10 ? String(atual) : `${atual}/${teto}`;
}

const PUSH_VAR = '--sm2-topbar-push';
/** Barras montadas AGORA (a da cena e a da folha coexistem): o push só sai da raiz quando a ÚLTIMA desmonta — antes a primeira a sair zerava o push e o voltar do prédio subia para trás da barra (bug do dono, ao abrir o NPC). */
let barrasMontadas = 0;

export function TopStatusBar({ data, covered = false }: { data?: TopStatusBarData; covered?: boolean }) {
  const ctx = useContext(TopStatusBarContext);
  const d = data ?? ctx;
  const on = d != null;
  // Layout effect: o push existe ANTES da 1ª pintura (o index.css também o define por `:root:has([data-topbar])`, sem depender de JS).
  useLayoutEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    barrasMontadas += 1;
    root.style.setProperty(PUSH_VAR, 'var(--sm2-topbar-h)');
    return () => {
      barrasMontadas -= 1;
      if (barrasMontadas <= 0) { barrasMontadas = 0; root.style.removeProperty(PUSH_VAR); }
    };
  }, [on]);
  if (!d) return null;
  const isPt = d.language === 'pt-BR';
  const lang = d.language;

  const tip = () => {
    const t = statTip('energy', isPt);
    return <><b>{t.title}</b> — <b>{t.upLabel}</b> {t.up} <b>{t.downLabel}</b> {t.down}</>;
  };
  const slot = (id: string, label: string, icon: ReactNode, value: string, body: ReactNode, align: 'left' | 'right') => (
    <InfoTip
      key={id}
      language={lang}
      align={align}
      autoCloseMs={4000}
      label={label}
      className="sm2-topbar__slot"
      style={{ minHeight: 28 }}
      trigger={<span data-topbar-slot={id} className="sm2-topbar__in">{icon}<span className="sm2-topbar__val">{value}</span></span>}
    >
      {body}
    </InfoTip>
  );

  return (
    <div
      data-topbar
      data-covered={covered ? '' : undefined}
      className="sm2-topbar"
      style={covered ? { visibility: 'hidden' } : undefined}
      onClick={e => e.stopPropagation()}
    >
      <div className="sm2-topbar__grupo sm2-topbar__grupo--esq">
        {slot('bits', `${d.bits.toLocaleString(lang)} Bits — ${isPt ? 'como conseguir' : 'how to earn'}`, <BitsIcon size={24} />, abreviar(d.bits, lang, 10000),
          isPt ? 'Bits: ganhe cumprindo o dia (tarefas e hábitos) e jogando minijogos, a Masmorra e a Arena. Gaste na loja.' : 'Bits: earn them by finishing your day (tasks and habits) and playing minigames, the Dungeon and the Arena. Spend them in the shop.', 'left')}
        {slot('energia', isPt ? `Energia: ${d.energy} de ${d.maxEnergy}` : `Energy: ${d.energy} of ${d.maxEnergy}`, <PixelIcon name="energia" size={24} />, formatEnergia(d.energy, d.maxEnergy), tip(), 'left')}
      </div>
      <div className="sm2-topbar__grupo sm2-topbar__grupo--dir">
        {slot('honra', isPt ? `${d.emblems.toLocaleString(lang)} de Honra — como conseguir` : `${d.emblems.toLocaleString(lang)} Honor — how to earn`, <HonorIcon size={24} />, abreviar(d.emblems, lang),
          isPt ? 'Honra: ganhe em combates do Torneio, no treino e em missões da semana. Gaste na aba Honra das lojinhas.' : 'Honor: earn it in Tournament fights, sparring and weekly missions. Spend it in the Honor tab of the shops.', 'right')}
        {slot('credito', isPt ? `${d.credits.toLocaleString(lang)} Créditos — como conseguir` : `${d.credits.toLocaleString(lang)} Credits — how to get`, <CreditIcon size={24} />, abreviar(d.credits, lang),
          isPt ? 'Créditos: só por compra com dinheiro real. Servem para pacotes de Bits e para sortear de novo.' : 'Credits: only by purchase with real money. Use them for Bits packs and rerolls.', 'right')}
      </div>
    </div>
  );
}
