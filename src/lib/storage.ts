export type UserSettings = {
  name: string
  birthdayISO: string | null // YYYY-MM-DD
  moveInDateISO: string | null // YYYY-MM-DD
}
const KEY = 'celebrate.settings.v1'
export function loadSettings(): UserSettings {
  try{
    const raw = localStorage.getItem(KEY)
    if(!raw) return { name:'', birthdayISO:null, moveInDateISO:null }
    return JSON.parse(raw)
  }catch{
    return { name:'', birthdayISO:null, moveInDateISO:null }
  }
}
export function saveSettings(s: UserSettings){
  localStorage.setItem(KEY, JSON.stringify(s))
}
