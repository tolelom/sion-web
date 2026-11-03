// 빌드 시점에 박히는 환경변수를 한곳에서 읽는다.
// VITE_WS_URL과 VITE_API_BASE_URL은 vite.config.js가 빌드 때 필수로 검사한다.
export const WS_URL = import.meta.env.VITE_WS_URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT) || 10000
