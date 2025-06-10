import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";
import { mockUsers, mockUserStoreAccess } from "../data/mockData";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
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

  const login = async (email: string): Promise<void> => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll use mock data
      const user = mockUsers.find((u) => u.email === email);
      if (!user) {
        throw new Error("Invalid email or password");
      }
      // Attach userStoreAccess
      const userWithAccess = {
        ...user,
        userStoreAccess: mockUserStoreAccess.filter(
          (a) => a.userId === user.id
        ),
      };
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentUser(userWithAccess);
      localStorage.setItem("currentUser", JSON.stringify(userWithAccess));
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
