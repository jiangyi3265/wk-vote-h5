// Backend API. Production can inject VITE_API_BASE_URL during build.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
