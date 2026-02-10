import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useEffect, useCallback, ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ContainerProvider, useContainer } from "@/providers/ContainerProvider";
import NotFound from "@/pages/not-found";
import ReleasesListPage from "@/features/releases/ReleasesListPage";
import ReleaseDetailPage from "@/features/releases/ReleaseDetailPage";
import ReleaseFormPage from "@/features/releases/ReleaseFormPage";
import HistoryFormPage from "@/features/releases/HistoryFormPage";
import TemplatesPage from "@/features/templates/TemplatesPage";

export function AppRoutes() {
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

function NavigationListener() {
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

  return null;
}

interface AppContentProps {
  hashRouting?: boolean;
  standalone?: boolean;
  children?: ReactNode;
}

function AppContentInner({ hashRouting = false, children }: AppContentProps) {
  const { setContainer } = useContainer();

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, [setContainer]);

  return (
    <div ref={containerRef} className="eco-release-manager" style={{ position: "relative" }}>
      <Provider store={store}>
        <TooltipProvider>
          <Router hook={hashRouting ? useHashLocation : undefined}>
            <NavigationListener />
            {children || <AppRoutes />}
          </Router>
          <Toaster />
        </TooltipProvider>
      </Provider>
    </div>
  );
}

export function AppContent({ hashRouting = false, standalone = false, children }: AppContentProps) {
  return (
    <ContainerProvider>
      <AppContentInner hashRouting={hashRouting} standalone={standalone}>
        {children}
      </AppContentInner>
    </ContainerProvider>
  );
}
