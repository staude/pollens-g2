// Zweisprachige UI-Texte (de/en), Muster wie dorfkino-g2: Sprache einmal
// beim Start aus navigator.language ableiten (im Even-WebView = System-
// sprache), Fallback Englisch, Override zum Testen per ?lang=de|en.
// Pollenarten sind eigene Labels und werden mituebersetzt.

export type Locale = 'de' | 'en'

const DICT: Record<Locale, Record<string, string>> = {
  de: {
    title: 'POLLEN',
    speciesHeader: '- Pollenart wählen -',
    nextDay: '> {day} anzeigen',
    today: 'Heute',
    tomorrow: 'Morgen',
    weekdays: 'So,Mo,Di,Mi,Do,Fr,Sa',
    levels: '-,gering,mittel,hoch',
    spGrass: 'Gräser',
    spBirch: 'Birke',
    spAlder: 'Erle',
    spMugwort: 'Beifuß',
    spRagweed: 'Ambrosia',
    spOlive: 'Olive',
    locating: 'Standort wird ermittelt ...',
    loadingForecast: 'Lade Pollenvorhersage ...',
    noData: 'Keine Vorhersagedaten erhalten.',
    noCoverage: 'Für diesen Standort gibt es keine Pollendaten (nur Europa).',
    detailPeak: 'Belastung: {lvl} (Spitze {peak}/m³)',
    detailNone: 'Belastung: keine',
    morning: 'Früh',
    noon: 'Mittags',
    evening: 'Abends',
    tipBack: 'Doppeltipp: zurück',
    errorTitle: 'FEHLER',
    errorHint: 'Tipp: erneut versuchen\nDoppeltipp: beenden',
    listError: 'LISTEN-FEHLER',
    listErrorBody: 'Anzeige fehlgeschlagen ({n} Zeilen)\n\nDoppeltipp: beenden',
    phTagline: 'Pollenflug im Blick &mdash; direkt auf der Brille',
    phToday: 'Belastung heute',
    phControls: 'Bedienung auf der Brille',
    phHints:
      '<b>Tippen</b> &ndash; Pollenart &ouml;ffnen (Tagesverlauf), unterste Zeile wechselt den Tag<br><b>Wischen</b> &ndash; Liste scrollen<br><b>Doppeltippen</b> &ndash; zur&uuml;ck / beenden',
    phFooter:
      'Daten: Open-Meteo, CAMS-Europa-Modell (CC BY 4.0) &middot; Stufen sind N&auml;herungswerte, keine medizinische Beratung',
    phLoadError: 'Fehler beim Laden: {msg}',
    phSummary: 'Stärkste Belastung heute: <b>{name}</b> ({lvl})',
    phNone: '<b>Heute keine nennenswerte Pollenbelastung.</b>',
    phApprox: ' (ungefähr, per IP)',
    phOnGlasses: '&ndash; Details laufen auf der Brille.',
  },
  en: {
    title: 'POLLEN',
    speciesHeader: '- Select pollen type -',
    nextDay: '> Show {day}',
    today: 'Today',
    tomorrow: 'Tomorrow',
    weekdays: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
    levels: '-,low,medium,high',
    spGrass: 'Grass',
    spBirch: 'Birch',
    spAlder: 'Alder',
    spMugwort: 'Mugwort',
    spRagweed: 'Ragweed',
    spOlive: 'Olive',
    locating: 'Getting your location ...',
    loadingForecast: 'Loading pollen forecast ...',
    noData: 'No forecast data received.',
    noCoverage: 'No pollen data for this location (Europe only).',
    detailPeak: 'Level: {lvl} (peak {peak}/m³)',
    detailNone: 'Level: none',
    morning: 'Morning',
    noon: 'Midday',
    evening: 'Evening',
    tipBack: 'Double-tap: back',
    errorTitle: 'ERROR',
    errorHint: 'Tap: retry\nDouble-tap: exit',
    listError: 'LIST ERROR',
    listErrorBody: 'Display failed ({n} rows)\n\nDouble-tap: exit',
    phTagline: 'Pollen forecast at a glance &mdash; right on your glasses',
    phToday: 'Levels today',
    phControls: 'Controls on the glasses',
    phHints:
      '<b>Tap</b> &ndash; open a pollen type (daily profile), bottom row switches the day<br><b>Swipe</b> &ndash; scroll the list<br><b>Double-tap</b> &ndash; back / exit',
    phFooter:
      'Data: Open-Meteo, CAMS Europe model (CC BY 4.0) &middot; Levels are approximations, not medical advice',
    phLoadError: 'Failed to load: {msg}',
    phSummary: 'Strongest level today: <b>{name}</b> ({lvl})',
    phNone: '<b>No significant pollen levels today.</b>',
    phApprox: ' (approximate, by IP)',
    phOnGlasses: '&ndash; details run on the glasses.',
  },
}

function detect(): Locale {
  if (typeof window !== 'undefined') {
    const forced = new URLSearchParams(window.location.search).get('lang')
    if (forced === 'de' || forced === 'en') return forced
  }
  const lang = (typeof navigator !== 'undefined' && navigator.language) || 'en'
  return lang.split('-')[0].toLowerCase() === 'de' ? 'de' : 'en'
}

export const LOCALE: Locale = detect()

/** Text zu `key`, mit {platzhalter}-Ersetzung. Fehlender Key -> en -> Key. */
export function t(key: string, params?: Record<string, string | number>): string {
  const val = DICT[LOCALE][key] ?? DICT.en[key] ?? key
  if (!params) return val
  return val.replace(/\{(\w+)\}/g, (_, k) => (params[k] === undefined ? `{${k}}` : String(params[k])))
}

/** Lokalisierte Wochentags-Kuerzel (Index = Date.getDay()). */
export function weekdays(): string[] {
  return t('weekdays').split(',')
}
