import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadSettings, saveSettings, UserSettings } from '@/lib/storage'
import { formatDateToDDMMYYYY, parseDDMMYYYYToISO } from '@/lib/date'
import { findNamedayForName } from '@/data/namedays-no'

type Props = {
  onClose(): void
  onSaved(): void
}
export default function SettingsSheet({onClose, onSaved}: Props){
  const { t, i18n } = useTranslation()
  const [settings, setSettings] = useState<UserSettings>(()=>loadSettings())

  const [name, setName] = useState(settings.name || '')
  const [birthday, setBirthday] = useState('')
  const [birthdayError, setBirthdayError] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [moveInDateError, setMoveInDateError] = useState('')
  const [namedayInfo, setNamedayInfo] = useState<{ date: Date; description?: string } | null>(null)
  const [showMore, setShowMore] = useState(false)

  useEffect(()=>{
    setName(settings.name || '')
    if (settings.birthdayISO) {
      const date = new Date(settings.birthdayISO)
      setBirthday(formatDateToDDMMYYYY(date))
    } else {
      setBirthday('')
    }
    if (settings.moveInDateISO) {
      const date = new Date(settings.moveInDateISO)
      setMoveInDate(formatDateToDDMMYYYY(date))
    } else {
      setMoveInDate('')
    }
    setBirthdayError('')
    setMoveInDateError('')
  },[])

  // Update nameday info when name changes
  useEffect(() => {
    if (name.trim()) {
      const nameday = findNamedayForName(name)
      setNamedayInfo(nameday)
    } else {
      setNamedayInfo(null)
    }
  }, [name])

  function save(){
    let birthdayISO = null
    if (birthday.trim()) {
      const parsed = parseDDMMYYYYToISO(birthday.trim())
      if (!parsed) {
        setBirthdayError(t('settings.birthdayError'))
        return
      }
      birthdayISO = parsed
    }
    
    let moveInDateISO = null
    if (moveInDate.trim()) {
      const parsed = parseDDMMYYYYToISO(moveInDate.trim())
      if (!parsed) {
        setMoveInDateError(t('settings.birthdayError'))
        return
      }
      moveInDateISO = parsed
    }
    
    const next: UserSettings = {
      name: name.trim(),
      birthdayISO,
      moveInDateISO
    }
    saveSettings(next)
    onSaved()
    onClose()
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', justifyContent:'center', alignItems:'flex-end', zIndex:40
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#0b1220', width:'100%', maxWidth:480, borderTopLeftRadius:20, borderTopRightRadius:20, border:'1px solid rgba(148,163,184,.2)', padding:16}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <h2 style={{margin:0, fontSize:16}}>{t('settings.title')}</h2>
          <button className="icon" onClick={onClose}>{t('settings.close')}</button>
        </div>
        <div style={{display:'grid', gap:12}}>
          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, color:'var(--muted)'}}>{t('settings.nameLabel')}</span>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder={t('settings.namePlaceholder')} inputMode="text" style={{padding:'10px 12px', borderRadius:12, border:'1px solid rgba(148,163,184,.3)', background:'#0f172a', color:'var(--fg)'}}/>
            {name.trim() && (
              <div style={{fontSize:11, color:'var(--muted)', marginTop:4}}>
                {namedayInfo ? (
                  <span>
                    Nameday: {namedayInfo.date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' })}
                    {namedayInfo.description && ` - ${namedayInfo.description}`}
                  </span>
                ) : (
                  <span>No name day 😢</span>
                )}
              </div>
            )}
          </label>
          <label style={{display:'grid', gap:6}}>
            <span style={{fontSize:12, color:'var(--muted)'}}>{t('settings.birthdayLabel')}</span>
            <input 
              type="text" 
              value={birthday} 
              onChange={e=>{
                setBirthday(e.target.value)
                setBirthdayError('')
              }}
              placeholder={t('settings.birthdayPlaceholder')}
              inputMode="numeric"
              style={{
                padding:'10px 12px', 
                borderRadius:12, 
                border:`1px solid ${birthdayError ? '#ef4444' : 'rgba(148,163,184,.3)'}`, 
                background:'#0f172a', 
                color:'var(--fg)'
              }}
            />
            {birthdayError && (
              <span style={{fontSize:11, color:'#ef4444'}}>{birthdayError}</span>
            )}
          </label>
          <button 
            type="button"
            onClick={() => setShowMore(!showMore)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 12,
              padding: '8px 0',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {showMore ? t('settings.less') : t('settings.more')}
            <span style={{fontSize: 10}}>{showMore ? '▲' : '▼'}</span>
          </button>
          {showMore && (
            <>
              <label style={{display:'grid', gap:6}}>
                <span style={{fontSize:12, color:'var(--muted)'}}>{t('settings.moveInDateLabel')}</span>
                <input 
                  type="text" 
                  value={moveInDate} 
                  onChange={e=>{
                    setMoveInDate(e.target.value)
                    setMoveInDateError('')
                  }}
                  placeholder={t('settings.moveInDatePlaceholder')}
                  inputMode="numeric"
                  style={{
                    padding:'10px 12px', 
                    borderRadius:12, 
                    border:`1px solid ${moveInDateError ? '#ef4444' : 'rgba(148,163,184,.3)'}`, 
                    background:'#0f172a', 
                    color:'var(--fg)'
                  }}
                />
                {moveInDateError && (
                  <span style={{fontSize:11, color:'#ef4444'}}>{moveInDateError}</span>
                )}
              </label>
              <label style={{display:'grid', gap:6}}>
                <span style={{fontSize:12, color:'var(--muted)'}}>{t('language.select')}</span>
                <select 
                  value={i18n.language} 
                  onChange={e => i18n.changeLanguage(e.target.value)}
                  style={{
                    padding:'10px 12px', 
                    borderRadius:12, 
                    border:'1px solid rgba(148,163,184,.3)', 
                    background:'#0f172a', 
                    color:'var(--fg)'
                  }}
                >
                  <option value="nb">{t('language.norwegian')}</option>
                  <option value="en">{t('language.english')}</option>
                </select>
              </label>
            </>
          )}
        </div>
        <div style={{display:'flex', gap:8, marginTop:14}}>
          <button className="icon" onClick={save} style={{background:'var(--accent)', border:'none', color:'#081018', fontWeight:600}}>{t('settings.save')}</button>
          <button className="icon" onClick={onClose} >{t('settings.cancel')}</button>
        </div>
        <p className="subtitle" style={{marginTop:10}}>{t('settings.dataNote')}</p>
      </div>
    </div>
  )
}
