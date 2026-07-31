import axios from 'axios';
import Cookies from 'js-cookie';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('admin_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Trigger token refresh if 401 (Unauthorized) OR 403 (Forbidden due to expired token acting as checkAdmin failure)
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('admin_refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        const res = await axios.post('/api/admin-auth/refresh', { refresh_token: refreshToken });
        const data = res.data;

        if (data.success && data.access_token) {
          const expires = new Date(Date.now() + 55 * 60 * 1000); // Tăng lên 55 phút
          const cookieOptions: Cookies.CookieAttributes = { 
            expires, 
            secure: window.location.protocol === 'https:', 
            sameSite: 'strict' 
          };
          Cookies.set('admin_access_token', data.access_token, cookieOptions);

          if (data.refresh_token) {
            Cookies.set('admin_refresh_token', data.refresh_token, { 
              expires: 30, 
              secure: window.location.protocol === 'https:', 
              sameSite: 'strict' 
            });
          }
          
          isRefreshing = false;
          onRefreshed(data.access_token);
          
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        Cookies.remove('admin_access_token');
        Cookies.remove('admin_refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
