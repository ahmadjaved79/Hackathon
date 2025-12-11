import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Invigilators from "./pages/Invigilators";
import DatabaseManagement from "./pages/DatabaseManagement";
import SmartShalaLogin from "./pages/smartshala/Login";
import DataEntry from "./pages/smartshala/DataEntry";
import AdminDashboard from "./pages/smartshala/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/exam-seating" element={<Index />} />
          <Route path="/invigilators" element={<Invigilators />} />
          <Route path="/database" element={<DatabaseManagement />} />
          <Route path="/smartshala/login" element={<SmartShalaLogin />} />
          <Route path="/smartshala/data-entry" element={<DataEntry />} />
          <Route path="/smartshala/admin" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
