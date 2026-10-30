/**
 * O MISTÉRIO NA SALA DA FEIRA (`docs/PLANO-FEIRA-CHEFE.md`): só o AGREGADO do clã — nome e nível do chefe, a barra do que resta dele
 * (um fato do clã inteiro, nunca "quem bateu"), as marcas da trilha — e o gesto de reabrir a folha do evento.
 * Mora em arquivo próprio: a régua da sala (`GuildSheet.feira.render.test`) proíbe barra de HP no fenômeno semanal.
 */
import { BOSS_ROSTER, bossText } from '../../data/bossRoster';
import { feiraText } from '../../utils/feiraCopy';
import type { FeiraResumo } from '../../utils/feira';
import type { Language } from '../../utils/i18n';

export function FeiraMisterio({ language, resumo, ocupado, onAbrir }: { language: Language; resumo: FeiraResumo; ocupado: boolean; onAbrir: () => void }) {
  /** UM botão só (dono, 30/10/2026): o desafio (chefe ou trilha) quando há; no descanso não há ação aqui. */
  const desafio = resumo.state !== 'rest';
  const isPt = language === 'pt-BR';
  const entrada = resumo.state === 'boss' ? BOSS_ROSTER.find(b => b.id === resumo.bossId) : undefined;
  const nomeChefe = entrada ? bossText(entrada, isPt).name : resumo.state === 'boss' ? resumo.bossId : '';
  return (
    <div data-feira-misterio data-feira-estado={resumo.state} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <p className="sm2-lib-s" style={{ margin: 0 }} data-feira-misterio-linha>
        {resumo.state === 'boss' ? feiraText(language, 'room.boss', { name: nomeChefe, level: resumo.level }) : resumo.state === 'trail' ? feiraText(language, 'room.trail') : feiraText(language, 'room.rest')}
      </p>
      {resumo.state === 'boss' && (
        <div
          role="meter" aria-label={feiraText(language, 'boss.pool')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(resumo.bossHpPct)}
          data-feira-misterio-pool={Math.round(resumo.bossHpPct)}
          style={{ height: 8, width: 200, borderRadius: 6, background: 'var(--sm2-surface-2)', overflow: 'hidden' }}
        >
          <div style={{ width: `${Math.round(resumo.bossHpPct)}%`, height: '100%', background: 'var(--sm2-primary-fill)' }} />
        </div>
      )}
      {desafio && <button type="button" data-feira-misterio-abrir disabled={ocupado} aria-disabled={ocupado ? true : undefined} onClick={onAbrir} className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary sm2-guild-btn">
        {feiraText(language, resumo.state === 'boss' ? 'room.boss.go' : 'room.challenge')}
      </button>}
    </div>
  );
}
