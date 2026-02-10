import { createRoot, Root } from "react-dom/client";
import type { RemoteApp, RemoteAppProps } from "./types/contracts";
import { ApiProvider } from "./providers/ApiProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { AppContent } from "./AppContent";
import "./index.css";

let root: Root | null = null;

const App: RemoteApp = {
  mount: (container: HTMLElement, props: RemoteAppProps) => {
    const auth = props?.auth || {
      userId: "",
      user: null,
      permissions: [],
      isAuthenticated: false,
    };
    const navigate = props?.navigate || ((path: string) => console.warn("Navigate not provided:", path));
    const apiBaseUrl = props?.apiBaseUrl || "/api";

    root = createRoot(container);
    root.render(
      <ApiProvider baseUrl={apiBaseUrl} token={auth.token} permissions={auth.permissions}>
        <AuthProvider auth={auth} navigate={navigate}>
          <AppContent />
        </AuthProvider>
      </ApiProvider>
    );
  },

  unmount: (_container: HTMLElement) => {
    if (root) {
      root.unmount();
      root = null;
    }
  },
};

export default App;
