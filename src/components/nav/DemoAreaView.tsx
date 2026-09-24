import { useState } from 'react';
import type { AreaId } from '../../navigation';
import type { Language } from '../../utils/i18n';
import { AreaScene, type AreaLot } from './AreaScene';
import { AreaSheet } from './AreaSheet';
import { areaDemoLot } from '../../utils/areaSheetCopy';
import { sm2Text } from '../form/FormKit';

/**
 * UMA ÁREA AINDA SEM CONTEÚDO (minimal-ui F4) — o molde com UM lote de
 * exemplo e placeholder, para as áreas cuja fatia de F5 ainda não chegou.
 *
 * Saiu do `App.tsx` para entrar por `lazy()`: o chunk de entrada está acima do
 * orçamento de bytes (`orcamentoDeBytes.contract.test.ts`, decisão #31) e o
 * molde (cena, folha, NPCs, copy) não é necessário para a Home abrir. O `App`
 * monta com `key` da view: trocar de área fecha a folha.
 */
export function DemoAreaView({ area, language }: { area: AreaId; language: Language }) {
  const [open, setOpen] = useState(false);
  const demo = areaDemoLot(area, language);
  return (
    <AreaScene
      areaId={area}
      language={language}
      lots={[{
        id: 'exemplo',
        label: demo.label,
        left: '50%', top: '38%',
        ariaLabel: demo.label,
        onOpen: () => setOpen(true),
      } satisfies AreaLot]}
    >
      <AreaSheet
        areaId={area}
        title={demo.label}
        closeLabel={language === 'pt-BR' ? 'Fechar' : 'Close'}
        open={open}
        onClose={() => setOpen(false)}
      >
        <p style={{ ...sm2Text, margin: 0 }}>{demo.placeholder}</p>
      </AreaSheet>
    </AreaScene>
  );
}
