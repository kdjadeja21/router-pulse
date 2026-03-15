"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setEncrypted, getEncrypted } from "@/lib/storage";

export const ROUTER_CONFIG_KEY = "routerConfig";

export default function SetupPage() {
  const router = useRouter();

  const [baseUrl, setBaseUrl] = useState("http://192.168.1.1");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [missingCreds, setMissingCreds] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      let hasLocalConfig = false;

      try {
        const raw = await getEncrypted(ROUTER_CONFIG_KEY);
        if (raw) {
          const config = JSON.parse(raw);
          if (config.baseUrl) setBaseUrl(config.baseUrl);
          if (config.username) setUsername(config.username);
          if (config.model) setModel(config.model);
          // Password intentionally not pre-filled
          if (config.baseUrl && config.username && config.password) {
            hasLocalConfig = true;
          }
        }
      } catch {
        // Corrupt or missing — ignore
      }

      if (!hasLocalConfig) {
        try {
          const res = await fetch("/api/config-status");
          const data = await res.json();
          if (!data.hasEnvConfig) {
            setMissingCreds(true);
          }
        } catch {
          // Network error — silently skip the banner
        }
      }

      setLoadingConfig(false);
    }
    loadConfig();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      let finalPassword = password;

      if (!finalPassword) {
        // Keep existing password if one is already saved
        try {
          const raw = await getEncrypted(ROUTER_CONFIG_KEY);
          const existing = raw ? JSON.parse(raw) : {};
          if (!existing.password) {
            throw new Error("Password is required for initial setup.");
          }
          finalPassword = existing.password;
        } catch (err) {
          if (err instanceof Error && err.message.includes("required")) throw err;
          throw new Error("Password is required for initial setup.");
        }
      }

      await setEncrypted(
        ROUTER_CONFIG_KEY,
        JSON.stringify({ baseUrl, username, password: finalPassword, model })
      );

      setSuccess(true);
      setTimeout(() => router.push("/"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save config.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Router Setup
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Configure your router connection. Settings are encrypted and saved locally in your browser.
          </p>
        </div>

        {/* Missing credentials banner */}
        {missingCreds && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/60 dark:bg-amber-950/40">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                No credentials found
              </p>
              <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                No saved config was found in your browser or in the{" "}
                <code className="rounded bg-amber-100 px-1 font-mono dark:bg-amber-900/50">
                  .env.local
                </code>{" "}
                file. Please fill in your router credentials below to get started.
              </p>
            </div>
          </div>
        )}

        {/* Router Config */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Router IP / Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                required
                placeholder="http://192.168.1.1"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              <p className="mt-1 text-xs text-zinc-400">
                Usually http://192.168.1.1 or http://192.168.0.1
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Router Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Router Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep existing"
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                Encrypted with AES-256-GCM before storage — never stored in plaintext
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Router Model <span className="text-zinc-400">(optional)</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. AOT5221ZY"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Config saved! Redirecting…
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                disabled={missingCreds}
                className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save & Connect"}
              </button>
            </div>
          </form>
        </div>

        {/* Privacy notice */}
        <div className="mt-5 rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                How your data is handled
              </p>
              <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <li>
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">Credentials</span>
                  {" "}— encrypted with AES-256-GCM using the Web Crypto API before being written to localStorage. The plaintext password is never persisted.
                </li>
                <li>
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">Router data</span>
                  {" "}— fetched directly from your router via the Next.js API route running locally. Nothing leaves your machine.
                </li>
                <li>
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">No accounts</span>
                  {" "}— no login, no cloud services, no external dependencies required.
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
