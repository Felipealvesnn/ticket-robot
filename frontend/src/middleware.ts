import { NextRequest, NextResponse } from "next/server";

// MIDDLEWARE TEMPORARIAMENTE DESABILITADO
// Motivo: Conflito entre cookie (middleware) e localStorage (auth store)
// TODO: Implementar middleware que funcione com localStorage ou migrar para httpOnly cookies

// O controle de autenticação está sendo feito pelo ProtectedRoute component
// e pelo ConditionalLayout para evitar renderização desnecessária

export function middleware(request: NextRequest) {
  // Por enquanto, apenas deixa passar todas as requisições
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
