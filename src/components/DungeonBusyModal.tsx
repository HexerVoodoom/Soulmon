import { useEffect, useState } from 'react';
import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

/**
 * "ELE ESTÁ NA MASMORRA" — o aviso de OCUPADO (pedido do dono, 11/10/2026, REGISTRO §36).
 *
 * Enquanto o Soulmon está na masmorra (`soulmonNaMasmorra`, campo `dungeonAway` do save) tudo que usa o Soulmon de verdade fica
 * fechado: mandá-lo em missão, evoluir, renascer, passear, duelar e disputar o torneio. Em vez de um botão morto, quem tentou vê
 * ESTE aviso — usa o modal base (`ModalSheet`), diz o motivo em voz calma (nada de cobrança: o que ele rendeu até aqui fica com o
 * jogador) e oferece o caminho: "Retirar da Fenda" (acerta a conta e ele volta para casa) ou deixá-lo lá.
 *
 * `acao: null` = o jogador tocou na plaquinha da Home (não tentou nada: só quer saber/trazer de volta).
 */
export type OcupadoAcao = 'evolucao' | 'renascer' | 'missao' | 'passeio' | 'duelo' | 'torneio' | 'masmorra-em-missao';

/** O que o jogador queria fazer, no infinitivo, PT/EN. */
export function ocupadoVerbo(acao: OcupadoAcao, isPt: boolean): string {
  switch (acao) {
    case 'evolucao': return isPt ? 'evoluir' : 'evolve';
    case 'renascer': return isPt ? 'renascer' : 'be reborn';
    case 'missao': return isPt ? 'mandá-lo numa missão' : 'send him on a mission';
    case 'passeio': return isPt ? 'levá-lo para passear' : 'take him for a stroll';
    case 'duelo': return isPt ? 'duelar' : 'duel';
    case 'torneio': return isPt ? 'disputar o torneio' : 'enter the tournament';
    case 'masmorra-em-missao': return isPt ? 'descer à Fenda' : 'go down the Rift';
  }
}

export function ocupadoMensagem(acao: OcupadoAcao | null, isPt: boolean): string {
  if (acao === 'masmorra-em-missao') {
    return isPt
      ? 'Ele está numa missão do clã. Quando voltar, ele pode descer à Fenda.'
      : 'He is out on a clan mission. When he is back, he can go down the Rift.';
  }
  if (!acao) {
    return isPt
      ? 'Ele está na Fenda, descendo sozinho. O que ele render fica esperando você.'
      : 'He is in the Rift, going down on his own. Whatever he earns waits for you.';
  }
  const verbo = ocupadoVerbo(acao, isPt);
  return isPt
    ? `Ele está na Fenda, descendo sozinho. Para ${verbo}, é só retirá-lo de lá primeiro — o que ele já rendeu fica com você.`
    : `He is in the Rift, going down on his own. To ${verbo}, take him out first — what he already earned is yours.`;
}

export function DungeonBusyModal({ open, acao, language, onRetire, onGo, onClose, busy = false }: {
  open: boolean;
  acao: OcupadoAcao | null;
  language: Language;
  /** Acerta a descida e traz o Soulmon para casa. */
  onRetire: () => void;
  /** Plaquinha da Home: leva até a tela da Fenda, onde ele está descendo. Sem isso, o aviso mantém o formato antigo (Deixar lá / Retirar). */
  onGo?: () => void;
  onClose: () => void;
  /** O acerto está em andamento (o botão espera). */
  busy?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const emMissao = acao === 'masmorra-em-missao';
  // Plaquinha (acao null) com destino: a ação principal é IR até a Fenda; trazê-lo de volta vira ação secundária pequena, com confirmação.
  const irLa = !acao && !!onGo;
  const [confirmando, setConfirmando] = useState(false);
  useEffect(() => { if (!open) setConfirmando(false); }, [open]);
  return (
    <ModalSheet
      open={open}
      onClose={confirmando ? () => setConfirmando(false) : onClose}
      language={language}
      title={emMissao ? (isPt ? 'Ele está em missão' : 'He is on a mission') : (isPt ? 'Ele está na Fenda' : 'He is in the Rift')}
      placement="center" titulo="inline"
      maxWidth={420}
      footer={
        irLa && !confirmando ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <button type="button" onClick={onGo} style={{ ...sm2Button('primary'), width: '100%' }} data-dungeon-busy-go>{isPt ? 'Ir à Fenda' : 'Go to the Rift'}</button>
            <button type="button" onClick={() => setConfirmando(true)} style={{ ...sm2Button('outline'), width: '100%', minHeight: 44, fontSize: 'var(--sm2-text-xs, 12px)' }} data-dungeon-busy-bring>{isPt ? 'Trazer de volta' : 'Bring him back'}</button>
          </div>
        ) : irLa ? (
          <div className="sm2-conta-two">
            <button type="button" onClick={() => setConfirmando(false)} style={sm2Button('outline')} data-dungeon-busy-keep>{isPt ? 'Deixar lá' : 'Leave him there'}</button>
            <button type="button" onClick={onRetire} disabled={busy} style={sm2Button('primary', busy)} data-dungeon-busy-retire>{isPt ? 'Trazer de volta' : 'Bring him back'}</button>
          </div>
        ) : emMissao ? (
          <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }} data-dungeon-busy-ok>{isPt ? 'Entendi' : 'Got it'}</button>
        ) : (
          <div className="sm2-conta-two">
            <button type="button" onClick={onClose} style={sm2Button('outline')} data-dungeon-busy-keep>
              {isPt ? 'Deixar lá' : 'Leave him there'}
            </button>
            <button type="button" onClick={onRetire} disabled={busy} style={sm2Button('primary', busy)} data-dungeon-busy-retire>
              {isPt ? 'Retirar da Fenda' : 'Take him out of the Rift'}
            </button>
          </div>
        )
      }
    >
      <p style={{ ...sm2Text, margin: 0 }} data-dungeon-busy-msg>{irLa && confirmando
        ? (isPt ? 'Trazê-lo de volta encerra a descida agora. O que ele já rendeu fica com você.' : 'Bringing him back ends the descent now. What he already earned is yours.')
        : ocupadoMensagem(acao, isPt)}</p>
    </ModalSheet>
  );
}
