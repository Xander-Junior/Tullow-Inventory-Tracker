// client/src/App.tsx
// Main entry point for the React frontend application.
// Sets up global providers, routing, and the main app layout.

import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import IssuanceLogs from "@/pages/issuance-logs";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

/**
 * Defines the main application routes.
 * Uses ProtectedRoute for authenticated pages.
 */
function Router() {
  return (
    <Switch>
      {/* Dashboard and logs require authentication */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/logs" component={IssuanceLogs} />
      {/* Auth and fallback routes */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Main App component.
 * Wraps the app in QueryClientProvider (for React Query) and AuthProvider (for user context).
 * Renders the router and global toaster for notifications.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;