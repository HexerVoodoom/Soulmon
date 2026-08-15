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

interface CityPickerProps {
  value: City | null;
  onChange: (city: City | null) => void;
  isPt: boolean;
  inputStyle: React.CSSProperties;
  optionStyle: (selected: boolean) => React.CSSProperties;
}

export function CityPicker({ value, onChange, isPt, inputStyle, optionStyle }: CityPickerProps) {
  const [query, setQuery] = useState(value ? cityLabel(value) : '');
  const [touched, setTouched] = useState(false);

  const matches = useMemo(() => (touched ? searchCities(query, 6) : []), [query, touched]);
  const showList = touched && !!query.trim() && !(value && cityLabel(value) === query);

  return (
    <div>
      <input
        style={inputStyle}
        type="text"
        value={query}
        autoFocus
        autoComplete="off"
        placeholder={isPt ? 'Ex.: São Paulo' : 'E.g.: London'}
        onChange={e => {
          setQuery(e.target.value);
          setTouched(true);
          if (value) onChange(null);
        }}
      />

      {showList && (
        <div style={{ marginTop: 10 }}>
          {matches.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--sm-muted)', margin: '4px 2px', lineHeight: 1.5 }}>
              {isPt
                ? 'Nenhuma cidade com esse nome na lista. Escolha a cidade grande mais próxima — o mapa só precisa da região e do fuso.'
                : "No city by that name in the list. Pick the nearest large city — the chart only needs the region and the timezone."}
            </p>
          ) : (
            matches.map(city => (
              <button
                key={`${city.name}-${city.region}-${city.country}`}
                style={optionStyle(false)}
                onClick={() => {
                  onChange(city);
                  setQuery(cityLabel(city));
                }}
              >
                {cityLabel(city)}
              </button>
            ))
          )}
        </div>
      )}

      {value && (
        <p style={{ fontSize: 12, color: 'var(--sm-muted)', margin: '10px 2px 0', lineHeight: 1.5 }}>
          {isPt ? 'Fuso horário: ' : 'Timezone: '}
          <strong style={{ color: 'var(--sm-ink)' }}>{value.timeZone}</strong>
          {isPt
            ? ' — é ele que faz o horário de verão da sua data de nascimento ser respeitado.'
            : ' — this is what makes the daylight saving rules of your birth date apply.'}
        </p>
      )}
    </div>
  );
}
