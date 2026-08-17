import { useState } from 'react';
import type { Language } from '../utils/i18n';
import iconHome from '../assets/soulmon/icons/icon-home.png';
import iconActivities from '../assets/soulmon/icons/icon-activities.png';
import iconEvolution from '../assets/soulmon/icons/icon-evolution.png';
import iconBook from '../assets/soulmon/icons/icon-book.png';
import iconCoin from '../assets/soulmon/icons/icon-coin.png';
import iconMenu from '../assets/soulmon/icons/icon-menu.png';
import iconGem from '../assets/soulmon/icons/icon-gem.png';
import iconGear from '../assets/soulmon/icons/icon-gear.png';
import iconReset from '../assets/soulmon/icons/icon-reset.png';

type ViewType = 'main' | 'evolution' | 'stats' | 'settings' | 'games' | 'oracle' | 'tournament' | 'library' | 'shop';

interface BottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onResetOnboarding?: () => void;
  /** Créditos (monetização) — modal próprio, dentro do menu sanduíche. */
  onOpenCredits?: () => void;
  language?: Language;
}

/** Ícone-imagem (gerado no Higgsfield, kit bronze/cobre) no lugar do
 *  lucide-react. Sem `color` de SVG pra recolorir por aba — o destaque da
 *  aba ativa vem do halo (glow) + fundo, não de tingir o ícone. */
function NavIcon({ src, alt, active, size = 26 }: { src: string; alt: string; active?: boolean; size?: number }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        imageRendering: 'pixelated',
        opacity: active ? 1 : 0.62,
        /* O `scale(1.22)` saiu junto com a chegada do rótulo (B7): com texto
           embaixo, aumentar o ícone empurrava a linha de base e a fileira
           deixava de ter um ritmo só. O destaque agora é o preenchimento da
           placa + o rótulo aceso. */
        filter: active ? 'drop-shadow(0 0 7px rgba(93,240,224,0.85)) drop-shadow(0 0 14px rgba(93,240,224,0.4))' : 'none',
        transition: 'opacity 0.15s ease, filter 0.15s ease',
      }}
    />
  );
}

/**
 * Um destino da nav: ícone + RÓTULO PERSISTENTE (B7).
 *
 * Material e HIG convergem: barra inferior tem 3–5 destinos **com nome**. O
 * app tinha 6 destinos e nenhum nome — o ícone sozinho é adivinhação, e para
 * leitor de tela o `aria-label` existia mas nada aparecia na tela.
 *
 * Por que o rótulo cabe: 412px / 6 = 68px por célula; a Silkscreen a 8px sem
 * espaçamento extra mede ~4,8px de avanço por caractere, então "ATIVIDADES"
 * (10, o pior caso em PT-BR) mede ~48px dentro de 62px úteis — MEDIDO no
 * navegador, não estimado (ver `align-round3.md`).
 *
 * A seleção segue a regra da rodada 2 — **o preenchimento carrega**: o item
 * ativo é o único bloco sólido da fileira, e o inativo nunca é preenchido.
 * Isso é invariante de tema; brilho e cor de rótulo são reforço, não a
 * informação.
 */
function NavItem({ icon, label, active, onClick, current }: {
  icon: string; label: string; active?: boolean; onClick: () => void;
  /** `aria-current="page"` só para destinos de verdade, não para ações. */
  current?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={current && active ? 'page' : undefined}
      className={active ? 'sm-bottom-nav-btn sm-bottom-nav-btn-on' : 'sm-bottom-nav-btn'}
      title={label}
    >
      <NavIcon src={icon} alt="" active={active} />
      <span className="sm-bottom-nav-label">{label}</span>
    </button>
  );
}

/** Navegação principal do app: barra de ícones fixa no rodapé (abaixo da
 *  barra de chat). 4 views à esquerda + Loja (ação) + menu sanduíche
 *  (Configurações + Debug) sempre por último, à direita de tudo. */
export function BottomNav({ currentView, onNavigate, onResetOnboarding, onOpenCredits, language = 'en-US' }: BottomNavProps) {
  const isPt = language === 'pt-BR';
  const [menuOpen, setMenuOpen] = useState(false);

  // Torneio mora dentro de Atividades
  // (junto dos minigames); Estatísticas mora dentro de Evolução (aba interna
  // — ver App.tsx). Só views de verdade viram "abas" coloridas-quando-ativas;
  // Loja e o menu sanduíche são AÇÕES (cor neutra fixa), agrupadas à direita.
  const items: { view: ViewType; label: string; icon: string }[] = [
    { view: 'main', label: isPt ? 'Início' : 'Home', icon: iconHome },
    { view: 'games', label: isPt ? 'Atividades' : 'Activities', icon: iconActivities },
    { view: 'evolution', label: isPt ? 'Evolução' : 'Evolution', icon: iconEvolution },
    { view: 'library', label: isPt ? 'Biblioteca' : 'Library', icon: iconBook },
  ];
  const menuActive = menuOpen || currentView === 'settings';

  return (
    <nav className="sm-bottom-nav">
      {items.map(({ view, label, icon }) => (
        <NavItem
          key={view}
          icon={icon}
          label={label}
          active={currentView === view}
          current
          onClick={() => onNavigate(view)}
        />
      ))}
      <NavItem
        icon={iconCoin}
        label={isPt ? 'Loja' : 'Shop'}
        active={currentView === 'shop'}
        onClick={() => onNavigate('shop')}
      />

      {/* Menu sanduíche — sempre por último (à direita de tudo). Agrega
          Configurações + Recomeçar num popover, em vez de dois botões soltos. */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', height: '100%' }}>
        <NavItem
          icon={iconMenu}
          label={isPt ? 'Menu' : 'Menu'}
          active={menuActive}
          onClick={() => setMenuOpen(o => !o)}
        />

        {menuOpen && (
          <>
            {/* Backdrop transparente — fecha o popover ao tocar fora dele. */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 60 }}
            />
            <div
              className="sm-px-pop"
              style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
                minWidth: 200, overflow: 'hidden', zIndex: 61,
              }}
            >
              {onOpenCredits && (
                <button
                  onClick={() => { onOpenCredits(); setMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 14px',
                    background: 'transparent', border: 'none',
                    color: 'var(--sm-ink)', fontFamily: 'var(--sm-font-pixel)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <img src={iconGem} alt="" width={17} height={17} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                  {isPt ? 'Créditos' : 'Credits'}
                </button>
              )}
              <button
                onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 14px',
                  background: currentView === 'settings' ? 'var(--sm-bg)' : 'transparent', border: 'none',
                  borderTop: onOpenCredits ? '1px solid color-mix(in srgb, var(--sm-px-copper) 40%, transparent)' : 'none',
                  color: 'var(--sm-ink)', fontFamily: 'var(--sm-font-pixel)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <img src={iconGear} alt="" width={17} height={17} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                {isPt ? 'Configurações' : 'Settings'}
              </button>
              {onResetOnboarding && (
                <button
                  onClick={() => { onResetOnboarding(); setMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '13px 14px',
                    background: 'transparent', border: 'none', borderTop: '1px solid color-mix(in srgb, var(--sm-px-copper) 40%, transparent)',
                    color: 'var(--sm-ink)', fontFamily: 'var(--sm-font-pixel)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <img src={iconReset} alt="" width={17} height={17} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                  {isPt ? 'Refazer o ritual' : 'Redo the ritual'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
