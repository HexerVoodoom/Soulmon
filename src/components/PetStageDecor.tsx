import { ALL_SHOP_ITEMS } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { SLOT_ORDER, decorFitsSetting, decorRenderBox, itemCabeNoSlot, slotBoxStyle, slotParaItem, type SlotId } from '../utils/petStage';
import { DECOR_ART, DECOR_CHAMA } from '../utils/decorArt';
import { ArcadeTela } from './ArcadeTela';
import campfireBase from '../assets/decor-fx/furn-campfire-base.png';
import campfireFrente from '../assets/decor-fx/furn-campfire-frente.png';
import campfireFogo from '../assets/decor-fx/furn-campfire-fogo.png';
import { useWindChime } from '../hooks/useWindChime';
import { DECOR_LUZ, decorLuzAcesa } from '../utils/decorLuz';
import iconTrophyGold from '../assets/icons/icon-trophy-gold.png';
import iconTrophySilver from '../assets/icons/icon-trophy-silver.png';
import iconTrophyBronze from '../assets/icons/icon-trophy-bronze.png';

// ─────────────────────────────────────────────────────────────────────────────
// A decoração do palco (utils/petStage.ts) desenhada dentro da área do pet.
//
// Regras que este componente respeita e que NÃO devem ser afrouxadas:
//   · Espaço vazio é vazio — nada de contorno tracejado ou "+" convidando a
//     comprar. Quem não decorou vê o cenário limpo.
//   · Um item por espaço, na caixa em px que o slot declara. A arte é feita
//     PARA a caixa; aqui ela só é posicionada.
//   · Nada aparece em cenário incompatível (sofá na neve, qualquer coisa num
//     cenário abstrato). A loja avisa isso na hora de equipar — o item não
//     some em silêncio.
//   · Tudo fica ATRÁS do pet: é cenário, o pet anda na frente.
//
// Arte real em utils/decorArt.ts, desenhada PARA a caixa de cada slot — só é
// posicionada aqui, nunca redimensionada de forma não-uniforme. Item sem arte
// mapeada (não deveria acontecer, mas por segurança) cai de volta pro emoji.
// ─────────────────────────────────────────────────────────────────────────────

interface PetStageDecorProps {
  equippedDecor: Partial<Record<SlotId, string>>;
  equippedBackground: string | null;
  /** Troféus REAIS de season — a vitrine exibe estes, não enfeite genérico. */
  trophies: Array<{ season: string; place: 1 | 2 | 3 }>;
  language: string;
  /** Pet dormindo: as luzes apagam (e as de noite acendem). */
  isSleeping?: boolean;
  /** Só a Home real toca o sino de vento; o editor da Home fica mudo. */
  somAtivo?: boolean;
}

/**
 * Ordem de DESENHO do palco (REGISTRO §484): a PAREDE vai primeiro e fica ATRÁS de tudo (chão esquerdo/direito, vitrine acima do pet, tapete e o
 * próprio pet). `SLOT_ORDER` (utils/petStage.ts) segue sendo a ordem do catálogo/editor; só o desenho muda.
 */
export const DRAW_ORDER: readonly SlotId[] = ['wall', ...SLOT_ORDER.filter(s => s !== 'wall')];

/** As peças equipadas que de fato aparecem (cenário oferece o espaço e a peça cabe nele), na ordem de desenho. */
function itensDoPalco(equippedDecor: Partial<Record<SlotId, string>>, equippedBackground: string | null) {
  const bg = equippedBackground ? PET_BACKGROUNDS[equippedBackground] : null;
  if (!bg) return [];
  const vistos = new Set<string>();
  return DRAW_ORDER.flatMap(slotId => {
    const itemId = equippedDecor[slotId];
    if (!itemId || !bg.slots.includes(slotId)) return [];
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId && i.kind === 'furniture');
    if (!item || !decorFitsSetting(item.fits ?? 'any', bg.setting)) return [];
    if (item.slotsPermitidos) { // peça de chão livre: só em espaço de chão e uma vez só (save adulterado/duplicado desenha o 1º)
      if (!itemCabeNoSlot(item, slotId) || vistos.has(item.id)) return [];
      vistos.add(item.id);
    }
    return [{ slotId, item, slot: slotParaItem(item, slotId) }];
  });
}

/** Fogo em TIRA de quadros sobre a arte do suporte (Cristal Fundador): `steps(quadros - 1)` no CSS; parado no quadro 1 em movimento reduzido. */
function ChamaTira({ id, on }: { id: string; on: boolean }) {
  const c = DECOR_CHAMA[id];
  if (!c) return null;
  return (
    <span className="sm-decor-quadro" aria-hidden="true">
      <span className="sm-decor-quadro-i">
        <span className="sm-decor-chama" data-decor-chama data-quadros={c.quadros} data-on={on || undefined}
          style={{ backgroundImage: `url(${c.src})`, backgroundSize: `${c.quadros * 100}% 100%` }} />
      </span>
    </span>
  );
}

const PLACE_MEDAL_IMG: Record<1 | 2 | 3, string> = { 1: iconTrophyGold, 2: iconTrophySilver, 3: iconTrophyBronze };

export function PetStageDecor({ equippedDecor, equippedBackground, trophies, language, isSleeping = false, somAtivo = false }: PetStageDecorProps) {
  const temSino = Object.values(equippedDecor).includes('furn-wind-chime') && !!equippedBackground;
  useWindChime(somAtivo && temSino && !isSleeping);
  const bg = equippedBackground ? PET_BACKGROUNDS[equippedBackground] : null;
  // Sem cenário equipado o box é transparente — o "palco" é a página, e não há
  // composição em que apoiar a decoração.
  if (!bg) return null;

  const isPt = language === 'pt-BR';
  const caixas = new Map(itensDoPalco(equippedDecor, equippedBackground).map(i => [i.slotId, i.slot] as const)); // mesma regra do palco (cabe, chão livre, sem duplicar)

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
      {DRAW_ORDER.map(slotId => {
        const itemId = equippedDecor[slotId];
        if (!itemId) return null;                       // espaço vazio: vazio mesmo
        if (!bg.slots.includes(slotId)) return null;    // cenário não oferece o espaço
        const item = ALL_SHOP_ITEMS.find(i => i.id === itemId && i.kind === 'furniture');
        if (!item) return null;
        if (!decorFitsSetting(item.fits ?? 'any', bg.setting)) return null;
        const slot = caixas.get(slotId);
        if (!slot) return null;
        const box = slotBoxStyle(slot);
        const label = isPt ? item.namePt : item.nameEn;
        const art = item.id === 'furn-campfire' ? campfireBase : DECOR_ART[item.id]; // a Fogueira do palco é a arte SEM fogo em 2 camadas (base: toras e pedras; frente: aro e postes); o fogo do pixelfx passa ENTRE as duas (§481)
        const luz = DECOR_LUZ[item.id];
        const acesa = luz ? decorLuzAcesa(luz, isSleeping) : false;
        const artFiltro = luz && !acesa ? 'brightness(.5) saturate(.55) drop-shadow(0 1px 2px rgba(0,0,0,0.35))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))';

        // Tapete: caixa larga e baixa, arte já desenhada em perspectiva rasa
        // (foreshortening) exatamente para esse formato — ver utils/decorArt.ts.
        if (slot.anchor === 'ground-flat') {
          return (
            <div key={slotId} style={{ ...box }} title={label}>
              {art ? (
                <img src={art} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: 'radial-gradient(closest-side, rgba(60,45,40,0.30), rgba(60,45,40,0.12))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontSize: 9, lineHeight: 1, opacity: 0.95,
                }}>
                  <span>{item.icon}</span><span>{item.icon}</span><span>{item.icon}</span>
                </div>
              )}
            </div>
          );
        }

        const rb = decorRenderBox(slot);
        const emojiSize = Math.round(Math.min(rb.w, rb.h) * 0.78);
        return (
          <div key={slotId} style={{ ...box, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} title={label}>
            {/* Sombra de contato — só para o que está apoiado no chão. */}
            {slot.anchor === 'ground' && (
              <span style={{
                position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                width: Math.round(rb.w * 0.8), height: 9, borderRadius: '50%',
                background: 'rgba(0,0,0,0.28)', filter: 'blur(2px)',
              }} />
            )}
            {luz && (luz.modo === 'luz' || luz.modo === 'sempre') && (
              <span
                className="sm-decor-luz-halo" data-decor-luz={luz.modo} data-tom={luz.tom} data-on={acesa || undefined}
                style={{ left: `${luz.x}%`, top: `${luz.y}%`, width: `${luz.d}%` }}
              />
            )}
            {art ? (
              <>
                <img
                  src={art} alt=""
                  style={{
                    position: 'relative', width: '100%', height: '100%', objectFit: 'contain',
                    imageRendering: 'pixelated', filter: artFiltro, transition: 'filter .8s ease',
                  }}
                />
                {DECOR_CHAMA[item.id] && <ChamaTira id={item.id} on={acesa} />}
                {item.id === 'furn-campfire' && (
                  <>
                    <span className="sm-decor-quadro" aria-hidden="true">
                      <span className="sm-decor-quadro-i">
                        <span className="sm-decor-fogo" data-on={acesa || undefined}><img src={campfireFogo} alt="" /></span>
                        <span className="sm-decor-brasa" data-on={!acesa || undefined} />
                      </span>
                    </span>
                    <img
                      src={campfireFrente} alt="" data-decor-frente
                      style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                        imageRendering: 'pixelated', filter: artFiltro, transition: 'filter .8s ease',
                      }}
                    />
                  </>
                )}
              </>
            ) : (
              <span style={{
                position: 'relative', fontSize: emojiSize, lineHeight: 1,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
              }}>
                {item.icon}
              </span>
            )}

            {item.id === 'furn-arcade-cab' && (
              <span className="sm-decor-quadro" aria-hidden="true"><span className="sm-decor-quadro-i"><ArcadeTela dormindo={isSleeping} /></span></span>
            )}
            {item.id === 'furn-hourglass' && (
              <span className="sm-decor-areia" data-decor-areia>
                <i /><i /><i />
              </span>
            )}
            {/* A vitrine exibe as conquistas REAIS: até 3 medalhas de season
                sobre o móvel. Sem troféus ganhos, só o móvel — a vitrine vazia
                é a verdade, não uma falha. */}
            {slotId === 'trophy' && trophies.length > 0 && (
              <span style={{
                position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 1, fontSize: 13, lineHeight: 1,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
              }}>
                {trophies.slice(-3).map((t, i) => (
                  <img key={`${t.season}-${i}`} src={PLACE_MEDAL_IMG[t.place]} alt="" style={{ width: 13, height: 13, imageRendering: 'pixelated' }} />
                ))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const BOTAO_TOQUE = { position: 'absolute', inset: 0, minWidth: 44, minHeight: 44, width: '100%', height: '100%', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation' } as const;

/**
 * TOQUES NAS PEÇAS (REGISTRO §484): o Fliperama de Canto abre o Salão de jogos e o Espelho Escuro abre o Perfil. Vive numa camada PRÓPRIA, por
 * cima do pet: o grupo do pet cobre o palco inteiro (`inset: 0`) e vem depois da decoração no DOM, então um botão DENTRO de `PetStageDecor`
 * (camada de trás, `aria-hidden`) nunca recebia o toque nem era anunciado. Aqui o contêiner não captura toque; só o botão de cada peça (≥ 44px).
 * Sem handler (editor da Home) não renderiza nada.
 */
export function PetStageToques({ equippedDecor, equippedBackground, language, onOpenArcade, onOpenProfile }: {
  equippedDecor: Partial<Record<SlotId, string>>; equippedBackground: string | null; language: string;
  onOpenArcade?: () => void; onOpenProfile?: () => void;
}) {
  const isPt = language === 'pt-BR';
  const botoes = itensDoPalco(equippedDecor, equippedBackground).flatMap(({ slotId, item, slot }) => {
    if (item.id === 'furn-arcade-cab' && onOpenArcade) return [{ slotId, slot, attr: 'data-decor-arcade', label: isPt ? 'Abrir minigames' : 'Open minigames', onClick: onOpenArcade }];
    if (item.id === 'furn-el-sombra' && onOpenProfile) return [{ slotId, slot, attr: 'data-decor-espelho', label: isPt ? 'Abrir perfil' : 'Open profile', onClick: onOpenProfile }];
    return [];
  });
  if (!botoes.length) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }} data-decor-toques>
      {botoes.map(b => (
        <div key={b.slotId} style={{ ...slotBoxStyle(b.slot) }}>
          <button type="button" {...{ [b.attr]: '' }} aria-label={b.label} onClick={e => { e.stopPropagation(); b.onClick(); }} style={BOTAO_TOQUE} />
        </div>
      ))}
    </div>
  );
}

/**
 * BRILHO DE NOITE (REGISTRO §484): o que acende quando a luz se apaga (os cogumelos) precisa ficar ACIMA do véu da noite (`data-sleep-veil`,
 * 55% de escuro por cima da decoração). Antes o brilho morava sob o véu e o cogumelo "aceso" parecia apagado. Aqui vão a arte cheia e o halo,
 * numa camada depois do véu; acordado, a camada fica em opacidade 0. "Apagar a luz" = o botão da soneca (a luz do display) / o sono do pet.
 */
export function PetStageBrilhos({ equippedDecor, equippedBackground, isSleeping }: {
  equippedDecor: Partial<Record<SlotId, string>>; equippedBackground: string | null; isSleeping: boolean;
}) {
  // 'noite' (cogumelos) acende quando dorme; 'sempre' (Cristal Fundador) nunca apaga: dormindo, é redesenhado ACIMA do véu para não escurecer.
  const itens = itensDoPalco(equippedDecor, equippedBackground).filter(i => { const m = DECOR_LUZ[i.item.id]?.modo; return m === 'noite' || (m === 'sempre' && isSleeping); });
  if (!itens.length) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }} aria-hidden="true" data-decor-brilhos>
      {itens.map(({ slotId, item, slot }) => {
        const luz = DECOR_LUZ[item.id];
        const art = DECOR_ART[item.id];
        return (
          <div key={slotId} className="sm-decor-brilho" data-on={decorLuzAcesa(luz, isSleeping) || undefined} style={{ ...slotBoxStyle(slot), display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <span className="sm-decor-luz-halo" data-decor-luz={luz.modo} data-tom={luz.tom} data-on={decorLuzAcesa(luz, isSleeping) || undefined} style={{ left: `${luz.x}%`, top: `${luz.y}%`, width: `${luz.d}%` }} />
            {art && luz.modo === 'sempre' && <img src={art} alt="" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }} />}
            {luz.modo === 'sempre' && <ChamaTira id={item.id} on />}
            {art && luz.modo === 'noite' && <img src={art} alt="" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: 'brightness(1.3) saturate(1.25) drop-shadow(0 0 5px hsl(165 95% 62% / .95)) drop-shadow(0 0 14px hsl(165 90% 55% / .65))' }} />}
          </div>
        );
      })}
    </div>
  );
}
