import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

  return (
    <Provider store={store}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </Provider>
  );
}
