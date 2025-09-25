import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import WeekGrid from './components/WeekGrid'
import { addWeeks, startOfWeek } from './lib/date'
import { loadSettings } from './lib/storage'
import SettingsSheet from './components/SettingsSheet'

export default function App(){
  const { t } = useTranslation()
  const [showSettings, setShowSettings] = useState(false)
  const [settingsVersion, setSettingsVersion] = useState(0)
  const {name, birthdayISO, moveInDateISO} = useMemo(()=>loadSettings(), [settingsVersion])
  const birthday = birthdayISO ? new Date(birthdayISO) : null
  const moveInDate = moveInDateISO ? new Date(moveInDateISO) : null

  const containerRef = useRef<HTMLDivElement>(null)
  const weeks = useMemo(()=>{
    const start = startOfWeek(new Date())
    const totalWeeks = 105 // 52 weeks back + current week + 52 weeks forward = 105 weeks total
    const allWeeks = []
    
    // Add weeks going backward
    for(let i = 52; i > 0; i--){
      allWeeks.push(addWeeks(start, -i))
    }
    
    // Add current week and weeks going forward
    for(let i = 0; i < 53; i++){
      allWeeks.push(addWeeks(start, i))
    }
    
    return allWeeks
  }, [])

  // Orientation overlay condition
  const [isLandscape, setIsLandscape] = useState(false)
  useEffect(()=>{
    const mq = window.matchMedia('(orientation: landscape)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsLandscape(e.matches)
    handler(mq)
    mq.addEventListener('change', handler as any)
    return ()=> mq.removeEventListener('change', handler as any)
  },[])

  return (
    <div className="app">
      <header>
        <div>
          <h1>{t('app.title')}</h1>
          <div className="subtitle">{t('app.subtitle')}</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="icon" onClick={()=>setShowSettings(true)}>{t('settings.title')}</button>
        </div>
      </header>
      <div className="content" ref={containerRef}>
        {weeks.map((w,i)=> <WeekGrid key={w.toISOString()} anchor={w} userName={name} birthday={birthday} moveInDate={moveInDate} />)}
      </div>
      {showSettings && <SettingsSheet onClose={()=>setShowSettings(false)} onSaved={()=>setSettingsVersion(v=>v+1)} />}
      {isLandscape && (
        <div className="orientation-overlay">
          <div className="box">
            <h3>{t('orientation.portraitOnly')}</h3>
            <p>{t('orientation.rotateMessage')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
