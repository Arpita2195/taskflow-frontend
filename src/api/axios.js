import axios from 'axios';

const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url || url.includes(' ') || url.includes('to:')) {
    url = 'https://taskflow-backend-1-q8ya.onrender.com';
  }
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${url.replace(/\/$/, '')}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        let apiURL = import.meta.env.VITE_API_URL;
        if (!apiURL || apiURL.includes(' ') || apiURL.includes('to:')) {
          apiURL = 'https://taskflow-backend-1-q8ya.onrender.com';
        }
        if (window.location.hostname === 'localhost') {
          apiURL = 'http://localhost:5000';
        }
        const { data } = await axios.post(`${apiURL.replace(/\/$/, '')}/api/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (_) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
