/**
 * Modo cooperativo leve — Fase 4.3 (`docs/PLANO-COOP.md`).
 *
 * O DESENHO DESTA TELA É A FEATURE. O item 4.2 do `docs/PLANO-EVOLUCAO.md`
 * registra que **31,3% relataram efeito psicológico negativo de comparação**
 * em ambiente de leaderboard. Um grupo que mostrasse quanto cada membro
 * contribuiu reinventaria o leaderboard entre amigos — e ali a comparação dói
 * MAIS, porque o outro não é um estranho da lista, é alguém que a pessoa vai
 * olhar na cara depois.
 *
 * Por isso, aqui:
 *  - o número é do GRUPO (`progress/target`), nunca de um membro;
 *  - por pessoa só existe **apareceu hoje: sim/não**, que é binário e não
 *    ordena ninguém;
 *  - **sair é um toque**, sem confirmação e sem penalidade — e a meta encolhe
 *    junto, para que sair não seja sabotagem (o servidor deriva `target` do
 *    tamanho do grupo);
 *  - não há push de cobrança. O grupo nunca avisa que alguém faltou: isso é o
 *    cobrador que a essência declarada proíbe, entregue por terceiro.
 *
 * O servidor sustenta as duas primeiras (`vistaDoGrupo`, em
 * `functions/api/community.js`) — aqui elas são reforçadas, não inventadas.
 */
import { useEffect, useState } from 'react';
import {
  getCoop, createCoop, joinCoop, coopCheckin, leaveCoop, type CoopGroup,
} from '../utils/community';
// ⚠️ Todo `name` daqui tem de estar no inventário de `icon_names` listado em
// `src/styles/tokens.md`: a fonte é SUBSETADA, e um nome fora dele renderiza
// um <span> VAZIO — sem erro, sem aviso, e sem aparecer em teste nenhum.
import { Icon } from './ui/Icon';
import { Field, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

interface CoopPanelProps {
  saveId: string;
  language: Language;
  /** `true` quando a pessoa já cumpriu a própria meta do dia. É o que autoriza
   *  o check-in: cada um tem a SUA meta, e é assim que um grupo com um ultra e
   *  um rookie não vira injustiça. */
  metaDoDiaCumprida: boolean;
}

export function CoopPanel({ saveId, language, metaDoDiaCumprida }: CoopPanelProps) {
  const isPt = language === 'pt-BR';
  /** `undefined` = ainda carregando; `null` = não tem grupo (não é erro). */
  const [group, setGroup] = useState<CoopGroup | null | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    getCoop(saveId)
      .then(g => { if (vivo) setGroup(g); })
      .catch(() => { if (vivo) { setGroup(null); setErro(isPt ? 'Não deu para falar com o servidor.' : "Couldn't reach the server."); } });
    return () => { vivo = false; };
  }, [saveId, isPt]);

  /** Toda ação passa por aqui: um só lugar decide "ocupado" e traduz o erro. */
  const agir = async (fn: () => Promise<CoopGroup | null>) => {
    setOcupado(true);
    setErro(null);
    try {
      setGroup(await fn());
    } catch (e) {
      const code = String((e as Error)?.message ?? '');
      setErro(
        code === 'invalid code' ? (isPt ? 'Esse código não existe (ou o grupo acabou).' : "That code doesn't exist (or the group is gone).")
          : code === 'group full' ? (isPt ? 'Esse grupo já está cheio.' : 'That group is already full.')
            : code === 'already in a group' ? (isPt ? 'Você já está num grupo.' : "You're already in a group.")
              : (isPt ? 'Não deu certo agora. Tente de novo.' : "That didn't work. Try again."),
      );
    } finally {
      setOcupado(false);
    }
  };

  if (group === undefined) {
    return (
      <p style={{ ...sm2Hint, display: 'flex', alignItems: 'center', gap: 8, padding: '24px 0', justifyContent: 'center' }}>
        <Icon name="sync" size={24} tone="primary" className="animate-spin" />
        {isPt ? 'Procurando seu grupo…' : 'Looking for your group…'}
      </p>
    );
  }

  const aviso = erro && (
    <p role="alert" style={{ ...sm2Text, color: 'var(--sm2-danger-ink)' }}>{erro}</p>
  );

  // ── Sem grupo: criar ou entrar ─────────────────────────────────────────────
  if (!group) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={sm2Text}>
          {isPt
            ? 'Um grupo é de 2 a 4 pessoas com uma meta da semana em comum. Ninguém vê quanto o outro fez — só se apareceu.'
            : 'A group is 2 to 4 people with one shared weekly goal. Nobody sees how much anyone else did — only whether they showed up.'}
        </p>
        {aviso}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={sm2Hint} htmlFor="coop-nome">{isPt ? 'Criar um grupo' : 'Create a group'}</label>
          <Field
            id="coop-nome"
            value={nome}
            maxLength={24}
            onChange={e => setNome(e.target.value)}
            placeholder={isPt ? 'Nome do grupo' : 'Group name'}
          />
          <button
            type="button"
            disabled={ocupado || !nome.trim()}
            onClick={() => agir(() => createCoop(saveId, nome.trim()))}
            style={sm2Button('primary')}
          >
            <Icon name="add" size={20} />
            {isPt ? 'Criar' : 'Create'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={sm2Hint} htmlFor="coop-codigo">
            {/* Entra-se por CÓDIGO, nunca por busca: grupo achável é raide de
                estranho, e o diretório já respeita consentimento (N-4). */}
            {isPt ? 'Ou entrar com um código de convite' : 'Or join with an invite code'}
          </label>
          <Field
            id="coop-codigo"
            value={codigo}
            maxLength={8}
            autoCapitalize="characters"
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="ABCD2345"
            style={{ letterSpacing: '0.12em' }}
          />
          <button
            type="button"
            disabled={ocupado || codigo.trim().length < 8}
            onClick={() => agir(() => joinCoop(saveId, codigo.trim()))}
            style={sm2Button('ghost')}
          >
            <Icon name="arrow_forward" size={20} />
            {isPt ? 'Entrar' : 'Join'}
          </button>
        </div>
      </div>
    );
  }

  // ── Com grupo ──────────────────────────────────────────────────────────────
  const euApareci = group.members.find(m => m.euMesmo)?.apareceuHoje ?? false;
  const completo = group.progress >= group.target;
  const pct = group.target > 0 ? Math.min(100, Math.round((group.progress / group.target) * 100)) : 0;
  const sozinho = group.members.length < 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ ...sm2Text, fontWeight: 600, margin: 0 }}>{group.name}</h2>
        <p className="sm2-num" style={{ ...sm2Hint, marginTop: 2 }}>
          {isPt ? `${group.progress} de ${group.target} nesta semana` : `${group.progress} of ${group.target} this week`}
        </p>
      </div>

      {/* A barra do GRUPO. É o único número da tela, de propósito. */}
      <div
        role="progressbar"
        aria-valuenow={group.progress}
        aria-valuemin={0}
        aria-valuemax={group.target}
        aria-label={isPt ? 'Progresso do grupo nesta semana' : "Group progress this week"}
        style={{ height: 10, borderRadius: 6, backgroundColor: 'var(--sm2-surface-2)', overflow: 'hidden' }}
      >
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--sm2-primary-fill)' }} />
      </div>

      {completo && (
        <p role="status" style={{ ...sm2Text, color: 'var(--sm2-primary-ink)' }}>
          {isPt ? 'Meta da semana batida. Foi de todo mundo 🌿' : "Weekly goal reached. That was everyone's 🌿"}
        </p>
      )}

      {aviso}

      {/* Um grupo de UM é um estado real (todo mundo saiu, ou ninguém entrou
          ainda) e costuma ser o esquecido. Aqui ele tem texto próprio, e não
          uma barra sozinha que parece defeito. */}
      {sozinho && (
        <p style={sm2Hint}>
          {isPt
            ? 'Por enquanto é só você. Passe o código abaixo para até 3 pessoas.'
            : "It's just you for now. Share the code below with up to 3 people."}
        </p>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {group.members.map((m, i) => (
          <li
            key={m.id ?? `m${i}`}
            style={{ ...sm2Text, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <Icon
              name={m.apareceuHoje ? 'check_circle' : 'radio_button_unchecked'}
              size={20}
              tone={m.apareceuHoje ? 'primary' : 'muted'}
            />
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.name ?? (isPt ? 'Alguém' : 'Someone')}
              {m.euMesmo && <span style={{ ...sm2Hint, marginLeft: 6 }}>{isPt ? '· você' : '· you'}</span>}
            </span>
            {/* Presença, e SÓ presença. Nada de "3 dias", nada de posição. */}
            <span style={sm2Hint}>
              {m.apareceuHoje
                ? (isPt ? 'apareceu hoje' : 'showed up today')
                : (isPt ? 'ainda não hoje' : 'not yet today')}
            </span>
          </li>
        ))}
      </ul>

      {!euApareci && (
        <button
          type="button"
          disabled={ocupado || !metaDoDiaCumprida}
          onClick={() => agir(() => coopCheckin(saveId))}
          style={sm2Button('primary')}
        >
          <Icon name="task_alt" size={20} />
          {isPt ? 'Avisar que apareci hoje' : "Let them know I showed up"}
        </button>
      )}
      {!euApareci && !metaDoDiaCumprida && (
        // Sem cobrança: diz o que falta, não o que a pessoa deixou de fazer.
        <p style={sm2Hint}>
          {isPt
            ? 'Vale quando você cumprir a sua própria meta do dia — que é a sua, não a do grupo.'
            : "This counts once you hit your own daily goal — yours, not the group's."}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={sm2Hint}>{isPt ? 'Código de convite' : 'Invite code'}</span>
        <code className="sm2-num" style={{ ...sm2Text, letterSpacing: '0.12em' }}>{group.code}</code>
        <button
          type="button"
          onClick={() => {
            // `clipboard` não existe em todo lugar (WebView antigo, contexto
            // não seguro). O código está escrito na tela do lado, então falhar
            // aqui não tira nada de ninguém — só não avisa "copiado".
            navigator.clipboard?.writeText(group.code)
              .then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); })
              .catch(() => {});
          }}
          style={{ ...sm2Button('ghost'), padding: '6px 10px' }}
          aria-label={isPt ? 'Copiar o código de convite' : 'Copy the invite code'}
        >
          <Icon name={copiado ? 'check' : 'content_copy'} size={20} />
        </button>
      </div>

      {/* Saída limpa: um toque, sem diálogo de confirmação e sem penalidade.
          Um "tem certeza?" aqui seria o app negociando com quem quer sair. */}
      <button
        type="button"
        disabled={ocupado}
        onClick={() => agir(async () => { await leaveCoop(saveId); return null; })}
        style={{ ...sm2Button('ghost'), color: 'var(--sm2-muted)' }}
      >
        {isPt ? 'Sair do grupo' : 'Leave the group'}
      </button>
    </div>
  );
}
