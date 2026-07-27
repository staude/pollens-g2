// Formatierung fuer die Brille. Monochrom, ein Blick genuegt: Belastung als
// Unicode-Blockbalken (Designsprache evenapps), kompakte Zeilen.
// Listen-Items: max. 64 Zeichen (SDK-Grenze). Umlaute und ß rendert der
// G2-Font korrekt (hardware-geprueft, dorfkino-g2).

import type { DayForecast, Level, SpeciesDay } from './pollen'

/** Auf max. `max` Zeichen kuerzen (ohne Ellipsis-Glyph, firmware-sicher). */
export function clamp(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max)
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

/** "Heute 27.07." / "Morgen 28.07." / "Di 29.07." */
export function dayLabel(date: Date, dayIndex: number): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const prefix =
    dayIndex === 0 ? 'Heute' : dayIndex === 1 ? 'Morgen' : WEEKDAYS[date.getDay()]
  return `${prefix} ${dd}.${mm}.`
}

/** Belastung als 3er-Blockbalken: ░░░ / █░░ / ██░ / ███ */
export function levelBar(level: Level): string {
  return '█'.repeat(level) + '░'.repeat(3 - level)
}

const LEVEL_NAMES = ['-', 'gering', 'mittel', 'hoch'] as const

export function levelName(level: Level): string {
  return LEVEL_NAMES[level]
}

/** Listenzeile Uebersicht: "Gräser  ███  hoch" */
export function speciesRow(d: SpeciesDay): string {
  return clamp(`${d.species.name}  ${levelBar(d.level)}  ${levelName(d.level)}`, 64)
}

/** Rumpf der Detailseite: Belastung, Spitze, Tagesabschnitte, Hinweis. */
export function detailBody(d: SpeciesDay): string {
  const [morning, noon, evening] = d.parts
  const peak = d.level > 0 ? `${levelName(d.level)} (Spitze ${Math.round(d.peak)}/m³)` : 'keine'
  return [
    `Belastung: ${peak}`,
    '',
    `Früh     ${levelBar(morning)}  ${levelName(morning)}`,
    `Mittags  ${levelBar(noon)}  ${levelName(noon)}`,
    `Abends   ${levelBar(evening)}  ${levelName(evening)}`,
    '',
    'Doppeltipp: zurück',
  ].join('\n')
}

/** Titel der Uebersicht: "POLLEN  Heute 27.07. (ca.)" */
export function overviewTitle(day: DayForecast, dayIndex: number, approx: boolean): string {
  return clamp(`POLLEN  ${dayLabel(day.date, dayIndex)}${approx ? ' (ca.)' : ''}`, 200)
}
