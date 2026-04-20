import axios from "axios";
// import Cookies from "js-cookie"; // ✅ Import js-cookie

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SANCTUM_CSRF_URL = import.meta.env.VITE_SANCTUM_CSRF_URL;
export const AUTH_TOKEN_STORAGE_KEY = "inventario_auth_token";

export const getStoredAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

export const setStoredAuthToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const clearStoredAuthToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  delete apiClient.defaults.headers.common.Authorization;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const initialToken = getStoredAuthToken();

if (initialToken) {
  apiClient.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

// ✅ Interceptor to Ensure CSRF Token is Sent
apiClient.interceptors.request.use(async (config) => {
  const token = getStoredAuthToken();
  const isAuthRequest =
    config.url?.includes("/login") || config.url?.includes("/register");

  // Ensure CSRF token is fetched before login/register
  if (isAuthRequest) {
    await axios.get(SANCTUM_CSRF_URL, {
      withCredentials: true, // ✅ Must include credentials to receive CSRF cookie
      withXSRFToken: true,
    });
  }

  if (token && !isAuthRequest) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ Read CSRF token from cookie and set it in headers
  // const csrfToken = Cookies.get("XSRF-TOKEN");

  // if (csrfToken) {
  //   config.headers["X-XSRF-TOKEN"] = csrfToken;
  // }

  return config;
});

export default apiClient;
