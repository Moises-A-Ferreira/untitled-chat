import { NextResponse } from "next/server";
import { findPreciseLocation } from "@/lib/precise-geocoding";

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
    const result = findPreciseLocation(address);
    return NextResponse.json({
      input: address,
      result: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
