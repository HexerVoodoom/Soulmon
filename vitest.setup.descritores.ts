// Nos testes a tabela de descritores de elemento já nasce registrada: o app a carrega por `import()` (fora da entrada),
// mas `stagesComElemento`/`pistasVisuaisDoElemento` são síncronas e os testes as chamam direto.
import { registrarDescritoresElemento } from './src/utils/elementoDescritoresStore';
import { DESCRITORES_ELEMENTO } from './src/utils/elementoDescritores.data';

registrarDescritoresElemento(DESCRITORES_ELEMENTO);
