"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Login / Registration form using Supabase Email + Password auth.
 * Toggle between sign-in and sign-up modes.
 */
export default function AuthForm() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage({
          type: "success",
          text: "Check your email to confirm your account, then log in.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-emerald-900/30 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur">
      <div className="mb-6 text-center">
        <span className="text-4xl">⚽</span>
        <h1 className="mt-2 text-2xl font-bold text-white">
          World Cup Predictions
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {mode === "login"
            ? "Sign in to make your picks"
            : "Create an account to join the pool"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your nickname on the leaderboard"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-zinc-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {message && (
          <p
            className={`rounded-lg px-4 py-2 text-sm ${
              message.type === "error"
                ? "bg-red-900/40 text-red-300"
                : "bg-emerald-900/40 text-emerald-300"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        {mode === "login" ? "No account yet?" : "Already registered?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setMessage(null);
          }}
          className="font-medium text-emerald-400 hover:text-emerald-300"
        >
          {mode === "login" ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
