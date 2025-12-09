import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/src/components/ui/toaster";
import { ThemeProvider } from "@/src/components/theme-provider";
import { Header } from "@/src/components/header";
import { Footer } from "@/src/components/footer";
import { FloatingNavigation } from "@/src/components/floating-navigation";
import { ClerkProvider} from "@clerk/nextjs";
import Link from "next/link";
import { Providers } from "./providers";
import StarknetProviderWrapper from "./StarknetProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MIP",
  description: "Own and publish your content onchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
    >
        <Providers>
          <StarknetProviderWrapper>
            <html lang="en" suppressHydrationWarning>
              <body className={inter.className}>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                  <FloatingNavigation />
                  <Toaster />
                </ThemeProvider>
              </body>
            </html>
          </StarknetProviderWrapper>
        </Providers>
    </ClerkProvider>
  );
}
