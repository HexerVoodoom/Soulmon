import { useState } from 'react';
import { bitsStyle, emblemStyle, BITS_EXCHANGE } from '../utils/currencies';
import { Icon } from './ui/Icon';
import { ModalSheet, Segment, sm2Button, sm2Hint, sm2Text, sm2TitleStyle } from './form/FormKit';
import { SHOP_ITEMS, TOURNAMENT_ITEMS, type ShopItem } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { DECOR_ART } from '../utils/decorArt';
import { ITEM_ART } from '../utils/itemArt';
import { MISSIONS, isShopItemUnlocked } from '../utils/missions';
import { decorFitsSetting, type SlotId } from '../utils/petStage';
import type { WeeklyMission, WeeklyMissionId } from '../utils/weeklyMissions';
import { UnlockNudge } from './UnlockAccountModal';
import type { Language } from '../utils/i18n';

/**
 * LOJA — revamp minimalista (Pokémon Sleep / Duolingo).
 *
 * ─── O que foi CORTADO, e por quê ──────────────────────────────────────────
 *
 * 1. **As 5 abas viraram 2 segmentos.** A única troca de contexto real numa
 *    loja é a MOEDA: Bits e Emblemas não se misturam (regra de produto), então
 *    "Loja" e "Torneio" são coisas diferentes de verdade. Itens / Cenários /
 *    Mobílias não são: são o mesmo gesto (comprar com Bits) fatiado em três
 *    cliques. Viraram SEÇÕES de um scroll vertical único — o padrão do Pokémon
 *    Sleep. Aba que só filtra a mesma moeda é navegação cobrando pedágio.
 *
 * 2. **A aba Missões morreu.** Ela existia para explicar por que 6 cenários
 *    estavam com cadeado — e explicava LONGE do cadeado, com o card da missão
 *    ainda carregando um botão "Libera: X" que levava de volta para a aba de
 *    Cenários. Agora o próprio card bloqueado diz a missão e o progresso
 *    (`3/100`) na linha de baixo. A lista de missões É a lista dos 6 cadeados,
 *    no lugar onde a recompensa importa. Some junto o estado `hintFor` (tocar
 *    para revelar): informação que decide a compra não pode depender de um
 *    toque exploratório.
 *
 * 3. **Toda a arte de ícone de interface.** 8 PNGs do kit + os 15 símbolos
 *    vetoriais de terceiro que `utils/shop.ts` importava. O card mostra o que o item É: prévia CSS
 *    do cenário, arte pixel da decoração, emoji do consumível (que é CONTEÚDO
 *    da pastinha, não ícone de sistema). Item sem arte não ganha um ícone
 *    decorativo — ganha espaço.
 *
 * ─── AS TRÊS MOEDAS (regra de produto, com teste travando) ─────────────────
 *
 *   Bits      → número em fonte de calculadora, **sem ícone nenhum**. A
 *               ausência de ícone É a distinção; é o que torna impossível
 *               repetir o bug do gem compartilhado.
 *   Emblemas  → `military_tech` em ouro + número com serifa.
 *   Créditos  → `diamond`, tom primário. UM desenho no app inteiro: o emoji
 *               de gem e o `icon-gem.png` que conviviam NESTA tela morreram aqui.
 *
 * A cor dos números saiu de `#39ff14`/`#b8860b` (hardcoded em currencies.ts,
 * ambos reprovados em AA sobre uma das superfícies) para os tokens de TINTA.
 * A identidade continua na FAMÍLIA tipográfica, que é o que currencies.ts
 * possui — e que continua sendo a fonte da verdade.
 */

type ShopSegment = 'shop' | 'tournament';

/**
 * OS DOIS EIXOS DE TAMANHO DESTA TELA (tokens.md §6.1 e §6.2).
 *
 * A Loja tinha CINCO tamanhos de ícone medidos na mesma tela (14, 16, 18, 22 e
 * 32) porque `size` é um número livre e cada call-site escolheu o seu. Os
 * degraus abaixo são os únicos que esta tela usa, e cada um tem UM papel — é o
 * papel, e não o espaço disponível no canto, que escolhe o número.
 */
/** Ícone ao lado de palavra, na mesma linha: preço, saldo, dica, pacote. */
const ICON_INLINE = 20;
/** Ícone que é a AÇÃO/ESTADO da linha do card: cadeado, "equipado". */
const ICON_ACTION = 24;

/** Caixa de arte do card. Ela manda no glifo de dentro — o emoji não é texto. */
const ART_BOX = 56;
/** Glifo de arte = metade da caixa. Derivado dela, nunca de `--sm2-text-*`. */
const ART_GLYPH = ART_BOX / 2;

/** Bits: exatamente o que `utils/currencies.ts` define — SEM override.
 *
 *  Havia aqui um `color: var(--sm2-ink)` por cima do estilo da moeda. Ele
 *  anulava o token da moeda (`--sm2-primary-ink`) no call-site e fazia o
 *  número dos Bits sair na mesma tinta do texto corrido: a distinção das três
 *  moedas passava a depender só da família tipográfica, num número de 12px.
 *  Era o padrão "inline vence o token" que o próprio `currencies.ts` declara
 *  ter eliminado, reintroduzido um nível acima.
 *
 *  Não havia motivo de contraste: `--sm2-primary-ink` MEDIDO sobre as três
 *  superfícies onde os Bits aparecem passa AA nos dois temas —
 *  bg 5,55 / 13,21 · surface 6,02 / 11,12 · surface-2 5,28 / 9,43 (claro /
 *  escuro), todos ≥ 4,5:1. O override era custo puro. */
const bitsNum = bitsStyle;
/** Emblemas: serifa de medalha, em ouro-TINTA (nunca o `*-fill`). Também sem
 *  override — `emblemStyle` já é `--sm2-gold-ink`; repetir a cor aqui era o
 *  mesmo call-site vencendo o token, só que por acaso com o valor certo. */
const emblemNum = emblemStyle;

export function ShopModal({
  language, points, ownedBackgrounds, equippedBackground, ownedFurniture, equippedDecor,
  missionProgress, emblems, credits, onBuy, onExchangeCredits, onEquip, onEquipFurniture, onClose,
  weeklyMissions, onClaimWeekly, accountTier, onUnlock,
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
  /** WP4.7 — as 3 missões da semana + o progresso, prontos. Vêm de fora porque
   *  a semana e o progresso moram no save e esta tela não decide nada. */
  weeklyMissions?: { mission: WeeklyMission; count: number; done: boolean; claimed: boolean }[];
  /** Paga os Emblemas de uma missão pronta. Idempotente do outro lado. */
  onClaimWeekly?: (id: WeeklyMissionId) => void;
  /** WP5.1 — o canal PASSIVO. `demo` vê o convite permanente aqui. */
  accountTier?: 'demo' | 'paid';
  onUnlock?: () => void;
  /** Renderiza como página cheia dentro do fluxo normal em vez de folha. */
  asPage?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const [seg, setSeg] = useState<ShopSegment>('shop');
  /** Última compra/troca: alimenta a região `aria-live` e o realce do card. */
  const [flash, setFlash] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [exchanging, setExchanging] = useState<number | null>(null);

  const say = (id: string, ok: boolean, msg: string) => {
    setFlash({ id, ok, msg });
    setTimeout(() => setFlash(f => (f && f.id === id ? null : f)), 2600);
    try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
  };

  const buy = (item: ShopItem) => {
    const name = isPt ? item.namePt : item.nameEn;
    const ok = onBuy(item.id);
    say(item.id, ok, ok
      ? (isPt ? `${name} comprado.` : `${name} purchased.`)
      : (isPt ? `Saldo insuficiente para ${name}.` : `Not enough to buy ${name}.`));
  };

  /** Missão que destrava o item + progresso, na LINHA do item. */
  const lockLine = (item: ShopItem): string => {
    const m = MISSIONS.find(x => x.id === item.unlock?.missionId);
    if (!m) return '';
    const cur = Math.min(missionProgress[m.id] ?? 0, m.target);
    /* WP4.12 (achado E4) — ZERO NÃO É PROGRESSO, é a ausência dele.
       A aba mostrava `0/100`, `0/3`, `0/1000`, `0/30` um embaixo do outro:
       uma coluna de zeros que lê como boletim, e o cadeado ao lado dizia a
       mesma coisa uma segunda vez. Quem nunca entrou na masmorra não precisa
       ver quantos inimigos faltam — precisa saber o que fazer.
       Com progresso REAL o número volta, porque aí ele descreve um caminho
       que já começou. */
    const prog = m.target > 1 && cur > 0 ? ` · ${cur}/${m.target}` : '';
    return `${isPt ? m.descPt : m.descEn}${prog}`;
  };

  const sections: { key: string; title: string; items: ShopItem[] }[] = seg === 'tournament'
    ? [{ key: 'tournament', title: isPt ? 'Prêmios do Torneio' : 'Tournament rewards', items: TOURNAMENT_ITEMS }]
    : [
        { key: 'items', title: isPt ? 'Itens' : 'Items', items: SHOP_ITEMS.filter(i => i.kind === 'chip' || i.kind === 'heart') },
        { key: 'bg', title: isPt ? 'Cenários' : 'Backdrops', items: SHOP_ITEMS.filter(i => i.kind === 'bg') },
        { key: 'furniture', title: isPt ? 'Mobílias' : 'Furniture', items: SHOP_ITEMS.filter(i => i.kind === 'furniture') },
      ];

  /** A CAIXA DE ARTE do card (tokens.md §6.2). 56px, e ela manda no que estiver
   *  dentro: prévia CSS do cenário, PNG da decoração, ou o emoji do consumível.
   *  A caixa não herda tipografia — `fontSize: 0` corta a herança de texto na
   *  fronteira, para que nenhum degrau de `--sm2-text-*` chegue aqui por
   *  acidente (foi assim que o emoji virou "texto de 32px" no audit). */
  const art = (item: ShopItem, dim: boolean) => {
    const css = item.kind === 'bg' ? PET_BACKGROUNDS[item.id]?.css : undefined;
    // Decoração é indexada pelo ID do item; consumível (chip/coraçãozinho)
    // pelo EMOJI, que é a chave de inventário dele (utils/itemArt.ts).
    const png = DECOR_ART[item.id] ?? ITEM_ART[item.icon];
    // Peça de CHÃO é 6,5:1 (104x16 — o pet anda por cima dela). `contain` numa
    // caixa quadrada de 56px espremia a arte numa tira de 7px de altura: o
    // card do Tufo de Grama chegava a parecer vazio. Chão é TEXTURA, então
    // `cover` (um pedaço ampliado dela) é a prévia honesta; para todo o resto,
    // que é objeto, `contain` continua sendo o certo — recortar um sofá pela
    // metade não diria o que ele é.
    return (
      <span
        aria-hidden="true"
        style={{
          width: ART_BOX, height: ART_BOX, flexShrink: 0,
          borderRadius: 'var(--sm2-radius-md)', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: css ?? 'var(--sm2-surface-2)', backgroundSize: 'cover',
          opacity: dim ? 0.4 : 1, fontSize: 0, lineHeight: 1,
        }}
      >
        {png
          ? <img src={png} alt="" width={48} height={48} style={{ objectFit: item.slot === 'rug' ? 'cover' : 'contain', imageRendering: 'pixelated' }} />
          : css ? null : (
            <span style={{ fontSize: ART_GLYPH, lineHeight: 1, display: 'block' }}>{item.icon}</span>
          )}
      </span>
    );
  };

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
    // separa "não combina" de "o app engoliu meu item".
    const stageBg = equippedBackground ? PET_BACKGROUNDS[equippedBackground] : null;
    const showsHere = item.kind !== 'furniture' || !item.slot || !stageBg
      ? true
      : stageBg.slots.includes(item.slot) && decorFitsSetting(item.fits ?? 'any', stageBg.setting);
    // Cada item cobra na SUA moeda — Emblemas não compram item de Bits nem o
    // contrário (ver utils/currencies.ts).
    const isEmblem = item.currency === 'emblems';
    const affordable = (isEmblem ? emblems : points) >= item.price;
    const name = isPt ? item.namePt : item.nameEn;
    const failing = flash?.id === item.id && !flash.ok;

    // O CARD INTEIRO é o alvo (régua 5) — não um botão de 60px no canto.
    const action = owned
      ? () => { if (item.kind === 'bg') onEquip(equipped ? null : item.id); else if (item.slot) onEquipFurniture(equipped ? null : item.id, item.slot); }
      : unlocked ? () => buy(item) : undefined;

    const status = owned
      ? (equipped ? (isPt ? 'Equipado' : 'Equipped') : (isPt ? 'Equipar' : 'Equip'))
      : null;

    const sub = !unlocked ? lockLine(item)
      : equipped && !showsHere ? (isPt ? 'Não aparece no cenário atual' : "Doesn't show in the current scene")
      : (isPt ? item.descPt : item.descEn);

    return (
      <button
        key={item.id}
        type="button"
        onClick={action}
        disabled={!action}
        aria-label={unlocked
          ? `${name} — ${owned ? status : `${item.price} ${isEmblem ? (isPt ? 'Emblemas' : 'Emblems') : 'Bits'}`}`
          : `${name} — ${isPt ? 'bloqueado' : 'locked'}: ${lockLine(item)}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, width: '100%',
          minHeight: 76, padding: 12, textAlign: 'left',
          border: failing ? '1px solid var(--sm2-danger-ink)' : '1px solid transparent',
          // Era 16px — um quarto raio na Loja, fora dos três degraus. Card é
          // `--sm2-radius-lg`.
          borderRadius: 'var(--sm2-radius-lg)',
          backgroundColor: 'var(--sm2-surface)',
          cursor: action ? 'pointer' : 'default',
          transition: 'border-color var(--sm2-dur-tap) var(--sm2-ease)',
        }}
      >
        {art(item, !unlocked)}

        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...sm2Text, fontWeight: 500, color: unlocked ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>{name}</span>
          {sub && <span style={{ ...sm2Hint, color: failing ? 'var(--sm2-danger-ink)' : 'var(--sm2-muted)' }}>{sub}</span>}
        </span>

        {/* Ação/preço. Ícone pelado, nunca dentro de caixa. */}
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {!unlocked ? (
            /* Cadeado e "equipado" ocupam a MESMA coluna de estado da linha, e
               por isso o mesmo degrau. Estavam em 22 e 24 — dois números para
               um papel só, invisíveis como hierarquia e visíveis como bagunça. */
            <Icon name="lock" size={ICON_ACTION} tone="muted" />
          ) : owned ? (
            equipped
              ? <Icon name="check_circle" size={ICON_ACTION} fill={1} tone="primary" label={isPt ? 'Equipado' : 'Equipped'} />
              : <span style={{ ...sm2Text, color: 'var(--sm2-primary-ink)', fontWeight: 500 }}>{status}</span>
          ) : isEmblem ? (
            <>
              {/* Anda colado ao número do preço: degrau inline. */}
              <Icon name="military_tech" size={ICON_INLINE} tone="gold" />
              <span className="sm2-num" style={{ ...emblemNum, opacity: affordable ? 1 : 0.5 }}>{item.price}</span>
            </>
          ) : (
            <span className="sm2-num" style={{ ...bitsNum, opacity: affordable ? 1 : 0.5 }}>{item.price}</span>
          )}
        </span>
      </button>
    );
  };

  /** Saldo — uma leitura só, a da moeda que compra o que está na tela. */
  const balance = seg === 'tournament' ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon name="military_tech" size={ICON_INLINE} tone="gold" label={isPt ? 'Emblemas' : 'Emblems'} />
      <span className="sm2-num" style={emblemNum}>{emblems}</span>
    </span>
  ) : (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span className="sm2-num" style={bitsNum}>{points}</span>
      <span style={{ ...sm2Hint, fontWeight: 500 }}>Bits</span>
    </span>
  );

  const exchange = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
      <span style={{ ...sm2Hint, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="diamond" size={ICON_INLINE} tone="primary" label={isPt ? 'Créditos' : 'Credits'} />
        {isPt ? `Trocar Créditos por Bits — você tem ${credits}` : `Swap Credits for Bits — you have ${credits}`}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        {BITS_EXCHANGE.map(pack => {
          const busy = exchanging === pack.credits;
          const can = credits >= pack.credits && exchanging === null;
          return (
            <button
              key={pack.credits}
              type="button"
              disabled={!can}
              aria-label={isPt ? `Trocar ${pack.credits} Créditos por ${pack.bits} Bits` : `Swap ${pack.credits} Credits for ${pack.bits} Bits`}
              onClick={async () => {
                setExchanging(pack.credits);
                let ok = false;
                try { ok = await onExchangeCredits(pack.credits); } finally { setExchanging(null); }
                say(`exch-${pack.credits}`, ok, ok
                  ? (isPt ? `+${pack.bits} Bits.` : `+${pack.bits} Bits.`)
                  : (isPt ? 'A troca não foi concluída. Tente de novo.' : 'The swap did not go through. Try again.'));
              }}
              /* O padding cede, o ícone não. Três botões nesta linha eram a
                 desculpa dos degraus 16 e 14 — "não cabia". O que não cabia era
                 o padding de 16px de um botão de texto num botão que é quase
                 só número; a escala de ícone não negocia com o layout. */
              style={{ ...sm2Button('outline', !can), flex: 1, gap: 4, padding: '10px 8px' }}
            >
              <Icon name={busy ? 'sync' : 'diamond'} size={ICON_INLINE} tone={can ? 'primary' : 'muted'} />
              <span className="sm2-num">{pack.credits}</span>
              <Icon name="arrow_forward" size={ICON_INLINE} tone="muted" />
              <span className="sm2-num" style={{ ...bitsNum, fontSize: 'var(--sm2-text-xs)' }}>{pack.bits}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Uma ação dominante: comprar. O segmento troca a MOEDA, e só isso. */}
      <div role="radiogroup" aria-label={isPt ? 'Moeda da loja' : 'Shop currency'} style={{ display: 'flex', gap: 8 }}>
        <Segment selected={seg === 'shop'} onSelect={() => setSeg('shop')} label={isPt ? 'Loja' : 'Shop'} />
        <Segment selected={seg === 'tournament'} onSelect={() => setSeg('tournament')} label={isPt ? 'Torneio' : 'Tournament'} />
      </div>

      {/* Estado de compra/troca. Existe sempre no DOM: região viva que aparece
          vazia não é anunciada quando o texto chega em alguns leitores. */}
      <p
        role="status"
        aria-live="polite"
        style={{
          ...sm2Hint, minHeight: 18, margin: 0,
          color: flash ? (flash.ok ? 'var(--sm2-primary-ink)' : 'var(--sm2-danger-ink)') : 'var(--sm2-muted)',
        }}
      >
        {flash ? flash.msg : (seg === 'tournament'
          ? (isPt ? 'Emblemas só vêm do Torneio — e só compram aqui.' : 'Emblems only come from the Tournament — and only buy here.')
          : (isPt ? 'Ganhe Bits nos minijogos.' : 'Earn Bits in the minigames.'))}
      </p>

      {/* ─── AS MISSÕES DA SEMANA ────────────────────────────────────────
          Ficam no TOPO do segmento Torneio, e a posição é o argumento: aqui
          é onde os Emblemas são gastos, e a missão é de onde eles vêm. A
          torneira e o ralo na mesma tela.

          ⚠️ `weeklyMissions.ts` existia completo, testado e com ZERO
          consumidores (auditoria de 06/09/2026). E o custo era de economia:
          `TOURNAMENT_ITEMS` somam 245 Emblemas — a 3 por vitória, ~82
          vitórias e a moeda do Torneio nunca mais compra nada.

          Nenhuma missão premia CONTAGEM DE TAREFAS: é proibição escrita do
          `CLAUDE.md`, e o pool inteiro é de cuidado e presença (há teste
          varrendo). Por isso elas cabem numa tela de loja sem virar cobrança:
          o que se pede é aparecer, não produzir. */}
      {seg === 'tournament' && (weeklyMissions?.length ?? 0) > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="sm2-title" style={sm2TitleStyle}>{isPt ? 'Missões da semana' : 'This week'}</h2>
          {weeklyMissions!.map(({ mission, count, done, claimed }) => (
            <div
              key={mission.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 12, border: '1px solid var(--sm2-line)',
                backgroundColor: 'var(--sm2-surface)',
                // Missão paga esmaece — ela vira registro do que foi feito, e
                // não some: sumir apagaria a única prova de que a semana rendeu.
                opacity: claimed ? 0.55 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...sm2Text, margin: 0 }}>{isPt ? mission.descPt : mission.descEn}</p>
                {/* Progresso só quando ele JÁ COMEÇOU — mesma régua do WP4.12
                    (achado E4): `0/3` é a ausência de progresso, não o
                    progresso, e uma coluna de zeros lê como boletim. */}
                {!done && count > 0 && (
                  <p style={{ ...sm2Hint, margin: '2px 0 0' }}>{count}/{mission.target}</p>
                )}
              </div>
              {claimed ? (
                <span style={{ ...sm2Hint, whiteSpace: 'nowrap' }}>{isPt ? 'recebido' : 'claimed'}</span>
              ) : done ? (
                <button
                  type="button"
                  onClick={() => onClaimWeekly?.(mission.id)}
                  style={{ ...sm2Button('primary'), whiteSpace: 'nowrap' }}
                >
                  <span style={emblemNum}>+{mission.emblems}</span>
                </button>
              ) : (
                <span style={{ ...emblemNum, opacity: 0.6, whiteSpace: 'nowrap' }}>+{mission.emblems}</span>
              )}
            </div>
          ))}
        </section>
      )}

      {sections.map(sec => (
        <section key={sec.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="sm2-title" style={sm2TitleStyle}>{sec.title}</h2>
          {sec.items.length === 0
            ? <p style={sm2Hint}>{isPt ? 'Nada por aqui ainda.' : 'Nothing here yet.'}</p>
            : sec.items.map(renderItem)}
        </section>
      ))}

      {/* ─── O CONVITE PERMANENTE (WP5.1, canal PASSIVO) ─────────────────
          A metade que faltava do pacote, e ela tem forma própria.

          O canal PROATIVO (relatório diário, 1×/semana, só no 1º dia perfeito,
          com `×` terminal) aparece sozinho; este a pessoa ENCONTRA. É por isso
          que ele fica FORA do cap semanal e não some com o `offerDismissed`:
          dispensar o que te interrompe não é dizer que você nunca mais quer
          procurar — e sem esta porta, quem não tem um dia perfeito na semana
          nunca via oferta que não fosse uma RECUSA (bateu o teto de criação).

          Fica no fim da lista, depois do que a pessoa veio ver. Loja que abre
          na vitrine paga é loja que não confia no próprio catálogo. */}
      {seg === 'shop' && accountTier === 'demo' && onUnlock && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <p style={{ ...sm2Hint, margin: 0 }}>
            {isPt
              ? 'Sem pressa: isto fica aqui sempre que você quiser olhar.'
              : 'No rush — this stays here whenever you want to look.'}
          </p>
          <div style={{ maxWidth: 280 }}>
            <UnlockNudge language={language} reason="shop" onOpen={onUnlock} />
          </div>
        </section>
      )}

      {seg === 'shop' && exchange}
    </div>
  );

  if (asPage) return <div style={{ paddingBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minHeight: 44 }}>{balance}</div>
    {body}
  </div>;

  return (
    <ModalSheet
      open
      title={isPt ? 'Loja' : 'Shop'}
      onClose={onClose}
      language={language}
      footer={<div style={{ display: 'flex', justifyContent: 'flex-end' }}>{balance}</div>}
    >
      {body}
    </ModalSheet>
  );
}
