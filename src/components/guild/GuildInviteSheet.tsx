/**
 * CONVIDAR PARA O CLÃ (13/11/2026, pedido do dono, REGISTRO §321).
 *
 * Abre pelo botão "Convidar" do Salão (`GuildSheet`, botão simples do kit). É a busca enquanto digita (`PlayerSearch`: prefixo do nome, sem
 * acento e sem caixa, a partir de 2 letras, pausa de 200 ms) com UM toque por linha: o servidor (`guildInvite`) manda ao
 * convidado uma carta do Papus com o nome do clã e o código — quem recebe entra pelo "Entrar com código" de sempre.
 *
 * Cada linha guarda o próprio desfecho (enviado, já está na roda, já tem clã, clã cheio, sem rede…) em vez de um aviso global:
 * convidar três pessoas seguidas não apaga o "enviado" da primeira. Quem já está NESTE clã nem ganha botão ativo.
 */
import { useState } from 'react';
import { inviteToGuild, type GuildInviteResult } from '../../utils/community';
import { guildText, type GuildKey } from '../../utils/guildCopy';
import type { PlayerSearchHit } from '../../utils/playerSearch';
import type { PlayerDayAnchor } from '../../utils/playerDay';
import type { Language } from '../../utils/i18n';
import { RitualDialog } from '../ritual/RitualKit';
import { PlayerSearch } from '../PlayerSearch';
import { sm2Button } from '../form/FormKit';
import { Icon } from '../ui/Icon';

type Linha = 'sending' | GuildInviteResult;

/** Desfecho → frase do botão. `null` = o botão volta a ser "Convidar" (dá para tentar de novo). */
const ROTULO: Record<Exclude<Linha, 'sending'>, GuildKey | null> = {
  sent: 'guild.convidar.enviado',
  member: 'guild.convidar.membro',
  inGuild: 'guild.convidar.outroCla',
  full: 'guild.convidar.cheio',
  notFound: 'guild.convidar.naoAchou',
  rate: 'guild.convidar.muitos',
  offline: 'guild.convidar.semRede',
  login: 'guild.convidar.naoAchou',
  error: 'guild.convidar.erro',
};
/** Desfechos que ainda deixam tocar de novo (falha passageira). */
const DE_NOVO = new Set<Linha>(['offline', 'error']);

export function GuildInviteSheet({ saveId, language, guildName, tz, onClose, invite = inviteToGuild, search }: {
  saveId: string;
  language: Language;
  /** O nome do PRÓPRIO clã: quem aparece com ele já está na roda. */
  guildName: string;
  tz?: PlayerDayAnchor;
  onClose: () => void;
  /** Injetáveis só em teste/prévia. */
  invite?: typeof inviteToGuild;
  search?: Parameters<typeof PlayerSearch>[0]['search'];
}) {
  const t = (k: GuildKey, vars?: Record<string, string | number>) => guildText(language, k, vars);
  const [linhas, setLinhas] = useState<Record<string, Linha>>({});

  const convidar = async (h: PlayerSearchHit) => {
    setLinhas(prev => ({ ...prev, [h.id]: 'sending' }));
    const r = await invite(saveId, h.id, tz);
    setLinhas(prev => ({ ...prev, [h.id]: r }));
  };

  const acao = (h: PlayerSearchHit) => {
    // Quem já tem clã não pode entrar em outro (o servidor recusaria com 409): a linha já nasce com o motivo, sem botão ativo.
    const estado: Linha | undefined = h.guildName ? (h.guildName === guildName ? 'member' : 'inGuild') : linhas[h.id];
    const enviando = estado === 'sending';
    const final = estado && estado !== 'sending' ? estado : null;
    const ativo = !enviando && (!final || DE_NOVO.has(final));
    const rotulo = enviando ? t('guild.convidar.enviando') : final && ROTULO[final] && !DE_NOVO.has(final) ? t(ROTULO[final] as GuildKey) : t('guild.convidar.acao');
    return (
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <button
          type="button"
          data-guild-invite={h.id}
          data-guild-invite-state={estado ?? 'idle'}
          disabled={!ativo}
          aria-disabled={!ativo ? true : undefined}
          aria-busy={enviando ? true : undefined}
          aria-label={ativo ? t('guild.convidar.acao.aria', { nome: h.name }) : undefined}
          onClick={() => void convidar(h)}
          // Largura FIXA (`.sm2-guild-invite-btn`, pedido do dono 13/11): "Convidar", "Já está na roda", "Já tem clã" e
          // "Convite enviado" ocupam a mesma coluna; rótulo longo quebra em 2 linhas dentro dela, nunca alarga o botão.
          className="sm2-guild-invite-btn"
          style={{ ...sm2Button(final === 'sent' || !ativo ? 'outline' : 'primary', !ativo, 'sm'), gap: 6 }}
        >
          {final === 'sent' && <Icon name="check" size={20} tone="primary" />}
          {rotulo}
        </button>
        {final && DE_NOVO.has(final) && ROTULO[final] && (
          <span role="alert" className="sm2-lib-s" data-guild-invite-erro style={{ margin: 0 }}>{t(ROTULO[final] as GuildKey)}</span>
        )}
      </span>
    );
  };

  return (
    <RitualDialog label={t('guild.convidar.titulo')} onClose={onClose} closeLabel={t('guild.convidar.fechar')} maxWidth={420}>
      <div data-guild-invite-sheet style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-3)' }}>
        <h2 className="sm2-lib-h2" style={{ margin: 0 }}>{t('guild.convidar.titulo')}</h2>
        <p className="sm2-lib-s" style={{ margin: 0 }}>{t('guild.convidar.corpo')}</p>
        <PlayerSearch
          saveId={saveId}
          language={language}
          label={t('guild.convidar.campo')}
          placeholder={t('guild.convidar.placeholder')}
          renderAction={acao}
          autoFocus
          {...(search ? { search } : {})}
        />
      </div>
    </RitualDialog>
  );
}
