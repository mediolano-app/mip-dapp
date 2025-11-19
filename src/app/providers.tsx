

import { ChipiProvider } from "@chipi-stack/nextjs";

const CHIPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_CHIPI_API_KEY!;

export function Providers({ children }: { children: React.ReactNode }) {
  // if (!CHIPI_PUBLIC_KEY) {
  //   console.warn("Chipi API keys are not set. Please add them to your environment variables.");
  //   // Return children without ChipiProvider if API key is missing
  //   return <>{children}</>;
  // }

  return (
    <ChipiProvider
    
      // config={{
      //   apiPublicKey: CHIPI_PUBLIC_KEY,
      // }}
    >
      {children}
    </ChipiProvider>
  );
}