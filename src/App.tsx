// Ad Manager Hub - Main App
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "./components/AppLayout";
import { AuthGuard } from "./components/AuthGuard";
import { OnboardingGuard } from "./components/OnboardingGuard";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage"));
const CampaignDetailPage = lazy(() => import("./pages/CampaignDetailPage"));
const CampaignCreatePage = lazy(() => import("./pages/CampaignCreatePage"));
const CampaignEditPage = lazy(() => import("./pages/CampaignEditPage"));
const AdSetsPage = lazy(() => import("./pages/AdSetsPage"));
const AdSetDetailPage = lazy(() => import("./pages/AdSetDetailPage"));
const AdSetCreatePage = lazy(() => import("./pages/AdSetCreatePage"));
const AdSetEditPage = lazy(() => import("./pages/AdSetEditPage"));
const AdsPage = lazy(() => import("./pages/AdsPage"));
const AdDetailPage = lazy(() => import("./pages/AdDetailPage"));
const AdCreatePage = lazy(() => import("./pages/AdCreatePage"));
const AdEditPage = lazy(() => import("./pages/AdEditPage"));
const KeywordsPage = lazy(() => import("./pages/KeywordsPage"));
// RecommendationsPage removida — funcionalidade disponível no Agente Auditor
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const MediaPage = lazy(() => import("./pages/MediaPage"));
const AudiencesPage = lazy(() => import("./pages/AudiencesPage"));
const TargetingExplorerPage = lazy(() => import("./pages/TargetingExplorerPage"));
const CreativesPage = lazy(() => import("./pages/CreativesPage"));
const CreativeCreatePage = lazy(() => import("./pages/CreativeCreatePage"));
const CreativeEditPage = lazy(() => import("./pages/CreativeEditPage"));
const ScaleCalculatorPage = lazy(() => import("./pages/ScaleCalculatorPage"));
const OptimizerPage = lazy(() => import("./pages/OptimizerPage"));
const DiagnosticPage = lazy(() => import("./pages/DiagnosticPage"));
const StrategicScanPage = lazy(() => import("./pages/StrategicScanPage"));
const AICopyGeneratorPage = lazy(() => import("./pages/AICopyGeneratorPage"));
const ActivityLogPage = lazy(() => import("./pages/ActivityLogPage"));
const AutomatedRulesPage = lazy(() => import("./pages/AutomatedRulesPage"));
const BusinessContextPage = lazy(() => import("./pages/BusinessContextPage"));
const ABTestPage = lazy(() => import("./pages/ABTestPage"));
const AgentPage = lazy(() => import("./pages/AgentPage"));
const PixelsPage = lazy(() => import("./pages/PixelsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const CRMPage = lazy(() => import("./pages/CRMPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Retry up to 3 times, with extra retries for auth errors (token refresh)
        if (failureCount >= 3) return false;
        const isAuthError = (error as any)?.status === 401 || (error as any)?.isAuthError;
        if (isAuthError && failureCount < 2) return true;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/onboarding" element={<AuthGuard><OnboardingPage /></AuthGuard>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<AuthGuard><OnboardingGuard><AppLayout /></OnboardingGuard></AuthGuard>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/campaigns/new" element={<CampaignCreatePage />} />
                <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
                <Route path="/campaigns/:id/edit" element={<CampaignEditPage />} />
                {/* Ad Groups (formerly Ad Sets) */}
                <Route path="/adsets" element={<AdSetsPage />} />
                <Route path="/adsets/new" element={<AdSetCreatePage />} />
                <Route path="/adsets/:id" element={<AdSetDetailPage />} />
                <Route path="/adsets/:id/edit" element={<AdSetEditPage />} />
                {/* Ads */}
                <Route path="/ads" element={<AdsPage />} />
                <Route path="/ads/new" element={<AdCreatePage />} />
                <Route path="/ads/:id" element={<AdDetailPage />} />
                <Route path="/ads/:id/edit" element={<AdEditPage />} />
                {/* Assets (redirects from /creatives and /media) */}
                <Route path="/creatives" element={<CreativesPage />} />
                <Route path="/creatives/new" element={<CreativeCreatePage />} />
                <Route path="/creatives/:id/edit" element={<CreativeEditPage />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/assets" element={<Navigate to="/media" replace />} />
                {/* Keywords */}
                <Route path="/keywords" element={<KeywordsPage />} />
                {/* Audiences & Targeting */}
                <Route path="/audiences" element={<AudiencesPage />} />
                <Route path="/targeting" element={<TargetingExplorerPage />} />
                {/* Activity */}
                <Route path="/activity" element={<ActivityLogPage />} />
                {/* AI & Automation */}
                <Route path="/ai/optimizer" element={<OptimizerPage />} />
                <Route path="/ai/diagnostic" element={<DiagnosticPage />} />
                <Route path="/ai/strategic-scan" element={<StrategicScanPage />} />
                <Route path="/ai/scale-calculator" element={<ScaleCalculatorPage />} />
                <Route path="/ai/copy-generator" element={<AICopyGeneratorPage />} />
                <Route path="/ai/rules" element={<AutomatedRulesPage />} />
                <Route path="/ai/strategy" element={<BusinessContextPage />} />
                <Route path="/ai/ab-test" element={<ABTestPage />} />
                <Route path="/ai/agent" element={<AgentPage />} />
                {/* Conversions (redirect from /pixels) */}
                <Route path="/pixels" element={<PixelsPage />} />
                <Route path="/conversions" element={<Navigate to="/pixels" replace />} />
                {/* Other */}
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/crm" element={<CRMPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
