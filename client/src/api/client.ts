import axios from "axios";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const resolvedApiBaseUrl = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, "")
  : isLocalhost
    ? "http://localhost:6767"
    : "";

export const api = axios.create({
  baseURL: resolvedApiBaseUrl,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};
