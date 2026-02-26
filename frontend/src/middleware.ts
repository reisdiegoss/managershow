import { authMiddleware } from "@clerk/nextjs";

// Este middleware protege todas as rotas dentro do grupo (dashboard)
// Usuários não autenticados serão redirecionados para o login
export default authMiddleware({
  publicRoutes: ["/sign-in(.*)", "/sign-up(.*)", "/api(.*)"],
  afterAuth(auth, req) {
    const url = new URL(req.url);
    const isAdminRoute = url.pathname.startsWith('/admin');

    // 1. Bloqueio por Autenticação
    if (isAdminRoute && !auth.userId) {
      return Response.redirect(new URL('/sign-in', req.url));
    }

    // 2. Bloqueio por Autorização e Onboarding SaaS (Fase 40)
    if (auth.userId) {
      const userRole = auth.sessionClaims?.metadata?.role as string;
      const isOnboarded = auth.sessionClaims?.metadata?.is_onboarded as boolean;
      
      const isDashboardRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/agenda');
      
      // Se for Owner/Admin do Tenant e não finalizou configurações, prende no Wizard
      if (isDashboardRoute && userRole === 'admin' && !isOnboarded) {
         // Mas evita o loop infinito!
         if (!url.pathname.startsWith('/onboarding')) {
             return Response.redirect(new URL('/onboarding', req.url));
         }
      }

      // Vima Sistemas acesso Admin
      if (isAdminRoute) {
        const userEmail = auth.sessionClaims?.email as string;
        if (!userEmail?.endsWith('@vimasistemas.com.br')) {
          return Response.redirect(new URL('/dashboard', req.url));
        }
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
