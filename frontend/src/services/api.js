import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Find the Supabase token in localStorage
        // Supabase keys usually look like 'sb-XXX-auth-token'
        const supabaseKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
        const sessionStr = localStorage.getItem(supabaseKey);

        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                const token = session.access_token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                console.error('Error parsing session for API request', e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect on actual auth errors, but don't be too aggressive
        if (error.response?.status === 401) {
            console.warn('Unauthorized request detected. If this persists, please log in again.');
            // Optional: Uncomment to force logout on every 401
            // const supabaseKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
            // localStorage.removeItem(supabaseKey);
            // window.location.href = '/login';
        }
        const message = error.response?.data?.error || error.message || 'An error occurred';
        console.error('API Error:', message);
        return Promise.reject(error);
    }
);

export default apiClient;
