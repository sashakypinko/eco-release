import { createRoot } from "react-dom/client";
import { ApiProvider } from "./providers/ApiProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { AppContent } from "./AppContent";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { fetchRuntimeConfig } from "./config/runtime-config";
import "./index.css";

const mockAuth = {
  userId: "1",
  user: {
    id: 1,
    email: "dev@ecohost.com",
    firstName: "Dev",
    lastName: "User",
    isActive: true,
    roleId: 1,
  },
  token: "dev-token",
  isAuthenticated: true,
  permissions: [],
};

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

async function main() {
  const config = await fetchRuntimeConfig();

  const mockProps = {
    auth: mockAuth,
    navigate: (path: string) => console.log("Navigate to:", path),
    apiBaseUrl: config.apiBaseUrl,
  };

  function StandaloneApp() {
    return (
      <ApiProvider baseUrl={mockProps.apiBaseUrl} token={mockProps.auth.token} permissions={mockProps.auth.permissions}>
        <AuthProvider auth={mockProps.auth} navigate={mockProps.navigate}>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between gap-4 p-2 border-b sticky top-0 z-50 bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <AppContent />
                </main>
              </div>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </ApiProvider>
    );
  }

  const container = document.getElementById("root")!;
  const root = createRoot(container);
  root.render(<StandaloneApp />);
}

main();
