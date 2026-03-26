import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import Layout from "@/components/Layout";
import Landing from "./pages/Landing";
import ClientDashboard from "./pages/ClientDashboard";
import BookingPage from "./pages/BookingPage";
import MyPetsPage from "./pages/MyPetsPage";
import PetDetailPage from "./pages/PetDetailPage";
import ChatPage from "./pages/ChatPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";

import AdminDashboard from "./pages/AdminDashboard";
import AdminAppointments from "./pages/AdminAppointments";
import AdminClients from "./pages/AdminClients";
import AdminServicesPage from "./pages/AdminServicesPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import ServicesPage from "./pages/ServicesPage";
import SalonInfoPage from "./pages/SalonInfoPage";
import AuthPage from "./pages/AuthPage";
import PrivacyPage from "./pages/PrivacyPage";
import NotFound from "./pages/NotFound";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedClientRoute from "./components/ProtectedClientRoute";
import { useRealtimeSync } from "./hooks/useRealtimeSync";
import { useThemeColor } from "./hooks/useThemeColor";

const queryClient = new QueryClient();

const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  useRealtimeSync();
  useThemeColor();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RoleProvider>
        <RealtimeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<ProtectedClientRoute><Layout><ClientDashboard /></Layout></ProtectedClientRoute>} />
              <Route path="/booking" element={<ProtectedClientRoute><Layout><BookingPage /></Layout></ProtectedClientRoute>} />
              <Route path="/my-pets" element={<ProtectedClientRoute><Layout><MyPetsPage /></Layout></ProtectedClientRoute>} />
              <Route path="/pets/:id" element={<ProtectedClientRoute><Layout><PetDetailPage /></Layout></ProtectedClientRoute>} />
              <Route path="/services" element={<Layout><ServicesPage /></Layout>} />
              <Route path="/chat" element={<ProtectedClientRoute><Layout><ChatPage /></Layout></ProtectedClientRoute>} />
              <Route path="/payments" element={<ProtectedClientRoute><Layout><PaymentsPage /></Layout></ProtectedClientRoute>} />
              <Route path="/payment-success" element={<ProtectedClientRoute><Layout><PaymentSuccessPage /></Layout></ProtectedClientRoute>} />
              <Route path="/payment-cancel" element={<ProtectedClientRoute><Layout><PaymentCancelPage /></Layout></ProtectedClientRoute>} />
              <Route path="/salon-info" element={<Layout><SalonInfoPage /></Layout>} />
              <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
              
              {/* Admin routes — secret path */}
              <Route path="/admin-portal-onix" element={<ProtectedAdminRoute><Layout><AdminDashboard /></Layout></ProtectedAdminRoute>} />
              <Route path="/admin-portal-onix/appointments" element={<ProtectedAdminRoute><Layout><AdminAppointments /></Layout></ProtectedAdminRoute>} />
              <Route path="/admin-portal-onix/services" element={<ProtectedAdminRoute><Layout><AdminServicesPage /></Layout></ProtectedAdminRoute>} />
              <Route path="/admin-portal-onix/clients" element={<ProtectedAdminRoute><Layout><AdminClients /></Layout></ProtectedAdminRoute>} />
              <Route path="/admin-portal-onix/settings" element={<ProtectedAdminRoute><Layout><AdminSettingsPage /></Layout></ProtectedAdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RealtimeProvider>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
