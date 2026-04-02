import axios from "axios";

const defaultApiBaseUrl = `${window.location.protocol}//${window.location.hostname}:4545`;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

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
