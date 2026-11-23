import { createContext, useContext } from 'react';
import type { ResultExtras } from '../../utils/resultExtras';

/** Dados do save que a tela de resultado lê sem prop-drilling (barra de Bits do dia e missão do dia). Sem provider = sem extras. */
export const ResultExtrasContext = createContext<ResultExtras | undefined>(undefined);
export const useResultExtras = (): ResultExtras | undefined => useContext(ResultExtrasContext);
