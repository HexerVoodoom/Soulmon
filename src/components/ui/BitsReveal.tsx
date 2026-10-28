import { BitsAmount } from './BitsAmount';
import { RewardPop } from './RewardPop';
import { useRewardReveal } from '../../hooks/useRewardReveal';

/**
 * `BitsReveal` — a linha ÚNICA de Bits de um fim de partida/retorno, com a revelação padrão (dono, 28/10/2026): a moeda estoura, o
 * número rola de 0 ao valor (odômetro) e pousa com o "ding". Toque na linha pula; movimento reduzido e leitor de tela recebem o valor
 * final já (ele está sempre no DOM). Telas com mais de uma linha de recompensa usam `ResultScreen`/`useRewardReveal` direto.
 */
export function BitsReveal({ value, sign = '+', size = 16, unit }: { value: number; sign?: string; size?: number; unit?: string }) {
  const reveal = useRewardReveal([{ key: 'bits', roll: true }], { active: true });
  return (
    <span data-bits-reveal onClick={reveal.skip}>
      <RewardPop on={reveal.isShown('bits')} still={!reveal.animated}>
        <BitsAmount value={value} sign={sign} size={size} unit={unit} roll={{ run: reveal.isRolling('bits'), still: !reveal.animated || reveal.isLanded('bits') }} />
      </RewardPop>
    </span>
  );
}
