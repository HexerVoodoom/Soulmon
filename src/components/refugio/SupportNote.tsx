import { sm2Hint } from '../form/FormKit';
import {
  HELPLINE_DIRECTORY_URL, HELPLINE_TEL_BR, helplineDirectoryLabel, helplineNumbers, notProfessionalHelp,
} from '../../utils/supportLine';

/**
 * O aviso de ajuda do Refúgio — rodapé DISCRETO, sempre visível (parecer do
 * `soulmon-behavioral-psychologist`, 30/09/2026). Os textos e números vêm do
 * dono único `utils/supportLine.ts` (o mesmo do `ChatBox`). Em PT há o atalho
 * "Preciso de ajuda agora" (`tel:188`); nos dois idiomas, o diretório
 * internacional para quem não está nos países listados.
 */
export function SupportNote({ isPt, ...data }: { isPt: boolean; [k: `data-${string}`]: boolean | undefined }) {
  const link = { color: 'inherit', textDecoration: 'underline' } as const;
  return (
    <p {...data} style={{ ...sm2Hint, textAlign: 'center', margin: 0 }}>
      {notProfessionalHelp(isPt)} {isPt ? 'Em crise' : 'In a crisis'} — {helplineNumbers(isPt)}{' '}
      {isPt && <><a href={HELPLINE_TEL_BR} style={link}>Preciso de ajuda agora</a>{' · '}</>}
      <a href={HELPLINE_DIRECTORY_URL} target="_blank" rel="noopener noreferrer" style={link}>
        {helplineDirectoryLabel(isPt)}
      </a>
    </p>
  );
}
