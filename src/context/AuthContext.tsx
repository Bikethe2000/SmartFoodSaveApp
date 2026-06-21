import React, { createContext, useContext, useEffect, useState } from "react";

import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "../firebase";

import { View, ActivityIndicator } from "react-native";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => void;
}


const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthContext] Initializing Firebase auth...");
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("[AuthContext] Auth state changed:", firebaseUser?.email ?? "not authenticated");
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsub;
  }, []);

  const logout = () => {
    signOut(auth).catch(() => {
      // no-op
    });
  };


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
