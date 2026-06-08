import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BarChart3, User, Lock, Mail } from "lucide-react";

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (msg.includes("Unable to validate email")) return "E-mail inválido.";
  return msg;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: translateError(error.message), variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: signupEmail, password: signupPassword });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar conta", description: translateError(error.message), variant: "destructive" });
    } else {
      toast({ title: "Conta criada com sucesso!", description: "Você já pode fazer login." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background gap-6">
      <style>{`
        .auth-container {
          position: relative;
          width: 100%;
          max-width: 850px;
          height: 580px;
          background: hsl(var(--card));
          border-radius: 1.5rem;
          box-shadow: var(--shadow-elevation-4, 0 25px 50px -12px hsl(var(--foreground) / 0.25));
          overflow: hidden;
          border: 1px solid hsl(var(--border));
        }

        .auth-container h2 {
          font-size: 2rem;
          font-weight: 700;
          margin: -0.5rem 0 0;
          color: hsl(var(--foreground));
          letter-spacing: -0.025em;
        }

        .auth-container p {
          font-size: 0.9rem;
          margin: 0.75rem 0;
          color: hsl(var(--muted-foreground));
        }

        .auth-form-box {
          position: absolute;
          right: 0;
          width: 50%;
          height: 100%;
          background: hsl(var(--card));
          display: flex;
          align-items: center;
          color: hsl(var(--foreground));
          text-align: center;
          padding: 2.5rem;
          z-index: 1;
          transition: 0.6s ease-in-out 1.2s, visibility 0s 1s;
        }

        .auth-container.active .auth-form-box {
          right: 50%;
        }

        .auth-form-box.register {
          visibility: hidden;
        }

        .auth-container.active .auth-form-box.register {
          visibility: visible;
        }

        .auth-input-box {
          position: relative;
          margin: 1.25rem 0;
        }

        .auth-input-box input {
          width: 100%;
          padding: 0.85rem 3rem 0.85rem 1.25rem;
          background: hsl(var(--muted));
          border-radius: 0.5rem;
          border: 1px solid transparent;
          outline: none;
          font-size: 0.95rem;
          color: hsl(var(--foreground));
          font-weight: 500;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .auth-input-box input::placeholder {
          color: hsl(var(--muted-foreground));
          font-weight: 400;
        }

        .auth-input-box input:focus {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
        }

        .auth-input-box .auth-input-icon {
          position: absolute;
          right: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }

        .auth-forgot-link {
          margin: -0.5rem 0 1rem;
          text-align: right;
        }

        .auth-forgot-link a {
          font-size: 0.85rem;
          color: hsl(var(--primary));
          text-decoration: none;
        }

        .auth-forgot-link a:hover {
          text-decoration: underline;
        }

        .auth-btn {
          width: 100%;
          height: 3rem;
          background: hsl(var(--primary));
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px hsl(var(--primary) / 0.25);
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          color: hsl(var(--primary-foreground));
          font-weight: 600;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.2s, transform 0.1s;
        }

        .auth-btn:hover:not(:disabled) {
          opacity: 0.92;
        }

        .auth-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-toggle-box {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .auth-toggle-box::before {
          content: '';
          position: absolute;
          left: -250%;
          width: 300%;
          height: 100%;
          background: hsl(var(--primary));
          border-radius: 150px;
          z-index: 2;
          transition: 1.8s ease-in-out;
        }

        .auth-container.active .auth-toggle-box::before {
          left: 50%;
        }

        .auth-toggle-panel {
          position: absolute;
          width: 50%;
          height: 100%;
          color: hsl(var(--primary-foreground));
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          z-index: 2;
          transition: 0.6s ease-in-out;
        }

        .auth-toggle-panel h2 {
          color: hsl(var(--primary-foreground));
        }

        .auth-toggle-panel p {
          color: hsl(var(--primary-foreground) / 0.9);
          margin-bottom: 1.25rem;
        }

        .auth-toggle-panel.toggle-left {
          left: 0;
          transition-delay: 1.2s;
        }

        .auth-container.active .auth-toggle-panel.toggle-left {
          left: -50%;
          transition-delay: 0.6s;
        }

        .auth-toggle-panel.toggle-right {
          right: -50%;
          transition-delay: 0.6s;
        }

        .auth-container.active .auth-toggle-panel.toggle-right {
          right: 0;
          transition-delay: 1.2s;
        }

        .auth-toggle-panel .auth-btn {
          width: 10rem;
          background: transparent;
          border: 2px solid hsl(var(--primary-foreground));
          box-shadow: none;
          color: hsl(var(--primary-foreground));
        }

        .auth-toggle-panel .auth-btn:hover {
          background: hsl(var(--primary-foreground) / 0.1);
          opacity: 1;
        }

        @media screen and (max-width: 650px) {
          .auth-container {
            height: calc(100vh - 8rem);
            max-height: 720px;
          }

          .auth-form-box {
            bottom: 0;
            width: 100%;
            height: 70%;
            padding: 1.5rem;
          }

          .auth-container.active .auth-form-box {
            right: 0;
            bottom: 30%;
          }

          .auth-toggle-box::before {
            left: 0;
            top: -270%;
            width: 100%;
            height: 300%;
            border-radius: 20vw;
          }

          .auth-container.active .auth-toggle-box::before {
            left: 0;
            top: 70%;
          }

          .auth-toggle-panel {
            width: 100%;
            height: 30%;
            padding: 1rem;
          }

          .auth-toggle-panel.toggle-left {
            top: 0;
          }

          .auth-container.active .auth-toggle-panel.toggle-left {
            left: 0;
            top: -30%;
          }

          .auth-toggle-panel.toggle-right {
            right: 0;
            bottom: -30%;
          }

          .auth-container.active .auth-toggle-panel.toggle-right {
            bottom: 0;
          }

          .auth-container h2 {
            font-size: 1.5rem;
          }
        }

        @media screen and (max-width: 400px) {
          .auth-form-box {
            padding: 1.25rem;
          }
          .auth-container h2 {
            font-size: 1.35rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Google Ads Manager</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas campanhas com inteligência artificial
        </p>
      </div>

      {/* Animated auth card */}
      <div className={`auth-container ${isActive ? "active" : ""}`}>
        {/* Login form */}
        <div className="auth-form-box login">
          <form onSubmit={handleLogin} className="w-full">
            <h2>Entrar</h2>
            <div className="auth-input-box">
              <input
                type="email"
                placeholder="E-mail"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
              <Mail className="auth-input-icon h-5 w-5" />
            </div>
            <div className="auth-input-box">
              <input
                type="password"
                placeholder="Senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <Lock className="auth-input-icon h-5 w-5" />
            </div>
            <div className="auth-forgot-link">
              <Link to="/forgot-password">Esqueci minha senha</Link>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </button>
          </form>
        </div>

        {/* Register form */}
        <div className="auth-form-box register">
          <form onSubmit={handleSignup} className="w-full">
            <h2>Criar conta</h2>
            <div className="auth-input-box">
              <input
                type="email"
                placeholder="E-mail"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
              <Mail className="auth-input-icon h-5 w-5" />
            </div>
            <div className="auth-input-box">
              <input
                type="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />
              <Lock className="auth-input-icon h-5 w-5" />
            </div>
            <div className="auth-input-box">
              <input
                type="password"
                placeholder="Confirmar senha"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                required
              />
              <User className="auth-input-icon h-5 w-5" />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar conta
            </button>
          </form>
        </div>

        {/* Toggle box */}
        <div className="auth-toggle-box">
          <div className="auth-toggle-panel toggle-left">
            <h2>Olá, bem-vindo!</h2>
            <p>Ainda não tem uma conta?</p>
            <button
              type="button"
              className="auth-btn"
              onClick={() => setIsActive(true)}
            >
              Criar conta
            </button>
          </div>

          <div className="auth-toggle-panel toggle-right">
            <h2>Bem-vindo de volta!</h2>
            <p>Já possui uma conta?</p>
            <button
              type="button"
              className="auth-btn"
              onClick={() => setIsActive(false)}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
