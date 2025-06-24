import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Rotas que requerem autenticação
const protectedRoutes = [
  "/",
  "/dashboard",
  "/sessions",
  "/flows",
  "/contacts",
  "/tickets",
  "/settings",
];

// Rotas que são apenas para usuários não autenticados
const authRoutes = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verificar se a rota atual é de autenticação
  const isAuthRoute = authRoutes.includes(pathname);

  // Se é uma rota protegida e não tem token, redirecionar para login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se é uma rota de auth e tem token válido, redirecionar para dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Para rotas protegidas com token, verificar se o token é válido
  if (isProtectedRoute && token) {
    // Aqui você pode adicionar validação adicional do token se necessário
    // Por exemplo, verificar se não expirou
    try {
      // Decodificar JWT simples (sem verificação de assinatura)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Se o token expirou, redirecionar para login
      if (payload.exp && payload.exp < currentTime) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("auth_token");
        return response;
      }
    } catch (error) {
      // Token inválido, redirecionar para login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

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
