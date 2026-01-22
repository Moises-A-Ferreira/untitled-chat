import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findValidSession, findUserById } from "@/lib/db/file-db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const session = findValidSession(token);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = findUserById(session.user_id);

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


