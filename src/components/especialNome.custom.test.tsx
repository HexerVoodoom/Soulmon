// @vitest-environment jsdom
/**
 * Nome do especial escolhido pelo jogador: aparece no selo dele (por cima da ficha), o oponente o mostra no Duelo,
 * sem nome cai no padrão, e a tela de escolha avisa de forma inválida e de troca travada.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import { DuelScreen } from './DuelScreen';
import { duelSide } from '../../functions/api/_duel.js';
import type { DuelSide } from '../utils/combate/duel';
import { comNomeDoEspecial } from '../utils/soulProfile/ficha/especialNome';
import { stageSkillsFor } from '../utils/soulProfile/ficha/stageSkillsFor';
import { specialLabel } from '../utils/combatFx';
import { EspecialNomeEditor } from './perfil/EspecialNomeEditor';

type Cena = { specialLabel?: string; foe?: string };
const cenas: Cena[] = [];
vi.mock('./games/BattleStage', async (orig) => {
  const m = await orig<typeof import('./games/BattleStage')>();
  return { ...m, BattleStage: (p: Parameters<typeof m.BattleStage>[0]) => { cenas.push({ specialLabel: p.specialLabel, foe: p.foeSpecialLabel?.(p.foes[0]) }); return m.BattleStage(p); } };
});
vi.mock('../utils/sounds', () => ({ isMuted: () => false, playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn(), playFeed: vi.fn(), playTaskComplete: vi.fn() }));
afterEach(() => { cleanup(); cenas.length = 0; });

const NOME = { pt: 'Zelo de Fogo', en: 'Fire Zeal' };
const ficha = () => {
  const mk = (tipo: 'basica' | 'especial') => ({
    tipo, nome: tipo === 'especial' ? NOME : { pt: 'Golpe', en: 'Strike' }, descricao: { pt: 'd', en: 'd' },
    elementoId: 'fogo', elementoNome: { pt: 'Fogo', en: 'Fire' }, escolaId: 'combate_fisico', recursoId: 'furia', custo: 'baixo', familia: 'atkBuff',
  });
  return { rookie: { basica: mk('basica'), especial: mk('especial') } as unknown as StageSkills };
};

describe('nome do especial escolhido', () => {
  it('por cima da ficha: o selo do jogador usa o nome dele nos dois idiomas; vazio mantém o gerado; o cache não muda', () => {
    const base = ficha();
    const com = comNomeDoEspecial(base, 'Raio Solar');
    const par = stageSkillsFor(com, 'baby1');
    expect(specialLabel(true, par?.especial)).toBe('Raio Solar');
    expect(specialLabel(false, par?.especial)).toBe('Raio Solar');
    expect(base.rookie.especial.nome).toEqual(NOME);
    expect(comNomeDoEspecial(base, '')).toBe(base);
    expect(comNomeDoEspecial(base, undefined)).toBe(base);
    expect(comNomeDoEspecial(undefined, 'x')).toBeUndefined();
  });

  const duelo = (oppEspecialNome?: string) => {
    const s = duelSide({ evolutionStage: 'rookie', perfectDays: 3 }) as unknown as DuelSide;
    render(<DuelScreen me={s} opp={s} seed={1} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt petElement="fogo"
      petStage="rookie" skills={ficha()} oppElement="agua" oppEspecialNome={oppEspecialNome} onDone={() => {}} onClose={() => {}} />);
    return cenas.at(-1)!;
  };
  it('Duelo: o oponente mostra o nome que o dono escolheu', () => {
    expect(duelo('Maré Viva').foe).toBe('Maré Viva');
  });
  it('Duelo: sem nome escolhido (ou só espaços), o nome por regra de sempre', () => {
    const padrao = duelo(undefined).foe;
    expect(padrao).toBeTruthy();
    expect(padrao).not.toBe('Maré Viva');
    cleanup(); cenas.length = 0;
    expect(duelo('   ').foe).toBe(padrao);
  });

  it('Editor: palavrão e símbolo travam o botão e avisam; nome bom salva aparado; troca recente mostra os dias e trava', () => {
    const salvar = vi.fn();
    const { rerender } = render(<EspecialNomeEditor language="pt-BR" nome="" onSave={salvar} />);
    const campo = screen.getByLabelText(/Nome do seu especial/i) as HTMLInputElement;
    const botao = screen.getByRole('button', { name: /Salvar nome/i }) as HTMLButtonElement;
    fireEvent.change(campo, { target: { value: 'Caralho' } });
    expect(botao.disabled).toBe(true);
    expect(screen.getByText(/sem palavrões/i)).toBeTruthy();
    fireEvent.change(campo, { target: { value: 'Raio!' } });
    expect(botao.disabled).toBe(true);
    fireEvent.change(campo, { target: { value: ' Raio Solar ' } });
    expect(botao.disabled).toBe(false);
    fireEvent.click(botao);
    expect(salvar).toHaveBeenCalledWith('Raio Solar');
    const agora = Date.now();
    rerender(<EspecialNomeEditor language="en-US" nome="Raio Solar" nomeAt={agora - 2 * 86_400_000} now={agora} onSave={salvar} />);
    fireEvent.change(screen.getByLabelText(/special’s name/i), { target: { value: 'Outro' } });
    expect((screen.getByRole('button', { name: /Save name/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/again in 5 days/i)).toBeTruthy();
  });
});
