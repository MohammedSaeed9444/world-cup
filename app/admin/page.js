import Link from "next/link";
import AddMatchForm from "@/components/admin/AddMatchForm";
import ManageMatchesTable from "@/components/admin/ManageMatchesTable";
import Header from "@/components/Header";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — World Cup Predictions",
  description: "Manage matches, deadlines, and final scores.",
};

/**
 * Admin dashboard — restricted to mohammedsaeed9444@gmail.com only.
 */
export default async function AdminPage() {
  const { denied, supabase } = await requireAdmin();

  if (denied) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md rounded-2xl border border-red-900/40 bg-red-950/20 p-8 text-center">
          <span className="text-4xl">🚫</span>
          <h1 className="mt-4 text-xl font-bold text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You do not have permission to view this page.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_time", { ascending: true });

  if (error) {
    console.error("Admin: failed to load matches", error.message);
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl flex-1 px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
              Admin
            </p>
            <h1 className="text-2xl font-bold text-white">Match Management</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Add fixtures, set prediction deadlines, and publish final scores.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            ← User Dashboard
          </Link>
        </div>

        <div className="space-y-8">
          <AddMatchForm />
          <ManageMatchesTable matches={matches ?? []} />
        </div>
      </main>
    </>
  );
}
