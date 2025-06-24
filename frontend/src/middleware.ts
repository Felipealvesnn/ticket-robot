import { NextRequest, NextResponse } from "next/server";

// Rotas que requerem autenticação
const protectedRoutes = [
  "/",
  "/dashboard",
  "/sessions",
  "/flows",
  "/contacts",
  "/messages",
  "/settings",
];

// Rotas públicas (não precisam de autenticação)
const publicRoutes = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.includes(pathname);

  // Se é rota protegida, redirecionar para login
  // (O ProtectedRoute vai fazer a verificação real do token)
  if (isProtectedRoute) {
    // Adicionar um header para o ProtectedRoute saber que precisa verificar auth
    const response = NextResponse.next();
    response.headers.set("x-requires-auth", "true");
    return response;
  }

  // Para rotas públicas, apenas prosseguir
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
