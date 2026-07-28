// Formatierung fuer die Brille. Monochrom, ein Blick genuegt: Belastung als
// Unicode-Blockbalken (Designsprache evenapps), kompakte Zeilen.
// Listen-Items: max. 64 Zeichen (SDK-Grenze). Umlaute und ß rendert der
// G2-Font korrekt (hardware-geprueft, dorfkino-g2). UI-Texte via i18n.ts.

import type { DayForecast, Level, SpeciesDay } from './pollen'
import { t, weekdays } from './i18n'

/** Auf max. `max` Zeichen kuerzen (ohne Ellipsis-Glyph, firmware-sicher). */
export function clamp(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max)
}

/** "Heute 27.07." / "Morgen 28.07." / "Di 29.07." bzw. en-Aequivalent */
export function dayLabel(date: Date, dayIndex: number): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const prefix =
    dayIndex === 0 ? t('today') : dayIndex === 1 ? t('tomorrow') : weekdays()[date.getDay()]
  return `${prefix} ${dd}.${mm}.`
}

/** Belastung als 3er-Blockbalken: □□□ / ■□□ / ■■□ / ■■■
 *  (■/□ statt █/░ — Schattierungsbloecke fehlen im G2-Font,
 *  vgl. design-guidelines "Useful Unicode Characters"). */
export function levelBar(level: Level): string {
  return '■'.repeat(level) + '□'.repeat(3 - level)
}

export function levelName(level: Level): string {
  return t('levels').split(',')[level]
}

/** Listenzeile Uebersicht: "Gräser  ■■■  hoch" */
export function speciesRow(d: SpeciesDay): string {
  return clamp(`${d.species.name}  ${levelBar(d.level)}  ${levelName(d.level)}`, 64)
}

/** Rumpf der Detailseite: Belastung, Spitze, Tagesabschnitte, Hinweis. */
export function detailBody(d: SpeciesDay): string {
  const [morning, noon, evening] = d.parts
  const peak =
    d.level > 0
      ? t('detailPeak', { lvl: levelName(d.level), peak: Math.round(d.peak) })
      : t('detailNone')
  const partLabels = [t('morning'), t('noon'), t('evening')]
  const width = Math.max(...partLabels.map((l) => l.length)) + 2
  const line = (label: string, lvl: Level): string =>
    `${label.padEnd(width)}${levelBar(lvl)}  ${levelName(lvl)}`
  return [
    peak,
    '',
    line(partLabels[0], morning),
    line(partLabels[1], noon),
    line(partLabels[2], evening),
    '',
    t('tipBack'),
  ].join('\n')
}

/** Titel der Uebersicht: "POLLEN  Heute 27.07.  Ansbach (ca.)" */
export function overviewTitle(
  day: DayForecast,
  dayIndex: number,
  approx: boolean,
  place: string | null,
): string {
  const loc = place ? `  ${clamp(place, 18)}` : ''
  return clamp(
    `${t('title')}  ${dayLabel(day.date, dayIndex)}${loc}${approx ? ' (ca.)' : ''}`,
    200,
  )
}
