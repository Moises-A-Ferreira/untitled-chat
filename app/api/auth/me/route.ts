import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    // allowUnauthenticated: retorna { user: null } sem 401
    const { user } = await requireAuth({ allowUnauthenticated: true });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[auth/me] error", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}


