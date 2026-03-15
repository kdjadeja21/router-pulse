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

  useEffect(() => {
    async function loadConfig() {
      try {
        const raw = await getEncrypted(ROUTER_CONFIG_KEY);
        if (raw) {
          const config = JSON.parse(raw);
          if (config.baseUrl) setBaseUrl(config.baseUrl);
          if (config.username) setUsername(config.username);
          if (config.model) setModel(config.model);
          // Password intentionally not pre-filled
        }
      } catch {
        // Corrupt or missing — ignore
      } finally {
        setLoadingConfig(false);
      }
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep existing"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
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
                className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
