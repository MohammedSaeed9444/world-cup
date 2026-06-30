import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/constants/admin";

/**
 * Returns true when the email is the designated admin account.
 * @param {string | undefined | null} email
 */
export function isAdminEmail(email) {
  return email === ADMIN_EMAIL;
}

/**
 * Server-side guard for admin routes and actions.
 * Unauthenticated → redirect /login
 * Authenticated non-admin → return { denied: true }
 * Admin → return { user, supabase }
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  if (!isAdminEmail(user.email)) {
    return { denied: true, user: null, supabase };
  }

  return { denied: false, user, supabase };
}
