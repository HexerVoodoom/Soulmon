import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { notificationPetName } from './petName';

describe('nome do pet nas notificações (rename)', () => {
  it('usa o apelido atual, não o nome da espécie/estágio', () => {
    expect(notificationPetName({ baseName: 'Flamix', petName: 'Brasinha' }, 'Flamix')).toBe('Brasinha');
  });
  it('renomear muda o valor (dispara reagendamento e novo subscribe)', () => {
    const antes = notificationPetName({ baseName: 'Flamix', petName: 'Brasinha' }, 'Flamix');
    const depois = notificationPetName({ baseName: 'Flamix', petName: 'Chama' }, 'Flamix');
    expect(depois).not.toBe(antes);
    expect(depois).toBe('Chama');
  });
  it('sem apelido ou só espaços cai no baseName e depois no estágio', () => {
    expect(notificationPetName({ baseName: 'Flamix', petName: '  ' }, 'Estagio')).toBe('Flamix');
    expect(notificationPetName(null, 'Estagio')).toBe('Estagio');
  });
  it('App passa o apelido ao NotificationManager (contrato)', () => {
    const src = readFileSync('src/App.tsx', 'utf8');
    expect(src).toMatch(/<NotificationManager[\s\S]*?petName=\{notificationPetName\(gameState\.soulmonMeta/);
  });
});
