import { ReactNode, useEffect, useState } from "react";
import { authService } from "../api/authService";
import { AuthContext } from "../context/AuthContext";
import { User } from "../types/types";
// import Cookies from "js-cookie"; // ✅ Import js-cookie
import { useLocation, useNavigate } from "react-router-dom";

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_USER_STORAGE_KEY = "inventario_auth_user";

const getStoredAuthUser = (): User | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
};

const setStoredAuthUser = (user: User) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
};

const clearStoredAuthUser = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const location = useLocation(); // ✅ Get current route
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getStoredAuthUser();

    // ✅ Skip fetching the user if on login page
    if (location.pathname === "/login" || location.pathname === "/") {
      setLoading(false);
      return;
    }

    if (user && storedUser) {
      setLoading(false);
      return;
    }

    const initializeUser = async () => {
      setLoading(true);

      if (storedUser) {
        setUser(storedUser);
      }

      try {
        const userData = await authService.fetchUser();
        if (userData) {
          setUser(userData);
          setStoredAuthUser(userData);
        } else {
          setUser(null);
          clearStoredAuthUser();
        }
      } catch (error) {
        console.error("Error fetching user:", error);

        if (storedUser) {
          setUser(storedUser);
        } else {
          setUser(null);
          clearStoredAuthUser();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [location.pathname, user]);

  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      setStoredAuthUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      clearStoredAuthUser();
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      clearStoredAuthUser();

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, logout, isLoggingIn }}
    >
      {children}
    </AuthContext.Provider>
  );
};
