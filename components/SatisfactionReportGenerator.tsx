'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Download, Calendar, Star, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Feedback {
  id: number;
  ocorrencia_id: number | null;
  user_id: number;
  rating: number;
  comentario: string | null;
  created_at: string;
  usuario_nome?: string;
  usuario_email?: string;
}

interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  satisfactionRate: number;
}

interface ReportData {
  stats: FeedbackStats;
  feedbacks: Feedback[];
  timestamp: string;
}

const SatisfactionReportGenerator: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/feedbacks?admin=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar dados do relatório');
      }

      setReportData({
        stats: data.stats,
        feedbacks: data.feedbacks || [],
        timestamp: new Date().toLocaleString('pt-BR')
      });
    } catch (err: any) {
      console.error('Erro ao buscar dados do relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReportHTML = (): string => {
    if (!reportData) return '';

    const { stats, feedbacks, timestamp } = reportData;

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Satisfação</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 24px;
      color: #2563eb;
      margin: 0;
    }
    .subtitle {
      font-size: 16px;
      color: #666;
      margin: 10px 0 0 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 5px;
    }
    .section-title {
      font-size: 18px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin: 30px 0 15px 0;
    }
    .feedback-list {
      margin: 20px 0;
    }
    .feedback-item {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      background: #fff;
    }
    .feedback-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .feedback-rating {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .feedback-comment {
      background: #f8fafc;
      padding: 10px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
      margin-top: 10px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">Relatório de Satisfação</h1>
    <p class="subtitle">Gerado em: ${timestamp}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.totalFeedbacks}</div>
      <div class="stat-label">Total de Avaliações</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.averageRating.toFixed(1)}★</div>
      <div class="stat-label">Média de Avaliação</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.positiveCount}</div>
      <div class="stat-label">Positivas</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.neutralCount}</div>
      <div class="stat-label">Neutras</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.negativeCount}</div>
      <div class="stat-label">Negativas</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.satisfactionRate}%</div>
      <div class="stat-label">Taxa de Satisfação</div>
    </div>
  </div>

  <h2 class="section-title">Feedbacks Detalhados</h2>
  <div class="feedback-list">
    ${feedbacks.map(feedback => `
      <div class="feedback-item">
        <div class="feedback-header">
          <div class="feedback-rating">
            <span>${getRatingEmoji(feedback.rating)}</span>
            <strong>${getRatingLabel(feedback.rating)}</strong>
            <span style="color: #64748b; font-size: 12px;">
              (Nota: ${feedback.rating}/5)
            </span>
          </div>
          <span style="color: #64748b; font-size: 12px;">
            ${new Date(feedback.created_at).toLocaleString('pt-BR')}
          </span>
        </div>
        ${feedback.comentario ? `
          <div class="feedback-comment">
            <strong>Comentário:</strong> "${feedback.comentario}"
          </div>
        ` : ''}
        <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
          ${feedback.usuario_nome ? `Usuário: ${feedback.usuario_nome}` : 'Usuário: Anônimo'}
          ${feedback.ocorrencia_id ? ` | Ocorrência: #${feedback.ocorrencia_id}` : ''}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    Relatório gerado automaticamente pelo Sistema de Ocorrências
  </div>
</body>
</html>`;
  };

  const getRatingEmoji = (rating: number): string => {
    switch (rating) {
      case 1: return '😡';
      case 2: return '😞';
      case 3: return '😐';
      case 4: return '😊';
      case 5: return '😍';
      default: return '❓';
    }
  };

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1: return 'Muito Insatisfeito';
      case 2: return 'Insatisfeito';
      case 3: return 'Neutro';
      case 4: return 'Satisfeito';
      case 5: return 'Muito Satisfeito';
      default: return 'Sem Avaliação';
    }
  };

  const printReport = () => {
    if (!reportData) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReportHTML());
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const blob = new Blob([generateReportHTML()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-satisfacao-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchReportData();
    } else {
      setReportData(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório de Satisfação</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Estatísticas Gerais</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={downloadReport}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                  <Button 
                    onClick={printReport}
                    size="sm"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-700">{reportData.stats.totalFeedbacks}</div>
                  <div className="text-xs text-blue-600">Total</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-700 flex items-center justify-center gap-1">
                    {reportData.stats.averageRating.toFixed(1)}
                    <Star className="h-3 w-3 text-yellow-500" />
                  </div>
                  <div className="text-xs text-purple-600">Média</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-700">{reportData.stats.positiveCount}</div>
                  <div className="text-xs text-green-600">Positivos</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-xl font-bold text-yellow-700">{reportData.stats.neutralCount}</div>
                  <div className="text-xs text-yellow-600">Neutros</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-700">{reportData.stats.negativeCount}</div>
                  <div className="text-xs text-red-600">Negativos</div>
                </div>
                
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-xl font-bold text-indigo-700">{reportData.stats.satisfactionRate}%</div>
                  <div className="text-xs text-indigo-600">Satisfação</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Feedbacks Detalhados</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {reportData.feedbacks.map((feedback) => (
                  <Card key={feedback.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {feedback.rating === 1 ? '😡' :
                             feedback.rating === 2 ? '😞' :
                             feedback.rating === 3 ? '😐' :
                             feedback.rating === 4 ? '😊' : '😍'}
                          </span>
                          <span className="font-medium">
                            {feedback.rating === 1 ? 'Muito Insatisfeito' :
                             feedback.rating === 2 ? 'Insatisfeito' :
                             feedback.rating === 3 ? 'Neutro' :
                             feedback.rating === 4 ? 'Satisfeito' : 'Muito Satisfeito'}
                          </span>
                          <span className="text-sm text-gray-500">({feedback.rating}/5)</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(feedback.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {feedback.comentario && (
                        <div className="mt-2 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                          <p className="text-gray-700">"{feedback.comentario}"</p>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        {feedback.usuario_nome ? `Usuário: ${feedback.usuario_nome}` : 'Usuário: Anônimo'}
                        {feedback.ocorrencia_id && ` | Ocorrência: #${feedback.ocorrencia_id}`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Relatório gerado em: {reportData.timestamp}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Nenhum dado disponível para gerar o relatório.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SatisfactionReportGenerator;