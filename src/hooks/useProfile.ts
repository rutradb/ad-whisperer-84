import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/database";
import { useAuthStore } from "@/store/useAuthStore";

interface ProfileUpdate {
  cloud_run_url?: string | null;
  google_ads_access_token?: string | null;
  google_ads_refresh_token?: string | null;
  google_ads_developer_token?: string | null;
  google_ads_client_id?: string | null;
  google_ads_client_secret?: string | null;
  google_ads_customer_json?: Record<string, any> | null;
  google_ads_customer_id?: string | null;
  google_ads_login_customer_id?: string | null;
  anthropic_api_key?: string | null;
  onboarding_completed?: boolean;
}

async function ensureProfile(userId: string, email: string | null): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as Profile | null;
}

async function fetchProfile(): Promise<Profile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user.id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error && (error.code === "PGRST116" || error.code === "PGRST205")) {
    return ensureProfile(session.user.id, session.user.email ?? null);
  }
  if (error) throw error;
  return data as unknown as Profile | null;
}

async function updateProfile(updates: ProfileUpdate): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user.id) throw new Error("N\u00e3o autenticado");

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", session.user.id);

  if (error) throw error;
}

export function useProfile() {
  const queryClient = useQueryClient();
  const { setCloudRunUrl, setSelectedCustomer, setAnthropicApiKey, setGoogleAdsCredentials } = useAuthStore();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  // Sync profile data to localStorage + Zustand when loaded
  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;

    // Sync Cloud Run URL
    if (profile.cloud_run_url) {
      setCloudRunUrl(profile.cloud_run_url);
    }

    // Sync Google Ads tokens
    if (profile.google_ads_access_token) {
      setGoogleAdsCredentials({
        accessToken: profile.google_ads_access_token,
        refreshToken: profile.google_ads_refresh_token || "",
        loginCustomerId: profile.google_ads_login_customer_id || undefined,
      });
    }

    if (profile.google_ads_customer_json) {
      localStorage.setItem("gads_customer", JSON.stringify(profile.google_ads_customer_json));
      setSelectedCustomer(profile.google_ads_customer_json as any);
    }

    if (profile.anthropic_api_key) {
      localStorage.setItem("anthropic_api_key", profile.anthropic_api_key);
      setAnthropicApiKey(profile.anthropic_api_key);
    }
  }, [profileQuery.data, setGoogleAdsCredentials, setSelectedCustomer, setAnthropicApiKey]);

  const saveProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    saveProfile: saveProfileMutation.mutateAsync,
    isSaving: saveProfileMutation.isPending,
  };
}
