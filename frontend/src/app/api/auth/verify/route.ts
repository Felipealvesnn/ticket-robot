import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Token não encontrado" },
        { status: 401 }
      );
    }

    // Verificar token no backend
    const response = await fetch(`${BACKEND_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const userData = await response.json();

    return NextResponse.json({
      user: userData,
    });
  } catch (error) {
    console.error("Erro na verificação:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
