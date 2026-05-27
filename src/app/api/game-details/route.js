import { NextResponse } from "next/server";
import { fetchGameTechnicalDetails } from "@/lib/gemini-service";

export async function POST(request) {
  try {
    const { gameName, trophies } = await request.json();

    if (!gameName) {
      return NextResponse.json(
        { error: "El campo 'gameName' es obligatorio." },
        { status: 400 }
      );
    }

    const { details, source } = await fetchGameTechnicalDetails(gameName, trophies || []);
    
    return NextResponse.json({
      details,
      source
    });
  } catch (error) {
    console.error("Error en API /api/game-details:", error);
    return NextResponse.json(
      { error: "Error al recuperar especificaciones técnicas del videojuego." },
      { status: 500 }
    );
  }
}
