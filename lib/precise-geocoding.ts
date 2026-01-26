// Banco de dados expandido de endereços de São Manuel com coordenadas precisas
interface AddressPattern {
  pattern: RegExp;
  street: string;
  start?: { number: number; lat: number; lng: number };
  end?: { number: number; lat: number; lng: number };
  fixed?: { lat: number; lng: number };
  neighborhood: string;
  city: string;
}

// Função auxiliar para processar matches de endereço
function processAddressMatch(addressPattern: AddressPattern, match: RegExpMatchArray, input: string) {
  // Se tem número (endereço com numeração)
  if (match.length >= 2 && !isNaN(parseInt(match[match.length - 1]))) {
    const houseNumber = parseInt(match[match.length - 1]);
    
    // Verificar se tem start e end definidos
    if (addressPattern.start && addressPattern.end) {
      const totalRange = addressPattern.end.number - addressPattern.start.number;
      const clampedNumber = Math.min(
        Math.max(houseNumber, addressPattern.start.number),
        addressPattern.end.number
      );
      const positionRatio = (clampedNumber - addressPattern.start.number) / totalRange;

      const lat = addressPattern.start.lat + 
                 (addressPattern.end.lat - addressPattern.start.lat) * positionRatio;
      const lng = addressPattern.start.lng + 
                 (addressPattern.end.lng - addressPattern.start.lng) * positionRatio;

      const inRange = houseNumber >= addressPattern.start.number && houseNumber <= addressPattern.end.number;
      const precision = inRange ? "high" : "medium";
      const method = inRange ? "interpolation" : "clamped_range";

      return {
        success: true,
        found: true,
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        coordinates: { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) },
        address: `${addressPattern.street}, ${houseNumber}`,
        neighborhood: addressPattern.neighborhood,
        city: addressPattern.city,
        precision,
        method,
        needsFallback: false
      };
    }
  }
  // Se é ponto fixo (sem número)
  else if (addressPattern.fixed) {
    return {
      success: true,
      found: true,
      lat: addressPattern.fixed.lat,
      lng: addressPattern.fixed.lng,
      coordinates: { lat: addressPattern.fixed.lat, lng: addressPattern.fixed.lng },
      address: addressPattern.street,
      neighborhood: addressPattern.neighborhood,
      city: addressPattern.city,
      precision: "medium", // Média precisão (local conhecido)
      method: "fixed_point",
      needsFallback: false
    };
  }
  
  return null;
}

export const saoManuelAddresses: AddressPattern[] = [
  // Rua Principal (Avenida Brasil) - Centro
  { 
    pattern: /^rua\s+principal\s+(\d+)$/i, 
    street: "Rua Principal",
    start: { number: 1, lat: -22.7325, lng: -48.5725 },
    end: { number: 2000, lat: -22.7295, lng: -48.5685 },
    neighborhood: "Centro",
    city: "São Manuel"
  },
  
  // Variação sem "rua"
  { 
    pattern: /^principal\s+(\d+)$/i, 
    street: "Rua Principal",
    start: { number: 1, lat: -22.7325, lng: -48.5725 },
    end: { number: 2000, lat: -22.7295, lng: -48.5685 },
    neighborhood: "Centro",
    city: "São Manuel"
  },
  
  { 
    pattern: /^(avenida|av\.?)\s+brasil\s+(\d+)$/i, 
    street: "Avenida Brasil",
    start: { number: 1, lat: -22.7325, lng: -48.5725 },
    end: { number: 2000, lat: -22.7295, lng: -48.5685 },
    neighborhood: "Centro",
    city: "São Manuel"
  },
  
  // Variação sem "avenida"
  { 
    pattern: /^brasil\s+(\d+)$/i, 
    street: "Avenida Brasil",
    start: { number: 1, lat: -22.7325, lng: -48.5725 },
    end: { number: 2000, lat: -22.7295, lng: -48.5685 },
    neighborhood: "Centro",
    city: "São Manuel"
  },

  // Rua Quinze de Novembro
  { 
    pattern: /^(rua\s+)?(quinze|15)(\s+de\s+novembro)?\s+(\d+)$/i, 
    street: "Rua Quinze de Novembro",
    start: { number: 1, lat: -22.7320, lng: -48.5715 },
    end: { number: 800, lat: -22.7300, lng: -48.5695 },
    neighborhood: "Centro",
    city: "São Manuel"
  },

  // Rua Coronel (importante)
  { 
    pattern: /^rua\s+coronel\s+(\d+)$/i, 
    street: "Rua Coronel",
    start: { number: 1, lat: -22.7330, lng: -48.5710 },
    end: { number: 1000, lat: -22.7290, lng: -48.5670 },
    neighborhood: "Centro",
    city: "São Manuel"
  },
  
  // Variação sem "rua"
  { 
    pattern: /^coronel\s+(\d+)$/i, 
    street: "Rua Coronel",
    start: { number: 1, lat: -22.7330, lng: -48.5710 },
    end: { number: 1000, lat: -22.7290, lng: -48.5670 },
    neighborhood: "Centro",
    city: "São Manuel"
  },

  // Jardim São Paulo
  { 
    pattern: /^rua\s+s(ã|a)o\s+paulo\s+(\d+)$/i, 
    street: "Rua São Paulo",
    start: { number: 1, lat: -22.7355, lng: -48.5745 },
    end: { number: 800, lat: -22.7325, lng: -48.5705 },
    neighborhood: "Jardim São Paulo",
    city: "São Manuel"
  },
  
  // Variação sem "rua"
  { 
    pattern: /^s(ã|a)o\s+paulo\s+(\d+)$/i, 
    street: "Rua São Paulo",
    start: { number: 1, lat: -22.7355, lng: -48.5745 },
    end: { number: 800, lat: -22.7325, lng: -48.5705 },
    neighborhood: "Jardim São Paulo",
    city: "São Manuel"
  },

  // Vila Nova
  { 
    pattern: /^rua\s+vila\s+nova\s+(\d+)$/i, 
    street: "Rua Vila Nova",
    start: { number: 1, lat: -22.7295, lng: -48.5695 },
    end: { number: 600, lat: -22.7265, lng: -48.5655 },
    neighborhood: "Vila Nova",
    city: "São Manuel"
  },
  
  // Variação sem "rua"
  { 
    pattern: /^vila\s+nova\s+(\d+)$/i, 
    street: "Rua Vila Nova",
    start: { number: 1, lat: -22.7295, lng: -48.5695 },
    end: { number: 600, lat: -22.7265, lng: -48.5655 },
    neighborhood: "Vila Nova",
    city: "São Manuel"
  },

  // Residencial Bela Vista
  { 
    pattern: /^rua\s+bela\s+vista\s+(\d+)$/i, 
    street: "Rua Bela Vista",
    start: { number: 1, lat: -22.7370, lng: -48.5755 },
    end: { number: 600, lat: -22.7340, lng: -48.5715 },
    neighborhood: "Residencial Bela Vista",
    city: "São Manuel"
  },
  
  // Variação sem "rua"
  { 
    pattern: /^bela\s+vista\s+(\d+)$/i, 
    street: "Rua Bela Vista",
    start: { number: 1, lat: -22.7370, lng: -48.5755 },
    end: { number: 600, lat: -22.7340, lng: -48.5715 },
    neighborhood: "Residencial Bela Vista",
    city: "São Manuel"
  },

  // Parque das Nações
  { 
    pattern: /^rua\s+(das\s+)?na(ç|c)(õ|o)es\s+(\d+)$/i, 
    street: "Rua das Nações",
    start: { number: 1, lat: -22.7280, lng: -48.5680 },
    end: { number: 500, lat: -22.7250, lng: -48.5640 },
    neighborhood: "Parque das Nações",
    city: "São Manuel"
  },
  
  // Variação sem "rua"
  { 
    pattern: /^(das\s+)?na(ç|c)(õ|o)es\s+(\d+)$/i, 
    street: "Rua das Nações",
    start: { number: 1, lat: -22.7280, lng: -48.5680 },
    end: { number: 500, lat: -22.7250, lng: -48.5640 },
    neighborhood: "Parque das Nações",
    city: "São Manuel"
  },

  // Jardim América
  { 
    pattern: /^rua\s+am(é|e)rica\s+(\d+)$/i, 
    street: "Rua América",
    start: { number: 1, lat: -22.7355, lng: -48.5705 },
    end: { number: 600, lat: -22.7325, lng: -48.5665 },
    neighborhood: "Jardim América",
    city: "São Manuel"
  },
  
  // Variação sem "rua"
  { 
    pattern: /^am(é|e)rica\s+(\d+)$/i, 
    street: "Rua América",
    start: { number: 1, lat: -22.7355, lng: -48.5705 },
    end: { number: 600, lat: -22.7325, lng: -48.5665 },
    neighborhood: "Jardim América",
    city: "São Manuel"
  },

  // Rua Plinio Aristides Targa
  { 
    pattern: /^rua\s+plinio\s+aristides\s+targa\s+(\d+)$/i, 
    street: "Rua Plinio Aristides Targa",
    start: { number: 1, lat: -22.7500, lng: -48.5744 },
    end: { number: 800, lat: -22.7440, lng: -48.5680 },
    neighborhood: "Centro",
    city: "São Manuel"
  },
  
  // Variações sem "rua"
  { 
    pattern: /^plinio\s+aristides\s+targa\s+(\d+)$/i, 
    street: "Rua Plinio Aristides Targa",
    start: { number: 1, lat: -22.7500, lng: -48.5744 },
    end: { number: 800, lat: -22.7440, lng: -48.5680 },
    neighborhood: "Centro",
    city: "São Manuel"
  },
  
  { 
    pattern: /^plinio\s+targa\s+(\d+)$/i, 
    street: "Rua Plinio Aristides Targa",
    start: { number: 1, lat: -22.7500, lng: -48.5744 },
    end: { number: 800, lat: -22.7440, lng: -48.5680 },
    neighborhood: "Centro",
    city: "São Manuel"
  },
  
  // Variações com possíveis erros de digitação
  { 
    pattern: /^pl[ií]nio\s+aristides\s+targa\s+(\d+)$/i, 
    street: "Rua Plinio Aristides Targa",
    start: { number: 1, lat: -22.7500, lng: -48.5744 },
    end: { number: 800, lat: -22.7440, lng: -48.5680 },
    neighborhood: "Centro",
    city: "São Manuel"
  },
  
  // Erro comum: "Artistides" (com "ti")
  { 
    pattern: /^pl[ií]nio\s+artistides\s+targa\s+(\d+)$/i, 
    street: "Rua Plinio Aristides Targa",
    start: { number: 1, lat: -22.7500, lng: -48.5744 },
    end: { number: 800, lat: -22.7440, lng: -48.5680 },
    neighborhood: "Centro",
    city: "São Manuel"
  },

  // Pontos de interesse (sem números)
  { 
    pattern: /^pra(ç|c)a\s+(da\s+)?matriz$/i, 
    street: "Praça da Matriz",
    fixed: { lat: -22.7318, lng: -48.5703 },
    neighborhood: "Centro",
    city: "São Manuel"
  },

  { 
    pattern: /^(centro|pra(ç|c)a)$/i, 
    street: "Centro",
    fixed: { lat: -22.7311, lng: -48.5706 },
    neighborhood: "Centro",
    city: "São Manuel"
  },

  { 
    pattern: /^(hospital|ubs|sa(ú|u)de)$/i, 
    street: "Hospital Municipal",
    fixed: { lat: -22.7325, lng: -48.5710 },
    neighborhood: "Centro",
    city: "São Manuel"
  },

  { 
    pattern: /^(escola|col(é|e)gio)$/i, 
    street: "Escola Municipal",
    fixed: { lat: -22.7305, lng: -48.5708 },
    neighborhood: "Centro",
    city: "São Manuel"
  }
];

/**
 * Encontra endereço e calcula coordenadas precisas
 * @param input Texto do endereço (ex: "Rua Principal 150" ou "Principal 150" ou "Principal, 150")
 * @returns Objeto com coordenadas ou null se não encontrado
 */
export function findPreciseLocation(input: string) {
  // Normalizar input: remover acentos, vírgulas, normalizar espaços
  const normalizedInput = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/,/g, ' ') // Remove vírgulas
    .replace(/\s+/g, ' '); // Normaliza espaços múltiplos
  
  console.log('Procurando localização para:', normalizedInput);
  
  // Primeiro tenta matching exato
  for (const addressPattern of saoManuelAddresses) {
    const match = normalizedInput.match(addressPattern.pattern);
    
    if (match) {
      console.log('Pattern match exato encontrado:', addressPattern.street, match);
      return processAddressMatch(addressPattern, match, normalizedInput);
    }
  }
  
  // Se não encontrou, tenta matching parcial (ruas longas)
  console.log('Tentando matching parcial para ruas longas...');
  const partialResults = [];
  
  for (const addressPattern of saoManuelAddresses) {
    // Extrair nome da rua do pattern
    const streetName = addressPattern.street
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/^r\.\s*/i, '') // Remove "R. " no início
      .replace(/^rua\s*/i, '') // Remove "Rua " no início
      .trim();
    
    // Verificar se parte significativa da rua está no input
    const words = streetName.split(' ');
    const mainWords = words.filter(word => word.length > 3); // Palavras maiores que 3 letras
    
    let matchCount = 0;
    for (const word of mainWords) {
      if (normalizedInput.includes(word)) {
        matchCount++;
      }
    }
    
    // Para ruas com mesmo prefixo (ex: várias "Coronel"), exigir matching mais rigoroso
    // Requer pelo menos 75% das palavras principais OU todas as palavras se forem poucas
    const minConfidence = mainWords.length <= 2 ? 1.0 : 0.75;
    
    if (mainWords.length > 0 && matchCount / mainWords.length >= minConfidence) {
      console.log(`Matching parcial encontrado: ${addressPattern.street} (${matchCount}/${mainWords.length} palavras)`);
      
      // Extrair número do input
      const numberMatch = normalizedInput.match(/\d+/);
      if (numberMatch) {
        const houseNumber = parseInt(numberMatch[0]);
        partialResults.push({
          pattern: addressPattern,
          houseNumber,
          confidence: matchCount / mainWords.length
        });
      } else {
        // Sem número, usar ponto fixo
        partialResults.push({
          pattern: addressPattern,
          houseNumber: null,
          confidence: matchCount / mainWords.length
        });
      }
    }
  }
  
  // Usar o resultado com maior confiança e maior especificidade
  if (partialResults.length > 0) {
    partialResults.sort((a, b) => {
      // Primeiro ordenar por confiança (decrescente)
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      // Em caso de empate, priorizar ruas com nomes mais longos (mais específicas)
      const aWordCount = a.pattern.street.split(' ').length;
      const bWordCount = b.pattern.street.split(' ').length;
      return bWordCount - aWordCount;
    });
    const bestMatch = partialResults[0];
    
    console.log(`Usando matching parcial com confiança ${(bestMatch.confidence * 100).toFixed(1)}%`);
    
    if (bestMatch.houseNumber !== null) {
      // Criar match simulado para reutilizar lógica existente
      const simulatedMatch: RegExpMatchArray = ['', bestMatch.houseNumber.toString()] as unknown as RegExpMatchArray;
      return processAddressMatch(bestMatch.pattern, simulatedMatch, normalizedInput);
    } else if (bestMatch.pattern.fixed) {
      return {
        success: true,
        found: true,
        lat: bestMatch.pattern.fixed.lat,
        lng: bestMatch.pattern.fixed.lng,
        coordinates: { lat: bestMatch.pattern.fixed.lat, lng: bestMatch.pattern.fixed.lng },
        address: bestMatch.pattern.street,
        neighborhood: bestMatch.pattern.neighborhood,
        city: bestMatch.pattern.city,
        precision: "medium",
        method: "partial_match_fixed",
        needsFallback: false
      };
    }
  }
  
  console.log('Nenhum pattern correspondente encontrado no banco local');
  
  // Não encontrou no banco local, retorna com fallback sugerindo API externa
  return {
    success: false,
    found: false,
    lat: undefined,
    lng: undefined,
    coordinates: undefined,
    error: "Endereço não encontrado no banco de dados local. Será feita busca na API externa (OpenStreetMap).",
    precision: "low",
    needsFallback: true
  };
}

/**
 * Função principal de geocodificação híbrida
 * @param address Endereço para geocodificar
 * @returns Promise com resultado
 */
export async function hybridGeocode(address: string) {
  console.log(`Geocoding: ${address}`);
  
  // Primeiro tenta sistema local preciso
  const localResult = findPreciseLocation(address);
  
  if (localResult && localResult.success) {
    console.log(`Local geocoding success: ${localResult.lat}, ${localResult.lng}`);
    return localResult;
  }
  
  // Se falhar, tenta API externa (implementar depois)
  console.log("Falling back to external API...");
  
  return {
    success: false,
    error: "Sistema local não encontrou o endereço. API externa não configurada.",
    precision: "none"
  };
}