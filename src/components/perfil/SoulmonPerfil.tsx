import type { CSSProperties, ReactNode } from 'react';
import { PixelIcon } from '../ui/PixelIcon';
import { sm2Hint, sm2Text } from '../form/FormKit';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';
import { PASSIVE_ICON_ART } from '../../assets/soulmon/icones-ui/interacao';
import { perfilForca, perfilResistencia, perfilAgilidade, perfilAtaqueCorpo, perfilAtaqueDistancia } from '../../assets/soulmon/icones-ui';
import { elementIcon } from '../../utils/elementIconArt';
import { elementoNomeDe } from '../../utils/soulProfile/ficha/elementoNome';
import {
  buildPerfil, PERFIL_ATRIBUTO, PERFIL_EFEITO, PERFIL_FORMA, type MainAttr, type PerfilInput,
} from '../../utils/soulmonPerfil';
import type { SpecialFamily } from '../../utils/combate/specials';
import type { StrikeForm } from '../../utils/soulProfile/ficha/strikeForm';
import type { Language } from '../../utils/i18n';
// Arte que já está no repo (beta-2, 11: "ícones próprios, sem arte nova"): escudo, engrenagem, livro, chama, poção, estrela, aperto de mãos (atributo e ataque ganharam arte própria, P2).
import iconShield from '../../assets/soulmon/icons/icon-shield.png';
import iconGear from '../../assets/soulmon/icons/icon-gear.png';
import iconSpellbook from '../../assets/soulmon/icons/icon-spellbook.png';
import iconFlame from '../../assets/soulmon/icons/icon-flame.png';
import iconPotion from '../../assets/soulmon/icons/icon-potion.png';
import iconStar from '../../assets/soulmon/icons/icon-star.png';
import iconBond from '../../assets/soulmon/icons/icon-heart-handshake.png';

/**
 * O PERFIL DO SOULMON (beta-2, 11) — a folha do prédio `laboratorio.perfil`. Duas cartas curtas, só valores qualitativos (sem
 * pontuação) e só o que o app TEM: a linha some quando o dado não existe (`utils/soulmonPerfil.ts`). Sem melhoria do Soulsmith aqui
 * (o aprimoramento mora no Soulsmith, no Mercado) e sem repetir o que a Arena mostrava: o elemento e o ataque moram SÓ aqui.
 */

const ATTR_ART: Record<MainAttr, string | undefined> = {
  forca: perfilForca,
  resistencia: perfilResistencia,
  agilidade: perfilAgilidade,
};
const FORMA_ART: Record<StrikeForm, string> = { melee: perfilAtaqueCorpo, ranged: perfilAtaqueDistancia };
const EFEITO_ART: Record<SpecialFamily, string> = {
  direct: iconFlame, dot: iconFlame, defDebuff: iconFlame, heal: iconPotion, shield: iconShield, atkBuff: iconStar, spdBuff: iconStar,
};

const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, minHeight: 44 };
const labelStyle: CSSProperties = { ...sm2Hint, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 };
const valueStyle: CSSProperties = { ...sm2Text, margin: 0, fontWeight: 500 };

function Row({ id, icon, label, children }: { id: string; icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div data-perfil-row={id} style={rowStyle}>
      <span style={{ width: 32, height: 32, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={labelStyle}>{label}</p>
        <p style={valueStyle}>{children}</p>
      </span>
    </div>
  );
}

export function SoulmonPerfil({ language, input }: { language: Language; input: PerfilInput }) {
  const isPt = language === 'pt-BR';
  const L = (x: { pt: string; en: string }) => (isPt ? x.pt : x.en);
  const p = buildPerfil(input);
  const elementoArte = elementIcon(p.elementoId) ?? elementIcon('neutro');
  const elementoEspArte = p.especial?.elementoId ? elementIcon(p.especial.elementoId) : undefined;
  const art = (src: string | undefined) => (src ? <PixelIcon src={src} size={32} /> : null);

  return (
    <div data-perfil style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-3, 12px)' }}>
      <ul style={sheetCardList}>
        <li style={sheetCard} data-perfil-card="quem">
          <p style={sheetCardTitle}>{isPt ? 'Quem ele é' : 'Who they are'}</p>
          {p.personalidade && (
            <Row id="personalidade" icon={art(PASSIVE_ICON_ART[p.personalidade.id] ?? iconBond)} label={isPt ? 'Personalidade' : 'Personality'}>
              {isPt ? p.personalidade.namePt : p.personalidade.nameEn}
            </Row>
          )}
          <Row id="atributo" icon={art(ATTR_ART[p.atributo])} label={isPt ? 'Atributo principal' : 'Main attribute'}>
            {L(PERFIL_ATRIBUTO[p.atributo])}
          </Row>
          <Row id="equipamento" icon={art(iconGear)} label={isPt ? 'Equipamento do Soulsmith' : 'Soulsmith equipment'}>
            {p.equipamentoNivel !== null
              ? <span className="sm2-num">{isPt ? `Nv ${p.equipamentoNivel}` : `Lv ${p.equipamentoNivel}`}</span>
              : <span style={{ color: 'var(--sm2-muted)' }}>{isPt ? 'Nenhuma peça' : 'No pieces'}</span>}
          </Row>
        </li>
        <li style={sheetCard} data-perfil-card="luta">
          <p style={sheetCardTitle}>{isPt ? 'Como luta' : 'How they fight'}</p>
          <Row id="elemento" icon={art(elementoArte)} label={isPt ? 'Elemento' : 'Element'}>
            {L(elementoNomeDe(p.elementoId))}
          </Row>
          <Row id="ataque" icon={art(FORMA_ART[p.forma])} label={isPt ? 'Ataque' : 'Attack'}>
            {L(PERFIL_FORMA[p.forma])}
          </Row>
          {p.especial && (
            <>
              <Row id="especial" icon={art(iconSpellbook)} label={isPt ? 'Especial' : 'Special'}>
                {L(p.especial.nome)}
              </Row>
              <Row id="efeito" icon={art(EFEITO_ART[p.especial.familia])} label={isPt ? 'Efeito' : 'Effect'}>
                {L(PERFIL_EFEITO[p.especial.familia])}
              </Row>
              {p.especial.elementoId && (
                <Row id="elemento-especial" icon={art(elementoEspArte)} label={isPt ? 'Elemento do especial' : 'Special element'}>
                  {L(elementoNomeDe(p.especial.elementoId))}
                </Row>
              )}
            </>
          )}
        </li>
      </ul>
    </div>
  );
}
