'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';

type RatingValue = 1 | 2 | 3 | 4 | 5;

interface SatisfactionFeedbackProps {
  ocorrenciaId: number;
  userId: number;
  initialRating?: RatingValue | null;
  initialComment?: string | null;
  onFeedbackSubmit?: (rating: RatingValue, comment: string) => void;
}

const SatisfactionFeedback: React.FC<SatisfactionFeedbackProps> = ({
  ocorrenciaId,
  userId,
  initialRating = null,
  initialComment = null,
  onFeedbackSubmit
}) => {
  const [rating, setRating] = useState<RatingValue | null>(initialRating);
  const [comment, setComment] = useState<string>(initialComment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(initialRating !== null);

  // Atualiza o estado se as props iniciais mudarem
  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment || '');
    setIsSubmitted(initialRating !== null);
  }, [initialRating, initialComment]);

  const handleRatingClick = (value: RatingValue) => {
    if (isSubmitted) return;
    setRating(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === null) {
      alert('Por favor, selecione uma avaliação antes de enviar.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Se ocorrenciaId for 0, trata-se de feedback geral do sistema
      if (ocorrenciaId === 0) {
        await saveGeneralFeedback(userId, rating, comment);
      } else {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ocorrenciaId,
            userId,
            rating,
            comentario: comment
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar feedback');
        }
      }

      setIsSubmitted(true);
      onFeedbackSubmit?.(rating, comment);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      alert('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratings = [
    { value: 1 as RatingValue, emoji: '😡', icon: <ThumbsDown className="h-6 w-6" />, label: 'Muito insatisfeito', color: 'text-red-500' },
    { value: 2 as RatingValue, emoji: '😞', icon: <Meh className="h-6 w-6" />, label: 'Insatisfeito', color: 'text-orange-500' },
    { value: 3 as RatingValue, emoji: '😐', icon: <Star className="h-6 w-6" />, label: 'Neutro', color: 'text-yellow-500' },
    { value: 4 as RatingValue, emoji: '😊', icon: <Meh className="h-6 w-6" />, label: 'Satisfeito', color: 'text-blue-500' },
    { value: 5 as RatingValue, emoji: '😍', icon: <ThumbsUp className="h-6 w-6" />, label: 'Muito satisfeito', color: 'text-green-500' },
  ];

  if (isSubmitted) {
    const currentRating = ratings.find(r => r.value === rating);
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Star className="h-5 w-5 text-green-600" />
            Obrigado pelo seu {ocorrenciaId === 0 ? 'feedback sobre o sistema!' : 'feedback!'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{currentRating?.emoji}</span>
            <span className={`${currentRating?.color} font-semibold`}>{currentRating?.label}</span>
          </div>
          {comment && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <p className="text-gray-700"><strong>Comentário:</strong> {comment}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {ocorrenciaId === 0 ? 'Avaliação do Sistema' : 'Avaliação de Satisfação'}
        </CardTitle>
        <p className="text-sm text-gray-500">
          {ocorrenciaId === 0 
            ? 'Como você avalia o sistema e os serviços prestados?'
            : 'Como você avalia o atendimento à sua ocorrência?'}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Selecione sua avaliação:</Label>
            <div className="flex justify-between max-w-md">
              {ratings.map((option) => (
                <div 
                  key={option.value}
                  className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all ${
                    rating === option.value 
                      ? 'bg-blue-100 border-2 border-blue-500' 
                      : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => handleRatingClick(option.value)}
                >
                  <span className="text-3xl mb-1">{option.emoji}</span>
                  <span className={`text-xs text-center ${option.color}`}>{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="comentario" className="text-sm font-medium mb-2 block">
              Comentário (opcional)
            </Label>
            <Textarea
              id="comentario"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Compartilhe mais detalhes sobre sua experiência..."
              rows={3}
              className="w-full"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || rating === null}
            className="w-full"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Função auxiliar para salvar feedback geral do sistema
const saveGeneralFeedback = async (userId: number, rating: RatingValue, comment: string) => {
  // Armazena o feedback geral no localStorage ou envia para um endpoint específico
  const feedbackData = {
    userId,
    rating,
    comment,
    timestamp: new Date().toISOString(),
    type: 'general' // Indica que é um feedback geral do sistema
  };
  
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ocorrenciaId: 0, // ID 0 indica feedback geral
        userId,
        rating,
        comentario: comment
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar feedback');
    }
    
    return response.json();
  } catch (error) {
    console.error('Erro ao salvar feedback geral:', error);
    // Fallback: salvar no localStorage
    const key = `general_feedback_${userId}`;
    localStorage.setItem(key, JSON.stringify(feedbackData));
    return { success: true, message: 'Feedback salvo localmente' };
  }
};

export default SatisfactionFeedback;