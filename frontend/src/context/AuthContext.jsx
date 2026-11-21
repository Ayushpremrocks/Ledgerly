import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { authAPI, errorMessage } from "../lib/api";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    if (token && raw) return { token, user: JSON.parse(raw) };
  } catch {
    // corrupted storage: start signed out
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  // Read synchronously so the first render already knows if we're signed in (no spinner flash)
  const [state, setState] = useState(readStoredUser);

  const persist = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setState({ token, user });
  };

  const login = useCallback(async (username, password) => {
    try {
      const data = await authAPI.login(username, password);
      const user = {
        id: data.id,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
      };
      persist(data.token, user);
      return { success: true };
    } catch (err) {
      return { success: false, error: errorMessage(err, "Sign-in failed") };
    }
  }, []);

  const register = useCallback(async (body) => {
    try {
      await authAPI.register(body);
      return { success: true };
    } catch (err) {
      return { success: false, error: errorMessage(err, "Couldn't create your profile") };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setState({ token: null, user: null });
  }, []);

  /** Keep the cached user in sync after a profile edit */
  const updateUser = useCallback((patch) => {
    setState((prev) => {
      const user = { ...prev.user, ...patch };
      localStorage.setItem("user", JSON.stringify(user));
      return { ...prev, user };
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: !!state.token,
      isAdmin: state.user?.role === "ADMIN",
      login,
      register,
      logout,
      updateUser,
    }),
    [state, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
