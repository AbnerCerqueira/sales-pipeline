import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10">
      <div
        aria-hidden
        className="auth-backdrop pointer-events-none absolute inset-0"
      />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
