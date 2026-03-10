import axios from "axios";

// Base API instance for all backend calls
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    headers: {
        "Content-Type": "application/json"
    }
});

// Intercept requests to attach the JWT token if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Intercept responses to handle global errors like 401 Unauthorized
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response?.status === 401) {
        // Handle unauthorized (e.g., clear token and redirect to login)
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userRole");
        window.location.href = "/login";
    }
    return Promise.reject(error);
});

export default api;
