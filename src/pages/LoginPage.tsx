import { useEffect, useState } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const { t } = useTranslation("auth");
  const { login, isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log(import.meta.env.VITE_API_PROXY_TARGET?.trim())

  useEffect(() => {
    document.title = t("login.documentTitle");
  }, [t]);

  if (!isInitializing && isAuthenticated) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError(t("login.errors.missingCredentials"));
      return;
    }
    if (password.length < 8) {
      setError(t("login.errors.passwordTooShort"));
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success(t("login.welcomeBack"));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("login.errors.signInFailed");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="mesh-bg relative hidden flex-col justify-between overflow-hidden bg-ink-950 px-12 py-12 text-ink-50 lg:flex">
        <div className="absolute inset-0 -z-10 opacity-70 mix-blend-screen">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-brand-700 shadow-lg">
            <span className="text-lg font-bold">O</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">OrionAI</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
              {t("login.brand.analyticsConsole")}
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
            {t("login.hero.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            {t("login.hero.headline")}
          </h1>
          <p className="mt-4 max-w-md text-base text-white/70">
            {t("login.hero.subheadline")}
          </p>

          <div className="mt-10 grid gap-4 text-sm">
            <Feature
              icon={<TrendingUp className="h-4 w-4" />}
              title={t("login.features.realtime.title")}
              body={t("login.features.realtime.body")}
            />
            <Feature
              icon={<ShieldCheck className="h-4 w-4" />}
              title={t("login.features.encrypted.title")}
              body={t("login.features.encrypted.body")}
            />
            <Feature
              icon={<Sparkles className="h-4 w-4" />}
              title={t("login.features.idempotent.title")}
              body={t("login.features.idempotent.body")}
            />
          </div>
        </div>

        <div className="text-xs text-white/40">
          {t("login.footer", { year: new Date().getFullYear() })}
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-16 dark:bg-ink-950">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white">
              O
            </div>
            <div>
              <div className="text-sm font-semibold">OrionAI</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
                {t("login.brand.analyticsConsole")}
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
            {t("login.title")}
          </h2>
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
            {t("login.subtitle")}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input
              label={t("login.fields.email.label")}
              type="email"
              autoComplete="email"
              required
              placeholder={t("login.fields.email.placeholder")}
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label={t("login.fields.password.label")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="px-2 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-200"
                  aria-label={showPassword ? t("login.fields.password.hide") : t("login.fields.password.show")}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2.5 text-xs font-medium text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-300">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              {submitting ? t("login.submitting") : t("login.submit")}
            </Button>
          </form>

          <p className="mt-10 text-xs text-ink-400">
            {t("login.needAccess")}
          </p>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white/10 text-brand-200 ring-1 ring-white/20">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-white/60">{body}</div>
      </div>
    </div>
  );
}
