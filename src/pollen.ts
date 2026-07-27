// API-Client: Pollenvorhersage von Open-Meteo (Air-Quality-API, CAMS-Europa-
// Modell). Ohne API-Key, CORS `*`, CC BY 4.0. Pollen gibt es nur fuer Europa —
// ausserhalb liefert die API null-Reihen, das wird als Fehler gemeldet.
//
// Aggregation: die API liefert Stundenwerte (Koerner/m³) fuer 4 Tage. Fuer die
// Brille wird je Tag und Art der Spitzenwert gebildet, dazu Tagesabschnitte
// (frueh 6-12, mittags 12-18, abends 18-24) fuer die Detailansicht.

import { fetchJson } from './http'
import { t } from './i18n'

export type Level = 0 | 1 | 2 | 3 // keine / gering / mittel / hoch

export interface Species {
  key: string // API-Feldname, z. B. "grass_pollen"
  name: string // Anzeigename (lokalisiert, s. i18n.ts)
  thresholds: [number, number, number] // Koerner/m³ ab denen gering/mittel/hoch gilt
}

// Stufengrenzen sind Naeherungswerte (Koerner/m³), angelehnt an gaengige
// Skalen: Graeser und Kraeuter wirken schon bei niedrigen Konzentrationen,
// Baumpollen erst bei deutlich hoeheren.
export const SPECIES: Species[] = [
  { key: 'grass_pollen', name: t('spGrass'), thresholds: [1, 20, 50] },
  { key: 'birch_pollen', name: t('spBirch'), thresholds: [1, 10, 100] },
  { key: 'alder_pollen', name: t('spAlder'), thresholds: [1, 10, 100] },
  { key: 'mugwort_pollen', name: t('spMugwort'), thresholds: [1, 10, 30] },
  { key: 'ragweed_pollen', name: t('spRagweed'), thresholds: [1, 5, 20] },
  { key: 'olive_pollen', name: t('spOlive'), thresholds: [1, 10, 100] },
]

export interface SpeciesDay {
  species: Species
  peak: number // Tages-Spitzenwert in Koerner/m³
  level: Level
  parts: [Level, Level, Level] // frueh / mittags / abends
}

export interface DayForecast {
  date: Date // lokale Mitternacht des Tages
  species: SpeciesDay[] // absteigend nach Belastung sortiert
}

export function toLevel(value: number, s: Species): Level {
  const [low, mid, high] = s.thresholds
  if (value >= high) return 3
  if (value >= mid) return 2
  if (value >= low) return 1
  return 0
}

/** 4-Tage-Pollenvorhersage fuer einen Standort. Wirft, wenn das
 *  CAMS-Modell den Ort nicht abdeckt (ausserhalb Europas). */
export async function pollenForecast(lat: number, lon: number): Promise<DayForecast[]> {
  const keys = SPECIES.map((s) => s.key).join(',')
  const url =
    'https://air-quality-api.open-meteo.com/v1/air-quality' +
    `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&hourly=${keys}&timezone=auto&forecast_days=4`
  const data = (await fetchJson(url, 10_000)) as any

  const times: string[] = data?.hourly?.time ?? []
  if (!times.length) throw new Error(t('noData'))

  // Stundenindizes den Tagen zuordnen (API liefert lokale Zeit "YYYY-MM-DDTHH:MM")
  const dayKeys: string[] = []
  const byDay = new Map<string, number[]>()
  for (let i = 0; i < times.length; i++) {
    const day = times[i].slice(0, 10)
    if (!byDay.has(day)) {
      byDay.set(day, [])
      dayKeys.push(day)
    }
    byDay.get(day)!.push(i)
  }

  let anyValue = false
  const days: DayForecast[] = dayKeys.map((day) => {
    const idx = byDay.get(day)!
    const species: SpeciesDay[] = SPECIES.map((s) => {
      const values: number[] = data.hourly[s.key] ?? []
      const at = (hFrom: number, hTo: number): number => {
        let max = 0
        for (const i of idx) {
          const h = parseInt(times[i].slice(11, 13), 10)
          const v = values[i]
          if (h >= hFrom && h < hTo && typeof v === 'number' && v > max) max = v
        }
        return max
      }
      const peak = at(0, 24)
      if (peak > 0) anyValue = true
      return {
        species: s,
        peak,
        level: toLevel(peak, s),
        parts: [toLevel(at(6, 12), s), toLevel(at(12, 18), s), toLevel(at(18, 24), s)],
      }
    })
    species.sort((a, b) => b.level - a.level || b.peak - a.peak)
    return { date: new Date(`${day}T00:00`), species }
  })

  // Alles null/0 ueber 4 Tage: entweder kein CAMS-Gebiet (ausserhalb Europas,
  // Werte null) oder schlicht pollenfrei. null-Reihen unterscheiden:
  const firstKey = SPECIES[0].key
  const allNull = (data.hourly[firstKey] ?? []).every((v: unknown) => v == null)
  if (!anyValue && allNull) {
    throw new Error(t('noCoverage'))
  }
  return days
}
