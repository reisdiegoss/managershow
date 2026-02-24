import { authMiddleware } from "@clerk/nextjs";

// Este middleware protege todas as rotas dentro do grupo (dashboard)
// Usuários não autenticados serão redirecionados para o login
export default authMiddleware({
  publicRoutes: ["/sign-in(.*)", "/sign-up(.*)", "/api(.*)"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
