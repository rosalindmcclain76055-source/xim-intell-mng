import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/app/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/app/Dashboard";
import Sources from "./pages/app/Sources";
import Watchlists from "./pages/app/Watchlists";
import Queue from "./pages/app/Queue";
import Drafts from "./pages/app/Drafts";
import Published from "./pages/app/Published";
import Personas from "./pages/app/Personas";
import Accounts from "./pages/app/Accounts";
import Analytics from "./pages/app/Analytics";
import AuditLogs from "./pages/app/AuditLogs";
import SettingsPage from "./pages/app/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="sources" element={<Sources />} />
                  <Route path="watchlists" element={<Watchlists />} />
                  <Route path="queue" element={<Queue />} />
                  <Route path="drafts" element={<Drafts />} />
                  <Route path="published" element={<Published />} />
                  <Route path="personas" element={<Personas />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="audit" element={<AuditLogs />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
