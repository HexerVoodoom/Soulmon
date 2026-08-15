import { useState } from 'react';
import { bitsStyle, emblemStyle, BITS_EXCHANGE } from '../utils/currencies';
import { PixelButton, PixelChip, PixelMeter, PixelSlot, PixelTabs, type PixelTabItem } from './pixel/PixelKit';
import iconClose from '../assets/soulmon/icons/icon-close.png';
// Ícones das abas saem do kit existente — ZERO arte nova nesta rodada. Onde
// não havia ícone exato (não existe "sofá" nem "moldura" no kit), o mais
// próximo semanticamente: mapa = cenário, casa = mobília.
import iconMap from '../assets/soulmon/icons/icon-map.png';
import iconHome from '../assets/soulmon/icons/icon-home.png';
import iconLock from '../assets/soulmon/icons/icon-lock.png';
import iconPotion from '../assets/soulmon/icons/icon-potion.png';
import iconSwords from '../assets/soulmon/icons/games/icon-game-dungeon.png';
import iconShield from '../assets/soulmon/icons/icon-shield.png';
import iconGem from '../assets/soulmon/icons/icon-gem.png';
import { SHOP_ITEMS, TOURNAMENT_ITEMS, type ShopItem } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { DECOR_ART } from '../utils/decorArt';
import { MISSIONS, isShopItemUnlocked } from '../utils/missions';
import { decorFitsSetting, type SlotId } from '../utils/petStage';
import type { Language } from '../utils/i18n';

/**
 * Loja — gasta Bits ganhos nos minijogos. Organizada em abas (Itens /
 * Cenários / Mobílias / Torneio / Missões). Itens podem estar BLOQUEADOS por
 * missão: renderizam escurecidos com cadeado; tocar mostra como desbloquear.
 *
 * ─── Rodada 2 do alinhamento visual (G4) ──────────────────────────────────
 * Esta tela era o exemplo citado na análise de gap: fundo claro, cards
 * brancos com sombra Material, abas com sublinhado e ícones em line-art
 * vetorial (lucide). Nenhuma arte nova entrou; o que mudou foi a LIGAÇÃO:
 *
 *  · card  → `.sm-px-card` (moldura de cobre chanfrada, sem sombra)
 *  · aba   → `PixelTabs` — o conserto do G9: a seleção passa a ser o
 *            PREENCHIMENTO, que é a única leitura que não inverte entre temas
 *  · botão → `PixelButton`
 *  · ícone → `PixelSlot` com arte do kit; **o fallback é o quadro VAZIO,
 *            nunca o emoji do sistema** (portão T2)
 *  · barra de missão → `PixelMeter` (trilho quadrado, não pílula)
 *
 * O emoji em `item.icon` continua sendo a CHAVE de inventário dos
 * consumíveis (App.tsx `handleShopBuy`/`handleFeed`) — nunca visual.
 */
type ShopTab = 'items' | 'bg' | 'furniture' | 'tournament' | 'missions';

export function ShopModal({
  language, points, ownedBackgrounds, equippedBackground, ownedFurniture, equippedDecor,
  missionProgress, emblems, credits, onBuy, onExchangeCredits, onEquip, onEquipFurniture, onClose,
  asPage = false,
}: {
  language: Language;
  points: number;
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  ownedFurniture: string[];
  /** Decoração equipada por espaço do palco (utils/petStage.ts). */
  equippedDecor: Partial<Record<SlotId, string>>;
  /** Progress per mission id (clamped to its target) — utils/missions.ts. */
  missionProgress: Record<string, number>;
  /** Emblemas (moeda do Torneio) e Créditos (dinheiro real) — ver utils/currencies.ts. */
  emblems: number;
  credits: number;
  onBuy: (itemId: string) => boolean;
  /** Troca Créditos por Bits. Devolve false se o servidor recusar o gasto. */
  onExchangeCredits: (credits: number) => Promise<boolean>;
  onEquip: (id: string | null) => void;
  /** `id` null limpa o espaço; o slot é sempre obrigatório. */
  onEquipFurniture: (id: string | null, slot: SlotId) => void;
  onClose: () => void;
  /** Renderiza como página cheia dentro do fluxo normal (BottomNav → Loja
   *  virou view de verdade, não modal por cima da tela atual) em vez de
   *  overlay fixo centralizado. */
  asPage?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const [tab, setTab] = useState<ShopTab>('items');
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
  /** Item id whose unlock hint is expanded (tap a locked item to toggle). */
  const [hintFor, setHintFor] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);

  const buy = (item: ShopItem) => {
    const ok = onBuy(item.id);
    setFlash({ id: item.id, ok });
    setTimeout(() => setFlash(null), 900);
    try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
  };

  // How to unlock a locked item (shown when the user taps it).
  const unlockHint = (item: ShopItem): string => {
    if (!item.unlock) return '';
    const m = MISSIONS.find(x => x.id === item.unlock!.missionId);
    if (!m) return '';
    const cur = missionProgress[m.id] ?? 0;
    const prog = m.target > 1 ? ` (${cur}/${m.target})` : '';
    // Sem o emoji da missão aqui: a dica é FRASE, e emoji do sistema no meio
    // de conteúdo é o que o portão T2 conta. O nome já identifica a missão.
    return `${isPt ? 'Missão' : 'Mission'} ${isPt ? m.namePt : m.nameEn}: ${isPt ? m.descPt : m.descEn}${prog}`;
  };

  const TABS: readonly PixelTabItem<ShopTab>[] = [
    { key: 'items', icon: iconPotion, label: isPt ? 'Itens' : 'Items' },
    { key: 'bg', icon: iconMap, label: isPt ? 'Cenários' : 'Backdrops' },
    { key: 'furniture', icon: iconHome, label: isPt ? 'Mobílias' : 'Furniture' },
    { key: 'tournament', icon: iconSwords, label: isPt ? 'Torneio' : 'Tournament' },
    { key: 'missions', icon: iconShield, label: isPt ? 'Missões' : 'Missions' },
  ];

  const TAB_ITEMS: Record<Exclude<ShopTab, 'missions'>, ShopItem[]> = {
    items: SHOP_ITEMS.filter(i => i.kind === 'chip' || i.kind === 'heart'),
    bg: SHOP_ITEMS.filter(i => i.kind === 'bg'),
    furniture: SHOP_ITEMS.filter(i => i.kind === 'furniture'),
    tournament: TOURNAMENT_ITEMS,
  };

  /** Saldo da moeda que compra este item. */
  const balanceFor = (item: ShopItem) => (item.currency === 'emblems' ? emblems : points);

  /** Preço com a leitura da moeda certa — nunca o 💎, que é dos Créditos. */
  // No botão primário (roxo) o preço vai em CLARO: o dourado do emblemStyle é
  // escuro e sumia no fundo. A identidade dourada fica no ícone e no saldo.
  // Emblemas: dourado com serifa, e agora sobre o fill do botão do kit (peça
  // escura), então o dourado do token volta a ser legível — não precisa mais
  // ser branqueado como no botão roxo do sistema antigo.
  const priceLabel = (item: ShopItem) => (item.currency === 'emblems'
    ? <span style={{ ...emblemStyle, color: 'color-mix(in srgb, var(--sm-gold) 45%, white)' }}>{item.price}</span>
    : <>{item.price} Bits</>);

  const renderItem = (item: ShopItem) => {
    const unlocked = isShopItemUnlocked(item, missionProgress);
    const isEquippable = item.kind === 'bg' || item.kind === 'furniture';
    const ownedList = item.kind === 'bg' ? ownedBackgrounds : item.kind === 'furniture' ? ownedFurniture : [];
    const owned = isEquippable && ownedList.includes(item.id);
    const equippedId = item.kind === 'bg' ? equippedBackground
      : item.kind === 'furniture' && item.slot ? (equippedDecor[item.slot] ?? null)
      : null;
    const equipped = owned && equippedId === item.id;
    // Decoração equipada num cenário onde ela não aparece: dizer isso é o que
    // separa "não combina" de "o app engoliu meu item". O cenário atual manda.
    const stageBg = equippedBackground ? PET_BACKGROUNDS[equippedBackground] : null;
    const showsHere = item.kind !== 'furniture' || !item.slot || !stageBg
      ? true
      : stageBg.slots.includes(item.slot) && decorFitsSetting(item.fits ?? 'any', stageBg.setting);
    // Cada item cobra na SUA moeda — Emblemas não compram item de Bits nem
    // o contrário (ver utils/currencies.ts).
    const affordable = balanceFor(item) >= item.price;
    const flashHere = flash?.id === item.id;
    const showHint = hintFor === item.id;
    const canBuy = unlocked && affordable;

    // Ordem da arte, sempre a mesma: prévia do cenário → arte da decoração →
    // ícone do kit → QUADRO VAZIO. O emoji do sistema não é mais o último
    // degrau — o quadro vazio é. Sem isso, um item sem arte reintroduzia
    // sozinho o gap G2 numa tela inteira (portão T2).
    const iconEl = (
      <PixelSlot
        background={item.kind === 'bg' ? PET_BACKGROUNDS[item.id]?.css : undefined}
        src={item.kind === 'bg' ? undefined : (DECOR_ART[item.id] ?? item.iconImg)}
        locked={!unlocked}
        overlay={!unlocked ? (
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.28)' }}>
            <img src={iconLock} alt="" width={20} height={20} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          </span>
        ) : undefined}
      />
    );

    const cardCls = ['sm-px-card'];
    if (!unlocked) cardCls.push('sm-px-card-tap');
    if (flashHere) cardCls.push(flash!.ok ? 'sm-px-card-ok' : 'sm-px-card-fail');

    return (
      <div
        key={item.id}
        onClick={() => { if (!unlocked) setHintFor(showHint ? null : item.id); }}
        className={cardCls.join(' ')}
        style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
      >
        {iconEl}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nome e descrição continuam em SANS: são frase de leitura, e a
              regra de dois níveis do G5 manda bitmap só em rótulo/número. */}
          <p style={{ color: unlocked ? 'var(--sm-ink)' : 'var(--sm-muted)', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
            {isPt ? item.namePt : item.nameEn}
          </p>
          <p style={{ color: 'var(--sm-muted)', fontSize: '0.72rem', margin: 0 }}>
            {isPt ? item.descPt : item.descEn}
          </p>
        </div>
        {/* action */}
        {owned ? (
          <PixelButton
            size="sm"
            variant={equipped ? 'primary' : 'default'}
            onClick={() => {
              // Decoração precisa dizer QUAL espaço mexer: ao desequipar não
              // há item de onde deduzir o slot (era o bug que fazia o botão
              // "Equipado" não desequipar nada).
              if (item.kind === 'bg') onEquip(equipped ? null : item.id);
              else if (item.slot) onEquipFurniture(equipped ? null : item.id, item.slot);
            }}
          >
            {equipped ? (isPt ? 'Equipado' : 'Equipped') : (isPt ? 'Equipar' : 'Equip')}
          </PixelButton>
        ) : (
          <PixelButton
            size="sm"
            disabled={unlocked && !canBuy}
            icon={unlocked ? undefined : iconLock}
            ariaLabel={unlocked ? undefined : (isPt ? 'Bloqueado — toque para ver como desbloquear' : 'Locked — tap to see how to unlock')}
            onClick={() => { if (unlocked) buy(item); else setHintFor(showHint ? null : item.id); }}
          >
            {unlocked ? priceLabel(item) : ''}
          </PixelButton>
        )}
        {/* Aviso de composição — só para o que está equipado e não aparece. */}
        {equipped && !showsHere && (
          <p className="sm-px-card" style={{ width: '100%', margin: 0, padding: '8px 10px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'var(--sm-gold-soft)', color: 'var(--sm-ink)' }}>
            {isPt
              ? 'Equipado, mas não aparece no cenário atual — troque de cenário para vê-lo.'
              : "Equipped, but it doesn't show in the current scene — switch scenes to see it."}
          </p>
        )}
        {/* unlock hint "tooltip" — expands inside the card when tapped */}
        {!unlocked && showHint && (
          <p className="sm-px-card" style={{ width: '100%', margin: 0, padding: '8px 10px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'var(--sm-gold-soft)', color: 'var(--sm-ink)' }}>
            {isPt ? 'Como desbloquear:' : 'How to unlock:'} {unlockHint(item)}
          </p>
        )}
      </div>
    );
  };

  const renderMissions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ color: 'var(--sm-muted)', fontSize: '0.72rem', textAlign: 'center', margin: 0 }}>
        {isPt
          ? 'Complete missões para liberar a compra de itens exclusivos da loja.'
          : 'Complete missions to unlock the purchase of exclusive shop items.'}
      </p>
      {MISSIONS.map(m => {
        const cur = missionProgress[m.id] ?? 0;
        const done = cur >= m.target;
        const rewardItem = SHOP_ITEMS.find(i => i.id === m.bgReward);
        const rewardName = rewardItem ? (isPt ? rewardItem.namePt : rewardItem.nameEn) : m.bgReward;
        const goToReward = () => { setTab('bg'); setHintFor(rewardItem?.id ?? null); };
        return (
          <div key={m.id} className={done ? 'sm-px-card sm-px-card-ok' : 'sm-px-card'} style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <PixelSlot src={m.iconImg} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'var(--sm-ink)', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                {isPt ? m.namePt : m.nameEn}
              </p>
              <p style={{ color: 'var(--sm-muted)', fontSize: '0.72rem', margin: 0 }}>
                {isPt ? m.descPt : m.descEn}
              </p>
              {/* Recompensa — prévia visual do cenário + atalho pra ver na aba Cenários. */}
              <button
                onClick={goToReward}
                className="sm-px-chip-btn"
                style={{ margin: '6px 0 0', minHeight: 34, fontSize: '0.68rem' }}
              >
                {rewardItem && (
                  <span aria-hidden="true" style={{ width: 18, height: 18, flexShrink: 0, background: PET_BACKGROUNDS[rewardItem.id]?.css, backgroundSize: 'cover' }} />
                )}
                {isPt ? 'Libera:' : 'Unlocks:'} {rewardName}
              </button>
              {/* Progresso de missão é PROPORÇÃO (100 kills, 1000 de score),
                  não contagem curta: segmentar em blocos daria a entender que
                  existem N passos. Por isso `PixelMeter` e não a barra
                  segmentada — mas o trilho é o mesmo, quadrado. */}
              <PixelMeter
                ratio={cur / m.target}
                tone={done ? 'gold' : 'cyan'}
                height={10}
                style={{ marginTop: 6 }}
                label={isPt ? m.namePt : m.nameEn}
              />
              <p className="sm-px-label" style={{ color: done ? 'var(--sm-gold)' : 'var(--sm-muted)', marginTop: 4, marginBottom: 0 }}>
                {done
                  ? (isPt ? `Concluída — ${rewardName} liberado!` : `Done — ${rewardName} unlocked!`)
                  : m.target === 1 ? (isPt ? 'Pendente' : 'Pending') : `${cur}/${m.target}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const Wrapper = asPage
    ? ({ children }: { children: React.ReactNode }) => <>{children}</>
    : ({ children }: { children: React.ReactNode }) => (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(4, 18, 20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          {children}
        </div>
      );

  return (
    <Wrapper>
      <div
        className={asPage ? undefined : 'sm-px-card'}
        style={asPage
          ? { display: 'flex', flexDirection: 'column' }
          : { background: 'var(--sm-bg)', width: '100%', maxWidth: 420, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header — em modo página, sem título repetido nem X (a navegação já
            é a barra inferior) e sem fundo/borda própria (a página herda o
            visual do conteúdo ao redor). */}
        <div style={asPage
          ? { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 }
          : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)' }}>
          {!asPage && (
            <span className="sm-px-heading" style={{ fontSize: '0.95rem', color: 'var(--sm-ink)' }}>
              {isPt ? 'Loja' : 'Shop'}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* As TRÊS moedas nunca se confundem (utils/currencies.ts): a
                cápsula do kit é a mesma, mas o VALOR mantém o estilo próprio —
                serifa dourada nos Emblemas, calculadora neon nos Bits. Só o
                rótulo é bitmap, e ele diz o nome da moeda em letras. */}
            {tab === 'tournament' ? (
              <PixelChip
                label={isPt ? 'Emblemas' : 'Emblems'}
                title={isPt ? 'Emblemas — ganhe vencendo no Torneio' : 'Emblems — earn them by winning in the Tournament'}
                value={<span style={{ ...emblemStyle, color: 'color-mix(in srgb, var(--sm-gold) 40%, white)', fontSize: '0.85rem' }}>{emblems}</span>}
              />
            ) : (
              <PixelChip
                label="Bits"
                title={isPt ? 'Bits — ganhe nos minijogos' : 'Bits — earn them in the minigames'}
                value={<span style={{ ...bitsStyle, fontSize: '0.85rem' }}>{points}</span>}
              />
            )}
            {!asPage && (
              <button onClick={onClose} className="sm-px-arcade-close" aria-label={isPt ? 'Fechar' : 'Close'}>
                <img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              </button>
            )}
          </div>
        </div>

        {/* Abas — conserto do G9: a seleção é o PREENCHIMENTO, e é a mesma
            leitura nos dois temas. O sublinhado de 2,5px saiu. */}
        <PixelTabs
          items={TABS}
          value={tab}
          onChange={k => { setTab(k); setHintFor(null); }}
          ariaLabel={isPt ? 'Seções da loja' : 'Shop sections'}
          style={{ marginBottom: 10 }}
        />

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'missions'
            ? renderMissions()
            : TAB_ITEMS[tab].map(renderItem)}

          {/* Faltou Bit? Créditos (dinheiro real) viram Bits — nunca o
              contrário, senão dava pra farmar em minijogo a moeda que só o
              dinheiro real deveria abrir (ver utils/currencies.ts). */}
          {tab === 'items' && (
            <div className="sm-px-card" style={{ padding: 12, marginTop: 4 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--sm-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src={iconGem} alt="" width={15} height={15} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                {isPt ? `Trocar Créditos por Bits (você tem ${credits})` : `Swap Credits for Bits (you have ${credits})`}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {BITS_EXCHANGE.map(pack => (
                  <button
                    key={pack.credits}
                    className="sm-px-chip-btn"
                    disabled={credits < pack.credits || exchanging}
                    onClick={async () => {
                      setExchanging(true);
                      const ok = await onExchangeCredits(pack.credits);
                      setExchanging(false);
                      setFlash({ id: `exch-${pack.credits}`, ok });
                      setTimeout(() => setFlash(null), 900);
                    }}
                    style={{ flex: 1, flexDirection: 'column', gap: 2, padding: '8px 6px', lineHeight: 1.3 }}
                  >
                    {/* O 💎 aqui é ÍCONE DE MOEDA, não emoji decorativo: os
                        Créditos são a única das três que ainda não tem cápsula
                        própria, e trocar o gem por um quadro vazio apagaria a
                        distinção que existe justamente para o jogador não
                        confundir dinheiro real com Bits. Fica anotado como
                        dívida no relatório. */}
                    <span className="sm-px-value" style={{ fontSize: 12 }}>{pack.credits} 💎</span>
                    <span style={{ ...bitsStyle, fontSize: '0.68rem' }}>{'→'} {pack.bits} Bits</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p style={{ color: 'var(--sm-muted)', fontSize: '0.68rem', textAlign: 'center', margin: 0 }}>
            {tab === 'missions'
              ? (isPt ? 'Progresso conta desde o início do jogo.' : 'Progress counts from the very start.')
              : tab === 'tournament'
                ? (isPt ? 'Emblemas só vêm do Torneio — e só compram aqui.' : 'Emblems only come from the Tournament — and only buy here.')
                : (isPt ? 'Ganhe Bits nos minijogos! Itens bloqueados: toque para ver como desbloquear.' : 'Earn Bits in the minigames! Locked items: tap to see how to unlock.')}
          </p>
        </div>
      </div>
    </Wrapper>
  );
}
