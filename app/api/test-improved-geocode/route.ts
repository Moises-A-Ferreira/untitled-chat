import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocoding-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Parâmetro 'address' é obrigatório" },
      { status: 400 }
    );
  }

  try {
    console.log(`Testando busca aprimorada para: ${address}`);
    
    const result = await geocodeAddress(address);
    
    return NextResponse.json({
      input: address,
      result: result,
      timestamp: new Date().toISOString(),
      improvements: {
        normalization: "Texto normalizado automaticamente (acentos, maiúsculas, espaços)",
        errorTolerance: "Tolerância a erros implementada (variações automáticas)",
        betterParameters: "Parâmetros Nominatim otimizados (limit, addressdetails, countrycodes=br)",
        closestMatch: "Retorno do resultado mais próximo quando não há correspondência exata",
        suggestions: "Sugestões úteis quando endereço não é encontrado"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}