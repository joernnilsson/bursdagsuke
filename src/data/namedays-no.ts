// Norwegian namedays using the parsed dataset
// Exports a map from ISO "MM-DD" to { names: string[], description?: string }

import { nameDays, NameDay } from './namedays-parsed-no.js'

export type NamedayEntry = {
  names: string[]
  description?: string
}

// Convert the parsed nameDays array to the expected format
function convertToNamedayMap(nameDays: NameDay[]): Record<string, NamedayEntry> {
  const out: Record<string, NamedayEntry> = {}
  
  for (const nameDay of nameDays) {
    const key = `${String(nameDay.month).padStart(2, '0')}-${String(nameDay.day).padStart(2, '0')}`
    out[key] = {
      names: nameDay.names.map(name => name.toLowerCase()),
      description: nameDay.comment || undefined
    }
  }
  
  return out
}

export const NO_NAMEDAYS: Record<string, NamedayEntry> = convertToNamedayMap(nameDays)

export function namesForKey(key: string): string[] {
  return NO_NAMEDAYS[key]?.names || []
}

export function namedayEntryForDate(date: Date): NamedayEntry | undefined {
  const key = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  return NO_NAMEDAYS[key]
}

export function findNamedayForName(name: string): { date: Date; description?: string } | null {
  if (!name || !name.trim()) return null
  
  const normalizedName = name.trim().toLowerCase()
  
  // Search through all nameday entries
  for (const [key, entry] of Object.entries(NO_NAMEDAYS)) {
    if (entry.names.includes(normalizedName)) {
      const [month, day] = key.split('-').map(Number)
      // Use current year for the date
      const currentYear = new Date().getFullYear()
      const date = new Date(currentYear, month - 1, day)
      return { date, description: entry.description }
    }
  }
  
  return null
}
