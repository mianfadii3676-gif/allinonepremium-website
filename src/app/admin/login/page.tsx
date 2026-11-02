"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, User, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        username: username.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        // Same message for every failure so the form doesn't reveal which usernames exist.
        setError("Incorrect username or password. Too many attempts will lock sign-in for 15 minutes.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full h-10 bg-white border border-gray-300 rounded-md pl-10 pr-4 text-[14px] text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

  return (
    <div className="min-h-screen bg-[#f6f6f7] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <svg viewBox="0 0 48 40" className="h-11 w-12 mx-auto" aria-hidden="true">
            <path d="M24 2 L46 38 H35 L24 19 L13 38 H2 Z" fill="#3b82f6" />
            <path d="M17 38 L24 26 L31 38 Z" fill="#3b82f6" opacity="0.55" />
          </svg>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Allinonepermium Admin</h1>
          <p className="mt-1 text-[14px] text-gray-500">Sign in to manage orders and products.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 p-6 rounded-lg bg-white border border-gray-200 shadow-sm space-y-4" noValidate>
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[13px] flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="admin-username" className="block text-[13px] font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-[13px] font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full h-10 rounded-md bg-gray-900 hover:bg-gray-800 text-white font-medium text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-gray-400">Authorized staff only.</p>
      </div>
    </div>
  );
}
