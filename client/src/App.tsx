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
import Header from "@/components/Header";
import PageTransition from "@/components/PageTransition";
import ClientView from "@/pages/ClientView";

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
            {/* Client portal routes - accessible without auth */}
            <Route path="/client/:shareToken" component={ClientPortal} />
            <Route path="/client/:token" component={ClientView} />
            
            {isLoading || !isAuthenticated ? (
              <Route path="/" component={Landing} />
            ) : (
              <>
                <Route path="/" component={Dashboard} />
                <Route path="/create-project" component={CreateProject} />
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
