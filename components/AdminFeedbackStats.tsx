'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, ThumbsDown, Meh, TrendingUp, BarChart3 } from 'lucide-react';
import SatisfactionReportGenerator from './SatisfactionReportGenerator';

interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  satisfactionRate: number;
}

const AdminFeedbackStats: React.FC = () => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/feedbacks?admin=true');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar estatísticas');
        }

        setStats(data.stats);
      } catch (err: any) {
        setError(err.message);
        console.error('Erro ao buscar estatísticas de feedback:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Estatísticas de Satisfação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Estatísticas de Satisfação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Erro: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Estatísticas de Satisfação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Nenhuma estatística disponível.</p>
        </CardContent>
      </Card>
    );
  }

  // Função para determinar a cor da badge com base na média de avaliações
  const getRatingColor = (avg: number) => {
    if (avg >= 4) return 'bg-green-100 text-green-800';
    if (avg >= 3) return 'bg-yellow-100 text-yellow-800';
    if (avg >= 2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Estatísticas de Satisfação
          </div>
          <SatisfactionReportGenerator />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{stats.totalFeedbacks}</div>
            <div className="text-sm text-blue-600">Total</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700 flex items-center justify-center gap-1">
              {stats.averageRating.toFixed(1)}
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-sm text-purple-600">Média</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{stats.positiveCount}</div>
            <div className="text-sm text-green-600">Positivos</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{stats.neutralCount}</div>
            <div className="text-sm text-yellow-600">Neutros</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{stats.negativeCount}</div>
            <div className="text-sm text-red-600">Negativos</div>
          </div>
          
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-700">{stats.satisfactionRate}%</div>
            <div className="text-sm text-indigo-600">Satisfação</div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Classificação Média</span>
            <Badge className={getRatingColor(stats.averageRating)}>
              {stats.averageRating >= 4 ? 'Excelente' : 
               stats.averageRating >= 3 ? 'Bom' : 
               stats.averageRating >= 2 ? 'Regular' : 'Ruim'}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, (stats.averageRating / 5) * 100)}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminFeedbackStats;