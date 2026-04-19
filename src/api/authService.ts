import axios, { AxiosError } from "axios";
import { User } from "../types/types";
import apiClient from "./axiosConfig";
// import Cookies from "js-cookie"; // ✅ Import js-cookie

export const authService = {
  fetchUser: async (): Promise<User | null> => {
    try {
      const { data } = await apiClient.get("/user");
      return { ...data, roles: data.roles ?? [] }; // ✅ Ensure roles exist
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || "Error fetching user.",
        );
      }
      throw new Error("Unexpected error. Please try again.");
    }
  },

  login: async (email: string, password: string): Promise<User> => {
    try {
      // 1. Ambil CSRF cookie dulu
      await axios.get(import.meta.env.VITE_SANCTUM_CSRF_URL, {
        withCredentials: true,
        withXSRFToken: true, // This tells axios to set XSRF token header automatically
      });

      // 2. Baru login
      const { data } = await apiClient.post("/login", { email, password });
      return { ...data.user, token: data.token, roles: data.user.roles ?? [] };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || "Invalid credentials.",
        );
      }
      throw new Error("Unexpected error. Please try again.");
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/logout");

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  },
};
