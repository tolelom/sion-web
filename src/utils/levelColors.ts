// 체력·배터리처럼 0~100으로 표시하는 수치의 색.
export const LEVEL_GOOD = '#2ecc71'
export const LEVEL_WARN = '#f39c12'
export const LEVEL_BAD = '#e74c3c'

export const hpColor = (hp: number): string => (hp > 50 ? LEVEL_GOOD : hp > 25 ? LEVEL_WARN : LEVEL_BAD)

export const batteryColor = (battery: number): string =>
  battery > 60 ? LEVEL_GOOD : battery > 30 ? LEVEL_WARN : LEVEL_BAD
