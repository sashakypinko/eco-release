import { createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";

interface ContainerContextValue {
  container: HTMLElement | null;
  setContainer: (el: HTMLElement | null) => void;
}

const ContainerContext = createContext<ContainerContextValue>({
  container: null,
  setContainer: () => {},
});

export function ContainerProvider({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  return (
    <ContainerContext.Provider value={{ container, setContainer }}>
      {children}
    </ContainerContext.Provider>
  );
}

export function useContainer() {
  return useContext(ContainerContext);
}
