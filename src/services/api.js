import axios from 'axios';

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'https://batloung-farm-backend.vercel.app/api/',
  timeout: 15000
});

export function errorMessage(error) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }

  if (!error.response) {
    return 'Cannot connect to the backend server.';
  }

  return error.message || 'An unexpected error occurred.';
}
