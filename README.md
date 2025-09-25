# Celebrate — Little Wins

A mobile-first, portrait-only web app that shows recurring things to celebrate: your birthday, nameday, 100-days-until markers, week-birthdays, and more.

## Dev
```bash
pnpm i   # or npm i / yarn
pnpm dev
```

## Build
```bash
pnpm build
# output in dist/
```

## Notes
- No server. All data is stored locally in `localStorage`.
- Orientation is locked to portrait via the Web App Manifest (`orientation: portrait`) and a landscape overlay for browsers.
- Namedays dataset is a small sample; extend `src/data/namedays-no.ts` to include full Norwegian namedays.
- Week view starts at the current week and extends down as you scroll.
- Recurring rules included: yearly, half-yearly, quarterly, monthly, weekly (examples in `src/lib/events.ts`). 
