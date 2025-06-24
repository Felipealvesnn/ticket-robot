import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Criar resposta
    const response = NextResponse.json({
      message: "Logout realizado com sucesso",
    });

    // Remover cookie
    response.cookies.delete("auth_token");

    return response;
  } catch (error) {
    console.error("Erro no logout:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
