'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import SatisfactionReportGenerator from './SatisfactionReportGenerator';

interface Feedback {
  id: number;
  ocorrencia_id: number | null;
  user_id: number;
  rating: number;
  comentario: string | null;
  created_at: string;
}

interface AdminFeedbackDisplayProps {
  ocorrenciaId?: number;
  userId?: number;
}

const AdminFeedbackDisplay: React.FC<AdminFeedbackDisplayProps> = ({ 
  ocorrenciaId,
  userId 
}) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        let url = '/api/admin/feedbacks';
        
        // Monta a URL com os parâmetros adequados
        const params = new URLSearchParams();
        if (ocorrenciaId) params.append('ocorrenciaId', ocorrenciaId.toString());
        if (userId) params.append('userId', userId.toString());
        
        // Adiciona o parâmetro admin=true para autenticação
        params.append('admin', 'true');
        
        if (params.toString()) {
          url += '?' + params.toString();
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar feedbacks');
        }

        setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar feedbacks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [ocorrenciaId, userId]);

  const getRatingInfo = (rating: number) => {
    switch (rating) {
      case 1:
        return { emoji: '😡', label: 'Muito insatisfeito', color: 'bg-red-100 text-red-800', icon: <ThumbsDown className="h-4 w-4" /> };
      case 2:
        return { emoji: '😞', label: 'Insatisfeito', color: 'bg-orange-100 text-orange-800', icon: <Meh className="h-4 w-4" /> };
      case 3:
        return { emoji: '😐', label: 'Neutro', color: 'bg-yellow-100 text-yellow-800', icon: <Meh className="h-4 w-4" /> };
      case 4:
        return { emoji: '😊', label: 'Satisfeito', color: 'bg-blue-100 text-blue-800', icon: <Meh className="h-4 w-4" /> };
      case 5:
        return { emoji: '😍', label: 'Muito satisfeito', color: 'bg-green-100 text-green-800', icon: <ThumbsUp className="h-4 w-4" /> };
      default:
        return { emoji: '❓', label: 'Sem avaliação', color: 'bg-gray-100 text-gray-800', icon: <Star className="h-4 w-4" /> };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Feedbacks de Satisfação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando feedbacks...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Feedbacks de Satisfação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Erro: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Feedbacks de Satisfação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Nenhum feedback encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Feedbacks de Satisfação
            <Badge variant="secondary">{feedbacks.length} {feedbacks.length === 1 ? 'avaliação' : 'avaliações'}</Badge>
          </div>
          <SatisfactionReportGenerator />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            const ratingInfo = getRatingInfo(feedback.rating);
            return (
              <div 
                key={feedback.id} 
                className="p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ratingInfo.emoji}</span>
                    <Badge className={ratingInfo.color}>
                      {ratingInfo.label}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {feedback.ocorrencia_id 
                        ? `Ocorrência #${feedback.ocorrencia_id}` 
                        : 'Feedback Geral do Sistema'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(feedback.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                {feedback.comentario && (
                  <div className="mt-2 p-3 bg-white rounded border-l-4 border-blue-500">
                    <p className="text-gray-700">"{feedback.comentario}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminFeedbackDisplay;