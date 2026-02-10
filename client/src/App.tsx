import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import ReleasesListPage from "@/pages/releases-list";
import ReleaseDetailPage from "@/pages/release-detail";
import ReleaseFormPage from "@/pages/release-form";
import HistoryFormPage from "@/pages/history-form";
import TemplatesListPage from "@/pages/templates-list";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ReleasesListPage} />
      <Route path="/releases/new" component={ReleaseFormPage} />
      <Route path="/releases/:id/edit" component={ReleaseFormPage} />
      <Route path="/releases/:id/history/new" component={HistoryFormPage} />
      <Route path="/releases/:id/history/:historyId/edit" component={HistoryFormPage} />
      <Route path="/releases/:id" component={ReleaseDetailPage} />
      <Route path="/templates" component={TemplatesListPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
