const LEVEL_GOOD = '#2ecc71'
const LEVEL_WARN = '#f39c12'
const LEVEL_BAD = '#e74c3c'

export const hpColor = (hp: number): string => (hp > 50 ? LEVEL_GOOD : hp > 25 ? LEVEL_WARN : LEVEL_BAD)

export const batteryColor = (battery: number): string =>
  battery > 60 ? LEVEL_GOOD : battery > 30 ? LEVEL_WARN : LEVEL_BAD
