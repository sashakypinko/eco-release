import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import ReleasesListPage from "@/features/releases/ReleasesListPage";
import ReleaseDetailPage from "@/features/releases/ReleaseDetailPage";
import ReleaseFormPage from "@/features/releases/ReleaseFormPage";
import HistoryFormPage from "@/features/releases/HistoryFormPage";
import TemplatesPage from "@/features/templates/TemplatesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ReleasesListPage} />
      <Route path="/releases/new" component={ReleaseFormPage} />
      <Route path="/releases/:id/edit" component={ReleaseFormPage} />
      <Route path="/releases/:id/history/new" component={HistoryFormPage} />
      <Route path="/releases/:id/history/:historyId/edit" component={HistoryFormPage} />
      <Route path="/releases/:id" component={ReleaseDetailPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export function AppContent() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<{ path?: string }>;
      const path = customEvent.detail?.path;
      if (path) {
        setLocation(path);
      }
    };

    window.addEventListener("releaseManagerNavigate", handleNavigate);
    return () => window.removeEventListener("releaseManagerNavigate", handleNavigate);
  }, [setLocation]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <Provider store={store}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <header className="flex items-center justify-between gap-4 p-2 border-b sticky top-0 z-50 bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </Provider>
  );
}
