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

    // 2. Bloqueio por Autorização (Apenas domínio vimasistemas.com.br pode acessar /admin)
    // Nota: Em produção, idealmente usar publicMetadata.role === 'admin'
    if (isAdminRoute && auth.userId) {
      const userEmail = auth.sessionClaims?.email as string;
      if (!userEmail?.endsWith('@vimasistemas.com.br')) {
        return Response.redirect(new URL('/dashboard', req.url));
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
