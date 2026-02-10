import { createContext, useContext, ReactNode } from "react";
import type { AuthContext as AuthContextType, UserDTO } from "../types/contracts";

interface AuthContextValue {
  user: UserDTO | null;
  userId: string;
  permissions: string[];
  isAuthenticated: boolean;
  navigate: (path: string) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  auth?: AuthContextType | null;
  navigate?: (path: string) => void;
}

export function AuthProvider({ children, auth, navigate }: AuthProviderProps) {
  const permissions = auth?.permissions || [];
  const hasExplicitPermissions = Array.isArray(auth?.permissions) && auth.permissions.length > 0;

  const value: AuthContextValue = {
    user: auth?.user || null,
    userId: auth?.userId || auth?.user?.id?.toString() || "",
    permissions,
    isAuthenticated: auth?.isAuthenticated || false,
    navigate: navigate || ((path: string) => console.warn("Navigate not provided:", path)),
    hasPermission: (permission: string) => hasExplicitPermissions ? permissions.includes(permission) : true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
