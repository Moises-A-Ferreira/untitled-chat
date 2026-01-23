import { NextResponse } from "next/server";

/**
 * Endpoint para testar padrões regex de ruas
 * GET /api/test-address-pattern?address=Rua%20Principal%20150
 */
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
    // Importar a função de busca
    const { findPreciseLocation } = await import("@/lib/precise-geocoding");
    const result = findPreciseLocation(address);

    return NextResponse.json({
      input: address,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint para testar múltiplos endereços
 * POST /api/test-address-pattern
 * Body: { addresses: ["Rua Principal 150", "Brasil 200", ...] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { addresses } = body;

    if (!Array.isArray(addresses)) {
      return NextResponse.json(
        { error: "Body deve conter 'addresses' como array" },
        { status: 400 }
      );
    }

    const { findPreciseLocation } = await import("@/lib/precise-geocoding");
    const results = addresses.map(address => ({
      input: address,
      result: findPreciseLocation(address)
    }));

    return NextResponse.json({
      totalTested: addresses.length,
      successCount: results.filter(r => r.result.success).length,
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
