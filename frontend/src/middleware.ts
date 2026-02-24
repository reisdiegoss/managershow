import { authMiddleware } from "@clerk/nextjs";

// Este middleware protege todas as rotas dentro do grupo (dashboard)
// Usuários não autenticados serão redirecionados para o login
export default authMiddleware({
  publicRoutes: ["/sign-in(.*)", "/sign-up(.*)", "/api(.*)"],
  afterAuth(auth, req) {
    // Se estiver tentando acessar /admin e não for autenticado
    if (req.nextUrl.pathname.startsWith('/admin') && !auth.userId) {
      return Response.redirect(new URL('/sign-in', req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
