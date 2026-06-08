import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, ChevronDown } from "lucide-react";
import { useAuthStore, type GoogleAdsCustomer } from "@/store/useAuthStore";
import { useProfile } from "@/hooks/useProfile";
import { useIntegrationsSync } from "@/hooks/useIntegrationsSync";
import { supabase } from "@/integrations/supabase/client";
import { getCustomerClients } from "@/lib/google-ads/customers";

export function AppLayout() {
  const { selectedCustomer, loginCustomerId, setSelectedCustomer, logout } = useAuthStore();
  useProfile();
  useIntegrationsSync();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [childAccounts, setChildAccounts] = useState<GoogleAdsCustomer[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });
  }, []);

  // ALWAYS refresh token on mount — guarantees valid token before any API call
  useEffect(() => {
    let cancelled = false;
    async function ensureToken() {
      const hasCloudRun = !!localStorage.getItem("cloud_run_url");
      const hasRefreshToken = !!localStorage.getItem("gads_refresh_token");

      if (hasCloudRun && hasRefreshToken) {
        try {
          const { refreshAccessToken } = await import("@/lib/google-ads/googleAdsClient");
          await refreshAccessToken();
        } catch (err) {
          console.warn("[AppLayout] Token refresh failed:", err);
        }
      }
      if (!cancelled) setTokenReady(true);
    }
    ensureToken();
    return () => { cancelled = true; };
  }, []);

  // Load child accounts when MCC is set — wait for token first
  useEffect(() => {
    if (!tokenReady) return;
    const mcc = loginCustomerId?.replace(/-/g, "");
    if (!mcc) return;
    setLoadingAccounts(true);
    getCustomerClients(mcc)
      .then((clients) => {
        const ads = clients.filter((c) => !c.manager);
        setChildAccounts(ads);
      })
      .catch(() => setChildAccounts([]))
      .finally(() => setLoadingAccounts(false));
  }, [loginCustomerId]);

  const handleSwitchAccount = (accountId: string) => {
    const account = childAccounts.find((c) => c.id === accountId);
    if (account) {
      setSelectedCustomer(account);
      localStorage.setItem("gads_customer", JSON.stringify(account));
    }
  };

  const location = useLocation();

  return (
    <SidebarProvider>
      
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/60 px-4 glass sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              {selectedCustomer && childAccounts.length > 1 ? (
                <Select value={selectedCustomer.id} onValueChange={handleSwitchAccount}>
                  <SelectTrigger className="hidden sm:flex h-8 w-auto max-w-[250px] gap-2 rounded-lg border-success/20 bg-success/5 text-xs font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shrink-0" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {childAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.descriptiveName || "Sem nome"} ({acc.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selectedCustomer ? (
                <div className="hidden sm:flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shrink-0" />
                  <span className="text-xs font-medium text-foreground/70 truncate max-w-[200px]">
                    {selectedCustomer.descriptiveName || selectedCustomer.id}
                  </span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span className="text-xs text-muted-foreground">Nao conectado</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {userEmail && (
                <span className="text-xs text-muted-foreground hidden md:inline px-2 py-1 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-default">
                  {userEmail}
                </span>
              )}
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={logout} title="Sair" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {!tokenReady ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
