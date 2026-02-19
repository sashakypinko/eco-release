import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import './index.css';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ReleasesListPage from "@/features/releases/ReleasesListPage";
import ReleaseDetailPage from "@/features/releases/ReleaseDetailPage";
import TemplatesPage from "@/features/templates/TemplatesPage";

function Routes() {
  return (
    <Switch>
      <Route path="/" component={ReleasesListPage} />
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
}

export function AppContent({ hashRouting = false }: AppContentProps) {
  return (
    <Provider store={store}>
      <TooltipProvider>
        <Router hook={hashRouting ? useHashLocation : undefined}>
          <NavigationListener />
          <Routes />
        </Router>
        <Toaster />
      </TooltipProvider>
    </Provider>
  );
}
