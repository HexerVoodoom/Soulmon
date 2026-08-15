export interface City {
  name: string;
  /** State or province abbreviation; empty for cities outside Brazil. */
  region: string;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  latitude: number;
  longitude: number;
  /**
   * IANA timezone. Used to resolve the birth moment to UTC including the
   * historical daylight-saving rules in force on that date, which is what
   * makes the difference between a correct and a wrong Ascendant.
   */
  timeZone: string;
}

/**
 * Curated place table: every Brazilian state capital, the larger Brazilian
 * cities, and widely-used world cities.
 *
 * This is deliberately a bundled table rather than a geocoding API call. A
 * birth chart needs coordinates good to a few kilometres and the right
 * timezone -- not street-level precision -- so shipping the table keeps
 * onboarding instant, offline-capable and free of third-party lookups. Users
 * born somewhere not listed can enter coordinates and timezone by hand.
 */
export const CITIES: City[] = [
  { name: "Aracaju", region: "SE", country: "BR", latitude: -10.9472, longitude: -37.0731, timeZone: "America/Maceio" },
  { name: "Belém", region: "PA", country: "BR", latitude: -1.4558, longitude: -48.5039, timeZone: "America/Belem" },
  { name: "Belo Horizonte", region: "MG", country: "BR", latitude: -19.9167, longitude: -43.9345, timeZone: "America/Sao_Paulo" },
  { name: "Boa Vista", region: "RR", country: "BR", latitude: 2.8235, longitude: -60.6758, timeZone: "America/Boa_Vista" },
  { name: "Brasília", region: "DF", country: "BR", latitude: -15.7939, longitude: -47.8828, timeZone: "America/Sao_Paulo" },
  { name: "Campo Grande", region: "MS", country: "BR", latitude: -20.4697, longitude: -54.6201, timeZone: "America/Campo_Grande" },
  { name: "Cuiabá", region: "MT", country: "BR", latitude: -15.6014, longitude: -56.0979, timeZone: "America/Cuiaba" },
  { name: "Curitiba", region: "PR", country: "BR", latitude: -25.4284, longitude: -49.2733, timeZone: "America/Sao_Paulo" },
  { name: "Florianópolis", region: "SC", country: "BR", latitude: -27.5954, longitude: -48.548, timeZone: "America/Sao_Paulo" },
  { name: "Fortaleza", region: "CE", country: "BR", latitude: -3.7319, longitude: -38.5267, timeZone: "America/Fortaleza" },
  { name: "Goiânia", region: "GO", country: "BR", latitude: -16.6869, longitude: -49.2648, timeZone: "America/Sao_Paulo" },
  { name: "João Pessoa", region: "PB", country: "BR", latitude: -7.1195, longitude: -34.845, timeZone: "America/Fortaleza" },
  { name: "Macapá", region: "AP", country: "BR", latitude: 0.0389, longitude: -51.0664, timeZone: "America/Belem" },
  { name: "Maceió", region: "AL", country: "BR", latitude: -9.6658, longitude: -35.7353, timeZone: "America/Maceio" },
  { name: "Manaus", region: "AM", country: "BR", latitude: -3.119, longitude: -60.0217, timeZone: "America/Manaus" },
  { name: "Natal", region: "RN", country: "BR", latitude: -5.7945, longitude: -35.211, timeZone: "America/Fortaleza" },
  { name: "Palmas", region: "TO", country: "BR", latitude: -10.1849, longitude: -48.3336, timeZone: "America/Araguaina" },
  { name: "Porto Alegre", region: "RS", country: "BR", latitude: -30.0346, longitude: -51.2177, timeZone: "America/Sao_Paulo" },
  { name: "Porto Velho", region: "RO", country: "BR", latitude: -8.7612, longitude: -63.9004, timeZone: "America/Porto_Velho" },
  { name: "Recife", region: "PE", country: "BR", latitude: -8.0476, longitude: -34.877, timeZone: "America/Recife" },
  { name: "Rio Branco", region: "AC", country: "BR", latitude: -9.9754, longitude: -67.8249, timeZone: "America/Rio_Branco" },
  { name: "Rio de Janeiro", region: "RJ", country: "BR", latitude: -22.9068, longitude: -43.1729, timeZone: "America/Sao_Paulo" },
  { name: "Salvador", region: "BA", country: "BR", latitude: -12.9777, longitude: -38.5016, timeZone: "America/Bahia" },
  { name: "São Luís", region: "MA", country: "BR", latitude: -2.5307, longitude: -44.3068, timeZone: "America/Fortaleza" },
  { name: "São Paulo", region: "SP", country: "BR", latitude: -23.5505, longitude: -46.6333, timeZone: "America/Sao_Paulo" },
  { name: "Teresina", region: "PI", country: "BR", latitude: -5.0892, longitude: -42.8019, timeZone: "America/Fortaleza" },
  { name: "Vitória", region: "ES", country: "BR", latitude: -20.3155, longitude: -40.3128, timeZone: "America/Sao_Paulo" },
  { name: "Campinas", region: "SP", country: "BR", latitude: -22.9099, longitude: -47.0626, timeZone: "America/Sao_Paulo" },
  { name: "Guarulhos", region: "SP", country: "BR", latitude: -23.4543, longitude: -46.5337, timeZone: "America/Sao_Paulo" },
  { name: "São Bernardo do Campo", region: "SP", country: "BR", latitude: -23.6914, longitude: -46.5646, timeZone: "America/Sao_Paulo" },
  { name: "Santo André", region: "SP", country: "BR", latitude: -23.6639, longitude: -46.5383, timeZone: "America/Sao_Paulo" },
  { name: "Osasco", region: "SP", country: "BR", latitude: -23.5329, longitude: -46.7918, timeZone: "America/Sao_Paulo" },
  { name: "Sorocaba", region: "SP", country: "BR", latitude: -23.5015, longitude: -47.4526, timeZone: "America/Sao_Paulo" },
  { name: "Ribeirão Preto", region: "SP", country: "BR", latitude: -21.1775, longitude: -47.8103, timeZone: "America/Sao_Paulo" },
  { name: "São José dos Campos", region: "SP", country: "BR", latitude: -23.1896, longitude: -45.8841, timeZone: "America/Sao_Paulo" },
  { name: "Santos", region: "SP", country: "BR", latitude: -23.9608, longitude: -46.3336, timeZone: "America/Sao_Paulo" },
  { name: "Niterói", region: "RJ", country: "BR", latitude: -22.8833, longitude: -43.1036, timeZone: "America/Sao_Paulo" },
  { name: "Duque de Caxias", region: "RJ", country: "BR", latitude: -22.7856, longitude: -43.3117, timeZone: "America/Sao_Paulo" },
  { name: "Nova Iguaçu", region: "RJ", country: "BR", latitude: -22.7592, longitude: -43.451, timeZone: "America/Sao_Paulo" },
  { name: "Campos dos Goytacazes", region: "RJ", country: "BR", latitude: -21.7622, longitude: -41.3181, timeZone: "America/Sao_Paulo" },
  { name: "Petrópolis", region: "RJ", country: "BR", latitude: -22.505, longitude: -43.1786, timeZone: "America/Sao_Paulo" },
  { name: "Uberlândia", region: "MG", country: "BR", latitude: -18.9186, longitude: -48.2772, timeZone: "America/Sao_Paulo" },
  { name: "Juiz de Fora", region: "MG", country: "BR", latitude: -21.7642, longitude: -43.3503, timeZone: "America/Sao_Paulo" },
  { name: "Contagem", region: "MG", country: "BR", latitude: -19.9317, longitude: -44.0536, timeZone: "America/Sao_Paulo" },
  { name: "Betim", region: "MG", country: "BR", latitude: -19.9678, longitude: -44.1983, timeZone: "America/Sao_Paulo" },
  { name: "Montes Claros", region: "MG", country: "BR", latitude: -16.735, longitude: -43.8617, timeZone: "America/Sao_Paulo" },
  { name: "Londrina", region: "PR", country: "BR", latitude: -23.3045, longitude: -51.1696, timeZone: "America/Sao_Paulo" },
  { name: "Maringá", region: "PR", country: "BR", latitude: -23.4205, longitude: -51.9331, timeZone: "America/Sao_Paulo" },
  { name: "Ponta Grossa", region: "PR", country: "BR", latitude: -25.0945, longitude: -50.1633, timeZone: "America/Sao_Paulo" },
  { name: "Foz do Iguaçu", region: "PR", country: "BR", latitude: -25.5478, longitude: -54.5882, timeZone: "America/Sao_Paulo" },
  { name: "Joinville", region: "SC", country: "BR", latitude: -26.3044, longitude: -48.8456, timeZone: "America/Sao_Paulo" },
  { name: "Blumenau", region: "SC", country: "BR", latitude: -26.9194, longitude: -49.0661, timeZone: "America/Sao_Paulo" },
  { name: "Chapecó", region: "SC", country: "BR", latitude: -27.1004, longitude: -52.6152, timeZone: "America/Sao_Paulo" },
  { name: "Caxias do Sul", region: "RS", country: "BR", latitude: -29.1685, longitude: -51.1794, timeZone: "America/Sao_Paulo" },
  { name: "Pelotas", region: "RS", country: "BR", latitude: -31.7654, longitude: -52.3371, timeZone: "America/Sao_Paulo" },
  { name: "Santa Maria", region: "RS", country: "BR", latitude: -29.6842, longitude: -53.8069, timeZone: "America/Sao_Paulo" },
  { name: "Canoas", region: "RS", country: "BR", latitude: -29.9177, longitude: -51.1839, timeZone: "America/Sao_Paulo" },
  { name: "Feira de Santana", region: "BA", country: "BR", latitude: -12.2664, longitude: -38.9663, timeZone: "America/Bahia" },
  { name: "Vitória da Conquista", region: "BA", country: "BR", latitude: -14.8619, longitude: -40.8444, timeZone: "America/Bahia" },
  { name: "Ilhéus", region: "BA", country: "BR", latitude: -14.7935, longitude: -39.0463, timeZone: "America/Bahia" },
  { name: "Caruaru", region: "PE", country: "BR", latitude: -8.2837, longitude: -35.9761, timeZone: "America/Recife" },
  { name: "Petrolina", region: "PE", country: "BR", latitude: -9.3891, longitude: -40.503, timeZone: "America/Recife" },
  { name: "Jaboatão dos Guararapes", region: "PE", country: "BR", latitude: -8.1128, longitude: -35.0147, timeZone: "America/Recife" },
  { name: "Olinda", region: "PE", country: "BR", latitude: -8.0089, longitude: -34.8553, timeZone: "America/Recife" },
  { name: "Campina Grande", region: "PB", country: "BR", latitude: -7.2306, longitude: -35.8811, timeZone: "America/Fortaleza" },
  { name: "Mossoró", region: "RN", country: "BR", latitude: -5.1875, longitude: -37.3441, timeZone: "America/Fortaleza" },
  { name: "Juazeiro do Norte", region: "CE", country: "BR", latitude: -7.213, longitude: -39.3153, timeZone: "America/Fortaleza" },
  { name: "Sobral", region: "CE", country: "BR", latitude: -3.688, longitude: -40.35, timeZone: "America/Fortaleza" },
  { name: "Imperatriz", region: "MA", country: "BR", latitude: -5.5264, longitude: -47.4917, timeZone: "America/Fortaleza" },
  { name: "Marabá", region: "PA", country: "BR", latitude: -5.3686, longitude: -49.1178, timeZone: "America/Belem" },
  { name: "Santarém", region: "PA", country: "BR", latitude: -2.4431, longitude: -54.7083, timeZone: "America/Santarem" },
  { name: "Anápolis", region: "GO", country: "BR", latitude: -16.3267, longitude: -48.9528, timeZone: "America/Sao_Paulo" },
  { name: "Aparecida de Goiânia", region: "GO", country: "BR", latitude: -16.8198, longitude: -49.2469, timeZone: "America/Sao_Paulo" },
  { name: "Dourados", region: "MS", country: "BR", latitude: -22.2211, longitude: -54.8056, timeZone: "America/Campo_Grande" },
  { name: "Rondonópolis", region: "MT", country: "BR", latitude: -16.4708, longitude: -54.6356, timeZone: "America/Cuiaba" },
  { name: "Vila Velha", region: "ES", country: "BR", latitude: -20.3297, longitude: -40.2925, timeZone: "America/Sao_Paulo" },
  { name: "Serra", region: "ES", country: "BR", latitude: -20.1288, longitude: -40.3078, timeZone: "America/Sao_Paulo" },
  { name: "Fernando de Noronha", region: "PE", country: "BR", latitude: -3.8576, longitude: -32.4297, timeZone: "America/Noronha" },
  { name: "Lisboa", region: "", country: "PT", latitude: 38.7223, longitude: -9.1393, timeZone: "Europe/Lisbon" },
  { name: "Porto", region: "", country: "PT", latitude: 41.1579, longitude: -8.6291, timeZone: "Europe/Lisbon" },
  { name: "Madrid", region: "", country: "ES", latitude: 40.4168, longitude: -3.7038, timeZone: "Europe/Madrid" },
  { name: "Barcelona", region: "", country: "ES", latitude: 41.3874, longitude: 2.1686, timeZone: "Europe/Madrid" },
  { name: "Paris", region: "", country: "FR", latitude: 48.8566, longitude: 2.3522, timeZone: "Europe/Paris" },
  { name: "Londres", region: "", country: "GB", latitude: 51.5074, longitude: -0.1278, timeZone: "Europe/London" },
  { name: "Berlim", region: "", country: "DE", latitude: 52.52, longitude: 13.405, timeZone: "Europe/Berlin" },
  { name: "Roma", region: "", country: "IT", latitude: 41.9028, longitude: 12.4964, timeZone: "Europe/Rome" },
  { name: "Amsterdã", region: "", country: "NL", latitude: 52.3676, longitude: 4.9041, timeZone: "Europe/Amsterdam" },
  { name: "Dublin", region: "", country: "IE", latitude: 53.3498, longitude: -6.2603, timeZone: "Europe/Dublin" },
  { name: "Zurique", region: "", country: "CH", latitude: 47.3769, longitude: 8.5417, timeZone: "Europe/Zurich" },
  { name: "Nova York", region: "NY", country: "US", latitude: 40.7128, longitude: -74.006, timeZone: "America/New_York" },
  { name: "Los Angeles", region: "CA", country: "US", latitude: 34.0522, longitude: -118.2437, timeZone: "America/Los_Angeles" },
  { name: "Chicago", region: "IL", country: "US", latitude: 41.8781, longitude: -87.6298, timeZone: "America/Chicago" },
  { name: "Miami", region: "FL", country: "US", latitude: 25.7617, longitude: -80.1918, timeZone: "America/New_York" },
  { name: "Boston", region: "MA", country: "US", latitude: 42.3601, longitude: -71.0589, timeZone: "America/New_York" },
  { name: "San Francisco", region: "CA", country: "US", latitude: 37.7749, longitude: -122.4194, timeZone: "America/Los_Angeles" },
  { name: "Toronto", region: "ON", country: "CA", latitude: 43.6532, longitude: -79.3832, timeZone: "America/Toronto" },
  { name: "Vancouver", region: "BC", country: "CA", latitude: 49.2827, longitude: -123.1207, timeZone: "America/Vancouver" },
  { name: "Cidade do México", region: "", country: "MX", latitude: 19.4326, longitude: -99.1332, timeZone: "America/Mexico_City" },
  { name: "Buenos Aires", region: "", country: "AR", latitude: -34.6037, longitude: -58.3816, timeZone: "America/Argentina/Buenos_Aires" },
  { name: "Montevidéu", region: "", country: "UY", latitude: -34.9011, longitude: -56.1645, timeZone: "America/Montevideo" },
  { name: "Santiago", region: "", country: "CL", latitude: -33.4489, longitude: -70.6693, timeZone: "America/Santiago" },
  { name: "Lima", region: "", country: "PE", latitude: -12.0464, longitude: -77.0428, timeZone: "America/Lima" },
  { name: "Bogotá", region: "", country: "CO", latitude: 4.711, longitude: -74.0721, timeZone: "America/Bogota" },
  { name: "Assunção", region: "", country: "PY", latitude: -25.2637, longitude: -57.5759, timeZone: "America/Asuncion" },
  { name: "La Paz", region: "", country: "BO", latitude: -16.4897, longitude: -68.1193, timeZone: "America/La_Paz" },
  { name: "Caracas", region: "", country: "VE", latitude: 10.4806, longitude: -66.9036, timeZone: "America/Caracas" },
  { name: "Tóquio", region: "", country: "JP", latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo" },
  { name: "Pequim", region: "", country: "CN", latitude: 39.9042, longitude: 116.4074, timeZone: "Asia/Shanghai" },
  { name: "Xangai", region: "", country: "CN", latitude: 31.2304, longitude: 121.4737, timeZone: "Asia/Shanghai" },
  { name: "Seul", region: "", country: "KR", latitude: 37.5665, longitude: 126.978, timeZone: "Asia/Seoul" },
  { name: "Bangkok", region: "", country: "TH", latitude: 13.7563, longitude: 100.5018, timeZone: "Asia/Bangkok" },
  { name: "Singapura", region: "", country: "SG", latitude: 1.3521, longitude: 103.8198, timeZone: "Asia/Singapore" },
  { name: "Mumbai", region: "", country: "IN", latitude: 19.076, longitude: 72.8777, timeZone: "Asia/Kolkata" },
  { name: "Nova Délhi", region: "", country: "IN", latitude: 28.6139, longitude: 77.209, timeZone: "Asia/Kolkata" },
  { name: "Dubai", region: "", country: "AE", latitude: 25.2048, longitude: 55.2708, timeZone: "Asia/Dubai" },
  { name: "Istambul", region: "", country: "TR", latitude: 41.0082, longitude: 28.9784, timeZone: "Europe/Istanbul" },
  { name: "Tel Aviv", region: "", country: "IL", latitude: 32.0853, longitude: 34.7818, timeZone: "Asia/Jerusalem" },
  { name: "Cairo", region: "", country: "EG", latitude: 30.0444, longitude: 31.2357, timeZone: "Africa/Cairo" },
  { name: "Lagos", region: "", country: "NG", latitude: 6.5244, longitude: 3.3792, timeZone: "Africa/Lagos" },
  { name: "Nairóbi", region: "", country: "KE", latitude: -1.2921, longitude: 36.8219, timeZone: "Africa/Nairobi" },
  { name: "Joanesburgo", region: "", country: "ZA", latitude: -26.2041, longitude: 28.0473, timeZone: "Africa/Johannesburg" },
  { name: "Cidade do Cabo", region: "", country: "ZA", latitude: -33.9249, longitude: 18.4241, timeZone: "Africa/Johannesburg" },
  { name: "Luanda", region: "", country: "AO", latitude: -8.839, longitude: 13.2894, timeZone: "Africa/Luanda" },
  { name: "Maputo", region: "", country: "MZ", latitude: -25.9692, longitude: 32.5732, timeZone: "Africa/Maputo" },
  { name: "Sydney", region: "", country: "AU", latitude: -33.8688, longitude: 151.2093, timeZone: "Australia/Sydney" },
  { name: "Melbourne", region: "", country: "AU", latitude: -37.8136, longitude: 144.9631, timeZone: "Australia/Melbourne" },
  { name: "Auckland", region: "", country: "NZ", latitude: -36.8485, longitude: 174.7633, timeZone: "Pacific/Auckland" },
  { name: "Moscou", region: "", country: "RU", latitude: 55.7558, longitude: 37.6173, timeZone: "Europe/Moscow" },
];

export function cityLabel(city: City): string {
  return city.region
    ? `${city.name} - ${city.region}, ${city.country}`
    : `${city.name}, ${city.country}`;
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Accent- and case-insensitive search. Exact matches rank above prefix
 * matches, which rank above substring matches anywhere in the label, so
 * typing "sao p" surfaces Sao Paulo before Sao Bernardo do Campo.
 */
export function searchCities(query: string, limit = 8): City[] {
  const needle = fold(query.trim());
  if (!needle) return [];
  return CITIES.map((city) => {
    const name = fold(city.name);
    const label = fold(cityLabel(city));
    let rank = -1;
    if (name === needle) rank = 0;
    else if (name.startsWith(needle)) rank = 1;
    else if (label.includes(needle)) rank = 2;
    return { city, rank };
  })
    .filter((entry) => entry.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.city.name.localeCompare(b.city.name, "pt-BR"))
    .slice(0, limit)
    .map((entry) => entry.city);
}
