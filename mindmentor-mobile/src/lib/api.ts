import axios from "axios";
import { useAuth } from "../store/auth";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
});

api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
