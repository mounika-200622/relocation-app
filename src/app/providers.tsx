"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/components/theme";
import { UnreadProvider } from "@/components/nav/unread";

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="top-center" richColors closeButton toastOptions={{ style: { borderRadius: 16 } }} />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ThemeProvider>
        <UnreadProvider>{children}</UnreadProvider>
        <ThemedToaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
