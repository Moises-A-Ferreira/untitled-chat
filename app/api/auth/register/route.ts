import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/db/file-db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const nome = body?.nome?.toString().trim();
  const email = body?.email?.toString().trim().toLowerCase();
  const telefone = body?.telefone?.toString().trim();
  const password = body?.password?.toString() ?? "";

  if (!nome || !email || !password) {
    return NextResponse.json(
      { error: "Nome, e-mail e senha são obrigatórios." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "E-mail inválido. Verifique e tente novamente." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  try {
    const existing = findUserByEmail(email);

    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado. Tente fazer login." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = createUser({
      nome,
      email,
      telefone: telefone ?? null,
      password_hash: passwordHash,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[auth/register] error", error);
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}


