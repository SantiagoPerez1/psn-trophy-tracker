import { NextResponse } from "next/server";
import { generateTrophyRoadmap } from "@/lib/gemini-service";

export async function POST(request) {
  try {
    const body = await request.json();
    const { gameName, pendingTrophies } = body;

    if (!gameName || !pendingTrophies || !Array.isArray(pendingTrophies)) {
      return NextResponse.json(
        { error: "Los campos 'gameName' y 'pendingTrophies' (array) son obligatorios." },
        { status: 400 }
      );
    }

    const result = await generateTrophyRoadmap(gameName, pendingTrophies);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en API /api/roadmap:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al generar la ruta al platino." },
      { status: 500 }
    );
  }
}
