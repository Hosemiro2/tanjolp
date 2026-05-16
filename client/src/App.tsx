import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DanyaStudio from "./pages/DanyaStudio";
import Privacidade from "./pages/Privacidade";
import AdminLogin from "./pages/AdminLogin";
import AdminLeads from "./pages/AdminLeads";
import AdminLeadDetail from "./pages/AdminLeadDetail";
import { WhatsAppFAB } from "./components/WhatsAppFAB";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/studio" component={DanyaStudio} />
      <Route path="/politica-de-privacidade" component={Privacidade} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/lead/:id" component={AdminLeadDetail} />
      <Route path="/admin" component={AdminLeads} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
          <WhatsAppFAB />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
