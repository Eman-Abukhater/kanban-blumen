// src/services/auth.ts
import axios from "axios";

const API = "https://kanban-backend-final.onrender.com/api";
const TOKEN_KEY = "token";

export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function login(email: string, password: string) {
  const res = await axios.post(`${API}/auth/login`, { email, password });
  const token = res?.data?.data?.token ?? res?.data?.token ?? null;
  if (token) setToken(token);
  return res.data;
}

/**
 * Fast token verification:
 * - Try /auth/verify-fast (if backend supports it)
 * - If backend returns 404 => fallback to /auth/verify (exists)
 */
export async function verifyTokenFast(token: string) {
  try {
    const res = await axios.post(`${API}/auth/verify-fast`, { token });
    return res.data;
  } catch (error: any) {
    const status = error?.response?.status;

    // ✅ fallback if route doesn't exist on backend
    if (status === 404) {
      try {
        const res2 = await axios.post(`${API}/auth/verify`, { token });
        return res2.data;
      } catch (e) {
        console.error("Token verification failed (fallback verify):", e);
        return { success: false };
      }
    }

    console.error("Token verification failed (verify-fast):", error);
    return { success: false };
  }
}

// Full token verification - includes user data from DB (if backend does that)
export async function verifyTokenFull(token: string) {
  try {
    const res = await axios.post(`${API}/auth/verify`, { token });
    return res.data;
  } catch (error) {
    console.error("Token verification failed:", error);
    return { success: false };
  }
}
