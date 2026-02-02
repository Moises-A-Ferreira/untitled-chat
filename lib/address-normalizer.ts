/**
 * Funções utilitárias para normalização de endereços e busca inteligente
 */

/**
 * Remove acentos e caracteres especiais de uma string
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza texto para busca: remove acentos, maiúsculas, espaços extras
 */
export function normalizeText(text: string): string {
  return removeAccents(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
    .replace(/[^\w\s]/g, ''); // Remove pontuação exceto letras/números/espaços
}

/**
 * Remove números do texto
 */
export function removeNumbers(text: string): string {
  return text.replace(/\d+/g, '').trim();
}

/**
 * Remove vírgulas e outros separadores
 */
export function removeSeparators(text: string): string {
  return text.replace(/[,;]/g, ' ').trim();
}

/**
 * Extrai apenas a parte da rua do endereço
 */
export function extractStreet(text: string): string {
  // Remove números, complementos e palavras irrelevantes
  return text
    .replace(/\d+/g, '') // Remove números
    .replace(/(rua|avenida|alameda|travessa|praça|pça)\s+/gi, '') // Remove prefixos
    .replace(/(apto|bloco|casa|lote|quadra).*$/gi, '') // Remove complementos
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Gera variações de busca para tolerância a erros
 */
export function generateSearchVariations(address: string): string[] {
  const variations: string[] = [];
  const normalized = normalizeText(address);
  
  // Variação original normalizada
  variations.push(normalized);
  
  // Sem números
  const noNumbers = removeNumbers(normalized);
  if (noNumbers !== normalized) {
    variations.push(noNumbers);
  }
  
  // Apenas a rua
  const streetOnly = extractStreet(normalized);
  if (streetOnly && streetOnly !== normalized && streetOnly !== noNumbers) {
    variations.push(streetOnly);
  }
  
  // Com contexto de São Manuel
  variations.push(`${normalized}, são manuel`);
  variations.push(`${normalized}, são manuel, sp`);
  variations.push(`${normalized}, são manuel, são paulo`);
  
  // Com contexto mais amplo do Brasil
  variations.push(`${normalized}, brasil`);
  
  return [...new Set(variations)]; // Remove duplicatas
}

/**
 * Filtra resultados para remover duplicatas próximas
 */
export function deduplicateResults(results: any[], threshold = 0.001): any[] {
  const filtered: any[] = [];
  
  for (const result of results) {
    const isDuplicate = filtered.some(existing => 
      Math.abs(existing.lat - result.lat) < threshold &&
      Math.abs(existing.lng - result.lng) < threshold
    );
    
    if (!isDuplicate) {
      filtered.push(result);
    }
  }
  
  return filtered;
}

/**
 * Ordena resultados por relevância (primeiro os mais específicos)
 */
export function sortResultsByRelevance(results: any[]): any[] {
  return results.sort((a, b) => {
    // Prioriza resultados com número de casa
    const aHasNumber = /\d+/.test(a.displayName || a.address || '');
    const bHasNumber = /\d+/.test(b.displayName || b.address || '');
    
    if (aHasNumber && !bHasNumber) return -1;
    if (!aHasNumber && bHasNumber) return 1;
    
    // Prioriza resultados mais próximos de São Manuel
    const aIsSaoManuel = (a.address?.city || a.displayName || '').toLowerCase().includes('são manuel');
    const bIsSaoManuel = (b.address?.city || b.displayName || '').toLowerCase().includes('são manuel');
    
    if (aIsSaoManuel && !bIsSaoManuel) return -1;
    if (!aIsSaoManuel && bIsSaoManuel) return 1;
    
    return 0;
  });
}

/**
 * Encontra o resultado mais próximo quando não há correspondência exata
 */
export function findClosestMatch(query: string, results: any[]): any | null {
  if (results.length === 0) return null;
  
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(' ').filter(word => word.length > 2);
  
  if (queryWords.length === 0) return results[0];
  
  // Pontuar resultados pela similaridade
  const scoredResults = results.map(result => {
    const displayName = normalizeText(result.displayName || result.address || '');
    let score = 0;
    
    // Pontuação por palavras correspondentes
    queryWords.forEach(word => {
      if (displayName.includes(word)) {
        score += 1;
      }
    });
    
    // Bônus por estar em São Manuel
    if (displayName.includes('são manuel')) {
      score += 2;
    }
    
    // Penalidade por distância (se tiver coordenadas)
    if (result.lat && result.lng) {
      const distanceFromCenter = Math.sqrt(
        Math.pow(result.lat - (-22.7311), 2) + 
        Math.pow(result.lng - (-48.5706), 2)
      );
      score -= distanceFromCenter * 10; // Penaliza resultados muito distantes
    }
    
    return { ...result, score };
  });
  
  // Retorna o resultado com maior pontuação
  const bestMatch = scoredResults.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  return bestMatch.score > 0 ? bestMatch : results[0];
}