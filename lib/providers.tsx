// Source - https://stackoverflow.com/a
// Posted by sundayonah, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-23, License - CC BY-SA 4.0

  // providers.tsx
  "use client";
  import { SessionProvider } from "next-auth/react";

  export function Providers({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
  }
