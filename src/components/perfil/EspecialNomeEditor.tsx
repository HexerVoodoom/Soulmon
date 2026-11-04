import { useState } from 'react';
import { Field, FieldWarn, sm2Hint } from '../form/FormKit';
import { nomeEspecialValido, ESPECIAL_NOME_MAX, ESPECIAL_NOME_COOLDOWN_MS } from '../../../functions/api/_especialNomeRegra.js';
import type { Language } from '../../utils/i18n';

/**
 * Escolher o nome do especial do Soulmon (público: quem duela contra você vê este nome). A regra de forma e o filtro de
 * palavrão são a MESMA função do servidor; a troca semanal é decidida lá (aqui só explicamos). Vazio = nome padrão.
 */
export function EspecialNomeEditor({ language, nome, nomeAt, onSave, now = Date.now() }: {
  language: Language;
  nome: string;
  nomeAt?: number;
  onSave: (nome: string) => void;
  now?: number;
}) {
  const isPt = language === 'pt-BR';
  const [texto, setTexto] = useState(nome);
  const vazio = texto.trim() === '';
  const valido = vazio || nomeEspecialValido(texto) !== null;
  const restanteMs = nomeAt ? nomeAt + ESPECIAL_NOME_COOLDOWN_MS - now : 0;
  const dias = Math.max(1, Math.ceil(restanteMs / 86_400_000));
  const travado = restanteMs > 0 && !vazio && texto.trim() !== nome;
  const mudou = texto.trim() !== nome;
  return (
    <div data-especial-nome style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
      <label htmlFor="especial-nome" style={{ ...sm2Hint, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
        {isPt ? 'Nome do seu especial' : 'Your special’s name'}
      </label>
      <Field
        id="especial-nome"
        value={texto}
        maxLength={ESPECIAL_NOME_MAX}
        warn={!valido}
        aria-describedby="especial-nome-ajuda"
        placeholder={isPt ? 'Padrão' : 'Default'}
        onChange={e => setTexto(e.target.value)}
      />
      {!valido
        ? <FieldWarn id="especial-nome-ajuda">{isPt ? 'Use só letras, números e espaço, sem palavrões.' : 'Letters, numbers and spaces only, no bad words.'}</FieldWarn>
        : <p id="especial-nome-ajuda" style={{ ...sm2Hint, margin: 0, fontSize: 12 }}>
          {travado
            ? (isPt ? `Dá para trocar de novo em ${dias} ${dias === 1 ? 'dia' : 'dias'}.` : `You can change it again in ${dias} ${dias === 1 ? 'day' : 'days'}.`)
            : (isPt ? `Até ${ESPECIAL_NOME_MAX} caracteres. Quem lutar contra você vê este nome. Troca: uma vez por semana. Vazio volta ao padrão.`
              : `Up to ${ESPECIAL_NOME_MAX} characters. Anyone who duels you sees it. One change per week. Empty goes back to the default.`)}
        </p>}
      <button
        type="button"
        data-especial-nome-salvar
        disabled={!valido || !mudou || travado}
        onClick={() => onSave(texto.trim())}
        style={{ minHeight: 44, borderRadius: 'var(--sm2-radius-md)', border: '1px solid var(--sm2-muted)', background: 'var(--sm2-surface-2)', color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', opacity: !valido || !mudou || travado ? 0.5 : 1 }}
      >
        {isPt ? 'Salvar nome' : 'Save name'}
      </button>
    </div>
  );
}
