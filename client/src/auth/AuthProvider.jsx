import React, { createContext, useContext, useMemo, useEffect, useState } from "react";
import { getMe, login as apiLogin, logout as apiLogout } from "../api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // { username, email, ... }
  const [loading, setLoading] = useState(true);

  // Rehydrate session on refresh (uses httpOnly refresh cookie on your backend)
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe(); // 200 if logged in, 401 otherwise
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Wrap login/logout so pages can call them easily
  const login = async (username, email, password) => {
    const me = await apiLogin(username, email, password);
    setUser(me);
    return me;
  };

  const logout = async () => {
    try { await apiLogout(); } catch {}
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);


  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
