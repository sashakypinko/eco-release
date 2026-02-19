import { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { setApiConfig } from "../app/baseQuery";

interface ApiContextValue {
  baseUrl: string;
}

const ApiContext = createContext<ApiContextValue | undefined>(undefined);

interface ApiProviderProps {
  children: ReactNode;
  baseUrl: string;
  token?: string;
  permissions?: string[];
}

export function ApiProvider({ children, baseUrl, token, permissions = [] }: ApiProviderProps) {
  // Set config synchronously on mount so the first render already has the correct values
  const initialized = useRef(false);
  if (!initialized.current) {
    setApiConfig({ baseUrl, token, permissions });
    initialized.current = true;
  }

  // Keep config in sync when props change (e.g. token refresh)
  useEffect(() => {
    setApiConfig({ baseUrl, token, permissions });
  }, [baseUrl, token, permissions]);

  return (
    <ApiContext.Provider value={{ baseUrl }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
}
