import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Login — World Cup Predictions",
  description: "Sign in or create an account to join the prediction pool.",
};

/**
 * Login / Registration page — public route (middleware allows unauthenticated access).
 */
export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-emerald-950/20 to-zinc-950 px-4 py-12">
      <AuthForm />
    </div>
  );
}
