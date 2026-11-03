// 두 URL은 vite.config.js가 빌드 때 필수로 검사하므로 여기서 다시 확인하지 않는다.
export const WS_URL = import.meta.env.VITE_WS_URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT) || 10000
