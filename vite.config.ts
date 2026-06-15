import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Fallbacks usados quando não há .env (ex.: build do Lovable a partir do GitHub,
// onde .env.local não existe). A anon key é pública por design (vai pro bundle);
// a proteção dos dados é feita pelo RLS no Supabase.
const fallbackSupabaseUrl = "https://supabase.paineldev.org";
const fallbackSupabasePublishableKey =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MTUzMjEyMCwiZXhwIjo0OTM3MjA1NzIwLCJyb2xlIjoiYW5vbiJ9.XRCQh5p0-c5TrFrq2K-WPywMXeF0uUGR64guE6x2VYM";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega .env, .env.local, .env.[mode] (prefixo "" = todas as vars, não só VITE_*)
  // e mescla com as variáveis reais do shell. Sem isto, o `define` abaixo leria
  // apenas process.env e ignoraria silenciosamente o .env.local.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL ?? fallbackSupabaseUrl
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY ?? fallbackSupabasePublishableKey
      ),
    },
  };
});
