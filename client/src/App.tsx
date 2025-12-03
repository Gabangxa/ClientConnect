import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ClientPortal from "@/pages/client-portal";
import CreateProject from "@/pages/create-project";
import FreelancerClientView from "@/pages/freelancer-client-view";
import Templates from "@/pages/templates";
import Analytics from "@/pages/analytics";
import Header from "@/components/Header";
import PageTransition from "@/components/PageTransition";
import ErrorBoundary from "@/components/error-boundary";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Show header only for authenticated users */}
      {isAuthenticated && <Header />}

      {/* Main content with page transitions */}
      <main className={isAuthenticated ? "px-4 py-6 max-w-7xl mx-auto" : ""}>
        <PageTransition>
          <Switch>
            {/* Client portal route - accessible without auth */}
            <Route path="/client/:shareToken" component={ClientPortal} />
            
            {isLoading || !isAuthenticated ? (
              <>
                <Route path="/" component={Landing} />
                <Route path="/dashboard" component={Landing} />
                <Route path="/create-project" component={Landing} />
                <Route path="/project/:projectId" component={Landing} />
              </>
            ) : (
              <>
                <Route path="/" component={Dashboard} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/templates" component={Templates} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/create-project" component={CreateProject} />
                <Route path="/project/:projectId" component={FreelancerClientView} />
                <Route path="/project/:projectId/client-view" component={FreelancerClientView} />
              </>
            )}
            <Route component={NotFound} />
          </Switch>
        </PageTransition>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
