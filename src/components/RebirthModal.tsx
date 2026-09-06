/**
 * RENASCIMENTO — a cerimônia do ovo.
 *
 * É a única tela do jogo em que o jogador ESCOLHE quem a criatura vai ser, em
 * vez de responder sobre si mesmo e receber o resultado. Por isso ela só
 * aparece depois do ultra: o controle é a recompensa por ter subido a escada
 * inteira uma vez.
 *
 * Três regras de forma, e nenhuma é decoração:
 *  · **o que se perde é dito ANTES de qualquer escolha**, com nome e número —
 *    e o que NÃO se perde é dito junto, porque é o que faz alguém apertar o
 *    botão. Uma tela que só lista a perda vira uma tela que ninguém usa.
 *  · **é uma vez só, e isso aparece como aviso, não como letra miúda.** Não há
 *    desfazer, e um jogo que esconde isso está vendendo arrependimento.
 *  · **a confirmação exige um segundo toque** (`confirmando`). Não é fricção
 *    por fricção: é a única ação irreversível do app inteiro.
 */
import { useMemo, useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Label, sm2Text, Field } from './form/FormKit';
import {
  rebirthEscolaOptions, rebirthElementOptions, sanitizeCriatura,
  REBIRTH_CRIATURA_MAX,
} from '../utils/rebirth';
import type { RebirthChoices } from '../utils/rebirth';
import type { EscolaId } from '../utils/soulProfile/ficha/types';
import type { Language } from '../utils/i18n';

interface RebirthModalProps {
  language: Language;
  onConfirm: (choices: RebirthChoices) => Promise<boolean> | boolean;
  onClose: () => void;
}

const selectStyle: React.CSSProperties = {
  ...sm2Text,
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--sm2-line)',
  backgroundColor: 'var(--sm2-surface)',
  color: 'var(--sm2-ink)',
};

export function RebirthModal({ language, onConfirm, onClose }: RebirthModalProps) {
  const isPt = language === 'pt-BR';
  const escolas = useMemo(() => rebirthEscolaOptions(), []);
  const elementos = useMemo(() => rebirthElementOptions(), []);

  const [criatura, setCriatura] = useState('');
  const [escola, setEscola] = useState<EscolaId>(escolas[0].id);
  const [elemento, setElemento] = useState(elementos[0].id);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const criaturaLimpa = sanitizeCriatura(criatura);
  const podeSeguir = criaturaLimpa.length > 0 && !ocupado;

  const confirmar = async () => {
    if (!confirmando) { setConfirmando(true); return; }
    setOcupado(true);
    setErro(null);
    const ok = await onConfirm({ criatura: criaturaLimpa, escola, elemento });
    setOcupado(false);
    if (!ok) {
      setConfirmando(false);
      setErro(isPt
        ? 'Não foi possível renascer agora. Nada mudou.'
        : "Couldn't be reborn right now. Nothing changed.");
    }
  };

  const base = elementos.filter(e => e.nivel === 1);
  const pares = elementos.filter(e => e.nivel === 2);

  return (
    <ModalSheet
      open
      onClose={onClose}
      language={language}
      title={isPt ? 'Renascimento' : 'Rebirth'}
      maxWidth={520}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            type="button"
            onClick={confirmar}
            disabled={!podeSeguir}
            style={{ ...sm2Button('primary', !podeSeguir), width: '100%' }}
          >
            {ocupado
              ? (isPt ? 'Renascendo…' : 'Being reborn…')
              : confirmando
                ? (isPt ? 'Tenho certeza — renascer' : "I'm sure — be reborn")
                : (isPt ? 'Renascer' : 'Be reborn')}
          </button>
          <button
            type="button"
            onClick={confirmando ? () => setConfirmando(false) : onClose}
            style={{ ...sm2Button('ghost'), width: '100%' }}
          >
            {confirmando ? (isPt ? 'Voltar' : 'Back') : (isPt ? 'Agora não' : 'Not now')}
          </button>
        </div>
      }
    >
      <p style={{ ...sm2Text, margin: 0 }}>
        {isPt
          ? 'Sua criatura chegou ao topo. O Renascimento devolve ela a um ovo: ela volta a Rookie e os pontos de atributo zeram — em troca, ela nasce de novo mais funda, com mais pontos em todos os estágios, e desta vez quem escolhe o que ela é são vocês dois.'
          : 'Your creature reached the top. Rebirth returns them to an egg: back to Rookie, attribute points reset to zero — in exchange they are born deeper, with more points at every stage, and this time the two of you choose who they are.'}
      </p>

      <p style={sm2Hint}>
        {isPt
          ? 'Nada mais é perdido: Bits, Emblemas, Créditos, decoração, cenários, sonhos, hábitos, tarefas, dias perfeitos e as formas que você já viu continuam exatamente como estão.'
          : 'Nothing else is lost: Bits, Emblems, Credits, decorations, scenes, dreams, habits, tasks, perfect days and the forms you already unlocked all stay exactly as they are.'}
      </p>

      <p style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)' }}>
        {isPt
          ? 'Acontece UMA vez por criatura, e não tem como desfazer.'
          : 'It happens ONCE per creature, and there is no undo.'}
      </p>

      <div>
        <label style={sm2Label} htmlFor="rebirth-criatura">
          {isPt ? 'Que criatura ela vai ser?' : 'What creature will they be?'}
        </label>
        <Field
          id="rebirth-criatura"
          value={criatura}
          maxLength={REBIRTH_CRIATURA_MAX}
          placeholder={isPt ? 'ex.: uma raposa de vidro' : 'e.g. a glass fox'}
          onChange={e => setCriatura(e.target.value)}
        />
        <p style={sm2Hint}>
          {isPt
            ? 'Campo livre — é isto que o desenho da criatura vai seguir.'
            : 'Free text — this is what the creature’s art will follow.'}
        </p>
      </div>

      <div>
        <label style={sm2Label} htmlFor="rebirth-escola">
          {isPt ? 'Escola' : 'School'}
        </label>
        <select
          id="rebirth-escola"
          value={escola}
          onChange={e => setEscola(e.target.value as EscolaId)}
          style={selectStyle}
        >
          {escolas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      </div>

      <div>
        <label style={sm2Label} htmlFor="rebirth-elemento">
          {isPt ? 'Elemento' : 'Element'}
        </label>
        <select
          id="rebirth-elemento"
          value={elemento}
          onChange={e => setElemento(e.target.value)}
          style={selectStyle}
        >
          <optgroup label={isPt ? 'Elementos' : 'Elements'}>
            {base.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </optgroup>
          {/* 2º nível: as combinações. Ficam num grupo à parte porque são
              outra coisa — um par é o encontro de dois elementos, e misturar
              as duas listas esconderia isso. */}
          <optgroup label={isPt ? 'Combinações' : 'Combinations'}>
            {pares.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </optgroup>
        </select>
        <p style={sm2Hint}>
          {isPt
            ? 'A escola e o elemento escolhidos ganham o maior peso na ficha da nova criatura.'
            : 'The chosen school and element get the heaviest weight in the new creature’s sheet.'}
        </p>
      </div>

      {confirmando && (
        <p role="alert" style={{ ...sm2Text, margin: 0 }}>
          {isPt
            ? `Confirmando: sua criatura vira um ovo e renasce como "${criaturaLimpa}". Isso não volta atrás.`
            : `Confirming: your creature becomes an egg and is reborn as "${criaturaLimpa}". This cannot be undone.`}
        </p>
      )}
      {erro && <p role="alert" style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)' }}>{erro}</p>}
    </ModalSheet>
  );
}

export default RebirthModal;
