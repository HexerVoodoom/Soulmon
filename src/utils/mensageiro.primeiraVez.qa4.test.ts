import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mailPopupToShow, messengerIntroSeen, markMessengerIntroSeen, type MailItem } from './mensageiro';
import { sanitizeBuildingIntrosSeen } from './buildingIntro';

// Item E do QA r4 C2 (REGISTRO §390, dono 14/11/2026): "Pop up da mensagem com npc só na primeira vez. Depois, quando receber
// cartas novas, só fica a marca de bolinha vermelha no ícone."

const carta = (mid: string, read = false): MailItem => ({ mid, titlePt: 't', titleEn: 't', bodyPt: 'b', bodyEn: 'b', bits: 0, emblems: 0, at: 1, read, claimedAt: 0 });

describe('o pop-up do Papus aparece UMA vez na vida da conta', () => {
  it('1ª carta: pop-up; depois de visto, a 2ª carta em diante não abre pop-up nenhum', () => {
    let intros: string[] = [];
    const announced: string[] = [];
    expect(mailPopupToShow({ mail: [carta('a')], announced, introsSeen: intros }).map(m => m.mid)).toEqual(['a']);
    intros = markMessengerIntroSeen(intros); // o App grava ao MOSTRAR
    expect(markMessengerIntroSeen(intros)).toBe(intros);
    expect(mailPopupToShow({ mail: [carta('a'), carta('b')], announced, introsSeen: intros })).toEqual([]);
    expect(mailPopupToShow({ mail: [carta('c')], announced, introsSeen: intros })).toEqual([]);
  });

  it('quem já viu o pop-up antes desta versão conta como visto (anúncio gravado no aparelho ou carta já lida na conta)', () => {
    expect(messengerIntroSeen({ introsSeen: [], announced: ['velha'], mail: [] })).toBe(true);
    expect(messengerIntroSeen({ introsSeen: undefined, announced: [], mail: [carta('x', true), carta('y')] })).toBe(true);
    expect(messengerIntroSeen({ introsSeen: undefined, announced: [], mail: [carta('y')] })).toBe(false);
  });

  it('o "visto" mora no save (`buildingIntrosSeen`, viaja entre aparelhos) e sobrevive à higienização', () => {
    expect(sanitizeBuildingIntrosSeen(['npc.mensageiro', 'lixo', 'mercado.itens'], 1)).toEqual(['npc.mensageiro', 'mercado.itens']);
  });

  it('o App liga o pop-up da fila só pelo `mailPopupToShow` e grava o visto ao mostrar', () => {
    const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');
    expect(app).toMatch(/const mailToAnnounce = useMemo\(\(\) => mailPopupToShow\(/);
    expect(app).toMatch(/id === 'messenger'[\s\S]{0,300}markMessengerIntroSeen\(prev\.buildingIntrosSeen\)/);
  });
});
