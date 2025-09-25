import React from 'react'
import { useTranslation } from 'react-i18next'
import { addDays, dateLabel, dayLabel, fmtISODate, startOfWeek, weekRangeLabel } from '@/lib/date'
import { Event, generateEventsForDate } from '@/lib/events'

export type WeekGridProps = {
  anchor: Date
  userName: string
  birthday: Date | null
  moveInDate: Date | null
}

function DayCell({date, events, onClickEvent}:{date:Date, events: Event[], onClickEvent:(e:Event, d:Date)=>void}){
  return (
    <div className="day">
      <div className="dow">{dayLabel(date)}</div>
      <div className="date">{dateLabel(date)}</div>
      <div className="chips">
        {events.length===0 && <span className="empty">—</span>}
        {events.map(e=> (
          <span
            key={e.id}
            className={`chip ${e.importance||''}`}
            onClick={()=> onClickEvent(e, date)}
            style={{cursor:'pointer'}}
          >
            {e.title}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function WeekGrid({anchor, userName, birthday, moveInDate}: WeekGridProps){
  const { t } = useTranslation()
  const start = startOfWeek(anchor)
  const days = new Array(7).fill(0).map((_,i)=> addDays(start, i))
  const ctx = { today: new Date(), userName, birthday, moveInDate }
  const eventsByDate = Object.fromEntries(days.map(d=>[fmtISODate(d), generateEventsForDate(d, ctx)]))
  const [selected, setSelected] = React.useState<{event: Event, date: Date} | null>(null)

  function openInfo(e: Event, d: Date){
    setSelected({event: e, date: d})
  }
  function closeInfo(){ setSelected(null) }

  return (
    <div className="week" data-week-start={fmtISODate(start)}>
      <div className="label">{t('week.weekOf')} {weekRangeLabel(start)}</div>
      <div className="grid">
        {days.map(d=> (
          <DayCell
            key={fmtISODate(d)}
            date={d}
            events={eventsByDate[fmtISODate(d)]}
            onClickEvent={openInfo}
          />
        ))}
      </div>
      {selected && (
        <div
          className="overlay"
          onClick={closeInfo}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
          }}
        >
          <div
            className="sheet"
            onClick={e=> e.stopPropagation()}
            style={{
              maxWidth:480, width:'90%', background:'#0f172a', color:'var(--fg)',
              border:'1px solid rgba(148,163,184,.3)', borderRadius:16, padding:16,
              boxShadow:'0 10px 30px rgba(0,0,0,.4)'
            }}
          >
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:8}}>
              <div style={{fontWeight:600}}>{selected.event.title}</div>
              <button onClick={closeInfo} style={{background:'transparent', color:'var(--fg)', border:'none', fontSize:18, cursor:'pointer'}}>×</button>
            </div>
            <div style={{fontSize:12, color:'var(--muted)', marginBottom:12}}>{dateLabel(selected.date)}</div>
            <div style={{lineHeight:1.5, whiteSpace:'pre-wrap'}}>
              {selected.event.info || t('week.noDetails')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
