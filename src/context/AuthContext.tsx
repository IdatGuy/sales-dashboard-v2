import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { User } from "../types";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSession: (session: Session) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem("currentUser");
      if (savedUser) {
        // Confirm the Supabase session is still active before trusting localStorage
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(JSON.parse(savedUser));
        } else {
          // Supabase session expired/missing — clear our cached user too
          localStorage.removeItem("currentUser");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const buildUserFromSupabase = async (userId: string, email: string): Promise<User> => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (profileError || !profile) {
      throw new Error(
        "No profile found for this user. Please contact an administrator."
      );
    }

    const { data: accessRows, error: accessError } = await supabase
      .from("user_store_access")
      .select("store_id")
      .eq("user_id", userId);
    if (accessError) {
      throw new Error("Error fetching store access.");
    }
    if (!accessRows || accessRows.length === 0) {
      throw new Error(
        "No store access found for this user. Please contact an administrator."
      );
    }

    const userStoreAccess = accessRows.map((row: { store_id: string }) => ({
      userId,
      storeId: row.store_id,
    }));

    return {
      id: userId,
      name: profile.username,
      email,
      role: profile.role,
      userStoreAccess,
    };
  };

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Clear any existing session before authenticating to prevent session leaks
      await supabase.auth.signOut();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.user) {
        throw new Error("Invalid email or password");
      }

      const user = await buildUserFromSupabase(authData.user.id, email);
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithSession = async (session: Session): Promise<void> => {
    setLoading(true);
    try {
      const { user } = session;
      if (!user) throw new Error("No user in session");
      const appUser = await buildUserFromSupabase(user.id, user.email ?? "");
      setCurrentUser(appUser);
      localStorage.setItem("currentUser", JSON.stringify(appUser));
    } catch (error) {
      console.error("loginWithSession error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  const value = {
    currentUser,
    loading,
    login,
    loginWithSession,
    logout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
