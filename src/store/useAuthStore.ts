import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { GoogleAdsCustomer } from '@/lib/google-ads/types';

export type { GoogleAdsCustomer };

interface AuthState {
  cloudRunUrl: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  loginCustomerId: string | null;
  selectedCustomer: GoogleAdsCustomer | null;
  anthropicApiKey: string | null;
  setCloudRunUrl: (url: string) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setLoginCustomerId: (id: string) => void;
  setSelectedCustomer: (customer: GoogleAdsCustomer) => void;
  setAnthropicApiKey: (key: string) => void;
  clearAnthropicApiKey: () => void;
  setOAuthTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    loginCustomerId?: string;
  }) => void;
  clearGoogleAdsConnection: () => void;
  // Legacy compat
  setGoogleAdsCredentials: (creds: {
    accessToken: string;
    refreshToken?: string;
    developerToken?: string;
    clientId?: string;
    clientSecret?: string;
    loginCustomerId?: string;
    tokenExpiry?: number;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  cloudRunUrl: localStorage.getItem('cloud_run_url'),
  accessToken: localStorage.getItem('gads_access_token'),
  refreshToken: localStorage.getItem('gads_refresh_token'),
  loginCustomerId: localStorage.getItem('gads_login_customer_id'),
  selectedCustomer: JSON.parse(localStorage.getItem('gads_customer') || 'null'),
  anthropicApiKey: localStorage.getItem('anthropic_api_key'),

  setCloudRunUrl: (url) => {
    localStorage.setItem('cloud_run_url', url.replace(/\/$/, ''));
    set({ cloudRunUrl: url.replace(/\/$/, '') });
  },
  setAccessToken: (token) => {
    localStorage.setItem('gads_access_token', token);
    set({ accessToken: token });
  },
  setRefreshToken: (token) => {
    localStorage.setItem('gads_refresh_token', token);
    set({ refreshToken: token });
  },
  setLoginCustomerId: (id) => {
    localStorage.setItem('gads_login_customer_id', id);
    set({ loginCustomerId: id });
  },
  setSelectedCustomer: (customer) => {
    localStorage.setItem('gads_customer', JSON.stringify(customer));
    set({ selectedCustomer: customer });
  },
  setAnthropicApiKey: (key) => {
    localStorage.setItem('anthropic_api_key', key);
    set({ anthropicApiKey: key });
  },
  clearAnthropicApiKey: () => {
    localStorage.removeItem('anthropic_api_key');
    set({ anthropicApiKey: null });
  },
  setOAuthTokens: (tokens) => {
    localStorage.setItem('gads_access_token', tokens.accessToken);
    localStorage.setItem('gads_refresh_token', tokens.refreshToken);
    localStorage.setItem('gads_token_expiry', String(Date.now() + tokens.expiresIn * 1000));
    if (tokens.loginCustomerId) {
      localStorage.setItem('gads_login_customer_id', tokens.loginCustomerId);
    }
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      loginCustomerId: tokens.loginCustomerId || null,
    });
  },
  setGoogleAdsCredentials: (creds) => {
    localStorage.setItem('gads_access_token', creds.accessToken);
    if (creds.refreshToken) localStorage.setItem('gads_refresh_token', creds.refreshToken);
    if (creds.loginCustomerId) localStorage.setItem('gads_login_customer_id', creds.loginCustomerId);
    if (creds.tokenExpiry) localStorage.setItem('gads_token_expiry', String(creds.tokenExpiry));
    set({
      accessToken: creds.accessToken,
      refreshToken: creds.refreshToken || null,
      loginCustomerId: creds.loginCustomerId || null,
    });
  },
  clearGoogleAdsConnection: () => {
    localStorage.removeItem('gads_access_token');
    localStorage.removeItem('gads_refresh_token');
    localStorage.removeItem('gads_login_customer_id');
    localStorage.removeItem('gads_customer');
    localStorage.removeItem('gads_token_expiry');
    set({
      accessToken: null,
      refreshToken: null,
      loginCustomerId: null,
      selectedCustomer: null,
    });
  },
  logout: () => {
    localStorage.removeItem('cloud_run_url');
    localStorage.removeItem('gads_access_token');
    localStorage.removeItem('gads_refresh_token');
    localStorage.removeItem('gads_login_customer_id');
    localStorage.removeItem('gads_customer');
    localStorage.removeItem('gads_token_expiry');
    localStorage.removeItem('anthropic_api_key');
    set({
      cloudRunUrl: null,
      accessToken: null,
      refreshToken: null,
      loginCustomerId: null,
      selectedCustomer: null,
      anthropicApiKey: null,
    });
    supabase.auth.signOut();
  },
}));
