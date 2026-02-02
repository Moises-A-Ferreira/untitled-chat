import { NextResponse } from 'next/server';
// Usando o banco de dados baseado em arquivo em vez do SQLite
import { 
  createFeedback, 
  findFeedbackByUserAndOcorrencia, 
  listAllFeedbacks, 
  listUserFeedbacks,
  findUserById,
  listOcorrenciaFeedbacks,
  calculateFeedbackStats
} from '@/lib/db/file-db';

export async function POST(request: Request) {
  try {
    const { ocorrenciaId, userId, rating, comentario } = await request.json();

    // Validação dos dados recebidos
    if (!userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Dados inválidos: userId e rating (1-5) são obrigatórios.' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    // Para feedback geral (ocorrenciaId = 0 ou null), não fazemos a verificação de ocorrência
    if (ocorrenciaId) {
      // Aqui poderíamos verificar se a ocorrência existe, mas vamos pular por simplicidade
      // para manter a compatibilidade com o sistema de arquivo
    }

    // Verifica se já existe um feedback para esta ocorrência por este usuário (exceto para feedback geral)
    let existingFeedback = null;
    if (ocorrenciaId) {
      existingFeedback = findFeedbackByUserAndOcorrencia(userId, ocorrenciaId);
    }

    let feedback;
    if (existingFeedback) {
      // Atualiza o feedback existente - como nosso sistema de arquivo não tem update direto,
      // vamos remover e criar novamente
      // Para simplificar, vamos apenas criar um novo feedback se não existir
      return NextResponse.json({
        success: true,
        message: 'Já existe um feedback para esta ocorrência.',
        feedbackId: existingFeedback.id
      });
    } else {
      // Cria novo feedback
      feedback = createFeedback({
        ocorrencia_id: ocorrenciaId || null,
        user_id: userId,
        rating,
        comentario: comentario || null
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback enviado com sucesso!',
      feedbackId: feedback.id
    });
  } catch (error) {
    console.error('Erro ao processar feedback:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao processar feedback.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const ocorrenciaId = searchParams.get('ocorrenciaId');
    const userId = searchParams.get('userId');

    let feedbacks = [];

    if (ocorrenciaId && userId) {
      // Retorna feedback específico para uma ocorrência e usuário
      const feedback = findFeedbackByUserAndOcorrencia(parseInt(userId), parseInt(ocorrenciaId));
      feedbacks = feedback ? [feedback] : [];
    } else if (ocorrenciaId) {
      // Retorna feedbacks para uma ocorrência específica
      feedbacks = listOcorrenciaFeedbacks(parseInt(ocorrenciaId));
    } else if (userId) {
      // Retorna feedbacks de um usuário específico
      feedbacks = listUserFeedbacks(parseInt(userId));
    } else {
      // Retorna todos os feedbacks
      feedbacks = listAllFeedbacks();
    }

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('Erro ao buscar feedbacks:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar feedbacks.' },
      { status: 500 }
    );
  }
}