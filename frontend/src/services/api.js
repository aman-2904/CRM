import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

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
        const supabaseKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
        const sessionStr = localStorage.getItem(supabaseKey);

        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                const token = session?.access_token;
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
        if (error.response?.status === 401) {
            console.warn('Unauthorized request detected.');
        }
        return Promise.reject(error);
    }
);

// API Methods
export const api = {
    get: (url, config) => apiClient.get(url, config),
    post: (url, data, config) => apiClient.post(url, data, config),
    put: (url, data, config) => apiClient.put(url, data, config),
    patch: (url, data, config) => apiClient.patch(url, data, config),
    delete: (url, config) => apiClient.delete(url, config),

    // Notes
    getLeadNotes: (leadId) => apiClient.get(`/notes/leads/${leadId}`),
    createNote: (noteData) => apiClient.post('/notes', noteData),
    deleteNote: (noteId) => apiClient.delete(`/notes/${noteId}`),
};

export default api;
