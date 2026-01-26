import { NextResponse } from "next/server";
// @ts-ignore
import bcrypt from "bcryptjs";
import { readDb, writeDb } from "@/lib/db/file-db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const nome = body?.nome?.toString().trim();
  const cpf = body?.cpf?.toString().trim();
  const contato = body?.contato?.toString().trim();
  const senha = body?.senha?.toString() ?? "";
  const isEmail = body?.isEmail ?? false;

  // Validate required fields
  if (!cpf || !contato || !senha) {
    return NextResponse.json(
      { error: "CPF, contato e senha são obrigatórios." },
      { status: 400 }
    );
  }

  // Validate CPF
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) {
    return NextResponse.json(
      { error: "CPF inválido." },
      { status: 400 }
    );
  }

  // Validate contact (email or phone)
  let telefone: string | null = null;
  let email: string | null = null;

  if (isEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato)) {
      return NextResponse.json(
        { error: "E-mail inválido." },
        { status: 400 }
      );
    }
    email = contato.toLowerCase();
  } else {
    const cleanPhone = contato.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return NextResponse.json(
        { error: "Telefone inválido." },
        { status: 400 }
      );
    }
    telefone = cleanPhone;
  }

  // Validate password
  if (senha.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  try {
    const db = readDb();
    
    // Check if user already exists (by CPF)
    const existingUser = db.users.find(user => user.telefone === cleanCPF);
    if (existingUser) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(senha, 10);

    // Create user
    const now = new Date().toISOString();
    const id = ++db.counters.user;
    
    const user = {
      id,
      nome: nome || "Usuário",
      email: email || `${cleanCPF}@saomanuel.sp.gov.br`,
      telefone: cleanCPF, // Store CPF in telefone field for backward compatibility
      password_hash: passwordHash,
      role: "user" as const,
      created_at: now,
      contato_info: {
        tipo: isEmail ? "email" : "telefone",
        valor: contato,
        telefone: telefone,
        email: email
      }
    };

    db.users.push(user);
    writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Usuário cadastrado com sucesso!",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      }
    });

  } catch (error) {
    console.error("[simple-register] error", error);
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}