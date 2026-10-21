// @vitest-environment jsdom
/**
 * L08-04 — tela "Restaurar backup". Trava: lista com data e resumo SEM número
 * (além da data), confirmação antes de restaurar, reload só depois de 'ok',
 * PT e EN.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { RestoreBackupSection } from './RestoreBackupSection';
import { STORAGE_KEYS } from '../utils/storageKeys';

const ESTADO = { soulmonMeta: { baseName: 'Luma' }, evolutionStage: 'champion', totalXP: 4321, completedTasks: [{ id: 1 }, { id: 2 }] };

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ soulmonMeta: { baseName: 'Atual' }, totalXP: 5 }));
  localStorage.setItem(STORAGE_KEYS.BACKUP_RING, JSON.stringify({
    formato: 'soulmon-backup-ring-v1',
    copias: [{ saveId: '', salvoEm: '2026-10-01T10:30:00Z', motivo: 'logout', state: ESTADO }],
  }));
});
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe.each([
  ['pt-BR' as const, { abrir: /Restaurar backup/, escolher: /Escolher esta cópia/, ok: /^Restaurar$/, cancelar: /Cancelar/, origem: /saiu da conta/, vazio: /Ainda não há cópias neste aparelho/, conf: /Restaurar esta cópia\?/, importar: /Importar arquivo/, estagio: /Ascendente/ }],
  ['en-US' as const, { abrir: /Restore a backup/, escolher: /Choose this copy/, ok: /^Restore$/, cancelar: /Cancel/, origem: /left the account/, vazio: /No copies on this device yet/, conf: /Restore this copy\?/, importar: /Import file/, estagio: /Ascendant/ }],
])('RestoreBackupSection (%s)', (lang, t) => {
  it('lista com resumo, data e origem, sem XP/percentual/contagem', () => {
    const { container } = renderWithCss(<RestoreBackupSection language={lang} reload={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: t.abrir }));
    expect(screen.getByText(/Luma/).textContent).toMatch(t.estagio);
    expect(screen.getByText(t.origem)).toBeTruthy();
    expect(screen.getByRole('button', { name: t.importar })).toBeTruthy();
    const txt = container.textContent ?? '';
    expect(txt).not.toMatch(/\d+\s*(xp|%)/i);
    expect(txt).not.toMatch(/4321/);
    expect(txt).toMatch(/2026/); // a data aparece
  });

  it('lista vazia diz isso com calma', () => {
    localStorage.removeItem(STORAGE_KEYS.BACKUP_RING);
    renderWithCss(<RestoreBackupSection language={lang} reload={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: t.abrir }));
    expect(screen.getByText(t.vazio)).toBeTruthy();
  });

  it('confirma antes; cancelar não troca nada nem recarrega; confirmar recarrega só depois de ok', async () => {
    const reload = vi.fn();
    renderWithCss(<RestoreBackupSection language={lang} reload={reload} />);
    fireEvent.click(screen.getByRole('button', { name: t.abrir }));
    fireEvent.click(screen.getByRole('button', { name: t.escolher }));
    expect(screen.getByText(t.conf)).toBeTruthy();
    expect(reload).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Atual');

    fireEvent.click(screen.getByRole('button', { name: t.cancelar }));
    expect(reload).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Atual');

    fireEvent.click(screen.getByRole('button', { name: t.escolher }));
    fireEvent.click(screen.getByRole('button', { name: t.ok }));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Luma');
    const motivos = (JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKUP_RING)!).copias as Array<{ motivo: string }>).map(c => c.motivo);
    expect(motivos).toContain('antes-de-restaurar');
  });

  it('falha ao guardar o atual (cota): mensagem calma e nenhum reload', async () => {
    const reload = vi.fn();
    renderWithCss(<RestoreBackupSection language={lang} reload={reload} />);
    fireEvent.click(screen.getByRole('button', { name: t.abrir }));
    fireEvent.click(screen.getByRole('button', { name: t.escolher }));
    const orig = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (k === STORAGE_KEYS.BACKUP_RING) throw new DOMException('cheio', 'QuotaExceededError');
      return orig.call(this, k, v);
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: t.ok }));
    await waitFor(() => expect(screen.getByText(lang === 'pt-BR' ? /Nada foi alterado/ : /Nothing changed/)).toBeTruthy());
    expect(reload).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Atual');
  });

  it('arquivo não reconhecido: erro calmo; arquivo válido leva à confirmação', async () => {
    renderWithCss(<RestoreBackupSection language={lang} reload={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: t.abrir }));
    const input = screen.getByTestId('restore-file-input') as HTMLInputElement;
    const arq = (txt: string) => new File([txt], 'b.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [arq('lixo')] } });
    await waitFor(() => expect(screen.getByText(lang === 'pt-BR' ? /Não reconhecemos este arquivo/ : /did not recognize this file/)).toBeTruthy());
    fireEvent.change(input, { target: { files: [arq(JSON.stringify({ format: 'soulmon-local-backup-v1', generatedAt: '2026-10-05T00:00:00Z', state: ESTADO }))] } });
    await waitFor(() => expect(screen.getByText(t.conf)).toBeTruthy());
  });
});
