import { NextResponse } from "next/server";
import { readDb } from "@/lib/db/file-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cpf = searchParams.get("cpf");
  const nome = searchParams.get("nome");

  if (!cpf) {
    return NextResponse.json(
      { error: "CPF é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const db = readDb();
    
    // Check if user exists by CPF (stored in telefone field)
    const existingUser = db.users.find(user => user.telefone === cpf);

    return NextResponse.json({
      exists: !!existingUser,
      user: existingUser ? {
        id: existingUser.id,
        nome: existingUser.nome,
        email: existingUser.email
      } : null
    });

  } catch (error) {
    console.error("[api/user/check] error", error);
    return NextResponse.json(
      { error: "Erro ao verificar usuário" },
      { status: 500 }
    );
  }
}