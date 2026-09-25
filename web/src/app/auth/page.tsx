"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/* Icons                                                              */
/* ------------------------------------------------------------------ */

const ICONS: Record<string, ReactNode> = {
  leaf: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  phone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  shield: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  ),
  checkCircle: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

interface AuthUser {
  id?: string;
  name: string;
  email?: string;
  phone: string;
  role?: "buyer" | "seller";
  verified?: boolean;
}

interface AuthResponse {
  ok?: boolean;
  error?: string;
  user?: AuthUser;
}

type Mode = "login" | "signup";
type Role = "buyer" | "seller";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("buyer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "login" || requestedMode === "signup") {
      window.requestAnimationFrame(() => setMode(requestedMode));
    }

    void fetch("/api/auth/me")
      .then((res) => {
        if (res.ok && active) router.replace("/dashboard");
      })
      .catch(() => {
        // An unavailable session endpoint should not prevent login or signup.
      });

    return () => {
      active = false;
    };
  }, [router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setSuccess(null);
  };

  const setField = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  };

  const validate = (): string => {
    if (mode === "signup") {
      if (!form.name.trim()) return "Please enter your name.";
      if (!form.phone.trim()) return "Please enter your phone number.";
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        return "Please enter a valid email address.";
      }
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
        return "Password must be at least 8 characters and include both letters and numbers.";
      }
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
      return "";
    }
    if (!form.email.trim() || !form.password) return "Please enter your email or phone number and password.";
    return "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "login" : "register";
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { identifier: form.email.trim(), password: form.password }
            : {
                name: form.name.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim(),
                password: form.password,
                confirmPassword: form.confirmPassword,
                role,
              },
        ),
      });
      const payload = (await res.json().catch(() => ({}))) as AuthResponse;
      if (!res.ok || !payload.ok) {
        setError(payload.error || "Something went wrong. Please try again.");
        return;
      }
      setSuccess(
        payload.user ?? {
          name: "Farmer",
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
        },
      );
    } catch {
      setError("Couldn't reach the server. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <div className="auth__glow" aria-hidden="true" />

      <div className="container">
        <div className="auth__grid">
          <section className="auth__panel">
            <Link className="brand" href="/">
              <span className="brand__mark">{ICONS.leaf}</span>
              <span className="brand__name">
                <strong>Agri Intel</strong>
                <span>Digital Mandi Platform</span>
              </span>
            </Link>

            <h1 className="auth__title">
              Fair prices start with a <span className="accent">trusted account.</span>
            </h1>
            <p className="auth__sub">
              Log in to check live mandi rates and connect with verified buyers, or create a new
              account to start selling smarter.
            </p>

            <ul className="auth__points">
              <li>
                <span className="auth__point-mark">{ICONS.checkCircle}</span>
                Live rates &amp; demand signals for your district
              </li>
              <li>
                <span className="auth__point-mark">{ICONS.checkCircle}</span>
                Direct connection to KYC-verified buyers
              </li>
              <li>
                <span className="auth__point-mark">{ICONS.checkCircle}</span>
                Transparent payments straight to your bank
              </li>
            </ul>

            <div className="auth__trust">
              <span>{ICONS.shield}</span>
              Your details are kept private and used only to secure your farm account.
            </div>
          </section>

          <section className="auth__card">
            <div className="auth__tabs" role="tablist" aria-label="Account access">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={`auth__tab${mode === "login" ? " is-active" : ""}`}
                onClick={() => switchMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={`auth__tab${mode === "signup" ? " is-active" : ""}`}
                onClick={() => switchMode("signup")}
              >
                Sign Up
              </button>
            </div>

            {success ? (
              <div className="auth__success" role="status">
                <span className="auth__success-icon">{ICONS.checkCircle}</span>
                <h2>{mode === "signup" ? "Account created!" : "Welcome back!"}</h2>
                <p>
                  {mode === "signup"
                    ? `Hi ${success.name}, your ${success.role ?? "buyer"} account is ready.`
                    : `Hi ${success.name}, you're logged in as ${success.role ?? "buyer"}.`}
                </p>
                <button type="button" className="btn btn--lime auth__success-btn" onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <form className="auth__form" onSubmit={handleSubmit} noValidate>
                <h2 className="auth__card-title">
                  {mode === "login" ? "Log in to your account" : "Create your account"}
                </h2>
                <p className="auth__card-sub">
                  {mode === "login"
                    ? "Enter your email or phone number and password to continue."
                    : "Select how you want to use Agri Intel — you can change this later."}
                </p>

                {mode === "signup" && (
                  <fieldset className="auth__role">
                    <legend className="field__label">Register as</legend>
                    <div className="auth__role-toggle">
                      <button
                        type="button"
                        className={`auth__role-btn${role === "buyer" ? " is-active" : ""}`}
                        aria-pressed={role === "buyer"}
                        onClick={() => setRole("buyer")}
                      >
                        <span className="auth__role-icon">{ICONS.user}</span>
                        <span>
                          <strong>Buyer</strong>
                          <small>Buy produce at fair rates</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`auth__role-btn${role === "seller" ? " is-active" : ""}`}
                        aria-pressed={role === "seller"}
                        onClick={() => setRole("seller")}
                      >
                        <span className="auth__role-icon">{ICONS.leaf}</span>
                        <span>
                          <strong>Seller</strong>
                          <small>Sell your harvest directly ( including FPO&apos;s )</small>
                        </span>
                      </button>
                    </div>
                  </fieldset>
                )}

                {mode === "signup" && (
                  <div className="field">
                    <label className="field__label" htmlFor="auth-name">
                      Full Name
                    </label>
                    <div className="field__control">
                      <span className="field__icon">{ICONS.user}</span>
                      <input
                        id="auth-name"
                        className="field__input"
                        type="text"
                        autoComplete="name"
                        placeholder="e.g. Ramesh Yadav"
                        value={form.name}
                        onChange={(e) => setField("name")(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="field">
                  <label className="field__label" htmlFor="auth-email">
                    {mode === "login" ? "Email or Phone" : "Email"}{" "}
                    {mode === "signup" && <span className="field__optional">(optional)</span>}
                  </label>
                  <div className="field__control">
                    <span className="field__icon">{mode === "login" ? ICONS.phone : ICONS.mail}</span>
                    <input
                      id="auth-email"
                      className="field__input"
                      type={mode === "login" ? "text" : "email"}
                      autoComplete={mode === "login" ? "username" : "email"}
                      placeholder={mode === "login" ? "you@gmail.com or phone number" : "you@gmail.com"}
                      value={form.email}
                      onChange={(e) => setField("email")(e.target.value)}
                    />
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="field">
                    <label className="field__label" htmlFor="auth-phone">
                      Phone
                    </label>
                    <div className="field__control">
                      <span className="field__icon">{ICONS.phone}</span>
                      <input
                        id="auth-phone"
                        className="field__input"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => setField("phone")(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="field">
                  <label className="field__label" htmlFor="auth-password">
                    Password
                  </label>
                  <div className="field__control">
                    <span className="field__icon">{ICONS.lock}</span>
                    <input
                      id="auth-password"
                      className="field__input"
                      type="password"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      placeholder={mode === "login" ? "Enter your password" : "8+ chars, letters & numbers"}
                      value={form.password}
                      onChange={(e) => setField("password")(e.target.value)}
                    />
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="field">
                    <label className="field__label" htmlFor="auth-confirm">
                      Confirm Password
                    </label>
                    <div className="field__control">
                      <span className="field__icon">{ICONS.lock}</span>
                      <input
                        id="auth-confirm"
                        className="field__input"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        value={form.confirmPassword}
                        onChange={(e) => setField("confirmPassword")(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <p className={`auth__error${error ? " is-visible" : ""}`} role="alert">
                  {error}
                </p>

                <button type="submit" className="btn btn--orange auth__submit" disabled={loading}>
                  {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
                </button>

                <p className="auth__alt">
                  {mode === "login" ? (
                    <>
                      New to Agri Intel?{" "}
                      <button type="button" className="auth__link" onClick={() => switchMode("signup")}>
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button type="button" className="auth__link" onClick={() => switchMode("login")}>
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}