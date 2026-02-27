import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/manifest.json'
]);

const isAdminRouteMatch = createRouteMatcher(['/admin(.*)']);
const isDashboardGroupMatch = createRouteMatcher(['/dashboard(.*)', '/agenda(.*)', '/onboarding(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // Ignora rotas públicas
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Exige autenticação para o resto
  await auth.protect();

  const authObject = await auth();
  const url = new URL(request.url);

  // 1. Obter Metadata do Clerk
  const metadata = (authObject.sessionClaims?.metadata as Record<string, any>) || {};
  const userRole = metadata?.role as string;
  const isOnboarded = metadata?.is_onboarded as boolean;

  // 2. Bloqueio por Autorização e Onboarding SaaS (Fase 40)
  if (isDashboardGroupMatch(request) && userRole === 'admin' && !isOnboarded) {
    if (!url.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // 3. Vima Sistemas acesso Admin
  if (isAdminRouteMatch(request)) {
    // No Clerk, o e-mail não vem exposto livremente no JWT base a menos que customizado
    // Vamos checar pelas claims específicas se existirem.
    const claims = authObject.sessionClaims as any;

    // Fallback pra resgatar e-mail em diferentes builds locais/clerk:
    const userEmail =
      claims?.email ||
      claims?.primary_email_address ||
      (claims?.primary_email_address_identities?.[0]?.email_address) ||
      "";

    // Debug opcional do Token recebido pelo middleware:
    // console.log("CLERK ADMIN MATCH -> Tentativa E-mail:", userEmail);

    if (!userEmail.endsWith('@vimasistemas.com.br')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
