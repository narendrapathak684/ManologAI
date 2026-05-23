import axios from "axios";
import { API_BASE_URL } from "./constants";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;


    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes("/auth/refresh") || originalRequest.url.includes("/auth/login")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        await api.post("/auth/refresh");
        return api(originalRequest);
      } catch (refreshError) {


        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error, fallbackMessage) {
  if (axios.isAxiosError(error)) {
    const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message;

    if (message) {
      return message;
    }
  }

  return fallbackMessage;
}
