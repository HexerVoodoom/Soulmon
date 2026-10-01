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
 *
 * Canvas Evolução (`RenascimentoModal`/`Confirmando`, D-E8, 20/09/2026): a
 * folha SIS-04 (`ModalSheet`) com campo SIS-03 e dois `combobox` lado a lado
 * (`expand_more` 24, `select` nativo com `appearance: none` — os `optgroup`s
 * do elemento ficam); "Be reborn" INERTE POR SUPERFÍCIE (`surface-2` +
 * `muted` + `aria-disabled`), nunca opacidade; o `role=alert` com filete
 * `gold-ink` 3px; NADA de vermelho — o "ONCE" é 12/500 `muted`, o erro é
 * âmbar; "Renascendo…" em `muted` com `aria-busy`.
 */
import { useMemo, useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Label, sm2Text, Field } from './form/FormKit';
import { Icon } from './ui/Icon';
import { OVO_RENASCIMENTO } from '../utils/visorScenes';
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

/** O `combobox` do canvas: campo filled 44 (`surface-2` + `muted` 1px, raio
 *  12, 16px) com `expand_more` 24 pelado à direita — o `select` nativo por
 *  baixo, sem a seta do sistema. */
const selectStyle: React.CSSProperties = {
  fontFamily: 'var(--sm2-font-text)',
  fontSize: 'var(--sm2-text-md)',
  lineHeight: 'var(--sm2-leading-body)',
  width: '100%',
  minHeight: 44,
  boxSizing: 'border-box',
  padding: '0 40px 0 12px',
  borderRadius: 'var(--sm2-radius-md)',
  border: '1px solid var(--sm2-muted)',
  backgroundColor: 'var(--sm2-surface-2)',
  color: 'var(--sm2-ink)',
  appearance: 'none',
  WebkitAppearance: 'none',
};

function Combo({ id, label, value, onChange, children }: {
  id: string; label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  // Foco = fronteira + anel 2px `primary-ink` por `box-shadow`, como o `Field`.
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={sm2Label} htmlFor={id}>{label}</label>
      <span style={{ position: 'relative', display: 'block' }}>
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          className="sm2-form-field"
          style={{
            ...selectStyle,
            ...(focus ? { borderColor: 'var(--sm2-primary-ink)', boxShadow: '0 0 0 2px var(--sm2-primary-ink)' } : null),
          }}
        >
          {children}
        </select>
        <Icon name="expand_more" size={24} tone="muted" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </span>
    </div>
  );
}

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
            onClick={podeSeguir ? confirmar : undefined}
            aria-disabled={!podeSeguir}
            aria-busy={ocupado}
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
            style={{ ...sm2Button('outline'), width: '100%' }}
          >
            {confirmando ? (isPt ? 'Voltar' : 'Back') : (isPt ? 'Agora não' : 'Not now')}
          </button>
        </div>
      }
    >
      {/* O ovo da cerimônia (leva `visores`, 01/10/2026): casulo de cristal com raízes, 256² a 0,5×. */}
      <img
        src={OVO_RENASCIMENTO}
        alt=""
        aria-hidden="true"
        draggable={false}
        data-rebirth-egg
        width={128}
        height={128}
        style={{ display: 'block', alignSelf: 'center', margin: '0 auto', imageRendering: 'pixelated' }}
      />
      <p style={{ ...sm2Text, margin: 0 }}>
        {isPt
          ? 'Sua criatura chegou ao topo. O Renascimento devolve ela a um ovo: ela volta a Rookie e os pontos de atributo zeram — em troca, ela nasce de novo mais funda, com mais pontos em todos os estágios, e desta vez quem escolhe o que ela é são vocês dois.'
          : 'Your creature reached the top. Rebirth returns them to an egg: back to Rookie, attribute points reset to zero — in exchange they are born deeper, with more points at every stage, and this time the two of you choose who they are.'}
      </p>

      <p style={sm2Hint}>
        {isPt
          ? 'Nada mais é perdido: Bits, Honra, Créditos, decoração, cenários, sonhos, hábitos, tarefas, dias completos e as formas que você já viu continuam exatamente como estão.'
          : 'Nothing else is lost: Bits, Honor, Credits, decorations, scenes, dreams, habits, tasks, complete days and the forms you already unlocked all stay exactly as they are.'}
      </p>

      <p style={{ ...sm2Hint, fontWeight: 500 }}>
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

      <div style={{ display: 'flex', gap: 8 }}>
        <Combo id="rebirth-escola" label={isPt ? 'Escola' : 'School'} value={escola} onChange={v => setEscola(v as EscolaId)}>
          {escolas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </Combo>
        <Combo id="rebirth-elemento" label={isPt ? 'Elemento' : 'Element'} value={elemento} onChange={setElemento}>
          <optgroup label={isPt ? 'Elementos' : 'Elements'}>
            {base.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </optgroup>
          {/* 2º nível: as combinações. Ficam num grupo à parte porque são
              outra coisa — um par é o encontro de dois elementos, e misturar
              as duas listas esconderia isso. */}
          <optgroup label={isPt ? 'Combinações' : 'Combinations'}>
            {pares.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </optgroup>
        </Combo>
      </div>
      <p style={sm2Hint}>
        {isPt
          ? 'A escola e o elemento escolhidos ganham o maior peso na ficha da nova criatura.'
          : 'The chosen school and element get the heaviest weight in the new creature’s sheet.'}
      </p>

      {/* O alerta de confirmação: filete `gold-ink` 3px — âmbar, nunca vermelho. */}
      {confirmando && (
        <p role="alert" style={{ ...sm2Text, margin: 0, borderLeft: '3px solid var(--sm2-gold-ink)', paddingLeft: 12 }}>
          {isPt
            ? `Confirmando: sua criatura vira um ovo e renasce como "${criaturaLimpa}". Isso não volta atrás.`
            : `Confirming: your creature becomes an egg and is reborn as "${criaturaLimpa}". This cannot be undone.`}
        </p>
      )}
      {erro && <p role="alert" style={{ ...sm2Hint, borderLeft: '3px solid var(--sm2-gold-ink)', paddingLeft: 12 }}>{erro}</p>}
    </ModalSheet>
  );
}

export default RebirthModal;
