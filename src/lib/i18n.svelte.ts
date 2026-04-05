const pt = {
  // App
  appTitle: 'Placa Mercosul 3D',
  exporting: 'Exportando...',
  exportStl: 'Exportar STL',
  credits: 'Inspirado no',
  creditsModel: 'modelo de @yurizr',

  // Dev selector
  devPlate: 'Placa completa',
  devFlagFlat: 'Bandeira (flat)',
  devFlagRelief: 'Bandeira (relief)',

  // Sections
  sectionPlateText: 'Texto da Placa',
  sectionSecondaryTexts: 'Textos Secundários',
  sectionDimensions: 'Dimensões',
  sectionBorderStrip: 'Borda e Faixa',
  sectionHole: 'Furo',
  sectionTextPositions: 'Posições de Texto',
  sectionColors: 'Cores',

  // Plate text
  plate: 'Placa',
  longText: 'Texto longo:',
  shrink: 'Reduzir',
  wrap: 'Quebrar linha',

  // Secondary texts
  template: 'Template',
  selectCountry: '-- Selecionar país --',
  country: 'País',
  code: 'Código',
  showFlag: 'Mostrar bandeira',
  style: 'Estilo:',
  relief: 'Relevo',
  flat: 'Flat',

  // Dimensions
  length: 'Comprimento',
  width: 'Largura',
  thickness: 'Espessura',
  cornerRadius: 'Raio dos cantos',

  // Border & strip
  borderWidth: 'Largura da borda',
  reliefHeight: 'Altura do relevo',
  blueStrip: 'Faixa azul',

  // Hole
  showHole: 'Mostrar furo',
  diameter: 'Diâmetro',
  positionX: 'Posição X',
  positionY: 'Posição Y',

  // Text positions
  mainText: 'Texto principal',
  countryText: 'Texto país',
  brText: 'Texto BR',
  size: 'Tamanho',
  spacing: 'Espaçamento',

  // Colors
  colorBaseCountry: 'Base / Texto país',
  colorBorderPlate: 'Borda / Texto placa / BR',
  colorTopStrip: 'Faixa superior',

  // Reset
  resetDefaults: 'Restaurar Padrão',
} as const

const es: Record<TranslationKey, string> = {
  // App
  appTitle: 'Patente Mercosur 3D',
  exporting: 'Exportando...',
  exportStl: 'Exportar STL',
  credits: 'Inspirado en el',
  creditsModel: 'modelo de @yurizr',

  // Dev selector
  devPlate: 'Patente completa',
  devFlagFlat: 'Bandera (flat)',
  devFlagRelief: 'Bandera (relieve)',

  // Sections
  sectionPlateText: 'Texto de la Patente',
  sectionSecondaryTexts: 'Textos Secundarios',
  sectionDimensions: 'Dimensiones',
  sectionBorderStrip: 'Borde y Franja',
  sectionHole: 'Orificio',
  sectionTextPositions: 'Posiciones de Texto',
  sectionColors: 'Colores',

  // Plate text
  plate: 'Patente',
  longText: 'Texto largo:',
  shrink: 'Reducir',
  wrap: 'Dividir línea',

  // Secondary texts
  template: 'Plantilla',
  selectCountry: '-- Seleccionar país --',
  country: 'País',
  code: 'Código',
  showFlag: 'Mostrar bandera',
  style: 'Estilo:',
  relief: 'Relieve',
  flat: 'Flat',

  // Dimensions
  length: 'Largo',
  width: 'Ancho',
  thickness: 'Espesor',
  cornerRadius: 'Radio de esquinas',

  // Border & strip
  borderWidth: 'Ancho del borde',
  reliefHeight: 'Altura del relieve',
  blueStrip: 'Franja azul',

  // Hole
  showHole: 'Mostrar orificio',
  diameter: 'Diámetro',
  positionX: 'Posición X',
  positionY: 'Posición Y',

  // Text positions
  mainText: 'Texto principal',
  countryText: 'Texto país',
  brText: 'Texto código',
  size: 'Tamaño',
  spacing: 'Espaciado',

  // Colors
  colorBaseCountry: 'Base / Texto país',
  colorBorderPlate: 'Borde / Texto patente / Código',
  colorTopStrip: 'Franja superior',

  // Reset
  resetDefaults: 'Restaurar Valores',
}

export type TranslationKey = keyof typeof pt

const locales: Record<string, Record<TranslationKey, string>> = {
  pt,
  es,
}

let currentLocale = $state('pt')

export function setLocale(locale: string) {
  if (locales[locale]) {
    currentLocale = locale
  }
}

export function getLocale(): string {
  return currentLocale
}

export function addLocale(locale: string, translations: Record<TranslationKey, string>) {
  locales[locale] = translations
}

export function t(key: TranslationKey): string {
  return locales[currentLocale]?.[key] ?? locales.pt[key] ?? key
}
