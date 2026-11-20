import axios from 'axios';
export const api = axios.create({baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', timeout: 15000});
export function errorMessage(error) {
  const payload = error?.response?.data;
  return payload?.message || payload?.error || (Array.isArray(payload?.errors) ? payload.errors.join(', ') : '') || (error?.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : error?.message || 'An unexpected error occurred.');
}
