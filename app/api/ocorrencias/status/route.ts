import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db/file-db";

export async function PUT(request: Request) {
  try {
    const { occurrenceId, newStatus } = await request.json();
    
    if (!occurrenceId || !newStatus) {
      return NextResponse.json(
        { error: "ID da ocorrência e novo status são obrigatórios" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pendente', 'em_analise', 'atribuido', 'em_andamento', 'resolvido', 'fechado', 'cancelado'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      );
    }

    const db = readDb();
    
    // Find the occurrence
    const occurrenceIndex = db.ocorrencias.findIndex(oc => oc.id === occurrenceId);
    
    if (occurrenceIndex === -1) {
      return NextResponse.json(
        { error: "Ocorrência não encontrada" },
        { status: 404 }
      );
    }

    // Update the status
    db.ocorrencias[occurrenceIndex].status = newStatus;
    db.ocorrencias[occurrenceIndex].updated_at = new Date().toISOString();
    
    // Save to database
    writeDb(db);
    
    return NextResponse.json({
      success: true,
      message: "Status atualizado com sucesso",
      occurrence: db.ocorrencias[occurrenceIndex]
    });
    
  } catch (error) {
    console.error("[api/ocorrencias/status] error", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status da ocorrência" },
      { status: 500 }
    );
  }
}