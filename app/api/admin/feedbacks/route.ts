import { NextResponse } from 'next/server';
// Usando o banco de dados baseado em arquivo em vez do SQLite
import { 
  listAllFeedbacks, 
  calculateFeedbackStats,
  findUserById
} from '@/lib/db/file-db';

export async function GET(request: Request) {
  // Checar credenciais básicas como fallback - mantendo o mesmo sistema do dashboard admin
  const url = new URL(request.url);
  const adminParam = url.searchParams.get('admin');
  if (adminParam !== 'true') {
    return NextResponse.json({ error: "Acesso negado. Apenas administradores." }, { status: 403 });
  }

  try {
    // Testar conexão básica com o banco de dados
    console.log('[admin/feedbacks] Iniciando requisição');
    
    // Obter todos os feedbacks
    const feedbacks = listAllFeedbacks();
    
    console.log('[admin/feedbacks] Feedbacks encontrados:', feedbacks.length);
    
    // Obter estatísticas
    const statsResult = calculateFeedbackStats();
    
    console.log('[admin/feedbacks] Estatísticas calculadas:', statsResult);
    
    // Obter informações adicionais dos usuários e ocorrências
    const enhancedFeedbacks = feedbacks.map(feedback => {
      const user = findUserById(feedback.user_id);
      
      return {
        ...feedback,
        usuario_nome: user?.nome || 'Usuário Desconhecido',
        usuario_email: user?.email || 'N/A'
      };
    });
    
    // Preparar resposta
    const response = {
      feedbacks: enhancedFeedbacks,
      stats: {
        totalFeedbacks: statsResult.totalFeedbacks,
        averageRating: statsResult.averageRating,
        positiveCount: statsResult.positiveCount,
        negativeCount: statsResult.negativeCount,
        neutralCount: statsResult.neutralCount,
        satisfactionRate: statsResult.satisfactionRate
      }
    };
    
    console.log('[admin/feedbacks] Resposta preparada com sucesso');
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[admin/feedbacks] Erro completo:', error);
    
    // Retornar erro em formato JSON para evitar problemas de parsing
    return NextResponse.json(
      { 
        error: "Erro ao carregar feedbacks.",
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

// Endpoint para deletar um feedback (caso seja necessário)
export async function DELETE(request: Request) {
  // Verificar autenticação de admin
  const url = new URL(request.url);
  const adminParam = url.searchParams.get('admin');
  if (adminParam !== 'true') {
    return NextResponse.json({ error: "Acesso negado. Apenas administradores." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('id');

    if (!feedbackId) {
      return NextResponse.json(
        { error: "ID do feedback é obrigatório." },
        { status: 400 }
      );
    }

    // Como estamos usando o sistema de arquivo, não temos uma função direta de exclusão
    // Vamos retornar um erro indicando que esta funcionalidade não está implementada
    return NextResponse.json(
      { error: "Exclusão de feedbacks não implementada no sistema de arquivo." },
      { status: 501 }
    );
  } catch (error) {
    console.error('[admin/feedbacks/delete] error', error);
    return NextResponse.json(
      { error: "Erro ao remover feedback." },
      { status: 500 }
    );
  }
}