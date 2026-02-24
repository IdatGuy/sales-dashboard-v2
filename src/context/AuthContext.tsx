import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { User } from "../types";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Clear any existing session before authenticating to prevent session leaks
      await supabase.auth.signOut();

      // 1. Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.user) {
        throw new Error("Invalid email or password");
      }
      const userId = authData.user.id;

      // 2. Fetch profile
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

      // 3. Fetch store access (just user_id and store_id)
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

      // 4. Build userStoreAccess array (no accessLevel)
      const userStoreAccess = accessRows.map((row: { store_id: string }) => ({
        userId,
        storeId: row.store_id,
      }));

      // 5. Build User object
      const user: User = {
        id: userId,
        name: profile.username,
        email: email,
        role: profile.role,
        userStoreAccess,
      };

      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
    } catch (error) {
      console.error("Login error:", error);
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
    logout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
