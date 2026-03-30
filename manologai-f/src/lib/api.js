import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4545",
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
