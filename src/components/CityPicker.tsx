// ---------------------------------------------------------------------------
// CityPicker — busca de cidade de nascimento com fuso IANA.
//
// Por que uma TABELA e não um campo livre: o mapa astral precisa de latitude,
// longitude e, principalmente, do fuso IANA — é ele que carrega as regras
// HISTÓRICAS de horário de verão, e errar isso desloca o Ascendente em ~15°
// (nascer em janeiro de 1994 em São Paulo era UTC−2, não UTC−3). Texto livre
// não entrega nada disso, e adivinhar coordenada por nome de cidade é
// exatamente o tipo de precisão inventada que o resto do módulo se recusa a
// fazer.
//
// Por que a tabela é embarcada e não uma API de geocoding: um mapa precisa de
// coordenada boa a alguns quilômetros, não a nível de rua. Embarcar mantém o
// onboarding instantâneo, offline e sem consulta a terceiro com a data de
// nascimento de ninguém.
//
// Quem nasceu fora da lista escolhe a cidade grande mais próxima — a dica
// abaixo do campo diz isso, em vez de deixar a pessoa travada procurando.
// ---------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import { cityLabel, searchCities, type City } from '../utils/soulProfile/cities';
import { Field, choiceStyle, sm2Hint } from './form/FormKit';
import { InfoTip } from './ui/InfoTip';

interface CityPickerProps {
  value: City | null;
  onChange: (city: City | null) => void;
  isPt: boolean;
  /**
   * Estilos do chamador. Sem eles, o campo é o `Field` e a sugestão é a
   * `choiceStyle` do `FormKit` (canvas Conta, §29: o kit pixel `sm-px-field`/
   * `sm-px-choice` saiu deste passo — o onboarding passa os seus, iguais aos
   * do nome e das 6 perguntas; a `OraclePage`, ferramenta de dev, os dela).
   */
  inputStyle?: React.CSSProperties;
  optionStyle?: (selected: boolean) => React.CSSProperties;
  inputClass?: string;
  optionClass?: string;
}

export function CityPicker({ value, onChange, isPt, inputStyle, optionStyle = choiceStyle, inputClass, optionClass }: CityPickerProps) {
  const [query, setQuery] = useState(value ? cityLabel(value, isPt) : '');
  const [touched, setTouched] = useState(false);

  const matches = useMemo(() => (touched ? searchCities(query, 6) : []), [query, touched]);
  const showList = touched && !!query.trim() && !(value && cityLabel(value, isPt) === query);

  return (
    <div>
      <Field
        className={inputClass}
        style={inputStyle}
        type="text"
        value={query}
        autoFocus
        autoComplete="off"
        placeholder={isPt ? 'Ex.: São Paulo' : 'E.g.: London'}
        aria-label={isPt ? 'Cidade de nascimento' : 'Birth city'}
        onChange={e => {
          setQuery(e.target.value);
          setTouched(true);
          if (value) onChange(null);
        }}
      />

      {showList && (
        <div style={{ marginTop: 10 }}>
          {matches.length === 0 ? (
            <p style={{ ...sm2Hint, margin: '4px 2px' }}>
              {isPt
                ? 'Nenhuma cidade com esse nome na lista. Escolha a cidade grande mais próxima — o mapa só precisa da região e do fuso.'
                : "No city by that name in the list. Pick the nearest large city — the chart only needs the region and the timezone."}
            </p>
          ) : (
            matches.map(city => (
              <button
                key={`${city.name}-${city.region}-${city.country}`}
                className={optionClass}
                aria-pressed={false}
                style={optionStyle(false)}
                onClick={() => {
                  onChange(city);
                  setQuery(cityLabel(city, isPt));
                }}
              >
                {cityLabel(city, isPt)}
              </button>
            ))
          )}
        </div>
      )}

      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '6px 2px 0' }}>
          <p style={{ ...sm2Hint, margin: 0 }}>
            {isPt ? 'Fuso horário: ' : 'Timezone: '}
            <strong className="sm2-num" style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>{value.timeZone}</strong>
          </p>
          <InfoTip language={isPt ? 'pt-BR' : 'en-US'} label={isPt ? 'Sobre o fuso horário' : 'About the timezone'} align="left" style={{ minHeight: 24 }}>
            {isPt
              ? 'É o fuso que faz o horário de verão da sua data de nascimento ser respeitado.'
              : 'This is what makes the daylight saving rules of your birth date apply.'}
          </InfoTip>
        </div>
      )}
    </div>
  );
}
