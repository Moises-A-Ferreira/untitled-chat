import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const { session, response } = await requireAuth();
  if (response || !session) return response ?? NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "ocorrencias");
    await mkdir(uploadsDir, { recursive: true });

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${session.user_id}_${Date.now()}.${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    const fotoUrl = `/uploads/ocorrencias/${fileName}`;

    return NextResponse.json({ foto_url: fotoUrl }, { status: 200 });
  } catch (error) {
    console.error("[ocorrencias/upload] error", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload da foto." },
      { status: 500 }
    );
  }
}



