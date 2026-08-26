"use client";

import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProgressProvider } from "@/lib/store";

function ProgressBridge({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <ProgressProvider authed={!!user}>{children}</ProgressProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProgressBridge>{children}</ProgressBridge>
    </AuthProvider>
  );
}
