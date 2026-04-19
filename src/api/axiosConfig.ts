import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SANCTUM_CSRF_URL = import.meta.env.VITE_SANCTUM_CSRF_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor to Ensure CSRF Token is Sent
apiClient.interceptors.request.use(async (config) => {
  // Ensure CSRF token is fetched before login/register
  if (config.url?.includes("/login") || config.url?.includes("/register")) {
    await axios.get(SANCTUM_CSRF_URL, {
      withCredentials: true,
      withXSRFToken: true,
    });
  }

  return config;
});

export default apiClient;
