import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/predictions";
import { isAdminEmail } from "@/lib/admin";

/**
 * Top navigation bar — shows user info and sign-out button.
 */
export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = user?.email ?? "Player";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    if (profile?.display_name) displayName = profile.display_name;
  }

  return (
    <header className="border-b border-emerald-900/30 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚽</span>
          <div>
            <h1 className="text-lg font-bold text-white">
              World Cup Predictions
            </h1>
            <p className="text-xs text-zinc-500">Score big. Beat your friends.</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            {isAdminEmail(user.email) && (
              <Link
                href="/admin"
                className="rounded-lg border border-violet-800/50 px-3 py-1.5 text-sm text-violet-300 transition hover:border-violet-600 hover:text-violet-200"
              >
                Admin
              </Link>
            )}
            <span className="hidden text-sm text-zinc-400 sm:inline">
              Playing as{" "}
              <span className="font-medium text-emerald-400">{displayName}</span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Sign Out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
