import { createContext, useContext, ReactNode, useEffect } from "react";
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
