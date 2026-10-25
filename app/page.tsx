"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "~/components/layout/AppShell";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const isGuest = localStorage.getItem("margin_guest_mode") === "true";

    if (!token && !isGuest) {
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <div className="flex flex-col items-center gap-2 text-xs text-[var(--muted)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--iris)]" />
          <span>Opening your margin…</span>
        </div>
      </div>
    );
  }

  return <AppShell />;
}
