import { AxiosError } from "axios";
import { User } from "../types/types";
import apiClient from "./axiosConfig";

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
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const { data } = await apiClient.post("/token-login", formData);

      // Persist the token for subsequent authenticated requests
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }

      return { ...data.user, token: data.token, roles: data.user.roles ?? [] };
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        if (serverMessage) {
          throw new Error(serverMessage);
        }

        // Fallback based on HTTP status
        switch (status) {
          case 401:
            throw new Error("Invalid email or password.");
          case 422:
            throw new Error("Validation failed. Please check your input.");
          case 429:
            throw new Error("Too many attempts. Please try again later.");
          case 500:
            throw new Error("Server error. Please try again later.");
          default:
            throw new Error(`Login failed (HTTP ${status ?? "unknown"}).`);
        }
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
  },
};
