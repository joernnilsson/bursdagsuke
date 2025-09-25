export function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Monday=0
  date.setDate(date.getDate() - day)
  date.setHours(0,0,0,0)
  return date
}
export function addDays(d: Date, days: number): Date {
  const nd = new Date(d); nd.setDate(nd.getDate()+days); return nd
}
export function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks*7)
}
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
export function fmtISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}
export function dayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday:'short'})
}
export function dateLabel(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}
export function weekRangeLabel(start: Date): string {
  const end = addDays(start,6)
  const formatDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    return `${day}.${month}.${year}`
  }
  const s = formatDate(start)
  const e = formatDate(end)
  return `${s} — ${e}`
}
export function daysBetween(a: Date, b: Date): number {
  const ms = (b.setHours(0,0,0,0), b).getTime() - (a.setHours(0,0,0,0), a).getTime()
  return Math.round(ms/86400000)
}
export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth())
}
export function weeksBetween(a: Date, b: Date): number {
  return Math.floor(daysBetween(a,b)/7)
}
export function secondsBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime()
  return Math.floor(ms/1000)
}

// Helper functions for dd.mm.yyyy format
export function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

export function parseDDMMYYYYToISO(dateString: string): string | null {
  // Validate format: dd.mm.yyyy
  const match = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!match) return null
  
  const [, day, month, year] = match
  const dayNum = parseInt(day, 10)
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)
  
  // Basic validation
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
    return null
  }
  
  // Create date and validate it's a real date
  const date = new Date(yearNum, monthNum - 1, dayNum)
  if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1 || date.getFullYear() !== yearNum) {
    return null
  }
  
  return date.toISOString().split('T')[0]
}
