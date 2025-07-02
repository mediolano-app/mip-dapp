"use client";

import { ChipiProvider } from "@chipi-pay/chipi-sdk";

// const CHIPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_CHIPI_API_KEY!;
const CHIPI_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_CHIPI_API_KEY || "dummy_key111"; // Fallback for development;

export function Providers({ children }: { children: React.ReactNode }) {
  // if (!CHIPI_PUBLIC_KEY) {
  //   console.warn("Chipi API keys are not set. Please add them to your environment variables.");
  //   // Return children without ChipiProvider if API key is missing
  //   return <>{children}</>;
  // }

  return (
    <ChipiProvider
      config={{
        apiPublicKey: CHIPI_PUBLIC_KEY,
      }}
    >
      {children}
    </ChipiProvider>
  );
}
