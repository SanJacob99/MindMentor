import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
  isLoggedIn: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem("auth_token");
        setToken(t);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (newToken: string) => {
    await AsyncStorage.setItem("auth_token", newToken);
    setToken(newToken);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn: !!token, token, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
