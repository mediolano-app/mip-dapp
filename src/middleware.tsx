import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/activities", "/asset(.*)", "/onboarding"])


export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // If user is logged in, we need to check their metadata
  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);

      const hasWallet = user.publicMetadata?.walletCreated === true;

      // If user is trying to access onboarding but already has a wallet, redirect to home
      if (hasWallet && req.nextUrl.pathname === "/onboarding") {
        const homeUrl = new URL("/", req.url);
        return NextResponse.redirect(homeUrl);
      }

      // Catch users who do not have walletCreated: true in their publicMetadata
      // Redirect them to the /onboarding route to complete onboarding
      if (!hasWallet && req.nextUrl.pathname !== "/onboarding") {
        const onboardingUrl = new URL("/onboarding", req.url);
        return NextResponse.redirect(onboardingUrl);
      }
    } catch (error) {
      console.error('Error fetching user in middleware:', error);
      // If there's an error fetching user data, allow the request to continue
      // to avoid breaking the app
    }
  }

  // If the user is logged in and the route is protected, let them view.
  if (userId && !isPublicRoute(req)) {
    return NextResponse.next();
  }

});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};