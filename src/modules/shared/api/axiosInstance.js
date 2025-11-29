import axios from 'axios';

const instance = axios.create({
  baseURL: '/',     // ⬅ NECESARIO PARA USAR EL PROXY DE VITE
  withCredentials: false,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (config) => config,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname.includes('/admin/')) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        localStorage.removeItem('token');
      }
    }

    return Promise.reject(error);
  },
);

export { instance };