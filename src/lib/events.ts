import { addDays, fmtISODate, isSameDay, monthsBetween, weeksBetween, secondsBetween } from "./date"
import { NO_NAMEDAYS } from "../data/namedays-no"
import i18n from "./i18n"

export type Frequency = 'yearly' | 'half-yearly' | 'quarterly' | 'monthly' | 'weekly'
export type Event = {
  id: string
  title: string
  date: Date
  importance?: 'good'|'warn'|'bad'
  info?: string
}
export type GeneratorContext = {
  today: Date
  userName: string
  birthday: Date | null
  moveInDate: Date | null
}

// Helpers
function nextBirthdayOnYear(bday: Date, year: number): Date {
  const d = new Date(year, bday.getMonth(), bday.getDate())
  return d
}

function matchNameday(name: string | undefined, date: Date): boolean {
  if(!name) return false
  const key = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  const list = NO_NAMEDAYS[key]?.names || []
  const norm = name.trim().toLowerCase()
  return list.includes(norm)
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth()+months)
  return d
}

// Special number pattern detection functions
function isPalindrome(num: number): boolean {
  const str = num.toString()
  return str === str.split('').reverse().join('')
}

function isRepeatingBlock(num: number): boolean {
  const str = num.toString()
  if (str.length < 4) return false
  
  // Check for repeating blocks of 2 or more digits
  for (let blockSize = 2; blockSize <= Math.floor(str.length / 2); blockSize++) {
    const block = str.substring(0, blockSize)
    const repetitions = Math.floor(str.length / blockSize)
    const expected = block.repeat(repetitions)
    if (str.startsWith(expected)) {
      return true
    }
  }
  return false
}

function isSequentialDoubleDigits(num: number): boolean {
  const str = num.toString()
  if (str.length < 4 || str.length % 2 !== 0) return false
  
  // Check if the number consists of pairs of identical digits in sequence
  for (let i = 0; i < str.length; i += 2) {
    if (i + 1 >= str.length || str[i] !== str[i + 1]) {
      return false
    }
  }
  return true
}

function hasSpecialNumberPattern(num: number): { type: string; description: string } | null {
  if (isPalindrome(num)) {
    return { type: 'palindrome', description: 'palindrome' }
  }
  if (isRepeatingBlock(num)) {
    return { type: 'repeating', description: 'repeating block' }
  }
  if (isSequentialDoubleDigits(num)) {
    return { type: 'sequential', description: 'sequential double digits' }
  }
  return null
}

// Star sign detection based on birthday (Norwegian dates)
function getStarSign(birthday: Date): string {
  const month = birthday.getMonth() + 1 // 1-12
  const day = birthday.getDate()
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 20)) return 'aries'
  if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) return 'taurus'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return 'gemini'
  if ((month === 6 && day >= 22) || (month === 7 && day <= 23)) return 'cancer'
  if ((month === 7 && day >= 24) || (month === 8 && day <= 23)) return 'leo'
  if ((month === 8 && day >= 24) || (month === 9 && day <= 23)) return 'virgo'
  if ((month === 9 && day >= 24) || (month === 10 && day <= 22)) return 'libra'
  if ((month === 10 && day >= 23) || (month === 11 && day <= 22)) return 'scorpio'
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return 'sagittarius'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn'
  if ((month === 1 && day >= 20) || (month === 2 && day <= 19)) return 'aquarius'
  if ((month === 2 && day >= 20) || (month === 3 && day <= 20)) return 'pisces'
  
  return 'unknown'
}

// Get the start date of a star sign's month for a given year (Norwegian dates)
function getStarSignMonthStart(starSign: string, year: number): Date {
  const signDates: { [key: string]: [number, number] } = {
    'aries': [3, 21],
    'taurus': [4, 21],
    'gemini': [5, 21],
    'cancer': [6, 22],
    'leo': [7, 24],
    'virgo': [8, 24],
    'libra': [9, 24],
    'scorpio': [10, 23],
    'sagittarius': [11, 23],
    'capricorn': [12, 22],
    'aquarius': [1, 20],
    'pisces': [2, 20]
  }
  
  const [month, day] = signDates[starSign] || [1, 1]
  return new Date(year, month - 1, day)
}

// Calculate Advent Sundays (4 Sundays before Christmas)
function getAdventSundays(year: number): Date[] {
  const christmas = new Date(year, 11, 24) // December 24
  const christmasDay = christmas.getDay() // Day of week for Christmas (0=Sunday, 1=Monday, etc.)
  
  // 4th Advent is the Sunday before Christmas (December 24)
  // If Christmas is on Sunday, 4th Advent is the previous Sunday
  // If Christmas is on Monday-Saturday, 4th Advent is the Sunday before
  let fourthAdvent
  if (christmasDay === 0) { // Christmas is on Sunday
    fourthAdvent = new Date(christmas)
    fourthAdvent.setDate(christmas.getDate() - 7) // Previous Sunday
  } else { // Christmas is on Monday-Saturday
    fourthAdvent = new Date(christmas)
    fourthAdvent.setDate(christmas.getDate() - christmasDay) // Previous Sunday
  }
  
  // Calculate the other Advent Sundays (7 days before each)
  const thirdAdvent = new Date(fourthAdvent)
  thirdAdvent.setDate(fourthAdvent.getDate() - 7)
  
  const secondAdvent = new Date(thirdAdvent)
  secondAdvent.setDate(thirdAdvent.getDate() - 7)
  
  const firstAdvent = new Date(secondAdvent)
  firstAdvent.setDate(secondAdvent.getDate() - 7)
  
  return [firstAdvent, secondAdvent, thirdAdvent, fourthAdvent]
}

// Returns the most recent occurrence of the birthday at or before the reference date
function lastBirthdayBeforeOrOn(bday: Date, ref: Date): Date {
  const birthMonth = bday.getMonth()
  const birthDay = bday.getDate()
  const refMonth = ref.getMonth()
  const refDay = ref.getDate()

  const sameOrAfterThisYear = (refMonth > birthMonth) || (refMonth === birthMonth && refDay >= birthDay)
  const year = sameOrAfterThisYear ? ref.getFullYear() : ref.getFullYear() - 1
  return new Date(year, birthMonth, birthDay)
}

// Returns the most recent occurrence of the move-in date at or before the reference date
function lastMoveInDateBeforeOrOn(moveInDate: Date, ref: Date): Date {
  const moveInMonth = moveInDate.getMonth()
  const moveInDay = moveInDate.getDate()
  const refMonth = ref.getMonth()
  const refDay = ref.getDate()

  const sameOrAfterThisYear = (refMonth > moveInMonth) || (refMonth === moveInMonth && refDay >= moveInDay)
  const year = sameOrAfterThisYear ? ref.getFullYear() : ref.getFullYear() - 1
  return new Date(year, moveInMonth, moveInDay)
}

// Get the Monday of the week containing the birthday for a given year
function getBirthdayWeekMonday(birthday: Date, year: number): Date {
  const birthdayThisYear = new Date(year, birthday.getMonth(), birthday.getDate())
  const dayOfWeek = birthdayThisYear.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Convert to Monday = 0
  const monday = new Date(birthdayThisYear)
  monday.setDate(birthdayThisYear.getDate() + daysToMonday)
  return monday
}

// Get the first day of the birthday month for a given year
function getBirthdayMonthFirstDay(birthday: Date, year: number): Date {
  return new Date(year, birthday.getMonth(), 1)
}

export function generateEventsForDate(date: Date, ctx: GeneratorContext): Event[] {
  const out: Event[] = []
  const iso = fmtISODate(date)

  // User-configured: birthday-based events
  if(ctx.birthday){
    // pure birthday each year
    if(date.getMonth()===ctx.birthday.getMonth() && date.getDate()===ctx.birthday.getDate()){
      const age = date.getFullYear() - ctx.birthday.getFullYear()
      out.push({ 
        id:`bday-${iso}`, 
        title:i18n.t('events.birthday', { age }), 
        date, 
        importance:'good',
        info: i18n.t('events.explanations.birthday')
      })
    }
    // half-birthday (6 months after the most recent real birthday)
    const anchor = lastBirthdayBeforeOrOn(ctx.birthday, date)
    const half = addMonths(anchor, 6)
    if(isSameDay(half, date)){
      out.push({ 
        id:`half-bday-${iso}`, 
        title:i18n.t('events.halfBirthday'), 
        date,
        info: i18n.t('events.explanations.halfBirthday')
      })
    }
    // quarter birthdays (3 and 9 months after the most recent real birthday)
    const q1 = addMonths(anchor, 3)
    const q3 = addMonths(anchor, 9)
    if(isSameDay(q1,date) || isSameDay(q3,date)){
      out.push({ 
        id:`quarter-bday-${iso}`, 
        title:i18n.t('events.quarterBirthday'), 
        date,
        info: i18n.t('events.explanations.quarterBirthday')
      })
    }
    // Countdown days to your birthday (50, 100, 200, 300)
    const nextB = ((): Date => {
      const thisYear = nextBirthdayOnYear(ctx.birthday, date.getFullYear())
      if(thisYear >= date) return thisYear
      return nextBirthdayOnYear(ctx.birthday, date.getFullYear()+1)
    })()
    
    const countdownDays = [10, 50, 100, 150, 200, 250, 300, 350]
    for(const days of countdownDays){
      const countdownDate = addDays(new Date(nextB), -days)
      if(isSameDay(countdownDate, date)){
        out.push({ 
          id:`${days}to-bday-${iso}`, 
          title:i18n.t('events.daysUntilBirthday', { days }), 
          date, 
          importance:'warn',
          info: i18n.t('events.explanations.daysUntilBirthday')
        })
      }
    }
    // week-birthday / month-birthday round numbers
    const birthdayWeeks = weeksBetween(ctx.birthday, date)
    const birthdayMonths = monthsBetween(ctx.birthday, date)
    const roundWeeks = (birthdayWeeks>0 && birthdayWeeks % 100 === 0)
    const roundMonths = (birthdayMonths>0 && birthdayMonths % 10 === 0)
    if(roundWeeks && date.getDay()===ctx.birthday.getDay()){
      out.push({ 
        id:`wk-bday-${iso}`, 
        title:i18n.t('events.weeksOld', { weeks: birthdayWeeks }), 
        date,
        info: i18n.t('events.explanations.weeksOld')
      })
    }
    if(roundMonths && date.getDate()===ctx.birthday.getDate()){
      out.push({ 
        id:`mo-bday-${iso}`, 
        title:i18n.t('events.monthsOld', { months: birthdayMonths }), 
        date,
        info: i18n.t('events.explanations.monthsOld')
      })
    }
    
    // Birthday week event (Monday of the week containing the birthday)
    const birthdayWeekMonday = getBirthdayWeekMonday(ctx.birthday, date.getFullYear())
    if(isSameDay(birthdayWeekMonday, date)){
      out.push({ 
        id:`bday-week-${iso}`, 
        title:i18n.t('events.birthdayWeek'), 
        date, 
        importance:'good',
        info: i18n.t('events.explanations.birthdayWeek')
      })
    }
    
    // Birthday month event (first day of the birthday month)
    const birthdayMonthFirstDay = getBirthdayMonthFirstDay(ctx.birthday, date.getFullYear())
    if(isSameDay(birthdayMonthFirstDay, date)){
      out.push({ 
        id:`bday-month-${iso}`, 
        title:i18n.t('events.birthdayMonth'), 
        date, 
        importance:'good',
        info: i18n.t('events.explanations.birthdayMonth')
      })
    }
    
    // Special number pattern events (age in months, weeks, days, seconds)
    const months = monthsBetween(ctx.birthday, date)
    const weeks = weeksBetween(ctx.birthday, date)
    const days = Math.floor((date.getTime() - ctx.birthday.getTime()) / (1000 * 60 * 60 * 24))
    const seconds = secondsBetween(ctx.birthday, date)
    
    // Check for special patterns in each time unit
    const timeUnits = [
      { value: months, unit: 'months', unitLabel: i18n.t('events.unitLabels.months') },
      { value: weeks, unit: 'weeks', unitLabel: i18n.t('events.unitLabels.weeks') },
      { value: days, unit: 'days', unitLabel: i18n.t('events.unitLabels.days') },
      { value: seconds, unit: 'seconds', unitLabel: i18n.t('events.unitLabels.seconds') }
    ]
    
    for (const { value, unit, unitLabel } of timeUnits) {
      if (value > 0) {
        const pattern = hasSpecialNumberPattern(value)
        if (pattern) {
          // Only add event on the first day of the period when this special number occurs
          const isFirstDayOfPeriod = (() => {
            switch (unit) {
              case 'months':
                return date.getDate() === ctx.birthday.getDate()
              case 'weeks':
                return date.getDay() === ctx.birthday.getDay()
              case 'days':
                return true // Every day is the first day for daily events
              case 'seconds':
                return true // Every second is the first second for second events
              default:
                return false
            }
          })()
          
          if (isFirstDayOfPeriod) {
            out.push({
              id: `special-${unit}-${value}-${iso}`,
              title: i18n.t(`events.specialNumber.${pattern.type}`, { 
                value, 
                unit: unitLabel,
                pattern: pattern.description 
              }),
              date,
              importance: 'good',
              info: i18n.t(`events.specialNumberExplanations.${pattern.type}`)
            })
          }
        }
      }
    }
  }

  // Move-in date celebrations
  if(ctx.moveInDate){
    // pure move-in anniversary each year
    if(date.getMonth()===ctx.moveInDate.getMonth() && date.getDate()===ctx.moveInDate.getDate()){
      const years = date.getFullYear() - ctx.moveInDate.getFullYear()
      out.push({ 
        id:`movein-${iso}`, 
        title:i18n.t('events.moveInAnniversary', { years }), 
        date, 
        importance:'good',
        info: i18n.t('events.explanations.moveInAnniversary')
      })
    }
    // half move-in anniversary (6 months after the most recent real move-in date)
    const anchor = lastMoveInDateBeforeOrOn(ctx.moveInDate, date)
    const half = addMonths(anchor, 6)
    if(isSameDay(half, date)){
      out.push({ 
        id:`half-movein-${iso}`, 
        title:i18n.t('events.halfMoveInAnniversary'), 
        date,
        info: i18n.t('events.explanations.halfMoveInAnniversary')
      })
    }
    // quarter move-in anniversaries (3 and 9 months after the most recent real move-in date)
    const q1 = addMonths(anchor, 3)
    const q3 = addMonths(anchor, 9)
    if(isSameDay(q1,date) || isSameDay(q3,date)){
      out.push({ 
        id:`quarter-movein-${iso}`, 
        title:i18n.t('events.quarterMoveInAnniversary'), 
        date,
        info: i18n.t('events.explanations.quarterMoveInAnniversary')
      })
    }
    // week-move-in / month-move-in round numbers
    const weeks = weeksBetween(ctx.moveInDate, date)
    const months = monthsBetween(ctx.moveInDate, date)
    const roundWeeks = (weeks>0 && weeks % 100 === 0)
    const roundMonths = (months>0 && months % 10 === 0)
    if(roundWeeks && date.getDay()===ctx.moveInDate.getDay()){
      out.push({ 
        id:`wk-movein-${iso}`, 
        title:i18n.t('events.weeksSinceMoveIn', { weeks }), 
        date,
        info: i18n.t('events.explanations.weeksSinceMoveIn')
      })
    }
    if(roundMonths && date.getDate()===ctx.moveInDate.getDate()){
      out.push({ 
        id:`mo-movein-${iso}`, 
        title:i18n.t('events.monthsSinceMoveIn', { months }), 
        date,
        info: i18n.t('events.explanations.monthsSinceMoveIn')
      })
    }
  }

  // Star sign month celebrations
  if(ctx.birthday){
    const starSign = getStarSign(ctx.birthday)
    
    // Star sign month start event
    const currentYearStart = getStarSignMonthStart(starSign, date.getFullYear())
    const nextYearStart = getStarSignMonthStart(starSign, date.getFullYear() + 1)
    
    // Check if today is the start of the star sign month
    if(isSameDay(currentYearStart, date)){
      const starSignName = i18n.t(`events.starSigns.${starSign}`)
      out.push({ 
        id:`starsign-start-${iso}`, 
        title:i18n.t('events.starSignMonthStart', { starSign: starSignName }), 
        date, 
        importance:'good',
        info: i18n.t('events.explanations.starSignMonthStart')
      })
    }
    
    // Countdown to next star sign month start
    const nextStarSignStart = ((): Date => {
      if(currentYearStart >= date) return currentYearStart
      return nextYearStart
    })()
    
    const countdownDays = [10, 50, 100, 150, 200, 250, 300]
    for(const days of countdownDays){
      const countdownDate = addDays(new Date(nextStarSignStart), -days)
      if(isSameDay(countdownDate, date)){
        const starSignName = i18n.t(`events.starSigns.${starSign}`)
        out.push({ 
          id:`${days}to-starsign-${iso}`, 
          title:i18n.t('events.daysUntilStarSign', { days, starSign: starSignName }), 
          date, 
          importance:'warn',
          info: i18n.t('events.explanations.daysUntilStarSign')
        })
      }
    }
  }

  // Nameday logic (very simplified sample dataset)
  if(ctx.userName){
    if(matchNameday(ctx.userName, date)){
      const key = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      const desc = NO_NAMEDAYS[key]?.description
      out.push({ id:`nameday-${iso}`, title:i18n.t('events.nameday', { name: ctx.userName }), date, importance:'good', info: desc })
      // half and quarter nameday based on the nameday date in this year
      const base = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const half = addMonths(base, 6)
      const q1 = addMonths(base, 3)
      const q3 = addMonths(base, 9)
      if(isSameDay(half,date)) out.push({ 
        id:`half-nameday-${iso}`, 
        title:i18n.t('events.halfNameday'), 
        date,
        info: i18n.t('events.explanations.halfNameday')
      })
      if(isSameDay(q1,date) || isSameDay(q3,date)) out.push({ 
        id:`quarter-nameday-${iso}`, 
        title:i18n.t('events.quarterNameday'), 
        date,
        info: i18n.t('events.explanations.quarterNameday')
      })
    }else{
      // Countdown to nameday: compute next nameday date for the name
      function nextNamedayDate(name: string, fromYear: number): Date | null {
        const norm = name.trim().toLowerCase()
        
        // Find the nameday date
        let namedayDate: Date | null = null
        for(const key of Object.keys(NO_NAMEDAYS)){
          const [mm, dd] = key.split('-').map(Number)
          const names = NO_NAMEDAYS[key]?.names || []
          if(names.includes(norm)){
            namedayDate = new Date(fromYear, mm-1, dd)
            break
          }
        }
        
        if(!namedayDate) return null
        
        // Always return the nameday for the given year
        // The countdown logic will handle whether to use current or next year
        return namedayDate
      }
      
      // Get the next nameday occurrence (current year or next year)
      const currentYearNameday = nextNamedayDate(ctx.userName, date.getFullYear())
      const nextYearNameday = nextNamedayDate(ctx.userName, date.getFullYear() + 1)
      
      let nextN: Date | null = null
      if(currentYearNameday && currentYearNameday >= date){
        nextN = currentYearNameday
      } else if(nextYearNameday){
        nextN = nextYearNameday
      }
      
      if(nextN){
        const countdownDays = [10,50,100,150,200,250,300,350]
        for(const days of countdownDays){
          const countdownDate = addDays(new Date(nextN), -days)
          if(isSameDay(countdownDate, date)){
            out.push({ 
              id:`${days}to-nameday-${iso}`, 
              title:i18n.t('events.daysUntilNameday', { days }), 
              date, 
              importance:'warn',
              info: i18n.t('events.explanations.daysUntilNameday')
            })
          }
        }
      }
    }
  }

  // Christmas events
  // Christmas Day (December 24)
  if(date.getMonth()===11 && date.getDate()===24){
    out.push({ 
      id:`christmas-${iso}`, 
      title:i18n.t('events.christmas'), 
      date, 
      importance:'good',
      info: i18n.t('events.explanations.christmas')
    })
  }
  
  // Christmas countdown
  const christmasThisYear = new Date(date.getFullYear(), 11, 24) // December 24
  const christmasNextYear = new Date(date.getFullYear() + 1, 11, 24)
  const nextChristmas = christmasThisYear >= date ? christmasThisYear : christmasNextYear
  
  const christmasCountdownDays = [10, 50, 100, 150, 200, 250, 300, 350]
  for(const days of christmasCountdownDays){
    const countdownDate = addDays(new Date(nextChristmas), -days)
    if(isSameDay(countdownDate, date)){
      out.push({ 
        id:`${days}to-christmas-${iso}`, 
        title:i18n.t('events.daysUntilChristmas', { days }), 
        date, 
        importance:'warn',
        info: i18n.t('events.explanations.daysUntilChristmas')
      })
    }
  }
  
  // Advent Sundays (4 Sundays before Christmas)
  const adventSundays = getAdventSundays(date.getFullYear())
  for(let i = 0; i < adventSundays.length; i++){
    if(isSameDay(adventSundays[i], date)){
      out.push({ 
        id:`advent${i+1}-${iso}`, 
        title:i18n.t('events.advent', { number: i+1 }), 
        date, 
        importance:'good',
        info: i18n.t('events.explanations.advent')
      })
    }
  }
  
  // New Year's Eve countdown
  const newYearThisYear = new Date(date.getFullYear(), 0, 1) // January 1
  const newYearNextYear = new Date(date.getFullYear() + 1, 0, 1)
  const nextNewYear = newYearThisYear >= date ? newYearThisYear : newYearNextYear
  
  const newYearCountdownDays = [10, 50, 100, 150, 200, 250, 300, 350]
  for(const days of newYearCountdownDays){
    const countdownDate = addDays(new Date(nextNewYear), -days)
    if(isSameDay(countdownDate, date)){
      out.push({ 
        id:`${days}to-newyear-${iso}`, 
        title:i18n.t('events.daysUntilNewYear', { days }), 
        date, 
        importance:'warn',
        info: i18n.t('events.explanations.daysUntilNewYear')
      })
    }
  }

  // Internal recurring events example (can be extended)
  
  // Half-yearly: Only Jul 1 (6 months between New Years)
  if(date.getDate()===1 && date.getMonth()===6){
    out.push({ 
      id:`halfyear-${iso}`, 
      title:i18n.t('events.halfYearMarker'), 
      date,
      info: i18n.t('events.explanations.halfYearMarker')
    })
  }
  // Yearly: New Year
  if(date.getMonth()===0 && date.getDate()===1){
    out.push({ 
      id:`yearly-${iso}`, 
      title:i18n.t('events.newYear'), 
      date, 
      importance:'good',
      info: i18n.t('events.explanations.newYear')
    })
  }

  return out
}
