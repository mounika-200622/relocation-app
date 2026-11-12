"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/components/theme";
import { UnreadProvider } from "@/components/nav/unread";

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="top-center" richColors closeButton toastOptions={{ style: { borderRadius: 16 } }} />;
}

export default function Providers({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <ThemeProvider>
        <UnreadProvider>{children}</UnreadProvider>
        <ThemedToaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
